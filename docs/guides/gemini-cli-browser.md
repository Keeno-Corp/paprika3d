---
title: Gemini CLI browser tools for a three.js game, the paprika3d extension, and Qwen Code
phrase: gemini cli browser
description: The Gemini CLI's browser options on a three.js canvas (the built-in browser agent, off by default and driven by the accessibility tree, and Chrome DevTools or Playwright as MCP servers), how to add paprika3d with gemini mcp add or as a Gemini extension, and the same server in Qwen Code, on a skee-ball lane where each roll reports the ring the ball dropped into.
meta: Gemini CLI browser tools on a three.js game: the browser agent, MCP servers, paprika3d by gemini mcp add, and the same settings in Qwen Code.
intent: gemini-cli-browser
queries:
  - "gemini cli browser"
  - "gemini cli browser agent"
  - "gemini cli playwright mcp"
  - "qwen code browser"
  - "qwen code playwright mcp"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# Gemini CLI browser tools for a three.js game, the paprika3d extension, and Qwen Code

The Gemini CLI has a browser agent built in, `browser_agent`, which is off until you enable it in `settings.json` and works a Chrome page through its accessibility tree; Chrome DevTools and Playwright plug in as MCP servers. A three.js game puts everything inside one `<canvas>` element, so none of these sees a ball or a ring as something to act on. For named objects, exact frames and the game's state, add paprika3d as an MCP server, in one line:

```bash
gemini mcp add paprika npx -y paprika3d serve
```

