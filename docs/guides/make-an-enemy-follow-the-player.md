---
title: How to make an enemy follow the player in three.js: chasing around walls
phrase: how to make an enemy follow the player
description: How to make an enemy follow the player in a browser game: the few lines that move an enemy straight at the player, why that sticks the enemy against the first wall, and a breadth-first search on a grid that finds the way around, shown in a small three.js maze where three ghosts chase you, with an AI agent playing the chase and checking that no path goes through a wall.
meta: How to make an enemy follow the player in three.js: why a straight chase sticks on walls, and a grid path search that goes around them.
intent: make-an-enemy-follow-the-player
queries:
  - "how to make an enemy follow the player"
  - "Problems making enemy follow moving player"
  - "How does A* pathfinding work?"
  - "how to make a pac man game"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make an enemy follow the player in three.js: chasing around walls

An enemy follows the player by moving a small step toward the player's position every frame (one picture of the game; a browser draws about sixty a second). On open ground that is the whole answer, three lines of code. It stops working the moment a wall stands between them: the enemy walks into the wall and stays there, pressed against it, because it knows no way to the player but the straight line. To get around walls the enemy needs **pathfinding**: a search through the open spaces of the level for a route to the player, which it then walks one step at a time. On a level made of squares, a search called breadth-first search does this in about twenty lines, and this page builds it into a small maze game you can paste and play.

## The straight chase, and why it gets stuck

three.js is a JavaScript library that draws 3D in a web page; in it, every object has a `position`. The straight chase takes the arrow from the enemy to the player, makes it one unit long, and moves the enemy along it by its speed times the time since the last frame (`dt`, in seconds):

```js
const toPlayer = player.position.clone().sub(enemy.position).setY(0).normalize();
enemy.position.addScaledVector(toPlayer, speed * dt);
```

Use this for an enemy in an open field, a bee after the player, a homing missile. Inside walls it fails in a way that looks like a bug and is not one: the enemy does exactly what it was told. Put a wall between it and the player and every step that goes around the wall first takes it further from the player, so it never takes that step. A Stack Overflow question titled "Problems making enemy follow moving player" is this problem in a top-down game.

## Find a path: breadth-first search on a grid

Many small games are laid out on a grid already: a maze, a dungeon, a city of blocks. Write the level as rows of characters, `#` for a wall and `.` for floor (the [levels guide](/guides/make-levels-in-a-game) explains this way of writing a level), and each character is one square the enemy can stand on or not.

Breadth-first search starts at the enemy's square and spreads out like water: first every open square next to it, then every open square next to those, and so on, writing down for each square which square it was reached from. When the spreading reaches the player's square, follow those notes backwards, from the player to the enemy, and you have the shortest route, square by square. It never steps into a `#`, because walls are never added to the spreading. The game below has it as the function `findPath`.

A* (said "A star") is the same search with one change: it tries the squares nearer the target first, so on a large map it looks at fewer squares before it finds the way. On a maze of a few hundred squares, breadth-first search is fast enough to run for every enemy twice a second. A 3D level that is not a grid uses a navigation mesh instead, a set of flat shapes covering everywhere an enemy can walk, searched the same way; libraries such as three-pathfinding do that for three.js.

## Three rules that make a chase fair

1. **Search again often.** The player moves, so a route found once goes stale. Searching twice a second keeps it fresh without searching on every frame.
2. **Make the enemy a little slower than the player.** Here the player walks 5 squares a second and the ghosts 3.5. A chaser at the same speed can never be escaped; one too slow is never a threat.
3. **Give the player a break.** In the classic arcade maze games, ghosts chase for a while, then scatter to their own corners for a few seconds, then chase again. That rhythm is what makes running and hiding possible. Here it is 7 seconds chasing and 3 scattering.

## A maze where three ghosts chase you

Collect the four green gems in the corners with the arrow keys; a ghost that touches you ends the round, and R starts again. The whole game is one HTML file. The import map line near the top tells the browser where three.js is (a `node_modules/three` folder next to the file, which `npm install three` makes), and [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains the other parts of such a page. Each ghost draws its current route on the floor in its own colour, so you can watch the search change as you move.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Ghost maze</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}#hud{position:fixed;top:16px;left:20px;font:600 22px system-ui;color:#fff}</style></head>
<body>
<div id="hud">Gems 0 / 4</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// # wall, . floor, * gem, P player start, g ghost start.
const MAZE = [
  '#############',
  '#*....#....*#',
  '#.##.###.##.#',
  '#.#..g.g..#.#',
  '#.#.#####.#.#',
  '#.....P.....#',
  '#.###.#.###.#',
  '#...#.g.#...#',
  '#.#.#.#.#.#.#',
  '#*....#....*#',
  '#############',
];
const W = MAZE[0].length, H = MAZE.length;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isWall = (x, z) => (MAZE[z]?.[x] ?? '#') === '#';
const cellsOf = (ch) => MAZE.flatMap((row, z) => [...row].flatMap((c, x) => c === ch ? [{ x, z }] : []));

