import { Link } from "wouter";
import { Sparkles } from "lucide-react";

interface Props {
  headline?:    string;
  subline?:     string;
  ctaLabel?:    string;
  ctaHref?:     string;
  prefillQuery?: string;
}

export default function DiscoveryCTA({
  headline    = "See if it's actually worth it.",
  subline     = "Get a structured Buy / Wait / Skip verdict in 30 seconds. Scored on fit, value, and regret risk. No sign-up required.",
  ctaLabel    = "Try it free →",
  ctaHref     = "/app",
}: Props) {
  return (
    <section
      className="py-20 px-6 text-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(20 25% 8%) 0%, hsl(25 20% 12%) 100%)",
      }}
    >
      {/* Amber glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 120%, hsl(32 95% 54% / 0.22) 0%, transparent 65%)",
        }}
      />

      <div className="relative max-w-2xl mx-auto space-y-6">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: "hsl(32 95% 54% / 0.14)",
            border: "1px solid hsl(32 95% 54% / 0.28)",
            color: "hsl(32 95% 65%)",
          }}
        >
          <Sparkles className="w-3 h-3" />
          Powered by Worthly AI
        </div>

        <h2
          className="font-bold text-white"
          style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", lineHeight: 1.15 }}
        >
          {headline}
        </h2>

        <p className="text-white/50 text-base max-w-lg mx-auto leading-relaxed">
          {subline}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "hsl(32 95% 54%)",
              boxShadow: "0 8px 36px hsl(32 95% 54% / 0.40)",
            }}
          >
            <Sparkles className="w-4 h-4" />
            {ctaLabel}
          </Link>
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium transition-all"
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            Compare products
          </Link>
        </div>

        <p className="text-white/20 text-xs">
          No account required · Free for 5 decisions/month
        </p>
      </div>
    </section>
  );
}
