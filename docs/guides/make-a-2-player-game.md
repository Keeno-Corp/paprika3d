---
title: How to make a 2 player game on one keyboard in three.js
phrase: how to make a 2 player game
description: How to make a two-player game for one keyboard and one screen in the browser with three.js, for a first game: WASD against the arrow keys, each player's controls in a small table of their own, one set of held keys read every frame so both players move at once, one function that drives either player, a shared camera that keeps both in view, shots that never hit their own shooter and first to three hits; a small tank game to paste, the prompt to give an AI agent, the keyboard limit no code can fix, and paprika3d's interact holding four keys at once and tracing both tanks.
meta: How to make a 2 player game on one keyboard in three.js: WASD and arrow keys at once, a table of keys per player, and a tank duel.
intent: make-a-2-player-game
queries:
  - "how to make a 2 player game"
  - "how to make a 2 player game on one keyboard and mouse"
  - "How to detect if multiple keys are pressed at once using JavaScript?"
  - "How do I allow two players to play at once using only one keyboard?"
  - "how to make a tank game"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a 2 player game on one keyboard in three.js

A two-player game on one keyboard gives each person their own side of it: one player uses W, A, S and D, the other the arrow keys, and both play on the same screen at the same time. Games like this are often called local or couch multiplayer. The question people get stuck on is the one with a quarter of a million views on Stack Overflow, "How to detect if multiple keys are pressed at once using JavaScript?": the first version moves a player when a key event arrives, and then the second player's key press stops the first player dead. The fix, and the rest of a working two-player game, takes five parts:

1. **One list of the keys held down right now**, kept up to date by the key events and read every frame.
2. **A small table of keys per player**, so "forward" means W for one player and the up arrow for the other.
3. **One function that drives a player**, run once a frame for each of them with their own table.
4. **A shared screen**: one camera that keeps both players in view.
5. **Rules between the players**: who scores, when someone wins, and that a shot never hits the player who fired it.

A few words first. **three.js** is a JavaScript library that draws 3D scenes in a web page, inside a **canvas** (the rectangle where the game appears). The **game loop** is a function the browser calls about sixty times a second; each call moves things a little and draws one picture. A **key event** is the message the browser sends your code when a key goes down (`keydown`) or comes back up (`keyup`).

## 1. Held keys, read every frame

When you hold a key, the browser sends one `keydown`, then after a pause repeats it, and it repeats the key pressed last. So if player one holds W and player two then presses the up arrow, the repeats switch to the up arrow and player one's W goes quiet. Code that moves a player inside the key event stops that player.

The fix is to move nobody in the key event. `keydown` adds the key to a `Set` (a list with no repeats) and `keyup` removes it. Every frame, the game loop asks the set which keys are down and moves both players from that. Two players, four keys, ten keys: the set holds them all. [How to make a character move in JavaScript](/guides/make-a-character-move-in-javascript) explains this set step by step for one player; this page is about sharing it between two.

Three details matter more with two people on one keyboard:

- **Name keys by `event.code`**, such as `KeyW` and `ArrowUp`. It names the key's place on the keyboard, so Caps Lock, Shift or a French keyboard layout do not change which key is which.
- **Stop the page from reacting.** Arrow keys and Space scroll a page, and Space presses a focused button. `event.preventDefault()` on the game's own keys stops that.
- **Clear the set when the window loses focus.** A key let go while another window was in front never sends `keyup`, and that player's tank would keep driving.

## 2. A table of keys per player

Write each player's keys down once, as data:

```js
const PLAYERS = [
  { name: 'Blue', keys: { forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD', fire: 'Space' } },
  { name: 'Red', keys: { forward: 'ArrowUp', back: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', fire: 'Enter' } },
];
```

The rest of the code never mentions a key by name; it asks for `p.keys.forward`. Changing a player's keys is one line, a third player is one more entry, and a settings screen that lets players pick their own keys has one place to write them.

## 3. One function drives either player

`drive(p, dt)` reads `p.keys` from the held set, turns the tank, moves it and fires. The game loop calls it for Blue and then for Red. Because both run every frame from the same set, both tanks move on the same frames, and neither player's keys can block the other's.

