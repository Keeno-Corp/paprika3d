---
title: Can AI make a game based on a picture? A sketch turned into a three.js game
phrase: can ai make a game based on a picture
description: Can AI make a game based on a picture? Yes, with the picture as the brief for where things are and what they look like, and a few sentences for the rules it cannot show. How to photograph a drawing or take a screenshot, what to type beside it, how pixels of the picture become places in a three.js world, a small treasure-island game built from a drawn map, and paprika3d's reference tool reading the drawing and setting the game beside it.
meta: Can AI make a game based on a picture? Yes: a drawn map turned into a small three.js game, with the rules written beside the picture.
intent: make-a-game-from-a-picture
queries:
  - "can ai make a game based on a picture"
  - "can ai make a game based on an image"
  - "chatgpt image game"
author: paprika3d agent
date: 2026-11-02
review: weekly
---
# Can AI make a game based on a picture? A sketch turned into a three.js game

Yes. AI coding agents and chat assistants accept pictures, so a drawing on paper or a screenshot can be where a game starts. The agent looks at it and builds a game laid out like it: the same shapes in the same places, in similar colours, seen from a similar angle. A picture says all of that at once, where words would take a paragraph.

What a picture cannot show is how the game is played. It does not say what you control, what you are trying to do, what stops you or how you win. Those are the rules, and the agent will invent them unless you write them down. So the request that works is the picture plus a few sentences of rules. This page turns a drawn treasure map into a small 3D game that way.

## What the picture tells the agent, and what it does not

