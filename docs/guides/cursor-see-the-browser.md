---
title: Can Cursor see the browser? Cursor's browser and Playwright MCP on a three.js game, and what paprika3d adds
phrase: can cursor see the browser
description: Yes, Cursor's agent has a browser of its own that navigates, clicks, types, scrolls, takes screenshots and reads the console. What that gives it on a three.js game drawn in one canvas, the Browser Tab and Google Chrome choice, and what paprika3d's MCP server adds on a small curling game, a stone dragged and swept on exact frames.
meta: Can Cursor see the browser? As screenshots; Playwright MCP adds the page tree, where a three.js game is one canvas. paprika3d adds its objects and exact frames.
intent: cursor-see-the-browser
queries:
  - "can cursor see browser"
  - "What’s the difference between “Browser Tab” and “Google Chrome” options in Cursor 2.0, and which should I use?"
  - "Browser tools constrained to IDE viewport"
  - "How to use browser automation"
  - "cursor playwright mcp"
  - "cursor browser three.js"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# Can Cursor see the browser? Cursor's browser and Playwright MCP on a three.js game, and what paprika3d adds

Yes. Cursor's agent has a built-in Browser tool: it opens a page, clicks, types, scrolls, reads the console and takes screenshots, which it reads as images. On a three.js game that picture is what it gets from the canvas, with no names, positions or speeds. Playwright MCP, the other browser people add to Cursor, reads the page's accessibility tree instead, and in that tree a three.js game is a single `<canvas>` with nothing inside it. To give it the scene too, put paprika3d in `.cursor/mcp.json` in the project:

```json
{ "mcpServers": { "paprika": { "command": "npx", "args": ["-y", "paprika3d", "serve"] } } }
```

paprika3d is an MCP server: its `open` loads the page in a headless Chrome on a paused clock, `look` lists each named object on screen with its pixel box, and `interact` drags, clicks and holds keys on exact frames and returns what changed in the game's state. This page sets the two side by side on a small curling game.

## What Cursor's own browser does

