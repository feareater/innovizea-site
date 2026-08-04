# innovizea.com

Static site for **Innovizea LLC** — the company site (Salesforce consulting + our own
products), the app privacy policies, support/FAQ, and `app-ads.txt`.

No build step, no dependencies. Plain HTML/CSS; deploy the repo root as-is.

```
index.html          company home — consulting first, products below
consulting.html     Salesforce consulting practice
games.html          the 13-game Card Shark hub, links to each Play listing
thunk.html          Thunk: Shape Fit Puzzle
choptick.html       pointer to choptick.app (Choptick's real home)
race/index.html     Rocket Scooter Race — the game itself, playable at /race/
policies.html       privacy hub — one card per product, links to each policy
privacy.html        ⚠ Card Shark privacy policy  — REGISTERED URL, DO NOT MOVE
thunk-privacy.html  Thunk privacy policy (Thunk stores different things)
support.html        ⚠ support + FAQ             — REGISTERED URL, DO NOT MOVE
app-ads.txt         ⚠ AdMob authorized sellers  — REGISTERED URL, DO NOT MOVE
styles.css          neutral company shell + per-product accent tokens
assets/favicon.svg  the site mark; PNG/ICO renditions beside it + /favicon.ico
assets/icons/       15 app icons, 192px WebP
CNAME               innovizea.com (GitHub Pages apex)
```

## Rocket Scooter Race is a vendored copy

`race/index.html` is copied from **github.com/feareater/RocketScooterRace** (private, no Pages
of its own). It is one self-contained file — no external requests, no build, `localStorage`
only — which is why it can simply be dropped in and played at `/race/`.

**That repo is the source of truth.** To update: `cp` the file in, then re-apply the two
deltas, both marked with comments in the file — the `<title>` + favicon block in `<head>`,
and the `← innovizea.com` back link under the sidebar subtitle. The page is full-screen with
`overflow: hidden`, so without that link a visitor has no way back.

Note the site repo is **public** and RocketScooterRace is private. Hosting the game here
publishes its source — which is inherent to any client-side browser game (view-source shows
it to every player regardless), not a consequence of this arrangement.

## The site icon

`assets/favicon.svg` is the master: a slab "I" and the accent dot, the smallest piece of the
header wordmark that still reads at 16px. Drawn as `<rect>`/`<circle>`, never `<text>` — a
favicon cannot assume a font is installed. Every page links the SVG, `/favicon.ico` and an
apple-touch PNG.

Regenerate the raster sizes from the SVG with the headless-Chrome recipe under **Editing**
below; the `.ico` is a hand-built single-image container (6-byte ICONDIR + 16-byte entry +
PNG payload), which every current browser accepts.

⚠️ `--` is illegal inside an XML comment, so a comment mentioning CSS custom properties by
name silently makes the SVG undecodable. That cost a debugging cycle here.

## The three URLs that must never move

`app-ads.txt`, `privacy.html` and `support.html` are registered in Google Play and AdMob
against live listings. **GitHub Pages has no server-side redirects**, so moving any of them
silently breaks the thing it was created to fix.

- `privacy.html` is the privacy-policy URL on **all 13 Card Shark listings**. That field is
  *not* in the Play Publishing API (App content → Privacy policy) — a moved URL means
  thirteen manual edits in the console.
- `app-ads.txt` moving restarts AdMob's 24-hour detection window.

Change the *contents* freely. Do not change the *paths*.

## Why app-ads.txt exists here

AdMob could not verify the apps because the Play listings' developer website pointed at
`sites.google.com/view/cardshark21/home`. `sites.google.com` is shared hosting on the public
suffix list, so **you cannot place a file at its root** — app-ads.txt can never validate there.
AdMob reports this as *"your file is hosted on a domain that's not supported by the app-ads.txt
initiative."*

The fix is this file, served at `https://innovizea.com/app-ads.txt`, plus every app's Play
listing `contactWebsite` set to `https://innovizea.com`.

**One file covers all 13 apps** — they share the AdMob publisher ID `pub-5852780413067836`.

Do not reformat it. One record per line, no BOM, LF (pinned in `.gitattributes`), served as
`text/plain`.

Each AdMob app must also be **linked to its Play listing** (AdMob → app → app settings). Without
that link AdMob has no listing to read the developer website from, and verification can never
succeed no matter how correct the file is.

## Hosting: GitHub Pages — and NOT Cloudflare, deliberately

Served by **GitHub Pages** from `main` at the repo root. The repo is public because free-tier
Pages requires it.

> ⚠️ **Do not migrate this to Cloudflare Pages.** It was evaluated and rejected. Cloudflare
> needs the domain on its own nameservers to serve an apex domain, and **innovizea.com runs
> Microsoft 365 mail** (`innovizea-com.mail.protection.outlook.com`). Moving nameservers means
> migrating MX/SPF/DKIM/autodiscover and risking business email — to save nothing. GitHub Pages
> publishes an apex through four fixed A records and never touches mail.

DNS at GoDaddy:

```
@    A      185.199.108.153 / .109.153 / .110.153 / .111.153
www  CNAME  feareater.github.io
```

`CNAME` is committed in the repo; **Enforce HTTPS** is on.

## Verifying from Jeff's PC — two false alarms that will recur

Both are local, not the site:

1. **Norton MITMs TLS.** Local `curl` reads `CN=Norton Web/Mail Shield Root` instead of the real
   certificate and fails revocation. Use `curl -k`, or verify from outside the LAN.
2. **The Windows DNS client cache** can keep resolving the old GoDaddy IP long after `nslookup`
   shows the new one (`nslookup` queries the resolver directly and bypasses that cache). The
   giveaway is a GoDaddy *"Page Not Found"* on a path while `/` still returns 200. Fix with
   `ipconfig /flushdns`, plus `chrome://net-internals/#dns` → Clear host cache.

Definitive test that skips DNS entirely:

```bash
curl -k --resolve innovizea.com:443:185.199.108.153 https://innovizea.com/app-ads.txt
```

## Editing

**Adding a Card Shark game** — drop a 192px WebP into `assets/icons/`, copy an existing
`<li class="game">` in `games.html`, update the name, tag and package id. Source of truth for
names and packages is each game's `app.json` under `CardShark-Suite/`.

**Adding a product** — add a `<li>` to the `.products` list in `index.html` with a
`p-<name>` class, then define that class's `--p-accent` / `--p-wash` near the bottom of
`styles.css`. Nothing else needs to know it exists. Add `wide` to span the grid (used for
Rocket Scooter Race, which is a browser toy rather than a store app). A product with no app
icon uses `<span class="glyph">` with an emoji instead of an `<img>`, so its card header
still lines up with the others.

**Icons** are 192px WebP. App icons ship at 512–1024px and are far too heavy to use raw —
downscale them. There is no `sharp` or ImageMagick on this machine; the working recipe is
headless Chrome via `puppeteer-core` (borrow `Sequence Puzzle/tools/browser.mjs`, which uses
`pipe: true` because TCP to the devtools port is blocked here) and `canvas.toDataURL('image/webp')`.

**A new app needs its own privacy page.** Do not extend `privacy.html` to cover it. That
document says the apps are for a general adult audience and that we store no personal data on
our own servers — both false for Thunk, which is rated E for Everyone and writes a display name
to Firebase. It used to claim it covered "all" Innovizea apps "and future titles"; that scope was
narrowed on 2026-08-04.

The Card Shark policy text mirrors `CardShark-Suite/INNOVIZEA_PRIVACY_POLICY.md` — if you change
one, change the other, since that markdown is what the app stores reference.
