import { useEffect, useState } from "react";
import { applySeo } from "@/lib/seo";
import Navbar from "@/components/Navbar";
import { MOCK_ACTIONS } from "@/lib/purchases-data";
import type { ActionItem, ActionType, ActionPriority } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Copy, Check, ChevronDown, ChevronUp, Sparkles, RotateCcw, Tag, MessageSquare, TrendingDown } from "lucide-react";

const ACTION_ICONS: Record<ActionType, React.ElementType> = {
  return:      RotateCcw,
  cancel:      Tag,
  refund:      TrendingDown,
  price_match: TrendingDown,
  negotiate:   MessageSquare,
};

const ACTION_LABELS: Record<ActionType, string> = {
  return:      "Return",
  cancel:      "Cancel",
  refund:      "Refund",
  price_match: "Price Match",
  negotiate:   "Negotiate",
};

const PRIORITY_STYLES: Record<ActionPriority, string> = {
  high:   "bg-red-50 text-red-600 border-red-100",
  medium: "bg-amber-50 text-amber-600 border-amber-100",
  low:    "bg-stone-50 text-stone-500 border-stone-200",
};

function DraftBlock({ subject, body }: { subject: string; body: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-4 rounded-xl border border-stone-100 overflow-hidden bg-stone-50">
      <div className="flex items-center justify-between px-4 py-2.5 bg-stone-100/70 border-b border-stone-100">
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Draft message</p>
          <p className="text-xs text-stone-700 font-medium mt-0.5">Subject: {subject}</p>
        </div>
        <button
          onClick={copy}
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
            copied
              ? "bg-emerald-100 text-emerald-700"
              : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"
          )}
        >
          {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className="px-4 py-3 text-xs text-stone-600 whitespace-pre-wrap leading-relaxed font-sans">
        {body}
      </pre>
    </div>
  );
}

function ActionCard({ action }: { action: ActionItem }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ACTION_ICONS[action.type];

  return (
    <div className={cn(
      "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all",
      action.priority === "high" ? "border-red-100" : "border-stone-100",
    )}>
      <button
        className="w-full text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4 p-4">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
            action.priority === "high"   ? "bg-red-50"
            : action.priority === "medium" ? "bg-amber-50"
            : "bg-stone-50"
          )}>
            <Icon className={cn(
              "w-4 h-4",
              action.priority === "high"   ? "text-red-500"
              : action.priority === "medium" ? "text-amber-500"
              : "text-stone-400"
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-sm">{action.title}</p>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border",
                  PRIORITY_STYLES[action.priority]
                )}>
                  {action.priority}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-stone-200 text-stone-500">
                  {ACTION_LABELS[action.type]}
                </span>
              </div>
              {expanded
                ? <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" />
                : <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
            {action.potentialSaving && (
              <p className="text-xs font-bold text-emerald-600 mt-1.5">
                Save up to ${action.potentialSaving.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </button>

      {expanded && action.draftSubject && action.draftBody && (
        <div className="px-4 pb-4">
          <DraftBlock subject={action.draftSubject} body={action.draftBody} />
          <div className="flex gap-2 mt-3">
            <button
              className="flex-1 text-xs font-semibold py-2.5 rounded-xl text-white"
              style={{ background: "hsl(32 95% 54%)" }}
              onClick={() => alert("Mark as done")}
            >
              Mark done
            </button>
            <button
              className="flex-1 text-xs font-semibold py-2.5 rounded-xl border border-stone-200 hover:border-stone-300 transition-colors"
              onClick={() => alert("Dismiss action")}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActionsPage() {
  useEffect(() => {
    applySeo({ title: "Actions — Worthly", noindex: true });
  }, []);

  const pending = MOCK_ACTIONS.filter(a => !a.completed);
  const totalSavings = pending.reduce((sum, a) => sum + (a.potentialSaving ?? 0), 0);

  const highPriority = pending.filter(a => a.priority === "high");
  const otherPriority = pending.filter(a => a.priority !== "high");

  return (
    <div className="min-h-screen bg-[hsl(38_25%_97%)] pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-bold text-xl tracking-tight">Actions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated recovery opportunities — with copy-ready drafts.
          </p>
        </div>

        {/* Savings summary */}
        <div
          className="rounded-2xl p-5 flex items-center justify-between"
          style={{ background: "hsl(20 25% 8%)" }}
        >
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wide font-medium">Potential savings</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">${totalSavings.toFixed(2)}</p>
            <p className="text-xs text-white/40 mt-0.5">{pending.length} actions available</p>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "hsl(32 95% 54% / 0.15)", border: "1px solid hsl(32 95% 54% / 0.25)" }}
          >
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
        </div>

        {/* High priority */}
        {highPriority.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Act now
            </h2>
            {highPriority.map(a => <ActionCard key={a.id} action={a} />)}
          </div>
        )}

        {/* Other */}
        {otherPriority.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-stone-300" />
              When you have time
            </h2>
            {otherPriority.map(a => <ActionCard key={a.id} action={a} />)}
          </div>
        )}

        {pending.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <Check className="w-10 h-10 text-emerald-300 mx-auto" />
            <p className="text-sm text-muted-foreground">All clear — no pending actions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
