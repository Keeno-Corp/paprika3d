---
title: "three.js canvas blurry on phone: the pixel ratio, the post-processing size and the texture behind a soft picture"
phrase: three.js canvas blurry on phone
description: Why a three.js canvas looks blurry on a phone and sharp on a laptop, the four places the missing pixels go (no renderer pixel ratio, an EffectComposer made too early, a fixed drawing buffer, a canvas texture drawn too small), and how paprika3d's look viewports checks that the canvas is sized right on every screen.
meta: "three.js canvas blurry on a phone: fix setPixelRatio, the EffectComposer and canvas textures, then check the buffer at every screen size."
intent: threejs-canvas-blurry-phone
queries:
  - "three.js canvas blurry on phone"
  - "three.js canvas blurry on mobile"
  - "threejs pixelated on iphone"
  - "three.js setPixelRatio blurry"
  - "effectcomposer blurry on mobile"
  - "My three.js canvas looks blurry on my phone. How do I check it is sized right on every screen?"
  - "three.js canvas blurry on phone pixel ratio"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# three.js canvas blurry on phone: the pixel ratio, the post-processing size and the texture behind a soft picture

A three.js canvas that is sharp on a laptop and soft on a phone is almost always drawing fewer pixels than the phone's screen has. A phone packs two or three device pixels into every CSS pixel (its `devicePixelRatio`). When the renderer draws one pixel per CSS pixel, the browser stretches that small picture over the screen and every edge and letter goes soft. The fix is `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` before `renderer.setSize`, the same ratio on every render target that draws the final picture (an `EffectComposer` above all), and textures drawn large enough for the size they show at.

The check is to look at the page the way each screen draws it. paprika3d, an MCP server and Claude Code plugin (`npx -y paprika3d serve` in any MCP client), opens the page in headless Chrome at a phone's size and pixel ratio, and `look` with `viewports` reports, for each screen, the canvas's drawing buffer next to its CSS size and pixel ratio. This page builds a small example, a sign with lettering on a texture over a turning lamp, and shows four ways it went soft on a phone with the line that caught each one.

## Install

paprika3d needs Google Chrome and Node 20.11 or later, and the Claude Code plugin needs Claude Code 2.1.118 or later.

```bash
claude plugin marketplace add Keeno-Corp/paprika3d
claude plugin install paprika3d@paprika3d
npm install three
```

Cursor, Codex, Gemini CLI and other MCP clients run the server with `npx -y paprika3d serve`. Then ask your agent "the canvas looks blurry on my phone, check it at every screen size", or call the tools yourself as below.

## The sharp version

The page sets the pixel ratio before anything reads it, gives the composer the same ratio on every resize, and draws the sign's lettering on a canvas wide enough to stay sharp when the sign spans a phone's width. `window.__game.observe()` returns the CSS size, the device pixel ratio, the canvas buffer, the composer's render target and the label canvas, so one `eval` shows every size that matters:

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Studio sign</title>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#20242b}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js","three/addons/":"./node_modules/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));   // before setSize, and before the composer reads it
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#20242b');
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 50);
camera.position.set(0, 0.2, 7);
scene.add(new THREE.HemisphereLight('#ffffff', '#445', 2.5));

// The sign's text is drawn on a canvas 1024 px wide, so it stays sharp when the sign fills a phone's width.
const label = document.createElement('canvas');
label.width = 1024; label.height = 256;
const ctx = label.getContext('2d');
ctx.fillStyle = '#f4efe6'; ctx.fillRect(0, 0, 1024, 256);
ctx.fillStyle = '#1b1d22'; ctx.font = 'bold 120px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
ctx.fillText('OPEN STUDIO', 512, 132);
const texture = new THREE.CanvasTexture(label);
texture.colorSpace = THREE.SRGBColorSpace;
texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: texture }));
sign.name = 'sign';
sign.position.y = 0.9;
scene.add(sign);

