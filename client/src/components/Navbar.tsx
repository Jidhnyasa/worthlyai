import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Package, Sparkles, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { SupabaseUser } from "@/lib/supabase";

const APP_NAV = [
  { href: "/app",      label: "Analyze",  icon: Search   },
  { href: "/app/mine", label: "Mine",     icon: Package  },
  { href: "/settings", label: "Settings", icon: Settings },
];

const LANDING_NAV = [
  { href: "/#outcomes", label: "Use cases" },
  { href: "/#how",      label: "How it works" },
  { href: "/#pricing",  label: "Pricing" },
  { href: "/app",       label: "Demo" },
];

export default function Navbar() {
  const [location] = useLocation();
  const [user, setUser] = useState<SupabaseUser>(null);
  const isAppPage = location.startsWith("/app") || location.startsWith("/saved") || location.startsWith("/settings");
  const nav = isAppPage ? APP_NAV : LANDING_NAV;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  function isActive(href: string) {
    if (href === "/app") return location === "/app";
    if (href.startsWith("/#")) return false;
    return location.startsWith(href);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
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
          <span className="font-bold text-base tracking-tight">Worthly AI</span>
        </Link>

        {/* Nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-0.5">
          {nav.map((item) => {
            const linkClass = cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              isActive(item.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            );
            if ("icon" in item) {
              const Icon = item.icon as React.FC<{ className?: string }>;
              return (
                <Link key={item.href} href={item.href} className={linkClass}>
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            }
            return (
              <a key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Right side: auth or CTA */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-[140px]">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : isAppPage ? (
            <Link
              href="/auth"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{ background: "hsl(32 95% 54%)" }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Get started</span>
              <span className="sm:hidden">Start</span>
            </Link>
          ) : (
            <Link
              href="/app"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{ background: "hsl(32 95% 54%)" }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Try Worthly AI</span>
              <span className="sm:hidden">Try</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile bottom nav — only on app pages */}
      {isAppPage && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
          <div className="flex">
            {APP_NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                  isActive(href) ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}