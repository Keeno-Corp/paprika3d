---
title: How do I get Codex to use the browser? Codex's browser tools on a three.js game
phrase: how do i get codex to use the browser
description: How to get OpenAI's Codex to use a browser, and what each of its browser options returns from a three.js canvas. The ChatGPT desktop app's built-in browser, Codex Cloud's browser, the Playwright skill OpenAI's browser-games page names, and browser MCP servers, then paprika3d's open, look and interact on a small air hockey game.
meta: How to get Codex to use the browser on a three.js game: its built-in browser, a Playwright skill, or one codex mcp add line for paprika3d.
intent: codex-use-the-browser
queries:
  - "How do I get Codex to use the browser?"
  - "can codex see browser"
  - "codex playwright mcp"
  - "codex playwright interactive"
  - "Windows Codex App: Browser Use blocked by enterprise network policy even for example.com"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# How do I get Codex to use the browser? Codex's browser tools on a three.js game

It depends on where Codex runs. In the ChatGPT desktop app, ask Codex to use the built-in browser or type `@Browser`; in the Codex CLI and the IDE extension there is no built-in browser, so you give Codex one through an MCP server or a skill. For a three.js game, one line in a terminal gives the CLI a browser that also reads the scene:

```bash
codex mcp add paprika -- npx -y paprika3d serve
```

That registers paprika3d, an MCP server whose tools open the page in a headless Chrome, picture it, name each object on screen with its box in pixels, and play it with the mouse and keys on exact frames. The rest of this page lists what each of Codex's own browser options gives you on a game drawn in a `<canvas>`, then runs paprika3d's tools on a small air hockey table.

## Codex's own browser options

OpenAI's documentation, read on 2026-11-12, describes these. This page did not run Codex; it quotes the docs and links them, so check them again before you rely on a detail, since the browser features change often.

| Option | Where it runs | What the docs say it does |
|---|---|---|
| The built-in browser | the ChatGPT desktop app | "Computer Use lets ChatGPT Work or Codex operate the built-in browser directly": it can "open pages, click, type, inspect rendered state, take screenshots". Developer mode adds the Chrome DevTools Protocol for console output, network traffic and the DOM. |
| A browser in a cloud task | Codex Cloud | "When a Codex Cloud task has browser access, Codex can use a browser inside the cloud task to inspect your web app, reproduce a bug, or verify a fix." |
| The `$playwright-interactive` skill | the CLI, the app | OpenAI's browser-games use case names it to "Play the game in a live browser, inspect the current state, and iterate on controls, timing, and UI feel against the real build." |
| A browser MCP server | the CLI, the app | Playwright MCP's README gives `codex mcp add playwright npx "@playwright/mcp@latest"`, and Chrome DevTools MCP's client guide gives `codex mcp add chrome-devtools -- npx chrome-devtools-mcp@latest`. |

