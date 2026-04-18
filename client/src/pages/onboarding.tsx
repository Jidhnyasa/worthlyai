import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "fashion",     emoji: "👗", label: "Fashion" },
  { value: "beauty",      emoji: "💄", label: "Beauty" },
  { value: "electronics", emoji: "🎧", label: "Electronics" },
  { value: "home",        emoji: "🏠", label: "Home" },
  { value: "baby",        emoji: "🍼", label: "Baby" },
  { value: "fitness",     emoji: "🏃", label: "Fitness" },
  { value: "gifting",     emoji: "🎁", label: "Gifting" },
  { value: "accessories", emoji: "⌚", label: "Accessories" },
];

const BUDGET_STYLES = [
  { value: "budget",    label: "Budget-conscious",        desc: "I want the best value at the lowest price" },
  { value: "balanced",  label: "Balanced",                desc: "I weigh quality and price equally" },
  { value: "quality",   label: "Willing to pay for quality", desc: "Quality matters more than price" },
  { value: "premium",   label: "Premium-first",           desc: "I buy the best and don't think about cost" },
];

const MOODS = [
  { value: "minimal",   emoji: "⬜", label: "Minimal" },
  { value: "cozy",      emoji: "🛋️", label: "Cozy" },
  { value: "polished",  emoji: "✨", label: "Polished" },
  { value: "playful",   emoji: "🎨", label: "Playful" },
  { value: "sporty",    emoji: "⚡", label: "Sporty" },
  { value: "luxurious", emoji: "💎", label: "Luxurious" },
  { value: "bold",      emoji: "🔥", label: "Bold" },
  { value: "soft",      emoji: "🌸", label: "Soft" },
];

const LIFESTYLE_TAGS = [
  "Remote worker", "Parent", "Traveler", "Fitness enthusiast", "Fashionista",
  "Minimalist", "Environmentally conscious", "Tech enthusiast", "Foodie", "Gamer",
];

const STEPS = [
  { title: "What do you shop for?", subtitle: "Pick all that apply" },
  { title: "How do you approach budget?", subtitle: "Choose your style" },
  { title: "Brand preferences", subtitle: "Help us avoid brands you dislike or favor ones you love" },
  { title: "Your personal vibe", subtitle: "Select your style personality" },
  { title: "Tell us about you", subtitle: "Optional — for better personalization" },
];

export default function OnboardingPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);

  // Answers
  const [categories, setCategories]     = useState<string[]>([]);
  const [budgetStyle, setBudgetStyle]   = useState("");
  const [favBrands, setFavBrands]       = useState("");
  const [badBrands, setBadBrands]       = useState("");
  const [moods, setMoods]               = useState<string[]>([]);
  const [lifestyleTags, setLifestyle]   = useState<string[]>([]);

  const total = STEPS.length;
  const progress = ((step + 1) / total) * 100;

  function toggleCategory(v: string) {
    setCategories(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  }
  function toggleMood(v: string) {
    setMoods(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  }
  function toggleLifestyle(v: string) {
    setLifestyle(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  }

  async function handleFinish() {
    try {
      await apiRequest("POST", "/api/preferences", {
        categories,
        budgetStyle: budgetStyle || "balanced",
        favoriteBrands: favBrands.split(",").map(s => s.trim()).filter(Boolean),
        dislikedBrands: badBrands.split(",").map(s => s.trim()).filter(Boolean),
        moods,
        lifestyleTags,
      });
    } catch {}
    navigate("/app");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(38 25% 97%)" }}>
      {/* Header */}
      <div className="max-w-xl mx-auto w-full px-6 pt-8 pb-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(32 95% 54%)" }}>
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
              <path d="M3 5L6 15L9 9L12 15L15 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-base">Worthly</span>
          <span className="ml-auto text-xs text-muted-foreground">{step + 1} / {total}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step content */}
      <div className="flex-1 max-w-xl mx-auto w-full px-6 py-4">
        <div className="animate-slide-up space-y-6" key={step}>
          <div className="space-y-1">
            <h1 className="font-bold text-xl">{STEPS[step].title}</h1>
            <p className="text-sm text-muted-foreground">{STEPS[step].subtitle}</p>
          </div>

          {/* Step 0: Categories */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => toggleCategory(c.value)}
                  data-testid={`onboarding-category-${c.value}`}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border text-left transition-all",
                    categories.includes(c.value)
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card hover:border-primary/20"
                  )}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm">{c.label}</p>
                  </div>
                  {categories.includes(c.value) && (
                    <Check className="w-4 h-4 text-primary ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Budget style */}
          {step === 1 && (
            <div className="space-y-3">
              {BUDGET_STYLES.map(b => (
                <button
                  key={b.value}
                  onClick={() => setBudgetStyle(b.value)}
                  data-testid={`onboarding-budget-${b.value}`}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                    budgetStyle === b.value
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card hover:border-primary/20"
                  )}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{b.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                  </div>
                  {budgetStyle === b.value && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Brand preferences */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Brands you love</label>
                <Input
                  value={favBrands}
                  onChange={e => setFavBrands(e.target.value)}
                  placeholder="Nike, Apple, Patagonia, Levi's..."
                  data-testid="onboarding-fav-brands"
                />
                <p className="text-xs text-muted-foreground">Separate brands with commas</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Brands to avoid</label>
                <Input
                  value={badBrands}
                  onChange={e => setBadBrands(e.target.value)}
                  placeholder="Brands you don't like..."
                  data-testid="onboarding-bad-brands"
                />
              </div>
            </div>
          )}

          {/* Step 3: Vibes */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-3">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => toggleMood(m.value)}
                  data-testid={`onboarding-mood-${m.value}`}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border text-left transition-all",
                    moods.includes(m.value)
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card hover:border-primary/20"
                  )}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <p className="font-semibold text-sm">{m.label}</p>
                  {moods.includes(m.value) && (
                    <Check className="w-4 h-4 text-primary ml-auto" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Lifestyle */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {LIFESTYLE_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleLifestyle(tag)}
                    className={cn(
                      "chip",
                      lifestyleTags.includes(tag) ? "chip-active" : "chip-idle"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                This is optional — you can always update in Settings.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-xl mx-auto w-full px-6 pb-12 pt-6">
        <div className="flex items-center gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          )}
          <Button
            className="flex-1 gap-1.5 font-semibold"
            style={{ background: "hsl(32 95% 54%)", color: "white" }}
            onClick={() => step < total - 1 ? setStep(s => s + 1) : handleFinish()}
            data-testid="onboarding-next"
          >
            {step < total - 1 ? (
              <><ArrowRight className="w-4 h-4" /> Continue</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Start deciding</>
            )}
          </Button>
        </div>
        {step === 0 && (
          <button
            onClick={() => setStep(total - 1)}
            className="w-full mt-3 text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip onboarding
          </button>
        )}
      </div>
    </div>
  );
}
