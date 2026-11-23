---
title: "Three.js MCP server for coding agents: paprika3d runs, sees and tests the scene"
phrase: three.js mcp server
description: "paprika3d is a three.js MCP server: it opens your page in headless Chrome, screenshots the canvas with each named mesh, plays keys on exact frames and reads scene or game state, in Claude Code, Cursor, Codex or any MCP client."
meta: "Three.js MCP server for Claude Code, Cursor and Codex: paprika3d opens a page, screenshots the canvas, plays inputs and reads scene state."
intent: threejs-mcp-server
queries:
  - "three.js MCP server"
  - "mcp server three.js"
  - "Is there an MCP server for three.js?"
  - "MCP server for three.js game development"
author: paprika3d agent
date: 2026-11-12
review: weekly
reviewed: 2026-11-15
---
# Three.js MCP server: paprika3d runs, sees and tests your scene

paprika3d is a three.js MCP server for coding agents: it runs the scene your agent wrote in headless Chrome and reports what came out, instead of only generating its source. In Claude Code, install with `claude plugin marketplace add Keeno-Corp/paprika3d` and `claude plugin install paprika3d@paprika3d`. In another MCP client, register `npx -y paprika3d serve` as a stdio server; the configuration below shows how.

A coding agent hands `open` a page or a dev-server command, and from then on `look` returns a screenshot of the canvas with the named meshes on screen, `observe` reads the scene or the game's own state as JSON, and `interact` holds keys for an exact number of frames. The page's clock is paused and stepped at 1/60 s per frame, so the same keys always move the scene the same distance and a test that passed once passes again.

## What an MCP server for three.js lets an agent do

A coding agent that writes three.js code cannot see what it drew. The page is one `<canvas>` with nothing inside to query, so reading the source says what the agent meant and nothing about what came out: whether the model loaded, whether it is inside the camera's view, whether picking up the coin added a point. An MCP server closes that gap by running the page in a real browser and answering those questions as tool results the model reads in the same turn.

Other three.js MCP servers mostly write scene code, drive a live editor or inspect a page you keep open in your own browser. paprika3d is the other half: it starts the page itself, runs the code the agent wrote on a stepped clock and reports back, so the same check gives the same answer on every run. It works on plain three.js, React Three Fiber and Vite projects, and in any MCP client. For how it differs from threejs-devtools-mcp, see [threejs-devtools-mcp vs paprika3d](/guides/threejs-devtools-mcp-vs-paprika3d).

## Install it

You need Google Chrome and Node 20.11 or later. Claude Code users (2.1.118 or later) add the plugin, which brings the skill and hooks with the server:

```bash
claude plugin marketplace add Keeno-Corp/paprika3d
claude plugin install paprika3d@paprika3d
```

In Cursor, Codex, VS Code, Windsurf, Gemini CLI or another MCP client, register the npm package as a stdio server named `paprika`:

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

## A small three.js page

One `index.html` with three from a CDN: a player box, a coin and a ground, each given a `name`. Holding the right arrow moves the player, and reaching the coin scores and sends the coin to the other side. The `window.__game` object at the end is optional; it lets the server read the score and press keys through the game itself.

```html
<!-- verify act=ArrowRight -->
<!doctype html>
<html>
<head><style>html,body{margin:0;height:100%;overflow:hidden}</style></head>
<body>
<script type="importmap">{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js" } }</script>
<script type="module">
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#dde3ea');
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 4, 8);
camera.lookAt(0, 0.4, 0);
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.position.set(2, 4, 3);
scene.add(sun);

const mesh = (name, geometry, color, x) => {
  const m = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }));
  m.name = name; m.position.set(x, 0.5, 0); scene.add(m); return m;
};
const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 4), new THREE.MeshStandardMaterial({ color: '#b8c0c8' }));
ground.name = 'ground'; ground.rotation.x = -Math.PI / 2; scene.add(ground);
const player = mesh('player', new THREE.BoxGeometry(0.8, 0.8, 0.8), '#e0603a', -4);
const coin = mesh('coin', new THREE.TorusGeometry(0.3, 0.1, 12, 24), '#e0b13a', 2);

const game = { score: 0, player: { x: -4 }, coin: { x: 2 } };
const held = new Set();
const act = ({ key, down = true }) => { if (down) held.add(key); else held.delete(key); };
addEventListener('keydown', (e) => act({ key: e.key }));
addEventListener('keyup', (e) => act({ key: e.key, down: false }));

window.__game = {
  subject: 'player',
  describe: () => ({ name: 'coin run', keys: { ArrowLeft: 'hold', ArrowRight: 'hold' } }),
  observe: () => ({ score: game.score, player: { x: +game.player.x.toFixed(3) }, coin: { ...game.coin } }),
  act,
  setState: (s) => Object.assign(game, s),
};

let last = null;
renderer.setAnimationLoop((t) => {
  const dt = last === null ? 1 / 60 : Math.min((t - last) / 1000, 0.1);
  last = t;
  game.player.x += ((held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0)) * 4 * dt;
  if (Math.abs(game.player.x - game.coin.x) < 0.6) { game.score++; game.coin.x = -game.coin.x; }
  player.position.x = game.player.x;
  coin.position.x = game.coin.x;
  coin.rotation.y += dt * 2;
  renderer.render(scene, camera);
});
</script>
</body>
</html>
```

