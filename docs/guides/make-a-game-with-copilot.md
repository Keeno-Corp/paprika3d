---
title: How to make a game with Copilot: a three.js game in VS Code that the agent can see
phrase: how to make a game with copilot
description: How to make a game with GitHub Copilot in VS Code when you have never made one: the first request for Copilot's Agent (agent mode), a small three.js snowman game where snowballs grow as they roll, adding paprika3d's MCP server with MCP: Add Server so the agent opens, pictures and plays the game after each change, the skills and an AGENTS.md line, how VS Code's own browser tools and paprika3d differ, and what stays with Claude Code.
meta: How to make a game with Copilot in VS Code: a small three.js game, plus paprika3d's MCP server so the agent opens, sees and plays it.
intent: make-a-game-with-copilot
queries:
  - "how to make a game with copilot"
  - "how to make a game with copilot ai"
  - "vibe code with copilot"
author: paprika3d agent
date: 2026-11-02
review: weekly
---
# How to make a game with Copilot: a three.js game in VS Code that the agent can see

Yes, you can make a game with GitHub Copilot without writing the code yourself. Copilot is GitHub's AI assistant, and it lives inside VS Code, Microsoft's free code editor (a program for writing and editing the files a program is made of). In Copilot's chat, the built-in agent called **Agent** (the mode once called agent mode) does more than answer: it creates and edits the files of your project and runs commands, and it keeps going until the request is done. Asking it for a game in plain words, and then asking for one change at a time, is what people mean by vibe coding with Copilot.

This page builds a small snowman game that way, then adds paprika3d, a set of tools that lets the agent open the game, picture it, play it and read its state after every change, so it catches its own mistakes before you have to describe them.

## What you need

- **VS Code** with **GitHub Copilot** signed in. Copilot needs a GitHub account; it has a free plan and paid ones.
- **A folder for the game,** opened in VS Code with File, then Open Folder. An empty folder is fine.
- **Google Chrome,** to play the game, and for paprika3d to run it.
- **Node 20.11 or later,** the program that runs JavaScript tools outside a browser; paprika3d's server runs on it. Type `node --version` in VS Code's terminal (Terminal, then New Terminal) to see yours.

## The first request

Open the Chat view, start a new chat with `+`, and pick **Agent** in the agent picker. Then describe the smallest version of the game: what you control, what you are trying to do, and when it is done.

```text
Make a small 3D game with three.js in one index.html file that loads three from a
CDN with an import map. A snowy yard seen from above at an angle, with a marked spot
for a snowman. I roll a snowball with the arrow keys; it picks up the snow it rolls
over and grows, and the ground it rolled over shows grass, so rolling the same track
again adds nothing. Space next to the spot puts the ball on the snowman; each ball
must be smaller than the one below it. Three balls make a snowman with eyes and a
carrot nose. Show the ball's size and how many balls are on the snowman.
```

Copilot shows the changes it makes and asks before it runs a command; read what it asks and approve it. three.js, the library the request names, is a free JavaScript library that draws 3D in a web page, so the whole game is one file a browser runs.

## The game

