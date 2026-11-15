---
title: Click on a canvas element in Selenium, Cypress or Playwright: find a three.js object's pixels first
phrase: click on a canvas element in selenium
description: How to click on a canvas element in Selenium, Cypress or Playwright when the thing to click is a three.js object drawn inside it. The canvas has no child elements to select, so the test first finds the object's pixels, by projecting its position with Vector3.project in the page, and clicks there with each tool's offset rule; a coding agent with the paprika3d MCP server gets every named object's pixel box from look and clicks with interact.
meta: Click on a canvas element in Selenium, Cypress or Playwright: project the three.js object to pixels in the page, then click at that offset.
intent: click-canvas-element-selenium
queries:
  - "How to automate the action on a canvas object, when the canvas element has no name or ID in Selenium?"
  - "Interacting with a Canvas with Selenium"
  - "How to click on a point on an HTML5 canvas in Python selenium webdriver"
  - "Selenium : How to get locators of elements inside canvas tag"
  - "selenium canvas element click"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# Click on a canvas element in Selenium, Cypress or Playwright: find a three.js object's pixels first

A `<canvas>` is one element with nothing inside it to select, so a test clicks a three.js object by coordinates: find the pixel where the object is drawn, then click the canvas at that offset. The page knows where each object is, so the reliable way is to ask it: project the object's world position with `Vector3.project` and the camera, and click there. A coding agent can skip the test code: paprika3d (in Claude Code, `claude plugin marketplace add Keeno-Corp/paprika3d && claude plugin install paprika3d@paprika3d`; in any other MCP client, `npx -y paprika3d serve`) lists every named object's pixel box with `look` and clicks with `interact`, and the reply says what the click landed on.

## Why there is no locator

Selenium, Cypress and Playwright find elements in the DOM: by id, class, text or role. three.js draws its whole scene into the canvas's pixels, so a prize, a button drawn in 3D or a chess piece is not an element and has no locator. Pixel coordinates written into a test by hand go stale as soon as the camera, the window size or the scene changes. Asking the page at test time keeps them right: the camera that draws the frame is the one that says where an object lands.

## Install

paprika3d needs Google Chrome and Node 20.11 or later; the Claude Code plugin needs Claude Code 2.1.118 or later.

```bash
claude plugin marketplace add Keeno-Corp/paprika3d
claude plugin install paprika3d@paprika3d
npm install three
```

## The page: a claw machine

Click a prize and the claw moves over it, lowers, lifts it and drops it in the chute. The game picks the prize with its own raycaster, against the prizes alone, so the glass front of the cabinet never takes the click. `window.__game.screenOf(name)` is the helper a browser test calls: it projects a named object's centre with the camera and returns CSS pixels from the canvas's top left.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Claw machine</title>
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
scene.background = new THREE.Color(0x2a1f3d);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3.2, 7.5);
camera.lookAt(0, 1.2, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x403050, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(2, 6, 4);
scene.add(sun);

const add = (name, geometry, color, [x, y, z], extra = {}) => {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, ...extra }));
  mesh.name = name; mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
};
add('floor', new THREE.BoxGeometry(5, 0.2, 3), 0x5b4a8a, [0, -0.1, 0]);
add('back', new THREE.BoxGeometry(5, 4, 0.1), 0x3d2f66, [0, 2, -1.5]);
add('chute', new THREE.BoxGeometry(1, 0.6, 1), 0x222222, [2, 0.3, 1]);
add('glass', new THREE.BoxGeometry(5, 4, 0.05), 0xbfe6ff, [0, 2, 1.55], { transparent: true, opacity: 0.15 });
const prizes = [
  add('duck', new THREE.SphereGeometry(0.35, 24, 12), 0xffd23f, [-1.6, 0.35, 0]),
  add('bear', new THREE.BoxGeometry(0.6, 0.7, 0.5), 0xa0663c, [-0.5, 0.35, 0.3]),
  add('ring', new THREE.TorusGeometry(0.35, 0.1, 12, 32), 0xff4f9a, [0.6, 0.45, 0]),
  add('dice', new THREE.BoxGeometry(0.5, 0.5, 0.5), 0xf5f5f5, [1.4, 0.25, -0.6]),
];
const claw = new THREE.Group();
claw.name = 'claw';
claw.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2), new THREE.MeshStandardMaterial({ color: 0xcccccc })));
claw.children[0].position.y = 0.6;
for (let i = 0; i < 3; i++) {
  const finger = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.2 }));
  finger.position.set(Math.cos(i * 2.1) * 0.15, -0.1, Math.sin(i * 2.1) * 0.15);
  claw.add(finger);
}
scene.add(claw);

