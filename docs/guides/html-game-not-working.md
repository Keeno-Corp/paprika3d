---
title: HTML game not working? Why a three.js game shows a blank page when opened as a file
phrase: html game not working
description: Why a small three.js game saved as an HTML file shows a blank page on its first run, before any game bug, in the four ways it happens (opened as a file, three.js not where the import map points, one error that stops the script, a loop that never starts), how to serve the folder and read the browser console, and how a coding agent with paprika3d runs the page with open and look and reads the same faults itself.
meta: HTML game not working? Why a three.js game page stays blank when opened as a file, and the four first-run faults to check, with a game that works.
intent: html-game-not-working
queries:
  - "html game not working"
  - "how to run html page locally"
  - "Why do I need a local server for HTML5 game development?"
  - "I keep asking chat gpt to make me games but the code does not work"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# HTML game not working? Why a three.js game shows a blank page when opened as a file

You saved the code for a small game as `index.html`, double-clicked it, and the browser shows an empty page, or a dark one with a score in the corner and nothing moving. Nothing tells you why. On a first run this is almost never a bug in the game itself. It is one of four faults that stop the page before the game starts, and each one leaves a clue you can read in a minute.

Two words first. **three.js** is a JavaScript library: code a web page loads to draw 3D shapes, lights and a camera in the browser. A **module** is a script that loads other script files with `import`, which is how a three.js page gets three.js; the line `import * as THREE from 'three'` is that step. Most three.js pages an AI writes today are modules, and all four faults below are about getting that import to run.

## The four reasons, in the order to check them

1. **The page was opened as a file.** The address bar starts with `file://`. The browser refuses to load module files from your disk for a page opened that way, so three.js never arrives.
2. **three.js is not where the page looks for it.** The page names a path for three.js, and no file is there: it was never installed, or the path is wrong.
3. **One error stopped the script.** A misspelled name or a missing bracket stops a module at that line. Everything after it, including the game loop, never runs.
4. **No error, and the loop never started.** The script ran to the end, but the function that draws each frame was never called, so nothing is drawn.

The browser tells you which one it is, in its **console**: a panel that lists the errors a page hit. In Chrome or Edge press F12, or Ctrl+Shift+J on Windows and Linux and Cmd+Option+J on a Mac, then reload the page. Red lines are errors. Each one ends with the file and line number it came from.

## 1. Opened as a file: serve the folder instead

This is the fault behind the Stack Exchange question "Why do I need a local server for HTML5 game development?". Here is the game further down this page, opened as a file in Chrome 156. The console says:

```text
Access to script at 'file:///<folder>/node_modules/three/build/three.module.js' from origin 'null' has been blocked by CORS policy: Cross origin requests are only supported for protocol schemes: chrome, chrome-experimental-site-token-provider, chrome-extension, chrome-untrusted, data, http, https, isolated-app.
```

"Origin 'null'" is the browser saying the page has no web address, so it will not hand it script files from your disk. The fix is to give it an address: run a **local server**, a small program on your own computer that hands the folder's files to the browser the way a website does. You start it from a **terminal**, the window where you type commands (Terminal on a Mac, PowerShell on Windows). With Python installed:

```bash
cd path/to/your-game-folder
npm install three              # once: puts three.js in node_modules/, where the page looks for it
python3 -m http.server 8000
```

Then open `http://localhost:8000` in the browser, and leave the terminal open while you play. With Node.js installed, `npx vite` in the same folder is another server that does the same job. `npm` is Node.js's package installer; if you do not have Node.js yet, install it from nodejs.org first, since three.js is installed with it.

If the game really must open by double-click, it has to be built into one plain script that imports nothing; ask your AI assistant for that version by name ("one classic script, no modules, no import map").

## 2. three.js is not where the import map points

An **import map** is the small block near the top of the page that tells the browser where `'three'` lives:

```html
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
```

