import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Sparkles, ChevronRight, History } from "lucide-react";
import { getSessionId } from "@/lib/session";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface HistoryEntry {
  id: number;
  message: string | null;
  category: string | null;
  budgetMax: number | null;
  createdAt: string | null;
  status: string | null;
  recommendation?: {
    verdict: string | null;
    confidenceScore: number | null;
    explanation: string | null;
    products: any[];
  } | null;
}

function VerdictChip({ verdict }: { verdict?: string | null }) {
  if (!verdict) return null;
  const map: Record<string, string> = {
    buy:  "verdict-buy",
    wait: "verdict-wait",
    skip: "verdict-skip",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold", map[verdict] || "bg-secondary text-muted-foreground")}>
      {verdict.charAt(0).toUpperCase() + verdict.slice(1)}
    </span>
  );
}

export default function HistoryPage() {
  const { data: entries = [], isLoading } = useQuery<HistoryEntry[]>({
    queryKey: ["/api/history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/history", undefined, { "x-session-id": getSessionId() });
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Query History
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{entries.length} past decision{entries.length !== 1 ? "s" : ""}</p>
          </div>
          <Link href="/app">
            <Button size="sm" className="gap-1.5 text-xs" style={{ background: "hsl(32 95% 54%)", color: "white" }}>
              <Sparkles className="w-3.5 h-3.5" /> New query
            </Button>
          </Link>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-secondary animate-pulse"/>
            ))}
          </div>
        )}

        {!isLoading && entries.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
              <Clock className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">No history yet</p>
              <p className="text-sm text-muted-foreground mt-1">Your past decisions will appear here.</p>
            </div>
            <Link href="/app">
              <Button size="sm" style={{ background: "hsl(32 95% 54%)", color: "white" }}>
                Make your first decision
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && entries.length > 0 && (
          <div className="space-y-3">
            {entries.map(entry => (
              <div key={entry.id}
                className="rounded-2xl border bg-card p-4 space-y-3 hover:border-primary/20 transition-all"
                data-testid={`history-entry-${entry.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-sm font-medium leading-snug line-clamp-2">
                      {entry.message || `Query in ${entry.category || "general"}`}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.category && (
                        <Badge variant="secondary" className="text-xs capitalize">{entry.category}</Badge>
                      )}
                      {entry.budgetMax && (
                        <span className="text-xs text-muted-foreground">Up to ${entry.budgetMax}</span>
                      )}
                      {entry.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          {format(new Date(entry.createdAt), "MMM d, h:mm a")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.recommendation?.verdict && (
                      <VerdictChip verdict={entry.recommendation.verdict} />
                    )}
                  </div>
                </div>

                {/* Top product preview */}
                {entry.recommendation?.products && entry.recommendation.products.length > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-0.5">Top pick</p>
                      <p className="text-sm font-medium">{entry.recommendation.products[0]?.title}</p>
                      {entry.recommendation.products[0]?.scores?.finalScore && (
                        <span className="text-xs text-primary font-semibold">
                          Score: {entry.recommendation.products[0].scores.finalScore}/100
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                  </div>
                )}

                {/* Explanation preview */}
                {entry.recommendation?.explanation && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {entry.recommendation.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
