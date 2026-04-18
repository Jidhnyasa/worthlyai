import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── User Profiles ────────────────────────────────────────────────────────────
export const userProfiles = sqliteTable("user_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatar: text("avatar"),
  onboardingDone: integer("onboarding_done", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, createdAt: true });
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

// ─── User Preferences ─────────────────────────────────────────────────────────
export const userPreferences = sqliteTable("user_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  categories: text("categories").default("[]"),       // JSON string[]
  budgetStyle: text("budget_style").default("balanced"), // budget|balanced|quality|premium
  favoriteBrands: text("favorite_brands").default("[]"), // JSON string[]
  dislikedBrands: text("disliked_brands").default("[]"),
  moods: text("moods").default("[]"),                 // JSON Mood[]
  occasions: text("occasions").default("[]"),
  sizes: text("sizes").default("{}"),                 // JSON { tops, bottoms, shoes, ... }
  skinHairProfile: text("skin_hair_profile").default("{}"),
  lifestyleTags: text("lifestyle_tags").default("[]"),
  giftRelationships: text("gift_relationships").default("[]"),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true });
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

// ─── Queries ──────────────────────────────────────────────────────────────────
export const queries = sqliteTable("queries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  sessionId: text("session_id"),
  category: text("category"),
  message: text("message"),
  budgetMin: real("budget_min"),
  budgetMax: real("budget_max"),
  mood: text("mood").default("[]"),           // JSON string[]
  occasion: text("occasion"),
  forWhom: text("for_whom").default("self"),  // self|gift|family
  favoriteBrands: text("favorite_brands").default("[]"),
  dislikedBrands: text("disliked_brands").default("[]"),
  mustHaves: text("must_haves").default("[]"),
  dealbreakers: text("dealbreakers").default("[]"),
  urgency: text("urgency").default("flexible"), // now|soon|flexible
  imageUrl: text("image_url"),
  notes: text("notes"),
  status: text("status").default("pending"), // pending|processing|done|error
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const insertQuerySchema = createInsertSchema(queries).omit({ id: true, createdAt: true, status: true });
export type InsertQuery = z.infer<typeof insertQuerySchema>;
export type Query = typeof queries.$inferSelect;

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  brand: text("brand"),
  category: text("category"),
  price: real("price"),
  priceRange: text("price_range"),
  imageUrl: text("image_url"),
  description: text("description"),
  pros: text("pros").default("[]"),           // JSON string[]
  cons: text("cons").default("[]"),
  tags: text("tags").default("[]"),
  externalId: text("external_id"),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// ─── Merchant Offers ──────────────────────────────────────────────────────────
export const merchantOffers = sqliteTable("merchant_offers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull(),
  merchantName: text("merchant_name").notNull(),
  merchantUrl: text("merchant_url"),
  affiliateUrl: text("affiliate_url"),
  price: real("price"),
  inStock: integer("in_stock", { mode: "boolean" }).default(true),
  isAffiliate: integer("is_affiliate", { mode: "boolean" }).default(false),
  shippingNote: text("shipping_note"),
});

export type MerchantOffer = typeof merchantOffers.$inferSelect;

// ─── Recommendations ──────────────────────────────────────────────────────────
export const recommendations = sqliteTable("recommendations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  queryId: integer("query_id").notNull(),
  userId: integer("user_id"),
  verdict: text("verdict").default("wait"),       // buy|wait|skip
  confidence: text("confidence").default("medium"), // low|medium|high
  confidenceScore: integer("confidence_score").default(70),
  explanation: text("explanation"),
  tradeoffs: text("tradeoffs").default("[]"),      // JSON string[]
  regretRisk: text("regret_risk"),
  resaleNote: text("resale_note"),
  topPickId: integer("top_pick_id"),
  budgetPickId: integer("budget_pick_id"),
  products: text("products").default("[]"),        // JSON ScoredProduct[]
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({ id: true, createdAt: true });
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendations.$inferSelect;

// ─── Saved Items ──────────────────────────────────────────────────────────────
export const savedItems = sqliteTable("saved_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  sessionId: text("session_id"),
  productTitle: text("product_title").notNull(),
  productBrand: text("product_brand"),
  productPrice: real("product_price"),
  productImageUrl: text("product_image_url"),
  category: text("category"),
  score: integer("score"),
  verdict: text("verdict"),
  notes: text("notes"),
  merchantUrl: text("merchant_url"),
  savedAt: text("saved_at").default(new Date().toISOString()),
});

export const insertSavedItemSchema = createInsertSchema(savedItems).omit({ id: true, savedAt: true });
export type InsertSavedItem = z.infer<typeof insertSavedItemSchema>;
export type SavedItem = typeof savedItems.$inferSelect;

// ─── Feedback ─────────────────────────────────────────────────────────────────
export const feedback = sqliteTable("feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  queryId: integer("query_id"),
  recommendationId: integer("recommendation_id"),
  sessionId: text("session_id"),
  vote: text("vote"),           // up|down
  outcome: text("outcome"),     // bought|skipped|regret|loved|returned
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true, createdAt: true });
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

// ─── Behavior Events ──────────────────────────────────────────────────────────
export const behaviorEvents = sqliteTable("behavior_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  sessionId: text("session_id"),
  eventType: text("event_type").notNull(), // clicked|saved|skipped|bought|regretted|returned
  productTitle: text("product_title"),
  category: text("category"),
  metadata: text("metadata").default("{}"), // JSON
  createdAt: text("created_at").default(new Date().toISOString()),
});

// ─── Shared Types (for AI pipeline) ───────────────────────────────────────────
export interface ScoredProduct {
  title: string;
  brand?: string;
  category?: string;
  price?: number;
  priceRange?: string;
  imageUrl?: string;
  reason: string;
  pros: string[];
  cons: string[];
  scores: {
    finalScore: number;
    fitScore: number;
    valueScore: number;
    proofScore: number;
    regretScore: number;
  };
  offers: Array<{
    merchantName: string;
    merchantUrl?: string;
    affiliateUrl?: string;
    price?: number;
    isAffiliate: boolean;
    shippingNote?: string;
  }>;
  resaleNote?: string;
}

export interface RecommendationResult {
  verdict: "buy" | "wait" | "skip";
  confidence: "low" | "medium" | "high";
  confidenceScore: number;
  explanation: string;
  tradeoffs: string[];
  regretRisk?: string;
  resaleNote?: string;
  topChoice: ScoredProduct;
  budgetPick?: ScoredProduct;
  premiumPick?: ScoredProduct;
  alternatives: ScoredProduct[];
}

export interface QueryPayload {
  message: string;
  category?: string;
  budgetMin?: number;
  budgetMax?: number;
  mood?: string[];
  occasion?: string;
  forWhom?: string;
  favoriteBrands?: string[];
  dislikedBrands?: string[];
  mustHaves?: string[];
  dealbreakers?: string[];
  urgency?: string;
  imageBase64?: string;
  notes?: string;
  sessionId?: string;
  userId?: number;
}
