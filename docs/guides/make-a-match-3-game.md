---
title: How to make a match 3 game in three.js: swap, match and fall
phrase: how to make a match 3 game
description: How to make a match 3 game like Candy Crush or Bejeweled in the browser with three.js, for a first game: the board as a grid of numbers, finding three or more in a row, swapping two neighbours and swapping back when nothing matches, clearing, letting the gems above fall and dropping new ones in, chains, and a fair board with no match at the start and always a move; a small gem game to paste, the prompt to give an AI agent, and paprika3d clicking the gems, picturing the fall and dealing a thousand boards to check them.
meta: How to make a match 3 game in three.js: the board as numbers, finding three in a row, swap, clear, fall and refill, on a small gem game.
intent: make-a-match-3-game
queries:
  - "how to make a match 3 game"
  - "how to make a game like candy crush"
  - "Match-three puzzle games algorithm"
  - "How to detect matches in match-3 game?"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a match 3 game in three.js: swap, match and fall

A match 3 game is a board of coloured pieces where the player swaps two neighbours to line up three or more of a kind. The line disappears, the pieces above it fall into the gap, and new ones drop in from the top. Candy Crush and Bejeweled are the well-known ones. Under the colours, the whole game is a grid of numbers and four small rules, and the one people search for by name, "Match-three puzzle games algorithm" (a Game Development Stack Exchange question with more than 37,000 views), is the second:

1. **Swap** two neighbouring pieces, and swap them back when nothing matches.
2. **Find matches**: every piece that is part of three or more in a row or a column.
3. **Clear and fall**: remove the matched pieces, slide the ones above them down, and fill the empty squares at the top with new ones.
4. **Look again**, because falling pieces can line up by themselves. That is a chain (some games call it a cascade), and it repeats until nothing matches.

Two more rules keep it fair: the board must not start with a match already on it, and there must always be at least one swap that makes a match.

A few words first. **three.js** is a JavaScript library that draws 3D scenes in a web page, inside a **canvas** (the rectangle where the game appears). The **game loop** is a function the browser calls about sixty times a second; each call moves things a little and draws one picture. An **array** is a list in JavaScript, and an array with one array per row is a **grid**.

## The board is numbers

Keep the board as a grid of numbers, one per square: `grid[row][column]` is 0 for a red gem, 1 for a yellow one, and so on up to 4. The 3D gems on screen show what the grid says and nothing more. Every rule reads and writes the grid, and none of them asks the 3D scene where a gem is. That one decision keeps a match 3 game short: matching, falling and looking for a move are a few loops over a small list of numbers. It also means the 3D look changes nothing about the rules; the same code would run a flat board of pictures.

To turn a click into a square, the game takes the line from the camera through the mouse pointer, finds where it meets the flat plane of the board, and rounds that point to the nearest row and column. The click does not have to land on the gem itself.

## Finding matches

Visit every square and look at the two squares to its right and the two below it. If all three hold the same number, they are a match. A run of four or five is found as overlapping threes, so it needs no code of its own. Each matched square goes into a `Set` (a list that ignores repeats), so a gem that is in a row match and a column match at once is counted and cleared once. This is the function from the game below:

```js
function findMatches() {
  const hit = new Set();
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const k = grid[r][c];
    if (c + 2 < N && grid[r][c + 1] === k && grid[r][c + 2] === k) for (let i = 0; i < 3; i++) hit.add(r * N + c + i);
    if (r + 2 < N && grid[r + 1][c] === k && grid[r + 2][c] === k) for (let i = 0; i < 3; i++) hit.add((r + i) * N + c);
  }
  return hit;
}
```

Each square is stored as one number, `row * N + column`, which is easier to keep in a set than a pair.

## Swap, and swap back

A click selects a gem (a white ring shows which), and a click on a neighbour swaps the two. Two squares are neighbours when their rows and columns differ by exactly one in total, `Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1`, so a diagonal swap is refused. The game swaps the two numbers in the grid straight away and lets the two gems slide to their new squares. When they arrive, it looks for matches. If there are none, it swaps the numbers back and the gems slide home, which is how the player learns the move was not allowed.

## Clear, fall, refill, and chains

