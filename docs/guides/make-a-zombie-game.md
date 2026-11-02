---
title: How to make a zombie game in three.js: waves of enemies in a top-down yard
phrase: how to make a zombie game
description: How to make a zombie game for the browser as a first project: a top-down yard, a player who moves with WASD and shoots toward the mouse, zombies that come from the fences and walk at the player, and a wave list (how many, how fast, how far apart) with a short break between waves, as one three.js file to paste, with an AI agent shooting a zombie, playing to wave three and counting the crowd.
meta: How to make a zombie game in three.js: a wave list, zombies that spawn at the fences, shooting toward the mouse and a break between waves.
intent: make-a-zombie-game
queries:
  - "how to make a zombie game"
  - "how to make a game like vampire survivors"
  - "Enemy Spawning method in a Top-Down Shooter"
  - "How would I make a bullet shoot from my player to my mouse."
  - "How to create waves of enemies"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a zombie game in three.js: waves of enemies in a top-down yard

A zombie game is a survival game: enemies keep coming, each group larger and faster than the last, and you last as long as you can. For a first one, seen from above, it takes four parts. A player who walks around a yard. A way to aim and shoot, here toward the mouse pointer. Zombies that appear at the edges and walk at the player. And the part that makes it a zombie game rather than a shooting gallery: **waves**, written as a short list that says how many zombies come, how fast they walk and how far apart they arrive, with a few seconds of calm between one wave and the next. Everything on this page fits in one HTML file you can paste and play.

Games in the style of Vampire Survivors are built on the same loop, with the shooting done for you and upgrades chosen between waves; once the waves below work, those are additions, not a different game.

## The four parts

1. **The yard and the player.** A flat ground with a fence, a camera looking down at an angle, and a player moved with W, A, S and D. [How to make a character move in JavaScript](/guides/make-a-character-move-in-javascript) explains the held-keys set and moving by elapsed time, which this game uses.
2. **Aiming at the mouse.** The mouse is a point on the screen, and the player needs a point on the ground. three.js, the JavaScript library that draws the 3D here, has a `Raycaster` for this: it sends a line from the camera through the pointer and finds where it meets the ground. The player turns to face that point, and holding the mouse button fires a bullet toward it eight times a second. To click on objects instead, see [three.js click on object](/guides/threejs-click-on-object-raycaster); a shooter seen through the player's eyes is [how to make a fps game](/guides/make-a-fps-game).
3. **The zombies.** Each one appears at a random spot along the fence and walks straight at the player. In an open yard a straight walk is all a zombie needs; once there are walls in the way, it needs a path around them, which is [how to make an enemy follow the player](/guides/make-an-enemy-follow-the-player). A bullet that touches a zombie removes both; a zombie that reaches the player costs a heart.
4. **The waves.** The list below, a timer that lets out one zombie at a time, and a check that ends the wave when every zombie has been let out and none is left.

## The wave list

The list is data, kept at the top of the file where it is easy to change:

```js
const WAVES = [
  { count: 6, speed: 1.4, gap: 0.8 },
  { count: 12, speed: 1.6, gap: 0.5 },
  ...
];
```

`count` is how many zombies the wave has, `speed` how fast they walk in metres a second, and `gap` the seconds between one zombie and the next. A small gap makes a crowd arrive at once; a large one makes a stream you can pick off. The game keeps two numbers while a wave runs, how many zombies it has let out and how many are still alive. When the first reaches `count` and the second reaches zero, the wave is over: a break of `BREAK` seconds, with the next wave's number on screen, and then the next wave. After the last one, you win.

Making the game harder is then a matter of editing the list: more zombies, a faster walk, a smaller gap, or a fifth line. Change one number at a time and play it, because two changes at once make it hard to tell which one made a wave too easy or impossible.

## A zombie yard to paste

