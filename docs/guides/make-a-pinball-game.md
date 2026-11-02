---
title: How to make a pinball game in three.js: flippers and bumpers on a physics engine
phrase: how to make a pinball game
description: How to make a pinball game as a beginner: a small three.js table on the Rapier physics engine with two flippers on hinges driven by the arrow keys, three bumpers that kick the ball and score, a tilt made of gravity, a drain and three balls; why a fast ball can pass straight through a flipper and how continuous collision detection stops it; and how an AI agent with paprika3d presses a flipper on a chosen frame and reads the ball's speed.
meta: How to make a pinball game in three.js: flippers on hinges, bumpers that kick, and a fast ball that never slips through a flipper.
intent: make-a-pinball-game
queries:
  - "how to make a pinball game"
  - "how to make a pinball video game"
  - "2D Collision detection for Pinball Game"
  - "Pinball Problem: Curved Containment with Cannon?"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a pinball game in three.js: flippers and bumpers on a physics engine

A pinball game is a sloped table, a steel ball, two flippers you raise with a button each, things for the ball to hit, and a gap at the bottom (the drain) where you lose the ball. Everything interesting happens in collisions: the ball rolling down, glancing off a wall, getting struck by a flipper. That makes pinball a good fit for a **physics engine**, a library that works out how solid objects move and collide, so you describe the table and the engine does the bouncing.

This page builds a small pinball table in three.js (a free JavaScript library that draws 3D in a web page) on the Rapier physics engine, and explains the three parts that are particular to pinball: flippers, bumpers, and a fast ball that must never pass through a flipper. If you have not used a physics engine before, [how to make a physics game](/guides/make-a-physics-game) explains what one is, which ones work with three.js and how bodies, colliders and the fixed step fit together.

## The first request to type

An AI coding agent (an AI that writes and runs code in a folder on your computer, such as Claude Code, Cursor or Codex) can build this from a request like:

```text
Make a pinball game with three.js and the Rapier physics engine, in one index.html
file loading both from a CDN with an import map. Seen from above and behind. Two
flippers at the bottom on hinges: hold the left arrow for the left one and the right
arrow for the right one. Three round bumpers near the top that kick the ball away and
score 100 each. Gravity pulls the ball toward me as on a tilted table. The ball drops
in from the top; a ball that goes down the middle drain is lost; three balls per game.
Make sure a fast ball cannot pass through a flipper.
```

## The game

Here is a page of the kind that request asks for, written for this guide:

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Pinball</title>
<style>html,body{margin:0;overflow:hidden;background:#140f24}#hud{position:fixed;top:14px;left:0;right:0;text-align:center;font:600 20px system-ui;color:#fff}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{
  "three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js",
  "@dimforge/rapier3d-compat":"https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/dist/rapier.mjs"}}</script>
<script type="module">
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

await RAPIER.init();
// The table lies flat from z = -7 (the top) to z = 7 (your end). Gravity pulls down onto it and also toward you,
// which is what a real table's tilt does.
const W = 4, L = 7, R = 0.3, FLIP_UP = 0.5, FLIP_SPEED = 0.25, BALLS = 3;
const world = new RAPIER.World({ x: 0, y: -9.81, z: 6 });
const scene = new THREE.Scene();
const mat = color => new THREE.MeshStandardMaterial({ color });

// A fixed box: a collider in the physics world and a mesh to see it. Sizes are full sizes here, halved for Rapier.
function wall(x, z, w, d, angle = 0, name = 'wall') {
  world.createCollider(RAPIER.ColliderDesc.cuboid(w / 2, 0.5, d / 2).setTranslation(x, 0.5, z)
    .setRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle)));
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), mat(0x6c5ce7));
  m.position.set(x, 0.5, z); m.rotation.y = angle; m.name = name; scene.add(m);
}
world.createCollider(RAPIER.ColliderDesc.cuboid(W, 0.5, L + 1).setTranslation(0, -0.5, 0));   // the table top
wall(-W - 0.25, 0, 0.5, 2 * L); wall(W + 0.25, 0, 0.5, 2 * L); wall(0, -L - 0.25, 2 * W + 1, 0.5);
wall(-3.03, 4.18, 2.76, 0.3, -Math.PI / 4, 'left guide'); wall(3.03, 4.18, 2.76, 0.3, Math.PI / 4, 'right guide');

