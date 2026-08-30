/**
 * Builds — and publishes — the downloadable "local" package: the copy a streamer runs
 * on their own machine to pull racers out of YouTube / TikTok chat.
 *
 *   node build-download.mjs           build, then write the zip next to index.html
 *   node build-download.mjs --check   build nothing; assert the published zip matches
 *
 * `index.html` in this folder IS the game. There is no second copy and no sync step —
 * the site serves that file directly at /race/, and this script derives the offline
 * package from it. The zip is written to `race-to-the-moon-local.zip` right here,
 * which is the URL the game's own download link points at, so publishing is the build.
 *
 * The package differs from the served page in four ways, all because it runs off disk:
 *   - no favicon <link>s (they are root-absolute and would 404 locally)
 *   - the back link is an absolute https:// URL, not "/"
 *   - no "download the local version" link — this IS the local version
 *   - index.html is renamed so it is obvious what to double-click,
 *     and it carries the optional TikTok helper and the setup guide
 *
 * The chat lobby needs no flag: `chatUiEnabled()` turns itself on for file:// and
 * localhost, which is exactly where this package runs.
 *
 * Note YouTube needs NO server: googleapis.com sends Access-Control-Allow-Origin: *,
 * and Chrome allows that fetch from a file:// page (verified — it answers with a
 * normal CORS response). Only TikTok needs the helper process.
 *
 * --check exists because the zip is a build artifact committed next to its source.
 * Editing the game and forgetting to rebuild ships a download that does not match
 * what the visitor just played — a difference nobody notices until someone reports a
 * bug that was already fixed. --check reads the published zip back and compares every
 * entry against what a build would produce right now, so the staleness is loud.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NAME = 'race-to-the-moon-local';
const GAME = 'Race to the Moon.html';   // named so it is obviously the thing to open
const HELPER = 'tiktok-helper';         // and this is obviously the optional extra
const dist = path.join(__dirname, 'dist');
const stage = path.join(dist, NAME);
const zipPath = path.join(__dirname, NAME + '.zip');

const CHECK = process.argv.includes('--check');

const fail = (msg) => { console.error('FAIL: ' + msg); process.exit(1); };

/* ------------------------------------------------------------------ the transform */

// The repo is checked out CRLF (`* text=auto` in .gitattributes). Match on LF so the
// anchors below read the way they look in the file, and emit CRLF because every file
// in this package is opened on a Windows desktop.
const toLF = (s) => s.replace(/\r\n/g, '\n');
const toCRLF = (s) => s.replace(/\r?\n/g, '\r\n');

const HEAD_SITE =
  '<title>Race to the Moon \u2014 Innovizea</title>\n' +
  '<link rel="icon" href="/favicon.ico" sizes="32x32">\n' +
  '<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">\n' +
  '<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">\n';

const HEAD_LOCAL = '<title>Race to the Moon \u2014 local</title>\n';

// Everything from the site-only comment through the end of the download paragraph.
const BODY_START = '      <!-- SITE-ONLY BITS (3).';
const BODY_END =
  'the local version</a> to add racers straight from your YouTube or TikTok chat.\n' +
  '      </p>\n';

const BACK_LOCAL =
  '      <p style="margin:-8px 0 12px;font-size:12px;">\n' +
  '        <a href="https://innovizea.com/race/" style="color:#9aa8cc;text-decoration:none;">' +
  'innovizea.com/race &rarr;</a>\n' +
  '      </p>\n';

