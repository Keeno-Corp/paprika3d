---
title: AI game playtesting for browser games: an agent plays your three.js game and finds where it gets stuck
phrase: ai game playtesting
description: How AI game playtesting works on a three.js game with the paprika3d MCP server. A tester subagent opens its own copy of a three-level marble maze, plays each level with until steps that stop at the frame the marble falls or reaches the goal, reads a trace of the marble's position to find where it got stuck, saves every level it finishes as a check that test reruns, and asks feel whether a fall reacts on screen.
meta: Automated AI playtesting for a browser game: a coding agent plays each level of your three.js game, stops where the player falls or sticks, and saves a check.
intent: ai-game-playtesting
queries:
  - "ai game playtesting"
  - "how to make ai play my game"
  - "automated playtesting browser game"
  - "How common is automated testing in game development?"
  - "Automated testing of games"
  - "Letting AI play my game – building an agentic test harness to help play-testing"
  - "What tools let a coding agent play a browser game it just wrote and check that it works?"
  - "tool for coding agent to play and test browser game"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# AI game playtesting for browser games: an agent plays your three.js game and finds where it gets stuck

AI game playtesting means letting an agent play your game and report where it breaks. For a browser game, a coding agent can do it level by level, even on a game it did not write, if something runs the page for it, presses the keys on exact frames and reads the game's state back. paprika3d is that something for three.js. In Claude Code, install it with `claude plugin marketplace add Keeno-Corp/paprika3d && claude plugin install paprika3d@paprika3d`; in any other MCP client, register `npx -y paprika3d serve` as a stdio server. Then ask for a tester subagent: it opens its own copy of the game with `open` and `game: "tester"`, plays each level with `interact` until the state says the level ended, reads a `trace` of where the player went, and keeps every level it finishes as a check with `save`.

## What the agent tests, and what it does not

A person playtesting a game reports two kinds of thing: "I could not get past level 3" and "level 3 was boring". The first is a fact about the game's rules and its level data, and an agent can find it the same way every time: hold the keys a player would hold, stop when the level ends or when a time limit runs out, and look at where the player was when it stopped. The second is taste. paprika3d does not judge whether a level is fun, too easy or too long, and nothing on this page claims it does; that stays with the people who play it.

What the agent gets in place of eyes and hands:

- A page of its own. `open` with a `game` name opens a second copy beside the one the builder agent uses, up to 4 at once, so a tester never moves the builder's page.
- A paused clock. Each frame is 1/60 s of game time and `Math.random` is seeded, so the same keys reach the same place on the same frame on every run.
- Stops on state, not on time. An `until` step plays frame by frame until the state holds (the level changed, the player won), up to `max` frames, and says the frame.
- A trace. `trace` reads up to 6 values every frame and gives each one's first and last value, its peak or low, and its first change, with frames. A marble that stops moving shows up as a last value reached long before the run ended.

## Install

paprika3d needs Google Chrome and Node 20.11 or later; the Claude Code plugin needs Claude Code 2.1.118 or later.

```bash
claude plugin marketplace add Keeno-Corp/paprika3d
claude plugin install paprika3d@paprika3d
npm install three
```

For Cursor, Codex, the Gemini CLI and other MCP clients, the install page gives the entry for `npx -y paprika3d serve` and the Codex and Gemini CLI commands that add it. The tools are the same in every client; a tester subagent is whatever the client calls a subagent (in Claude Code, a subagent the main agent starts with its own brief).

## The game: a marble maze in three levels

The arrow keys tilt a board and a marble rolls downhill. Level 1 is an empty board, level 2 puts a hole on the straight line from start to goal, and level 3 puts a wall across the board with a gap at the left end. The levels are data at the top of the file, so a tester's report names a line to change. The game exposes `window.__game` (the convention page describes it) with the level, the status, the number of falls and the marble's place.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Marble maze</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// Each level is data: start, goal, holes [x, z, radius] and walls [x1, z1, x2, z2] on a 10 by 10 board.
const LEVELS = [
  { start: [-4, 4], goal: [4, -4], holes: [], walls: [] },
  { start: [-4, 4], goal: [4, -4], holes: [[0, 0, 0.8]], walls: [] },
  { start: [4, 4], goal: [-4, -4], holes: [], walls: [[-4.5, -0.15, 5, 0.15]] },
];
const R = 0.3, EDGE = 5 - R, TILT = 0.25, GOAL_R = 0.8;
const held = new Set();
let level = 1, status = 'playing', falls = 0, shake = 0;
const m = { x: 0, z: 0, vx: 0, vz: 0 }, tilt = { x: 0, z: 0 };

