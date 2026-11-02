---
title: How to make a flappy bird game in three.js: a flap, gravity and gaps
phrase: how to make a flappy bird game
description: How to make a flappy bird game, and how its flap and fall work: gravity lowers the bird's speed every frame, a tap sets the speed to one upward value, obstacles slide past and are reused, a point when one is passed, a crash on a touch. Shown on a small three.js game of a puffin flying between sea stacks, with an AI coding agent tracing the flap curve, catching a flap that adds speed and finding the frame of a crash with paprika3d.
meta: How to make a flappy bird game in three.js: a tap sets the speed, gravity pulls it down, obstacles slide past with a gap. A small game to paste.
intent: make-a-flappy-bird-game
queries:
  - "how to make a flappy bird game"
  - "how to make a game like flappy bird"
  - "Can someone explain Flappy Bird's physics to me?"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a flappy bird game in three.js: a flap, gravity and gaps

A Flappy Bird game is three rules running together. Gravity pulls the bird down a little more every frame. A tap sets the bird's upward speed to one fixed number, whatever it was doing before. Obstacles with a gap slide toward the bird, and touching one ends the round. Everything else (the score, the restart, the look) sits on top of those three, so a working copy fits in one short file.

"Can someone explain Flappy Bird's physics to me?" is a question with more than 12,000 views on a game development forum, and the answer is short: the bird has a height and a vertical speed. Each frame (one picture of the game; a browser draws about 60 a second), gravity takes a bit off the speed, then the speed moves the height. A flap replaces the speed with a fixed upward value. That gives the arc you know: a quick rise that slows, a moment at the top, then a fall that gets faster until the next tap.

## The parts, in plain words

1. **Height and speed.** Two numbers, `y` and `vy` (vertical velocity, the speed up or down). Up is positive.
2. **Gravity.** Every frame, `vy -= GRAVITY * dt`, where `dt` is the time since the last frame in seconds. Then `y += vy * dt`. Multiplying by `dt` keeps the fall the same on a fast screen and a slow one.
3. **The flap.** On a tap, `vy = FLAP`. It sets the speed rather than adding to it. Adding makes three quick taps throw the bird off the top of the screen, which the checks further down catch.
4. **The obstacles.** Pairs of blocks, one from the bottom and one from the top, with an opening between them. They move left at a steady speed. The bird never moves sideways; the world moves past it.
5. **Reuse.** When a pair leaves the screen on the left, it moves back to the right end of the line with a new opening height. Four pairs make an endless course. [How to make an endless runner](/guides/make-an-endless-runner) goes further into a world that moves while the player stays.
6. **Score and crash.** A point when a pair's middle passes the bird. A crash when the bird overlaps a block, the sea or the sky's edge.

## The game: puffin gaps

A puffin flies between sea stacks, seen from the side in 3D. Space, a click or a tap flaps; after a crash, the same key starts again. three.js, a JavaScript library that draws 3D in a web page, draws it, and the whole game is one HTML file. The import map line near the top tells the browser where three.js is (a `node_modules/three` folder next to the file, which `npm install three` makes); [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains the other parts of such a page and how to open it.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Puffin gaps</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}#hud{position:fixed;top:16px;left:20px;font:600 22px system-ui;color:#fff;text-shadow:0 2px 4px #0006}</style></head>
<body>
<div id="hud">0</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const GRAVITY = 18;     // pulls the puffin down, in units per second, every second
const FLAP = 6;         // a flap sets the upward speed to this; it does not add to it
const SPEED = 2.5;      // how fast the stacks slide left, in units per second
const GAP = 2.6;        // the height of the opening between two stacks
const SPACING = 4.5;    // the distance from one pair of stacks to the next

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd4f0);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3.5, 10);
camera.lookAt(0, 3.5, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x406080, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(-3, 8, 6);
scene.add(sun);

const sea = new THREE.Mesh(new THREE.BoxGeometry(80, 1, 60), new THREE.MeshStandardMaterial({ color: 0x2a6fa8 }));
sea.name = 'sea';
sea.position.set(0, -0.5, -25);
scene.add(sea);

const puffin = new THREE.Group();
puffin.name = 'puffin';
const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), new THREE.MeshStandardMaterial({ color: 0x222222 }));
const face = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 10), new THREE.MeshStandardMaterial({ color: 0xffffff }));
face.position.set(0.15, 0.08, 0.12);
const beak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 12), new THREE.MeshStandardMaterial({ color: 0xff7a1a }));
beak.rotation.z = -Math.PI / 2;
beak.position.set(0.38, 0.05, 0);
puffin.add(body, face, beak);
puffin.position.x = -2;
scene.add(puffin);