Move with WASD, aim with the mouse and hold the button to shoot; survive four waves. After a loss or a win, R starts again. The import map line near the top tells the browser where three.js is (a `node_modules/three` folder next to the file, which `npm install three` makes), and [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains the other parts of such a page.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Zombie yard</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block;cursor:crosshair}#hud{position:fixed;top:16px;left:20px;font:600 22px system-ui;color:#fff}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The waves: how many zombies, how fast they walk (units a second), and the seconds between two of them.
const WAVES = [
  { count: 6, speed: 1.4, gap: 0.8 },
  { count: 12, speed: 1.6, gap: 0.5 },
  { count: 20, speed: 1.8, gap: 0.35 },
  { count: 32, speed: 2.0, gap: 0.25 },
];
const BREAK = 3;            // seconds of calm before each wave
const HALF_W = 10, HALF_D = 7; // the yard runs from -10 to 10 across and -7 to 7 deep

const held = new Set();
function act({ key, down = true }) {
  if (down) held.add(key); else held.delete(key);
  if (key === 'KeyR' && down && (over || won)) start(1, 3);
}
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2418);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 17, 10);
camera.lookAt(0, 0, 0.5);
scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x304020, 2.2));
const moon = new THREE.DirectionalLight(0xffffff, 1.6);
moon.position.set(-4, 10, 6);
scene.add(moon);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W * 2, HALF_D * 2).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x4a6a34 }));
ground.name = 'yard';
scene.add(ground);
const fenceMaterial = new THREE.MeshStandardMaterial({ color: 0x7a5a3a });
for (const [x, z, w, d] of [[0, -HALF_D, HALF_W * 2, 0.3], [0, HALF_D, HALF_W * 2, 0.3], [-HALF_W, 0, 0.3, HALF_D * 2], [HALF_W, 0, 0.3, HALF_D * 2]]) {
  const fence = new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, d), fenceMaterial);
  fence.name = 'fence';
  fence.position.set(x, 0.3, z);
  scene.add(fence);
}

const player = new THREE.Group();
player.name = 'player';
const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1, 20), new THREE.MeshStandardMaterial({ color: 0x3080ff }));
body.position.y = 0.5;
const gun = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.7), new THREE.MeshStandardMaterial({ color: 0x202020 }));
gun.position.set(0.25, 0.7, 0.45);
player.add(body, gun);
scene.add(player);

const zombieGeometry = new THREE.CapsuleGeometry(0.35, 0.6, 4, 10), zombieMaterial = new THREE.MeshStandardMaterial({ color: 0x80c040 });
const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 6), bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffe060 });
const hud = document.getElementById('hud');

// The mouse aims: a ray from the camera through the pointer, to where it meets the ground.
const raycaster = new THREE.Raycaster(), floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const aim = new THREE.Vector3(0, 0, -5);
let firing = false;
function aimAt(e) {
  raycaster.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  raycaster.ray.intersectPlane(floorPlane, aim);
}
addEventListener('pointermove', aimAt);
addEventListener('pointerdown', e => { aimAt(e); firing = true; });
addEventListener('pointerup', () => { firing = false; });

let wave, phase, breakLeft, spawned, spawnIn, cooldown, hearts, kills, over, won;
let zombies = [], bullets = [];

function start(n, lives) {
  for (const o of [...zombies, ...bullets]) scene.remove(o);
  zombies = []; bullets = [];
  wave = n; hearts = lives; kills = 0; over = won = false;
  phase = 'break'; breakLeft = BREAK; cooldown = 0;
  player.position.set(0, 0, 0);
}

function spawnZombie() {
  // somewhere along one of the four fences, chosen at random
  const side = Math.floor(Math.random() * 4), t = Math.random() * 2 - 1;
  const z = new THREE.Mesh(zombieGeometry, zombieMaterial);
  z.name = 'zombie';
  if (side < 2) z.position.set(t * HALF_W, 0.65, side ? HALF_D - 0.5 : -HALF_D + 0.5);
  else z.position.set(side === 2 ? -HALF_W + 0.5 : HALF_W - 0.5, 0.65, t * HALF_D);
  scene.add(z);
  zombies.push(z);
}

