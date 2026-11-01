---
title: How to put your game online and send friends a link to a three.js game
phrase: how to put your game online
description: How to put your game online for the first time: make the folder complete (index.html at the top, relative paths, three.js copied in with the second file it loads), open that folder before uploading, then itch.io, GitHub Pages or Netlify Drop, shown on a small three.js lane-dodging game, with paprika3d opening the folder you upload and recording a clip to send.
meta: How to put your game online: make the folder complete, test it, then itch.io, GitHub Pages or Netlify, on a small three.js game you can paste.
intent: put-your-game-online
queries:
  - "how to put your game online"
  - "how to upload html game to itch io"
  - "Share the game for friends"
  - "Absolute beginner: how can a friend test my game?"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to put your game online and send friends a link to a three.js game

A browser game is a folder of files: an `index.html` page and everything it loads (scripts, models, pictures, sounds). Putting it online means copying that folder to a host, a computer that hands the files to anyone who visits a link, and several hosts do this for free. The upload itself takes a few minutes. What goes wrong the first time is almost always the folder: a file the game needs was left out, or a path points at something on your own computer. So this page makes the folder complete first, tests it, and then puts it on itch.io, GitHub Pages or Netlify.

## The game

Cone dodge: a car drives down a road, and you press the left and right arrow keys to change lanes and miss the cones. three.js, a JavaScript library that draws 3D in a web page, does the drawing; the whole game is this one file.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Cone dodge</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}#hud{position:fixed;top:16px;left:20px;font:600 22px system-ui;color:#fff;text-shadow:0 1px 3px #0008}</style></head>
<body>
<div id="hud">Distance: 0 m · Crashes: 0</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const LANES = [-2, 0, 2];
const PATTERN = [0, 2, 1, 1, 0, 2, 0, 1];   // the lane of each cone, in turn
const GAP = 8, SPEED = 10;                  // metres between cones, metres per second
let lane = 1, x = 0, distance = 0, crashes = 0;

// A key press moves one lane; holding it does not keep moving.
function act({ key, down = true }) {
  if (!down) return;
  if (key === 'ArrowLeft') lane = Math.max(0, lane - 1);
  if (key === 'ArrowRight') lane = Math.min(2, lane + 1);
}
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.key }); });

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2c28b);
scene.fog = new THREE.Fog(0xf2c28b, 20, 60);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3, 6);
camera.lookAt(0, 0.5, -4);
scene.add(new THREE.HemisphereLight(0xfff4e0, 0x8a6a50, 3));
const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 120).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x4a4a55 }));
road.name = 'road';
road.position.z = -50;
const car = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 1.6), new THREE.MeshStandardMaterial({ color: 0x2b7de9 }));
car.name = 'car';
scene.add(road, car);
const cones = PATTERN.map((l, i) => {
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 16), new THREE.MeshStandardMaterial({ color: 0xff6a1a }));
  cone.name = 'cone';
  cone.position.set(LANES[l], 0.45, -12 - i * GAP);
  scene.add(cone);
  return cone;
});
const hud = document.getElementById('hud');

function step(dt) {
  distance += SPEED * dt;
  x += (LANES[lane] - x) * Math.min(1, 12 * dt);   // slide towards the lane
  for (const cone of cones) {
    cone.position.z += SPEED * dt;
    if (cone.position.z > 6) { cone.position.z -= PATTERN.length * GAP; cone.userData.hit = false; }
    if (!cone.userData.hit && Math.abs(cone.position.z) < 0.9 && Math.abs(cone.position.x - x) < 0.8) {
      cone.userData.hit = true;
      crashes++;
    }
  }
  hud.textContent = `Distance: ${Math.floor(distance)} m · Crashes: ${crashes}`;
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
  car.position.set(x, 0.3, 0);
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'cone dodge', units: 'metres', keys: { ArrowLeft: 'one lane left', ArrowRight: 'one lane right' } }),
  observe: () => ({ lane, x: +x.toFixed(2), distance: Math.floor(distance), crashes }),
  act,
  setState: (s) => { lane = s.lane ?? lane; x = LANES[lane]; },
  subject: car,
};
</script>
</body></html>
```

The import map near the top (`<script type="importmap">`) tells the browser where to find three.js. Here it points into `node_modules`, the folder `npm install three` makes on your computer. That folder is not something you upload, so the next step changes that one line.

## Step 1: make the folder complete

Make a new folder, here `my-game`, holding exactly what a player needs:

- **`index.html` at the top of the folder.** Hosts open the file with that name when someone visits the link.
- **Every file the game loads, inside the folder, with paths relative to `index.html`.** `./models/car.glb` works everywhere; `C:\Users\...` or `/Users/...` works on your computer and nowhere else.
- **three.js itself.** Copy it from `node_modules/three/build/` into the folder and point the import map at the copy. In current versions of three.js that is two files, `three.module.js` and `three.core.js`, because the first one loads the second:

```html
<script type="importmap">{"imports":{"three":"./three.module.js"}}</script>
```

The other way is to load three.js from a CDN, a public server that hosts libraries; [deploy a three.js site without a 404](/guides/deploy-threejs-site-404) shows that line. If your game was made with a build tool such as Vite, its build command (`npm run build`) makes this complete folder for you, called `dist`: upload `dist`, not the project.

## Step 2: open the folder you will upload

Test the folder before it leaves your computer, and test the folder itself, not your project. Double-clicking `index.html` does not work for this: most browsers refuse to run a page's module scripts from a file on disk, so the screen stays blank. Serve the folder with a local web server instead, a small program that shows a folder as a website on your own computer. In a terminal (the window where you type commands), inside the folder that holds `my-game`:

```bash
npx serve my-game
```

Open the address it prints, play the game, and press F12 to open the browser console (the panel of messages the page writes). A red line with 404 in it names a file the folder is missing.

## Step 3: pick a host

**itch.io**, the site where many small and first games live, gives the game its own page with a description and screenshots, and players can find it there.

1. Zip the folder's contents so that `index.html` is at the top of the zip, not inside a folder in it. Select the files inside `my-game` (not the folder), then right-click: on Windows, Send to and Compressed (zipped) folder; on a Mac, Compress.
2. On itch.io, sign in, choose Upload new project, and set Kind of project to HTML.
3. Upload the zip and tick "This file will be played in the browser".
4. Set the size of the game's frame, save, and choose who can see the page in its visibility setting.

**GitHub Pages** serves a GitHub repository as a website. Make a repository, use Add file and Upload files to add the folder's contents, then in Settings, Pages, choose to deploy from the main branch. The game appears at `https://<your-name>.github.io/<repository>/`. That address ends in a folder name, so a path that starts with `/` breaks there while a relative one works; the deploy guide linked above covers the other causes of a 404 after an upload.

