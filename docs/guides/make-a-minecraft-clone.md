---
title: How to make a minecraft clone in three.js: a block world to dig and build
phrase: how to make a minecraft clone
description: How to make a minecraft clone in the browser, for someone who has never made a game: the world as a grid of numbers, hills from a seeded noise function so one seed always gives the same world, one mesh per chunk holding just the block faces that touch air, and digging and placing by a click, on a small three.js block valley you can paste; and how a coding agent with paprika3d clicks the blocks itself, counts them, and measures the draw calls a chunk saves.
meta: How to make a minecraft clone in three.js: a seeded block world drawn in chunks, with click to dig and place blocks.
intent: make-a-minecraft-clone
queries:
  - "how to make a minecraft like game"
  - "How do games like Minecraft generate entire worlds from a seed number?"
  - "How are voxel terrain engines made?"
  - "three js voxel game"
  - "how to make a voxel game"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a minecraft clone in three.js: a block world to dig and build

A Minecraft-style world is a big 3D grid of small numbers, one per block: 0 for air, 1 for grass, 2 for dirt, 3 for stone. You fill the grid from a noise function that turns a seed into hills, draw it as a few large shapes that hold just the block faces you could ever see, and when the player clicks, you change one number and redraw the part of the world around it. That is the core of every block game. Crafting, creatures and survival are games built on top of it, and they come after the world works.

Some words used below. **three.js** is a JavaScript library that draws 3D scenes in a web page. A **mesh** is one shape three.js draws, made of triangles. A **draw call** is one instruction to the graphics card to draw one mesh; a few hundred are fine, many thousands make a scene slow. A **voxel** is a block in a 3D grid (a "volume pixel"), which is why these games are also called voxel games. A **chunk** is a square piece of the world, here 16 by 16 columns, drawn as one mesh.

## The world is a grid of numbers

Keep the whole world in one flat list of numbers, a `Uint8Array` (a list of small whole numbers, very compact). A block at column `x`, row `z` and height `y` lives at position `x + z * SIZE + y * SIZE * SIZE`. Reading a block outside the world returns air, which saves a lot of edge checks later. Everything else in the game reads and writes this list; the meshes are just a picture of it.

## Hills from a seed

The Game Development Stack Exchange question "How do games like Minecraft generate entire worlds from a seed number?" has a short answer: the world is not stored, it is worked out. A **hash** function turns a column's position and the seed into a number between 0 and 1 that looks random but is always the same for the same inputs. A **noise** function puts those numbers on a coarse grid and blends smoothly between them, which gives rolling hills instead of spiky ones. The height of each column is that noise, scaled and rounded down to a whole block. Change the seed and every hash changes, so the world changes; keep it and you get the same world on every computer, every time. This is why the game below never calls `Math.random`.

## Draw the faces you can see, one mesh per chunk

The first version almost everyone writes puts a cube mesh at every block:

```js
for (let y = 0; y < HEIGHT; y++) for (let z = 0; z < SIZE; z++) for (let x = 0; x < SIZE; x++) {
  const block = get(x, y, z);
  if (!block) continue;
  const m = new THREE.Mesh(box, mats[block]);   // one mesh, so one draw call, per block
  m.position.set(x + 0.5, y + 0.5, z + 0.5);
  scene.add(m);
}
```

It works for a few hundred blocks and crawls for a valley of thousands, for two reasons. Every block is its own draw call. And most of the faces drawn are buried: a face between two blocks can never be seen, yet each cube draws all six sides.

The fix answers "How are voxel terrain engines made?": build one geometry per chunk by hand. Walk every block in the chunk, and for each of its six sides, look at the neighbour on that side. If the neighbour is air, add that face (four corners, two triangles) to the chunk's geometry; if it is a block, skip it. The chunk becomes one mesh and one draw call, and buried faces cost nothing. Merging and instancing in general are covered in [too many meshes: merge or instance](/guides/threejs-too-many-meshes-merge-or-instance).

## Digging and placing

A click sends a **ray** (an invisible line) from the camera through the mouse into the world; three.js's `Raycaster` returns the first face it meets and which way that face points. Half a block in from the face is the block that was clicked, so digging sets that block to air. Half a block out is the empty space in front of it, so placing puts a block there. Then rebuild the chunk that block belongs to, plus the next chunk when the block sits on the border between two, or the neighbour keeps a stale face. Number keys pick the tool, as Minecraft's hotbar does, and the right mouse button places dirt. More on clicking objects in [click on an object in three.js](/guides/threejs-click-on-object-raycaster).

## The whole game: block valley