function load(n) {
  level = n; status = 'playing';
  [m.x, m.z] = LEVELS[n - 1].start; m.vx = m.vz = 0;
  build();
}

function step(dt) {
  if (status !== 'playing') return;
  const want = { x: (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0), z: (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0) };
  for (const k of ['x', 'z']) tilt[k] += THREE.MathUtils.clamp(want[k] * TILT - tilt[k], -dt, dt);
  m.vx = (m.vx + 9.8 * Math.sin(tilt.x) * dt) * (1 - 0.8 * dt);
  m.vz = (m.vz + 9.8 * Math.sin(tilt.z) * dt) * (1 - 0.8 * dt);
  m.x += m.vx * dt; m.z += m.vz * dt;
  if (Math.abs(m.x) > EDGE) { m.x = Math.sign(m.x) * EDGE; m.vx = 0; }
  if (Math.abs(m.z) > EDGE) { m.z = Math.sign(m.z) * EDGE; m.vz = 0; }
  const L = LEVELS[level - 1];
  for (const [x1, z1, x2, z2] of L.walls) {   // push the marble out of each wall, keeping the slide along it
    const cx = Math.min(Math.max(m.x, x1), x2), cz = Math.min(Math.max(m.z, z1), z2);
    const dx = m.x - cx, dz = m.z - cz, d = Math.hypot(dx, dz);
    if (d > 0 && d < R) {
      const nx = dx / d, nz = dz / d, vn = m.vx * nx + m.vz * nz;
      m.x = cx + nx * R; m.z = cz + nz * R;
      if (vn < 0) { m.vx -= vn * nx; m.vz -= vn * nz; }
    }
  }
  if (L.holes.some(([x, z, r]) => Math.hypot(m.x - x, m.z - z) < r)) {
    falls++; shake = 0.4;
    [m.x, m.z] = L.start; m.vx = m.vz = 0;
  }
  if (Math.hypot(m.x - L.goal[0], m.z - L.goal[1]) < GOAL_R) {
    if (level < LEVELS.length) load(level + 1); else status = 'won';
  }
}

function act({ key, down = true }) { if (down) held.add(key); else held.delete(key); }
addEventListener('keydown', e => act({ key: e.key }));
addEventListener('keyup', e => act({ key: e.key, down: false }));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1d2433);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 13, 9);
camera.lookAt(0, 0, 0.5);
scene.add(new THREE.HemisphereLight(0xffffff, 0x404050, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.8);
sun.position.set(-4, 10, 6);
scene.add(sun);
const board = new THREE.Group();
scene.add(board);
const boardMat = new THREE.MeshStandardMaterial({ color: 0xc8a06a });
const marble = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 12), new THREE.MeshStandardMaterial({ color: 0x3a7bd5, metalness: 0.3, roughness: 0.3 }));
marble.name = 'marble';

function build() {
  board.clear();
  const L = LEVELS[level - 1];
  const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 10), boardMat);
  floor.name = 'board'; floor.position.y = -0.15;
  board.add(floor, marble);
  const goal = new THREE.Mesh(new THREE.CircleGeometry(GOAL_R, 32), new THREE.MeshStandardMaterial({ color: 0x3cbf5a }));
  goal.name = 'goal'; goal.rotation.x = -Math.PI / 2; goal.position.set(L.goal[0], 0.01, L.goal[1]);
  board.add(goal);
  L.holes.forEach(([x, z, r], i) => {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshBasicMaterial({ color: 0x050505 }));
    hole.name = `hole-${i + 1}`; hole.rotation.x = -Math.PI / 2; hole.position.set(x, 0.01, z);
    board.add(hole);
  });
  L.walls.forEach(([x1, z1, x2, z2], i) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, 0.5, z2 - z1), new THREE.MeshStandardMaterial({ color: 0x7a5232 }));
    wall.name = `wall-${i + 1}`; wall.position.set((x1 + x2) / 2, 0.25, (z1 + z2) / 2);
    board.add(wall);
  });
}
load(1);
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

let last = null;
renderer.setAnimationLoop((now) => {
  const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);   // never more than 0.1 s a frame
  last = now;
  step(dt);
  shake = Math.max(0, shake - dt);
  board.rotation.set(tilt.z, 0, -tilt.x);
  marble.position.set(m.x, R, m.z);
  boardMat.emissive.setRGB(shake * 1.5, 0, 0);   // the board flashes red when the marble falls
  camera.position.set(Math.sin(now / 20) * shake * 0.6, 13, 9);
  renderer.render(scene, camera);
});

