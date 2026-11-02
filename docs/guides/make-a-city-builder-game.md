---
title: How to make a city builder game in three.js: a grid, roads and a town that grows
phrase: how to make a city builder game
description: How to make a city builder or tycoon game as a first game: the town as a grid of data, a tool to pick and a tile to click, a rule for what each house needs nearby (a road next to it, a well within reach), days that move people into houses whose needs are met and collect coins from them, and an angled view from above with an orthographic camera, on a small three.js town; the prompt to give an AI agent, and how the agent builds, waits a day and checks the population with paprika3d's interact, then views the town from three cameras with look.
meta: How to make a city builder game: a three.js grid where you place roads, houses and a well, and houses fill with people when a road and water reach them.
intent: make-a-city-builder-game
queries:
  - "how to make a city builder game"
  - "how to make a tycoon game"
  - "how to make a simple tycoon game"
  - "how to make a zoo game"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make a city builder game in three.js: a grid, roads and a town that grows

In a city builder you place buildings on a grid of tiles, and the town grows by rules about what each building needs nearby. A house with a road at its door and water within reach fills with people; people pay money; money buys more roads and houses. The player never moves a character: they plan, and the rules do the rest. Tycoon and zoo games are the same machine with other pieces. This page builds a tiny town on an 8 by 8 grid with roads, houses and a well, in one file you can paste, and then shows how an AI agent can build in it and check the rules itself.

## The parts of a city builder

1. **The grid as data.** A table with one cell per tile, holding what stands there: nothing, a road, a house or a well. Every rule reads this table, not the 3D picture.
2. **Placing.** Pick a tool with a key, click a tile, pay its cost. A tile that is taken or a tool you cannot afford gets a message instead.
3. **Needs.** Each kind of building has a rule about its neighbours. Here a house needs a road on a tile touching it and a well no more than 3 steps away.
4. **Time.** Every few seconds a day passes. Each house whose needs are met gains a person, up to 4, and each person pays a coin.
5. **The view.** An angled view from above where every tile is the same size on screen, so the grid is easy to read and click.

## A tiny town

Tiny town: press 1, 2 or 3 to choose a road, a house or a well, and click a tile to build it. You start with 30 coins. A red ball floats over any house that lacks a road or water. three.js, a JavaScript library that draws 3D in a web page, draws it, and the whole game is one HTML file. The import map line near the top tells the browser where three.js is, a `node_modules/three` folder next to the file, which `npm install three` makes when you type it in a terminal (the window where you type commands). [How to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains how to open such a file in a browser.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Tiny town</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:16px;left:20px;font:600 20px system-ui;color:#fff;text-shadow:0 1px 3px #0008}
#msg{font-size:16px;margin-top:6px}</style></head>
<body>
<div id="hud"><div id="text"></div><div id="msg">1 road (1 coin), 2 house (5), 3 well (10). Click a tile to build.</div></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b8d8);
// An angled view from above with no perspective: every tile is the same size on screen.
const VIEW = 4.5;   // half the height of the view, in tiles
const camera = new THREE.OrthographicCamera(-VIEW * innerWidth / innerHeight, VIEW * innerWidth / innerHeight, VIEW, -VIEW, 0.1, 100);
camera.position.set(10, 10, 10);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x506040, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(4, 10, 2);
scene.add(sun);

const SIZE = 8;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x78a858 }));
ground.name = 'ground';
const lines = new THREE.GridHelper(SIZE, SIZE, 0x5a8040, 0x5a8040);
lines.name = 'grid lines';
lines.position.y = 0.01;
scene.add(ground, lines);

// The town is data: what stands on each tile (null, 'road', 'house' or 'well'), and each house's people.
const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
const houses = [];
const COST = { road: 1, house: 5, well: 10 }, TOOLS = { 1: 'road', 2: 'house', 3: 'well' };
let tool = 'road', coins = 30, day = 1, clock = 0;
const text = document.getElementById('text'), msg = document.getElementById('msg');

const roadGeo = new THREE.BoxGeometry(1, 0.06, 1), wallGeo = new THREE.BoxGeometry(0.7, 0.6, 0.7), roofGeo = new THREE.ConeGeometry(0.6, 0.45, 4);
const wellGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 16), signGeo = new THREE.SphereGeometry(0.12, 12, 8);
const grey = new THREE.MeshStandardMaterial({ color: 0x555b60 }), red = new THREE.MeshStandardMaterial({ color: 0xc0392b });
const stone = new THREE.MeshStandardMaterial({ color: 0x9a9a9a }), alarm = new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xaa0000 });

