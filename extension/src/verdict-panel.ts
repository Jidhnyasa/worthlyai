import { fetchVerdict, type VerdictResponse, type ScrapedProductData } from './api';
import { getCachedVerdict, setCachedVerdict } from './cache';

// ── Verdict color tokens ───────────────────────────────────────────────────────

type Verdict = 'buy' | 'wait' | 'skip';

const VERDICT_COLORS: Record<Verdict, { bg: string; color: string }> = {
  wait: { bg: 'hsl(40 90% 92%)',  color: 'hsl(40 60% 30%)' },
  buy:  { bg: 'hsl(140 50% 90%)', color: 'hsl(140 60% 25%)' },
  skip: { bg: 'hsl(0 70% 92%)',   color: 'hsl(0 60% 35%)' },
};

const SEVERITY_COLORS: Record<string, string> = {
  low:    '#78716c',
  medium: 'hsl(40 60% 35%)',
  high:   'hsl(0 60% 40%)',
};

const RELIABILITY_COLORS: Record<string, string> = {
  High:   'hsl(140 60% 25%)',
  Medium: 'hsl(40 60% 30%)',
  Low:    'hsl(0 60% 40%)',
};

const PRICE_REC_COLORS: Record<string, string> = {
  'Buy Now':         'hsl(140 60% 25%)',
  'Wait':            'hsl(40 60% 30%)',
  'Buy During Event':'hsl(200 60% 30%)',
};

// ── Styles ────────────────────────────────────────────────────────────────────

