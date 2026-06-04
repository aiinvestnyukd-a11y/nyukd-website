# NYUKD.com + app.nyukd.com — Deploy run-book

Path C: marketing site on IONOS, InvestAI product on `app.nyukd.com` via
Cloudflare named tunnel pointing to your Mac.

Phases 1, 2, and 3 run **in parallel** to minimise wall-clock time.

---

## Phase 1 — Upload marketing site to IONOS (~30 min)

### 1a. What to upload

From `~/Documents/NYUKD Website/`, **include these**:

- `index.html`
- `assets/` (logo.svg, favicon.svg, thumbnails)
- `css/` (tokens.css, base.css, app.css)
- `js/` (app.js, partials.js)
- `verticals/` (all 6 .html files)
- `social/` (all 4 .html files)

**Skip these** (dev artifacts, not production):

- `HANDOFF.md`
- `DEPLOY.md` (this file)
- `qa-*.png` (QA screenshots — 22 files, ~5 MB)
- `.DS_Store`

### 1b. IONOS file upload — easiest path

Log in to **my.ionos.com** → **Hosting** → click your NYUKD.com hosting
contract → **File Management** (a web-based FTP-style UI).

Navigate to your web root. On IONOS shared hosting plans this is typically
`/clickandbuilds/<sitename>/` or just `/` depending on the plan. The
existing folder has a placeholder `index.html` from IONOS — overwrite it.

Drag and drop the folders/files listed in 1a from your Mac Finder into the
file manager. Wait for upload to finish (the 6 HTML pages + CSS + JS + a
handful of SVGs ≈ ~1 MB, completes in under a minute).

Alternative if you prefer SFTP: in IONOS panel, **Hosting → SFTP & SSH
Access**. Get hostname + username + set password. Then on your Mac:

```bash
# in Terminal — replace user@host with your IONOS SFTP creds
cd "/Users/nyukd/Documents/NYUKD Website"
sftp u123456@access-XXXXX.webspace-host.com
# inside sftp prompt:
cd /                                 # or /clickandbuilds/<sitename>
put -r index.html assets css js verticals social
quit
```

### 1c. Verify

Visit `https://nyukd.com` in a browser. The new marketing site should load.
Click **Investment** in the nav → see the "Sign in to InvestAI" panel.

> The Sign in buttons will fail right now — that's expected. They point at
> `127.0.0.1:8080`. We update them in Phase 6.

---

## Phase 2 — Cloudflare account + add nyukd.com (~10 min)

### 2a. Create a free Cloudflare account

Go to **dash.cloudflare.com/sign-up**. Email + password. Verify email.

### 2b. Add nyukd.com as a site

Cloudflare dashboard → **Add a site** → enter `nyukd.com` → **Free** plan
(£0). Click **Continue**.

Cloudflare scans your existing DNS records (via IONOS) and imports them.
**Review the imported list carefully** — anything Cloudflare missed will
go offline when you switch nameservers. Common things that may need
manual adding:

- MX records (email) — if you have email at IONOS, copy them across exactly
- TXT records (SPF, DKIM, domain verifications)
- Any subdomains you use (`www`, `mail`, etc.)

Click **Continue**.

### 2c. Note the two Cloudflare nameservers

Cloudflare shows you two nameservers like:

```
naomi.ns.cloudflare.com
walt.ns.cloudflare.com
```

(yours will be different — name pairs are assigned per account)

**Copy them.** You'll paste them at IONOS in Phase 3.

---

## Phase 3 — Switch nameservers at IONOS (~5 min user time + propagation)

In **IONOS my.ionos.com** → **Domains & SSL** → click nyukd.com → look for
**Nameserver** or **DNS** settings.

Find the option **"Use other nameservers"** (or similar wording — varies by
IONOS UI version). Paste the two Cloudflare nameservers, replacing
whatever's there. **Save**.

DNS propagation kicks in. Cloudflare's panel will show your zone as
**"Pending nameserver update"** until it sees the change worldwide. This
takes **15 min to a few hours**, very rarely longer.

You can monitor:

```bash
dig +short NS nyukd.com
# Should eventually show *.ns.cloudflare.com — when it does, you're propagated
```

Cloudflare will also email you "Your zone is active" when ready.

> **Important:** IONOS is still your **registrar** (domain ownership). Only
> the DNS lookup is moved to Cloudflare. Your domain renewal, ownership,
> WHOIS info all stay at IONOS unchanged.

---

## Phase 4 — Install cloudflared on Mac (~10 min)

Pick one path:

### 4a. Direct binary download (no Homebrew needed)

```bash
# Check your architecture:
uname -m
# arm64 = Apple Silicon (M1/M2/M3/M4)
# x86_64 = Intel Mac
```

For Apple Silicon:
```bash
sudo curl -L --output /usr/local/bin/cloudflared \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64
sudo chmod +x /usr/local/bin/cloudflared
```

For Intel:
```bash
sudo curl -L --output /usr/local/bin/cloudflared \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64
sudo chmod +x /usr/local/bin/cloudflared
```

Verify:
```bash
cloudflared --version
# should print: cloudflared version 2025.x.x ...
```