function build(kind, ix, iz) {
  const thing = new THREE.Group();
  thing.name = kind;
  thing.position.set(ix - SIZE / 2 + 0.5, 0, iz - SIZE / 2 + 0.5);
  if (kind === 'road') thing.add(new THREE.Mesh(roadGeo, grey));
  if (kind === 'well') thing.add(new THREE.Mesh(wellGeo, stone));
  if (kind === 'house') {
    const walls = new THREE.Mesh(wallGeo, new THREE.MeshStandardMaterial({ color: 0xe8e8e8 })), roof = new THREE.Mesh(roofGeo, red);
    walls.position.y = 0.3;
    roof.position.y = 0.82;
    roof.rotation.y = Math.PI / 4;
    const sign = new THREE.Mesh(signGeo, alarm);   // a red ball over a house that lacks a road or water
    sign.name = 'needs';
    sign.position.y = 1.3;
    thing.add(walls, roof, sign);
    houses.push({ ix, iz, people: 0, walls, sign });
  }
  scene.add(thing);
  grid[iz][ix] = kind;
}

const at = (ix, iz) => grid[iz]?.[ix];
// A house needs a road on a tile next to it and a well at most 3 tiles away.
function needs(h) {
  const road = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => at(h.ix + dx, h.iz + dz) === 'road');
  let water = false;
  for (let z = 0; z < SIZE; z++) for (let x = 0; x < SIZE; x++)
    if (grid[z][x] === 'well' && Math.abs(x - h.ix) + Math.abs(z - h.iz) <= 3) water = true;
  return { road, water };
}
const population = () => houses.reduce((n, h) => n + h.people, 0);

function refresh() {
  for (const h of houses) {
    const { road, water } = needs(h);
    h.sign.visible = !(road && water);
    h.walls.material.color.set(0xe8e8e8).lerp(new THREE.Color(0xffb84d), h.people / 4);   // warmer as people move in
  }
  text.textContent = `Day ${day}   Coins: ${coins}   People: ${population()}   Building: ${tool}`;
}

function place(ix, iz) {
  if (at(ix, iz)) { msg.textContent = 'That tile is taken'; return; }
  if (coins < COST[tool]) { msg.textContent = `A ${tool} costs ${COST[tool]} coins`; return; }
  coins -= COST[tool];
  build(tool, ix, iz);
  msg.textContent = `Built a ${tool}`;
  refresh();
}

// Every 5 seconds a day passes: a house with a road and water gains a person (4 at most), and each person pays 1 coin.
function newDay() {
  day++;
  for (const h of houses) { const { road, water } = needs(h); if (road && water && h.people < 4) h.people++; }
  coins += population();
  refresh();
}

const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
addEventListener('pointerdown', (e) => {
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  const hit = ray.intersectObject(ground)[0];
  if (hit) place(Math.floor(hit.point.x + SIZE / 2), Math.floor(hit.point.z + SIZE / 2));
});
function act({ key, down = true }) { if (down && TOOLS[key]) { tool = TOOLS[key]; refresh(); } }
addEventListener('keydown', e => act({ key: e.key }));

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.left = -VIEW * innerWidth / innerHeight;
  camera.right = VIEW * innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
