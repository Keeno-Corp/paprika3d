---
title: Trae browser and MCP for a three.js game: what the Builder agent can check
phrase: trae browser
description: What Trae's built-in browser shows its agent on a three.js game, and how adding paprika3d in Trae's MCP settings (Add, Create Manually, an mcpServers block) lets the agent that has MCP open a carousel game, list each horse by name, click to start it, step one full turn and read every horse's height frame by frame.
meta: Trae browser and MCP for a three.js game: add an MCP server in Trae's settings so its agent clicks, steps and reads the game's state.
intent: trae-browser
queries:
  - "trae browser"
  - "trae playwright mcp"
  - "trae agent browser"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# Trae browser and MCP for a three.js game: what the Builder agent can check

Trae's agent can open your three.js game in Trae's built-in browser, click and type there, and take a screenshot after each step, once **Allow AI to Control Built-in Browser** is on in Settings > Browser. A screenshot of a game shows the scene but not its state: which horse is which, how high each one is, or whether the carousel really stopped. To let the agent click the game on an exact frame and read those back as numbers, add paprika3d in Settings > MCP > **Add** > **Create Manually**: `{"mcpServers": {"paprika": {"command": "npx", "args": ["-y", "paprika3d", "serve"]}}}`.

This page does both on one small game, a carousel whose four horses rise and fall as it turns, started and stopped with a click. It covers where Trae keeps MCP servers, which of its agents gets their tools, what its browser and its Playwright tutorial give the agent, and the replies paprika3d gave on the game: each horse by name, one full turn with each horse's height, and a carousel that stopped while its horses kept bobbing.

Nothing on this page was run inside Trae. The setup comes from [Trae's docs](https://docs.trae.ai/ide/add-mcp-servers), linked at each step; the replies come from paprika3d's MCP server on this page's game, which answers every MCP client the same way.

## The game

A click on any part of the carousel starts it or stops it. Running, it makes a quarter turn a second, and each horse rises and falls twice a turn, every other horse up while its neighbours are down. Every mesh has a `name`, the four horses are called Bramble, Clover, Dapple and Juniper, and `window.__game` hands tools the state as JSON: whether it runs, how many turns it has made, and each horse's height in metres.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Carousel</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:12px;width:100%;text-align:center;font:600 18px system-ui;color:#fff;text-shadow:0 1px 3px #000}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rules: a click on the carousel starts it or stops it. Running, it makes a quarter turn a second,
// and each horse rises and falls twice a turn, every other horse up while its neighbours are down.
const SPIN = 0.25, BASE = 1.1, RISE = 0.35;   // turns per second, metres
const NAMES = ['Bramble', 'Clover', 'Dapple', 'Juniper'];
let running = false, turns = 0;
const heights = () => [0, 1, 2, 3].map(i => BASE + RISE * Math.sin(turns * 4 * Math.PI + i * Math.PI));   // from the carousel's own turn
function step(dt) {
  if (running) turns += SPIN * dt;
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a2440);
scene.fog = new THREE.Fog(0x2a2440, 14, 30);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3.2, 7.5);
camera.lookAt(0, 1.4, 0);
scene.add(new THREE.HemisphereLight(0xfff0dd, 0x302040, 1.6));
const lamp = new THREE.PointLight(0xffd090, 30);
lamp.position.set(0, 3.2, 2.5);
scene.add(lamp);

const mat = c => new THREE.MeshStandardMaterial({ color: c });
const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 48), mat(0x3d3a33));
ground.rotation.x = -Math.PI / 2; ground.name = 'fairground'; scene.add(ground);
const carousel = new THREE.Group();
carousel.name = 'carousel'; scene.add(carousel);
const part = (name, geometry, colour, y) => { const m = new THREE.Mesh(geometry, mat(colour)); m.name = name; m.position.y = y; carousel.add(m); return m; };
part('platform', new THREE.CylinderGeometry(2.6, 2.7, 0.3, 32), 0x8a2f3a, 0.15);
part('centre pole', new THREE.CylinderGeometry(0.25, 0.25, 2.8, 16), 0xd8c070, 1.6);
part('canopy', new THREE.ConeGeometry(3, 1, 32), 0xe8d8b0, 3.4);
const horses = [0, 1, 2, 3].map(i => {
  const horse = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.9), mat(i % 2 ? 0xf2efe6 : 0x6a4a32));
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.4, 0.3), body.material);
  head.position.set(0, 0.3, 0.5);
  horse.add(body, head);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6), mat(0xd8c070));
  const a = i * Math.PI / 2;
  pole.position.set(Math.sin(a) * 2, 1.6, Math.cos(a) * 2);
  horse.position.set(Math.sin(a) * 2, BASE, Math.cos(a) * 2);
  horse.rotation.y = a + Math.PI / 2;   // facing the way the carousel turns
  horse.name = NAMES[i]; pole.name = 'brass pole';
  carousel.add(horse, pole);
  return horse;
});
const hud = document.getElementById('hud');