That writes the server into the project's `.gemini/settings.json`; add `-s user` to write `~/.gemini/settings.json` instead, per [the Gemini CLI's MCP page](https://geminicli.com/docs/tools/mcp-server/). paprika3d's `open` loads the page in a headless Chrome on a paused clock, `look` names what is on screen with pixel boxes, and `interact` holds keys for an exact number of frames and reports what the game did. The game here is skee-ball: hold Space to wind up, let go, and the ball rolls up a ramp into a ring.

## The browser options in the Gemini CLI

Read on 2026-11-12 from Google's and each project's docs. This page did not run the Gemini CLI or Qwen Code, so every line in this section is untested here.

| Option | What it is | Source |
|---|---|---|
| The browser agent | A subagent, `browser_agent`, that navigates, fills forms, clicks and reads pages "using the accessibility tree", through a Chrome DevTools MCP server bundled with the CLI; it needs Chrome 144 or later | [Subagents, Browser Agent](https://geminicli.com/docs/core/subagents/) |
| Chrome DevTools MCP | Installed as a Gemini extension: `gemini extensions install --auto-update https://github.com/ChromeDevTools/chrome-devtools-mcp` | [its README](https://github.com/ChromeDevTools/chrome-devtools-mcp) |
| Playwright MCP | Any stdio server goes in with `gemini mcp add`; from Playwright MCP's standard config that is `gemini mcp add playwright npx @playwright/mcp@latest` | [its README](https://github.com/microsoft/playwright-mcp) |

The docs say "The browser agent is disabled by default" and turn it on with this in `settings.json`:

```json
{ "agents": { "overrides": { "browser_agent": { "enabled": true } } } }
```

By default the agent picks elements by their `uid` in the accessibility tree; for tasks such as "click the yellow button" the docs add a visual agent, set by a `visualModel` under the same override. The Gemini CLI's README also says that free individual access and Google AI Pro and Ultra moved to the Antigravity CLI on June 18, 2026, and that the Gemini CLI now serves Gemini Code Assist Standard and Enterprise. On one of those plans, the [Antigravity browser agent guide](/guides/antigravity-browser-agent) covers that browser and paprika3d's entry in Antigravity's `mcp_config.json`.

## What the page offers a browser agent

The skee-ball page below has no buttons, links or text: its body is one canvas that three.js draws into. `open` says so in its reply, shown here with the lines used:

```text
open {"url":"index.html","cwd":"<project>"}

Opened http://127.0.0.1:38983/index.html in 0.1 s, paused at frame 0.
Page text outside the canvas: none
{"name":"skee-ball","units":"metres, y up, the lane runs down -z to the ramp at z -6, the rings centred at z -8.4","keys":{"ArrowLeft":"slide left","ArrowRight":"slide right","Space":"hold to wind up, let go to roll","KeyR":"restart"}}
```

The last line is the game's own `describe()`, read from `window.__game`: its controls and units, which no element on the page carries.

## Add paprika3d to the Gemini CLI

`gemini mcp add` above writes this entry, which you can also paste into `settings.json` yourself. `/mcp` inside a session lists the servers and their tools.

```json
{ "mcpServers": { "paprika": { "command": "npx", "args": ["-y", "paprika3d", "serve"] } } }
```

**As an extension.** A Gemini extension is a folder with a `gemini-extension.json` at its root, per [the extensions reference](https://geminicli.com/docs/extensions/reference/). paprika3d's (in `templates/agents/gemini/` of its development repo) is not yet in the public repository, so `gemini extensions install` has nothing to fetch from it. To get the same thing now, save this as `gemini-extension.json` in a folder named `paprika3d` (the docs expect the name to match the folder) and run `gemini extensions link <that folder>`; this was not run here. Use it or `gemini mcp add`, not both: a server of the same name in `settings.json` wins.

```json
{
  "name": "paprika3d",
  "version": "0.1.0",
  "mcpServers": { "paprika": { "command": "npx", "args": ["-y", "paprika3d", "serve"] } }
}
```

The skills, short notes on when to call each tool, install with `npx skills add Keeno-Corp/paprika3d -a gemini-cli`, into `.agents/skills/`, a folder [the Gemini CLI's skills page](https://geminicli.com/docs/cli/skills/) lists among the ones it reads.

## The game: skee-ball

Left and Right slide the ball along the foul line, Space held winds up for up to a second, and letting go rolls the ball at 3 to 7 metres a second. It slows on the lane, leaves the ramp at 35 degrees and lands on a board of five rings. Save it as `index.html` beside `node_modules/three` (`npm install three`):

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Skee-ball</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rules: Left and Right slide the ball across the foul line, hold Space to wind up (a full wind-up takes 1 s), let go
// to roll. The ball slows on the lane, jumps off the ramp at its end and drops into a ring on the board. Units are metres.
const LANE = 6, FRICTION = 0.5, ANGLE = 35 * Math.PI / 180, GRAVITY = 9.8, BOARD_Y = 0.3, CENTRE = -8.4;
const RINGS = [[50, 0.15], [40, 0.4], [30, 0.65], [20, 0.9], [10, 1.15]];   // points and outer radius, middle first
const held = new Set();
let ball, phase, power, score, balls, last;
const newBall = () => { ball = { x: 0, y: 0.1, z: 0, vy: 0, vz: 0 }; phase = 'aim'; power = 0; };
function start() { newBall(); score = 0; balls = 0; last = null; }
function step(dt) {
  if (phase === 'aim' || phase === 'windup') {
    ball.x = Math.max(-0.5, Math.min(0.5, ball.x + ((held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0)) * dt));
    if (phase === 'windup') power = Math.min(1, power + dt);
  } else if (phase === 'lane') {
    ball.z -= ball.vz * dt;
    ball.vz -= FRICTION * dt;
    ball.y = 0.1 + Math.max(0, Math.min(1, (-ball.z - (LANE - 0.6)) / 0.6)) * (BOARD_Y - 0.1);   // up the ramp's last 0.6 m
    if (ball.z <= -LANE) { ball.vy = ball.vz * Math.sin(ANGLE); ball.vz *= Math.cos(ANGLE); ball.y = BOARD_Y; phase = 'air'; }
  } else if (phase === 'air') {
    ball.z -= ball.vz * dt;
    ball.vy -= GRAVITY * dt;
    ball.y += ball.vy * dt;
    if (ball.y <= BOARD_Y) {   // landed on the board: which ring is it in?
      ball.y = BOARD_Y;
      const r = Math.hypot(ball.x, ball.z - CENTRE), ring = RINGS.find(([, outer]) => r < outer);
      last = ring ? { ring: `${ring[0]} ring`, points: ring[0], x: +ball.x.toFixed(2), z: +ball.z.toFixed(2) }
                  : { ring: null, points: 0, gutter: ball.z > CENTRE ? 'short' : 'long', x: +ball.x.toFixed(2), z: +ball.z.toFixed(2) };
      score += last.points; balls++; phase = 'rest';   // the ball stays in its ring until the next key
    }
  }
}
function key(code, down) {
  if (code === 'KeyR') { if (down) start(); return; }
  if (down) held.add(code); else held.delete(code);
  if (down && phase === 'rest') newBall();   // any key brings the next ball to the foul line
  if (code === 'Space' && down && phase === 'aim') { phase = 'windup'; power = 0; }
  if (code === 'Space' && !down && phase === 'windup') { ball.vz = 3 + 4 * power; phase = 'lane'; }   // 3 m/s untouched, 7 m/s at a full wind-up
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a2238);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 2.8);
camera.lookAt(0, 0.1, -5);
scene.add(new THREE.HemisphereLight(0xfff2e0, 0x30283a, 2.2));
const lamp = new THREE.PointLight(0xffe0b0, 30, 20);
lamp.position.set(0, 3, -7);
scene.add(lamp);
const wood = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
const lane = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, LANE - 0.6), wood(0xc8955a));
lane.name = 'lane'; lane.position.set(0, -0.025, -(LANE - 0.6) / 2); scene.add(lane);
const ramp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.64), wood(0xa87440));
ramp.name = 'ramp'; ramp.rotation.x = Math.atan2(BOARD_Y - 0.1, 0.6); ramp.position.set(0, (BOARD_Y - 0.1) / 2 - 0.025, -LANE + 0.3); scene.add(ramp);
const board = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 3.2), wood(0x5a3a6a));
board.name = 'board'; board.position.set(0, BOARD_Y - 0.125, CENTRE); scene.add(board);
for (const x of [-0.65, 0.65]) {
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, LANE), wood(0x6a4a2a));
  rail.name = 'rail'; rail.position.set(x, 0.05, -LANE / 2); scene.add(rail);
}
RINGS.forEach(([points, outer], i) => {   // the 50 is a disc; the others are flat rings around it
  const inner = i ? RINGS[i - 1][1] : 0;
  const m = new THREE.Mesh(inner ? new THREE.RingGeometry(inner, outer, 48) : new THREE.CircleGeometry(outer, 48),
    new THREE.MeshStandardMaterial({ color: [0xf2c623, 0xe2483a, 0x2f9fd0, 0x4ac060, 0xf2f2f2][i], side: THREE.DoubleSide }));
  m.name = `${points} ring`; m.rotation.x = -Math.PI / 2; m.position.set(0, BOARD_Y - 0.099 + 0.001 * (5 - i), CENTRE); scene.add(m);
});
const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), new THREE.MeshStandardMaterial({ color: 0x8a2be2, roughness: 0.3 }));
ballMesh.name = 'ball'; scene.add(ballMesh);

