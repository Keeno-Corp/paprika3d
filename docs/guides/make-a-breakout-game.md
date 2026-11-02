---
title: How to make a breakout game in three.js: bricks, a paddle and the bounce
phrase: how to make a breakout game
description: How to make a breakout game (a brick breaker): a ball that moves in a straight line, walls that turn it back, a wall of bricks where the side the ball hit decides which way it bounces, a paddle that sends it back at an angle set by where it lands, and three lives. Shown on a small three.js game, with an AI coding agent tracing a hit on a brick's side, catching a ball that cuts through a whole row, and checking a rally's brick count with paprika3d.
meta: How to make a breakout game in three.js: which side of a brick the ball hit, a paddle that aims by where it lands, three lives. A game to paste.
intent: make-a-breakout-game
queries:
  - "how to make a breakout game"
  - "how to make a brick breaker game"
  - "Breakout Collision: Detecting the side of collision"
  - "A more sophisticated ball-paddle collision algorithm for Breakout?"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a breakout game in three.js: bricks, a paddle and the bounce

A breakout game (also called a brick breaker) is a ball, a paddle at the bottom and a wall of bricks at the top. The ball moves in a straight line. The side walls and the ceiling send it back. A brick the ball touches disappears and turns the ball around, and the way it turns depends on which side of the brick it touched. The paddle sends the ball back up at an angle that depends on where on the paddle it lands, which is how the player aims. A ball that falls past the paddle costs a life; clear every brick to win.

Two questions come up again and again on game development forums, one of them with almost 19,000 views: how to tell which side of a brick the ball hit, and how to make the paddle bounce better than a mirror. This page answers both, with a complete game to paste.

## The ball: a position and a velocity

The ball has a position (`x`, `y`) and a velocity (`vx`, `vy`), its speed sideways and up or down. Each frame (one picture of the game; a browser draws about 60 a second) the velocity moves the position. A bounce changes the sign of one part of the velocity: the left and right walls turn `vx` around, the ceiling turns `vy` around. [How to make a pong game](/guides/make-a-pong-game) builds that kind of bounce from the start; this page is about the two parts breakout adds.

## Which side of the brick did the ball hit?

When the ball overlaps a brick, measure how far it has gone in from the side and from above or below. The ball came in through the side it has gone into least:

- Overlap sideways: half the brick's width plus the ball's radius, less the distance between their centres across.
- Overlap up and down: half the brick's height plus the radius, less the distance between their centres up and down.
- If the sideways overlap is smaller, the ball hit the left or right side: turn `vx` around. Otherwise it hit the top or bottom: turn `vy` around.

Then push the ball back out by that overlap, so it is not still inside the brick on the next frame, and set the direction outright (`vx = Math.sign(dx) * Math.abs(vx)`) instead of flipping it, so a ball touching two bricks at once is not turned around twice. The function `hitBrick` in the game below does exactly this.

The common first version turns `vy` around on every brick hit, whatever side. It works while the ball hits bricks from below, which is most of the time, and goes wrong as soon as the ball comes in from the side: the ball turns up or down but keeps going sideways into the next brick, and cuts through a whole row. The checks further down show it happening.

## The paddle: where it lands sets the angle

A paddle that bounces like a wall gives the player no control. Instead, measure where the ball landed: a number from -1 at the left end to 1 at the right end, 0 in the middle. Multiply it by the largest angle you want (60 degrees here) and send the ball off at that angle from straight up, at its usual speed. The middle sends it straight up, the ends send it off to the side, and the player aims by moving under the ball.

Keeping the angle below 90 degrees matters: a ball that goes almost sideways bounces between the walls for a long time without coming down.

## The game: brick wall

