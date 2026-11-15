---
title: Export three.js to Unreal Engine 5 with the scene, its shaders and postprocessing accounted for
phrase: export three.js to unreal engine
description: How a coding agent exports a three.js scene to Unreal Engine 5 with the paprika3d plugin: the scene saved as a .glb whose manifest names every object, the fog, tone mapping and bloom, and each feature a glTF import drops (custom shaders, Lambert materials, hemisphere light, postprocessing, game code) with its Unreal stand-in, then a Python script that imports it into a level through Interchange and reports what matched.
meta: Export a three.js scene to Unreal Engine 5: a .glb with a manifest of what the import drops, and a Python script that imports it into a level.
intent: threejs-to-unreal
queries:
  - "export three.js scene to unreal engine"
  - "three.js to unreal engine 5"
  - "import gltf from three.js into unreal"
author: paprika3d agent
date: 2026-11-12
review: weekly
reviewed: 2026-11-12
---
# Export three.js to Unreal Engine 5 with the scene, its shaders and postprocessing accounted for

## What moves and what does not

A three.js game is a scene graph plus the JavaScript that runs it. Unreal reads the first part well: its Interchange importer takes glTF and GLB files, and a GLB written by three.js's `GLTFExporter` carries meshes, physically based materials, textures, instanced meshes, skinned meshes, animation clips, directional, point and spot lights, and cameras. The second part has no file format. Custom `ShaderMaterial` code, `onBeforeCompile` edits, an `EffectComposer` with bloom or film grain, particles drawn as points, the input handling, the HUD, the sound and the physics stay behind, and the exporter drops several of them with a console warning and nothing more.

So a move to Unreal is an asset and scene handoff, not a port. The useful part for a coding agent is knowing exactly what was dropped and what to rebuild it as, so the Unreal side starts from a list instead of a surprise.

paprika3d is a Claude Code plugin and MCP server that opens a three.js page in its own headless Chrome, finds the page's renderer and scene with no change to the page, and runs JavaScript in it with `eval`. The `fx.js` file its `open` tool puts in the project holds `handoff`, which writes the scene as a GLB with a manifest of what an engine import keeps and loses, and `unrealScript`, the Unreal Editor Python that imports it.

## Install

paprika3d needs Google Chrome and Node 20.11 or later, and the Claude Code plugin needs Claude Code 2.1.118 or later.

```bash
claude plugin marketplace add Keeno-Corp/paprika3d
claude plugin install paprika3d@paprika3d
```

## The page

A small harbour: water drawn by a custom shader, a dock, a row of crates as one instanced mesh, a buoy with a Lambert material, a hemisphere sky light, a sun and fog.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Harbour</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js","three/addons/":"./node_modules/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9cc4e4);
scene.fog = new THREE.Fog(0x9cc4e4, 20, 60);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 200);
camera.position.set(8, 5, 10);
camera.lookAt(0, 0, 0);

const sky = new THREE.HemisphereLight(0xdfefff, 0x4a6a40, 1.5);
sky.name = 'sky';
const sun = new THREE.DirectionalLight(0xfff2dd, 2);
sun.name = 'sun';
sun.position.set(6, 10, 4);
scene.add(sky, sun);

// Water: a custom shader, which no engine file can carry.
const water = new THREE.Mesh(new THREE.PlaneGeometry(40, 40, 64, 64).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader: 'uniform float time; void main() { vec3 p = position; p.y += 0.1 * sin(p.x + time); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
  fragmentShader: 'void main() { gl_FragColor = vec4(0.1, 0.4, 0.6, 1.0); }',
}));
water.name = 'water';
scene.add(water);

const dock = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 2), new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.9 }));
dock.name = 'dock';
dock.position.set(0, 0.3, 0);
scene.add(dock);

// Crates, one instanced mesh.
const crates = new THREE.InstancedMesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xb8864b }), 6);
crates.name = 'crates';
const m = new THREE.Matrix4();
for (let i = 0; i < 6; i++) crates.setMatrixAt(i, m.makeTranslation(-2.2 + i * 0.9, 0.85, (i % 2) * 0.5 - 0.25));
scene.add(crates);

