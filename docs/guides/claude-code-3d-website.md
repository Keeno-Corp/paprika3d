---
title: Claude Code 3D website: a three.js landing page checked at every screen size and scroll stop
phrase: claude code 3d website
description: How to make a 3D website with Claude Code, a three.js landing page for a music box that turns as the page scrolls, and how the paprika3d plugin checks it the way a visitor meets it, at phone, tablet, laptop and desktop sizes with look viewports, at five scroll stops with look scroll, and against a website's load budget with perf.
meta: Claude Code 3D website: a three.js landing page Claude checks at phone to desktop sizes, at five scroll stops, and against a site budget.
intent: claude-code-3d-website
queries:
  - "claude code 3d website"
  - "claude code 3d website skill"
  - "claude three js website"
  - "test 3d website"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# Claude Code 3D website: a three.js landing page checked at every screen size and scroll stop

Claude Code can build a 3D website with three.js: a landing page whose 3D object turns, opens or moves as the visitor scrolls, in one HTML file or a Vite project. What it cannot do on its own is look at the page on a phone, at each scroll position, or on a slow connection. Install the paprika3d plugin in Claude Code with `claude plugin marketplace add Keeno-Corp/paprika3d`, then `claude plugin install paprika3d@paprika3d`, and Claude checks the page at phone to desktop sizes, at each scroll stop and against a website's load budget before it says the page is done.

This page builds one small example, a landing page for a hand-wound music box that turns once as the page scrolls and opens its lid by halfway, and shows the three checks on it with the replies they gave. The first check found the box cut off at the edge of a phone screen. The camera path itself is covered in [three.js change camera position on scroll](/guides/threejs-camera-position-on-scroll) and the load time in [three.js page speed](/guides/threejs-page-speed-lighthouse); this page is about checking a finished page at every size and stop.

## The skill, and what to type

The question is often asked as "claude code 3d website skill". The plugin brings a skill, `threejs-game`, which Claude loads by itself whenever it works on a three.js page, game or website: it says how to build the page so it can be checked and which tool shows what. The skill is the method and the tools are what run the checks; the plugin installs both, plus hooks that remind Claude to open a page it has not opened. Other agents can take the skills alone with `npx skills add Keeno-Corp/paprika3d`, next to the MCP server (`npx -y paprika3d serve`), as [install](/install) describes.

Then ask for the page in your own words, or start the guided build with `/paprika3d:paprika-make`, which asks a few questions for a short brief, gathers references and builds the page:

```text
/paprika3d:paprika-make a one-page landing site for a hand-wound walnut music box: the box turns
once as the visitor scrolls and its lid opens by the middle of the page, with four short sections
of text beside it, and it must work on a phone held upright
```

The plugin needs Google Chrome, Node 20.11 or later and Claude Code 2.1.118 or later. Its tools run Chrome headless on your machine, with no window.

## The page

The canvas is fixed behind the text. Scroll progress, 0 at the top and 1 at the bottom, sets the box's turn and the lid's angle each frame. The box's parts are named, and `window.__game` hands tools the progress, the turn and the lid in degrees. This is the version after the fix described below:

```html
<!-- verify -->
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Wren music boxes</title>
<style>
html,body{margin:0;background:#efe6d8;color:#2b2230;font:18px/1.5 Georgia,serif}
canvas{position:fixed;inset:0;display:block}
main{position:relative}
section{min-height:100vh;box-sizing:border-box;padding:12vh 6vw;max-width:520px}
h1{font-size:44px;margin:0 0 12px}h2{font-size:30px;margin:0 0 8px}
</style></head>
<body>
<main>
  <section><h1>Wren music boxes</h1><p>Each one is wound by hand and plays one tune, picked from a list of forty.</p></section>
  <section><h2>The lid</h2><p>Lift the lid and the tune starts; close it and the tune stops where it was.</p></section>
  <section><h2>The comb</h2><p>Eighteen steel teeth, tuned by hand, are plucked by pins on a brass drum.</p></section>
  <section id="order"><h2>Order yours</h2><p>Made to order in walnut or cherry, shipped in six weeks.</p></section>
</main>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xefe6d8);
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 50);
camera.position.set(0, 1.6, 6);
camera.lookAt(0, 0.3, 0);
scene.add(new THREE.HemisphereLight(0xfff2dd, 0x2a2030, 2));
const key = new THREE.DirectionalLight(0xffe6c0, 2.5);
key.position.set(3, 4, 3);
scene.add(key);

// The music box: a walnut case, a hinged lid, a brass drum and comb inside, a crank on the side.
const wood = new THREE.MeshStandardMaterial({ color: 0x6b3f24, roughness: 0.6, side: THREE.DoubleSide });
const brass = new THREE.MeshStandardMaterial({ color: 0xc9a050, metalness: 0.2, roughness: 0.35 });
const box = new THREE.Group();
box.name = 'music box';
scene.add(box);
const part = (name, geometry, material, [x, y, z], parent = box) => {
  const m = new THREE.Mesh(geometry, material); m.name = name; m.position.set(x, y, z); parent.add(m); return m;
};
const open = new THREE.MeshBasicMaterial({ visible: false });   // the case's top face, left out
part('case', new THREE.BoxGeometry(1.6, 0.7, 1.1), [wood, wood, open, wood, wood, wood], [0, 0.35, 0]);
part('drum', new THREE.CylinderGeometry(0.13, 0.13, 0.9, 24), brass, [0, 0.45, -0.15]).rotation.z = Math.PI / 2;
part('comb', new THREE.BoxGeometry(0.9, 0.04, 0.25), brass, [0, 0.4, 0.2]);
const crank = part('crank', new THREE.CylinderGeometry(0.03, 0.03, 0.35), brass, [0.97, 0.4, 0]);
crank.rotation.z = Math.PI / 2;
const hinge = new THREE.Group();   // the lid turns about its back edge
hinge.position.set(0, 0.7, -0.55);
box.add(hinge);
part('lid', new THREE.BoxGeometry(1.6, 0.1, 1.1), wood, [0, 0.05, 0.55], hinge);

// Scroll progress, 0 at the top of the page and 1 at the bottom, turns the box once and opens the lid by halfway.
const progress = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  return max > 0 ? THREE.MathUtils.clamp(scrollY / max, 0, 1) : 0;
};
// Wide screens put the box to the right of the text; an upright phone or tablet puts it under the text, with the camera
// moved back until the box's width fits the narrower view.
function layout() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  const narrow = camera.aspect < 1;
  box.position.set(narrow ? 0 : 1.6, narrow ? -0.8 : 0, 0);
  camera.position.z = narrow ? 6 * 0.75 / Math.max(camera.aspect, 0.5) : 6;
  camera.lookAt(0, 0.3, 0);
}
layout();
addEventListener('resize', layout);
renderer.setAnimationLoop(() => {
  const p = progress();
  box.rotation.y = p * Math.PI * 2;
  hinge.rotation.x = -Math.min(p * 2, 1) * 1.9;
  renderer.render(scene, camera);
});

const deg = r => Math.round(THREE.MathUtils.radToDeg(r));
window.__game = {
  describe: () => ({ name: 'music box landing page', units: 'degrees', controls: 'scrolling the page turns the box and opens its lid' }),
  observe: () => ({ progress: +progress().toFixed(3), turn: deg(box.rotation.y), lid: -deg(hinge.rotation.x) }),
  subject: 'music box',
};
</script>
</body></html>
```

Save it as `index.html` and run `npm install three` in the same folder; the import map loads three from `node_modules`.

## Check 1: every screen size

`look` with `viewports` reloads the page at each size, pictures it and puts the pictures in one labelled grid. `phone` is 390 × 844 CSS pixels at a pixel ratio of 3, `tablet` 820 × 1180 at 2, `laptop` 1440 × 900 at 2 and `desktop` 1920 × 1080 at 1. Each cell gets one line: the subject's share of the picture, how many objects are on screen, and the canvas's buffer against its CSS size. These replies come from paprika3d's MCP server on 2026-11-12, on a Linux machine with no graphics card, called as Claude calls them and cut to the lines discussed.

