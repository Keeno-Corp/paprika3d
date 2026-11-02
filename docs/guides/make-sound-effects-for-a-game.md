---
title: How to make sound effects for a game in code, with no audio files, in three.js
phrase: how to make sound effects for a game
description: How to make sound effects for a game as a beginner: where game sounds come from, how a jump, a pickup and a hit are made in code from a wave, a pitch slide and a fade with the browser's Web Audio and no files, how to play each one on its event and why the first key press matters, on a small three.js game, with paprika3d counting which events made a sound.
meta: How to make sound effects for a game in code with Web Audio and no files: a jump, a point and a bump in a small three.js game, checked with interact.
intent: make-sound-effects-for-a-game
queries:
  - "how to make sound effects for a game"
  - "how to add sound effects to javascript game"
  - "How are sound effects made?"
  - "Cross-platform, cross-browser way to play sound from Javascript?"
  - "Can't add audio to my game"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make sound effects for a game in code, with no audio files, in three.js

A game's sound effects come from one of two places: recordings, which you download or make and then play from a file, or a few lines of code that build the sound from numbers when it plays. For a first browser game, code is the quicker start. There are no files to find, no licences to check and nothing to load, and the short blips, jumps, coins and bumps of arcade games are made exactly this way. This page shows how such a sound is built, how to play it at the moment something happens, and how to check which events make a sound.

## Where game sounds come from

- **Recordings.** Studios record everyday objects (celery snapped for a breaking bone, coconut shells for hooves) and shape them in a sound editor. You can download recorded effects from free libraries; check each one's licence: CC0 needs no credit, CC BY needs your game to name the author.
- **Sound generators.** Free tools such as jsfxr and ZzFX make arcade sounds from sliders and a "random" button, and export a sound file or a line of code.
- **Code.** The browser can make a sound itself, which is what the rest of this page does.

## How a sound is made from numbers

A sound is air shaking back and forth. In code you describe the shaking with a few numbers:

- **Pitch** is how fast it shakes, in hertz (shakes per second). A hundred or so is a low hum; a thousand or more is a bright beep.
- **Wave shape** gives it its colour: a smooth triangle wave sounds soft, a square wave sounds buzzy like an old console, a sawtooth sounds harsh.
- **A pitch slide** makes it move. Rising sounds read as good news (a jump, a coin); falling sounds read as bad news (a hit, a fall).
- **Length and fade.** Game effects are short, a fifth of a second or so, and fade out at the end instead of stopping with a click.

The browser's built-in sound system, Web Audio, plays exactly this: an oscillator (the shaking) through a gain (the volume) to the speakers.

## Play the sound where the event happens

Call the sound from the same line of code that handles the event: where the jump starts, where the point is added, where the hit is detected. Then it plays on the same frame as the picture changes, which is what makes it feel connected. (A frame is one of the pictures a game draws many times a second.)

There is one rule that catches almost everyone: **browsers keep a page silent until the player clicks or presses a key on it.** Code that plays a sound before that runs without an error and is not heard. So the game creates its audio on the first key press, and games that want sound from the very start show a "press any key to start" screen. [three.js audio not playing](/guides/threejs-audio-not-playing) goes into this rule in depth, along with sounds that come from a place in a 3D scene.

## A small game with three sounds

Log hop: logs roll towards a fox, and you press Space to jump them. Jumping plays a rising blip, clearing a log a bright rising chime, and hitting one a low falling buzz. three.js, a JavaScript library for 3D in the browser, draws the scene; the sound is plain Web Audio, so it works the same in a game without three.js. The page is one HTML file whose import map line tells the browser where three.js is (a `node_modules/three` folder beside it, made by `npm install three`); [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains the parts of such a page.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Log hop</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}#hud{position:fixed;top:16px;left:20px;font:600 22px system-ui;color:#fff}</style></head>
<body>
<div id="hud">Logs: 0</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// Each sound is a few numbers: a wave shape, a pitch that slides from one value to another, and a length in seconds.
const SOUNDS = {
  jump:  { wave: 'square',   from: 300, to: 700, length: 0.15 },
  point: { wave: 'triangle', from: 900, to: 1500, length: 0.2 },
  bump:  { wave: 'sawtooth', from: 150, to: 40,  length: 0.3 },
};
let audio = null;   // made on the first key press: browsers keep a page silent until the player presses or clicks something
let lastSound = '';
function play(name) {
  lastSound = name;
  if (!audio) return;
  const s = SOUNDS[name], t = audio.currentTime;
  const osc = audio.createOscillator(), gain = audio.createGain();
  osc.type = s.wave;
  osc.frequency.setValueAtTime(s.from, t);
  osc.frequency.exponentialRampToValueAtTime(s.to, t + s.length);   // the pitch slides
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + s.length);      // the volume fades out
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + s.length);
}

