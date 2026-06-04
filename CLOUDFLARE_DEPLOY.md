# Cloudflare auto-deploy + daily AI news automation

A guide to **stop manually deploying the site** and **keep the daily AI news
section fresh** without you touching it.

The two halves work together:

```
   ┌────────────────────┐    ┌──────────────────────┐    ┌────────────────────┐
   │ refresh_ai_news.py │ →  │ git commit + push    │ →  │ Cloudflare Pages   │
   │ (cron, daily 06:00)│    │ to GitHub            │    │ auto-deploys       │
   └────────────────────┘    └──────────────────────┘    └────────────────────┘
```

Once both halves are wired, **the site updates itself every morning** with no
manual step. You only intervene to add new episodes / pages.

---

## Part 1 — Auto-deploy via Cloudflare Pages (recommended)

This is the standard, free, no-friction path. The website folder becomes a Git
repo connected to a Cloudflare Pages project; every `git push` triggers a
deploy in ~30 seconds.

### One-time setup (≈10 min)

1. **Make this folder a Git repo:**
   ```bash
   cd "/Users/nyukd/Documents/NYUKD Website"
   git init
   git add .
   git commit -m "initial NYUKD marketing site"
   ```

2. **Create a private GitHub repo** (e.g. `nyukd-website`) and push:
   ```bash
   gh repo create nyukd-website --private --source=. --remote=origin --push
   # or, without gh:
   # git remote add origin git@github.com:<you>/nyukd-website.git
   # git branch -M main
   # git push -u origin main
   ```

3. **Connect to Cloudflare Pages:**
   - Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git
   - Pick the `nyukd-website` repo, branch `main`
   - **Build settings:** leave blank — this is a static site, no build step.
     - Build command: *(empty)*
     - Build output directory: `/` (project root)
   - Click **Save and Deploy**

4. **Point your domain at it:**
   - Cloudflare Pages project → Custom domains → Set up custom domain
   - Add `nyukd.com` (and `www.nyukd.com` if you want both)

After that, every `git push` deploys live in ~30s. The previous deploy stays
available for instant rollback.

### Day-to-day workflow

```bash
cd "/Users/nyukd/Documents/NYUKD Website"
# … edit something (new episode card, tweak copy, drop a clip) …
git add -A
git commit -m "EP05 Sinha published"
git push
# done — nyukd.com is live in 30s
```

### What to commit / what to ignore

Add a `.gitignore` for files you don't want pushed:

```bash
cat > .gitignore <<'EOF'
.DS_Store
*.bak
qa-*.png
_deploy/   # the manually-maintained mirror is local-only
EOF
git add .gitignore && git commit -m "ignore local cruft"
```

(With Cloudflare Pages serving from `/` directly, the `_deploy/` mirror is
redundant — you can keep it as a local snapshot folder or stop maintaining it.)

### Alternative — Wrangler CLI (no Git)

If you'd rather skip Git and deploy on demand:

```bash
brew install cloudflare-wrangler   # one-time
wrangler login                      # browser auth
wrangler pages deploy . --project-name=nyukd-website
```

Scriptable, but you lose the "every change auto-deploys" benefit.

---

## Part 2 — Daily AI news refresh

The Infotainment "Today in AI" section reads from `assets/data/ai_news.json`.
`bin/refresh_ai_news.py` regenerates that file from a curated RSS list.

### Manual run

```bash
cd "/Users/nyukd/Documents/NYUKD Website"
python3 bin/refresh_ai_news.py            # RSS-only, $0
python3 bin/refresh_ai_news.py --summarise  # tighter summaries via Claude API (~$0.01/day)
python3 bin/refresh_ai_news.py --dry-run   # preview, no writes
```

The script writes both `assets/data/ai_news.json` **and** the `_deploy/` mirror.

### Daily automation on your Mac (launchd, free, runs even when laptop sleeps if plugged in)

Drop this into `~/Library/LaunchAgents/com.nyukd.news.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.nyukd.news</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string><string>-c</string>
    <string>cd "/Users/nyukd/Documents/NYUKD Website" &amp;&amp; /usr/bin/python3 bin/refresh_ai_news.py &amp;&amp; /usr/bin/git add assets/data/ai_news.json _deploy/assets/data/ai_news.json &amp;&amp; /usr/bin/git diff --staged --quiet || /usr/bin/git commit -m "daily AI news refresh" &amp;&amp; /usr/bin/git push</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>6</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>/Users/nyukd/Library/Logs/nyukd-news.log</string>
  <key>StandardErrorPath</key><string>/Users/nyukd/Library/Logs/nyukd-news.log</string>
</dict></plist>
```

Then load it:

```bash
launchctl load ~/Library/LaunchAgents/com.nyukd.news.plist
# … to disable later: launchctl unload ~/Library/LaunchAgents/com.nyukd.news.plist
```

The job fires every day at 06:00, refreshes the JSON, commits if anything
changed, pushes — and Cloudflare Pages deploys in ~30s. Logs go to
`~/Library/Logs/nyukd-news.log`.

### Daily automation in the cloud (GitHub Actions, free, no Mac required)

If you'd rather not depend on your laptop being on, add
`.github/workflows/daily-news.yml`:

```yaml
name: Daily AI news refresh
on:
  schedule: [{ cron: "0 6 * * *" }]   # 06:00 UTC daily
  workflow_dispatch:                  # also run manually from the Actions tab
jobs:
  refresh:
    runs-on: ubuntu-latest
    permissions: { contents: write }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.x" }
      - run: python3 bin/refresh_ai_news.py
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}   # optional
      - name: Commit + push if changed
        run: |
          git config user.name "nyukd-bot"
          git config user.email "bot@nyukd.com"
          git add assets/data/ai_news.json _deploy/assets/data/ai_news.json
          git diff --staged --quiet || (git commit -m "daily AI news refresh" && git push)
```

To enable LLM summarisation in the cloud, add `ANTHROPIC_API_KEY` under
Repo → Settings → Secrets and variables → Actions.

---

## Part 3 — How the daily news section behaves

- **Fetches** `assets/data/ai_news.json` at page load.
- **Falls back** to an inline snapshot in the HTML if the fetch fails (so
  `file://` previews and offline first-paint still render five cards).
- Each card shows: category tag (Models / Companies / Enterprise / …),
  headline, 1–2 line summary, source link (opens in new tab).
- The date stamp at the top of the section updates from the JSON's
  `updated` field.
- The fallback inline data should be refreshed manually every few weeks so
  the offline state doesn't get too stale; the daily script handles the live state.

---

## What's deployed today

After this commit, the site has:

- **4 Entertainment episodes live** (Koepcke, Sullivan, Yamaguchi, Manjhi)
- **1 Infotainment episode live** (From AI pilot to real adoption)
- **Daily AI news section** on the Infotainment page, seeded with five
  current items dated 2026-06-04.

Once Part 1 is wired, this is what goes live on `nyukd.com` on your next push.
