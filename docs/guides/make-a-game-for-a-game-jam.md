---
title: How to make a game for a game jam: a three.js game in a weekend with an AI agent
phrase: how to make a game for a game jam
description: How to make a game for a game jam, your first one, with an AI agent: read the jam's rules on AI before anything else, turn the theme into one rule, cut the plan on the first evening, keep the game working every hour, and submit with time to spare. Shown on a three.js soap-bubble game for the theme "it grows", with paprika3d checking the rule, recording the GIF for the jam page and building unattended with paprika-loop.
meta: How to make a game for a game jam with an AI agent: the rules on AI, one rule from the theme, a weekend plan and a three.js example.
intent: make-a-game-for-a-game-jam
queries:
  - "how to make a game for a game jam"
  - "my first game jam"
  - "is vibe coding allowed in game jams"
  - "vibe coding game jam 2026"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a game for a game jam: a three.js game in a weekend with an AI agent

A game jam is an event where people each make a game in a fixed time, often a weekend, around a theme announced when it starts. Most jams are online, free and open to beginners, and many are hosted on itch.io, a site for small games where the jam page collects every entry. You finish with a game, a page for it, and players who try it and leave comments. For a first jam the goal is simple: submit something that works. This page covers what to do before the theme is out, how to turn a theme into a game, a weekend plan, and an example made for the theme "it grows".

## First, the jam's rules on AI

Every jam sets its own rules on AI, and they differ a lot. Some ban AI-made work of any kind. Some allow AI for code but not for art or music. Some ask you to list the tools you used. And some jams are made for AI-built games, often called vibe coding jams, where using an AI agent is the point. So before you plan anything, open the jam's page and read its rules: what counts as AI use, whether you must disclose it, and whether libraries and starter code are allowed. If the rules say nothing about AI, ask the host before the jam starts, on the jam's community page or its chat, rather than after you submit. A game disqualified for breaking a rule you did not read is the one outcome worse than not finishing.

Two more rules to look for: the deadline in your own time zone, and any limit on file size or on what the game may load from the internet. A three.js game, which uses the three.js library to draw 3D graphics in a web page, carries that library with it, so a jam with a strict size limit may not fit one.

## Turn the theme into one rule

A theme is a starting point, not a plan. Write down several ideas for it in ten minutes, then pick the one you can say as a single rule with a catch in it. For "it grows":

- A plant you water grows towards the light, but every leaf makes it heavier.
- A crowd follows you and grows with each person you meet, and the streets get narrower.
- **A soap bubble grows with each drop it catches, and the gaps ahead do not.** Drops are your score; size is the danger.

The third one is the game on this page. Its catch makes every drop a choice, which is what makes it a game rather than a demo. A rule like this also tells you what to leave out: no story, no levels, no shop, no menu.

## A weekend plan

- **Friday evening, after the theme:** pick the rule, write it in one sentence, and get the smallest version running: the bubble, one wall, one drop. Cut anything that does not serve the rule.
- **Saturday:** the whole loop. Score, losing, starting again, and the rule's catch working. By the evening it should be a game someone else could play without you explaining it.
- **Sunday morning:** make it look and sound better, and tune it so the first minute is fair.
- **Sunday afternoon:** upload, write the page, add a GIF, and submit hours before the deadline, not minutes. Uploads fail, and hosts get busy at the end.

The habit that keeps a jam game alive: after every change, play it once. A game that worked at lunch and is broken at the deadline is the most common way a jam entry is lost.

## The game: Bubble

The up and down arrow keys float the bubble. Walls with gaps come from the right; catching a drop scores a point and makes the bubble bigger, it slowly shrinks back while you skip drops, and touching a wall pops it. Space starts again. The whole game is one file:

