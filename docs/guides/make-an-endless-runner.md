---
title: How to make an endless runner game in three.js: the world moves, the runner stays
phrase: how to make an endless runner game
description: How to make an endless runner game like Temple Run, Subway Surfers or the Chrome dinosaur, for someone who has never made a game: the runner stays in front of the camera while the path slides and turns around it, a dozen path pieces reused forever, gaps to jump, corners to turn at and a speed that rises with distance, on a small three.js temple run you can paste; and how a coding agent with paprika3d plays it to the first fall, scripts a whole run and checks the piece count stays flat.
meta: How to make an endless runner game in three.js: the path moves and turns around a still runner, pieces are reused, speed rises.
intent: make-an-endless-runner
queries:
  - "What is actually moving in an endless runner?"
  - "how to make a game like temple run"
  - "how to make a game like subway surfers"
  - "how to make a chrome dino game in html"
  - "Endless runner game"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make an endless runner game in three.js: the world moves, the runner stays

In an endless runner, the runner does not really go anywhere. It stays in one spot in front of the camera, and the world slides toward it. A path piece that has gone behind the camera is picked up and put back at the far end, so the game never builds an endless world: it keeps reusing about a dozen pieces. Make the speed creep up with the distance run, put a gap or a corner on some of the new pieces, and you have Temple Run, Subway Surfers or the Chrome dinosaur in its smallest form.

Some words used below. **three.js** is a JavaScript library that draws 3D scenes in a web page. A **frame** is one picture of the game; browsers draw about 60 a second. The **game loop** is the function that runs once per frame: it moves everything a little, then draws. A **mesh** is one shape three.js draws, such as one stone slab of the path.

## What actually moves

The Game Development Stack Exchange question "What is actually moving in an endless runner?" has two honest answers: either the runner and camera move forward through a world that is built ahead and cleared behind, or the runner and camera stand still and the world moves backward. Both work and players cannot tell them apart. This page moves the world, because then the runner, the camera and the light never change, and the one thing the code has to manage is where the pieces of path are.

In three.js that is one **group** (a container that moves everything inside it together) holding every piece of path. The runner is not in the group. Each frame, the game works out how far the runner has gone along the path, then moves and turns the group the opposite way, so the runner's spot on the path lands exactly in front of the camera.

## Reusing the pieces

Creating a new mesh for every new piece of path, and never removing the old ones, grows the page's memory until it stutters. Instead, make 14 pieces when the game starts and never make another. When the runner is three pieces past the oldest one, that piece moves to the far end and becomes the next piece of path. Moving a mesh is just changing its position, so a run of any length costs the same as the first second. This is called an **object pool**.

Each new piece is one of three kinds:

- **Stone**, to run on.
- **A gap**, the same piece hidden, which the runner has to jump.
- **A gold corner**, where the path turns left or right. The runner turns with the arrow key while standing on it; a runner that misses the turn runs straight off the edge.

The turns alternate, left then right, so the path zigzags and never runs back into itself. The kinds come from a small **seeded random generator**: random-looking numbers that are the same sequence every time for the same seed, so every run has the same path to learn, and a test can replay it.

## Jumping, falling and getting faster

The jump is an upward speed that gravity takes away each frame; [how to make a character jump](/guides/make-a-character-jump) explains it in full, with platforms and a double jump. Here the runner stands on a piece when it is over stone and its feet come down to the path, and over a gap or past a missed corner it keeps falling until the game ends. The speed is `Math.min(14, 8 + distance / 40)`: 8 units a second at the start, a little faster with each 40 units run, never more than 14.

## The whole game: temple path

An orange runner on a stone path through a dark jungle. Space jumps gaps, the left and right arrows turn on gold corners, and R runs again after a fall. Save it as `index.html` in a new folder, run `npm install three` there (this downloads three.js into the folder), start a small web server in the folder with `python3 -m http.server 8000`, and open `http://localhost:8000` in your browser. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Temple path</title>
<style>html,body{margin:0;overflow:hidden;background:#16302b}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#fff;font:600 20px system-ui}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const TILE = 4, POOL = 14;                 // each path piece is 4 units long; 14 pieces exist, reused forever
const GRAVITY = 30, JUMP = 9;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];   // north, east, south, west as steps in (x, z)
const UP = new THREE.Vector3(0, 1, 0);
const hud = document.getElementById('hud');
let rand, path, at, straight, turnSign, made, p, dir, y, vy, distance, speed, alive;

