---
title: How to make a game for my girlfriend (or anyone): a personal three.js game as a gift
phrase: how to make a game for my girlfriend
description: How to make a game for your girlfriend, boyfriend or a friend's birthday with an AI agent, when you have never made one: pick one personal idea, keep it to a few minutes of play, fill in their name, your photos and a message, test it all the way to the end and send a link. Shown on a small three.js birthday walk, with paprika3d catching a misnamed photo and recording a clip to send first.
meta: How to make a game for your girlfriend or anyone: a short three.js birthday walk with their name, your photos and a message.
intent: make-a-game-for-my-girlfriend
queries:
  - "how to make a game for my girlfriend"
  - "how to make a game for my girlfriend to play"
  - "how to make a game for my boyfriend to play"
  - "how to make a birthday game"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a game for my girlfriend (or anyone): a personal three.js game as a gift

A game made as a gift works because of what is in it, not how much of it there is. Your girlfriend, boyfriend or friend will play it once or twice, probably on their phone or laptop, and what they will remember is their name, a photo of a day you shared and the message at the end. So the plan is small: one personal idea, a few minutes of play, and an ending that says what you want to say. You do not need to know how to code. An AI coding agent (an assistant such as Claude Code that writes and edits the files in a project folder for you) can write the whole game from a description, and this page gives you a working one to start from.

## Pick one personal idea

Choose a game they can finish in five minutes, with one thing to do, built around something that is yours together. A few that work:

- **A walk through your places.** They walk a path past photos of places you have been, collecting the letters of their name, and a cake or a message waits at the end. This is the game on this page.
- **Catch the things they love.** Their favourite snacks fall from the sky and they move a basket to catch them; a missed one costs a life, and a high enough score opens the message.
- **Find the notes.** A small room with notes hidden behind objects; each one is a memory, and the last one asks the question you want to ask.
- **Your inside joke as the hero.** A dog you both adore, a running joke or a place name as the thing they steer.

Leave out what takes weeks: a story with many scenes, a world to explore, levels that need balancing. One finished small game is a better present than a large one that is not ready on the day. If you would like help choosing, [what game should I make first?](/guides/what-game-should-i-make-first) compares small first games.

## The game: a birthday walk

The arrow keys walk a figure along a winding path of stepping stones. Each letter of their name floats beside the path; walk into it to collect it. A photo stands between the letters, and at the end a cake waits. When every letter is found, its candles light and the message appears. three.js, a JavaScript library that draws 3D graphics in a web page, does the drawing, and the whole game is this one file:

