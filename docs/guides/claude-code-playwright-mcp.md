---
title: Claude Code Playwright MCP on a WebGL canvas: can it test a three.js game?
phrase: claude code playwright mcp
description: How to add Playwright MCP to Claude Code with claude mcp add, and what its tools return on a three.js game: an empty accessibility snapshot for the canvas, a screenshot, and a click by pixel with the vision capability. Then the same drop on a pachinko board with paprika3d, whose look names the pins, ball and cups and whose interact steps the ball frame by frame into its cup.
meta: Can Claude Code use Playwright MCP on a three.js game? Setup, what its snapshot, screenshot and vision-mode click see in a canvas, and what paprika3d adds.
intent: claude-code-playwright-mcp
queries:
  - "claude code playwright mcp"
  - "can claude code use playwright"
  - "playwright mcp canvas webgl"
  - "claude code playwright cli vs mcp"
  - "Show HN: Playwright Skill for Claude Code – Less context than playwright-MCP"
  - "[BUG] Canvas is not visible in the trace"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# Claude Code Playwright MCP on a WebGL canvas: can it test a three.js game?

Yes, Claude Code can use Playwright. `claude mcp add playwright npx @playwright/mcp@latest` adds Playwright MCP, and its `browser_*` tools then appear in Claude Code's `/mcp` list. On a three.js game it navigates, takes screenshots, reads the console and, started with `--caps=vision`, clicks at pixel coordinates. Its snapshot reads the page's accessibility tree, and a `<canvas>` has nothing in that tree: on the pachinko board below, the snapshot came back empty. To read the scene itself (the named objects on screen, the game's state, a drop stepped frame by frame), add paprika3d beside it:

```bash
claude plugin marketplace add Keeno-Corp/paprika3d && claude plugin install paprika3d@paprika3d
```

The two work side by side in one Claude Code session. This page adds Playwright MCP, runs it on a small three.js game, then runs the same drop through paprika3d, with the replies each one gave.

## Add Playwright MCP to Claude Code

Playwright MCP is Microsoft's MCP server for browser automation ([github.com/microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)). Its README gives this line for Claude Code:

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

Server options go after `--`, which separates Claude Code's own options from the server's command ([Claude Code's MCP docs](https://code.claude.com/docs/en/mcp)). The vision capability adds the coordinate tools a canvas needs (`browser_mouse_click_xy`, `browser_mouse_move_xy`, `browser_mouse_drag_xy`, `browser_mouse_down`, `browser_mouse_up`, `browser_mouse_wheel`):

```bash
claude mcp add playwright -- npx @playwright/mcp@latest --caps=vision
```

`--scope project` writes the entry to `.mcp.json` in the project, so everyone who opens the folder gets it; the default scope keeps it to you. `/mcp` in a session shows the server and its tools.

**Playwright CLI or MCP.** Microsoft also publishes the Playwright CLI ([github.com/microsoft/playwright-cli](https://github.com/microsoft/playwright-cli)), installed with `npm install -g @playwright/cli@latest` and `playwright-cli install --skills`. Its README recommends it for coding agents because a command line keeps large tool schemas and accessibility trees out of the model's context, and keeps MCP for agent loops that need a browser's state to persist. Both drive the same browser in the same way, so what they see inside a canvas is the same. The CLI was not run for this page.

## The board

A pachinko board: a ball falls through 18 round pins into one of three cups. Arrow keys aim, Space drops, and a click on the board drops the ball under the pointer, which is what a pixel click from outside needs. The pins are one `InstancedMesh`; every other mesh has a `name`, and the page exposes `window.__game` so a tool can read the state as JSON. Save it as `index.html` and run `npm install three` in the same folder.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Pachinko</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rules, in plain numbers: a 2D ball falling through round pins into three cups.
const GRAVITY = 9.8, BOUNCE = 0.5, R = 0.2, PIN_R = 0.08, WALL = 2.5, FLOOR = -3, TOP = 3.7;
const PINS = [];
for (let row = 0; row < 5; row++) {
  const xs = row % 2 ? [-1, 0, 1] : [-1.5, -0.5, 0.5, 1.5];
  for (const x of xs) PINS.push([x, 2.6 - row * 1.1]);
}
const CUPS = [['left', -Infinity, -0.85, 10], ['centre', -0.85, 0.85, 50], ['right', 0.85, Infinity, 10]];
let aim = 0.2, ball = { x: aim, y: TOP, vx: 0, vy: 0 }, inPlay = false, dropped = 0, cup = null, score = 0, pinHits = 0;

function drop(x = aim) {
  if (inPlay) return;
  aim = Math.max(-2.2, Math.min(2.2, x));
  ball = { x: aim, y: TOP, vx: 0, vy: 0 };
  inPlay = true; dropped++; cup = null;
}

function step(dt) {
  if (!inPlay) { ball.x = aim; return; }
  for (let i = 0; i < 4; i++) {            // four substeps a frame keep the ball from passing through a pin
    const h = dt / 4;
    ball.vy -= GRAVITY * h;
    ball.x += ball.vx * h; ball.y += ball.vy * h;
    for (const [px, py] of PINS) {
      const dx = ball.x - px, dy = ball.y - py, d = Math.hypot(dx, dy);
      if (d >= R + PIN_R) continue;
      const nx = dx / d, ny = dy / d, vn = ball.vx * nx + ball.vy * ny;
      ball.x = px + nx * (R + PIN_R); ball.y = py + ny * (R + PIN_R);
      if (vn < 0) { ball.vx -= (1 + BOUNCE) * vn * nx; ball.vy -= (1 + BOUNCE) * vn * ny; pinHits++; }
    }
    if (Math.abs(ball.x) > WALL - R) { ball.x = Math.sign(ball.x) * (WALL - R); ball.vx *= -BOUNCE; }
    if (ball.y <= FLOOR + R) {
      ball.y = FLOOR + R; inPlay = false;
      const [name, , , points] = CUPS.find(([, lo, hi]) => ball.x >= lo && ball.x < hi);
      cup = name; score += points;
      return;
    }
  }
}

function act({ key, down = true }) {
  if (!down) return;
  if (key === 'ArrowLeft' && !inPlay) aim = Math.max(-2.2, aim - 0.25);
  if (key === 'ArrowRight' && !inPlay) aim = Math.min(2.2, aim + 0.25);
  if (key === ' ') drop();
}
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.key }); });

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1420);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0.4, 9.8);
scene.add(new THREE.HemisphereLight(0xfff4e0, 0x302030, 1.6));
const key = new THREE.DirectionalLight(0xffffff, 2);
key.position.set(2, 4, 6);
scene.add(key);