Clearing a match sets its squares to -1, meaning empty. Then each column is walked from the bottom up: every gem left in it moves down to the lowest free square, and the squares left over at the top get new random gems, which start above the board and fall in. When every gem has reached its square, the game looks for matches again, and a new line made by the fall clears and falls in turn. The loop stops when the board has no match left. Every gem in the chain scores.

While anything is moving, the game ignores clicks (the `busy` flag), so a second swap cannot start in the middle of a fall.

## A fair board

Filling every square with a random gem is what everyone tries first, and it nearly always deals a board with a match already on it, which then clears before the player has touched anything. The fix is to deal row by row, left to right, and pick again whenever the new gem would make three with the two to its left or the two above it. Those are the two directions a new gem can finish a line in, because the squares to its right and below are not dealt yet.

After every move, check that a move is left: `hasMove()` tries each swap with the right and the lower neighbour, looks for a match and swaps back. If no swap works, the game deals a new board. Many commercial games shuffle the gems already there instead; a fresh deal is shorter to write.

## The game: gem swap

Click a gem, then one next to it. Save the file as `index.html`, run `npm install three` in its folder (this needs Node.js, a free program that installs JavaScript libraries), serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. The import map line near the top tells the browser where three.js is. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Gem swap</title>
<style>html,body{margin:0;overflow:hidden;background:#1d1830}canvas{display:block}
#hud{position:fixed;top:14px;width:100%;text-align:center;color:#fff;font:700 22px system-ui}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const N = 7;                                  // a 7 by 7 board
const KINDS = [                               // one colour and one shape per kind of gem
  { name: 'red gem', color: 0xff4050, geometry: new THREE.OctahedronGeometry(0.4) },
  { name: 'yellow gem', color: 0xffd040, geometry: new THREE.BoxGeometry(0.5, 0.5, 0.5) },
  { name: 'green gem', color: 0x40d070, geometry: new THREE.CylinderGeometry(0.35, 0.35, 0.3, 6).rotateX(Math.PI / 2) },
  { name: 'blue gem', color: 0x40a0ff, geometry: new THREE.SphereGeometry(0.34, 20, 12) },
  { name: 'purple gem', color: 0xb060ff, geometry: new THREE.ConeGeometry(0.38, 0.65, 4) },
];

// A random number generator started from a seed, so seed 1 always deals the same board.
let seed = Number(new URLSearchParams(location.search).get('seed') ?? 1);
function random() {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.NeutralToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1d1830);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 14);
scene.add(new THREE.HemisphereLight(0xffffff, 0x302040, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(3, 5, 8);
scene.add(sun);
const tray = new THREE.Mesh(new THREE.BoxGeometry(N + 0.4, N + 0.4, 0.3), new THREE.MeshStandardMaterial({ color: 0x3a3060 }));
tray.name = 'board';
tray.position.z = -0.5;
scene.add(tray);
const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.05, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
ring.name = 'selection';
ring.visible = false;
scene.add(ring);
const hud = document.getElementById('hud');

// The board is numbers: grid[row][column] is a kind (0 to 4), and gems[row][column] is the mesh that shows it.
let grid = [], gems = [], score = 0, cleared = 0, moves = 0, selected = null, busy = false, lastSwap = null;
const place = (r, c) => new THREE.Vector3(c - (N - 1) / 2, (N - 1) / 2 - r, 0);

function makeGem(kind, r, c, startY) {
  const gem = new THREE.Mesh(KINDS[kind].geometry, new THREE.MeshStandardMaterial({ color: KINDS[kind].color, roughness: 0.3 }));
  gem.name = KINDS[kind].name;
  gem.position.copy(place(r, c));
  if (startY !== undefined) gem.position.y = startY;
  scene.add(gem);
  return gem;
}

// Deal a board with no three in a row: re-pick a gem that would match the two to its left or the two above it.
function deal() {
  for (const row of gems) for (const gem of row) scene.remove(gem);
  grid = []; gems = [];
  for (let r = 0; r < N; r++) {
    grid.push([]); gems.push([]);
    for (let c = 0; c < N; c++) {
      let k;
      do k = Math.floor(random() * KINDS.length);
      while ((c >= 2 && grid[r][c - 1] === k && grid[r][c - 2] === k) || (r >= 2 && grid[r - 1][c] === k && grid[r - 2][c] === k));
      grid[r].push(k);
      gems[r].push(makeGem(k, r, c));
    }
  }
  if (!hasMove()) deal();
}

// Every gem that is part of three or more in a row or a column. Longer runs are overlapping threes.
function findMatches() {
  const hit = new Set();
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const k = grid[r][c];
    if (c + 2 < N && grid[r][c + 1] === k && grid[r][c + 2] === k) for (let i = 0; i < 3; i++) hit.add(r * N + c + i);
    if (r + 2 < N && grid[r + 1][c] === k && grid[r + 2][c] === k) for (let i = 0; i < 3; i++) hit.add((r + i) * N + c);
  }
  return hit;
}

function swapCells([r1, c1], [r2, c2]) {
  [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
  [gems[r1][c1], gems[r2][c2]] = [gems[r2][c2], gems[r1][c1]];
}

// Is there a swap of two neighbours anywhere that makes a match?
function hasMove() {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) {
    if (r + dr >= N || c + dc >= N) continue;
    swapCells([r, c], [r + dr, c + dc]);
    const found = findMatches().size > 0;
    swapCells([r, c], [r + dr, c + dc]);
    if (found) return true;
  }
  return false;
}

function trySwap(a, b) {
  if (busy || Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) return;
  busy = true;
  lastSwap = [a, b];
  swapCells(a, b);               // the gems slide; settled() decides what happens when they arrive
}

// Remove matched gems, let the gems above fall into the holes, and drop new gems in from the top.
function clearAndFall(hit) {
  cleared += hit.size;
  score += hit.size * 10;
  for (const i of hit) { scene.remove(gems[Math.floor(i / N)][i % N]); grid[Math.floor(i / N)][i % N] = -1; }
  for (let c = 0; c < N; c++) {
    let to = N - 1;
    for (let r = N - 1; r >= 0; r--) if (grid[r][c] >= 0) { grid[to][c] = grid[r][c]; gems[to][c] = gems[r][c]; to--; }
    for (let r = to, above = 1; r >= 0; r--, above++) {
      grid[r][c] = Math.floor(random() * KINDS.length);
      gems[r][c] = makeGem(grid[r][c], r, c, (N - 1) / 2 + above);
    }
  }
}

// Called when every gem has reached its square.
function settled() {
  const hit = findMatches();
  if (hit.size) {
    if (lastSwap) moves++;
    lastSwap = null;
    clearAndFall(hit);           // new gems fall, and settled() runs again for any chain
    return;
  }
  if (lastSwap) { swapCells(...lastSwap); lastSwap = null; return; }   // no match: the gems slide back
  if (!hasMove()) deal();
  busy = false;
}

// Click a gem, then a neighbour, to swap them. The click becomes a square: where its ray meets the board's plane.
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), hit = new THREE.Vector3();
const boardPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
renderer.domElement.addEventListener('pointerdown', e => {
  pointer.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  if (busy || !raycaster.ray.intersectPlane(boardPlane, hit)) return;
  const cell = [Math.round((N - 1) / 2 - hit.y), Math.round(hit.x + (N - 1) / 2)];
  if (cell.some(v => v < 0 || v >= N)) return;
  if (selected && Math.abs(selected[0] - cell[0]) + Math.abs(selected[1] - cell[1]) === 1) { trySwap(selected, cell); selected = null; }
  else selected = selected && selected[0] === cell[0] && selected[1] === cell[1] ? null : cell;
});

