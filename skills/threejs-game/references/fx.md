# Game effects: fx.js

The `open` tool puts `fx.js` in the project root, next to `geo.js`. It holds a first-load setup (`stage`), canvas textures (`tex`), terrain and rule-based placement (`field`, `place`, `instances`), synthesized sound (`sfx`), particles (`burst`), camera shake (`shake`), metre-scale texture coordinates (`uv`), a reference picture's camera with its pixel-to-world maps (`picture`), a subtree baked to GLB bytes (`bake`), a scene handed off to a game engine (`handoff`, `unrealScript`), a picture's outlines and heights (`trace`, `heightfield`), a wave surface boats float on (`water`), wind-swayed grass, leaf and conifer-needle cards (`foliage`, sown with `sow` or `crown`), and post-processing for either renderer (`post`). `open` writes it again whenever the plugin's copy differs, but never over a newer version than its own (the first line names the version), so a project keeps the newest build's fx.js and the reply says which it kept. Pure JS with no files to load. Nothing in it reads `Math.random`: the same `seed` gives the same pixels, points, particles and samples. Never edit it; this page lists its API.

```js
import * as THREE from "three";
import { stage, tex, field, place, instances, sfx, burst, shake, uv, picture, bake, handoff, unrealScript, trace, heightfield, water, foliage, sow, crown, post } from "./fx.js";   // "../fx.js" from src/ in a vite project
```

## stage

`stage(container = document.body, { env, exposure, key, shadow, ground, background, fit })` returns `{ renderer, scene, camera, key, ground, fit }`. It gives ACES tone mapping, sRGB output, a pixel ratio capped at 2, a studio environment, a key light with a shadow, a ground, a camera (a `PerspectiveCamera` with a 40° vertical fov at (3, 2.5, 5) looking at the origin, near 0.1 and far 1000 until `fit`) and a resize that follows the container: the setup faults `look` names are already fixed. It starts no render loop. On a WebGPU page (`three` mapped to three.webgpu.js) the renderer is a `WebGPURenderer`, and the studio environment arrives once it has initialised (`setAnimationLoop` or `await renderer.init()`). A bundler building such a page warns that fx.js's `WebGLRenderer` import is undefined (`IMPORT_IS_UNDEFINED`): expected, that line is how `stage` picks the renderer, and nothing constructs a `WebGLRenderer` there.

- `env`: a colour for a flat environment, `false` for none; default the studio box. `exposure`: tone mapping exposure, default 1.
- `key`: key light intensity, default 1.5, `0` for none. `shadow`: default `true`.
- `ground`: default a shadow catcher (shows only shadows); a colour for a solid ground; `false` to bring your own.
- `background`: default `0xe8e8e8`; `null` is transparent.
- `fit(object or Box3, margin = 1.2)` frames the camera on the content from the direction it already looks along, sizes the key light's shadow camera to it and puts the ground under it; it returns the content's centre. Pass the content, not the scene. Call it again when the content grows.

```js
const { renderer, scene, camera, fit } = stage(document.body, { background: 0x1a2030, ground: false, key: 3 });
scene.environmentIntensity = 0.4;   // a game's own lit ground: the full studio light washes out the shadows
scene.add(level); fit(level);
renderer.setAnimationLoop(() => renderer.render(scene, camera));
```

Orbit controls are two lines of your own (the import map needs `"three/addons/"`):
`import { OrbitControls } from "three/addons/controls/OrbitControls.js"; new OrbitControls(camera, renderer.domElement).target.copy(fit(model));`

## picture

