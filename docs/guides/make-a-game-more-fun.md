---
title: How to make a game more fun: challenge that grows, tested by playing a three.js game
phrase: how to make a game more fun
description: How to make a game more fun when it works but feels boring or too easy: a visible goal, challenge that grows a little each round, a quick fair retry and a record to beat, shown on a small three.js whack-a-mole game whose moles stay up less each round; the prompt to give an AI agent, and how the agent checks that a player of a given speed can still win, with simulated players in paprika3d's eval, the hit's reaction with feel, and the last round kept winnable by a saved interact check.
meta: How to make a game more fun: a goal, challenge that grows each round and a check that a person can still win, on a three.js whack-a-mole game.
intent: make-a-game-more-fun
queries:
  - "how to make a game more fun"
  - "how to make a game more difficult"
  - "how to make a whack a mole game"
  - "Mathematics of difficulty acceleration in endless runners"
  - "Approaching the Fun Factor in Game Design"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a game more fun: challenge that grows, tested by playing a three.js game

Nobody can measure fun, but when a game works and still feels boring, the cause can often be named. Check your game against this list, and fix the first thing it lacks:

1. **A goal the player can see.** "Clear 8 rounds", "reach the flag", "survive two minutes". Without one, the player has no reason to try harder.
2. **Challenge that grows.** The start is easy enough to learn on, and each round asks a little more. A game that stays the same gets boring; one that jumps from easy to impossible feels unfair.
3. **Something that depends on the player.** Their speed, their aim, their choices. If the result is the same whatever they do, there is nothing to get better at.
4. **An answer to every action.** A hit squashes, flashes and counts on the same frame. [How to make a game feel good](/guides/make-a-game-feel-good) covers this part.
5. **A fair loss, a quick retry, and something to beat.** Losing should show how close the player got, and starting again should take one key.
6. **Something new now and then.** A golden mole worth three, a mole you must not hit, a new enemy in round 5.

This page works through points 1, 2 and 5 on a small whack-a-mole game made with three.js (a JavaScript library that draws 3D scenes in a web page), then shows how to check the part that is easy to break while tuning: whether the game is still possible to win once it is hard.

## Make it harder a little at a time

The difficulty of a game is a few numbers, and making it grow means changing them as the player goes. In whack-a-mole the main one is how long a mole stays up. The game multiplies it by the same factor each round:

```js
const upTime = round => 1.2 * 0.88 ** (round - 1);   // seconds a mole stays up: 1.2 in round 1, about 0.49 in round 8
```

Multiplying, rather than taking away a fixed amount, makes every round feel about as much harder as the last, and it never reaches zero. A Stack Exchange question asks for the mathematics of difficulty acceleration in endless runners, and this is one common shape for it: a starting value, a growth factor per level or per minute, and a limit it never passes. Other numbers you can grow the same way: the gap between moles, two moles up at once, fewer misses allowed. Change one at a time, so you know which change made the game better or worse.

If your game has levels rather than rounds, the same idea applies level by level; [how to make levels in a game](/guides/make-levels-in-a-game) shows how to write levels as data so each can ask a little more.

## Can a person still win?

Every growing curve has to stop somewhere a person can still reach. Pick how quick you expect your players to be, as a number: here, a player who needs 0.45 seconds to see a mole and hit it. That number is your choice for your audience, not a fact about people; a game for young children needs a slower one. Then check that the hardest round gives that player enough time. You can work it out by hand for one number, but a simple simulated player answers it for the whole game at once, as the testing section below does.

Then play it yourself, and watch someone else play it without helping them. No test tells you whether a game is fun; it can tell you whether it is possible, and that is the part that is easy to break by accident while tuning.

## A reason to play again

When the game ends, say what the player reached: "Out of misses in round 6. Record: round 7." A record turns a loss into a target. R starts again at once, with no menu in the way. Rounds are short, so trying again costs seconds. Keeping the record after the page closes takes a few lines, in [how to save the high score](/guides/save-the-high-score).

