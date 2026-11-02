---
title: How to make a fps game in three.js: first-person look, shooting and targets
phrase: how to make a fps game
description: How to make a fps game (a first-person shooter) in the browser, for someone who has never made a game: the camera as the player's eyes, mouse look with pointer lock, walking the way you look, a shot as a ray from the middle of the screen, and targets that take a paint splat, drop and pop up elsewhere, on a small three.js paintball range you can paste; and how a coding agent with paprika3d locks the mouse, aims, fires and asks what is under the crosshair.
meta: How to make a fps game in three.js: pointer lock mouse look, WASD walking, shooting by a ray from the crosshair, and targets.
intent: make-a-fps-game
queries:
  - "three js fps game"
  - "how to make a game like doom"
  - "Three.js First Person Controls"
  - "How does one develop a first person shooter with a one man team?"
  - "How I can create a full FPS game?"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a fps game in three.js: first-person look, shooting and targets

A first-person shooter (FPS) is three things: a camera at eye height that the mouse turns, keys that walk the way the camera faces, and a click that sends a straight line out from the middle of the screen and checks what it meets first. That is the core of every shooter, from Doom to today's. Start with targets that fall over when hit, not enemies: once looking, walking and shooting feel right, enemies, levels and weapons are things you add one at a time. Online multiplayer is a different and much larger project (it needs a server that every player connects to), and this page does not cover it.

Some words used below. **three.js** is a JavaScript library that draws 3D scenes in a web page. The **camera** is the point of view the scene is drawn from; in a first-person game, it is the player's eyes. A **frame** is one picture of the game; browsers draw about 60 a second, and the **game loop** is the function that runs once per frame. A **ray** is an invisible straight line, and three.js's `Raycaster` lists what a ray passes through, nearest first.

## The camera is the player

Keep the player as a position on the floor and two angles: **yaw**, how far they have turned left or right, and **pitch**, how far they look up or down. Every frame, put the camera at the player's position at eye height (1.6 units here) and set its rotation from the two angles.

One setting matters: `camera.rotation.order = 'YXZ'`. It makes three.js turn left or right first and then tilt up or down. With the default order, looking up and then turning tips the horizon sideways, a bug that is easy to see and hard to name.

## Mouse look with pointer lock

The mouse turns the view with **pointer lock**: the browser hides the cursor and keeps reporting how far the mouse moved, even past the edge of the screen. Browsers lock the pointer after a click, never before, and Esc always frees it. The game's first click asks for the lock; once locked, each click fires. Each mouse movement changes the yaw by `movementX` (how far the mouse moved sideways, in pixels) times a small number, and the pitch by `movementY`. Keep the pitch between about -1.4 and 1.4 radians, a little short of straight up and down, or the view flips over. [How to make a character move in JavaScript](/guides/make-a-character-move-in-javascript) introduces pointer lock on a game seen from above.

## Walking the way you look

W walks forward, but forward depends on the yaw. From the yaw, work out two directions on the floor: forward is `(-sin(yaw), -cos(yaw))` and right is `(cos(yaw), -sin(yaw))`. W and S move along forward, A and D along right, at a fixed speed times the time since the last frame. Keep the player inside the walls. The game lets you walk through the crates; stopping at them is collision, covered in [collision detection without a physics engine](/guides/threejs-collision-detection-without-physics-engine).

## Shooting: a ray from the crosshair

A shot is a ray from the camera through the middle of the screen, where the crosshair is drawn. `ray.setFromCamera(new THREE.Vector2(0, 0), camera)` makes it, since (0, 0) is the middle of the screen in the coordinates three.js uses there. Then the first thing the ray hits is what you shot. Do not build the ray from the mouse position: under pointer lock the mouse position stays where it was when the lock started, so every shot would go to the same spot. More on rays and clicks in [click on an object in three.js](/guides/threejs-click-on-object-raycaster).

The ray hits a mesh (one shape three.js draws), such as a target's board. To know which target that board belongs to, walk up through its parents until you reach the group named `target`. A hit target tips over backwards, and a second later it stands up again at the next free spot.

Every shot leaves a paint splat: a small coloured circle placed at the hit point, a hair in front of the surface so it does not flicker into it, turned to face out along the surface. `attach` makes it a child of what it hit, so paint on a target falls over with it. The game keeps the 40 newest splats and removes older ones, so a long session does not fill the memory.

