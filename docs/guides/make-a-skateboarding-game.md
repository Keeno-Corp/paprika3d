---
title: How to make a skateboarding game in three.js: ramps, a rail and tricks
phrase: how to make a skateboarding game
description: How to make a skateboarding game for a first-time game maker: riding and turning, a ramp that launches the skater, gravity in the air, a spin with the arrow keys that scores when the board lands straight, a rail to grind and a fall for a bad landing, in a small three.js skate park; what a game like Tony Hawk's Pro Skater adds on top, what breaks first, and how an AI agent with paprika3d holds the keys itself and reads the air time and the spin of every jump.
meta: How to make a skateboarding game in three.js: push, launch off a ramp, spin in the air, grind a rail, and score a trick on a clean landing.
intent: make-a-skateboarding-game
queries:
  - "how to make a skateboarding game"
  - "how to make a skating game"
  - "how to make a game like tony hawk pro skater"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make a skateboarding game in three.js: ramps, a rail and tricks

A skateboarding game is a game about landing. You ride around a park, hit a ramp, spin in the air or slide along a rail, and the trick counts when the board comes back down on its wheels, lined up with the way you are going (forwards or backwards). Everything else, the speed, the height, the spin, exists to make that landing hard. Get one ramp, one rail and that landing rule working and you have the heart of the genre.

This page builds that heart in one HTML file with three.js, a free JavaScript library that draws 3D in a web page: a small concrete park with a kicker (a short wedge-shaped ramp that throws you up), a rail, and a skater made of boxes. No physics engine is needed; the skater's movement is a few lines of arithmetic you can read.

## The parts of a skate game

1. **Riding.** Holding the up arrow pushes, so the speed grows up to a top speed; a little friction slows the board when you stop pushing. Left and right turn.
2. **The ramp.** The game knows the ramp's height at every point, so on the ramp the skater rises with it. Rolling off its top edge launches the skater with an upward speed that grows with the riding speed.
3. **The air.** Gravity pulls the skater down a little each frame (one step of the game, about 60 a second). The arrow keys now spin the board instead of turning it.
4. **The landing.** When the skater meets the ground, the game rounds the spin to the nearest half turn. Within 30 degrees of it, the landing is clean: a 180 is worth 100 points, a 360 is worth 200. Any further off, the skater falls, loses the trick and sits on the concrete for a second.
5. **The rail.** Landing on the rail with the board along it starts a grind: the skater slides along the top and scores 2 points for every frame. Landing across it is a fall. Space is the ollie, the small jump a skater uses to get onto a rail or off it.

## What a game like Tony Hawk's Pro Skater adds

The Tony Hawk's Pro Skater games are built on these same parts, with a great deal more around them: dozens of tricks on button combinations, manuals (riding on two wheels) that link one trick to the next into long combos with a multiplier, half-pipes for vertical tricks, animated skaters, large levels with goals and a timer. Each of those is a layer on the base above, and each is a request of its own once the base works. A small game that lands a 360 cleanly is a better start than a large one where nothing lands right.

## The first request to type

If you build with an AI coding agent (an assistant such as Claude Code that writes and edits the files in a project folder for you), this request asks for the game below:

```text
Make a small skateboarding game in one index.html with three.js, no physics engine.
A flat concrete park, a kicker ramp that rises 1 m over 2 m, a rail 0.6 m high and
a box skater, with a camera that follows from behind. Up pushes (top speed 9 m/s),
Down brakes, Left/Right turn on the ground and spin the board in the air, Space ollies.
Rolling off the ramp's top launches the skater. On landing, round the spin to the
nearest half turn: within 30 degrees it scores (180 = 100, 360 = 200), otherwise the
skater falls. Landing on the rail along it starts a grind worth 2 points a frame;
landing across it is a fall. Show the score and the last trick.
```

## The game

