---
title: Claude Code plugins for game development: a three.js game from references to playtesting
phrase: claude code plugins for game development
description: What a Claude Code plugin for game development holds (skills, MCP tools, hooks), and what paprika3d's paprika-make and paprika-loop do with a three.js game, stage by stage, from the skill files: the questions, references, a look and character sheets, a design doc with the creative calls left to you, the build checked with look and interact, then a loop for a fixed time. Shown on a hot air balloon race over hills, with real tool replies, beside game studio repositories for Claude Code.
meta: Claude Code plugins for game development: paprika3d takes a three.js game from references and a design doc to a build it plays and checks.
intent: claude-code-plugins-for-game-development
queries:
  - "claude code plugins for game development"
  - "claude code game dev plugin"
  - "claude code game studios"
  - "Show HN: Claude Code skills that build complete Godot games"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# Claude Code plugins for game development: a three.js game from references to playtesting

paprika3d is a Claude Code plugin for making browser games in three.js. `/paprika3d:paprika-make <request>` takes a game from a few questions, reference pictures, a look and character sheets and a design doc (with the creative calls left to you) through the build, which Claude checks with the plugin's own tools as it goes; `/paprika3d:paprika-loop <request> for <time>` then keeps improving it unattended. Install it with:

```bash
claude plugin marketplace add Keeno-Corp/paprika3d && claude plugin install paprika3d@paprika3d
```

It needs Google Chrome, Node 20.11 or later and Claude Code 2.1.118 or later. This page says what a game plugin for Claude Code holds, walks through what `paprika-make` and `paprika-loop` do from their skill files, and checks a small balloon race with the same tools the build uses.

## What a Claude Code plugin holds

