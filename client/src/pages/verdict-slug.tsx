import { useParams, Link } from "wouter";
import { ShoppingCart, CheckCircle2, XCircle, AlertCircle, ArrowRight, ExternalLink } from "lucide-react";
import PublicPageShell from "@/components/PublicPageShell";
import DiscoveryCTA from "@/components/DiscoveryCTA";
import VerdictBadge from "@/components/VerdictBadge";
import { getVerdict, VERDICT_COLORS } from "@/lib/discovery-data";
import { cn } from "@/lib/utils";

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-bold">{value}<span className="text-muted-foreground font-normal">/100</span></span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function VerdictSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const data = getVerdict(slug ?? "");

  if (!data) {
    return (
      <PublicPageShell title="Verdict Not Found" description="" canonical={`https://worthlyai.app/verdict/${slug}`} noindex>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4 text-center">
          <p className="text-muted-foreground">We don't have a verdict for this product yet.</p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
            style={{ background: "hsl(32 95% 54%)" }}
          >
            Ask Worthly AI about it <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </PublicPageShell>
    );
  }

  const vc = VERDICT_COLORS[data.verdict];
  const regretDisplay = 100 - data.scores.regret; // invert: higher = less regret

  return (
    <PublicPageShell
      title={`Is the ${data.productTitle} Worth It?`}
      description={`Worthly AI's AI verdict on the ${data.productTitle}: ${data.verdict.toUpperCase()}. Confidence ${data.confidenceScore}/100. ${data.explanation.slice(0, 120)}…`}
      canonical={`https://worthlyai.app/verdict/${data.slug}`}
    >
      {/* ── Hero ── */}
      <section
        className="py-16 px-6"
        style={{ background: "linear-gradient(180deg, hsl(20 25% 8%) 0%, hsl(20 25% 11%) 100%)" }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-xs text-white/30 mb-6 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white/60 transition-colors">Worthly AI</Link>
            <span>/</span>
            <Link href={`/${data.category}`} className="hover:text-white/60 transition-colors capitalize">{data.category.replace("-", " ")}</Link>
            <span>/</span>
            <span className="text-white/50">{data.productTitle}</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <VerdictBadge verdict={data.verdict} size="lg" />

              <h1 className="text-white font-bold" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", lineHeight: 1.1 }}>
                Is the {data.productTitle} worth it?
              </h1>

              <p className="text-white/55 text-base leading-relaxed">{data.explanation}</p>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-400">{data.confidenceScore}</div>
                  <div className="text-xs text-white/35 mt-0.5">Worthly AI Score</div>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-xl font-bold text-white">${data.price}</div>
                  <div className="text-xs text-white/35 mt-0.5">From</div>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="text-center">
                  <div className={cn("text-xl font-bold", vc.text)}>{vc.label}</div>
                  <div className="text-xs text-white/35 mt-0.5">Verdict</div>
                </div>
              </div>
            </div>

            {/* Product image */}
            <div className="relative rounded-3xl overflow-hidden aspect-square max-w-sm mx-auto w-full"
              style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.4)" }}>
              <img
                src={data.imageUrl}
                alt={data.productTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Score Breakdown ── */}
      <section className="py-14 px-6 bg-[hsl(38_25%_97%)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-bold text-xl mb-8">Score breakdown</h2>
          <div className="grid sm:grid-cols-2 gap-6 bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
            <ScoreBar label="Fit for purpose" value={data.scores.fit}   color="bg-amber-400" />
            <ScoreBar label="Value for money" value={data.scores.value} color="bg-emerald-400" />
            <ScoreBar label="Proven quality"  value={data.scores.proof} color="bg-blue-400" />
            <ScoreBar label="Low regret risk" value={regretDisplay}     color="bg-violet-400" />
          </div>
        </div>
      </section>

      {/* ── Pros / Cons ── */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> What's great
            </h3>
            <ul className="space-y-2">
              {data.pros.map(p => (
                <li key={p} className="text-sm text-stone-700 flex gap-2">
                  <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-red-600 flex items-center gap-2">
              <XCircle className="w-4 h-4" /> Watch out for
            </h3>
            <ul className="space-y-2">
              {data.cons.map(c => (
                <li key={c} className="text-sm text-stone-700 flex gap-2">
                  <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Tradeoffs ── */}
      {data.tradeoffs.length > 0 && (
        <section className="py-10 px-6 bg-[hsl(38_25%_97%)]">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-bold text-xl mb-5 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Key tradeoffs
            </h2>
            <ul className="space-y-3">
              {data.tradeoffs.map(t => (
                <li key={t} className="flex gap-3 text-sm text-stone-700 bg-white rounded-xl border border-stone-100 px-4 py-3 shadow-sm">
                  <span className="text-amber-400 font-bold mt-0.5 shrink-0">→</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Buy links ── */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-bold text-xl mb-5 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-500" />
            Where to buy
          </h2>
          <div className="space-y-3">
            {data.buyLinks.map(link => (
              <a
                key={link.merchant}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-white border border-stone-100 rounded-xl px-5 py-4 shadow-sm hover:border-amber-200 hover:shadow-md transition-all group"
              >
                <div>
                  <p className="font-semibold text-sm">{link.merchant}</p>
                  <p className="text-xs text-muted-foreground">Affiliate link</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">${link.price}</span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Related ── */}
      {data.relatedSlugs.length > 0 && (
        <section className="py-10 px-6 bg-[hsl(38_25%_97%)]">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-bold text-base mb-4 text-muted-foreground uppercase tracking-wide text-xs">Also worth checking</h2>
            <div className="flex flex-wrap gap-3">
              {data.relatedSlugs.map(s => (
                <Link
                  key={s}
                  href={`/verdict/${s}`}
                  className="px-4 py-2 rounded-full border border-stone-200 bg-white text-sm hover:border-amber-300 hover:text-amber-700 transition-all capitalize"
                >
                  {s.replace(/-/g, " ")} →
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <DiscoveryCTA
        headline={`Not sure if ${data.productTitle} is right for you?`}
        subline="Tell Worthly AI your budget, use case, and priorities. Get a personalised score in 30 seconds."
        ctaLabel="Get my verdict →"
      />
    </PublicPageShell>
  );
}
