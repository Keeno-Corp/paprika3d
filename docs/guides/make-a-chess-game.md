---
title: How to make a chess game in three.js: a board, legal moves and a computer move
phrase: how to make a chess game
description: How to make a chess game in JavaScript with a 3D board in three.js, with the rules from the chess.js library instead of written by hand: square names to places on the board, click a piece to see its legal moves, click a square to move, promotion, a computer reply that takes the most valuable piece it can, and what changes for checkers; plus the prompt to give an AI agent, and paprika3d naming the piece under a point, playing moves by clicks and catching a promotion that threw an error.
meta: How to make a chess game in three.js: a 3D board, legal moves from chess.js, click to move, promotion and a computer reply that captures when it can.
intent: make-a-chess-game
queries:
  - "how to make a chess game in javascript"
  - "three js chess game"
  - "how to make a checkers game"
  - "How complex is it to create a chess like grid and add object so positions (perhaps animate)"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make a chess game in three.js: a board, legal moves and a computer move

The board and pieces of a chess game are the small part. The large part is the rules: how each of the six pieces moves, captures, check and checkmate, stalemate, castling, en passant (a pawn capturing a pawn that just moved two squares past it), promotion, and the ways a game ends in a draw. Writing all of that yourself is the long road: hundreds of lines full of special cases, each one a place for a bug a player will find. The short road is a library that already knows the rules. This page uses **chess.js**, a free JavaScript library that knows every legal move in any position, and spends its own code on the board, the clicks and a simple computer opponent.

Some words used below. **three.js** is a JavaScript library that draws 3D scenes in a web page. A **library** is code someone else wrote that your page loads and calls. The **import map** is a short block in the page that tells the browser where to find each library by name. **FEN** is the one-line text that chess software uses to write down a whole position, such as `4k3/P7/8/8/8/8/8/4K3 w - - 0 1`. Moves are written in the usual chess notation: `e4` is a pawn to e4, `Bxg4` a bishop taking on g4, `a8=Q+` a pawn reaching a8, becoming a queen and giving check.

## three.js draws, chess.js decides

Keep the two jobs apart and the game stays small:

- chess.js holds the position. `chess.moves({ square: 'e2', verbose: true })` lists the legal moves of the piece on e2, `chess.move(...)` plays one (and refuses an illegal one), `chess.board()` lists every piece and its square, and `chess.inCheck()`, `chess.isCheckmate()` and `chess.isDraw()` say how the game stands.
- three.js draws whatever `chess.board()` says. After every move the game removes all the piece meshes and builds them again from the board. That is a little wasteful and never wrong: the picture cannot drift away from the rules.

The board is squares named the chess way. File `a` to `h` is left to right and rank `1` to `8` runs away from White, so one small function turns a name like `e4` into a place in the scene. Each tile is named after its square (`e4 square`) and each piece after what it is (`white knight`), and both carry their square, so a click on either one tells the game which square was meant.

## Click a piece, see its moves, click a square

The first click on a White piece selects it: the game asks chess.js for that piece's legal moves and puts a green dot on each target square. A click on a dot plays that move. A click anywhere else changes the selection or clears it. Because the dots come from chess.js, castling, en passant and moves that would leave the king in check are handled without a line of rule code in the game.

One case needs care: **promotion**. A pawn reaching the last rank has four legal moves to the same square (queen, rook, bishop or knight), and chess.js wants to be told which. This game always picks a queen, which is what players usually choose; a fuller game would ask.

## A computer that takes what it can

The computer plays Black. Its rule fits in three lines: list every legal move, take the most valuable piece it can capture (queen 9, rook 5, bishop and knight 3, pawn 1), and if nothing can be taken, play any legal move at random. It never makes an illegal move, it punishes a piece left undefended, and it is easy to beat, which suits a first game. To make it stronger, let it look ahead: try each move, then each reply, and score the position, which is the minimax idea from [how to make a tic tac toe game](/guides/make-a-tic-tac-toe-game), cut off after a few moves because chess has far too many games to search to the end. For a strong opponent, chess engines such as Stockfish have builds that run in the browser and take a FEN and return a move.

## The game: chess against the computer

