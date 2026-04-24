import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { applySeo } from "@/lib/seo";

interface Props {
  title:       string;
  description: string;
  canonical:   string;
  noindex?:    boolean;
  children:    ReactNode;
}

export default function PublicPageShell({ title, description, canonical, noindex = false, children }: Props) {
  useEffect(() => {
    applySeo({ title: `${title} — Worthly AI`, description, canonical, noindex });
  }, [title, description, canonical, noindex]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Lightweight public nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(32 95% 54%)" }}
            >
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                <path d="M3 5L6 15L9 9L12 15L15 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 9L17 11L19 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight">Worthly AI</span>
          </Link>

          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link href="/headphones" className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                Headphones
              </Link>
              <Link href="/gifts" className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                Gifts
              </Link>
              <Link href="/baby-gear" className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                Baby Gear
              </Link>
            </nav>
            <Link
              href="/app"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "hsl(32 95% 54%)" }}
            >
              Try it free →
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer
        className="py-10 px-6 border-t mt-16"
        style={{ background: "hsl(20 25% 6%)", borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "hsl(32 95% 54%)" }}
            >
              <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
                <path d="M3 5L6 15L9 9L12 15L15 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-semibold text-white/60">Worthly AI</span>
            <span className="text-white/25 ml-2">© {new Date().getFullYear()}</span>
          </div>

          <nav className="flex items-center gap-5 text-white/35">
            {[
              { href: "/app", label: "Decision Panel" },
              { href: "/headphones", label: "Headphones" },
              { href: "/gifts", label: "Gifts" },
              { href: "/baby-gear", label: "Baby Gear" },
              { href: "/compare", label: "Compare" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-white/70 transition-colors">
                {label}
              </Link>
            ))}
          </nav>

          <p className="text-white/20 text-xs text-center md:text-right">
            Scores are AI-generated estimates.<br />Always verify before purchasing.
          </p>
        </div>
      </footer>
    </div>
  );
}