function step(dt) {
  if (over || won) return;
  const w = WAVES[wave - 1];
  if (phase === 'break') {
    breakLeft -= dt;
    if (breakLeft <= 0) { phase = 'fight'; spawned = 0; spawnIn = 0; }
  } else {
    spawnIn -= dt;
    if (spawned < w.count && spawnIn <= 0) { spawnZombie(); spawned++; spawnIn = w.gap; }
    if (spawned === w.count && zombies.length === 0) {
      if (wave === WAVES.length) won = true;
      else { wave++; phase = 'break'; breakLeft = BREAK; }
    }
  }

  // move with WASD, inside the fence, and face the aim point
  const mx = (held.has('KeyD') ? 1 : 0) - (held.has('KeyA') ? 1 : 0), mz = (held.has('KeyS') ? 1 : 0) - (held.has('KeyW') ? 1 : 0);
  const len = Math.hypot(mx, mz) || 1;
  player.position.x = THREE.MathUtils.clamp(player.position.x + mx / len * 5 * dt, -HALF_W + 0.6, HALF_W - 0.6);
  player.position.z = THREE.MathUtils.clamp(player.position.z + mz / len * 5 * dt, -HALF_D + 0.6, HALF_D - 0.6);
  player.rotation.y = Math.atan2(aim.x - player.position.x, aim.z - player.position.z);

  // hold the mouse button to shoot toward the aim point, eight shots a second
  cooldown -= dt;
  if (firing && cooldown <= 0) {
    cooldown = 0.125;
    const b = new THREE.Mesh(bulletGeometry, bulletMaterial);
    b.name = 'bullet';
    b.position.set(player.position.x, 0.7, player.position.z);
    b.userData.dir = new THREE.Vector3(aim.x - b.position.x, 0, aim.z - b.position.z).normalize();
    scene.add(b);
    bullets.push(b);
  }
  for (const b of bullets) b.position.addScaledVector(b.userData.dir, 18 * dt);

  // zombies walk straight at the player; a bullet removes one, a touch costs a heart
  for (const z of zombies) {
    const to = new THREE.Vector3(player.position.x - z.position.x, 0, player.position.z - z.position.z);
    if (to.length() < 0.7) { z.userData.gone = true; hearts--; continue; }
    z.position.addScaledVector(to.normalize(), w.speed * dt);
    z.rotation.y = Math.atan2(to.x, to.z);
    const hit = bullets.find(b => !b.userData.gone && b.position.distanceTo(z.position) < 0.6);
    if (hit) { hit.userData.gone = z.userData.gone = true; kills++; }
  }
  for (const b of bullets) if (Math.abs(b.position.x) > HALF_W || Math.abs(b.position.z) > HALF_D) b.userData.gone = true;
  for (const o of [...zombies, ...bullets]) if (o.userData.gone) scene.remove(o);
  zombies = zombies.filter(z => !z.userData.gone);
  bullets = bullets.filter(b => !b.userData.gone);
  if (hearts <= 0) over = true;
}

