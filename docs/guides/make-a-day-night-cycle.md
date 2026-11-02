---
title: How to make a day night cycle in a game: the sun, the sky and lamps in three.js
phrase: how to make a day night cycle in a game
description: How to make a day night cycle in a game, for a first game: one number for the time of day that wraps at midnight, a sun that circles and dims below the horizon, sky and fog colours blended between a few hours, and lamps, a campfire and stars that switch on at dusk, on a small three.js campsite game; the prompt to give an AI agent, what to check when the cycle looks wrong, a moving sun's shadow redrawn a few times a second, and how the agent pictures six hours at once with paprika3d's look and counts the shadow's draw calls with perf.
meta: How to make a day night cycle in a game: one time-of-day number drives the sun, the sky, the fog and the lamps, in a small three.js campsite game.
intent: make-a-day-night-cycle
queries:
  - "how to make a day night cycle in a game"
  - "three.js day night cycle example"
  - "How Do Day Night Cycles Work?"
  - "How can I make this day/night cycle computation repeat?"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a day night cycle in a game: the sun, the sky and lamps in three.js

A day night cycle is one number: the time of day. The game adds a little to it every frame and starts it over at midnight, and everything that changes between day and night reads that number to decide how it looks right now. Four things usually follow it:

1. **The sun** moves along a circle across the sky, bright at noon and gone below the horizon at night, with a dim moon opposite.
2. **The sky's colour** goes from dark blue to orange at dawn, light blue by day, orange again at dusk. **Fog**, the haze that fades far things away, takes the same colour, so the distance matches the sky.
3. **Lights that switch**: lamps, a campfire, windows, which come on when the sun is low.
4. **Things that appear**: stars at night, fireflies, or creatures that come out after dark.

This page builds all four into a small campsite made with three.js, a JavaScript library that draws 3D scenes in a web page. You walk around the camp while a whole day passes in two minutes.

## One number: the time of day

The game keeps `time` in hours, from 0 to 24. Each frame adds the frame's share of a day:

```js
const DAY_SECONDS = 120;                               // a whole day in two minutes of play
time = ((time + dt * 24 / DAY_SECONDS) % 24 + 24) % 24; // back to 0 after 24
```

`dt` is the time since the last frame, in seconds. The `% 24` is the answer to the forum question "how can I make this day/night cycle computation repeat": it is the remainder after dividing by 24, so 24.1 becomes 0.1 and the day starts again. (The extra `+ 24` keeps it positive if you ever turn time backwards.) Storing hours, rather than seconds since the game began, also makes the rest of the code read like a clock: lamps on after 18, sunrise at 6.

## The sun on a circle

The sun's angle comes straight from the hour, and its height from that angle:

```js
const angle = (time - 6) / 24 * Math.PI * 2;  // 6:00 sunrise, 12:00 overhead, 18:00 sunset
const height = Math.sin(angle);               // 1 at noon, 0 at the horizon, below 0 at night
sun.position.set(Math.cos(angle) * 20, height * 20, -6);
sun.intensity = Math.max(0, height) * 3;
```

The sun is a `DirectionalLight`, a light whose rays all point the same way, as sunlight does; moving it moves the shadows. Below the horizon its strength is held at zero, or the ground would be lit from underneath. Night should not be pitch black either, which is easy to get wrong: the game keeps a little **ambient** light (light from every direction at once) and a weak blue moon, so the camp stays readable in the dark.

## The sky, blended between a few hours

Writing a colour for every minute would be tedious, so the game lists a few hours and blends between them:

```js
const SKY = [[0, 0x0b1026], [5, 0x1d2245], [6.5, 0xf2a65a], [8, 0x8ec5ee], [17, 0x8ec5ee], [18.5, 0xf08a4b], [20, 0x0b1026], [24, 0x0b1026]];
```

