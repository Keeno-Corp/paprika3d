---
title: How to create a bomberman game in three.js: bombs that blast in four directions
phrase: how to create a bomberman game
description: How to create a bomberman game as a beginner: an arena kept as a grid of cells, stone that never breaks and hedges that burn, a bomb that waits three seconds and then blasts along its row and column, the one line that stops a blast going through walls, chain reactions and a pickup for a longer blast, on a small three.js game, with paprika3d dropping the bombs and checking who survived.
meta: How to create a bomberman game in three.js: a grid arena, bombs that blast along their row and column, stone that stops the blast, hedges that burn.
intent: make-a-bomberman-game
queries:
  - "how to create a bomberman game in html"
  - "how to make a game like bomberman 64"
  - "Bomberman clone, how to do bombs?"
  - "How do I not let my explosion go through the walls like bomberman?"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to create a bomberman game in three.js: bombs that blast in four directions

A Bomberman-style game takes place in a walled arena split into square cells. Some blocks are stone and never break; others (here hedges) can be blown up. The player drops a bomb, runs, and a moment later the blast shoots out along the bomb's row and column, burning the first hedge it meets in each direction and stopping at stone. Everything in the game stands on a cell, so the whole game, bombs included, is built on one grid.

## The arena is a grid

The game keeps the arena as rows of letters: `#` for stone, `h` for a hedge, `.` for an open cell. Stone goes all round the edge and on every inside cell whose column and row numbers are both even, which makes the familiar pattern of pillars. Hedges go on the other cells at random, except the start cell and the two beside it, so the player always has room to drop a first bomb and step out of its way.

The player moves one cell per key press, onto an open cell with no bomb on it; anything else blocks the step. Drawing follows the grid: each cell's block sits at that cell's place in the 3D scene, so moving the player is changing two numbers and the picture follows.

## How the bomb works

This is the part people ask about most, in threads such as "Bomberman clone, how to do bombs?" and "How do I not let my explosion go through the walls?".

1. **A bomb is a cell, a fuse and a length.** It remembers where it was dropped, counts its fuse down from 3 s, and keeps the blast length the player had when it was dropped (2 cells to start).
2. **When the fuse runs out, walk the four directions.** The bomb's own cell catches fire. Then, for right, left, down and up in turn, step out one cell at a time up to the blast length. A stone cell stops the walk before it. A hedge cell catches fire, burns away, and also stops the walk. An open cell catches fire and the walk goes on.
3. **Fire lasts 0.5 s.** A player standing on a burning cell is caught. A bomb on a burning cell goes off too, which is how one bomb sets off a row of others (a chain reaction).
4. **A burned hedge sometimes leaves a flame.** Walking onto it adds one cell to every blast after.

The answer to the walls question is the word `break` in step 2: the walk through a direction ends at the first stone or hedge, so nothing behind it is touched. A blast that checks every cell within range without stopping is the usual bug, and it burns hedges behind pillars.

## A small game: hedge blast

