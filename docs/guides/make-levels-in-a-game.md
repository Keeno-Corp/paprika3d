---
title: How to make levels in a game: levels as data in a three.js game
phrase: how to make levels in a game
description: How to make levels in a game when you do not know what the technique is called: write each level as data (rows of characters), build it with one load function, load the next when the player reaches the exit, shown on a small three.js maze game, with an AI agent picturing every level, playing to the exit and checking that each exit can be reached.
meta: How to make levels in a game: each level as rows of characters, one load function, the next level at the exit, in a small three.js maze game.
intent: make-levels-in-a-game
queries:
  - "how to make levels in a game"
  - "How to build and use levels?"
  - "How can I make levels of a javascripted game, I don't really know the keywords to use"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make levels in a game: levels as data in a three.js game

"How can I make levels of a javascripted game, I don't really know the keywords to use" is how one beginner asked it on a forum, and the missing words are **level data** and **loading a level**. You write each level as data, a plain description such as a few rows of text, kept apart from the game's code. One function, the loader, reads a level's data and builds it: it clears the old level away, puts up the walls, places the player. When the player reaches the goal, the game calls the loader with the next level. After that, a new level is a few new lines of data and no new code.

## The three parts

1. **The data.** For a maze or a platformer, rows of characters work well, one character per square of the map: here `#` is a wall, `.` is floor, `P` is where the player starts and `E` is the exit. You can see the level's shape in the text itself. Other games keep other data per level: a list of enemies with their positions, the speed things fall at, how many stars to catch.
2. **The loader.** A function such as `load(n)` that removes everything the last level made, builds level `n` from its data and puts the player at the start.
3. **The goal.** A check each frame: has the player reached the exit? If so, load the next level, and after the last one, show that the player won.

The levels can sit in the code as a list, as they do here. In a bigger game they often live in separate files that the game loads, and free map editors such as Tiled draw levels on a grid and save them as data the game can read.

## A small game with three levels

Maze levels: roll a ball through each maze to the green exit with the arrow keys. three.js, a JavaScript library that draws 3D in a web page, draws it; the whole game is one HTML file. The import map line near the top tells the browser where three.js is (a `node_modules/three` folder next to the file, which `npm install three` makes), and [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains the other parts of such a page.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Maze levels</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}#hud{position:fixed;top:16px;left:20px;font:600 22px system-ui;color:#fff}</style></head>
<body>
<div id="hud">Level 1</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The levels are data: # is a wall, . is floor, P is where the player starts, E is the exit.
const LEVELS = [
  [
    '#########',
    '#P.....E#',
    '#########',
  ],
  [
    '#########',
    '#P..#...#',
    '#.#.#.#.#',
    '#.#...#E#',
    '#########',
  ],
  [
    '###########',
    '#P..#.....#',
    '###.#.###.#',
    '#...#.#E#.#',
    '#.###.#.#.#',
    '#.....#...#',
    '###########',
  ],
];

const held = new Set();
function act({ key, down = true }) { if (down) held.add(key); else held.delete(key); }
addEventListener('keydown', e => act({ key: e.key }));
addEventListener('keyup', e => act({ key: e.key, down: false }));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x20243a);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
scene.add(new THREE.HemisphereLight(0xffffff, 0x404060, 2.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(3, 10, 5);
scene.add(sun);
const player = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), new THREE.MeshStandardMaterial({ color: 0xffb030 }));
player.name = 'player';
scene.add(player);
const wallGeometry = new THREE.BoxGeometry(1, 1, 1), wallMaterial = new THREE.MeshStandardMaterial({ color: 0x6a74a8 });
const hud = document.getElementById('hud');

let level = 1, rows = [], px = 0, pz = 0, won = false, built = null;

// One function turns a level's rows into the scene.
function load(n) {
  level = n;
  rows = LEVELS[n - 1];
  if (built) scene.remove(built);
  built = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(rows[0].length, rows.length).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x30364f }));
  floor.name = 'floor';
  floor.position.set(rows[0].length / 2 - 0.5, 0, rows.length / 2 - 0.5);
  built.add(floor);
  rows.forEach((row, z) => [...row].forEach((ch, x) => {
    if (ch === '#') {
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.name = 'wall';
      wall.position.set(x, 0.5, z);
      built.add(wall);
    } else if (ch === 'E') {
      const exit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), new THREE.MeshStandardMaterial({ color: 0x40e080, emissive: 0x20a050 }));
      exit.name = 'exit';
      exit.position.set(x, 0.05, z);
      built.add(exit);
    } else if (ch === 'P') {
      px = x;
      pz = z;
    }
  }));
  scene.add(built);
  const size = Math.max(rows[0].length, rows.length);
  camera.position.set(rows[0].length / 2 - 0.5, size * 1.2, rows.length / 2 - 0.5 + size * 0.3);
  camera.lookAt(rows[0].length / 2 - 0.5, 0, rows.length / 2 - 0.5);
  hud.textContent = `Level ${level}`;
}

const wallAt = (x, z) => (rows[Math.round(z)]?.[Math.round(x)] ?? '#') === '#';
const blocked = (x, z) => [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].some(([dx, dz]) => wallAt(x + dx, z + dz));

