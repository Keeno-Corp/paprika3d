---
title: How to make a game with Codex: a three.js game the Codex CLI can see and play
phrase: how to make a game with codex
description: How to make a game with Codex when you have never made one: installing OpenAI's Codex CLI, the first request to type, a small three.js sheep-herding game, one command that adds paprika3d's MCP server to Codex so it opens, pictures and plays the game after each change, an AGENTS.md line, and which parts of paprika3d Codex gets and which stay with Claude Code.
meta: How to make a game with Codex: a small three.js game, plus one command that lets the Codex CLI open, see and play it.
intent: make-a-game-with-codex
queries:
  - "how to make a game with codex"
  - "codex vibe coding game"
  - "codex vs claude code game dev"
  - "Show HN: 2d platformer game built with Codex (zero code)"
author: paprika3d agent
date: 2026-11-02
review: weekly
---
# How to make a game with Codex: a three.js game the Codex CLI can see and play

Yes, Codex can make a game for you, and you do not need to write the code yourself. Codex is OpenAI's coding agent. Its command-line version, the Codex CLI, runs in a terminal (the window where you type commands, such as Terminal on a Mac or PowerShell on Windows): you tell it in plain words what to build, and it writes the files in the folder you started it in and runs commands there. People post games made this way, such as the Hacker News thread "Show HN: 2d platformer game built with Codex (zero code)".

What Codex does not do out of the box is open the game in a browser, watch it and press its keys. It works with files and commands, so after each change it is you who opens the game, tries it, and explains what went wrong. This page makes a small game with the Codex CLI, then gives Codex paprika3d's tools, which run the game in a browser of their own so Codex checks each change itself.

## What you need

- **The Codex CLI.** Its README gives `npm install -g @openai/codex` (npm comes with Node, below) or an install script for Mac, Linux and Windows. Run `codex` once and choose **Sign in with ChatGPT** to use it with a ChatGPT plan.
- **Node 20.11 or later,** the program that runs JavaScript tools outside a browser, for npm and for paprika3d's server. `node --version` in a terminal says which one you have.
- **Google Chrome,** to play the game, and for paprika3d to run it.
- **An empty folder** for the game. In the terminal, go into it with `cd` and the folder's path, then start Codex there with `codex`.

## Why a three.js game

three.js is a free JavaScript library that draws 3D in a web page. A game made with it is a web page too: one `index.html` file that any browser runs, with nothing else to install. That suits an agent that works in files and a terminal, because the whole game is text it can write and change, and it suits a tool that tests the game, because a web page can be opened in a browser that a program controls.

## The first request

Describe the smallest game that is still a game: what the player controls, what they are trying to do, and how it ends. Type this into Codex:

```text
Make a small 3D game with three.js in one index.html file that loads three from a CDN
with an import map. A green field with a low hedge round it, seen from above at an
angle, and a fenced pen in the top right corner with a gap in its fence for a gate.
I steer a sheepdog with the arrow keys. Three sheep run straight away from the dog
when it comes close. A sheep that goes in through the gate stays in the pen, and the
fence blocks sheep everywhere else. Show how many sheep are in the pen and the time;
when all three are in, show the time and let R start again.
```

Codex shows each file it wants to write and each command it wants to run, and depending on its approval setting asks before it does. Read the request it is answering, and say yes.

## The game

