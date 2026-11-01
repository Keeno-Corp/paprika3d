---
title: How long does it take to make a game with AI? What one session builds in three.js
phrase: how long does it take to make a game with ai
description: How long a first game takes with an AI coding agent, shown with one timed session that built a small three.js moon lander from a request to four passing checks, what makes the time grow for a person (deciding, playing, asking for changes, more than typing), and how paprika3d's paprika-loop builds for a time you set while test says what still holds.
meta: How long does it take to make a game with AI? One timed session building a small three.js game, and what makes the time grow.
intent: how-long-to-make-a-game-with-ai
queries:
  - "how long does it take to make a game with ai"
  - "how long does it take to vibe code a game"
  - "How long did it took you to build your first game?"
  - "Is it possible to create a decent game in 1 weekend?"
  - "How long until I have something playable?"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How long does it take to make a game with AI? What one session builds in three.js

## The short answer

There is no single number for "a game", because the time depends on the game and, more than anything, on you. What can be measured is one small game: in the timed session below, an AI coding agent had a first playable version of a one-idea game within minutes of the request. What takes the time after that is the person's part: deciding what the game is, playing it, judging whether it is fun, and asking for the next change. Typing the code is the part the AI takes over.

So the honest answer to "how long until I have something playable?" is: about as long as it takes to describe a small game clearly. The answer to "how long until it is a good game?" is however many rounds of playing and changing it takes you, which is up to you.

## One session, timed

To give a real figure instead of a guess, this page's game was built in one timed session by the agent writing this page (Claude Opus 5.5 in Claude Code, with the paprika3d plugin), on 2026-10-30, on a shared server with no graphics card. The game is a moon lander, a small 3D game in three.js (a free library that draws 3D graphics in a web page). The request:

```text
Make a small 3D game with three.js in one HTML file: a moon lander.
A small ship falls toward a landing pad. Holding Space fires the engine and pushes it up, and uses fuel.
Touching the pad slower than 2 units a second is a landing; faster is a crash. Show the speed and the fuel.
When the fuel runs out the engine stops. Enter plays again.
```

The clock, read with `date` before and after each step:

```text
19:47:52  +0:00  The request is written down.
19:48:06  +0:14  First version saved as index.html.
19:48:20  +0:28  Opened, looked at, and played twice: falling without the engine crashes, as asked;
                 the agent's own landing attempt fired the engine too late and crashed.
19:49:08  +1:16  Three rules played and saved as checks: free fall crashes, a soft landing lands,
                 the engine stops when the fuel runs out. (This stretch includes working out a landing
                 that works, and the agent clearing up a mistake of its own: a log file it wrote into
                 the game's folder made every call reload the page.)
19:49:08  +1:16  A change is asked for: steer left and right with the arrow keys,
                 and a landing counts on the pad alone; touching the ground anywhere else is a crash.
19:49:20  +1:28  Change made.
19:49:22  +1:30  test: 2 of 3 saved checks pass. The ship now starts beside the pad,
                 so the old straight-down landing ends off it.
19:49:35  +1:43  The landing check played again with steering, an off-pad check added: 4 of 4 pass.
```

Read it with its limits. The idea was picked before the clock started, and the agent wrote the request itself, so no person spent time deciding, playing or waiting. The game has no models, textures, sound, menus or levels. It is one session with one model on one small game, not a benchmark: a different request, model or day gives different times. What it does show is the shape of the work: the code arrived fast, and most of the clock went on playing the game and on what playing found.

## The game from that session

The game as it stood at the end of the log, after the steering change:

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Moon lander</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:14px;left:18px;color:#fff;font:600 20px system-ui}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const GRAVITY = 1.6, THRUST = 4, BURN = 20, SAFE = 2, SIDE = 3;   // units/s², units/s², fuel a second, landing speed, sideways units/s
let x = -6, y = 10, vy = 0, fuel = 100, landed = false, crashed = false;
const held = new Set();
const hud = document.getElementById('hud');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060f);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 6, 16);
camera.lookAt(0, 5, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x222233, 2));
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const ground = new THREE.Mesh(new THREE.BoxGeometry(40, 1, 10), new THREE.MeshStandardMaterial({ color: 0x8a8a90 }));
ground.name = 'moon';
ground.position.y = -0.5;
scene.add(ground);
const pad = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 3), new THREE.MeshStandardMaterial({ color: 0xffcc33 }));
pad.name = 'pad';
pad.position.y = 0.1;
scene.add(pad);
const ship = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.4, 16), new THREE.MeshStandardMaterial({ color: 0xe8e8f0 }));
ship.name = 'ship';
scene.add(ship);

function step(dt) {
  if (landed || crashed) return;
  const firing = held.has(' ') && fuel > 0;
  if (firing) fuel = Math.max(0, fuel - BURN * dt);
  vy += ((firing ? THRUST : 0) - GRAVITY) * dt;
  y += vy * dt;
  x += ((held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0)) * SIDE * dt;
  if (y <= 0.9) {
    y = 0.9;
    if (-vy < SAFE && Math.abs(x) < 1.5) landed = true; else crashed = true;   // the pad is 3 units wide, at x = 0
  }
}
function restart() { x = -6; y = 10; vy = 0; fuel = 100; landed = crashed = false; }

