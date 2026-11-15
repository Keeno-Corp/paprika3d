---
title: pi coding agent browser tools for a three.js game, through MCP or the skills
phrase: pi coding agent browser
description: How to give the pi coding agent browser tools for a three.js game: paprika3d added with pi mcp add (or by hand in ~/.pi/agent/mcp.json or .pi/mcp.json), the skills with npx skills add -a pi, and what open, look and interact return on a small three.js sand garden raked with the mouse, where the rake's lines stay in the sand and lift over the stones.
meta: The pi coding agent's browser tools for a three.js game: paprika3d through pi's MCP settings, plus skills, on a raked sand garden.
intent: pi-coding-agent-browser
queries:
  - "pi coding agent browser"
  - "pi coding agent playwright mcp"
  - "pi coding agent screenshot"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# pi coding agent browser tools for a three.js game, through MCP or the skills

pi has no browser tool built in, but it connects MCP servers, so it gets one from any server that has one. For a three.js game, `pi mcp add paprika -- npx -y paprika3d serve` gives pi paprika3d's tools: `open` loads the page in a headless Chrome, `look` returns a screenshot with the named objects on screen, and `interact` plays it with keys, clicks and drags on exact frames. `npx skills add Keeno-Corp/paprika3d -a pi` adds the skills that tell pi when to call each one.

## Add paprika3d to pi

pi's changelog lists MCP support from version 0.99.0, as a built-in extension. Its MCP documentation ([pi.dev/docs/latest/mcp](https://pi.dev/docs/latest/mcp)) reads servers from two files: `~/.pi/agent/mcp.json` for the user, and `.pi/mcp.json` in a project, which pi reads once the project is trusted. `pi mcp add` writes the user file; add `-l` (or `--local`) to write the project's:

```bash
pi mcp add paprika -- npx -y paprika3d serve
pi mcp list
```

The same entry by hand, in either file:

```json
{
  "mcpServers": {
    "paprika": {
      "command": "npx",
      "args": ["-y", "paprika3d", "serve"],
      "timeout": 180
    }
  }
}
```

`timeout` is pi's per-request limit in seconds, 60 by default; the first `open` starts Chrome, which can take longer on a busy machine, hence the larger value. paprika3d needs Google Chrome and Node 20.11 or later.

Inside a session, `/mcp` shows each server's connection and lets you reconnect it or turn it off; after editing the file outside the session, `/reload` picks the change up. pi names a server's tools `mcp__<server>__<tool>`, so paprika3d's appear as `mcp__paprika__open`, `mcp__paprika__look` and so on. pi does not ask before each tool call; its docs say permission extensions can add a confirmation step.

## The skills, and a standing instruction

pi loads Agent Skills from `.agents/skills/` in the project (and `~/.agents/skills/` for the user), as well as its own `.pi/skills/`. The skills installer writes to that folder for pi:

```bash
npx skills add Keeno-Corp/paprika3d -a pi
```

They tell the agent what each tool shows and how to read its replies. pi also reads `AGENTS.md` from the project folder and the folders above it, so one line there makes the check part of every change: "After changing the game, use the paprika tools to open it, look at it and play the part that changed."

pi's author also publishes skills for pi in [badlogic/pi-skills](https://github.com/badlogic/pi-skills), among them `browser-tools`, which drives Chrome over the DevTools Protocol for pages in general. paprika3d is for the three.js page: it reads the scene inside the canvas and runs it on a clock it controls.

This page did not run pi itself. The replies below come from paprika3d's MCP server called directly with the calls an agent makes, which is what pi receives under the names above; pi's commands and files are as its documentation and changelog give them on 2026-11-12.

## A sand garden

Drag the mouse across the sand to rake it. The rake's three tines leave lines that stay, and where a stone is in the way the rake rides over it and leaves no line. The sand is a canvas texture, so the lines are real pixels in the picture, and `window.__game` counts the strokes, the length raked and the length lifted over stones.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Sand garden</title>
<style>html,body{margin:0;overflow:hidden;background:#2b2f2a}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// Drag the mouse across the sand to rake it: the rake's three tines leave lines that stay in the sand.
// The rake lifts over the stones, so no line crosses one. C smooths the sand again.
const W = 10, D = 6, PX = 100;                       // the sand is 10 by 6 units, painted at 100 pixels a unit
const TINES = [-0.2, 0, 0.2];                        // tine offsets across the stroke, in units
const STONES = [
  { name: 'tall stone', x: -2.5, z: -0.6, r: 0.55, h: 1.1 },
  { name: 'flat stone', x: 1.2, z: 0.2, r: 0.7, h: 0.35 },
  { name: 'round stone', x: 3.2, z: -1.4, r: 0.45, h: 0.6 },
];
let strokes = 0, raked = 0, lifted = 0, down = false, last = null;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2b2f2a);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 7.5, 5);
camera.lookAt(0, 0, 0.3);
scene.add(new THREE.HemisphereLight(0xfff8ee, 0x404838, 1.4));
const sun = new THREE.DirectionalLight(0xfff0dd, 2.2);
sun.position.set(-4, 8, 3);
scene.add(sun);

