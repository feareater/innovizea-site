# Race to the Moon

A single-file browser racer — type names in, pick a winner, watch them race. Served at
**<https://innovizea.com/race/>**. Viewers can join live from YouTube or TikTok chat by typing
a keyword; see [CHAT-SETUP.md](CHAT-SETUP.md).

```
index.html                  the game. This file IS the product — see below
race-to-the-moon-local.zip  the offline package, published at /race/…zip
build-download.mjs          builds that zip (and `--check`s it is not stale)
CHAT-SETUP.md               streamer-facing setup guide, shipped inside the zip
bridge/                     the optional TikTok helper, shipped inside the zip
BACKLOG.md                  open work, read by the Backlog Board
```

## `index.html` is the whole game

No build step, no bundler, no dependencies, no external requests. One self-contained HTML
file with inline CSS and JS, which is what lets GitHub Pages serve it as-is at `/race/` **and**
lets a streamer double-click a copy on their own desktop and have it work identically.

Edit it directly. Nothing generates it and nothing is generated from it except the download.

> **This was two repos until 2026-08-29.** The game lived in the private
> `feareater/RocketScooterRace`, and this folder held a vendored copy that a `sync-to-site.mjs`
> script kept in step by re-applying four deltas on every copy. That repo published 100% of its
> own contents anyway — the game through view-source, and `bridge/`, `CHAT-SETUP.md` and the
> game through the public download — so the split bought no privacy and cost a sync ritual.
> It was folded in here, the sync script deleted, and the old repo archived. See RACE-1 in
> [BACKLOG.md](BACKLOG.md).

## Rebuilding the download

The zip next to `index.html` is a **committed build artifact**, and it is what the game's own
"Download the local version" link points at. Change the game and it goes stale silently.

```bash
node build-download.mjs           # rebuild and publish it in place
node build-download.mjs --check   # assert the published zip matches the current game
```

`--check` reads the zip back and compares every entry byte-for-byte against a fresh build, so a
forgotten rebuild fails loudly instead of shipping a download that does not match what the
visitor just played. **Run it after any edit to `index.html`, `CHAT-SETUP.md` or `bridge/`.**

The offline copy differs from the served page in exactly three places, all marked with a
`SITE-ONLY BITS` comment in `index.html`: the `<title>` + root-absolute favicon links, the
`← innovizea.com` back link, and the download link itself. `build-download.mjs` rewrites them
and fails if any anchor has moved.

## There is no config file — the YouTube key lives in the browser

The natural assumption for anyone extending this is that credentials come from a `.env` or a
config module. **They do not, and adding one would break the product.** The whole point is a
file you can hand someone.

The YouTube Data API v3 key is **typed into the page at runtime** ("Live chat join" → YouTube
Live) and persisted to `localStorage` under the key **`rocketRace.v2`**, alongside the racer
list and theme, as the `ytKey` field. The TikTok bridge URL is stored the same way.

Consequences worth knowing before you change anything here:

- **The key is never written into `index.html`**, which is why this file is safe to commit to a
  public repo and safe to hand to a stranger.
- **Each browser holds its own key.** Clearing site data loses it; there is nothing to restore
  it from.
- **We never ask a public visitor for one.** `chatUiEnabled()` shows the chat panel only on
  `file://` and localhost, so the lobby is invisible at innovizea.com/race/ — that asymmetry is
  the reason the offline package exists at all. `?chat=1` forces it on for testing.
- The free quota is 10,000 units/day and a chat poll costs 5, so the default 6-second interval
  buys roughly three hours of lobby time per day. [CHAT-SETUP.md](CHAT-SETUP.md) has the maths.

## The entrant fairness rules are the spec

They look like they could be simplified. They cannot — each one exists to stop a single viewer
entering twice, which is the only thing that makes a chat-driven race fair:

- A name is added on the **first** keyword only; repeats do nothing.
- The keyword must stand alone — `!race` matches `!race`, but not `!racecar`.
- **Starting a race closes the join window.**
- The entrant list **survives a page reload**, specifically so a mid-lobby refresh cannot hand
  anyone a second entry.
- **Clear All** is the only thing that lets people re-enter, and that is deliberate.

## The TikTok helper

YouTube works from the game file plus a free API key — `googleapis.com` sends
`Access-Control-Allow-Origin: *` and Chrome honours it from a `file://` page. TikTok has no
public chat API, so it needs `bridge/` running locally (`npm install`, `npm start`). That
asymmetry is worth re-verifying against a real stream before relying on it — both platforms
change their chat surfaces without notice, and the **Test** button proves the lobby logic
while proving nothing about the connection.
