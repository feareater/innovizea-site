// Downscale Play-listing screenshots into web-sized WebP for games.html.
//
// There is no sharp and no ImageMagick on this machine — the working recipe is
// headless Chrome via puppeteer-core (resolved out of the Sequence Puzzle app's
// node_modules) drawing to a canvas and calling toDataURL('image/webp').
// `pipe: true` is mandatory; TCP to the devtools port is blocked here.
//
//   node tools/build-shots.mjs
//
// Sources live in ..\CardShark-Suite\<app>\store\screenshots and are NOT copied
// into this repo at full size — only the downscaled WebP lands in assets/shots.

import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const require = createRequire('d:/Documents/Projects/Sequence Puzzle/package.json');
const puppeteer = require('puppeteer-core');

const SUITE = 'd:/Documents/Projects/CardShark-Suite';
const OUT = path.resolve('assets/shots');
const WIDTH = 420;      // rendered at ~210px, so 2x for retina
const QUALITY = 0.78;

// slug -> [app folder, [screenshot file, caption] x3]
// Baccarat's screenshots folder still holds leftover CardShark21 captures
// (Split Hands, Insurance…) — only the "CardShark Baccarat - *" files are its own.
const GAMES = {
  cardshark21: ['CardShark21', [
    ['CardShark21 - Game Play.png', 'The table'],
    ['3 - Side Bets and Paytables.png', '21+3 and Perfect Pairs'],
    ['CardShark21 - Strategy.png', 'The strategy trainer'],
  ]],
  videopoker: ['CardSharkPoker', [
    ['CardShark Video Poker - Game Play.png', 'Hold and draw'],
    ['CardShark Video Poker - Betting.png', 'The credit meter'],
    ['CardShark Video Poker - Strategy.png', 'The optimal-hold trainer'],
  ]],
  baccarat: ['CardSharkBaccarat', [
    ['CardShark Baccarat - Game Play.png', 'Player, Banker or Tie'],
    ['CardShark Baccarat - Side Bets.png', 'Dragon, Panda and the pairs'],
    ['CardShark Baccarat - Games.png', 'EZ and no-commission variants'],
  ]],
  uth: ['CardSharkUltimateHoldem', [
    ['CardShark UTH - Game Play.png', 'Ante, Blind and Play'],
    ['CardShark UTH - Side Bets.png', 'Trips, Bad Beat, Pocket, Ultimate Pair'],
    ['CardShark UTH - Strategy.png', 'The decision trainer'],
  ]],
  '3cp': ['CardShark3CardPoker', [
    ['Three Card Poker - Game Play.png', 'Play or fold'],
    ['Three Card Poker - Side Bets.png', 'Pair Plus, Prime, 6-Card Bonus'],
    ['Three Card Poker - Strategy.png', 'The Q-6-4 rule, taught'],
  ]],
  mississippi: ['CardSharkMississippiStud', [
    ['CardShark Mississippi Stud - Game Play.png', 'Three betting streets'],
    ['CardShark Mississippi Stud - Side Bets.png', '3-Card Bonus and the progressive'],
    ['CardShark Mississippi Stud - Strategy.png', 'The point-count trainer'],
  ]],
  paigow: ['CardSharkPaiGow', [
    ['CardShark PaiGow - Game Play.png', 'Set your seven cards'],
    ['CardShark PaiGow - Side Bets.png', 'Fortune Bonus and the progressive'],
    ['CardShark PaiGow - Strategy.png', 'The house-way trainer'],
  ]],
  letitride: ['CardSharkLetItRide', [
    ['CardShark Let it Ride - Game Play.png', 'Pull it back, or let it ride'],
    ['CardShark Let it Ride - Side Bets.png', '3 Card and 5 Card Bonus'],
    ['CardShark Let it Ride - Strategy.png', 'The two-decision trainer'],
  ]],
  caribbean: ['CardSharkCaribbeanStud', [
    ['CardShark Caribbean Stud - Game Play.png', 'Raise or fold'],
    ['CardShark Caribbean Stud - Side Bets.png', '5+1 Bonus and the Jackpot'],
    ['CardShark Caribbean Stud - Strategy.png', 'The raise/fold trainer'],
  ]],
  crisscross: ['CardSharkCrissCross', [
    ['CardShark Criss Cross - Game Play.png', 'Across, Down and Middle'],
    ['CardShark Criss Cross - Side Bets.png', 'The Five Card Bonus'],
    ['CardShark Criss Cross - Strategy.png', 'The Middle-bet trainer'],
  ]],
  djwild: ['CardSharkDJWild', [
    ['CardShark DJ Wild - Game Play.png', 'Five wilds in the deck'],
    ['CardShark DJ Wild - Side Bets.png', 'The Trips bet'],
    ['CardShark DJ Wild - Strategy.png', 'The fold/raise trainer'],
  ]],
  iluvsuits: ['CardSharkILuvSuits', [
    ['CardShark I Luv Suits - GamePlay.png', 'Longest flush wins'],
    ['CardShark I Luv Suits - Side.png', 'Flush Rush and Super Flush Rush'],
    ['CardShark I Luv Suits - Betting.png', 'Raise size follows flush length'],
  ]],
  war: ['CardSharkWar', [
    ['CardShark War - Game Play.png', 'High card wins'],
    ['CardShark War - Side Bets.png', 'The Tie bet'],
    ['CardShark War - Betting.png', 'Go to war, or surrender'],
  ]],
};

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  pipe: true,
});
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');

const manifest = {};
let total = 0;

for (const [slug, [app, shots]] of Object.entries(GAMES)) {
  manifest[slug] = [];
  for (let i = 0; i < shots.length; i++) {
    const [file, caption] = shots[i];
    const src = path.join(SUITE, app, 'store/screenshots', file);
    const b64 = readFileSync(src).toString('base64');

    const dataUrl = await page.evaluate(async (b64, width, quality) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.getElementById('c');
      c.width = width;
      c.height = Math.round((img.naturalHeight / img.naturalWidth) * width);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/webp', quality);
    }, b64, WIDTH, QUALITY);

    const name = `${slug}-${i + 1}.webp`;
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    writeFileSync(path.join(OUT, name), buf);
    manifest[slug].push({ file: name, caption });
    total += buf.length;
    console.log(`${name.padEnd(20)} ${String(Math.round(buf.length / 1024)).padStart(4)} KB  <- ${file}`);
  }
}

await browser.close();
writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\n${Object.keys(GAMES).length} games, ${Math.round(total / 1024)} KB total`);
