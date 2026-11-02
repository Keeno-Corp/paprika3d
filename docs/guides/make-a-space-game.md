---
title: How to make a space game in three.js: a ship, invaders and bullets
phrase: how to make a space game
description: How to make a space game in the style of Space Invaders: a ship that moves and fires, a formation of invaders that walks sideways and steps down at each edge, bullets from both sides kept in lists and removed when they leave the screen, waves as data and three lives, with how Asteroids, Galaga and bullet hell games change those parts. Shown on a small three.js game, with an AI coding agent playing a wave to the end and finding bullets that were never removed with paprika3d.
meta: How to make a space game in three.js: a ship, a formation of invaders that steps down, bullets from both sides, waves and lives. A game to paste.
intent: make-a-space-game
queries:
  - "how to make a space game"
  - "how to make a space invaders game"
  - "how to make asteroids game"
  - "how to make a bullet hell game"
  - "How do I write a wave-spawning system for a shoot-em-up?"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a space game in three.js: a ship, invaders and bullets

A space shooter is a ship, enemies and bullets. In the Space Invaders shape, which this page builds, the ship sits at the bottom of the screen, moves left and right and fires upward. Above it, a formation of invaders walks sideways as one block; each time it reaches an edge it steps down and turns around, and now and then an invader fires down at the ship. Shoot every invader to bring the next wave; lose three lives, or let the formation reach the ship, and the game ends.

Asteroids, Galaga and bullet hell games are built from the same parts arranged differently; the section after the game says how.

## The parts, in plain words

1. **The ship.** A position that the left and right arrow keys change while they are held. Holding Space fires a shot, then waits a short reload time before the next, so a held key gives a steady stream instead of one shot every frame (one picture of the game; a browser draws about 60 a second).
2. **The formation.** One position for the whole block, plus each invader's place inside it. Each frame the block moves sideways; when its outermost invader passes the edge, the block steps down and the direction turns around. Moving the block, not each invader, keeps the rows straight. With fewer invaders left the block walks faster, which is what makes the end of a wave tense.
3. **Bullets from both sides.** Two lists: the ship's shots going up, the invaders' shots coming down. Each frame every bullet moves, is tested against what it can hit, and is removed when it hits something or leaves the screen. The lowest invader in each column is the one that fires, so shots never come out of the back of the block.
4. **Waves.** The formations are data: a list of rows, columns, walking speed and how often one fires. Clearing a wave loads the next. [How to make a zombie game](/guides/make-a-zombie-game) goes further into wave lists and spawning enemies over time.
5. **Lives.** A hit costs a life and gives the ship a moment in which it cannot be hit again, shown by blinking, so two bullets together do not cost two lives.

## The game: star invaders

Arrow keys move, Space fires; after the end, Space plays again. three.js, a JavaScript library that draws 3D in a web page, draws it, and the whole game is one HTML file. The import map line near the top tells the browser where three.js is (a `node_modules/three` folder next to the file, which `npm install three` makes); [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains the other parts of such a page and how to open it.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Star invaders</title>
<style>html,body{margin:0;overflow:hidden;background:#000}canvas{display:block}#hud{position:fixed;top:16px;left:20px;font:600 22px system-ui;color:#fff}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// Each wave is a formation: rows and columns of invaders, how fast it walks, how often one fires.
const WAVES = [
  { rows: 3, cols: 6, speed: 1.2, fireEvery: 1.2 },
  { rows: 4, cols: 7, speed: 1.5, fireEvery: 0.9 },
  { rows: 5, cols: 8, speed: 1.8, fireEvery: 0.7 },
];
const EDGE = 6, SHIP_Y = 0.8, SHIP_SPEED = 7;
const SHOT_SPEED = 14, ENEMY_SHOT_SPEED = 6, RELOAD = 0.25;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060f);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 2, 15);
camera.lookAt(0, 6, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x202040, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(2, 5, 10);
scene.add(sun);
const starPositions = [];
for (let i = 0; i < 400; i++) starPositions.push((Math.random() - 0.5) * 80, (Math.random() - 0.3) * 50, -20 - Math.random() * 30);
const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 0.15 }));
stars.name = 'stars';
scene.add(stars);

const ship = new THREE.Group();
ship.name = 'ship';
const hull = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 12), new THREE.MeshStandardMaterial({ color: 0x60d0ff }));
const wings = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, 0.3), new THREE.MeshStandardMaterial({ color: 0x3080c0 }));
wings.position.y = -0.25;
ship.add(hull, wings);
scene.add(ship);

