---
title: How to make a main menu for a game: title screen, pause and settings in three.js
phrase: how to make a main menu for a game
description: How to add a title screen, a pause menu on Escape and a settings screen to a small three.js browser game, for a first game: one value for which screen is showing, HTML panels over the canvas, pausing by skipping the game's update while the scene is still drawn, a normal time step after Resume, a pause when the tab is hidden, and a sound setting kept in localStorage; a balloon-pop game to paste, the prompt to give an AI agent, what to check when menus misbehave, and paprika3d's look reading the panels and interact pressing Escape and checking that nothing moved for sixty frames.
meta: How to make a main menu for a game in three.js: a title screen, a pause menu on Escape and a sound setting the game remembers.
intent: make-a-main-menu
queries:
  - "how to make a main menu for a game"
  - "How can I implement a main menu?"
  - "THREE.JS and buttons for start and pause animation"
  - "Make a Menu in three.js"
  - "how to pause a game"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a main menu for a game: title screen, pause and settings in three.js

A main menu is the screen a game opens on: its name, a Play button and a Settings button. A pause menu appears over the game when the player presses Escape, with Resume, Settings and Quit. A settings screen changes how the game behaves, such as turning the sound off, and the game should remember the choice next time. All three are built from four pieces:

1. **One value that says which screen is showing**: the title, playing, or paused.
2. **A panel of plain HTML for each menu**, laid over the game and shown or hidden by that value.
3. **Pausing**: while paused, the game skips its update (nothing moves) but keeps drawing the scene behind the menu.
4. **Settings that are saved** in the browser, read back when the game starts.

A few words first. **three.js** is a JavaScript library that draws 3D scenes in a web page, inside a **canvas** (the rectangle where the game appears). **HTML** is the rest of the page: text, buttons and panels, which can sit on top of the canvas. The **game loop** is a function the browser calls about sixty times a second; each call moves things a little (the **update**) and draws one picture (the **render**). **localStorage** is a small store in the browser where a page can keep text between visits.

## 1. One value for the screen

The game keeps one variable, `phase`, that is `'title'`, `'playing'` or `'paused'`. The Play button sets it to `'playing'`, Escape switches between `'playing'` and `'paused'`, and Quit sets it back to `'title'`. A second value, `settingsOpen`, says whether the settings screen is on top, so Back returns to whichever screen opened it. [How to add a game over screen](/guides/add-a-game-over-screen) explains this kind of value in more detail, with a game over screen as its example.

## 2. Menus are HTML over the canvas

The Stack Overflow question "Make a Menu in three.js" asks how to build a menu inside the 3D scene. You can, but you do not need to: a `div` with buttons, placed over the whole window with `position: fixed; inset: 0`, is a menu with sharp text, real buttons that take a click with no extra code, and CSS for its look. The game below has three such panels: title, pause and settings.

One function, `show()`, decides which panel is visible from `phase` and `settingsOpen`, and every button calls it after changing them. With a single place deciding, two menus can never be on screen at once. The panels use the `hidden` attribute, with the CSS rule `.panel[hidden] { display: none }` beside their `display: flex`, since a `display` rule otherwise overrides `hidden` and shows every panel from the start.

## 3. Pause: stop the update, keep drawing

There are two ways to pause, and one of them causes trouble.

- **Stopping the game loop** (`cancelAnimationFrame`, or `renderer.setAnimationLoop(null)`) stops everything, including drawing. Then, if the loop measures time since its last frame, the first frame after Resume sees the whole pause as one long step, and everything jumps forward at once.
- **Keeping the loop running and skipping the update** is the way used here. The loop still runs every frame and still draws, so the scene stays visible behind the menu, but it moves nothing unless `phase` is `'playing'`:

```js
const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
last = now;                                       // kept up to date while paused, so the frame after Resume is a normal one
if (phase === 'playing') step(dt);                // paused or on the title: nothing moves, the scene is still drawn
```

Everything that changes over time has to go through that update, including timers. A balloon spawned by `setInterval` or `setTimeout` keeps arriving during the pause, because those browser timers know nothing about `phase`. Count time inside the update instead.

Three more pause details:

- **Escape opens and closes the pause menu**, and closes the settings screen first if it is open. The key handler ignores the extra `keydown` events a held key sends (`event.repeat`), or holding Escape would flicker between paused and playing.
- **Pause when the player leaves.** The browser fires `visibilitychange` when the tab is hidden; pausing then means a player who switches tabs does not come back to a lost game.
- **Escape belongs to the browser first in two cases.** In fullscreen, and when the game has locked the mouse pointer (as first-person games do), the browser uses Escape to leave that mode, and the game may not see the key. Open the pause menu when fullscreen or the pointer lock ends, too.

