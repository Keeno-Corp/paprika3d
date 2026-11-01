---
title: How to make a character move in JavaScript with the arrow keys, in a three.js game
phrase: how to make a character move in javascript
description: How to make a character move smoothly with the arrow keys or WASD in a JavaScript browser game: why moving it inside the keydown event jumps and stalls, the held-keys set, event.code, movement by elapsed time, a diagonal at the same speed, turning to face the way it walks, mouse look with pointer lock, a small three.js game with all of it, and how a coding agent with paprika3d holds keys with interact and reads what moved.
meta: How to make a character move in JavaScript with arrow keys or WASD, smoothly, in a three.js game: held keys, event.code, elapsed time, mouse look.
intent: make-a-character-move-in-javascript
queries:
  - "how to make a character move in javascript"
  - "Move an image with the arrow keys using JavaScript"
  - "Smooth character movement in canvas game using keyboard controls"
  - "How to implement mouselook in the browser?"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a character move in JavaScript with the arrow keys, in a three.js game

The short answer: do not move the character when a key is pressed. Keep a list of the keys that are down right now, adding a key when it goes down and removing it when it comes up, and move the character a little on every frame of the game for as long as its key is in the list. That one change is the difference between a character that jumps and stalls and one that glides.

A few words used below. An **event** is a message the browser sends your code when something happens, such as `keydown` when a key goes down and `keyup` when it comes back up. The **game loop** is a function the browser calls once per screen refresh, through `requestAnimationFrame`, that moves everything a little and draws one picture. **three.js** is a JavaScript library that draws 3D scenes in the page; the movement code here works the same in a 2D canvas game, since it changes numbers and three.js draws them.

## Why the first try jumps and stalls

The first version almost everyone writes, and the one the Stack Overflow question "Move an image with the arrow keys using JavaScript" starts from, moves inside the event:

```js
addEventListener('keydown', e => {    // moves a fixed step on each keydown event
  if (e.key === 'ArrowRight' || e.key === 'd') hero.x += 0.2;
  if (e.key === 'ArrowLeft' || e.key === 'a') hero.x -= 0.2;
  if (e.key === 'ArrowUp' || e.key === 'w') hero.z -= 0.2;
  if (e.key === 'ArrowDown' || e.key === 's') hero.z += 0.2;
});
```

Three things go wrong with it:

- **It moves in jumps.** `keydown` arrives once when the key goes down. If you keep holding, the operating system's key repeat sends more, but after a pause and then at its own rate. So the character steps once, waits, then moves in small hops, at a speed set by your keyboard settings, not by the game.
- **Two keys at once do not work.** Key repeat repeats the key pressed last, so holding up and right moves in one direction, not both.
- **Some keys go dead.** `e.key` is the character the key types. With Caps Lock on, the W key types `'W'`, the check for `'w'` fails, and that direction stops working. On a French keyboard the key in the W position types `'z'`, so WASD is in the wrong place.

## The fix: held keys, moved every frame

Four small parts replace it.

**1. A set of held keys.** `keydown` adds the key to a `Set` (a list with no repeats) and `keyup` removes it. When the window loses focus, clear the set, since a key let go in another window never sends `keyup` here and would stay "held" forever.

**2. `event.code`, not `event.key`.** `event.code` names the key by its place on the keyboard: `KeyW` is the key under your left hand's middle finger on any layout, whatever it types, and Caps Lock or Shift do not change it. Arrow keys are `ArrowUp`, `ArrowDown`, `ArrowLeft` and `ArrowRight`.

**3. Move by speed times elapsed time.** In the game loop, work out how much time passed since the last frame (`dt`, in seconds) and move `speed * dt`. A screen that refreshes twice as often calls the loop twice as often with half the `dt`, so the character covers the same ground per second on every screen. Cap `dt` at 0.1 s, so a tab that was hidden for a while does not move the character across the map in one frame.

**4. The same speed on a diagonal.** Holding up and right adds one step in each direction, which goes further per frame than one step straight: the diagonal of a square is longer than its side. Divide the direction by its length so a diagonal is as fast as a straight line. While you have the direction, `Math.atan2` turns it into an angle, which is how the character turns to face the way it walks.

One more habit pays off later: send real key events and any other input (a touch button, a test tool) through the same small function, here `act`. Then a control that works from the keyboard works from everything else too, and the [touch joystick guide](/guides/threejs-virtual-joystick-mobile-touch-controls) plugs into the same place.

## A small game with all of it