Firing is different from driving: a shot should happen once per press, not sixty times a second while the key is held. The key event marks "wants to fire" on a fresh press (it skips the browser's repeats, `event.repeat`), the next frame fires once, and a reload time of half a second stops a player from emptying the screen with shells.

## 4. One screen for two people

The simple way to share a screen is a camera far enough above the arena to see all of it, as in the game below. A camera that follows both players works too: aim it at the point halfway between them and pull it back as they move apart. **Split screen**, where each player gets half the window and their own camera, is two draws a frame with `renderer.setViewport` and `renderer.setScissor`; it suits racing games, where players drive far apart.

## 5. Rules between the players

Each tank's shell is a small sphere that flies straight until it hits a crate, a wall or the other tank. A hit gives the shooter one point and sends the tank that was hit back to its start. The first to three wins, and R starts a new match.

The rule that is easy to miss: **a shell starts inside the tank that fires it**, so a plain "did a shell touch a tank" test sees the shooter hit itself on the very first frame. Each shell keeps its owner, and the hit test skips the owner.

## The keyboard limit no code can fix

Some keyboards cannot report every combination of keys held at once. The keys are wired in a grid, and on many keyboards holding three or four keys in certain spots makes another key's press go missing, or the keyboard reports nothing new until one is let go. This is called **ghosting** (or a limit on **key rollover**), and it is in the keyboard's hardware: your code never receives the missing key, so no code can fix it. Gaming keyboards often advertise "n-key rollover", meaning any number of keys at once.

What you can do: try the exact keys both players will hold at once (both forward, both turning, both firing) on your own keyboard, and pick other keys for one player if a combination fails. WASD against the arrow keys works on most keyboards, because the two groups sit far apart.

## The game: two tanks

Blue drives with W and S, turns with A and D and fires with Space. Red drives with the up and down arrows, turns with left and right and fires with Enter. Three hits win. Save it as `index.html`, run `npm install three` in its folder (this needs Node.js, a free program that installs JavaScript libraries), serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Two tanks</title>
<style>html,body{margin:0;overflow:hidden;background:#2b2b33}canvas{display:block}
#score{position:fixed;top:12px;width:100%;text-align:center;color:#fff;font:700 24px system-ui;text-shadow:0 1px 3px #000}</style></head>
<body>
<div id="score"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// Each player's controls in a small table of their own. A third player would be one more entry.
const PLAYERS = [
  { name: 'Blue', color: 0x3a78e8, start: { x: -8, z: 0, angle: 0 }, keys: { forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD', fire: 'Space' } },
  { name: 'Red', color: 0xe0483a, start: { x: 8, z: 0, angle: Math.PI }, keys: { forward: 'ArrowUp', back: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', fire: 'Enter' } },
];
const GAME_KEYS = new Set(PLAYERS.flatMap(p => Object.values(p.keys)));
const CRATES = [[0, 0], [0, 3], [0, -3], [-4, 4], [4, -4], [-4, -4], [4, 4]];
const ARENA = { w: 20, h: 13 };

// One set of every key held right now, shared by both players and read every frame.
const held = new Set();
function act({ key, down = true, repeat = false }) {
  if (down && !repeat) for (const p of PLAYERS) if (key === p.keys.fire) p.wantsFire = true;   // one shot per press
  if (key === 'KeyR' && down && winner) reset();
  if (down) held.add(key); else held.delete(key);
}
addEventListener('keydown', e => {
  if (GAME_KEYS.has(e.code)) e.preventDefault();      // stop arrows and Space from scrolling the page
  act({ key: e.code, repeat: e.repeat });
});
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('blur', () => held.clear());         // a key let go in another window never sends keyup here

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2b2b33);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 19, 11);                      // one camera that keeps the whole arena, and both tanks, in view
camera.lookAt(0, 0, 0.5);
scene.add(new THREE.HemisphereLight(0xffffff, 0x404050, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(4, 12, 6);
scene.add(sun);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(ARENA.w, ARENA.h).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xa89878 }));
floor.name = 'arena';
scene.add(floor);
for (const [x, z] of CRATES) {
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshStandardMaterial({ color: 0x8a5a2b }));
  crate.name = 'crate';
  crate.position.set(x, 0.6, z);
  scene.add(crate);
}
for (const p of PLAYERS) {
  p.mesh = new THREE.Group();
  p.mesh.name = p.name.toLowerCase() + ' tank';
  const mat = new THREE.MeshStandardMaterial({ color: p.color });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.9), mat);
  body.position.y = 0.25;
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.18), mat);
  barrel.position.set(0.6, 0.6, 0);
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 16), mat);
  turret.position.y = 0.6;
  p.mesh.add(body, turret, barrel);
  scene.add(p.mesh);
}

const blocked = (x, z, r) => Math.abs(x) > ARENA.w / 2 - r || Math.abs(z) > ARENA.h / 2 - r
  || CRATES.some(([cx, cz]) => Math.abs(x - cx) < 0.6 + r && Math.abs(z - cz) < 0.6 + r);
let bullets = [], winner = null;

function reset() {
  for (const p of PLAYERS) Object.assign(p, p.start, { score: 0, reload: 0, wantsFire: false });
  for (const b of bullets) scene.remove(b.mesh);
  bullets = [];
  winner = null;
}