const PANEL_CSS = `
@keyframes wp-fadein {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes wp-spin {
  to { transform: rotate(360deg); }
}

#worthly-panel {
  position: fixed;
  bottom: 80px;
  right: 24px;
  width: 380px;
  max-height: 80vh;
  overflow-y: auto;
  background: #ffffff;
  border: 0.5px solid #e7e5e4;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  padding: 20px;
  z-index: 999998;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  animation: wp-fadein 0.15s ease forwards;
  scrollbar-width: thin;
  scrollbar-color: #e7e5e4 transparent;
}

.wp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.wp-brand { display: flex; align-items: center; gap: 6px; }
.wp-brand-text { font-size: 14px; font-weight: 500; color: #1c1917; }
.wp-close {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border: none; background: none;
  border-radius: 6px; cursor: pointer; color: #a8a29e;
  transition: background 0.1s, color 0.1s; flex-shrink: 0;
}
.wp-close:hover { background: #f5f5f4; color: #57534e; }

.wp-verdict-row { margin-bottom: 8px; }
.wp-verdict-pill {
  display: inline-block; font-size: 16px; font-weight: 500;
  padding: 6px 14px; border-radius: 999px; letter-spacing: 0.02em;
}
.wp-recommendation {
  display: inline-block; font-size: 11px; font-weight: 600;
  padding: 3px 8px; border-radius: 4px; background: #f5f5f4;
  color: #78716c; text-transform: uppercase; letter-spacing: 0.06em;
  margin-left: 6px; vertical-align: middle;
}
.wp-confidence {
  font-size: 11px; color: #a8a29e; margin-top: 4px;
}
.wp-headline {
  font-size: 15px; font-weight: 500; color: #1c1917;
  line-height: 1.45; margin-bottom: 14px;
}

.wp-reasons-label {
  font-size: 11px; color: #a8a29e; text-transform: uppercase;
  letter-spacing: 0.06em; margin-bottom: 10px;
}
.wp-reasons { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
.wp-reason  { display: flex; align-items: flex-start; gap: 10px; }
.wp-reason-dot {
  flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%;
  background: hsl(32,95%,54%); margin-top: 4px;
}
.wp-reason-body { display: flex; flex-direction: column; gap: 2px; }
.wp-reason-label { font-size: 13px; font-weight: 500; color: #1c1917; }
.wp-reason-detail { font-size: 13px; color: #78716c; line-height: 1.5; margin: 0; }

.wp-scores {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 6px; margin-bottom: 16px;
}
.wp-score {
  display: flex; flex-direction: column; align-items: center;
  background: #fafaf9; border-radius: 8px; padding: 8px 4px; gap: 2px;
}
.wp-score-label { font-size: 10px; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.04em; }
.wp-score-value { font-size: 18px; font-weight: 500; color: #1c1917; }

/* ── Accordion sections ─────────────────────────────────────────────────────── */
.wp-section { border-top: 0.5px solid #f0eeec; margin-top: 4px; }
.wp-section-toggle {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0; background: none; border: none; cursor: pointer;
  font-size: 12px; font-weight: 600; color: #57534e;
  text-transform: uppercase; letter-spacing: 0.06em; text-align: left;
}
.wp-section-toggle:hover { color: #1c1917; }
.wp-chevron {
  width: 14px; height: 14px; transition: transform 0.18s ease; flex-shrink: 0;
  color: #a8a29e;
}
.wp-section-body { padding-bottom: 12px; display: none; }
.wp-section-body.open { display: block; }

/* Why People Buy */
.wp-buy-reasons { display: flex; flex-direction: column; gap: 8px; }
.wp-buy-reason { display: flex; align-items: flex-start; gap: 8px; }
.wp-buy-dot { flex-shrink:0; width:6px; height:6px; border-radius:50%; background:hsl(140,50%,50%); margin-top:5px; }
.wp-buy-text { font-size:13px; color:#1c1917; line-height:1.45; }
.wp-buy-freq { font-size:11px; color:#a8a29e; margin-top:1px; }

/* Hidden Concerns */
.wp-concerns { display: flex; flex-direction: column; gap: 8px; }
.wp-concern { display: flex; align-items: flex-start; gap: 8px; }
.wp-concern-dot { flex-shrink:0; width:6px; height:6px; border-radius:50%; margin-top:5px; }
.wp-concern-text { font-size:13px; color:#1c1917; line-height:1.45; }
.wp-concern-sev { font-size:11px; font-weight:500; margin-top:1px; }

/* Review Reliability */
.wp-reliability-badge {
  display: inline-block; font-size: 12px; font-weight: 600;
  padding: 3px 10px; border-radius: 4px; background: #f5f5f4; margin-bottom: 6px;
}
.wp-reliability-text { font-size: 13px; color: #78716c; line-height: 1.5; }

/* Community / Expert */
.wp-consensus-block { display: flex; flex-direction: column; gap: 6px; }
.wp-consensus-row { display: flex; flex-direction: column; gap: 2px; }
.wp-consensus-key { font-size:11px; color:#a8a29e; text-transform:uppercase; letter-spacing:0.05em; }
.wp-consensus-val { font-size:13px; color:#1c1917; line-height:1.5; }
.wp-consensus-source { font-size:11px; color:#a8a29e; margin-top:2px; font-style:italic; }

/* Alternatives */
.wp-alts { display: flex; flex-direction: column; gap: 10px; }
.wp-alt { background:#fafaf9; border-radius:8px; padding:10px; }
.wp-alt-type { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; color:#a8a29e; margin-bottom:3px; }
.wp-alt-name { font-size:13px; font-weight:500; color:#1c1917; }
.wp-alt-reason { font-size:12px; color:#78716c; margin-top:2px; line-height:1.4; }

/* Price Intelligence */
.wp-price-rec {
  display: inline-block; font-size: 12px; font-weight: 700;
  padding: 4px 10px; border-radius: 4px; background: #f5f5f4; margin-bottom: 8px;
}
.wp-price-analysis { font-size: 13px; color: #1c1917; line-height: 1.5; margin-bottom: 6px; }
.wp-price-reason { font-size: 12px; color: #78716c; line-height: 1.45; }

/* Who Should Buy / Avoid */
.wp-profiles { display: flex; flex-direction: column; gap: 6px; }
.wp-profile { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: #1c1917; line-height: 1.45; }
.wp-profile-dot { flex-shrink:0; width:6px; height:6px; border-radius:50%; margin-top:5px; }

/* Loading / Error */
.wp-loading {
  display: flex; flex-direction: column; align-items: flex-start;
  gap: 12px; padding: 4px 0 8px;
}
.wp-spinner {
  width: 20px; height: 20px; border: 2.5px solid #e7e5e4;
  border-top-color: hsl(32,95%,54%); border-radius: 50%;
  animation: wp-spin 0.7s linear infinite;
}
.wp-loading-text { font-size: 13px; color: #78716c; line-height: 1.5; }
.wp-error { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; padding: 4px 0 8px; }
.wp-error-text { font-size: 13px; color: #78716c; line-height: 1.5; }
.wp-retry {
  font-size: 13px; font-weight: 500; color: #1c1917;
  background: #f5f5f4; border: 0.5px solid #e7e5e4; border-radius: 6px;
  padding: 6px 14px; cursor: pointer; transition: background 0.1s;
}
.wp-retry:hover { background: #e7e5e4; }
`;