```html
<!-- verify act=ArrowUp -->
<!doctype html>
<html><head><meta charset="utf-8"><title>A birthday walk</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:16px;left:0;right:0;text-align:center;font:700 30px system-ui;letter-spacing:8px;color:#b0306a}
#card{position:fixed;left:10%;right:10%;bottom:10%;padding:20px;border-radius:14px;background:#fffbf2;font:24px Georgia,serif;text-align:center;display:none}</style></head>
<body>
<div id="hud"></div><div id="card"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The three settings that make it theirs.
const NAME = 'ALEX';
const MESSAGE = 'Happy birthday, Alex! Here is to every walk we take together.';
const PHOTOS = [];   // pictures in a photos folder beside this file: ['photos/beach.jpg', 'photos/picnic.jpg']

const STEP = 6;                              // metres between letters
const END = -STEP * (NAME.length + 1);       // where the cake stands
const pathX = z => Math.sin(z * 0.12) * 3;   // the path winds left and right
const held = new Set();
let pz = 2, off = 0, got = [...NAME].map(() => false);

function act({ key, down = true }) { down ? held.add(key) : held.delete(key); }
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffd6e0);
scene.fog = new THREE.Fog(0xffd6e0, 15, 45);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
scene.add(new THREE.HemisphereLight(0xffffff, 0x88aa66, 2.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(3, 8, 4);
scene.add(sun);

// A picture drawn in code, for the letters and the empty photo frames.
function paint(w, h, draw) {
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
  draw(c.getContext('2d'));
  return Object.assign(new THREE.CanvasTexture(c), { colorSpace: THREE.SRGBColorSpace });
}

const grass = new THREE.Mesh(new THREE.PlaneGeometry(40, 40 - END).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8cc07a }));
grass.name = 'grass';
grass.position.z = END / 2;
const stones = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 20), new THREE.MeshStandardMaterial({ color: 0xeee2cc }), 4 - END);
stones.name = 'path';
for (let i = 0; i < stones.count; i++) stones.setMatrixAt(i, new THREE.Matrix4().makeTranslation(pathX(3 - i), 0.06, 3 - i));
const player = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.6, 4, 12), new THREE.MeshStandardMaterial({ color: 0x5b6ee1 }));
player.name = 'player';
scene.add(grass, stones, player);

// One letter of the name every STEP metres, on alternate sides of the path.
const letters = [...NAME].map((ch, i) => {
  const z = -STEP * (i + 1);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: paint(128, 128, g => {
    g.fillStyle = '#ffc93c'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill();
    g.fillStyle = '#7a3b00'; g.font = 'bold 80px system-ui'; g.textAlign = 'center'; g.fillText(ch, 64, 92);
  }) }));
  s.name = 'letter';
  s.position.set(pathX(z) + (i % 2 ? 1.2 : -1.2), 1.2, z);
  scene.add(s);
  return s;
});

// A photo between letters, turned towards the path; no photos yet gives three empty frames.
const loader = new THREE.TextureLoader();
(PHOTOS.length ? PHOTOS : [null, null, null]).forEach((src, i) => {
  const z = -STEP * (i + 1.5), side = i % 2 ? 1 : -1;
  const map = src ? Object.assign(loader.load(src), { colorSpace: THREE.SRGBColorSpace }) : paint(256, 192, g => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 192);
    g.fillStyle = '#999'; g.font = '24px system-ui'; g.textAlign = 'center'; g.fillText('your photo here', 128, 104);
  });
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), new THREE.MeshBasicMaterial({ map, toneMapped: false }));
  photo.name = 'photo';
  photo.position.set(pathX(z) + side * 3.4, 1.6, z);
  photo.rotation.y = -side * 0.6;
  scene.add(photo);
});

// The cake, one candle per letter; the candles light when every letter is found.
const cake = new THREE.Group();
cake.name = 'cake';
cake.add(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.7, 32), new THREE.MeshStandardMaterial({ color: 0xf28fb0 })).translateY(0.35));
cake.add(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.6, 32), new THREE.MeshStandardMaterial({ color: 0xfff0f5 })).translateY(1));
const flames = got.map((_, i) => {
  const a = (i / NAME.length) * Math.PI * 2;
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4), new THREE.MeshStandardMaterial({ color: 0x6fb7ff }));
  candle.position.set(Math.cos(a) * 0.5, 1.5, Math.sin(a) * 0.5);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffb300 }));
  flame.name = 'flame';
  flame.position.y = 0.28;
  candle.add(flame);
  cake.add(candle);
  return flame;
});
cake.position.set(pathX(END), 0, END);
scene.add(cake);

const hud = document.getElementById('hud'), card = document.getElementById('card');
const atCake = () => pz < END + 2.5;
const done = () => atCake() && got.every(Boolean);

function step(dt) {
  const d = 4 * dt;   // walking speed, metres per second
  if (held.has('ArrowUp')) pz -= d;
  if (held.has('ArrowDown')) pz += d;
  if (held.has('ArrowLeft')) off -= d;
  if (held.has('ArrowRight')) off += d;
  pz = Math.max(END + 1.8, Math.min(3, pz));
  off = Math.max(-1.5, Math.min(1.5, off));
  player.position.set(pathX(pz) + off, 0.65, pz);
  letters.forEach((s, i) => {
    if (s.position.distanceTo(player.position) < 1.1) got[i] = true;
    s.visible = !got[i];
  });
  flames.forEach(f => f.visible = done());
  hud.textContent = [...NAME].map((ch, i) => got[i] ? ch : '_').join(' ');
  card.style.display = atCake() ? 'block' : 'none';
  card.textContent = done() ? MESSAGE : 'Find every letter of your name first.';
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  camera.position.set(player.position.x * 0.6, 3.2, pz + 6);
  camera.lookAt(player.position.x, 1, pz - 4);
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'birthday walk', units: 'metres', keys: { ArrowUp: 'walk on', ArrowDown: 'walk back', ArrowLeft: 'step left', ArrowRight: 'step right' } }),
  observe: () => ({ z: +pz.toFixed(2), side: +off.toFixed(2), found: [...NAME].map((ch, i) => got[i] ? ch : '_').join(''), atCake: atCake(), done: done() }),
  act,
  setState: s => {
    pz = s.z ?? pz; off = s.side ?? off;
    if (s.found) got = [...s.found].map(ch => ch !== '_');
  },
  subject: 'player',
};
</script>
</body></html>
```

