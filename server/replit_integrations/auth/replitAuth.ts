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
export const AUTH_DISABLED = true;

export function getSession() {
  const PgSession = connectPg(session);
  const hasDb = !!process.env.DATABASE_URL;

  return session({
    secret: process.env.SESSION_SECRET || "heavy-duty-ops-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
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

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Direct login bypass for development
  app.get("/api/login", (req, res) => {
    (req.session as any).user = { id: "admin", role: "admin" };
    res.redirect("/dashboard");
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if ((req.session as any).user) return next();
  res.status(401).json({ message: "Unauthorized" });
};