// Flippers: kinematic bodies. The game turns them about their hinge; Rapier works out how hard they hit the ball.
function flipper(side) {                       // side -1 is the left flipper, 1 the right
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(side * 2, 0.3, 5.2));
  world.createCollider(RAPIER.ColliderDesc.cuboid(0.8, 0.25, 0.12).setTranslation(-side * 0.8, 0, 0), body); // hinge at one end
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.24).translate(-side * 0.8, 0, 0), mat(0xfdcb6e));
  mesh.name = side < 0 ? 'left flipper' : 'right flipper'; scene.add(mesh);
  return { body, mesh, side, angle: 0, up: false };
}
const flippers = [flipper(-1), flipper(1)];

// Bumpers: posts that kick the ball away and score 100.
const bumpers = [[-1.5, -3.5], [1.5, -3.5], [0, -1.5]].map(([x, z], i) => {
  world.createCollider(RAPIER.ColliderDesc.cylinder(0.5, 0.5).setTranslation(x, 0.5, z));
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 24), mat(0xff7675));
  mesh.position.set(x, 0.5, z); mesh.name = `bumper ${i + 1}`; scene.add(mesh);
  return { x, z, wait: 0, mesh };
});

const ball = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setCcdEnabled(true));
world.createCollider(RAPIER.ColliderDesc.ball(R).setRestitution(0.3), ball);
let balls = BALLS, score = 0, over = false;
function serve() { ball.setTranslation({ x: 0, y: R, z: -6 }, true); ball.setLinvel({ x: Math.random() * 4 - 2, y: 0, z: 0 }, true); }
serve();

const held = new Set();
function tick() {                              // one physics step of 1/60 s
  for (const f of flippers) {
    const target = held.has(f.side < 0 ? 'ArrowLeft' : 'ArrowRight') ? 1 : -1;
    f.angle = Math.max(-1, Math.min(1, f.angle + target * FLIP_SPEED / FLIP_UP));  // -1 resting, 1 raised
    const a = -f.side * f.angle * FLIP_UP;     // turn about the hinge, the two flippers mirrored
    f.body.setNextKinematicRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a));
  }
  world.step();
  const p = ball.translation();
  for (const b of bumpers) {
    b.wait = Math.max(0, b.wait - 1);
    const dx = p.x - b.x, dz = p.z - b.z, d = Math.hypot(dx, dz);
    if (d < 0.5 + R + 0.05 && !b.wait) { ball.setLinvel({ x: dx / d * 9, y: 0, z: dz / d * 9 }, true); score += 100; b.wait = 10; }
  }
  if (p.z > L + 0.5 && !over) { balls--; if (balls > 0) serve(); else over = true; }   // down the drain
  hud.textContent = over ? `Game over: ${score}. Space to play again` : `Score ${score} · balls ${balls}`;
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.background = new THREE.Color(0x140f24);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 15, 10); camera.lookAt(0, 0, 0.5);
scene.add(new THREE.HemisphereLight(0xffffff, 0x332244, 2.5));
const table = new THREE.Mesh(new THREE.BoxGeometry(2 * W, 0.2, 2 * L), mat(0x2d3561));
table.position.y = -0.1; table.name = 'table'; scene.add(table);
const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 16), new THREE.MeshStandardMaterial({ color: 0xdfe6e9, metalness: 0.6, roughness: 0.3 }));
ballMesh.name = 'ball'; scene.add(ballMesh);
const hud = document.getElementById('hud');

function act({ key, down = true }) {
  if (down) held.add(key); else held.delete(key);
  if (down && key === 'Space' && over) { balls = BALLS; score = 0; over = false; serve(); }
}
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

