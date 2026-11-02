---
title: How to make an inventory in a game: gathering and crafting in a three.js survival game
phrase: how to make an inventory in a game
description: How to make an inventory in a game for a first game: a row of slots that each hold one stack (an item and a count), adding that fills stacks before empty slots, removing that frees a slot, recipes checked before anything is taken, and a shop as the same recipe paid in coins, on a small three.js survival game where you gather wood and stone and build a fire before night; the prompt to give an AI agent, the inventory bugs to check for, and how the agent gathers, crafts and checks the stacks with paprika3d's interact, look and eval.
meta: How to make an inventory in a game: slots, stacks, recipes and a shop, in a small three.js survival game where you build a fire before night.
intent: make-an-inventory-in-a-game
queries:
  - "how to make an inventory in a game"
  - "how to make a crafting system in a game"
  - "how to make a survival game"
  - "How can I implement an inventory that stores different types of items?"
  - "Inventory System?"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make an inventory in a game: gathering and crafting in a three.js survival game

A game's inventory is a list of what the player carries, and most games shape it the same way: a fixed number of **slots**, the boxes along the bottom of the screen, and in each slot one **stack**, an item's name and how many of it. Five pieces of wood might fill one slot, a sixth starts the next. With that list in place, four small functions do everything:

1. **count(item)**: how many the player has, across all stacks.
2. **add(item, n)**: top up stacks of that item first, then use empty slots, and report what did not fit.
3. **remove(item, n)**: take from the stacks, and empty a slot whose stack reaches zero.
4. **craft(recipe)**: check that every ingredient is there, then remove them all and add the result.

This page builds these into a small survival game made with three.js (a JavaScript library that draws 3D scenes in a web page): one night in a forest clearing, where you gather wood and stone, craft an axe, and build a campfire before dark.

## Slots and stacks

In code the inventory is a plain list, one entry per slot, each `null` or an object:

```js
[{ item: 'wood', count: 5 }, { item: 'wood', count: 1 }, null, null, null]
```

