---
title: How paprika3d works: references, sheets, a design doc, the build and loops for a three.js game
description: How paprika3d takes a three.js game end to end in Claude Code: the five stages of paprika-make and paprika-loop, the files each writes, what you are asked, what needs a key, and what other MCP clients get.
meta: How paprika3d takes a three.js game from references, sheets and a design doc to the build and loops, the files each stage writes and what needs a key.
---
# How it works

In Claude Code, `/paprika3d:paprika-make <request>` takes a three.js game or 3D page through four stages: references, a look and character sheets, a design doc, then the build. `/paprika3d:paprika-loop <request> for <time>` adds the fifth: rounds that keep improving it while you are away. Each stage writes a plain file in your project, so you can read it, change it and change course. The home page walks through them with [Kaeru Flip](https://kaeru.paprika3d.app)'s brief and pictures. The stages are shipped in the plugin; the [tools](/tools) under them are the same ones any MCP client gets.

| Stage | What runs | What it writes | What you are asked |
|---|---|---|---|
| 1. References | A reference subagent when you bring no pictures; on a yes, a study subagent and a web assets subagent | `refs/01.jpg`, `refs/02.jpg`, ...; `refs/study/` (study notes, never published) | The first batch of questions, then which of the numbered picks to keep |
| 2. Look and character sheets | `reference` samples the palette from your pictures; `sheet` composes the board | `LOOK.md`, `CHARACTERS.md`, `refs/sheets/LOOK.png` (free); with your key and a yes, a look board and turnarounds in `refs/sheets/` | Where each key model comes from: the library, a free model from the web, generated with your key, or code |
| 3. Design doc | For a game, the creative calls the request leaves open | `DESIGN.md` (yours, when you have one: read and added to, never overwritten), then `BRIEF.md` | Up to two design decisions, such as the tone or the win condition |
| 4. Build | The page is written from `BRIEF.md` and the sheets, opened, looked at and played with the tools; then a critic subagent | The page, with a `Made with paprika3d` line at the top of each file it writes; `CREDITS.md` for CC BY models; `paprika3d/sourcing.json` | Nothing. The reply says how to run it and what to try next |
| 5. Loops | `paprika-loop`: a builder session and a read-only judge session each round, until the time is up | `paprika-loop/PROMPT.md`, `PROGRESS.md`, `loop.json`, `REPORT.md`; a git commit per round, the highest-scored tagged `paprika-loop/best` | Nothing after the brief. Edit `PROMPT.md` while it runs to change the request |

## 1. References

The first call is one `sheet` with `check: true`, which names the image and 3D keys set on this machine (never a value). Then one batch of up to four questions, each with its recommended answer first:

- **What it is**: a game, a 3D scene, a site or product viewer, or an interactive piece. The kind decides what the next questions ask.
- **The web search**: also search the web, YouTube included, for study references and free models? They stay on your machine and are never published.
- **Picture sheets**: an image model draws a look board and front, side and back views of up to four characters from your references, with your own key. The free `LOOK.png` is made either way.
- **The asset style**: low-poly, stylized or toon, realistic PBR, voxel or PS1, recommended from your pictures.

When you name no pictures, a reference subagent finds some while you answer. Its picks are drawn numbered on one picture, `refs/candidates/picks.png`, opened in your image viewer, and one question asks which to keep. Each kept picture becomes `refs/01.jpg` and so on, with its role (layout, style, mechanics, mood), whether to match it or take it as inspiration, its source and its licence. A reference is inspiration unless you say match.

On a yes to the web search, the study subagent looks at how the look, the camera and the sound of the works you name are done, and writes `refs/study/STUDY.md`; the web assets subagent finds licensed models for the key characters and props.

## 2. The look and character sheets

- **`LOOK.md`**, one screen: the palette as hexes sampled from your pictures with `reference` (never from memory), lighting, materials, shape language, camera, UI and type, sound mood, the asset style and what to avoid. Every line ends with the picture or note it came from. It ends with three to five **Checks**, each one a `look` or an `interact` can verify, which the critic and a loop's judge hold the page to.
- **`CHARACTERS.md`**, when there are characters, creatures, vehicles or hero props: one section each with silhouette, sizes, colours, animation and a **Source** line saying where it comes from.
- **`refs/sheets/LOOK.png`**: your pictures cropped side by side with the sampled swatches, composed by `sheet` in Chrome. Free; nothing is sent anywhere.
- **With your key and a yes to picture sheets**: `refs/sheets/LOOK-board.png`, a look board drawn by the image model, and one turnaround per character.

**The picking round.** For up to four key items, `asset_search` searches the hosted library (using a crop of your picture when one shows the item) and saves a contact sheet to `refs/assets/`; the web assets subagent's finds go on a second sheet. One question per item asks where it comes from. Your answer becomes its Source line, and you can change that line later.

## 3. The design doc

For a game, `DESIGN.md` has the core loop, controls, progression, win and lose, levels, feel, audio and UI, sized to what you gave: one screen for a one-line request, or yours kept as written when you bring one. Its **Decisions** section lists the calls that change what the game is. Up to two are asked (tone, the progression shape, the win condition); the rest are listed under "Left to the builder" with the builder's recommendation, and every call is logged with who made it.

Then `BRIEF.md`, short, at the project root:

```markdown
# <title>
## What it is
## Must have
1. <what the build is checked against, and what a paprika-loop judge scores>
## References
refs/01.jpg · <layout | style | mechanics | mood> · <inspiration | match> · <source URL>
## Inspirations and notes
## Sheets
LOOK.md · CHARACTERS.md · DESIGN.md · refs/sheets/LOOK.png
## Left to the builder
```

The Must have list gets one line per sheet: the page looks as `LOOK.md` says, each character matches `CHARACTERS.md`, and a game plays as `DESIGN.md`'s core loop and controls say.

## 4. The build

The first version is written whole from `BRIEF.md` and the sheets: the palette hexes and camera from `LOOK.md`, each model from its Source line (a library `pick`, a web download, a generation job, or `model_run`), and `DESIGN.md`'s controls are what `interact` plays. `model_run`'s `searched` option logs why something is built in code ("by design: terrain") in `paprika3d/sourcing.json`, next to every model search.

Once the page runs and has a look, a critic subagent reads the newest pictures against the brief, `LOOK.md`'s Checks, the boards and the sources, and lists what is broken or falls short of the look. Those are fixed one at a time: zoom, one change, look again.

## 5. Loops

`/paprika3d:paprika-loop <request> for <time>` writes the same brief with you, to `paprika-loop/PROMPT.md`, then starts a driver in the background and stops. Each round is a fresh `claude -p` builder session that makes as many improvements as fit, then a read-only judge session that scores the page against the Must have list and writes the next three improvements. Every round is committed; the highest-scored commit is tagged `paprika-loop/best`. A request with no time gets 60 minutes.

- `paprika-loop/PROMPT.md` is yours to change at any time: the running session reads the changed lines at its next tool call.
- `paprika-loop/PROGRESS.md` holds each session's notes, and `loop.json` the scores, tokens and commits so far.
- `paprika-loop/REPORT.md` appears when the time is up, with the highest-scored commit; `git checkout paprika-loop/best` shows it.

It never starts by itself: you type it. Each round is two Claude Code sessions, billed as such, and the driver needs `claude` and `git` on PATH.

## The quick path

A one-line request with no pictures takes about four questions in all: the first batch, the picks to keep, what its kind needs and the rest in one call, and for a game the design decisions. There is no picking round: each key item takes its recommended free source, logged `picked by builder` in `CHARACTERS.md`, where you can change it. Nothing paid is used unasked. A request that already decides everything, or "just build it", gets no questions.

## What needs a key

Everything above runs without a key except the picture sheets and generated 3D models, which use your own provider key and are billed to it:

| Job | Providers |
|---|---|
| Look boards and turnarounds | fal, OpenAI, Gemini |
| 3D models from a picture | fal, Meshy, Tripo |

Connect one with `/plugin configure paprika3d` (`image_key` and `image_provider`) or the provider's usual variable: `FAL_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `MESHY_API_KEY` or `TRIPO_API_KEY`. `sheet` with `check: true` names the keys it finds, recommends one and shows each provider's listed price. A yes to picture sheets is remembered across projects (`sheet` `remember: "yes"`; `"ask"` forgets it). A 3D job starts during the build, never in the brief, and its model is checked with `model_audit` and `model_look` before the page uses it.

The web search uses your agent's own search tools. `publish` (preview, invite-only) runs when you ask for a public link, never by itself.

## In other MCP clients

The questions, the subagents, the critic, the slash commands and the loop's `claude -p` sessions are Claude Code features, so the full flow is Claude Code. Cursor, Codex, Gemini CLI and any other MCP client get the same 16 tools, `reference` and `sheet` included: an agent there can sample a palette, compose a free `LOOK.png`, search the library and make boards or models with your key when you ask it to, then see, play and measure the page. The method is in `AGENTS.md` and the [threejs-game skill](/skill). [Install](/install) covers both.