Change that path to `./three.module.js`, a file that does not exist in the folder, and the page shows its score text and nothing else. The console has a red line saying the server answered 404, "not found", for `three.module.js`. Either run `npm install three` in the folder, or change the path to where the file really is. The guide on [the three.js import map](/guides/threejs-import-map-examples-jsm) covers the add-ons path (`three/addons/`) and the older `examples/js` scripts.

## 3. One error stopped the whole script

Misspell one class name, `MeshStandartMaterial` for `MeshStandardMaterial`, on line 22 of the game below. The console says:

```text
Uncaught TypeError: THREE.MeshStandartMaterial is not a constructor
```

with `index.html:22` beside it. A module stops at its first error, so the basket on that line, the ball after it and the game loop at the end were never made. The fix is that one word. When the error names a three.js class you cannot find in the current docs, the class may have been removed from three.js since the code was written; [ChatGPT three.js code not working?](/guides/chatgpt-threejs-code-not-working) lists the common ones.

## 4. No error, and still nothing moves

Delete the last `requestAnimationFrame(loop);` line from the game below. The console stays clean, the page shows "Caught 0" over an empty frame, and the game never draws, because the function that draws each frame was written and never started. A **game loop** is that function: the browser calls it once per screen refresh through `requestAnimationFrame`, usually 60 times a second, and each call moves things a little and draws one picture. Look for a call that starts it outside the function itself.

## A small game that runs

A catch game: a ball falls, you move the basket with the left and right arrow keys, and each catch adds one. Save it as `index.html` in a folder, run `npm install three` there, serve the folder as in step 1, and open it.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Catch</title>
<style>html,body{margin:0;overflow:hidden;background:#112233}canvas{display:block}
#score{position:fixed;top:12px;left:16px;color:#fff;font:600 20px system-ui}</style></head>
<body>
<div id="score">Caught 0</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x112233);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 4, 12);
camera.lookAt(0, 4, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 3));

const basket = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 1), new THREE.MeshStandardMaterial({ color: 0xffaa33 }));
basket.name = 'basket';
scene.add(basket);
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.35), new THREE.MeshStandardMaterial({ color: 0x66ddff }));
ball.name = 'ball';
scene.add(ball);

let caught = 0, basketX = 0, ballX = 0, ballY = 8;
const held = new Set();
const score = document.getElementById('score');

function step(dt) {
  const dir = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
  basketX = Math.max(-5, Math.min(5, basketX + dir * 6 * dt));
  ballY -= 3 * dt;
  if (ballY < 0.5 && Math.abs(ballX - basketX) < 1.2) { caught++; score.textContent = `Caught ${caught}`; dropNew(); }
  else if (ballY < -1) dropNew();
}
function dropNew() { ballX = Math.random() * 10 - 5; ballY = 8; }

