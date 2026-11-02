---
title: How to make a dialogue system in a game: an NPC who talks and gives a quest in three.js
phrase: how to make a dialogue system in a game
description: How to make a dialogue system in a game, for a first game: lines and choices kept as data, a box of plain HTML over the canvas, and quest flags that decide what a character says next, on a small three.js village game where a baker asks you to bring back her goose; the prompt to give an AI agent, the faults to check when talking goes wrong, and how the agent reads the box with paprika3d's look and clicks the choices with interact.
meta: How to make a dialogue system in a game: lines and choices as data, a box over the canvas and a quest flag, in a small three.js village game.
intent: make-a-dialogue-system-in-a-game
queries:
  - "how to make a dialogue system in a game"
  - "how to make a quest system in a game"
  - "how to make npc in a game"
  - "How do I implement branching dialogue in javascript?"
  - "Should NPC dialog be stored in XML or in a script?"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a dialogue system in a game: an NPC who talks and gives a quest in three.js

A dialogue system lets the player talk to the characters the computer controls, which games call **NPCs** (non-player characters). It has three parts, and none of them is much code:

1. **The words, as data.** Every line a character can say sits in one list, each with the choices the player can answer with and where each choice leads. Writing more dialogue means adding to the list, not writing code.
2. **A box that shows them.** A panel at the bottom of the screen with the speaker's name, the line, and one button per choice.
3. **Flags that remember.** A few variables record what the player agreed to and did. They decide which line a character opens with next time, and a **quest**, a task a character gives, is one such flag: not taken, taken, done.

This page builds all three into a small village game made with three.js (a JavaScript library that draws 3D scenes in a web page): Bea the baker has lost her goose, Pip, and asks you to bring her back.

## The words, as data

Each entry is a **node**: a line and its choices. A choice names the node it leads to, and `null` ends the conversation. A choice can also set the quest.

```js
const DIALOGUE = {
  ask:    { line: 'Oh, hello! My goose Pip ran off again. Could you bring her back?',
            choices: [{ text: "I'll find her.", next: 'thanks', quest: 'accepted' }, { text: 'Not today.', next: 'later' }] },
  thanks: { line: 'Thank you! She likes to hide by the well.', choices: [{ text: 'Bye.', next: null }] },
  ...
};
```

Following `next` from node to node is the **branching** people ask about: two choices lead two ways, and both can meet again later. One forum asker wondered whether dialogue belongs in XML or in a script. For a small game, neither: a JavaScript object like this one is data the game reads directly. When it grows to hundreds of lines, move it to a JSON file the game loads with `fetch`, so a writer can edit it without touching the code. For long branching stories there are free writing tools made for this, such as ink, whose stories run in a browser game through its JavaScript port, inkjs.

## Flags decide where a talk starts

Talking to Bea twice should not give the same speech twice. One function picks the opening node from the flags:

```js
function firstNode() {
  if (quest === 'done') return 'after';
  if (quest === 'accepted') return goose === 'following' ? 'found' : 'waiting';
  return 'ask';
}
```

Before you agree, she asks. After you agree, she asks whether you found Pip. When Pip is following you, she thanks you and the quest is done. After that, she has one last line. The goose reads the same flag: walk up to Pip without the quest and she hisses at you; with it, she follows you home. That is a whole quest system in miniature, a value that changes in steps and things in the world that check it. A game with many quests keeps one such value per quest, such as `quests.goose` and `quests.letter`.

## The box over the canvas

The dialogue box is plain HTML laid over the **canvas** (the rectangle the 3D picture is drawn in), not text inside the 3D scene. HTML gives sharp text that wraps by itself and buttons that take clicks with no extra code. The choices also answer the number keys 1 and 2, and while the box is open the player cannot walk away mid-sentence. A speech bubble that floats above a character's head is a different job, a label that follows a 3D point, and [three.js HTML labels](/guides/threejs-html-labels-css2drenderer) covers it.

Common extras, each a small addition to this game: the line typed out letter by letter (a timer that reveals more of the text each frame, and a key press that shows it all at once), a portrait beside the name, and an exclamation mark over an NPC who has something new to say (shown when `firstNode()` would not return the last node you saw).

## The game

