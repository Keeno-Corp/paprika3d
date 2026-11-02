---
title: How to make a 3d game look pixelated in three.js: low resolution and a small palette
phrase: how to make a 3d game look pixelated
description: How to make a 3D game look pixelated or retro in the browser with three.js, for a first game: draw the scene at a quarter of the screen's resolution and enlarge it without blur (setPixelRatio and image-rendering pixelated), keep a few flat colours with light in hard steps (MeshToonMaterial and a three-step gradient map), and add one-pixel outlines from EdgesGeometry; a small robot vacuum game to paste, the prompt to give an AI agent, and paprika3d zooming into the pixels, comparing the room with a full-resolution picture and counting the colours.
meta: How to make a 3d game look pixelated in three.js: draw at a quarter resolution, enlarge without blur, few colours, hard light steps, outlines.
intent: make-a-3d-game-look-pixelated
queries:
  - "how to make a 3d game look pixelated"
  - "how to make a pixel game"
  - "how to make a retro game"
  - "threejs pixel game"
  - "Pixel-perfect rendering to a rendertarget with a fullscreen quad"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a 3d game look pixelated in three.js: low resolution and a small palette

A 3D game looks like pixel art when three things are true of every frame. It is drawn small, at a fraction of the screen's resolution, and enlarged so each of its pixels becomes a crisp square block. It uses a few flat colours, with light falling in two or three hard steps instead of a smooth gradient. And its objects have dark outlines one pixel wide. None of the three needs special art: the models stay plain boxes and shapes, and a few lines of setup make the look. This page builds all three into a small game, a robot vacuum cleaning a room.

A few words first. **three.js** is a JavaScript library that draws 3D scenes in a web page. The **renderer** is the part of three.js that draws the scene into a **canvas** (the rectangle on the page where the game appears). **Resolution** is how many pixels the picture has across and down. A **material** decides how a surface looks: its colour and how it reacts to light. **CSS** is the styling language of web pages; one CSS line matters here.

## 1. Draw small, enlarge without blur

The renderer has a **pixel ratio**: how many drawing pixels it uses for each pixel of the page's layout. Set it to a quarter, and a canvas that fills a 1280 by 800 window is drawn as a 320 by 200 picture, then stretched to fill the window:

```js
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(1 / 4);           // one game pixel is 4 by 4 screen pixels
renderer.setSize(innerWidth, innerHeight);
```

On its own, the stretched picture is blurry, because the browser smooths images it enlarges. One line of CSS tells it to enlarge by copying each pixel into a square block instead:

```css
canvas { image-rendering: pixelated; }
```

`antialias: false` matters too: antialiasing softens edges with in-between colours, which is the opposite of the look. Pick the pixel size by eye: 1/3 keeps small objects readable, 1/6 is very chunky.

The question people search for, "Pixel-perfect rendering to a rendertarget with a fullscreen quad", is the longer way to the same picture: draw the scene into a small off-screen image (a **render target**) with `THREE.NearestFilter`, then draw that image over the whole screen. It is worth the extra code when the small picture needs effects of its own before it is enlarged. To keep the same number of game pixels on every window, use `renderer.setPixelRatio(320 / innerWidth)` (and set it again when the window changes size), and the picture is always 320 pixels wide.

## 2. A few colours, light in steps

A pixel-art look has a short list of colours. In code, that means a small `PALETTE` of flat colours, no photo textures, and light that does not fade smoothly across a surface. `MeshToonMaterial` does the last part: it reads the brightness of the light from a tiny image, a **gradient map**, and with three pixels in that image every surface gets exactly three shades, shadow, middle and lit:

```js
const steps = new THREE.DataTexture(new Uint8Array([80, 160, 255]), 3, 1, THREE.RedFormat);
steps.needsUpdate = true;
const paint = color => new THREE.MeshToonMaterial({ color: PALETTE[color], gradientMap: steps });
```

Pair it with plain lights (an `AmbientLight` and one `DirectionalLight`): a light whose brightness changes smoothly over the scene, such as a `HemisphereLight`, brings the gradients back.

## 3. Outlines one pixel wide

`EdgesGeometry` finds the hard edges of a shape (where two faces meet at more than a given angle, here 30 degrees) and `LineSegments` draws them as lines. A WebGL line is one drawing pixel wide, and at a quarter resolution one drawing pixel is one game pixel, so every object gets the dark one-pixel border of pixel art for free. The angle keeps a round shape, such as the robot, from getting a line on every flat face of its curve.

## The game: pixel vacuum

