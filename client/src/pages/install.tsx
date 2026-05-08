import { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const STEPS = [
  "Download and unzip the file above",
  "Open Chrome and go to chrome://extensions",
  'Toggle "Developer mode" ON (top-right corner)',
  'Click "Load unpacked"',
  "Select the unzipped worthly-extension-v0.1.0 folder",
  "Visit any Amazon product page — look for the Worthly badge bottom-right",
];

const HOW_IT_WORKS = [
  {
    title: "Visit any Amazon product",
    body: "Browse normally. The Worthly badge appears automatically on product pages.",
  },
  {
    title: "Click the Worthly badge",
    body: "Get an honest BUY, WAIT, or SKIP verdict — with specific reasons and scores.",
  },
  {
    title: "Make a better decision",
    body: "We default to skepticism. We'll tell you when to wait, what to skip, and why.",
  },
];

const FAQS = [
  { q: "Is this free?", a: "Yes, the beta is completely free." },
  {
    q: "Does it work on all websites?",
    a: "Currently Amazon only. More retailers coming soon.",
  },
  {
    q: "What does it send to Worthly?",
    a: "Only the URL of the product page you're viewing. We don't track your browsing or store personal information.",
  },
  {
    q: "Why do I need Developer mode?",
    a: "We're in beta. Our Chrome Web Store listing is under review and will be available soon — then you won't need Developer mode.",
  },
];

export default function InstallPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/beta-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(38,25%,97%)]">
      <Navbar />

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-4xl font-semibold text-[hsl(20,25%,10%)] tracking-tight mb-4">
          Get Worthly for Chrome
        </h1>
        <p className="text-lg text-stone-500 mb-10">
          Honest buy/wait/skip verdicts on Amazon products — inline while you shop. Free.
        </p>
        <a
          href="/worthly-extension-v0.1.0.zip"
          download
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-base transition-opacity hover:opacity-90"
          style={{ background: "hsl(32 95% 54%)" }}
        >
          Download Worthly Extension (Beta)
        </a>
        <p className="mt-3 text-sm text-stone-400">
          Chrome only · Amazon product pages · v0.1.0 beta
        </p>
      </section>

      {/* How to Install */}
      <section className="max-w-xl mx-auto px-6 pb-20">
        <h2 className="text-xl font-semibold text-[hsl(20,25%,10%)] mb-8">How to install</h2>
        <ol className="flex flex-col gap-5">
          {STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-4">
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                style={{ background: "hsl(32 95% 54%)" }}
              >
                {i + 1}
              </span>
              <span className="text-[15px] text-stone-700 pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* How It Works */}
      <section className="bg-white border-y border-stone-100 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-xl font-semibold text-[hsl(20,25%,10%)] mb-10 text-center">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((card, i) => (
              <div
                key={i}
                className="bg-[hsl(38,25%,97%)] rounded-xl p-6 border border-stone-100"
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "hsl(32 95% 54%)" }}
                >
                  Step {i + 1}
                </p>
                <p className="text-[15px] font-semibold text-[hsl(20,25%,10%)] mb-2">
                  {card.title}
                </p>
                <p className="text-sm text-stone-500 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-xl mx-auto px-6 py-20">
        <h2 className="text-xl font-semibold text-[hsl(20,25%,10%)] mb-8">FAQ</h2>
        <Accordion type="single" collapsible className="flex flex-col gap-1">
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-stone-200 rounded-xl px-4"
            >
              <AccordionTrigger className="text-[15px] font-medium text-stone-800 py-4 hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-stone-500 pb-4 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Bottom CTA */}
      <section className="bg-white border-t border-stone-100 py-16">
        <div className="max-w-md mx-auto px-6 text-center">
          <h2 className="text-lg font-semibold text-[hsl(20,25%,10%)] mb-2">
            Join the waitlist for the public Chrome Web Store version
          </h2>
          {status === "success" ? (
            <p className="text-sm text-emerald-600 mt-6">
              You're on the list! We'll email you when it's live.
            </p>
          ) : (
            <form onSubmit={handleNotify} className="flex gap-2 mt-6">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                style={{ "--tw-ring-color": "hsl(32 95% 54%)" } as React.CSSProperties}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-5 py-2.5 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "hsl(32 95% 54%)" }}
              >
                {status === "loading" ? "…" : "Notify me"}
              </button>
            </form>
          )}
          {status === "error" && (
            <p className="text-sm text-red-500 mt-3">
              Something went wrong — email us at mjidhnyasa@gmail.com to join manually.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
