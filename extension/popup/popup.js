// Worthly Extension — Popup Script

const DASHBOARD_URL = "http://localhost:5000"; // update to production URL when deploying
const SETTINGS_URL  = `${DASHBOARD_URL}/settings`;

const VERDICT_CONFIG = {
  buy: {
    word: "BUY",
    sub:  "Confident purchase — good value",
    bannerClass: "buy",
    ringClass: "buy",
    textColor: "#15803d",
    icon: "✓",
  },
  wait: {
    word: "WAIT",
    sub:  "Some hesitation — do more research",
    bannerClass: "wait",
    ringClass: "wait",
    textColor: "#92400e",
    icon: "◎",
  },
  skip: {
    word: "SKIP",
    sub:  "Not recommended right now",
    bannerClass: "skip",
    ringClass: "skip",
    textColor: "#991b1b",
    icon: "✕",
  },
};

// ─── View management ──────────────────────────────────────────────────────────

const VIEWS = ["view-loading", "view-connect", "view-unsupported", "view-product"];

function showView(id) {
  VIEWS.forEach((v) => {
    const el = document.getElementById(v);
    if (el) el.hidden = v !== id;
  });
}

// ─── Render product view ───────────────────────────────────────────────────────

function renderProduct(product) {
  const { verdict, score, reasons, title, price, merchant, image, url, rating, reviewCount } = product;
  const cfg = VERDICT_CONFIG[verdict] ?? VERDICT_CONFIG.wait;

  // Image
  const imgWrap = document.getElementById("product-image-wrap");
  const imgEl   = document.getElementById("product-image");
  if (image) {
    imgEl.src = image;
    imgEl.onerror = () => { imgWrap.hidden = true; };
    imgWrap.hidden = false;
  }

  // Title
  document.getElementById("product-title").textContent =
    (title || "Unknown product").slice(0, 120);

  // Merchant chip
  document.getElementById("product-merchant").textContent = merchant ?? "";
  document.getElementById("page-merchant-name").textContent = merchant ?? "page";

  // Price
  const priceEl = document.getElementById("product-price");
  if (price != null) {
    priceEl.textContent = `$${Number(price).toFixed(2)}`;
    priceEl.hidden = false;
  }

  // Verdict banner
  const banner = document.getElementById("verdict-banner");
  banner.className = `verdict-banner ${cfg.bannerClass}`;

  document.getElementById("verdict-label").textContent  = cfg.word;
  document.getElementById("verdict-label").style.color  = cfg.textColor;
  document.getElementById("verdict-sub").textContent    = cfg.sub;

  // Score ring — set custom property + class
  const ring = document.getElementById("score-ring");
  ring.className = `score-ring ${cfg.ringClass}`;
  ring.style.setProperty("--pct", String(score ?? 0));
  document.getElementById("score-value").textContent = String(score ?? "—");

  // Reasons
  const ul = document.getElementById("verdict-reasons");
  ul.innerHTML = "";
  (reasons || []).forEach((r) => {
    const li   = document.createElement("li");
    const icon = document.createElement("span");
    icon.className = "reason-icon";
    icon.style.color = cfg.textColor;
    icon.textContent = cfg.icon;
    li.appendChild(icon);
    li.appendChild(document.createTextNode(r));
    ul.appendChild(li);
  });

  // Rating row
  const ratingRow = document.getElementById("rating-row");
  if (rating != null || reviewCount != null) {
    if (rating != null) {
      const starsEl = document.getElementById("rating-stars");
      const full  = Math.floor(rating);
      const half  = rating - full >= 0.5;
      starsEl.textContent = "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - (half ? 1 : 0));
    }
    if (reviewCount != null) {
      document.getElementById("rating-count").textContent =
        `${reviewCount >= 1000 ? (reviewCount / 1000).toFixed(reviewCount >= 10000 ? 0 : 1) + "K" : reviewCount} reviews`;
    }
    ratingRow.hidden = false;
  }

  // Product page link
  if (url) document.getElementById("open-page").href = url;
  else      document.getElementById("open-page").style.display = "none";

  showView("view-product");
}

// ─── Save handler ─────────────────────────────────────────────────────────────

let isSaved = false;

function setupSaveButton(product) {
  const btn      = document.getElementById("save-btn");
  const btnText  = document.getElementById("save-btn-text");
  const statusEl = document.getElementById("save-status");

  btn.addEventListener("click", () => {
    if (isSaved || btn.disabled) return;
    btn.disabled  = true;
    btnText.textContent = "Saving…";

    chrome.runtime.sendMessage({
      type: "SAVE_PRODUCT",
      product: {
        title:               product.title,
        merchant:            product.merchant,
        productUrl:          product.url,
        imageUrl:            product.image,
        price:               product.price,
        detectedRating:      product.rating,
        detectedReviewCount: product.reviewCount,
        verdict:             product.verdict,
        verdictScore:        product.score,
        verdictReasonJson:   product.reasons,
      },
    }, (res) => {
      if (chrome.runtime.lastError) {
        btn.disabled = false;
        btnText.textContent = "Save to Worthly";
        statusEl.textContent = "Extension error — try reloading.";
        return;
      }
      if (res?.ok) {
        isSaved = true;
        btn.classList.add("saved");
        btnText.textContent = "✓ Saved to Worthly";
        statusEl.textContent = "Product saved to your dashboard.";
      } else {
        btn.disabled = false;
        btnText.textContent = "Save to Worthly";
        statusEl.textContent = res?.error
          ? `Error: ${res.error}`
          : "Not connected to server — check that Worthly is running.";
      }
    });
  });
}

// ─── Connect flow ─────────────────────────────────────────────────────────────

function setupConnectFlow() {
  const input = document.getElementById("session-id-input");
  const btn   = document.getElementById("connect-btn");

  btn.addEventListener("click", async () => {
    const userId = input.value.trim();
    if (!userId) { input.focus(); return; }

    btn.disabled      = true;
    btn.textContent   = "Connecting…";

    chrome.runtime.sendMessage(
      { type: "SET_AUTH", userId, sessionId: userId },
      () => {
        if (chrome.runtime.lastError) {
          btn.disabled    = false;
          btn.textContent = "Connect account";
          return;
        }
        window.location.reload();
      }
    );
  });

  // Allow pressing Enter in the input
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btn.click();
  });

  document.getElementById("open-settings").href = SETTINGS_URL;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  // Wire up static links
  document.getElementById("open-dashboard").href = DASHBOARD_URL;
  document.getElementById("open-dashboard-2").href = DASHBOARD_URL;

  setupConnectFlow();
  showView("view-loading");

  // Check auth
  let auth;
  try {
    auth = await new Promise((resolve) =>
      chrome.runtime.sendMessage({ type: "GET_AUTH" }, resolve)
    );
  } catch {
    auth = {};
  }

  if (!auth?.worthlyUserId) {
    showView("view-connect");
    return;
  }

  // Get active tab
  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch {
    showView("view-unsupported");
    return;
  }

  if (!tab?.id) {
    showView("view-unsupported");
    return;
  }

  // Ask background for cached product data
  let res;
  try {
    res = await new Promise((resolve) =>
      chrome.runtime.sendMessage({ type: "GET_TAB_PRODUCT", tabId: tab.id }, resolve)
    );
  } catch {
    showView("view-unsupported");
    return;
  }

  if (!res?.product?.title) {
    showView("view-unsupported");
    return;
  }

  renderProduct(res.product);
  setupSaveButton(res.product);
}

document.addEventListener("DOMContentLoaded", init);
