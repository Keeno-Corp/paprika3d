---
title: How to make a basketball game in three.js: a throw, an arc and the rim
phrase: how to make a basketball game
description: How to make a basketball game for a first-time game maker: a swipe that throws, gravity that bends the throw into an arc, a rim and backboard the ball bounces off with the Rapier physics engine, and a basket rule that wants the ball to drop through the ring from above, in a small three.js shooting game with a 60 second clock; why a higher arc goes in more often, and how an AI agent with paprika3d throws the ball itself and reads where it went.
meta: How to make a basketball game in three.js: swipe to throw, an arc under gravity, a rim the ball bounces off, and a basket rule that counts once.
intent: make-a-basketball-game
queries:
  - "how to make a basketball game"
  - "how to make a basketball arcade game"
  - "how to make a sports game"
  - "How can build out physical torus, such as basketry, the ball can pass in the middle or collide with it"
  - "Problems making my basketball bounce around horizontally"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make a basketball game in three.js: a throw, an arc and the rim

A basketball game, in its smallest form, is a shooting game: you throw a ball at a hoop, gravity curves the throw into an arc, the ball either drops through the ring or bounces off the metal and the board behind it, and a clock counts down while you try for as many baskets as you can. That is the arcade hoop game, and it is a good first sports game, because every part of it is something you can see. A full five-a-side match adds players who run, pass and defend, which is a much larger game; start with the shot.

This page builds the shot in one HTML file with three.js (a free JavaScript library that draws 3D in a web page) and Rapier, a physics engine (a library that works out how solid objects fall, bounce and collide). If you have never used a physics engine, [how to make a physics game](/guides/make-a-physics-game) explains what one does and how it fits into a three.js game; this page goes straight to the parts a basketball game needs.

## The five parts of a shooting game

1. **The throw.** The player swipes up on the screen. The length of the swipe sets how hard the ball is thrown, and a swipe to the left or right sends it that way.
2. **The arc.** The ball leaves the hand at a fixed angle, and gravity pulls it down a little more every frame (one picture of the game; a browser draws about 60 a second). That is all an arc is. You do not draw the curve; it comes from gravity.
3. **The rim and backboard.** The ball has to bounce off the ring's metal and off the board as a real ball would. This is the part a physics engine does well, and it is why this game uses one.
4. **The basket rule.** A basket counts when the middle of the ball crosses the height of the ring going **down**, inside the ring, and at no other time. A ball that clips the rim and falls outside does not count, and neither does one that pops up through the ring from below.
5. **The clock.** Sixty seconds, a count of baskets and shots, and a click to play again.

## The first request to type

If you are building with an AI coding agent (an assistant such as Claude Code that writes and edits the files in a project folder for you), this request asks for the game below. It names the basket rule, because a vague "count the baskets" is where first versions go wrong (see "When it breaks").

```text
Make a basketball shooting game in one index.html with three.js and the Rapier
physics engine, both loaded from a CDN with an import map. The camera is behind
the shooter, the hoop is 4 metres away at 3.05 m. Swipe up to throw: the swipe's
length sets the speed, sideways aims, the launch angle is fixed. Give the rim a
real collider so the ball bounces off it, and a backboard. Count a basket only
when the ball's centre crosses the rim's height moving down, inside the ring.
60 second round, show baskets, shots and time, click to play again.
```

## The game