That is the whole inventory after chopping six wood with a stack limit of five. The limit, `MAX_STACK`, and the number of slots are what make carrying a choice: when the bar is full, the player has to decide what to drop or use. Items of different kinds, the question one asker put as "an inventory that stores different types of items", need nothing special here: a slot holds a name and a count, whatever the name is. When items carry more than a count (an axe that wears out, a potion's strength), the stack gets more fields, such as `{ item: 'axe', count: 1, uses: 20 }`.

Two rules keep a list like this from going wrong. Adding fills partly full stacks of the same item before it takes an empty slot, so wood does not spread across five half-empty slots. And removing sets a slot back to `null` when its count reaches zero, so the bar never shows "wood 0" and the slot is free again.

## Recipes, and why the check comes first

A recipe is data, the items and amounts it takes:

```js
const RECIPES = { axe: { wood: 2, stone: 1 }, campfire: { wood: 4, stone: 3 } };
```

`craft` first checks every ingredient with `count`, and removes nothing until all of them are there. Removing as it goes would take the wood, find the stone missing, and leave the player poorer with nothing to show for it. The crafting buttons in the game are greyed out from the same check, so the player sees which recipes are within reach. Adding a new recipe is one more line in `RECIPES`.

## A shop is a recipe paid in coins

Buying is crafting where the ingredient is money. With coins kept as one more item, a shop needs no new code:

```js
const SHOP = { lantern: { coins: 8 }, rope: { coins: 3 } };   // buy with the same check, remove and add as craft
```

Selling is the reverse: remove the item, add coins. Keeping prices in a list like this makes them easy to change while you test whether they feel fair.

## The game

One night in the clearing: walk with the arrow keys and press E beside a tree for wood or a rock for stone. The keys 1 and 2, or the buttons at the top right, craft an axe (which makes each chop give two wood) and build a campfire. Night falls 90 seconds in; with a fire lit you see the morning. Save the code as `index.html`, run `npm install three` in its folder (npm comes with Node.js), serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>One night in the clearing</title>
<style>html,body{margin:0;overflow:hidden;background:#7fb0d8}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#fff;font:600 18px system-ui;text-shadow:0 1px 3px #000}
#bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);display:flex;gap:6px}
.slot{width:64px;height:64px;border:2px solid #ddd;border-radius:6px;background:rgba(0,0,0,.45);color:#fff;
  font:600 14px system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center}
#craft{position:fixed;right:16px;top:12px;display:flex;flex-direction:column;gap:6px}
#craft button{font:600 15px system-ui;padding:6px 10px;cursor:pointer}
#craft button:disabled{opacity:.45;cursor:default}</style></head>
<body>
<div id="hud"></div>
<div id="bar"></div>
<div id="craft"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The inventory: a fixed row of slots, each empty (null) or one stack { item, count }.
const SLOTS = 5, MAX_STACK = 5;
let slots = Array(SLOTS).fill(null);
const count = item => slots.reduce((n, s) => n + (s?.item === item ? s.count : 0), 0);
function addItem(item, n = 1) {                  // fill stacks of the same item first, then empty slots
  for (const s of slots) if (n > 0 && s?.item === item && s.count < MAX_STACK) { const k = Math.min(n, MAX_STACK - s.count); s.count += k; n -= k; }
  for (let i = 0; i < SLOTS && n > 0; i++) if (!slots[i]) { const k = Math.min(n, MAX_STACK); slots[i] = { item, count: k }; n -= k; }
  return n;                                      // what did not fit
}
function removeItem(item, n) {                   // take from the last stack first, and empty a slot that runs out
  for (let i = SLOTS - 1; i >= 0 && n > 0; i--) if (slots[i]?.item === item) {
    const k = Math.min(n, slots[i].count); slots[i].count -= k; n -= k;
    if (!slots[i].count) slots[i] = null;
  }
}

// Crafting: a recipe is what it takes; crafting removes it and adds the result.
const RECIPES = { axe: { wood: 2, stone: 1 }, campfire: { wood: 4, stone: 3 } };
const canCraft = name => Object.entries(RECIPES[name]).every(([item, n]) => count(item) >= n);
function craft(name) {
  if (!canCraft(name) || (name === 'axe' && count('axe'))) return;
  for (const [item, n] of Object.entries(RECIPES[name])) removeItem(item, n);
  if (name === 'campfire') fire = true;          // a campfire is built on the spot, not carried
  else addItem(name);
}

const NIGHT = 90;                                // seconds until night falls
let time = 0, fire = false, result = null, message = '', player = { x: 0, z: 2 };
const SOURCES = [                                // what E gathers near each thing
  { name: 'tree', item: 'wood', x: -4, z: -2 }, { name: 'tree', item: 'wood', x: -5, z: 2 }, { name: 'tree', item: 'wood', x: 4.5, z: -3 },
  { name: 'rock', item: 'stone', x: 4, z: 2.5 }, { name: 'rock', item: 'stone', x: 1.5, z: -3.5 },
];
function gather() {
  const src = SOURCES.find(s => Math.hypot(s.x - player.x, s.z - player.z) < 1.6);
  if (!src) return;
  const n = src.item === 'wood' && count('axe') ? 2 : 1;   // an axe chops twice as much
  message = addItem(src.item, n) ? 'Inventory full' : '';
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 11, 10);
camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const sky = new THREE.HemisphereLight(0xffffff, 0x3a5a2a, 2.2);
scene.add(sky);
const sun = new THREE.DirectionalLight(0xfff0d0, 2);
sun.position.set(-5, 10, 4);
scene.add(sun);
const mesh = (geo, color, name, x, y, z) => {
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color })); m.name = name; m.position.set(x, y, z); scene.add(m); return m;
};
mesh(new THREE.BoxGeometry(60, 0.2, 60), 0x2c4a22, 'forest floor', 0, -0.2, 0);
mesh(new THREE.CylinderGeometry(8, 8, 0.2, 40), 0x4f7a35, 'clearing', 0, -0.1, 0);
for (const s of SOURCES) {
  if (s.item === 'wood') { mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.2, 8), 0x6b4a2b, 'trunk', s.x, 0.6, s.z); mesh(new THREE.ConeGeometry(1, 2.2, 10), 0x2f6b34, 'tree', s.x, 2, s.z); }
  else mesh(new THREE.DodecahedronGeometry(0.6), 0x8d8d8d, 'rock', s.x, 0.4, s.z);
}
const hero = mesh(new THREE.CapsuleGeometry(0.3, 0.6, 4, 12), 0xd9a441, 'player', 0, 0.6, 0);
const campfire = mesh(new THREE.ConeGeometry(0.5, 0.8, 8), 0xff7a1a, 'campfire', 0, 0.4, 0);
const glow = new THREE.PointLight(0xff9a40, 0, 8);
glow.position.set(0, 1, 0);
scene.add(glow);