const held = new Set();
function act({ key, down = true }) { if (down) held.add(key); else held.delete(key); }
addEventListener('keydown', e => {
  audio ??= new AudioContext();
  audio.resume();
  act({ key: e.code });
});
addEventListener('keyup', e => act({ key: e.code, down: false }));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd3e8);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0.5, 2, 7.5);
camera.lookAt(0.5, 1, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x507040, 3));
const ground = new THREE.Mesh(new THREE.BoxGeometry(30, 1, 4), new THREE.MeshStandardMaterial({ color: 0x5f9e4a }));
ground.name = 'ground';
ground.position.y = -0.5;
const fox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xe8752a }));
fox.name = 'fox';
const log = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.6, 16).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x7a4a2a }));
log.name = 'log';
scene.add(ground, fox, log);
const hud = document.getElementById('hud');

let y = 0, vy = 0, logX = 5, passed = false, logs = 0;
function step(dt) {
  if (held.has('Space') && y === 0) { vy = 11; play('jump'); }
  vy -= 30 * dt;
  y = Math.max(0, y + vy * dt);
  if (y === 0) vy = 0;
  logX -= 6 * dt;
  if (!passed && Math.abs(logX) < 0.7 && y < 0.7) {          // hit the log: back to zero
    logs = 0;
    passed = true;
    play('bump');
  } else if (!passed && logX < -0.7) {                       // cleared it
    logs++;
    passed = true;
    play('point');
  }
  if (logX < -6) { logX = 8; passed = false; }      // the next log rolls in from the right
  hud.textContent = `Logs: ${logs}`;
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
  fox.position.y = 0.4 + y;
  log.position.set(logX, 0.35, 0);
  log.rotation.z = logX;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'log hop', units: 'metres', keys: { Space: 'jump' } }),
  observe: () => ({ y: +y.toFixed(2), logX: +logX.toFixed(2), logs, lastSound }),
  act,
  setState: (s) => { logX = s.logX ?? logX; logs = s.logs ?? logs; passed = false; },
  subject: fox,
};
</script>
</body></html>
```

The three sounds are the `SOUNDS` table at the top: each is a wave shape, a pitch it slides from and to, and a length. `play(name)` builds one and starts it; to change a sound, change its numbers and listen again. A new sound is a new line in the table and a `play` call where its event happens. The `keydown` handler makes the audio on the first key press, so nothing plays before it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes the files in your project) can add the same thing to your game. Name each event and what its sound should be like:

```text
Add sound effects to my game, made in code with the Web Audio API and no audio files:
a short rising blip when the player jumps, a bright rising chime when they clear a log,
and a low falling buzz when they hit one. Start the audio on the first key press,
since browsers block sound before it. Keep each sound short and not too loud.
Then list every event in the game and the sound it plays, including events with none.
```

The last line catches the events you forgot. To swap a sound for a recorded one later, ask for the file to be loaded once at the start and played from the same place in the code.

## Check which events make a sound

An agent cannot hear, and neither can the hidden browser it tests in. paprika3d, a plugin for Claude Code and an MCP server (the standard way to give tools to other coding agents), runs the game in a hidden Chrome and counts the sounds the page starts instead. Its `interact` tool plays keys on exact frames and adds a Sound line to its reply. Here it sets a log 3 metres away, waits, presses Space and checks the result:

```text
interact {"steps": [{"state": {"logX": 3}}, {"wait": 10}, {"key": "Space", "frames": 5}, {"wait": 40}], "expect": {"logs": 1, "lastSound": "point"}}

