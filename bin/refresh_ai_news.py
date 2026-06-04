#!/usr/bin/env python3
"""
Refresh the daily AI news feed for the Infotainment pillar.

Writes a new  assets/data/ai_news.json  with the current day's top 5 AI news
items, and mirrors it to  _deploy/assets/data/ai_news.json  so a Cloudflare
Pages auto-deploy picks up the change.

Default mode: aggregates from public RSS feeds (no API key, no LLM cost).
Optional mode: --summarise   uses the Anthropic API to write a 1-line
                              summary per item (~$0.01/day at current rates).
                              Set ANTHROPIC_API_KEY in NYUKD Website/.env.

USAGE
  python3 bin/refresh_ai_news.py
  python3 bin/refresh_ai_news.py --summarise         # with LLM summaries
  python3 bin/refresh_ai_news.py --dry-run           # preview, don't write

Wire it to a daily cron / launchd / GitHub Action — see CLOUDFLARE_DEPLOY.md.
"""
import json, os, sys, urllib.request, urllib.error, xml.etree.ElementTree as ET
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PRIMARY = os.path.join(ROOT, "assets", "data", "ai_news.json")
OUT_MIRROR  = os.path.join(ROOT, "_deploy", "assets", "data", "ai_news.json")

# ── Curated AI sources (RSS) ────────────────────────────────────────────────
# Pick feeds that are advertiser-safe, reliably updated, and clearly tagged.
FEEDS = [
    ("Anthropic",        "https://www.anthropic.com/news/rss.xml",                "Companies"),
    ("OpenAI",           "https://openai.com/blog/rss.xml",                       "Models"),
    ("Google DeepMind",  "https://deepmind.google/blog/rss.xml",                  "Models"),
    ("TechCrunch AI",    "https://techcrunch.com/category/artificial-intelligence/feed/", "Industry"),
    ("The Verge AI",     "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml", "Industry"),
]
ITEMS_PER_FEED = 2
MAX_ITEMS      = 5
UA = "NYUKD-news-refresh/1.0 (+https://nyukd.com)"


def fetch(url, timeout=15):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/xml, text/xml"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def parse_feed(source, url, tag):
    """Pull title, link, brief excerpt from an RSS or Atom feed. Best-effort."""
    try:
        raw = fetch(url)
    except Exception as e:
        print(f"  ! {source}: {e}", file=sys.stderr)
        return []
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as e:
        print(f"  ! {source}: parse error {e}", file=sys.stderr)
        return []
    out = []
    # RSS 2.0
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        link  = (item.findtext("link")  or "").strip()
        desc  = (item.findtext("description") or "").strip()
        if title and link:
            out.append({"tag": tag, "headline": title, "summary": _trim(desc, 220),
                        "source": source, "url": link})
        if len(out) >= ITEMS_PER_FEED: break
    if out: return out
    # Atom fallback
    ns = {"a": "http://www.w3.org/2005/Atom"}
    for entry in root.iter("{http://www.w3.org/2005/Atom}entry"):
        title = (entry.findtext("a:title", default="", namespaces=ns) or "").strip()
        link_el = entry.find("a:link[@rel='alternate']", ns) or entry.find("a:link", ns)
        link  = link_el.get("href") if link_el is not None else ""
        summary = (entry.findtext("a:summary", default="", namespaces=ns)
                or entry.findtext("a:content", default="", namespaces=ns) or "").strip()
        if title and link:
            out.append({"tag": tag, "headline": title, "summary": _trim(summary, 220),
                        "source": source, "url": link})
        if len(out) >= ITEMS_PER_FEED: break
    return out


def _trim(s, n):
    import re
    s = re.sub(r"<[^>]+>", "", s)             # strip HTML tags
    s = re.sub(r"\s+", " ", s).strip()
    return s if len(s) <= n else s[:n].rsplit(" ", 1)[0] + "…"


def maybe_llm_summarise(items):
    """Optional Anthropic-API pass: rewrite each item's summary in 1 tight line."""
    api_key = os.environ.get("ANTHROPIC_API_KEY") or _read_env_key()
    if not api_key:
        print("  (no ANTHROPIC_API_KEY set — skipping LLM summarise)", file=sys.stderr)
        return items
    # Build one prompt with all items; ask for 1-line summaries in the same order.
    bullets = "\n".join(f"{i+1}. [{it['source']}] {it['headline']} — {it['summary']}"
                       for i, it in enumerate(items))
    prompt = ("Rewrite each item below as ONE tight sentence (≤ 24 words) suitable for "
              "a daily-AI-news short. Keep it factual and advertiser-safe. Return ONLY a "
              "numbered list in the same order — no preamble.\n\n" + bullets)
    body = {
        "model": "claude-sonnet-4-6",
        "max_tokens": 600,
        "messages": [{"role": "user", "content": prompt}],
    }
    req = urllib.request.Request("https://api.anthropic.com/v1/messages",
                                 data=json.dumps(body).encode(), method="POST")
    req.add_header("x-api-key", api_key)
    req.add_header("anthropic-version", "2023-06-01")
    req.add_header("content-type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            resp = json.loads(r.read())
    except Exception as e:
        print(f"  ! Anthropic call failed: {e}; keeping RSS summaries", file=sys.stderr)
        return items
    text = "".join(b.get("text", "") for b in resp.get("content", []) if b.get("type") == "text")
    # Parse "1. ...\n2. ..." back into the list
    import re
    lines = [re.sub(r"^\s*\d+[\.\)]\s*", "", ln).strip() for ln in text.splitlines() if ln.strip()]
    for i, ln in enumerate(lines[:len(items)]):
        if ln:
            items[i]["summary"] = ln
    return items


def _read_env_key():
    env_path = os.path.join(ROOT, ".env")
    if not os.path.exists(env_path): return None
    for line in open(env_path):
        line = line.strip()
        if line.startswith("ANTHROPIC_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def main():
    summarise = "--summarise" in sys.argv
    dry_run = "--dry-run" in sys.argv

    print(f"Refreshing AI news ({datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')})…")
    all_items = []
    for source, url, tag in FEEDS:
        print(f"  · {source}", file=sys.stderr)
        all_items.extend(parse_feed(source, url, tag))

    # Dedup by URL, cap at MAX_ITEMS
    seen = set(); items = []
    for it in all_items:
        if it["url"] in seen: continue
        seen.add(it["url"])
        items.append(it)
        if len(items) >= MAX_ITEMS: break

    if not items:
        print("No items pulled — aborting (keeping existing JSON)", file=sys.stderr)
        sys.exit(1)

    if summarise:
        items = maybe_llm_summarise(items)

    out = {
        "updated": datetime.now(timezone.utc).date().isoformat(),
        "tagline": "Five things worth knowing. Refreshed daily.",
        "items": items,
    }

    if dry_run:
        print(json.dumps(out, indent=2))
        return

    os.makedirs(os.path.dirname(OUT_PRIMARY), exist_ok=True)
    os.makedirs(os.path.dirname(OUT_MIRROR),  exist_ok=True)
    with open(OUT_PRIMARY, "w") as f: json.dump(out, f, indent=2)
    with open(OUT_MIRROR,  "w") as f: json.dump(out, f, indent=2)
    print(f"Wrote {len(items)} items to {OUT_PRIMARY} (+ mirror).")


if __name__ == "__main__":
    main()