The browser page says plainly: "Browser isn't available in Codex CLI or the Codex IDE extension. Open the ChatGPT desktop app to use the built-in browser." The sources are [OpenAI's browser page](https://developers.openai.com/codex/app/browser), the [browser games use case](https://developers.openai.com/codex/use-cases/browser-games) and [Codex's MCP page](https://developers.openai.com/codex/mcp). The issue quoted at the top of this page, about Browser Use behind an enterprise network policy, is a managed-workspace setting: OpenAI's page notes that administrators "can restrict browser origins, uploads, downloads, and developer access".

All of these reach a three.js game the same way a person's eyes do. The page is one `<canvas>` element, so a reader of the DOM or the accessibility tree finds one element and no text, and a screenshot shows the pixels without saying which shape is the puck, where it is in the scene, or how fast it is moving. Codex can work from the screenshot, but it has to guess the game's state from colours, and a fast puck moves between two screenshots by more than its own width.

## What paprika3d adds for a canvas

paprika3d answers those three questions from the scene itself. `open` loads the page on a paused clock, `look` lists every named object on screen with its share of the picture and its pixel box, and `interact` plays mouse and key steps frame by frame and returns what changed in the game's state. Registering it in Codex, the `config.toml` entry with a longer tool timeout, and the skills are set up step by step in [how to make a game with Codex](/guides/make-a-game-with-codex); the one line above is enough to start. Type `/mcp` inside Codex to see the tools.

## The game: air hockey

Your mallet follows the mouse on the near half, the computer's mallet tracks the puck on the far half, and a puck into the far goal scores for you. The mallet chases the pointer at 12 units per second rather than jumping to it, so the mouse position on a given frame decides the hit. Save it as `index.html` next to a `node_modules/three` folder (`npm install three`):

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Air hockey</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rules: your mallet follows the mouse on your half, the puck bounces off the rails and the mallets,
// and a puck into the far goal scores for you. Units are table units; the table runs -3..3 across, -5..5 long.
const W = 3, L = 5, GOAL = 1, PUCK_R = 0.3, MALLET_R = 0.4, MALLET_SPEED = 12, CPU_SPEED = 3, FRICTION = 0.4;
let puck, you, cpu, score, target;
function start() {
  puck = { x: 0, z: 0, vx: 0, vz: 0 };
  you = { x: 0, z: 3.5, vx: 0, vz: 0 };
  cpu = { x: 0, z: -3.5, vx: 0, vz: 0 };
  target = { x: 0, z: 3.5 };
  score = { you: 0, cpu: 0 };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function steer(m, tx, tz, speed, z0, z1, dt) {   // a mallet moves toward its target, no faster than speed
  tx = clamp(tx, -W + MALLET_R, W - MALLET_R); tz = clamp(tz, z0, z1);
  const dx = tx - m.x, dz = tz - m.z, d = Math.hypot(dx, dz), s = Math.min(d, speed * dt);
  m.vx = d ? dx / d * s / dt : 0; m.vz = d ? dz / d * s / dt : 0;
  m.x += m.vx * dt; m.z += m.vz * dt;
}
function hit(m) {   // the puck bounces off a mallet as off a wall that moves
  const dx = puck.x - m.x, dz = puck.z - m.z, d = Math.hypot(dx, dz);
  if (d === 0 || d > PUCK_R + MALLET_R) return;
  const nx = dx / d, nz = dz / d, closing = (puck.vx - m.vx) * nx + (puck.vz - m.vz) * nz;
  puck.x = m.x + nx * (PUCK_R + MALLET_R); puck.z = m.z + nz * (PUCK_R + MALLET_R);
  if (closing < 0) { puck.vx -= 2 * closing * nx; puck.vz -= 2 * closing * nz; }
}
function step(dt) {
  steer(you, target.x, target.z, MALLET_SPEED, MALLET_R, L - MALLET_R, dt);
  steer(cpu, puck.x, -3.5, CPU_SPEED, -L + MALLET_R, -MALLET_R, dt);
  puck.x += puck.vx * dt; puck.z += puck.vz * dt;
  const slow = Math.max(0, 1 - FRICTION * dt); puck.vx *= slow; puck.vz *= slow;
  if (Math.abs(puck.x) > W - PUCK_R) { puck.x = Math.sign(puck.x) * (W - PUCK_R); puck.vx *= -1; }
  if (Math.abs(puck.z) > L - PUCK_R) {
    if (Math.abs(puck.x) < GOAL) { score[puck.z < 0 ? 'you' : 'cpu']++; puck = { x: 0, z: 0, vx: 0, vz: 0 }; }
    else { puck.z = Math.sign(puck.z) * (L - PUCK_R); puck.vz *= -1; }
  }
  hit(you); hit(cpu);
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b2233);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 10, 8);
camera.lookAt(0, 0, 0.6);
scene.add(new THREE.HemisphereLight(0xffffff, 0x334466, 2));
const lamp = new THREE.DirectionalLight(0xffffff, 1.5);
lamp.position.set(2, 8, 4);
scene.add(lamp);
const box = (name, w, h, d, color, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color }));
  m.name = name; m.position.set(x, y, z); scene.add(m); return m;
};
box('table', 2 * W, 0.2, 2 * L, 0xe8eef5, 0, -0.1, 0);
box('centre line', 2 * W, 0.01, 0.06, 0xd04050, 0, 0.006, 0);
box('rail left', 0.2, 0.3, 2 * L, 0x2f6fd0, -W - 0.1, 0.05, 0);
box('rail right', 0.2, 0.3, 2 * L, 0x2f6fd0, W + 0.1, 0.05, 0);
for (const [name, z] of [['far goal', -L - 0.1], ['near goal', L + 0.1]]) {
  box(name, 2 * GOAL, 0.06, 0.2, 0x111111, 0, -0.07, z);
  for (const s of [-1, 1]) box(`${name} rail`, W - GOAL, 0.3, 0.2, 0x2f6fd0, s * (W + GOAL) / 2, 0.05, z);
}
const disc = (name, r, h, color) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32), new THREE.MeshStandardMaterial({ color }));
  m.name = name; scene.add(m); return m;
};
const puckMesh = disc('puck', PUCK_R, 0.1, 0x202020);
const youMesh = disc('your mallet', MALLET_R, 0.25, 0xe04040);
const cpuMesh = disc('cpu mallet', MALLET_R, 0.25, 0x30a050);

