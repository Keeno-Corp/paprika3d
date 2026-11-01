---
title: My kid wants to make a video game: making a small three.js game together with an AI agent
phrase: my kid wants to make a video game
description: A parent's guide to making a first video game with a child. When a block-based tool such as Scratch fits, when an AI coding agent fits instead, and how to do the second together: the child designs and plays, the parent types, the agent builds a small three.js game, and paprika3d's look and interact record give you a picture and a GIF to share.
meta: My kid wants to make a video game: how to make a small three.js game together, with the child designing and an AI agent building.
intent: my-kid-wants-to-make-a-video-game
queries:
  - "my kid wants to make a video game"
  - "can a 10 year old make a video game"
  - "Ask HN: My 12 year old nephew wants to make a game, how do I help him?"
  - "Ask HN: Best stack for building a tiny game with an 11-year-old?"
  - "Ask HN: My son (9yo) wants to learn to develop games"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# My kid wants to make a video game: making a small three.js game together with an AI agent

## The short answer

Yes, a child can make a video game, and you can help without knowing how to code. There are two good routes, and which one fits depends on what the child wants most.

- **A child who wants to build it with their own hands** fits a block-based tool such as Scratch, a free tool from MIT made for children, where they snap coloured blocks together to make games and stories. Every part of the game is theirs, and they learn how programs work as they go.
- **A child whose ideas run ahead of their typing** (a frog that jumps over logs, a dragon that catches cupcakes) fits an AI coding agent: an AI assistant that writes the game's code in a folder on your computer. The child designs the game and plays it, you type what they say, and the agent builds it. This page is about that route.

The two mix well: a game made with an agent is something to take apart afterwards, and a child who started in Scratch can describe a bigger idea to an agent later.

## Who does what

- **The child** draws the game and decides what is in it: who you are, what you do, how you win or lose, what it looks like.
- **The parent** types the request and the changes, holds the account (AI services set a minimum age in their terms) and decides what gets shared.
- **The agent** writes the game, a page that runs in the web browser, using three.js (a free library that draws 3D graphics in a web page).
- **The child plays it** and says the next change in their own words. You type those words as they are.

Setting up the agent is on [how to make a game with Claude Code](/guides/make-a-game-with-claude-code); it takes a terminal (the text window where you type commands), and a parent can do it once for both of you.

## Start from a drawing

Before anyone types, ask the child to draw the game on paper and answer three questions: what are you, what do you do, and how does it end? A drawing of a frog, a log and an arrow saying "jump!" is a complete game design. Then turn it into a request, keeping the child's words:

```text
My kid drew this game. Please make it as a small 3D game with three.js in one HTML file.
You are a green frog on a riverbank. Logs roll toward you. Press Space to jump over them.
Every log you jump over is one point. If a log hits you, it says "Splash!" and Space starts again.
Make it bright and friendly, seen from the side. Put the three numbers for how high the frog jumps,
how fast it falls and how fast the logs roll at the top of the code, with a comment on each,
so we can change them together.
```

The last two lines are for later: they make the code easy to read together. [AI prompt to make a game](/guides/ai-prompt-to-make-a-game) says more about what to put in a request.

## The game

This is a game written for this page from that request:

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Frog jump</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:14px;left:18px;color:#fff;font:700 24px system-ui;text-shadow:0 2px 4px #0008}</style></head>
<body>
<div id="hud">Logs jumped: 0</div>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// Numbers to play with: change one, save, reload, and see what happens.
const JUMP = 9;          // how hard the frog jumps
const GRAVITY = 25;      // how fast it falls back down
const LOG_SPEED = 6;     // how fast the logs roll

