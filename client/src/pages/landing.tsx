"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Sparkles, Shield, TrendingDown, BarChart2, Heart,
  RefreshCcw, ArrowRight, Check, Star, ChevronRight,
  Play, Zap, Chrome, Bookmark, Clock, AlertTriangle,
  ShoppingBag, Eye,
} from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1800&q=80&fit=crop&auto=format";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Buy / Wait / Skip verdicts",
    body: "Get a scored, structured decision before you spend. Worthly weighs value, trust, timing, and risk — not sponsored rankings.",
    color: "from-amber-500/15 to-amber-400/5",
  },
  {
    icon: ShoppingBag,
    title: "Works where you shop",
    body: "Worthly's browser extension analyzes products on Amazon, Target, Walmart, and Shopify directly on the page — no tab switching.",
    color: "from-blue-500/15 to-blue-400/5",
  },
  {
    icon: Eye,
    title: "Price tracking",
    body: "Save items you are considering and Worthly watches for price drops, so you buy at the right moment.",
    color: "from-violet-500/15 to-violet-400/5",
  },
  {
    icon: Clock,
    title: "Return window protection",
    body: "Never miss a return deadline again. Worthly tracks every purchase and alerts you before the window closes.",
    color: "from-red-500/15 to-red-400/5",
  },
  {
    icon: TrendingDown,
    title: "Price match recovery",
    body: "Found it cheaper elsewhere? Worthly drafts the price-match request so you can get refunded in minutes.",
    color: "from-emerald-500/15 to-emerald-400/5",
  },
  {
    icon: Heart,
    title: "Works for your wallet",
    body: "Worthly makes money when you save money. No affiliate bias, no sponsored rankings, no hidden fees.",
    color: "from-rose-500/15 to-rose-400/5",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Shop anywhere",
    body: "Browse products on Amazon, Target, Walmart, or Shopify. The Worthly extension activates automatically on product pages.",
  },
  {
    step: "02",
    title: "Get a verdict",
    body: "Worthly gives you a fast Buy / Wait / Skip decision with reasons you can actually understand — in seconds.",
  },
  {
    step: "03",
    title: "Save and protect",
    body: "Save items, track price changes, and keep an eye on returns and purchase protection after checkout.",
  },
];

const TESTIMONIALS = [
  {
    quote: "I was about to buy a $300 jacket on impulse. Worthly said Skip — too expensive, low ratings. Saved myself from a bad buy.",
    name: "Marcus T.", role: "Product designer", stars: 5, avatar: "M",
  },
  {
    quote: "The Buy verdict on my Sony headphones came with three reasons. I bought with confidence. No regret at all.",
    name: "Priya K.", role: "Software engineer", stars: 5, avatar: "P",
  },
  {
    quote: "Worthly flagged my return window was closing in 4 days. Completely forgot — got my $150 back.",
    name: "James O.", role: "Finance analyst", stars: 5, avatar: "J",
  },
  {
    quote: "The Wait verdict saved me $120. Waited two weeks, price dropped, then it flipped to Buy. Perfect timing.",
    name: "Sofia M.", role: "Stylist", stars: 5, avatar: "S",
  },
];

const ROTATING_QUERIES = [
  "Sony WH-1000XM5 — BUY · Score 84 · 18K reviews",
  "Vitamix A3500 — WAIT · Price may drop at Target",
  "Return window closes in 4 days — Nike Air Max",
  "Garmin Forerunner 265 — BUY · Strong value at $449",
  "Disney+ flagged as unused — cancel to save $168/yr",
  "Samsung TV — $150 cheaper at Costco right now",
];

const BEFORE_BULLETS = [
  "Understand if it is actually worth it",
  "See better timing signals before you spend",
  "Catch trust and value issues early",
  "Avoid emotional impulse buys",
];

const AFTER_BULLETS = [
  "Track return windows automatically",
  "Monitor price changes post-purchase",
  "Keep purchase history organized",
  "Get help with protection and recovery",
];

