---
title: How to make a farming game in three.js: plant, water and harvest
phrase: how to make a farming game
description: How to make a farming game as a first game: the plot as data (each tile tilled or not, a crop stage, watered today or not), one click that does the next job, days that end on a clock or when you sleep, crops that grow a stage overnight when watered, and coins for seeds and harvests, on a small three.js farm; the prompt to give an AI agent, what Stardew Valley adds on top, and how the agent plays several days in seconds with paprika3d's interact and pictures five days at once with look.
meta: How to make a farming game: till, plant, water and harvest on a 4 by 4 three.js plot, with crops that grow one stage each watered day.
intent: make-a-farming-game
queries:
  - "how to make a farming game"
  - "how to make a game like stardew valley"
  - "how to make a farming sim game"
  - "how to make a game like animal crossing"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make a farming game in three.js: plant, water and harvest

A farming game is a loop over days. You prepare the soil, plant seeds, water them every day, wait while they grow, then harvest, sell the crop and buy more seeds. At its heart is one rule: when a day passes, every crop that was watered that day grows one step. Games like Stardew Valley and Animal Crossing build a whole life around that loop, with neighbours, fishing and decorating, but the loop is where a farming game starts. This page builds it on a 4 by 4 plot, in one file you can paste, and then shows how an AI agent can play days of it in seconds to check its own work.

## The parts of a farming game

1. **The plot as data.** Each tile is a small record: tilled or still grass, the crop's stage (none, seed, sprout, young plant, ripe), and whether it was watered today. Everything else reads these records.
2. **One click, the next job.** Click grass and you till it. Click empty soil and you plant a seed. Click a growing crop and you water it. Click a ripe crop and you harvest it.
3. **Days.** A day ends when its clock runs out or when you go to sleep. In the morning, each watered crop grows one stage, and then all the soil dries again, so tomorrow needs watering too.
4. **Coins.** A seed costs 1 coin and a ripe crop sells for 3, so a careful farmer ends each harvest with more seeds than before.
5. **Drawing from the data.** After every change, one function makes the 3D tile match its record: soil colour, a seed, a plant of the right size, a fruit when ripe.

## A small farm

Little farm: click tiles to till, plant, water and harvest, and press Enter to sleep. You start on day 1 with 3 coins and four seeds already in the front row. three.js, a JavaScript library that draws 3D in a web page, draws it, and the whole game is one HTML file. The import map line near the top tells the browser where three.js is, a `node_modules/three` folder next to the file, which `npm install three` makes when you type it in a terminal (the window where you type commands). [How to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains how to open such a file in a browser.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Little farm</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:16px;left:20px;font:600 20px system-ui;color:#fff;text-shadow:0 1px 3px #0008}
#msg{font-size:16px;margin-top:6px}</style></head>
<body>
<div id="hud"><div id="text"></div><div id="msg">Click a tile to till, plant, water or harvest. Enter: sleep.</div></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe3ff);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 5.5, 5.5);
camera.lookAt(0, 0, 0.3);
scene.add(new THREE.HemisphereLight(0xffffff, 0x507040, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(3, 6, 2);
scene.add(sun);
const meadow = new THREE.Mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xa8d07a }));
meadow.name = 'meadow';
meadow.position.y = -0.1;
scene.add(meadow);

const tileGeo = new THREE.BoxGeometry(0.92, 0.2, 0.92), seedGeo = new THREE.SphereGeometry(0.12, 8, 6);
const leafGeo = new THREE.ConeGeometry(0.25, 0.8, 8), fruitGeo = new THREE.SphereGeometry(0.2, 12, 8);
const seedMat = new THREE.MeshStandardMaterial({ color: 0x5a3d22 }), leafMat = new THREE.MeshStandardMaterial({ color: 0x3f9a3a });
const fruitMat = new THREE.MeshStandardMaterial({ color: 0xff8a1a });

// The farm is data: 16 tiles, each tilled or not, a crop stage (-1 none, 0 seed, 1 sprout, 2 young, 3 ripe) and watered today or not.
const tiles = [];
for (let i = 0; i < 16; i++) {
  const mesh = new THREE.Mesh(tileGeo, new THREE.MeshStandardMaterial({ color: 0x6aa84f }));
  mesh.name = `tile ${i}`;
  mesh.position.set(i % 4 - 1.5, 0, 1.5 - Math.floor(i / 4));   // tiles 0 to 3 are the front row
  const seed = new THREE.Mesh(seedGeo, seedMat), leaf = new THREE.Mesh(leafGeo, leafMat), fruit = new THREE.Mesh(fruitGeo, fruitMat);
  seed.position.y = 0.12;
  fruit.position.set(0.15, 0.45, 0.15);
  mesh.add(seed, leaf, fruit);
  scene.add(mesh);
  const front = i < 4;   // the farm starts with four seeds in the front row
  tiles.push({ mesh, seed, leaf, fruit, tilled: front, stage: front ? 0 : -1, watered: false });
}

let day = 1, coins = 3, clock = 0;
const text = document.getElementById('text'), msg = document.getElementById('msg');

