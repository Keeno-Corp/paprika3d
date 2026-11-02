---
title: How to make a fruit ninja game in three.js: swipe to slice
phrase: how to make a fruit ninja game
description: How to make a fruit ninja game in the browser: fruit tossed up in arcs, a swipe read from the mouse or a finger and turned into points in the game world, a cut wherever the line between two swipe points crosses a fruit, two halves that fly apart and fall, a bomb that ends the game and three misses. Shown on a small three.js game that works with a mouse and on a phone, with an AI coding agent swiping it, catching a fast swipe that missed and checking what reacts to a cut with paprika3d.
meta: How to make a fruit ninja game in three.js: tossed fruit, a swipe trail, a cut where the swipe crosses, halves that fall, a bomb. Mouse and touch.
intent: make-a-fruit-ninja-game
queries:
  - "how to make a fruit ninja game"
  - "how to make a game like fruit ninja for free"
  - "How do I define spawn patterns for a Fruit Ninja-esque game?"
  - "Three.js with touch and or swipe events example"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a fruit ninja game in three.js: swipe to slice

A Fruit Ninja style game has four parts. Fruit is tossed up from below the screen, flies in an arc and falls back. The player presses and swipes, with a mouse or a finger, and a trail follows the swipe. Any fruit the swipe crosses is cut in two, and the halves fly apart and fall. Now and then a bomb is tossed with the fruit: slicing it ends the game, and so does letting three fruit fall unsliced.

It can be made for free. three.js, the JavaScript library that draws the 3D here, is free and open source, and the game is one HTML file that runs in any web browser. An AI coding agent can write it for you; some agents need a paid plan, depending on which one you use.

## The parts, in plain words

1. **The toss.** Each fruit has a position and a velocity (its speed sideways and up or down). Gravity takes a little off the upward speed every frame (one picture of the game; a browser draws about 60 a second), so the fruit rises, slows, stops and falls: the arc of any thrown object. A fruit tossed from the left gets a push to the right so it stays on screen.
2. **The tosses over time.** Every so often, a wave: one to three fruit at random places, and one toss in six turns the first of them into a bomb. A game with more variety keeps a list of waves (two from the left, then a fan of five, then a bomb in the middle) and plays it in order; [how to make a zombie game](/guides/make-a-zombie-game) builds that kind of wave list.
3. **The swipe.** The browser reports the pointer (the mouse, or a finger on a touch screen) with pointer events: `pointerdown` when it presses, `pointermove` as it moves, `pointerup` when it lets go. Each reported position is a point on the screen. A raycaster, which sends a ray from the camera through that point, turns it into a point on the flat plane where the fruit fly. The swipe is the list of those points while the pointer is pressed.
4. **The cut.** On each move, take the line from the last point to the new one, and measure how close it passes to each fruit's centre. Closer than the fruit's radius is a cut.
5. **The halves.** Remove the fruit and add two half fruits in its place, pushed apart across the line of the cut, falling and spinning.

## Why the cut tests a line and not a point

The browser reports the pointer a limited number of times a second, so a fast swipe arrives as a few points far apart. A fruit can sit between two of them: the swipe went straight through it, yet no reported point was inside it. Testing whether the pointer is inside a fruit misses exactly the swipes that look most like a slice. Testing the line between the two points catches them. The function `segmentDistance` in the game below does it: it finds the point on the line nearest the fruit and measures the distance.

## The game: fruit swipe

