---
title: Cline browser tool on a three.js game, and the same in Roo Code and Kilo Code
phrase: cline browser
description: What Cline's browser tool, browser_action, did on a three.js canvas (a 900 x 600 Puppeteer window, clicks by coordinates, a screenshot after each action), where it stands in Cline 4, Roo Code and Kilo Code, and how to add paprika3d to each one's MCP settings to draw a bow on exact frames and read where the arrow landed.
meta: Cline browser tool on a three.js game: what browser_action sees in a canvas, and paprika3d in the MCP settings of Cline, Roo Code and Kilo Code.
intent: cline-browser-tool
queries:
  - "cline browser"
  - "cline playwright mcp"
  - "roo code browser"
  - "kilo code browser"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# Cline browser tool on a three.js game, and the same in Roo Code and Kilo Code

Cline's browser tool was `browser_action` in Cline 3: a Puppeteer browser at 900 × 600 that clicks by x and y, types, scrolls, and returns a screenshot and the console after each action. Cline 4 lists no browser tool among its built-ins, Roo Code removed browser use in version 3.48.0, and Kilo Code has a browser of its own. On a three.js game, any of them gets pictures of a canvas; to give it named objects, exact frames and the game's state, add paprika3d as an MCP server. In the Cline CLI that is one line:

```bash
cline mcp add paprika --yes -- npx -y paprika3d serve
```

The VS Code extensions take the same server in their MCP settings files, shown below for each. paprika3d's `open` runs the page in a headless Chrome on a paused clock, `look` lists what is on screen by name with pixel boxes, and `interact` holds and releases the mouse on exact frames and reports what the game did. The game here is an archery range: a bow drawn by holding the mouse button.

## The browser tool in Cline, Roo Code and Kilo Code

Read on 2026-11-12. These extensions change often and this page did not run any of them, so check the sources before you rely on a detail.