### 4b. Log cloudflared into your Cloudflare account

```bash
cloudflared tunnel login
```

This opens a browser tab to Cloudflare. Pick **nyukd.com**, click
**Authorize**. The CLI receives a certificate stored at
`~/.cloudflared/cert.pem`.

---

## Phase 5 — Create the named tunnel + DNS route (~10 min)

### 5a. Create the tunnel

```bash
cloudflared tunnel create nyukd-invest
```

This prints something like:

```
Created tunnel nyukd-invest with id 0123abcd-4567-89ef-...
```

**Copy the tunnel UUID.** You'll paste it in 5b.

### 5b. Write the tunnel config

Create `~/.cloudflared/config.yml` with this content (substitute YOUR
tunnel UUID):

```yaml
tunnel: 0123abcd-4567-89ef-...   # <-- your tunnel UUID
credentials-file: /Users/nyukd/.cloudflared/0123abcd-4567-89ef-....json

ingress:
  - hostname: app.nyukd.com
    service: http://127.0.0.1:8080
  - service: http_status:404      # catch-all: 404 for anything else
```

Quickest way from Terminal:
```bash
nano ~/.cloudflared/config.yml
# paste content, edit UUID, save (Ctrl-O, Enter), exit (Ctrl-X)
```

### 5c. Add the DNS route in Cloudflare

```bash
cloudflared tunnel route dns nyukd-invest app.nyukd.com
```

This creates a CNAME at Cloudflare DNS: `app.nyukd.com → <UUID>.cfargotunnel.com`.

### 5d. Run the tunnel

```bash
cloudflared tunnel run nyukd-invest
```

Leave that Terminal window open. The tunnel is now live. As long as this
process keeps running AND your Dashboard is running on `127.0.0.1:8080`,
visitors to `https://app.nyukd.com` will reach your Mac.

> To run the tunnel as a background service that survives logout, see
> Phase 7 ("Keep it running") below. For today's first launch the
> foreground process is fine.

---

## Phase 6 — Wire the marketing site to the new URL (~5 min)

### 6a. Update Supabase

**dashboard.supabase.com** → your project → **Authentication** → **URL
Configuration**:

- **Site URL:** `https://app.nyukd.com`
- **Redirect URLs:** add `https://app.nyukd.com` AND `https://app.nyukd.com/*`
  (the wildcard pattern, exactly as written)

Save.

### 6b. Update INVEST_APP_URL on the marketing site

Open `~/Documents/NYUKD Website/js/partials.js`. Near the top:

```js
const INVEST_APP_URL = 'http://127.0.0.1:8080/welcome';
```

Change to:

```js
const INVEST_APP_URL = 'https://app.nyukd.com/welcome';
```

Save.

### 6c. Re-upload only partials.js to IONOS

Same upload method as Phase 1, but only this one file:
`js/partials.js`. Drag into IONOS file manager, **Overwrite**.

---

## Phase 7 — End-to-end test (~5 min)

Visit each in order:

1. `https://nyukd.com/` → loads the marketing site
2. `https://nyukd.com/verticals/investment.html` → loads the Investment page with the "Sign in to InvestAI" panel
3. Click **Sign in to InvestAI** → opens `https://app.nyukd.com/welcome` (https, real cert, your dashboard's landing page)
4. Click "Create account" tab in the modal → register a fresh test email
5. After signing in → auto-redirects to `https://app.nyukd.com/performance` and shows your live dashboard with admin pill visible (if you used the AUTH_SUPER_ADMINS email)

If all five work, you're live.

---

## Keep it running (after first launch)

The tunnel + Dashboard need to stay up. Three things to set up:

### Prevent Mac sleep

```bash
# Prevent display + system sleep while plugged in
sudo pmset -c displaysleep 0 sleep 0
```

(Reverse with `sudo pmset -c displaysleep 10 sleep 30` later.)

### Auto-start cloudflared on boot

```bash
sudo cloudflared --config /Users/nyukd/.cloudflared/config.yml service install
sudo launchctl start com.cloudflare.cloudflared
```

Now cloudflared runs as a system service. Survives logout. Restarts on
boot. Logs to `/Library/Logs/com.cloudflare.cloudflared.out.log`.

### Auto-start the Dashboard server (already covered by launchd)

You already have launchd plists for the four trading bots. The Dashboard
itself isn't currently autostarted — for tonight you can just leave it
running in a Terminal tab. We can add a launchd plist for the Dashboard
as a follow-up (~5 min addition).

---

## Troubleshooting

**"DNS_PROBE_FINISHED_NXDOMAIN" when visiting nyukd.com**
DNS hasn't propagated yet from Phase 3. Wait 15-60 min. Check `dig +short NS nyukd.com`.

**"This site can't be reached" when visiting app.nyukd.com**
Cloudflare tunnel isn't running OR Dashboard server isn't running on port 8080. Run `cloudflared tunnel info nyukd-invest` to check tunnel state.

**Sign-in works but the modal flashes and reverts**
Supabase redirect URLs not updated for the new domain. Phase 6a.

**"Mixed content blocked" in browser console**
Some asset hardcoded to http://. Search for `http://127.0.0.1` across the codebase and replace with the new URL.
