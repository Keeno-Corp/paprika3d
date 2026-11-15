---
title: three.js not working in Firefox: run the same page in Firefox and Chrome and compare
phrase: three.js not working in firefox
description: What to do when a three.js page works in Chrome and not in Firefox. Run the same page in both engines and compare the errors, the GPU line, the picture and the objects on screen; on a small Rubik's cube a Chrome-only API breaks the mouse in Firefox, and a machine without a GPU shows how Firefox refuses a WebGL context. Uses the paprika3d MCP server's open with browser firefox, look and interact, and says what to check by hand in Safari.
meta: three.js not working in Firefox: run the page in Firefox and Chrome, compare errors, GPU line, picture and objects, and find what differs.
intent: threejs-not-working-in-firefox
queries:
  - "Webgl and three.js running great on chrome but HORRIBLE on firefox"
  - "Why are threejs apps not running in mozilla firefox"
  - "Three.js scene does not render in Safari 11.0.2"
  - "three js devtools firefox"
  - "webgl test firefox"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# three.js not working in Firefox: run the same page in Firefox and Chrome and compare

When a three.js page works in Chrome and not in Firefox, the cause is usually one of three: the page calls something Firefox does not have (an error Chrome never shows), Firefox will not create a WebGL context on that machine, or it runs on a slower renderer there. Running the same page and the same steps in both engines and reading the two replies side by side finds which. A coding agent can do that with paprika3d: in Claude Code, `claude plugin marketplace add Keeno-Corp/paprika3d && claude plugin install paprika3d@paprika3d` (any other MCP client: `npx -y paprika3d serve`), then `open` with `browser: "firefox"` runs the page in the Firefox installed on the machine, with every tool, and `open` without it runs Chrome.

## What differs between the engines

three.js supports both engines, and both have WebGL 2. What breaks in one is usually the page around it:

- **A browser API one engine lacks.** `navigator.userAgentData` is Chromium's; Firefox and Safari return `undefined`, and code that reads a property of it throws there.
- **WebGL refused.** Firefox keeps a list of graphics drivers it will not run WebGL on, and a machine with no usable GPU may get no context at all. three.js then logs "A WebGL context could not be created" and draws nothing.
- **A different renderer.** Each engine names its renderer in the GPU line. Software rendering in one and the GPU in the other is the usual reason one is slow ("running great on Chrome but horrible on Firefox").
- **Small differences in pixels.** Antialiasing and rounding differ between renderers, so the same scene is not the same pixels. That is not a bug.

## Install

paprika3d needs Google Chrome and Node 20.11 or later, and Firefox for `browser: "firefox"`: the one installed on the machine is used, or the one `PAPRIKA3D_FIREFOX` points at. The Claude Code plugin needs Claude Code 2.1.118 or later.

```bash
claude plugin marketplace add Keeno-Corp/paprika3d
claude plugin install paprika3d@paprika3d
npm install three
```

## The page: a Rubik's cube turned with the mouse

Press on a cubie and drag sideways to turn its layer a quarter turn. The drag threshold is longer for a finger than a mouse, and this first version asks Chrome's `navigator.userAgentData.mobile` which it is (line 50). Each cubie is named after its home place, so `look` lists them by name.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Cube</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block;touch-action:none}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202428);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
camera.position.set(5, 4.5, 7);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x404040, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(3, 6, 4);
scene.add(sun);

// 27 cubies; each outer face gets its side's colour, inner faces stay black.
const SIDES = [0xd03030, 0xff8c1a, 0xf4f4f4, 0xf2d21b, 0x2aa84a, 0x2a5bd7];   // +x -x +y -y +z -z
const black = new THREE.MeshStandardMaterial({ color: 0x111111 });
const cubies = [];
for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) {
  const faces = [x === 1, x === -1, y === 1, y === -1, z === 1, z === -1]
    .map((outer, i) => outer ? new THREE.MeshStandardMaterial({ color: SIDES[i], roughness: 0.4 }) : black);
  const c = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.94, 0.94), faces);
  c.name = `cubie ${x} ${y} ${z}`;
  c.position.set(x, y, z);
  c.userData.home = c.position.clone();
  scene.add(c); cubies.push(c);
}

