---
title: How to make a soccer game in three.js: penalty kicks against a keeper
phrase: how to make a soccer game
description: How to make a soccer game for a first-time game maker, starting with the part that fits in one file: penalty kicks, with aiming by mouse, power from how long the button is held, a ball that rises, dips and rolls under gravity, a goalkeeper who guesses a side and dives, and five kicks, in a small three.js game; why a full match is a much larger game, what breaks first, and how an AI agent with paprika3d takes the kicks itself and reads the ball's path into the goal or past it.
meta: How to make a soccer game in three.js: penalty kicks with mouse aim, power from holding the button, and a goalkeeper who guesses and dives.
intent: make-a-soccer-game
queries:
  - "how to make a soccer game"
  - "how to make a soccer video game"
  - "three js soccer game"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make a soccer game in three.js: penalty kicks against a keeper

A full soccer match (football, outside North America) is one of the larger games a beginner can pick: twenty-two players who each need to run, pass and choose where to stand, a ball that has to feel right at every speed, the rules of fouls and offside, a camera that follows play, and a computer team that plays sensibly on both ends. Each of those is a project of its own. So start where every soccer game starts and where the fun is already complete: **one kick at a goal, against a goalkeeper.** A penalty shootout has the whole feel of the sport in a few hundred lines, and every part of it carries over to the bigger game later.

This page builds that in one HTML file with three.js, a free JavaScript library that draws 3D in a web page: you aim with the mouse, hold the button to build power, let go to shoot, and the keeper guesses a side as you kick. Five kicks, then your score.

## The parts of a penalty game

1. **Aiming.** The mouse points at a spot on the goal. The game draws an invisible line from the camera through the mouse (a raycast) and finds where it meets the flat plane of the goal; a yellow ring shows the spot.
2. **Power.** Holding the button fills a power bar; a full second fills it. Power sets the ball's speed, and a hard kick also lifts the ball, so a shot held too long rises over the bar, as a real one does.
3. **The ball's flight.** Each frame (one step of the game, about 60 a second) gravity pulls the ball down a little. A soft shot dips and rolls along the grass, a hard one flies flat and arrives sooner.
4. **The goalkeeper.** As you kick, the keeper picks left, right or stay. After a short reaction time he dives that way at a set speed and lies flat. The ball is saved if it touches his box, as drawn, on its way in.
5. **The result.** When the ball crosses the goal line, it is a goal if it is inside the posts and under the bar, wide or over if not, and "off the frame" if it hits a post or the bar. After five kicks the game shows the score.

The two numbers that decide most of the game are the keeper's reaction time and his diving speed. Together with the ball's speed they make the core trade: a hard shot gets there before he does, a soft one gives him time, and too much power sends it over.

## The first request to type

If you build with an AI coding agent (an assistant such as Claude Code that writes and edits the files in a project folder for you), this request asks for the game below:

```text
Make a penalty kick game in one index.html with three.js. Camera behind the ball, a real
size goal (7.32 m by 2.44 m) 11 m away, a box goalkeeper. Aim with the mouse on the
goal's plane and show the spot; hold the mouse button for power (1 second is full),
release to kick. A harder kick is faster and rises more, so full power can go over
the bar. Gravity on the ball, a bounce and a roll. As I kick, the keeper guesses left,
right or stay, reacts after 8 frames and dives at 6 m/s; the ball is saved if it
touches him. Goal, wide, over or off the frame at the goal line. Five kicks, then
the score and a click to play again.
```

## The game

