---
title: How to make a tower defense game in three.js: a path, towers and waves
phrase: how to make a tower defense game
description: How to make a tower defense game in the browser as a beginner: a road written as a list of corner points that the enemies walk, towers you click onto the grass that pick a target in range and fire homing shots, coins from each enemy to pay for the next tower, and three waves started with Space, in one three.js file, with an AI agent placing towers, playing each wave and comparing two ways to choose a target.
meta: How to make a tower defense game in three.js: a road of waypoints, towers that pick a target in range, coins, and waves to stop.
intent: make-a-tower-defense-game
queries:
  - "how to make a tower defense game"
  - "how to make a game like plants vs zombies"
  - "2D tower defense - A bullet to an enemy"
  - "Dynamic pathing algorithm for tower defense game"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a tower defense game in three.js: a path, towers and waves

In a tower defense game, enemies walk along a road toward your base, and you stop them by building towers beside the road. Each tower shoots whatever comes within its reach; each enemy it stops pays you coins; coins buy more towers before the next, larger wave. You never control a character. The game is where you put the towers. Plants vs Zombies is the same idea with five straight lanes instead of one winding road.

A first one has four parts: the road, the enemies that walk it, the towers that choose a target and fire, and the coins. This page builds each one into a small game, beetles crawling toward a blue base, that you can paste into one HTML file and play.

## The road is a list of corner points

The enemies do not have to work out where to go. The road is written as its corner points, in order, from where the enemies come in to the base:

```js
const PATH = [[-9, -3], [-4, -3], [-4, 3], [1, 3], [1, -2], [5, -2], [5, 3], [9, 3]];
```

These are called waypoints. Each beetle remembers which point it is walking to; every frame (each picture the browser draws) it takes a step toward that point, and when it gets there it turns to the next one. After the last point it has reached the base, and you lose a life. To draw a new road, change the list. The game also lays one square of road tile on every whole-number point along it, which is how it knows where towers may not go.

Some tower defense games let enemies find their own way, so that towers placed in the open force them into a longer route. That needs a path search, which [how to make an enemy follow the player](/guides/make-an-enemy-follow-the-player) explains on a grid; a fixed road is the place to start.

## Towers: reach, a target, and a shot

Each frame, every tower looks at every beetle and keeps those within its reach, `RANGE` metres (the faint ring around each tower shows it). Of those, it has to choose one, and the rule it uses changes how well a set of towers works:

- **nearest**: the beetle closest to the tower. It is easy to write, and its shots have the least distance to fly.
- **first**: the beetle furthest along the road, the one closest to your base. It is a common default in tower defense games, since it is the beetle about to cost you a life.

The game has both, in the `targeting` line near the top. The tower turns its barrel toward its target and, when it has reloaded, fires a shot. The shot is homing: every frame it flies toward where its beetle is now, so it cannot miss a moving target, which is the answer to the question "2D tower defense - A bullet to an enemy" asks. A beetle takes three hits.

## Coins and building

You start with 100 coins and a tower costs 50. Clicking the grass sends a ray from the camera through the pointer to the ground, as three.js's `Raycaster` does, and rounds the point to the nearest whole square; if that square is not road, not taken and you can pay, a tower appears. Each beetle stopped is worth 10 coins, so a wave you hold pays for the towers you need for the next one.

## Waves

There are three, written as a list of how many beetles come and the seconds between two of them. Nothing moves until you press Space, so you build first and then start the wave; when the last beetle of a wave is gone, you build again. The third wave is 50 beetles. [How to make a zombie game](/guides/make-a-zombie-game) goes further into lists of waves and how to tune them.

## The beetle game

Click the grass to build, press Space to start a wave, and stop all three. The import map line near the top tells the browser where three.js is (a `node_modules/three` folder next to the file, which `npm install three` makes), and [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains the other parts of such a page.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Beetle path</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}#hud{position:fixed;top:16px;left:20px;font:600 22px system-ui;color:#fff}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The road the beetles walk: corner points, in order, from where they enter to the base they attack.
const PATH = [[-9, -3], [-4, -3], [-4, 3], [1, 3], [1, -2], [5, -2], [5, 3], [9, 3]];
const WAVES = [{ count: 10, gap: 0.8 }, { count: 20, gap: 0.5 }, { count: 50, gap: 0.25 }];
const TOWER_COST = 50, RANGE = 3, RELOAD = 0.5, BEETLE_SPEED = 1.6, BEETLE_HP = 3;
let targeting = 'nearest'; // or 'first': the beetle furthest along the road, closest to the base

