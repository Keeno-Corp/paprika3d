---
title: How to make a mini golf game in three.js: drag, putt and roll
phrase: how to make a mini golf game
description: How to make a mini golf game in the browser: drag back from the ball to aim and set the power, let go to putt, the ball slows at a steady rate as it rolls, bounces off walls with some speed lost, drops into the cup when slow enough, and strokes are counted per hole. Shown on a small three-hole three.js game, with an AI coding agent putting it by mouse drag and finding a ball that never stops with paprika3d.
meta: How to make a mini golf game in three.js: drag back to aim and set power, roll to a stop, bounce off walls, sink the putt. Three holes to paste.
intent: make-a-mini-golf-game
queries:
  - "how to make a mini golf game"
  - "three js golf game"
  - "javascript golf game"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a mini golf game in three.js: drag, putt and roll

A mini golf game is a ball, a putt and a roll. The player presses on the screen, drags back away from where the ball should go and lets go: the direction of the drag aims the shot and its length sets the power. The ball then rolls, slowing a little every moment until it stops, bounces off the walls it meets, and drops into the cup if it arrives slowly enough. Count one stroke per putt, move to the next hole when the ball is in, and that is the whole game.

Golf games are a common thing to build with an AI agent and three.js, a JavaScript library that draws 3D in a web page; Hacker News has a thread about one built in a night with Claude Code. This page shows what such a game needs, with a complete one to paste.

## The rules that make it play like golf

1. **Aim and power from a drag.** The game needs to know where on the green the mouse or finger is. A raycaster does that: it sends a ray from the camera through the point on the screen and finds where the ray meets the ground. The line from that point to the ball is the shot's direction, and its length, capped at a maximum, is the power.
2. **Rolling to a stop.** Each second the ball loses the same amount of speed (`ROLL` in the code), so it rolls a set distance and stops dead, the way a real ball on short grass does. A faster putt rolls further: double the speed and the ball goes four times as far, which is why short putts need a gentle drag.
3. **Walls bounce.** When the ball touches a wall, the part of its speed going into the wall is turned around and some of it is lost (`BOUNCE` keeps that share). The part along the wall is kept, so a ball hit at an angle glances off at the same angle.
4. **The cup.** The ball drops in when it is over the cup and slower than `SINK_SPEED`. A ball that arrives faster rolls over it, as a hard putt does in real golf.
5. **Strokes and holes.** One stroke per putt, a new putt when the ball is still, and after the cup the next hole. The card lists each hole's strokes and the total at the end.

## The game: three-hole putt

Drag back from the ball and let go. The first hole is straight, the second has a wall to go around, the third has two. The whole game is one HTML file. The import map line near the top tells the browser where three.js is (a `node_modules/three` folder next to the file, which `npm install three` makes); [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains the other parts of such a page and how to open it.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Three-hole putt</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block;touch-action:none}#hud{position:fixed;top:16px;left:20px;font:600 22px system-ui;color:#fff;text-shadow:0 2px 4px #0008}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// Each hole: where the ball starts, where the cup is, and walls as [x, z, width, depth].
const HOLES = [
  { start: [0, 4.5], cup: [0, -4], walls: [] },
  { start: [1.5, 4.5], cup: [1.5, -4], walls: [[0.6, 0, 4.8, 0.3]] },
  { start: [-2, 4.5], cup: [2, -4.5], walls: [[-1, 1.5, 4, 0.3], [1, -1.5, 4, 0.3]] },
];
const BORDER = [[0, -6.15, 6.6, 0.3], [0, 6.15, 6.6, 0.3], [-3.15, 0, 0.3, 12], [3.15, 0, 0.3, 12]];
const BALL = 0.15;       // the ball's radius
const MAX_SPEED = 12;    // a full-power putt, in units per second
const MAX_PULL = 3;      // dragging this far back is full power
const ROLL = 4;          // rolling slows the ball by this many units per second, every second
const BOUNCE = 0.7;      // a wall gives back this share of the speed
const CUP = 0.3;         // the cup's radius
const SINK_SPEED = 4;    // faster than this, the ball rolls over the cup

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b8e0);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 14, 10);
camera.lookAt(0, 0, 1.2);
scene.add(new THREE.HemisphereLight(0xffffff, 0x50704a, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(4, 10, 6);
scene.add(sun);

const grass = new THREE.Mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3f7a3a }));
grass.name = 'grass';
grass.position.y = -0.01;
scene.add(grass);
const green = new THREE.Mesh(new THREE.PlaneGeometry(6, 12).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5cc85a }));
green.name = 'green';
scene.add(green);
const cup = new THREE.Mesh(new THREE.CircleGeometry(CUP, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x111111 }));
cup.name = 'cup';
cup.position.y = 0.005;
const flag = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.02), new THREE.MeshStandardMaterial({ color: 0xff3040 }));
flag.name = 'flag';
flag.position.set(0.2, 1.3, 0);
const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4), new THREE.MeshStandardMaterial({ color: 0xffffff }));
pole.position.y = 0.7;
cup.add(flag, pole);
scene.add(cup);
const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL, 20, 14), new THREE.MeshStandardMaterial({ color: 0xffffff }));
ball.name = 'ball';
scene.add(ball);
const aim = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 1).translate(0, 0, -0.5), new THREE.MeshBasicMaterial({ color: 0xffee55 }));
aim.name = 'aim';
aim.visible = false;
scene.add(aim);
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8a5a3a });
let wallGroup = null, walls = [];