Drive the robot with the arrow keys and pick up the dust; the furniture and walls stop it. Save the file as `index.html`, run `npm install three` in its folder (this needs Node.js, a free program that installs JavaScript libraries), serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. Add `?smooth` to the address to see the same room at full resolution. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Pixel vacuum</title>
<style>html,body{margin:0;overflow:hidden;background:#2a2238}
canvas{display:block;image-rendering:pixelated}
#hud{position:fixed;top:14px;left:18px;color:#f4e8c8;font:700 22px monospace;text-shadow:2px 2px 0 #1a1020}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// 1. Draw at low resolution: one game pixel is 4 by 4 screen pixels, and the CSS above
//    (image-rendering: pixelated) enlarges the small picture without blurring it.
const PIXEL = 4;
const smooth = new URLSearchParams(location.search).has('smooth');   // ?smooth draws the same room at full resolution
const renderer = new THREE.WebGLRenderer({ antialias: smooth });
renderer.setPixelRatio(smooth ? devicePixelRatio : 1 / PIXEL);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.NeutralToneMapping;
document.body.appendChild(renderer.domElement);

// 2. A small palette: a few flat colours, and light in three hard steps instead of a smooth gradient.
const PALETTE = { floor: 0xd8b078, wall: 0x7894b8, rug: 0xb84858, sofa: 0x4f7a58, wood: 0x8a5a3a, pot: 0xc86a40,
  leaves: 0x3f8a4a, robot: 0xe8e4dc, dust: 0x4a3a30, outline: 0x1a1020, back: 0x2a2238 };
const steps = new THREE.DataTexture(new Uint8Array([80, 160, 255]), 3, 1, THREE.RedFormat);
steps.needsUpdate = true;
const paint = color => new THREE.MeshToonMaterial({ color: PALETTE[color], gradientMap: steps });

// 3. Outlines: the hard edges of every object drawn as dark lines, one game pixel wide.
const outline = new THREE.LineBasicMaterial({ color: PALETTE.outline });
function add(name, geometry, color, x, y, z) {
  const mesh = new THREE.Mesh(geometry, paint(color));
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 30), outline));
  scene.add(mesh);
  return mesh;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.back);
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
camera.position.set(8, 11.5, 13);
camera.lookAt(0, 0.4, 0);
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(3, 6, 2);
scene.add(sun);

// The room: a floor, two walls, and furniture the robot drives around.
add('floor', new THREE.BoxGeometry(10, 0.2, 8), 'floor', 0, -0.1, 0);
add('wall', new THREE.BoxGeometry(10, 3, 0.2), 'wall', 0, 1.5, -4.1);
add('wall', new THREE.BoxGeometry(0.2, 3, 8), 'wall', -5.1, 1.5, 0);
add('rug', new THREE.BoxGeometry(3.6, 0.04, 2.4), 'rug', 1, 0.02, 1);
const FURNITURE = [   // name, size [x, y, z], centre [x, z], colour
  ['sofa', [3.4, 0.8, 1.2], [-2.6, -3.3], 'sofa'],
  ['sofa arm', [0.4, 1.1, 1.2], [-4.5, -3.3], 'sofa'],
  ['table', [1.6, 0.7, 1], [2.8, -2.6], 'wood'],
  ['plant pot', [0.8, 0.7, 0.8], [-4.4, 3.4], 'pot'],
];
for (const [name, [w, h, d], [x, z], color] of FURNITURE) add(name, new THREE.BoxGeometry(w, h, d), color, x, h / 2, z);
add('leaves', new THREE.IcosahedronGeometry(0.7, 0), 'leaves', -4.4, 1.3, 3.4);

const robot = add('robot', new THREE.CylinderGeometry(0.45, 0.45, 0.18, 20), 'robot', 0, 0.1, 2.5);
robot.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.12), paint('outline')).translateY(0.11).translateZ(-0.25));

// Dust on the open floor, from a fixed list of spots so every load is the same.
const dust = [];
for (let i = 0; i < 20; i++) {
  const x = -4 + ((i * 37) % 85) / 10, z = -1.5 + ((i * 53) % 50) / 10;
  dust.push(add('dust', new THREE.BoxGeometry(0.2, 0.04, 0.2), 'dust', x, 0.07, z));   // above the rug's top
}

