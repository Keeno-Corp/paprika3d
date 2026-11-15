---
title: OpenCode browser tools for a three.js game: an MCP entry and the skills
phrase: opencode browser
description: How to give OpenCode browser tools for a three.js game: paprika3d as a local MCP server with opencode mcp add or an entry under mcp.servers in opencode.json, the skills with npx skills add -a opencode, and what open, look and interact return on a small three.js foosball table, where a rod turned on exact frames kicks the ball and the reply gives its speed.
meta: OpenCode browser tools for a three.js game: paprika3d as a local MCP server in opencode.json, plus the skills, on a foosball table.
intent: opencode-browser
queries:
  - "opencode browser"
  - "opencode playwright mcp"
  - "opencode browser screenshot"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# OpenCode browser tools for a three.js game: an MCP entry and the skills

OpenCode gets browser tools from MCP servers, and for a three.js game the one to add is a server that runs the page and reads the scene inside its canvas. `opencode mcp add paprika -- npx -y paprika3d serve` adds paprika3d as a local MCP server: `open` loads the game in a headless Chrome, `look` returns a screenshot with the named objects on screen, and `interact` presses keys on exact frames and reports what changed. `npx skills add Keeno-Corp/paprika3d -a opencode` adds the skills that tell OpenCode when to call each one.

## Add paprika3d to OpenCode

OpenCode's MCP documentation ([opencode.ai/docs/mcp-servers](https://opencode.ai/docs/mcp-servers/)) adds a local server with one command. It writes the server into the project's configuration; `--global` makes it available in every project:

```bash
opencode mcp add paprika -- npx -y paprika3d serve
opencode mcp list
```

