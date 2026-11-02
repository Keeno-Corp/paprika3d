---
title: How to make a character jump: gravity, platforms and checkpoints in a three.js platformer
phrase: how to make a character jump
description: How to make a character jump in a browser game, for someone who has never made one: an upward speed set by the jump key and pulled down by gravity every frame, landing on top of a platform, a double jump, a short hop when the key is let go early, and checkpoints that catch a fall, on a small three.js platformer you can paste; and how a coding agent with paprika3d presses the keys itself and measures the jump height, the airtime and the respawn.
meta: How to make a character jump in a three.js platformer: gravity, landing on platforms, a double jump and checkpoints, in one HTML file.
intent: make-a-character-jump
queries:
  - "How to make a character jump?"
  - "How can I implement gravity?"
  - "Good 2D Platformer Physics"
  - "how to make a platformer game"
  - "Three.js simple jump"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a character jump: gravity, platforms and checkpoints in a three.js platformer

A jump is two numbers. One is the character's speed upward, which the jump key sets to a fixed value. The other is gravity, which takes a little of that speed away on every frame, so the character slows, stops at the top and comes back down faster and faster. When its feet reach the top of a platform while it is falling, it stands there and the upward speed goes back to zero. Everything a platformer adds (a double jump, a short hop, checkpoints) sits on top of those few lines.

Some words used below. A **frame** is one picture of the game; browsers draw about 60 a second. The **game loop** is the function that runs once per frame: it moves everything a little, then draws. **three.js** is a JavaScript library that draws 3D scenes in a web page. A **platformer** is a game where you run and jump between platforms, seen from the side.

## The jump in four lines

Keep the character's height `y` and its upward speed `vy` (v for velocity, y for up). Then:

1. When the jump key goes down and the character stands on something, set `vy` to the jump speed, here `JUMP = 11`.
2. Every frame, subtract gravity from the speed: `vy -= GRAVITY * dt`, where `dt` is the time since the last frame in seconds.
3. Every frame, move by the speed: `y += vy * dt`.
4. When the character comes down onto a platform, put it on the top and set `vy` to zero.

Multiplying by `dt` makes the jump the same height on a screen that draws 60 frames a second and one that draws 144. The two numbers decide how the jump feels. A bigger `JUMP` goes higher and stays up longer. A bigger `GRAVITY` comes down sooner, which feels snappier; a small one feels floaty, like the Moon. The game below says in a comment how high and how long its jump is with the values it uses, so you can change one and predict the other.

## Landing on a platform without snapping or falling through

Landing is where the first version usually goes wrong. The check in the game below has three conditions, and each one stops a bug you would otherwise see:

- **The character is falling** (`vy` is zero or less). Without it, a cat jumping up through an island from below snaps onto its top on the way up.
- **Its feet were above the top on the last frame and are at or below it now.** Without it, a cat that walks into the side of a higher island pops up onto it. Checking the crossing, and not just "is it below the top", also stops a fast fall from skipping a thin platform between two frames.
- **It is between the platform's left and right edges.** Past an edge it falls, which is how walking off a cliff works for free.

## A double jump and a short hop

A **double jump** is a counter. Landing sets `jumps` to 2, each press of the jump key spends one, and a press with none left does nothing. So the cat can jump once from the ground and once more in the air, and holding the key down does not fly.

A **short hop** comes from letting go. When the key comes up while the cat is still rising, halve its upward speed. A tap gives a small hop and a held key the full jump, which is how most platformers let a player choose the height.

## Checkpoints: falling sends you back

A **checkpoint** is a place the game remembers. Keep one number, the last checkpoint touched, and a list of where each one is. When the character touches a flag further along than the one stored, store it. When the character falls below the world, put it back at the stored flag with no speed, and count the fall.

## The whole game: island hop