Press and swipe across the fruit; never cut the black bomb. After the game ends, a click starts it again. The import map line near the top tells the browser where three.js is (a `node_modules/three` folder next to the file, which `npm install three` makes); [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains the other parts of such a page and how to open it.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Fruit swipe</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block;touch-action:none}#hud{position:fixed;top:16px;left:20px;font:600 22px system-ui;color:#fff;text-shadow:0 2px 4px #0008}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const GRAVITY = 9;         // units per second, every second
const WAVE_EVERY = 1.2;    // seconds between tosses
const RADIUS = 0.45;       // a fruit's radius
const TRAIL_LIFE = 0.12;   // seconds a point of the swipe trail stays

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3a2a20);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3, 12);
camera.lookAt(0, 3, 0);
scene.add(new THREE.HemisphereLight(0xfff0e0, 0x403020, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(3, 8, 8);
scene.add(sun);
const board = new THREE.Mesh(new THREE.BoxGeometry(26, 16, 0.4), new THREE.MeshStandardMaterial({ color: 0x7a5232 }));
board.name = 'board';
board.position.set(0, 3, -2);
scene.add(board);

const COLOURS = [0xe8402a, 0xff9a1a, 0x7ad03a, 0xffd23a];
const fruitGeometry = new THREE.SphereGeometry(RADIUS, 24, 16);
const halfGeometry = new THREE.SphereGeometry(RADIUS, 24, 16, 0, Math.PI);   // half a sphere, open on the cut
const bombMaterial = new THREE.MeshStandardMaterial({ color: 0x202020, emissive: 0x500000 });
let fruits = [], halves = [], score = 0, misses = 0, over = false, nextWave = 1, sliced = 0;

function toss(kind, x, y, vx, vy, colour = COLOURS[Math.floor(Math.random() * COLOURS.length)]) {
  const mesh = new THREE.Mesh(fruitGeometry, kind === 'bomb' ? bombMaterial : new THREE.MeshStandardMaterial({ color: colour }));
  mesh.name = kind;
  scene.add(mesh);
  fruits.push({ kind, x, y, vx, vy, colour, mesh });
}
function wave() {
  const count = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const x = -4 + Math.random() * 8;
    toss(i === 0 && Math.random() < 1 / 6 ? 'bomb' : 'fruit', x, -2, -x * 0.4 + Math.random() - 0.5, 10 + Math.random() * 2);
  }
}

// A slice cuts the fruit into two halves that fly apart along the cut and fall.
function slice(f, angle) {
  scene.remove(f.mesh);
  fruits.splice(fruits.indexOf(f), 1);
  if (f.kind === 'bomb') { over = true; showScore(); return; }
  score++; sliced++;
  for (const side of [1, -1]) {
    const mesh = new THREE.Mesh(halfGeometry, new THREE.MeshStandardMaterial({ color: f.colour, side: THREE.DoubleSide }));
    mesh.name = 'half';
    mesh.rotation.z = angle + (side > 0 ? 0 : Math.PI);
    scene.add(mesh);
    const push = 2.5 * side;
    halves.push({ mesh, x: f.x, y: f.y, vx: f.vx - Math.sin(angle) * push, vy: f.vy * 0.3 + Math.cos(angle) * push, spin: 4 * side });
  }
  showScore();
}

// The swipe: points under the pointer while it is pressed, on the plane the fruit fly in.
const raycaster = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
let pressed = false, trail = [], time = 0;
function worldPoint(e) {
  raycaster.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  return raycaster.ray.intersectPlane(plane, new THREE.Vector3());
}
addEventListener('pointerdown', e => {
  if (over) { reset(); return; }
  pressed = true;
  const p = worldPoint(e);
  trail = [{ x: p.x, y: p.y, t: time }];
});
addEventListener('pointerup', () => { pressed = false; });
addEventListener('pointermove', e => {
  if (!pressed || over) return;
  const p = worldPoint(e), prev = trail[trail.length - 1];
  trail.push({ x: p.x, y: p.y, t: time });
  // test the whole segment since the last point, not the point alone: a fast swipe jumps over a fruit
  for (const f of [...fruits]) if (segmentDistance(f, prev, p) < RADIUS) slice(f, Math.atan2(p.y - prev.y, p.x - prev.x));
});
function segmentDistance(c, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, length2 = dx * dx + dy * dy;
  const t = length2 ? Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.y - a.y) * dy) / length2)) : 0;
  return Math.hypot(c.x - (a.x + t * dx), c.y - (a.y + t * dy));
}