const ROW_COLOURS = [0xff5070, 0xffa040, 0xffe040, 0x70e070, 0xc080ff];
const invaderGeometry = new THREE.BoxGeometry(0.7, 0.45, 0.4);
const shotGeometry = new THREE.BoxGeometry(0.08, 0.4, 0.08);
const shotMaterial = new THREE.MeshBasicMaterial({ color: 0x80ffff }), enemyShotMaterial = new THREE.MeshBasicMaterial({ color: 0xff6040 });

let wave, invaders, fx, fy, dir, shots, enemyShots, shipX, lives, score, reload, fireTimer, hurt, over, won;
const held = new Set();
function act({ key, down = true }) { if (down) held.add(key); else held.delete(key); }
addEventListener('keydown', e => { if (e.code === 'Space' && (over || won)) start(); else act({ key: e.code }); });
addEventListener('keyup', e => act({ key: e.code, down: false }));

function clear(list) { list.forEach(o => scene.remove(o.mesh)); return []; }
function loadWave(n) {
  wave = n;
  const w = WAVES[n - 1];
  invaders = clear(invaders ?? []);
  shots = clear(shots ?? []);
  enemyShots = clear(enemyShots ?? []);
  fx = 0; fy = 10; dir = 1; fireTimer = w.fireEvery;
  for (let r = 0; r < w.rows; r++) for (let c = 0; c < w.cols; c++) {
    const mesh = new THREE.Mesh(invaderGeometry, new THREE.MeshStandardMaterial({ color: ROW_COLOURS[r] }));
    mesh.name = 'invader';
    scene.add(mesh);
    invaders.push({ dx: (c - (w.cols - 1) / 2) * 1.1, dy: r * 0.8, mesh });   // its place in the formation
  }
  showScore();
}
function start() { shipX = 0; lives = 3; score = 0; reload = 0; hurt = 0; over = won = false; loadWave(1); }
const hud = document.getElementById('hud');
function showScore() {
  hud.textContent = won ? `All waves cleared! Score ${score}` : over ? `Game over: ${score}. Space to play again`
    : `Wave ${wave}   Score ${score}   Lives ${lives}`;
}

function fire(list, x, y, material) {
  const mesh = new THREE.Mesh(shotGeometry, material);
  mesh.name = material === shotMaterial ? 'shot' : 'enemy shot';
  scene.add(mesh);
  list.push({ x, y, mesh });
}
const remove = (list, o) => { scene.remove(o.mesh); list.splice(list.indexOf(o), 1); };

function step(dt) {
  if (over || won) return;
  const w = WAVES[wave - 1];
  // the ship: held arrows move it, held Space fires once per RELOAD seconds
  const move = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
  shipX = Math.max(-EDGE, Math.min(EDGE, shipX + move * SHIP_SPEED * dt));
  reload -= dt;
  if (held.has('Space') && reload <= 0) { fire(shots, shipX, SHIP_Y + 0.5, shotMaterial); reload = RELOAD; }

  // the formation walks sideways; at an edge it steps down and turns; fewer invaders walk faster
  const speed = w.speed * (1 + 2 * (1 - invaders.length / (w.rows * w.cols)));
  fx += dir * speed * dt;
  const xs = invaders.map(i => fx + i.dx);
  if (Math.max(...xs) > EDGE + 0.5 && dir > 0 || Math.min(...xs) < -EDGE - 0.5 && dir < 0) { dir = -dir; fy -= 0.5; }
  if (fy <= SHIP_Y + 0.5) { over = true; showScore(); return; }

  // an invader at the bottom of a column fires down at the ship
  fireTimer -= dt;
  if (fireTimer <= 0) {
    fireTimer = w.fireEvery;
    const low = invaders.filter(i => !invaders.some(o => o.dx === i.dx && o.dy < i.dy));
    const shooter = low[Math.floor(Math.random() * low.length)];
    fire(enemyShots, fx + shooter.dx, fy + shooter.dy - 0.4, enemyShotMaterial);
  }

  for (const s of [...shots]) {
    s.y += SHOT_SPEED * dt;
    const hit = invaders.find(i => Math.abs(fx + i.dx - s.x) < 0.4 && Math.abs(fy + i.dy - s.y) < 0.35);
    if (hit) { remove(invaders, hit); remove(shots, s); score += 10; showScore(); }
    else if (s.y > 13) remove(shots, s);                         // gone off the top: remove it, or the list grows forever
  }
  for (const s of [...enemyShots]) {
    s.y -= ENEMY_SHOT_SPEED * dt;
    if (hurt <= 0 && Math.abs(s.x - shipX) < 0.5 && Math.abs(s.y - SHIP_Y) < 0.4) {
      remove(enemyShots, s);
      lives--; hurt = 1.5;                                         // a second and a half without being hit again
      if (lives === 0) over = true;
      showScore();
    } else if (s.y < -1) remove(enemyShots, s);
  }
  hurt -= dt;

  if (!invaders.length) {
    if (wave < WAVES.length) loadWave(wave + 1); else { won = true; showScore(); }
  }
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
start();
let last = null;
renderer.setAnimationLoop((now) => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  ship.position.set(shipX, SHIP_Y, 0);
  ship.visible = hurt <= 0 || Math.floor(hurt * 10) % 2 === 0;    // blink while hurt
  for (const i of invaders) i.mesh.position.set(fx + i.dx, fy + i.dy, 0);
  for (const s of [...shots, ...enemyShots]) s.mesh.position.set(s.x, s.y, 0);
  renderer.render(scene, camera);
});