You play White: click a piece, then a green dot. Black answers half a second later. Save the file as `index.html` and run `npm install three` in its folder (npm comes with Node.js, a free program that installs JavaScript libraries). The import map loads chess.js from jsDelivr, a free public server for npm packages, so the page needs an internet connection; to keep it all local, run `npm install chess.js` too and point that line at `./node_modules/chess.js/dist/esm/chess.js`. Serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`; [HTML game not working?](/guides/html-game-not-working) lists the first things to check if the page stays empty.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Chess</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}#hud{position:fixed;top:16px;left:20px;font:600 20px system-ui;color:#fff}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js","chess.js":"https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm"}}</script>
<script type="module">
import * as THREE from 'three';
import { Chess } from 'chess.js';

const chess = new Chess();   // the rules: legal moves, check, checkmate, castling, en passant, promotion

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b2027);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 10, 9);
camera.lookAt(0, 0, 0.6);
scene.add(new THREE.HemisphereLight(0xffffff, 0x404040, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-4, 10, 6);
scene.add(sun);
const hud = document.getElementById('hud');

// Square names to places: file a..h is x, rank 1..8 is z (rank 1 nearest the camera).
const FILES = 'abcdefgh';
const at = (sq) => new THREE.Vector3(FILES.indexOf(sq[0]) - 3.5, 0, 4.5 - Number(sq[1]));
for (let f = 0; f < 8; f++) for (let r = 1; r <= 8; r++) {
  const sq = FILES[f] + r;
  const tile = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 1), new THREE.MeshStandardMaterial({ color: (f + r) % 2 ? 0x8a5a3c : 0xe8d7b0 }));
  tile.name = sq + ' square';
  tile.userData.square = sq;
  tile.position.copy(at(sq)).setY(-0.1);
  scene.add(tile);
}

// A piece is a body and a top; the height and the top's shape tell the six kinds apart.
const NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const TOPS = {
  p: [0.4, new THREE.SphereGeometry(0.17, 16, 12)],
  r: [0.55, new THREE.BoxGeometry(0.44, 0.2, 0.44)],
  n: [0.55, new THREE.BoxGeometry(0.2, 0.34, 0.46).rotateX(-0.5)],
  b: [0.7, new THREE.ConeGeometry(0.17, 0.36, 16)],
  q: [0.8, new THREE.SphereGeometry(0.22, 16, 12)],
  k: [0.9, new THREE.BoxGeometry(0.12, 0.4, 0.12)],
};
const MATERIALS = { w: new THREE.MeshStandardMaterial({ color: 0xf4eee0 }), b: new THREE.MeshStandardMaterial({ color: 0x2a2a30 }) };
const pieces = new THREE.Group();
scene.add(pieces);
function drawPieces() {
  pieces.clear();
  for (const row of chess.board()) for (const p of row) {
    if (!p) continue;
    const [h, top] = TOPS[p.type];
    const piece = new THREE.Group();
    piece.name = `${p.color === 'w' ? 'white' : 'black'} ${NAMES[p.type]}`;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, h, 20), MATERIALS[p.color]);
    body.position.y = h / 2;
    const head = new THREE.Mesh(top, MATERIALS[p.color]);
    head.position.y = h + 0.12;
    if (p.color === 'b' && p.type === 'n') head.rotation.y = Math.PI;   // black knights face the other way
    piece.add(body, head);
    piece.position.copy(at(p.square));
    piece.traverse(o => { o.userData.square = p.square; });
    pieces.add(piece);
  }
}

// Green dots on the squares the selected piece may move to; chess.js lists them.
const dots = new THREE.Group();
scene.add(dots);
let selected = null, targets = [], replyIn = 0, last = '';
function select(sq) {
  selected = sq;
  targets = sq ? chess.moves({ square: sq, verbose: true }) : [];
  dots.clear();
  for (const m of targets) {
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16), new THREE.MeshBasicMaterial({ color: 0x4ade80 }));
    dot.name = 'legal move';
    dot.userData.square = m.to;
    dot.position.copy(at(m.to)).setY(0.03);
    dots.add(dot);
  }
}

function play(move) {
  last = chess.move(move).san;
  select(null);
  drawPieces();
  status();
}

// The computer: take the most valuable piece it can, otherwise any legal move.
const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9 };
function computerMove() {
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return;
  const takes = moves.filter(m => m.captured).sort((a, b) => VALUE[b.captured] - VALUE[a.captured]);
  play(takes[0] ?? moves[Math.floor(Math.random() * moves.length)]);
}

function status() {
  const side = chess.turn() === 'w' ? 'White' : 'Black';
  hud.textContent = chess.isCheckmate() ? `Checkmate: ${side === 'White' ? 'Black' : 'White'} wins`
    : chess.isDraw() || chess.isStalemate() ? 'Draw' : `${side} to move${chess.inCheck() ? ': check!' : ''}${last ? `   (last: ${last})` : ''}`;
}

const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (chess.turn() !== 'w' || chess.isGameOver()) return;   // you play White
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  const sq = ray.intersectObjects(scene.children, true)[0]?.object.userData.square;
  if (!sq) return;
  const move = targets.find(m => m.to === sq);
  if (move) {
    play({ from: move.from, to: move.to, promotion: 'q' });   // a pawn on the last rank becomes a queen
    replyIn = 30;
  } else select(chess.get(sq)?.color === 'w' ? sq : null);
});

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
drawPieces();
status();
renderer.setAnimationLoop(() => {
  if (replyIn && --replyIn === 0) computerMove();   // half a second's pause, then the reply
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'chess', units: 'squares', mouse: 'click a white piece, then a green dot' }),
  observe: () => ({ turn: chess.turn(), last, selected, legal: targets.map(m => m.to), check: chess.inCheck(), over: chess.isGameOver(), fen: chess.fen() }),
  setState: (s) => { if (s.fen) { chess.load(s.fen); last = ''; select(null); drawPieces(); status(); } },
  chess,
};
</script>
</body></html>
```

