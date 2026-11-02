---
title: How to make a horror game in three.js: darkness, a flashlight and something following
phrase: how to make a horror game
description: How to make a horror game in the browser as a first project: a dark house made of fog and almost no light, a flashlight that rides on the camera, three keys to find, something that moves while it is outside the beam and freezes in it, and a heartbeat that quickens as it nears, in one three.js file, with an AI agent measuring how dark the frame is, walking to a key and checking that the thing stops when the light is on it.
meta: How to make a horror game in three.js: darkness and fog, a flashlight on the camera, something that moves when unseen, a heartbeat.
intent: make-a-horror-game
queries:
  - "how to make a horror game"
  - "three js horror game"
  - "how to make a game like fnaf"
  - "What makes a good jump scare?"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a horror game in three.js: darkness, a flashlight and something following

A horror game frightens with what the player cannot see. A first one needs five parts: a dark place, a light the player carries that shows a small part of it, a reason to go into the dark (here, three keys to find before the door opens), something that comes for the player, and a sound that says it is getting close. Each is a few lines of code. Whether the result is frightening depends on pacing, sound and restraint more than on any one technique, and you find that out by letting someone play it with the lights off.

The game on this page is first person, seen through the player's eyes: W and S walk, A and D turn. It is built with three.js, a JavaScript library that draws 3D in a web page, and fits in one HTML file.

## Darkness: almost no light, and fog that turns to black

Three settings make a scene dark:

- **The background** is black, so anything the light does not reach is black too.
- **The ambient light**, the faint light that reaches everywhere, is turned almost off: `AMBIENT` near the top of the file. At 0 the unlit parts are pitch black; raise it a little if players get lost.
- **Fog** fades things into the background colour with distance. `new THREE.Fog(0x000000, 2, 14)` starts the fade 2 metres away and finishes it at 14, so a corridor disappears into black instead of ending at a wall you can see.

The hard part is the balance. Too much light and the house is just a building; too little and the player sees nothing at all, which is confusing rather than frightening. Below, the agent measures it.

## The flashlight: a spotlight that rides on the camera

A `SpotLight` lights a cone, like a torch. Added to the camera, it moves and turns with the player's view, so the beam always points where they look. Its numbers are, in order, the colour, the strength, how far it reaches, the angle of the beam, how soft its edge is and how fast it fades with distance. A slightly yellow colour and a soft edge read as a real torch; a narrow angle shows less of the room, which is scarier and harder.

## Something that follows when you are not looking

The thing in the house follows one rule: it moves toward the player while it is outside the flashlight's beam, and not at all while it is inside. The game compares the direction the player faces with the direction to the thing, and when the angle between them is smaller than the beam's angle, the thing freezes. Turn away and it comes closer; turn back and it is nearer than it was. It waits `WAKE` seconds before it first moves, and it passes through walls, so it never needs to find a way around them. A creature that has to walk around walls needs a path search, explained in [how to make an enemy follow the player](/guides/make-an-enemy-follow-the-player); one whose view walls block is in [how to make a stealth game](/guides/make-a-stealth-game).

A game in the style of Five Nights at Freddy's keeps the player in one room, watching cameras and doors instead of walking; the same parts apply there too: little light, a light or a door with limits, and something that moves while it is not watched.

## A heartbeat that quickens

Sound does most of the work in horror. Here, a low thump plays like a heartbeat whenever the thing is within 7 metres, with less time between beats and more volume as it gets nearer. It is made in code with the browser's Web Audio (no sound files), and as in every browser game, no sound can start before the player's first key press. [How to make sound effects for a game](/guides/make-sound-effects-for-a-game) explains how such sounds are built. A sudden loud sound when the thing appears is the classic jump scare; used once, at a moment the player did not expect, it lands; used often, players stop jumping.

## The dark house

Find the three keys, then the door at the bottom of the map opens. The import map line near the top tells the browser where three.js is (a `node_modules/three` folder next to the file, which `npm install three` makes), and [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains the other parts of such a page.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>The dark house</title>
<style>html,body{margin:0;overflow:hidden;background:#000}canvas{display:block}#hud{position:fixed;top:16px;left:20px;font:600 20px system-ui;color:#c8c0a8}</style></head>
<body>
<div id="hud">Find the three keys. W and S walk, A and D turn.</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// # wall, . floor, K key, S where you start, M where it waits, D the way out (locked until you hold every key).
const MAP = [
  '##########',
  '#....#..K#',
  '#.##.#...#',
  '#.#..#.#.#',
  '#.#.##.#.#',
  '#...K..#.#',
  '#K##.###.#',
  '#..#.....#',
  '#S.#.##M.#',
  '####D#####',
];
const AMBIENT = 0.06;   // the faint light everywhere: 0 is pitch black, 1 is a lit room
const WAKE = 5;         // seconds before it starts to move

const held = new Set();
function act({ key, down = true }) {
  if (down) { held.add(key); startAudio(); } else held.delete(key);
  if (down && key === 'KeyR' && (caught || escaped)) reset();
}
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 2, 14);  // things fade into black from 2 metres away and are gone by 14
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 50);
scene.add(camera);
const ambient = new THREE.HemisphereLight(0x8090b0, 0x201810, AMBIENT);
scene.add(ambient);

