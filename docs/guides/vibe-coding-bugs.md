---
title: Vibe coding bugs: keep the AI from breaking what already worked in a three.js game
phrase: vibe coding bugs
description: Why a game made by vibe coding works, then breaks a little more with each fix, and the habit that stops it, shown on a small three.js game where adding a dash quietly removes the walls: one change per request, a list of what works replayed after every change, a saved copy of each working version, and with paprika3d the list kept as checks (interact with expect and save, test, the after-edit hook, look with save and compare) that name the feature a change broke.
meta: Vibe coding bugs: why each AI fix breaks something that worked in your three.js game, and how saved checks name the feature a change broke.
intent: vibe-coding-bugs
queries:
  - "vibe coding bugs"
  - "vibe coding bug fix"
  - "ai ruined my code"
  - "When vibe coding turns into an unfixable mess"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# Vibe coding bugs: keep the AI from breaking what already worked in a three.js game

**Vibe coding** is making a program by describing what you want to an AI and running what it writes, mostly without reading the code. For a small game it works well at the start. Then a pattern sets in that the OpenAI forum thread "When vibe coding turns into an unfixable mess" describes: you ask for one new thing, it arrives working, and something that worked yesterday is gone. You ask for a fix, and a third thing breaks. After a few rounds nobody, you or the AI, knows which version was the good one.

None of this means the AI got worse or the game is cursed. It has one cause and one habit that stops it.

## Why each fix breaks something else

An AI answers a request by writing code, and it often rewrites a whole function or a whole file to add one feature. A rewrite keeps what the AI was thinking about and can drop a line that did a quiet job somewhere else: the line that stops the player at a wall, the line that resets the score, the line that lets the game restart. Nothing in the new feature needs that line, so nothing about the new feature looks wrong.

Then you test the new feature, it works, and you move on. Nobody replays the old features after the change, so the broken one surfaces three requests later, when it is no longer clear which change broke it. The word for this is a **regression**: something that worked and stopped working after a change.

So the cure is not a smarter prompt. It is replaying what already worked, every time, and being able to go back.

## The habit, with no tools at all

1. **One change per request.** "Add a dash on Space" is one change. "Add a dash, a timer, sounds and a new level" is four, and when one of them breaks something you cannot tell which.
2. **Keep a list of what works, and replay it after every change.** Write each feature down as something to try, with what should happen: "hold the right arrow: the player walks right", "walk onto the coin: the count goes up by one", "walk into the right wall: the player stops". After every answer from the AI, try every line, not just the new one. It takes a minute while the game is small.
3. **Save each working version.** The plain way is to copy the folder (`game-v3`) before the next request. The better way is **git**, a program that keeps every saved version of a folder so you can see what changed and go back; ask your agent to "commit this version with git" each time the list passes, and to "show me what changed since the last commit" when it stops passing.
4. **When something breaks, say which line of the list failed and since when.** "Walking into the right wall no longer stops the player. It worked before the dash change. Fix that and change nothing else." A fix request that names the feature and the change gets a small fix; "it's broken, fix it" gets another rewrite.

If the game never ran in the first place, that is a different problem, covered in [HTML game not working?](/guides/html-game-not-working).

## A game, and the change that broke it

A coin yard: move with the arrow keys, pick up the coin, and the walls keep you in. Its list had three lines: walks right, a coin scores, the walls stop you. Then came the request "add a dash: press Space to dash in the direction I'm moving". The answer rewrote the movement code, and the dash worked. Here is what it changed in the movement:

```diff
 function step(dt) {
   const dx = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
   const dz = (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0);
-  player.x += dx * SPEED * dt;
-  player.z += dz * SPEED * dt;
-  player.x = Math.max(-EDGE, Math.min(EDGE, player.x));   // the walls
-  player.z = Math.max(-EDGE, Math.min(EDGE, player.z));
+  if (dx || dz) facing = { x: dx, z: dz };
+  const speed = dashLeft > 0 ? SPEED * 3 : SPEED;          // a dash: three times the speed for a moment
+  const [mx, mz] = dashLeft > 0 ? [facing.x, facing.z] : [dx, dz];
+  dashLeft = Math.max(0, dashLeft - dt);
+  player.x += mx * speed * dt;
+  player.z += mz * speed * dt;
```

