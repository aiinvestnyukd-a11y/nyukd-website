/* NYUKD — site behavior */
(function () {
  // Theme toggle.
  // Dark is the default. Visitors who explicitly toggle to light get their
  // choice remembered (localStorage). Visitors with no stored preference
  // see dark regardless of OS setting — matches the product side which is
  // dark-first.
  const root = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');
  const stored = (function () { try { return localStorage.getItem('nyukd-theme'); } catch (_) { return null; } })();
  let mode = stored === 'light' || stored === 'dark' ? stored : 'dark';

  function applyTheme(m) {
    root.setAttribute('data-theme', m);
    if (toggle) {
      toggle.setAttribute('aria-label', 'Switch to ' + (m === 'dark' ? 'light' : 'dark') + ' mode');
      toggle.innerHTML =
        m === 'dark'
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
  }
  applyTheme(mode);
  if (toggle) {
    toggle.addEventListener('click', () => {
      mode = mode === 'dark' ? 'light' : 'dark';
      applyTheme(mode);
      try { localStorage.setItem('nyukd-theme', mode); } catch (_) { /* private mode */ }
    });
  }

  // Mobile nav
  const menuBtn = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-site-nav]');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      nav.classList.toggle('is-open');
      const open = nav.classList.contains('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  // Scrolled header
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 8) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Reveal on scroll. Add js-ready so the fade-up baseline state only applies
  // when JS is running.
  document.documentElement.classList.add('js-ready');
  const items = document.querySelectorAll('.fade-up');
  if ('IntersectionObserver' in window && items.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );
    items.forEach((el) => io.observe(el));
    // Failsafe: items already in view at load (above the fold) get marked visible immediately
    requestAnimationFrame(() => {
      items.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-visible');
      });
    });
  } else {
    items.forEach((el) => el.classList.add('is-visible'));
  }

  // Waitlist forms — POSTs to invest.nyukd.com's local-auth waitlist
  // endpoint, which writes to the SQLite waitlist_signups table that the
  // operator mints invite codes from (see Dashboard/scripts/manage_invites.py).
  // CORS is allow-listed for nyukd.com in auth/local_routes.py.
  const WAITLIST_ENDPOINT = 'https://invest.nyukd.com/api/auth/local/waitlist';
  document.querySelectorAll('[data-waitlist-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = form.querySelector('input[name="email"]');
      const interestSelect = form.querySelector('select[name="interest"]');
      const submitBtn = form.querySelector('button[type="submit"]');
      const successEl = form.querySelector('.form-success');
      const email = (emailInput && emailInput.value || '').trim();
      const interest = (interestSelect && interestSelect.value || '').trim();
      if (!email) return;
      if (submitBtn) submitBtn.disabled = true;
      const payload = { email: email };
      if (interest) payload.notes = 'interest: ' + interest;
      fetch(WAITLIST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors',
        credentials: 'omit',
      })
        .then((r) => r.json().catch(() => ({})).then((d) => ({ status: r.status, data: d })))
        .then((res) => {
          if (res.status >= 200 && res.status < 300) {
            form.classList.add('is-submitted');
            if (successEl && res.data && res.data.message) {
              const strong = successEl.querySelector('strong');
              if (strong) strong.textContent = res.data.message;
            }
          } else {
            if (submitBtn) submitBtn.disabled = false;
            alert("Couldn't submit — try again in a moment, or email hello@nyukd.com.");
          }
        })
        .catch(() => {
          if (submitBtn) submitBtn.disabled = false;
          alert('Network error — try again, or email hello@nyukd.com.');
        });
    });
  });

  // Auth tabs
  document.querySelectorAll('[data-auth-tabs]').forEach((group) => {
    const tabs = group.querySelectorAll('button[role="tab"]');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
        tab.setAttribute('aria-selected', 'true');
        const target = tab.getAttribute('data-tab');
        const panels = group.parentElement.querySelectorAll('[data-tab-panel]');
        panels.forEach((p) => {
          p.hidden = p.getAttribute('data-tab-panel') !== target;
        });
      });
    });
  });

  // Sign-in simulated -> redirect to under-construction
  document.querySelectorAll('[data-signin]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const role = form.getAttribute('data-signin') || 'member';
      window.location.href = '../social/welcome.html?role=' + encodeURIComponent(role);
    });
  });

  // Welcome page role
  const ucRole = document.querySelector('[data-uc-role]');
  if (ucRole) {
    const params = new URLSearchParams(window.location.search);
    const role = (params.get('role') || 'member').toLowerCase();
    const labels = {
      adult: 'Adult member',
      institution: 'Institution admin',
      kid: 'Kid (verified)',
      member: 'Member',
    };
    ucRole.textContent = labels[role] || 'Member';
  }
})();
