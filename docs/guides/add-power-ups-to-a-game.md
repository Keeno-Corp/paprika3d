---
title: How to add power ups to a game: timed boosts in three.js
phrase: how to add power ups to a game
description: How to add power ups to a game as a beginner: a pickup that appears at random but never the same kind twice in a row, a shield, a magnet and a speed boost that change one rule each, and an end stored as the tick it runs out on instead of a timer, so a second pickup and a paused game both work, with a ring that shrinks as the time runs out, on a small three.js bee game, and paprika3d timing each power-up to the frame.
meta: How to add power ups to a game in three.js: shield, magnet and speed boosts that last 10 seconds, timed by an end tick, with a ring that shrinks.
intent: add-power-ups-to-a-game
queries:
  - "Implementing powerups for my Breakout clone"
  - "[new video] How to Add Power Ups to Your Game"
  - "How can I make a power-up spawn system semi-random?"
  - "how to make power ups in javascript code"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to add power ups to a game: timed boosts in three.js

A power-up is something the player picks up that changes a rule of the game for a while: a shield that makes enemies bounce off, a magnet that pulls the coins in, a burst of speed. Every power-up has three parts: the pickup (where and when it appears), the effect while it lasts, and the end. The first two are easy to get right. Most power-up bugs are in the end, so that is where this page spends its time.

## The three parts

1. **The pickup.** An object in the world that the player touches to collect. Choose its kind at random, but drop the kind that came last from the choices first, so the same kind never comes twice in a row: random enough to surprise, never so random that it repeats. Leave a gap after each pickup before the next appears (here 5 s).
2. **The effect.** Each rule that a power-up changes asks whether it is on. The bee flies faster while the speed boost is on, wasps bounce off while the shield is on, and pollen within 3 m drifts towards the bee while the magnet is on. The power-up code never reaches into those rules; the rules ask.
3. **The end.** For each kind, keep the tick it ends on (a tick is one step of the game's rules, 1/60 s here, so 10 s is 600 ticks). A power-up is on while the game's tick count is below its end. The time left is the end minus the tick, which is what the HUD and the shrinking ring show.

## Why an end tick and not a timer

A common first version is a timer: turn the shield on, then `setTimeout(() => shield = false, 10000)`. It breaks in two common ways:

- **A second pickup.** Collect a shield, then another five seconds later. The first timer still goes off at 10 s and switches the shield off, five seconds early. With an end tick, the second pickup simply sets a new end, ten seconds from now. (To stack instead, add ten seconds to the end; it is one line either way.)
- **A pause.** A timer keeps counting while the game is paused or the player is on the menu. A tick count stops with the game, so the power-up waits too.

The tick count comes from a fixed step: each frame (one of the pictures the game draws many times a second), the game adds the real time since the last frame to a store of time owed, and runs one tick of the rules for every 1/60 s owed. That way a 10 s shield lasts 10 s on a 60 Hz laptop and on a faster gaming monitor alike.

## A small game: pollen run

Fly the bee with the arrow keys or WASD, collect pollen, and keep away from the two wasps unless the shield is on. three.js, a JavaScript library that draws 3D in a web page, draws the garden; the whole game is one HTML file. Its import map line tells the browser where three.js is (a `node_modules/three` folder beside the file, which `npm install three` makes), and [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains the other parts of such a page.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Pollen run</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:12px;left:0;right:0;text-align:center;font:600 20px system-ui;color:#fff;text-shadow:0 1px 3px #000}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const STEP = 1000 / 60;        // the game runs in ticks of 1/60 s
const LASTS = 600;             // ticks a power-up lasts: 10 seconds
const KINDS = { shield: 0x4aa3ff, magnet: 0xff4a5a, speed: 0xffd23f };
const SIZE = 6;                // the garden reaches 6 metres from its centre

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8d8f0);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 13, 9);
camera.lookAt(0, 0, 0.5);
scene.add(new THREE.HemisphereLight(0xffffff, 0x4a6a3a, 2.5));
const ground = new THREE.Mesh(new THREE.CylinderGeometry(SIZE + 1, SIZE + 1, 0.2, 48), new THREE.MeshStandardMaterial({ color: 0x6fbf5a }));
ground.name = 'garden';
ground.position.y = -0.1;
scene.add(ground);
const mesh = (name, geometry, colour) => {
  const m = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: colour }));
  m.name = name;
  scene.add(m);
  return m;
};
const beeMesh = mesh('bee', new THREE.SphereGeometry(0.35, 24, 16), 0xffc928);
const pollenMeshes = Array.from({ length: 6 }, () => mesh('pollen', new THREE.SphereGeometry(0.18, 12, 8), 0xfff27a));
const waspMeshes = [-3, 3].map(() => mesh('wasp', new THREE.SphereGeometry(0.3, 16, 12), 0xe0601a));
const shapes = { shield: new THREE.OctahedronGeometry(0.35), magnet: new THREE.TorusGeometry(0.25, 0.1, 8, 16), speed: new THREE.ConeGeometry(0.25, 0.6, 16) };
const pickupMesh = mesh('power-up', shapes.shield, KINDS.shield);
// one ring round the bee per active power-up; it shrinks as the time runs out
const rings = Object.fromEntries(Object.entries(KINDS).map(([kind, colour], i) => {
  const ring = mesh(`${kind} ring`, new THREE.RingGeometry(0.55 + i * 0.15, 0.65 + i * 0.15, 48).rotateX(-Math.PI / 2), colour);
  ring.material.side = THREE.DoubleSide;
  return [kind, ring];
}));
const hud = document.getElementById('hud');

