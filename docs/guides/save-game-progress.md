---
title: How to save game progress in a three.js game: a save, a load and a Continue button
phrase: how to save game progress
description: How to save game progress in a browser game so a player can close the tab and carry on later, on a small three.js museum game: one save object with what the game must remember, turned into text with JSON and kept in localStorage, written at each door, read once at start behind a Continue button, with a version number so an older save still loads and a check so a broken one never stops the game; the prompt to give an AI agent, and how the agent tests the save and the comeback with paprika3d's interact, eval, look and open.
meta: How to save game progress in a three.js browser game: one save object in localStorage, written at each door, loaded by a Continue button.
intent: save-game-progress
queries:
  - "how to save game progress"
  - "How do you save game state?"
  - "Using local storage to save game progress"
  - "Is it possible to make it to where the player can save and load his game progress?"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to save game progress in a three.js game: a save, a load and a Continue button

To save a game's progress, the game writes down the few facts it would need to put the player back where they were, and keeps that note in the browser. In a web game the note is one object, such as `{ room: 2, keys: ['red'] }`, turned into text and stored in **localStorage**, a small store each browser keeps per website that survives closing the tab. Loading is the same in reverse: when the page opens, read the text, turn it back into an object, and rebuild the game from it. Four decisions make a save system work:

1. **Save facts, not the scene.** Keep the progress (which room, which keys, which quests are done), never the 3D objects themselves. The game already knows how to build a room; it needs to know which one.
2. **Save at moments that matter**: a door, a checkpoint, the end of a level. Not on every frame.
3. **Load once, when the page opens**, and offer a Continue button next to New game when a save exists.
4. **Expect the save to be old or broken.** Give it a version number, and treat anything you cannot read as "no save" instead of letting it stop the game.

The page below builds all four into a small museum game, then shows how an AI agent can test them. If you need to keep a single number, such as a record score, [how to save the high score](/guides/save-the-high-score) is the shorter answer and explains localStorage's limits in detail.

## What goes in the save

Ask what the player would be upset to lose. In the museum game it is the room they reached and the keys they carry: four rooms in a row, each with a coloured key that opens the door to the next. The save is:

```js
{ version: 2, room: 2, keys: ['red'] }
```

Everything else the game can rebuild. The walls, the doors already passed and the place the player stands all follow from the room number: a player who continues starts at the doorway of their saved room, the way many games restart you at the last checkpoint. Saving the player's exact position on every step would need a write every frame and gain little.

Two functions do the work. `JSON.stringify` turns an object into text, which is all localStorage can hold, and `JSON.parse` turns that text back into an object. A three.js mesh is the wrong thing to put through them: it links to its geometry, its material and the rest of the scene, so the text comes out huge or the call throws. Save plain values (numbers, strings, true and false, lists of them) and build the meshes from those.

**Save slots** are the same idea under several keys, such as `'museum-night.save.1'` and `'museum-night.save.2'`. **Settings** such as sound on or off belong under a key of their own, so starting a new game does not reset them; [how to make a main menu](/guides/make-a-main-menu) keeps one that way.

## Old saves and broken saves

A save outlives the code that wrote it. You change the game next week, and a player's browser still holds last week's save. If the new code expects a field the old save lacks, the game crashes on load and the player's progress is lost for good.

The fix is a version number in every save, checked when it loads. In the museum game, version 1 saved the room and not the keys. Version 2 added the keys, so `readSave` turns an old save into a new one: a player in room 3 must have found the red and blue keys to get there.

```js
if (data.version === 1) data = { version: 2, room: data.room, keys: KEYS.slice(0, data.room - 1) };
```

A save can also be broken: text a browser extension changed, a write cut short, a value from a different game at the same address. `JSON.parse` throws on text that is not JSON, so `readSave` wraps it in `try` and returns `null` for anything it cannot read, which the game treats as no save. A browser that blocks storage also throws, and the same `try` lets the game play on without saving.

## The game