const lamp = new THREE.Mesh(new THREE.TorusKnotGeometry(0.55, 0.16, 160, 24), new THREE.MeshStandardMaterial({ color: '#d9822b', roughness: 0.35 }));
lamp.name = 'lamp';
lamp.position.y = -0.7;
scene.add(lamp);
const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.6, 1.6, 1.6)), new THREE.LineBasicMaterial({ color: '#9fb3c8' }));
wire.name = 'frame';
wire.position.y = -0.7;
scene.add(wire);

const composer = new EffectComposer(renderer);        // takes the renderer's pixel ratio when it is made
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new OutputPass());

function resize() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.position.z = Math.max(7, 2.2 / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / camera.aspect);
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

renderer.setAnimationLoop(t => {
  lamp.rotation.y = t / 1000;
  composer.render();
});

window.__game = {
  subject: 'sign',
  describe: () => ({ name: 'studio sign', units: 'meters' }),
  observe: () => ({
    css: [innerWidth, innerHeight],
    dpr: devicePixelRatio,
    buffer: [renderer.domElement.width, renderer.domElement.height],
    composer: [composer.renderTarget1.width, composer.renderTarget1.height],
    label: [label.width, label.height],
  }),
};
</script>
</body></html>
```

The pixel ratio is capped at 2. On a phone whose ratio is 3, an uncapped canvas has nine device pixels for every CSS pixel against four at the cap, and every one of them is shaded each frame on a phone's GPU. At arm's length the difference between 2 and 3 is hard to see; the cost is not.

## Check it at every screen size

`open` serves the folder, and `look` with `viewports` reloads the page once per screen, at the phone, tablet, laptop and desktop presets, each with its own pixel ratio:

```text
open {"url": "index.html", "cwd": "<project>"}

look {"viewports": ["phone", "tablet", "laptop", "desktop"]}

phone 390x844@3: subject sign 6.1%, 3 on screen. Canvas: 780x1688 buffer for 390x844 CSS at DPR 3 (renderer pixel ratio 2, capped below DPR 3); resize handler ran.
tablet 820x1180@2: subject sign 9.2%, 3 on screen. Canvas: 1640x2360 buffer for 820x1180 CSS at DPR 2 (renderer pixel ratio 2); resize handler ran.
laptop 1440x900@2: subject sign 6.2%, 3 on screen. Canvas: 2880x1800 buffer for 1440x900 CSS at DPR 2 (renderer pixel ratio 2); resize handler ran.
desktop 1920x1080@1: subject sign 5.5%, 3 on screen. Canvas: 1920x1080 buffer for 1920x1080 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
```

Read the `Canvas:` part of each line. A sharp canvas has a buffer equal to its CSS size times the renderer's pixel ratio: 390 by 844 at a ratio of 2 is 780 by 1688. On the phone the line also says the ratio is capped below the screen's, which is the cap above doing its job. To check one size closely, open the page at it with `size` and `dpr`, as the faults below do.

## Fault 1: no pixel ratio at all

The page as most first drafts write it, with `renderer.setSize(innerWidth, innerHeight)` and no `setPixelRatio`. It looks fine on a desktop monitor, whose ratio is 1, and soft on every phone:

```text
open {"url": "index.html", "cwd": "<project>", "size": [390, 844], "dpr": 3}

look {}

Canvas: 390x844 buffer for 390x844 CSS at DPR 3 (renderer pixel ratio 1, capped below DPR 3); resize handler ran.
```

The buffer is the CSS size, so the phone shows each rendered pixel as a block of three by three device pixels. Add `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` before the first `setSize`, and call it again in the resize handler: a phone moved to an external display, or a browser window dragged between screens, changes `devicePixelRatio` while the page runs.

## Fault 2: an EffectComposer made before the pixel ratio

Post-processing is the cause `look`'s canvas line cannot see on its own. `EffectComposer` reads the renderer's pixel ratio once, when it is made, and sizes its render targets from it. In this version the composer is made first and `setPixelRatio` comes later, so the canvas buffer is right and the picture drawn into it is not:

```text
open {"url": "index.html", "cwd": "<project>", "size": [390, 844], "dpr": 3}

look {}

Canvas: 780x1688 buffer for 390x844 CSS at DPR 3 (renderer pixel ratio 2, capped below DPR 3); resize handler ran.

eval {"code": "return window.__game.observe()"}