// Four pairs of rock stacks, moved back to the right when they leave the screen on the left.
const rock = new THREE.MeshStandardMaterial({ color: 0x8a7a6a });
const stacks = [];
for (let i = 0; i < 4; i++) {
  const low = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), rock);
  const high = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), rock);
  low.name = high.name = 'stack';
  scene.add(low, high);
  stacks.push({ low, high, x: 0, gapY: 0, passed: false });
}
function placeStack(s, x) {
  s.x = x;
  s.gapY = 2 + Math.random() * 3;          // the middle of the opening, between 2 and 5
  s.passed = false;
  const bottom = s.gapY - GAP / 2, top = s.gapY + GAP / 2;
  s.low.scale.y = bottom;
  s.low.position.y = bottom / 2;
  s.high.scale.y = 9 - top;
  s.high.position.y = (9 + top) / 2;
}

const hud = document.getElementById('hud');
let y, vy, score, alive;
function reset() {
  y = 3.5; vy = 0; score = 0; alive = true;
  stacks.forEach((s, i) => placeStack(s, 4 + i * SPACING));
  hud.textContent = '0';
}

function flap() {
  if (alive) vy = FLAP;
  else reset();
}
function act({ key, down = true }) { if (down && key === 'Space') flap(); }
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.code }); });
addEventListener('pointerdown', flap);