// Game state: the claw's place, what it is after, and the prizes won.
const HOME = { x: 2, y: 3, z: 1 }, SPEED = 3;
const c = { ...HOME };
let phase = 'idle', target = null, carried = null;
const won = [];

// A click picks the prize under the pointer, testing prizes only, so the glass in front never blocks it.
const ray = new THREE.Raycaster();
function pick(x, y) {
  if (phase !== 'idle') return;
  const ndc = new THREE.Vector2(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(prizes.filter(p => p.visible))[0];
  if (hit) { target = hit.object; phase = 'moving'; }
}
renderer.domElement.addEventListener('click', e => pick(e.clientX, e.clientY));

function toward(axis, goal, dt) {
  const d = goal - c[axis];
  c[axis] += Math.sign(d) * Math.min(Math.abs(d), SPEED * dt);
  return Math.abs(goal - c[axis]) < 1e-6;
}
function step(dt) {
  if (phase === 'moving' && toward('x', target.position.x, dt) & toward('z', target.position.z, dt)) phase = 'lowering';
  else if (phase === 'lowering' && toward('y', target.position.y + 0.45, dt)) { carried = target; phase = 'raising'; }
  else if (phase === 'raising' && toward('y', HOME.y, dt)) phase = 'returning';
  else if (phase === 'returning' && toward('x', HOME.x, dt) & toward('z', HOME.z, dt)) {
    carried.visible = false; won.push(carried.name);
    carried = target = null; phase = 'idle';
  }
  if (carried) carried.position.set(c.x, c.y - 0.45, c.z);
}
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

let last = null;
renderer.setAnimationLoop((now) => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));   // never more than 0.1 s a frame
  last = now;
  claw.position.set(c.x, c.y, c.z);
  renderer.render(scene, camera);
});

// Where a named object's centre is drawn, in CSS pixels from the canvas's top left: for a browser test to click.
function screenOf(name) {
  const v = scene.getObjectByName(name).getWorldPosition(new THREE.Vector3());
  camera.updateMatrixWorld();
  v.project(camera);
  const r = renderer.domElement.getBoundingClientRect();
  return { x: Math.round((v.x + 1) / 2 * r.width), y: Math.round((1 - v.y) / 2 * r.height) };
}

const round = (n) => +n.toFixed(2);
window.__game = {
  describe: () => ({ name: 'claw machine', units: 'world units, y up', mouse: 'click a prize: the claw fetches it and drops it in the chute' }),
  observe: () => ({ phase, target: target?.name ?? null, claw: { x: round(c.x), y: round(c.y), z: round(c.z) }, won: [...won] }),
  act: ({ x, y }) => pick(x, y),
  setState: (s) => { if (s.claw) Object.assign(c, s.claw); },
  screenOf,
};
</script>
</body></html>
```

Save it as `index.html`. The replies below are the ones the stable tools gave for this page on 2026-11-12, with run folders shortened to `<project>`.

## Find the pixels

**With paprika3d, from `look`.** After `open`, a plain `look` lists every named object on screen with its share of the picture and its box as left, top, right, bottom in CSS pixels:

```text
look {}