{"css":[390,844],"dpr":3,"buffer":[780,1688],"composer":[390,844],"label":[1024,256]}
```

The composer draws the scene at 390 by 844 and the last pass stretches it over a buffer twice as wide and twice as tall. The fixed page calls `composer.setPixelRatio(renderer.getPixelRatio())` before `composer.setSize` in its resize handler, and the same `eval` on it returns:

```text
{"css":[390,844],"dpr":3,"buffer":[780,1688],"composer":[780,1688],"label":[1024,256]}
```

The same goes for any `WebGLRenderTarget` you size yourself, a bloom pass's targets, an FXAA pass's resolution uniform and a picking target: each is sized in device pixels, so multiply CSS size by the renderer's pixel ratio.

## Fault 3: a fixed drawing buffer stretched by CSS

A canvas styled `width: 100vw; height: 100vh` with a buffer set once to a fixed size, here `renderer.setSize(640, 360, false)`, fills the screen on every device and is blurry and squashed on most:

```text
look {}

Canvas: 1280x720 buffer for 390x844 CSS at DPR 3 (renderer pixel ratio 2, capped below DPR 3); resize handler did not run: the canvas kept its size when the page shrank (a debounced one waits for frames). The buffer is not CSS size × pixel ratio, so the browser stretches it: call renderer.setSize when the canvas's size changes.
```

The third argument `false` tells three.js to leave the canvas's CSS alone, which is right when CSS sizes the canvas, but then the buffer has to follow the element: read `clientWidth` and `clientHeight` on every resize (or in a `ResizeObserver` on the canvas's parent) and pass them to `setSize`. The [responsive canvas guide](/guides/threejs-responsive-canvas-resize) covers the handler and the camera's aspect in full.

## Fault 4: a canvas texture drawn too small

With the canvas sized right, lettering on a texture can still be soft. In this version the sign's label canvas is 128 by 32. On the phone the sign's box from `look` is `[53, 325, 336, 394]`, 283 CSS pixels wide, so at a ratio of 2 its texture is stretched to well over four times its width. `look` with `zoom` enlarges a box of the live page to compare the two:

```text
look {"zoom": [53, 325, 336, 394]}

Picture: <run folder>/look-2-zoom.png ([53, 325, 336, 394] at 4×) of the live page at frame 1, not a saved picture or sheet
```

The 1024 by 256 label is crisp in that picture and the 128 by 32 one has fuzzy letters at the same size. Draw a `CanvasTexture` at least as wide, in device pixels, as the widest it shows on screen, and set `texture.anisotropy` to the renderer's maximum for text seen at an angle. Text that does not need to be in the 3D scene is sharper as HTML over the canvas.

## React Three Fiber

In React Three Fiber the `Canvas` component sets the pixel ratio from its `dpr` prop, so `<Canvas dpr={[1, 2]}>` is the same cap as above. The four checks are the same: `look` with `viewports` reads the buffer of the canvas R3F made, and `eval` reaches the renderer and any composer your effects library made.

## What the check does not show

- How the picture looks on a real phone's screen: Chrome here emulates the size and ratio and draws in software when the machine has no GPU, so frame times here are no phone's timing.
- A phone browser's own zoom: a page without `<meta name="viewport" content="width=device-width, initial-scale=1">` is laid out wider and scaled down, which `look` shows as a small canvas and small text rather than as blur.
- Blur that is in the art: a low-resolution model texture or a mipmapped texture seen at a grazing angle looks soft at every ratio.

## Related

- [three.js responsive canvas resize](/guides/threejs-responsive-canvas-resize): the resize handler, the camera's aspect and keeping the scene in frame when a phone turns.
- [Check a three.js portfolio site before you deploy](/guides/check-threejs-portfolio-site-before-deploy): the same viewports check as one step of a pre-launch pass over a whole page.
- [Screenshot a three.js scene headless](/guides/screenshot-threejs-scene-headless): `look` in full, with `viewports`, `zoom` and `scroll`.
- [three.js page speed](/guides/threejs-page-speed-lighthouse): what a higher pixel ratio costs, measured with `perf`.
