# Changelog

## 0.4.4 (2026-11-15)

Provider keys stay with their providers. A call signed with a provider key goes only over https to that provider's own
hosts, and never follows a redirect: the sheet's model and image calls, `publish` and telemetry all refuse one rather
than send the key on to wherever it points. The sheet also hides a key in its output when it appears URL-encoded or
JSON-escaped, not just as typed.

`interact` adds a `Motion at 10 fps` line: after the first held-key play following an edit, the same play is stepped at
0.1 s frames, as a slow machine gives, and the line names the player or camera whose position runs away there though every
1/60 s frame reads fine. The skill's Time rule now says to stay stable at 0.1 s frames.

## 0.4.3 (2026-11-11)

The npm package carries the MCP registry name `io.github.Keeno-Corp/paprika3d`, so the registry entry can list it; 0.4.2
still carried `io.github.paprika3d/paprika3d`. Install lines and repository links name `Keeno-Corp/paprika3d`.

`unity_export` (a new tool) writes the open page's scene, at the frame it is on, as a Unity 6 project: the GLB with glTFast
as its importer, an editor script that builds the scene with the page's camera, background, fog and ambient light,
`GameState.cs` from `__game.observe()`, and `PORTING.md` with what does not carry over; the new `threejs-to-unity` skill
walks it. `fx.js` gains `handoff()`, a GLB whose manifest lists what an engine import drops, and `unrealScript()`, the
Unreal Engine 5 editor script that imports it (the new `threejs-to-unreal` skill), and `water()`, a Gerstner wave surface
whose CPU `height()` and `float()` follow the crests the GPU draws, tinting the shallows and foaming the waterline where it
meets the ground given as `shore`. `fx.js` imports on WebGPU pages, where `stage()` makes
a `WebGPURenderer`, and on Linux with no GPU a WebGPU page draws on WebGPU through SwiftShader with no flag.

Each named game has its own queue of calls, so subagents working on different games (`game: "tester"`) run at the
same time instead of waiting behind each other; calls for one game still run one at a time. With `PAPRIKA3D_TOOLS=core` in
the server's environment, the tool list holds the tools every page needs and `more_tools`, which adds a group of the
others (tune, models, assets, export): about 15,000 characters of tool descriptions against about 36,000. It is off by
default.

`publish` with `playtest: true` also gives a link pinned to that build for 7 days, never listed, with a Feedback button
players use with no account; `publish` with `feedback: true` reads their notes. `asset_search`'s library has grown to
84,249 models (from 57,732), 3,747 PBR textures and 1,434 HDRI skies. A picked model's loading code turns the GLB's quantized and normalized vertex data into floats and bakes its GPU instances (`EXT_mesh_gpu_instancing`) into one mesh, so baking a transform into it (`geometry.applyMatrix4()`, a merge) no longer turns it into spikes, and `mergeGeometries` takes every part.

