---
name: threejs-visual-regression
description: Visual regression, screenshot diff and before-after of a three.js, React Three Fiber or WebGL page. Catch unintended visual changes with paprika3d's look save and compare tools.
---

# Visual regression of a three.js page

1. `open` the page at each size the brief names (including phone viewports), then `look { save: "before-<view>", camera: … }` before editing, once per judged view and size. Name baselines per view and size, overwriting them each session so they do not pile up. Baselines stay in `paprika3d/baselines/` across sessions, never committed. A baseline is one picture at the page's own size, not a `viewports` or `cameras` grid.
2. After editing, `open` at each saved size and `look { compare: "before-<view>" }`. It replays the saved camera and returns to the saved frame on the paused clock: freeze animation, do not mask it. Use the same renderer; pixels from another renderer do not compare.
3. Read the Compare line and red diff picture: 16×16 cells with fewer than four differing pixels are noise; the line gives the differing share in significant cells and up to three region boxes in page pixels. Fix an unintended changed region or record it under Open; keep the Compare lines with what changed as the before/after pair.

Building or changing the page: the `threejs-game` skill (`../threejs-game/SKILL.md`) says what every tool shows. If `open` and `look` are not among your tools, the paprika3d MCP server is not installed: it runs as `npx -y paprika3d serve` (stdio), and https://paprika3d.com/docs/install?ref=skill has each agent's line.
