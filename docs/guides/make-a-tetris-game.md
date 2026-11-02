---
title: How to make a tetris game in three.js: falling blocks and cleared lines
phrase: how to make a tetris game
description: How to make a tetris game in the browser with three.js, for a first game: the well as a grid of squares, the seven pieces as small grids, one fits() test behind every move, rotation by turning the piece's grid with a wall kick, a drop on a clock that speeds up every ten lines, locking a piece and clearing full rows so the rows above drop; a small falling-block game to paste, the prompt to give an AI agent, and paprika3d loading a nearly full well to check a four-line clear, a wall kick and the speed-up.
meta: How to make a tetris game in three.js: the well as a grid, pieces as small grids, rotation with a wall kick, and clearing full rows.
intent: make-a-tetris-game
queries:
  - "how to make a tetris game"
  - "How to rotate blocks in tetris"
  - "how to make your own tetris game"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a tetris game in three.js: falling blocks and cleared lines

A falling-block game like Tetris is a tall well, ten squares wide and twenty deep, and pieces of four blocks that fall into it one at a time. The player slides and turns each piece before it lands; a row filled from wall to wall disappears, and everything above it drops by one row. Every part of it is a grid, which makes it a good first game to build from rules rather than from art. It takes six parts:

1. **The well as a grid**: one entry per square, empty or filled.
2. **The pieces as small grids**, seven of them, each a few rows of 0s and 1s.
3. **One test, `fits()`**, that every move asks before it happens: would the piece, here, overlap a wall or a block?
4. **Rotation**, by turning the piece's small grid a quarter turn, with a wall kick when the turned piece does not fit.
5. **A drop on a clock**: the piece moves down one row every so many frames, a little faster every ten lines.
6. **Locking and clearing**: a piece that cannot move down is copied into the well, full rows are removed, and the rows above drop.

A few words first. **three.js** is a JavaScript library that draws 3D scenes in a web page, inside a **canvas** (the rectangle where the game appears). The **game loop** is a function the browser calls about sixty times a second; each call moves things a little and draws one picture. A **grid** here is an array of rows, and each row an array of squares (an array is a list in JavaScript).

## The well is a grid, and so is each piece

The well is `well[row][column]`: an empty string for an empty square, or the letter of the piece that left a block there, which also gives the block its colour. Row 0 is the top.

Each of the seven pieces is written as a small grid where 1 is a block. The T piece is:

```js
T: [[0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]],
```

The falling piece is that grid plus a position in the well, `x` (its left column) and `y` (its top row). Drawing it, moving it and landing it all read the same small grid. Which piece comes next is picked from a shuffled bag of all seven; when the bag is empty, a new one is shuffled. Plain random picks can deal the same piece many times in a row, and the bag stops that.

## Every move asks one question

`fits(shape, x, y)` looks at every 1 in the piece's grid and checks that its square in the well is inside the walls, above the floor and empty. Moving left is "does it fit one column to the left? Then move." Falling is "does it fit one row down? Then fall; if not, the piece has landed." Turning is "does the turned grid fit?" One test behind every move means one place to get right, and the piece can never end up inside a wall.

## How to rotate a piece

This is the question with more than 31,000 views on Game Development Stack Exchange, "How to rotate blocks in tetris", and the short answer is: rotate the piece's grid. A quarter turn clockwise makes each column of the old grid, read from the bottom up, into a row of the new one. In JavaScript that is one line:

```js
const rotate = shape => shape[0].map((_, c) => shape.map(row => row[c]).reverse());
```

The square grid (3 by 3 for most pieces, 4 by 4 for the long I) is why the pieces turn around a fixed point and do not drift across the well as they spin.

A piece against a wall often cannot turn in place: the turned grid would stick out through the wall. A **wall kick** tries the turned piece one square to the left, then one to the right, then two each way, and takes the first place that fits. Without it, a long I piece standing against the right wall cannot be laid flat at all. The official game uses longer kick tables per piece; the five tries here are a common short version.

