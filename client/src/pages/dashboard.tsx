import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applySeo } from "@/lib/seo";
import Navbar from "@/components/Navbar";
import { MOCK_DETECTED_PRODUCTS } from "@/lib/purchases-data";
import { apiRequest } from "@/lib/queryClient";
import { getSessionId } from "@/lib/session";
import { cn } from "@/lib/utils";
import {
  Sparkles, ArrowRight, Bookmark, ExternalLink,
  Star, ChevronRight, Shield, TrendingUp, Clock,
  Zap, ShoppingBag, RotateCcw, Search, Package, CreditCard,
} from "lucide-react";
import type { DetectedProduct } from "@shared/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VerdictReason {
  label: string;
  detail: string;
}

interface VerdictResult {
  product: {
    title: string;
    merchant: string;
    price: string;
    imageUrl: string;
    rating: number;
    reviewCount: number;
  };
  verdict: "buy" | "wait" | "skip";
  score: number;        // overall display score (0-100)
  fit_score: number;
  value_score: number;
  regret_score: number;
  reasons: VerdictReason[];
  trust: string;
  value: string;
  timing: string;
}

// ─── Verdict config ───────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  buy: {
    label: "BUY",
    bg: "hsl(142 60% 45% / 0.07)",
    border: "hsl(142 60% 45% / 0.18)",
    borderCard: "hsl(142 60% 45% / 0.28)",
    text: "#15803d",
    ring: "#22c55e",
    accentBar: "bg-emerald-400",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
    icon: "✓",
    sub: "Confident purchase — good value",
  },
  wait: {
    label: "WAIT",
    bg: "hsl(32 95% 54% / 0.07)",
    border: "hsl(32 95% 54% / 0.2)",
    borderCard: "hsl(32 95% 54% / 0.3)",
    text: "#92400e",
    ring: "#f59e0b",
    accentBar: "bg-amber-400",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-200",
    icon: "–",
    sub: "Some hesitation — check timing first",
  },
  skip: {
    label: "SKIP",
    bg: "hsl(0 70% 55% / 0.06)",
    border: "hsl(0 70% 55% / 0.16)",
    borderCard: "hsl(0 70% 55% / 0.25)",
    text: "#991b1b",
    ring: "#ef4444",
    accentBar: "bg-red-400",
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    badgeBorder: "border-red-200",
    icon: "✕",
    sub: "Not recommended right now",
  },
} as const;

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_PRODUCTS = [
  {
    id: "demo1",
    result: {
      product: {
        title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
        merchant: "Amazon",
        price: "279.99",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
        rating: 4.6,
        reviewCount: 18423,
      },
      verdict: "buy" as const,
      score: 84,
      fit_score: 88,
      value_score: 82,
      regret_score: 14,
      reasons: [
        { label: "Top-rated ANC", detail: "Industry-leading noise cancellation — best in class for commute and travel use." },
        { label: "18K+ reviews", detail: "Consistently high satisfaction across verified buyers. 4.6★ average holds across 2+ years." },
        { label: "30-hr battery", detail: "Long-haul battery life covers full travel days. Foldable for commuter bags." },
      ],
      trust: "18,423 reviews with 4.6★ average. Consistent satisfaction across verified buyers.",
      value: "$279 is competitive for flagship ANC headphones — similar performance to $350+ alternatives.",
      timing: "Stable price history — no major sales expected soon. Good time to buy.",
    },
  },
  {
    id: "demo2",
    result: {
      product: {
        title: "Babyzen YOYO² Complete Stroller",
        merchant: "Target",
        price: "294.00",
        imageUrl: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&q=80",
        rating: 4.7,
        reviewCount: 6280,
      },
      verdict: "wait" as const,
      score: 66,
      fit_score: 78,
      value_score: 54,
      regret_score: 42,
      reasons: [
        { label: "Near price peak", detail: "At $294, the price is at its highest in 6 months — typically dips $40–60 around travel season." },
        { label: "Competing alternatives", detail: "Models at $220 offer similar travel functionality. Hard to justify the premium right now." },
        { label: "Strong ratings", detail: "4.7★ from 6,280 reviews. The product is trusted — it's the price timing that's off." },
      ],
      trust: "4.7★ from 6,280 reviews — highly trusted product with strong track record.",
      value: "At $294, you're near the top of the historical price range. Better deals available.",
      timing: "Wait 2–3 weeks. Price historically drops before peak travel season.",
    },
  },
  {
    id: "demo3",
    result: {
      product: {
        title: "Brooks Ghost 16 Running Shoes (Wide)",
        merchant: "Amazon",
        price: "139.95",
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
        rating: 4.5,
        reviewCount: 12841,
      },
      verdict: "buy" as const,
      score: 81,
      fit_score: 85,
      value_score: 80,
      regret_score: 18,
      reasons: [
        { label: "Best wide-fit pick", detail: "Top-rated wide-fit running shoe under $150 for three consecutive years." },
        { label: "12K+ reviews", detail: "Highly consistent satisfaction across foot types. DNA LOFT cushioning praised for daily training." },
        { label: "Fair price now", detail: "Ghost 16 is a newer model — prices are stable and wide sizes are in stock." },
      ],
      trust: "12,841 reviews with 4.5★. Top-rated in wide-fit running category.",
      value: "$139 is well within budget with no meaningful trade-offs vs. competitors.",
      timing: "Stable and fair price. Wide sizes are currently in stock.",
    },
  },
];

