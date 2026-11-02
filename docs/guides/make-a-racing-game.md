---
title: How to make a racing game in three.js: a kart, a track and laps
phrase: how to make a racing game
description: How to make a racing game in the browser, for someone who has never made one: a kart with gas, brakes and steering that depends on its speed, grip so it does not slide like ice, a track with sand that slows it, checkpoints that count a lap when passed in order, three laps against the clock and a chase camera, on a small three.js desert kart race you can paste; and how a coding agent with paprika3d drives it, measures the slide and checks the lap rules.
meta: How to make a racing game in three.js: a kart that steers and grips, a track, checkpoints in order, laps and a chase camera.
intent: make-a-racing-game
queries:
  - "how to make a racing game in html"
  - "threejs car game"
  - "Vehicle physics with Cannon.js"
  - "Tutorial on using THREE.js with physics library CANNON.js to create a car racing game"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make a racing game in three.js: a kart, a track and laps

A racing game needs four things: a car that keeps a speed and turns at a rate that depends on that speed, tyres that grip so the car goes where it points, a track that is faster than the ground around it, and checkpoints that count a lap when they are passed in order, and not otherwise. Each of those is a few lines of arithmetic run once per frame, with no physics engine. That arcade car comes first; real suspension and wheels that bounce over bumps are a later step with a physics engine, and many good racing games never take it.

Some words used below. **three.js** is a JavaScript library that draws 3D scenes in a web page. A **frame** is one picture of the game; browsers draw about 60 a second, and the **game loop** is the function that runs once per frame, moves everything a little and draws. **Velocity** is speed with a direction: how fast the kart moves and which way.

## Gas, brakes and steering that depends on speed

Keep the kart's position, the way it points (its **heading**, an angle) and its velocity. The up arrow adds to the forward speed each frame, the down arrow takes it away and then reverses slowly, and a little **drag** takes some speed away every frame so the kart rolls to a stop when you let go.

Steering changes the heading, and how fast it turns depends on the speed: a parked kart does not spin on the spot, and below a walking pace it turns slowly. The game multiplies the turn by `Math.min(1, Math.abs(forward) / 8)`, so the kart steers fully from 8 units a second, and by the sign of the speed, so steering in reverse turns the way a real car does.

## Grip: why the first car slides like ice

A first car usually does one of two things. Either its velocity turns with it exactly, so it goes where it points like a train on rails and can never slide, or the car turns and keeps its old velocity, so it spins while carrying on in a straight line, like a puck on ice. Real tyres sit between the two: they roll freely forward and resist sliding sideways.

So each frame, split the velocity into two parts: **forward**, along the way the kart points, and **sideways**, across it. Change the forward part with the gas and brakes. Shrink the sideways part a lot, here by `Math.exp(-grip * dt)`: with `grip = 8` most of a slide is gone in a fraction of a second. Then put the two parts back together. Steering turns the kart but not its velocity, so in a turn some of the velocity becomes sideways, and grip takes it away over the next frames. A low `grip` gives a drifty kart, a high one a kart on rails.

## The track, the sand and the laps

The track is an oval ring. Inside the outer oval and outside the inner one is track; anywhere else is sand, where the top speed is 8 instead of 22 units a second, so cutting a corner costs time.

A lap is not "crossing the start line": a player could cross it backwards and forwards. Cut the oval into four quarters and keep one number, the next quarter to reach. Entering quarter 1, then 2, then 3 moves it on, and entering quarter 0 after quarter 3 counts a lap. Driving back over the line skips the checkpoints and counts nothing. The gate to reach next is yellow, so the player knows where to go. Three laps end the race and stop the clock.

## A chase camera

The camera sits at a point behind and above the kart and moves toward that point a little each frame instead of jumping there, so it swings smoothly round the bends. It always looks a little ahead of the kart. [The three.js third-person camera follow](/guides/threejs-third-person-camera-follow) goes further, with frame-rate independent smoothing and a camera that does not go through walls.

## The whole game: desert kart

