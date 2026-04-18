import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bookmark, Trash2, ExternalLink, DollarSign, Sparkles, PackageSearch,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getSessionId } from "@/lib/session";
import type { SavedItem } from "@shared/schema";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function VerdictPill({ verdict }: { verdict?: string | null }) {
  if (!verdict) return null;
  const map = {
    buy:  "verdict-buy text-xs px-2 py-0.5 rounded-full",
    wait: "verdict-wait text-xs px-2 py-0.5 rounded-full",
    skip: "verdict-skip text-xs px-2 py-0.5 rounded-full",
  } as const;
  return (
    <span className={map[verdict as keyof typeof map] || "text-xs"}>
      {verdict.charAt(0).toUpperCase() + verdict.slice(1)}
    </span>
  );
}

export default function SavedPage() {
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery<SavedItem[]>({
    queryKey: ["/api/saved"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/saved", undefined, { "x-session-id": getSessionId() });
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/saved/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/saved"] }),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-2xl bg-secondary animate-pulse"/>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary" />
              Saved Products
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""}</p>
          </div>
          {items.length > 0 && (
            <Link href="/app">
              <Button size="sm" className="gap-1.5 text-xs" style={{ background: "hsl(32 95% 54%)", color: "white" }}>
                <Sparkles className="w-3.5 h-3.5" /> New query
              </Button>
            </Link>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
              <PackageSearch className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">No saved products yet</p>
              <p className="text-sm text-muted-foreground mt-1">Save products from your recommendations to track them here.</p>
            </div>
            <Link href="/app">
              <Button size="sm" style={{ background: "hsl(32 95% 54%)", color: "white" }}>
                Make a decision
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id}
                className="rounded-2xl border bg-card p-4 flex items-start gap-4 group hover:border-primary/25 transition-all"
                data-testid={`saved-item-${item.id}`}>
                {/* Score badge */}
                {item.score && (
                  <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0"
                    style={{ background: "hsl(32 95% 54% / 0.10)", border: "1px solid hsl(32 95% 54% / 0.18)" }}>
                    <span className="text-base font-bold leading-none" style={{ color: "hsl(32 95% 45%)" }}>{item.score}</span>
                    <span className="text-[9px] text-muted-foreground">/100</span>
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm leading-tight">{item.productTitle}</p>
                      {item.productBrand && (
                        <p className="text-xs text-muted-foreground">{item.productBrand}</p>
                      )}
                    </div>
                    <VerdictPill verdict={item.verdict} />
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {item.productPrice && (
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-foreground">
                        <DollarSign className="w-3 h-3" />{item.productPrice}
                      </span>
                    )}
                    {item.category && (
                      <Badge variant="secondary" className="text-xs capitalize">{item.category}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.savedAt || Date.now()), "MMM d")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {item.merchantUrl && (
                    <a href={item.merchantUrl} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
                    data-testid={`delete-saved-${item.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
