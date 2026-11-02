---
title: How to add controller support to a game: the Gamepad API in a three.js game
phrase: how to add controller support to a game
description: How to add controller support to a browser game with the Gamepad API, no library needed: the pad appears after a button press, navigator.getGamepads() is read every frame, a dead zone stops a resting stick from drifting, a press is told apart from a held button, and keys and pad fill one input object. Shown on a small three.js hovercraft game, with paprika3d testing the gamepad code by faking a pad in the page.
meta: How to add controller support to a game with the Gamepad API: sticks, dead zones and button presses in a small three.js game.
intent: add-controller-support-to-a-game
queries:
  - "how to add controller support to a game"
  - "javascript game controller"
  - "How to detect a button press with Gamepad API?"
  - "How to map gamepad inputs for my platformer?"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to add controller support to a game: the Gamepad API in a three.js game

A browser game can read an Xbox, PlayStation or most other USB and Bluetooth controllers with no extra library: the browser has the Gamepad API built in. It works differently from the keyboard, and that difference is where first attempts go wrong. Keys send events when they go down and up; a gamepad sends none for its buttons and sticks. Instead, the game asks for the pad's current state once every frame with `navigator.getGamepads()` and decides for itself what changed. This page shows the four pieces that make that work, in a small three.js game (three.js is a JavaScript library that draws 3D graphics in a web page) that plays with a controller or the keyboard.

## The four pieces

1. **The pad appears after a button press.** For privacy, a browser hides controllers from a page until someone presses a button on one while the page is open. Until then, `navigator.getGamepads()` holds no pads (Chrome fills it with `null`), so the game says "press a button on it" rather than nothing.
2. **Read it every frame.** Inside the game loop (the function that runs about sixty times a second to move things and draw), call `navigator.getGamepads()` again and read the buttons and sticks from what it returns. Keeping one pad object from earlier can leave you with an old snapshot that never changes.
3. **A dead zone on each stick.** A stick at rest is never at exactly 0; it reads small values like 0.05 or -0.08, and a game that uses them drifts slowly on its own. Values below a threshold count as 0, and the rest is stretched so that movement still starts smoothly at the edge.
4. **A press is not a hold.** `button.pressed` is `true` for every frame the button is down. For something that should happen once per press (a jump, a dash, a menu choice), remember last frame's value and act when it goes from up to down.

And one habit that keeps the rest of the game simple: the keyboard and the pad both fill the same small input object (`x`, `y` and `dash` here), and the game reads that object, never the keys or the pad directly. Adding touch buttons later means filling the same object a third way.

## The game: hover arena

A hovercraft slides around a round arena, picking up glowing orbs. The left stick or the arrow keys (or WASD) push it, and it keeps sliding the way a hovercraft does; the bottom face button or Space gives one dash per press. The HUD names the controller once it is connected. The whole game is one file:

```html
<!-- verify act=ArrowUp -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Hover arena</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:14px;left:18px;font:600 18px system-ui;color:#fff;line-height:1.5}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const DEAD = 0.15;   // a stick at rest never reads exactly 0: smaller values count as 0
const deadzone = v => Math.abs(v) < DEAD ? 0 : (v - Math.sign(v) * DEAD) / (1 - DEAD);
const R = 10, ACCEL = 14, DRAG = 1.5, DASH = 9;

// Keys: held arrows or WASD, and Space for one dash per press.
const held = new Set();
let keyDash = false;
function act({ key, down = true }) {
  if (down && key === 'Space' && !held.has('Space')) keyDash = true;
  down ? held.add(key) : held.delete(key);
}
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));

// Keys and the gamepad fill one input object, read once per tick; the game reads nothing else.
let padName = null, padDashWas = false;
function readInput() {
  const input = { x: 0, y: 0, dash: keyDash };
  keyDash = false;
  if (held.has('ArrowLeft') || held.has('KeyA')) input.x -= 1;
  if (held.has('ArrowRight') || held.has('KeyD')) input.x += 1;
  if (held.has('ArrowUp') || held.has('KeyW')) input.y -= 1;
  if (held.has('ArrowDown') || held.has('KeyS')) input.y += 1;
  const pad = [...navigator.getGamepads()].find(p => p && p.connected);   // the first pad plugged in
  padName = pad ? pad.id : null;
  if (pad) {
    const sx = deadzone(pad.axes[0]), sy = deadzone(pad.axes[1]);   // left stick; down is +1
    if (sx || sy) { input.x = sx; input.y = sy; }
    const down = pad.buttons[0].pressed;   // the bottom face button: A on Xbox, cross on PlayStation
    if (down && !padDashWas) input.dash = true;   // pressed this tick, not held since the last one
    padDashWas = down;
  }
  const len = Math.hypot(input.x, input.y);
  if (len > 1) { input.x /= len; input.y /= len; }   // a diagonal is no faster
  return input;
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1d2433);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 18, 13);
camera.lookAt(0, 0, 2);
scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(4, 10, 3);
scene.add(sun);
const floor = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.4, 48), new THREE.MeshStandardMaterial({ color: 0x3d5a80 }));
floor.name = 'floor';
floor.position.y = -0.2;
const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.25, 8, 64).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xee6c4d }));
rim.name = 'rim';
const craft = new THREE.Group();
craft.name = 'hovercraft';
craft.add(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1, 0.35, 24), new THREE.MeshStandardMaterial({ color: 0x293241 })).translateY(0.2));
craft.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 1.2), new THREE.MeshStandardMaterial({ color: 0xe0fbfc })).translateY(0.55));
const orb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0x996600 }));
orb.name = 'orb';
craft.scale.setScalar(1.4);
scene.add(floor, rim, craft, orb);

const pos = new THREE.Vector2(), vel = new THREE.Vector2();
let score = 0, dashes = 0;
const placeOrb = () => { const a = Math.random() * Math.PI * 2, d = 2 + Math.random() * (R - 4); orb.position.set(Math.cos(a) * d, 0.6, Math.sin(a) * d); };
placeOrb();

function step(dt) {
  const input = readInput();
  vel.x += input.x * ACCEL * dt;
  vel.y += input.y * ACCEL * dt;
  if (input.dash) {
    const dir = (input.x || input.y) ? new THREE.Vector2(input.x, input.y) : vel.clone();
    if (dir.lengthSq() > 0) vel.addScaledVector(dir.normalize(), DASH);
    dashes++;
  }
  vel.multiplyScalar(Math.max(0, 1 - DRAG * dt));   // a hovercraft slides and slows slowly
  pos.addScaledVector(vel, dt);
  if (pos.length() > R - 1) {   // bounce off the rim
    const n = pos.clone().normalize();
    pos.copy(n).multiplyScalar(R - 1);
    vel.addScaledVector(n, -1.6 * vel.dot(n));
  }
  if (Math.hypot(orb.position.x - pos.x, orb.position.z - pos.y) < 1.3) { score++; placeOrb(); }
}

const hud = document.getElementById('hud');
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  craft.position.set(pos.x, 0, pos.y);
  if (vel.lengthSq() > 0.01) craft.rotation.y = Math.atan2(vel.x, vel.y);
  hud.innerHTML = `Orbs: ${score}<br>Controller: ${padName ?? 'none (press a button on it)'}`;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'hover arena', units: 'metres', keys: { ArrowUp: 'forward', ArrowDown: 'back', ArrowLeft: 'left', ArrowRight: 'right', Space: 'dash' }, gamepad: 'left stick moves, bottom face button dashes' }),
  observe: () => ({ x: +pos.x.toFixed(2), z: +pos.y.toFixed(2), speed: +vel.length().toFixed(2), score, dashes, pad: padName }),
  act,
  setState: s => { pos.set(s.x ?? pos.x, s.z ?? pos.y); score = s.score ?? score; dashes = s.dashes ?? dashes; if (s.speed !== undefined) vel.setLength(s.speed); },
  subject: 'hovercraft',
};
</script>
</body></html>
```

`readInput()` holds all four pieces. It starts from the keys, then looks for the first connected pad with `[...navigator.getGamepads()].find(p => p && p.connected)`. The stick values go through `deadzone()`, and they replace the keys' direction when the stick is pushed, so either can drive. `padDashWas` is last frame's button state, which is how a press is told apart from a hold. Space works the same way from the keyboard side: `act()` starts a dash when Space goes down and was not already held, so a key held down (which repeats its keydown event) dashes once. The last lines make a diagonal no faster than a straight push. `step()` then reads nothing but that input object.

## Which button is which

Most controllers report the browser's standard layout, and `pad.mapping` is then `"standard"`. In it:

| Index | Standard layout |
|---|---|
| `buttons[0]` | bottom face button (A on Xbox, cross on PlayStation) |
| `buttons[1]` | right face button (B, circle) |
| `buttons[2]` | left face button (X, square) |
| `buttons[3]` | top face button (Y, triangle) |
| `buttons[9]` | start, or options |
| `buttons[12]` to `buttons[15]` | the d-pad: up, down, left, right |
| `axes[0]`, `axes[1]` | left stick, x and y (down is +1) |
| `axes[2]`, `axes[3]` | right stick, x and y |