The replies below are what paprika3d returned for this page on 2026-11-12, on a Linux machine with no GPU. Paths are shortened to `<project>` and `<run>`, and the lines `open` prints about the helper files it writes (`geo.js` and `fx.js`) are left out.

## Open the page

`open` serves the folder, loads the page in its own headless Chrome and pauses it at frame 0. Because the page has a `__game` object, it prints the game's `describe()`:

```text
open {"url": "index.html", "cwd": "<project>"}

Opened http://127.0.0.1:33965/index.html in 0.2 s, paused at frame 0.
GPU: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). A software renderer (no GPU): frame times here say nothing of a real GPU's.
Page text outside the canvas: none
{"name":"coin run","keys":{"ArrowLeft":"hold","ArrowRight":"hold"}}
Next: `look` to see it, then `interact` for each interaction the request names.
```

## See the frame

The tool result carries the screenshot as an image the model reads, plus text naming each mesh on screen with its share of the picture and its pixel box, and the problems a picture alone would not state: the canvas that kept its size when the page shrank, the missing tone mapping, the flat ground.

```text
look {}

Picture: <run>/look-1.png
Pixels: brightness 83%, colour saturation 7%, 0% near black, 0% blown out.
Hues: grey 98% of the frame; over the objects (24.8% of it): grey 93%, red 6%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler did not run: the canvas kept its size when the page shrank (a debounced one waits for frames).
Lighting: no tone mapping (renderer.toneMapping is NoToneMapping): bright colours clip to white; ACESFilmicToneMapping, AgXToneMapping or NeutralToneMapping avoid it, and ACES also mutes saturated colours, which a bright stylised look may not want.
Surface: "ground" covers 23% with almost no detail (0 of 255): it reads as flat colour. Unless the user asked for flat colour, add texture, normal detail or lighting variation.
Subject: player takes 1.4% of the picture [122, 333, 264, 449]; 1 of its 1 named parts show.
On screen (3):
ground 23% [0, 359, 1279, 560] 12 × 4 units, across the view
player 1.4% [122, 333, 264, 449]
coin 0.43% [817, 348, 904, 430]
Never visible: none
[image/jpeg: the screenshot]
```

## Play it and read the state

`observe` returns the game's state with the renderer counts under `harness`. Holding the right arrow for 90 frames carries the player onto the coin, and `interact` replies with what changed: one point scored, the coin sent to the other side.

```text
observe {}

{"score":0,"player":{"x":-4},"coin":{"x":2},"harness":{"frame":1,"renderer":{"calls":3,"triangles":590,"textures":1,"geometries":3,"programs":2},"scene":{"objects":5,"meshes":3,"lights":2,"cameras":0},"errors":[],"changed":null}}

interact {"steps": [{"key": "ArrowRight", "frames": 90}, {"key": "ArrowRight", "down": false}]}

{"changed":{"score":1,"player":{"x":2},"coin":{"x":-2}}}
```

`target` frames one named mesh alone from four sides and gives its size in world units, here the coin at its new place:

```text
look {"target": "coin"}

Picture: <run>/look-2-views.png (front, right, top, three-quarter)
coin: size 0.813 × 0.8 × 0.259, centre [-2, 0.5, 0]
[image/jpeg: four views of the coin]
```

## Notes

- **Name what matters.** `look` lists meshes by their `name`, and `observe` falls back to the named objects when the page has no `__game` object. Unnamed meshes still draw, but the reply cannot point at them.
- **`__game` is optional.** Without it, `open` lists the named entities and `interact` still sends keys and clicks to the canvas; with it, the agent reads the rules (score, lives, level) instead of guessing them from positions.
- **Keep time on the frame clock.** Read the time step from the animation loop's timestamp and cap it at 0.1 s, as the page above does, so a paused step moves the game by exactly one frame.
- **Runs stay in the project.** Pictures go under `paprika3d/runs/` in the project folder, which belongs in `.gitignore`.
- **More guides:** [React Three Fiber MCP server](/guides/react-three-fiber-mcp-server), [MCP server that screenshots a WebGL canvas](/guides/mcp-server-screenshot-webgl-canvas), [test a three.js game with Claude Code](/guides/test-threejs-game-claude-code).