| Extension | Browser tool | Source |
|---|---|---|
| Cline 3 | `browser_action`: launch, click, type, scroll_down, scroll_up, close; a 900 × 600 window by default, with presets up to 1280 × 800 | [the tool's description in Cline's source](https://github.com/cline/cline/blob/v3.39.0/src/core/prompts/system-prompt/tools/browser_action.ts), [its default settings](https://github.com/cline/cline/blob/v3.39.0/src/shared/BrowserSettings.ts) |
| Cline 4, released 2026-06-26 | none among the built-in tools; `fetch_web_content` fetches a page's content | [Cline's tools reference](https://docs.cline.bot/tools-reference/all-cline-tools) |
| Roo Code | removed: "Remove browser use functionality entirely", in 3.48.0 | [Roo Code's changelog](https://github.com/RooCodeInc/Roo-Code/blob/main/CHANGELOG.md) |
| Kilo Code | browser automation, on by a switch in Settings, Web Tools, Browser Automation | [Kilo's Browser Use page](https://kilo.ai/docs/code-with-ai/features/browser-use) |

The Cline 3 tool's description sets its rules: "Every action, except `close`, will be responded to with a screenshot of the browser's current state, along with any new console logs." A click is "Click at a specific x,y coordinate", with coordinates the model reads off the last screenshot, and while the browser is open no other tool may be used, so it closes before Cline edits a file and launches again to check the result. Kilo's page says its browser "can navigate to URLs, click elements, fill in forms, scroll, hover, select from dropdowns, and drag and drop" and "returns screenshots after each action"; it uses your installed Chrome, or a Chromium that Playwright downloads.

## What a click by coordinates does to a bow

A screenshot of this game shows a target and a bow, and a click at the gold lands on the canvas at that point. The bow, though, is drawn by holding the button: the longer it is held, up to one second, the faster the arrow leaves. A click presses and releases in the same moment, so the arrow leaves with no draw at all. paprika3d's `interact` can send a plain click too, which shows what that shot does:

```text
interact {"steps":[{"state":{"last":null,"arrow":null}},{"mouse":"click","x":640,"y":268},{"until":{"last.points":null},"max":240}],"trace":["draw","arrow.z"]}

{"changed":{"aim":{"y":3.4},"shots":1,"last":{"ground":{"x":0,"z":-9.97},"points":0},"arrow":{"x":0,"y":0.02,"z":-9.97}}}
until: last.points exists held at frame 40
mouse click at (640, 268): over nothing in the scene
draw: 0 throughout the 40 frames
arrow.z (in observe() from frame 1): -0.25 → -9.97 at frame 40; first changed at frame 2
```

`draw` stayed 0, and the arrow came down on the lawn 9.97 metres out, well short of a target 25 metres away. From screenshots alone, the model would see an arrow in the grass and have to guess why.

## Add paprika3d to each extension

**Cline.** In the Cline panel, click the MCP Servers icon, open the Configure tab and click Configure MCP Servers, per [Cline's MCP page](https://docs.cline.bot/mcp/mcp-overview); that opens the settings JSON, where the server goes under `mcpServers`. The CLI keeps the same file at `~/.cline/data/settings/cline_mcp_settings.json`, and `cline mcp add`, above, writes it for you.

```json
{
  "mcpServers": {
    "paprika": { "command": "npx", "args": ["-y", "paprika3d", "serve"], "disabled": false, "autoApprove": [] }
  }
}
```

**Roo Code.** In the MCP view, Edit Global MCP opens `mcp_settings.json` and Edit Project MCP opens `.roo/mcp.json` in the project, both with an `mcpServers` object, per [Roo's MCP page](https://github.com/RooCodeInc/Roo-Code-Docs/blob/main/docs/features/mcp/using-mcp-in-roo.mdx). Its `timeout` is in seconds, 60 by default; the entry below allows a slow first start of Chrome:

```json
{
  "mcpServers": {
    "paprika": { "command": "npx", "args": ["-y", "paprika3d", "serve"], "timeout": 180 }
  }
}
```

**Kilo Code.** MCP servers live in Kilo's own config file under an `mcp` key, per [Kilo's MCP page](https://kilo.ai/docs/automate/mcp/using-in-kilo-code): `~/.config/kilo/kilo.jsonc` for every project, or `kilo.jsonc` (or `.kilo/kilo.jsonc`) in the project. The command is a list, and `timeout` is in milliseconds:

```json
{
  "mcp": {
    "paprika": { "type": "local", "command": ["npx", "-y", "paprika3d", "serve"], "enabled": true, "timeout": 180000 }
  }
}
```

The skills, short instructions on when to call each tool, install with `npx skills add Keeno-Corp/paprika3d`, which asks which agents to install for; each extension's skills page lists the folders it reads.

## The game: archery

Hold the mouse button to draw (a full draw takes a second), aim with the pointer, and let go to shoot. The arrow leaves between 15 and 40 metres a second, depending on the draw, and falls under gravity. Save it as `index.html` next to `node_modules/three` (`npm install three`):

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Archery</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rules: hold the mouse button to draw the bow (a full draw takes 1 s), aim with the pointer, let go to shoot.
// The arrow leaves faster the further the bow was drawn and falls under gravity. Units are metres; the target is 25 m away.
const BOW = new THREE.Vector3(0, 1.4, 0), TARGET = new THREE.Vector3(0, 1.4, -25), RING = 0.24, RINGS = 5;
const MIN_SPEED = 15, MAX_SPEED = 40, GRAVITY = 9.8, DRAW_TIME = 1;
let drawing, draw, aim, arrow, shots, last;
function start() { drawing = false; draw = 0; aim = TARGET.clone(); arrow = null; shots = 0; last = null; }
function shoot() {
  const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * draw;
  const v = aim.clone().sub(BOW).normalize().multiplyScalar(speed);
  arrow = { p: BOW.clone(), v };
  drawing = false; draw = 0; shots++;
}
function step(dt) {
  if (drawing) draw = Math.min(1, draw + dt / DRAW_TIME);
  if (!arrow) return;
  const p0 = arrow.p.clone();
  arrow.v.y -= GRAVITY * dt;
  arrow.p.addScaledVector(arrow.v, dt);
  if (p0.z > TARGET.z && arrow.p.z <= TARGET.z) {   // reaching the target's plane: where does it cross?
    const t = (p0.z - TARGET.z) / (p0.z - arrow.p.z), x = p0.x + (arrow.p.x - p0.x) * t, y = p0.y + (arrow.p.y - p0.y) * t;
    const r = Math.hypot(x - TARGET.x, y - TARGET.y);
    if (r < RING * RINGS && y > 0) { last = { x: +x.toFixed(2), y: +y.toFixed(2), ring: Math.floor(r / RING) + 1, points: RINGS - Math.floor(r / RING) }; arrow.p.set(x, y, TARGET.z + 0.05); arrow.v.set(0, 0, 0); arrow.stuck = true; return; }
  }
  if (arrow.p.y <= 0) { last = { ground: { x: +arrow.p.x.toFixed(2), z: +arrow.p.z.toFixed(2) }, points: 0 }; arrow.p.y = 0.02; arrow.v.set(0, 0, 0); arrow.stuck = true; }
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfd8ea);
scene.fog = new THREE.Fog(0xbfd8ea, 30, 90);
const camera = new THREE.PerspectiveCamera(22, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0.5, 1.8, 3);
camera.lookAt(0, 1.6, -25);
scene.add(new THREE.HemisphereLight(0xffffff, 0x60804a, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(-4, 10, 6);
scene.add(sun);
const lawn = new THREE.Mesh(new THREE.PlaneGeometry(60, 120), new THREE.MeshStandardMaterial({ color: 0x78a858 }));
lawn.name = 'lawn'; lawn.rotation.x = -Math.PI / 2; lawn.position.z = -30; scene.add(lawn);
const butt = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.4, 48), new THREE.MeshStandardMaterial({ color: 0xc9a46a }));
butt.name = 'straw butt'; butt.rotation.x = Math.PI / 2; butt.position.set(TARGET.x, TARGET.y, TARGET.z - 0.21); scene.add(butt);
['gold', 'red', 'blue', 'black', 'white'].forEach((name, i) => {   // ring 1 is the gold in the middle
  const colour = [0xf2c623, 0xd8322b, 0x2f7fd0, 0x222222, 0xf2f2f2][i];
  const m = new THREE.Mesh(new THREE.RingGeometry(i * RING, (i + 1) * RING, 48), new THREE.MeshStandardMaterial({ color: colour }));
  m.name = `${name} ring`; m.position.copy(TARGET); m.position.z += 0.001 * (5 - i); scene.add(m);
});
const bow = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 8, 32, Math.PI), new THREE.MeshStandardMaterial({ color: 0x7a4a22 }));
bow.name = 'bow'; bow.rotation.set(0, -Math.PI / 2, Math.PI / 2); bow.position.set(0.2, 1.3, -0.8); scene.add(bow);   // limbs up and down, bending toward the target
const arrowMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6), new THREE.MeshStandardMaterial({ color: 0x333333 }));
arrowMesh.name = 'arrow'; scene.add(arrowMesh);

// The pointer aims: its ray from the camera meets the target's plane, and the arrow leaves the bow toward that point.
const ray = new THREE.Raycaster(), face = new THREE.Plane(new THREE.Vector3(0, 0, 1), -TARGET.z);
const pointAt = e => { ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1), camera); ray.ray.intersectPlane(face, aim); };
addEventListener('pointerdown', e => { pointAt(e); drawing = true; draw = 0; });
addEventListener('pointermove', e => pointAt(e));
addEventListener('pointerup', () => { if (drawing) shoot(); });
addEventListener('keydown', e => { if (e.code === 'KeyR') start(); });
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