`skyAt(time)` finds the two hours on either side and mixes their colours by how far between them the time is (three.js's `Color.lerp` does the mixing). The list starts and ends with the same colour at 0 and 24, so midnight has no jump. The same colour goes to the scene's background and to its fog.

## What switches at dusk

From the sun's height, one flag: `dark = height < 0.1`, true from a little before sunset to a little after sunrise. The lamps, the campfire's glow and the fireflies follow it; the stars fade in by the sun's height, so they come out gradually. Each lamp is a `PointLight` (a light that shines in all directions from a point, like a bulb) with no shadow of its own: a point light's shadow is drawn six times, once for each side of a cube, and [three.js shadow map performance](/guides/threejs-shadow-map-performance) explains that cost.

## A moving sun's shadow

A shadow is a picture of the scene drawn from the light's point of view, and three.js redraws it on every frame by default. A sun that never moves can draw it once; a moving sun cannot. This sun moves slowly, so the game turns off the redraw every frame (`renderer.shadowMap.autoUpdate = false`) and asks for a new shadow when the time has moved on by 0.05 hours, three minutes of the game's clock. The shadows still move smoothly, and most frames skip the extra drawing. The section on testing below counts it.

## The game

Campsite day and night: walk with the arrow keys and hold T to make time run ten times faster. After dark, catch the five fireflies by walking into them. Save it as `index.html`, run `npm install three` in its folder (npm comes with Node.js), serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Campsite day and night</title>
<style>html,body{margin:0;overflow:hidden;background:#000}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#fff;font:600 18px system-ui;text-shadow:0 1px 3px #000}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// One number drives the whole cycle: the time of day in hours, 0 to 24.
const DAY_SECONDS = 120;                         // one full day takes two minutes of play
let time = 7, caught = 0, player = { x: 0, z: 4 };

// The sky's colour at a few hours of the day; colours between them are blended.
const SKY = [[0, 0x0b1026], [5, 0x1d2245], [6.5, 0xf2a65a], [8, 0x8ec5ee], [17, 0x8ec5ee], [18.5, 0xf08a4b], [20, 0x0b1026], [24, 0x0b1026]];
const skyColor = new THREE.Color(), next = new THREE.Color();
function skyAt(h) {
  let i = 0;
  while (SKY[i + 1][0] <= h) i++;
  const [h0, c0] = SKY[i], [h1, c1] = SKY[i + 1];
  return skyColor.set(c0).lerp(next.set(c1), (h - h0) / (h1 - h0));
}

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x8ec5ee, 12, 40);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 5, 14);
camera.lookAt(0, 1.5, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.autoUpdate = false;          // the sun's shadow is redrawn when the sun has moved, below
document.body.appendChild(renderer.domElement);

const sun = new THREE.DirectionalLight(0xfff2d6, 3);
sun.castShadow = true;
sun.shadow.camera.left = sun.shadow.camera.bottom = -12;
sun.shadow.camera.right = sun.shadow.camera.top = 12;
scene.add(sun);
const moon = new THREE.DirectionalLight(0x8899ff, 0);
scene.add(moon);
const ambient = new THREE.HemisphereLight(0xbfd8ff, 0x3b4a2a, 1);
scene.add(ambient);

const mesh = (geo, color, name, x, y, z, opts = {}) => {
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, ...opts }));
  m.name = name; m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m); return m;
};
mesh(new THREE.BoxGeometry(80, 0.2, 80), 0x4d7a3a, 'ground', 0, -0.1, 0);
mesh(new THREE.ConeGeometry(1.6, 2, 4), 0xd9643a, 'tent', -3, 1, -1).rotation.y = Math.PI / 4;
for (const [x, z] of [[5, -4], [7, 1], [-7, -5], [-8, 2], [2, -7]]) {
  mesh(new THREE.CylinderGeometry(0.2, 0.25, 1, 8), 0x6b4a2b, 'trunk', x, 0.5, z);
  mesh(new THREE.ConeGeometry(1.2, 3, 10), 0x2f6b34, 'tree', x, 2.4, z);
}
const fire = mesh(new THREE.ConeGeometry(0.4, 0.7, 8), 0x553322, 'campfire', 1, 0.35, 0, { emissive: 0xff6a00, emissiveIntensity: 0 });
const fireLight = new THREE.PointLight(0xff8a30, 0, 10);
fireLight.position.set(1, 1, 0);
scene.add(fireLight);
const lamps = [[-5, 3], [4, 4]].map(([x, z], i) => {
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 2, 6), 0x333333, 'lamp post', x, 1, z);
  const bulb = mesh(new THREE.SphereGeometry(0.18, 12, 8), 0x555555, `lamp${i + 1}`, x, 2.1, z, { emissive: 0xffd27a, emissiveIntensity: 0 });
  const light = new THREE.PointLight(0xffd27a, 0, 9);  // no castShadow: a point light's shadow is six extra passes
  light.position.set(x, 2.1, z);
  scene.add(light);
  return { bulb, light };
});
const hero = mesh(new THREE.CapsuleGeometry(0.3, 0.6, 4, 12), 0x3a6fd9, 'player', 0, 0.6, 0);