The arrow keys move the paddle. three.js, a JavaScript library that draws 3D in a web page, draws it, and the whole game is one HTML file. The import map line near the top tells the browser where three.js is (a `node_modules/three` folder next to the file, which `npm install three` makes); [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains the other parts of such a page and how to open it.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Brick wall</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}#hud{position:fixed;top:16px;left:20px;font:600 22px system-ui;color:#fff}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const BALL = 0.15;            // the ball's radius
const SPEED = 8;              // the ball's speed, in units per second
const PADDLE_W = 1.6, PADDLE_SPEED = 9;
const BRICK_W = 1.2, BRICK_H = 0.4;
const LEFT = -5, RIGHT = 5, TOP = 11, PADDLE_Y = 0.5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141826);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3, 13);
camera.lookAt(0, 5.6, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x303050, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(2, 6, 8);
scene.add(sun);

const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5070 });
for (const [x, y, w, h, d] of [[LEFT - 0.25, 5.6, 0.5, 12.2, 0.6], [RIGHT + 0.25, 5.6, 0.5, 12.2, 0.6], [0, TOP + 0.25, 10.4, 0.5, 0.56]]) {
  const side = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMaterial);
  side.name = 'frame';
  side.position.set(x, y, 0);
  scene.add(side);
}
const back = new THREE.Mesh(new THREE.PlaneGeometry(10, 12), new THREE.MeshStandardMaterial({ color: 0x20263a }));
back.name = 'back';
back.position.set(0, 5.5, -0.3);
scene.add(back);
const paddle = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, PADDLE_W - 0.3, 4, 12).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe8e8f0 }));
paddle.name = 'paddle';
scene.add(paddle);
const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL, 20, 14), new THREE.MeshStandardMaterial({ color: 0xffd040, emissive: 0x403000 }));
ball.name = 'ball';
scene.add(ball);

const ROW_COLOURS = [0x40a0ff, 0x40e080, 0xffc040, 0xff5060];
let bricks = [];
function buildWall() {
  bricks.forEach(b => scene.remove(b.mesh));
  bricks = [];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(BRICK_W, BRICK_H, 0.5), new THREE.MeshStandardMaterial({ color: ROW_COLOURS[row] }));
    mesh.name = 'brick';
    const b = { x: -3.25 + col * 1.3, y: 8 + row * 0.5, mesh };
    mesh.position.set(b.x, b.y, 0);
    scene.add(mesh);
    bricks.push(b);
  }
}

const held = new Set();
function act({ key, down = true }) { if (down) held.add(key); else held.delete(key); }
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));

const hud = document.getElementById('hud');
let px, x, y, vx, vy, lives, score, wait, lastHit, over, won;
function serve() {
  x = px; y = PADDLE_Y + 0.4; wait = 1;                         // the ball waits one second on the paddle
  vx = SPEED * Math.sin(0.35); vy = SPEED * Math.cos(0.35);
}
function reset() {
  px = 0; lives = 3; score = 0; lastHit = null; over = won = false;
  buildWall();
  serve();
  showScore();
}
function showScore() {
  hud.textContent = won ? `You win! ${score}` : over ? `Game over: ${score}. Space to play again` : `Score ${score}   Lives ${lives}`;
}
addEventListener('keydown', e => { if (e.code === 'Space' && (over || won)) reset(); });

// Which side of the brick the ball hit: the one it has gone into least.
function hitBrick() {
  for (const b of bricks) {
    const dx = x - b.x, dy = y - b.y;
    const overlapX = BRICK_W / 2 + BALL - Math.abs(dx), overlapY = BRICK_H / 2 + BALL - Math.abs(dy);
    if (overlapX <= 0 || overlapY <= 0) continue;
    if (overlapX < overlapY) {                                     // a left or right side
      x += Math.sign(dx) * overlapX;
      vx = Math.sign(dx) * Math.abs(vx);
      lastHit = dx < 0 ? 'left side' : 'right side';
    } else {                                                       // the top or the bottom
      y += Math.sign(dy) * overlapY;
      vy = Math.sign(dy) * Math.abs(vy);
      lastHit = dy < 0 ? 'bottom' : 'top';
    }
    scene.remove(b.mesh);
    bricks.splice(bricks.indexOf(b), 1);
    score += 10;
    showScore();
    if (!bricks.length) { won = true; showScore(); }
    return;                                                        // one brick per move
  }
}

function hitPaddle() {
  if (vy > 0 || y - BALL > PADDLE_Y + 0.15 || y < PADDLE_Y || Math.abs(x - px) > PADDLE_W / 2 + BALL) return;
  // where it lands sets the angle: the middle sends it straight up, the ends up to 60 degrees to the side
  const t = Math.max(-1, Math.min(1, (x - px) / (PADDLE_W / 2)));
  vx = SPEED * Math.sin(t * Math.PI / 3);
  vy = SPEED * Math.cos(t * Math.PI / 3);
  y = PADDLE_Y + 0.15 + BALL;
  lastHit = 'paddle';
}