let last = null, owed = 0;
renderer.setAnimationLoop(now => {
  owed += last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;
  while (owed >= 1 / 60 - 1e-6) { tick(); owed -= 1 / 60; }
  ballMesh.position.copy(ball.translation());
  for (const f of flippers) { f.mesh.position.copy(f.body.translation()); f.mesh.quaternion.copy(f.body.rotation()); }
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100;
window.__game = {
  describe: () => ({ name: 'pinball', keys: { ArrowLeft: 'hold to raise the left flipper', ArrowRight: 'hold to raise the right flipper', Space: 'new game after the last ball' } }),
  observe: () => { const p = ball.translation(), v = ball.linvel();
    return { ball: { x: r2(p.x), z: r2(p.z), speed: r2(Math.hypot(v.x, v.z)) }, score, balls, flippers: flippers.map(f => r2(f.angle)), over }; },
  act,
  // for tests: place the ball and set its velocity; ccd false turns off the swept collision check
  setState: s => { if (s.ball) { ball.setTranslation({ x: s.ball.x, y: R, z: s.ball.z }, true); ball.setLinvel({ x: s.ball.vx ?? 0, y: 0, z: s.ball.vz ?? 0 }, true); }
    if (s.ccd !== undefined) ball.enableCcd(s.ccd); },
  subject: 'ball',
};
</script>
</body></html>
```

Save it as `index.html` and double-click it while online; it loads three.js and Rapier from the internet. The `window.__game` object at the end lets a testing tool read the ball and place it for a test; a player never sees it.

## Flippers: a body on a hinge, driven by a key

A flipper turns about one end, its hinge. The tempting shortcut is to rotate the flipper's mesh (the shape you see) when the key is down. The picture moves, but the physics world never hears of it, and the ball rolls through the flipper as if it were not there.

The flipper has to be a body in the physics world. This game makes each one a **kinematic** body: one that the game moves and the engine does not, but that still pushes everything it touches. Its collider is placed so that the body's origin is the hinge (`setTranslation(-side * 0.8, 0, 0)` shifts the box half its length off the hinge). Each physics step, `tick` turns it a little toward up while the key is held and back down when it is not, through `setNextKinematicRotation`. Because Rapier sees where the flipper was and where it is going, it knows how fast the flipper's tip is moving, and the ball is struck that hard. `FLIP_SPEED` is how far it turns per step: raise it for a snappier flipper.

The other way to build a flipper is a dynamic body (one the engine moves) on a hinge joint with a motor that drives it up. It behaves more like a real machine and takes more tuning. The kinematic flipper does exactly what the code says, which makes it the easier one to get right first.

## Bumpers, the tilt and the drain

- **Bumpers** are fixed cylinders. Each step the game checks whether the ball is touching one, and if so sets the ball's speed to 9 straight away from the bumper's centre and adds 100 to the score. A short wait (`b.wait`) stops one touch from scoring several times. A bounciness setting (restitution) on the collider bounces the ball back at a share of the speed it came in with, so a slow ball gets a slow bounce; setting the speed gives every touch the same kick.
- **The tilt** is gravity. The table is flat, and gravity is `{ x: 0, y: -9.81, z: 6 }`: the `y` part holds the ball on the table, and the `z` part pulls it toward the player, as a real table's slope does.
- **The drain** is a position check: a ball past the bottom edge (`p.z > L + 0.5`) costs a ball, and the next one drops in from the top.

Curved walls, which real tables have, can be made from several short straight boxes set at angles, as the two guide walls above the flippers are. Rapier also accepts a triangle mesh as a collider (`ColliderDesc.trimesh`), so a curved wall modelled in three.js can be used as is.

## A fast ball through a thin flipper

A physics engine moves the ball in steps, here one every 1/60 s. A ball moving at 60 units a second jumps a whole unit each step. The flipper is 0.24 thick. So between one step and the next, the ball can go from in front of the flipper to behind it, and at no step do the two overlap: the engine never sees a collision, and the ball drains through a raised flipper. This is called **tunnelling**, and it is the classic pinball bug.

The fix is **continuous collision detection** (CCD): the engine checks the whole path the ball swept between two steps, not just where it ended up. In Rapier it is one call on the ball's body description, `setCcdEnabled(true)`, as in the game above. Making colliders thicker, capping the ball's speed or stepping physics more often also help, each at a cost: a different table, a slower game, or more work every frame.

## When it breaks

- **The ball rolls through the flippers even when slow.** The flippers are meshes turned by the code, with no body in the physics world.
- **The flipper hits weakly or not at all.** It is turned with `setRotation`, which jumps it to the new angle with no speed. Turn a kinematic body with `setNextKinematicRotation`.
- **The ball sometimes passes through at high speed.** Tunnelling: turn CCD on for the ball.
- **The flipper swings around the wrong point.** The collider is centred on the body instead of offset so that the body's origin is the hinge.
- **A bumper scores dozens of points at once.** It scores every step the ball is touching; add the short wait.
- **The ball floats or sinks.** Rapier takes half sizes for boxes and the radius for balls, three.js full sizes for boxes.

## Letting the agent press the flippers

In pinball the result of a flipper press depends on the frame you press it, which makes bugs hard to reproduce by hand: you can never press at exactly the same moment twice. paprika3d is a plugin for Claude Code (and an MCP server, a tool server other agents can use) that runs the game in a browser of its own on a paused clock, one 1/60 s frame at a time, so the agent places the ball, presses a flipper on an exact frame and reads the result. Two commands in the terminal install it:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The replies below were captured on 2026-10-30 on the game above, on a Linux server with no graphics card, cut to the lines this page discusses with nothing reworded. `look` names what is on the table:

```text
look {}

On screen (12):
table 21% [400, 150, 879, 731] 14 × 8 units
wall ×3 6.2% [353, 105, 926, 729] 9–14 × 1 units
left guide 0.37% [411, 492, 527, 626]
right guide 0.37% [752, 492, 868, 626]
bumper * ×3 0.74% [550, 207, 729, 340]
left flipper 0.2% [522, 607, 615, 650] 1.6 × 0.5 units, across the view
right flipper 0.2% [664, 607, 757, 650] 1.6 × 0.5 units, across the view
ball 0.047% [629, 156, 652, 181]
```

Then `interact` puts the ball above the left flipper, waits, and holds the left arrow for 12 frames, with `trace` following the ball's speed, its place across the table (`x`) and up it (`z`, smaller is further up), and the flipper's angle (-1 down, 1 up). Once pressing after 15 frames, once after 41, each from a fresh page:

```text
interact {"steps":[{"state":{"ball":{"x":-1,"z":4.4}}},{"wait":14},{"key":"ArrowLeft","frames":12},{"wait":30}],"trace":["ball.speed","ball.x","ball.z","flippers.0"]}

{"changed":{"ball":{"x":-3.6,"z":-4.88,"speed":9.45},"flippers":[-1,-1]}}
ball.speed: 0.07 → peak 19.37 at frame 18 → 9.45 at frame 56; first changed at frame 1
ball.x: -1 → low -3.7 at frame 46 → -3.6 at frame 56; first changed at frame 18
ball.z: 4.4 → peak 4.6 at frame 17 → -4.88 at frame 56; first changed at frame 2
flippers.0: -0.5 → peak 1 at frame 18 → -1 at frame 30; first changed at frame 1

interact {"steps":[{"state":{"ball":{"x":-1,"z":4.4}}},{"wait":40},{"key":"ArrowLeft","frames":12},{"wait":30}],"trace":["ball.speed","ball.x","ball.z","flippers.0"]}

{"changed":{"ball":{"x":-0.3,"z":3.14,"speed":9.5},"score":100,"flippers":[-1,-1]}}
ball.speed: 0.07 → peak 24.04 at frame 44 → 9.5 at frame 82; first changed at frame 1
ball.x: -1 → peak -0.06 at frame 57 → -0.3 at frame 82; first changed at frame 38
ball.z: 4.4 → peak 5.28 at frame 38 → low -0.7 at frame 57 → 3.14 at frame 82; first changed at frame 2
flippers.0: -0.5 → peak 1 at frame 44 → -1 at frame 56; first changed at frame 1
```

The early press met the ball while it was still dropping onto the flipper (`z` 4.6) and sent it up the left side (`x` down to -3.7) at a peak speed of 19.37. The late press struck it where it had come to rest against the flipper (`z` 5.28), with the flipper's whole swing behind it: 24.04, up the middle (`x` -0.06) into a bumper, which is the score of 100. The first call, run again from a fresh page, gave the same numbers to the last digit, so when the agent changes `FLIP_SPEED` or the flipper's length, the difference in the trace is the change and nothing else.

And the tunnelling check: the ball placed above the right flipper and sent at it at 60 units a second, once as the game has it and once with CCD switched off for the test (`ccd: false` in the game's `setState`):

```text
interact {"steps":[{"state":{"ccd":true,"ball":{"x":1.2,"z":2,"vz":60}}},{"wait":20}],"trace":["ball.z","balls"]}

{"changed":{"ball":{"x":-2.15,"z":4.36,"speed":9.31},"flippers":[-1,-1]}}
ball.z: 3 → peak 5.54 at frame 8 → 4.36 at frame 20; first changed at frame 1
balls: 3 throughout the 20 frames

interact {"steps":[{"state":{"ccd":false,"ball":{"x":1.2,"z":2,"vz":60}}},{"wait":20}],"trace":["ball.z","balls"]}

{"changed":{"ball":{"x":0.34,"z":-5.79,"speed":1.89},"balls":2,"flippers":[-1,-1]}}
ball.z: 3 → peak 7 at frame 4 → low -6 at frame 5 → -5.79 at frame 20; first changed at frame 1
balls: 3 → 2 at frame 5; first changed at frame 5
```

With CCD the ball stopped on the flipper at 5.54 and rolled off it. Without, it went from 3 to 7 in a few frames, straight through the flipper, and the game took a ball (and dropped the next one in at the top, the -6). A player would call that "the ball went through my flipper sometimes"; the agent gets the frame it happened on.

What it does not do: it does not decide whether the flippers feel right. It measures speeds and angles; whether 19 or 24 feels like a good hit is for you to judge by playing.

## What to do next

- More about physics engines, and a slingshot game: [how to make a physics game](/guides/make-a-physics-game).
- A bounce worked out by hand, no engine: [how to make a pong game](/guides/make-a-pong-game).
- Lights and a sound when a bumper is hit: [how to make a game feel good](/guides/make-a-game-feel-good) and [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Keeping the high score between games: [how to save the high score](/guides/save-the-high-score).