An orange cat hops between floating islands to a windmill. The arrow keys or A and D walk, Space jumps, Space again in the air jumps again, and falling off puts the cat back at the last flag it touched. Save it as `index.html` in a new folder, run `npm install three` there (this downloads three.js into the folder), start a small web server in the folder with `python3 -m http.server 8000`, and open `http://localhost:8000` in your browser. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Island hop</title>
<style>html,body{margin:0;overflow:hidden;background:#9fd3f0}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#123;font:600 20px system-ui}</style></head>
<body>
<div id="hud">Checkpoint 0 of 2</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const GRAVITY = 30;   // how fast falling speeds up, in units per second every second
const JUMP = 11;      // the upward speed a jump starts with, in units per second
// Peak height is JUMP * JUMP / (2 * GRAVITY), about 2 units; time in the air is 2 * JUMP / GRAVITY, about 0.73 s.
const RUN = 5;        // walking speed, in units per second
// Floating islands as [left edge, right edge, top]. Checkpoint 0 is the start; flags 1 and 2 stand on islands.
const ISLANDS = [[-3, 3, 0], [5, 8, 1.5], [10, 13, 3.5], [15.5, 18, 2], [21, 24, 4], [27, 29, 6], [31, 36, 5]];
const FLAGS = [[0, 0], [11.5, 3.5], [22.5, 4]];
const MILL = [34, 5];
const held = new Set();
const hud = document.getElementById('hud');
let cat = { x: 0, y: 0, vy: 0 }, grounded = true, jumps = 2, checkpoint = 0, falls = 0, won = false;

function respawn() {
  [cat.x, cat.y] = FLAGS[checkpoint];
  cat.vy = 0;
}

function step(dt) {
  let dir = 0;
  if (held.has('ArrowLeft') || held.has('KeyA')) dir -= 1;
  if (held.has('ArrowRight') || held.has('KeyD')) dir += 1;
  cat.x += dir * RUN * dt;
  const before = cat.y;
  cat.vy -= GRAVITY * dt;              // gravity pulls the speed down every tick
  cat.y += cat.vy * dt;                // and the speed moves the cat
  grounded = false;
  for (const [left, right, top] of ISLANDS) {
    // land only when falling and the feet crossed the top this tick, so a jump from below passes through
    if (cat.vy <= 0 && before >= top && cat.y <= top && cat.x >= left && cat.x <= right) {
      cat.y = top; cat.vy = 0; grounded = true; jumps = 2;
    }
  }
  FLAGS.forEach(([x, y], i) => {
    if (i > checkpoint && Math.abs(cat.x - x) < 0.6 && Math.abs(cat.y - y) < 1) checkpoint = i;
  });
  if (cat.y < -8) { falls++; respawn(); }
  if (grounded && Math.abs(cat.x - MILL[0]) < 1.5 && cat.y === MILL[1]) won = true;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd3f0);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x446644, 2.5));
const mat = (color) => new THREE.MeshStandardMaterial({ color });

for (const [left, right, top] of ISLANDS) {
  const island = new THREE.Group();
  island.name = 'island';
  const grass = new THREE.Mesh(new THREE.BoxGeometry(right - left, 0.5, 2), mat(0x58b04a));
  grass.position.y = -0.25;
  const rock = new THREE.Mesh(new THREE.ConeGeometry((right - left) / 2, 2, 6).rotateX(Math.PI), mat(0x8a6a4a));
  rock.position.y = -1.5;
  island.add(grass, rock);
  island.position.set((left + right) / 2, top, 0);
  scene.add(island);
}
const figure = new THREE.Group();
figure.name = 'cat';
const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.6), mat(0xf29a3a));
body.position.y = 0.3;
const ears = [-0.2, 0.2].map(x => {
  const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 4), mat(0xf29a3a));
  ear.position.set(x + 0.2, 0.72, 0);
  return ear;
});
figure.add(body, ...ears);
scene.add(figure);
const flags = FLAGS.slice(1).map(([x, y]) => {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6), mat(0xdddddd));
  pole.name = 'pole';
  pole.position.set(x, y + 0.8, -0.5);
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.05), mat(0xd04040));
  cloth.position.set(x + 0.3, y + 1.4, -0.5);
  cloth.name = 'flag';
  scene.add(pole, cloth);
  return cloth;
});
const mill = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 3), mat(0xf2e8d0));
mill.name = 'windmill';
mill.position.set(MILL[0], MILL[1] + 1.5, -1);
const blades = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 0.1), mat(0x7a5a3a));
blades.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 0.1), mat(0x7a5a3a)));
blades.name = 'blades';
blades.position.set(MILL[0], MILL[1] + 2.8, -0.4);
scene.add(mill, blades);

let last = null;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;
  step(dt);
  figure.position.set(cat.x, cat.y, 0);
  flags.forEach((f, i) => f.material.color.set(checkpoint > i ? 0x40c040 : 0xd04040));
  blades.rotation.z += dt;
  camera.position.set(cat.x + 2, cat.y + 3, 10);   // the camera follows the cat from the side
  camera.lookAt(cat.x + 2, cat.y + 1, 0);
  hud.textContent = won ? 'You reached the windmill!' : `Checkpoint ${checkpoint} of 2, falls ${falls}`;
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

