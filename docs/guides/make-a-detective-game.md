---
title: How to make a detective game in three.js: clues to find and a culprit to name
phrase: how to make a detective game
description: How to make a detective or mystery game for a first project: the case written as data (suspects with facts, clues that each say something about the culprit), a notebook that strikes out every suspect a clue rules out, and an accusation that ends the case, on a small three.js study with five clues to click; plus a check that the case is fair, the prompt to give an AI agent, and paprika3d naming what is under each point, clicking the clues and catching a clue the click went straight through.
meta: How to make a detective game in three.js: suspects and clues as data, a notebook that rules suspects out, and naming the culprit to close the case.
intent: make-a-detective-game
queries:
  - "how to make a detective game"
  - "how to make a mystery game"
  - "how to create a detective game"
  - "Show HN: I'm making a detective game built on Wikipedia"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make a detective game in three.js: clues to find and a culprit to name

A detective game (or mystery game) gives the player a crime, a place to search and a few people who might have done it. The player looks for clues, works out who could not have done it, and names the culprit. Searching is the activity; the satisfying part is the deduction, the moment the last innocent suspect is crossed off and one name is left.

That deduction is easier to build than it sounds. Each suspect is a short list of facts (muddy boots or clean shoes, left- or right-handed, where they were at the time). Each clue is one fact about the culprit. A clue rules out every suspect who does not fit it, and the culprit is the one suspect who fits every clue. The rest of the game is a room to search and a notebook that keeps track.

Some words used below. **three.js** is a JavaScript library that draws 3D scenes in a web page. A **raycaster** is the three.js tool that turns a mouse click into "which object did the player click": it sends an invisible line from the camera through the pointer and reports what it hits. The **notebook** here is plain HTML laid over the 3D canvas, which is a plain way to show text, lists and buttons in a three.js game.

## The four parts of a case

1. **What happened.** Here: a necklace was taken from the safe in the study.
2. **The suspects**, each with the same few facts: the gardener, the cook and the butler.
3. **The clues**, each a thing in the room that says one fact about the culprit: muddy footprints, fingerprints on the safe, a dusty step stool, a thread of wool, a stopped pocket watch.
4. **The accusation.** The player names one suspect. The right name solves the case; a wrong one ends it unsolved.

## The case is data

Write suspects and clues as two lists, and give each clue a small test, `fits`, that says whether a suspect matches it:

```js
const SUSPECTS = [
  { name: 'gardener', boots: 'muddy', hand: 'left', tall: true, wears: 'wool', at1115: 'alone in the shed' },
  { name: 'cook', boots: 'clean', hand: 'left', tall: false, wears: 'cotton', at1115: 'alone in the kitchen' },
  { name: 'butler', boots: 'muddy', hand: 'right', tall: true, wears: 'wool', at1115: 'serving supper upstairs' },
];
const CLUES = [
  { object: 'muddy footprints', text: 'Muddy footprints from the window to the safe: the thief wore muddy boots.', fits: s => s.boots === 'muddy' },
  { object: 'pocket watch', text: 'A watch knocked off the desk, stopped at 11:15.', fits: s => !s.at1115.startsWith('serving') },
  // ...
];
```

A suspect is ruled out as soon as the player has found one clue the suspect does not fit. Nothing in the rest of the game needs to know what a clue means: the notebook, the strike-through and the verdict all come from these two lists. A new case is new data.

## Write the case backwards

Many mystery writers start from the answer, and a mystery game can too. Pick the culprit first and write down their facts. Then give every other suspect at least one fact the culprit does not share, and place a clue in the room that shows it. In this case the cook has clean shoes, is short and wears cotton, so three clues point away from the cook; the butler is right-handed and was serving supper when the watch stopped, so two clues point away from the butler. A player who misses one clue can still solve it.

Two more habits help. Make at least one clue depend on reading, such as the watch's time against each suspect's alibi, so the case is not solved by clicking alone. And decide how much the game does for the player: this one crosses suspects out by itself, which suits a first game; a harder version lists the facts and lets the player do the crossing out.

