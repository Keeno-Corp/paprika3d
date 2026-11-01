---
title: How to add a game over screen and a restart to a three.js game
phrase: how to add a game over screen
description: How to add a game over screen and a restart button to a small three.js browser game: a state value for playing or over, lives that end the round, an HTML overlay with the score, one reset function that sets every value for the first round and every restart, the three restart mistakes (a second loop, listeners added again, a value left behind), and checks of the last hit and the restart with paprika3d's interact and look.
meta: How to add a game over screen and a restart to a three.js game: a state value, lives, an HTML overlay, and one reset function for every value.
intent: add-a-game-over-screen
queries:
  - "how to add game over screen"
  - "How Do You Restart the Game Fresh?"
  - "How to implement a restart button after game over?"
  - "How to create a game over screen for a basic HTML/JS game?"
  - "Restart game in THREE.js after Pausing"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to add a game over screen and a restart to a three.js game

A game over screen takes four pieces, and none of them is 3D:

1. **A state value** that says whether the round is being played or is over.
2. **A rule that ends the round**, such as lives running out, a timer reaching zero or one hit.
3. **An overlay**: a plain HTML panel over the game with "Game over", the score and a Restart button, shown when the round ends.
4. **One reset function** that sets every value the round uses. It runs when the page loads and again on every restart, so a restarted round is the same as the first one.

The fourth piece is the one the threads are about. The Phaser forum question "How Do You Restart the Game Fresh?" has thousands of views because a restart that sets values back by hand in a second place always misses one.

Two terms first. **three.js** is a JavaScript library that draws a 3D scene into a **canvas**, the rectangle on the page where the game appears. **HTML** is the rest of the page: text, buttons and panels, which can sit on top of the canvas.

## 1. A state value: playing or over

Keep one variable, here `over`, that starts `false`. The function that moves the game each frame checks it first and does nothing while the round is over:

```js
function step(dt) {
  if (over) return;                                      // the loop keeps drawing; the round stops
  // ...move the player and the rocks...
}
```

The loop that draws keeps running, so the scene stays visible behind the overlay, frozen where the round ended. A game with more phases (a pause, a level-complete screen) uses one value with several names, such as `phase = 'playing'`, and the same early return.

## 2. A rule that ends the round

In the game below, rocks fall and you dodge them. A rock that reaches you takes a life, and when `lives` reaches zero the round ends:

```js
if (lives <= 0) gameOver();
```

`gameOver()` sets `over` to `true`, writes the final score into the overlay and shows it. Ending the round in one function means every way to lose (lives, a timer, falling off the map) goes through the same door.

## 3. The overlay is HTML, not 3D

Text and buttons are easier as HTML over the canvas than as 3D objects: they stay sharp, they take CSS, and a button gets its click with no 3D picking code. The overlay is a `div` with `position: fixed` that covers the window, hidden until the round ends:

```html
<div id="over" hidden>
  <div style="font-size:48px">Game over</div>
  <div id="final"></div>
  <button id="again">Restart (R)</button>
</div>
```

One CSS trap catches nearly everyone: the `hidden` attribute stops hiding an element as soon as a CSS rule gives it a `display` value. A rule like `#over { display: flex }` shows the overlay from the first frame, so add `#over[hidden] { display: none }` beside it. The game below has that line, with a comment.

The score shown while playing, health bars and a minimap are covered in [the three.js minimap and game HUD guide](/guides/threejs-minimap-game-hud).

## 4. One reset function for the first round and every restart

Write every value the round uses in one function, `reset()`, and call it once when the page loads. The Restart button and the R key call the same function:

```js
function reset() {
  lives = 3; score = 0; over = false; fall = 4;          // fall: how fast rocks drop, in units per second
  player = { x: 0 };
  rocks = [{ x: -3, y: 9 }, { x: 0, y: 13 }, { x: 3, y: 17 }];
  overlay.hidden = true;
}
```

Because the first round also starts from `reset()`, a value that is missing from it shows up on the first play, not after the first game over. Three restart mistakes to avoid:

- **Starting a second loop.** A restart that calls `requestAnimationFrame(loop)` again adds another loop to the one already running. Every frame's work then runs once more for each restart, and a game that moves things a set amount per frame speeds up with every restart. Start the loop once, at the bottom of the page.
- **Adding listeners again.** A "start game" function that calls `addEventListener` adds one more listener each time it runs, so after two restarts one key press acts three times. Add listeners once, outside `reset()`.
- **Leaving a value behind.** The rock speed in this game rises as you score. A restart that resets lives and score but not `fall` starts round two at round one's final speed.

