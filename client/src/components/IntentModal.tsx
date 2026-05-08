import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export type IntentAnswers = {
  budget: string;
  reason: string;
  owns_similar: string;
  need_level: string;
  priority: string;
};

interface Props {
  open: boolean;
  onSubmit: (answers: IntentAnswers) => void;
  onSkip: () => void;
}

const Q1 = [
  { key: "under_25",     label: "Under $25" },
  { key: "from_25_75",   label: "$25 – $75" },
  { key: "from_75_150",  label: "$75 – $150" },
  { key: "from_150_300", label: "$150 – $300" },
  { key: "over_300",     label: "Over $300" },
] as const;

const Q2 = [
  { key: "replacing",  label: "Replacing something broken or worn out" },
  { key: "upgrading",  label: "Upgrading something I already have" },
  { key: "impulse",    label: "It caught my eye — impulse buy" },
  { key: "gift",       label: "Buying a gift for someone else" },
  { key: "considered", label: "I've wanted this for a while" },
] as const;

const Q3 = [
  { key: "no_new",     label: "No — usually buying something new to me" },
  { key: "yes_broken", label: "Yes — replacing old or broken items" },
  { key: "yes_works",  label: "Yes — even when what I have still works" },
] as const;

const Q4 = [
  { key: "need_now",      label: "I need it now — clear gap to fill" },
  { key: "nice_to_have",  label: "Nice to have, not essential" },
  { key: "want_not_need", label: "I want it but could live without it" },
  { key: "not_sure",      label: "Honestly not sure yet" },
] as const;

const Q5 = [
  { key: "value",     label: "Best value for the price" },
  { key: "quality",   label: "Highest quality, price is secondary" },
  { key: "no_regret", label: "Not regretting it later" },
  { key: "quick",     label: "Making a quick decision and moving on" },
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
  const [budget,      setBudget]      = useState("");
  const [reason,      setReason]      = useState("");
  const [ownsSimilar, setOwnsSimilar] = useState("");
  const [needLevel,   setNeedLevel]   = useState("");
  const [priority,    setPriority]    = useState("");

  useEffect(() => {
    if (open) {
      setBudget("");
      setReason("");
      setOwnsSimilar("");
      setNeedLevel("");
      setPriority("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onSkip(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onSkip]);

  if (!open) return null;

  const allAnswered = !!budget && !!reason && !!ownsSimilar && !!needLevel && !!priority;

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
            question="What's your budget for this?"
            options={Q1}
            value={budget}
            onChange={setBudget}
          />
          <QuestionBlock
            number={2}
            question="Why are you buying this?"
            options={Q2}
            value={reason}
            onChange={setReason}
          />
          <QuestionBlock
            number={3}
            question="Do you already own something similar?"
            options={Q3}
            value={ownsSimilar}
            onChange={setOwnsSimilar}
          />
          <QuestionBlock
            number={4}
            question="How much do you actually need this?"
            options={Q4}
            value={needLevel}
            onChange={setNeedLevel}
          />
          <QuestionBlock
            number={5}
            question="What matters most to you?"
            options={Q5}
            value={priority}
            onChange={setPriority}
          />

          <div className="flex flex-col gap-2 pt-2 border-t border-stone-50">
            <button
              onClick={() =>
                onSubmit({
                  budget,
                  reason,
                  owns_similar: ownsSimilar,
                  need_level:   needLevel,
                  priority,
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
