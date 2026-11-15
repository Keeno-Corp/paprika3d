---
name: threejs-game
user-invocable: false
description: Runs, sees, plays, measures and speeds up any three.js, React Three Fiber or WebGL page as you build it - a game, a product viewer or configurator, a simulation, a shader or post-processing demo - in headless Chrome on a paused, seeded clock - what is on screen and what never appears (a model at the wrong scale, out of view or not loaded), frame-exact keyboard, mouse and touch input, the page state as JSON, mesh stats, feel and frame-time measurements. Use it, rather than a Playwright or Chrome DevTools script, to build and check the page in Chrome or Firefox whenever the user asks to make, fix, test, extend, screenshot or profile a three.js or WebGL page, new or existing; a Playwright suite still fits CI runs, real devices and multiplayer.
---

# Building and testing a three.js game with the harness

The harness runs the game in a headless Chrome on a paused, seeded clock: you send inputs frame by frame and read back the game's state as JSON, so what you see is exact and repeatable.

**The goal is the highest-quality result for what the user asked: how it looks, plays and feels.** A reply with no fault lines is the floor, not the finish. Decide what to improve from the request and from your own picture of the page: what it is, what a viewer should feel, and what is missing in the scene, in the HUD, menus and text a viewer reads, and in each control and feature the request names. Work that out before you look; a look then shows whether a change worked. Do not take the next idea from the screenshot: that patches what it shows and keeps the weak decisions under it. A fault line or a glitch is different: close those one at a time with the method in `references/lighting.md`.

## Build first, then polish

**Write the page whole and make the first version as impressive as you can: interesting, detailed, creative.** Take risks in the code: the tools below find and fix what breaks cheaply, so a bold build that needs polishing beats a safe one that needs growing. Give it a `window.__game` following the convention below; `templates/` beside this file shows the shape in a working page: `plain.html` (one page, an import map, no build, set up with `stage()`), `viewer.html` (a product configurator: `references/configurator.md`), `r3f.tsx` (React Three Fiber under vite) and `rapier.ts` (the `window.__game` bridge for a Rapier world, with either). An existing game works as it is; add `window.__game` when you need its state.

## Before building a thing in code: references and the library

A new page starts with `paprika-make`'s brief (`../paprika-make/SKILL.md`, `${CLAUDE_PLUGIN_ROOT}/skills/paprika-make/` in Claude Code): references, the sheets, then the picking round for the key assets (`../paprika-make/sheets.md`, "The picking round"). Follow it when it is there. In a plain MCP session (`npx paprika3d serve` with no plugin, or no person to ask), take its slice that needs no person:

1. **List the things a viewer will notice**: the player and characters, creatures, vehicles, buildings, furniture, plants, hero props, and the ground, walls and sky.
2. **Search the library for each before any code builds it**: `asset_search` (84,249 CC BY or CC0 models, 3,747 PBR textures and 1,434 HDRI skies) with the style words in the query ("low poly fox"; detailed models, scans and PBR packs, rank above blocky low-poly and voxel kits unless the query or `style` asks for that look), `image` and `crop` where a reference picture shows the thing, `kind: "texture"` for a surface, `kind: "hdri"` for a sky. A hit that is not the thing goes in `not` on one more search.
3. **`pick` the close hit**: it saves the file, gives the code that loads it at real size, and writes a model's credit line (name, author, licence, URLs) to `CREDITS.md`. Keep that file with the assets, and show CC BY lines where the page credits its work (a credits screen, the README).
4. **Build in code what no search found** and what the design makes by rule (terrain, a track, tiles, blocks, pickups): `model_run`, `geo.js`, `fx.js`. `model_run`'s `searched` says why ("by design: terrain", "hover bike: nothing fit"); a project that kept CHARACTERS.md gets each thing's Source line there.

## What each tool shows

Every option of these tools: `references/tools.md`.

