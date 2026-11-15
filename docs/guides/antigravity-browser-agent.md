---
title: Antigravity browser agent on a three.js game: what its recordings show and what to add
phrase: antigravity browser agent
description: What Google Antigravity's browser agent, the browser subagent, does on a three.js game drawn in a canvas, what its screenshots and WebM recordings show a person, and how adding paprika3d to Antigravity's mcp_config.json gives it the racing gates by name and the frame a drone flew through each one.
meta: Antigravity's browser agent on a three.js game: what its recordings show, and paprika3d in mcp_config.json for named objects and exact frames.
intent: antigravity-browser-agent
queries:
  - "antigravity browser agent"
  - "google antigravity browser subagent"
  - "antigravity playwright mcp"
  - "antigravity game development"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# Antigravity browser agent on a three.js game: what its recordings show and what to add

Antigravity's browser agent is a `browser` subagent: it opens your game, clicks, types, reads the console and network, takes screenshots, and in the IDE can save a WebM recording of what it did for you to watch. On a three.js game those are pictures of a canvas, so they show a person the flight but give the agent no gate names, positions or frame numbers. To add those, put paprika3d in `.agents/mcp_config.json` in the workspace (or `~/.gemini/config/mcp_config.json` for every project):

```json
{ "mcpServers": { "paprika": { "command": "npx", "args": ["-y", "paprika3d", "serve"] } } }
```

paprika3d is an MCP server whose `open` runs the page in a headless Chrome on a paused clock, `look` lists each named object on screen with its pixel box, and `interact` holds keys on exact frames and returns what the game's state did. This page flies a small drone through racing gates with both in mind.

## What the browser agent does, by surface

Antigravity's [browser use page](https://antigravity.google/docs/browser), read on 2026-11-12, says the agent "can open web pages, interact with your running application, inspect console errors and failed network requests, take screenshots, and verify visual fixes before finishing a task". How it starts depends on where you run it:

| Surface | How it starts | What drives the page |
|---|---|---|
| Antigravity App, personal accounts (v2.30.0 and later) | a plain request, or `/browser` | the App's built-in browser |
| Antigravity CLI, and the App on business accounts | `/browser` | your local Google Chrome (144 or later) through the Chrome DevTools MCP server |
| Antigravity IDE (v2.6.0 and later) | `/browser` | the same, in local workspaces |

Each subagent "runs in its own isolated context window", on a Gemini Flash model by default. In the built-in browser it acts "through structured browser actions inside an isolated worker with no workspace/shell tools and no arbitrary in-page JavaScript evaluation"; the Chrome path adds `evaluate_script`, performance traces and Lighthouse, and asks before running a script by default. The same page lists a guardrail that matters for games: agent-controlled pages "cannot enter fullscreen, lock your mouse pointer or keyboard". What Chrome DevTools MCP itself can do is on [the Chrome DevTools MCP and Playwright MCP page](/guides/chrome-devtools-mcp-vs-playwright-mcp).

This page did not run Antigravity; the lines above are quoted from its documentation, which changes often, so read it again before you depend on one.

## What the recordings show