// The flashlight: a spotlight that rides on the camera and points where you look.
const flashlight = new THREE.SpotLight(0xfff0d0, 60, 14, 0.45, 0.5, 1.2); // colour, strength, reach, beam angle, soft edge, fall-off
flashlight.position.set(0.2, -0.2, 0);
flashlight.target.position.set(0, -0.45, -1);
camera.add(flashlight, flashlight.target);

const cells = (ch) => MAP.flatMap((row, z) => [...row].flatMap((c, x) => c === ch ? [{ x, z }] : []));
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8a8a78, roughness: 0.9 }), wallGeometry = new THREE.BoxGeometry(1, 2.4, 1);
for (const { x, z } of cells('#')) {
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.name = 'wall';
  wall.position.set(x, 1.2, z);
  scene.add(wall);
}
const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.8 }));
floor.name = 'floor';
floor.position.set(4.5, 0, 4.5);
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(10, 10).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x302820 }));
ceiling.name = 'ceiling';
ceiling.position.set(4.5, 2.4, 4.5);
const door = new THREE.Mesh(new THREE.BoxGeometry(1, 2.4, 0.2), new THREE.MeshStandardMaterial({ color: 0x5a2a18 }));
door.name = 'door';
door.position.set(cells('D')[0].x, 1.2, cells('D')[0].z - 0.4);
scene.add(floor, ceiling, door);

const keyGeometry = new THREE.TorusGeometry(0.12, 0.04, 8, 16), keyMaterial = new THREE.MeshStandardMaterial({ color: 0xffc040, emissive: 0x402000, roughness: 0.4 });
const thing = new THREE.Group();
thing.name = 'thing';
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.3, 4, 12), new THREE.MeshStandardMaterial({ color: 0x0c0c10, roughness: 1 }));
body.position.y = 0.95;
const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff2010 }), eyeGeometry = new THREE.SphereGeometry(0.035, 8, 6);
for (const side of [-0.09, 0.09]) {
  const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  eye.position.set(side, 1.6, -0.27);
  thing.add(eye);
}
thing.add(body);
scene.add(thing);
const hud = document.getElementById('hud');

// A heartbeat that comes faster and louder as it gets close, made in code with Web Audio (no sound files).
let audio = null;
function startAudio() { audio ??= new AudioContext(); audio.resume(); }
function thump(volume) {
  if (!audio || audio.state !== 'running') return;
  const t = audio.currentTime, osc = audio.createOscillator(), gain = audio.createGain();
  osc.frequency.setValueAtTime(70, t);
  osc.frequency.exponentialRampToValueAtTime(35, t + 0.15);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + 0.25);
}

let px, pz, yaw, keys, time, beatIn, seen, caught, escaped;
function reset() {
  const s = cells('S')[0], m = cells('M')[0];
  px = s.x; pz = s.z; yaw = 0;   // yaw 0 faces up the map (toward row 0)
  thing.position.set(m.x, 0, m.z);
  for (const k of scene.children.filter(o => o.name === 'key')) scene.remove(k);
  for (const { x, z } of cells('K')) {
    const key = new THREE.Mesh(keyGeometry, keyMaterial);
    key.name = 'key';
    key.position.set(x, 0.9, z);
    scene.add(key);
  }
  keys = 0; time = 0; beatIn = 0; seen = false; caught = escaped = false;
  door.visible = true;
  ambient.intensity = AMBIENT;
  hud.textContent = 'Find the three keys. W and S walk, A and D turn.';
}

const blocked = (x, z) => [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].some(([dx, dz]) => {
  const c = MAP[Math.round(z + dz)]?.[Math.round(x + dx)] ?? '#';
  return c === '#' || (c === 'D' && keys < 3);
});