function step(dt) {
  if (over || won) return;
  const dir = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
  px = Math.max(LEFT + PADDLE_W / 2, Math.min(RIGHT - PADDLE_W / 2, px + dir * PADDLE_SPEED * dt));
  if (wait > 0) { wait -= dt; x = px; return; }
  const n = Math.ceil(SPEED * dt / BALL);                          // small moves, so the ball cannot skip a brick
  for (let i = 0; i < n; i++) {
    x += vx * dt / n; y += vy * dt / n;
    if (x < LEFT + BALL) { x = LEFT + BALL; vx = Math.abs(vx); }
    if (x > RIGHT - BALL) { x = RIGHT - BALL; vx = -Math.abs(vx); }
    if (y > TOP - BALL) { y = TOP - BALL; vy = -Math.abs(vy); }
    hitBrick();
    hitPaddle();
  }
  if (y < -1) {
    lives--;
    if (lives === 0) over = true; else serve();
    showScore();
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
  paddle.position.set(px, PADDLE_Y, 0);
  ball.position.set(x, y, 0);
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'brick wall', units: 'units', keys: { ArrowLeft: 'paddle left', ArrowRight: 'paddle right', Space: 'play again after the end' } }),
  observe: () => ({ bricks: bricks.length, score, lives, ball: { x: +x.toFixed(2), y: +y.toFixed(2), vx: +vx.toFixed(2), vy: +vy.toFixed(2) }, paddle: { x: +px.toFixed(2) }, lastHit, over, won }),
  act,
  setState: (s) => {
    if (s.ball) { ({ x = x, y = y, vx = vx, vy = vy } = s.ball); wait = 0; }
    if (s.paddle) px = s.paddle.x ?? px;
    if (s.lives !== undefined) lives = s.lives;
  },
  subject: 'ball',
};
</script>
</body></html>
```

`step` is the work of the game loop, the function the browser calls before every frame. It moves the paddle, then moves the ball in small pieces so that a fast ball cannot jump over a brick, and checks the walls, the bricks and the paddle after each piece. `hitBrick` returns after the first brick, so one move breaks one brick. `serve` puts the ball back on the paddle for a second after a lost life.

## When it does not work

- **The ball cuts through a row of bricks.** Every hit turns `vy` around; check which side was hit, as above.
- **The ball sticks to the paddle and shakes.** The bounce flips `vy` each frame while the ball is still inside the paddle. Bounce when the ball is moving down and not when it is already going up, and set `vy` upward rather than flipping it.
- **The ball passes through bricks when it is fast.** It moves further in one frame than a brick is thick. Move it in smaller steps, as `step` does.
- **The ball bounces sideways forever.** The angle off the paddle can reach 90 degrees. Cap it, as the 60-degree limit here does.
- **Two bricks break at once and the ball goes the wrong way.** It was turned around once per brick. Stop after the first brick in a move, or set the direction instead of flipping it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes and edits the files of your project) can write this game from one message. Name the two rules above, because they are the ones a quick version gets wrong:

```text
Make a breakout game in one HTML file with three.js: a wall of 4 rows of 6 bricks,
a paddle moved with the arrow keys, a ball, and three lives.
When the ball hits a brick, find which side it hit by comparing how far it overlaps the brick
across and up and down: the smaller overlap is the side. Turn vx around for a side hit and
vy for a top or bottom hit, push the ball out, and break one brick per move.
On the paddle, set the bounce angle from where the ball lands: straight up in the middle,
up to 60 degrees at the ends. Move the ball in small steps so it cannot skip a brick.
Show the score and lives at the top left.
```

[How to build a three.js game with an AI agent](/guides/ai-agent-build-threejs-game) covers the steps around it, and [my ChatGPT three.js code is not working](/guides/chatgpt-threejs-code-not-working) helps when the page it gives you stays blank.

## Let the agent check the bounce

The agent writes the bounce but cannot see it, and a ball cutting through a row is easy to miss in code and obvious on screen. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can look at it and play it. Its `interact` tool sets a moment up, plays it frame by frame and, with `trace`, writes down values on every frame. Here the ball starts to the left of the wall of bricks, moving right and a little up, so it meets the left side of the bottom-left brick:

```text
interact {"steps": [{"state": {"ball": {"x": -4.5, "y": 8.1, "vx": 7.8, "vy": 1.8}}}, {"until": {"bricks": 23}, "max": 60}, {"wait": 20}], "trace": ["ball.x", "ball.vx", "bricks"]}

