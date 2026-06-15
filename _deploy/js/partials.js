/* NYUKD — header/footer partials.
   Inserted via vanilla JS so every page stays in sync.
   Usage: include before app.js. Pages call window.NYUKD.mount({base, current}).
*/
(function () {

  // -------------------------------------------------------------
  // NYUKD Invest product URL — the single source of truth.
  //
  // Change this ONE constant when the dashboard moves between
  // localhost ↔ a Cloudflare Tunnel URL ↔ a permanent subdomain.
  // Every page-level "Sign in" / "Create account" / "Launch" CTA
  // reads from here.
  //
  //   Local dev (Mac only):       http://127.0.0.1:8080
  //   Cloudflare quick tunnel:    https://random-words.trycloudflare.com
  //   Permanent subdomain:        https://invest.nyukd.com
  //
  // Pages append their own path (/auth/login, /auth/register,
  // /performance) so each CTA reaches a known target. The bare
  // /welcome page auto-forwards already-logged-in visitors to
  // /performance, which made "Sign in" buttons look broken — so
  // those buttons now go directly to /auth/login (Bug #185).
  // -------------------------------------------------------------
  const INVEST_APP_BASE = 'https://invest.nyukd.com';
  const INVEST_APP_URL = INVEST_APP_BASE + '/welcome';   // legacy alias, kept for any page still reading it
  window.NYUKD_INVEST_APP_URL = INVEST_APP_URL;          // legacy alias
  window.NYUKD_INVEST_APP_BASE = INVEST_APP_BASE;        // preferred — pages should build their own path

  function mount({ base = '', current = 'home' } = {}) {
    const headerSlot = document.querySelector('[data-slot="header"]');
    const footerSlot = document.querySelector('[data-slot="footer"]');
    const isCurrent = (key) => (key === current ? ' aria-current="page"' : '');

    // Per-page Explore routing (Bug #190). Pages not listed here fall through
    // to the site home. Only the Invest app is external (opens a new tab).
    const exploreMap = {
      investment:    { href: `${INVEST_APP_BASE}/welcome`,                         external: true,  title: 'Explore NYUKD Invest' },
      infotainment:  { href: `${base}verticals/infotainment.html#library-grid`,     external: false, title: 'Explore the Infotainment library' },
      entertainment: { href: `${base}verticals/entertainment.html#library-grid`,    external: false, title: 'Explore the Entertainment library' },
      consulting:    { href: `${base}verticals/consulting.html#projects`,           external: false, title: 'Explore the project repository' },
      pipeline:      { href: `${base}verticals/pipeline.html`,                      external: false, title: 'Open the launch pipeline' },
      gaming:        { href: `${base}verticals/gaming.html#catalogue`,              external: false, title: 'Explore the games catalogue' },
    };
    const explore     = exploreMap[current] || { href: `${base}index.html`, external: false, title: 'Explore NYUKD' };
    const exploreHref = explore.href;
    const exploreAttrs = explore.external ? ' target="_blank" rel="noopener"' : '';
    const exploreTitle = explore.title;

    // Canonical NYUKD mark — rounded-corner box, zigzag N, primary-tint
    // dot in the bottom-right corner. Single source of truth lives in
    // dashboard.html (the product header); duplicated here so the
    // marketing site renders identically without depending on the app.
    // Logo mark — outline, N, dot all use currentColor so they track the
    // theme's foreground (white on dark, near-black on light). The full
    // animated/blue-rocket version lives on the welcome hero only — this
    // static stamp is what the marketing header carries.
    const logoSvg = `
      <svg class="brand-mark" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="6" fill="none" stroke="currentColor" stroke-width="2"/>
        <path d="M9 22 L15 10 L17 22 L23 10" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="22" cy="22" r="2" fill="currentColor"/>
      </svg>`;

    const logo = `
      <a class="site-logo" href="${base}index.html" aria-label="NYUKD home">
        ${logoSvg}
        <span class="wordmark">NY<span>U</span>KD</span>
      </a>`;

    if (headerSlot) {
      headerSlot.outerHTML = `
        <header class="site-header">
          <div class="container site-header__inner">
            ${logo}
            <nav class="site-nav" data-site-nav aria-label="Primary">
              <a href="${base}verticals/investment.html"${isCurrent('investment')}>Investment</a>
              <a href="${base}verticals/infotainment.html"${isCurrent('infotainment')}>Infotainment</a>
              <a href="${base}verticals/consulting.html"${isCurrent('consulting')}>Consulting</a>
              <a href="${base}verticals/entertainment.html"${isCurrent('entertainment')}>Entertainment</a>
              <a href="${base}verticals/gaming.html"${isCurrent('gaming')}>Gaming</a>
              <a href="${base}verticals/social.html"${isCurrent('social')}>Social</a>
              <a href="${base}index.html#waitlist">Waitlist</a>
              <a href="${base}verticals/pipeline.html"${isCurrent('pipeline')}>Pipeline</a>
            </nav>
            <div class="header-actions">
              <!-- Bug #187 — header CTA was "Sign in", changed to "Explore".
                   Bug #190 — Explore was hard-coded to the Invest app on
                   every page, which only made sense on the Investment page.
                   The button now routes per current page:
                     investment    → Invest app /welcome (external)
                     infotainment  → that page's library section
                     entertainment → that page's library section
                     consulting    → live engagements section on consulting.html
                     anything else → site home
                   target="_blank" is only set for the external Invest app. -->
              <a class="header-launch" href="${exploreHref}"${exploreAttrs}
                 title="${exploreTitle}">
                <span class="header-launch__label">Explore</span>
                <span class="header-launch__arrow" aria-hidden="true">→</span>
              </a>
              <button class="theme-toggle" data-theme-toggle aria-label="Toggle theme"></button>
              <button class="menu-toggle" data-menu-toggle aria-label="Open menu" aria-expanded="false">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
            </div>
          </div>
        </header>`;
    }

    if (footerSlot) {
      footerSlot.outerHTML = `
        <footer class="site-footer">
          <div class="container">
            <div class="site-footer__top">
              <div class="footer-col">
                ${logo.replace('width="32" height="32"', 'width="28" height="28"')}
                <p style="margin-top: var(--space-4); color: var(--color-text-muted); font-size: var(--text-sm); max-width: 36ch;">
                  Practical ventures built in the open, with AI leading the operating model.
                </p>
              </div>
              <div class="footer-col">
                <h4>Practices</h4>
                <ul>
                  <li><a href="${base}verticals/investment.html">Investment</a></li>
                  <li><a href="${base}verticals/infotainment.html">Infotainment</a></li>
                  <li><a href="${base}verticals/consulting.html">Consulting</a></li>
                  <li><a href="${base}verticals/entertainment.html">Entertainment</a></li>
                  <li><a href="${base}verticals/gaming.html">Gaming</a></li>
                  <li><a href="${base}verticals/social.html">Social</a></li>
                  <li><a href="${base}verticals/pipeline.html">Pipeline</a></li>
                </ul>
              </div>
              <div class="footer-col">
                <h4>Company</h4>
                <ul>
                  <li><a href="${base}index.html#roadmap">Roadmap</a></li>
                  <li><a href="${base}index.html#waitlist">Waitlist</a></li>
                  <li><a href="mailto:hello@nyukd.com">hello@nyukd.com</a></li>
                </ul>
              </div>
              <div class="footer-col">
                <h4>Legal</h4>
                <ul>
                  <li><a href="${base}legal/terms.html">Terms &amp; Conditions</a></li>
                  <li><a href="${base}pricing.html">Pricing</a></li>
                  <li><a href="#">Privacy (coming)</a></li>
                </ul>
              </div>
            </div>
            <div class="site-footer__bottom">
              <span>© <span class="tabular">2025</span> NYUKD. All rights reserved.</span>
              <span>NYUKD.com · Built deliberately.</span>
            </div>
          </div>
        </footer>`;
    }
  }

  window.NYUKD = { mount };
})();