## 4. Settings that are remembered

The settings screen here has one checkbox, Sound. Changing it sets the variable `sound` and writes it to localStorage; when the game starts, it reads it back, with sound on when nothing was stored yet:

```js
let sound = localStorage.getItem('balloon-pop-sound') !== 'off';
soundBox.addEventListener('change', () => { sound = soundBox.checked; localStorage.setItem('balloon-pop-sound', sound ? 'on' : 'off'); });
```

The pop sound is made in code with the browser's Web Audio, and it plays when `sound` is on and not otherwise. Browsers let a page make sound once the player has clicked or pressed a key, not before, so the game creates its audio when Play is clicked; [how to make sound effects for a game](/guides/make-sound-effects-for-a-game) explains both. localStorage itself, and what it can and cannot keep, is covered in [how to save the high score](/guides/save-the-high-score).

## The game: balloon pop with menus

The game opens on its title screen. Click Play, then click balloons to pop them. Press Escape to pause and again to resume; Settings has the Sound checkbox, and Quit returns to the title. Save it as `index.html`, run `npm install three` in its folder (this needs Node.js, a free program that installs JavaScript libraries), serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Balloon pop</title>
<style>html,body{margin:0;overflow:hidden;background:#bfe3ff}canvas{display:block}
#score{position:fixed;top:12px;left:16px;color:#234;font:700 22px system-ui}
.panel{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
  background:rgba(20,30,60,.55);color:#fff;font:600 22px system-ui}
.panel[hidden]{display:none}                 /* without this, display:flex above would show every panel at once */
.panel h1{margin:0 0 10px;font-size:56px}
.panel button{font:inherit;width:240px;padding:10px;cursor:pointer}</style></head>
<body>
<div id="score"></div>
<div id="title" class="panel"><h1>Balloon Pop</h1><button id="play">Play</button><button class="open-settings">Settings</button></div>
<div id="pause" class="panel" hidden><h1>Paused</h1><button id="resume">Resume (Esc)</button><button class="open-settings">Settings</button><button id="quit">Quit to title</button></div>
<div id="settings" class="panel" hidden><h1>Settings</h1><label><input type="checkbox" id="sound"> Sound</label><button id="back">Back</button></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// One value says which screen the game is on: 'title', 'playing' or 'paused'. Settings open on top of title or pause.
let phase = 'title', settingsOpen = false, score = 0;
let sound = localStorage.getItem('balloon-pop-sound') !== 'off';   // the setting, kept between visits
const panels = { title: document.getElementById('title'), pause: document.getElementById('pause'), settings: document.getElementById('settings') };
const soundBox = document.getElementById('sound');
function show() {
  panels.title.hidden = !(phase === 'title' && !settingsOpen);
  panels.pause.hidden = !(phase === 'paused' && !settingsOpen);
  panels.settings.hidden = !settingsOpen;
  soundBox.checked = sound;
}

let audio = null;                                   // browsers allow sound only after a click or key press
function pop() {
  if (!sound || !audio) return;
  const osc = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime;
  osc.frequency.setValueAtTime(700, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + 0.15);
}

function start() { audio ??= new AudioContext(); score = 0; balloons.forEach(respawn); phase = 'playing'; show(); }
function pause() { if (phase === 'playing') { phase = 'paused'; show(); } }
function resume() { if (phase === 'paused') { phase = 'playing'; show(); } }
document.getElementById('play').addEventListener('click', start);
document.getElementById('resume').addEventListener('click', resume);
document.getElementById('quit').addEventListener('click', () => { phase = 'title'; show(); });
document.querySelectorAll('.open-settings').forEach(b => b.addEventListener('click', () => { settingsOpen = true; show(); }));
document.getElementById('back').addEventListener('click', () => { settingsOpen = false; show(); });
soundBox.addEventListener('change', () => { sound = soundBox.checked; localStorage.setItem('balloon-pop-sound', sound ? 'on' : 'off'); });

function act({ key, down = true, repeat = false }) {
  if (!down || repeat || key !== 'Escape') return;
  if (settingsOpen) { settingsOpen = false; show(); }
  else if (phase === 'playing') pause();
  else if (phase === 'paused') resume();
}
addEventListener('keydown', e => act({ key: e.code, repeat: e.repeat }));
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });   // another tab: pause by itself

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe3ff);
scene.fog = new THREE.Fog(0xbfe3ff, 30, 90);           // the far grass fades into the sky
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 2, 12);
camera.lookAt(0, 2, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 2.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(3, 6, 8);
scene.add(sun);
const grass = new THREE.Mesh(new THREE.PlaneGeometry(200, 100).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x7cc45a }));
grass.name = 'grass';
grass.position.set(0, -3.2, -40);
scene.add(grass);

