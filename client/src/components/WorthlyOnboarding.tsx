import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorthlyOnboardingProps {
  onComplete: () => void;
}

const QUESTIONS = [
  {
    key: "buying_style",
    label: "How do you usually decide to buy something online?",
    options: [
      { key: "researcher", label: "I research for days before buying anything" },
      { key: "considered", label: "I spend a few hours comparing options" },
      { key: "quick",      label: "I read a few reviews then decide quickly" },
      { key: "impulse",    label: "I see it, I want it, I buy it" },
    ],
  },
  {
    key: "regret_frequency",
    label: "How often do you regret an online purchase?",
    options: [
      { key: "rarely",     label: "Rarely — I'm pretty selective" },
      { key: "sometimes",  label: "Sometimes — maybe once every few months" },
      { key: "often",      label: "Often — I have things I barely used" },
      { key: "very_often", label: "Very often — I return things constantly" },
    ],
  },
  {
    key: "overspend_trigger",
    label: "When you overspend on something, what usually happened?",
    options: [
      { key: "sale",         label: "A sale made it feel like a deal" },
      { key: "emotional",    label: "I was bored or stressed" },
      { key: "rationalized", label: "I convinced myself I needed it" },
      { key: "fomo",         label: "Someone I follow had it" },
      { key: "rarely",       label: "I don't overspend much" },
    ],
  },
  {
    key: "budget_discipline",
    label: "How does your budget work when you shop?",
    options: [
      { key: "strict",     label: "I have a strict budget and stick to it" },
      { key: "flexible",   label: "I have a rough number but go over sometimes" },
      { key: "want_based", label: "I decide based on how much I want it" },
      { key: "untracked",  label: "I don't track spending much" },
    ],
  },
  {
    key: "duplicate_tendency",
    label: "Do you tend to buy things you already own a version of?",
    options: [
      { key: "no_new",      label: "No — I only buy when I genuinely need something new" },
      { key: "replacement", label: "Sometimes — when mine is worn out or broken" },
      { key: "upgrader",    label: "Yes — I upgrade things I already own regularly" },
      { key: "duplicator",  label: "Honestly yes — I have duplicates of things" },
    ],
  },
  {
    key: "influence_source",
    label: "Who or what influences your purchases most?",
    options: [
      { key: "self",          label: "My own research and judgment" },
      { key: "reviews",       label: "Reviews and ratings on the product page" },
      { key: "trusted_sites", label: "Reddit, YouTube, or trusted review sites" },
      { key: "social",        label: "Friends, family, or people I follow online" },
      { key: "deals",         label: "Sales, deals, and limited-time offers" },
    ],
  },
  {
    key: "household",
    label: "What's your household situation?",
    options: [
      { key: "solo",       label: "Just me" },
      { key: "couple",     label: "Me and a partner" },
      { key: "young_kids", label: "Family with kids under 5" },
      { key: "kids_5_12",  label: "Family with kids 5–12" },
      { key: "teenagers",  label: "Family with teenagers" },
      { key: "multi_gen",  label: "Multi-generational household" },
    ],
  },
  {
    key: "return_attitude",
    label: "How do you feel about returning things?",
    options: [
      { key: "easy",     label: "I return things easily — no guilt, it's my right" },
      { key: "annoying", label: "I return sometimes but find it annoying" },
      { key: "avoidant", label: "I avoid returns — too much hassle" },
      { key: "never",    label: "I almost never return anything" },
    ],
  },
  {
    key: "quality_orientation",
    label: "What's your relationship with quality vs. price?",
    options: [
      { key: "quality_first",  label: "I always go for the best quality, price is secondary" },
      { key: "quality_budget", label: "I find the best quality within my budget" },
      { key: "value",          label: "I find the best value — most for least money" },
      { key: "cheapest",       label: "I buy the cheapest thing that works" },
    ],
  },
  {
    key: "shopping_timing",
    label: "When do you usually shop online?",
    options: [
      { key: "planned",    label: "Planned — I know what I need before I look" },
      { key: "browsing",   label: "Browsing — I find things while looking around" },
      { key: "late_night", label: "Late night — I shop when I can't sleep" },
      { key: "emotional",  label: "Emotional — when I'm stressed, bored, or celebrating" },
      { key: "all",        label: "All of the above honestly" },
    ],
  },
] as const;