const hud = document.getElementById('hud');
let hole = 1, strokes = 0, card = [], x = 0, z = 0, vx = 0, vz = 0, sunk = 0, done = false, aiming = false, pull = null;

function load(n) {
  hole = n; strokes = 0; vx = vz = 0; sunk = 0;
  const h = HOLES[n - 1];
  [x, z] = h.start;
  cup.position.set(h.cup[0], 0.005, h.cup[1]);
  if (wallGroup) scene.remove(wallGroup);
  wallGroup = new THREE.Group();
  walls = [...BORDER, ...h.walls];
  for (const [wx, wz, w, d] of walls) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), wallMaterial);
    wall.name = 'wall';
    wall.position.set(wx, 0.15, wz);
    wallGroup.add(wall);
  }
  scene.add(wallGroup);
  showScore();
}
function showScore() {
  hud.textContent = done ? `Done: ${card.join(' + ')} = ${card.reduce((a, b) => a + b, 0)} strokes` : `Hole ${hole} of ${HOLES.length}   Strokes ${strokes}`;
}

// The mouse or a finger on the screen, as a point on the ground.
const raycaster = new THREE.Raycaster(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function groundPoint(e) {
  raycaster.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  return raycaster.ray.intersectPlane(groundPlane, new THREE.Vector3());
}
const moving = () => Math.hypot(vx, vz) > 0;

// Press anywhere, drag back away from where you want the ball to go, let go to putt.
addEventListener('pointerdown', e => { if (!moving() && !sunk && !done) { aiming = true; pull = null; } });
addEventListener('pointermove', e => {
  if (!aiming) return;
  const p = groundPoint(e);
  pull = { dx: x - p.x, dz: z - p.z };                          // from the pointer to the ball: the shot's direction
  const length = Math.min(Math.hypot(pull.dx, pull.dz), MAX_PULL);
  aim.visible = length > 0.05;
  aim.position.set(x, 0.02, z);
  aim.rotation.y = Math.atan2(-pull.dx, -pull.dz);
  aim.scale.z = length;
});
addEventListener('pointerup', () => {
  if (!aiming) return;
  aiming = false;
  aim.visible = false;
  const length = pull ? Math.hypot(pull.dx, pull.dz) : 0;
  if (length < 0.05) return;                                     // a click without a drag is no shot
  const speed = Math.min(length, MAX_PULL) / MAX_PULL * MAX_SPEED;
  vx = pull.dx / length * speed;
  vz = pull.dz / length * speed;
  strokes++;
  showScore();
});

function bounceOffWalls() {
  for (const [wx, wz, w, d] of walls) {
    // the point of the wall nearest the ball's centre; closer than the radius is a hit
    const nx = Math.max(wx - w / 2, Math.min(x, wx + w / 2)), nz = Math.max(wz - d / 2, Math.min(z, wz + d / 2));
    const dx = x - nx, dz = z - nz, dist = Math.hypot(dx, dz);
    if (dist >= BALL || dist === 0) continue;
    const ux = dx / dist, uz = dz / dist;                         // the wall's face direction at the hit
    x = nx + ux * BALL; z = nz + uz * BALL;                       // push the ball back out
    const along = vx * ux + vz * uz;
    if (along < 0) { vx -= (1 + BOUNCE) * along * ux; vz -= (1 + BOUNCE) * along * uz; }
  }
}

function step(dt) {
  if (sunk) {
    sunk += dt;
    if (sunk > 1) {                                               // one second in the cup, then the next hole
      card.push(strokes);
      if (hole < HOLES.length) load(hole + 1); else { done = true; sunk = 0; showScore(); }
    }
    return;
  }
  const speed = Math.hypot(vx, vz);
  if (speed === 0) return;
  const slower = Math.max(0, speed - ROLL * dt);                  // rolling slows it at a steady rate
  vx *= slower / speed; vz *= slower / speed;
  const n = Math.ceil(slower * dt / (BALL / 2));                 // small moves, so a fast ball cannot pass through a wall
  for (let i = 0; i < n; i++) { x += vx * dt / n; z += vz * dt / n; bounceOffWalls(); }
  if (Math.hypot(x - cup.position.x, z - cup.position.z) < CUP && Math.hypot(vx, vz) < SINK_SPEED) {
    sunk = dt; vx = vz = 0; x = cup.position.x; z = cup.position.z;
  }
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
load(1);
let last = null;
renderer.setAnimationLoop((now) => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  ball.position.set(x, sunk ? -0.1 : BALL, z);
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'three-hole putt', units: 'units', controls: 'drag back from the ball and let go to putt' }),
  observe: () => ({ hole, strokes, card, ball: { x: +x.toFixed(2), z: +z.toFixed(2), speed: +Math.hypot(vx, vz).toFixed(2) }, moving: moving(), inCup: sunk > 0, done }),
  setState: (s) => {
    if (s.hole) load(s.hole);
    if (s.ball) { x = s.ball.x ?? x; z = s.ball.z ?? z; vx = vz = 0; }
  },
  subject: 'ball',
};
</script>
</body></html>
```

`HOLES` is the course: a start, a cup and a list of walls per hole, as numbers. To add a hole, add a line; [how to make levels in a game](/guides/make-levels-in-a-game) explains that way of building levels. The constants under it are the feel: raise `ROLL` for slow, shaggy grass, lower `BOUNCE` for soft walls, raise `SINK_SPEED` to make the cup more forgiving. `step` runs once per frame (one picture of the game; a browser draws about 60 a second), and moves the ball in small pieces so that a fast ball always meets the wall in front of it.

## When it does not work

- **The ball never stops, and the next putt never comes.** The rolling multiplies the speed by a number such as 0.98 each frame. That shrinks it forever without reaching zero, so the game waits for a ball that is still creeping. Take a fixed amount off instead, as `ROLL` does, or set the speed to zero below a small value.
- **The ball goes the wrong way.** The shot uses the direction from the ball to the pointer. It should be the other way: the ball goes away from where you pulled.
- **The ball goes through a wall.** At high speed it can move further in one frame than the wall is thick. Move it in smaller steps, as `step` does here; [how to make a pinball game](/guides/make-a-pinball-game) goes into this problem, called tunnelling.
- **Dragging on a phone scrolls the page.** The canvas needs `touch-action: none` in its style, as it has here. [How to make a mobile game with AI](/guides/make-a-mobile-game-with-ai) covers the rest of a phone.
- **A second putt starts while the ball rolls.** Check that the ball is still before a drag can begin.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes and edits the files of your project) can build this from one message. Say how the putt and the roll should behave, because a vague request such as "make a golf game" leaves those choices to chance:

```text
Make a three-hole mini golf game in one HTML file with three.js, seen from above at an angle.
Press anywhere, drag back away from where the ball should go and let go to putt:
the drag's direction aims and its length sets the power, up to a maximum, with an aim line while dragging.
The ball loses a fixed amount of speed per second and stops dead; it bounces off walls,
keeping 70 percent of the speed into the wall. It drops into the cup only if it is slower than a limit.
Putting is only allowed when the ball is still. Count strokes per hole, show them at the top left,
go to the next hole one second after the ball drops, and show the card at the end.
```

[How to build a three.js game with an AI agent](/guides/ai-agent-build-threejs-game) covers the steps around it: where the file goes, how to open it, how to ask for the next change.

## Let the agent putt it

The agent writes the code but cannot see the course or try a putt, so a putt that never ends or a cup that never catches the ball reaches you first. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can look at it and play it. Its `interact` tool presses, moves and releases the mouse at points on the screen, and its `until` step keeps playing until the game's state says something is true. A gentle putt on the first hole, the ball at (640, 579) on screen, pulled back to (640, 680):

```text
interact {"steps": [{"mouse": "down", "x": 640, "y": 579}, {"mouse": "move", "x": 640, "y": 680}, {"mouse": "up", "x": 640, "y": 680}, {"until": {"moving": false}, "max": 600}], "trace": ["ball.z", "ball.speed"]}