The other way to restart is `location.reload()`, which reloads the whole page. It is one line and always fresh, but it reloads every file and forgets everything kept in variables, such as the high score of this session; [saving the high score](/guides/save-the-high-score) keeps it in the browser so it survives a reload.

The R key is a one-shot control: it should act once per press, not keep restarting while held, so its handler skips `event.repeat`, the extra `keydown` events the keyboard sends while a key is held down.

## The game

Meteor dodge: move with the left and right arrows, dodge the falling rocks, and lose a life when one reaches you. Each rock that lands without hitting you scores one and makes the next ones fall a little faster. Save it as `index.html`, run `npm install three` in its folder, serve the folder (`python3 -m http.server 8000`) and open `http://localhost:8000`. If it stays blank, see [HTML game not working?](/guides/html-game-not-working); for smoother key handling, [how to make a character move in JavaScript](/guides/make-a-character-move-in-javascript).

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Meteor dodge</title>
<style>html,body{margin:0;overflow:hidden;background:#26304f}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#fff;font:600 20px system-ui}
#over{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;
  background:rgba(0,0,0,.6);color:#fff;font:600 22px system-ui}
#over[hidden]{display:none}            /* without this line, display:flex above would keep it on screen */
#over button{font:inherit;padding:8px 20px;cursor:pointer}</style></head>
<body>
<div id="hud"></div>
<div id="over" hidden>
  <div style="font-size:48px">Game over</div>
  <div id="final"></div>
  <button id="again">Restart (R)</button>
</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const held = new Set();
const hud = document.getElementById('hud'), overlay = document.getElementById('over');
let lives, score, over, fall, player, rocks;

// Every value a round uses is set here, and nowhere else: the first round and every restart start the same.
function reset() {
  lives = 3; score = 0; over = false; fall = 4;          // fall: how fast rocks drop, in units per second
  player = { x: 0 };
  rocks = [{ x: -3, y: 9 }, { x: 0, y: 13 }, { x: 3, y: 17 }];
  overlay.hidden = true;
}

function step(dt) {
  if (over) return;                                      // the loop keeps drawing; the round stops
  const dir = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
  player.x = Math.max(-5, Math.min(5, player.x + dir * 6 * dt));
  for (const rock of rocks) {
    rock.y -= fall * dt;
    if (rock.y < 0.9 && Math.abs(rock.x - player.x) < 0.8) { lives--; respawn(rock); }
    else if (rock.y < 0) { score++; fall += 0.1; respawn(rock); }
  }
  if (lives <= 0) gameOver();
}
function respawn(rock) { rock.x = Math.random() * 10 - 5; rock.y = 9 + Math.random() * 4; }
function gameOver() {
  over = true;
  document.getElementById('final').textContent = `Score ${score}`;
  overlay.hidden = false;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x26304f);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 4.5, 13);
camera.lookAt(0, 4, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x554466, 3));

const ground = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 3), new THREE.MeshStandardMaterial({ color: 0x6a6390 }));
ground.name = 'ground';
ground.position.y = -0.15;
scene.add(ground);
const ship = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 16), new THREE.MeshStandardMaterial({ color: 0x55ddaa }));
ship.name = 'player';
ship.position.y = 0.5;
scene.add(ship);
const rockMeshes = [0, 1, 2].map(() => {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45), new THREE.MeshStandardMaterial({ color: 0xcc6633, flatShading: true }));
  m.name = 'rock';
  scene.add(m);
  return m;
});

let last = null;
function loop(now) {
  requestAnimationFrame(loop);
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  ship.position.x = player.x;
  rocks.forEach((r, i) => rockMeshes[i].position.set(r.x, r.y, 0));
  hud.textContent = `Lives ${lives}   Score ${score}`;
  renderer.render(scene, camera);
}

function act({ key, down = true, repeat = false }) {
  if (key === 'KeyR' && down && !repeat && over) reset();  // one-shot: acts once per press
  if (down) held.add(key); else held.delete(key);
}
addEventListener('keydown', e => act({ key: e.code, repeat: e.repeat }));
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('blur', () => held.clear());
document.getElementById('again').addEventListener('click', () => reset());
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

reset();
requestAnimationFrame(loop);           // started once, here; a restart never starts a second loop