start();
let prev = null;
renderer.setAnimationLoop(now => {
  step(prev === null ? 1 / 60 : Math.min((now - prev) / 1000, 0.1));
  prev = now;
  arrowMesh.visible = !!arrow;
  if (arrow) {
    arrowMesh.position.copy(arrow.p);
    if (!arrow.stuck) arrowMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arrow.v.clone().normalize());
  }
  bow.scale.x = 1 - 0.3 * draw;   // the bow bends as it is drawn
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'archery', units: 'metres, y up, the target 25 m down -z', mouse: 'hold to draw, the pointer aims, let go to shoot', keys: { KeyR: 'restart' } }),
  observe: () => ({ draw: +draw.toFixed(2), drawing, aim: { x: +aim.x.toFixed(2), y: +aim.y.toFixed(2) }, shots, last,
    arrow: arrow ? { x: +arrow.p.x.toFixed(2), y: +arrow.p.y.toFixed(2), z: +arrow.p.z.toFixed(2) } : null }),
  act: ({ key, down = true }) => { if (key === 'KeyR' && down) start(); },
  setState: s => { if ('shots' in s) shots = s.shots; if ('last' in s) last = s.last; if ('arrow' in s && !s.arrow) arrow = null; },
};
</script>
</body></html>
```

`last` in `observe()` is where the last arrow ended: on the target, with its ring and points, or on the ground, with its distance.

## The calls, and the replies

From paprika3d's MCP server on this page on 2026-11-12, on a Linux machine with no graphics card, called directly; each extension above would get the same replies. Run folders are shortened to `<project>`, and the `look` reply is cut to the lines used here.

**Look at the range.**

```text
look {}

