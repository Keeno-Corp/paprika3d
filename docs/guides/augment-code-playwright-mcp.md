---
title: Augment Code Playwright MCP on a three.js game, and paprika3d beside it
phrase: augment code playwright mcp
description: How to add Playwright MCP to Augment Code's agent with Import from JSON, what it reads on a three.js page (the slider's value, not the scene in the canvas), and how adding paprika3d's MCP server beside it lets the agent open a weather vane game, list the vane and its arrow by name, drag the wind slider and read the vane's heading frame by frame.
meta: Augment Code Playwright MCP on a three.js game: what it reads on a canvas, and the MCP server to add beside it for the scene and its state.
intent: augment-code-playwright-mcp
queries:
  - "augment code playwright mcp"
  - "augment code browser"
  - "augment code playwright"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# Augment Code Playwright MCP on a three.js game, and paprika3d beside it

Playwright MCP gives Augment Code's agent a browser: add it in Augment's Settings panel with **Import from JSON**, and the agent can open your three.js page, click its buttons and sliders and read the page's accessibility tree. The 3D scene is drawn inside one `<canvas>`, which that tree does not describe, so for the scene itself add paprika3d's MCP server in the same import: `{"mcpServers": {"paprika": {"command": "npx", "args": ["-y", "paprika3d", "serve"]}}}`. It lists the objects on screen by name and reads the game's own state after each input.

This page shows both on one small page, a weather vane on a roof that swings to face a wind you set with a slider. It covers where Augment keeps MCP servers in VS Code, JetBrains and the Auggie CLI, what each server reads on this page, and the replies paprika3d gave: the vane and its arrow by name, a slider drag, a vane that swung the long way round, and the fix, saved as checks that rerun.

Nothing here was run inside Augment Code. The setup comes from [Augment's MCP docs](https://docs.augmentcode.com/setup-augment/mcp), linked at each step, and the replies from paprika3d's MCP server on this page's game, which answers every MCP client the same way. Playwright MCP was not run for this page either; what it reads is taken from its README.

## The page

The slider sets where the wind comes from, in compass degrees (0 is north, 90 east), and the vane's arrow turns to point into it at 120 degrees a second. The slider is a plain `<input type="range">` over the canvas; every mesh has a `name`; `window.__game` hands the wind and the heading to tools as JSON.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Weather vane</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#panel{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);font:600 16px system-ui;color:#fff;text-shadow:0 1px 3px #000;text-align:center}
#wind{width:320px;margin:0;display:block}</style></head>
<body>
<div id="panel"><label for="wind" id="label"></label><input id="wind" type="range" min="0" max="359" value="90"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rules: the slider says where the wind comes from, in compass degrees (0 north, 90 east),
// and the vane's arrow swings round to point into it at TURN degrees a second.
const TURN = 120;
const slider = document.getElementById('wind'), label = document.getElementById('label');
let wind = +slider.value, heading = wind;
slider.addEventListener('input', () => { wind = +slider.value; });

function step(dt) {
  const diff = (wind - heading + 540) % 360 - 180;   // degrees still to turn, the short way round
  const turn = Math.sign(diff) * Math.min(Math.abs(diff), TURN * dt);
  heading = (heading + turn + 360) % 360;
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fb8d8);
scene.fog = new THREE.Fog(0x8fb8d8, 12, 30);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
camera.position.set(1.8, 5.1, 3.2);
camera.lookAt(0, 4.1, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x5a6a40, 1.8));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(5, 8, 3);
scene.add(sun);