function act({ key, down = true }) {
  if (down && key === 'Space' && phase === 'build' && !over) startWave();
  if (down && key === 'KeyR' && over) reset();
}
addEventListener('keydown', e => act({ key: e.code }));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x203040);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 15, 9);
camera.lookAt(0, 0, 0.5);
scene.add(new THREE.HemisphereLight(0xffffff, 0x405030, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.8);
sun.position.set(4, 10, 5);
scene.add(sun);

const grass = new THREE.Mesh(new THREE.PlaneGeometry(20, 12).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5a8a3c }));
grass.name = 'grass';
scene.add(grass);
// One square of road for every whole-number point along the path, so no two pieces overlap.
const roadSquares = new Set();
for (let i = 0; i < PATH.length - 1; i++) {
  const [ax, az] = PATH[i], [bx, bz] = PATH[i + 1], n = Math.abs(bx - ax) + Math.abs(bz - az);
  for (let k = 0; k <= n; k++) roadSquares.add(`${ax + Math.sign(bx - ax) * k},${az + Math.sign(bz - az) * k}`);
}
const roadGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), roadMaterial = new THREE.MeshStandardMaterial({ color: 0xc8a870 });
for (const square of roadSquares) {
  const [x, z] = square.split(',').map(Number);
  const road = new THREE.Mesh(roadGeometry, roadMaterial);
  road.name = 'road';
  road.position.set(x, 0.02, z);
  scene.add(road);
}
const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.4), new THREE.MeshStandardMaterial({ color: 0x8090ff }));
base.name = 'base';
base.position.set(9, 0.6, 3);
scene.add(base);

const beetleGeometry = new THREE.SphereGeometry(0.3, 14, 10).scale(1, 0.6, 1.3), beetleMaterial = new THREE.MeshStandardMaterial({ color: 0x902030 });
const towerGeometry = new THREE.CylinderGeometry(0.35, 0.45, 0.9, 12), towerMaterial = new THREE.MeshStandardMaterial({ color: 0xe0e0e0 });
const barrelGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.7).translate(0, 0, 0.35), barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x303030 });
const shotGeometry = new THREE.SphereGeometry(0.09, 8, 6), shotMaterial = new THREE.MeshBasicMaterial({ color: 0xfff080 });
const ringGeometry = new THREE.RingGeometry(RANGE - 0.05, RANGE, 48).rotateX(-Math.PI / 2), ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
const hud = document.getElementById('hud');

let wave, phase, coins, lives, kills, leaked, spawned, spawnIn, over, won;
let beetles = [], towers = [], shots = [];

function reset() {
  for (const o of [...beetles, ...towers, ...shots]) scene.remove(o);
  beetles = []; towers = []; shots = [];
  wave = 1; phase = 'build'; coins = 100; lives = 10; kills = 0; leaked = 0; over = won = false;
}

function startWave() { phase = 'wave'; spawned = 0; spawnIn = 0; }

// A tower goes on the whole-number square nearest the click, if it is grass, free and paid for.
function placeTower(x, z) {
  x = Math.round(x); z = Math.round(z);
  if (coins < TOWER_COST || roadSquares.has(`${x},${z}`) || towers.some(t => t.position.x === x && t.position.z === z)) return false;
  const tower = new THREE.Mesh(towerGeometry, towerMaterial);
  tower.name = 'tower';
  tower.position.set(x, 0.45, z);
  const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
  barrel.position.y = 0.35;
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.y = -0.4;
  tower.add(barrel, ring);
  tower.userData = { reload: 0, barrel };
  scene.add(tower);
  towers.push(tower);
  coins -= TOWER_COST;
  return true;
}