## The game: the missing necklace

Click things in the study to find the five clues; the cursor changes over a clue. The notebook on the right lists what you found and crosses out each suspect a clue rules out. When you are sure, click a name in the notebook. Save this as `index.html`, run `npm install three` in its folder (npm comes with Node.js, a free program that installs JavaScript libraries), serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. A blank page is usually one of the faults listed in [HTML game not working?](/guides/html-game-not-working).

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>The missing necklace</title>
<style>
html,body{margin:0;overflow:hidden;font:15px/1.4 Georgia,serif}canvas{display:block}
#book{position:fixed;top:16px;right:16px;width:300px;padding:12px 16px;background:#f3e9d2;color:#2b2118;border-radius:6px}
#book h2{margin:0 0 6px;font-size:18px}#book ul{margin:4px 0 10px;padding-left:18px}
.out{text-decoration:line-through;color:#8a7a66}#book button{font:inherit;margin:2px 4px 2px 0}
</style></head>
<body>
<div id="book"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The case is data: what each suspect is like, and what each clue says about the thief.
const SUSPECTS = [
  { name: 'gardener', boots: 'muddy', hand: 'left', tall: true, wears: 'wool', at1115: 'alone in the shed' },
  { name: 'cook', boots: 'clean', hand: 'left', tall: false, wears: 'cotton', at1115: 'alone in the kitchen' },
  { name: 'butler', boots: 'muddy', hand: 'right', tall: true, wears: 'wool', at1115: 'serving supper upstairs' },
];
const CLUES = [
  { object: 'muddy footprints', text: 'Muddy footprints from the window to the safe: the thief wore muddy boots.', fits: s => s.boots === 'muddy' },
  { object: 'fingerprints', text: 'Chalky prints on the left of the dial: the thief turned it left-handed.', fits: s => s.hand === 'left' },
  { object: 'step stool', text: 'The step stool is still dusty: the thief reached the top shelf without it.', fits: s => s.tall },
  { object: 'wool thread', text: 'A thread of dark wool caught on the window latch.', fits: s => s.wears === 'wool' },
  { object: 'pocket watch', text: 'A watch knocked off the desk, stopped at 11:15.', fits: s => !s.at1115.startsWith('serving') },
];

let found = [], accused = null;
const ruledOutBy = s => found.map(o => CLUES.find(c => c.object === o)).find(c => !c.fits(s));
const remaining = () => SUSPECTS.filter(s => !ruledOutBy(s)).map(s => s.name);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x15121a);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 50);
camera.position.set(1.6, 4.2, 7.2);
camera.lookAt(1.6, 0.9, 0);
scene.add(new THREE.HemisphereLight(0xfff0dd, 0x302838, 1.6));
const lamp = new THREE.PointLight(0xffc880, 30, 12);
lamp.position.set(-1, 3.2, 1);
scene.add(lamp);

function add(name, geometry, color, x, y, z, parent = scene) {
  const m = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }));
  m.name = name;
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
add('floor', B(9, 0.1, 7), 0x5a4030, 0, -0.05, 0);
add('back wall', B(9, 4, 0.1), 0x3d4a3a, 0, 2, -3.5);
add('window', B(1.4, 1.6, 0.05), 0x9fc4e0, -2.8, 2.1, -3.42);
add('desk', B(1.8, 0.9, 1), 0x6b4226, -2.4, 0.45, 0.4);
add('bookshelf', B(1.6, 3, 0.5), 0x4a2f1c, 2.2, 1.5, -3.2);
add('safe', B(1, 1.1, 0.9), 0x55585e, 0.4, 0.55, -3);
add('safe dial', new THREE.CylinderGeometry(0.12, 0.12, 0.05, 20).rotateX(Math.PI / 2), 0xc9c9c9, 0.4, 0.7, -2.53);

