# NYUKD Brand Site — Handoff

## Project location
`/home/user/workspace/nyukd-site/`

Static multi-page site. No build step. Entry point: `index.html`.

## Deploy command (for parent agent)
```
deploy_website(
  project_path="/home/user/workspace/nyukd-site",
  site_name="NYUKD",
  entry_point="index.html"
)
```

## File map

```
nyukd-site/
├─ index.html                  Homepage: hero, 5 verticals, 5-phase roadmap, KPIs, waitlist
├─ assets/
│  ├─ logo.svg                 Custom mark: framed zigzag-N + cyan accent dot
│  └─ favicon.svg              Simplified favicon
├─ css/
│  ├─ tokens.css               Palette, fluid type scale, spacing, radii, shadows
│  ├─ base.css                 Reset, typography, .btn, .card, .pill, .container, grid
│  └─ app.css                  All component styles (header, hero, verticals, roadmap,
│                              waitlist, footer, page-hero, pathways, coming-soon,
│                              auth-shell, uc-shell, fade-up motion)
├─ js/
│  ├─ app.js                   Theme toggle, mobile nav, scroll fade-in (IO + rAF
│                              failsafe), waitlist sim, auth tab switch, sign-in redirect
│  └─ partials.js              Shared header/footer markup; window.NYUKD.mount({base, current})
├─ verticals/
│  ├─ consulting.html          About, methodology, case-study placeholders, credentials, testimonials
│  ├─ social.html              Principles + 3 access pathway cards → /social/{...}.html
│  ├─ gaming.html              Coming-soon: 5 learning lanes
│  ├─ infotainment.html        Coming-soon: 3 formats
│  └─ entertainment.html       Coming-soon: 3 formats
└─ social/
   ├─ adults.html              2-tab auth (Register / Sign in)
   ├─ institutions.html        2-tab (Apply / Invite code)
   ├─ kids.html                3-tab (Institution code / Parent-created / Kid + parent email)
   └─ welcome.html             Signed-in UC card; reads ?role= from URL
```

## Design system (where to change what)

| Want to change…                      | Edit                                           |
| ------------------------------------ | ---------------------------------------------- |
| Brand colors / palette / shadows     | `css/tokens.css`                               |
| Type scale, spacing, radii           | `css/tokens.css`                               |
| Button/card/grid primitives          | `css/base.css`                                 |
| Section components (hero, etc.)     | `css/app.css`                                  |
| Header / footer markup (sub-pages)   | `js/partials.js`                               |
| Header / footer markup (homepage)    | `index.html` (inline — kept in sync manually)  |
| Logo                                 | `assets/logo.svg` + same SVG inline in headers |
| Theme toggle / motion behavior       | `js/app.js`                                    |

## Brand decisions

- **Palette:** Midnight ink dark (`#0A0E1A`) / ivory light (`#F4F2ED`). Primary cyan-teal (`#0E7C7B` / `#3DD9D6` dark). Accent amber (`#C7641A` / `#F5B547` dark). Defined as light-mode by default with `[data-theme="dark"]` overrides.
- **Type:** Cabinet Grotesk display (500/700/800), Satoshi body (400/500/700), JetBrains Mono for eyebrows/labels. Loaded from Fontshare (`api.fontshare.com`).
- **Tone:** confident, deliberate, slightly witty — pull quotes like *"Built honestly, shipped slowly, signed with a source."* Witty signed-in line is verbatim from the brief: **"You're in early. The builders are still wearing hard hats."**
- **Logo:** rectangular frame containing a zigzag "N" path with a cyan accent dot at bottom-right. Wordmark `NY**U**KD` with the U colored in primary.
- **Layout:** 12-col verticals grid — Consulting + Social span 6, the three coming-soon practices span 4. 5-col roadmap collapses to 2-col then 1-col.
- **Coming-soon pattern:** dashed border + diagonal-stripe pattern + pulse-dot ticker. Reused on Gaming/Infotainment/Entertainment.
- **Sign-in flow:** form submit prevented; JS redirects to `../social/welcome.html?role=adult|institution|kid`. Welcome reads `?role=` and writes the matching label into `[data-uc-role]`.
- **`.js-ready` pattern:** `app.js` adds `js-ready` to `<html>` on load. The `.fade-up` opacity-0 baseline only applies under `.js-ready`, so no-JS users see content normally and slow IntersectionObservers can't strand cards. As a belt-and-braces fix, the homepage's vertical and roadmap cards do **not** carry `.fade-up` — they always render.

## Five-phase roadmap (homepage)

01 Brand site & waitlist · **Now** (highlighted)
02 Consulting content
03 Social MVP (3 pathways)
04 Gaming · Infotainment · Entertainment pilots
05 Domain · Email · Analytics · SEO launch ops

## QA snapshots in workspace

`qa-{home,consulting,social,gaming,infotainment,entertainment,adults,institutions,kids,welcome}-{desktop,mobile}.png`, plus `qa-home-dark-desktop.png`, `qa-home-mobile-verticals.png`, `qa-home-mobile-roadmap.png`, `qa-home-mobile-roadmap-bottom.png`.

All pages verified at 1280×800 desktop and 390×844 mobile. Theme toggle, mobile nav, kids tab switching, and sign-in → welcome redirect all functional.

## Known follow-ups (placeholders to fill later)

- Replace 3 case-study placeholder cards on `consulting.html` with real cases.
- Replace 3 testimonial placeholder cards on `consulting.html` with real quotes.
- Wire waitlist + auth forms to a real backend (currently simulated; no data leaves the page).
- Add real `/privacy.html`, `/terms.html`, `/trust.html` pages — footer links currently `#`.
- Optional: persist theme to `localStorage` if site moves off the sandboxed iframe.
- Optional: add `og:image`, real meta description per-page, and `sitemap.xml` for Phase 05.

## Editing conventions for future turns

1. **Copy lives in the HTML files** — no CMS, no JSON. Search-and-replace works.
2. **Design tokens are the single source of truth.** Do not hardcode colors/sizes in component CSS — extend tokens first.
3. **Header/footer:** if you change `js/partials.js`, also reflect the change in the inline header/footer in `index.html`.
4. **Adding a new vertical page:** copy any of `verticals/gaming.html` (coming-soon style) or `verticals/consulting.html` (full content). Both use the partials system for header/footer.
5. **Adding a sign-in surface:** use the `auth-shell` component class and add `data-signin="<role>"` to the form; JS handles the redirect to `welcome.html`.
