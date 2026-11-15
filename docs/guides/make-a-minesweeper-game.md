---
title: How to make a minesweeper game in three.js: mines, numbers and the flood fill
phrase: how to make a minesweeper game
description: How to make a minesweeper game as a beginner: a grid of tiles, mines placed after the first click so it is always safe, a count of the neighbouring mines on every tile, the flood fill that opens a whole empty area from one click, right-click flags, winning and losing, on a small three.js meadow of grass tiles, with paprika3d clicking the tiles and checking 500 first clicks.
meta: How to make a minesweeper game in three.js: mines after the first click, neighbour counts, a flood fill that opens empty areas, and flags.
intent: make-a-minesweeper-game
queries:
  - "how to make a minesweeper game"
  - "how to make minesweeper"
  - "Minesweeper reveal nearby tiles function"
  - "How to create a minesweeper board in javascript?"
author: paprika3d agent
date: 2026-11-02
review: weekly
---
# How to make a minesweeper game in three.js: mines, numbers and the flood fill

Minesweeper is a grid of covered tiles with a few mines hidden under some of them. You click a tile to open it. If it hides a mine, you lose. If not, it shows a number: how many of the up to eight tiles touching it hide a mine. From those numbers you work out where the mines must be, mark them with flags (a right click), and win when every tile without a mine is open. A tile that touches no mine at all opens its neighbours by itself, so one lucky click can uncover a whole empty area at once.

That last part, the one people ask about in threads such as "Minesweeper reveal nearby tiles function", is called a **flood fill**. The rest of the game is a grid and some counting.

## The rules as code

A minesweeper game is five small pieces. Each one is a few lines in the game below.

1. **The grid.** Every tile has a column and a row (here `x` and `z`, numbered from 0). Two loops, one inside the other, visit them all, and a small function lists a tile's neighbours: the up to eight tiles one step away, skipping any that would fall off the edge. Forgetting that edge check is the usual reason the numbers along the border come out wrong.
2. **The mines.** Pick tiles at random until there are enough, never the same tile twice.
3. **The counts.** For every tile, count how many of its neighbours are mines. Do this once, right after the mines go down, and keep the numbers in a list.
4. **The first click.** Players expect the first click to be safe, and the usual way to promise that is to place the mines after it, anywhere except the clicked tile and the eight around it. Then the first tile always shows 0 and opens an area. A game that places its mines when the page loads can end on the first click, and the check further down counts how often.
5. **Winning and losing.** Opening a mine loses. When the number of open tiles equals the number of tiles minus the number of mines, every safe tile is open, and that is a win.

## The flood fill: opening an empty area

When the clicked tile's count is 0, none of its neighbours can be a mine, so the game opens them for the player. Any of those that is also a 0 opens its own neighbours, and so on, until the open area is ringed by numbered tiles. Written as steps:

1. Put the clicked tile on a to-do list.
2. Take a tile off the list. If it is already open or flagged, skip it.
3. Open it. If its count is 0, put all its neighbours on the list.
4. Repeat until the list is empty.

The numbered tiles at the edge get opened but add nothing to the list, which is what stops the fill. Step 2 is the one first versions miss: without the "already open" check, two empty tiles side by side keep putting each other back on the list, and the page freezes. The fill can also be written as a function that calls itself for each neighbour (recursion). It works the same way; the to-do list avoids a very deep chain of calls on a large board.

## A small game: meadow mines

three.js, a JavaScript library that draws 3D in a web page, draws the field as 81 grass blocks on a 9 by 9 grid, with 10 mines. An opened tile sinks and turns to soil, with its number painted on top. The whole game is one HTML file. Save it as `index.html` in a new folder, run `npm install three` in that folder (it puts three.js in a `node_modules` folder, where the import map line near the top looks for it), then run `npx vite` and open the address it prints. [How to make a 3D browser game](/guides/how-to-make-a-3d-browser-game) explains those steps, and [HTML game not working?](/guides/html-game-not-working) covers a page that stays blank.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Meadow mines</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:12px;left:0;right:0;text-align:center;font:600 20px system-ui;color:#fff;text-shadow:0 1px 3px #000}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const SIZE = 9, MINES = 10;   // a 9 by 9 meadow with 10 mines hidden in it
let mines, mineList, counts, opened, flagged, state;   // state: ready, playing, won or lost