| The picture shows | Your words have to say |
|---|---|
| Shapes and outlines (the island's coast) | What the player controls (a pirate, walked with the arrow keys) |
| Where things are (the path, the trees, the X) | The goal (dig up the treasure under the X) |
| Colours and style (ink on paper, or a game's art) | What blocks you (the sea) |
| The view (from above, from the side) | How you act (Space digs) and when you have won |
| Labels written on it | What a mark means: the dashed line could be a path to follow or a wall |

## Step 1: get the picture to the agent

- **A drawing on paper:** photograph it from straight above, in even light, with the whole page in the frame and nothing else. A photo taken at an angle makes far things smaller, and the agent copies that.
- **A screenshot of a game you like:** fine as a reference for the layout, the camera and the feel. Its art and characters belong to the people who made it, so ask for your own versions of them.
- **Giving it to the agent:** in a chat assistant, attach the image to your message. With a coding agent such as Claude Code (an AI assistant that writes the files of a project on your computer), save the picture in the game's folder, for example as `refs/map.png`, and name that path in the request; Claude Code also takes a pasted image.

The map on this page was drawn for this guide on a computer, as brown pen lines on a paper-coloured background, 1280 by 800 pixels: the coast of a round island, a dashed line from a beach at the bottom left up to a red X near the top right, three palm trees, a compass and a few waves. A phone photo of a drawing works the same way once it is cropped to the page.

## Step 2: the request

Name the picture, say what each mark in it is, and then give the rules:

```text
refs/map.png is my drawing of a treasure island. Make it into a 3D game with three.js
in one index.html, seen from straight above so it lines up with the drawing: the
island's outline as sand in a blue sea, the dashed line as a path of stones, the
three trees as palms, and the red X where the treasure is buried. Rules: I walk a
pirate with the arrow keys, starting at the beach end of the path. The sea stops me.
Space digs. A dig close to the X finds a treasure chest; a dig anywhere else leaves
a hole. Count my digs and show the count when I find it. R starts again.
```

## Step 3: from the picture's pixels to places in the game

A picture is measured in pixels from its top left corner: `x` across, `y` down the page. A three.js world (three.js is a free JavaScript library that draws 3D in a web page) is measured in units, here with `x` across and `z` towards the viewer, while `y` is up. Turning one into the other takes two choices:

1. **A scale.** Here one unit of the world is 40 pixels of the drawing, so the 1280 by 800 picture becomes a world 32 units wide and 20 deep, with the picture's centre at the world's middle.
2. **A camera that sees it the same way.** An orthographic camera looks straight down without perspective (far things are not drawn smaller), so every point on screen sits where it sits in the picture. The top of the picture is the far side of the world.

Then every point in the picture becomes a point in the world with one line, `toWorld`, and the agent reads the points it needs off the picture: the coast as 14 corners, the path as 7, the X and the trees as one point each. One sign in that line decides whether the island comes out the right way up, and the first version below got it wrong.

## The game: treasure island

Save this as `index.html` next to the `refs` folder with the drawing in it. Run `npm install three` in that folder (it puts three.js in a `node_modules` folder, where the import map line near the top looks for it), then `npx vite`, and open the address it prints. [How to make a 3D browser game](/guides/how-to-make-a-3d-browser-game) explains those steps.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Treasure island</title>
<style>html,body{margin:0;overflow:hidden;background:#2f7fb8}canvas{display:block}
#hud{position:fixed;top:12px;left:0;right:0;text-align:center;font:600 20px system-ui;color:#fff;text-shadow:0 1px 3px #000;pointer-events:none}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// Read off the drawing (refs/map.png, 1280 by 800 px) on reference's grid, in the picture's pixels: x across, y down.
const ISLAND = [[250, 330], [330, 220], [470, 180], [620, 200], [760, 170], [900, 230], [1010, 330], [1030, 470],
  [960, 590], [820, 650], [650, 640], [480, 660], [330, 600], [240, 480]];
const PATH = [[360, 580], [450, 520], [530, 545], [600, 470], [660, 420], [730, 400], [800, 345]];
const X_MARK = [830, 320], PALMS = [[520, 330], [640, 290], [900, 540]];
// One unit of the world is 40 px of the drawing. The camera looks straight down with the top of the picture
// as the far side, so the picture's x is the world's x and the picture's y (down the page) is the world's z.
const SCALE = 40;
const toWorld = ([px, py]) => ({ x: (px - 640) / SCALE, z: (py - 400) / SCALE });
const shore = ISLAND.map(toWorld), treasure = toWorld(X_MARK);

// The rules, which the drawing cannot give: walk with the arrow keys, the sea stops you,
// Space digs, and a dig within one unit of the X finds the treasure.
const SPEED = 4, DIG_REACH = 1;
let pirate, digs, found;
function start() { pirate = toWorld(PATH[0]); digs = 0; found = false; holes.forEach(h => scene.remove(h)); holes.length = 0; }
function onIsland(p) {   // is the point inside the shore line? (count how many shore edges a line to the right crosses)
  let inside = false;
  for (let i = 0, j = shore.length - 1; i < shore.length; j = i++) {
    const a = shore[i], b = shore[j];
    if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}
function dig() {
  if (found) return;
  digs++;
  if (Math.hypot(pirate.x - treasure.x, pirate.z - treasure.z) < DIG_REACH) { found = true; return; }
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.35, 20), new THREE.MeshBasicMaterial({ color: 0x6b4a26 }));
  hole.rotation.x = -Math.PI / 2; hole.position.set(pirate.x, 0.03, pirate.z); hole.name = 'hole';
  scene.add(hole); holes.push(hole);
}

// The picture: the island's outline as sand in a blue sea, the dashed path as stones, the X, three palms.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2f7fb8);
const camera = new THREE.OrthographicCamera();
camera.position.set(0, 30, 0);
camera.up.set(0, 0, -1);
camera.lookAt(0, 0, 0);
function fit() {   // 20 units from top to bottom and as wide as the window: 32 by 20 for the drawing's 1280 by 800 px
  const w = 10 * innerWidth / innerHeight;
  Object.assign(camera, { left: -w, right: w, top: 10, bottom: -10 });
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
fit();
addEventListener('resize', fit);
scene.add(new THREE.HemisphereLight(0xffffff, 0x886644, 2.5));
const outline = new THREE.Shape(shore.map(p => new THREE.Vector2(p.x, -p.z)));
const island = new THREE.Mesh(new THREE.ShapeGeometry(outline), new THREE.MeshStandardMaterial({ color: 0xe8cf8f }));
island.rotation.x = -Math.PI / 2; island.name = 'island'; scene.add(island);
const stone = new THREE.MeshStandardMaterial({ color: 0x8b7d6b }), stoneShape = new THREE.CylinderGeometry(0.16, 0.16, 0.05, 12);
for (let i = 1; i < PATH.length; i++) {   // a stone every 0.8 units along each stretch of the path
  const a = toWorld(PATH[i - 1]), b = toWorld(PATH[i]), n = Math.round(Math.hypot(b.x - a.x, b.z - a.z) / 0.8);
  for (let k = 0; k < n; k++) {
    const s = new THREE.Mesh(stoneShape, stone);
    s.position.set(a.x + (b.x - a.x) * k / n, 0.02, a.z + (b.z - a.z) * k / n); s.name = 'path stone';
    scene.add(s);
  }
}
const red = new THREE.MeshBasicMaterial({ color: 0xa3291c });
for (const turn of [Math.PI / 4, -Math.PI / 4]) {
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.3), red);
  bar.rotation.y = turn; bar.position.set(treasure.x, 0.04, treasure.z); bar.name = 'x mark';
  scene.add(bar);
}
for (const p of PALMS.map(toWorld)) {
  const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.6, 7), new THREE.MeshStandardMaterial({ color: 0x3f8f3a }));
  leaves.position.set(p.x, 1.5, p.z - 1.5); leaves.name = 'palm';   // the drawing's point is the trunk's foot; the leaves sit above it
  scene.add(leaves);
}
const holes = [];
const chest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0xd9a520 }));
chest.position.set(treasure.x, 0.3, treasure.z); chest.name = 'chest'; scene.add(chest);
const pirateMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.5, 4, 12), new THREE.MeshStandardMaterial({ color: 0xc0392b }));
pirateMesh.name = 'pirate'; scene.add(pirateMesh);
const hud = document.getElementById('hud');

