---
title: How to make a puzzle game in three.js: pushing boxes onto targets
phrase: how to make a puzzle game
description: How to make a puzzle game for a first project, shown with the box-pushing puzzle (Sokoban): the rules (push, never pull), levels written as text in the standard notation, one move function, undo, and a solver that tries every move to prove each level can be finished; a small three.js crate-pushing game to paste, the prompt to give an AI agent, and paprika3d playing a solution, checking undo and running the solver inside the page.
meta: How to make a puzzle game in three.js: a box-pushing puzzle with push-only moves, undo, three levels and a solver that proves each one can be solved.
intent: make-a-puzzle-game
queries:
  - "how to make a puzzle game"
  - "how to make puzzle game in javascript"
  - "how to make a sokoban game"
  - "Prototyping a puzzle game for solvability of levels"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make a puzzle game in three.js: pushing boxes onto targets

A puzzle game gives the player a fixed situation, a few strict rules and a goal that takes thought to reach. Nothing chases the player and nothing is timed; the challenge is working out the order of moves. That makes a puzzle a friendly first game to build: the rules are short, the screen barely moves, and when something goes wrong it is easy to say exactly which move went wrong.

This page builds the classic one, the box-pushing puzzle known as **Sokoban** (Japanese for "warehouse keeper"). You walk around a small warehouse seen from above and push crates onto marked squares. It looks simple and is not, because of one rule: you can push a crate, but you can never pull it. A crate pushed into a corner is stuck there for good.

A few words before the code. **three.js** is a JavaScript library that draws 3D scenes in a web page. A **game loop** is a function the browser calls many times a second to draw the next picture. This puzzle is **turn-based**: nothing changes until you press a key, so the loop here does little more than draw.

## The rules, written down

Every puzzle game starts as a short list of rules. For this one:

1. The player moves one square up, down, left or right per key press, and cannot enter a wall.
2. Moving into a crate pushes it one square the same way, if the square behind it is empty floor or a target. A wall or a second crate behind it blocks the move.
3. Crates are never pulled.
4. The level is solved when every crate sits on a target.
5. Undo takes back the last move; restart puts the level back as it began.

Rule 5 is not decoration. Because a crate in a corner can never come out, a player who makes one wrong push has lost the level, and without undo they must replay it from the start.

## A level is a few lines of text

Box-pushing puzzles have used the same text notation for decades, and thousands of free levels are written in it:

| Character | Means |
|---|---|
| `#` | wall |
| (space) | floor |
| `.` | target |
| `$` | crate |
| `*` | crate already on a target |
| `@` | player |
| `+` | player standing on a target |

Each line of text is a row of the warehouse, so the level's shape is visible in the code itself. [How to make levels in a game](/guides/make-levels-in-a-game) explains the idea of keeping levels as data, with one function that builds any of them; this page uses the same pattern and spends its time on what is special to puzzles.

## One move function holds every rule

The whole puzzle lives in one function. It looks at the square the player wants to enter, and if a crate is there, at the square behind the crate:

```js
function move(d) {                 // d is +1 or -1 for right and left, +width or -width for down and up
  const to = p + d;
  if (walls.has(to)) return;                                   // rule 1
  const c = crates.indexOf(to);
  if (c >= 0 && (walls.has(to + d) || crates.includes(to + d))) return;   // rule 2: blocked push
  history.push({ p, crates: [...crates], moves });             // remember the position for undo
  if (c >= 0) crates[c] = to + d;                              // push
  p = to;
  moves++;
}
```

Squares are numbered row by row, so "one square right" is `+1` and "one square down" is `+width`. There is no code for pulling, which is how rule 3 is kept. Undo pops the last saved position off `history` and puts it back.

## The game: three warehouses

