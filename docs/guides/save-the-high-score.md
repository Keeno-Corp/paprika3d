---
title: How to save the high score of a game in the browser, for a three.js game
phrase: how to save the high score of a game
description: How to save the high score of a browser game so it is still there after the page closes, on a small three.js game: localStorage under one key per game, read once at start, written at game over when beaten, turned back from text into a number, wrapped for a browser that blocks storage, where the score lives and where it does not, and how a coding agent checks it with paprika3d's interact, eval and test.
meta: How to save the high score of a game with localStorage in a three.js browser game: read at start, write when beaten, parse the number back.
intent: save-the-high-score
queries:
  - "Adding a high score to local storage"
  - "How do I add a saved high score system in HTML?"
  - "How to save the high score of a game to local storage"
  - "How to add high score?"
  - "Local storage for high score?"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to save the high score of a game in the browser, for a three.js game

A browser game keeps its high score in **localStorage**: a small store of text values that the browser keeps for each website on that computer, and that is still there after the tab and the browser are closed. Each value is saved under a name, its **key**. Saving a high score takes four rules:

1. **One key per game**, such as `'hurdle-run.highScore'`, not a bare `'highScore'`.
2. **Read it once, when the page loads**, and turn the text back into a number.
3. **Write it at game over, when the new score beats it, and not otherwise.**
4. **Wrap both in `try`**, so a browser that blocks storage still lets the game play.

These four lines do all of it:

```js
const KEY = 'hurdle-run.highScore';
function loadHigh() {
  try { return Number(localStorage.getItem(KEY)) || 0; }   // nothing saved yet: getItem gives null, and Number(null) is 0
  catch { return 0; }                                      // storage blocked: play on without it
}
function saveHigh(value) {
  try { localStorage.setItem(KEY, String(value)); } catch { /* blocked or full: it lasts until the page closes */ }
}
```

The rest of this page explains each rule, then puts them in a small three.js game (three.js is a JavaScript library that draws 3D scenes in a web page; the high score code works the same in any browser game).

## Why each rule is there

**One key per game.** Every page served from the same address shares one store. While you build games on your own computer, they are all served from an address like `http://localhost:8000`, so two games that both save under `'highScore'` overwrite each other's record. A key with the game's name in it keeps them apart.

**Turn the text back into a number.** localStorage stores text and nothing else. `setItem` turns a number into text, and `getItem` gives text back, or `null` when nothing was saved yet. Compare two texts and the browser compares them letter by letter, so `'10' > '9'` is `false`, because `'1'` comes before `'9'`. A high score kept as text looks right until the player passes 9 and the record stops updating. `Number(...)` turns the text back into a number, and `|| 0` turns a missing or garbled value into 0.

**Read once, write at game over when beaten.** Read the record when the page loads, keep it in a variable, and show it in the corner while the player plays. Write it in the function that ends the round, after comparing: a write on every frame does the same work 60 times a second for nothing, and a write without the comparison replaces a record with a lower score. If your game has no game over yet, [add a game over screen](/guides/add-a-game-over-screen) first; the high score goes inside its `gameOver()`.

**Wrap it in `try`.** Some browsers refuse storage to a page, for example a page embedded in a frame that does not allow it, or a browser set to block site data. Then reading or writing throws an error, and an error at load stops the whole script, so the game never starts. With `try` the game plays and the record lasts until the page closes.

## Where the high score lives, and where it does not

The record belongs to one browser on one device at one address. The same player on a phone has a separate one. A private window forgets it when the window closes, and clearing the browser's site data erases it. Moving the game to another address starts from zero: a game served at `localhost:8000` and later at `localhost:5173` has two stores, and so does the copy you put online. A high score shared between players, a leaderboard, needs a server that every player's game sends its score to, which is beyond what localStorage does.

To clear your own record while testing, open the browser's developer tools (F12), find Local Storage under the Application tab in Chrome or the Storage tab in Firefox, and delete the key; or type `localStorage.removeItem('hurdle-run.highScore')` into the console.

## The game

