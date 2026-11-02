---
title: How to make a physics game in three.js: a slingshot and a tower to knock down
phrase: how to make a physics game
description: How to make a physics game like a slingshot game, for a first-time game maker: when a game needs a physics engine, which engines work with three.js, how to add Rapier to one HTML file, and a small game where you drag back a ball and knock down a tower of crates; what to check when objects fall through the floor or fly apart, and how an AI agent with paprika3d replays the same shot and pictures the tower before and after.
meta: How to make a physics game in three.js: add the Rapier physics engine and build a slingshot that knocks down a tower of crates.
intent: make-a-physics-game
queries:
  - "how to make a physics game"
  - "how to make a game like angry birds"
  - "how to add physics to three.js game"
  - "Recommended Physics Engine?"
  - "Is a physics engine useful?"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a physics game in three.js: a slingshot and a tower to knock down

A physics game is one where things move the way real objects do: they fall, stack, roll, slide and knock each other over, and the fun comes from that. A slingshot that topples a tower of crates is the classic example. You do not write the falling and toppling yourself. A **physics engine**, a library that works out how solid objects move and collide, does it, and your game tells it what exists and draws what it says.

This page explains when you need one, which ones work with three.js (a free JavaScript library that draws 3D in a web page), and then builds a small slingshot game on one of them, Rapier, in a single file you can copy.

## Do you need a physics engine?

Not always. Ask what moves and what it touches:

- **One or two things with simple rules**, such as a ball bouncing off walls and paddles, or a character jumping on platforms: write it by hand. It is a few lines, and you control every detail. [How to make a pong game](/guides/make-a-pong-game) works out a bounce this way, and [how to make a character jump](/guides/make-a-character-jump) does gravity and landing.
- **Many objects touching each other**, such as a stack that topples, boxes that tumble, a ball that rolls off a ramp into pins: use an engine. Two crates resting on each other already need friction, contact and rotation, and a tower of twelve is far past what is worth writing by hand.

three.js has no physics of its own; it draws. The engines people pair with it are all free:

- **Rapier**, written in Rust and compiled to WebAssembly (a fast format browsers run). It handles hundreds of bodies, has joints and character controllers, and comes in a build whose results repeat exactly on different machines. This page uses it.
- **cannon-es**, written in plain JavaScript, so its code is easy to read and step through; a good fit for small scenes.
- **ammo.js** (the Bullet engine) and **Jolt** (through JoltPhysics.js), large engines written in C++ for games and compiled for the web.

For a first physics game, any of them works; the game below would look the same on each. Pick one and stay with it, since their code is not interchangeable.

## How a physics engine fits into a three.js game

The idea that makes everything else make sense: **there are two worlds.** Rapier keeps one with bodies (the solid things, each with a position, rotation and speed) and colliders (the shape each body has for collisions). three.js keeps the other with meshes (what you see). They know nothing of each other. Every frame, the game does two things in order:

1. **Step** the physics world forward by a fixed slice of time, 1/60 s here. Rapier moves every body and settles every collision.
2. **Copy** each body's position and rotation onto its mesh, then draw.

A body is **dynamic** (gravity and collisions move it, like the crates and the ball) or **fixed** (it never moves, like the ground and the platform). If a crate falls through the floor or a mesh never moves, one of those two steps or one of those two worlds is where the fault is.

## The first request to type

```text
Make a slingshot game with three.js and the Rapier physics engine, in one index.html
file. Load three and @dimforge/rapier3d-compat from a CDN with an import map. Side
view: a ball on a post at the left, a tower of 12 crates on a platform at the right.
I press on the ball, drag it back and let go; it flies the opposite way, faster the
further I pulled. Step the physics at a fixed 1/60 s. A crate that falls off the
platform counts as down. Three shots; show shots left and crates down.
```

## The game