const WHY_BULLETS = [
  "Fewer impulse purchases",
  "Fewer regrets after checkout",
  "Better timing on every buy",
  "More confidence, more control",
];

// ── Animation variants ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.10 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// ── Subcomponents ─────────────────────────────────────────────────────────────

function SectionReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

function StaggerReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

function RotatingQuery() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ROTATING_QUERIES.length), 3200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative h-7 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 text-sm text-white/55 italic truncate"
        >
          "{ROTATING_QUERIES[idx]}"
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ── Extension popup mockup ────────────────────────────────────────────────────

function ExtensionMockup() {
  return (
    <div className="relative w-[340px] shadow-2xl rounded-2xl overflow-hidden border border-stone-100 bg-white text-sm font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(32 95% 54%)" }}>
            <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
              <path d="M3 5L6 15L9 9L12 15L15 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-stone-900 text-[15px]">Worthly</span>
        </div>
        <a className="text-xs font-semibold text-amber-700">Dashboard ↗</a>
      </div>

      {/* Product image */}
      <div className="bg-stone-50 border-b border-stone-100 flex items-center justify-center h-[90px]">
        <img
          src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80"
          alt="Sony headphones"
          className="h-full w-full object-contain px-4 py-2"
        />
      </div>

      {/* Product row */}
      <div className="px-4 py-3 border-b border-stone-100">
        <p className="font-semibold text-stone-900 text-[13px] leading-snug line-clamp-2 mb-2">
          Sony WH-1000XM5 Wireless Headphones
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">Amazon</span>
          <span className="text-[14px] font-extrabold text-stone-900">$279.99</span>
        </div>
      </div>

      {/* Verdict banner */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-green-200 bg-green-50">
        <div>
          <p className="text-[22px] font-black leading-none text-green-700 mb-1">BUY</p>
          <p className="text-[11px] text-stone-500">Confident purchase — good value</p>
        </div>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "conic-gradient(#22c55e 84%, #e7e5e4 0)" }}
        >
          <div className="w-[41px] h-[41px] bg-white rounded-full flex items-center justify-center">
            <span className="text-[15px] font-extrabold text-stone-900">84</span>
          </div>
        </div>
      </div>

      {/* Reasons */}
      <ul className="px-4 py-3 space-y-1.5 border-b border-stone-100">
        {["Strong 4.6★ customer rating", "18K+ verified reviews", "Amazon buyer protection included"].map(r => (
          <li key={r} className="flex items-start gap-2 text-[12px] text-stone-600">
            <span className="text-green-600 font-bold mt-px text-[11px]">✓</span>
            {r}
          </li>
        ))}
      </ul>

      {/* Actions */}
      <div className="px-4 py-3 space-y-2">
        <button className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white" style={{ background: "hsl(32 95% 54%)" }}>
          Save to Worthly
        </button>
        <a className="block w-full py-2.5 rounded-xl text-[13px] font-semibold text-stone-500 text-center border border-stone-200 bg-white">
          View on Amazon ↗
        </a>
      </div>
    </div>
  );
}

// ── On-page widget mockup ─────────────────────────────────────────────────────

