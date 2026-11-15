---
title: Windsurf browser preview on a three.js game, and what the agent can check there
phrase: windsurf browser preview
description: What Windsurf's browser preview (Windsurf is now Devin Desktop) gives its agent on a three.js game drawn in one canvas, and how adding paprika3d to Windsurf's MCP config lets the agent open the game, list the boat and rocks by name and steer on exact frames, with the boat's distance to the nearest rock in each reply.
meta: Windsurf browser preview on a three.js game: what the agent sees there, and an MCP server that lets it play the game frame by frame.
intent: windsurf-browser-preview
queries:
  - "windsurf browser preview"
  - "windsurf playwright mcp"
  - "windsurf browser"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# Windsurf browser preview on a three.js game, and what the agent can check there

Windsurf's preview shows a three.js game in a browser pane next to the agent, and you can send the agent page elements and console errors from it. A game drawn in one `<canvas>` gives it one element with no boat or rock in it, so the agent cannot tell from the preview where things are or what happens when you steer. To give it a browser it can play the game in, add paprika3d's MCP server to Windsurf's MCP config, under `mcpServers`: `"paprika": { "command": "npx", "args": ["-y", "paprika3d", "serve"] }`.

This page shows both on one small game, a paper boat carried down a stream past four rocks. It covers what the preview hands the agent, where Windsurf keeps its MCP settings, and the replies paprika3d's tools gave on the game: the boat and the rocks by name, a run that hits the first rock, a rule the reply caught, and a steered run saved as a check that reruns.

## Windsurf is called Devin Desktop now

The Devin Desktop FAQ says "On June 2, 2026, Windsurf is becoming Devin Desktop", "the same IDE, same editor", arriving as an update that carries settings over. windsurf.com now redirects to devin.ai/desktop, and the docs moved from docs.windsurf.com to [docs.devin.ai/desktop](https://docs.devin.ai/desktop/devin-desktop-faq). The agent that was called Cascade is called Devin Local there. This page says Windsurf for the editor, since that is the name people search for, and "the agent" for Devin Local.

Nothing on this page was run inside Windsurf or Devin Desktop. The setup steps below come from their docs, linked at each step; the replies come from paprika3d's MCP server on this page's game, which answers any MCP client the same way.

## The game

The stream carries the boat forward at 3 metres a second and the arrow keys steer it across. Touching a rock ends the trip; passing all four brings the boat home. Each mesh has a `name`, and `window.__game` hands the state to tools as JSON: the boat's place, the nearest rock and the clear water between their edges (`gap`), the rock it hit, and whether it got home.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Paper boat</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:12px;width:100%;text-align:center;font:600 18px system-ui;color:#fff;text-shadow:0 1px 3px #000}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rules: the stream carries the boat forward, the arrow keys steer it across, and touching a rock ends the trip.
const FLOW = 3, STEER = 2.5, HALF_WIDTH = 2.6, END_Z = -40;   // metres per second, metres
const BOAT_R = 0.55;   // the drawn boat's own size: 0.3 let the hull sink into a rock before the hit counted
const ROCKS = [[0, -8, 0.7], [-1.4, -16, 0.8], [1.3, -24, 0.8], [-0.2, -32, 0.9]].map(([x, z, r], i) => ({ name: `rock ${i + 1}`, x, z, r }));
const held = new Set();
let boat, hit, home;
const start = () => { boat = { x: 0, z: 0 }; hit = null; home = false; };

function nearest() {   // the rock closest to the boat, and the clear water between their edges
  let best = null;
  for (const r of ROCKS) {
    const gap = Math.hypot(r.x - boat.x, r.z - boat.z) - r.r - BOAT_R;
    if (!best || gap < best.gap) best = { rock: r.name, gap };
  }
  return best;
}
function step(dt) {
  if (hit || home) return;
  const steer = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
  boat.x = THREE.MathUtils.clamp(boat.x + steer * STEER * dt, -HALF_WIDTH, HALF_WIDTH);
  boat.z -= FLOW * dt;
  const n = nearest();
  if (n.gap <= 0) hit = n.rock;
  if (boat.z <= END_Z) home = true;
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfdcef);
scene.fog = new THREE.Fog(0xbfdcef, 15, 40);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
scene.add(new THREE.HemisphereLight(0xffffff, 0x557744, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(-3, 8, 4);
scene.add(sun);

const stream = new THREE.Mesh(new THREE.PlaneGeometry(2 * HALF_WIDTH + 0.6, 60), new THREE.MeshStandardMaterial({ color: 0x3a7fb0 }));
stream.rotation.x = -Math.PI / 2; stream.position.z = -22; stream.name = 'stream'; scene.add(stream);
for (const side of [-1, 1]) {
  const bank = new THREE.Mesh(new THREE.BoxGeometry(6, 0.6, 60), new THREE.MeshStandardMaterial({ color: 0x6a9a48 }));
  bank.position.set(side * (HALF_WIDTH + 3.3), 0.2, -22); bank.name = 'bank'; scene.add(bank);
}
const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x77736c, flatShading: true });
for (const r of ROCKS) {
  const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(r.r), rockMaterial);
  mesh.position.set(r.x, 0.15, r.z); mesh.scale.y = 0.7; mesh.name = r.name; scene.add(mesh);
}
const paper = new THREE.MeshStandardMaterial({ color: 0xf6f2e6, flatShading: true });
const boatMesh = new THREE.Group();
const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.18, 0.18, 4), paper);
hull.scale.z = 1.8; hull.rotation.y = Math.PI / 4; hull.position.y = 0.09;
const sail = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 4), paper);
sail.position.y = 0.4;
boatMesh.add(hull, sail); boatMesh.scale.setScalar(1.4); boatMesh.name = 'boat'; scene.add(boatMesh);
const hud = document.getElementById('hud');