// Breadth-first search: spread out from the start one step at a time, remembering where each cell was reached from.
function findPath(from, to) {
  const key = (c) => c.z * W + c.x;
  const cameFrom = new Map([[key(from), null]]);
  const queue = [from];
  while (queue.length) {
    const c = queue.shift();
    if (c.x === to.x && c.z === to.z) break;
    for (const [dx, dz] of DIRS) {
      const n = { x: c.x + dx, z: c.z + dz };
      if (!isWall(n.x, n.z) && !cameFrom.has(key(n))) { cameFrom.set(key(n), c); queue.push(n); }
    }
  }
  if (!cameFrom.has(key(to))) return [from];
  const path = [];
  for (let c = to; c; c = cameFrom.get(key(c))) path.unshift(c);
  return path; // every cell from the ghost to the target, walls never included
}

const held = new Set();
function act({ key, down = true }) {
  if (down) held.add(key); else held.delete(key);
  if (key === 'r' && down && over) reset();
}
addEventListener('keydown', e => act({ key: e.key }));
addEventListener('keyup', e => act({ key: e.key, down: false }));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10121c);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(W / 2 - 0.5, 13, H / 2 + 4.5);
camera.lookAt(W / 2 - 0.5, 0, H / 2 - 0.5);
scene.add(new THREE.HemisphereLight(0xffffff, 0x303050, 2.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(3, 10, 6);
scene.add(sun);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, H).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x23263a }));
floor.name = 'floor';
floor.position.set(W / 2 - 0.5, 0, H / 2 - 0.5);
scene.add(floor);
const wallGeometry = new THREE.BoxGeometry(1, 0.8, 1), wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3048c0 });
for (const { x, z } of cellsOf('#')) {
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.name = 'wall';
  wall.position.set(x, 0.4, z);
  scene.add(wall);
}

const player = { mesh: new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 16), new THREE.MeshStandardMaterial({ color: 0xffd030 })) };
player.mesh.name = 'player';
scene.add(player.mesh);
const ghosts = cellsOf('g').map((start, i) => {
  const color = [0xff4050, 0xff90d0, 0x40e0ff][i];
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.3, 4, 12), new THREE.MeshStandardMaterial({ color }));
  mesh.name = 'ghost';
  const line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color }));
  line.name = 'path';
  scene.add(mesh, line);
  const home = cellsOf('*')[i]; // the corner it runs to when it scatters
  return { start, home, mesh, line };
});
const gemGeometry = new THREE.OctahedronGeometry(0.22), gemMaterial = new THREE.MeshStandardMaterial({ color: 0x40ff90, emissive: 0x108040 });
const hud = document.getElementById('hud');

let mode = 'path';   // 'straight' walks at the player in a straight line; 'path' searches the maze
let time, gems, over, won, replanIn;

function reset() {
  const p = cellsOf('P')[0];
  Object.assign(player, { x: p.x, z: p.z, to: { ...p } });
  for (const g of ghosts) Object.assign(g, { x: g.start.x, z: g.start.z, to: { ...g.start }, path: [] });
  for (const gem of scene.children.filter(o => o.name === 'gem')) scene.remove(gem);
  for (const { x, z } of cellsOf('*')) {
    const gem = new THREE.Mesh(gemGeometry, gemMaterial);
    gem.name = 'gem';
    gem.position.set(x, 0.4, z);
    scene.add(gem);
  }
  time = 0; gems = 0; over = false; won = false; replanIn = 0;
  hud.textContent = 'Gems 0 / 4';
}

// Moves a walker toward the cell it is heading to; on arrival, choose() names the next cell (or null to wait).
function walk(m, speed, dt, choose) {
  const dx = m.to.x - m.x, dz = m.to.z - m.z, d = Math.hypot(dx, dz), move = speed * dt;
  if (d > move) { m.x += dx / d * move; m.z += dz / d * move; return; }
  m.x = m.to.x; m.z = m.to.z;
  const next = choose(m);
  if (next) m.to = next;
}

