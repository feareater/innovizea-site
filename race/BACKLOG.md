# Race to the Moon — Backlog

**Status** `NOW` · `NEXT` · `LATER` · `BLOCKED` · `DONE` · `CANCELLED` (with a reason).
**Owner** `JEFF` needs a key or a decision · `CLAUDE` code · `BOTH`. **Size** `S`/`M`/`L`/`XL`.

> A single-file browser racer — pick a winner, watch them race. One self-contained
> `index.html`, no external requests, no build, `localStorage` only, which is what lets it be
> served straight from innovizea.com at `/race/` and equally be double-clicked off a desktop.
> Viewers can join live from YouTube or TikTok chat by typing a keyword; see
> [CHAT-SETUP.md](CHAT-SETUP.md).
>
> **`index.html` in this folder IS the game.** There is no second copy and no sync step — that
> was the arrangement until 2026-08-29 and it is gone (RACE-1). The one thing that still has to
> be rebuilt by hand is the download: `node build-download.mjs`, checked by `--check`.
>
> Full orientation in [README.md](README.md).

---

## EPIC-1 · Where the game lives, and how it is published

### RACE-1 · The product is "Race to the Moon"; the repo, folder and URL are not
**Status** DONE · **Owner** JEFF · **Size** M

**Decided 2026-08-29 (Jeff): fold the game into `innovizea-site/race/` and archive the separate
repo.** The half-applied rename is resolved by removing the thing that carried the old name.

Renamed 2026-08-04, and until now only the user-facing name had changed — the repo was still
`feareater/RocketScooterRace`, the folder still `RocketScooterRace`, and the live path still
`/race/`. Two documents had already had to stop and explain the mismatch, which was the signal
that it needed deciding rather than drifting.

What settled it: **the private repo published 100% of its own contents anyway.** The game is
public through view-source at `/race/`, and `bridge/`, `CHAT-SETUP.md` and the game itself all
ship inside the public download. Only `BACKLOG.md` was not already public. So the split bought
no privacy at all, and cost a four-delta vendoring ritual plus a sync script to police it.

`/race/` **stays** — it is a good URL for this game, and per the site's own rule, paths are the
expensive thing to move. That is now written down here and in both READMEs rather than being
re-derived each time someone notices the mismatch.

- [x] Decide: rename repo + folder, or record that the old names are permanent
- [x] Fold `bridge/`, `build-download.mjs`, `CHAT-SETUP.md` and this backlog into `race/`
- [x] Delete `sync-to-site.mjs` — with one copy there is nothing left to sync
- [x] Rewrite the in-file `DELTAS` comment as `SITE-ONLY BITS`; the direction inverted, since
      the deltas are now stripped *out* for the download rather than applied *in* for the site
- [x] Update the absolute paths that named the old folder — `BacklogBoard/sources.json` now
      reads `innovizea-site/race/BACKLOG.md`; `sync-to-site.mjs` is gone
- [x] Archive the `RocketScooterRace` folder out of `Projects/` and record it in `PROJECTS.md`

The one step left needs console access and is split out as RACE-8.

### RACE-2 · innovizea-site's README describes a hand-patching ritual that no longer exists
**Status** DONE · **Owner** CLAUDE · **Size** S

Tracked from the site side as SITE-2; both are closed by the same change.

`innovizea-site/README.md` said to update the game by copying the file in and **re-applying
three deltas by hand** — stale and actively dangerous advice, and it was four deltas by then
(title+favicons, back link, product name, download link), so anyone following it literally
would silently drop one.

RACE-1 removed the premise: there is no longer a copy to copy from. The README section is
rewritten to say the file **is** the game, to state that the zip is a committed build artifact
that editing the game does not rebuild, and to give the two commands.

- [—] ~~Point `innovizea-site/README.md` at `sync-to-site.mjs`~~ — superseded by RACE-1: that
      script no longer exists. The README documents `build-download.mjs` instead, which is the
      only step that survives.
- [x] Say that `build-download.mjs` must run if the game changed, or the published zip goes stale

### RACE-3 · Nothing verifies the published zip matches the live game
**Status** DONE · **Owner** CLAUDE · **Size** S

`build-download.mjs` produces `race-to-the-moon-local.zip`, offered as a download from the
site. Rebuilding it is still a manual step, and skipping it ships a download that does not
match what the visitor just played — a difference nobody would notice until someone reported a
bug that was already fixed.

Implemented as `node build-download.mjs --check`. It does **not** compare timestamps: it reads
the published zip back, decompresses every entry, and compares each one byte-for-byte against
what a build would produce right now. mtimes are reset by a fresh checkout and would have made
the check lie in exactly the situation it exists for.

The build now also re-reads its own output and asserts the same thing, so a bad write cannot
report success.

