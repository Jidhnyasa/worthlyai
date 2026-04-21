import { useParams, Link } from "wouter";
import { Trophy, ArrowRight } from "lucide-react";
import PublicPageShell from "@/components/PublicPageShell";
import DiscoveryCTA from "@/components/DiscoveryCTA";
import VerdictBadge from "@/components/VerdictBadge";
import { getComparison } from "@/lib/discovery-data";
import { cn } from "@/lib/utils";

function ScoreCell({ value }: { value: number }) {
  const color = value >= 85 ? "text-emerald-600" : value >= 70 ? "text-amber-600" : "text-red-500";
  const bar   = value >= 85 ? "bg-emerald-400" : value >= 70 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="text-center space-y-1">
      <span className={cn("font-bold text-base", color)}>{value}</span>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden mx-auto w-12">
        <div className={cn("h-full rounded-full", bar)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

const SCORE_COLS = [
  { key: "final" as const,  label: "Score",  description: "Overall Worthly score" },
  { key: "fit" as const,    label: "Fit",    description: "Fit for most users" },
  { key: "value" as const,  label: "Value",  description: "Price-to-quality ratio" },
  { key: "proof" as const,  label: "Proof",  description: "Real-world validation" },
];

export default function CompareSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const data = getComparison(slug ?? "");

  if (!data) {
    return (
      <PublicPageShell title="Comparison Not Found" description="" canonical={`https://worthlyai.app/compare/${slug}`} noindex>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4 text-center">
          <p className="text-muted-foreground">We don't have this comparison yet.</p>
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
            style={{ background: "hsl(32 95% 54%)" }}
          >
            Run your own comparison <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </PublicPageShell>
    );
  }

  const winner = data.products[data.winnerIndex];

  return (
    <PublicPageShell
      title={data.title}
      description={data.description}
      canonical={`https://worthlyai.app/compare/${data.slug}`}
    >
      {/* ── Hero ── */}
      <section
        className="py-16 px-6"
        style={{ background: "linear-gradient(180deg, hsl(20 25% 8%) 0%, hsl(20 25% 11%) 100%)" }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <nav className="text-xs text-white/30 flex items-center justify-center gap-1.5 mb-2">
            <Link href="/" className="hover:text-white/60 transition-colors">Worthly</Link>
            <span>/</span>
            <Link href="/compare" className="hover:text-white/60 transition-colors">Compare</Link>
            <span>/</span>
            <span className="text-white/50 truncate max-w-[200px]">{data.title}</span>
          </nav>

          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: "hsl(32 95% 54% / 0.14)", border: "1px solid hsl(32 95% 54% / 0.28)", color: "hsl(32 95% 65%)" }}
          >
            Worthly Comparison
          </div>

          <h1
            className="font-bold text-white"
            style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.6rem)", lineHeight: 1.1 }}
          >
            {data.title}
          </h1>
          <p className="text-white/50 max-w-xl mx-auto">{data.description}</p>
        </div>
      </section>

      {/* ── Winner Card ── */}
      <section className="px-6 -mt-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-2xl p-5 flex items-center gap-4 shadow-lg"
            style={{ background: "hsl(32 95% 54% / 0.09)", border: "1px solid hsl(32 95% 54% / 0.22)" }}
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "hsl(32 95% 54%)" }}
            >
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-600 mb-0.5">Worthly's top pick</p>
              <p className="font-bold text-base truncate">{winner.title}</p>
              <p className="text-xs text-muted-foreground">{data.winnerReason}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-bold text-amber-500">{winner.scores.final}</div>
              <div className="text-xs text-muted-foreground">/100</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison Table — desktop ── */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className={`grid border-b border-stone-100 bg-stone-50/60`}
              style={{ gridTemplateColumns: `minmax(0,1.5fr) repeat(${SCORE_COLS.length}, minmax(0,1fr))` }}>
              <div className="p-4 text-sm font-semibold text-muted-foreground">Product</div>
              {SCORE_COLS.map(col => (
                <div key={col.key} className="p-4 text-center text-sm font-semibold text-muted-foreground">{col.label}</div>
              ))}
            </div>
            {/* Rows */}
            {data.products.map((p, i) => (
              <div
                key={i}
                className={cn(
                  "grid border-b border-stone-100/70 last:border-0 transition-colors hover:bg-stone-50/40",
                  i === data.winnerIndex && "bg-amber-50/40"
                )}
                style={{ gridTemplateColumns: `minmax(0,1.5fr) repeat(${SCORE_COLS.length}, minmax(0,1fr))` }}
              >
                <div className="p-4 flex items-center gap-3">
                  <img src={p.imageUrl} alt={p.title} className="w-10 h-10 rounded-lg object-cover border border-stone-100 shrink-0" />
                  <div className="min-w-0">
                    {i === data.winnerIndex && (
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide block">Top Pick</span>
                    )}
                    <p className="font-semibold text-sm truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.brand} · ${p.price}</p>
                  </div>
                </div>
                {SCORE_COLS.map(col => (
                  <div key={col.key} className="p-4 flex items-center justify-center">
                    <ScoreCell value={p.scores[col.key]} />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {data.products.map((p, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-2xl border bg-white p-5 space-y-4 shadow-sm",
                  i === data.winnerIndex ? "border-amber-200" : "border-stone-100"
                )}
              >
                <div className="flex items-start gap-3">
                  <img src={p.imageUrl} alt={p.title} className="w-14 h-14 rounded-xl object-cover border border-stone-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    {i === data.winnerIndex && (
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide block mb-0.5">Top Pick</span>
                    )}
                    <p className="font-bold text-sm">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.brand} · ${p.price}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-amber-500">{p.scores.final}</div>
                    <div className="text-xs text-muted-foreground">/100</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-sm border-t border-stone-100 pt-4">
                  {SCORE_COLS.filter(c => c.key !== "final").map(col => (
                    <div key={col.key}>
                      <p className="text-xs text-muted-foreground mb-1">{col.label}</p>
                      <p className={cn("font-bold", p.scores[col.key] >= 85 ? "text-emerald-600" : p.scores[col.key] >= 70 ? "text-amber-600" : "text-red-500")}>
                        {p.scores[col.key]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pros / Cons grid ── */}
      <section className="py-10 px-6 bg-[hsl(38_25%_97%)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-bold text-xl mb-6">Side-by-side breakdown</h2>
          <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${data.products.length}, minmax(0,1fr))` }}>
            {data.products.map((p, i) => (
              <div key={i} className={cn("rounded-2xl border bg-white p-5 shadow-sm space-y-4", i === data.winnerIndex ? "border-amber-200" : "border-stone-100")}>
                <p className="font-bold text-sm">{p.title}</p>
                <div>
                  <p className="text-xs font-semibold text-emerald-600 mb-1.5">Pros</p>
                  <ul className="space-y-1">
                    {p.pros.map(pro => (
                      <li key={pro} className="text-xs text-stone-600 flex gap-1.5">
                        <span className="text-emerald-500 shrink-0">✓</span>{pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-500 mb-1.5">Cons</p>
                  <ul className="space-y-1">
                    {p.cons.map(con => (
                      <li key={con} className="text-xs text-stone-600 flex gap-1.5">
                        <span className="text-red-400 shrink-0">✗</span>{con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Related ── */}
      {data.relatedSlugs.length > 0 && (
        <section className="py-10 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Related comparisons</p>
            <div className="flex flex-wrap gap-3">
              {data.relatedSlugs.map(s => (
                <Link
                  key={s}
                  href={`/compare/${s}`}
                  className="px-4 py-2 rounded-full border border-stone-200 bg-white text-sm hover:border-amber-300 hover:text-amber-700 transition-all"
                >
                  {s.replace(/-/g, " ")} →
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <DiscoveryCTA
        headline="Run your own comparison."
        subline="Compare any products side-by-side — scored on fit, value, and real-world proof."
        ctaLabel="Compare now →"
        ctaHref="/compare"
      />
    </PublicPageShell>
  );
}
