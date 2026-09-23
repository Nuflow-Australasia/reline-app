# Nuflow Reline App v1.0

Live at: https://nuflow-australasia.github.io/reline-app/

- `index.html` — the app (self-contained: styles, scripts and logos are inline)
- `manifest.webmanifest` + `icons/` — lets phones "Add to Home Screen" with the Nuflow icon
- `sw.js` — service worker; keeps the last-loaded app shell available offline

To publish an update, replace `index.html` and commit to `main`.
If phones keep showing an old version, change `CACHE` in `sw.js` (e.g. `v1` → `v2`).
