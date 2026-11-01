---
title: Can I make a game with ChatGPT? A small three.js game, and the step after the chat
phrase: can i make a game with chatgpt
description: Yes, a small one. What a chat assistant such as ChatGPT or Gemini can do for a first game (write one HTML file with three.js that you save and open), what it cannot do (run, see or play it), how to work around that, and the step after the chat, a coding agent that opens and sees the game with paprika3d.
meta: Can I make a game with ChatGPT? Yes, a small three.js game in one HTML file. What the chat does, where it stops, and what to do next.
intent: can-i-make-a-game-with-chatgpt
queries:
  - "can i make a game with chatgpt"
  - "can chatgpt make a game for me"
  - "3D Game Creation by asking chatGPT"
  - "Is Chat GPT useful in our three.js project or no?"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# Can I make a game with ChatGPT? A small three.js game, and the step after the chat

## The short answer

Yes, a small one, and you do not need to know how to code. A chat assistant (ChatGPT, Gemini, Claude in a browser tab, or any other) can write a complete small game as one file of code. You save that file and open it in your web browser, and the game runs. A good first game has one idea: catch the falling thing, dodge the falling thing, collect the coins.

What the chat cannot do is run that file. It writes the code and never sees the game. When something is wrong (nothing shows, a key does nothing, the score never changes), you are the one who notices, describes it and copies the error back into the chat. That round trip is the real limit of making a game in a chat, and the last sections of this page are about the step after it.

## What you need

- A web browser. The game on this page was checked in Chrome.
- A plain text editor to save the file: Notepad on Windows, or TextEdit on a Mac after choosing Format, then Make Plain Text.
- An internet connection while you play, because the page loads three.js from the internet.

three.js is a free JavaScript library that draws 3D graphics inside a web page; JavaScript is the programming language web pages run. An HTML file is the kind of file a web page is made of. You install nothing.

## Step 1: ask for one file

Ask for a game small enough to finish, and ask for it in a shape you can save and open by double-clicking. What to type, as an example:

```text
Make a small 3D game in a single HTML file using three.js.
Load three.js from a CDN with an import map, so I can save the file and open it by double-clicking.
A basket at the bottom moves left and right with the arrow keys. Stars fall from the top.
Catching a star adds one point; three missed stars end the game, and R starts again.
Show the score on screen. Keep the code short and add a comment above each part.
```

A CDN is a public server that hosts libraries such as three.js, so the page can fetch it over the internet. Naming the controls, how you score and how you lose matters more than any other part of the request: a chat fills in whatever you leave out, and its guess may not be your game.

## Step 2: save it and open it

Copy the whole answer, from `<!doctype html>` to `</html>`, into the text editor, and save it as `catch.html` (check that it did not become `catch.html.txt`). Double-click the file and it opens in your browser. A page that loads three.js from a CDN through an import map runs when opened this way; a page that loads it from a folder on your computer needs a small local server instead. If the page stays blank, [html game not working](/guides/html-game-not-working) goes through the first run step by step.

This is the kind of file to expect back. It is the game this page uses, written and played for it:

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Star catcher</title>
<style>html,body{margin:0;overflow:hidden;background:#0b1026}canvas{display:block}
#hud{position:fixed;top:14px;left:18px;color:#fff;font:600 22px system-ui}</style></head>
<body>
<div id="hud">Caught 0 · Missed 0</div>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The world: a scene, a camera that looks at it, a light, and a renderer that draws it into the page.
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3.5, 10);
camera.lookAt(0, 3.5, 0);
scene.background = new THREE.Color(0x1a2350);
scene.add(new THREE.HemisphereLight(0xffffff, 0x334466, 3));
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// The two things in the game: a basket you move and a star that falls.
const basket = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.7, 0.7, 24), new THREE.MeshStandardMaterial({ color: 0xd08a3c }));
basket.name = 'basket';
scene.add(basket);
const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshStandardMaterial({ color: 0xffe14d, emissive: 0x664400 }));
star.name = 'star';
scene.add(star);

// The rules.
let x = 0, starX = 0, starY = 7, caught = 0, missed = 0, over = false;
const held = new Set();
const hud = document.getElementById('hud');
function dropStar() { starX = Math.random() * 10 - 5; starY = 7; }
function step(dt) {
  if (over) return;
  const dir = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
  x = Math.max(-5, Math.min(5, x + dir * 7 * dt));          // 7 units a second, kept on screen
  starY -= (3 + caught * 0.3) * dt;                          // each catch makes the next star a little faster
  if (starY < 0.5 && Math.abs(starX - x) < 1) { caught++; dropStar(); }
  else if (starY < -1) { missed++; over = missed >= 3; dropStar(); }
  hud.textContent = over ? `Game over: ${caught} caught. Press R to play again` : `Caught ${caught} · Missed ${missed}`;
}
function restart() { x = 0; caught = 0; missed = 0; over = false; dropStar(); }

// The keys: hold the arrows to move, R to restart.
function act({ key, down = true }) {
  if (key === 'r' && down && over) restart();
  if (down) held.add(key); else held.delete(key);
}
addEventListener('keydown', e => act({ key: e.key }));
addEventListener('keyup', e => act({ key: e.key, down: false }));