Here is a page of the kind that request asks for, written for this guide:

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Slingshot</title>
<style>html,body{margin:0;overflow:hidden;background:#bfe0f5}canvas{display:block;touch-action:none}
#hud{position:fixed;top:14px;left:0;right:0;text-align:center;font:600 20px system-ui;color:#123;pointer-events:none}</style></head>
<body>
<div id="hud">Drag the ball back and let go</div>
<script type="importmap">{"imports":{
  "three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js",
  "@dimforge/rapier3d-compat":"https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/dist/rapier.mjs"}}</script>
<script type="module">
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

await RAPIER.init();
const SLING = new THREE.Vector3(-7, 2, 0), MAX_PULL = 3, POWER = 7, SHOTS = 3, STEP = 1 / 60;

// The physics world: gravity, the ground, a platform, and a tower of 12 crates. Rapier moves them; we only draw them.
const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
world.createCollider(RAPIER.ColliderDesc.cuboid(40, 0.5, 40).setTranslation(0, -0.5, 0));  // ground
world.createCollider(RAPIER.ColliderDesc.cuboid(2, 0.5, 1.5).setTranslation(6, 0.5, 0));  // platform, top at y = 1
const crates = [];
for (let col = 0; col < 3; col++) for (let row = 0; row < 4; row++) {
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(5 + col, 1.4 + row * 0.8, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(0.4, 0.4, 0.4).setFriction(0.8), body);
  crates.push(body);
}

let ball = null, shots = SHOTS, flying = 0, pull = null, over = false;
const spent = [];                              // balls already shot stay in the world, as bodies the next shot can hit
const down = () => crates.filter(c => c.translation().y < 1).length;   // a crate below the platform's top has fallen off

function shoot(dx, dy) {                       // dx, dy: how far the ball was pulled back from the sling
  if (ball || shots === 0) return;
  const len = Math.hypot(dx, dy), k = len > MAX_PULL ? MAX_PULL / len : 1;
  ball = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(SLING.x + dx * k, SLING.y + dy * k, 0).setCcdEnabled(true));
  world.createCollider(RAPIER.ColliderDesc.ball(0.4).setDensity(4), ball);
  spent.push({ body: ball, mesh: add(new THREE.SphereGeometry(0.4, 24, 16), 0xc0392b, `shot ${SHOTS - shots + 1}`, 0, 0) });
  ball.setLinvel({ x: -dx * k * POWER, y: -dy * k * POWER, z: 0 }, true); // launched the opposite way to the pull
  shots--; flying = 0;
}

function tick() {                              // one physics step of 1/60 s
  world.step();
  if (ball) {
    flying++;
    const v = ball.linvel(), p = ball.translation();
    if ((flying > 60 && Math.hypot(v.x, v.y, v.z) < 0.2) || flying > 240 || p.y < -5) ball = null; // the shot is over: load the next
  }
  over = !ball && (shots === 0 || down() === crates.length);
  hud.textContent = over ? `${down()} of ${crates.length} crates down. Click to play again` : `Shots left ${shots} · crates down ${down()} of ${crates.length}`;
}

// The picture, seen from the side.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe0f5);
scene.fog = new THREE.Fog(0xbfe0f5, 25, 55);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 4, 14); camera.lookAt(0, 2, 0); camera.updateMatrixWorld(); // ready for a click before the first frame
scene.add(new THREE.HemisphereLight(0xffffff, 0x667755, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2); sun.position.set(-5, 10, 8); scene.add(sun);
const add = (geo, color, name, x, y) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color })); m.name = name; m.position.set(x, y, 0); scene.add(m); return m; };
add(new THREE.BoxGeometry(80, 1, 80), 0x7fb069, 'ground', 0, -0.5);
add(new THREE.BoxGeometry(4, 1, 3), 0x8d7b68, 'platform', 6, 0.5);
add(new THREE.CylinderGeometry(0.15, 0.2, SLING.y, 12), 0x6b4226, 'sling', SLING.x, SLING.y / 2 - 0.4);
const crateMeshes = crates.map((c, i) => add(new THREE.BoxGeometry(0.8, 0.8, 0.8), i % 2 ? 0xc48a2c : 0xe0b050, `crate ${i + 1}`, 0, 0));
const ballMesh = add(new THREE.SphereGeometry(0.4, 24, 16), 0xc0392b, 'ball', SLING.x, SLING.y);
const band = new THREE.Line(new THREE.BufferGeometry().setFromPoints([SLING, SLING]), new THREE.LineBasicMaterial({ color: 0x222222 }));
scene.add(band);
const hud = document.getElementById('hud');

// Dragging: the pointer's spot on the plane the game is played in (z = 0) is where the ball is pulled to.
const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
function onPlane(e) {
  ray.setFromCamera({ x: e.clientX / innerWidth * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }, camera);
  return ray.ray.intersectPlane(plane, hit) ? hit.clone() : null;
}
renderer.domElement.addEventListener('pointerdown', e => {
  if (over) return location.reload();
  const p = onPlane(e);
  if (!ball && shots > 0 && p && p.distanceTo(SLING) < 1.5) pull = p.sub(SLING);
});
addEventListener('pointermove', e => { const p = pull && onPlane(e); if (p) pull = p.sub(SLING); });
addEventListener('pointerup', () => { if (pull) shoot(pull.x, pull.y); pull = null; });

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

