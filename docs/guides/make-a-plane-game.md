---
title: How to make a plane game in three.js: flying through hoops
phrase: how to make a plane game
description: How to make a plane or flying game as a first game: pitch, roll and yaw in plain words, flying along the nose, climbing that costs speed and diving that gains it, lift that falls off below a stall speed, tilted wings that turn the plane, a camera behind and above, and hoops counted when the plane crosses them, on a small three.js paper plane game; the prompt to give an AI agent, what a real flight simulator adds, and how the agent flies, stalls and checks a hoop's reaction with paprika3d's interact, feel and look.
meta: How to make a plane game: a three.js paper plane with pitch, roll and lift that fails when slow, flying through hoops over islands, in one file.
intent: make-a-plane-game
queries:
  - "how to make a plane game"
  - "how to make a flight simulator game"
  - "levelsio flight simulator game"
  - "three js plane game"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make a plane game in three.js: flying through hoops

A plane game needs three things a walking game does not: the plane can point in any direction, it always moves forward along its nose, and its speed decides whether it stays in the air. Many people asking this have seen a browser flight game that Pieter Levels (levelsio) made with AI coding tools and shared in public, and want one of their own. This page builds the smallest version: a paper plane flying through six hoops over a few islands, in one file you can paste. It is not a flight simulator, and a section below says what a real one adds. Then it shows how an AI agent can fly the game itself to check it.

## The parts of a plane game

1. **Three ways to turn.** *Pitch* tips the nose up or down. *Roll* tilts the wings, one up and one down. *Yaw* turns the nose left or right, as a car turns. The arrow keys here control pitch (up and down) and roll (left and right).
2. **Flying along the nose.** Every frame the plane moves forward in the direction its nose points, at its current speed.
3. **Speed.** Climbing slows the plane and diving speeds it up, as a bicycle slows uphill. A small push forward and the drag of the air settle it at a cruising speed when it flies level.
4. **Lift.** Wings hold a plane up while it flies fast enough. Below a certain speed, the stall speed, they stop: the plane sinks and its nose drops until it gains speed again.
5. **Banking to turn.** Tilting the wings makes the plane turn toward the lower wing. That is how planes turn, and it means one key does two things at once.
6. **Hoops.** Rings to fly through in order. The next one glows yellow, passed ones turn green.

## A small plane game

Paper plane hoops: the up arrow lifts the nose, the down arrow lowers it, left and right tilt the wings to turn. Fly through all six hoops without touching the sea or an island. three.js, a JavaScript library that draws 3D in a web page, draws it, and the whole game is one HTML file. The import map line near the top tells the browser where three.js is, a `node_modules/three` folder next to the file, which `npm install three` makes when you type it in a terminal (the window where you type commands). [How to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains how to open such a file in a browser.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Paper plane hoops</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:16px;left:20px;font:600 20px system-ui;color:#fff;text-shadow:0 1px 3px #0008}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ccfee);
scene.fog = new THREE.Fog(0x9ccfee, 60, 220);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 500);
scene.add(new THREE.HemisphereLight(0xffffff, 0x406070, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(30, 60, 20);
scene.add(sun);

const sea = new THREE.Mesh(new THREE.PlaneGeometry(800, 800).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2f86b8 }));
sea.name = 'sea';
scene.add(sea);
// Islands are flattened half-spheres: [x, z, radius, flatten]. groundAt uses the same list, so a crash matches what you see.
const ISLANDS = [[20, -60, 18, 0.5], [-35, -95, 14, 0.9], [-80, -140, 22, 0.4], [-110, -70, 16, 0.7], [10, -150, 12, 1.2]];
for (const [x, z, r, f] of ISLANDS) {
  const island = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x6fae4f }));
  island.name = 'island';
  island.position.set(x, 0, z);
  island.scale.y = f;
  scene.add(island);
}
const groundAt = (x, z) => Math.max(0, ...ISLANDS.map(([ix, iz, r, f]) => f * Math.sqrt(Math.max(0, r * r - (x - ix) ** 2 - (z - iz) ** 2))));

