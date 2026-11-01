---
title: How to make a 3D browser game with three.js, from one HTML file
phrase: how to make a 3d browser game
description: How to make a 3D browser game from one HTML file with three.js, for someone who has not used it: the import map, the state, the renderer, scene, camera and light, the objects, the keys, one rule and a loop that steps by elapsed time, in a small barrel jumping game, with the request to give an AI agent and how paprika3d runs and reads the page.
meta: How to make a 3D browser game in one HTML file with three.js: the import map, scene, camera, loop and keys, explained part by part in a small game.
intent: how-to-make-a-3d-browser-game
queries:
  - "how to make a 3d browser game"
  - "how to make a 3d game in html css and javascript"
  - "Ask HN: How do I build a browser game?"
  - "People to start a RPG medieval game project? (ABSOLUTE BEGINNER in three.js)"
  - "Getting started with Three.js. Looking for tutorials"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a 3D browser game with three.js, from one HTML file

A 3D browser game is a web page. It is an HTML file with a script in it that, many times a second, moves things according to the game's rules and draws the 3D scene again. The drawing uses WebGL, the browser's built-in way to talk to the graphics card, and three.js is a free JavaScript library that handles WebGL for you: you describe shapes, lights and a camera, and it draws them. One HTML file is enough for a complete, playable game, and this page builds one and explains each of its parts.

## What you need

- **Google Chrome** (or another current browser) to run the game.
- **Node**, a free program for running JavaScript tools on your computer. It comes with `npm`, which downloads libraries like three.js, and `npx`, which runs tools without installing them.
- **A terminal**, the window where you type commands (Terminal on a Mac, PowerShell on Windows).
- **A text editor**, or an AI coding agent (an assistant that writes and runs code in a folder for you) to write the file.

In the terminal, make a folder for the game and install three.js into it:

```bash
mkdir barrel-jump
cd barrel-jump
npm install three
```

That creates a `node_modules` folder holding three.js. Save the game below as `index.html` in the same folder, run `npx vite`, and open the address it prints. A browser will not load the script from a file you double-click, so the page has to be served this way; [HTML game not working?](/guides/html-game-not-working) explains why and what else stops a first page from showing.

## The whole game

Barrel jump: a barrel rolls toward a blue box, and Space makes the box jump over it. Each barrel cleared adds one to "Jumped"; touching one ends the run. Each part is numbered in a comment, and the sections after the code follow those numbers.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Barrel jump</title>
<style>html,body{margin:0;overflow:hidden;background:#f2c48d}#hud{position:fixed;top:14px;left:18px;font:600 20px system-ui;color:#4a2a10}</style></head>
<body>
<div id="hud">Jumped 0</div>
<!-- 1. The import map: tells the browser where the word 'three' points. -->
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// 2. The state: every fact about the game, in plain variables.
const GRAVITY = -30, JUMP = 11, ROLL = 7;
let y = 0, vy = 0, barrelX = 12, jumped = 0, over = false;

// 3. The renderer: makes a canvas and draws into it with the graphics card.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// 4. The scene, the camera and the light: what exists, where you look from, what lights it.
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2c48d);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(-2, 3, 10);
camera.lookAt(2, 1.5, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a5a30, 1.5));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-4, 10, 6);
scene.add(sun);

// 5. The objects: a shape (geometry) plus a surface (material) makes a mesh. Each gets a name.
const ground = new THREE.Mesh(new THREE.BoxGeometry(30, 0.4, 4), new THREE.MeshStandardMaterial({ color: 0xc98a4b }));
ground.name = 'ground';
ground.position.set(4, -0.2, 0);
const player = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x3a7bd5 }));
player.name = 'player';
const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 20).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x7a3e1d }));
barrel.name = 'barrel';
scene.add(ground, player, barrel);
const hud = document.getElementById('hud');

// 6. The keys: Space jumps when the player stands on the ground. The harness calls act() the same way.
function act({ key, down = true }) {
  if (down && key === 'Space' && y === 0 && !over) vy = JUMP;
}
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.code }); });

// 7. The rule: the barrel rolls at you; touching it ends the run, getting past it scores.
function step(dt) {
  if (over) return;
  vy += GRAVITY * dt;
  y = Math.max(0, y + vy * dt);
  if (y === 0) vy = 0;
  barrelX -= ROLL * dt;
  if (Math.abs(barrelX) < 1 && y < 1) over = true;
  if (barrelX < -4) { barrelX = 12 + Math.random() * 6; jumped++; }
}

// 8. The loop: each frame, move the game on by the time that passed (at most 0.1 s), then draw.
let last = null;
renderer.setAnimationLoop((now) => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  player.position.set(0, y + 0.5, 0);
  barrel.position.set(barrelX, 0.5, 0);
  barrel.rotation.z = barrelX * 2;
  hud.textContent = over ? `Hit! Jumped ${jumped}` : `Jumped ${jumped}`;
  renderer.render(scene, camera);
});
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

