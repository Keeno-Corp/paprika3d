---
title: How to make a virtual pet game in three.js: hunger, sleep and play
phrase: how to make a virtual pet game
description: How to make a virtual pet game like a Tamagotchi as a beginner: needs that fall with real time, buttons that feed, play and put the pet to bed, a face that shows its mood, and the hours the page was closed counted when it opens again, on a small three.js pet you can paste, with the prompt to give an AI agent and paprika3d checking a hungry pet, a night away and what was saved.
meta: How to make a virtual pet game in three.js: hunger, energy and fun that fall over real time, feed, play and sleep buttons, and time away counted.
intent: make-a-virtual-pet-game
queries:
  - "how to make a virtual pet game"
  - "how to make a pet game"
  - "Show HN: Virtual pet game made for my daughter"
  - "Show HN: I made a seal Tamagotchi game in Three.js"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make a virtual pet game in three.js: hunger, sleep and play

A virtual pet, the kind a Tamagotchi made famous, is a handful of numbers that go down as time passes, a few buttons that push them back up, and a face that shows how the pet feels about them. What makes it feel alive is that it keeps living while you are away: close the page at night, open it in the morning, and the pet is hungry. Many people make one as a first game for a child, and it is a good first game, because every part is small.

## The five parts

1. **Needs.** Numbers from 100 (full) to 0 (empty). This pet has three: food, energy and fun.
2. **Rates.** How much each need changes per hour, one set while the pet is awake and another while it sleeps. Awake, food falls 12 an hour and fun 20; asleep, energy climbs back 30 an hour. These few numbers decide how often the player has to come back, so they are the main thing to tune.
3. **Actions.** Feed adds 25 food. Play adds 20 fun and costs 10 energy. Sleep puts the pet to bed or wakes it, and a sleeping pet wakes by itself once it is rested.
4. **Mood.** One word chosen from the needs: asleep, hungry (food under 30), sleepy, bored, or happy when nothing is low. The face shows it: a smile when happy, a frown otherwise, eyes half shut when sleepy.
5. **Time away.** The game saves the needs together with the clock time, and when the page opens again it works out how long it was closed and runs that time through the same rates.

## Real time, not frames

A game usually moves by frames, the pictures it draws many times a second. A pet should not: browsers stop drawing frames for a tab you are not looking at, so a pet that counts frames freezes the moment you switch tabs. This one reads the computer's clock (`Date.now()`) every frame and passes on however much real time went by since the last look, whether that is a sixtieth of a second or a whole night. One function, `pass(seconds)`, does both, so the pet ages the same way open or closed. It steps through long gaps a minute at a time, so a pet that wakes up during the night spends the rest of it awake, and it ignores time that runs backwards, which happens when someone changes the computer's clock.

The save is one line of JSON in `localStorage`, the small store every browser keeps for each website, written after every button press, every 10 s and when the page closes. [How to save the high score](/guides/save-the-high-score) explains `localStorage` step by step, and [how to save game progress](/guides/save-game-progress) covers saving a whole game with a Continue button.

## Be kind about time away

How a pet treats a long absence is a design choice. The original toys could die of neglect; a pet for a young child usually should not. In this game the needs stop at 0 and nothing worse happens: the pet waits, hungry and bored, until someone comes back. Other gentle choices are to slow the rates while the page is closed, or to let the pet sleep through the night by itself.

## A small pet to paste

