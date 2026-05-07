import { fetchVerdict, type VerdictResponse } from './api';
import { getCachedVerdict, setCachedVerdict } from './cache';

// ── Verdict color tokens ───────────────────────────────────────────────────────

type Verdict = 'buy' | 'wait' | 'skip';

const VERDICT_COLORS: Record<Verdict, { bg: string; color: string }> = {
  wait: { bg: 'hsl(40 90% 92%)',  color: 'hsl(40 60% 30%)' },
  buy:  { bg: 'hsl(140 50% 90%)', color: 'hsl(140 60% 25%)' },
  skip: { bg: 'hsl(0 70% 92%)',   color: 'hsl(0 60% 35%)' },
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
  width: 360px;
  max-height: 70vh;
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
}

.wp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.wp-brand {
  display: flex;
  align-items: center;
  gap: 6px;
}
.wp-brand-text {
  font-size: 14px;
  font-weight: 500;
  color: #1c1917;
}
.wp-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  color: #a8a29e;
  transition: background 0.1s, color 0.1s;
  flex-shrink: 0;
}
.wp-close:hover { background: #f5f5f4; color: #57534e; }

.wp-verdict-row { margin-bottom: 10px; }
.wp-verdict-pill {
  display: inline-block;
  font-size: 16px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 999px;
  letter-spacing: 0.02em;
}
.wp-headline {
  font-size: 15px;
  font-weight: 500;
  color: #1c1917;
  line-height: 1.45;
  margin-bottom: 14px;
}
.wp-reasons-label {
  font-size: 11px;
  color: #a8a29e;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
}
.wp-reasons { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
.wp-reason  { display: flex; align-items: flex-start; gap: 10px; }
.wp-reason-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: hsl(32,95%,54%);
  margin-top: 4px;
}
.wp-reason-body { display: flex; flex-direction: column; gap: 2px; }
.wp-reason-label { font-size: 13px; font-weight: 500; color: #1c1917; }
.wp-reason-detail { font-size: 13px; color: #78716c; line-height: 1.5; margin: 0; }

.wp-scores {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.wp-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fafaf9;
  border-radius: 8px;
  padding: 8px 4px;
  gap: 2px;
}
.wp-score-label { font-size: 10px; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.04em; }
.wp-score-value { font-size: 18px; font-weight: 500; color: #1c1917; }

.wp-loading {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 4px 0 8px;
}
.wp-spinner {
  width: 20px;
  height: 20px;
  border: 2.5px solid #e7e5e4;
  border-top-color: hsl(32,95%,54%);
  border-radius: 50%;
  animation: wp-spin 0.7s linear infinite;
}
.wp-loading-text {
  font-size: 13px;
  color: #78716c;
  line-height: 1.5;
}
.wp-error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 4px 0 8px;
}
.wp-error-text {
  font-size: 13px;
  color: #78716c;
  line-height: 1.5;
}
.wp-retry {
  font-size: 13px;
  font-weight: 500;
  color: #1c1917;
  background: #f5f5f4;
  border: 0.5px solid #e7e5e4;
  border-radius: 6px;
  padding: 6px 14px;
  cursor: pointer;
  transition: background 0.1s;
}
.wp-retry:hover { background: #e7e5e4; }
`;

// ── SVG helpers ────────────────────────────────────────────────────────────────

const W_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="hsl(32,95%,54%)"/><text x="8" y="12" text-anchor="middle" font-size="9" font-weight="800" font-family="system-ui,sans-serif" fill="white">W</text></svg>`;

const X_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

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
      <p class="wp-loading-text">Reading the page and generating a verdict — usually 5–15 seconds.</p>
    </div>`;
}

function renderSuccess(body: HTMLElement, data: VerdictResponse): void {
  const vc = VERDICT_COLORS[data.verdict];
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
  body.innerHTML = `
    <div class="wp-verdict-row">
      <span class="wp-verdict-pill" style="background:${vc.bg};color:${vc.color}">${data.verdict.toUpperCase()}</span>
    </div>
    <p class="wp-headline">${data.headline}</p>
    <p class="wp-reasons-label">Why this verdict</p>
    <div class="wp-reasons">${reasonsHtml}</div>
    <div class="wp-scores">${scoresHtml}</div>`;
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

export function showVerdictPanel(asin: string, url: string, container: ShadowRoot): void {
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
    fetchVerdict(url)
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
