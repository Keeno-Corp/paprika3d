---
title: How to make a dice game in three.js: physics dice and the face on top
phrase: how to make a dice game
description: How to make a dice game for a first-time game maker: when a random number is all the dice you need, how to throw 3D dice that tumble on a table with the Rapier physics engine, and how to read which face landed on top from each die's rotation, in a small three.js game of pig against the computer; what goes wrong (the game counting a number the die does not show, reading a die that is still rolling or leaning), and how an AI agent with paprika3d rolls the dice and checks the number it reads against the number drawn.
meta: How to make a dice game in three.js: throw physics dice with Rapier, read the face on top from the rotation, and play pig against the computer.
intent: make-a-dice-game
queries:
  - "how to make a dice game"
  - "how to make a dice game in javascript"
  - "How can I get which side landed on top in an octahedron dice?"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make a dice game in three.js: physics dice and the face on top

A dice game is two things: rules about numbers, and dice that give the numbers. The rules are the game. The dice can be as plain as one line of JavaScript, `Math.floor(Math.random() * 6) + 1`, which picks a whole number from 1 to 6, each as likely as the others: that is a fair die, with nothing to see. Dice you can watch tumble across a table are for the moment of the throw, and they bring one new problem, the one people ask about on forums: once a 3D die stops, **which side is on top?**

This page answers that and builds a small complete dice game around it, in one HTML file. It uses three.js (a free JavaScript library that draws 3D in a web page) to draw, and Rapier, a physics engine (a library that works out how solid objects fall, bounce and come to rest), to throw. [How to make a physics game](/guides/make-a-physics-game) explains what a physics engine is and how it pairs with three.js; here it just throws the dice.

## The game: pig

Pig is a dice game that needs no board and has one hard decision in it:

- On your turn, roll two dice as often as you like. Each roll adds the two numbers to your turn's total.
- If either die shows a 1, the turn ends and its total is lost.
- Press H to hold instead: the turn's total goes onto your score and the turn passes.
- The first to 50 wins. Here you play the computer, which keeps rolling until its turn is worth 15, then holds.

Every roll is a choice between "one more" and "bank it", which is what makes such a small game worth playing.

## Two ways to make a die

1. **Pick the number, then show it.** Choose 1 to 6 with a random number and turn a die model to show that face, perhaps with a short spin first. Fair by construction, and the rules never depend on the physics.
2. **Throw a physics die and read where it lands.** Give each die a random spin and push, let the engine roll it, and read the number once it stops. It looks and feels like real dice, and the number really comes from the throw.

Both are fine. This page does the second, because reading the face is the part people get stuck on.

## How to read the face on top

A die has six sides, and each side faces one direction when the die sits unturned: right, left, up, down, toward you, away from you. Write down which number is painted on each, in one list. When the die stops, turn each of those six directions by the die's rotation (three.js does this with `applyQuaternion`, a quaternion being the four numbers that store a rotation) and look at how high each one now points. The direction that points highest is the side on top, and the list gives its number.

Two rules make it reliable. Wait until both dice have stopped moving for a moment before reading them, not while they wobble. And if the side on top is still tilted (its direction points less than nearly straight up), the die is leaning on a wall or on the other die: roll it again, as a person at a table would.

The same method works for any die. An eight-sided die, an octahedron, has eight sides, so its list has eight directions and eight numbers; the side whose direction points highest is the one on top.

## The first request to type

If you build with an AI coding agent (an assistant such as Claude Code that writes and edits the files in a project folder for you), a request like this asks for the game below:

```text
Make a dice game of pig in one index.html with three.js and the Rapier physics engine,
both from a CDN with an import map. Two dice tumble in a wooden tray: Space rolls, H holds.
A 1 on either die loses the turn's points; first to 50 wins, against a computer that
holds at 15. Read each die's top face from its rotation, using one list of side
numbers for both painting the dice and reading them. Wait until both dice are still
before reading, and roll again when a die is leaning. Show both scores and the turn total.
```

## The game

