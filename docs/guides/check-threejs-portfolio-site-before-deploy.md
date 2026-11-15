---
title: Check a three.js portfolio site on phones, tablets and desktops before you deploy it
phrase: three.js portfolio site
description: What to check on a three.js portfolio site before it goes live and the tools that check it, with a worked example in paprika3d: the 3D piece at phone, tablet, laptop and desktop sizes with look viewports, the phone turned sideways with interact resize, the HTML over the canvas, failed loads, and the first scene frame and script size against a website budget with perf.
meta: "Check a three.js portfolio site before you deploy: phone to desktop pictures, a turned phone, failed loads and a website budget, headless."
intent: check-threejs-portfolio-site
queries:
  - "check three.js portfolio site before deploy"
  - "test three.js portfolio on mobile"
  - "three.js portfolio site responsive"
  - "three.js portfolio not showing on mobile"
  - "What tools can check my three.js portfolio site on phones and desktops before I deploy it?"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# Check a three.js portfolio site on phones, tablets and desktops before you deploy it

A three.js portfolio site is usually built on one laptop screen and first seen by a recruiter on a phone. Before it goes live, check five things at every screen size: that the 3D piece is on screen and not under the text, that the canvas is drawn at the screen's pixel ratio, that turning the phone keeps both in place, that nothing fails to load, and that the first frame of the scene arrives quickly on a phone's connection with a script the size of a website's, not a demo's.

Several tools cover parts of this. Chrome DevTools' device toolbar and Firefox's responsive design mode show one emulated size at a time to a person. Lighthouse and PageSpeed Insights score the page's load. A cloud device lab such as BrowserStack runs it on real phones. paprika3d, an MCP server and Claude Code plugin (`npx -y paprika3d serve` in any MCP client), is made for the coding agent that built the page: it opens the page in headless Chrome, and one call returns a picture per screen size with what each one shows of the 3D scene, so the agent can fix the layout and check again before you see it. This page runs that pass on a small portfolio hero and shows the reply that found its fault.

## Install

paprika3d needs Google Chrome and Node 20.11 or later, and the Claude Code plugin needs Claude Code 2.1.118 or later.

```bash
claude plugin marketplace add Keeno-Corp/paprika3d
claude plugin install paprika3d@paprika3d
npm install three
```

Cursor, Codex, Gemini CLI and other MCP clients run the server with `npx -y paprika3d serve`. Then ask your agent in your own words, for example "check my portfolio on a phone, a tablet and a desktop before I deploy it, and fix what is off", or call the tools as below.

## The page

A designer's portfolio: a hero that fills the first screen, with the name and a line of text on the left and a small sculpture on the right, and three project cards below. The canvas fills the hero, not the window, so a `ResizeObserver` on the hero sizes it. `window.__game.subject` names the sculpture so each `look` reports its share of the picture. This is the version after the fix described below:

```html
<!-- verify -->
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mara Okafor, product designer</title>
<style>
  html, body { margin: 0; background: #f3efe8; color: #1d1d1f; font: 17px/1.5 system-ui, sans-serif; }
  #hero { position: relative; height: 100svh; overflow: hidden; }
  #hero canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  #intro { position: absolute; left: 6vw; top: 50%; transform: translateY(-50%); max-width: 26rem; }
  #intro h1 { font-size: clamp(2rem, 5vw, 3.6rem); line-height: 1.05; margin: 0 0 0.6rem; }
  @media (max-aspect-ratio: 1/1) { #intro { top: 8svh; transform: none; right: 6vw; } }
  section.work { padding: 4rem 6vw; display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); }
  .card { background: #fff; border-radius: 12px; padding: 1.2rem; }
</style></head>
<body>
<div id="hero">
  <div id="intro"><h1>Mara Okafor</h1><p>Product designer. Tools for kitchens, clinics and small shops.</p></div>
</div>
<section class="work">
  <div class="card"><h2>Pantry</h2><p>Stock counts for a bakery chain, in three taps.</p></div>
  <div class="card"><h2>Ward board</h2><p>A shift handover screen for a children's ward.</p></div>
  <div class="card"><h2>Till</h2><p>A checkout for market stalls that works offline.</p></div>
</section>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const hero = document.getElementById('hero');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
hero.prepend(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
scene.add(new THREE.HemisphereLight('#fff8ee', '#8a7f74', 2));
const sun = new THREE.DirectionalLight('#ffffff', 2.2);
sun.position.set(3, 4, 5);
scene.add(sun);

// The hero piece: a small stack of shapes, about 2 units tall.
const sculpture = new THREE.Group();
sculpture.name = 'sculpture';
const clay = new THREE.MeshStandardMaterial({ color: '#c8643b', roughness: 0.55 });
const stone = new THREE.MeshStandardMaterial({ color: '#2f3b45', roughness: 0.8 });
const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.3, 48), stone);
base.position.y = -0.85;
const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.18, 32, 96), clay);
ring.position.y = 0.05;
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 48, 24), stone);
ball.position.y = 0.85;
sculpture.add(base, ring, ball);
scene.add(sculpture);

function layout() {
  const w = hero.clientWidth, h = hero.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const portrait = camera.aspect < 1;
  // Landscape: the piece sits right of the text. Portrait: centred, below the text.
  sculpture.position.set(portrait ? 0 : 1.5, portrait ? -0.6 : 0, 0);
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const fitH = portrait ? 4.2 : 2.6, fitW = portrait ? 2.2 : 5.4;
  camera.position.set(0, 0, Math.max(fitH / 2 / tanHalf, fitW / 2 / (tanHalf * camera.aspect)));
  camera.updateProjectionMatrix();
}
new ResizeObserver(layout).observe(hero);
layout();

renderer.setAnimationLoop(t => {
  ring.rotation.y = t / 1600;
  ring.rotation.x = 0.4;
  renderer.render(scene, camera);
});

window.__game = {
  subject: 'sculpture',
  describe: () => ({ name: 'portfolio hero', units: 'meters' }),
  observe: () => ({ portrait: camera.aspect < 1, at: sculpture.position.toArray(), buffer: [renderer.domElement.width, renderer.domElement.height] }),
};
</script>
</body></html>
```

## Check 1: phone, tablet, laptop and desktop

The first version placed the sculpture right of the text at every size and framed the camera on the scene's height. `look` with `viewports` reloads the page once per screen and lays the pictures out in one grid:

```text
open {"url": "index.html", "cwd": "<project>"}

look {"viewports": ["phone", "tablet", "laptop", "desktop"]}

phone 390x844@3: subject sculpture 0%, 0 on screen; not on screen here: sculpture. Canvas: 780x1688 buffer for 390x844 CSS at DPR 3 (renderer pixel ratio 2, capped below DPR 3); resize handler ran.
tablet 820x1180@2: subject sculpture 3.3%, 2 on screen. Canvas: 1640x2360 buffer for 820x1180 CSS at DPR 2 (renderer pixel ratio 2); resize handler ran.
laptop 1440x900@2: subject sculpture 20%, 3 on screen. Canvas: 2880x1800 buffer for 1440x900 CSS at DPR 2 (renderer pixel ratio 2); resize handler ran.
desktop 1920x1080@1: subject sculpture 20%, 3 on screen. Canvas: 1920x1080 buffer for 1920x1080 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
```

On a laptop it looked finished. On a phone the sculpture was off the right edge of the screen, and on a tablet two of its three parts showed. A portrait screen is narrow, so a camera framed on height alone shows a slice of the scene too thin to reach an object placed for a wide one. The fix gives a portrait screen its own layout: the sculpture centred and lower, the camera pulled back until a width of scene fits, and a CSS media query that moves the text to the top. The same call on the fixed page:

```text
phone 390x844@3: subject sculpture 21%, 3 on screen. Canvas: 780x1688 buffer for 390x844 CSS at DPR 3 (renderer pixel ratio 2, capped below DPR 3); resize handler ran.
tablet 820x1180@2: subject sculpture 19%, 3 on screen. Canvas: 1640x2360 buffer for 820x1180 CSS at DPR 2 (renderer pixel ratio 2); resize handler ran.
laptop 1440x900@2: subject sculpture 13%, 3 on screen. Canvas: 2880x1800 buffer for 1440x900 CSS at DPR 2 (renderer pixel ratio 2); resize handler ran.
desktop 1920x1080@1: subject sculpture 14%, 3 on screen. Canvas: 1920x1080 buffer for 1920x1080 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
```

The `Canvas:` part of each line is the second check of the list, the pixel ratio: a buffer equal to the CSS size times the ratio is a sharp canvas. A buffer equal to the CSS size on a phone is the usual reason a portfolio piece looks soft there, covered in [three.js canvas blurry on phone](/guides/threejs-canvas-blurry-on-phone).

## Check 2: the phone turned sideways

