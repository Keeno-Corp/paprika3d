---
title: How to make a tic tac toe game in three.js with a computer player
phrase: how to make a tic tac toe game
description: How to make a tic tac toe game in the browser with three.js, for a first game: the board as a list of nine squares, a click turned into a square with a raycaster, the eight lines that win, turns, and a computer player that cannot be beaten, written with minimax, after a simpler win-block-centre-corner player loses to a fork; a small wooden board game to paste, the prompt to give an AI agent, and paprika3d naming the square under a point, playing a game by clicks and trying every line of play against the computer.
meta: How to make a tic tac toe game in three.js: nine squares, the eight winning lines, turns, and a minimax computer player that never loses.
intent: make-a-tic-tac-toe-game
queries:
  - "how to make a tic tac toe game"
  - "Simple tic-tac-toe AI"
  - "Two Player Tic Tac Toe Game in Javascript"
  - "how to make a computer opponent in a game"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a tic tac toe game in three.js with a computer player

Tic tac toe (noughts and crosses) is a 3 by 3 board where two players take turns marking squares, X and O, and the first to get three in a row, a column or a diagonal wins; a full board with no line is a draw. It is a common first game because the rules fit in a few lines, and it is the classic first place to write a **computer opponent**, the part people ask about most ("Simple tic-tac-toe AI" on Stack Overflow has more than 20,000 views). The whole game takes five parts:

1. **The board as a list** of nine squares.
2. **A click turned into a square.**
3. **A winner check** over the eight lines that win.
4. **Turns**: X, then O, and no move on a taken square or after the end.
5. **The computer's move**, chosen by trying every move ahead (minimax).

A few words first. **three.js** is a JavaScript library that draws 3D scenes in a web page, inside a **canvas** (the rectangle where the game appears). The **game loop** is a function the browser calls about sixty times a second; each call moves things a little and draws one picture. An **array** is a list in JavaScript; `board[4]` is its fifth entry, because counting starts at 0.

## The board is a list of nine

```js
let board = Array(9).fill('');   // '' empty, 'X' or 'O'
```

The squares are numbered 0 to 8, left to right and top to bottom: 0, 1, 2 is the top row and 4 is the centre. The wooden board, the bars and the pieces in 3D show this list and hold no rules of their own. Every rule reads the list, which keeps the rules short and lets a test play thousands of games without drawing any of them.

## A click becomes a square