Here is a page of the kind that request asks for, written and tested for this guide. Save it as `index.html` and open it from a local web server, as [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) shows; three.js and Rapier come from a CDN, a public server that hosts code libraries, so there is nothing to install.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Pig</title>
<style>html,body{margin:0;overflow:hidden;background:#1d2b22}canvas{display:block}
#hud{position:fixed;top:14px;left:0;right:0;text-align:center;font:600 21px system-ui;color:#fff;pointer-events:none;white-space:pre}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{
  "three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js",
  "@dimforge/rapier3d-compat":"https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/dist/rapier.mjs"}}</script>
<script type="module">
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

await RAPIER.init();
const GOAL = 50, CPU_HOLDS_AT = 15;
// The number on each side of a die, in the order BoxGeometry lists its sides: +x, -x, +y, -y, +z, -z.
// Opposite sides add up to 7. Drawing and reading both use this one list, so they cannot disagree.
const FACES = [2, 5, 1, 6, 3, 4];
const NORMALS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(n => new THREE.Vector3(...n));

// Physics: a tray (floor and four walls) and two dice.
const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
const box = (hx, hy, hz, x, y, z) => world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz).setTranslation(x, y, z).setFriction(0.8).setRestitution(0.3));
box(4.5, 0.25, 3.5, 0, -0.25, 0);
box(0.25, 1, 3.5, -4.75, 1, 0); box(0.25, 1, 3.5, 4.75, 1, 0);
box(4.5, 1, 0.25, 0, 1, -3.75); box(4.5, 1, 0.25, 0, 1, 3.75);
const dice = [0, 1].map(i => {
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(i * 1.6 - 0.8, 0.5, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setFriction(0.6).setRestitution(0.3), body);
  return body;
});

// Which side is up: turn each side's direction by the die's rotation and take the one pointing highest.
function topFace(body) {
  const r = body.rotation(), q = new THREE.Quaternion(r.x, r.y, r.z, r.w);
  let side = 0, height = -2;
  NORMALS.forEach((n, i) => { const y = n.clone().applyQuaternion(q).y; if (y > height) { height = y; side = i; } });
  return { face: FACES[side], flat: height > 0.9 };   // not flat: leaning on a wall or on the other die
}

let scores = { you: 0, cpu: 0 }, who = 'you', turn = 0, values = [1, 1], rolling = false, still = 0, wait = 0, message = 'Space: roll   H: hold';

function roll() {
  if (rolling || winner()) return;
  dice.forEach((body, i) => {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3));
    body.setTranslation({ x: i * 1.6 - 0.8, y: 2.5, z: 2.5 }, true);
    body.setRotation(q, true);
    body.setLinvel({ x: (Math.random() - 0.5) * 4, y: 0, z: -3 - Math.random() * 3 }, true);
    body.setAngvel({ x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20, z: (Math.random() - 0.5) * 20 }, true);
  });
  rolling = true; still = 0;
}

function settled() {                    // both dice have come to rest: read them and apply the rules
  const tops = dice.map(topFace);
  if (tops.some(t => !t.flat)) { message = 'A die is leaning: rolling again'; rolling = false; return roll(); }
  values = tops.map(t => t.face);
  rolling = false;
  if (values.includes(1)) { message = `${name()} rolled a 1: this turn scores nothing`; turn = 0; pass(); }
  else { turn += values[0] + values[1]; message = `${name()} rolled ${values[0]} + ${values[1]}`; if (scores[who] + turn >= GOAL) hold(); }
}

function hold() {
  if (rolling || winner() || turn === 0) return;
  scores[who] += turn;
  message = `${name()} banked ${turn}`;
  turn = 0;
  if (!winner()) pass();
}
const pass = () => { who = who === 'you' ? 'cpu' : 'you'; wait = 0; };
const name = () => who === 'you' ? 'You' : 'The computer';
const winner = () => scores.you >= GOAL ? 'you' : scores.cpu >= GOAL ? 'cpu' : null;