The game is all one file, called `index.html`, and runs in any web browser. Some words in it you will see again: the `<script type="importmap">` line tells the browser where to find three.js, `window.__game` at the bottom is a small description of the game that testing tools read, and the line `renderer.setAnimationLoop` starts the game loop, the function that runs about sixty times a second to move things and draw a new picture.

## Make it theirs

The three settings at the top of the script are all you need to change:

- **`NAME`**: their name, in capital letters. Each letter becomes one thing to collect and one candle on the cake, so a long name makes a longer walk.
- **`MESSAGE`**: what the card at the end says. Write it the way you would write a card.
- **`PHOTOS`**: your pictures. Make a folder called `photos` next to `index.html`, copy the pictures into it, and list their names, as in `['photos/beach.jpg', 'photos/picnic.jpg']`. Each one stands beside the path between two letters; with none listed, the game shows three empty frames.

Two things trip people up with photos. The name in the list must match the file exactly, including the ending (`.jpg`, `.jpeg` or `.png`) and capital letters, because most web hosts treat `Beach.JPG` and `beach.jpg` as two different files. And a photo straight from a phone is large: make a smaller copy first (your phone's or computer's photo app can export one at a smaller size), so the game loads quickly on their side.

To play it on your own computer, the folder has to be served by a local web server (a small program that shows a folder as a website on your computer), because browsers block a page opened by double-clicking from loading its scripts and photos. [How to put your game online](/guides/put-your-game-online) shows the one command that does it.

## What to ask your AI agent

If you start from this page's game, paste it into a file called `index.html` in a new folder and ask the agent to change it. If you would like your own idea instead, describe it the same way: what the player does, what is personal in it and how it ends.

```text
This folder has a small three.js birthday game in index.html.
Make it a present for my girlfriend Maya: NAME is MAYA, and the message at the end says
"Happy birthday, Maya! Every day with you is my favourite day."
I put four photos in the photos folder: lake.jpg, concert.jpg, cat.jpg and paris.jpg.
Put them along the path in that order.
Then play it from the start to the cake and tell me if every photo shows and the candles light.
```

The last sentence matters. An agent that writes the code without running it has not seen the game; asking it to play to the end catches the photo that does not load or the letter that cannot be reached. [How to vibe code a game](/guides/how-to-vibe-code-a-game) explains this habit of asking for a change, then a check.

## Check it before you send it

Play it once yourself, all the way to the cake, the way they will: in a fresh browser window, on the device you think they will use. This game is played with the arrow keys, so on a phone it needs buttons on the screen as well; ask the agent for them ([three.js virtual joystick and mobile touch controls](/guides/threejs-virtual-joystick-mobile-touch-controls) shows how). Three things to look for:

1. Every photo shows, and none of them is black or missing.
2. Every letter can be reached, and the candles light at the end.
3. The message reads right, with no typo in their name.

A gift is played once, so a bug they find is a bug they remember. If something is wrong, tell the agent exactly what you saw ("the second photo is black", "I cannot reach the E") and ask it to play to the end again after the fix.

## Let the agent play it to the end

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens a game in a hidden Chrome browser so the agent can see and play it as it builds. Here it is on this game, with two photos listed and one of them named `beach.jpg` in the code while the file on disk is `beach.png`. `open` loads the game and lists every file that failed:

```text
open {"url": "index.html", "cwd": "<project>"}

Opened http://127.0.0.1:43551/index.html in 0.2 s, paused at frame 0.
GPU: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). A software renderer (no GPU): frame times here say nothing of a real GPU's.
Page text outside the canvas: none
{"name":"birthday walk","units":"metres","keys":{"ArrowUp":"walk on","ArrowDown":"walk back","ArrowLeft":"step left","ArrowRight":"step right"}}
Errors so far:
Failed to load resource: the server responded with a status of 404 (Not Found) photos/beach.jpg
```

404 is the web's code for "no such file". With the name fixed, `look` takes a screenshot and lists what is on screen by name, so both photos can be counted without anyone describing the picture:

```text
look {}

HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "_ _ _ _" [0, 16, 1279, 49].
On screen (35):
grass 58% [0, 275, 1279, 799] 70 × 40 units
player 1.1% [611, 468, 695, 617]
photo ×2 1.3% [256, 255, 653, 351] 2.4 × 1.8 units
path* ×27 2.4% [460, 306, 769, 718]
letter ×3 0.53% [391, 277, 552, 370] approximate (a sprite or its own shader: see the picture)
cake 0.011% [654, 282, 660, 298]
Never visible: none
Hidden by the game (visible false on it or a parent): flame
```

The flames are hidden at the start, as they should be. Then `interact` presses the arrow keys frame by frame, the way a player would, and `expect` checks the ending: every letter found and the candles lit.

```text
interact {"steps": [{"key": "ArrowUp", "down": true}, {"key": "ArrowLeft", "frames": 18}, {"wait": 132}, {"key": "ArrowRight", "frames": 36}, {"wait": 54}, {"key": "ArrowLeft", "frames": 36}, {"wait": 54}, {"key": "ArrowRight", "frames": 36}, {"wait": 120}, {"key": "ArrowUp", "down": false}], "expect": {"found": "ALEX", "done": true}}

{"changed":{"z":-28.2,"side":1.2,"found":"ALEX","atCake":true,"done":true}}
Motion (player): travelled 34.9 units (30.2 from start to end), its direction of travel turned 73° right; it stopped at frame 453 and did not move again.
Expect: found "ALEX" ✓ · done true ✓
```

The first `look` on this game also found a fault nobody had asked about. The stepping stones were wider then and overlapped:

```text
Surfaces: "path" has two faces in one plane (y = 0.10) over 33 × 5.3 units: they flicker as the camera moves (z-fighting). Move one at least 0.00056 units off the plane (what the depth buffer can tell apart at 22 units from this camera), give the top one material.polygonOffset = true with polygonOffsetFactor -1, or remove the hidden face.
```

Overlapping flat surfaces flicker as the camera moves ([three.js z-fighting flicker](/guides/threejs-z-fighting-flicker) explains it). The smaller, spaced stones in the game above are the fix.

A short clip sent before the link builds a little suspense. `interact` with `record` plays in real time and saves a GIF; this one walks to the first letter and stops well before the cake, so the message stays a surprise:

```text
interact {"steps": [{"state": {"z": 2, "side": 0, "found": "____"}}, {"key": "ArrowUp", "down": true}, {"key": "ArrowLeft", "down": true}, {"wait": 180}, {"key": "ArrowLeft", "down": false}, {"key": "ArrowUp", "down": false}], "record": true, "expect": {"found": "A___"}}

{"changed":{"z":-12.03,"side":-1.5,"found":"A___","atCake":false,"done":false}}
Motion (player): travelled 15.5 units (15 from start to end), its direction of travel turned 16° right.
Expect: found "A___" ✓
Recorded 3.79 s in real time: <project>/paprika3d/runs/2026-10-31T07-22-06-208Z/clip-1.gif (GIF, 233 KB, 480 × 300, 45 frames from 46 screencast frames, each shown for its real time); four moments of it: <project>/paprika3d/runs/2026-10-31T07-22-06-208Z/clip-1.png.
The clock is paused again where the play ended.
```

These replies were captured on 2026-10-31 on a machine with no graphics card, where Chrome draws in software; the lines about the plugin's helper files and the recording's frame times are left out. paprika3d checks that the game works. Whether it is the right gift is yours to judge. To add it to Claude Code (it needs Google Chrome and Node.js):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Sending it

A link is easier for them than a file: they tap it and play. [How to put your game online](/guides/put-your-game-online) walks through itch.io, GitHub Pages and Netlify Drop, each free, and how to make the folder complete first. If you ask for it, paprika3d's `publish` puts the game at an address of its own on paprika3d.app; it is a preview, open by invitation for now ([the publish page](/publish) says how to get a code).

Before you upload, think about who else could open the link. Anyone who has it sees the photos and the message, so pick photos you are both happy to have online, and on itch.io use the page's visibility setting to keep it to the people you choose.

Sending it as a file works too: zip the folder and tell them to open it with a local server, which is a lot to ask of someone on their birthday. A link is kinder.

## What to do next

- Give it sound, a chime for each letter and a tune at the cake: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Make collecting a letter feel good, with a pop and a sparkle: [how to make a game feel good](/guides/make-a-game-feel-good).
- Write a clearer first request for your own idea: [the AI prompt to make a game](/guides/ai-prompt-to-make-a-game).
- Something does not work and you cannot tell why: [html game not working](/guides/html-game-not-working).
