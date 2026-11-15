---
title: three.js skills for Claude Code: what a skill tells the agent and what it still has to check
phrase: three.js skills for claude code
description: What a three.js skill gives Claude Code or another coding agent (a SKILL.md it loads when the task matches), how to add paprika3d's skills with npx skills add, what its threejs-game skill tells the agent, and what no skill does by itself (open the page and look at it). Shown on a bonsai generator, branches grown from a seed and pruned by clicking, checked with look, interact and a saved test.
meta: three.js skills for Claude Code: what a SKILL.md tells the agent, how npx skills add installs one, and the page checks a skill cannot run alone.
intent: threejs-skills-for-claude-code
queries:
  - "three.js skills for claude code"
  - "three.js skills github"
  - "codex three js skill"
  - "claude code three js skill"
  - "cursor three js skill"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# three.js skills for Claude Code: what a skill tells the agent and what it still has to check

A skill is a folder with a `SKILL.md` that Claude Code loads when its description matches the task. For three.js it is text the agent reads: how to structure a scene, which mistakes to avoid, how to check the result. It cannot open the page or look at it by itself; that needs tools. paprika3d ships both: skills that say how to build and check a three.js page, and the MCP tools they point to (`open`, `look`, `interact`). In Claude Code the plugin installs the two together:

```bash
claude plugin marketplace add Keeno-Corp/paprika3d && claude plugin install paprika3d@paprika3d
```

For Cursor, Codex, OpenCode and other agents, `npx skills add Keeno-Corp/paprika3d` adds the skills and `npx -y paprika3d serve`, registered as a stdio MCP server, adds the tools ([install](/install)).

## What a skill is in Claude Code

Claude Code reads skills from `.claude/skills/<name>/SKILL.md` in a project and `~/.claude/skills/<name>/SKILL.md` for every project, and from installed plugins. The frontmatter's `description` says what the skill does and when to use it; Claude Code keeps the descriptions in context and loads a skill's full text when a task matches or when you type `/<skill-name>` ([Claude Code's skills docs](https://code.claude.com/docs/en/skills)). A plugin's skills run as `/<plugin>:<skill>`. Other agents read the same `SKILL.md` format from their own folders.

So a three.js skill changes what the agent knows while it writes the code. Whether the code draws what was asked is still a question about the running page.

## Adding paprika3d's skills with npx skills

`npx skills add` is the skills CLI ([github.com/vercel-labs/skills](https://github.com/vercel-labs/skills)). `--list` shows what a repository holds. This is its reply for paprika3d's public repository on 2026-11-12, shortened: the progress lines are left out, and each skill's description, which the CLI prints in full on the line below its name, is cut to its first words here:

```text
npx skills add Keeno-Corp/paprika3d --list

◇  Source: https://github.com/Keeno-Corp/paprika3d.git
◇  Repository cloned
◇  Found 9 skills
◇  Available Skills
│    paprika-loop        Builds the person's three.js request over a set time ...
│    paprika-make        Builds what the person asks for in three.js, React Three Fiber or WebGL ...
│    paprika-publish     Publish to <name>.paprika3d.app (invite-only preview) ...
│    threejs-game        Runs, sees, plays, measures and speeds up any three.js, React Three Fiber or WebGL page ...
│    threejs-glb-audit   Check and shrink the .glb, .gltf and USD models a three.js page loads ...
│    threejs-perf        Profile a three.js or WebGL page from a coding agent ...
│    threejs-play        Play a three.js or WebGL game or interactive page from a coding agent ...
│    threejs-screenshot  Screenshot a three.js, React Three Fiber or WebGL page headless ...
│    threejs-test        Test a three.js or WebGL game a coding agent builds ...
```

`--skill <name>` adds one, and `-a` names the agent (`claude-code`, `cursor`, `codex`, `github-copilot` and others; the CLI lists them). In an empty folder, `npx skills add Keeno-Corp/paprika3d --skill threejs-game -a claude-code -y` ended with `✓ threejs-game (copied)` and left these files: the skill, its references and its templates under `.claude/skills/`, and a `skills-lock.json` recording where it came from.

```text
.claude/skills/threejs-game/SKILL.md
.claude/skills/threejs-game/references/   assets.md configurator.md fx.md geometry.md lighting.md optimize.md state.md tools.md
.claude/skills/threejs-game/templates/    plain.html r3f.tsx rapier.ts viewer.html
skills-lock.json
```

In Claude Code the plugin already carries these skills, so `npx skills add` is for other agents, or for a project that wants the skill files in its own repository. The task skills (`threejs-screenshot`, `threejs-play`, `threejs-test`, `threejs-perf`, `threejs-glb-audit`) are short pages, each naming its tools and pointing at `threejs-game` for the method; `paprika-make`, `paprika-loop` and `paprika-publish` are written for Claude Code.

## What the threejs-game skill tells the agent

It covers what each tool shows (`open`, `interact`, `look`, `reference`, `eval`, `feel`), which calls reload the page first and which carry on from where it is, when to use the game-state package, performance and models, and the `window.__game` convention: `describe()`, `observe()`, `act(input)` and `setState(partial)`. Its rules are the things a three.js page gets wrong when nothing checks it, for example:

- **Time.** "The harness steps frames of 1/60 s on a fake clock ... Advance the game by each frame's elapsed time, at most 0.1 s a frame."
- **Names.** "Give meshes a `name` (`player`, `coin`): `look` lists what is on screen by name."
- **Start.** "The game plays as soon as the page loads: no title screen, no click to start, nothing over the first frame."

The task skills end with the case where the text arrives without the tools, in the words of `threejs-play`: "If `open` and `interact` are not among your tools, the paprika3d MCP server is not installed: it runs as `npx -y paprika3d serve` (stdio)".

## What a skill cannot do by itself

A skill can tell the agent to name its meshes and expose `window.__game`; it cannot tell whether the click it wrote lands. The bonsai below followed every rule above in its first version and still lost a click: three.js updates the camera's matrices inside `render()`, so a click that arrives before the first frame is drawn casts its ray from the wrong place. A check saved from a fresh reload sends its click before that first frame, and `interact` said so:

```text
interact {"steps": [{"mouse": "click", "x": 593, "y": 305}], "expect": {"branches": 8, "leaves": 4}, "save": "prune-branch-1"}

{"after":{"seed":1,"branches":15,"leaves":8,"pruned":[]},"changed":{}}
Expect: branches 15 ✗ expected 8 · leaves 8 ✗ expected 4
Not saved: an Expect entry failed, and a saved check must pass when it is saved.
```

One line fixed it (`camera.updateMatrixWorld()` after `lookAt`, in the page below). Nothing in the skill's text could have reported it; running the page did.

## The bonsai

A tree grown from a seed: a trunk that splits in two three times, 15 branches, with leaves on the 8 tips. Each branch is a named group at its parent's tip, so removing one removes everything it carries. A click prunes the branch under the pointer; ArrowRight grows the tree from the next seed. Save it as `index.html` and run `npm install three` beside it.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Bonsai</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// A bonsai grown from a seed: each branch splits in two, three times. Click a branch to prune it and all it carries.
const DEPTH = 3;
let seed = 1, pruned = [];

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe8e2d4);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 50);
camera.position.set(0, 1.9, 6.5);
camera.lookAt(0, 1.4, 0);
camera.updateMatrixWorld();   // render() does this; a click before the first frame needs it already
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a60, 1.8));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(2, 5, 3);
scene.add(sun);

