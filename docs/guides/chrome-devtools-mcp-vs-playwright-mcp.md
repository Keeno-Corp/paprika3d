---
title: Chrome DevTools MCP vs Playwright MCP on a canvas/WebGL page, tested in Claude Code
phrase: chrome devtools mcp vs playwright mcp
description: Chrome DevTools MCP and Playwright MCP run side by side on a three.js field of 3,600 instanced sunflowers that turn to the sun. The snapshot each returns for the canvas, the screenshot each takes, the console each reads and Chrome DevTools MCP's performance trace, with their real replies; then paprika3d's look and perf, which name the instanced meshes and count triangles and draw calls per object.
meta: Chrome DevTools MCP vs Playwright MCP in Claude Code on a three.js canvas/WebGL page: blank snapshots, screenshots, a performance trace, what reads the scene.
intent: chrome-devtools-mcp-vs-playwright-mcp
queries:
  - "chrome devtools mcp vs playwright mcp"
  - "chrome devtools mcp claude code"
  - "chrome devtools mcp canvas webgl"
  - "take_snapshot appears blank on <canvas>/WebGL and lazy-a11y canvas UIs"
  - "Support for Canvas/WebGL Interaction Beyond DOM Elements"
  - "Chrome DevTools MCP (2025)"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# Chrome DevTools MCP vs Playwright MCP on a canvas/WebGL page, tested in Claude Code

Both drive a real Chrome for a coding agent such as Claude Code, and on a three.js canvas/WebGL page both give it a screenshot and the console. They differ in the rest: Chrome DevTools MCP adds a performance trace, network requests and a Lighthouse audit, and Playwright MCP adds Firefox and WebKit, form filling and, with `--caps=vision`, clicks at pixel coordinates. Neither reads the scene inside the canvas: on a field of 3,600 instanced sunflowers below, Playwright MCP's snapshot came back empty and Chrome DevTools MCP's was one line naming the page. For the scene's objects, their triangles and draw calls, and the game's state, add paprika3d next to either one (Claude Code first; any other MCP client runs the second line as a stdio server):

```bash
claude plugin marketplace add Keeno-Corp/paprika3d && claude plugin install paprika3d@paprika3d
npx -y paprika3d serve
```

## Adding each server

| | Chrome DevTools MCP | Playwright MCP |
|---|---|---|
| Made by | the Chrome DevTools team ([repo](https://github.com/ChromeDevTools/chrome-devtools-mcp)) | Microsoft ([repo](https://github.com/microsoft/playwright-mcp)) |
| Claude Code | `claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest` | `claude mcp add playwright npx @playwright/mcp@latest` |
| Other clients | command `npx`, args `chrome-devtools-mcp@latest` | command `npx`, args `@playwright/mcp@latest` |
| Browsers | Chrome (stable channel unless `--channel` says otherwise) | Chrome, Edge, Firefox or WebKit (`--browser`) |
| Click at a pixel | `click_at`, behind `--experimentalVision` | `browser_mouse_click_xy` and the other mouse tools, behind `--caps=vision` |
| Performance | `performance_start_trace`, `performance_stop_trace`, `performance_analyze_insight`, `lighthouse_audit` | tracing and video behind `--caps=devtools` |
| Elements | `take_snapshot` (the accessibility tree, a `uid` per element) | `browser_snapshot` (the accessibility tree as YAML, a `ref` per element) |

The Claude Code lines are the ones each project documents; Chrome DevTools MCP also ships as a Claude Code plugin from its own marketplace. Options for either server go after `--` in `claude mcp add`. In Claude Code, `/mcp` lists the servers and their tools.

## The field

3,600 sunflowers on a 60 by 60 grid, drawn as three `InstancedMesh` objects (stems, petals, centres), so the whole field is three draw calls plus the ground. Every frame, each head turns to face the sun; holding ArrowRight moves the sun west. The sun sits behind the camera so the heads face the viewer. The page exposes `window.__game` with the sun's angle and how far the middle flower's head has turned. Save it as `index.html` and run `npm install three` beside it.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Sunflower field</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// 3,600 sunflowers in a 60 × 60 grid; every head turns to face the sun each frame.
const SIDE = 60, COUNT = SIDE * SIDE, SPACING = 0.9, TURN = 0.6;   // TURN: the sun's speed, radians per second
let hour = 0;            // the sun's angle across the sky, 0 (east) to π (west)
const held = new Set();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9cc8ec);
scene.fog = new THREE.Fog(0x9cc8ec, 20, 60);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 8, -24);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x5a6a30, 1.4));
const light = new THREE.DirectionalLight(0xfff0d0, 2.2);
scene.add(light);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0x5a7a2a }));
ground.name = 'field';
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
const sun = new THREE.Vector3();   // behind the camera: the field faces the viewer

