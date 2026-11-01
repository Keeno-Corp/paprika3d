<!-- hero -->
<h1 align="center">paprika3d</h1>

<p align="center"><b>paprika3d turns your coding agent into a game studio.</b></p>

<p align="center">Three.js MCP server and Claude Code plugin: build three.js games and 3D pages end to end, from references and a design doc to playtesting, models and a published link.</p>

<p align="center"><a href="https://www.npmjs.com/package/paprika3d"><img alt="npm" src="https://img.shields.io/npm/v/paprika3d?color=d93a1e&label=npm"></a> <a href="#install"><img alt="works with Claude Code, Codex, Gemini CLI, Cursor and VS Code" src="https://img.shields.io/badge/works%20with-Claude%20Code%20%C2%B7%20Codex%20%C2%B7%20Gemini%20%C2%B7%20Cursor%20%C2%B7%20VS%20Code-2b2b2b"></a> <a href="https://registry.modelcontextprotocol.io"><img alt="MCP server" src="https://img.shields.io/badge/MCP-server-2b2b2b"></a> <a href="https://paprika3d.com/docs"><img alt="docs" src="https://img.shields.io/badge/docs-paprika3d.com-2b2b2b"></a> <a href="https://github.com/paprika3d/paprika3d/blob/main/LICENSE"><img alt="license: Apache 2.0" src="https://img.shields.io/badge/license-Apache%202.0-2b2b2b"></a> <a href="https://glama.ai/mcp/servers/paprika3d/paprika3d"><img alt="paprika3d MCP server: quality and maintenance score on Glama" src="https://glama.ai/mcp/servers/paprika3d/paprika3d/badges/score.svg"></a></p>

<p align="center"><a href="https://paprika3d.com/media/paprika3d-intro.mp4"><img src="https://paprika3d.com/media/paprika3d-teaser.gif" alt="An 8-second loop from the paprika3d intro reel: a flower burst over a harbour, a yellow-walled Backrooms corridor, a stone figure with a skull at a computer keyboard, a low-poly lighthouse and cottage, a lighthouse on a green sea cliff with two people, and an illustrated PAPRIKA poster. It links to the full 46-second video." width="480"></a></p>

<!-- /hero -->

It takes a three.js game from references on the web to a look and character sheets, a design doc with the creative calls left to you, the build, then loops that keep improving it, all in one lean package of tools. Along the way your agent plays the game, measures every frame and finds or builds the models. That is how the game gets good: it finds the invisible model, the file that never loaded and the flickering faces, and fixes them before it tells you it is done.

In Claude Code the whole flow is two commands, `/paprika3d:paprika-make <request>` and `/paprika3d:paprika-loop <request> for <time>`. Codex, Gemini CLI, Cursor and other MCP clients get the same tools, and the skills with `npx skills add paprika3d/paprika3d`.

