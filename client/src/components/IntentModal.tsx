import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export type IntentAnswers = {
  audience: "self_planned" | "self_impulse" | "gift" | "household";
  mood: "decided" | "leaning_yes" | "on_fence" | "reconsidering";
  avoiding: "overspending" | "regret" | "unused" | "fomo" | "none";
};

interface Props {
  open: boolean;
  onSubmit: (answers: IntentAnswers) => void;
  onSkip: () => void;
}

const Q1 = [
  { key: "self_planned", label: "For me, planned" },
  { key: "self_impulse", label: "For me, on impulse" },
  { key: "gift",         label: "A gift for someone else" },
  { key: "household",    label: "For my household / family" },
] as const;

const Q2 = [
  { key: "decided",       label: "I'm sure I want it, just checking the price" },
  { key: "leaning_yes",   label: "I'm leaning toward yes but want a sanity check" },
  { key: "on_fence",      label: "I'm on the fence, talk me into it or out of it" },
  { key: "reconsidering", label: "I keep reconsidering this — it's been on my mind" },
] as const;

const Q3 = [
  { key: "overspending", label: "Overspending — I want value" },
  { key: "regret",       label: "Buyer's remorse — I want to feel good about it" },
  { key: "unused",       label: "Owning something I won't use" },
  { key: "fomo",         label: "Missing out — I want to be sure this is the right choice" },
  { key: "none",         label: "Nothing in particular" },
] as const;

function QuestionBlock({
  number,
  question,
  options,
  value,
  onChange,
}: {
  number: number;
  question: string;
  options: readonly { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5">
        <span
          className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black text-white shrink-0 mt-0.5"
          style={{ background: "hsl(32 95% 54%)" }}
        >
          {number}
        </span>
        <p className="text-sm font-semibold text-stone-800 leading-snug">{question}</p>
      </div>
      <RadioGroup value={value} onValueChange={onChange} className="space-y-2 pl-7">
        {options.map(opt => (
          <label
            key={opt.key}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
              value === opt.key
                ? "border-amber-400 bg-amber-50"
                : "border-stone-100 bg-stone-50 hover:border-stone-200 hover:bg-white",
            )}
          >
            <RadioGroupItem
              value={opt.key}
              className="shrink-0 border-stone-300 data-[state=checked]:border-amber-500 data-[state=checked]:text-amber-500"
            />
            <span className="text-sm text-stone-700 leading-snug">{opt.label}</span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

export default function IntentModal({ open, onSubmit, onSkip }: Props) {
  const [audience, setAudience] = useState("");
  const [mood,     setMood]     = useState("");
  const [avoiding, setAvoiding] = useState("");

  useEffect(() => {
    if (open) { setAudience(""); setMood(""); setAvoiding(""); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onSkip(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onSkip]);

  if (!open) return null;

  const allAnswered = !!audience && !!mood && !!avoiding;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onSkip(); }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Quick context — makes the verdict sharper
            </h2>
            <p className="text-sm text-stone-400 mt-1">
              30 seconds.{" "}
              <button
                onClick={onSkip}
                className="underline underline-offset-2 hover:text-amber-600 transition-colors"
              >
                Skip if you'd rather just see the basic verdict.
              </button>
            </p>
          </div>
          <button
            onClick={onSkip}
            className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-600 ml-4 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-6">
          <QuestionBlock
            number={1}
            question="Who is this purchase for?"
            options={Q1}
            value={audience}
            onChange={setAudience}
          />
          <QuestionBlock
            number={2}
            question="How are you feeling about this purchase right now?"
            options={Q2}
            value={mood}
            onChange={setMood}
          />
          <QuestionBlock
            number={3}
            question="Is there anything you're trying to avoid?"
            options={Q3}
            value={avoiding}
            onChange={setAvoiding}
          />

          <div className="flex flex-col gap-2 pt-2 border-t border-stone-50">
            <button
              onClick={() =>
                onSubmit({
                  audience: audience as IntentAnswers["audience"],
                  mood:     mood     as IntentAnswers["mood"],
                  avoiding: avoiding as IntentAnswers["avoiding"],
                })
              }
              disabled={!allAnswered}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background: "hsl(32 95% 54%)" }}
            >
              Get verdict
            </button>
            <button
              onClick={onSkip}
              className="w-full py-2.5 text-sm font-medium text-stone-400 hover:text-stone-600 transition-colors"
            >
              Skip — just give me the verdict
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