// ─── Score ring ───────────────────────────────────────────────────────────────

type RingSize = "sm" | "md" | "lg";

const RING_SIZES: Record<RingSize, { outer: number; inner: number; textClass: string }> = {
  sm: { outer: 36, inner: 26, textClass: "text-[11px]" },
  md: { outer: 64, inner: 48, textClass: "text-lg" },
  lg: { outer: 80, inner: 60, textClass: "text-2xl" },
};

function ScoreRing({
  score,
  verdict,
  size = "md",
}: {
  score: number;
  verdict: "buy" | "wait" | "skip";
  size?: RingSize;
}) {
  const cfg = VERDICT_CONFIG[verdict];
  const { outer, inner, textClass } = RING_SIZES[size];
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{
        width: outer,
        height: outer,
        background: `conic-gradient(${cfg.ring} ${score}%, #e7e5e4 0)`,
      }}
    >
      <div
        className="bg-white rounded-full flex flex-col items-center justify-center"
        style={{ width: inner, height: inner }}
      >
        <span className={cn("font-bold text-stone-900 leading-none", textClass)}>{score}</span>
        {size !== "sm" && (
          <span className="text-[9px] text-stone-400 leading-none">/100</span>
        )}
      </div>
    </div>
  );
}

// ─── Demo card ────────────────────────────────────────────────────────────────

function DemoCard({
  demo,
  onClick,
}: {
  demo: (typeof DEMO_PRODUCTS)[0];
  onClick: () => void;
}) {
  const cfg = VERDICT_CONFIG[demo.result.verdict];
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200 transition-all group overflow-hidden"
    >
      {/* Product image with score ring overlay */}
      <div className="relative h-32 bg-stone-50 flex items-center justify-center overflow-hidden">
        <img
          src={demo.result.product.imageUrl}
          alt={demo.result.product.title}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2.5 right-2.5">
          <ScoreRing score={demo.result.score} verdict={demo.result.verdict} size="sm" />
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 space-y-2">
        <p className="text-xs font-semibold text-stone-800 leading-snug line-clamp-2">
          {demo.result.product.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border",
              cfg.badgeBg, cfg.badgeText, cfg.badgeBorder
            )}
          >
            {cfg.label}
          </span>
          <span className="text-xs font-bold text-stone-700">
            ${Number(demo.result.product.price).toFixed(0)}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-medium">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            {demo.result.product.rating}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-stone-400 group-hover:text-amber-600 transition-colors pt-0.5">
          <Sparkles className="w-3 h-3" />
          <span className="font-medium">See verdict</span>
          <ArrowRight className="w-3 h-3 ml-auto" />
        </div>
      </div>
    </button>
  );
}