// The five clues: small objects the player has to spot and click.
// Each gets a larger, invisible ball around it to click, so a click near a small clue still counts.
function clue(name, geometry, color, x, y, z) {
  const m = add(name, geometry, color, x, y, z);
  m.userData.clue = true;
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.name = name;
  m.add(hit);
  return m;
}
const prints = new THREE.Group();
prints.name = 'muddy footprints';
prints.userData.clue = true;
for (let i = 0; i < 4; i++) add('muddy footprints', new THREE.CircleGeometry(0.16, 16).scale(1.8, 1, 1).rotateX(-Math.PI / 2), 0x2a1a0e, -2.5 + i * 0.7, 0.01, -2.7 + (i % 2) * 0.25, prints);
scene.add(prints);
clue('fingerprints', B(0.2, 0.16, 0.02), 0xf0eee0, 0.12, 0.7, -2.54);
clue('step stool', B(0.6, 0.5, 0.5), 0x8a6a4a, 3.5, 0.25, -2.6);
clue('wool thread', new THREE.TorusGeometry(0.14, 0.035, 8, 20), 0x41557a, -2.2, 1.35, -3.38);
clue('pocket watch', new THREE.CylinderGeometry(0.14, 0.14, 0.04, 24), 0xd8b040, -1.1, 0.02, 1.2);

// The three suspects stand by the door.
const COLOURS = { gardener: 0x3f8f3a, cook: 0xf2f2ee, butler: 0x1d1d22 };
SUSPECTS.forEach((s, i) => {
  const person = new THREE.Group();
  person.name = s.name;
  add(s.name, new THREE.CapsuleGeometry(0.3, s.tall ? 1.1 : 0.7, 4, 12), COLOURS[s.name], 0, s.tall ? 0.85 : 0.65, 0, person);
  add(s.name, new THREE.SphereGeometry(0.24, 16, 12), 0xe0b090, 0, s.tall ? 1.8 : 1.4, 0, person);
  person.position.set(1.5 + i * 0.75, 0, 2.8);
  scene.add(person);
});

const book = document.getElementById('book');
function write() {
  const list = found.map(o => `<li>${CLUES.find(c => c.object === o).text}</li>`).join('');
  const people = SUSPECTS.map(s => { const why = ruledOutBy(s); return `<li class="${why ? 'out' : ''}">The ${s.name}${why ? ` (ruled out: ${why.object})` : ''}</li>`; }).join('');
  const verdict = accused === null ? `Name the culprit: ${SUSPECTS.map(s => `<button data-name="${s.name}">${s.name}</button>`).join('')}`
    : accused === remaining()[0] && remaining().length === 1 ? `<b>Case solved: the ${accused} took the necklace.</b>`
    : `<b>Wrong: the ${accused} did not do it. The case goes cold.</b>`;
  book.innerHTML = `<h2>Notebook</h2>Clues found: ${found.length} of ${CLUES.length}<ul>${list}</ul>Suspects<ul>${people}</ul>${verdict}`;
}
book.addEventListener('click', e => { if (e.target.dataset.name && accused === null) { accused = e.target.dataset.name; write(); } });

// A click on the canvas: the first object under the pointer, and is it a clue?
const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
function under(e) {
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  let o = ray.intersectObjects(scene.children, true)[0]?.object;
  while (o && !o.userData.clue) o = o.parent;
  return o;
}
renderer.domElement.addEventListener('pointermove', e => { renderer.domElement.style.cursor = under(e) ? 'pointer' : 'default'; });
renderer.domElement.addEventListener('pointerdown', e => {
  const o = under(e);
  if (!o || accused !== null || found.includes(o.name)) return;   // each clue counts once
  found.push(o.name);
  write();
});

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
write();
renderer.setAnimationLoop(() => renderer.render(scene, camera));

