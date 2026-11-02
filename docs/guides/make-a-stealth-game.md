---
title: How to make a stealth game in three.js: a guard's view cone and hiding
phrase: how to make a stealth game
description: How to make a stealth game as a beginner: the three checks that decide whether a guard sees the player (close enough, inside its view angle, and no wall or crate on the line between them), a view cone drawn on the floor, a patrol, an alert meter that turns into a chase, and crates to hide behind, in one three.js file, with an AI agent checking that hiding works, catching a first-frame bug in the sight check, and timing a route past the guard.
meta: How to make a stealth game in three.js: a guard's view cone, a sight line that crates block, an alert meter, and a patrol to sneak past.
intent: make-a-stealth-game
queries:
  - "how to make a stealth game"
  - "how to make a hide and seek game"
  - "Vision Cone for Enemy AI in Unity 2d"
  - "top down game - checking, drawing enemy's line of sight area with obstacles"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a stealth game in three.js: a guard's view cone and hiding

In a stealth game you win by not being seen. Everything rests on one rule, the answer to "can the guard see me right now?", checked on every frame (each picture the game draws). The guard sees the player when three things are all true: the player is **close enough**, the player is **inside the guard's view angle**, and **nothing blocks the line** between the guard's eyes and the player. Add a guard who walks a route, something to hide behind, and a goal on the far side, and you have a stealth game. A hide-and-seek game uses the same rule, with the computer hiding or seeking.

This page builds a small one, sneaking past a guard to a golden vault, as one HTML file with three.js, a JavaScript library that draws 3D in a web page.

## The three checks

1. **Distance.** Measure from the guard to the player; beyond `VIEW_DISTANCE` (6 metres here) the guard sees nothing.
2. **Angle.** Take the direction the guard faces and the direction from the guard to the player. The angle between those two arrows must be smaller than `VIEW_ANGLE`, 35 degrees to each side. This is the view cone: a slice of a circle in front of the guard.
3. **Line of sight.** Cast a ray, an invisible straight line, from the guard's eyes toward the player, and ask whether it hits a wall or a crate before it reaches the player. three.js's `Raycaster` does this: given the line's start, its direction and its length, `intersectObjects` lists what it crosses. An empty list means a clear view.

The game's `canSee` function is these three checks in order, cheapest first, and returns false at the first that fails. The first two alone, which many first attempts stop at, let a guard see through walls.

## The cone you draw and the one that counts

Players need to see where a guard is looking, so the game draws the view cone on the floor: a flat, see-through slice of a circle, as long as `VIEW_DISTANCE` and twice `VIEW_ANGLE` wide, that turns with the guard. That drawing is a hint for the player and nothing more. It passes straight through crates, while the sight line stops at them, so the player can stand inside the drawn cone, hidden behind a crate, and not be seen. Drawing a cone that is cut off by every obstacle is possible, and asked about on game development forums as "drawing enemy's line of sight area with obstacles", but it is a separate job; the game works without it.

## A patrol, an alert meter and a chase

The guard walks between the points in `PATROL` and back, facing where it walks, the same way the enemies follow their road in [how to make a tower defense game](/guides/make-a-tower-defense-game). Being seen does not end the game at once: an alert meter fills while the guard sees the player, in half a second, and drains slowly when it does not, so a glimpse at the edge of the cone is forgiven. When the meter is full, the cone turns red and the guard runs straight at the player. A chase around walls needs a path search, as in [how to make an enemy follow the player](/guides/make-an-enemy-follow-the-player).

## Sneak to the vault

Move with the arrow keys from the bottom-left corner to the vault at the top right without filling the guard's alert meter. R starts again. The import map line near the top tells the browser where three.js is (a `node_modules/three` folder next to the file, which `npm install three` makes), and [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains the other parts of such a page.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>The vault</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}#hud{position:fixed;top:16px;left:20px;font:600 22px system-ui;color:#fff}</style></head>
<body>
<div id="hud">Reach the vault without being seen</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const VIEW_DISTANCE = 6;                          // metres the guard can see
const VIEW_ANGLE = THREE.MathUtils.degToRad(35);  // to each side of where it faces
const PATROL = [[-5, 0], [5, 0]];   // the guard walks from point to point, then back to the first
const CRATES = [[-3, 2], [2, 2], [-1, -1.5], [3.5, -1.5], [6.5, 1.5]];

