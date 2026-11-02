---
title: How to make a fishing game in three.js: a boat, a cast and a bite
phrase: how to make a fishing game
description: How to make a fishing game for a first game: water that moves from one wave formula, a boat and a float that ride it, a cast charged by holding the mouse, a bite after a random wait and a short window to reel in, on a small three.js lake game; the prompt to give an AI agent, what to check when the boat sinks or the bite never comes, and how the agent casts, waits and checks a catch itself with paprika3d's interact and look.
meta: How to make a fishing game: waves a boat rides, a cast charged by holding the mouse, a random bite and a moment to reel in, in a small three.js game.
intent: make-a-fishing-game
queries:
  - "how to make a fishing game"
  - "how to make a fishing system in a game"
  - "three js fishing game"
  - "How to make floating boat"
  - "Simple browser boat game using Three.js"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make a fishing game in three.js: a boat, a cast and a bite

A fishing game is a loop of four moments: you cast, you wait, a fish bites, and you reel in at the right moment or lose it. Under that loop sits a lake whose water moves, and a boat and a float (the bobber) that move with it. Each part is small. This page builds all of them in one file you can paste, explains each piece in plain words, and then shows how an AI agent can play the game to check its own work.

## The parts of a fishing game

1. **Water that moves.** Waves are a formula: give it a spot on the lake and a time, and it returns how high the water is there. Every frame the game asks it for the height of each point of the water's surface and moves the point there.
2. **Things that float.** The boat and the bobber ask the same formula for the height under them, and sit there. The boat also tilts with the slope of the wave under it. This is the whole answer to "how to make a floating boat" in a game: use one wave formula for the water and for everything on it.
3. **The cast.** Hold the mouse button (or Space) and a power bar fills; let go and the bobber flies out in an arc. A full bar sends it far, a short press drops it near the boat.
4. **The wait and the bite.** After the bobber lands, the game picks a random wait. When it ends, a fish bites: the bobber is pulled under for a short moment.
5. **Reeling in.** Press during that moment and you catch the fish. Press too early and the fish swims off; press too late and it gets away.

A "fishing system" in a bigger game adds kinds of fish with different chances, a reel that fights back, and a shop that buys the catch. Those all sit on top of these five parts.

## A small fishing game

Lake fishing: hold the mouse or Space to charge the cast, let go, then click when the bobber goes under. three.js, a JavaScript library that draws 3D in a web page, draws it, and the whole game is one HTML file. The import map line near the top tells the browser where three.js is: a `node_modules/three` folder next to the file, which the command `npm install three` makes when you type it in a terminal (the window where you type commands). [How to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains how to open such a file in a browser and the other parts of the page.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Lake fishing</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:16px;left:20px;font:600 20px system-ui;color:#fff;text-shadow:0 1px 3px #0008}
#bar{width:200px;height:12px;margin-top:8px;border:2px solid #fff;border-radius:4px}#fill{height:100%;width:0;background:#ffd040}</style></head>
<body>
<div id="hud"><div id="text">Fish: 0</div><div id="bar"><div id="fill"></div></div><div id="msg">Hold the mouse or Space to cast</div></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd3ff);
scene.fog = new THREE.Fog(0x9fd3ff, 20, 60);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3.5, 6);
camera.lookAt(0, 0, -6);
scene.add(new THREE.HemisphereLight(0xffffff, 0x305070, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(-6, 4, -10);
scene.add(sun);

// The waves: one height for any point and time, used by the water, the boat and the bobber alike.
const wave = (x, z, t) => 0.2 * Math.sin(0.5 * x + 1.4 * t) + 0.12 * Math.sin(0.7 * z - 1.1 * t);

const water = new THREE.Mesh(new THREE.PlaneGeometry(120, 120, 80, 80).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: 0x2a78a8, flatShading: true }));
water.name = 'water';
scene.add(water);

