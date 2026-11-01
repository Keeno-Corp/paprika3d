# The sheets: LOOK.md, CHARACTERS.md, DESIGN.md and the picture sheets

The brief phase writes these from the tagged references (`refs/01.jpg`, ... with their role and match-or-inspiration tag), `refs/study/STUDY.md` when the study subagent ran, and the person's answers. They sit at the project root beside `BRIEF.md` (beside `paprika-loop/PROMPT.md` in a loop), which names them in its `## Sheets` section. `LOOK.md` is always written; `CHARACTERS.md` when the request, the answers or the study notes name characters, creatures, vehicles or hero props; `DESIGN.md` for a game. A scene rebuilt 1:1 from pictures skips `LOOK.md`: the pictures are its sheet, and `builder-scene.md` reads them with `reference`.

**A sheet that already exists is the person's.** It is read and added to at its end, never replaced or rewritten. A `DESIGN.md` gets `## Decisions` and `## Decision log` when it has none, and one `## Added by paprika-make` section holding the headings below that it does not cover (a doc with its own "Gameplay" heading gets no "Core loop"); the brief's Must have lines cite the person's own headings. A design doc the person pastes or names elsewhere (an export, a PDF, `docs/gdd.md`) is copied into `DESIGN.md` as given, with the same two sections added, and BRIEF.md names the original path. `LOOK.md` and `CHARACTERS.md` follow the same rule.

## The trace rule

Every line of a sheet ends with its trace in parentheses: the picture, its role, match or inspiration (`refs/01.jpg, style, match`), a study file (`study/02-trailer-f3.jpg`, `study/STUDY.md: trailer 1 audio note`), or `(builder's call)` when no picture is behind it. Palette hexes come from `reference` samples, never from memory: `reference` with `sample` at six to eight points per picture, and one `crop` with `grid` where a picture's layout matters. A study frame may be sampled for an inspiration line, and its trace says `study/`. Without the `reference` tool (the skill alone, no plugin), palette lines are marked `(not sampled)`.

## LOOK.md, the style sheet

One screen, at most about 40 lines:

```markdown
# Look: <title>
Board: refs/sheets/LOOK.png
## Palette
ground #5a4a3a · sky #d9c7a8 · hero #e04a2a · accent #2a9d8f · UI #f2efe6 on #1b1b1b   (refs/01.jpg style match: sampled at (120, 900), (640, 80); refs/03.jpg mood inspiration)
## Lighting
<key direction, colour, time of day, shadows soft or hard, fog or haze>   (refs/02.jpg, mood, inspiration)
## Materials
<roughness and metalness feel, texture scale, wear, flat or PBR>   (refs/01.jpg, style, match)
## Shape language
<proportions, edges, silhouette rule, poly density, what is exaggerated>   (study/02-trailer-f3.jpg)
## Camera
<type, FOV, height, follow, what it never shows>   (refs/04.jpg, layout, match)
## UI and type
<font class, size, HUD placement, colours from the palette, one rule for menus>   (builder's call)
## Sound mood
<instruments, sfx character, silence>   (study/STUDY.md: trailer 1 audio note)
## Assets
style: low-poly · maxTris 5000 · asked · sources: library, web, generate (meshy), code
## Avoid
<what the references rule out>
## Checks
1. Sky sampled at top centre of the opening look within 30/255 of #d9c7a8.
2. The hero is the warmest object on screen (look's Subject line names it).
3. One key light with soft shadows; no `Lighting:` fault line.
4. HUD text in the top left, UI colour, readable at 1280 × 800.
```

**The Checks** are three to five lines, each verifiable with one `look` (`sample` at pixels, its `Subject`, `Lighting:` and `Surfaces:` lines) or one `interact`. They are what the critic and a loop's judge hold the page to, so each names the look and the number that shows it.

**The Assets line** is the answer to the asset style question, mapped onto `asset_search`'s filters for every search in the project:

| Answer | `asset_search` filters | Words for web searches and generation prompts |
|---|---|---|
| low-poly | `style: "low-poly"`, `maxTris: 5000` | "low poly" |
| stylized or toon | `style: "stylized"`, then `"toon"` | "stylized", "toon" |
| realistic PBR | `style: "realistic"`, then `"scanned"` | "realistic PBR" |
| voxel or PS1 | `style: "voxel"`, then `"low-poly"` with `maxTris: 2000` | "voxel", "PS1 low poly" |
| a mix | no style filter; the reference crop ranks | the thing's own words |

Textures and HDRIs follow the same line. When the answer and the tagged pictures disagree (the person said realistic, the pictures are flat shaded), one line in the reply says so, and the answer stands.

## CHARACTERS.md, the character and key-prop sheets

One section per character, creature, vehicle or hero prop, in the order the game needs them:

```markdown
## Fox courier (player)
Role: the player; reads at a glance against the snow.
Silhouette: long low body, big tail, pointed ears; 1.2 units long, 0.6 tall, head 1/4 of the length.
Colours: body #e04a2a (palette hero), belly and tail tip #f2efe6, paws #1b1b1b.
Materials: matte, flat shading, no texture; the tail catches rim light.
Animation: idle breathes (scale y 2%, 1.5 s); run bobs 0.05 at 6 Hz, tail trails one frame behind; hit flashes white 100 ms.
Source: library 3f9a… · "Low Poly Fox" by Jane Doe · CC BY · picked by person (2026-10-30); searched "low poly fox" with image refs/02.jpg crop [300, 200, 700, 600].
Refs: refs/02.jpg (style, match), study/01-gameplay-f2.jpg (proportions, inspiration).
Turnaround: refs/sheets/fox-courier.png (generated, fal nano-banana edit) · refs/sheets/fox-courier-model.png (model_look, added by the build)
## Picked by the builder
<props the sheets do not name: one line each, its source and why>
```

**The Source line** takes one of these forms:

- `library <id> · <name> by <author> · <licence> · picked by person (<date>)`, the author from the hit's attribution
- `web <file URL> · <name> by <author> · CC BY (verified on <page URL>) · picked by person`

A CC BY model's credit names its author: the Source line, and the `CREDITS.md` line the build writes for it (name, author, licence, file and page URL), which a published page carries. A CC0 model's author is named when the page gives one.
- `generated: meshy image-to-3d · from refs/02.jpg crop · about $0.40 · picked by person`
- `code: by design, a crate · picked by builder`
- a fallback, kept on the same line: `generated: tripo failed audit (open mesh) → library <id>`

`picked by builder` marks the builder's own choices. A choice the person changes later in CHARACTERS.md is read by the next session. **The Turnaround line** names a generated picture when the paid picture sheets ran; otherwise the build fills it with a `model_look` picture of the model or the `asset_search` contact sheet of the pick, saved under `refs/sheets/`, which the critic reads against the Silhouette and Colours lines.

## DESIGN.md, the design doc

For a game, and called the design doc everywhere: the file, its headings and its decisions. Its size follows what the person gives:

| The person gives | Design doc size | Extra questions |
|---|---|---|
| One line ("a little 3D game about a lighthouse keeper") | one screen: every section one or two lines, the builder's defaults named | up to 2 |
| A detailed request or full answers | one to three screens, each section filled from the answers | up to 2 |
| Their own design doc (a `DESIGN.md` in the project, a pasted doc, a file they name) | adopted: read, kept as written, Decisions and Decision log added | 0 to 1 |
| "Walk me through the design" or "a full design doc" | every section asked about, one question each, four to a call | up to 8, in two calls |

```markdown
# Design doc: <title>
## Core loop
## Controls
## Progression
## Win and lose
## Levels
## Feel
## Audio
## UI
## Decisions
Surfaced (asked, or to ask):
- Tone: cosy / tense / comic. Asked: cosy.
- Progression: three fixed levels / endless with a score. Asked: three fixed levels.
Left to the builder:
- Camera: follow or fixed isometric (recommended: follow, refs/04.jpg layout).
- Lives or a timer (recommended: a timer, matches the core loop).
## Decision log
2026-10-30 · tone · cosy · over tense, comic · person
2026-10-30 · camera · follow · over fixed isometric · builder, unasked (headless)
```

