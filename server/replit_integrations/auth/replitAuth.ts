import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, Request, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

/**
 * This project was originally wired for Replit OIDC.
 * On non-Replit hosts (e.g., Railway), REPL_ID will not exist.
 *
 * When AUTH_DISABLED is set (or REPL_ID is missing), we:
 * - keep sessions enabled (DB-backed if DATABASE_URL exists)
 * - disable Replit OIDC routes to avoid 401/login loops
 * - allow the app to run end-to-end without auth
 */
export const AUTH_DISABLED =
  process.env.AUTH_DISABLED === "1" ||
  process.env.AUTH_DISABLED === "true" ||
  !process.env.REPL_ID;

const getOidcConfig = memoize(
  async () => {
    // If auth is disabled, this should never be called.
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const PgSession = connectPg(session);

  const hasDb = !!process.env.DATABASE_URL;

  return session({
    secret: process.env.SESSION_SECRET || "dev-insecure-session-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      // Behind Railway/Replit proxies. trust proxy is set in setupAuth.
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
    ...(hasDb
      ? {
          store: new PgSession({
            conString: process.env.DATABASE_URL,
            createTableIfMissing: true,
          }),
        }
      : {}),
  });
}

function updateUserSession(user: any, tokens: any) {
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = tokens.expires_at;
}

async function upsertUser(claims: any) {
  await authStorage.upsertUser(claims);
}

const registeredStrategies = new Set<string>();

export async function setupAuth(app: Express) {
  // Required when behind proxies (Replit/Railway) so secure cookies behave.
  app.set("trust proxy", 1);

  // Always enable sessions (DB-backed if DATABASE_URL exists).
  app.use(getSession());

  // Fail-open mode for Railway/local without Replit OIDC.
  if (AUTH_DISABLED) {
    // Prevent frontend login loops.
    app.get("/api/login", (_req, res) => res.redirect("/"));
    app.get("/api/logout", (_req, res) => res.redirect("/"));
    return;
  }

  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user: any = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  function ensureStrategyWithConfig(domain: string) {
    const strategyName = `replitauth:${domain}`;
    if (registeredStrategies.has(strategyName)) return;

    passport.use(
      strategyName,
      new Strategy(
        {
          client: config,
          params: {
            redirect_uri: `https://${domain}/api/callback`,
          },
        },
        async (tokens: any, verified: any) => {
          try {
            const user: any = {};
            updateUserSession(user, tokens);
            await upsertUser(tokens.claims());
            verified(null, user);
          } catch (err) {
            verified(err);
          }
        }
      )
    );

    registeredStrategies.add(strategyName);
  }

  passport.serializeUser((user: any, done) => done(null, user));
  passport.deserializeUser((user: any, done) => done(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategyWithConfig(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategyWithConfig(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req: Request, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (AUTH_DISABLED) return next();

  const user = req.user as any;
  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) return next();

  // Token refresh can be implemented here if needed.
  return res.status(401).json({ message: "Unauthorized" });
};