// One InstancedMesh per part: three draw calls for the whole field.
const part = (name, geometry, color) => {
  const m = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ color }), COUNT);
  m.name = name; scene.add(m); return m;
};
const stems = part('stems', new THREE.CylinderGeometry(0.04, 0.05, 1.6, 6).translate(0, 0.8, 0), 0x4a7a2a);
const petals = part('petals', new THREE.CircleGeometry(0.35, 12), 0xf0c020);
const centres = part('centres', new THREE.CircleGeometry(0.16, 12).translate(0, 0, 0.01), 0x5a3418);
petals.material.side = centres.material.side = THREE.DoubleSide;

const spots = [], m4 = new THREE.Matrix4(), head = new THREE.Object3D();
let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // seeded, so the field is the same every load
for (let i = 0; i < COUNT; i++) {
  const x = (i % SIDE - SIDE / 2) * SPACING + (rand() - 0.5) * 0.4;
  const z = (Math.floor(i / SIDE) - SIDE / 2) * SPACING + (rand() - 0.5) * 0.4;
  const h = 0.8 + rand() * 0.5;
  spots.push([x, z, h]);
  stems.setMatrixAt(i, m4.makeScale(1, h, 1).setPosition(x, 0, z));
}

function step(dt) {
  if (held.has('ArrowRight')) hour = Math.min(Math.PI, hour + TURN * dt);
  if (held.has('ArrowLeft')) hour = Math.max(0, hour - TURN * dt);
  sun.set(Math.cos(hour) * 35, 4 + Math.sin(hour) * 14, -40);
  light.position.copy(sun);
  spots.forEach(([x, z, h], i) => {
    head.position.set(x, 1.6 * h, z);
    head.lookAt(sun);
    head.updateMatrix();
    petals.setMatrixAt(i, head.matrix);
    centres.setMatrixAt(i, head.matrix);
  });
  petals.instanceMatrix.needsUpdate = centres.instanceMatrix.needsUpdate = true;
}

function act({ key, down = true }) { if (down) held.add(key); else held.delete(key); }
addEventListener('keydown', e => act({ key: e.key }));
addEventListener('keyup', e => act({ key: e.key, down: false }));
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  renderer.render(scene, camera);
});

// How far the middle flower's head has turned from facing the camera, in degrees around y (+ east, - west).
const MIDDLE = SIDE * SIDE / 2 + SIDE / 2;
const turn = () => { petals.getMatrixAt(MIDDLE, m4); const e = m4.elements; return Math.round(Math.atan2(e[8], -e[10]) * 180 / Math.PI); };
window.__game = {
  describe: () => ({ name: 'sunflower field', units: 'world units, y up; hour in radians, 0 east to π west', keys: { ArrowRight: 'hold to move the sun west', ArrowLeft: 'hold to move the sun east' } }),
  observe: () => ({ hour: +hour.toFixed(3), sun: sun.toArray().map(n => +n.toFixed(2)), flowers: COUNT, middleHeadTurn: turn() }),
  act,
  setState: s => { if (s.hour !== undefined) hour = s.hour; },
};
</script>
</body></html>
```

## Side by side on the field

The replies below come from Chrome DevTools MCP 1.13.0 and Playwright MCP 0.0.85, each started headless over MCP stdio from a script on 2026-11-12, with a 1280 by 800 viewport, Chrome 156, the page served at `http://127.0.0.1:8732`, and Chrome's sandbox turned off because this container needs it. No coding agent was in the loop: the replies are what an agent would receive. This machine has no GPU, so Chrome drew the field in software.

**The snapshot.** Chrome DevTools MCP's `take_snapshot`:

```text
take_snapshot {"pageId": 1}

## Latest page snapshot
uid=1_0 RootWebArea "Sunflower field" url="http://127.0.0.1:8732/index.html"
```