const mat = (color, metalness = 0, roughness = 0.6) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
const add = (name, geometry, material, x, y, z = 0) => {
  const m = new THREE.Mesh(geometry, material);
  m.name = name; m.position.set(x, y, z); scene.add(m); return m;
};
add('board', new THREE.BoxGeometry(5.2, 7.6, 0.2), mat(0x7a4a2a), 0, 0.4, -0.35);
add('wall-left', new THREE.BoxGeometry(0.2, 7.6, 0.6), mat(0x4a2c18), -2.6, 0.4);
add('wall-right', new THREE.BoxGeometry(0.2, 7.6, 0.6), mat(0x4a2c18), 2.6, 0.4);
const pins = new THREE.InstancedMesh(new THREE.CylinderGeometry(PIN_R, PIN_R, 0.5, 16), mat(0xd8d0c0, 0.3, 0.4), PINS.length);
pins.name = 'pins';
PINS.forEach(([x, y], i) => pins.setMatrixAt(i, new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(x, y, 0)));
scene.add(pins);
const cupColours = { left: 0x3a7ad8, centre: 0xe0b030, right: 0x3a7ad8 };
for (const [name, lo, hi] of CUPS) {
  const a = Math.max(lo, -WALL), b = Math.min(hi, WALL);
  add(`cup-${name}`, new THREE.BoxGeometry(b - a - 0.08, 0.5, 0.5), mat(cupColours[name]), (a + b) / 2, FLOOR - 0.25);
}
const ballMesh = add('ball', new THREE.SphereGeometry(R, 32, 16), mat(0xf0f0f8, 0.3, 0.25), aim, TOP);
const marker = add('aim', new THREE.ConeGeometry(0.15, 0.3, 16), mat(0xe04040), aim, TOP + 0.4);
marker.rotation.z = Math.PI;

// A click drops the ball at the x under the pointer, on the board's plane.
const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
renderer.domElement.addEventListener('pointerdown', e => {
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  if (ray.ray.intersectPlane(plane, hit)) drop(hit.x);
});
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  ballMesh.position.set(ball.x, ball.y, 0);
  marker.position.x = aim;
  renderer.render(scene, camera);
});