function act({ key, down = true }) {
  if (key === 'Enter' && down && (landed || crashed)) restart();
  if (down) held.add(key); else held.delete(key);
}
addEventListener('keydown', e => act({ key: e.key }));
addEventListener('keyup', e => act({ key: e.key, down: false }));

let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  ship.position.set(x, y, 0);
  hud.textContent = landed ? 'Landed! Enter to fly again' : crashed ? 'Crashed. Enter to try again'
    : `Speed ${(-vy).toFixed(1)} · Fuel ${Math.round(fuel)}`;
  renderer.render(scene, camera);
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.__game = {
  describe: () => ({ name: 'moon lander', keys: { ' ': 'hold to fire the engine', ArrowLeft: 'hold to drift left', ArrowRight: 'hold to drift right', Enter: 'play again' } }),
  observe: () => ({ x: +x.toFixed(2), y: +y.toFixed(2), speed: +(-vy).toFixed(2), fuel: +fuel.toFixed(1), landed, crashed }),
  act,
  setState: s => { ({ x = x, y = y, fuel = fuel, landed = landed, crashed = crashed } = s); if (s.speed !== undefined) vy = -s.speed; },
  subject: ship,
};
</script>
</body></html>
```

The `look` in the third step left notes that were not acted on in the session: the picture is mostly black (it is space), the moon is a flat grey with its far edge in view, and the ship is small on screen. Each of those is one more request, and each request is more time; that is how a game grows.

## Where the time went: the change that broke a rule

The step that took a second look is the steering change. Making it took a few seconds; finding out what it broke took one `test`, which reruns every check saved earlier, each on a fresh copy of the page. These are its replies from the session, before and after the landing check was played again with steering:

```text
test {}

✓ free-fall-crashes
✗ soft-landing: landed false, expected true
✓ fuel-runs-out
2 of 3 saved checks passed in 1.0 s

test {}

✓ free-fall-crashes
✓ fuel-runs-out
✓ soft-landing
✓ off-pad-crashes
4 of 4 saved checks passed in 1.1 s
```

Without the saved checks, the broken landing would have shown up later, when someone played it and could not land, and finding which change caused it costs more time than the change itself. For a beginner this is the usual way a session gets long: not the first version, but the fifth change undoing the second. [Vibe coding bugs](/guides/vibe-coding-bugs) is about that.

## What makes it take longer

For a person, these are what add the hours, roughly in order:

- **Deciding.** What the game is, what it should feel like, what to leave out. [AI prompt to make a game](/guides/ai-prompt-to-make-a-game) turns that into a request.
- **Playing.** Whether it is fun is a person's call, and a game that feels good takes many rounds of playing, thinking and asking.
- **Asking one change at a time.** Slower per request, faster overall, because a broken change is easy to find.
- **Looks and sound.** Models, textures, effects, music and menus each add requests.
- **Size.** Levels, saving, enemies with their own behaviour and online play each multiply the work. Game jams, events where people make a whole game over a weekend, are a good guide to what fits in a weekend: one idea, done well.

Without AI, the same small game is a programming exercise, and the time is mostly learning: JavaScript, three.js, and how a game loop (the code that moves things and draws a new picture many times a second) works. No single number covers that, because it depends on what you know when you start.

## Building for a set time

In Claude Code with the paprika3d plugin, you can also give the agent a time instead of a list of steps:

```text
/paprika3d:paprika-loop a moon lander with steering, three landing pads and a fuel gauge for 2 hours
```

It asks the brief's questions first (what the game is, what it must have, pictures to work from), writes the answers to `paprika-loop/PROMPT.md`, and then runs by itself until the time is up, an hour when no time is given. Each round, a fresh builder session makes as many improvements as fit, and a separate judge session scores the game against your brief's "must have" list and writes the next improvements. Every round is saved as a commit, and the highest-scored one is kept under the name `paprika-loop/best`; `paprika-loop/REPORT.md` appears at the end. You can edit `PROMPT.md` while it runs, and the next sessions follow the new text. Afterwards, `test` reruns the saved checks and says which rules still hold.

What it does not do: it does not make the time go further than the sessions it runs, each of which is billed as a Claude Code session, and it does not decide whether the game is fun. It was not run for this page, so this page shows no times for it. It needs `claude` and `git` on the computer; [how to make a game with Claude Code](/guides/make-a-game-with-claude-code) covers setting up the first.

## What to do next

Give yourself one evening for a first game: one idea, a clear request, and as many rounds of playing and changing as fit. Stop when it is fun, not when it is big. If you have not picked an idea yet, [what game should I make first](/guides/what-game-should-i-make-first) lists small ones; [how to vibe code a game](/guides/how-to-vibe-code-a-game) walks through the rounds of asking and checking.
