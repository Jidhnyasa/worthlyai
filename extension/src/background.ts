import { API_BASE_URL } from './api';

interface FetchVerdictMessage {
  type: 'fetch-verdict';
  url: string;
}

chrome.runtime.onMessage.addListener(
  (message: FetchVerdictMessage, _sender, sendResponse) => {
    if (message.type !== 'fetch-verdict') return false;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);

    fetch(`${API_BASE_URL}/api/verdict/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: message.url }),
      signal: controller.signal,
    })
      .then(async (res) => {
        clearTimeout(timer);
        if (!res.ok) {
          const text = await res.text().catch(() => res.statusText);
          sendResponse({ error: text });
        } else {
          const data = await res.json();
          sendResponse({ data });
        }
      })
      .catch((err: Error) => {
        clearTimeout(timer);
        sendResponse({ error: err.message ?? 'Network error' });
      });

    return true;
  }
);