## Falling on a clock

The rules run in **ticks**, 60 a second, whatever the screen's refresh rate. Every tick a counter goes up, and when it reaches the piece's speed, the piece moves down one row. At level 0 that is every 48 ticks, and each level takes 6 off, down to 6. The level is the number of lines cleared divided by ten, rounded down, so the game gets faster every ten lines. Holding the down arrow makes the piece fall every 2 ticks (a soft drop), and Space moves it straight down until it lands (a hard drop).

## Landing, clearing and game over

When a piece cannot move down, it **locks**: each of its blocks is written into the well. Then every full row is removed and empty rows are added at the top, the same number, so the rows above drop. The safe way is to keep the rows that are not full and put new empty ones on top:

```js
const kept = well.filter(row => row.some(cell => !cell));
well = [...Array.from({ length: H - kept.length }, () => Array(W).fill('')), ...kept];
```

Removing rows one by one inside a loop that walks the well is a common first version, and it skips rows: after a row is removed, the row above slides into its place, and the loop moves on past it. The test further down shows what that does to a four-line clear.

Points go up with the number of rows cleared at once (100, 300, 500 or 800, times the level plus one). A new piece starts at the top; if it does not fit there, the well is full and the game is over.

## The game: block well

Arrow keys move the piece, the up arrow turns it, the down arrow drops it faster and Space drops it at once. Save the file as `index.html`, run `npm install three` in its folder (this needs Node.js, a free program that installs JavaScript libraries), serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Block well</title>
<style>html,body{margin:0;overflow:hidden;background:#1e2a44}canvas{display:block}
#hud{position:fixed;top:16px;left:20px;color:#fff;font:700 20px system-ui;line-height:1.5;white-space:pre}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const W = 10, H = 20;                         // the well is 10 squares wide and 20 deep
// Each piece is a small grid: 1 is a block. Rotating a piece is rotating its grid.
const PIECES = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
};
const COLORS = { I: 0x40d0f0, O: 0xf0d040, T: 0xb050f0, S: 0x50e060, Z: 0xf05050, J: 0x4070f0, L: 0xf09030, '#': 0x8090a0 };
const rotate = shape => shape[0].map((_, c) => shape.map(row => row[c]).reverse());   // a quarter turn clockwise

// Seeded random numbers, so a test sees the same pieces every time.
let seed = 7;
function random() {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
let bag = [];
const nextName = () => {                     // all seven pieces in a shuffled bag, then a new bag
  if (!bag.length) { bag = Object.keys(PIECES); for (let i = 6; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } }
  return bag.pop();
};

// The well is a grid of letters: '' is empty, a piece's letter is a block it left behind.
let well, piece, lines, score, over, fallTicks, softDrop;

function fits(shape, x, y) {
  return shape.every((row, r) => row.every((on, c) => !on ||
    (x + c >= 0 && x + c < W && y + r < H && (y + r < 0 || !well[y + r][x + c]))));
}

function spawn(name = nextName()) {
  const shape = PIECES[name];
  piece = { name, shape, x: Math.floor((W - shape[0].length) / 2), y: 0 };
  if (!fits(shape, piece.x, piece.y)) over = true;
}

function newGame() {
  well = Array.from({ length: H }, () => Array(W).fill(''));
  lines = 0; score = 0; over = false; fallTicks = 0; softDrop = false;
  spawn();
}

const level = () => Math.floor(lines / 10);
const ticksPerRow = () => Math.max(6, 48 - 6 * level());       // faster every ten lines

function move(dx) { if (fits(piece.shape, piece.x + dx, piece.y)) piece.x += dx; }

// Rotate; if the turned piece hits a wall or a block, try it one square left, one right, then two (a wall kick).
function turn() {
  const shape = rotate(piece.shape);
  for (const dx of [0, -1, 1, -2, 2]) {
    if (fits(shape, piece.x + dx, piece.y)) { piece.shape = shape; piece.x += dx; return; }
  }
}

// Copy the piece into the well, clear every full row, and bring the next piece.
function lock() {
  piece.shape.forEach((row, r) => row.forEach((on, c) => { if (on && piece.y + r >= 0) well[piece.y + r][piece.x + c] = piece.name; }));
  const kept = well.filter(row => row.some(cell => !cell));
  const cleared = H - kept.length;
  well = [...Array.from({ length: cleared }, () => Array(W).fill('')), ...kept];   // the rows above drop down
  lines += cleared;
  score += [0, 100, 300, 500, 800][cleared] * (level() + 1);
  spawn();
}

function down() {
  if (fits(piece.shape, piece.x, piece.y + 1)) piece.y++;
  else lock();
}

function tick() {
  if (over) return;
  if (++fallTicks >= (softDrop ? 2 : ticksPerRow())) { fallTicks = 0; down(); }
}

function act({ key, down: pressed = true }) {
  if (key === 'ArrowDown') softDrop = pressed;
  if (!pressed) return;
  if (over) { if (key === 'KeyR') newGame(); return; }
  if (key === 'ArrowLeft') move(-1);
  if (key === 'ArrowRight') move(1);
  if (key === 'ArrowUp') turn();
  if (key === 'Space') { while (fits(piece.shape, piece.x, piece.y + 1)) piece.y++; lock(); }
}
addEventListener('keydown', e => { if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); act({ key: e.code }); });
addEventListener('keyup', e => act({ key: e.code, down: false }));

