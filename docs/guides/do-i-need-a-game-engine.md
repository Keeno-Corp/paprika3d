---
title: Do I need a game engine to make a game? What a browser and three.js give a first game
phrase: do i need a game engine to make a game
description: Do you need a game engine to make a game? For a small first game, no: a browser and three.js cover what an engine provides, shown part by part (editor, loop, input, physics, rendering, export) in a short three.js lane dodging game. Which suits an AI coding agent, how paprika3d lets it run, play and measure the page, and when Unity, Godot or Unreal fit better.
meta: Do you need a game engine to make a game? What an engine gives, which parts a small three.js browser game covers itself, and when an engine fits better.
intent: do-i-need-a-game-engine
queries:
  - "do i need a game engine to make a game"
  - "how to make a 3d game without a game engine"
  - "HTML5 or Javascript game engine to develop a browser game"
  - "Should I use Game Engines to learn to make 3D games?"
  - "Ask HN: What game engine would you recommend for vibe coding?"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# Do I need a game engine to make a game? What a browser and three.js give a first game

No, not for a small first game. A web browser already runs code, reads the keyboard and draws 3D graphics, and three.js, a free JavaScript library for 3D in web pages, makes the drawing part short to write. Together they cover what a first game needs from an engine. You reach for an engine when the game grows past what a few files of code can comfortably hold, or when you want what an engine's tools give, such as console builds. The details are below.

## What a game engine gives you

A game engine is a large program that bundles the pieces most games need, so you do not build them yourself. Unity, Godot and Unreal are the well-known ones you install; Babylon.js and PlayCanvas are 3D engines that run in the browser, and Phaser is a 2D one. They differ a lot, but most give you these parts:

| Engine part | What it does | In the small game below |
|---|---|---|
| Editor | A window where you place objects and set their values with the mouse | Constants at the top of the code (`LANES`, `SPEED`) |
| Game loop | Calls your update code every frame | `renderer.setAnimationLoop`, which calls `step(dt)` |
| Input | Turns key presses into actions | One `act()` function, fed by a `keydown` listener |
| Physics | Finds collisions, applies gravity | One distance check: a block in your lane within half a unit is a hit |
| Rendering | Draws the 3D scene | three.js: a scene, a camera, two lights, some boxes |
| Sound | Plays effects and music | Not in this game; the browser has Web Audio built in ([sound effects for a game](/guides/make-sound-effects-for-a-game)) |
| Build and export | Turns the project into something people can run | The HTML file is the game; any web host serves it ([put your game online](/guides/put-your-game-online)) |

A small game uses a sliver of each part. A big one uses all of them heavily, and that is where an engine saves a great deal of work.

## A game with each part labelled

Lane dodge: red blocks slide toward you down a three-lane road, and the left and right arrow keys move you one lane at a time. Every block that passes adds to "Dodged"; one that hits you ends the run. Each part an engine would provide is marked in a comment with its name in square brackets.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Lane dodge</title>
<style>html,body{margin:0;overflow:hidden;background:#20142e}#hud{position:fixed;top:14px;left:18px;font:600 20px system-ui;color:#fff}</style></head>
<body>
<div id="hud">Dodged 0</div>
<!-- [build and export] The game is this file. Any web server (or a static host) serves it; there is no build step. -->
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// [editor] An engine's editor is where you place things and set numbers by hand. Here they are lines of code.
const LANES = [-2, 0, 2], SPEED = 8, SPAWN_Z = -30;
let lane = 1, blocks = [{ lane: 0, z: -10 }, { lane: 2, z: -22 }], dodged = 0, over = false;

// [renderer] three.js draws: a scene, a camera, lights, meshes.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x20142e);
scene.fog = new THREE.Fog(0x20142e, 12, 32);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3, 6);
camera.lookAt(0, 0, -4);
scene.add(new THREE.HemisphereLight(0xffeedd, 0x302040, 3));
const road = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.2, 40), new THREE.MeshStandardMaterial({ color: 0x3b2d50 }));
road.name = 'road';
road.position.set(0, -0.6, -14);
scene.add(road);
const player = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 4), new THREE.MeshStandardMaterial({ color: 0x5ce0b0 }));
player.name = 'player';
scene.add(player);
const blockMat = new THREE.MeshStandardMaterial({ color: 0xff5a6e });
const meshes = blocks.map((_, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), blockMat); m.name = `block${i}`; scene.add(m); return m; });
const hud = document.getElementById('hud');

// [input] An engine maps keys to actions. Here: one function for real key presses and for the harness.
function act({ key, down = true }) {
  if (!down || over) return;
  if (key === 'ArrowLeft') lane = Math.max(0, lane - 1);
  if (key === 'ArrowRight') lane = Math.min(2, lane + 1);
}
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.code }); });