window.__game = {
  subject: 'player',
  describe: () => ({ name: 'meteor dodge', keys: { ArrowLeft: 'hold to move left', ArrowRight: 'hold to move right', KeyR: 'restart after game over' } }),
  observe: () => ({ lives, score, over, fall: +fall.toFixed(2), player: { x: +player.x.toFixed(2) }, rocks: rocks.map(r => ({ x: +r.x.toFixed(2), y: +r.y.toFixed(2) })) }),
  act,
  setState: (s) => {
    if (s.lives !== undefined) lives = s.lives;
    if (s.score !== undefined) score = s.score;
    if (s.fall !== undefined) fall = s.fall;
    if (s.player) player = { ...player, ...s.player };
    if (s.rocks) rocks = s.rocks.map(r => ({ ...r }));
    if (s.over === true) gameOver(); else if (s.over === false) { over = false; overlay.hidden = true; }
  },
};
</script>
</body></html>
```

The `window.__game` object at the end lets a test tool read the lives and score, press keys and set a moment up (one life left, a rock about to land). The game plays without it.

## Checking the end and the restart

A game over screen is tedious to test by hand: you have to lose a whole round every time you change it. paprika3d is a plugin for Claude Code (and an MCP server for other coding agents) that lets the agent set that moment up and play it. Install it in Claude Code with:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

`interact` takes a `{ state }` step that puts the game straight into a moment, here one life left with a rock just above the player, then plays frames and checks the result with `expect`; `save` keeps it as a check. These replies were captured on 2026-10-30 on the game above, on a Linux server with no GPU where Chrome draws in software; the `look` reply is cut to the lines about the overlay.

```text
interact {"steps": [{"state": {"lives": 1, "player": {"x": 0}, "rocks": [{"x": 0, "y": 1.5}, {"x": -4, "y": 9}, {"x": 4, "y": 12}]}}, {"wait": 20}], "expect": {"over": true, "lives": 0}, "save": "last-hit-ends-round"}

{"changed":{"lives":0,"over":true,"rocks":[{"x":-2.06,"y":11.18},{"x":-4,"y":8.33},{"x":4,"y":11.33}]}}
Expect: over true ✓ · lives 0 ✓
Saved check "last-hit-ends-round" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.

look {}

Pixels: brightness 9%, colour saturation 50%, 0% near black, 0% blown out; 100% of the picture changed since the last look. Dark: a viewer sees little.
Over the canvas: div#over "Game over Score 0 Restart (R)" shows over 100% of it (background rgba(0, 0, 0, 0.6)) and takes the clicks on 94% of it (listeners on the canvas miss them).
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Lives 0 Score 0" [16, 12, 195, 34].
```

The last hit ended the round, and `look` sees the overlay with its text and the darkened scene behind it; "Dark" here is the overlay's dimming, which is wanted. Its note that the overlay takes the clicks matters for a game with click controls on the canvas: while the overlay is up they stop working, which is right at game over and a bug if the overlay is still there after a restart.

Then the restart, by key and by the button (whose centre, 640 by 452 in the page, an `eval` read from the button's position):

```text
interact {"steps": [{"state": {"lives": 0, "score": 7, "fall": 4.7, "over": true}}, {"key": "KeyR", "frames": 1}], "expect": {"over": false, "lives": 3, "score": 0, "fall": 4}, "save": "restart-resets"}

{"changed":{"rocks":[{"x":-3,"y":8.93},{"x":0,"y":12.93},{"x":3,"y":16.93}]}}
Expect: over false ✓ · lives 3 ✓ · score 0 ✓ · fall 4 ✓
Saved check "restart-resets" in game-tests.json (2 checks now); `test` reruns them all, each from a fresh reload.

interact {"steps": [{"state": {"lives": 0, "score": 5, "over": true}}, {"mouse": "click", "x": 640, "y": 452}], "expect": {"over": false, "lives": 3, "score": 0}, "save": "restart-button"}

{"changed":{"rocks":[{"x":-3,"y":8.93},{"x":0,"y":12.93},{"x":3,"y":16.93}]}}
Expect: over false ✓ · lives 3 ✓ · score 0 ✓
Saved check "restart-button" in game-tests.json (3 checks now); `test` reruns them all, each from a fresh reload.

test {}

✓ last-hit-ends-round
✓ restart-resets
✓ restart-button
3 of 3 saved checks passed in 1.1 s
```

The restart check sets a late-round speed (`fall` 4.7) and expects it back at 4, so a later change that drops `fall` from `reset()` fails that check by name. `changed` lists the rocks alone because a saved check plays from a fresh reload and compares with the state the round started in, which the restart brought back. Keeping such checks as the game grows is the subject of [vibe coding bugs](/guides/vibe-coding-bugs).

What paprika3d does not do: it does not design the screen. Whether "Game over" should say something kinder, show a high score or wait a moment before the button appears is a choice for you, and the agent makes it when asked.