/** Turn the served page into the offline one. Throws rather than guessing. */
function brandLocal(siteHtml) {
  let out = toLF(siteHtml);

  if (!out.includes(HEAD_SITE)) fail('the <title> + favicon block in <head> did not match');
  out = out.replace(HEAD_SITE, HEAD_LOCAL);

  const i = out.indexOf(BODY_START);
  if (i < 0) fail('the SITE-ONLY comment marking the back link / download block is missing');
  const j = out.indexOf(BODY_END, i);
  if (j < 0) fail('the end of the download paragraph did not match');
  out = out.slice(0, i) + BACK_LOCAL + out.slice(j + BODY_END.length);

  // Assert the result, rather than trusting that the replacements above did what they say.
  const checks = {
    'title retargeted':        out.includes('<title>Race to the Moon \u2014 local</title>'),
    'no root-absolute favicon':!out.includes('href="/assets/favicon.svg"'),
    'product name intact':     out.includes('<h1>Race to the Moon</h1>'),
    'back link absolute':      out.includes('href="https://innovizea.com/race/"'),
    'no site back link':       !out.includes('<a href="/" style="color:#9aa8cc'),
    'no self-download link':   !out.includes(NAME + '.zip'),
    'chat panel present':      out.includes('id="chat-panel"'),
    'bridge client present':   out.includes('startBridge'),
    'youtube client present':  out.includes('liveChatMessages'),
  };
  const bad = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  if (bad.length) fail('branded copy failed its own checks: ' + bad.join(', '));

  return out;
}

/* --------------------------------------------------------- assemble, without disk */

const START_HERE = [
  'Race to the Moon',
  '================',
  '',
  `Double-click "${GAME}". That is the whole install.`,
  '',
  '',
  'JUST WANT TO RACE?',
  '  Type names in, or paste up to 1000 at once. Hit Start Race. Done.',
  '',
  '',
  'WANT YOUTUBE CHAT TO ADD THE RACERS?',
  '  Also nothing to install.',
  '',
  '  1. Open the game and expand "Live chat join" in the sidebar.',
  '  2. Source: YouTube Live.',
  '  3. Paste your live stream\'s URL and a YouTube API key.',
  '  4. Pick a keyword and hit Connect.',
  '',
  '  Viewers who type the keyword get added, once each. Press Test first if',
  '  you want to see it work before going live.',
  '',
  '  Getting a free API key takes about two minutes — CHAT-SETUP.md walks',
  '  through it with screenshots-worth of detail.',
  '',
  '',
  'WANT TIKTOK CHAT INSTEAD?',
  '  This is the only part that needs installing, because TikTok — unlike',
  '  YouTube — gives no public way to read live chat.',
  '',
  '  You need Node.js 18 or newer: https://nodejs.org',
  '',
  '  1. Open a terminal in the "' + HELPER + '" folder.',
  '  2. npm install        (once, ever)',
  '  3. npm start          (each time you stream — leave the window open)',
  '  4. Back in the game, choose "TikTok Live", enter your @username, Connect.',
  '',
  '',
  'PRIVACY',
  '  Everything runs on your own machine. Your API key is stored only in your',
  '  browser. The TikTok helper listens on your computer alone. Nothing about',
  '  your stream is sent to us or anyone else.',
  '',
  'Full instructions: CHAT-SETUP.md',
  '',
].join('\n');

/**
 * The package as a Map of zip-entry path -> exact bytes. Pure: it reads the sources
 * and returns, so --check can build the expected package without touching the tree.
 */
function buildPackage() {
  const read = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');
  const files = new Map();
  const put = (rel, text) => files.set(rel, Buffer.from(toCRLF(text), 'utf8'));

  put(GAME, brandLocal(read('index.html')));
  put('CHAT-SETUP.md', read('CHAT-SETUP.md'));
  put('START-HERE.txt', START_HERE);
  for (const f of ['package.json', 'server.js']) {
    put(`${HELPER}/${f}`, read(path.join('bridge', f)));
  }
  return files;
}

/* ------------------------------------------------------------------- reading a zip */

/**
 * Minimal ZIP reader — enough to pull every entry's bytes back out, which is what
 * --check needs. Node ships inflate but no archive reader, and the alternative is
 * trusting the file we just wrote. Reading the artifact is the whole point.
 */
