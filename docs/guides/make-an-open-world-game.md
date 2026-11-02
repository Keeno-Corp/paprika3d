---
title: How to make an open world game in three.js: a small island to explore
phrase: how to make an open world game
description: How to make an open world game as a first game: start with a small island instead of a city, built from one height function, with five beacons to light in any order, a map drawn from the same function, fog that hides the edge and trees drawn simpler far away, in one three.js file; the prompt to give an AI agent, what a game like GTA adds on top, and how the agent walks the island, pictures it from above and counts what each frame draws with paprika3d's interact, look and perf.
meta: How to make an open world game: a small three.js island to explore, with beacons to find, a map, fog at the edge and simpler trees far away.
intent: make-an-open-world-game
queries:
  - "how to make an open world game"
  - "how to make a game like gta"
  - "three js open world game"
  - "Making a 3d Open-World Survival with crafting and building"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make an open world game in three.js: a small island to explore

An open world game is one big connected place the player can walk across in any order, instead of a row of levels played one after another. The games people have in mind when they ask, such as GTA, were made by large teams over years. The way in for one person is a small world with the same parts: land to walk on, things to find anywhere on it, a map, and a few tricks that keep the computer from drawing the whole world every frame. This page builds that as an island with five beacons to light, in one file, and then says plainly what a game like GTA adds.

## The parts of an open world

1. **The land.** A height function: give it a spot (x across, z forward) and it returns how high the ground is there. The ground's mesh, the player's feet and the map all ask the same function, so they agree.
2. **Goals spread out.** Five beacons on different hills, lit in any order by walking up to one. They pull the player across the whole island, which is what makes a world feel open.
3. **A map.** A small picture of the island in the corner, with the beacons and a dot for the player, so the player can plan a route.
4. **A camera that follows.** It stays behind the player and above the ground under it.
5. **Not drawing everything.** Fog fades distant land into the sky, so the world's edge never shows. Trees far away are drawn as a plain cone instead of a detailed tree, and trees past the fog are not drawn at all.

## A small island to explore

Beacon island: walk with the arrow keys (up and down to walk, left and right to turn) and light all five beacons. three.js, a JavaScript library that draws 3D in a web page, draws it; the whole game is one HTML file. The import map line near the top tells the browser where three.js is, a `node_modules/three` folder next to the file, which `npm install three` makes when you type it in a terminal (the window where you type commands). [How to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains how to open such a file in a browser.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Beacon island</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:16px;left:20px;font:600 20px system-ui;color:#fff;text-shadow:0 1px 3px #0008}
#map{position:fixed;top:16px;right:16px;border:2px solid #fff;border-radius:8px}</style></head>
<body>
<div id="hud">Beacons lit: 0 / 5</div>
<canvas id="map" width="180" height="180"></canvas>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8d8f0);
scene.fog = new THREE.Fog(0xa8d8f0, 30, 110);   // past 110 units everything fades to sky: the edge of the world never shows
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 400);
scene.add(new THREE.HemisphereLight(0xffffff, 0x4a6040, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(50, 80, 30);
scene.add(sun);

// The island: one height for any spot, hills in the middle and under the sea toward the edge.
function height(x, z) {
  const d = Math.hypot(x, z) / 90;
  const hills = 3 * Math.sin(x * 0.08) * Math.cos(z * 0.07) + 1.5 * Math.sin(x * 0.19 + z * 0.13);
  return (1 - d * d) * 14 + hills - 4;
}

const ground = new THREE.PlaneGeometry(220, 220, 110, 110).rotateX(-Math.PI / 2);
const pos = ground.attributes.position, colors = [];
const sand = new THREE.Color(0xe0cf8f), grass = new THREE.Color(0x5f9a45), rock = new THREE.Color(0x8a8378);
for (let i = 0; i < pos.count; i++) {
  const y = height(pos.getX(i), pos.getZ(i));
  pos.setY(i, y);
  colors.push(...(y < 1 ? sand : y < 11 ? grass : rock).toArray());
}
ground.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
ground.computeVertexNormals();
const island = new THREE.Mesh(ground, new THREE.MeshStandardMaterial({ vertexColors: true }));
island.name = 'island';
const sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2b7bb0 }));
sea.name = 'sea';
scene.add(island, sea);

