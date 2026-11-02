---
title: How to make a strategy game in three.js: select units and send them around obstacles
phrase: how to make a strategy game
description: How to make a real-time strategy game in the browser with three.js, for a first game: selecting units with a drag box, ordering them with a click on the ground, finding a path around rocks on a grid with a breadth-first search, and giving each unit its own square at the target so a group spreads out instead of stacking; a small knights-and-rocks game to paste, the first prompt to give an AI agent, what to check when units walk into walls, and paprika3d's interact dragging the box and tracing each knight's path.
meta: How to make a strategy game in three.js: drag a box to select units, click to send them, and a grid path around rocks, in one small game.
intent: make-a-strategy-game
queries:
  - "how to make a strategy game"
  - "how to make a real time strategy game"
  - "three js rts game"
  - "How does pathfinding in RTS games work?"
  - "Show HN: I made a browser-based RTS game"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a strategy game in three.js: select units and send them around obstacles

In a strategy game you do not steer one character. You command a group: you pick some units, tell them where to go, and they work out how to get there by themselves. A **real-time strategy** game (an RTS, such as StarCraft or Age of Empires) runs that while the clock keeps going; a **turn-based** one waits for each side to move, as chess does. Either way, three pieces come first, and every strategy game you have played is built on top of them:

1. **Selecting units**: a click on one unit, or a box dragged around several.
2. **Giving an order**: a click on the ground that says "go there".
3. **Finding a way**: each unit walks around rocks, walls and water to reach the spot, instead of walking straight into them. This is called **pathfinding**.

Resources, buildings, enemy armies and fog of war all come later and all use these three. This page builds them in one small game you can paste and run, then shows what to ask an AI coding agent and what to check when the units misbehave.

A few words first. **three.js** is a JavaScript library that draws 3D scenes inside a web page, on a **canvas** (the rectangle on the page where the picture appears). The **game loop** is a function the browser calls about sixty times a second; each call moves things a little and draws one picture. A **grid** is the map cut into equal squares, like a chessboard, so the game can say "this square is a rock" and "that one is free".

## 1. Selecting units with a drag box

When you press the mouse button, remember where. While it is held, draw a rectangle from there to the pointer; a plain HTML `div` with a white border, laid over the canvas, is enough. When the button comes up, select every unit whose position on the screen is inside the rectangle.

The units live in the 3D world and the box lives on the screen, so each unit's 3D position has to be turned into a screen position first. three.js does that with `project`, which gives a point from -1 to 1 across the canvas; two lines turn that into pixels:

```js
const v = new THREE.Vector3(k.x, 0.5, k.z).project(camera);
return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight };
```

A drag and a click both start with the button going down, so the game needs a rule to tell them apart: if the pointer moved less than a few pixels, it was a click. The game below uses 6 pixels.

## 2. An order is a click on the ground

A click that is not on a unit is an order. The game needs to know which square of the ground is under the pointer. A **raycaster** sends a line from the camera through the pointer into the scene; where that line meets the flat ground is the spot clicked, and rounding it gives the square. If that square is a rock, the game ignores the click. [How to click on an object with a Raycaster](/guides/threejs-click-on-object-raycaster) explains the raycaster in detail.

## 3. A path around the rocks

A unit that walks straight at its target stops at the first rock. To go around, it needs a list of squares to walk through. On a grid, the plain way to make that list is a **breadth-first search** (BFS): start at the unit's square, look at its four neighbours, then their neighbours, and so on, spreading out one ring at a time and never stepping onto a rock. For every square it reaches, it writes down the square it came from. When the search reaches the target, walk back along "came from" to the start, and that is the path, the shortest one on the grid.

The page about [making an enemy follow the player](/guides/make-an-enemy-follow-the-player) walks through the same search step by step for a chasing enemy; here it is the part that sends a whole group. Bigger games use **A\*** (A-star), which is the same search with a guess of the remaining distance so it looks toward the target first. On a small map you will not notice the difference.

## 4. Give each unit its own square

Send three units to one square and they all walk to it and stand inside each other. The fix is to give each unit a different square near the target. The same search does this: run it from the target, and the first squares it reaches are the free ones nearest the target, in order. Take one per unit, and give each unit the closest of those that is still free. The units now arrive as a small group.

With many units there is a neater version of the same idea: run one search from the target and let every unit step to whichever neighbour is closer to it, so hundreds of units share one search. That is called a **flow field**, and it is worth asking for once a game has more than a few dozen units.