function readZip(file) {
  const buf = fs.readFileSync(file);

  // End of Central Directory: scan back from the tail for its signature.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 0xffff; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) fail(`${path.basename(file)} is not a zip (no end-of-central-directory record)`);

  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map();

  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) fail('corrupt central directory in ' + path.basename(file));
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const cmtLen = buf.readUInt16LE(p + 32);
    const localAt = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);

    // The local header repeats the name and extra fields, at its own lengths.
    if (buf.readUInt32LE(localAt) !== 0x04034b50) fail('corrupt local header for ' + name);
    const dataAt = localAt + 30 + buf.readUInt16LE(localAt + 26) + buf.readUInt16LE(localAt + 28);
    const raw = buf.subarray(dataAt, dataAt + compSize);

    if (method === 0) out.set(name, Buffer.from(raw));
    else if (method === 8) out.set(name, zlib.inflateRawSync(raw));
    else fail(`entry "${name}" uses compression method ${method}, which this reader does not handle`);

    p += 46 + nameLen + extraLen + cmtLen;
  }
  return out;
}

/* -------------------------------------------------------------------------- --check */

if (CHECK) {
  if (!fs.existsSync(zipPath)) fail(`${NAME}.zip has never been built — run: node build-download.mjs`);

  const want = buildPackage();
  const have = readZip(zipPath);

  const problems = [];
  for (const [rel, bytes] of want) {
    const entry = `${NAME}/${rel}`;
    if (!have.has(entry)) { problems.push(`missing from the zip: ${rel}`); continue; }
    if (!have.get(entry).equals(bytes)) problems.push(`stale in the zip: ${rel}`);
  }
  for (const entry of have.keys()) {
    const rel = entry.startsWith(NAME + '/') ? entry.slice(NAME.length + 1) : entry;
    if (!want.has(rel)) problems.push(`no longer built, still in the zip: ${rel}`);
  }

  for (const [rel] of want) {
    const entry = `${NAME}/${rel}`;
    const ok = have.has(entry) && have.get(entry).equals(want.get(rel));
    console.log((ok ? 'ok   ' : 'FAIL ') + rel);
  }

  if (problems.length) {
    console.error('\nDOWNLOAD STALE — the published zip does not match this game:');
    for (const m of problems) console.error('  ' + m);
    console.error('\nFix it with:  node build-download.mjs');
    process.exit(1);
  }
  console.log('\nDOWNLOAD MATCHES THE GAME');
  process.exit(0);
}

/* --------------------------------------------------------------------------- build */

const files = buildPackage();

fs.rmSync(dist, { recursive: true, force: true });
for (const [rel, bytes] of files) {
  const dest = path.join(stage, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, bytes);
}

/* ---- zip ----
   Not Compress-Archive: it writes backslash path separators, which the ZIP spec
   forbids. Windows tolerates them, but macOS Archive Utility can extract the whole
   thing as one flat file with backslashes in its name. Drive .NET directly so the
   entry names use forward slashes. */
const ps1 = path.join(dist, 'zip.ps1');
fs.writeFileSync(ps1, [
  '$ErrorActionPreference = "Stop"',
  'Add-Type -AssemblyName System.IO.Compression.FileSystem',
  `$stage = '${stage}'`,
  `$zip   = '${zipPath}'`,
  'if (Test-Path $zip) { Remove-Item $zip -Force }',
  '$archive = [System.IO.Compression.ZipFile]::Open($zip, "Create")',
  'try {',
  '  Get-ChildItem -Path $stage -Recurse -File | Sort-Object FullName | ForEach-Object {',
  `    $rel = '${NAME}/' + $_.FullName.Substring($stage.Length + 1).Replace('\\','/')`,
  '    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(',
  '      $archive, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal)',
  '  }',
  '} finally { $archive.Dispose() }',
].join('\r\n'), 'utf8');

execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', ps1], { stdio: 'inherit' });
fs.rmSync(ps1, { force: true });

// Read the artifact back rather than trusting the writer — the same check --check runs.
const have = readZip(zipPath);
let ok = true;
for (const [rel, bytes] of files) {
  const good = have.has(`${NAME}/${rel}`) && have.get(`${NAME}/${rel}`).equals(bytes);
  if (!good) ok = false;
  console.log((good ? 'ok   ' : 'FAIL ') + rel);
}
if (!ok) fail('the zip does not contain what was staged');

const kb = (fs.statSync(zipPath).size / 1024).toFixed(1);
console.log(`\npublished  ${zipPath}  (${kb} KB)`);
console.log('It is served at innovizea.com/race/' + NAME + '.zip — commit it with the game.');
