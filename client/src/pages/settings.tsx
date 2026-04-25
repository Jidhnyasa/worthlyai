import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applySeo } from "@/lib/seo";
import { Settings, Check, AlertCircle, Key, LogOut, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getSessionId } from "@/lib/session";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { SupabaseUser } from "@/lib/supabase";

const CATEGORIES    = ["fashion","beauty","electronics","home","baby","fitness","gifting","accessories"];
const BUDGET_STYLES = [
  { value: "budget",   label: "Budget-conscious" },
  { value: "balanced", label: "Balanced"          },
  { value: "quality",  label: "Quality-first"     },
  { value: "premium",  label: "Premium-first"     },
];
const MOODS = ["cozy","polished","minimal","playful","sporty","luxurious","bold","soft"];

const GOALS = [
  { value: "save_money",           label: "Save money"              },
  { value: "reduce_impulse",       label: "Reduce impulse buys"     },
  { value: "minimalism",           label: "Minimalism"              },
  { value: "quality_over_quantity",label: "Quality over quantity"   },
];

const SENSITIVITIES = [
  { value: "fake_sales",          label: "Fake sales / inflated 'was' prices" },
  { value: "duplicate_purchases", label: "Duplicate purchases"                },
  { value: "ingredient_concerns", label: "Ingredient concerns (beauty/food)"  },
  { value: "overpriced_premium",  label: "Overpriced premium brands"          },
];

type Chip = { value: string; label: string };

function ChipGroup({ options, selected, onChange }: { options: Chip[]; selected: string[]; onChange: (v: string[]) => void }) {
  function toggle(val: string) {
    onChange(selected.includes(val) ? selected.filter(x => x !== val) : [...selected, val]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => toggle(value)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
            selected.includes(value)
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:text-stone-800"
          )}
        >
          {selected.includes(value) && <span className="mr-1">✓</span>}
          {label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  useEffect(() => { applySeo({ title: "Settings — Worthly AI", noindex: true }); }, []);

  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [user, setUser] = useState<SupabaseUser>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  const { data: prefs } = useQuery({
    queryKey: ["/api/preferences"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/preferences", undefined, { "x-session-id": getSessionId() });
      return res.json();
    },
  });

  const [categories,  setCategories]  = useState<string[]>([]);
  const [budgetStyle, setBudgetStyle] = useState("balanced");
  const [moods,       setMoods]       = useState<string[]>([]);
  const [favBrands,   setFavBrands]   = useState("");
  const [badBrands,   setBadBrands]   = useState("");
  const [goals,       setGoals]       = useState<string[]>([]);
  const [sensitive,   setSensitive]   = useState<string[]>([]);

  useEffect(() => {
    if (!prefs) return;
    setCategories(prefs.categories ?? []);
    setBudgetStyle(prefs.budgetStyle ?? "balanced");
    setMoods(prefs.moods ?? []);
    setFavBrands((prefs.favoriteBrands ?? []).join(", "));
    setBadBrands((prefs.dislikedBrands ?? []).join(", "));
    const allGoals = GOALS.map(g => g.value);
    setGoals((prefs.lifestyleTags ?? []).filter((t: string) => allGoals.includes(t)));
    setSensitive(prefs.sensitiveTo ?? []);
  }, [prefs]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/preferences", {
      categories,
      budgetStyle,
      moods,
      favoriteBrands:  favBrands.split(",").map((s: string) => s.trim()).filter(Boolean),
      dislikedBrands:  badBrands.split(",").map((s: string) => s.trim()).filter(Boolean),
      lifestyleTags:   goals,
      sensitiveTo:     sensitive,
    }, { "x-session-id": getSessionId() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/preferences"] });
      toast({ title: "Preferences saved" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-[hsl(38_25%_97%)] pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your preferences shape every verdict</p>
        </div>

        {/* ── Shopping preferences ── */}
        <div className="rounded-2xl border bg-white shadow-sm p-5 space-y-5">
          <h2 className="font-semibold text-sm">Shopping preferences</h2>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categories I shop</label>
            <ChipGroup
              options={CATEGORIES.map(c => ({ value: c, label: c }))}
              selected={categories}
              onChange={setCategories}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Budget style</label>
            <div className="flex flex-wrap gap-2">
              {BUDGET_STYLES.map(b => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setBudgetStyle(b.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    budgetStyle === b.value
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Style / vibe</label>
            <ChipGroup
              options={MOODS.map(m => ({ value: m, label: m }))}
              selected={moods}
              onChange={setMoods}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Favorite brands</label>
              <Input value={favBrands} onChange={e => setFavBrands(e.target.value)} placeholder="Nike, Apple…" className="text-sm h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Avoid brands</label>
              <Input value={badBrands} onChange={e => setBadBrands(e.target.value)} placeholder="Brands to skip…" className="text-sm h-9" />
            </div>
          </div>
        </div>

        {/* ── Goals ── */}
        <div className="rounded-2xl border bg-white shadow-sm p-5 space-y-3">
          <div>
            <h2 className="font-semibold text-sm">Goals</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Worthly AI will weight verdicts toward your goals.</p>
          </div>
          <ChipGroup options={GOALS} selected={goals} onChange={setGoals} />
        </div>

        {/* ── Sensitivities ── */}
        <div className="rounded-2xl border bg-white shadow-sm p-5 space-y-3">
          <div>
            <h2 className="font-semibold text-sm">Sensitivities</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Flag these in every verdict so you're never caught off guard.</p>
          </div>
          <ChipGroup options={SENSITIVITIES} selected={sensitive} onChange={setSensitive} />
        </div>

        {/* ── Save ── */}
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full gap-2 font-semibold"
          style={{ background: "hsl(32 95% 54%)", color: "white" }}
        >
          <Check className="w-4 h-4" />
          {saveMutation.isPending ? "Saving…" : "Save preferences"}
        </Button>

        {/* ── API key callout ── */}
        <div className="rounded-2xl border bg-white shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" /> API Configuration
          </h2>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 space-y-1">
              <p className="font-semibold">Gemini API key required for AI verdicts</p>
              <p>Set <code className="bg-amber-100 px-1 rounded">GEMINI_API_KEY</code> as a server environment variable.</p>
            </div>
          </div>
        </div>

        {/* ── Account ── */}
        <div className="rounded-2xl border bg-white shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Account
          </h2>
          {user ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-stone-600 truncate">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors shrink-0"
              >
                <LogOut className="w-3 h-3" /> Sign out
              </button>
            </div>
          ) : (
            <p className="text-sm text-stone-500">
              <a href="/auth" className="font-semibold text-amber-600 hover:text-amber-700">Sign in</a> for unlimited verdicts and saved history.
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Worthly AI v1.0 · <a href="https://worthlyai.app" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">worthlyai.app</a>
        </p>
      </div>
    </div>
  );
}
