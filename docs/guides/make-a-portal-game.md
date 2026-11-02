---
title: How to make a portal game in three.js: two doors that see and lead into each other
phrase: how to make a portal game
description: How to make a portal game like Portal in the browser: two linked doors, the view through one drawn by a second camera placed behind the other (a render target, frameCorners and a clipping plane), and walking through one door to come out of the other facing the right way, on a small three.js room with two fixed doors; plus the prompt to give an AI agent, what goes wrong, and paprika3d picturing the view through each door and tracing the jump in position and facing as the player walks through.
meta: How to make a portal game in three.js: two linked doors, the view through each drawn with a render target, and walking through one to step out of the other.
intent: make-a-portal-game
queries:
  - "how to make a portal game"
  - "how to make a game like portal 2"
  - "How to create high quality and fast portal effect?"
  - "With what projection matrix should I render a portal to a texture?"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make a portal game in three.js: two doors that see and lead into each other

A portal game is built on two doors that are linked. Look into one and you see what is in front of the other, as if the two doorways were one; walk into one and you step out of the other. Portal, the puzzle game by Valve, made the idea famous: the player shoots the two doors onto walls and uses them to cross gaps and reach ledges. The trick is two separate pieces of work, and this page builds both on the smallest scene that shows them: a room with two doors standing in it.

1. **The view.** Each doorway shows a picture drawn from a second, hidden camera, placed behind the other door exactly where your eye would be if the two doors were glued together.
2. **The trip.** When the player crosses a doorway, the game moves them to the matching place at the other door and turns them by the angle between the doors.

Both pieces use one idea, the link between the doors, so that comes first. A few terms: **three.js** is a JavaScript library that draws 3D scenes in a web page. A **render target** is a picture three.js draws into memory instead of onto the screen, which can then be used as a texture (an image painted onto a surface). A **matrix** is a small grid of numbers that stores a position and a turn together; multiplying a point by it moves and turns the point in one step.

## The link between two doors

Stand one metre in front of the blue door and slightly to its left. The matching place at the orange door is one metre *behind* it and slightly to *its* right: the doors are glued back to front, so in front becomes behind and left becomes right. That is a half turn. In code, the link is three matrices multiplied together:

```js
const HALF_TURN = new THREE.Matrix4().makeRotationY(Math.PI);
const link = (from, to) => to.matrixWorld.clone().multiply(HALF_TURN).multiply(from.matrixWorld.clone().invert());
```

Read it from right to left: the inverted matrix of the first door says where a point is *relative to that door*; the half turn swaps front for back and left for right; the second door's matrix puts the result back in the room, relative to the second door. Any point, and any camera, can be carried through a door this way.

## Drawing the view through a door

To fill the blue doorway, the game carries the player's camera position through the link to get the hidden camera's position behind the orange door, then does three things:

- **Aims the hidden camera at the far doorway.** `frameCorners`, a helper from three.js's addons, shapes the camera's view so it exactly covers the four corners of the orange doorway. This answers the Stack Exchange question about which projection to use: a view fitted to the doorway's corners, not a normal camera view.
- **Clips away everything behind the far door.** The hidden camera stands behind the orange door, so the door's back and the wall behind it would block its view. A clipping plane through the doorway tells three.js to skip every pixel on its back side.
- **Draws into the blue door's render target**, and the blue doorway shows that texture.