// The trail is a ribbon through the recent points, thin at the old end.
const MAX_POINTS = 32;
const trailGeometry = new THREE.BufferGeometry();
trailGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_POINTS * 2 * 3), 3));
const index = [];
for (let i = 0; i < MAX_POINTS - 1; i++) index.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
trailGeometry.setIndex(index);
const trailMesh = new THREE.Mesh(trailGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
trailMesh.name = 'trail';
trailMesh.frustumCulled = false;
scene.add(trailMesh);
function drawTrail() {
  trail = trail.filter(p => time - p.t < TRAIL_LIFE).slice(-MAX_POINTS);
  const pos = trailGeometry.attributes.position;
  for (let i = 0; i < trail.length; i++) {
    const a = trail[Math.max(0, i - 1)], b = trail[Math.min(trail.length - 1, i + 1)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1, w = 0.08 * (i + 1) / trail.length;
    const nx = -(b.y - a.y) / len * w, ny = (b.x - a.x) / len * w;
    pos.setXYZ(2 * i, trail[i].x + nx, trail[i].y + ny, 0.5);
    pos.setXYZ(2 * i + 1, trail[i].x - nx, trail[i].y - ny, 0.5);
  }
  pos.needsUpdate = true;
  trailGeometry.setDrawRange(0, Math.max(0, trail.length - 1) * 6);
}

const hud = document.getElementById('hud');
function showScore() { hud.textContent = over ? `Score ${score}. Click to play again` : `Score ${score}   Misses ${misses} of 3`; }
function reset() {
  [...fruits, ...halves].forEach(o => scene.remove(o.mesh));
  fruits = []; halves = []; score = 0; misses = 0; over = false; nextWave = 1;
  showScore();
}

function step(dt) {
  time += dt;
  if (over) return;
  nextWave -= dt;
  if (nextWave <= 0) { wave(); nextWave = WAVE_EVERY; }
  for (const f of [...fruits]) {
    f.vy -= GRAVITY * dt; f.x += f.vx * dt; f.y += f.vy * dt;
    if (f.y < -3 && f.vy < 0) {                                       // fell back down unsliced
      scene.remove(f.mesh);
      fruits.splice(fruits.indexOf(f), 1);
      if (f.kind === 'fruit' && ++misses >= 3) over = true;
      showScore();
    }
  }
  for (const h of [...halves]) {
    h.vy -= GRAVITY * dt; h.x += h.vx * dt; h.y += h.vy * dt;
    h.mesh.rotation.z += h.spin * dt;
    if (h.y < -4) { scene.remove(h.mesh); halves.splice(halves.indexOf(h), 1); }
  }
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
  for (const o of [...fruits, ...halves]) o.mesh.position.set(o.x, o.y, 0);
  drawTrail();
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'fruit swipe', units: 'units', controls: 'press and swipe across a fruit to slice it; never slice a bomb' }),
  observe: () => ({ score, misses, over, nextWave: +nextWave.toFixed(2), fruits: fruits.map(f => ({ kind: f.kind, x: +f.x.toFixed(2), y: +f.y.toFixed(2) })), halves: halves.length }),
  setState: (s) => {
    if (s.fruits) { fruits.forEach(f => scene.remove(f.mesh)); fruits = []; s.fruits.forEach(f => toss(f.kind ?? 'fruit', f.x, f.y, f.vx ?? 0, f.vy ?? 0)); }
    if (s.nextWave !== undefined) nextWave = s.nextWave;
  },
};
</script>
</body></html>
```

The trail is a ribbon, a strip of triangles through the last few swipe points, narrow at the old end, because a three.js line is drawn one pixel wide whatever width you ask for ([three.js line width not working](/guides/threejs-line-width-not-working) explains why). `touch-action: none` on the canvas stops a phone from scrolling the page when a finger swipes, and pointer events treat a finger like a mouse, so the same code works on both.

## When it does not work

- **Fast swipes miss.** The cut tests the pointer's position alone. Test the line from the last position, as above.
- **Fruit is cut by moving the mouse without pressing.** The move handler does not check that the pointer is pressed.
- **The swipe scrolls the page on a phone.** Add `touch-action: none` to the canvas's style. [How to make a mobile game with AI](/guides/make-a-mobile-game-with-ai) covers the rest of a phone.
- **The cut lands to the side of the finger.** The pointer's position is turned into a world point with the window's size while the canvas has another size. Use the canvas's own size, or make the canvas fill the window as here.
- **The trail is a thin line or does not show.** WebGL lines are one pixel wide; draw a ribbon of triangles instead.
- **One fruit counts twice.** It was not removed from the list before the next test. Remove it as soon as it is cut.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes and edits the files of your project) can write the game from one message. Say how the cut is tested, because a quick version tests the pointer's position and misses fast swipes:

```text
Make a Fruit Ninja style game in one HTML file with three.js, seen from the front.
Toss one to three fruit up from below the screen every 1.2 seconds, in arcs under gravity;
sometimes one is a bomb. Press and swipe with the mouse or a finger to cut:
turn each pointer position into a point on the fruit's plane with a raycaster, and cut any fruit
whose centre is closer than its radius to the line between the last two points.
A cut fruit becomes two halves that fly apart and fall. Draw the swipe as a fading ribbon.
Cutting a bomb, or letting three fruit fall, ends the game; a click starts again.
Make it work on a phone: pointer events, and touch-action none on the canvas.
```

[How to build a three.js game with an AI agent](/guides/ai-agent-build-threejs-game) covers the steps around it: where the file goes, how to open it, how to ask for the next change.

## Let the agent swipe it

An agent cannot move a mouse or touch a screen, so a swipe that misses is something you find and describe. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can look at it and play it. Its `interact` tool presses, moves and releases the mouse, or touches the screen, at points it chooses, and `expect` checks values afterwards with one ✓ or ✗ each. Here a `{ state }` step puts one still fruit in the middle of the screen and delays the next toss, then one fast swipe goes from one side of it to the other in a single move:

```text
interact {"steps": [{"state": {"fruits": [{"x": 0, "y": 3}], "nextWave": 5}}, {"mouse": "down", "x": 440, "y": 420}, {"mouse": "move", "x": 840, "y": 380}, {"mouse": "up", "x": 840, "y": 380}], "expect": {"score": 1, "halves": 2}}

