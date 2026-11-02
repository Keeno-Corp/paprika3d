---
title: How to make a mobile game with AI: a three.js browser game that plays on a phone
phrase: how to make a mobile game with ai
description: How to make a mobile game with AI when you have never made a game: why a browser game is the short road to a phone, the first request to type, a small three.js skiing game steered by swiping, the four things that make a page play well on a phone, what to check when it does not, and how an AI agent with paprika3d pictures it at phone sizes and swipes it itself.
meta: How to make a mobile game with AI: a three.js browser game with swipe controls that fits a phone, opens from a link and needs no app store.
intent: make-a-mobile-game-with-ai
queries:
  - "make a mobile game with ai"
  - "can you vibe code a mobile game"
  - "Does mobile browser support Three.js application"
  - "How to control a first-person camera on touch devices?"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a mobile game with AI: a three.js browser game that plays on a phone

Yes, you can make a mobile game with AI without knowing how to code. The short road is a game that runs in the phone's web browser: an AI writes it as a web page, you put the page online, and anyone opens it from a link on their phone. Nothing to download, no app store review, and the same game plays on a computer too.

This page builds one: a skier going down a slope, steered by swiping a finger left and right, with trees to avoid. It covers what to ask the AI for, the game itself, the few things that make a page feel right on a phone, and what to check when it does not.

## A browser game or an app store game

There are two kinds of "mobile game". An **app** is installed from Apple's App Store or Google Play. Publishing one needs a developer account with each store, their build tools, and a review of every update. A **browser game** is a web page: it runs in Safari or Chrome on the phone, and you share it as a link.

Start with the browser game. It is the same work as the app's game, it is in a friend's hands the day you finish it, and if you want a store later, tools such as Capacitor wrap a finished web game into an app. Phone browsers run 3D well: three.js, a free JavaScript library (a bundle of ready-made code) that draws 3D in a web page, works in the browsers of current phones.

## What you need

- **An AI coding agent.** An AI that works inside a folder on your computer: it writes the files, runs commands and reads what they print. Claude Code, Cursor and Codex are examples. [How to vibe code a game](/guides/how-to-vibe-code-a-game) explains the loop of asking for a game and changing it one request at a time; this page adds what a phone needs.
- **A computer.** You build on a computer and test on the phone. The agent runs in a terminal (the window where you type commands) or in an editor.
- **A phone with a browser,** to play each version on.

## The first request to type

Say that it is for a phone, and name the controls a finger can do:

```text
Make a small 3D skiing game with three.js, in one index.html file that loads three
from a CDN with an import map. It must play on a phone held upright or sideways.
The skier goes down the slope by itself; I steer by dragging a finger left or right
anywhere on the screen. The arrow keys also steer, for testing on a computer.
Trees are spread down the slope: touching one ends the run, reaching 300 m wins,
and a tap starts again. Keep it light for a phone: cap the pixel ratio at 2 and
draw all the trees as one instanced mesh. Show the distance at the top.
```

The last two sentences of the request are phone advice the AI may not apply unless asked. The page below explains each.

## The game

Here is a page of the kind that request asks for, written for this guide:

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Slope</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;height:100%;overflow:hidden;background:#cfe3f2}canvas{display:block;touch-action:none}
#hud{position:fixed;top:12px;left:0;right:0;text-align:center;font:600 20px system-ui;color:#123;pointer-events:none}</style></head>
<body>
<div id="hud">Swipe to steer</div>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rules: the skier goes down the slope by itself; you steer left and right. A tree ends the run, 300 m wins.
const SPEED = 12, STEER = 8, EDGE = 6, FINISH = 300;
let x = 0, targetX = 0, distance = 0, crashed = false, finished = false;
const trees = [];
for (let z = 20; z < FINISH; z += 6) trees.push({ x: (Math.random() * 2 - 1) * EDGE, z });