// Trees: near ones drawn with detail, far ones as one plain cone, the farthest not at all.
let seed = 7;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // seeded: the same island on every load
const leaves = new THREE.MeshStandardMaterial({ color: 0x2f6b30 }), bark = new THREE.MeshStandardMaterial({ color: 0x6b4a2b });
const fullTop = new THREE.ConeGeometry(1.6, 4, 24, 6), trunk = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 12), farTop = new THREE.ConeGeometry(1.6, 5, 5);
const trees = new THREE.Group();
trees.name = 'trees';
for (let i = 0; i < 150; i++) {
  const x = random() * 160 - 80, z = random() * 160 - 80, y = height(x, z);
  if (y < 1.5 || y > 11) continue;   // no trees on the beach or the rocks
  const near = new THREE.Group(), top = new THREE.Mesh(fullTop, leaves), stem = new THREE.Mesh(trunk, bark);
  top.position.y = 3.5;
  stem.position.y = 0.75;
  near.add(top, stem);
  const far = new THREE.Mesh(farTop, leaves);
  far.position.y = 2.5;
  const tree = new THREE.LOD();
  tree.addLevel(near, 0);
  tree.addLevel(far, 30);                     // past 30 units: the plain cone
  tree.addLevel(new THREE.Object3D(), 110);   // past 110: nothing, the fog hides it anyway
  tree.position.set(x, y, z);
  trees.add(tree);
}
scene.add(trees);

const SPOTS = [[30, -20], [-45, -35], [-50, 30], [15, 55], [55, 20]];
const stone = new THREE.MeshStandardMaterial({ color: 0x9a9a9a }), ash = new THREE.MeshStandardMaterial({ color: 0x444444 });
const flame = new THREE.MeshStandardMaterial({ color: 0xffa020, emissive: 0xff6000, emissiveIntensity: 2 });
const beacons = SPOTS.map(([x, z]) => {
  const beacon = new THREE.Group(), pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 6, 8), stone), fire = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), ash);
  beacon.name = 'beacon';
  pillar.position.y = 3;
  fire.position.y = 6.8;
  beacon.add(pillar, fire);
  beacon.position.set(x, height(x, z), z);
  scene.add(beacon);
  return { x, z, lit: false, fire };
});

const player = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1, 4, 12), new THREE.MeshStandardMaterial({ color: 0xff7a30 }));
player.name = 'player';
scene.add(player);
let px = 12, pz = -3, heading = Math.atan2(SPOTS[0][0] - px, SPOTS[0][1] - pz), lit = 0;   // start on the highest hill, facing a beacon
const held = new Set();
function act({ key, down = true }) { if (down) held.add(key); else held.delete(key); }
addEventListener('keydown', e => act({ key: e.key }));
addEventListener('keyup', e => act({ key: e.key, down: false }));

// The map: the land drawn once from the same height function, then the beacons and you on top every frame.
const map = document.getElementById('map').getContext('2d'), land = map.createImageData(180, 180);
for (let j = 0; j < 180; j++) for (let i = 0; i < 180; i++)
  land.data.set(height(i - 90, j - 90) > 0 ? [95, 154, 69, 255] : [43, 123, 176, 255], (j * 180 + i) * 4);   // one pixel a unit
function drawMap() {
  map.putImageData(land, 0, 0);
  for (const b of beacons) { map.fillStyle = b.lit ? '#ffa020' : '#333'; map.fillRect(b.x + 86, b.z + 86, 8, 8); }
  map.fillStyle = '#fff';
  map.beginPath();
  map.arc(px + 90, pz + 90, 4, 0, Math.PI * 2);
  map.fill();
}

function step(dt) {
  const turn = (held.has('ArrowLeft') ? 1 : 0) - (held.has('ArrowRight') ? 1 : 0);
  const walk = (held.has('ArrowUp') ? 1 : 0) - (held.has('ArrowDown') ? 1 : 0);
  heading += turn * 2 * dt;
  const nx = px + Math.sin(heading) * walk * 8 * dt, nz = pz + Math.cos(heading) * walk * 8 * dt;   // 8 units a second
  if (height(nx, nz) > 0.5) { px = nx; pz = nz; }   // the sea stops you
  for (const b of beacons) if (!b.lit && Math.hypot(b.x - px, b.z - pz) < 3) {
    b.lit = true;
    b.fire.material = flame;
    document.getElementById('hud').textContent = `Beacons lit: ${++lit} / 5${lit === 5 ? ': the island is yours!' : ''}`;
  }
}