The same entry by hand goes in `opencode.json` (or `opencode.jsonc`) in the project, or in `~/.config/opencode/opencode.json` for every project. In the layout the docs give, servers sit under `mcp.servers`, and `command` is the program and its arguments as one array:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "paprika": {
        "type": "local",
        "command": ["npx", "-y", "paprika3d", "serve"]
      }
    }
  }
}
```

The docs call this V2 and say it no longer puts server names directly under `mcp`; the older layout, which Playwright MCP's README still shows for OpenCode, had `"mcp": { "playwright": { "type": "local", "command": [...], "enabled": true } }`. Servers connect by themselves; `disabled: true` keeps one configured without connecting it. In the terminal interface, `/mcps` shows the servers and connects or disconnects them.

Two more options from the same page. `timeout` takes milliseconds, and the defaults are half a minute to start a server and 12 hours for a tool call, which covers `open` starting Chrome. `codemode` is on by default and exposes a server's tools to the model through OpenCode's Code Mode; `"codemode": false` lists them to the model directly. This page did not compare the two.

paprika3d needs Google Chrome and Node 20.11 or later.

## The skills, and a standing instruction

OpenCode loads Agent Skills from `.opencode/skills`, `.claude/skills` and `.agents/skills` in the project, and from `~/.config/opencode/skills` for the user. The skills installer writes OpenCode's into the project's `.agents/skills/`:

```bash
npx skills add Keeno-Corp/paprika3d -a opencode
```

`/init` in OpenCode writes or updates the project's `AGENTS.md`, which OpenCode reads as standing instructions. One line there makes the check part of every change: "After changing the game, use the paprika tools to open it, look at it and play the part that changed."

OpenCode's docs list no browser tool of its own. Playwright MCP, added the same way, drives a page through its document; on a three.js game that document is one `<canvas>` element, and [a Playwright alternative for three.js](/guides/playwright-alternative-threejs-webgl) sets the two side by side.

This page did not run OpenCode itself. The replies below come from paprika3d's MCP server called directly with the calls an agent makes, which is what OpenCode receives; OpenCode's commands and files are as its documentation gives them on 2026-11-12.

## A foosball table

You play blue's rod of three men. The arrow keys slide it across the table, and holding Space turns it forward; a foot that sweeps through the ball kicks it towards red's goal at the speed of the foot's tip. Red's keeper slides after a ball shot at it. Each rod, man, goal and the ball have a `name`, and `window.__game` hands the tools the ball's place and speed, the rod's slide and turn, the keeper and the score.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Foosball</title>
<style>html,body{margin:0;overflow:hidden;background:#1d232b}canvas{display:block}
#hud{position:fixed;top:10px;left:0;right:0;text-align:center;font:600 20px system-ui;color:#fff;pointer-events:none}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// You play blue's three-man rod. Up and down slide it; hold Space to turn it forward, and a foot that sweeps
// through the ball kicks it towards red's goal at the foot's speed. Red's keeper slides after a ball shot at it.
const L = 4, HW = 2.5, GOAL = 0.8, BALL_R = 0.18;    // half length, half width, half goal mouth, ball radius
const ROD_X = 1, ROD_Y = 0.9, LEG = 0.75, SPACING = 1.2, SLIDE = 0.9, TURN = 12;   // TURN in radians per second
const KEEPER_X = 3.4, KEEPER_SPEED = 0.7;
let ball, rod, keeper, score;
const held = new Set();
function start() {
  ball = { x: 1.2, z: 0, vx: 0, vz: 0 };
  rod = { z: 0, angle: 0 };
  keeper = { z: 0 };
  score = { blue: 0, red: 0 };
}
const serve = () => { ball = { x: 0, z: 0, vx: 0, vz: 0 }; };

function step(dt) {
  rod.z = THREE.MathUtils.clamp(rod.z + ((held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0)) * 3 * dt, -SLIDE, SLIDE);
  const turning = held.has(' ');
  if (turning) rod.angle += TURN * dt;
  for (const k of [-1, 0, 1]) {   // each foot: where it is, and whether it sweeps through the ball
    const footX = ROD_X + LEG * Math.sin(rod.angle), low = Math.cos(rod.angle) > 0.8;
    if (turning && low && Math.abs(ball.z - (rod.z + k * SPACING)) < 0.3 && Math.abs(ball.x - footX) < 0.3)
      ball.vx = Math.max(ball.vx, TURN * LEG);   // the foot's speed at its tip
  }
  if (ball.vx > 0) keeper.z = THREE.MathUtils.clamp(keeper.z + THREE.MathUtils.clamp(ball.z - keeper.z, -KEEPER_SPEED * dt, KEEPER_SPEED * dt), -GOAL, GOAL);
  const slow = Math.max(0, 1 - 0.4 * dt);   // rolling friction
  ball.vx *= slow; ball.vz *= slow;
  ball.x += ball.vx * dt; ball.z += ball.vz * dt;
  if (Math.abs(ball.z) > HW - BALL_R) { ball.z = Math.sign(ball.z) * (HW - BALL_R); ball.vz = -ball.vz; }
  if (ball.vx > 0 && Math.abs(ball.x - KEEPER_X) < BALL_R + 0.12 && Math.abs(ball.z - keeper.z) < 0.35) { ball.vx = -0.6 * ball.vx; }   // saved
  if (Math.abs(ball.x) > L - BALL_R) {
    if (Math.abs(ball.z) < GOAL) { score[ball.x > 0 ? 'blue' : 'red']++; serve(); }
    else { ball.x = Math.sign(ball.x) * (L - BALL_R); ball.vx = -ball.vx; }
  }
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1d232b);
scene.fog = new THREE.Fog(0x1d232b, 10, 24);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 7.2, 6.2);
camera.lookAt(0, 0, 0.2);
scene.add(new THREE.HemisphereLight(0xffffff, 0x334433, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(2, 9, 4);
scene.add(sun);

const pitch = new THREE.Mesh(new THREE.BoxGeometry(2 * L, 0.1, 2 * HW), new THREE.MeshStandardMaterial({ color: 0x2f8a46, roughness: 0.9 }));
pitch.name = 'pitch';
pitch.position.y = -0.05;
scene.add(pitch);
const line = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, 2 * HW), new THREE.MeshStandardMaterial({ color: 0xffffff }));
line.name = 'halfway line';
line.position.y = 0.005;
scene.add(line);
const wood = new THREE.MeshStandardMaterial({ color: 0x6b4428, roughness: 0.7 });
for (const [x, z, w, d, name] of [[0, -HW - 0.15, 2 * L + 0.6, 0.3, 'side'], [0, HW + 0.15, 2 * L + 0.6, 0.3, 'side'],
  [-L - 0.15, -(HW + GOAL) / 2, 0.3, HW - GOAL, 'end'], [-L - 0.15, (HW + GOAL) / 2, 0.3, HW - GOAL, 'end'],
  [L + 0.15, -(HW + GOAL) / 2, 0.3, HW - GOAL, 'end'], [L + 0.15, (HW + GOAL) / 2, 0.3, HW - GOAL, 'end']]) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), wood);
  wall.name = `${name} wall`;
  wall.position.set(x, 0.25, z);
  scene.add(wall);
}
for (const [x, name] of [[-L - 0.35, 'blue goal'], [L + 0.35, 'red goal']]) {
  const goal = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 2 * GOAL), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  goal.name = name;
  goal.position.set(x, 0.25, 0);
  scene.add(goal);
}
const steel = new THREE.MeshStandardMaterial({ color: 0xc8ccd2, metalness: 0.3, roughness: 0.35 });
function makeRod(name, x, team, count) {
  const group = new THREE.Group();   // the rod turns about its own axis, along z
  group.name = name;
  group.position.set(x, ROD_Y, 0);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2 * HW + 1.2, 10), steel);
  bar.rotation.x = Math.PI / 2;
  group.add(bar);
  const kit = new THREE.MeshStandardMaterial({ color: team === 'blue' ? 0x2a5bd7 : 0xd23a2a });
  for (let k = 0; k < count; k++) {
    const man = new THREE.Group();
    man.name = count === 1 ? `${team} keeper` : `${team} ${k + 1}`;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, LEG - 0.1, 0.3), kit);
    body.position.y = -(LEG - 0.1) / 2 + 0.05;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), new THREE.MeshStandardMaterial({ color: 0xe8c4a0 }));
    head.position.y = 0.18;
    man.add(body, head);
    man.position.z = (k - (count - 1) / 2) * SPACING;
    group.add(man);
  }
  scene.add(group);
  return group;
}
const blueRod = makeRod('blue rod', ROD_X, 'blue', 3);
const redRod = makeRod('red rod', KEEPER_X, 'red', 1);
const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 24, 16), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4 }));
ballMesh.name = 'ball';
scene.add(ballMesh);
const hud = document.getElementById('hud');

const act = ({ key, down = true }) => { if (key === 'r') { if (down) start(); } else if (down) held.add(key); else held.delete(key); };
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.key }); });
addEventListener('keyup', e => act({ key: e.key, down: false }));
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
  blueRod.position.z = rod.z;
  blueRod.rotation.z = rod.angle;   // turning forward swings the feet towards +x
  redRod.position.z = keeper.z;
  ballMesh.position.set(ball.x, BALL_R, ball.z);
  hud.textContent = `Blue ${score.blue} : ${score.red} Red`;
  renderer.render(scene, camera);
});

const r2 = n => Math.round(n * 100) / 100;
window.__game = {
  describe: () => ({ name: 'foosball', units: 'table units; speed in units per second; rod angle in turns', keys: { ' ': 'hold to turn the blue rod forward', ArrowUp: 'slide the rod up the table', ArrowDown: 'slide it down', r: 'start again' } }),
  observe: () => ({ ball: { x: r2(ball.x), z: r2(ball.z), speed: r2(Math.hypot(ball.vx, ball.vz)) }, rod: { z: r2(rod.z), turns: r2(rod.angle / (2 * Math.PI)) }, keeper: { z: r2(keeper.z) }, score: { ...score } }),
  act,
  setState: s => {
    if (s.ball) ball = { ...ball, vx: 0, vz: 0, ...s.ball };   // a placed ball starts at rest
    if (s.rod) rod = { z: s.rod.z ?? rod.z, angle: s.rod.turns === undefined ? rod.angle : s.rod.turns * 2 * Math.PI };
    if (s.keeper) keeper = { ...keeper, ...s.keeper };
    if (s.score) score = { ...score, ...s.score };
  },
  subject: 'ball',
};
</script>
</body></html>
```

