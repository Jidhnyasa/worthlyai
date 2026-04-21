import {
  pgTable, uuid, text, boolean, timestamp, numeric,
  jsonb, integer, bigserial, index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Queries ──────────────────────────────────────────────────────────────────
export const queries = pgTable("queries", {
  id:              uuid("id").primaryKey().defaultRandom(),
  userId:          uuid("user_id"),
  sessionId:       text("session_id"),
  rawQuery:        text("raw_query").notNull(),
  normalizedQuery: text("normalized_query"),
  queryType:       text("query_type"),
  category:        text("category"),
  budgetMin:       numeric("budget_min"),
  budgetMax:       numeric("budget_max"),
  mood:            text("mood"),
  occasion:        text("occasion"),
  hasImage:        boolean("has_image").default(false),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertQuerySchema = createInsertSchema(queries).omit({ id: true, createdAt: true });
export type InsertQuery = z.infer<typeof insertQuerySchema>;
export type Query = typeof queries.$inferSelect;

// ─── Recommendations ──────────────────────────────────────────────────────────
export const recommendations = pgTable("recommendations", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  userId:             uuid("user_id"),
  queryId:            uuid("query_id"),
  topChoiceProductId: uuid("top_choice_product_id"),
  resultJson:         jsonb("result_json").notNull(),
  buyWaitSkip:        text("buy_wait_skip").notNull(),
  fitScore:           numeric("fit_score"),
  valueScore:         numeric("value_score"),
  confidenceScore:    numeric("confidence_score"),
  regretScore:        numeric("regret_score"),
  resaleScore:        numeric("resale_score"),
  explanation:        text("explanation"),
  createdAt:          timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({ id: true, createdAt: true });
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendations.$inferSelect;

// ─── Saved Items ──────────────────────────────────────────────────────────────
export const savedItems = pgTable("saved_items", {
  id:               uuid("id").primaryKey().defaultRandom(),
  userId:           uuid("user_id").notNull(),
  productId:        uuid("product_id"),
  recommendationId: uuid("recommendation_id"),
  collectionId:     uuid("collection_id"),
  notes:            text("notes"),
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertSavedItemSchema = createInsertSchema(savedItems).omit({ id: true, createdAt: true });
export type InsertSavedItem = z.infer<typeof insertSavedItemSchema>;
export type SavedItem = typeof savedItems.$inferSelect;

// ─── User Preferences ─────────────────────────────────────────────────────────
export const userPreferences = pgTable("user_preferences", {
  id:                  uuid("id").primaryKey().defaultRandom(),
  userId:              uuid("user_id").notNull().unique(),
  budgetDefaultMin:    numeric("budget_default_min"),
  budgetDefaultMax:    numeric("budget_default_max"),
  favoriteBrands:      jsonb("favorite_brands").$type<string[]>().default([]),
  dislikedBrands:      jsonb("disliked_brands").$type<string[]>().default([]),
  preferredColors:     jsonb("preferred_colors").$type<string[]>().default([]),
  preferredStyles:     jsonb("preferred_styles").$type<string[]>().default([]),
  preferredSizes:      jsonb("preferred_sizes").$type<Record<string, string>>().default({}),
  skinHairProfile:     jsonb("skin_hair_profile"),
  lifestyleTags:       jsonb("lifestyle_tags").$type<string[]>().default([]),
  occasionPreferences: jsonb("occasion_preferences").$type<string[]>().default([]),
  moodPreferences:     jsonb("mood_preferences").$type<string[]>().default([]),
  updatedAt:           timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

// ─── Feedback ─────────────────────────────────────────────────────────────────
export const feedback = pgTable("feedback", {
  id:               uuid("id").primaryKey().defaultRandom(),
  userId:           uuid("user_id"),
  queryId:          uuid("query_id"),
  recommendationId: uuid("recommendation_id"),
  productId:        uuid("product_id"),
  helpful:          boolean("helpful"),
  outcome:          text("outcome"),
  regretLevel:      integer("regret_level"),
  notes:            text("notes"),
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true, createdAt: true });
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

// ─── User Behavior Events ─────────────────────────────────────────────────────
export const userBehaviorEvents = pgTable("user_behavior_events", {
  id:        bigserial("id", { mode: "number" }).primaryKey(),
  userId:    uuid("user_id"),
  eventType: text("event_type").notNull(),
  productId: uuid("product_id"),
  queryId:   uuid("query_id"),
  payload:   jsonb("payload").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Frontend-only types (purchase protection features) ───────────────────────

export type ReturnStatus = "active" | "expiring_soon" | "expired";
export type SubscriptionStatus = "active" | "trial" | "cancelled";
export type ActionType = "return" | "cancel" | "refund" | "price_match" | "negotiate";
export type ActionPriority = "high" | "medium" | "low";

export interface Purchase {
  id: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  imageUrl?: string;
  purchasedAt: Date;
  returnWindowDays: number;
  merchant: string;
  returnStatus: ReturnStatus;
  daysUntilDeadline: number;
  orderNumber?: string;
}

export interface Subscription {
  id: string;
  name: string;
  category: string;
  price: number;
  billingCycle: "monthly" | "yearly";
  renewsAt: Date;
  daysUntilRenewal: number;
  status: SubscriptionStatus;
  usageFlag?: "unused" | "low_usage";
  cancellationUrl?: string;
}

export interface ActionItem {
  id: string;
  type: ActionType;
  priority: ActionPriority;
  title: string;
  description: string;
  potentialSaving?: number;
  deadline?: Date;
  purchaseId?: string;
  subscriptionId?: string;
  draftSubject?: string;
  draftBody?: string;
  completed: boolean;
}

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
  userId?: string;
}
