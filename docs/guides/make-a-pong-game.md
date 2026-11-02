---
title: How to make a pong game in three.js: the bounce and a computer paddle
phrase: how to make a pong game
description: How to make a pong game as a first game: a small three.js table pong against a computer paddle, first to five, with the ball's bounce angle set by where it hits the paddle, a speed that rises each hit, a paddle hit that a fast ball cannot skip, and a computer player that can miss; what to check when the ball misbehaves, and how an AI agent with paprika3d traces the angle and plays to a point.
meta: How to make a pong game in three.js: the paddle bounce angle, a ball that speeds up, and a computer paddle that can miss.
intent: make-a-pong-game
queries:
  - "how to make a pong game"
  - "In Pong, how do you calculate the ball's direction when it bounces off the paddle?"
  - "How to make Pong ai paddle?"
  - "Imperfect pong AI"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a pong game in three.js: the bounce and a computer paddle

Pong is a ball, two paddles and a score. You move your paddle left and right to send the ball back; the other paddle does the same; a ball past a paddle is a point to the other side. It is a good first game because it is all rules and no art, and every rule shows on screen the moment it goes wrong.

Two questions decide whether a pong game is fun, and they are the two people ask about most: how the ball's direction is chosen when it bounces off a paddle, and how to make a computer opponent that plays well but can still lose. This page answers both with a small game you can copy: table pong in 3D against the computer, first to five.

## What you need

An AI coding agent (an AI that works in a folder on your computer, writing files and running commands; Claude Code, Cursor and Codex are examples) and a web browser. The game uses three.js, a free JavaScript library that draws 3D in a web page, loaded from the internet, so there is nothing to install for the game itself. If this is your first game with an agent, [how to vibe code a game](/guides/how-to-vibe-code-a-game) explains the setup and the loop of asking for one change at a time.

## The first request to type

Name the two rules that make pong work, or the AI picks its own:

```text
Make a table pong game in 3D with three.js, in one index.html file that loads three
from a CDN with an import map. I move the near paddle with the left and right arrow
keys; the computer moves the far one. The ball bounces off the side walls. When it
hits a paddle, where it hits sets the angle: the centre sends it straight back, the
edges send it off at up to 60 degrees. It gets a little faster every hit. The
computer paddle follows the ball at a capped speed, so a fast wide ball beats it.
First to 5 wins; Space starts a new game.
```

## The game