Each of the nine squares is a thin, flat box in the scene, named for its place ("top left square") and carrying its number. On a click, a **raycaster** (three.js's way to shoot a line from the camera through the mouse pointer into the scene) reports which square the line hits first, and the game plays that number. A click on a square that is already taken, or after the game has ended, does nothing.

## Who won

There are eight ways to win: three rows, three columns and two diagonals. Write them down once as lists of square numbers and check each one:

```js
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
```

A line is won when its three squares hold the same mark and are not empty. When no line is won and no square is empty, it is a draw. The same `winner()` function serves the game after every move and the computer when it looks ahead.

## A computer player

The first computer player most people write follows a few rules: win if you can, block if the other player is about to win, otherwise take the centre, then a corner, then an edge. It plays well and still loses, because it cannot see a **fork**: a move that makes two threats at once, of which it can block one. The test further down finds every game it loses.

**Minimax** sees everything. For each free square, the computer tries the move, then imagines the player's reply, its own next move, and so on to the end of the game, assuming each side always picks the move that is strongest for it. Each ending gets a score: a win for the computer is good (10), a loss bad (-10), a draw 0. The computer's turn takes the highest score among its moves; the player's turn, the lowest. The move with the highest score at the top is the one the computer plays. Subtracting the number of moves taken from a win, and adding it to a loss, makes the computer win as soon as it can and put off a loss as long as it can.

This tries every possible game, and tic tac toe is small enough for that: there are at most 9 × 8 × 7 × ... × 1 = 362,880 orders of moves, and far fewer real games, since most end early. A game with more moves, such as chess, cannot be searched to the end; it searches a few moves ahead and scores the board where it stops.

A computer that never loses is no fun for everyone. To make it beatable, let it play a random free square some of the time, say one move in four, and raise that for an easy level.

## Two players instead

Two people at one computer is the same game without the computer: leave out its turn, and the clicks alternate between X and O. For a game where two people play at the same time on one keyboard, see [how to make a 2 player game](/guides/make-a-2-player-game).

## The game: three in a row

Click a square to place an X; the computer answers with an O. Click again after the end to play again. Save the file as `index.html`, run `npm install three` in its folder (this needs Node.js, a free program that installs JavaScript libraries), serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Three in a row</title>
<style>html,body{margin:0;overflow:hidden;background:#20303a}canvas{display:block}
#status{position:fixed;top:18px;width:100%;text-align:center;color:#fff;font:700 26px system-ui}</style></head>
<body>
<div id="status"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The board is a list of 9 squares, read left to right, top to bottom: '' (empty), 'X' (you) or 'O' (the computer).
let board = Array(9).fill(''), turn = 'X', result = null, wait = 0;
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

// 'X' or 'O' when one has three in a row, 'draw' when the board is full, otherwise null.
function winner(b) {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return b.every(Boolean) ? 'draw' : null;
}

// Minimax: try every move, assume the other player then plays their best, and score where it ends.
// A win for O scores 10, a win for X -10, a draw 0; the depth makes a quicker win (or a slower loss) count for more.
function minimax(b, player, depth) {
  const w = winner(b);
  if (w === 'O') return { score: 10 - depth };
  if (w === 'X') return { score: depth - 10 };
  if (w === 'draw') return { score: 0 };
  let best = null;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = player;
    const { score } = minimax(b, player === 'O' ? 'X' : 'O', depth + 1);
    b[i] = '';                                      // undo the try before the next one
    if (!best || (player === 'O' ? score > best.score : score < best.score)) best = { score, move: i };
  }
  return best;
}
const bestMove = b => minimax([...b], 'O', 0).move;

function play(i) {
  if (result || board[i]) return;
  board[i] = turn;
  addPiece(turn, i);
  result = winner(board);
  turn = turn === 'X' ? 'O' : 'X';
  if (turn === 'O' && !result) wait = 30;           // the computer "thinks" for half a second
}

function newGame() {
  board = Array(9).fill(''); turn = 'X'; result = null; wait = 0;
  for (const p of pieces.splice(0)) scene.remove(p);
}

// The 3D board: a wooden base, raised bars between the squares, and the pieces.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.NeutralToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x20303a);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 6.5, 4.5);
camera.lookAt(0, 0, 0.3);
scene.add(new THREE.HemisphereLight(0xffffff, 0x404040, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(2, 6, 3);
scene.add(sun);

const wood = new THREE.MeshStandardMaterial({ color: 0xa8743c, roughness: 0.8 });
const base = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.3, 3.8), wood);
base.name = 'board';
base.position.y = -0.15;
scene.add(base);
const bar = new THREE.MeshStandardMaterial({ color: 0x6a4320 });
for (const k of [-0.55, 0.55]) {
  const a = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 3.4), bar), b = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.14, 0.08), bar);
  a.position.set(k, 0.06, 0); b.position.set(0, 0.07, k);   // one set a little taller, so the crossings do not flicker
  a.name = b.name = 'bar';
  scene.add(a, b);
}
const ROWS = ['top', 'middle', 'bottom'], COLUMNS = ['left', 'centre', 'right'];
const at = i => new THREE.Vector3((i % 3 - 1) * 1.1, 0, (Math.floor(i / 3) - 1) * 1.1);
const squares = [];
for (let i = 0; i < 9; i++) {
  const sq = new THREE.Mesh(new THREE.BoxGeometry(1, 0.02, 1), new THREE.MeshStandardMaterial({ color: 0xc08a50, roughness: 0.8 }));
  sq.name = `${ROWS[Math.floor(i / 3)]} ${COLUMNS[i % 3]} square`;
  sq.position.copy(at(i)).setY(0.01);
  sq.userData.index = i;
  scene.add(sq);
  squares.push(sq);
}

