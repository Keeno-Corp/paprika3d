---
title: How to make a fighting game in three.js: punches, blocks and hit boxes
phrase: how to make a fighting game
description: How to make a fighting game for a first-time game maker: the words fighting games use (frames, startup, active and recovery, hit boxes and hurt boxes, block and stun), a punch whose hit box is live for a few frames and hits once, a block that halves damage, a stun after a hit, a computer opponent and health bars, in a small three.js robot boxing game; why a stun longer than the gap between punches makes an endless combo, and how an AI agent with paprika3d presses the punch on a known frame and reads when the hit box was live and when health dropped.
meta: How to make a fighting game in three.js: punches timed in frames, hit boxes that hit once, a block, a stun, and a computer opponent.
intent: make-a-fighting-game
queries:
  - "how to make a fighting game"
  - "how to make a fighting game in javascript"
  - "threejs fighting game"
  - "how to make a boxing game"
  - "Handling infinite combos"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make a fighting game in three.js: punches, blocks and hit boxes

A fighting game is two characters, a handful of moves and two health bars, and almost all of its rules answer one question: **when does a hit count?** A punch that lands too easily is no fun, one that misses when it plainly touched feels broken, and a hit that leaves the other fighter helpless forever ends the game. Fighting games answer the question with a few ideas that have names, and once you know the names you can ask an AI agent for exactly the game you mean.

This page explains those ideas and builds a small robot boxing game against the computer in one HTML file, with three.js (a free JavaScript library that draws 3D in a web page). The robots are boxes, so the code stays about the rules.

## The words fighting games use

- **Frame.** One step of the game. A browser shows about 60 a second, and fighting games time every move in frames, because a move that lasts "a bit" cannot be tuned.
- **Startup, active and recovery.** Every attack has three parts: the wind-up before it can hit (startup), the few frames when it can hit (active), and the time to pull the arm back, when the attacker is open (recovery). Here a punch is 6 frames of startup, 4 active and 12 of recovery.
- **Hit box and hurt box.** Invisible boxes the game checks instead of the drawn shapes. The hurt box is the part of a fighter that can be hit, here the body. The hit box is the part of an attack that hits, here a box in front of the fist, and it exists during the active frames and at no other time. A hit is a hit box overlapping the other fighter's hurt box.
- **Block.** Holding a key to guard: a blocked punch does half its damage and does not stun.
- **Stun** (fighting games also say hitstun). For a short time after being hit, a fighter cannot move, punch or block. It is what makes a hit feel like a hit, and its length decides whether combos end.
- **Combo.** Hits that follow each other so fast that the fighter being hit cannot do anything in between.

## The first request to type

If you build with an AI coding agent (an assistant such as Claude Code that writes and edits the files in a project folder for you), use the words above in the request; they turn "make punching work" into rules the agent can follow:

```text
Make a side-view boxing game in one index.html with three.js: two robots made of
boxes in a ring, me against the computer. Arrows move, J punches, K blocks while held.
Time everything in frames of 1/60 s. A punch has 6 startup, 4 active and 12 recovery
frames; its hit box exists only in the active frames and can hit once. A hit does 10
damage and stuns for 18 frames with a push back; a blocked hit does 5 and no stun.
The computer walks in, punches now and then and blocks some of my punches.
Health bars at the top. Add a training mode where the computer stands still and
the live hit box is drawn.
```

## The game