Here is a page of the kind that request asks for, written and tested for this guide. Save it as `index.html`. It loads three.js and Rapier from a CDN (a public server that hosts code libraries), so there is nothing to install, but the browser still has to open it from a local web server: [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) shows how, in one command.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Hoops</title>
<style>html,body{margin:0;overflow:hidden;background:#2b2140}canvas{display:block;touch-action:none}
#hud{position:fixed;top:14px;left:0;right:0;text-align:center;font:600 22px system-ui;color:#fff;pointer-events:none}</style></head>
<body>
<div id="hud">Swipe up to shoot</div>
<script type="importmap">{"imports":{
  "three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js",
  "@dimforge/rapier3d-compat":"https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/dist/rapier.mjs"}}</script>
<script type="module">
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

await RAPIER.init();
const HAND = { x: 0, y: 2, z: 0 }, HOOP = { x: 0, y: 3.05, z: -4.2 }, RIM = 0.23, BALL = 0.12;
const POWER = 0.033, AIM = 0.006, ANGLE = 55 * Math.PI / 180, ROUND = 60 * 60; // 60 seconds of 1/60 s ticks

// Physics: a floor, a backboard, a rim and the ball.
const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
world.createCollider(RAPIER.ColliderDesc.cuboid(10, 0.1, 10).setTranslation(0, -0.1, -3).setRestitution(0.6));
world.createCollider(RAPIER.ColliderDesc.cuboid(0.9, 0.53, 0.03).setTranslation(HOOP.x, HOOP.y + 0.35, HOOP.z - RIM - 0.18).setRestitution(0.5));
// The rim's collider is the same ring three.js draws: a torus, given to Rapier as triangles.
const ring = new THREE.TorusGeometry(RIM, 0.02, 8, 32).rotateX(Math.PI / 2);
world.createCollider(RAPIER.ColliderDesc.trimesh(ring.attributes.position.array, new Uint32Array(ring.index.array))
  .setTranslation(HOOP.x, HOOP.y, HOOP.z).setRestitution(0.5));
const ball = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(HAND.x, HAND.y, HAND.z).setGravityScale(0).setCcdEnabled(true));
world.createCollider(RAPIER.ColliderDesc.ball(BALL).setRestitution(0.75).setDensity(0.5), ball);

let score = 0, shots = 0, ticks = ROUND, inFlight = 0, last = null, before = { ...HAND };

function shoot(swipeX, swipeUp) {               // a swipe in pixels: up sets the power, sideways the aim
  if (inFlight || ticks === 0 || swipeUp < 20) return;
  const speed = Math.min(swipeUp, 400) * POWER;
  ball.setGravityScale(1, true);
  ball.setLinvel({ x: swipeX * AIM, y: speed * Math.sin(ANGLE), z: -speed * Math.cos(ANGLE) }, true);
  ball.setAngvel({ x: -8, y: 0, z: 0 }, true);  // backspin
  shots++; inFlight = 1; last = null;
}

function reset() {
  ball.setGravityScale(0, true);
  ball.setTranslation(HAND, true);
  ball.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
  ball.setLinvel({ x: 0, y: 0, z: 0 }, true);
  ball.setAngvel({ x: 0, y: 0, z: 0 }, true);
  inFlight = 0;
}

function tick() {                               // one step of 1/60 s
  if (ticks === 0) return;
  ticks--;
  before = { ...ball.translation() };
  world.step();
  if (!inFlight) return;
  inFlight++;
  const p = ball.translation();
  // A basket: the ball's centre crosses the rim's height going down, inside the ring.
  if (before.y >= HOOP.y && p.y < HOOP.y && Math.hypot(p.x - HOOP.x, p.z - HOOP.z) < RIM) { score++; last = 'basket'; }
  if (inFlight > 150 || p.y < BALL + 0.05 && inFlight > 30) { if (!last) last = 'miss'; reset(); }
}

// Drawing.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2b2140);
scene.fog = new THREE.Fog(0x2b2140, 10, 30);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3, 2.4);
camera.lookAt(0, 2.5, -4);
scene.add(new THREE.HemisphereLight(0xffffff, 0x553322, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(3, 8, 4);
scene.add(sun);
const add = (geometry, color, name, x, y, z) => {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }));
  mesh.name = name; mesh.position.set(x, y, z); scene.add(mesh); return mesh;
};
add(new THREE.BoxGeometry(40, 0.2, 40), 0xc98b4f, 'floor', 0, -0.1, -3);
add(new THREE.BoxGeometry(1.8, 1.06, 0.06), 0xf2f2f2, 'backboard', HOOP.x, HOOP.y + 0.35, HOOP.z - RIM - 0.18);
add(new THREE.CylinderGeometry(0.06, 0.06, HOOP.y + 0.3), 0x666677, 'pole', HOOP.x, (HOOP.y + 0.3) / 2, HOOP.z - RIM - 0.4);
add(ring, 0xff5a1f, 'rim', HOOP.x, HOOP.y, HOOP.z);
add(new THREE.CylinderGeometry(RIM, RIM * 0.6, 0.4, 16, 1, true), 0xffffff, 'net', HOOP.x, HOOP.y - 0.2, HOOP.z).material.wireframe = true;
const ballMesh = add(new THREE.SphereGeometry(BALL, 24, 16), 0xe8661a, 'ball', 0, 0, 0);
const hud = document.getElementById('hud');

