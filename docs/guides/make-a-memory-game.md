---
title: How to make a memory game in three.js: cards that flip and match
phrase: how to make a memory game
description: How to make a memory game (a matching game, also called Concentration) as a beginner: a deck of pairs, a fair shuffle, cards that turn over in 3D when clicked, a pair that stays face up, a miss that turns back after a short wait, and a move count, on a small three.js game with eight pairs of animal cards, plus the prompt to give an AI agent and paprika3d clicking the cards and catching a biased shuffle.
meta: How to make a memory game in three.js: eight pairs of cards that flip in 3D, a fair shuffle, pairs that stay up and misses that turn back.
intent: make-a-memory-game
queries:
  - "how to make a memory game"
  - "how to make a matching game"
  - "HTML5 Memory Game - JavaScript function"
  - "javascript memory game"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make a memory game in three.js: cards that flip and match

A memory game, also called a matching game or Concentration, lays cards face down in a grid. The player turns two over. If they show the same picture, they stay face up; if not, they turn back, and the player tries to remember where each one was. The round ends when every pair is face up, and fewer moves is a better game. It is a common first game, often made for a child, and its rules fit in about thirty lines of code.

## The rules as code

1. **The deck.** Each picture twice. Eight animals make 16 cards in a 4 by 4 grid.
2. **The shuffle.** Go through the deck from the last card to the first and swap each card with a random card at or before it (this is called the Fisher-Yates shuffle). A shorter line you will see online, `deck.sort(() => Math.random() - 0.5)`, looks random and is not; the check further down shows how far off it is.
3. **Each card's side.** Down, up, or matched. A click on a card that is down turns it up.
4. **Two up: compare.** Same animal, and both become matched. Different, and both turn back after a short wait (here 1 s) so the player has time to remember them. Clicks during the wait are ignored, or a fast player could turn over a third card.
5. **Count.** One move per pair of cards turned, and the number of pairs found. All eight found is a win.

## Flipping a card in 3D

Each card is a thin box with the back pattern on one face and the animal on the other. Turning it over is a half turn about its upright axis. The game does not jump the card around: it keeps, for every card, which side should show, and each frame (one of the pictures the game draws many times a second) it turns the card a little towards that side, so a flip takes about a third of a second and lifts the card slightly as it goes. The faces are drawn on a small 2D canvas and used as textures, so the game needs no image files; swap in pictures later.

To know which card was clicked, the game sends a ray from the camera through the mouse pointer and takes the first card it meets. [three.js click on object](/guides/threejs-click-on-object-raycaster) explains that ray in full, and why a click sometimes finds the wrong object.

## A small game: animal pairs

three.js, a JavaScript library that draws 3D in a web page, draws the table and the cards; the whole game is one HTML file. The import map line near the top tells the browser where three.js is (a `node_modules/three` folder beside the file, which `npm install three` makes), and [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) goes through the parts of such a page.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Animal pairs</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:14px;left:0;right:0;text-align:center;font:600 22px system-ui;color:#2d2a26}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const ANIMALS = ['cat', 'dog', 'fox', 'owl', 'frog', 'bee', 'pig', 'cow'];
const COLOURS = ['#f4a259', '#8cb369', '#e76f51', '#a3829f', '#5fb49c', '#f2cc5c', '#f497b6', '#9fb8cf'];
const WAIT = 1;   // seconds two different cards stay up before they turn back

function face(text, colour) {   // a card face drawn on a 2D canvas, used as a texture
  const c = document.createElement('canvas');
  c.width = 256; c.height = 360;
  const g = c.getContext('2d');
  g.fillStyle = colour; g.fillRect(0, 0, 256, 360);
  g.fillStyle = '#2d2a26'; g.font = 'bold 72px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 128, 180);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tex });
}
const back = face('?', '#3d5a80'), edge = new THREE.MeshStandardMaterial({ color: 0xfaf7f0 });
const fronts = ANIMALS.map((a, i) => face(a, COLOURS[i]));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9e4d8);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 50);
camera.position.set(0, -3, 14);
camera.lookAt(0, -0.5, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0xb0a890, 2.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(2, 3, 6);
scene.add(sun);
const table = new THREE.Mesh(new THREE.BoxGeometry(7.4, 9.4, 0.2), new THREE.MeshStandardMaterial({ color: 0x3f7d58 }));
table.name = 'table';
table.position.z = -0.3;
scene.add(table);

// 16 cards in a 4 by 4 grid. Box faces: +x, -x, +y, -y, +z (the back, facing us), -z (the animal).
const cards = [];
for (let i = 0; i < 16; i++) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.8, 0.05), [edge, edge, edge, edge, back, back]);
  mesh.name = `card ${i + 1}`;
  mesh.position.set((i % 4 - 1.5) * 1.6, (1.5 - Math.floor(i / 4)) * 2.1, 0);
  scene.add(mesh);
  cards.push({ mesh, animal: 0, side: 'down' });   // side: down, up or matched
}
const hud = document.getElementById('hud');