- **`open`** runs the page: `cwd` (the project's absolute path, always) with `url: "index.html"` for a plain page (served over HTTP; a file:// page cannot import modules), or `command: "bunx vite"`. One open is enough: after each edit the next tool call reloads the page. `browser: "firefox"` runs Firefox; there is no Safari engine.
- **`interact`** plays inputs frame by frame and returns the state: a `{ state }` step sets a moment up, `trace` and `until` time a change, `save` keeps a play as a check the after-edit hook reruns (`test` on demand), `record` keeps a real-time GIF. `Controls:` flags camera/input disagreement; `Contact:` flags deep body overlap. A slow held direction adds a `Response` line: frames to full speed from standing, reversing and a 90° cut, measured on a separate page.
- **`look`** shows what a viewer sees, what is on screen and what never appears; `sheet`, `cameras`, `opening`, `zoom` and `sample` show more. `Skinned scale:` flags uneven character scaling. Its `Lighting:`, `Surfaces:`, `Surface:` and `HTML over the canvas:` lines, and how to close a fault: `references/lighting.md`.
- **`reference`** reads a picture the page should match (a crop with a grid, colours at points) and with `compare: true` sets the page's look beside it.
- **`eval`** inspects the scene or tries a change before it goes into the source; what it changes vanishes on reload. Code that awaits a frame steps the clock; `save` writes what it returns into the project.
- **`feel`** plays the inputs that cause an event and says what reacted: how to check an event the request says should feel like something.
- **`send_feedback`** tells the paprika3d team about a snag with the harness itself (a wrong or unclear reply, a tool that hung, a helper the skill names that is missing): use it, not the client's own feedback command (Claude Code's `/feedback` goes to Anthropic), then carry on. A reply that starts `Not sent` (past its 20 a session, or refused) names the fallback: `gh issue create -R Keeno-Corp/paprika3d -t "agent-report: <summary>"`.
- **Subagents** open the game under their own name (`game: "tester"`) and pass it to every paprika tool call; up to 4 games are open at once, and calls for different games run at the same time.

Which calls keep the page where the last call left it, and which reload it first:
- Carry on from the page as it is: `interact`, `eval`, `observe`, and a plain or `zoom` `look`.
- Start from a fresh reload at frame 0, as `open` does: `feel`, `test`, `perf`, an `interact` with `save`, and the `sheet`, `viewports`, `scroll`, `opening` and `compare` looks.

## Game state

`plain.html` keeps its state in plain variables, enough for a small game. Use game-state when the game has physics, many entities, or needs rewind. It writes `window.__game` for you. Before writing game code that uses it, copy `game-state.js` next to the entry file from the folder `open` names (its `game-state.js and physics-worker.js are in` line; `${CLAUDE_PLUGIN_ROOT}/state/dist/` in Claude Code), and for a game that calls `physics()` also `physics-worker.js`. Import from `./game-state.js`; `three` stays the game's own import. Then read `references/state.md` for its API and its Rapier beside the project's own; for Rapier's character controller, the header of `templates/rapier.ts`.

## WebGPU

For a WebGPU game, map `three` and `three/webgpu` (which the TSL addons import) to the WebGPU build, and `three/tsl` beside them: `{"imports":{"three":"./node_modules/three/build/three.webgpu.js","three/webgpu":"./node_modules/three/build/three.webgpu.js","three/tsl":"./node_modules/three/build/three.tsl.js","three/addons/":"./node_modules/three/examples/jsm/"}}` in a plain page; under vite, `import * as THREE from "three/webgpu"`. The tools run a WebGPU page as they run a WebGL one.

- `new THREE.WebGPURenderer({ antialias: true })` falls back to WebGL 2 where WebGPU is missing. Draw from `renderer.setAnimationLoop(frame)`, or `await renderer.init()` before the first `render`. `stage()` makes a `WebGPURenderer` when `three` is the WebGPU build (`references/fx.md`); game-state does not depend on the renderer.
- Materials are node materials. The usual `MeshStandardMaterial` and the other built-in materials work as they are; custom shading goes in TSL nodes (`import { Fn, uniform, positionLocal, time, sin } from "three/tsl"`) on a `MeshStandardNodeMaterial`'s `colorNode`, `positionNode` or `normalNode`. `ShaderMaterial`, `RawShaderMaterial` and `onBeforeCompile` do not run there.
- Compute: `const pos = instancedArray(count, "vec3")`, a kernel `const move = Fn(() => { const p = pos.element(instanceIndex); p.addAssign(vec3(0, 0.01, 0)); })().compute(count)`, `renderer.compute(move)` once a frame, and `material.positionNode = pos.element(instanceIndex)` on an `InstancedMesh` (or `Sprite` with `count`) to draw it.
- Post-processing is a `THREE.RenderPipeline(renderer)` instead of `EffectComposer`: `const scenePass = pass(scene, camera), color = scenePass.getTextureNode("output"); pipeline.outputNode = color.add(bloom(color))` (`bloom` from `three/addons/tsl/display/BloomNode.js`), then `pipeline.render()` each frame in place of `renderer.render`; `post()` in `fx.js` builds it (bloom, depth of field, ambient occlusion, motion blur, grade, vignette) in one call, with an `EffectComposer` on a `WebGLRenderer`.