// ── SVG helpers ────────────────────────────────────────────────────────────────

const W_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="hsl(32,95%,54%)"/><text x="8" y="12" text-anchor="middle" font-size="9" font-weight="800" font-family="system-ui,sans-serif" fill="white">W</text></svg>`;
const X_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const CHEVRON_DOWN = `<svg class="wp-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

// ── Accordion helper ──────────────────────────────────────────────────────────

function accordion(title: string, bodyHtml: string): string {
  return `
    <div class="wp-section">
      <button class="wp-section-toggle">
        ${title}
        ${CHEVRON_DOWN}
      </button>
      <div class="wp-section-body">${bodyHtml}</div>
    </div>`;
}

function bindAccordions(panel: HTMLElement): void {
  panel.querySelectorAll<HTMLButtonElement>('.wp-section-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const body = btn.nextElementSibling as HTMLElement | null;
      if (!body) return;
      const isOpen = body.classList.contains('open');
      body.classList.toggle('open', !isOpen);
      const chevron = btn.querySelector<SVGElement>('.wp-chevron');
      if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
    });
  });
}

// ── Panel state renderers ─────────────────────────────────────────────────────

function buildPanelShell(): HTMLDivElement {
  const panel = document.createElement('div');
  panel.id = 'worthly-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Worthly verdict');
  panel.innerHTML = `
    <div class="wp-header">
      <div class="wp-brand">${W_LOGO}<span class="wp-brand-text">Worthly verdict</span></div>
      <button class="wp-close" id="worthly-panel-close" aria-label="Close">${X_ICON}</button>
    </div>
    <div id="worthly-panel-body"></div>`;
  return panel;
}

function renderLoading(body: HTMLElement): void {
  body.innerHTML = `
    <div class="wp-loading">
      <div class="wp-spinner"></div>
      <p class="wp-loading-text">Researching this product across reviews and community discussions — usually 10–20 seconds.</p>
    </div>`;
}