function tick() {                       // one step of 1/60 s
  world.step();
  if (rolling) {
    const moving = dice.some(b => Math.hypot(...Object.values(b.linvel())) + Math.hypot(...Object.values(b.angvel())) > 0.05);
    still = moving ? 0 : still + 1;
    if (still >= 15) settled();
  } else if (who === 'cpu' && !winner() && ++wait > 45) {   // the computer rolls until its turn is worth 15, then holds
    wait = 0;
    if (turn >= CPU_HOLDS_AT) hold(); else roll();
  }
}

addEventListener('keydown', e => {
  if (e.repeat) return;
  if (winner() && e.code === 'Space') return restart();
  if (who !== 'you') return;
  if (e.code === 'Space') roll();
  if (e.code === 'KeyH') hold();
});
function restart() { scores = { you: 0, cpu: 0 }; who = 'you'; turn = 0; message = 'Space: roll   H: hold'; }

// Drawing: a felt tray, wooden walls and two dice with pips painted on a canvas.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1d2b22);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 10, 7);
camera.lookAt(0, 0, 0.5);
scene.add(new THREE.HemisphereLight(0xffffff, 0x334433, 1.5));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-3, 10, 4);
scene.add(sun);
const mesh = (w, h, d, color, name, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color }));
  m.name = name; m.position.set(x, y, z); scene.add(m); return m;
};
mesh(9, 0.5, 7, 0x2e7d4f, 'felt', 0, -0.25, 0);
mesh(0.5, 2, 7, 0x7a4b2a, 'wall', -4.75, 1, 0); mesh(0.5, 2, 7, 0x7a4b2a, 'wall', 4.75, 1, 0);
mesh(10, 2, 0.5, 0x7a4b2a, 'wall', 0, 1, -3.75); mesh(10, 0.6, 0.5, 0x7a4b2a, 'wall', 0, 0.3, 3.75);

const PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]], 6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]] };
function side(n) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f4efe6'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = n === 1 ? '#c0282d' : '#222';
  for (const [i, j] of PIPS[n]) { g.beginPath(); g.arc(28 + i * 36, 28 + j * 36, 12, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.4, name: String(n) });
}
const sides = FACES.map(side);
const dieMeshes = dice.map((b, i) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), sides);
  m.name = `die ${i + 1}`;
  scene.add(m);
  return m;
});
const hud = document.getElementById('hud');

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

let then = null, owed = 0;
renderer.setAnimationLoop(now => {
  owed += then === null ? 1 / 60 : Math.min((now - then) / 1000, 0.1);
  then = now;
  while (owed >= 1 / 60 - 1e-6) { tick(); owed -= 1 / 60; }
  dice.forEach((b, i) => { dieMeshes[i].position.copy(b.translation()); dieMeshes[i].quaternion.copy(b.rotation()); });
  const w = winner();
  hud.textContent = `You ${scores.you}   Computer ${scores.cpu}   This turn ${turn}\n`
    + (w ? `${w === 'you' ? 'You win' : 'The computer wins'}! Space to play again` : message);
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'pig', keys: { Space: 'roll the dice', KeyH: 'hold: bank this turn\'s points' }, rules: `a 1 on either die loses the turn; first to ${GOAL}` }),
  observe: () => ({ scores: { ...scores }, who, turn, dice: values, rolling, winner: winner() }),
  act: ({ action }) => { if (action === 'roll') roll(); if (action === 'hold') hold(); },
  setState: (s) => { if (s.scores) scores = { ...scores, ...s.scores }; if (s.who) who = s.who; if (s.turn !== undefined) turn = s.turn; },
  subject: 'die 1',
};
</script>
</body></html>
```

The parts to recognise:

- `FACES` is the one list: the number on each side, in the order three.js's `BoxGeometry` gives its sides (right, left, top, bottom, front, back). The pips are painted from it, and `topFace` reads from it.
- `topFace` is the method above in a few lines: it turns each side's direction by the die's rotation, keeps the highest, and says whether it points nearly straight up (`flat`).
- `roll` puts each die back above the tray with a random rotation, push and spin. The tray's walls keep the dice in view.
- `tick` steps the physics once per 1/60 s and counts frames in which neither die moves; after 15 of them, `settled` reads the dice and applies the rules: a 1 ends the turn with nothing, anything else adds to it.
- `hold` banks the turn, and the computer's turn is two lines at the end of `tick`.

## When it breaks

- **The game counts a different number from the one on the die.** The pips were painted from one list and read with another, or the list is in a different order from the sides of the box. Keep one list and use it for both.
- **The score changes while the dice are still rolling.** The number was read the moment the roll began, or on the first frame a die touched the table. Wait until both are still.
- **A roll that stops with a die on its edge counts as a number.** That die is leaning on something. Check that the top side really points up and roll again if not.
- **The dice fly out of the table or sink into it.** The table or the walls have no collider, or the colliders are the wrong size; physics box sizes are given as half sizes, from the centre out, which [how to make a physics game](/guides/make-a-physics-game) covers.
- **The dice never quite stop,** so the turn never ends. Use a small speed threshold, as `tick` does, instead of waiting for exactly zero.

## Let the agent roll and check

A wrong number is easy to miss: the dice look right, the score looks plausible, and the bug shows up three turns later as "the game cheated". paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser on a paused clock, so the agent can roll, wait for the dice to stop and read both the game's numbers and the dice in the scene. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The replies below were captured on 2026-11-01 on the game above, on a server with no graphics card where Chrome draws in software. `interact` presses Space and its `until` step plays frame by frame until the game says the dice have stopped:

```text
interact {"steps":[{"key":"Space"},{"until":{"rolling":false}}]}

