# Nuflow Reline App — project brief for Claude Code

This repo is the **Nuflow Reline App v1.0**, a mobile web app (PWA) for Nuflow reline
technicians and franchise partners. It is live at **https://app.nuflow.net**.
The owner is James (Nuflow Australasia). He reviews changes and approves pushes, so
explain what you changed and why in plain language, not just code.

Use Australian English in all user-facing text.

---

## Hosting and deploys

- GitHub org `nuflow-australasia`, repo `reline-app`, branch `main`.
- GitHub Pages with **Source: GitHub Actions** (not "deploy from branch").
- Custom domain `app.nuflow.net` (CNAME record → `nuflow-australasia.github.io`).
  The `CNAME` file in the repo is harmless; leave it alone.
- `.github/workflows/deploy.yml` runs on every push to `main`, every 30 minutes on a
  schedule, and on demand ("Run workflow"). It:
  1. copies the repo into `_site/` (excluding `.git`, `.github`, `scripts`, and the
     internal files `README.md`, `CLAUDE.md` and `home` so they aren't public on the site)
  2. runs `scripts/fetch-posts.mjs` to write `_site/posts.json`
  3. deploys `_site/` to Pages
- GitHub pauses scheduled workflows after 60 days with no commits. If Home posts go
  stale, check the Actions tab first.
- James usually publishes with GitHub Desktop, so keep the repo layout simple and
  avoid build steps that need local tooling.

## Everything here is public

The site, the repo (if public) and `posts.json` can all be read by anyone.

- **Never** put API keys, tokens or passwords in any file that ships to the browser.
- The only secret is `CIRCLE_API_TOKEN` (Circle Admin API v2), stored as a GitHub
  Actions secret and used only by `scripts/fetch-posts.mjs` at build time.
- The sign-in worker address (`AUTH_API` in `index.html`) is public by design; the
  worker holds its own secrets on Cloudflare.
- Do not add personal names to the UI, **except** the Contact us team list, which James
  approved (name, role, email, phone; no responsibilities). The signed-in account card
  shows the member's own email only, not their name.

---

## Files

| Path | What it is |
|---|---|
| `index.html` | The whole app shell: inline CSS, inline JS, logos embedded as base64 |
| `manifest.webmanifest`, `icons/` | Home-screen install (name "Nuflow Reline App", short name "Nuflow Reline") |
| `sw.js` | Service worker: offline support |
| `resin.html` | Resin usage |
| `cure.html` | Resin work & cure times |
| `bladder.html` | Bladder pressures |
| `depths.html` | Liner safe depths |
| `uv.html` | IMPREGLiner UV curing |
| `redline.html` | Redline calculator. **Removed from the app on purpose**; may still exist in the repo. Don't re-add it unless James asks |
| `scripts/fetch-posts.mjs` | Build-time script that pulls latest Circle posts into `posts.json` |
| `.github/workflows/deploy.yml` | Deploy + scheduled refresh |
| `home` | A single HTML file (no extension), titled "Nuflow Technician — Design Prototype". Not deployed. Ask James before changing or deleting |

The tools were redesigned in the app's dark style and these file names are final.
The old light versions live in James's "Light Webtools" folder and in the separate
`nuflow-tools` repo; **the app no longer uses `nuflow-tools`** (the deploy no longer
pulls it either). Edit tools here.

---

## Release checklist (every change that ships)

1. **Bump the cache version** in `sw.js`: `const CACHE = 'nuflow-tech-vN'`
   (currently `v12`). Without this, installed phones keep serving old files.
2. If a tool is added, renamed or removed, update **both**:
   - the `TOOLS` array in `index.html`
   - the `SHELL` list in `sw.js` (so it's saved for offline use)
3. Check JS syntax and test in a phone-sized viewport (see Testing).
4. Summarise the change for James in plain language.

The version label `NUFLOW RELINE APP v1.0` appears in three places in `index.html`:
the splash screen (`.splash-foot`), the Home footer and the More footer. Change all
three together.

---

## How the app works

### Sign-in (members only, live)
- Before using the app, people sign in with their Community Hub email and a 6-digit
  code that's emailed to them. The second `<script>` block in `index.html` (`Auth`)
  handles this.
- It talks to a Cloudflare Worker at `AUTH_API`
  (`https://nuflow-app-auth.james-d5c.workers.dev`), which uses the endpoints `/start`,
  `/verify`, `/session` and `/signout`. The worker checks Circle membership and sends
  the code. Its source (`auth-worker/worker.js`) is **not in this repo**.
- The session is stored in localStorage as `nf_auth_v1` and holds only the session,
  the member and `checkedAt`. Don't store Circle access tokens on the phone.
- Membership is re-checked at most every **12 h** when online. The app stays usable
  for **30 days** without a re-check, and after that it asks the member to sign in again.
- Set `AUTH_API = ''` to switch sign-in off.
- A phone that has **never** signed in needs signal for the first sign-in. Only after
  that do the tools work offline.

### Navigation
Five tabs: Home, Tools, Docs, Community, More.

### Tools tab
- `TOOLS` array entries: `t` title, `d` description, `c` colour (CSS var),
  `u` URL (relative, e.g. `cure.html`), `i` SVG icon paths, optional `key`.
- Tools open in the in-app viewer (iframe). Because they're same-origin, the service
  worker caches them and they **work fully offline**. This matters: techs use them on
  sites with poor or no signal.

### Offline (`sw.js`)
- On install, saves the app shell + all tool pages + external fonts and the IMPREG logo.
- Same-origin requests: network first, but after **3.5 s** falls back to the saved copy
  (patchy-signal handling).
- Fonts / IMPREG logo hosts: cache first, refresh in background.
- Everything else (Circle, shop, social links) goes straight to the network.
- When the app opens with signal, it posts `'refresh'` to the worker, which quietly
  re-downloads the shell and tools so offline copies stay current.
- Header pill shows `Online` or `Offline · tools ready` (live, via online/offline events).

### Home tab: "From the community"
- Reads `posts.json` (built every 30 min by the Action).
- `scripts/fetch-posts.mjs` fetches from Circle spaces
  `SPACE_IDS = [2038147 /* Updates */, 2039046 /* Community Feed */]`, merges, keeps
  the latest 5.
- **Only** `title`, `url`, `space`, `space_slug`, `published_at` may be written.
  Never post bodies, author names or emails. Never add head-office-only spaces
  (their titles would become public).
- Tapping a post opens the **full post URL without `?iframe=true`** in the Community
  tab, with a back arrow to Home. (On a post URL, `?iframe=true` embeds only the
  comment box.)
- If `posts.json` is empty or missing, Home shows "Latest updates unavailable".

### Community tab
- Embeds `https://community.nuflow.net/c/community-feed?iframe=true` (`COMM_URL`).
- Community Feed is a **private** Circle space. It works because the app and
  community share the `nuflow.net` domain, so the Circle login cookie is first-party.
  Don't move the app off a `nuflow.net` subdomain.
- Tapping the Community tab, or "View all" on Home, always resets to the feed.

### Docs and shop links
- `shop.nuflow.net` blocks being shown in an iframe. It's listed in
  `NO_FRAME_HOSTS` in `index.html`, so those links open in the phone's browser.
- To bring the shop in-app, the shop would need the header
  `Content-Security-Policy: frame-ancestors 'self' https://app.nuflow.net`,
  then remove it from `NO_FRAME_HOSTS`.

### More tab
- "Learn" (Circle courses) is **greyed out on purpose** with `soon:true`. Leave it
  disabled until James says to switch it on (then remove `soon:true`).
- Contact us: a "Head office" card (office line + admin@), then the team from the
  `CONTACTS` array in `index.html` (`n` name, `r` role, `e` email, `p` phone). Edit
  that array to update staff details. Responsibilities are left out on purpose.

---

## Design

- Dark-first glassmorphism UI, Montserrat.
- Colour tokens in `:root`, including:
  `--blueliner #4DC8ED`, `--nugreen #58A345`, `--pressureline #F7941D`,
  `--redline #F0534E`, plus `--nuvline` and `--nublue`.
- Product colours mean something: Redline red belongs to Redline, Pressureline
  orange to Pressureline, and so on. Don't reuse a product colour for an unrelated item.
  (Some existing items still use the product palette for variety, e.g. orange on cure
  times, safety documents and Marketing, and orange for the offline dot. Red is no
  longer used outside Redline.)
- Keep new screens consistent with existing components (cards, row items, pills).

---

## Testing

- Syntax-check the inline JS (extract `<script>` blocks and run `node --check`),
  plus `node --check sw.js`.
- Serve locally (`python3 -m http.server`) with a stub `posts.json` and test at
  ~400×860 in a headless browser. To get past sign-in, put a stub session in
  localStorage (`nf_auth_v1` = `{"session":"x","member":{"email":"a@b.c"},"checkedAt":<now>}`).
  Then check:
  - every tool opens in the viewer
  - with the network switched **off** after first load, the tools still open and
    the pill shows offline
  - no console errors

---

## Roadmap (context, not current tasks)

- **Members-only sign-in: now live** (see "Sign-in" above). It uses Circle Headless
  Auth, Cloudflare Workers and Resend. Next step: keep the worker source in version
  control.
- **Native app:** Capacitor (Ionic) builds for iOS and Android, replacing the old
  Gappsy app (pulled from Google Play in Jul 2025). Keep the web app
  Capacitor-friendly: relative paths, no server-only features.
- **One login** for Shop, IQ and Community Hub, with SSO across Circle, Nuhub and the app.
- **Nuflow IQ rebuild** (job logging, products used, GPS/address, warranty
  generation): planning stage only. Don't start building unless James asks.
