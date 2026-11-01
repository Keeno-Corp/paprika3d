---
title: Where to start making a game: a small three.js game in the browser, built with an AI agent
phrase: where to start making a game
description: Where to start making a game with no experience: the first hour in order, from picking a game small enough to finish to a running three.js page with one thing to move, one thing to reach and a timer, checking its rule, and showing it to someone. With the request to give an AI agent and the paprika3d step where the agent runs and plays the page itself.
meta: Where to start making a game with no experience: the first hour in order, a small three.js page an AI agent writes, and how to check it works.
intent: where-to-start-making-a-game
queries:
  - "where to start making a game"
  - "how do i start to make a game"
  - "Where to start with game development?"
  - "Making a 3d game but don't know where to start"
  - "hi sohow do you start building a video game"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# Where to start making a game: a small three.js game in the browser, built with an AI agent

Start with a game you can finish in one sitting: one web page, one thing you move, one thing to reach, and one way to lose. Let an AI coding agent write the code, play the result, and show it to someone before the hour is over. The big game you have in mind comes later, built on what this first one teaches you.

Many people start from the big idea, an open world or an online RPG, and stall because it has hundreds of parts and none of them work yet. A tiny finished game teaches the parts every game shares: something on screen, keys that move it, a rule that decides when you win, and a loop that keeps it all running. Below is the first hour, in order.

## 1. Pick a game small enough to finish

Choose something with a single rule you can say in one sentence. "Reach the flag before the timer runs out" is one. "A survival game with crafting" is twenty. If nothing comes to mind, [What game should I make first?](/guides/what-game-should-i-make-first) lists a handful, each with the rule that makes it finishable.

## 2. Make a folder and get three programs

- **Google Chrome**, the browser the game runs in.
- **Node**, a free program that lets your computer run JavaScript tools; installing it also gives you `npm`, which downloads code libraries.
- **An AI coding agent**: an assistant that works inside a folder on your computer, writing files and running commands for you, such as Claude Code, Cursor or Codex. Setting one up from nothing is its own page: [how to make a game with Claude Code](/guides/make-a-game-with-claude-code).

Create an empty folder called `flag-run` and open your agent in it. Some agents run in a terminal, the text window where you type commands; you will need it for two of them below.

## 3. Ask for a starter page that runs

The game will be a web page drawn with three.js, a free library that puts 3D shapes, lights and a camera into a browser page. One page with no build step keeps the first hour about the game, not about tools. A request that says exactly what to make:

```text
In this folder, make a tiny 3D game with three.js in a single index.html, loading three
from node_modules with an import map. A ball on a green field moves with the arrow keys.
A yellow flag stands in the far corner. A timer counts down from 10 seconds at the top
left. Reaching the flag shows "You made it!"; running out of time shows "Out of time".
Nothing else for now. Run npm install three, and tell me how to open it.
```

A page that does what that request describes, written for this guide:

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Flag run</title>
<style>html,body{margin:0;overflow:hidden;background:#a8d8f0}#hud{position:fixed;top:14px;left:18px;font:600 20px system-ui;color:#123}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// One thing you move, one thing to reach, one way to lose: get to the flag before the time runs out.
const SPEED = 4, FLAG = { x: 4, z: -3 };
const held = new Set();
let x = -4, z = 3, timeLeft = 10, result = 'playing';   // 'playing', 'won' or 'lost'

function step(dt) {
  if (result !== 'playing') return;
  x += ((held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0)) * SPEED * dt;
  z += ((held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0)) * SPEED * dt;
  timeLeft = Math.max(0, timeLeft - dt);
  if (Math.hypot(x - FLAG.x, z - FLAG.z) < 0.8) result = 'won';
  else if (timeLeft === 0) result = 'lost';
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8d8f0);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 9, 9);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x557744, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(3, 8, 4);
scene.add(sun);
const ground = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, 9), new THREE.MeshStandardMaterial({ color: 0x6cbf5a }));
ground.name = 'ground';
ground.position.y = -0.1;
scene.add(ground);
const player = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 16), new THREE.MeshStandardMaterial({ color: 0xff7040 }));
player.name = 'player';
scene.add(player);
const flag = new THREE.Group();
flag.name = 'flag';
const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2), new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
pole.position.y = 1;
const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.05), new THREE.MeshStandardMaterial({ color: 0xffd23f }));
cloth.position.set(0.4, 1.7, 0);
flag.add(pole, cloth);
flag.position.set(FLAG.x, 0, FLAG.z);
scene.add(flag);
const hud = document.getElementById('hud');

function act({ key, down = true }) { if (down) held.add(key); else held.delete(key); }
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