Save it as `index.html` beside a `node_modules` folder with three in it (`npm install three`).

## The calls, and what came back

Replies from paprika3d's MCP server on this page, captured on 2026-11-12 on a Linux machine with no graphics card, where Chrome draws WebGL in software. Paths are shortened to `<project>`, and long replies are cut to the lines discussed, with nothing reworded.

**1. Open and look.** `open` pauses the game at frame 0 and gives its `describe()`; `look` names what is on screen. The blue men share the line `blue *` (three men, a body and a head each), and red's keeper has its own:

```text
open {"url": "index.html", "cwd": "<project>"}

Opened http://127.0.0.1:36519/index.html in 0.1 s, paused at frame 0.
Page text outside the canvas: none
{"name":"foosball","units":"table units; speed in units per second; rod angle in turns","keys":{" ":"hold to turn the blue rod forward","ArrowUp":"slide the rod up the table","ArrowDown":"slide it down","r":"start again"}}

look {}

On screen (21):
pitch 33% [124, 205, 1155, 600] 8 × 5 units
side wall ×2 12% [28, 149, 1251, 669] 8.6 × 0.5 units, across the view
end wall ×4 4% [44, 167, 1235, 600] 1.7 × 0.5 units, along the view
blue goal 1% [89, 282, 207, 445] 1.6 × 0.5 units, along the view
red goal 1% [1072, 282, 1190, 445] 1.6 × 0.5 units, along the view
red rod 0.57% [964, 96, 1165, 654] 6.2 × 0.08 units, along the view
blue rod 0.44% [733, 96, 798, 654] 6.2 × 0.08 units, along the view
red keeper ×2 0.3% [1006, 285, 1062, 373]
halfway line 0.22% [637, 205, 642, 600] 5 × 0.05 units, along the view
blue * ×6 0.6% [732, 193, 785, 485]
ball 0.082% [754, 350, 793, 389]
Never visible: none
```

