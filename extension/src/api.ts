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

  // Research report sections
  confidenceScore?: number;
  recommendation?: 'Strong Buy' | 'Buy' | 'Consider' | 'Wait' | 'Not Recommended';
  buyReasons?: Array<{ claim: string; frequency?: string }>;
  hiddenConcerns?: Array<{ concern: string; severity: 'low' | 'medium' | 'high' }>;
  reviewReliability?: { rating: 'High' | 'Medium' | 'Low'; explanation: string };
  communityConsensus?: { summary: string; longTermSentiment: string; commonRegrets?: string; dataSource: string };
  expertConsensus?: { summary: string; disagreements?: string; dataSource: string };
  alternatives?: {
    betterValue?: { name: string; reason: string };
    premium?: { name: string; reason: string };
    budget?: { name: string; reason: string };
  };
  priceIntelligence?: {
    analysis: string;
    recommendation: 'Buy Now' | 'Wait' | 'Buy During Event';
    reasoning: string;
  };
  whoShouldBuy?: string[];
  whoShouldAvoid?: string[];
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