This is a page of the kind that request asks for, written for this guide, in the version after the one fix described further down:

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Sheepdog</title>
<style>html,body{margin:0;overflow:hidden;background:#9fd0ee}canvas{display:block}
#hud{position:fixed;top:12px;left:0;right:0;text-align:center;font:600 20px system-ui;color:#fff;text-shadow:0 1px 3px #000;pointer-events:none}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rules: the dog walks with the arrow keys, and a sheep runs straight away from the dog when it comes close.
// Steer all three sheep through the gate into the pen; a sheep in the pen stays there.
const FIELD_X = 12, FIELD_Z = 8;    // the field runs from -12 to 12 across and from -8 to 8 deep
const PEN = { x0: 6, x1: 11, z0: -7, z1: -3, gate0: 7.5, gate1: 9.5 };   // the gate is in the pen's near side
const DOG_SPEED = 6, SHEEP_SPEED = 4.5, SCARE = 3.5;
let dog, sheep, time, won;
const held = new Set();
function start() {
  dog = { x: -9, z: 5 };
  sheep = [{ x: -3, z: 2 }, { x: 0, z: 5 }, { x: 3, z: 1 }].map(s => ({ ...s, penned: false }));
  time = 0; won = false;
}
const inPen = p => p.x > PEN.x0 && p.x < PEN.x1 && p.z > PEN.z0 && p.z < PEN.z1;
function slide(p, dx, dz) {   // one axis at a time, so a sheep pushed into the fence slides along it
  const next = { x: p.x + dx, z: p.z + dz };
  const throughGate = p.z >= PEN.z1 && next.z < PEN.z1 && next.x > PEN.gate0 && next.x < PEN.gate1;
  if (inPen(next) !== inPen(p) && !throughGate) return;   // the fence: in or out only through the gate
  p.x = Math.max(-FIELD_X, Math.min(FIELD_X, next.x));     // and nobody leaves the field
  p.z = Math.max(-FIELD_Z, Math.min(FIELD_Z, next.z));
}
const move = (p, dx, dz) => { slide(p, dx, 0); slide(p, 0, dz); };

function step(dt) {
  if (won) return;
  time += dt;
  const ax = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
  const az = (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0);
  const len = Math.hypot(ax, az) || 1;
  move(dog, ax / len * DOG_SPEED * dt, az / len * DOG_SPEED * dt);
  for (const s of sheep) {
    if (s.penned) continue;
    const dx = s.x - dog.x, dz = s.z - dog.z, d = Math.hypot(dx, dz);
    if (d > 0 && d < SCARE) move(s, dx / d * SHEEP_SPEED * dt, dz / d * SHEEP_SPEED * dt);
    if (inPen(s)) s.penned = true;
  }
  won = sheep.every(s => s.penned);
}

// The picture: a green field inside a hedge, a fenced pen with a gap for the gate, three sheep and a dog.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd0ee);
scene.fog = new THREE.Fog(0x9fd0ee, 30, 60);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 21, 16);
camera.lookAt(0, 0, 0.5);
scene.add(new THREE.HemisphereLight(0xffffff, 0x4a6a3a, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-6, 12, 8);
scene.add(sun);
const field = new THREE.Mesh(new THREE.PlaneGeometry(2 * FIELD_X, 2 * FIELD_Z), new THREE.MeshStandardMaterial({ color: 0x7cc05c }));
field.rotation.x = -Math.PI / 2; field.name = 'field'; scene.add(field);
const moor = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), new THREE.MeshStandardMaterial({ color: 0x4f7a3a }));
moor.rotation.x = -Math.PI / 2; moor.position.y = -0.01; moor.name = 'moor'; scene.add(moor);
const leaves = new THREE.MeshStandardMaterial({ color: 0x2f5a2a });
for (const [x, z, w, d] of [[0, -FIELD_Z, 2 * FIELD_X + 0.5, 0.5], [0, FIELD_Z, 2 * FIELD_X + 0.5, 0.5], [-FIELD_X, 0, 0.5, 2 * FIELD_Z - 0.5], [FIELD_X, 0, 0.5, 2 * FIELD_Z - 0.5]]) {
  const hedge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), leaves);   // a low hedge round the field
  hedge.position.set(x, 0.25, z); hedge.name = 'hedge'; scene.add(hedge);
}
const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a33 });
function rail(x0, z0, x1, z1) {   // one stretch of fence between two corners
  const length = Math.hypot(x1 - x0, z1 - z0);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, 0.6, 0.15), wood);
  mesh.position.set((x0 + x1) / 2, 0.3, (z0 + z1) / 2);
  mesh.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
  mesh.name = 'fence';
  scene.add(mesh);
}
rail(PEN.x0, PEN.z0, PEN.x1, PEN.z0); rail(PEN.x0, PEN.z0, PEN.x0, PEN.z1); rail(PEN.x1, PEN.z0, PEN.x1, PEN.z1);
rail(PEN.x0, PEN.z1, PEN.gate0, PEN.z1); rail(PEN.gate1, PEN.z1, PEN.x1, PEN.z1);
function animal(name, bodyColour, headColour, size) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(size, 20, 14), new THREE.MeshStandardMaterial({ color: bodyColour }));
  body.scale.set(1.3, 0.9, 1); body.position.y = size;
  const head = new THREE.Mesh(new THREE.SphereGeometry(size * 0.45, 14, 10), new THREE.MeshStandardMaterial({ color: headColour }));
  head.position.set(size * 1.2, size * 1.3, 0);
  group.add(body, head);
  group.name = name;
  scene.add(group);
  return group;
}
const dogMesh = animal('dog', 0x7a4a2a, 0x3a2414, 0.45);
const sheepMeshes = [1, 2, 3].map(n => animal(`sheep ${n}`, 0xf4f1ea, 0x2b2b2b, 0.55));
const hud = document.getElementById('hud');