Here is a page of the kind that request asks for, written and tested for this guide. Save it as `index.html` in a folder where you have run `npm install three`, and open it through a local web server; [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) shows both steps.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Skate park</title>
<style>html,body{margin:0;overflow:hidden;background:#8ec9ef}canvas{display:block}
#hud{position:fixed;top:14px;left:0;right:0;text-align:center;font:600 22px system-ui;color:#223;pointer-events:none;white-space:pre}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const G = 9.81, PUSH = 4, TOP = 9, TURN = 2.5, SPIN = 7, OLLIE = 4;
const CLEAN = 30 * Math.PI / 180;                       // land within 30 degrees of a half turn, or fall
const RAMP = { x0: -1.5, x1: 1.5, z0: -8, z1: -10, h: 1 }; // a kicker: rises 1 m over 2 m toward -z
const RAIL = { x: 4, z0: -2, z1: -14, y: 0.6 };
const keys = new Set();
// heading 0 means rolling toward -z; spin is how far the board has turned in the air
let s = { x: 0, y: 0, z: 4, vy: 0, speed: 0, heading: 0, state: 'ground', air: 0, spin: 0, score: 0, trick: '', down: 0 };

const rampHeight = (x, z) => x < RAMP.x0 || x > RAMP.x1 || z > RAMP.z0 || z < RAMP.z1 ? 0 : (RAMP.z0 - z) / (RAMP.z0 - RAMP.z1) * RAMP.h;
const turning = () => (keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0);

function jump(vy) { s.state = 'air'; s.vy = vy; s.air = 0; s.spin = 0; }

function fall(y) { s.state = 'fallen'; s.y = y; s.vy = 0; s.speed = 0; s.down = 0; s.trick = 'fall'; }

function land(y) {                                      // a trick counts when the board comes down straight
  const half = Math.round(s.spin / Math.PI);
  if (Math.abs(s.spin - half * Math.PI) > CLEAN) return fall(y);
  s.y = y; s.vy = 0;
  s.state = 'ground';
  s.trick = half === 0 ? 'ollie' : `${Math.abs(half) * 180}`;
  s.score += 100 * Math.abs(half);
}

function tick() {
  const dt = 1 / 60;
  if (s.state === 'fallen') { if (++s.down > 60) s.state = 'ground'; return; }
  if (s.state === 'ground') {
    if (keys.has('ArrowUp')) s.speed = Math.min(TOP, s.speed + PUSH * dt);
    if (keys.has('ArrowDown')) s.speed = Math.max(0, s.speed - 8 * dt);
    s.speed *= 0.998;
    s.heading += turning() * TURN * dt;
  }
  if (s.state === 'air') { s.air++; s.spin += turning() * SPIN * dt; s.vy -= G * dt; }
  const was = { x: s.x, y: s.y, z: s.z };
  s.x -= Math.sin(s.heading) * s.speed * dt;
  s.z -= Math.cos(s.heading) * s.speed * dt;
  if (s.state === 'ground') {
    const h = rampHeight(s.x, s.z), before = rampHeight(was.x, was.z);
    if (before > 0 && h === 0) { s.y = before; jump(s.z < RAMP.z1 ? s.speed * 0.45 : 0); }  // off the top: launched
    else s.y = h;
  } else if (s.state === 'air') {
    s.y += s.vy * dt;
    const onRail = Math.abs(s.x - RAIL.x) < 0.25 && s.z < RAIL.z0 && s.z > RAIL.z1;
    if (onRail && s.vy < 0 && was.y >= RAIL.y && s.y < RAIL.y) {
      // a grind needs the board along the rail; anything else is a fall
      const across = Math.abs(Math.sin(s.heading + s.spin));
      if (across > Math.sin(CLEAN)) fall(0);
      else { s.state = 'grind'; s.y = RAIL.y; s.x = RAIL.x; s.spin = 0; s.heading = Math.cos(s.heading) > 0 ? 0 : Math.PI; s.trick = 'grind'; }
    } else if (s.y <= rampHeight(s.x, s.z)) land(rampHeight(s.x, s.z));
  } else if (s.state === 'grind') {
    s.score += 2;                                       // 2 points for every frame on the rail
    if (s.z > RAIL.z0 || s.z < RAIL.z1) jump(0);        // off the end: drop to the ground
  }
}

addEventListener('keydown', e => {
  keys.add(e.code);
  if (e.code === 'Space' && !e.repeat && (s.state === 'ground' || s.state === 'grind')) jump(OLLIE);
});
addEventListener('keyup', e => keys.delete(e.code));

// Drawing: a concrete park, a kicker ramp, a rail and the skater.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ec9ef);
scene.fog = new THREE.Fog(0x8ec9ef, 25, 60);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 200);
scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 1.8));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(5, 10, 3);
scene.add(sun);
const add = (geometry, color, name, x = 0, y = 0, z = 0, parent = scene) => {
  const m = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }));
  m.name = name; m.position.set(x, y, z); parent.add(m); return m;
};
add(new THREE.PlaneGeometry(80, 80).rotateX(-Math.PI / 2), 0x9a9a96, 'ground', 0, 0, -10);
const wedge = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(2, 0), new THREE.Vector2(2, 1)]);
add(new THREE.ExtrudeGeometry(wedge, { depth: 3, bevelEnabled: false }).rotateY(Math.PI / 2).translate(-1.5, 0, -8), 0xd9a441, 'ramp');
add(new THREE.BoxGeometry(0.1, 0.1, 12), 0xd23b3b, 'rail', RAIL.x, RAIL.y - 0.05, -8);
for (const z of [-3, -8, -13]) add(new THREE.BoxGeometry(0.06, RAIL.y, 0.06), 0x555555, 'rail leg', RAIL.x, RAIL.y / 2 - 0.05, z);
const skater = new THREE.Group();
skater.name = 'skater';
add(new THREE.BoxGeometry(0.25, 0.05, 0.8), 0x2b2b2b, 'board', 0, 0.08, 0, skater);
add(new THREE.BoxGeometry(0.4, 0.9, 0.3), 0x2f7de1, 'body', 0, 0.75, 0, skater);
add(new THREE.BoxGeometry(0.25, 0.25, 0.25), 0xf1c27d, 'head', 0, 1.35, 0, skater);
scene.add(skater);
const hud = document.getElementById('hud');

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

