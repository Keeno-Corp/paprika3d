---
name: threejs-perf
description: Profile a three.js or WebGL page from a coding agent - frame time (fps), draw calls, triangles and asset size against a budget, and which objects or settings cost the frame. Use when it stutters, has low fps or loads slowly. paprika3d's perf tool.
---

# Profile a three.js page

After `open`, `perf` measures the frame against a budget (`desktop` by default; `site` for a 3D website, which also times the first scene frame and counts script and asset megabytes):

- `costs: true` lists triangles, shadow casters, draw calls and texture megabytes by named group.
- `variants` measures each change on a fresh page against the baseline, in one call: `{ label: "no trees", hide: ["trees"] }`, a `pixelRatio`, `code` run with `renderer` and `scene` (shadows off, a material swapped), or a `query` the page reads at load.
- `throttle: 4` slows the page's JavaScript as on a weak laptop.
- `network` times a cold load (a first visit, no cache, in real time) before the sample: `"broadband"` is the 20 Mbps / 40 ms target, `"fast-4g"`, `"slow-4g"` and `"3g"` are Chrome's presets, and `{ downKbps: 20000, upKbps: 5000, latencyMs: 40 }` is any other. `open` takes it too. The line names the network's numbers and whether a software renderer drew the frame; a software first frame (shader compiles above all) says nothing of a GPU's, so judge the bytes there and the time only on a GPU.

`perf` with `optimize: true` is for a frame `perf` says is over budget, or a user who asks about performance: it tries the `@paprika3d/three-runtime` switches, keeps those that help (a kept `resolution` or `lod` may change the picture and is then marked `lookChanged`) and writes `game-runtime.json` (`../threejs-game/references/optimize.md`). A page that opens with no `Slow start` line and stays within budget needs neither.

A `Slow start` line, or a page slow to its first frame, is shader compiles more often than frame cost: draw a plain first frame, then add each effect (scan materials, a noise sky, shadows, `foliage()`, `water()`, GPU simulation, `post()`) after it in its own small `renderer.compileAsync(effect, camera, scene)` batch (`../threejs-game/references/optimize.md`, Load time).

If `open` and `perf` are not among your tools, the paprika3d MCP server is not installed: it runs as `npx -y paprika3d serve` (stdio), and https://paprika3d.com/docs/install?ref=skill has each agent's line.