const COLORS = [0xff5a5a, 0xffc93c, 0x5ad1ff, 0xb57bff, 0x6ee06e, 0xff8ad8];
const balloons = COLORS.map((color, i) => {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 16), new THREE.MeshStandardMaterial({ color }));
  mesh.scale.y = 1.2;
  mesh.name = 'balloon';
  const string = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1), new THREE.MeshBasicMaterial({ color: 0x555555 }));
  string.position.y = -1.1;
  mesh.add(string);
  scene.add(mesh);
  return { mesh, x: (i - 2.5) * 2, y: [1, 4, 2, 5, 0, 3][i], speed: 1.2 };
});
function respawn(b) { b.x = Math.random() * 12 - 6; b.y = -4 - Math.random() * 3; b.speed = 1.2 + Math.random() * 0.8; }

// Clicks pop balloons, but only while playing: on the title or pause screen the panel takes the click anyway.
const ray = new THREE.Raycaster();
renderer.domElement.addEventListener('pointerdown', e => {
  if (phase !== 'playing') return;
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, 1 - e.clientY / innerHeight * 2), camera);
  const hit = ray.intersectObjects(balloons.map(b => b.mesh), false)[0];
  const b = hit && balloons.find(b => b.mesh === hit.object);
  if (b) { score++; pop(); respawn(b); }
});

function step(dt) {
  for (const b of balloons) {
    b.y += b.speed * dt;
    if (b.y > 8) respawn(b);                          // one that got away comes round again
  }
}

