---
title: How to make my game look better: light, colour and camera in a three.js game
phrase: how to make my game look better
description: How to make my game look better when it works but looks plain: five changes that lift a first three.js game (tone mapping and soft environment light, a palette of a few colours, a sky with fog, shadows, a camera that frames the player), shown before and after on a small coin-collecting game, with the words to give an AI agent and paprika3d's look reading both pictures.
meta: How to make my game look better: light, a small palette, sky and fog, shadows and a follow camera, before and after on a small three.js game.
intent: make-my-game-look-better
queries:
  - "how to make my game look better"
  - "how to make my game look good"
  - "Any tips on making my game look better?"
  - "Tips on how to make game look better?"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make my game look better: light, colour and camera in a three.js game

Most first 3D games look plain for the same few reasons, and none of them is a lack of art skill. The scene floats in a black void, the colours are the pure ones a colour picker starts on, the light comes from one side so everything else is dark, nothing casts a shadow, and the camera sits so far away that the player is a speck. Each of these has a fix of one to three lines. This page goes through the five that change the most, on a small game you can paste, and then shows how an AI agent can check the picture for itself.

The examples use three.js, a free JavaScript library that draws 3D scenes in a web page, but the ideas hold in any engine.

## Five changes, in the order to make them

1. **Tone mapping and soft light from all around.** Tone mapping is the step that turns the scene's light into screen colours; without it, bright parts clip to flat white. An environment light lights every side of every object a little, as the sky does outdoors, and it gives shiny metal something to reflect. Without one, metal has nothing to mirror and draws black, which is why gold coins in a first game often look like holes.
2. **A palette of a few colours.** Pick four or five colours and use nothing else: a ground colour, a darker one for the scenery, and one bright colour for the player that sits across the colour wheel from the ground (red or coral on green, orange on blue). Give the things to collect a colour of their own. Pure green, pure red and pure yellow look harsh; a slightly darker, slightly greyer version of each looks calmer.
3. **A sky and fog.** Replace the black background with a sky colour, and add fog in the same colour, so distant things fade into the sky. The edge of the world disappears, and the player can tell near from far.
4. **Shadows.** One light casts shadows, the objects cast them and the ground receives them. A shadow is what makes an object look like it stands on the ground rather than floats over it.
5. **A camera that frames the player.** Put the camera a little above and behind the player and move it with them, close enough that the player is easy to find at a glance.

Change one thing at a time and look after each. More light is not always better: the first try at these changes on the game below came out pale, because a strong sun and a strong environment light together wash colours out towards white. Turning both down and choosing a deeper green fixed it.

## The game, before and after

Coin woods: walk with the arrow keys and collect three coins among the trees. The first version is the same file with the five changes taken out:

| Change | First version | After |
|---|---|---|
| 1. Light | no tone mapping, no environment light, a white sun at strength 1 | ACES tone mapping, a `RoomEnvironment` at half strength, a warm sun at 1.5 |
| 2. Palette | ground `0x00ff00`, player `0x22aa22`, trees `0x008800`, coins `0xffff00` | ground `0x4e8a3e`, player `0xe8505b`, trees `0x24543c`, coins `0xffc83d` with a faint glow |
| 3. Sky and fog | a black background | a pale blue sky, and fog of the same colour |
| 4. Shadows | none | the sun casts, the trees, coins and player cast, the ground receives |
| 5. Camera | fixed high over the whole field | above and behind the player, following them |

Here is the version after the changes, each marked with its number. It is one HTML file; the import map near the top tells the browser where to find three.js (a `node_modules/three` folder next to the file, which `npm install three` makes). [How to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains each part of a page like this one.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Coin woods</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}#hud{position:fixed;top:16px;left:20px;font:600 22px system-ui;color:#fff;text-shadow:0 1px 3px #0008}</style></head>
<body>
<div id="hud">Coins: 0/3</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js","three/addons/":"./node_modules/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const SKY = 0xbfe3f0;
const held = new Set();
let px = 0, pz = 0, coins = 0;
function act({ key, down = true }) { if (down) held.add(key); else held.delete(key); }
addEventListener('keydown', e => act({ key: e.key }));
addEventListener('keyup', e => act({ key: e.key, down: false }));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;   // 1. tone mapping
renderer.shadowMap.enabled = true;                    // 4. shadows
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;   // 1. light from all around
scene.background = new THREE.Color(SKY);              // 3. a sky
scene.fog = new THREE.Fog(SKY, 12, 30);               // 3. fog in the sky's colour
scene.environmentIntensity = 0.5;
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
const sun = new THREE.DirectionalLight(0xfff2dd, 1.5);
sun.position.set(6, 12, 4);
sun.castShadow = true;                                // 4. shadows
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14 });
scene.add(sun);