let down = null;
renderer.domElement.addEventListener('pointerdown', e => { if (ticks === 0) return restart(); down = { x: e.clientX, y: e.clientY }; });
addEventListener('pointerup', e => { if (down) shoot(e.clientX - down.x, down.y - e.clientY); down = null; });
function restart() { score = 0; shots = 0; ticks = ROUND; last = null; reset(); }

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

let then = null, owed = 0;
renderer.setAnimationLoop(now => {
  owed += then === null ? 1 / 60 : Math.min((now - then) / 1000, 0.1);
  then = now;
  while (owed >= 1 / 60 - 1e-6) { tick(); owed -= 1 / 60; }
  ballMesh.position.copy(ball.translation());
  ballMesh.quaternion.copy(ball.rotation());
  hud.textContent = ticks === 0 ? `Time! ${score} baskets from ${shots} shots. Click to play again`
    : `Baskets ${score}   Shots ${shots}   Time ${Math.ceil(ticks / 60)}`;
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100;
window.__game = {
  describe: () => ({ name: 'hoops', mouse: 'swipe up to shoot; longer is harder, sideways aims', actions: { shoot: '{ swipeX, swipeUp } in pixels' } }),
  observe: () => {
    const p = ball.translation();
    return { ball: { x: r2(p.x), y: r2(p.y), z: r2(p.z) }, score, shots, inFlight: inFlight > 0, last, timeLeft: Math.ceil(ticks / 60) };
  },
  act: ({ action, swipeX = 0, swipeUp = 0 }) => { if (action === 'shoot') shoot(swipeX, swipeUp); },
  setState: (s) => { if (s.timeLeft !== undefined) ticks = s.timeLeft * 60; },
  subject: 'ball',
};
</script>
</body></html>
```

The parts to recognise:

- **The throw** is `shoot`. The swipe's upward length in pixels times `POWER` is the speed, capped so a huge swipe cannot fire the ball out of the gym. The speed is split into an upward part and a forward part by the launch angle, `ANGLE`, with a little backspin for looks.
- **The rim** is the question one person asked on the three.js forum: how do you make a ring the ball can pass through the middle of, or hit? Rapier has balls, boxes, capsules, cylinders and more, but no ring shape, so the game hands it the ring as triangles: `TorusGeometry` makes the doughnut shape three.js draws, and `ColliderDesc.trimesh` turns the same points into a collider. What you see and what the ball hits are one shape, so the ball never bounces off empty air or passes through the metal.
- **Bounciness** is `setRestitution`: the share of its speed a ball keeps when it hits something. Rapier averages the two values of whatever touches, so the ball (0.75) off the floor (0.6) keeps a bit more than two thirds. A ball that never stops bouncing has this number set too close to 1.
- **The basket rule** is the one line in `tick` under its comment. It compares where the ball was before this step (`before`) with where it is now, so it fires once, on the one frame the ball's centre passes the ring's height on its way down.
- **The loop** runs `tick` once for every 1/60 s that has passed, then copies the ball's position from Rapier onto the orange sphere and draws. Stepping by a fixed amount keeps the ball flying at the same speed on a slow computer and a fast one.

## Why a higher arc goes in more often

Throw flat and the ball meets the ring almost sideways: from the ball's point of view the hoop is a thin slot, and a speed has to be exact to get through. Throw high and the ball drops in more steeply, the ring looks wider from above, and a wider range of speeds goes in. You can measure this instead of arguing about it. The game's own `shoot` action was played at 61 swipe lengths, one pixel apart, at five launch angles, each throw in the same page with the clock stopped:

```js
const steps = [{ state: { timeLeft: 999 } }];
for (let px = 200; px <= 260; px++) steps.push({ action: 'shoot', swipeUp: px }, { wait: 150 });
```

| Launch angle (degrees) | Baskets from the 61 swipes |
|---|---|
| 45 | 4 |
| 52 | 7 |
| 55 | 9 |
| 60 | 10 |
| 65 | 12 |

The game above uses 55, a middle choice: the steeper throws go in more often but hang in the air longer, which slows the game down. Change `ANGLE`, `POWER` and the rim's size to make the game easier or harder; these three numbers are most of what "difficulty" means in a shooting game.

## When it breaks

- **One basket scores several points.** The rule checks "is the ball inside the hoop?" every frame, and the ball is inside for several frames as it falls through. Count the crossing (above the rim on the last step, below it on this one), as the game does.
- **A ball that bounces off the rim still scores.** The same "near the hoop" rule, which cannot tell a ball passing through from one rattling on the metal. The down-crossing inside the ring tells them apart.
- **The ball passes through the rim.** The rim is drawn but has no collider, or its collider is somewhere else. Build the collider from the same geometry, at the same position.
- **Nothing happens on a phone.** Touch scrolls the page instead of reaching the game. The `touch-action:none` in the style stops that, and listening for pointer events, as this game does, covers mouse and touch with the same code.

## Let the agent throw the ball

When a shot goes wrong, all you can tell an AI is "it bounced weirdly". paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser on a paused clock, so the agent can swipe, step the game one frame at a time, and read the numbers itself. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The replies below were captured on 2026-11-01 on the game above, on a server with no graphics card where Chrome draws in software, and are shown in full. `interact` presses the mouse low on the screen, moves it up and lets go, then waits 150 frames, with `trace` following four values of the game's state every frame:

```text
interact {"steps":[{"mouse":"down","x":640,"y":600},{"mouse":"move","x":640,"y":378},{"mouse":"up","x":640,"y":378},{"wait":150}],"trace":["ball.y","ball.z","score","last"]}

{"changed":{"score":1,"shots":1,"last":"basket","timeLeft":58}}
mouse down at (640, 600): over pole (Mesh, 7.5 units)
mouse move at (640, 378): over net (Mesh, 6.5 units)
ball.y: 2 → peak 3.82 at frame 37 → low 0.26 at frame 89 → 2 at frame 90; first changed at frame 3
ball.z: 0 → low -5.93 at frame 89 → 0 at frame 90; first changed at frame 3
score: 0 → 1 at frame 63; first changed at frame 63
last: null until frame 63, then "basket"
```

The ball left the hand on frame 3, topped out at a height of 3.82 on frame 37, and scored on frame 63, once. The same steps on a fresh page give the same shot, so "did my change fix it?" has an answer.

On a version whose rule was "inside the hoop" (the ball's centre within the ring's radius of the hoop's centre, checked every frame), the same tool caught both faults from "When it breaks" in two throws through the game's `shoot` action (the first step stops the clock): a basket, then a ball that hit the rim and fell outside:

```text
interact {"steps":[{"state":{"timeLeft":999}},{"action":"shoot","swipeUp":222},{"wait":150}],"trace":["score"]}

{"changed":{"score":5,"shots":1,"last":"basket","timeLeft":997}}
score: 0 → 5 at frame 62; first changed at frame 58

interact {"steps":[{"action":"shoot","swipeUp":227},{"wait":150}],"trace":["score"]}

{"changed":{"score":10,"shots":2,"timeLeft":994}}
score: 5 → 10 at frame 63; first changed at frame 59
```

Five points for one basket, and five more for a miss. With the crossing rule the first throw scores 1 and the second scores nothing. The angle table above came from the same tool: one `interact` call per angle playing all 61 throws, read from the `score` in its reply.

paprika3d does not choose your angle or tell you whether the game is fun; it shows what each number does, and you decide by playing. It plays no sound (the headless browser has no speakers) and it runs on a desktop browser, so a phone's touch screen is emulated, not tested on a real phone.

## What to do next

- A swish sound, a flash on the rim, a shake on a basket: [how to make a game feel good](/guides/make-a-game-feel-good) and [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Keep the top score between visits: [how to save the high score](/guides/save-the-high-score).
- A goal and a goalkeeper instead of a hoop: [how to make a soccer game](/guides/make-a-soccer-game).
- Aim and power by dragging back, and a ball that rolls to a stop: [how to make a mini golf game](/guides/make-a-mini-golf-game).
- Share it: [how to put your game online](/guides/put-your-game-online).
