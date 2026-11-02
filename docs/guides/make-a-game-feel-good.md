---
title: How to make a game feel good: what reacts to each hit and pickup in a three.js game
phrase: how to make a game feel good
description: How to make a game feel good, for a first game: give every catch, hit and pickup a reaction on the same frame (a pop, a flash, sparks, a small shake, a sound), shown on a small three.js star-catching game you can paste, with the words to give an AI agent and paprika3d's feel tool listing what reacted before and after.
meta: How to make a game feel good: a pop, a flash, sparks and a shake on the frame of each catch, in a small three.js game, checked with feel.
intent: make-a-game-feel-good
queries:
  - "how to make a game feel good"
  - "how to make my game more fun"
  - "what makes a game enjoyable"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a game feel good: what reacts to each hit and pickup in a three.js game

A game feels good when everything the player does gets an answer straight away. You press a key and the character moves at once; you catch a star and the basket bounces, sparks fly and a chime plays, all in the same instant. Game makers call this "game feel", and the extra reactions are often called "juice". A game can have correct rules and still feel flat, because a catch that changes a number in the corner gives the player nothing to notice.

This page is for a first game: what to add, the words to give an AI coding agent, a small game to try it on, and how to check what reacted without describing it yourself.

## Give every event a reaction on the same frame

An event is anything that happens in the game: a catch, a hit, a jump, a pickup, a death, a win. A frame is one of the pictures a game draws many times a second. "On the same frame" means the reaction starts in the very picture where the event happens, so the player sees the cause and the answer together; a reaction that comes later reads as lag.

The usual reactions, from small to large:

- **A pop.** The thing that caught or got hit swells a little and shrinks back over a fifth of a second.
- **A flash.** It glows brighter for that moment and fades.
- **Particles.** Small pieces (sparks, dust, stars) fly out from the spot and fade.
- **A shake.** The camera, the player's eye on the scene, jumps a little and settles. Keep it small and short, or it hides the game.
- **A sound.** A short chime for good things, a thud for bad ones. Sound has its own page: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- **The score.** The number changes on the same frame, not a moment later.

Match the size of the reaction to the size of the event. A catch gets a small pop and a few sparks; clearing a level gets all of them at once, and larger. If everything shakes the screen, nothing stands out.

## What makes a game enjoyable beyond the reactions

Reactions make a game pleasant to touch; they do not make it fun on their own. Most small games people enjoy also have a clear goal (catch the stars), a choice to make every few seconds (which way to move), a challenge that grows (stars fall faster), a fair way to lose with a quick restart, and something to beat (a high score). If your game lacks one of these, that may matter more than any sparkle: see [how to add a game over screen](/guides/add-a-game-over-screen), [how to save the high score](/guides/save-the-high-score) and [how to make levels in a game](/guides/make-levels-in-a-game). No tool can tell you whether a game is fun; play it, and watch someone else play it without helping them.

## A small game to try it on

Star catch: stars fall one at a time, and you move a basket with the left and right arrow keys to catch them. three.js is a JavaScript library that draws 3D scenes in a web page, and the whole game is one HTML file. The `<script type="importmap">` line tells the browser where three.js is: here, a `node_modules/three` folder next to the file, which `npm install three` makes in that folder. [How to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains each part of such a page and how to open it.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Star catch</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}#hud{position:fixed;top:16px;left:20px;font:600 22px system-ui;color:#fff}</style></head>
<body>
<div id="hud">Stars: 0</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const DROPS = [-3, 2, -1, 3.5, 0, -2.5, 1.5];   // where each star falls, in turn
const held = new Set();
let x = 0, starX = DROPS[0], starY = 7, n = 0, stars = 0, t = 0;
let pop = 0, shake = 0, sparkLife = 0, sparkX = 0; // seconds left of each reaction, and where the sparks fly from

function act({ key, down = true }) { if (down) held.add(key); else held.delete(key); }
addEventListener('keydown', e => act({ key: e.key }));
addEventListener('keyup', e => act({ key: e.key, down: false }));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b2140);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
const REST = new THREE.Vector3(0, 3, 11);        // where the camera sits when nothing shakes it
camera.position.copy(REST);
camera.lookAt(0, 3, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x404060, 3));