{"changed":{"turn":9,"dice":[4,5]}}
Motion (die 1): travelled 6.73 units (5.37 from start to end), its direction of travel turned 111° left.
until: rolling == false held at frame 145
```

A 4 and a 5, so the turn is worth 9, read on frame 145. To check that the number the game read is the number on the dice, `eval` runs a few lines inside the page that ignore the game's list altogether: for each die in the scene it finds the side pointing highest and reads the name of the material painted on it (each side's material is named after its number):

```text
eval {"code":"const sides = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];\nconst painted = [\"die 1\", \"die 2\"].map(name => {\n  const die = find(name);\n  const heights = sides.map(s => new THREE.Vector3(...s).applyQuaternion(die.quaternion).y);\n  return die.material[heights.indexOf(Math.max(...heights))].name;\n});\nreturn { painted, game: window.__game.observe().dice };"}

{"painted":["4","5"],"game":[4,5]}
```

They agree. On a copy of the game changed to paint the dice from `FACES` but read them from a second list, `[1, 2, 3, 4, 5, 6]`, the same check on the same two rolls answered:

```text
{"painted":["4","5"],"game":[6,2]}
{"painted":["6","2"],"game":[4,1]}
```

The second roll ended the turn for a 1 that neither die showed. The two versions threw exactly the same dice because the harness seeds `Math.random`, so the same steps give the same throw every time; that is what lets the agent compare a broken version with a fixed one on the same roll. When the plugin is installed, its `threejs-game` skill can also build a game like this on game-state, its small state library, which runs Rapier's deterministic build in a worker and gives the game a seeded `state.random()`.

paprika3d does not decide whether your dice game is fair or fun. The face check above is a few lines the agent writes for this game, not a built-in test; a game with different dice needs its own version. And the headless browser plays no sound, so the clatter of the dice is yours to listen for.

## What to do next

- A clatter when the dice land and a bounce on the score: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game) and [how to make a game feel good](/guides/make-a-game-feel-good).
- A win screen and a button to play again: [how to add a game over screen](/guides/add-a-game-over-screen).
- Another game built on Rapier, with a ring the ball must pass through: [how to make a basketball game](/guides/make-a-basketball-game).
- A computer opponent that looks ahead instead of following one rule: [how to make a tic tac toe game](/guides/make-a-tic-tac-toe-game).
- Share it: [how to put your game online](/guides/put-your-game-online).