const mat = c => new THREE.MeshStandardMaterial({ color: c });
const add = (name, geometry, colour, [x, y, z], parent = scene) => {
  const mesh = new THREE.Mesh(geometry, mat(colour));
  mesh.name = name; mesh.position.set(x, y, z); parent.add(mesh); return mesh;
};
add('ground', new THREE.CylinderGeometry(30, 30, 0.2, 48), 0x7a9a50, [0, -0.1, 0]);
add('roof', new THREE.ConeGeometry(2.4, 1.2, 4), 0x4a4a52, [0, 3, 0]).rotation.y = Math.PI / 4;
add('post', new THREE.CylinderGeometry(0.04, 0.04, 1.2), 0x222222, [0, 4, 0]);
for (const [name, x, z] of [['north', 0, -0.6], ['east', 0.6, 0], ['south', 0, 0.6], ['west', -0.6, 0]]) {
  add(name, new THREE.SphereGeometry(name === 'north' ? 0.09 : 0.06), name === 'north' ? 0xd04030 : 0x222222, [x, 3.9, z]);
}
const vane = new THREE.Group();   // its arrow points along -z (north) at heading 0
vane.name = 'vane'; vane.position.y = 4.5; scene.add(vane);
add('arrow', new THREE.ConeGeometry(0.12, 0.35, 12), 0xd8b040, [0, 0, -0.75], vane).rotation.x = -Math.PI / 2;
add('shaft', new THREE.CylinderGeometry(0.025, 0.025, 1.4), 0x222222, [0, 0, 0], vane).rotation.x = Math.PI / 2;
add('tail', new THREE.BoxGeometry(0.03, 0.4, 0.5), 0xd8b040, [0, 0, 0.6], vane);
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  vane.rotation.y = -THREE.MathUtils.degToRad(heading);
  label.textContent = `Wind from ${wind}°`;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'weather vane', units: 'compass degrees, 0 north, 90 east', controls: 'the slider sets where the wind comes from' }),
  observe: () => ({ wind, heading: Math.round(heading * 10) / 10 }),
  setState: s => { if (s.wind !== undefined) slider.value = wind = s.wind; if (s.heading !== undefined) heading = s.heading; },
  subject: 'vane',
};
</script>
</body></html>
```

Save it as `index.html` and run `npm install three` in the same folder; the import map loads three from `node_modules`.

## Add both servers in Augment Code

Both servers are programs Augment starts on your machine with `npx`, so they need Node (paprika3d asks for 20.11 or later, Playwright MCP's README for 18 or newer) and, for paprika3d, Google Chrome.

**VS Code.** Open the options menu at the upper right of the Augment panel and click **Settings**; the MCP servers are a section of that panel. **Import from JSON** there takes a block like this one, with Playwright MCP's entry exactly as [its README](https://github.com/microsoft/playwright-mcp) gives it and paprika3d's beside it:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    },
    "paprika": {
      "command": "npx",
      "args": ["-y", "paprika3d", "serve"]
    }
  }
}
```

Click Save, and both appear in the list, where each can be edited, tested or removed. The `+` button next to the MCP header adds one server at a time instead, with a `name` and a `command` such as `npx -y paprika3d serve`.

