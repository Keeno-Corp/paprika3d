---
title: How to make a game with Cursor: a three.js game the agent can see and play
phrase: how to make a game with cursor
description: How to make a game with Cursor when you have never made one: what Cursor's agent does and what it cannot see on its own, the first request to type, a small three.js firefly-catching game, adding paprika3d's MCP server and skills to Cursor so the agent opens, pictures and plays the game after each change, and what Cursor gets from paprika3d and what stays Claude Code's.
meta: How to make a game with Cursor: a small three.js game, plus paprika3d's MCP server so Cursor's agent opens, sees and plays it.
intent: make-a-game-with-cursor
queries:
  - "how to make a game with cursor"
  - "can you make a game with cursor"
  - "can cursor make games"
  - "Anyone tried using Cursor with gaming engine like godot/unity/unreal?"
  - "Vibe Coding - am I an idiot?"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a game with Cursor: a three.js game the agent can see and play

Yes, you can make a game with Cursor, even if you have never written code. Cursor is a code editor (a program for writing and editing code files) with an AI agent built in: you describe what you want in its chat, and the agent writes the files, runs commands in a terminal (the text window where commands run) and reads what they print. A small browser game is a good first project for it, because a game made of web pages needs nothing installed beyond a browser.

What the agent cannot do on its own is look at the game it wrote or play it. It writes the code and stops, and you open the game, play it, and describe what is wrong. This page builds a small game in Cursor and then adds paprika3d, which gives Cursor's agent a browser of its own so it checks its work the same way you would.

## Why a three.js game

Cursor's agent also writes scripts for game engines such as Godot and Unity, which run inside their own editors, where you test them. A three.js game is a web page: three.js is a free JavaScript library that draws 3D in the browser, and the whole game is a file that runs in a browser, so a tool can open it there and check it for the agent. That makes it the shorter path from an idea to something you can play and share as a link.

## What you need

- **Cursor,** installed from its website, with a folder opened for the game (File, then Open Folder; an empty folder is fine).
- **Google Chrome,** to play the game, and for paprika3d to run it.
- **Node 20.11 or later,** a program that runs JavaScript tools outside a browser. paprika3d's server runs on it.

## The first request to type

In Cursor's chat, in Agent mode, describe the smallest version of the game: what you control, what you are trying to do, and when it ends.

```text
Make a small 3D game with three.js in one index.html file that loads three from a
CDN with an import map. A dark meadow at night seen from above, with 8 fireflies
drifting slowly and blinking on and off, each on its own rhythm. A glass jar follows
the mouse. A firefly is caught when the jar touches it while it glows; a dark one
cannot be caught. A round lasts 30 seconds; show the catches and the seconds left,
and a click starts a new round.
```

## The game