function step(dt) {
  if (crashed || finished) return;
  x += Math.max(-STEER * dt, Math.min(STEER * dt, targetX - x)); // slide toward where the finger points
  distance += SPEED * dt;
  for (const t of trees) if (Math.abs(t.z - distance) < 0.6 && Math.abs(t.x - x) < 0.7) crashed = true;
  if (distance >= FINISH) finished = true;
  hud.textContent = crashed ? 'Crashed! Tap to try again' : finished ? 'Finished! Tap to go again' : `${Math.floor(distance)} m`;
}
function restart() { x = targetX = distance = 0; crashed = finished = false; }

// The picture. The pixel ratio is capped at 2: a phone's screen can be 3, which is more than twice the pixels to draw.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfe3f2);
scene.fog = new THREE.Fog(0xcfe3f2, 20, 70);
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 3));
const snow = new THREE.Mesh(new THREE.PlaneGeometry(2 * EDGE + 8, FINISH + 60), new THREE.MeshStandardMaterial({ color: 0xf4f8fb }));
snow.rotation.x = -Math.PI / 2; snow.position.z = 10 - FINISH / 2; snow.name = 'snow';
scene.add(snow);
const skier = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0xe0402a }));
skier.name = 'skier';
scene.add(skier);
const pines = new THREE.InstancedMesh(new THREE.ConeGeometry(0.7, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0x2f6b3a }), trees.length);
trees.forEach((t, i) => pines.setMatrixAt(i, new THREE.Matrix4().makeTranslation(t.x, 1.1, -t.z)));
pines.name = 'trees';
scene.add(pines);
const hud = document.getElementById('hud');

// Fit the screen, held either way: a tall phone gets a wider view so the slope's edges stay in the picture.
function fit() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < 1 ? 80 : 60;
  camera.updateProjectionMatrix();
}
addEventListener('resize', fit);
fit();

// Touch, mouse and pen: one set of pointer events. Dragging a finger across the screen moves the skier's line.
let from = null;
addEventListener('pointerdown', e => { if (crashed || finished) restart(); from = { px: e.clientX, x: targetX }; });
addEventListener('pointermove', e => { if (from) targetX = Math.max(-EDGE, Math.min(EDGE, from.x + (e.clientX - from.px) / innerWidth * 2 * EDGE)); });
addEventListener('pointerup', () => { from = null; });
addEventListener('pointercancel', () => { from = null; });
// Arrow keys too, for playing on a computer.
const held = new Set();
function act({ key, down = true }) { if (down) held.add(key); else held.delete(key); }
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));

