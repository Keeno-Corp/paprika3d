---
title: How to make a clicker game in three.js: clicks, upgrades and numbers that grow
phrase: how to make a clicker game
description: How to make a clicker or idle game like Cookie Clicker in the browser with three.js, for a first game: the game as a few numbers, a click that earns, upgrades that earn on their own at a fixed tick rate, prices that grow by a percentage with each purchase, and very large numbers shown as 1.2M without the 1000.0K rounding trap; a small gold mine game to paste, the prompt to give an AI agent, and paprika3d clicking the rock, waiting a thousand frames and checking the number format past a billion.
meta: How to make a clicker game in three.js: clicks that earn, drills that dig on their own, prices that grow 15% a buy, and numbers shown as 1.2M.
intent: make-a-clicker-game
queries:
  - "how to make a clicker game"
  - "how to make an idle game in javascript"
  - "how to make a cookie clicker game"
  - "How do idle games handle such large numbers?"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a clicker game in three.js: clicks, upgrades and numbers that grow

A clicker game (also called an idle or incremental game; Cookie Clicker is the famous one) has one loop. You click to earn something, spend it on things that earn for you, and those earn more to spend on more of them. Each purchase costs a little more than the last, so the next one always takes a little longer, and the numbers on screen grow from tens to millions to numbers with names. It is a good first game because it is almost all arithmetic: the whole game is a handful of numbers, and the 3D scene shows them. It takes five parts:

1. **A few numbers**: what the player has (gold), what they own (drills) and how strong a click is (the pick).
2. **A click that earns**: click the rock, get gold.
3. **Income on a clock**: each drill adds gold every tick, whether the player clicks or not.
4. **Prices that grow**: each drill costs 15% more than the one before.
5. **Big numbers shown short**: 1,234,567 gold appears as 1.2M.

A few words first. **three.js** is a JavaScript library that draws 3D scenes in a web page, inside a **canvas** (the rectangle where the game appears). The **game loop** is a function the browser calls about sixty times a second; each call moves things a little and draws one picture. A **tick** is one step of the game's rules; here there are 60 of them in each second of play. The buttons are plain **HTML**, the language web pages are written in, laid over the canvas.

## The game is a few numbers

```js
let gold = 0, drills = 0, pick = 1;
```

That line is the whole state of the game. A click adds `pick` to `gold`. A drill bought takes its price from `gold` and adds one to `drills`. Each tick adds `drills * DRILL_RATE / 60` to `gold`, so each drill brings one gold a second. Everything on screen, the gold counter, the price on each button, the drills circling the rock, is worked out from these three numbers every frame. Keeping them apart from the drawing is what makes the game easy to save, test and balance later.

To know whether a click landed on the rock, the game uses a **raycaster**: three.js shoots a line from the camera through the mouse pointer into the scene and reports what it hits. If the rock is hit, the player digs.

## Income on a clock

Income has to depend on time, not on how often the browser draws. A screen that refreshes faster calls the game loop more often, and a game that adds gold every frame pays faster on the faster screen. So the loop counts real time and runs one tick for every 1/60 s that has passed, and each tick adds a sixtieth of a second's income.

While the tab is hidden, the browser stops calling the loop and the mine earns nothing. Paying the player for time away (what idle games call offline progress) means storing the time when they left and adding the gold for the gap when they come back; that needs a save first.

## Prices that grow

The price of the next drill is the first price times 1.15 for each drill already owned:

```js
const drillPrice = () => Math.round(10 * 1.15 ** drills);
```

Income grows by the same amount with every drill, but the price grows by a percentage, so each new drill takes a little longer to afford than the one before. That gap is what paces a clicker game: the first drills come in seconds, the hundredth in hours. The second upgrade, a better pick, doubles what a click earns and costs four times more each time. Two or three upgrades with different curves give the player a choice at every step: which one pays for itself sooner?

## Very large numbers

"How do idle games handle such large numbers?" is a Game Development Stack Exchange question with more than 47,000 views. In JavaScript the short answer is that an ordinary number already goes far. It holds whole numbers exactly up to about 9 quadrillion (9 followed by 15 digits), and it holds any number up to about 1.8 × 10<sup>308</sup> with 15 to 17 significant digits. A clicker shows three or four of those digits, so the lost precision of a large number never shows on screen. Past 10<sup>308</sup> a JavaScript number becomes `Infinity`, and games that grow beyond that use a library such as break_infinity.js, which stores a number as its digits and its power of ten separately.