Museum night: walk with the arrow keys, pick up each room's key from its pedestal, and walk through the matching door. The game saves each time you enter a new room and shows "Saved" for a moment. Reload the page and a panel offers **Continue (room 2)** or **New game**; Enter or a click continues. The game is built with three.js, a JavaScript library that draws 3D scenes in a web page, and is one HTML file. Save it as `index.html`, run `npm install three` in its folder (npm comes with Node.js), serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Museum night</title>
<style>html,body{margin:0;overflow:hidden;background:#1d1b22}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#f3ead8;font:600 18px system-ui}
#menu{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;
  background:rgba(0,0,0,.6);color:#fff;font:600 20px system-ui}
#menu[hidden]{display:none}
#menu button{font:600 20px system-ui;padding:10px 28px;cursor:pointer}</style></head>
<body>
<div id="hud"></div>
<div id="menu" hidden>
  <div style="font-size:40px">Museum night</div>
  <button id="continue"></button>
  <button id="new">New game</button>
</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The save: one object with everything the game must remember, kept under one key.
const SAVE_KEY = 'museum-night.save';
const VERSION = 2;
const KEYS = ['red', 'blue', 'gold'];          // the key found in room 1, 2 and 3 opens the door to the next room

function writeSave() {
  const data = { version: VERSION, room, keys };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); savedAt = clock; } catch { /* storage blocked: no save */ }
}
function readSave() {
  let data;
  try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; }   // missing, blocked or garbled: no save
  if (!data || typeof data.room !== 'number') return null;
  if (data.version === 1) data = { version: 2, room: data.room, keys: KEYS.slice(0, data.room - 1) };   // version 1 kept no keys
  return data;
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch {} }

const hud = document.getElementById('hud'), menu = document.getElementById('menu');
let room, keys, player, doorsOpen, savedAt = -Infinity, clock = 0, paused = false;

function start(save) {                          // a save to continue from, or null for a new game
  room = save ? save.room : 1;
  keys = save ? [...save.keys] : [];
  player = { x: (room - 1) * 10 + 1.5, z: 0 };  // at the door of the room the save names
  doorsOpen = room - 1;                         // the doors behind you are open
  paused = false;
  menu.hidden = true;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1d1b22);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xfff4e0, 0x403850, 2.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(10, 12, 8);
scene.add(sun);

const mat = c => new THREE.MeshStandardMaterial({ color: c });
const add = (geo, color, name, x, y, z) => {
  const m = new THREE.Mesh(geo, mat(color)); m.name = name; m.position.set(x, y, z); scene.add(m); return m;
};
const ROOM_COLORS = [0x8a6f5a, 0x5a6f8a, 0x6f8a5a, 0x8a7a3a];
for (let r = 0; r < 4; r++) {                   // four rooms in a row, each 10 wide
  add(new THREE.BoxGeometry(10, 0.2, 8), ROOM_COLORS[r], `floor${r + 1}`, r * 10 + 5, -0.1, 0);
  add(new THREE.BoxGeometry(10, 2, 0.3), 0xd8cfc0, 'wall', r * 10 + 5, 1, -4);
  add(new THREE.CylinderGeometry(0.4, 0.4, 1, 16), 0xe8e0d0, 'pedestal', r * 10 + 5, 0.5, -2.5);
}
add(new THREE.TorusKnotGeometry(0.5, 0.18, 64, 8), 0xffd34d, 'treasure', 35, 1.6, -2.5);
const keyMeshes = KEYS.map((c, i) => add(new THREE.OctahedronGeometry(0.35), c === 'gold' ? 0xffc800 : c, `${c} key`, i * 10 + 5, 1.4, -2.5));
const doors = KEYS.map((c, i) => add(new THREE.BoxGeometry(0.3, 2, 2), c === 'gold' ? 0xffc800 : c, `${c} door`, (i + 1) * 10, 1, 0));
for (let i = 1; i <= 3; i++) for (const z of [-2.5, 2.5]) add(new THREE.BoxGeometry(0.3, 2, 3), 0xd8cfc0, 'wall', i * 10, 1, z);
const body = add(new THREE.CapsuleGeometry(0.35, 0.6, 4, 12), 0xf0f0f0, 'player', 0, 0.65, 0);

const held = new Set();
function step(dt) {
  clock += dt;
  if (paused) return;
  const dx = (held.has('ArrowRight') - held.has('ArrowLeft')) * 5 * dt;   // 5 units a second
  const dz = (held.has('ArrowDown') - held.has('ArrowUp')) * 5 * dt;
  let x = player.x + dx, z = Math.min(3.5, Math.max(-3.5, player.z + dz));
  for (let i = 0; i < 3; i++) {                                            // the walls at x = 10, 20 and 30, a door in each
    const wall = (i + 1) * 10;
    if (Math.abs(x - wall) > 0.55) continue;                               // not touching this wall
    if (i === doorsOpen && keys.includes(KEYS[i]) && Math.abs(z) < 0.8) doorsOpen = i + 1;   // its key opens the door
    if (i >= doorsOpen || Math.abs(player.z) >= 0.8) x = player.x < wall ? wall - 0.55 : wall + 0.55;   // blocked
    else z = Math.min(0.79, Math.max(-0.79, z));                           // inside the doorway
  }
  player.z = z;
  player.x = Math.min(39.5, Math.max(0.5, x));
  const r = KEYS.findIndex((c, i) => !keys.includes(c) && Math.hypot(player.x - (i * 10 + 5), player.z + 2.5) < 0.9);
  if (r >= 0) keys.push(KEYS[r]);                                          // walked onto a key
  const now = Math.floor(player.x / 10) + 1;
  if (now > room) { room = now; writeSave(); }                             // through a door: save
}