Picture: <project>/paprika3d/runs/2026-11-12T04-57-51-457Z/look-1.png
On screen (8):
lawn 45% [0, 425, 1279, 799] 120 × 60 units, along the view
bow 0.97% [506, 376, 544, 799] 1.05 × 0.525 units
white ring 0.86% [552, 327, 727, 502] 2.4 × 2.4 units
black ring 0.67% [570, 344, 710, 484] 1.92 × 1.92 units
straw butt 0.63% [541, 316, 738, 513]
blue ring 0.48% [587, 362, 692, 467] 1.44 × 1.44 units
red ring 0.28% [605, 379, 674, 449] 0.96 × 0.96 units
gold ring 0.096% [622, 397, 657, 431] 0.48 × 0.48 units
Never visible: none
Hidden by the game (visible false on it or a parent): arrow
```

The gold's box centres on (640, 414). That is the first place to aim.

**Draw for 60 frames at the gold.** A `{ state }` step clears the last shot, the button goes down on the gold, 60 frames pass (one second, a full draw), and the button comes up:

```text
interact {"steps":[{"state":{"last":null,"arrow":null}},{"mouse":"down","x":640,"y":414},{"wait":60},{"mouse":"up","x":640,"y":414},{"until":{"last.points":null},"max":240}],"trace":["draw","arrow.z"]}

{"changed":{"aim":{"y":1.41},"shots":2,"last":{"ground":{"z":-21.33}},"arrow":{"z":-21.33}}}
until: last.points exists held at frame 93
mouse down at (640, 414): over gold ring (Mesh, 28 units)
draw: 0 → peak 1 at frame 60 → 0 at frame 62; first changed at frame 1
arrow.z (in observe() from frame 62): -0.67 → -21.33 at frame 93; first changed at frame 63
```

Full draw, aimed at the gold, and the arrow dropped into the lawn at 21.33 metres: gravity pulls it below the line of aim, as with a real bow, so the aim has to go above the gold.

**Aim higher, and keep the shot as a check.** The pointer moves up to (640, 268), above the target:

```text
interact {"steps":[{"state":{"last":null,"arrow":null}},{"mouse":"down","x":640,"y":268},{"wait":60},{"mouse":"up","x":640,"y":268},{"until":{"last.points":null},"max":240}],"trace":["draw","arrow.z"],"expect":{"last.ring":1,"last.points":5},"save":"full-draw-into-the-gold"}

