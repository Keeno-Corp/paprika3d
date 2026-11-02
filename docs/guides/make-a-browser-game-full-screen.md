---
title: How to make a browser game full screen in three.js: a button, the resize and the phone
phrase: how to make a browser game full screen
description: How to make a browser game full screen: first make the canvas fill the window and follow its size, then add a full screen button and an F key with the Fullscreen API (asked for on a click, the whole page so the score stays on top, Escape to leave), and what a phone allows, shown on a small three.js aquarium, with paprika3d checking the picture fills a full screen's size.
meta: How to make a browser game full screen: fill the window, a Fullscreen API button and F key, and the phone, on a small three.js aquarium.
intent: make-a-browser-game-full-screen
queries:
  - "how to make a browser game full screen"
  - "html game fullscreen buttons"
  - "How can I make the HTML5 canvas go fullscreen?"
  - "[SOLVED] Fullscreen is not really fullscreen?"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a browser game full screen in three.js: a button, the resize and the phone

A browser game goes full screen in two steps, and most problems come from doing the second without the first. Step one: the game's picture fills the browser window and follows it when the window changes size. Step two: a button (or a key) asks the browser to hide its own bars and the rest of the desktop, so the page covers the whole screen. Without step one, the screen goes black around a picture that stays the size it was, which is what people mean when they write that full screen is not really full screen. This page does both on a small three.js game, then covers phones, where the rules differ.

Some words first. The canvas is the rectangle on a web page that a game draws into. three.js is a JavaScript library that draws 3D graphics into a canvas. Its renderer is the part that does the drawing, and its camera decides what part of the scene is seen and at what shape.

## Three kinds of full screen

- **The canvas fills the window.** No browser bars disappear, but the game uses every pixel of the tab. Every game needs this, and it is all many need.
- **The page asks for full screen.** A button in the game calls the Fullscreen API, the browser's built-in way for a page to take the whole screen. The player leaves with the Escape key.
- **The player presses F11** (on a Mac, Control + Command + F). The browser goes full screen by itself; the page is never asked, but its window grows, so step one's code handles this too.

## The game: an aquarium

Four fish swim around a tank. Click anywhere in the water to drop a flake of food; it sinks, the nearest fish swims to it and eats it, and the counter goes up. The button at the top right, or the F key, switches full screen on and off. The whole game is one file:

```html
<!-- verify act=KeyF -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Aquarium</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;height:100%;overflow:hidden;background:#0b3d5c}canvas{display:block}
#fed{position:fixed;top:14px;left:18px;font:600 20px system-ui;color:#fff}
#full{position:fixed;top:12px;right:14px;font:600 16px system-ui;padding:8px 14px;border:0;border-radius:8px;background:#ffffffd0;cursor:pointer}</style></head>
<body>
<div id="fed">Fed: 0</div>
<button id="full">Full screen</button>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// Full screen: the whole page, so the score and the button stay on top of the picture.
const button = document.getElementById('full');
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});   // refused without a click or key press first
}
button.onclick = toggleFullscreen;
button.hidden = !document.fullscreenEnabled;   // false on an iPhone: Safari there has no full screen for a page
document.addEventListener('fullscreenchange', () => {
  button.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
});
function act({ key, down = true }) { if (down && key === 'KeyF') toggleFullscreen(); }
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.code }); });

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b3d5c);
scene.fog = new THREE.Fog(0x0b3d5c, 8, 20);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 50);
camera.position.set(0, 1.5, 9);
scene.add(new THREE.HemisphereLight(0xbfe8ff, 0x1c4a3a, 2.5));

// The resize handler: entering or leaving full screen, F11 and turning a phone all end here.
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

const sand = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 6), new THREE.MeshStandardMaterial({ color: 0xd8c08a }));
sand.name = 'sand';
sand.position.y = -2.2;
scene.add(sand);
for (let i = 0; i < 7; i++) {
  const weed = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.2 + (i % 3) * 0.5, 6), new THREE.MeshStandardMaterial({ color: 0x3fa35b }));
  weed.name = 'weed';
  weed.position.set(-5.5 + i * 1.8, -1.5 + (i % 3) * 0.25, -1.5);
  scene.add(weed);
}

const fishes = [0xff8c42, 0xffd23f, 0xee4266, 0x7bdff2].map((color, i) => {
  const fish = new THREE.Group();
  fish.name = 'fish';
  const mat = new THREE.MeshStandardMaterial({ color });
  fish.add(new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12).scale(1.5, 1, 0.6), mat));
  fish.add(new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.45, 4).rotateZ(-Math.PI / 2).translate(-0.7, 0, 0), mat));
  fish.position.set(-3 + i * 2, -0.5 + (i % 2), 0);
  fish.userData.goal = new THREE.Vector3();
  scene.add(fish);
  return fish;
});
const wander = fish => fish.userData.goal.set(Math.random() * 10 - 5, Math.random() * 3 - 1.4, Math.random() * 2 - 1);
fishes.forEach(wander);

// A click drops a flake of food where it lands on the front of the tank.
const foods = [], ray = new THREE.Raycaster(), front = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
let fed = 0;
function drop(sx, sy) {
  ray.setFromCamera(new THREE.Vector2(sx / innerWidth * 2 - 1, -(sy / innerHeight) * 2 + 1), camera);
  const p = ray.ray.intersectPlane(front, new THREE.Vector3());
  if (!p) return;
  const food = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color: 0x8b5a2b }));
  food.name = 'food';
  food.position.copy(p).setY(Math.min(p.y, 2.5));
  scene.add(food);
  foods.push(food);
}
renderer.domElement.addEventListener('pointerdown', e => drop(e.clientX, e.clientY));

function step(dt) {
  for (const food of foods) food.position.y = Math.max(-1.9, food.position.y - 0.6 * dt);
  for (const fish of fishes) {
    const near = foods.reduce((a, f) => !a || f.position.distanceTo(fish.position) < a.position.distanceTo(fish.position) ? f : a, null);
    const goal = near ? near.position : fish.userData.goal;
    const to = goal.clone().sub(fish.position);
    if (!near && to.length() < 0.3) wander(fish);
    fish.position.addScaledVector(to.normalize(), (near ? 2.2 : 1) * dt);
    fish.rotation.y = to.x < 0 ? Math.PI : 0;   // face the way it swims
    if (near && near.position.distanceTo(fish.position) < 0.35) {
      scene.remove(near);
      foods.splice(foods.indexOf(near), 1);
      fed++;
    }
  }
  document.getElementById('fed').textContent = `Fed: ${fed}`;
}

let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'aquarium', units: 'metres', keys: { KeyF: 'full screen on or off' }, mouse: 'click to drop food' }),
  observe: () => ({ fed, food: foods.length, fullscreen: !!document.fullscreenElement, width: innerWidth, height: innerHeight }),
  act,
  setState: s => { fed = s.fed ?? fed; },
};
</script>
</body></html>
```