Then the same again for the orange door, and then the normal picture to the screen. One rule matters: WebGL (the browser's 3D drawing system) does not allow drawing into a texture while the same draw shows it, so while the hidden cameras draw, each doorway shows a flat colour instead of its texture. The cost is that a door seen through the other door shows that colour rather than a second view inside it; the game Portal draws several views deep to make the endless tunnel you see when two doors face each other.

## Walking through

Each frame, the game works out where the player would move, then checks each door: was the player in front of the doorway and is the next position behind it, within the doorway's width? Then the player crossed it. The new position is the next position carried through the link, and the facing turns by the difference between the doors' turns plus a half turn. Coming at a door from behind is blocked, as its back is solid.

## The game: two doors

Walk with the up and down arrow keys and turn with left and right. Walk into the blue door and you come out of the orange one. Save the file as `index.html` and run `npm install three` in its folder (npm comes with Node.js, a free program that installs JavaScript libraries). The import map in the page also maps `three/addons/`, where `frameCorners` lives. Serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`; [HTML game not working?](/guides/html-game-not-working) lists what to check if the page stays empty.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Two doors</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}#hud{position:fixed;bottom:16px;left:20px;font:600 18px system-ui;color:#fff}</style></head>
<body>
<div id="hud">Arrow keys: walk and turn</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js","three/addons/":"./node_modules/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { frameCorners } from 'three/addons/utils/CameraUtils.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202330);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.01, 100);
scene.add(new THREE.HemisphereLight(0xffffff, 0x404858, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(3, 8, 5);
scene.add(sun);

function add(name, geometry, color, x, y, z, parent = scene) {
  const m = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }));
  m.name = name;
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
// A walled room with a few landmarks, so the view through each door is easy to recognise.
add('floor', new THREE.BoxGeometry(12, 0.1, 12), 0x3a3f4f, 0, -0.05, 0);
scene.add(new THREE.GridHelper(12, 12, 0x666c80, 0x666c80));
add('red wall', new THREE.BoxGeometry(12, 3, 0.2), 0xc0504d, 0, 1.5, -6);
add('green wall', new THREE.BoxGeometry(0.2, 3, 12), 0x6aa84f, 6, 1.5, 0);
add('yellow wall', new THREE.BoxGeometry(12, 3, 0.2), 0xf2c14e, 0, 1.5, 6);
add('purple wall', new THREE.BoxGeometry(0.2, 3, 12), 0x8e6bbf, -6, 1.5, 0);
add('white pillar', new THREE.CylinderGeometry(0.4, 0.4, 3, 24), 0xeeeeee, 1, 1.5, -2);
add('pink ball', new THREE.SphereGeometry(0.6, 24, 16), 0xff7fb0, -3.5, 0.6, 2.5);
add('teal crate', new THREE.BoxGeometry(1, 1, 1), 0x2fb8a8, 4, 0.5, -4.5);

// A portal: a door frame with a solid back and a screen in the doorway, all of it behind the doorway's plane.
// The screen shows a render target.
const W = 2, H = 2.6;
function portal(name, color, x, z, turn) {
  const door = new THREE.Group();
  door.name = name;
  door.position.set(x, 0, z);
  door.rotation.y = turn;
  add(name + ' frame', new THREE.BoxGeometry(0.15, H + 0.15, 0.25), color, -W / 2 - 0.075, (H + 0.15) / 2, -0.14, door);
  add(name + ' frame', new THREE.BoxGeometry(0.15, H + 0.15, 0.25), color, W / 2 + 0.075, (H + 0.15) / 2, -0.14, door);
  add(name + ' frame', new THREE.BoxGeometry(W, 0.15, 0.25), color, 0, H + 0.075, -0.14, door);
  add(name + ' back', new THREE.BoxGeometry(W, H, 0.05), 0x22252e, 0, H / 2, -0.1, door);
  door.target = new THREE.WebGLRenderTarget(512, 666, { colorSpace: THREE.SRGBColorSpace });
  door.view = new THREE.MeshBasicMaterial({ map: door.target.texture });
  door.flat = new THREE.MeshBasicMaterial({ color });
  door.screen = new THREE.Mesh(new THREE.PlaneGeometry(W, H), door.view);
  door.screen.name = name + ' view';
  door.screen.position.y = H / 2;
  door.add(door.screen);
  scene.add(door);
  return door;
}
const blue = portal('blue portal', 0x3a8dde, -2, -3, 0);              // faces +z, towards the start
const orange = portal('orange portal', 0xf08a24, 4, 2, -Math.PI / 2); // faces -x, towards the middle
blue.other = orange;
orange.other = blue;
scene.updateMatrixWorld();

// The matrix that carries a point in front of one door to the same place behind the other, turned half round.
const HALF_TURN = new THREE.Matrix4().makeRotationY(Math.PI);
const link = (from, to) => to.matrixWorld.clone().multiply(HALF_TURN).multiply(from.matrixWorld.clone().invert());

const eye = new THREE.PerspectiveCamera();
const corner = (door, x, y) => door.localToWorld(new THREE.Vector3(x, y, 0));
function drawView(door) {
  const out = door.other;
  eye.position.copy(camera.position).applyMatrix4(link(door, out));
  frameCorners(eye, corner(out, W / 2, 0), corner(out, -W / 2, 0), corner(out, W / 2, H), false);
  // nothing behind the far door may block the view: clip everything on its back side
  const facing = new THREE.Vector3(0, 0, 1).applyQuaternion(out.quaternion);
  renderer.clippingPlanes = [new THREE.Plane().setFromNormalAndCoplanarPoint(facing, out.position)];
  renderer.setRenderTarget(door.target);
  renderer.render(scene, eye);
}

let x = 0, z = 4, yaw = 0, trips = 0;
const held = new Set();
addEventListener('keydown', e => held.add(e.key));
addEventListener('keyup', e => held.delete(e.key));

function step(dt) {
  yaw += ((held.has('ArrowLeft') ? 1 : 0) - (held.has('ArrowRight') ? 1 : 0)) * 2 * dt;   // 2 radians a second
  const speed = ((held.has('ArrowUp') ? 1 : 0) - (held.has('ArrowDown') ? 1 : 0)) * 3 * dt; // 3 metres a second
  const from = new THREE.Vector3(x, 1.6, z);
  const to = from.clone().add(new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).multiplyScalar(speed));
  for (const door of [blue, orange]) {
    const a = door.worldToLocal(from.clone()), b = door.worldToLocal(to.clone());
    if (Math.abs(b.x) > W / 2) continue;
    if (a.z > 0 && b.z <= 0) {             // walked in through the front: out of the other door
      to.applyMatrix4(link(door, door.other));
      yaw += door.other.rotation.y - door.rotation.y + Math.PI;
      trips++;
      break;
    }
    if (a.z <= 0 && b.z > -0.2) return;    // the back of a door is solid
  }
  x = THREE.MathUtils.clamp(to.x, -5.7, 5.7);
  z = THREE.MathUtils.clamp(to.z, -5.7, 5.7);
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
  camera.position.set(x, 1.6, z);
  camera.rotation.set(0, yaw, 0);
  camera.updateMatrixWorld();
  // the doorways show a flat colour inside the other door's view, so no texture is drawn into itself
  blue.screen.material = blue.flat;
  orange.screen.material = orange.flat;
  drawView(blue);
  drawView(orange);
  blue.screen.material = blue.view;
  orange.screen.material = orange.view;
  renderer.clippingPlanes = [];
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);
});

const deg = r => Math.round(THREE.MathUtils.radToDeg(THREE.MathUtils.euclideanModulo(r, Math.PI * 2)));
window.__game = {
  describe: () => ({ name: 'two doors', units: 'metres', keys: { ArrowUp: 'walk forward', ArrowDown: 'walk back', ArrowLeft: 'turn left', ArrowRight: 'turn right' } }),
  observe: () => ({ player: { x: +x.toFixed(2), z: +z.toFixed(2), facing: deg(yaw) }, trips }),
  setState: (s) => { if ('x' in s) x = s.x; if ('z' in s) z = s.z; if ('facing' in s) yaw = THREE.MathUtils.degToRad(s.facing); if ('trips' in s) trips = s.trips; },
};
</script>
</body></html>
```

`portal()` builds a door: a coloured frame and a solid back, both kept just behind the doorway's plane so the clipping plane hides them in the other door's view, and a flat screen in the doorway that shows the door's render target. `link()` is the matrix above. `drawView()` places the hidden camera, fits it to the far doorway with `frameCorners`, sets the clipping plane and draws into the door's render target. `step()` turns and moves the player and does the crossing test. The loop draws the two hidden views with the doorways showing flat colour, then the room to the screen. `window.__game` lets a testing tool read and set the player's position; the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code, Cursor or Codex that writes and edits the files in your project) can write the effect, but it is easy to get one detail wrong, so name the parts:

```text
Make a first-person portal game in one index.html with three.js: a room with coloured walls
and a few landmarks, and two door frames standing in it, blue and orange, facing different ways.
Each doorway shows the view out of the other door: a second camera placed by carrying the player's
camera through the link matrix (other door's matrix, times a half turn, times the inverse of this
door's matrix), fitted to the far doorway's corners with frameCorners from
three/addons/utils/CameraUtils.js, with a clipping plane at the far doorway, drawn into a render target.
Walking into a doorway from the front moves the player out of the other door and turns them by
the angle between the doors plus a half turn. Arrow keys walk and turn.
Then walk through each door and check the position and facing on the other side.
```

## When a portal goes wrong

- **The view through the door is mirrored or upside down.** The corners given to `frameCorners` are in the wrong order. Seen through the door, the far doorway's left and right swap.
- **The doorway shows the back of the other door, or a wall.** The clipping plane is missing, or it faces the wrong way and clips the room instead.
- **The view looks stretched and slides as you move.** The hidden camera is a normal camera looking at the far door, not one fitted to the doorway's corners.
- **You come out of the door walking sideways.** The position went through the link but the facing did not turn; the trace below shows exactly that.
- **The view cuts off just before you step through.** The camera's near limit (the closest distance it draws) is larger than your distance to the doorway; this game uses `0.01`.

## Let the agent look through the doors

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can see it and play it. Add it to Claude Code with two lines in a terminal (the text window where you type commands):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

`look` with `sheet` reloads the game for each moment and puts the pictures side by side. Here: standing in front of each door, and just after walking through the blue one:

```text
look {"sheet":[{"label":"facing the blue door","state":{"x":-2,"z":1.5,"facing":0}},{"label":"facing the orange door","state":{"x":1.5,"z":2,"facing":270}},{"label":"walked through blue","state":{"x":-2,"z":0,"facing":0},"steps":[{"key":"ArrowUp","frames":80}]}]}

Picture: <project>/paprika3d/runs/2026-11-01T00-35-37-494Z/look-4-sheet.png (3 moments, left to right, top to bottom: facing the blue door | facing the orange door | walked through blue); the game is reloaded at its first frame
facing the blue door: subject blue portal 9.9%; on screen: floor, purple wall, red wall, white pillar, blue portal view, blue portal frame ×3, teal crate, green wall, … 1 more; pixels: brightness 28%, colour saturation 33%, 0% near black, 0% blown out
facing the orange door: subject blue portal 0%; on screen: orange portal view, green wall, floor, yellow wall, orange portal frame ×3, GridHelper; left the view: purple wall, white pillar, teal crate, blue portal frame, blue portal view; pixels: brightness 28%, colour saturation 43%, 0% near black, 0% blown out
walked through blue: subject blue portal 5.2%; on screen: floor, yellow wall, purple wall, blue portal view, pink ball, GridHelper, blue portal frame ×2; left the view: green wall, white pillar, teal crate, orange portal frame, orange portal view; pixels: brightness 26%, colour saturation 38%, 0% near black, 0% blown out
This sheet took 2 s (about 1 s a cell) on a software renderer.
```

The text lists the objects drawn directly; what is inside a doorway's texture shows in the picture, which the agent sees. In the first picture the blue doorway holds the purple wall and the pink ball, and the third picture, taken after walking through, shows the same purple wall and pink ball: the view through the door matches the place it leads to. A first version of the picture had a thin orange strip down the inside edge of the blue doorway, the front of the orange frame poking out past the clipping plane, which is why `portal()` now keeps the frames behind it.

`interact` holds keys frame by frame, and `trace` follows values in the game's state on every frame. On a first version without the facing turn, walking into the blue door gave:

```text
interact {"steps":[{"state":{"x":-2,"z":0,"facing":0,"trips":0}},{"key":"ArrowUp","down":true},{"until":{"trips":1},"max":200},{"wait":20},{"key":"ArrowUp","down":false}],"trace":["player.x","player.z","player.facing"],"expect":{"trips":1}}

{"changed":{"player":{"x":3.95,"z":1},"trips":1}}
until: trips == 1 held at frame 61
player.x: -2 → 3.95 at frame 61; first changed at frame 61
player.z: 0 → low -3 at frame 60 → peak 2 at frame 61 → 1 at frame 81; first changed at frame 1
player.facing: 0 throughout the 82 frames
Expect: trips 1 ✓
```

The trip happened (the position jumped at frame 61 from the blue door to the orange one), but the facing never changed, so after the trip `z` kept falling while `x` stayed put: the player walked out sideways along the orange door instead of out of it. With the facing turn back in, the same walk gives:

```text
{"changed":{"player":{"x":2.95,"z":2,"facing":90},"trips":1}}
until: trips == 1 held at frame 61
player.x: -2 → peak 3.95 at frame 61 → 2.95 at frame 81; first changed at frame 61
player.z: 0 → low -3 at frame 60 → 2 at frame 61; first changed at frame 1
player.facing: 0 → 90 at frame 61; first changed at frame 61
Expect: trips 1 ✓
```

Now the facing turns a quarter at the moment of the jump and the player keeps walking straight out of the orange door, away from it. The return trip, into the orange door and out of the blue one:

```text
interact {"steps":[{"state":{"x":1.5,"z":2,"facing":270,"trips":0}},{"key":"ArrowUp","down":true},{"until":{"trips":1},"max":200},{"wait":20},{"key":"ArrowUp","down":false}],"trace":["player.x","player.z","player.facing"],"expect":{"trips":1}}

{"changed":{"player":{"x":-2,"z":-1.95,"facing":180}}}
until: trips == 1 held at frame 51
player.x: 1.5 → peak 4 at frame 50 → -2 at frame 51; first changed at frame 1
player.z: 2 → low -2.95 at frame 51 → -1.95 at frame 71; first changed at frame 51
player.facing: 270 → 180 at frame 51; first changed at frame 51
Expect: trips 1 ✓
```

These replies were captured on 2026-11-01 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not judge whether the illusion convinces a person; it shows the agent the pictures and the numbers, and the agent compares them with what the doors should show.

## The harder step: doors you shoot onto walls

In Portal the player places the doors. That adds work this page leaves out: a ray from the player's gun to find the wall it hits; a door placed flat against that wall, facing out along the wall's direction (its normal); the wall behind each door clipped in the views and opened for walking, so the player can pass through it; and a check that the door fits on the wall. Objects that pass through doors, and keeping the player's speed through a trip, come after that. Get two fixed doors working first, as here, then make them movable.

## Next steps

- Look around with the mouse instead of the arrow keys: [how to make a fps game](/guides/make-a-fps-game).
- Turn the room into a puzzle the doors solve: [how to make a puzzle game](/guides/make-a-puzzle-game).
- Walls the player cannot walk through: [three.js collision detection without a physics engine](/guides/threejs-collision-detection-without-physics-engine).
- How an agent builds and checks a game step by step: [AI agent to build a three.js game](/guides/ai-agent-build-threejs-game).
