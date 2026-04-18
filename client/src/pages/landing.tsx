import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Shield, TrendingDown, BarChart2, Heart,
  RefreshCcw, ArrowRight, Check, Star, ChevronRight,
  Shirt, Headphones, Home, Gift, Zap, Target,
} from "lucide-react";

const FEATURES = [
  {
    icon: Target,
    title: "Structured decision form",
    body: "Not a blank chat box. Set your budget, mood, occasion, and priorities with smart chips and sliders.",
  },
  {
    icon: Shield,
    title: "Works for you, not brands",
    body: "Affiliate availability never influences ranking. Worthly will recommend 'skip' even when there's no commission.",
  },
  {
    icon: TrendingDown,
    title: "Regret-minimizing scoring",
    body: "Every recommendation is scored on fit, value, proof, and regret risk — not sponsored placement.",
  },
  {
    icon: BarChart2,
    title: "Side-by-side comparison",
    body: "Compare multiple options with a clear score table. See exactly why one beats another.",
  },
  {
    icon: Heart,
    title: "Personalized over time",
    body: "Worthly learns what you own, love, and regret to make sharper decisions over time.",
  },
  {
    icon: RefreshCcw,
    title: "Resale second life",
    body: "Track resale value from day one. Know what your purchase is worth before you buy it.",
  },
];

const EXAMPLES = [
  { category: "Electronics", query: "Sony WH-1000XM5 or Bose QC45 under $300?", verdict: "Buy", score: 91 },
  { category: "Fashion",     query: "Cozy but polished dinner outfit under $150",  verdict: "Buy", score: 87 },
  { category: "Baby",        query: "Best travel stroller under $300",              verdict: "Wait", score: 74 },
  { category: "Gifting",     query: "Gift for husband who loves coffee under $80",  verdict: "Buy", score: 88 },
];