[Cursor's Browser page](https://cursor.com/docs/agent/tools/browser), read on 2026-11-12, lists the tools the agent gets: Navigate, Click ("click, double-click, right-click, and hover actions on any visible element"), Type ("Enter text into input fields and forms"), Scroll, Screenshot, Console Output and Network Traffic. It needs nothing installed. On what the agent sees, it says "Screenshots are integrated directly with the file reading tool, so Agent actually sees the browser state as images rather than relying on text descriptions." Browser actions ask for your approval by default; the page lists three modes, manual approval, allow-listed actions and auto-run. The page's own example prompts start with `@browser`.

This page did not run Cursor. Cursor's browser changes from release to release, so check that page before you rely on a detail.

## Browser Tab or Google Chrome

The question in Cursor's forum, [what's the difference between Browser Tab and Google Chrome](https://forum.cursor.com/t/139473), got this answer: "Google Chrome" opens a new, entirely separate chrome browser window, while "Browser tab (embedded)" opens a tab directly in the cursor editor, and "You probably won't encounter any difference in agent functionality". The difference that matters for a game is size. In [a forum thread on browser tools held to the editor's width](https://forum.cursor.com/t/145260), a reply says "the built-in browser is indeed constrained by the IDE panel width, so screenshots come out narrow", and suggests the separate window. A three.js game that sizes its canvas to the window draws at the pane's size, so a narrow pane gives the agent a narrow game.

## What the agent reads from a canvas

A three.js game is one `<canvas>` element. The agent's screenshot shows the sheet, the rings and the stone as pixels, and its click lands on that one element at a point. What the screenshot leaves out is what a test of the game needs: which shape is the stone, how far it is from the centre of the rings, how fast it slides, and on which frame it stopped. The actions Cursor's page lists are clicks, hovering, typing text and scrolling; a drag of the stone, or Space held while the stone slides, is not among them. The agent can still play and judge by eye, a screenshot at a time.

## Add paprika3d to Cursor

The one line above is the whole entry; Cursor starts the server itself. A `.cursor/mcp.json` in your home folder makes it available in every project instead. Cursor's [MCP page](https://cursor.com/docs/mcp) says the agent "automatically uses MCP tools listed under Available Tools when relevant", and that you turn servers on or off from Customize in the sidebar. The skills, and a first game built this way, are in [how to make a game with Cursor](/guides/make-a-game-with-cursor). Cursor's browser stays available beside it; ask for one or the other by name.

## The game: curling

Press on the stone, pull it back and let go: it slides the other way, faster the further you pulled. Hold Space to sweep, which halves the ice's drag on the stone. The house, the rings at the far end, is centred on the button at z -6. Save it as `index.html` next to `node_modules/three` (`npm install three`):

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Curling</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rules: press on the stone, pull it back and let go; it slides the opposite way, faster the further you pulled.
// Hold Space to sweep: the ice in front of a swept stone slows it less. Units are metres; the button is at z -6.
const HACK = 6, BUTTON = -6, HALF = 2.25, BACK = -8.5, STONE_R = 0.3, HOUSE_R = 1.8;
const PULL_TO_SPEED = 8, MAX_SPEED = 6, DRAG = 0.6, SWEPT_DRAG = 0.3;   // speed per metre pulled, m/s, m/s²
let stone, thrown, sweeping, out, pulling, pull;
function start() {
  stone = { x: 0, z: HACK, vx: 0, vz: 0 };
  thrown = false; sweeping = false; out = false; pulling = false; pull = { x: 0, z: 0 };
}
function release() {
  pulling = false;
  const d = Math.hypot(pull.x, pull.z);
  if (d < 0.1) return;
  const speed = Math.min(MAX_SPEED, d * PULL_TO_SPEED);
  stone.vx = -pull.x / d * speed; stone.vz = -pull.z / d * speed;   // the opposite way to the pull
  thrown = true;
}
function step(dt) {
  const speed = Math.hypot(stone.vx, stone.vz);
  if (!speed || out) return;
  const slower = Math.max(0, speed - (sweeping ? SWEPT_DRAG : DRAG) * dt);
  stone.vx *= slower / speed; stone.vz *= slower / speed;
  stone.x += stone.vx * dt; stone.z += stone.vz * dt;
  if (Math.abs(stone.x) > HALF - STONE_R || stone.z < BACK) { out = true; stone.vx = stone.vz = 0; }
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x26303c);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 9, 11);
camera.lookAt(0, 0, -0.3);
scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(3, 8, 6);
scene.add(sun);
const flat = (name, geometry, color, y) => {
  const m = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }));
  m.name = name; m.rotation.x = -Math.PI / 2; m.position.y = y; scene.add(m); return m;
};
flat('ice', new THREE.PlaneGeometry(2 * HALF, HACK - BACK + 2), 0xdfe9f2, 0).position.z = (HACK + BACK) / 2 + 1;
for (const [name, r0, r1, color, y] of [['house blue', 1.2, HOUSE_R, 0x2f62c8, 0.002], ['house white', 0.6, 1.2, 0xf4f6f8, 0.003],
  ['house red', 0.15, 0.6, 0xc83a3a, 0.004], ['button', 0, 0.15, 0xf4f6f8, 0.005]]) flat(name, new THREE.RingGeometry(r0, r1, 48), color, y).position.z = BUTTON;
flat('hog line', new THREE.PlaneGeometry(2 * HALF, 0.08), 0xc83a3a, 0.002).position.z = -2;
for (const s of [-1, 1]) {
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, HACK - BACK + 2), new THREE.MeshStandardMaterial({ color: 0x6b4a2e }));
  board.name = 'side board'; board.position.set(s * (HALF + 0.075), 0.15, (HACK + BACK) / 2 + 1); scene.add(board);
}
const stoneMesh = new THREE.Group();
stoneMesh.name = 'stone';
const granite = new THREE.Mesh(new THREE.CylinderGeometry(STONE_R, STONE_R * 0.9, 0.22, 32), new THREE.MeshStandardMaterial({ color: 0x6d7378, roughness: 0.6 }));
granite.position.y = 0.11;
const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.36), new THREE.MeshStandardMaterial({ color: 0xd4302c }));
handle.position.set(0, 0.26, 0.06);
stoneMesh.add(granite, handle);
scene.add(stoneMesh);
const broom = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.12), new THREE.MeshStandardMaterial({ color: 0xe8c33a }));
broom.name = 'broom';
scene.add(broom);