let last = null;
function loop(now) {
  requestAnimationFrame(loop);
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  basket.position.x = basketX;
  ball.position.set(ballX, ballY, 0);
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

const act = ({ key, down = true }) => { if (down) held.add(key); else held.delete(key); };
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.__game = {
  describe: () => ({ name: 'catch', keys: { ArrowLeft: 'hold to move left', ArrowRight: 'hold to move right' } }),
  observe: () => ({ caught, basketX: +basketX.toFixed(2), ball: { x: +ballX.toFixed(2), y: +ballY.toFixed(2) } }),
  act,
  setState: (s) => {
    if (s.caught !== undefined) { caught = s.caught; score.textContent = `Caught ${caught}`; }
    if (s.basketX !== undefined) basketX = s.basketX;
    if (s.ball) { ballX = s.ball.x ?? ballX; ballY = s.ball.y ?? ballY; }
  },
};
</script>
</body></html>
```

The `window.__game` object at the end is not needed to play. It lets a testing tool read the score and press keys, which the next section uses.

## When an AI agent writes the game, let it run the page

If an AI chat wrote the code, the loop above is you: save, serve, open the console, copy the red line back into the chat. A coding agent, a program such as Claude Code that edits the files in your folder and runs commands, can do the running too. paprika3d is a plugin for Claude Code (and an MCP server for other agents) that gives the agent its own headless Chrome, a browser with no window. Install it in Claude Code with:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

Its `open` tool serves the folder over HTTP, so fault 1 cannot happen there, and its reply carries the console errors. Its `look` tool returns a picture of the page and the objects on screen by name, or says that nothing was drawn. These replies were captured on 2026-10-30 from the game above and its three broken copies, on a Linux server with no GPU where Chrome draws in software; the `open` reply's lines about the helper files it writes into the project are left out, and the folder is shortened to `<project>`.

The wrong import map path (fault 2):

```text
open {"url": "index.html", "cwd": "<project>"}

game not ready after 10 s: no window.__game, three.js renderer or WebGL canvas on http://127.0.0.1:41171/index.html
The page shows: "Caught 0"
Failed to load resource: the server responded with a status of 404 (Not Found) three.module.js
```

The misspelled class (fault 3), and the `look` after it:

```text
open {"url": "index.html", "cwd": "<project>"}

Opened http://127.0.0.1:41521/index.html in 3.1 s, paused at frame 0.
GPU: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). A software renderer (no GPU): frame times here say nothing of a real GPU's.
The page took 3.1 s to its first frame; expected on this software renderer, nothing to do.
Page text outside the canvas: 0 h1, 0 h2, 2 words
{"three":"186","scenes":1,"entities":[]}
Errors so far:
THREE.MeshStandartMaterial is not a constructor (index.html:22:65)
Next: `look` to see it, then `interact` for each interaction the request names.

look {}

look: the game has not drawn a three.js scene after 5 s of stepping frames; if it is still loading or building, step it with `interact` { steps: [{ wait: frames }] } and look again
```

The loop that never starts (fault 4) opens with no error at all, and the same `look` reply is the one sign of it. The fixed game, opened and played:

```text
look {}

Picture: <project>/paprika3d/runs/2026-10-30T19-33-46-277Z/look-1.png
Pixels: brightness 13%, colour saturation 67%, 0% near black, 0% blown out.
Hues: blue 99% of the frame; over the objects (0.95% of it): orange 79%, cyan 20%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
Lighting: no tone mapping (renderer.toneMapping is NoToneMapping): bright colours clip to white; ACESFilmicToneMapping, AgXToneMapping or NeutralToneMapping avoid it, and ACES also mutes saturated colours, which a bright stylised look may not want.
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#score "Caught 0" [16, 12, 111, 34].
On screen (2):
basket 0.75% [565, 661, 714, 712]
ball 0.2% [615, 91, 664, 143]
Never visible: none

interact {"steps": [{"key": "ArrowRight", "frames": 30}]}

{"changed":{"basketX":3,"ball":{"y":6.45}}}
```

Holding the right arrow for 30 frames moved the basket 3 units and the ball fell, so the keys and the loop both work. The agent reads these lines and fixes the page before it tells you the game is ready.

What paprika3d does not do here: `open` always serves the folder, so it cannot show you the double-click case; it does not run inside a chat in a browser tab (a chat answer has to be saved into a folder first, which [can I make a game with ChatGPT](/guides/can-i-make-a-game-with-chatgpt) walks through); and it does not decide what the game should be.

## Once it runs

The page drawing is the first step, not the game. What usually comes next: [making a character move](/guides/make-a-character-move-in-javascript) smoothly with the keys, [a game over screen and a restart](/guides/add-a-game-over-screen), and, after a few rounds of changes, a request that breaks something that used to work, which is the subject of [vibe coding bugs](/guides/vibe-coding-bugs). How the page itself is put together, the scene, camera and loop, is in [how to make a 3D browser game](/guides/how-to-make-a-3d-browser-game).