{"changed":{"strokes":1,"ball":{"z":0.11}}}
until: moving == false held at frame 92
mouse move at (640, 680): over wall (Mesh, 14.3 units)
ball.z: 4.5 → 0.11 at frame 88; first changed at frame 3
ball.speed: 0 → peak 5.89 at frame 3 → 0 at frame 92; first changed at frame 3
```

One stroke, and the ball stopped halfway to the cup at -4. A longer pull, to (640, 760):

```text
{"changed":{"strokes":1,"ball":{"z":-4.36}}}
Motion (ball): travelled 11.8 units (8.86 from start to end), its direction of travel turned 180° right.
until: moving == false held at frame 136
mouse move at (640, 760): over grass (Mesh, 14.3 units)
ball.z: 4.5 → low -5.84 at frame 83 → -4.36 at frame 133; first changed at frame 3
ball.speed: 0 → peak 10.33 at frame 3 → 0 at frame 136; first changed at frame 3
```

Too hard: the ball crossed the cup, hit the back wall (the low of -5.84 is where the ball's edge met it), turned 180° and stopped just short of the cup on the way back. That is the rule about speed at the cup working. A pull to (640, 725), with `until` waiting for the ball to drop:

```text
interact {"steps": [{"mouse": "down", "x": 640, "y": 579}, {"mouse": "move", "x": 640, "y": 725}, {"mouse": "up", "x": 640, "y": 725}, {"until": {"inCup": true}, "max": 600}], "trace": ["ball.z", "ball.speed"]}