The first version placed the box 1.6 units to the right of the centre at every size, beside the text, which suits a wide screen:

```text
look {"viewports":["phone","tablet","laptop","desktop"]}

phone 390x844@3: subject music box 2%, 2 on screen; not on screen here: crank. Canvas: 780x1688 buffer for 390x844 CSS at DPR 3 (renderer pixel ratio 2, capped below DPR 3); resize handler ran.
tablet 820x1180@2: subject music box 5.7%, 2 on screen; not on screen here: crank. Canvas: 1640x2360 buffer for 820x1180 CSS at DPR 2 (renderer pixel ratio 2); resize handler ran.
laptop 1440x900@2: subject music box 7.8%, 3 on screen. Canvas: 2880x1800 buffer for 1440x900 CSS at DPR 2 (renderer pixel ratio 2); resize handler ran.
desktop 1920x1080@1: subject music box 7.1%, 3 on screen. Canvas: 1920x1080 buffer for 1920x1080 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
```

On a phone the box took 2% of the screen and its crank was off it; in the picture, a sliver of the box shows at the right edge. A camera's field of view in three.js is set top to bottom, so a tall narrow screen sees less from side to side, and an object placed for a wide screen falls off a narrow one. The resize handler ran, so the canvas was the right size; what was wrong was where the box sat. The fix puts the box under the text when the screen is taller than wide and moves the camera back until the box's width fits:

```diff
-box.position.x = 1.6;   // to the right of the text
...
-addEventListener('resize', () => {
+function layout() {
   renderer.setSize(innerWidth, innerHeight);
   camera.aspect = innerWidth / innerHeight;
   camera.updateProjectionMatrix();
-});
+  const narrow = camera.aspect < 1;
+  box.position.set(narrow ? 0 : 1.6, narrow ? -0.8 : 0, 0);
+  camera.position.z = narrow ? 6 * 0.75 / Math.max(camera.aspect, 0.5) : 6;
+  camera.lookAt(0, 0.3, 0);
+}
+layout();
+addEventListener('resize', layout);
```

The same call after it:

```text
look {"viewports":["phone","tablet","laptop","desktop"]}

phone 390x844@3: subject music box 11%, 3 on screen. Canvas: 780x1688 buffer for 390x844 CSS at DPR 3 (renderer pixel ratio 2, capped below DPR 3); resize handler ran.
tablet 820x1180@2: subject music box 15%, 3 on screen. Canvas: 1640x2360 buffer for 820x1180 CSS at DPR 2 (renderer pixel ratio 2); resize handler ran.
laptop 1440x900@2: subject music box 7.8%, 3 on screen. Canvas: 2880x1800 buffer for 1440x900 CSS at DPR 2 (renderer pixel ratio 2); resize handler ran.
desktop 1920x1080@1: subject music box 7.1%, 3 on screen. Canvas: 1920x1080 buffer for 1920x1080 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
```

The whole box on every size, larger on the phone and tablet, where it now has the width of the screen. The phone's line also says the renderer caps the pixel ratio at 2 on a screen of 3, which the page does on purpose (`Math.min(devicePixelRatio, 2)`) to draw fewer pixels.

## Check 2: five scroll stops

`look` with `scroll` reloads the page at each stop, a share of the page's scroll range, and pictures each in one grid. Each cell gets where the page is, where the camera is, and what is on screen:

```text
look {"scroll":[0,0.25,0.5,0.75,1]}

0 of 2400 px (0%): camera [0, 1.6, 6] looking along [0, -0.21, -0.98]; on screen: case, lid, crank
600 of 2400 px (25%): camera [0, 1.6, 6] looking along [0, -0.21, -0.98]; on screen: case, lid, drum
1200 of 2400 px (50%): camera [0, 1.6, 6] looking along [0, -0.21, -0.98]; on screen: lid, case, crank
1800 of 2400 px (75%): camera [0, 1.6, 6] looking along [0, -0.21, -0.98]; on screen: case, lid, drum, crank
2400 of 2400 px (100%): camera [0, 1.6, 6] looking along [0, -0.21, -0.98]; on screen: case, lid, crank
```