Pocket blob: a green blob on a cushion, with three needs at the top and three buttons (or the keys F, P and S). three.js, a JavaScript library that draws 3D in a web page, draws the blob and its face; the whole game is one HTML file. The import map line near the top tells the browser where three.js is (a `node_modules/three` folder beside the file, which `npm install three` makes), and [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) walks through the parts of such a page.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Pocket blob</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#needs{position:fixed;top:14px;left:0;right:0;text-align:center;font:600 20px system-ui;color:#234}
#note{position:fixed;top:44px;left:0;right:0;text-align:center;font:16px system-ui;color:#234}
#buttons{position:fixed;bottom:24px;left:0;right:0;display:flex;gap:12px;justify-content:center}
button{font:600 18px system-ui;padding:10px 22px;border:0;border-radius:10px;background:#fff;color:#234}</style></head>
<body>
<div id="needs"></div><div id="note"></div>
<div id="buttons"><button id="feed">Feed (F)</button><button id="play">Play (P)</button><button id="sleep">Sleep (S)</button></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// How much each need changes per hour of real time, awake and asleep. 100 is full, 0 is empty.
const RATES = {
  awake:  { food: -12, energy: -8, fun: -20 },
  asleep: { food: -6,  energy: 30, fun: 0 },
};
const SAVE_KEY = 'pocket-blob';
let needs = { food: 80, energy: 80, fun: 80 }, asleep = false, lastSeen = null, cameBack = false, awayHours = 0;
try {   // a pet saved earlier comes back with the time since it was saved still to pass
  const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
  if (saved) { needs = saved.needs; asleep = saved.asleep; lastSeen = saved.savedAt; cameBack = true; }
} catch { /* storage blocked: start a new pet */ }

function pass(seconds) {   // the same rule for one frame and for a night away, a minute at a time
  for (let left = seconds; left > 0; left -= 60) {
    const rate = asleep ? RATES.asleep : RATES.awake, s = Math.min(60, left);
    for (const k in needs) needs[k] = Math.min(100, Math.max(0, needs[k] + rate[k] * s / 3600));
    if (asleep && needs.energy === 100) asleep = false;   // wakes up rested, and spends the rest awake
  }
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ needs, asleep, savedAt: Date.now() })); } catch {}
}
function mood() {
  if (asleep) return 'asleep';
  if (needs.food < 30) return 'hungry';
  if (needs.energy < 30) return 'sleepy';
  if (needs.fun < 30) return 'bored';
  return 'happy';
}

function act({ key, action, down = true }) {
  if (!down) return;
  const what = action ?? { KeyF: 'feed', KeyP: 'play', KeyS: 'sleep' }[key];
  if (what === 'sleep') asleep = !asleep;
  else if (asleep) return;   // a sleeping pet does not eat or play
  else if (what === 'feed') needs.food = Math.min(100, needs.food + 25);
  else if (what === 'play' && needs.energy >= 10) { needs.fun = Math.min(100, needs.fun + 20); needs.energy -= 10; }
  save();
}
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.code }); });
for (const id of ['feed', 'play', 'sleep']) document.getElementById(id).onclick = () => act({ action: id });
addEventListener('pagehide', save);
setInterval(save, 10000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 50);
camera.position.set(0, 1.2, 6);
camera.lookAt(0, 0.6, 0);
const light = new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 3);
scene.add(light);
const cushion = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.3, 48), new THREE.MeshStandardMaterial({ color: 0xe07a8a }));
cushion.name = 'cushion';
cushion.position.y = -0.15;
const pet = new THREE.Group();
pet.name = 'pet';
const body = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshStandardMaterial({ color: 0x8fd694, roughness: 0.6 }));
body.name = 'body';
const eyes = [-0.35, 0.35].map(x => {
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), new THREE.MeshStandardMaterial({ color: 0x1c2430 }));
  eye.name = 'eye';
  eye.position.set(x, 0.25, 0.9);
  return eye;
});
const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 24, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1c2430 }));
mouth.name = 'mouth';
mouth.position.set(0, -0.1, 0.95);
pet.add(body, ...eyes, mouth);
scene.add(cushion, pet);
const needsText = document.getElementById('needs'), noteText = document.getElementById('note');

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
let frame = 0;
renderer.setAnimationLoop(() => {
  const now = Date.now();   // the pet lives on real time, so a closed tab still counts
  const seconds = lastSeen === null ? 0 : Math.max(0, now - lastSeen) / 1000;   // never below 0, if the computer's clock went back
  if (cameBack) { awayHours = seconds / 3600; cameBack = false; }
  pass(seconds);
  lastSeen = now;
  frame++;
  const m = mood();
  // the face: a smile when happy, a frown otherwise, eyes half shut when sleepy and shut asleep
  mouth.rotation.z = m === 'happy' ? Math.PI : 0;
  mouth.position.y = m === 'happy' ? -0.05 : -0.2;
  for (const eye of eyes) eye.scale.y = m === 'asleep' ? 0.15 : m === 'sleepy' ? 0.5 : 1;
  pet.position.y = 0.9 + Math.sin(frame / (asleep ? 60 : 20)) * 0.04;   // breathing
  scene.background = new THREE.Color(asleep ? 0x2b3355 : 0xbfe3f2);
  light.intensity = asleep ? 1.2 : 3;
  needsText.textContent = `Food ${Math.round(needs.food)} · Energy ${Math.round(needs.energy)} · Fun ${Math.round(needs.fun)} · ${m}`;
  noteText.textContent = awayHours >= 1 ? `You were away ${awayHours.toFixed(1)} hours.` : '';
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'pocket blob', units: 'metres', keys: { KeyF: 'feed', KeyP: 'play', KeyS: 'sleep or wake' } }),
  observe: () => ({ food: +needs.food.toFixed(2), energy: +needs.energy.toFixed(2), fun: +needs.fun.toFixed(2), asleep, mood: mood(), awayHours: +awayHours.toFixed(2) }),
  act,
  setState: (s) => {
    Object.assign(needs, s.needs ?? {});
    asleep = s.asleep ?? asleep;
    if (s.awayHours !== undefined) { lastSeen = Date.now() - s.awayHours * 3600000; cameBack = true; }   // as if the page had been closed that long
  },
  subject: 'pet',
};
</script>
</body></html>
```

The rates are the `RATES` table at the top: change a number and the pet gets hungry faster or slower. The face is set each frame from `mood()`, by turning the mouth over and squashing the eyes. A real pet game would add the things that make children care: a name, a pet that grows up over days, sounds when it eats.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes the files in your project) can build this from a description. Say what the needs are, how fast they fall, and what happens while the page is closed:

```text
Make a virtual pet game in one HTML file with three.js: a round blob with eyes and a mouth.
It has food, energy and fun from 0 to 100 that fall with real time (use Date.now(), not
frames): awake, food falls 12 an hour and fun 20; asleep, energy rises 30 an hour.
Add Feed, Play and Sleep buttons. Show its mood in its face: a smile when happy,
a frown when a need is under 30, sleepy eyes when tired. Save the needs and the time
in localStorage, and when the page opens again, apply the hours it was closed.
Needs stop at 0; the pet never dies.
```

## Let the agent check the pet

An agent cannot wait eight hours to see whether its pet got hungry. paprika3d, a plugin for Claude Code and an MCP server (the standard way to give tools to other coding agents), runs the game in a hidden Chrome so the agent can set it up, press its buttons and read its numbers. Its `interact` tool sets a moment with a `{ state }` step, plays clicks and keys on exact frames, and checks the result with `expect`. A hungry pet, and a click on the Feed button:

```text
interact {"steps":[{"state":{"needs":{"food":20}}},{"mouse":"click","x":492,"y":755}],"expect":{"food":45,"mood":"happy"}}