A plugin is a folder of skills, agents, hooks and MCP servers that Claude Code installs from a marketplace; `/plugin` opens the panel to browse and manage them, and a plugin's skills run as `/<plugin>:<skill>` ([Claude Code's plugin docs](https://code.claude.com/docs/en/plugins)). For game development the parts do different jobs: skills are text that tells Claude how to work, an MCP server gives it tools it can call, and hooks run at fixed points such as after an edit.

paprika3d's plugin has all three. Its MCP server runs the game in a headless Chrome on a paused clock and gives Claude `open`, `look`, `interact`, `observe`, `eval`, `feel`, `perf`, `test`, `reference`, `sheet` and the model tools. Its skills are `paprika-make`, `paprika-loop` and `paprika-publish`, which you start, and `threejs-game` with its task skills, which Claude loads by itself when it works on a three.js page. Its after-edit hook reruns the checks saved with `interact`'s `save` and speaks when one starts or stops failing.

## What to type

```text
/paprika3d:paprika-make a hot air balloon race over rolling hills: hold Space to burn and rise, the wind is faster higher up, first balloon to the flag wins
```

## What paprika-make does, stage by stage

`paprika-make` runs in your Claude Code session with you answering, and it calls a model throughout, so it was not run for this page. The stages below are what its skill file says it does, in its order; the game further down was written by hand for this page in the shape the build uses and checked with the same tools.

1. **A key check.** One `sheet` call with `check: true` names the image and 3D model keys the machine has, never their values. On the machine these replies came from:

```text
sheet {"cwd": "<project>", "check": true}

Image keys found: fal (FAL_API_KEY). Not found: gemini, openai.
Picture sheets: recommended fal (nano-banana edit keeps a reference's character and palette, no waiting, $0.04 an image); one look board and up to four turnarounds is about $0.20 a game.
3D keys found: fal (FAL_API_KEY). Not found: meshy, tripo.
3D models: recommended fal (fal-ai/hunyuan3d-v21, $0.05 and 1 to 4 min a model); a job runs in the background while the build goes on.
Sources on this machine: the library (57,732 free models, textures and skies, searched by your pictures), web search for free assets (with the session's web tools), generation with your fal key ($0.05 and 1 to 4 min a model), and building in code (model_run with Manifold, checked with model_look).
```

2. **A few questions**, multiple choice, one batch at a time: what it is, whether to search the web for study references and free models, whether to make picture sheets with your own image key, and the asset style (low-poly, stylized or toon, realistic, voxel). For a game it then asks the mechanics, the controls, how it is won and lost and what inspires it, and up to two design decisions the request leaves open and that change what the game is: the tone, the progression, the win condition. Those calls stay yours. A request that already decides everything, or "just build it", gets no questions.
3. **References.** With no pictures in the request, a subagent finds some, `sheet` draws the picks on one numbered picture, and you keep the ones you want.
4. **The sheets.** `LOOK.md` (the palette and the camera), `CHARACTERS.md` when there are characters or key props (each with a Source line: a library pick, a web file, a generated model, or built in code), and for a game `DESIGN.md` (its core loop and controls). `LOOK.png`, the references cropped side by side with their sampled colours, is made free; with an image key and a yes, a look board and front, side and back views of up to four characters.
5. **`BRIEF.md`**: what it is, a numbered Must have list (one line per sheet, such as "Plays as DESIGN.md's Core loop and Controls say"), the references with their roles, and the choices left to the builder.
6. **The build**, written from the brief and the sheets, then run: each control played with `interact`, the picture checked with `look`, and a critic subagent reading the newest pictures against the brief. The reply is four lines: how to run it, what it does, what to try next, and that `BRIEF.md` steers any change.

## The balloon race

Three balloons over rolling hills. Space burns and the balloon rises; let go and it sinks. The wind is faster higher up, so height is the steering, and a balloon that touches a hill stops until it lifts off again. The two rivals hold 6 and 8 units of height. The page follows the `window.__game` convention the plugin's skill gives, so its state reads as JSON. Save it as `index.html` beside `npm install three`.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Balloon race</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// A hot air balloon race over hills. Hold Space to burn and rise; let go to sink. The wind is faster higher up,
// so altitude is the only steering. Touching a hill stops the balloon until it lifts off again. First to x = 60 wins.
const FINISH = 60, LIFT = 3, SINK = 1.5, DRAG = 0.8, CEILING = 14;
const wind = y => 1 + 0.3 * y;                                          // units per second at height y
const hill = x => 2 + 1.5 * Math.sin(x * 0.15) + Math.sin(x * 0.37);    // the ground's height at x
const racers = [
  { name: 'balloon', x: 0, y: 4, vy: 0, colour: 0xe04030 },
  { name: 'rival-1', x: 0, y: 6, cruise: 6, colour: 0x3070d0 },
  { name: 'rival-2', x: 0, y: 8, cruise: 8, colour: 0xe0b020 },
];
const player = racers[0];
let burner = false, winner = null;

function step(dt) {
  if (winner) return;
  player.vy += ((burner ? LIFT : 0) - SINK - DRAG * player.vy) * dt;
  player.y = Math.min(CEILING, player.y + player.vy * dt);
  for (const r of racers) {
    if (r.cruise) r.y += (r.cruise - r.y) * dt;                          // the rivals hold their height
    if (r.y > hill(r.x) + 0.8) r.x += wind(r.y) * dt;                    // a landed balloon does not drift
    const ground = hill(r.x) + 0.8;                                      // the balloon's y is its basket's floor + 0.8
    if (r.y <= ground) { r.y = ground; if (r === player) player.vy = Math.max(0, player.vy); }
    if (r.x >= FINISH && !winner) winner = r.name;
  }
}

function act({ key, down = true }) { if (key === ' ') burner = down; }
addEventListener('keydown', e => act({ key: e.key }));
addEventListener('keyup', e => act({ key: e.key, down: false }));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ec9ec);
scene.fog = new THREE.Fog(0x9ec9ec, 30, 90);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 200);
scene.add(new THREE.HemisphereLight(0xffffff, 0x6a8a4a, 1.5));
const sun = new THREE.DirectionalLight(0xfff0d8, 2);
sun.position.set(-20, 30, 20);
scene.add(sun);

// The hills: a strip of ground whose height follows hill(x), so what is drawn is what the balloon lands on.
const ground = new THREE.PlaneGeometry(FINISH + 100, 60, 160, 8).rotateX(-Math.PI / 2);
const p = ground.attributes.position;
for (let i = 0; i < p.count; i++) p.setY(i, hill(p.getX(i) + FINISH / 2 + 10));   // local x + the mesh's x
ground.computeVertexNormals();
const hills = new THREE.Mesh(ground, new THREE.MeshStandardMaterial({ color: 0x6a9a4a, flatShading: true }));
hills.name = 'hills';
hills.position.set(FINISH / 2 + 10, 0, 0);
scene.add(hills);