A 32 by 32 valley, 16 blocks tall, cut into four chunks. Left click digs; press 2, 3 or 4 to pick dirt, stone or grass and left click places it; 1 goes back to digging; right click always places dirt. Save it as `index.html` in a new folder, run `npm install three` there (this downloads three.js into the folder), start a small web server in the folder with `python3 -m http.server 8000`, and open `http://localhost:8000` in your browser. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Block valley</title>
<style>html,body{margin:0;overflow:hidden;background:#a8d8ff}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#123;font:600 18px system-ui}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const SIZE = 32, HEIGHT = 16, CHUNK = 16;   // 32 by 32 columns, 16 blocks tall, cut into chunks of 16 by 16
const AIR = 0, GRASS = 1, DIRT = 2, STONE = 3;
const COLORS = [0, 0x5fae4a, 0x8b5a2b, 0x8a8a8a];
const TOOLS = { Digit1: 'dig', Digit2: DIRT, Digit3: STONE, Digit4: GRASS };
const world = new Uint8Array(SIZE * SIZE * HEIGHT);   // one number per block: which kind, 0 for air
const index = (x, y, z) => x + z * SIZE + y * SIZE * SIZE;
const inside = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < SIZE && y < HEIGHT && z < SIZE;
const get = (x, y, z) => inside(x, y, z) ? world[index(x, y, z)] : AIR;
const hud = document.getElementById('hud');
let seed = 7, tool = 'dig', dug = 0, placed = 0;

// Seeded noise: a hash turns (x, z, seed) into a fixed random number, so one seed always gives the same valley.
function hash(x, z) {
  let h = Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, z) {   // random heights on a coarse grid, blended smoothly between grid points
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
}
function generate() {
  world.fill(AIR);
  for (let x = 0; x < SIZE; x++) for (let z = 0; z < SIZE; z++) {
    const top = Math.floor(2 + 5 * noise(x / 6, z / 6) + Math.abs(x - 15.5) / 3);   // hills, higher away from the middle
    for (let y = 0; y <= top; y++) world[index(x, y, z)] = y === top ? GRASS : y > top - 3 ? DIRT : STONE;
  }
}

// The six sides of a block: which neighbour each faces, and its four corners.
const FACES = [
  { dir: [-1, 0, 0], corners: [[0, 1, 0], [0, 0, 0], [0, 1, 1], [0, 0, 1]] },
  { dir: [1, 0, 0], corners: [[1, 1, 1], [1, 0, 1], [1, 1, 0], [1, 0, 0]] },
  { dir: [0, -1, 0], corners: [[1, 0, 1], [0, 0, 1], [1, 0, 0], [0, 0, 0]] },
  { dir: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [0, 1, 0], [1, 1, 0]] },
  { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [1, 1, 0], [0, 1, 0]] },
  { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]] },
];
// One geometry per chunk, with only the faces that touch air: a face between two blocks is never seen.
function buildChunk(cx, cz) {
  const pos = [], nor = [], col = [], idx = [], c = new THREE.Color();
  for (let y = 0; y < HEIGHT; y++) for (let z = cz * CHUNK; z < (cz + 1) * CHUNK; z++) for (let x = cx * CHUNK; x < (cx + 1) * CHUNK; x++) {
    const block = get(x, y, z);
    if (!block) continue;
    for (const { dir, corners } of FACES) {
      if (get(x + dir[0], y + dir[1], z + dir[2])) continue;
      const n = pos.length / 3;
      c.set(COLORS[block]).multiplyScalar(0.85 + 0.15 * hash(x * 31 + y, z));   // each block a little lighter or darker, so blocks read apart
      for (const [a, b, d] of corners) { pos.push(x + a, y + b, z + d); nor.push(...dir); col.push(c.r, c.g, c.b); }
      idx.push(n, n + 1, n + 2, n + 2, n + 1, n + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8d8ff);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 200);
camera.position.set(16, 30, 46);
camera.lookAt(16, 4, 16);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x667788, 1.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(10, 30, 20);
scene.add(sun);

const material = new THREE.MeshLambertMaterial({ vertexColors: true });
const chunks = [];
generate();
for (let cz = 0; cz < SIZE / CHUNK; cz++) for (let cx = 0; cx < SIZE / CHUNK; cx++) {
  const mesh = new THREE.Mesh(buildChunk(cx, cz), material);
  mesh.name = `chunk ${cx}-${cz}`;
  mesh.userData = { cx, cz };
  scene.add(mesh);
  chunks.push(mesh);
}
function rebuild(x, z) {   // a changed block redraws its chunk, and the next chunk too when it sits on the border
  for (const m of chunks) {
    const { cx, cz } = m.userData;
    if (x >= cx * CHUNK - 1 && x <= (cx + 1) * CHUNK && z >= cz * CHUNK - 1 && z <= (cz + 1) * CHUNK) {
      m.geometry.dispose();
      m.geometry = buildChunk(cx, cz);
    }
  }
}

// Click: the ray from the camera through the mouse meets a face. Half a block in from it is the block hit; half a block out is the air in front.
const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
renderer.domElement.addEventListener('mousedown', e => {
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  const hit = ray.intersectObjects(chunks)[0];
  if (!hit) return;
  const place = e.button === 2 || tool !== 'dig';
  // Start from the middle of the triangle clicked, not the hit point, which can sit exactly on the edge between two blocks.
  const at = hit.object.geometry.attributes.position, p = new THREE.Vector3();
  for (const i of [hit.face.a, hit.face.b, hit.face.c]) p.add(new THREE.Vector3().fromBufferAttribute(at, i));
  p.divideScalar(3).addScaledVector(hit.face.normal, place ? 0.5 : -0.5).floor();
  if (!inside(p.x, p.y, p.z)) return;
  if (place && get(p.x, p.y, p.z) === AIR) { world[index(p.x, p.y, p.z)] = tool === 'dig' ? DIRT : tool; placed++; }
  else if (!place && p.y > 0) { world[index(p.x, p.y, p.z)] = AIR; dug++; }   // the bottom layer stays, so you cannot dig out of the world
  rebuild(p.x, p.z);
});

function loop() {
  requestAnimationFrame(loop);
  hud.textContent = `Tool: ${tool === 'dig' ? 'dig' : ['', 'grass', 'dirt', 'stone'][tool]} (keys 1 to 4). Left click uses it, right click places dirt.`;
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

const act = ({ key, down = true }) => { if (down && key in TOOLS) tool = TOOLS[key]; };
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.__game = {
  describe: () => ({ name: 'block valley', keys: { Digit1: 'dig tool', Digit2: 'place dirt', Digit3: 'place stone', Digit4: 'place grass' }, mouse: 'left click uses the tool, right click places dirt' }),
  observe: () => ({ seed, tool, blocks: world.reduce((n, b) => n + (b ? 1 : 0), 0), dug, placed }),
  act,
  setState: (s) => {
    if (s.tool !== undefined) tool = s.tool;
    if (s.seed !== undefined && s.seed !== seed) { seed = s.seed; generate(); chunks.forEach(m => { m.geometry.dispose(); m.geometry = buildChunk(m.userData.cx, m.userData.cz); }); }
  },
};
</script>
</body></html>
```

The `window.__game` object at the end is for testing tools: it lets them count blocks and switch tools through `act`. The game plays without it.

## What to type to an AI coding agent

An **AI coding agent** (Claude Code, Codex, Cursor and others) is an assistant that writes files on your computer and runs commands. Asking it for "a Minecraft clone" gets you a guess at a very large game. Ask for the world first, in words that decide how it is built:

```text
Make a three.js block world in one index.html, like a small Minecraft.
A 32 by 32 valley of grass, dirt and stone, 16 blocks tall, from a seeded noise function
so the same seed always makes the same valley.
Draw it in 16 by 16 chunks, one mesh each, with only the faces that touch air.
Left click digs the block under the mouse; keys 1 to 4 pick dig, dirt, stone or grass;
right click places dirt. Rebuild a chunk and its neighbour when a block changes.
```

Walking around inside the world in first person comes next: [how to make a fps game](/guides/make-a-fps-game) covers pointer lock and mouse look, and [walking on terrain](/guides/threejs-walk-on-terrain-heightmap) covers standing on the ground. [The AI prompt to make a game](/guides/ai-prompt-to-make-a-game) says what else a request should name.

## When the block world breaks

- **It gets slow as the world grows.** A mesh per block. Count the draw calls (below); build chunks.
- **Gaps or see-through walls appear after digging at a chunk's edge.** The neighbouring chunk was not rebuilt, so it still hides a face that now touches air.
- **Faces are invisible from outside and visible from inside.** The four corners of a face are in the wrong order; three.js draws the side whose corners go counter-clockwise as you look at it.
- **The world is different on every reload.** The terrain uses `Math.random` instead of a seeded hash.
- **Right click opens the browser's menu.** The page needs `contextmenu` with `preventDefault()`, as the game has.
- **A click digs a different block from the one under the mouse, or nothing.** The block was worked out from the exact point the ray hit, which can sit on the edge between two blocks. The story below is that bug.

## Let the agent click the blocks itself

A block world has many numbers to get right that a picture alone does not show: was a block really removed, how many faces were skipped, how many draw calls the frame makes. paprika3d is a plugin for Claude Code (and an MCP server for other coding agents) that lets the agent open the page in a headless Chrome (a browser with no window), click it, and read the game's numbers back. Install it in Claude Code with:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The replies below were captured on 2026-10-30 on a Linux server with no GPU. The first version of this game took the block from the hit point itself, `hit.point.clone().addScaledVector(hit.face.normal, -0.5).floor()`. After a `look`, `interact` clicked the middle of the screen:

```text
interact {"steps":[{"mouse":"click","x":640,"y":400}],"look":true}

{"changed":{"dug":1}}
mouse click at (640, 400): over chunk 0-1 (Mesh, 36.6 units)

eval {"code":"const r=new THREE.Raycaster(); r.setFromCamera(new THREE.Vector2(0, 0), camera); const h=r.intersectObjects(scene.children)[0]; return {p:h.point.toArray(), n:h.face.normal.toArray(), o:h.object.name}"}

{"p":[16,6,18.308],"n":[0,1,0],"o":"chunk 0-1"}
```

The click landed on a chunk and the dig counter went up, but `blocks` did not change: the code dug air. The `eval` casts the same ray from the middle of the screen and finds the hit at x = 16 exactly, on the edge between two columns. Rounding down picked the column on the far side of that edge, which is lower and has no block at that height. (The picture lines of the first reply are left out.) The game above now starts from the middle of the clicked triangle, and the same calls on it dig, then pick stone and fill the hole:

```text
interact {"steps":[{"mouse":"click","x":640,"y":400}],"look":true}

{"changed":{"blocks":7808,"dug":1}}
mouse click at (640, 400): over chunk 0-1 (Mesh, 36.6 units)

interact {"steps":[{"key":"Digit3"},{"mouse":"click","x":640,"y":400}]}

{"changed":{"tool":3,"blocks":7809,"placed":1}}
mouse click at (640, 400): over chunk 0-1 (Mesh, 37.1 units)
```

(Picture lines left out again.) Then `eval` counts the meshes and triangles, and `perf` with `costs` splits the frame's draw calls by named object:

```text
eval {"code":"const meshes = scene.children.filter(o => o.isMesh); return { meshes: meshes.length, triangles: meshes.reduce((n, m) => n + m.geometry.index.count / 3, 0), blocks: window.__game.observe().blocks }"}

{"meshes":4,"triangles":7472,"blocks":7809}

perf {"costs":true}

Costs by named group: the main scene's visible objects, each under its nearest named ancestor as `look` names it, counted, not timed, and with no frustum culling (the frame draws only what its camera sees, plus a shadow pass per casting light); `variants` with `hide` times a group. In all 7472 triangles, 0 casting shadows, 4 draw calls, 0 MB of textures:
  chunk 1-1: 1930 triangles, 0 casting shadows, 1 draw calls, 0 MB of textures
  chunk 0-1: 1898 triangles, 0 casting shadows, 1 draw calls, 0 MB of textures
  chunk 1-0: 1862 triangles, 0 casting shadows, 1 draw calls, 0 MB of textures
  chunk 0-0: 1782 triangles, 0 casting shadows, 1 draw calls, 0 MB of textures
```

The same valley built with the cube-per-block loop from the top of the page:

```text
perf {"costs":true}

Costs by named group: the main scene's visible objects, each under its nearest named ancestor as `look` names it, counted, not timed, and with no frustum culling (the frame draws only what its camera sees, plus a shadow pass per casting light); `variants` with `hide` times a group. In all 93708 triangles, 0 casting shadows, 7809 draw calls, 0 MB of textures:
  block: 93708 triangles, 0 casting shadows, 7809 draw calls, 0 MB of textures
```

Four draw calls instead of 7809, and 7,472 triangles instead of 93,708: the buried faces are gone. (`perf`'s first lines, the frame times, are left out of both: this machine draws with a software renderer, and the tool itself says its frame times are no budget signal there.) What paprika3d does not do: it does not design the world or judge whether digging is fun, and it does not make the game fast on its own; it counts what the frame draws so the agent can see what a change saved. It has no phone and no gamepad, and it cannot hear the game.

## Where to go next

- Walking inside the world with the mouse turning the view: [how to make a fps game](/guides/make-a-fps-game).
- Keeping the world between visits, so a dug hole is still there tomorrow, is a save: [save the high score](/guides/save-the-high-score) shows the browser's `localStorage` for one number, and it can hold the world's numbers as text too.
- Thousands of the same object that are not blocks (trees, rocks, grass): [instanced meshes with a colour each](/guides/threejs-instancedmesh-color-per-instance).
- New to asking an agent and checking its work: [what changes when an AI agent can see and play its three.js game](/guides/ai-agent-build-threejs-game).
- Chunky pixels to match the blocks: [how to make a 3d game look pixelated](/guides/make-a-3d-game-look-pixelated).
- A world to explore without the blocks: [how to make an open world game](/guides/make-an-open-world-game).