let last = null;
renderer.setAnimationLoop(now => {
  const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;
  const dir = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
  if (dir) targetX = Math.max(-EDGE, Math.min(EDGE, targetX + dir * STEER * dt));
  step(dt);
  skier.position.set(x, 0.6, -distance);
  skier.rotation.z = (x - targetX) * 0.3;
  camera.position.set(x * 0.5, 4, -distance + 7);
  camera.lookAt(x * 0.5, 0, -distance - 8);
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'slope', keys: { ArrowLeft: 'hold to steer left', ArrowRight: 'hold to steer right' }, touch: 'drag left or right to steer' }),
  observe: () => ({ x: +x.toFixed(2), targetX: +targetX.toFixed(2), distance: +distance.toFixed(1), crashed, finished }),
  act,
  setState: s => { if (s.x !== undefined) x = targetX = s.x; if (s.distance !== undefined) distance = s.distance;
    if (s.crashed !== undefined) crashed = s.crashed; if (s.finished !== undefined) finished = s.finished; },
  subject: 'skier',
};
</script>
</body></html>
```

It has the parts every small game has: the rules (`step`, which moves the game on by the time since the last frame), the picture (a scene, a camera, a light and the objects), the controls, and the game loop (the function the browser runs once per screen refresh, which moves the game on and then draws it). The `window.__game` object at the end lets a testing tool read the distance and steer the skier the way a player does; a player never sees it.

## What makes it a phone game

Four parts of that page are there for the phone. Each one is a thing to ask for by name when the AI leaves it out.

1. **The viewport tag.** `<meta name="viewport" content="width=device-width, initial-scale=1">` tells a phone browser the page is made for a phone's width. Without it, the phone draws the page as if on a wide desktop screen and shrinks it, so the text comes out tiny.
2. **Touch that the browser leaves alone.** A finger dragged across a page normally scrolls or zooms it. `touch-action: none` on the canvas (the rectangle three.js draws into) keeps the drag for the game. The controls are pointer events (`pointerdown`, `pointermove`, `pointerup`), which a mouse, a pen and a finger all send, so one set of code steers on every device.
3. **A screen held either way.** The `fit()` function runs at the start and every time the window changes size, as it does when a phone turns. It resizes the canvas and fixes the camera's shape so the picture never stretches, and it widens the view when the screen is taller than wide, so the trees at the slope's edges stay in sight upright.
4. **Less to draw.** Phone screens pack 2 or 3 tiny pixels into each point (the device pixel ratio). Drawing every one costs a phone's graphics chip a lot for little you can see, so `setPixelRatio(Math.min(devicePixelRatio, 2))` caps it. And all 47 trees are one `InstancedMesh`: one object drawn in many places, which the graphics chip draws as one job (a draw call) instead of 47.

## Try it on your phone

The page loads three.js from a CDN (a public server that hosts libraries), so it is one file with nothing to install. To open it on the phone, the page has to be on a web server the phone can reach:

- **On the same Wi-Fi:** in the game's folder, `npx vite --host` starts a small local web server and prints a "Network" address. Type that address into the phone's browser.
- **Online:** upload the folder to a free host and send the link. [How to put your game online](/guides/put-your-game-online) walks through itch.io, GitHub Pages and Netlify Drop.

To make it feel like an app, open the link and add it to the home screen: on an iPhone, Safari's Share button and then "Add to Home Screen"; on Android, Chrome's menu and then "Add to Home screen" (or "Install app"). It gets an icon and opens like any other app, with no store in between.

## When it does not work on the phone

- **The page scrolls, bounces or zooms when you swipe.** The canvas is missing `touch-action: none`, or the game listens on an element that does not cover the screen.
- **Nothing happens when you touch it.** The game listens for keys or for `click` and nothing else. Ask for pointer events.
- **The picture is stretched or cut off after turning the phone.** The resize code is missing or does not update the camera; [the responsive canvas guide](/guides/threejs-responsive-canvas-resize) shows the whole fix.
- **It runs slowly or the phone gets warm.** Check the pixel ratio cap first, then how many objects and triangles it draws. Shadows and post-processing effects cost a phone far more than a computer.
- **A blank page.** The same faults as on a computer; [HTML game not working](/guides/html-game-not-working) goes through them in order. For textures that come out black on an iPhone, see [glTF textures black on iOS](/guides/threejs-gltf-textures-black-ios).

## Letting the agent check it at phone sizes

Testing on a phone after every change means picking the phone up, reloading and describing to the AI what you saw. paprika3d is a plugin for Claude Code (and an MCP server, a tool server other agents can use) that gives the agent a browser of its own, so it pictures the page at phone sizes and plays it with touch steps itself. Two commands in the terminal install it:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

These replies were captured on 2026-10-30 on the game above, on a Linux server with no graphics card (Chrome drew in software), cut to the lines this page discusses with nothing reworded. `look` with `viewports` loads the page fresh at each size and pictures them side by side; here an upright phone, the same phone sideways, and a desktop screen:

```text
look {"viewports":["phone",[844,390,3],"desktop"]}

Picture: <project>/paprika3d/runs/2026-10-30T23-15-50-733Z/look-3-viewports.png (3 viewports, left to right, top to bottom, each on a fresh reload); the game is reloaded at its own size and first frame
phone 390x844@3: subject skier 0.62%, 15 on screen. Canvas: 780x1688 buffer for 390x844 CSS at DPR 3 (renderer pixel ratio 2, capped below DPR 3); resize handler ran.
844x390@3: subject skier 0.28%, 15 on screen. Canvas: 1688x780 buffer for 844x390 CSS at DPR 3 (renderer pixel ratio 2, capped below DPR 3); resize handler ran.
desktop 1920x1080@1: subject skier 0.34%, 15 on screen. Canvas: 1920x1080 buffer for 1920x1080 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
```

At every size the skier and the same 15 objects are on screen, the resize code ran, and the pixel ratio cap held on the phone. `interact` then opens the page at a phone's size and swipes it: a finger down at the middle of the screen, dragged right in two moves, and lifted. `trace` follows two values each frame:

```text
open {"url":"index.html","cwd":"<project>","size":[390,844],"dpr":3}
interact {"steps":[{"wait":10},{"touch":"start","x":195,"y":600},{"touch":"move","x":240,"y":600,"frames":5},{"touch":"move","x":290,"y":600,"frames":5},{"touch":"end","x":290,"y":600},{"wait":30}],"trace":["targetX","x"]}

