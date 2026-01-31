import type { Express } from "express";
import { authStorage } from "./storage";
import { AUTH_DISABLED, SIMPLE_AUTH_ENABLED, isAuthenticated } from "./replitAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    if (AUTH_DISABLED) {
      return res.json({
        id: "local-admin",
        email: "local@admin",
        firstName: "Local",
        lastName: "Admin",
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    if (SIMPLE_AUTH_ENABLED) {
      const sessionUser = req.session?.user;
      return res.json(sessionUser ?? null);
    }
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