const held = new Set();
function act({ key, down = true }) {
  if (down) held.add(key); else held.delete(key);
  if (down && key === 'KeyR' && (caught || won)) reset();
}
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14161e);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 17, 10);
camera.lookAt(0, 0, 0.3);
scene.add(new THREE.HemisphereLight(0xc0c8ff, 0x302820, 1.8));
const lamp = new THREE.DirectionalLight(0xffffff, 1.4);
lamp.position.set(-3, 10, 4);
scene.add(lamp);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 12).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x4a4e5a }));
floor.name = 'floor';
scene.add(floor);
// Walls and crates block the guard's view; they are the list the sight line is tested against.
const blockers = [];
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2e3a });
for (const [x, z, w, d] of [[0, -6, 16, 0.3], [0, 6, 16, 0.3], [-8, 0, 0.3, 12], [8, 0, 0.3, 12]]) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 1.5, d), wallMaterial);
  wall.name = 'wall';
  wall.position.set(x, 0.75, z);
  scene.add(wall);
  blockers.push(wall);
}
const crateGeometry = new THREE.BoxGeometry(1.2, 1.3, 1.2), crateMaterial = new THREE.MeshStandardMaterial({ color: 0x9a6a3a });
for (const [x, z] of CRATES) {
  const crate = new THREE.Mesh(crateGeometry, crateMaterial);
  crate.name = 'crate';
  crate.position.set(x, 0.65, z);
  scene.add(crate);
  blockers.push(crate);
}
const vault = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 1), new THREE.MeshStandardMaterial({ color: 0xffd040, emissive: 0x403000 }));
vault.name = 'vault';
vault.position.set(7, 0.6, -5);
scene.add(vault);
scene.updateMatrixWorld(); // the sight line's raycast reads each crate's place, which three.js otherwise works out at the first draw

const player = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 16), new THREE.MeshStandardMaterial({ color: 0x40c0ff }));
player.name = 'player';
scene.add(player);
const guard = new THREE.Group();
guard.name = 'guard';
const guardBody = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 16), new THREE.MeshStandardMaterial({ color: 0xd04040 }));
guardBody.position.y = 0.7;
// The view cone drawn on the floor: a slice of a circle, VIEW_DISTANCE long and twice VIEW_ANGLE wide, pointing ahead.
const cone = new THREE.Mesh(
  new THREE.CircleGeometry(VIEW_DISTANCE, 32, -VIEW_ANGLE, VIEW_ANGLE * 2).rotateX(-Math.PI / 2).rotateY(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.25, depthWrite: false }));
cone.name = 'view cone';
cone.position.y = 0.02;
guard.add(guardBody, cone);
scene.add(guard);
const hud = document.getElementById('hud');

let next, seen, alert, chasing, caught, won, still;
function reset() {
  player.position.set(-7, 0.45, 5);
  guard.position.set(PATROL[0][0], 0, PATROL[0][1]);
  next = 1; seen = false; alert = 0; chasing = caught = won = still = false;
  cone.material.color.set(0xfff2a0);
}

// The guard sees the player when all three hold: close enough, inside the angle, and nothing in between.
const raycaster = new THREE.Raycaster();
function canSee() {
  const eye = guard.position.clone().setY(1), target = player.position.clone().setY(1);
  const toPlayer = target.clone().sub(eye), distance = toPlayer.length();
  if (distance > VIEW_DISTANCE) return false;
  const facing = new THREE.Vector3(Math.sin(guard.rotation.y), 0, Math.cos(guard.rotation.y));
  if (facing.angleTo(toPlayer) > VIEW_ANGLE) return false;
  raycaster.set(eye, toPlayer.normalize());
  raycaster.far = distance;
  return raycaster.intersectObjects(blockers).length === 0;   // a wall or crate on the line hides the player
}

function moveToward(object, x, z, speed, dt) {
  const dx = x - object.position.x, dz = z - object.position.z, d = Math.hypot(dx, dz);
  if (d > 0.01) object.rotation.y = Math.atan2(dx, dz);
  const move = Math.min(d, speed * dt);
  if (d > 0) { object.position.x += dx / d * move; object.position.z += dz / d * move; }
  return d <= speed * dt;
}