// The mouse, as a point on the table: your mallet's target.
const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), at = new THREE.Vector3();
addEventListener('pointermove', e => {
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), camera);
  if (ray.ray.intersectPlane(plane, at)) target = { x: at.x, z: at.z };
});
addEventListener('keydown', e => { if (e.code === 'KeyR') start(); });
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
  puckMesh.position.set(puck.x, 0.05, puck.z);
  youMesh.position.set(you.x, 0.125, you.z);
  cpuMesh.position.set(cpu.x, 0.125, cpu.z);
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100;
window.__game = {
  describe: () => ({ name: 'air hockey', units: 'table units, the far goal at z -5', mouse: 'your mallet follows it on the near half', keys: { KeyR: 'restart' } }),
  observe: () => ({ puck: { x: r2(puck.x), z: r2(puck.z), speed: r2(Math.hypot(puck.vx, puck.vz)) },
    you: { x: r2(you.x), z: r2(you.z) }, cpu: { x: r2(cpu.x), z: r2(cpu.z) }, score: { ...score } }),
  act: ({ key, down = true }) => { if (key === 'KeyR' && down) start(); },
  setState: s => {
    if (s.puck) puck = { vx: 0, vz: 0, ...s.puck };
    if (s.you) { you = { vx: 0, vz: 0, ...s.you }; target = { x: you.x, z: you.z }; }
    if (s.cpu) cpu = { vx: 0, vz: 0, ...s.cpu };
  },
};
</script>
</body></html>
```

Two choices make it testable. Every mesh has a `name`, which `look` reports, and `window.__game` returns the puck's position and speed, both mallets and the score as JSON, with `setState` to put the pieces anywhere.

## The calls Codex makes, and the replies

These replies came from paprika3d's MCP server on the page above on 2026-11-12, called directly on a Linux machine with no graphics card; an MCP server gives the same replies to any client, Codex included. Run folders are shortened to `<project>`, and the `open` and `look` replies are cut to the lines used here, with nothing reworded.

**Open it.** The second line is the page as a text reader sees it: nothing.

```text
open {"url":"index.html","cwd":"<project>"}

Opened http://127.0.0.1:40507/index.html in 0.1 s, paused at frame 0.
GPU: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). A software renderer (no GPU): frame times here say nothing of a real GPU's.
Page text outside the canvas: none
{"name":"air hockey","units":"table units, the far goal at z -5","mouse":"your mallet follows it on the near half","keys":{"KeyR":"restart"}}
```

**Look at it.** The picture, plus the pieces by name with their boxes as left, top, right and bottom in page pixels:

```text
look {}

Picture: <project>/paprika3d/runs/2026-11-12T04-38-33-202Z/look-1.png
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
Surface: "table" covers 22% with almost no detail (0 of 255): it reads as flat colour. Unless the user asked for flat colour, add texture, normal detail or lighting variation.
On screen (13):
table 22% [379, 155, 900, 709] 10 × 6 units
your mallet 0.35% [607, 548, 672, 616]
cpu mallet 0.16% [617, 183, 662, 225]
puck 0.11% [620, 348, 659, 383]
centre line 0.11% [439, 366, 840, 368] 6 × 0.06 units, across the view
Never visible: none
```

The rails and goals are left out of the list above. The puck's box centres on (640, 365), so that is where the mouse goes.

**Take a shot that scores.** A `{ state }` step moves the computer's mallet off to the left, a mouse step puts the pointer on the puck, and 40 frames run. `trace` follows values frame by frame, `expect` checks the score, and `save` keeps the play as a check:

```text
interact {"steps":[{"state":{"cpu":{"x":-2,"z":-3.5}}},{"mouse":"move","x":640,"y":365},{"wait":40}],"trace":["puck.speed","puck.z","cpu.x"],"expect":{"score.you":1},"save":"straight-shot-scores"}