Here is a page of the kind that request asks for, written and tested for this guide. Save it as `index.html` in a folder where you have run `npm install three`, and open it through a local web server; [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains both steps.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Robot boxing</title>
<style>html,body{margin:0;overflow:hidden;background:#141826}canvas{display:block}
#hud{position:fixed;top:14px;left:20px;right:20px;display:flex;justify-content:space-between;font:600 18px system-ui;color:#fff;pointer-events:none}
.bar{width:40vw;height:14px;background:#422;margin-top:6px}.bar div{height:100%;background:#4cd964}
#msg{position:fixed;top:60px;left:0;right:0;text-align:center;font:600 22px system-ui;color:#fff;pointer-events:none}</style></head>
<body>
<div id="hud"><div>You<div class="bar"><div id="you"></div></div></div><div style="text-align:right">Computer<div class="bar"><div id="cpu"></div></div></div></div>
<div id="msg">Arrows: move   J: punch   K: block</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// A punch in frames (1/60 s each): wind up, then the hit box is live, then the arm comes back.
const STARTUP = 6, ACTIVE = 4, RECOVERY = 12;
const DAMAGE = 10, STUN = 18, PUSH = 0.5, SPEED = 0.05, EDGE = 3.4;

const fighter = (x) => ({ x, facing: 1, health: 100, action: 'idle', t: 0, hit: false, cooldown: 60, guard: false });
let you = fighter(-1.5), cpu = fighter(1.5), training = false, winner = null;
const held = new Set();

// Boxes in the side view: x along the ring, y up. The body can be hit; the fist hits only while the punch is live.
const hurtBox = f => new THREE.Box3(new THREE.Vector3(f.x - 0.4, 0, -0.5), new THREE.Vector3(f.x + 0.4, 1.9, 0.5));
const live = f => f.action === 'punch' && f.t >= STARTUP && f.t < STARTUP + ACTIVE;
const hitBox = f => {
  const near = f.x + f.facing * 0.35, far = f.x + f.facing * 1.25;
  return new THREE.Box3(new THREE.Vector3(Math.min(near, far), 1.1, -0.3), new THREE.Vector3(Math.max(near, far), 1.5, 0.3));
};

function punch(f) {
  if (f.action !== 'idle' && f.action !== 'block') return;
  f.action = 'punch'; f.t = 0; f.hit = false;
  if (f === you) cpu.guard = !training && Math.random() < 0.4;   // the computer sees it coming, sometimes
}

function land(attacker, target) {
  attacker.hit = true;                                    // one punch hits once, however long it stays live
  const blocked = target.action === 'block';
  target.health = Math.max(0, target.health - (blocked ? DAMAGE / 2 : DAMAGE));
  target.x = Math.max(-EDGE, Math.min(EDGE, target.x + attacker.facing * (blocked ? PUSH / 2 : PUSH)));
  if (!blocked) { target.action = 'stun'; target.t = 0; }  // stunned: cannot move, punch or block for a moment
  if (target.health === 0) winner = attacker === you ? 'you' : 'cpu';
}

function step(f) {                                        // a fighter's action moves on one frame
  f.t++;
  if (f.action === 'punch' && f.t >= STARTUP + ACTIVE + RECOVERY) f.action = 'idle';
  if (f.action === 'stun' && f.t >= STUN) f.action = 'idle';
}

function move(f, dir, other) {
  if (f.action !== 'idle' || !dir) return;
  const x = Math.max(-EDGE, Math.min(EDGE, f.x + dir * SPEED));
  if (Math.abs(other.x - x) >= 0.9) f.x = x;              // fighters cannot walk through each other
}

function think() {                                        // the computer: walk in, punch now and then, block some punches
  if (training || cpu.action === 'punch' || cpu.action === 'stun') return;
  if (cpu.guard && you.action === 'punch') { cpu.action = 'block'; return; }
  if (cpu.action === 'block') cpu.action = 'idle';
  if (Math.abs(you.x - cpu.x) > 1.15) move(cpu, Math.sign(you.x - cpu.x) * 0.8, you);
  else if (--cpu.cooldown <= 0) { punch(cpu); cpu.cooldown = 45 + Math.floor(Math.random() * 45); }
}

function tick() {
  if (winner) return;
  step(you); step(cpu);
  you.facing = Math.sign(cpu.x - you.x) || 1; cpu.facing = -you.facing;
  if (you.action === 'idle' || you.action === 'block') you.action = held.has('KeyK') ? 'block' : 'idle';
  move(you, (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0), cpu);
  think();
  for (const [a, b] of [[you, cpu], [cpu, you]]) if (live(a) && !a.hit && hitBox(a).intersectsBox(hurtBox(b))) land(a, b);
}

addEventListener('keydown', e => {
  if (e.repeat) return;
  if (winner && e.code === 'Space') return restart();
  held.add(e.code);
  if (e.code === 'KeyJ') punch(you);
});
addEventListener('keyup', e => held.delete(e.code));
function restart() { you = fighter(-1.5); cpu = fighter(1.5); winner = null; }

// Drawing: a ring and two box robots.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141826);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 1.7, 5.5);
camera.lookAt(0, 1.1, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.6));
const spot = new THREE.DirectionalLight(0xffffff, 2.2);
spot.position.set(2, 8, 5);
scene.add(spot);
const box = (w, h, d, color, name, parent = scene) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color }));
  m.name = name; parent.add(m); return m;
};
box(8, 0.3, 3, 0x3a5a8c, 'ring').position.y = -0.15;
for (const x of [-4, 4]) box(0.15, 1.6, 0.15, 0xdddddd, 'post').position.set(x, 0.8, -1.4);
for (const y of [0.9, 1.4]) box(8, 0.05, 0.05, 0xd04040, 'rope').position.set(0, y, -1.4);