window.__game = {
  describe: () => ({ name: 'the missing necklace', units: 'metres', mouse: 'click objects to find clues; click a name in the notebook to accuse' }),
  observe: () => ({ found: [...found], clues: found.length, remaining: remaining(), left: remaining().length, accused, solved: accused !== null && remaining().length === 1 && accused === remaining()[0] }),
  setState: (s) => { if (s.found) found = [...s.found]; if ('accused' in s) accused = s.accused; write(); },
  suspects: SUSPECTS,
  clues: CLUES,
};
</script>
</body></html>
```

The room is a few boxes: floor, back wall, window, desk, bookshelf and safe. `clue()` adds each of the five clues, marks it as a clue and wraps it in a larger invisible ball, so a click near a small object still counts (more on why below). The suspects are three simple figures by the door. On a click, `under()` asks the raycaster for the first object under the pointer and walks up to the clue it belongs to; a clue already in the notebook is ignored. `write()` redraws the notebook from the two lists, and a click on a name there makes the accusation. `window.__game` lets a testing tool read the case; the game plays the same without it.

## Is the case fair?

A mystery can be broken in two quiet ways: no suspect fits every clue, or two do. Either way the player cannot win by thinking, and nothing on screen shows it. A few lines run over the two lists find both:

```js
const { suspects, clues } = window.__game;
const left = suspects.filter(s => clues.every(c => c.fits(s))).map(s => s.name);
const rulesOut = Object.fromEntries(clues.map(c => [c.object, suspects.filter(s => !c.fits(s)).map(s => s.name)]));
return { left, rulesOut };
```

`left` is every suspect who fits all the clues; it should hold exactly one name. `rulesOut` shows what each clue does, which also reveals a clue that rules out nobody. A first draft of the watch clue was written without its `!`, so it said the thief *was* the one serving supper. The check answered:

```text
{"left":[],"rulesOut":{"muddy footprints":["cook"],"fingerprints":["butler"],"step stool":["cook"],"wool thread":["cook"],"pocket watch":["gardener","cook"]}}
```

Nobody was left: with every clue found, the notebook would cross out all three suspects. With the `!` back, as in the game above:

```text
{"left":["gardener"],"rulesOut":{"muddy footprints":["cook"],"fingerprints":["butler"],"step stool":["cook"],"wool thread":["cook"],"pocket watch":["butler"]}}
```

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code, Cursor or Codex that writes and edits the files in your project) can build the room and the logic from a description of the case. Give it the case, not just the genre:

```text
Make a detective game in one index.html with three.js: a study seen from the front,
with a desk, a bookshelf, a safe and a window. A necklace was stolen. Keep the case as data:
three suspects (gardener, cook, butler), each with the same facts, and five clues, each an
object in the room with a text and a fits(suspect) test. Clicking a clue (raycaster) adds it
once to an HTML notebook on the right; a suspect who fails any found clue is crossed out.
The notebook has a button per suspect to accuse; the right one solves the case.
Then check the case is fair: exactly one suspect should fit every clue.
```

## When a detective game goes wrong

- **A clue appears twice in the notebook.** The click handler adds it again on every click; skip clues already found.
- **A clue cannot be clicked.** Something in front of it (a desk, an invisible wall) takes the click first. The raycaster reports the first thing it hits.
- **A small clue is hard to hit.** Give it a larger invisible click area, as `clue()` does here.
- **Every suspect is crossed out, or two remain.** A clue's test is wrong or a suspect's facts are; run the fairness check.
- **The player can keep clicking after accusing.** Stop adding clues once the case is closed.

## Let the agent find the clues

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can look at it, click in it and read its state. Add it to Claude Code with two lines in a terminal (the text window where you type commands):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

`look` with `at` names what is drawn at points of the page, nearest first. The agent used it to find where each clue sits on screen:

```text
look {"at":[[313,375],[517,327],[794,360],[338,256],[318,555],[624,520]]}