addEventListener('keydown', e => { if (e.code === 'KeyR') start(); else held.add(e.code); });
addEventListener('keyup', e => held.delete(e.code));
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

start();
let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  dogMesh.position.set(dog.x, 0, dog.z);
  sheep.forEach((s, i) => sheepMeshes[i].position.set(s.x, 0, s.z));
  const penned = sheep.filter(s => s.penned).length;
  hud.textContent = won ? `All three in the pen in ${Math.round(time)} s! R to play again`
    : `Sheep in the pen: ${penned} of 3 · ${Math.floor(time)} s · arrow keys move the dog`;
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100;
window.__game = {
  describe: () => ({ name: 'sheepdog', units: 'metres', keys: { ArrowUp: 'dog up the field', ArrowDown: 'dog down', ArrowLeft: 'dog left', ArrowRight: 'dog right', KeyR: 'restart' } }),
  observe: () => ({ dog: { x: r2(dog.x), z: r2(dog.z) }, sheep: sheep.map(s => ({ x: r2(s.x), z: r2(s.z), penned: s.penned })),
    penned: sheep.filter(s => s.penned).length, won, time: r2(time) }),
  act: ({ key, down = true }) => { if (key === 'KeyR') { if (down) start(); } else if (down) held.add(key); else held.delete(key); },
  setState: s => {
    if (s.dog) dog = { ...s.dog };
    if (s.sheep) sheep = s.sheep.map(p => ({ penned: false, ...p }));
  },
  subject: 'dog',
};
</script>
</body></html>
```

The page loads three.js from the internet (the import map line points at a CDN, a public server for such files), so it opens with a double-click while you are online. `step` holds the rules: the dog moves with the held keys, and each sheep within 3.5 units of the dog runs straight away from it. `slide` moves one animal along one axis and refuses any step that crosses the pen's fence anywhere but the gate, which is what makes a sheep pushed into the fence slide along it. The `window.__game` object at the end is for tools that test the game; players never see it.

## Give Codex a browser: paprika3d

paprika3d is an MCP server, a program that gives an agent new tools. MCP (the Model Context Protocol) is the standard way Codex, Claude Code, Cursor and other agents take on tools. paprika3d's tools open a page in a headless Chrome (a Chrome with no window, controlled by the tools), picture it and list what is on screen, play it with keys and the mouse on exact frames, and read the game's state.

Codex adds an MCP server with one command, typed in the terminal (not inside Codex):

```bash
codex mcp add paprika -- npx -y paprika3d serve
```

That writes an entry into Codex's settings file, `config.toml` in the `.codex` folder in your home folder. You can also write the entry by hand. paprika3d's own Codex template adds a longer time limit for a tool call, since `open` starts Chrome:

```toml
[mcp_servers.paprika]
command = "npx"
args = ["-y", "paprika3d", "serve"]
# The `open` tool starts Chrome and can start a dev server, so allow a tool call more than the 60 s default.
tool_timeout_sec = 180
```

Start Codex again and type `/mcp`: it lists the MCP tools Codex has, and paprika3d's should be among them. Then add the skills, short instruction files that tell an agent when to use each tool and how to read its replies. In the terminal, in the game's folder:

```bash
npx skills add Keeno-Corp/paprika3d -a codex
```

The installer puts them in a `.agents/skills` folder in the project, where Codex finds them; leave out `-a codex` and it asks which agents to install for. Its README asks for Node 22.20 or later, newer than paprika3d's server needs.

Last, Codex reads a file named `AGENTS.md` in the project for standing instructions (`/init` inside Codex writes a first one). One line there makes the check part of every request:

```text
After each change to the game, use the paprika tools to open it, look at it and play the part that changed.
```

## Codex checking its own game

With the tools in place, each change ends the same way: open the page, look, play. The replies below are from paprika3d's MCP server on the game above and on its first version, captured on 2026-11-02 on a Linux machine with no graphics card. The tools were called directly, the same calls Codex makes, not from inside Codex; an MCP server gives the same replies to every client. Each is cut to the lines discussed here, with nothing reworded.

`look` first, the picture and a list of what is on screen:

```text
look {}