Once a day on which a paprika3d tool runs, after the first call's reply, the server sends the install id, the version,
the date and the MCP client's name, so the team can tell installs that are used from installs that are not. Nothing
about your project or which tools ran; `DO_NOT_TRACK=1` or `PAPRIKA3D_TELEMETRY=0` turns it off, as for the install
ping (the README's what leaves your machine).

`look { save }` keeps a baseline in `paprika3d/baselines/` with its frame, page size, renderer and camera, and
`look { compare }` replays that camera and reports the share that changed and up to three regions in page pixels; a
16×16 cell counts only when four or more of its pixels differ. A new skill, `threejs-visual-regression`, takes a before
and after of each judged view. From its second session the paprika loop's builder saves and compares each judged view,
and its judge counts a change the builder's notes do not account for.

New lines name faults no tool showed. `look`'s `Skinned scale:` names characters under uneven world scale, whose limbs
stretch as they turn. `interact`'s `Controls:` says when a straight held direction moves more than 30° off its screen
axis, `Contact:` when bodies of a similar size overlap deeply, and `Response` when the controlled character is slow to
reach full speed from standing, reversing or a 90° cut, measured on a separate page.

`look`'s camera grid on a page drawn through a RenderPipeline shows each camera, where every picture used to be the
same, without stepping the game. An InstancedMesh fighting itself is named one region per instance, not one box across
every copy. A z-fight outside the camera's view is named out of view, not as one the picture shows. A `camera` given with `sheet`, `viewports`, `scroll`, `opening`, `target` or `cameras` is refused by name
instead of dropped. A renderer whose canvas is not in the document still draws in skipped frames.

A saved check reruns only on the page it was saved on: with another page open, every check used to fail with
`state_not_realized`. The reply says how many were saved on another page; checks saved before carry no page and run
anywhere.

`perf` waits up to 15 s, not 5, for a loading screen to clear before it samples. `open` with an http url no longer
writes `geo.js` and `fx.js` into the working folder. A named game closed to make room says so on its own next call, a
call's `Waited` line names every call queued ahead of it, and a run folder deleted while the game stayed open is made
again. An `asset_search` pick of an id the library lacks says what the library holds, not a bare 404.

`bake` keeps skin joints. `heightfield`'s `heightAt` follows the built mesh's triangles, so a player on a coarse mesh
neither floats nor sinks, and the Rapier template's `setState` moves a teleported player's collider with it. The
after-edit hook no longer counts a page that a shell command only reads (`git add`, `cat`, `grep`), and the paprika
loop's `.gitignore` matches a symlinked `node_modules`. `paprika-make`'s sheets say `shrink` keeps every triangle, so a
model over the triangle budget needs a lower-poly source. `send_feedback` takes 20 reports a session, not 5, and its description says so; one past that keeps its copy and says where, a refused report says why (a 429 is the Worker's day limit for one network, not a server that did not answer), and only a stored report counts toward the 20. And
`interact`'s `save` says a check's name is letters, digits, - or _.

## 0.4.2 (2026-11-03)

`open` finds the browser on Windows, where it used to fail with "No Chrome at /Applications/...". It looks at the usual
Chrome and Chromium installs, `.exe` names on PATH and the caches, then Edge last, and its error names a Windows path. A
`windows-latest` job ran `open`, `observe`, `eval`, `interact`, `look`, `model_run` and `model_look` in Chrome with
`PAPRIKA3D_CHROME` unset. Edge, Firefox and the test suite have not been run on Windows, a dev-server `command` needs
`sh`, and the hooks cannot yet read a Windows run folder (#216).

`look` and `interact`'s `look` work on a page whose Content-Security-Policy refuses the harness's server, such as a
game published to `*.paprika3d.app`: three comes from jsDelivr instead, and a page that refuses both gets a reply naming
why.

`look` no longer advises `setSize` for a small buffer under CSS `image-rendering: pixelated`, since following it removed
the look the page chose.

The reminder that an edited page has not been opened comes once per session across its subagents, and after a shell
command only for a page the command names. The stop hook counts a change only in a file the page ran, so a fetched copy
or a node script no longer blocks a stop, and the lead hears a page is unplayed only if the lead opened it.

The install ping settles on a rate-limited answer (429) instead of trying again at every start.

`paprika-make`'s sheets name the looks agents default to, on the `(builder's call)` lines, and its critic lists what was
left as the browser draws it. These come from a scan of 150 builds; their effect on a build has not been measured.

## 0.4.1 (2026-11-01)

A game moved in whole 1/60 s steps stood still on 40% of its frames on a 100 Hz screen, and no tool could see it,
because every tool steps the clock 1/60 s at a time. `interact` now adds a `Motion at 100 Hz` line: normally once after
each edit, a play that holds a key for 12 frames or more is played again on a page of its own at 10 ms a frame, and the
line says when the subject or a camera stands still on 20% or more of those frames. Chrome only. On the games it was
tried on, it added about 0.4 to 1.4 s to that one call.

The skill's time rule had come to read as a request for a fixed step, which is how agents came to write this. It now
asks for each frame's elapsed time, and a fixed step (physics, rewind) draws between its last two steps. game-state's
`loop()` gains `between()` for that.

The `Motion` line says when a turn came though only a forward or back key was held: a player drifting left under W alone
used to read as a plain "turned 18° left".

## 0.4.0 (2026-11-01)

`/paprika3d:paprika-make` writes a style sheet (`LOOK.md`), character sheets (`CHARACTERS.md`) and for a game a design
doc (`DESIGN.md`) from the tagged references, beside `BRIEF.md`, which names them; an existing `DESIGN.md` is read and
added to, never overwritten. Its first question is a batch: what it is, a web search for study references (YouTube
included, kept in `refs/study/` and never published), picture sheets, and the kind of models. A picking round asks
where each key asset comes from: the library, a free CC0 or CC BY model found on the web, a model generated with your
key, or code; a one-line request with no pictures skips it, takes each item's recommended source and says that
`CHARACTERS.md` is where to change one, so a one-line game takes about four rounds of questions. The loop's builder
reads the sheets each session, and its judge scores a sheet line on `LOOK.md`'s Checks.

The brief asks first whether you want picture sheets (an image model's look board and character turnarounds,
held to by the build), and only after a yes about the key; a yes is remembered across projects in
`~/.config/paprika3d/prefs.json` (`sheet` `remember`). The candidate references are shown numbered on one picture,
opened in your image viewer, before you choose which to keep.

New tool `sheet` (preview): `check` names each image and 3D provider with a key and where it was found, never a
value, and says when the plugin's key is set without a provider it can use; without a provider it composes a free
`refs/sheets/LOOK.png`; with your key it makes a look board, or starts a character turnaround or a 3D model job that runs
in the background while the build goes on (pictures: fal, OpenAI, Gemini; models: fal, Meshy, Tripo). In Claude Code
the key can be set once with `/plugin configure paprika3d` (`image_provider`, and `image_key` stored as sensitive); elsewhere the
provider's usual variable, such as `FAL_KEY`, is read. `asset_search` `save` writes its contact sheet to a file;
`model_run`'s `load` reads .obj and .fbx (textures an FBX names as separate files are left out), its first run that
adds geometry in a project with no model search on record says so in one line, and `searched` logs why a thing is built
in code and leaves that line out of its own call. `publish` leaves out `refs/study/`, `refs/sheets/` and `refs/assets/`.

A game in a subfolder of the project no longer counts its own `paprika3d/` run output as a source edit, which reloaded the
page between calls, and a file or folder deleted while the harness reads the project no longer fails the call (#209).

The description on npm, in the plugin directory, the MCP registry and context7, and the README's hero now say what the plugin is for: "paprika3d turns your coding agent into a game studio", and "Three.js MCP server and Claude Code plugin: build three.js games and 3D pages end to end, from references and a design doc to playtesting, models and a published link."

## 0.3.2 (2026-10-29)

`perf` with `variants` stops after 5 rounds, not 8: a variant still undecided by then reads `no clear change`
as before, and a 5-variant call takes about two thirds as long. Changes of about 10% are caught less often.

## 0.3.1 (2026-10-29)

`perf` with `variants` repeats each measure over fresh page loads and says a change only when it holds across them:
two loads of the same page differ by 2 to 4 times the spread inside one sample, so a variant that changed nothing read
as a change 5 to 8 times in 16 against the old noise line. Each call runs rounds of one baseline run and one run of each
variant still undecided, until the variant's 95% interval on the ratio to the baseline is narrow or clearly away from 1,
8 rounds, or 45 s. A row reads `−45% (−58% to −27%) vs baseline over 4 runs` or `no clear change (−10% to +13%, 8 runs)`,
and the noise line is now `Baseline over N loads: M ms median, runs spread X%` (#163).

Look sheets, cameras, viewports and scroll sweeps skip the z-fighting check, which their replies never print, and probe
the page size once per size instead of on every cell: sheets are 6% to 28% faster on the test pages, with the same
replies and pictures. A sheet's or `test`'s closing reload is left to the next call when that call reloads first anyway,
saving one reload of a 3-cell sheet's 4. `interact` `hover` and `reference` `compare` skip the same check (hover 32% to
55% faster, compare 36% to 54%), and pictures are decoded in the page with `Uint8Array.fromBase64`, so `reference` on a
large photo, `model_audit` shrink and `record: "video"` are 11% to 39% faster. A call's 10 or 20 min limit now covers
its rerun after the page navigates, where a rerun got a whole limit of its own and some calls ran 12 to 19 min (#204).
A call queued behind the after-edit hook's check of the saved checks starts its limit when it runs and opens with how
long it waited, where it spent its own limit waiting and could time out at 10 min (#205).

## 0.3.0 (2026-10-29)

A minor version because the tool list changes: the `optimize` tool folds into `perf` (below), so the stable build lists
15 tools. The stable build ships readable bundles and the TypeScript they are built from under `source/`, and CONTRIBUTING.md
takes outside changes with a DCO sign-off. `look`'s z-fighting check covers every mesh on a heavy page (all 103 of a
100-mesh test page in about 100 ms, where it checked 0 to 76) and, when it still reaches its limit, says `Surfaces: not
checked for N of M meshes` where the Surfaces line goes (#161). That check counts its work instead of timing itself, so a busy machine names the same fights as an idle one: timed, the Studio at load 20-36 named a fight in only 22-27 of 63 flicker cells (#196). Each open deletes the pictures and clips in all but the
newest 10 run folders (#74). A `perf` variant samples 2 s against the baseline's 4 s, so a 5-variant call takes about
28 s instead of 40 (#163). On a software renderer, each clock frame waits for the GPU, so looks stop hitting the 180 s
timeout (#25). The `look` and `interact` schemas are shorter (the tool list is 13% smaller) and the `threejs-game` skill
is about half its size, with the detail in `references/tools.md`. `paprika-make` asks its questions, has a subagent find
reference pictures the person confirms, and writes the brief before any page file; `paprika-loop` starts only when the
person types it. The `open` reply says geo.js and fx.js are replaced only when the plugin's copy changes. The README
puts the result and install first; the tool, skill and hook tables are on the docs site's plugin page. The after-edit
hook's once-per-session line that a three.js page has not been opened also comes for a page a shell command wrote (a
heredoc or a generator script), found under the session's folder as one changed since the session began (#188). `open`
loads at session start under Claude Code's tool search, which otherwise shows each MCP tool by name only until the agent
searches for it: its tools/list entry carries `_meta: {"anthropic/alwaysLoad": true}`, which Claude Code 2.1.285 and
later read. The `optimize` tool is now `perf` with `optimize: true`: it measures, tries the @paprika3d/three-runtime
switches (`resolution`, `defaults`, `instancing`, `lod`, `dispose`) one at a time, keeps those that help in
`game-runtime.json`, and ends with the final `test` of `game-tests.json` when the project has one. With
`optimize: true`, `perf` takes only `budget`, and the `switches` option is gone. The MCP server starts about a quarter
faster (117 to 85 ms on an M3 Air): it and the hooks run through Node's on-disk compile cache (Node 22.8 and later). A
`look` zoom on a scrolled page shows the box the look listed there, not the part of the page above it, and leaves the
page's scroll where it was (#193). The picture in a tool reply is at most 1,024 pixels wide, not 1,280,
about 850 tokens a look instead of 1,330 (a vision eval on 133 assets found Sonnet's defect recall no lower). The after-edit hook no longer says a three.js page has not been opened when an `open` of it ran in the same batch of tool calls as the write: it reads that `open`'s reply from the hook's own input, since Claude Code adds a batch's results to the transcript up to 100 ms after the hook starts (#194).

Once per install and per update, at the MCP client's first `initialize`, the server sends the install id, the plugin
version, OS and Node version and the client's name and version, so the team can count installs; nothing about the
project, and `DO_NOT_TRACK=1` or `PAPRIKA3D_TELEMETRY=0` turns it off, as for `send_feedback` (the README's what leaves
your machine and SECURITY.md say so). `perf` samples frames as a browser runs them, letting the GPU run at most two
frames behind, instead of waiting for the GPU every frame, which read a frame as its CPU and GPU time added (#191); its
pass times sync on a 1x1 framebuffer the harness owns, so the pass after a multisampled target's resolve is no longer
charged the heavy pass's GPU time; a WebGPURenderer with no device yet no longer stops every frame stamp; and a pass
whose material is three's ShaderPass default is named by its uniforms, not `(unspecified)`. `look` says a subject the
ID image cannot find (drawn by its own shader, or see-through) has its share not measured, instead of `drew no pixel`.
The `interact`, `look` and `perf` descriptions name their siblings and say what fails and what persists.
`paprika-make` and `paprika-loop` ask one question for each of what it is, what it must have, its controls and its
pictures that the request leaves open, so a detailed request gets one or two, and a request that names no pictures
starts the reference subagent before the first question. A `paprika-loop` judge marks a Next item it asked for before
`(asked again)` and names the one tool call that shows it done, and when the last three judges gave the same score the
next builder's prompt says so. The stable build carries SECURITY.md (founders@keeno.dev, the latest release only) and,
in the public repo, a Dockerfile so Glama can run the server and list its tools. `paprika3d check` prints an opt-in
`Tested with paprika3d` line under its plain report with `PAPRIKA3D_TESTED_WITH=1`, for a report pasted into a PR. Five
one-task skills, `threejs-screenshot`, `threejs-play`, `threejs-test`, `threejs-perf` and `threejs-glb-audit`, sit
beside `threejs-game`, so `npx skills add Keeno-Corp/paprika3d --skill <name>` installs one. `asset_search`'s library
holds 57,732 models, with the 549 from Scenario's 3D Collection.

## 0.2.4 (2026-10-27)

`templates/viewer.html` sets `NeutralToneMapping` after `stage()`, so a swatch and the material it names read as one
colour, and `references/configurator.md` says why: `stage()`'s ACES default mutes and shifts saturated colours (#183).
Reply lines call the person at the page a viewer, never a player: `look`'s `It blends in` and `Dark` lines, `open`'s
slow-start line, `perf`'s p95 hitch line and the `opening` description (#64); the `threejs-game` skill's first-frame rule
says a page's own controls or labels over the canvas are not a cover.

## 0.2.3 (2026-10-27)

`perf { costs: true }`'s table header says which total is which when the reply's first line disagrees with it: the first
line counts the frame as drawn (the camera's view plus the shadow pass) and the textures on the GPU (the background and
environment included), the table the main scene's objects (#179). `feel` puts its `State changed during setup` line
right after the `Watched` line, above the HUD and sound lines that count only the watched frames (#182). The
`threejs-game` skill's reload list names an `interact` with `save`, which replays from a fresh reload (#180); its Rapier
paragraph says the project's copy and game-state's worker are separate, so their versions need not match, and which
file each version ships (#181); and the after-edit hook's recheck is explained once, in `references/lighting.md`, with
the skill and the server's instructions pointing there.

## 0.2.2 (2026-10-27)

One shorter description on every surface: "Three.js MCP server and Claude Code plugin: screenshot, play, test and
profile the three.js pages your coding agent builds." The README drops the publish banner, the install commands it
listed twice, the `window.__game` code and the runtime import (both on the docs site) and the lines about what is never
sent; what leaves your machine lists what each tool sends. `look`'s Hues line leaves out the one object over half the
frame, by name, so the other objects' colours show (#178), and `interact`'s Motion line takes its first sample at frame
1 when no frame has been drawn yet, so a save straight after a reload measures the same run as after a look (#176).
The `threejs-game` skill gains `templates/viewer.html`, a product viewer of named parts whose click cycles a variant, with
`observe` and `setState` for each one, and its goal paragraph is in plain sentences. `asset_search`'s `model` input says
it is optional and what it is sent with.

## 0.2.1 (2026-10-26)

The public copy for 0.2.0: a new README (the intro reel, the results, install for each agent, the 16 tools with when to
use each, what leaves your machine), the docs site's install and publish pages, shorter package, plugin and registry
descriptions, and this changelog in the package. `paprika3d check` describes the saved checks it reruns. No tool
changes.

## 0.2.0 (2026-10-26)

The first production release of paprika3d, the three.js toolset for coding agents: a Claude Code plugin and an MCP server
(`npx -y paprika3d serve`) that let an agent open, look at, play, measure and fix the three.js, React Three Fiber and
WebGL pages it writes, in headless Chrome on a paused, seeded clock.

The tool names and their inputs, the skill names, the `paprika3d serve` command and the environment variables in
`server.json` change only in a minor release before 1.0, with a note here. Previews, which may change in any minor release: `publish` (invite-only),
`model_run` and `model_look`, `asset_search`, and `open`'s `browser: "firefox"`. The plugin needs Claude Code 2.1.118
or later; the server needs Google Chrome and Node 20.11 or later.

### Tools (16)

In Claude Code a tool's full name is `mcp__plugin_paprika3d_paprika__<tool>`.

- **See the page:** `open` (the page in headless Chrome on a paused, seeded clock, with the files it loaded and failed
  to load, dev-server errors, an unsized canvas, an old or removed three.js API; up to 4 pages at once; Firefox on
  request), `look` (a screenshot with the named objects on screen and the ones never seen, and fault lines for
  lighting, z-fighting surfaces, the canvas and HTML over it; modes `target`, `cameras`, `sheet`, `viewports`,
  `scroll`, `zoom`, `sample`, `at`, `opening`, `save`, `compare`), `observe` (the state as JSON) and `reference` (a
  picture the page should match, and the page compared with it by region).
- **Play it:** `interact` (keys, mouse, touch, wheel, scroll, resize and clock steps on exact frames, with what changed
  in the state; `until`, `trace`, `expect`; `save` keeps a play as a check; `record: true` makes a real-time GIF),
  `test` (reruns the saved checks) and `feel` (shake, pops, eased moves versus teleports, flashes, particles, spawns,
  HUD ticks and sounds after an event).
- **Ask it:** `eval` (any JavaScript in the page, with each mesh's triangles, bounds, closed edges, volume and genus).
- **Build it:** `model_run` and `model_look` (a model built in code with three.js and Manifold in a scene kept between
  calls, saved as a .glb), `model_audit` (.glb, .gltf and USD files against a site or Shopify budget, and `shrink`),
  and `asset_search` (57,183 CC BY and CC0 models, 3,545 PBR textures and 1,430 HDRI skies in a hosted library, with
  `pick` and a credit line in `CREDITS.md`).
- **Speed it:** `perf` (frame time, draw calls, triangles and asset size against a desktop, mobile or site
  budget, with `variants` and `costs`) and `optimize` (resolution, defaults, instancing, LOD and dispose, kept only where
  they help without changing the picture).
- **Publish it:** `publish` (preview, invite-only: the built page on `https://<name>.paprika3d.app`; `rotate: true`
  replaces a key used from a new place).
- **Report:** `send_feedback` (the agent sends the team a bug or criticism of the harness, at most 20 a day).

### Skills

- `threejs-game`: the method, with reference files for plain three.js, React Three Fiber and Rapier, which Claude loads
  by itself.
- `/paprika3d:paprika-make <request>`: a short brief, one question at a time, written to `BRIEF.md`, then the build.
- `/paprika3d:paprika-loop <request> for <time>`: the same brief built unattended over a set time in fresh `claude -p`
  sessions, a builder and a read-only judge each iteration, a commit each and the best tagged.
- `paprika-publish`: what the agent invokes before `publish`.

### Hooks (Claude Code)

- After each batch of edits: the saved checks and the page's lighting and surface faults rechecked, said only when one
  starts or stops failing, and a once-a-session note when a three.js page the agent wrote has not been opened.
- On the first stop: the edits never played or looked at and the faults still open, stated once.

### In the project

- `geo.js` (procedural geometry with Manifold) and `fx.js` (sound effects, canvas textures, particles, a first-load
  stage, texture coordinates, placement), written by `open`; game-state (typed-array state, rewind, Rapier in a
  worker); `three-runtime.js`, written by `optimize`.

### Packaging

- Both the plugin and the npm package are bundled for Node: nothing is installed from npm and no browser is downloaded.
  The build carries `THIRD_PARTY_NOTICES.md`, the docs site's pages under `docs/`, `AGENTS.md`, `context7.json` and
  `glama.json`.

### If you tried a 0.1.x preview

The tools and the server key were renamed, with no aliases: `game_*` tools are now plain names (`game_look` is `look`,
`game_act` is `interact`, `game_clock` is an `interact` step) and the full name is
`mcp__plugin_paprika3d_paprika__<tool>` (it was `mcp__plugin_paprika3d_paprika3d__game_<tool>`); update permission
rules and prompts that name them. The game contract (`game_contract`, `game_check`) is gone. Update with
`claude plugin marketplace update paprika3d` and `claude plugin update paprika3d@paprika3d`, then restart Claude Code.
