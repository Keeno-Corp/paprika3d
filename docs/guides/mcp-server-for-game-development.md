---
title: MCP server for game development in three.js: build and test 3D web games with Claude Code, beside Unity, Godot and Blender MCP
phrase: mcp server for game development
description: What the Unity, Godot and Blender MCP servers give a coding agent (a bridge into the engine's editor), what a browser game needs in their place since it has no editor, and the paprika3d calls that do those jobs on a three.js block-stacking tower: open, look, interact clicking two blocks on exact frames until the tower tips, perf counting draw calls, and model_run building the block as a GLB.
meta: The MCP server and Claude skills for 3D web game development: what Unity, Godot and Blender MCP do, and how paprika3d runs, plays and tests a three.js game.
intent: mcp-server-for-game-development
queries:
  - "mcp server for game development"
  - "claude mcp for game development"
  - "mcp servers and claude skills for 3d web games"
  - "Show HN: I built a MCP server so Claude can play Minesweeper"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# MCP server for game development in three.js: build and test 3D web games with Claude Code, beside Unity, Godot and Blender MCP

For a 3D web game built with three.js, the MCP server for game development is paprika3d: an MCP server plus Claude Code skills that let the agent run the game in headless Chrome, play it, measure it and test it. The MCP servers for game development that most people find first each connect a coding agent to an engine's editor: Unity MCP, Godot MCP and Blender MCP. A browser game made with three.js has no editor; it is a web page, so the MCP server it needs is one that opens the page, plays it with keys and clicks, measures it and builds its models in code. paprika3d is that server. In Claude Code: `claude plugin marketplace add Keeno-Corp/paprika3d`, then `claude plugin install paprika3d@paprika3d`; in any other MCP client, register `npx -y paprika3d serve` as a stdio server.

## What the engine servers do

Each of these is a bridge from the agent into a running tool. What follows is from each project's README on 2026-11-12; read the README for the version you install, since these projects change often.

- **Unity MCP** ([CoplayDev/unity-mcp](https://github.com/CoplayDev/unity-mcp)) calls itself "a bridge between AI assistants and your Unity Editor". It is a Unity package added from the Package Manager with a git URL, plus a Python server. Its tools create scenes and GameObjects, edit C# scripts, manage assets, and run tests, profiling and builds.
- **Godot MCP** ([Coding-Solo/godot-mcp](https://github.com/Coding-Solo/godot-mcp)) is a Node server that drives a Godot install: `launch_editor`, `run_project` in debug mode, `get_debug_output` for the console and errors, and `create_scene`, `add_node` and `save_scene` to build scenes. Its README adds it to Claude Code with `claude mcp add godot -- npx @coding-solo/godot-mcp`.
- **Blender MCP** ([ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp)) is a Blender add-on that runs a socket server inside Blender, and an MCP server that sends it Python to run. With Blender open, the agent builds and changes the scene, asks for its contents, and captures the viewport to check its own work.

The pattern is the same in all three: the engine holds the game or the scene, the server forwards the agent's commands to it, and the answers come back from the engine. Unity and Godot as engines, and how to make a game in them, are outside this page.

## What a browser game needs in their place

A three.js game is files: an `index.html`, some JavaScript, models and textures. The agent writes them directly, so the editor's job is already done. What it still lacks is everything the editor's play button gives a person: run the game, see it, press its keys, read its errors, and know how heavy each frame is. paprika3d does those jobs in a headless Chrome of its own, on a clock it pauses, so each frame is 1/60 s of game time and a play gives the same result every time.

| An engine server's job | The browser game's call |
|---|---|
| Run the project and read its console and errors | `open` (errors and failed loads in its reply), `observe` (errors since the last call) |
| Capture the viewport | `look`: the picture and each named object on screen with its pixel box |
| Play mode with input | `interact`: keys, clicks and drags on exact frames, the state after them, the object under each click |
| Profile | `perf`: frame time, draw calls and triangles against a budget, and with `costs` the counts per named group |
| Build a model in the editor | `model_run` and `model_look`: a modelling scene kept between calls, saved as a GLB the page loads |
| Run tests | `interact` with `save`, then `test` reruns every saved play |

Building three.js models in Blender through its MCP server has [a guide of its own](/guides/mcp-server-3d-modeling-threejs), which also covers the modelling scene in depth.

## Install

paprika3d needs Google Chrome and Node 20.11 or later; the Claude Code plugin needs Claude Code 2.1.118 or later.

```bash
claude plugin marketplace add Keeno-Corp/paprika3d
claude plugin install paprika3d@paprika3d
```

In Cursor, Codex, Gemini CLI or another MCP client, register `npx -y paprika3d serve` as a stdio server; the [install page](/install) gives each client's command. `npx skills add Keeno-Corp/paprika3d` adds the skills that tell the agent when to call each tool.

## A block-stacking tower

The game is a tower of crossed layers, three blocks to a layer. Click a block to pull it out; it goes on top. A layer holds what is above it while the centre of mass of everything above sits over its remaining blocks. Pull the wrong two from one layer and the part above tips into the gap. The game has no physics engine: the rule is a few lines in `lean()`, which is what keeps it exact under a test.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Tower</title>
<style>html,body{margin:0;overflow:hidden;background:#cfd8de}canvas{display:block}
#hud{position:fixed;top:12px;left:0;right:0;text-align:center;font:600 18px system-ui;color:#223;pointer-events:none}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// Rules: click a block to pull it from the tower; it goes on top, in the next free place of the top layer.
// Each layer is three blocks, crossed with the layer below. A layer holds what is above it while the centre of mass
// of everything above lies over its blocks; past that edge, the part above tips over it into the gap.
const LEN = 3, H = 0.6, START_LAYERS = 9;
let layers, pulled, fall;
const blocks = new Map();   // "layer-slot" -> mesh

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfd8de);
scene.fog = new THREE.Fog(0xcfd8de, 25, 50);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
camera.position.set(7, 7.5, 10);
camera.lookAt(0, 2.6, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 1.6));
const sun = new THREE.DirectionalLight(0xfff2dd, 2.2);
sun.position.set(5, 12, 7);
scene.add(sun);
const table = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.4, 64), new THREE.MeshStandardMaterial({ color: 0x5a3e2b, roughness: 0.8 }));
table.name = 'table';
table.position.y = -0.2;
scene.add(table);

// A block: a 1 x 0.6 profile with chamfered edges, pushed out to its length.
const profile = new THREE.Shape();
const c = 0.06, w = 0.48, h = H / 2 - 0.01;
profile.moveTo(-w + c, -h); profile.lineTo(w - c, -h); profile.lineTo(w, -h + c); profile.lineTo(w, h - c);
profile.lineTo(w - c, h); profile.lineTo(-w + c, h); profile.lineTo(-w, h - c); profile.lineTo(-w, -h + c);
const blockGeometry = new THREE.ExtrudeGeometry(profile, { depth: LEN - 0.02, bevelEnabled: false }).translate(0, 0, -(LEN - 0.02) / 2);
const woods = [0xd9b47c, 0xcfa56a, 0xe2c08c].map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.75 }));