let last = null;
function loop(t) {
  requestAnimationFrame(loop);
  step(last === null ? 1 / 60 : Math.min((t - last) / 1000, 0.1));
  last = t;
  body.position.set(player.x, 0.65, player.z);
  keyMeshes.forEach((m, i) => { m.visible = !keys.includes(KEYS[i]); m.rotation.y = clock * 2; });
  doors.forEach((d, i) => { d.visible = i >= doorsOpen; });
  const cx = (room - 1) * 10 + 5;
  camera.position.set(cx, 9, 9);
  camera.lookAt(cx, 0, 0);
  hud.textContent = `Room ${room} of 4   Keys: ${keys.join(', ') || 'none'}` + (clock - savedAt < 1.5 ? '   Saved' : '')
    + (room === 4 ? '   You found the treasure room!' : '');
  renderer.render(scene, camera);
}

function act({ key, down = true, repeat = false }) {
  if (key.startsWith('Arrow')) down ? held.add(key) : held.delete(key);
  if (!down || repeat || !paused) return;
  if (key === 'Enter') start(readSave());                                  // Continue
  if (key === 'KeyN') { clearSave(); start(null); }                       // New game
}
addEventListener('keydown', e => act({ key: e.code, repeat: e.repeat }));
addEventListener('keyup', e => act({ key: e.code, down: false }));
document.getElementById('continue').onclick = () => start(readSave());
document.getElementById('new').onclick = () => { clearSave(); start(null); };
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// On load: with a save, offer Continue; without one, play from room 1.
const save = readSave();
start(null);
if (save) {
  paused = true;
  document.getElementById('continue').textContent = `Continue (room ${save.room})`;
  menu.hidden = false;
}
requestAnimationFrame(loop);

window.__game = {
  subject: 'player',
  describe: () => ({ name: 'museum night', keys: { ArrowRight: 'walk right', ArrowLeft: 'walk left', ArrowUp: 'walk up', ArrowDown: 'walk down', Enter: 'continue the saved game', KeyN: 'new game' } }),
  observe: () => ({ room, keys: [...keys], doorsOpen, menu: !menu.hidden, saved: readSave(), player: { x: +player.x.toFixed(2), z: +player.z.toFixed(2) } }),
  act,
  setState: (s) => {
    if (s.room !== undefined) room = s.room;
    if (s.keys) keys = [...s.keys];
    if (s.doorsOpen !== undefined) doorsOpen = s.doorsOpen;
    if (s.player) player = { ...player, ...s.player };
    if (s.saved !== undefined) { if (s.saved) localStorage.setItem(SAVE_KEY, JSON.stringify(s.saved)); else clearSave(); }   // what storage holds
    if (s.menu !== undefined) { paused = s.menu; menu.hidden = !s.menu; }
  },
};
</script>
</body></html>
```

The whole save system is the three functions near the top. `writeSave` runs in `step` at the moment `room` goes up, so each door is one save. `readSave` runs once when the page loads, to decide whether to show the panel, and again when Continue is pressed. `start(save)` builds a game from a save, or a new game from `null`, so a new game and a continued game take the same path through the code. The `window.__game` object at the end is for testing tools: it reports the room, the keys and what storage holds, and its `setState` can write a save, which the next section uses. The game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that reads and edits your project's files) can add saving to a game you already have. Name the facts to keep and when to write them:

```text
Add save and load to my three.js game. Keep one save object with only the
progress (current level, items collected, quests finished) and a version
number, saved to localStorage as JSON under one key named after the game.
Save when the player finishes a level, not every frame. On load, if a save
exists, show Continue and New game buttons over the canvas. If the save
cannot be read, or is from an older version, convert it or ignore it, but
never let it stop the game from starting. Then test: a save, a reload, a
continue, an old-version save and a garbled save.
```

The last line matters most. Agents tend to write the happy path, a save that loads, and the old or broken save is the one your players meet after your next update.

## Let the agent play, save and come back

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can play it and read what it stored. Install it in Claude Code with these two lines in a terminal (the window where you type commands):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The replies below were captured on 2026-10-31 on the game above, on a server with no graphics card where Chrome draws in software, with the project folder shortened to `<project>`.

First, play through a door for real. `interact` holds keys on exact frames, `until` keeps walking until the state says room 2, and `expect` checks the result:

```text
interact {"steps":[{"key":"ArrowRight","frames":42},{"key":"ArrowUp","frames":30},{"key":"ArrowDown","frames":30},{"key":"ArrowRight","down":true},{"until":{"room":2},"max":200},{"key":"ArrowRight","down":false}],"expect":{"room":2,"keys.0":"red","saved.room":2}}

