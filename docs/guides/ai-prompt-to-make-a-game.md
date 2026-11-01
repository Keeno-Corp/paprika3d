---
title: AI prompt to make a game: what to tell the agent so the three.js game comes out as you meant
phrase: ai prompt to make a game
description: What to type to get the game you imagined from an AI, with a prompt template to copy. The five parts that decide a build (what it is, the controls, how you win and lose, the look, what to leave out), a short request beside a full one, one request per change after that, and how the paprika3d plugin's paprika-make turns the answers into BRIEF.md and saved checks for a three.js game.
meta: An AI prompt to make a game in three.js, with a template to copy: the five parts that decide what gets built, and how to ask for changes.
intent: ai-prompt-to-make-a-game
queries:
  - "ai prompt to make a game"
  - "give me prompt to make a game"
  - "chatgpt prompt to make a game"
  - "Using Co-pilots ? Request for Prompts"
  - "What is the best prompt to make a game with AI?"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# AI prompt to make a game: what to tell the agent so the three.js game comes out as you meant

## The short answer

A prompt that gets you the game you imagined names five things: what the game is, the controls, how you win and how you lose, how it looks, and what to leave out. Anything you do not say, the AI decides for you, and its choice may not be yours. After the first version, ask for one change per request.

This works the same in a chat assistant such as ChatGPT and in a coding agent such as Claude Code (an AI that writes the files in a folder on your computer itself). The examples here build a small 3D game in the browser with three.js, a free JavaScript library that draws 3D graphics in a web page.

## A prompt template to copy

Fill in the brackets and keep the rest:

```text
Make a small 3D game with three.js in one HTML file.
What it is: [one sentence, e.g. "I collect gems in a garden before the time runs out"].
Controls: [the exact keys, e.g. "the arrow keys move me"].
How I win: [e.g. "5 gems"]. How I lose: [e.g. "30 seconds run out"]. After either: [e.g. "Enter plays again"].
On screen: [the score, a timer, lives].
Look: [the camera, colours, mood, e.g. "seen from above at an angle, a green lawn, an orange ball, purple gems"].
Leave out for now: [e.g. "menus, sound, levels, enemies"].
```

In a chat, add "so I can save it and open it by double-clicking"; [can I make a game with ChatGPT](/guides/can-i-make-a-game-with-chatgpt) covers saving and opening the file. In a coding agent, the file lands in your folder by itself.

## Why a short request builds the wrong thing

Here is a short request and a full one for the same idea:

```text
Short:
Make a game where you collect gems.

Full:
Make a small 3D game with three.js in one HTML file.
What it is: I am an orange ball in a garden, collecting purple gems before the time runs out.
Controls: the arrow keys move me in four directions.
How I win: 5 gems. How I lose: 30 seconds run out. After either: Enter plays again.
On screen: gems collected out of 5, and the seconds left, at the top left.
Look: seen from above at an angle, a green lawn and a light blue sky. Each gem bobs and turns.
Leave out for now: menus, sound, levels, enemies.
```

The short request leaves every decision open: 2D or 3D, keys or mouse, how many gems, whether there is a timer, whether you can lose at all, what the screen shows, what it looks like. The agent fills each gap with a guess, so two runs of the same short request can give two different games, and neither may be the one in your head. The full request leaves small things open (the size of the garden, the exact speed), which are easy to change later in one sentence.

The parts that matter most are the controls and the win and lose rules, because they decide what kind of game it is. The look matters next. "Leave out" saves the most trouble: without it, an agent may add a start menu, sound and three levels, which is more code to go wrong before the core game even works.

## A game that meets the full request

This is a game written for this page from the full request above:

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Gem garden</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:14px;left:18px;color:#fff;font:600 22px system-ui;text-shadow:0 1px 3px #000}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const GOAL = 5, TIME = 30, SPEED = 5, EDGE = 6;   // gems to win, seconds, units a second, half the garden's width
let player = { x: 0, z: 0 }, gem = { x: 3, z: -2 }, gems = 0, timeLeft = TIME, won = false, lost = false;
const held = new Set();
const hud = document.getElementById('hud');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8d8ea);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 11, 10);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x557744, 2.5));
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const lawn = new THREE.Mesh(new THREE.CircleGeometry(30, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x6fbf5a }));
lawn.name = 'lawn';
scene.add(lawn);
const hero = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), new THREE.MeshStandardMaterial({ color: 0xff8a3d }));
hero.name = 'player';
scene.add(hero);
const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.45), new THREE.MeshStandardMaterial({ color: 0x9b5cff, emissive: 0x30106a }));
crystal.name = 'gem';
scene.add(crystal);

const clamp = v => Math.max(-EDGE, Math.min(EDGE, v));
function step(dt) {
  if (won || lost) return;
  const dx = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
  const dz = (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0);
  player.x = clamp(player.x + dx * SPEED * dt);
  player.z = clamp(player.z + dz * SPEED * dt);
  if (Math.hypot(player.x - gem.x, player.z - gem.z) < 0.9) {
    gems++;
    gem = { x: Math.random() * 2 * EDGE - EDGE, z: Math.random() * 2 * EDGE - EDGE };
    if (gems >= GOAL) won = true;
  }
  timeLeft = Math.max(0, timeLeft - dt);
  if (timeLeft === 0 && !won) lost = true;
}
function restart() { player = { x: 0, z: 0 }; gem = { x: 3, z: -2 }; gems = 0; timeLeft = TIME; won = lost = false; }

function act({ key, down = true }) {
  if (key === 'Enter' && down && (won || lost)) restart();
  if (down) held.add(key); else held.delete(key);
}
addEventListener('keydown', e => act({ key: e.key }));
addEventListener('keyup', e => act({ key: e.key, down: false }));