## The whole game: paintball range

A warehouse with three targets among the crates. Click to lock the mouse, move the mouse to look, click to fire, and walk with WASD. Each target hit drops and pops up somewhere else. Save it as `index.html` in a new folder, run `npm install three` there (this downloads three.js into the folder), start a small web server in the folder with `python3 -m http.server 8000`, and open `http://localhost:8000` in your browser. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Paintball range</title>
<style>html,body{margin:0;overflow:hidden;background:#202024}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#fff;font:600 20px system-ui}
#cross{position:fixed;left:50%;top:50%;width:16px;height:16px;margin:-8px 0 0 -8px;pointer-events:none;
  background:linear-gradient(#fff,#fff) center/2px 16px no-repeat,linear-gradient(#fff,#fff) center/16px 2px no-repeat}</style></head>
<body>
<div id="hud"></div><div id="cross"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const SPEED = 4, LOOK = 0.0025;            // walking speed in units per second; radians of turn per pixel of mouse movement
const SPOTS = [[0, -8], [-6, -6], [6, -7], [-9, -2], [9, -1], [-3, -11], [4, -12], [0, -3]];   // where targets stand, in turn
const PAINT = [0x22d3ee, 0xf43f5e, 0xfacc15];
const held = new Set();
const hud = document.getElementById('hud');
let player = { x: 0, z: 10, yaw: 0, pitch: 0 }, hits = 0, shots = 0, nextSpot = 3;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202024);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 100);
camera.rotation.order = 'YXZ';             // turn left and right first, then look up and down: no tilted horizon
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));
const lamp = new THREE.DirectionalLight(0xffffff, 1.2);
lamp.position.set(4, 10, 6);
scene.add(lamp);
const mat = (color) => new THREE.MeshStandardMaterial({ color });

const room = new THREE.Group();            // the warehouse: a floor, four walls and crates
room.name = 'warehouse';
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30).rotateX(-Math.PI / 2), mat(0x6b6b6b));
room.add(floor);
for (const [x, z, w, d] of [[0, -15, 30, 0.4], [0, 15, 30, 0.4], [-15, 0, 0.4, 30], [15, 0, 0.4, 30]]) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 6, d), mat(0x8a7f70));
  wall.position.set(x, 3, z);
  room.add(wall);
}
for (const [x, z] of [[-4, 2], [5, 3], [-8, -9], [8, -10]]) {
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), mat(0xa0703c));
  crate.position.set(x, 0.75, z);
  room.add(crate);
}
scene.add(room);

function makeTarget(spot) {
  const target = new THREE.Group();        // its origin is at the foot of the post, so it tips over backwards
  target.name = 'target';
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), mat(0x333333));
  post.position.y = 0.6;
  const board = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 24).rotateX(Math.PI / 2), mat(0xf5f5f5));
  board.position.y = 1.6;
  const bull = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16).rotateX(Math.PI / 2), mat(0xd03030));
  bull.position.y = 1.6;
  target.add(post, board, bull);
  target.userData = { spot, down: 0 };     // down: seconds since it was hit, 0 while standing
  target.position.set(SPOTS[spot][0], 0, SPOTS[spot][1]);
  scene.add(target);
  return target;
}
const targets = [0, 1, 2].map(makeTarget);

// Firing: a ray from the middle of the screen, where the crosshair is, never from the mouse position.
const ray = new THREE.Raycaster(), splats = [];
function fire() {
  shots++;
  ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hit = ray.intersectObjects([room, ...targets], true)[0];
  if (!hit) return;
  const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
  const splat = new THREE.Mesh(new THREE.CircleGeometry(0.15, 12), new THREE.MeshBasicMaterial({ color: PAINT[shots % 3] }));
  splat.name = 'splat';
  splat.position.copy(hit.point).addScaledVector(normal, 0.01);
  splat.lookAt(hit.point.clone().add(normal));
  hit.object.attach(splat);                 // stuck to what it hit, so it falls with a target
  splats.push(splat);
  if (splats.length > 40) splats.shift().removeFromParent();
  let t = hit.object;
  while (t && t.name !== 'target') t = t.parent;
  if (t && !t.userData.down) { t.userData.down = 1e-6; hits++; }
}