Here is a page of the kind that request asks for, written for this guide:

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Table pong</title>
<style>html,body{margin:0;overflow:hidden;background:#10161c}#hud{position:fixed;top:14px;left:0;right:0;text-align:center;font:600 22px system-ui;color:#fff}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The table runs from z = -8 (the computer's end) to z = 8 (yours). Side walls at x = -5 and 5.
const WALL = 5, END = 8, PADDLE_HALF = 1.2, PLAYER_SPEED = 9, CPU_SPEED = 5;
const START_SPEED = 7, SPEEDUP = 1.06, MAX_ANGLE = 60 * Math.PI / 180, WIN = 5;
let player = 0, cpu = 0, ball, score = { player: 0, cpu: 0 }, over = false;
const held = new Set();

function serve(towardPlayer) { ball = { x: 0, z: 0, vx: 2, vz: towardPlayer ? START_SPEED : -START_SPEED }; }
serve(true);

// The bounce off a paddle: where the ball hits sets its angle. Centre sends it straight back, the edges send it wide.
function bounce(paddleX, dir) {
  const offset = Math.max(-1, Math.min(1, (ball.x - paddleX) / PADDLE_HALF)); // -1 at the left edge, 1 at the right
  const speed = Math.hypot(ball.vx, ball.vz) * SPEEDUP;                       // a little faster every hit
  ball.vx = speed * Math.sin(offset * MAX_ANGLE);
  ball.vz = dir * speed * Math.cos(offset * MAX_ANGLE);
}

function step(dt) {
  if (over) return;
  const dir = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
  player = Math.max(-WALL + PADDLE_HALF, Math.min(WALL - PADDLE_HALF, player + dir * PLAYER_SPEED * dt));
  // The computer follows the ball, but no faster than CPU_SPEED, so a wide fast ball beats it.
  const aim = ball.vz < 0 ? ball.x : 0;
  cpu += Math.max(-CPU_SPEED * dt, Math.min(CPU_SPEED * dt, aim - cpu));

  const z0 = ball.z;
  ball.x += ball.vx * dt; ball.z += ball.vz * dt;
  if (Math.abs(ball.x) > WALL - 0.25) { ball.x = Math.sign(ball.x) * (WALL - 0.25); ball.vx = -ball.vx; } // side walls
  // A paddle hit is the ball crossing the paddle's line this frame while over the paddle, so a fast ball cannot skip it.
  if (z0 < END - 0.5 && ball.z >= END - 0.5 && Math.abs(ball.x - player) < PADDLE_HALF + 0.25) { ball.z = END - 0.5; bounce(player, -1); }
  if (z0 > -END + 0.5 && ball.z <= -END + 0.5 && Math.abs(ball.x - cpu) < PADDLE_HALF + 0.25) { ball.z = -END + 0.5; bounce(cpu, 1); }
  if (ball.z > END + 1) { score.cpu++; serve(true); }
  if (ball.z < -END - 1) { score.player++; serve(false); }
  over = score.player >= WIN || score.cpu >= WIN;
  hud.textContent = over ? `${score.player > score.cpu ? 'You win' : 'The computer wins'} ${score.player} : ${score.cpu}. Space to play again`
    : `You ${score.player} : ${score.cpu} Computer`;
}

// The picture: a table, two paddles and a ball, seen from behind your paddle.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10161c);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 13, 15); camera.lookAt(0, 0, 1);
scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 2.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(3, 10, 4); scene.add(sun);
const table = new THREE.Mesh(new THREE.BoxGeometry(2 * WALL, 0.2, 2 * END + 2), new THREE.MeshStandardMaterial({ color: 0x1f6f5c }));
table.position.y = -0.35; table.name = 'table'; scene.add(table);
const net = new THREE.Mesh(new THREE.BoxGeometry(2 * WALL, 0.02, 0.1), new THREE.MeshStandardMaterial({ color: 0xdddddd }));
net.position.y = -0.24; net.name = 'net'; scene.add(net);
const paddle = (color, name) => { const m = new THREE.Mesh(new THREE.BoxGeometry(2 * PADDLE_HALF, 0.4, 0.3), new THREE.MeshStandardMaterial({ color })); m.name = name; scene.add(m); return m; };
const playerMesh = paddle(0x4aa3ff, 'player paddle'), cpuMesh = paddle(0xff6a4a, 'computer paddle');
const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
ballMesh.name = 'ball'; scene.add(ballMesh);
const hud = document.getElementById('hud');

function act({ key, down = true }) {
  if (down) held.add(key); else held.delete(key);
  if (down && key === 'Space' && over) { score = { player: 0, cpu: 0 }; over = false; serve(true); }
}
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  playerMesh.position.set(player, 0, END);
  cpuMesh.position.set(cpu, 0, -END);
  ballMesh.position.set(ball.x, 0, ball.z);
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100;
window.__game = {
  describe: () => ({ name: 'table pong', keys: { ArrowLeft: 'hold to move left', ArrowRight: 'hold to move right', Space: 'play again after a win' } }),
  // angle: degrees off straight down the table (0 is straight, + is to the right); speed in units a second
  observe: () => ({ player: r2(player), cpu: r2(cpu), ball: { x: r2(ball.x), z: r2(ball.z), angle: Math.round(Math.atan2(ball.vx, Math.abs(ball.vz)) * 180 / Math.PI), speed: r2(Math.hypot(ball.vx, ball.vz)) }, score: { ...score }, over }),
  act,
  setState: s => { if (s.player !== undefined) player = s.player; if (s.cpu !== undefined) cpu = s.cpu; if (s.ball) Object.assign(ball, s.ball);
    if (s.score) score = { ...score, ...s.score }; },
  subject: 'player paddle',
};
</script>
</body></html>
```

Save it as `index.html` and open it in a browser; it loads three.js from the internet, so double-clicking the file works while you are online. The `window.__game` object at the end lets a testing tool read the ball and the score; a player never sees it.

The game moves on in small steps: once per screen refresh, the browser runs the function given to `setAnimationLoop` (the game loop), which calls `step` with the time since the last frame and then draws. Every speed in the code is in units a second and is multiplied by that time, so the game runs at the same pace on a 60 Hz laptop screen and on a faster phone screen.

## How the ball's direction is chosen

The first bounce anyone writes is a mirror: when the ball hits a paddle, flip its forward speed (`vz = -vz`) and keep its sideways speed. It looks right, and it makes a dull game. The angle a ball comes in at is the angle it leaves at, so the player can block the ball but cannot aim it, and a rally can settle into the same path back and forth.

The classic fix, from the arcade original onward, is to let the **place the ball hits** choose the angle. That is the `bounce` function:

1. Measure how far from the paddle's centre the ball hit, from -1 at the left edge to 1 at the right edge (`offset`).
2. Turn that into an angle: `offset * MAX_ANGLE`, so the centre gives 0 (straight back) and the edges give 60 degrees to either side.
3. Keep the speed, times 1.06, and split it into sideways and forward parts with `sin` and `cos` of the angle.

The result is a game of skill: you aim by moving the paddle so the ball meets its edge. The speed-up makes every rally end sooner or later. The 60-degree limit matters too: at 90 the ball would travel sideways forever between the walls.

## A hit is a crossing, not an overlap

The simple check, "is the ball touching the paddle this frame?", misses a fast ball. Each frame the ball jumps forward by its speed times the frame time, and a jump can carry it from one side of a thin paddle to the other with no frame where they touch. The game above checks instead whether the ball **crossed the paddle's line** during this frame (`z0` before, `ball.z` after) while it was over the paddle. Then it puts the ball back on the line, so it cannot hit twice. A physics engine has the same problem with fast objects and its own fix for it, which [how to make a pinball game](/guides/make-a-pinball-game) covers; [collision detection without a physics engine](/guides/threejs-collision-detection-without-physics-engine) goes further on hand-written checks.

## A computer paddle that can lose

A computer paddle that sets its position to the ball's every frame never misses, and nobody wants to play it. The usual answer is to give it the same limits a person has. In this game the computer:

- moves toward the ball when the ball is coming its way, and drifts back to the centre when it is not;
- moves no faster than `CPU_SPEED`, which is slower than your paddle (`PLAYER_SPEED`).

So it returns slow balls and straight balls, and a fast ball hit wide off your paddle's edge, bouncing off a wall, outruns it. That is the "imperfect AI" people ask for, and the difficulty is one number: raise `CPU_SPEED` for a harder opponent. Other common ways to make it beatable are a short reaction delay before it starts moving, or a small random error in where it aims.

## When it breaks

- **The ball always comes back at the same angle.** The bounce is a mirror; ask for the offset rule above.
- **The ball sometimes passes through a paddle.** The hit check looks for an overlap; ask for the crossing check.
- **The ball sticks to a wall or a paddle and shakes.** The bounce flips the direction but leaves the ball inside; the next frame flips it back. Put the ball back on the wall or paddle line when it bounces, as the code above does.
- **The computer never misses.** It copies the ball's position. Cap its speed.
- **The game runs faster on one computer than another.** Speeds are added per frame instead of per second; multiply them by the frame time.

## Letting the agent play it

These are exactly the bugs you notice while playing and then struggle to put into words. paprika3d is a plugin for Claude Code (and an MCP server, a tool server other agents can use) that gives the agent a browser of its own, so it opens the game, sets the ball where it wants, and reads the angle and the score frame by frame. Two commands in the terminal install it:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The replies below were captured on 2026-10-30 on the game above, on a Linux server with no graphics card, cut to the lines this page discusses with nothing reworded. First `look`, which names what is on screen:

```text
look {}

HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "You 0 : 0 Computer" [0, 14, 1279, 38].
On screen (5):
table 27% [320, 187, 959, 765] 18 × 10 units
player paddle 0.42% [565, 678, 714, 706] 2.4 × 0.4 units, across the view
computer paddle 0.13% [600, 187, 679, 203] 2.4 × 0.4 units, across the view
net 0.12% [425, 377, 854, 379] 10 × 0.1 units, across the view
ball 0.036% [631, 363, 651, 384]
```

Then the bounce rule, tested twice with `interact`: the ball placed straight in front of the paddle's centre, then 0.9 to the right of it, with `trace` following the ball's angle and speed each frame:

```text
interact {"steps":[{"state":{"player":0,"ball":{"x":0,"z":4,"vx":0,"vz":7}}},{"wait":40}],"trace":["ball.angle","ball.speed"]}

{"changed":{"ball":{"x":0,"z":6.26,"angle":0,"speed":7.42}}}
ball.angle: 0 throughout the 40 frames
ball.speed: 7 → 7.42 at frame 30; first changed at frame 30

interact {"steps":[{"state":{"player":0,"ball":{"x":0.9,"z":4,"vx":0,"vz":7}}},{"wait":40}],"trace":["ball.angle","ball.speed"]}

{"changed":{"cpu":0.83,"ball":{"x":1.77,"z":6.63,"angle":45}}}
ball.angle: 0 → 45 at frame 30; first changed at frame 30
ball.speed: 7 → 7.42 at frame 30; first changed at frame 30
```

The centre hit went straight back; the hit three quarters of the way to the edge left at 45 degrees, which is three quarters of 60. Both came off faster, 7 to 7.42, which is the 1.06 of `SPEEDUP`. With a mirror bounce, the second trace would read 0 throughout, and the agent would see it without anyone describing it.

Next, whether the computer can lose. `until` plays frame by frame until the state holds: here, until you have a point, after a fast ball hit wide off the paddle's edge:

```text
interact {"steps":[{"state":{"player":0,"cpu":0,"ball":{"x":1.1,"z":4,"vx":0,"vz":9}}},{"until":{"score.player":1},"max":600}],"trace":["ball.angle","ball.x","cpu"],"expect":{"score.player":1,"score.cpu":0}}

{"changed":{"cpu":2.41,"ball":{"x":0,"z":0,"angle":16,"speed":7.28},"score":{"player":1}}}
until: score.player == 1 held at frame 204
ball.angle: 0 → peak 55 at frame 23 → low -55 at frame 52 → 16 at frame 204; first changed at frame 23
ball.x: 1.1 → peak 4.75 at frame 51 → low -4.75 at frame 125 → 0 at frame 204; first changed at frame 24
cpu: 0 → peak 3.33 at frame 63 → low -2.93 at frame 139 → 2.41 at frame 204; first changed at frame 24
Expect: score.player 1 ✓ · score.cpu 0 ✓
```

The ball left at 55 degrees, hit the right wall, then the left, and the computer, chasing it at its capped speed, was 2.41 away on the wrong side when it went past. Last, the end of the game: the computer one point from winning, played until the game is over, then Space:

```text
interact {"steps":[{"state":{"score":{"cpu":4},"player":0,"ball":{"x":3,"z":4,"vx":0,"vz":7}}},{"until":{"over":true},"max":300},{"key":"Space"}],"expect":{"over":false,"score.cpu":0}}

{"changed":{"ball":{"x":0.03,"z":0.12}}}
until: over == true held at frame 42
Expect: over false ✓ · score.cpu 0 ✓
```

The game ended at five and Space reset the score. Each of these calls can be kept with `save` and rerun after every later change, so a new feature that breaks the bounce shows up at once.

What it does not do: it does not decide whether `CPU_SPEED` makes a fair opponent or a frustrating one. It shows what the code does; you play a few games and choose.

## Two players instead of the computer

Pong began as a two-player game. Put a second paddle on other keys (A and D, say) in place of the computer's code, and two people share one keyboard; [how to make a 2 player game](/guides/make-a-2-player-game) covers reading two sets of keys at once.

## What to do next

- A hit sound and a flash when the ball meets a paddle: [how to make a game feel good](/guides/make-a-game-feel-good).
- A proper end screen in place of the line of text: [how to add a game over screen](/guides/add-a-game-over-screen).
- Bounces worked out by a physics engine instead of by hand: [how to make a physics game](/guides/make-a-physics-game).