function show(t) {
  t.mesh.material.color.set(!t.tilled ? 0x6aa84f : t.watered ? 0x4a2f18 : 0x9a6a3a);   // grass, wet soil, dry soil
  t.seed.visible = t.stage === 0;
  t.leaf.visible = t.stage >= 1;
  t.leaf.scale.setScalar(0.25 + t.stage * 0.25);
  t.leaf.position.y = 0.1 + 0.4 * t.leaf.scale.y;
  t.fruit.visible = t.stage === 3;
}
function hud() { text.textContent = `Day ${day}   Coins: ${coins}`; }

// One click does the next job the tile needs.
function work(t) {
  if (!t.tilled) { t.tilled = true; msg.textContent = 'Tilled the soil'; }
  else if (t.stage === 3) { t.stage = -1; t.watered = false; coins += 3; msg.textContent = 'Harvested: +3 coins'; }
  else if (t.stage < 0) {
    if (coins < 1) { msg.textContent = 'A seed costs 1 coin'; return; }
    coins--; t.stage = 0; msg.textContent = 'Planted a seed';
  }
  else if (!t.watered) { t.watered = true; msg.textContent = 'Watered'; }
  else msg.textContent = 'Already watered today';
  show(t);
  hud();
}

// A new day: every watered crop grows one stage, then all the soil dries out.
function sleep() {
  day++;
  clock = 0;
  for (const t of tiles) {
    if (t.stage >= 0 && t.stage < 3 && t.watered) t.stage++;
    t.watered = false;
    show(t);
  }
  msg.textContent = `Good morning: day ${day}`;
  hud();
}

