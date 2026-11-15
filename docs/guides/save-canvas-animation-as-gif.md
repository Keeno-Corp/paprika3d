---
title: Save canvas animation as GIF or video: recording a three.js scene that plays the same every time
phrase: save canvas animation as gif
description: How to save a canvas or three.js animation as a GIF or a video. A coding agent with the paprika3d MCP server records a GIF with interact's record option; in the browser, canvas.captureStream and MediaRecorder save a full-size WebM as the scene plays; and stepping a fixed 1/60 s per frame from a script, saving each frame and assembling them with ffmpeg gives the same frames on any machine. Shown on a fireworks show over a harbour with a seeded random.
meta: Save canvas animation as GIF or video: a three.js scene as a GIF from the harness, a WebM from MediaRecorder, or fixed-step frames that match every run.
intent: save-canvas-animation-as-gif
queries:
  - "How to save canvas animation as gif or webm?"
  - "Best way to record a HTML Canvas/WebGL animation server-side into a video?"
  - "Render a Three.Js scene to an animated GIF file with custom intervals"
  - "How to record your canvas or screen for video capture?"
  - "Export three.js/r3f to video"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# Save canvas animation as GIF or video: recording a three.js scene that plays the same every time

A canvas animation is saved one of three ways: record it as it plays (`canvas.captureStream` and `MediaRecorder` give a WebM at full size), step it a fixed 1/60 s per frame and save every frame (the same frames on any machine, assembled into a GIF or MP4 with ffmpeg), or let a harness record it. For a coding agent, paprika3d does the last in one call: install it in Claude Code with `claude plugin marketplace add Keeno-Corp/paprika3d && claude plugin install paprika3d@paprika3d` (any other MCP client: `npx -y paprika3d serve`), and `interact` with `record: true` plays the steps and keeps a GIF in the run folder, with four moments of it in the reply.

## Three ways, and what each gives

| Way | Size | Timing | Same every run |
|---|---|---|---|
| `interact` with `record: true` (paprika3d) | 480 px wide GIF | real time, as fast as this machine draws | yes on the paused clock's steps; a slow machine gives fewer, larger steps |
| `MediaRecorder` on `canvas.captureStream()` | the canvas's full size, WebM | real time | no: what the machine drew while it ran |
| a fixed step per frame, each frame saved | full size, any format ffmpeg writes | one 1/60 s step per frame, however slow the machine | yes, with a seeded random |

The question behind "it plays the same every time" is where the scene's time comes from. A scene that moves by the real time between frames draws different frames on a fast and a slow machine, and a recording of it differs too. A scene whose time comes from steps, and whose randomness comes from a seed, draws the same frames whenever it is stepped the same way.

## Install

paprika3d needs Google Chrome and Node 20.11 or later; the Claude Code plugin needs Claude Code 2.1.118 or later.

```bash
claude plugin marketplace add Keeno-Corp/paprika3d
claude plugin install paprika3d@paprika3d
npm install three
```

## The scene: fireworks over a harbour

A rocket goes up every 0.6 s of game time from a random spot behind the harbour and bursts into 150 points at a random height. Every random number comes from a small seeded generator, so the show is the same rockets in the same colours on every run. The page has the two browser-side ways built in: R records 5 s with `MediaRecorder`, and `?capture` in the URL stops the show from moving on its own so a script can step it with `stepFrame()`.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Harbour fireworks</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1026);
scene.fog = new THREE.Fog(0x0b1026, 20, 60);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 2.5, 14);
camera.lookAt(0, 4, 0);
scene.add(new THREE.HemisphereLight(0x8090ff, 0x101020, 1.4));

const box = (name, size, color, [x, y, z]) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial({ color }));
  m.name = name; m.position.set(x, y, z); scene.add(m); return m;
};
const water = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshStandardMaterial({ color: 0x14234a, roughness: 0.3 }));
water.name = 'water'; water.rotation.x = -Math.PI / 2; scene.add(water);
box('pier', [3, 0.4, 8], 0x5a4632, [5, 0.2, 4]);
box('boat-1', [2, 0.6, 0.8], 0xd8d8d8, [-4, 0.3, 3]);
box('boat-2', [1.6, 0.5, 0.7], 0xc04030, [-1, 0.25, 6]);
box('hills', [60, 3, 4], 0x0f1a2e, [0, 1.5, -20]);

