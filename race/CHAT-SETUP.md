# Live chat join — setup

Viewers type a keyword in your stream chat and get dropped into the race automatically.
One entry each. Open the game and expand **Live chat join** in the sidebar.

**YouTube needs nothing installed** — just the game file and a free API key.
**Only TikTok** needs the helper process, because TikTok has no public chat API.

## The lobby rules

- A viewer is added the first time they say the keyword. Saying it again does nothing.
- The keyword only counts on its own — `!race` matches `!race` and `hey !race go`, but not `!racecar`.
- **Starting a race closes the join window.** Nothing else is watched until you open a new round.
- **Typing a new keyword opens the next round** (and resets the "0 joined" counter).
- **The name list is never cleared for you.** Race the same field as many times as you like.
  Hit **Clear All** when you want a fresh lobby — that also lets everyone enter again.
- Removing one name by hand (the ×) releases just that person, so they can rejoin.
- **Test** fakes a chat message so you can check the whole thing before you go live.

The entrant list survives a page reload, so refreshing mid-lobby can't hand anyone a second entry.

---

## YouTube

Runs straight from the browser, including a page opened by double-clicking it.
Nothing to install. (`googleapis.com` sends `Access-Control-Allow-Origin: *`, and
Chrome honours that from a `file://` page.)

### 1. Get an API key

1. <https://console.cloud.google.com/> → create a project.
2. **APIs & Services → Library** → enable **YouTube Data API v3**.
3. **APIs & Services → Credentials → Create credentials → API key**.
4. Restrict it: **API restrictions → YouTube Data API v3**. If you ever host the page
   publicly, add an **HTTP referrer** restriction too.

The key is typed into the page at runtime and kept in that browser's local storage.
It is never written into `index.html`, so the file stays safe to commit and share.

### 2. Connect

Paste the **live stream's** URL (or bare video ID) and the key, then hit **Connect**.
The stream has to actually be live — a scheduled or ended broadcast has no active chat.

### Quota

A free key gets 10,000 units/day. Reading chat costs 5 units per poll, so at the
default 6-second interval that's about 3,000 units/hour — roughly 3 hours of lobby
time per day. Raise the **Poll** seconds if you need to stretch it; lower it if you
want joins to appear faster. The game also respects YouTube's own suggested interval
when that is slower than yours.

If you blow through the quota the game says so and disconnects — your roster is kept.

---

## TikTok

**This is the only part that needs installing.** TikTok has no public live-chat API —
the only way in is a helper process on your machine that speaks TikTok's internal
webcast protocol, which a browser cannot do by itself.

You need [Node.js](https://nodejs.org) 18 or newer.

### Run the helper

```
cd tiktok-helper      # "bridge" in the source repo
npm install           # once, ever
npm start             # each time you stream
```

Leave that window open. Then, in the game, pick **TikTok Live**, enter your
`@username`, and hit **Connect** — you do not need to reopen the page.

It only listens on your own machine. Set `HOST=0.0.0.0` if you deliberately want it
reachable from elsewhere on your network, and `PORT=…` to move it. It also serves the
game at `http://localhost:8787` if you'd rather open it that way, but double-clicking
the file works identically.

### If TikTok rate-limits you

Connecting goes through a third-party signing service (Euler Stream). The free
anonymous tier is fine for occasional use but will rate-limit a busy day. Get a free
key at <https://www.eulerstream.com/> and start the bridge with it:

```
# PowerShell
$env:SIGN_API_KEY = "your-key"; npm start

# bash
SIGN_API_KEY=your-key npm start
```

### Licence note

`tiktok-live-connector` is **AGPL-3.0**. That is fine for a tool you run locally, but
it has real implications if you ever ship or host the bridge as part of a commercial
product — worth a look before this goes anywhere near innovizea.com. The game itself
(`index.html`) has no such dependency; only `bridge/` does.

---

## Troubleshooting

| What you see | Cause |
|---|---|
| `That video has no active live chat` | Stream isn't live, or you used the channel URL instead of the video URL. |
| `YouTube API quota exhausted` | 10,000 units used for the day. Resets at midnight Pacific. |
| `Could not reach the TikTok helper` | `npm start` isn't running in `tiktok-helper/`, or the port doesn't match. |
| `That account is not live right now` | Wrong `@username`, or the TikTok stream hasn't started. |
| Joins are open but nobody appears | Keyword mismatch — check the exact spelling, and hit **Test** to prove the path works. |