Picture: <project>/paprika3d/runs/2026-11-12T04-50-24-360Z/look-1.png
Pixels: brightness 20%, colour saturation 45%, 0% near black, 0% blown out.
Hues: violet 49%, blue 46% of the frame; over the objects (34.6% of it): blue 85%, grey 9%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
Surface: "back" covers 22% with almost no detail (0 of 255): it reads as flat colour. Unless the user asked for flat colour, add texture, normal detail or lighting variation.
On screen (11):
back 22% [354, 48, 925, 479] 5 × 4 units
floor 7.5% [275, 480, 1004, 651] 5 × 3 units
chute 2.1% [831, 492, 1012, 624]
bear 0.82% [535, 461, 615, 566]
ring 0.6% [658, 436, 766, 539]
duck 0.56% [403, 457, 488, 541]
dice 0.45% [765, 450, 831, 522]
claw ×4 0.48% [919, 0, 974, 221] 0.4–1.2 × 0.06–0.1 units
Never visible: none
Not found by the ID image (their own vertex shader places them, or they are see-through; see the picture): glass
```

The boxes come from an ID image, a second render with one flat colour per object, so they are the pixels each object really covers in this frame, after anything in front of it. The see-through glass draws no ID colour and is named on its own line.

**In a browser test, from the page.** The same numbers come from the helper, which a test reaches through its tool's script call. Here through `eval`:

```text
eval {"code": "return [\"duck\", \"bear\", \"ring\", \"dice\"].map(n => [n, __game.screenOf(n)])"}

[["duck",{"x":446,"y":499}],["bear",{"x":577,"y":513}],["ring",{"x":713,"y":488}],["dice",{"x":797,"y":486}]]
```

The duck's projected centre, (446, 499), sits in the middle of its box `[403, 457, 488, 541]`. Three things make the helper right on any page: it calls `camera.updateMatrixWorld()` before projecting (a camera that moved this frame may not have updated its matrices yet), it converts from the -1 to 1 range `project` returns to CSS pixels with the canvas's own `getBoundingClientRect()`, and it flips y, since screen y grows downwards. Pixel ratio does not enter: CSS pixels are what every click API takes.

## Click it from Selenium, Cypress or Playwright

Each tool clicks at an offset inside an element, and they measure the offset from different places. These snippets were not run on this page; the offset rules are from each tool's documentation and source, linked.

**Selenium 4, Python.** `move_to_element_with_offset` measures from the element's centre: its docstring reads "Offsets are relative to the in-view center point of the element" ([action_chains.py](https://github.com/SeleniumHQ/selenium/blob/trunk/py/selenium/webdriver/common/action_chains.py)). So subtract half the canvas's size:

```python
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

canvas = driver.find_element(By.TAG_NAME, "canvas")
p = driver.execute_script("return window.__game.screenOf(arguments[0])", "duck")
w, h = canvas.size["width"], canvas.size["height"]
ActionChains(driver).move_to_element_with_offset(canvas, p["x"] - w / 2, p["y"] - h / 2).click().perform()
```

**Cypress.** `.click(x, y)` takes "the distance in pixels from the element's left" and from its top ([click](https://docs.cypress.io/api/commands/click)). `its('__game')` retries until the game has set it:

```js
cy.window().its('__game').then((game) => {
  const p = game.screenOf('duck');
  cy.get('canvas').click(p.x, p.y);
});
```

**Playwright.** `position` is "relative to the top-left corner of element padding box" ([locator.click](https://playwright.dev/docs/api/class-locator#locator-click)):

```js
await page.waitForFunction(() => window.__game);
const p = await page.evaluate(() => window.__game.screenOf('duck'));
await page.locator('canvas').click({ position: p });
```

After the click, each test reads the result from the page, `window.__game.observe()` here, rather than from a screenshot. The claw takes a few seconds of animation, so the test waits for the state (a `waitForFunction`, a Cypress `should`, a Selenium `WebDriverWait`) before it checks `won`.

## Click it with paprika3d

`interact` sends a real mouse click at CSS pixels and steps the game's frames. The `until` step plays until the claw is idle again:

```text
interact {"steps": [{"mouse": "click", "x": 446, "y": 499}, {"until": {"phase": "idle"}, "max": 600}]}

{"changed":{"won":["duck"]}}
until: phase == "idle" held at frame 232
mouse click at (446, 499): over glass (Mesh, 6.5 units)
```

The duck is in the chute 232 frames later. The last line names the object nearest the camera under the pointer: the glass, 6.5 units away. That is what a click on a 3D scene lands on first, and why the game's raycaster tests the prizes alone.

## When the centre is not on the object

A centre can fall where the object draws nothing: a ring's hole, a chair's seat seen from the side, an L-shaped piece. The ring's projected centre is (713, 488), and clicking it does nothing:

```text
interact {"steps": [{"mouse": "click", "x": 713, "y": 488}, {"wait": 30}]}