A red kart, a grey oval in the desert, three laps against the clock. The arrow keys or WASD drive, and R races again after the finish. Save it as `index.html` in a new folder, run `npm install three` there (this downloads three.js into the folder), start a small web server in the folder with `python3 -m http.server 8000`, and open `http://localhost:8000` in your browser. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Desert kart</title>
<style>html,body{margin:0;overflow:hidden;background:#f0c987}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#3a2410;font:600 20px system-ui}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const A = 30, B = 18, HALF = 4;            // the track: an oval 30 by 18 units from the middle, 8 units wide
const LAPS = 3;
const ACCEL = 14, BRAKE = 20, MAX = 22, SAND = 8, DRAG = 0.6;   // speeds in units per second
const TURN = 2.2;                          // steering, in radians per second at full turning speed
const held = new Set();
const hud = document.getElementById('hud');
let kart, lap, next, time, finished, placed = false;
let grip = 8;                              // how fast the tyres stop a sideways slide; near 0 drives like ice

function reset() {
  kart = { x: 0, z: B, heading: -Math.PI / 2, vx: 0, vz: 0 };   // on the start line, facing along the track
  lap = 0; next = 1; time = 0; finished = false;
}
reset();

const onTrack = (x, z) => (x / (A + HALF)) ** 2 + (z / (B + HALF)) ** 2 <= 1 && (x / (A - HALF)) ** 2 + (z / (B - HALF)) ** 2 >= 1;
// Which quarter of the lap the kart is in, 0 to 3, counting from the start line in the driving direction.
const quarter = (x, z) => Math.floor((((Math.PI / 2 - Math.atan2(z, x)) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) / (Math.PI / 2));
const axes = (h) => ({ f: [-Math.sin(h), -Math.cos(h)], r: [Math.cos(h), -Math.sin(h)] });   // forward and right on the ground

function step(dt) {
  if (finished) return;
  time += dt;
  const { f, r } = axes(kart.heading);
  let forward = kart.vx * f[0] + kart.vz * f[1];   // split the velocity into along the kart and sideways
  let side = kart.vx * r[0] + kart.vz * r[1];
  const gas = held.has('ArrowUp') || held.has('KeyW'), brake = held.has('ArrowDown') || held.has('KeyS');
  if (gas) forward += ACCEL * dt;
  if (brake) forward -= BRAKE * dt;
  forward -= forward * DRAG * dt;
  const max = onTrack(kart.x, kart.z) ? MAX : SAND;   // sand holds the kart back
  if (forward > max) forward = Math.max(max, forward - 30 * dt);
  forward = Math.max(forward, -6);
  side *= Math.exp(-grip * dt);                     // grip: most of the sideways slide is gone each frame
  const steer = (held.has('ArrowLeft') || held.has('KeyA') ? 1 : 0) - (held.has('ArrowRight') || held.has('KeyD') ? 1 : 0);
  kart.vx = f[0] * forward + r[0] * side;
  kart.vz = f[1] * forward + r[1] * side;
  // Steering turns the kart, not its velocity: what is left over shows up as a sideways slide next frame, for grip to remove.
  kart.heading += steer * TURN * dt * Math.min(1, Math.abs(forward) / 8) * Math.sign(forward);   // no turning on the spot
  kart.x += kart.vx * dt;
  kart.z += kart.vz * dt;
  // Checkpoints in order: quarters 1, 2 and 3, then back to quarter 0 counts a lap. Cutting back over the line counts nothing.
  const q = quarter(kart.x, kart.z);
  if (next < 4 && q === next) next++;
  else if (next === 4 && q === 0) { lap++; next = 1; if (lap === LAPS) finished = true; }
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf6dcae);
scene.fog = new THREE.Fog(0xf6dcae, 60, 140);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 300);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xfff4e0, 0x8a6a40, 2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(20, 40, 10);
scene.add(sun);
const mat = (color) => new THREE.MeshStandardMaterial({ color });

const sand = new THREE.Mesh(new THREE.PlaneGeometry(300, 300).rotateX(-Math.PI / 2), mat(0xe8c48a));
sand.name = 'sand';
scene.add(sand);
const shape = new THREE.Shape().absellipse(0, 0, A + HALF, B + HALF, 0, Math.PI * 2);
shape.holes.push(new THREE.Path().absellipse(0, 0, A - HALF, B - HALF, 0, Math.PI * 2, true));
const track = new THREE.Mesh(new THREE.ShapeGeometry(shape, 96).rotateX(-Math.PI / 2), mat(0x55504a));
track.name = 'track';
track.position.y = 0.02;
scene.add(track);
const gates = [0, 1, 2, 3].map(k => {      // a gate across the track at the start of each quarter
  const a = Math.PI / 2 - k * Math.PI / 2, gate = new THREE.Group();
  gate.name = k === 0 ? 'start gate' : 'gate';
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4), mat(0xffffff));
    post.position.set(Math.cos(a) * (A + s * (HALF + 0.5)), 2, Math.sin(a) * (B + s * (HALF + 0.5)));
    gate.add(post);
  }
  const banner = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 10), mat(0xcccccc));
  banner.position.set(Math.cos(a) * A, 4, Math.sin(a) * B);
  banner.rotation.y = Math.PI / 2 - a;
  gate.add(banner);
  scene.add(gate);
  return banner;
});
for (let i = 0; i < 14; i++) {             // cacti around the desert, placed by a fixed pattern
  const a = i * 2.4, d = i % 2 ? 0.55 : 1.45;
  const cactus = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 4), mat(0x4f8a3c));
  cactus.name = 'cactus';
  cactus.position.set(Math.cos(a) * A * d, 2, Math.sin(a) * B * d);
  scene.add(cactus);
}
const car = new THREE.Group();
car.name = 'kart';
const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.6), mat(0xd23a2a));
body.position.y = 0.5;
const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.8), mat(0x222222));
seat.position.set(0, 0.9, 0.4);
car.add(body, seat);
for (const [x, z] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) {
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12).rotateZ(Math.PI / 2), mat(0x111111));
  wheel.position.set(x, 0.35, z);
  car.add(wheel);
}
scene.add(car);