// Drag sideways on a cubie to turn its horizontal layer a quarter turn.
const pivot = new THREE.Group();
scene.add(pivot);
const ray = new THREE.Raycaster();
let drag = null, turn = null, moves = 0;
renderer.domElement.addEventListener('pointerdown', (e) => {
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  const hit = ray.intersectObjects(cubies)[0];
  if (hit && !turn) drag = { x: e.clientX, layer: Math.round(hit.object.position.y) };
});
addEventListener('pointermove', (e) => {
  if (!drag) return;
  const threshold = navigator.userAgentData.mobile ? 30 : 10;   // a finger needs a longer drag than a mouse
  const dx = e.clientX - drag.x;
  if (Math.abs(dx) < threshold) return;
  turn = { layer: drag.layer, dir: Math.sign(dx), t: 0 };
  for (const c of cubies) if (Math.round(c.position.y) === turn.layer) pivot.attach(c);
  drag = null;
});
addEventListener('pointerup', () => { drag = null; });

function step(dt) {
  if (!turn) return;
  turn.t = Math.min(1, turn.t + dt / 0.25);
  pivot.rotation.y = turn.dir * turn.t * Math.PI / 2;
  if (turn.t < 1) return;
  for (const c of [...pivot.children]) {
    scene.attach(c);
    c.position.round();
    c.rotation.set(...['x', 'y', 'z'].map(k => Math.round(c.rotation[k] / (Math.PI / 2)) * Math.PI / 2));
  }
  pivot.rotation.y = 0; turn = null; moves++;
}
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

let last = null;
renderer.setAnimationLoop((now) => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));   // never more than 0.1 s a frame
  last = now;
  renderer.render(scene, camera);
});

const solved = () => cubies.every(c => c.position.distanceTo(c.userData.home) < 0.01 && c.quaternion.angleTo(new THREE.Quaternion()) < 0.01);
window.__game = {
  describe: () => ({ name: 'cube', units: 'one cubie is 1 unit', mouse: 'drag sideways on a cubie to turn its layer' }),
  observe: () => ({ moves, turning: !!turn, solved: solved() }),
};
</script>
</body></html>
```

Save it as `index.html`. The replies below are the ones the stable tools gave for this page on 2026-11-12 on a Linux machine with no GPU, with Chrome and Firefox 160, run folders shortened to `<project>`.

## Look at it in each engine

Chrome first. `open` runs the page and the GPU line names the renderer; `look` with `save` keeps the picture as a baseline named `chrome`:

```text
open {"url": "index.html", "cwd": "<project>"}

