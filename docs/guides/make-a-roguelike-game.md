---
title: How to make a roguelike game in three.js: a new dungeon every run from a seed
phrase: how to make a roguelike game
description: How to make a roguelike or dungeon crawler in the browser with three.js, for a first game: what a seed is and why JavaScript's Math.random cannot take one, a seeded random generator in a few lines, rooms placed at random and joined by corridors so every room can be reached, stairs to the next floor, enemies and gold from the same seed, turn-based moves on a grid and a new run when you lose; a small seed-dungeon game to paste, the prompt to give an AI agent, what to check when a floor comes out wrong, and paprika3d's look sheet picturing six seeds at once while an eval checks 900 floors.
meta: How to make a roguelike game in three.js: rooms and corridors from a seed, stairs, bats and gold, and a check of 900 floors in one call.
intent: make-a-roguelike-game
queries:
  - "how to make a roguelike game"
  - "how to make a dungeon crawler game"
  - "How to generate random level from a seed?"
  - "Procedural game level generation"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a roguelike game in three.js: a new dungeon every run from a seed

A roguelike is a dungeon game where the computer builds a new dungeon every time you play, and losing sends you back to the start of a fresh one. The name comes from Rogue, a game from 1980 that drew its dungeons in letters on the screen; dungeon crawlers are the same idea with less emphasis on starting over. To make one you need four things:

1. **A dungeon generator**: code that builds a floor of rooms and corridors from random numbers, instead of you drawing each level by hand.
2. **A seed**: one number that decides all those random numbers, so the same seed always builds the same floor.
3. **Turns on a grid**: the hero moves one square per key press, and the monsters move after each of the hero's moves, so you have time to think.
4. **A run**: stairs lead to the next, harder floor, and when the monsters win, a new run starts with a new seed.

This page builds all four in one small game, then shows what to ask an AI coding agent and how to check hundreds of floors without playing them.

A few words first. **three.js** is a JavaScript library that draws 3D scenes in a web page, inside a **canvas** (the rectangle where the game appears). **Procedural generation** means content made by code from rules and random numbers. A **grid** is the map cut into squares; here `#` is a wall and `.` is floor, as in many roguelikes.

## What a seed is, and why Math.random is not enough

Computers do not roll real dice. A random number generator is a small formula that turns one number into the next, and the next into the one after, in a sequence that looks random. The **seed** is the number the sequence starts from. Start from the same seed and you get the same sequence, so the same dungeon. That is what the Stack Exchange question "How to generate random level from a seed?" is about, and it is useful for three reasons: players can share a seed for a dungeon they liked, you can rebuild a floor where a bug happened, and a test can check the same floors every time.

JavaScript's built-in `Math.random()` cannot be given a seed, so a seeded game carries its own generator. The game below uses one called mulberry32, a few lines long; you do not need to follow its arithmetic, just know that `rng(seed)` returns a function that gives the next number each time you call it. Every random choice the dungeon makes must come from that function. One stray `Math.random()` in the generator, and the same seed stops giving the same floor.

If your agent builds the game on paprika3d's game-state package (the way the `threejs-game` skill keeps a game's numbers), `state.random()` is that generator already: the seed goes in when the state is made, and a saved or rewound game keeps its place in the sequence.

## Building a floor: rooms, corridors, stairs

The generator in the game below works in five steps, and each one is a few lines:

1. **Start with solid rock.** A grid of 32 by 20 squares, all walls.
2. **Place rooms.** Pick a random size and a random spot. If the new room would touch a room already placed, throw it away and try again. Stop after seven rooms or 200 tries, whichever comes first. Keep two walls between rooms so corridors show as corridors.
3. **Join each room to the one before it** with an L-shaped corridor: across, then down. Because every room is joined to the previous one, every room can be reached from the first. This is the simple way to guarantee a playable floor; fancier generators join rooms by distance and add extra loops so there is more than one way around.
4. **Start and stairs.** The hero starts in the middle of the first room, and the stairs to the next floor are in the middle of the last one, so the walk between them crosses the floor.
5. **Monsters and treasure.** Gold goes in every room but the first, and bats go in random rooms, again never the first, so a run never starts with a bat beside you. Each goes on a square nothing else is on.

The floor number goes into the seed too (`seed * 31 + floor`), so floor 2 of a run is different from floor 1 and still the same every time that seed is played.

