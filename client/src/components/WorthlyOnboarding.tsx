import { useState } from "react";

interface WorthlyOnboardingProps {
  onComplete: () => void;
}

const QUESTIONS = [
  {
    key: "budget",
    label: "What's your typical budget for online purchases?",
    options: [
      { key: "under_25", label: "Under $25" },
      { key: "from_25_75", label: "$25 – $75" },
      { key: "from_75_150", label: "$75 – $150" },
      { key: "from_150_300", label: "$150 – $300" },
      { key: "over_300", label: "Over $300" },
    ],
  },
  {
    key: "reason",
    label: "Why do you usually shop online?",
    options: [
      { key: "replacing", label: "Replacing something broken or worn out" },
      { key: "upgrading", label: "Upgrading something I already have" },
      { key: "impulse", label: "It caught my eye — impulse buy" },
      { key: "gift", label: "Buying a gift for someone else" },
      { key: "considered", label: "I've wanted this for a while" },
    ],
  },
  {
    key: "owns_similar",
    label: "Do you tend to buy things you already own a version of?",
    options: [
      { key: "no_new", label: "No — usually buying something new to me" },
      { key: "yes_broken", label: "Yes — replacing old or broken items" },
      { key: "yes_works", label: "Yes — even when what I have still works" },
    ],
  },
  {
    key: "need_level",
    label: "How much do you usually think before buying?",
    options: [
      { key: "need_now", label: "I need it now — clear gap to fill" },
      { key: "nice_to_have", label: "Nice to have, not essential" },
      { key: "want_not_need", label: "I want it but could live without it" },
      { key: "not_sure", label: "Honestly not sure yet" },
    ],
  },
  {
    key: "priority",
    label: "What matters most to you when buying?",
    options: [
      { key: "value", label: "Best value for the price" },
      { key: "quality", label: "Highest quality, price is secondary" },
      { key: "no_regret", label: "Not regretting it later" },
      { key: "quick", label: "Making a quick decision and moving on" },
    ],
  },
] as const;

type QuestionKey = typeof QUESTIONS[number]["key"];
type Answers = Partial<Record<QuestionKey, string>>;

export default function WorthlyOnboarding({ onComplete }: WorthlyOnboardingProps) {
  const [answers, setAnswers] = useState<Answers>({});
  const [email, setEmail] = useState("");

  const allAnswered = QUESTIONS.every((q) => answers[q.key]);

  function handleSubmit() {
    const payload = {
      budget: answers.budget!,
      reason: answers.reason!,
      owns_similar: answers.owns_similar!,
      need_level: answers.need_level!,
      priority: answers.priority!,
      email: email.trim(),
      completed_at: new Date().toISOString(),
    };

    localStorage.setItem("worthly_onboarding_complete", JSON.stringify(payload));

    if (payload.email && payload.email.includes("@")) {
      fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payload.email, source: "onboarding" }),
      }).catch(() => {});
    }

    onComplete();
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-full flex items-center justify-center py-10 px-4">
        <div
          className="w-full bg-white border border-stone-200 shadow-lg"
          style={{ maxWidth: 520, borderRadius: 12 }}
        >
          {/* Header */}
          <div className="flex flex-col items-center pt-8 pb-6 px-8 text-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg mb-5"
              style={{ background: "hsl(32 95% 54%)" }}
            >
              W
            </div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">
              Help us give you sharper verdicts
            </h1>
            <p className="text-sm text-stone-500 mt-2 leading-relaxed">
              90 seconds. No account needed. Makes every verdict more accurate for you.
            </p>
          </div>

          <div className="px-8 pb-8 space-y-7">
            {/* Questions */}
            {QUESTIONS.map((q) => (
              <div key={q.key}>
                <p className="text-sm font-medium text-stone-900 mb-2">{q.label}</p>
                <div className="flex flex-col gap-1.5">
                  {q.options.map((opt) => {
                    const selected = answers[q.key] === opt.key;
                    return (
                      <div
                        key={opt.key}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.key]: opt.key }))}
                        className="w-full text-left cursor-pointer rounded-xl transition-all"
                        style={{
                          padding: "10px 14px",
                          border: `1.5px solid ${selected ? "hsl(32 95% 54%)" : "hsl(214 32% 91%)"}`,
                          background: selected ? "hsl(32 95% 54% / 0.06)" : "white",
                        }}
                      >
                        <span className="text-[13px] text-stone-700 leading-snug">{opt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Email field */}
            <div>
              <label className="text-sm font-medium text-stone-900 block mb-2">
                Your email (optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 text-sm rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-stone-400"
                style={{ "--tw-ring-color": "hsl(32 95% 54%)" } as React.CSSProperties}
              />
              <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">
                We'll use this to save your preferences and notify you of updates. No spam.
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
              style={{ background: "hsl(32 95% 54%)" }}
            >
              Start getting verdicts →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