const random = () => (Math.random() * 2 - 1) * SIZE;
let tick, bee, pollen, wasps, effects, pickup, lastKind, spawnAt, score, stung;
function start() {
  tick = 0; score = 0; stung = false;
  bee = { x: 0, z: 0 };
  pollen = pollenMeshes.map(() => ({ x: random(), z: random() }));
  wasps = [{ x: -4, z: -3, dir: 1 }, { x: 4, z: 3, dir: -1 }];
  effects = { shield: 0, magnet: 0, speed: 0 };   // the tick each power-up ends on; over when tick reaches it
  pickup = null; lastKind = null; spawnAt = 120;
}
start();
const left = kind => Math.max(0, effects[kind] - tick) / 60;   // seconds left
const on = kind => effects[kind] > tick;

function spawn() {   // random, but never the same kind twice in a row
  const choices = Object.keys(KINDS).filter(k => k !== lastKind);
  const kind = choices[Math.floor(Math.random() * choices.length)];
  pickup = { kind, x: random(), z: random() };
  lastKind = kind;
}

const held = new Set();
function act({ key, down = true }) {
  if (down) held.add(key); else held.delete(key);
  if (down && key === 'KeyR') start();
}
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));

function step() {   // one tick of the rules
  if (stung) return;
  tick++;
  const speed = on('speed') ? 5.5 : 3;
  const dx = (held.has('ArrowRight') || held.has('KeyD')) - (held.has('ArrowLeft') || held.has('KeyA'));
  const dz = (held.has('ArrowDown') || held.has('KeyS')) - (held.has('ArrowUp') || held.has('KeyW'));
  bee.x = THREE.MathUtils.clamp(bee.x + dx * speed / 60, -SIZE, SIZE);
  bee.z = THREE.MathUtils.clamp(bee.z + dz * speed / 60, -SIZE, SIZE);
  for (const p of pollen) {
    const d = Math.hypot(p.x - bee.x, p.z - bee.z);
    if (on('magnet') && d < 3) { p.x -= (p.x - bee.x) / d * 0.1; p.z -= (p.z - bee.z) / d * 0.1; }   // pulled in
    if (d < 0.5) { score++; p.x = random(); p.z = random(); }
  }
  for (const w of wasps) {
    w.x += w.dir * 2 / 60;
    if (Math.abs(w.x) > SIZE) w.dir *= -1;
    if (Math.hypot(w.x - bee.x, w.z - bee.z) < 0.6) {
      if (on('shield')) w.dir *= -1;   // bounces off the shield
      else stung = true;
    }
  }
  if (!pickup && tick >= spawnAt) spawn();
  if (pickup && Math.hypot(pickup.x - bee.x, pickup.z - bee.z) < 0.6) {
    effects[pickup.kind] = tick + LASTS;   // a second one of a kind starts its 10 seconds again
    pickup = null;
    spawnAt = tick + 300;                  // the next one comes 5 seconds later
  }
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
let owed = 0, last = null;
renderer.setAnimationLoop((now) => {
  owed = Math.min(owed + (last === null ? STEP : now - last), 100);   // never more than 0.1 s of catching up
  last = now;
  while (owed >= STEP - 0.5) { step(); owed -= STEP; }   // the 0.5 ms stops rounding from skipping a tick
  beeMesh.position.set(bee.x, 0.6 + Math.sin(tick / 6) * 0.05, bee.z);
  pollen.forEach((p, i) => pollenMeshes[i].position.set(p.x, 0.3, p.z));
  wasps.forEach((w, i) => waspMeshes[i].position.set(w.x, 0.6, w.z));
  pickupMesh.visible = !!pickup;
  if (pickup) {
    pickupMesh.geometry = shapes[pickup.kind];
    pickupMesh.material.color.setHex(KINDS[pickup.kind]);
    pickupMesh.position.set(pickup.x, 0.6, pickup.z);
    pickupMesh.rotation.y = tick / 20;
  }
  for (const kind in rings) {
    rings[kind].visible = on(kind);
    rings[kind].scale.setScalar(0.3 + 0.7 * left(kind) / 10);
    rings[kind].position.set(bee.x, 0.3, bee.z);
  }
  const active = Object.keys(KINDS).filter(on).map(k => `${k} ${Math.ceil(left(k))} s`).join('   ');
  hud.textContent = stung ? `Stung! Pollen ${score}. R to fly again` : `Pollen ${score}   ${active}`;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'pollen run', units: 'metres', keys: { ArrowRight: 'fly', ArrowLeft: 'fly', ArrowUp: 'fly', ArrowDown: 'fly', KeyR: 'restart' } }),
  observe: () => ({ tick, score, stung, bee: { x: +bee.x.toFixed(2), z: +bee.z.toFixed(2) },
    effects: Object.fromEntries(Object.keys(KINDS).map(k => [k, +left(k).toFixed(2)])), pickup: pickup && pickup.kind, lastKind }),
  act,
  setState: (s) => {
    if (s.bee) bee = { ...bee, ...s.bee };
    if (s.effects) for (const k in s.effects) effects[k] = tick + Math.round(s.effects[k] * 60);   // seconds left
    if (s.pickup) { pickup = { ...s.pickup }; lastKind = pickup.kind; }
  },
  subject: 'bee',
};
</script>
</body></html>
```

`effects` holds the three end ticks, and `on(kind)` and `left(kind)` are the two questions every other part asks. `spawn` is the semi-random choice. `step` is one tick of the rules, run by the fixed step in the frame loop, and the frame loop draws one ring per active power-up, scaled down as its time runs out.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes the files in your project) can add power-ups to a game you already have. Name the ending, since that is where first versions go wrong:

```text
Add three power-ups to my game: a shield (enemies bounce off), a magnet (pickups within
3 metres drift to the player) and a speed boost. Each lasts 10 seconds. Spawn one at a
random place 5 seconds after the last was taken, of a random kind but never the same
kind twice in a row. Store the tick each power-up ends on, in the game's fixed 1/60 s
step, not a setTimeout, so a second pickup restarts its 10 seconds and pausing pauses it.
Show a ring around the player for each active power-up that shrinks as its time runs out.
```

## Let the agent time each power-up

Timing is hard to check by playing: a shield that ends a few seconds early just feels like bad luck. paprika3d, a plugin for Claude Code and an MCP server (the standard way to give tools to other coding agents), runs the game in a hidden Chrome on a clock that steps one frame, 1/60 s, at a time, so the agent can count the frames. Its `interact` tool gives the bee a shield with a `{ state }` step and then plays frames until the shield reads 0 with an `until` step:

```text
interact {"steps":[{"state":{"effects":{"shield":10}}},{"until":{"effects.shield":0},"max":700}],"expect":{"effects.shield":0}}