const pieces = [];
const xMaterial = new THREE.MeshStandardMaterial({ color: 0xe04848 }), oMaterial = new THREE.MeshStandardMaterial({ color: 0x3c8ce8 });
function addPiece(who, i) {
  const piece = new THREE.Group();
  piece.name = who;
  if (who === 'X') for (const turnY of [Math.PI / 4, -Math.PI / 4]) piece.add(new THREE.Mesh(new THREE.BoxGeometry(0.85, turnY > 0 ? 0.16 : 0.18, 0.18), xMaterial).rotateY(turnY));
  else piece.add(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.09, 12, 32).rotateX(Math.PI / 2), oMaterial));
  piece.position.copy(at(i)).setY(0.12);
  scene.add(piece);
  pieces.push(piece);
}

// A click becomes a square through a raycast against the nine squares; a click after the end starts a new game.
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', e => {
  if (result) return newGame();
  if (turn !== 'X') return;
  pointer.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(squares)[0];
  if (hit) play(hit.object.userData.index);
});

const status = document.getElementById('status');
function tick() {
  if (turn === 'O' && !result && --wait <= 0) play(bestMove(board));
}
function draw() {
  status.textContent = result === 'X' ? 'You win! Click to play again' : result === 'O' ? 'The computer wins. Click to play again'
    : result === 'draw' ? 'A draw. Click to play again' : turn === 'X' ? 'Your move: X' : 'The computer is thinking...';
}

function fit() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}
addEventListener('resize', fit);
fit();
scene.updateMatrixWorld();                         // so a click before the first drawn frame still finds the squares
let last = null, time = 0;
renderer.setAnimationLoop(now => {
  time += last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;
  for (; time >= 1 / 60; time -= 1 / 60) tick();
  draw();
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'three in a row', mouse: 'click a square to place X; the computer plays O' }),
  observe: () => ({ board: [board.slice(0, 3), board.slice(3, 6), board.slice(6)].map(r => r.map(s => s || '.').join('')), turn, result }),
  act: ({ action, square }) => { if (action === 'play' && turn === 'X') play(square); },
  setState: s => { if (s.newGame) newGame(); },
  winner, bestMove,
};
</script>
</body></html>
```

The rules come first: `board`, `LINES`, `winner`, `minimax` and `play`. The scene is a wooden base, four bars and nine square tiles, and `addPiece` puts a red X (two crossed bars) or a blue O (a ring) on a square. `tick()` waits half a second before the computer moves, so its reply is seen as a reply. `window.__game` at the end lets a test tool read the board as three rows of text and call `winner` and `bestMove`; the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code, Cursor or Codex that writes and edits the files of your project) writes this kind of game quickly when you name the parts:

```text
Make a tic tac toe game in one index.html with three.js: a 3D wooden board seen
from above at an angle, nine flat square tiles, red X pieces and blue O rings.
Keep the board as a list of 9 entries and check the 8 winning lines after every
move. The player is X and clicks a square (raycast against the tiles; ignore taken
squares and clicks after the end). The computer is O and picks its move with
minimax over the whole game, preferring quicker wins, after a short pause.
Show whose turn it is and the result, and start a new game on a click after the end.
Then check that the computer never loses: play every possible line of X moves
against it and count the results.
```

## When a tic tac toe game goes wrong

- **A click replaces the other player's mark.** The move did not check that the square was empty.
- **The game goes on after someone wins.** The move did not check for a result first.
- **The player can click during the computer's turn and play twice.** Ignore clicks unless it is the player's turn.
- **The computer freezes the page or plays nonsense.** Minimax did not undo its try (`b[i] = ''`) before the next one, or it has no stop at the end of a game.
- **The computer helps the player win.** The two sides' choices are swapped: the computer takes the highest score, the player the lowest.
- **A full board never ends.** The winner check forgot the draw.

## Let the agent play it

A computer player is hard to test by hand: you would have to find the one line of play that beats it. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can click squares, read the board and run code inside the page. Install it in Claude Code with these two lines in a terminal (the window where you type commands):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

`look` with `at` names what is drawn at points of the page, nearest first, which is how the agent finds where to click:

```text
look {"at":[[640,361],[495,243],[808,502]]}