const round = list => list.map(s => ({ x: +s.x.toFixed(2), y: +s.y.toFixed(2) }));
window.__game = {
  describe: () => ({ name: 'star invaders', units: 'units', keys: { ArrowLeft: 'move left', ArrowRight: 'move right', Space: 'fire (hold to keep firing)' } }),
  observe: () => ({ wave, invaders: invaders.length, formation: { x: +fx.toFixed(2), y: +fy.toFixed(2) }, ship: { x: +shipX.toFixed(2) }, lives, score, shots: round(shots), enemyShots: round(enemyShots), over, won }),
  act,
  setState: (s) => {
    if (s.wave) loadWave(s.wave);
    if (s.ship) shipX = s.ship.x ?? shipX;
    if (s.lives !== undefined) lives = s.lives;
  },
  subject: 'ship',
};
</script>
</body></html>
```

`WAVES` at the top is the whole difficulty curve. `step` is the game loop's work, the code that runs before every frame: the ship, then the formation, then the invaders' fire, then both bullet lists, then the check for a cleared wave. Each invader stores `dx` and `dy`, its place in the block; its position on screen is the block's position plus that place.

## Other space games from the same parts

- **Asteroids.** The ship turns with left and right and thrusts forward with up, keeping its speed when you let go; anything leaving one edge of the screen comes back on the opposite one. Rocks drift, and a shot rock splits into two smaller ones until the smallest are destroyed.
- **Galaga.** The formation hovers instead of walking, and invaders leave it one or two at a time, diving at the ship along curved paths before flying back to their place.
- **Bullet hell.** The enemies fire many bullets in patterns (rings, spirals, aimed fans) and the ship has a small hit area. With hundreds of bullets, draw them with one InstancedMesh instead of one mesh each; [too many meshes in three.js](/guides/threejs-too-many-meshes-merge-or-instance) explains how.

## When it does not work

- **The game slows down after a few minutes.** Bullets that leave the screen are never removed, so the lists and the scene grow without end. Remove each bullet when it goes off screen.
- **The rows drift apart.** Each invader moves and checks the edge on its own, so they turn at different times. Move one formation position and place every invader from it.
- **The formation drops several rows at once at an edge.** It steps down on every frame it is past the edge. Turn and step down when it is past the edge and still heading outward, as the `dir > 0` and `dir < 0` checks do.
- **Holding Space fires a solid beam.** There is no reload time between shots.
- **Invaders shoot through each other.** Pick the shooter from the lowest invader of each column.
- **Two bullets take two lives at once.** Give the ship a short time after a hit when it cannot be hit.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes and edits the files of your project) can write this from one message. Ask for the formation as one block and for bullets to be removed, the two things a quick version tends to skip:

```text
Make a Space Invaders style game in one HTML file with three.js, seen from the front.
The ship moves with the arrow keys and fires while Space is held, with a short reload.
The invaders are one formation: move one block position sideways, place each invader from it,
and when the block passes an edge, step it down and turn it around. It walks faster as invaders die.
The lowest invader of a random column fires down every so often. Keep the ship's shots and the
invaders' shots in two lists and remove each bullet when it hits or leaves the screen.
Three waves defined as data (rows, columns, speed, fire rate), three lives with a short safe time
after a hit, and the wave, score and lives at the top left.
```

[How to build a three.js game with an AI agent](/guides/ai-agent-build-threejs-game) covers the steps around it, and [vibe coding bugs](/guides/vibe-coding-bugs) shows how to keep the agent from breaking what already worked as the game grows.

## Let the agent play a wave

The agent writes the waves and the bullets but cannot play them, and a game that slows down after a few minutes is hard to describe. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can look at it and play it. Its `interact` tool holds keys across frames, and the `until` step keeps playing until the game's state says something is true. Here the ship stays in the middle with Space held until the second wave arrives:

```text
interact {"steps": [{"key": "Space", "down": true}, {"until": {"wave": 2}, "max": 3000}, {"key": "Space", "down": false}], "trace": ["lives", "invaders"]}