const free = (x, z) => Math.abs(x) < 7.6 && Math.abs(z) < 5.6 && !CRATES.some(([cx, cz]) => Math.abs(x - cx) < 0.9 && Math.abs(z - cz) < 0.9);

function step(dt) {
  if (caught || won) return;
  const mx = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0), mz = (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0);
  const len = Math.hypot(mx, mz) || 1, nx = player.position.x + mx / len * 2.5 * dt, nz = player.position.z + mz / len * 2.5 * dt;
  if (free(nx, player.position.z)) player.position.x = nx;
  if (free(player.position.x, nz)) player.position.z = nz;

  if (chasing) moveToward(guard, player.position.x, player.position.z, 3.2, dt);
  else if (!still && moveToward(guard, ...PATROL[next], 1.6, dt)) next = (next + 1) % PATROL.length;

  // Being seen fills the alert meter in half a second; out of sight it drains. Full means a chase.
  seen = canSee();
  alert = THREE.MathUtils.clamp(alert + (seen ? 2 : -0.5) * dt, 0, 1);
  if (alert === 1 && !chasing) { chasing = true; cone.material.color.set(0xff3030); }
  if (guard.position.distanceTo(player.position) < 0.8) caught = true;
  if (player.position.distanceTo(vault.position) < 1.1) won = true;
  hud.textContent = caught ? 'Caught! Press R' : won ? 'You reached the vault! Press R' : chasing ? 'Spotted! Run!' : seen ? 'The guard is looking...' : 'Reach the vault without being seen';
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
reset();
let last = null;
renderer.setAnimationLoop((now) => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  renderer.render(scene, camera);
});

const round = (v) => +v.toFixed(2);
window.__game = {
  describe: () => ({ name: 'the vault', units: 'metres', keys: { ArrowRight: 'move right', ArrowLeft: 'move left', ArrowUp: 'move up', ArrowDown: 'move down', KeyR: 'restart after the end' } }),
  observe: () => ({ seen, alert: round(alert), chasing, caught, won,
    player: { x: round(player.position.x), z: round(player.position.z) }, guard: { x: round(guard.position.x), z: round(guard.position.z) } }),
  act,
  // { player: [x, z], guard: [x, z], lookAt: [x, z] } puts both somewhere for a test; a guard given a lookAt stands still
  setState: (s) => {
    reset();
    if (s.player) player.position.set(s.player[0], 0.45, s.player[1]);
    if (s.guard) guard.position.set(s.guard[0], 0, s.guard[1]);
    if (s.lookAt) { guard.rotation.y = Math.atan2(s.lookAt[0] - guard.position.x, s.lookAt[1] - guard.position.z); still = true; }
  },
  subject: player,
};
</script>
</body></html>
```

The rules a designer tunes are at the top: how far and how wide the guard sees, its route and where the crates stand. `step` moves the player, moves the guard along its route (or after the player), runs `canSee`, and fills or drains the alert meter.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes and edits your project's files) can build this from the three checks. Name them, or it may write a guard that sees through crates:

```text
Make a top-down stealth game in one HTML file with three.js. A guard walks back and
forth between two points. It sees me only if I am within 6 metres, within 35 degrees
of where it faces, and no wall or crate is on the line between its eyes and me (use a
Raycaster against the walls and crates). Draw its view cone on the floor. While it sees
me, an alert meter fills in half a second; when it is full, the guard chases me.
I win by reaching the vault in the far corner. Put crates I can hide behind.
```

## Let the agent sneak past

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs the game in a hidden Chrome browser so the agent can see and play what it wrote. `interact` plays steps on exact frames: a `{ state }` step sets the game up, here the guard standing at a point looking east with a crate between it and the player, and `expect` checks that the player stays hidden. `trace` reads a value on every frame:

```text
interact {"steps":[{"state":{"guard":[-1,2],"lookAt":[5,2],"player":[3.5,2]}},{"wait":30}],"trace":["seen"],"expect":{"seen":false,"chasing":false}}

{"changed":{"player":{"x":3.5,"z":2},"guard":{"x":-1,"z":2}}}
seen: false throughout the 30 frames
Expect: seen false ✓ · chasing false ✓
```

That is the fixed game. On this page's first draft, the same call passed its `expect` too, but its trace began:

```text
interact {"steps":[{"state":{"guard":[-1,2],"lookAt":[5,2],"player":[3.5,2]}},{"wait":30}],"trace":["seen"],"expect":{"seen":false,"chasing":false}}