The runaway goose: walk with the arrow keys, press E next to Bea to talk, and answer with a click or the keys 1 and 2. Pip waits by the well. Save it as `index.html`, run `npm install three` in its folder (npm comes with Node.js), serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>The runaway goose</title>
<style>html,body{margin:0;overflow:hidden;background:#a8d0e6}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#1d2a33;font:600 18px system-ui}
#box{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);width:560px;padding:14px 18px;border-radius:10px;
  background:rgba(20,20,30,.88);color:#fff;font:18px system-ui}
#box[hidden]{display:none}
#who{font-weight:700;color:#ffd38a;margin-bottom:6px}
#choices{display:flex;gap:10px;margin-top:12px}
#choices button{flex:1;font:inherit;padding:8px;cursor:pointer}</style></head>
<body>
<div id="hud"></div>
<div id="box" hidden><div id="who">Bea the baker</div><div id="line"></div><div id="choices"></div></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The dialogue: each node is a line and its choices; a choice names the next node and may set the quest.
const DIALOGUE = {
  ask:     { line: 'Oh, hello! My goose Pip ran off again. Could you bring her back?',
             choices: [{ text: "I'll find her.", next: 'thanks', quest: 'accepted' }, { text: 'Not today.', next: 'later' }] },
  thanks:  { line: 'Thank you! She likes to hide by the well.', choices: [{ text: 'Bye.', next: null }] },
  later:   { line: 'Oh. Come back if you change your mind.', choices: [{ text: 'Bye.', next: null }] },
  waiting: { line: 'Any sign of Pip? Try the well.', choices: [{ text: 'Still looking.', next: null }] },
  found:   { line: 'Pip! You found her! Take this loaf, fresh from the oven.', choices: [{ text: 'Happy to help.', next: null, quest: 'done' }] },
  after:   { line: 'Pip has not left the stall since. Thank you again!', choices: [{ text: 'Bye.', next: null }] },
};
// Which node a talk starts on depends on the quest, so the baker answers what you have done.
function firstNode() {
  if (quest === 'done') return 'after';
  if (quest === 'accepted') return goose === 'following' ? 'found' : 'waiting';
  return 'ask';
}

const hud = document.getElementById('hud'), box = document.getElementById('box');
const lineEl = document.getElementById('line'), choicesEl = document.getElementById('choices');
let quest = 'none', goose = 'lost', node = null, note = '', noteTime = 0;
let player = { x: 0, z: 2 }, pip = { x: 6.5, z: 3.5 };
const BAKER = { x: 0, z: -2.5 }, WELL = { x: 6, z: 2.5 };

function show(id) {                              // open the box on a node, or close it with null
  node = id;
  box.hidden = id === null;
  if (id === null) return;
  lineEl.textContent = DIALOGUE[id].line;
  choicesEl.replaceChildren(...DIALOGUE[id].choices.map((c, i) => {
    const b = document.createElement('button');
    b.textContent = `${i + 1}. ${c.text}`;
    b.onclick = () => choose(i);
    return b;
  }));
}
function choose(i) {
  const c = node && DIALOGUE[node].choices[i];
  if (!c) return;
  if (c.quest) quest = c.quest;
  if (quest === 'done') goose = 'home';
  show(c.next);
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8d0e6);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(2, 11, 11);
camera.lookAt(2, 0, 0.5);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x5a7040, 2));
const sun = new THREE.DirectionalLight(0xfff0d0, 2);
sun.position.set(-4, 10, 6);
scene.add(sun);

const add = (geo, color, name, x, y, z, parent = scene) => {
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
  m.name = name; m.position.set(x, y, z); parent.add(m); return m;
};
add(new THREE.BoxGeometry(18, 0.2, 12), 0xc9b48a, 'square', 2, -0.1, 0.5);
add(new THREE.BoxGeometry(3, 1, 1), 0x9c5b34, 'stall', BAKER.x, 0.5, BAKER.z - 1);
add(new THREE.ConeGeometry(2, 0.8, 4), 0xd94f4f, 'awning', BAKER.x, 2.2, BAKER.z - 1).rotation.y = Math.PI / 4;
add(new THREE.CylinderGeometry(1, 1, 0.8, 20), 0x8f8f99, 'well', WELL.x, 0.4, WELL.z);
const baker = add(new THREE.CapsuleGeometry(0.35, 0.7, 4, 12), 0xf2e2c8, 'baker', BAKER.x, 0.7, BAKER.z);
add(new THREE.SphereGeometry(0.2, 12, 8), 0xffffff, 'baker hat', 0, 0.75, 0, baker);
const hero = add(new THREE.CapsuleGeometry(0.35, 0.7, 4, 12), 0x3a6fd9, 'player', 0, 0.7, 0);
const goose3d = new THREE.Group();
goose3d.name = 'goose';
add(new THREE.SphereGeometry(0.3, 12, 8), 0xffffff, 'goose body', 0, 0.3, 0, goose3d);
add(new THREE.SphereGeometry(0.15, 12, 8), 0xffffff, 'goose head', 0.3, 0.6, 0, goose3d);
add(new THREE.ConeGeometry(0.06, 0.2, 8), 0xff9a1f, 'goose beak', 0.47, 0.6, 0, goose3d).rotation.z = -Math.PI / 2;
scene.add(goose3d);

