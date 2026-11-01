---
title: How to make a game with Claude Code: from install to a three.js game it plays itself
phrase: how to make a game with claude code
description: How to make a game with Claude Code when you have never used a terminal. What to install (Claude Code, Node and Chrome), the folder to make, the two commands that add the paprika3d plugin, what to type to ask for a 3D game in three.js, and what the agent then does by itself (open, look, interact), with the lines of its replies a beginner reads.
meta: How to make a game with Claude Code from nothing: install, a folder, one request, and a three.js game the agent opens, looks at and plays.
intent: make-a-game-with-claude-code
queries:
  - "how to make a game with claude code"
  - "can claude code make 3d games"
  - "how to vibe code a game with claude"
  - "I Made Claude Build a Snake Game From One Prompt (Claude Code Tutorial 2026) - YouTube"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a game with Claude Code: from install to a three.js game it plays itself

## The short answer

Yes, Claude Code can make a game, a 3D one included. Claude Code is Anthropic's coding agent: an AI assistant that works inside a folder on your computer, writes the game's files there itself and runs commands, so you never copy and paste code. You talk to it in a terminal, the text window where you type commands to your computer. For a 3D game in the browser it writes three.js, a free JavaScript library that draws 3D graphics in a web page.

From nothing, it is five steps: install three programs, make a folder, add the paprika3d plugin, start Claude Code in the folder, and ask for the game in your own words. The plugin is what lets Claude Code open the game, see it and play it after writing it, so it finds its own mistakes before you do.

## What you need

- **A Claude account that includes Claude Code.** Anthropic's documentation lists the Pro, Max, Ultra, Team and Enterprise plans and Console (API) accounts; the free plan does not include it. Prices are Anthropic's to state and they change, so check them on its site.
- **Google Chrome.** paprika3d runs your game in its own hidden copy of it.
- **Node.js**, a program that runs JavaScript outside the browser; paprika3d needs version 20.11 or later. Download the installer marked LTS from nodejs.org and click through it.
- **A terminal.** On a Mac, open Terminal (search for it with Spotlight). On Windows, open PowerShell from the Start menu. Each command below is typed (or pasted) there, then Enter.

## Step 1: install Claude Code

On a Mac or Linux:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

On Windows, in PowerShell:

```powershell
irm https://claude.ai/install.ps1 | iex
```

Then open a new terminal window and type `claude --version`; a version number means it worked. Anthropic's setup page has other ways to install it, a desktop app, and a guide for people who have never used a terminal.

## Step 2: add paprika3d

Still in the terminal, add the plugin with its two commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

You do this once; the plugin is there in every folder after it.

## Step 3: make a folder and start Claude Code in it

Each game lives in its own folder. Make one, move into it, and start Claude Code:

```bash
mkdir lane-dodger
cd lane-dodger
claude
```

The first time, `claude` opens your browser to log in. After that you see a box to type in. Claude Code asks your permission before it edits files or runs a command; read what it wants to do and say yes when it fits what you asked.

## Step 4: ask for the game

Type what you want in plain words. Say what it is, the keys, how you score and how you lose, and keep the first version small:

```text
Make a small 3D game with three.js in one index.html file: a lane dodger.
I am a blue cube on a road with three lanes. The left and right arrow keys move me one lane.
Rocks roll toward me down one lane at a time. Each rock I dodge adds a point, and the next one comes a little faster.
If a rock hits me the game ends, and Space starts again. Show the score at the top left.
```

Or start with `/paprika3d:paprika-make` and the idea in a few words. It asks a few questions first, one at a time (what kind of thing it is, the controls, how you win and lose), writes your answers to a short file, `BRIEF.md`, and builds from it. [AI prompt to make a game](/guides/ai-prompt-to-make-a-game) goes through what to put in a request and why.

## What the agent does by itself