// The sand is a canvas texture: raking paints grooves into it, and they stay until it is smoothed.
const paint = document.createElement('canvas');
paint.width = W * PX; paint.height = D * PX;
const g = paint.getContext('2d');
const texture = new THREE.CanvasTexture(paint);
texture.colorSpace = THREE.SRGBColorSpace;
function smooth() {
  g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, paint.width, paint.height);
  for (let i = 0; i < 6000; i++) {   // grains
    g.fillStyle = Math.random() < 0.5 ? '#d8caa8' : '#f4ecd8';
    g.fillRect(Math.random() * paint.width, Math.random() * paint.height, 2, 2);
  }
  texture.needsUpdate = true;
}
const sand = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: texture, roughness: 1 }));
sand.name = 'sand';
sand.rotation.x = -Math.PI / 2;
scene.add(sand);
const frame = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, 0.3, D + 0.6), new THREE.MeshStandardMaterial({ color: 0x5a3f2a, roughness: 0.8 }));
frame.name = 'frame';
frame.position.y = -0.16;
scene.add(frame);
for (const s of STONES) {
  const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0x6d6a64, roughness: 0.9, flatShading: true }));
  stone.name = s.name;
  stone.scale.set(s.r, s.h, s.r * 0.85);
  stone.position.set(s.x, s.h * 0.45, s.z);
  scene.add(stone);
}
const rake = new THREE.Group();
rake.name = 'rake';
const head = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.5), new THREE.MeshStandardMaterial({ color: 0x8a6440 }));
head.position.y = 0.15;
const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0xa47c50 }));
handle.position.set(0.55, 0.75, 0);
handle.rotation.z = Math.PI / 3.2;
rake.add(head, handle);
scene.add(rake);

const stoneAt = (x, z) => STONES.find(s => Math.hypot(x - s.x, z - s.z) < s.r + 0.2);
function groove(a, b) {   // one stroke segment: three lines, each a dark groove with a light ridge beside it
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  if (len === 0) return;
  const nx = -(b.z - a.z) / len, nz = (b.x - a.x) / len;   // across the stroke
  const toPx = (x, z) => [(x + W / 2) * PX, (z + D / 2) * PX];
  for (const t of TINES) for (const [colour, shift, width] of [['#b8a47c', 0, 6], ['#fbf5e8', 0.05, 3]]) {
    g.strokeStyle = colour; g.lineWidth = width; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(...toPx(a.x + nx * (t + shift), a.z + nz * (t + shift)));
    g.lineTo(...toPx(b.x + nx * (t + shift), b.z + nz * (t + shift)));
    g.stroke();
  }
  texture.needsUpdate = true;
}

const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
function onSand(e) {
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  const hit = ray.intersectObject(sand)[0];
  return hit && { x: hit.point.x, z: hit.point.z };
}
function rakeTo(p) {
  const stone = stoneAt(p.x, p.z);
  rake.position.set(p.x, stone ? stone.h * 0.9 : 0, p.z);   // over a stone, the rake rides on top of it
  if (!down) return;
  if (last) {   // walk the move in short steps, so the lines stop where a stone begins
    const n = Math.ceil(Math.hypot(p.x - last.x, p.z - last.z) / 0.05);
    for (let i = 0; i < n; i++) {
      const a = { x: last.x + (p.x - last.x) * i / n, z: last.z + (p.z - last.z) * i / n };
      const b = { x: last.x + (p.x - last.x) * (i + 1) / n, z: last.z + (p.z - last.z) * (i + 1) / n };
      const length = Math.hypot(b.x - a.x, b.z - a.z);
      if (stoneAt(a.x, a.z) || stoneAt(b.x, b.z)) lifted += length;
      else { groove(a, b); raked += length; }
    }
  }
  last = p;
}
addEventListener('pointerdown', e => { const p = onSand(e); if (!p) return; down = true; last = null; strokes++; rakeTo(p); });
addEventListener('pointermove', e => { const p = onSand(e); if (p) rakeTo(p); });
addEventListener('pointerup', () => { down = false; last = null; });
const act = ({ key, down: pressed = true }) => { if (key === 'c' && pressed) { smooth(); strokes = 0; raked = 0; lifted = 0; } };
addEventListener('keydown', e => act({ key: e.key }));
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

smooth();
scene.updateMatrixWorld();
renderer.setAnimationLoop(() => renderer.render(scene, camera));

