---
title: Can Claude Code see the browser? Its browser tools on a three.js game, and what each one sees
phrase: can claude code see the browser
description: Claude Code sees a browser in three ways (Claude in Chrome, the desktop app's Browser pane, a browser MCP server), and on a three.js page each one sees the picture and the console, with one canvas element where the scene is. What each gives, how to turn it on, and a snow globe checked with paprika3d, whose open reports a console error, whose look names the houses, tree and snow, and whose interact shakes the globe and steps until the snow lands.
meta: Can Claude Code see the browser? Three ways it does, what each sees on a three.js canvas, and a snow globe it opens, looks at and shakes.
intent: claude-code-see-the-browser
queries:
  - "can claude code see browser"
  - "how to get claude code see browser"
  - "give claude eyes"
  - "[FEATURE] Native Browser Integration for Visual UI Testing and Development"
  - "Show HN: ProofShot – Give AI coding agents eyes to verify the UI they build"
  - "How can Claude Code see what my three.js scene actually looks like while it works on it?"
  - "claude code see three.js scene"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# Can Claude Code see the browser? Its browser tools on a three.js game, and what each one sees

Yes. Claude Code sees a browser in three ways: Claude in Chrome (`claude --chrome`, which drives your own Chrome through an extension), the desktop app's Browser pane, and a browser MCP server such as Playwright MCP or Chrome DevTools MCP. On a three.js page all three see the screenshot and the console, and the scene itself is one `<canvas>` element to them: they can describe the picture but not name the meshes in it or step the game frame by frame. For that, add paprika3d, which opens the page in its own headless Chrome and reads the three.js scene:

```bash
claude plugin marketplace add Keeno-Corp/paprika3d && claude plugin install paprika3d@paprika3d
```

In Cursor, Codex, Gemini CLI or another MCP client, register `npx -y paprika3d serve` as a stdio server.

paprika3d needs Google Chrome, Node 20.11 or later and Claude Code 2.1.118 or later. This page compares the three built-in ways, then checks a small snow globe game with paprika3d's tools.

## The three ways Claude Code sees a page

| | Claude in Chrome | The desktop app's Browser pane | A browser MCP server |
|---|---|---|---|
| Turn it on | `claude --chrome`, or `/chrome` and **Enabled by default** | Cmd+Shift+B (Ctrl+Shift+B on Windows), or **Browser** in the session's title bar | `claude mcp add playwright npx @playwright/mcp@latest`, or Chrome DevTools MCP's line |
| Needs | the Claude in Chrome extension (1.0.36 or later), Chrome or Edge, a Pro, Max, Ultra, Team or Enterprise plan signed in with `/login` | Claude Desktop 1.2581.0 or later | Node, and the browser the server drives |
| Which browser | yours, with your logins, in a window you can watch | a tabbed browser inside the app | one the server starts, headless or in a window |
| What Claude can do | screenshots, console errors, the DOM, clicks, typing, forms, a GIF of the session | screenshots, the DOM, clicks, forms; it checks the running app after each edit | accessibility snapshots, screenshots, console, clicks (pixel clicks with a vision option) |
| Docs | [code.claude.com/docs/en/chrome](https://code.claude.com/docs/en/chrome) | [code.claude.com/docs/en/desktop](https://code.claude.com/docs/en/desktop) | [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp) |

Each comes with conditions in its docs. Claude in Chrome is off when Claude Code runs on an API key or a `claude setup-token` token, on Bedrock, Vertex or Foundry, and in WSL. The Browser pane's tools are not there in SSH sessions, and dev servers for it are listed in `.claude/launch.json`. Claude Code's issue tracker has reports of the pane crashing, one on a WebGL page with its context lost ([#80247](https://github.com/anthropics/claude-code/issues/80247)) and one as the pane opens ([#81275](https://github.com/anthropics/claude-code/issues/81275)). Claude in Chrome and the Browser pane need a desktop session and a person's browser, so neither was run for this page; their rows come from the docs linked in the table. What Playwright MCP and Chrome DevTools MCP return on a three.js canvas, with their real replies, is on the two pages under Related.

**What they share on a canvas.** All three read the page as a document. A three.js game puts its world into one `<canvas>`, so the DOM and the accessibility tree hold that one element and nothing about the houses, the player or the score. What Claude learns about the scene comes from the screenshot (a model looking at a picture) and from the console. A game that moves on its own keeps moving between a click and the next screenshot, since each of them runs the page in real time.

## The snow globe

A village of three houses and a fir tree under a glass dome, with 300 snowflakes as one `THREE.Points`. Space shakes the globe: the flakes fly up, fall, slide along the glass and settle on the ground or on a flat roof. Every mesh has a `name`, and the page exposes `window.__game` so its state reads as JSON. Save it as `index.html` beside `npm install three`.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Snow globe</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// A snow globe: Space shakes it, the snow flies up and settles on the ground and the roofs.
const FLAKES = 300, CENTRE = new THREE.Vector3(0, 1, 0), RADIUS = 2, GRAVITY = 3, DRAG = 1.5;
const HOUSES = [   // [name, x, z, width, depth, height]
  ['house-red', -0.7, 0.2, 0.6, 0.5, 0.5],
  ['house-blue', 0.5, -0.4, 0.5, 0.5, 0.6],
  ['house-green', 0.6, 0.6, 0.4, 0.4, 0.4],
];
const pos = new Float32Array(FLAKES * 3), vel = new Float32Array(FLAKES * 3), resting = new Uint8Array(FLAKES);
let shakes = 0, tilt = 0;

// The surface a flake lands on at (x, z): a flat roof inside a house's footprint, else the ground.
const floorAt = (x, z) => {
  for (const [, hx, hz, w, d, h] of HOUSES) if (Math.abs(x - hx) < w / 2 + 0.06 && Math.abs(z - hz) < d / 2 + 0.06) return h + 0.08;
  return 0;
};
function settleAll() {   // the starting state: every flake lying somewhere on the ground or a roof
  for (let i = 0; i < FLAKES; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 1.5;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    pos.set([x, floorAt(x, z), z], i * 3); vel.fill(0, i * 3, i * 3 + 3); resting[i] = 1;
  }
}
function shake() {
  shakes++; tilt = 0.25;
  for (let i = 0; i < FLAKES; i++) {
    vel.set([(Math.random() - 0.5) * 2, 2 + Math.random() * 2, (Math.random() - 0.5) * 2], i * 3);
    resting[i] = 0;
  }
}
const p = new THREE.Vector3();
function step(dt) {
  tilt *= Math.max(0, 1 - 4 * dt);
  for (let i = 0; i < FLAKES; i++) {
    if (resting[i]) continue;
    const k = i * 3;
    vel[k + 1] -= GRAVITY * dt;
    for (let j = 0; j < 3; j++) { vel[k + j] *= 1 - DRAG * dt; pos[k + j] += vel[k + j] * dt; }
    p.fromArray(pos, k).sub(CENTRE);   // keep the flake inside the glass: it slides along it
    if (p.length() > RADIUS - 0.05) {
      p.setLength(RADIUS - 0.05);
      const n = p.clone().normalize(), out = Math.max(0, vel[k] * n.x + vel[k + 1] * n.y + vel[k + 2] * n.z);
      for (let j = 0; j < 3; j++) vel[k + j] -= out * n.getComponent(j);
      p.add(CENTRE).toArray(pos, k);
    }
    const floor = floorAt(pos[k], pos[k + 2]);
    if (pos[k + 1] <= floor && vel[k + 1] <= 0) { pos[k + 1] = floor; resting[i] = 1; }
  }
}

function act({ key, down = true }) { if (key === ' ' && down) shake(); }
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.key }); });

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202838);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 50);
camera.position.set(0, 2.2, 7);
camera.lookAt(0, 0.8, 0);
scene.add(new THREE.HemisphereLight(0xdde8ff, 0x403028, 1.5));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(3, 5, 4);
scene.add(sun);