// A click on the grass places a tower there: a ray from the camera through the pointer, to the ground.
const raycaster = new THREE.Raycaster(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
addEventListener('click', e => {
  raycaster.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  if (!over && raycaster.ray.intersectPlane(groundPlane, hit)) placeTower(hit.x, hit.z);
});

function spawnBeetle() {
  const b = new THREE.Mesh(beetleGeometry, beetleMaterial);
  b.name = 'beetle';
  b.position.set(PATH[0][0], 0.2, PATH[0][1]);
  b.userData = { next: 1, hp: BEETLE_HP, travelled: 0 };
  scene.add(b);
  beetles.push(b);
}

function step(dt) {
  if (over || won) return;
  if (phase === 'wave') {
    const w = WAVES[wave - 1];
    spawnIn -= dt;
    if (spawned < w.count && spawnIn <= 0) { spawnBeetle(); spawned++; spawnIn = w.gap; }
    if (spawned === w.count && beetles.length === 0) {
      if (wave === WAVES.length) won = true; else { wave++; phase = 'build'; }
    }
  }

  // each beetle walks toward its next corner point; past the last one it reaches the base
  for (const b of beetles) {
    const [tx, tz] = PATH[b.userData.next];
    const to = new THREE.Vector3(tx - b.position.x, 0, tz - b.position.z), d = to.length(), move = BEETLE_SPEED * dt;
    b.rotation.y = Math.atan2(to.x, to.z);
    b.userData.travelled += Math.min(move, d);
    if (d > move) { b.position.addScaledVector(to.normalize(), move); continue; }
    b.position.set(tx, 0.2, tz);
    if (++b.userData.next === PATH.length) { b.userData.gone = true; lives--; leaked++; }
  }

  // each tower picks a beetle in range (by the targeting rule), turns to it and fires when reloaded
  for (const t of towers) {
    t.userData.reload -= dt;
    let target = null;
    for (const b of beetles) {
      const d = b.position.distanceTo(t.position), score = targeting === 'first' ? -b.userData.travelled : d;
      if (!b.userData.gone && d <= RANGE && (!target || score < target.score)) target = { b, score };
    }
    if (!target) continue;
    t.userData.barrel.rotation.y = Math.atan2(target.b.position.x - t.position.x, target.b.position.z - t.position.z);
    if (t.userData.reload <= 0) {
      t.userData.reload = RELOAD;
      const s = new THREE.Mesh(shotGeometry, shotMaterial);
      s.name = 'shot';
      s.position.set(t.position.x, 0.8, t.position.z);
      s.userData.target = target.b;
      scene.add(s);
      shots.push(s);
    }
  }

  // a shot flies at its beetle wherever it goes, and hits it when close
  for (const s of shots) {
    const b = s.userData.target;
    if (b.userData.gone) { s.userData.gone = true; continue; }
    const to = b.position.clone().sub(s.position), move = 12 * dt;
    if (to.length() > move) { s.position.addScaledVector(to.normalize(), move); continue; }
    s.userData.gone = true;
    if (--b.userData.hp === 0) { b.userData.gone = true; kills++; coins += 10; }
  }
  for (const o of [...beetles, ...shots]) if (o.userData.gone) scene.remove(o);
  beetles = beetles.filter(b => !b.userData.gone);
  shots = shots.filter(s => !s.userData.gone);
  if (lives <= 0) over = true;
}

function drawHud() {
  const status = over ? 'The base fell. Press R' : won ? 'Every wave stopped!' : phase === 'build' ? 'Click the grass to build (50), Space to start' : `${WAVES[wave - 1].count - spawned + beetles.length} beetles left`;
  hud.textContent = `Wave ${wave} of ${WAVES.length}  ·  Coins ${coins}  ·  Lives ${lives}  ·  ${status}`;
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
  drawHud();
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'beetle path', units: 'metres', keys: { Space: 'start the next wave', KeyR: 'restart after losing' }, mouse: 'click the grass to build a tower' }),
  observe: () => ({ wave, phase, targeting, coins, lives, alive: beetles.length, spawned, kills, leaked, towers: towers.length, over, won }),
  act,
  // { wave, coins, towers: [[x, z], ...], targeting } sets up a test without clicking
  setState: (s) => {
    reset();
    if (s.wave) wave = s.wave;
    targeting = s.targeting ?? 'nearest';
    if (s.coins !== undefined) coins = s.coins;
    for (const [x, z] of s.towers ?? []) { coins += TOWER_COST; placeTower(x, z); }
  },
  path: PATH,
  subject: base,
};
</script>
</body></html>
```

The numbers that decide how the game plays are all at the top: `PATH`, `WAVES`, and `TOWER_COST`, `RANGE`, `RELOAD`, `BEETLE_SPEED` and `BEETLE_HP`. `step` does the rest in four passes each frame: let out beetles, walk them, let towers choose and fire, fly the shots.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes and edits your project's files) can write this from a short description. Ask for the numbers as named values at the top, so you can balance the game without reading the rest:

```text
Make a tower defense game in one HTML file with three.js, seen from above at an angle.
Enemies walk a winding road given as a list of corner points and cost a life when they
reach the base at its end. I click the grass to build a tower for 50 coins (never on the
road); each tower shoots homing shots at the nearest enemy within its range, and each
enemy stopped gives 10 coins. Three waves, started with Space. Put the road, the waves
and every cost, range and speed at the top of the file.
```

## Let the agent build and play

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs the game in a hidden Chrome browser so the agent can see and play what it wrote. To click on the grass it first has to know where the grass is: `look` with `at` says what is drawn at points of the picture, and where in the world they are.

```text
look {"at":[[640,300],[500,450]]}

At (640, 300): grass 18.4 m at [0.01, 0, -1.67]; background beyond.
At (500, 450): grass 16.9 m at [-2.42, 0, 1.51]; background beyond.
```

`interact` plays mouse and key steps on exact frames, and `expect` checks the game's state after them:

```text
interact {"steps":[{"mouse":"click","x":640,"y":300},{"mouse":"click","x":500,"y":450}],"expect":{"towers":2,"coins":0}}

