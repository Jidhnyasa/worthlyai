import { useEffect } from "react";
import { applySeo } from "@/lib/seo";
import Navbar from "@/components/Navbar";
import { MOCK_SUBSCRIPTIONS } from "@/lib/purchases-data";
import type { Subscription } from "@shared/schema";
import { cn } from "@/lib/utils";
import { AlertCircle, PlusCircle, CreditCard, RefreshCcw } from "lucide-react";

function RenewalBadge({ days }: { days: number }) {
  if (days <= 1) return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
      Renews tomorrow
    </span>
  );
  if (days <= 5) return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
      Renews in {days}d
    </span>
  );
  return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-500">
      Renews in {days}d
    </span>
  );
}

function SubscriptionCard({ sub }: { sub: Subscription }) {
  const initial = sub.name[0].toUpperCase();
  const colors = ["bg-blue-500", "bg-purple-500", "bg-rose-500", "bg-emerald-500", "bg-amber-500"];
  const colorIdx = sub.name.charCodeAt(0) % colors.length;

  return (
    <div className={cn(
      "bg-white rounded-2xl border shadow-sm p-4",
      sub.usageFlag ? "border-amber-100" : "border-stone-100",
    )}>
      <div className="flex items-start gap-3">
        {/* Logo placeholder */}
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0", colors[colorIdx])}>
          {initial}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-sm">{sub.name}</p>
            <RenewalBadge days={sub.daysUntilRenewal} />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-stone-700">
              ${sub.price.toFixed(2)}/{sub.billingCycle === "monthly" ? "mo" : "yr"}
            </span>
            <span>·</span>
            <span>{sub.category}</span>
          </div>

          {sub.usageFlag && (
            <div className="flex items-center gap-1.5 mt-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-xs text-amber-600 font-medium">
                {sub.usageFlag === "unused" ? "Not used recently — consider cancelling" : "Low usage detected"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          className="flex-1 text-xs font-semibold py-2 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors"
          onClick={() => alert("Draft cancellation email in Actions tab")}
        >
          Cancel
        </button>
        <button
          className="flex-1 text-xs font-semibold py-2 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors"
          onClick={() => alert("Negotiation draft in Actions tab")}
        >
          Negotiate
        </button>
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  useEffect(() => {
    applySeo({ title: "Subscriptions — Worthly", noindex: true });
  }, []);

  const flagged  = MOCK_SUBSCRIPTIONS.filter(s => s.usageFlag);
  const upcoming = MOCK_SUBSCRIPTIONS.filter(s => !s.usageFlag && s.daysUntilRenewal <= 7);
  const rest     = MOCK_SUBSCRIPTIONS.filter(s => !s.usageFlag && s.daysUntilRenewal > 7);

  const monthlyTotal = MOCK_SUBSCRIPTIONS
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="min-h-screen bg-[hsl(38_25%_97%)] pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-bold text-xl tracking-tight">Subscriptions</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track renewals and spot waste.</p>
          </div>
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white shrink-0"
            style={{ background: "hsl(32 95% 54%)" }}
            onClick={() => alert("Add subscription coming soon")}
          >
            <PlusCircle className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {/* Monthly spend summary */}
        <div
          className="rounded-2xl p-5 flex items-center justify-between"
          style={{ background: "hsl(20 25% 8%)" }}
        >
          <div>
            <p className="text-xs text-white/40 font-medium uppercase tracking-wide">Monthly spend</p>
            <p className="text-3xl font-bold text-white mt-1">${monthlyTotal.toFixed(2)}</p>
            <p className="text-xs text-white/40 mt-0.5">{MOCK_SUBSCRIPTIONS.length} active subscriptions</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              {flagged.length} flagged
            </div>
            <div className="text-xs text-white/30">
              ${(monthlyTotal * 12).toFixed(0)}/year
            </div>
          </div>
        </div>

        {/* Flagged */}
        {flagged.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-sm">Flagged — possible waste</h2>
            </div>
            {flagged.map(s => <SubscriptionCard key={s.id} sub={s} />)}
          </div>
        )}

        {/* Upcoming renewals */}
        {upcoming.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-stone-400" />
              <h2 className="font-semibold text-sm">Renewing soon</h2>
            </div>
            {upcoming.map(s => <SubscriptionCard key={s.id} sub={s} />)}
          </div>
        )}

        {/* Rest */}
        {rest.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-stone-400" />
              <h2 className="font-semibold text-sm">All subscriptions</h2>
            </div>
            {rest.map(s => <SubscriptionCard key={s.id} sub={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}