The two wall lines are gone. Walking and the coin still work, and the walls still stand on screen, but the player now walks through them. You find it when you walk into a wall, which the dash request gave you no reason to do. The same answer also raised the camera to show more of the yard, a change to the picture nobody asked for.

The fix is the two lines put back after the new movement. This is the game with the dash and the walls both working. Save it as `index.html`, run `npm install three` in its folder, and serve the folder (`python3 -m http.server 8000`, then open `http://localhost:8000`):

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Coin yard</title>
<style>html,body{margin:0;overflow:hidden;background:#20302a}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#fff;font:600 20px system-ui}</style></head>
<body>
<div id="hud">Coins 0</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const SPEED = 4, EDGE = 4;            // units per second; the player stops at ±EDGE, inside the walls
const held = new Set();
const hud = document.getElementById('hud');
let coins = 0, player = { x: 0, z: 0 }, coin = { x: 2, z: -1 };
let facing = { x: 1, z: 0 }, dashLeft = 0;   // seconds of dash left

function step(dt) {
  const dx = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
  const dz = (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0);
  if (dx || dz) facing = { x: dx, z: dz };
  const speed = dashLeft > 0 ? SPEED * 3 : SPEED;          // a dash: three times the speed for a moment
  const [mx, mz] = dashLeft > 0 ? [facing.x, facing.z] : [dx, dz];
  dashLeft = Math.max(0, dashLeft - dt);
  player.x += mx * speed * dt;
  player.z += mz * speed * dt;
  player.x = Math.max(-EDGE, Math.min(EDGE, player.x));   // the walls, for a dash too
  player.z = Math.max(-EDGE, Math.min(EDGE, player.z));
  if (Math.hypot(player.x - coin.x, player.z - coin.z) < 0.7) {
    coins++; hud.textContent = `Coins ${coins}`;
    coin = { x: Math.round(Math.random() * 6 - 3), z: Math.round(Math.random() * 6 - 3) };
  }
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x20302a);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 11, 6);
camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x445544, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(3, 8, 4);
scene.add(sun);

const mesh = (geometry, color, name) => {
  const m = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }));
  m.name = name; scene.add(m); return m;
};
mesh(new THREE.BoxGeometry(10, 0.2, 10), 0x3d6b4f, 'floor').position.y = -0.1;
for (const [x, z, w, d] of [[0, -5, 10, 0.4], [0, 5, 10, 0.4], [-5, 0, 0.4, 9.6], [5, 0, 0.4, 9.6]])
  mesh(new THREE.BoxGeometry(w, 0.8, d), 0x8a7a66, 'wall').position.set(x, 0.4, z);
const body = mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), 0x4fa3ff, 'player');
const gem = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 24).rotateX(Math.PI / 2), 0xffd84d, 'coin');