Here is a page of the kind that request asks for, written and tested for this guide. Save it as `index.html` in a folder where you have run `npm install three`, and open it through a local web server; [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) shows both steps.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Penalty kicks</title>
<style>html,body{margin:0;overflow:hidden;background:#8fc4ea}canvas{display:block;touch-action:none}
#hud{position:fixed;top:14px;left:0;right:0;text-align:center;font:600 22px system-ui;color:#fff;text-shadow:0 1px 3px #0008;pointer-events:none}
#power{position:fixed;bottom:24px;left:50%;width:240px;height:14px;margin-left:-120px;background:#0005}#power div{height:100%;width:0;background:#ffd23f}</style></head>
<body>
<div id="hud"></div><div id="power"><div id="fill"></div></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const GOAL_Z = -11, POST_X = 3.66, BAR_Y = 2.44, R = 0.11, KICKS = 5;  // a real goal: 7.32 m by 2.44 m, 11 m away
const GRAVITY = 9.81, FULL = 60;                                     // holding the button 60 frames (1 s) is full power

let goals = 0, kicks = 0, phase = 'aim', held = 0, power = 0, result = null, wait = 0, guess = null, nextGuess = null;
const ball = { p: new THREE.Vector3(0, R, 0), v: new THREE.Vector3() };
const keeper = { x: 0, dir: 0, t: 0 };
const target = new THREE.Vector3(0, 1, GOAL_Z);

function kick() {                              // toward the aimed point; speed and lift grow with power
  const d = target.clone().sub(ball.p).normalize();
  const speed = 14 + 16 * power;
  ball.v.copy(d).multiplyScalar(speed);
  ball.v.y += 4 * power * power;               // a hard kick rises: hold too long and it goes over the bar
  guess = nextGuess ?? ['left', 'stay', 'right'][Math.floor(Math.random() * 3)]; // the keeper guesses as you kick
  nextGuess = null;
  keeper.dir = { left: -1, stay: 0, right: 1 }[guess]; keeper.t = 0;
  phase = 'flying'; kicks++;
}

function settle(r) { result = r; if (r === 'goal') goals++; phase = 'result'; wait = 0; }

function tick() {
  const dt = 1 / 60;
  if (phase === 'charging') power = Math.min(1, ++held / FULL);
  if (phase === 'result' && ++wait > 70) {     // next kick, or the end
    ball.p.set(0, R, 0); ball.v.set(0, 0, 0); keeper.x = 0; keeper.dir = 0; keeper.t = 0;
    power = 0; result = null;
    phase = kicks >= KICKS ? 'done' : 'aim';
  }
  if (phase !== 'flying' && phase !== 'result') return;
  // The keeper reacts 8 frames after the kick, then dives to the side he guessed at 6 m/s.
  keeper.t++;
  if (keeper.t > 8 && Math.abs(keeper.x) < 2.6) keeper.x += keeper.dir * 6 * dt;
  placeKeeper();
  // The ball flies: gravity pulls it down, the ground bounces it.
  const before = ball.p.z;
  ball.v.y -= GRAVITY * dt;
  ball.p.addScaledVector(ball.v, dt);
  if (ball.p.y < R) { ball.p.y = R; ball.v.y = ball.v.y < -1 ? -ball.v.y * 0.5 : 0; ball.v.x *= 0.99; ball.v.z *= 0.99; }
  if (phase !== 'flying') { if (ball.p.z < GOAL_Z - 1) { ball.p.z = GOAL_Z - 1; ball.v.set(0, 0, 0); } return; }
  // A save: the ball touches the keeper's box (as drawn, diving or not).
  if (new THREE.Box3().setFromObject(keeperMesh).expandByScalar(R).containsPoint(ball.p)) {
    ball.v.set(ball.v.x * 0.3, 2, 4);
    return settle('saved');
  }
  // The goal line: in, wide, over, or off the frame.
  if (before > GOAL_Z && ball.p.z <= GOAL_Z) {
    const x = Math.abs(ball.p.x), y = ball.p.y;
    if (x < POST_X - R && y < BAR_Y - R) settle('goal');
    else if (x > POST_X + R) { settle('wide'); ball.p.z = GOAL_Z + 0.01; }
    else if (y > BAR_Y + R) settle('over');
    else { settle('off the frame'); ball.v.multiplyScalar(-0.4); }
  }
  if (phase === 'flying' && (ball.v.length() < 0.5 || ball.p.z > 1)) settle('too soft');  // stopped before the goal
}

// Drawing.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fc4ea);
scene.fog = new THREE.Fog(0x8fc4ea, 30, 80);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 1.3, 2.6);
camera.lookAt(0, 1, GOAL_Z);
camera.updateMatrixWorld();
scene.add(new THREE.HemisphereLight(0xffffff, 0x406020, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-5, 10, 5);
scene.add(sun);
const add = (geometry, color, name, x, y, z, material = new THREE.MeshStandardMaterial({ color })) => {
  const m = new THREE.Mesh(geometry, material);
  m.name = name; m.position.set(x, y, z); scene.add(m); return m;
};
add(new THREE.PlaneGeometry(120, 120).rotateX(-Math.PI / 2), 0x3f9b3f, 'pitch', 0, 0, -20);
add(new THREE.BoxGeometry(30, 0.01, 0.12), 0xffffff, 'goal line', 0, 0.005, GOAL_Z);
add(new THREE.CylinderGeometry(0.06, 0.06, BAR_Y), 0xffffff, 'post', -POST_X, BAR_Y / 2, GOAL_Z);
add(new THREE.CylinderGeometry(0.06, 0.06, BAR_Y), 0xffffff, 'post', POST_X, BAR_Y / 2, GOAL_Z);
add(new THREE.CylinderGeometry(0.06, 0.06, POST_X * 2).rotateZ(Math.PI / 2), 0xffffff, 'crossbar', 0, BAR_Y, GOAL_Z);
add(new THREE.BoxGeometry(POST_X * 2, BAR_Y, 1), 0, 'net', 0, BAR_Y / 2, GOAL_Z - 0.5, new THREE.MeshBasicMaterial({ color: 0xe8e8e8, wireframe: true }));
const keeperMesh = add(new THREE.BoxGeometry(0.6, 1.85, 0.4), 0xff8a1f, 'keeper', 0, 0.925, GOAL_Z + 0.4);
const ballMesh = add(new THREE.SphereGeometry(R, 24, 16), 0xffffff, 'ball', 0, R, 0);
const marker = add(new THREE.RingGeometry(0.18, 0.26, 32), 0xffe14d, 'aim', 0, 1, GOAL_Z + 0.02, new THREE.MeshBasicMaterial({ color: 0xffe14d }));
const hud = document.getElementById('hud'), fill = document.getElementById('fill');
function placeKeeper() {                       // standing, or tipping over to lie flat as he dives
  const diving = keeper.dir && keeper.t > 8;
  keeperMesh.position.set(keeper.x, diving ? 0.45 : 0.925, GOAL_Z + 0.4);
  keeperMesh.rotation.z = diving ? -keeper.dir * Math.min(1, (keeper.t - 8) / 12) * Math.PI / 2 : 0;
  keeperMesh.updateMatrixWorld();
}

// Aim: the point on the goal's plane under the mouse. Power: how long the button is held.
const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -GOAL_Z), hit = new THREE.Vector3();
function aim(e) {
  ray.setFromCamera({ x: e.clientX / innerWidth * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }, camera);
  if (phase !== 'flying' && ray.ray.intersectPlane(plane, hit)) target.set(hit.x, Math.max(0.2, hit.y), GOAL_Z);
}
addEventListener('pointermove', aim);
renderer.domElement.addEventListener('pointerdown', e => {
  if (phase === 'done') { goals = 0; kicks = 0; phase = 'aim'; return; }
  if (phase === 'aim') { aim(e); phase = 'charging'; held = 0; power = 0; }
});
addEventListener('pointerup', () => { if (phase === 'charging') kick(); });

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
  ballMesh.position.copy(ball.p);
  placeKeeper();
  marker.position.set(target.x, target.y, GOAL_Z + 0.02);
  marker.visible = phase === 'aim' || phase === 'charging';
  fill.style.width = `${power * 100}%`;
  hud.textContent = phase === 'done' ? `${goals} of ${KICKS} scored. Click to take five more`
    : `Goals ${goals}   Kick ${Math.min(kicks + (phase === 'aim' || phase === 'charging' ? 1 : 0), KICKS)} of ${KICKS}` + (result ? `   ${result === 'goal' ? 'GOAL!' : result}` : '');
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100;
window.__game = {
  describe: () => ({ name: 'penalty kicks', mouse: 'aim at the goal, hold the button for power, release to kick', actions: { kick: '{ x, y, power }: kick at a point on the goal' } }),
  observe: () => ({ phase, goals, kicks, result, power: r2(power), guess, target: { x: r2(target.x), y: r2(target.y) },
    ball: { x: r2(ball.p.x), y: r2(ball.p.y), z: r2(ball.p.z) }, keeper: r2(keeper.x) }),
  act: ({ action, x = 0, y = 1, power: p = 0.5 }) => { if (action === 'kick' && phase === 'aim') { target.set(x, y, GOAL_Z); power = p; kick(); } },
  setState: (s) => { if (s.guess) nextGuess = s.guess; },   // fix the keeper's next guess, to test each side
  subject: 'ball',
};
</script>
</body></html>
```

The parts to recognise:

- **`aim`** turns the mouse into a point on the goal with a `THREE.Raycaster` and the goal's plane, and keeps it above the grass.
- **`kick`** points the ball at that spot, sets its speed from `power` (from 14 to 30 metres a second) and adds lift that grows with the square of the power, so the last part of the bar matters most. The keeper's guess is picked here, at the moment of the kick, so he cannot react to where the ball is going.
- **`tick`** runs once per 1/60 s. It counts the frames the button is held, moves the keeper after his reaction time, moves the ball with gravity and a bounce, and checks the save and the goal line in that order.
- **`placeKeeper`** sets the keeper's box from his state, standing or tipping over into a dive, and the save check reads that same box with `Box3.setFromObject`. What you see him cover is what he covers.
- **`setState`** lets a test fix the keeper's next guess, so each case (he guesses right, he guesses wrong) can be played on purpose.

## Power against the keeper

These are four kicks played with the mouse through paprika3d (next section), each on a fresh page; "held" is how many frames the button was down, and the keeper's guess was fixed to the right for the first two; in the other two he guessed right on his own:

| Aimed at | Held (frames) | Keeper | Result |
|---|---|---|---|
| bottom right corner | 18 | dives right | saved |
| bottom right corner | 40 | dives right | goal |
| top left corner | 45 | guessed right on his own | goal |
| top left corner | 60 | guessed right on his own | over the bar |

The soft shot to the corner gave the keeper time to get there; the same aim with more power beat him though he guessed right. Full power to the top corner rose over the bar. Change the reaction time (the 8 in `tick`) and the diving speed (the 6) to make the keeper harder or easier, and play the table again.

## When it breaks

- **The keeper saves everything.** His box is too big, or he moves the instant the ball is kicked. Give him a reaction time, a top speed and a guess that can be wrong.
- **The ball passes through the keeper.** A fast ball can move further in one frame than the keeper's box is deep, so no single frame finds it inside. Keep the box deeper than the ball moves in one frame at full speed, or test the line between the ball's last two positions; [how to make a pong game](/guides/make-a-pong-game) checks a crossing this way.
- **A goal counts twice, or a goal also counts as a save.** The goal line check runs every frame after the ball has crossed. Check the crossing (in front last frame, behind it now) and end the kick when it is decided.
- **The ball stops dead on the grass or never stops.** Friction applied on every frame the ball touches the ground is too strong, or there is none. Lose a little speed per frame while rolling, and a lot when it really bounces.
- **The power bar fills faster on one computer.** It counts drawn frames instead of 1/60 s steps; count in the fixed step, as `tick` does.

## Let the agent take the kicks

"The keeper feels unfair" is hard to act on. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser on a paused clock, so the agent can aim, hold the button for an exact number of frames, let go and follow the ball and the keeper frame by frame. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The replies below were captured on 2026-11-01 on the game above, on a server with no graphics card where Chrome draws in software. `interact` fixes the keeper's guess to the right, moves the mouse onto the bottom right corner, holds the button for 40 frames, lets go and plays until the kick has a result, with `trace` following the ball and the keeper:

```text
interact {"steps":[{"state":{"guess":"right"}},{"mouse":"move","x":874,"y":443},{"mouse":"down","x":874,"y":443},{"wait":40},{"mouse":"up","x":874,"y":443},{"until":{"phase":"result"},"max":200}],"trace":["ball.x","ball.y","ball.z","keeper"]}

