"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Sparkles, TrendingDown, RefreshCcw, ArrowRight, Check, Star,
  Zap, Chrome, Clock, AlertTriangle, ShoppingBag, CreditCard,
  Tag, Search, Package, X,
} from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1800&q=80&fit=crop&auto=format";

const ROTATING_QUERIES = [
  "Sony WH-1000XM5 — BUY · Score 84 · 18K reviews",
  "Return window closes Friday — Nike Air Max 270",
  "Vitamix A3500 — WAIT · Price may drop at Target",
  "Disney+ unused 2 months — cancel to save $168/yr",
  "Samsung TV — price dropped $42 · now at Best Buy",
  "Garmin Forerunner — potential $185 resale value",
];

const HERO_CHIPS = [
  "What to buy", "What to skip", "What to return",
  "What to cancel", "Price drops", "Resale value",
];

const OUTCOME_CARDS: {
  Icon: React.FC<{ className?: string }>;
  num: string;
  title: string;
  body: string;
  accentColor: string;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    Icon: Sparkles,
    num: "01",
    title: "What to buy",
    body: "Instant Buy / Wait / Skip verdicts scored on value, trust, timing, and risk. Not opinions — analysis.",
    accentColor: "bg-amber-400",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    Icon: AlertTriangle,
    num: "02",
    title: "What to skip",
    body: "Catch overpriced, low-trust, or poorly-timed purchases before you spend. Save money by not spending it.",
    accentColor: "bg-red-400",
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    Icon: RefreshCcw,
    num: "03",
    title: "What to return",
    body: "Never miss a return window again. Worthly AI tracks every deadline and alerts you before it closes.",
    accentColor: "bg-orange-400",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    Icon: CreditCard,
    num: "04",
    title: "What to cancel",
    body: "Spot subscriptions that have gone unused, underused, or overpriced. Cancel before the next charge hits.",
    accentColor: "bg-blue-400",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    Icon: TrendingDown,
    num: "05",
    title: "What dropped in price",
    body: "Prices change after you buy. Worthly AI catches drops, flags price-match opportunities, and helps you recover money.",
    accentColor: "bg-emerald-400",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    Icon: Tag,
    num: "06",
    title: "What you can resell",
    body: "Some of what you own still has real value. Worthly AI surfaces resale opportunities so nothing goes to waste.",
    accentColor: "bg-violet-400",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Analyze any product",
    body: "Paste a product URL or browse with the Worthly AI extension. Get instant Buy / Wait / Skip verdicts based on value, trust, timing, and risk — in seconds.",
  },
  {
    step: "02",
    title: "Get a clear verdict",
    body: "Worthly AI scores the product and explains exactly why, in plain language. No guessing, no affiliate bias, no sponsored rankings.",
  },
  {
    step: "03",
    title: "Stay protected after purchase",
    body: "Worthly AI tracks return windows, price changes, unused subscriptions, and resale opportunities — automatically, long after checkout.",
  },
];

const TESTIMONIALS = [
  {
    quote: "I was about to buy a $300 jacket on impulse. Worthly AI said Skip — too expensive, low ratings. Saved myself from a bad buy.",
    name: "Marcus T.", role: "Product designer", stars: 5, avatar: "M",
  },
  {
    quote: "The Buy verdict on my Sony headphones came with three clear reasons. I bought with real confidence. Zero regret.",
    name: "Priya K.", role: "Software engineer", stars: 5, avatar: "P",
  },
  {
    quote: "Worthly AI flagged my return window was closing in 4 days. I'd completely forgotten — got my $150 back.",
    name: "James O.", role: "Finance analyst", stars: 5, avatar: "J",
  },
  {
    quote: "The Wait verdict saved me $120. Two weeks later, price dropped and it flipped to Buy. Perfect call.",
    name: "Sofia M.", role: "Stylist", stars: 5, avatar: "S",
  },
];

const BEFORE_BULLETS = [
  "Analyze products before checkout",
  "Understand value, trust, and timing",
  "Avoid impulse buys and overpaying",
  "Make faster, more confident decisions",
];

const AFTER_BULLETS = [
  "Track return windows and deadlines",
  "Catch price drops after you buy",
  "Cancel wasteful subscriptions",
  "Surface resale opportunities",
];

// ── Animation variants ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] } },
};

