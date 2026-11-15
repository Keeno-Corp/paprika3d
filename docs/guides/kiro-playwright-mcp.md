---
title: Kiro Playwright MCP on a three.js game, and paprika3d in Kiro's MCP settings
phrase: kiro playwright mcp
description: How to add Playwright MCP and paprika3d to Kiro's MCP settings (.kiro/settings/mcp.json), what Playwright's page snapshot holds for a three.js game drawn in one canvas, and what paprika3d's open, look and interact return on a small three.js train set where clicking the points sends the train into the siding.
meta: Kiro Playwright MCP on a three.js game: both servers in .kiro/settings/mcp.json, and what each one reads from the canvas.
intent: kiro-playwright-mcp
queries:
  - "kiro playwright mcp"
  - "kiro browser"
  - "kiro ide playwright mcp"
  - "kiro game"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# Kiro Playwright MCP on a three.js game, and paprika3d in Kiro's MCP settings

Kiro takes Playwright MCP and paprika3d the same way: as entries under `mcpServers` in `.kiro/settings/mcp.json` in the workspace, or `~/.kiro/settings/mcp.json` for every workspace. Playwright MCP drives the page through its accessibility tree, which for a three.js game is one `<canvas>` with nothing inside; paprika3d opens the same page and reads the scene, naming each object on screen and playing the game on exact frames. To add paprika3d, put `"paprika": { "command": "npx", "args": ["-y", "paprika3d", "serve"] }` under `mcpServers` in that file.

## The settings file

Kiro's MCP documentation ([kiro.dev/docs/mcp/configuration](https://kiro.dev/docs/mcp/configuration/)) gives two places for the file: `.kiro/settings/mcp.json` at the workspace level and `~/.kiro/settings/mcp.json` at the user level. When both exist they are merged, and the workspace's entries win. Each local server takes `command`, `args` and `env`, plus `disabled`, `autoApprove` (tools that run without asking) and `disabledTools` (tools hidden from the agent).