[Browser recordings](https://antigravity.google/docs/ide/browser-recordings) in the IDE are WebM videos of the subagent's clicks, typing and form filling, saved as `recording.webm` in its artifacts when it finishes. The page is careful about them: a recording is not guaranteed, and a session that opens pages or takes screenshots and does nothing else produces none. In the App you watch the agent work in the side panel and ask it to save screenshots as artifacts.

For a drone game, a recording is good evidence for you: you watch the drone go through the first gate and drift wide of the second. It is evidence for a person, though. The agent's own view is the screenshots it took between actions, and a drone at 6 metres a second crosses a gate's plane between two of them. Whether it passed inside the frame, on which frame, and how far from the centre are numbers the game holds, and the built-in browser's agent reads no JavaScript from the page to get them.

## Add paprika3d to Antigravity

All three surfaces read the same `mcp_config.json`, according to Antigravity's [MCP page](https://antigravity.google/docs/mcp): the global `~/.gemini/config/mcp_config.json` or a workspace's `.agents/mcp_config.json`, with the `mcpServers` shape shown at the top of this page. In the App, Customizations, then Installed, lists MCP servers, and **Copy Config File Path** finds the file. In the IDE, open **Manage MCP Servers** and then **View raw config**. In the CLI, `/mcp` opens the MCP manager. Antigravity's default time limit for a tool call covers `open` starting Chrome; `timeoutSeconds` in the server's entry raises it on a slow machine.

Antigravity reads skills from `.agents/skills` in the workspace, so paprika3d's skills, which tell the agent when to call each tool and how to read the replies, go in with:

```bash
npx skills add Keeno-Corp/paprika3d -a antigravity
```

## The game: drone gates

The drone flies forward at 6 metres a second. Left and Right turn it, Up tips the nose up and Down tips it down, and the nose levels again when you let go. Fly through gates 1, 2 and 3, square frames on poles, in that order. Save it as `index.html` next to `node_modules/three` (`npm install three`):

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Drone gates</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rules: the drone flies forward at a steady speed; Left and Right turn it (yaw), Up and Down tip its nose up or
// down (pitch). Fly through the three square gates in order; touching the ground ends the run. Units are metres.
const SPEED = 6, YAW_RATE = 1.2, PITCH_MAX = 0.5, PITCH_RATE = 2, GATE = 1.5;   // GATE: half the opening's width
const GATES = [[0, 3, -10], [5, 5, -22], [1, 3, -34]];
const held = new Set();
let drone, next, passed, frame, crashed;
function start() {
  drone = { x: 0, y: 3, z: 0, yaw: 0, pitch: 0 };
  next = 0; passed = []; frame = 0; crashed = false;
}
function step(dt) {
  if (crashed) return;
  frame++;
  drone.yaw += ((held.has('ArrowLeft') ? 1 : 0) - (held.has('ArrowRight') ? 1 : 0)) * YAW_RATE * dt;
  const want = ((held.has('ArrowUp') ? 1 : 0) - (held.has('ArrowDown') ? 1 : 0)) * PITCH_MAX;   // nose up on Up
  drone.pitch += Math.max(-PITCH_RATE * dt, Math.min(PITCH_RATE * dt, want - drone.pitch));
  const z0 = drone.z, c = Math.cos(drone.pitch);
  drone.x -= Math.sin(drone.yaw) * c * SPEED * dt;
  drone.y += Math.sin(drone.pitch) * SPEED * dt;
  drone.z -= Math.cos(drone.yaw) * c * SPEED * dt;
  const gate = GATES[next];
  if (gate && z0 > gate[2] && drone.z <= gate[2]) {   // crossing the next gate's plane: through it, or past it
    if (Math.abs(drone.x - gate[0]) < GATE - 0.2 && Math.abs(drone.y - gate[1]) < GATE - 0.2) { passed.push({ gate: next + 1, frame }); next++; }
  }
  if (drone.y < 0.3) crashed = true;
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9cc8e8);
scene.fog = new THREE.Fog(0x9cc8e8, 25, 70);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);
scene.add(new THREE.HemisphereLight(0xffffff, 0x5a7a4a, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(5, 10, 4);
scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x6f9a52 }));
ground.name = 'ground'; ground.rotation.x = -Math.PI / 2; scene.add(ground);
const gateMeshes = GATES.map(([x, y, z], i) => {
  const m = new THREE.Mesh(new THREE.TorusGeometry(GATE * Math.SQRT2, 0.12, 8, 4), new THREE.MeshStandardMaterial({ color: 0xf08a24, flatShading: true }));
  m.name = `gate ${i + 1}`; m.position.set(x, y, z); m.rotation.z = Math.PI / 4; scene.add(m);   // a 4-sided torus: a square frame
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, y - GATE), new THREE.MeshStandardMaterial({ color: 0x8a8f96 }));
  pole.name = `pole ${i + 1}`; pole.position.set(x, (y - GATE) / 2, z); scene.add(pole);
  return m;
});
const droneMesh = new THREE.Group();
droneMesh.name = 'drone';
const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.6), new THREE.MeshStandardMaterial({ color: 0x2a2f38 }));
body.name = 'drone body';
droneMesh.add(body);
for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) {
  const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 20), new THREE.MeshStandardMaterial({ color: 0xd8dde3 }));
  rotor.name = 'drone rotor'; rotor.position.set(x, 0.1, z); droneMesh.add(rotor);
}
scene.add(droneMesh);

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
  droneMesh.position.set(drone.x, drone.y, drone.z);
  droneMesh.rotation.set(drone.pitch, drone.yaw, 0, 'YXZ');
  gateMeshes.forEach((m, i) => m.material.color.set(i < next ? 0x3cc060 : 0xf08a24));   // a passed gate turns green
  const back = new THREE.Vector3(Math.sin(drone.yaw), 0, Math.cos(drone.yaw));          // a chase camera behind and above
  camera.position.set(drone.x + back.x * 6, drone.y + 2, drone.z + back.z * 6);
  camera.lookAt(drone.x - back.x * 6, drone.y, drone.z - back.z * 6);
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100;
window.__game = {
  describe: () => ({ name: 'drone gates', units: 'metres, y up, the drone starts flying toward -z',
    keys: { ArrowLeft: 'turn left', ArrowRight: 'turn right', ArrowUp: 'nose up', ArrowDown: 'nose down', KeyR: 'restart' } }),
  observe: () => ({ drone: { x: r2(drone.x), y: r2(drone.y), z: r2(drone.z), yaw: r2(drone.yaw), pitch: r2(drone.pitch) }, next: next + 1, passed, frame, crashed }),
  act: ({ key, down = true }) => { if (key === 'KeyR') { if (down) start(); } else if (down) held.add(key); else held.delete(key); },
  setState: s => { if (s.drone) drone = { ...drone, ...s.drone }; },
};
</script>
</body></html>
```

`passed` in `observe()` keeps each gate with the game's frame count at the moment the drone went through it, which is the answer to "did it pass, and when".

## The calls, and the replies

The replies below are from paprika3d's MCP server on this page on 2026-11-12, on a Linux machine with no graphics card, called directly; Antigravity would make the same calls and get the same replies. Run folders are shortened to `<project>`; the `look` reply is cut to the lines used here.

**Open and look.** `open {"url":"index.html","cwd":"<project>"}` loads it paused at frame 0, then:

```text
look {}

