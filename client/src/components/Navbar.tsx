import { Link, useLocation } from "wouter";
import { Wrench, Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/submit", label: "New Request" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary p-2 rounded-sm transform group-hover:rotate-12 transition-transform duration-300">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-foreground uppercase">
            Heavy<span className="text-primary">Duty</span> Ops
          </span>
        </Link>

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
          <Link href="/submit">
            <Button size="sm" className="font-bold uppercase tracking-wide bg-primary hover:bg-primary/90 text-white rounded-none skew-x-[-10deg]">
              <span className="skew-x-[10deg] flex items-center gap-2">
                <Shield className="w-4 h-4" /> Service Now
              </span>
            </Button>
          </Link>
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
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