The lantern garden: walk with the arrow keys or WASD and touch the four lanterns to light them. The hero is a capsule with an orange nose on its front, so you can see it turn. Save it as `index.html`, run `npm install three` in its folder, serve the folder (`python3 -m http.server 8000`) and open `http://localhost:8000`; if the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Lantern garden</title>
<style>html,body{margin:0;overflow:hidden;background:#141a2e}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#fff;font:600 20px system-ui}</style></head>
<body>
<div id="hud">Lanterns lit 0 / 4</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const SPEED = 3;                       // units per second, whatever the screen's refresh rate
const KEYS = {                         // event.code names a key by its place on the keyboard
  ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
};
const LANTERNS = [[-4, -3], [4, -3], [-4, 3], [4, 3]];
const held = new Set();                // the keys down right now
const hud = document.getElementById('hud');
let hero = { x: 0, z: 0, facing: 0 }, lit = [false, false, false, false];

function step(dt) {
  let dx = 0, dz = 0;
  for (const code of held) if (KEYS[code]) { dx += KEYS[code][0]; dz += KEYS[code][1]; }
  const len = Math.hypot(dx, dz);
  if (len > 0) {
    hero.x += dx / len * SPEED * dt;   // dividing by len: a diagonal is not faster than a straight line
    hero.z += dz / len * SPEED * dt;
    hero.facing = Math.atan2(dx, dz);  // turn to face the way it walks
  }
  hero.x = Math.max(-5, Math.min(5, hero.x));
  hero.z = Math.max(-4, Math.min(4, hero.z));
  LANTERNS.forEach(([x, z], i) => {
    if (!lit[i] && Math.hypot(hero.x - x, hero.z - z) < 0.9) lit[i] = true;
  });
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141a2e);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 10, 9);
camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xaabbff, 0x223322, 2));

const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 10).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2f5d3a }));
ground.name = 'ground';
scene.add(ground);
const figure = new THREE.Group();
figure.name = 'hero';
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.6), new THREE.MeshStandardMaterial({ color: 0xe8e0d0 }));
body.position.y = 0.6;
const nose = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.3), new THREE.MeshStandardMaterial({ color: 0xff6644 }));
nose.position.set(0, 0.9, 0.35);       // on the front, so you can see which way it faces
figure.add(body, nose);
scene.add(figure);
const lamps = LANTERNS.map(([x, z]) => {
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.6), new THREE.MeshStandardMaterial({ color: 0x555555 }));
  lamp.name = 'lantern';
  lamp.position.set(x, 0.3, z);
  scene.add(lamp);
  return lamp;
});