const along = layer => layer % 2 === 0 ? 'x' : 'z';   // even layers lie along x, odd along z
function placeMesh(layer, slot) {
  const mesh = new THREE.Mesh(blockGeometry, woods[(layer + slot) % 3]);
  mesh.name = `block ${layer}-${slot}`;
  mesh.userData = { layer, slot };
  const offset = slot - 1;
  if (along(layer) === 'x') { mesh.rotation.y = Math.PI / 2; mesh.position.set(0, H / 2 + layer * H, offset); }
  else mesh.position.set(offset, H / 2 + layer * H, 0);
  scene.add(mesh);
  blocks.set(`${layer}-${slot}`, mesh);
}

function start() {
  for (const m of blocks.values()) m.removeFromParent();
  blocks.clear();
  if (fall) fall.pivot.removeFromParent();
  layers = []; pulled = 0; fall = null;
  for (let l = 0; l < START_LAYERS; l++) { layers.push([true, true, true]); for (let s = 0; s < 3; s++) placeMesh(l, s); }
  scene.updateMatrixWorld();   // so a click before the first render still finds the blocks
}

// The slot axis of a layer is the one its three blocks sit side by side on: z for even layers, x for odd.
function lean() {
  for (let l = 0; l < layers.length - 1; l++) {
    const slots = [0, 1, 2].filter(s => layers[l][s]);
    let mass = 0, sum = 0;
    for (let a = l + 1; a < layers.length; a++) for (let s = 0; s < 3; s++) {
      if (!layers[a][s]) continue;
      mass++;
      sum += along(a) === along(l) ? s - 1 : 0;   // a crossed block's centre is on the axis
    }
    const com = sum / mass, lo = slots[0] - 1.5, hi = slots[slots.length - 1] - 0.5;
    if (com < lo) return { layer: l, past: lo - com, side: -1, edge: lo };
    if (com > hi) return { layer: l, past: com - hi, side: 1, edge: hi };
  }
  return null;
}