const held = new Set();
const near = (a, b, d) => Math.hypot(a.x - b.x, a.z - b.z) < d;
function step(dt) {
  if (node === null) {                          // no walking while the box is open
    player.x = Math.min(10, Math.max(-6, player.x + (held.has('ArrowRight') - held.has('ArrowLeft')) * 4 * dt));
    player.z = Math.min(6, Math.max(-2, player.z + (held.has('ArrowDown') - held.has('ArrowUp')) * 4 * dt));
  }
  if (goose === 'lost' && near(player, pip, 1.2)) {
    if (quest === 'accepted') goose = 'following';
    else if (noteTime <= 0) { note = 'The goose hisses at you.'; noteTime = 2; }
  }
  if (goose === 'following') { pip.x += (player.x - 0.9 - pip.x) * 3 * dt; pip.z += (player.z + 0.6 - pip.z) * 3 * dt; }
  if (goose === 'home') { pip.x = BAKER.x + 1.2; pip.z = BAKER.z + 0.4; }
  noteTime -= dt;
}

let last = null;
function loop(t) {
  requestAnimationFrame(loop);
  step(last === null ? 1 / 60 : Math.min((t - last) / 1000, 0.1));
  last = t;
  hero.position.set(player.x, 0.7, player.z);
  goose3d.position.set(pip.x, 0, pip.z);
  const goal = { none: '', accepted: 'Quest: bring Pip back to Bea', done: 'Quest done: Pip is home' }[quest];
  const hint = node === null && near(player, BAKER, 2) ? 'Press E to talk' : '';
  hud.textContent = [goal, hint, noteTime > 0 ? note : ''].filter(Boolean).join('   ');
  renderer.render(scene, camera);
}

function act({ key, down = true, repeat = false }) {
  if (key.startsWith('Arrow')) down ? held.add(key) : held.delete(key);
  if (!down || repeat) return;
  if (key === 'KeyE' && node === null && near(player, BAKER, 2)) show(firstNode());
  if (key === 'Digit1') choose(0);
  if (key === 'Digit2') choose(1);
}
addEventListener('keydown', e => act({ key: e.code, repeat: e.repeat }));
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
requestAnimationFrame(loop);

window.__game = {
  subject: 'player',
  describe: () => ({ name: 'the runaway goose', keys: { ArrowRight: 'walk right', ArrowLeft: 'walk left', ArrowUp: 'walk up', ArrowDown: 'walk down', KeyE: 'talk', Digit1: 'first choice', Digit2: 'second choice' } }),
  observe: () => ({ quest, goose, node, player: { x: +player.x.toFixed(2), z: +player.z.toFixed(2) }, pip: { x: +pip.x.toFixed(2), z: +pip.z.toFixed(2) } }),
  act,
  setState: (s) => {
    if (s.quest !== undefined) quest = s.quest;
    if (s.goose !== undefined) goose = s.goose;
    if (s.player) player = { ...player, ...s.player };
    if (s.pip) pip = { ...pip, ...s.pip };
    if (s.node !== undefined) show(s.node);
  },
};
</script>
</body></html>
```

`show(id)` opens the box on a node (or closes it on `null`) and builds one button per choice; `choose(i)` applies the choice's quest and moves to its next node. The goose check in `step` and `firstNode` are the two places the quest flag is read. `window.__game` at the end lets a test tool read the quest, the goose and the open node, and set a moment up; the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes and edits your project's files) can add talking characters to a game you already have. Give it the shape, then the words:

```text
Add a dialogue system to my three.js game. Keep all dialogue in one object
of nodes: each node has a line and a list of choices, each choice has text,
the id of the next node (null ends the talk) and an optional flag to set.
Show it in an HTML box at the bottom of the screen with the speaker's name
and one button per choice; number keys pick choices too. The player cannot
move while the box is open. Add a fisherman NPC who asks for three fish:
his first line depends on a quest flag (not taken, taken, done).
```

## When talking goes wrong

- **The talk key also picks a choice.** If E opens the box and also answers, the first choice is taken on the same key press. Use separate keys, as here, or ignore the talk key while the box is open.
- **The box opens again as soon as it closes.** The talk key is acting on every frame it is held. Act on the key going down, and skip the repeats a held key sends (`event.repeat`).
- **The NPC repeats the first line forever.** The opening node is fixed instead of chosen from the flags; route every talk through one function like `firstNode()`.
- **A click on a choice also hits the 3D scene.** If your game also reacts to clicks on the canvas, a click on a button can reach both; stop the click at the box (`event.stopPropagation()`).
- **The quest is forgotten on reload.** Flags live in variables until the page closes; [how to save game progress](/guides/save-game-progress) keeps them.

## Let the agent talk to the baker

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs the game in a hidden Chrome browser so the agent can play it. Install it in Claude Code by running these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The replies below were captured on 2026-10-31 on the game above, on a server with no graphics card where Chrome draws in software; the `look` reply is cut to the lines about the box and the scene, and the folder is shortened to `<project>`.

`interact` plays keys on exact frames and checks the result with `expect`. Walk up to Bea and press E:

```text
interact {"steps":[{"key":"ArrowUp","frames":40},{"key":"KeyE","frames":1}],"expect":{"node":"ask"}}

