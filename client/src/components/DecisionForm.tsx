import { useState, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ImagePlus, X, Sparkles, ChevronDown, ChevronUp,
  Shirt, Headphones, Home, Baby, Dumbbell, Gift, Palette, Watch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QueryPayload } from "@shared/schema";

const CATEGORIES = [
  { value: "fashion",     label: "Fashion",     icon: Shirt },
  { value: "electronics", label: "Electronics", icon: Headphones },
  { value: "home",        label: "Home",        icon: Home },
  { value: "beauty",      label: "Beauty",      icon: Palette },
  { value: "baby",        label: "Baby",        icon: Baby },
  { value: "fitness",     label: "Fitness",     icon: Dumbbell },
  { value: "gifting",     label: "Gifting",     icon: Gift },
  { value: "accessories", label: "Accessories", icon: Watch },
];

const MOODS = [
  "cozy", "polished", "minimal", "playful", "sporty", "luxurious", "bold", "soft",
];

const OCCASIONS = [
  "everyday", "work event", "date night", "wedding guest", "vacation", "gym", "gifting", "dinner party", "baby shower",
];

const FOR_WHOM = [
  { value: "self",   label: "For me" },
  { value: "gift",   label: "Gift" },
  { value: "family", label: "Family" },
];

const URGENCY = [
  { value: "now",      label: "Need it now" },
  { value: "soon",     label: "Buying soon" },
  { value: "flexible", label: "No rush" },
];

const BUDGET_PRESETS = [
  { label: "Under $50",  min: 0,   max: 50 },
  { label: "Under $100", min: 0,   max: 100 },
  { label: "Under $200", min: 0,   max: 200 },
  { label: "Under $500", min: 0,   max: 500 },
];

interface Props {
  onSubmit: (payload: QueryPayload) => void;
  loading:  boolean;
  initialValues?: Partial<QueryPayload>;
}