function renderSuccess(body: HTMLElement, data: VerdictResponse): void {
  const vc = VERDICT_COLORS[data.verdict];

  // ── Core verdict ──────────────────────────────────────────────────────────
  const reasonsHtml = data.reasons.map(r => `
    <div class="wp-reason">
      <span class="wp-reason-dot"></span>
      <div class="wp-reason-body">
        <span class="wp-reason-label">${r.label}</span>
        <p class="wp-reason-detail">${r.detail}</p>
      </div>
    </div>`).join('');

  const scoresHtml = (Object.entries(data.scores) as [string, number][]).map(([key, val]) => `
    <div class="wp-score">
      <span class="wp-score-label">${key}</span>
      <span class="wp-score-value">${val}</span>
    </div>`).join('');

  const recBadge = data.recommendation
    ? `<span class="wp-recommendation">${data.recommendation}</span>`
    : '';
  const confLine = data.confidenceScore != null
    ? `<div class="wp-confidence">Confidence: ${data.confidenceScore}/100</div>`
    : '';

  // ── Why People Buy ────────────────────────────────────────────────────────
  const buyReasonsHtml = data.buyReasons?.length
    ? `<div class="wp-buy-reasons">${data.buyReasons.map(r => `
        <div class="wp-buy-reason">
          <span class="wp-buy-dot"></span>
          <div>
            <div class="wp-buy-text">${r.claim}</div>
            ${r.frequency ? `<div class="wp-buy-freq">${r.frequency}</div>` : ''}
          </div>
        </div>`).join('')}</div>`
    : '<p class="wp-reason-detail">No positive theme data available.</p>';

  // ── Hidden Concerns ───────────────────────────────────────────────────────
  const concernsHtml = data.hiddenConcerns?.length
    ? `<div class="wp-concerns">${data.hiddenConcerns.map(c => `
        <div class="wp-concern">
          <span class="wp-concern-dot" style="background:${SEVERITY_COLORS[c.severity] ?? '#a8a29e'}"></span>
          <div>
            <div class="wp-concern-text">${c.concern}</div>
            <div class="wp-concern-sev" style="color:${SEVERITY_COLORS[c.severity] ?? '#a8a29e'}">${c.severity.charAt(0).toUpperCase() + c.severity.slice(1)} severity</div>
          </div>
        </div>`).join('')}</div>`
    : '<p class="wp-reason-detail">No post-purchase concerns identified.</p>';

  // ── Review Reliability ────────────────────────────────────────────────────
  const reliabilityHtml = data.reviewReliability
    ? `<span class="wp-reliability-badge" style="color:${RELIABILITY_COLORS[data.reviewReliability.rating] ?? '#78716c'}">${data.reviewReliability.rating} Reliability</span>
       <p class="wp-reliability-text">${data.reviewReliability.explanation}</p>`
    : '<p class="wp-reason-detail">Review reliability unknown.</p>';

  // ── Community Consensus ───────────────────────────────────────────────────
  const communityHtml = data.communityConsensus
    ? `<div class="wp-consensus-block">
        <div class="wp-consensus-row">
          <span class="wp-consensus-key">Sentiment</span>
          <span class="wp-consensus-val">${data.communityConsensus.summary}</span>
        </div>
        <div class="wp-consensus-row">
          <span class="wp-consensus-key">Long-term owners</span>
          <span class="wp-consensus-val">${data.communityConsensus.longTermSentiment}</span>
        </div>
        ${data.communityConsensus.commonRegrets ? `
        <div class="wp-consensus-row">
          <span class="wp-consensus-key">Common regrets</span>
          <span class="wp-consensus-val">${data.communityConsensus.commonRegrets}</span>
        </div>` : ''}
        <div class="wp-consensus-source">Source: ${data.communityConsensus.dataSource}</div>
      </div>`
    : '<p class="wp-reason-detail">No community data available.</p>';

  // ── Expert Consensus ──────────────────────────────────────────────────────
  const expertHtml = data.expertConsensus
    ? `<div class="wp-consensus-block">
        <div class="wp-consensus-row">
          <span class="wp-consensus-val">${data.expertConsensus.summary}</span>
        </div>
        ${data.expertConsensus.disagreements ? `
        <div class="wp-consensus-row">
          <span class="wp-consensus-key">Disagreements</span>
          <span class="wp-consensus-val">${data.expertConsensus.disagreements}</span>
        </div>` : ''}
        <div class="wp-consensus-source">Source: ${data.expertConsensus.dataSource}</div>
      </div>`
    : '<p class="wp-reason-detail">No expert review data available.</p>';

  // ── Alternatives ──────────────────────────────────────────────────────────
  const alts = data.alternatives;
  const altsHtml = alts && (alts.betterValue || alts.premium || alts.budget)
    ? `<div class="wp-alts">
        ${alts.betterValue ? `<div class="wp-alt">
          <div class="wp-alt-type">Better Value</div>
          <div class="wp-alt-name">${alts.betterValue.name}</div>
          <div class="wp-alt-reason">${alts.betterValue.reason}</div>
        </div>` : ''}
        ${alts.premium ? `<div class="wp-alt">
          <div class="wp-alt-type">Premium Pick</div>
          <div class="wp-alt-name">${alts.premium.name}</div>
          <div class="wp-alt-reason">${alts.premium.reason}</div>
        </div>` : ''}
        ${alts.budget ? `<div class="wp-alt">
          <div class="wp-alt-type">Budget Option</div>
          <div class="wp-alt-name">${alts.budget.name}</div>
          <div class="wp-alt-reason">${alts.budget.reason}</div>
        </div>` : ''}
      </div>`
    : '<p class="wp-reason-detail">No alternative recommendations available.</p>';

  // ── Price Intelligence ────────────────────────────────────────────────────
  const priceHtml = data.priceIntelligence
    ? `<span class="wp-price-rec" style="color:${PRICE_REC_COLORS[data.priceIntelligence.recommendation] ?? '#57534e'}">${data.priceIntelligence.recommendation}</span>
       <p class="wp-price-analysis">${data.priceIntelligence.analysis}</p>
       <p class="wp-price-reason">${data.priceIntelligence.reasoning}</p>`
    : '<p class="wp-reason-detail">No price history data available.</p>';

  // ── Who Should Buy / Avoid ────────────────────────────────────────────────
  const dotColor = (color: string) => `<span class="wp-profile-dot" style="background:${color}"></span>`;
  const whoShouldBuyHtml = data.whoShouldBuy?.length
    ? `<div class="wp-profiles">${data.whoShouldBuy.map(p =>
        `<div class="wp-profile">${dotColor('hsl(140,50%,50%)')}${p}</div>`).join('')}</div>`
    : '<p class="wp-reason-detail">No buyer profile data.</p>';
  const whoShouldAvoidHtml = data.whoShouldAvoid?.length
    ? `<div class="wp-profiles">${data.whoShouldAvoid.map(p =>
        `<div class="wp-profile">${dotColor('hsl(0,60%,50%)')}${p}</div>`).join('')}</div>`
    : '<p class="wp-reason-detail">No avoidance profile data.</p>';

  // ── Assemble ──────────────────────────────────────────────────────────────
  body.innerHTML = `
    <div class="wp-verdict-row">
      <span class="wp-verdict-pill" style="background:${vc.bg};color:${vc.color}">${data.verdict.toUpperCase()}</span>
      ${recBadge}
    </div>
    ${confLine}
    <p class="wp-headline">${data.headline}</p>
    <p class="wp-reasons-label">Why this verdict</p>
    <div class="wp-reasons">${reasonsHtml}</div>
    <div class="wp-scores">${scoresHtml}</div>
    ${accordion('Why people buy it', buyReasonsHtml)}
    ${accordion('Hidden concerns', concernsHtml)}
    ${accordion('Review reliability', reliabilityHtml)}
    ${accordion('Community consensus', communityHtml)}
    ${accordion('Expert consensus', expertHtml)}
    ${accordion('Alternatives', altsHtml)}
    ${accordion('Price intelligence', priceHtml)}
    ${accordion('Who should buy this', whoShouldBuyHtml)}
    ${accordion('Who should avoid this', whoShouldAvoidHtml)}`;

  bindAccordions(body);
}