// Drawing: one cube per square of the well, shown in the colour of whatever fills it.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.NeutralToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e2a44);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(9, -5, 30);
camera.lookAt(W / 2 - 0.5, -H / 2 + 0.5, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x303850, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(5, 8, 10);
scene.add(sun);
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5c88 });
const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ color: 0x31436c }));
back.name = 'back of the well';
back.position.set(W / 2 - 0.5, -H / 2 + 0.5, -0.5);
scene.add(back);
for (const [w, h, x, y] of [[1, H + 1, -1, -H / 2], [1, H + 1, W, -H / 2], [W, 1, W / 2 - 0.5, -H]]) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1), wallMaterial);
  wall.name = 'well';
  wall.position.set(x, y, 0);
  scene.add(wall);
}
const materials = Object.fromEntries(Object.entries(COLORS).map(([k, c]) => [k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 })]));
const cube = new THREE.BoxGeometry(0.92, 0.92, 0.92);
const cubes = [];
for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
  const m = new THREE.Mesh(cube, materials.I);
  m.position.set(c, -r, 0);
  scene.add(m);
  cubes.push(m);
}
const hud = document.getElementById('hud');

function draw() {
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const pr = r - piece.y, pc = c - piece.x;
    const inPiece = piece.shape[pr]?.[pc] === 1;
    const letter = inPiece ? piece.name : well[r][c];
    const m = cubes[r * W + c];
    m.visible = !!letter;
    if (letter) { m.material = materials[letter]; m.name = inPiece ? 'piece' : 'block'; }
  }
  hud.textContent = `Lines ${lines}\nLevel ${level()}\nScore ${score}${over ? '\nGame over: R to restart' : ''}`;
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
newGame();
let last = null, time = 0;
renderer.setAnimationLoop(now => {
  time += last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;
  for (; time >= 1 / 60; time -= 1 / 60) tick();        // the rules run at 60 ticks a second on any screen
  draw();
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'block well', units: 'squares', keys: { ArrowLeft: 'move left', ArrowRight: 'move right', ArrowUp: 'rotate', ArrowDown: 'drop faster', Space: 'drop', KeyR: 'restart after game over' } }),
  observe: () => ({ piece: piece.name, x: piece.x, y: piece.y, lines, level: level(), score, over,
    stack: well.filter(row => row.some(Boolean)).map(row => row.map(cell => cell || '.').join('')) }),
  act,
  // { stack: rows of 10 characters, top to bottom ('.' empty, any other character a block), piece: 'I', lines }
  setState: s => {
    newGame();
    if (s.stack) s.stack.forEach((row, i) => { well[H - s.stack.length + i] = [...row].map(ch => ch === '.' ? '' : '#'); });
    if (s.lines !== undefined) lines = s.lines;
    if (s.piece) spawn(s.piece);
  },
};
</script>
</body></html>
```

`PIECES`, `rotate`, `fits`, `turn`, `lock` and `tick` are the rules above, and none of them touches three.js. The drawing part makes one cube for each of the 200 squares of the well once, and each frame `draw()` shows or hides each cube and gives it the colour of the piece in that square. The well's walls and back panel are a few boxes. `window.__game` at the end lets a test tool read the piece and the stack (the non-empty rows, top to bottom, with `.` for an empty square) and load a well with `setState`; the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code, Cursor or Codex that writes and edits the files of your project) can write this from a prompt that names the parts:

```text
Make a falling-block puzzle game in one index.html with three.js: a well 10 squares
wide and 20 deep, drawn with 3D cubes. Keep the well as a grid and each of the 7
pieces as a small grid of 0s and 1s, picked from a shuffled bag of all 7. Write one
fits(shape, x, y) test and use it for every move. Rotate by turning the piece's grid
a quarter turn clockwise, with a wall kick (try 0, -1, +1, -2, +2 columns). Run the
rules in fixed ticks of 1/60 s: the piece drops one row every 48 ticks, 6 fewer per
level, and the level goes up every 10 lines. Lock a landed piece, remove every full
row with a filter (not inside a loop), add empty rows on top, and score
100/300/500/800 for 1 to 4 rows. Game over when a new piece does not fit.
Give the game its own name.
```

The last line is there because Tetris is a trademark, and its owners have taken clones that copied its name and look to court; a game you share should have a name of its own.

## When a falling-block game goes wrong

- **A piece turns into a wall, or half of it sticks out.** A move was made without asking `fits()`. Every move, including turning, goes through it.
- **A piece cannot turn next to a wall.** There is no wall kick. Try the turned piece one and two columns to each side.
- **Pieces drift sideways as they turn.** The piece's grid is not square. Give it a square grid (3 by 3, or 4 by 4 for the I).
- **Two full rows cleared together leave one behind.** Rows were removed one by one inside a loop. Keep the rows that are not full and add empty ones on top.
- **The game runs faster on one screen than another.** The drop counts frames instead of time. Run the rules in fixed ticks of 1/60 s, as the loop above does.
- **A key press moves the page instead of the piece.** Arrow keys and Space scroll the page; call `preventDefault()` on them.

## Let the agent play it

Checking a line clear by hand means playing until a row is nearly full, every time something changes. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can set up a moment, press keys on exact frames and read the result as numbers. Install it in Claude Code with these two lines in a terminal (the window where you type commands):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

`interact` plays steps frame by frame. A `{ state }` step calls the game's `setState`, so the first step loads a well with four rows full but for the right-hand column, and a long I piece. The next steps turn it, move it right four times and drop it, and `expect` checks four lines and one row left:

```text
interact {"steps":[{"state":{"stack":["...##.....","#########.","#########.","#########.","#########."],"piece":"I"}},{"key":"ArrowUp"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"Space"},{"wait":2}],"expect":{"lines":4,"score":800,"stack.0":"...##.....","stack.length":1}}