three.js, a JavaScript library that draws 3D in a web page, draws the arena; the whole game is one HTML file. The import map line near the top tells the browser where three.js is (a `node_modules/three` folder beside the file, which `npm install three` makes), and [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) goes through the parts of such a page. Arrow keys move, Space drops a bomb, R starts a new arena.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Hedge blast</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:12px;left:0;right:0;text-align:center;font:600 20px system-ui;color:#fff;text-shadow:0 1px 3px #000}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const W = 11, H = 9;          // the arena in cells: stone round the edge and on every other cell inside
const FUSE = 3;               // seconds from dropping a bomb to its blast
const FIRE = 0.5;             // seconds the flames stay
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b8d8);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 12, 7);
camera.lookAt(0, 0, 0.5);
scene.add(new THREE.HemisphereLight(0xffffff, 0x6a5a40, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-4, 10, 6);
scene.add(sun);
const ground = new THREE.Mesh(new THREE.BoxGeometry(W, 0.2, H), new THREE.MeshStandardMaterial({ color: 0xd8c38a }));
ground.name = 'ground';
ground.position.set(0, -0.1, 0);
scene.add(ground);

const cube = new THREE.BoxGeometry(0.96, 0.9, 0.96);
const looks = {
  stone: new THREE.MeshStandardMaterial({ color: 0x8a8f99 }),
  hedge: new THREE.MeshStandardMaterial({ color: 0x3f8f3a }),
  fire: new THREE.MeshStandardMaterial({ color: 0xff8a2a, emissive: 0xff5a00, emissiveIntensity: 1.5 }),
};
const at = (x, z) => new THREE.Vector3(x - (W - 1) / 2, 0.45, z - (H - 1) / 2);
function block(kind, x, z) {
  const mesh = new THREE.Mesh(kind === 'fire' ? cube.clone().scale(0.8, 0.5, 0.8) : cube, looks[kind]);
  mesh.name = kind;
  mesh.position.copy(at(x, z));
  scene.add(mesh);
  return mesh;
}
const player = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.4, 4, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
player.name = 'player';
scene.add(player);
const hud = document.getElementById('hud');

let grid, hedges, bombs, fire, flames, you, range, alive;
function build(state = {}) {   // a new arena: hedges at random, except round the start corner
  scene.children.filter(o => ['stone', 'hedge', 'fire', 'bomb', 'flame'].includes(o.name)).forEach(o => scene.remove(o));
  grid = []; hedges = new Map(); bombs = []; fire = []; flames = new Map();
  you = { x: 1, z: 1 }; range = 2; alive = true;
  for (let z = 0; z < H; z++) {
    grid.push([]);
    for (let x = 0; x < W; x++) {
      const stone = x === 0 || z === 0 || x === W - 1 || z === H - 1 || (x % 2 === 0 && z % 2 === 0);
      grid[z].push(stone ? '#' : '.');
      if (stone) block('stone', x, z);
      else if (!state.hedges && x + z > 3 && Math.random() < 0.55) addHedge(x, z);
    }
  }
  for (const [x, z] of state.hedges ?? []) addHedge(x, z);
}
function addHedge(x, z) { grid[z][x] = 'h'; hedges.set(`${x},${z}`, block('hedge', x, z)); }
function burn(x, z) {
  grid[z][x] = '.';
  scene.remove(hedges.get(`${x},${z}`));
  hedges.delete(`${x},${z}`);
  if (Math.random() < 0.25) {   // sometimes a hedge leaves a flame: one more cell of blast for every bomb after
    const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), looks.fire);
    flame.name = 'flame';
    flame.position.copy(at(x, z));
    scene.add(flame);
    flames.set(`${x},${z}`, flame);
  }
}

function explode(bomb) {
  bombs.splice(bombs.indexOf(bomb), 1);
  scene.remove(bomb.mesh);
  const cells = [[bomb.x, bomb.z]];
  for (const [dx, dz] of DIRS) {
    for (let i = 1; i <= bomb.range; i++) {
      const x = bomb.x + dx * i, z = bomb.z + dz * i;
      if (grid[z][x] === '#') break;                    // stone stops the blast
      cells.push([x, z]);
      if (grid[z][x] === 'h') { burn(x, z); break; }   // a hedge burns, and stops it too
    }
  }
  for (const [x, z] of cells) {
    fire.push({ x, z, t: FIRE, mesh: block('fire', x, z) });
    const other = bombs.find(b => b.x === x && b.z === z);
    if (other) other.t = 0;                            // a bomb in the blast goes off too
  }
}