let open = [], moves = 0, pairs = 0, waitLeft = 0;
function deal(order) {
  if (!order) {   // shuffle: swap each card with a random one at or before it
    order = ANIMALS.flatMap((_, i) => [i, i]);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  cards.forEach((c, i) => { c.animal = order[i]; c.side = 'down'; c.mesh.material[5] = fronts[order[i]]; });
  open = []; moves = 0; pairs = 0; waitLeft = 0;
}
deal();

function flip(i) {
  const card = cards[i];
  if (pairs === 8) return deal();          // after a win, a click deals again
  if (!card || card.side !== 'down' || open.length === 2) return;
  card.side = 'up';
  open.push(i);
  if (open.length < 2) return;
  moves++;
  const [a, b] = open.map(n => cards[n]);
  if (a.animal === b.animal) { a.side = b.side = 'matched'; open = []; pairs++; }
  else waitLeft = WAIT;                    // a miss: both turn back after the wait
}

// clicking a card: a ray from the camera through the mouse finds the card under it
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', e => {
  const r = renderer.domElement.getBoundingClientRect();
  mouse.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const hit = ray.intersectObjects(cards.map(c => c.mesh))[0];
  flip(hit ? cards.findIndex(c => c.mesh === hit.object) : -1);
});

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
let last = null;
renderer.setAnimationLoop((now) => {
  const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;
  if (waitLeft > 0 && (waitLeft -= dt) <= 0) { for (const n of open) cards[n].side = 'down'; open = []; }
  for (const c of cards) {   // turn each card towards its side, a half turn in about a third of a second
    const target = c.side === 'down' ? 0 : Math.PI, r = c.mesh.rotation.y;
    c.mesh.rotation.y = r + Math.sign(target - r) * Math.min(Math.abs(target - r), 10 * dt);
    c.mesh.position.z = Math.sin(c.mesh.rotation.y) * 0.4;   // lifts a little while it turns
  }
  hud.textContent = pairs === 8 ? `All pairs found in ${moves} moves! Click to play again` : `Moves ${moves}   Pairs ${pairs} of 8`;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'animal pairs', units: 'metres', mouse: 'click a card to turn it over' }),
  observe: () => ({ moves, pairs, open: [...open], cards: cards.map(c => c.side) }),
  act: ({ action, card }) => { if (action === 'flip') flip(card); },
  setState: (s) => { if (s.order) deal(s.order); },
};
</script>
</body></html>
```

`deal` shuffles and puts each animal's face on the back of its card. `flip` is the whole rulebook: it ignores a card that is not down or a third click, counts a move when two are up, and either matches them or starts the wait. The frame loop turns the cards and, when the wait runs out, sends the two cards back down. Clicking anywhere after a win deals a new round.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes the files in your project) can build this from the rules. Give them in order:

```text
Make a memory game in one HTML file with three.js: 16 cards in a 4 by 4 grid,
8 pairs of animals. Shuffle with the Fisher-Yates swap loop, not sort().
Clicking a face-down card turns it over in 3D (a half turn, animated).
When two cards are up: if they match, they stay up; if not, they turn back after
1 second, and clicks are ignored until then. Count moves and pairs,
and show "All pairs found in N moves!" at the end.
```

Once it works, ask for one change at a time: pictures instead of names, a timer, a bigger grid for a harder level.

## Let the agent play a round

An agent that writes a memory game usually cannot click its cards. paprika3d, a plugin for Claude Code and an MCP server (the standard way to give tools to other coding agents), runs the game in a hidden Chrome so the agent can. The agent first got the 16 click points with `eval`, which runs code in the page, by projecting each card's centre through the camera. Then `interact` deals a known deck with a `{ state }` step (the two cats are cards 1 and 2), clicks both, and checks the pair stayed up with `expect`:

```text
interact {"steps":[{"state":{"order":[0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7]}},{"mouse":"click","x":463,"y":134},{"mouse":"click","x":581,"y":134},{"wait":30}],"expect":{"cards.0":"matched","cards.1":"matched","pairs":1,"moves":1}}

{"changed":{"moves":1,"pairs":1,"cards":["matched","matched","down","down","down","down","down","down","down","down","down","down","down","down","down","down"]}}
Motion (card 1): travelled 0.798 units (4.9e-17 from start to end), its direction of travel turned 180° left; it stopped at frame 19 and did not move again.
mouse click at (463, 134): over card 1 (Mesh, 15.5 units)
mouse click at (581, 134): over card 2 (Mesh, 15.3 units)
Expect: cards.0 "matched" ✓ · cards.1 "matched" ✓ · pairs 1 ✓ · moves 1 ✓
```

Each click names the card under it, so a click that lands on the wrong card shows here. The Motion line is the flip: card 1 lifted, turned and settled by frame 19. Then a miss, a cat and a dog, with a third click on card 5 during the wait, and `trace` reading two cards' sides every frame:

```text
interact {"steps":[{"state":{"order":[0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7]}},{"mouse":"click","x":463,"y":134},{"mouse":"click","x":699,"y":134},{"mouse":"click","x":458,"y":284},{"wait":70}],"trace":["cards.0","cards.4"],"expect":{"cards.0":"down","cards.2":"down","cards.4":"down","moves":1}}