Push the orange crates onto the yellow squares with the arrow keys; a crate turns green on a target. `Z` undoes a move and `R` restarts the level. Save this as `index.html`, run `npm install three` in the same folder (npm comes with Node.js, a free program that installs JavaScript libraries), then serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. If the page stays empty, [HTML game not working?](/guides/html-game-not-working) covers the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Crate pusher</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}#hud{position:fixed;top:16px;left:20px;font:600 20px system-ui;color:#fff}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// # wall, space floor, . target, $ crate, * crate on a target, @ player, + player on a target
const LEVELS = [
  [
    '#######',
    '#@ $ .#',
    '#######',
  ],
  [
    '#######',
    '#     #',
    '#@$ $ #',
    '#   ..#',
    '#######',
  ],
  [
    '########',
    '#  #   #',
    '# $  $ #',
    '#@ ##$ #',
    '# ..  .#',
    '########',
  ],
];

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1d2433);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
scene.add(new THREE.HemisphereLight(0xffffff, 0x445066, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(4, 10, 6);
scene.add(sun);
const hud = document.getElementById('hud');

const box = new THREE.BoxGeometry(1, 1, 1);
const wallMat = new THREE.MeshStandardMaterial({ color: 0x5c6b8a });
const crateMat = new THREE.MeshStandardMaterial({ color: 0xc9853a });
const doneMat = new THREE.MeshStandardMaterial({ color: 0x5fd17a });
const targetMat = new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0x806010 });
const player = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.4, 4, 12), new THREE.MeshStandardMaterial({ color: 0x4fc3ff }));
player.name = 'player';
scene.add(player);

let level = 1, width = 0, walls = new Set(), targets = [], crates = [], p = 0;
let history = [], moves = 0, solvedFor = 0, won = false, built = null, crateMeshes = [];

const solved = () => crates.every(i => targets.includes(i));
const place = (mesh, i, y) => mesh.position.set(i % width, y, Math.floor(i / width));

function load(n) {
  level = n;
  const rows = LEVELS[n - 1];
  width = rows[0].length;
  const cells = rows.join('');
  walls = new Set([...cells].flatMap((c, i) => c === '#' ? [i] : []));
  targets = [...cells].flatMap((c, i) => '.*+'.includes(c) ? [i] : []);
  crates = [...cells].flatMap((c, i) => '$*'.includes(c) ? [i] : []);
  p = [...cells].findIndex(c => '@+'.includes(c));
  history = [];
  moves = 0;
  solvedFor = 0;
  if (built) scene.remove(built);
  built = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, rows.length).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2c3447 }));
  floor.name = 'floor';
  floor.position.set(width / 2 - 0.5, 0, rows.length / 2 - 0.5);
  built.add(floor);
  for (const i of walls) { const m = new THREE.Mesh(box, wallMat); m.name = 'wall'; place(m, i, 0.5); built.add(m); }
  for (const i of targets) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.7), targetMat);
    m.name = 'target';
    place(m, i, 0.02);
    built.add(m);
  }
  crateMeshes = crates.map(i => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), crateMat); m.name = 'crate'; place(m, i, 0.4); built.add(m); return m; });
  scene.add(built);
  const size = Math.max(width, rows.length);
  camera.position.set(width / 2 - 0.5, size * 1.1, rows.length / 2 - 0.5 + size * 0.45);
  camera.lookAt(width / 2 - 0.5, 0, rows.length / 2 - 0.5);
  draw();
}

// One move: walk, or push the crate in front if the square behind it is free. Never pull.
function move(d) {
  if (solvedFor || won) return;
  const to = p + d;
  if (walls.has(to)) return;
  const c = crates.indexOf(to);
  if (c >= 0 && (walls.has(to + d) || crates.includes(to + d))) return;
  history.push({ p, crates: [...crates], moves });
  if (c >= 0) crates[c] = to + d;
  p = to;
  moves++;
  if (solved()) solvedFor = 1;
  draw();
}

function undo() {
  const last = history.pop();
  if (!last) return;
  ({ p, crates, moves } = last);
  solvedFor = 0;
  draw();
}

function draw() {
  place(player, p, 0.55);
  crateMeshes.forEach((m, k) => { place(m, crates[k], 0.4); m.material = targets.includes(crates[k]) ? doneMat : crateMat; });
  hud.textContent = won ? 'All levels solved!' : `Level ${level} of ${LEVELS.length}   Moves ${moves}   Z undo, R restart`;
}