function playerNext(m) {
  const gem = scene.children.find(o => o.name === 'gem' && o.position.x === m.x && o.position.z === m.z);
  if (gem) { scene.remove(gem); gems++; hud.textContent = `Gems ${gems} / 4`; }
  const dx = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
  const dz = dx ? 0 : (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0);
  return (dx || dz) && !isWall(m.x + dx, m.z + dz) ? { x: m.x + dx, z: m.z + dz } : null;
}

function ghostNext(g) {
  if (mode === 'straight') {
    // the open neighbour nearest the player in a straight line, only if it is nearer than here
    const far = (c) => Math.hypot(c.x - player.to.x, c.z - player.to.z);
    let best = null;
    for (const [dx, dz] of DIRS) {
      const n = { x: g.x + dx, z: g.z + dz };
      if (!isWall(n.x, n.z) && far(n) < far(best ?? g)) best = n;
    }
    return best;
  }
  g.path.shift();       // the cell just reached
  return g.path[0] ?? null;
}

const phase = () => time % 10 < 7 ? 'chase' : 'scatter'; // 7 s chasing, then 3 s back to their corners

function step(dt) {
  if (over) return;
  time += dt;
  replanIn -= dt;
  if (replanIn <= 0 && mode === 'path') {
    replanIn = 0.5;   // search again twice a second, so the ghosts follow a player who moves
    for (const g of ghosts) {
      g.path = findPath(g.to, phase() === 'chase' ? player.to : g.home);
      g.line.geometry.dispose();
      g.line.geometry = new THREE.BufferGeometry().setFromPoints(g.path.map(c => new THREE.Vector3(c.x, 0.05, c.z)));
    }
  }
  walk(player, 5, dt, playerNext);
  for (const g of ghosts) walk(g, 3.5, dt, ghostNext);
  if (gems === 4) { over = won = true; hud.textContent = 'You win! Press R to play again'; }
  else if (ghosts.some(g => Math.hypot(g.x - player.x, g.z - player.z) < 0.6)) { over = true; hud.textContent = 'Caught! Press R to try again'; }
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
  player.mesh.position.set(player.x, 0.35, player.z);
  for (const g of ghosts) g.mesh.position.set(g.x, 0.45, g.z);
  renderer.render(scene, camera);
});

const round = (v) => +v.toFixed(2);
window.__game = {
  describe: () => ({ name: 'ghost maze', units: 'maze cells', keys: { ArrowRight: 'move right', ArrowLeft: 'move left', ArrowUp: 'move up', ArrowDown: 'move down', r: 'restart after the round ends' } }),
  observe: () => ({
    mode, phase: phase(), gems, caught: over && !won, won,
    player: { x: round(player.x), z: round(player.z) },
    ghosts: ghosts.map(g => ({ x: round(g.x), z: round(g.z) })),
    nearest: round(Math.min(...ghosts.map(g => Math.hypot(g.x - player.x, g.z - player.z)))),
  }),
  act,
  setState: (s) => { reset(); if (s.mode) mode = s.mode; if (s.time) time = s.time; },
  maze: MAZE,
  paths: () => ghosts.map(g => g.path),
  subject: player.mesh,
};
</script>
</body></html>
```

The maze is the `MAZE` rows at the top. `findPath` is the breadth-first search. Every half second, `step` searches again from each ghost to the player (or, while scattering, to the ghost's corner), and `walk` moves everyone from square to square. `ghostNext` holds both ways of chasing: change `let mode = 'path'` to `'straight'` and the ghosts go back to walking straight at you, which is the quickest way to see why the search is needed.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes and edits the files of your project) can add a chasing enemy to your game. Name the walls and the search, or it may write the straight chase:

```text
Add an enemy that chases the player around the walls of my maze. Treat the level as a
grid of squares and use breadth-first search to find the shortest path from the enemy's
square to the player's, never through a wall, moving only up, down, left or right.
Search again twice a second. Make the enemy a little slower than the player, and every
10 seconds let it go back to its corner for 3 seconds. Draw its current path on the
floor while I test, and end the round when it touches the player.
```

Up, down, left or right heads off a common slip: a search allowed to step diagonally lets enemies slip across the corners of walls, which looks like walking through them.

## Let the agent play the chase

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs the game in a hidden Chrome browser so the agent can see and play what it wrote. Its `interact` tool plays keys on exact frames and reports what changed in the game's state; `trace` follows values frame by frame, and an `until` step plays on until the state matches.

The straight chase first, with the player standing still:

```text
interact {"steps":[{"state":{"mode":"straight"}},{"wait":240}],"trace":["nearest","ghosts.0.x","ghosts.2.x"]}

