---
name: threejs-test
description: Test a three.js or WebGL game a coding agent builds - keep a play as a check with its expected state, rerun every check from a fresh reload, see which one an edit broke. Use to test a three.js game or page. paprika3d's interact and test tools.
---

# Test a three.js game

1. Play the feature once with `interact` and add `expect` and `save`: `interact { steps: [{ key: "Space" }], expect: { "player.y": [1.5, 3] }, save: "jump" }`. `expect` keys are dotted paths into the state; a value is a number, string or boolean (equal), `[min, max]` (a range), a list of values (one of them; `[null]` is null), `[]` (an empty list) or `null` (exists, whatever its value). The check is written to `game-tests.json` in the project when every entry holds.
2. `test` reruns every check saved on the open page, each from a fresh reload at frame 0, one line each: `✓ jump`, or `✗ jump:` with the value seen and the one expected.

In Claude Code, the paprika3d plugin's after-edit hook reruns the saved checks after each edit and speaks only when one starts or stops failing; between checks it gives way to the agent's next call, so an edit never holds that call for the whole rerun. A check whose page would not load says `launch_failed` with what the page itself said under it (its first errors, such as a module that does not resolve), so a page that throws as it loads reads as the page's error, not the hook's. The checks read `window.__game`'s state (the convention: `../threejs-game/SKILL.md`). A Playwright suite still fits CI runs, real devices and multiplayer.

If `open` and `test` are not among your tools, the paprika3d MCP server is not installed: it runs as `npx -y paprika3d serve` (stdio), and https://paprika3d.com/docs/install?ref=skill has each agent's line.