Opened http://127.0.0.1:37029/index.html in 0.1 s, paused at frame 0.
GPU: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). A software renderer (no GPU): frame times here say nothing of a real GPU's.
Page text outside the canvas: none
{"name":"cube","units":"one cubie is 1 unit","mouse":"drag sideways on a cubie to turn its layer"}
geo.js and fx.js are here, written on the first open and replaced only when the plugin's copy changes (each starts with the plugin version that wrote it): they are the plugin's, part of the project like node_modules: leave them in place.
Procedural geometry: import { geo, scatter } from "./geo.js" (see the skill's geometry reference).
Effects: import { stage, tex, field, place, instances, sfx, burst, shake, uv, picture, bake, trace, heightfield } from "./fx.js" (lights and camera, canvas textures, terrain, placement, sound, particles, a reference picture's camera and pixel maps, a subtree as GLB bytes, a picture's outlines and heights; seeded, no files).
picture({ position, lookAt?, fov?, size? }) returns { camera, at(px, py, depth), ground(px, py, y?), px(point), fit(width, height, cam?) }; bake(object, { animations? }) returns a Promise of GLB bytes (an ArrayBuffer, which eval { save } writes to a file); trace(src, { colour?, tolerance?, invert?, simplify?, minArea?, scale? }) returns a Promise of { shapes, mask, width, height }; heightfield(src, { size, height, base? }) returns a Promise of a Field like field()'s. Every option: references/fx.md in the threejs-game skill.
Next: `look` to see it, then `interact` for each interaction the request names.

Run folder: <project>/paprika3d/runs/2026-11-12T05-09-20-345Z

look {"save": "chrome"}

Saved as baseline chrome: <project>/paprika3d/baselines/chrome.png
Picture: <project>/paprika3d/runs/2026-11-12T05-09-20-345Z/look-1.png
Pixels: brightness 19%, colour saturation 30%, 1% near black, 0% blown out.
Hues: grey 87%, green 8% of the frame; over the objects (18.6% of it): green 45%, grey 29%, red 26%.
Depth: the nearest third of objects brightness 39%, colour 78%; the farthest third 48%, colour 45%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
On screen (19):
cubie 1 1 * ×2 3.9% [580, 238, 826, 468]
cubie 1 0 * ×2 2.4% [583, 374, 817, 584]
cubie 0 1 * ×2 2.2% [474, 216, 718, 427]
cubie 1 -1 * ×2 2.1% [586, 478, 808, 688]
cubie -1 1 * ×2 1.8% [382, 196, 621, 391]
cubie 0 0 1 1% [483, 397, 589, 539]
cubie 1 1 -1 0.94% [729, 208, 880, 366]
cubie 0 -1 1 0.87% [491, 504, 590, 639]
cubie -1 0 1 0.86% [395, 366, 489, 498]
cubie -1 -1 1 0.74% [406, 468, 497, 595]
cubie 1 0 -1 0.47% [810, 334, 869, 469]
cubie 1 -1 -1 0.41% [802, 432, 859, 563]
cubie 0 1 -1 0.39% [631, 189, 777, 240]
cubie -1 1 -1 0.34% [544, 172, 684, 217]
Never visible: cubie -1 -1 -1 (0.94 units, in view, behind cubie 1 1 1), cubie -1 -1 0 (0.94 units, in view, behind cubie 0 0 1), cubie -1 0 -1 (0.94 units, in view, behind cubie 1 1 1), cubie -1 0 0 (0.94 units, in view, behind cubie 0 1 1), cubie 0 -1 -1 (0.94 units, in view, behind cubie 1 1 1), cubie 0 -1 0 (0.94 units, in view, behind cubie 1 0 1), cubie 0 0 -1 (0.94 units, in view, behind cubie 1 1 1), cubie 0 0 0 (0.94 units, in view, behind cubie 1 1 1)
In view but no pixel: too small for the scene (check its size against the scene), hidden behind something, or not drawn.
```

The eight cubies under `Never visible` are the ones inside the cube or behind it, as they should be. Then Firefox: `open` with `browser: "firefox"` replaces the Chrome page, and `look` with `compare` pictures it against Chrome's baseline:

```text
open {"url": "index.html", "cwd": "<project>", "browser": "firefox"}

Opened in firefox 160.0: http://127.0.0.1:37029/index.html in 0.3 s, paused at frame 0.
GPU: llvmpipe (LLVM 20.1.2, 256 bits). A software renderer (no GPU): frame times here say nothing of a real GPU's.
Page text outside the canvas: none
describe(): unchanged since the last open
Next: `look` to see it, then `interact` for each interaction the request names.

Run folder: <project>/paprika3d/runs/2026-11-12T05-09-23-447Z

look {"compare": "chrome"}

Compare: chrome (saved 2026-11-12, frame 1, 1280x800@1). Baseline GPU: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). A software renderer (no GPU): frame times here say nothing of a real GPU's. Page GPU: llvmpipe (LLVM 20.1.2, 256 bits). A software renderer (no GPU): frame times here say nothing of a real GPU's. Pixels from another renderer do not compare; no pixel diff.
Picture: <project>/paprika3d/runs/2026-11-12T05-09-23-447Z/look-1.png
Pixels: brightness 19%, colour saturation 30%, 1% near black, 0% blown out.
Hues: grey 87%, green 8% of the frame; over the objects (18.6% of it): green 45%, grey 29%, red 26%.
Depth: the nearest third of objects brightness 39%, colour 78%; the farthest third 48%, colour 45%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
On screen (19):
cubie 1 1 * ×2 3.9% [580, 238, 827, 468]
cubie 1 0 * ×2 2.4% [583, 374, 817, 584]
cubie 0 1 * ×2 2.2% [474, 216, 718, 427]
cubie 1 -1 * ×2 2.1% [586, 478, 808, 688]
cubie -1 1 * ×2 1.8% [382, 196, 621, 391]
cubie 0 0 1 1% [483, 397, 589, 539]
cubie 1 1 -1 0.94% [729, 208, 880, 366]
cubie 0 -1 1 0.87% [491, 504, 590, 639]
cubie -1 0 1 0.86% [395, 366, 489, 499]
cubie -1 -1 1 0.74% [407, 469, 497, 595]
cubie 1 0 -1 0.47% [810, 334, 869, 469]
cubie 1 -1 -1 0.41% [802, 432, 859, 563]
cubie 0 1 -1 0.39% [632, 189, 777, 240]
cubie -1 1 -1 0.34% [544, 172, 684, 217]
Never visible: cubie -1 -1 -1 (0.94 units, in view, behind cubie 1 1 1), cubie -1 -1 0 (0.94 units, in view, behind cubie 0 0 1), cubie -1 0 -1 (0.94 units, in view, behind cubie 1 1 1), cubie -1 0 0 (0.94 units, in view, behind cubie 0 1 1), cubie 0 -1 -1 (0.94 units, in view, behind cubie 1 1 1), cubie 0 -1 0 (0.94 units, in view, behind cubie 1 0 1), cubie 0 0 -1 (0.94 units, in view, behind cubie 1 1 1), cubie 0 0 0 (0.94 units, in view, behind cubie 1 1 1)
In view but no pixel: too small for the scene (check its size against the scene), hidden behind something, or not drawn.
```

Read the two replies line by line. The renderers differ (SwiftShader in Chrome, Mesa's llvmpipe in Firefox, both software on this machine), so the tool gives no pixel diff between them: different rasterisers never match pixel for pixel. Everything else matches: the same objects with the same shares, the same hues and depth, and boxes that differ by at most a pixel on one edge (`826` against `827` for the top right cubies). The scene loads and draws the same in Firefox. Whatever is wrong is in what the page does next.

## Play the same steps in each

The same drag in both engines: press on the top front cubie, move right to x 640 in two moves, let go, and wait 20 frames for the turn. In Chrome:

```text
interact {"steps": [{"mouse": "down", "x": 560, "y": 300}, {"mouse": "move", "x": 600, "y": 300}, {"mouse": "move", "x": 640, "y": 300}, {"mouse": "up", "x": 640, "y": 300}, {"wait": 20}]}

