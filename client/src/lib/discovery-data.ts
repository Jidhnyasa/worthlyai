// ─── Types ────────────────────────────────────────────────────────────────────

export type Verdict = "buy" | "wait" | "skip";

export interface Scores {
  fit:     number;
  value:   number;
  proof:   number;
  regret:  number; // lower = less regret risk (good)
  final:   number;
}

export interface BuyLink {
  merchant: string;
  price:    number;
  url:      string; // affiliate placeholder
}

export interface MockVerdict {
  slug:            string;
  productTitle:    string;
  brand:           string;
  category:        string;
  price:           number;
  imageUrl:        string;
  verdict:         Verdict;
  confidenceScore: number;
  explanation:     string;
  scores:          Scores;
  pros:            string[];
  cons:            string[];
  tradeoffs:       string[];
  buyLinks:        BuyLink[];
  relatedSlugs:    string[];
}

export interface CompareProduct {
  title:    string;
  brand:    string;
  price:    number;
  imageUrl: string;
  scores:   Scores;
  pros:     string[];
  cons:     string[];
}

export interface MockComparison {
  slug:        string;
  title:       string;
  description: string;
  category:    string;
  winnerIndex: number;
  winnerReason: string;
  products:    CompareProduct[];
  relatedSlugs: string[];
}

export interface MockProduct {
  slug:        string;
  title:       string;
  brand:       string;
  category:    string;
  price:       number;
  imageUrl:    string;
  description: string;
  scores:      Scores;
  verdict:     Verdict;
  highlights:  string[];
  concerns:    string[];
  buyLinks:    BuyLink[];
  verdictSlug: string;
}

export interface TopPick {
  title:    string;
  slug:     string;
  verdict:  Verdict;
  score:    number;
  price:    number;
  imageUrl: string;
  brand:    string;
}

export interface CategoryHub {
  slug:           string;
  title:          string;
  description:    string;
  heroHeadline:   string;
  heroSubline:    string;
  topPicks:       TopPick[];
  comparisons:    { title: string; slug: string; description: string }[];
  popularQueries: string[];
}

// ─── Verdicts ─────────────────────────────────────────────────────────────────