With the plugin installed, a skill called `threejs-game` loads by itself whenever Claude Code works on a three.js page, and it has the agent check its work: run the page with `open`, see it with `look`, and press the keys with `interact`. You do not ask for these. This is a game of the size that request describes, written for this page:

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Lane dodger</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:14px;left:18px;color:#fff;font:600 22px system-ui;text-shadow:0 1px 3px #000}</style></head>
<body>
<div id="hud">Dodged 0</div>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const LANES = [-2, 0, 2];                  // three lanes, 2 units apart
let lane = 1, block = { lane: 1, z: -30 }, dodged = 0, over = false;
const hud = document.getElementById('hud');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b5e0);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3, 6);
camera.lookAt(0, 0, -6);
scene.add(new THREE.HemisphereLight(0xffffff, 0x445533, 2.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(3, 8, 4);
scene.add(sun);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const road = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.2, 60), new THREE.MeshStandardMaterial({ color: 0x55575c }));
road.name = 'road';
road.position.set(0, -0.6, -24);
scene.add(road);
const player = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x3aa0ff }));
player.name = 'player';
scene.add(player);
const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7), new THREE.MeshStandardMaterial({ color: 0xc0503a, flatShading: true }));
rock.name = 'rock';
scene.add(rock);

function newRock() { block = { lane: Math.floor(Math.random() * 3), z: -30 }; }
function step(dt) {
  if (over) return;
  block.z += (12 + dodged * 0.5) * dt;    // units a second; a little faster after each dodge
  if (block.lane === lane && Math.abs(block.z) < 0.9) over = true;
  else if (block.z > 2) { dodged++; newRock(); }
  hud.textContent = over ? `Crashed! Dodged ${dodged}. Press Space to try again` : `Dodged ${dodged}`;
}

function act({ key, down = true }) {
  if (!down) return;
  if (key === 'ArrowLeft') lane = Math.max(0, lane - 1);
  if (key === 'ArrowRight') lane = Math.min(2, lane + 1);
  if (key === ' ' && over) { lane = 1; dodged = 0; over = false; newRock(); }
}
addEventListener('keydown', e => act({ key: e.key }));

let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  player.position.x += (LANES[lane] - player.position.x) * 0.3;   // slide to the lane over a few frames
  rock.position.set(LANES[block.lane], 0, block.z);
  rock.rotation.x = now / 200;
  renderer.render(scene, camera);
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.__game = {
  describe: () => ({ name: 'lane dodger', keys: { ArrowLeft: 'move one lane left', ArrowRight: 'move one lane right', ' ': 'try again after a crash' } }),
  observe: () => ({ lane, block: { lane: block.lane, z: +block.z.toFixed(2) }, dodged, over }),
  act,
  setState: s => { ({ lane = lane, dodged = dodged, over = over } = s); if (s.block) block = { ...block, ...s.block }; },
  subject: player,
};
</script>
</body></html>
```

The `window.__game` object at the end lets the tools read the game's state (which lane, where the rock is, the score) as plain values and set it up for a test; the skill asks the agent to add it.

These are the replies on that game, captured on 2026-10-30 on a Linux server with no graphics card, where Chrome draws in software. The folder path is shortened to `<project>`, and the `open` reply's lines about the `geo.js` and `fx.js` helper files it writes into the folder are left out.

```text
open {"url": "index.html", "cwd": "<project>"}

Opened http://127.0.0.1:36829/index.html in 0.2 s, paused at frame 0.
GPU: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver). A software renderer (no GPU): frame times here say nothing of a real GPU's.
Page text outside the canvas: 0 h1, 0 h2, 2 words
{"name":"lane dodger","keys":{"ArrowLeft":"move one lane left","ArrowRight":"move one lane right"," ":"try again after a crash"}}
Next: `look` to see it, then `interact` for each interaction the request names.

Run folder: <project>/paprika3d/runs/2026-10-30T19-39-54-746Z

look {}