let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  hero.position.set(player.x, 0.5, player.z);
  crystal.position.set(gem.x, 0.6 + Math.sin(now / 250) * 0.15, gem.z);
  crystal.rotation.y = now / 400;
  hud.textContent = won ? `You win! Press Enter to play again`
    : lost ? `Time's up: ${gems} of ${GOAL}. Press Enter to try again`
    : `Gems ${gems} of ${GOAL} · ${Math.ceil(timeLeft)} s left`;
  renderer.render(scene, camera);
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const round = p => ({ x: +p.x.toFixed(2), z: +p.z.toFixed(2) });
window.__game = {
  describe: () => ({ name: 'gem garden', keys: { ArrowLeft: 'hold to move left', ArrowRight: 'hold to move right', ArrowUp: 'hold to move away', ArrowDown: 'hold to move nearer', Enter: 'play again after a win or a loss' } }),
  observe: () => ({ player: round(player), gem: round(gem), gems, timeLeft: +timeLeft.toFixed(2), won, lost }),
  act,
  setState: s => {
    ({ gems = gems, timeLeft = timeLeft, won = won, lost = lost } = s);
    if (s.player) player = { ...player, ...s.player };
    if (s.gem) gem = { ...gem, ...s.gem };
  },
  subject: hero,
};
</script>
</body></html>
```

Each line of the request is somewhere in it: the goal and the timer are the two numbers at the top, the keys are in `step`, the win and the loss are its last lines, and "Enter plays again" is `restart`. When a request is clear, you can check the result against it line by line, and so can the agent.

## After the first version: one request per change

Play it, then ask for the single change you want most, in a sentence that says what you saw and what you want instead:

```text
Good: The gems are hard to see from this far up. Make them twice as big and give them a soft glow.
Good: When I pick up a gem, make the ball jump a little so I can feel it.
Too much at once: Make it better, add enemies, sound, a menu and three levels.
```

One change per request means that when something breaks, you know which change did it, and the agent has one thing to get right. When something is wrong, say what you saw ("the timer keeps counting after I win") rather than guessing at the code. If a change breaks something that worked, [vibe coding bugs](/guides/vibe-coding-bugs) is about getting back to the working version.

## In Claude Code: the questions are asked for you

With the paprika3d plugin for Claude Code, you can start with the idea in a few words and let the agent ask for the rest:

```text
/paprika3d:paprika-make a game where you collect gems in a garden
```

It asks a few questions, one at a time, with choices to pick from (what kind of thing it is, the controls, how you win and lose, pictures or games that inspire it), then writes your answers to `BRIEF.md`, a short file in your project that the build is checked against. A brief in that file's shape, filled in for this game:

```markdown
# Gem garden
## What it is
A small 3D game: an orange ball collects purple gems on a lawn before the time runs out.
## Must have
1. The arrow keys move the ball.
2. Touching a gem adds one and puts the next gem somewhere else.
3. Five gems win; then Enter plays again.
4. When the 30 seconds run out, the game is lost.
## References
## Inspirations and notes
Seen from above at an angle. No menus, sound or levels yet.
## Left to the builder
The garden's size and the ball's speed.
```

Each numbered "must have" can become a check: the agent plays the rule with `interact`, states what should be true afterwards with `expect`, and keeps it with `save`; `test` reruns every saved check. These are the replies on the game above, captured on 2026-10-30 on a Linux server with no graphics card (Chrome drawing in software); each `state` step sets the game up first, such as the ball beside a gem:

```text
interact {"steps":[{"state":{"player":{"x":0,"z":0},"gem":{"x":1.5,"z":0}}},{"key":"ArrowRight","frames":30}],"expect":{"gems":1},"save":"gem-adds-one"}

{"changed":{"player":{"x":2.5},"gem":{"x":-5.39,"z":-3.5},"gems":1,"timeLeft":29.48}}
Expect: gems 1 ✓
Saved check "gem-adds-one" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.

interact {"steps":[{"state":{"gems":4,"player":{"x":0,"z":0},"gem":{"x":1.5,"z":0}}},{"key":"ArrowRight","frames":30}],"expect":{"won":true},"save":"five-gems-win"}

{"changed":{"player":{"x":0.67},"gem":{"x":-5.39,"z":-3.5},"gems":5,"timeLeft":29.85,"won":true}}
Motion (player): travelled 0.667 units, it stopped at frame 8 and did not move again.
Expect: won true ✓
Saved check "five-gems-win" in game-tests.json (2 checks now); `test` reruns them all, each from a fresh reload.

interact {"steps":[{"state":{"timeLeft":0.5}},{"wait":40}],"expect":{"lost":true},"save":"time-up-loses"}

{"changed":{"timeLeft":0,"lost":true}}
Expect: lost true ✓
Saved check "time-up-loses" in game-tests.json (3 checks now); `test` reruns them all, each from a fresh reload.

test {}

✓ gem-adds-one
✓ five-gems-win
✓ time-up-loses
3 of 3 saved checks passed in 0.9 s
```

The ball stopped once the fifth gem won the game, which the `Motion` line shows. From then on, each change you ask for is checked against the same three rules, and the agent hears when a change breaks one. `BRIEF.md` is yours to edit: change a line in it and ask again, and the build follows the new line. paprika3d does not write your prompt and does not decide what your game should be; it asks the questions in Claude Code and checks the game against your answers. To install it, run the two commands on the [install page](/install) in a terminal, the text window where you type commands.

## What to do next

Write your own request with the template, keep it to one screen, and send it. Then play the result and write down the one change you want most. [How to make a game with Claude Code](/guides/make-a-game-with-claude-code) sets up a coding agent from nothing, and [what game should I make first](/guides/what-game-should-i-make-first) helps when you have not picked an idea yet.
