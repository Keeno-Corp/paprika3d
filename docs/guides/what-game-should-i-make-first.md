---
title: What game should I make first? Small three.js games an AI agent can finish and play
phrase: what game should i make first
description: What game should you make first? One with a single rule, on one screen, with a way to lose: a catcher, a dodger, a runner, snake on a grid, a 3D breakout or a copy of a small classic, each with what makes it finishable. Then snake on a grid as a small three.js game an AI agent can write, with its rules checked and kept with paprika3d.
meta: What game should I make first? Small games with one rule each, what makes them finishable, and snake on a grid as a three.js game to start from.
intent: what-game-should-i-make-first
queries:
  - "Beginner project ideas"
  - "easiest first game?"
  - "What to make first?"
  - "What Game Should I Make First?"
  - "good first game to make"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# What game should I make first? Small three.js games an AI agent can finish and play

Make a game whose whole rule fits in one sentence, that happens on one screen, and that has a way to lose. Snake, a dodger, a catcher, a runner that jumps over things, or a copy of a small classic like Flappy Bird or Pong all qualify. The point of a first game is to finish it: a small game someone else can play from start to end teaches you more than a large one that never runs.

## What makes a first game finishable

- **One rule you can say in a sentence.** "Eat the food to grow, and do not hit the walls or yourself." If it takes a paragraph, it is a second game.
- **One screen.** No levels, no map, no story, no menus beyond a restart.
- **A way to lose, or a score.** A round has to end, or there is nothing to try again.
- **Few kinds of things.** You, the thing to get or avoid, and the ground.
- **A clear finish line.** It is done when a friend can play a round without you explaining anything.

## First games that fit

| Game | Its one rule | Why it is finishable | A page that builds one |
|---|---|---|---|
| Catcher | Slide a basket under falling stars | Movement on one axis, one falling object | [how to vibe code a game](/guides/how-to-vibe-code-a-game) |
| Reach the goal | Get to the flag before the timer ends | One goal, one timer, two outcomes | [where to start making a game](/guides/where-to-start-making-a-game) |
| Dodger | Switch lanes to miss the blocks | Three lanes and one collision check | [do I need a game engine?](/guides/do-i-need-a-game-engine) |
| Runner | Jump over what comes at you | One key, plus gravity | [how to make a 3D browser game](/guides/how-to-make-a-3d-browser-game) |
| Snake on a grid | Eat to grow; walls and your own tail end it | Squares make every rule exact | this page |
| 3D breakout | Bounce a ball off a paddle into bricks | The bounce is the whole game; bricks are a list | |
| A copy of a small classic | Whatever the original's rule is | You already know how it should play | |

A copy of a known game is a good first project. "How to make a game like Flappy Bird" is the same question as this page: you skip the design decisions and practise building. Make your own twist on it for the second game.

## What to leave for later

Online multiplayer, open worlds, inventories and crafting, dialogue and story, and many levels all multiply the work and the things that can break. Each is a fine second or third project once the first one is finished. When you get there, [how to make levels in a game](/guides/make-levels-in-a-game) is a good next read.

## The game on this page: snake on a grid

Snake suits a first game for three reasons. Everything happens on squares, so each rule is exactly right or exactly wrong. It has a score built in, the snake's length. And it gets harder by itself, since a longer snake is easier to crash into. It is drawn here in 3D with three.js, a free library that draws 3D scenes in a web page, but the rules are the same as on a flat screen.

If you work with an AI coding agent (an assistant that writes and runs code in a folder on your computer), a request like this one is enough to start:

```text
Make snake as a small 3D game with three.js in one index.html, loading three from
node_modules with an import map. A 10 by 10 board seen from above at an angle. The snake
moves one square at a time, about seven moves a second, and the arrow keys turn it. Eating
the red food makes it one square longer and puts new food on a free square. Hitting a wall
or its own body ends the game. Show the length at the top left. Nothing else yet.
```

A page that does what the request says, written for this guide:

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Grid snake</title>
<style>html,body{margin:0;overflow:hidden;background:#10241a}#hud{position:fixed;top:14px;left:18px;font:600 20px system-ui;color:#fff}</style></head>
<body>
<div id="hud">Length 3</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rule: the snake moves one square per tick; eating the food makes it one square longer.
// Running into a wall or into itself ends the game.
const SIZE = 10, TICK = 0.15;                       // a 10 by 10 board, a move every 0.15 s
const DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
let snake = [[0, 0], [-1, 0], [-2, 0]], dir = 'ArrowRight', next = dir, food = [3, 0], over = false, clock = 0;

const same = (a, b) => a[0] === b[0] && a[1] === b[1];
const inside = ([x, z]) => x >= -SIZE / 2 && x < SIZE / 2 && z >= -SIZE / 2 && z < SIZE / 2;

function move() {
  dir = next;
  const head = [snake[0][0] + DIRS[dir][0], snake[0][1] + DIRS[dir][1]];
  if (!inside(head) || snake.some(s => same(s, head))) { over = true; return; }
  snake.unshift(head);
  if (same(head, food)) {
    do food = [Math.floor(Math.random() * SIZE) - SIZE / 2, Math.floor(Math.random() * SIZE) - SIZE / 2];
    while (snake.some(s => same(s, food)));
  } else snake.pop();
}

function step(dt) {
  if (over) return;
  for (clock += dt; clock >= TICK; clock -= TICK) move();   // a fixed tick, whatever the frame rate
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10241a);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 13, 8);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x224433, 2.5));
const board = new THREE.Mesh(new THREE.BoxGeometry(SIZE, 0.2, SIZE), new THREE.MeshStandardMaterial({ color: 0x2f6b48 }));
board.name = 'board';
board.position.set(-0.5, -0.6, -0.5);              // squares are centred on whole numbers
scene.add(board);
const body = new THREE.Group();
body.name = 'snake';
scene.add(body);
const segment = new THREE.BoxGeometry(0.9, 0.9, 0.9), skin = new THREE.MeshStandardMaterial({ color: 0xb8f060 });
const apple = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 12), new THREE.MeshStandardMaterial({ color: 0xff4040 }));
apple.name = 'food';
scene.add(apple);
const hud = document.getElementById('hud');