{"changed":{"pairs":0,"cards":["down","down","down","down","down","down","down","down","down","down","down","down","down","down","down","down"]}}
mouse click at (463, 134): over card 1 (Mesh, 15.4 units)
mouse click at (699, 134): over card 3 (Mesh, 15.3 units)
mouse click at (458, 284): over card 5 (Mesh, 14.7 units)
cards.0: "down" until frame 1, "up" until frame 62, then "down"
cards.4: "down" throughout the 73 frames
Expect: cards.0 "down" ✓ · cards.2 "down" ✓ · cards.4 "down" ✓ · moves 1 ✓
```

The cat stayed up for the one-second wait and turned back, and card 5 never turned: the third click was ignored. `look` with `sheet` reloads the game for each moment and puts the pictures side by side, here a click on card 1 seen 1, 6, 12 and 30 frames later:

```text
look {"sheet":[{"label":"click","state":{"order":[0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7]},"steps":[{"wait":1},{"mouse":"click","x":463,"y":134}],"frames":1},{"label":"6 frames","state":{"order":[0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7]},"steps":[{"wait":1},{"mouse":"click","x":463,"y":134}],"frames":6},{"label":"12 frames","state":{"order":[0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7]},"steps":[{"wait":1},{"mouse":"click","x":463,"y":134}],"frames":12},{"label":"30 frames","state":{"order":[0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7]},"steps":[{"wait":1},{"mouse":"click","x":463,"y":134}],"frames":30}]}

Picture: <project>/paprika3d/runs/2026-11-01T00-34-25-165Z/look-5-sheet.png (4 moments, left to right, top to bottom: click | 6 frames | 12 frames | 30 frames); the game is reloaded at its first frame
click: on screen: table, card * ×16; pixels: brightness 70%, colour saturation 27%, 0% near black, 0% blown out
6 frames: on screen: table, card * ×16; pixels: brightness 70%, colour saturation 27%, 0% near black, 0% blown out
12 frames: on screen: table, card * ×16; pixels: brightness 70%, colour saturation 27%, 0% near black, 0% blown out
30 frames: on screen: table, card * ×16; pixels: brightness 70%, colour saturation 27%, 0% near black, 0% blown out
This sheet took 5 s (about 1 s a cell) on a software renderer.
```

In the picture the card tilts, stands edge-on at 6 frames, shows the cat face side-on at 12 and lies flat with "cat" readable at 30. The text lines are alike because the flip changes little of the screen; the picture is what the agent reads here. The `{"wait":1}` before each click matters: a sheet sets the state without drawing a frame, and a ray cast before the first frame meets cards that have not been placed yet.

Last, the shuffle. With `eval`, the agent shuffled 20,000 decks each way and counted where the first card ended up:

```text
eval {"code":"const deck = () => Array.from({ length: 16 }, (_, i) => i); const swap = d => { for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; }; const where = shuffle => { const at = Array(16).fill(0); for (let t = 0; t < 20000; t++) at[shuffle(deck()).indexOf(0)]++; return at.map(n => +(n / 200).toFixed(1)); }; return { swapLoop: where(swap), randomSort: where(d => d.sort(() => Math.random() - 0.5)) }"}

{"swapLoop":[6,6.3,6.1,6.3,6.2,6.4,6.3,6.3,6.3,6.4,6.1,6.4,6.1,6.5,6.2,6.1],"randomSort":[28.3,28.2,19.1,11.1,5.9,2.9,1.7,0.9,0.5,0.3,0.3,0.2,0.2,0.1,0.1,0.1]}
```

With the swap loop the first card lands in each of the 16 places about equally often, near 6.3% each. With the random sort it stays in the first or second place 28.3% and 28.2% of the time, and in one of the first four places (the top row) in most rounds, so a deck built pair by pair keeps its first pairs near the top. These replies were captured on 2026-11-01 on a machine with no graphics card, where Chrome draws in software.

paprika3d checks the rules and the clicks; it does not judge whether the cards are easy to tell apart or whether a round is too long for a young child, which is a matter of watching someone play. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Without paprika3d

While you test, ask the agent for a key that shows every face for two seconds, and for the deck's order printed to the browser console (the panel of messages a page writes, opened with F12). Then play two cards you know match and two you know do not, and click a third card quickly during the wait.

## Next steps

- Keep the fewest moves between visits: [how to save the high score](/guides/save-the-high-score).
- Make a found pair pop and chime: [how to make a game feel good](/guides/make-a-game-feel-good).
- Another grid game, where matches are swapped into place: [how to make a match 3 game](/guides/make-a-match-3-game).
- Let a child choose the animals: [my kid wants to make a video game](/guides/my-kid-wants-to-make-a-video-game).
- A game of chance instead of memory: [how to make a dice game](/guides/make-a-dice-game).
- Another gentle game to make with a child: [how to make a virtual pet game](/guides/make-a-virtual-pet-game).