function renderError(body: HTMLElement, onRetry: () => void): void {
  body.innerHTML = `
    <div class="wp-error">
      <p class="wp-error-text">Couldn't generate a verdict right now. Try again in a moment.</p>
      <button class="wp-retry" id="worthly-retry">Retry</button>
    </div>`;
  body.querySelector('#worthly-retry')!.addEventListener('click', onRetry);
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function showVerdictPanel(asin: string, url: string, container: ShadowRoot, scraped?: ScrapedProductData): void {
  if (container.querySelector('#worthly-panel')) return;

  if (!container.querySelector('#worthly-panel-style')) {
    const style = document.createElement('style');
    style.id = 'worthly-panel-style';
    style.textContent = PANEL_CSS;
    container.appendChild(style);
  }

  const panel = buildPanelShell();
  container.appendChild(panel);
  const body = panel.querySelector('#worthly-panel-body') as HTMLElement;

  let closing = false;

  function closePanel(): void {
    if (closing) return;
    closing = true;
    panel.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(8px)';
    setTimeout(() => panel.remove(), 150);
    document.removeEventListener('click', handleOutsideClick, true);
    document.removeEventListener('keydown', handleEscape);
  }

  function handleOutsideClick(e: MouseEvent): void {
    const host = document.getElementById('worthly-host');
    if (host && !host.contains(e.target as Node)) closePanel();
  }

  function handleEscape(e: KeyboardEvent): void {
    if (e.key === 'Escape') closePanel();
  }

  const closeBtn = panel.querySelector('#worthly-panel-close') as HTMLButtonElement;
  closeBtn.addEventListener('click', closePanel);

  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick, true);
    document.addEventListener('keydown', handleEscape);
  }, 0);

  function doFetch(): void {
    renderLoading(body);
    fetchVerdict(url, scraped)
      .then((data) => {
        setCachedVerdict(asin, data);
        renderSuccess(body, data);
      })
      .catch(() => {
        renderError(body, doFetch);
      });
  }

  const cached = getCachedVerdict(asin);
  if (cached) {
    renderSuccess(body, cached);
  } else {
    doFetch();
  }
}
