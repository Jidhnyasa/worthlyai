import type { Purchase, Subscription, ActionItem } from "@shared/schema";

const today = new Date("2026-04-18");
function daysAgo(n: number): Date {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number): Date {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d;
}

export const MOCK_PURCHASES: Purchase[] = [
  {
    id: "p1",
    title: "Air Max 270",
    brand: "Nike",
    category: "Footwear",
    price: 149.99,
    purchasedAt: daysAgo(18),
    returnWindowDays: 30,
    merchant: "Nike.com",
    returnStatus: "expiring_soon",
    daysUntilDeadline: 12,
    orderNumber: "NK-20260401-5521",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
  },
  {
    id: "p2",
    title: "65\" QLED 4K TV",
    brand: "Samsung",
    category: "Electronics",
    price: 1299.99,
    purchasedAt: daysAgo(5),
    returnWindowDays: 30,
    merchant: "Best Buy",
    returnStatus: "active",
    daysUntilDeadline: 25,
    orderNumber: "BBY-2026-98812",
    imageUrl: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400&q=80",
  },
  {
    id: "p3",
    title: "Slim-Fit Wool Blazer",
    brand: "Zara",
    category: "Fashion",
    price: 89.99,
    purchasedAt: daysAgo(35),
    returnWindowDays: 30,
    merchant: "Zara.com",
    returnStatus: "expired",
    daysUntilDeadline: -5,
    orderNumber: "ZR-20260314-0018",
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4b4357?w=400&q=80",
  },
  {
    id: "p4",
    title: "V15 Detect",
    brand: "Dyson",
    category: "Home",
    price: 749.99,
    purchasedAt: daysAgo(2),
    returnWindowDays: 35,
    merchant: "Dyson.com",
    returnStatus: "active",
    daysUntilDeadline: 33,
    orderNumber: "DY-20260416-3307",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  },
];

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "s1",
    name: "Netflix",
    category: "Streaming",
    price: 15.99,
    billingCycle: "monthly",
    renewsAt: daysFromNow(1),
    daysUntilRenewal: 1,
    status: "active",
  },
  {
    id: "s2",
    name: "Adobe Creative Cloud",
    category: "Software",
    price: 54.99,
    billingCycle: "monthly",
    renewsAt: daysFromNow(8),
    daysUntilRenewal: 8,
    status: "active",
  },
  {
    id: "s3",
    name: "Disney+",
    category: "Streaming",
    price: 13.99,
    billingCycle: "monthly",
    renewsAt: daysFromNow(3),
    daysUntilRenewal: 3,
    status: "active",
    usageFlag: "unused",
  },
  {
    id: "s4",
    name: "Spotify",
    category: "Music",
    price: 9.99,
    billingCycle: "monthly",
    renewsAt: daysFromNow(15),
    daysUntilRenewal: 15,
    status: "active",
  },
  {
    id: "s5",
    name: "Headspace",
    category: "Health",
    price: 12.99,
    billingCycle: "monthly",
    renewsAt: daysFromNow(21),
    daysUntilRenewal: 21,
    status: "active",
    usageFlag: "low_usage",
  },
];

export const MOCK_ACTIONS: ActionItem[] = [
  {
    id: "a1",
    type: "return",
    priority: "high",
    title: "Return Nike Air Max 270",
    description: "Return window closes in 12 days. Still within the pristine condition policy.",
    potentialSaving: 149.99,
    deadline: daysFromNow(12),
    purchaseId: "p1",
    draftSubject: "Return Request — Order NK-20260401-5521",
    draftBody: `Hi Nike Customer Support,

I'd like to initiate a return for my recent order.

Order Number: NK-20260401-5521
Item: Nike Air Max 270
Purchase Date: April 1, 2026
Reason: The fit isn't quite right for my use case.

Please let me know the return process and where to ship the item.

Thank you,`,
    completed: false,
  },
  {
    id: "a2",
    type: "cancel",
    priority: "high",
    title: "Cancel Disney+",
    description: "Not used in 2+ months. Renews in 3 days — cancel now to avoid the charge.",
    potentialSaving: 167.88,
    subscriptionId: "s3",
    draftSubject: "Cancellation Request — Disney+ Subscription",
    draftBody: `Hi Disney+ Support,

I'd like to cancel my Disney+ subscription effective immediately.

Please confirm the cancellation and ensure I am not charged on the upcoming renewal date of April 21, 2026.

Thank you,`,
    completed: false,
  },
  {
    id: "a3",
    type: "price_match",
    priority: "medium",
    title: "Price match Samsung TV at Best Buy",
    description: "Costco lists the same model for $1,149.99 — $150 less. Best Buy's price match policy covers this.",
    potentialSaving: 150,
    purchaseId: "p2",
    draftSubject: "Price Match Request — Order BBY-2026-98812",
    draftBody: `Hi Best Buy Customer Support,

I recently purchased the Samsung 65" QLED 4K TV (Order BBY-2026-98812) for $1,299.99.

I've found the identical model listed at Costco for $1,149.99. Per Best Buy's price match guarantee, I'd like to request a price adjustment of $150.

Could you please process this? I'm happy to provide a link to the Costco listing.

Thank you,`,
    completed: false,
  },
  {
    id: "a4",
    type: "negotiate",
    priority: "low",
    title: "Negotiate Netflix rate",
    description: "You've been a subscriber for 3+ years. Calling retention often yields a 20–30% discount.",
    potentialSaving: 57.48,
    subscriptionId: "s1",
    draftSubject: "Loyalty Discount Request",
    draftBody: `Hi Netflix,

I've been a loyal Netflix subscriber for over 3 years. I love the service, but I'm considering downgrading due to pricing.

I'd appreciate any loyalty discount or promotional rate you can offer.

Thank you,`,
    completed: false,
  },
];

export function getDashboardStats() {
  const expiringReturns = MOCK_PURCHASES.filter(p => p.returnStatus === "expiring_soon").length;
  const activeReturns   = MOCK_PURCHASES.filter(p => p.returnStatus === "active").length;
  const atRisk = MOCK_PURCHASES
    .filter(p => p.returnStatus !== "expired")
    .reduce((sum, p) => sum + p.price, 0);
  const subscriptionMonthly = MOCK_SUBSCRIPTIONS
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + s.price, 0);
  const potentialSavings = MOCK_ACTIONS
    .filter(a => !a.completed)
    .reduce((sum, a) => sum + (a.potentialSaving ?? 0), 0);
  return { expiringReturns, activeReturns, atRisk, subscriptionMonthly, potentialSavings };
}