At (313, 375): muddy footprints 11.5 m at [-2.48, 0.01, -2.68]; behind it floor 11.5 m; background beyond.
At (517, 327): fingerprints 10.4 m at [0.13, 0.7, -2.53]; behind it safe 10.5 m; then back wall 11.4 m; background beyond.
At (794, 360): step stool 10.5 m at [3.45, 0.34, -2.35]; behind it floor 11.4 m; background beyond.
At (338, 256): window 11.6 m at [-2.2, 1.34, -3.39]; behind it back wall 11.7 m; background beyond.
At (318, 555): pocket watch 7.75 m at [-1.08, 0.04, 1.24]; behind it floor 7.82 m; background beyond.
At (624, 520): gardener 4.92 m at [1.51, 1.55, 3.05]; behind it floor 7.79 m; background beyond.
```

The fourth point is the middle of the wool thread, a small loop on the window latch, and what is drawn there is the window: the loop is empty in the middle. `interact` plays clicks and checks the state with `expect`. On the first version of the game, which had no invisible click areas, clicking the footprints twice and then each of the other clues gave:

```text
interact {"steps":[{"mouse":"click","x":313,"y":375},{"mouse":"click","x":313,"y":375},{"mouse":"click","x":517,"y":327},{"mouse":"click","x":794,"y":360},{"mouse":"click","x":338,"y":256},{"mouse":"click","x":318,"y":555}],"expect":{"clues":5,"left":1,"remaining.0":"gardener"}}

{"changed":{"found":["muddy footprints","fingerprints","step stool","pocket watch"],"clues":4,"remaining":["gardener"],"left":1}}
mouse click at (313, 375): over muddy footprints (Mesh, 11.5 units)
mouse click at (517, 327): over fingerprints (Mesh, 10.4 units)
mouse click at (794, 360): over step stool (Mesh, 10.5 units)
mouse click at (338, 256): over window (Mesh, 11.6 units)
mouse click at (318, 555): over pocket watch (Mesh, 7.8 units)
Expect: clues 4 ✗ expected 5 · left 1 ✓ · remaining.0 "gardener" ✓
```

The double click on the footprints counted once, as it should, but the click on the wool went through the loop to the window, so a person aiming at the middle of it would miss it too. With the invisible ball around each clue, the same clicks find all five:

```text
{"changed":{"found":["muddy footprints","fingerprints","step stool","wool thread","pocket watch"],"clues":5,"remaining":["gardener"],"left":1}}
mouse click at (313, 375): over muddy footprints (Mesh, 11.5 units)
mouse click at (517, 327): over fingerprints (Mesh, 10.2 units)
mouse click at (794, 360): over step stool (Mesh, 10.5 units)
mouse click at (338, 256): over wool thread (Mesh, 11.4 units)
mouse click at (318, 555): over pocket watch (Mesh, 7.6 units)
Expect: clues 5 ✓ · left 1 ✓ · remaining.0 "gardener" ✓
```

`look` `at` still reports the window at that point, because it reports what is drawn and the ball is not drawn; the click reply names what the click's ray hit. Last, the agent set the notebook to all five clues and clicked the gardener's name:

```text
interact {"steps":[{"state":{"found":["muddy footprints","fingerprints","step stool","wool thread","pocket watch"]}},{"mouse":"click","x":1091,"y":418}],"expect":{"solved":true}}

{"changed":{"accused":"gardener","solved":true}}
Expect: solved true ✓
```

The fairness check above ran through `eval`, which runs code inside the open page. These replies were captured on 2026-11-01 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not write the mystery or say whether it is too easy or too hard; the fairness check is a few lines the agent writes for this case's data, not a built-in test.

## Bigger mysteries

The same lists grow with the game. More rooms are more places for clues. Questioning suspects is a conversation tree, which [how to make a dialogue system in a game](/guides/make-a-dialogue-system-in-a-game) covers, and a long case wants a save ([how to save game progress](/guides/save-game-progress)). One detective game shared on Hacker News is built on Wikipedia; wherever the data comes from, the rule stays the same: exactly one suspect must fit every clue. A puzzle where clues open a lock instead of naming a person is an escape room: [how to make an escape room game](/guides/make-an-escape-room-game).

## Next steps

- Add a title screen and a "new case" button: [how to make a main menu for a game](/guides/make-a-main-menu).
- Lighting for a darker, tenser study: [how to make my game look better](/guides/make-my-game-look-better).
- How an agent builds and checks a game step by step: [AI agent to build a three.js game](/guides/ai-agent-build-threejs-game).
- When code an AI wrote does not run: [ChatGPT three.js code not working](/guides/chatgpt-threejs-code-not-working).