{"changed":{"piece":"Z","lines":4,"score":800,"stack":["...##....."]}}
Expect: lines 4 ✓ · score 800 ✓ · stack.0 "...##....." ✓ · stack.length 1 ✓
```

On a version whose clear loop removed rows one at a time, the same call answered:

```text
interact {"steps":[{"state":{"stack":["...##.....","#########.","#########.","#########.","#########."],"piece":"I"}},{"key":"ArrowUp"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"Space"},{"wait":2}],"expect":{"lines":4,"score":800,"stack.0":"...##.....","stack.length":1}}

{"changed":{"piece":"Z","lines":2,"score":300,"stack":["...##.....","#########I","#########I"]}}
Expect: lines 2 ✗ expected 4 · score 300 ✗ expected 800 · stack.0 "...##....." ✓ · stack.length 3 ✗ expected 1
```

Two of the four full rows were skipped and stayed in the well, still full. Once the call passes, adding `save` to it keeps it as a check that `test` reruns after every later change.

The wall kick, checked the same way: the I piece stood up, pushed right until it touches the wall, then turned flat again. Without a kick it would stay upright; with it, it moves one column left and lies flat:

```text
interact {"steps":[{"state":{"piece":"I"}},{"key":"ArrowUp"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowUp"}],"expect":{"piece":"I","x":6}}

{"changed":{"piece":"I","x":6,"lines":0,"score":0,"stack":[]}}
Expect: piece "I" ✓ · x 6 ✓
```

`trace` reads a value every frame and reports when it first changed. Here it reads the piece's row at level 0 and then at level 1 (ten lines already cleared):

```text
interact {"steps":[{"state":{"piece":"T","lines":0}},{"wait":100}],"trace":["y"]}

{"changed":{"piece":"T","x":3,"y":2}}
y: 0 → 2 at frame 95; first changed at frame 47

interact {"steps":[{"state":{"piece":"T","lines":10}},{"wait":100}],"trace":["y"]}

{"changed":{"lines":10,"level":1}}
y: 0 → 2 at frame 83; first changed at frame 41
```

The piece first moved down at frame 47 at level 0 and at frame 41 at level 1: 6 ticks sooner, as the speed rule says. `look` with `sheet` reloads the game for each moment and pictures them side by side: the start, the loaded well, the I piece turned and moved, and the well after the drop with the two blocks from the top row now on the floor:

```text
look {"sheet":[{"label":"start"},{"label":"nearly full","state":{"stack":["...##.....","#########.","#########.","#########.","#########."],"piece":"I"}},{"label":"turned and moved","state":{"stack":["...##.....","#########.","#########.","#########.","#########."],"piece":"I"},"steps":[{"key":"ArrowUp"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowRight"}]},{"label":"dropped","state":{"stack":["...##.....","#########.","#########.","#########.","#########."],"piece":"I"},"steps":[{"key":"ArrowUp"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"Space"}]}]}

Picture: <project>/paprika3d/runs/2026-10-31T07-28-07-533Z/look-5-sheet.png (4 moments, left to right, top to bottom: start | nearly full | turned and moved | dropped); the game is reloaded at its first frame
start: on screen: back of the well, well ×3, piece ×4; pixels: brightness 17%, colour saturation 61%, 0% near black, 0% blown out
nearly full: on screen: back of the well, well ×3, piece ×4, block ×38; pixels: brightness 18%, colour saturation 59%, 0% near black, 0% blown out
turned and moved: on screen: back of the well, well ×3, block ×38, piece ×4; pixels: brightness 18%, colour saturation 59%, 0% near black, 0% blown out
dropped: on screen: back of the well, well ×3, piece ×4, block ×2; pixels: brightness 17%, colour saturation 61%, 0% near black, 0% blown out
This sheet took 2 s (about 0 s a cell) on a software renderer.
```

These replies were captured on 2026-10-31 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not decide how fast the game should get or whether it is fun at level 5; it plays the moments the agent sets up and reports what happened. The checks are steps the agent writes for this game, not a built-in falling-block test.

## Next steps

- Show the next piece and a "hold" box: both read the same bag and the same small grids.
- Pause, and a title screen: [how to make a main menu for a game](/guides/make-a-main-menu).
- A game over screen with a restart: [how to add a game over screen](/guides/add-a-game-over-screen).
- Keep the high score: [how to save the high score](/guides/save-the-high-score).
- Speed that rises and stays fair: [how to make a game more fun](/guides/make-a-game-more-fun).
- Another grid game, where matches clear: [how to make a match 3 game](/guides/make-a-match-3-game).
- A sound for every line: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Share it: [how to put your game online](/guides/put-your-game-online).