const scoreLine = document.getElementById('score');
let last = null;
renderer.setAnimationLoop(now => {
  const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;                                       // kept up to date while paused, so the frame after Resume is a normal one
  if (phase === 'playing') step(dt);                // paused or on the title: nothing moves, the scene is still drawn
  for (const b of balloons) b.mesh.position.set(b.x, b.y, 0);
  scoreLine.textContent = phase === 'title' ? '' : `Popped ${score}`;
  renderer.render(scene, camera);
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
show();

window.__game = {
  describe: () => ({ name: 'balloon pop', keys: { Escape: 'pause and resume' }, mouse: 'click a balloon to pop it' }),
  observe: () => ({ phase, settingsOpen, score, sound, balloons: balloons.map(b => ({ x: +b.x.toFixed(2), y: +b.y.toFixed(2) })) }),
  act,
  setState: s => {
    if (s.phase === 'playing' && phase !== 'playing') start();
    if (s.phase) phase = s.phase;
    if (s.score !== undefined) score = s.score;
    if (s.sound !== undefined) sound = s.sound;
    if (s.balloons) s.balloons.forEach((p, i) => Object.assign(balloons[i], p));
    show();
  },
  subject: () => balloons[0].mesh,
};
</script>
</body></html>
```

The menus are the three `div` elements at the top of the body, and `show()` is the one place that picks which is visible. `window.__game` at the end lets a test tool read the phase, the score, the sound setting and the balloons, and press Escape; the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code, Cursor or Codex that writes and edits the files of your project) can add menus to a game you already have. Describe the screens and the rules that keep them apart:

```text
Add a title screen, a pause menu and a settings screen to my three.js game.
Keep one phase value ('title', 'playing', 'paused') and a settingsOpen flag, and
one show() function that hides or shows an HTML panel over the canvas for each.
Title: Play and Settings. Pause (Escape, ignoring key repeat, and when the tab is
hidden): Resume, Settings, Quit to title. Settings: a Sound checkbox saved in
localStorage and read at start; Back returns to the screen that opened it.
While not playing, skip the game's update but keep drawing the scene, and keep
the time step normal on the first frame after Resume.
```

[Build a three.js game with an AI agent](/guides/ai-agent-build-threejs-game) covers working with an agent on a game over several steps.

## When the menus misbehave

- **Every panel shows at once, or a panel is up from the start.** A CSS `display` rule is overriding `hidden`; add the `[hidden]` rule.
- **Clicking a menu button also hits the game.** The panel should cover the canvas, and the game's own click handler should check `phase`.
- **Things keep moving behind the pause menu.** Something moves outside the update: a `setInterval`, a `setTimeout`, an animation started on its own.
- **Everything jumps forward after Resume.** The loop was stopped and the first time step after it covers the whole pause. Keep the loop running, or reset the last frame's time when resuming.
- **Escape does nothing.** The game is in fullscreen or has locked the pointer, and the browser took the key.
- **The setting is forgotten after a reload.** It is kept in a variable and never written to localStorage, or written but never read at start.
- **No sound at all.** The audio was created before the player's first click, and the browser kept it silent.

## Let the agent open the menus and press Escape

Menus are easy to break without noticing: a change to the game can leave a panel up, let the game run behind the pause, or forget a setting. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can click through the menus and read the result. Install it in Claude Code with these two lines in a terminal (the window where you type commands):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

`look` describes the picture, including any HTML over the canvas. These replies were captured on 2026-10-30 on the game above, on a machine with no graphics card where Chrome draws in software; each `look` part is cut to its lines about the menus and what is on screen. On the title screen:

```text
look {}

Over the canvas: div#title "Balloon Pop Play Settings" shows over 100% of it (background rgba(20, 30, 60, 0.55)) and takes the clicks on 97% of it (listeners on the canvas miss them).
On screen (13):
grass 43% [0, 445, 1279, 799] 200 × 100 units, across the view
balloon ×12 4.3% [235, 132, 1044, 679]
```

The title panel covers the game and takes the clicks, which is right on a title screen, and the balloons are drawn behind it. (Each balloon's string is a part with the same name, so twelve for six balloons.) Then `interact` clicked Play at the button's place, waited for the balloons to float up, pressed Escape and waited 60 more frames, with `trace` following two balloons' heights frame by frame:

```text
interact {"steps": [{"key": "Escape"}, {"wait": 60}], "trace": ["balloons.0.y", "balloons.1.y"], "expect": {"phase": "paused"}, "look": true}

{"changed":{"phase":"paused"}}
balloons.0.y: -1.92 throughout the 61 frames
balloons.1.y: -1.11 throughout the 61 frames
Expect: phase "paused" ✓
Over the canvas: div#pause "Paused Resume (Esc) Settings Quit to tit" shows over 100% of it (background rgba(20, 30, 60, 0.55)) and takes the clicks on 97% of it (listeners on the canvas miss them).
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#score "Popped 0" [16, 12, 121, 36].
```

Nothing moved for the whole pause, the pause panel is up, and the score is still on screen. Escape again resumes, and the first balloon moves on the very next frame, with no jump:

```text
interact {"steps": [{"key": "Escape"}, {"wait": 30}], "trace": ["balloons.0.y"], "expect": {"phase": "playing"}}

{"changed":{"phase":"playing","balloons":[{"x":1.07,"y":-1.13},{"x":1.38,"y":-0.16},{"x":4.46,"y":0.31},{"x":2.59,"y":-0.7},{"x":4.71,"y":0.8},{"x":0.09,"y":-1.24}]}}
balloons.0.y: -1.92 → -1.13 at frame 31; first changed at frame 1
Expect: phase "playing" ✓
```

Then the sound setting. The agent cannot hear, and neither can the hidden browser, so `interact` counts the sounds the page starts in a Sound line. A `{ state }` step holds a balloon still in the middle of the screen, and a click pops it, first with sound on, then with it off (the `changed` lines, which list every balloon, are left out):

```text
interact {"steps": [{"state": {"balloons": [{"x": 0, "y": 2, "speed": 0}]}}, {"mouse": "click", "x": 640, "y": 400}], "expect": {"score": 1}}

Sound: 1 started during these steps.
mouse click at (640, 400): over balloon (Mesh, 11.4 units)
Expect: score 1 ✓

interact {"steps": [{"state": {"sound": false, "balloons": [{"x": 0, "y": 2, "speed": 0}]}}, {"mouse": "click", "x": 640, "y": 400}], "expect": {"score": 2}}

Sound: none started during these steps (1 since load).
mouse click at (640, 400): over balloon (Mesh, 11.4 units)
Expect: score 2 ✓
```

Both clicks popped a balloon, and the pop made a sound while the setting was on and none when it was off. Last, the setting must survive a reload. In a separate run, `interact` clicked Settings, the Sound checkbox and Back on the title screen, and `eval` (it runs code in the page) read storage: it held `off`. After a reload of the page, `observe` read `"sound":false`. A new `open` starts with empty storage, as a first visit does, so that part was checked inside one `open`.

What paprika3d does not do: it does not design the menus or tell you whether they look good, it counts sounds rather than hearing them, and its hidden browser has no real fullscreen, so what Escape does in fullscreen is for you to try in your own browser.

## Next steps

- The end of a round and a restart: [how to add a game over screen](/guides/add-a-game-over-screen).
- Keep the top score next to the settings: [how to save the high score](/guides/save-the-high-score).
- More sounds, and the rule about the first click: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- A settings screen where two players pick their keys: [how to make a 2 player game](/guides/make-a-2-player-game).
- Share the finished game: [how to put your game online](/guides/put-your-game-online).