const clockText = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
let last = null;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
  last = now;
  step(dt);
  car.position.set(kart.x, 0, kart.z);
  car.rotation.y = kart.heading;
  gates.forEach((g, k) => g.material.color.set(k === next % 4 && !finished ? 0xffd23a : 0xcccccc));   // the gate to reach next is yellow
  // Chase camera: a point behind and above the kart, approached smoothly.
  const { f } = axes(kart.heading);
  const behind = new THREE.Vector3(kart.x - f[0] * 9, 4.5, kart.z - f[1] * 9);
  camera.position.lerp(behind, placed ? 1 - Math.exp(-5 * dt) : 1);
  placed = true;
  camera.lookAt(kart.x + f[0] * 4, 1, kart.z + f[1] * 4);
  hud.textContent = finished ? `Finished! ${LAPS} laps in ${clockText(time)}. Press R to race again.` : `Lap ${Math.min(lap + 1, LAPS)} of ${LAPS}   ${clockText(time)}`;
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

const act = ({ key, down = true }) => {
  if (down) held.add(key); else held.delete(key);
  if (down && key === 'KeyR' && finished) reset();
};
addEventListener('keydown', e => act({ key: e.code }));
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('blur', () => held.clear());
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.__game = {
  subject: 'kart',
  describe: () => ({ name: 'desert kart', keys: { ArrowUp: 'accelerate', ArrowDown: 'brake, then reverse', ArrowLeft: 'steer left', ArrowRight: 'steer right', KeyW: 'as ArrowUp', KeyS: 'as ArrowDown', KeyA: 'as ArrowLeft', KeyD: 'as ArrowRight', KeyR: 'race again after the finish' } }),
  observe: () => {
    const { f, r } = axes(kart.heading);
    return {
      kart: { x: +kart.x.toFixed(2), z: +kart.z.toFixed(2), heading: +kart.heading.toFixed(2),
        speed: +(kart.vx * f[0] + kart.vz * f[1]).toFixed(2), slide: +(kart.vx * r[0] + kart.vz * r[1]).toFixed(2) },
      onTrack: onTrack(kart.x, kart.z), lap, next, time: +time.toFixed(2), finished,
    };
  },
  act,
  setState: (s) => {
    if (s.kart) {
      const { f } = axes(s.kart.heading ?? kart.heading), speed = s.kart.speed ?? 0;
      kart = { ...kart, ...s.kart, vx: f[0] * speed, vz: f[1] * speed };
      placed = false;                       // the camera jumps to the kart instead of flying across the map
    }
    if (s.lap !== undefined) lap = s.lap;
    if (s.next !== undefined) next = s.next;
    if (s.time !== undefined) time = s.time;
    if (s.finished !== undefined) finished = s.finished;
    if (s.grip !== undefined) grip = s.grip;
  },
};
</script>
</body></html>
```

The `window.__game` object at the end is for testing tools: it lets them read the kart's speed and slide, put it anywhere on the track, change the grip, and press keys through `act`. The game plays without it.

## What to type to an AI coding agent

An **AI coding agent** (Claude Code, Codex, Cursor and others) is an assistant that writes files on your computer and runs commands. "Make a car game" leaves every rule to its guess. Say what decides how it drives and how a race is won:

```text
Make a three.js kart racing game in one index.html.
A red kart on an oval track in the desert, three laps against the clock.
Arrow keys: gas, brake and reverse, steer. Steering depends on speed, so it cannot turn when stopped.
Give the tyres grip: split the velocity into forward and sideways and remove most of the sideways part each frame.
Sand off the track lowers the top speed. Four checkpoints count a lap only in order.
A chase camera follows behind the kart. Put the speeds and the grip as numbers at the top.
```

[The AI prompt to make a game](/guides/ai-prompt-to-make-a-game) says what else a request should name.

## When the car breaks

- **It spins in place when parked.** Steering does not depend on speed.
- **It slides like it is on ice, or turns like a train on rails.** The sideways part of the velocity is never removed, or is removed all at once. Tune `grip`.
- **It is fast on one computer and slow on another.** Speeds and turns are not multiplied by `dt`, the time since the last frame.
- **Laps count when you reverse over the line.** The lap is counted at the line, not after the checkpoints in order.
- **The camera shakes or lags far behind.** It jumps to the target point each frame, or approaches it too slowly; move a fixed share of the way each frame, scaled by `dt`.
- **The kart drives through the scenery.** Nothing checks for it: hitting cacti and walls is collision, covered in [collision detection without a physics engine](/guides/threejs-collision-detection-without-physics-engine).

## Let the agent drive it itself

Handling is hard to describe in words ("it feels slidey") and hard to check by reading code. paprika3d is a plugin for Claude Code (and an MCP server for other coding agents) that lets the agent open the page in a headless Chrome (a browser with no window), hold keys for an exact number of frames, each 1/60 s of game time, and read the numbers back. Install it in Claude Code with:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

These replies were captured on 2026-10-30 on the game above, on a Linux server with no GPU. `interact` steers while parked, then accelerates, then steers at speed, with `trace` following the numbers on every frame:

```text
interact {"steps":[{"key":"ArrowLeft","frames":30}],"trace":["kart.heading"]}