Both servers in one workspace file, the Playwright entry as Playwright MCP's README gives it for Kiro:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    },
    "paprika": {
      "command": "npx",
      "args": ["-y", "paprika3d", "serve"]
    }
  }
}
```

paprika3d needs Google Chrome and Node 20.11 or later. Kiro reconnects its servers when the file is saved. Its command palette has entries to open the workspace and user MCP config, and the MCP servers tab in the Kiro panel lists each server, whether it connected, and its tools, where single tools can be turned off. Kiro asks before it runs an MCP tool; a tool named in `autoApprove` runs without asking, except in a workspace Kiro does not trust, where every call asks.

Two more places Kiro reads from:

- **Skills.** Kiro loads Agent Skills from `.kiro/skills/` in the workspace and `~/.kiro/skills/` for the user. `npx skills add Keeno-Corp/paprika3d -a kiro-cli` installs paprika3d's skills into `.kiro/skills/`; the skills installer lists Kiro under its CLI name.
- **Steering.** Markdown files in `.kiro/steering/` give Kiro standing instructions for the project. One line there makes the check part of every change: "After changing the game, use the paprika tools to open it, look at it and play the part that changed."

This page did not run Kiro itself. The replies below come from the two MCP servers called directly with the same calls an agent sends, which is what Kiro's agent receives: a server answers every client alike. Kiro's settings and panels are as its documentation describes them on 2026-11-12.

## A train set

A train runs round an oval. Click the points, the lever beside the track, and the next time the train reaches them it turns off onto the siding and runs to the buffer. Each object has a `name`, and `window.__game` hands the tools which way the points are set, which track the train is on and whether it has stopped.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Train set</title>
<style>html,body{margin:0;overflow:hidden;background:#b9d3e6}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// A train runs round an oval. Click the points (the lever by the track) to set them for the siding:
// the next time the train reaches them it turns off and runs to the buffer at the end of the siding.
const R = 2.5, HALF = 4, SPEED = 2;                 // curve radius, half the straight, units per second
const MAIN = 4 * HALF + 2 * Math.PI * R;            // the oval's length
const POINTS_AT = 2;                                // the points, 2 units along the near straight
let s, track, points, stopped, laps;

function onMain(d) {   // position and heading on the oval, d units from its start at (-4, 2.5)
  d = ((d % MAIN) + MAIN) % MAIN;
  const arc = Math.PI * R, ends = [2 * HALF, 2 * HALF + arc, 4 * HALF + arc];
  if (d < ends[0]) return { x: -HALF + d, z: R, heading: 0 };
  if (d < ends[1]) { const a = Math.PI / 2 - (d - ends[0]) / R; return { x: HALF + R * Math.cos(a), z: R * Math.sin(a), heading: Math.PI / 2 - a }; }
  if (d < ends[2]) return { x: HALF - (d - ends[1]), z: -R, heading: Math.PI };
  const a = -Math.PI / 2 - (d - ends[2]) / R;
  return { x: -HALF + R * Math.cos(a), z: R * Math.sin(a), heading: Math.PI / 2 - a };
}
const siding = new THREE.CurvePath();
siding.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-HALF + POINTS_AT, 0, R), new THREE.Vector3(0, 0, R), new THREE.Vector3(2, 0, 3.8)));
siding.add(new THREE.LineCurve3(new THREE.Vector3(2, 0, 3.8), new THREE.Vector3(5, 0, 3.8)));
const SIDING = siding.getLength(), BUFFER = SIDING - 0.6;   // the train stops 0.6 short of the end
function onSiding(d) {
  const u = Math.min(d / SIDING, 1), p = siding.getPointAt(u), t = siding.getTangentAt(u);
  return { x: p.x, z: p.z, heading: Math.atan2(t.z, t.x) };
}

function start() { s = 0; track = 'main'; points = 'main'; stopped = false; laps = 0; }
function step(dt) {
  if (stopped) return;
  const before = s;
  s += SPEED * dt;
  if (track === 'main') {
    const lapBefore = Math.floor((before - POINTS_AT) / MAIN), lapAfter = Math.floor((s - POINTS_AT) / MAIN);
    if (lapAfter > lapBefore && points === 'siding') { track = 'siding'; s -= Math.floor(s / MAIN) * MAIN + POINTS_AT; }   // through the points onto the siding
    else if (Math.floor(s / MAIN) > Math.floor(before / MAIN)) laps++;
  }
  if (track === 'siding' && s >= BUFFER) { s = BUFFER; stopped = true; }
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb9d3e6);
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 9, 10.5);
camera.lookAt(0, 0, 0.8);
scene.add(new THREE.HemisphereLight(0xffffff, 0x556644, 1.8));
const sun = new THREE.DirectionalLight(0xfff0dd, 2);
sun.position.set(-5, 10, 6);
scene.add(sun);

const board = new THREE.Mesh(new THREE.BoxGeometry(17, 0.3, 11), new THREE.MeshStandardMaterial({ color: 0x5f8f4a, roughness: 0.95 }));
board.name = 'baseboard';
board.position.set(0, -0.15, 0.6);
scene.add(board);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x8a6e58, roughness: 1 }));
floor.name = 'floor';
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.2;
scene.add(floor);
scene.fog = new THREE.Fog(0xb9d3e6, 20, 45);

// Rails: two thin tubes either side of the centre line, and sleepers under them.
const steel = new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.2, roughness: 0.4 });
const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a30, roughness: 0.9 });
function lay(name, at, length, closed, from = 0.25, to = length) {
  const group = new THREE.Group();
  group.name = name;
  for (const side of [-0.16, 0.16]) {
    const pts = [];
    for (let d = 0; d <= length; d += 0.2) { const p = at(d); pts.push(new THREE.Vector3(p.x - Math.sin(p.heading) * side, 0.08, p.z + Math.cos(p.heading) * side)); }
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed), pts.length * 2, 0.035, 6, closed), steel));
  }
  for (let d = from; d < to; d += 0.5) {
    const p = at(d), sleeper = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.55), wood);
    sleeper.position.set(p.x, 0.035, p.z);
    sleeper.rotation.y = -p.heading;
    group.add(sleeper);
  }
  scene.add(group);
}
lay('main line', onMain, MAIN, true);
lay('siding', onSiding, SIDING, false, 2.75, SIDING - 0.4);   // no sleepers where it shares the main line's, or under the buffer
const end = onSiding(SIDING);
const buffer = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.7), new THREE.MeshStandardMaterial({ color: 0xc23a2a }));
buffer.name = 'buffer';
buffer.position.set(end.x, 0.205, end.z);
scene.add(buffer);

// The points lever: green for the main line, amber for the siding.
const lever = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.5), new THREE.MeshStandardMaterial({ color: 0x3aa04a }));
lever.name = 'points';
lever.position.set(-HALF + POINTS_AT, 0.18, R - 0.9);
scene.add(lever);

const train = new THREE.Group();
train.name = 'train';
const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.35, 0.42), new THREE.MeshStandardMaterial({ color: 0x1f3f8a }));
body.position.y = 0.3;
const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.7, 16), new THREE.MeshStandardMaterial({ color: 0x1f3f8a }));
boiler.rotation.z = Math.PI / 2;
boiler.position.set(0.2, 0.6, 0);
const cab = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.44), new THREE.MeshStandardMaterial({ color: 0xb02a2a }));
cab.position.set(-0.35, 0.65, 0);
train.add(body, boiler, cab);
scene.add(train);

function draw() {
  const p = track === 'main' ? onMain(s) : onSiding(s);
  train.position.set(p.x, 0, p.z);
  train.rotation.y = -p.heading;
  lever.material.color.set(points === 'main' ? 0x3aa04a : 0xe0a020);
  lever.rotation.y = points === 'main' ? 0 : Math.PI / 4;
}

const act = ({ key, down = true }) => {
  if (!down) return;
  if (key === 'p') points = points === 'main' ? 'siding' : 'main';
  if (key === 'r') start();
};
addEventListener('keydown', e => act({ key: e.key }));
const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
addEventListener('pointerdown', e => {
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  if (ray.intersectObject(lever).length) act({ key: 'p' });
});
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

start();
scene.updateMatrixWorld();
let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  draw();
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'train set', units: 'units along the track', keys: { p: 'switch the points', r: 'start again' } }),
  observe: () => ({ points, track, s: +s.toFixed(2), stopped, laps }),
  act,
  setState: st => { ({ points = points, track = track, s = s, stopped = stopped, laps = laps } = st); },
  subject: 'train',
};
</script>
</body></html>
```

