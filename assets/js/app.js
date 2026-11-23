/* =====================================================================
   EARTHSPIRED — SITE SCRIPT
   Shared layout (header, footer, search, mobile menu), cart, and the
   renderers that build brand / product / cart / checkout pages from
   ES.PRODUCTS (catalogue.js) and ES.STORE (config.js).
   You should not need to edit this file to change products or copy.
   ===================================================================== */
(function () {
  "use strict";

  const { STORE, BRANDS, BRAND_ORDER, PRODUCTS, GENERAL_FAQS } = window.ES;
  const body = document.body;
  const PAGE = body.dataset.page || "";

  /* ----------------------------- helpers ----------------------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) =>
    STORE.currencySymbol +
    Number(n).toLocaleString("en-IN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const param = (k) => new URLSearchParams(location.search).get(k);
  const getProduct = (id) => PRODUCTS.find((p) => p.id === id);
  const byBrand = (b) => PRODUCTS.filter((p) => p.brand === b);
  const productUrl = (p) => "product.html?id=" + encodeURIComponent(p.id);
  const minPrice = (p) => Math.min.apply(null, p.variants.map((v) => v.price));
  const hasPriceRange = (p) => new Set(p.variants.map((v) => v.price)).size > 1;
  const maxQty = (p) => (p.stock && typeof p.stock.quantity === "number" ? p.stock.quantity : 20);
  const isOut = (p) => p.stock && p.stock.status === "out_of_stock";

  const storage = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };

  const ICON = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19 13 11"/></svg>',
  };

  /* Wrap every "[TBC: …]" text in a highlighted span. */
  function highlight(root) {
    if (!STORE.highlightPlaceholders || !root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        n.nodeValue.indexOf("[TBC") !== -1 && !n.parentElement.closest(".ph, script, style, textarea, option, title")
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => {
      const frag = document.createDocumentFragment();
      n.nodeValue.split(/(\[TBC[^\]]*\])/g).forEach((part) => {
        if (!part) return;
        if (part.indexOf("[TBC") === 0) {
          const s = document.createElement("span");
          s.className = "ph";
          s.title = "Placeholder — replace with real content";
          s.textContent = part;
          frag.appendChild(s);
        } else frag.appendChild(document.createTextNode(part));
      });
      n.parentNode.replaceChild(frag, n);
    });
  }

  /* ------------------------------- cart ------------------------------ */
  const CART_KEY = "es-cart-v1";
  const CODE_KEY = "es-discount-v1";
  const ORDER_KEY = "es-last-order-v1";

  const Cart = {
    lines() {
      return storage.get(CART_KEY, []).filter((l) => {
        const p = getProduct(l.pid);
        return p && p.variants.some((v) => v.id === l.vid) && l.qty > 0;
      });
    },
    save(lines) { storage.set(CART_KEY, lines); updateCartBadge(); },
    add(pid, vid, qty) {
      const p = getProduct(pid);
      if (!p || isOut(p)) return;
      const lines = this.lines();
      const line = lines.find((l) => l.pid === pid && l.vid === vid);
      if (line) line.qty = Math.min(maxQty(p), line.qty + qty);
      else lines.push({ pid, vid, qty: Math.min(maxQty(p), qty) });
      this.save(lines);
    },
    setQty(pid, vid, qty) {
      const p = getProduct(pid);
      let lines = this.lines();
      if (qty <= 0) lines = lines.filter((l) => !(l.pid === pid && l.vid === vid));
      else lines.forEach((l) => { if (l.pid === pid && l.vid === vid) l.qty = Math.min(maxQty(p), qty); });
      this.save(lines);
    },
    remove(pid, vid) { this.setQty(pid, vid, 0); },
    clear() { storage.del(CART_KEY); storage.del(CODE_KEY); updateCartBadge(); },
    count() { return this.lines().reduce((a, l) => a + l.qty, 0); },
    items() {
      return this.lines().map((l) => {
        const product = getProduct(l.pid);
        const variant = product.variants.find((v) => v.id === l.vid);
        return { pid: l.pid, vid: l.vid, qty: l.qty, product, variant, lineTotal: variant.price * l.qty };
      });
    },
  };

  function lookupCode(input) {
    const codes = STORE.discountCodes || {};
    const key = Object.keys(codes).find((c) => c.toLowerCase() === String(input || "").trim().toLowerCase());
    return key ? Object.assign({ key }, codes[key]) : null;
  }

  function totals() {
    const items = Cart.items();
    const subtotal = items.reduce((a, i) => a + i.lineTotal, 0);
    let discount = 0, code = null;
    const saved = storage.get(CODE_KEY, null);
    if (saved) {
      const c = lookupCode(saved);
      if (c && subtotal >= (c.minSubtotal || 0)) {
        discount = c.type === "percent" ? Math.round(subtotal * c.value) / 100 : Math.min(c.value, subtotal);
        code = c;
      }
    }
    return { items, subtotal, discount, code, total: subtotal - discount };
  }

  function updateCartBadge() {
    const n = Cart.count();
    $$(".cart-count").forEach((el) => {
      el.textContent = n;
      el.hidden = n === 0;
      el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
    });
  }

  /* ------------------------------ toast ------------------------------ */
  let toastEl, toastTimer;
  function toast(html) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      body.appendChild(toastEl);
    }
    toastEl.innerHTML = html;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
  }
  function addedToast(p, v, qty) {
    toast(`<span><strong>${esc(p.name)}</strong>${p.variants.length > 1 ? " · " + esc(v.label) : ""}${qty > 1 ? " × " + qty : ""} added to cart</span><a href="cart.html">View cart</a>`);
  }

  /* ------------------------------ layout ----------------------------- */
  const NAV = [
    { key: "home", label: "Home", href: "index.html" },
    { key: "indulge", label: "INDULGE", href: "indulge.html", brand: "indulge" },
    { key: "essence", label: "ESSENCE", href: "essence.html", brand: "essence" },
    { key: "sage", label: "SAGE", href: "sage.html", brand: "sage" },
    { key: "story", label: "Our Story", href: "our-story.html" },
  ];

  function activeNavKey() {
    if (PAGE === "brand") return body.dataset.brand;
    if (PAGE === "product") { const p = getProduct(param("id")); return p ? p.brand : ""; }
    return PAGE;
  }

  function renderHeader() {
    const active = activeNavKey();
    const links = NAV.map(
      (n) => `<li><a href="${n.href}"${n.brand ? ` data-brand="${n.brand}" class="brand-link${active === n.key ? " active" : ""}"` : active === n.key ? ' class="active"' : ""}${active === n.key ? ' aria-current="page"' : ""}>${n.label}</a></li>`
    ).join("");
    const mobileLinks = NAV.map(
      (n) => `<li><a href="${n.href}"${n.brand ? ` data-brand="${n.brand}"` : ""}${active === n.key ? ' class="active" aria-current="page"' : ""}>${n.label}${n.brand ? `<small>${esc(BRANDS[n.brand].category)}</small>` : ""}</a></li>`
    ).join("");

    const el = $("#site-header");
    if (!el) return;
    el.outerHTML = `
      <a class="skip-link" href="#main">Skip to content</a>
      <header class="site-header">
        <div class="container nav">
          <button class="icon-btn menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav">${ICON.menu}</button>
          <a href="index.html" class="logo" aria-label="Earthspired — home"><img src="assets/img/logos/earthspired.png" alt="Earthspired" width="633" height="147" /></a>
          <nav class="main-nav" aria-label="Main"><ul>${links}</ul></nav>
          <div class="nav-actions">
            <button class="icon-btn" data-open-search aria-label="Search products">${ICON.search}</button>
            <a href="cart.html" class="icon-btn cart-link${PAGE === "cart" ? " active" : ""}" aria-label="Cart">${ICON.bag}<span class="cart-count" hidden>0</span></a>
          </div>
        </div>
      </header>
      <div class="mobile-nav" id="mobile-nav" aria-hidden="true">
        <div class="mobile-nav-panel">
          <div class="mobile-nav-head">
            <img src="assets/img/logos/earthspired.png" alt="Earthspired" />
            <button class="icon-btn" data-close-menu aria-label="Close menu">${ICON.close}</button>
          </div>
          <ul>${mobileLinks}</ul>
          <div class="mobile-nav-foot">
            <button class="btn btn--ghost btn--block" data-open-search>${ICON.search} Search</button>
            <a href="cart.html" class="btn btn--block">${ICON.bag} Cart (<span class="cart-count-plain">0</span>)</a>
          </div>
        </div>
      </div>
      <div class="search-overlay" hidden>
        <div class="search-panel container" role="dialog" aria-modal="true" aria-label="Search products">
          <form class="search-form" action="search.html" role="search">
            ${ICON.search}
            <input type="search" name="q" placeholder="Search products, brands, categories…" autocomplete="off" aria-label="Search" />
            <button type="button" class="icon-btn" data-close-search aria-label="Close search">${ICON.close}</button>
          </form>
          <div class="search-live" aria-live="polite"></div>
        </div>
      </div>`;
  }

  function renderFooter() {
    const el = $("#site-footer");
    if (!el) return;
    el.outerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-top">
            <div class="footer-brand">
              <img src="assets/img/logos/earthspired-full.png" alt="Earthspired — From Source to Everyday" />
              <p>Honest goods, drawn from the earth and made for everyday living.</p>
            </div>
            <div class="footer-cols">
              <div><h4>Shop</h4><ul>${BRAND_ORDER.map((b) => `<li><a href="${BRANDS[b].page}">${BRANDS[b].name} <span>${esc(BRANDS[b].category)}</span></a></li>`).join("")}<li><a href="search.html">All products</a></li></ul></div>
              <div><h4>Help</h4><ul><li><a href="faq.html">FAQs</a></li><li><a href="returns.html">Returns &amp; Refunds</a></li></ul></div>
              <div><h4>Earthspired</h4><ul><li><a href="our-story.html">Our Story</a></li><li><a href="privacy.html">Privacy Policy</a></li><li><a href="terms.html">Terms &amp; Conditions</a></li></ul></div>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${new Date().getFullYear()} Earthspired. All rights reserved. · <a class="footer-credit" href="credits.html">Photo credits</a></span>
            <span class="footer-tag">${esc(STORE.tagline)}</span>
          </div>
        </div>
      </footer>`;
  }

  function initMenu() {
    const toggle = $(".menu-toggle");
    const nav = $("#mobile-nav");
    if (!toggle || !nav) return;
    const set = (open) => {
      body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open);
      nav.setAttribute("aria-hidden", !open);
    };
    toggle.addEventListener("click", () => set(true));
    $$("[data-close-menu]").forEach((b) => b.addEventListener("click", () => set(false)));
    nav.addEventListener("click", (e) => { if (e.target === nav) set(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
    window.matchMedia("(min-width: 1025px)").addEventListener("change", (e) => { if (e.matches) set(false); });
  }

  function initHeaderScroll() {
    const h = $(".site-header");
    const on = () => h && h.classList.toggle("scrolled", window.scrollY > 8);
    window.addEventListener("scroll", on, { passive: true });
    on();
  }

  /* ------------------------------ search ----------------------------- */
  function searchProducts(q) {
    const terms = String(q || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return PRODUCTS.filter((p) => {
      const b = BRANDS[p.brand];
      const hay = [p.name, p.category, p.shortDescription, b.name, b.category, (p.tags || []).join(" ")].join(" ").toLowerCase();
      return terms.every((t) => hay.indexOf(t) !== -1);
    });
  }

  function initSearch() {
    const overlay = $(".search-overlay");
    if (!overlay) return;
    const input = $("input", overlay);
    const live = $(".search-live", overlay);
    const open = () => {
      body.classList.remove("menu-open");
      overlay.hidden = false;
      requestAnimationFrame(() => overlay.classList.add("open"));
      input.focus();
      renderLive();
    };
    const close = () => { overlay.classList.remove("open"); setTimeout(() => (overlay.hidden = true), 200); };
    $$("[data-open-search]").forEach((b) => b.addEventListener("click", open));
    $$("[data-close-search]").forEach((b) => b.addEventListener("click", close));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.hidden) close();
      if (e.key === "/" && overlay.hidden && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    });
    function renderLive() {
      const q = input.value;
      if (!q.trim()) {
        live.innerHTML = `<p class="search-hint">Browse by brand</p><div class="search-brands">${BRAND_ORDER.map((b) => `<a href="${BRANDS[b].page}" data-brand="${b}">${BRANDS[b].name}<small>${esc(BRANDS[b].category)}</small></a>`).join("")}</div>`;
        return;
      }
      const res = searchProducts(q);
      live.innerHTML = res.length
        ? `<ul class="search-list">${res.slice(0, 6).map((p) => `<li><a href="${productUrl(p)}"><img src="${esc(p.images[0])}" alt="" /><span><strong>${esc(p.name)}</strong><small data-brand="${p.brand}">${BRANDS[p.brand].name} · ${esc(p.category)}</small></span><em>${hasPriceRange(p) ? "From " : ""}${money(minPrice(p))}</em></a></li>`).join("")}</ul>${res.length > 6 ? `<a class="link-arrow" href="search.html?q=${encodeURIComponent(q)}">See all ${res.length} results →</a>` : ""}`
        : `<p class="search-hint">No products match “${esc(q)}”.</p>`;
    }
    input.addEventListener("input", renderLive);
  }

  /* ---------------------------- components --------------------------- */
  /* Returns null when no stock status is set, so the stock line is hidden. */
  const stockInfo = (p) => {
    const s = p.stock && p.stock.status;
    return ({
      in_stock: { label: "In stock", cls: "ok" },
      low_stock: { label: "Low stock", cls: "low" },
      out_of_stock: { label: "Out of stock", cls: "out" },
    })[s] || null;
  };

  function productCard(p, opts) {
    opts = opts || {};
    const b = BRANDS[p.brand];
    const multi = p.variants.length > 1;
    const v0 = p.variants[0];
    const action = isOut(p)
      ? `<span class="card-out">Out of stock</span>`
      : multi
      ? `<a class="card-add" href="${productUrl(p)}">Choose options</a>`
      : `<button class="card-add" data-quick-add="${esc(p.id)}">Add to cart</button>`;
    return `
      <article class="card" data-brand="${p.brand}">
        <a class="card-img" href="${productUrl(p)}" tabindex="-1" aria-hidden="true"><img src="${esc(p.images[0])}" alt="" loading="lazy" /></a>
        <div class="card-body">
          <div class="card-meta">${opts.hideBrand ? "" : `<span class="card-brand">${b.name}</span>`}<span class="card-cat">${esc(p.category)}</span></div>
          <h3 class="card-title"><a href="${productUrl(p)}">${esc(p.name)}</a></h3>
          <p class="card-desc">${esc(p.shortDescription)}</p>
          <div class="card-foot">
            <span class="price">${hasPriceRange(p) ? "<small>From</small> " : ""}${money(minPrice(p))}${!multi ? ` <small>· ${esc(v0.label)}</small>` : ""}</span>
            ${action}
          </div>
        </div>
      </article>`;
  }

  function faqList(items) {
    return `<div class="faq-list">${items.map((f) => `<details class="faq"><summary>${esc(f.q)}</summary><div class="faq-a">${esc(f.a)}</div></details>`).join("")}</div>`;
  }

  function breadcrumb(items) {
    return `<nav class="breadcrumb container" aria-label="Breadcrumb"><ol>${items.map((i, idx) => idx === items.length - 1 ? `<li aria-current="page">${esc(i.label)}</li>` : `<li><a href="${i.href}">${esc(i.label)}</a></li>`).join("")}</ol></nav>`;
  }

  function bindQuickAdd(root) {
    $$("[data-quick-add]", root).forEach((btn) =>
      btn.addEventListener("click", () => {
        const p = getProduct(btn.dataset.quickAdd);
        if (!p) return;
        Cart.add(p.id, p.variants[0].id, 1);
        addedToast(p, p.variants[0], 1);
      })
    );
  }

  function brandPanels() {
    return BRAND_ORDER.map((id) => {
      const b = BRANDS[id];
      const ps = byBrand(id);
      const imgs = ps.slice(0, 3).map((p) => `<img src="${esc(p.images[0])}" alt="" loading="lazy" />`).join("");
      return `
        <a class="brand-panel" href="${b.page}" data-brand="${id}">
          <div class="brand-panel-imgs">${imgs}</div>
          <div class="brand-panel-body">
            <img class="brand-panel-logo" src="${b.logo}" alt="${b.name} by Earthspired" />
            <span class="eyebrow">${esc(b.category)}</span>
            <p>${esc(b.intro)}</p>
            <span class="brand-panel-count">${ps.length} product${ps.length === 1 ? "" : "s"} · ${[...new Set(ps.map((p) => p.category))].map(esc).join(", ")}</span>
            <span class="link-arrow">Shop ${b.name} →</span>
          </div>
        </a>`;
    }).join("");
  }

  /* Containers on static pages: <div data-render="…"></div> */
  const RENDERERS = {
    "brand-panels": () => brandPanels(),
    featured: () => {
      const list = PRODUCTS.filter((p) => p.featured);
      return list.length ? list.map((p) => productCard(p)).join("") : `<p class="muted">Mark products as <code>featured: true</code> in catalogue.js to show them here.</p>`;
    },
    "general-faqs": () => faqList(GENERAL_FAQS),
    "brand-faqs": () =>
      BRAND_ORDER.map((b) => `<div class="faq-group" data-brand="${b}"><h3><a href="${BRANDS[b].page}">${BRANDS[b].name}</a> <small>${esc(BRANDS[b].category)}</small></h3>${faqList(BRANDS[b].faqs)}</div>`).join(""),
    "brand-trio": () =>
      BRAND_ORDER.map((b) => `<a class="trio-item" href="${BRANDS[b].page}" data-brand="${b}"><img src="${BRANDS[b].logo}" alt="${BRANDS[b].name}" /><span>${esc(BRANDS[b].category)}</span></a>`).join(""),
  };

  function fillRenderers(root) {
    $$("[data-render]", root).forEach((el) => {
      const fn = RENDERERS[el.dataset.render];
      if (fn) el.innerHTML = fn();
    });
  }

  /* ------------------------------ pages ------------------------------ */
  function pageBrand(main) {
    const id = body.dataset.brand;
    const b = BRANDS[id];
    if (!b) return;
    const ps = byBrand(id);
    const cats = [...new Set(ps.map((p) => p.category))];
    const others = BRAND_ORDER.filter((x) => x !== id);
    document.title = `${b.name} — ${b.category} by Earthspired`;

    main.innerHTML = `
      ${breadcrumb([{ label: "Home", href: "index.html" }, { label: b.name }])}
      <section class="brand-hero">
        <div class="container">
          <h1 class="sr-only">${b.name} — ${esc(b.category)} by Earthspired</h1>
          <img class="brand-hero-logo" src="${b.logoFull}" alt="" />
          <span class="eyebrow">${esc(b.category)}</span>
          <p class="lead">${esc(b.intro)}</p>
        </div>
      </section>

      <section class="section section--tight">
        <div class="container overview">
          <div>
            <span class="eyebrow">About ${b.name}</span>
            <h2>The ${esc(b.category.toLowerCase())} category</h2>
          </div>
          <div>
            <p>${esc(b.overview)}</p>
            <ul class="chips">${cats.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
          </div>
        </div>
      </section>

      <section class="section section--paper" id="products">
        <div class="container">
          <div class="section-head section-head--row">
            <div><span class="eyebrow">The ${b.name} range</span><h2>All products</h2></div>
            <span class="muted">${ps.length} product${ps.length === 1 ? "" : "s"}</span>
          </div>
          <div class="grid grid--products">${ps.map((p) => productCard(p, { hideBrand: true })).join("")}</div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-head section-head--row"><div><span class="eyebrow">At a glance</span><h2>Product information</h2></div></div>
          <div class="table-wrap">
            <table class="info-table">
              <thead><tr><th>Product</th><th>Category</th><th>Size / option</th><th>Price</th><th>Unit price</th></tr></thead>
              <tbody>${ps.map((p) => p.variants.map((v, i) => `<tr>${i === 0 ? `<td rowspan="${p.variants.length}"><a href="${productUrl(p)}">${esc(p.name)}</a></td><td rowspan="${p.variants.length}">${esc(p.category)}</td>` : ""}<td>${esc(v.label)}</td><td>${money(v.price)}</td><td>${v.unitPrice ? esc(v.unitPrice) : "—"}</td></tr>`).join("")).join("")}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="section section--paper">
        <div class="container faq-wrap">
          <div><span class="eyebrow">${b.name}</span><h2>Frequently asked questions</h2><p class="muted">More answers on our <a class="text-link" href="faq.html">FAQ page</a>.</p></div>
          ${faqList(b.faqs)}
        </div>
      </section>

      <section class="section section--tight">
        <div class="container">
          <div class="section-head"><span class="eyebrow" style="color:var(--brown)">Also from Earthspired</span></div>
          <div class="cross-brands">${others.map((o) => `<a href="${BRANDS[o].page}" data-brand="${o}"><img src="${BRANDS[o].logo}" alt="${BRANDS[o].name}" /><span>${esc(BRANDS[o].category)} →</span></a>`).join("")}</div>
        </div>
      </section>`;
    bindQuickAdd(main);
  }

  function pageProduct(main) {
    const p = getProduct(param("id"));
    if (!p) {
      main.innerHTML = `<section class="section empty"><div class="container"><h1>Product not found</h1><p class="muted">This product may have been removed or the link is incorrect.</p><div class="btn-row">${BRAND_ORDER.map((b) => `<a class="btn btn--ghost" data-brand="${b}" href="${BRANDS[b].page}">${BRANDS[b].name}</a>`).join("")}</div></div></section>`;
      return;
    }
    const b = BRANDS[p.brand];
    body.dataset.brand = p.brand;
    document.title = `${p.name} — ${b.name} by Earthspired`;
    const related = byBrand(p.brand).filter((x) => x.id !== p.id).slice(0, 4);
    const stock = stockInfo(p);
    const out = isOut(p);
    let vIdx = 0;

    const specRows = [{ label: "Brand", value: `${b.name} (${b.category})` }, { label: "Category", value: p.category }]
      .concat(p.specifications || [])
      .map((s) => `<tr><th>${esc(s.label)}</th><td>${esc(s.value)}</td></tr>`).join("");

    main.innerHTML = `
      ${breadcrumb([{ label: "Home", href: "index.html" }, { label: b.name, href: b.page }, { label: p.name }])}
      <section class="product container">
        <div class="gallery">
          <div class="gallery-main"><img id="gallery-main" src="${esc(p.images[0])}" alt="${esc(p.name)}" /></div>
          ${p.images.length > 1 ? `<div class="gallery-thumbs">${p.images.map((src, i) => `<button class="${i === 0 ? "active" : ""}" data-img="${esc(src)}" aria-label="Show image ${i + 1}"><img src="${esc(src)}" alt="" /></button>`).join("")}</div>` : ""}
        </div>

        <div class="buybox">
          <a class="buybox-brand" href="${b.page}"><img src="${b.logo}" alt="${b.name} by Earthspired" /></a>
          <span class="eyebrow">${esc(p.category)}</span>
          <h1>${esc(p.name)}</h1>
          <div class="buybox-price"><span class="price" id="pp-price"></span><span class="unit" id="pp-unit"></span></div>
          <p class="buybox-short">${esc(p.shortDescription)}</p>
          ${stock ? `<p class="stock stock--${stock.cls}"><i></i>${esc(stock.label)}</p>` : ""}

          <div class="field">
            <span class="field-label">${esc(p.variantLabel || "Option")}: <strong id="pp-vlabel"></strong></span>
            <div class="variants" role="radiogroup" aria-label="${esc(p.variantLabel || "Option")}">
              ${p.variants.map((v, i) => `<button type="button" role="radio" aria-checked="${i === 0}" class="variant${i === 0 ? " active" : ""}" data-idx="${i}">${esc(v.label)}${hasPriceRange(p) ? `<small>${money(v.price)}</small>` : ""}</button>`).join("")}
            </div>
          </div>

          <div class="buy-row">
            <div class="qty" aria-label="Quantity">
              <button type="button" data-qty="-1" aria-label="Decrease quantity">${ICON.minus}</button>
              <input type="number" id="pp-qty" value="1" min="1" max="${maxQty(p)}" inputmode="numeric" aria-label="Quantity" />
              <button type="button" data-qty="1" aria-label="Increase quantity">${ICON.plus}</button>
            </div>
            <button class="btn btn--grow" id="pp-add" ${out ? "disabled" : ""}>${out ? "Out of stock" : "Add to cart"}</button>
          </div>

          ${p.features && p.features.length ? `<div class="features"><h3>Key features</h3><ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>` : ""}
        </div>
      </section>

      <section class="section section--paper">
        <div class="container details">
          <div class="detail-block"><h2>Description</h2><p>${esc(p.description)}</p></div>
          <div class="detail-block"><h2>Specifications</h2><table class="spec-table">${specRows}</table></div>
          ${p.materials ? `<div class="detail-block"><h2>${esc(p.materialsLabel || "Ingredients")}</h2><p>${esc(p.materials)}</p></div>` : ""}
          ${p.usage ? `<div class="detail-block"><h2>${p.brand === "essence" ? "Care" : "How to use"}</h2><p>${esc(p.usage)}</p></div>` : ""}
        </div>
      </section>

      ${p.faqs && p.faqs.length ? `<section class="section"><div class="container faq-wrap"><div><span class="eyebrow">${esc(p.name)}</span><h2>Questions &amp; answers</h2></div>${faqList(p.faqs)}</div></section>` : ""}

      ${related.length ? `<section class="section section--paper"><div class="container"><div class="section-head section-head--row"><div><span class="eyebrow">More from ${b.name}</span><h2>Related products</h2></div><a class="link-arrow" href="${b.page}">View all →</a></div><div class="grid grid--products">${related.map((r) => productCard(r, { hideBrand: true })).join("")}</div></div></section>` : ""}`;

    const qtyEl = $("#pp-qty", main);
    const clampQty = () => { let q = parseInt(qtyEl.value, 10) || 1; q = Math.max(1, Math.min(maxQty(p), q)); qtyEl.value = q; return q; };
    const sync = () => {
      const v = p.variants[vIdx];
      $("#pp-price", main).textContent = money(v.price);
      $("#pp-unit", main).textContent = v.unitPrice || "";
      $("#pp-vlabel", main).textContent = v.label;
      $$(".variant", main).forEach((el, i) => { el.classList.toggle("active", i === vIdx); el.setAttribute("aria-checked", i === vIdx); });
    };
    $$(".variant", main).forEach((el) => el.addEventListener("click", () => { vIdx = +el.dataset.idx; sync(); }));
    $$("[data-qty]", main).forEach((el) => el.addEventListener("click", () => { qtyEl.value = (parseInt(qtyEl.value, 10) || 1) + +el.dataset.qty; clampQty(); }));
    qtyEl.addEventListener("change", clampQty);
    $("#pp-add", main).addEventListener("click", () => {
      if (out) return;
      const q = clampQty();
      Cart.add(p.id, p.variants[vIdx].id, q);
      addedToast(p, p.variants[vIdx], q);
    });
    $$(".gallery-thumbs button", main).forEach((btn) =>
      btn.addEventListener("click", () => {
        $("#gallery-main", main).src = btn.dataset.img;
        $$(".gallery-thumbs button", main).forEach((x) => x.classList.toggle("active", x === btn));
      })
    );
    sync();
    bindQuickAdd(main);
  }

  function summaryRows(t) {
    return `
      <div class="sum-row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
      ${t.code ? `<div class="sum-row sum-row--disc"><span>Discount <small>${esc(t.code.key)}${t.code.label ? " · " + esc(t.code.label) : ""}</small></span><span>− ${money(t.discount)}</span></div>` : ""}
      <div class="sum-row sum-row--total"><span>Total</span><span>${money(t.total)}</span></div>
      ${STORE.taxNote ? `<p class="sum-note">${esc(STORE.taxNote)}</p>` : `<div class="sum-gap"></div>`}`;
  }

  function discountForm() {
    const saved = storage.get(CODE_KEY, null);
    return `
      <form class="discount-form" novalidate>
        <label for="disc-code">Discount code</label>
        <div class="discount-row"><input id="disc-code" name="code" placeholder="Enter code" value="${esc(saved || "")}" autocomplete="off" /><button class="btn btn--ghost btn--sm" type="submit">Apply</button></div>
        <p class="discount-msg" aria-live="polite"></p>
      </form>`;
  }

  function bindDiscount(root, rerender) {
    const form = $(".discount-form", root);
    if (!form) return;
    const msg = $(".discount-msg", form);
    const saved = storage.get(CODE_KEY, null);
    if (saved) {
      const t = totals();
      if (t.code) msg.innerHTML = `Code applied. <button type="button" class="text-link" data-remove-code>Remove</button>`;
      else { const c = lookupCode(saved); msg.textContent = c ? `This code needs a subtotal of at least ${money(c.minSubtotal)}.` : ""; msg.classList.toggle("err", !!c); }
    }
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = form.code.value.trim();
      if (!val) return;
      const c = lookupCode(val);
      if (!c) { msg.textContent = "That code isn't valid."; msg.classList.add("err"); return; }
      storage.set(CODE_KEY, c.key);
      rerender();
    });
    form.addEventListener("click", (e) => {
      if (e.target.matches("[data-remove-code]")) { storage.del(CODE_KEY); rerender(); }
    });
  }

  function pageCart(main) {
    const render = () => {
      const t = totals();
      if (!t.items.length) {
        main.innerHTML = `
          <section class="section empty"><div class="container">
            <h1>Your cart is empty</h1>
            <p class="muted">Explore the three Earthspired brands to find something you love.</p>
            <div class="btn-row">${BRAND_ORDER.map((b) => `<a class="btn btn--ghost" data-brand="${b}" href="${BRANDS[b].page}">Shop ${BRANDS[b].name}</a>`).join("")}</div>
          </div></section>`;
        return;
      }
      main.innerHTML = `
        <section class="section section--tight"><div class="container">
          <h1 class="page-title">Your cart <small>${Cart.count()} item${Cart.count() === 1 ? "" : "s"}</small></h1>
          <div class="cart-layout">
            <ul class="cart-lines">
              ${t.items.map((i) => `
                <li class="cart-line" data-brand="${i.product.brand}" data-pid="${esc(i.pid)}" data-vid="${esc(i.vid)}">
                  <a class="cart-thumb" href="${productUrl(i.product)}"><img src="${esc(i.product.images[0])}" alt="" /></a>
                  <div class="cart-info">
                    <span class="card-brand">${BRANDS[i.product.brand].name}</span>
                    <a class="cart-name" href="${productUrl(i.product)}">${esc(i.product.name)}</a>
                    <span class="muted">${esc(i.product.variantLabel || "Option")}: ${esc(i.variant.label)} · ${money(i.variant.price)} each</span>
                    <button class="cart-remove text-link" data-remove>${ICON.trash} Remove</button>
                  </div>
                  <div class="qty qty--sm">
                    <button type="button" data-step="-1" aria-label="Decrease quantity">${ICON.minus}</button>
                    <input type="number" value="${i.qty}" min="1" max="${maxQty(i.product)}" aria-label="Quantity for ${esc(i.product.name)}" />
                    <button type="button" data-step="1" aria-label="Increase quantity">${ICON.plus}</button>
                  </div>
                  <span class="cart-total">${money(i.lineTotal)}</span>
                </li>`).join("")}
            </ul>
            <aside class="summary">
              <h2>Order summary</h2>
              ${summaryRows(t)}
              ${discountForm()}
              <a class="btn btn--block" href="checkout.html">Proceed to checkout</a>
              <a class="link-arrow summary-continue" href="index.html#brands">← Continue shopping</a>
            </aside>
          </div>
        </div></section>`;
      highlight(main);
      $$(".cart-line", main).forEach((li) => {
        const pid = li.dataset.pid, vid = li.dataset.vid;
        const input = $("input", li);
        $$("[data-step]", li).forEach((b) => b.addEventListener("click", () => { Cart.setQty(pid, vid, (parseInt(input.value, 10) || 1) + +b.dataset.step); render(); }));
        input.addEventListener("change", () => { Cart.setQty(pid, vid, Math.max(1, parseInt(input.value, 10) || 1)); render(); });
        $("[data-remove]", li).addEventListener("click", () => { Cart.remove(pid, vid); render(); });
      });
      bindDiscount(main, render);
    };
    render();
  }

  function pageCheckout(main) {
    if (!Cart.count()) {
      main.innerHTML = `<section class="section empty"><div class="container"><h1>Your cart is empty</h1><p class="muted">Add a product before checking out.</p><a class="btn" href="index.html">Back to home</a></div></section>`;
      return;
    }
    const field = (name, label, attrs, full) =>
      `<div class="form-field${full ? " form-field--full" : ""}"><label for="co-${name}">${label}</label><input id="co-${name}" name="${name}" ${attrs || ""} /></div>`;

    main.innerHTML = `
      ${breadcrumb([{ label: "Cart", href: "cart.html" }, { label: "Checkout" }])}
      <section class="section section--tight"><div class="container">
        <h1 class="page-title">Checkout</h1>
        <div class="cart-layout">
          <form class="checkout-form" id="checkout-form" novalidate>
            <fieldset>
              <legend><span>1</span> Your details</legend>
              <div class="form-grid">
                ${field("name", "Full name", 'required autocomplete="name"', true)}
                ${field("email", "Email", 'type="email" required autocomplete="email"')}
                ${field("phone", "Phone", 'type="tel" required autocomplete="tel" pattern="[0-9+ ()-]{10,15}"')}
              </div>
            </fieldset>
            <fieldset>
              <legend><span>2</span> Address</legend>
              <div class="form-grid">
                ${field("address1", "Address line 1", 'required autocomplete="address-line1"', true)}
                ${field("address2", "Address line 2 (optional)", 'autocomplete="address-line2"', true)}
                ${field("city", "City", 'required autocomplete="address-level2"')}
                ${field("state", "State", 'required autocomplete="address-level1"')}
                ${field("pincode", "PIN code", 'required inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="postal-code"')}
                ${field("country", "Country", 'required value="India" autocomplete="country-name"')}
                <div class="form-field form-field--full"><label for="co-notes">Order notes (optional)</label><textarea id="co-notes" name="notes" rows="3"></textarea></div>
              </div>
            </fieldset>
            <fieldset>
              <legend><span>3</span> Payment</legend>
              <div class="notice">${esc(STORE.payment.notice)}<br /><small>No payment is taken at this stage.</small></div>
            </fieldset>
            <p class="form-error" aria-live="assertive"></p>
            <button class="btn btn--block btn--lg" type="submit">Submit order request</button>
          </form>

          <aside class="summary" id="co-summary"></aside>
        </div>
      </div></section>`;

    const renderSummary = () => {
      const t = totals();
      $("#co-summary", main).innerHTML = `
        <h2>Order summary</h2>
        <ul class="mini-lines">${t.items.map((i) => `<li><span class="mini-thumb"><img src="${esc(i.product.images[0])}" alt="" /><em>${i.qty}</em></span><span><strong>${esc(i.product.name)}</strong><small>${esc(i.variant.label)}</small></span><span>${money(i.lineTotal)}</span></li>`).join("")}</ul>
        ${discountForm()}
        ${summaryRows(t)}
        <a class="link-arrow" href="cart.html">← Edit cart</a>`;
      highlight($("#co-summary", main));
      bindDiscount(main, renderSummary);
    };
    renderSummary();

    const form = $("#checkout-form", main);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const err = $(".form-error", form);
      $$(".form-field", form).forEach((f) => f.classList.remove("invalid"));
      const bad = $$("input, textarea", form).filter((i) => !i.checkValidity());
      if (bad.length) {
        bad.forEach((i) => i.closest(".form-field").classList.add("invalid"));
        err.textContent = "Please check the highlighted fields.";
        bad[0].focus();
        return;
      }
      err.textContent = "";
      const t = totals();
      const data = Object.fromEntries(new FormData(form).entries());
      const order = {
        ref: "ES-" + Date.now().toString(36).toUpperCase(),
        createdAt: new Date().toISOString(),
        customer: data,
        items: t.items.map((i) => ({ id: i.pid, name: i.product.name, brand: BRANDS[i.product.brand].name, variant: i.variant.label, price: i.variant.price, qty: i.qty, lineTotal: i.lineTotal, image: i.product.images[0] })),
        subtotal: t.subtotal, discount: t.discount, discountCode: t.code ? t.code.key : null, total: t.total,
        paymentStatus: "not_collected",
      };
      /* TODO before launch: send `order` to an order backend / email service here. */
      storage.set(ORDER_KEY, order);
      Cart.clear();
      location.href = "order-confirmation.html";
    });
  }

  function pageConfirmation(main) {
    const o = storage.get(ORDER_KEY, null);
    if (!o) {
      main.innerHTML = `<section class="section empty"><div class="container"><h1>No recent order</h1><p class="muted">We couldn't find a recent order request on this device.</p><a class="btn" href="index.html">Back to home</a></div></section>`;
      return;
    }
    const c = o.customer;
    const date = new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    main.innerHTML = `
      <section class="section section--tight"><div class="container confirm">
        <div class="confirm-head">
          <span class="confirm-icon">${ICON.leaf}</span>
          <span class="eyebrow">Order request received</span>
          <h1>Thank you, ${esc((c.name || "").split(" ")[0])}.</h1>
          <p class="lead">Your order reference is <strong>${esc(o.ref)}</strong>.</p>
          <p class="muted">${date}</p>
        </div>
        <div class="notice notice--center">Your order request has been received and is being reviewed.<br /><small>No payment has been taken for this order.</small></div>
        <div class="confirm-grid">
          <div class="summary">
            <h2>Items</h2>
            <ul class="mini-lines">${o.items.map((i) => `<li><span class="mini-thumb"><img src="${esc(i.image)}" alt="" /><em>${i.qty}</em></span><span><strong>${esc(i.name)}</strong><small>${esc(i.brand)} · ${esc(i.variant)}</small></span><span>${money(i.lineTotal)}</span></li>`).join("")}</ul>
            <div class="sum-row"><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
            ${o.discount ? `<div class="sum-row sum-row--disc"><span>Discount <small>${esc(o.discountCode)}</small></span><span>− ${money(o.discount)}</span></div>` : ""}
            <div class="sum-row sum-row--total"><span>Total</span><span>${money(o.total)}</span></div>
          </div>
          <div class="summary">
            <h2>Your details</h2>
            <p><strong>${esc(c.name)}</strong><br />${esc(c.email)}<br />${esc(c.phone)}</p>
            <p>${esc(c.address1)}${c.address2 ? "<br />" + esc(c.address2) : ""}<br />${esc(c.city)}, ${esc(c.state)} ${esc(c.pincode)}<br />${esc(c.country)}</p>
            ${c.notes ? `<p class="muted">Notes: ${esc(c.notes)}</p>` : ""}
            <h2 style="margin-top:28px">What happens next</h2>
            <p>${esc(STORE.payment.nextSteps)}</p>
          </div>
        </div>
        <div class="btn-row" style="justify-content:center"><a class="btn" href="index.html">Continue shopping</a></div>
      </div></section>`;
  }

  function pageSearch(main) {
    const q = param("q") || "";
    const res = q ? searchProducts(q) : PRODUCTS;
    document.title = q ? `Search: ${q} — Earthspired` : "All products — Earthspired";
    main.innerHTML = `
      <section class="section section--tight"><div class="container">
        <h1 class="page-title">${q ? `Results for “${esc(q)}”` : "All products"} <small>${res.length} product${res.length === 1 ? "" : "s"}</small></h1>
        <form class="search-form search-form--page" action="search.html" role="search">${ICON.search}<input type="search" name="q" value="${esc(q)}" placeholder="Search products, brands, categories…" aria-label="Search" /><button class="btn btn--sm" type="submit">Search</button></form>
        ${res.length
          ? (q ? `<div class="grid grid--products">${res.map((p) => productCard(p)).join("")}</div>` :
             BRAND_ORDER.map((b) => `<div class="search-group" data-brand="${b}"><div class="section-head section-head--row"><div><img class="search-group-logo" src="${BRANDS[b].logo}" alt="${BRANDS[b].name}" /></div><a class="link-arrow" href="${BRANDS[b].page}">Visit ${BRANDS[b].name} →</a></div><div class="grid grid--products">${byBrand(b).map((p) => productCard(p, { hideBrand: true })).join("")}</div></div>`).join(""))
          : `<div class="empty"><p class="muted">No products match your search. Try a product name, an ingredient or a brand.</p><div class="btn-row">${BRAND_ORDER.map((b) => `<a class="btn btn--ghost" data-brand="${b}" href="${BRANDS[b].page}">${BRANDS[b].name}</a>`).join("")}</div></div>`}
      </div></section>`;
    bindQuickAdd(main);
  }


  /* ------------------------------ motion ----------------------------- */
  /* Scroll reveals, scroll-linked "stage" scaling, page transitions,
     hand-drawn marks and word-by-word reveals. All of it switches off
     when the visitor has "reduce motion" turned on. */
  function initMotion() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const EXCLUDE = ".site-header, .site-footer, .mobile-nav, .search-overlay, .toast, .summary, .checkout-form, .cart-lines";

    /* 1. Hand-drawn marks: <span data-mark="underline|circle">word</span> */
    const MARK_PATHS = {
      underline: "M3 14 C 40 8, 90 6, 140 9 S 190 15, 197 10",
      circle: "M100 4 C 40 2, 4 14, 6 30 C 8 46, 60 54, 110 52 C 165 50, 198 38, 194 22 C 190 8, 140 2, 80 6",
    };
    $$("[data-mark]").forEach((el) => {
      const kind = el.dataset.mark in MARK_PATHS ? el.dataset.mark : "underline";
      const d = MARK_PATHS[kind];
      el.classList.add("mark", "mark-" + kind);
      if (el.dataset.markDelay) el.style.setProperty("--mark-delay", el.dataset.markDelay + "s");
      el.insertAdjacentHTML("beforeend", `<svg viewBox="${kind === "circle" ? "0 0 200 56" : "0 0 200 20"}" preserveAspectRatio="none" aria-hidden="true"><path class="mg" d="${d}" pathLength="1"/><path d="${d}" pathLength="1"/><path class="ms" d="${d}" pathLength="1" transform="translate(1.5 1.2)"/></svg>`);
    });

    /* 2. Word-by-word reveal: <p class="word-reveal">…</p> */
    const wordEls = $$(".word-reveal").map((el) => {
      const text = el.textContent.trim();
      el.setAttribute("aria-label", text);
      el.innerHTML = text.split(/\s+/).map((w) => `<span aria-hidden="true">${esc(w)} </span>`).join("");
      return { el, spans: $$("span", el) };
    });

    if (reduce) {
      $$(".mark").forEach((m) => m.classList.add("on"));
      wordEls.forEach((w) => w.spans.forEach((sp) => (sp.style.opacity = 1)));
      return;
    }

    /* 3. Reveal on scroll — applied automatically to headings, copy and blocks */
    const REVEAL = [
      ".hero .container > *", ".page-hero .container > *", ".brand-hero .container > *",
      ".section-head > *", ".split > div:not(.mosaic) > *", ".overview > div > *",
      ".faq-wrap > div:first-child > *", ".faq", ".detail-block", ".prose > *", ".pillar",
      ".buybox > *", ".confirm-head > *", ".story-tagline .container > *", ".origins-copy > *",
      ".statement .eyebrow", ".page-title", ".empty .container > *", ".structure-root", ".chips", ".notice--center",
    ].join(",");
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    $$(REVEAL).forEach((el) => {
      if (el.closest(EXCLUDE) || el.classList.contains("stage")) return;
      const idx = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(idx, 5) * 80 + "ms";
      io.observe(el);
    });
    const markIO = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("on"); markIO.unobserve(en.target); }
    }), { threshold: 0.6 });
    $$(".mark").forEach((m) => markIO.observe(m));

    /* 4. Stage: cards & images scale up from ~93% as they scroll into view */
    const STAGE = ".card, .brand-panel, .mosaic img, .gallery-main, .relationship a, .cross-brands a, .table-wrap, .field-strip figure, .photo-band, .trio-item";
    const stages = $$(STAGE).filter((el) => !el.closest(EXCLUDE));
    const last = new WeakMap();
    stages.forEach((el) => {
      el.classList.add("stage");
      el.dataset.big = el.getBoundingClientRect().width > window.innerWidth * 0.5 ? "1" : "0";
    });
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    let ticking = 0;
    function update() {
      ticking = 0;
      const vh = window.innerHeight;
      stages.forEach((el) => {
        const r = el.getBoundingClientRect();
        const p = Math.round(Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.45))) * 200) / 200;
        if (last.get(el) === p) return;
        last.set(el, p);
        const k = easeOut(p);
        const min = el.dataset.big === "1" ? 0.86 : 0.93;
        el.style.setProperty("--ss", (min + (1 - min) * k).toFixed(4));
        el.style.setProperty("--st", ((1 - k) * 56).toFixed(1) + "px");
        el.style.setProperty("--so", Math.min(1, k * 1.25).toFixed(3));
      });
      wordEls.forEach(({ el, spans }) => {
        const r = el.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.45 + r.height * 0.5)));
        const n = spans.length;
        spans.forEach((sp, i) => (sp.style.opacity = Math.max(0.16, Math.min(1, p * n * 1.25 - i + 1)).toFixed(2)));
      });
    }
    const request = () => { if (!ticking) ticking = requestAnimationFrame(update); };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    update();

    /* 5. Page transitions: fade the page out before following internal links */
    document.addEventListener("click", (ev) => {
      const a = ev.target.closest("a[href]");
      if (!a || ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page / hash links
      ev.preventDefault();
      document.documentElement.classList.add("pt-out");
      setTimeout(() => { location.href = url.href; }, 220);
    });
    window.addEventListener("pageshow", (ev) => {
      if (ev.persisted) document.documentElement.classList.toggle("pt-out", false);
    });
  }

  /* ------------------------------- boot ------------------------------ */
  renderHeader();
  renderFooter();
  const main = $("#main");
  fillRenderers(document);

  if (PAGE === "brand") pageBrand(main);
  else if (PAGE === "product") pageProduct(main);
  else if (PAGE === "cart") pageCart(main);
  else if (PAGE === "checkout") pageCheckout(main);
  else if (PAGE === "confirmation") pageConfirmation(main);
  else if (PAGE === "search") pageSearch(main);

  bindQuickAdd($("[data-render='featured']") || document.createElement("div"));
  initMenu();
  initSearch();
  initHeaderScroll();
  updateCartBadge();
  const plain = () => $$(".cart-count-plain").forEach((el) => (el.textContent = Cart.count()));
  plain();
  window.addEventListener("storage", () => { updateCartBadge(); plain(); });
  const origSave = Cart.save.bind(Cart);
  Cart.save = (l) => { origSave(l); plain(); };
  highlight(document.body);
  initMotion();
})();