function drawHud() {
  if (over) hud.textContent = `Overrun on wave ${wave} after ${kills} zombies. Press R`;
  else if (won) hud.textContent = `You held the yard! ${kills} zombies. Press R`;
  else if (phase === 'break') hud.textContent = `Wave ${wave} in ${Math.ceil(breakLeft)}  ·  Hearts ${hearts}`;
  else hud.textContent = `Wave ${wave}  ·  Zombies ${WAVES[wave - 1].count - spawned + zombies.length}  ·  Hearts ${hearts}`;
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
// ?wave=4&hearts=99 in the address starts at a later wave with more hearts, to test it without playing the others
const params = new URLSearchParams(location.search);
start(+params.get('wave') || 1, +params.get('hearts') || 3);
let last = null;
renderer.setAnimationLoop((now) => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  drawHud();
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'zombie yard', units: 'metres', keys: { KeyW: 'move up', KeyA: 'move left', KeyS: 'move down', KeyD: 'move right', KeyR: 'restart after the end' }, mouse: 'aim; hold the button to shoot' }),
  observe: () => ({ wave, phase, alive: zombies.length, spawned, kills, hearts, over, won, bullets: bullets.length,
    player: { x: +player.position.x.toFixed(2), z: +player.position.z.toFixed(2) } }),
  act,
  setState: (s) => start(s.wave ?? 1, s.hearts ?? 3),
  subject: player,
};
</script>
</body></html>
```

`step` runs once a frame (each picture the browser draws). Its first part is the wave: counting down the break, letting out a zombie each `gap`, and moving to the next wave. Then the player moves and turns toward `aim`, which the pointer events keep up to date; bullets fly; zombies walk, and anything hit or arrived is removed. Typing `?wave=4&hearts=99` after the file name in the address bar starts at the last wave with plenty of hearts, so you can try a wave without playing the ones before it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes and edits your project's files) can build this from a description. Ask for the waves as a list so you can tune them yourself afterwards:

```text
Make a top-down zombie game in one HTML file with three.js. The player moves with WASD
inside a fenced yard and shoots toward the mouse pointer while the button is held.
Zombies appear at random spots along the fence and walk straight at the player.
Put the waves in one list at the top of the file, each with a count, a walking speed
and the seconds between two zombies, and give 3 seconds of calm before every wave.
A zombie that reaches the player costs one of 3 hearts. Let ?wave=N in the address
start at wave N, so each wave can be tested on its own.
```

## Let the agent play the waves

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs the game in a hidden Chrome browser so the agent can see and play what it wrote. Three of its tools fit a wave game: `look` for a picture and a list of what is on screen, `interact` to play mouse and key steps on exact frames, and `perf` to count what each frame draws.

After 200 frames the first zombie is in the yard, and `look` lists it with its box on screen:

```text
interact {"steps":[{"wait":200}]}

{"changed":{"phase":"fight","alive":1,"spawned":1}}

look {}

…
On screen (8):
yard 57% [61, 131, 1218, 719] 20 × 14 units
fence ×4 9.2% [19, 103, 1260, 744] 14–20 × 0.6 units
player ×2 0.21% [620, 325, 659, 395]
zombie 0.14% [1015, 98, 1056, 148]
Never visible: none
```

`interact` then holds the mouse button down on the middle of that box, and its reply names what is under the pointer:

```text
interact {"steps":[{"mouse":"down","x":1035,"y":123},{"wait":40},{"mouse":"up","x":1035,"y":123}],"trace":["bullets","kills"],"expect":{"kills":1}}

{"changed":{"spawned":2,"kills":1,"bullets":5}}
mouse down at (1035, 123): over zombie (Mesh, 24.5 units)
mouse up at (1035, 123): over fence (Mesh, 25.5 units)
bullets: 0 → 5 at frame 41; first changed at frame 1
kills: 0 → 1 at frame 33; first changed at frame 33
Expect: kills 1 ✓
```

The zombie falls at frame 33. Next, do the waves arrive as the list says? With 99 hearts so the player cannot lose, standing still, an `until` step plays until wave 3 begins:

```text
interact {"steps":[{"state":{"hearts":99}},{"until":{"wave":3},"max":3000}],"trace":["phase","alive"]}

{"changed":{"wave":3,"phase":"break","alive":0,"spawned":12,"kills":0,"hearts":81,"bullets":0}}
until: wave == 3 held at frame 1702
Trace (the first 600 frames):
phase: "break" until frame 179, then "fight"
alive: 0 → peak 6 at frame 420 → 5 at frame 442; first changed at frame 180
```

The calm before wave 1 lasts until frame 179, the three seconds `BREAK` asks for. The player lost 18 hearts, one for each zombie of waves 1 and 2 (6 and 12), so every zombie the list promised came and reached the player. The last wave is the largest crowd; `trace` reads the count of zombies alive on each frame:

```text
interact {"steps":[{"state":{"wave":4,"hearts":999}},{"until":{"spawned":32},"max":1200}],"trace":["alive"]}