const r2 = n => Math.round(n * 100) / 100;
window.__game = {
  describe: () => ({ name: 'sand garden', units: 'units of sand', keys: { c: 'smooth the sand' } }),
  observe: () => ({ strokes, raked: r2(raked), lifted: r2(lifted), raking: down, rake: { x: r2(rake.position.x), z: r2(rake.position.z) } }),
  act,
  setState: () => {},
  subject: 'rake',
};
</script>
</body></html>
```

Save it as `index.html` beside a `node_modules` folder with three in it (`npm install three`).

## The calls, and what came back

Replies from paprika3d's MCP server on this page, captured on 2026-11-12 on a Linux machine with no graphics card, where Chrome draws WebGL in software. Paths are shortened to `<project>` and `<run>`, and long replies are cut to the lines discussed, with nothing reworded.

**1. Open and look.** The stones, the sand, the frame and the rake each have a line with their share of the picture and their box in pixels:

```text
open {"url": "index.html", "cwd": "<project>"}

Opened http://127.0.0.1:36963/index.html in 0.1 s, paused at frame 0.
Page text outside the canvas: none
{"name":"sand garden","units":"units of sand","keys":{"c":"smooth the sand"}}

look {}

Picture: <project>/paprika3d/runs/<run>/look-1.png
On screen (7):
sand 56% [0, 145, 1279, 697] 10 × 6 units
frame 11% [0, 127, 1279, 747] 10.6 × 6.6 units
tall stone 1.5% [302, 198, 432, 354]
flat stone 1.3% [695, 324, 848, 440]
round stone 0.69% [916, 189, 1014, 282]
rake ×2 0.16% [624, 289, 756, 389] 0.5–1.6 × 0.06–0.12 units
Never visible: none
```

**2. Rake one stroke.** A drag is a mouse `down`, a row of `move` steps and an `up`, one frame each. This one runs across the garden at the height of the round stone's box (y 260), and `look: true` adds the picture after it:

```text
interact {"steps": [{"mouse": "down", "x": 200, "y": 260}, {"mouse": "move", "x": 320, "y": 260}, {"mouse": "move", "x": 440, "y": 260}, {"mouse": "move", "x": 560, "y": 260}, {"mouse": "move", "x": 680, "y": 260}, {"mouse": "move", "x": 800, "y": 260}, {"mouse": "move", "x": 920, "y": 260}, {"mouse": "move", "x": 1040, "y": 260}, {"mouse": "move", "x": 1120, "y": 260}, {"mouse": "up", "x": 1120, "y": 260}], "look": true}

{"changed":{"strokes":1,"raked":7.92,"lifted":1.35,"rake":{"x":4.84,"z":-1.37}}}
mouse down at (200, 260): over sand (Mesh, 10.8 units)
mouse move at (320, 260): over tall stone (Mesh, 8.7 units)
Picture: <project>/paprika3d/runs/<run>/look-2.png
Pixels: brightness 55%, colour saturation 19%, 0% near black, 0% blown out; 1% of the picture changed since the last look.
```

One stroke, 7.92 units of sand raked and 1.35 lifted. The lifted part is the round stone: in the picture the three lines stop at its edge and start again past it. The second move was over the tall stone on screen, and the reply says so, but the sand under that pixel lies behind the stone, so the lines run on behind it there and nothing was lifted for it.

**3. Check the lines stay.** Sixty more frames with no input, then `look` with `sample` reads the colour at two points: one on the stroke's middle line, one on sand the rake never touched.

```text
interact {"steps": [{"wait": 60}]}

{"after":{"strokes":1,"raked":7.92,"lifted":1.35,"raking":false,"rake":{"x":4.84,"z":-1.37}},"changed":{}}

look {"sample": [[620, 260], [620, 600]]}

Picture: <project>/paprika3d/runs/<run>/look-3.png
Pixels, Hues, Stands out: as the last look; 0% of the picture changed since it.
Colours (5 × 5 mean, in the page's pixels): (620, 260) #c9b68f, (620, 600) #dcd3bf.
```

Nothing changed in the picture, and the groove reads darker than the smooth sand beside it. That is the check for "the lines stay": a game that redrew the sand each frame, or cleared the texture on mouse up, would read as the plain sand colour at the first point.

## What paprika3d does not do

- **It is not pi's browser for every page.** It is made for three.js, React Three Fiber and WebGL pages; a sign-in form or a docs site needs a browser tool for the DOM.
- **It does not use a browser you have open.** It runs its own headless Chrome, so a page that needs your logged-in session is out of reach.
- **It does not change pi.** It adds tools pi can call; whether a call needs confirmation is up to pi and its extensions.
- **Frame times here are not a GPU's.** With no graphics card Chrome draws in software, and `open` says so.
- **It does not judge the garden.** It reports what was raked and what the picture shows; whether the pattern is calm is yours to say.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): keys on exact frames and the state after them, the same calls in any MCP client.
- [Screenshot a three.js scene headless](/guides/screenshot-threejs-scene-headless): the picture and the named objects on screen.
- [How to make a game with Codex](/guides/make-a-game-with-codex): the same server added to another terminal agent.
- [three.js click on object with a Raycaster](/guides/threejs-click-on-object-raycaster): how the rake finds the sand under the pointer.
- [Text in three.js: TextGeometry, a canvas sprite or HTML](/guides/text-in-threejs): canvas textures, which the sand uses too.