Playwright MCP's `browser_snapshot` (the reply's own code fences are indented here):

```text
browser_snapshot {}

### Page
- Page URL: http://127.0.0.1:8732/index.html
- Page Title: Sunflower field
- Console: 1 errors, 4 warnings
### Snapshot
    ```yaml

    ```
```

Both read the accessibility tree, and a canvas with no role or label adds nothing to it. Chrome DevTools MCP keeps the page's root node and title; Playwright MCP's tree is empty. Chrome DevTools MCP's tracker has an open issue on this, "take_snapshot appears blank on &lt;canvas&gt;/WebGL and lazy-a11y canvas UIs" ([#3225](https://github.com/ChromeDevTools/chrome-devtools-mcp/issues/3225)), which asks for a canvas to be flagged with a pointer to the screenshot; a maintainer called the blank tree expected and asked which models it misled.

**The screenshot.** `take_screenshot {"pageId": 1}` replied `Took a screenshot of the current page's viewport.` with the picture attached; `browser_take_screenshot {}` replied with the picture and the path it saved it to. Both pictures show the same frame of the field: rows of yellow heads with brown centres turned toward the viewer and a little to the left, green stems, and the far rows fading into a pale blue sky. Neither reply says how many flowers there are, which mesh draws the heads, or which way any one of them faces.

**The console.** Chrome DevTools MCP lists each message with an id that `get_console_message` opens:

```text
list_console_messages {"pageId": 1}

## Console messages
Showing 1-4 of 4 (Page 1 of 1).
msgid=1 [warn] []Automatic fallback to software WebGL has been deprecated. Please use the --enable-unsafe-swiftshader flag to opt in to lower security guarantees for trusted content. (0 args)
msgid=2 [warn] [.WebGL-0x8e40019ac00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (0 args) [3 times]
msgid=5 [error] Failed to load resource: the server responded with a status of 404 (File not found) (0 args)
msgid=6 [warn] [.WebGL-0x8e40019ac00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat) (0 args)
```

The first line is Chrome on a machine with no GPU, warning that its fallback to software WebGL is going away; the 404 is the missing `favicon.ico`. Playwright MCP counted the same kinds (`Console: 1 errors, 4 warnings`) and wrote them to a log file it links from each reply.

**The performance trace.** `performance_start_trace` with `reload` and `autoStop` reloads the page, records, and returns a summary. Its findings for the field, with the format notes that follow them left out:

```text
performance_start_trace {"pageId": 1, "reload": true, "autoStop": true}

The performance trace has been stopped.
## Summary of Performance trace findings:
URL: http://127.0.0.1:8732/index.html
Trace bounds: {min: 450760838077µs, max: 450765949477µs}
CPU throttling: 1x
Network throttling: none

## insight set id: NAVIGATION_0

URL: http://127.0.0.1:8732/index.html
Bounds: {min: 450760840837µs, max: 450765949477µs}
Metrics (lab / observed):
  - CLS: 0.00
Metrics (field / real users): n/a – no data for this page in CrUX
Available insights:
  - insight name: DocumentLatency
    description: Your first network request is the most important. [Reduce its latency](https://developer.chrome.com/docs/performance/insights/document-latency) by avoiding redirects, ensuring a fast server response, and enabling text compression.
    estimated metric savings: FCP 0 ms, LCP 0 ms
    estimated wasted bytes: 3 kB
  - insight name: Cache
    description: A long cache lifetime can speed up repeat visits to your page. [Learn more about caching](https://developer.chrome.com/docs/performance/insights/cache).
```

The insights are about loading the page: the document request, caching, layout shift. The trace itself holds every task and function call on the main thread, and `filePath` saves it for Chrome's Performance panel. Its call tree is named by function: in the raw trace saved from this field, three.js's `lookAt`, `setMatrixAt` and `render`, among others. The stems, petals and centres appear in it as words in the page's source text, with no time of their own. That makes it the tool for a slow load or a long task in the page's own code, and a poor fit for the question of which part of the scene costs the frame.

## The same field with paprika3d

paprika3d opens the page in its own headless Chrome on a paused clock (each frame is 1/60 s of game time) and reads the three.js scene behind the picture. These replies are from its stable tools on 2026-11-12; run folder paths are shortened to `<project>`.

