"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Sparkles, Shield, TrendingDown, BarChart2, Heart,
  RefreshCcw, ArrowRight, Check, Star, ChevronRight,
  Play, Pause, Volume2, VolumeX, Maximize2, Zap,
  Target, X,
} from "lucide-react";

// ── Asset constants — swap these when real assets are available ─────────────
const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1800&q=80&fit=crop&auto=format";
// Fallback: shopping lifestyle image
// Replace with: "/assets/hero-bg.jpg" when you have the real asset

const DEMO_VIDEO_SRC = ""; // Replace with "/assets/worthly-demo.mp4" or YouTube embed
const DEMO_POSTER_URL =
  "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1400&q=75&fit=crop&auto=format";

// ── Data ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Shield,
    title: "Return window tracking",
    body: "Never miss a return deadline again. Worthly tracks every purchase and alerts you before the window closes.",
    color: "from-red-500/15 to-red-400/5",
  },
  {
    icon: RefreshCcw,
    title: "Subscription cleanup",
    body: "AI scans your subscriptions and flags unused or duplicate services — with a cancel draft ready to send.",
    color: "from-blue-500/15 to-blue-400/5",
  },
  {
    icon: TrendingDown,
    title: "Price match recovery",
    body: "Found it cheaper elsewhere? Worthly drafts the price-match request so you get refunded in minutes.",
    color: "from-emerald-500/15 to-emerald-400/5",
  },
  {
    icon: BarChart2,
    title: "Action assistant",
    body: "One-tap access to copy-ready emails for returns, cancellations, refunds, and rate negotiations.",
    color: "from-violet-500/15 to-violet-400/5",
  },
  {
    icon: Target,
    title: "Buy / Wait / Skip verdicts",
    body: "Before you spend, get a structured verdict scored on fit, value, and regret risk — not sponsored placement.",
    color: "from-amber-500/15 to-amber-400/5",
  },
  {
    icon: Heart,
    title: "Works for your wallet",
    body: "Worthly makes money when you save money. No affiliate bias, no sponsored rankings.",
    color: "from-rose-500/15 to-rose-400/5",
  },
];

const EXAMPLES = [
  { category: "Return tracked", query: "Nike Air Max 270 — return window closes in 12 days", verdict: "Act", score: 150 },
  { category: "Cancelled",      query: "Disney+ flagged as unused for 2 months — $167 saved",  verdict: "Saved", score: 168 },
  { category: "Price matched",  query: "Samsung TV — $150 refunded via Best Buy price match",  verdict: "Got $150", score: 150 },
  { category: "Verdict",        query: "Sony WH-1000XM5 vs Bose QC45 under $300",              verdict: "Buy", score: 91 },
];

const TESTIMONIALS = [
  {
    quote: "Worthly alerted me that my Nike return window was closing in 4 days. I'd completely forgotten. Got my $150 back.",
    name: "Marcus T.", role: "Product designer", stars: 5,
    avatar: "M",
  },
  {
    quote: "Found 3 unused subscriptions totalling $68/month. Worthly had the cancellation emails ready to copy in one tap.",
    name: "Priya K.", role: "Software engineer", stars: 5,
    avatar: "P",
  },
  {
    quote: "Got $150 back on my TV via a Best Buy price match. Worthly spotted the price difference and drafted the email.",
    name: "James O.", role: "Finance analyst", stars: 5,
    avatar: "J",
  },
  {
    quote: "The Buy/Wait/Skip verdict saved me from a $300 impulse buy. Turned out the $120 option scored higher for my use case.",
    name: "Sofia M.", role: "Stylist", stars: 5,
    avatar: "S",
  },
];

const ROTATING_QUERIES = [
  "Return window closes in 3 days — act before it's too late",
  "Disney+ not used in 2 months — cancel now, save $168/year",
  "Samsung TV cheaper at Costco — get $150 back via price match",
  "Subscription audit found $54/mo in unused services",
  "Nike order returnable — $149 still recoverable",
  "Before you buy: get a Buy / Wait / Skip verdict in 30 seconds",
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Add your purchases",
    body: "Snap a receipt or enter an order manually. Worthly tracks return windows, prices, and merchants automatically.",
  },
  {
    step: "02",
    title: "Get recovery opportunities",
    body: "Worthly spots expiring return windows, unused subscriptions, and price-match opportunities — before you lose them.",
  },
  {
    step: "03",
    title: "Act with one tap",
    body: "Every opportunity comes with a copy-ready email draft. Send it in seconds — no composing required.",
  },
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