function pull(layer, slot) {
  const top = layers.length - 1, full = layers[top].every(Boolean);
  if (fall || !layers[layer]?.[slot] || layer >= top - (full ? 0 : 1)) return false;   // not the top layer, nor the one under a part-built top
  if (layers[layer].filter(Boolean).length === 1) return false;   // nor a layer's last block
  layers[layer][slot] = false;
  blocks.get(`${layer}-${slot}`).removeFromParent();
  blocks.delete(`${layer}-${slot}`);
  pulled++;
  if (full) layers.push([false, false, false]);
  const t = layers.length - 1, free = layers[t].indexOf(false);
  layers[t][free] = true;
  placeMesh(t, free);
  const tip = lean();
  if (tip) topple(tip);
  return true;
}

// Everything above the failing layer turns as one about the edge it went past, faster each frame, until it leans
// on what is left: its far corner drops the layer's height across the gap.
function topple(tip) {
  const axis = along(tip.layer) === 'x' ? 'z' : 'x';   // the slot axis
  const pivot = new THREE.Group();
  pivot.name = 'falling';
  pivot.position.y = (tip.layer + 1) * H;
  pivot.position[axis] = tip.edge;
  scene.add(pivot);
  for (const mesh of [...blocks.values()]) if (mesh.userData.layer > tip.layer) pivot.attach(mesh);
  const gap = 1.5 - tip.side * tip.edge;
  fall = { ...tip, axis, pivot, angle: 0, spin: 0, stop: Math.asin(Math.min(1, H / gap)), moving: pivot.children.length };
}

function step(dt) {
  if (!fall || fall.angle >= fall.stop) { if (fall) fall.moving = 0; return; }
  fall.spin += 4 * dt;
  fall.angle = Math.min(fall.stop, fall.angle + fall.spin * dt);
  // a positive turn about x tips the top towards +z; about z, towards -x
  if (fall.axis === 'z') fall.pivot.rotation.x = fall.side * fall.angle;
  else fall.pivot.rotation.z = -fall.side * fall.angle;
}

const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
addEventListener('pointerdown', e => {
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  const hit = ray.intersectObjects([...blocks.values()])[0];
  if (hit) pull(hit.object.userData.layer, hit.object.userData.slot);
});
addEventListener('keydown', e => { if (e.key === 'r') start(); });
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

const hud = document.getElementById('hud');
start();
let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  hud.textContent = fall ? `The tower tipped after ${pulled} blocks. R to build it again` : `Blocks moved: ${pulled} · click a block to pull it`;
  renderer.render(scene, camera);
});

const r2 = n => Math.round(n * 100) / 100;
window.__game = {
  describe: () => ({ name: 'tower', units: 'block widths', keys: { r: 'build the tower again' }, actions: { pull: '{ layer, slot }: pull that block and put it on top' } }),
  observe: () => ({ layers: layers.length, top: layers.at(-1).filter(Boolean).length, pulled,
    tipped: fall ? { layer: fall.layer, past: r2(fall.past), degrees: r2(fall.angle * 180 / Math.PI) } : null, moving: fall?.moving ?? 0 }),
  act: ({ key, down = true, action, layer, slot }) => { if (action === 'pull') pull(layer, slot); else if (key === 'r' && down) start(); },
  setState: () => {},
};
</script>
</body></html>
```

Save it as `index.html` beside a `node_modules` folder with three in it (`npm install three`). Each block has a `name` (`block 3-1` is layer 3, place 1), because the tools report objects by name, and `window.__game` hands the tools the layer count, the number of blocks pulled and, once it tips, which layer gave way, how far past its edge the weight went and the angle.

## The calls

These replies are from paprika3d's MCP server on this page, captured on 2026-11-12 on a Linux machine with no graphics card, where Chrome draws WebGL in software. Paths are shortened to `<project>` and `<run>`, and long replies are cut to the lines discussed, with nothing reworded.

**1. Open it.** The reply carries the game's `describe()`, and names the software renderer:

```text
open {"url": "index.html", "cwd": "<project>"}