// Arrow keys drive the robot; it stops at the walls and the furniture, and picks up dust it passes over.
const held = new Set();
function act({ key, down = true }) { if (down) held.add(key); else held.delete(key); }
addEventListener('keydown', e => act({ key: e.key }));
addEventListener('keyup', e => act({ key: e.key, down: false }));
const blocked = (x, z) => Math.abs(x) > 4.5 || Math.abs(z) > 3.5 ||
  FURNITURE.some(([, [w, , d], [fx, fz]]) => Math.abs(x - fx) < w / 2 + 0.45 && Math.abs(z - fz) < d / 2 + 0.45);
const hud = document.getElementById('hud');

function update(dt) {
  const dx = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
  const dz = (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0);
  if (dx || dz) robot.rotation.y = Math.atan2(-dx, -dz);
  if (!blocked(robot.position.x + dx * 3 * dt, robot.position.z)) robot.position.x += dx * 3 * dt;   // 3 units a second
  if (!blocked(robot.position.x, robot.position.z + dz * 3 * dt)) robot.position.z += dz * 3 * dt;
  for (const d of dust) if (d.visible && Math.hypot(d.position.x - robot.position.x, d.position.z - robot.position.z) < 0.45) d.visible = false;
  hud.textContent = `DUST ${dust.filter(d => d.visible).length}`;
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
let last = null;
renderer.setAnimationLoop(now => {
  update(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'pixel vacuum', units: 'metres', keys: { ArrowRight: 'drive right', ArrowLeft: 'drive left', ArrowUp: 'drive up', ArrowDown: 'drive down' } }),
  observe: () => ({ robot: { x: +robot.position.x.toFixed(2), z: +robot.position.z.toFixed(2) }, dust: dust.filter(d => d.visible).length }),
  act,
  setState: s => { if (s.robot) robot.position.set(s.robot.x, 0.1, s.robot.z); },
  subject: robot,
};
</script>
</body></html>
```

The three numbered comments are the three parts above; the rest is an ordinary small game. The score is HTML over the canvas, so it stays sharp at any pixel size, in a monospace font with a hard shadow to match. `window.__game` at the end lets a test tool read where the robot is and how much dust is left; the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code, Cursor or Codex that writes and edits the files of your project) can give an existing three.js game this look, or start a new one with it:

```text
Give my three.js game a pixel-art look without changing how it plays:
- draw at a quarter resolution: renderer.setPixelRatio(1 / 4), antialias off,
  and canvas { image-rendering: pixelated } in the CSS;
- a palette of about 10 flat colours, no textures, MeshToonMaterial with a
  3-step gradient map (a 3-pixel DataTexture), an AmbientLight and one
  DirectionalLight only;
- dark outlines from EdgesGeometry (threshold 30) with LineSegments on every mesh;
- keep the score and menus as HTML so text stays sharp.
Then check that the picture is 320 x 200 on a 1280 x 800 window.
```

## When the pixel look goes wrong

- **The picture is blurry, not blocky.** The CSS line is missing, or something else sets `image-rendering` on the canvas. Add `image-rendering: pixelated`.
- **Edges have soft in-between colours.** Antialiasing is on. Create the renderer with `antialias: false`.
- **Surfaces show smooth gradients.** A `MeshStandardMaterial` or a `HemisphereLight` is still in the scene, or a texture is smooth. Use the toon material with the stepped gradient map, and flat colours.
- **Outlines run across every face of a round object.** The edge angle is too small. Raise the second argument of `EdgesGeometry`.
- **Edges shimmer when the camera moves.** At low resolution, every small camera move shifts which pixels an edge covers. Keep the camera still, as here, or move it in steps of a whole game pixel.
- **Text is blocky and hard to read.** It is drawn in the canvas. Put text in HTML over the canvas instead, or use a pixel font at a whole multiple of its size.

## Let the agent see the pixels

A pixel look is a picture question, and a coding agent cannot see the canvas it draws on its own. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can look at the picture, enlarge a part of it, and measure it. Install it in Claude Code with these two lines in a terminal (the window where you type commands):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

`look` with `save` keeps a picture as a baseline, and `compare` sets the page against it. Here the agent opened the room with `?smooth`, saved it as `smooth`, opened it again without, and compared:

```text
look {"compare":"smooth"}

Compare: 3% of pixels differ from smooth (saved 2026-10-31, frame 1, 1280x800@1); diff at <project>/paprika3d/runs/2026-10-31T07-32-56-082Z/look-1-diff.png
Picture: <project>/paprika3d/runs/2026-10-31T07-32-56-082Z/look-1.png
Pixels: brightness 30%, colour saturation 44%, 0% near black, 0% blown out.
Hues: violet 61%, orange 19%, blue 14% of the frame; over the objects (39.3% of it): orange 47%, blue 35%, grey 7%, red 6%.
Depth: the nearest third of objects brightness 54%, colour 51%; the farthest third 40%, colour 47%.
Canvas: 320x200 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 0.25, capped below DPR 1); resize handler ran.
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "DUST 20" [18, 14, 109, 38].
Subject: robot takes 0.31% of the picture [508, 480, 579, 535]; 1 of its 1 named parts show.
Stands out: subject brightness 68% against 52% around it, colour 27% against 61%, edge contrast 0.406.
This camera shows little of the subject: try other views with `look` camera, then move the page's own camera to the best (said once).
On screen (61):
floor ×2 18% [204, 252, 1047, 755] 10 × 8 units
wall ×4 14% [144, 72, 1095, 455] 8–10 × 3 units
rug ×2 2.7% [508, 396, 815, 575] 3.6 × 2.4 units
sofa ×2 1.5% [512, 200, 715, 323]
table ×2 0.86% [820, 324, 947, 423]
leaves ×2 0.68% [196, 328, 299, 415]
plant pot ×2 0.38% [212, 396, 303, 467]
robot ×3 0.31% [508, 480, 579, 535]
sofa arm ×2 0.24% [492, 180, 551, 267]
dust ×40 0.47% [348, 292, 883, 683]
Never visible: none
```

The `Canvas:` line is the check for the first part: a 320 by 200 drawing for a 1280 by 800 page. Just 3% of pixels differ from the full-resolution room, and the diff picture puts them all along the edges and outlines: the flat colours inside the shapes are the same at both sizes, and the blocks are the edges. `look` with `zoom` enlarges a box of the page; here around the robot, where every game pixel shows as a clear square:

```text
look {"zoom":[470,440,630,560]}