// A buoy with a Lambert material: glTF has no Lambert, so it arrives as PBR.
const buoy = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 16), new THREE.MeshLambertMaterial({ color: 0xd8402a }));
buoy.name = 'buoy';
buoy.position.set(4, 0.2, 3);
scene.add(buoy);

renderer.setAnimationLoop((now) => {
  water.material.uniforms.time.value = now / 1000;
  buoy.position.y = 0.2 + 0.1 * Math.sin(now / 700);
  renderer.render(scene, camera);
});
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
</script>
</body></html>
```

## The tool calls, in order

Each call is followed by the reply paprika3d gave for this page on 2026-11-12, trimmed to the lines that matter here.

**1. Open the page.**

```text
open {"url": "index.html", "cwd": "<project>"}

Opened http://127.0.0.1:46199/index.html in 0.2 s, paused at frame 0.
{"three":"186","scenes":1,"entities":["sky","sun","water","dock","crates","buoy"]}
```

**2. Write the scene as a GLB with its manifest.** `handoff` takes the scene and, when the page has them, its `renderer` (for tone mapping and exposure), its `composer` (for bloom and the passes no file can carry) and its animation clips. `save` writes the bytes into the project.

```text
eval {"code": "const { handoff } = await import('./fx.js'); return handoff(scene, { renderer });", "save": "export/scene.glb"}

Saved export/scene.glb (206 KB, application/octet-stream)
warn: THREE.GLTFExporter: Only directional, point, and spot lights are supported. [object HemisphereLight]
warn: GLTFExporter: THREE.ShaderMaterial not supported.
log: handoff: 6 named objects; dropped: ambient and hemisphere light; ShaderMaterial (custom GLSL); MeshLambertMaterial (approximated as PBR); game code, input, UI, audio and physics
```

The manifest sits in the GLB's `asset.extras.paprika3d`, where any glTF reader ignores it. For this page it lists the six named objects with their kinds (the crates as `instanced` with their count), the fog colour and distances, the tone mapping and exposure, and one entry per dropped feature with the objects it was on and what to use in Unreal: a Material graph for the water's shader, a Sky Light for the hemisphere light, a check of the imported Material Instance for the buoy, and Blueprints or C++ for the game code.

**3. Write the Unreal import script.**

```text
eval {"code": "const { unrealScript } = await import('./fx.js'); return unrealScript();", "save": "export/import_unreal.py"}

Saved export/import_unreal.py (5 KB, text/x-python)
```

## In Unreal

Copy the `export` folder anywhere the editor can read. In the Unreal Editor's Output Log, switch the command box to Python and run the script; with the Unreal MCP server enabled, an agent runs the same line through its Python tool.

```text
py "C:/Harbour/export/import_unreal.py"
```

The script reads the manifest from the GLB, imports the scene into the open level under `/Game/scene` with `InterchangeManager.import_scene`, waits for the import, tags every new actor whose label matches a manifest name with `paprika3d`, adds an unbound PostProcessVolume for bloom and exposure and an Exponential Height Fog when the page had them, saves the level, and prints one line starting `paprika3d` with a JSON report: how many actors were imported, which manifest names matched and which are missing, what it added, and the list of features to rebuild. A second argument picks another content folder.

It goes through Interchange in Python rather than the Unreal MCP's own mesh import tool, which a public Unreal agent harness reports accepts FBX and OBJ but not GLB.

## What to rebuild by hand

- The water: a Material graph with a panning normal map, or the Water plugin.
- Points and sprites: a Niagara system.
- Postprocessing passes other than bloom: PostProcessVolume settings or a post-process Material.
- Game code, input, the HUD, sound and physics: Blueprints or C++, using the game's design doc for what each part does.

Unreal converts glTF's metres and Y up to its centimetres and Z up on import, so sizes and positions match the page.