- [x] `--check` mode, exit 1 and a `DOWNLOAD STALE` report naming each stale entry
- [x] Verified with a control — perturb a source, confirm `--check` actually fails, revert
- [x] Publish in place: the zip is written next to `index.html`, so there is no separate
      copy-it-across step left to forget

### RACE-8 · Archive feareater/RocketScooterRace read-only on GitHub
**Status** DONE · **Owner** JEFF · **Size** S

Split out of RACE-1, which is otherwise done. The local folder is archived to
`Documents/Data Archive - Duplicates, or Unused/RocketScooterRace-archive-2026-08-29/`
(clean, in sync with `origin/main` at `b867db8`, nothing unpushed), but the **remote is
still a live private repo** and only Jeff can change that — it needs the GitHub console.

Leaving it writable is the failure mode worth avoiding: it is a plausible-looking checkout of
a game that has since moved, so a future edit could land there and be lost. Archiving makes
GitHub refuse the push instead of accepting it silently.

Read-only, **not deleted** — it holds the history that `innovizea-site` does not, since the
fold-in was a copy rather than a graft.

- [x] GitHub → feareater/RocketScooterRace → Settings → Archive this repository
- [x] Then this item and RACE-1 are both fully closed

---

## EPIC-2 · The live-chat join

### RACE-4 · TikTok needs a helper process; YouTube does not
**Status** CANCELLED · **Owner** JEFF · **Size** S
**Reason** Not worried about it working on Tiktok, want it to work as is.

YouTube works from the game file plus a free API key. TikTok has no public chat API, so it
needs the `bridge/` helper running locally — an asymmetry worth confirming still holds before
relying on it for a stream, since both platforms change their chat surfaces without notice.

Verify against a real stream rather than the **Test** button. Test fakes a chat message, which
proves the lobby logic and proves nothing about the connection.

**Still open, and only Jeff can close it:** it needs a live YouTube broadcast, an API key, and
a TikTok account actually streaming. Nothing about it was verifiable from the repo.

### RACE-5 · The YouTube API key has no documented home
**Status** DONE · **Owner** CLAUDE · **Size** S

The game is a single self-contained HTML file with no build step and no `.env`, so the key is
entered in the UI and lives in `localStorage`. That is the right design for a file you can hand
someone — but it needed stating, because the natural assumption for anyone extending this is
that there is a config file somewhere, and there is not.

Written up in [README.md](README.md) under *"There is no config file"*: the key is typed in at
runtime and persisted under `localStorage['rocketRace.v2']` as `ytKey`, alongside the racer
list and theme. The README also records the three consequences that make the design a
constraint rather than an oversight — the key is never written into `index.html` (which is why
the file is safe to publish and safe to hand to a stranger), each browser holds its own with
nothing to restore it from, and `chatUiEnabled()` keeps the panel off a public host so a
visitor is never asked for one.

- [x] Document it where someone extending the game will look — the game's own README
- [x] Name the actual storage key, not just "localStorage"

### RACE-6 · Entrant fairness rules are the spec — do not "simplify" them
**Status** NOTE · **Owner** BOTH

Standing constraint. The lobby rules exist to stop one viewer entering twice: a name is added
on first keyword only, the keyword must stand alone (`!race` matches `!race` but not
`!racecar`), starting a race closes the join window, and the entrant list survives a page
reload **specifically** so a refresh mid-lobby cannot hand anyone a second entry. Clearing the
list is the only thing that lets people re-enter, and that is deliberate.

Now also restated in [README.md](README.md), so it is in front of anyone reading the code
rather than only in the backlog.

### RACE-7 · The shipped TikTok helper has no lockfile, so streamers get a floating dependency
**Status** CANCELLED · **Owner** BOTH · **Size** S
**Reason** Not conerned about tiktok

Found while folding the repo in. The download ships `bridge/package.json` and `server.js` but
**not** `package-lock.json`, so a streamer's `npm install` resolves `tiktok-live-connector`
`^2.4.3` to whatever 2.x is current that day. That package tracks an undocumented, actively
changing surface — it is exactly the dependency most likely to break, and the failure lands on
a stranger mid-stream with no way to tell a bad version from a TikTok-side change.

Not obviously a one-line fix, which is why this is an item rather than a silent change:
pinning is not free either. A lockfile freezes them onto a build that a later TikTok change
will break, with no signal that a newer release already fixed it — the opposite failure. The
real question is which failure is recoverable by someone who is not a developer.

Worth deciding together with RACE-4, since a real-stream test is the only thing that says
which version actually works today.

- [ ] Decide: ship the lockfile, pin an exact version in `package.json`, or leave it floating
      and say so in `START-HERE.txt` with the recovery command
- [ ] Whichever way it goes, `build-download.mjs` stages the helper — the fix belongs there