// Stars: points on a big dome, faded in at night.
const starPos = [];
for (let i = 0; i < 400; i++) {
  const a = Math.random() * Math.PI * 2, b = 0.9 + Math.random() * 0.6;   // b: angle from straight up
  starPos.push(Math.cos(a) * Math.sin(b) * 90, Math.cos(b) * 90, Math.sin(a) * Math.sin(b) * 90);
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, fog: false }));
stars.name = 'stars';
scene.add(stars);

// Fireflies come out after dark: walk into them to catch them.
const flies = [[-2, 2], [3, -2], [-5, -2], [5, 2], [0, -4]].map(([x, z], i) => {
  const f = mesh(new THREE.SphereGeometry(0.1, 8, 6), 0x223300, `firefly${i + 1}`, x, 1, z, { emissive: 0xccff44, emissiveIntensity: 2 });
  f.castShadow = false;
  return f;
});

let shadowTime = -1, dark = false;
function setTime(h) {                            // everything the time of day decides
  time = ((h % 24) + 24) % 24;                   // past midnight, back to 0
  const angle = (time - 6) / 24 * Math.PI * 2;   // 6:00 sunrise, 12:00 overhead, 18:00 sunset
  const height = Math.sin(angle);
  sun.position.set(Math.cos(angle) * 20, height * 20, -6);
  moon.position.set(-sun.position.x, -sun.position.y, 6);
  sun.intensity = Math.max(0, height) * 3;
  moon.intensity = Math.max(0, -height) * 0.4;
  ambient.intensity = 0.25 + Math.max(0, height) * 1.2;
  skyAt(time);
  scene.background = skyColor;
  scene.fog.color.copy(skyColor);
  dark = height < 0.1;                          // lamps on from dusk to dawn
  stars.material.opacity = Math.min(1, Math.max(0, -height * 3));
  fire.material.emissiveIntensity = dark ? 2 : 0;
  fireLight.intensity = dark ? 25 : 0;
  for (const l of lamps) { l.light.intensity = dark ? 15 : 0; l.bulb.material.emissiveIntensity = dark ? 3 : 0; }
  for (const f of flies) f.visible = dark && f.userData.caught !== true;
  if (Math.abs(time - shadowTime) > 0.05) { renderer.shadowMap.needsUpdate = true; shadowTime = time; }
}

const held = new Set();
function step(dt) {
  setTime(time + dt * 24 / DAY_SECONDS * (held.has('KeyT') ? 10 : 1));   // hold T to speed time up
  player.x = Math.min(9, Math.max(-9, player.x + (held.has('ArrowRight') - held.has('ArrowLeft')) * 4 * dt));
  player.z = Math.min(8, Math.max(-8, player.z + (held.has('ArrowDown') - held.has('ArrowUp')) * 4 * dt));
  for (const f of flies) if (f.visible && Math.hypot(f.position.x - player.x, f.position.z - player.z) < 0.8) { f.userData.caught = true; caught++; }
}

const hud = document.getElementById('hud');
let last = null;
function loop(t) {
  requestAnimationFrame(loop);
  step(last === null ? 1 / 60 : Math.min((t - last) / 1000, 0.1));
  last = t;
  hero.position.set(player.x, 0.6, player.z);
  const hh = Math.floor(time), mm = Math.floor((time - hh) * 60);
  hud.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}   Fireflies caught: ${caught} of 5   Hold T to speed up time`;
  renderer.render(scene, camera);
}

function act({ key, down = true }) { down ? held.add(key) : held.delete(key); }
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
setTime(time);
requestAnimationFrame(loop);

window.__game = {
  subject: 'player',
  describe: () => ({ name: 'campsite day and night', keys: { ArrowRight: 'walk right', ArrowLeft: 'walk left', ArrowUp: 'walk up', ArrowDown: 'walk down', KeyT: 'speed up time' } }),
  observe: () => ({ time: +time.toFixed(2), dark, caught, player: { x: +player.x.toFixed(2), z: +player.z.toFixed(2) } }),
  act,
  setState: (s) => {
    if (s.time !== undefined) setTime(s.time);
    if (s.caught !== undefined) caught = s.caught;
    if (s.player) player = { ...player, ...s.player };
  },
};
</script>
</body></html>
```