{"changed":{"aim":{"y":3.4},"shots":1,"last":{"x":0,"y":1.42,"ring":1,"points":5},"arrow":{"x":0,"y":1.42,"z":-24.95}}}
until: last.points exists held at frame 99
mouse down at (640, 268): over nothing in the scene
draw: 0 → peak 1 at frame 60 → 0 at frame 62; first changed at frame 1
arrow.z (in observe() from frame 62): -0.66 → -24.95 at frame 99; first changed at frame 63
Expect: last.ring 1 ✓ · last.points 5 ✓
Saved check "full-draw-into-the-gold" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

The arrow struck at a height of 1.42 against the gold's centre at 1.4: ring 1, five points. The mouse step said "over nothing in the scene" because the aim point is in the sky above the target, which is right for this shot.

**Same aim, let go at half a second.**

```text
interact {"steps":[{"state":{"last":null,"arrow":null}},{"mouse":"down","x":640,"y":268},{"wait":30},{"mouse":"up","x":640,"y":268},{"until":{"last.points":null},"max":240}],"trace":["draw","arrow.z"]}

{"changed":{"shots":2,"last":{"ground":{"x":0,"z":-22.26},"points":0},"arrow":{"y":0.02,"z":-22.26}}}
until: last.points exists held at frame 79
mouse down at (640, 268): over nothing in the scene
draw: 0 → peak 0.52 at frame 31 → 0 at frame 32; first changed at frame 1
arrow.z (in observe() from frame 32): -0.46 → -22.26 at frame 79; first changed at frame 33
```

Half the draw, and the arrow fell short at 22.26 metres. Three shots at one aim point (a click, half a draw, a full draw) landed at 9.97, 22.26 and in the gold, so how long the button is held is the whole game, and the frame count is what a test of it has to control.

**Rerun after a change.**

```text
test {}

✓ full-draw-into-the-gold
1 of 1 saved checks passed in 0.9 s
```

If a later change makes the arrows heavier or the draw slower, this check fails and says so.

## Pitfalls

- **Begin a play with a step that runs a frame.** Each play above starts with a `{ state }` step; on a page fresh from `open`, still at frame 0, a mouse step sent first reached the game after the call's frames had run.
- **A hold is two steps with a wait between.** `{ "mouse": "down" }`, `{ "wait": 60 }`, `{ "mouse": "up" }` holds the button for 60 frames; `click` is a press and release together.
- **Name what the player aims at.** `look` reports each ring by name, so the agent aims from the gold's box rather than from a guess at colours.

## What paprika3d does not do

It is not a browser tool inside Cline, Roo Code or Kilo Code, and it does not drive the browser any of them opens; it runs a headless Chrome of its own beside them, through MCP. It sees no screen and no window you have open. On a machine with no graphics card its Chrome draws in software, so frame times there say nothing about a player's GPU. It tells you where each arrow went, not whether the bow feels good to draw. And the Claude Code plugin's hooks and slash commands stay in Claude Code; these extensions get the tools, and the skills if you install them.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): keys and state on exact frames, saved checks.
- [Screenshot a three.js scene headless from a coding agent](/guides/screenshot-threejs-scene-headless): the picture and the on-screen list.
- [three.js click on object with a Raycaster](/guides/threejs-click-on-object-raycaster): turning a pointer position into what it is over.
- [MCP server that screenshots a WebGL canvas](/guides/mcp-server-screenshot-webgl-canvas): the screenshot in the tool result.
- [A Playwright alternative for three.js and WebGL pages](/guides/playwright-alternative-threejs-webgl): the same checks written as a browser script.