function step(dt) {
  if (won) return;
  const dx = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
  const dz = (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0);
  if (!blocked(px + dx * 4 * dt, pz)) px += dx * 4 * dt;   // 4 tiles a second, stopped by walls
  if (!blocked(px, pz + dz * 4 * dt)) pz += dz * 4 * dt;
  if (rows[Math.round(pz)][Math.round(px)] === 'E') {
    if (level < LEVELS.length) load(level + 1);
    else { won = true; hud.textContent = 'You win!'; }
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
  player.position.set(px, 0.3, pz);
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'maze levels', units: 'tiles', keys: { ArrowRight: 'move right', ArrowLeft: 'move left', ArrowUp: 'move up', ArrowDown: 'move down' } }),
  observe: () => ({ level, player: { x: +px.toFixed(2), z: +pz.toFixed(2) }, won }),
  act,
  setState: (s) => { if (s.level) load(s.level); },
  levels: LEVELS,
  subject: player,
};
</script>
</body></html>
```

The levels are the `LEVELS` list at the top. `load(n)` turns level `n` into a floor, a cube for every `#` and a green tile for the `E`, then frames the camera on it. `step` moves the ball, stops it at walls (any square that is `#` in the data) and loads the next level when the ball's square is the `E`. To add a fourth level, add another list of rows; nothing else changes.

## Make each level teach one thing

Level 1 here is a corridor: the player learns to move. Level 2 adds turns. Level 3 is a maze with a dead end. A good order grows harder slowly, brings in one new idea at a time, and lets the player win the first ones easily. Play each level yourself after every change, because a level can look right and still be impossible.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes and edits your project's files) can turn a one-level game into a game with levels. Use the words from the top of this page:

```text
Change my game so that levels are data. Write each level as rows of text characters
(# wall, . floor, P start, E exit) in one LEVELS list, and write one load(n) function
that clears the old level, builds level n from its rows and puts the player at P.
When the player reaches E, load the next level; after the last one, show "You win!".
Then add a fourth level that is harder than the third, and check that the exit
of every level can be reached from its start.
```

The last line asks for something a person rarely checks by hand: a level whose exit is walled in looks fine in a screenshot.

## Let the agent see and test every level

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs a game in a hidden Chrome browser so the agent can see and play it. Three of its tools fit levels.

`look` with `sheet` reloads the game once per level, using the game's `setState` to jump to it, and puts every level in one picture, so the agent sees them side by side:

```text
look {"sheet": [{"label": "level 1", "state": {"level": 1}}, {"label": "level 2", "state": {"level": 2}}, {"label": "level 3", "state": {"level": 3}}]}

Picture: <project>/paprika3d/runs/2026-10-30T19-58-09-682Z/look-4-sheet.png (3 moments, left to right, top to bottom: level 1 | level 2 | level 3); the game is reloaded at its first frame
level 1: subject player 0.22%; on screen: floor, wall ×20, exit, player; pixels: brightness 23%, colour saturation 43%, 0% near black, 0% blown out
level 2: subject player 0.21%; on screen: floor, wall ×30, exit, player; pixels: brightness 27%, colour saturation 42%, 0% near black, 0% blown out
level 3: subject player 0.13%; on screen: floor, wall ×48, exit, player; pixels: brightness 27%, colour saturation 42%, 0% near black, 0% blown out
This sheet took 1 s (about 0 s a cell) on a software renderer.
```

`interact` plays keys on exact frames, and its `until` step keeps going until the game's state matches. Here it holds the right arrow on level 1 until level 2 loads:

```text
interact {"steps": [{"state": {"level": 1}}, {"key": "ArrowRight", "down": true}, {"until": {"level": 2}, "max": 300}, {"key": "ArrowRight", "down": false}]}

{"changed":{"level":2}}
until: level == 2 held at frame 83
```

The exit works and the next level loads, 83 frames after the key went down. `eval` runs code inside the game. With it the agent checked every level's exit with a flood fill, which spreads from the start through every open square and sees whether it reaches the `E`:

```js
const solvable = window.__game.levels.map((rows, i) => {
  const cells = rows.flatMap((row, z) => [...row].map((ch, x) => ({ ch, key: x + ',' + z })));
  const start = cells.find(c => c.ch === 'P').key, exit = cells.find(c => c.ch === 'E').key;
  const seen = new Set([start]), todo = [start];
  while (todo.length) {
    const [x, z] = todo.pop().split(',').map(Number);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const key = (x + dx) + ',' + (z + dz);
      if (rows[z + dz][x + dx] !== '#' && !seen.has(key)) { seen.add(key); todo.push(key); }
    }
  }
  return { level: i + 1, exitReachable: seen.has(exit) };
});
return solvable;
```

On a first version of level 3 whose fifth row read `'#.###.###.#'`, the check answered:

```text
[{"level":1,"exitReachable":true},{"level":2,"exitReachable":true},{"level":3,"exitReachable":false}]
```

That row closed the one corridor to the exit, and nothing in the picture says so: the exit is still drawn, green and unreachable. Opening the square back up, `'#.###.#.#.#'` as in the game above, gives:

```text
[{"level":1,"exitReachable":true},{"level":2,"exitReachable":true},{"level":3,"exitReachable":true}]
```

These replies were captured on 2026-10-30 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not design levels or tell you whether one is fun or too hard. The flood fill is a few lines of code the agent writes for this game's rules, not a built-in check; a game with jumps or keys and doors needs its own version. To add paprika3d to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Without paprika3d

Give yourself a shortcut to each level while you build: a key that jumps to the next level, or a level number read from the page's address, so you can test level 3 without playing levels 1 and 2 first. Ask the agent to put the reachability check in the game itself, run once at start, printing a warning to the browser console (the panel of messages a page writes, opened with F12) for any level whose exit cannot be reached.

## Next steps

- Let the player lose and try again: [how to add a game over screen](/guides/add-a-game-over-screen).
- Keep a high score for each level: [how to save the high score](/guides/save-the-high-score).
- Make reaching the exit feel like something: [how to make a game feel good](/guides/make-a-game-feel-good).
- Share the finished levels: [how to put your game online](/guides/put-your-game-online).
- A grid level drawn with tiles from a picture, and collision against them: [three.js tilemap and sprite sheet](/guides/threejs-tilemap-sprite-sheet).