Showing the number is the part that needs care. The game divides by 1,000 until the number is under 1,000, and names the steps: K for thousand, M for million, B for billion, T for trillion, and so on. The trap is rounding: 999,950 divided by 1,000 is 999.95, which `toFixed(1)` rounds to "1000.0", and the counter reads 1000.0K. The `format` function in the game moves up one step when the rounded number reaches 1,000, so the same gold reads 1.0M. Past the last name in the list, it shows the number with a power of ten instead.

## Keeping progress

Everything above is lost when the page closes, and people leave a clicker game running for days. The state here is three numbers, which makes it small to save; [how to save game progress](/guides/save-game-progress) shows how to save and load a whole game with a Continue button, and [how to save the high score](/guides/save-the-high-score) is the one-number version.

## The game: gold rock

Click the rock to dig gold, then buy drills, which dig on their own, and better picks. Save the file as `index.html`, run `npm install three` in its folder (this needs Node.js, a free program that installs JavaScript libraries), serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Gold rock</title>
<style>html,body{margin:0;overflow:hidden;background:#3a2a20;font-family:system-ui}canvas{display:block}
#gold{position:fixed;top:18px;width:100%;text-align:center;color:#ffd75a;font:800 40px system-ui}
#rate{position:fixed;top:68px;width:100%;text-align:center;color:#e8d8c0;font:600 18px system-ui}
#shop{position:fixed;bottom:24px;width:100%;display:flex;justify-content:center;gap:16px}
button{font:700 18px system-ui;padding:12px 18px;border:0;border-radius:10px;background:#ffd75a;color:#3a2a10;cursor:pointer}
button:disabled{background:#6a5a48;color:#2a2018;cursor:default}</style></head>
<body>
<div id="gold"></div><div id="rate"></div>
<div id="shop"><button id="drill"></button><button id="pick"></button></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The whole game is a few numbers.
let gold = 0, drills = 0, pick = 1;
const DRILL_RATE = 1;                                       // gold a second from each drill
const drillPrice = () => Math.round(10 * 1.15 ** drills);   // each drill costs 15% more than the last
const pickPrice = () => 50 * 4 ** (pick - 1);               // each better pick doubles a click and costs 4 times more
const perSecond = () => drills * DRILL_RATE;

// 1234567 becomes "1.2M". Past the list, the number is shown with an exponent.
const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
function format(n) {
  if (n < 1000) return String(Math.floor(n));
  let tier = Math.floor(Math.log10(n) / 3);
  let shown = (n / 1000 ** tier).toFixed(1);
  if (Number(shown) >= 1000) { tier++; shown = (n / 1000 ** tier).toFixed(1); }   // 999,950 is "1.0M", not "1000.0K"
  return tier < SUFFIXES.length ? shown + SUFFIXES[tier] : n.toExponential(1);
}

function dig() { gold += pick; bounce = 1; }
function buyDrill() { if (gold >= drillPrice()) { gold -= drillPrice(); drills++; } }
function buyPick() { if (gold >= pickPrice()) { gold -= pickPrice(); pick *= 2; } }

// The scene: a rock with gold in it, and a drill around it for each one bought.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.NeutralToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3a2a20);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 1.2, 7);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight(0xfff0d8, 0x302018, 1.5));
const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.position.set(3, 5, 4);
scene.add(sun);

const rock = new THREE.Group();
rock.name = 'rock';
const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), new THREE.MeshStandardMaterial({ color: 0x7a6858, flatShading: true }));
rock.add(stone);
const goldMaterial = new THREE.MeshStandardMaterial({ color: 0xffc830, emissive: 0x6a4800, roughness: 0.35 });
for (let i = 0; i < 14; i++) {                            // gold nuggets spread evenly over the rock
  const y = 1 - (i + 0.5) / 7, r = Math.sqrt(1 - y * y);
  const nugget = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), goldMaterial);
  nugget.position.set(Math.cos(i * 2.4) * r, y, Math.sin(i * 2.4) * r).multiplyScalar(1.25);
  rock.add(nugget);
}
scene.add(rock);