The loops near the top lay out the 64 tiles, dark and light in turn so that a1 is dark. `drawPieces()` rebuilds every piece from `chess.board()`; each piece is a body whose height and top shape show its kind. `select()` asks chess.js for the selected piece's legal moves and draws a dot on each. `play()` makes a move through chess.js, and `computerMove()` is the capture-first rule above. The click handler finds the square under the pointer, then either plays the move to that square or selects the piece on it. `window.__game` at the end lets a testing tool read the position and set one from a FEN; the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code, Cursor or Codex that writes and edits the files in your project) writes this quickly when you tell it to use the library and how to wire it:

```text
Make a chess game in one index.html with three.js and the chess.js library (import map).
chess.js holds the position and the rules; never write move rules by hand.
Draw a 3D board seen from White's side with a1 dark, tiles named after their squares,
and simple pieces rebuilt from chess.board() after every move. I play White by clicking:
first click selects a piece and shows a dot on each of its legal moves from
chess.moves({ square, verbose: true }); a click on a dot plays it (promote to a queen).
Black is the computer: after half a second it captures the most valuable piece it can,
otherwise plays a random legal move. Show whose turn it is, check, checkmate and draws.
Then test a promotion and a capture by clicking, and read the position back from chess.js.
```

## When a chess game goes wrong

- **A pawn on the last rank will not move, and the console shows `Invalid move`.** The move was sent without a promotion piece; pass `promotion: 'q'`.
- **The pieces start on the wrong side or the board is mirrored.** `chess.board()` lists rank 8 first; place each piece by its own square name instead of by its position in the list.
- **A dark square sits at the bottom right.** The colours are swapped: a1 is dark and h1 is light.
- **The computer moves twice, or moves for White.** Its reply was scheduled more than once; start it once per player move and check whose turn it is.
- **The player can move Black's pieces.** Selection did not check the piece's colour.
- **The game carries on after checkmate.** Check `chess.isGameOver()` before taking a click.

## Checkers instead

Checkers (draughts) is easy to write without a library, because its rules fit on a page. Pieces stand on the dark squares and move one square diagonally forward. A piece captures by jumping over an enemy piece next to it onto the empty square beyond, and can keep jumping in the same turn. In the most common rules a capture must be taken when one is possible. A piece that reaches the far row becomes a king and moves diagonally backwards too. The game ends when one side has no pieces or no legal move. Write those rules as one `legalMoves(board, side)` function; the 3D board, the clicks and the dots from this page stay as they are.

## Let the agent play it

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can see the board, click on it and read the position. Add it to Claude Code with two lines in a terminal (the text window where you type commands):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

`look` with `at` names what is drawn under points of the page, nearest first. The agent used it to find where to click:

```text
look {"at":[[687,519],[590,603],[822,170],[683,377]]}

At (687, 519): white pawn 11.4 m at [0.49, 0.54, 2.66]; behind it white pawn 11.6 m; then e2 square 12 m; background beyond.
At (590, 603): white queen 10.7 m at [-0.47, 0.67, 3.71]; behind it d1 square 11.5 m; background beyond.
At (822, 170): black knight 15.8 m at [2.54, 0.36, -3.26]; behind it g8 square 16.4 m; background beyond.
At (683, 377): e4 square 13.3 m at [0.53, 0, 0.24]; background beyond.
```