const behind = new THREE.Vector3();
function draw(dt) {
  player.position.set(px, height(px, pz) + 1, pz);
  behind.set(px - Math.sin(heading) * 10, 0, pz - Math.cos(heading) * 10);
  behind.y = Math.max(height(behind.x, behind.z), player.position.y) + 5;   // the camera never goes under a hill
  camera.position.lerp(behind, dt ? 1 - Math.exp(-5 * dt) : 1);
  camera.lookAt(px, player.position.y + 1.5, pz);
  drawMap();
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
draw(0);
let last = null;
renderer.setAnimationLoop((now) => {
  const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;
  step(dt);
  draw(dt);
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'beacon island', units: 'metres', keys: { ArrowUp: 'walk forward', ArrowDown: 'walk back', ArrowLeft: 'turn left', ArrowRight: 'turn right' } }),
  observe: () => ({ player: { x: +px.toFixed(1), y: +player.position.y.toFixed(1), z: +pz.toFixed(1) }, heading: +heading.toFixed(2), lit, beacons: beacons.map(b => b.lit) }),
  act,
  setState: (s) => { if ('x' in s) px = s.x; if ('z' in s) pz = s.z; if ('heading' in s) heading = s.heading; draw(0); },
  subject: player,
};
</script>
</body></html>
```

## How the code works

**The land.** `height(x, z)` starts with a dome, high in the middle and below sea level toward the edge, and adds two sine waves to make hills. The ground is a flat sheet cut into 110 by 110 squares; each corner is lifted to `height` at that spot and coloured by it: sand near the water, grass on the slopes, grey rock on the tops. A flat blue sheet at height 0 is the sea.

**Walking.** Each frame `step` turns the player with left and right and moves them forward or back at 8 units a second, then sets their height to `height` under their feet. A step that would end in the sea is refused. A world with hills from a picture, or ground made in a 3D modelling program such as Blender, needs a little more to keep feet on the ground as drawn: [three.js terrain heightmap](/guides/threejs-walk-on-terrain-heightmap) covers both.

**Trees.** 150 tries at a random spot, skipping the beach and the rocks. The random numbers come from a seeded function, a few lines that give the same numbers every time from the same starting number (the seed), so the island is the same on every load. Each tree is a `THREE.LOD` (level of detail): three versions of one tree, and three.js draws the one that fits the camera's distance. Close up, a cone with many faces and a trunk; past 30 units, one plain cone; past 110 units, nothing.

**The map.** When the game starts it asks `height` once for every pixel of a small canvas, a 2D drawing surface in the page, and paints land or sea. Every frame it puts that picture back and draws the beacons (orange once lit) and a white dot for the player.

**The fog.** `scene.fog` blends everything toward the sky colour between 30 and 110 units from the camera. Past that distance the land is the colour of the sky, so the island fades out instead of ending at a hard line.

## Keeping a big world fast

Every frame, the computer draws the world as triangles, and each separate object it draws is one draw call, a request to the graphics card. A world gets slow when too many of either are in view at once. Three habits keep an open world light:

- **Fog with a matching distance.** Anything the fog hides fully can be skipped, as the trees' last level does here.
- **Simpler far away.** Level of detail, as the trees here: a far tree is a few pixels tall, so a cone with five sides looks the same as the detailed one.
- **Many copies as one.** A forest of the same tree can be drawn in one draw call with instancing; [too many meshes: merge or instance](/guides/threejs-too-many-meshes-merge-or-instance) shows how.

Worlds much bigger than this island also split the land into pieces and build or drop each piece as the player comes near or walks away. [How to make a minecraft clone](/guides/make-a-minecraft-clone) builds a world that way, in blocks.

## What a game like GTA adds

GTA's world is a city: streets and hundreds of buildings modelled by artists, cars you can drive, people who walk around and react, police, radio stations, missions with a story and recorded voices, and a world too big to keep in memory at once, loaded piece by piece from disk as you move. Each of those is a project of its own, and the whole is the work of a large studio. A browser game made with an AI agent can have some of them, one at a time. Start with the island, then add one: a car ([how to make a racing game](/guides/make-a-racing-game)), someone to talk to who gives a quest ([how to make a dialogue system in a game](/guides/make-a-dialogue-system-in-a-game)), or night falling over the island ([how to make a day night cycle in a game](/guides/make-a-day-night-cycle)).

## What to ask your AI agent

An AI coding agent, an assistant such as Claude Code that writes and edits your project's files, can build this world from a description that names each part:

```text
Make a small open world game in three.js, in one HTML file. An island from one height
function height(x, z): a dome with hills, sand, grass and rock coloured by height, a sea
around it. The player walks with the arrow keys and stands on height(x, z); the sea stops
them. A follow camera behind and above, never under the ground. Five beacons on different
hills that light when the player comes within 3 metres, and a minimap in the corner drawn
from the same height function, showing lit beacons and the player. Fog that hides the
island's edge. 150 trees from a seeded random, each a THREE.LOD with a detailed version up
close, a plain cone past 30 metres and nothing past the fog. Expose window.__game with
describe, observe (player position, lit count) and act.
```

## When it does not work

- **The player floats above the hills or sinks into them.** Walking reads one height and the mesh draws another, often because the mesh is coarser than the function. The terrain heightmap guide linked above shows how to measure and fix it.
- **The world ends at a hard edge.** The fog's far distance is longer than the camera's `far`, or the sea is smaller than the distance you can see. Keep the fog's end inside both.
- **The camera dives into a hill.** It was placed behind the player without checking the ground there; lift it above `height` at its own spot, as `draw` does.
- **The island changes on every load.** Trees were placed with `Math.random()`. Use a seeded random, as here.
- **It gets slow as the world grows.** Count what each frame draws (below) before guessing.

## Let the agent walk the island and measure it

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs the game in a hidden Chrome browser so the agent can see and play its own world, then fix what it finds instead of asking you to describe it.

`interact` plays keys on exact frames. Here it holds the up arrow from the start, on the highest hill and facing the first beacon, until a beacon is lit, and traces the player's height on the way down:

```text
interact {"steps":[{"key":"ArrowUp","down":true},{"until":{"lit":1},"max":600},{"key":"ArrowUp","down":false}],"trace":["player.y","lit"]}