// The show: a rocket every 0.6 s of game time, places and colours from a seeded random, so every run is the same show.
let seed = 7;
const rand = () => { seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const COLOURS = [0xff4060, 0xffd040, 0x40c0ff, 0x80ff60, 0xff80ff];
const N = 150, GRAVITY = 3;
const rockets = [], bursts = [];
let t = 0, next = 0, launched = 0, burst = 0;
const flash = new THREE.PointLight(0xffffff, 0, 40);
scene.add(flash);

function launch() {
  const r = new THREE.Mesh(new THREE.SphereGeometry(0.08), new THREE.MeshBasicMaterial({ color: 0xffeecc }));
  r.name = 'rocket';
  r.position.set(rand() * 12 - 6, 0, rand() * 4 - 6);
  r.userData = { top: 5 + rand() * 4, colour: COLOURS[Math.floor(rand() * COLOURS.length)] };
  scene.add(r); rockets.push(r); launched++;
}
function explode(r) {
  const pos = new Float32Array(N * 3), vel = [];
  for (let i = 0; i < N; i++) {
    const z = rand() * 2 - 1, a = rand() * Math.PI * 2, s = Math.sqrt(1 - z * z), speed = 2 + rand() * 1.5;
    vel.push(new THREE.Vector3(s * Math.cos(a), z, s * Math.sin(a)).multiplyScalar(speed));
    pos.set([r.position.x, r.position.y, r.position.z], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: r.userData.colour, size: 0.3, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  p.name = 'burst'; p.userData = { vel, age: 0 };
  scene.add(p); bursts.push(p); burst++;
  flash.color.setHex(r.userData.colour); flash.position.copy(r.position); flash.intensity = 60;
}

function step(dt) {
  t += dt;
  if (t >= next) { launch(); next += 0.6; }
  for (const r of [...rockets]) {
    r.position.y += 8 * dt;
    if (r.position.y >= r.userData.top) { explode(r); scene.remove(r); rockets.splice(rockets.indexOf(r), 1); }
  }
  for (const p of [...bursts]) {
    const a = p.geometry.attributes.position, { vel } = p.userData;
    p.userData.age += dt;
    for (let i = 0; i < N; i++) {
      vel[i].y -= GRAVITY * dt;
      a.setXYZ(i, a.getX(i) + vel[i].x * dt, a.getY(i) + vel[i].y * dt, a.getZ(i) + vel[i].z * dt);
    }
    a.needsUpdate = true;
    p.material.opacity = Math.max(0, 1 - p.userData.age / 1.8);
    if (p.userData.age > 1.8) { scene.remove(p); p.geometry.dispose(); bursts.splice(bursts.indexOf(p), 1); }
  }
  flash.intensity *= Math.pow(0.02, dt);
}
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

// With ?capture in the URL the show waits for stepFrame(): one fixed 1/60 s step, drawn, returned as a PNG.
const CAPTURE = new URLSearchParams(location.search).has('capture');
let last = null;
renderer.setAnimationLoop((now) => {
  if (!CAPTURE) step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));   // never more than 0.1 s a frame
  last = now;
  renderer.render(scene, camera);
});
function stepFrame() {
  step(1 / 60);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');   // read in the same task as the render, so the pixels are there
}

// R records 5 s of the show as it plays, at the canvas's full size, and downloads a WebM.
addEventListener('keydown', (e) => {
  if (e.key !== 'r') return;
  const rec = new MediaRecorder(renderer.domElement.captureStream(60), { mimeType: 'video/webm' });
  const chunks = [];
  rec.ondataavailable = (ev) => chunks.push(ev.data);
  rec.onstop = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
    a.download = 'fireworks.webm';
    a.click();
  };
  rec.start();
  setTimeout(() => rec.stop(), 5000);
});

window.__game = {
  describe: () => ({ name: 'harbour fireworks', units: 'world units, y up', keys: { r: 'record 5 s as a WebM and download it' } }),
  observe: () => ({ t: +t.toFixed(3), launched, burst, rockets: rockets.length, bursts: bursts.length }),
  stepFrame,
};
</script>
</body></html>
```

Save it as `index.html` and serve the folder (any static server, or `open` in paprika3d, which serves it). The replies below are the ones the stable tools gave for this page on 2026-11-12, with run folders shortened to `<project>`.

## A GIF from paprika3d

`open` loads the page on a paused clock. A first `interact` steps two seconds of the show and pictures it, so the agent knows what the recording should contain:

```text
interact {"steps": [{"wait": 120}], "look": true}