At (640, 361): middle centre square 7.9 m at [0, 0.02, -0.02]; behind it board 7.92 m; background beyond.
At (495, 243): top left square 8.66 m at [-1.12, 0.02, -1.13]; behind it board 8.68 m; background beyond.
At (808, 502): bottom right square 7.39 m at [1.12, 0.02, 1.12]; behind it board 7.42 m; background beyond.
```

`interact` then plays clicks and waits on exact frames, and `expect` checks the result. Here the player takes two corners and then misses the computer's threat down the middle:

```text
interact {"steps":[{"mouse":"click","x":495,"y":243},{"wait":40},{"mouse":"click","x":808,"y":502},{"wait":40},{"mouse":"click","x":783,"y":243},{"wait":40}],"expect":{"result":"O"}}

{"changed":{"board":["XOX",".O.",".OX"],"result":"O"}}
mouse click at (495, 243): over top left square (Mesh, 8.7 units)
mouse click at (808, 502): over bottom right square (Mesh, 7.4 units)
mouse click at (783, 243): over top right square (Mesh, 8.7 units)
Expect: result "O" ✓
```

The computer took the centre, answered the second corner with the top middle square, a threat down the middle column, and won there when the player did not block it. `eval` runs code inside the page. To check that the computer never loses, the agent played every possible line of X moves against it, with the computer answering each one:

```js
const { bestMove, winner } = window.__game;
const tally = { games: 0, X: 0, O: 0, draw: 0 };
function tryAll(board) {               // X to move: try every free square, then the computer answers
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    const b = [...board];
    b[i] = "X";
    let w = winner(b);
    if (!w) { b[bestMove(b)] = "O"; w = winner(b); }
    if (w) { tally.games++; tally[w]++; } else tryAll(b);
  }
}
tryAll(Array(9).fill(""));
return tally;
```

With the win-block-centre-corner player from above in place of minimax, the answer was:

```text
{"games":489,"X":12,"O":350,"draw":127}
```

X won 12 of 489 games. A second `eval` that stops at the first game X wins returned `X0 O4 X7 O2 X6 O8 X3`: X in the top left, O in the centre, X bottom middle, O top right, then X bottom left makes two threats at once (the bottom row and the left column), O blocks one and X wins with the other. With minimax:

```text
{"games":569,"X":0,"O":386,"draw":183}
```

No line of play wins for X; 386 end in a computer win and 183 in a draw. These replies were captured on 2026-10-31 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not choose how hard the computer should be or whether losing every game is fun; it plays and reports. The every-game check is code the agent writes for this game, not a built-in test.

## Next steps

- A clear end screen with the result and a restart: [how to add a game over screen](/guides/add-a-game-over-screen).
- Keep a count of wins and losses between visits: [how to save the high score](/guides/save-the-high-score).
- Two people on one keyboard: [how to make a 2 player game](/guides/make-a-2-player-game).
- Another board game on a grid: [how to make a match 3 game](/guides/make-a-match-3-game).
- A sound for each move and a burst for the win: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game) and [how to make a game feel good](/guides/make-a-game-feel-good).
- Share it: [how to put your game online](/guides/put-your-game-online).
- A larger board game against the computer: [how to make a chess game](/guides/make-a-chess-game).