const globe = new THREE.Group();   // tilts on a shake; everything inside moves with it
scene.add(globe);
const mesh = (name, geometry, color, x, y, z, extra = {}) => {
  const m = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, ...extra }));
  m.name = name; m.position.set(x, y, z); globe.add(m); return m;
};
mesh('base', new THREE.CylinderGeometry(1.9, 2.1, 0.6, 48), 0x5a3a22, 0, -0.3, 0);
mesh('ground', new THREE.CircleGeometry(1.75, 48).rotateX(-Math.PI / 2), 0xe8eef4, 0, 0.001, 0);
for (const [name, x, z, w, d, h] of HOUSES) {
  const colour = { 'house-red': 0xb04030, 'house-blue': 0x3a5a9a, 'house-green': 0x3a7a4a }[name];
  const house = mesh(name, new THREE.BoxGeometry(w, h, d), colour, x, h / 2, z);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.08, d + 0.12), new THREE.MeshStandardMaterial({ color: 0x40302a }));
  roof.position.y = h / 2 + 0.04;   // position is read-only on an Object3D: set it, never assign it
  house.add(roof);
}
mesh('tree', new THREE.ConeGeometry(0.3, 1, 12), 0x2a5a3a, -0.3, 0.5, -0.7);
const glass = mesh('glass', new THREE.SphereGeometry(RADIUS, 48, 24), 0xcfe4ff, CENTRE.x, CENTRE.y, CENTRE.z,
  { transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false });