## Performance, models, geometry and effects

- A `Lights:` line in `open`'s reply names a scene with many lights (`perf` says what they cost), and a "Slow start" line a setup a software-rendered browser can take minutes over; a page with no "Slow start" line that runs smoothly needs no performance work. Every page draws a plain first frame and adds its effects (`water()`, `foliage()`, `post()`, scan materials, a noise sky, shadows, GPU simulation) after it, each in its own small `compileAsync` batch: `references/optimize.md`, Load time. `perf` with `optimize: true` is for a frame `perf` says is over budget, or a user who asks (stutter, low fps): `references/optimize.md`.
- `model_audit` reports each `.glb`, `.gltf` or USD file with a verdict for a website or a Shopify listing, and `shrink` rewrites one smaller; `asset_search` finds ready-made models, PBR textures and HDRIs and puts the one picked into the project with its loading code, searched before anything is built in code (above): `references/assets.md`. A configurator's variants in one picture, and when to hand the URL to Chrome DevTools or Lighthouse: `references/configurator.md`.
- `model_run` and `model_look` are a modelling scene the server keeps between calls, as Blender is to a game: code with `THREE`, Manifold (`geo`) and `scatter` builds a model, `model_look` shows it from four sides with each mesh's measurements, and `save` writes it into the project. Geometry the game makes while it runs is built in the page with `geo.js`, which `open` puts in the project (`import { geo, scatter } from "./geo.js"`, the same API). Recipes, `stats` checks and pitfalls: `references/geometry.md`.
- `open` also puts `fx.js` in the project: lights and camera (`stage`), textures, terrain, placement, sound, particles, shake and more, seeded, with no files to load: `references/fx.md`.

## The `window.__game` convention

Once the page has loaded, it exposes:

```js
window.__game = {
  describe(),        // a short description: name, controls, units
  observe(),         // the state, as plain JSON
  act(input),        // performs one input object: { key, down? } or { action, ...args }
  setState(partial), // sets any of observe()'s keys; keys left out keep their values
  subject,           // optional: the name of the object the game is about
  intentional,       // optional: what look should not flag again
};
```

`observe`, `look` and `perf` work on any three.js page; `window.__game` makes the state exact. The optional keys and each rule below in full: `references/tools.md`.

### Rules

- **Start.** The game plays as soon as the page loads: no title screen, no click to start, nothing over the first frame (loading text, a dim veil, a fade). `open` pauses at frame 0. A title screen the user asks for puts `started` in `observe()` and `setState`, so a `{ state: { started: true } }` step skips it.
- **Time.** The harness steps frames of 1/60 s on a fake clock (`requestAnimationFrame`, `performance.now`, `Date`, timers, CSS animations and transitions). Advance the game by each frame's elapsed time, at most 0.1 s a frame. A fixed step (physics, rewind) runs in an accumulator and draws between its last two steps (`prev + (cur - prev) * acc / STEP`), or movement stutters on a 100 or 120 Hz display. The clock reads 60 s at frame 0. Never read real time some other way.
- **Randomness.** A game-state game uses `state.random()`; a game that keeps its own state uses `Math.random`, which the harness seeds.
- **setState** takes effect at once, even before the first frame, and the game's start-up must not undo it. Objects merge; lists are replaced whole.
- **observe()** returns plain JSON, never three.js objects. Lists keep their order.
- **Keys** listen on `window` and match `event.code` (`KeyW`, `Space`). One-shot controls act on `keydown` and skip `event.repeat`; held controls last from `keydown` to `keyup`. Real key events and `act({ key })` go through the same function.
- **Names.** Give meshes a `name` (`player`, `coin`): `look` lists what is on screen by name. Put the main object's named parts under one named group and set `subject` to it.

`templates/plain.html` is a complete small game in this shape. In React, keep the state in a plain module and set `window.__game` in the Canvas's `onCreated` (`templates/r3f.tsx`).