{"changed":{"bricks":22,"score":20,"ball":{"x":-4.78,"y":8.82,"vx":-7.8,"vy":1.8},"lastHit":"left side"}}
Motion (ball): travelled 2.93 units (0.803 from start to end), its direction of travel turned 180° left.
until: bricks == 23 held at frame 3
ball.x: -4.37 → peak -4 at frame 3 → low -4.85 at frame 10 → -4.78 at frame 33; first changed at frame 1
ball.vx: 7.8 → -7.8 at frame 17; first changed at frame 3
bricks: 24 → 22 at frame 17; first changed at frame 3
```

The ball reached -4 (the brick's left edge less the ball's radius) at frame 3, broke the brick and turned back left, hit the side wall at frame 10 and broke a second brick, again on its left side, at frame 17. The same steps on a first version that turned `vy` around on every hit:

```text
{"changed":{"bricks":19,"score":50,"ball":{"x":-1.38,"y":8.52,"vx":7.8,"vy":-1.8},"lastHit":"brick"}}
until: bricks == 23 held at frame 3
ball.x: -4.37 → -1.38 at frame 23; first changed at frame 1
ball.vx: 7.8 throughout the 23 frames
bricks: 24 → 19 at frame 23; first changed at frame 3
```

`vx` never changed, and five bricks went in 23 frames as the ball cut along the row. Those lines are enough for the agent to find the cause and fix it without anyone describing the bug.

`expect` checks values after the steps, with one ✓ or ✗ each. A set rally from the start: wait for the serve, hold the right arrow to get under the ball, wait for the paddle hit, then play on:

```text
interact {"steps": [{"wait": 70}, {"key": "ArrowRight", "frames": 40}, {"until": {"lastHit": "paddle"}, "max": 400}, {"wait": 150}], "trace": ["bricks", "ball.vx"], "expect": {"lives": 3, "bricks": [0, 23]}}

{"changed":{"bricks":21,"score":30,"ball":{"x":4.59,"y":1.85,"vx":-3.84,"vy":7.02},"paddle":{"x":4.2},"lastHit":"paddle"}}
Motion (ball): travelled 34.4 units (4.69 from start to end), its direction of travel turned 180° left.
until: lastHit == "paddle" held at frame 170
bricks: 24 → 21 at frame 241; first changed at frame 115
ball.vx: 2.74 → peak 5.34 at frame 170 → low -5.34 at frame 172 → -3.84 at frame 316; first changed at frame 168
Expect: lives 3 ✓ · bricks 21 ✓
```

The paddle caught the ball near its right end at frame 170 and sent it off to the right (`vx` 5.34, further to the side than the serve's 2.74), the rally broke three bricks, and no life was lost. With `save` and a name added, the same call is kept as a check that runs again after every edit; [how to test a three.js game with Claude Code](/guides/test-threejs-game-claude-code) shows how.

These replies were captured on 2026-10-31 on a machine with no graphics card, where Chrome draws in software. paprika3d does not decide how fast the ball should be or whether the game is fun; it plays the moments you or the agent set up and reports what the ball did. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Next steps

- A wider paddle or a slower ball for a few seconds: [how to add power ups to a game](/guides/add-power-ups-to-a-game).
- A new wall when this one is cleared: [how to make levels in a game](/guides/make-levels-in-a-game).
- Bricks that burst and a ball that sounds when it hits: [how to make a game feel good](/guides/make-a-game-feel-good) and [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- A proper end screen after the last life: [how to add a game over screen](/guides/add-a-game-over-screen).
- Another arcade game, with things that shoot back: [how to make a space game](/guides/make-a-space-game).