const round = n => +n.toFixed(2);
window.__game = {
  describe: () => ({ name: 'pachinko', units: 'world units, y up', keys: { ArrowLeft: 'aim left', ArrowRight: 'aim right', ' ': 'drop the ball' }, mouse: 'click the board to drop the ball there' }),
  observe: () => ({ aim: round(aim), ball: { x: round(ball.x), y: round(ball.y) }, inPlay, dropped, pinHits, cup, score }),
  act,
  setState: s => { ({ aim = aim, score = score } = s); },
};
</script>
</body></html>
```

## What Playwright MCP returns on the canvas

These replies come from Playwright MCP 0.0.85, driven over MCP stdio from a script on 2026-11-12 with `--headless --browser chrome --isolated --caps vision --viewport-size 1280x800` (plus `--no-sandbox`, which this container needs for Chrome), on the board served at `http://127.0.0.1:8731`. Claude Code is the client in real use; it was not run for this page, so the replies are shown and what a given model does with them is not. Paths to saved files are shortened to `<out>`.

**1. Navigate.** The reply runs one line of Playwright code and reports the page:

```text
browser_navigate {"url": "http://127.0.0.1:8731/index.html"}

### Page
- Page URL: http://127.0.0.1:8731/index.html
- Page Title: Pachinko
- Console: 1 errors, 4 warnings
### Snapshot
- [Snapshot](<out>/page-2026-11-12T04-36-03-117Z.yml)
```

The console entries, from the log file it saved, were four WebGL `GPU stall due to ReadPixels` warnings from Chrome's software renderer and a 404 for `favicon.ico`.

**2. Snapshot.** `browser_snapshot` returns the page as an accessibility tree in YAML, which is how Playwright MCP finds things to click without a picture. The board's whole page is one canvas with no role or text, and the snapshot's YAML block came back with nothing in it (here and below, the code fences inside a reply are indented):

```text
browser_snapshot {}

### Page
- Page URL: http://127.0.0.1:8731/index.html
- Page Title: Pachinko
- Console: 1 errors, 4 warnings
### Snapshot
    ```yaml

    ```
```