const DIRS = { ArrowUp: () => -width, ArrowDown: () => width, ArrowLeft: () => -1, ArrowRight: () => 1 };
addEventListener('keydown', e => {
  if (e.repeat) return;
  if (DIRS[e.key]) move(DIRS[e.key]());
  else if (e.key === 'z') undo();
  else if (e.key === 'r') load(level);
});

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
load(1);
renderer.setAnimationLoop(() => {
  // a solved level stays on screen for half a second, then the next one loads
  if (solvedFor && ++solvedFor > 30) {
    if (level < LEVELS.length) load(level + 1);
    else { won = true; solvedFor = 0; draw(); }
  }
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'crate pusher', units: 'squares', keys: { ArrowRight: 'move right', ArrowLeft: 'move left', ArrowUp: 'move up', ArrowDown: 'move down', z: 'undo', r: 'restart level' } }),
  observe: () => ({ level, moves, onTarget: crates.filter(i => targets.includes(i)).length, crates: crates.length, solved: solved(), won }),
  setState: (s) => { if (s.level) { won = false; load(s.level); } },
  levels: LEVELS,
  subject: player,
};
</script>
</body></html>
```

The three levels are the `LEVELS` list at the top. `load(n)` reads level `n`'s text into sets of square numbers (walls, targets, crates, the player) and builds a cube for each wall, a flat tile for each target and a box for each crate. `move` is the function above, `undo` restores the last saved position, and `draw` puts every mesh on its square and colours each crate by whether it sits on a target. The loop waits half a second on a solved level so the player sees it, then loads the next one. `window.__game` at the end lets a testing tool read the state and jump to a level; the game plays the same without it.

## Can every level be solved?

Someone asked on Game Development Stack Exchange how to check, while prototyping, that a puzzle's levels can be solved at all. It is the right worry. A box-pushing level can look fine and be impossible, and a player stuck on an impossible level blames themselves before they blame the game.

For small levels a computer can simply try everything. A **solver** starts from the level's first position and tries all four moves, then all four moves from each new position, and so on, remembering every position it has seen so it never visits one twice. Searching one move further each round is called **breadth-first search**, and it has a useful property: the first solution it finds uses the fewest moves. If it runs out of new positions without solving the level, the level has no solution.

```js
const solve = (rows) => {
  const w = rows[0].length, cells = rows.join('');
  const at = (chars) => [...cells].flatMap((ch, i) => chars.includes(ch) ? [i] : []);
  const goals = at('.*+'), start = { p: at('@+')[0], crates: at('$*'), path: '' };
  const key = (s) => s.p + ':' + [...s.crates].sort((a, b) => a - b);
  const seen = new Set([key(start)]);
  let todo = [start];
  while (todo.length) {                        // every position one move further each round
    const next = [];
    for (const s of todo) {
      if (s.crates.every(i => goals.includes(i))) return { moves: s.path.length, solution: s.path, positionsTried: seen.size };
      for (const [name, d] of [['U', -w], ['D', w], ['L', -1], ['R', 1]]) {
        const to = s.p + d;
        if (cells[to] === '#') continue;
        let crates = s.crates;
        if (crates.includes(to)) {               // a push: the square behind the crate must be free
          if (cells[to + d] === '#' || crates.includes(to + d)) continue;
          crates = crates.map(i => i === to ? to + d : i);
        }
        const n = { p: to, crates, path: s.path + name };
        if (!seen.has(key(n))) { seen.add(key(n)); next.push(n); }
      }
    }
    todo = next;
  }
  return { moves: null, positionsTried: seen.size };
};
return window.__game.levels.map((rows, i) => ({ level: i + 1, ...solve(rows) }));
```

A position is the player's square plus the crates' squares, sorted, so two orders of the same crates count as one position. On a first draft of level 3, with its left crate drawn one square up and left, in the top left corner, the solver answered:

```text
[{"level":1,"moves":3,"solution":"RRR","positionsTried":6},{"level":2,"moves":12,"solution":"URDLDRRURURD","positionsTried":889},{"level":3,"moves":null,"positionsTried":2306}]
```

Level 3 had no solution: a crate in a corner can never be pushed out, so that level was lost before the first move. Moving the crate out of the corner, as in the game above, gives:

```text
[{"level":1,"moves":3,"solution":"RRR","positionsTried":6},{"level":2,"moves":12,"solution":"URDLDRRURURD","positionsTried":889},{"level":3,"moves":21,"solution":"UURDDURRRDRDLLRUUURDD","positionsTried":2963}]
```

The move counts are also a rough difficulty scale: 3, then 12, then 21 moves. Trying every position gets slow as levels grow, because each extra crate multiplies the number of positions; for big levels, solvers skip positions that are already lost, such as a crate in a corner that is not a target.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code, Cursor or Codex that writes and edits the files in your project) builds this quickly when the rules are spelled out:

```text
Make a box-pushing puzzle game (like Sokoban) in one index.html with three.js,
seen from above at an angle. Levels are text in the standard notation
(# wall, space floor, . target, $ crate, * crate on target, @ player, + player on target),
three levels that get harder. Arrow keys move one square per press; walking into a crate
pushes it if the square behind it is free; crates are never pulled. A level is solved when
every crate is on a target, then the next level loads. Z undoes a move, R restarts.
Then write a breadth-first solver over (player square, crate squares) and run it on every
level to prove each one can be solved, and print the fewest moves for each.
```

## When a puzzle game goes wrong

- **Undo moves the player back but not the crates.** The saved position kept a reference to the same crates list instead of a copy, so every saved entry changed with each push. Copy it when saving (`[...crates]`).
- **Two crates in a row both move.** The push did not check for a second crate behind the first.
- **The level never ends.** The check counts targets with a crate on them against the number of targets, and a level with more targets than crates can never fill them all. Check that every crate is on a target.
- **Holding a key slides the player across the level.** The browser repeats a held key; ignore repeats (`e.repeat`) so one press is one move.
- **A level is impossible.** Run the solver on it, then move the crate or wall that traps it.

## Let the agent play its own puzzle

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to hand tools to other coding agents), that opens a three.js game in a hidden Chrome browser so the agent can play it and read its state. It fits puzzles well, because a puzzle's correctness is exact: a solution either finishes the level or it does not. Add it to Claude Code with two lines in a terminal (the text window where you type commands):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

`interact` presses keys one after another, and `expect` checks the game's state afterwards. Here the agent played the solver's answer for level 2, one key per letter:

```text
interact {"steps":[{"state":{"level":2}},{"key":"ArrowUp"},{"key":"ArrowRight"},{"key":"ArrowDown"},{"key":"ArrowLeft"},{"key":"ArrowDown"},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"ArrowUp"},{"key":"ArrowRight"},{"key":"ArrowUp"},{"key":"ArrowRight"},{"key":"ArrowDown"}],"expect":{"solved":true,"moves":12}}

