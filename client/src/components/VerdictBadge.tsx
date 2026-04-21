import { cn } from "@/lib/utils";
import { type Verdict, VERDICT_COLORS } from "@/lib/discovery-data";

interface Props {
  verdict: Verdict;
  size?:   "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "px-2.5 py-0.5 text-xs",
  md: "px-3.5 py-1 text-sm",
  lg: "px-5 py-2 text-base",
};

export default function VerdictBadge({ verdict, size = "md", className }: Props) {
  const c = VERDICT_COLORS[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold border uppercase tracking-wide",
        c.bg, c.text, c.border,
        sizes[size],
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", {
        "bg-emerald-500": verdict === "buy",
        "bg-amber-500":   verdict === "wait",
        "bg-red-500":     verdict === "skip",
      })} />
      {c.label}
    </span>
  );
}