type QuestionKey = typeof QUESTIONS[number]["key"];
type Answers = Partial<Record<QuestionKey, string>>;

export default function WorthlyOnboarding({ onComplete }: WorthlyOnboardingProps) {
  const [answers, setAnswers] = useState<Answers>({});
  const [email, setEmail]     = useState("");

  const answered    = QUESTIONS.filter(q => answers[q.key]).length;
  const allAnswered = answered === QUESTIONS.length;

  function handleSubmit() {
    const payload = {
      buying_style:        answers.buying_style!,
      regret_frequency:    answers.regret_frequency!,
      overspend_trigger:   answers.overspend_trigger!,
      budget_discipline:   answers.budget_discipline!,
      duplicate_tendency:  answers.duplicate_tendency!,
      influence_source:    answers.influence_source!,
      household:           answers.household!,
      return_attitude:     answers.return_attitude!,
      quality_orientation: answers.quality_orientation!,
      shopping_timing:     answers.shopping_timing!,
      email:               email.trim(),
      completed_at:        new Date().toISOString(),
      version:             "2",
    };

    localStorage.setItem("worthly_onboarding_complete", JSON.stringify(payload));

    if (payload.email && payload.email.includes("@")) {
      fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payload.email, source: "onboarding_v2" }),
      }).catch(() => {});
    }

    onComplete();
  }

  function handleSkip() {
    localStorage.setItem("worthly_onboarding_complete", JSON.stringify({ skipped: true }));
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-full flex items-center justify-center py-10 px-4">
        <div className="w-full bg-white border border-stone-200 shadow-lg" style={{ maxWidth: 560, borderRadius: 12 }}>

          {/* Header */}
          <div className="flex flex-col items-center pt-8 pb-4 px-8 text-center">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-lg mb-4"
              style={{ background: "hsl(32 95% 54%)" }}
            >
              W
            </div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">
              Help us give you sharper verdicts
            </h1>
            <p className="text-sm text-stone-500 mt-1 leading-relaxed">
              10 quick questions. Takes 90 seconds. Makes every verdict specific to how you actually shop.
            </p>
          </div>

          {/* Progress bar */}
          <div className="px-8 pb-2">
            <div className="w-full h-1 rounded-full bg-stone-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-400 transition-all duration-300"
                style={{ width: `${(answered / QUESTIONS.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-stone-400 text-right mt-1">{answered} of 10 answered</p>
          </div>

          <div className="px-8 pb-8">
            {/* Questions */}
            {QUESTIONS.map((q, qi) => (
              <div key={q.key} className={qi === 0 ? "mt-2" : "mt-6"}>
                <p className="text-[13px] font-medium text-stone-800 mb-2">{q.label}</p>
                <div className="flex flex-col gap-1.5">
                  {q.options.map((opt) => {
                    const selected = answers[q.key] === opt.key;
                    return (
                      <div
                        key={opt.key}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.key]: opt.key }))}
                        className={cn(
                          "w-full text-left cursor-pointer rounded-xl flex items-center justify-between",
                          selected
                            ? "bg-orange-50/40 text-stone-900"
                            : "bg-white text-stone-600 hover:bg-stone-50 hover:border-stone-300"
                        )}
                        style={{
                          padding: "10px 14px",
                          border: `1.5px solid ${selected ? "hsl(32 95% 54%)" : "hsl(214 32% 91%)"}`,
                          transition: "all 150ms ease",
                        }}
                      >
                        <span className="text-sm leading-snug">{opt.label}</span>
                        {selected && (
                          <Check className="w-4 h-4 shrink-0 ml-3" style={{ color: "hsl(32 95% 54%)" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Email field */}
            <div className="mt-6">
              <label className="text-[13px] font-medium text-stone-800 block mb-1">
                Your email (optional but recommended)
              </label>
              <p className="text-xs text-stone-400 mb-2 leading-relaxed">
                Saves your profile so verdicts improve over time. No spam, unsubscribe anytime.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 text-sm rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-stone-400"
                style={{ "--tw-ring-color": "hsl(32 95% 54%)" } as React.CSSProperties}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="w-full mt-6 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
              style={{ background: "hsl(32 95% 54%)", height: 44 }}
            >
              Start getting verdicts →
            </button>

            {/* Skip */}
            <div className="mt-3 text-center">
              <button
                onClick={handleSkip}
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors underline underline-offset-2"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