const drillGeometry = new THREE.ConeGeometry(0.16, 0.6, 8).rotateX(Math.PI / 2);
const drillMaterial = new THREE.MeshStandardMaterial({ color: 0xb8c0c8, metalness: 0.3, roughness: 0.5 });
const drillMeshes = [];
function showDrills() {                                   // one drill on the ring per drill owned, up to 24
  while (drillMeshes.length < Math.min(drills, 24)) {
    const i = drillMeshes.length, angle = i * 2.4, height = ((i * 7) % 11) / 10 - 0.5;
    const d = new THREE.Mesh(drillGeometry, drillMaterial);
    d.name = 'drill';
    d.position.set(Math.cos(angle) * 1.9, height, Math.sin(angle) * 1.9);
    d.lookAt(0, height, 0);
    scene.add(d);
    drillMeshes.push(d);
  }
}

// Clicking the rock digs. The buttons buy.
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', e => {
  pointer.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.intersectObject(rock).length) dig();
});
const goldText = document.getElementById('gold'), rateText = document.getElementById('rate');
const drillButton = document.getElementById('drill'), pickButton = document.getElementById('pick');
drillButton.onclick = buyDrill;
pickButton.onclick = buyPick;

let bounce = 0;
function tick() {                                         // 60 ticks a second
  gold += perSecond() / 60;
  bounce = Math.max(0, bounce - 0.1);
}

function draw(time) {
  showDrills();
  rock.scale.setScalar(1 + 0.08 * Math.sin(bounce * Math.PI));
  rock.rotation.y = time * 0.2;
  for (const d of drillMeshes) d.rotateZ(0.3);
  goldText.textContent = `${format(gold)} gold`;
  rateText.textContent = `${format(perSecond())} a second, ${format(pick)} a click`;
  drillButton.textContent = `Drill: ${format(drillPrice())}`;
  pickButton.textContent = `Better pick: ${format(pickPrice())}`;
  drillButton.disabled = gold < drillPrice();
  pickButton.disabled = gold < pickPrice();
}

function fit() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}
addEventListener('resize', fit);
fit();
let last = null, time = 0, clock = 0;
renderer.setAnimationLoop(now => {
  time += last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;
  for (; time >= 1 / 60; time -= 1 / 60) { tick(); clock += 1 / 60; }
  draw(clock);
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'gold rock', units: 'gold', mouse: 'click the rock to dig; the buttons buy drills and a better pick' }),
  observe: () => ({ gold: Math.floor(gold), drills, pick, perSecond: perSecond(), drillPrice: drillPrice(), pickPrice: pickPrice() }),
  act: ({ action }) => ({ dig, buyDrill, buyPick })[action]?.(),
  setState: s => { if (s.gold !== undefined) gold = s.gold; if (s.drills !== undefined) drills = s.drills; if (s.pick !== undefined) pick = s.pick; },
  format,
};
</script>
</body></html>
```

The numbers and rules come first and know nothing of three.js: `gold`, `drills` and `pick`, the two prices, `format`, and the three actions `dig`, `buyDrill` and `buyPick`. The scene is a rock with gold nuggets, and one spinning drill appears around it for each drill bought. `tick()` runs 60 times a second of game time and adds the income; `draw()` copies the numbers onto the screen. `window.__game` at the end lets a test tool read the numbers, set them, and call `format`; the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code, Cursor or Codex that writes and edits the files of your project) can write this from a prompt that names the numbers:

```text
Make a clicker game in one index.html with three.js: a 3D rock in the middle that gives
1 gold per click, and HTML buttons to buy upgrades. A drill costs 10 gold, then 15%
more for each one owned, and digs 1 gold a second; show one spinning drill around the
rock for each. A better pick doubles gold per click and costs 4 times more each time.
Keep gold, drills and pick as plain numbers apart from the drawing, add income in fixed
ticks of 1/60 s (not per frame), and grey out a button the player cannot afford. Show
big numbers as 1.2K, 3.4M, 5.6B, with 999,950 shown as 1.0M, and an exponent past the
last suffix.
```

## When a clicker game goes wrong

- **The gold grows faster on one computer than another.** Income is added per frame. Add it per tick of fixed length.
- **The counter shows 1000.0K.** The number was rounded after choosing K. Move to the next step when the rounded number reaches 1,000.
- **The counter jitters with decimals, or shows 12.000000001.** Income adds fractions of gold every tick. Keep the fractions in the number and round down when showing it.
- **Gold goes below zero.** A purchase took the price before checking that the player could pay. Check, then take.
- **The counter shows NaN** (JavaScript for "not a number"). A price or rate was worked out from a value that does not exist yet, such as a misspelled variable. Start every number at 0 or 1.
- **Everything is gone after a reload.** Nothing saved it. See [how to save game progress](/guides/save-game-progress).

## Let the agent play it

A clicker needs long play to test, and nobody clicks and waits by hand after every change. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can click it, let time pass and read the numbers. Install it in Claude Code with these two lines in a terminal (the window where you type commands):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

`interact` plays steps frame by frame on the harness's own clock, so a thousand frames of game time take as long as the computer needs to draw them, not sixteen seconds of waiting. Here it clicks the rock ten times, clicks the Drill button and waits a thousand frames; `expect` checks the drill, the gold and the next price:

```text
interact {"steps":[{"mouse":"click","x":640,"y":400},{"mouse":"click","x":640,"y":400},{"mouse":"click","x":640,"y":400},{"mouse":"click","x":640,"y":400},{"mouse":"click","x":640,"y":400},{"mouse":"click","x":640,"y":400},{"mouse":"click","x":640,"y":400},{"mouse":"click","x":640,"y":400},{"mouse":"click","x":640,"y":400},{"mouse":"click","x":640,"y":400},{"mouse":"click","x":533,"y":753},{"wait":1000}],"expect":{"drills":1,"gold":[16,17],"drillPrice":12}}