{"changed":{"food":45}}
Expect: food 45 ✓ · mood "happy" ✓
```

The browser's clock in paprika3d starts at the same moment every time the page loads, so a gap between two visits cannot be waited out. The game's `setState` takes `awayHours` instead, which sets the last-seen time that many hours back and runs the same code a reopened page runs. A pet left alone for eight hours:

```text
interact {"steps":[{"state":{"needs":{"food":80,"energy":80,"fun":80},"awayHours":8}},{"wait":1}],"expect":{"mood":"hungry"}}

{"changed":{"food":0,"energy":16,"fun":0,"mood":"hungry","awayHours":8}}
Expect: mood "hungry" ✓
```

Food and fun stopped at 0, as the game promises. A sleeping pet left for two hours wakes once its energy is full and spends the rest of the time awake, which the numbers show (food fell 4 asleep and 16 awake):

```text
interact {"steps":[{"state":{"needs":{"food":80,"energy":80,"fun":80},"asleep":true,"awayHours":2}},{"wait":1}],"expect":{"asleep":false,"energy":[85,95]}}

{"changed":{"food":60,"energy":89.33,"fun":53.33,"mood":"happy","awayHours":2}}
Expect: asleep false ✓ · energy 89.33 ✓
```

`eval` runs a line of code in the page, here to read what was saved:

```text
eval {"code":"return JSON.parse(localStorage.getItem(\"pocket-blob\"))"}

{"needs":{"food":45,"energy":80,"fun":80},"asleep":false,"savedAt":1800000060016}
```

The save still holds the moment of the feed, because the tests after it changed the pet without a button press and less than 10 s of game time had passed; the page saves again within 10 s, and when it closes. These replies were captured on 2026-11-01 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not run for real hours or days, so it cannot show how your pet feels over a week of real visits; that is a few days of playing it yourself. It cannot tell whether the pet is cute or whether a child will care about it. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Without paprika3d

Ask the agent for a hidden test key that calls `pass(3600)`, one hour in one press, so you can watch the pet get hungry and sleepy without waiting. To start a new pet, clear the save: in the browser console (the panel of messages a page writes, opened with F12), type `localStorage.removeItem('pocket-blob')` and reload.

## Next steps

- A pet for your own child to help design: [my kid wants to make a video game](/guides/my-kid-wants-to-make-a-video-game).
- Make feeding and playing feel like something: [how to make a game feel good](/guides/make-a-game-feel-good).
- Crops that grow by in-game days instead of real hours: [how to make a farming game](/guides/make-a-farming-game).
- Let friends adopt one: [how to put your game online](/guides/put-your-game-online).
