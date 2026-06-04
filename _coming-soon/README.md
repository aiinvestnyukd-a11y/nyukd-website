# Coming Soon — pre-launch takedown for NYUKD.com

This folder contains two files that, when uploaded to your IONOS web root,
replace the entire marketing site with a single "Launching soon" page.

## Files

- `index.html` — the Coming Soon page (self-contained, no external CSS/JS).
- `.htaccess` — Apache rewrite rules. Every request (`/verticals/...`,
  `/pricing.html`, `/legal/terms.html`, anything) gets served the Coming
  Soon page. No 404s. URL bar keeps the original path.

## What's preserved

- `invest.nyukd.com` is a different subdomain on a Cloudflare tunnel to
  your Mac — it stays up. Invited users keep using the product.
- The Coming Soon page has a small "Already invited? Sign in →" link
  pointing at `https://invest.nyukd.com/auth/login` so invited users
  arriving at the front door can still get in.
- The waitlist form posts to `https://invest.nyukd.com/api/auth/local/waitlist`
  (the existing endpoint from the invite-only system). Submissions land
  in the same `waitlist_signups` SQLite table you've been minting invite
  codes from.

## To take down NYUKD.com

1. **Back up the live site** (optional but recommended).
   - In IONOS File Manager, select all current files in the web root and
     download a zip to your Mac. Save it as `nyukd-com-prelaunch-backup.zip`.

2. **Empty the IONOS web root.**
   - Delete every file/folder at the root: `index.html`, `assets/`,
     `css/`, `js/`, `verticals/`, `social/`, `pricing.html`, `legal/`.
   - The site is now technically offline. Visitors see an IONOS 404 page.

3. **Upload the two files in this folder.**
   - Drag `index.html` and `.htaccess` from `~/Documents/NYUKD Website/_coming-soon/`
     into the IONOS web root.

4. **Verify in a private browser window.**
   - Visit `https://nyukd.com/` — see the Coming Soon page.
   - Visit `https://nyukd.com/verticals/investment.html` — also see the
     Coming Soon page (the .htaccess rewrites it).
   - Visit `https://invest.nyukd.com/auth/login` — product login still
     works (different subdomain, different server).

## To bring NYUKD.com back

1. Re-upload the original site files from your backup zip (or from your
   local `~/Documents/NYUKD Website/` source tree — skip the `_coming-soon`
   folder).
2. Delete the `.htaccess` rewrite rules **or** replace with whatever your
   normal `.htaccess` is.
3. Hard-refresh `https://nyukd.com/` to confirm.

## Quick-toggle alternative (no IONOS upload needed)

If you'd rather flip on/off without touching IONOS each time, do it at
Cloudflare instead:

1. **Cloudflare dashboard** → `nyukd.com` zone → **Rules → Page Rules**.
2. New rule:
   - **URL:** `nyukd.com/*`
   - **Setting:** *Forwarding URL* → 302 Temporary Redirect →
     `https://invest.nyukd.com/auth/login` (or any other URL you want)
3. Save. Cloudflare serves the redirect before IONOS is reached — the
   marketing site is effectively offline within ~30 seconds.

To restore: disable or delete the page rule.

The IONOS upload route is more polished because visitors see your
branded Coming Soon page with a waitlist form. The Cloudflare route is
faster to toggle but bounces visitors to a login screen they can't use.

## Files won't change after upload

This folder is self-contained on disk. Nothing in this folder is
auto-deployed — you control when it goes live by uploading to IONOS or
flipping the Cloudflare rule. The source files stay in your repo.