`setTime(h)` is the cycle: everything the hour decides is set there, and the rest of the game calls it once a frame. To start at another hour, change `let time = 7`. `window.__game` at the end lets a test tool read and set the time; the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes and edits your project's files) can add the cycle to a game you already have. Ask for the single number first, then what it drives:

```text
Add a day night cycle to my three.js game. Keep one time-of-day value in
hours (0 to 24, wrapping at midnight), advanced by real frame time so one day
lasts 3 minutes. From it, in one function: move a directional sun on a circle
(no light below the horizon), keep a little ambient and moonlight at night,
blend the sky and fog colour between a list of hours, and turn the street
lamps on below a sun height I can change. Redraw the sun's shadow only when
the sun has moved a little, not every frame. Add a key that speeds time up.
```

## When the cycle looks wrong

- **Night is completely black.** Every light went to zero. Keep a floor on the ambient light and add a weak moon.
- **The sky jumps at midnight.** The colour list does not start and end on the same colour, or the time is not wrapped back to 0.
- **The sky changes but the distance stays bright.** The fog colour was set once at the start. Set it every frame with the sky's.
- **The ground glows from below at night.** The sun's strength follows its height without stopping at zero.
- **Stars show in daylight**, or appear all at once. Fade their opacity by the sun's height, and turn off fog on them, or the fog hides them.
- **Shadows shimmer or are cut off** as the sun moves. The sun's shadow camera does not cover the play area; set its `left`, `right`, `top` and `bottom` to the area's size, as the game does.

## Let the agent see every hour

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs the game in a hidden Chrome browser so the agent can see and measure it. Install it in Claude Code by running these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The replies below were captured on 2026-10-31 on the game above, on a server with no graphics card where Chrome draws in software, with the folder shortened to `<project>`.

A cycle is hard to check by playing: a whole day takes two minutes, and every change to a colour means waiting for that hour again. `look` with `sheet` reloads the game once per picture and sets the hour with the game's `setState`, so six hours come back side by side in one call:

```text
look {"sheet":[{"label":"06:30","state":{"time":6.5}},{"label":"09:00","state":{"time":9}},{"label":"12:00","state":{"time":12}},{"label":"17:00","state":{"time":17}},{"label":"18:30","state":{"time":18.5}},{"label":"23:00","state":{"time":23}}]}

Picture: <project>/paprika3d/runs/2026-10-31T07-34-39-142Z/look-7-sheet.png (6 moments, left to right, top to bottom: 06:30 | 09:00 | 12:00 | 17:00 | 18:30 | 23:00); the game is reloaded at its first frame
06:30: subject player 0.38%; on screen: ground, tree ×5, tent, player, lamp post ×2, trunk ×5, campfire, lamp* ×2, … 1 more; pixels: brightness 37%, colour saturation 57%, 0% near black, 0% blown out
  Lighting: no tone mapping (renderer.toneMapping is NoToneMapping): bright colours clip to white; ACESFilmicToneMapping, AgXToneMapping or NeutralToneMapping avoid it, and ACES also mutes saturated colours, which a bright stylised look may not want.
09:00: subject player 0.38%; on screen: ground, tree ×5, tent, player, lamp post ×2, trunk ×5, campfire, lamp* ×2, … 1 more; pixels: brightness 50%, colour saturation 44%, 0% near black, 0% blown out
12:00: subject player 0.38%; on screen: ground, tree ×5, tent, player, lamp post ×2, trunk ×5, campfire, lamp* ×2, … 1 more; pixels: brightness 56%, colour saturation 44%, 0% near black, 0% blown out
17:00: subject player 0.38%; on screen: ground, tree ×5, tent, player, lamp post ×2, trunk ×5, campfire, lamp* ×2, … 1 more; pixels: brightness 41%, colour saturation 45%, 0% near black, 0% blown out
18:30: subject player 0.38%; on screen: ground, tree ×5, tent, player, lamp post ×2, trunk ×5, campfire, lamp* ×2, … 2 more; pixels: brightness 37%, colour saturation 67%, 0% near black, 0% blown out
23:00: subject player 0.38%; on screen: ground, tree ×5, tent, player, lamp post ×2, trunk ×5, campfire, lamp* ×2, … 2 more; pixels: brightness 15%, colour saturation 60%, 0% near black, 0% blown out
```