Pixels: brightness 57%, colour saturation 49%, 0% near black, 0% blown out.
On screen (19):
moor 53% [0, 0, 1279, 799] 80 × 60 units
field 38% [122, 193, 1157, 649] 24 × 16 units
hedge ×4 7.6% [79, 171, 1200, 679] 15.5–24.5 × 0.5 units
fence ×5 0.69% [827, 193, 1025, 304]
sheep * ×6 0.59% [495, 383, 789, 560]
dog ×2 0.15% [238, 522, 292, 558]
Never visible: none
```

Everything the request named is there: the field inside its four hedges, the five stretches of the pen's fence, and the animals (each is a body and a head, so three sheep count six). Then `interact` plays the game. It can set the scene first with a `{ state }` step, here the dog just behind one sheep, then hold a key for a number of frames (a frame is one picture of the game, 60 to a second) and follow values frame by frame with `trace`. On the first version, the dog chases a sheep to the left hedge:

```text
interact {"steps":[{"state":{"dog":{"x":0,"z":2},"sheep":[{"x":-3,"z":2},{"x":5,"z":6},{"x":8,"z":6}]}},{"key":"ArrowLeft","frames":180}],"trace":["sheep.0.x","dog.x"]}

{"changed":{"dog":{"x":-12,"z":2},"sheep":[{"x":-15.52,"z":2,"penned":false},{"x":5,"z":6,"penned":false},{"x":8,"z":6,"penned":false}],"time":3.02}}
Motion (dog): travelled 12 units, it stopped at frame 120 and did not move again.
sheep.0.x: -3.07 → -15.52 at frame 166; first changed at frame 1
dog.x: 0 → -12 at frame 120; first changed at frame 1
```

The dog stopped at the hedge, at -12, but the sheep kept running to -15.52, through the hedge and onto the moor outside; the picture from `look` shows it there, beyond the field's left edge. The first version kept the dog on the field and forgot the sheep. That is easy to miss when you play, since you rarely chase a sheep into a corner, and Codex would not have seen it at all. The second request:

```text
A sheep can run out through the hedge. Keep the sheep inside the field, the same way as the dog.
```

The fix moves the edge rule from the dog into `slide`, which every animal uses:

```diff
   if (inPen(next) !== inPen(p) && !throughGate) return;   // the fence: in or out only through the gate
-  p.x = next.x;
-  p.z = next.z;
+  p.x = Math.max(-FIELD_X, Math.min(FIELD_X, next.x));     // and nobody leaves the field
+  p.z = Math.max(-FIELD_Z, Math.min(FIELD_Z, next.z));
...
   move(dog, ax / len * DOG_SPEED * dt, az / len * DOG_SPEED * dt);
-  dog.x = Math.max(-FIELD_X, Math.min(FIELD_X, dog.x));   // the dog stays on the field
-  dog.z = Math.max(-FIELD_Z, Math.min(FIELD_Z, dog.z));
```

The same chase after it, with `expect` to check where the sheep ends and `save` to keep the play as a check:

```text
interact {"steps":[{"state":{"dog":{"x":0,"z":2},"sheep":[{"x":-3,"z":2},{"x":5,"z":6},{"x":8,"z":6}]}},{"key":"ArrowLeft","frames":180}],"trace":["sheep.0.x","dog.x"],"expect":{"sheep.0.x":[-12,12]},"save":"sheep-stay-on-the-field"}

{"changed":{"dog":{"x":-12,"z":2},"sheep":[{"x":-12,"z":2,"penned":false},{"x":5,"z":6,"penned":false},{"x":8,"z":6,"penned":false}],"time":3.02}}
sheep.0.x: -3.07 → -12 at frame 119; first changed at frame 1
dog.x: 0 → -12 at frame 120; first changed at frame 1
Expect: sheep.0.x -12 ✓
Saved check "sheep-stay-on-the-field" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

Then the point of the game. With the dog below a sheep that stands in line with the gate, an `until` step holds the up arrow until a sheep is in the pen; and with the dog driving a sheep into the side of the pen, the fence must hold:

```text
interact {"steps":[{"state":{"dog":{"x":8.5,"z":3},"sheep":[{"x":8.5,"z":0},{"x":-5,"z":6},{"x":-8,"z":6}]}},{"key":"ArrowUp","down":true},{"until":{"penned":1},"max":300},{"key":"ArrowUp","down":false}],"expect":{"penned":1,"sheep.0.penned":true},"save":"through-the-gate"}

{"changed":{"dog":{"x":8.5,"z":-1},"sheep":[{"x":8.5,"z":-3.07,"penned":true},{"x":-5,"z":6,"penned":false},{"x":-8,"z":6,"penned":false}],"penned":1,"time":0.7}}
until: penned == 1 held at frame 40
Expect: penned 1 ✓ · sheep.0.penned true ✓

interact {"steps":[{"state":{"dog":{"x":1.5,"z":-5},"sheep":[{"x":4,"z":-5},{"x":-5,"z":6},{"x":-8,"z":6}]}},{"key":"ArrowRight","frames":30}],"trace":["sheep.0.x"],"expect":{"penned":0,"sheep.0.x":[5,6]},"save":"fence-holds-at-the-side"}

{"changed":{"dog":{"x":4.5,"z":-5},"sheep":[{"x":5.95,"z":-5,"penned":false},{"x":-5,"z":6,"penned":false},{"x":-8,"z":6,"penned":false}],"time":0.52}}
sheep.0.x: 4.08 → 5.95 at frame 25; first changed at frame 1
Expect: penned 0 ✓ · sheep.0.x 5.95 ✓
```

The sheep went in through the gate on frame 40, and the one driven at the side stopped at 5.95, just short of the fence at 6. `test` replays the three saved checks, each on a freshly loaded page:

```text
test {}

✓ sheep-stay-on-the-field
✓ through-the-gate
✓ fence-holds-at-the-side
3 of 3 saved checks passed in 1.4 s
```

## What Codex gets from paprika3d, and what stays with Claude Code

paprika3d is also a Claude Code plugin, and its MCP server is the part every agent can use:

- **Codex gets** every tool (`open`, `look`, `interact`, `observe`, `eval`, `feel`, `perf`, `test` and the others) through `codex mcp add`, and the skills through `npx skills add`.
- **Codex does not get** the plugin's hooks, which in Claude Code rerun the saved checks after every edit (the "after-edit hook" in the reply above) and remind the agent to open a game it never opened, or its slash commands, such as `/paprika3d:paprika-make`, which asks a few questions and builds a whole game from references, a look and a design doc. Codex has hooks of its own, but `codex mcp add` brings none of paprika3d's.

So in Codex, end a request with "then run `test`" to replay the saved checks after a change.

As for Codex against Claude Code for making games: this page does not rank them. paprika3d's benchmark results compare Claude models with and without the plugin, never Codex, so there is no measured answer here. What is true is that both get the same tools from the same server, and the guided build with `/paprika3d:paprika-make` runs in Claude Code; [how to make a game with Claude Code](/guides/make-a-game-with-claude-code) sets that up.

paprika3d does not decide what your game is about or whether it is fun, and it checks the plays the agent saves, not every possible one. You still play it.

## When it does not work

- **`/mcp` does not list paprika3d's tools.** Run `codex mcp list` in the terminal to see whether the entry was written, check `node --version` says 20.11 or later, and start Codex again.
- **`open` stops with a timeout.** The first start of Chrome on a slow machine can pass Codex's default time limit; add the `tool_timeout_sec` line shown above.
- **Chrome is not found.** paprika3d looks where Chrome is usually installed. Elsewhere, set `PAPRIKA3D_CHROME` to its path, for example with an `env` line under the server's entry in `config.toml`; [install](/install) has the details.
- **Codex never calls the tools.** Check the line in `AGENTS.md`, or say it in the request: "use the paprika tools to open and play it."
- **The code itself is broken.** [ChatGPT three.js code not working](/guides/chatgpt-threejs-code-not-working) and [HTML game not working](/guides/html-game-not-working) cover the usual faults, whichever agent wrote the code.

## What to do next

- One change per request, and how to word each one: [how to vibe code a game](/guides/how-to-vibe-code-a-game) and [AI prompt to make a game](/guides/ai-prompt-to-make-a-game).
- A wolf that chases the sheep: [how to make an enemy follow the player](/guides/make-an-enemy-follow-the-player).
- The same setup in other editors: [how to make a game with Cursor](/guides/make-a-game-with-cursor) and [how to make a game with Copilot](/guides/make-a-game-with-copilot).
- Sharing the game as a link: [how to put your game online](/guides/put-your-game-online).