{"changed":{"coins":0,"towers":2}}
mouse click at (640, 300): over grass (Mesh, 18.4 units)
Expect: towers 2 ✓ · coins 0 ✓
```

Two towers, and the coins are spent. An `until` step then plays on until the state matches, here until the game is back to building after wave 1:

```text
interact {"steps":[{"key":"Space"},{"until":{"phase":"build"},"max":2000}],"trace":["leaked"]}

{"changed":{"wave":2,"coins":100,"spawned":10,"kills":10}}
until: phase == "build" held at frame 1040
Trace (the first 600 frames):
leaked: 0 throughout the 600 frames
```

Wave 1 is over at frame 1040: ten beetles stopped, none leaked, 100 coins earned. Does it matter which beetle a tower chooses? The third wave of 50 against the same three towers, once with each rule:

```text
interact {"steps":[{"state":{"wave":3,"towers":[[0,-2],[-3,0],[3,0]],"targeting":"nearest"}},{"key":"Space"},{"until":{"over":true},"max":3000}]}

{"changed":{"wave":3,"phase":"wave","coins":390,"lives":0,"alive":11,"spawned":50,"kills":29,"leaked":10,"towers":3,"over":true}}
until: over == true held at frame 1637

interact {"steps":[{"state":{"wave":3,"towers":[[0,-2],[-3,0],[3,0]],"targeting":"first"}},{"key":"Space"},{"until":{"over":true},"max":3000}]}

{"changed":{"targeting":"first","coins":260,"alive":24,"kills":16}}
until: over == true held at frame 1653
```

The base falls either way, but the towers choosing the nearest beetle stop 29 before it does, and the towers choosing the first stop 16. One likely reason: the leader is often at the far edge of a tower's ring, about to leave it, so shots chase it while closer beetles walk past. With the towers in other places the result could turn around, which is why it is worth measuring rather than guessing. With six towers, which the coins from the first two waves pay for:

```text
interact {"steps":[{"state":{"wave":3,"towers":[[-3,-2],[0,2],[2,-1],[4,-1],[6,2],[-3,2]]}},{"key":"Space"},{"until":{"won":true},"max":3000}],"trace":["alive","leaked"]}

{"changed":{"targeting":"nearest","coins":600,"lives":10,"alive":0,"kills":50,"leaked":0,"towers":6,"over":false,"won":true}}
until: won == true held at frame 1624
Trace (the first 600 frames):
alive: 0 → 33 at frame 593; first changed at frame 1
leaked: 0 throughout the 600 frames
```

All 50 stopped and nothing leaked. Then `observe`, which reads the game's state and the renderer's counts without playing, partway through the same wave:

```text
interact {"steps":[{"state":{"wave":3,"towers":[[-3,-2],[0,2],[2,-1],[4,-1],[6,2],[-3,2]]}},{"key":"Space"},{"wait":575}]}

{"changed":{"coins":140,"alive":32,"spawned":36,"kills":4,"won":false}}

observe {}

{"wave":3,"phase":"wave","targeting":"nearest","coins":140,"lives":10,"alive":32,"spawned":36,"kills":4,"leaked":0,"towers":6,"over":false,"won":false,"harness":{"frame":6537,"renderer":{"calls":88,"triangles":9164,"textures":1,"geometries":8,"programs":3},"scene":{"objects":90,"meshes":88,"lights":2,"cameras":0},"errors":[],"changed":null}}
```

32 beetles on screen and 88 draw calls in the frame: every beetle, every road tile and every tower part is drawn on its own. That is fine at this size; for a wave of hundreds, draw the beetles and the road as instanced meshes, which [three.js too many meshes](/guides/threejs-too-many-meshes-merge-or-instance) explains. On this page's first draft the road was seven long boxes that overlapped at every corner, and `look`'s first reply flagged it:

```text
Surfaces: two meshes named "road" share a face plane (y = 0.06) over 1 × 1 units: they flicker as the camera moves (z-fighting).
```

That is why the game lays one tile per square. These replies were captured on 2026-10-30 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not balance the game for you or know whether it is fun; it tells you whether a given set of towers holds a given wave, which the agent can check after every change to the numbers. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Without paprika3d

Add a key that makes the game run three times as fast while you test, so a wave takes seconds to play. Ask the agent to print one line to the browser console (the panel of messages a page writes, opened with F12) when each wave ends: beetles stopped, beetles leaked, coins. Keep the range rings visible until the balance feels right.

## Next steps

- Lose and try again: [how to add a game over screen](/guides/add-a-game-over-screen).
- A new road on every level: [how to make levels in a game](/guides/make-levels-in-a-game).
- A shot that lands with a flash and a sound: [how to make a game feel good](/guides/make-a-game-feel-good).
- Units you select and send yourself: [how to make a strategy game](/guides/make-a-strategy-game).