let last = null;
function loop(now) {
  requestAnimationFrame(loop);
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  figure.position.set(hero.x, 0, hero.z);
  figure.rotation.y = hero.facing;
  lamps.forEach((lamp, i) => lamp.material.emissive.set(lit[i] ? 0xffaa33 : 0x000000));
  hud.textContent = lit.every(Boolean) ? 'All lit!' : `Lanterns lit ${lit.filter(Boolean).length} / 4`;
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

// One input path: real keys and a test tool's act() both land here.
const act = ({ key, down = true }) => { if (down) held.add(key); else held.delete(key); };
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('blur', () => held.clear());   // a key released in another window never sends keyup here
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.__game = {
  subject: 'hero',
  describe: () => ({ name: 'lantern garden', keys: { ArrowRight: 'hold to walk right', ArrowLeft: 'hold to walk left', ArrowUp: 'hold to walk away', ArrowDown: 'hold to walk nearer', KeyW: 'as ArrowUp', KeyA: 'as ArrowLeft', KeyS: 'as ArrowDown', KeyD: 'as ArrowRight' } }),
  observe: () => ({ hero: { x: +hero.x.toFixed(2), z: +hero.z.toFixed(2), facing: +hero.facing.toFixed(2) }, lit: [...lit] }),
  act,
  setState: (s) => {
    if (s.hero) hero = { ...hero, ...s.hero };
    if (s.lit) lit = [...s.lit];
  },
};
</script>
</body></html>
```

The `window.__game` object at the end is for testing tools: it lets them read where the hero is and press keys through `act`. The game plays without it.

## Checking the controls without describing them

Controls are hard to check by reading code. "It moves" leaves out how far, how fast, whether a diagonal is faster, and whether every key does anything at all. paprika3d is a plugin for Claude Code (and an MCP server for other coding agents) that lets the agent play the page itself: `open` runs it in a headless Chrome, and `interact` holds keys for an exact number of frames, each 1/60 s of game time, and replies with what changed. Install it in Claude Code with:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

These replies were captured on 2026-10-30 on the game above, on a Linux server with no GPU where Chrome draws in software. Holding the right arrow for 30 frames, half a second, with `trace` following the hero's position, then up and right together for the same 30 frames:

```text
interact {"steps": [{"key": "ArrowRight", "frames": 30}], "trace": ["hero.x"]}

{"changed":{"hero":{"x":1.5,"facing":1.57}}}
hero.x: 0 → 1.5 at frame 30; first changed at frame 1

interact {"steps": [{"key": "ArrowUp", "down": true, "frames": 0}, {"key": "ArrowRight", "down": true}, {"wait": 29}, {"key": "ArrowUp", "down": false, "frames": 0}, {"key": "ArrowRight", "down": false}], "trace": ["hero.x", "hero.z"]}

{"changed":{"hero":{"x":2.56,"z":-1.06,"facing":2.36}}}
hero.x: 1.5 → 2.56 at frame 30; first changed at frame 1
hero.z: 0 → -1.06 at frame 30; first changed at frame 1
```

Half a second at 3 units per second is 1.5 units, and it moved from the first frame. The diagonal went 1.06 across and 1.06 up, which is 1.5 units along the diagonal: the same speed, not faster. Then S and A, a key that the game does not use, and a walk into the garden's edge:

```text
interact {"steps": [{"key": "KeyS", "frames": 20}, {"key": "KeyA", "frames": 20}]}

{"changed":{"hero":{"x":1.56,"z":-0.06,"facing":-1.57}}}
Motion (hero): travelled 2 units (1.41 from start to end), its direction of travel turned 90° right.

interact {"steps": [{"key": "KeyQ", "frames": 20}]}

{"after":{"hero":{"x":1.56,"z":-0.06,"facing":-1.57},"lit":[false,false,false,false]},"changed":{}}

interact {"steps": [{"state": {"hero": {"x": 4, "z": 0}}}, {"key": "ArrowRight", "frames": 40}], "trace": ["hero.x"]}

{"changed":{"hero":{"x":5,"facing":1.57}}}
Motion (hero): travelled 1 units, it stopped at frame 20 and did not move again.
hero.x: 4 → 5 at frame 20; first changed at frame 1
```

The `Motion` line follows the hero (the game's `subject`) and says when it turned or stopped. An empty `"changed"` is how a dead control shows: the key went down and nothing in the game moved. The `{ state }` step in the last call puts the hero next to the edge first, so the check does not need a long walk.

The same call on the first version from the top of the page, holding the right arrow for 30 frames:

```text
interact {"steps": [{"key": "ArrowRight", "frames": 30}], "trace": ["hero.x"]}

{"changed":{"hero":{"x":0.2}}}
hero.x: 0 → 0.2 at frame 1; first changed at frame 1
```

One step at the first frame, then nothing for the rest of the half second. The harness holds a key without the operating system's key repeat, so it shows what the game itself does with a held key; on a real keyboard the repeat would add the hops after the pause.

What paprika3d does not do: it does not tell you how movement should feel. Whether 3 units per second is too slow is your call, and the agent changes the number when you say so. It has no Safari engine and no phone, so a fault that a phone's keyboard or touch screen alone shows needs the device.

## Mouse look with pointer lock

For a game where the mouse turns the view, as the Game Development Stack Exchange question "How to implement mouselook in the browser?" asks, use **pointer lock**: the browser hides the cursor and keeps reporting how far the mouse moved, even past the edge of the screen. Browsers lock the pointer after a click, not before, and Esc unlocks it. Add this to the game above, after the key listeners, and the mouse turns the hero:

```js
// Mouse look: a click locks the pointer to the page, then the mouse turns the hero.
renderer.domElement.addEventListener('click', () => renderer.domElement.requestPointerLock());
addEventListener('mousemove', e => {
  if (document.pointerLockElement !== renderer.domElement) return;
  hero.facing -= e.movementX * 0.005;   // radians per pixel of mouse movement
});
```

`movementX` is how far the mouse moved since the last event, in pixels, which is what a locked pointer reports. `interact` has a step for it, a click and then a relative move:

```text
interact {"steps": [{"mouse": "click", "x": 640, "y": 400}, {"mouse": "move", "relative": [100, 0]}]}

{"changed":{"hero":{"facing":-0.5}}}
```

100 pixels to the right turned the hero 0.5 radians. For walking in the direction the hero faces (W goes forward wherever it looks), turn the held-key direction by `hero.facing` before moving.

## Where to go next

A character that walks on uneven ground, jumps and collides is a physics question: [the three.js third-person character controller](/guides/threejs-third-person-character-controller) covers it, and [the third-person camera follow](/guides/threejs-third-person-camera-follow) keeps the camera behind it. When moving is a game with a way to lose, [add a game over screen](/guides/add-a-game-over-screen) is the next step.