## Turns: nothing moves until you do

Most roguelikes are **turn-based**. A key press moves the hero one square, and then every bat takes one move: toward the hero when it is within four squares, a random flutter when it is not. Walking into a bat swats it; a bat that moves into you bites, and three bites end the run. Because the bats' random flutters also come from the floor's generator, the same seed and the same key presses replay the same run exactly, which is how a bug report with a seed can be reproduced. Turn-based fights with damage, defence and experience points are a subject of their own: [how to make an RPG game](/guides/make-an-rpg-game) covers them.

## The game: seed dungeon

Walk with the arrow keys, pick up the gold coins, swat or avoid the purple bats and find the blue stairs. The seed is shown at the top; add `?seed=42` to the address to play seed 42, and press R after the bats win to start a new run. Save it as `index.html`, run `npm install three` in its folder (this needs Node.js, a free program that installs JavaScript libraries), serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Seed dungeon</title>
<style>html,body{margin:0;overflow:hidden;background:#111118}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#fff;font:600 18px system-ui}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const W = 32, H = 20;

// A seeded random generator (mulberry32): the same seed always gives the same numbers, in the same order.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One floor from a seed: rooms that do not touch, a corridor from each room to the one before, stairs in the last room.
function generate(seed, floor) {
  const rand = rng(seed * 31 + floor);
  const pick = n => Math.floor(rand() * n);
  const map = Array.from({ length: H }, () => Array(W).fill('#'));
  const rooms = [];
  for (let tries = 0; tries < 200 && rooms.length < 7; tries++) {
    const w = 4 + pick(5), h = 3 + pick(4), x = 1 + pick(W - w - 2), y = 1 + pick(H - h - 2);
    if (rooms.some(r => x <= r.x + r.w + 1 && x + w + 1 >= r.x && y <= r.y + r.h + 1 && y + h + 1 >= r.y)) continue; // keep two walls between rooms
    rooms.push({ x, y, w, h });
  }
  for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) map[y][x] = '.';
  const centre = r => ({ c: r.x + (r.w >> 1), r: r.y + (r.h >> 1) });
  for (let i = 1; i < rooms.length; i++) {
    const a = centre(rooms[i - 1]), b = centre(rooms[i]);
    for (let c = Math.min(a.c, b.c); c <= Math.max(a.c, b.c); c++) map[a.r][c] = '.';
    for (let r = Math.min(a.r, b.r); r <= Math.max(a.r, b.r); r++) map[r][b.c] = '.';
  }
  const start = centre(rooms[0]), stairs = centre(rooms[rooms.length - 1]);
  const taken = new Set([start.c + ',' + start.r, stairs.c + ',' + stairs.r]);
  const place = room => {                                    // a random square in the room that nothing else is on
    for (let tries = 0; tries < 20; tries++) {
      const p = { c: room.x + pick(room.w), r: room.y + pick(room.h) };
      if (!taken.has(p.c + ',' + p.r)) { taken.add(p.c + ',' + p.r); return p; }
    }
    return null;                                             // a full room: one thing fewer
  };
  const gold = rooms.slice(1).map(place).filter(Boolean);
  const bats = [];
  for (let i = 0; i < 2 + floor; i++) bats.push(place(rooms[1 + pick(rooms.length - 1)])); // never in the first room, where the player starts
  return { map: map.map(row => row.join('')), rooms, start, stairs, gold, bats: bats.filter(Boolean), rand };
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111118);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 24, 13);
camera.lookAt(0, 0, 0.5);
scene.add(new THREE.HemisphereLight(0xffffff, 0x302840, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(5, 12, 6);
scene.add(sun);
const at = (c, r, y) => new THREE.Vector3(c - W / 2 + 0.5, y, r - H / 2 + 0.5);
const hud = document.getElementById('hud');
const player = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.4, 4, 12), new THREE.MeshStandardMaterial({ color: 0x70f0a0 }));
player.name = 'player';
scene.add(player);

let seed, floor, hearts, gold, over, level, you, bats, coins, built = null;

