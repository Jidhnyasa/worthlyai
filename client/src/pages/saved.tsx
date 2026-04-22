import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { applySeo } from "@/lib/seo";
import { apiRequest } from "@/lib/queryClient";
import { getSessionId } from "@/lib/session";
import type { DetectedProduct } from "@shared/schema";
import { MOCK_DETECTED_PRODUCTS } from "@/lib/purchases-data";
import { cn } from "@/lib/utils";
import {
  Bookmark, Trash2, ExternalLink, ShoppingBag, Star, Check,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

type VerdictFilter = "all" | "buy" | "wait" | "skip";

const VERDICT_CONFIG = {
  buy:  { label: "BUY",  bgClass: "bg-green-50",  textClass: "text-green-700",  borderClass: "border-green-100",  ringColor: "#22c55e", barColor: "bg-green-400" },
  wait: { label: "WAIT", bgClass: "bg-amber-50",  textClass: "text-amber-700",  borderClass: "border-amber-100",  ringColor: "#f59e0b", barColor: "bg-amber-400" },
  skip: { label: "SKIP", bgClass: "bg-red-50",    textClass: "text-red-600",    borderClass: "border-red-100",    ringColor: "#ef4444", barColor: "bg-red-400"   },
} as const;

const STATUS_LABELS: Record<string, string> = {
  saved:     "Saved",
  tracking:  "Tracking",
  purchased: "Purchased",
  archived:  "Archived",
};
const STATUS_STYLES: Record<string, string> = {
  saved:     "bg-stone-100 text-stone-600",
  tracking:  "bg-blue-50 text-blue-600",
  purchased: "bg-green-50 text-green-700",
  archived:  "bg-stone-50 text-stone-400",
};

// ─── Score ring ───────────────────────────────────────────────────────────────
// Uses a conic-gradient circle with an inset white disc.

function ScoreRing({ score, verdict }: { score: number | null; verdict: string }) {
  if (score == null) return null;
  const pct = score;
  const cfg = VERDICT_CONFIG[verdict as keyof typeof VERDICT_CONFIG];
  const ringColor = cfg?.ringColor ?? "#e5e7eb";
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
      style={{ background: `conic-gradient(${ringColor} ${pct}%, #f0f0ee 0)` }}
    >
      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
        <span className="text-[11px] font-bold text-stone-900 leading-none">{score}</span>
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({
  item,
  onDelete,
}: {
  item: DetectedProduct;
  onDelete: () => void;
}) {
  const cfg     = VERDICT_CONFIG[item.verdict as keyof typeof VERDICT_CONFIG];
  const reasons = Array.isArray(item.verdictReasonJson) ? item.verdictReasonJson as string[] : [];

  return (
    <div className={cn(
      "rounded-2xl border bg-white shadow-sm overflow-hidden transition-all group hover:shadow-md",
      "flex"
    )}>
      {/* Verdict accent bar */}
      <div className={cn("w-1 shrink-0", cfg?.barColor ?? "bg-stone-200")} />

      <div className="flex flex-1 gap-3 p-4 min-w-0">
        {/* Image */}
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-14 h-14 rounded-xl object-contain border border-stone-100 bg-stone-50 shrink-0"
          />
        ) : (
          <ScoreRing score={item.verdictScore} verdict={item.verdict} />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-tight line-clamp-2 flex-1">{item.title}</p>
            {cfg && (
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0",
                cfg.bgClass, cfg.textClass, cfg.borderClass
              )}>
                {cfg.label}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            {item.merchant && (
              <span className="text-[11px] font-medium text-stone-400 capitalize bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full">
                {item.merchant}
              </span>
            )}
            {item.price != null && (
              <span className="text-xs font-bold text-stone-800">${Number(item.price).toFixed(2)}</span>
            )}
            {item.detectedRating != null && (
              <span className="flex items-center gap-0.5 text-[11px] text-amber-500 font-medium">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                {Number(item.detectedRating).toFixed(1)}
                {item.detectedReviewCount != null && (
                  <span className="text-stone-400 font-normal ml-0.5">
                    ({item.detectedReviewCount >= 1000
                      ? `${(item.detectedReviewCount / 1000).toFixed(item.detectedReviewCount >= 10000 ? 0 : 1)}K`
                      : item.detectedReviewCount})
                  </span>
                )}
              </span>
            )}
            {item.status && item.status !== "saved" && (
              <span className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                STATUS_STYLES[item.status] ?? "bg-stone-100 text-stone-500"
              )}>
                {STATUS_LABELS[item.status] ?? item.status}
              </span>
            )}
          </div>

          {/* Reasons */}
          {reasons.length > 0 && (
            <ul className="space-y-0.5">
              {reasons.slice(0, 2).map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-stone-500 leading-tight">
                  <span className={cn("mt-px shrink-0", cfg?.textClass ?? "text-stone-400")}>
                    {item.verdict === "buy" ? "✓" : item.verdict === "skip" ? "✕" : "·"}
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          )}

          {/* Footer */}
          <p className="text-[10px] text-stone-300">
            Saved {item.createdAt ? format(new Date(item.createdAt), "MMM d, yyyy") : "recently"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-1 shrink-0 ml-1">
          {item.imageUrl && <ScoreRing score={item.verdictScore} verdict={item.verdict} />}
          <div className="flex flex-col gap-0.5 mt-1">
            {item.productUrl && (
              <a
                href={item.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-stone-300 hover:text-primary hover:bg-primary/5 transition-all"
                title="View product"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-stone-300 hover:text-destructive hover:bg-destructive/5 transition-all"
              title="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

function FilterTab({
  label,
  count,
  active,
  onClick,
  color,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
        active
          ? "bg-stone-900 text-white border-stone-900"
          : "bg-white text-stone-500 border-stone-200 hover:border-stone-300 hover:text-stone-700"
      )}
    >
      {color && active && <span className={cn("w-1.5 h-1.5 rounded-full", color)} />}
      {label}
      <span className={cn(
        "text-[10px] font-bold px-1.5 py-px rounded-full",
        active ? "bg-white/20 text-white" : "bg-stone-100 text-stone-400"
      )}>
        {count}
      </span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SavedPage() {
  useEffect(() => {
    applySeo({ title: "Saved Items — Worthly", noindex: true });
  }, []);

  const [filter, setFilter] = useState<VerdictFilter>("all");
  const qc = useQueryClient();

  const { data: apiItems = [], isLoading } = useQuery<DetectedProduct[]>({
    queryKey: ["/api/detected-products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/detected-products", undefined, {
        "x-session-id": getSessionId(),
      });
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/detected-products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/detected-products"] }),
  });

  // Show mock data when API returns nothing (demo mode)
  const items: DetectedProduct[] = apiItems.length > 0 ? apiItems : MOCK_DETECTED_PRODUCTS;
  const isDemo = apiItems.length === 0;

  const filtered = filter === "all" ? items : items.filter((i) => i.verdict === filter);

  const counts = {
    all:  items.length,
    buy:  items.filter((i) => i.verdict === "buy").length,
    wait: items.filter((i) => i.verdict === "wait").length,
    skip: items.filter((i) => i.verdict === "skip").length,
  };

  const filters: { key: VerdictFilter; label: string; color?: string }[] = [
    { key: "all",  label: "All" },
    { key: "buy",  label: "Buy",  color: "bg-green-400" },
    { key: "wait", label: "Wait", color: "bg-amber-400" },
    { key: "skip", label: "Skip", color: "bg-red-400" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(38_25%_97%)] pb-20 md:pb-0">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-stone-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(38_25%_97%)] pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-bold text-xl tracking-tight flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary" />
              Saved Items
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Products analyzed by the Worthly browser extension.
            </p>
          </div>
          <span className="text-sm font-semibold text-stone-400 shrink-0 mt-1">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Demo notice */}
        {isDemo && items.length > 0 && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
            <span className="text-amber-500 text-sm mt-0.5">💡</span>
            <div>
              <p className="text-xs font-semibold text-amber-700">Demo data</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Install the Worthly browser extension and save real products to see them here.
              </p>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        {items.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map(({ key, label, color }) => (
              <FilterTab
                key={key}
                label={label}
                count={counts[key]}
                active={filter === key}
                onClick={() => setFilter(key)}
                color={color}
              />
            ))}
          </div>
        )}

        {/* Cards */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-stone-100 shadow-sm flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-stone-300" />
            </div>
            <div className="max-w-xs">
              <p className="font-semibold text-base">No saved products yet</p>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Install the Worthly browser extension and click "Save to Worthly" on any Amazon, Target, or Walmart product page.
              </p>
            </div>
            <a
              href="http://localhost:5000/settings"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{ background: "hsl(32 95% 54%)" }}
            >
              Get the extension
            </a>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">No {filter} items saved.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onDelete={() => !isDemo && deleteMutation.mutate(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