// One input path for real keys and a test tool's act().
const act = ({ key, down = true, repeat = false }) => {
  if (down) {
    held.add(key);
    if (key === 'Space' && !repeat && jumps > 0) { cat.vy = JUMP; jumps--; }   // two jumps before landing again
  } else {
    held.delete(key);
    if (key === 'Space' && cat.vy > 0) cat.vy *= 0.5;   // let go early for a smaller hop
  }
};
addEventListener('keydown', e => { if (e.code === 'Space') e.preventDefault(); act({ key: e.code, repeat: e.repeat }); });
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('blur', () => held.clear());
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.__game = {
  subject: 'cat',
  describe: () => ({ name: 'island hop', keys: { Space: 'jump; again in the air for a double jump', ArrowRight: 'walk right', ArrowLeft: 'walk left', KeyD: 'as ArrowRight', KeyA: 'as ArrowLeft' } }),
  observe: () => ({ cat: { x: +cat.x.toFixed(2), y: +cat.y.toFixed(2), vy: +cat.vy.toFixed(2) }, grounded, jumps, checkpoint, falls, won }),
  act,
  setState: (s) => {
    if (s.cat) cat = { ...cat, ...s.cat };
    if (s.checkpoint !== undefined) checkpoint = s.checkpoint;
    if (s.falls !== undefined) falls = s.falls;
    if (s.won !== undefined) won = s.won;
  },
};
</script>
</body></html>
```

The `window.__game` object at the end is for testing tools: it lets them read the cat's height and press keys through `act`. The game plays without it.

## What to type to an AI coding agent

An **AI coding agent** (Claude Code, Codex, Cursor and others) is an assistant that writes files on your computer and runs commands, so it can build the folder above for you. A first request that gets a game like this one says what you are, what the keys do, how you win and what happens when you fall:

```text
Make a three.js platformer in one index.html, seen from the side.
An orange cat hops between floating islands to a windmill.
Arrow keys walk, Space jumps, Space again in the air is a double jump,
and letting go of Space early makes a smaller hop.
Two flags are checkpoints; falling off puts the cat back at the last flag touched.
Put the jump speed and gravity as numbers at the top so I can change them.
```

The last line matters: once the numbers are named, "jump higher" or "less floaty" is a one-number change you can make yourself. [The AI prompt to make a game](/guides/ai-prompt-to-make-a-game) covers what else a request should say.

## When the jump breaks

- **The jump height changes from one computer to another.** The speed or gravity is not multiplied by `dt`, so a faster screen jumps more often per second.
- **Holding Space flies.** The jump runs on every `keydown`, and a held key repeats. Ignore repeated presses (`e.repeat`) and keep the jumps counter.
- **The cat sinks into the platform or jitters on it.** The landing sets `vy` to zero but not `y` to the top, or it does it before moving.
- **It snaps onto an island from below or from the side.** The landing check is missing the falling or the crossing condition above.
- **It falls through the ground after the tab was hidden.** One huge `dt` after a pause moves it past everything; cap `dt` at 0.1 s, as the game does.

## Let the agent play the jump itself

Jumps are hard to check by watching: "it jumps" leaves out how high, for how long, and whether it lands where it should. paprika3d is a plugin for Claude Code (and an MCP server for other coding agents) that lets the agent open the page in a headless Chrome (a browser with no window), press the keys for an exact number of frames, each 1/60 s of game time, and read the numbers back. Install it in Claude Code with:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

These replies were captured on 2026-10-30 on the game above, on a Linux server with no GPU. `interact` holds Space, and its `trace` follows the cat's height on every frame:

```text
interact {"steps":[{"key":"Space","frames":60}],"trace":["cat.y"]}

{"after":{"cat":{"x":0,"y":0,"vy":0},"grounded":true,"jumps":2,"checkpoint":0,"falls":0,"won":false},"changed":{}}
Motion (cat): travelled 3.68 units (0.175 from start to end), it stopped at frame 43 and did not move again.
cat.y: 0 → peak 1.93 at frame 21 → 0 at frame 43; first changed at frame 1

interact {"steps":[{"key":"Space","frames":4},{"wait":40}],"trace":["cat.y"]}

{"after":{"cat":{"x":0,"y":0,"vy":0},"grounded":true,"jumps":2,"checkpoint":0,"falls":0,"won":false},"changed":{}}
cat.y: 0 → peak 0.95 at frame 12 → 0 at frame 28; first changed at frame 1

interact {"steps":[{"key":"Space","frames":20},{"key":"Space","frames":20},{"until":{"grounded":true}}],"trace":["cat.y","jumps"]}