{"changed":{"score":1,"nextWave":4.93,"halves":2}}
mouse down at (440, 420): over board (Mesh, 14.2 units)
Expect: score 1 ✓ · halves 2 ✓
```

The same steps on a first version that tested whether the pointer itself was inside the fruit:

```text
{"changed":{"nextWave":4.93,"fruits":[{"kind":"fruit","x":0,"y":2.98}]}}
mouse down at (440, 420): over board (Mesh, 14.2 units)
Expect: score 0 ✗ expected 1 · halves 0 ✗ expected 2
```

The fruit is still there, a little lower: the swipe passed straight through it and nothing was cut. A person playing would say "it misses sometimes"; the agent gets the exact swipe that misses and can rerun it after the fix. The same swipe by touch, as a phone sends it:

```text
interact {"steps": [{"state": {"fruits": [{"x": 0, "y": 3}], "nextWave": 5}}, {"touch": "start", "x": 440, "y": 420}, {"touch": "move", "x": 840, "y": 380}, {"touch": "end", "x": 840, "y": 380}], "expect": {"score": 1, "halves": 2}}

{"changed":{"score":1,"nextWave":4.93,"halves":2}}
touch start at (440, 420): over board (Mesh, 14.2 units)
Expect: score 1 ✓ · halves 2 ✓
```

The `feel` tool plays the same cut and lists what reacted on screen in the frames after it:

```text
feel {"steps": [{"state": {"fruits": [{"x": 0, "y": 3}], "nextWave": 5}}, {"mouse": "down", "x": 440, "y": 420}, {"mouse": "move", "x": 840, "y": 380}, {"mouse": "up", "x": 840, "y": 380}]}

Watched the steps' 3 frames and 45 frames after them, counted from the first step.
Smooth moves (a new position on 3+ consecutive frames): 2 (half).
Spawned: up to 2 new objects at once, 0 of 2 gone by the end (half).
Removed: 1 objects there before the steps are gone.
No change in: camera (no shake), scale (no pops), teleports, colour (no flashes).
HUD text: changed in one frame.
Sounds started: 0.
State: score 0 → 1, nextWave 4.98 → 4.18, fruits [{"kind":"fruit","x":0,"y":3}] → [], halves 0 → 2.
```

The fruit went, two halves came and moved smoothly, and the score changed. There is no splash, no flash and no sound yet: the cut works and could feel stronger. [How to make a game feel good](/guides/make-a-game-feel-good) adds those and checks them with the same tool.

These replies were captured on 2026-10-31 on a machine with no graphics card, where Chrome draws in software. paprika3d emulates a touch screen in a desktop Chrome; it is not a phone, so a check on a real phone still matters before you share the game. It does not say whether the game is fun or the waves too hard. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Next steps

- A juice splash and a cutting sound: [how to make a game feel good](/guides/make-a-game-feel-good) and [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- A fruit that slows time for a few seconds: [how to add power ups to a game](/guides/add-power-ups-to-a-game).
- A proper end screen after the bomb: [how to add a game over screen](/guides/add-a-game-over-screen).
- Keep the high score: [how to save the high score](/guides/save-the-high-score).
- Share it with friends on their phones: [how to put your game online](/guides/put-your-game-online).
- Another game about timing: [how to make a rhythm game](/guides/make-a-rhythm-game).
