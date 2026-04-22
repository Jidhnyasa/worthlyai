// Worthly Extension — Background Service Worker
// Handles API communication and cross-tab state management.

const API_BASE = "http://localhost:5000"; // switch to https://worthly.ai for production

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function getAuth() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["worthlyUserId", "worthlySessionId"], resolve);
  });
}

function authHeaders(auth) {
  const h = { "Content-Type": "application/json" };
  if (auth.worthlyUserId)   h["x-user-id"]    = auth.worthlyUserId;
  if (auth.worthlySessionId) h["x-session-id"] = auth.worthlySessionId;
  return h;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function saveProductToAPI(product) {
  const auth = await getAuth();
  const res = await fetch(`${API_BASE}/api/detected-products`, {
    method: "POST",
    headers: authHeaders(auth),
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function fetchSavedProducts() {
  const auth = await getAuth();
  const res = await fetch(`${API_BASE}/api/detected-products`, {
    headers: authHeaders(auth),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ─── Per-tab product cache ─────────────────────────────────────────────────────
// Stores the last detected product + verdict for each tab.
const tabCache = new Map();

// ─── Message router ────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  switch (message.type) {
    case "PRODUCT_DETECTED": {
      if (tabId) tabCache.set(tabId, message.data);
      sendResponse({ ok: true });
      break;
    }

    case "GET_TAB_PRODUCT": {
      // Popup asks for cached product for a specific tab.
      const data = tabCache.get(message.tabId);
      sendResponse({ product: data ?? null });
      break;
    }

    case "SAVE_PRODUCT": {
      saveProductToAPI(message.product)
        .then((saved) => sendResponse({ ok: true, saved }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true; // keep channel open for async response
    }

    case "GET_SAVED_PRODUCTS": {
      fetchSavedProducts()
        .then((items) => sendResponse({ ok: true, items }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true;
    }

    case "SET_AUTH": {
      chrome.storage.local.set({
        worthlyUserId:    message.userId,
        worthlySessionId: message.sessionId,
      }, () => sendResponse({ ok: true }));
      return true;
    }

    case "GET_AUTH": {
      getAuth().then((auth) => sendResponse(auth));
      return true;
    }

    case "CLEAR_AUTH": {
      chrome.storage.local.remove(["worthlyUserId", "worthlySessionId"], () =>
        sendResponse({ ok: true })
      );
      return true;
    }
  }
});

// Clean up tab cache when a tab closes.
chrome.tabs.onRemoved.addListener((tabId) => {
  tabCache.delete(tabId);
});