`picture({ position, lookAt, fov, size })` is the camera a reference picture was taken or painted from (its entry in `refs/cameras.json`; `fov` is the vertical field of view in degrees, `size` the picture's pixels) and the maps between the picture's pixels and the world, so what the picture shows is built where it stands. It returns `{ camera, at, ground, px, fit }`; the pose is kept, so moving `camera` later (OrbitControls) changes none of the maps.

- `at(px, py, depth)`: the world point under a picture pixel, `depth` metres in front of the camera. `ground(px, py, y = 0)`: the point under a pixel on the horizontal plane at `y`, or `null` above the horizon. `px(point)`: the picture pixel under a world point, or `null` behind the camera.
- `fit(width, height, cam = camera)` sets the camera to show the whole picture's frame on a canvas of that size: the picture's own view at its aspect, with room beside or above it otherwise. Call it on resize.

```js
const cams = await (await fetch("refs/cameras.json")).json(), pic = picture(cams["01.jpg"]);
const { camera, at, ground, px } = pic; pic.fit(innerWidth, innerHeight);
tower.position.copy(ground(1708, 742));          // its foot, where the picture has it on the ground
lantern.position.copy(at(1776, 250, 180));       // 180 m away, under that pixel
const [u, v] = px(tower.position);                // where the page puts it, to check against the picture
```

## bake

`bake(object, { animations })` is `object` and its children as GLB bytes (an `ArrayBuffer`), the root at its world transform, so a baked piece loads where it stood. `eval` with `save` writes it into the project: bake a geo.js solid once and load the GLB (no manifold wasm at load), or a mesh with a painted canvas texture. It loads `GLTFExporter` from `three/addons/`, which the import map must have.

```js
// eval { save: "assets/arch.glb" }
const { bake } = await import("./fx.js"); return bake(find("arch"));
```

## handoff, unrealScript

`handoff(scene, { animations, renderer, composer })` is `bake`'s GLB with a manifest in its `asset.extras.paprika3d`, for moving the scene into Unreal (or another engine): each named object and its kind, the animations, the fog, the renderer's tone mapping and exposure, the composer's bloom, and each feature a glTF import drops (ShaderMaterial and onBeforeCompile edits, node materials, non-PBR materials, points, sprites and lines, ambient and hemisphere light, RectAreaLight, light decay other than 2, environment maps, postprocessing passes, and always the game code) with where it was and its Unreal stand-in. It logs one `handoff:` line naming them. `unrealScript()` is a Blob of Unreal Editor Python that imports the GLB beside it through Interchange, tags the actors the manifest names, adds a PostProcessVolume and fog, saves the level and prints a `paprika3d {...}` JSON report (`../../threejs-to-unreal/SKILL.md`).

```js
// eval { save: "export/scene.glb" }
const { handoff } = await import("./fx.js"); return handoff(scene, { renderer });
// eval { save: "export/import_unreal.py" }
const { unrealScript } = await import("./fx.js"); return unrealScript();
```

## trace, heightfield

`trace(src, { colour, tolerance, invert, simplify, minArea, scale })` turns one colour of a picture (a URL, image or canvas) into `THREE.Shape`s with their holes, for `ShapeGeometry` or `ExtrudeGeometry`: the pixels within `tolerance` (RGB distance, 40) of `colour`, or with no colour every pixel off the background (the commonest corner colour); `invert` swaps them. Outlines are simplified to within `simplify` px (1), pieces under `minArea` px² (4) are dropped, and points are picture pixels × `scale` with y up. It returns `{ shapes, mask, width, height }`, `mask` the canvas it traced (white on black).

`heightfield(src, { size, height, base })` reads a picture's brightness as heights over a `size`-wide area centred on the origin (its depth by the picture's aspect, the picture's top toward -z): black at `base`, white at `base + height`. It returns a field like `field`'s, so `place({ on })` scatters on it, and once `geometry(segments)` has built the mesh its `heightAt` follows that mesh's triangles, so a player on a coarse mesh neither floats nor sinks.

```js
const { shapes } = await trace("refs/plan.png", { colour: "#1a1a1a", scale: 0.02 }); // walls drawn black, 1 px = 2 cm
scene.add(new THREE.Mesh(new THREE.ExtrudeGeometry(shapes, { depth: 3, bevelEnabled: false }).rotateX(-Math.PI / 2), wallMat));
const hills = await heightfield("refs/height.png", { size: 200, height: 30 });
scene.add(new THREE.Mesh(hills.geometry(128), grassMat));
```

## tex

A real-world surface (wood floor, stone wall, grass) is searched first with `asset_search` `kind: "texture"`, a CC0 PBR set with every map; `tex` is for stylised surfaces, labels and what no search finds.

Each builder returns a `THREE.CanvasTexture`. Colour maps come tagged sRGB; `normal` is a data map and is not. `noise`, `wood`, `bricks` and `windows` tile (`RepeatWrapping`), so set `map.repeat` or use `uv`. Colours are anything `THREE.Color` takes.

- `tex.noise({ size, scale, colors: [a, b], octaves, seed })`: stone, sand, grass, dirt. `scale` is blobs across.
- `tex.wood({ size, color, rings, seed })`, `tex.bricks({ size, rows, cols, brick, mortar, jitter, seed })`.
- `tex.windows({ size, cols, rows, lit, frame, glass, wall, seed })`: a facade, a seeded `lit` share of windows warm.
- `tex.label(text, { size, color, background, font, padding })`: text sized to its ink; `t.image.width / t.image.height` is its aspect.
- `tex.glow(color, { size, falloff, opacity })`: a radial blob, for a glow (additive) or a contact shadow (black). `falloff` is 0 to 1 (0.4), the share of the radius at which it is still a quarter strength; out of range is clamped.
- `tex.dots(text, { cols, rows, on, off, dot }, into)`: an LED display; pass the last texture as `into` to redraw it in place.
- `tex.normal(texture, { strength, invert })`: relief from brightness; bricks set `invert` for you.
- `tex.rng(seed)`: the seeded generator they use, for your own randomness.

```js
const map = tex.bricks({ rows: 8, cols: 4 }); map.repeat.set(4, 2);
wall.material = new THREE.MeshStandardMaterial({ map, normalMap: tex.normal(map) });
```

## field, place, instances

- `field(size, { seed, octaves, height, scale, base, basins: [[x, z, radius, depth]] })` is a height function centred on the origin: `{ area, heightAt(x, z), normalAt(x, z), geometry(segments) }`. Build the mesh with `geometry(segments)` before placing things, so `heightAt` follows the drawn triangles.
- `place(n, options)` scatters `n` random points that pass every rule (fewer, with a console error, when they do not fit); `place([nx, nz], options)` is a grid spanning `area` corner to corner. Options: `area: [x0, z0, x1, z1]`, `seed`, `on` (a field), `minHeight`, `maxHeight`, `maxSlope` (degrees), `avoid(x, z)`, `spacing`, `jitter` (grid), `edge` (grid border only), `scale: [min, max]`, `rotate` (true or a yaw), `tilt` (degrees), `stretch`. Each point is `{ x, y, z, ry, s, rx, rz, sx, sz }`.
- `instances(geometry, material, points, name)` turns the points into one named `InstancedMesh`.

```js
const land = field(100, { seed: 2, height: 5, basins: [[8, 6, 12, 7]] });   // a lake 7 deep at (8, 6)
scene.add(new THREE.Mesh(land.geometry(160), grassMat));
scene.add(instances(treeGeo, treeMat, place(150, { on: land, seed: 3, minHeight: 0, maxSlope: 30, scale: [0.8, 1.6], rotate: true }), "trees"));
```

## sfx

Sound effects synthesized in code (a port of ZzFX), no audio files. Presets: `coin`, `jump`, `hit`, `explode`, `shoot`, `laser`, `powerup`, `blip`, `bounce`, `thud`, `roll`.

- `sfx.play(sound, volume = 1, when = 0)`: a preset name or a params object, `when` seconds from now (a note sequence needs no `setTimeout`). Returns the source node (set `loop`, `playbackRate`, call `stop()`), or `undefined` when audio is locked or missing. It never throws for blocked audio; an unknown preset name throws.
- `sfx.define(name, params)` adds a preset. Params: `volume`, `frequency`, `attack`, `sustain`, `release`, `shape` (0 sine, 1 triangle, 2 saw, 3 tan, 4 noisy sine, 5 square), `slide`, `pitchJump`, `pitchJumpTime`, `repeatTime`, `noise`, `filter` (negative low-pass), `decay`, `sustainVolume`, `delay`, `bitCrush`, `tremolo`, `seed` and more.
- `sfx.check(sound)` returns `{ duration, peak, rms, clipped, hz }`: hear a sound through `eval` (`return (await import("./fx.js")).sfx.check("door")`: `sfx` is not in its scope). `peak` over 1 clips; noise reads as a high `hz`.
- `sfx.log` holds every play call `{ name, time, audible }`; `sfx.presets()` lists the names; `sfx.render(sound)` gives the samples.

```js
sfx.define("door", { frequency: 90, shape: 2, release: 0.3, slide: -1 }); sfx.play("door");
const r = sfx.play("roll"); if (r) { r.loop = true; r.playbackRate.value = speed; }   // a looping voice needs release: 0, as roll has
```

## burst and shake

`burst({ max = 500, seed = 1, size = 0.1, additive = true, ...defaults })` returns a `Burst`: one `THREE.Points` pool of soft round dots, positions in its own space. The other options are defaults for `emit`.

- `emit(at, { count, speed, life, gravity, drag, color, spread, up })` starts particles at a `Vector3`. Defaults: 20, 4 units a second, 1 s, 9.8 along -y (a number, or `[x, y, z]` for a z-up game), no drag, white, `spread` Math.PI (a sphere; it is the cone's half-angle around `up`), `up` +y (a `Vector3` or `[x, y, z]`). Past `max`, the rest are dropped; speed and life vary by up to half.
- `update(dt)` moves, ages and fades every particle; call it once per frame. `alive` is the live count.
- `shake(object, { seed = 1, decay = 6 })` returns `{ kick(strength), update(dt) }`: a seeded, decaying shake for a camera or any object. Call `update` after placing the object each frame.

```js
const sparks = burst({ max: 300, seed: 1, size: 0.1 }); sparks.name = "sparks"; scene.add(sparks);
sparks.emit(hit.point, { count: 40, speed: 6, spread: Math.PI / 4, color: 0xffaa33 });
const cam = shake(camera); cam.kick(0.3);
// each frame, after placing the camera: sparks.update(dt); cam.update(dt);
```

## uv

`uv(geometry, metresPerRepeat = 1, offset = 0)` writes box-projected texture coordinates in the geometry's own units, so one tiling texture shows at the same real size on a floor, a wall, terrain and geo.js's boolean output (which has no UVs). It returns the geometry; call it before the first render. `offset` shifts u by that many metres, so buildings sharing a `tex.windows` tile do not show the same lit windows.

```js
floor.geometry = uv(new THREE.BoxGeometry(6, 0.1, 5), 2);   // tex.wood repeats every 2 m
```

## water

`water({ preset, size, segments, wavelength, amplitude, waves, choppy, spread, speed, wind, color, deep, foam, seed, material, shore, shallow, shoreDepth, shoreFoam, flow })` is a Gerstner wave surface, `size` metres square (200) on its own x, z plane: presets `pond`, `lake`, `ocean` (default) and `storm` set the rest. The GPU draws the waves and the CPU answers for the same waves, so things float on the crest the player sees: `update(t)` once a frame with the game's seconds, then `height(x, z)` (world y of the surface), `normal(x, z)` and `float(object, lift)` (sets `object.position.y`; with a `flow`, first carries its x, z downstream). Its material is a `MeshStandardMaterial` (pass `material` options; under `WebGPURenderer` a `MeshStandardNodeMaterial` with the same waves), troughs tinted `deep`, breaking crests `foam` (`null` for none); `scene.environment` (`stage`) gives it its reflections. Move it freely; do not rotate or scale it. The grid draws only the waves its cells can sample (`size / segments` metres a cell; a wave under about six cells fades from the geometry, and `height()` follows what is drawn), and every pixel shades the full spectrum plus fine ripples, each wave fading into roughness as it nears a pixel's size; wave groups, gust patches and a slow bend of the crests keep a wide sea from repeating seen from the air. For a flight game, put a fine patch around the camera over a coarse, opaque far sea with the same `seed`.

Where land meets the water, pass the ground as `shore`: a height function `(x, z) => world y`, a `field` (`heightAt`), or a texture over the water's square whose red channel is the ground's height in metres above the water's rest level (negative below; u along +x, v along -z, like the plane's uv; a half-float `DataTexture` filters on both renderers). From the depth under each moving wave it tints the shallows `shallow` (the colour lifted toward turquoise) out to `shoreDepth` metres (4 x `amplitude`, at least 1.5) and foams the waterline out to `shoreFoam` metres deep (0 for none; `foam`'s colour, white on presets without one), on WebGL 2 and WebGPU alike. A function or field is sampled into a texture of up to 512 x 512 under the water's square, again whenever the water moves; the ground mesh still draws the land.

For a river, pass its current as `flow`, in metres per second: `[vx, vz]` for one current over all the water, a function `(x, z) => [vx, vz]` of world position, `{ along: curve, speed }` (a three.js `Curve` the river follows, its points' x, z; `speed` 1.5 by default) for a winding channel, or a `DataTexture` over the water's square (red vx, green vz; u along +x, v along -z). The waves, ripples and crest foam run downstream on WebGL 2 and WebGPU alike, and `height()`, `normal()` and `current(x, z)` (`[vx, vz]` there) answer for the same water. A uniform current moves the whole pattern; a varying one draws two copies of it, each carried for 2 s and fading in turn, so it never stretches. A function or curve is sampled into a texture of up to 256 x 256 under the water's square, again whenever the water moves. `float(object, lift, t, drift)` then moves the object with the current over the time since its last `float` (`drift` the share of the current: 1 by default, 0.5 for a boat that half fights it, 0 to hold it in place), so call it once a tick for each floating thing and give the river its own seconds through `update(t)`. Under 1.5 m/s reads as a lazy river, 3 to 5 as rapids.

```js
const sea = water({ preset: "ocean", size: 400, seed: 3 }); scene.add(sea);
// each frame
sea.update(t);
sea.float(boat, -0.2);                                   // hull sits 0.2 m deep
boat.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sea.normal(boat.position.x, boat.position.z)); // tilt with the swell (drop the yaw: multiply in your own)
const island = field(120, { height: 2, base: -3, basins: [[0, 0, 25, -8]] });   // a mound rising out of the sea at y = 0
const lake = water({ preset: "lake", size: 120, shore: island });   // shallow tint and waterline foam where it meets the mound
const river = water({ preset: "lake", size: 160, shore: banks, flow: { along: channel, speed: 3 } });   // channel: a CatmullRomCurve3 down the valley
river.float(log, 0.2);   // each tick: the log rides the waves and drifts down the channel
```

## foliage

`foliage({ kind, points, on, area, density, seed, size, color, tip, wind, strength, speed, backlight, sun, sunColor, fade, material, minHeight, maxHeight, maxSlope, avoid, scale })` is one InstancedMesh, named its `kind`, of alpha-cut cards drawn on a canvas: `grass` (default; two crossed cards of blades, base on the ground, lit like the ground) `leaves` (one card of leaves per point, for a crown or a bush) or `needles` (one spray of conifer needles per point, on a `crown` of `shape: "cone"`). `points` say where (`sow`, `crown` or `place`); with none it sows itself from the same options. The card tops lean downwind (`wind` [x, z], `strength` metres at full gust, `speed`) on the GPU, and `sway(x, z, t)` is the [dx, dz] the CPU reads for the same gust at a card standing at x, z, so a rustle sound or a hiding player can follow it. Cards between the camera and the `sun` (a `DirectionalLight`, re-read each `update`, or a direction) glow with it (`backlight`, 0 none), the way sunlit leaves and grass do. `thin(share)` draws the first `share` of the cards (they are in random order, so any share stays even): the density setting for a low-end machine; `fade` [near, far] metres from the camera thins them out to none at `far` (grass [35, 70], `null` never). Under `WebGPURenderer` its material is a `MeshStandardNodeMaterial` with TSL nodes, under `WebGLRenderer` a `MeshStandardMaterial`: the same wind either way. `update(t)` once a frame with the game's seconds. Move it freely; do not rotate or scale it.

`sow({ on, area, density, seed, minHeight, maxHeight, maxSlope, avoid, scale })` is `density` seeded points per square metre over `area` on `on`'s drawn surface, keeping those that pass the rules, in random order. `crown(n, { at, radius, seed, scale, shape })` is `n` leaf points for one tree: with `shape: "round"` (default) in the shell of an ellipsoid of `radius` [x, y, z] around `at`, each turned at random (a broadleaf crown or a bush); with `shape: "cone"` in drooping tiers on a cone `radius[0]` wide at `at.y - radius[1]` narrowing to its tip at `at.y + radius[1]`, each card pointing out along its branch (a spruce or fir, with `kind: "needles"`).

```js
const land = field(200, { seed: 2 }); scene.add(new THREE.Mesh(land.geometry(128), groundMaterial));
const { key: sun } = stage();                                           // its key light, or your own DirectionalLight
const grass = foliage({ on: land, density: 8, maxSlope: 30, maxHeight: 6, seed: 4, sun }); scene.add(grass);
const trees = place(12, { on: land, seed: 5, spacing: 8 });
for (const [i, p] of trees.entries()) scene.add(foliage({ kind: "leaves", points: crown(300, { at: [p.x, p.y + 4, p.z], seed: i }), seed: i, sun }));
// a spruce: scene.add(foliage({ kind: "needles", points: crown(500, { shape: "cone", at: [x, y + 3, z], radius: [1.6, 2.6, 1.6] }), sun }));
// each frame
grass.update(t);                                         // and each crown
if (lowEnd) grass.thin(0.4);
```

## post

`post(renderer, scene, camera, { bloom, dof, ao, motion, grade, vignette })` is post-processing in one call, on a `WebGLRenderer` (an `EffectComposer`) or a `WebGPURenderer` (a TSL `RenderPipeline`, on WebGPU or its WebGL 2 fallback). Call `fx.render()` each frame in place of `renderer.render(scene, camera)`. It keeps the renderer's MSAA (`antialias: true`) on both, except with `ao` on a `WebGPURenderer` (its depth pass cannot be multisampled), and a transparent canvas (`alpha: true` with no scene background) stays transparent. With no options it is the cheap look: half-resolution bloom, a light grade and a vignette. Name effects to pick them; `true` takes the defaults, a number its main value:

- `bloom`: `{ strength: 0.5, radius: 0.4, threshold: 0.85 }`; a number is the strength. Emissive and HDR-bright pixels glow. The threshold is on the colour the picture shows, after the renderer's exposure and tone mapping, so a sky (`SkyMesh`, `Sky`, an HDRI) keeps its colour unless it shows near white itself.
- `dof`: `{ focus: 10, range: 6, blur: 1 }`: `focus` is metres from the camera or an object to keep sharp (followed every frame; change it with `fx.focus`), sharp within about `range` of it.
- `ao`: `{ radius: 0.5, intensity: 1 }`, ambient occlusion (GTAO); a number is the intensity. The costliest effect; on WebGPU it turns off the scene pass's MSAA.
- `motion`: motion blur, a number scales it (1). A velocity buffer on WebGPU; on WebGL, trails of the last frames.
- `grade`: `{ contrast: 1.06, saturation: 1.08, brightness: 0, tint: 0xffffff }`, applied after tone mapping.
- `vignette`: a number is its darkness (0.35).

```js
const fx = post(renderer, scene, camera, { bloom: 0.8, dof: { focus: player }, vignette: true });
renderer.setAnimationLoop(() => { update(); fx.render(); });
```

The passes load from the page's three on the first call, so the import map needs `three/addons/` (and `three/tsl` with WebGPU; a vite or esbuild bundle resolves the WebGPU ones). A bundle never takes in the `WebGLRenderer` passes (they import `UniformsUtils`, which three.webgpu.js lacks, so a bundle mapping `three` to it would not build), so a bundled `WebGLRenderer` page imports them itself and hands them over as `addons`: 
```js
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"; // and RenderPass, OutputPass, ShaderPass, UnrealBloomPass
const fx = post(renderer, scene, camera, { bloom: true, addons: { EffectComposer, RenderPass, OutputPass, ShaderPass, UnrealBloomPass } }); // + BokehPass, GTAOPass, AfterimagePass for dof, ao, motion
```

Until `fx.ready` resolves, and if they fail (one console error, then `fx.error`), `render` draws the scene plainly. `fx.backend` is `"composer"` or `"pipeline"`, `fx.enabled = false` draws it plainly to compare, `fx.passes` holds the three.js objects behind each effect, and `fx.dispose()` frees them. The renderer's tone mapping and output colour space still apply: they run inside the chain. On a WebGPU page bare `three` may be three.webgpu.js, or three.module.js with `WebGPURenderer` from `three/webgpu`: `post` takes `RenderPipeline` from whichever has it, so map `three/webgpu` too in the second case. `post` draws the scene through a scene pass of its own, so on a page that already renders through its own `RenderPipeline` (fog, outlines, a custom grade) pass that pipeline as `input`: the effects go after its output, `fx.render()` draws both, and its passes stay (ao, dof and motion still draw the scene once more for depth and velocity). If its `outputColorTransform` is false, its output is taken as already tone-mapped.

```js
const fx = post(renderer, scene, camera, { bloom: 0.6, vignette: true, input: fogPipeline }); // fx.render() in place of fogPipeline.render()
```

## Pitfalls

- `water`, `foliage`, `post`, a `burst` on the GPU and a TSL noise sky each compile a heavy shader: draw the first frame without them and add each one after it with `await renderer.compileAsync(effect, camera, scene)`, one effect per call, then `scene.add(effect)` (until then draw with `renderer.render`, then switch to `fx.render()`). One batch of them all is slower than each in turn: `references/optimize.md`, Load time.
- Name every burst and instanced mesh, so `look` lists it. A burst with no live particles is left out of `look`'s lists until it emits.
- Before the page's first click or key, audio is locked: `play` logs `audible: false` and plays nothing. Read `sfx.log` or `sfx.check`, not the speakers.
- Give each builder its own fixed `seed`: two with the same seed draw the same pattern.
- `uv` works in the geometry's units: a `mesh.scale` stretches the metres.
- With `post`, never call `renderer.render` (or the `input` pipeline's `render`) as well; `fx.render()` draws the frame. Resize the renderer as usual: it follows.
- `water` on WebGL 2 draws its waves through `onBeforeCompile`, so `look` places its surface approximately there (the waves move in the shader).
- `look` lists a foliage mesh's cards one by one (`grass[12]`); a crown of leaves is one InstancedMesh per tree, so name the trunk apart.