{"changed":{"phase":"result","goals":1,"kicks":1,"result":"goal","power":0.68,"guess":"right","target":{"x":3.3,"y":0.39},"ball":{"x":3.34,"y":0.16,"z":-11.14},"keeper":2}}
until: phase == "result" held at frame 70
mouse move at (874, 443): over net (Mesh, 14 units)
ball.x: 0 → 3.34 at frame 70; first changed at frame 43
ball.y: 0.11 → peak 0.4 at frame 55 → 0.16 at frame 70; first changed at frame 43
ball.z: 0 → -11.14 at frame 70; first changed at frame 43
keeper: 0 → 2 at frame 70; first changed at frame 51
```

The ball left on frame 43 and crossed the line at x 3.34, inside the post, on frame 70; the keeper started his dive on frame 51 and had reached 2 when it went past. The same call holding the button for 18 frames:

```text
interact {"steps":[{"state":{"guess":"right"}},{"mouse":"move","x":874,"y":443},{"mouse":"down","x":874,"y":443},{"wait":18},{"mouse":"up","x":874,"y":443},{"until":{"phase":"result"},"max":200}],"trace":["ball.x","ball.z","keeper"]}

{"changed":{"phase":"result","kicks":1,"result":"saved","power":0.32,"guess":"right","target":{"x":3.3,"y":0.39},"ball":{"x":3.13,"z":-10.43},"keeper":2.6}}
until: phase == "result" held at frame 58
mouse move at (874, 443): over net (Mesh, 14 units)
ball.x: 0 → 3.13 at frame 58; first changed at frame 21
ball.z: 0 → -10.43 at frame 58; first changed at frame 21
keeper: 0 → 2.6 at frame 54; first changed at frame 29
```

A softer shot: it took until frame 58 to arrive, the keeper had finished his dive at 2.6 on frame 54, and the ball hit him. Then the whole game, five kicks through the game's `kick` action with `expect` checking that it ends after the fifth:

```text
interact {"steps":[{"action":"kick","x":3.3,"y":0.4,"power":0.7},{"until":{"phase":"aim"},"max":300},{"action":"kick","x":-3.3,"y":0.4,"power":0.7},{"until":{"phase":"aim"},"max":300},{"action":"kick","x":0,"y":1.2,"power":0.5},{"until":{"phase":"aim"},"max":300},{"action":"kick","x":-3.3,"y":2.1,"power":1},{"until":{"phase":"aim"},"max":300},{"action":"kick","x":3.3,"y":2.1,"power":0.75},{"until":{"phase":"done"},"max":300}],"expect":{"kicks":5,"phase":"done"}}

{"changed":{"phase":"done","goals":3,"kicks":5,"guess":"left","target":{"x":3.3,"y":2.1}}}
until: phase == "aim" held at frame 99
until: phase == "aim" held at frame 198
until: phase == "aim" held at frame 298
until: phase == "aim" held at frame 393
until: phase == "done" held at frame 491
Expect: kicks 5 ✓ · phase "done" ✓
```

paprika3d does not decide whether your keeper is fair or the game fun; it shows what each number does, and you choose by playing. The headless browser plays no sound, so a crowd's cheer is yours to listen for.

## What to do next

- A goal celebration, a net that shakes and a camera that follows the ball: [how to make a game feel good](/guides/make-a-game-feel-good).
- A second person as the keeper, on the same keyboard: [how to make a 2 player game](/guides/make-a-2-player-game).
- Shooting at a hoop instead, with a real physics engine: [how to make a basketball game](/guides/make-a-basketball-game).
- Aim and power by dragging back, and a ball that rolls to a stop: [how to make a mini golf game](/guides/make-a-mini-golf-game).
- A results screen and a rematch: [how to add a game over screen](/guides/add-a-game-over-screen).