{"changed":{"node":"ask","player":{"z":-0.67}}}
Expect: node "ask" ✓
```

`look` takes a screenshot and lists what is on screen. Its `HTML over the canvas:` line reads the box, so the agent knows the box is up, what it begins with, and where it is, without guessing from the picture:

```text
look {}

HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#box "Bea the baker Oh, hello! My goose Pip ra" [342, 630, 937, 775].
Subject: player takes 0.28% of the picture [491, 278, 538, 354]; 1 of its 1 named parts show.
On screen (10):
square 66% [0, 183, 1279, 785] 18 × 12 units
well 1.7% [850, 412, 1006, 558]
awning 1.5% [430, 118, 607, 207]
stall 0.71% [440, 183, 613, 260] 3 × 1 units, across the view
player 0.28% [491, 278, 538, 354]
baker 0.23% [503, 214, 545, 282]
goose body 0.14% [954, 526, 998, 568]
```

The box spans the pixels 342 to 937 across and 630 to 775 down, and the picture shows the two buttons in its bottom row. A mouse click on the left one takes the quest:

```text
interact {"steps":[{"mouse":"click","x":497,"y":742}],"expect":{"quest":"accepted","node":"thanks"}}

{"changed":{"quest":"accepted","node":"thanks"}}
Expect: quest "accepted" ✓ · node "thanks" ✓
```

The flag has to matter, so the agent checks the other branch too. A `{ state }` step sets a moment up directly: here, no quest and the player standing next to Pip. Five frames later the goose is still lost, as it should be:

```text
interact {"steps":[{"state":{"quest":"none","player":{"x":5.6,"z":3.5}}},{"wait":5}],"expect":{"quest":"none","goose":"lost"}}

{"changed":{"quest":"none","player":{"x":5.6,"z":3.5}}}
Expect: quest "none" ✓ · goose "lost" ✓
```

And the end of the quest, starting with the goose already found and following, so the check does not replay the walk. `save` keeps it as a check that `test` reruns after later edits:

```text
interact {"steps":[{"state":{"quest":"accepted","goose":"following","player":{"x":0,"z":-1},"pip":{"x":-0.9,"z":-0.4}}},{"key":"KeyE","frames":1},{"mouse":"click","x":640,"y":742}],"expect":{"quest":"done","goose":"home","node":null},"save":"goose-returned"}

{"changed":{"quest":"done","goose":"home","player":{"z":-1},"pip":{"x":1.2,"z":-2.1}}}
Expect: quest "done" ✓ · goose "home" ✓ · node null ✓
Saved check "goose-returned" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

E opened the box on the `found` node, the one choice closed it and set the quest to done, and Pip moved to the stall. If a later edit breaks a branch, that saved check says so.

What paprika3d does not do: it does not write dialogue or judge whether a character is interesting, and its `HTML over the canvas:` line reads text in the page's HTML; words drawn inside the 3D scene appear in the picture and not in that line.

## Next steps

- Turn the village into an adventure with fights and experience: [how to make an RPG game](/guides/make-an-rpg-game).
- Give a reward the player can carry: [how to make an inventory in a game](/guides/make-an-inventory-in-a-game).
- Keep the quest flag after the page closes: [how to save game progress](/guides/save-game-progress).
- Text inside the 3D scene, such as a sign over the bakery: [text in three.js](/guides/text-in-threejs).