The camera stays put on this page, since the box is what moves, and the lists show the box doing it. At the top the lid is shut and the drum inside is hidden; with the lid open, the drum shows at the 25% and 75% stops, and the crank comes and goes as the box turns it away. Every stop has the box on screen, which is the check that matters for a scroll page: a stop with nothing on it is a visitor looking at an empty background.

`interact` scrolls on the paused clock and reads the page's state, for the numbers behind a stop. Halfway down and at the order section:

```text
interact {"steps":[{"scroll":{"progress":0.5}}]}

{"changed":{"progress":0.5,"turn":180,"lid":109}}
Scroll: 1200 of 2400 px (50%)

interact {"steps":[{"scroll":{"to":"#order"}}]}

{"changed":{"progress":1,"turn":360}}
Scroll: 2400 of 2400 px (100%)
```

Half a turn and the lid fully open at the middle, one full turn at the end, as the page means.

## Check 3: a website's budget

`perf` with `budget: "site"` holds the page to a website's limits: the first scene frame within 3 s of a first visit on Chrome's fast 4G preset, at most 1 MB of script and 4 MB of assets.

```text
perf {"budget":"site"}

29.8 ms median frame (p95 46.1 ms, 32 fps on average), 9 draw calls, 258 triangles, 0 MB assets; over budget: frameMs 29.8 of 16.7 ms, scriptMB 2.02 of 1 MB; site budget; software renderer (no GPU): frame time is no budget signal, do not optimize for it
Largest scripts: three.core.js 1.39 MB, three.module.js 0.63 MB. Fix: serve a production build (vite build minifies three.js and drops what the page does not import), compressed.
First scene frame: 2.7 s after navigation on fast-4g (8.1 Mbps down, 1.35 Mbps up, 165 ms latency), a first visit with no cache on a software renderer (no GPU: its shader compiles and first frame take far longer than a GPU's) (scripts 2.02 MB by 2.6 s).
```

The first scene frame came at 2.7 s, inside the 3 s limit, but the script is 2.02 MB, all of it three.js served unminified from `node_modules`, twice the budget. The frame time is over budget because this host draws WebGL in software, as the reply says, and is no guide to a real visitor's machine. The fix the reply names, a production build, is walked through with its before and after in [three.js page speed](/guides/threejs-page-speed-lighthouse).

## Lovable, Cursor and other agents

The page and the checks are the same whichever agent writes the code. paprika3d's tools run Chrome on your own machine, so they need an agent that runs there too. Cursor, Codex and other MCP clients run the same server with `npx -y paprika3d serve` ([install](/install) has each one's line), and get every tool on this page. Lovable builds and previews in its own cloud, where its preview is the check; the tools here apply to that code once it is in a folder on your machine with a local agent. The plugin's hooks and the `/paprika3d:paprika-make` command are Claude Code's.

## What paprika3d does not check here

- It does not run Lighthouse or give a score. The URL `open` serves is the one to hand to Lighthouse once the budget lines are clear.
- Sizes and pixel ratios are emulated in headless Chrome, not a real phone: touch, the browser's own toolbars and a real GPU's speed are not in these replies.
- It does not judge whether the page is beautiful or the copy persuasive. The pictures are there for that, and for you.
- It plays no sound, and this page has none; a music box site that plays its tune would need checking by ear.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): the loop of calls these checks come from, on a small game.
- [Screenshot a three.js scene headless](/guides/screenshot-threejs-scene-headless): `look` in full, with `viewports` and `scroll`.
- [three.js change camera position on scroll](/guides/threejs-camera-position-on-scroll): moving the camera with scroll, and the faults the scroll grid catches there.
- [three.js page speed](/guides/threejs-page-speed-lighthouse): the script budget, a production build, and pausing the scene off screen.
- [three.js responsive canvas resize](/guides/threejs-responsive-canvas-resize): the canvas's size and pixel ratio on every screen.
- [Check a three.js portfolio site before you deploy](/guides/check-threejs-portfolio-site-before-deploy): a turned phone, failed loads and the site budget on a portfolio hero.
- [How to make a game with Claude Code](/guides/make-a-game-with-claude-code): the same plugin, building a game instead of a site.