function newRun(s) { seed = s; hearts = 3; gold = 0; over = false; load(1); }
function load(n) {
  floor = n;
  level = generate(seed, floor);
  you = { ...level.start };
  bats = level.bats.map(b => ({ ...b }));
  coins = level.gold.map(g => ({ ...g }));
  if (built) scene.remove(built);
  built = new THREE.Group();
  const cells = level.map.flatMap((row, r) => [...row].map((ch, c) => ({ ch, c, r })));
  const nearFloor = ({ c, r }) => [-1, 0, 1].some(dr => [-1, 0, 1].some(dc => level.map[r + dr]?.[c + dc] === '.'));
  const walls = cells.filter(p => p.ch === '#' && nearFloor(p)), floors = cells.filter(p => p.ch === '.');
  const box = (list, geo, color, y, name) => {
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color }), list.length);
    list.forEach((p, i) => mesh.setMatrixAt(i, new THREE.Matrix4().setPosition(at(p.c, p.r, y))));
    mesh.name = name;
    built.add(mesh);
  };
  box(walls, new THREE.BoxGeometry(1, 1, 1), 0x6b6078, 0.5, 'wall');
  box(floors, new THREE.BoxGeometry(0.96, 0.1, 0.96), 0x3c3646, -0.05, 'floor');
  const stairs = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), new THREE.MeshStandardMaterial({ color: 0x60d0ff, emissive: 0x2080a0 }));
  stairs.name = 'stairs';
  stairs.position.copy(at(level.stairs.c, level.stairs.r, 0.1));
  built.add(stairs);
  const make = (geo, color, name) => {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
    m.name = name;
    built.add(m);
    return m;
  };
  for (const g of coins) g.mesh = make(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16), 0xffd700, 'gold');
  for (const b of bats) b.mesh = make(new THREE.OctahedronGeometry(0.3), 0xb040e0, 'bat');
  scene.add(built);
}

const free = (c, r) => level.map[r]?.[c] === '.';
const batAt = (c, r) => bats.find(b => b.c === c && b.r === r);
const DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };

// Turn-based: nothing moves until you do. Each key press is one turn for you, then one for every bat.
function act({ key, down = true }) {
  if (!down) return;
  if (over) { if (key === 'KeyR') newRun(seed + 1); return; }
  const dir = DIRS[key];
  if (!dir) return;
  const c = you.c + dir[0], r = you.r + dir[1];
  if (!free(c, r)) return;                                   // a wall: no turn used
  const bat = batAt(c, r);
  if (bat) { bat.mesh.visible = false; bats.splice(bats.indexOf(bat), 1); }   // bump a bat to swat it
  else you = { c, r };
  const coin = coins.find(g => g.c === you.c && g.r === you.r);
  if (coin) { gold++; coin.mesh.visible = false; coins.splice(coins.indexOf(coin), 1); }
  if (you.c === level.stairs.c && you.r === level.stairs.r) { load(floor + 1); return; }
  for (const b of bats) {                                    // the bats' turn: fly at you when near, flutter when not
    const dc = Math.sign(you.c - b.c), dr = Math.sign(you.r - b.r);
    const near = Math.abs(you.c - b.c) + Math.abs(you.r - b.r) <= 4;
    const [mc, mr] = near ? (dc && free(b.c + dc, b.r) ? [dc, 0] : [0, dr]) : Object.values(DIRS)[Math.floor(level.rand() * 4)];
    if (b.c + mc === you.c && b.r + mr === you.r) { hearts--; continue; }   // a bite: the bat stays where it is
    if (free(b.c + mc, b.r + mr) && !batAt(b.c + mc, b.r + mr)) { b.c += mc; b.r += mr; }
  }
  if (hearts <= 0) over = true;
}
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