const boat = new THREE.Group();
boat.name = 'boat';
const wood = new THREE.MeshStandardMaterial({ color: 0x9a6a3a });
const hull = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 2.4), wood);
hull.position.y = 0.1;
const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 2.2), new THREE.MeshStandardMaterial({ color: 0x333333 }));
rod.position.set(0.3, 0.9, -0.9);
rod.rotation.x = -0.9;
const tip = new THREE.Object3D();
tip.position.y = 1.1;
rod.add(tip);
boat.add(hull, rod);
scene.add(boat);

const bobber = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshStandardMaterial({ color: 0xff3030 }));
bobber.name = 'bobber';
scene.add(bobber);
const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
  new THREE.LineBasicMaterial({ color: 0xffffff }));
line.name = 'line';
scene.add(line);

const text = document.getElementById('text'), msg = document.getElementById('msg'), fill = document.getElementById('fill');
let t = 0, phase = 'ready', power = 0, charge = 0, flight = 0, biteAt = 0, fish = 0, gotAway = 0;
const from = new THREE.Vector3(), spot = new THREE.Vector3();

function press() {
  if (phase === 'ready') { phase = 'charging'; charge = 0; }
  else if (phase === 'waiting') { phase = 'ready'; msg.textContent = 'Too early: the fish swam off'; }
  else if (phase === 'bite') { phase = 'ready'; fish++; msg.textContent = 'You caught a fish!'; }
}
function release() {
  if (phase !== 'charging') return;
  phase = 'flying';
  flight = 0;
  tip.getWorldPosition(from);
  spot.set(0.3, 0, -(3 + power * 12));   // a full bar casts 15 units out
}
function act({ key, down = true }) { if (key === ' ') down ? press() : release(); }
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.key }); });
addEventListener('keyup', e => act({ key: e.key, down: false }));
addEventListener('pointerdown', press);
addEventListener('pointerup', release);

function step(dt) {
  t += dt;
  if (phase === 'charging') {
    charge += dt;
    power = 1 - Math.abs(1 - (charge * 0.8) % 2);   // the bar fills and empties while held
  } else if (phase === 'flying') {
    flight = Math.min(flight + dt * 2, 1);
    if (flight === 1) { phase = 'waiting'; biteAt = t + 2 + Math.random() * 4; msg.textContent = 'Wait for a bite...'; }
  } else if (phase === 'waiting' && t > biteAt) {
    phase = 'bite';
    msg.textContent = 'Bite! Click now!';
  } else if (phase === 'bite' && t > biteAt + 0.8) {
    phase = 'ready';
    gotAway++;
    msg.textContent = 'It got away';
  }
  if (phase === 'ready') power = 0;
}