`interact` then clicks and waits on exact frames, and `expect` checks the game's state afterwards. Pawn e2 to e4, then a wait for Black's answer:

```text
interact {"steps":[{"mouse":"click","x":687,"y":519},{"mouse":"click","x":683,"y":377},{"wait":40}],"expect":{"turn":"w","selected":null}}

{"changed":{"last":"g5","fen":"rnbqkbnr/pppppp1p/8/6p1/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2"}}
mouse click at (687, 519): over white pawn (Group, 11.4 units)
mouse click at (683, 377): over e4 square (Mesh, 13.3 units)
Expect: turn "w" ✓ · selected null ✓
```

With nothing to capture, Black played a random move, g5 this time. To check that the computer takes when it can, the agent set a position from a FEN (after 1. e4 d5) and moved the queen to g4, where Black's bishop can take it:

```text
interact {"steps":[{"state":{"fen":"rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2"}},{"mouse":"click","x":590,"y":603},{"mouse":"click","x":853,"y":377},{"wait":40}],"expect":{"last":"Bxg4"}}

{"changed":{"last":"Bxg4","fen":"rn1qkbnr/ppp1pppp/8/3p4/4P1b1/8/PPPP1PPP/RNB1KBNR w KQkq - 0 3"}}
mouse click at (590, 603): over white queen (Group, 10.7 units)
mouse click at (853, 377): over g4 square (Mesh, 13.5 units)
Expect: last "Bxg4" ✓
```

Black could also have taken the pawn on e4 and chose the queen. `eval` runs code inside the open page, so the agent can read the position straight from chess.js:

```text
eval {"code":"const c = window.__game.chess;\nreturn { fen: c.fen(), history: c.history(), turn: c.turn(), inCheck: c.inCheck(), legalMoves: c.moves().length };"}

{"fen":"rn1qkbnr/ppp1pppp/8/3p4/4P1b1/8/PPPP1PPP/RNB1KBNR w KQkq - 0 3","history":["Qg4","Bxg4"],"turn":"w","inCheck":false,"legalMoves":25}
```

Promotion is where the first version broke. It sent moves as `{ from, to }`, and moving a pawn from a7 to a8 gave:

```text
interact {"steps":[{"state":{"fen":"4k3/P7/8/8/8/8/8/4K3 w - - 0 1"}},{"mouse":"click","x":381,"y":210},{"mouse":"click","x":391,"y":163}],"expect":{"last":"a8=Q+"}}

{"changed":{"selected":"a7","legal":["a8","a8","a8","a8"],"fen":"4k3/P7/8/8/8/8/8/4K3 w - - 0 1"},"errors":["Invalid move: {\"from\":\"a7\",\"to\":\"a8\"} (index.html:91:16)"]}
mouse click at (381, 210): over white pawn (Group, 15.3 units)
mouse click at (391, 163): over a8 square (Mesh, 16.7 units)
Expect: last "" ✗ expected "a8=Q+"
```

The legal moves list a8 four times, one for each piece the pawn can become, and chess.js refused a move that named none. With `promotion: 'q'` added, as in the game above, the same clicks give:

```text
{"changed":{"turn":"b","last":"a8=Q+","check":true,"fen":"Q3k3/8/8/8/8/8/8/4K3 b - - 0 1"}}
mouse click at (381, 210): over white pawn (Group, 15.3 units)
mouse click at (391, 163): over a8 square (Mesh, 16.7 units)
Expect: last "a8=Q+" ✓
```

These replies were captured on 2026-11-01 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not know chess: it does not judge moves or play for you. It lets the agent see the board, click on it and read what chess.js says, so a rule that does not work shows up as a failed check instead of a player's report.

## Next steps

- Keep a game going after the page closes by saving the FEN: [how to save game progress](/guides/save-game-progress).
- Two people at one computer: leave out the computer's turn, or see [how to make a 2 player game](/guides/make-a-2-player-game).
- A title screen with a choice of colour and level: [how to make a main menu for a game](/guides/make-a-main-menu).
- Share the finished game: [how to put your game online](/guides/put-your-game-online).
- How an agent builds and checks a game step by step: [AI agent to build a three.js game](/guides/ai-agent-build-threejs-game).