function robot(name, color, glove) {
  const g = new THREE.Group();
  g.name = name;
  box(0.7, 1.1, 0.5, color, `${name} body`, g).position.y = 0.95;
  box(0.45, 0.4, 0.4, 0xcfd6e0, `${name} head`, g).position.y = 1.75;
  box(0.25, 0.6, 0.3, 0x555b66, `${name} legs`, g).position.y = 0.3;
  const front = box(0.3, 0.3, 0.3, glove, `${name} fist`, g), back = box(0.3, 0.3, 0.3, glove, `${name} other fist`, g);
  scene.add(g);
  return { g, front, back };
}
const robots = [[you, robot('you', 0x2f7de1, 0xf0c040)], [cpu, robot('cpu', 0xe14a2f, 0xf4f4f4)]];
const hitMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.4 }));
hitMesh.name = 'hit box';
scene.add(hitMesh);

function pose(f, { g, front, back }) {
  g.position.x = f.x;
  g.rotation.z = f.action === 'stun' ? -f.facing * 0.25 : 0;      // rocked back while stunned
  let reach = 0.35, y = 1.25;
  if (f.action === 'punch') {
    if (f.t < STARTUP) reach = 0.2;                               // wind up
    else if (f.t < STARTUP + ACTIVE) reach = 1.05;                // arm out: the hit box is live
    else reach = 1.05 - 0.7 * (f.t - STARTUP - ACTIVE) / RECOVERY; // coming back
  }
  if (f.action === 'block') { reach = 0.35; y = 1.6; }
  front.position.set(f.facing * reach, y, 0.32);
  back.position.set(f.facing * 0.3, f.action === 'block' ? 1.55 : 1.15, -0.32);
}

const bars = { you: document.getElementById('you'), cpu: document.getElementById('cpu') }, msg = document.getElementById('msg');
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

let then = null, owed = 0;
renderer.setAnimationLoop(now => {
  owed += then === null ? 1 / 60 : Math.min((now - then) / 1000, 0.1);
  then = now;
  while (owed >= 1 / 60 - 1e-6) { tick(); owed -= 1 / 60; }
  robots.forEach(([f, r]) => pose(f, r));
  const shown = [you, cpu].find(live);
  hitMesh.visible = training && !!shown;                         // training mode draws the live hit box
  if (shown) { const b = hitBox(shown); b.getCenter(hitMesh.position); b.getSize(hitMesh.scale); }
  bars.you.style.width = `${you.health}%`;
  bars.cpu.style.width = `${cpu.health}%`;
  if (winner) msg.textContent = `${winner === 'you' ? 'You win' : 'The computer wins'}! Space to fight again`;
  renderer.render(scene, camera);
});