## The game

Whack a mole: moles pop up in nine holes, six per round for eight rounds, and stay up a little less each round. Click a mole, or press the keys 1 to 9 (the holes left to right, top to bottom). Three misses end the game. Save it as `index.html`, run `npm install three` in its folder (npm comes with Node.js), serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Whack a mole</title>
<style>html,body{margin:0;overflow:hidden;background:#9ccf6a}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#21310f;font:600 20px system-ui}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The difficulty: a mole stays up a little less each round. These numbers are the whole curve.
const ROUNDS = 8, MOLES_PER_ROUND = 6, MAX_MISSES = 3;
const upTime = round => 1.2 * 0.88 ** (round - 1);   // seconds a mole stays up: 1.2 in round 1, about 0.49 in round 8
const GAP = 0.35;                                    // seconds between one mole and the next

let round, shown, hits, misses, mole, moleAge, wait, over, won, record = 0, flash = 0, lastHole = -1;
function reset() {
  round = 1; shown = 0; hits = 0; misses = 0; mole = null; moleAge = 0; wait = GAP; over = false; won = false;
}

function step(dt) {
  flash = Math.max(0, flash - dt);
  if (over || won) return;
  if (mole === null) {                               // between moles
    wait -= dt;
    if (wait > 0) return;
    if (shown === MOLES_PER_ROUND) {                 // the round is done
      if (round === ROUNDS) { won = true; record = ROUNDS; return; }
      round++; shown = 0;
    }
    let hole;
    do hole = Math.floor(Math.random() * 9); while (hole === lastHole);   // never the same hole twice in a row
    mole = lastHole = hole; moleAge = 0; shown++;
    return;
  }
  moleAge += dt;
  if (moleAge >= upTime(round)) {                    // too slow: a miss
    mole = null; wait = GAP; misses++;
    if (misses === MAX_MISSES) { over = true; record = Math.max(record, round); }
  }
}

function whack(hole) {
  if (over || won || hole !== mole) return;
  hits++; mole = null; wait = GAP; flash = 0.15;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ccf6a);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 9, 7);
camera.lookAt(0, 0, 0.3);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x445522, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(3, 8, 5);
scene.add(sun);
const board = new THREE.Mesh(new THREE.BoxGeometry(7, 0.4, 7), new THREE.MeshStandardMaterial({ color: 0x7a5a3a }));
board.name = 'board';
board.position.y = -0.2;
scene.add(board);
const holes = [], moles = [];
for (let i = 0; i < 9; i++) {
  const x = (i % 3 - 1) * 2, z = (Math.floor(i / 3) - 1) * 2;
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.05, 24), new THREE.MeshStandardMaterial({ color: 0x2a1c10 }));
  hole.name = `hole${i + 1}`; hole.position.set(x, 0.01, z); hole.userData.hole = i;
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.5, 4, 12), new THREE.MeshStandardMaterial({ color: 0x8b5a2b }));
  m.name = `mole${i + 1}`; m.position.set(x, -1, z); m.userData.hole = i;
  scene.add(hole, m);
  holes.push(hole); moles.push(m);
}

let last = null;
const hud = document.getElementById('hud');
function loop(t) {
  requestAnimationFrame(loop);
  step(last === null ? 1 / 60 : Math.min((t - last) / 1000, 0.1));
  last = t;
  moles.forEach((m, i) => {
    const target = i === mole ? 0.45 : -1;
    m.position.y += (target - m.position.y) * 0.5;   // rises and sinks over a few frames
    const k = i === lastHole ? flash / 0.15 : 0;     // 1 on the frame of a hit, easing back to 0
    m.scale.set(1 + 0.3 * k, 1 - 0.5 * k, 1 + 0.3 * k);   // squashed, then back to its shape
    m.material.color.set(k > 0 ? 0xff4040 : 0x8b5a2b);
  });
  hud.textContent = won ? `You cleared all ${ROUNDS} rounds! R to play again`
    : over ? `Out of misses in round ${round}. Record: round ${record}. R to try again`
    : `Round ${round} of ${ROUNDS}   Hits ${hits}   Misses ${misses} of ${MAX_MISSES}   Record: round ${record}`;
  renderer.render(scene, camera);
}

const KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9'];
function act({ key, down = true, repeat = false }) {
  if (!down || repeat) return;
  if (KEYS.includes(key)) whack(KEYS.indexOf(key));
  if (key === 'KeyR' && (over || won)) reset();
}
addEventListener('keydown', e => act({ key: e.code, repeat: e.repeat }));
const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
addEventListener('pointerdown', e => {               // a click on a mole or its hole whacks that hole
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  const hit = ray.intersectObjects([...moles, ...holes])[0];
  if (hit) whack(hit.object.userData.hole);
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
reset();
requestAnimationFrame(loop);

window.__game = {
  subject: () => mole === null ? 'board' : `mole${mole + 1}`,
  describe: () => ({ name: 'whack a mole', keys: { Digit5: 'whack the middle hole (Digit1 to Digit9: the holes, left to right, top to bottom)', KeyR: 'play again' } }),
  observe: () => ({ round, upTime: +upTime(round).toFixed(3), shown, hits, misses, mole, moleAge: +moleAge.toFixed(3), over, won, record }),
  act,
  setState: (s) => {
    if (s.round !== undefined) round = s.round;
    if (s.shown !== undefined) shown = s.shown;
    if (s.hits !== undefined) hits = s.hits;
    if (s.misses !== undefined) misses = s.misses;
    if (s.over !== undefined) over = s.over;
    if (s.won !== undefined) won = s.won;
    if (s.record !== undefined) record = s.record;
    if (s.mole !== undefined) { mole = s.mole; moleAge = s.moleAge ?? 0; if (mole !== null) lastHole = mole; }
  },
};
</script>
</body></html>
```

The difficulty is the four constants and `upTime` at the top; nothing else in the game knows how hard it is. `step` pops moles and counts misses, `whack` counts hits and starts the squash and flash, and the loop draws. `window.__game` at the end lets a test tool read the round, the mole and its age, and set a moment up; the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes and edits your project's files) can tune a game you already have. Ask it to name the numbers first, then to grow them and test the result:

```text
My three.js game works but gets boring. List every number that sets how hard
it is, and put them together at the top of the file. Then add rounds: show
the round and a goal on screen, and make the game harder each round by
multiplying one of those numbers, with a limit. When I lose, show how far I
got and my record, and let R restart at once. Then check that a player who
needs 0.45 seconds to react can still win the last round.
```

## Let the agent play it at different speeds

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that runs the game in a hidden Chrome browser so the agent can play and measure it. Install it in Claude Code by running these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The replies below were captured on 2026-10-31 on a server with no graphics card where Chrome draws in software.

`eval` runs JavaScript inside the game, and code in it that waits for a frame moves the game's clock on by one frame. That is enough to write a simulated player: one that sees each mole and presses its key a fixed time after it pops up. On the first version of this game, where each round multiplied the time by 0.85 instead of 0.88:

```js
const upTime = round => 1.2 * 0.85 ** (round - 1);   // the first version: about 0.38 in round 8
```

the 0.45-second player answered:

```text
eval {"code":"window.play = async reaction => {   // a player who hits each mole `reaction` seconds after it pops up\n  const g = window.__game;\n  g.setState({ round: 1, shown: 0, hits: 0, misses: 0, over: false, won: false, mole: null });\n  while (!g.observe().over && !g.observe().won) {\n    await new Promise(r => requestAnimationFrame(r));\n    const s = g.observe();\n    if (s.mole !== null && s.moleAge >= reaction) g.act({ key: `Digit${s.mole + 1}` });\n  }\n  const { won, round, hits, misses } = g.observe();\n  return { reaction, won, round, hits, misses };\n};\nreturn play(0.45);"}

{"reaction":0.45,"won":false,"round":8,"hits":42,"misses":3}
(the code awaited the paused clock, so the harness stepped it 2157 frames, 35.95 s of game time, without drawing, until the code finished)
```

Every mole of the first seven rounds hit, then three misses in a row in round 8: the last round was out of reach for that player, however well they played. "Too hard in round 8" became a measured fact instead of a feeling. With 0.88, the game above, the same player wins, and a slower one still finds the limit:

```text
eval {"code":"window.play = async reaction => { ... the same player ... }; return play(0.45);"}

{"reaction":0.45,"won":true,"round":8,"hits":48,"misses":0}
(the code awaited the paused clock, so the harness stepped it 2331 frames, 38.85 s of game time, without drawing, until the code finished)

eval {"code":"return play(0.6);"}

{"reaction":0.6,"won":false,"round":7,"hits":36,"misses":3}
(the code awaited the paused clock, so the harness stepped it 2202 frames, 36.70 s of game time, without drawing, until the code finished)
```

(The first of these two calls was the full code shown above, with `play(0.45)`; it is shortened here.) A 0.6-second player clears six rounds and runs out in round 7, so the game keeps a challenge for slower players without shutting out quicker ones.

`feel` plays an input and lists what reacted on screen. Here a `{ state }` step puts a mole up in the middle hole, and key 5 hits it:

```text
feel {"steps":[{"state":{"mole":4,"moleAge":0.2}},{"key":"Digit5","frames":1}]}

Watched the steps' 1 frames and 45 frames after them, counted from the first step.
Moved during the steps: mole5 0.36 units.
Scale pops (scale changed over 2+ frames and came back): 1 (mole5 at frame 2).
Smooth moves (a new position on 3+ consecutive frames): 2 (mole5, mole6).
Colour flashes (colour, emissive or a page overlay's opacity changed and came back): 1 (mole5 at frame 1).
No change in: camera (no shake), teleports, spawns, removals.
HUD text: changed in one frame.
Sounds started: 0.
State: shown 0 → 1, hits 0 → 1, mole 4 → 5, moleAge 0.22 → 0.4.
```

The hit mole squashes, flashes red and sinks, the score changes on the same frame, and the next mole rises. An earlier version of the squash snapped on and off with no easing, and `feel` listed "scale (no pops)" under "No change in" for it; easing it back over 0.15 seconds made it a pop. "Sounds started: 0" is true too: this game is silent, and [how to make sound effects for a game](/guides/make-sound-effects-for-a-game) adds a sound to each hit.

Last, a check that keeps the last round winnable. `interact` with `expect` checks a state, and `save` keeps it so `test` reruns it after every later change:

```text
interact {"steps":[{"state":{"round":8}}],"expect":{"upTime":[0.45,2]},"save":"last-round-winnable"}

{"changed":{"round":8,"upTime":0.49}}
Expect: upTime 0.49 ✓
Saved check "last-round-winnable" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

If a later edit speeds up the curve past what a 0.45-second player can do, that check fails and says so.

What paprika3d does not do: it does not judge fun, and it cannot tell you whether your goal is interesting or your game is too long. The simulated player is code the agent writes for this game, and it hits every mole at exactly the same delay and never clicks the wrong hole; a person is less steady, so leave room between the hardest round and the speed you chose.

## Next steps

- Make every hit answer on the same frame: [how to make a game feel good](/guides/make-a-game-feel-good).
- A screen for losing, with a retry: [how to add a game over screen](/guides/add-a-game-over-screen).
- Keep the record between visits: [how to save the high score](/guides/save-the-high-score).
- Levels that each teach one new thing: [how to make levels in a game](/guides/make-levels-in-a-game).
- Night falling as a deadline, a different kind of pressure: [how to make an inventory in a game](/guides/make-an-inventory-in-a-game).
