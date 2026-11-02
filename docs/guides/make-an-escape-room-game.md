---
title: How to make an escape room game in three.js: clues, a code and a door
phrase: how to make an escape room game
description: How to make an escape room game for the screen or a classroom: the puzzle as a chain worked out backwards from the door, flags that remember what the player has done, one list of rules saying what each object needs and gives, and a keypad that checks a four-digit code, on a small three.js locked room with a painting, a drawer and a clock; plus the prompt to give an AI agent, what goes wrong, and paprika3d clicking through the room, typing codes and catching a keypad that kept a wrong code.
meta: How to make an escape room game in three.js: clues hidden in a room, flags for what the player found, a keypad code and a door that opens.
intent: make-an-escape-room-game
queries:
  - "how to make a escape room game"
  - "how to create a virtual escape room game"
  - "how to create an escape room game for the classroom"
  - "Programming logic to 2D point and click adventure/puzzle?"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make an escape room game in three.js: clues, a code and a door

An escape room game locks the player in a room and asks them to get out. The door needs a code or a key; the code is hidden in pieces around the room; and some of the pieces are themselves locked behind other finds. The player searches, connects what they found, and opens the door. It works as a game on a screen, and it is a popular format for classrooms, where each lock is a question from the lesson.

Under the room, the logic is small. Someone asked on Game Development Stack Exchange how the logic of a point-and-click puzzle is programmed; the usual answer is **flags**. A flag is a true-or-false value that remembers one thing the player has done: moved the painting, taken the key, opened the drawer. Every object checks the flags it needs and sets the flags it gives. The whole puzzle is a short list of those rules.

Two more words before the code. **three.js** is a JavaScript library that draws 3D scenes in a web page. To know which object the player clicked, three.js uses a **raycaster**, which sends a line from the camera through the mouse pointer and reports the first object it meets.

## Plan the room backwards, from the door

Start at the end and ask what each step needs:

1. The **door** opens with the code `7382` typed on the keypad beside it.
2. The code's **order** is on a note in the desk drawer: "the painting, then the clock, then 8 2".
3. The **drawer** is locked; its key hangs behind the painting.
4. The **painting** swings aside when clicked, showing the key and a 7 scratched into the wall.
5. The **clock** stopped at 3 o'clock.

Read from the bottom up, that is the player's path: painting (a 7 and a key), drawer (the note), clock (a 3), keypad. Planning backwards guarantees that every lock has a way to open it. Each find should feel earned and leave no doubt, which is why the note gives the order rather than leaving the player to guess which digit goes where.

## Flags remember what the player has done

The game keeps one object of flags, and one rule per thing that can be clicked:

```js
const flags = { paintingMoved: false, hasKey: false, drawerOpen: false, sawClock: false, doorOpen: false };
const RULES = {
  painting: { sets: ['paintingMoved', 'hasKey'], text: 'Behind the painting, a 7 ... You take the key.' },
  drawer: { needs: 'hasKey', sets: ['drawerOpen'], text: 'A note inside: ...', locked: 'The drawer is locked.' },
  clock: { sets: ['sawClock'], text: "The clock has stopped at 3 o'clock." },
};
```

A click runs the object's rule: if a flag it `needs` is still false, the player reads the `locked` text and nothing changes; otherwise the flags it `sets` turn true and the player reads its `text`. One `draw()` function then makes the room match the flags: the painting swung aside, the drawer pulled out, the door open. Adding a puzzle is adding a rule, and a new room is a new list.

## A keypad for the code

