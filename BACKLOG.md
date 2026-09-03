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

### SITE-8 · The Choptick pages claimed a private beta and an Android app
**Status** DONE · **Owner** CLAUDE · **Size** S

**Done 2026-09-03** in `cc498fb`. Two claims on `choptick.html`, and the Choptick cards on
`index.html` and `policies.html`, had gone stale in the direction that costs the most: they
told a reader not to bother.

**"Private beta"** — signup has been open for some time. The product's own deployment answers
this, and is the only thing that should be believed about it:

```
curl -s https://choptick.app/api/auth/config   →  {"signupGated":false}
```

Checkout is configured in production too, so Choptick is live and taking payment. A badge
reading "Private beta" on the one page linking to it is worse than no page.

**"Web & Android"** — the Android and iOS builds are in testing, not something a reader can go
and install. choptick.app says so on its own mobile section, so this site was the only place
claiming otherwise.

- [x] Badges → "Open for signup", "Free plan to start", keeping the two feature badges
- [x] Card kind → "Trading journal · web" on `index.html` and `policies.html`; eyebrow → "web app"
- [x] The mobile position moved into "Where things live", with a `mailto` for access
- [x] Verified against the live site after the Pages build, not just locally

⚠ **No price is repeated on this site, deliberately.** `choptick.html` is a pointer, as the
comment at the top of it says — the product, its pricing, its terms and its privacy policy all
live on choptick.app. Anything stated in two places drifts, and the copy nobody edits is the
one someone reads. The same reasoning is why the privacy policy is linked rather than copied
(SITE-3).

⚠ **This page will go stale again**, because it describes a product that ships from another
repo. When Choptick's mobile apps leave testing, this is the file to change — nothing here
learns it automatically.

### SITE-9 · Screenshots and ad creative on the Choptick page
**Status** DONE · **Owner** CLAUDE · **Size** M

**Done 2026-09-03.** Jeff: *"Since very few people come to that page, I want it
to be a good testing ground."* Five product screenshots and five 1200×628 draft
banners now sit on `choptick.html`, in two labelled sections.

⭐ **Low traffic is the whole point**, and it is a genuinely good idea: creative
can be judged in place, at real size, on a real page, before it goes anywhere
that costs money. The banners are marked *in testing* on the page so a visitor
is not misled about what they are looking at.

- [x] `assets/choptick/shots/` — five WebP captures of the live app
- [x] `assets/choptick/banners/` — five WebP banners, one per message pillar
- [x] `.ck-shots` / `.ck-banners` in `styles.css`; lazy-loaded, real `alt` text
- [x] Verified at 1280px and 420px — no horizontal overflow, nothing broken

⛔ **Every image is shot on Choptick's marketing demo profile, which names no
prop firm and invents every figure.** That is a standing rule of Jeff's, not a
detail of this ticket: no firm is named until there is a partnership. The
generators live in the Choptick repo (`tools/capture-marketing-stills.mjs`,
`tools/marketing-banners.html`) — **do not drop in an image from anywhere else**,
because the Play-store demo profile names four real firms.

⛔ **`.shots` WAS ALREADY TAKEN, AND TAKING IT BROKE games.html.** The first
version of this used `.shots`/`.banners`, which collide with the `.shots`
scroll-snap strip thirteen game sections have used since long before it. Same
specificity, appended later, so the new rules silently won and every game's
screenshot strip became a grid of full-width images. **Nothing errored** — the
game page simply looked wrong, and choptick.html looked fine. Hence `ck-`.
Scope a new component to its product before adding it to a stylesheet that
thirteen pages share.

⚠ **The pricing banner puts $24.99 on this site**, which SITE-8 deliberately kept
off it. That was a decision about page COPY that could silently drift; the price
is now inside an image, where it cannot be grepped and will not be noticed when
it changes. It is here because pricing is the strongest single asset in the ad
kit and the point of the page is to test the kit — but if the price moves, this
image is the thing that will be wrong, and nothing will point at it.