// ── Reveal helpers ─────────────────────────────────────────────────────────────

function SectionReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Section eyebrow label ─────────────────────────────────────────────────────

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`text-[11px] font-bold uppercase tracking-[0.12em] mb-3 ${light ? "text-amber-400" : "text-amber-600"}`}>
      {children}
    </p>
  );
}

// ── Waitlist form ─────────────────────────────────────────────────────────────

function WaitlistForm({ source = "extension_cta" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (res.ok) setState("done");
      else setState("error");
    } catch {
      setState("error");
    }
  }, [email, source, state]);

  if (state === "done") {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
        <p className="text-sm font-semibold text-emerald-700">You're on the list! We'll notify you when the extension launches.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 placeholder:text-stone-400"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0 disabled:opacity-60 transition-all hover:brightness-110"
        style={{ background: "hsl(32 95% 54%)" }}
      >
        {state === "loading" ? "…" : "Join waitlist"}
      </button>
      {state === "error" && <p className="text-xs text-red-500 mt-1">Something went wrong. Try again.</p>}
    </form>
  );
}

// ── Rotating ticker ────────────────────────────────────────────────────────────

function RotatingQuery() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ROTATING_QUERIES.length), 3400);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2.5">
      {/* Pulsing live dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
      </span>
      <div className="relative h-6 overflow-hidden flex-1">
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 text-sm text-white/50 italic truncate"
          >
            {ROTATING_QUERIES[idx]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Extension popup mockup ─────────────────────────────────────────────────────

function ExtensionMockup() {
  return (
    <div className="w-[320px] shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-white text-sm font-sans">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(32 95% 54%)" }}>
            <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
              <path d="M3 5L6 15L9 9L12 15L15 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-stone-900 text-[14px]">Worthly AI</span>
        </div>
        <span className="text-[11px] font-semibold text-amber-600">Dashboard ↗</span>
      </div>

      <div className="bg-stone-50 border-b border-stone-100 flex items-center justify-center h-[82px]">
        <img
          src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80"
          alt="Sony headphones"
          className="h-full w-full object-contain px-6 py-2"
        />
      </div>

      <div className="px-4 py-3 border-b border-stone-100">
        <p className="font-semibold text-stone-900 text-[13px] leading-snug mb-1.5">
          Sony WH-1000XM5 Wireless Headphones
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">Amazon</span>
          <span className="text-[13px] font-extrabold text-stone-900">$279.99</span>
          <span className="text-[10px] text-amber-500 font-medium">★ 4.6 (18K)</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3.5 border-b border-green-100 bg-green-50">
        <div>
          <p className="text-[21px] font-black leading-none text-green-700">BUY</p>
          <p className="text-[10px] text-stone-500 mt-0.5">Confident purchase — good value</p>
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "conic-gradient(#22c55e 84%, #e7e5e4 0)" }}
        >
          <div className="w-[34px] h-[34px] bg-white rounded-full flex items-center justify-center">
            <span className="text-[14px] font-extrabold text-stone-900">84</span>
          </div>
        </div>
      </div>

      <ul className="px-4 py-3 space-y-1.5 border-b border-stone-100">
        {["Strong 4.6★ customer rating", "18K+ verified reviews", "Amazon buyer protection"].map(r => (
          <li key={r} className="flex items-center gap-2 text-[11.5px] text-stone-600">
            <span className="w-3.5 h-3.5 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-[9px] shrink-0">✓</span>
            {r}
          </li>
        ))}
      </ul>

      <div className="px-4 py-3">
        <button
          className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white"
          style={{ background: "hsl(32 95% 54%)" }}
        >
          Save to Worthly AI
        </button>
      </div>
    </div>
  );
}

// ── Product preview panel ──────────────────────────────────────────────────────

const INSIGHT_CARDS = [
  {
    Icon: Clock,
    label: "Return reminder",
    value: "Nike Air Max — return by Apr 26",
    dot: "bg-amber-400",
    bg: "bg-amber-50 border-amber-100",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    labelColor: "text-amber-700",
  },
  {
    Icon: TrendingDown,
    label: "Price drop",
    value: "Samsung TV down $42 · now $1,257",
    dot: "bg-emerald-400",
    bg: "bg-emerald-50 border-emerald-100",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    labelColor: "text-emerald-700",
  },
  {
    Icon: CreditCard,
    label: "Cancel this",
    value: "Disney+ unused 2 months — $168/yr",
    dot: "bg-red-400",
    bg: "bg-red-50 border-red-100",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    labelColor: "text-red-700",
  },
  {
    Icon: Tag,
    label: "Resale value",
    value: "Garmin Forerunner — est. $185 on eBay",
    dot: "bg-violet-400",
    bg: "bg-violet-50 border-violet-100",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    labelColor: "text-violet-700",
  },
] as const;

function ProductPreviewPanel() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.06)" }}>
      {/* Browser chrome */}
      <div className="bg-stone-50 border-b border-stone-100 px-4 py-2.5 flex items-center gap-3">
        <div className="flex gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
        </div>
        <div className="flex-1 flex items-center gap-2 bg-white border border-stone-200 rounded-md px-3 py-1">
          <Search className="w-3 h-3 text-stone-400 shrink-0" />
          <span className="text-[11px] text-stone-400 truncate">worthlyai.app · Analyze product</span>
        </div>
        <div
          className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white"
          style={{ background: "hsl(32 95% 54%)" }}
        >
          Analyze
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Verdict card */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-3.5 flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=70"
            alt="Sony headphones"
            className="w-14 h-14 rounded-xl object-contain bg-white border border-green-100 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-stone-800 leading-snug line-clamp-1">
              Sony WH-1000XM5 Wireless Headphones
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5">Amazon · $279.99 · ★ 4.6 (18K reviews)</p>
            <div className="flex gap-1 mt-1.5">
              {["4.6★ rating", "18K reviews", "Buyer protection"].map(r => (
                <span key={r} className="text-[9px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                  ✓ {r}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <span className="text-[18px] font-black text-green-700 leading-none">BUY</span>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "conic-gradient(#22c55e 84%, #e7e5e4 0)" }}
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-[11px] font-bold text-stone-900">84</span>
              </div>
            </div>
          </div>
        </div>

        {/* Insight cards 2×2 */}
        <div className="grid grid-cols-2 gap-2">
          {INSIGHT_CARDS.map(({ Icon, label, value, dot, bg, iconBg, iconColor, labelColor }) => (
            <div key={label} className={`rounded-xl border p-3 ${bg}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                <div className={`w-4 h-4 rounded flex items-center justify-center ${iconBg}`}>
                  <Icon className={`w-2.5 h-2.5 ${iconColor}`} />
                </div>
                <span className={`text-[8.5px] font-bold uppercase tracking-wider ${labelColor}`}>{label}</span>
              </div>
              <p className="text-[11px] text-stone-700 font-semibold leading-snug">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sticky Header ──────────────────────────────────────────────────────────────

function StickyHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(16,10,5,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
        boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.3)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ background: "hsl(32 95% 54%)" }}
          >
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
              <path d="M3 5L6 15L9 9L12 15L15 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-white text-base tracking-tight">Worthly AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-white/55">
          {[
            { href: "#outcomes", label: "Features" },
            { href: "#preview",  label: "Product" },
            { href: "#reviews",  label: "Reviews" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={e => { e.preventDefault(); document.querySelector(href)?.scrollIntoView({ behavior: "smooth" }); }}
              className="hover:text-white transition-colors duration-200"
            >
              {label}
            </a>
          ))}
        </nav>

        <Link href="/app">
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all"
              style={{ background: "hsl(32 95% 54%)", boxShadow: "0 2px 12px hsl(32 95% 54% / 0.35)" }}
            >
              Try free <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </Link>
      </div>
    </header>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroBgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  useEffect(() => {
    import("@/lib/seo").then(({ applySeo }) =>
      applySeo({
        title: "Worthly AI — Your AI Purchase Outcome Agent",
        description:
          "Worthly AI tells you what to buy, skip, return, cancel, and resell. One AI layer for every purchase decision.",
        canonical: "https://worthlyai.app/",
      })
    );
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[hsl(38_25%_97%)]">
      <StickyHeader />

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <motion.div className="absolute inset-0 scale-105" style={{ y: heroBgY }}>
          <img src={HERO_IMAGE_URL} alt="" aria-hidden className="w-full h-full object-cover" loading="eager" />
          {/* Dark base */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(12,7,3,0.96) 0%, rgba(18,10,4,0.84) 45%, rgba(10,6,2,0.92) 100%)" }} />
          {/* Amber radial glow */}
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 25% 65%, hsl(32 95% 45% / 0.28) 0%, transparent 52%)" }} />
          {/* Second softer glow */}
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 30%, hsl(32 95% 54% / 0.08) 0%, transparent 45%)" }} />
          {/* Bottom fade to page */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 0%, transparent 65%, hsl(38 25% 97%) 100%)" }} />
        </motion.div>

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-20 md:pt-36 md:pb-28 grid md:grid-cols-[1fr_auto] gap-12 md:gap-20 items-center w-full">

          {/* Left copy */}
          <motion.div
            className="space-y-8 max-w-2xl"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.11 } } }}
          >
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold text-amber-300 uppercase tracking-widest"
                style={{ background: "hsl(32 95% 54% / 0.13)", border: "1px solid hsl(32 95% 54% / 0.30)" }}
              >
                <Sparkles className="w-3 h-3" /> AI purchase outcome agent · free to start
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="font-black text-white leading-[1.04]"
              style={{ fontSize: "clamp(2.6rem, 5vw, 4rem)", letterSpacing: "-0.03em" }}
            >
              Your AI purchase<br />
              <span style={{ color: "hsl(32 95% 64%)" }}>outcome agent.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeUp}
              className="text-white/58 leading-[1.7] max-w-lg"
              style={{ fontSize: "clamp(1rem, 1.5vw, 1.12rem)" }}
            >
              One AI layer that tells you what to buy, what to skip,
              what to return, what to cancel, what dropped in price — and what you can resell.
              Before and after every purchase.
            </motion.p>

            {/* Capability chips */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
              {HERO_CHIPS.map(chip => (
                <span
                  key={chip}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold text-white/65 border"
                  style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)" }}
                >
                  {chip}
                </span>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 pt-1">
              <Link href="/app">
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <button
                    className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-base font-bold text-white transition-all"
                    style={{ background: "hsl(32 95% 54%)", boxShadow: "0 8px 32px hsl(32 95% 54% / 0.45), 0 2px 8px rgba(0,0,0,0.2)" }}
                  >
                    <Sparkles className="w-4 h-4" /> Try Worthly AI free
                  </button>
                </motion.div>
              </Link>
              <motion.button
                variants={fadeUp}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => document.querySelector("#preview")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold text-white/75 border transition-all hover:text-white hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.05)" }}
              >
                See how it works <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>

            {/* Live ticker */}
            <motion.div variants={fadeUp} className="pt-1">
              <RotatingQuery />
            </motion.div>

            {/* Support line */}
            <motion.p variants={fadeUp} className="text-[11px] text-white/28 tracking-wide">
              Before you buy. After you buy. Worthly AI stays with you. · Amazon · Target · Walmart · Shopify
            </motion.p>
          </motion.div>

          {/* Right: floating mockup */}
          <motion.div
            className="hidden md:flex justify-end items-center"
            initial={{ opacity: 0, x: 32, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.75, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ opacity: heroOpacity }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="relative">
                <div
                  className="absolute -inset-8 rounded-[3rem] blur-3xl opacity-25"
                  style={{ background: "hsl(32 95% 54%)" }}
                />
                <div className="relative drop-shadow-2xl">
                  <ExtensionMockup />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Trust band ── */}
      <div className="bg-white border-b border-stone-100 py-4 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-x-6 gap-y-2 flex-wrap text-xs font-medium text-stone-400">
          {[
            { label: "Buy / Wait / Skip verdicts", color: "bg-amber-400" },
            { label: "Return window tracking",    color: "bg-orange-400" },
            { label: "Price drop alerts",         color: "bg-emerald-400" },
            { label: "Subscription cleanup",      color: "bg-blue-400"   },
            { label: "Resale insights",           color: "bg-violet-400" },
          ].map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${color} shrink-0`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Section B: Outcome cards ── */}
      <section id="outcomes" className="py-24 px-5 sm:px-8 bg-[hsl(38_25%_97%)]">
        <div className="max-w-6xl mx-auto">
          <SectionReveal className="text-center mb-14">
            <Eyebrow>What Worthly AI does</Eyebrow>
            <h2
              className="font-bold text-stone-900 mb-4"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", letterSpacing: "-0.02em" }}
            >
              One AI layer for everything you buy
            </h2>
            <p className="text-stone-500 max-w-lg mx-auto leading-relaxed">
              Most tools help with one thing. Worthly AI manages your purchase outcomes
              from first click to final resale.
            </p>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {OUTCOME_CARDS.map(({ Icon, num, title, body, accentColor, iconBg, iconColor }) => (
              <motion.div
                key={title}
                variants={scaleIn}
                whileHover={{ y: -5, boxShadow: "0 20px 48px rgba(0,0,0,0.09)" }}
                className="relative bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden cursor-default transition-shadow"
              >
                {/* Top accent line */}
                <div className={`h-[3px] w-full ${accentColor}`} />
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <span className="text-[11px] font-bold text-stone-200">{num}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 mb-2">{title}</h3>
                    <p className="text-sm text-stone-500 leading-relaxed">{body}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ── Section C: Before / After ── */}
      <section
        className="py-24 px-5 sm:px-8"
        style={{ background: "linear-gradient(180deg, hsl(38 20% 95%) 0%, hsl(38 18% 91%) 100%)" }}
      >
        <div className="max-w-5xl mx-auto">
          <SectionReveal className="text-center mb-12">
            <Eyebrow>Full lifecycle</Eyebrow>
            <h2
              className="font-bold text-stone-900"
              style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)", letterSpacing: "-0.02em" }}
            >
              Worthly AI works across the full purchase lifecycle
            </h2>
          </SectionReveal>

          <StaggerReveal className="grid md:grid-cols-2 gap-4">
            {/* Before */}
            <motion.div
              variants={scaleIn}
              whileHover={{ y: -3, boxShadow: "0 16px 40px rgba(0,0,0,0.07)" }}
              className="bg-white border border-stone-100 rounded-2xl p-7 transition-shadow"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-stone-900">Before purchase</p>
                  <p className="text-xs text-stone-400 mt-0.5">Smarter decisions upfront</p>
                </div>
              </div>
              <ul className="space-y-4">
                {BEFORE_BULLETS.map(b => (
                  <li key={b} className="flex items-center gap-3 text-sm text-stone-700">
                    <span className="w-5 h-5 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold text-[10px] shrink-0">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* After */}
            <motion.div
              variants={scaleIn}
              whileHover={{ y: -3, boxShadow: "0 16px 40px rgba(0,0,0,0.07)" }}
              className="bg-white border border-stone-100 rounded-2xl p-7 transition-shadow"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-stone-900">After purchase</p>
                  <p className="text-xs text-stone-400 mt-0.5">Protected, recovered, optimized</p>
                </div>
              </div>
              <ul className="space-y-4">
                {AFTER_BULLETS.map(b => (
                  <li key={b} className="flex items-center gap-3 text-sm text-stone-700">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold text-[10px] shrink-0">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>
          </StaggerReveal>
        </div>
      </section>

      {/* ── Section D: Why different (dark) ── */}
      <section className="py-24 px-5 sm:px-8" style={{ background: "hsl(20 25% 7%)" }}>
        <div className="max-w-4xl mx-auto">
          <SectionReveal className="text-center mb-14">
            <Eyebrow light>Why it is different</Eyebrow>
            <h2
              className="font-bold text-white mb-5"
              style={{ fontSize: "clamp(1.7rem, 3vw, 2.5rem)", letterSpacing: "-0.02em" }}
            >
              More than a shopping assistant
            </h2>
            <p className="text-white/45 max-w-lg mx-auto leading-relaxed">
              Worthly AI is not just another product finder.
              It helps you act smarter before you buy and recover more after you buy.
            </p>
          </SectionReveal>

          {/* 2-column comparison */}
          <SectionReveal>
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* Left: what others do */}
              <div
                className="rounded-2xl p-6 space-y-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                  <X className="w-3 h-3 text-red-500" /> Other tools
                </p>
                {[
                  "Just product discovery",
                  "Just coupons or deal alerts",
                  "Just package tracking",
                  "Just subscription management",
                ].map(t => (
                  <div key={t} className="flex items-center gap-3 text-sm text-white/30 line-through decoration-white/20">
                    <span className="w-4 h-4 rounded-full border border-white/10 flex items-center justify-center shrink-0">
                      <X className="w-2.5 h-2.5 text-red-400/50" />
                    </span>
                    {t}
                  </div>
                ))}
              </div>

              {/* Right: what Worthly AI does */}
              <div
                className="rounded-2xl p-6 space-y-4"
                style={{ background: "hsl(32 95% 54% / 0.09)", border: "1px solid hsl(32 95% 54% / 0.22)" }}
              >
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Worthly AI
                </p>
                {[
                  "Purchase decisions, before checkout",
                  "Post-purchase actions, after checkout",
                  "Money recovery, across all categories",
                  "One unified purchase outcome agent",
                ].map(t => (
                  <div key={t} className="flex items-center gap-3 text-sm text-white/80">
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "hsl(32 95% 54% / 0.2)" }}
                    >
                      <Check className="w-2.5 h-2.5 text-amber-400" />
                    </span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </SectionReveal>

          {/* Centered tagline */}
          <SectionReveal className="text-center">
            <p
              className="font-bold text-white/80 text-xl max-w-lg mx-auto leading-snug"
              style={{ letterSpacing: "-0.01em" }}
            >
              "Buy smarter. Recover more. Regret less."
            </p>
            <p className="text-white/30 text-sm mt-2">— The Worthly AI promise</p>
          </SectionReveal>
        </div>
      </section>

      {/* ── Section E: Product preview ── */}
      <section
        id="preview"
        className="py-24 px-5 sm:px-8"
        style={{ background: "linear-gradient(180deg, hsl(38 18% 91%) 0%, hsl(38 25% 97%) 100%)" }}
      >
        <div className="max-w-5xl mx-auto">
          <SectionReveal className="text-center mb-12">
            <Eyebrow>Product preview</Eyebrow>
            <h2
              className="font-bold text-stone-900 mb-4"
              style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)", letterSpacing: "-0.02em" }}
            >
              See Worthly AI in action
            </h2>
            <p className="text-stone-500 max-w-md mx-auto leading-relaxed">
              Every purchase outcome, in one place. Verdict, return deadline, price drop,
              subscription flag, and resale value.
            </p>
          </SectionReveal>

          <SectionReveal>
            <div className="relative max-w-3xl mx-auto">
              {/* Ambient glow */}
              <div
                className="absolute -inset-6 rounded-[2.5rem] opacity-20 blur-3xl pointer-events-none"
                style={{ background: "hsl(32 95% 54%)" }}
              />
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <ProductPreviewPanel />
              </motion.div>
            </div>
          </SectionReveal>

          <SectionReveal className="mt-10 text-center">
            <Link href="/app">
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} className="inline-block">
                <button
                  className="flex items-center gap-2 px-9 py-3.5 rounded-full text-base font-bold text-white"
                  style={{ background: "hsl(32 95% 54%)", boxShadow: "0 8px 28px hsl(32 95% 54% / 0.40)" }}
                >
                  <Sparkles className="w-4 h-4" /> Try Worthly AI free
                </button>
              </motion.div>
            </Link>
          </SectionReveal>
        </div>
      </section>

      {/* ── Section F: How it works ── */}
      <section id="how" className="py-24 px-5 sm:px-8 bg-[hsl(38_25%_97%)]">
        <div className="max-w-5xl mx-auto">
          <SectionReveal className="text-center mb-14">
            <Eyebrow>How it works</Eyebrow>
            <h2
              className="font-bold text-stone-900"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", letterSpacing: "-0.02em" }}
            >
              Simple by design
            </h2>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, body }, i) => (
              <motion.div key={step} variants={fadeUp} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-[26px] left-[calc(100%+1rem)] w-[calc(100%-2rem)] h-px border-t-2 border-dashed border-stone-150 -translate-x-1/2 z-0" />
                )}
                <div className="relative z-10 space-y-4">
                  <div
                    className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center font-bold text-base"
                    style={{
                      background: "hsl(32 95% 54% / 0.09)",
                      color: "hsl(32 95% 44%)",
                      border: "1.5px solid hsl(32 95% 54% / 0.20)",
                    }}
                  >
                    {step}
                  </div>
                  <h3 className="font-bold text-stone-900">{title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">{body}</p>
                </div>
              </motion.div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ── Extension callout ── */}
      <section
        className="py-16 px-5 sm:px-8 border-y border-stone-100"
        style={{ background: "linear-gradient(135deg, hsl(38 20% 95%) 0%, hsl(38 22% 97%) 100%)" }}
      >
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <SectionReveal>
            <div className="space-y-5">
              <Eyebrow>Browser extension</Eyebrow>
              <h2
                className="font-bold text-stone-900"
                style={{ fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)", letterSpacing: "-0.02em" }}
              >
                Verdicts where you shop
              </h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                The Worthly AI extension brings instant verdicts directly to Amazon, Target, and Walmart
                product pages. No tab switching. No guessing.
              </p>
              <ul className="space-y-2.5">
                {[
                  "Instant Buy / Wait / Skip on every product page",
                  "Save items to your Worthly AI dashboard",
                  "Track prices and return windows automatically",
                ].map(b => (
                  <li key={b} className="flex items-center gap-2.5 text-sm text-stone-700">
                    <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="space-y-3 pt-1">
                <p className="text-xs font-semibold text-stone-400 flex items-center gap-1.5">
                  <Chrome className="w-3 h-3" /> Extension launching soon — join the waitlist:
                </p>
                <WaitlistForm source="extension_section" />
                <Link href="/app">
                  <button className="text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors underline underline-offset-2">
                    Or try the web app now →
                  </button>
                </Link>
              </div>
            </div>
          </SectionReveal>

          <SectionReveal>
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="flex justify-center md:justify-end"
            >
              <div className="relative">
                <div className="absolute -inset-5 rounded-[2rem] opacity-15 blur-2xl" style={{ background: "hsl(32 95% 54%)" }} />
                <div className="relative drop-shadow-xl">
                  <ExtensionMockup />
                </div>
              </div>
            </motion.div>
          </SectionReveal>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="reviews" className="py-24 px-5 sm:px-8 bg-[hsl(36_18%_92%)]">
        <div className="max-w-5xl mx-auto">
          <SectionReveal className="text-center mb-14">
            <Eyebrow>From users</Eyebrow>
            <h2
              className="font-bold text-stone-900"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", letterSpacing: "-0.02em" }}
            >
              Real decisions. Real outcomes.
            </h2>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TESTIMONIALS.map(({ quote, name, role, stars, avatar }) => (
              <motion.div
                key={name}
                variants={scaleIn}
                whileHover={{ y: -4, boxShadow: "0 20px 48px rgba(0,0,0,0.08)" }}
                className="relative bg-white rounded-2xl p-7 border border-stone-100 shadow-sm overflow-hidden transition-shadow"
              >
                {/* Decorative quote mark */}
                <span
                  className="absolute top-4 right-6 text-[72px] font-black leading-none select-none pointer-events-none"
                  style={{ color: "hsl(38 20% 93%)", fontFamily: "Georgia, serif" }}
                  aria-hidden
                >
                  "
                </span>

                <div className="relative">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-stone-700 leading-relaxed mb-5 text-sm">"{quote}"</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ background: "hsl(32 95% 54% / 0.12)", color: "hsl(32 95% 44%)" }}
                    >
                      {avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900 text-sm">{name}</p>
                      <p className="text-stone-400 text-xs">{role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-5 sm:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionReveal className="text-center mb-14">
            <Eyebrow>Pricing</Eyebrow>
            <h2
              className="font-bold text-stone-900"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", letterSpacing: "-0.02em" }}
            >
              One price. The whole picture.
            </h2>
            <p className="text-stone-500 text-sm mt-3 max-w-md mx-auto leading-relaxed">
              Start free. Upgrade when you want the full purchase outcome suite.
            </p>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                description: "For occasional buyers",
                features: ["5 verdicts per month", "Basic return tracking", "3 saved items", "Web app access"],
                cta: "Get started",
                href: "/app",
                highlighted: false,
              },
              {
                name: "Pro",
                price: "$9.99",
                period: "/month",
                badge: "14 days free",
                description: "For mindful spenders",
                features: ["Unlimited verdicts", "Full return suite", "Subscription tracking", "Price drop alerts", "Actions & drafts", "Saved items — unlimited"],
                cta: "Start free trial",
                href: "/app",
                highlighted: true,
              },
              {
                name: "Family",
                price: "$19.99",
                period: "/month",
                description: "For households",
                features: ["Everything in Pro", "Up to 5 members", "Shared purchase tracking", "Family spending insights"],
                cta: "Try Family",
                href: "/app",
                highlighted: false,
              },
              {
                name: "Concierge",
                price: "$49.99",
                period: "/month",
                description: "For high-volume buyers",
                features: ["Everything in Family", "Dedicated advisor", "Resale assistance", "Negotiation drafts", "Priority support"],
                cta: "Contact us",
                href: "/app",
                highlighted: false,
              },
            ].map(({ name, price, period, badge, description, features, cta, href, highlighted }) => (
              <motion.div
                key={name}
                variants={scaleIn}
                className={cn(
                  "relative rounded-2xl border p-6 flex flex-col gap-5",
                  highlighted
                    ? "border-amber-300 shadow-lg shadow-amber-100/50"
                    : "border-stone-100 shadow-sm"
                )}
              >
                {highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wide"
                      style={{ background: "hsl(32 95% 54%)" }}>
                      {badge}
                    </span>
                  </div>
                )}
                {highlighted && <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-amber-400" />}

                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{name}</p>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-black text-stone-900 tracking-tight">{price}</span>
                    <span className="text-sm text-stone-400 font-medium">{period}</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">{description}</p>
                </div>

                <ul className="space-y-2 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-stone-600">
                      <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-px" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href={href}>
                  <button
                    className={cn(
                      "w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
                      highlighted
                        ? "text-white hover:brightness-110"
                        : "text-stone-700 bg-stone-100 hover:bg-stone-200"
                    )}
                    style={highlighted ? { background: "hsl(32 95% 54%)" } : undefined}
                  >
                    {cta}
                  </button>
                </Link>
              </motion.div>
            ))}
          </StaggerReveal>

          <SectionReveal className="mt-8 text-center">
            <p className="text-xs text-stone-400">
              No credit card required to start. Cancel anytime. Stripe-secured billing.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        className="py-32 px-5 sm:px-8 relative overflow-hidden"
        style={{ background: "linear-gradient(155deg, hsl(20 25% 7%) 0%, hsl(24 22% 11%) 60%, hsl(20 25% 7%) 100%)" }}
      >
        {/* Glow layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[60%] h-[50%] opacity-20 blur-3xl rounded-full"
            style={{ background: "hsl(32 95% 54%)" }}
          />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] opacity-8 blur-2xl rounded-full"
            style={{ background: "hsl(32 95% 64%)" }}
          />
        </div>

        <SectionReveal className="relative max-w-2xl mx-auto text-center space-y-7">
          <h2
            className="font-black text-white leading-tight"
            style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", letterSpacing: "-0.03em" }}
          >
            Buy smarter.<br />
            Recover more.<br />
            <span style={{ color: "hsl(32 95% 64%)" }}>Regret less.</span>
          </h2>
          <p className="text-white/45 text-base leading-relaxed max-w-md mx-auto">
            Make better purchase decisions and take smarter action after checkout — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/app">
              <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}>
                <button
                  className="flex items-center justify-center gap-2 px-10 py-4 rounded-full text-base font-bold text-white"
                  style={{
                    background: "hsl(32 95% 54%)",
                    boxShadow: "0 10px 48px hsl(32 95% 54% / 0.50), 0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  <Sparkles className="w-4 h-4" /> Try Worthly AI
                </button>
              </motion.div>
            </Link>
            <button
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white/65 border transition-all hover:text-white hover:bg-white/8"
              style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)" }}
              onClick={() => document.querySelector("#preview")?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore demo
            </button>
          </div>

          <p className="text-white/22 text-xs pt-1 tracking-wide">
            Free to start · Amazon · Target · Walmart · Shopify
          </p>
        </SectionReveal>
      </section>

      {/* ── Footer ── */}
      <footer
        className="py-8 px-5 sm:px-8 border-t"
        style={{ background: "hsl(20 25% 5%)", borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(32 95% 54% / 0.65)" }}
            >
              <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
                <path d="M3 5L6 15L9 9L12 15L15 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-semibold text-white/40">Worthly AI</span>
            <span className="text-white/20">·</span>
            <span className="text-white/25 text-xs">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/25">
            <Link href="/app" className="hover:text-white/50 transition-colors">Product</Link>
            <Link href="/saved" className="hover:text-white/50 transition-colors">Saved</Link>
            <Link href="/app/verdicts" className="hover:text-white/50 transition-colors">Ask Worthly AI</Link>
            <Link href="/settings" className="hover:text-white/50 transition-colors">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