function step(dt) {
  let fwd = 0, side = 0;
  if (held.has('KeyW') || held.has('ArrowUp')) fwd += 1;
  if (held.has('KeyS') || held.has('ArrowDown')) fwd -= 1;
  if (held.has('KeyD') || held.has('ArrowRight')) side += 1;
  if (held.has('KeyA') || held.has('ArrowLeft')) side -= 1;
  const len = Math.hypot(fwd, side) || 1, s = Math.sin(player.yaw), c = Math.cos(player.yaw);
  player.x += (-s * fwd + c * side) / len * SPEED * dt;   // W walks the way you look, D steps to your right
  player.z += (-c * fwd - s * side) / len * SPEED * dt;
  player.x = Math.max(-14, Math.min(14, player.x));
  player.z = Math.max(-14, Math.min(14, player.z));
  for (const t of targets) {
    if (!t.userData.down) continue;
    t.userData.down += dt;
    t.rotation.x = -Math.min(1, t.userData.down * 5) * Math.PI / 2;   // tips over in a fifth of a second
    if (t.userData.down > 1) {             // a second later it stands up at the next free spot
      while (targets.some(o => o.userData.spot === nextSpot % SPOTS.length)) nextSpot++;
      t.userData = { spot: nextSpot % SPOTS.length, down: 0 };
      t.position.set(SPOTS[t.userData.spot][0], 0, SPOTS[t.userData.spot][1]);
      t.rotation.x = 0;
    }
  }
}

const locked = () => document.pointerLockElement === renderer.domElement;
renderer.domElement.addEventListener('mousedown', () => {
  if (locked()) fire(); else renderer.domElement.requestPointerLock();   // the first click locks the mouse, later clicks fire
});
addEventListener('mousemove', e => {
  if (!locked()) return;
  player.yaw -= e.movementX * LOOK;
  player.pitch = Math.max(-1.4, Math.min(1.4, player.pitch - e.movementY * LOOK));
});