const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.6, 0.6, 24), new THREE.MeshStandardMaterial({ color: 0x40c0a0 }));
basket.name = 'basket';
const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), new THREE.MeshStandardMaterial({ color: 0xffd040 }));
star.name = 'star';
const sparks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), new THREE.MeshBasicMaterial({ color: 0xffe080 }), 12);
sparks.name = 'sparks';
sparks.count = 0;
scene.add(basket, star, sparks);
const hud = document.getElementById('hud');

// Every reaction to a catch starts on the frame of the catch.
function react() {
  pop = 0.2;
  shake = 0.15;
  sparkLife = 0.5;
  sparks.count = 12;
  sparkX = x;
}

function drop() { n++; starX = DROPS[n % DROPS.length]; starY = 7; }

function step(dt) {
  t += dt;
  x = THREE.MathUtils.clamp(x + ((held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0)) * 6 * dt, -4.5, 4.5);
  starY -= 3 * dt;
  if (starY < 0.6 && Math.abs(starX - x) < 0.9) {
    stars++;
    hud.textContent = `Stars: ${stars}`;
    react();
    drop();
  } else if (starY < -1) drop();
  pop = Math.max(0, pop - dt);
  shake = Math.max(0, shake - dt);
  sparkLife = Math.max(0, sparkLife - dt);
}

const m = new THREE.Matrix4();
function draw() {
  const k = pop / 0.2;                           // 1 on the catch, 0 when the pop is over
  basket.position.x = x;
  basket.scale.setScalar(1 + 0.4 * k);
  basket.material.emissive.setScalar(0.6 * k);
  star.position.set(starX, starY, 0);
  star.rotation.y = t * 3;
  camera.position.set(REST.x + Math.sin(t * 61) * shake, REST.y + Math.cos(t * 47) * shake, REST.z);
  const r = (0.5 - sparkLife) * 5, s = sparkLife * 2;
  for (let i = 0; i < sparks.count; i++) {
    const a = (i / 12) * Math.PI * 2;
    sparks.setMatrixAt(i, m.makeScale(s, s, s).setPosition(sparkX + Math.cos(a) * r, 0.4 + Math.sin(a) * r, 0));
  }
  sparks.instanceMatrix.needsUpdate = true;
  if (sparkLife === 0) sparks.count = 0;
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
let last = null;
renderer.setAnimationLoop((now) => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  draw();
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'star catch', units: 'world units', keys: { ArrowLeft: 'hold to move left', ArrowRight: 'hold to move right' } }),
  observe: () => ({ x: +x.toFixed(2), starX, starY: +starY.toFixed(2), stars }),
  act,
  setState: (s) => { x = s.x ?? x; starX = s.starX ?? starX; starY = s.starY ?? starY; stars = s.stars ?? stars; },
  subject: basket,
};
</script>
</body></html>
```

Every reaction is in `react()`, which runs on the frame of the catch: the basket swells and glows for 0.2 seconds (`pop`), the camera shakes and settles (`shake`), and a ring of sparks flies out from the basket (`sparkLife`). `draw()` turns those countdowns into what you see on each frame. Delete the one line `react();` and the game plays the same and feels flat: try it both ways.

`window.__game` at the end is a small object that lets a test tool read the game's state (where the basket and the star are, how many were caught) and set up a moment, such as a star just above the basket. A player never notices it.

## What to ask your AI agent

If an AI coding agent (an assistant such as Claude Code that writes and edits the files in your project) builds the game with you, ask for the reactions event by event and say what each one should do. For example:

```text
In my star catch game, make catching a star feel good. On the frame of the catch:
make the basket swell to 1.4 times its size and glow, then shrink back over 0.2 seconds;
throw a ring of 12 small sparks out from the basket that fade over half a second;
shake the camera a little for a moment. Keep the rules exactly as they are.
Then list each event in the game (a catch, a miss) and what reacts to it.
```

The last line asks for a list you can read in a few seconds. On this game it would show the gap: a miss, where the star falls past the basket, has no reaction at all. Give it a small one of its own, such as a grey puff where the star landed.

## Let the agent check what reacted

An agent reads text; it cannot see the game it wrote, so it cannot tell whether the sparks appeared unless something looks for it. paprika3d is a plugin for Claude Code (and an MCP server, the standard way to give tools to other coding agents) that opens the game in a hidden Chrome browser and lets the agent look at it and play it. Its `feel` tool plays an event and lists what reacted on screen, with the frame each reaction came on.

Here it is on the game above with `react();` deleted. The setup step puts the basket under a star about to land, then the game runs for 20 frames:

```text
feel {"steps": [{"state": {"x": 2, "starX": 2, "starY": 1.5}}, {"wait": 20}]}