{"changed":{"mode":"straight","ghosts":[{"x":6,"z":3},{"x":6,"z":3},{"x":6,"z":7}]}}
nearest: 2 throughout the 240 frames
ghosts.0.x: 5 → 6 at frame 18; first changed at frame 1
ghosts.2.x: 6 throughout the 240 frames
```

In 240 frames the nearest ghost never gets closer than 2 squares. The first two ghosts end on the same square, above the wall in the middle of the maze (the first gets there at frame 18), and the third never leaves its square below that wall. The same game with the search:

```text
interact {"steps":[{"state":{"mode":"path"}},{"until":{"caught":true},"max":600}],"trace":["nearest"]}

{"changed":{"mode":"path","caught":true,"ghosts":[{"x":3,"z":4.41},{"x":9,"z":4.41},{"x":6.59,"z":5}],"nearest":0.59}}
until: caught == true held at frame 61
nearest: 2 → peak 2.24 at frame 18 → 0.59 at frame 61; first changed at frame 3
```

The search sends the ghosts around the walls and one catches the player at frame 61. The distance rises before it falls, which is the ghost stepping away to go around. Can a player who runs get away and reach a gem?

```text
interact {"steps":[{"state":{}},{"key":"ArrowLeft","frames":62},{"key":"ArrowUp","frames":60}],"trace":["gems","nearest"],"expect":{"gems":1,"caught":false}}

{"changed":{"gems":1,"caught":false,"player":{"x":1,"z":1},"ghosts":[{"x":1,"z":4.18},{"x":4.18,"z":3},{"x":3.18,"z":5}],"nearest":3.18}}
Motion (player): travelled 9 units (6.4 from start to end), its direction of travel turned 90° right; it stopped at frame 111 and did not move again.
gems: 0 → 1 at frame 111; first changed at frame 111
nearest: 2 → low 1.5 at frame 48 → peak 3.82 at frame 111 → 3.18 at frame 122; first changed at frame 2
Expect: gems 1 ✓ · caught false ✓
```

The closest call is at frame 48, and the gem is reached at frame 111. After that run, `eval`, which runs code inside the game, checked the route each ghost was following: that each square is floor and that each step goes to a square beside the last, never across a corner:

```text
eval {"code":"const { maze, paths } = window.__game; return paths().map((path, i) => ({ ghost: i, cells: path.length, intoWall: path.some(c => maze[c.z][c.x] === '#'), badStep: path.some((c, k) => k > 0 && Math.abs(c.x - path[k - 1].x) + Math.abs(c.z - path[k - 1].z) !== 1) }))"}

[{"ghost":0,"cells":4,"intoWall":false,"badStep":false},{"ghost":1,"cells":6,"intoWall":false,"badStep":false},{"ghost":2,"cells":7,"intoWall":false,"badStep":false}]
```

On a version whose search could also step diagonally (four more entries in `DIRS`), the `until` step above ended at frame 39 instead of frame 61, and the same check, run right after it, answered:

```text
[{"ghost":0,"cells":4,"intoWall":false,"badStep":true},{"ghost":1,"cells":4,"intoWall":false,"badStep":true},{"ghost":2,"cells":1,"intoWall":false,"badStep":false}]
```

No route goes into a wall square, so a quick look at the screen finds nothing wrong, yet two of the three routes take a diagonal step, and a diagonal step in a maze slides a ghost across the corner of a wall. That is how the ghosts arrived sooner. One more catch, from this page's own first draft: it reused one line geometry for each ghost's route, and `interact`'s reply carried this warning from three.js until each search made a new one:

```text
"logs":["warn: THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry. (×5)"]
```

These replies were captured on 2026-10-30 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not write the enemy or choose its speed, and it cannot tell you whether a chase is fair or exciting; you find that out by playing. The route check is a few lines the agent writes for this game, not a built-in test. To add paprika3d to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Without paprika3d

Keep the route lines on the floor while you build; a ghost whose line goes through a wall, or that has no line, shows the problem at once. Add a key that freezes the ghosts, so you can walk around and look at their routes from every side. Remove the lines when the chase works.

## Next steps

- An enemy that chases you once it has seen you: [how to make a stealth game](/guides/make-a-stealth-game).
- Many enemies coming in waves: [how to make a zombie game](/guides/make-a-zombie-game).
- Enemies that follow one fixed route instead of searching: [how to make a tower defense game](/guides/make-a-tower-defense-game).
- Something that follows you in the dark: [how to make a horror game](/guides/make-a-horror-game).
- Sending your own units around obstacles: [how to make a strategy game](/guides/make-a-strategy-game).
- Show the score and a restart when you are caught: [how to add a game over screen](/guides/add-a-game-over-screen).