glass.renderOrder = 1;
const snowGeometry = new THREE.BufferGeometry();
snowGeometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const snow = new THREE.Points(snowGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09 }));
snow.name = 'snow';
snow.frustumCulled = false;   // the flakes move every frame; the first bounding sphere would go stale
globe.add(snow);
settleAll();

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  globe.rotation.z = tilt * Math.sin(now / 60);
  snowGeometry.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
});

const count = test => { let n = 0; for (let i = 0; i < FLAKES; i++) if (test(i)) n++; return n; };
window.__game = {
  describe: () => ({ name: 'snow globe', units: 'world units, y up', keys: { ' ': 'shake the globe' } }),
  observe: () => ({
    shakes,
    airborne: count(i => !resting[i]),
    onRoofs: count(i => resting[i] && pos[i * 3 + 1] > 0),
    highest: +Math.max(...Array.from({ length: FLAKES }, (_, i) => pos[i * 3 + 1])).toFixed(2),
  }),
  act,
  setState: s => { if (s.settle) settleAll(); },
};
</script>
</body></html>
```

## What paprika3d sees, call by call

Each call is followed by the reply paprika3d's stable tools gave for this page on 2026-11-12, on a machine with no GPU, where Chrome draws WebGL in software. Run folder paths are shortened to `<project>`.

**1. A first version, and the error in `open`'s reply.** The first version of this page built each roof in one expression:

```js
house.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.08, d + 0.12),
  new THREE.MeshStandardMaterial({ color: 0x40302a })), { position: new THREE.Vector3(0, h / 2 + 0.04, 0) }));
```

`open` loads the page and pauses its clock at frame 0, and its reply carries any console error so far (lines on helper files left out):

```text
open {"url": "index.html", "cwd": "<project>"}

Opened http://127.0.0.1:42017/index.html in 3.1 s, paused at frame 0.
GPU: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). A software renderer (no GPU): frame times here say nothing of a real GPU's.
The page took 3.1 s to its first frame; expected on this software renderer, nothing to do.
Page text outside the canvas: none
{"three":"186","scenes":1,"entities":[]}
Errors so far:
Cannot assign to read only property 'position' of object '#<Mesh>' (index.html:87:20)
Object.assign (<anonymous>)
Next: `look` to see it, then `interact` for each interaction the request names.
```

An `Object3D`'s `position` is a read-only property, so `Object.assign` throws, the script stops at the first house, and `window.__game` is never set: the reply's last JSON line lists no named objects. The fix is the three lines in the page above, which set `roof.position.y` instead. The next tool call reloads the edited page by itself.

**2. Open the fixed page.** (The GPU line and the lines on helper files are left out.)

```text
open {"url": "index.html", "cwd": "<project>"}

Opened http://127.0.0.1:43683/index.html in 0.1 s, paused at frame 0.
Page text outside the canvas: none
{"name":"snow globe","units":"world units, y up","keys":{" ":"shake the globe"}}
Next: `look` to see it, then `interact` for each interaction the request names.
```

**3. Look.** The picture comes back in the reply with a list of the named objects on screen, each with its share of the picture and its pixel box (left, top, right, bottom):

```text
look {}