function step(dt) {
  if (!alive) return;
  vy -= GRAVITY * dt;
  y += vy * dt;
  for (const s of stacks) {
    s.x -= SPEED * dt;
    if (s.x < -9) placeStack(s, Math.max(...stacks.map(o => o.x)) + SPACING);
    if (!s.passed && s.x < puffin.position.x) { s.passed = true; score++; hud.textContent = String(score); }
    // 0.25 is the puffin's hit size, a little smaller than its drawn body (0.3), so a near miss stays a miss
    const inside = Math.abs(s.x - puffin.position.x) < 0.5 + 0.25;
    if (inside && (y - 0.25 < s.gapY - GAP / 2 || y + 0.25 > s.gapY + GAP / 2)) crash();
  }
  if (y < 0.25 || y > 8) crash();
}
function crash() { alive = false; hud.textContent = `Score ${score}. Space to try again`; }

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
reset();
let last = null;
renderer.setAnimationLoop((now) => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  puffin.position.y = y;
  puffin.rotation.z = Math.max(-1, Math.min(0.5, vy * 0.08));   // nose up on a flap, down in a fall
  for (const s of stacks) { s.low.position.x = s.x; s.high.position.x = s.x; }
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'puffin gaps', units: 'units', keys: { Space: 'flap' } }),
  observe: () => {
    const s = stacks.filter(s => s.x > puffin.position.x - 0.75).sort((a, b) => a.x - b.x)[0];   // the stack beside or ahead
    return { puffin: { y: +y.toFixed(2), vy: +vy.toFixed(2) }, stack: { x: +s.x.toFixed(2), gapY: +s.gapY.toFixed(2) }, score, alive };
  },
  act,
  setState: (s) => { if (s.puffin) { y = s.puffin.y ?? y; vy = s.puffin.vy ?? vy; } if (s.alive !== undefined) alive = s.alive; },
  subject: 'puffin',
};
</script>
</body></html>
```

The numbers at the top are the whole feel of the game. `GRAVITY` and `FLAP` together set how high a flap goes and how long it lasts; `SPEED`, `GAP` and `SPACING` set how hard the course is. The `step` function is the game loop's work: the loop is the function the browser calls before every frame, and here it runs the gravity, moves the stacks, counts points and checks for a crash. The hit size of the puffin is a little smaller than its drawn body, so passing a rock by a hair counts as a miss, which players read as fair.

## When it does not work

- **The bird shoots off the top.** The flap adds to the speed (`vy += FLAP`) instead of setting it.
- **The fall is fast on one computer and slow on another.** Gravity is applied per frame without `dt`, so a screen that draws more frames a second makes the bird fall faster.
- **It dies before touching anything.** The hit test is bigger than what is drawn, or it uses the stack's height where it should use the opening's edges. Draw the hit size or log the numbers at the moment of the crash.
- **A gap cannot be flown through.** The opening is smaller than the height a flap can recover, or two openings in a row are too far apart in height for the time between them. Make `GAP` larger or limit how much the next opening's height may change.
- **Nothing happens on a key press.** The page listens for the key on the wrong element, or the game reads `e.key` (a space character) and compares it with `'Space'`. Listen on `window` and compare `e.code`.

[My HTML game is not working](/guides/html-game-not-working) covers the blank page and the browser console for any small game.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes and edits the files of your project) can write this game from one message. Name the rules, because they are what makes it play right:

```text
Make a Flappy Bird style game in one HTML file with three.js, seen from the side in 3D.
A puffin flies between pairs of sea stacks with a gap between them.
Space, a click or a tap sets the puffin's upward speed to a fixed value (set, not add);
gravity lowers that speed every frame, scaled by the frame's time in seconds.
The stacks slide left at a steady speed; when a pair leaves the screen, move it to the
right end with a new random gap height. One point per pair passed. Touching a stack,
the sea or the top ends the round; the same key restarts. Show the score at the top left.
```

[Can I make a game with ChatGPT](/guides/can-i-make-a-game-with-chatgpt) and [how to build a three.js game with an AI agent](/guides/ai-agent-build-threejs-game) say what to do with the file the agent writes and how to ask for changes.

## Let the agent play it and read the curve

An agent writes the code, but it cannot see the game run, so a flap that adds or a crash that comes too early shows up when you play it and describe what went wrong. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can look at it and play it itself. Its `interact` tool presses keys on exact frames, and its `trace` option writes down a value every frame. One tap of Space, then 45 frames of falling:

```text
interact {"steps": [{"key": "Space", "frames": 1}, {"wait": 45}], "trace": ["puffin.y"]}

{"changed":{"puffin":{"y":2.7,"vy":-7.8},"stack":{"x":2.08}}}
puffin.y: 3.5 → peak 4.45 at frame 19 → 2.7 at frame 46; first changed at frame 1
```

That line is the flap curve the forum question asks about: a rise of about one unit, the top at frame 19, then a fall that has passed the starting height by the end. Three taps four frames apart should give a higher arc, not a launch:

```text
interact {"steps": [{"key": "Space", "frames": 1}, {"wait": 4}, {"key": "Space", "frames": 1}, {"wait": 4}, {"key": "Space", "frames": 1}, {"wait": 45}], "trace": ["puffin.y"]}