## The game: three knights and a wall of rocks

Drag a box around the blue knights, then click near the red flag on the far side of the rock wall. Each knight finds its own way around the wall, and when all three are near the flag, the game says so. Save it as `index.html`, run `npm install three` in its folder (this needs Node.js, a free program that installs JavaScript libraries), serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Knights and rocks</title>
<style>html,body{margin:0;overflow:hidden;background:#5d7f45}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#fff;font:600 18px system-ui;pointer-events:none}
#box{position:fixed;border:2px solid #fff;background:rgba(255,255,255,.15);pointer-events:none}</style></head>
<body>
<div id="hud"></div>
<div id="box" hidden></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The map: # is a rock, K a knight's start, F the flag. One character is one square of the grid.
const MAP = [
  '..............',
  '.......#......',
  '..#....#......',
  '.K.....#......',
  '.K.....#....F.',
  '.K.....#......',
  '.......#...#..',
  '...#...#......',
  '..............',
  '..............',
];
const COLS = MAP[0].length, ROWS = MAP.length;
const free = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS && MAP[r][c] !== '#';
const toWorld = (c, r) => ({ x: c - COLS / 2 + 0.5, z: r - ROWS / 2 + 0.5 });
const toCell = (x, z) => ({ c: Math.round(x + COLS / 2 - 0.5), r: Math.round(z + ROWS / 2 - 0.5) });
const key = (c, r) => r * COLS + c;

// Breadth-first search: from one square, every square it can reach, nearest first, each with the square it came from.
function bfs(start) {
  const came = new Map([[key(start.c, start.r), null]]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { c: cur.c + dc, r: cur.r + dr };
      if (!free(next.c, next.r) || came.has(key(next.c, next.r))) continue;
      came.set(key(next.c, next.r), cur);
      queue.push(next);
    }
  }
  return came;
}
// The squares from `from` to `to`, walking back along "came from"; empty when there is no way through.
function pathTo(from, to) {
  const came = bfs(from), path = [];
  if (!came.has(key(to.c, to.r))) return path;
  for (let at = to; at; at = came.get(key(at.c, at.r))) path.unshift(at);
  return path.slice(1);
}
// The n free squares nearest the target, so a group spreads out instead of stacking on one square.
const spots = (target, n) => [...bfs(target).keys()].slice(0, n).map(k => ({ c: k % COLS, r: Math.floor(k / COLS) }));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x5d7f45);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 13, 8);
camera.lookAt(0, 0, 0.5);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x445533, 2.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(4, 10, 3);
scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(COLS, ROWS).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x79a356 }));
ground.name = 'ground';
scene.add(ground);
const knights = [], rockGeo = new THREE.DodecahedronGeometry(0.5), rockMat = new THREE.MeshStandardMaterial({ color: 0x8a8580, flatShading: true });
let flag;
MAP.forEach((row, r) => [...row].forEach((ch, c) => {
  const { x, z } = toWorld(c, r);
  if (ch === '#') {
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.name = 'rock';
    rock.position.set(x, 0.4, z);
    scene.add(rock);
  } else if (ch === 'F') {
    flag = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6), new THREE.MeshStandardMaterial({ color: 0xdddddd }));
    flag.name = 'flag';
    flag.position.set(x, 0.8, z);
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.04), new THREE.MeshStandardMaterial({ color: 0xe04040 }));
    cloth.position.set(0.3, 0.55, 0);
    flag.add(cloth);
    scene.add(flag);
  } else if (ch === 'K') {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.5, 4, 12), new THREE.MeshStandardMaterial({ color: 0x4070e0 }));
    mesh.name = 'knight';
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 24).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    ring.name = 'selection ring';
    ring.position.y = -0.45;
    mesh.add(ring);
    scene.add(mesh);
    knights.push({ x, z, path: [], selected: false, mesh, ring });
  }
}));

// Orders: every selected knight gets its own square near the target and its own path there.
function order(target) {
  const chosen = knights.filter(k => k.selected);
  const goals = spots(target, chosen.length);
  for (const k of chosen) {
    const from = toCell(k.x, k.z);
    goals.sort((a, b) => (Math.abs(a.c - from.c) + Math.abs(a.r - from.r)) - (Math.abs(b.c - from.c) + Math.abs(b.r - from.r)));
    k.path = pathTo(from, goals.shift());
  }
}