Opened http://127.0.0.1:35773/index.html in 0.2 s, paused at frame 0.
GPU: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). A software renderer (no GPU): frame times here say nothing of a real GPU's.
Page text outside the canvas: none
{"name":"tower","units":"block widths","keys":{"r":"build the tower again"},"actions":{"pull":"{ layer, slot }: pull that block and put it on top"}}
```

**2. Look at it.** Blocks that share a layer are grouped on one line, `block 3-*` for layer 3's three:

```text
look {}

Picture: <project>/paprika3d/runs/<run>/look-1.png
On screen (28):
table 40% [0, 365, 1279, 799] 18 × 18 units
block 8-* ×3 3.2% [447, 138, 821, 262] 2.98 × 0.96 units
block 6-* ×3 1.9% [454, 263, 815, 380] 2.98 × 0.96 units
block 4-* ×3 1.7% [461, 359, 809, 489] 2.98 × 0.96 units
block 7-* ×3 2% [451, 212, 818, 323] 2.98 × 0.96 units
block 2-* ×3 1.5% [467, 449, 804, 589] 2.98 × 0.96 units
block 5-* ×3 1.8% [458, 312, 812, 436] 2.98 × 0.96 units
block 0-* ×3 1.3% [473, 534, 798, 682] 2.98 × 0.96 units
block 3-* ×3 1.6% [464, 406, 806, 541] 2.98 × 0.96 units
block 1-* ×3 1.4% [470, 493, 801, 637] 2.98 × 0.96 units
Never visible: none
```

To aim a click at one block, `look` with `at` lists what is drawn under given pixels, nearest first; the two points used next landed on `block 3-0` and `block 3-1`, the ends of layer 3 facing the camera.

**3. Pull two blocks from one layer.** Two clicks ten frames apart, then 30 frames to let it settle. `trace` follows two values from `observe()` frame by frame, and `look: true` adds the picture at the end:

```text
interact {"steps": [{"mouse": "click", "x": 495, "y": 460}, {"wait": 10}, {"mouse": "click", "x": 562, "y": 475}, {"wait": 30}], "trace": ["moving", "tipped.degrees"], "look": true}

{"changed":{"layers":10,"top":2,"pulled":2,"tipped":{"layer":3,"past":0.56,"degrees":17.46}}}
mouse click at (495, 460): over block 3-0 (Mesh, 12.9 units)
mouse click at (562, 475): over block 3-1 (Mesh, 12.2 units)
moving: 0 → peak 17 at frame 12 → 0 at frame 35; first changed at frame 12
tipped.degrees (in observe() from frame 12): 0.06 → 17.46 at frame 34; first changed at frame 13
Picture: <project>/paprika3d/runs/<run>/look-2.png
Pixels: brightness 57%, colour saturation 36%, 0% near black, 0% blown out; 10% of the picture changed since the last look.
On screen (28):
block 3-2 1.3% [600, 398, 806, 541] 2.98 × 0.96 units
block 9-* ×2 1.6% [386, 109, 679, 225] 2.98 × 0.96 units
```

Each click names the block under it, so there is no guessing which one the pixel hit. Two pulls left layer 3 with one block at its side, the weight above it 0.56 block widths past that block's edge, and on the frame of the second click all 17 blocks above it started to move together. They stopped at 17.46 degrees, leaning on layer 2, by frame 35. Pull the far end block (place 2) in place of the middle one, from a fresh load, and the middle block holds the tower up: nothing tips and nothing moves.

```text
interact {"steps": [{"mouse": "click", "x": 495, "y": 460}, {"wait": 10}, {"mouse": "click", "x": 635, "y": 500}, {"wait": 30}], "trace": ["moving"]}

{"changed":{"layers":10,"top":2,"pulled":2}}
mouse click at (495, 460): over block 3-0 (Mesh, 12.9 units)
mouse click at (635, 500): over block 3-2 (Mesh, 11.7 units)
moving: 0 throughout the 42 frames
```

**4. Count what a frame draws.** `perf` loads the page again and samples it, so these are the standing tower's counts; tipping moves meshes and adds none. On this machine the frame time is software rendering, and the reply says so: read the counts, not the milliseconds.

```text
perf {"costs": true}