const behind = new THREE.Vector3();
function follow(snap) {                                 // the camera trails behind and above the skater
  behind.set(s.x + Math.sin(s.heading) * 5, s.y + 2.5, s.z + Math.cos(s.heading) * 5);
  if (snap) camera.position.copy(behind); else camera.position.lerp(behind, 0.08);
  camera.lookAt(s.x, s.y + 0.8, s.z);
}
follow(true);

let then = null, owed = 0;
renderer.setAnimationLoop(now => {
  owed += then === null ? 1 / 60 : Math.min((now - then) / 1000, 0.1);
  then = now;
  while (owed >= 1 / 60 - 1e-6) { tick(); owed -= 1 / 60; }
  skater.position.set(s.x, s.y, s.z);
  skater.rotation.set(0, s.heading + (s.state === 'air' ? s.spin : 0), s.state === 'fallen' ? 1.3 : 0);
  follow(false);
  hud.textContent = `Score ${s.score}   ${s.trick}\nUp: push   Left/Right: turn, or spin in the air   Space: ollie`;
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100, deg = r => Math.round(r * 180 / Math.PI);
window.__game = {
  describe: () => ({ name: 'skate park', keys: { ArrowUp: 'push', ArrowDown: 'brake', ArrowLeft: 'turn left, or spin in the air', ArrowRight: 'turn right, or spin in the air', Space: 'ollie' } }),
  observe: () => ({ x: r2(s.x), y: r2(s.y), z: r2(s.z), speed: r2(s.speed), heading: deg(s.heading), state: s.state, air: s.air, spin: deg(s.spin), trick: s.trick, score: s.score }),
  act: ({ key, down = true }) => { if (down) keys.add(key); else keys.delete(key); },
  setState: (o) => {                                    // place the skater: x, z, heading in degrees, speed
    Object.assign(s, { state: 'ground', y: 0, vy: 0 }, o, o.heading !== undefined ? { heading: o.heading * Math.PI / 180 } : {});
    follow(true);
  },
  subject: 'skater',
};
</script>
</body></html>
```

The parts to recognise:

- **`s`** is the whole skater: where it is, how fast, which way it is heading, whether it is on the ground, in the air, grinding or fallen, how long it has been in the air and how far the board has spun.
- **`rampHeight`** gives the ramp's height at any point, zero off the ramp. On the ground the skater's height is simply that number; when it drops to zero just past the top edge, `jump` launches the skater.
- **`land`** is the landing rule in four lines: round the spin to half turns, compare, then score or `fall`.
- **The rail check** in `tick` looks for the skater passing down through the rail's height while over it, then compares the board's direction with the rail's: along it is a grind, across it is a fall.
- **`follow`** moves the camera a little of the way toward a point behind and above the skater each frame, so it trails smoothly instead of jerking.

## When it breaks

- **Every jump scores, even crooked ones.** The trick is scored when the spin happens instead of on landing, or the landing never checks the board's angle. Score in one place, at the landing, as `land` does.
- **The board keeps spinning after landing.** The spin keys still change the spin on the ground. Let the arrows spin the board in the air and turn it on the ground, and reset the spin at each takeoff.
- **The skater flies off the ramp too high or not at all.** The launch speed does not depend on the riding speed, or the takeoff is checked at the wrong edge. Here the launch is the riding speed times 0.45, so a faster run jumps higher.
- **The skater pops up onto the ramp from behind.** This game's height function does not care which way you come from, and the kicker's back is a wall. A larger game stops the skater at that wall; here, ride round it.
- **The grind never starts.** The rail check needs the skater to cross the rail's height going down while over it; a jump that is too low never crosses it. The ollie here peaks a little above the rail for that reason.

## Let the agent ride it

A trick that "sometimes doesn't count" depends on frames: when the key went down, how long it was held, where the board was pointing when the wheels touched. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser on a paused clock, so the agent can hold keys for exact numbers of frames and read the skater's state on every one. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The replies below were captured on 2026-11-01 on the game above, on a server with no graphics card where Chrome draws in software, each on a fresh page. `interact` holds the up arrow until the skater leaves the ramp, lets go, and plays until it is back on the ground, with `trace` following the height, the air time and the speed:

```text
interact {"steps":[{"key":"ArrowUp","down":true},{"until":{"state":"air"},"max":400},{"key":"ArrowUp","down":false},{"until":{"state":"ground"},"max":200}],"trace":["y","air","speed","state"]}

{"changed":{"z":-19.21,"speed":8.98,"air":61,"trick":"ollie"}}
until: state == "air" held at frame 168
until: state == "ground" held at frame 229
y: 0 → peak 1.76 at frame 191 → 0 at frame 229; first changed at frame 155
air: 0 → 61 at frame 229; first changed at frame 169
speed: 0 → 8.98 at frame 158; first changed at frame 1
state: "ground" until frame 168, "air" until frame 229, then "ground"
```

The skater reached the ramp's top at frame 168 near top speed, was in the air for 61 frames and peaked at a height of 1.76. With the same run and the left arrow held in the air, the length of the hold decides the trick:

| Left arrow held (frames) | Spin on landing (degrees) | Result |
|---|---|---|
| 27 | 187 | 180, 100 points |
| 40 | 274 | fall |
| 54 | 368 | 360, 200 points |

Here is the reply for the middle row, the one that falls:

```text
interact {"steps":[{"key":"ArrowUp","down":true},{"until":{"state":"air"},"max":400},{"key":"ArrowUp","down":false},{"key":"ArrowLeft","down":true},{"wait":40},{"key":"ArrowLeft","down":false},{"until":{"state":["ground","fallen"]},"max":200}],"trace":["air","spin","state","score"]}

{"changed":{"z":-19.21,"state":"fallen","air":61,"spin":274,"trick":"fall"}}
until: state == "air" held at frame 168
until: state one of "ground", "fallen" held at frame 229
air: 0 → 61 at frame 229; first changed at frame 169
spin: 0 → 274 at frame 210; first changed at frame 170
state: "ground" until frame 168, "air" until frame 229, then "fallen"
score: 0 throughout the 229 frames
```

A spin of 274 is 94 degrees past a 180, far outside the 30 the game allows, so the skater fell instead of scoring. And the rail, starting in line with it a little before its end, at a speed of 5, and pressing Space:

```text
interact {"steps":[{"state":{"x":4,"z":0,"heading":0,"speed":5}},{"key":"Space"},{"until":{"state":"ground"},"max":400}],"trace":["y","state","score"]}

{"changed":{"x":4,"z":-15.8,"speed":4.99,"air":21,"trick":"ollie","score":264}}
until: state == "ground" held at frame 189
y: 0 → peak 0.78 at frame 22 → 0 at frame 189; first changed at frame 1
state: "ground" until frame 1, "air" until frame 36, "grind" until frame 168, "air" until frame 189, then "ground"
score: 0 → 264 at frame 168; first changed at frame 37
```

Up on frame 1, onto the rail on frame 36, grinding until frame 168 for 264 points, off the end and down on frame 189. The same jump started at 45 degrees to the rail came down across it and fell on frame 36.

paprika3d does not judge whether a trick feels good to land or whether the park is fun to ride; it shows what each number does. It presses keys, not a gamepad, and the headless browser plays no sound, so the clack of the board is yours to listen for.

## What to do next

- Gravity, jumping and landing on platforms in more detail: [how to make a character jump](/guides/make-a-character-jump).
- A camera that follows more smoothly around corners: [three.js third person camera follow](/guides/threejs-third-person-camera-follow).
- A dust puff on landing and a shake on a fall: [how to make a game feel good](/guides/make-a-game-feel-good).
- A top score that stays between visits: [how to save the high score](/guides/save-the-high-score).
- An animated skater instead of boxes: [three.js animation crossfade](/guides/threejs-animation-crossfade-walk-run).