function update(dt) {
  let moving = false;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const gem = gems[r][c], to = place(r, c), d = to.clone().sub(gem.position), step = 9 * dt;   // 9 squares a second
    if (d.length() > step) { gem.position.addScaledVector(d.normalize(), step); moving = true; }
    else gem.position.copy(to);
    gem.rotation.y += dt;
  }
  if (busy && !moving) settled();
  ring.visible = !!selected;
  if (selected) ring.position.copy(place(...selected));
  hud.textContent = `Score ${score}   Moves ${moves}`;
}

function fit() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.position.z = 11 / Math.min(1, camera.aspect);   // move back on a tall, narrow screen
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}
addEventListener('resize', fit);
fit();
deal();
let last = null;
renderer.setAnimationLoop(now => {
  update(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'gem swap', units: 'squares', mouse: 'click a gem, then a neighbour, to swap them' }),
  observe: () => ({ score, cleared, moves, busy, selected, board: grid.map(row => row.map(k => 'RYGBP'[k]).join('')) }),
  act: ({ action, from, to }) => { if (action === 'swap') trySwap(from, to); },
  setState: s => { if (s.seed !== undefined) { seed = s.seed; score = cleared = moves = 0; selected = null; deal(); } },
  findMatches, hasMove,
};
</script>
</body></html>
```

`KINDS` at the top gives each kind of gem a colour and a shape, so the board can be read by shape as well as colour. `deal`, `findMatches`, `hasMove`, `trySwap` and `clearAndFall` are the rules above. `update` slides every gem toward its square at 9 squares a second and calls `settled()` when all of them have arrived; `settled()` decides what happens next: clear a match, swap back, or wait for the player. The random numbers start from a seed, so the board is the same on every load, which makes the game testable; `?seed=2` at the end of the address deals another. `window.__game` at the end lets a test tool read the board as letters (R for red, Y yellow, G green, B blue, P purple); the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code, Cursor or Codex that writes and edits the files of your project) writes this kind of game quickly when you name the rules:

```text
Make a match 3 game in one index.html with three.js: a 7 by 7 board of 3D gems in
5 colours, each colour a different shape. Keep the board as a grid of numbers and
draw the gems from it. Click a gem, then a neighbour, to swap them; if the swap makes
no row or column of 3 or more, swap them back. Clear every match, let the gems above
fall, drop new random gems in from the top, and keep clearing chains until the board
is still. Deal the first board with no matches, and after every move check that some
swap still makes a match; if none does, deal a new board. Animate the slides and
falls, ignore clicks while anything moves, and show the score.
```

[How to use an AI agent to build a three.js game](/guides/ai-agent-build-threejs-game) covers the build loop itself: one change at a time, and checking each one.

## When a match 3 game goes wrong

- **Gems vanish before the player does anything.** The board was dealt with matches on it. Deal with the pick-again rule.
- **A line of four scores more than four gems, or a gem in a cross counts twice.** Collect the matched squares in a set before clearing any of them.
- **Gems overlap or leave holes in the middle of a column.** The fall moved the numbers but not the gems, or the other way round. Move both together, as `clearAndFall` does.
- **Two quick swaps tangle the board.** Clicks were taken while gems were moving. Ignore them until everything has settled.
- **The player is stuck with no move and no message.** Nothing checked for a move after the last one. Run `hasMove()` after every move.
- **Clicks pick the gem next to the one under the pointer.** The click is turned into a square with another size or camera than the one that draws the board. Use the canvas size and the same camera, and update the camera's matrices after moving it.

## Let the agent play it

A match 3 game breaks in ways a screenshot does not show: a swap that should slide back and does not, a chain that never stops, a board with no move left. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can click it, picture it and read its state as numbers. Install it in Claude Code with these two lines in a terminal (the window where you type commands):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

`interact` plays clicks and key presses frame by frame and reads `window.__game.observe()` afterwards; `expect` compares the state with what the agent expected. Here it clicks the red gem at the top of the second column and the green one below it, then waits 90 frames:

```text
interact {"steps":[{"mouse":"click","x":440,"y":100},{"mouse":"click","x":440,"y":200},{"wait":90}],"expect":{"cleared":3,"moves":1}}