114.5 ms median frame (p95 126.5 ms, 9 fps on average), 28 draw calls, 1012 triangles, 0 MB assets; over budget: frameMs 114.5 of 16.7 ms; desktop budget; software renderer (no GPU): frame time is no budget signal, do not optimize for it
Costs by named group: the main scene's visible objects, each under its nearest named ancestor as `look` names it, counted, not timed, and with no frustum culling (the frame draws only what its camera sees, plus a shadow pass per casting light); `variants` with `hide` times a group. In all 1012 triangles, 0 casting shadows, 28 draw calls, 0 MB of textures:
  table: 256 triangles, 0 casting shadows, 1 draw calls, 0 MB of textures
  block 0-0: 28 triangles, 0 casting shadows, 1 draw calls, 0 MB of textures
```

One draw call per block and one for the table: 28 in all, inside the desktop budget. On a machine with a GPU, the same call measures real frame times against 16.7 ms.

**5. Build the block as a model.** Where Blender MCP would model the block in Blender, `model_run` builds it in a modelling scene the server keeps, with Manifold in scope as `geo`. This is the page's chamfered profile pushed out to the block's length, measured and saved:

```text
model_run {"cwd": "<project>", "code": "const { CrossSection, toGeometry } = geo;\nconst c = 0.06, w = 0.48, h = 0.29;\nconst profile = CrossSection.ofPolygons([[[-w + c, -h], [w - c, -h], [w, -h + c], [w, h - c], [w - c, h], [-w + c, h], [-w, h - c], [-w, -h + c]]]);\nconst solid = profile.extrude(2.98, 0, 0, [1, 1], true);\nprofile.delete();\nconst block = new THREE.Mesh(toGeometry(solid), new THREE.MeshStandardMaterial({ color: 0xd9b47c, roughness: 0.75 }));\nsolid.delete();\nblock.name = \"block\";\nscene.add(block);\nreturn [stats(block), await save(\"models/block.glb\", block)];"}

No asset search on record for "block": asset_search (57,732 free models, searched by a reference crop) usually looks better than a model built in code.
[{"kind":"stats","meshes":[{"name":"block","type":"Mesh","vertices":48,"triangles":28,"bounds":{"min":[-0.48,-0.29,-1.49],"max":[0.48,0.29,1.49],"size":[0.96,0.58,2.98]},"attributes":["position:3","normal:3"],"closed":true,"openEdges":0,"parts":1,"volume":1.638,"genus":0,"material":["MeshStandardMaterial"]}],"total":{"meshes":1,"vertices":48,"triangles":28}},{"saved":"models/block.glb","bytes":2596,"triangles":28}]
Saved models/block.glb (3 KB, 28 triangles). The game loads it with:
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const model = (await new GLTFLoader().loadAsync("models/block.glb")).scene; // where it stood in the modelling scene
scene.add(model);
```

The solid is closed, 28 triangles like the page's own block, and the reply ends with the lines that load it. The first line is the server suggesting its model search, which suits a model a person would recognise better than one built in code.

## What paprika3d does not do

- **It drives no engine.** It does not open the Unity, Godot, Unreal or Blender editor, and a game made in one of them is not a three.js page; their own MCP servers, above, are the ones for that.
- **It has no editor to drag things in.** Scenes and models are code the agent writes; `model_run` keeps a modelling scene between calls, but there is no window to arrange objects by hand.
- **Frame times here are not a GPU's.** On a machine with no graphics card Chrome draws in software, and every `open` and `perf` reply says so.
- **It does not decide whether the game is fun.** It reports what happened on each frame; whether pulling blocks is a good game is yours to judge.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): keys on exact frames, the state after them, and checks that rerun.
- [Screenshot a three.js scene headless](/guides/screenshot-threejs-scene-headless): the picture and the named objects on screen.
- [MCP server for 3D modeling with three.js](/guides/mcp-server-3d-modeling-threejs): the modelling scene, four views and a GLB, beside Blender MCP.
- [Do I need a game engine to make a game?](/guides/do-i-need-a-game-engine): what a browser and three.js give a first game.
- [Measure three.js draw calls and FPS](/guides/threejs-fps-draw-calls): what `perf` reads, and finding what costs the frame.