{"changed":{"gold":16,"drills":1,"perSecond":1,"drillPrice":12}}
mouse click at (640, 400): over rock (Group, 5.7 units)
Expect: drills 1 ✓ · gold 16 ✓ · drillPrice 12 ✓
```

Ten clicks bought the first drill, the drill dug about sixteen gold in a thousand frames, and the second drill costs 12, which is 10 × 1.15 rounded. `eval` runs code inside the page; here it asks `format` for numbers on both sides of each step and past a billion, and works out the price of the next drill with 0, 10, 50 and 100 already owned:

```js
const { format } = window.__game;
const shown = {};
for (const n of [999, 1000, 12345, 999949, 999950, 1234567, 1e9, 2.5e12, 1e36, 1e40]) shown[n] = format(n);
const drillPrice = {};
for (const owned of [0, 10, 50, 100]) drillPrice[owned] = format(Math.round(10 * 1.15 ** owned));
return { shown, drillPrice };
```

With the step-up line taken out of `format`, the answer was:

```text
{"shown":{"999":"999","1000":"1.0K","12345":"12.3K","999949":"999.9K","999950":"1000.0K","1234567":"1.2M","1000000000":"1.0B","2500000000000":"2.5T","1e+36":"1.0e+36","1e+40":"1.0e+40"},"drillPrice":{"0":"10","10":"40","50":"10.8K","100":"11.7M"}}
```

999,950 gold read "1000.0K". With the step-up line, as in the game above:

```text
{"shown":{"999":"999","1000":"1.0K","12345":"12.3K","999949":"999.9K","999950":"1.0M","1234567":"1.2M","1000000000":"1.0B","2500000000000":"2.5T","1e+36":"1.0e+36","1e+40":"1.0e+40"},"drillPrice":{"0":"10","10":"40","50":"10.8K","100":"11.7M"}}
```

The prices show the curve: with 50 drills the next one costs 10.8K, and with 100 it costs 11.7M, while each drill still digs one gold a second. These replies were captured on 2026-10-31 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not balance the prices or decide whether the hundredth drill comes at the right moment; it plays what the agent asks and reports the numbers. The number check is code the agent writes for this game, not a built-in test.

## Next steps

- Save and load the gold, the drills and the pick: [how to save game progress](/guides/save-game-progress).
- Make each click feel like something, with a burst and a shake: [how to make a game feel good](/guides/make-a-game-feel-good).
- A sound for every click and purchase: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Pacing that keeps people playing: [how to make a game more fun](/guides/make-a-game-more-fun).
- Taps on a phone: [how to make a mobile game with AI](/guides/make-a-mobile-game-with-ai).
- Share it: [how to put your game online](/guides/put-your-game-online).
- Another game for quick fingers, played by swiping: [how to make a fruit ninja game](/guides/make-a-fruit-ninja-game).