{"changed":{"time":0.52}}
kart.heading: -1.57 throughout the 30 frames

interact {"steps":[{"key":"ArrowUp","frames":90}],"trace":["kart.speed","kart.x"]}

{"changed":{"kart":{"x":11.96,"speed":13.75},"time":2.02}}
kart.speed: 0 → 13.75 at frame 90; first changed at frame 1
kart.x: 0 → 11.96 at frame 90; first changed at frame 2

interact {"steps":[{"key":"ArrowUp","down":true,"frames":0},{"key":"ArrowLeft","frames":30},{"key":"ArrowUp","down":false}],"trace":["kart.heading","kart.slide","kart.speed"]}

{"changed":{"kart":{"x":18.58,"z":15.52,"heading":-0.47,"speed":13.22,"slide":3.44},"time":2.53}}
Motion (kart): travelled 7.32 units (7.07 from start to end), its direction of travel turned 48° left.
kart.heading: -1.57 → -0.47 at frame 30; first changed at frame 1
kart.slide: 0 → peak 3.94 at frame 29 → 3.44 at frame 31; first changed at frame 1
kart.speed: 13.75 → peak 14.05 at frame 7 → 13.22 at frame 31; first changed at frame 1
```

Parked, the heading did not move in 30 frames of steering. After 90 frames of gas the kart was at 13.75 units a second. Steering at that speed, the kart's direction of travel turned 48° and it slid sideways at 3.94 at most. The same turn from the same spot with `grip` set to 1 by a `{ state }` step:

```text
interact {"steps":[{"state":{"kart":{"x":11.96,"z":18,"heading":-1.57,"speed":13.75},"grip":1}},{"key":"ArrowUp","down":true,"frames":0},{"key":"ArrowLeft","frames":30},{"key":"ArrowUp","down":false}],"trace":["kart.heading","kart.slide","kart.speed"]}

