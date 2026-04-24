import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink, Bookmark, ThumbsUp, ThumbsDown, RefreshCcw,
  AlertTriangle, ChevronDown, ChevronUp, DollarSign,
  TrendingUp, Shield, BarChart2, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecommendationResult, ScoredProduct } from "@shared/schema";
import { getSessionId } from "@/lib/session";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

/* ── Verdict badge ─────────────────────────────────────────────────────────── */
function VerdictBadge({ verdict }: { verdict: string }) {
  const map = {
    buy:  { label: "Buy",  cls: "verdict-buy",  emoji: "✓" },
    wait: { label: "Wait", cls: "verdict-wait", emoji: "⏳" },
    skip: { label: "Skip", cls: "verdict-skip", emoji: "✗" },
  } as const;
  const v = map[verdict as keyof typeof map] || map.wait;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold", v.cls)}>
      <span>{v.emoji}</span> {v.label}
    </span>
  );
}

/* ── Score bar ─────────────────────────────────────────────────────────────── */
function ScoreBar({ label, value, icon: Icon }: { label: string; value: number; icon?: any }) {
  const color = value >= 80 ? "hsl(142 60% 45%)" : value >= 60 ? "hsl(32 95% 54%)" : "hsl(0 70% 55%)";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          {Icon && <Icon className="w-3 h-3" />}
          {label}
        </span>
        <span className="font-semibold" style={{ color }}>{value}</span>
      </div>
      <div className="score-bar">
        <div className="score-fill" style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
      </div>
    </div>
  );
}