Here is a page of the kind that request asks for, written for this guide, in its version after the fix described further down:

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Snowman builder</title>
<style>html,body{margin:0;overflow:hidden;background:#8fb8dc}canvas{display:block}
#hud{position:fixed;top:12px;left:0;right:0;text-align:center;font:600 20px system-ui;color:#21384d;pointer-events:none}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rules: roll a snowball with the arrow keys and it picks up the snow it rolls over, growing as it goes.
// Space beside the marked spot puts it on the snowman, and each ball must be smaller than the one below it.
// Three balls make a snowman.
const YARD_X = 12, YARD_Z = 8, CELL = 0.25;      // the yard is 24 by 16, its snow kept in cells of 0.25
const COLS = 2 * YARD_X / CELL, ROWS = 2 * YARD_Z / CELL;
const SPEED = 4, GROW = 0.0025, MAX_R = 1.5, START = { x: 0, z: 6, r: 0.3 }, SPOT = { x: 0, z: -4 };
let snow, ball, stack, done, note;

function start() {
  snow = new Uint8Array(COLS * ROWS).fill(1);   // 1: snow on this cell, 0: rolled up already
  ball = { ...START }; stack = []; done = false; note = '';
  paintAll();
}
function pickUp() {   // the cells under the ball lose their snow, and each one makes the ball a little bigger
  const c0 = Math.floor((ball.x + YARD_X - 0.5) / CELL), c1 = Math.floor((ball.x + YARD_X + 0.5) / CELL);
  const r0 = Math.floor((ball.z + YARD_Z - 0.5) / CELL), r1 = Math.floor((ball.z + YARD_Z + 0.5) / CELL);
  for (let r = Math.max(0, r0); r <= Math.min(ROWS - 1, r1); r++) for (let c = Math.max(0, c0); c <= Math.min(COLS - 1, c1); c++) {
    const cx = (c + 0.5) * CELL - YARD_X, cz = (r + 0.5) * CELL - YARD_Z;
    if (Math.hypot(cx - ball.x, cz - ball.z) > 0.5 || !snow[r * COLS + c]) continue;
    snow[r * COLS + c] = 0;
    ball.r = Math.min(MAX_R, ball.r + GROW);
    paint(c, r);
  }
}
function place() {
  if (done) return;
  if (Math.hypot(ball.x - SPOT.x, ball.z - SPOT.z) > 1.5) { note = 'Roll it to the marked spot first'; return; }
  if (stack.length && ball.r >= stack[stack.length - 1]) { note = 'Too big to go on top: roll a smaller one'; return; }
  stack.push(ball.r);
  done = stack.length === 3;
  note = '';
  ball = { ...START };
}

// The picture: a yard of snow whose rolled cells show grass, the snowball, the spot and the snowman so far.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;   // the ball's shadow is what makes white on white readable
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fb8dc);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 15, 15);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x6a7a90, 1.2));
const sun = new THREE.DirectionalLight(0xfff4e0, 2.5);
sun.position.set(-5, 10, 6);
sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14 });
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);
const map = document.createElement('canvas');   // the snow drawn as a picture on the ground: 4 pixels a cell
map.width = COLS * 4; map.height = ROWS * 4;
const ink = map.getContext('2d');
const groundTexture = new THREE.CanvasTexture(map);
groundTexture.colorSpace = THREE.SRGBColorSpace;
function paintAll() { ink.fillStyle = '#b9cadb'; ink.fillRect(0, 0, map.width, map.height); groundTexture.needsUpdate = true; }
function paint(c, r) { ink.fillStyle = '#7da35e'; ink.fillRect(c * 4, r * 4, 4, 4); groundTexture.needsUpdate = true; }
const yard = new THREE.Mesh(new THREE.PlaneGeometry(2 * YARD_X, 2 * YARD_Z), new THREE.MeshStandardMaterial({ map: groundTexture }));
yard.rotation.x = -Math.PI / 2; yard.name = 'yard'; yard.receiveShadow = true; scene.add(yard);
const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.5, 40), new THREE.MeshBasicMaterial({ color: 0x5a86c8 }));
ring.rotation.x = -Math.PI / 2; ring.position.set(SPOT.x, 0.02, SPOT.z); ring.name = 'spot'; scene.add(ring);
const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
const ballGeo = new THREE.SphereGeometry(1, 32, 20);
const ballMesh = new THREE.Mesh(ballGeo, snowMat);
ballMesh.name = 'snowball'; ballMesh.castShadow = true; scene.add(ballMesh);
const parts = [0, 1, 2].map(i => { const m = new THREE.Mesh(ballGeo, snowMat); m.name = `snowman ${['base', 'middle', 'head'][i]}`; m.castShadow = true; scene.add(m); return m; });
const face = new THREE.Group();
for (const x of [-0.18, 0.18]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshStandardMaterial({ color: 0x222222 })); eye.position.set(x, 0.12, 0.5); face.add(eye); }
const nose = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 10), new THREE.MeshStandardMaterial({ color: 0xf07c1a }));
nose.rotation.x = Math.PI / 2; nose.position.set(0, 0, 0.6); face.add(nose);
face.name = 'face'; scene.add(face);
const hud = document.getElementById('hud');

const held = new Set();
function act({ key, down = true }) {
  if (!down) return held.delete(key);
  if (key === 'Space') place(); else if (key === 'KeyR') start(); else held.add(key);
}
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.code }); });
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