{"changed":{"kart":{"x":19.64,"z":17.2,"speed":9.76,"slide":10.76},"time":3.07}}
Motion (kart): travelled 7.52 units (7.49 from start to end), its direction of travel turned 15° left.
kart.heading: -1.57 → -0.47 at frame 30; first changed at frame 1
kart.slide: 0 → peak 10.94 at frame 30 → 10.76 at frame 31; first changed at frame 1
kart.speed: 13.61 → peak 13.85 at frame 5 → 9.76 at frame 31; first changed at frame 1
```

The kart turned exactly as far (its heading went to -0.47 again), but its direction of travel turned just 15° and it slid at up to 10.94: the ice car, measured. Then the lap rules, each started next to the line with a `{ state }` step and checked with `expect`: a lap after all the checkpoints, no lap when two were skipped, and the finish at the end of lap 3:

```text
interact {"steps":[{"state":{"kart":{"x":-6,"z":17.5,"heading":-1.57,"speed":15},"lap":0,"next":4,"grip":8}},{"wait":40}],"expect":{"lap":1,"next":1}}

{"changed":{"kart":{"x":2.36,"z":17.49,"heading":-1.57,"speed":9.93,"slide":0},"lap":1,"time":3.75}}
Expect: lap 1 ✓ · next 1 ✓

interact {"steps":[{"state":{"kart":{"x":-6,"z":17.5,"heading":-1.57,"speed":15},"lap":0,"next":2}},{"wait":40}],"expect":{"lap":0}}

{"changed":{"lap":0,"next":2,"time":4.43}}
Expect: lap 0 ✓

interact {"steps":[{"state":{"kart":{"x":-6,"z":17.5,"heading":-1.57,"speed":15},"lap":2,"next":4,"time":61.5}},{"wait":40}],"expect":{"finished":true}}

{"changed":{"kart":{"x":0.07,"z":17.5,"speed":11.32},"lap":3,"next":1,"time":61.97,"finished":true}}
Motion (kart): travelled 5.82 units, it stopped at frame 27 and did not move again.
Expect: finished true ✓
```

`look` with `cameras` pictures the same moment from a top view and from behind the kart, and says what each shows:

```text
look {"cameras":[{"position":[0,75,1],"lookAt":[0,0,0],"label":"top"},{"position":[-9,4.5,18],"lookAt":[4,1,18],"label":"chase"}]}

top: subject kart 0.04%; on screen: sand, track, cactus ×14, gate ×9, start gate ×3, kart ×6; pixels: brightness 74%, colour saturation 41%, 0% near black, 0% blown out
chase: subject kart 1.6%; on screen: sand, track, start gate ×3, cactus ×5, kart ×6, gate ×2; pixels: brightness 64%, colour saturation 32%, 0% near black, 0% blown out
```

(Lines naming the picture files and one line of lighting advice are left out of that reply.) The top view is how a missing gate or a track that does not close shows up at a glance. What paprika3d does not do: it does not tell you whether the kart is fun to drive. Whether 3.94 of slide is too little, or the sand too harsh, is your call; the agent changes `grip` or `SAND` when you say so and measures again. It has no gamepad or steering wheel, and it cannot hear an engine sound.

## Where to go next

- Bumps, jumps and suspension need a physics engine. The three.js forum thread "Vehicle physics with Cannon.js" is about building a car on that engine; [how to make a physics game](/guides/make-a-physics-game) covers choosing and adding an engine.
- Keep your quickest race time between visits: [save the high score](/guides/save-the-high-score) stores one number, and a race time is one number too.
- An engine hum, a skid and a lap chime: [make sound effects for a game](/guides/make-sound-effects-for-a-game).
- New to asking an agent and checking its work: [what changes when an AI agent can see and play its three.js game](/guides/ai-agent-build-threejs-game).
- Flying instead of driving: [how to make a plane game](/guides/make-a-plane-game).
- Riding ramps and rails instead of laps: [how to make a skateboarding game](/guides/make-a-skateboarding-game).