let y = 0, vy = 0, logX = 9, jumped = 0, splashed = false;
const hud = document.getElementById('hud');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd8f5);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(1, 2.5, 11);
camera.lookAt(2, 1.2, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x4a6a30, 2.5));
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const bank = new THREE.Mesh(new THREE.BoxGeometry(60, 1, 6), new THREE.MeshStandardMaterial({ color: 0x5fa83c }));
bank.name = 'riverbank';
bank.position.y = -0.5;
scene.add(bank);
const frog = new THREE.Group();
frog.name = 'frog';
const skin = new THREE.MeshStandardMaterial({ color: 0x3cc44a });
const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 16), skin);
body.scale.set(1.2, 0.8, 1);
body.position.y = 0.5;
frog.add(body);
for (const side of [-0.25, 0.25]) {
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  eye.position.set(0.35, 0.95, side);
  frog.add(eye);
}
scene.add(frog);
const log = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.4, 20).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8a5a2b }));
log.name = 'log';
scene.add(log);

function step(dt) {
  if (splashed) return;
  vy -= GRAVITY * dt;
  y = Math.max(0, y + vy * dt);
  if (y === 0) vy = 0;
  logX -= LOG_SPEED * dt;
  if (Math.abs(logX) < 0.9 && y < 0.8) splashed = true;           // the log hit the frog
  if (logX < -9) { logX = 9; jumped++; }                             // a log rolled past: one more jumped
  hud.textContent = splashed ? `Splash! You jumped ${jumped} logs. Press Space to go again` : `Logs jumped: ${jumped}`;
}

function act({ key, down = true }) {
  if (key !== ' ' || !down) return;
  if (splashed) { y = 0; vy = 0; logX = 9; jumped = 0; splashed = false; }
  else if (y === 0) vy = JUMP;                                       // jump only from the ground
}
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.key }); });

let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  frog.position.y = y;
  log.position.set(logX, 0.45, 0);
  log.rotation.z = logX / 0.45;                                      // roll as it moves
  renderer.render(scene, camera);
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.__game = {
  describe: () => ({ name: 'frog jump', keys: { ' ': 'jump; after a splash, go again' } }),
  observe: () => ({ frogY: +y.toFixed(2), logX: +logX.toFixed(2), jumped, splashed }),
  act,
  setState: s => { ({ logX = logX, jumped = jumped, splashed = splashed } = s); if (s.frogY !== undefined) { y = s.frogY; vy = 0; } },
  subject: frog,
};
</script>
</body></html>
```

It loads three.js from the internet, so while you are online, double-clicking the saved file opens the game in the browser. The `window.__game` part at the end lets testing tools read the game; the child never sees it.

## Play it, then ask for the next change

Let the child play first, before you say anything. Then ask what they want different, and type it as they say it: "the frog should jump higher", "make the logs come faster", "can there be two logs?". One change per request, then play again. Keep the child's ideas in a list on paper; the list is the game's plan, and crossing things off is half the fun.

Some ideas are big ("can it be multiplayer online?"). Say it goes on the list for later and pick the smallest one to do now. A small game that works keeps a child interested longer than a big one that does not run yet.

## Something to look at together

paprika3d is a plugin for Claude Code that lets the agent open the game, see it and play it before you do, so it finds its own mistakes instead of your child finding them. It adds two things a family can use too: a picture of the game, and a short GIF (a little looping animation) of a play. In Claude Code it installs with two commands in the terminal:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

These are its replies on the frog game, captured on 2026-10-30 on a Linux server with no graphics card, where Chrome draws in software. The folder path is shortened to `<project>`.

```text
look {}

Picture: <project>/paprika3d/runs/2026-10-30T19-45-40-163Z/look-1.png
Pixels: brightness 70%, colour saturation 47%, 0% near black, 0% blown out.
Hues: blue 69%, green 29% of the frame; over the objects (30.3% of it): green 96%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
Surface: "riverbank" covers 28% with almost no detail (0.59 of 255): it reads as flat colour. Unless the user asked for flat colour, add texture, normal detail or lighting variation.
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Logs jumped: 0" [18, 14, 219, 40].
Subject: frog takes 0.88% of the picture [401, 405, 528, 505]; 0 of its 0 named parts show.
Stands out: subject brightness 49% against 69% around it, colour 75% against 50%, edge contrast 0.148.
This camera shows little of the subject: try other views with `look` camera, then move the page's own camera to the best (said once).
On screen (5):
riverbank 28% [0, 449, 1279, 715] 60 × 6 units, across the view
log 1.2% [1110, 406, 1279, 513]
frog ×3 0.88% [401, 405, 528, 505]
Never visible: none