addEventListener('keydown', e => { if (e.code === 'KeyR') start(); else held.add(e.code); });
addEventListener('keyup', e => held.delete(e.code));
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
  boatMesh.position.set(boat.x, 0, boat.z);
  camera.position.set(boat.x * 0.5, 2.4, boat.z + 4);
  camera.lookAt(boat.x * 0.5, 0, boat.z - 5);
  hud.textContent = hit ? `The boat hit ${hit}. R to try again` : home ? 'Home! R to sail again' : '← → steer past the rocks';
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100;
window.__game = {
  describe: () => ({ name: 'paper boat', units: 'metres', keys: { ArrowLeft: 'steer left', ArrowRight: 'steer right', KeyR: 'restart' } }),
  observe: () => { const n = nearest(); return { boat: { x: r2(boat.x), z: r2(boat.z) }, nearest: { rock: n.rock, gap: r2(n.gap) }, hit, home }; },
  act: ({ key, down = true }) => { if (key === 'KeyR') { if (down) start(); } else if (down) held.add(key); else held.delete(key); },
  setState: s => { if (s.boat) boat = { ...s.boat }; },
  subject: 'boat',
};
</script>
</body></html>
```

Save it as `index.html` and run `npm install three` in the same folder, since the import map loads three from `node_modules`.

## What the preview gives the agent

The [previews page](https://docs.devin.ai/desktop/previews) says previews "are opened via tool call, so just ask the agent to preview your site". The preview opens in the built-in browser pane next to the agent, or in your own browser, since it is served locally. Its **Send element** button lets you pick an element on the page, which goes into your prompt as an `@` mention, and console errors you capture land in the agent's message box the same way. The page does not say the agent receives a screenshot of the preview.

On a page like this one, the element you can send is the canvas. Its HTML, read from the page with paprika3d's `eval`, is all there is to it:

```text
eval {"code":"return document.querySelector(\"canvas\").outerHTML"}