Each cell's pixel line reads the light at that hour: brightness rises from 37% at dawn to 56% at noon and falls to 15% at 23:00, while "0% near black" at night says the moon and ambient light keep the camp visible. The dusk cell has the highest colour saturation, the orange sky. The `Lighting:` line is a general note about tone mapping; with 0% blown out at noon, nothing here clips.

`interact` plays frames and checks the state. Started at 17:30, `until` steps one frame at a time until the lamps' flag turns on:

```text
interact {"steps":[{"state":{"time":17.5}},{"until":{"dark":true},"max":120}],"expect":{"dark":true,"time":[17.6,17.7]}}

{"changed":{"time":17.62,"dark":true}}
until: dark == true held at frame 35
Expect: dark true ✓ · time 17.62 ✓
```

The lamps come on at 17.62 hours, about 17:37, which is where `height < 0.1` puts dusk. To light them earlier, raise that number.

Then the shadow. `perf` measures the frame and, with `costs`, counts what the scene draws (the reply is cut to its first line and the largest groups):

```text
perf {"costs":true}

162.8 ms median frame (p95 173.4 ms, 6 fps on average), 37 draw calls, 1792 triangles, 0 MB assets; over budget: frameMs 162.8 of 16.7 ms; desktop budget; software renderer (no GPU): frame time is no budget signal, do not optimize for it
Costs by named group: the main scene's visible objects, each under its nearest named ancestor as `look` names it, counted, not timed, and with no frustum culling (the frame draws only what its camera sees, plus a shadow pass per casting light); `variants` with `hide` times a group. In all 896 triangles, 896 casting shadows, 19 draw calls, 0 MB of textures (the first line's 1792 triangles and 37 draw calls are the frame as drawn, the camera's view plus the shadow pass):
  player: 216 triangles, 216 casting shadows, 1 draw calls, 0 MB of textures
  lamp1: 168 triangles, 168 casting shadows, 1 draw calls, 0 MB of textures
  trunk: 160 triangles, 160 casting shadows, 5 draw calls, 0 MB of textures
  tree: 100 triangles, 100 casting shadows, 5 draw calls, 0 MB of textures
```

Ignore the milliseconds: the reply says itself that a software renderer's frame time is no signal. The counts are what matter. The scene is 19 draw calls and 896 triangles, all of them casting shadows, and the frame `perf` measured was one that redrew the sun's shadow, so it drew 37 calls and 1,792 triangles: the scene twice. `eval` runs code in the page; here it counts, over one second of play, how often the game asks for that redraw:

```text
eval {"code":"let asked = 0;\nfor (let i = 0; i < 60; i++) {\n  renderer.shadowMap.needsUpdate = false;\n  await new Promise(r => requestAnimationFrame(r));\n  if (renderer.shadowMap.needsUpdate) asked++;\n}\nreturn asked;"}

4
(the code awaited the paused clock, so the harness stepped it 60 frames, 1.00 s of game time, without drawing, until the code finished)
```

Four frames in 60 pay for the shadow, and the rest draw the camera's view alone. On a phone, where drawing the scene twice per frame can matter, that is the difference the `autoUpdate` line makes.

What paprika3d does not do: it does not pick your colours or tell you whether dusk looks beautiful; it pictures each hour and gives the numbers, and the judgement is yours. These timings came from a machine with no graphics card, so measure frame times on your own computer.

## Next steps

- What shadows cost and how to draw fewer: [three.js shadow map performance](/guides/threejs-shadow-map-performance).
- A night with something to do in it, gathering and building a fire: [how to make an inventory in a game](/guides/make-an-inventory-in-a-game).
- Darkness used for fear, with a flashlight: [how to make a horror game](/guides/make-a-horror-game).
- Light, colour and camera beyond the cycle: [how to make my game look better](/guides/make-my-game-look-better).
- Sparks rising from the campfire: [three.js points and particles](/guides/threejs-points-particles-size-disappear).