newRun(Number(new URLSearchParams(location.search).get('seed')) || Math.floor(Math.random() * 100000));
renderer.setAnimationLoop(() => {
  player.position.copy(at(you.c, you.r, 0.45));
  for (const b of bats) b.mesh.position.copy(at(b.c, b.r, 0.6));
  for (const g of coins) g.mesh.position.copy(at(g.c, g.r, 0.05));
  hud.textContent = over ? `The bats got you on floor ${floor} with ${gold} gold. R starts a new run.`
    : `Floor ${floor}   Hearts ${hearts}   Gold ${gold}   Seed ${seed}`;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'seed dungeon', units: 'squares', keys: { ArrowUp: 'step up', ArrowDown: 'step down', ArrowLeft: 'step left', ArrowRight: 'step right', KeyR: 'new run after the bats win' } }),
  observe: () => ({ seed, floor, hearts, gold, over, player: { ...you }, bats: bats.length, rooms: level.rooms.length }),
  act,
  setState: s => { if (s.seed !== undefined) newRun(s.seed); if (s.floor) load(s.floor); if (s.hearts !== undefined) hearts = s.hearts; },
  generate,
  subject: player,
};
</script>
</body></html>
```

`generate` is the whole dungeon builder and touches nothing on screen; `load` turns its result into walls, floor tiles, stairs, coins and bats, drawing the walls and floor tiles as two `InstancedMesh` objects (one object that draws many copies of a box) so a few hundred walls cost two draws. `window.__game` at the end lets a test tool read the run and call `generate` for any seed; the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code, Cursor or Codex that writes and edits the files of your project) can write a dungeon generator in one go. Name the seed and the rules, or it may reach for `Math.random()`:

```text
Make a small turn-based roguelike in one index.html with three.js, seen from above.
Generate each floor from a seed with a seeded random generator (mulberry32),
never Math.random: rooms placed at random that never touch, each room joined to the
previous one by an L-shaped corridor, the player in the first room, stairs in the last.
Put gold in every room but the first and a few bats in random rooms, never the first,
each on its own square. Arrow keys move one square a turn; then each bat moves.
Show the seed on screen and read ?seed= from the address. Then write a check that
builds floors for seeds 1 to 300 and reports any room that cannot be reached.
```

The last line matters. A generator can make a bad floor once in a hundred seeds, and playing a hundred floors by hand to find it is slow. [Build a three.js game with an AI agent](/guides/ai-agent-build-threejs-game) covers working with an agent on a game over several steps.

## When a floor comes out wrong

- **Rooms melt into one big cave.** The overlap test allows rooms to touch. Count a room as overlapping when it comes within a square or two of another.
- **A room cannot be reached.** Some room was never joined to the others. Join every room to the one before it, then check with a flood fill (below).
- **A monster attacks on the first turn.** Monsters were allowed in the starting room.
- **Two things on one square,** such as two bats drawn inside each other, or gold under the stairs. Keep a list of taken squares while placing.
- **The game freezes while making a floor.** A loop keeps trying to fit a room that never fits. Give every "try again" loop a limit, as the game does with its 200 and 20 tries.
- **The same seed gives a different floor.** Something in the generator calls `Math.random()` or reads the time instead of the seeded generator.

## See six floors at once, and check 900 of them

A generator's mistakes hide in seeds you never played. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs the game in a hidden Chrome browser so the agent can see it and test it. Install it in Claude Code with these two lines in a terminal (the window where you type commands):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

`look` with `sheet` reloads the game once per moment, sets each one up through the game's `setState`, and puts them all in one picture with a line per moment of what is on screen. Here it is six seeds. The replies below were captured on 2026-10-30 on the game above, on a machine with no graphics card where Chrome draws in software; the sheet's lighting note is left out.

```text
look {"sheet": [{"label": "seed 1", "state": {"seed": 1}}, {"label": "seed 2", "state": {"seed": 2}}, {"label": "seed 3", "state": {"seed": 3}}, {"label": "seed 4", "state": {"seed": 4}}, {"label": "seed 5", "state": {"seed": 5}}, {"label": "seed 6", "state": {"seed": 6}}]}