<canvas data-engine="three.js r186" width="1280" height="800" style="display: block; width: 1280px; height: 800px;"></canvas>
```

The boat, the stream and the rocks are pixels inside it. A screenshot, if you paste one into the chat, shows them to the eye, but not which rock is which, how much water lies between the boat and the next one, or what happens three seconds after a key goes down. For a page of HTML (a form, a menu, a settings screen) the elements carry that; for a game they do not. Console errors still matter here: a shader that fails to compile or a model file that is not found shows up there, and the preview hands those over well.

## Add paprika3d to Windsurf's MCP config

paprika3d is an MCP server: a program that gives an agent tools, here ones that open a page in a headless Chrome of their own, picture it, list its objects, press keys on exact frames and read the game's state. It needs Node 20.11 or later and Google Chrome. Every MCP client starts it with the same command, `npx -y paprika3d serve`.

In Devin Desktop, the [MCP page](https://docs.devin.ai/desktop/cascade/mcp) says to open **Customize** from the agent sidebar and click the **MCPs** tab, where **This computer** lets you turn a server on or off, open its config file, or refresh the list. The files are `.devin/mcp_config.json` in a project, or `~/.config/devin/mcp_config.json` for every project (`%APPDATA%\devin\mcp_config.json` on Windows). The entry:

```json
{
  "mcpServers": {
    "paprika": {
      "command": "npx",
      "args": ["-y", "paprika3d", "serve"]
    }
  }
}
```

A Windsurf build from before the rename keeps the same JSON in `~/.codeium/windsurf/mcp_config.json`, the file Windsurf's [Cascade MCP page](https://docs.devin.ai/windsurf/plugins/cascade/mcp) names, opened from **Open MCP config file** in Cascade's MCP menu; that page says to press the refresh button after adding a server. By default the agent asks before it calls any MCP tool, so the first `open` waits for your approval.

The skills tell an agent when to use each tool and how to read its replies. `npx skills add Keeno-Corp/paprika3d -a windsurf` puts them in `.windsurf/skills/` in the project, a folder Devin Desktop still reads (the installer's README asks for Node 22.20 or later). One line in the project's `AGENTS.md`, which Devin Desktop reads as always-on rules, makes the check part of every change:

```text
After each change to the game, use the paprika tools to open it, look at it and play the part that changed.
```

## The agent checking the boat

These are the replies paprika3d's MCP server gave on the game above, on 2026-11-12, on a Linux machine with no graphics card, where Chrome draws WebGL in software. The tools were called directly, the same calls an agent makes. Each reply is cut to the lines discussed, with nothing reworded; the run folder is shortened to `<project>`.

`open` loads the page on a paused clock, where each frame is 1/60 s of game time, and `look` pictures it and lists what is on screen:

```text
open {"url": "index.html", "cwd": "<project>"}

Opened http://127.0.0.1:34267/index.html in 0.1 s, paused at frame 0.
{"name":"paper boat","units":"metres","keys":{"ArrowLeft":"steer left","ArrowRight":"steer right","KeyR":"restart"}}
Next: `look` to see it, then `interact` for each interaction the request names.

look {}

Subject: boat takes 2.2% of the picture [534, 490, 779, 681]; 0 of its 0 named parts show.
On screen (9):
stream 41% [0, 210, 1279, 799] 60 × 5.8 units, along the view
bank ×2 25% [0, 202, 1279, 718] 60 × 6 units, along the view
boat ×2 2.2% [534, 490, 779, 681]
rock * ×4 0.66% [546, 213, 703, 355]
Never visible: none
```

Each line is a named object, its share of the picture and its box in pixels; the four rocks share one line. Then `interact` plays the game. With no key pressed, the stream should carry the boat into the first rock, which sits in the middle 8 metres ahead. `trace` follows two values frame by frame:

```text
interact {"steps":[{"wait":180}],"trace":["nearest.gap","boat.z"]}

{"changed":{"boat":{"z":-7.05},"nearest":{"gap":-0.05},"hit":"rock 1"}}
Motion (boat): travelled 7 units, it stopped at frame 140 and did not move again.
Contact: boat overlapped rock 1 by 0.674 units (103% of the smaller body radius) at frame 140; register contact when bodies touch (reach ≈ 1.62 units), not after deep overlap.
nearest.gap: 6.95 → -0.05 at frame 140; first changed at frame 1
boat.z: -0.05 → -7.05 at frame 140; first changed at frame 1
```

That reply is from the game's first version, which gave the boat a collision size of 0.3 metres. The hit came, but the `Contact` line says the drawn boat was already inside the rock by 0.674 units when it did: the rule used a smaller boat than the one on screen. A player would see the paper hull sink into the stone before the trip ends. The fix is the one number:

```diff
-const FLOW = 3, STEER = 2.5, HALF_WIDTH = 2.6, BOAT_R = 0.3, END_Z = -40;
+const FLOW = 3, STEER = 2.5, HALF_WIDTH = 2.6, END_Z = -40;
+const BOAT_R = 0.55;   // the drawn boat's own size
```

The same drift after it stops the boat five frames sooner, with no `Contact` line:

```text
interact {"steps":[{"wait":180}],"trace":["nearest.gap","boat.z"]}