{"changed":{"strokes":1,"ball":{"z":-4},"inCup":true}}
until: inCup == true held at frame 92
mouse move at (640, 725): over grass (Mesh, 14.4 units)
ball.z: 4.5 → -4 at frame 92; first changed at frame 3
ball.speed: 0 → peak 8.44 at frame 3 → 0 at frame 92; first changed at frame 3
```

A hole in one. On a first version whose rolling was `speed * 0.98` each frame, the gentle putt gave:

```text
{"changed":{"strokes":1,"ball":{"z":-0.37},"moving":true}}
Motion (ball): travelled 4.87 units, it stopped at frame 151 and did not move again.
until: not met in 600 frames (moving true, expected false)
mouse move at (640, 680): over wall (Mesh, 14.3 units)
Trace (the first 600 frames):
ball.z: 4.5 → -0.37 at frame 374; first changed at frame 3
ball.speed: 0 → peak 5.84 at frame 3 → 0 at frame 353; first changed at frame 3
```

The ball looks still from frame 151 and its speed rounds to 0, yet the game still says it is moving after 600 frames, so the next putt would never be allowed. A person sees a game that stops answering the mouse; the agent sees the reason in one reply and changes the rolling to a fixed loss per second.

These replies were captured on 2026-10-31 on a machine with no graphics card, where Chrome draws in software. paprika3d does not design holes or judge whether one is too hard; it plays the putts you or the agent choose and reports what the ball did. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## When a physics engine is worth it

On a flat green with straight walls, the few lines above are all the physics there is. Slopes, ramps, round bumpers, a windmill that turns, or a ball that jumps off a step need a physics engine, a library that moves solid objects and works out their collisions. Rapier is one that works with three.js. paprika3d's `threejs-game` skill comes with a package, game-state, that runs a deterministic build of Rapier, so the same putt rolls the same way on every run and a check stays true; [how to make a physics game](/guides/make-a-physics-game) shows how to add it.

## Next steps

- Keep the lowest card between visits: [how to save the high score](/guides/save-the-high-score).
- Make the ball dropping in feel like something: [how to make a game feel good](/guides/make-a-game-feel-good).
- A thrown ball with an arc instead of a rolling one: [how to make a basketball game](/guides/make-a-basketball-game).
- Keep the putts as checks that run after every edit: [how to test a three.js game with Claude Code](/guides/test-threejs-game-claude-code).
- Share the course: [how to put your game online](/guides/put-your-game-online).