{"changed":{"moves":1,"solved":false}}
mouse down at (560, 300): over cubie 0 1 1 (Mesh, 8 units)
mouse move at (640, 300): over cubie 1 1 1 (Mesh, 7.9 units)
```

In Firefox:

```text
interact {"steps": [{"mouse": "down", "x": 560, "y": 300}, {"mouse": "move", "x": 600, "y": 300}, {"mouse": "move", "x": 640, "y": 300}, {"mouse": "up", "x": 640, "y": 300}, {"wait": 20}]}

{"after":{"moves":0,"turning":false,"solved":true},"changed":{},"errors":["can't access property \"mobile\", navigator.userAgentData is undefined (index.html:50:21) (×2)"]}
mouse down at (560, 300): over cubie 0 1 1 (Mesh, 8 units)
mouse move at (640, 300): over cubie 1 1 1 (Mesh, 7.9 units)
```

The press landed on the same cubie in both. In Firefox nothing changed and each of the two moves threw at line 50, column 21: `navigator.userAgentData` is `undefined` there. A person in Firefox would see a cube that does not turn and, unless they opened the console, no reason. The fix asks the question in a way both engines answer, a media query on the pointer:

```js
  const threshold = matchMedia("(pointer: coarse)").matches ? 30 : 10;   // a finger needs a longer drag than a mouse