Here is a page of the kind that request asks for, written for this guide (it is the version after the one change described further down):

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Firefly jar</title>
<style>html,body{margin:0;overflow:hidden;background:#070b16}canvas{display:block}
#hud{position:fixed;top:14px;left:0;right:0;text-align:center;font:600 20px system-ui;color:#f6f1c7;pointer-events:none}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rules: carry the jar with the mouse. A firefly is caught when the jar touches it while it glows.
// A dark firefly cannot be caught. Thirty seconds to catch as many as you can.
const COUNT = 8, FIELD_X = 6, FIELD_Z = 4, ROUND = 30, JAR_R = 0.8;
let jar = { x: 0, z: 0 }, caught = 0, time = 0, over = false;
const flies = [];
function place(f) { f.x = (Math.random() * 2 - 1) * FIELD_X; f.z = (Math.random() * 2 - 1) * FIELD_Z; }
for (let i = 0; i < COUNT; i++) { const f = { phase: Math.random() * 6.28, rate: 1.5 + Math.random() * 2, heading: Math.random() * 6.28 }; place(f); flies.push(f); }
const lit = f => Math.sin(time * f.rate + f.phase) > 0.2;   // each blinks on its own rhythm

function step(dt) {
  if (over) return;
  time += dt;
  for (const f of flies) {
    f.heading += Math.sin(time * 0.7 + f.phase) * dt;           // a lazy, wandering drift
    f.x = Math.max(-FIELD_X, Math.min(FIELD_X, f.x + Math.cos(f.heading) * 1.2 * dt));
    f.z = Math.max(-FIELD_Z, Math.min(FIELD_Z, f.z + Math.sin(f.heading) * 1.2 * dt));
    if (lit(f) && Math.hypot(f.x - jar.x, f.z - jar.z) < JAR_R) { caught++; place(f); }
  }
  over = time >= ROUND;
  hud.textContent = over ? `Time! You caught ${caught}. Click to play again` : `Caught ${caught} · ${Math.ceil(ROUND - time)} s`;
}

// The picture: a dark meadow seen from above, glowing fireflies, and a glass jar.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b16);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 11, 7); camera.lookAt(0, 0, 0.5); camera.updateMatrixWorld();
scene.fog = new THREE.Fog(0x070b16, 13, 24);
scene.add(new THREE.HemisphereLight(0x8899ff, 0x203018, 2.5));
const meadow = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshStandardMaterial({ color: 0x2f5a35 }));
meadow.rotation.x = -Math.PI / 2; meadow.name = 'meadow'; scene.add(meadow);
const flyMeshes = flies.map((f, i) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff27a }));
  m.name = `firefly ${i + 1}`; scene.add(m); return m;
});
const jarMesh = new THREE.Mesh(new THREE.CylinderGeometry(JAR_R, JAR_R, 1.4, 32, 1, true),
  new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
jarMesh.name = 'jar'; scene.add(jarMesh);
const hud = document.getElementById('hud');

// The mouse: where it points on the meadow is where the jar goes.
const ray = new THREE.Raycaster(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
addEventListener('pointermove', e => {
  ray.setFromCamera({ x: e.clientX / innerWidth * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }, camera);
  if (ray.ray.intersectPlane(ground, hit)) jar = { x: hit.x, z: hit.z };
});
addEventListener('pointerdown', () => { if (over) { caught = 0; time = 0; over = false; flies.forEach(place); } });
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  flies.forEach((f, i) => { flyMeshes[i].position.set(f.x, 0.6, f.z); flyMeshes[i].material.color.set(lit(f) ? 0xfff27a : 0x2a2a18); });
  jarMesh.position.set(jar.x, 0.7, jar.z);
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100;
window.__game = {
  describe: () => ({ name: 'firefly jar', mouse: 'move to carry the jar; a glowing firefly inside it is caught' }),
  observe: () => ({ jar: { x: r2(jar.x), z: r2(jar.z) }, caught, timeLeft: r2(Math.max(0, ROUND - time)), over,
    flies: flies.map(f => ({ x: r2(f.x), z: r2(f.z), lit: lit(f) })) }),
  act: () => {},
  setState: s => { if (s.timeLeft !== undefined) time = ROUND - s.timeLeft; if (s.jar) jar = { ...s.jar }; },
  subject: 'jar',
};
</script>
</body></html>
```

It loads three.js from the internet, so double-clicking `index.html` opens it while you are online. The `window.__game` object at the end lets a testing tool read the catches and the timer; a player never sees it.

## Give Cursor's agent a browser: paprika3d

paprika3d is an MCP server: a program that adds tools an AI agent can call. MCP, the Model Context Protocol, is a shared standard that Cursor, Claude Code, Codex and other agents use to get new tools. Its tools open a page in a headless Chrome (one with no window), take its picture and say what is on screen, play it with keys, mouse and touch on exact frames, and read the game's state.

To add it to Cursor, create a file named `mcp.json` in a folder named `.cursor` inside your game's folder, with this in it:

```json
{
  "mcpServers": {
    "paprika": {
      "command": "npx",
      "args": ["-y", "paprika3d", "serve"]
    }
  }
}
```

A `.cursor/mcp.json` in your home folder instead makes it available in every project. Cursor starts the server itself, and its settings list the server and its tools once it is running. Then add the skills, short instruction files that tell the agent when to use each tool and what its replies mean, by running this once in Cursor's terminal:

```bash
npx skills add paprika3d/paprika3d
```

Without the skills, add one sentence to your requests: "after each change, use the paprika tools to open the page, look at it and play it."

## The loop: open, look, play after every change

With the tools in place, the agent works in a loop: after each change it opens the page, looks at it, and plays the part you asked for. The replies below come from paprika3d's MCP server on the game above, captured on 2026-10-30 on a Linux server with no graphics card. They were called directly, as Cursor calls them, not from inside Cursor; the tools and replies are the same in any client. Each is cut to the lines this page discusses, with nothing reworded.

The first version had a dimmer light and a smaller meadow. Its `look`:

```text
look {}

Pixels: brightness 4%, colour saturation 80%, 74% near black, 0% blown out. Mostly black: a blank or unlit frame?
World's edge: 25% of the picture is background below the horizon, in [0, 0, 1279, 676], past the far end of the ground: extend the ground, keep the camera over it, or fade it out with scene.fog.
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Caught 0 · 30 s" [0, 14, 1279, 36].
On screen (9):
meadow 75% [0, 102, 1279, 799] 16 × 12 units
firefly * ×8 0.27% [365, 145, 952, 543]
Not found by the ID image (their own vertex shader places them, or they are see-through; see the picture): jar
```

All 8 fireflies and the score are there, but the frame is 74% near black and the meadow ends inside the picture. Night is meant to be dark; this dark, the meadow is hard to see at all. That is the kind of thing you would notice in a second and might not think to tell the agent. The second request is one sentence:

```text
The meadow is almost black and its edges show. Light it so the grass reads at night,
and fade the edges into the dark.
```

The change is three lines: a fog in the background's colour, a brighter light, and a larger, lighter meadow.

```diff
-scene.add(new THREE.HemisphereLight(0x8899ff, 0x203018, 0.8));
-const meadow = new THREE.Mesh(new THREE.PlaneGeometry(2 * FIELD_X + 4, 2 * FIELD_Z + 4), new THREE.MeshStandardMaterial({ color: 0x1d3a24 }));
+scene.fog = new THREE.Fog(0x070b16, 13, 24);
+scene.add(new THREE.HemisphereLight(0x8899ff, 0x203018, 2.5));
+const meadow = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshStandardMaterial({ color: 0x2f5a35 }));
```

The same `look` after it:

```text
look {}

Pixels: brightness 15%, colour saturation 64%, 0% near black, 0% blown out.
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Caught 0 · 30 s" [0, 14, 1279, 36].
On screen (9):
meadow 100% [0, 0, 1279, 799] 40 × 30 units
firefly * ×8 0.27% [365, 145, 952, 543]
```

The jar is see-through, so the tool's object finder misses it and says so; the agent sees it in the picture that comes with the reply. Then `interact` plays the rule: it moves the mouse onto a glowing firefly, waits 5 frames, checks one was caught, and with `save` keeps the play as a check:

```text
interact {"steps":[{"mouse":"move","x":792,"y":423},{"wait":5}],"expect":{"caught":1},"save":"catch-glowing-firefly"}

{"changed":{"jar":{"x":2.23,"z":0.89},"caught":1,"timeLeft":29.9,"flies":[{"x":-2.21,"z":1.33,"lit":true},{"x":3.8,"z":2.89,"lit":false},{"x":4.68,"z":-1.57,"lit":true},{"x":-2.22,"z":-3.08,"lit":true},{"x":-6,"z":1.16,"lit":true},{"x":-3.58,"z":2.32,"lit":true},{"x":4.56,"z":-4,"lit":true},{"x":-1.92,"z":1.76,"lit":true}]}}
Expect: caught 1 ✓
Saved check "catch-glowing-firefly" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.

interact {"steps":[{"state":{"timeLeft":0.1}},{"wait":10}],"expect":{"over":true,"caught":0},"save":"round-ends"}

Expect: over true ✓ · caught 0 ✓
Saved check "round-ends" in game-tests.json (2 checks now); `test` reruns them all, each from a fresh reload.
```

The caught firefly flew off to a new spot (the fifth, now at `x` -6), and the second check sets the timer to its last tenth of a second and confirms the round ends. `test` reruns both from a fresh page:

```text
test {}

✓ catch-glowing-firefly
✓ round-ends
2 of 2 saved checks passed in 0.8 s
```

## What Cursor gets, and what stays Claude Code's

paprika3d is also a Claude Code plugin, and a few of its parts are Claude Code features that Cursor does not run:

- **Cursor gets** every tool (`open`, `look`, `interact`, `observe`, `eval`, `feel`, `perf`, `test` and the rest) through the MCP server, and the skills through `npx skills add`.
- **Cursor does not get** the hooks: in Claude Code, a hook reruns the saved checks after each edit and wakes the agent when one starts failing (the "after-edit hook" in the reply above), and another reminds it before it stops if the game was never opened. Nor does it get the slash commands, such as `/paprika3d:paprika-make`, which asks a few questions and builds a whole game from them.

So in Cursor, ask for the rerun yourself: end a request with "then run `test`", and the agent replays every saved check after the change. The other difference is effort, not ability: the agent calls the tools when the skill or your request tells it to. Setting up Claude Code instead is on [how to make a game with Claude Code](/guides/make-a-game-with-claude-code).

What paprika3d does not do in either: it does not decide what your game should be or whether it is fun, and it checks the plays the agent saves, not every possible one. You still play the game.

## When it does not work

- **The server does not appear in Cursor's settings, or shows an error.** Check that `mcp.json` is valid JSON (every bracket closed, no comma after the last item), that Node is 20.11 or later (`node --version` in the terminal), and restart Cursor.
- **The agent never uses the tools.** Name them in the request: "use the paprika tools to open and play it."
- **Chrome is not found.** paprika3d looks for Chrome where it is usually installed; elsewhere, set `PAPRIKA3D_CHROME` to its path ([install](/install) has the details).
- **The game shows a blank page.** [HTML game not working](/guides/html-game-not-working) goes through the usual reasons.

## What to do next

- The loop of asking for one change at a time, and how to word each request: [how to vibe code a game](/guides/how-to-vibe-code-a-game) and [AI prompt to make a game](/guides/ai-prompt-to-make-a-game).
- Making the catch feel good, with a pop and a glow: [how to make a game feel good](/guides/make-a-game-feel-good).
- Playing it on a phone with a finger as the jar: [how to make a mobile game with AI](/guides/make-a-mobile-game-with-ai).
- Sharing it as a link: [how to put your game online](/guides/put-your-game-online).