export default function DecisionForm({ onSubmit, loading, initialValues }: Props) {
  const [message, setMessage]           = useState(initialValues?.message || "");
  const [category, setCategory]         = useState(initialValues?.category || "");
  const [budgetMax, setBudgetMax]       = useState(initialValues?.budgetMax || 200);
  const [budgetMin, setBudgetMin]       = useState(initialValues?.budgetMin || 0);
  const [moods, setMoods]               = useState<string[]>(initialValues?.mood || []);
  const [occasion, setOccasion]         = useState(initialValues?.occasion || "");
  const [forWhom, setForWhom]           = useState(initialValues?.forWhom || "self");
  const [urgency, setUrgency]           = useState(initialValues?.urgency || "flexible");
  const [mustHaves, setMustHaves]       = useState(initialValues?.mustHaves?.join(", ") || "");
  const [dealbreakers, setDealbreakers] = useState(initialValues?.dealbreakers?.join(", ") || "");
  const [favBrands, setFavBrands]       = useState(initialValues?.favoriteBrands?.join(", ") || "");
  const [badBrands, setBadBrands]       = useState(initialValues?.dislikedBrands?.join(", ") || "");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [image, setImage]               = useState<string | null>(null);
  const [imageBase64, setImageBase64]   = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleMood(m: string) {
    setMoods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const r = ev.target?.result as string;
      setImage(r);
      setImageBase64(r.split(",")[1]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function parseList(str: string) {
    return str.split(",").map(s => s.trim()).filter(Boolean);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() && !category) return;
    onSubmit({
      message: message.trim() || `Help me find the best ${category || "product"} for my needs`,
      category,
      budgetMin,
      budgetMax,
      mood: moods,
      occasion: occasion || undefined,
      forWhom,
      urgency,
      mustHaves: parseList(mustHaves),
      dealbreakers: parseList(dealbreakers),
      favoriteBrands: parseList(favBrands),
      dislikedBrands: parseList(badBrands),
      imageBase64: imageBase64 || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── What are you looking for ── */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          What are you deciding on?
        </label>
        <div className="relative">
          {image && (
            <div className="absolute left-3 top-3 z-10">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border">
                <img src={image} alt="Upload" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImage(null); setImageBase64(null); }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
            </div>
          )}
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Best running shoes for wide feet under $150, I pronate slightly..."
            className={cn(
              "resize-none min-h-[80px] text-sm pr-12",
              image && "pl-16"
            )}
            data-testid="input-message"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute right-3 bottom-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Upload product photo"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      </div>

      {/* ── Category chips ── */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(category === value ? "" : value)}
              className={cn("chip", category === value ? "chip-active" : "chip-idle")}
              data-testid={`chip-category-${value}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Budget ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Budget</label>
          <span className="text-sm font-semibold text-primary">
            {budgetMin > 0 ? `$${budgetMin}–` : "Up to "}${budgetMax}
          </span>
        </div>
        <Slider
          min={0} max={1000} step={10}
          value={[budgetMax]}
          onValueChange={([v]) => setBudgetMax(v)}
          className="w-full"
          data-testid="slider-budget"
        />
        <div className="flex gap-2 flex-wrap">
          {BUDGET_PRESETS.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => { setBudgetMin(p.min); setBudgetMax(p.max); }}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-all",
                budgetMax === p.max && budgetMin === p.min
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── For whom + Urgency ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">For whom</label>
          <div className="flex gap-1.5">
            {FOR_WHOM.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => setForWhom(f.value)}
                className={cn("chip flex-1 justify-center text-xs", forWhom === f.value ? "chip-active" : "chip-idle")}
                data-testid={`chip-for-${f.value}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Urgency</label>
          <div className="flex gap-1.5">
            {URGENCY.map(u => (
              <button
                key={u.value}
                type="button"
                onClick={() => setUrgency(u.value)}
                className={cn("chip flex-1 justify-center text-xs", urgency === u.value ? "chip-active" : "chip-idle")}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mood ── */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vibe / Style</label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => toggleMood(m)}
              className={cn("chip capitalize", moods.includes(m) ? "chip-active" : "chip-idle")}
              data-testid={`chip-mood-${m}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ── Occasion ── */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Occasion</label>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map(o => (
            <button
              key={o}
              type="button"
              onClick={() => setOccasion(occasion === o ? "" : o)}
              className={cn("chip capitalize", occasion === o ? "chip-active" : "chip-idle")}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* ── Advanced options ── */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showAdvanced ? "Hide" : "Show"} advanced options
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3 animate-slide-up">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Must-haves</label>
                <Input
                  value={mustHaves}
                  onChange={e => setMustHaves(e.target.value)}
                  placeholder="waterproof, long battery..."
                  className="text-sm h-8"
                  data-testid="input-must-haves"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Dealbreakers</label>
                <Input
                  value={dealbreakers}
                  onChange={e => setDealbreakers(e.target.value)}
                  placeholder="no leather, no Sony..."
                  className="text-sm h-8"
                  data-testid="input-dealbreakers"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Favorite brands</label>
                <Input
                  value={favBrands}
                  onChange={e => setFavBrands(e.target.value)}
                  placeholder="Nike, Apple, Patagonia..."
                  className="text-sm h-8"
                  data-testid="input-fav-brands"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Avoid brands</label>
                <Input
                  value={badBrands}
                  onChange={e => setBadBrands(e.target.value)}
                  placeholder="Brands to avoid..."
                  className="text-sm h-8"
                  data-testid="input-bad-brands"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Submit ── */}
      <Button
        type="submit"
        disabled={loading || (!message.trim() && !category)}
        className="w-full h-11 gap-2 font-semibold text-sm rounded-xl"
        style={{ background: "hsl(32 95% 54%)", color: "white" }}
        data-testid="button-submit-query"
      >
        <Sparkles className="w-4 h-4" />
        {loading ? "Analyzing…" : "Get my recommendation"}
      </Button>
    </form>
  );
}