The viewports grid loads each size fresh. A visitor who turns the phone changes the size of a page that is already running, which goes through the resize code instead. `interact` with a `resize` step does that on the open page and looks at the result:

```text
open {"url": "index.html", "cwd": "<project>", "size": [390, 844], "dpr": 3}

interact {"steps": [{"resize": [844, 390]}], "look": true}

{"changed":{"portrait":false,"at":[1.5,0,0],"buffer":[1688,780]}}
Canvas: 1688x780 buffer for 844x390 CSS at DPR 3 (renderer pixel ratio 2, capped below DPR 3); resize handler ran.
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#intro "Mara Okafor Product designer. Tools for " [51, 130, 492, 259].
Subject: sculpture takes 17% of the picture [526, 18, 785, 380]; 0 of its 0 named parts show.
```

The page switched to its landscape layout, the buffer followed the new size, and the `HTML over the canvas:` line says the name and intro sit over the canvas with no overlap with the sculpture and nothing cut off. That line is the first check's other half: on a portfolio the heading over the hero is the usual thing that hides the 3D piece on one screen size and not another.

## Check 3: loads and the console

`open` lists what the page loaded and what failed, and `observe` and `eval` replies list new console errors. On a portfolio that loads a model, a texture or a font, read the `Loaded:` and `Failed to load:` lines on the first open: a path that works on your machine and not on the host (a capital letter in a file name, a file outside the folder you deploy) shows there as a failed load. Opening the built folder rather than the source catches the paths a bundler changed.

## Check 4: a website's budget

`perf` with the `site` budget measures what a first visit costs: the time from navigation to the first frame of the scene on a phone's connection with no cache, the script and asset sizes, and the frame time. On the source page, run without a GPU:

```text
perf {"budget": "site"}

35.1 ms median frame (p95 51.3 ms, 28 fps on average), 3 draw calls, 8544 triangles, 0 MB assets; over budget: frameMs 35.1 of 16.7 ms, scriptMB 2.02 of 1 MB; site budget; software renderer (no GPU): frame time is no budget signal, do not optimize for it
Largest scripts: three.core.js 1.39 MB, three.module.js 0.63 MB. Fix: serve a production build (vite build minifies three.js and drops what the page does not import), compressed.
First scene frame: 2.7 s after navigation on fast-4g (8.1 Mbps down, 1.35 Mbps up, 165 ms latency), a first visit with no cache on a software renderer (no GPU: its shader compiles and first frame take far longer than a GPU's) (scripts 2.02 MB by 2.6 s).
```

The frame time there is a software renderer's and the reply says to ignore it. The script size is real: the page loads three.js unminified straight from `node_modules`, and the reply's fix is a production build. Build the site, open the built folder and run `perf` again before you deploy; the [page speed guide](/guides/threejs-page-speed-lighthouse) goes through the build, compressing models and pausing the scene once it scrolls out of view.

## Before you deploy

1. `look` with `viewports` at the four presets, and at your own sizes as `[width, height, dpr]` if your visitors use others; every line says the subject is on screen and the buffer is CSS size times the ratio.
2. `interact` with a `resize` step from portrait to landscape on a phone size.
3. `open` the built folder: no `Failed to load:` line, and `observe` lists no console error.
4. `perf` with the `site` budget on the built folder.
5. If the page moves its 3D piece with scroll, `look` with `scroll` at a few stops; the [3D website guide](/guides/claude-code-3d-website) shows that check.

## What this pass does not check

- Real phones: the sizes and pixel ratios are emulated in headless Chrome (or Firefox with `open`'s `browser`), and Safari is not run, so try the deployed page on your own phone too.
- How touch feels: `interact` sends touch and pointer input and reports what changed, but whether a drag feels right is for a person to judge.
- Your host: caching headers, compression and the domain are set where you deploy.

## Related

- [three.js canvas blurry on phone](/guides/threejs-canvas-blurry-on-phone): the pixel ratio, post-processing size and textures behind a soft picture on a phone.
- [three.js responsive canvas resize](/guides/threejs-responsive-canvas-resize): the resize handler and keeping the scene in frame when a phone turns.
- [Claude Code 3D website](/guides/claude-code-3d-website): a landing page checked at every screen size and scroll stop.
- [three.js page speed](/guides/threejs-page-speed-lighthouse): the script budget, a production build, and pausing the scene off screen.
- [Screenshot a three.js scene headless](/guides/screenshot-threejs-scene-headless): `look` in full, with `viewports` and `scroll`.
