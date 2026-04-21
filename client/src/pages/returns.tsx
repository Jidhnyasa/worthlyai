import { useEffect, useState } from "react";
import { applySeo } from "@/lib/seo";
import Navbar from "@/components/Navbar";
import { MOCK_PURCHASES } from "@/lib/purchases-data";
import type { Purchase, ReturnStatus } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Package, AlertTriangle, Clock, CheckCircle, PlusCircle } from "lucide-react";

function StatusBadge({ status, days }: { status: ReturnStatus; days: number }) {
  if (status === "expired") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-500">
        <CheckCircle className="w-3 h-3" /> Expired
      </span>
    );
  }
  if (status === "expiring_soon") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
        <AlertTriangle className="w-3 h-3" /> {days}d left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
      <Clock className="w-3 h-3" /> {days}d left
    </span>
  );
}

function ReturnProgressBar({ days, total }: { days: number; total: number }) {
  const pct = Math.max(0, Math.min(100, (days / total) * 100));
  const color = days <= 0 ? "bg-stone-200"
    : days <= 7 ? "bg-red-400"
    : days <= 14 ? "bg-amber-400"
    : "bg-emerald-400";
  return (
    <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function PurchaseCard({ purchase }: { purchase: Purchase }) {
  const isExpired = purchase.returnStatus === "expired";
  return (
    <div className={cn(
      "bg-white rounded-2xl border shadow-sm overflow-hidden",
      purchase.returnStatus === "expiring_soon" ? "border-red-100" : "border-stone-100",
    )}>
      <div className="flex gap-4 p-4">
        {purchase.imageUrl && (
          <img
            src={purchase.imageUrl}
            alt={purchase.title}
            className="w-16 h-16 rounded-xl object-cover border border-stone-100 shrink-0"
          />
        )}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">{purchase.brand}</p>
              <p className="font-bold text-sm leading-snug">{purchase.title}</p>
            </div>
            <StatusBadge status={purchase.returnStatus} days={purchase.daysUntilDeadline} />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{purchase.merchant}</span>
            {purchase.orderNumber && <span>#{purchase.orderNumber}</span>}
            <span className="font-semibold text-stone-700">${purchase.price.toFixed(2)}</span>
          </div>
          {!isExpired && (
            <ReturnProgressBar days={purchase.daysUntilDeadline} total={purchase.returnWindowDays} />
          )}
          <p className="text-xs text-muted-foreground">
            Purchased {purchase.purchasedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" · "}
            {isExpired
              ? `Return window closed ${Math.abs(purchase.daysUntilDeadline)}d ago`
              : `${purchase.returnWindowDays}-day return window`}
          </p>
        </div>
      </div>
    </div>
  );
}

const FILTERS: { label: string; value: ReturnStatus | "all" }[] = [
  { label: "All",     value: "all" },
  { label: "Active",  value: "active" },
  { label: "Expiring",value: "expiring_soon" },
  { label: "Expired", value: "expired" },
];

export default function ReturnsPage() {
  const [filter, setFilter] = useState<ReturnStatus | "all">("all");

  useEffect(() => {
    applySeo({ title: "Returns — Worthly", noindex: true });
  }, []);

  const filtered = filter === "all"
    ? MOCK_PURCHASES
    : MOCK_PURCHASES.filter(p => p.returnStatus === filter);

  const sorted = [...filtered].sort((a, b) => {
    if (a.returnStatus === "expired" && b.returnStatus !== "expired") return 1;
    if (a.returnStatus !== "expired" && b.returnStatus === "expired") return -1;
    return a.daysUntilDeadline - b.daysUntilDeadline;
  });

  const expiringCount = MOCK_PURCHASES.filter(p => p.returnStatus === "expiring_soon").length;

  return (
    <div className="min-h-screen bg-[hsl(38_25%_97%)] pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-bold text-xl tracking-tight">Returns</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track return windows across all purchases.</p>
          </div>
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white shrink-0"
            style={{ background: "hsl(32 95% 54%)" }}
            onClick={() => alert("Receipt upload coming soon")}
          >
            <PlusCircle className="w-3.5 h-3.5" /> Add purchase
          </button>
        </div>

        {/* Alert banner */}
        {expiringCount > 0 && (
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 border border-red-100">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                {expiringCount} return window{expiringCount > 1 ? "s" : ""} expiring soon
              </p>
              <p className="text-xs text-red-500 mt-0.5">
                Don't miss your window — act before the deadline.
              </p>
            </div>
          </div>
        )}

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all",
                filter === f.value
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
              )}
            >
              {f.label}
              {f.value !== "all" && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  ({MOCK_PURCHASES.filter(p => f.value === "all" ? true : p.returnStatus === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Purchase list */}
        {sorted.length > 0 ? (
          <div className="space-y-3">
            {sorted.map(p => <PurchaseCard key={p.id} purchase={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 space-y-3">
            <Package className="w-10 h-10 text-stone-200 mx-auto" />
            <p className="text-sm text-muted-foreground">No purchases in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