## Step 1: fill the window and follow its size

Three parts of the file do this, and they are the same in any three.js game:

- **The page has no margin or scrollbars**: `html,body{margin:0;height:100%;overflow:hidden}` and `canvas{display:block}` in the style. Without them a browser's default margin leaves a white border and a scrollbar.
- **The renderer starts at the window's size**: `renderer.setSize(innerWidth, innerHeight)`, where `innerWidth` and `innerHeight` are the browser window's inside size.
- **A resize handler**: the `addEventListener('resize', ...)` block sets the renderer to the new size and tells the camera the new shape (`camera.aspect`, then `camera.updateProjectionMatrix()`). The browser calls it whenever the window changes size: dragging its corner, entering or leaving full screen, F11, or turning a phone.

That handler is the piece most first games lack. [three.js responsive canvas that resizes without stretching](/guides/threejs-responsive-canvas-resize) goes through it in detail, with the faults that each missing line causes.

## Step 2: the full screen button

The button and the F key both call `toggleFullscreen()`, near the top of the script. Four rules make it work:

1. **Ask from a click or a key press.** Browsers refuse full screen when a page asks by itself, on load or from a timer, so that no site can take over your screen uninvited. The `.catch(() => {})` after `requestFullscreen()` quietly ignores a refusal instead of filling the console with errors.
2. **Make the whole page full screen, not the canvas.** `document.documentElement.requestFullscreen()` takes the page, so the score and the button, which are HTML on top of the canvas, stay visible. Calling `requestFullscreen()` on the canvas shows the canvas alone, and the score disappears.
3. **Escape always leaves, and you cannot stop it.** The browser shows its own short note about it when full screen starts. The `fullscreenchange` event tells the game it happened either way, so the button's label can change (or the game can pause).
4. **Let the resize handler do the resizing.** Entering full screen changes the window's size, the browser fires `resize`, and step one's handler fits the picture. No size code belongs in the button.

## Step 3: phones

On Android, Chrome runs the same button as on a computer. On an iPhone, Safari allows full screen for videos and not for a web page, so `document.fullscreenEnabled` is `false` there, and the line `button.hidden = !document.fullscreenEnabled` hides the button rather than showing one that does nothing. An iPad allows it. The game still fills the screen below Safari's address bar, because step one's code fits whatever space there is. If the bars matter for your game, a player can add the page to the Home Screen from Safari's share menu; a page with a web app manifest (a small file describing the app) that sets `"display": "standalone"` then opens from that icon without Safari's bars.

