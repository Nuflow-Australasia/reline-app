# Nuflow Reline App v1.0

Live at: https://app.nuflow.net

- `index.html` — the app (self-contained: styles, scripts and logos are inline)
- `resin.html`, `cure.html`, `bladder.html`, `depths.html`, `uv.html` — the field tools (work offline)
- `manifest.webmanifest` + `icons/` — lets phones "Add to Home Screen" with the Nuflow icon
- `sw.js` — service worker; saves the app and tools so they work with no signal
- `scripts/fetch-posts.mjs` — pulls the latest Community Hub post titles into `posts.json`
- `.github/workflows/deploy.yml` — publishes the site to GitHub Pages

To publish an update, commit to `main` (e.g. with GitHub Desktop). The deploy runs
automatically, and again every 30 minutes to refresh the Home posts.

Every time you ship a change, bump `CACHE` in `sw.js` (e.g. `v11` → `v12`), or
installed phones keep showing the old version.

See `CLAUDE.md` for the full project notes. This file, `CLAUDE.md` and `home` are
not published to the live site.