The keypad is plain HTML (the page's own buttons) laid over the 3D view, opened by clicking the box beside the door. It collects digits in a string, and on OK compares the string with the code. Keep the code as text, not a number: a code such as `0451` read as a number becomes 451 and can never match. Clear what was typed after every try, right or wrong. The keys on the keyboard work too while the keypad is open.

## The game: locked in

Click things in the room to find the code, then click the keypad beside the door and type it. Save the file as `index.html`, run `npm install three` in its folder (npm comes with Node.js, a free program that installs JavaScript libraries), then serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) has the usual causes.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Locked in</title>
<style>
html,body{margin:0;overflow:hidden;font:17px system-ui}canvas{display:block}
#say{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);padding:10px 18px;background:#000b;color:#fff;border-radius:6px}
#pad{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);display:none;grid-template-columns:repeat(3,56px);gap:8px;padding:16px;background:#333;border-radius:8px}
#pad output{grid-column:span 3;padding:8px;background:#122;color:#5f5;font:24px monospace;text-align:center;letter-spacing:6px}
#pad button{height:48px;font:20px system-ui}
</style></head>
<body>
<div id="say">You are locked in. Find the code for the door.</div>
<div id="pad"><output></output></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// What the player has done so far. Every clue and the door read and set these flags.
const flags = { paintingMoved: false, hasKey: false, drawerOpen: false, sawClock: false, doorOpen: false };
const CODE = '7382';
// What clicking each object does: what it needs first, which flags it sets, what the player is told.
const RULES = {
  painting: { sets: ['paintingMoved', 'hasKey'], text: 'Behind the painting, a 7 is scratched into the wall, and a small key hangs on a nail. You take the key.' },
  drawer: { needs: 'hasKey', sets: ['drawerOpen'], text: 'The key opens the drawer. A note inside: "the painting, then the clock, then 8 2".', locked: 'The drawer is locked.' },
  clock: { sets: ['sawClock'], text: 'The clock has stopped at 3 o\'clock.' },
  door: { needs: 'doorOpen', text: 'The door is open. You are out!', locked: 'The door is locked. There is a keypad beside it.' },
};

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101014);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 50);
camera.position.set(0, 1.7, 3.2);
camera.lookAt(0, 1.4, -4);
scene.add(new THREE.HemisphereLight(0xfff4e0, 0x303040, 1.8));
const bulb = new THREE.PointLight(0xffd9a0, 25, 12);
bulb.position.set(0, 3, -1);
scene.add(bulb);

function add(name, geometry, color, x, y, z, parent = scene) {
  const m = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }));
  m.name = name;
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
add('floor', B(10, 0.1, 9), 0x4b3a2e, 0, -0.05, -0.5);
add('back wall', B(10, 3.4, 0.2), 0x6b7a6a, 0, 1.7, -4.1);
add('left wall', B(0.2, 3.4, 9), 0x5d6b5c, -4.5, 1.7, -0.5);
add('right wall', B(0.2, 3.4, 9), 0x5d6b5c, 4.5, 1.7, -0.5);
add('daylight', new THREE.PlaneGeometry(1.2, 2.2), 0xfff3c0, 2, 1.1, -3.99).material.emissive.set(0xfff3c0);   // seen when the door opens

// Hinged things turn on a pivot at one edge: the painting and the door.
const paintingHinge = new THREE.Group();
paintingHinge.position.set(-3.2, 1.9, -3.95);
scene.add(paintingHinge);
const painting = add('painting', B(1.4, 1, 0.06), 0x8a5a2b, 0.7, 0, 0, paintingHinge);
add('painting', B(1.2, 0.8, 0.02), 0x5a8fb0, 0, 0, 0.03, painting);
const doorHinge = new THREE.Group();
doorHinge.position.set(1.4, 0, -3.94);
scene.add(doorHinge);
add('door', B(1.2, 2.2, 0.08), 0x7a4a2a, 0.6, 1.1, 0, doorHinge);
add('keypad', B(0.3, 0.4, 0.06), 0x222428, 3.1, 1.3, -3.97);
add('desk', B(2, 0.8, 0.9), 0x5b3a22, -1.2, 0.4, -3.4);
const drawer = add('drawer', B(0.8, 0.22, 0.1), 0x7a5232, -1.2, 0.55, -2.92);
const clock = add('clock', new THREE.CylinderGeometry(0.35, 0.35, 0.06, 32).rotateX(Math.PI / 2), 0xf0ece0, 0, 2.5, -3.97);
add('clock', B(0.04, 0.26, 0.02), 0x111111, 0, 0.12, 0.04, clock);   // minute hand on 12
add('clock', B(0.2, 0.05, 0.02), 0x111111, 0.1, 0, 0.04, clock);     // hour hand on 3

const say = (text) => { document.getElementById('say').textContent = text; };
// The scene shows the flags: a moved painting, an open drawer, an open door.
function draw() {
  paintingHinge.rotation.y = flags.paintingMoved ? -1.1 : 0;
  drawer.position.z = flags.drawerOpen ? -2.55 : -2.92;
  doorHinge.rotation.y = flags.doorOpen ? -1.3 : 0;
}
function use(name) {
  if (name === 'keypad') return openPad();
  const rule = RULES[name];
  if (rule.needs && !flags[rule.needs]) return say(rule.locked);
  for (const f of rule.sets ?? []) flags[f] = true;
  say(rule.text);
  draw();
}