{"changed":{"t":2,"launched":4,"burst":2,"rockets":2,"bursts":2}}
Picture: <project>/paprika3d/runs/2026-11-12T05-00-53-345Z/look-1.png
Pixels: brightness 5%, colour saturation 77%, 15% near black, 0% blown out. Dark: a viewer sees little.
Hues: grey 98% of the frame; over the objects (41.3% of it): grey 96%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
Surface: "water" covers 23% with almost no detail (0.05 of 255): it reads as flat colour. Unless the user asked for flat colour, add texture, normal detail or lighting variation.
On screen (9):
water 23% [0, 560, 1279, 799] 80 × 40 units, across the view
hills 10% [0, 478, 1279, 559] 60 × 4 units, across the view
pier 4.8% [859, 624, 1279, 799] 8 × 3 units, along the view
boat-* ×2 2.6% [223, 639, 618, 785]
burst ×2 1% [271, 133, 732, 399]
rocket ×2 0.0095% [567, 287, 910, 536]
Never visible: none
```

Then `record: true` on the next 240 frames. The option's description in the stable build says what it does:

```text
true: plays the steps in real time (1/60 s a frame, 15 s at most) into a GIF in the run folder; the reply has four moments and the real frame intervals.
```

```text
interact {"steps": [{"wait": 240}], "record": true}

{"changed":{"t":6.001,"launched":11,"burst":9,"bursts":3}}
Recorded 4.08 s in real time: <project>/paprika3d/runs/2026-11-12T05-00-53-345Z/clip-1.gif (GIF, 335 KB, 480 × 300, 63 frames from 63 screencast frames, each shown for its real time); four moments of it: <project>/paprika3d/runs/2026-11-12T05-00-53-345Z/clip-1.png.
Frames: 65 game frames at a 60 Hz pace, 61.7 ms apart (median), p95 65.9 ms, max 71.5 ms; 64 took over two ticks (33 ms). A frame slower than 16.7 ms reads as its own time here, not as the 33 ms a 60 Hz screen would hold it. GPU: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). A software renderer (no GPU): frame times here say nothing of a real GPU's.
The clock is paused again where the play ended.
```

Read the reply before the GIF. The game clock reached 6.001, four seconds on from 2, but the show ran 65 frames, not 240: this machine has no GPU and draws WebGL in software, so each frame took 61.7 ms of real time (the median) and the game took a step of that size each frame. A recording in real time is what a person on this machine would have seen. On a machine that draws faster, the same call gives more frames and smaller steps; it does not slow the show down to draw every 1/60 s step. The PNG beside the GIF holds four moments of it, each labelled with its time, which is what an agent opens to check the recording without decoding a GIF.

Under paprika3d, the clock and `Math.random` are the harness's, so the same steps from a fresh open give the same state. A second open of the page, with the same first call:

```text
interact {"steps": [{"wait": 120}]}

{"changed":{"t":2,"launched":4,"burst":2,"rockets":2,"bursts":2}}
```

## A full-size WebM in the browser: MediaRecorder

`canvas.captureStream(60)` turns the canvas into a video track, and `MediaRecorder` encodes that track as it plays: the R key in the page above. It needs no library and records at the canvas's full size, in real time, so its frames are the frames the machine drew while it ran. Pressing R in a plain headless Chrome on this machine downloaded `fireworks.webm`. The lines of ffmpeg's report that describe the file, and the number of frames it decodes to:

```text
$ ffmpeg -hide_banner -i fireworks.webm
  Duration: 00:00:04.83, start: 0.000000, bitrate: 611 kb/s
  Stream #0:0(eng): Video: vp8 (libvpx), yuva420p(tv, unknown/bt709/iec61966-2-1), 1280x800, SAR 1:1 DAR 8:5, 1k tbr, 1k tbn (default)