const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
addEventListener('click', e => {   // a click on any part of the carousel starts or stops it
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  scene.updateMatrixWorld(); camera.updateMatrixWorld();   // three does this when it renders; a click can come first
  ray.setFromCamera(pointer, camera);
  if (ray.intersectObject(carousel).length) running = !running;
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
  carousel.rotation.y = turns * 2 * Math.PI;
  heights().forEach((y, i) => { horses[i].position.y = y; });
  hud.textContent = running ? 'Click the carousel to stop it' : 'Click the carousel to start it';
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100;
window.__game = {
  describe: () => ({ name: 'carousel', units: 'metres; turns of the carousel', controls: 'a click on the carousel starts or stops it' }),
  observe: () => ({ running, turns: Math.round(turns * 1000) / 1000, heights: Object.fromEntries(heights().map((y, i) => [NAMES[i], r2(y)])) }),
  setState: s => { if (s.running !== undefined) running = s.running; if (s.turns !== undefined) turns = s.turns; },
  subject: 'carousel',
};
</script>
</body></html>
```

Save it as `index.html` and run `npm install three` in the same folder; the import map loads three from `node_modules`.

## Add paprika3d in Trae's MCP settings

paprika3d is an MCP server: a program that gives an agent tools, here ones that open a page in a headless Chrome of their own, picture it, list its objects, click and press keys on exact frames, and read the game's state. It needs Node 20.11 or later and Google Chrome. Trae's docs say a local server needs `npx` (or `uvx`) installed, and that `command` must be on your PATH with no spaces in it.

The [Add MCP servers page](https://docs.trae.ai/ide/add-mcp-servers) gives the steps: in the IDE or Agent window, go to Settings > MCP, click **Add** > **Create Manually** at the upper right, paste the JSON into the **Configure Manually** window, and click Confirm.

```json
{
  "mcpServers": {
    "paprika": {
      "command": "npx",
      "args": ["-y", "paprika3d", "serve"],
      "env": { "RUN_MCP_TIMEOUT_MS": "180000" }
    }
  }
}
```

The `env` line is optional. Trae reads a server's start-up and tool-call time limits from `START_MCP_TIMEOUT_MS` and `RUN_MCP_TIMEOUT_MS` in its `env`, in milliseconds and as strings; the longer tool-call limit gives a first `open`, which starts Chrome, room on a slow machine. For one project instead of all of them, turn on **Enable Project MCP** in Settings > MCP and put the same block in `.trae/mcp.json` at the project root. In the Agent window, Trae asks you first to pick where the server runs: a **Local** one works in local and worktree tasks, a **Cloud** one in cloud tasks. paprika3d starts Chrome on your machine, so it is a local server.

The skills tell an agent when to use each tool and how to read the replies. `npx skills add Keeno-Corp/paprika3d -a trae` puts them in `.trae/skills/` in the project (the installer's README asks for Node 22.20 or later).

## Which agent has the tools

The [page on MCP in agents](https://docs.trae.ai/ide/use-mcp-servers-in-agents) says "'Agent' is TRAE's built-in agent. All configured MCP servers are automatically added to this agent." Trae's older Playwright tutorial calls the same agent **Builder with MCP**, which is the name the question above uses. A custom agent gets the MCP servers and tools you select in the **Tools - MCP** section of its Create Agent panel. The [browser page](https://docs.trae.ai/ide/browser-use) says the built-in Chat agent cannot control the browser. So ask the Agent (Builder with MCP, in older builds) for the change and the check.

## What Trae's browser and its Playwright tutorial give the agent

Trae's [browser page](https://docs.trae.ai/ide/browser-use) says AI can open a local or online page in a tab of the built-in browser, read it, click, fill forms and "check how the page is displayed". With **Auto Screenshot** on, it takes a screenshot after its browser actions, which the page says are shown in the chat and use no tokens.

Trae's [Playwright tutorial](https://docs.trae.ai/ide/tutorial-mcp-playwright) adds a Playwright server from Trae's MCP marketplace (Add > Add from Marketplace), with tools such as `playwright_navigate`, `playwright_screenshot`, `playwright_click`, `playwright_evaluate` and `playwright_console_logs`, and Python prerequisites. On a three.js page those give a picture, clicks at points, console lines and whatever JavaScript the agent writes to run in the page.

Both are good at what a web page is made of: text, links, buttons and forms. A game's carousel and horses are pixels inside one `<canvas>`, so from a screenshot the agent sees horses but has to guess their heights, and from a click it cannot tell whether the carousel stopped. Neither was run for this page.

## The agent checking the carousel

These are the replies paprika3d's MCP server gave on the game above and on its first version, on 2026-11-12, on a Linux machine with no graphics card, where Chrome draws WebGL in software. The tools were called directly, as an agent calls them. Each reply is cut to the lines discussed, with nothing reworded.

`look` pictures the page and lists every named object on screen with its share of the picture and its box in pixels:

```text
look {}

Subject: carousel takes 27% of the picture [213, 71, 1066, 754]; 4 of its 4 named parts show.
On screen (15):
fairground 48% [0, 254, 1279, 799] 60 × 60 units
platform 15% [298, 443, 981, 754] 5.4 × 5.4 units
canopy 7.3% [213, 71, 1066, 234]
centre pole 1.3% [607, 235, 672, 489] 2.8 × 0.5 units
Bramble ×2 1.4% [563, 441, 751, 561]
Clover ×2 0.49% [856, 360, 923, 473]
brass pole ×3 0.69% [375, 231, 904, 648] 2.6 × 0.06 units
Juniper ×2 0.5% [350, 385, 423, 473]
Dapple ×2 0.23% [574, 332, 685, 402]
Never visible: none
```

Each horse is a body and a head, so each counts two; Bramble is at the front, Dapple at the back behind the centre pole. Then `interact` clicks the canopy to start the carousel and steps one full turn, 240 frames at a quarter turn a second, with `trace` following each horse's height frame by frame:

```text
interact {"steps":[{"mouse":"click","x":640,"y":150},{"wait":239}],"trace":["turns","heights.Bramble","heights.Clover","heights.Dapple","heights.Juniper"]}

{"changed":{"running":true,"turns":1}}
mouse click at (640, 150): over canopy (Mesh, 5.7 units)
turns: 0 → 1 at frame 240; first changed at frame 1
heights.Bramble: 1.1 → peak 1.45 at frame 27 → low 0.75 at frame 87 → 1.1 at frame 240; first changed at frame 1
heights.Clover: 1.1 → low 0.75 at frame 27 → peak 1.45 at frame 87 → 1.1 at frame 240; first changed at frame 1
heights.Dapple: 1.1 → peak 1.45 at frame 27 → low 0.75 at frame 87 → 1.1 at frame 240; first changed at frame 1
heights.Juniper: 1.1 → low 0.75 at frame 27 → peak 1.45 at frame 87 → 1.1 at frame 240; first changed at frame 1
```

The click landed on the canopy, the carousel made exactly one turn, and every horse went between 0.75 and 1.45 metres, Bramble and Dapple up while Clover and Juniper were down, as the rules say. A second click stops it; the next 60 frames should change nothing:

```text
interact {"steps":[{"mouse":"click","x":640,"y":150},{"wait":60}],"trace":["turns","heights.Bramble","heights.Clover"]}

{"changed":{"running":false}}
mouse click at (640, 150): over canopy (Mesh, 5.7 units)
turns: 1 throughout the 61 frames
heights.Bramble: 1.1 throughout the 61 frames
heights.Clover: 1.1 throughout the 61 frames
```

That is the fixed version. The first version timed the horses' rise and fall by the seconds since the page loaded, and the same two calls on it gave this after the stop:

```text
interact {"steps":[{"mouse":"click","x":640,"y":150},{"wait":60}],"trace":["turns","heights.Bramble","heights.Clover"]}

{"changed":{"running":false,"heights":{"Bramble":1.06,"Clover":1.14,"Dapple":1.06,"Juniper":1.14}}}
mouse click at (640, 150): over canopy (Mesh, 5.7 units)
turns: 1 throughout the 61 frames
heights.Bramble: 1.12 → peak 1.45 at frame 26 → 1.06 at frame 61; first changed at frame 1
heights.Clover: 1.08 → low 0.75 at frame 26 → 1.14 at frame 61; first changed at frame 1
```

The carousel stood still, `turns` 1 throughout, and the horses kept going up and down. In a screenshot that is one frame of horses at some height, which looks right. The fix ties the height to the carousel's own turn:

```diff
-let running = false, turns = 0, time = 0;
-const heights = () => [0, 1, 2, 3].map(i => BASE + RISE * Math.sin(time * 4 * Math.PI * SPIN + i * Math.PI));
+let running = false, turns = 0;
+const heights = () => [0, 1, 2, 3].map(i => BASE + RISE * Math.sin(turns * 4 * Math.PI + i * Math.PI));   // from the carousel's own turn
 function step(dt) {
   if (running) turns += SPIN * dt;
-  time += dt;
 }
```

A saved check keeps it fixed: start, stop an eighth of a turn later with Bramble at the top, wait a second, and expect Bramble still there. `save` keeps it when it passes, and `test` replays it after each change on a freshly loaded page:

```text
interact {"steps":[{"mouse":"click","x":640,"y":150},{"wait":29},{"mouse":"click","x":640,"y":150},{"wait":60}],"trace":["turns","heights.Bramble"],"expect":{"running":false,"turns":[0.12,0.13],"heights.Bramble":[1.4,1.5]},"save":"stopped-horses-stay-put"}

{"changed":{"turns":0.125,"heights":{"Bramble":1.45,"Clover":0.75,"Dapple":1.45,"Juniper":0.75}}}
mouse click at (640, 150): over canopy (Mesh, 5.7 units)
turns: 0 → 0.125 at frame 30; first changed at frame 1
heights.Bramble: 1.1 → 1.45 at frame 27; first changed at frame 1
Expect: running false ✓ · turns 0.125 ✓ · heights.Bramble 1.45 ✓
Saved check "stopped-horses-stay-put" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.

test {}

✓ stopped-horses-stay-put
1 of 1 saved checks passed in 0.7 s
```

On the first version the same steps end with `heights.Bramble 0.75 ✗ expected 1.4 to 1.5`: the horse sank to the bottom after the carousel stopped. The after-edit hook named in the reply is part of the Claude Code plugin, so in Trae, ask the agent to run `test` after a change.

## Pitfalls

- **A click that raycasts before the first frame.** three updates the objects' world matrices when it renders, and a saved check's first click comes on a freshly loaded page. Without the `updateMatrixWorld` line in the click handler, this check passed when it was saved and failed in `test`, its first click missing the canopy.
- **Name the horses.** `look` lists unnamed meshes by their type and groups objects with the same name, so `horse 1` to `horse 4` came back as one line; four different names come back as four.
- **Height from the turn, not the clock.** Anything that should stop when the carousel stops reads the carousel's own state.

## What paprika3d does not do here

- It does not drive Trae's built-in browser or your own Chrome. Its pages open in a headless Chrome of its own, so you watch the game in Trae's browser and the agent plays it through the tools.
- It does not use your GPU in these replies: this host has none, and frame times here mean nothing for a real machine.
- It is not tested inside Trae here. If the tools do not show up for the Agent, check the server's status in Settings > MCP, `node --version`, and [install](/install).
- It checks the plays the agent saves. Whether the carousel looks and sounds like a fairground ride is yours to judge.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): the same calls on a jumping ball, each reply explained.
- [Screenshot a three.js scene headless](/guides/screenshot-threejs-scene-headless): `look` in full.
- [three.js click on an object with a raycaster](/guides/threejs-click-on-object-raycaster): the click handler above, and the cases where it misses.
- [Control time in three.js tests](/guides/control-time-threejs-tests): why the frame numbers above repeat on every run.
- [Playwright alternative for three.js and WebGL](/guides/playwright-alternative-threejs-webgl): what a browser test reads on a canvas.