// ─── Verdict card ─────────────────────────────────────────────────────────────

function VerdictCard({
  result,
  onSave,
  onReset,
  saved = false,
  isSaving = false,
}: {
  result: VerdictResult;
  onSave: () => void;
  onReset: () => void;
  saved?: boolean;
  isSaving?: boolean;
}) {
  const cfg = VERDICT_CONFIG[result.verdict];

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm"
      style={{ border: `1.5px solid ${cfg.borderCard}` }}
    >
      {/* Verdict accent stripe */}
      <div className={cn("h-1 w-full", cfg.accentBar)} />

      {/* Product header */}
      <div className="flex gap-4 p-5 pb-4">
        <img
          src={result.product.imageUrl}
          alt={result.product.title}
          className="w-24 h-24 rounded-xl object-contain border border-stone-100 bg-stone-50 shrink-0"
        />
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="font-semibold text-base leading-snug line-clamp-2 text-stone-900">
            {result.product.title}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {result.product.merchant && (
              <span className="text-xs font-medium text-stone-400 bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full capitalize">
                {result.product.merchant}
              </span>
            )}
            {result.product.price !== "—" && (
              <span className="text-sm font-bold text-stone-800">
                ${Number(result.product.price).toFixed(2)}
              </span>
            )}
            {result.product.rating > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {result.product.rating}
                <span className="text-stone-400 font-normal ml-0.5">
                  (
                  {result.product.reviewCount >= 1000
                    ? `${(result.product.reviewCount / 1000).toFixed(
                        result.product.reviewCount >= 10000 ? 0 : 1
                      )}K`
                    : result.product.reviewCount}
                  )
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-4">
        {/* Verdict banner */}
        <div
          className="flex items-center gap-5 p-4 rounded-2xl"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          <ScoreRing score={result.score} verdict={result.verdict} size="lg" />
          <div>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">
              Worthly AI verdict
            </p>
            <span
              className={cn(
                "inline-flex items-center px-5 py-2 rounded-full text-2xl font-black tracking-tight border",
                cfg.badgeBg, cfg.badgeText, cfg.badgeBorder
              )}
            >
              {cfg.label}
            </span>
            <p className="text-xs mt-2 font-medium" style={{ color: cfg.text }}>
              {cfg.sub}
            </p>
          </div>
        </div>

        <div className="border-t border-stone-50" />

        {/* Why this verdict */}
        <div>
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-3">
            Why this verdict
          </p>
          <ul className="space-y-2.5">
            {result.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-black text-white leading-none"
                  style={{ background: cfg.ring }}
                >
                  {cfg.icon}
                </span>
                <span className="text-sm text-stone-600 leading-snug">
                  <span className="font-semibold text-stone-800">{r.label}: </span>
                  {r.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Score bars */}
        <div className="space-y-2">
          {[
            { label: "Fit", score: result.fit_score, color: "bg-blue-400" },
            { label: "Value", score: result.value_score, color: "bg-emerald-400" },
            { label: "Regret risk", score: result.regret_score, color: "bg-red-400", invert: true },
          ].map(({ label, score, color, invert }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-[10px] font-semibold text-stone-400 w-16 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", invert ? (score > 60 ? "bg-red-400" : score > 35 ? "bg-amber-400" : "bg-emerald-400") : color)}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-stone-400 w-7 text-right shrink-0">{score}</span>
            </div>
          ))}
        </div>

        {/* Trust / Value / Timing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { label: "Trust", value: result.trust, Icon: Shield },
            { label: "Value", value: result.value, Icon: TrendingUp },
            { label: "Timing", value: result.timing, Icon: Clock },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="rounded-xl bg-stone-50 border border-stone-100 p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-widest">
                  {label}
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">{value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={onSave}
            disabled={saved || isSaving}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98]",
              saved
                ? "bg-emerald-500 cursor-default"
                : isSaving
                ? "opacity-70 cursor-not-allowed"
                : "hover:brightness-110"
            )}
            style={saved || isSaving ? undefined : { background: "hsl(32 95% 54%)" }}
          >
            <Bookmark className="w-4 h-4" />
            {saved ? "Saved!" : isSaving ? "Saving…" : "Save to Worthly AI"}
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> New analysis
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Saved item row ───────────────────────────────────────────────────────────

function SavedRow({ item }: { item: DetectedProduct }) {
  const cfg = VERDICT_CONFIG[item.verdict as keyof typeof VERDICT_CONFIG];
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-stone-50 last:border-0 hover:bg-stone-50/50 transition-colors">
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-10 h-10 rounded-xl object-contain border border-stone-100 bg-stone-50 shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 shrink-0 flex items-center justify-center">
          <ShoppingBag className="w-4 h-4 text-stone-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-stone-700 truncate leading-tight">{item.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {cfg && (
            <span
              className={cn(
                "text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border",
                cfg.badgeBg, cfg.badgeText, cfg.badgeBorder
              )}
            >
              {cfg.label}
            </span>
          )}
          {item.price != null && (
            <span className="text-[10px] font-medium text-stone-400">
              ${Number(item.price).toFixed(0)}
            </span>
          )}
        </div>
      </div>
      {item.productUrl && (
        <a
          href={item.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-stone-300 hover:text-stone-500 transition-colors shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  useEffect(() => {
    applySeo({ title: "Worthly AI — Analyze any product", noindex: true });
  }, []);

  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verdict, setVerdict] = useState<VerdictResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const verdictRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/detected-products", data, {
        "x-session-id": getSessionId(),
      }),
    onSuccess: () => {
      setIsSaved(true);
      qc.invalidateQueries({ queryKey: ["/api/detected-products"] });
    },
  });

  const { data: savedItems = [] } = useQuery<DetectedProduct[]>({
    queryKey: ["/api/detected-products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/detected-products", undefined, {
        "x-session-id": getSessionId(),
      });
      return res.json();
    },
  });

  const rawSaved = savedItems.length > 0 ? savedItems : MOCK_DETECTED_PRODUCTS;
  const displaySaved = rawSaved.slice(0, 4);
  const isDemo = savedItems.length === 0;

  function detectMerchant(u: string): string {
    if (u.includes("amazon")) return "Amazon";
    if (u.includes("target")) return "Target";
    if (u.includes("walmart")) return "Walmart";
    if (u.includes("bestbuy")) return "Best Buy";
    if (u.includes("ebay")) return "eBay";
    if (u.includes("etsy")) return "Etsy";
    const match = u.match(/https?:\/\/(?:www\.)?([^/]+)/);
    return match?.[1] ?? "Online Store";
  }

  async function handleAnalyze() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setIsAnalyzing(true);
    setVerdict(null);
    setIsSaved(false);

    const looksLikeUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://");
    if (!looksLikeUrl) {
      setVerdict({
        product: { title: trimmed, merchant: "Unknown", price: "—", imageUrl: "", rating: 0, reviewCount: 0 },
        verdict: "wait",
        score: 50,
        fit_score: 50,
        value_score: 50,
        regret_score: 50,
        reasons: [
          { label: "Paste a product URL", detail: "Enter a full product page URL (starting with https://) to get a real verdict." },
          { label: "Try a demo", detail: "Click one of the demo products below to see how Worthly AI verdicts work." },
          { label: "Extension coming soon", detail: "The Worthly AI browser extension will let you analyze any product with one click while you shop." },
        ],
        trust: "A full product URL is needed for trust analysis.",
        value: "Paste a product link to see value scoring.",
        timing: "Timing analysis requires a product page URL.",
      });
      setIsAnalyzing(false);
      setTimeout(() => verdictRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      return;
    }

    try {
      const res = await apiRequest("POST", "/api/analyze-url", { url: trimmed });
      const data = await res.json();
      const merchant = detectMerchant(trimmed.toLowerCase());
      const overallScore = Math.round(
        data.fit_score * 0.35 + data.value_score * 0.35 + (100 - data.regret_score) * 0.30
      );
      setVerdict({
        product: {
          title: data.product_name ?? trimmed,
          merchant,
          price: data.price != null ? String(data.price) : "—",
          imageUrl: data.product_image ?? "",
          rating: 0,
          reviewCount: 0,
        },
        verdict: data.verdict,
        score: overallScore,
        fit_score: data.fit_score,
        value_score: data.value_score,
        regret_score: data.regret_score,
        reasons: Array.isArray(data.reasons) ? data.reasons : [],
        trust: data.trust ?? "",
        value: data.value ?? "",
        timing: data.timing ?? "",
      });
    } catch {
      setVerdict({
        product: { title: "Analysis failed", merchant: detectMerchant(trimmed.toLowerCase()), price: "—", imageUrl: "", rating: 0, reviewCount: 0 },
        verdict: "wait",
        score: 50,
        fit_score: 50,
        value_score: 50,
        regret_score: 50,
        reasons: [
          { label: "Request failed", detail: "Could not reach the analysis server. Please try again." },
          { label: "Try a demo product", detail: "Click one of the demo products below to see a full Worthly AI verdict." },
          { label: "Extension coming soon", detail: "The browser extension gets richer data directly from the product page." },
        ],
        trust: "Analysis unavailable.",
        value: "Analysis unavailable.",
        timing: "Analysis unavailable.",
      });
    }

    setIsAnalyzing(false);
    setTimeout(() => verdictRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function handleSave() {
    if (!verdict || isSaved || saveMutation.isPending) return;
    saveMutation.mutate({
      title: verdict.product.title,
      merchant: verdict.product.merchant,
      productUrl: url.startsWith("http") ? url : `https://www.google.com/search?q=${encodeURIComponent(verdict.product.title)}`,
      imageUrl: verdict.product.imageUrl || null,
      price: verdict.product.price !== "—" ? verdict.product.price : null,
      detectedRating: verdict.product.rating > 0 ? String(verdict.product.rating) : null,
      detectedReviewCount: verdict.product.reviewCount > 0 ? verdict.product.reviewCount : null,
      verdict: verdict.verdict,
      verdictScore: verdict.score,
      verdictReasonJson: verdict.reasons.map(r => `${r.label}: ${r.detail}`),
      status: "saved",
    });
  }

  function handleDemo(demo: (typeof DEMO_PRODUCTS)[0]) {
    setVerdict(demo.result);
    setIsSaved(false);
    setUrl(demo.result.product.title);
    setTimeout(
      () => verdictRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      100
    );
  }

  function handleReset() {
    setVerdict(null);
    setUrl("");
    setIsSaved(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-[hsl(38_25%_97%)] pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ── Section 1: Hero input card ── */}
        <section className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
            style={{
              background: "hsl(32 95% 54% / 0.08)",
              borderColor: "hsl(32 95% 54% / 0.2)",
              color: "hsl(32 95% 40%)",
            }}
          >
            <Sparkles className="w-3 h-3" /> AI Shopping Copilot
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 leading-tight">
              Analyze any product<br className="hidden sm:block" /> in seconds
            </h1>
            <p className="text-sm text-stone-500 mt-2 leading-relaxed max-w-sm">
              Paste a product link to get a Buy&nbsp;/&nbsp;Wait&nbsp;/&nbsp;Skip verdict — value, trust,
              timing, and purchase risk.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                placeholder="Paste Amazon, Target, or Walmart URL…"
                className="w-full pl-10 pr-4 py-3.5 text-sm rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all placeholder:text-stone-400"
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!url.trim() || isAnalyzing}
              className="shrink-0 flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:brightness-110 active:scale-[0.97]"
              style={{ background: "hsl(32 95% 54%)" }}
            >
              {isAnalyzing ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Analyze</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-[11px] text-stone-400">
              Amazon · Target · Walmart · Shopify supported
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
              <Zap className="w-3 h-3" /> Extension coming soon
            </span>
          </div>
        </section>

        {/* ── Section 2: Demo products ── */}
        {!verdict && !isAnalyzing && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">
                Try a demo product
              </p>
              <p className="text-xs text-stone-400">See how Worthly AI works</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DEMO_PRODUCTS.map((demo) => (
                <DemoCard key={demo.id} demo={demo} onClick={() => handleDemo(demo)} />
              ))}
            </div>
          </section>
        )}

        {/* ── Loading state ── */}
        {isAnalyzing && (
          <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-10 flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">Analyzing product…</p>
              <p className="text-xs text-stone-400 mt-1">
                Checking value, trust, timing, and purchase risk
              </p>
            </div>
          </section>
        )}

        {/* ── Section 3: Verdict result ── */}
        {verdict && !isAnalyzing && (
          <section ref={verdictRef} className="space-y-4">
            <div className="flex items-center justify-between px-0.5">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">
                Worthly AI verdict
              </p>
              <button
                onClick={handleReset}
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> New analysis
              </button>
            </div>
            <VerdictCard
              result={verdict}
              onSave={handleSave}
              onReset={handleReset}
              saved={isSaved}
              isSaving={saveMutation.isPending}
            />

            <div className="pt-1">
              <p className="text-xs text-stone-400 mb-3 px-0.5">Try another demo:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DEMO_PRODUCTS.map((demo) => (
                  <DemoCard key={demo.id} demo={demo} onClick={() => handleDemo(demo)} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Section 4: Saved items ── */}
        <section>
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-50">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                Saved items
                {isDemo && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-400 border border-stone-200 ml-0.5">
                    Demo
                  </span>
                )}
              </h2>
              <Link
                href="/saved"
                className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 transition-colors"
              >
                See all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {displaySaved.length > 0 ? (
              <div>
                {displaySaved.map((item) => (
                  <SavedRow key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6 text-stone-300" />
                </div>
                <p className="text-sm font-semibold text-stone-500">No saved items yet</p>
                <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                  Analyze a product and save it, or install the browser extension to save while you shop.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 5: Post-purchase tools ── */}
        <section>
          <div className="rounded-2xl bg-white border border-stone-100 shadow-sm p-5">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-4">
              Post-purchase tools
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Return windows",
                  sub: "Track deadlines",
                  href: "/app/returns",
                  Icon: Package,
                  iconColor: "text-amber-500",
                  iconBg: "bg-amber-50",
                },
                {
                  label: "Subscriptions",
                  sub: "Manage & cancel",
                  href: "/app/subscriptions",
                  Icon: CreditCard,
                  iconColor: "text-blue-500",
                  iconBg: "bg-blue-50",
                },
                {
                  label: "Actions",
                  sub: "Savings opportunities",
                  href: "/app/actions",
                  Icon: Zap,
                  iconColor: "text-emerald-500",
                  iconBg: "bg-emerald-50",
                },
                {
                  label: "Ask Worthly AI",
                  sub: "Natural language search",
                  href: "/app/verdicts",
                  Icon: Sparkles,
                  iconColor: "text-purple-500",
                  iconBg: "bg-purple-50",
                },
              ].map(({ label, sub, href, Icon, iconColor, iconBg }) => (
                <Link key={href} href={href}>
                  <div className="p-3.5 rounded-xl border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all cursor-pointer group flex items-start gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        iconBg
                      )}
                    >
                      <Icon className={cn("w-4 h-4", iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-700 group-hover:text-stone-900 transition-colors leading-tight">
                        {label}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">{sub}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-400 mt-0.5 transition-colors shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