Picture: <project>/paprika3d/runs/2026-10-31T07-32-56-082Z/look-2-zoom.png ([470, 440, 630, 560] at 4×) of the live page at frame 1, not a saved picture or sheet
```

`eval` runs code inside the page. To count the colours, the agent drew a frame, copied it into a plain canvas and counted the distinct colours in it. At full resolution with `?smooth`:

```text
{"picture":"1280 x 800","colours":192}
```

and in the pixel version, after the robot had driven right and picked up a speck (the call checking that the game still plays):

```text
interact {"steps":[{"key":"ArrowRight","frames":40}],"expect":{"dust":19}}

{"changed":{"robot":{"x":2},"dust":19}}
Expect: dust 19 ✓

{"picture":"320 x 200","colours":21}
```

To see what the stepped light adds, the agent swapped every toon material for a standard one in the running page (the change vanishes on reload) and counted again:

```js
scene.traverse(o => { if (o.material?.isMeshToonMaterial) o.material = new THREE.MeshStandardMaterial({ color: o.material.color }); });
renderer.render(scene, camera);
const copy = document.createElement("canvas");
copy.width = renderer.domElement.width;
copy.height = renderer.domElement.height;
const ctx = copy.getContext("2d");
ctx.drawImage(renderer.domElement, 0, 0);
const px = ctx.getImageData(0, 0, copy.width, copy.height).data, colours = new Set();
for (let i = 0; i < px.length; i += 4) colours.add(px[i] * 65536 + px[i + 1] * 256 + px[i + 2]);
return { picture: copy.width + " x " + copy.height, colours: colours.size };
```

```text
{"picture":"320 x 200","colours":64}
```

Low resolution alone gives 64 colours, with smooth shading still running across every surface; the stepped light brings it to 21. These replies were captured on 2026-10-31 on a machine with no graphics card, where Chrome draws in software.

Drawing a sixteenth as many pixels also makes each frame cheaper on a real graphics card. `perf` with `variants` and a `pixelRatio` times the same scene at two pixel ratios in one call, on the machine you run it on; this page leaves out its frame times because a software renderer's timings say nothing about a real graphics card. paprika3d does not judge whether the look is good or the palette pretty; it shows the picture and the numbers, and the choice stays yours.

## Next steps

- A flat 2D pixel game from a sprite sheet and a tile map: [three.js tilemap and sprite sheet](/guides/threejs-tilemap-sprite-sheet).
- Light, colour and contrast for any look: [how to make my game look better](/guides/make-my-game-look-better).
- A sky and light that change through the day: [how to make a day night cycle in a game](/guides/make-a-day-night-cycle).
- Make moving and collecting feel good: [how to make a game feel good](/guides/make-a-game-feel-good).
- Share it: [how to put your game online](/guides/put-your-game-online).