// The pointer, as a point on the ice: a press on the stone starts a pull, and letting go throws it.
const ray = new THREE.Raycaster(), ice = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), at = new THREE.Vector3();
const aim = e => { ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), camera); return ray; };
addEventListener('pointerdown', e => { if (!thrown && aim(e).intersectObject(stoneMesh).length) pulling = true; });
addEventListener('pointermove', e => { if (pulling && aim(e).ray.intersectPlane(ice, at)) pull = { x: at.x - stone.x, z: at.z - stone.z }; });
addEventListener('pointerup', () => { if (pulling) release(); });
addEventListener('keydown', e => { if (e.code === 'Space') sweeping = true; if (e.code === 'KeyR') start(); });
addEventListener('keyup', e => { if (e.code === 'Space') sweeping = false; });
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

start();
let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  stoneMesh.position.set(stone.x, 0, stone.z);
  broom.visible = sweeping && Math.hypot(stone.vx, stone.vz) > 0;
  broom.position.set(stone.x, 0.03, stone.z - 0.7);
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100;
window.__game = {
  describe: () => ({ name: 'curling', units: 'metres, the button at z -6', mouse: 'press on the stone, pull back, let go', keys: { Space: 'hold to sweep', KeyR: 'restart' } }),
  observe: () => ({ stone: { x: r2(stone.x), z: r2(stone.z), speed: r2(Math.hypot(stone.vx, stone.vz)) }, thrown, sweeping, out,
    toButton: r2(Math.hypot(stone.x, stone.z - BUTTON)), inHouse: !out && Math.hypot(stone.x, stone.z - BUTTON) < HOUSE_R + STONE_R }),
  act: ({ key, down = true }) => { if (key === 'Space') sweeping = down; else if (key === 'KeyR' && down) start(); },
  setState: s => { if (s.stone) stone = { vx: 0, vz: 0, ...s.stone }; if ('thrown' in s) thrown = s.thrown; },
};
</script>
</body></html>
```

`toButton` in `observe()` is the stone's distance to the button in metres, the number a curler cares about and a picture does not give.

## The calls Cursor's agent makes, and the replies

These came from paprika3d's MCP server on this page on 2026-11-12, on a Linux machine with no graphics card, called directly rather than from inside Cursor; the tools answer the same in any client. Run folders are shortened to `<project>` and the `look` reply is cut to the lines used here, nothing reworded.

**Look at it.** After `open {"url":"index.html","cwd":"<project>"}`, `look` names the stone and each ring:

```text
look {}

Picture: <project>/paprika3d/runs/2026-11-12T04-44-12-296Z/look-1.png
On screen (10):
ice 17% [428, 190, 851, 799] 16.5 × 4.5 units, along the view
house blue 0.55% [558, 203, 721, 280] 3.6 × 3.6 units
house white 0.33% [586, 214, 693, 265] 2.4 × 2.4 units
stone ×2 0.25% [613, 718, 666, 776]
house red 0.1% [613, 226, 666, 251] 1.2 × 1.2 units
hog line 0.072% [517, 341, 762, 343] 4.5 × 0.08 units, across the view
button 0.0068% [633, 235, 646, 241] 0.3 × 0.3 units
Never visible: none
Hidden by the game (visible false on it or a parent): broom
```

`stone ×2` is the granite and its handle, two parts of one named group. The stone's box centres on (640, 747); the button is the white dot at about (640, 238), a few pixels across.

**Throw without sweeping.** A `{ state }` step puts the stone on the hack, three mouse steps press on it, pull it down to (640, 790), toward the camera, and let go, and an `until` step runs frames until the stone stops:

```text
interact {"steps":[{"state":{"stone":{"x":0,"z":6},"thrown":false}},{"mouse":"down","x":640,"y":747},{"mouse":"move","x":640,"y":790},{"mouse":"up","x":640,"y":790},{"until":{"stone.speed":0},"max":900}],"trace":["stone.speed","toButton"]}

{"changed":{"stone":{"z":-2.99},"thrown":true,"toButton":3.01}}
until: stone.speed == 0 held at frame 331
mouse down at (640, 747): over stone (Group, 10 units)
mouse move at (640, 790): over ice (Mesh, 10.1 units)
stone.speed: 0 → peak 3.28 at frame 3 → 0 at frame 331; first changed at frame 3
toButton: 12 → 3.01 at frame 321; first changed at frame 3
```

The press landed on the stone, the pull sent it off at 3.28 metres per second, and it stopped 3.01 short of the button, outside the house. A screenshot would show the stone short of the rings; the reply gives the distance and the frame.

**Sweep for 120 frames, and keep it as a check.** The same throw, with Space held for the first two seconds of the slide. `expect` asks for the stone within 0.3 of the button, the stone's own radius:

```text
interact {"steps":[{"state":{"stone":{"x":0,"z":6},"thrown":false}},{"mouse":"down","x":640,"y":747},{"mouse":"move","x":640,"y":790},{"mouse":"up","x":640,"y":790},{"key":"Space","down":true},{"wait":120},{"key":"Space","down":false},{"until":{"stone.speed":0},"max":900}],"trace":["toButton"],"expect":{"toButton":[0,0.3],"inHouse":true},"save":"sweep-120-frames-to-the-button"}