let last = null;
function loop(now) {
  requestAnimationFrame(loop);
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  camera.position.set(player.x, 1.6, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0);
  hud.textContent = `Hits ${hits}, shots ${shots}` + (locked() ? '' : '. Click to lock the mouse; Esc frees it.');
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

const act = ({ key, down = true }) => { if (down) held.add(key); else held.delete(key); };
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('blur', () => held.clear());
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.__game = {
  describe: () => ({ name: 'paintball range', keys: { KeyW: 'walk forward', KeyS: 'walk back', KeyA: 'step left', KeyD: 'step right' }, mouse: 'click to lock, move to look, click to fire' }),
  observe: () => ({
    player: { x: +player.x.toFixed(2), z: +player.z.toFixed(2), yaw: +player.yaw.toFixed(3), pitch: +player.pitch.toFixed(3) },
    locked: locked(), hits, shots,
    targets: targets.map(t => ({ x: t.position.x, z: t.position.z, up: !t.userData.down })),
  }),
  act,
  setState: (s) => {
    if (s.player) player = { ...player, ...s.player };
    if (s.hits !== undefined) hits = s.hits;
    if (s.shots !== undefined) shots = s.shots;
  },
};
</script>
</body></html>
```

The `window.__game` object at the end is for testing tools: it lets them read the player, the hits and the targets, and press keys through `act`. The game plays without it.

## What to type to an AI coding agent

An **AI coding agent** (Claude Code, Codex, Cursor and others) is an assistant that writes files on your computer and runs commands. "Make an FPS like Doom" asks it to guess a whole game. Ask for the core first:

```text
Make a first-person paintball range in three.js in one index.html.
A warehouse with crates and three targets on posts.
Click locks the mouse (pointer lock); the mouse turns the view; WASD walks the way I look.
Clicking fires a ray from the middle of the screen, where a crosshair is drawn.
A hit target gets a paint splat, tips over, and stands up a second later somewhere else.
Show hits and shots at the top. Use camera rotation order YXZ.
```

[The AI prompt to make a game](/guides/ai-prompt-to-make-a-game) says what else a request should name.

## When the shooter breaks

- **The horizon tilts after looking up and turning.** The camera's rotation order is the default; set it to `'YXZ'`.
- **Every shot goes to the same spot, or to the corner of the screen.** The ray is built from the mouse position, which pointer lock freezes. Build it from the middle of the screen.
- **The view flips upside down when looking up.** The pitch is not limited.
- **The mouse is not captured.** `requestPointerLock` was called without a click, or the page is not the active window. Browsers allow it after a click and not before.
- **W walks north whichever way you look.** Movement ignores the yaw.
- **Splats flicker or vanish into walls.** They sit exactly on the surface; push them a little out along it. [Z-fighting](/guides/threejs-z-fighting-flicker) explains the flicker.

## Let the agent aim and fire itself

A shooter is hard to check without playing it: did the click lock the mouse, where is the crosshair pointing, did the hit count. paprika3d is a plugin for Claude Code (and an MCP server for other coding agents) that lets the agent open the page in a headless Chrome (a browser with no window), click, move a locked mouse and read the game's numbers back. Install it in Claude Code with:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

These replies were captured on 2026-10-30 on the game above, on a Linux server with no GPU, after a first `look`. `interact` clicks once to lock the mouse, then again to fire at the target straight ahead, then `look` with `at` lists what is drawn under the crosshair:

```text
interact {"steps":[{"mouse":"click","x":640,"y":400}]}

{"changed":{"locked":true}}
mouse click at (640, 400): over target (Group, 17.9 units)

interact {"steps":[{"mouse":"click","x":640,"y":400},{"wait":10}]}

{"changed":{"hits":1,"shots":1,"targets":[{"x":0,"z":-8,"up":false},{"x":-6,"z":-6,"up":true},{"x":6,"z":-7,"up":true}]}}
mouse click at (640, 400): over target (Group, 17.9 units)

look {"at":[[640,400]]}

At (640, 400): warehouse 24.8 m at [0.02, 1.58, -14.8]; background beyond.
```

The first click locked the mouse and fired nothing; the second hit, and the target it hit is down, so the crosshair now looks through to the back wall. Then `interact` with a `{ mouse: "move", relative }` step moves the locked mouse to the left, the way a player turns (the step's numbers are pixels), and `at` checks the aim before the shot:

```text
interact {"steps":[{"mouse":"move","relative":[-144,0]}]}

{"changed":{"player":{"yaw":0.36}}}

look {"at":[[640,400]]}

At (640, 400): target 17 m at [-5.99, 1.59, -5.95]; behind it target 17 m; then warehouse 26.5 m; background beyond.

interact {"steps":[{"mouse":"click","x":640,"y":400},{"wait":70}]}

{"changed":{"hits":2,"shots":2,"targets":[{"x":-9,"z":-2,"up":true},{"x":9,"z":-1,"up":true},{"x":6,"z":-7,"up":true}]}}
mouse click at (640, 400): over target (Group, 17 units)
```

The crosshair was on the second target (its board and the red centre in front of it), the shot hit, and after 70 frames both hit targets stood again at new spots. Then W for half a second, and an `eval` asking what each splat is stuck to:

```text
interact {"steps":[{"key":"KeyW","frames":30}],"trace":["player.x","player.z"]}

{"changed":{"player":{"x":-0.7,"z":8.13}}}
player.x: 0 → -0.7 at frame 30; first changed at frame 1
player.z: 10 → 8.13 at frame 30; first changed at frame 1

eval {"code":"return scene.getObjectsByProperty(\"name\", \"splat\").map(s => s.parent.parent.name)"}

["target","target"]
```

The player walked 2 units in the direction the turn pointed, not straight ahead along the room, which is W walking the way you look. Both splats are on targets, so the paint went where the shots did. What paprika3d does not do: it does not tell you whether the mouse feels too fast or the game is fun. Whether 0.0025 radians a pixel is right is your call, and the agent changes it when you say so. It does not test online play, and it has no gamepad, so aiming with a controller stick needs the device.

## Where to go next

- A world to walk and shoot in made of blocks: [how to make a minecraft clone](/guides/make-a-minecraft-clone).
- Targets that come after you: [how to make an enemy follow the player](/guides/make-an-enemy-follow-the-player) covers chasing around walls.
- A kick on every shot: [camera shake for hit feedback](/guides/threejs-camera-shake-hit-feedback), and a paint "pop" sound from [make sound effects for a game](/guides/make-sound-effects-for-a-game).
- A third-person view instead, with the camera behind a character: [the three.js third-person camera follow](/guides/threejs-third-person-camera-follow).
- New to asking an agent and checking its work: [what changes when an AI agent can see and play its three.js game](/guides/ai-agent-build-threejs-game).