// The loop: run one physics step for every 1/60 s that passed, then draw where Rapier says everything is.
let last = null, owed = 0;
renderer.setAnimationLoop(now => {
  owed += last === null ? STEP : Math.min((now - last) / 1000, 0.1);
  last = now;
  while (owed >= STEP - 1e-6) { tick(); owed -= STEP; }
  crates.forEach((c, i) => { crateMeshes[i].position.copy(c.translation()); crateMeshes[i].quaternion.copy(c.rotation()); });
  spent.forEach(b => b.mesh.position.copy(b.body.translation()));
  if (pull) { const k = Math.min(1, MAX_PULL / pull.length()); ballMesh.position.copy(SLING).addScaledVector(pull, k); }
  else ballMesh.position.copy(SLING);
  ballMesh.visible = !ball && shots > 0;
  band.geometry.setFromPoints([SLING, pull ? ballMesh.position : SLING]);
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100;
window.__game = {
  describe: () => ({ name: 'slingshot', mouse: 'press on the ball, drag back, release', actions: { shoot: '{ dx, dy }: release a pull of dx, dy from the sling' } }),
  observe: () => ({ shots, down: down(), flying: !!ball, ball: ball ? { x: r2(ball.translation().x), y: r2(ball.translation().y) } : null,
    tower: crates.map(c => r2(c.translation().y)), over }),
  act: ({ action, dx = 0, dy = 0 }) => { if (action === 'shoot') shoot(dx, dy); },
  setState: () => {},
  subject: 'ball',
};
</script>
</body></html>
```

It loads three.js and Rapier from the internet, so saving it as `index.html` and double-clicking it works while you are online. Rapier is several megabytes, so the first load takes a moment. The `window.__game` object at the end lets a testing tool read the tower and fire a shot by numbers; a player never sees it.

The parts to recognise, in order:

- `await RAPIER.init()` loads the engine before anything else uses it.
- `RAPIER.ColliderDesc.cuboid(0.4, 0.4, 0.4)` makes a crate's shape. Rapier's box sizes are **half** sizes, measured from the centre, so this collider matches a three.js `BoxGeometry(0.8, 0.8, 0.8)`. Getting this wrong is the most common reason things float above the floor or sink into it.
- `shoot` turns the pull into a launch speed, opposite to the pull and capped at `MAX_PULL`. The fast ball gets `setCcdEnabled(true)`, which makes Rapier check the whole path between two steps, so it cannot pass through a crate in one jump; [how to make a pinball game](/guides/make-a-pinball-game) explains that problem.
- The drag finds where the mouse points on the flat plane the game is played in (a raycast, a line from the camera through the mouse) and pulls the ball there.
- The loop runs `tick` once for every 1/60 s that passed, then copies the bodies onto the meshes. Stepping by a fixed amount, never by however long the frame took, keeps the physics the same on a slow laptop and a fast one.

## When it breaks

- **Everything falls through the floor.** The floor has a mesh but no collider, or a collider in the wrong place. Every solid thing needs both.
- **Objects float above the ground or sink into it.** The collider sizes are full sizes where Rapier wants half sizes, or the other way round.
- **The tower falls over by itself, or jumps at the start.** The crates overlap when they are created, and the engine pushes them apart. Place them exactly on top of each other.
- **The meshes never move,** though the physics works: the code that copies body positions to meshes is missing for them.
- **The game runs faster on one computer than another.** The physics steps once per frame, or by the frame's own length. Step a fixed 1/60 s, as many times as the time passed.
- **An error from Rapier as soon as the page loads.** The world was made before `await RAPIER.init()` finished.

## Letting the agent replay the shot

Physics bugs are hard to describe: "it sort of wobbles and then falls" is all you can tell an AI after watching. paprika3d is a plugin for Claude Code (and an MCP server, a tool server other agents can use) that gives the agent a browser of its own on a paused clock, which moves exactly one 1/60 s frame at a time. So the agent drags the slingshot itself, reads where every crate ended up, and can play the same shot again to see whether a change helped. Two commands in the terminal install it:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The replies below were captured on 2026-10-30 on the game above, on a Linux server with no graphics card, cut to the lines this page discusses with nothing reworded. `interact` presses on the ball, drags it back and down, releases, and waits 180 frames, with `trace` following three values every frame:

```text
interact {"steps":[{"mouse":"down","x":214,"y":400},{"mouse":"move","x":140,"y":420,"frames":5},{"mouse":"move","x":60,"y":440,"frames":5},{"mouse":"up","x":60,"y":440},{"wait":180}],"trace":["down","shots","flying"]}

{"changed":{"shots":2,"down":4,"tower":[1.4,2.2,3,0.42,1.4,2.2,3,3.8,1.4,0.4,0.4,0.51]},"logs":["warn: THREE.WARNING: Multiple instances of Three.js being imported."]}
Motion (ball): travelled 5.4 units (0.0232 from start to end), its direction of travel turned 180° right.
mouse up at (60, 440): over ball (Mesh, 16.8 units)
down: 0 → 4 at frame 157; first changed at frame 146
shots: 3 → 2 at frame 12; first changed at frame 12
flying: false until frame 12, true until frame 87, then false
```

The shot left on frame 12 and 4 crates came off the platform; `tower` lists every crate's height, so the agent sees which ones (the top of the first column and three of the last). The Motion line is the loaded ball being dragged back and appearing again at the sling for the next shot, and the warning comes from the tool's own copy of three.js, which it loads to name the object under the mouse; neither is a fault in the game.

Played again from a fresh page with the same steps, the reply is the same to the last digit, which is what makes "did my change fix it?" a question with an answer:

```text
open {"url":"index.html","cwd":"<project>"}
interact {"steps":[{"mouse":"down","x":214,"y":400},{"mouse":"move","x":140,"y":420,"frames":5},{"mouse":"move","x":60,"y":440,"frames":5},{"mouse":"up","x":60,"y":440},{"wait":180}],"trace":["down","shots","flying"]}

{"changed":{"shots":2,"down":4,"tower":[1.4,2.2,3,0.42,1.4,2.2,3,3.8,1.4,0.4,0.4,0.51]},"logs":["warn: THREE.WARNING: Multiple instances of Three.js being imported."]}
down: 0 → 4 at frame 157; first changed at frame 146
```

`look` with `sheet` pictures several moments side by side, each on a fresh page: the start, after that one shot, and after all three shots (fired through the game's `shoot` action):

```text
look {"sheet":[{"label":"start"},{"label":"one shot","steps":[{"mouse":"down","x":214,"y":400},{"mouse":"move","x":60,"y":440,"frames":10},{"mouse":"up","x":60,"y":440},{"wait":180}]},{"label":"three shots","steps":[{"action":"shoot","dx":-2.5,"dy":-0.65},{"wait":260},{"action":"shoot","dx":-2.9,"dy":-0.5},{"wait":260},{"action":"shoot","dx":-2.7,"dy":-1},{"wait":260}]}]}

start: subject ball 0.2%; on screen: ground, platform, crate * ×12, sling, ball; pixels: brightness 73%, colour saturation 32%, 0% near black, 0% blown out
one shot: subject ball 0.2%; on screen: ground, platform, crate * ×12, sling, ball, shot 1; pixels: brightness 73%, colour saturation 32%, 0% near black, 0% blown out
three shots: subject ball 0%; on screen: ground, platform, shot * ×2, crate * ×10, sling; left the view: crate * ×2; pixels: brightness 73%, colour saturation 32%, 0% near black, 0% blown out
```

After three shots two crates have flown out of the picture and the loaded ball is gone, as it should be with no shots left. And the end of the game, checked with `expect`:

```text
interact {"steps":[{"action":"shoot","dx":-2.5,"dy":-0.65},{"wait":260},{"action":"shoot","dx":-2.9,"dy":-0.5},{"wait":260},{"action":"shoot","dx":-2.7,"dy":-1},{"wait":260}],"trace":["down","shots"],"expect":{"over":true}}

{"changed":{"shots":0,"down":5,"tower":[1.4,2.2,2.2,1.4,1.4,0.4,0.46,1.89,1.2,0.4,0.4,0.4],"over":true}}
Expect: over true ✓
```

Rapier's standard build, used here, repeats exactly on one machine. When the plugin is installed, its `threejs-game` skill also offers game-state, a small library that runs Rapier's deterministic build in a web worker, stepped once per 1/60 s tick, for games with many more bodies than this; [three.js physics in a web worker](/guides/threejs-physics-web-worker) shows it.

What it does not do: it does not choose your engine or tune your game. Whether the launch is too strong or the crates too light is a matter of taste; the tools show what each number does, and you decide by playing.

## What to do next

- Flippers, bumpers and a ball that must not slip through: [how to make a pinball game](/guides/make-a-pinball-game).
- A shake and a thud when the ball lands: [how to make a game feel good](/guides/make-a-game-feel-good).
- More towers to knock down, one after another: [how to make levels in a game](/guides/make-levels-in-a-game).
- Physics dice, and reading the face on top: [how to make a dice game](/guides/make-a-dice-game).