const view = f => ({ x: +f.x.toFixed(2), health: f.health, action: f.action, hitbox: live(f) });
window.__game = {
  describe: () => ({ name: 'robot boxing', keys: { ArrowRight: 'move right', ArrowLeft: 'move left', KeyJ: 'punch', KeyK: 'block (hold)' } }),
  observe: () => ({ you: view(you), cpu: view(cpu), winner, training }),
  act: ({ key, down = true }) => { if (down) { held.add(key); if (key === 'KeyJ') punch(you); } else held.delete(key); },
  setState: (s) => {
    if (s.training !== undefined) training = s.training;    // training: the computer stands still and the hit box is drawn
    if (s.you) Object.assign(you, s.you);
    if (s.cpu) Object.assign(cpu, s.cpu);
  },
  subject: 'you',
};
</script>
</body></html>
```

The parts to recognise:

- **The numbers at the top** are the whole feel of the game: the three punch lengths, the damage, the stun, the push back and the walking speed.
- **`hurtBox` and `hitBox`** build the two boxes with `THREE.Box3`, and `live` says whether a punch is in its active frames. The check in `tick` is one line: a live hit box that has not hit yet, overlapping the other fighter's hurt box, lands.
- **`land`** applies a hit: half damage when the target is blocking, a push back, and a stun unless blocked. It also sets `hit` on the attacker, so one punch counts once.
- **`think`** is the computer: walk in when far, punch after a cooldown with some randomness in it, and block some of your punches when it sees them start.
- **`pose`** draws each fighter from its state: the fist pulled back during startup, out during the active frames, coming back during recovery, raised while blocking, and the body rocked back while stunned. The drawing follows the rules; it never decides them.
- **Training mode** (the `training` flag, set through `window.__game`) stops the computer and draws the live hit box as a red box, which is how fighting game makers check their boxes by eye.

## Combos, and why the stun has a limit

Every hit stuns. If the stun lasts longer than the attacker needs to punch again, the second punch lands before the first stun ends, and so does the third: the fighter being hit never gets a free frame to block, and the combo goes on until the health runs out. That is the "infinite combo" people ask about. The fix is a rule about lengths: the stun must end before the next punch can land. Here the stun of 18 frames runs out before the attacker has finished the punch and walked back in after the push back, so the other robot gets a moment to block. Some games also cap a combo by count, or shrink the stun with every hit in a row.

The two replies below are the same play on two versions, captured with paprika3d (see the next section): training mode, the right arrow held, and J pressed six times with a wait of 30 frames after each. With `STUN = 18`, the computer's robot is free between hits:

```text
interact {"steps":[{"state":{"training":true,"you":{"x":0},"cpu":{"x":1}}},{"key":"ArrowRight","down":true},{"key":"KeyJ"},{"wait":30},{"key":"KeyJ"},{"wait":30},{"key":"KeyJ"},{"wait":30},{"key":"KeyJ"},{"wait":30},{"key":"KeyJ"},{"wait":30},{"key":"KeyJ"},{"wait":30},{"key":"ArrowRight","down":false}],"trace":["cpu.action","cpu.health"]}

{"changed":{"you":{"x":2.5},"cpu":{"x":3.4,"health":40},"training":true}}
Motion (you): travelled 2.5 units, it stopped at frame 155 and did not move again.
cpu.action: "idle" until frame 7, "stun" until frame 25, "idle" until frame 38, "stun" until frame 56, "idle" until frame 69, "stun" until frame 87, "idle" until frame 100, "stun" until frame 118, … (12 changes)
cpu.health: 100 → 40 at frame 162; first changed at frame 7
```

With the stun changed to 40, it is stunned from the first hit to the last, an endless combo:

```text
interact {"steps":[{"state":{"training":true,"you":{"x":0},"cpu":{"x":1}}},{"key":"ArrowRight","down":true},{"key":"KeyJ"},{"wait":30},{"key":"KeyJ"},{"wait":30},{"key":"KeyJ"},{"wait":30},{"key":"KeyJ"},{"wait":30},{"key":"KeyJ"},{"wait":30},{"key":"KeyJ"},{"wait":30},{"key":"ArrowRight","down":false}],"trace":["cpu.action","cpu.health"]}

{"changed":{"you":{"x":2.5},"cpu":{"x":3.4,"health":40,"action":"stun"},"training":true}}
Motion (you): travelled 2.5 units, it stopped at frame 155 and did not move again.
cpu.action: "idle" until frame 7, then "stun"
cpu.health: 100 → 40 at frame 162; first changed at frame 7
```

## When it breaks

- **One punch takes off far more health than it should.** The hit box overlapped for several active frames and hit on each of them. Mark the punch as having hit, as `land` does, and check the mark.
- **A punch that clearly touched does nothing,** or one that missed still hits. The hit box is not where the fist is drawn. Draw the box in a training mode and look at it on the active frames.
- **Pressing J does nothing during a fight.** The fighter is stunned, still recovering from the last punch, or the key repeat of a held key is starting new punches; the game ignores `e.repeat` and lets a punch start from standing or blocking, never in the middle of another move.
- **The computer can never be hit.** It blocks every punch. Give its choices some randomness and moments when it cannot block, such as its own recovery.
- **The game runs faster on a fast screen.** The rules move once per drawn frame instead of once per 1/60 s. Count time in fixed steps, as the loop at the end does.

## Let the agent press the punch

Frame timing is where describing a bug to an AI breaks down: "the punch sometimes doesn't hit" cannot be fixed from words. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser on a paused clock. The agent presses a key on an exact frame and reads the game's state on every frame after it. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The replies here were captured on 2026-11-01 on the game above, on a server with no graphics card where Chrome draws in software. `interact` sets up training mode with the robots one unit apart, presses J, waits 30 frames, and its `trace` follows four values:

```text
interact {"steps":[{"state":{"training":true,"you":{"x":0},"cpu":{"x":1}}},{"key":"KeyJ"},{"wait":30}],"trace":["you.hitbox","cpu.health","cpu.action","you.action"]}

