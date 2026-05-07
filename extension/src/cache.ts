import type { VerdictResponse } from './api';

const TTL_MS = 30 * 60 * 1000;

interface CacheEntry {
  data: VerdictResponse;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export function getCachedVerdict(asin: string): VerdictResponse | null {
  const entry = cache.get(asin);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(asin);
    return null;
  }
  return entry.data;
}

export function setCachedVerdict(asin: string, data: VerdictResponse): void {
  cache.set(asin, { data, expiresAt: Date.now() + TTL_MS });
}