```html
<!-- verify act=ArrowUp -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Bubble: a jam game for "it grows"</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:14px;left:18px;font:600 20px system-ui;color:#fff}
#over{position:fixed;inset:40% 0 auto;text-align:center;font:700 32px system-ui;color:#fff;display:none}</style></head>
<body>
<div id="hud"></div><div id="over">Pop! Press Space to float again</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The one rule: every drop you catch makes the bubble bigger, and the gaps do not grow.
const SPEED = 3;          // metres a second the walls come at you
const GROW = 0.12;        // radius added by one drop
const SHRINK = 0.03;      // radius lost each second, so skipping drops helps
const GAPS = [[0, 3.4], [1, 3], [-1, 3], [0.5, 2.6], [-0.8, 2.6], [0, 2.4]];   // each wall's gap: centre and height
const SPACING = 6, WALL_W = 0.6, TOP = 3.5, START = 0.45;
const held = new Set();
let y, r, score, passed, over, walls, drops;

function act({ key, down = true }) {
  down ? held.add(key) : held.delete(key);
  if (down && key === 'Space' && over) reset();
}
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.code }); });
addEventListener('keyup', e => act({ key: e.code, down: false }));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2b4162);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 9);
scene.add(new THREE.HemisphereLight(0xffffff, 0x99bbaa, 2.5));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-3, 5, 6);
scene.add(sun);
const bubble = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), new THREE.MeshStandardMaterial({ color: 0xd6f3ff, roughness: 0.1, transparent: true, opacity: 0.75 }));
bubble.name = 'bubble';
bubble.position.x = -4;
scene.add(bubble);

const wallMat = new THREE.MeshStandardMaterial({ color: 0x6a994e }), dropMat = new THREE.MeshStandardMaterial({ color: 0x7ae7ff });
function makeWall(i) {
  const [gy, gh] = GAPS[i % GAPS.length];
  const top = new THREE.Mesh(new THREE.BoxGeometry(WALL_W, TOP - gy - gh / 2, 1), wallMat);
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(WALL_W, gy - gh / 2 + TOP, 1), wallMat);
  top.position.y = (TOP + gy + gh / 2) / 2;
  bottom.position.y = (gy - gh / 2 - TOP) / 2;
  const wall = new THREE.Group();
  wall.name = 'wall';
  wall.add(top, bottom);
  wall.position.x = 4 + i * SPACING;
  wall.userData = { gy, gh, i };
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), dropMat);
  drop.name = 'drop';
  drop.position.set(wall.position.x - SPACING / 2, gy, 0);   // halfway to the wall, at its gap
  scene.add(wall, drop);
  walls.push(wall);
  drops.push(drop);
}

function reset() {
  for (const o of [...(walls ?? []), ...(drops ?? [])]) scene.remove(o);
  y = 0; r = START; score = 0; passed = 0; over = false; walls = []; drops = [];
  for (let i = 0; i < 4; i++) makeWall(i);
}
reset();

function step(dt) {
  if (over) return;
  if (held.has('ArrowUp')) y += 4 * dt;
  if (held.has('ArrowDown')) y -= 4 * dt;
  r = Math.max(START, r - SHRINK * dt);   // never smaller than at the start
  y = Math.max(-TOP + r, Math.min(TOP - r, y));
  for (const o of [...walls, ...drops]) o.position.x -= SPEED * dt;
  for (const drop of drops) {
    if (drop.visible && Math.hypot(drop.position.x - bubble.position.x, drop.position.y - y) < r + 0.2) {
      drop.visible = false;
      r += GROW;
      score++;
    }
  }
  for (const wall of walls) {
    const { gy, gh } = wall.userData;
    const inside = Math.abs(wall.position.x - bubble.position.x) < WALL_W / 2 + r;
    if (inside && (y + r > gy + gh / 2 || y - r < gy - gh / 2)) over = true;   // touched the wall: pop
    if (!wall.userData.behind && wall.position.x < bubble.position.x - WALL_W / 2 - r) { wall.userData.behind = true; passed++; }
  }
  if (walls[0].position.x < -10) {   // the oldest wall is behind: replace it with a new one at the end
    scene.remove(walls.shift(), drops.shift());
    makeWall(walls.at(-1).userData.i + 1);
  }
}

const hud = document.getElementById('hud'), overEl = document.getElementById('over');
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  bubble.position.y = y;
  bubble.scale.setScalar(r);
  bubble.visible = !over;
  hud.textContent = `Drops: ${score} · Walls passed: ${passed}`;
  overEl.style.display = over ? 'block' : 'none';
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'bubble', theme: 'it grows', units: 'metres', keys: { ArrowUp: 'float up', ArrowDown: 'float down', Space: 'float again after a pop' } }),
  observe: () => ({ y: +y.toFixed(2), r: +r.toFixed(2), score, passed, over }),
  act,
  setState: s => { y = s.y ?? y; r = s.r ?? r; score = s.score ?? score; passed = s.passed ?? passed; over = s.over ?? over; },
  subject: 'bubble',
};
</script>
</body></html>
```

The settings at the top (`SPEED`, `GROW`, `SHRINK` and the list of gaps) are what you tune on Sunday morning. To play it on your own computer, serve the folder with a local web server (a small program that shows a folder as a website); [HTML game not working](/guides/html-game-not-working) explains why double-clicking the file shows a blank page.

## What to ask your AI agent on Friday evening

An AI coding agent (an assistant such as Claude Code that writes and edits the files in your project folder) can have the first version running within the evening. Give it the rule and the smallest version, nothing more:

```text
Game jam, theme "it grows". Make a three.js game in one index.html file.
The rule: a soap bubble floats on the left; walls with gaps come from the right.
Up and down arrows move it. Catching a drop makes it bigger and scores a point,
it slowly shrinks back to its starting size, and touching a wall pops it. Space starts again.
Put the speeds and the sizes as settings at the top.
Then play it and tell me whether a drop makes the bubble grow and a big bubble pops at a wall.
```

Each later request is one change, followed by "play it again": a score that counts walls, a pop sound, a gentler first wall. [How to vibe code a game](/guides/how-to-vibe-code-a-game) explains this rhythm of one change and one check.

## Let the agent check the rule and make the GIF

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens a game in a hidden Chrome browser so the agent can play it and see the result. In a jam that saves you the time spent describing bugs. `interact` plays frames on the game's clock, and `trace` follows a value frame by frame; here the bubble catches the first drop and shrinks back after it:

```text
interact {"steps": [{"wait": 200}], "trace": ["r", "score"], "expect": {"score": 1, "over": false}}

{"changed":{"r":0.51,"score":1,"passed":1}}
r: 0.45 → peak 0.57 at frame 87 → 0.51 at frame 198; first changed at frame 87
score: 0 → 1 at frame 87; first changed at frame 87
Expect: score 1 ✓ · over false ✓
```

The other half of the rule: a fresh run (Space after a pop starts one) with a bubble too big for the first gap, played until it pops:

```text
interact {"steps": [{"state": {"over": true}}, {"key": "Space"}, {"state": {"r": 1.8}}, {"until": {"over": true}, "max": 240}], "expect": {"passed": 0}}

{"changed":{"r":1.86,"passed":0,"over":true}}
until: over == true held at frame 117
Expect: passed 0 ✓
```

It popped at the first wall, two seconds in, after catching the drop on the way. A jam page wants a clip that shows the game in a few seconds, and `interact` with `record` plays in real time and saves one as a GIF:

```text
interact {"steps": [{"wait": 200}], "record": true, "expect": {"score": 1, "passed": 1, "over": false}}

{"changed":{"r":0.51,"score":1,"passed":1}}
Expect: score 1 ✓ · passed 1 ✓ · over false ✓
Recorded 3.37 s in real time: <project>/paprika3d/runs/2026-10-31T07-35-34-436Z/clip-1.gif (GIF, 149 KB, 480 × 300, 54 frames from 54 screencast frames, each shown for its real time); four moments of it: <project>/paprika3d/runs/2026-10-31T07-35-34-436Z/clip-1.png.
The clock is paused again where the play ended.
```

While writing this page, the first clip also showed a fault in the counter: "Walls passed" went up when an old wall was recycled off screen, a couple of seconds after the bubble got through. The game above counts a wall as soon as it is behind the bubble.

### Building while you sleep

paprika3d's `paprika-loop` builds for a time you set, without you. In Claude Code:

```text
/paprika3d:paprika-loop the bubble game in this folder: smoother movement, a start screen, sounds for a catch and a pop, walls that get closer together over time, for 3 hours
```

It asks a few questions first and writes the answers as a brief, then each round a fresh session improves the game and a separate one scores it against the brief, keeping the round that scored highest. [How long does it take to make a game with AI?](/guides/how-long-to-make-a-game-with-ai) explains the loop in more detail. Two cautions for a jam. Use it when the jam allows AI-written code, and say so in your submission if the rules ask. And the judge scores your brief, not fun: play the result in the morning and keep what you like.

These replies were captured on 2026-10-31 on a machine with no graphics card, where Chrome draws in software; the recording's frame times line is left out. paprika3d does not pick your idea, judge whether the game is fun or submit it to the jam. To add it to Claude Code (it needs Google Chrome and Node.js):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Submitting

On itch.io, upload the game as an HTML project the way [how to put your game online](/guides/put-your-game-online) shows: a zip with `index.html` at its top, played in the browser. Then open the jam's page, use its button to submit a project, and choose your game. On the game's page, say the rule in a sentence, list the controls, add the GIF and a screenshot, and state the AI tools you used if the rules ask. Open the page in a private browser window to check that it plays for someone who is not logged in.

Many jams then have a voting period where entrants play and rate each other's games. Play some, leave kind and specific comments, and read yours: it is feedback from players who know what a jam asks of a game.

## What to do next

- Make catching and popping feel better: [how to make a game feel good](/guides/make-a-game-feel-good).
- Add the sounds without any audio files: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Keep the high score between plays: [save the high score](/guides/save-the-high-score).
- Not sure what kind of game to bring to your next jam: [what game should I make first?](/guides/what-game-should-i-make-first)
