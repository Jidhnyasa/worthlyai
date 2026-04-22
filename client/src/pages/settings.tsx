import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings, Sparkles, Check, ChevronRight, AlertCircle, Key, Puzzle, Copy,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getSessionId } from "@/lib/session";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const CATEGORIES = ["fashion","beauty","electronics","home","baby","fitness","gifting","accessories"];
const BUDGET_STYLES = [
  { value: "budget",   label: "Budget-conscious" },
  { value: "balanced", label: "Balanced" },
  { value: "quality",  label: "Quality-first" },
  { value: "premium",  label: "Premium-first" },
];
const MOODS = ["cozy","polished","minimal","playful","sporty","luxurious","bold","soft"];

export default function SettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: prefs } = useQuery({
    queryKey: ["/api/preferences"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/preferences", undefined, { "x-session-id": getSessionId() });
      return res.json();
    },
  });

  const [copiedSessionId, setCopiedSessionId] = useState(false);

  const sessionId = getSessionId();

  function copySessionId() {
    navigator.clipboard.writeText(sessionId);
    setCopiedSessionId(true);
    setTimeout(() => setCopiedSessionId(false), 2000);
  }

  const [categories, setCategories]   = useState<string[]>(prefs?.categories || []);
  const [budgetStyle, setBudgetStyle] = useState(prefs?.budgetStyle || "balanced");
  const [moods, setMoods]             = useState<string[]>(prefs?.moods || []);
  const [favBrands, setFavBrands]     = useState((prefs?.favoriteBrands || []).join(", "));
  const [badBrands, setBadBrands]     = useState((prefs?.dislikedBrands || []).join(", "));
  const [apiKey, setApiKey]           = useState("");

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/preferences", {
      categories,
      budgetStyle,
      moods,
      favoriteBrands: favBrands.split(",").map(s => s.trim()).filter(Boolean),
      dislikedBrands: badBrands.split(",").map(s => s.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/preferences"] });
      toast({ title: "Preferences saved" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  function toggle<T>(arr: T[], val: T) {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-7">
        <div>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your preferences and account</p>
        </div>

        {/* ── Preferences ── */}
        <div className="rounded-2xl border bg-card p-5 space-y-5">
          <h2 className="font-semibold text-sm">Shopping preferences</h2>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategories(toggle(categories, c))}
                  className={cn("chip capitalize text-xs", categories.includes(c) ? "chip-active" : "chip-idle")}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Budget style</label>
            <div className="flex flex-wrap gap-2">
              {BUDGET_STYLES.map(b => (
                <button
                  key={b.value}
                  onClick={() => setBudgetStyle(b.value)}
                  className={cn("chip text-xs", budgetStyle === b.value ? "chip-active" : "chip-idle")}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Style / Vibe</label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => (
                <button
                  key={m}
                  onClick={() => setMoods(toggle(moods, m))}
                  className={cn("chip capitalize text-xs", moods.includes(m) ? "chip-active" : "chip-idle")}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Favorite brands</label>
              <Input value={favBrands} onChange={e => setFavBrands(e.target.value)} placeholder="Nike, Apple..." className="text-sm h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Avoid brands</label>
              <Input value={badBrands} onChange={e => setBadBrands(e.target.value)} placeholder="Brands to avoid..." className="text-sm h-9" />
            </div>
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full gap-2 font-semibold"
            style={{ background: "hsl(32 95% 54%)", color: "white" }}
            data-testid="button-save-prefs"
          >
            <Check className="w-4 h-4" />
            {saveMutation.isPending ? "Saving…" : "Save preferences"}
          </Button>
        </div>

        {/* ── Browser Extension ── */}
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Puzzle className="w-4 h-4 text-primary" /> Browser Extension
          </h2>
          <p className="text-xs text-muted-foreground">
            Connect the Worthly Chrome extension to your account. Copy your Session ID below and paste it into the extension popup.
          </p>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Session ID</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 font-mono truncate">
                {sessionId}
              </code>
              <button
                onClick={copySessionId}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all shrink-0",
                  copiedSessionId
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                )}
              >
                {copiedSessionId ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground bg-stone-50 border border-stone-100 rounded-xl p-3 space-y-1">
            <p className="font-semibold text-stone-600">How to connect:</p>
            <ol className="space-y-0.5 list-decimal list-inside text-stone-500">
              <li>Load the extension from <code className="bg-stone-100 px-1 rounded">extension/</code> folder in Chrome</li>
              <li>Click the Worthly icon in your toolbar</li>
              <li>Paste this Session ID and click Connect</li>
            </ol>
          </div>
        </div>

        {/* ── API Key section ── */}
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" /> API Configuration
          </h2>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <p className="font-semibold">Gemini API key required for AI recommendations</p>
              <p>Set <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">GEMINI_API_KEY</code> as an environment variable on your server for live AI-powered recommendations.</p>
            </div>
          </div>
        </div>

        {/* ── Quick links ── */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          {[
            { href: "/app",       label: "Go to Decision Panel",     icon: Sparkles },
            { href: "/compare",   label: "Compare Products",          icon: Settings },
            { href: "/saved",     label: "View Saved Products",       icon: Settings },
            { href: "/history",   label: "View Query History",        icon: Settings },
            { href: "/onboarding",label: "Redo Onboarding",           icon: Settings },
          ].map(({ href, label, icon: Icon }, i, arr) => (
            <div key={href}>
              <Link href={href}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/50 transition-colors">
                <span className="text-sm font-medium">{label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
              {i < arr.length - 1 && <Separator />}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Worthly v1.0 · <a href="https://worthlyai.app" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">worthlyai.app</a>
        </p>
      </div>
    </div>
  );
}