function draw() {
  const pos = water.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, wave(pos.getX(i), pos.getZ(i), t));
  pos.needsUpdate = true;
  boat.position.y = wave(0, 0, t);
  boat.rotation.x = wave(0, -1, t) - wave(0, 1, t);   // tip with the slope under the boat
  boat.rotation.z = wave(1, 0, t) - wave(-1, 0, t);
  if (phase === 'ready' || phase === 'charging') tip.getWorldPosition(bobber.position).y -= 0.8;
  else if (phase === 'flying') {
    bobber.position.lerpVectors(from, spot, flight);
    bobber.position.y = THREE.MathUtils.lerp(from.y, wave(spot.x, spot.z, t), flight) + Math.sin(flight * Math.PI) * 2;
  } else bobber.position.set(spot.x, wave(spot.x, spot.z, t) + (phase === 'bite' ? -0.6 : 0.05), spot.z);   // a bite pulls it under, deeper than any wave
  const end = line.geometry.attributes.position;
  tip.getWorldPosition(from);
  end.setXYZ(0, from.x, from.y, from.z);
  end.setXYZ(1, bobber.position.x, bobber.position.y, bobber.position.z);
  end.needsUpdate = true;
  fill.style.width = `${power * 100}%`;
  text.textContent = `Fish: ${fish}`;
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
let last = null;
renderer.setAnimationLoop((now) => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  draw();
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'lake fishing', units: 'metres', keys: { ' ': 'hold to charge the cast, let go to cast, press when the bobber dips to reel in' } }),
  observe: () => ({ phase, power: +power.toFixed(2), bobber: { y: +bobber.position.y.toFixed(3), out: +(-bobber.position.z).toFixed(1) }, fish, gotAway }),
  act,
  subject: bobber,
};
</script>
</body></html>
```

## How the code works

**The waves.** `wave(x, z, t)` adds two slow sine waves, one rolling along the lake and one across it, and returns the water's height at that spot at time `t`. The water is a flat sheet cut into a grid of 80 by 80 squares. Every frame, `draw` moves each corner of that grid to the height `wave` gives, and `flatShading` lights each little face on its own, so the slopes catch the low sun and the waves show.

**The boat.** It asks `wave` for the height at its own spot and sits there. To tilt it, the code compares the water's height one step in front with one step behind (and left with right): the difference is the slope, and the boat leans by it. There is no physics engine here, a library that simulates forces and collisions; a boat that samples the waves under it looks right, and costs a few lines.

**The phases.** The game is always in one phase: `ready`, `charging`, `flying`, `waiting` or `bite`. `press` and `release` do different things in each phase, which is why one button can cast, fail too early and reel in. The game loop, the function three.js calls once per frame through `setAnimationLoop`, runs `step` to move time forward and change phase, then `draw` to place everything.

**The wait.** When the bobber lands, `biteAt` is set to the current time plus 2 and up to 4 more seconds, picked with `Math.random()`. The bite lasts 0.8 seconds. Those two numbers decide most of how the game feels: a long wait builds tension or gets dull, and a short window asks for quick hands.

## What to ask your AI agent

An AI coding agent, an assistant such as Claude Code that writes and edits your project's files, can build this from a description. Name each part so nothing is left to guess:

```text
Make a small three.js fishing game in one HTML file. A lake whose waves come from one
function wave(x, z, t), used for the water's vertices, the boat and the bobber. The boat
sits on the waves and tilts with their slope. Hold the mouse or Space to fill a power bar,
let go to cast the bobber in an arc; full power casts 15 metres. After it lands, wait a
random 2 to 6 seconds, then pull the bobber under for 0.8 seconds: a click then catches
a fish, a click before it scares the fish, no click lets it get away. Show the fish caught.
Expose window.__game with describe, observe (phase, power, bobber height, fish) and act.
```

The last line gives the agent a way to read and drive the game, which the testing step below uses.

## When it does not work

- **The boat sinks into the waves or floats above them.** The boat and the water use two different wave formulas, or two different clocks. Use one `wave` function and one time `t` for both.
- **The water does not move.** Changing a geometry's points draws nothing new until the game sets `needsUpdate = true` on them, once per frame.
- **The water looks like a still sheet.** With light from straight above, small waves barely change the shading. A low sun from the side, with `flatShading`, makes the waves show as facets.
- **The bite never comes.** The wait was measured on one clock and checked on another, for example set from `performance.now()` in milliseconds and compared with game time in seconds.
- **One click casts and catches at once.** The press and the release each need to check the phase first, as `press` and `release` do here.

For a game that loads to a blank page, [why an HTML game does not work](/guides/html-game-not-working) goes through the usual causes.

## Let the agent cast, wait and check the catch

A fishing game is slow to test by hand: every check means a cast, a wait of several seconds and a quick click. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs the game in a hidden Chrome browser so the agent can play it frame by frame and read what happened, then fix its own bugs.

`interact` plays inputs on exact frames. Here it holds the mouse for 75 frames to charge the cast, lets go, waits until the game's phase is `bite`, and traces the bobber's height and the phase on every frame:

```text
interact {"steps":[{"mouse":"down","x":640,"y":400},{"wait":75},{"mouse":"up","x":640,"y":400},{"until":{"phase":"bite"},"max":600},{"wait":20}],"trace":["bobber.y","phase"]}