const held = new Set();
addEventListener('keydown', e => { if (e.code === 'Space' && !e.repeat) dig(); else if (e.code === 'KeyR') start(); else held.add(e.code); });
addEventListener('keyup', e => held.delete(e.code));

start();
let last = null;
renderer.setAnimationLoop(now => {
  const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;
  const dx = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0), dz = (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0);
  const next = { x: pirate.x + dx * SPEED * dt, z: pirate.z + dz * SPEED * dt };
  if (!found && onIsland(next)) pirate = next;   // the sea stops you
  pirateMesh.position.set(pirate.x, 0.55, pirate.z);
  chest.visible = found;
  hud.textContent = found ? `Treasure! Found in ${digs} ${digs === 1 ? 'dig' : 'digs'}. R to bury it again`
    : `Follow the map to the X. Arrow keys walk, Space digs. Digs: ${digs}`;
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100;
window.__game = {
  describe: () => ({ name: 'treasure island', units: 'units (40 px of the drawing each)', keys: { ArrowUp: 'walk', ArrowDown: 'walk', ArrowLeft: 'walk', ArrowRight: 'walk', Space: 'dig', KeyR: 'restart' } }),
  observe: () => ({ pirate: { x: r2(pirate.x), z: r2(pirate.z) }, digs, found, onIsland: onIsland(pirate) }),
  act: ({ key, down = true }) => { if (!down) held.delete(key); else if (key === 'Space') dig(); else if (key === 'KeyR') start(); else held.add(key); },
  setState: s => { if (s.pirate) pirate = { ...s.pirate }; },
  subject: 'pirate',
};
</script>
</body></html>
```

The four lists at the top are the drawing, read as numbers. `toWorld` turns each into a place in the world, the island is a flat shape cut along the coast's corners, and `onIsland` keeps the pirate on the sand by checking that each step lands inside the coast. The rules sit in `dig` and in the frame loop, and none of them came from the picture. The `window.__game` object at the end lets a testing tool read and set the game's state; players never see it.

## Let the agent hold the game up against the drawing

An agent can read your drawing once, write the game, and never see the two side by side. paprika3d, a Claude Code plugin and MCP server (MCP is the standard way to give a coding agent extra tools), gives it a way to read the picture closely and to compare the game with it. The replies below are from paprika3d on this page's game and drawing, captured on 2026-11-02 on a machine with no graphics card, cut to the lines discussed, with nothing reworded.

`reference` reads a picture at full size, with gridlines labelled in the picture's own pixels, so positions read off it go straight into the code. A `crop` enlarges one part and `sample` gives the colour at points:

```text
reference {"cwd":"<project>","file":"refs/map.png","grid":100}

refs/map.png is 1280 × 800 px.
Shown: [0, 0, 1280, 800] at 1× (1280 × 800), gridlines every 100 px labelled in the picture's pixels.

reference {"cwd":"<project>","file":"refs/map.png","crop":[740,260,920,400],"grid":20,"sample":[[830,320],[600,400],[120,400]]}

refs/map.png is 1280 × 800 px.
Shown: [740, 260, 920, 400] at 4× (720 × 560), gridlines every 20 px labelled in the picture's pixels.
Colours (5 × 5 mean): (830, 320) #a3291c, (600, 400) #f2e4c2, (120, 400) #f2e4c2.
```

The pictures come with the reply; the text says what they show. On the enlarged crop the X's centre sits at 830 across and 320 down, in the red ink `#a3291c`, and the paper is `#f2e4c2`.

The first version of the game had `toWorld` turn the picture's `y` into the world's `z` the way a graph's axis goes, upwards:

```js
const toWorld = ([px, py]) => ({ x: (px - 640) / SCALE, z: (400 - py) / SCALE });
```

`look` takes a picture of the game and lists where each object is on screen, in the same pixels as the drawing, since the camera shows the world at the drawing's scale:

```text
look {}

On screen (22):
island 29% [240, 140, 1029, 629] 19.8 × 12.3 units
palm ×3 1% [485, 168, 934, 485]
x mark ×2 0.14% [803, 453, 856, 506] 1.6 × 0.3 units, across the view
pirate 0.043% [348, 208, 371, 231]
path stone ×15 0.18% [384, 234, 782, 442]
```

In the drawing the X spans about 805 to 855 across and 295 to 345 down; in the game it is at 453 to 506 down, and the pirate, who starts at the beach at the bottom left, stands near the top. `reference` with `compare: true` puts the drawing, the game and their differences side by side and gives the colour of both at the sample points:

```text
reference {"cwd":"<project>","file":"refs/map.png","compare":true,"sample":[[830,320],[360,580],[120,400]]}

Shown: the picture, the page's look (1280 × 800) and their differences in red, each 480 px tall.
100% of pixels differ by more than 24/255 in a channel at 480 px tall. By region (4 × 4), rows top to bottom and cells left to right: 100% 100% 100% 100% / 100% 100% 100% 100% / 100% 100% 100% 100% / 100% 100% 100% 100%. Most different: top left (100%).
Colours (5 × 5 mean): (830, 320): picture #a3291c, page #d0ba80, off by +45 +145 +100; (360, 580): picture #675642, page #d0ba80, off by +105 +100 +62; (120, 400): picture #f2e4c2, page #2f7fb8, off by -195 -101 -10.
```

Where the drawing has its red X, the game has sand (`#d0ba80`): the island came out upside down, mirrored top to bottom. The share of differing pixels says little here, and it stays at 100% after the fix too, because the game is coloured as a game (blue sea, sand) and the drawing is ink on paper. The sample points and the picture beside the drawing are what show whether things are in their places. The fix is one sign:

```diff
-const toWorld = ([px, py]) => ({ x: (px - 640) / SCALE, z: (400 - py) / SCALE });
+const toWorld = ([px, py]) => ({ x: (px - 640) / SCALE, z: (py - 400) / SCALE });
```

The same two calls after it:

```text
look {}

On screen (22):
island 29% [240, 170, 1029, 659] 19.8 × 12.3 units
palm ×3 1% [485, 198, 934, 515]
x mark ×2 0.14% [803, 293, 856, 346] 1.6 × 0.3 units, across the view
pirate 0.043% [348, 568, 371, 591]
path stone ×15 0.18% [384, 357, 782, 565]

reference {"cwd":"<project>","file":"refs/map.png","compare":true,"sample":[[830,320],[360,580],[120,400]]}

Colours (5 × 5 mean): (830, 320): picture #a3291c, page #a3291c, off by 0 0 0; (360, 580): picture #675642, page #ac3225, off by +69 -36 -29; (120, 400): picture #f2e4c2, page #2f7fb8, off by -195 -101 -10.
```

The X is now at 293 to 346 down, where the drawing has it, and the sample there is the same red, off by 0. At the beach end of the path the game shows the red pirate where the drawing has a pen dash, which is where the request said the pirate starts.

The picture is right; next come the rules, which no picture can check. `interact` plays the game: a `{ state }` step puts the pirate somewhere, a key press digs or walks, `expect` checks the result, and `save` keeps each play as a check:

```text
interact {"steps":[{"state":{"pirate":{"x":4.75,"z":-2}}},{"key":"Space"}],"expect":{"found":true,"digs":1},"save":"dig-at-the-x"}

{"changed":{"pirate":{"x":4.75,"z":-2},"digs":1,"found":true}}
Expect: found true ✓ · digs 1 ✓

interact {"steps":[{"key":"Space"}],"expect":{"found":false,"digs":1},"save":"dig-away-from-the-x"}

{"changed":{"digs":1}}
Expect: found false ✓ · digs 1 ✓

interact {"steps":[{"key":"ArrowDown","frames":120}],"trace":["pirate.z"],"expect":{"onIsland":true,"pirate.z":[5,5.4]},"save":"the-sea-stops-you"}

{"changed":{"pirate":{"z":5.3}}}
Motion (pirate): travelled 0.733 units, it stopped at frame 12 and did not move again.
pirate.z: 4.5 → 5.3 at frame 12; first changed at frame 1
Expect: onIsland true ✓ · pirate.z 5.3 ✓
```

A dig on the X finds the chest, a dig at the start leaves a hole, and walking down from the beach stops at the coast after a few steps, with the down arrow still held. `test` replays all three on a freshly loaded page:

```text
test {}

✓ dig-at-the-x
✓ dig-away-from-the-x
✓ the-sea-stops-you
3 of 3 saved checks passed in 0.5 s
```

paprika3d reads pictures and compares them with the game; it does not draw your picture, guess the rules from it, or say whether the game is fun. It compares pixels, so a game drawn in its own colours differs from the drawing almost everywhere, and the useful checks are the sample points and the side-by-side picture. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add Keeno-Corp/paprika3d
claude plugin install paprika3d@paprika3d
```

## When the game does not match the picture

- **Upside down or mirrored.** The picture's `y` runs down the page; the line that turns it into the world's position needs the matching sign, as in the fix above.
- **Everything slightly too big or too small.** The scale and the camera disagree. With an orthographic camera, its height in units times the pixels per unit must equal the picture's height in pixels (here 20 units at 40 pixels each).
- **Squashed or cut off at the sides.** The window is not the picture's shape. Keep the picture's height and let the width follow the window, as `fit` does, or show the game at the picture's shape.
- **A photo taken at an angle.** Either photograph the drawing again from above, or build the camera the photo was taken from: [three.js match a reference image](/guides/threejs-match-reference-image-camera) shows how.
- **The agent made up rules you did not want.** The picture had none to give. Write them in the request, one sentence each.

## Next steps

- Turning the flat sand into a place with waves, shadows and texture: [how to make my game look better](/guides/make-my-game-look-better).
- Writing the rules as a short brief the agent keeps to: [AI prompt to make a game](/guides/ai-prompt-to-make-a-game).
- More than one island, each from its own drawing: [how to make levels in a game](/guides/make-levels-in-a-game).
- Keeping the fewest digs as a record: [how to save the high score](/guides/save-the-high-score).
- Sending the finished game to the person who drew the map: [how to put your game online](/guides/put-your-game-online).
