---
title: How to vibe code a game: a small three.js game an AI agent writes, opens and plays
phrase: how to vibe code a game
description: How to vibe code a game when you have never written code: what to install, the first request to type, a small three.js star catching game to start from, the loop of playing it and asking for one change at a time, and the step where the AI agent opens and plays the game itself with paprika3d.
meta: How to vibe code a game from nothing: the first request, a small three.js game, and the loop of playing it and asking for one change at a time.
intent: how-to-vibe-code-a-game
queries:
  - "how to vibe code a game"
  - "how to start vibe coding a game"
  - "how hard is it to vibe code a game"
  - "Is cursor capable of doing a single player Text Rpg, Text clicker game? for someone with no code experience?"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to vibe code a game: a small three.js game an AI agent writes, opens and plays

Vibe coding a game means describing the game in your own words, letting an AI write all of the code, then playing what it made and telling it what to change. You never have to read the code. You do still have three jobs no AI does for you: deciding what the game is, playing it after every change, and saying clearly what is wrong or missing.

This page walks through that loop on a real, small game you can copy: a basket that catches falling stars.

## What you need before you start

- **An AI coding agent.** This is an AI that works inside a folder on your computer: it writes files there, runs commands and reads what they print. Claude Code, Cursor and Codex are examples. A chat assistant in a browser tab can also write a game, but you save and run each file yourself; [Can I make a game with ChatGPT?](/guides/can-i-make-a-game-with-chatgpt) covers that path.
- **A terminal.** The window where you type commands to your computer (Terminal on a Mac, PowerShell on Windows). Claude Code and Codex run in one, and you will type two or three commands in it.
- **Node and Google Chrome.** Node is the program that runs JavaScript tools outside a browser; the agent uses it to install things. Chrome runs the game.
- **three.js.** A free JavaScript library (a bundle of ready-made code) that draws 3D in a web page. You do not set it up yourself: the agent installs it into your game's folder.

Make an empty folder for the game, open your agent in it, and you are ready.

## The loop, in six steps

1. **Describe the smallest version** of the game: what you control, what you are trying to do, how you score.
2. **The agent writes it**, as one web page.
3. **Run it and look.** Is everything you asked for on the screen?
4. **Play it.** Press the keys. Does the rule you described happen?
5. **Ask for one change.** One, not five.
6. **Check again:** the new thing works, and the old things still do. Then back to step 5.

Most of vibe coding is steps 3 to 6, repeated. The first request is a small part of it.

## The first request to type

Be concrete about the controls and the rule, and say what to leave out for now:

```text
Make a small 3D browser game with three.js, in one index.html file that loads three
through an import map from node_modules. A basket at the bottom slides left and right
with the arrow keys. One star at a time falls from a random spot at the top. If the
basket catches it, add one to "Caught"; if it falls past, add one to "Missed". Then a
new star falls. No title screen, no menus, no sound yet. Install three with npm and
tell me how to open the page.
```

A request like "make me a fun space game" leaves every one of those choices to the AI, and you get its guess. [AI prompt to make a game](/guides/ai-prompt-to-make-a-game) goes through what to put in a request.

## The smallest game that works

Here is a page of the kind that request asks for, written for this guide. It has four parts, each marked with a comment: the rules (what happens each moment), the picture (a scene, a camera and the two objects), the keys, and the loop that moves the game on and draws it once per screen refresh. The `window.__game` object at the end lets a tool read the score directly instead of guessing it from the picture.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Star catch</title>
<style>html,body{margin:0;overflow:hidden;background:#0d1020}#hud{position:fixed;top:14px;left:18px;font:600 20px system-ui;color:#fff}</style></head>
<body>
<div id="hud">Caught 0, missed 0</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rules: a star falls, you slide the basket under it. Catch it or miss it, and a new one falls.
const BASKET_SPEED = 6, FALL_SPEED = 3, EDGE = 4;
const held = new Set();
let basketX = 0, star = { x: 1, y: 6 }, caught = 0, missed = 0;

function newStar() { star = { x: (Math.random() * 2 - 1) * EDGE, y: 6 }; }

function step(dt) {
  const dir = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
  basketX = Math.max(-EDGE, Math.min(EDGE, basketX + dir * BASKET_SPEED * dt));
  star.y -= FALL_SPEED * dt;
  if (star.y < 0.4 && Math.abs(star.x - basketX) < 0.9) { caught++; newStar(); }
  else if (star.y < -1) { missed++; newStar(); }
  hud.textContent = `Caught ${caught}, missed ${missed}`;
}

// The picture: a scene, a camera looking at it, a light, and the objects.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1020);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3, 11);
camera.lookAt(0, 2.5, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x404060, 3));
const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 0.5, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xc08040, side: THREE.DoubleSide }));
basket.name = 'basket';
scene.add(basket);
const starMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), new THREE.MeshStandardMaterial({ color: 0xffe04a, emissive: 0x806000 }));
starMesh.name = 'star';
scene.add(starMesh);
const hud = document.getElementById('hud');

// The keys, and one function the harness can call the same way.
function act({ key, down = true }) { if (down) held.add(key); else held.delete(key); }
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