{"after":{"phase":"idle","target":null,"claw":{"x":2,"y":3,"z":1},"won":["duck"]},"changed":{}}
mouse click at (713, 488): over glass (Mesh, 6.3 units)
```

`look` with `at` lists everything drawn at a point, front to back, with each distance and world position. At the centre the ray passes through the hole to the floor; higher up, at (713, 448), it meets the ring:

```text
look {"at": [[713, 488], [713, 448]]}

At (713, 488): glass 6.33 m at [0.48, 1.02, 1.58]; behind it floor 9.31 m; background beyond.
At (713, 448): glass 6.24 m at [0.47, 1.3, 1.58]; behind it ring 7.8 m; then back 9.43 m; background beyond.
```

A click at (713, 448) wins the ring:

```text
interact {"steps": [{"mouse": "click", "x": 713, "y": 448}, {"until": {"phase": "idle"}, "max": 600}], "look": true}

{"changed":{"won":["duck","ring"]}}
until: phase == "idle" held at frame 140
mouse click at (713, 448): over glass (Mesh, 6.2 units)
Picture: <project>/paprika3d/runs/2026-11-12T05-15-20-863Z/look-1.png
Pixels: brightness 19%, colour saturation 45%, 0% near black, 0% blown out.
Hues: violet 49%, blue 47% of the frame; over the objects (34.6% of it): blue 89%, grey 9%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
Surface: "back" covers 22% with almost no detail (0 of 255): it reads as flat colour. Unless the user asked for flat colour, add texture, normal detail or lighting variation.
On screen (9):
back 23% [354, 48, 925, 479] 5 × 4 units
floor 8.2% [275, 480, 1004, 651] 5 × 3 units
chute 2.1% [831, 492, 1012, 624]
bear 0.82% [535, 461, 615, 566]
dice 0.45% [765, 450, 831, 522]
claw ×4 0.48% [919, 0, 974, 221] 0.4–1.2 × 0.06–0.1 units
Never visible: none
Hidden by the game (visible false on it or a parent): duck, ring
Not found by the ID image (their own vertex shader places them, or they are see-through; see the picture): glass
```

For a browser test, the same fix is a helper that projects a point on the object's surface rather than its centre (for the ring, its top: the centre plus its radius in y), or one that casts a ray through a few points of the object's box and returns the first that hits it.

## What paprika3d does not do

- It does not run your Selenium, Cypress or Playwright suite, or replace it in CI. It is for the agent writing the page to check clicks while it works; the snippets above are what goes in a suite.
- It does not give objects inside a canvas DOM locators or an accessibility tree. Boxes and points are pixels for the current camera and window size; reopening at another `size` gives other numbers.
- It runs one headless Chrome (or Firefox) on this machine, with sizes and touch emulated. It does not drive a real phone, and on a machine with no GPU WebGL draws in software.

## Pitfalls

- **Clicking before the first frame.** A test that clicks before the game has set up its camera projects with a default matrix. Wait for `window.__game` (or another ready flag) first.
- **A moving target.** A prize that moves between the projection and the click lands elsewhere; project and click in the same step, or pause the game's motion in the test.
- **Something in front.** A see-through panel, a HUD drawn in the scene or another object can sit in front of the target. The game's raycaster decides what a click picks, so test it against the objects that should be clickable.
- **The canvas is not the window.** `screenOf` measures from the canvas's top left. A canvas inside a page with a header or margins still works with each tool's element offset; a Selenium move from the viewport's origin (`move_to_location`) needs the canvas's position added.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): keys and the state read back, for games played with the keyboard.
- [Screenshot a three.js scene headless from a coding agent](/guides/screenshot-threejs-scene-headless): what `look` returns, including the pixel boxes used here.
- [three.js click on an object with a raycaster](/guides/threejs-click-on-object-raycaster): the game side of a click, picking the object under the pointer.
- [A Playwright alternative for three.js and WebGL](/guides/playwright-alternative-threejs-webgl): when a harness suits an agent better than a hand-written browser script.