{"changed":{"stone":{"z":-6},"thrown":true,"toButton":0,"inHouse":true}}
until: stone.speed == 0 held at frame 392
mouse down at (640, 747): over stone (Group, 10 units)
mouse move at (640, 790): over ice (Mesh, 10.1 units)
toButton: 12 → 0 at frame 388; first changed at frame 3
Expect: toButton 0 ✓ · inHouse true ✓
Saved check "sweep-120-frames-to-the-button" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

The stone came to rest on the button, z -6, on frame 392. Sweeping for 60 frames instead left it 1.42 short, in the house, and 180 frames carried it over the button and 1.26 past:

```text
interact {"steps":[{"state":{"stone":{"x":0,"z":6},"thrown":false}},{"mouse":"down","x":640,"y":747},{"mouse":"move","x":640,"y":790},{"mouse":"up","x":640,"y":790},{"key":"Space","down":true},{"wait":60},{"key":"Space","down":false},{"until":{"stone.speed":0},"max":900}],"trace":["toButton"]}

{"changed":{"stone":{"z":-4.58},"toButton":1.42,"inHouse":true}}
until: stone.speed == 0 held at frame 362
toButton: 12 → 1.42 at frame 351; first changed at frame 3

interact {"steps":[{"state":{"stone":{"x":0,"z":6},"thrown":false}},{"mouse":"down","x":640,"y":747},{"mouse":"move","x":640,"y":790},{"mouse":"up","x":640,"y":790},{"key":"Space","down":true},{"wait":180},{"key":"Space","down":false},{"until":{"stone.speed":0},"max":900}],"trace":["toButton"]}

{"changed":{"stone":{"z":-7.26},"toButton":1.26}}
until: stone.speed == 0 held at frame 422
toButton: 12 → low 0 at frame 298 → 1.26 at frame 415; first changed at frame 3
```

The mouse lines are left out of these two replies. The three numbers together show the sweep works and how much it is worth, which is the kind of tuning a game needs and a screenshot cannot measure.

**Rerun the checks after each change.**

```text
test {}

✓ sweep-120-frames-to-the-button
1 of 1 saved checks passed in 0.4 s
```

## Pitfalls

- **Begin a play with a step that runs a frame.** Each play here starts with a `{ state }` step. On a page fresh from `open`, still at frame 0, a mouse step sent first reached the game after the call's frames had run.
- **Name the group, and its parts if you want them listed.** The stone is a named group with unnamed parts, which `look` lists as `stone ×2`; when this page's first camera left the stone out of view, it was missing from `On screen` and also from `Never visible`, so name the parts (`stone granite`) if that line matters.
- **Size the canvas to the window, and check other sizes.** `look` with `viewports` pictures the game at phone, tablet, laptop and desktop sizes, so you see the sizes your players use, not the width of a pane in Cursor.

## What paprika3d does not do

It does not drive Cursor's own browser tab or your Chrome window, and it does not see your screen: it runs a headless Chrome of its own, so a game behind a sign-in needs a way in for that browser. On a machine with no graphics card, its Chrome draws WebGL in software, so frame times from it say nothing about a player's GPU. It returns numbers and pictures, not a verdict on whether the sweep feels good to a player. And Cursor gets the tools and skills; the slash commands and hooks of the Claude Code plugin stay in Claude Code.

For an ordinary web page of forms, links and text, Cursor's browser reads the elements directly and is the tool for the job.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): the open, look and play loop with keys and saved checks.
- [Screenshot a three.js scene headless from a coding agent](/guides/screenshot-threejs-scene-headless): every way `look` pictures a scene, sizes included.
- [How to make a game with Cursor](/guides/make-a-game-with-cursor): a first game in Cursor, with the MCP entry and the skills.
- [MCP server that screenshots a WebGL canvas](/guides/mcp-server-screenshot-webgl-canvas): the picture in the tool result, and what comes with it.
- [Control time in three.js tests](/guides/control-time-threejs-tests): why the paused clock makes a throw land in the same place every run.