const flag = new THREE.Group();
flag.name = 'finish';
flag.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6), new THREE.MeshStandardMaterial({ color: 0xffffff })));
flag.children[0].position.y = 3;
const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), new THREE.MeshStandardMaterial({ color: 0xd03050, side: THREE.DoubleSide }));
cloth.position.set(0.8, 5.5, 0);
flag.add(cloth);
flag.position.set(FINISH, hill(FINISH), -4);
scene.add(flag);

const meshes = {};
racers.forEach((r, i) => {
  const g = new THREE.Group();
  g.name = r.name;
  const envelope = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16).scale(1, 1.2, 1), new THREE.MeshStandardMaterial({ color: r.colour }));
  envelope.position.y = 1.9;
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), new THREE.MeshStandardMaterial({ color: 0x7a5030 }));
  basket.position.y = 0.2;
  g.add(envelope, basket);
  scene.add(g);
  meshes[r.name] = Object.assign(g, { depth: -i * 3 });   // rivals fly behind the player, so all three stay visible
});

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  for (const r of racers) meshes[r.name].position.set(r.x, r.y - 0.8, meshes[r.name].depth);
  camera.position.set(player.x + 2, player.y + 2, 14);
  camera.lookAt(player.x + 6, player.y - 1, -2);
  renderer.render(scene, camera);
});

const r2 = n => +n.toFixed(2);
const place = () => 1 + racers.filter(r => r !== player && r.x > player.x).length;
window.__game = {
  describe: () => ({ name: 'balloon race', units: 'world units, x toward the finish at 60, y up', keys: { ' ': 'hold to burn and rise; release to sink' } }),
  observe: () => ({
    balloon: { x: r2(player.x), y: r2(player.y), aboveGround: r2(player.y - 0.8 - hill(player.x)) },
    burner, place: place(), winner,
    rivals: racers.slice(1).map(r => ({ name: r.name, x: r2(r.x), y: r2(r.y) })),
  }),
  act,
  setState: s => { if (s.balloon) Object.assign(player, s.balloon); },
};
</script>
</body></html>
```

## Checking it the way the build does

Each call is followed by the reply paprika3d's stable tools gave on 2026-11-12 (pixel and hue lines left out). Run folder paths are shortened to `<project>`.

**Look at the start.**

```text
look {}

Picture: <project>/paprika3d/runs/2026-11-12T05-00-00-281Z/look-1.png
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
Surface: "hills" covers 60% with almost no detail (0.19 of 255): it reads as flat colour. Unless the user asked for flat colour, add texture, normal detail or lighting variation.
On screen (5):
hills 60% [0, 270, 1279, 799] 160 × 60 units, across the view
balloon ×2 1.8% [216, 224, 357, 429]
rival-* ×2 1.9% [246, 33, 367, 244]
Never visible: none
```

`balloon ×2` is the envelope and the basket under one name; `rival-* ×2` is the two rivals. The `Surface` line is the kind of note the build acts on next: the hills are one flat green, and a texture or colour variation would give them shape.

**Play a rule: with no burner, the balloon sinks and lands.**

```text
interact {"steps": [{"wait": 240}], "trace": ["balloon.y", "balloon.x", "balloon.aboveGround"]}

{"changed":{"balloon":{"x":1.55,"y":3.69,"aboveGround":0},"rivals":[{"name":"rival-1","x":11.25,"y":6},{"name":"rival-2","x":13.66,"y":8}]}}
balloon.y: 4 → low 3.68 at frame 41 → 3.69 at frame 42; first changed at frame 4
balloon.x: 0.04 → 1.55 at frame 42; first changed at frame 1
balloon.aboveGround: 1.18 → 0 at frame 42; first changed at frame 1
```

The balloon touched the hill on frame 42 and stopped there for the rest of the 240 frames, while the rivals drifted on.

**Play the race to the flag.** Hold Space from where it landed until someone wins, then release:

```text
interact {"steps": [{"key": " ", "down": true}, {"until": {"winner": ["balloon", "rival-1", "rival-2"]}, "max": 1500}, {"key": " ", "down": false}], "trace": ["balloon.y", "place"], "expect": {"winner": "balloon"}, "look": true}