```text
look {}

Picture: <project>/paprika3d/runs/2026-11-12T04-43-31-962Z/look-1.png
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
On screen (5279):
field 26% [0, 202, 1279, 799] 120 × 120 units
petals* ×2094 31% [0, 217, 1279, 799] 0.7 × 0.7 units
stems* ×1578 11% [0, 223, 1279, 799] 1.28–2.08 × 0.1 units
centres* ×1606 7.3% [0, 220, 1279, 799] 0.32 × 0.32 units
Never visible: none
```

(Lines on pixels, hues and depth are left out.) Each instanced mesh is one line: how many of its instances drew a pixel, their share of the picture and their size. Of 3,600 heads, 2,094 reached the picture; the rest were behind other heads or outside the view.

Holding ArrowRight for two seconds of game time moves the sun, and `trace` follows the middle flower's head frame by frame:

```text
interact {"steps": [{"key": "ArrowRight", "frames": 120}], "trace": ["middleHeadTurn", "hour"]}

{"changed":{"hour":1.2,"sun":[12.68,17.05,-40],"middleHeadTurn":18}}
middleHeadTurn: 41 → 18 at frame 119; first changed at frame 23
hour: 0 → 1.2 at frame 120; first changed at frame 1
```

The head turned from 41 to 18 degrees as the sun moved west, so the rule works on the frame it should. `perf` with `costs` counts what each named object puts on the GPU:

```text
perf {"costs": true}

789 ms median frame (p95 854.5 ms, 1 fps on average), 4 draw calls, 172802 triangles, 0 MB assets; over budget: frameMs 789 of 16.7 ms; desktop budget; software renderer (no GPU): frame time is no budget signal, do not optimize for it
...
Costs by named group: the main scene's visible objects, each under its nearest named ancestor as `look` names it, counted, not timed, and with no frustum culling (the frame draws only what its camera sees, plus a shadow pass per casting light); `variants` with `hide` times a group. In all 172802 triangles, 0 casting shadows, 4 draw calls, 0 MB of textures:
  stems: 86400 triangles, 0 casting shadows, 1 draw calls, 0 MB of textures
  petals: 43200 triangles, 0 casting shadows, 1 draw calls, 0 MB of textures
  centres: 43200 triangles, 0 casting shadows, 1 draw calls, 0 MB of textures
  field: 2 triangles, 0 casting shadows, 1 draw calls, 0 MB of textures
```

The frame times on this machine are software rendering, and the reply says not to act on them. The counts hold on any machine: the stems, at six sides each, carry half of the field's 172,802 triangles, so a stem with fewer sides is where triangles would come off first. On a machine with a GPU, `variants` with `hide: ["stems"]` times the frame with and without them.

## Which one to give the agent

- **Chrome DevTools MCP** when the question is the page as a web page: how it loads, which requests it makes, what Lighthouse says, a console error with its stack trace, a long task in the page's code.
- **Playwright MCP** when the question is a flow across pages and browsers: forms, logins, several tabs, Firefox and WebKit, and a click at a pixel on a canvas.
- **paprika3d** when the question is the three.js scene: which objects are on screen and how large, what the game's state does on each frame, and which object carries the triangles and draw calls. It runs beside either of the other two in the same session.

## What paprika3d does not do here

- No network panel, Lighthouse audit or load trace of the page; Chrome DevTools MCP's tools cover those.
- No Firefox or WebKit run beyond `open` with `browser: "firefox"`, and no forms, logins or tabs across sites.
- Its frame times depend on the machine: without a GPU, Chrome draws WebGL in software and `perf` says so. It does not run the page on phones or other real devices.

## Related

- [Measure three.js draw calls and FPS, and find what costs the frame](/guides/threejs-fps-draw-calls): draw calls and frame time, with `variants`.
- [Claude Code Playwright MCP on a three.js game](/guides/claude-code-playwright-mcp): Playwright MCP's setup in Claude Code, its pixel click and a drop stepped frame by frame.
- [Screenshot a three.js scene headless from a coding agent](/guides/screenshot-threejs-scene-headless): the screenshot itself.
- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): keys on exact frames and checks that rerun.
- [three.js too many meshes? Merge, instance or batch, chosen by what each one keeps](/guides/threejs-too-many-meshes-merge-or-instance): why the field is three instanced meshes.
