# innovizea.com

Static site for **Innovizea LLC** — the landing page for the 13-game Card Shark family, the
shared privacy policy, support/FAQ, and `app-ads.txt`.

No build step, no dependencies. Plain HTML/CSS; deploy the repo root as-is.

```
index.html        13-game hub, links to each Play listing
privacy.html      shared privacy policy for ALL Innovizea apps
support.html      support + FAQ (the Play "support" destination)
app-ads.txt       AdMob authorized-sellers file  <-- see below, this one matters
styles.css        brand palette lifted from CardShark21/components/Theme.js
assets/icons/     13 app icons, 192px WebP (~172 KB total)
```

## Why app-ads.txt exists here

AdMob could not verify the apps because the Play listings' developer website pointed at
`sites.google.com/view/cardshark21/home`. `sites.google.com` is shared hosting on the public
suffix list, so **you cannot place a file at its root** — app-ads.txt can never validate there.
AdMob reports this as *"your file is hosted on a domain that's not supported by the app-ads.txt
initiative."*

The fix is this file, served at `https://innovizea.com/app-ads.txt`, plus every app's Play
listing `contactWebsite` set to `https://innovizea.com`.

**One file covers all 13 apps** — they share the AdMob publisher ID `pub-5852780413067836`.

Do not reformat it. One record per line, no BOM, served as `text/plain`.

## Deploy — Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Pick this repo. Build settings:
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: `/`
3. Deploy. You get `<project>.pages.dev` — check it renders before touching DNS.
4. **Custom domains** → add `innovizea.com` and `www.innovizea.com`.
5. Cloudflare gives you the DNS records. At **GoDaddy** → Domain → DNS, replace the existing
   A/CNAME records for the root and `www` with those. This retires the GoDaddy Website Builder
   site — that's intended; this repo replaces it.
6. Wait for DNS to propagate, then verify:

```bash
curl -sS https://innovizea.com/app-ads.txt        # must return the single google.com line
curl -sSI https://innovizea.com/app-ads.txt       # content-type should be text/plain
```

## After the domain is live

1. Point every Play listing at the new domain (all 13; the API script handles it):
   `contactWebsite` → `https://innovizea.com`
2. In AdMob → app → **app-ads.txt** → **Check for updates**. A successful crawl usually lands
   within a few hours.
3. Optionally move each app's **privacy policy URL** in Play from the Google Site to
   `https://innovizea.com/privacy.html`, and set the support URL to `support.html`.

## Editing

The game list is hand-written in `index.html` (13 `<li class="game">` entries). Adding a game
means: drop a 192px WebP into `assets/icons/`, copy an existing `<li>`, update the name, tag and
package id. Source of truth for names/packages is each game's `app.json` under
`CardShark-Suite/`.

The privacy policy text mirrors `CardShark-Suite/INNOVIZEA_PRIVACY_POLICY.md` — if you change one,
change the other, since that markdown is what the app stores reference.