{"changed":{"player":{"x":27.9,"y":10.1,"z":-18},"lit":1,"beacons":[true,false,false,false,false]}}
until: lit == 1 held at frame 164
player.y: 14.6 → 10.1 at frame 163; first changed at frame 14
lit: 0 → 1 at frame 164; first changed at frame 164
```

The walk takes 164 frames, under three seconds, and the first beacon lights. `look` with `cameras` takes pictures from cameras the agent places, without moving the game's own camera:

```text
look {"cameras":[{"position":[0,60,70],"lookAt":[0,0,0],"label":"high over the south shore"},{"position":[0,170,1],"lookAt":[0,0,0],"label":"straight down"}]}

Picture: <project>/paprika3d/runs/2026-11-01T00-30-11-591Z/look-2-cameras.png (2 cameras, left to right, top to bottom, at frame 165, no reload; the game's own camera is not moved)
high over the south shore: subject player 0.0026%; on screen: island, sea, trees ×48, beacon ×8, player; pixels: brightness 72%, colour saturation 32%, 0% near black, 0% blown out
straight down: subject player 0.0018%; on screen: sea, island, beacon ×10, player; pixels: brightness 80%, colour saturation 31%, 0% near black, 0% blown out
Each cell at full size: high over the south shore look-1.png, straight down look-2.png (in the picture's folder).
Kept as `camera` names for look, zoom and reference compare: "high over the south shore", "straight down" (paprika3d/cameras.json).
```

The view over the south shore shows most of the island fading into haze. The straight-down picture was the plain colour of the sky: that camera is so high that all of the island is past the fog's end. Fog is measured from the camera, so the trick that hides the world's edge from the player also hides the whole world from a camera high above. `eval` runs code inside the page, and its changes last until the next reload; here it turns the fog off for one more picture:

```text
eval {"code":"scene.fog = null; return \"fog off until the next reload\""}

fog off until the next reload

look {"camera":"straight down"}

Picture: <project>/paprika3d/runs/2026-11-01T00-31-03-832Z/look-1.png
Pixels: brightness 51%, colour saturation 71%, 0% near black, 0% blown out.
Hues: blue 68%, green 27% of the frame; over the objects but sea (29% of it): green 84%, grey 13%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Beacons lit: 0 / 5" [20, 16, 235, 38].
Subject: player takes 0.0017% of the picture [691, 384, 695, 387]; 1 of its 1 named parts show.
Stands out: subject brightness 55% against 56% around it, colour 70% against 16%, edge contrast 0.074.
This camera shows little of the subject: try other views with `look` camera, then move the page's own camera to the best (said once).
On screen (13):
sea 71% [0, 0, 1279, 799] 600 × 600 units
island 29% [316, 64, 979, 765]
beacon ×10 0.055% [418, 245, 883, 639]
player 0.0017% [691, 384, 695, 387]
Never visible: none
```

Now the whole island shows, with the beacons spread across it, and no trees: from that height every tree is past its last level of detail and draws nothing. `perf` measures what each frame costs. Its `variants` run the page again with a change; here every tree is forced to its detailed version, to see what the simpler far trees save:

```text
perf {"costs":true,"variants":[{"label":"every tree detailed","code":"scene.traverse(o => { if (o.isLOD) { o.levels[1].distance = 1e9; o.levels[2].distance = 1e9; } })"}]}

baseline: 184 ms median (p95 219.3), work 171.2 ms, 34 draw calls, 26488 triangles; over budget: frameMs 184 of 16.7 ms; desktop budget
every tree detailed: 202.2 ms median (p95 202.2), work 182.8 ms, 52 draw calls, 32634 triangles; no clear change (−1% to +19%, 4 runs); +53% draw calls, +23% triangles
Work: the median of the frames that drew, of paused frames, each timed from its step to the end of its GPU work, with no wait for the display.
Baseline over 4 loads: 184 ms median, runs spread 5%. Load to first frame: 0.1 s.
Host load 8.9 on 64 cores. GPU: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). A software renderer (no GPU): frame times here say nothing of a real GPU's.
The page is reloaded as it was.
Costs by named group: the main scene's visible objects, each under its nearest named ancestor as `look` names it, counted, not timed, and with no frustum culling (the frame draws only what its camera sees, plus a shadow pass per casting light); `variants` with `hide` times a group. In all 30832 triangles, 0 casting shadows, 112 draw calls, 0 MB of textures (the first line's 26488 triangles and 34 draw calls are the frame as drawn, the camera's view plus the shadow pass):
  island: 24200 triangles, 0 casting shadows, 1 draw calls, 0 MB of textures
  trees: 5414 triangles, 0 casting shadows, 99 draw calls, 0 MB of textures
  beacon: 1000 triangles, 0 casting shadows, 10 draw calls, 0 MB of textures
  player: 216 triangles, 0 casting shadows, 1 draw calls, 0 MB of textures
  sea: 2 triangles, 0 casting shadows, 1 draw calls, 0 MB of textures
```

The timings in these lines (184 ms a frame) come from a machine with no graphics card, where Chrome draws in software; as the reply says, they say nothing of a real one, so ignore them here. The counts hold on any machine: from the hilltop where the game starts, a frame makes 34 draw calls and 26488 triangles, and with every tree detailed it would make 52 draw calls and 32634 triangles. The costs list shows where the rest goes: the ground is most of the triangles in one draw call, and the trees are most of the draw calls, which is the case instancing is for. These replies were captured on 2026-11-01.

`open` also writes a file named `fx.js` into the project, whose `field` makes a seeded height field like `height` here, with `place` to scatter trees by height and slope. paprika3d does not design the world or tell you whether exploring it is fun; walk it yourself. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Next steps

- A third-person camera that follows smoothly and stays out of hills: [three.js third person camera](/guides/threejs-third-person-camera-follow).
- Things to gather and craft on the island: [how to make an inventory in a game](/guides/make-an-inventory-in-a-game).
- Keep the lit beacons between visits: [how to save game progress](/guides/save-game-progress).
- Make the world look richer: [how to make my game look better](/guides/make-my-game-look-better).
- How an agent builds and tests a game from start to end: [build a three.js game with an AI agent](/guides/ai-agent-build-threejs-game).