export const VERDICTS: Record<string, MockVerdict> = {
  "sony-wh1000xm5": {
    slug: "sony-wh1000xm5",
    productTitle: "Sony WH-1000XM5",
    brand: "Sony",
    category: "headphones",
    price: 279,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&fit=crop",
    verdict: "buy",
    confidenceScore: 91,
    explanation:
      "The XM5 delivers best-in-class ANC and all-day comfort at a price that has dropped meaningfully since launch. If you commute, travel, or work from open offices, the focus and noise isolation it provides has real productivity value — making the spend easy to justify.",
    scores: { fit: 92, value: 84, proof: 95, regret: 12, final: 91 },
    pros: [
      "Industry-leading active noise cancellation",
      "30-hour battery life with quick charge",
      "Exceptional call quality with 8 built-in mics",
      "Comfortable for 8+ hour sessions",
      "LDAC for hi-res audio on Android",
    ],
    cons: [
      "Folds flat but not into the cup — bulkier case than XM4",
      "Touch controls take adjustment",
      "No IP rating — not sweat-proof",
    ],
    tradeoffs: [
      "XM5 has better ANC and mic quality than XM4, but XM4 folds more compactly",
      "AirPods Max offers better Apple ecosystem fit; XM5 wins on value and cross-platform use",
      "Bose QC45 is slightly more comfortable for glasses wearers",
    ],
    buyLinks: [
      { merchant: "Amazon", price: 279, url: "https://amazon.com" },
      { merchant: "Best Buy", price: 279, url: "https://bestbuy.com" },
      { merchant: "Sony Direct", price: 349, url: "https://sony.com" },
    ],
    relatedSlugs: ["airpods-pro-2", "bose-qc45"],
  },

  "airpods-pro-2": {
    slug: "airpods-pro-2",
    productTitle: "AirPods Pro (2nd Gen)",
    brand: "Apple",
    category: "headphones",
    price: 249,
    imageUrl: "https://images.unsplash.com/photo-1588423771073-b8903fead85b?w=800&q=80&fit=crop",
    verdict: "buy",
    confidenceScore: 88,
    explanation:
      "For iPhone users, AirPods Pro 2 is the clearest 'buy' in Apple's lineup. The ANC is now genuinely competitive with Sony, and the Transparency mode is unmatched. If you're Android-only, look at the XM5 instead.",
    scores: { fit: 94, value: 78, proof: 90, regret: 14, final: 88 },
    pros: [
      "Best transparency mode of any earbuds",
      "Seamless Apple device switching",
      "Adaptive EQ auto-tuning to your ears",
      "USB-C case with precision finding",
      "IP54 sweat and water resistant",
    ],
    cons: [
      "Premium price for in-ear form factor",
      "Limited value for Android users",
      "Battery life shorter than over-ear alternatives",
    ],
    tradeoffs: [
      "If you're in the Apple ecosystem, AirPods Pro 2 > Sony XM5 for daily convenience",
      "Sony XM5 wins on raw ANC strength and battery life",
      "Galaxy Buds 2 Pro is the Android equivalent",
    ],
    buyLinks: [
      { merchant: "Apple Store", price: 249, url: "https://apple.com" },
      { merchant: "Amazon", price: 189, url: "https://amazon.com" },
      { merchant: "Best Buy", price: 229, url: "https://bestbuy.com" },
    ],
    relatedSlugs: ["sony-wh1000xm5", "bose-qc45"],
  },

  "dyson-v15-detect": {
    slug: "dyson-v15-detect",
    productTitle: "Dyson V15 Detect",
    brand: "Dyson",
    category: "home",
    price: 699,
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop",
    verdict: "wait",
    confidenceScore: 74,
    explanation:
      "The V15 Detect is genuinely impressive — the laser dust detection is more than a gimmick — but at $699, it only makes sense if you have pets, significant hard floors, or deep cleaning needs. Wait for a sale (it regularly drops to $499–$549) or consider the V12 for most homes.",
    scores: { fit: 78, value: 62, proof: 88, regret: 28, final: 74 },
    pros: [
      "Laser reveals hidden dust on hard floors",
      "Auto-adjusts suction to surface type",
      "LCD screen shows real-time particle count",
      "60-min runtime in Eco mode",
    ],
    cons: [
      "Very expensive — V12 performs similarly for most homes",
      "Heavy at 6.8 lbs",
      "Attachments storage can be awkward",
    ],
    tradeoffs: [
      "V12 Detect is $150 cheaper with nearly identical suction for <2,000 sq ft",
      "Shark Stratos is 40% cheaper with comparable performance on carpets",
      "Only worth full price if you have pets + mixed floor types",
    ],
    buyLinks: [
      { merchant: "Dyson Direct", price: 699, url: "https://dyson.com" },
      { merchant: "Best Buy", price: 649, url: "https://bestbuy.com" },
      { merchant: "Amazon", price: 649, url: "https://amazon.com" },
    ],
    relatedSlugs: ["sony-wh1000xm5"],
  },

  "hatch-rest-2nd-gen": {
    slug: "hatch-rest-2nd-gen",
    productTitle: "Hatch Rest (2nd Gen)",
    brand: "Hatch",
    category: "baby-gear",
    price: 69,
    imageUrl: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80&fit=crop",
    verdict: "buy",
    confidenceScore: 93,
    explanation:
      "For new parents, the Hatch Rest is the single highest-ROI nursery purchase. The combination of white noise, customisable light, and app control means you can adjust without entering the room. At $69, it pays for itself the first week you don't disturb a sleeping baby.",
    scores: { fit: 96, value: 92, proof: 94, regret: 6, final: 93 },
    pros: [
      "App control means zero room entry for adjustments",
      "Programmable routines (nap, bedtime, wake)",
      "Doubles as toddler OK-to-wake light",
      "Works for years — not just infancy",
    ],
    cons: [
      "Subscription needed for advanced features",
      "App occasionally has connectivity hiccups",
    ],
    tradeoffs: [
      "LectroFan is cheaper for pure white noise but lacks light/app features",
      "Hatch Rest+ adds a time-to-rise clock but costs $30 more",
    ],
    buyLinks: [
      { merchant: "Amazon", price: 69, url: "https://amazon.com" },
      { merchant: "Target", price: 69, url: "https://target.com" },
      { merchant: "Buy Buy Baby", price: 69, url: "https://buybuybaby.com" },
    ],
    relatedSlugs: [],
  },
};

// ─── Comparisons ──────────────────────────────────────────────────────────────