Turning a phone sideways fires `resize` too, so the same handler covers it. A phone also has no F key and no mouse: [three.js virtual joystick and mobile touch controls](/guides/threejs-virtual-joystick-mobile-touch-controls) adds buttons for touch.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that edits the files in your project folder) can add all three steps to a game that already exists:

```text
Make my three.js game full screen.
First make the canvas fill the browser window with no margin or scrollbars, and add a resize
handler that updates the renderer size and the camera's aspect.
Then add a "Full screen" button in the top right corner and the F key: they should call
requestFullscreen on the whole page (document.documentElement), so my score stays visible,
and the button should say "Exit full screen" while it is on.
Hide the button when document.fullscreenEnabled is false.
Check that the picture fills the screen at 1920 by 1080 and on a phone size.
```

## Checking it without a big screen

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens a game in a hidden Chrome browser so the agent can see and play what it wrote. A hidden browser has no screen to fill: on this machine it granted the request when the F key was pressed (the game's `fullscreen` value turned `true`) and kept the window at its size. So the agent checks the part that can go wrong, the picture following a new size, with a `resize` step that gives the window a full screen's size.

Here is the aquarium with its resize handler deleted, given the size of a common 1920 by 1080 monitor. `interact` plays the steps, and `look: true` adds a screenshot and what is on it:

```text
interact {"steps": [{"resize": [1920, 1080]}, {"wait": 10}], "look": true}

{"changed":{"width":1920,"height":1080}}
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); a fixed buffer CSS scales at its own shape (or a resize handler that waits for frames).
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#fed "Fed: 0" [18, 14, 89, 36].
```

The window became 1920 by 1080, but the canvas stayed 1280 by 800 in its top left corner, and the button now sits off the picture, so the HTML over the canvas counts one item where there were two. That is the "not really full screen" picture. With the handler back, the same check after an F key press:

```text
interact {"steps": [{"key": "KeyF"}, {"resize": [1920, 1080]}, {"wait": 10}], "look": true}

{"changed":{"fullscreen":true,"width":1920,"height":1080}}
Canvas: 1920x1080 buffer for 1920x1080 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
HTML over the canvas: 2 (div via page, button via page), 0 overlap, 0 off-screen, 0 cut off: div#fed "Fed: 0" [18, 14, 89, 36], button#full "Exit full screen" [1724, 12, 1905, 45].
On screen (16):
sand 16% [0, 878, 1919, 1079] 14 × 6 units, across the view
fish ×8 2.3% [464, 616, 1432, 846]
weed ×7 0.89% [336, 695, 1561, 930] 1.2–2.2 × 0.3 units
Never visible: none
```

The canvas matches the window, the button reads "Exit full screen" in the top right corner, and everything is in view. `look` with `viewports` then loads the game fresh at a phone's, a laptop's and a desktop's size and pictures each:

```text
look {"viewports": ["phone", "laptop", "desktop"]}

phone 390x844@3: no subject, 8 on screen. Canvas: 780x1688 buffer for 390x844 CSS at DPR 3 (renderer pixel ratio 2, capped below DPR 3); resize handler ran.
laptop 1440x900@2: no subject, 16 on screen. Canvas: 2880x1800 buffer for 1440x900 CSS at DPR 2 (renderer pixel ratio 2); resize handler ran.
desktop 1920x1080@1: no subject, 16 on screen. Canvas: 1920x1080 buffer for 1920x1080 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
```

All three canvases are the right size. The phone, held upright, shows 8 objects where the others show 16: a tall, narrow screen cuts the sides of a wide tank. That is the camera, not full screen, and the responsive canvas guide linked above shows how to move the camera back on a narrow screen. The pixel ratio cap (`setPixelRatio(Math.min(devicePixelRatio, 2))` in the file) keeps a phone from drawing nine pixels for every one it shows.

These replies were captured on 2026-10-31 on a machine with no graphics card, where Chrome draws in software; some lines of each reply are left out (the screenshot paths, the colour lines, a note that the sand is a flat colour, and the first reply's list of objects). paprika3d cannot test the real full screen switch, an iPhone or Safari: try those on the devices. To add it to Claude Code (it needs Google Chrome and Node.js):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Without paprika3d

Open the game in a browser and try each way in and out: the button, the F key, Escape, and F11. Then drag the window's corner to make it small and large; the picture should follow each time with no black strip or stretched fish. Most browsers can also show the page at a phone's size: in Chrome, press F12 and choose the toggle device toolbar button. Try a real phone before you share it.

## What to do next

- Put the game online so the button can be tried on any device: [how to put your game online](/guides/put-your-game-online).
- Put the full screen button on a screen of its own before play: [how to add a game over screen](/guides/add-a-game-over-screen) shows a screen of HTML over the game.
- Make the fish react more when they eat: [how to make a game feel good](/guides/make-a-game-feel-good).