// The loop: about 60 times a second, move things by the time that passed, then draw.
let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  basket.position.x = x;
  star.position.set(starX, starY, 0);
  star.rotation.y = now / 300;
  renderer.render(scene, camera);
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// For testing tools: what the game is, its state as plain values, and a way to set it.
window.__game = {
  describe: () => ({ name: 'star catcher', keys: { ArrowLeft: 'hold to move left', ArrowRight: 'hold to move right', r: 'restart after game over' } }),
  observe: () => ({ x: +x.toFixed(2), star: { x: +starX.toFixed(2), y: +starY.toFixed(2) }, caught, missed, over }),
  act,
  setState: s => { ({ x = x, caught = caught, missed = missed, over = over } = s); if (s.star) ({ x: starX = starX, y: starY = starY } = s.star); },
};
</script>
</body></html>
```

The comments in it are the parts every small three.js game has: a scene (the world), a camera, a light, a renderer (the part that draws), the objects, the rules, the keys, and a game loop, the function the browser calls many times a second to move things and draw the next picture. The `window.__game` part at the end is for testing tools and changes nothing you see.

## Step 3: when it does not work, you are the chat's eyes

Since the chat never runs the page, every fix starts with you:

- **Open the browser's console** to find the error. The console is the browser's panel for messages from the page: press F12 (or Cmd+Option+J in Chrome on a Mac) and look for red lines. Copy the first red line into the chat, with what you saw and what you expected.
- **Describe, do not diagnose.** "The star never reaches the basket; it disappears halfway down" gives the chat more to go on than "the collision is broken".
- **Ask for one change at a time**, and paste the whole current file back with the request, so the answer starts from what you have rather than from its own earlier version.
- **Keep each version that works** as its own file (`catch-1.html`, `catch-2.html`), so a change that breaks the game costs you nothing.

When the code comes back with lines that no longer work in today's three.js, or runs and draws a black scene, [ChatGPT three.js code not working](/guides/chatgpt-threejs-code-not-working) shows how to find which lines are out of date.

## Where a chat stops

A chat works well for a first game of this size. It gets slow when the file grows past what you want to copy and paste, when each answer rewrites parts that worked, or when the bug is something you see and cannot put into words (a star that starts off screen, a scene too dark to read). Each of those is a trip through you.

The step after the chat is a coding agent: an AI assistant that works in a folder on your computer, writes the files there itself and runs commands, instead of handing you text to copy. Claude Code, Codex and Cursor's agent are examples. [How to make a game with Claude Code](/guides/make-a-game-with-claude-code) sets one up from nothing, and [AI prompt to make a game](/guides/ai-prompt-to-make-a-game) is about what to tell it.

## The agent opens and sees the game

paprika3d is a plugin for Claude Code (and an MCP server, a standard way to add tools to other coding agents) that gives the agent its own copy of Chrome to run the page in. In Claude Code it installs with two commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

With it, the agent runs the page with `open`, which reports console errors itself, and sees it with `look`, which returns the picture and lists each object on screen by name. These are the replies on the first version of the game above, captured on 2026-10-30 on a Linux server with no graphics card, where Chrome draws in software (the replies' lines about the `geo.js` and `fx.js` helper files `open` writes into the folder are left out, and the folder path is shortened to `<project>`):

```text
open {"url": "catch.html", "cwd": "<project>"}

Opened http://127.0.0.1:45831/catch.html in 0.2 s, paused at frame 0.
GPU: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). A software renderer (no GPU): frame times here say nothing of a real GPU's.
Page text outside the canvas: 0 h1, 0 h2, 5 words
{"name":"star catcher","keys":{"ArrowLeft":"hold to move left","ArrowRight":"hold to move right","r":"restart after game over"}}
Next: `look` to see it, then `interact` for each interaction the request names.

Run folder: <project>/paprika3d/runs/2026-10-30T19-34-20-625Z

look {}

Picture: <project>/paprika3d/runs/2026-10-30T19-34-20-625Z/look-1.png
Pixels: brightness 0%, colour saturation 1%, 99% near black, 0% blown out. Mostly black: the objects cover 0.69% of the frame.
Hues: grey 99% of the frame; over the objects (0.69% of it): orange 100%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
Lighting: no tone mapping (renderer.toneMapping is NoToneMapping): bright colours clip to white; ACESFilmicToneMapping, AgXToneMapping or NeutralToneMapping avoid it, and ACES also mutes saturated colours, which a bright stylised look may not want.
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Caught 0 · Missed 0" [18, 14, 268, 38].
On screen (1):
basket 0.69% [577, 571, 702, 643]
Never visible: star (1.1 units, in view)
In view but no pixel: too small for the scene (check its size against the scene), hidden behind something, or not drawn.
```

No console error, so a chat would have heard nothing. The picture says the rest: the frame is almost all black (the page's dark blue was set on the web page behind the canvas, not in the scene), the basket is small, and the star is not on screen at the start, because it began just above the top of the view. The fix was a few numbers and one line:

```diff
-camera.position.set(0, 4, 12);
-camera.lookAt(0, 3, 0);
+camera.position.set(0, 3.5, 10);
+camera.lookAt(0, 3.5, 0);
+scene.background = new THREE.Color(0x1a2350);
-const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.6, 0.6, 24), ...
+const basket = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.7, 0.7, 24), ...
-const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), ...
+const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), ...
-let x = 0, starX = 0, starY = 9, caught = 0, missed = 0, over = false;
+let x = 0, starX = 0, starY = 7, caught = 0, missed = 0, over = false;
```

and the next `look`, cut here to the lines that changed, listed both objects:

```text
Pixels: brightness 15%, colour saturation 68%, 0% near black, 0% blown out.
On screen (2):
basket 1.4% [554, 646, 725, 754]
star 0.31% [603, 62, 674, 145]
Never visible: none
```

The `Lighting:` line stayed: tone mapping is a choice about the look, and the game plays the same without it.

paprika3d does not work inside a chat tab, does not write the game, and does not decide whether it is fun. It runs the page for an agent working in a folder, and tells the agent what the page did.

## What to do next

Play your saved game and write down the one change you want most, in a sentence. Ask for that change alone. When the copy and paste starts to feel like the main job, move the folder to a coding agent; the game file comes with you as it is.