let last = null;
renderer.setAnimationLoop((now) => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  player.position.set(x, 0.4, z);
  hud.textContent = result === 'won' ? 'You made it!' : result === 'lost' ? 'Out of time' : `Time: ${timeLeft.toFixed(1)}`;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'flag run', keys: { ArrowUp: 'hold to move away', ArrowDown: 'hold to move closer', ArrowLeft: 'hold to move left', ArrowRight: 'hold to move right' } }),
  observe: () => ({ x: +x.toFixed(2), z: +z.toFixed(2), timeLeft: +timeLeft.toFixed(2), result }),
  act,
  setState: (s) => { ({ x = x, z = z, timeLeft = timeLeft, result = result } = s); },
  subject: 'player',
};
</script>
</body></html>
```

The game's whole state is four plain variables near the top: where the ball is, how much time is left, and whether you have won or lost. The `window.__game` object at the end hands that state to tools that test the game, which step 5 uses.

## 4. See it running

In the terminal, inside the folder, run `npx vite` and open the address it prints in Chrome. You should see a green field, an orange ball near you, a flag in the far corner and the time at the top left. If the page stays blank, the cause is almost always in how it was opened or loaded, before any game code runs: [HTML game not working?](/guides/html-game-not-working) goes through each cause.

## 5. Check the one rule

Play it twice on purpose. Once, steer to the flag: the text should change to "You made it!" and the ball should stop. Once, sit still for the whole 10 seconds: it should say "Out of time". Two outcomes, two checks. If either is wrong, tell the agent what you did and what you saw, in that order ("I reached the flag and the timer kept going"). That sentence is a bug report, and a precise one gets a precise fix.

## Letting the agent run steps 4 and 5 itself

With paprika3d, a plugin for Claude Code that also runs as a tool server for other agents, the agent opens the page in a browser of its own, looks at it and plays it, so it finds a blank page or a broken rule before you do. Install it from the terminal:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

On the game above (replies captured on 2026-10-30 on a Linux server with no graphics card; the `open` and `look` replies are cut to the lines discussed, nothing reworded), `open` starts it paused at its first frame and reads the controls from the page, and `look` lists what is on screen by name:

```text
open {"url":"index.html","cwd":"<project>"}

Opened http://127.0.0.1:38151/index.html in 0.1 s, paused at frame 0.
{"name":"flag run","keys":{"ArrowUp":"hold to move away","ArrowDown":"hold to move closer","ArrowLeft":"hold to move left","ArrowRight":"hold to move right"}}

look {}

HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Time: 10.0" [18, 14, 137, 36].
Surface: "ground" covers 39% with almost no detail (0.24 of 255): it reads as flat colour. Unless the user asked for flat colour, add texture, normal detail or lighting variation.
On screen (4):
ground 39% [101, 228, 1178, 693] 12 × 9 units
player 0.36% [272, 519, 342, 586]
flag ×2 0.21% [868, 173, 945, 278] 0.8–2 × 0.1–0.5 units
```

Then `interact` with `expect` checks both outcomes. It sets up a moment (the ball just short of the flag, or half a second left on the clock), holds a key or waits, and compares the result with what should happen:

```text
interact {"steps":[{"state":{"x":2,"z":-3}},{"key":"ArrowRight","frames":30}],"expect":{"result":"won"}}

{"changed":{"x":3.27,"z":-3,"timeLeft":9.65,"result":"won"}}
Motion (player): travelled 1.27 units, it stopped at frame 19 and did not move again.
Expect: result "won" ✓

interact {"steps":[{"state":{"timeLeft":0.5}},{"wait":40}],"expect":{"result":"lost"}}

{"changed":{"timeLeft":0,"result":"lost"}}
Expect: result "lost" ✓
```

The ball stops at the flag, and the clock running out is a loss. The plugin does not choose your game or tell you whether it is fun; it reports what is on the screen and what the rules did.

## 6. Show it to someone

Hand the keyboard to a friend and say nothing. Watch where they look, what they press first, and whether they understand the goal without being told. Whatever confuses them is your next change, and it is a better next change than anything from your own list. To send them a link instead, see [how to put your game online](/guides/put-your-game-online).

## After the first hour

- Grow the game one request at a time, playing after each: [how to vibe code a game](/guides/how-to-vibe-code-a-game) walks through that loop.
- Add a game over screen with a restart key: [how to add a game over screen](/guides/add-a-game-over-screen).
- Make reaching the flag feel like something: [how to make a game feel good](/guides/make-a-game-feel-good).

## When an engine is the better place to start

A browser page with three.js suits small games, quick experiments and an AI agent that writes everything as text. If you already know you want to work in a particular engine, or your idea needs a large 3D world, an editor to place things by hand, or console releases, then Unity, Godot or Unreal and their own beginner courses are a reasonable first step. [Do I need a game engine to make a game?](/guides/do-i-need-a-game-engine) compares the two paths.