// [physics] An engine's physics finds collisions. Here a block in your lane within half a unit is a hit.
function step(dt) {
  if (over) return;
  for (const b of blocks) {
    b.z += SPEED * dt;
    if (b.lane === lane && Math.abs(b.z) < 0.5) over = true;
    if (b.z > 4) { b.z = SPAWN_Z; b.lane = Math.floor(Math.random() * 3); dodged++; }
  }
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

// [game loop] An engine calls your update code every frame. Here the browser does, through setAnimationLoop.
let last = null;
renderer.setAnimationLoop((now) => {
  const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;
  step(dt);
  player.position.x += (LANES[lane] - player.position.x) * Math.min(1, dt * 20);   // slide into the lane
  blocks.forEach((b, i) => meshes[i].position.set(LANES[b.lane], 0, b.z));
  hud.textContent = over ? `Hit! Dodged ${dodged}` : `Dodged ${dodged}`;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'lane dodge', keys: { ArrowLeft: 'press to move one lane left', ArrowRight: 'press to move one lane right' } }),
  observe: () => ({ lane, blocks: blocks.map(b => ({ lane: b.lane, z: +b.z.toFixed(2) })), dodged, over }),
  act,
  setState: (s) => { ({ lane = lane, dodged = dodged, over = over } = s); if (s.blocks) blocks = s.blocks.map(b => ({ ...b })); },
  subject: 'player',
};
</script>
</body></html>
```

To play it, put it in a folder as `index.html`, run `npm install three` and then `npx vite` in a terminal (the window where you type commands), and open the address it prints. `npm` and `npx` come with Node, a free program you install once.

Notice what is missing compared with an engine project: no editor to learn, no project settings, no build step. That is the trade. You get less help, and you see every part of the game in one place.

## Which one suits an AI coding agent

An AI coding agent (an assistant that writes and runs code in a folder on your computer) works in text. A browser game is nothing but text files and a page to load, so the agent can write all of it, and with the right tools it can run the page and see what it made. An agent can write code for an engine project too; this page's tools work on web pages, so the running and seeing part below applies to browser games.

paprika3d is a plugin for Claude Code, and a tool server for other agents, that gives the agent its own copy of Chrome to run the page in. It needs Chrome and Node and nothing else, and installs with two commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

On the game above, `interact` plays the physics rule both ways. A block coming down your lane, and you stay put:

```text
interact {"steps":[{"state":{"lane":1,"blocks":[{"lane":1,"z":-6},{"lane":0,"z":-20}]}},{"wait":60}],"expect":{"over":true}}

{"changed":{"blocks":[{"lane":1,"z":-0.4},{"lane":0,"z":-14.4}],"over":true}}
Expect: over true ✓
```

The same block, and you press the left arrow once:

```text
interact {"steps":[{"state":{"lane":1,"blocks":[{"lane":1,"z":-6},{"lane":0,"z":-20}]}},{"key":"ArrowLeft"},{"wait":90}],"expect":{"over":false,"dodged":1}}

{"changed":{"lane":0,"blocks":[{"lane":1,"z":-27.87},{"lane":0,"z":-7.73}],"dodged":1}}
Expect: over false ✓ · dodged 1 ✓
```

`perf` measures what each frame costs to draw. These replies were captured on 2026-10-30 on a server with no graphics card, and the reply itself says its frame time is no budget signal there; on your own computer the same call measures the real one. The counts hold anywhere: 4 draw calls and 44 triangles is very little for a browser to draw.

```text
perf {}

27.8 ms median frame (p95 65.8 ms, 29 fps on average), 4 draw calls, 44 triangles, 0 MB assets; over budget: frameMs 27.8 of 16.7 ms; desktop budget; software renderer (no GPU): frame time is no budget signal, do not optimize for it
```

paprika3d is not an engine: it adds no editor, physics or sound. It lets the agent run, see, play and measure the page it wrote.

## When an engine fits better

- **A large 3D world**: terrain tools, levels built by placing hundreds of objects by hand, streaming the world in as you move.
- **Console, phone app or Steam builds**, where an engine's export does work a web page cannot.
- **A team** of artists and designers who work in an editor rather than in code.
- **Learning an engine for a job** or a course that uses one.

In those cases Unity, Godot or Unreal is a sound choice, and each has free beginner tutorials.

For a first game the browser is a fine place to learn the parts, and what you learn (a loop, input, collisions, a camera) carries over to any engine later. Next steps: [what game should I make first?](/guides/what-game-should-i-make-first) to pick one, and [how to make a 3D browser game](/guides/how-to-make-a-3d-browser-game) for how the page is put together, part by part.