// The same function runs for each player, with that player's own keys.
function drive(p, dt) {
  const k = p.keys, on = code => held.has(code);
  p.angle += ((on(k.left) ? 1 : 0) - (on(k.right) ? 1 : 0)) * 2.5 * dt;
  const speed = ((on(k.forward) ? 1 : 0) - (on(k.back) ? 1 : 0)) * 4;
  const x = p.x + Math.cos(p.angle) * speed * dt, z = p.z - Math.sin(p.angle) * speed * dt;
  if (!blocked(x, p.z, 0.5)) p.x = x;
  if (!blocked(p.x, z, 0.5)) p.z = z;
  p.reload = Math.max(0, p.reload - dt);
  if (p.wantsFire && p.reload === 0) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffee88 }));
    mesh.name = 'shell';
    scene.add(mesh);
    bullets.push({ owner: p, x: p.x, z: p.z, dx: Math.cos(p.angle) * 12, dz: -Math.sin(p.angle) * 12, mesh });
    p.reload = 0.5;                                     // half a second between shots
  }
  p.wantsFire = false;
}

function step(dt) {
  if (winner) return;
  for (const p of PLAYERS) drive(p, dt);
  for (const b of bullets) {
    b.x += b.dx * dt; b.z += b.dz * dt;
    if (blocked(b.x, b.z, 0)) b.dead = true;
    for (const p of PLAYERS) {
      if (p === b.owner || b.dead) continue;            // a shell never hits the tank that fired it
      if (Math.hypot(b.x - p.x, b.z - p.z) < 0.6) {
        b.dead = true;
        b.owner.score++;
        Object.assign(p, p.start);                      // the hit tank goes back to its start
        if (b.owner.score >= 3) winner = b.owner.name;
      }
    }
  }
  for (const b of bullets) if (b.dead) scene.remove(b.mesh);
  bullets = bullets.filter(b => !b.dead);
}

const scoreLine = document.getElementById('score');
reset();
let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  for (const p of PLAYERS) { p.mesh.position.set(p.x, 0, p.z); p.mesh.rotation.y = p.angle; }
  for (const b of bullets) b.mesh.position.set(b.x, 0.6, b.z);
  scoreLine.textContent = winner ? `${winner} wins! Press R to play again.` : `Blue ${PLAYERS[0].score}   :   ${PLAYERS[1].score} Red`;
  renderer.render(scene, camera);
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const view = p => ({ x: +p.x.toFixed(2), z: +p.z.toFixed(2), angle: +p.angle.toFixed(2), score: p.score });
window.__game = {
  describe: () => ({ name: 'two tanks', keys: { KeyW: 'blue forward', KeyS: 'blue back', KeyA: 'blue turn left', KeyD: 'blue turn right', Space: 'blue fire',
    ArrowUp: 'red forward', ArrowDown: 'red back', ArrowLeft: 'red turn left', ArrowRight: 'red turn right', Enter: 'red fire', KeyR: 'play again after a win' } }),
  observe: () => ({ blue: view(PLAYERS[0]), red: view(PLAYERS[1]), shells: bullets.length, winner }),
  act,
  setState: s => { if (s.blue) Object.assign(PLAYERS[0], s.blue); if (s.red) Object.assign(PLAYERS[1], s.red); },
  subject: () => PLAYERS[0].mesh,
};
</script>
</body></html>
```

`PLAYERS` at the top holds everything that differs between the two tanks: name, colour, start and keys. `window.__game` at the end lets a test tool read both tanks and set up a moment; the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code, Cursor or Codex that writes and edits the files of your project) writes this kind of game quickly when you name the parts that go wrong:

```text
Make a two-player tank game for one keyboard in one index.html with three.js.
Player 1 uses WASD and Space to fire, player 2 the arrow keys and Enter.
Keep one Set of held keys (by event.code), updated on keydown and keyup and cleared
on blur, and read it every frame so both tanks move at the same time. Keep each
player's keys in a table and drive both tanks with one function. preventDefault
on the game's keys. Fire once per press with a short reload; a shell never hits
the tank that fired it. One camera shows the whole arena. First to 3 hits wins,
R plays again.
```

Online play, where the second player is on another computer, is a different project: it needs a server and code that keeps two computers in step, and it is out of scope here.

## When two players get in each other's way

- **One player stops when the other presses a key.** The game moves players in the key event. Move them every frame from a set of held keys.
- **A player keeps moving after letting go.** The key came up while the window was not in front; clear the set on `blur`.
- **The page scrolls when someone presses an arrow or Space.** Call `preventDefault()` for the game's keys.
- **Holding fire shoots a stream.** Fire on a fresh press, never on a held key, and add a reload time.
- **A player scores the moment they fire.** The shell hit its own tank; skip the owner in the hit test.
- **One combination of keys never works,** always the same three or four keys on one keyboard. That is the keyboard's rollover limit; change one player's keys.

## Let the agent hold four keys at once

Testing a two-player game alone means pressing both players' keys at once and watching two things move. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can do that and read the result as numbers. Install it in Claude Code with these two lines in a terminal (the window where you type commands):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

`interact` presses keys on exact frames. A key step with `down: true` stays held across the later steps, and `frames: 0` sends the next step on the same frame, so four keys can go down together; `trace` then follows numbers frame by frame. These replies were captured on 2026-10-30 on the game above, on a machine with no graphics card where Chrome draws in software. Blue holds W and A (forward and turn left) while Red holds the up and right arrows, for 30 frames:

```text
interact {"steps": [{"key": "KeyW", "down": true, "frames": 0}, {"key": "KeyA", "down": true, "frames": 0}, {"key": "ArrowUp", "down": true, "frames": 0}, {"key": "ArrowRight", "down": true}, {"wait": 30}, {"key": "KeyW", "down": false, "frames": 0}, {"key": "KeyA", "down": false, "frames": 0}, {"key": "ArrowUp", "down": false, "frames": 0}, {"key": "ArrowRight", "down": false}], "trace": ["blue.x", "blue.angle", "red.x", "red.angle"], "expect": {"blue.angle": [1, 1.5], "red.angle": [1.6, 2.1]}, "save": "four-keys-at-once"}