const pot = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.9, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0x3a4a5a }));
pot.name = 'pot';
pot.position.y = 0.25;
scene.add(pot);
const bark = new THREE.MeshStandardMaterial({ color: 0x6a4a32, roughness: 0.9 });
const foliage = new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.8, flatShading: true });
let tree = null;

// Each branch is a named group at its parent's tip; its children hang under it, so removing it prunes them too.
function grow(name, depth, length, radius, rand) {
  const group = new THREE.Group();
  group.name = name;
  const wood = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.7, radius, length, 7).translate(0, length / 2, 0), bark);
  group.add(wood);
  if (depth === DEPTH) {
    const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0).scale(1.3, 0.7, 1.3), foliage);
    leaves.position.y = length;
    leaves.userData.leaves = true;
    group.add(leaves);
    return group;
  }
  for (let i = 1; i <= 2; i++) {
    const child = grow(`${name === 'trunk' ? 'branch' : name}-${i}`, depth + 1, length * 0.72, radius * 0.65, rand);
    child.position.y = length;
    child.rotation.set(0, (i === 1 ? 0 : Math.PI) + rand() * 1.2, 0.35 + rand() * 0.45, 'YXZ');
    group.add(child);
  }
  return group;
}
function plant(s) {
  if (tree) scene.remove(tree);
  seed = s; pruned = [];
  let n = s * 9973;
  const rand = () => (n = (n * 16807) % 2147483647) / 2147483647;   // the same tree for the same seed
  tree = grow('trunk', 0, 1.1, 0.16, rand);
  tree.position.y = 0.5;
  scene.add(tree);
  scene.updateMatrixWorld();   // the same for the branches
}
plant(1);

function prune(name) {
  const branch = tree.getObjectByName(name);
  if (!branch || branch === tree) return false;   // the trunk stays
  branch.removeFromParent();
  pruned.push(name);
  return true;
}
function act({ key, down = true, action, branch }) {
  if (key === 'ArrowRight' && down) plant(seed + 1);
  if (action === 'prune') prune(branch);
}
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.key }); });

const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', e => {
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  let hit = ray.intersectObject(tree, true)[0]?.object;
  while (hit && !hit.name) hit = hit.parent;   // the nearest named group is the branch
  if (hit) prune(hit.name);
});
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
renderer.setAnimationLoop(() => renderer.render(scene, camera));

