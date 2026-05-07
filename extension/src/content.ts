import badgeCss from './styles/badge.css?inline';
import { showVerdictPanel } from './verdict-panel';

const PRODUCT_RE = /\/dp\/([A-Z0-9]{10})/;

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

  badge.addEventListener('click', () => {
    console.log('[Worthly] badge clicked, ASIN:', asin);
    showVerdictPanel(asin, location.href, shadow);
  });

  shadow.appendChild(badge);
}

// Guard: top frame only, /dp/ product pages only — skip iframes and search/browse pages
if (window === window.top) {
  const asin = getAsin();
  if (asin) injectBadge(asin);
}
