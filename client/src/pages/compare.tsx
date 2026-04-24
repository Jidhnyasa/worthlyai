import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Plus, X, ArrowRight, BarChart2, TrendingUp, Shield, Zap,
  ExternalLink, Trophy, DollarSign, Sparkles,
} from "lucide-react";
import { getSessionId } from "@/lib/session";
import { apiRequest } from "@/lib/queryClient";
import type { ScoredProduct, RecommendationResult } from "@shared/schema";
import { cn } from "@/lib/utils";

function ScoreCell({ value }: { value: number }) {
  const color = value >= 80 ? "text-green-600" : value >= 60 ? "text-amber-600" : "text-red-500";
  return (
    <div className="text-center">
      <span className={cn("font-bold text-base", color)}>{value}</span>
      <div className="mt-1 h-1 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full score-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [items, setItems]   = useState<string[]>(["", ""]);
  const [budget, setBudget] = useState(300);
  const [result, setResult] = useState<RecommendationResult | null>(null);

  const compareMutation = useMutation({
    mutationFn: async () => {
      const validItems = items.filter(i => i.trim());
      if (validItems.length < 2) throw new Error("Need at least 2 items");

      const message = `Compare these products side by side: ${validItems.join(" vs ")}. Budget up to $${budget}.`;
      const res = await apiRequest(
        "POST", "/api/query",
        { message, category: "comparison", budgetMax: budget, sessionId: getSessionId() },
        { "x-session-id": getSessionId() },
      );
      return res.json();
    },
    onSuccess: data => setResult(data.result),
  });

  function addItem()        { if (items.length < 5) setItems(p => [...p, ""]); }
  function removeItem(i: number) { setItems(p => p.filter((_, idx) => idx !== i)); }
  function updateItem(i: number, v: string) { setItems(p => p.map((x, idx) => idx === i ? v : x)); }

  const allProducts: ScoredProduct[] = result
    ? [result.topChoice, ...(result.budgetPick ? [result.budgetPick] : []), ...(result.alternatives || [])]
    : [];

  const winner = allProducts.length > 0
    ? allProducts.reduce((a, b) => a.scores.finalScore > b.scores.finalScore ? a : b)
    : null;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="font-bold text-lg">Compare Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Enter products to compare side by side with Worthly AI scoring</p>
        </div>

        {/* Input panel */}
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "hsl(32 95% 54% / 0.12)", color: "hsl(32 95% 45%)" }}>
                  {i + 1}
                </div>
                <Input
                  value={item}
                  onChange={e => updateItem(i, e.target.value)}
                  placeholder={`Product ${i + 1} (e.g., Sony WH-1000XM5)`}
                  className="flex-1"
                  data-testid={`input-compare-${i}`}
                />
                {items.length > 2 && (
                  <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {items.length < 5 && (
            <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add product
            </Button>
          )}

          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <label className="font-medium text-muted-foreground">Budget</label>
              <span className="font-bold text-primary">${budget}</span>
            </div>
            <Slider min={0} max={2000} step={25} value={[budget]} onValueChange={([v]) => setBudget(v)} />
          </div>

          <Button
            onClick={() => compareMutation.mutate()}
            disabled={compareMutation.isPending || items.filter(i => i.trim()).length < 2}
            className="w-full gap-2 font-semibold"
            style={{ background: "hsl(32 95% 54%)", color: "white" }}
            data-testid="button-compare"
          >
            <Sparkles className="w-4 h-4" />
            {compareMutation.isPending ? "Comparing…" : "Compare now"}
          </Button>
        </div>

        {/* Results */}
        {result && allProducts.length > 0 && (
          <div className="space-y-6 animate-slide-up">
            {/* Winner banner */}
            {winner && (
              <div className="rounded-2xl p-5 flex items-center gap-4"
                style={{ background: "hsl(32 95% 54% / 0.08)", border: "1px solid hsl(32 95% 54% / 0.20)" }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: "hsl(32 95% 54%)" }}>
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-600 mb-0.5">Worthly AI's top pick</p>
                  <p className="font-bold text-base">{winner.title}</p>
                  <p className="text-xs text-muted-foreground">{winner.reason}</p>
                </div>
                <div className="ml-auto text-right shrink-0">
                  <div className="text-2xl font-bold text-primary">{winner.scores.finalScore}</div>
                  <div className="text-xs text-muted-foreground">/100</div>
                </div>
              </div>
            )}

            {/* Comparison table — desktop */}
            <div className="hidden md:block rounded-2xl border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Product</th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground">
                      <div className="flex items-center justify-center gap-1"><BarChart2 className="w-3.5 h-3.5"/>Score</div>
                    </th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground">
                      <div className="flex items-center justify-center gap-1"><Shield className="w-3.5 h-3.5"/>Fit</div>
                    </th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground">
                      <div className="flex items-center justify-center gap-1"><TrendingUp className="w-3.5 h-3.5"/>Value</div>
                    </th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground">
                      <div className="flex items-center justify-center gap-1"><Zap className="w-3.5 h-3.5"/>Proof</div>
                    </th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground">Price</th>
                    <th className="py-3 px-3"/>
                  </tr>
                </thead>
                <tbody>
                  {allProducts.map((p, i) => (
                    <tr key={i}
                      className={cn(
                        "border-b border-border/50 transition-colors hover:bg-secondary/20",
                        p === winner && "bg-primary/5"
                      )}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {p === winner && (
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "hsl(32 95% 54%)" }}/>
                          )}
                          <div>
                            <p className="font-semibold">{p.title}</p>
                            {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 w-20"><ScoreCell value={p.scores.finalScore} /></td>
                      <td className="py-3.5 px-3 w-16"><ScoreCell value={p.scores.fitScore} /></td>
                      <td className="py-3.5 px-3 w-16"><ScoreCell value={p.scores.valueScore} /></td>
                      <td className="py-3.5 px-3 w-16"><ScoreCell value={p.scores.proofScore} /></td>
                      <td className="py-3.5 px-3 text-center text-sm font-medium">
                        {p.price ? `$${p.price}` : p.priceRange || "—"}
                      </td>
                      <td className="py-3.5 px-3">
                        {p.offers[0] && (
                          <a href={p.offers[0].merchantUrl || "#"} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            Buy <ExternalLink className="w-3 h-3"/>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: stacked cards */}
            <div className="md:hidden space-y-3">
              {allProducts.map((p, i) => (
                <div key={i}
                  className={cn(
                    "rounded-2xl border bg-card p-4 space-y-3",
                    p === winner ? "border-primary/25" : "border-border"
                  )}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {p === winner && (
                        <Badge variant="outline" className="text-xs mb-1 text-primary border-primary/30">
                          Top Pick
                        </Badge>
                      )}
                      <p className="font-semibold text-sm">{p.title}</p>
                      {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-primary">{p.scores.finalScore}</p>
                      <p className="text-xs text-muted-foreground">/100</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[["Fit", p.scores.fitScore], ["Value", p.scores.valueScore], ["Proof", p.scores.proofScore]].map(([l, v]) => (
                      <div key={l as string} className="text-center">
                        <p className="text-muted-foreground">{l}</p>
                        <p className="font-bold">{v}</p>
                      </div>
                    ))}
                  </div>
                  {p.price && (
                    <p className="text-sm font-medium flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5"/> ${p.price}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.reason}</p>
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div className="rounded-2xl border bg-card p-5 space-y-3">
              <h3 className="font-semibold text-sm">Why this ranking?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.explanation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