**A decision is asked** (AskUserQuestion, multiple choice with two to four choices drawn from the references and the study notes, the recommended one first; the two of a one-line or detailed request go in one call) when it changes what the game is and the request leaves it open: tone, the progression shape, the win condition, and for a request that sounds like an existing game, the one thing this game does differently. Everything else (camera, lives or a timer, level count, font) is left to the builder with a recommendation and logged as the builder's. The extra questions come after the usual ones; a request that decides everything, or a person who says to just build it, gets none. With no person present, every surfaced decision is taken as its recommended option and logged `builder, unasked`, and the Decisions section keeps the options not taken so the person can change one by editing DESIGN.md. A logged decision is part of the brief.

BRIEF.md's Must have list stays short and numbered; DESIGN.md is where each item is expanded, and a Must have line is a design doc section's first sentence, so the two never disagree.

## The picture sheets

**The free board, always.** Once LOOK.md is written, `sheet` with `pictures` (each tagged picture with the crop already read for LOOK.md and a label `refs/01.jpg · style · match`), `palette` (the sampled hexes with their names) and `notes` (one line of the camera and lighting words) composes `refs/sheets/LOOK.png`. No picture is read twice for it.

**The paid boards, with a key and a yes.** On a yes to the picture-sheet question, `sheet` with `provider`, `kind: "board"`, the same pictures and a prompt in the words of LOOK.md makes `refs/sheets/LOOK-board.png`, the one paid picture the brief waits for (seconds for most providers, at most 90 s). Then `kind: "turnaround"` once per CHARACTERS.md entry (up to four), with its reference crop and a prompt from its Silhouette, Colours and Materials lines ("front, side, back and three-quarter views of <thing> on a plain background, <colours>"): each starts a background job and returns at once, its picture lands in `refs/sheets/<thing>.png` during the build, and `sheet` with `check: true` says when each is done, before the critic starts. Each picture gets a `.json` beside it with the provider, model, prompt, inputs and price. A failure (a 4xx, a timeout, a provider outage) is one line in the reply or in `check`, the free board stands, and a failed turnaround's line is filled by the build as below: the brief never waits on a turnaround. A generated picture is made from the person's tagged `refs/` pictures, never from a study frame.

## The picking round

After the sheets and before BRIEF.md, for up to four key items (the CHARACTERS.md entries, in order):

1. **Gather.** For each item, one `asset_search` with the Assets line's filters, `image` and `crop` where a tagged picture shows it, and `save: "refs/assets/<thing>.jpg"`. The web assets subagent (`assets.md`) has by then replied with its candidates; their thumbnails go on a second sheet, `sheet` with `pictures` and `out: "refs/assets/<thing>-web.jpg"`, labelled with the number, source and licence.
2. **Show.** Open the sheets in the system viewer in one command (`open refs/assets/*.jpg` on macOS, `xdg-open` on Linux, `start` on Windows) and name their paths in the reply.
3. **Ask once.** One AskUserQuestion call, one question per item (up to four items, so one call): *"Fox courier: where from? (recommended: library 3, the closest to refs/02.jpg)"*, the recommended option first, one option per source that has something to offer, two to four in all (code is always there, so a question never has one option): `library: <the hit's line>` (another number from the sheet can be typed), `web: <the candidate's line and licence>`, `generate with <provider> (about $<price>, <minutes> min) from refs/02.jpg's crop` (with a 3D key), `build in code`. The recommendation is the library when a hit is close to the reference crop and fits the style, the web when the library has nothing close and a verified CC0 or CC BY candidate does, generation when the item is the hero, neither fits and a 3D key is there, and code for a simple shape the design names.
4. **Log.** Each answer becomes the item's Source line in CHARACTERS.md. "None of these", typed, gets one refined search for that item and one more question for it alone.

A request that decides everything, a person who says to just build it, or a one-line request on SKILL.md's quick path gets the sheets with no picking question: step 1 still runs, steps 2 and 3 do not, and each item takes its recommended source, logged `picked by builder`, except that a paid source is never taken unasked: where generation would be recommended, the item takes the next free one (library, web or code) and the reply's line on CHARACTERS.md says generation is there to ask for.