function step(dt) {
  for (const k of knights) {
    if (!k.path.length) continue;
    const goal = toWorld(k.path[0].c, k.path[0].r);
    const dx = goal.x - k.x, dz = goal.z - k.z, d = Math.hypot(dx, dz), move = 3 * dt;   // 3 squares a second
    if (d <= move) { k.x = goal.x; k.z = goal.z; k.path.shift(); }
    else { k.x += dx / d * move; k.z += dz / d * move; }
  }
}
const arrived = () => knights.filter(k => Math.hypot(k.x - flag.position.x, k.z - flag.position.z) < 2.5).length;   // 2.5: a group of three spreads three squares wide

// Mouse: a drag draws a box and selects the knights inside it; a click on a knight selects it; a click on the ground sends the selected.
const box = document.getElementById('box'), hud = document.getElementById('hud');
let drag = null;
const onScreen = k => {
  const v = new THREE.Vector3(k.x, 0.5, k.z).project(camera);
  return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight };
};
renderer.domElement.addEventListener('pointerdown', e => { drag = { x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY }; });
addEventListener('pointermove', e => {
  if (!drag) return;
  drag.x1 = e.clientX; drag.y1 = e.clientY;
  Object.assign(box.style, { left: Math.min(drag.x0, drag.x1) + 'px', top: Math.min(drag.y0, drag.y1) + 'px',
    width: Math.abs(drag.x1 - drag.x0) + 'px', height: Math.abs(drag.y1 - drag.y0) + 'px' });
  box.hidden = false;
});
addEventListener('pointerup', e => {
  if (!drag) return;
  const left = Math.min(drag.x0, drag.x1), right = Math.max(drag.x0, drag.x1), top = Math.min(drag.y0, drag.y1), bottom = Math.max(drag.y0, drag.y1);
  drag = null;
  box.hidden = true;
  if (right - left > 6 || bottom - top > 6) {                                   // a drag: select what is inside the box
    for (const k of knights) { const p = onScreen(k); k.selected = p.x > left && p.x < right && p.y > top && p.y < bottom; }
    return;
  }
  const hit = knights.find(k => { const p = onScreen(k); return Math.hypot(p.x - e.clientX, p.y - e.clientY) < 25; });
  if (hit) { for (const k of knights) k.selected = k === hit; return; }
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, 1 - e.clientY / innerHeight * 2), camera);
  const point = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
  const target = point && toCell(point.x, point.z);
  if (target && free(target.c, target.r)) order(target);
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  for (const k of knights) { k.mesh.position.set(k.x, 0.5, k.z); k.ring.visible = k.selected; }
  const n = arrived();
  hud.textContent = n === 3 ? 'All three knights reached the flag!' : `Drag a box around knights, then click where they should go. Selected: ${knights.filter(k => k.selected).length}`;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'knights and rocks', units: 'grid squares', mouse: 'drag a box to select knights, click the ground to send them' }),
  observe: () => ({ selected: knights.filter(k => k.selected).length, arrived: arrived(),
    knights: knights.map(k => ({ x: +k.x.toFixed(2), z: +k.z.toFixed(2), moving: k.path.length > 0 })) }),
  setState: s => (s.knights ?? []).forEach((p, i) => Object.assign(knights[i], p, { path: [] })),
  subject: () => knights[0].mesh,
};
</script>
</body></html>
```

The map at the top is the whole level: change a `.` to a `#` to add a rock, and the knights path around it with no other change. The `window.__game` object at the end lets a test tool read where the knights are; the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code, Cursor or Codex that writes and edits the files of your project) can build this from a short description, and it builds it better when you name the pieces:

```text
Make a small real-time strategy game in one index.html with three.js.
A grid map of 14 by 10 squares with rocks on it, three units and a flag.
Drag a box with the mouse to select units (an HTML div drawn over the canvas),
click a unit to select it alone, click the ground to send the selected units there.
Each unit finds a path around the rocks with a breadth-first search on the grid,
and each one gets its own free square near the target so they do not stack.
Show a ring under selected units, and say when all three have reached the flag.
```

Then grow it one piece at a time: a second kind of unit, a resource to gather, an enemy that walks toward your base. [Build a three.js game with an AI agent](/guides/ai-agent-build-threejs-game) covers working with an agent on a game over several steps.

## When the units misbehave

