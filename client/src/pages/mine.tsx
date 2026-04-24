import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { applySeo } from "@/lib/seo";
import { apiRequest } from "@/lib/queryClient";
import { getSessionId } from "@/lib/session";
import type { DetectedProduct } from "@shared/schema";
import { MOCK_DETECTED_PRODUCTS } from "@/lib/purchases-data";
import { cn } from "@/lib/utils";
import {
  Bookmark, Trash2, ExternalLink, ShoppingBag, Package,
  CreditCard, TrendingUp, AlertTriangle, Mail, Plus,
  ArrowRight, Search,
} from "lucide-react";
import { format } from "date-fns";

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabKey = "watching" | "returns" | "renewals" | "resale";

const TABS: { key: TabKey; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { key: "watching",  label: "Watching",  Icon: Bookmark    },
  { key: "returns",   label: "Returns",   Icon: Package     },
  { key: "renewals",  label: "Renewals",  Icon: CreditCard  },
  { key: "resale",    label: "Resale",    Icon: TrendingUp  },
];

// ─── Verdict badge ────────────────────────────────────────────────────────────

const BADGE = {
  buy:  { label: "BUY",  bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", bar: "bg-emerald-400" },
  wait: { label: "WAIT", bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   bar: "bg-amber-400"   },
  skip: { label: "SKIP", bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     bar: "bg-red-400"     },
} as const;

// ─── Product card (for Watching + Resale tabs) ────────────────────────────────

function ProductCard({ item, onDelete }: { item: DetectedProduct; onDelete: () => void }) {
  const cfg = BADGE[item.verdict as keyof typeof BADGE];
  const reasons = Array.isArray(item.verdictReasonJson) ? item.verdictReasonJson as string[] : [];

  return (
    <div className="flex rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-all group">
      <div className={cn("w-1 shrink-0", cfg?.bar ?? "bg-stone-200")} />
      <div className="flex flex-1 gap-3 p-4 min-w-0">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title}
            className="w-14 h-14 rounded-xl object-contain border border-stone-100 bg-stone-50 shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-stone-50 border border-stone-100 shrink-0 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-stone-300" />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-tight line-clamp-2 flex-1">{item.title}</p>
            {cfg && (
              <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0", cfg.bg, cfg.text, cfg.border)}>
                {cfg.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {item.merchant && (
              <span className="text-[11px] font-medium text-stone-400 bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full capitalize">
                {item.merchant}
              </span>
            )}
            {item.price != null && (
              <span className="text-xs font-bold text-stone-800">${Number(item.price).toFixed(2)}</span>
            )}
          </div>
          {reasons.length > 0 && (
            <ul className="space-y-0.5">
              {reasons.slice(0, 2).map((r, i) => (
                <li key={i} className="text-[11px] text-stone-500 leading-tight truncate">· {r}</li>
              ))}
            </ul>
          )}
          <p className="text-[10px] text-stone-300">
            {item.createdAt ? format(new Date(item.createdAt), "MMM d, yyyy") : "recently"}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 shrink-0 ml-1">
          {item.productUrl && (
            <a href={item.productUrl} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-stone-300 hover:text-primary hover:bg-primary/5 transition-all">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button onClick={onDelete}
            className="p-1.5 rounded-lg text-stone-300 hover:text-destructive hover:bg-destructive/5 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty states ─────────────────────────────────────────────────────────────

function EmptyWatching() {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white border border-stone-100 shadow-sm flex items-center justify-center">
        <Bookmark className="w-7 h-7 text-stone-300" />
      </div>
      <div className="max-w-xs space-y-1.5">
        <p className="font-semibold text-base text-stone-800">Nothing saved yet</p>
        <p className="text-sm text-stone-400 leading-relaxed">
          Paste a product URL on the Analyze page to get a verdict — then save it here.
        </p>
      </div>
      <Link href="/app">
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-white"
          style={{ background: "hsl(32 95% 54%)" }}>
          <Search className="w-3.5 h-3.5" /> Analyze a product
        </button>
      </Link>
    </div>
  );
}

function EmptyReturns() {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white border border-stone-100 shadow-sm flex items-center justify-center">
        <Package className="w-7 h-7 text-stone-300" />
      </div>
      <div className="max-w-xs space-y-1.5">
        <p className="font-semibold text-base text-stone-800">No return windows tracked</p>
        <p className="text-sm text-stone-400 leading-relaxed">
          Forward your order confirmation to{" "}
          <span className="font-semibold text-stone-600">receipts@worthlyai.com</span>{" "}
          and we'll track every return window automatically.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <a href="mailto:receipts@worthlyai.com"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-white"
          style={{ background: "hsl(32 95% 54%)" }}>
          <Mail className="w-3.5 h-3.5" /> Forward receipts
        </a>
        <button
          onClick={() => alert("Manual entry coming soon")}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add manually
        </button>
      </div>
    </div>
  );
}

function EmptyRenewals() {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white border border-stone-100 shadow-sm flex items-center justify-center">
        <CreditCard className="w-7 h-7 text-stone-300" />
      </div>
      <div className="max-w-sm space-y-1.5">
        <p className="font-semibold text-base text-stone-800">No subscriptions tracked</p>
        <p className="text-sm text-stone-400 leading-relaxed">
          Connect Gmail to auto-detect subscriptions from your inbox — renewals, charges, and cancellation links all in one place.
        </p>
      </div>
      <div className="flex flex-col gap-2 items-center">
        <button
          onClick={() => alert("Gmail connect coming soon — join the waitlist")}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-white"
          style={{ background: "hsl(32 95% 54%)" }}>
          <Mail className="w-3.5 h-3.5" /> Connect Gmail
        </button>
        <p className="text-[11px] text-stone-400">Gmail connect coming soon — <a href="/#pricing" className="text-amber-600 hover:underline">join the waitlist</a></p>
      </div>
    </div>
  );
}

function EmptyResale() {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white border border-stone-100 shadow-sm flex items-center justify-center">
        <TrendingUp className="w-7 h-7 text-stone-300" />
      </div>
      <div className="max-w-xs space-y-1.5">
        <p className="font-semibold text-base text-stone-800">No resale opportunities yet</p>
        <p className="text-sm text-stone-400 leading-relaxed">
          Mark an item from your <strong>Watching</strong> tab as "sell" and we'll suggest a resale price based on current market data.
        </p>
      </div>
      <button
        onClick={() => {}}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors">
        <ArrowRight className="w-3.5 h-3.5" /> Go to Watching
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MinePage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialTab = (params.get("tab") as TabKey) || "watching";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    applySeo({ title: "Mine — Worthly AI", noindex: true });
  }, []);

  // Update tab when URL param changes (e.g., redirect from /app/returns)
  useEffect(() => {
    const t = params.get("tab") as TabKey;
    if (t && TABS.some(tab => tab.key === t)) setActiveTab(t);
  }, [search]);

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

  const items: DetectedProduct[] = apiItems.length > 0 ? apiItems : MOCK_DETECTED_PRODUCTS;
  const isDemo = apiItems.length === 0;

  const watchingItems  = items.filter(i => i.verdict !== "skip");
  const resaleItems    = items.filter(i => i.status === "sell" || i.verdict === "skip");

  const tabCounts: Record<TabKey, number> = {
    watching: watchingItems.length,
    returns:  0,
    renewals: 0,
    resale:   resaleItems.length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(38_25%_97%)] pb-20 md:pb-0">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-stone-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(38_25%_97%)] pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-bold text-xl tracking-tight">Mine</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Everything you've saved, tracked, or analyzed — in one place.
            </p>
          </div>
          {isDemo && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-400 border border-stone-200 shrink-0 mt-1">
              Demo data
            </span>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3.5 px-2 text-xs font-semibold transition-all border-b-2",
                activeTab === key
                  ? "text-stone-900 border-amber-500 bg-amber-50/40"
                  : "text-stone-400 border-transparent hover:text-stone-600 hover:bg-stone-50"
              )}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {tabCounts[key] > 0 && (
                  <span className={cn(
                    "absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center text-white",
                    activeTab === key ? "bg-amber-500" : "bg-stone-400"
                  )}>
                    {tabCounts[key] > 9 ? "9+" : tabCounts[key]}
                  </span>
                )}
              </div>
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>

        {/* Demo notice */}
        {isDemo && activeTab === "watching" && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700">Demo data</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Analyze a product on <Link href="/app" className="underline">the Analyze page</Link> and save it to see your real items here.
              </p>
            </div>
          </div>
        )}

        {/* Tab content */}
        {activeTab === "watching" && (
          <div className="space-y-3">
            {watchingItems.length === 0 ? (
              <EmptyWatching />
            ) : (
              watchingItems.map(item => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onDelete={() => !isDemo && deleteMutation.mutate(item.id)}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "returns" && <EmptyReturns />}
        {activeTab === "renewals" && <EmptyRenewals />}

        {activeTab === "resale" && (
          <div className="space-y-3">
            {resaleItems.length === 0 ? (
              <EmptyResale />
            ) : (
              resaleItems.map(item => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onDelete={() => !isDemo && deleteMutation.mutate(item.id)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