{"changed":{"level":2,"moves":12,"onTarget":2,"crates":2,"solved":true}}
Motion (player): travelled 12 units (4 from start to end), its direction of travel turned 180° right.
Expect: solved true ✓ · moves 12 ✓
```

So the solution the solver found on the level's text also works in the real game, with its real key handling. The undo check pushes the crate on level 1 and takes the push back:

```text
interact {"steps":[{"state":{"level":1}},{"key":"ArrowRight"},{"key":"ArrowRight"},{"key":"z"}],"expect":{"moves":1}}

{"changed":{"moves":1}}
Motion (player): travelled 3 units (1 from start to end), its direction of travel turned 180° left.
Expect: moves 1 ✓
```

The solver itself ran through `eval`, which runs code inside the open page, on the levels the game exposes; that is where both answers above came from. These replies were captured on 2026-11-01 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not design puzzles or say whether a level is interesting; a level can be solvable and still dull. The solver is code the agent writes for this game's rules, not a built-in check, and a puzzle with other rules (ice that slides, keys and doors) needs its own.

## Other kinds of puzzle game

The same three parts, a grid as data, one function that applies a move, and a check for the goal, carry over to most grid puzzles. A sliding-tile puzzle swaps the empty square with a neighbour. A match-3 game swaps two gems and clears lines of three ([how to make a match 3 game](/guides/make-a-match-3-game)). Falling-block puzzles add a timer ([how to make a tetris game](/guides/make-a-tetris-game)). Minesweeper hides the grid and lets the player reveal it by logic, and a memory game hides pairs of cards ([how to make a memory game](/guides/make-a-memory-game)). Puzzles in a room rather than on a grid, where clues open a door, are on [how to make an escape room game](/guides/make-an-escape-room-game).

## Next steps

- Count moves against the solver's answer and award stars, and keep the record: [how to save the high score](/guides/save-the-high-score).
- Make a push feel solid with a short slide and a sound: [how to make a game feel good](/guides/make-a-game-feel-good) and [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Share the finished puzzle: [how to put your game online](/guides/put-your-game-online).
- How an agent builds and checks a game step by step: [AI agent to build a three.js game](/guides/ai-agent-build-threejs-game).
- A puzzle built on two linked doors: [how to make a portal game](/guides/make-a-portal-game).
