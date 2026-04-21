import { useParams, Link } from "wouter";
import { ArrowRight, Sparkles } from "lucide-react";
import PublicPageShell from "@/components/PublicPageShell";
import DiscoveryCTA from "@/components/DiscoveryCTA";
import VerdictBadge from "@/components/VerdictBadge";
import { getCategory } from "@/lib/discovery-data";

export default function CategoryHubPage({ params }: { params?: { category?: string } }) {
  const routeParams = useParams<{ category: string }>();
  const slug = params?.category ?? routeParams.category ?? "";
  const data = getCategory(slug);

  if (!data) {
    return (
      <PublicPageShell title="Category Not Found" description="" canonical={`https://worthlyai.app/${slug}`} noindex>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4 text-center">
          <p className="text-muted-foreground">We don't have this category yet.</p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
            style={{ background: "hsl(32 95% 54%)" }}
          >
            Ask Worthly anything <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell
      title={data.title}
      description={data.description}
      canonical={`https://worthlyai.app/${data.slug}`}
    >
      {/* ── Hero ── */}
      <section
        className="py-20 px-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(20 25% 8%) 0%, hsl(25 20% 12%) 100%)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 60% 50%, hsl(32 95% 54% / 0.14) 0%, transparent 65%)" }}
        />
        <div className="relative max-w-4xl mx-auto">
          <nav className="text-xs text-white/30 flex items-center gap-1.5 mb-6">
            <Link href="/" className="hover:text-white/60 transition-colors">Worthly</Link>
            <span>/</span>
            <span className="text-white/50">{data.title}</span>
          </nav>

          <div className="max-w-2xl space-y-5">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "hsl(32 95% 54% / 0.14)", border: "1px solid hsl(32 95% 54% / 0.28)", color: "hsl(32 95% 65%)" }}
            >
              <Sparkles className="w-3 h-3" />
              {data.title}
            </div>

            <h1
              className="font-bold text-white"
              style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 1.08 }}
            >
              {data.heroHeadline}
            </h1>

            <p className="text-white/50 text-lg leading-relaxed">{data.heroSubline}</p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white text-sm"
                style={{ background: "hsl(32 95% 54%)", boxShadow: "0 6px 28px hsl(32 95% 54% / 0.38)" }}
              >
                <Sparkles className="w-4 h-4" />
                Ask Worthly
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Top Picks ── */}
      <section className="py-16 px-6 bg-[hsl(38_25%_97%)]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <h2 className="font-bold text-2xl">Top picks</h2>
              <p className="text-muted-foreground text-sm mt-1">Scored 80+ on Worthly's decision engine</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.topPicks.map(pick => (
              <Link
                key={pick.slug}
                href={`/verdict/${pick.slug}`}
                className="group bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-md hover:border-amber-200 transition-all"
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={pick.imageUrl}
                    alt={pick.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">{pick.brand}</p>
                      <p className="font-bold text-sm leading-snug mt-0.5">{pick.title}</p>
                    </div>
                    <VerdictBadge verdict={pick.verdict} size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-amber-500">{pick.score}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                    <span className="text-sm font-semibold text-stone-700">from ${pick.price}</span>
                  </div>
                  <p className="text-xs text-amber-600 font-medium group-hover:underline">
                    See full verdict →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparisons ── */}
      {data.comparisons.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-bold text-2xl mb-2">Head-to-head comparisons</h2>
            <p className="text-muted-foreground text-sm mb-8">Side-by-side scores on fit, value, and proof.</p>

            <div className="grid sm:grid-cols-2 gap-5">
              {data.comparisons.map(comp => (
                <Link
                  key={comp.slug}
                  href={`/compare/${comp.slug}`}
                  className="group bg-white rounded-2xl border border-stone-100 p-6 shadow-sm hover:shadow-md hover:border-amber-200 transition-all flex flex-col gap-3"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: "hsl(32 95% 54%)" }}
                  >
                    vs
                  </div>
                  <div>
                    <p className="font-bold text-sm">{comp.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{comp.description}</p>
                  </div>
                  <p className="text-xs text-amber-600 font-medium group-hover:underline mt-auto">
                    See comparison →
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Popular Queries ── */}
      <section
        className="py-16 px-6"
        style={{ background: "hsl(20 25% 8%)" }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="font-bold text-white text-xl mb-2">What people are asking</h2>
          <p className="text-white/40 text-sm mb-8">Common decisions in {data.title}. Click any to run it in Worthly.</p>

          <div className="space-y-2">
            {data.popularQueries.map(q => (
              <Link
                key={q}
                href={`/app`}
                className="flex items-center justify-between px-5 py-3.5 rounded-xl transition-all group"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <span className="text-white/70 text-sm group-hover:text-white transition-colors">{q}</span>
                <ArrowRight className="w-4 h-4 text-white/25 group-hover:text-amber-400 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <DiscoveryCTA
        headline={`Is a ${data.title.split(" ")[0]} worth it for you?`}
        subline="Get a personalised Buy / Wait / Skip verdict scored to your budget, use case, and priorities."
      />
    </PublicPageShell>
  );
}