function random(seed) {                     // a small seeded random generator, so every run has the same path
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The piece after `last`: straight stone, a gap to jump, or a corner to turn at.
function nextPiece(last) {
  const out = last.kind === 'corner' ? (last.dir + last.turn + 4) % 4 : last.dir;
  const piece = { x: last.x + DIRS[out][0] * TILE, z: last.z + DIRS[out][1] * TILE, dir: out, kind: 'stone', turn: 0 };
  const r = rand();
  if (straight >= 2 && r < 0.2) { piece.kind = 'corner'; piece.turn = turnSign; turnSign = -turnSign; }   // left, right, left: the path never crosses itself
  else if (straight >= 2 && r < 0.45) piece.kind = 'gap';
  straight = piece.kind === 'stone' ? straight + 1 : 0;
  return piece;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x16302b);
scene.fog = new THREE.Fog(0x16302b, 20, 48);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 4, 7);
camera.lookAt(0, 1, -6);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xfff2dd, 0x203020, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(3, 10, 4);
scene.add(sun);

const world = new THREE.Group();            // everything that moves past the runner
world.name = 'world';
scene.add(world);
const stone = new THREE.MeshStandardMaterial({ color: 0x9a8f7a });
const gold = new THREE.MeshStandardMaterial({ color: 0xd8b04a });
const meshes = Array.from({ length: POOL }, () => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(TILE - 0.1, 0.5, TILE - 0.1), stone);
  m.name = 'path';
  world.add(m);
  return m;
});
const runner = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.6), new THREE.MeshStandardMaterial({ color: 0xe0603a }));
runner.name = 'runner';
scene.add(runner);                          // in the scene, not the world: it never moves forward

function place(piece, mesh) {               // put a pooled mesh where a piece of path is
  piece.mesh = mesh;
  mesh.position.set(piece.x, -0.25, piece.z);
  mesh.visible = piece.kind !== 'gap';
  mesh.material = piece.kind === 'corner' ? gold : stone;
}

function reset() {
  rand = random(6); straight = 0; turnSign = 1;
  path = [{ x: 0, z: 0, dir: 0, kind: 'stone', turn: 0 }];
  while (path.length < POOL) path.push(nextPiece(path[path.length - 1]));
  path.forEach((piece, i) => place(piece, meshes[i]));
  made = POOL; at = 0; p = { x: 0, z: 0 }; dir = 0; y = 0; vy = 0; distance = 0; speed = 8; alive = true;
}
reset();

function step(dt) {
  if (!alive) return;
  speed = Math.min(14, 8 + distance / 40);  // faster the further you run
  const [dx, dz] = DIRS[dir];
  p.x += dx * speed * dt;
  p.z += dz * speed * dt;
  distance += speed * dt;
  if (y >= 0 && (p.x - path[at].x) * dx + (p.z - path[at].z) * dz > TILE / 2) at++;   // past this piece's far edge
  const on = path[at];
  const ground = on.kind !== 'gap' && Math.abs(p.x - on.x) <= TILE / 2 && Math.abs(p.z - on.z) <= TILE / 2;
  const before = y;
  vy -= GRAVITY * dt;
  y += vy * dt;
  if (ground && y <= 0 && before >= 0) { y = 0; vy = 0; }   // stand on the path; over a gap or off a missed corner, keep falling
  if (y < -6) alive = false;
  if (at > 2) {                             // the piece far behind goes to the front, mesh and all
    const old = path.shift();
    const piece = nextPiece(path[path.length - 1]);
    place(piece, old.mesh);
    path.push(piece);
    at--;
    made++;
  }
}

function sceneOf(piece) {                   // where a piece of path is, seen from the runner
  return new THREE.Vector3(piece.x - p.x, 0, piece.z - p.z).applyAxisAngle(UP, dir * Math.PI / 2);
}