{"changed":{"x":2.92,"targetX":2.92,"distance":10.4},"logs":["warn: THREE.WARNING: Multiple instances of Three.js being imported."]}
touch start at (195, 600): over snow (Mesh, 7.1 units)
targetX: 0 → 2.92 at frame 22; first changed at frame 12
x: 0 → 2.92 at frame 33; first changed at frame 12
```

The swipe set where the skier is heading (`targetX`), and the skier slid there over the next frames. (The warning in `logs` comes from the tool, not the game: to name the object under the finger it loads a second copy of three.js into the page.) The same swipe on a copy of the page whose canvas lacks `touch-action: none`:

```text
interact {"steps":[{"wait":10},{"touch":"start","x":195,"y":600},{"touch":"move","x":240,"y":600,"frames":5},{"touch":"move","x":290,"y":600,"frames":5},{"touch":"end","x":290,"y":600},{"wait":30}],"trace":["targetX","x"]}

{"changed":{"x":1.38,"targetX":1.38,"distance":10.4},"logs":["warn: THREE.WARNING: Multiple instances of Three.js being imported."]}
touch start at (195, 600): over snow (Mesh, 7.1 units)
targetX: 0 → 1.38 at frame 12; first changed at frame 12
x: 0 → 1.38 at frame 22; first changed at frame 12
```

The first move got through, then Chrome took the rest of the drag for scrolling and the skier stopped at 1.38 instead of 2.92. On a phone that feels like a game that steers a little and then ignores you; here the agent reads it in two numbers, without you describing it. `perf` with `budget: "mobile"` holds the page to a phone's limits, here with `throttle` slowing the page's JavaScript four times:

```text
perf {"budget":"mobile","throttle":4}

57.7 ms median frame (p95 77.7 ms, 16 fps on average), 3 draw calls, 778 triangles, 0 MB assets; over budget: frameMs 57.7 of 16.7 ms; mobile budget; software renderer (no GPU): frame time is no budget signal, do not optimize for it
Measured with the page's JavaScript slowed 4× (a weak laptop); the GPU was not slowed.
Textures 0 MB on the GPU (largest 0 px), 2 shader programs, pixel ratio 2, heap 9.24 MB, 66 long tasks, 0 frames over 3× the median (GC-like pauses); noise between two samples 0.3 ms.
```

The counts are what carry over to a phone: 3 draw calls (the snow, the skier and all the trees together) and 778 triangles, far inside the mobile budget's 100,000 triangles. The frame time is not: this server has no graphics card, and the reply says so itself. On a computer with one, the same call gives a frame time to compare against the 16.7 ms a frame that 60 frames a second allows.

What it does not do: it is not a phone. It emulates a phone's screen size and pixel ratio in desktop Chrome, it cannot measure a phone's graphics chip, and it cannot tell you how a swipe feels under a thumb. Open the link on a real phone before you share it.

## What to do next

- A joystick and buttons on screen, for a game where you walk around: [three.js virtual joystick](/guides/threejs-virtual-joystick-mobile-touch-controls).
- Making a crash feel like a crash, with a shake and a sound: [how to make a game feel good](/guides/make-a-game-feel-good).
- The same game made in Cursor instead of Claude Code: [how to make a game with Cursor](/guides/make-a-game-with-cursor).
- Not sure what to build? [What game should I make first?](/guides/what-game-should-i-make-first)
- Filling the phone's whole screen: [how to make a browser game full screen](/guides/make-a-browser-game-full-screen).
- A game played by swiping: [how to make a fruit ninja game](/guides/make-a-fruit-ninja-game).