```

After the edit, the same steps in Firefox, with `look: true`:

```text
interact {"steps": [{"mouse": "down", "x": 560, "y": 300}, {"mouse": "move", "x": 600, "y": 300}, {"mouse": "move", "x": 640, "y": 300}, {"mouse": "up", "x": 640, "y": 300}, {"wait": 20}], "look": true}

{"changed":{"moves":1,"solved":false}}
mouse down at (560, 300): over cubie 0 1 1 (Mesh, 8 units)
mouse move at (640, 300): over cubie 1 1 1 (Mesh, 7.9 units)
Picture: <project>/paprika3d/runs/2026-11-12T05-09-26-678Z/look-2.png
Pixels: brightness 20%, colour saturation 29%, 1% near black, 0% blown out; 6% of the picture changed since the last look.
Hues: grey 87%, green 7% of the frame; over the objects (18.6% of it): green 38%, grey 29%, orange 18%, red 16%.
Depth: the nearest third of objects brightness 44%, colour 76%; the farthest third 48%, colour 45%.
On screen (19):
cubie -1 1 * ×2 4.5% [474, 248, 763, 468]
cubie 1 0 * ×2 2.4% [583, 374, 817, 584]
cubie 1 -1 * ×2 2.1% [586, 478, 808, 688]
cubie -1 1 -1 1.4% [382, 225, 548, 391]
cubie 0 1 * ×2 1.7% [559, 216, 827, 412]
cubie 0 0 1 1% [483, 397, 589, 539]
cubie 1 1 * ×2 1.3% [632, 189, 880, 366]
cubie 0 -1 1 0.87% [491, 504, 590, 639]
cubie -1 0 1 0.86% [395, 366, 489, 499]
cubie -1 -1 1 0.74% [407, 469, 497, 595]
cubie 1 0 -1 0.47% [810, 334, 869, 469]
cubie 0 1 -1 0.42% [469, 196, 621, 249]
cubie 1 -1 -1 0.41% [802, 432, 859, 563]
cubie 1 1 -1 0.34% [544, 172, 684, 217]
Never visible: cubie -1 -1 -1 (0.94 units, in view, behind cubie -1 1 1), cubie -1 -1 0 (0.94 units, in view, behind cubie 0 0 1), cubie -1 0 -1 (0.94 units, in view, behind cubie -1 1 1), cubie -1 0 0 (0.94 units, in view, behind cubie -1 1 0), cubie 0 -1 -1 (0.94 units, in view, behind cubie -1 1 1), cubie 0 -1 0 (0.94 units, in view, behind cubie 1 0 1), cubie 0 0 -1 (0.94 units, in view, behind cubie -1 1 1), cubie 0 0 0 (0.94 units, in view, behind cubie -1 1 1)
In view but no pixel: too small for the scene (check its size against the scene), hidden behind something, or not drawn.
```

One move, and the top layer's cubies are in new places: `cubie -1 1 *`, home at the left, is now at the front. Orange shows on the front, as the top layer's left face has come round.

A drag is sent after a `look` here for a reason: until a frame is drawn, three.js has not computed the meshes' world matrices, so a raycast on the very first frame misses everything. A person cannot click that early; a test can.

## When Firefox will not create a WebGL context

The same page, opened in Firefox on this machine before WebGL was allowed there:

```text
open {"url": "index.html", "cwd": "<project>", "browser": "firefox"}