const count = test => { let n = 0; tree.traverse(o => { if (test(o)) n++; }); return n; };
window.__game = {
  describe: () => ({ name: 'bonsai', keys: { ArrowRight: 'grow a new tree from the next seed' }, mouse: 'click a branch to prune it', actions: { prune: '{ action: "prune", branch: name }' } }),
  observe: () => ({ seed, branches: count(o => o.isGroup), leaves: count(o => o.userData.leaves), pruned: [...pruned] }),
  act,
  setState: s => { if (s.seed !== undefined) plant(s.seed); },
};
</script>
</body></html>
```

## The check the skill sends the agent to

Each call is followed by the reply paprika3d's stable tools gave on 2026-11-12 (pixel and hue lines left out). Run folder paths are shortened to `<project>`.

**Look.** The branches come back by name. Siblings that differ in their last number are grouped into one line with `*` and a count:

```text
look {}

Picture: <project>/paprika3d/runs/2026-11-12T04-54-49-693Z/look-1.png
On screen (24):
pot 4.2% [467, 519, 812, 680]
branch-1-1-* ×4 1.7% [341, 130, 463, 341]
branch-2-2-* ×4 1.3% [693, 53, 862, 169]
branch-1-2-* ×4 1.3% [412, 62, 571, 180]
trunk 0.81% [614, 367, 665, 554] 1.1 × 0.312 units
branch-2-1-* ×4 1.1% [726, 145, 872, 287]
branch-* ×2 0.71% [546, 248, 722, 371] 0.792 × 0.203 units, across the view
branch-1-* ×2 0.34% [462, 173, 562, 272] 0.57 × 0.132 units
branch-2-* ×2 0.26% [704, 163, 771, 260] 0.57 × 0.132 units
Never visible: none
```

`branch-1-1-* ×4` is the two tips under `branch-1-1`, each a wood mesh and a leaf mesh, inside one box.

**Prune a tip.** A click inside that box, with the picture after it:

```text
interact {"steps": [{"mouse": "click", "x": 400, "y": 290}], "look": true}

{"changed":{"branches":14,"leaves":7,"pruned":["branch-1-1-1"]}}
mouse click at (400, 290): over branch-1-1-1 (Group, 5.8 units)
Picture: <project>/paprika3d/runs/2026-11-12T04-54-49-693Z/look-2.png
On screen (22):
...
branch-1-1-* ×2 0.97% [341, 130, 462, 273]
```

The click line names the branch under the pointer, the state lost one branch and one leaf cluster, and the `branch-1-1-*` box lost its lower part (bottom 341 px to 273 px): the page pruned what the player clicked.

**Prune a big branch and keep it as a check.** `expect` checks the state after the click; `save` plays it from a fresh reload and keeps it in `game-tests.json` when it passes; `test` reruns every saved check:

```text
interact {"steps": [{"mouse": "click", "x": 593, "y": 305}], "expect": {"branches": 8, "leaves": 4}, "save": "prune-branch-1"}

{"changed":{"branches":8,"leaves":4,"pruned":["branch-1"]}}
Expect: branches 8 ✓ · leaves 4 ✓
Saved check "prune-branch-1" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.

test {}

✓ prune-branch-1
1 of 1 saved checks passed in 0.2 s
```

Pruning `branch-1` took it and the six branches it carried (7 of 15) and their 4 leaf clusters. In Claude Code the plugin's after-edit hook reruns the check after each edit; in other agents, `test` does it when called.

## Other three.js skills

Other repositories of three.js skills turn up for the same search, and they work alongside paprika3d's. [CloudAI-X/threejs-skills](https://github.com/CloudAI-X/threejs-skills) is reference text across three.js: fundamentals, shaders, post-processing, React Three Fiber and the asset pipeline. [majidmanzarpour/threejs-game-skills](https://github.com/majidmanzarpour/threejs-game-skills) is a set of game-building skills with a director skill as its entry point, and ships a Vite and TypeScript starter with Playwright test templates. Both install with `npx skills add` and the repository name. Reference skills make the code the agent writes better informed; a tool that opens the page tells it what that code drew.

## What paprika3d does not do here

- Its skills are text, like any skill: without the MCP server they tell the agent which tools to call and the agent has none to call. `npx skills add` alone does not install the server.
- `paprika-make`, `paprika-loop` and `paprika-publish`, and the after-edit hook, are Claude Code features; in other agents the tools and the `threejs-*` skills work and those do not.
- It does not judge whether a bonsai is well shaped. `look` returns the picture and what is in it; taste stays with you.
- Without a GPU, Chrome draws WebGL in software (SwiftShader), and frame times there say nothing of a real GPU. It does not run the page on a phone or another real device.

## Related

- [Screenshot a three.js scene headless from a coding agent](/guides/screenshot-threejs-scene-headless): the `look` call itself, from four sides and at phone sizes.
- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): keys on exact frames and checks that rerun.
- [three.js click on object with a Raycaster, and why the click hits the wrong one](/guides/threejs-click-on-object-raycaster): picking the object under a click.
- [How to make a game with Cursor](/guides/make-a-game-with-cursor): the MCP server and the skills in Cursor.
- [How to make a game with Codex](/guides/make-a-game-with-codex): the same in the Codex CLI.