export const COMPARISONS: Record<string, MockComparison> = {
  "sony-vs-bose-headphones": {
    slug: "sony-vs-bose-headphones",
    title: "Sony WH-1000XM5 vs Bose QuietComfort 45",
    description: "Two best-in-class ANC headphones at similar price points. We score them on fit, value, and proven quality.",
    category: "headphones",
    winnerIndex: 0,
    winnerReason: "Sony wins on ANC strength, battery life, and codec support. Bose edges ahead only for glasses wearers.",
    products: [
      {
        title: "Sony WH-1000XM5",
        brand: "Sony",
        price: 279,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&fit=crop",
        scores: { fit: 92, value: 84, proof: 95, regret: 12, final: 91 },
        pros: ["Best-in-class ANC", "30hr battery", "8 mics for calls", "LDAC hi-res audio"],
        cons: ["Bulkier case", "Touch controls learning curve", "No IP rating"],
      },
      {
        title: "Bose QuietComfort 45",
        brand: "Bose",
        price: 249,
        imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80&fit=crop",
        scores: { fit: 88, value: 82, proof: 90, regret: 15, final: 86 },
        pros: ["Featherlight (238g)", "More comfortable for glasses", "Balanced EQ", "Simpler controls"],
        cons: ["Weaker ANC than XM5", "24hr battery", "No LDAC/aptX", "Older design"],
      },
    ],
    relatedSlugs: ["airpods-pro-vs-galaxy-buds"],
  },

  "airpods-pro-vs-galaxy-buds": {
    slug: "airpods-pro-vs-galaxy-buds",
    title: "AirPods Pro 2 vs Samsung Galaxy Buds 2 Pro",
    description: "The flagship earbuds from Apple and Samsung compared head-to-head on ANC, transparency, and ecosystem integration.",
    category: "headphones",
    winnerIndex: 0,
    winnerReason: "AirPods Pro 2 wins for Apple users; Galaxy Buds 2 Pro wins for Samsung/Android users. Choose based on your ecosystem.",
    products: [
      {
        title: "AirPods Pro (2nd Gen)",
        brand: "Apple",
        price: 249,
        imageUrl: "https://images.unsplash.com/photo-1588423771073-b8903fead85b?w=800&q=80&fit=crop",
        scores: { fit: 94, value: 78, proof: 90, regret: 14, final: 88 },
        pros: ["Best transparency mode", "Seamless Apple switching", "IP54", "Precision finding"],
        cons: ["iOS/macOS optimised only", "Higher price", "Shorter battery than over-ear"],
      },
      {
        title: "Galaxy Buds 2 Pro",
        brand: "Samsung",
        price: 179,
        imageUrl: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&q=80&fit=crop",
        scores: { fit: 88, value: 86, proof: 82, regret: 18, final: 84 },
        pros: ["Better value at $179", "24-bit Hi-Fi audio", "Good ANC on Samsung", "360 Audio"],
        cons: ["Weakened on non-Samsung Android", "Smaller soundstage", "Less mature app"],
      },
    ],
    relatedSlugs: ["sony-vs-bose-headphones"],
  },

  "hatch-vs-lectrofan-baby": {
    slug: "hatch-vs-lectrofan-baby",
    title: "Hatch Rest 2nd Gen vs LectroFan Classic",
    description: "Sleep machine showdown for newborns. Smart connectivity vs pure white noise simplicity.",
    category: "baby-gear",
    winnerIndex: 0,
    winnerReason: "Hatch wins for parents who want app control and a device that scales into toddlerhood. LectroFan is better for a simple, cheap white noise machine.",
    products: [
      {
        title: "Hatch Rest (2nd Gen)",
        brand: "Hatch",
        price: 69,
        imageUrl: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80&fit=crop",
        scores: { fit: 96, value: 92, proof: 94, regret: 6, final: 93 },
        pros: ["App-controlled light + sound", "OK-to-wake for toddlers", "Routines", "Multi-year use"],
        cons: ["Needs Wi-Fi", "Subscription for full features", "More expensive"],
      },
      {
        title: "LectroFan Classic",
        brand: "LectroFan",
        price: 45,
        imageUrl: "https://images.unsplash.com/photo-1558618047-f4e745e0d0f3?w=800&q=80&fit=crop",
        scores: { fit: 78, value: 90, proof: 88, regret: 20, final: 80 },
        pros: ["Simple — no app required", "20 sound options", "Compact", "No subscription"],
        cons: ["No light component", "No app or remote control", "No toddler features", "Limited to sound only"],
      },
    ],
    relatedSlugs: [],
  },
};

// ─── Category Hubs ────────────────────────────────────────────────────────────

