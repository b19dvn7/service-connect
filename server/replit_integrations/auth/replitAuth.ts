import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, Request, RequestHandler } from "express";
import { timingSafeEqual } from "crypto";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      profileImageUrl?: string | null;
      createdAt?: Date;
      updatedAt?: Date;
    };
  }
}

/**
 * This project was originally wired for Replit OIDC.
 * On non-Replit hosts (e.g., Railway), REPL_ID will not exist.
 *
 * When AUTH_DISABLED is set (or REPL_ID is missing), we:
 * - keep sessions enabled (DB-backed if DATABASE_URL exists)
 * - disable Replit OIDC routes to avoid 401/login loops
 * - allow the app to run end-to-end without auth
 *
 * If SIMPLE_AUTH_USER/SIMPLE_AUTH_PASS are set, we enable local auth instead.
 */
export const SIMPLE_AUTH_ENABLED =
  !!process.env.SIMPLE_AUTH_USER && !!process.env.SIMPLE_AUTH_PASS;

export const AUTH_DISABLED =
  process.env.AUTH_DISABLED === "1" ||
  process.env.AUTH_DISABLED === "true" ||
  (!process.env.REPL_ID && !SIMPLE_AUTH_ENABLED);

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function wantsJson(req: Request) {
  const accept = req.get("accept") || "";
  return req.is("application/json") || accept.includes("application/json");
}

function renderLoginPage(error?: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sign in</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#0f172a; color:#e2e8f0; margin:0; }
      .wrap { min-height: 100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
      .card { width:100%; max-width:360px; background:#111827; border:1px solid #1f2937; border-radius:12px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.35); }
      h1 { font-size:20px; margin:0 0 12px; }
      label { display:block; font-size:12px; margin:10px 0 6px; color:#94a3b8; }
      input { width:100%; padding:10px 12px; border-radius:8px; border:1px solid #334155; background:#0b1220; color:#e2e8f0; }
      button { margin-top:14px; width:100%; padding:10px 12px; border-radius:8px; border:0; background:#f97316; color:#0f172a; font-weight:700; cursor:pointer; }
      .error { margin:8px 0 0; color:#fca5a5; font-size:12px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <form class="card" method="post" action="/api/login">
        <h1>Sign in</h1>
        ${error ? `<div class="error">${error}</div>` : ""}
        <label for="username">Username</label>
        <input id="username" name="username" autocomplete="username" required />
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required />
        <button type="submit">Sign in</button>
      </form>
    </div>
  </body>
</html>`;
}

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

  // Simple local auth (username + password from env).
  if (SIMPLE_AUTH_ENABLED) {
    app.get("/api/login", (req, res) => {
      if (wantsJson(req)) {
        return res.status(401).json({ message: "Login required" });
      }
      res.setHeader("content-type", "text/html; charset=utf-8");
      return res.send(renderLoginPage(req.query.error ? "Invalid credentials" : undefined));
    });

    app.post("/api/login", (req, res) => {
      const username = String(req.body?.username ?? "");
      const password = String(req.body?.password ?? "");

      const expectedUser = process.env.SIMPLE_AUTH_USER || "";
      const expectedPass = process.env.SIMPLE_AUTH_PASS || "";

      const ok = safeEqual(username, expectedUser) && safeEqual(password, expectedPass);
      if (!ok) {
        if (wantsJson(req)) {
          return res.status(401).json({ message: "Invalid credentials" });
        }
        return res.redirect("/api/login?error=1");
      }

      req.session.user = {
        id: "local-admin",
        username,
        email: null,
        firstName: "Local",
        lastName: "Admin",
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (wantsJson(req)) {
        return res.json({ ok: true, user: req.session.user });
      }
      return res.redirect("/");
    });

    app.get("/api/logout", (req: Request, res) => {
      req.session.destroy(() => {
        res.redirect("/");
      });
    });

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
        verify
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
      scope: ["openid", "email", "profile", "offline_access"],
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

  if (SIMPLE_AUTH_ENABLED) {
    if (req.session?.user) return next();
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;
  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) return next();

  // Token refresh can be implemented here if needed.
  return res.status(401).json({ message: "Unauthorized" });
};
