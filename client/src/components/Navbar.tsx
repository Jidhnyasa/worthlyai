import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, CreditCard, Zap, Sparkles, Settings, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app",                label: "Dashboard",     icon: LayoutDashboard },
  { href: "/app/returns",        label: "Returns",       icon: Package },
  { href: "/app/subscriptions",  label: "Subscriptions", icon: CreditCard },
  { href: "/app/actions",        label: "Actions",       icon: Zap },
  { href: "/saved",              label: "Saved",         icon: Bookmark },
  { href: "/app/verdicts",       label: "Buy/Wait/Skip", icon: Sparkles },
  { href: "/settings",           label: "Settings",      icon: Settings },
];

export default function Navbar() {
  const [location] = useLocation();

  function isActive(href: string) {
    if (href === "/app") return location === "/app";
    return location.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(32 95% 54%)" }}>
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
              <path d="M3 5L6 15L9 9L12 15L15 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 9L17 11L19 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight">Worthly</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                isActive(href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile: logo CTA */}
        <Link
          href="/app"
          className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-white"
          style={{ background: "hsl(32 95% 54%)" }}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Dashboard
        </Link>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="flex">
          {NAV.slice(0, 5).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                isActive(href) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {label.split("/")[0]}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