/* ── Product card ──────────────────────────────────────────────────────────── */
function ProductCard({
  product, rank, onSave, showSave = true,
}: {
  product: ScoredProduct;
  rank?: "top" | "budget" | "premium" | "alt";
  onSave?: (p: ScoredProduct) => void;
  showSave?: boolean;
}) {
  const [showScores, setShowScores] = useState(false);

  const rankLabel = { top: "Top Pick", budget: "Budget Pick", premium: "Premium Pick", alt: "Alternative" };
  const rankColor = {
    top: "bg-primary/10 text-primary border-primary/20",
    budget: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    premium: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
    alt: "bg-secondary text-muted-foreground border-border",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 space-y-4 transition-all",
        rank === "top" ? "border-primary/25 shadow-md" : "border-border"
      )}
      data-testid={`card-product-${rank || "alt"}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          {rank && (
            <Badge variant="outline" className={cn("text-xs border", rankColor[rank])}>
              {rankLabel[rank]}
            </Badge>
          )}
          <h3 className="font-bold text-base leading-snug">{product.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            {product.brand && <span>{product.brand}</span>}
            {(product.price || product.priceRange) && (
              <span className="flex items-center gap-0.5 font-semibold text-foreground">
                <DollarSign className="w-3.5 h-3.5" />
                {product.price ? `$${product.price}` : product.priceRange}
              </span>
            )}
          </div>
        </div>
        {/* Score circle */}
        <div
          className="text-center rounded-2xl px-3 py-2 shrink-0 min-w-[56px]"
          style={{ background: "hsl(32 95% 54% / 0.10)", border: "1px solid hsl(32 95% 54% / 0.20)" }}
        >
          <div className="text-xl font-bold" style={{ color: "hsl(32 95% 45%)" }}>
            {product.scores.finalScore}
          </div>
          <div className="text-[10px] text-muted-foreground">/100</div>
        </div>
      </div>

      {/* Reason */}
      <p className="text-sm text-muted-foreground leading-relaxed">{product.reason}</p>

      {/* Pros / Cons */}
      {(product.pros.length > 0 || product.cons.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {product.pros.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Pros</p>
              <ul className="space-y-1">
                {product.pros.slice(0, 3).map((p, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5 shrink-0">+</span>
                    <span className="text-foreground/80">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {product.cons.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Cons</p>
              <ul className="space-y-1">
                {product.cons.slice(0, 3).map((c, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5 shrink-0">−</span>
                    <span className="text-foreground/80">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Score breakdown toggle */}
      <button
        type="button"
        onClick={() => setShowScores(!showScores)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showScores ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Score breakdown
      </button>
      {showScores && (
        <div className="space-y-2 animate-slide-up">
          <ScoreBar label="Fit score"   value={product.scores.fitScore}   icon={Shield} />
          <ScoreBar label="Value score" value={product.scores.valueScore} icon={TrendingUp} />
          <ScoreBar label="Proof score" value={product.scores.proofScore} icon={BarChart2} />
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Zap className="w-3 h-3" /> Regret risk
              </span>
              <span className="font-semibold" style={{ color: product.scores.regretScore < 20 ? "hsl(142 60% 45%)" : product.scores.regretScore < 40 ? "hsl(32 95% 54%)" : "hsl(0 70% 55%)" }}>
                {product.scores.regretScore}
              </span>
            </div>
            <div className="score-bar">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${product.scores.regretScore}%`,
                  background: product.scores.regretScore < 20 ? "hsl(142 60% 45%)" : product.scores.regretScore < 40 ? "hsl(32 95% 54%)" : "hsl(0 70% 55%)",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Resale note */}
      {product.resaleNote && (
        <div className="flex items-start gap-2 rounded-lg p-3 text-xs"
          style={{ background: "hsl(270 50% 55% / 0.08)", border: "1px solid hsl(270 50% 55% / 0.15)" }}>
          <RefreshCcw className="w-3.5 h-3.5 mt-0.5 shrink-0 text-purple-500" />
          <p className="text-muted-foreground">{product.resaleNote}</p>
        </div>
      )}

      {/* Buy links */}
      {product.offers.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Where to buy</p>
          <div className="flex flex-wrap gap-2">
            {product.offers.map((offer, i) => (
              <a
                key={i}
                href={offer.affiliateUrl || offer.merchantUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all hover:border-primary/40 hover:text-foreground"
              >
                <ExternalLink className="w-3 h-3" />
                {offer.merchantName}
                {offer.price && <span className="font-bold">${offer.price}</span>}
                {offer.isAffiliate && <span className="text-muted-foreground opacity-60">aff.</span>}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Save button */}
      {showSave && onSave && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={() => onSave(product)}
          data-testid={`button-save-${rank}`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          Save this product
        </Button>
      )}
    </div>
  );
}

/* ── Main canvas ───────────────────────────────────────────────────────────── */
interface Props {
  result: RecommendationResult;
  queryId?: number;
  recommendationId?: number;
  onNewQuery?: () => void;
}

export default function RecommendationCanvas({ result, queryId, recommendationId, onNewQuery }: Props) {
  const { toast } = useToast();
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [showAlts, setShowAlts] = useState(false);

  async function handleFeedback(vote: "up" | "down") {
    try {
      await apiRequest("POST", "/api/feedback", {
        queryId, recommendationId, vote,
      }, { "x-session-id": getSessionId() });
      setFeedbackDone(true);
    } catch {}
  }

  async function saveProduct(product: ScoredProduct) {
    try {
      await apiRequest("POST", "/api/save", {
        productTitle: product.title,
        productBrand: product.brand,
        productPrice: product.price,
        category: product.category,
        score: product.scores.finalScore,
        verdict: result.verdict,
        merchantUrl: product.offers[0]?.merchantUrl || product.offers[0]?.affiliateUrl,
      }, { "x-session-id": getSessionId() });
      toast({ title: "Saved!", description: `${product.title} added to your saved list.` });
    } catch {
      toast({ title: "Couldn't save", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-5 animate-slide-up">

      {/* ── Verdict banner ── */}
      <div
        className="rounded-2xl p-5 space-y-3"
        style={{
          background: result.verdict === "buy"
            ? "hsl(142 60% 45% / 0.07)"
            : result.verdict === "skip"
            ? "hsl(0 70% 55% / 0.06)"
            : "hsl(32 95% 54% / 0.07)",
          border: result.verdict === "buy"
            ? "1px solid hsl(142 60% 45% / 0.2)"
            : result.verdict === "skip"
            ? "1px solid hsl(0 70% 55% / 0.18)"
            : "1px solid hsl(32 95% 54% / 0.2)",
        }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-2">
            <VerdictBadge verdict={result.verdict} />
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                Confidence: {result.confidence} ({result.confidenceScore}%)
              </Badge>
            </div>
          </div>
          {onNewQuery && (
            <Button variant="outline" size="sm" onClick={onNewQuery} className="gap-1.5 text-xs shrink-0">
              New query
            </Button>
          )}
        </div>
        <p className="text-sm leading-relaxed">{result.explanation}</p>

        {/* Tradeoffs */}
        {result.tradeoffs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Tradeoffs to know</p>
            <ul className="space-y-1.5">
              {result.tradeoffs.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-warning" />
                  <span className="text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Regret risk */}
        {result.regretRisk && (
          <div className="rounded-lg p-3 bg-background/60 border border-border/60">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Who might regret this</p>
            <p className="text-xs text-muted-foreground">{result.regretRisk}</p>
          </div>
        )}
      </div>

      {/* ── Top choice ── */}
      <ProductCard product={result.topChoice} rank="top" onSave={saveProduct} />

      {/* ── Budget + Premium picks ── */}
      {(result.budgetPick || result.premiumPick) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {result.budgetPick && (
            <ProductCard product={result.budgetPick} rank="budget" onSave={saveProduct} />
          )}
          {result.premiumPick && (
            <ProductCard product={result.premiumPick} rank="premium" onSave={saveProduct} />
          )}
        </div>
      )}

      {/* ── Alternatives ── */}
      {result.alternatives.length > 0 && (
        <div>
          <button
            onClick={() => setShowAlts(!showAlts)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-2"
          >
            {showAlts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAlts ? "Hide" : "Show"} {result.alternatives.length} alternative{result.alternatives.length !== 1 ? "s" : ""}
          </button>
          {showAlts && (
            <div className="space-y-4 animate-slide-up">
              {result.alternatives.map((alt, i) => (
                <ProductCard key={i} product={alt} rank="alt" onSave={saveProduct} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Feedback ── */}
      <div className="border-t border-border pt-4">
        {!feedbackDone ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Was this helpful?</span>
            <button
              onClick={() => handleFeedback("up")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium hover:border-primary/40 hover:text-primary transition-all"
              data-testid="button-feedback-up"
            >
              <ThumbsUp className="w-3.5 h-3.5" /> Yes
            </button>
            <button
              onClick={() => handleFeedback("down")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium hover:border-destructive/40 hover:text-destructive transition-all"
              data-testid="button-feedback-down"
            >
              <ThumbsDown className="w-3.5 h-3.5" /> Not really
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center">Thanks for your feedback — it helps Worthly AI improve.</p>
        )}
      </div>
    </div>
  );
}