const id = (x, z) => z * SIZE + x;
function neighbours(x, z) {   // the up to 8 tiles touching this one
  const out = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, nz = z + dz;
    if ((dx || dz) && nx >= 0 && nz >= 0 && nx < SIZE && nz < SIZE) out.push([nx, nz]);
  }
  return out;
}
function layMines(list) {   // puts the mines down and counts, for every tile, the mines touching it
  mineList = list;
  mines = new Set(list.map(([x, z]) => id(x, z)));
  counts = [];
  for (let z = 0; z < SIZE; z++) for (let x = 0; x < SIZE; x++)
    counts[id(x, z)] = neighbours(x, z).filter(([a, b]) => mines.has(id(a, b))).length;
}
function randomMines(safeX, safeZ) {   // anywhere except the first tile clicked and the 8 around it
  const safe = new Set([[safeX, safeZ], ...neighbours(safeX, safeZ)].map(([x, z]) => id(x, z))), list = [];
  while (list.length < MINES) {
    const x = Math.floor(Math.random() * SIZE), z = Math.floor(Math.random() * SIZE);
    if (!safe.has(id(x, z)) && !list.some(([a, b]) => a === x && b === z)) list.push([x, z]);
  }
  return list;
}

function open(x, z) {
  if (state === 'won' || state === 'lost') return;
  if (state === 'ready') { layMines(randomMines(x, z)); state = 'playing'; }   // mines go down after the first click
  if (flagged.has(id(x, z)) || opened.has(id(x, z))) return;
  if (mines.has(id(x, z))) { state = 'lost'; return; }
  const todo = [[x, z]];   // the flood fill: open a tile, and if no mine touches it, open its neighbours too
  while (todo.length) {
    const [cx, cz] = todo.pop();
    if (opened.has(id(cx, cz)) || flagged.has(id(cx, cz))) continue;
    opened.add(id(cx, cz));
    if (counts[id(cx, cz)] === 0) todo.push(...neighbours(cx, cz));
  }
  if (opened.size === SIZE * SIZE - MINES) state = 'won';
}
function flag(x, z) {
  if (state !== 'playing' || opened.has(id(x, z))) return;
  if (flagged.has(id(x, z))) flagged.delete(id(x, z)); else flagged.add(id(x, z));
}
function reset() { mines = new Set(); mineList = []; counts = []; opened = new Set(); flagged = new Set(); state = 'ready'; }

// The picture: grass tiles that turn to soil when opened, a number on each opened tile that touches a mine.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd3f0);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 12, 6.5);
camera.lookAt(0, 0, 0.4);
scene.add(new THREE.HemisphereLight(0xffffff, 0x556644, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-3, 10, 4);
scene.add(sun);
const grass = new THREE.MeshStandardMaterial({ color: 0x5cae4a }), soil = new THREE.MeshStandardMaterial({ color: 0xc9a46a });
const COLOURS = ['', '#1d4ed8', '#15803d', '#b91c1c', '#6d28d9', '#9a3412', '#0f766e', '#111111', '#555555'];
const digits = COLOURS.map((colour, n) => {   // one picture of each number, drawn once on a 2D canvas
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.font = 'bold 50px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = colour;
  if (n) g.fillText(n, 32, 35);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map, transparent: true });
});
const tileBox = new THREE.BoxGeometry(0.94, 0.3, 0.94), label = new THREE.PlaneGeometry(0.8, 0.8);
const flagMat = new THREE.MeshStandardMaterial({ color: 0xe23b3b }), mineMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
const tiles = [];
for (let z = 0; z < SIZE; z++) for (let x = 0; x < SIZE; x++) {
  const tile = new THREE.Mesh(tileBox, grass);
  tile.name = `tile ${x},${z}`;
  tile.position.set(x - (SIZE - 1) / 2, 0, z - (SIZE - 1) / 2);
  tile.userData = { x, z };
  const number = new THREE.Mesh(label, digits[0]);
  number.name = 'number'; number.rotation.x = -Math.PI / 2; number.position.y = 0.16;
  const pin = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 12), flagMat);
  pin.name = 'flag'; pin.position.y = 0.4;
  const mine = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), mineMat);
  mine.name = 'mine'; mine.position.y = 0.2;
  tile.add(number, pin, mine);
  scene.add(tile);
  tiles.push(tile);
}
scene.updateMatrixWorld();   // places the tiles and camera now, so a click before the first frame finds its tile
camera.updateMatrixWorld();
const hud = document.getElementById('hud');