Watched the steps' 20 frames and 45 frames after them, counted from the first step.
Moved during the steps: star 5.45 units.
Smooth moves (a new position on 3+ consecutive frames): 1 (star).
Teleports (a jump over 0.5 units between two watched frames, 4× the moves either side of it; a respawn is one, a glitch only for something that should glide): 1 (star at frame 18, 6.4 units).
No change in: camera (no shake), scale (no pops), colour (no flashes), spawns, removals.
HUD text: changed in one frame.
Sounds started: 0.
State: starY 1.45 → 4.65, stars 0 → 1.
```

The catch counted (stars 0 → 1) and the HUD text changed, and nothing else did: no shake, no pop, no flash. The star listed as a teleport is the next star appearing at the top, which is what a respawn looks like. With `react();` back:

```text
feel {"steps": [{"state": {"x": 2, "starX": 2, "starY": 1.5}}, {"wait": 20}]}

Watched the steps' 20 frames and 45 frames after them, counted from the first step.
Moved during the steps: star 5.45 units.
Camera: shook up to 0.165 at frame 19 and came back.
Scale pops (scale changed over 2+ frames and came back): 1 (basket at frame 18).
Smooth moves (a new position on 3+ consecutive frames): 1 (star).
Teleports (a jump over 0.5 units between two watched frames, 4× the moves either side of it; a respawn is one, a glitch only for something that should glide): 1 (star at frame 18, 6.4 units).
Colour flashes (colour, emissive or a page overlay's opacity changed and came back): 1 (basket at frame 18).
Particles: sparks 0 → 12 at frame 18, 0 left at the end.
No change in: spawns, removals.
HUD text: changed in one frame.
Sounds started: 0.
State: starY 1.45 → 4.65, stars 0 → 1.
```

Each reaction is there, on the frames of the catch: the camera shake, the basket's pop and flash, and 12 sparks that were all gone by the end. "Sounds started: 0" is the next thing to add, and [the sound page](/guides/make-sound-effects-for-a-game) adds it. These replies were captured on 2026-10-30 on a machine with no graphics card, where Chrome draws in software; none of them depends on speed.

`open` also writes a file called `fx.js` into the project with ready-made versions of these reactions: `burst` for particles, `shake` for a camera shake and `sfx` for sounds made in code with no audio files, so the agent can add each in a line or two. [three.js camera shake and hit feedback](/guides/threejs-camera-shake-hit-feedback) uses all three on a game where a crate gets hit.

paprika3d does not judge whether your game is fun or whether a reaction is too much. It reports what moved, flashed, popped and played after an event, and on which frame; whether that feels right is yours to decide by playing. To add it to Claude Code (it needs Google Chrome and Node.js on your computer), run these two lines in a terminal, the text window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

Then ask the agent in your own words; the `threejs-game` skill it adds tells the agent what each tool shows.

## Without paprika3d

Watch the event slowly. Record the screen while you play (most computers have a screen recorder built in) and step through the video a picture at a time: the pop and the sparks should start in the picture where the star touches the basket. You can also ask the agent to print a line to the browser console (the panel of messages a page writes, opened with F12) for each event and each reaction, with the frame number, and read them side by side.

## Next steps

- Give each event a sound: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Make the scene itself look better: [how to make my game look better](/guides/make-my-game-look-better).
- Add more to play: [how to make levels in a game](/guides/make-levels-in-a-game).
- Send it to a friend: [how to put your game online](/guides/put-your-game-online).
- The whole build loop with an agent (describe, run, look, play): [how to vibe code a game](/guides/how-to-vibe-code-a-game) and [build a three.js game with an AI agent](/guides/ai-agent-build-threejs-game).
- A game built around hits that land hard: [how to make a fighting game](/guides/make-a-fighting-game).