…
seen: true until frame 1, then false
```

On the first frame, the guard saw the player through the crate. A ray test reads each object's place in the world, and three.js works those places out when it first draws the scene; the check ran before the first draw, when every crate still counted as sitting at the centre of the room. One line, `scene.updateMatrixWorld()` after the room is built, fixed it. In play it costs one frame of a rising alert meter, too small for anyone to notice by hand, and it shows that the sight check and the picture can disagree.

`look` with `at` names what is drawn at points of the picture, front to back. Between the guard and the crate, on the crate, and on the player:

```text
look {"at":[[680,455],[748,440],[829,450]]}

At (680, 455): view cone 19 m at [0.79, 0.02, 1.56]; behind it floor 19 m; background beyond.
At (748, 440): crate 17.8 m at [1.98, 1.3, 1.89]; behind it view cone 19.2 m; then floor 19.3 m; background beyond.
At (829, 450): player 18.4 m at [3.53, 0.9, 1.9]; behind it view cone 19.4 m; then floor 19.4 m; background beyond.
```

The drawn cone lies under the crate and under the player: by the picture, the player is in the cone, and yet hidden, which is the point of the sight line. Step out from behind the crate, 1.4 metres to the side:

```text
interact {"steps":[{"state":{"guard":[-1,2],"lookAt":[5,2],"player":[3.5,3.4]}},{"wait":30}],"trace":["seen","alert","chasing"]}

{"changed":{"seen":true,"alert":1,"chasing":true,"player":{"z":3.4}}}
seen: true throughout the 30 frames
alert: 0.03 → 1 at frame 29; first changed at frame 1
chasing: false until frame 30, then true
```

Seen on every frame, the meter full at frame 29, the chase on the next. Last, a whole route from the start to the vault, played twice, once leaving at once and once after waiting 180 frames (3 seconds) in the corner:

```text
interact {"steps":[{"state":{}},{"key":"ArrowRight","frames":168},{"key":"ArrowUp","frames":240},{"key":"ArrowRight","frames":180}],"trace":["seen","won"]}

{"changed":{"seen":false,"alert":0,"chasing":false,"won":true,"player":{"x":5.92,"z":-5},"guard":{"x":0.33,"z":0}}}
Motion (player): travelled 22.9 units (16.3 from start to end), it stopped at frame 550 and did not move again.
seen: false throughout the 588 frames
won: false until frame 550, then true

interact {"steps":[{"state":{}},{"wait":180},{"key":"ArrowRight","frames":168},{"key":"ArrowUp","frames":240},{"key":"ArrowRight","frames":180}],"trace":["seen","chasing","caught"]}

{"changed":{"seen":true,"alert":1,"chasing":true,"caught":true,"won":false,"player":{"x":0,"z":-1.75},"guard":{"x":0.23,"z":-1.14}}}
Motion (player): travelled 13.8 units (9.72 from start to end), its direction of travel turned 90° left; it stopped at frame 510 and did not move again.
Trace (the first 600 frames):
seen: false until frame 416, then true
chasing: false until frame 445, then true
caught: false until frame 510, then true
```

Leaving at once, the guard walks away from the player the whole time and the vault is reached at frame 550. Waiting three seconds puts the player in the middle of the room just as the guard walks back: seen at frame 416, chased at 445, caught at 510. Timing a patrol is the game, and a route that works today can fail after a change to the guard's speed; with an `expect` and `save`, a play like this one becomes a check that `test` reruns after every change. These replies were captured on 2026-10-30 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not design the level or tell you whether sneaking feels tense; it reports, frame by frame, what the guard saw. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Without paprika3d

Draw the sight line while you build: a thin line from the guard's eyes to the player, green when the view is blocked and red when it is clear. Watch it while you walk around each crate; any red line through a crate is a bug. Add a key that freezes the guard so you can test each hiding spot slowly.

## Next steps

- The reverse rule, something that moves while you are not looking at it: [how to make a horror game](/guides/make-a-horror-game).
- A screen for being caught, with a restart: [how to add a game over screen](/guides/add-a-game-over-screen).
- More rooms and guards, one level after another: [how to make levels in a game](/guides/make-levels-in-a-game).
- A ray is also how a first-person game decides what a shot hits: [how to make a fps game](/guides/make-a-fps-game).