{"changed":{"boat":{"z":-6.8},"nearest":{"gap":-0.05},"hit":"rock 1"}}
Motion (boat): travelled 6.75 units, it stopped at frame 135 and did not move again.
nearest.gap: 6.7 → -0.05 at frame 135; first changed at frame 1
boat.z: -0.05 → -6.8 at frame 135; first changed at frame 1
```

Now a steered trip. The keys go down on exact frames: a second of drift, right for 36 frames to clear rock 1, left for 60 to clear rock 3, right for 60 to clear rock 4, then an `until` step that runs frames until the boat is home. `expect` checks the end and `save` keeps the run as a check:

```text
interact {"steps":[{"wait":60},{"key":"ArrowRight","frames":36},{"wait":250},{"key":"ArrowLeft","frames":60},{"wait":100},{"key":"ArrowRight","frames":60},{"until":{"home":true},"max":300}],"trace":["nearest.gap","boat.x"],"expect":{"home":true},"save":"past-every-rock"}

{"changed":{"boat":{"x":1.5,"z":-40},"nearest":{"rock":"rock 4","gap":6.73},"home":true}}
until: home == true held at frame 800
Trace (the first 600 frames):
nearest.gap: 6.75 → low 0.25 at frame 158 → 1.17 at frame 600; first changed at frame 1
boat.x: 0 → low -1 at frame 406 → 1.5 at frame 566; first changed at frame 61
Expect: home true ✓
Saved check "past-every-rock" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

The closest the boat came to a rock was 0.25 metres of water, at frame 158, as it passed rock 1. Those are the numbers to tune the game by: if 0.25 feels too tight for a first level, move the rock or slow the stream and rerun the same steps. After the next change, `test` replays the saved trip on a freshly loaded page:

```text
test {}

✓ past-every-rock
1 of 1 saved checks passed in 1.3 s
```

The after-edit hook named in the reply is part of the Claude Code plugin, so Windsurf does not run it. Ask the agent to run `test` after a change, or add that to the `AGENTS.md` line.

## Playwright MCP in Windsurf

Microsoft's [Playwright MCP README](https://github.com/microsoft/playwright-mcp) lists Windsurf: "Follow Windsurf MCP documentation. Use the standard config above", which is an `mcpServers` entry named `playwright` with `npx` and `@playwright/mcp@latest`. It goes in the same `mcp_config.json`, beside paprika3d's entry, and the two do different jobs. Playwright MCP works from the page's accessibility tree: its README says it uses "Playwright's accessibility tree, not pixel-based input", which suits forms, links and buttons. On this game the tree holds the HUD's text and the canvas; the boat and rocks are not in it. It can also take a screenshot, which is the same picture as above. paprika3d reads the three.js scene itself and the game's own state, and steps the clock frame by frame. Playwright MCP was not run for this page.

## What paprika3d does not do here

- It does not run inside Windsurf's preview pane. Its pages open in a headless Chrome of its own, which the tools picture, so you watch the game in the preview and the agent plays it through the tools.
- It does not use your GPU in these replies: this host has none, so frame times measured here are no guide to a real one.
- It plays the steps the agent sends and no others. Whether the stream is fun, or the rocks too close for a first level, is yours to judge.
- It is not tested inside Windsurf or Devin Desktop here. If the tools do not appear after the config change, refresh the MCPs list, check `node --version`, and see [install](/install).

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): the same loop of calls on a jumping ball, with each reply explained.
- [Screenshot a three.js scene headless](/guides/screenshot-threejs-scene-headless): `look` in full, from four sides and at several sizes.
- [Playwright alternative for three.js and WebGL](/guides/playwright-alternative-threejs-webgl): what a browser test sees on a canvas, and what reads the scene.
- [three.js collision detection without a physics engine](/guides/threejs-collision-detection-without-physics-engine): sizing a hit test to the drawn object.
- [How to make a game with Cursor](/guides/make-a-game-with-cursor): the same MCP entry in another editor.