addEventListener('keydown', e => { if (!e.repeat) key(e.code, true); });
addEventListener('keyup', e => key(e.code, false));
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

start();
let prev = null;
renderer.setAnimationLoop(now => {
  step(prev === null ? 1 / 60 : Math.min((now - prev) / 1000, 0.1));
  prev = now;
  ballMesh.position.set(ball.x, ball.y, ball.z);
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100;
window.__game = {
  describe: () => ({ name: 'skee-ball', units: 'metres, y up, the lane runs down -z to the ramp at z -6, the rings centred at z -8.4',
    keys: { ArrowLeft: 'slide left', ArrowRight: 'slide right', Space: 'hold to wind up, let go to roll', KeyR: 'restart' } }),
  observe: () => ({ phase, power: r2(power), ball: { x: r2(ball.x), y: r2(ball.y), z: r2(ball.z) }, score, balls, last }),
  act: ({ key: code, down = true }) => key(code, down),
  setState: s => { if ('last' in s) last = s.last; if ('score' in s) score = s.score; if ('balls' in s) balls = s.balls; },
};
</script>
</body></html>
```

`last` in `observe()` is the last roll: the ring and its points, or `gutter` with `short` or `long`, and where the ball came down.

## The calls, and the replies

Captured on 2026-11-12 by calling paprika3d's MCP server directly, on a Linux host with no graphics card. The Gemini CLI or Qwen Code would get these replies from the same server. Run folders are shortened to `<project>`, and the `look` reply is cut to the lines used here.

**Look down the lane.**

```text
look {}

Picture: <project>/paprika3d/runs/2026-11-12T05-06-44-454Z/look-1.png
On screen (11):
lane 8.2% [448, 403, 831, 728] 5.4 × 1.2 units, along the view
rail ×2 2.4% [414, 376, 865, 728] 6 × 0.2 units, along the view
board 0.49% [510, 326, 769, 362] 3.2 × 2.6 units
ramp 0.43% [571, 370, 708, 402] 1.2 × 0.64 units
ball 0.33% [608, 651, 671, 717]
10 ring 0.14% [541, 330, 738, 351] 2.3 × 2.3 units
20 ring 0.099% [563, 332, 716, 348] 1.8 × 1.8 units
30 ring 0.066% [584, 334, 695, 345] 1.3 × 1.3 units
40 ring 0.036% [606, 336, 673, 343] 0.8 × 0.8 units
50 ring 0.0063% [627, 338, 652, 340] 0.3 × 0.3 units
Never visible: none
```

From the foul line the board is seen nearly edge on, and the 50 ring's box is [627, 338, 652, 340]: a sliver of the picture. The list gives each ring by name, so the agent knows which is which without reading colours off that sliver.

**Wind up for 30 frames.** A `{ state }` step clears the last roll, Space is held for 30 frames (half a second) and released, and `until` waits for the ball to land:

```text
interact {"steps":[{"state":{"last":null}},{"key":"Space","frames":30},{"until":{"last.points":null},"max":300}],"trace":["phase","ball.z","ball.y"]}

{"changed":{"phase":"rest","power":0.5,"ball":{"y":0.3,"z":-7.8},"score":30,"balls":1,"last":{"ring":"30 ring","points":30,"x":0,"z":-7.8}}}
until: last.points exists held at frame 137
phase: "aim" until frame 1, "windup" until frame 31, "lane" until frame 107, "air" until frame 137, then "rest"
ball.z: 0 → -7.8 at frame 137; first changed at frame 31
ball.y: 0.1 → peak 0.6 at frame 121 → 0.3 at frame 137; first changed at frame 99
```

The trace splits the roll into its parts: 30 frames of wind-up, 76 on the lane, 30 in the air. The ball came down at z -7.8, short of the rings' centre at -8.4, in the 30 ring.

**A full wind-up, 60 frames.**

```text
interact {"steps":[{"state":{"last":null}},{"key":"Space","frames":60},{"until":{"last.points":null},"max":300}],"trace":["phase","ball.z","ball.y"]}

{"changed":{"power":1,"ball":{"z":-10.21},"balls":2,"last":{"ring":null,"points":0,"gutter":"long","z":-10.21}}}
until: last.points exists held at frame 160
phase: "rest" until frame 1, "windup" until frame 61, "lane" until frame 114, "air" until frame 160, then "rest"
ball.z: -7.8 → peak 0 at frame 1 → -10.21 at frame 160; first changed at frame 1
ball.y: 0.3 → low 0.1 at frame 1 → peak 0.99 at frame 135 → 0.3 at frame 159; first changed at frame 1
```

Too hard: the ball flew past every ring and landed at -10.21, a long gutter. The first frame shows the Space press bringing a new ball to the line (`ball.z` back to 0) before the wind-up.

**Slide left, then wind up for 40 frames.**

```text
interact {"steps":[{"state":{"last":null}},{"key":"ArrowLeft","frames":30},{"key":"Space","frames":40},{"until":{"last.points":null},"max":300}],"trace":["ball.x","phase"]}

{"changed":{"power":0.67,"ball":{"x":-0.5,"z":-8.46},"score":60,"balls":3,"last":{"ring":"30 ring","points":30,"x":-0.5,"z":-8.46}}}
until: last.points exists held at frame 172
ball.x: 0 → -0.5 at frame 30; first changed at frame 1
phase: "rest" until frame 1, "aim" until frame 31, "windup" until frame 71, "lane" until frame 137, "air" until frame 172, then "rest"
```

Forty frames carried the ball to z -8.46, level with the centre, but half a metre to the left, so it scored 30. The length is right; the line is not.

**From the middle, 40 frames, kept as a check.** `expect` names the ring, and `save` replays the roll from a fresh reload and stores it:

```text
interact {"steps":[{"state":{"last":null}},{"key":"Space","frames":40},{"until":{"last.points":null},"max":300}],"trace":["phase","ball.z","ball.y"],"expect":{"last.ring":"50 ring"},"save":"wind-up-40-frames-into-the-50"}

{"changed":{"phase":"rest","power":0.67,"ball":{"y":0.3,"z":-8.46},"score":50,"balls":1,"last":{"ring":"50 ring","points":50,"x":0,"z":-8.46}}}
until: last.points exists held at frame 142
phase: "aim" until frame 1, "windup" until frame 41, "lane" until frame 107, "air" until frame 142, then "rest"
ball.z: 0 → -8.46 at frame 142; first changed at frame 41
ball.y: 0.1 → peak 0.71 at frame 122 → 0.3 at frame 142; first changed at frame 100
Expect: last.ring "50 ring" ✓
Saved check "wind-up-40-frames-into-the-50" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

The score reads 50 with one ball because the replay started from a reload, not from the rolls before it.

**Rerun it after a change.**

```text
test {}

✓ wind-up-40-frames-into-the-50
1 of 1 saved checks passed in 0.3 s
```

If an edit to the lane's friction or the ramp's angle moves where a 40-frame roll lands, this check names the ring it reached instead.

## Qwen Code

Qwen Code reads MCP servers from the same `mcpServers` block, in `~/.qwen/settings.json` for every project or `.qwen/settings.json` in one, per [Qwen Code's MCP page](https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/):

```json
{ "mcpServers": { "paprika": { "command": "npx", "args": ["-y", "paprika3d", "serve"] } } }
```

`qwen mcp add paprika npx -- -y paprika3d serve` writes it for you, to the user file by default (the Gemini CLI defaults to the project). For a browser of its own, Qwen Code's [Browser Use page](https://qwenlm.github.io/qwen-code-docs/en/users/features/browser-use/) describes a Chrome extension that lets it work in your open tabs and signed-in sessions, on macOS or Linux. Its skills install with `npx skills add Keeno-Corp/paprika3d -a qwen-code`, into `.qwen/skills/`. None of this was run here.

## Pitfalls

- **Clear the last result before each play.** `last` keeps the previous roll, so each play here begins with `{ "state": { "last": null } }`; without it, `until` would be met on the first frame by the roll before.
- **A held key is one step.** `{ "key": "Space", "frames": 40 }` holds Space for 40 frames and lets go, and the trace's `"windup" until frame 41` shows those 40 frames, from frame 1 to frame 41.
- **Give the scoring parts names.** `look` reports `50 ring` and its box because the mesh has `name` set; the game's `describe()` gives the keys and units that the canvas does not show.

## What paprika3d does not do

It does not drive the Gemini CLI's browser agent, Chrome DevTools MCP or Qwen Code's Chrome extension, and it never sees your own Chrome window or tabs: it runs its own headless Chrome, beside the agent, over MCP. Without a graphics card that Chrome draws in software, so its frame times describe nothing about a player's machine. It says which ring each roll reached; whether the lane is fun to roll on is for a person to judge. The Claude Code plugin's hooks and slash commands stay in Claude Code, and the Gemini CLI and Qwen Code get the tools, plus the skills if you add them.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): keys and state on exact frames, and saved checks.
- [Screenshot a three.js scene headless from a coding agent](/guides/screenshot-threejs-scene-headless): the picture and the on-screen list.
- [Antigravity browser agent on a three.js game](/guides/antigravity-browser-agent): Google's newer CLI and app, and their browser.
- [How do I get Codex to use the browser?](/guides/codex-use-the-browser): the same server registered with `codex mcp add`.
- [A Playwright alternative for three.js and WebGL pages](/guides/playwright-alternative-threejs-webgl): these checks written as a browser script.