**Netlify Drop** takes a folder dragged onto its page (app.netlify.com/drop) and answers with a link. Make a free account to keep the site and give it a name.

Whichever you choose, open the link on another device, such as a phone, before sending it around. A phone has no arrow keys: a game for phones needs touch controls, and [three.js virtual joystick and mobile touch controls](/guides/threejs-virtual-joystick-mobile-touch-controls) adds them.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that works on the files in your project) can do steps 1 and 2. Uploading to a host needs your account, so step 3 is yours, or the agent's with your login if you choose to give it one.

```text
Get my game ready to put online. Make a folder called my-game with index.html at its top
and every file the game loads, using paths relative to index.html.
Copy three.js into it (three.module.js and three.core.js from node_modules/three/build)
and point the import map at ./three.module.js.
Then serve that folder, not the project, play the game, and tell me about any file that fails to load.
Last, zip the folder's contents for itch.io with index.html at the top of the zip.
```

## Let the agent open the folder and make a clip

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs a game in a hidden Chrome browser so the agent can see and play it. Its `open` tool serves any folder you name and lists every file that failed to load. Here it is on `my-game` with `three.module.js` copied and `three.core.js` forgotten:

```text
open {"url": "index.html", "cwd": "<project>/my-game"}

game not ready after 10 s: no window.__game, three.js renderer or WebGL canvas on http://127.0.0.1:39191/index.html
The page shows: "Distance: 0 m · Crashes: 0"
Failed to load resource: the server responded with a status of 404 (Not Found) three.core.js
```

The game never started, and the reply names the missing file. With `three.core.js` copied in as well:

```text
open {"url": "index.html", "cwd": "<project>/my-game"}

Opened http://127.0.0.1:40939/index.html in 0.1 s, paused at frame 0.
GPU: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). A software renderer (no GPU): frame times here say nothing of a real GPU's.
Page text outside the canvas: 0 h1, 0 h2, 6 words
{"name":"cone dodge","units":"metres","keys":{"ArrowLeft":"one lane left","ArrowRight":"one lane right"}}
```

A short clip is a good thing to send ahead of the link. `interact` with `record` plays the game in real time and saves a GIF in the run folder; here it changes lane around two cones:

```text
interact {"steps": [{"wait": 140}, {"key": "ArrowLeft"}, {"wait": 95}, {"key": "ArrowRight"}, {"wait": 64}], "record": true, "expect": {"crashes": 0}}

{"changed":{"distance":52}}
Motion (car): travelled 4 units (4.34e-8 from start to end), its direction of travel turned 180° right.
Expect: crashes 0 ✓
Recorded 5.27 s in real time: <project>/my-game/paprika3d/runs/2026-10-30T19-54-57-501Z/clip-1.gif (GIF, 113 KB, 480 × 300, 82 frames from 82 screencast frames, each shown for its real time); four moments of it: <project>/my-game/paprika3d/runs/2026-10-30T19-54-57-501Z/clip-1.png.
The clock is paused again where the play ended.
```

(The reply's Frames line, about how fast this machine drew each frame in software, is left out here.) These replies were captured on 2026-10-30 on a machine with no graphics card, where Chrome draws in software.

When you ask for a public link, `publish` puts the project at an address of its own on paprika3d.app, such as cone-dodge.paprika3d.app. It is a preview, open by invitation for now; [the publish page](/publish) says how to get a code and what a publish uploads. paprika3d does not upload to itch.io, GitHub or Netlify; that stays with you or your agent. To add it to Claude Code (it needs Google Chrome and Node.js):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Without paprika3d

Serve the folder with `npx serve my-game`, play it once from start to finish with the console open, and fix every red line before you upload. For a clip, record your screen while you play: Windows has the Xbox Game Bar (Windows key + Alt + R) and a Mac has the screenshot toolbar (Shift + Command + 5).

## If the link shows a blank page

- A file missing or a wrong path on the host: [deploy a three.js site without a 404](/guides/deploy-threejs-site-404).
- Blank on your own computer too: [html game not working](/guides/html-game-not-working).

## Next steps

- Make it feel better to play: [how to make a game feel good](/guides/make-a-game-feel-good).
- Make it look better: [how to make my game look better](/guides/make-my-game-look-better).
- Give it sound: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Give your friends more to play: [how to make levels in a game](/guides/make-levels-in-a-game).