function AnimatedScore({ value }: { value: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(value / 30);
    const timer = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplayed(start);
      if (start >= value) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, [inView, value]);

  return <span ref={ref}>{displayed}</span>;
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

// ── Demo Video Section ────────────────────────────────────────────────────────
function DemoVideoSection() {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function togglePlay() {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play();
      setPlaying(true);
    }
  }

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  }

  // If no video src, show a polished placeholder
  const hasVideo = Boolean(DEMO_VIDEO_SRC);

  return (
    <section className="py-24 px-6 bg-[hsl(38_25%_97%)] relative overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle at 60% 50%, hsl(32 95% 54%) 0%, transparent 60%)" }} />

      <div className="max-w-5xl mx-auto relative">
        <SectionReveal>
          <div className="text-center space-y-3 mb-12">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Live Demo</p>
            <h2 className="font-bold text-stone-900" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
              See a real Worthly verdict
            </h2>
            <p className="text-stone-500 max-w-lg mx-auto text-[1.05rem]">
              Watch how Worthly turns a buying question into a scored, structured decision in under 30 seconds.
            </p>
          </div>
        </SectionReveal>

        <SectionReveal>
          {/* Video container */}
          <div className="relative group rounded-3xl overflow-hidden shadow-2xl"
            style={{ border: "1px solid rgba(0,0,0,0.07)" }}>

            {hasVideo ? (
              <>
                {/* Real video */}
                <video
                  ref={videoRef}
                  src={DEMO_VIDEO_SRC}
                  poster={DEMO_POSTER_URL}
                  muted
                  loop
                  playsInline
                  className="w-full aspect-video object-cover bg-stone-900"
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                />

                {/* Controls overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors duration-300">
                  <motion.button
                    onClick={togglePlay}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.96 }}
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "hsl(32 95% 54%)" }}
                    aria-label={playing ? "Pause demo" : "Play demo"}
                  >
                    {playing
                      ? <Pause className="w-6 h-6 text-white" />
                      : <Play className="w-6 h-6 text-white ml-0.5" />}
                  </motion.button>
                </div>

                {/* Bottom controls bar */}
                <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between
                  bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={toggleMute} className="text-white/80 hover:text-white transition-colors">
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setModalOpen(true)} className="text-white/80 hover:text-white transition-colors">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              /* ── Placeholder when no video file ── */
              <div
                className="w-full aspect-video flex flex-col items-center justify-center relative"
                style={{
                  background: "linear-gradient(135deg, hsl(20 25% 10%) 0%, hsl(25 20% 15%) 100%)",
                }}
              >
                {/* Poster / bg image */}
                <img
                  src={DEMO_POSTER_URL}
                  alt="Worthly demo preview"
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                />

                {/* Browser chrome mockup */}
                <div className="relative z-10 w-full max-w-xl mx-6">
                  {/* Browser bar */}
                  <div className="bg-stone-800/90 backdrop-blur rounded-t-xl px-4 py-2.5 flex items-center gap-2 border border-white/10">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400/60" />
                      <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                      <div className="w-3 h-3 rounded-full bg-green-400/60" />
                    </div>
                    <div className="flex-1 bg-stone-700/60 rounded-md px-3 py-1 text-xs text-white/40 text-center">
                      worthlyai.app/app
                    </div>
                  </div>

                  {/* Screen area */}
                  <div className="bg-[hsl(38_25%_97%)] rounded-b-xl p-4 space-y-3 border-x border-b border-white/10">
                    <div className="bg-white rounded-xl p-3 border border-stone-100 shadow-sm space-y-2">
                      <p className="text-xs text-stone-400">What are you deciding on?</p>
                      <p className="text-sm text-stone-700 font-medium">Best wireless headphones for commuting under $250</p>
                    </div>
                    <div className="flex gap-1.5">
                      {["Electronics", "Under $250", "Commuting"].map((tag, i) => (
                        <span key={tag} className={`text-xs px-2 py-0.5 rounded-full border font-medium
                          ${i === 0 ? "bg-amber-50 border-amber-200 text-amber-700" : "border-stone-200 text-stone-500"}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-wide">Verdict</p>
                        <p className="text-xs font-bold text-stone-900">Buy — Sony WH-1000XM5</p>
                      </div>
                      <span className="text-lg font-bold text-amber-500">91</span>
                    </div>
                  </div>
                </div>

                {/* Play button */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer"
                  aria-label="Play demo video"
                  onClick={() => alert("Demo video coming soon — drop your MP4 at /assets/worthly-demo.mp4")}
                >
                  <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm"
                    style={{ background: "hsl(32 95% 54%)", boxShadow: "0 0 0 16px hsl(32 95% 54% / 0.15)" }}>
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </motion.button>

                {/* "Demo coming soon" badge */}
                <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur text-white/60 text-xs
                  px-2.5 py-1 rounded-full border border-white/10">
                  Demo video coming soon
                </div>
              </div>
            )}
          </div>

          {/* Sub-caption */}
          <p className="text-center text-sm text-stone-400 mt-4">
            30-second walkthrough · No signup required to try
          </p>
        </SectionReveal>
      </div>

      {/* Modal for expanded video */}
      <AnimatePresence>
        {modalOpen && hasVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-6"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <video
                src={DEMO_VIDEO_SRC}
                poster={DEMO_POSTER_URL}
                controls
                autoPlay
                className="w-full aspect-video bg-black"
              />
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
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
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "hsl(32 95% 54%)" }}>
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
              <path d="M3 5L6 15L9 9L12 15L15 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 9L17 11L19 8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
            </svg>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Worthly</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-white/65">
          {[
            { href: "#features", label: "Features" },
            { href: "#examples", label: "Examples" },
            { href: "#reviews",  label: "Reviews" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={e => {
                e.preventDefault();
                const el = document.querySelector(href);
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="hover:text-white transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        <Link href="/app">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button size="sm" className="gap-1.5 rounded-full font-semibold text-white"
              style={{ background: "hsl(32 95% 54%)" }}>
              Protect my money <ArrowRight className="w-3.5 h-3.5" />
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
        title: "Worthly — AI Purchase Protection & Money Recovery",
        description: "Track return windows, cancel unused subscriptions, and recover money via price matches — with AI-drafted emails ready in seconds.",
        canonical: "https://worthlyai.app/",
      })
    );
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <StickyHeader />

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative min-h-[95vh] flex items-center overflow-hidden"
      >
        {/* Parallax background image */}
        <motion.div
          className="absolute inset-0 scale-110"
          style={{ y: heroBgY }}
        >
          <img
            src={HERO_IMAGE_URL}
            alt=""
            aria-hidden
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Multi-layer overlay for depth and readability */}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, rgba(14,9,5,0.90) 0%, rgba(20,12,5,0.75) 50%, rgba(12,8,3,0.85) 100%)" }} />
          {/* Amber warmth hint */}
          <div className="absolute inset-0 opacity-20"
            style={{ background: "radial-gradient(ellipse at 30% 60%, hsl(32 95% 40%) 0%, transparent 55%)" }} />
          {/* Top vignette */}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.15) 100%)" }} />
        </motion.div>

        {/* Hero content */}
        <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-24 grid md:grid-cols-2 gap-16 items-center w-full">

          {/* Left copy */}
          <motion.div
            className="space-y-7"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          >
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <span
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-amber-300 uppercase tracking-wide"
                style={{ background: "hsl(32 95% 54% / 0.14)", border: "1px solid hsl(32 95% 54% / 0.28)" }}
              >
                <Shield className="w-3.5 h-3.5" /> AI purchase protection · free to start
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="font-bold text-white leading-[1.08]"
              style={{ fontSize: "clamp(2.6rem, 4.5vw, 3.8rem)", letterSpacing: "-0.02em" }}
            >
              Protect your money<br />
              <span style={{ color: "hsl(32 95% 62%)" }}>after every<br />purchase.</span>
            </motion.h1>

            {/* Sub-copy */}
            <motion.p
              variants={fadeUp}
              className="text-white/60 leading-relaxed max-w-md"
              style={{ fontSize: "1.08rem" }}
            >
              Track return windows, cancel unused subscriptions, and recover money via price matches —
              all with <strong className="text-white/80 font-semibold">AI-drafted emails</strong> ready to send in seconds.
            </motion.p>

            {/* Rotating value prop */}
            <motion.div variants={fadeUp} className="flex items-center gap-2">
              <span className="text-xs text-amber-500/70 font-medium uppercase tracking-wide shrink-0">Latest:</span>
              <RotatingQuery />
            </motion.div>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
              <Link href="/app">
                <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    className="h-13 px-8 gap-2 rounded-full font-semibold text-white shadow-lg"
                    style={{
                      background: "hsl(32 95% 54%)",
                      boxShadow: "0 8px 32px hsl(32 95% 54% / 0.40)",
                    }}
                  >
                    <Shield className="w-4 h-4" /> Protect my purchases
                  </Button>
                </motion.div>
              </Link>
              <motion.a
                href="#demo"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={e => {
                  e.preventDefault();
                  document.querySelector("#demo")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="h-13 px-7 rounded-full border-white/20 text-white bg-white/5 hover:bg-white/10 gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> Watch demo
                </Button>
              </motion.a>
            </motion.div>

            {/* Trust micro-copy */}
            <motion.div variants={fadeUp} className="flex items-center gap-5 text-sm text-white/35">
              {["Free to start", "No credit card", "Works instantly"].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400" /> {t}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: floating product card mockup */}
          <motion.div
            className="flex justify-center md:justify-end"
            initial={{ opacity: 0, x: 30, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ opacity: heroOpacity }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Drop shadow glow */}
              <div className="relative">
                <div className="absolute -inset-6 rounded-4xl opacity-30 blur-2xl"
                  style={{ background: "hsl(32 95% 54%)" }} />

                <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-stone-100/80 backdrop-blur">
                  <div className="space-y-4">
                    {/* Input preview */}
                    <div>
                      <p className="text-xs text-stone-400 mb-1 font-medium">What are you deciding on?</p>
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                        <p className="text-sm text-stone-700">Best wireless headphones for commuting under $250...</p>
                      </div>
                    </div>

                    {/* Category chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {["Electronics", "Fashion", "Home"].map((c, i) => (
                        <span key={c}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium ${i === 0
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "border-stone-200 text-stone-500"
                          }`}>
                          {c}
                        </span>
                      ))}
                    </div>

                    {/* Budget bar */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-400 font-medium">Budget</span>
                      <span className="font-bold text-amber-600">Up to $250</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-amber-400"
                        initial={{ width: 0 }}
                        animate={{ width: "25%" }}
                        transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>

                    {/* Verdict card */}
                    <motion.div
                      className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.1 }}
                    >
                      <div>
                        <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Verdict</p>
                        <p className="font-bold text-stone-900 text-sm">Buy — Sony WH-1000XM5</p>
                      </div>
                      <span className="text-xl font-bold text-amber-500">91</span>
                    </motion.div>

                    {/* Score bars */}
                    <div className="space-y-1.5 pt-1">
                      {[
                        { label: "Fit", value: 92, color: "bg-amber-400" },
                        { label: "Value", value: 85, color: "bg-emerald-400" },
                        { label: "Proof", value: 90, color: "bg-blue-400" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex items-center gap-2 text-xs">
                          <span className="text-stone-400 w-8 shrink-0">{label}</span>
                          <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${color}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${value}%` }}
                              transition={{ duration: 1.0, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                          <span className="text-stone-500 font-medium w-6 text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom fade-to-cream */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, hsl(38 25% 97%))" }} />
      </section>

      {/* ── Trusted band ── */}
      <div className="bg-[hsl(38_25%_97%)] py-6 px-6 border-b border-stone-100">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-stone-400">
          <span className="font-medium text-stone-500">Your money, defended</span>
          <div className="hidden sm:block w-px h-4 bg-stone-200" />
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {["Return window alerts", "Subscription audit", "Price match recovery", "AI-drafted emails"].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Demo Video ── */}
      <div id="demo">
        <DemoVideoSection />
      </div>

      {/* ── Not just an app callout ── */}
      <section className="py-16 px-6 bg-[hsl(38_25%_97%)]">
        <div className="max-w-4xl mx-auto">
          <StaggerReveal className="grid md:grid-cols-2 gap-5">
            <motion.div variants={scaleIn}
              className="bg-red-50/80 border border-red-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-4">Money lost without Worthly</p>
              {["Missing a 30-day return deadline", "Paying for subscriptions you never use", "Not claiming a $150 price match", "Buying wrong and having no recourse"].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-red-700 py-1.5">
                  <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-400 font-bold text-xs shrink-0">✗</span>
                  {t}
                </div>
              ))}
            </motion.div>
            <motion.div variants={scaleIn}
              className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-4">Money protected with Worthly</p>
              {["Return deadline tracked and alerted", "Unused subscriptions cancelled", "Price match request drafted & sent", "Buy verdict scored before you spend"].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-emerald-800 py-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 font-bold text-xs shrink-0">✓</span>
                  {t}
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
              Every dollar defended
            </h2>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, body, color }) => (
              <motion.div
                key={title}
                variants={scaleIn}
                whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.08)" }}
                className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm space-y-3 cursor-default transition-shadow"
              >
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

      {/* ── How it works ── */}
      <section className="py-24 px-6" style={{ background: "linear-gradient(180deg, hsl(38 25% 97%) 0%, hsl(38 20% 93%) 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <SectionReveal className="text-center mb-14">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="font-bold text-stone-900" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
              Track, recover, protect — in minutes
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

      {/* ── Examples ── */}
      <section id="examples" className="py-24 px-6" style={{ background: "hsl(20 25% 8%)" }}>
        <div className="max-w-5xl mx-auto">
          <SectionReveal className="text-center mb-14">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3">Examples</p>
            <h2 className="font-bold text-white" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
              Real purchases, real savings
            </h2>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXAMPLES.map(({ category, query, verdict, score }) => (
              <motion.div
                key={query}
                variants={scaleIn}
                whileHover={{ scale: 1.02, y: -2 }}
                className="rounded-2xl p-5 space-y-4 cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <p className="text-xs font-medium text-amber-400/60 uppercase tracking-wide">{category}</p>
                <p className="text-sm text-white/80 leading-relaxed">"{query}"</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs px-3 py-1 rounded-full font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    ✓ {verdict}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold text-amber-400">
                      ${score}
                    </span>
                    <span className="text-xs text-white/25">saved</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </StaggerReveal>

          <SectionReveal className="text-center mt-10">
            <Link href="/app">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
                <Button className="gap-2 rounded-full font-semibold h-11 px-7"
                  style={{ background: "hsl(32 95% 54%)", color: "white" }}>
                  Protect my purchases <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </Link>
          </SectionReveal>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section id="reviews" className="py-24 px-6 bg-[hsl(36_20%_93%)]">
        <div className="max-w-5xl mx-auto">
          <SectionReveal className="text-center mb-14">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">Reviews</p>
            <h2 className="font-bold text-stone-900" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
              Real money recovered
            </h2>
          </SectionReveal>

          <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TESTIMONIALS.map(({ quote, name, role, stars, avatar }) => (
              <motion.div
                key={name}
                variants={scaleIn}
                whileHover={{ y: -3, boxShadow: "0 16px 40px rgba(0,0,0,0.07)" }}
                className="bg-white rounded-2xl p-7 border border-stone-100 shadow-sm transition-shadow"
              >
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
        {/* Glow */}
        <div className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 100%, hsl(32 95% 54%) 0%, transparent 60%)" }} />

        <SectionReveal className="max-w-xl mx-auto text-center space-y-6 relative">
          <h2 className="font-bold text-white leading-tight" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}>
            Start protecting your purchases today.
          </h2>
          <p className="text-white/50 text-[1.05rem]">
            Free to start. No credit card. See your first recovery opportunity in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/app">
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="h-13 px-10 gap-2 rounded-full font-semibold text-white shadow-xl"
                  style={{
                    background: "hsl(32 95% 54%)",
                    boxShadow: "0 8px 40px hsl(32 95% 54% / 0.45)",
                  }}>
                  <Shield className="w-4 h-4" /> Protect my money free
                </Button>
              </motion.div>
            </Link>
            <Link href="/app/verdicts">
              <Button variant="outline" size="lg"
                className="h-13 px-7 rounded-full border-white/15 text-white bg-white/5 hover:bg-white/10">
                <Zap className="w-4 h-4 mr-2" /> Try Buy / Wait / Skip
              </Button>
            </Link>
          </div>
          <p className="text-white/25 text-xs pt-1">
            Works for your wallet, not advertisers.
          </p>
        </SectionReveal>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t"
        style={{ background: "hsl(20 25% 6%)", borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(32 95% 54% / 0.7)" }}>
              <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
                <path d="M3 5L6 15L9 9L12 15L15 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-medium text-white/50">Worthly © 2026</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/app" className="hover:text-white/60 transition-colors">App</Link>
            <Link href="/compare" className="hover:text-white/60 transition-colors">Compare</Link>
            <Link href="/settings" className="hover:text-white/60 transition-colors">Settings</Link>
            <a href="https://worthlyai.app" className="hover:text-white/60 transition-colors" target="_blank" rel="noopener noreferrer">
              worthlyai.app
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