Save it as `index.html` beside a `node_modules` folder with three in it (`npm install three`).

## What Playwright MCP returns from the canvas

These replies are from Playwright MCP 0.0.83 in headless Chrome, captured on 2026-11-12 with the page served at a local address. After `browser_navigate`, the agent asks for the page's snapshot, the accessibility tree its click and type tools act on:

```text
browser_snapshot {}

### Page
- Page URL: http://127.0.0.1:18765/index.html
- Page Title: Train set
- Console: 1 errors, 0 warnings
### Snapshot
```

The snapshot block came back empty: the train, the points and the track are pixels in the canvas, not elements with roles or names, so there is nothing in the tree to click by reference. The one console error was the browser's request for a `favicon.ico` the test server did not have. `browser_take_screenshot` returns the picture as an image, which a model can look at; clicking a spot in it takes Playwright MCP's coordinate tools, which its README lists under the optional vision capability. Playwright MCP is the tool for the page's HTML: forms, menus, links and text around the game. [Claude Code with Playwright MCP](/guides/claude-code-playwright-mcp) goes further into its snapshot on a canvas.

## What paprika3d returns from the same page

Replies from paprika3d's MCP server on this page, captured on 2026-11-12 on a Linux machine with no graphics card. Paths are shortened to `<project>` and `<run>`, and long replies are cut to the lines discussed, with nothing reworded.