{"changed":{"phase":"bite","power":0.99,"bobber":{"y":-0.372,"out":14.8}}}
Motion (bobber): travelled 16.8 units (12.9 from start to end), it stopped at frame 353 and did not move again.
until: phase == "bite" held at frame 353
mouse up at (640, 400): over line (Line, 8.1 units)
bobber.y: 0 → peak 2.97 at frame 89 → -0.372 at frame 373; first changed at frame 1
phase: "ready" until frame 1, "charging" until frame 77, "flying" until frame 107, "waiting" until frame 353, then "bite"
```

The whole loop shows in one reply: the bar reached 0.99, the bobber rose to a height of 2.97 in its arc and landed 14.8 metres out, and the fish bit at frame 353, more than four seconds of waiting the agent did not have to sit through. `look` then takes a screenshot and lists what is on screen:

```text
look {}

Picture: <project>/paprika3d/runs/2026-11-01T00-24-42-175Z/look-1.png
Pixels: brightness 52%, colour saturation 70%, 0% near black, 0% blown out.
Hues: blue 69%, cyan 28% of the frame; over the objects but water (2.2% of it): orange 95%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
Surface: "water" covers 71% with almost no detail (0.61 of 255): it reads as flat colour. Unless the user asked for flat colour, add texture, normal detail or lighting variation.
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Fish: 0 Bite! Click now!" [20, 16, 223, 85].
Subject: bobber drew no pixel; 0 of its 1 named parts show; in view but covered: bobber (behind water).
This camera shows little of the subject: try other views with `look` camera, then move the page's own camera to the best (said once).
On screen (4):
water 71% [0, 216, 1279, 799] 120 × 120 units
boat ×2 2.2% [556, 384, 728, 663]
line 0.0054% [655, 329, 687, 383] 12.9 × 1.72 units, along the view
Never visible: bobber (0.4 units, in view, behind water)
In view but no pixel: too small for the scene (check its size against the scene), hidden behind something, or not drawn.
```

During the bite the line still runs 12.9 units out to the bobber, and the bobber itself is "behind water": pulled under, as a bite should look. The Surface line says the water has little fine detail, which a texture or ripples would add; [how to make my game look better](/guides/make-my-game-look-better) covers that kind of change. The last check plays a whole catch from a fresh reload, clicks during the bite, and saves it as a check that `test` reruns after every later change:

```text
interact {"steps":[{"mouse":"down","x":640,"y":400},{"wait":40},{"mouse":"up","x":640,"y":400},{"until":{"phase":"bite"},"max":600},{"mouse":"click","x":640,"y":400}],"expect":{"fish":1,"phase":"ready"},"save":"catch"}

{"changed":{"bobber":{"y":0.774,"out":2},"fish":1}}
until: phase == "bite" held at frame 318
mouse up at (640, 400): over line (Line, 8.3 units)
Expect: fish 1 ✓ · phase "ready" ✓
Saved check "catch" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

A random wait would make such a check fail now and then, so paprika3d seeds the page's `Math.random`: every reload gets the same numbers, and the saved catch repeats. These replies were captured on 2026-11-01 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not tell you whether the wait feels tense or dull, or whether 0.8 seconds is a fair window for a person; try it yourself and change the numbers. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Next steps

- Kinds of fish, a bag to keep them in and a shop that buys them: [how to make an inventory in a game](/guides/make-an-inventory-in-a-game).
- Keep the catch between visits: [how to save game progress](/guides/save-game-progress).
- A splash for the cast and a plop for the bite: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Dawn and dusk on the lake: [how to make a day night cycle in a game](/guides/make-a-day-night-cycle).
- Make the catch feel like something: [how to make a game feel good](/guides/make-a-game-feel-good).
- How an agent builds and tests a game from start to end: [build a three.js game with an AI agent](/guides/ai-agent-build-threejs-game).