export const CATEGORIES: Record<string, CategoryHub> = {
  headphones: {
    slug: "headphones",
    title: "Headphones & Earbuds",
    description: "Structured buying guides for wireless headphones and earbuds. Every recommendation is scored on fit, value, and real-world proof.",
    heroHeadline: "Which headphones are actually worth it?",
    heroSubline: "We score every major option on ANC quality, battery life, comfort, and value. Get a structured verdict — not an ad.",
    topPicks: [
      { title: "Sony WH-1000XM5", slug: "sony-wh1000xm5", verdict: "buy", score: 91, price: 279, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&fit=crop", brand: "Sony" },
      { title: "AirPods Pro (2nd Gen)", slug: "airpods-pro-2", verdict: "buy", score: 88, price: 249, imageUrl: "https://images.unsplash.com/photo-1588423771073-b8903fead85b?w=800&q=80&fit=crop", brand: "Apple" },
      { title: "Bose QC45", slug: "sony-vs-bose-headphones", verdict: "buy", score: 86, price: 249, imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80&fit=crop", brand: "Bose" },
    ],
    comparisons: [
      { title: "Sony WH-1000XM5 vs Bose QC45", slug: "sony-vs-bose-headphones", description: "Best-in-class ANC headphones at nearly the same price." },
      { title: "AirPods Pro 2 vs Galaxy Buds 2 Pro", slug: "airpods-pro-vs-galaxy-buds", description: "Flagship earbuds — choose based on your ecosystem." },
    ],
    popularQueries: [
      "Best headphones for commuting under $300",
      "ANC headphones that work with both iPhone and Android",
      "Most comfortable over-ear headphones for long sessions",
      "Best wireless earbuds for working out",
      "Are AirPods Pro worth it if I'm not in the Apple ecosystem?",
    ],
  },

  gifts: {
    slug: "gifts",
    title: "Gift Ideas Worth Buying",
    description: "Curated gift recommendations that scored 80+ on Worthly's decision engine. Each pick is vetted for value, proof, and low regret risk.",
    heroHeadline: "Gifts people actually keep.",
    heroSubline: "Every pick here scored 80+ on Worthly's Buy / Wait / Skip engine. No filler. No padding. Just things worth giving.",
    topPicks: [
      { title: "Hatch Rest (2nd Gen)", slug: "hatch-rest-2nd-gen", verdict: "buy", score: 93, price: 69, imageUrl: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80&fit=crop", brand: "Hatch" },
      { title: "Sony WH-1000XM5", slug: "sony-wh1000xm5", verdict: "buy", score: 91, price: 279, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&fit=crop", brand: "Sony" },
      { title: "AirPods Pro (2nd Gen)", slug: "airpods-pro-2", verdict: "buy", score: 88, price: 249, imageUrl: "https://images.unsplash.com/photo-1588423771073-b8903fead85b?w=800&q=80&fit=crop", brand: "Apple" },
    ],
    comparisons: [
      { title: "Sony WH-1000XM5 vs Bose QC45", slug: "sony-vs-bose-headphones", description: "The two best noise-cancelling gifts at the same price point." },
      { title: "Hatch Rest vs LectroFan", slug: "hatch-vs-lectrofan-baby", description: "Best sleep machine gift for new parents." },
    ],
    popularQueries: [
      "Best tech gift under $100",
      "Gifts for new parents that aren't useless",
      "Luxury gifts that are actually worth the price",
      "Best gift for someone who has everything",
      "Thoughtful gifts under $50",
    ],
  },

  "baby-gear": {
    slug: "baby-gear",
    title: "Baby Gear Worth Buying",
    description: "Honest verdicts on baby and toddler gear — scored for safety, longevity, and parent sanity. No fluff.",
    heroHeadline: "Baby gear that actually earns its keep.",
    heroSubline: "Most nursery products are over-engineered or overhyped. We score what's genuinely worth the money — and what to skip.",
    topPicks: [
      { title: "Hatch Rest (2nd Gen)", slug: "hatch-rest-2nd-gen", verdict: "buy", score: 93, price: 69, imageUrl: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80&fit=crop", brand: "Hatch" },
    ],
    comparisons: [
      { title: "Hatch Rest vs LectroFan Classic", slug: "hatch-vs-lectrofan-baby", description: "Smart sleep machine vs simple white noise — which is worth it for newborns?" },
    ],
    popularQueries: [
      "Is a Snoo worth the price?",
      "Best white noise machine for newborn",
      "Baby monitor that's actually reliable",
      "High chair that cleans easily",
      "Diaper bag that doesn't look like a diaper bag",
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getVerdict(slug: string): MockVerdict | null {
  return VERDICTS[slug] ?? null;
}

export function getComparison(slug: string): MockComparison | null {
  return COMPARISONS[slug] ?? null;
}

export function getCategory(slug: string): CategoryHub | null {
  return CATEGORIES[slug] ?? null;
}

export const VERDICT_COLORS: Record<Verdict, { bg: string; text: string; border: string; label: string }> = {
  buy:  { bg: "bg-emerald-500/12", text: "text-emerald-600", border: "border-emerald-500/25", label: "Buy" },
  wait: { bg: "bg-amber-500/12",   text: "text-amber-600",   border: "border-amber-500/25",   label: "Wait" },
  skip: { bg: "bg-red-500/12",     text: "text-red-600",     border: "border-red-500/25",      label: "Skip" },
};