function step(dt) {
  if (caught || escaped) return;
  time += dt;
  yaw += ((held.has('KeyA') ? 1 : 0) - (held.has('KeyD') ? 1 : 0)) * 2.2 * dt;
  const walk = ((held.has('KeyW') ? 1 : 0) - (held.has('KeyS') ? 1 : 0)) * 2.2 * dt;
  const nx = px - Math.sin(yaw) * walk, nz = pz - Math.cos(yaw) * walk;
  if (!blocked(nx, pz)) px = nx;
  if (!blocked(px, nz)) pz = nz;

  for (const k of scene.children.filter(o => o.name === 'key')) {
    k.rotation.y += dt * 2;
    if (Math.hypot(k.position.x - px, k.position.z - pz) < 0.6) { scene.remove(k); keys++; }
  }
  if (keys === 3) door.visible = false;
  hud.textContent = keys === 3 ? 'The door is open. Get out.' : `Keys ${keys} / 3`;
  const exit = cells('D')[0];
  if (keys === 3 && Math.hypot(exit.x - px, exit.z - pz) < 0.5) { escaped = true; hud.textContent = 'You got out. R to play again'; return; }

  // It moves only while it is outside the flashlight's beam, and it passes through walls.
  const toThing = new THREE.Vector2(thing.position.x - px, thing.position.z - pz), distance = toThing.length();
  const facing = new THREE.Vector2(-Math.sin(yaw), -Math.cos(yaw));
  seen = distance < 10 && facing.angleTo(toThing.clone().normalize()) < flashlight.angle;
  if (time > WAKE && !seen) {
    thing.position.x -= toThing.x / distance * 0.9 * dt;
    thing.position.z -= toThing.y / distance * 0.9 * dt;
  }
  thing.rotation.y = Math.atan2(px - thing.position.x, pz - thing.position.z) + Math.PI;
  if (distance < 0.7) { caught = true; hud.textContent = 'It found you. R to try again'; }

  beatIn -= dt;
  if (distance < 7 && beatIn <= 0) {
    beatIn = 0.35 + distance / 7 * 0.9;      // from 1.25 s apart at 7 metres to 0.35 s up close
    thump(0.15 + (1 - distance / 7) * 0.6);
  }
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
reset();
let last = null;
renderer.setAnimationLoop((now) => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  camera.position.set(px, 1.5, pz);
  camera.rotation.set(0, yaw, 0);
  renderer.render(scene, camera);
});

const round = (v) => +v.toFixed(2);
window.__game = {
  describe: () => ({ name: 'the dark house', units: 'metres', keys: { KeyW: 'walk forward', KeyS: 'walk back', KeyA: 'turn left', KeyD: 'turn right', KeyR: 'restart after the end' } }),
  observe: () => ({ keys, seen, awake: time > WAKE, distance: round(Math.hypot(thing.position.x - px, thing.position.z - pz)), caught, escaped,
    player: { x: round(px), z: round(pz), facing: Math.round(THREE.MathUtils.radToDeg(yaw)) } }),
  act,
  // { player: [x, z, degrees], thing: [x, z], ambient } sets up a test
  setState: (s) => {
    reset();
    if (s.player) { [px, pz] = s.player; yaw = THREE.MathUtils.degToRad(s.player[2] ?? 0); }
    if (s.thing) thing.position.set(s.thing[0], 0, s.thing[1]);
    if (s.ambient !== undefined) ambient.intensity = s.ambient;
  },
  subject: thing,
};
</script>
</body></html>
```

The house is the `MAP` rows. `step` turns and walks the player, stopping at walls; picks up keys; opens the door at three; moves the thing when it is outside the beam; and plays a beat when one is due. The camera and its flashlight follow the player each frame.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes and edits your project's files) can build a first version from a description of the feeling and the rules:

```text
Make a first-person horror game in one HTML file with three.js: a small dark house,
almost no ambient light, black fog, and a flashlight (a SpotLight on the camera).
W and S walk, A and D turn. Three keys to find, then the front door opens.
Something waits in the house and moves toward me only while it is outside my
flashlight's beam; it freezes when the beam is on it. Play a low heartbeat when it
is within 7 metres, faster as it gets closer, starting on my first key press.
Keep the corridors dark but the floor in the beam clearly visible.
```

The last line matters: an agent asked for "dark" can make a frame so black the game cannot be played.

## Let the agent check the dark

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs the game in a hidden Chrome browser so the agent can see and play what it wrote. "Too dark" is a judgement a person makes by eye; `look`, which takes a picture of the page, turns it into numbers: the share of the frame that is near black, and with `sample`, the colour at chosen points. Here on a first draft, with fog that ended at 8 metres and a weaker flashlight, sampling the floor in the beam, the middle of the beam, and two points outside it:

```text
look {"sample":[[640,560],[640,400],[300,400],[100,100]]}