{"changed":{"wave":2,"invaders":28,"formation":{"x":0.03},"score":180}}
until: wave == 2 held at frame 687
Trace (the first 600 frames):
lives: 3 throughout the 600 frames
invaders: 18 → 2 at frame 511; first changed at frame 36
```

The first wave can be cleared: the 18 invaders went one by one as the block walked over the ship's line of fire, and the 28 of wave two loaded at frame 687. The opposite play, a ship that never fires, shows the invaders' bullets reach it:

```text
interact {"steps": [{"until": {"over": true}, "max": 3000}], "trace": ["formation.y", "lives"]}

{"changed":{"formation":{"x":0.9,"y":9},"lives":0,"enemyShots":[{"x":-1.87,"y":8.4}],"over":true}}
until: over == true held at frame 797
Trace (the first 600 frames):
formation.y: 10 → 9 at frame 564; first changed at frame 188
lives: 3 → 1 at frame 586; first changed at frame 230
```

The first hit came at frame 230 and the game was over at frame 797, after the block had stepped down twice. `observe` reads the whole state, bullets included, plus the harness's own count of objects in the scene. After ten seconds of holding Space (600 frames):

```text
interact {"steps": [{"key": "Space", "down": true}, {"wait": 600}, {"key": "Space", "down": false}]}

observe {}

{"wave":1,"invaders":2,"formation":{"x":4.7,"y":8.5},"ship":{"x":0},"lives":3,"score":160,"shots":[{"x":0,"y":10.87},{"x":0,"y":7.37},{"x":0,"y":3.87}],"enemyShots":[{"x":1.5,"y":0.7},{"x":4.36,"y":7.9}],"over":false,"won":false,"harness":{"frame":602,"renderer":{"calls":10,"triangles":120,"textures":1,"geometries":5,"programs":3},"scene":{"objects":13,"meshes":9,"lights":2,"cameras":0},"errors":[],"changed":null}}
```

Three of the ship's shots in flight and nine meshes in the scene. The same play on a first version that removed a shot when it hit an invader but not when it left the top of the screen:

```text
{"wave":1,"invaders":2,"formation":{"x":4.7,"y":8.5},"ship":{"x":0},"lives":3,"score":160,"shots":[{"x":0,"y":119.37},{"x":0,"y":115.63},{"x":0,"y":108.17},{"x":0,"y":104.43},{"x":0,"y":100.7},{"x":0,"y":93.23},{"x":0,"y":85.77},{"x":0,"y":70.83},{"x":0,"y":67.1},{"x":0,"y":63.37},{"x":0,"y":59.87},{"x":0,"y":56.37},{"x":0,"y":52.87},{"x":0,"y":49.37},{"x":0,"y":42.37},{"x":0,"y":31.87},{"x":0,"y":24.87},{"x":0,"y":21.37},{"x":0,"y":17.87},{"x":0,"y":14.37},{"x":0,"y":10.87},{"x":0,"y":7.37},{"x":0,"y":3.87}],"enemyShots":[{"x":1.5,"y":0.7},{"x":4.36,"y":7.9}],"over":false,"won":false,"harness":{"frame":602,"renderer":{"calls":11,"triangles":132,"textures":1,"geometries":5,"programs":3},"scene":{"objects":33,"meshes":29,"lights":2,"cameras":0},"errors":[],"changed":null}}
```

Twenty-three shots, one of them at a height of 119.37, far above the top of the screen at 13, and 29 meshes where there should be 9. Nothing on screen shows it: the missed shots fly on out of sight. Over a long game the list and the scene keep growing and every frame gets slower. The agent reads the count, adds the missing removal and plays the same ten seconds again.

These replies were captured on 2026-10-31 on a machine with no graphics card, where Chrome draws in software. paprika3d does not decide whether a wave is too easy or the game is fun; it plays what you or the agent choose and reports the state. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Next steps

- A shield or a double shot for a few seconds: [how to add power ups to a game](/guides/add-power-ups-to-a-game).
- Explosions and a shake when an invader dies: [how to make a game feel good](/guides/make-a-game-feel-good).
- A laser sound and a hit sound, made in code: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- An end screen and a high score: [how to add a game over screen](/guides/add-a-game-over-screen) and [how to save the high score](/guides/save-the-high-score).
- Two more arcade games built the same way: [how to make a breakout game](/guides/make-a-breakout-game) and [how to make a flappy bird game](/guides/make-a-flappy-bird-game).
- Flying through hoops in place of fighting invaders: [how to make a plane game](/guides/make-a-plane-game).
