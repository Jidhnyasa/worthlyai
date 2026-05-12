import { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { apiUrl } from "@/lib/api";
import { getSessionId } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Send, X } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface VerdictCtx {
  title: string;
  merchant?: string;
  price?: number;
  verdict: "buy" | "wait" | "skip";
  verdictScore: number;
  reasons: Array<{ label: string; detail: string }>;
  scores: { fit: number; value: number; proof: number; regret: number };
  imageUrl?: string;
}

type Mode = "fresh" | "verdict-aware";
type ChatMsg = { role: "user" | "assistant"; text: string };

// ─── Constants ───────────────────────────────────────────────────────────────

const VERDICT_PILL = {
  buy:  { label: "BUY",  bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  wait: { label: "WAIT", bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200"  },
  skip: { label: "SKIP", bg: "bg-red-100",     text: "text-red-700",     border: "border-red-200"    },
} as const;

const FRESH_CHIPS = [
  "Is the Sony WH-1000XM5 worth $279?",
  "Best robot vacuum under $300?",
  "Should I buy a Vitamix or a Ninja blender?",
  "I keep reconsidering buying AirPods — help me decide",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildOpeningMessage(ctx: VerdictCtx): string {
  const label = VERDICT_PILL[ctx.verdict].label;
  const firstReason = ctx.reasons[0]?.detail ?? "";
  const sentence = firstReason ? ` ${firstReason}.` : "";
  return `I gave ${ctx.title} a ${label} verdict (score: ${ctx.verdictScore}/100).${sentence} What would you like to know more about?`;
}

function buildVerdictContextString(ctx: VerdictCtx): string {
  return [
    `Product: ${ctx.title}`,
    ctx.merchant ? `Merchant: ${ctx.merchant}` : null,
    ctx.price != null ? `Price: $${ctx.price}` : null,
    `Verdict: ${ctx.verdict.toUpperCase()} (${ctx.verdictScore}/100)`,
    `Reasons: ${ctx.reasons.map(r => `${r.label}: ${r.detail}`).join(", ")}`,
    `Scores: fit=${ctx.scores.fit} value=${ctx.scores.value} proof=${ctx.scores.proof} regret=${ctx.scores.regret}`,
  ].filter(Boolean).join("\n");
}

// ─── Streaming dots ──────────────────────────────────────────────────────────

function StreamingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VerdictsPage() {
  const [mode, setMode]             = useState<Mode>("fresh");
  const [verdictCtx, setVerdictCtx] = useState<VerdictCtx | null>(null);
  const [msgs, setMsgs]             = useState<ChatMsg[]>([]);
  const [input, setInput]           = useState("");
  const [streaming, setStreaming]   = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("verdict");
    if (raw) {
      try {
        const ctx = JSON.parse(atob(raw)) as VerdictCtx;
        setVerdictCtx(ctx);
        setMode("verdict-aware");
        setMsgs([{ role: "assistant", text: buildOpeningMessage(ctx) }]);
      } catch {
        // invalid param — stay in fresh mode
      }
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, streaming]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    setMsgs(prev => [...prev, { role: "user", text: text.trim() }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setStreaming(true);

    const history = msgs.map(m => ({
      role: m.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: m.text }],
    }));

    const verdictContext =
      mode === "verdict-aware" && verdictCtx
        ? buildVerdictContextString(verdictCtx)
        : null;

    try {
      const res = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": getSessionId() },
        credentials: "include",
        body: JSON.stringify({ message: text.trim(), verdictContext, history }),
      });
      if (!res.body) throw new Error("No stream");

      let accumulated = "";
      setMsgs(prev => [...prev, { role: "assistant", text: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMsgs(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", text: accumulated };
          return next;
        });
      }
    } catch {
      setMsgs(prev => [
        ...prev,
        { role: "assistant", text: "Sorry — couldn't reach the server. Try again." },
      ]);
    }

    setStreaming(false);
  }, [msgs, streaming, mode, verdictCtx]);

  function handleClear() {
    setMode("fresh");
    setVerdictCtx(null);
    setMsgs([]);
    window.history.replaceState({}, "", window.location.pathname);
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const pill = verdictCtx ? VERDICT_PILL[verdictCtx.verdict] : null;

  return (
    <div className="min-h-screen bg-[hsl(38_25%_97%)] flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">

        {/* ── Verdict-aware context banner ── */}
        {mode === "verdict-aware" && verdictCtx && pill && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-3.5 mb-4 flex items-center gap-3">
            {verdictCtx.imageUrl ? (
              <img
                src={verdictCtx.imageUrl}
                alt={verdictCtx.title}
                className="w-10 h-10 rounded-lg object-contain border border-stone-100 bg-stone-50 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-stone-100 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-800 truncate">{verdictCtx.title}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {verdictCtx.merchant && (
                  <span className="text-xs text-stone-400">{verdictCtx.merchant}</span>
                )}
                {verdictCtx.price != null && (
                  <>
                    <span className="text-stone-200">·</span>
                    <span className="text-xs font-medium text-stone-600">${verdictCtx.price}</span>
                  </>
                )}
                <span className="text-stone-200">·</span>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border",
                  pill.bg, pill.text, pill.border,
                )}>
                  {pill.label}
                </span>
                <span className="text-xs text-stone-400">{verdictCtx.verdictScore}/100</span>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Chat area ── */}
        <div className="flex-1 flex flex-col">

          {/* Welcome state */}
          {mode === "fresh" && msgs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 gap-5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-xl"
                style={{ background: "hsl(32 95% 54%)" }}
              >
                W
              </div>
              <div>
                <h1 className="text-lg font-bold text-stone-900">Ask Worthly AI</h1>
                <p className="text-sm text-stone-500 mt-1 max-w-xs leading-relaxed">
                  Your personal shopping advisor. Ask about any product, category, or purchase decision.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {FRESH_CHIPS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 cursor-pointer transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message list */
            <div className="flex-1 flex flex-col gap-3 py-2 overflow-y-auto min-h-0">
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] px-4 py-2.5 text-sm",
                      m.role === "user"
                        ? "text-white rounded-2xl rounded-tr-sm"
                        : "bg-stone-100 text-stone-800 rounded-2xl rounded-tl-sm",
                    )}
                    style={{
                      background: m.role === "user" ? "hsl(32 95% 54%)" : undefined,
                      lineHeight: m.role === "assistant" ? 1.6 : undefined,
                    }}
                  >
                    {m.text === "" && streaming && i === msgs.length - 1
                      ? <StreamingDots />
                      : m.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {/* ── Input ── */}
          <div className="pt-3 border-t border-stone-200 mt-3">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === "verdict-aware"
                    ? "Ask anything about this product..."
                    : "What are you shopping for? Ask me anything..."
                }
                disabled={streaming}
                className="flex-1 px-4 py-2.5 text-sm rounded-2xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all placeholder:text-stone-400 resize-none overflow-hidden disabled:opacity-60"
                style={{ minHeight: 42, maxHeight: 80 }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || streaming}
                className="flex items-center justify-center w-10 h-10 rounded-2xl text-white disabled:opacity-40 transition-all hover:brightness-110 shrink-0"
                style={{ background: "hsl(32 95% 54%)" }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