// The loop: once per frame, move the game on by the time that passed, then draw.
let last = null;
renderer.setAnimationLoop((now) => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  basket.position.set(basketX, 0, 0);
  starMesh.position.set(star.x, star.y, 0);
  starMesh.rotation.y = now / 300;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'star catch', keys: { ArrowLeft: 'hold to slide left', ArrowRight: 'hold to slide right' } }),
  observe: () => ({ basketX: +basketX.toFixed(2), starX: +star.x.toFixed(2), starY: +star.y.toFixed(2), caught, missed }),
  act,
  setState: (s) => { if (s.basketX !== undefined) basketX = s.basketX; if (s.starX !== undefined) star.x = s.starX; if (s.starY !== undefined) star.y = s.starY;
    if (s.caught !== undefined) caught = s.caught; if (s.missed !== undefined) missed = s.missed; },
  subject: 'basket',
};
</script>
</body></html>
```

To play it yourself: save it as `index.html` in your folder, run `npm install three` and then `npx vite` in the terminal, and open the address it prints in Chrome. Double-clicking the file shows a blank page, because browsers do not load the three.js module from a file opened that way; [HTML game not working?](/guides/html-game-not-working) explains it.

## Play it, then ask for one change

Play a round and notice one thing. Here it might be that the game never gets harder. So the second request is one sentence:

```text
Make each star fall a little faster than the last one I caught.
```

The change the agent needs is three lines: a `fall` speed that starts at 3 and goes up by 0.5 on every catch.

```diff
-const BASKET_SPEED = 6, FALL_SPEED = 3, EDGE = 4;
-let basketX = 0, star = { x: 1, y: 6 }, caught = 0, missed = 0;
+const BASKET_SPEED = 6, EDGE = 4;
+let basketX = 0, star = { x: 1, y: 6 }, caught = 0, missed = 0, fall = 3;
-  star.y -= FALL_SPEED * dt;
-  if (star.y < 0.4 && Math.abs(star.x - basketX) < 0.9) { caught++; newStar(); }
+  star.y -= fall * dt;
+  if (star.y < 0.4 && Math.abs(star.x - basketX) < 0.9) { caught++; fall += 0.5; newStar(); }
```

Then play again, and check two things: the stars do speed up, and catching still counts. Asking for one change at a time is what makes this check possible. When a request asks for five things and the game breaks, nobody knows which of the five did it. When it does break after a change that looked fine, [vibe coding bugs](/guides/vibe-coding-bugs) is the next page to read.

## Letting the agent check its own work

Steps 3, 4 and 6 are where you describe to the AI what you saw on screen. paprika3d is a plugin for Claude Code (and a tool server other agents can use) that gives the agent a browser of its own, so it opens the page, looks at it and plays it after each change. With the plugin installed, a skill called `threejs-game` loads by itself when the agent works on a three.js page and tells it what each tool shows. Two commands in the terminal install it:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

These are the replies on the game above, captured on 2026-10-30 on a Linux server with no graphics card. `look` gives the agent the picture and names what is on screen (cut here to the lines that matter for this game, nothing reworded):

```text
look {}

Pixels: brightness 7%, colour saturation 59%, 0% near black, 0% blown out. Dark: a viewer sees little.
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Caught 0, missed 0" [18, 14, 233, 36].
On screen (2):
basket 0.64% [578, 559, 701, 625]
star 0.093% [700, 104, 736, 150]
```

Both objects and the score are there. The "Dark" note is the night sky; whether that is the look you want is your call, and the agent has the same note a person would make at first sight. `interact` plays the rule: it puts the basket under a star, waits 60 frames, and checks the catch counted:

```text
interact {"steps":[{"state":{"basketX":-2,"starX":-2,"starY":3}},{"wait":60}],"expect":{"caught":1}}

{"changed":{"basketX":-2,"starX":-2.81,"starY":5.6,"caught":1}}
Expect: caught 1 ✓
```

After the change, the same call shows the new rule and the old one together:

```text
interact {"steps":[{"state":{"basketX":-2,"starX":-2,"starY":3}},{"wait":60}],"expect":{"caught":1}}

{"changed":{"basketX":-2,"starX":-2.81,"starY":5.53,"caught":1,"fall":3.5}}
Expect: caught 1 ✓
```

And `feel` says what a player would notice at the catch: the star jumps back to the top, the score text changes, and nothing else reacts (no flash, no sound). That is the next thing worth asking for:

```text
feel {"steps":[{"state":{"basketX":-2,"starX":-2,"starY":3}},{"wait":60}]}

Watched the steps' 60 frames and 45 frames after them, counted from the first step.
Moved during the steps: star 2.77 units.
Smooth moves (a new position on 3+ consecutive frames): 1 (star).
Teleports (a jump over 0.5 units between two watched frames, 4× the moves either side of it; a respawn is one, a glitch only for something that should glide): 1 (star at frame 52, 5.66 units).
No change in: camera (no shake), scale (no pops), colour (no flashes), spawns, removals.
HUD text: changed in one frame.
Sounds started: 0.
State: starX -2 → -2.81, starY 2.95 → 3.35, caught 0 → 1.
```

What it does not do: it does not decide whether the game is fun, and it checks what the agent asks it to check. You still play the game.

## How hard is it, honestly

Getting a small game to run is a small part of the work. The rest is the loop: deciding what to change next, noticing when something feels off, and putting that into words the AI can act on. A game with one clear rule that you grow one change at a time stays understandable; a whole game described in one long request is hard to check, and hard to fix when part of it is wrong. Start smaller than you think you need to.

## What to do next

- Not sure what to build? [What game should I make first?](/guides/what-game-should-i-make-first) has a short list of games with one rule each.
- The order of a first session, from empty folder to showing a friend: [where to start making a game](/guides/where-to-start-making-a-game).
- How a three.js page is put together, part by part: [how to make a 3D browser game](/guides/how-to-make-a-3d-browser-game).
- Making the catch feel good, with a pop, a flash or a sound: [how to make a game feel good](/guides/make-a-game-feel-good).
- What changes when an agent can see and play its game, with measured results: [build a three.js game with an AI agent](/guides/ai-agent-build-threejs-game).
- Building a whole game in a weekend: [how to make a game for a game jam](/guides/make-a-game-for-a-game-jam).
- A game made for one person: [how to make a game for my girlfriend](/guides/make-a-game-for-my-girlfriend).