// The plane: three triangles of a folded paper dart, its nose pointing along -z.
const p = (x, y, z) => new THREE.Vector3(x, y, z);
const dart = new THREE.BufferGeometry().setFromPoints([
  p(0, 0, -1.6), p(-1.1, 0.1, 1), p(0, 0, 1),    // left wing
  p(0, 0, -1.6), p(0, 0, 1), p(1.1, 0.1, 1),     // right wing
  p(0, 0, -1.6), p(0, 0, 1), p(0, -0.35, 0.9),   // the fold underneath
]);
dart.computeVertexNormals();
const plane = new THREE.Mesh(dart, new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
plane.name = 'plane';
plane.rotation.order = 'YXZ';   // turn (yaw), then nose up or down (pitch), then tilt the wings (roll)
scene.add(plane);

const ROUTE = [[0, 20, -40], [-12, 24, -85], [-45, 22, -120], [-85, 26, -110], [-105, 20, -45], [-60, 18, -20]];
const ring = new THREE.TorusGeometry(3, 0.25, 12, 48);
const waiting = new THREE.MeshStandardMaterial({ color: 0xff8a1a }), next = new THREE.MeshStandardMaterial({ color: 0xffe040, emissive: 0x806000 });
const done = new THREE.MeshStandardMaterial({ color: 0x40e070, emissive: 0x106020 });
const hoops = ROUTE.map((p, i) => {
  const hoop = new THREE.Mesh(ring, waiting);
  hoop.name = `hoop ${i + 1}`;
  hoop.position.set(...p);
  hoop.lookAt(...(ROUTE[i - 1] ?? [0, 20, 0]));   // face the way the plane comes from
  scene.add(hoop);
  return hoop;
});

const held = new Set();
function act({ key, down = true }) { if (down) held.add(key); else held.delete(key); }
addEventListener('keydown', e => act({ key: e.key }));
addEventListener('keyup', e => act({ key: e.key, down: false }));
const hud = document.getElementById('hud');

const STALL = 8;   // below this speed the wings stop holding the plane up
let speed, passed, crashes = 0, pop = 0;
const forward = new THREE.Vector3(), before = new THREE.Vector3(), toHoop = new THREE.Vector3(), facing = new THREE.Vector3();
function start() {
  plane.position.set(0, 20, 0);
  plane.rotation.set(0, 0, 0);
  speed = 14;
  passed = 0;
  hoops.forEach((h, i) => { h.material = i === 0 ? next : waiting; });
}

function step(dt) {
  const pitchKey = (held.has('ArrowUp') ? 1 : 0) - (held.has('ArrowDown') ? 1 : 0);
  const rollKey = (held.has('ArrowLeft') ? 1 : 0) - (held.has('ArrowRight') ? 1 : 0);
  const r = plane.rotation;
  r.x = THREE.MathUtils.clamp(r.x + pitchKey * 1.0 * dt, -0.9, 0.9);
  r.z = rollKey ? THREE.MathUtils.clamp(r.z + rollKey * 2 * dt, -1, 1) : r.z * (1 - 2 * dt);   // wings level out when you let go
  r.y += Math.sin(r.z) * 1.2 * dt;   // tilted wings turn the plane
  // Climbing slows the plane and diving speeds it up; a little push and air drag settle it near 14.
  speed = Math.max(0, speed + (4 - 0.02 * speed * speed - 9.8 * Math.sin(r.x)) * dt);
  before.copy(plane.position);
  forward.set(0, 0, -1).applyQuaternion(plane.quaternion);
  plane.position.addScaledVector(forward, speed * dt);
  if (speed < STALL) {   // too slow: lift falls off, the plane sinks and its nose drops
    plane.position.y -= (STALL - speed) * 1.5 * dt;
    r.x -= (STALL - speed) * 0.15 * dt;
  }
  const hoop = hoops[passed];
  if (hoop) {
    hoop.getWorldDirection(facing);
    const was = toHoop.subVectors(before, hoop.position).dot(facing), now = toHoop.subVectors(plane.position, hoop.position).dot(facing);
    if (Math.sign(was) !== Math.sign(now) && toHoop.length() < 3) {   // crossed the hoop's flat side inside its ring
      hoop.material = done;
      pop = 1;
      passed++;
      if (hoops[passed]) hoops[passed].material = next;
    }
  }
  if (plane.position.y < groundAt(plane.position.x, plane.position.z) + 0.3) { crashes++; start(); }
}

const behind = new THREE.Vector3();
function draw(dt) {
  if (pop > 0) {   // the hoop just passed swells and settles
    pop = Math.max(0, pop - dt * 3);
    hoops[passed - 1]?.scale.setScalar(1 + pop * 0.4);
  }
  behind.set(0, 3, 9).applyAxisAngle(new THREE.Vector3(0, 1, 0), plane.rotation.y).add(plane.position);
  camera.position.lerp(behind, dt ? 1 - Math.exp(-4 * dt) : 1);
  camera.lookAt(plane.position.x, plane.position.y + 1, plane.position.z);
  hud.textContent = `Hoops: ${passed} / ${hoops.length}   Speed: ${speed.toFixed(0)}${speed < STALL ? '   STALL' : ''}${passed === hoops.length ? '   All hoops!' : ''}`;
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
start();
draw(0);
let last = null;
renderer.setAnimationLoop((now) => {
  const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;
  step(dt);
  draw(dt);
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'paper plane hoops', units: 'metres', keys: { ArrowUp: 'nose up', ArrowDown: 'nose down', ArrowLeft: 'roll left (turns left)', ArrowRight: 'roll right (turns right)' } }),
  observe: () => ({ height: +plane.position.y.toFixed(2), speed: +speed.toFixed(2), pitch: Math.round(THREE.MathUtils.radToDeg(plane.rotation.x)),
    roll: Math.round(THREE.MathUtils.radToDeg(plane.rotation.z)), hoops: passed, crashes, stalled: speed < STALL }),
  act,
  setState: (s) => { if ('z' in s) plane.position.z = s.z; if ('y' in s) plane.position.y = s.y; if ('speed' in s) speed = s.speed; draw(0); },
  subject: plane,
};
</script>
</body></html>
```

## How the code works

**Turning.** The plane's rotation holds pitch (`rotation.x`), yaw (`rotation.y`) and roll (`rotation.z`). `rotation.order = 'YXZ'` tells three.js to apply them in the order a pilot thinks of them: first which way the plane is heading, then how far its nose is up, then how far its wings are tilted. With the default order, a plane that turns while climbing twists in odd ways. When you let go of left and right, the roll eases back toward level, which beginners find easier to fly.

**Moving.** `forward` starts as the direction the dart's nose points in the model, then `applyQuaternion` turns it the way the plane is turned. The plane moves along it by `speed` times the time since the last frame. The game loop, the function three.js calls once per frame, runs `step` to move and `draw` to place the camera.

**Speed and stalls.** One line changes the speed: a small push forward, minus drag that grows with speed, minus the part of gravity that pulls back when the nose is up. Level, these balance near 14. Below `STALL` (8), the plane sinks faster the slower it goes, and its nose tips down, so a stalled plane dives, gains speed and flies again, as a real one tends to.

**Hoops.** A fast plane can move more than a hoop's thickness between two frames, so checking "is the plane inside the hoop now?" can miss. The code instead checks which side of the hoop's flat face the plane was on before the move and after it. If the side changed and the plane is within the ring's radius, it flew through.

**The camera.** A point 9 units behind the plane and 3 above, turned with the plane's heading. The camera moves part of the way there each frame, so it trails smoothly instead of being bolted on.

**Crashing.** `groundAt` gives the height of the islands at any spot from the same list that draws them. Below that height, or below the sea, the plane starts over.

## What a real flight simulator adds

A flight simulator works out the forces on the aircraft many times a second. Lift depends on the angle between the wing and the air it meets, not on speed alone, and each wing has its own curves of lift and drag measured for its shape. The controls are surfaces (ailerons, elevator, rudder) whose effect depends on speed. Engines and propellers, weight and balance, wind, turbulence and the ground cushion near a runway all change how it flies, and the cockpit instruments read all of it. This game skips every one of those for a feel that is easy to fly. Adding them one at a time is possible, but each needs real numbers from aircraft data, and testing that they behave as a pilot would expect.

## What to ask your AI agent

An AI coding agent, an assistant such as Claude Code that writes and edits your project's files, can build this from a description. Name the flight rules plainly:

```text
Make a small three.js plane game in one HTML file. A paper plane over a sea with a few
islands, flying forward along its nose. Up and down arrows pitch, left and right roll;
the roll levels out when released, and the plane turns toward its lower wing. Climbing
slows it and diving speeds it up, settling near 14 metres a second when level; below 8
it stalls: it sinks and its nose drops. A camera behind and above that follows smoothly.
Six hoops to fly through in order, counted when the plane crosses a hoop's face inside
its ring; the next hoop is yellow, passed ones green with a small swell. Touching the
sea or an island restarts. Expose window.__game with describe, observe (height, speed,
pitch, roll, hoops, stalled) and act.
```

Many flight games flip the up and down keys, as a pilot pulls the stick back to climb; ask for whichever you prefer.

## When it does not work

- **The plane twists strangely when it turns while climbing.** The rotation order is three.js's default. Set `rotation.order = 'YXZ'` before changing the angles.
- **Flying through a hoop does not count.** The check looks at one frame at a time and the plane skips past the ring between frames. Check the crossing of the hoop's face, as here.
- **The plane turns the wrong way when it banks.** The sign of the turn is flipped; the turn should follow the lower wing.
- **The plane never comes down, or never stays up.** Print the speed every frame and compare it with the stall speed; a plane that never stalls has no stall rule, and one that always stalls has a cruising speed below it.
- **The camera shakes.** It was placed before the plane moved that frame. Move the plane first, then the camera.

## Let the agent fly it

Testing a flying game by hand means flying it, again, after every change. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs the game in a hidden Chrome browser so the agent can fly it frame by frame, read the numbers, and fix its own bugs.

`interact` plays keys on exact frames and `trace` follows values on every frame. With no key held, the plane should fly level straight through the first hoop:

```text
interact {"steps":[{"until":{"hoops":1},"max":300}],"trace":["height","speed","hoops"]}

{"changed":{"speed":14.11,"hoops":1}}
until: hoops == 1 held at frame 170
height: 20 throughout the 170 frames
speed: 14 → 14.11 at frame 142; first changed at frame 3
hoops: 0 → 1 at frame 170; first changed at frame 170
```

Level flight holds its height and speed, and the hoop counts. Then it holds the up arrow for 60 frames and watches 180 more, to see the stall:

```text
interact {"steps":[{"key":"ArrowUp","frames":60},{"wait":180}],"trace":["height","speed","pitch","stalled"]}

{"changed":{"height":23.59,"speed":7.32,"pitch":-7,"stalled":true}}
height: 20 → peak 30.38 at frame 118 → 23.59 at frame 240; first changed at frame 2
speed: 14.11 → low 4.02 at frame 166 → 7.32 at frame 240; first changed at frame 3
pitch: 0 → peak 52 at frame 54 → -7 at frame 235; first changed at frame 1
stalled: false until frame 86, then true
```

The whole flight rule shows in four lines: the nose rose to 52 degrees, the climb traded speed for height until the plane stalled at frame 86, speed bottomed out at 4.02, and the nose dropped below level, so the plane dived, lost height and sped back up. `feel` measures what reacts on screen to an event. Set up just before the first hoop, it watches the plane fly through:

```text
feel {"steps":[{"state":{"z":-34}}]}

Watched 45 frames after them, counted from the first step.
Moved during the steps: plane 0.23 units.
Camera: moved up to 3.017 at frame 45 and did not come back.
Scale pops (scale changed over 2+ frames and came back): 1 (hoop 1 at frame 25).
Smooth moves (a new position on 3+ consecutive frames): 1 (plane).
Colour changes held to the end: hoop 1 at frame 25, in one frame; hoop 2 at frame 25, in one frame.
No change in: teleports, spawns, removals.
HUD text: changed in one frame.
Sounds started: 0.
State: speed 14 → 14.05, hoops 0 → 1.
```

The pass reacts four ways on the same frame: hoop 1 swells and settles, it turns green, hoop 2 turns yellow, and the counter changes. No sound plays; that is the next thing to add. `look` with `cameras` pictures the scene from several cameras at once without moving the game's own, which helps choose where the chase camera sits:

```text
look {"cameras":[{"position":[0,21.5,4],"lookAt":[0,21,0],"label":"close behind"},{"position":[0,23,9],"lookAt":[0,21,0],"label":"behind and above, as in the game"},{"position":[0,30,16],"lookAt":[0,21,0],"label":"far and high"}]}

Picture: <project>/paprika3d/runs/2026-11-01T00-44-11-562Z/look-3-cameras.png (3 cameras, left to right, top to bottom, at frame 1, no reload; the game's own camera is not moved)
close behind: subject plane 2.9%; on screen: sea, island ×4, plane, hoop * ×4; pixels: brightness 67%, colour saturation 49%, 0% near black, 0% blown out
behind and above, as in the game: subject plane 0.48%; on screen: sea, island ×4, plane, hoop * ×4; pixels: brightness 64%, colour saturation 53%, 0% near black, 0% blown out
far and high: subject plane 0.2%; on screen: sea, island ×4, plane, hoop * ×4; pixels: brightness 59%, colour saturation 62%, 0% near black, 0% blown out
Each cell at full size: close behind look-1.png, behind and above, as in the game look-2.png, far and high look-3.png (in the picture's folder).
Kept as `camera` names for look, zoom and reference compare: "close behind", "behind and above, as in the game", "far and high" (paprika3d/cameras.json).
```

Close behind, the plane covers 2.9% of the picture and hides the island ahead. Far and high, it shrinks to 0.2% and the picture showed the farther hoops pushed up to the top edge, under the score text. The game's camera sits between the two. These replies were captured on 2026-11-01 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not tell you whether the plane is fun to fly or whether the controls feel right in your hands; fly it yourself and change the numbers. It also does not check this against real aircraft. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Next steps

- A whoosh for each hoop: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Laps and a finish line, on the ground: [how to make a racing game](/guides/make-a-racing-game).
- Flying with a gamepad: [how to add controller support to a game](/guides/add-controller-support-to-a-game).
- Make passing a hoop feel like more: [how to make a game feel good](/guides/make-a-game-feel-good).
- Share the flight: [how to put your game online](/guides/put-your-game-online).