{"changed":{"logX":-2.6,"logs":1,"lastSound":"point"}}
Sound: 2 started during these steps.
Expect: logs 1 ✓ · lastSound "point" ✓
```

Two sounds started, the jump and the point, and the game's own state agrees. Its `feel` tool, which watches what reacts after an event, counts sounds too. A jump pressed too late, so the fox hits the log:

```text
feel {"steps": [{"state": {"logX": 3}}, {"wait": 20}, {"key": "Space", "frames": 2}]}

Watched the steps' 22 frames and 45 frames after them, counted from the first step.
Moved during the steps: fox 0.34 units, log 2.2 units.
Smooth moves (a new position on 3+ consecutive frames): 2 (fox, log).
No change in: camera (no shake), scale (no pops), teleports, colour (no flashes), spawns, removals.
HUD text: unchanged.
Sounds started: 2.
State: logX 2.9 → -3.8, lastSound "" → "bump".
```

Two sounds again, the jump and the bump. The same reply also says that nothing on the screen reacted to the hit: no shake, no flash, and the score was already 0. [How to make a game feel good](/guides/make-a-game-feel-good) is about that half.

The same hit with no key pressed before it:

```text
feel {"steps": [{"state": {"logX": 3}}, {"wait": 20}]}

Watched the steps' 20 frames and 45 frames after them, counted from the first step.
Moved during the steps: log 2 units.
Smooth moves (a new position on 3+ consecutive frames): 1 (log).
No change in: camera (no shake), scale (no pops), teleports, colour (no flashes), spawns, removals.
HUD text: unchanged.
Sounds started: 0.
State: logX 2.9 → -3.6, lastSound "" → "bump".
```

The game's state says it played the bump, and no sound started, because no key had been pressed and the audio was never made. A player who waits for the first log hears nothing. In a real browser the rule is the same; a start screen fixes it.

`open` also writes a file named `fx.js` into the project. Its `sfx` makes sounds in code as this page does, with presets (`coin`, `jump`, `hit`, `explode`, `powerup` and more), `sfx.define` for a game's own, and the preset's name in the Sound line. `sfx.check` measures a sound without playing it, which `eval` (run code in the open page) can call:

```text
eval {"code": "const { sfx } = await import(\"./fx.js\"); return [\"jump\", \"coin\", \"hit\"].map(name => ({ name, ...sfx.check(name) }))"}

[{"name":"jump","duration":0.2,"peak":0.496,"rms":0.166,"clipped":false,"hz":549},{"name":"coin","duration":0.25,"peak":0.5,"rms":0.197,"clipped":false,"hz":1681},{"name":"hit","duration":0.15,"peak":0.482,"rms":0.166,"clipped":false,"hz":123}]
```

Each sound's length in seconds, its peak and average loudness (1 is the loudest before it distorts), whether it clips, and its pitch in hertz: numbers an agent can compare against "short, not too loud, high for good news". `sfx` is a port of ZzFX by Frank Force (MIT licence), which a game without paprika3d can use directly. These replies were captured on 2026-10-30 on a machine with no graphics card, where Chrome draws in software.

paprika3d does not hear anything, and cannot tell you whether a sound is pleasant or fits your game; your ears decide that. It reports which sounds started and when, and measures the ones `fx.js` makes. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Without paprika3d

Play with the sound on and press each key once, slowly. If a sound is missing, open the browser console (the panel of messages the page writes, with F12) and ask the agent to print the sound's name each time `play` is called. A name that prints with no sound means the audio is locked or muted; no name means the event never calls the sound.

## Next steps

- Give the same events something to see: [how to make a game feel good](/guides/make-a-game-feel-good).
- Make the scene look better: [how to make my game look better](/guides/make-my-game-look-better).
- Let friends hear it: [how to put your game online](/guides/put-your-game-online).
- A game built around a beat: [how to make a rhythm game](/guides/make-a-rhythm-game).