const held = new Set();
function step(dt) {
  if (result) return;
  time += dt;
  player.x = Math.min(6, Math.max(-6, player.x + (held.has('ArrowRight') - held.has('ArrowLeft')) * 4 * dt));
  player.z = Math.min(5, Math.max(-5, player.z + (held.has('ArrowDown') - held.has('ArrowUp')) * 4 * dt));
  if (time >= NIGHT) result = fire ? 'survived' : 'too cold';
}

const bar = document.getElementById('bar'), craftPanel = document.getElementById('craft'), hud = document.getElementById('hud');
const buttons = Object.keys(RECIPES).map((name, i) => {
  const b = document.createElement('button');
  b.textContent = `${i + 1}. ${name}: ` + Object.entries(RECIPES[name]).map(([item, n]) => `${n} ${item}`).join(', ');
  b.onclick = () => craft(name);
  craftPanel.append(b);
  return b;
});
function drawHtml() {
  bar.replaceChildren(...slots.map(s => {
    const d = document.createElement('div');
    d.className = 'slot';
    d.textContent = s ? `${s.item} ${s.count}` : '';
    return d;
  }));
  Object.keys(RECIPES).forEach((name, i) => { buttons[i].disabled = !canCraft(name) || (name === 'axe' && count('axe') > 0); });
  hud.textContent = result === 'survived' ? 'Morning! You made it through the night.'
    : result ? 'The fire was never lit. Too cold to go on.'
    : `Night falls in ${Math.ceil(NIGHT - time)} s   ${message}`;
}

let last = null;
function loop(t) {
  requestAnimationFrame(loop);
  step(last === null ? 1 / 60 : Math.min((t - last) / 1000, 0.1));
  last = t;
  hero.position.set(player.x, 0.6, player.z);
  campfire.visible = fire;
  glow.intensity = fire ? 30 : 0;
  const dusk = Math.min(1, Math.max(0, (time - NIGHT + 30) / 30));   // the last 30 s get dark
  sky.intensity = 2.2 - 1.9 * dusk;
  sun.intensity = 2 * (1 - dusk);
  scene.background = new THREE.Color(0x7fb0d8).lerp(new THREE.Color(0x0b1026), dusk);
  drawHtml();
  renderer.render(scene, camera);
}

function act({ key, down = true, repeat = false }) {
  if (key.startsWith('Arrow')) down ? held.add(key) : held.delete(key);
  if (!down || repeat || result) return;
  if (key === 'KeyE') gather();
  if (key === 'Digit1') craft('axe');
  if (key === 'Digit2') craft('campfire');
}
addEventListener('keydown', e => act({ key: e.code, repeat: e.repeat }));
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
requestAnimationFrame(loop);

