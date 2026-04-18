import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import DecisionForm from "@/components/DecisionForm";
import RecommendationCanvas from "@/components/RecommendationCanvas";
import { Button } from "@/components/ui/button";
import { Sparkles, History, Lightbulb, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { apiHeaders, getSessionId } from "@/lib/session";
import type { QueryPayload, RecommendationResult } from "@shared/schema";
import { cn } from "@/lib/utils";

const STARTER_QUERIES = [
  { label: "Best wireless headphones under $250 for commuting", category: "electronics", budgetMax: 250 },
  { label: "Stylish but cozy outfit for a dinner date under $150",  category: "fashion",     budgetMax: 150 },
  { label: "Coffee gift set under $80 for a coworker",              category: "gifting",     budgetMax: 80  },
  { label: "Best robot vacuum under $400",                          category: "home",        budgetMax: 400 },
  { label: "Running shoes for beginners under $130",                category: "fitness",     budgetMax: 130 },
];

interface QueryResult {
  queryId: number;
  recommendationId: number;
  result: RecommendationResult;
  payload: QueryPayload;
}

export default function AppPage() {
  const [results, setResults]         = useState<QueryResult[]>([]);
  const [showForm, setShowForm]       = useState(true);
  const [initialValues, setInitialValues] = useState<Partial<QueryPayload>>({});
  const resultsRef = useRef<HTMLDivElement>(null);

  const queryMutation = useMutation({
    mutationFn: async (payload: QueryPayload) => {
      const res = await apiRequest(
        "POST", "/api/query",
        { ...payload, sessionId: getSessionId() },
        { "x-session-id": getSessionId() },
      );
      return res.json();
    },
    onSuccess: (data, payload) => {
      setResults(prev => [{ ...data, payload }, ...prev]);
      setShowForm(false);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    },
  });

  function handleSubmit(payload: QueryPayload) {
    queryMutation.mutate(payload);
  }

  function handleNewQuery() {
    setShowForm(true);
    setInitialValues({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function useStarterQuery(sq: typeof STARTER_QUERIES[0]) {
    setInitialValues({ message: sq.label, category: sq.category, budgetMax: sq.budgetMax });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ── Layout: form left, results right ── */}
        <div className={cn(
          "grid gap-6 transition-all",
          results.length > 0 ? "md:grid-cols-[420px_1fr]" : "max-w-xl mx-auto"
        )}>

          {/* ── Left: Decision Form ── */}
          {(showForm || results.length === 0) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-bold text-lg tracking-tight">Decision Panel</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">Set your parameters, get a structured verdict</p>
                </div>
                {results.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-xs">
                    Hide form
                  </Button>
                )}
              </div>

              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <DecisionForm
                  onSubmit={handleSubmit}
                  loading={queryMutation.isPending}
                  initialValues={initialValues}
                />
              </div>

              {/* Starter suggestions */}
              {results.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Try one of these
                  </p>
                  {STARTER_QUERIES.map((sq, i) => (
                    <button
                      key={i}
                      onClick={() => useStarterQuery(sq)}
                      className="w-full text-left text-xs px-3.5 py-2.5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-between gap-2 group"
                    >
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                        {sq.label}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Right: Results ── */}
          {results.length > 0 && (
            <div className="space-y-6" ref={resultsRef}>
              {/* Show-form toggle when hidden */}
              {!showForm && (
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-base">Your results</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="text-xs gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> New query
                    </Button>
                    <Link href="/history">
                      <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground">
                        <History className="w-3.5 h-3.5" /> History
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Most recent first */}
              {results.map((r, i) => (
                <div key={r.queryId} className="space-y-3">
                  {i > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 border-t border-border"/>
                      <span className="text-xs text-muted-foreground">Earlier query</span>
                      <div className="flex-1 border-t border-border"/>
                    </div>
                  )}
                  {i === 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        Latest
                      </span>
                      <span className="truncate">{r.payload.message}</span>
                    </div>
                  )}
                  <RecommendationCanvas
                    result={r.result}
                    queryId={r.queryId}
                    recommendationId={r.recommendationId}
                    onNewQuery={i === 0 ? handleNewQuery : undefined}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty state */}
        {results.length === 0 && !queryMutation.isPending && (
          <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Fill in the form above and click <strong>Get my recommendation</strong>
            </p>
          </div>
        )}

        {/* Loading state */}
        {queryMutation.isPending && (
          <div className="mt-8 flex flex-col items-center gap-3 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl animate-pulse-amber flex items-center justify-center"
              style={{ background: "hsl(32 95% 54% / 0.15)", border: "1px solid hsl(32 95% 54% / 0.3)" }}>
              <Sparkles className="w-6 h-6 text-amber-500 animate-spin" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium">Analyzing your query…</p>
              <p className="text-xs text-muted-foreground">Running fit, value, proof, and regret scoring</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {queryMutation.isError && (
          <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            Something went wrong. Please check your API key in Settings and try again.
          </div>
        )}
      </div>
    </div>
  );
}