**JetBrains.** The [JetBrains MCP page](https://docs.augmentcode.com/jetbrains/setup-augment/mcp) opens the same settings from the gear icon at the upper right of the Augment panel, with the same `+` button, name and command. It does not mention Import from JSON, so add the two servers one by one there.

**The Auggie CLI.** The [CLI's integrations page](https://docs.augmentcode.com/cli/integrations) adds a server with `auggie mcp add` and saves it in `~/.augment/settings.json`, in the same `mcpServers` shape; `/mcp` inside Auggie lists what loaded:

```bash
auggie mcp add paprika --command npx --args "-y paprika3d serve"
auggie mcp add playwright --command npx --args "@playwright/mcp@latest"
```

Both Augment pages warn that not every MCP server works with Augment's models. That is untested here for either server.

The skills tell an agent when to use each of paprika3d's tools and how to read their replies. `npx skills add Keeno-Corp/paprika3d -a augment` puts them in `.augment/skills/` in the project (the installer's README asks for Node 22.20 or later).

## What each server reads on this page

Playwright MCP, its README says, "enables LLMs to interact with web pages through structured accessibility snapshots", using "Playwright's accessibility tree, not pixel-based input". On this page that tree holds the panel: a slider labelled by its `<label>`, with its value, which the agent can click and set. The vane is in the canvas, and a canvas has no children in an accessibility tree, so the vane, its arrow and its heading are not in the snapshot. Playwright MCP's screenshot shows them as a picture.

paprika3d reads the three.js scene and the page's `window.__game`. These are its replies on the page above and on its first version, captured on 2026-11-12 on a Linux machine with no graphics card, called directly as an agent calls them, each cut to the lines discussed with nothing reworded. `look` pictures the page and lists every named object on screen with its share of the picture and its box in pixels:

```text
look {}

HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#panel "Wind from 90°" [480, 742, 799, 775].
Subject: vane takes 2.1% of the picture [436, 213, 909, 337]; 3 of its 3 named parts show.
On screen (10):
ground 47% [0, 272, 1279, 799] 60 × 60 units
roof 15% [175, 539, 1160, 799]
tail 1.2% [436, 213, 556, 333] 0.5 × 0.4 units
post 0.65% [628, 254, 651, 545] 1.2 × 0.08 units
arrow 0.5% [786, 262, 909, 337]
shaft 0.41% [469, 265, 787, 306] 1.4 × 0.05 units, across the view
north 0.16% [692, 391, 736, 436]
south 0.12% [524, 489, 562, 527]
east 0.1% [782, 465, 818, 501]
west 0.078% [485, 415, 516, 446]
Never visible: none
```

The vane's three parts are there, the arrow to the right of the post (east, where the wind starts), and the panel with the slider is listed as HTML over the canvas.

## Moving the slider and reading the heading

`interact` sends real mouse events, so a click on the slider's track moves its thumb as a person's click would. The slider sits at [480, 760, 800, 776] on the page, 0 at the left end and 359 at the right. In the first version of the page, the wind starts from 350, just west of north, and a click near the left end of the track sets it to 9, just east of north. `{ state }` sets the start; `trace` follows the heading frame by frame:

```text
interact {"steps":[{"state":{"wind":350,"heading":350}},{"mouse":"click","x":496,"y":768},{"wait":180}],"trace":["heading","wind"]}

{"changed":{"wind":9,"heading":9}}
heading: 350 → 9 at frame 171; first changed at frame 1
wind: 350 → 9 at frame 1; first changed at frame 1
```

The wind moved 19 degrees across north, and the vane took 171 frames to follow it, nearly three seconds at 120 degrees a second: it swung 341 degrees the long way, through south, pointing away from the wind for most of the turn. A picture at the end shows the vane in the right place, since it arrives there in the end; the frame count is what gives it away. The first version subtracted the two angles as plain numbers:

```diff
-  const diff = wind - heading;   // degrees still to turn
+  const diff = (wind - heading + 540) % 360 - 180;   // degrees still to turn, the short way round
```

The same call after the fix:

```text
interact {"steps":[{"state":{"wind":350,"heading":350}},{"mouse":"click","x":496,"y":768},{"wait":180}],"trace":["heading","wind"]}

{"changed":{"wind":9,"heading":9}}
heading: 350 → peak 360 at frame 5 → low 2 at frame 6 → 9 at frame 10; first changed at frame 1
wind: 350 → 9 at frame 1; first changed at frame 1
```

Ten frames, through north. Two checks keep it that way, one for each direction across north, saved with `expect` so a later change that brings the long swing back fails them:

```text
interact {"steps":[{"state":{"wind":350,"heading":350}},{"mouse":"click","x":496,"y":768},{"wait":20}],"expect":{"wind":[5,15],"heading":[5,15]},"save":"short-way-round"}

{"changed":{"wind":9,"heading":9}}
Expect: wind 9 ✓ · heading 9 ✓
Saved check "short-way-round" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.

interact {"steps":[{"state":{"wind":90,"heading":90}},{"mouse":"click","x":784,"y":768},{"wait":120}],"trace":["heading"],"expect":{"heading":[340,355]},"save":"back-through-north"}

{"changed":{"wind":350,"heading":350}}
heading: 90 → low 0 at frame 45 → peak 358 at frame 46 → 350 at frame 50; first changed at frame 1
Expect: heading 350 ✓
Saved check "back-through-north" in game-tests.json (2 checks now); `test` reruns them all, each from a fresh reload.

test {}

✓ short-way-round
✓ back-through-north
2 of 2 saved checks passed in 0.9 s
```

From east to 350 the short way is 100 degrees back through north, and the vane took 50 frames. The second check's steps on the first version show what it guards against, a vane still on its way round through south:

```text
interact {"steps":[{"state":{"wind":90,"heading":90}},{"mouse":"click","x":784,"y":768},{"wait":120}],"trace":["heading"],"expect":{"heading":[340,355]}}

{"changed":{"wind":350,"heading":332}}
heading: 90 → 332 at frame 121; first changed at frame 1
Expect: heading 332 ✗ expected 340 to 355
```

The after-edit hook named in the reply is part of the Claude Code plugin; in Augment, ask the agent to run `test` after a change.

## Which to use for what

| The question | What answers it |
|---|---|
| Does the slider exist, have a label, and change its value when clicked? | Playwright MCP's snapshot, or paprika3d's `interact` reply |
| Is a button or form on the page reachable and labelled? | Playwright MCP's snapshot |
| Where is the vane, and which way does its arrow point? | paprika3d's `look` and `observe` |
| How many frames does the vane take to follow the wind, and which way round? | paprika3d's `interact` with `trace` |
| Does it still turn the short way after the next edit? | paprika3d's `test` |

## What paprika3d does not do here

- It does not run in your editor's browser or on your GPU. Its pages open in a headless Chrome of its own; on this host Chrome drew in software, so no frame time on this page means anything for a real machine.
- It does not read the accessibility tree or check a page's labels and roles; Playwright MCP's snapshot is the tool for that.
- It is not tested inside Augment Code here. If the tools do not appear, check the server list in Augment's settings, `node --version`, and [install](/install).
- It checks the plays the agent saves, not every possible one. Whether the vane's swing looks like a vane is yours to judge from the pictures.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): the same calls on a jumping ball, each reply explained.
- [Screenshot a three.js scene headless](/guides/screenshot-threejs-scene-headless): `look` in full.
- [Playwright alternative for three.js and WebGL](/guides/playwright-alternative-threejs-webgl): a browser test on a canvas, and reading the scene instead.
- [three.js click on an object with a raycaster](/guides/threejs-click-on-object-raycaster): input inside the canvas rather than on HTML over it.
- [Control time in three.js tests](/guides/control-time-threejs-tests): why the frame counts above repeat on every run.