function WidgetMockup() {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      className="cursor-pointer select-none"
      onClick={() => setExpanded(e => !e)}
      animate={{ width: expanded ? 280 : "auto" }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {!expanded ? (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-white text-xs font-bold"
          style={{ background: "hsl(32 95% 54%)" }}
        >
          <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px]">W</span>
          <span className="text-green-100">BUY</span>
          <span className="text-white/70">·</span>
          <span>84</span>
          <span className="text-white/50 text-[10px]">›</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl border border-stone-100 p-4 w-[280px] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Worthly</span>
            <button className="text-stone-300 text-xs">−</button>
          </div>
          <div className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-2.5 border border-green-100">
            <div>
              <p className="text-xl font-black text-green-700 leading-none">BUY</p>
              <p className="text-[10px] text-stone-400 mt-0.5">Confident purchase</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "conic-gradient(#22c55e 84%, #f0f0ee 0)" }}>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-[13px] font-extrabold text-stone-900">84</span>
              </div>
            </div>
          </div>
          <ul className="space-y-1">
            {["4.6★ · 18K reviews", "Amazon buyer protection", "Strong value for price"].map(r => (
              <li key={r} className="text-[11px] text-stone-600 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-green-400 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
          <button className="w-full py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: "hsl(32 95% 54%)" }}>
            Save to Worthly
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Sticky Header ─────────────────────────────────────────────────────────────

function StickyHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(20,14,9,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.25)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "hsl(32 95% 54%)" }}>
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
              <path d="M3 5L6 15L9 9L12 15L15 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Worthly</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-white/65">
          {[
            { href: "#how", label: "How it works" },
            { href: "#features", label: "Features" },
            { href: "#reviews", label: "Reviews" },
          ].map(({ href, label }) => (
            <a key={href} href={href}
              onClick={e => { e.preventDefault(); document.querySelector(href)?.scrollIntoView({ behavior: "smooth" }); }}
              className="hover:text-white transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        <Link href="/app">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button size="sm" className="gap-1.5 rounded-full font-semibold text-white" style={{ background: "hsl(32 95% 54%)" }}>
              Try Worthly <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        </Link>
      </div>
    </motion.header>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroBgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    import("@/lib/seo").then(({ applySeo }) =>
      applySeo({
        title: "Worthly — AI Shopping Copilot · Buy / Wait / Skip",
        description: "Worthly is your AI shopping copilot. Get instant Buy / Wait / Skip verdicts, track prices, protect returns, and shop with less regret.",
        canonical: "https://worthlyai.app/",
      })
    );
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <StickyHeader />

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-[95vh] flex items-center overflow-hidden">
        <motion.div className="absolute inset-0 scale-110" style={{ y: heroBgY }}>
          <img src={HERO_IMAGE_URL} alt="" aria-hidden className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(14,9,5,0.92) 0%, rgba(20,12,5,0.78) 50%, rgba(12,8,3,0.88) 100%)" }} />
          <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at 30% 60%, hsl(32 95% 40%) 0%, transparent 55%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.15) 100%)" }} />
        </motion.div>

        <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-24 grid md:grid-cols-2 gap-16 items-center w-full">
          {/* Left copy */}
          <motion.div className="space-y-7" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.12 } } }}>
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-amber-300 uppercase tracking-wide"
                style={{ background: "hsl(32 95% 54% / 0.14)", border: "1px solid hsl(32 95% 54% / 0.28)" }}>
                <Sparkles className="w-3.5 h-3.5" /> AI shopping copilot · free to start
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-bold text-white leading-[1.08]"
              style={{ fontSize: "clamp(2.6rem, 4.5vw, 3.8rem)", letterSpacing: "-0.02em" }}>
              Buy with<br />
              <span style={{ color: "hsl(32 95% 62%)" }}>less regret.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-white/60 leading-relaxed max-w-md" style={{ fontSize: "1.08rem" }}>
              Worthly is your AI shopping copilot. It helps you decide if a product is truly worth buying
              with instant <strong className="text-white/80 font-semibold">Buy / Wait / Skip</strong> verdicts,
              then tracks prices, returns, and purchase protection after checkout.
            </motion.p>

            <motion.div variants={fadeUp} className="flex items-center gap-2">
              <span className="text-xs text-amber-500/70 font-medium uppercase tracking-wide shrink-0">Now:</span>
              <RotatingQuery />
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
              <Link href="/app">
                <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="h-13 px-8 gap-2 rounded-full font-semibold text-white shadow-lg"
                    style={{ background: "hsl(32 95% 54%)", boxShadow: "0 8px 32px hsl(32 95% 54% / 0.40)" }}>
                    <Sparkles className="w-4 h-4" /> Try Worthly
                  </Button>
                </motion.div>
              </Link>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button variant="outline" size="lg"
                  className="h-13 px-7 rounded-full border-white/20 text-white bg-white/5 hover:bg-white/10 gap-2"
                  onClick={() => document.querySelector("#extension")?.scrollIntoView({ behavior: "smooth" })}>
                  <Chrome className="w-4 h-4" /> Add to Chrome
                </Button>
              </motion.div>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-center gap-2 text-xs text-white/35">
              <Check className="w-3.5 h-3.5 text-amber-400" />
              Works on Amazon, Target, Walmart, and Shopify stores.
            </motion.div>
          </motion.div>

          {/* Right: extension popup mockup */}
          <motion.div
            className="flex justify-center md:justify-end"
            initial={{ opacity: 0, x: 30, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ opacity: heroOpacity }}
          >
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
              <div className="relative">
                <div className="absolute -inset-6 rounded-4xl opacity-30 blur-2xl" style={{ background: "hsl(32 95% 54%)" }} />
                <div className="relative">
                  <ExtensionMockup />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, hsl(38 25% 97%))" }} />
      </section>

      {/* ── Trust band ── */}
      <div className="bg-[hsl(38_25%_97%)] py-6 px-6 border-b border-stone-100">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-stone-400">
          <span className="font-medium text-stone-500">Shop smarter, regret less</span>
          <div className="hidden sm:block w-px h-4 bg-stone-200" />
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {["Buy / Wait / Skip verdicts", "Price tracking", "Return protection", "Browser extension"].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <section id="how" className="py-24 px-6" style={{ background: "linear-gradient(180deg, hsl(38 25% 97%) 0%, hsl(38 20% 93%) 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <SectionReveal className="text-center mb-14">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="font-bold text-stone-900" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
              How Worthly works
            </h2>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, body }, i) => (
              <motion.div key={step} variants={fadeUp} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px border-t border-dashed border-stone-200 z-0 -translate-x-1/2" />
                )}
                <div className="relative z-10 space-y-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg"
                    style={{ background: "hsl(32 95% 54% / 0.10)", color: "hsl(32 95% 45%)", border: "1px solid hsl(32 95% 54% / 0.18)" }}>
                    {step}
                  </div>
                  <h3 className="font-bold text-stone-900 text-base">{title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">{body}</p>
                </div>
              </motion.div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ── More than a chatbot ── */}
      <section className="py-16 px-6 bg-[hsl(38_25%_97%)]">
        <div className="max-w-4xl mx-auto">
          <SectionReveal className="text-center mb-10">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">Why Worthly</p>
            <h2 className="font-bold text-stone-900 mb-3" style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)" }}>
              More than a shopping chatbot
            </h2>
            <p className="text-stone-500 max-w-lg mx-auto text-[1.02rem] leading-relaxed">
              Worthly does not just list products. It helps you make better decisions.
              It looks at value, trust, timing, and risk so you can shop with more confidence and less regret.
            </p>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Buy with confidence", icon: "✓", color: "bg-green-50 border-green-100 text-green-700" },
              { label: "Spot risky purchases", icon: "⚠", color: "bg-red-50 border-red-100 text-red-600" },
              { label: "Save smarter", icon: "💡", color: "bg-amber-50 border-amber-100 text-amber-700" },
              { label: "Protect purchases", icon: "🛡", color: "bg-blue-50 border-blue-100 text-blue-700" },
            ].map(({ label, icon, color }) => (
              <motion.div key={label} variants={scaleIn}
                className={`rounded-2xl border p-5 text-center space-y-2 ${color}`}>
                <div className="text-2xl">{icon}</div>
                <p className="font-semibold text-sm leading-snug">{label}</p>
              </motion.div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ── Extension section ── */}
      <section id="extension" className="py-24 px-6 bg-[hsl(38_25%_97%)]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Copy */}
            <SectionReveal>
              <div className="space-y-6">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Browser extension</p>
                <h2 className="font-bold text-stone-900" style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)" }}>
                  Worthly lives where you shop
                </h2>
                <p className="text-stone-500 leading-relaxed">
                  Use the Worthly Chrome extension to analyze products directly on product pages.
                  No switching tabs. No guessing. No overthinking.
                </p>
                <ul className="space-y-3">
                  {[
                    "Instant Buy / Wait / Skip verdicts",
                    "Save products to your Worthly dashboard",
                    "Track items you are considering",
                    "Stay protected after you buy",
                  ].map(b => (
                    <li key={b} className="flex items-center gap-2.5 text-sm text-stone-700">
                      <Check className="w-4 h-4 text-amber-500 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button size="lg" className="gap-2 rounded-full font-semibold text-white h-12 px-7"
                    style={{ background: "hsl(32 95% 54%)" }}
                    onClick={() => document.getElementById("extension-notice")?.scrollIntoView({ behavior: "smooth" })}>
                    <Chrome className="w-4 h-4" /> Add Worthly to Chrome
                  </Button>
                </div>
                <p id="extension-notice"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-full">
                  <Zap className="w-3 h-3" />
                  Chrome Web Store listing coming soon — extension available locally now
                </p>
              </div>
            </SectionReveal>

            {/* Widget demo */}
            <SectionReveal>
              <div className="relative">
                {/* Fake product page bg */}
                <div className="rounded-2xl border border-stone-200 bg-white shadow-lg overflow-hidden">
                  <div className="bg-stone-50 border-b border-stone-100 px-4 py-2.5 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-300" />
                      <div className="w-3 h-3 rounded-full bg-amber-300" />
                      <div className="w-3 h-3 rounded-full bg-green-300" />
                    </div>
                    <div className="flex-1 bg-stone-100 rounded px-3 py-1 text-xs text-stone-400 text-center">
                      amazon.com/dp/B09XS7JWHH
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-stone-100 rounded w-3/4" />
                    <div className="h-3 bg-stone-100 rounded w-1/2" />
                    <div className="h-24 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-center">
                      <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=70" alt="" className="h-20 object-contain" />
                    </div>
                    <div className="h-6 bg-stone-100 rounded w-1/3" />
                    <div className="h-3 bg-stone-50 rounded" />
                    <div className="h-3 bg-stone-50 rounded w-5/6" />
                  </div>
                </div>

                {/* Floating widget */}
                <div className="absolute bottom-4 right-4 z-10">
                  <WidgetMockup />
                </div>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ── Before / After ── */}
      <section className="py-24 px-6" style={{ background: "linear-gradient(180deg, hsl(38 25% 97%) 0%, hsl(38 20% 93%) 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <SectionReveal className="text-center mb-12">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">Before &amp; After</p>
            <h2 className="font-bold text-stone-900" style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)" }}>
              Before you buy. After you buy. Worthly stays with you.
            </h2>
          </SectionReveal>

          <StaggerReveal className="grid md:grid-cols-2 gap-5">
            <motion.div variants={scaleIn}
              className="bg-white border border-stone-100 rounded-2xl p-6 hover:shadow-md transition-shadow space-y-4">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Before purchase</p>
              {BEFORE_BULLETS.map(b => (
                <div key={b} className="flex items-start gap-2.5 text-sm text-stone-700">
                  <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs shrink-0 mt-0.5">✓</span>
                  {b}
                </div>
              ))}
            </motion.div>
            <motion.div variants={scaleIn}
              className="bg-white border border-stone-100 rounded-2xl p-6 hover:shadow-md transition-shadow space-y-4">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">After purchase</p>
              {AFTER_BULLETS.map(b => (
                <div key={b} className="flex items-start gap-2.5 text-sm text-stone-700">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs shrink-0 mt-0.5">✓</span>
                  {b}
                </div>
              ))}
            </motion.div>
          </StaggerReveal>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-[hsl(38_25%_97%)]">
        <div className="max-w-6xl mx-auto">
          <SectionReveal className="text-center mb-14">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="font-bold text-stone-900" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
              Everything you need to shop smarter
            </h2>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, body, color }) => (
              <motion.div key={title} variants={scaleIn}
                whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.08)" }}
                className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm space-y-3 cursor-default transition-shadow">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-stone-900">{title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ── Why people use it ── */}
      <section className="py-20 px-6" style={{ background: "hsl(20 25% 8%)" }}>
        <div className="max-w-4xl mx-auto">
          <SectionReveal className="text-center mb-10">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3">Why Worthly</p>
            <h2 className="font-bold text-white mb-4" style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)" }}>
              Why people use Worthly
            </h2>
            <p className="text-white/50 max-w-lg mx-auto leading-relaxed">
              Because most shopping tools help you find products.
              Worthly helps you decide what is actually worth buying.
            </p>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {WHY_BULLETS.map(b => (
              <motion.div key={b} variants={scaleIn}
                className="rounded-2xl p-4 text-sm font-medium text-white/80 flex items-center gap-2.5"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                {b}
              </motion.div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section id="reviews" className="py-24 px-6 bg-[hsl(36_20%_93%)]">
        <div className="max-w-5xl mx-auto">
          <SectionReveal className="text-center mb-14">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">Reviews</p>
            <h2 className="font-bold text-stone-900" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
              What people say
            </h2>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TESTIMONIALS.map(({ quote, name, role, stars, avatar }) => (
              <motion.div key={name} variants={scaleIn}
                whileHover={{ y: -3, boxShadow: "0 16px 40px rgba(0,0,0,0.07)" }}
                className="bg-white rounded-2xl p-7 border border-stone-100 shadow-sm transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-stone-700 leading-relaxed mb-5 text-sm">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: "hsl(32 95% 54% / 0.12)", color: "hsl(32 95% 42%)" }}>
                    {avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">{name}</p>
                    <p className="text-stone-400 text-xs">{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 px-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(20 25% 8%) 0%, hsl(25 20% 12%) 100%)" }}>
        <div className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 100%, hsl(32 95% 54%) 0%, transparent 60%)" }} />

        <SectionReveal className="max-w-xl mx-auto text-center space-y-6 relative">
          <h2 className="font-bold text-white leading-tight" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}>
            Shop smarter. Regret less.
          </h2>
          <p className="text-white/50 text-[1.05rem]">
            Use Worthly to decide faster, save better, and protect your purchases after checkout.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/app">
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="h-13 px-10 gap-2 rounded-full font-semibold text-white shadow-xl"
                  style={{ background: "hsl(32 95% 54%)", boxShadow: "0 8px 40px hsl(32 95% 54% / 0.45)" }}>
                  <Sparkles className="w-4 h-4" /> Try Worthly
                </Button>
              </motion.div>
            </Link>
            <Button variant="outline" size="lg"
              className="h-13 px-7 rounded-full border-white/15 text-white bg-white/5 hover:bg-white/10 gap-2"
              onClick={() => document.querySelector("#extension")?.scrollIntoView({ behavior: "smooth" })}>
              <Chrome className="w-4 h-4" /> Add to Chrome
            </Button>
          </div>
          <p className="text-white/25 text-xs pt-1">
            Free to start · Works on Amazon, Target, Walmart, Shopify
          </p>
        </SectionReveal>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t" style={{ background: "hsl(20 25% 6%)", borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(32 95% 54% / 0.7)" }}>
              <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
                <path d="M3 5L6 15L9 9L12 15L15 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-medium text-white/50">Worthly © 2026</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/app" className="hover:text-white/60 transition-colors">Dashboard</Link>
            <Link href="/saved" className="hover:text-white/60 transition-colors">Saved</Link>
            <Link href="/settings" className="hover:text-white/60 transition-colors">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
