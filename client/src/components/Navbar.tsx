import { Link, useLocation } from "wouter";
import { RefreshCw, Shield, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import SpriteClock from "./SpriteClock";
import { useAuth } from "@/hooks/use-auth";
import { getLoginPath } from "@/lib/auth-utils";

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
  const adminLink = { href: adminHref, label: "Admin" };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-visible">
      <div className="container mx-auto px-4 min-h-16 py-2 grid grid-cols-[auto_1fr_auto] items-center gap-4 overflow-visible">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="text-primary animate-spin-slow">
            <RefreshCw className="h-6 w-6" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-foreground uppercase">
            Detroit Diesel <span className="text-primary">Connect</span>
          </span>
        </Link>

        <div className="flex items-center justify-center leading-none overflow-visible min-w-0">
          <SpriteClock />
        </div>

        <div className="flex items-center justify-end gap-4">
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <div
                  className={cn(
                    "font-medium transition-colors hover:text-primary cursor-pointer text-sm uppercase tracking-wider relative py-1",
                    location === link.href ? "text-primary after:w-full" : "text-muted-foreground after:w-0"
                  )}
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300"></span>
                </div>
              </Link>
            ))}
            <Link href={adminLink.href}>
              <div
                className={cn(
                  "font-medium transition-colors hover:text-primary cursor-pointer text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100",
                  location === adminLink.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {adminLink.label}
              </div>
            </Link>
            <div className="font-bold uppercase tracking-wide bg-primary text-white rounded-none skew-x-[-10deg] px-3 py-2 text-xs">
              <span className="skew-x-[10deg] flex items-center gap-2">
                <Shield className="w-4 h-4" /> Service
              </span>
            </div>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
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
                  <Link href={adminLink.href}>
                    <div 
                      className={cn(
                        "text-sm font-display font-bold uppercase tracking-wider cursor-pointer opacity-50",
                        location === adminLink.href ? "text-primary" : "text-muted-foreground"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {adminLink.label}
                    </div>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