{"changed":{"you":{"x":0},"cpu":{"health":90},"training":true}}
you.hitbox: false until frame 6, true until frame 10, then false
cpu.health: 100 → 90 at frame 6; first changed at frame 6
cpu.action: "idle" until frame 6, "stun" until frame 24, then "idle"
you.action: "idle" until frame 1, "punch" until frame 22, then "idle"
```

The hit box was live on frames 6 to 9, the computer's health fell by 10 on frame 6, the first live frame, and its stun lasted until frame 24. On a version without the `hit` mark, the same call answered:

```text
{"changed":{"you":{"x":0},"cpu":{"x":2,"health":80},"training":true}}
you.hitbox: false until frame 6, true until frame 10, then false
cpu.health: 100 → 80 at frame 7; first changed at frame 6
cpu.action: "idle" until frame 6, "stun" until frame 25, then "idle"
you.action: "idle" until frame 1, "punch" until frame 22, then "idle"
```

Two hits from one punch, on frames 6 and 7, before the push back moved the robot out of reach: 20 damage where the rules say 10. `look` with `sheet` reloads the page for each moment and puts them side by side, so the agent sees the punch frame by frame, with the red hit box drawn on the live frame:

```text
look {"sheet":[{"label":"frame 3: wind up","state":{"training":true,"you":{"x":0},"cpu":{"x":1}},"steps":[{"key":"KeyJ"},{"wait":2}]},{"label":"frame 6: hit box live","state":{"training":true,"you":{"x":0},"cpu":{"x":1}},"steps":[{"key":"KeyJ"},{"wait":5}]},{"label":"frame 14: arm back, cpu stunned","state":{"training":true,"you":{"x":0},"cpu":{"x":1}},"steps":[{"key":"KeyJ"},{"wait":13}]},{"label":"frame 26: both idle","state":{"training":true,"you":{"x":0},"cpu":{"x":1}},"steps":[{"key":"KeyJ"},{"wait":25}]}]}

Picture: <project>/paprika3d/runs/2026-11-01T00-36-26-642Z/look-5-sheet.png (4 moments, left to right, top to bottom: frame 3: wind up | frame 6: hit box live | frame 14: arm back, cpu stunned | frame 26: both idle); the game is reloaded at its first frame
frame 3: wind up: subject you 3.4%; on screen: ring, cpu body, you body, post ×2, cpu head, rope ×2, you head, cpu fist, … 5 more; pixels: brightness 21%, colour saturation 54%, 0% near black, 0% blown out
frame 6: hit box live: subject you 3.7%; on screen: ring, you body, cpu body, post ×2, rope ×2, cpu head, you head, cpu fist, … 5 more; pixels: brightness 21%, colour saturation 54%, 0% near black, 0% blown out
frame 14: arm back, cpu stunned: subject you 3.7%; on screen: ring, you body, cpu body, post ×2, rope ×2, cpu head, you head, cpu fist, … 5 more; pixels: brightness 21%, colour saturation 54%, 0% near black, 0% blown out
frame 26: both idle: subject you 3.6%; on screen: ring, cpu body, you body, cpu head, post ×2, rope ×2, you head, cpu fist, … 5 more; pixels: brightness 21%, colour saturation 54%, 0% near black, 0% blown out
This sheet took 2 s (about 1 s a cell) on a software renderer.
```

paprika3d does not judge whether a fight is fair or fun, or tune the numbers; it shows what each number does. The computer's side is played by the game's own code, not by paprika3d, and paprika3d does not stand in for a second person: [how to make a 2 player game](/guides/make-a-2-player-game) covers two people on one keyboard.

## What to do next

- Better health bars, a timer and round counters: [three.js minimap and game HUD](/guides/threejs-minimap-game-hud).
- A shake, a flash and a short freeze on every hit: [three.js camera shake for hit feedback](/guides/threejs-camera-shake-hit-feedback) and [how to make a game feel good](/guides/make-a-game-feel-good).
- Real characters with punch animations instead of boxes: [three.js animation crossfade](/guides/threejs-animation-crossfade-walk-run).
- A knockout screen and a rematch button: [how to add a game over screen](/guides/add-a-game-over-screen).
- Two people on one keyboard: [how to make a 2 player game](/guides/make-a-2-player-game).