Hurdle run: hurdles come at the runner, Space jumps, and touching a hurdle ends the run. Each hurdle cleared scores one and makes the next ones a little faster. The high score is in the corner while you play, and the game over panel says when you beat it; R runs again. Save it as `index.html`, run `npm install three` in its folder, serve the folder (`python3 -m http.server 8000`) and open `http://localhost:8000`; if the page stays blank, see [HTML game not working?](/guides/html-game-not-working).

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Hurdle run</title>
<style>html,body{margin:0;overflow:hidden;background:#9fc4e8}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#123;font:600 20px system-ui}
#over{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  background:rgba(0,0,0,.5);color:#fff;font:600 22px system-ui}
#over[hidden]{display:none}</style></head>
<body>
<div id="hud"></div>
<div id="over" hidden>
  <div style="font-size:44px">Game over</div>
  <div id="final"></div>
  <div id="record"></div>
  <div>Press R to run again</div>
</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The high score, kept in the browser under one key per game.
const KEY = 'hurdle-run.highScore';
function loadHigh() {
  try { return Number(localStorage.getItem(KEY)) || 0; }   // nothing saved yet: getItem gives null, and Number(null) is 0
  catch { return 0; }                                      // storage blocked: play on without it
}
function saveHigh(value) {
  try { localStorage.setItem(KEY, String(value)); } catch { /* blocked or full: it lasts until the page closes */ }
}

const hud = document.getElementById('hud'), overlay = document.getElementById('over');
let highScore = loadHigh();
let score, over, newHigh, speed, runner, hurdles;

function reset() {
  score = 0; over = false; newHigh = false; speed = 6;    // speed: how fast hurdles come, in units per second
  runner = { y: 0, vy: 0 };
  hurdles = [{ x: 8 }, { x: 15 }];
  overlay.hidden = true;
}

function step(dt) {
  if (over) return;
  runner.vy -= 25 * dt;                                    // gravity
  runner.y = Math.max(0, runner.y + runner.vy * dt);
  if (runner.y === 0) runner.vy = Math.max(0, runner.vy);
  for (const h of hurdles) {
    h.x -= speed * dt;
    if (Math.abs(h.x) < 0.5 && runner.y < 0.7) return gameOver();   // the bar is 0.7 high
    if (h.x < -6) { h.x += 14 + Math.random() * 4; score++; speed += 0.2; }
  }
}

function gameOver() {
  over = true;
  if (score > highScore) { highScore = score; newHigh = true; saveHigh(highScore); }   // written once, and only when beaten
  document.getElementById('final').textContent = `Score ${score}`;
  document.getElementById('record').textContent = newHigh ? 'New high score!' : `High score ${highScore}`;
  overlay.hidden = false;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fc4e8);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 2.5, 11);
camera.lookAt(0, 1.5, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x667744, 3));

const box = (w, h, d, color, name) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color }));
  m.name = name; scene.add(m); return m;
};
box(30, 0.4, 3, 0x5c8a3a, 'track').position.y = -0.2;
const body = box(0.8, 0.8, 0.8, 0xd94a3a, 'runner');
const white = new THREE.MeshStandardMaterial({ color: 0xffffff });
const bars = [0, 1].map(() => {                            // a hurdle: a bar on two posts
  const hurdle = new THREE.Group();
  hurdle.name = 'hurdle';
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 1.8), white);
  bar.position.y = 0.64;
  hurdle.add(bar);
  for (const z of [-0.8, 0.8]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.1), white);
    post.position.set(0, 0.35, z);
    hurdle.add(post);
  }
  scene.add(hurdle);
  return hurdle;
});

let last = null;
function loop(now) {
  requestAnimationFrame(loop);
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  body.position.set(0, runner.y + 0.4, 0);
  hurdles.forEach((h, i) => bars[i].position.set(h.x, 0, 0));
  hud.textContent = `Score ${score}   High score ${highScore}`;
  renderer.render(scene, camera);
}

function act({ key, down = true, repeat = false }) {
  if (key === 'Space' && down && !repeat && !over && runner.y === 0) runner.vy = 9;   // jump, from the ground
  if (key === 'KeyR' && down && !repeat && over) reset();
}
addEventListener('keydown', e => act({ key: e.code, repeat: e.repeat }));
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

reset();
requestAnimationFrame(loop);

