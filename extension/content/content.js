// Worthly Extension — Content Script
// Extracts product data and injects a polished floating verdict widget.
// Uses Shadow DOM for full CSS isolation from the host page.

(function () {
  "use strict";

  if (window.__worthlyInjected) return;
  window.__worthlyInjected = true;

  // ─── Utilities ────────────────────────────────────────────────────────────────

  function $q(selector, root) {
    return (root || document).querySelector(selector);
  }
  function text(selector, root) {
    return $q(selector, root)?.textContent?.trim() ?? null;
  }
  function attr(selector, attribute, root) {
    return $q(selector, root)?.getAttribute(attribute) ?? null;
  }
  function parsePrice(str) {
    if (str == null) return null;
    const n = parseFloat(str.replace(/[^0-9.]/g, ""));
    return isNaN(n) ? null : n;
  }
  function parseRating(str) {
    if (str == null) return null;
    const n = parseFloat(str);
    return isNaN(n) || n > 5 ? null : n;
  }
  function parseReviews(str) {
    if (str == null) return null;
    const n = parseInt(str.replace(/[^0-9]/g, ""));
    return isNaN(n) ? null : n;
  }

  // ─── Page extractors ─────────────────────────────────────────────────────────

  const EXTRACTORS = {
    amazon: {
      test: () => /amazon\.(com|co\.uk|ca|de|fr|es|it|jp|in|com\.au)/.test(location.hostname),
      extract() {
        // Title — multiple fallbacks for different page formats
        const title =
          text("#productTitle") ||
          text("#title span.a-size-large") ||
          text("h1.a-size-large span") ||
          text("#dp-container h1") ||
          null;

        // Price — cascade through known price containers
        let price = null;
        const whole = $q(".a-price-whole");
        const frac  = $q(".a-price-fraction");
        if (whole) {
          price = parsePrice(`${whole.textContent.replace(/[^0-9]/g, "")}.${frac?.textContent.replace(/[^0-9]/g, "") || "00"}`);
        }
        price ??= parsePrice(attr("#priceblock_ourprice,#priceblock_dealprice,#price_inside_buybox,#tp_price_block_total_price_ww .a-offscreen,.a-price .a-offscreen", "textContent") || text("#priceblock_ourprice,#priceblock_dealprice,#price_inside_buybox"));

        // Rating from popover title attr (most reliable)
        const ratingText = attr("#acrPopover", "title") || text(".a-icon-star-small .a-icon-alt");
        const rating = parseRating(ratingText);

        // Review count
        const reviewCount = parseReviews(text("#acrCustomerReviewText") || attr("[data-hook='total-review-count']", "textContent"));

        // Image — prefer high-res
        const image =
          attr("#landingImage", "data-old-hires") ||
          attr("#landingImage", "src") ||
          attr("#imgBlkFront", "src") ||
          attr("#main-image-container img", "src") ||
          null;

        // Brand
        const brand = text("#bylineInfo") || text(".po-brand .a-span9") || null;

        return { title, price, rating, reviewCount, image, brand, merchant: "Amazon" };
      },
    },

    target: {
      test: () => /target\.com/.test(location.hostname),
      extract() {
        const title =
          text("h1[data-test='product-title']") ||
          text("[data-test='product-title'] h1") ||
          text("h1") ||
          null;

        const priceText =
          text("[data-test='product-price']") ||
          text("[class*='CurrentPriceFinal']") ||
          attr("[data-test='product-price'] span", "aria-label") ||
          null;
        const price = parsePrice(priceText);

        // Target uses star ratings as text "4.8 out of 5 stars"
        const ratingText = attr("[data-test='ratings']", "aria-label") || text("[data-test='ratings'] span");
        const rating = ratingText ? parseRating(ratingText.split(" ")[0]) : null;

        const reviewText =
          text("[data-test='ratings-count']") ||
          text("[data-test='review-count']") ||
          null;
        const reviewCount = parseReviews(reviewText);

        const image =
          attr("[data-test='product-image'] picture img", "src") ||
          attr("[class*='ProductDetail'] img", "src") ||
          null;

        return { title, price, rating, reviewCount, image, brand: null, merchant: "Target" };
      },
    },

    walmart: {
      test: () => /walmart\.com/.test(location.hostname),
      extract() {
        const title =
          text("[itemprop='name']") ||
          text("[data-testid='product-title']") ||
          text("h1.dark-gray") ||
          text("h1") ||
          null;

        const priceText =
          attr("[itemprop='price']", "content") ||
          text("[data-testid='price-wrap'] .inline-flex span.f2") ||
          text("[class*='PriceDisplay'] [class*='price-characteristic']") ||
          null;
        const price = parsePrice(priceText);

        const ratingEl = $q("[data-testid='reviews-and-ratings'] [class*='f7'], [itemprop='ratingValue']");
        const rating = ratingEl ? parseRating(ratingEl.getAttribute("content") || ratingEl.textContent) : null;

        const reviewText =
          text("[itemprop='reviewCount']") ||
          text("[data-testid='reviews-and-ratings'] a") ||
          null;
        const reviewCount = parseReviews(reviewText);

        const image =
          attr("[data-testid='hero-image-container'] img", "src") ||
          attr("[class*='heroImage'] img", "src") ||
          null;

        return { title, price, rating, reviewCount, image, brand: null, merchant: "Walmart" };
      },
    },

    shopify: {
      test() {
        return (
          /myshopify\.com/.test(location.hostname) ||
          !!$q("[data-product-id]") ||
          !!$q("product-form") ||
          /\/products\//.test(location.pathname)
        );
      },
      extract() {
        const title =
          text("h1.product-single__title") ||
          text("h1.product__title") ||
          text(".product-title h1") ||
          text("h1") ||
          null;

        const priceText =
          attr("[data-product-price]", "textContent") ||
          text("[data-product-price]") ||
          text(".price .money") ||
          text(".product__price .money") ||
          text(".price-item--regular") ||
          null;
        const price = parsePrice(priceText);

        const image =
          attr(".product-single__media img", "src") ||
          attr(".product__media img", "src") ||
          attr(".product-featured-media img", "src") ||
          null;

        const fullImageUrl = image && image.startsWith("//") ? `https:${image}` : image;

        return { title, price, rating: null, reviewCount: null, image: fullImageUrl, brand: null, merchant: "Shopify" };
      },
    },
  };

  function detectExtractor() {
    return Object.values(EXTRACTORS).find((e) => {
      try { return e.test(); } catch { return false; }
    }) ?? null;
  }

  // ─── Verdict engine ───────────────────────────────────────────────────────────
  // Heuristic scoring — architecture is ready for AI upgrade via the API.

  function computeVerdict({ rating, reviewCount, price, merchant }) {
    let score = 48; // neutral baseline
    const reasons = [];

    // Rating signal (biggest factor)
    if (rating != null) {
      if (rating >= 4.7)      { score += 25; reasons.push(`Outstanding ${rating}★ rating`); }
      else if (rating >= 4.4) { score += 18; reasons.push(`Strong ${rating}★ customer rating`); }
      else if (rating >= 4.0) { score += 10; reasons.push(`Good ${rating}★ rating`); }
      else if (rating >= 3.5) { score -= 5;  reasons.push("Mixed reviews — read before buying"); }
      else if (rating >= 2.5) { score -= 18; reasons.push("Below-average rating"); }
      else                    { score -= 28; reasons.push("Poor rating — consider alternatives"); }
    } else {
      score -= 8;
      reasons.push("Rating not available — check reviews manually");
    }

    // Review volume signal
    if (reviewCount != null) {
      if (reviewCount >= 50000)      { score += 18; reasons.push(`${(reviewCount / 1000).toFixed(0)}K verified reviews`); }
      else if (reviewCount >= 10000) { score += 14; reasons.push(`${(reviewCount / 1000).toFixed(0)}K+ reviews — very well tested`); }
      else if (reviewCount >= 1000)  { score += 9;  reasons.push(`${reviewCount.toLocaleString()} reviews`); }
      else if (reviewCount >= 100)   { score += 4; }
      else if (reviewCount >= 10)    { /* neutral */ }
      else                           { score -= 8;  reasons.push("Very few reviews — limited data"); }
    }

    // Merchant trust
    const trustedMerchants = ["Amazon", "Target", "Walmart"];
    if (trustedMerchants.includes(merchant)) {
      score += 6;
      reasons.push(`${merchant} buyer protection included`);
    }

    // Price sanity
    if (price == null) {
      score -= 4;
      reasons.push("Price not detected — verify current pricing");
    }

    score = Math.max(0, Math.min(100, score));
    const verdict = score >= 68 ? "buy" : score >= 42 ? "wait" : "skip";
    return { verdict, score, reasons: reasons.slice(0, 3) };
  }

  // ─── Shadow DOM styles ────────────────────────────────────────────────────────

  const STYLES = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :host {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      font-size: 13px;
      line-height: 1.5;
      color: #1c1917;
    }

    /* ── Pill ──────────────────────────────────────────────────── */
    .pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px 8px 10px;
      background: #ffffff;
      border: 1px solid #e7e5e4;
      border-radius: 100px;
      box-shadow: 0 4px 16px -4px rgba(0,0,0,.14), 0 1px 4px -1px rgba(0,0,0,.08);
      cursor: pointer;
      transition: box-shadow 0.18s, transform 0.18s;
      white-space: nowrap;
      animation: worthly-in 0.3s cubic-bezier(.34,1.56,.64,1);
    }
    .pill:hover {
      box-shadow: 0 8px 24px -6px rgba(0,0,0,.18), 0 2px 6px -2px rgba(0,0,0,.10);
      transform: translateY(-1px);
    }

    .pill-logo {
      width: 20px;
      height: 20px;
      border-radius: 6px;
      background: hsl(32,95%,54%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .pill-logo svg { width: 12px; height: 12px; }

    .pill-verdict {
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: .5px;
    }
    .pill-score {
      font-size: 11px;
      font-weight: 600;
      color: #78716c;
    }
    .pill-arrow {
      font-size: 10px;
      color: #a8a29e;
      margin-left: 2px;
    }

    /* ── Card ──────────────────────────────────────────────────── */
    .card {
      width: 300px;
      background: #ffffff;
      border: 1px solid #e7e5e4;
      border-radius: 18px;
      box-shadow: 0 20px 60px -10px rgba(0,0,0,.18), 0 6px 20px -4px rgba(0,0,0,.10);
      overflow: hidden;
      display: none;
      flex-direction: column;
      animation: worthly-in 0.28s cubic-bezier(.34,1.56,.64,1);
    }
    .card.visible { display: flex; }

    /* ── Card header ── */
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 11px 14px 10px;
      border-bottom: 1px solid #f5f5f4;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .logo-icon {
      width: 22px;
      height: 22px;
      border-radius: 7px;
      background: hsl(32,95%,54%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-icon svg { width: 13px; height: 13px; }
    .logo-text {
      font-weight: 700;
      font-size: 13.5px;
      letter-spacing: -.2px;
    }
    .card-controls {
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 13px;
      color: #a8a29e;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      transition: background .15s, color .15s;
    }
    .btn-icon:hover { background: #f5f5f4; color: #57534e; }

    /* ── Product section ── */
    .product {
      padding: 12px 14px 11px;
      border-bottom: 1px solid #f5f5f4;
    }
    .product-img {
      width: 100%;
      max-height: 110px;
      object-fit: contain;
      border-radius: 10px;
      background: #fafaf9;
      border: 1px solid #f0f0ee;
      margin-bottom: 10px;
      display: block;
    }
    .product-meta {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }
    .product-text { flex: 1; min-width: 0; }
    .product-title {
      font-weight: 600;
      font-size: 12.5px;
      line-height: 1.4;
      color: #1c1917;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .product-price {
      font-weight: 800;
      font-size: 15px;
      color: #1c1917;
      margin-top: 2px;
    }
    .product-merchant {
      font-size: 10.5px;
      font-weight: 500;
      color: #a8a29e;
      margin-top: 1px;
    }

    /* ── Verdict section ── */
    .verdict-section {
      padding: 12px 14px 0;
    }
    .verdict-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .score-ring {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: conic-gradient(var(--ring-color, #e5e7eb) calc(var(--pct, 0) * 1%), #f0f0ee 0);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .score-inner {
      width: 39px;
      height: 39px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 800;
      color: #1c1917;
    }
    .verdict-info { flex: 1; }
    .verdict-word {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: .5px;
      line-height: 1;
    }
    .verdict-sub {
      font-size: 10.5px;
      color: #78716c;
      margin-top: 2px;
    }
    .reasons {
      padding: 0 0 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .reason {
      font-size: 11.5px;
      color: #57534e;
      display: flex;
      align-items: flex-start;
      gap: 5px;
      line-height: 1.4;
    }
    .reason-dot {
      flex-shrink: 0;
      font-size: 10px;
      margin-top: 2px;
    }

    /* ── Actions ── */
    .actions {
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 7px;
      border-top: 1px solid #f5f5f4;
    }
    .btn-save, .btn-open {
      display: block;
      width: 100%;
      padding: 9px 14px;
      border-radius: 10px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      border: none;
      transition: opacity .15s, background .2s;
    }
    .btn-save {
      background: hsl(32,95%,54%);
      color: #fff;
    }
    .btn-save:hover:not(:disabled) { opacity: .88; }
    .btn-save:disabled { opacity: .6; cursor: not-allowed; }
    .btn-save.saved { background: #16a34a; }
    .btn-open {
      background: none;
      border: 1px solid #e7e5e4;
      color: #78716c;
    }
    .btn-open:hover { background: #fafaf9; color: #292524; }

    /* ── Status line ── */
    .status-line {
      padding: 0 14px 10px;
      font-size: 11px;
      color: #a8a29e;
      text-align: center;
      min-height: 18px;
    }

    /* ── Animation ── */
    @keyframes worthly-in {
      from { opacity: 0; transform: translateY(10px) scale(.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;

  // ─── Widget builder ───────────────────────────────────────────────────────────

  const LOGO_SVG = `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 5L6 15L9 9L12 15L15 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const VERDICT_CONFIG = {
    buy:  { color: "#16a34a", ringColor: "#16a34a", word: "BUY",  sub: "Good value — confident purchase", dot: "✓" },
    wait: { color: "#b45309", ringColor: "#f59e0b", word: "WAIT", sub: "Some hesitation — do more research", dot: "◎" },
    skip: { color: "#dc2626", ringColor: "#ef4444", word: "SKIP", sub: "Not recommended at this time", dot: "✕" },
  };

  function buildWidget(product, verdict, score, reasons) {
    const host = document.createElement("div");
    host.id = "worthly-host";
    // Positioning lives on the host, not in shadow (shadow can't affect layout of children of body)
    host.style.cssText = [
      "position:fixed", "bottom:24px", "right:24px",
      "z-index:2147483647", "display:flex", "flex-direction:column",
      "align-items:flex-end", "gap:10px",
    ].join(";");

    const shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;
    shadow.appendChild(style);

    const cfg = VERDICT_CONFIG[verdict] ?? VERDICT_CONFIG.wait;
    const saved = { value: false };

    // ── Pill ──
    const pill = document.createElement("div");
    pill.className = "pill";
    pill.innerHTML = `
      <div class="pill-logo">${LOGO_SVG}</div>
      <span class="pill-verdict" style="color:${cfg.color}">${cfg.word}</span>
      <span class="pill-score">${score}/100</span>
      <span class="pill-arrow">›</span>
    `;

    // ── Card ──
    const priceStr = product.price != null ? `$${Number(product.price).toFixed(2)}` : "";
    const imgHtml  = product.image
      ? `<img class="product-img" src="${product.image}" alt="product image" onerror="this.style.display='none'" />`
      : "";

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header">
        <div class="logo">
          <div class="logo-icon">${LOGO_SVG}</div>
          <span class="logo-text">Worthly</span>
        </div>
        <div class="card-controls">
          <button class="btn-icon" id="w-collapse" title="Minimize">−</button>
          <button class="btn-icon" id="w-close" title="Dismiss">✕</button>
        </div>
      </div>

      <div class="product">
        ${imgHtml}
        <div class="product-meta">
          <div class="product-text">
            <p class="product-title">${product.title || "Unknown product"}</p>
            ${priceStr ? `<p class="product-price">${priceStr}</p>` : ""}
            <p class="product-merchant">${product.merchant}</p>
          </div>
        </div>
      </div>

      <div class="verdict-section">
        <div class="verdict-row">
          <div class="score-ring" style="--pct:${score};--ring-color:${cfg.ringColor}">
            <div class="score-inner">${score}</div>
          </div>
          <div class="verdict-info">
            <div class="verdict-word" style="color:${cfg.color}">${cfg.word}</div>
            <div class="verdict-sub">${cfg.sub}</div>
          </div>
        </div>
        <div class="reasons">
          ${reasons.map((r) => `
            <div class="reason">
              <span class="reason-dot" style="color:${cfg.color}">${cfg.dot}</span>
              <span>${r}</span>
            </div>`).join("")}
        </div>
      </div>

      <div class="actions">
        <button class="btn-save" id="w-save">Save to Worthly</button>
        <a class="btn-open" id="w-open" href="http://localhost:5000/saved" target="_blank" rel="noopener noreferrer">Open dashboard ↗</a>
      </div>
      <p class="status-line" id="w-status"></p>
    `;

    shadow.appendChild(card);
    shadow.appendChild(pill);

    // ── Event handlers ──

    pill.addEventListener("click", () => {
      pill.style.display = "none";
      card.classList.add("visible");
    });

    shadow.getElementById("w-collapse").addEventListener("click", () => {
      card.classList.remove("visible");
      pill.style.display = "";
    });

    shadow.getElementById("w-close").addEventListener("click", () => {
      host.remove();
    });

    shadow.getElementById("w-save").addEventListener("click", () => {
      if (saved.value) return;
      const btn    = shadow.getElementById("w-save");
      const status = shadow.getElementById("w-status");
      btn.disabled    = true;
      btn.textContent = "Saving…";

      chrome.runtime.sendMessage({
        type: "SAVE_PRODUCT",
        product: {
          title:               product.title,
          merchant:            product.merchant,
          productUrl:          location.href,
          imageUrl:            product.image,
          price:               product.price,
          detectedRating:      product.rating,
          detectedReviewCount: product.reviewCount,
          verdict,
          verdictScore:        score,
          verdictReasonJson:   reasons,
        },
      }, (res) => {
        if (res?.ok) {
          saved.value     = true;
          btn.textContent = "✓ Saved to Worthly";
          btn.classList.add("saved");
          status.textContent = "Product saved to your dashboard.";
        } else {
          btn.disabled    = false;
          btn.textContent = "Save to Worthly";
          status.textContent = "Not connected — open extension popup to connect.";
        }
      });
    });

    return host;
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────

  function init() {
    const extractor = detectExtractor();
    if (!extractor) return;

    let product;
    try {
      product = extractor.extract();
    } catch (err) {
      console.warn("[Worthly] extraction failed:", err);
      return;
    }

    if (!product?.title) return;

    const { verdict, score, reasons } = computeVerdict(product);

    // Notify background so popup can show cached data
    try {
      chrome.runtime.sendMessage({
        type: "PRODUCT_DETECTED",
        data: { ...product, verdict, score, reasons, url: location.href },
      });
    } catch (_) { /* extension might not be active */ }

    // Inject widget after page settles — avoids flicker
    setTimeout(() => {
      if (document.getElementById("worthly-host")) return;
      const host = buildWidget(product, verdict, score, reasons);
      document.body.appendChild(host);
    }, 1400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