game not ready after 10 s: no window.__game, three.js renderer or WebGL canvas on http://127.0.0.1:35365/index.html
THREE.WebGLRenderer: A WebGL context could not be created. Reason:  WebGL creation failed: 
* AllowWebgl2:false restricts context creation on this system. ()
THREE.WebGLRenderer: A WebGL context could not be created. Reason:  WebGL creation failed: 
* AllowWebgl2:false restricts context creation on this system. ()
THREE.WebGLRenderer: THREE.WebGLRenderer: Error creating WebGL context.
THREE.WebGLRenderer: Error creating WebGL context. (index.html:10:18)
```

This is Firefox's own refusal: its blocklist decided this system should not run WebGL. On a person's computer the same message comes from a blocked driver; Firefox's `about:support` page, under Graphics, says whether WebGL 1 and 2 are blocked and why, and a newer graphics driver is the usual fix. On a headless Linux machine with no GPU and no display, like this one, Firefox ran WebGL in software (Mesa's llvmpipe) after two changes: a file in its `defaults/pref` folder, and two variables in the environment the MCP server starts in.

```bash
printf 'pref("webgl.force-enabled", true);\n' > /path/to/firefox/defaults/pref/webgl.js
export PAPRIKA3D_FIREFOX=/path/to/firefox/firefox MOZ_WEBGL_FORCE_EGL=1 EGL_PLATFORM=surfaceless
```

These are for a test machine. Forcing WebGL past the blocklist on a desktop turns off a protection against drivers known to crash.

## When it runs, but slowly

Read the GPU line in each engine's `open` reply before anything else. A line that names a software renderer (SwiftShader, llvmpipe, "Microsoft Basic Render Driver") in one engine and a GPU in the other explains a slow page with no code at fault: that engine is drawing on the CPU. Firefox's `about:support` gives the reason it is not using the GPU. On a machine with a GPU in both engines, `perf` measures frame time, draw calls and triangles in each; on this machine both are software, so frame times say nothing about either engine on real hardware.

## Safari

paprika3d has no Safari or WebKit engine, so Safari is checked by hand, on a Mac or an iPhone, with the Web Inspector (Safari's Develop menu) open on the Console. Three things to check first, since they are the usual Safari-only failures of a three.js page:

- **Chrome-only APIs.** `navigator.userAgentData` is missing in Safari as well, so the fix above covers it too.
- **Import maps.** A page that loads three through an import map, as this one does, needs Safari 16.4 or later.
- **WebGL 2.** three.js needs WebGL 2, which Safari has from Safari 15.

## What paprika3d does not do

- It has no Safari engine, and no other browser than Chrome and the Firefox installed on the machine (on Windows, Edge stands in when Chrome is missing).
- `network` (in `open` and `perf`), `perf`'s throttle and its main-thread time work in Chrome and not in Firefox, and the reply says so there.
- It does not reproduce another person's machine: their GPU, driver and blocklist entry. The GPU line says what this machine has.
- It does not compare pixels across two renderers. It compares the lists, which do not depend on the rasteriser.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): the open, look, interact loop these steps use.
- [Screenshot a three.js scene headless from a coding agent](/guides/screenshot-threejs-scene-headless): how to read a `look` reply.
- [Run three.js in headless Chrome without a GPU](/guides/run-threejs-headless-chrome-without-gpu): the GPU line and software rendering.
- [Visual regression test a three.js scene](/guides/visual-regression-test-threejs): `look` `save` and `compare` within one engine.
- [three.js WebGPU or WebGL backend](/guides/threejs-webgpu-or-webgl-backend): which backend a browser gets.