// The keypad: type four digits, then OK (or Enter).
const pad = document.getElementById('pad'), screen = pad.querySelector('output');
let entered = '', tries = 0;
for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK']) {
  const b = document.createElement('button');
  b.textContent = k;
  b.onclick = () => press(k);
  pad.append(b);
}
function openPad() { if (!flags.doorOpen) { pad.style.display = 'grid'; say('Type the code, then OK.'); } }
function press(k) {
  if (k === 'C') entered = '';
  else if (k === 'OK') {
    tries++;
    if (entered === CODE) { flags.doorOpen = true; pad.style.display = 'none'; draw(); say(RULES.door.text); }
    else say('Wrong code.');
    entered = '';
  } else if (entered.length < 4) entered += k;
  screen.textContent = entered;
}
addEventListener('keydown', (e) => {
  if (pad.style.display !== 'grid') return;
  if (/^[0-9]$/.test(e.key)) press(e.key);
  else if (e.key === 'Enter') press('OK');
  else if (e.key === 'Backspace') press('C');
  else if (e.key === 'Escape') pad.style.display = 'none';
});

const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', (e) => {
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  const name = ray.intersectObjects(scene.children, true)[0]?.object.name;
  if (name in RULES || name === 'keypad') use(name);
});

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
draw();
renderer.setAnimationLoop(() => renderer.render(scene, camera));

window.__game = {
  describe: () => ({ name: 'locked in', units: 'metres', mouse: 'click things in the room', keys: { Enter: 'confirm the code on the keypad' } }),
  observe: () => ({ ...flags, entered, tries, keypad: pad.style.display === 'grid', message: document.getElementById('say').textContent }),
  setState: (s) => { Object.assign(flags, s); draw(); },
};
</script>
</body></html>
```

The room is boxes: floor, walls, a desk with a drawer, a painting, a clock with two hands pointing at 3, a door, a keypad and a bright panel behind the door for daylight. The painting and the door each sit in a group placed at their hinge, so turning the group swings them on an edge instead of spinning them around their middle. `use()` runs an object's rule; `press()` handles the keypad; the click handler asks the raycaster which object is under the pointer and passes its name to `use()`. `window.__game` at the end lets a testing tool read the flags and set them; the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code, Cursor or Codex that writes and edits the files in your project) builds this from a plan of the room. Give it the chain, not just "an escape room":

```text
Make an escape room game in one index.html with three.js: a small room seen from the
middle, with a desk and drawer, a painting, a clock stopped at 3 and a locked door with a
keypad beside it. Keep the puzzle as flags and one RULES object: clicking the painting
swings it aside on a hinge and gives a key and the digit 7; the drawer needs the key and
holds a note giving the order "painting, clock, 8 2"; the clock gives 3. Clicking the
keypad opens an HTML keypad (also keyboard digits and Enter); the code 7382, kept as a
string, opens the door onto daylight. Show every message in a box at the bottom.
Then click through the room in order and check the door opens, and that a wrong code
first does not stop the right one working.
```

## When an escape room goes wrong

- **The right code stops working after a wrong one.** The keypad kept the wrong digits and refused more. Clear the entry after every try.
- **The drawer opens without the key.** Its rule is missing the `needs` check.
- **A code starting with 0 never works.** It was compared as a number; compare text.
- **The painting or door spins around its middle.** Rotate a group placed at the hinge, with the mesh offset inside it, not the mesh itself.
- **The door swings backwards through the wall.** The turn has the wrong sign; the first version of this game did that, and a picture of the open door showed it at once.
- **Typing a digit with the keypad closed still enters it.** Read digit keys while the keypad is open and nowhere else.

## For a classroom

A classroom escape room swaps the clues for questions from the lesson: each answer gives one digit, or opens one lock, and the door is the last question. In this game that is a change to the rules list: the painting's rule asks a question instead of giving a key. Planning backwards from the door still applies, and so does keeping the chain short enough to finish in a lesson. [How to make a game for a school project](/guides/make-a-game-for-a-school-project) covers building a game for a class, including what teachers ask about AI help.

## Let the agent play the room

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can click through it, type on the keypad and read the flags. Add it to Claude Code with two lines in a terminal (the text window where you type commands):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

`look` with `at` names what is drawn under points of the page, nearest first, so the agent knows where each object is before it clicks:

```text
look {"at":[[371,346],[490,511],[640,282],[972,411],[853,432]]}