Picture: <project>/paprika3d/runs/2026-10-30T19-39-54-746Z/look-1.png
Pixels: brightness 59%, colour saturation 31%, 0% near black, 0% blown out.
Hues: blue 71%, grey 29% of the frame; over the objects (30.6% of it): grey 93%, blue 7%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
Lighting: no tone mapping (renderer.toneMapping is NoToneMapping): bright colours clip to white; ACESFilmicToneMapping, AgXToneMapping or NeutralToneMapping avoid it, and ACES also mutes saturated colours, which a bright stylised look may not want.
Surface: "road" covers 29% with almost no detail (0 of 255): it reads as flat colour. Unless the user asked for flat colour, add texture, normal detail or lighting variation.
World's edge: 43% of the picture is background below the horizon, in [0, 208, 1279, 799], past the far end of the ground: extend the ground, keep the camera over it, or fade it out with scene.fog.
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Dodged 0" [18, 14, 123, 38].
Subject: player takes 2% of the picture [575, 494, 704, 655]; 1 of its 1 named parts show.
Stands out: subject brightness 50% against 38% around it, colour 76% against 7%, edge contrast 0.095.
This camera shows little of the subject: try other views with `look` camera, then move the page's own camera to the best (said once).
On screen (3):
road 29% [107, 255, 1172, 799] 60 × 6.5 units, along the view
player 2% [575, 494, 704, 655]
rock 0.056% [626, 260, 653, 285]
Never visible: none

interact {"steps":[{"state":{"block":{"lane":1,"z":-6}}},{"wait":45}],"expect":{"over":true}}

{"changed":{"block":{"z":-0.8},"over":true}}
Expect: over true ✓

interact {"steps":[{"key":" "},{"state":{"block":{"lane":1,"z":-6}}},{"key":"ArrowLeft"},{"wait":45}],"expect":{"over":false,"dodged":1}}

{"changed":{"lane":0,"block":{"lane":2,"z":-28.75},"dodged":1,"over":false}}
Expect: over false ✓ · dodged 1 ✓
```

The first `interact` puts a rock in the player's lane just ahead and waits: the game ends, as the request said it should. The second presses Space to start again after that crash, puts a rock in the same place, and moves one lane left: the rock passes and the score goes up by one.

## Which lines to read

You do not need to read every reply; the agent does. When you want to know where things stand, these are the lines that answer it:

- **`Errors so far:`** in an `open` reply lists errors the page raised. It is missing here because there were none.
- **`On screen`** lists each object by name with how much of the picture it covers, and **`Never visible`** names the ones that never appeared. Here all three are on screen, and the rock is small because it starts far down the road.
- **`Expect:`** with ✓ or ✗ is a rule of your game, checked by playing it. A ✗ is something the agent still has to fix.
- **Notes about the look**, such as `Surface:` and `World's edge:` here, say what a viewer would notice: the road is a flat grey strip and the sky shows on both sides of it. The agent can act on them; whether the game should look different is your call.
- **`Picture:`** is the path of the screenshot. Open it yourself to see what the agent saw.

## When something goes wrong

If the page stays blank, [html game not working](/guides/html-game-not-working) covers the first run. If it worked and a later change broke it, [vibe coding bugs](/guides/vibe-coding-bugs) is about keeping what works. For the measured results of an agent building three.js games with and without these tools, see [build a three.js game with an AI agent](/guides/ai-agent-build-threejs-game).

## What paprika3d does not do

It does not install Claude Code, Node or Chrome for you, and it does not write the game: Claude Code does. It does not decide whether your game is fun or looks the way you imagined; it reports what is on screen and what the keys did, and the rest is for you to play and say. The plugin's slash commands and automatic skill loading are Claude Code features; other coding agents get the same tools by adding its MCP server (the install page has the line).

## What to do next

Play the game yourself: double-click `index.html` in the folder. It loads three.js from the internet, so this works while you are online. Then ask for one change at a time, in your own words. [How long does it take to make a game with AI?](/guides/how-long-to-make-a-game-with-ai) is about what a session gets done, and [put your game online](/guides/put-your-game-online) is for when you want to share it.