window.__game = {
  subject: 'player',
  recipes: RECIPES,
  describe: () => ({ name: 'one night in the clearing', keys: { ArrowRight: 'walk right', ArrowLeft: 'walk left', ArrowUp: 'walk up', ArrowDown: 'walk down', KeyE: 'gather', Digit1: 'craft an axe', Digit2: 'build a campfire' } }),
  observe: () => ({ slots: slots.map(s => s && { ...s }), fire, result, time: +time.toFixed(2), player: { x: +player.x.toFixed(2), z: +player.z.toFixed(2) } }),
  act,
  setState: (s) => {
    if (s.slots) slots = s.slots.map(x => x && { ...x });
    if (s.fire !== undefined) fire = s.fire;
    if (s.time !== undefined) time = s.time;
    if (s.result !== undefined) result = s.result;
    if (s.player) player = { ...player, ...s.player };
  },
};
</script>
</body></html>
```

The inventory is the block at the top: `slots`, `count`, `addItem` and `removeItem`, then `RECIPES`, `canCraft` and `craft`. Everything else, the trees, the night and the bar, calls those functions and never changes `slots` directly, which keeps the stack rules in one place. The light dims in the last 30 seconds before night; a full cycle of sun, sky and lamps is [how to make a day night cycle](/guides/make-a-day-night-cycle)'s subject. `window.__game` at the end lets a test tool read the slots, set a moment up, and read the recipes; the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes and edits your project's files) can add an inventory to a game you already have. Name the rules, since they are where inventories break:

```text
Add an inventory to my three.js game: 8 slots shown as a bar of HTML boxes
at the bottom, each empty or one stack { item, count }, at most 10 per stack.
Write count, add and remove functions: add fills existing stacks before empty
slots and says when the inventory is full; remove empties a slot at zero.
Recipes are a data object (item: amount). Crafting checks every ingredient
before removing any. All other code changes the inventory through these
functions. Then test a full inventory and a recipe with one ingredient missing.
```

## Inventory bugs to check for

- **Items vanish when the bar is full.** `add` could not fit them and nobody looked at what it returned. Show a message, or leave the item on the ground.
- **Counts go below zero**, or a slot shows a count of 0. `remove` ran without a check, or did not clear the emptied slot.
- **The same item sits in two half-full stacks.** `add` took an empty slot before topping up the existing stack.
- **A failed craft still eats ingredients.** The recipe removed items before checking the rest.
- **The bar shows something other than what the player has.** Code outside the four functions changed `slots`, or the bar is drawn from a copy. Draw it from the one list every time.

## Let the agent gather, craft and check the stacks

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs the game in a hidden Chrome browser so the agent can play it and read its state. Install it in Claude Code by running these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The replies below were captured on 2026-10-31 on the game above, on a server with no graphics card where Chrome draws in software; the `look` reply is cut to the lines about the screen's HTML and the scene, and the folder is shortened to `<project>`.

`interact` plays keys on exact frames. A `{ state }` step puts the player beside a tree, six presses of E chop six wood, and `expect` checks that they stacked five and one:

```text
interact {"steps":[{"state":{"player":{"x":-3,"z":-2}}},{"key":"KeyE","frames":1},{"key":"KeyE","frames":1},{"key":"KeyE","frames":1},{"key":"KeyE","frames":1},{"key":"KeyE","frames":1},{"key":"KeyE","frames":1}],"expect":{"slots.0.count":5,"slots.1.item":"wood","slots.1.count":1}}

{"changed":{"slots":[{"item":"wood","count":5},{"item":"wood","count":1},null,null,null],"time":0.12,"player":{"x":-3,"z":-2}}}
Expect: slots.0.count 5 ✓ · slots.1.item "wood" ✓ · slots.1.count 1 ✓
```

`look` takes a screenshot and lists what is on screen. Its `HTML over the canvas:` line reads the bar and the crafting panel, so the agent can see that what is drawn matches the state:

```text
look {}