{"changed":{"puffin":{"y":3.55,"vy":-7.8},"stack":{"x":1.67}}}
puffin.y: 3.5 → peak 5.3 at frame 29 → 3.55 at frame 56; first changed at frame 1
```

The same three taps on a first version whose flap was `vy += FLAP`:

```text
{"changed":{"puffin":{"y":8.04,"vy":10.2},"stack":{"x":2.92},"alive":false}}
puffin.y: 3.5 → 8.04 at frame 26; first changed at frame 1
```

No peak: the puffin was still rising at frame 26 when it left the top and crashed. The agent reads that, changes `+=` to `=`, and plays again.

The `until` step keeps playing until the game's state matches. Here the puffin flaps, waits 39 frames and flaps again, three times, then keeps going until it crashes, and `observe` then reads the whole state:

```text
interact {"steps": [{"key": "Space", "frames": 1}, {"wait": 39}, {"key": "Space", "frames": 1}, {"wait": 39}, {"key": "Space", "frames": 1}, {"wait": 39}, {"key": "Space", "frames": 1}, {"until": {"alive": false}, "max": 300}], "trace": ["puffin.y", "score"]}

{"changed":{"puffin":{"y":3,"vy":-6.3},"stack":{"x":-2.71},"score":1,"alive":false}}
until: alive == false held at frame 161
puffin.y: 3.5 → peak 4.45 at frame 19 → 3 at frame 161; first changed at frame 1
score: 0 → 1 at frame 145; first changed at frame 145

observe {}

{"puffin":{"y":3,"vy":-6.3},"stack":{"x":-2.71,"gapY":4.11},"score":1,"alive":false,"harness":{"frame":161,"renderer":{"calls":10,"triangles":916,"textures":1,"geometries":10,"programs":1},"scene":{"objects":15,"meshes":12,"lights":2,"cameras":0},"errors":[],"changed":null}}
```

The puffin scored the first pair at frame 145 and crashed into the same pair 16 frames later. The numbers say why, and that the crash is fair: the opening runs from 2.81 to 5.41 (its middle, 4.11, plus and minus half of `GAP`), the puffin's bottom was at 2.75, and the stack at -2.71 was still beside the puffin at -2. It sank under the edge before its tail cleared the rock. A crash with the puffin well inside the opening would have pointed at the hit test instead.

The `feel` tool lists what reacts on screen to an event. Here the puffin is set just above the sea, falling:

```text
feel {"steps": [{"state": {"puffin": {"y": 0.6, "vy": -4}}}, {"wait": 10}]}

Watched the steps' 10 frames and 45 frames after them, counted from the first step.
Moved during the steps: puffin 0.34 units, puffin 0.35 units, puffin 0.37 units, stack 0.17 units, stack 0.17 units, ….
Smooth moves (a new position on 3+ consecutive frames): 11 (puffin, stack).
No change in: camera (no shake), scale (no pops), teleports, colour (no flashes), spawns, removals.
HUD text: changed in one frame.
Sounds started: 0.
State: puffin.y 0.53 → 0.19, puffin.vy -4.3 → -5.5, stack.x 3.96 → 3.79, alive true → false.
```

The score text is the one thing that changes when the round ends. A shake, a flash or a splash would tell the player at once; [how to make a game feel good](/guides/make-a-game-feel-good) shows how to add them and check them with the same tool.

These replies were captured on 2026-10-31 on a machine with no graphics card, where Chrome draws in software. paprika3d does not decide whether the gaps are too hard or the game is fun; it reports what happened, frame by frame, and you or the agent decide what to change. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

[How to test a three.js game with Claude Code](/guides/test-threejs-game-claude-code) shows how to keep such a play as a check that runs again after every edit.

## Next steps

- End the round with a proper screen and a restart button: [how to add a game over screen](/guides/add-a-game-over-screen).
- Keep the high score between visits: [how to save the high score](/guides/save-the-high-score).
- A flap sound and a crash sound, made in code: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Narrow the gaps as the score rises: [how to make a game more fun](/guides/make-a-game-more-fun).
- Play it on a phone with a tap: [how to make a mobile game with AI](/guides/make-a-mobile-game-with-ai).
- A jump on the ground with platforms instead of a flap in the air: [how to make a character jump](/guides/make-a-character-jump).
- Share it: [how to put your game online](/guides/put-your-game-online).