{"after":{"cat":{"x":0,"y":0,"vy":0},"grounded":true,"jumps":2,"checkpoint":0,"falls":0,"won":false},"changed":{}}
until: grounded == true held at frame 71
cat.y: 0 → peak 3.83 at frame 40 → 0 at frame 71; first changed at frame 1
jumps: 2 → low 0 at frame 21 → 2 at frame 71; first changed at frame 1
```

The held jump peaks at 1.93 units and is back on the ground at frame 43, close to what the comment in the code predicts. The tap peaks at 0.95, about half, so the short hop works. The double jump reaches 3.83 and spends both jumps, and landing gives them back. Then a run and jump from the first island to the second, where `{ until }` stops on the frame the cat stands again, and a fall from the second flag, started there with a `{ state }` step so the agent does not have to play the level to reach it:

```text
interact {"steps":[{"state":{"cat":{"x":2.5}}},{"key":"ArrowRight","down":true,"frames":0},{"key":"Space","frames":20},{"until":{"grounded":true},"max":120},{"key":"ArrowRight","down":false}],"trace":["cat.x","cat.y"]}

{"changed":{"cat":{"x":5.08,"y":1.5}}}
until: grounded == true held at frame 31
cat.x: 2.5 → 5.08 at frame 31; first changed at frame 1
cat.y: 0 → peak 1.92 at frame 20 → 1.5 at frame 31; first changed at frame 1

interact {"steps":[{"state":{"cat":{"x":22,"y":4,"vy":0},"checkpoint":2,"falls":0}},{"key":"ArrowLeft","down":true},{"until":{"falls":1},"max":200},{"key":"ArrowLeft","down":false}],"trace":["cat.y"],"expect":{"checkpoint":2,"cat.y":4}}

{"changed":{"cat":{"x":22.5,"y":4},"checkpoint":2,"falls":1}}
until: falls == 1 held at frame 66
cat.y: 4 → low -7.92 at frame 65 → 4 at frame 66; first changed at frame 13
Expect: checkpoint 2 ✓ · cat.y 4 ✓
```

The cat landed at x 5.08 on an island whose left edge is 5, so that gap is about as wide as a full jump reaches: worth knowing before you add a wider one. The fall went down to -7.92, then the cat stood again at the second flag. `look` with a `sheet` puts the start, both flags and the windmill in one picture, each a fresh reload set up with its own state, and lists what is on screen in each:

```text
look {"sheet":[{"label":"start"},{"label":"flag 1","state":{"cat":{"x":11.5,"y":3.5},"checkpoint":1}},{"label":"flag 2","state":{"cat":{"x":22.5,"y":4},"checkpoint":2}},{"label":"windmill","state":{"cat":{"x":34,"y":5},"checkpoint":2},"frames":2}]}

start: subject cat 0.46%; on screen: island ×5, cat ×3; pixels: brightness 74%, colour saturation 37%, 0% near black, 0% blown out
flag 1: subject cat 0.46%; on screen: island ×8, cat ×3, flag, pole; pixels: brightness 75%, colour saturation 36%, 0% near black, 0% blown out
flag 2: subject cat 0.46%; on screen: island ×8, cat ×3, flag, pole; pixels: brightness 75%, colour saturation 36%, 0% near black, 0% blown out
windmill: subject cat 0.46%; on screen: island ×4, windmill, blades ×2, cat ×3; left the view: pole, flag; pixels: brightness 75%, colour saturation 36%, 0% near black, 0% blown out
```

(The reply also names the picture's file and has one line of lighting advice, left out here.) What paprika3d does not do: it does not tell you whether the jump feels good. Whether 1.93 units is too low or the fall too fast is your call; the agent changes the number when you say so. It has no gamepad and no phone, so a jump on a controller or a touch button needs the device.

## Where to go next

- A character that walks over slopes, steps and uneven ground, with a camera behind it, is a physics engine's job: [the three.js third-person character controller](/guides/threejs-third-person-character-controller) builds one on Rapier and measures its jump the same way.
- More levels after the windmill: [make levels in a game](/guides/make-levels-in-a-game) keeps each level as data and loads the next at the exit.
- A jump that squashes on landing and puffs dust: [make a game feel good](/guides/make-a-game-feel-good).
- Jumping over gaps in a world that never ends: [how to make an endless runner game](/guides/make-an-endless-runner).
- New to the whole loop of asking an agent and checking its work: [what changes when an AI agent can see and play its three.js game](/guides/ai-agent-build-threejs-game).
- Ramps, a rail and tricks on a board: [how to make a skateboarding game](/guides/make-a-skateboarding-game).