// 9. window.__game: the state, readable by tools (and by you, in the browser console).
window.__game = {
  describe: () => ({ name: 'barrel jump', units: 'world units', keys: { Space: 'jump' } }),
  observe: () => ({ y: +y.toFixed(2), barrelX: +barrelX.toFixed(2), jumped, over }),
  act,
  setState: (s) => { ({ y = y, barrelX = barrelX, jumped = jumped, over = over } = s); },
  subject: 'player',
};
</script>
</body></html>
```

## The parts, one at a time

**1. The import map.** The script starts with `import * as THREE from 'three'`. A browser has no idea where "three" is, so the `importmap` script just above it says: the word `three` means the file `three.module.js` inside `node_modules`. The game's own script is marked `type="module"`, which is what lets it use `import`.

**2. The state.** Every fact the game needs is a plain variable: the box's height `y` and upward speed `vy`, the barrel's position `barrelX`, the score and whether the run is over. The rules change these numbers; the drawing reads them. Keeping them apart from the three.js objects makes the game easy to read, and easy to test.

**3. The renderer.** `WebGLRenderer` creates a canvas (a rectangle on the page that can be drawn into), sizes it to the window and adds it to the page. Everything 3D appears inside it.

**4. Scene, camera and light.** The scene is the list of everything that exists. The camera is where you look from: `PerspectiveCamera(50, ...)` sees a 50 degree slice of the world, so things further away look smaller. Lights matter because the standard material is shaded by them; with no light at all, every object draws black.

**5. The objects.** Each visible thing is a mesh: a shape (a geometry, such as a box or a cylinder) plus a surface (a material, with a colour). Giving each a `name` costs nothing and lets you, and tools, find it later.

**6. The keys.** The page listens for `keydown` on the whole window and passes the key to one function, `act()`. Space starts a jump when the box is on the ground. `e.code` names the physical key (`Space`, `ArrowLeft`), and `e.repeat` skips the repeats a held key sends. Moving with the arrow keys is its own topic: [how to make a character move in JavaScript](/guides/make-a-character-move-in-javascript).

**7. The rule.** Gravity pulls the box's speed down every moment, the speed changes its height, and the floor stops it at zero. The barrel rolls left. If it overlaps the box while the box is low, the run is over; once it is past, it goes back to the start further right and the score goes up.

**8. The loop.** `setAnimationLoop` asks the browser to call the function once per screen refresh. Screens refresh at different rates, so moving a fixed amount per call would make the game faster on a faster screen. Instead the loop measures the time since the last call and moves everything by that much, capped at 0.1 s so a pause (a hidden tab) does not throw the box through the floor. Then it places the meshes where the state says and draws.

**9. `window.__game`.** The game's state, readable from outside. Open Chrome's console (F12, then the Console tab) and type `__game.observe()` to see the numbers while you play; testing tools read the same object.

## Asking an AI agent for a game like this

If an agent writes the page, naming these parts gets you a page shaped like this one instead of a guess:

```text
Make a small 3D browser game in one index.html with three.js, loaded from node_modules
through an import map. Keep the game state in plain variables, separate from the three.js
objects, and advance it by the elapsed time each frame. A box stands on the left of a long
ground; a barrel rolls toward it and Space makes the box jump. Clearing a barrel adds one
to "Jumped" at the top left, touching one ends the run. Name every mesh, and put the state
on window.__game with observe() so I can read it in the console.
```

## Checking the page with paprika3d

paprika3d is a plugin for Claude Code, and a tool server for other agents, that gives the agent its own Chrome to open the page in, so it can see and read the game without you describing it. It installs with:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The replies below were captured on 2026-10-30 on a server with no graphics card, and the `look` reply is cut to its object list with nothing reworded. Here is `open` on the game's folder before `npm install three` was run. The import map points at a file that is not there yet, so the page never starts, and the reply names the missing file and the fix:

```text
open {"url":"index.html","cwd":"<project>"}

game not ready after 10 s: no window.__game, three.js renderer or WebGL canvas on http://127.0.0.1:36299/index.html
The page shows: "Jumped 0"
Failed to load resource: the server responded with a status of 404 (Not Found) node_modules/three/build/three.module.js (run bun add three in cwd)
```

`bun add three` and `npm install three` do the same job. After it, `look` lists what is on screen by the names from part 5, and `observe` reads the state from part 9:

```text
look {}

On screen (3):
ground 16% [0, 419, 1279, 703] 30 × 4 units, across the view
player 0.96% [435, 440, 536, 547]
barrel 0.56% [1125, 395, 1232, 463]
Never visible: none

observe {}

{"y":0,"barrelX":11.88,"jumped":0,"over":false,"harness":{"frame":1,"renderer":{"calls":3,"triangles":104,"textures":1,"geometries":3,"programs":2},"scene":{"objects":5,"meshes":3,"lights":2,"cameras":0},"errors":[],"changed":null}}
```

And `interact` plays the rule from part 7 both ways, with the barrel set 3 units away: jumping clears it, standing still ends the run.

```text
interact {"steps":[{"state":{"barrelX":3}},{"key":"Space"},{"wait":70}],"expect":{"jumped":1,"over":false}}

{"changed":{"barrelX":10.8,"jumped":1}}
Expect: jumped 1 ✓ · over false ✓

interact {"steps":[{"state":{"barrelX":3}},{"wait":70}],"expect":{"over":true}}

{"changed":{"barrelX":0.9,"over":true}}
Expect: over true ✓
```

The plugin runs and reads the page; it does not write the game or choose what it should be.

## Where to go from here

- Turn "Hit!" into a game over screen that restarts with a key: [how to add a game over screen](/guides/add-a-game-over-screen).
- Make the scene look better with materials, shadows and a sky: [how to make my game look better](/guides/make-my-game-look-better).
- Share it with a link: [how to put your game online](/guides/put-your-game-online).
- Not sure this is the game to build? [What game should I make first?](/guides/what-game-should-i-make-first)