- **They walk through rocks.** The unit is moving straight at the target instead of along the path. Check that it moves toward the first square of its path and drops that square when it gets there.
- **They pile up on one square.** Every unit was given the same target. Give each its own square (piece 4).
- **The box selects nothing, or the wrong units.** The box is compared with 3D positions instead of screen positions. Project each unit first (piece 1).
- **Every drag also sends an order.** The drag-or-click rule is missing, so the button coming up after a drag counts as a click on the ground.
- **A unit stands still after an order.** The target square was a rock, or no path reaches it; the search returns an empty list. Ignore clicks on rocks, and show the player something when a spot cannot be reached.
- **Clicks do nothing at all.** A panel over the canvas is taking them. Give the score text and the box `pointer-events: none`, as the game above does.

## Let the agent drag the box and watch the knights

A strategy game is hard for an agent to test by reading its code: selection depends on where things land on the screen, and a path depends on the map. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can play it. In Claude Code, install it with these two lines in a terminal (the window where you type commands):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

`interact` presses, moves and releases the mouse at given pixels, which is a drag. Its `until` step keeps playing until the game's state matches, `trace` follows numbers frame by frame, and `expect` checks the result. These replies were captured on 2026-10-30 on the game above, on a machine with no graphics card where Chrome draws in software. The knights' screen positions came from an `eval` call (it runs code inside the page) before the drag.

On a first version of this game, which counted a knight as arrived within 1.6 squares of the flag, the drag and the click went through, but the wait never ended:

```text
until: not met in 600 frames (arrived 2, expected 3)
Expect: arrived 2 ✗ expected 3 · knights.0.moving false ✓
```

The knights had stopped in a row three squares wide beside the flag, so the knight at the far end stood 2 squares from it and never counted. Nothing in a screenshot shows that: all three knights are next to the flag. With the rule widened to 2.5 squares, as in the game above, the same play passes and is saved as a check:

```text
interact {"steps": [{"mouse": "down", "x": 230, "y": 230}, {"mouse": "move", "x": 340, "y": 420}, {"mouse": "up", "x": 340, "y": 420}, {"mouse": "click", "x": 928, "y": 329}, {"until": {"arrived": 3}, "max": 600}], "trace": ["knights.0.x", "knights.0.z"], "expect": {"selected": 3, "arrived": 3}, "save": "three-knights-reach-flag"}

{"changed":{"selected":3,"arrived":3,"knights":[{"x":3.5,"z":-0.95,"moving":true},{"x":3.5,"z":0.95,"moving":true},{"x":5.5,"z":1.95,"moving":true}]}}
Motion (knight): travelled 15.6 units (9.02 from start to end), its direction of travel turned 90° right.
until: arrived == 3 held at frame 329
mouse move at (340, 420): over ground (Mesh, 15.5 units)
knights.0.x: -5.5 → 3.5 at frame 254; first changed at frame 4
knights.0.z: -1.5 → low -4.5 at frame 170 → -0.95 at frame 329; first changed at frame 109
Expect: selected 3 ✓ · arrived 3 ✓
Saved check "three-knights-reach-flag" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

The trace is the path: the first knight's `z` dropped to -4.5, the top row of the map, before coming back down, so it went around the top of the rock wall instead of into it. The Motion line says the same in distance: 15.6 units walked for 9.02 units of straight-line progress. From then on `test` replays the drag and the order after every change to the game, so a later edit that breaks selection or pathing is caught by name.

What paprika3d does not do: it does not design the map, balance the units or write a computer opponent, and it cannot tell you whether the game is interesting to play. It shows the agent what the game does, so the agent can fix what it got wrong without you describing it.

## Next steps

- An enemy that chases your units around walls: [how to make an enemy follow the player](/guides/make-an-enemy-follow-the-player).
- Waves of attackers along a road, and towers that pick targets: [how to make a tower defense game](/guides/make-a-tower-defense-game).
- A tilted overhead camera that fits any screen, as many strategy games use: [three.js isometric camera](/guides/threejs-isometric-camera-orthographic).
- Highlight a unit under the mouse: [outline the selected object](/guides/threejs-outline-selected-object-on-hover).
- A win and a lose screen: [how to add a game over screen](/guides/add-a-game-over-screen).
- Not sure a strategy game is the right first project? [What game should I make first](/guides/what-game-should-i-make-first).
- Strategy played in turns on a board: [how to make a chess game](/guides/make-a-chess-game).