Picture: <project>/paprika3d/runs/2026-10-30T23-22-08-636Z/look-7-sheet.png (6 moments, left to right, top to bottom: seed 1 | seed 2 | seed 3 | seed 4 | seed 5 | seed 6); the game is reloaded at its first frame
seed 1: subject player 0.041%; on screen: wall* ×175, floor* ×218, stairs, player, bat ×3, gold ×6; pixels: brightness 18%, colour saturation 25%, 0% near black, 0% blown out
seed 2: subject player 0.033%; on screen: wall* ×205, floor* ×233, stairs, player, bat ×3, gold ×6; pixels: brightness 19%, colour saturation 25%, 0% near black, 0% blown out
seed 3: subject player 0.04%; on screen: wall* ×172, floor* ×208, stairs, player, bat ×3, gold ×6; pixels: brightness 18%, colour saturation 25%, 0% near black, 0% blown out
seed 4: subject player 0.034%; on screen: wall* ×201, floor* ×247, stairs, player, bat ×3, gold ×6; pixels: brightness 20%, colour saturation 24%, 0% near black, 0% blown out
seed 5: subject player 0.048%; on screen: wall* ×184, floor* ×197, stairs, player, bat ×3, gold ×6; pixels: brightness 18%, colour saturation 25%, 0% near black, 0% blown out
seed 6: subject player 0.034%; on screen: wall* ×140, floor* ×173, stairs, player, bat ×3, gold ×4; pixels: brightness 16%, colour saturation 26%, 0% near black, 0% blown out
This sheet took 3 s (about 0 s a cell) on a software renderer.
```

Floor 1 places three bats, and gold in every room but the first, so these lines are a count the agent can check by eye: seed 6 made five rooms and has four coins. On an earlier version of the generator, the same sheet listed seed 5 with `bat ×2`. Two bats had been placed on the same square and were drawn inside each other, which no single screenshot would make you count. That is where the taken-squares list in `generate` came from.

A picture covers a handful of seeds. For hundreds, `eval` runs code inside the page; this check builds floors 1 to 3 for seeds 1 to 300 with the game's own `generate`, flood-fills each floor from the start (spreading through every open square it can reach) and counts what went wrong:

```js
const found = { floors: 0, fewerThan4Rooms: 0, unreachable: 0, sharedSquare: 0, batNearStart: [] };
for (let seed = 1; seed <= 300; seed++) for (let floor = 1; floor <= 3; floor++) {
  const f = window.__game.generate(seed, floor);
  found.floors++;
  const seen = new Set([f.start.c + ',' + f.start.r]), todo = [f.start];   // flood fill from the start
  while (todo.length) {
    const p = todo.pop();
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = p.c + dc, r = p.r + dr;
      if (f.map[r]?.[c] === '.' && !seen.has(c + ',' + r)) { seen.add(c + ',' + r); todo.push({ c, r }); }
    }
  }
  if (f.rooms.length < 4) found.fewerThan4Rooms++;
  if (f.rooms.some(room => !seen.has(room.x + ',' + room.y))) found.unreachable++;
  const things = [f.stairs, ...f.gold, ...f.bats].map(p => p.c + ',' + p.r);
  if (new Set(things).size < things.length) found.sharedSquare++;
  if (f.bats.some(b => Math.abs(b.c - f.start.c) + Math.abs(b.r - f.start.r) <= 2)) found.batNearStart.push(seed + '/' + floor);
}
found.batNearStart = found.batNearStart.length + ' floors, first: ' + found.batNearStart.slice(0, 5).join(' ');
return found;
```

Run on that earlier version, which gave up placing rooms after 60 tries, put bats in any room and kept no list of taken squares, it answered:

```text
{"floors":900,"fewerThan4Rooms":3,"unreachable":0,"sharedSquare":226,"batNearStart":"283 floors, first: 1/1 1/2 5/2 5/3 6/3"}
```

Every room could be reached, since the corridors join each room to the one before. But three floors had fewer than four rooms, 226 had two things on one square, and 283 started the hero within two squares of a bat; seed 1 does it on its very first floor. On the game above, with 200 tries, no bats in the first room and the taken-squares list:

```text
{"floors":900,"fewerThan4Rooms":0,"unreachable":0,"sharedSquare":0,"batNearStart":"0 floors, first: "}
```

The check is code the agent writes for this game's rules, not a built-in feature; a dungeon with locked doors or keys needs its own version. What paprika3d does not do: it does not design the dungeon or tell you whether a floor is fun, too easy or too cruel. It shows the agent what the generator made, on as many seeds as it asks for.

## Next steps

- Hand-made levels instead of generated ones: [how to make levels in a game](/guides/make-levels-in-a-game).
- Bats that find their way around walls to you: [how to make an enemy follow the player](/guides/make-an-enemy-follow-the-player).
- Fights with damage and experience instead of one swat: [how to make an RPG game](/guides/make-an-rpg-game).
- A screen for the end of a run, and the deepest floor kept as a record: [how to add a game over screen](/guides/add-a-game-over-screen) and [how to save the high score](/guides/save-the-high-score).
- A title screen and a pause menu: [how to make a main menu for a game](/guides/make-a-main-menu).
