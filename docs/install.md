---
title: Install paprika3d: the three.js MCP server and Claude Code plugin for making games
description: How to install paprika3d, the Claude Code plugin and MCP server that turns your coding agent into a game studio for three.js, and how to run its MCP server from Cursor, Codex or Gemini CLI.
meta: Install paprika3d, the three.js MCP server and Claude Code plugin, or run its MCP server from Cursor, Codex or Gemini CLI.
---
# Install paprika3d

Two commands in Claude Code, one line in any other MCP client. In Claude Code, start with `/paprika3d:paprika-make <request>`: it takes a game or 3D page from references and a design doc to the build, and [How it works](/how-it-works) walks through each stage. In every client your agent sees, plays and measures every three.js page it writes.

## Requirements

- Google Chrome. The harness runs the page in a headless instance of it, found at its usual install path on macOS and Linux, on PATH, or in Playwright's or Puppeteer's cache. Anywhere else, set `PAPRIKA3D_CHROME` to its path.
- Node 20.11 or later.
- For the Claude Code plugin, Claude Code 2.1.118 or later.
- Optional: Firefox, for `open`'s `browser: "firefox"`; the one installed on the machine is used (or `PAPRIKA3D_FIREFOX`). With no Chrome, a plain open falls back to it.

## Limits

- **No GPU needed.** Without one, Chrome draws WebGL in software: every tool works, first frames take seconds, and `open` and `perf` say those frame times are no budget signal.
- **Headless Chrome:** sizes and pixel ratios are emulated, and no sound plays (the tools report the sounds a page started).
- The after-edit hook runs on Claude Code's `PostToolBatch` event, which versions before 2.1.118 lack.

## Claude Code

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

The plugin adds the [tools](/tools) (`open`, `look`, `interact` and the rest; their full names start `mcp__plugin_paprika3d_paprika__`), the skills and the hooks to Claude Code.

**Start here:** `/paprika3d:paprika-make <request>`, for example `/paprika3d:paprika-make a small three.js game about a frog on a skateboard`. It asks a few questions for a short brief, gathers references, writes the sheets and builds the page; [How it works](/how-it-works) says what each stage writes and what needs a key. Then `/paprika3d:paprika-loop <request> for <time>` keeps improving it unattended. To fix or extend a page you already have, just ask the agent: the `threejs-game` skill, which Claude loads by itself, says what each tool shows.

## Other agent products

Cursor, Codex, Gemini CLI and any other client that speaks MCP run the server from npm, where it is published as [`paprika3d`](https://www.npmjs.com/package/paprika3d) with provenance:

```bash
npx -y paprika3d serve
```

Register that command as a stdio MCP server in the client's configuration (`"command": "npx", "args": ["-y", "paprika3d", "serve"]`). For the Codex CLI: `codex mcp add paprika -- npx -y paprika3d serve`; for the Gemini CLI: `gemini mcp add paprika npx -y paprika3d serve`. The tools are the same; the hooks and slash commands are Claude Code features. To give Cursor, Codex, OpenCode and other agents the skills too, add them next to the server:

```bash
npx skills add paprika3d/paprika3d
```

Among them are `threejs-game` (the method) and one skill per task: `threejs-screenshot`, `threejs-play`, `threejs-test`, `threejs-perf` and `threejs-glb-audit`. `--skill <name>` adds one alone.

Without the skill, the agent needs to be told to open and look at its page (the [tools page](/tools) and the [skill](/skill) say how).
