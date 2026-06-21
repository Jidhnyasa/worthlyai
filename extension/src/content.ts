import badgeCss from './styles/badge.css?inline';
import { showVerdictPanel } from './verdict-panel';

// Amazon product URLs come in both /dp/ASIN and /gp/product/ASIN forms.
const PRODUCT_RE = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/;

function parsePrice(str: string | null | undefined): number | null {
  if (!str) return null;
  const n = parseFloat(str.replace(/[^0-9.]/g, ''));
  return !isNaN(n) && n > 0 ? n : null;
}

// Amazon buries price/title in a Product JSON-LD block on some layouts
// (e.g. certain international or third-party-seller pages) where the buy-box
// selectors below come up empty.
function extractFromJsonLd(): { title: string | null; price: number | null } {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const el of Array.from(scripts)) {
    try {
      const data = JSON.parse(el.textContent || '');
      const product =
        data['@type'] === 'Product' ? data :
        Array.isArray(data['@graph']) ? data['@graph'].find((n: any) => n['@type'] === 'Product') :
        null;
      if (!product) continue;
      const raw = product.offers?.price ?? product.offers?.lowPrice;
      const price = raw != null ? parsePrice(String(raw)) : null;
      const title = typeof product.name === 'string' ? product.name : null;
      if (price != null) return { title, price };
    } catch { /* malformed JSON-LD, skip */ }
  }
  return { title: null, price: null };
}

// Multiple fallbacks because Amazon serves different buy-box markup across
// page layouts, deal types (lightning deal, subscribe & save), and A/B tests.
function extractTitle(): string | null {
  return document.querySelector('#productTitle')?.textContent?.trim()
    || document.querySelector('h1.a-size-large span')?.textContent?.trim()
    || document.querySelector('#title')?.textContent?.trim()
    || document.querySelector('h1')?.textContent?.trim()
    || null;
}

function extractPrice(): number | null {
  const selectors = [
    "#corePrice_feature_div .a-price[data-a-size='xl'] .a-offscreen",
    "#corePriceDisplay_desktop_feature_div .a-price .a-offscreen",
    "#apex_desktop .a-price .a-offscreen",
    "#corePrice_feature_div .a-offscreen",
    "#sns-base-price .a-offscreen",
    ".a-price .a-offscreen",
    "#priceblock_ourprice",
    "#priceblock_dealprice",
    "#priceblock_saleprice",
  ];
  for (const sel of selectors) {
    const price = parsePrice(document.querySelector(sel)?.textContent?.trim());
    if (price != null) return price;
  }
  // Legacy split whole/fraction price display
  const whole = document.querySelector('.a-price-whole')?.textContent?.trim().replace(/[^0-9]/g, '');
  if (whole) {
    const fraction = document.querySelector('.a-price-fraction')?.textContent?.trim() || '00';
    const price = parsePrice(`${whole}.${fraction}`);
    if (price != null) return price;
  }
  return null;
}

function extractProductData() {
  let title = extractTitle();
  let price = extractPrice();
  if (!title || price == null) {
    const jsonLd = extractFromJsonLd();
    if (!title) title = jsonLd.title;
    if (price == null) price = jsonLd.price;
  }
  const rating = document.querySelector(
    '[data-hook="rating-out-of-text"], .a-icon-alt'
  )?.textContent?.match(/[\d.]+/)?.[0] ?? null;
  const reviewCount = document.querySelector('#acrCustomerReviewText')
    ?.textContent?.match(/[\d,]+/)?.[0]?.replace(/,/g, '') ?? null;
  const imageUrl = document.querySelector('#landingImage, #imgBlkFront')
    ?.getAttribute('data-old-hires')
    || document.querySelector('#landingImage, #imgBlkFront')?.getAttribute('src')
    || null;
  return { title, price, rating, reviewCount, imageUrl };
}

// Amazon sometimes finishes rendering the buy-box price a beat after
// document_idle (deal countdown widgets, subscribe & save variants). Retry a
// few times before giving up so we don't ship a partial scrape that forces
// the server to fall back to its own (more blockable) fetch.
function extractProductDataWithRetry(maxAttempts = 4, delayMs = 350): Promise<ReturnType<typeof extractProductData>> {
  return new Promise((resolve) => {
    const attempt = (n: number) => {
      const data = extractProductData();
      if ((data.title && data.price != null) || n >= maxAttempts) {
        resolve(data);
      } else {
        setTimeout(() => attempt(n + 1), delayMs);
      }
    };
    attempt(1);
  });
}

function getAsin(): string | null {
  return location.pathname.match(PRODUCT_RE)?.[1] ?? null;
}

function injectBadge(asin: string): void {
  if (document.getElementById('worthly-host')) return;

  // Host carries positioning via inline styles; Shadow DOM isolates badge
  // appearance from Amazon's aggressive !important CSS rules.
  const host = document.createElement('div');
  host.id = 'worthly-host';
  Object.assign(host.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '999999',
    width: 'auto',
    height: 'auto',
    margin: '0',
    padding: '0',
    border: 'none',
    background: 'none',
  });
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = badgeCss;
  shadow.appendChild(style);

  const badge = document.createElement('button');
  badge.id = 'worthly-badge';
  badge.setAttribute('aria-label', 'Get Worthly verdict for this product');
  badge.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">' +
    '<circle cx="9" cy="9" r="9" fill="hsl(32,95%,54%)"/>' +
    '<text x="9" y="13.5" text-anchor="middle" font-size="10" font-weight="800" font-family="system-ui,sans-serif" fill="white">W</text>' +
    '</svg>' +
    '<span>Worthly</span>';

  badge.addEventListener('click', async () => {
    console.log('[Worthly] badge clicked, ASIN:', asin);
    const scraped = await extractProductDataWithRetry();
    showVerdictPanel(asin, location.href, shadow, scraped);
  });

  shadow.appendChild(badge);
}

// Guard: top frame only, /dp/ product pages only — skip iframes and search/browse pages
if (window === window.top) {
  const asin = getAsin();
  if (asin) injectBadge(asin);
}