{"changed":{"wave":4,"phase":"fight","alive":17,"spawned":32,"hearts":984}}
until: spawned == 32 held at frame 645
Trace (the first 600 frames):
alive: 0 → peak 21 at frame 570 → 19 at frame 600; first changed at frame 180
```

At most 21 zombies are in the yard at once. `perf` with `costs` counts what each frame draws; opened at the last wave, its sample came a few seconds in:

```text
open {"url":"index.html?wave=4&hearts=999","cwd":"<project>"}

perf {"costs":true}

57.8 ms median frame (p95 62.7 ms, 17 fps on average), 14 draw calls, 1402 triangles, 0 MB assets; over budget: frameMs 57.8 of 16.7 ms; desktop budget; software renderer (no GPU): frame time is no budget signal, do not optimize for it
Work per frame: 56.9 ms a frame that drew (the median of 8), 56.8 ms of it the frame's code; 57.3 ms a frame on average over 8 stepped, the slowest 59.2 ms; paused frames, each timed from its step to the end of its GPU work, with no wait for the display.
Load to first frame: 0.1 s.
Host load 11.9 on 64 cores. GPU: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). A software renderer (no GPU): frame times here say nothing of a real GPU's.
Textures 0 MB on the GPU (largest 0 px), 1 shader programs, pixel ratio 1, heap 8.3 MB, 70 long tasks, 0 frames over 3× the median (GC-like pauses); noise between two samples 2.9 ms.
Costs by named group: the main scene's visible objects, each under its nearest named ancestor as `look` names it, counted, not timed, and with no frustum culling (the frame draws only what its camera sees, plus a shadow pass per casting light); `variants` with `hide` times a group. In all 1402 triangles, 0 casting shadows, 14 draw calls, 0 MB of textures:
  zombie: 1260 triangles, 0 casting shadows, 7 draw calls, 0 MB of textures
  player: 92 triangles, 0 casting shadows, 2 draw calls, 0 MB of textures
  fence: 48 triangles, 0 casting shadows, 4 draw calls, 0 MB of textures
  yard: 2 triangles, 0 casting shadows, 1 draw calls, 0 MB of textures
```

The zombie line says 7 draw calls for 7 zombies: each zombie is a separate mesh that the graphics card draws on its own. That is fine for a crowd of 21; for hundreds, draw them as one instanced mesh, as [three.js too many meshes](/guides/threejs-too-many-meshes-merge-or-instance) explains. The frame times in that reply come from a machine with no graphics card and say nothing about yours. These replies were captured on 2026-10-30, with Chrome drawing in software.

paprika3d does not decide whether a wave is too hard or too easy; it shows how many zombies came, when, and how many hearts they took, and you judge the rest by playing. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Without paprika3d

Use the `?wave=` switch to jump to the wave you are tuning, and the hearts switch to watch a whole wave arrive without dying. Ask the agent to print one line to the browser console (the panel of messages a page writes, opened with F12) at the end of every wave: its number, the zombies let out, the zombies shot and the hearts left. Compare those lines with the list after each change.

## Next steps

- Show the wave reached and a restart button when the player falls: [how to add a game over screen](/guides/add-a-game-over-screen).
- Keep the record wave: [how to save the high score](/guides/save-the-high-score).
- Make each hit felt: [how to make a game feel good](/guides/make-a-game-feel-good), with sounds from [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Waves that follow a fixed road, stopped by towers you place: [how to make a tower defense game](/guides/make-a-tower-defense-game).
- A pause and a title screen: [how to make a main menu for a game](/guides/make-a-main-menu).