Picture: <project>/paprika3d/runs/2026-11-12T04-49-47-145Z/look-1.png
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
On screen (10):
base 9.3% [316, 449, 963, 765]
ground 4.9% [369, 454, 910, 621] 3.5 × 3.5 units
house-red ×2 1.1% [466, 429, 588, 539]
tree 0.5% [575, 353, 639, 500]
house-green ×2 0.73% [694, 461, 788, 558]
house-blue ×2 0.62% [667, 397, 762, 510]
snow 0.25% [408, 396, 863, 600]
Never visible: none
Not found by the ID image (their own vertex shader places them, or they are see-through; see the picture): glass
```

(Pixel and hue lines are left out.) `×2` is the house and its unnamed roof, counted under the house's name. The glass is nearly transparent (`opacity: 0.12`), so the ID image, which finds objects by their pixels, cannot place it, and the reply says to check it in the picture, where it shows as a faint dome.

**4. Shake it and look 20 frames later.**

```text
interact {"steps": [{"key": " "}, {"wait": 20}], "look": true}

{"changed":{"shakes":1,"airborne":300,"onRoofs":0,"highest":1.57}}
Picture: <project>/paprika3d/runs/2026-11-12T04-49-47-145Z/look-2.png
On screen (10):
base 9.3% [321, 449, 968, 765]
ground 5.1% [370, 453, 910, 622] 3.5 × 3.5 units
house-red ×2 1.1% [462, 431, 585, 545]
snow 0.68% [365, 271, 888, 536]
...
```

Every flake is in the air, the highest at 1.57 units, and the snow's box in the picture grew upward from a top of 396 px to 271 px: the state and the picture agree. The picture shows white flakes over the roofs and the tree, and the globe tilted by the shake.

**5. Step until the snow lands.** `until` steps frames until the state holds, and `trace` follows three values frame by frame:

```text
interact {"steps": [{"until": {"airborne": 0}, "max": 600}], "trace": ["airborne", "highest", "onRoofs"], "look": true}

{"changed":{"airborne":0,"onRoofs":44,"highest":0.68}}
until: airborne == 0 held at frame 113
airborne: 300 → 0 at frame 113; first changed at frame 12
highest: 1.57 → peak 1.8 at frame 18 → 0.68 at frame 89; first changed at frame 1
onRoofs: 0 → 44 at frame 76; first changed at frame 12
```

The last flake landed 113 frames after the step began, 44 flakes ended on roofs, and the highest flake rose to 1.8 before falling. On the paused clock each frame is 1/60 s of game time, and `Math.random` is seeded, so the same two calls give the same numbers on the same frames next time. An earlier draft of this page stopped short here: 13 flakes stayed in the air after 600 frames, because hitting the glass set a flake's speed to zero and it crept down the wall; the page now takes away just the part of the speed that points out of the glass.

## What to read in the replies

- `Errors so far` in `open`'s reply: console errors from loading the page. A script that throws before `window.__game` is set shows up here and as an empty `entities` list.
- `On screen` in `look`'s reply: an object that should be in view and is missing drew no pixel; `Not found by the ID image` names see-through objects to check by eye in the picture.
- `until` and `trace` in `interact`'s reply: whether the rule finished, on which frame, and the peak along the way. A flake that never lands shows as `not met` with the count still in the air.

## What paprika3d does not do here

- It never drives your own Chrome or uses your logins; Claude in Chrome does that. Its browser is headless, so there is no window to watch while it plays.
- Without a GPU, Chrome draws WebGL in software (SwiftShader), and frame times there say nothing of a real GPU. It does not run the page on a phone or other real device, and it plays no sound (it reports the sounds a page started).
- It names objects from a three.js scene. On another engine's canvas it still opens, pictures and plays the page, without the named lists.
- It does not judge whether the globe looks good. The picture is in the reply for Claude and for you to judge.

## Related

- [Screenshot a three.js scene headless from a coding agent](/guides/screenshot-threejs-scene-headless): the screenshot itself, one object from four sides, phone sizes.
- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): keys on exact frames, state read back, checks that rerun.
- [Claude Code Playwright MCP on a three.js game](/guides/claude-code-playwright-mcp): Playwright MCP's setup in Claude Code and its replies on a canvas.
- [Chrome DevTools MCP vs Playwright MCP for a three.js page](/guides/chrome-devtools-mcp-vs-playwright-mcp): the two browser servers side by side.
- [MCP server that screenshots a WebGL canvas, for three.js pages](/guides/mcp-server-screenshot-webgl-canvas): the picture in the tool result, for any MCP client.
- [How to make a game with Claude Code](/guides/make-a-game-with-claude-code): from install to a first game.