{"changed":{"room":2,"keys":["red"],"doorsOpen":1,"saved":{"version":2,"room":2,"keys":["red"]},"player":{"x":10.08}}}
until: room == 2 held at frame 163
Expect: room 2 ✓ · keys.0 "red" ✓ · saved.room 2 ✓
```

`eval` runs a line of JavaScript in the page; here it reads the exact text in storage:

```text
eval {"code":"return localStorage.getItem(\"museum-night.save\")"}

{"version":2,"room":2,"keys":["red"]}
```

Then the comeback. `look` with `sheet` reloads the page for each picture it takes, the way a player returning tomorrow loads it, and storage is kept across those reloads:

```text
look {"sheet":[{"label":"the page loaded again"},{"label":"then Enter","steps":[{"key":"Enter","frames":1}]}]}

Picture: <project>/paprika3d/runs/2026-10-31T07-22-59-074Z/look-3-sheet.png (2 moments, left to right, top to bottom: the page loaded again | then Enter); the game is reloaded at its first frame
the page loaded again: subject player 0.34%; on screen: floor* ×2, wall ×4, red door, pedestal ×2, player, red key, blue key; pixels: brightness 14%, colour saturation 27%, 50% near black, 0% blown out
then Enter: subject player 0.34%; on screen: floor* ×3, wall ×7, blue door, pedestal ×3, player, blue key, gold key; pixels: brightness 37%, colour saturation 25%, 0% near black, 0% blown out
```

The first picture is room 1 dimmed behind the Continue panel (half of it near black); after Enter the camera is in room 2, with the blue door and the blue key on screen. (The full reply also carries a lighting note that does not concern saving.)

The old save gets a check of its own. A `{ state }` step writes a version 1 save through the game's `setState` and puts the panel up, Enter continues, and `save` keeps the play as a check that `test` reruns after later edits:

```text
interact {"steps":[{"state":{"saved":{"version":1,"room":3},"menu":true}},{"key":"Enter","frames":1}],"expect":{"room":3,"keys.1":"blue","menu":false},"save":"old-save-continues"}

{"changed":{"room":3,"keys":["red","blue"],"doorsOpen":2,"menu":false,"saved":{"room":3,"keys":["red","blue"]},"player":{"x":21.5}}}
Expect: room 3 ✓ · keys.1 "blue" ✓ · menu false ✓
Saved check "old-save-continues" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

The version 1 save loaded as room 3 with both keys, so a player from last week keeps their progress. Because this check writes the save it needs in its first step, it does not depend on what an earlier call left in storage.

Last, a new `open` of the same page starts with empty storage, which is what a first-time player sees:

```text
observe {}

{"room":1,"keys":[],"doorsOpen":0,"menu":false,"saved":null,"player":{"x":1.5,"z":0},"harness":{"frame":0,"renderer":{"calls":0,"triangles":0,"textures":0,"geometries":0,"programs":0},"scene":{"objects":28,"meshes":26,"lights":2,"cameras":0},"errors":[],"changed":null}}
```

Room 1, no panel, nothing saved. So within one `open`, reloads keep the save, and a fresh `open` forgets it; a check about a returning player sets up its own save, as the one above does.

What paprika3d does not do: it plays the game in one headless Chrome, so it cannot show that a phone or another browser has a separate save, and it does not move saves between devices or back them up. A save that follows a player to another computer needs a server and an account, which is beyond localStorage.

## Without paprika3d

You can test the same cases by hand in Chrome or Firefox. Open the developer tools with F12, find Local Storage under the Application tab (Storage in Firefox), and click your game's address. There you can read the save, edit its text to an old version or to nonsense, delete it, and reload the page after each change. Test four cases every time you change the save code: no save, a save from this version, a save from the version before, and a broken one.

## Next steps

- Turn levels into data, so the save is a level number: [how to make levels in a game](/guides/make-levels-in-a-game).
- Put the Continue button on a proper title screen: [how to make a main menu](/guides/make-a-main-menu).
- Items with counts to save: [how to make an inventory in a game](/guides/make-an-inventory-in-a-game).
- A quest finished is one more fact in the save: [how to make a dialogue system in a game](/guides/make-a-dialogue-system-in-a-game).
- A copy of the game online has its own storage, empty at first: [how to put your game online](/guides/put-your-game-online).
- Numbers that keep growing between visits: [how to make a clicker game](/guides/make-a-clicker-game).
- A pet whose needs keep falling between visits: [how to make a virtual pet game](/guides/make-a-virtual-pet-game).