{"changed":{"balloon":{"x":60.01,"y":14,"aboveGround":10.79},"place":1,"winner":"balloon","rivals":[{"name":"rival-1","x":48.72,"y":6},{"name":"rival-2","x":59.16,"y":8}]}}
until: winner one of "balloon", "rival-1", "rival-2" held at frame 803
Trace (the first 600 frames):
balloon.y: 3.69 → 14 at frame 392; first changed at frame 1
place: 3 → 2 at frame 521; first changed at frame 521
Expect: winner "balloon" ✓
Picture: <project>/paprika3d/runs/2026-11-12T05-00-00-281Z/look-2.png
On screen (7):
hills 36% [0, 447, 1279, 799] 160 × 60 units, across the view
balloon ×2 1.8% [216, 224, 357, 429]
rival-* ×2 0.81% [260, 498, 352, 633]
finish ×2 0.5% [335, 603, 420, 799] 1.6–6 × 0.2–1 units
Never visible: none
```

Starting 240 frames behind, the player's balloon reached its 14-unit ceiling on frame 392, passed the first rival on frame 521 and won on frame 803, with the yellow rival at x = 59.16, just short of the line at 60. That margin is a design fact the build can act on: a race this close when the player holds one key the whole way may be too easy or just right, and that call is the person's. With `save`, the same steps become a check the after-edit hook reruns.

## Then paprika-loop, for a fixed time

```text
/paprika3d:paprika-loop a hot air balloon race over rolling hills for 2 hours
```

`paprika-loop` asks the same questions and writes the brief to `paprika-loop/PROMPT.md`, then starts a driver in the background and stops. The driver runs one `claude -p` session after another: a builder that makes as many improvements as fit, then a read-only judge that scores the page against the brief's Must have list and writes the next three improvements. It commits after each, tags the best-scored commit `paprika-loop/best`, and runs until the time is up. You can change `PROMPT.md` while it runs; `PROGRESS.md` holds each session's notes, `loop.json` the scores and commits, and `REPORT.md` appears at the end. It needs `claude` and `git` on PATH, and every session in it is a full Claude Code session.

## Beside game studio repositories for Claude Code

Other projects bring game development to Claude Code with skills and agents. [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) is a template its README describes as 75 skills and 49 agents: `/prototype` asks a few questions, writes a one-page brief and builds a browser game, which a few scripted key presses in a headless browser check before you get it, and `/setup-engine` sets up Godot 4, Unity or Unreal Engine 5 for a game that grows past the browser. The Hacker News post "Claude Code skills that build complete Godot games" shows a set of skills for Godot. Both carry their method in skills and agents for Claude Code to follow. paprika3d is narrower: three.js in the browser, with an MCP server that reads the running scene (named objects on screen, state on exact frames, triangles and draw calls per object), so Claude checks each change against the page itself.

## What paprika3d does not do

- It makes browser games in three.js (and React Three Fiber). It does not drive the Unity, Godot or Unreal editors, or build for consoles or app stores.
- `paprika-make`, `paprika-loop`, `paprika-publish` and the after-edit hook are Claude Code features. Cursor, Codex and other MCP clients get the tools and the `threejs-*` skills.
- Picture sheets and generated models use your own image or 3D model key, billed to you; without one, LOOK.png and the free sources still work.
- It does not judge whether the game is fun, and it leaves the design calls to you. Multiplayer, real phones and real GPU timings are outside it: without a GPU, Chrome draws WebGL in software.

## Related

- [How to make a game with Claude Code](/guides/make-a-game-with-claude-code): from install to a first game, for someone who has never used a terminal.
- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): keys on exact frames and checks that rerun.
- [Screenshot a three.js scene headless from a coding agent](/guides/screenshot-threejs-scene-headless): the `look` call itself.
- [three.js skills for Claude Code](/guides/threejs-skills-for-claude-code): what the plugin's skills tell the agent, and `npx skills add` for other agents.
- [Can Claude Code see the browser?](/guides/claude-code-see-the-browser): Claude Code's own browser tools beside the plugin's.
- [Build a three.js game with an AI agent, and check what it made before you trust it](/guides/ai-agent-build-threejs-game).