{"changed":{"tick":600,"pickup":"magnet","lastKind":"magnet"}}
until: effects.shield == 0 held at frame 599
Expect: effects.shield 0 ✓
```

Ten seconds is 600 ticks; the setup step drew one of them, and the shield ran out 599 frames later, on the tick it was due. (A magnet power-up appeared meanwhile, the spawn at work.) Then the case that breaks timers: a shield pickup, and a second one 300 frames later, with `trace` reading the time left each frame:

```text
interact {"steps":[{"state":{"pickup":{"kind":"shield","x":0,"z":0}}},{"wait":300},{"state":{"pickup":{"kind":"shield","x":0,"z":0}}},{"until":{"effects.shield":0},"max":1200}],"trace":["effects.shield"]}

{"changed":{"tick":902,"pickup":"magnet","lastKind":"magnet"}}
until: effects.shield == 0 held at frame 901
Trace (the first 600 frames):
effects.shield: 10 → low 5 at frame 300 → 5.02 at frame 600; first changed at frame 1
```

The shield fell to 5 s left, went back to 10 at the second pickup (5.02 left by frame 600) and ended 600 frames after the second pickup. The same steps on a first version written with `setTimeout`, whose state says just on (1) or off (0):

```text
interact {"steps":[{"state":{"pickup":{"kind":"shield","x":0,"z":0}}},{"wait":300},{"state":{"pickup":{"kind":"shield","x":0,"z":0}}},{"until":{"effects.shield":0},"max":1200}],"trace":["effects.shield"]}