function act({ key, down = true }) {
  if (!down || !DIRS[key]) return;
  const [dx, dz] = DIRS[key], [cx, cz] = DIRS[dir];
  if (dx !== -cx || dz !== -cz) next = key;      // no turning straight back into yourself
}
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.code }); });
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

let last = null;
renderer.setAnimationLoop((now) => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  while (body.children.length < snake.length) body.add(Object.assign(new THREE.Mesh(segment, skin), { name: 'segment' }));
  while (body.children.length > snake.length) body.remove(body.children.at(-1));
  snake.forEach(([x, z], i) => body.children[i].position.set(x, 0, z));
  apple.position.set(food[0], 0, food[1]);
  hud.textContent = over ? `Game over, length ${snake.length}` : `Length ${snake.length}`;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'grid snake', units: 'board squares', keys: { ArrowUp: 'turn up', ArrowDown: 'turn down', ArrowLeft: 'turn left', ArrowRight: 'turn right' } }),
  observe: () => ({ snake: snake.map(s => [...s]), dir, food: [...food], length: snake.length, over }),
  act,
  setState: (s) => {
    if (s.snake) snake = s.snake.map(p => [...p]);
    if (s.dir) dir = next = s.dir;
    if (s.food) food = [...s.food];
    if (s.over !== undefined) over = s.over;
  },
  subject: 'snake',
};
</script>
</body></html>
```

The rule lives in `move()`: one step forward, a check for walls and body, then either eat and grow or drop the tail. The `step()` function runs `move()` once every 0.15 s of game time however fast the screen refreshes, which keeps the snake's speed the same on every computer. To play it, put the file in a folder, run `npm install three` and `npx vite` in a terminal (the text window for commands), and open the address it prints.

## Checking the rules, and keeping the checks

A game with an exact rule is easy to check, and a check you keep can be rerun after every later change. paprika3d is a plugin for Claude Code (and a tool server for other agents) that gives the agent a browser of its own to run, see and play the game. It installs with two commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

On the snake above (captured on 2026-10-30 on a server with no graphics card, the `look` reply cut to its last lines with nothing reworded), `look` confirms the board, the three segments and the food are on screen:

```text
look {}

On screen (5):
board 31% [242, 170, 965, 699] 10 × 10 units
segment ×3 1.4% [478, 360, 669, 438]
food 0.2% [804, 375, 854, 424]
Never visible: none
```

`interact` with `expect` plays each rule from a set moment, and `save` keeps it as a check. The snake one square from the food, then 12 frames:

```text
interact {"steps":[{"state":{"snake":[[1,0],[0,0],[-1,0]],"dir":"ArrowRight","food":[2,0]}},{"wait":12}],"expect":{"length":4},"save":"eating-grows-it"}

{"changed":{"snake":[[2,0],[1,0],[0,0],[-1,0]],"food":[-5,4],"length":4}}
Expect: length 4 ✓
Saved check "eating-grows-it" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

The snake grew to four and the food moved to a free square. The snake with its head against the right wall:

```text
interact {"steps":[{"state":{"snake":[[4,0],[3,0],[2,0]],"dir":"ArrowRight"}},{"wait":12}],"expect":{"over":true},"save":"wall-ends-it"}

{"changed":{"snake":[[4,0],[3,0],[2,0]],"over":true}}
Expect: over true ✓
Saved check "wall-ends-it" in game-tests.json (2 checks now); `test` reruns them all, each from a fresh reload.

test {}

✓ eating-grows-it
✓ wall-ends-it
2 of 2 saved checks passed in 0.3 s
```

Now when you ask for the next thing ("make it speed up as it grows"), both rules can be replayed after the change: `test` does it in one call, and in Claude Code a hook does it after each edit. The agent hears that a rule broke at the edit that broke it, instead of you finding it mid-game. The plugin checks the rules you and the agent name; whether the game is fun to play is still yours to judge. When a change does break something that worked, [vibe coding bugs](/guides/vibe-coding-bugs) covers what to do.

## After the first game

- Add a game over screen with a restart key: [how to add a game over screen](/guides/add-a-game-over-screen).
- Keep the longest snake between visits: [how to save the high score of a game](/guides/save-the-high-score).
- A second game that is all numbers and upgrades: [how to make a clicker game](/guides/make-a-clicker-game).
- Making one against a deadline: [how to make a game for a game jam](/guides/make-a-game-for-a-game-jam).
- Then pick a second game from the table, a little larger than the first.