// 2. a palette of a few colours: greens, a coral player, gold coins
const mat = (color, more) => new THREE.MeshStandardMaterial({ color, ...more });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(28, 28), mat(0x4e8a3e));
ground.name = 'ground';
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
const player = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 0.8), mat(0xe8505b));
player.name = 'player';
player.castShadow = true;
scene.add(ground, player);
for (const [x, z] of [[-5, -3], [4, -6], [-8, 4], [7, 3], [-2, -9], [9, -2], [-6, -8], [3, 7], [-9, -1]]) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1), mat(0x8b5e3c));
  trunk.position.y = 0.5;
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.4, 8), mat(0x24543c));
  top.position.y = 2.1;
  trunk.name = 'trunk';
  top.name = 'treetop';
  trunk.castShadow = top.castShadow = true;
  const tree = new THREE.Group();
  tree.add(trunk, top);
  tree.position.set(x, 0, z);
  scene.add(tree);
}
const coinList = [[3, -2], [-4, 2], [6, -7]].map(([x, z]) => {
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 24).rotateX(Math.PI / 2), mat(0xffc83d, { metalness: 1, roughness: 0.3, emissive: 0x664400 }));
  coin.name = 'coin';
  coin.position.set(x, 0.7, z);
  coin.castShadow = true;
  scene.add(coin);
  return coin;
});
const hud = document.getElementById('hud');

function step(dt) {
  const axis = (plus, minus) => (held.has(plus) ? 1 : 0) - (held.has(minus) ? 1 : 0);
  px = THREE.MathUtils.clamp(px + axis('ArrowRight', 'ArrowLeft') * 4 * dt, -12, 12);
  pz = THREE.MathUtils.clamp(pz + axis('ArrowDown', 'ArrowUp') * 4 * dt, -12, 12);
  for (const coin of coinList) if (coin.visible && Math.hypot(coin.position.x - px, coin.position.z - pz) < 0.8) {
    coin.visible = false;
    hud.textContent = `Coins: ${++coins}/3`;
  }
}

function draw(now) {
  player.position.set(px, 0.9, pz);
  for (const coin of coinList) coin.rotation.y = now / 600;
  camera.position.set(px, 3.5, pz + 6);                // 5. a camera that follows the player
  camera.lookAt(px, 0.8, pz);
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
  draw(now);
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'coin woods', units: 'metres', keys: { ArrowUp: 'walk away from the camera', ArrowDown: 'walk towards it', ArrowLeft: 'walk left', ArrowRight: 'walk right' } }),
  observe: () => ({ player: { x: +px.toFixed(2), z: +pz.toFixed(2) }, coins }),
  act,
  setState: (s) => { px = s.player?.x ?? px; pz = s.player?.z ?? pz; coins = s.coins ?? coins; },
  subject: player,
};
</script>
</body></html>
```

Two of the lines may be new to you. `PMREMGenerator(...).fromScene(new RoomEnvironment(), 0.04)` builds the soft light from all around out of a small virtual room that ships with three.js, so there is no image file to download. `scene.environmentIntensity = 0.5` sets that light to half strength, which kept the colours from washing out.

## What to ask your AI agent

If an AI coding agent (an assistant such as Claude Code that edits the files in your project) is building the game with you, name the changes instead of asking for "better graphics", which leaves it to guess:

```text
My game works but looks plain. Without changing how it plays, make it look better:
turn on ACES tone mapping and add soft environment light from a RoomEnvironment,
use a palette of four or five colours with the player in a colour that stands out from the ground,
replace the black background with a sky colour and add fog in that colour,
turn on shadows from the sun onto the ground,
and make the camera follow the player from a little above and behind.
Make one change at a time and tell me what each one changed in the picture.
```

If you have a picture of the look you want (a screenshot of a game you like, or a drawing), put it in the project folder and say so: "make it look closer to refs/style.png, and tell me what is different".

## Let the agent look at its own picture

An agent reads text and cannot see the game it made, so "does it look better?" is a question it has to answer blind. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser and lets the agent see it. Its `look` tool returns the screenshot together with lines of text the agent can act on. On the first version of Coin woods:

```text
look {}

