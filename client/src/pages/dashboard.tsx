import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applySeo } from "@/lib/seo";
import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/queryClient";
import { getSessionId } from "@/lib/session";
import { cn } from "@/lib/utils";
import {
  Sparkles, Bookmark, ExternalLink, Star, Shield, TrendingUp, Clock,
  Zap, ShoppingBag, RotateCcw, Search, AlertTriangle, ChevronRight,
  DollarSign, Clock4, FileText, MessageSquare, Send,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VerdictResult {
  verdict: "buy" | "wait" | "skip";
  verdictScore: number;
  headline: string;
  reasons: Array<{ label: string; detail: string }>;
  scores: { fit: number; value: number; proof: number; regret: number };
  estimatedSavings?: number;
  waitUntil?: string;
  duplicateFlag?: string;
  resaleOutlook?: string;
  category?: string;
  scraped: {
    title: string;
    price?: number;
    currency?: string;
    merchant?: string;
    imageUrl?: string;
    rating?: number;
    reviewCount?: number;
    description?: string;
  };
  queryId?: string;
  recommendationId?: string;
}

type ActiveTab = "url";

// ─── Demo URLs ────────────────────────────────────────────────────────────────

const DEMO_URLS = [
  {
    label: "Anker USB-C Hub",
    desc: "Amazon — Electronics",
    icon: "🔌",
    url: "https://www.amazon.com/dp/B087QLXDDM",
  },
  {
    label: "Neutrogena Sunscreen",
    desc: "Target — Beauty",
    icon: "☀️",
    url: "https://www.target.com/p/neutrogena-ultra-sheer-dry-touch-sunscreen-spf-55/-/A-13077225",
  },
  {
    label: "Shopify Tote Bag",
    desc: "Shopify — Fashion",
    icon: "👜",
    url: "https://www.tentree.com/products/tote-bag",
  },
];

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
    sub: "Hold off — check timing or alternatives",
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
    sub: "Not recommended — save your money",
  },
} as const;

// ─── Chat component ───────────────────────────────────────────────────────────

const CHAT_CHIPS = ["Why skip?", "Show cheaper alternatives", "What if I wait?", "Is this a dupe of something I own?"];

type ChatMsg = { role: "user" | "assistant"; text: string };