Pixels: brightness 6%, colour saturation 9%, 84% near black, 0% blown out. Mostly black: a blank or unlit frame? Pale: little colour.
…
Colours (5 × 5 mean, in the page's pixels): (640, 560) #070301, (640, 400) #010101, (300, 400) #000000, (100, 100) #000000.
```

84% near black, and even the middle of the beam came out nearly pure black: the corridor ahead was invisible. `eval` runs code in the open page, so the agent tried a stronger light and longer fog there before changing the file, and looked again:

```text
eval {"code":"const light = scene.getObjectByProperty(\"type\", \"SpotLight\"); light.intensity = 60; light.decay = 1.2; scene.fog.near = 2; scene.fog.far = 14; return \"changed\""}

changed

look {"sample":[[640,560],[640,400],[300,400],[100,100]]}

Pixels: brightness 10%, colour saturation 7%, 80% near black, 0% blown out; 20% of the picture changed since the last look. Mostly black: a blank or unlit frame? Pale: little colour.
…
Colours (5 × 5 mean, in the page's pixels): (640, 560) #321f12, (640, 400) #59543f, (300, 400) #000000, (100, 100) #000000.
```

The beam now shows the floor and the corridor, and the points outside it are still black: dark, but playable. Those are the numbers in the file above. An earlier draft's first `look` also caught a problem with the keys:

```text
Lighting: 1 metallic materials with no environment map (scene.environment unset): metal reflects nothing and draws black.
```

They were made of metal, and metal in three.js shows what is around it; with nothing around it, a key would have drawn black in the dark. Plain gold fixed it. `interact` then walks to the first key, holding W until the state says it was picked up (the one sound is a heartbeat: the key lies within 7 metres of where the thing waits):

```text
interact {"steps":[{"key":"KeyW","down":true},{"until":{"keys":1},"max":300},{"key":"KeyW","down":false}],"trace":["player.z"]}

{"changed":{"keys":1,"distance":6.17,"player":{"z":6.57}}}
Sound: 1 started during these steps.
until: keys == 1 held at frame 39
player.z: 8 → 6.57 at frame 39; first changed at frame 1
```

And the rule that makes it horror: the thing 4 metres down the corridor, once with the player facing it and once facing away. A key press first, since sound needs one:

```text
interact {"steps":[{"state":{"player":[1,8,0],"thing":[1,4]}},{"key":"KeyR"},{"wait":600}],"trace":["seen","distance"]}

{"changed":{"keys":0,"seen":true,"awake":true,"distance":4,"player":{"z":8}}}
Sound: 12 started during these steps.
Trace (the first 600 frames):
seen: true throughout the 600 frames
distance: 4 throughout the 600 frames

interact {"steps":[{"state":{"player":[1,8,180],"thing":[1,4]}},{"key":"KeyR"},{"until":{"caught":true},"max":900}],"trace":["seen","distance"]}

{"changed":{"seen":false,"distance":0.68,"caught":true,"player":{"facing":180}}}
Sound: 12 started during these steps.
until: caught == true held at frame 519
seen: false throughout the 519 frames
distance: 4 → 0.68 at frame 519; first changed at frame 299
```

Faced, it never moved in 600 frames. With its back turned, the player was caught at frame 519; the thing began to move at frame 299, the 5 seconds of `WAKE`. The Sound line counts the heartbeats that started. These replies were captured on 2026-10-30 on a machine with no graphics card, where Chrome draws in software.

paprika3d cannot tell you whether the game is scary, and it hears nothing: it counts the sounds a page starts and measures light. `open` also writes `fx.js` into the project, whose `sfx` makes sounds in code and includes a low `thud` among its presets. To add paprika3d to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Without paprika3d

Play it in a dark room and in a bright one, on a laptop screen turned down: a frame you can read on a bright monitor in the dark and not elsewhere is too dark. Add a test key that raises `AMBIENT` to 1, so you can see the whole house and check its layout, and one that freezes the thing while you walk around.

## Next steps

- Show what happened and offer a restart when it catches you: [how to add a game over screen](/guides/add-a-game-over-screen).
- A pause screen, so a scared player can stop: [how to make a main menu for a game](/guides/make-a-main-menu).
- More on light, fog and colour: [how to make my game look better](/guides/make-my-game-look-better).
- An enemy that has to see you first: [how to make a stealth game](/guides/make-a-stealth-game).