**1. Open and look.** `open` loads the page in paprika3d's own headless Chrome and pauses it at frame 0; `look` returns the picture and each named object in it, with its share of the picture and its box in pixels:

```text
open {"url": "index.html", "cwd": "<project>"}

Opened http://127.0.0.1:43239/index.html in 0.1 s, paused at frame 0.
Page text outside the canvas: none

look {}

Picture: <project>/paprika3d/runs/<run>/look-1.png
On screen (83):
baseboard 74% [0, 141, 1279, 799] 17 × 11 units
floor 18% [0, 0, 1279, 245] 80 × 80 units
main line ×65 4.7% [55, 218, 1225, 531] 0.55–13.4 × 0.16–5.38 units
siding ×11 1.6% [443, 493, 1159, 638] 0.55–6.93 × 0.16–1.36 units
buffer 0.4% [1139, 559, 1209, 644]
train ×3 0.83% [176, 439, 310, 518]
points 0.27% [426, 411, 480, 465]
Never visible: none
```

The train, the points, the siding and the buffer each have a line, and the points' box gives the pixel to click.

**2. Run past the points.** With the points set for the main line, 120 frames (two seconds of game time at 1/60 s a frame) carry the train past them, and it stays on the main line:

```text
interact {"steps": [{"wait": 120}], "trace": ["s", "track"]}

{"changed":{"s":4.03}}
s: 0.03 → 4.03 at frame 120; first changed at frame 1
track: "main" throughout the 120 frames
```

**3. Click the points and run until the train stops.** The click lands in the middle of the points' box; the `until` step plays frames until `stopped` is true, up to 1200:

```text
interact {"steps": [{"mouse": "click", "x": 453, "y": 438}, {"until": {"stopped": true}, "max": 1200}], "look": true}

{"changed":{"points":"siding","track":"siding","s":6.67,"stopped":true,"laps":1}}
Motion (train): travelled 36.3 units (4.56 from start to end), its direction of travel turned 360° left.
until: stopped == true held at frame 1091
mouse click at (453, 438): over points (Mesh, 12.4 units)
Picture: <project>/paprika3d/runs/<run>/look-2.png
On screen (83):
train ×3 0.97% [1043, 539, 1189, 624]
buffer 0.19% [1156, 575, 1209, 644]
```

The reply names what the click hit, `points`. The train went once round the oval, took the siding at the points and stopped at the buffer on frame 1091; its box in the picture now sits beside the buffer's. Because the clock is paprika3d's, the same call stops on the same frame every time.

## What paprika3d does not do

- **It does not drive Kiro.** It runs no specs, hooks or steering of Kiro's own; it gives Kiro's agent tools to call.
- **It does not use Kiro's browser or yours.** It starts its own headless Chrome; the page you have open is not touched.
- **It does not replace Playwright MCP for HTML.** Forms, sign-in pages and menus outside the canvas are what a DOM tool is for.
- **Frame times here are not a GPU's.** With no graphics card Chrome draws in software, and `open` says so.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): keys on exact frames and the state after them, the same in any MCP client.
- [Screenshot a three.js scene headless](/guides/screenshot-threejs-scene-headless): the picture and the list of objects on screen.
- [A Playwright alternative for three.js](/guides/playwright-alternative-threejs-webgl): browser-test tasks and the paprika3d call for each.
- [Click a three.js object with a raycaster](/guides/threejs-click-on-object-raycaster): how the points' click finds the lever.
- [An MCP server that screenshots a WebGL canvas](/guides/mcp-server-screenshot-webgl-canvas): the picture in the tool result.
