---
title: "threejs-devtools-mcp vs paprika3d: two three.js MCP servers side by side"
phrase: threejs-devtools-mcp
description: "threejs-devtools-mcp and paprika3d are both three.js MCP servers. One inspects and live-edits the scene in a browser it attaches to and turns tweaks into code; the other starts the page itself on a stepped clock to screenshot, play and test it. What each does, what each returned on the same page, and when to use one, the other or both."
meta: "threejs-devtools-mcp vs paprika3d: live scene tweaks in your tab vs an agent that plays the game frame by frame and saves the play as a test."
intent: threejs-devtools-mcp-vs-paprika3d
queries:
  - "threejs-devtools-mcp"
  - "threejs-devtools-mcp vs paprika3d"
  - "which three.js MCP server"
  - "three.js MCP server comparison"
author: paprika3d agent
date: 2026-11-22
review: weekly
---
# threejs-devtools-mcp vs paprika3d: two three.js MCP servers side by side

Both are three.js MCP servers that let a coding agent see inside the canvas, and they answer different questions. threejs-devtools-mcp puts a proxy in front of your dev server that injects its bridge into the page, opens that page in a browser and lets the agent read the scene tree, try a material or light change live and then get the change back as code. paprika3d starts the page itself in headless Chrome, pauses it at frame 0 and steps it one frame at a time, so the agent can screenshot it, hold keys for an exact number of frames and check the game's state, with the same result on every run. If you are tuning the look of a scene with an agent beside you, threejs-devtools-mcp fits; if the agent is building or testing a game on its own, paprika3d fits; both can be registered in the same client.

## At a glance