Picture: <project>/paprika3d/runs/2026-10-30T19-46-09-279Z/look-1.png
Pixels: brightness 22%, colour saturation 51%, 44% near black, 0% blown out.
Hues: green 56%, grey 44% of the frame; over the objects but ground (3.1% of it): green 85%, grey 13%.
Depth: the nearest third of objects brightness 17%, colour 82%; the farthest third 18%, colour 84%. Far objects are no lighter or paler than near ones, and there is no fog: depth does not read. Add scene.fog in the background's colour, or lighten distant colour.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
Lighting: no tone mapping (renderer.toneMapping is NoToneMapping): bright colours clip to white; ACESFilmicToneMapping, AgXToneMapping or NeutralToneMapping avoid it, and ACES also mutes saturated colours, which a bright stylised look may not want.
Lighting: 3 metallic materials with no environment map (scene.environment unset): metal reflects nothing and draws black. Bake a RoomEnvironment through PMREMGenerator, or call stage() from fx.js.
Surface: "ground" covers 53% with almost no detail (0 of 255): it reads as flat colour. Unless the user asked for flat colour, add texture, normal detail or lighting variation.
World's edge: 44% of the picture is background below the horizon, in [0, 0, 1279, 759], past the far end of the ground: extend the ground, keep the camera over it, or fade it out with scene.fog.
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Coins: 0/3" [20, 16, 151, 40].
Subject: player takes 0.13% of the picture [624, 353, 655, 402]; 1 of its 1 named parts show.
Stands out: subject brightness 17% against 41% around it, colour 66% against 91%, edge contrast 0.172.
This camera shows little of the subject: try other views with `look` camera, then move the page's own camera to the best (said once).
On screen (22):
ground 53% [0, 206, 1279, 799] 28 × 28 units
treetop ×9 2.8% [325, 187, 934, 575]
player 0.13% [624, 353, 655, 402]
coin ×3 0.1% [499, 262, 803, 434]
trunk ×8 0.072% [361, 255, 905, 491]
Never visible: none
```

Each problem from the list above has a line here. The two `Lighting:` lines are the missing tone mapping and the missing environment light, with the black coins named as the result. The `Depth:` and `World's edge:` lines are the missing fog and sky: 44% of the picture is the black void past the ground. The `Subject:` line says the player covers 0.13% of the picture, and `Stands out:` says it is darker than the grass around it. After the five changes:

```text
look {}

Picture: <project>/paprika3d/runs/2026-10-30T19-46-15-430Z/look-1.png
Pixels: brightness 60%, colour saturation 46%, 0% near black, 0% blown out.
Hues: green 77%, grey 19% of the frame; over the objects but ground (11% of it): green 63%, red 23%, orange 13%.
Depth: the nearest third of objects brightness 45%, colour 65%; the farthest third 39%, colour 54%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
Surface: "ground" covers 70% with almost no detail (0.17 of 255): it reads as flat colour. Unless the user asked for flat colour, add texture, normal detail or lighting variation.
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Coins: 0/3" [20, 16, 151, 40].
Subject: player takes 2.5% of the picture [573, 271, 706, 498]; 1 of its 1 named parts show.
Stands out: subject brightness 48% against 55% around it, colour 58% against 50%, edge contrast 0.087.
On screen (12):
ground 70% [0, 181, 1279, 799] 28 × 28 units
treetop ×4 6.9% [61, 28, 1003, 309]
player 2.5% [573, 271, 706, 498]
coin ×2 0.77% [903, 189, 1064, 365]
trunk ×4 0.69% [161, 190, 938, 363]
Never visible: none
```

Both `Lighting:` lines and the `World's edge:` line are gone, and the player now covers 2.5% of the picture, a coral shape on green with its shadow under it. One line stays: the ground is a flat colour with no detail. That is the next step, a grass texture, and [free CC0 3D models and textures for three.js](/guides/free-cc0-3d-models-textures-threejs) says where to find one. These replies were captured on 2026-10-30 on a machine with no graphics card, where Chrome draws in software.

Three more tools help with the look. `open` writes a file named `fx.js` into the project whose `stage` function sets up changes 1 and 4 in one call (tone mapping, the environment light, a sun with shadows that fit the scene, a ground that shows them). `asset_search` finds a ready-made model, texture or HDRI sky (a photo of a real sky that lights the scene) in a hosted library of CC0 and CC BY ones and adds it to the project. `reference` puts the game beside a picture you gave and says how much of it differs.

paprika3d does not decide whether your game is pretty. It measures what is on the screen (brightness, colour, what stands out, what is too small) and names setup mistakes; whether the result matches the look you want is yours to judge. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Without paprika3d

Take a screenshot before each change and after it, and put them side by side at a small size, as a thumbnail would show them. Then turn the screenshot to black and white (any photo app can): if the player is the same grey as the ground, it will be hard to find in colour too, whatever its hue. Squint at the picture; the thing you see first should be the player or the goal.

## When something specific looks wrong

- Everything too dark, or a model black: [three.js glTF model too dark](/guides/threejs-gltf-model-too-dark).
- Colours pale and greyish: [three.js colors washed out](/guides/threejs-colors-washed-out).
- Shadows missing: [three.js shadows not showing](/guides/threejs-shadows-not-showing).
- A real sky photo for light and background: [three.js HDRI environment](/guides/threejs-hdri-environment).

## Next steps

- Make each catch and hit react: [how to make a game feel good](/guides/make-a-game-feel-good).
- Give it sound: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Show it to people: [how to put your game online](/guides/put-your-game-online).
- A low-resolution pixel look, on purpose: [how to make a 3d game look pixelated](/guides/make-a-3d-game-look-pixelated).