// The mouse: a ray from the camera through the pointer finds the tile under it.
const ray = new THREE.Raycaster();
addEventListener('contextmenu', e => e.preventDefault());   // a right click flags instead of opening the browser's menu
addEventListener('pointerdown', e => {
  ray.setFromCamera({ x: e.clientX / innerWidth * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }, camera);
  const hit = ray.intersectObjects(tiles, false)[0];
  if (!hit) return;
  const { x, z } = hit.object.userData;
  e.button === 2 ? flag(x, z) : open(x, z);
});
addEventListener('keydown', e => { if (e.code === 'KeyR') reset(); });
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

reset();
renderer.setAnimationLoop(() => {
  for (const tile of tiles) {
    const k = id(tile.userData.x, tile.userData.z), [number, pin, mine] = tile.children, isOpen = opened.has(k);
    tile.material = isOpen ? soil : grass;
    tile.position.y = isOpen ? -0.12 : 0;
    number.visible = isOpen && counts[k] > 0;
    if (number.visible) number.material = digits[counts[k]];
    pin.visible = flagged.has(k);
    mine.visible = state === 'lost' && mines.has(k);
  }
  hud.textContent = state === 'lost' ? 'Boom! R for a new meadow'
    : state === 'won' ? 'Every safe tile is open! R for a new meadow'
    : `Mines ${MINES} · Flags ${flagged.size} · Left click opens, right click flags`;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'meadow mines', units: 'tiles', keys: { KeyR: 'new meadow' }, mouse: 'left click opens a tile, right click flags it' }),
  observe: () => ({ state, opened: opened.size, flags: flagged.size, mines: mineList }),
  act: ({ key, down = true, action, x, z }) => {
    if (action === 'open') open(x, z);
    else if (action === 'flag') flag(x, z);
    else if (key === 'KeyR' && down) reset();
  },
  setState: s => { if (s.mines) { reset(); layMines(s.mines); state = 'playing'; } },   // a known meadow, for checks
};
</script>
</body></html>
```

`layMines` puts the mines down and fills in the counts, `randomMines` keeps the first tile and its neighbours clear, and `open` is the flood fill from the list above. The pointer handler sends a ray (a line from the camera through the mouse) into the scene to find the tile under the cursor, opening it on a left click and flagging it on a right one; the `contextmenu` line stops the browser's own menu from popping up on the right click. The `window.__game` object at the end is for testing tools: a player never sees it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes the files in your project) can build this in one go if the request names the rules that first versions get wrong, the safe first click and the flood fill:

```text
Make a minesweeper game in one HTML file with three.js, seen from above at an angle:
a 9 by 9 grid of grass tiles with 10 mines. Left click opens a tile, right click puts
a flag on it (and stops the browser's menu). Place the mines after the first click,
never on the clicked tile or the 8 around it. An opened tile shows how many of its
neighbours are mines. Opening a 0 opens all its neighbours, and so on, using a to-do
list. Opening a mine loses and shows every mine; opening every safe tile wins.
R starts a new field.
```

Then play it the way a player would. Click once in the middle: an area should open. Right-click a covered tile: a flag should appear and the browser's menu should not. Click a flagged tile: nothing should happen.

## Let the agent click the tiles

An agent that writes this game cannot see the field or click it on its own, so it hands the game back and you report what went wrong. paprika3d gives it a browser to test in: it is a Claude Code plugin and an MCP server, the standard way to give other coding agents extra tools. Its tools open the page in a Chrome with no window, picture it, click and press keys on exact frames, and read the state from `window.__game`. The replies below are from paprika3d on this page's game, captured on 2026-11-02 on a machine with no graphics card (Chrome draws in software there), each cut to the lines discussed, with nothing reworded.

First, the promise that the first click is safe. `eval` runs code inside the open page, so the agent can start 500 new meadows and click a random tile on each. On a first version that placed the mines when the meadow was made:

```text
eval {"code":"let lost = 0;\nfor (let i = 0; i < 500; i++) {\n  window.__game.act({ key: \"KeyR\" });\n  window.__game.act({ action: \"open\", x: Math.floor(Math.random() * 9), z: Math.floor(Math.random() * 9) });\n  if (window.__game.observe().state === \"lost\") lost++;\n}\nreturn { meadows: 500, firstClickOnAMine: lost };"}

{"meadows":500,"firstClickOnAMine":63}
```

63 of 500 games were lost on the first click, about one in eight, which is what 10 mines among 81 tiles gives. The fix moves the mines to the first click and keeps them off the tiles around it:

```diff
-function randomMines() {   // anywhere in the meadow
-  const list = [];
+function randomMines(safeX, safeZ) {   // anywhere except the first tile clicked and the 8 around it
+  const safe = new Set([[safeX, safeZ], ...neighbours(safeX, safeZ)].map(([x, z]) => id(x, z))), list = [];
   while (list.length < MINES) {
     const x = Math.floor(Math.random() * SIZE), z = Math.floor(Math.random() * SIZE);
-    if (!list.some(([a, b]) => a === x && b === z)) list.push([x, z]);
+    if (!safe.has(id(x, z)) && !list.some(([a, b]) => a === x && b === z)) list.push([x, z]);
   }
...
 function open(x, z) {
   if (state === 'won' || state === 'lost') return;
+  if (state === 'ready') { layMines(randomMines(x, z)); state = 'playing'; }   // mines go down after the first click
...
-function reset() { layMines(randomMines()); opened = new Set(); flagged = new Set(); state = 'playing'; }
+function reset() { mines = new Set(); mineList = []; counts = []; opened = new Set(); flagged = new Set(); state = 'ready'; }
```

The same check after it:

```text
{"meadows":500,"firstClickOnAMine":0}
```

Then a real click. `interact` plays steps on the page, here one left click in the middle of the screen, and `expect` checks the state afterwards. The first click must start the game and open at least the 9 tiles of the safe area; with `save`, the play is kept as a check:

```text
interact {"steps":[{"mouse":"click","x":640,"y":375}],"expect":{"state":"playing","opened":[9,71]},"save":"first-click-opens-an-area"}

{"changed":{"state":"playing","opened":12,"mines":[[4,1],[8,0],[5,6],[2,4],[6,4],[1,3],[5,7],[6,3],[2,8],[5,0]]}}
Expect: state "playing" ✓ · opened 12 ✓
Saved check "first-click-opens-an-area" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

12 tiles opened, and none of the mines is next to the clicked tile, 4,4. To test the flood fill itself, the agent sets up a meadow it can predict with a `{ state }` step: a wall of 9 mines down column 4 and one in the far corner. A click on the corner tile 0,0 should open the three empty columns on the left and the column of numbers beside the wall, 36 tiles, and nothing past the wall:

```text
interact {"steps":[{"state":{"mines":[[4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[8,8]]}},{"mouse":"click","x":390,"y":155}],"expect":{"opened":36,"state":"playing"},"save":"flood-fill-stops-at-numbers"}

{"changed":{"state":"playing","opened":36,"mines":[[4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[8,8]]}}
mouse click at (390, 155): over tile 0,0 (Mesh, 16.2 units)
Expect: opened 36 ✓ · state "playing" ✓
```

`look` takes a picture and lists what is on screen. After that click it shows the opened area and nine numbers, one for each tile beside the wall:

```text
look {}

Pixels: brightness 76%, colour saturation 37%, 0% near black, 0% blown out; 15% of the picture changed since the last look.
Hues: blue 63%, green 20%, orange 16% of the frame; over the objects (36.1% of it): green 56%, orange 43%.
On screen (90):
tile 8,* ×9 4.1% [857, 126, 1015, 703]
tile 7,* ×9 4.1% [795, 126, 931, 703]
tile 0,* ×9 4.1% [268, 131, 424, 704]
...
number ×9 2.6% [524, 134, 602, 694] 0.8 × 0.8 units
tile 3,* ×9 1.3% [518, 131, 607, 704]
Never visible: none
Hidden by the game (visible false on it or a parent): flag, mine
```

In the picture the left four columns are soil, the column beside the wall reads 2, 3, 3, 3, 3, 3, 3, 3, 2 from top to bottom (the two end tiles touch two mines of the wall, the others three), and everything right of it is still grass. Last, a right click puts a flag on tile 7,2, and a left click on a mine ends the game:

```text
interact {"steps":[{"state":{"mines":[[4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[8,8]]}},{"mouse":"click","x":839,"y":258,"button":"right"},{"mouse":"click","x":640,"y":375}],"expect":{"flags":1,"state":"lost"},"save":"flag-then-a-mine"}

{"changed":{"state":"lost","flags":1,"mines":[[4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[8,8]]}}
mouse click at (839, 258): over tile 7,2 (Mesh, 14.8 units)
mouse click at (640, 375): over tile 4,4 (Mesh, 13.5 units)
Expect: flags 1 ✓ · state "lost" ✓
```

`test` replays all three saved checks, each on a freshly loaded page, so a later change (a bigger board, a timer) that breaks one of them shows up at once:

```text
test {}

✓ first-click-opens-an-area
✓ flood-fill-stops-at-numbers
✓ flag-then-a-mine
3 of 3 saved checks passed in 0.8 s
```

The click positions came from an `eval` call that asks three.js where each tile's centre lands on the screen. paprika3d clicks, counts and pictures; it does not invent the rules, judge whether a board is fair to a player who reasons well, or tell you whether the game is fun. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add Keeno-Corp/paprika3d
claude plugin install paprika3d@paprika3d
```

## When it goes wrong

- **The page freezes on a click.** The flood fill puts tiles back on the list that are already open. Check "already open" before opening, as step 2 of the fill does.
- **Numbers along the edge are wrong, or the console shows an error about `undefined`.** The neighbour function looks past the edge of the grid. It must skip any column or row below 0 or past the last one.
- **The first click can be a mine.** The mines are placed before the first click. Place them inside the first click, as in the diff above.
- **A right click opens the browser's menu.** Add the `contextmenu` listener that calls `preventDefault()`.
- **Clicks open the wrong tile.** The ray is built from the wrong mouse position. It needs the mouse position as a fraction of the window, from -1 to 1 across and from 1 to -1 down, as in the pointer handler above.
- **The fill opens a flagged tile.** The skip in step 2 must cover flagged tiles too, or a player's flag is lost the moment an empty area reaches it.

## Next steps

- The same flood fill checks that every exit in a maze can be reached: [how to make levels in a game](/guides/make-levels-in-a-game).
- A clock, and a record time kept after the page is closed: [how to save the high score](/guides/save-the-high-score).
- A difficulty choice (bigger board, more mines) before the game starts: [how to make a main menu](/guides/make-a-main-menu).
- A proper end screen for a win and a loss: [how to add a game over screen](/guides/add-a-game-over-screen).
- Another grid of tiles you click, where you remember instead of reason: [how to make a memory game](/guides/make-a-memory-game).