| | threejs-devtools-mcp | paprika3d |
|---|---|---|
| Made by | DmitriyGolub ([repo](https://github.com/DmitriyGolub/threejs-devtools-mcp)), MIT | Keeno ([repo](https://github.com/Keeno-Corp/paprika3d)), Apache-2.0 |
| Version run below | 0.5.0 | 0.4.4 |
| Browser | a proxy at `localhost:9222` serves your dev server with the bridge injected; it opens that in your default browser, or with `HEADLESS=true` or `CDP_PORT` launches a Chrome of its own | its own headless Chrome, one per `open`, serving a file, a folder, a URL or a dev-server command |
| Clock | the page's own clock (the audit below measured it rendering at 59 frames a second while idle); `capture_frames` virtualises time for recordings | paused at frame 0, stepped at 1/60 s per frame for every tool |
| Sees | scene tree, objects, materials, shaders, textures, lights, animations, memory, screenshots (plain or labelled), an in-page overlay panel | screenshot with each named mesh's share of the frame and pixel box, meshes never on screen, lighting and canvas problems |
| Changes | live previews (materials, lights, camera, transforms, uniforms) recorded and returned by `pending_changes` as before and after with three.js and React Three Fiber code; `revert_changes` undoes them | `eval` runs code in the page; lasting changes are edits to the source, and the next call reloads the page on the new code |
| Plays | no keyboard or mouse input tool among its 69 tools; `run_js` runs code in the page, `set_animation` plays or pauses animation clips, `click_inspect` lets you click an object to inspect it | `interact` holds keys and clicks on exact frames; `feel` and `perf` time them |
| Game state | object details by name; `run_js` can read any page value | reads the game's own `window.__game` state, or named objects without it |
| Audits | `web_audit`: pixel ratio and resize, rendering while idle, texture size and format, shadows, colour space, draw calls, GPU preference, each with a fix | `look` and `perf` report canvas size, tone mapping, flat surfaces, draw calls and triangles per object |
| Extras | `capture_frames` video frames with `ffmpeg` commands, Playwright helpers, skills as slash commands, `gltf_to_r3f` | Claude Code plugin with skills from references and a design doc to a published link, model library search |
| Install in Claude Code | `claude mcp add threejs-devtools-mcp -- npx threejs-devtools-mcp` | `claude plugin marketplace add Keeno-Corp/paprika3d` then `claude plugin install paprika3d@paprika3d` |

The threejs-devtools-mcp column is from its README and tools reference at version 0.5.0 and from the run below; `capture_frames` and the overlay were not run here.

## When threejs-devtools-mcp fits

You keep the dev server and the browser open, look at the scene yourself and ask the agent "why is my model invisible?" or "try the car in red". The agent changes the live scene, you see it in the tab, and when you say keep it, `pending_changes` gives the before and after as code for plain three.js or React Three Fiber, with where to find it in the source. Its `capture_frames` records evenly spaced frames for a promo or reel even when the scene renders below its frame rate, and its Playwright helpers bring the same tools into an end-to-end test.

## When paprika3d fits

Nobody is watching the tab: the agent writes a game, opens it, looks, plays it and decides whether it works. Because the clock is stepped, holding the right arrow for 90 frames moves the player the same distance every time, so a check that passed once passes again in CI or on another machine. The game can expose its score, lives and level through `window.__game`, and `interact` replies with what changed.

## The page both ran on

The coin-run page from the [three.js MCP server](/guides/threejs-mcp-server) guide: a player box, a coin and a ground, each with a `name`, and a `window.__game` object for the score. It was served from one folder on a local port and each server was registered in that folder with `claude mcp add -s project`, then driven from a headless Claude Code session, one session per server.

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

## What each one returned on the same page

These are the replies from 2026-11-22 on a Mac Studio, the page served at `localhost:5733`. Paths are shortened to `<project>` (the folder) and `<run>` (paprika3d's run folder), and each screenshot is replaced by a note.

### threejs-devtools-mcp

It was registered with `DEV_PORT=5733` and `HEADLESS=true`, so it launched its own headless Chrome through Puppeteer on its proxy. `bridge_status` reports the connection, and `scene_tree` returns the hierarchy with the named meshes and the two lights:

```text
bridge_status {}

Bridge: connected
Proxy: http://localhost:9222 → http://localhost:5733

Three.js app is accessible.

Playwright:
  Same browser: restart with CDP_PORT=9229, then npx @playwright/mcp --cdp-endpoint http://localhost:9229
  Or navigate any Playwright browser to http://localhost:9222 — the bridge is injected automatically.

scene_tree {}

"(unnamed) [Scene]\n  (unnamed) [AmbientLight] intensity=0.6\n  (unnamed) [DirectionalLight] intensity=2.5\n  ground [Mesh]\n  player [Mesh]\n  coin [Mesh]\n"

take_screenshot {}

[image/png: the screenshot]
Screenshot: 1280x713
Saved to: <project>/screenshots/screenshot-1795387871693.png
```

`web_audit` measured the canvas and the render loop and returned two findings, each with its fix:

```text
web_audit {}

{
  "backend": "webgl",
  "viewport": { "width": 1280, "height": 713, "devicePixelRatio": 1 },
  "canvas": { "buffer": [1280, 713], "css": [1280, 713], "pixelRatio": 1, "visible": true },
  "idleFps": 59,
  "drawCalls": 3,
  "textures": { "count": 0, "compressed": 0 },
  "findings": [
    {
      "severity": "low",
      "area": "context",
      "issue": "powerPreference is \"default\" — laptops may use the integrated GPU",
      "fix": "new WebGLRenderer({ powerPreference: 'high-performance' })  — only for heavy scenes"
    },
    {
      "severity": "low",
      "area": "render loop",
      "issue": "Renders every frame (~59 fps). Fine for animated scenes; for mostly static ones it drains battery",
      "fix": "Render on change: R3F <Canvas frameloop=\"demand\"> + invalidate(); vanilla: call render() from controls \"change\" events"
    }
  ]
}
```

Setting the coin red is a live preview; `pending_changes` then returns it as code for both plain three.js and React Three Fiber:

```text
set_material_property {"name": "coin", "property": "color", "value": "#ff0000"}

{
  "success": true,
  "material": "ba983ce7-ed36-4a4b-9958-feae327b2dca",
  "property": "color",
  "newValue": "#ff0000",
  "pendingChanges": 1
}
_note: Live preview only — not saved. 1 pending change(s): pending_changes → code to persist them, revert_changes → undo.

pending_changes {}

# 1 pending change(s) — live preview only, not in code yet

To persist: find each target in the source (search by name / path below), apply the code, then call pending_changes with clear=true.

## Material "coin" (MeshStandardMaterial) — used by Scene.coin
    const material = scene.getObjectByName('coin').material;
    material.color.set('#ff0000');

    <meshStandardMaterial color="#ff0000" />

- #1 color: "#e0b13a" → "#ff0000"
```

(The two code fences inside the last reply are shown indented here.)

### paprika3d

`open` loaded the same URL in its own headless Chrome, here on the Mac's GPU, paused at frame 0, and printed the game's `describe()`:

```text
open {"url": "http://localhost:5733/", "cwd": "<project>"}

Opened http://localhost:5733/ in 0.3 s, paused at frame 0.
GPU: ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Max, Unspecified Version).
Page text outside the canvas: none
{"name":"coin run","keys":{"ArrowLeft":"hold","ArrowRight":"hold"}}
Next: `look` to see it, then `interact` for each interaction the request names.

Run folder: <run>
```

`look` returns the screenshot with each named mesh's share of the frame and pixel box, and the problems it found:

```text
look {}

Picture: <run>/look-1.png
Pixels: brightness 83%, colour saturation 7%, 0% near black, 0% blown out.
Hues: grey 98% of the frame; over the objects (24.8% of it): grey 93%, red 6%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler did not run: the canvas kept its size when the page shrank (a debounced one waits for frames).
Lighting: no tone mapping (renderer.toneMapping is NoToneMapping): bright colours clip to white; ACESFilmicToneMapping, AgXToneMapping or NeutralToneMapping avoid it, and ACES also mutes saturated colours, which a bright stylised look may not want.
Surface: "ground" covers 23% with almost no detail (0 of 255): it reads as flat colour. Unless the user asked for flat colour, add texture, normal detail or lighting variation.
Subject: player takes 1.4% of the picture [122, 333, 264, 449]; 1 of its 1 named parts show.
Stands out: subject brightness 39% against 75% around it, colour 71% against 7%, edge contrast 0.24.
This camera shows little of the subject: try other views with `look` camera, then move the page's own camera to the best (said once).
On screen (3):
ground 23% [0, 359, 1279, 560] 12 × 4 units, across the view
player 1.4% [122, 333, 264, 449]
coin 0.43% [817, 348, 904, 430]
Never visible: none
[image/jpeg: the screenshot]
```

`observe` reads the game's state with the renderer counts, and holding the right arrow for 90 frames scores one point:

```text
observe {}

{"score":0,"player":{"x":-4},"coin":{"x":2},"harness":{"frame":1,"renderer":{"calls":3,"triangles":590,"textures":1,"geometries":3,"programs":2},"scene":{"objects":5,"meshes":3,"lights":2,"cameras":0},"errors":[],"changed":null}}

interact {"steps": [{"key": "ArrowRight", "frames": 90}, {"key": "ArrowRight", "down": false}]}

{"changed":{"score":1,"player":{"x":2},"coin":{"x":-2}}}
```

## How paprika3d plays the game

A single key press proves little, so here is a whole play: hold the right arrow until the first coin is taken, then turn round and hold the left arrow until the second one is. The agent writes the goal as state (`until` a score), not as a guess at frame counts, and `trace` reads three values on every frame of the play. `expect` checks the end state and `save` keeps the play as a check:

```text
interact {"steps": [{"key": "ArrowRight", "down": true}, {"until": {"score": 1}}, {"key": "ArrowRight", "down": false},
                    {"key": "ArrowLeft", "down": true}, {"until": {"score": 2}}, {"key": "ArrowLeft", "down": false}],
          "trace": ["score", "player.x", "coin.x"], "expect": {"score": 2, "coin.x": 2}, "save": "collect-two-coins"}

{"changed":{"score":2,"player":{"x":-1.4}}}
Motion (player): travelled 8.27 units (2.53 from start to end), its direction of travel turned 180° left.
until: score == 1 held at frame 82
until: score == 2 held at frame 126
score: 0 → 2 at frame 126; first changed at frame 82
player.x: -4 → peak 1.467 at frame 82 → -1.4 at frame 126; first changed at frame 1
coin.x: 2 → low -2 at frame 82 → 2 at frame 126; first changed at frame 82
Expect: score 2 ✓ · coin.x 2 ✓
Saved check "collect-two-coins" in <project>/game-tests.json (1 check now)
```

The reply says when each coin was taken, how far the player went and where it turned, which is what an agent needs to decide whether pickups, movement and scoring work. Because the clock moves when a step asks it to and not otherwise, the same steps give the same frames on every run and on every machine, so the saved play becomes a regression check. After the next edit, `test` replays it from a fresh reload:

```text
test {}

✓ collect-two-coins
1 of 1 saved checks passed in 0.1 s
```

threejs-devtools-mcp has no input tool, so the nearest equivalent there is code the agent writes for `run_js`, on the page's real clock. That fits a one-off poke; it does not give a frame-exact replay.

Read side by side, the two describe the same scene from different ends: threejs-devtools-mcp names every object in the hierarchy, lights included, and audits the live render loop, while paprika3d reports what the camera shows and what the game's state did after the keys.

## Using both

Register both servers in the same client: their tool names differ (threejs-devtools-mcp's start with words such as `scene_`, `set_`, `web_` and `take_`; paprika3d's are `open`, `look`, `observe`, `interact`, `perf` and the like), and each starts its own browser. In this run they were used in separate sessions, one after the other. A common split: threejs-devtools-mcp while you art-direct a scene in your own tab, paprika3d for the agent's own build and test loop.

**More guides:** [three.js MCP server](/guides/threejs-mcp-server), [Chrome DevTools MCP vs Playwright MCP](/guides/chrome-devtools-mcp-vs-playwright-mcp), [MCP server that screenshots a WebGL canvas](/guides/mcp-server-screenshot-webgl-canvas).
