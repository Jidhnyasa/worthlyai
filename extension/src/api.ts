export interface VerdictResponse {
  verdict: 'buy' | 'wait' | 'skip';
  verdictScore: number;
  headline: string;
  category: string;
  reasons: Array<{ label: string; detail: string }>;
  scores: { fit: number; value: number; proof: number; regret: number };
  estimatedSavings?: number | null;
  waitUntil?: string | null;
  duplicateFlag?: string | null;
  resaleOutlook?: string | null;
}

export const API_BASE_URL = 'https://worthlyai-1.onrender.com';

export interface ScrapedProductData {
  title: string | null;
  price: number | null;
  rating: string | null;
  reviewCount: string | null;
  imageUrl: string | null;
}

export async function fetchVerdict(url: string, scraped?: ScrapedProductData): Promise<VerdictResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'fetch-verdict', url, scraped }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      resolve(response.data as VerdictResponse);
    });
  });
}