start();
let last = null;
renderer.setAnimationLoop(now => {
  const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;
  const dx = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0), dz = (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0);
  if ((dx || dz) && !done) {
    const len = Math.hypot(dx, dz), step = SPEED * dt;
    ball.x = Math.max(-YARD_X + 0.5, Math.min(YARD_X - 0.5, ball.x + dx / len * step));
    ball.z = Math.max(-YARD_Z + 0.5, Math.min(YARD_Z - 0.5, ball.z + dz / len * step));
    ballMesh.rotateOnWorldAxis(new THREE.Vector3(dz, 0, -dx).normalize(), step / ball.r);   // it rolls, not slides
    pickUp();
  }
  ballMesh.visible = !done;
  ballMesh.scale.setScalar(ball.r);
  ballMesh.position.set(ball.x, ball.r, ball.z);
  let y = 0;
  parts.forEach((m, i) => {
    m.visible = i < stack.length;
    if (!m.visible) return;
    m.scale.setScalar(stack[i]);
    m.position.set(SPOT.x, y + stack[i] * (i ? 0.85 : 1), SPOT.z);   // each ball sinks a little into the one below
    y = m.position.y + stack[i] * 0.85;
  });
  face.visible = done;
  if (done) face.position.copy(parts[2].position);
  hud.textContent = done ? 'Snowman built! R to start a new yard'
    : note || `Snowman: ${stack.length} of 3 balls · this ball ${ball.r.toFixed(2)} · arrows roll, Space places it on the spot`;
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100;
window.__game = {
  describe: () => ({ name: 'snowman builder', units: 'metres', keys: { ArrowUp: 'roll', ArrowDown: 'roll', ArrowLeft: 'roll', ArrowRight: 'roll', Space: 'place the ball on the snowman', KeyR: 'new yard' } }),
  observe: () => ({ ball: { x: r2(ball.x), z: r2(ball.z), r: r2(ball.r) }, stack: stack.map(r2), balls: stack.length, done, note,
    snowLeft: Math.round(snow.reduce((a, b) => a + b, 0) / snow.length * 100) }),
  act,
  setState: s => { if (s.ball) ball = { ...ball, ...s.ball }; if (s.stack) stack = [...s.stack]; },
  subject: 'snowball',
};
</script>
</body></html>
```

The yard's snow is a grid of small cells, each with snow on it or not. Every frame the ball rolls, `pickUp` clears the cells under it, and each cell it clears makes it a little bigger. The ground is a picture drawn on a 2D canvas, so a cleared cell is painted grass. `place` checks the two rules of stacking. It loads three.js from the internet (the CDN in the import map line, a public server for such files), so a double-click opens it while you are online. The `window.__game` object at the end is for testing tools; players never see it.

## Add paprika3d to VS Code

paprika3d is an MCP server, a program that gives an AI agent extra tools. MCP (the Model Context Protocol) is the standard way VS Code, Claude Code, Cursor, Codex and other agents take on tools. paprika3d's tools run the page in a headless Chrome (a Chrome with no window that a program drives), take its picture with a list of the 3D objects on screen, press keys and the mouse on exact frames, read the game's state, and save plays as checks to rerun later.

1. Open the Command Palette (Ctrl+Shift+P, or Cmd+Shift+P on a Mac) and run **MCP: Add Server**.
2. Choose **Command (stdio)** and enter `npx -y paprika3d serve`.
3. Give it the server ID `paprika`.
4. Choose **Global**, then **Copilot Global**, so it works in every folder.

VS Code's documentation says this writes the server into `mcp-config.json` in a `.copilot` folder in your home folder, in this shape:

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

The server is a command that runs on your computer, so VS Code may ask you to trust it before it starts the first time. Then check that the agent can reach it, with a request that names the tools and changes nothing:

```text
Use the paprika tools to open index.html and look at it. Do not change files.
```

Expand the tool call in the chat to see the reply. **Chat: Open Customizations**, then **Tools**, lists every tool the agent may use, paprika3d's among them.

Two more steps make the tools part of every request. The skills are short instruction files that tell an agent when to use each tool and how to read its replies; in VS Code's terminal, in the game's folder, run:

```bash
npx skills add Keeno-Corp/paprika3d -a github-copilot
```

It puts them in `.agents/skills` in the project, one of the folders Copilot reads skills from. Its README asks for Node 22.20 or later, newer than the server needs. And Copilot follows standing instructions written in an `AGENTS.md` file (or `.github/copilot-instructions.md`) in the project, so one line there covers every request:

```text
After each change to the game, open it with the paprika tools, look at it and play the part that changed.
```

## The agent checking its own snowman

The replies below are from paprika3d's MCP server on the game above and on its first version, captured on 2026-11-02 on a Linux machine with no graphics card. The tools were called directly, as Copilot's agent calls them, not from inside VS Code; an MCP server answers every client the same way. Each is cut to the lines discussed, with nothing reworded.

`look` lists what is on screen with its share of the picture and its box in pixels:

```text
look {}

Pixels: brightness 72%, colour saturation 22%, 0% near black, 0% blown out.
Subject: snowball takes 0.093% of the picture [623, 615, 656, 649]; 1 of its 1 named parts show.
Stands out: subject brightness 84% against 68% around it, colour 4% against 15%, edge contrast 0.059.
On screen (3):
yard 62% [0, 197, 1279, 750] 24 × 16 units
spot 0.17% [580, 250, 699, 324] 3 × 3 units
snowball 0.093% [623, 615, 656, 649]
Never visible: none
Hidden by the game (visible false on it or a parent): snowman base, snowman middle, snowman head
```

The yard, the spot and the small first snowball are there, and the snowman's three balls wait hidden until they are made. The "Stands out" line matters for a white ball on snow: while this page was written, a version with lighter snow got the warning "It blends in: the eye has nothing to land on" on that line, and darker, bluer snow cleared it.

Then `interact` plays it. Here it holds the right arrow for 60 frames (a frame is one picture of the game, 60 to a second) and the left arrow for 60, so the ball rolls out and back along its own track, while `trace` follows the ball's size and place. On the first version:

```text
interact {"steps":[{"key":"ArrowRight","frames":60},{"key":"ArrowLeft","frames":60}],"trace":["ball.r","ball.x"]}

{"changed":{"ball":{"r":1.5},"snowLeft":99}}
ball.r: 0.3 → 1.5 at frame 37; first changed at frame 1
ball.x: 0 → peak 4 at frame 60 → 0 at frame 120; first changed at frame 1
```

The ball reached its largest size, 1.5, after 37 frames, before it had even turned round. The first version counted every cell under the ball on every frame, cleared or not, so it grew from the same few cells again and again. In the game it just looks like a ball that is suddenly huge, and that is hard to describe to an agent. The second request:

```text
The snowball grows far too fast, and it grows on grass it has already rolled over.
Each cell of snow should count once, when the ball first rolls over it.
```

The fix is one condition, skipping a cell with no snow left:

```diff
-    if (Math.hypot(cx - ball.x, cz - ball.z) > 0.5) continue;
+    if (Math.hypot(cx - ball.x, cz - ball.z) > 0.5 || !snow[r * COLS + c]) continue;
```

The same play after it, now with `expect` and `save` to keep it as a check:

```text
interact {"steps":[{"key":"ArrowRight","frames":60},{"key":"ArrowLeft","frames":60}],"trace":["ball.r","ball.x"],"expect":{"ball.r":0.49},"save":"no-growth-on-a-rolled-track"}

{"changed":{"ball":{"r":0.49},"snowLeft":99}}
ball.r: 0.3 → 0.49 at frame 57; first changed at frame 1
ball.x: 0 → peak 4 at frame 60 → 0 at frame 120; first changed at frame 1
Expect: ball.r 0.49 ✓
Saved check "no-growth-on-a-rolled-track" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

The ball grew on the way out and stopped growing at frame 57, just before the turn; on the way back over its own track it stayed at 0.49. Next, a real play: hold the up arrow from the start until the ball reaches the spot (an `until` step), let go, and press Space:

```text
interact {"steps":[{"key":"ArrowUp","down":true},{"until":{"ball.z":[-4.2,-3.8]}},{"key":"ArrowUp","down":false},{"key":"Space"}],"trace":["ball.r"],"expect":{"balls":1},"save":"roll-to-the-spot-and-place"}

{"changed":{"stack":[0.72],"balls":1,"snowLeft":97}}
until: ball.z -4.2 to -3.8 held at frame 147
ball.r: 0.3 → peak 0.72 at frame 145 → 0.3 at frame 149; first changed at frame 1
Expect: balls 1 ✓
```

Ten units of fresh snow took the ball from 0.3 to 0.72; it went onto the spot as the snowman's base, and a new small ball appeared. The stacking rules come next, set up with `{ state }` steps so the agent need not roll every ball: a ball of 1.4 offered on top of a base of 1.2 is refused, and a third ball finishes the snowman:

```text
interact {"steps":[{"state":{"ball":{"x":0,"z":-4,"r":1.2}}},{"key":"Space"},{"state":{"ball":{"x":0,"z":-4,"r":1.4}}},{"key":"Space"}],"expect":{"balls":1,"stack.0":1.2,"note":"Too big to go on top: roll a smaller one"},"save":"smaller-on-top"}

{"changed":{"ball":{"z":-4,"r":1.4},"stack":[1.2],"balls":1,"note":"Too big to go on top: roll a smaller one"}}
Expect: balls 1 ✓ · stack.0 1.2 ✓ · note "Too big to go on top: roll a smaller one" ✓

interact {"steps":[{"state":{"stack":[1.2,0.9],"ball":{"x":0,"z":-4,"r":0.6}}},{"key":"Space"}],"expect":{"done":true,"balls":3},"save":"three-balls-make-a-snowman"}

{"changed":{"stack":[1.2,0.9,0.6],"balls":3,"done":true}}
Expect: done true ✓ · balls 3 ✓
```

And a `look` at the finished snowman, the three balls stacked on the spot and the face on the head:

```text
look {}

HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Snowman built! R to start a new yard" [0, 12, 1279, 34].
On screen (8):
yard 61% [0, 197, 1279, 750] 24 × 16 units
snowman base 0.66% [590, 207, 689, 296]
snowman middle 0.44% [600, 149, 679, 222]
snowman head 0.24% [612, 103, 667, 159]
spot 0.13% [580, 264, 699, 324] 3 × 3 units
face ×3 0.0045% [629, 137, 650, 149]
```

`test` replays every saved check on a freshly loaded page, the way to make sure a later change (a second yard, a timer) breaks none of them:

```text
test {}

✓ no-growth-on-a-rolled-track
✓ roll-to-the-spot-and-place
✓ smaller-on-top
✓ three-balls-make-a-snowman
4 of 4 saved checks passed in 2.1 s
```

## VS Code's browser tools and paprika3d

VS Code gives Copilot's agent browser tools of its own: it can open a page in VS Code's integrated browser, read the page's content, take screenshots, click, type and run a scripted flow, and you can share a page you opened with it. Those work on any web page. paprika3d is made for three.js pages and adds what a game needs: the 3D objects on screen listed by name with their size and place, a paused clock so a key is held for an exact number of frames and two runs of the same steps match, the game's own state read through `window.__game` and set with `{ state }` steps, and plays saved as checks that `test` reruns. The agent can use both in one session.

## What Copilot gets from paprika3d, and what stays with Claude Code

- **Copilot gets** every tool (`open`, `look`, `interact`, `observe`, `eval`, `feel`, `perf`, `test` and the rest) through the MCP server, and the skills through `npx skills add`.
- **It does not get** paprika3d's Claude Code hooks, which there rerun the saved checks after every edit (the "after-edit hook" in the reply above) and remind the agent to open a game it never opened, nor the slash commands such as `/paprika3d:paprika-make`, which builds a whole game from a short brief. VS Code has hooks of its own, but adding the server brings none of paprika3d's.

So with Copilot, end a request with "then run `test`" to replay the saved checks. paprika3d does not decide what your game should be or whether it is fun, and it checks the plays the agent saves, not every possible one; you still play it. Setting up Claude Code instead is on [how to make a game with Claude Code](/guides/make-a-game-with-claude-code).

## When it does not work

- **The server does not start.** Run **MCP: List Servers**, pick `paprika` and choose **Show Output** to read its error. The usual causes are an old Node (`node --version` must say 20.11 or later) and a trust prompt that was declined.
- **The agent never calls the tools.** Check they are switched on under **Tools**, and name them in the request: "use the paprika tools to open and play it."
- **Chrome is not found.** paprika3d looks where Chrome is usually installed. Elsewhere, set `PAPRIKA3D_CHROME` to its path; [install](/install) has the details.
- **The code Copilot wrote does not run.** [ChatGPT three.js code not working](/guides/chatgpt-threejs-code-not-working) goes through the usual faults in AI-written three.js code, whichever assistant wrote it, and [HTML game not working](/guides/html-game-not-working) covers a page that stays blank.

## What to do next

- How to word each request and keep to one change at a time: [how to vibe code a game](/guides/how-to-vibe-code-a-game).
- A puff of snow and a little bounce when a ball lands on the snowman: [how to make a game feel good](/guides/make-a-game-feel-good).
- The same setup in other agents: [how to make a game with Cursor](/guides/make-a-game-with-cursor) and [how to make a game with Codex](/guides/make-a-game-with-codex).
- Sharing the game as a link: [how to put your game online](/guides/put-your-game-online).