Library picks are downloaded by the build with `pick`; web picks are downloaded, converted when they are FBX or OBJ (`model_run` `load` then `save`), checked with `model_audit` and given the `height` from the sheet; generated models are made during the build, never in the brief (`sheet` `kind: "model"` starts the job and returns at once), then checked with `model_audit` and one `model_look` against the Silhouette line, and `shrink` when over the style's triangle budget. A file that fails its check falls back to the next source in the recommendation order, and the Source line says so; code is the last fallback. The rest of the objects are the builder's: searched with the same filters, the picked assets as the style anchor, and logged under `## Picked by the builder`.

**The soft ask during the build.** The first time the build would make a character or key prop in code that the picking round did not cover, one AskUserQuestion call asks about all such things at once, one question per thing, batched with any other pending question: *"Get <thing> from a source instead of building it in code? It usually looks better. (recommended: library, 2 hits close to refs/03.jpg)"*, the options as above, the recommendation first. A call holds four questions, so a fifth thing and the rest go in one more call; a later batch comes when new key things appear, never one call per prop. On the quick path, and with no person present, there is no soft ask: the builder takes the recommended source when one is there, logs `picked by builder`, and goes on.

## What the sheets never do

A study reference shows how a quality is done; the page is never that game. No name, logo, character, level layout, music or sound of an existing game is recreated, and the sheets describe a style in their own words (palette, shape, light, timing), never as "like <game>" in anything the page shows. Study files stay in `refs/study/`, are never published, and are never copied into the page or `assets/`. Pictures used in the page come from `refs/` (licensed) and `asset_search`.

## When it applies

Each section below is read when its case comes up, not with the rest of this file.

### After a yes to picture sheets

A yes is remembered for the person across projects: right after it, one `sheet` call with `remember: "yes"`. A later check's reply then says `Remembered:`, the question is dropped and picture sheets are made, logged `yes (remembered)`. A person who later says they don't want them gets `remember: "ask"`, and the next brief asks again.

The key is asked in the next AskUserQuestion call, with the design decisions, never in the first batch. With one key found, nothing more is asked and that key is used. With two or three, one option per key, the recommended one first with its reason (the key check names it).

With no key found, the reply says once: *"Picture sheets need an image model key (fal, OpenAI or Gemini): connect one with `/plugin configure paprika3d`, or the provider's usual variable such as `FAL_KEY`, and the next run uses it. The free LOOK.png is made now."* That does not pause the brief.

Without a 3D key, the asset style question's description leaves out the generation clause of the sources line, and the reply carries the check's line on connecting one, once.

### With no person, or without a tool

With no person present, the web search is off unless the request or the brief says to search the web, picture sheets are off, the style is taken from the request's words, and each is logged `unasked`; a request that gets no questions takes the same defaults. The reference subagent still runs when the request names no pictures, and every pick is kept unasked.

A client without AskUserQuestion asks the same lines in plain text with the first question and reads the reply; a reply that answers none of them counts as no.

Without the `sheet` tool (the skill alone, so no `asset_search` either), picture sheets are not offered, the sources line names building in code and the web, and the reference pick files themselves are opened in the system viewer in place of `picks.png`.

### The subagents

The study subagent replies with `refs/study/STUDY.md` and a paragraph of findings; nobody confirms its picks, since nothing in `refs/study/` is ever shown in the page or published. The web assets subagent replies with up to four licensed candidates per item for the picking round.

At the first batch CHARACTERS.md is not written yet, so the web assets subagent's items are the ones the request names or plainly needs ("a fox courier" and "parcels"). CHARACTERS.md may add to them later: a second web assets subagent starts for a key item the first did not cover, with that item alone, and replies before the picking round, or that item goes to the library and code.

Without an Agent tool, this session runs `study.md`'s steps itself, capped at 4 searches and 1 video, and `assets.md`'s with its API sources.

### Question edge cases

A question never has one option: one with a single choice gets a second ("Keep" and "Drop", or "Yes" and "No"). The reference picks: up to four are one question; five or six are two questions in the one call, split evenly (three and two, three and three), never one option alone; a single pick is one question, Keep / Drop.