{"changed":{"puck":{"z":-0.3},"you":{"z":0.4},"score":{"you":1}}}
mouse move at (640, 365): over puck (Mesh, 12.7 units)
puck.speed: 0 → peak 24 at frame 15 → 0 at frame 27; first changed at frame 15
puck.z: 0 → low -4.46 at frame 26 → -0.3 at frame 27; first changed at frame 15
cpu.x: -1.95 → 0 at frame 39; first changed at frame 1
Expect: score.you 1 ✓
Saved check "straight-shot-scores" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

The reply reads as the rules say it should. The mouse step names the object under the pointer. The mallet reached the puck on frame 15 and sent it off at 24 units per second, twice the mallet's speed, which is how a bounce off a moving wall works. On frame 27 the puck crossed the goal line, the score went to 1, and the puck went back to the centre spot, where your mallet, resting at 0.4, nudged it to -0.3. The computer's mallet was still on its way from the left.

**Take the same shot with the computer's mallet in the way.**

```text
interact {"steps":[{"state":{"you":{"x":0,"z":3.5},"cpu":{"x":0,"z":-3.5},"puck":{"x":0,"z":0}}},{"mouse":"move","x":640,"y":366},{"wait":40}],"trace":["puck.speed","puck.z"]}

{"changed":{"puck":{"z":-1.43,"speed":20.17}}}
mouse move at (640, 366): over puck (Mesh, 12.7 units)
puck.speed: 0 → peak 24 at frame 15 → 20.17 at frame 41; first changed at frame 15
puck.z: 0 → low -2.8 at frame 22 → -1.43 at frame 41; first changed at frame 15
```

The puck got no further than -2.8, where it met the computer's mallet on frame 22, and it was on its way back at 20.17 units per second when the steps ended: friction took a little of its speed, and the score did not change. Two screenshots a moment apart would show a black disc in two places; the trace gives the frame of the hit.

**Rerun the saved checks.** After Codex changes the game, `test` replays every saved check on a fresh reload:

```text
test {}

✓ straight-shot-scores
1 of 1 saved checks passed in 0.2 s
```

## Pitfalls

- **Start a play with a `{ state }` or `{ wait }` step.** On a page fresh from `open`, still at frame 0, a mouse move sent as the first step of a call reached this game after the call's frames had run, so the mallet did not move; a step that runs one frame first avoided it.
- **Name the meshes.** An unnamed mesh is listed by its type, and a list of five `Mesh` lines tells Codex little.
- **A mouse game follows `pointermove`.** paprika3d sends real browser mouse events at page pixels, the same coordinates `look` gives its boxes in.

## What paprika3d does not do

It does not drive the ChatGPT desktop app's built-in browser, your signed-in tabs or the Chrome extension: it runs its own headless Chrome, so a page behind a login needs its own way in. It draws WebGL on the machine it runs on, which on a machine with no graphics card is a software renderer, so frame times there say nothing about a player's GPU. Codex gets its tools and skills but not the Claude Code plugin's hooks, which rerun saved checks after each edit, so ask Codex to run `test` after a change. And it reports positions, speeds and scores; whether the game is fun is still yours to judge.

For pages with forms, links and logins, Codex's built-in browser and the browser MCP servers above read the page's elements directly, which paprika3d does not try to replace.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): the same open, look and play loop, with keys.
- [Screenshot a three.js scene headless from a coding agent](/guides/screenshot-threejs-scene-headless): every way `look` pictures a scene.
- [How to make a game with Codex](/guides/make-a-game-with-codex): installing Codex, the `config.toml` entry and the skills.
- [MCP server that screenshots a WebGL canvas](/guides/mcp-server-screenshot-webgl-canvas): the picture an agent reads in the tool result.
- [A Playwright alternative for three.js and WebGL pages](/guides/playwright-alternative-threejs-webgl): writing these checks as a browser script instead.
