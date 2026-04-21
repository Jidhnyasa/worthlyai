import { useEffect } from "react";
import { Link } from "wouter";
import { applySeo } from "@/lib/seo";
import Navbar from "@/components/Navbar";
import { getDashboardStats, MOCK_PURCHASES, MOCK_ACTIONS } from "@/lib/purchases-data";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCcw, CreditCard, Sparkles, ArrowRight, Clock } from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  accent: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className={cn(
        "bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer",
        accent === "amber"  && "hover:border-amber-200",
        accent === "red"    && "hover:border-red-200",
        accent === "blue"   && "hover:border-blue-200",
        accent === "emerald"&& "hover:border-emerald-200",
      )}>
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center",
            accent === "amber"   && "bg-amber-50",
            accent === "red"     && "bg-red-50",
            accent === "blue"    && "bg-blue-50",
            accent === "emerald" && "bg-emerald-50",
          )}>
            <Icon className={cn(
              "w-4.5 h-4.5",
              accent === "amber"   && "text-amber-500",
              accent === "red"     && "text-red-500",
              accent === "blue"    && "text-blue-500",
              accent === "emerald" && "text-emerald-500",
            )} />
          </div>
          <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
        </div>
        <div className="text-2xl font-bold text-stone-900 mb-0.5">{value}</div>
        <div className="text-sm font-medium text-stone-700">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
      </div>
    </Link>
  );
}

function DeadlineBar({ days }: { days: number }) {
  const pct = Math.max(0, Math.min(100, (days / 30) * 100));
  const color = days <= 7 ? "bg-red-400" : days <= 14 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="h-1 rounded-full bg-stone-100 overflow-hidden flex-1">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function DashboardPage() {
  useEffect(() => {
    applySeo({ title: "Dashboard — Worthly", noindex: true });
  }, []);

  const stats = getDashboardStats();
  const urgentPurchases = MOCK_PURCHASES
    .filter(p => p.returnStatus !== "expired")
    .sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline)
    .slice(0, 3);
  const pendingActions = MOCK_ACTIONS.filter(a => !a.completed).slice(0, 3);

  return (
    <div className="min-h-screen bg-[hsl(38_25%_97%)] pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-bold text-xl tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your money, protected.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={AlertTriangle}
            label="Returns expiring"
            value={String(stats.expiringReturns)}
            sub="Act before the deadline"
            accent="red"
            href="/app/returns"
          />
          <StatCard
            icon={Clock}
            label="Active return windows"
            value={String(stats.activeReturns)}
            sub={`$${stats.atRisk.toFixed(0)} still recoverable`}
            accent="amber"
            href="/app/returns"
          />
          <StatCard
            icon={CreditCard}
            label="Monthly subscriptions"
            value={`$${stats.subscriptionMonthly.toFixed(2)}`}
            sub="2 flagged as unused"
            accent="blue"
            href="/app/subscriptions"
          />
          <StatCard
            icon={Sparkles}
            label="Potential savings"
            value={`$${stats.potentialSavings.toFixed(0)}`}
            sub={`${pendingActions.length} actions waiting`}
            accent="emerald"
            href="/app/actions"
          />
        </div>

        {/* Return deadlines */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-50">
            <h2 className="font-semibold text-sm">Return windows</h2>
            <Link href="/app/returns" className="text-xs text-amber-600 hover:underline font-medium">
              See all
            </Link>
          </div>
          <div className="divide-y divide-stone-50">
            {urgentPurchases.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                {p.imageUrl && (
                  <img src={p.imageUrl} alt={p.title} className="w-10 h-10 rounded-lg object-cover border border-stone-100 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.brand} {p.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <DeadlineBar days={p.daysUntilDeadline} />
                    <span className={cn(
                      "text-xs font-semibold shrink-0",
                      p.daysUntilDeadline <= 7  ? "text-red-500"
                      : p.daysUntilDeadline <= 14 ? "text-amber-500"
                      : "text-emerald-600"
                    )}>
                      {p.daysUntilDeadline}d left
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold text-stone-700 shrink-0">${p.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top actions */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-50">
            <h2 className="font-semibold text-sm">Recommended actions</h2>
            <Link href="/app/actions" className="text-xs text-amber-600 hover:underline font-medium">
              See all
            </Link>
          </div>
          <div className="divide-y divide-stone-50">
            {pendingActions.map(a => (
              <Link key={a.id} href="/app/actions">
                <div className="flex items-start gap-4 px-5 py-3.5 hover:bg-stone-50 transition-colors cursor-pointer">
                  <div className={cn(
                    "mt-0.5 w-2 h-2 rounded-full shrink-0",
                    a.priority === "high"   ? "bg-red-400"
                    : a.priority === "medium" ? "bg-amber-400"
                    : "bg-stone-300"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.description}</p>
                  </div>
                  {a.potentialSaving && (
                    <span className="text-xs font-bold text-emerald-600 shrink-0">
                      +${a.potentialSaving.toFixed(0)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Buy-Wait-Skip CTA */}
        <div
          className="rounded-2xl p-5 flex items-center justify-between"
          style={{ background: "hsl(32 95% 54% / 0.07)", border: "1px solid hsl(32 95% 54% / 0.18)" }}
        >
          <div>
            <p className="text-sm font-bold text-stone-900">Thinking about a new purchase?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Get a Buy / Wait / Skip verdict before you spend.</p>
          </div>
          <Link
            href="/app/verdicts"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white shrink-0"
            style={{ background: "hsl(32 95% 54%)" }}
          >
            <Sparkles className="w-3.5 h-3.5" /> Ask Worthly
          </Link>
        </div>
      </div>
    </div>
  );
}