let last = null;
function loop(now) {
  requestAnimationFrame(loop);
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  body.position.set(player.x, 0.4, player.z);
  gem.position.set(coin.x, 0.5, coin.z);
  gem.rotation.y = now / 400;
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

const act = ({ key, down = true, repeat = false }) => {
  if (key === 'Space' && down && !repeat) dashLeft = 0.15;
  if (down) held.add(key); else held.delete(key);
};
addEventListener('keydown', e => act({ key: e.code, repeat: e.repeat }));
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const copy = (p) => ({ x: +p.x.toFixed(2), z: +p.z.toFixed(2) });
window.__game = {
  subject: 'player',
  describe: () => ({ name: 'coin yard', keys: { ArrowRight: 'hold to move right', ArrowLeft: 'hold to move left', ArrowUp: 'hold to move away', ArrowDown: 'hold to move nearer', Space: 'dash' } }),
  observe: () => ({ coins, player: copy(player), coin: copy(coin), dashing: dashLeft > 0 }),
  act,
  setState: (s) => {
    if (s.coins !== undefined) { coins = s.coins; hud.textContent = `Coins ${coins}`; }
    if (s.player) player = { ...player, ...s.player };
    if (s.coin) coin = { ...coin, ...s.coin };
  },
};
</script>
</body></html>
```

The `window.__game` object at the end lets a test tool read the player's position and press keys; the game plays without it.

## Keeping the list as checks the agent replays

The list in step 2 is the part people stop doing, because replaying it by hand gets longer with every feature. paprika3d, a plugin for Claude Code and an MCP server for other coding agents, lets the agent keep the list as checks it replays itself. Install it in Claude Code with:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The agent opens the game with `open` in its own headless Chrome, and each time a feature works it saves it with `interact`: the keys to press, what `expect` should hold afterwards, and a name under `save`. `look` with `save` keeps a picture of the start of the game to compare later pictures against. These replies were captured on 2026-10-30 on the coin yard above, on a Linux server with no GPU where Chrome draws in software; the `look` replies are cut to the lines about the change, and the folder is shortened to `<project>`.

The three lines of the list, saved before the dash request:

```text
interact {"steps": [{"key": "ArrowRight", "frames": 30}], "expect": {"player.x": [1.5, 2.5]}, "save": "walks-right"}

{"changed":{"player":{"x":2}}}
Expect: player.x 2 ✓
Saved check "walks-right" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.

interact {"steps": [{"state": {"player": {"x": 1, "z": -1}, "coin": {"x": 2, "z": -1}}}, {"key": "ArrowRight", "frames": 20}], "expect": {"coins": 1}, "save": "coin-scores"}

{"changed":{"coins":1,"player":{"x":2.33,"z":-1},"coin":{"x":-3,"z":-3}}}
Expect: coins 1 ✓
Saved check "coin-scores" in game-tests.json (2 checks now); `test` reruns them all, each from a fresh reload.

interact {"steps": [{"state": {"player": {"x": 3, "z": 0}}}, {"key": "ArrowRight", "frames": 90}], "expect": {"player.x": [3.5, 4]}, "save": "stays-in-yard"}

{"changed":{"player":{"x":4}}}
Motion (player): travelled 1 units, it stopped at frame 15 and did not move again.
Expect: player.x 4 ✓
Saved check "stays-in-yard" in game-tests.json (3 checks now); `test` reruns them all, each from a fresh reload.
```

The `{ state }` step puts the player and coin where the check needs them, so the check does not depend on walking there first. After the dash answer, `test` replays all three and `look` compares the start of the game with the saved picture:

```text
test {}

✓ walks-right
✓ coin-scores
✗ stays-in-yard: player.x 9, expected 3.5 to 4
2 of 3 saved checks passed in 0.6 s

look {"compare": "yard"}

Compare: 24% of pixels differ from yard (saved 2026-10-30, frame 1, 1280x800@1); diff at <project>/paprika3d/runs/2026-10-30T19-40-31-113Z/look-1-diff.png
On screen (7):
floor 39% [239, 156, 1040, 744] 10 × 10 units
wall ×4 14% [172, 104, 1107, 789] 9.6–10 × 0.8 units
player 0.43% [611, 348, 668, 423]
coin 0.089% [758, 305, 794, 341]
Never visible: none
```

The failing check names the feature, the value and what it should have been: the player ended at 9, past the wall, instead of stopping at 4. The compare says the picture changed (the floor now fills 39% of it, against 30% before) because the camera moved. A changed picture is not a bug by itself; the compare tells you it happened so you can decide whether you wanted it. With the two wall lines back, the agent saves the dash as checks of its own, so the next request cannot quietly undo it either:

```text
test {}

✓ walks-right
✓ coin-scores
✓ stays-in-yard
✓ dash-stops-at-wall
✓ dash
5 of 5 saved checks passed in 1.3 s
```

In Claude Code the plugin's after-edit hook does the replay without being asked: after each batch of edits it reruns every saved check and speaks when one starts or stops failing, so the agent hears about the walls at the edit that removed them, not from you three requests later.

## What this does not do

- It replays what was saved as a check. A feature with no check can still break unnoticed, so the habit is still to save each feature when it first works.
- It does not decide what the game should do. You decide what each check expects; the agent can write the check, but whether the walls should stop the player is your rule.
- It does not undo anything. Going back to a working version is git's job, or your folder copies'.
- Checks catch a broken rule, not a game that stopped being fun.

For what to say to the agent in the first place, see [the AI prompt to make a game](/guides/ai-prompt-to-make-a-game). Saved checks in more depth, with a paused clock and keys on exact frames, are in [test a three.js game with Claude Code](/guides/test-threejs-game-claude-code), and comparing pictures in [visual regression tests for three.js](/guides/visual-regression-test-threejs).