const TESTIMONIALS = [
  {
    quote: "Finally stopped doomscrolling Reddit for 2 hours before every purchase. Worthly gives me a structured answer in seconds.",
    name: "Marcus T.", role: "Product designer", stars: 5,
  },
  {
    quote: "It told me to skip the $300 headphones and get a $120 pair that scored better on my actual priorities. Saved me $180.",
    name: "Priya K.", role: "Software engineer", stars: 5,
  },
  {
    quote: "The structured form is the key — I fill in my actual constraints and get a real answer, not a wall of AI text.",
    name: "James O.", role: "Finance analyst", stars: 5,
  },
  {
    quote: "Uploaded a photo of a jacket I was eyeing. Got a full comparison with three better alternatives in seconds.",
    name: "Sofia M.", role: "Stylist", stars: 5,
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Navbar ── */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "hsl(32 95% 54%)" }}>
              <svg viewBox="0 0 20 20" fill="none" className="w-4.5 h-4.5">
                <path d="M3 5L6 15L9 9L12 15L15 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 9L17 11L19 8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
              </svg>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Worthly</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#examples" className="hover:text-white transition-colors">Examples</a>
            <a href="#reviews" className="hover:text-white transition-colors">Reviews</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/app">
              <Button size="sm" className="gap-1.5 rounded-full font-semibold"
                style={{ background: "hsl(32 95% 54%)", color: "white" }}>
                Start deciding <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="relative min-h-[90vh] flex items-center"
        style={{ background: "linear-gradient(135deg, hsl(20 25% 8%) 0%, hsl(25 20% 13%) 50%, hsl(20 18% 10%) 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, hsl(32 95% 54%) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(38 90% 48%) 0%, transparent 40%)",
        }} />

        <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-20 grid md:grid-cols-2 gap-16 items-center w-full">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-amber-300 uppercase tracking-wide"
              style={{ background: "hsl(32 95% 54% / 0.15)", border: "1px solid hsl(32 95% 54% / 0.25)" }}>
              <Sparkles className="w-3.5 h-3.5" /> AI buying decisions · free to start
            </div>

            <h1 className="font-bold text-white leading-tight" style={{ fontSize: "clamp(2.4rem, 4vw, 3.5rem)" }}>
              Not a chatbot.<br/>
              <span style={{ color: "hsl(32 95% 60%)" }}>A buying decision engine.</span>
            </h1>

            <p className="text-white/60 leading-relaxed max-w-md" style={{ fontSize: "1.1rem" }}>
              Worthly uses a structured form — not an empty chat box — to collect your real constraints
              and deliver a personalized Buy / Wait / Skip verdict with scored options and tradeoffs.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/app">
                <Button size="lg" className="h-12 px-8 gap-2 rounded-full font-semibold text-white"
                  style={{ background: "hsl(32 95% 54%)" }}>
                  <Sparkles className="w-4 h-4" /> Make my first decision
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button variant="outline" size="lg"
                  className="h-12 px-7 rounded-full border-white/20 text-white bg-white/5 hover:bg-white/10">
                  Set my preferences
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-5 text-sm text-white/35">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400"/> Free forever</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400"/> No credit card</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400"/> Works instantly</span>
            </div>
          </div>

          {/* Mock decision form preview */}
          <div className="flex justify-center md:justify-end">
            <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-stone-100">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-stone-400 mb-1 font-medium">What are you deciding on?</p>
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                    <p className="text-sm text-stone-700">Best wireless headphones for commuting under $250...</p>
                  </div>
                </div>
                {/* Category chips */}
                <div className="flex flex-wrap gap-1.5">
                  {["Electronics", "Fashion", "Home"].map((c, i) => (
                    <span key={c} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${i===0 ? "bg-amber-50 border-amber-200 text-amber-700" : "border-stone-200 text-stone-500"}`}>
                      {c}
                    </span>
                  ))}
                </div>
                {/* Budget */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400 font-medium">Budget</span>
                  <span className="font-bold text-amber-600">Up to $250</span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full">
                  <div className="h-full w-1/4 bg-amber-400 rounded-full"/>
                </div>
                {/* Verdict */}
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Verdict</p>
                    <p className="font-bold text-stone-900 text-sm">Buy — Sony WH-1000XM5</p>
                  </div>
                  <span className="text-xl font-bold text-amber-500">91</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: "linear-gradient(to bottom, transparent, hsl(38 25% 97%))" }}/>
      </section>

      {/* ── Not a chatbot callout ── */}
      <section className="py-14 px-6 bg-[hsl(38_25%_97%)]">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-3">What Worthly is NOT</p>
              {["A blank chat box", "An open-ended AI assistant", "A ChatGPT clone", "A generic shopping chatbot"].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-red-700 py-1">
                  <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-400 font-bold text-xs shrink-0">✗</span>
                  {t}
                </div>
              ))}
            </div>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-3">What Worthly IS</p>
              {["Structured buying decision system", "Personalized recommendation engine", "Guided decision workflow", "Comparison platform with scores"].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-green-700 py-1">
                  <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-500 font-bold text-xs shrink-0">✓</span>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-6 bg-[hsl(38_25%_97%)]">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest text-center mb-4">Features</p>
          <h2 className="font-bold text-center text-stone-900 mb-12" style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
            Built different by design
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="font-semibold text-stone-900">{title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Examples ── */}
      <section id="examples" className="py-20 px-6" style={{ background: "hsl(20 25% 8%)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-widest text-center mb-4">Examples</p>
          <h2 className="font-bold text-white text-center mb-12" style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
            Real queries, real verdicts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXAMPLES.map(({ category, query, verdict, score }) => (
              <div key={query}
                className="rounded-2xl p-5 space-y-3 cursor-pointer hover:scale-[1.01] transition-transform"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-xs font-medium text-amber-400/70">{category}</p>
                <p className="text-sm text-white/80 leading-relaxed">"{query}"</p>
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold",
                    verdict === "Buy" ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"
                  )}>
                    {verdict === "Buy" ? "✓" : "⏳"} {verdict}
                  </span>
                  <span className="text-lg font-bold text-amber-400">{score}<span className="text-xs text-white/30">/100</span></span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/app">
              <Button className="gap-2 rounded-full font-semibold" style={{ background: "hsl(32 95% 54%)", color: "white" }}>
                Try with your own query <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section id="reviews" className="py-20 px-6 bg-[hsl(36_20%_93%)]">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest text-center mb-4">Reviews</p>
          <h2 className="font-bold text-stone-900 text-center mb-12" style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
            Smarter buyers, fewer regrets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TESTIMONIALS.map(({ quote, name, role, stars }) => (
              <div key={name} className="bg-white rounded-2xl p-7 border border-stone-100 shadow-sm">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-stone-700 leading-relaxed mb-5 text-sm">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-amber-700 font-bold text-sm">{name[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">{name}</p>
                    <p className="text-stone-400 text-xs">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6" style={{ background: "linear-gradient(135deg, hsl(20 25% 8%), hsl(25 20% 13%))" }}>
        <div className="max-w-xl mx-auto text-center space-y-6">
          <h2 className="font-bold text-white" style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
            Ready to decide smarter?
          </h2>
          <p className="text-white/55">Free to start. No credit card required. Your first verdict in seconds.</p>
          <Link href="/app">
            <Button size="lg" className="h-12 px-10 gap-2 rounded-full font-semibold"
              style={{ background: "hsl(32 95% 54%)", color: "white" }}>
              <Zap className="w-4 h-4" /> Start deciding free
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t" style={{ background: "hsl(20 25% 8%)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/35">
          <span className="font-medium text-white/60">Worthly © 2026</span>
          <div className="flex items-center gap-5">
            <Link href="/app" className="hover:text-white/70 transition-colors">App</Link>
            <Link href="/settings" className="hover:text-white/70 transition-colors">Settings</Link>
            <a href="https://worthlyai.app" className="hover:text-white/70 transition-colors" target="_blank" rel="noopener noreferrer">worthlyai.app</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
