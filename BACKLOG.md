# innovizea.com — Backlog

**Status** `NOW` · `NEXT` · `LATER` · `BLOCKED` · `DONE` · `CANCELLED` (with a reason).
**Owner** `JEFF` needs console access or a decision · `CLAUDE` code · `BOTH`. **Size** `S`/`M`/`L`/`XL`.

> The live public site for Innovizea LLC — consulting, the product hub, the app privacy
> policies, support, and `app-ads.txt`. Static HTML/CSS, no build, served by **GitHub Pages**
> from `main` at the repo root.
>
> ⛔ **Three paths must never move**, because they are registered against live listings:
> `privacy.html` (the privacy policy on all 13 Card Shark listings), `support.html`, and
> `app-ads.txt`. GitHub Pages has no server-side redirects, so moving one silently breaks the
> exact thing it was created to fix. Change the contents freely; never the paths.

---

## EPIC-1 · Adopt the new brand

### SITE-1 · Replace the slab-I favicon with the H·2 mark
**Status** DONE · **Owner** CLAUDE · **Size** S

**Done** in `e101bc6`. Tracked from the brand side as BRAND-1.

The site used to wear `assets/favicon.svg`, the slab "I" — but **innovizea-brand** had settled
on the H·2 mark and the Drydock palette, and this site is one of only two places Innovizea is
currently visible as a brand at all.

That is the whole argument for doing it now: switching cost is near zero today and rises with
every app that adopts either mark. Two marks for one company is the thing the brand study
started over.

Regenerate the raster sizes with `innovizea-brand/render.mjs` rather than by hand — it is
deterministic and covers all five favicon sizes.

- [x] `assets/favicon.svg` → the H·2 mark
- [x] Regenerate `/favicon.ico` and the apple-touch PNG
- [x] Check it at 16px, where the old mark's whole design argument lived — the on-light accents
      in the file are the outcome of that check

### SITE-2 · The race/ update instructions are wrong
**Status** DONE · **Owner** CLAUDE · **Size** S

**Done 2026-08-29.** Tracked from the game's side as RACE-2 in `race/BACKLOG.md`; one change
closes both.

The README said to update `race/index.html` by copying the file in and **re-applying three
deltas by hand**. It was four deltas by then — the download link had been added — so anyone
following it literally would drop one and not notice.

The fix removed the premise rather than correcting the count. The game was folded in from the
private `feareater/RocketScooterRace` (RACE-1): `race/index.html` **is** the game now, there
is no copy to copy from, and `sync-to-site.mjs` is deleted. The deltas survive only as the
`SITE-ONLY BITS` comment inside `index.html`, and they now run the other way — stripped out
for the offline download instead of applied in for the site.

- [x] Rewrite the README section: the file is the game, not a vendored copy
- [x] State that `race-to-the-moon-local.zip` is a committed build artifact, and that editing
      the game does not rebuild it
- [x] Give the two commands — `node build-download.mjs` and `--check`, which reads the
      published zip back and compares it entry-by-entry against a fresh build

The game keeps its own backlog at `race/BACKLOG.md`, which the Backlog Board reads as a
separate project. Race items live there, not here.

---

## EPIC-2 · Listing hygiene

### SITE-3 · Any new app needs its own privacy page
**Status** NOTE · **Owner** BOTH

Standing constraint, and it has already been got wrong once. `privacy.html` says the apps are
for a general adult audience and that no personal data is stored on our servers — **both false
for Thunk**, which is rated E for Everyone and writes a display name to Firebase. It used to
claim it covered "all" Innovizea apps "and future titles"; that scope was narrowed on
2026-08-04.

Do not extend `privacy.html` to cover a new app. Give it its own page, the way
`thunk-privacy.html` exists.

Also: the Card Shark policy text mirrors `CardShark-Suite/INNOVIZEA_PRIVACY_POLICY.md`. Change
one, change the other — that markdown is what the app stores reference.

### SITE-4 · Do not migrate to Cloudflare Pages
**Status** NOTE · **Owner** BOTH

Standing constraint, evaluated and rejected — recorded because it looks like an obvious
improvement and is not. Cloudflare needs the domain on its own nameservers to serve an apex,
and **innovizea.com runs Microsoft 365 mail**. Moving nameservers means migrating
MX/SPF/DKIM/autodiscover and risking business email, to save nothing. GitHub Pages publishes
the apex through four fixed A records and never touches mail.

(This is the same constraint that put **BacklogBoard** on Cloudflare Pages instead — that board
needed auth, which Pages cannot do, and it lives on a subdomain with one CNAME so the zone
never moves.)

### SITE-5 · Two local false alarms will keep recurring when verifying the site
**Status** NOTE · **Owner** BOTH

Standing constraint — both are Jeff's PC, not the site, and both have cost debugging time.

**Norton MITMs TLS**: local `curl` reads `CN=Norton Web/Mail Shield Root` instead of the real
certificate and fails revocation. Use `curl -k` or verify from outside the LAN.

**The Windows DNS client cache** can keep resolving the old GoDaddy IP long after `nslookup`
shows the new one, because `nslookup` queries the resolver directly and bypasses that cache.
The giveaway is a GoDaddy "Page Not Found" on a path while `/` still returns 200. Fix with
`ipconfig /flushdns` plus `chrome://net-internals/#dns` → Clear host cache.

The test that skips DNS entirely:
`curl -k --resolve innovizea.com:443:185.199.108.153 https://innovizea.com/app-ads.txt`

---

## EPIC-3 · Content

### SITE-6 · The consulting page carries no evidence
**Status** LATER · **Owner** JEFF · **Size** M

The site leads with consulting and lists products below, but consulting is the one section with
nothing behind it — no case studies, no named engagements, no indication of how work is scoped
or priced. Every product card at least links to a live listing someone can go and look at.

A lead section should be the best-evidenced one on the page. Either give it that evidence, or
let the products lead.

### SITE-7 · Adding a Card Shark game is a documented manual ritual
**Status** LATER · **Owner** CLAUDE · **Size** S

Drop a 192px WebP into `assets/icons/`, copy an existing `<li class="game">`, update name/tag/
package id — with each game's `app.json` under `CardShark-Suite/` as the source of truth for
names and packages.

Thirteen games in and it is still hand-copied, so the site can silently disagree with the suite
about a package id. Generating the list from the `app.json` files would make that impossible.

⚠ There is no `sharp` or ImageMagick on this machine. The working downscale recipe is headless
Chrome via `puppeteer-core` (borrow `Sequence Puzzle/tools/browser.mjs`, which needs
`pipe: true` because TCP to the devtools port is blocked here) plus `canvas.toDataURL('image/webp')`.