const round = (n) => +n.toFixed(2);
window.__game = {
  describe: () => ({ name: 'marble maze', units: 'board units, x right, z towards the camera', keys: { ArrowUp: 'hold to tilt away', ArrowDown: 'hold to tilt towards you', ArrowLeft: 'hold to tilt left', ArrowRight: 'hold to tilt right' } }),
  observe: () => ({ level, status, falls, marble: { x: round(m.x), z: round(m.z) } }),
  act,
  setState: (s) => {
    if (s.level) load(s.level);
    if (s.marble) Object.assign(m, s.marble);
    if (s.falls !== undefined) falls = s.falls;
  },
};
</script>
</body></html>
```

Save it as `index.html`. `setState({ level })` loads a level, which is what lets a tester start on level 3 without playing the first two.

## What to ask for

A request in Claude Code, in a person's words:

```text
Start a tester subagent for index.html. It opens the game under its own name, plays each of
the three levels with the arrow keys the way a new player would, and tells me for each level
whether it got to the goal, how many times the marble fell, and where the marble was when it
stopped. Save each level it finishes as a check.
```

The calls below are the ones a tester makes for that request, each with the reply the stable tools gave for this page on 2026-11-12. Run folder paths are shortened to `<project>`.

## The tester's calls, level by level

**Open its own page.** The `game` name goes on every later call too.

```text
open {"url": "index.html", "cwd": "<project>", "game": "tester"}