**2. Kick straight at the keeper.** Space held for 6 frames turns the rod; then 40 frames with no input. `trace` reads the ball's speed and place on every frame:

```text
interact {"steps": [{"key": " ", "frames": 6}, {"wait": 40}], "trace": ["ball.speed", "ball.x"]}

{"changed":{"ball":{"x":0.84,"speed":4.02},"rod":{"turns":0.19}}}
ball.speed: 0 → peak 8.94 at frame 1 → 4.02 at frame 46; first changed at frame 1
ball.x: 1.2 → peak 3.22 at frame 14 → 0.84 at frame 46; first changed at frame 1
```

The middle man's foot met the ball on the first frame of the turn and sent it off at 8.94 units a second, the foot's tip speed less one frame of rolling friction. It reached x 3.22 on frame 14, where the keeper stood, and came back.

**3. Turn with the ball out of reach.** A `state` step puts the ball between the middle man and the next one, and sets the rod and keeper back:

```text
interact {"steps": [{"state": {"ball": {"x": 1.2, "z": 0.6}, "rod": {"z": 0, "turns": 0}, "keeper": {"z": 0}}}, {"key": " ", "frames": 6}], "trace": ["rod.turns", "ball.speed"]}

{"changed":{"ball":{"x":1.2,"z":0.6,"speed":0}}}
rod.turns: 0 → 0.19 at frame 6; first changed at frame 1
ball.speed: 0 throughout the 6 frames
```

The rod turned the same 0.19 of a turn and the ball never moved: no foot passed through it.

**4. Slide, then kick, until a goal.** The same start, then ArrowDown for 12 frames to slide the rod 0.6 down the table so the middle man stands behind the ball, then the turn, then an `until` step that plays frames until blue scores, up to 120:

```text
interact {"steps": [{"state": {"ball": {"x": 1.2, "z": 0.6}, "rod": {"z": 0, "turns": 0}, "keeper": {"z": 0}}}, {"key": "ArrowDown", "frames": 12}, {"key": " ", "frames": 6}, {"until": {"score.blue": 1}, "max": 120}], "trace": ["ball.speed", "keeper.z", "rod.z"]}

{"changed":{"ball":{"x":0,"z":0},"rod":{"z":0.6},"keeper":{"z":0.22},"score":{"blue":1}}}
until: score.blue == 1 held at frame 31
ball.speed: 0 → peak 8.94 at frame 13 → 0 at frame 31; first changed at frame 13
keeper.z: 0 → 0.22 at frame 31; first changed at frame 13
rod.z: 0 → 0.6 at frame 12; first changed at frame 1
```

The rod reached 0.6 on frame 12, the kick came on frame 13 at the same 8.94, and the keeper, starting when the ball did, had slid 0.22 by the time the ball went in on frame 31. The ball was served back to the centre, as the rules say. Each frame is 1/60 s of game time on paprika3d's clock, so these frame numbers repeat on every run, and an agent can turn this play into a saved check.

## What paprika3d does not do

- **It is not a browser for every page.** It is made for three.js, React Three Fiber and WebGL pages; a page that is mostly HTML is a job for a DOM tool.
- **It does not use a browser you have open.** It runs its own headless Chrome.
- **It does not change OpenCode.** It adds tools OpenCode can call; Code Mode, permissions and agents stay OpenCode's.
- **Frame times here are not a GPU's.** With no graphics card Chrome draws in software, and `open` says so.
- **It does not decide the game is fun.** It reports the speed of the ball and who scored.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): keys on exact frames and checks that rerun, the same calls in any MCP client.
- [Screenshot a three.js scene headless](/guides/screenshot-threejs-scene-headless): the picture and the named objects on screen.
- [How to make a game with Codex](/guides/make-a-game-with-codex): the same server in another terminal agent.
- [How to make a soccer game in three.js](/guides/make-a-soccer-game): penalty kicks against a keeper, as a whole game.
- [three.js collision detection without a physics engine](/guides/threejs-collision-detection-without-physics-engine): the kind of hand-written rules the foot and the keeper use.