function act({ key, down = true }) {
  if (!down) return;
  if (key === 'KeyR') return build();
  if (!alive) return;
  if (key === 'Space' && !bombs.some(b => b.x === you.x && b.z === you.z)) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 16), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    mesh.name = 'bomb';
    mesh.position.copy(at(you.x, you.z));
    scene.add(mesh);
    bombs.push({ x: you.x, z: you.z, t: FUSE, range, mesh });
  }
  const [dx, dz] = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[key] ?? [0, 0];
  const x = you.x + dx, z = you.z + dz;
  if ((dx || dz) && grid[z][x] === '.' && !bombs.some(b => b.x === x && b.z === z)) {
    you = { x, z };
    const flame = flames.get(`${x},${z}`);
    if (flame) { range++; scene.remove(flame); flames.delete(`${x},${z}`); }
  }
}
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.code }); });

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
build();
let last = null;
renderer.setAnimationLoop((now) => {
  const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;
  for (const b of [...bombs]) {
    b.t -= dt;
    b.mesh.scale.setScalar(1 + 0.15 * Math.sin(b.t * 12));   // the fuse: the bomb pulses
    if (b.t <= 0) explode(b);
  }
  for (const f of fire) {
    f.t -= dt;
    if (f.x === you.x && f.z === you.z) alive = false;   // caught in the blast
  }
  for (const f of fire.filter(f => f.t <= 0)) scene.remove(f.mesh);
  fire = fire.filter(f => f.t > 0);
  player.position.copy(at(you.x, you.z));
  player.rotation.z = alive ? 0 : Math.PI / 2;
  hud.textContent = !alive ? 'Caught in the blast! R to try again'
    : hedges.size === 0 ? 'Every hedge is gone! R for a new arena'
    : `Hedges left ${hedges.size}   Blast ${range}   Arrows to move, Space for a bomb`;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'hedge blast', units: 'cells', keys: { Space: 'drop a bomb', ArrowLeft: 'move', ArrowRight: 'move', ArrowUp: 'move', ArrowDown: 'move', KeyR: 'restart' } }),
  observe: () => ({ player: { ...you }, alive, hedges: hedges.size, range, bombs: bombs.map(b => ({ x: b.x, z: b.z, t: +b.t.toFixed(2) })), fire: fire.length }),
  act,
  setState: (s) => {
    if (s.hedges) build(s);
    if (s.player) you = { ...s.player };
    if (s.range) range = s.range;
  },
  subject: 'player',
};
</script>
</body></html>
```

`build` lays out the arena, `explode` is the blast from the list above, and the frame loop counts fuses and fire down and catches a player standing in flames. A real Bomberman adds enemies that walk the open cells and a limit on how many bombs can be down at once; each is a small addition to the same grid.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes the files in your project) can build this from the rules. Name the grid and the blast rule exactly, because the blast rule is where first versions go wrong:

```text
Make a Bomberman-style game in one HTML file with three.js, seen from above at an angle.
The arena is a grid of 11 by 9 cells: stone around the edge and on every cell where
both coordinates are even, hedges at random elsewhere but not next to the start corner.
Arrow keys move one cell; Space drops a bomb. After 3 seconds the bomb's blast goes
2 cells along its row and column. In each direction, the blast stops at stone, and
a hedge it reaches burns and stops it. Fire lasts half a second, kills a player on it
and sets off any bomb on it. A burned hedge sometimes drops a flame that adds 1 to the blast.
```

## Let the agent drop the bombs

An agent can write the blast rule and still not know whether it works. paprika3d, a plugin for Claude Code and an MCP server (the standard way to give tools to other coding agents), runs the game in a hidden Chrome so the agent can play it. Its `interact` tool sets the arena up with a `{ state }` step (three hedges in known places), presses keys on exact frames, follows values frame by frame with `trace`, and checks the end with `expect`. Drop a bomb in the corner and walk out of its row and column:

```text
interact {"steps":[{"state":{"hedges":[[1,3],[3,3],[5,1]]}},{"key":"Space"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowDown"},{"wait":240}],"trace":["fire","alive"],"expect":{"hedges":2,"alive":true}}

{"changed":{"player":{"x":3,"z":2},"hedges":2}}
Motion (player): travelled 3 units (2.24 from start to end), its direction of travel turned 90° right.
fire: 0 → peak 5 at frame 181 → 0 at frame 211; first changed at frame 181
alive: true throughout the 244 frames
Expect: hedges 2 ✓ · alive true ✓
```

The blast came 3 s after the drop, covered five cells (the bomb's own, two to the right and two down, where it burned the hedge at the end), and was gone by frame 211. The other two hedges were out of reach, one on neither line and one four cells along the row, so two were left. The same bomb with the player stopping one cell away, still in the bomb's row:

```text
interact {"steps":[{"state":{"hedges":[[1,3],[3,3],[5,1]]}},{"key":"Space"},{"key":"ArrowRight"},{"wait":240}],"trace":["alive"],"expect":{"alive":true}}

{"changed":{"player":{"x":2,"z":1},"alive":false}}
alive: true until frame 180, then false
Expect: alive false ✗ expected true
```

Caught on the frame of the blast, as the rules say. And the walls question: a bomb dropped right above a pillar, with a hedge just behind the pillar and another two cells along the row:

```text
interact {"steps":[{"state":{"hedges":[[2,3],[4,1]],"player":{"x":2,"z":1}}},{"key":"Space"},{"key":"ArrowLeft"},{"key":"ArrowDown"},{"wait":240}],"expect":{"hedges":1,"alive":true}}

{"changed":{"player":{"x":1,"z":2},"alive":true,"hedges":1}}
Motion (player): travelled 2 units (1.41 from start to end), its direction of travel turned 90° left.
Expect: hedges 1 ✓ · alive true ✓
```

The hedge along the row burned and the one behind the pillar is still there: the stone stopped the blast. `look` with `sheet` reloads the game for each moment and pictures them side by side, so the agent sees the bomb, the blast and what it left:

```text
look {"sheet":[{"label":"bomb dropped","state":{"hedges":[[1,3],[3,3],[5,1]]},"steps":[{"key":"Space"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowDown"}],"frames":1},{"label":"2.5 s later","state":{"hedges":[[1,3],[3,3],[5,1]]},"steps":[{"key":"Space"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowDown"}],"frames":150},{"label":"the blast","state":{"hedges":[[1,3],[3,3],[5,1]]},"steps":[{"key":"Space"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowDown"}],"frames":178},{"label":"after","state":{"hedges":[[1,3],[3,3],[5,1]]},"steps":[{"key":"Space"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowDown"}],"frames":220}]}

Picture: <project>/paprika3d/runs/2026-11-01T00-37-33-666Z/look-5-sheet.png (4 moments, left to right, top to bottom: bomb dropped | 2.5 s later | the blast | after); the game is reloaded at its first frame
bomb dropped: subject player 0.1%; on screen: ground, stone ×48, hedge ×3, bomb, player; pixels: brightness 68%, colour saturation 26%, 0% near black, 0% blown out
2.5 s later: subject player 0.1%; on screen: ground, stone ×48, hedge ×3, bomb, player; pixels: brightness 68%, colour saturation 26%, 0% near black, 0% blown out
the blast: subject player 0.1%; on screen: ground, stone ×48, hedge ×2, fire ×5, player; pixels: brightness 68%, colour saturation 27%, 0% near black, 0% blown out
after: subject player 0.1%; on screen: ground, stone ×48, hedge ×2, player; pixels: brightness 68%, colour saturation 26%, 0% near black, 0% blown out
This sheet took 40 s (about 10 s a cell) on a software renderer.
```

The lines count what is on screen in each moment: the bomb, then five fire blocks and one hedge fewer, then the fire gone. In the picture the fire makes an L from the corner, along the top row and down the first column. With two bombs dropped side by side, `trace` showed both gone on frame 181 and fire on nine cells, the second set off by the first. These replies were captured on 2026-11-01 on a machine with no graphics card, where Chrome draws in software.

paprika3d checks the rules by playing them; it does not tell you whether an arena is fun, and it does not write enemies for you. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Without paprika3d

While testing, ask the agent for a slow fuse (10 seconds) and for each blast's cells printed to the browser console (the panel of messages a page writes, opened with F12). Then drop a bomb next to a pillar with a hedge behind it, and check that hedge is still standing.

## Next steps

- Add enemies that hunt the player through the open cells: [how to make an enemy follow the player](/guides/make-an-enemy-follow-the-player).
- Boosts that run out, such as a short speed burst, unlike the flame that lasts: [how to add power ups to a game](/guides/add-power-ups-to-a-game).
- Hand-made arenas instead of random ones: [how to make levels in a game](/guides/make-levels-in-a-game).
- Two players on one keyboard, as in the original: [how to make a 2 player game](/guides/make-a-2-player-game).
- A proper end and restart: [how to add a game over screen](/guides/add-a-game-over-screen).