**The main result:** with paprika3d, Sonnet 5.5 made 86% of its 3D objects pass every check, against 66% without it: **+20 points (95% interval +11 to +29)**, over 150 runs in each arm. The checks are no flickering, see-through or inside-out faces, code that runs, and a budget. The checks come from [3JSBench](https://3jsbench.com) by General Context Labs. [All results](#results), each with its run count.

## Install

Needs Google Chrome and Node 20.11 or later; the Claude Code plugin needs Claude Code 2.1.118 or later.

| Agent | Install |
|---|---|
| **Claude Code** | `claude plugin marketplace add paprika3d/paprika3d`<br>`claude plugin install paprika3d@paprika3d` |
| **Codex CLI** | `codex mcp add paprika -- npx -y paprika3d serve` |
| **Gemini CLI** | `gemini mcp add paprika npx -y paprika3d serve` |
| **Cursor, VS Code, Windsurf** | `npx -y paprika3d serve` as an MCP server in the client's settings ([JSON below](#other-mcp-clients)) |
| **Skill only** (any agent) | `npx skills add paprika3d/paprika3d` (one skill: `--skill threejs-screenshot`) |

Then, in Claude Code, type `/paprika3d:paprika-make <request>` to make a game or 3D page from one request. In any agent, ask it to **use paprika3d to playtest** a page you already have.

### Other MCP clients

Cursor (`.cursor/mcp.json`), Windsurf and any other MCP client take this entry; VS Code's `.vscode/mcp.json` takes the same entry under `servers` instead of `mcpServers`:

```json
{
  "mcpServers": {
    "paprika": {
      "command": "npx",
      "args": ["-y", "paprika3d", "serve"]
    }
  }
}
```

## How it works

`/paprika3d:paprika-make <request>` works in this order, with a few rounds of questions for the calls that are yours. The first three stages each write a file you can read and change; [how it works](https://paprika3d.com/docs/how-it-works) has each stage's files, questions and keys.

| Stage | What happens | Tools and files |
|---|---|---|
| **1. References** | Your pictures, or a subagent's picks from Wikimedia Commons and Openverse with each licence and source, numbered on one picture for you to keep or drop. If you say yes, a search of the web, YouTube included, for study references and free models; these stay in `refs/study/` and are never published | `refs/`, `reference` |
| **2. Look and characters** | A style sheet (`LOOK.md`: palette, light, materials, camera and the checks the build is held to) and character sheets (`CHARACTERS.md`), written from the tagged references. A free look board of your references and their colours every time; with your own fal, OpenAI or Gemini key, an image model's look board and front, side and back views of up to four characters | `sheet` (preview), `refs/sheets/` |
| **3. Design doc** | For a game, `DESIGN.md`: core loop, controls, progression, win and lose, levels, feel, audio and UI. The calls that change what the game is (tone, the progression, the win condition) are asked of you; the rest are logged as the builder's, with the options not taken, so you can change one. Your own design doc is read and added to, never overwritten. `BRIEF.md` lists what the build is checked against | `DESIGN.md`, `BRIEF.md` |
| **4. Build** | Where each key model comes from: the library, a free CC0 or CC BY model from the web, a model generated with your own fal, Meshy or Tripo key, or code. Then the whole page in one pass, opened, played, measured and fixed against the brief, with a critic listing what still looks wrong | `asset_search` (preview), `model_run` and `model_look` (preview), `model_audit`, `geo.js`, `fx.js`, and [the tools below](#how-the-game-gets-good) |
| **5. Loops** | `/paprika3d:paprika-loop <request> for <time>` keeps improving it unattended until the time is up: fresh `claude -p` sessions, a builder then a read-only judge each round, a commit per round. Change `paprika-loop/PROMPT.md` while it runs to change course. `publish` (preview, invite-only) puts the game on `https://<name>.paprika3d.app` when you ask | `paprika-loop`, `publish` (preview) |

A one-line request takes about four rounds of questions and spends nothing on your keys unasked. `sheet` names which image and 3D model keys are set, never their values; set one with `/plugin configure paprika3d` or the provider's usual variable, such as `FAL_KEY`. The loop starts only when you type it; each round is two Claude Code sessions, billed as such, and it needs `claude` and `git` on PATH. To publish, join the waitlist at https://paprika3d.com/waitlist and set `PAPRIKA3D_PUBLISH_INVITE` to your code; [what a publish uploads and records](https://paprika3d.com/docs/publish).

The full flow runs in Claude Code. In other agents the tools below work the same, and `npx skills add paprika3d/paprika3d` adds the skills.

## How the game gets good

From the first draft on, every stage runs on these tools. Your agent opens its page in headless Chrome on a clock it controls, reads which objects are on screen and which never appear, plays inputs on exact frames and times each frame. They work on any three.js, React Three Fiber or WebGL page, `WebGPURenderer` included: games, product viewers and configurators, scroll sites, simulations, shader and post-processing demos. Your page needs no changes.

| Part | What your agent does | Tools |
|---|---|---|
| **See it** | Sees what is on screen, what never appears and why (behind the camera, outside the view, too small), which files failed to load, and which lighting and surface faults show | `open`, `look`, `observe` |
| **Play it** | Presses keys, clicks, touches and scrolls on exact frames of a paused, seeded clock, reads the state after each input, keeps a play as a check that reruns after every edit, and measures how a hit or pickup shows on screen | `interact`, `test`, `feel` |
| **Ask it** | Runs any JavaScript against `scene`, `camera` and `renderer`, and reads each mesh's triangles, bounds, closed edges, volume and genus | `eval` |
| **Speed it** | Times the frame against a desktop, mobile, Quest or site budget, finds what costs it, and keeps only the speed-ups that leave the picture unchanged | `perf` |
| **Match a picture** | Reads a picture the page should match (a crop with a pixel grid, colours at points), and puts the page beside it with the differences by region | `reference` |
| **Find models** | Finds a ready-made model, PBR texture or HDRI sky in a hosted library (57,732 models, 3,545 textures, 1,430 skies), by words or by a crop of a picture; `pick` downloads one into the project with the code that loads it, and a CC BY model's credit line into `CREDITS.md` | `asset_search` (preview) |
| **Build models** | Builds a model in code, in a modelling scene kept between calls (three.js and Manifold: booleans, hull, extrude, revolve), shows it true to size from four sides, and saves a .glb the page loads | `model_run`, `model_look` (preview) |
| **Check models** | Checks .glb, .gltf and USD files for size, triangles, textures and compression, with a site or Shopify verdict; `shrink` rewrites a .glb or .gltf smaller | `model_audit` |

`open` also puts two helper files in the project, `geo.js` (procedural geometry) and `fx.js` (sound, textures, particles, a lighting setup), and the skill can add game-state, which keeps game state in typed arrays and runs Rapier physics in a worker. `send_feedback` sends the team a report when a reply was wrong. Every tool, with when to reach for it, the skills, the hooks and the files: [what the plugin adds](https://paprika3d.com/docs/plugin).

### What your agent sees

Every reply is short text with the numbers that fix the problem. Part of one `look` reply, on a test page with a start line laid flat on a road:

```text
Surfaces: "road" and "startDecal" share a face plane (y = 0.00) over 2.6 × 16 units: they flicker as the camera moves (z-fighting). Move one at least 0.00054 units off the plane (what the depth buffer can tell apart at 21 units from this camera), give the top one material.polygonOffset = true with polygonOffsetFactor -1, or remove the hidden face.
On screen (4):
road 44% [0, 307, 1279, 799] 500 × 18 units, along the view
grass 17% [0, 307, 1279, 587] 600 × 400 units
startDecal 0.46% [366, 427, 915, 440] 16 × 2.6 units, across the view
board4 0.075% [553, 286, 587, 307] 8 × 5 units
Never visible: none
```

## Results

[3JSBench](https://3jsbench.com) by General Context Labs checks the 3D objects a model builds from one-line requests. In our run of its checks, more objects pass with paprika3d:

| 3JSBench | Without paprika3d | With paprika3d | Difference (95% interval) | Runs |
|---|---|---|---|---|
| Sonnet 5.5: objects that pass every check | 66% | 86% | +20 points (+11 to +29) | 150 per arm (50 objects, 3 runs each) |
| Opus 5.5: objects that pass every check | 63% | 78% | +15 points (+4 to +26) | 150 per arm (50 objects, 3 runs each) |
| Sonnet 5.5: objects with no flickering (z-fighting) faces | 68% | 88% | +20 points (+11 to +29) | 150 per arm (50 objects, 3 runs each) |
| Opus 5.5: objects with no flickering (z-fighting) faces | 69% | 89% | +21 points (+11 to +31) | 150 per arm (50 objects, 3 runs each) |

**Imported models show up, at the right size.** Sonnet 5.5 building three.js pages that each load a glTF model. The paprika3d runs had a one-time reminder to open the page after the first edit; the plugin's after-edit hook now says once that a page the agent wrote has not been opened.

| Imported models | Without paprika3d | With paprika3d | Runs |
|---|---|---|---|
| Model loaded and shown at the right size | 1 of 11 runs | 9 of 11 runs | 11 per arm, a small sample |
| Draco-compressed model loaded | 0 of 3 runs | 3 of 3 runs | 3 per arm, a small sample |

On a mini golf page the agent loaded a toy car so small it never showed up, and the screenshot looked fine. `look` named it: `Never visible: ToyCar (0.0338 units, in view)`.

**Finding flickering faces in finished objects.** An agent was shown 133 finished objects, one run each, and asked for their defects. With Sonnet 5.5, paprika3d found 75% of the flickering faces and Playwright MCP with a written QA skill and a measuring script found 44%; paprika3d passed 80% of the clean objects and Playwright 66%. With Opus 5.5 the two were close: 40% and 35% of the flickering faces found.

**Heavy physics leaves the main thread free.** With game-state, a scene of about 2,000 crates spent 1.3 to 2.0 ms of each frame on the main thread instead of 7 to 11 ms, and passed 18 of 18 game checks either way. Opus 5.5, 2 runs per arm, a small sample; both arms had paprika3d, the difference is game-state.

## How it compares with Playwright MCP and Blender MCP

paprika3d is built for one job: an agent making a three.js game or 3D page, end to end.

| | paprika3d | Playwright MCP | Blender MCP |
|---|---|---|---|
| Sees the three.js scene graph (named objects, sizes, what never appears) | Yes | No | No |
| Paused, seeded clock: the same inputs give the same frames | Yes | Not built in | No |
| Input on an exact frame, with the game's state back | Yes | No | No |
| Frame time against a budget, and an optimizer | Yes | No | No |
| Lighting and z-fighting faults named | Yes | No | No |
| References, a style sheet, a design doc, a build and an unattended loop in one flow | Yes | No | No |

## Making a game checkable

Any page works as it is. Add `window.__game` (`describe`, `observe`, `act` and `setState`) once the page has loaded, and your agent reads and sets the game's exact state: [the convention](https://paprika3d.com/docs/convention).

## Where runs go

`paprika3d/runs/<time>/`: one folder per open. Each open deletes the pictures and clips (.png, .gif, .mp4) of all but the newest 10 run folders, keeping `run.json`, `last-test.json` and every other file; a folder written to in the last hour is left whole. Saved baselines live in `paprika3d/baselines/`. Add `paprika3d/` to the project's `.gitignore`.

`geo.js` and `fx.js` are written on the first open and replaced only when the plugin's copy changes; leave them in place.

## What leaves your machine

- **`look` and `interact`**, when the project has no matching three.js installed, have Chrome fetch that three.js version from `cdn.jsdelivr.net`.
- **`asset_search`** sends your agent's searches (the words, or the crop of a picture it searches by) and what it picks to the asset library at `assets.keeno.dev`.
- **`send_feedback`,** only when the agent calls it, sends its text, the last tool call's name, option names and error, the plugin version, OS and Node version, a random install id (kept in `~/.paprika3d/telemetry/id`) and a per-run id. `DO_NOT_TRACK=1` or `PAPRIKA3D_TELEMETRY=0` turns it off.
- **Once per install and per update,** the MCP server sends the same install id, the plugin version, OS and Node version and your MCP client's name and version, so the team can count installs; nothing about your project. The same switches turn it off.
- **`/paprika3d:paprika-make`'s reference search** sends words from your request to Wikimedia Commons and Openverse, and, after you say yes, to a web and YouTube search.
- **`sheet`,** with your own key, when a sheet or model is asked for: the prompt and the reference pictures it is made from, to the provider you chose (fal, OpenAI or Gemini for pictures; fal, Meshy or Tripo for models), billed to your key.
- **`publish`,** only when you ask: the built project, to host it.

## What stays stable

The tool names and their inputs, the skill names, the `paprika3d serve` command and the environment variables in `server.json` change only in a minor release before 1.0, and only with a note in [CHANGELOG.md](CHANGELOG.md), which lists each release; a patch release never changes them. The previews may change in any minor release: `publish`, `sheet`, `model_run` and `model_look`, `asset_search`, and `open`'s `browser: "firefox"`.

Requirements and limits (Chrome's location, Firefox, running with no GPU, headless Chrome): [the install page](https://paprika3d.com/docs/install).

## Source, contributions and license

Each release ships the readable TypeScript it was built from, in `source/`. Contributions are welcome as a patch in an issue or a pull request, each commit signed off for the Developer Certificate of Origin (`git commit -s`); see `CONTRIBUTING.md`. Issues: https://github.com/paprika3d/paprika3d/issues.

Apache License 2.0 (`LICENSE`). The packages each build bundles keep their own licences, listed in `THIRD_PARTY_NOTICES.md`.
