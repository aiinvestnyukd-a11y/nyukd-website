# Video library — how to publish a clip

This is the interim publishing home for NYUKD content (until the social accounts
exist). Videos shown on the Entertainment and Infotainment pillar pages are served
from here.

## Folders
- `entertainment/` — "No Way That's Real" shorts (9:16).
- `infotainment/` — AI transformation / adoption explainers.

## To publish a video (2 steps)
1. **Drop the file** into the right folder, e.g.
   `assets/video/entertainment/ep01-koepcke.mp4`
   (9:16, 1080×1920, H.264 MP4. Optional poster image alongside it, e.g. `ep01-koepcke.jpg`.)
2. **Flip it live** in the page's data array:
   - Entertainment list lives in `verticals/entertainment.html` (the `NYUKD_LIBRARY` block).
   - Infotainment list lives in `verticals/infotainment.html`.
   - Change that episode's entry from:
     `status: "coming"`  →  `status: "live", src: "ep01-koepcke.mp4"`
     (add `poster: "ep01-koepcke.jpg"` if you made one).

That's it — the gallery renders it automatically. No build step.

## Reminders
- Keep the on-screen AI-rendered disclosure + the sources (the packets in
  `~/Documents/NYUKD Entertainment/` already include both).
- Mirror any edit to the matching path under `_deploy/` before deploying.
- Each short is ~10–30 MB; fine to self-host on Cloudflare for the launch phase.
  Move to embeds once the YouTube/TikTok channels are live.