A pad whose `mapping` is an empty string uses its own order. Show a "press jump" setup screen that records which button the player presses, or ask players to use a pad the browser maps.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that edits the files in your project folder) can add this to a game you already have:

```text
Add gamepad support to my three.js game with the Gamepad API, keeping the keyboard controls.
Make one input object that both the keys and the pad fill each frame, and have the game read only that.
Read navigator.getGamepads() every frame, use the left stick with a dead zone of 0.15,
and make the A button jump once per press, not every frame it is held.
Show "press a button on your controller" until a pad is connected.
I have no controller plugged in: test it by faking one in the page.
```

The last line matters if you test on a laptop: without a pad, an agent cannot try the pad code by playing, so ask for the fake.

## Testing the pad code without a pad

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens a game in a hidden Chrome browser so the agent can play it. That browser has no controller, so the keyboard side is played with `interact`, which presses keys frame by frame. Here the up arrow is held for 30 frames, then Space for 30 more, and `expect` checks that a held Space dashed once:

```text
interact {"steps": [{"key": "ArrowUp", "frames": 30}, {"key": "Space", "frames": 30}], "trace": ["z"], "expect": {"dashes": 1}}

{"changed":{"z":-6.19,"speed":6.48,"dashes":1}}
z: 0 → -6.19 at frame 60; first changed at frame 2
Expect: dashes 1 ✓
```

For the pad side, `eval` runs code inside the game's page. This code replaces `navigator.getGamepads` with a fake pad whose stick rests at 0.1 and -0.08, waits 30 frames, pushes the stick to 0.8, waits again, then holds the bottom button for 30 frames:

```text
eval {"code": "const buttons = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));\nconst pad = { id: \"test pad\", connected: true, axes: [0.1, -0.08, 0, 0], buttons };\nnavigator.getGamepads = () => [pad];\nconst frames = async n => { for (let i = 0; i < n; i++) await new Promise(r => requestAnimationFrame(r)); return window.__game.observe(); };\nwindow.__game.setState({ x: 0, z: 0, speed: 0, dashes: 0 });\nconst resting = await frames(30);\npad.axes[0] = 0.8;\nconst pushed = await frames(30);\nbuttons[0].pressed = true;\nconst held = await frames(30);\nreturn { resting, pushed, held };"}

{"resting":{"x":0,"z":0,"speed":0,"score":0,"dashes":0,"pad":"test pad"},"pushed":{"x":1.07,"z":0,"speed":3.7,"score":0,"dashes":0,"pad":"test pad"},"held":{"x":6.54,"z":0,"speed":9.65,"score":0,"dashes":1,"pad":"test pad"}}
(the code awaited the paused clock, so the harness stepped it 90 frames, 1.50 s of game time, without drawing, until the code finished)
```

Each piece shows in one result: at rest the craft did not move (the dead zone), pushed it moved, and a button held for 30 frames dashed once. A `look` afterwards (a screenshot with a list of what is on screen) shows the HUD naming the fake pad:

```text
look {}

HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Orbs: 0 Controller: test pad" [18, 14, 233, 67].
```

These replies were captured on 2026-10-31 on a machine with no graphics card, where Chrome draws in software. The fake pad tests your code's logic, not a controller: paprika3d has no gamepad, so it cannot tell you how a real stick feels, whether your dead zone suits a worn pad, or how a pad maps buttons in another browser. Plug one in and play before you share the game. To add paprika3d to Claude Code (it needs Google Chrome and Node.js):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Without paprika3d

The fake pad works in your own browser too. Open the game, open the console (F12, then the Console tab), and paste:

```js
const buttons = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
const pad = { id: 'test pad', connected: true, axes: [0.1, -0.08, 0, 0], buttons };
navigator.getGamepads = () => [pad];
```

Then type `pad.axes[0] = 0.8` to push the stick, `buttons[0].pressed = true` to hold the button, and watch the game. To see what a real controller reports, connect it, press a button, and type `navigator.getGamepads()` in the console; the result lists each button and axis with its current value.

## What to do next

- Keyboard controls that feel right, with held keys and WASD on any layout: [how to make a character move in JavaScript](/guides/make-a-character-move-in-javascript).
- Touch buttons for phones that fill the same input object: [three.js virtual joystick and mobile touch controls](/guides/threejs-virtual-joystick-mobile-touch-controls).
- Make the dash feel strong, with a burst and a little shake: [how to make a game feel good](/guides/make-a-game-feel-good).