Picture: <project>/paprika3d/runs/2026-11-12T04-51-27-601Z/look-1.png
On screen (12):
ground 59% [0, 318, 1279, 799] 200 × 200 units
gate * ×3 0.56% [570, 244, 806, 438] 4.48 × 4.48 units
drone body 0.23% [605, 490, 674, 530]
drone rotor ×4 0.29% [566, 478, 713, 523] 0.44 × 0.44 units
pole * ×3 0.07% [637, 324, 766, 489] 1.5–3.5 × 0.16 units
Never visible: none
```

All three gates are in view (`gate *` gathers `gate 1` to `gate 3`), with the drone in front of the camera. The size given for a gate is across its own corners, since each is a four-sided ring turned on its side. A screenshot shows the same; the list is what the agent can check without reading the picture.

**Fly straight for 260 frames.**

```text
interact {"steps":[{"wait":260}],"trace":["next","drone.z"]}

{"changed":{"drone":{"z":-26.1},"next":2,"passed":[{"gate":1,"frame":101}],"frame":261}}
next: 1 → 2 at frame 100; first changed at frame 100
drone.z: -0.1 → -26.1 at frame 260; first changed at frame 1
```

The drone went through gate 1, which is straight ahead, and `next` stayed at 2: it flew on past z -22, the plane of gate 2, without going through it. The trace counts frames from the start of the call; the game counts from the page's load, one frame earlier, so `passed` says 101 where the trace says 100.

**Fly the route to gate 2, and save it.** An `until` step flies to gate 1. Then Right and Up go down together (`frames: 0` sends a step on the same frame as the next) and are held for 40 frames, both are let go for 30, and Left is held for 40 to straighten out. A last `until` waits for gate 2:

```text
interact {"steps":[{"until":{"next":2},"max":200},{"key":"ArrowRight","down":true,"frames":0},{"key":"ArrowUp","down":true,"frames":40},{"key":"ArrowRight","down":false,"frames":0},{"key":"ArrowUp","down":false,"frames":30},{"key":"ArrowLeft","frames":40},{"until":{"next":3},"max":120}],"trace":["drone.x","drone.y","next"],"expect":{"next":3},"save":"through-gates-1-and-2"}

{"changed":{"drone":{"x":4.97,"y":4.93,"z":-22},"next":3,"passed":[{"gate":1,"frame":101},{"gate":2,"frame":241}],"frame":241}}
until: next == 2 held at frame 101
until: next == 3 held at frame 241
drone.x: 0 → 4.97 at frame 209; first changed at frame 103
drone.y: 3 → 4.93 at frame 154; first changed at frame 103
next: 1 → 3 at frame 241; first changed at frame 101
Expect: next 3 ✓
Saved check "through-gates-1-and-2" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

Gate 2 is centred at x 5 and y 5. The drone crossed its plane at x 4.97 and y 4.93, within a few centimetres of the centre, on frame 241. The climb ended on frame 154, when the nose had levelled, and the sideways drift on frame 209, after the left turn. These steps were found by trying: change a number, rerun, read where the drone crossed. That is how an agent tunes a route or a difficulty, and each try is one call.

**Rerun after a change.** If a later edit makes the drone faster or the gates smaller, this tells you at once:

```text
test {}

✓ through-gates-1-and-2
1 of 1 saved checks passed in 0.6 s
```

## Pitfalls

- **Keys are `KeyboardEvent.code` names** in `describe()` and in the steps (`ArrowUp`, `KeyR`), and real key events and `act()` go through the same `held` set, so the tools and a player drive the same code.
- **Let go of held keys.** A `{ key, down: true }` step stays held until a `down: false` step, across calls too.
- **No pointer lock for flight by mouse.** A game that steers with mouse movement under pointer lock does not get the lock in Antigravity's agent tabs, per the guardrail quoted above; paprika3d's `interact` sends `{ mouse: "move", relative: [dx, dy] }` for that case.

## What paprika3d does not do

It does not drive Antigravity's built-in browser or your own Chrome, and it makes no WebM recording for you to watch: its pictures are PNG screenshots of its own headless page. With no graphics card, that page draws WebGL in software, so its frame times are no guide to a player's machine. It reports where the drone went and on which frame; whether the course is fun to fly is for you to decide. And the slash commands and hooks of the Claude Code plugin stay in Claude Code; Antigravity gets the tools and the skills.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): keys on exact frames, state as JSON, saved checks.
- [Screenshot a three.js scene headless from a coding agent](/guides/screenshot-threejs-scene-headless): what `look` returns and its other modes.
- [Chrome DevTools MCP vs Playwright MCP](/guides/chrome-devtools-mcp-vs-playwright-mcp): the server under the `/browser` subagent, next to Playwright's.
- [How to make a plane game](/guides/make-a-plane-game): a flying game built step by step.
- [Control time in three.js tests](/guides/control-time-threejs-tests): why the same keys fly the same route on every run.