{"changed":{"score":160,"cleared":16,"moves":1,"board":["BRRPYYB","BGYBGRG","YBGPYBY","RYGBBYY","BGBPBGB","PYBGYGY","RBGYRBP"]}}
mouse click at (440, 200): over green gem (Mesh, 11.2 units)
Expect: cleared 16 ✗ expected 3 · moves 1 ✓
```

The expectation was wrong, not the game. The reply's board has the three reds gone and no match left anywhere, and as the gems fell they made further matches, 16 gems cleared by one swap. A chain is the game working, so the agent fixes its test, not the code. A swap that makes nothing must slide back; here on a fresh board from seed 1, the two gems at the bottom left:

```text
interact {"steps":[{"state":{"seed":1}},{"mouse":"click","x":340,"y":700},{"mouse":"click","x":440,"y":700},{"wait":60}],"expect":{"moves":0,"busy":false,"board.6":"RBGYRBP"}}

{"changed":{"score":0,"cleared":0,"moves":0,"board":["BRGPPYB","BGPGGRG","YRGRYBY","RRGGBYY","BGBRBGB","PYBRYGY","RBGYRBP"]}}
mouse click at (340, 700): over red gem (Mesh, 11.5 units)
mouse click at (440, 700): over blue gem (Mesh, 11.2 units)
Expect: moves 0 ✓ · busy false ✓ · board.6 "RBGYRBP" ✓
```

The bottom row reads as it did before the swap, and no move was counted. `look` with `sheet` reloads the game for each moment and puts them all in one picture: the board before the swap, 6 frames after it (the three reds already gone), 20 frames after it (new gems falling in) and 150 frames after it, when everything has settled:

```text
look {"sheet":[{"label":"start"},{"label":"matched","steps":[{"mouse":"click","x":440,"y":100},{"mouse":"click","x":440,"y":200}],"frames":6},{"label":"falling","steps":[{"mouse":"click","x":440,"y":100},{"mouse":"click","x":440,"y":200}],"frames":20},{"label":"settled","steps":[{"mouse":"click","x":440,"y":100},{"mouse":"click","x":440,"y":200}],"frames":150}]}