window.__game = {
  subject: 'runner',
  describe: () => ({ name: 'hurdle run', keys: { Space: 'jump', KeyR: 'run again after game over' } }),
  observe: () => ({ score, highScore, newHigh, over, speed: +speed.toFixed(2), runner: { y: +runner.y.toFixed(2) }, hurdles: hurdles.map(h => ({ x: +h.x.toFixed(2) })) }),
  act,
  setState: (s) => {
    if (s.score !== undefined) score = s.score;
    if (s.highScore !== undefined) highScore = s.highScore;
    if (s.speed !== undefined) speed = s.speed;
    if (s.runner) runner = { ...runner, ...s.runner };
    if (s.hurdles) hurdles = s.hurdles.map(h => ({ ...h }));
    if (s.over === true) gameOver(); else if (s.over === false) { over = false; overlay.hidden = true; }
  },
};
</script>
</body></html>
```

The `window.__game` object at the end lets a test tool read the score and the high score and set a moment up. The game plays without it. Its `setState` sets the high score in memory and does not write it to storage, which matters in the next section.

## Checking that the record is kept

paprika3d is a plugin for Claude Code (and an MCP server for other coding agents) that lets the agent run and play the game itself. Install it in Claude Code with:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

Two tools cover a high score. `interact` sets a moment up with a `{ state }` step, plays frames, and checks the result with `expect`; `save` keeps it as a check. `eval` runs a line of JavaScript in the page, which is how the agent reads what is in storage, or clears it. These replies were captured on 2026-10-30 on the game above, on a Linux server with no GPU where Chrome draws in software; the `look` reply is cut to the lines about the panel and the scene, and the folder is shortened to `<project>`.

A run that ends at 4 with a record of 2, then what storage holds, then the picture:

```text
interact {"steps": [{"state": {"score": 4, "highScore": 2, "hurdles": [{"x": 0.3}, {"x": 15}]}}, {"wait": 3}], "expect": {"over": true, "highScore": 4, "newHigh": true}, "save": "beats-high-score"}

{"changed":{"score":4,"highScore":4,"newHigh":true,"over":true,"hurdles":[{"x":0.2},{"x":15}]}}
Expect: over true ✓ · highScore 4 ✓ · newHigh true ✓
Saved check "beats-high-score" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.

eval {"code": "return localStorage.getItem(\"hurdle-run.highScore\")"}

4

look {}

Over the canvas: div#over "Game over Score 4 New high score! Press " shows over 100% of it (background rgba(0, 0, 0, 0.5)) and takes the clicks on 97% of it (listeners on the canvas miss them).
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Score 4 High score 4" [16, 12, 255, 34].
On screen (4):
track 12% [0, 503, 1279, 600] 30 × 3 units, across the view
runner 0.51% [604, 455, 675, 536]
hurdle ×2 0.073% [651, 475, 665, 546] 0.7–1.8 × 0.1–0.15 units
Never visible: none
```

The `{ state }` step put a hurdle right at the runner, so the run ended three frames later with a new record, and storage holds the text `4`. Then the other half of the rule, a lower score that must leave the record alone:

```text
interact {"steps": [{"state": {"score": 1, "highScore": 4, "hurdles": [{"x": 0.3}, {"x": 15}]}}, {"wait": 3}], "expect": {"over": true, "highScore": 4, "newHigh": false}, "save": "lower-score-keeps-high"}

{"changed":{"score":1,"over":true,"hurdles":[{"x":0.2},{"x":15}]}}
Expect: over true ✓ · highScore 4 ✓ · newHigh false ✓
Saved check "lower-score-keeps-high" in game-tests.json (2 checks now); `test` reruns them all, each from a fresh reload.
```

How storage behaves under the tools, as observed here: the reloads inside one `open` keep what the page stored. A saved check that played from a fresh reload after the record was stored started with that record, and `eval` still read it after `test`. A new `open` starts with empty storage, as a first-time player would: after a second `open`, the same `eval` returned `null`. So each check above sets the high score it needs in its `{ state }` step instead of trusting whatever an earlier call left in storage, and the agent clears storage with `eval` (`localStorage.removeItem(...)`) when it wants to test a first play.

What paprika3d does not do: it plays the game in one headless Chrome on one machine, so it cannot show you that a phone or another browser keeps a separate record, and it does not give you a shared leaderboard. A broken record in a later version is caught by the saved checks above; keeping such checks as the game grows is [vibe coding bugs](/guides/vibe-coding-bugs)'s subject.