const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
addEventListener('pointerdown', (e) => {
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  const hit = ray.intersectObjects(tiles.map(t => t.mesh), false)[0];
  if (hit) work(tiles.find(t => t.mesh === hit.object));
});
function act({ key, down = true }) { if (key === 'Enter' && down) sleep(); }
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.key }); });   // a held key repeats: one sleep per press

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
tiles.forEach(show);
hud();
let last = null;
renderer.setAnimationLoop((now) => {
  clock += last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;
  if (clock > 60) sleep();   // a day lasts 60 seconds unless you sleep sooner
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'little farm', units: 'tiles', keys: { Enter: 'sleep until the next day' }, mouse: 'click a tile to till, plant, water or harvest it' }),
  observe: () => ({ day, coins, stage: tiles.map(t => t.stage), watered: tiles.map(t => t.watered) }),
  act,
  // A testing shortcut: sleep until day s.day, watering every crop each morning when s.watered is true.
  setState: (s) => { while (s.day > day) { if (s.watered) for (const t of tiles) if (t.stage >= 0) t.watered = true; sleep(); } },
};
</script>
</body></html>
```

## How the code works

**Data first, drawing second.** The `tiles` list is the farm. `show(t)` reads one tile's record and sets what you see: grass green, dry soil brown, wet soil dark brown, a seed at stage 0, a plant that gets bigger at stages 1 and 2, and an orange fruit at stage 3. Because the picture always comes from the data, the two can never disagree.

**Clicking a tile.** A raycaster sends an invisible line from the camera through the mouse point and returns the objects it passes through, nearest first. The first tile hit gets `work`, which checks the tile's record and does the one job it needs next.

**The day.** The game loop, the function three.js calls once per frame, adds the time since the last frame to `clock`. After 60 seconds, or when you press Enter, `sleep` starts a new day: it moves each watered crop up one stage, stops at ripe, and then marks every tile as dry. The order matters: grow first, then dry.

**A shortcut for testing.** `setState` in `window.__game` jumps ahead to a later day, watering every crop each morning when asked. A player never sees it; it lets you (or an agent) check day 4 without playing three days first.

## What Stardew Valley and Animal Crossing add

Stardew Valley puts a character on the farm who walks to each tile with a hoe and a watering can, and adds seasons with different crops, a town of people to befriend, fishing, mining, tools to upgrade, and a full inventory. Animal Crossing trades the crops for an island to decorate and neighbours to visit. Each of those is a feature you can add to this farm one at a time, and some have pages of their own: a bag and a shop in [how to make an inventory in a game](/guides/make-an-inventory-in-a-game), a pond in [how to make a fishing game](/guides/make-a-fishing-game), and mornings and nights in [how to make a day night cycle in a game](/guides/make-a-day-night-cycle).

## What to ask your AI agent

An AI coding agent, an assistant such as Claude Code that writes and edits your project's files, can build this from a description. The rule about watering is the part to state exactly:

```text
Make a small three.js farming game in one HTML file. A 4 by 4 plot of tiles, each with
tilled (true or false), stage (-1 none, 0 seed, 1 sprout, 2 young, 3 ripe) and watered
(today). Clicking a tile does its next job: till grass, plant a seed for 1 coin, water a
crop, or harvest a ripe crop for 3 coins. A day lasts 60 seconds or ends when I press
Enter. At the start of each new day, every watered crop grows one stage (up to ripe),
then every tile dries. Draw each tile from its data after every change. Expose
window.__game with observe (day, coins, each tile's stage and watered), act, and a
setState({ day, watered }) that skips ahead to a day, watering every crop each morning.
```

## When it does not work

- **Crops never grow.** The soil dries before the growth check runs. In the new-day code, grow first and dry second.
- **Crops grow while you watch.** Growth was put in the game loop, which runs every frame, instead of in the code that starts a new day.
- **A click hits the wrong tile or none.** The mouse position must be turned into numbers from -1 to 1 across the canvas before the raycaster uses it, and the camera must be told the new shape when the window is resized.
- **Watering changes nothing you can see.** The tile's data changed but nothing redrew it. Call one drawing function after every change, as `show` here.
- **Holding Enter skips several days.** A held key repeats its keydown event many times a second; check `e.repeat` and act on the first press alone.

## Let the agent play days in seconds

A farming game is slow to test by hand: checking that a crop ripens means playing several days. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs the game in a hidden Chrome browser so the agent can play it and read the result, then fix its own bugs.

After a first `look` at the plot, the agent found tile 0's centre on screen, (423, 516), with `eval`. `interact` then clicks it once (the four seeds start dry, so that click waters the first), presses Enter to sleep, and checks with `expect` that the watered crop grew and the dry one next to it did not:

```text
interact {"steps":[{"mouse":"click","x":423,"y":516},{"key":"Enter"}],"expect":{"day":2,"stage.0":1,"stage.1":0}}

{"changed":{"day":2,"stage":[1,0,0,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]}}
mouse click at (423, 516): over tile 0 (Mesh, 6.8 units)
Expect: day 2 ✓ · stage.0 1 ✓ · stage.1 0 ✓
```

`look` with `sheet` reloads the game for each picture, sets it up with the game's `setState`, and puts all the pictures in one grid. Here it is five days of a watered plot, and day 5 of a plot nobody watered:

```text
look {"sheet":[{"label":"day 1","state":{"day":1}},{"label":"day 2","state":{"day":2,"watered":true}},{"label":"day 3","state":{"day":3,"watered":true}},{"label":"day 4","state":{"day":4,"watered":true}},{"label":"day 5","state":{"day":5,"watered":true}},{"label":"day 5, never watered","state":{"day":5}}]}

Picture: <project>/paprika3d/runs/2026-11-01T00-37-11-658Z/look-8-sheet.png (6 moments, left to right, top to bottom: day 1 | day 2 | day 3 | day 4 | day 5 | day 5, never watered); the game is reloaded at its first frame
day 1: on screen: meadow, tile * ×20; pixels: brightness 75%, colour saturation 33%, 0% near black, 0% blown out
day 2: on screen: meadow, tile * ×20; pixels: brightness 75%, colour saturation 33%, 0% near black, 0% blown out
day 3: on screen: meadow, tile * ×20; pixels: brightness 75%, colour saturation 33%, 0% near black, 0% blown out
day 4: on screen: meadow, tile * ×24; pixels: brightness 75%, colour saturation 33%, 0% near black, 0% blown out
day 5: on screen: meadow, tile * ×24; pixels: brightness 75%, colour saturation 33%, 0% near black, 0% blown out
day 5, never watered: on screen: meadow, tile * ×20; pixels: brightness 75%, colour saturation 33%, 0% near black, 0% blown out
This sheet took 4 s (about 1 s a cell) on a software renderer.
```

The picture shows the front row as seeds on day 1, small sprouts on day 2, taller plants on day 3 and four orange fruits from day 4 on; the four fruits are also why the count of tile parts goes from 20 to 24. The plot that was never watered still shows four seeds on day 5. The last check jumps to day 4, harvests tile 0, and saves the play as a check that `test` reruns after every later change:

```text
interact {"steps":[{"state":{"day":4,"watered":true}},{"mouse":"click","x":423,"y":516}],"expect":{"day":4,"coins":6,"stage.0":-1,"stage.1":3},"save":"harvest"}

{"changed":{"day":4,"coins":6,"stage":[-1,3,3,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]}}
mouse click at (423, 516): over tile 0 (Mesh, 6.3 units)
Expect: day 4 ✓ · coins 6 ✓ · stage.0 -1 ✓ · stage.1 3 ✓
Saved check "harvest" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

These replies were captured on 2026-11-01 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not balance the prices or tell you whether the farm is relaxing to play; that is for you to judge by playing it. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Next steps

- Keep the farm between visits, so tomorrow starts where today ended: [how to save game progress](/guides/save-game-progress).
- Houses, roads and a town on a grid of tiles: [how to make a city builder game](/guides/make-a-city-builder-game).
- A farmer who walks the rows: [how to make a character move in JavaScript](/guides/make-a-character-move-in-javascript).
- Sounds for the hoe and the harvest: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Share the farm: [how to put your game online](/guides/put-your-game-online).
- Leaving the farm for a small island to explore: [how to make an open world game](/guides/make-an-open-world-game).