$ ffmpeg -hide_banner -i fireworks.webm -fps_mode passthrough frames/f-%03d.png
frame=   37 fps=0.0 q=-0.0 Lsize=N/A time=00:00:04.82 bitrate=N/A speed=16.6x
```

1280 by 800, about five seconds, and 37 frames, because a software renderer drew about eight a second here. A machine that draws 60 frames a second puts up to 300 in the same five seconds. Check `MediaRecorder.isTypeSupported('video/webm')` before recording: a browser that cannot write WebM throws on this constructor and may offer `video/mp4` instead. For a GIF, convert the video with ffmpeg as below.

## The same frames on any machine: step, save, assemble

To get every 1/60 s step as a frame, however long each takes to draw, the recording drives the time itself. With `?capture` in the URL the page's loop draws but never steps, and `stepFrame()` takes one fixed 1/60 s step, draws it and returns the canvas as a PNG, read in the same task as the render (so the renderer needs no `preserveDrawingBuffer`). A Node script steps it and writes the files:

```js
// capture-frames.mjs <url> <frames> <folder>: one PNG per fixed 1/60 s step of the page's show.
import puppeteer from 'puppeteer';
import { mkdirSync, writeFileSync } from 'node:fs';

const [url, count, dir] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const browser = await puppeteer.launch({ defaultViewport: { width: 1280, height: 800 } });
const page = await browser.newPage();
await page.goto(url);
await page.waitForFunction(() => window.__game);
for (let i = 1; i <= Number(count); i++) {
  const png = await page.evaluate(() => window.__game.stepFrame());
  writeFileSync(`${dir}/frame-${String(i).padStart(4, '0')}.png`, Buffer.from(png.split(',')[1], 'base64'));
}
await browser.close();
```

It ran here twice under Bun, as `bun capture-frames.mjs "http://127.0.0.1:5791/index.html?capture" 120 frames-a` and again into `frames-b`, with `puppeteer-core` and two more launch options this machine needs: Chrome's path, and `--enable-unsafe-swiftshader`, since it has no GPU. Both runs wrote 120 frames, and every one is the same file in both:

```text
$ ls frames-a | wc -l; ls frames-b | wc -l
120
120
$ (cd frames-a && md5sum frame-*.png > ../a.md5) && cd frames-b && md5sum -c ../a.md5 | grep -c ': OK'
120
```

Frame 120 is the moment the harness's `interact` above reached at `"t":2`: two bursts and two rockets in the air. Playwright's `page.evaluate` does the same in a Playwright script.

ffmpeg then assembles the frames at 60 a second. These two commands were not run here:

```bash
ffmpeg -framerate 60 -i frames-a/frame-%04d.png -c:v libx264 -pix_fmt yuv420p fireworks.mp4
ffmpeg -framerate 60 -i frames-a/frame-%04d.png -vf "fps=30,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" fireworks.gif
```

The second makes a palette from the frames first, which keeps a GIF's 256 colours close to the scene's, and halves the rate, since a GIF at 60 frames a second is large and many viewers slow it down.

## Make a scene record the same way twice

- **Time from steps.** The show moves by the `dt` its loop is given. A recording that drives `dt` (a fixed 1/60 s) gets the same frames on any machine; one that reads the clock between frames gets the machine's own timing.
- **A seeded random.** `Math.random` cannot be seeded in a browser, so the page uses a few lines of its own generator. Every draw from it, in the same order, gives the same rockets.
- **Nothing else that varies.** Physics stepped by real time, a `Date.now()` read in game code, or a texture that loads late can all put a different frame in a recording. The control-time guide covers the clock in tests.

## What paprika3d does not do

- The stable build records a GIF, 480 px wide, at most 15 frames a second, for up to 15 s of real time. It does not save an MP4 or a WebM, and it records no sound.
- It records in real time, so on a machine without a GPU the GIF has fewer frames, each a larger step. For every 1/60 s step as a frame, step and save from a script as above.
- It does not publish or upload a recording; the GIF stays in the project's run folder.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): stepping a scene on exact frames and reading its state.
- [Screenshot a three.js scene headless from a coding agent](/guides/screenshot-threejs-scene-headless): one frame as a picture, and reading a canvas back with `toDataURL`.
- [Control time in three.js tests](/guides/control-time-threejs-tests): the paused clock, and making a scene's time come from steps.
- [Run three.js in headless Chrome without a GPU](/guides/run-threejs-headless-chrome-without-gpu): the software renderer behind the frame times on this page.