Opened http://127.0.0.1:34353/index.html as game "tester" in 0.2 s, paused at frame 0.
GPU: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). A software renderer (no GPU): frame times here say nothing of a real GPU's.
Page text outside the canvas: none
{"name":"marble maze","units":"board units, x right, z towards the camera","keys":{"ArrowUp":"hold to tilt away","ArrowDown":"hold to tilt towards you","ArrowLeft":"hold to tilt left","ArrowRight":"hold to tilt right"}}
geo.js and fx.js are here, written on the first open and replaced only when the plugin's copy changes (each starts with the plugin version that wrote it): they are the plugin's, part of the project like node_modules: leave them in place.
Procedural geometry: import { geo, scatter } from "./geo.js" (see the skill's geometry reference).
Effects: import { stage, tex, field, place, instances, sfx, burst, shake, uv, picture, bake, trace, heightfield } from "./fx.js" (lights and camera, canvas textures, terrain, placement, sound, particles, a reference picture's camera and pixel maps, a subtree as GLB bytes, a picture's outlines and heights; seeded, no files).
picture({ position, lookAt?, fov?, size? }) returns { camera, at(px, py, depth), ground(px, py, y?), px(point), fit(width, height, cam?) }; bake(object, { animations? }) returns a Promise of GLB bytes (an ArrayBuffer, which eval { save } writes to a file); trace(src, { colour?, tolerance?, invert?, simplify?, minArea?, scale? }) returns a Promise of { shapes, mask, width, height }; heightfield(src, { size, height, base? }) returns a Promise of a Field like field()'s. Every option: references/fx.md in the threejs-game skill.
Next: `look` to see it, then `interact` for each interaction the request names.

Run folder: <project>/paprika3d/runs/2026-11-12T04-37-31-277Z
```

The `keys` line is the game's own `describe()`: a tester learns the controls from it, not from the source. A `look` then shows the board, the goal and the marble with their boxes in pixels:

```text
look {"game": "tester"}

Picture: <project>/paprika3d/runs/2026-11-12T04-37-31-277Z/look-1.png
Pixels: brightness 32%, colour saturation 42%, 0% near black, 0% blown out.
Hues: blue 68%, orange 32% of the frame; over the objects (32.4% of it): orange 98%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
Surface: "board" covers 32% with almost no detail (0 of 255): it reads as flat colour. Unless the user asked for flat colour, add texture, normal detail or lighting variation.
On screen (3):
board 32% [271, 160, 1008, 684] 10 × 10 units
goal 0.41% [812, 167, 897, 228] 1.6 × 1.6 units
marble 0.15% [328, 578, 372, 621]
Never visible: none
```

The goal is up and to the right of the marble, so a first plan is to tilt the board that way.

**Level 1: tilt towards the goal until the level changes.** Two keys go down on the same frame (`frames: 0` sends the first with the second), the `until` step plays until `level` reads 2, and the keys come up.

```text
interact {"game": "tester", "steps": [{"key": "ArrowUp", "down": true}, {"key": "ArrowRight", "down": true, "frames": 0}, {"until": {"level": 2}, "max": 600}, {"key": "ArrowUp", "down": false}, {"key": "ArrowRight", "down": false}], "trace": ["marble.x", "marble.z"]}

{"changed":{"level":2}}
until: level == 2 held at frame 227
marble.x: -4 → peak 3.38 at frame 226 → -4 at frame 227; first changed at frame 9
marble.z: 4 → low -3.42 at frame 226 → 4 at frame 227; first changed at frame 8
```

Level 1 took 227 frames, under four seconds of play. The marble went from the start corner to the goal and was put back at level 2's start on the frame the level changed.

**Level 2: the same plan, and where it goes wrong.**

```text
interact {"game": "tester", "steps": [{"key": "ArrowUp", "down": true}, {"key": "ArrowRight", "down": true, "frames": 0}, {"until": {"level": 3}, "max": 600}, {"key": "ArrowUp", "down": false}, {"key": "ArrowRight", "down": false}], "trace": ["marble.x", "marble.z", "falls"]}

{"changed":{"falls":4,"marble":{"x":-2.31,"z":2.31}}}
until: not met in 600 frames (level 2, expected 3)
Trace (the first 600 frames):
marble.x: -4 → peak -0.58 at frame 128 → -2.41 at frame 600; first changed at frame 2
marble.z: 4 → low 0.58 at frame 128 → 2.41 at frame 600; first changed at frame 2
falls: 0 → 4 at frame 519; first changed at frame 129
```

The trace answers "where did it get stuck" without a picture: the marble got no further than (-0.58, 0.58), the edge of the hole at the centre, and fell for the first time on frame 129. Four falls in ten seconds is a hole a new player meets on every straight run. That is a finding for the person to weigh (it may be the level's whole point), so the tester reports it and tries another route: along the right edge first, then up.

```text
interact {"game": "tester", "steps": [{"state": {"level": 2}}, {"key": "ArrowRight", "down": true}, {"until": {"marble.x": [4.6, 5]}, "max": 300}, {"key": "ArrowUp", "down": true}, {"until": {"level": 3}, "max": 600}, {"key": "ArrowUp", "down": false}, {"key": "ArrowRight", "down": false}], "trace": ["marble.x", "marble.z", "falls"]}

{"changed":{"level":3,"marble":{"x":4,"z":4}}}
until: marble.x 4.6 to 5 held at frame 243
until: level == 3 held at frame 468
marble.x: -4 → peak 4.7 at frame 245 → 4 at frame 468; first changed at frame 3
marble.z: 4 → low -3.59 at frame 467 → 4 at frame 468; first changed at frame 4
falls: 4 throughout the 470 frames
```

Each `until` says the frame it held at, so the reply reads as a route: at the right edge by frame 243, at the goal by frame 468, no fall on the way.

**Level 3: stuck at the wall.** The goal is now top left behind a wall, with a gap at the left end.

```text
interact {"game": "tester", "steps": [{"key": "ArrowUp", "down": true}, {"key": "ArrowLeft", "down": true, "frames": 0}, {"until": {"status": "won"}, "max": 600}, {"key": "ArrowUp", "down": false}, {"key": "ArrowLeft", "down": false}], "trace": ["marble.x", "marble.z"]}

{"changed":{"marble":{"x":-4.7,"z":0.37}}}
until: not met in 600 frames (status "playing", expected "won")
Trace (the first 600 frames):
marble.x: 4 → peak 4.09 at frame 22 → -4.7 at frame 275; first changed at frame 2
marble.z: 4 → 0.37 at frame 286; first changed at frame 2
```

No fall this time: the marble reached the left edge on frame 275 and the wall on frame 286, then sat at (-4.7, 0.37) for the rest of the run with both keys held. That is the stuck spot, read from the trace's last value and the frame it was reached. The level data says why: the wall starts at x -4.5, so the gap between it and the board's edge is 0.5 units, and the marble is 0.3 units in radius. No player can get through. The fix is one number in `LEVELS`:

```js
{ start: [4, 4], goal: [-4, -4], holes: [], walls: [[-3.8, -0.15, 5, 0.15]] },
```

After the edit the next call reloads the page by itself, and the same keys finish the game:

```text
interact {"game": "tester", "steps": [{"state": {"level": 3}}, {"key": "ArrowUp", "down": true}, {"key": "ArrowLeft", "down": true, "frames": 0}, {"until": {"status": "won"}, "max": 600}, {"key": "ArrowUp", "down": false}, {"key": "ArrowLeft", "down": false}], "trace": ["marble.x", "marble.z"]}

{"changed":{"level":3,"status":"won","marble":{"x":-4.7,"z":-3.64}}}
until: status == "won" held at frame 380
marble.x: 4 → -4.7 at frame 254; first changed at frame 9
marble.z: 4 → -3.64 at frame 380; first changed at frame 8
```

## Keep each finished level as a check

A level the tester finished once should stay finishable after every later edit. The same steps with `expect` and `save` become a named check in `game-tests.json`, played from a fresh reload, with the `state` step at its start as the setup:

```text
interact {"game": "tester", "steps": [{"key": "ArrowUp", "down": true}, {"key": "ArrowRight", "down": true, "frames": 0}, {"until": {"level": 2}, "max": 600}, {"key": "ArrowUp", "down": false}, {"key": "ArrowRight", "down": false}], "expect": {"level": 2, "falls": 0}, "save": "level-1"}

{"changed":{"level":2}}
until: level == 2 held at frame 227
Expect: level 2 ✓ · falls 0 ✓
Saved check "level-1" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

After `level-2` (the right-edge route, from `{"state": {"level": 2}}`) and `level-3` (from `{"state": {"level": 3}}`, expecting `"status": "won"`) are saved the same way, `test` reruns all three:

```text
test {"game": "tester"}

✓ level-1
✓ level-2
✓ level-3
3 of 3 saved checks passed in 1.9 s
```

A later edit that moves the hole onto the right-edge route, or narrows the gap again, turns one of these lines into a ✗ with the value it read. In Claude Code the plugin's after-edit hook runs them by itself.

## Does a fall react?

A player who falls into a hole should see that it happened. `feel` sets the marble up next to the hole, rolling towards it, and watches the next 45 frames:

```text
feel {"game": "tester", "steps": [{"state": {"level": 2, "marble": {"x": -1.2, "z": 1.2, "vx": 2, "vz": -2}}}, {"wait": 1}]}

Watched the steps' 1 frames and 45 frames after them, counted from the first step.
Camera: shook up to 0.206 at frame 24 and came back.
Smooth moves (a new position on 3+ consecutive frames): 1 (marble).
Teleports (a jump over 0.5 units between two watched frames, 4× the moves either side of it; a respawn is one, a glitch only for something that should glide): 1 (marble at frame 22, 4.85 units).
Colour flashes (colour, emissive or a page overlay's opacity changed and came back): 1 (board at frame 22).
No change in: scale (no pops), spawns, removals.
HUD text: unchanged.
Sounds started: 0.
State: falls 0 → 1, marble.x -1.17 → -4, marble.z 1.17 → 4.
```

The fall on frame 22 came with a red flash of the board on the same frame and a camera shake two frames later. The teleport is the respawn at the start, as the line says. There is no sound and no counter on screen; whether the game wants them is a design call for the person.

## What paprika3d does not do here

- It does not judge fun, difficulty or pacing. The trace says a new player's straight run falls four times on level 2; whether that is too hard is the person's call.
- It does not find routes by itself. The tester agent writes each plan (which keys, until what), reads the reply and tries again; paprika3d plays the plan exactly and reports what happened.
- It does not play like a person. Keys go down on exact frames, with no reaction time and no fumbling, so a level that needs fast hands passes here before a person finds it easy.
- It runs the page in headless Chrome on this machine. On a host with no GPU, WebGL draws in software, so frame times say nothing of a real GPU's, and it does not run the game on a phone or a console.

## Without paprika3d

The same playtest can be written as a browser script: Playwright's `page.keyboard.down('ArrowUp')` holds a key, a loop over `page.evaluate(() => window.__game.observe())` reads the state, and the script stops when `level` changes or a frame limit runs out. Two things make it repeatable: control of time (Playwright's `page.clock`, or a `step(dt)` the test calls with 1/60 s) and a seeded random source. Recording the peak and last value of each traced path, and saving a passing run as a check for later, is code the script carries itself. For rules alone, a level's data and its `step` function can be tested with no browser at all, as the unit test guide shows.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): keys on exact frames and the state read back, the calls this page builds on.
- [Screenshot a three.js scene headless from a coding agent](/guides/screenshot-threejs-scene-headless): what `look` returns and how to read it.
- [How to vibe code a game](/guides/how-to-vibe-code-a-game): the build loop a tester's report feeds back into.
- [Unit test a three.js app in a real browser](/guides/unit-test-threejs-app): checks for a game's rules, and what `expect` takes.
- [How to make levels in a game](/guides/make-levels-in-a-game): levels as data, as the maze here keeps them.
- [How to make a game feel good](/guides/make-a-game-feel-good): what `feel` measures for hits and pickups.