refresh();
let last = null;
renderer.setAnimationLoop((now) => {
  clock += last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;
  if (clock >= 5) { clock -= 5; newDay(); }
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'tiny town', units: 'tiles', keys: { 1: 'road tool', 2: 'house tool', 3: 'well tool' }, mouse: 'click a tile to build there' }),
  observe: () => ({ day, coins, people: population(), tool, houses: houses.map(h => ({ tile: [h.ix, h.iz], people: h.people, ...needs(h) })) }),
  act,
};
</script>
</body></html>
```

## How the code works

**The town is a table.** `grid[iz][ix]` says what stands on the tile in row `iz`, column `ix`. `houses` keeps each house's tile and its people. `build` adds the 3D pieces for a road, a well or a house (white walls, a red roof and the red ball sign) and writes the table.

**Needs.** `needs(h)` answers two questions for a house. Is there a road on one of the four tiles touching it? Is there a well within 3 steps, counting steps across and steps along the grid? `refresh` hides the red ball when both answers are yes, and warms the walls' colour as people move in.

**Days.** The game loop, the function three.js calls once per frame, adds the time since the last frame to `clock`. Every 5 seconds `newDay` runs: each house with both needs met gains a person, then every person pays a coin.

**Clicking a tile.** A raycaster sends an invisible line from the camera through the mouse point and finds where it meets the ground. Rounding that point down to whole tiles gives the column and row.

**The camera.** An `OrthographicCamera` draws without perspective: far tiles are as big as near ones. Placed on a diagonal above the town, it gives the angled "isometric" look of many city builders. When the window changes shape, the camera's left and right edges are recomputed so the town is not stretched. [three.js isometric camera](/guides/threejs-isometric-camera-orthographic) covers this camera in depth, including a phone held upright.

## Tycoon and zoo games

A tycoon game swaps the town's pieces for a business: rides and paths in a theme park, pens and food stands in a zoo, machines and belts in a factory. The skeleton stays: a grid of data, things to place for a price, a rule for what each thing needs nearby, and a tick of time that turns met needs into visitors and money. Build the smallest version with one rule first, as here, then add a second building type and its rule.

## What to ask your AI agent

An AI coding agent, an assistant such as Claude Code that writes and edits your project's files, can build this from a description. State each rule with its numbers:

```text
Make a small three.js city builder in one HTML file. An 8 by 8 grid seen from above at an
angle with an OrthographicCamera. Keys 1, 2 and 3 pick road (1 coin), house (5 coins) or
well (10 coins); clicking an empty tile builds it. Start with 30 coins. A house needs a
road on a tile next to it and a well within 3 tiles (counting steps across and along);
show a red marker over a house that lacks either. Every 5 seconds a day passes: each house
with both gains a person, up to 4, and each person pays 1 coin. Keep the town in a grid
array that every rule reads. Expose window.__game with describe, observe (day, coins,
people, and each house's tile, people, road and water) and act.
```

## When it does not work

- **A click builds on the wrong tile.** The mouse position must be turned into numbers from -1 to 1 across the canvas before the raycaster uses it, and the tile must come from where the ray meets the ground, rounded down after shifting the grid's corner to 0.
- **Houses never fill.** The needs check reads the table with row and column swapped, `grid[ix][iz]` in one place and `grid[iz][ix]` in another. Use one order everywhere.
- **The town is cut off or stretched when the window changes.** An orthographic camera's `left` and `right` must be set again from the new width, then `updateProjectionMatrix()` called.
- **Coins go below zero.** The cost was taken before checking there was enough. Check first, then pay, then build.

## Let the agent build and check the town

A city builder's rules are easy to get subtly wrong and slow to check by hand: each check means building, waiting a day and counting. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs the game in a hidden Chrome browser so the agent can play it, read the result and fix its own bugs.

After a first `look`, the agent found the screen positions of the tiles it needed with `eval`. `interact` then picks the house tool, builds a house on tile (2, 2) with nothing around it, waits 300 frames (one day), and checks with `expect` that nobody moved in:

```text
interact {"steps":[{"key":"2"},{"mouse":"click","x":640,"y":291},{"wait":300}],"expect":{"people":0,"houses.0.road":false,"houses.0.water":false}}

{"changed":{"day":2,"coins":25,"tool":"house","houses":[{"tile":[2,2],"people":0,"road":false,"water":false}]}}
mouse click at (640, 291): over grid lines (GridHelper, 18.6 units)
Expect: people 0 ✓ · houses.0.road false ✓ · houses.0.water false ✓
```

Then it lays a road on the tile in front of the house and a well two tiles away, and waits until someone moves in:

```text
interact {"steps":[{"key":"1"},{"mouse":"click","x":577,"y":327},{"key":"3"},{"mouse":"click","x":766,"y":364},{"until":{"people":1},"max":600}],"expect":{"people":1,"houses.0.road":true,"houses.0.water":true}}

{"changed":{"day":3,"coins":15,"people":1,"tool":"well","houses":[{"tile":[2,2],"people":1,"road":true,"water":true}]}}
until: people == 1 held at frame 297
mouse click at (577, 327): over grid lines (GridHelper, 18 units)
Expect: people 1 ✓ · houses.0.road true ✓ · houses.0.water true ✓
```

The coins add up too: 30, less 5 for the house, 1 for the road and 10 for the well, plus 1 from the first person, is 15. `look` with `cameras` pictures the town from several cameras at once without moving the game's own:

```text
look {"cameras":[{"position":[10,10,10],"lookAt":[0,0,0],"label":"the game view"},{"position":[-10,10,-10],"lookAt":[0,0,0],"label":"from the far corner"},{"position":[0,14,0.01],"lookAt":[0,0,0],"label":"straight down"}]}

Picture: <project>/paprika3d/runs/2026-11-01T00-40-23-876Z/look-4-cameras.png (3 cameras, left to right, top to bottom, at frame 600, no reload; the game's own camera is not moved)
the game view: on screen: ground, grid lines, road, house ×2, well; pixels: brightness 68%, colour saturation 39%, 0% near black, 0% blown out
from the far corner: on screen: ground, grid lines, road, house ×2, well; pixels: brightness 68%, colour saturation 39%, 0% near black, 0% blown out
straight down: on screen: ground, grid lines, road, house, well; pixels: brightness 67%, colour saturation 40%, 0% near black, 0% blown out
Each cell at full size: the game view look-2.png, from the far corner look-3.png, straight down look-4.png (in the picture's folder).
Kept as `camera` names for look, zoom and reference compare: "the game view", "from the far corner", "straight down" (paprika3d/cameras.json).
```

In the picture, the straight-down view shows the plan plainly: the road under the house and the well two tiles to its right. From the far corner, the house stands in front of its own road and partly hides it. In a crowded town, tall buildings hide the tiles behind them from a fixed angle, which is why many city builders let the player turn the view. These replies were captured on 2026-11-01 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not plan a town or tell you whether the prices make a good game; play it and adjust them. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Next steps

- Crops that grow tile by tile over days: [how to make a farming game](/guides/make-a-farming-game).
- Keep the town between visits: [how to save game progress](/guides/save-game-progress).
- Select units and send them across a map: [how to make a strategy game](/guides/make-a-strategy-game).
- Goals that get harder as the town grows: [how to make a game more fun](/guides/make-a-game-more-fun).
- Share the town: [how to put your game online](/guides/put-your-game-online).