This is what an accessibility snapshot holds for a canvas, and it has come up on Playwright's issue trackers: "Support for Canvas/WebGL Interaction Beyond DOM Elements" ([playwright-mcp #1148](https://github.com/microsoft/playwright-mcp/issues/1148)) was closed with a pointer to `--caps=vision`, and in Playwright's own trace viewer canvas pixels were left out of DOM snapshots until a setting added them ([playwright #23964](https://github.com/microsoft/playwright/issues/23964)). Giving the canvas `role="img"` and an `aria-label` would put one element in the tree, still with nothing about the pins or the ball.

**3. Screenshot.** `browser_take_screenshot` returns the picture as an image the model reads, and saves it:

```text
browser_take_screenshot {}

### Result
- [Screenshot of viewport](<out>/page-2026-11-12T04-36-03-420Z.png)
### Ran Playwright code
    ```js
    // Screenshot viewport and save it as <out>/page-2026-11-12T04-36-03-420Z.png
    await page.screenshot({
      path: '<out>/page-2026-11-12T04-36-03-420Z.png',
      scale: 'css',
      type: 'png'
    });
    ```
```

The picture shows the wooden board, five rows of pins, the ball under the red aim marker at the top, and two blue cups either side of a yellow one. A model reading it can describe the layout; the pixel position of each pin, or which cup is worth what, it has to work out from the image.

**4. Click by pixel, wait, read the state.** With the vision capability, `browser_mouse_click_xy` clicks at viewport coordinates. The page runs in real time, so the drop plays out while the next call waits; `browser_evaluate` then reads the result from the page's own `window.__game`:

```text
browser_mouse_click_xy {"x": 590, "y": 300}

### Ran Playwright code
    ```js
    // Click mouse at coordinates (590, 300)
    await page.mouse.click(590, 300);
    ```

browser_wait_for {"time": 3}

### Result
Waited for 3 seconds

browser_evaluate {"function": "() => window.__game.observe()"}

### Result
{
  "aim": -0.51,
  "ball": {
    "x": -0.6,
    "y": -2.8
  },
  "inPlay": false,
  "dropped": 1,
  "pinHits": 8,
  "cup": "centre",
  "score": 50
}
```

The click landed on the board at x = -0.51 and the ball finished in the centre cup after 8 pin hits. Without `window.__game` in the page, the evaluate call would have had nothing to read, and the screenshot would be the record of where the ball went.

## The same drop with paprika3d

paprika3d is a Claude Code plugin and MCP server that runs the page in its own headless Chrome on a paused clock: each frame is 1/60 s of game time and nothing moves until a tool steps it. These replies came from its stable tools on the same board on 2026-11-12; run folder paths are shortened to `<project>`.

**`look` names what is on screen.** Each line is an object's name, its share of the picture, its pixel box (left, top, right, bottom) and its size in world units:

```text
look {}

Picture: <project>/paprika3d/runs/2026-11-12T04-36-29-564Z/look-1.png
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
On screen (26):
board 32% [400, 35, 879, 764] 7.6 × 5.2 units
wall-left 2.5% [366, 14, 399, 785] 7.6 × 0.6 units
wall-right 2.5% [880, 14, 913, 785] 7.6 × 0.6 units
cup-centre 1.1% [558, 727, 721, 793] 1.62 × 0.5 units, across the view
cup-right 1.1% [725, 727, 888, 793] 1.57 × 0.5 units, across the view
cup-left 1.1% [391, 727, 553, 793] 1.57 × 0.5 units, across the view
ball 0.13% [640, 54, 678, 94]
aim 0.057% [645, 15, 673, 49]
pins* ×18 0.58% [480, 169, 799, 630] 0.5 × 0.16 units, along the view
Never visible: none
```

(The reply also had lines on pixels, hues, tone mapping and the flat board colour, left out here.) The pins come back as one instanced mesh with 18 instances and the box around all of them, and each cup's box gives a pixel to aim at.

**`interact` plays the same click on exact frames.** `until` steps until the ball is out of play, and `trace` reads three values every frame:

```text
interact {"steps": [{"mouse": "click", "x": 590, "y": 300}, {"until": {"inPlay": false}, "max": 400}], "trace": ["ball.y", "ball.x", "pinHits"], "look": true}

{"changed":{"aim":-0.51,"ball":{"x":-2.15,"y":-2.8},"dropped":1,"pinHits":5,"cup":"left","score":10}}
until: inPlay == false held at frame 206
mouse click at (590, 300): over board (Mesh, 10.1 units)
ball.y: 3.7 → -2.8 at frame 206; first changed at frame 2
ball.x: 0.2 → low -2.3 at frame 109 → -2.15 at frame 206; first changed at frame 1
pinHits: 0 → 5 at frame 186; first changed at frame 25
Picture: <project>/paprika3d/runs/2026-11-12T04-36-29-564Z/look-2.png
On screen (26):
...
ball 0.13% [408, 695, 447, 735]
```

The click line names the object under the pointer. The trace says the ball first hit a pin on frame 25, bounced as far left as x = -2.3 (against the left wall, which stops it at 2.5 less its radius) on frame 109, and landed in the left cup on frame 206 after 5 pin hits; the picture after the steps puts the ball's box over `cup-left`.

**Why the cups differ.** The same click at (590, 300) gave the centre cup in the real-time run and the left cup here. The board moves the ball by the time each frame took (capped at 0.1 s), so the path depends on the frame rate the browser happened to run at, and this machine draws WebGL in software. On paprika3d's clock every frame is 1/60 s, so this drop lands in the left cup on every run, and the same steps can be kept as a check: add `"expect": {"cup": "left"}` and `"save": "drop at 590"`, and `test` reruns it after each edit.

## What to read in each reply

- **Playwright MCP's snapshot:** an empty YAML block on a canvas page means the tree has no elements; the scene may still have drawn. Take a screenshot to see it.
- **Playwright MCP's console line:** errors and warnings since the page loaded, with the full log in a file; a three.js error that stops the scene shows up here.
- **`look`'s On screen list:** an object the game should draw that is missing from it drew no pixel. `Never visible` lists named objects no look has seen.
- **`interact`'s trace:** the first and last value of each path, its peak or low and the frame of its first change, so a ball that passes through a pin or never lands shows on the frame it happens.

## What paprika3d does not do here

- It is no general browser automation tool. Logging in, filling forms, several tabs and other sites are Playwright MCP's work, and paprika3d does not replace it there.
- It runs the page in its own headless Chrome, never in the person's own browser, so a page that needs a signed-in session or a browser extension is out of its reach.
- Without a GPU, Chrome draws WebGL in software (SwiftShader), so frame times on such a machine say nothing of a real GPU. It does not run the page on phones or other real devices, and it plays no sound.
- It reads three.js scenes by name. On a 2D canvas or another engine's canvas it still opens, pictures and clicks the page, but the named object lists come from three.js.

## Related

- [Screenshot a three.js scene headless from a coding agent](/guides/screenshot-threejs-scene-headless): the screenshot itself, from four sides and at phone sizes.
- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): keys on exact frames and checks that rerun.
- [A Playwright alternative for three.js and WebGL pages built by agents](/guides/playwright-alternative-threejs-webgl): a harness beside a hand-written browser script.
- [Chrome DevTools MCP vs Playwright MCP for a three.js page](/guides/chrome-devtools-mcp-vs-playwright-mcp): the two browser servers side by side, and DevTools' performance trace.
- [three.js click on object with a Raycaster](/guides/threejs-click-on-object-raycaster): making a click inside the scene find its object.
- [Control time in three.js tests, and keep movement frame-rate independent](/guides/control-time-threejs-tests): the paused clock behind the repeatable drop.