At (371, 346): painting 7.53 m at [-2.48, 1.9, -3.91]; behind it painting 7.54 m; then back wall 7.63 m; background beyond.
At (490, 511): drawer 6.29 m at [-1.19, 0.56, -2.87]; behind it desk 6.37 m; then back wall 7.46 m; background beyond.
At (640, 282): clock 7.16 m at [0, 2.49, -3.92]; behind it clock 7.16 m; then clock 7.18 m; then back wall 7.24 m; background beyond.
At (972, 411): keypad 7.79 m at [3.09, 1.3, -3.94]; behind it back wall 7.86 m; background beyond.
At (853, 432): door 7.39 m at [1.98, 1.1, -3.9]; behind it daylight 7.49 m; then back wall 7.5 m; background beyond.
```

`interact` clicks and presses keys on exact frames, and `expect` checks the flags after. The drawer, clicked first, must stay shut:

```text
interact {"steps":[{"mouse":"click","x":490,"y":511}],"expect":{"drawerOpen":false,"message":"The drawer is locked."}}

{"changed":{"message":"The drawer is locked."}}
mouse click at (490, 511): over drawer (Mesh, 6.3 units)
Expect: drawerOpen false ✓ · message "The drawer is locked." ✓
```

Then the whole room in order, with a wrong code typed first, as a player might. On the first version of the keypad, which cleared the entry after a right code but not after a wrong one:

```text
interact {"steps":[{"mouse":"click","x":371,"y":346},{"mouse":"click","x":490,"y":511},{"mouse":"click","x":640,"y":282},{"mouse":"click","x":972,"y":411},{"key":"1"},{"key":"2"},{"key":"3"},{"key":"4"},{"key":"Enter"},{"key":"7"},{"key":"3"},{"key":"8"},{"key":"2"},{"key":"Enter"}],"expect":{"doorOpen":true,"tries":2}}

{"changed":{"paintingMoved":true,"hasKey":true,"drawerOpen":true,"sawClock":true,"entered":"1234","tries":2,"keypad":true,"message":"Wrong code."}}
mouse click at (371, 346): over painting (Mesh, 7.5 units)
mouse click at (490, 511): over drawer (Mesh, 6.3 units)
mouse click at (640, 282): over clock (Mesh, 7.2 units)
mouse click at (972, 411): over keypad (Mesh, 7.8 units)
Expect: doorOpen false ✗ expected true · tries 2 ✓
```

Every clue was found, but the keypad still held `1234`, ignored the right digits because four were already typed, and said "Wrong code." again. A player who knew the answer was stuck. With the entry cleared after every try, as in the game above, the same steps give:

```text
{"changed":{"paintingMoved":true,"hasKey":true,"drawerOpen":true,"sawClock":true,"doorOpen":true,"tries":2,"message":"The door is open. You are out!"}}
mouse click at (371, 346): over painting (Mesh, 7.5 units)
mouse click at (490, 511): over drawer (Mesh, 6.3 units)
mouse click at (640, 282): over clock (Mesh, 7.2 units)
mouse click at (972, 411): over keypad (Mesh, 7.8 units)
Expect: doorOpen true ✓ · tries 2 ✓
```

`look` with `sheet` pictures the room at moments set from the flags, here at the start and with every flag set:

```text
look {"sheet":[{"label":"start","state":{}},{"label":"every flag set","state":{"paintingMoved":true,"hasKey":true,"drawerOpen":true,"sawClock":true,"doorOpen":true}}]}

Picture: <project>/paprika3d/runs/2026-11-01T00-43-26-108Z/look-3-sheet.png (2 moments, left to right, top to bottom: start | every flag set); the game is reloaded at its first frame
start: on screen: floor, back wall, left wall, right wall, door, desk, painting ×2, clock ×3, … 3 more; pixels: brightness 21%, colour saturation 46%, 0% near black, 0% blown out
every flag set: on screen: floor, back wall, left wall, right wall, desk, door, daylight, clock ×3, … 3 more; pixels: brightness 22%, colour saturation 44%, 0% near black, 0% blown out
This sheet took 1 s (about 0 s a cell) on a software renderer.
```

The daylight behind the door shows with every flag set and not at the start. In the first version the open door swung back into the solid wall, and the picture of this same moment showed wall where the doorway should have shown daylight. These replies were captured on 2026-11-01 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not design the puzzles or say whether the room is too hard; it plays the steps the agent writes and shows what happened, so a lock that will not open is found before a player finds it.

## Next steps

- A mystery where the clues name a person instead of opening a door: [how to make a detective game](/guides/make-a-detective-game).
- More rooms in a row, each a level: [how to make levels in a game](/guides/make-levels-in-a-game).
- A dark room and a torch: [how to make a horror game](/guides/make-a-horror-game).
- A timer and a record time to beat: [how to save the high score](/guides/save-the-high-score).
- Share the finished room: [how to put your game online](/guides/put-your-game-online).
- Doors that see and lead into each other: [how to make a portal game](/guides/make-a-portal-game).
