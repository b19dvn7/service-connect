import { Link, useLocation } from "wouter";
import { RefreshCw, Shield, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import SpriteClock from "./SpriteClock";
import { useAuth } from "@/hooks/use-auth";
import { getLoginPath } from "@/lib/auth-utils";

/** Two-tone spinning arrows: top arrow = primary (orange), bottom arrow = white */
function TwoToneRefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Top arrow — primary colour (inherits currentColor) */}
      <path stroke="currentColor" d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path stroke="currentColor" d="M21 3v5h-5" />
      {/* Bottom arrow — white */}
      <path stroke="white" d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path stroke="white" d="M8 16H3v5" />
    </svg>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const loginPath = getLoginPath();
  const links = [
    { href: "/", label: "Home" },
    { href: "/submit", label: "New Request" },
  ];

  const adminHref =
    isAuthenticated
      ? "/dashboard"
      : loginPath === "/login"
        ? "/login?next=/dashboard"
        : "/api/login";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-visible">
      <div className="container mx-auto px-4 overflow-visible">

        {/* ── MOBILE ROW ── */}
        <div className="md:hidden flex items-center gap-2 min-h-14 py-1">

          {/* Two-tone spinning icon — links to home */}
          <Link href="/" className="shrink-0 text-primary animate-spin-slow">
            <TwoToneRefreshIcon />
          </Link>

          {/* Clock — centered, fills available space */}
          <div className="flex-1 flex items-center justify-center leading-none overflow-visible min-w-0">
            <SpriteClock />
          </div>

          {/* Admin link — intentionally dim, customers won't notice */}
          <Link href={adminHref} className="shrink-0">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/30 hover:text-muted-foreground/70 transition-colors">
              Admin
            </span>
          </Link>

          {/* Hamburger — Home / New Request */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-l border-white/10 w-[80%]">
              <div className="flex flex-col gap-6 mt-10">
                {links.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div
                      className={cn(
                        "text-xl font-display font-bold uppercase tracking-wider cursor-pointer",
                        location === link.href ? "text-primary" : "text-muted-foreground"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </div>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* ── DESKTOP ROW ── */}
        <div className="hidden md:flex items-center gap-4 min-h-16 py-2">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="text-primary animate-spin-slow">
              <RefreshCw className="h-6 w-6" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-foreground uppercase">
              Diesel <span className="text-primary">Connect</span>
            </span>
          </Link>

          {/* Clock — centered */}
          <div className="flex-1 flex items-center justify-center leading-none overflow-visible min-w-0">
            <SpriteClock />
          </div>

          {/* Desktop nav links */}
          <div className="flex items-center gap-8">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <div
                  className={cn(
                    "font-medium transition-colors hover:text-primary cursor-pointer text-sm uppercase tracking-wider relative py-1",
                    location === link.href ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300" />
                </div>
              </Link>
            ))}
            <Link href={adminHref}>
              <div
                className={cn(
                  "font-medium transition-colors hover:text-primary cursor-pointer text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100",
                  location === adminHref ? "text-primary" : "text-muted-foreground"
                )}
              >
                Admin
              </div>
            </Link>
            <div className="font-bold uppercase tracking-wide bg-primary text-white rounded-none skew-x-[-10deg] px-3 py-2 text-xs">
              <span className="skew-x-[10deg] flex items-center gap-2">
                <Shield className="w-4 h-4" /> Service
              </span>
            </div>
          </div>

        </div>

      </div>
    </nav>
  );
}