HTML over the canvas: 3 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Night falls in 90 s" [16, 12, 220, 31], div#bar "wood 5 wood 1" [458, 716, 821, 783], div#craft "1. axe: 2 wood, 1 stone 2. campfire: 4 w" [988, 12, 1263, 83].
Subject: player takes 0.18% of the picture [439, 252, 476, 316]; 1 of its 1 named parts show.
On screen (11):
clearing 58% [84, 118, 1195, 799] 16 × 16 units
forest floor 37% [0, 0, 1279, 799] 60 × 60 units
tree ×3 3.9% [186, 115, 968, 527]
rock ×2 0.87% [693, 208, 984, 562]
player 0.18% [439, 252, 476, 316]
trunk ×3 0.069% [278, 264, 911, 519]
Hidden by the game (visible false on it or a parent): campfire
```

`eval` runs JavaScript in the page. Here it asks what each recipe still lacks, from the recipes and the slots the game reports:

```text
eval {"code":"const have = window.__game.observe().slots;\nconst count = item => have.reduce((n, s) => n + (s && s.item === item ? s.count : 0), 0);\nreturn Object.entries(window.__game.recipes).map(([name, needs]) => ({ name, missing: Object.fromEntries(Object.entries(needs).map(([item, n]) => [item, Math.max(0, n - count(item))])) }));"}

[{"name":"axe","missing":{"wood":0,"stone":1}},{"name":"campfire","missing":{"wood":0,"stone":3}}]
```

Then three stones from a rock and the axe, with key 1:

```text
interact {"steps":[{"state":{"player":{"x":3,"z":2.5}}},{"key":"KeyE","frames":1},{"key":"KeyE","frames":1},{"key":"KeyE","frames":1},{"key":"Digit1","frames":1}],"expect":{"slots.0.count":4,"slots.1.item":"axe","slots.2.count":2}}

{"changed":{"slots":[{"item":"wood","count":4},{"item":"axe","count":1},{"item":"stone","count":2},null,null],"time":0.2,"player":{"x":3,"z":2.5}}}
Expect: slots.0.count 4 ✓ · slots.1.item "axe" ✓ · slots.2.count 2 ✓
```

The first version of this check, written while making this page, expected the axe in the third slot and got a ✗: paying two wood had emptied the second slot, and the axe went into the first free one. The rules worked; the guess was wrong. That is the kind of detail `expect` settles in one call.

Last, the night. A check that starts a second before dark with exactly the campfire's ingredients, builds it, and waits; `save` keeps it as a check that `test` reruns after later edits:

```text
interact {"steps":[{"state":{"slots":[{"item":"wood","count":4},{"item":"stone","count":3},null,null,null],"time":89}},{"key":"Digit2","frames":1},{"wait":90}],"expect":{"fire":true,"result":"survived"},"save":"campfire-before-night"}

{"changed":{"fire":true,"result":"survived","time":90.02}}
Expect: fire true ✓ · result "survived" ✓
Saved check "campfire-before-night" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

And the other ending, no fire at nightfall:

```text
interact {"steps":[{"state":{"fire":false,"result":null,"time":89}},{"wait":90}],"expect":{"fire":false,"result":"too cold"}}

{"changed":{"fire":false,"result":"too cold"}}
Expect: fire false ✓ · result "too cold" ✓
```

What paprika3d does not do: it does not choose stack sizes or recipe costs, and it cannot tell you whether gathering for 90 seconds is fun or a chore; it plays the inputs the agent gives and reports what the game did.

## Next steps

- Keep the inventory when the page closes (the slot list is already plain data): [how to save game progress](/guides/save-game-progress).
- A character who asks for items and gives a reward: [how to make a dialogue system in a game](/guides/make-a-dialogue-system-in-a-game).
- Make nightfall a real sky with a sun and lamps: [how to make a day night cycle](/guides/make-a-day-night-cycle).
- Click on trees and rocks instead of walking up to them: [click on an object in three.js](/guides/threejs-click-on-object-raycaster).
- When surviving gets too easy: [how to make a game more fun](/guides/make-a-game-more-fun).
