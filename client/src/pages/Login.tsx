import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const search = typeof window !== "undefined" ? window.location.search : "";
  const next = new URLSearchParams(search).get("next") || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      setLocation(next);
    }
  }, [isAuthenticated, next, setLocation]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const message = (await response.json().catch(() => null))?.message;
        throw new Error(message || "Login failed");
      }

      setLocation(next);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Lock className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.4em] font-semibold">Admin Access</span>
            </div>
            <h1 className="text-2xl font-bold uppercase font-display tracking-tight">Sign In</h1>
            <p className="text-sm text-muted-foreground">
              Use your admin credentials to access the dashboard.
            </p>
          </div>

          <Card className="bg-card/80 backdrop-blur border-white/10">
            <CardHeader>
              <CardTitle className="text-base uppercase tracking-widest font-display">Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="uppercase text-[10px] font-bold tracking-widest text-foreground/70">
                    Username
                  </Label>
                  <Input
                    id="username"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="bg-background/40 border-white/10"
                    placeholder="admin"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="uppercase text-[10px] font-bold tracking-widest text-foreground/70">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="bg-background/40 border-white/10"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 font-bold uppercase tracking-wider"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="text-center text-xs text-muted-foreground">
                Using a different provider?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    window.location.href = "/api/login";
                  }}
                >
                  Continue with provider login
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button variant="ghost" onClick={() => setLocation("/")}>
              Back to Home
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