{"changed":{"blue":{"x":-6.49,"z":-1.19,"angle":1.29},"red":{"x":6.49,"z":-1.19,"angle":1.85}}}
Motion (blue tank): travelled 2 units (1.87 from start to end), its direction of travel turned 69° left.
blue.x: -8 → -6.49 at frame 31; first changed at frame 1
blue.angle: 0 → 1.29 at frame 31; first changed at frame 1
red.x: 8 → 6.49 at frame 31; first changed at frame 1
red.angle: 3.14 → 1.85 at frame 31; first changed at frame 1
Expect: blue.angle 1.29 ✓ · red.angle 1.85 ✓
Saved check "four-keys-at-once" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

All four numbers first changed at frame 1, so both tanks drove and turned together, and they mirror each other: the same distance, Blue turning left, Red turning right. (`expect` with two numbers checks a range.)

On a first version of this game, whose hit test did not skip the shell's owner, one press of Space gave:

```text
interact {"steps": [{"key": "Space"}, {"wait": 5}], "expect": {"blue.score": 0, "shells": 1}}

{"changed":{"blue":{"score":1}}}
Expect: blue.score 1 ✗ expected 0 · shells 0 ✗ expected 1
```

Blue scored a point by shooting itself, and the shell was gone. Played, that looks like a scoreboard counting up at random. With the owner skipped, the same call answers `Expect: blue.score 0 ✓ · shells 1 ✓`, and with `save` it is kept as the check `own-shell-misses`. The last check sets Blue one hit from winning, lined up with Red, and fires:

```text
interact {"steps": [{"state": {"blue": {"x": -8, "z": 1.5, "angle": 0, "score": 2}, "red": {"x": 8, "z": 1.5, "angle": 3.14}}}, {"key": "Space"}, {"until": {"winner": "Blue"}, "max": 200}], "expect": {"blue.score": 3, "red.score": 0, "red.z": 0}, "save": "third-hit-wins"}

{"changed":{"blue":{"z":1.5,"score":3},"winner":"Blue"}}
until: winner == "Blue" held at frame 78
Expect: blue.score 3 ✓ · red.score 0 ✓ · red.z 0 ✓
Saved check "third-hit-wins" in game-tests.json (3 checks now); `test` reruns them all, each from a fresh reload.

test {}

✓ four-keys-at-once
✓ own-shell-misses
✓ third-hit-wins
3 of 3 saved checks passed in 0.7 s
```

The shell crossed the arena, the third hit ended the match, and Red went back to its start (`red.z` 0).

What paprika3d does not do: it cannot find keyboard ghosting. It sends key events straight to the browser, so every combination works in its checks; the real keyboard is what shows which combinations it drops. It also does not judge whether the match is fair or fun, which two people playing it will tell you quickly.

## Next steps

- Smooth movement for one player, from the start: [how to make a character move in JavaScript](/guides/make-a-character-move-in-javascript).
- A screen for the winner and a rematch button: [how to add a game over screen](/guides/add-a-game-over-screen).
- A title screen where players choose to start, and a pause on Escape: [how to make a main menu for a game](/guides/make-a-main-menu).
- A shake and a flash when a shell hits: [three.js camera shake for hit feedback](/guides/threejs-camera-shake-hit-feedback).
- Share the game with the friend you will play it with: [how to put your game online](/guides/put-your-game-online).
- Two players trading punches and blocks: [how to make a fighting game](/guides/make-a-fighting-game).