interact {"steps":[{"state":{"logX":3,"splashed":false}},{"wait":40}],"expect":{"splashed":true}}

{"changed":{"logX":0.8,"splashed":true}}
Expect: splashed true ✓

interact {"steps":[{"state":{"logX":6,"splashed":false,"jumped":0}},{"until":{"logX":[1,2]}},{"key":" "},{"until":{"logX":[-9,-1]}}],"expect":{"splashed":false},"record":true}

{"changed":{"frogY":1.35,"logX":-1.24,"splashed":false}}
until: logX 1 to 2 held at frame 22
until: logX -9 to -1 held at frame 38
Expect: splashed false ✓
Recorded 1.24 s in real time: <project>/paprika3d/runs/2026-10-30T19-45-40-163Z/clip-1.gif (GIF, 36 KB, 480 × 300, 22 frames from 22 screencast frames, each shown for its real time); four moments of it: <project>/paprika3d/runs/2026-10-30T19-45-40-163Z/clip-1.png.
Frames: 39 game frames at a 60 Hz pace, 29 ms apart (median), p95 57.2 ms, max 81.9 ms; 4 took over two ticks (33 ms). A frame slower than 16.7 ms reads as its own time here, not as the 33 ms a 60 Hz screen would hold it. GPU: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). A software renderer (no GPU): frame times here say nothing of a real GPU's.
The clock is paused again where the play ended.
```

The `look` picture is a file in the game's folder: open it with the child and compare it with their drawing. The lines under it are the agent's notes: the riverbank is one flat green, and the frog is small in the picture. Either is a good question for the designer ("should the grass have stripes? should we be closer to the frog?"). In the first version written for this page, the first log started outside the camera's view, and `look` said so (`Never visible: log (2.4 units, outside the view)`); the agent moved its start closer before anyone played.

The first `interact` checks the rule the child gave: a log that reaches the frog makes a splash. The second plays a jump in real time with `record`, and keeps it as `clip-1.gif`, the GIF to send to a grandparent; its four moments show the frog on the bank, the log rolling in, and the frog in the air above the log. The `Frames` line times this server's software drawing and says nothing about how the game runs on your computer.

## Read the code together

When the game works, open the file in a text editor with the child and find the three numbers at the top. Change one: make `JUMP` bigger, save, reload the page, and play. The frog jumps higher. Make `LOG_SPEED` smaller and the logs crawl. This is the step where a child starts to see that the game is made of instructions they can change, which is the start of programming. Ask the agent to explain a part they point at ("what does `GRAVITY` do?") in words a child understands.

## Sharing it

The game is a file on your computer, and it stays there unless you choose otherwise. To play it on another computer, copy the file. paprika3d's `publish` tool can put a game at a public web address on paprika3d.app; the agent calls it when you ask for it and not otherwise, and the address is public, so anyone who has it can play the game. It is an invite-only preview. Leave it out and the game is not put online. [Put your game online](/guides/put-your-game-online) covers the other ways.

## What this does not do

paprika3d is a tool for the agent, not a product made for children: it has no child accounts or parental controls, and it does not teach programming by itself. It does not decide whether the game is fun; your child does that, and it is the part of the job they will like.

## What to do next

Pick the smallest idea on the child's list and ask for it. When the game feels flat, [make a game feel good](/guides/make-a-game-feel-good) adds the little jumps and flashes that make a catch or a splash feel like something, and [make sound effects for a game](/guides/make-sound-effects-for-a-game) adds the splash sound a child will ask for next. If you have not picked a first game yet, [what game should I make first](/guides/what-game-should-i-make-first) lists small ones that can be finished.