function VerdictChat({ verdictContext }: { verdictContext: string }) {
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState("");
  const [msgs, setMsgs]         = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, streaming]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: ChatMsg = { role: "user", text: text.trim() };
    setMsgs(prev => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    const history = msgs.map(m => ({
      role: m.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: m.text }],
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": getSessionId() },
        body: JSON.stringify({ message: text.trim(), verdictContext, history }),
      });
      if (!res.body) throw new Error("No stream");

      let accumulated = "";
      setMsgs(prev => [...prev, { role: "assistant", text: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMsgs(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", text: accumulated };
          return next;
        });
      }
    } catch {
      setMsgs(prev => [...prev, { role: "assistant", text: "Sorry — couldn't reach the server. Try again." }]);
    }
    setStreaming(false);
  }, [msgs, streaming, verdictContext]);

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-5 py-4 hover:bg-stone-50 transition-colors"
      >
        <MessageSquare className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-semibold text-stone-700">Ask about this verdict</span>
        <span className="ml-auto text-stone-300 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-stone-50">
          {/* Suggestion chips */}
          {msgs.length === 0 && (
            <div className="flex flex-wrap gap-2 px-5 py-3">
              {CHAT_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-stone-600 bg-stone-100 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 border border-stone-200 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {msgs.length > 0 && (
            <div className="px-5 py-3 space-y-3 max-h-72 overflow-y-auto">
              {msgs.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed",
                    m.role === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-stone-50 text-stone-700 border border-stone-100 rounded-bl-sm"
                  )} style={m.role === "user" ? { background: "hsl(32 95% 54%)" } : undefined}>
                    {m.text || (streaming && i === msgs.length - 1 ? <span className="animate-pulse">…</span> : "")}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 px-5 py-3 border-t border-stone-50">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
              placeholder="Ask anything about this product…"
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all placeholder:text-stone-400"
              disabled={streaming}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="flex items-center justify-center w-10 h-10 rounded-xl text-white disabled:opacity-40 transition-all hover:brightness-110"
              style={{ background: "hsl(32 95% 54%)" }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Score ring ───────────────────────────────────────────────────────────────

type RingSize = "sm" | "md" | "lg";

const RING_SIZES: Record<RingSize, { outer: number; inner: number; textClass: string }> = {
  sm: { outer: 36, inner: 26, textClass: "text-[11px]" },
  md: { outer: 64, inner: 48, textClass: "text-lg" },
  lg: { outer: 88, inner: 66, textClass: "text-2xl" },
};

function ScoreRing({ score, verdict, size = "md" }: { score: number; verdict: "buy" | "wait" | "skip"; size?: RingSize }) {
  const cfg = VERDICT_CONFIG[verdict];
  const { outer, inner, textClass } = RING_SIZES[size];
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: outer, height: outer, background: `conic-gradient(${cfg.ring} ${score}%, #e7e5e4 0)` }}
    >
      <div className="bg-white rounded-full flex flex-col items-center justify-center" style={{ width: inner, height: inner }}>
        <span className={cn("font-bold text-stone-900 leading-none", textClass)}>{score}</span>
        {size !== "sm" && <span className="text-[9px] text-stone-400 leading-none">/100</span>}
      </div>
    </div>
  );
}

// ─── History strip card ───────────────────────────────────────────────────────

function HistoryCard({ item, onClick }: { item: VerdictResult; onClick: () => void }) {
  const cfg = VERDICT_CONFIG[item.verdict];
  return (
    <button
      onClick={onClick}
      className="shrink-0 w-44 text-left bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200 transition-all overflow-hidden group"
    >
      <div className={cn("h-0.5 w-full", cfg.accentBar)} />
      <div className="p-3 space-y-2">
        {item.scraped.imageUrl ? (
          <img
            src={item.scraped.imageUrl}
            alt={item.scraped.title}
            className="w-full h-20 object-contain rounded-lg bg-stone-50 border border-stone-100"
          />
        ) : (
          <div className="w-full h-20 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-stone-300" />
          </div>
        )}
        <p className="text-xs font-semibold text-stone-700 leading-snug line-clamp-2">{item.scraped.title}</p>
        <div className="flex items-center justify-between">
          <span className={cn("text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full border", cfg.badgeBg, cfg.badgeText, cfg.badgeBorder)}>
            {cfg.label}
          </span>
          <span className="text-[10px] font-bold text-stone-500">{item.verdictScore}/100</span>
        </div>
      </div>
    </button>
  );
}

// ─── Verdict card ─────────────────────────────────────────────────────────────

function VerdictCard({
  result,
  sourceUrl,
  onSave,
  onReset,
  saved = false,
  isSaving = false,
  onAction,
}: {
  result: VerdictResult;
  sourceUrl: string;
  onSave: () => void;
  onReset: () => void;
  saved?: boolean;
  isSaving?: boolean;
  onAction?: (action: "watch" | "bought" | "skipped" | "regret") => void;
}) {
  const cfg = VERDICT_CONFIG[result.verdict];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: `1.5px solid ${cfg.borderCard}` }}>
      <div className={cn("h-1 w-full", cfg.accentBar)} />

      {/* Product header */}
      <div className="flex gap-4 p-5 pb-4">
        {result.scraped.imageUrl ? (
          <img
            src={result.scraped.imageUrl}
            alt={result.scraped.title}
            className="w-24 h-24 rounded-xl object-contain border border-stone-100 bg-stone-50 shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-xl bg-stone-50 border border-stone-100 shrink-0 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-stone-300" />
          </div>
        )}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="font-semibold text-base leading-snug line-clamp-2 text-stone-900">
            {result.scraped.title}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {result.scraped.merchant && (
              <span className="text-xs font-medium text-stone-400 bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full capitalize">
                {result.scraped.merchant}
              </span>
            )}
            {result.scraped.price != null && (
              <span className="text-sm font-bold text-stone-800">
                {result.scraped.currency ?? "$"}{result.scraped.price.toFixed(2)}
              </span>
            )}
            {result.scraped.rating != null && (
              <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {result.scraped.rating}
                {result.scraped.reviewCount != null && (
                  <span className="text-stone-400 font-normal ml-0.5">
                    ({result.scraped.reviewCount >= 1000
                      ? `${(result.scraped.reviewCount / 1000).toFixed(result.scraped.reviewCount >= 10_000 ? 0 : 1)}K`
                      : result.scraped.reviewCount})
                  </span>
                )}
              </span>
            )}
            {sourceUrl.startsWith("http") && (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
                className="p-1 rounded-lg text-stone-300 hover:text-stone-500 transition-colors">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-4">
        {/* Duplicate flag */}
        {result.duplicateFlag && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Possible duplicate</p>
              <p className="text-xs text-amber-700 mt-0.5">{result.duplicateFlag}</p>
            </div>
          </div>
        )}

        {/* Estimated savings banner */}
        {result.estimatedSavings != null && result.verdict === "skip" && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-800">
                You saved ~${result.estimatedSavings.toFixed(0)}
              </p>
              <p className="text-xs text-emerald-700">Skipping this purchase keeps money in your pocket.</p>
            </div>
          </div>
        )}

        {/* Verdict banner */}
        <div className="flex items-center gap-5 p-4 rounded-2xl" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          <ScoreRing score={result.verdictScore} verdict={result.verdict} size="lg" />
          <div>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">
              Worthly AI verdict
            </p>
            <span className={cn("inline-flex items-center px-5 py-2 rounded-full text-2xl font-black tracking-tight border", cfg.badgeBg, cfg.badgeText, cfg.badgeBorder)}>
              {cfg.label}
            </span>
            <p className="text-xs mt-2 font-medium leading-snug" style={{ color: cfg.text }}>
              {result.headline}
            </p>
          </div>
        </div>

        {/* Wait until */}
        {result.waitUntil && result.verdict === "wait" && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <Clock4 className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Best time to buy: </span>{result.waitUntil}
            </p>
          </div>
        )}

        <div className="border-t border-stone-50" />

        {/* Reasons */}
        <div>
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-3">Why this verdict</p>
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
            { label: "Fit", score: result.scores.fit, color: "bg-blue-400" },
            { label: "Value", score: result.scores.value, color: "bg-emerald-400" },
            { label: "Proof", score: result.scores.proof, color: "bg-violet-400" },
            { label: "Regret risk", score: result.scores.regret, invert: true },
          ].map(({ label, score, color, invert }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-[10px] font-semibold text-stone-400 w-16 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all",
                    invert
                      ? (score > 60 ? "bg-red-400" : score > 35 ? "bg-amber-400" : "bg-emerald-400")
                      : color)}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-stone-400 w-7 text-right shrink-0">{score}</span>
            </div>
          ))}
        </div>

        {/* Resale outlook */}
        {result.resaleOutlook && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-stone-50 border border-stone-100">
            <FileText className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-0.5">Resale outlook</p>
              <p className="text-xs text-stone-600">{result.resaleOutlook}</p>
            </div>
          </div>
        )}

        {/* Action strip */}
        <div className="border-t border-stone-50 pt-3 space-y-2">
          {result.verdict === "buy" && (
            <div className="flex gap-2">
              <button onClick={() => onAction?.("watch")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors">
                <TrendingUp className="w-3.5 h-3.5" /> Watch price
              </button>
              <button onClick={() => onAction?.("bought")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110" style={{ background: "hsl(142 60% 45%)" }}>
                <Shield className="w-3.5 h-3.5" /> I bought it
              </button>
              <button onClick={() => onAction?.("skipped")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-stone-500 bg-stone-50 hover:bg-stone-100 border border-stone-100 transition-colors">
                Skip
              </button>
            </div>
          )}
          {result.verdict === "wait" && (
            <div className="flex gap-2">
              <button onClick={() => onAction?.("watch")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors">
                <TrendingUp className="w-3.5 h-3.5" /> Watch price
              </button>
              <button onClick={() => onAction?.("watch")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110" style={{ background: "hsl(32 95% 54%)" }}>
                <Clock className="w-3.5 h-3.5" /> Remind me
              </button>
              <button onClick={() => onAction?.("skipped")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-stone-500 bg-stone-50 hover:bg-stone-100 border border-stone-100 transition-colors">
                Skip
              </button>
            </div>
          )}
          {result.verdict === "skip" && (
            <div className="flex gap-2">
              <button onClick={() => onAction?.("skipped")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110" style={{ background: "hsl(32 95% 54%)" }}>
                I skipped it
              </button>
              <button onClick={() => onAction?.("bought")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors">
                Actually bought
              </button>
              <button onClick={() => onAction?.("watch")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-stone-500 bg-stone-50 hover:bg-stone-100 border border-stone-100 transition-colors">
                <TrendingUp className="w-3.5 h-3.5" /> Watch
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={onSave}
              disabled={saved || isSaving}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all active:scale-[0.98]",
                saved ? "bg-emerald-500 cursor-default" : isSaving ? "opacity-70 cursor-not-allowed" : "hover:brightness-110"
              )}
              style={saved || isSaving ? undefined : { background: "hsl(32 95% 54%)" }}
            >
              <Bookmark className="w-3.5 h-3.5" />
              {saved ? "Saved!" : isSaving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> New
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  useEffect(() => {
    applySeo({ title: "Worthly AI — Analyze any product", noindex: true });
  }, []);

  const [url, setUrl]               = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verdict, setVerdict]       = useState<VerdictResult | null>(null);
  const [isSaved, setIsSaved]       = useState(false);
  const [history, setHistory]       = useState<VerdictResult[]>([]);
  const verdictRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/detected-products", data, { "x-session-id": getSessionId() }),
    onSuccess: () => {
      setIsSaved(true);
      qc.invalidateQueries({ queryKey: ["/api/detected-products"] });
    },
  });

  async function handleAnalyze(urlOverride?: string) {
    const trimmed = (urlOverride ?? url).trim();
    if (!trimmed) return;
    setIsAnalyzing(true);
    setVerdict(null);
    setIsSaved(false);
    if (urlOverride) setUrl(urlOverride);

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      const errorResult: VerdictResult = {
        verdict: "wait",
        verdictScore: 50,
        headline: "Paste a full product URL to get a verdict",
        reasons: [
          { label: "URL required", detail: "Enter a full product page URL starting with https://" },
          { label: "Try a demo", detail: "Click one of the example URLs below to see a live verdict." },
        ],
        scores: { fit: 50, value: 50, proof: 50, regret: 50 },
        scraped: { title: trimmed },
      };
      setVerdict(errorResult);
      setIsAnalyzing(false);
      setTimeout(() => verdictRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      return;
    }

    try {
      const res = await apiRequest("POST", "/api/verdict/url", { url: trimmed }, { "x-session-id": getSessionId() });
      if (res.status === 402) {
        const data = await res.json();
        setVerdict({
          verdict: "wait",
          verdictScore: 0,
          headline: "Free limit reached",
          reasons: [{ label: "Sign in to continue", detail: data.error ?? "3 free verdicts/day for anonymous users." }],
          scores: { fit: 0, value: 0, proof: 0, regret: 0 },
          scraped: { title: trimmed },
        });
        setIsAnalyzing(false);
        return;
      }
      const data: VerdictResult = await res.json();
      setVerdict(data);
      setHistory(prev => [data, ...prev].slice(0, 5));
    } catch {
      setVerdict({
        verdict: "wait",
        verdictScore: 50,
        headline: "Analysis failed — try again",
        reasons: [
          { label: "Request error", detail: "Could not reach the analysis server. Please try again." },
          { label: "Check the URL", detail: "Make sure the URL is a public product page (not behind a login)." },
        ],
        scores: { fit: 50, value: 50, proof: 50, regret: 50 },
        scraped: { title: trimmed },
      });
    }

    setIsAnalyzing(false);
    setTimeout(() => verdictRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function handleSave() {
    if (!verdict || isSaved || saveMutation.isPending) return;
    saveMutation.mutate({
      title: verdict.scraped.title,
      merchant: verdict.scraped.merchant ?? "Online Store",
      productUrl: url.startsWith("http") ? url : `https://www.google.com/search?q=${encodeURIComponent(verdict.scraped.title)}`,
      imageUrl: verdict.scraped.imageUrl ?? null,
      price: verdict.scraped.price != null ? String(verdict.scraped.price) : null,
      detectedRating: verdict.scraped.rating != null ? String(verdict.scraped.rating) : null,
      detectedReviewCount: verdict.scraped.reviewCount ?? null,
      verdict: verdict.verdict,
      verdictScore: verdict.verdictScore,
      verdictReasonJson: verdict.reasons.map(r => `${r.label}: ${r.detail}`),
      status: "saved",
    });
  }

  function handleReset() {
    setVerdict(null);
    setUrl("");
    setIsSaved(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleAction(action: "watch" | "bought" | "skipped" | "regret") {
    if (!verdict) return;
    const headers = { "x-session-id": getSessionId() };
    if (action === "watch") {
      await apiRequest("POST", "/api/detected-products", {
        title: verdict.scraped.title,
        merchant: verdict.scraped.merchant ?? "Online Store",
        productUrl: url.startsWith("http") ? url : undefined,
        imageUrl: verdict.scraped.imageUrl ?? null,
        price: verdict.scraped.price != null ? String(verdict.scraped.price) : null,
        verdict: verdict.verdict,
        verdictScore: verdict.verdictScore,
        status: "watching",
      }, headers);
    } else {
      const outcomeMap = { bought: "bought", skipped: "skipped", regret: "regret" } as const;
      await apiRequest("POST", "/api/feedback", {
        outcome: outcomeMap[action],
        sessionId: getSessionId(),
      }, headers);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(38_25%_97%)] pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ── Hero input card ── */}
        <section className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-6 space-y-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-stone-900">
                  Paste any product URL — get a verdict
                </h1>
                <p className="text-sm text-stone-500 mt-1">
                  Amazon, Target, Walmart, Shopify, TikTok, Instagram
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
                    placeholder="https://www.amazon.com/dp/…"
                    className="w-full pl-10 pr-4 py-3.5 text-sm rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all placeholder:text-stone-400"
                  />
                </div>
                <button
                  onClick={() => handleAnalyze()}
                  disabled={!url.trim() || isAnalyzing}
                  className="shrink-0 flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:brightness-110 active:scale-[0.97]"
                  style={{ background: "hsl(32 95% 54%)" }}
                >
                  {isAnalyzing
                    ? <Sparkles className="w-4 h-4 animate-spin" />
                    : <><Sparkles className="w-4 h-4" /><span className="hidden sm:inline">Analyze</span></>}
                </button>
              </div>

              {/* Demo URLs */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">Try an example</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {DEMO_URLS.map((d) => (
                    <button
                      key={d.url}
                      onClick={() => handleAnalyze(d.url)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-stone-100 bg-stone-50 hover:border-amber-300 hover:bg-amber-50 transition-all text-left group"
                    >
                      <span className="text-lg shrink-0">{d.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-stone-700 group-hover:text-stone-900 leading-tight truncate">{d.label}</p>
                        <p className="text-[10px] text-stone-400 truncate">{d.desc}</p>
                      </div>
                      <ChevronRight className="w-3 h-3 text-stone-300 group-hover:text-amber-500 ml-auto shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-stone-400 flex items-center gap-2">
                <Zap className="w-3 h-3" />
                3 free verdicts/day · Sign in for unlimited
              </p>
            </div>

          <p className="text-[11px] text-stone-400 flex items-center gap-2 pt-1">
            Don't have a URL?{" "}
            <Link href="/app/discover" className="font-semibold text-amber-600 hover:text-amber-700 transition-colors">
              Describe what you want →
            </Link>
          </p>
        </section>

        {/* ── Recent verdicts history strip ── */}
        {history.length > 0 && !verdict && (
          <section>
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-3 px-0.5">
              Recent verdicts
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {history.map((item, i) => (
                <HistoryCard
                  key={i}
                  item={item}
                  onClick={() => { setVerdict(item); setTimeout(() => verdictRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Loading ── */}
        {isAnalyzing && (
          <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-10 flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">Analyzing product…</p>
              <p className="text-xs text-stone-400 mt-1">Scraping page, scoring value, trust, timing, and regret risk</p>
            </div>
          </section>
        )}

        {/* ── Verdict result ── */}
        {verdict && !isAnalyzing && (
          <section ref={verdictRef} className="space-y-4">
            <div className="flex items-center justify-between px-0.5">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">Verdict</p>
              <button onClick={handleReset} className="text-xs text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> New analysis
              </button>
            </div>
            <VerdictCard
              result={verdict}
              sourceUrl={url}
              onSave={handleSave}
              onReset={handleReset}
              saved={isSaved}
              isSaving={saveMutation.isPending}
              onAction={handleAction}
            />
            <VerdictChat verdictContext={JSON.stringify({ verdict: verdict.verdict, headline: verdict.headline, reasons: verdict.reasons, scores: verdict.scores, scraped: verdict.scraped })} />
          </section>
        )}

        {/* ── Post-purchase tools ── */}
        <section>
          <div className="rounded-2xl bg-white border border-stone-100 shadow-sm p-5">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-4">After you buy</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Watching & saved",   sub: "Price watches + WAIT verdicts", href: "/app/mine",              Icon: Bookmark,     iconColor: "text-amber-500", iconBg: "bg-amber-50" },
                { label: "Return windows",       sub: "Track deadlines",               href: "/app/mine?tab=returns",  Icon: ShoppingBag,  iconColor: "text-blue-500",   iconBg: "bg-blue-50" },
                { label: "Subscriptions",        sub: "Manage & cancel",               href: "/app/mine?tab=renewals", Icon: Zap,          iconColor: "text-emerald-500", iconBg: "bg-emerald-50" },
                { label: "Resale opportunities", sub: "What's worth selling",          href: "/app/mine?tab=resale",   Icon: TrendingUp,   iconColor: "text-purple-500", iconBg: "bg-purple-50" },
              ].map(({ label, sub, href, Icon, iconColor, iconBg }) => (
                <Link key={href} href={href}>
                  <div className="p-3.5 rounded-xl border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all cursor-pointer group flex items-start gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
                      <Icon className={cn("w-4 h-4", iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-700 group-hover:text-stone-900 transition-colors leading-tight">{label}</p>
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