{"changed":{"tick":601,"lastKind":"shield"}}
until: effects.shield == 0 held at frame 600
Trace (the first 600 frames):
effects.shield: 1 → 0 at frame 600; first changed at frame 600
```

Off at frame 600, ten seconds after the first pickup: the second shield lost half its time to the first one's timer. `feel` measures what happens on screen around an event; here the bee flies into a magnet:

```text
feel {"steps":[{"state":{"pickup":{"kind":"magnet","x":0.8,"z":0}}},{"key":"ArrowRight","frames":10}]}

Watched the steps' 10 frames and 45 frames after them, counted from the first step.
State changed during setup (lastKind null → "magnet"): the event may have fired before the watched frames.
Moved during the steps: bee 0.5 units, pollen 0.5 units, wasp 0.33 units, wasp 0.33 units.
Smooth moves (a new position on 3+ consecutive frames): 5 (bee, pollen, wasp, magnet ring).
Teleports (a jump over 0.5 units between two watched frames, 4× the moves either side of it; a respawn is one, a glitch only for something that should glide): 1 (pollen at frame 16, 3.61 units).
Spawned: up to 1 new objects at once, 0 of 1 gone by the end (magnet ring).
Removed: 1 objects there before the steps are gone.
No change in: camera (no shake), scale (no pops), colour (no flashes).
HUD text: changed over 2 frames (counted up).
Sounds started: 0.
State: tick 1 → 56, score 0 → 1, bee.x 0 → 0.5, effects.magnet 0 → 9.17, pickup "magnet" → null.
```

The ring appeared and the HUD changed; the magnet then pulled a pollen in (the teleport is that pollen being collected and placed somewhere new). Nothing popped, flashed or made a sound on the pickup itself, which is the list of what to add next: [how to make a game feel good](/guides/make-a-game-feel-good) covers those reactions. These replies were captured on 2026-11-01 on a machine with no graphics card, where Chrome draws in software.

paprika3d times and counts; it does not tell you whether 10 s is too long or whether the magnet makes the game too easy, which is a matter of playing it. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Without paprika3d

Keep the seconds left on screen, as this game's HUD does, and make each power-up last three seconds while you test so you see many endings. Then take two of the same kind one after the other, and pause in the middle of one, and watch the number each time.

## Next steps

- Give each pickup a pop, a flash and a sound: [how to make a game feel good](/guides/make-a-game-feel-good) and [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- A pickup that lasts for good, the longer blast: [how to create a bomberman game](/guides/make-a-bomberman-game).
- An end screen for a stung bee: [how to add a game over screen](/guides/add-a-game-over-screen).
- Power-ups are one way to tune challenge; the others: [how to make a game more fun](/guides/make-a-game-more-fun).