let last = null;
function loop(now) {
  requestAnimationFrame(loop);
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  // Move and turn the world so the runner's spot is at the origin, facing into the screen.
  world.rotation.y = dir * Math.PI / 2;
  const off = new THREE.Vector3(p.x, 0, p.z).applyAxisAngle(UP, world.rotation.y);
  world.position.set(-off.x, 0, -off.z);
  runner.position.set(0, y + 0.65, 0);
  hud.textContent = alive ? `${Math.floor(distance)} m` : `You fell after ${Math.floor(distance)} m. Press R to run again.`;
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

const act = ({ key, down = true }) => {
  if (!down) return;
  if (key === 'KeyR' && !alive) reset();
  if (key === 'Space' && alive && y === 0) vy = JUMP;
  const want = key === 'ArrowRight' || key === 'KeyD' ? 1 : key === 'ArrowLeft' || key === 'KeyA' ? -1 : 0;
  const t = path[at];
  if (want && alive && t.kind === 'corner' && t.turn === want && dir === t.dir) {
    dir = (dir + want + 4) % 4;             // turn on the corner piece, onto its middle
    p.x = t.x;
    p.z = t.z;
  }
};
addEventListener('keydown', e => { if (e.code === 'Space') e.preventDefault(); act({ key: e.code }); });
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.__game = {
  subject: 'runner',
  describe: () => ({ name: 'temple path', keys: { Space: 'jump a gap', ArrowLeft: 'turn left on a gold corner', ArrowRight: 'turn right on a gold corner', KeyR: 'run again after a fall' } }),
  observe: () => {
    const next = sceneOf(path[at + 1]);
    return {
      runner: { x: runner.position.x, y: +runner.position.y.toFixed(2), z: runner.position.z },
      world: { x: +world.position.x.toFixed(2), z: +world.position.z.toFixed(2) },
      next: { kind: path[at + 1].kind, x: +next.x.toFixed(2), z: +next.z.toFixed(2) },
      here: path[at].kind, distance: +distance.toFixed(1), speed: +speed.toFixed(2), alive, pieces: meshes.length, made,
    };
  },
  act,
  setState: (s) => { if (s.alive === true && !alive) reset(); },
};
</script>
</body></html>
```

The `window.__game` object at the end is for testing tools: it lets them read where the runner and the next piece are and press keys through `act`. The game plays without it.

## What to type to an AI coding agent

An **AI coding agent** (Claude Code, Codex, Cursor and others) is an assistant that writes files on your computer and runs commands. "Make a game like Temple Run" leaves it to guess the hard parts. Name them:

```text
Make an endless runner in three.js in one index.html, like a small Temple Run.
The runner stays still in front of the camera; the stone path moves and turns around it.
Use a pool of 14 path pieces that are reused when they pass behind, never new meshes.
Pieces are stone, gaps to jump with Space, or gold corners where the left or right arrow turns.
Missing a turn or falling in a gap ends the run; R runs again.
Speed starts at 8 and rises with distance. Use a seeded random so every run has the same path.
```

For three lanes and dodging, as in Subway Surfers, [make a game with Claude Code](/guides/make-a-game-with-claude-code) builds a lane dodger; on a phone, swiping is touch input, which [how to make a mobile game with AI](/guides/make-a-mobile-game-with-ai) covers.

## When the runner breaks

- **It stutters more and more the longer you run.** New meshes are made for each piece and old ones never removed. Use a pool.
- **Pieces pop into view in front of the runner.** The pool is too short for the camera's view. Add pieces, or fog (`scene.fog`) that hides the far end, as the game does.
- **The runner slides away from the camera or off the path.** Both the runner and the world are moving. Pick one.
- **The path runs into itself after a few turns.** The turns are random. Alternate them, or check the new piece's square is free.
- **Turning does nothing.** The key is checked when the runner is not on the corner piece yet, or the turn is the wrong way for that corner.

## Let the agent play the run itself

A runner is fast and random-looking, so describing a bug in it ("sometimes it falls through") is hard. paprika3d is a plugin for Claude Code (and an MCP server for other coding agents) that lets the agent open the page in a headless Chrome (a browser with no window), play it frame by frame, each 1/60 s of game time, and read the game's numbers back. Install it in Claude Code with:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

These replies were captured on 2026-10-30 on the game above, on a Linux server with no GPU. First the state before anything runs, then `interact` with `{ until }` lets the runner go with no keys pressed until the run ends, while `trace` follows the runner and the world:

```text
observe {}

{"runner":{"x":0,"y":0,"z":0},"world":{"x":0,"z":0},"next":{"kind":"stone","x":0,"z":-4},"here":"stone","distance":0,"speed":8,"alive":true,"pieces":14,"made":14,"harness":{"frame":0,"renderer":{"calls":0,"triangles":0,"textures":0,"geometries":0,"programs":0},"scene":{"objects":18,"meshes":15,"lights":2,"cameras":0},"errors":[],"changed":null}}

interact {"steps":[{"until":{"alive":false},"max":600}],"trace":["runner.z","world.z","distance"]}

{"changed":{"runner":{"y":-5.52},"world":{"z":19.22},"next":{"z":-0.78},"here":"gap","distance":19.2,"speed":8.48,"alive":false,"made":16}}
until: alive == false held at frame 140
runner.z: 0 throughout the 140 frames
world.z: 0 → 19.22 at frame 140; first changed at frame 1
distance: 0 → 19.2 at frame 140; first changed at frame 1
```

That is the Stack Exchange question answered by measurement: the runner's position was 0 on every one of the 140 frames, and the world moved 19.22 units toward the camera, the same as the distance run. With no jump, the run ended in the first gap. Then a whole run in one call: R to start again, and each `{ until }` waits for the next moment to act, a gap just ahead or the runner on a corner:

```text
interact {"steps":[{"key":"KeyR"},{"until":{"next.kind":"gap","next.z":[-2.9,-2.05]}},{"key":"Space"},{"until":{"here":"corner"}},{"key":"ArrowRight"},{"until":{"next.kind":"gap","next.z":[-2.9,-2.05]}},{"key":"Space"},{"until":{"here":"corner"}},{"key":"ArrowLeft"},{"until":{"alive":false},"max":900}],"trace":["distance","speed","made"]}

{"changed":{"runner":{"y":-5.53},"world":{"x":-24,"z":56.17},"next":{"z":0.17},"distance":76.2,"speed":9.9,"made":31}}
until: next.kind == "gap", next.z -2.9 to -2.05 held at frame 97
until: here == "corner" held at frame 188
until: next.kind == "gap", next.z -2.9 to -2.05 held at frame 251
until: here == "corner" held at frame 336
until: alive == false held at frame 513
distance: 19.2 → low 0.1 at frame 1 → 76.2 at frame 513; first changed at frame 1
speed: 8.48 → low 8 at frame 1 → 9.9 at frame 512; first changed at frame 1
made: 16 → low 14 at frame 1 → 31 at frame 476; first changed at frame 1

observe {}

{"runner":{"x":0,"y":-5.53,"z":0},"world":{"x":-24,"z":56.17},"next":{"kind":"stone","x":0,"z":0.17},"here":"gap","distance":76.2,"speed":9.9,"alive":false,"pieces":14,"made":31,"harness":{"frame":653,"renderer":{"calls":13,"triangles":288,"textures":1,"geometries":15,"programs":1},"scene":{"objects":18,"meshes":15,"lights":2,"cameras":0},"errors":[],"changed":{"runner":{"y":[0,-5.53]},"world":{"x":[0,-24],"z":[0,56.17]},"next":{"z":[-4,0.17]},"here":["stone","gap"],"distance":[0,76.2],"speed":[8,9.9],"alive":[true,false],"made":[14,31],"harness":{"renderer":{"calls":[0,13],"triangles":[0,288],"textures":[0,1],"geometries":[0,15],"programs":[0,1]}}}}}
```

The runner cleared two gaps and two corners and fell in the third gap after 76.2 units, by which time the speed had risen from 8 to 9.9. The game had placed 31 pieces of path with the same 14 meshes: the scene held 18 objects before the run and 18 after it, and the last frame made 13 draw calls (`calls`), about one per visible mesh. A pool that leaked would show `objects` growing with `made`.

What paprika3d does not do: it does not tell you whether the run is too hard or fun to replay. Whether speed should rise faster, or gaps come sooner, is your call; the agent changes the numbers when you say so, and replays the same path to show what changed. Frame times measured on this machine, which has no GPU, say nothing about a real one, so this page makes no speed claim. It has no phone, so swipe controls need the device.

## Where to go next

- Keep the longest run between visits: [save the high score](/guides/save-the-high-score).
- Make a jump and a fall feel like something (a squash, a puff of dust, a shake): [make a game feel good](/guides/make-a-game-feel-good).
- Give it sounds for the jump and the fall: [make sound effects for a game](/guides/make-sound-effects-for-a-game).
- New to asking an agent and checking its work: [what changes when an AI agent can see and play its three.js game](/guides/ai-agent-build-threejs-game).