Picture: <project>/paprika3d/runs/2026-10-31T07-22-14-116Z/look-5-sheet.png (4 moments, left to right, top to bottom: start | matched | falling | settled); the game is reloaded at its first frame
start: on screen: board, blue gem ×12, green gem ×12, yellow gem ×10, red gem ×10, purple gem ×5; pixels: brightness 16%, colour saturation 65%, 0% near black, 0% blown out
matched: on screen: board, yellow gem ×11, green gem ×12, blue gem ×12, red gem ×7, purple gem ×5; pixels: brightness 16%, colour saturation 65%, 0% near black, 0% blown out
falling: on screen: board, yellow gem ×11, green gem ×12, blue gem ×13, red gem ×7, purple gem ×6; pixels: brightness 16%, colour saturation 65%, 0% near black, 0% blown out
settled: on screen: board, yellow gem ×13, green gem ×10, blue gem ×15, red gem ×6, purple gem ×5; pixels: brightness 16%, colour saturation 66%, 0% near black, 0% blown out
This sheet took 13 s (about 3 s a cell) on a software renderer.
```

`eval` runs code inside the page. With it the agent dealt a thousand boards, seeds 1 to 1000, and counted the unfair ones:

```js
const g = window.__game, boards = { dealt: 0, startWithAMatch: 0, haveNoMove: 0 };
for (let seed = 1; seed <= 1000; seed++) {
  g.setState({ seed });
  boards.dealt++;
  if (g.findMatches().size > 0) boards.startWithAMatch++;
  if (!g.hasMove()) boards.haveNoMove++;
}
return boards;
```

With a `deal()` that fills every square with any random gem, the version people try first, the answer was:

```text
{"dealt":1000,"startWithAMatch":910,"haveNoMove":0}
```

910 boards out of a thousand began with a match that would clear before the first click. With the pick-again rule, as in the game above:

```text
{"dealt":1000,"startWithAMatch":0,"haveNoMove":0}
```

These replies were captured on 2026-10-31 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not design the board, pick the colours or judge whether the game is fun; it runs the game and reports what happened. The thousand-board count is code the agent writes for this game's rules, not a check built into the tool.

## Next steps

- End the game when the moves run out: [how to add a game over screen](/guides/add-a-game-over-screen).
- Keep the top score after the page closes: [how to save the high score](/guides/save-the-high-score).
- Make a clear feel like something, with a burst and a sound: [how to make a game feel good](/guides/make-a-game-feel-good) and [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Levels with a target score or a move limit: [how to make levels in a game](/guides/make-levels-in-a-game).
- Another grid game, where full rows clear: [how to make a tetris game](/guides/make-a-tetris-game).
- Swaps with a finger on a phone: [how to make a mobile game with AI](/guides/make-a-mobile-game-with-ai).
- Share it: [how to put your game online](/guides/put-your-game-online).
