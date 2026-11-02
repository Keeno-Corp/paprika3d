---
title: How to make an RPG game in three.js: turn-based fights, XP and levels
phrase: how to make an rpg game
description: How to make a small RPG in the browser with three.js, for a first game: a hero who walks a meadow and meets slimes, a turn-based fight with Attack, Defend and Run buttons, damage worked out as attack minus defence, the enemy's turn after a pause with every key and button locked until it is over, and experience points that level the hero up without losing what is left over; a slime-meadow game to paste, the prompt to give an AI agent, what to check when fights go wrong, and paprika3d's interact starting a fight, pressing the keys and checking the damage and the level-up.
meta: How to make an RPG game in three.js: turn-based fights on buttons, damage from attack and defence, and XP that levels the hero up.
intent: make-an-rpg-game
queries:
  - "how to make a rpg game"
  - "how to make a game like pokemon"
  - "how to make a game like undertale"
  - "How to implement turn-based game engine?"
  - "How to balance experience gain in an RPG"
author: paprika3d agent
date: 2026-10-30
review: weekly
---
# How to make an RPG game in three.js: turn-based fights, XP and levels

An RPG (role-playing game) is a game where you play a hero who grows stronger as you play. Pokémon, Zelda, Final Fantasy and Undertale look very different, but they share a core: a world to walk around in, fights, and numbers that describe the hero and go up with experience. Pokémon and Undertale fight in turns, Undertale with a dodging game during the enemy's turn; Zelda fights in real time. This page builds the turn-based kind, because it is the one most people mean by "an RPG like Pokémon", and because a turn-based fight is easier to get right in a first game.

The smallest RPG that feels like one has five parts:

1. **A world to explore**, here a meadow you walk with the arrow keys.
2. **Stats**, the numbers that describe a fighter: **HP** (hit points, how much damage it can take), **attack** and **defence**.
3. **A fight in turns**: you choose an action, then the enemy acts, then you again, until one side's HP reaches zero.
4. **Experience points (XP)** for every win.
5. **Levels**: enough XP raises the hero's level, and each level raises the stats.

Story, talking to people, quests and an inventory are added on top of these later. A few words first: **three.js** is a JavaScript library that draws 3D scenes in a web page, inside a **canvas** (the rectangle where the game appears). The **game loop** is a function the browser calls about sixty times a second to move things and draw a picture. **HTML** is the rest of the page: text and buttons, which can sit on top of the canvas.

## Two modes: exploring and fighting

The game is in one of two modes at a time, kept in one variable: `phase` is `'explore'` while you walk and `'fight'` during a battle. While exploring, the arrow keys move the hero; touching a slime switches to `'fight'`, which stops the walking, brings the camera in close and shows the battle panel. One variable for the mode, checked at the top of the code that moves things, is the same idea as a game over screen's; [how to add a game over screen](/guides/add-a-game-over-screen) explains it in more detail.

The battle panel is plain HTML laid over the canvas: the slime's HP, one line of messages and three buttons. Buttons and text are easier in HTML than in 3D: they stay sharp, they take a click with no extra code, and you style them with CSS.

## Damage: attack minus defence

Every fight needs a rule for how much a hit takes off. A common first rule, and the one used here, is the attacker's attack minus the defender's defence, but never less than 1:

```js
const damage = (atk, def) => Math.max(1, atk - def);
```

The "never less than 1" matters: without it a strong defender takes 0 or even a negative number, which heals it. The hero starts with attack 5 against a slime's defence 1, so each hit does 4, and a slime with 8 HP falls in two hits. The slime's attack 4 against the hero's defence 2 does 2 a hit. Most RPGs then add a little randomness (a hit of 3 to 5 instead of always 4) or an occasional double-damage critical hit; add those once the plain rule works, so you can still check the numbers by hand.

## Turns, and why the enemy's turn needs a lock

A second variable says whose turn it is: `turn` is `'hero'` or `'slime'`. When you press Attack, the game takes HP off the slime, writes "You hit the slime for 4." and sets `turn` to `'slime'`. After a short pause (0.8 s, so you can read the message) the slime hits back and `turn` goes back to `'hero'`.

During that pause, the game must ignore you. A turn-based game that skips this lets a quick double press attack twice before the enemy moves, and a slime with 8 HP dies to two fast presses without ever hitting back. The fix is one line at the top of the function that handles your choice:

```js
if (phase !== 'fight' || turn !== 'hero') return;   // one press is one action
```

The buttons are greyed out during the slime's turn too, so you can see why nothing happens. The keys 1, 2 and 3 and the three buttons all call the same function, `choose`, so they cannot behave differently.

**Defend** halves the slime's next hit (rounded up). **Run** works half the time; when it works the fight ends, and for 1.5 s no slime can start a new one. Without that short safe time, the slime you just ran from is still touching you and the same fight starts again on the next frame.

## Experience and levels

Each slime gives 6 XP. The hero needs 10 XP for level 2, and after that the level times 10 for the next one: 20 for level 3, 30 for level 4. Each level adds 5 to the hero's highest HP, 2 to attack and 1 to defence, and refills HP.

Two details make levelling correct:

- **Keep what is left over.** At 9 XP, a win worth 6 makes 15: that is level 2 with 5 XP toward level 3, not level 2 with 0. Subtract the XP needed instead of setting it to zero.
- **Use a loop, not one check.** A large reward can be worth two levels at once. `while (hero.xp >= hero.next)` levels up as many times as the XP allows; an `if` levels up once and leaves the rest stuck.

How much XP a level should take has no single right answer; the Stack Exchange thread "How to balance experience gain in an RPG" is long for that reason. Pick a rule, play it, and count how many fights a level takes. Here, level 2 takes two slimes.

## The game: slime meadow

Walk with the arrow keys or WASD. Touch a green slime to fight it: press 1 or click Attack, 2 to Defend, 3 to Run. The top line shows your level, HP and XP. Save it as `index.html`, run `npm install three` in its folder (this needs Node.js, a free program that installs JavaScript libraries), serve the folder with `python3 -m http.server 8000` and open `http://localhost:8000`. If the page stays blank, [HTML game not working?](/guides/html-game-not-working) lists the usual first-run faults; smoother walking is explained in [how to make a character move in JavaScript](/guides/make-a-character-move-in-javascript).

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Slime meadow</title>
<style>html,body{margin:0;overflow:hidden;background:#9fd3f0}canvas{display:block}
#hud{position:fixed;top:12px;left:16px;color:#fff;font:600 20px system-ui;text-shadow:0 1px 3px #000}
#fight{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);width:520px;padding:14px 18px;border-radius:10px;
  background:rgba(20,24,40,.88);color:#fff;font:600 18px system-ui;display:flex;flex-direction:column;gap:10px}
#fight[hidden]{display:none}                 /* without this, display:flex above would show the panel all the time */
#fight .row{display:flex;gap:10px}
#fight button{flex:1;font:inherit;padding:8px;cursor:pointer}
#fight button:disabled{opacity:.4;cursor:default}</style></head>
<body>
<div id="hud"></div>
<div id="fight" hidden>
  <div id="foe"></div>
  <div id="log"></div>
  <div class="row"><button id="attack">1 Attack</button><button id="defend">2 Defend</button><button id="run">3 Run</button></div>
</div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The numbers that make the fights: a hit does attack minus defence, and never less than 1.
const hero = { hp: 20, maxHp: 20, atk: 5, def: 2, level: 1, xp: 0, next: 10, x: 0, z: 0 };
const SLIME = { hp: 8, atk: 4, def: 1, xp: 6 };
const damage = (atk, def) => Math.max(1, atk - def);

let phase = 'explore', turn = 'hero', foe = null, defending = false, safe = 0, pending = null;
const fightPanel = document.getElementById('fight'), logLine = document.getElementById('log');
const buttons = [...fightPanel.querySelectorAll('button')];
const say = text => { logLine.textContent = text; };
const later = (seconds, then) => { pending = { t: seconds, then }; };   // the slime's turn comes after a pause you can read

function startFight(slime) {
  phase = 'fight'; turn = 'hero'; defending = false;
  foe = { ...SLIME, slime };
  slime.position.set(hero.x + 1.6, 0.3, hero.z);                         // the slime hops in front of you
  say('A slime blocks the path!');
}
function endFight() { phase = 'explore'; turn = 'hero'; foe = null; safe = 1.5; }       // 1.5 s before another slime can start a fight

// The hero's turn. While it is the slime's turn, every choice is ignored: one press is one action.
function choose(choice) {
  if (phase !== 'fight' || turn !== 'hero') return;
  if (choice === 'attack') { const d = damage(hero.atk, foe.def); foe.hp = Math.max(0, foe.hp - d); say(`You hit the slime for ${d}.`); }
  if (choice === 'defend') { defending = true; say('You raise your shield.'); }
  if (choice === 'run') {
    if (Math.random() < 0.5) { say('You got away.'); endFight(); return; }
    say('You could not get away!');
  }
  turn = 'slime';
  if (foe.hp <= 0) later(0.6, win); else later(0.8, slimeTurn);
}
function slimeTurn() {
  let d = damage(foe.atk, hero.def);
  if (defending) d = Math.ceil(d / 2);
  defending = false;
  hero.hp = Math.max(0, hero.hp - d);
  say(`The slime hits you for ${d}.`);
  if (hero.hp <= 0) { later(0.8, faint); return; }
  turn = 'hero';
}
function win() {
  say(`The slime is defeated. +${foe.xp} XP`);
  foe.slime.visible = false;
  slimes.splice(slimes.indexOf(foe.slime), 1);
  gainXp(foe.xp);
  endFight();
}
function gainXp(n) {
  hero.xp += n;
  while (hero.xp >= hero.next) {                                          // a big win can be worth two levels
    hero.xp -= hero.next;                                                 // keep what is left over
    hero.level++;
    hero.next = hero.level * 10;
    hero.maxHp += 5; hero.atk += 2; hero.def += 1;
    hero.hp = hero.maxHp;
  }
}
function faint() { hero.hp = hero.maxHp; hero.x = 0; hero.z = 0; endFight(); }

buttons.forEach(b => b.addEventListener('click', () => choose(b.id)));
const held = new Set();
function act({ key, down = true }) {
  const choice = { Digit1: 'attack', Digit2: 'defend', Digit3: 'run' }[key];
  if (down && choice) choose(choice);
  if (down) held.add(key); else held.delete(key);
}
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.code }); });
addEventListener('keyup', e => act({ key: e.code, down: false }));
addEventListener('blur', () => held.clear());

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd3f0);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
scene.add(new THREE.HemisphereLight(0xffffff, 0x507030, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(5, 10, 4);
scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x6cb04a }));
ground.name = 'meadow';
scene.add(ground);
for (const [x, z] of [[-6, -5], [5, -7], [8, 2], [-9, 4], [-3, 9], [10, -12], [-12, -10], [3, 12]]) {
  const tree = new THREE.Mesh(new THREE.ConeGeometry(1, 2.6, 8), new THREE.MeshStandardMaterial({ color: 0x2f7a3a }));
  tree.name = 'tree';
  tree.position.set(x, 1.3, z);
  scene.add(tree);
}
const heroMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.7, 4, 12), new THREE.MeshStandardMaterial({ color: 0x3060d0 }));
heroMesh.name = 'hero';
scene.add(heroMesh);
const slimes = [[4, -3], [-5, 2], [6, 6], [-2, -8], [-8, -2]].map(([x, z]) => {
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 12), new THREE.MeshStandardMaterial({ color: 0x40d070 }));
  s.name = 'slime';
  s.position.set(x, 0.3, z);
  s.userData.heading = Math.random() * Math.PI * 2;
  scene.add(s);
  return s;
});

function step(dt) {
  if (pending && (pending.t -= dt) <= 0) { const then = pending.then; pending = null; then(); }
  if (phase !== 'explore') return;
  safe = Math.max(0, safe - dt);
  const dx = (held.has('ArrowRight') || held.has('KeyD')) - (held.has('ArrowLeft') || held.has('KeyA'));
  const dz = (held.has('ArrowDown') || held.has('KeyS')) - (held.has('ArrowUp') || held.has('KeyW'));
  const len = Math.hypot(dx, dz) || 1;
  hero.x = Math.max(-18, Math.min(18, hero.x + dx / len * 5 * dt));
  hero.z = Math.max(-18, Math.min(18, hero.z + dz / len * 5 * dt));
  for (const s of slimes) {
    if (Math.random() < dt / 2) s.userData.heading = Math.random() * Math.PI * 2;   // a new direction about every 2 s
    s.position.x = Math.max(-15, Math.min(15, s.position.x + Math.cos(s.userData.heading) * dt));
    s.position.z = Math.max(-15, Math.min(15, s.position.z + Math.sin(s.userData.heading) * dt));
    if (!safe && Math.hypot(s.position.x - hero.x, s.position.z - hero.z) < 0.9) { startFight(s); break; }
  }
}

const hud = document.getElementById('hud');
let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  heroMesh.position.set(hero.x, 0.7, hero.z);
  const focus = foe ? foe.slime.position : heroMesh.position;
  camera.position.set((hero.x + focus.x) / 2, foe ? 3 : 8, (hero.z + focus.z) / 2 + (foe ? 5 : 9));   // closer in a fight
  camera.lookAt((hero.x + focus.x) / 2, 0.5, (hero.z + focus.z) / 2);
  for (const s of slimes) s.scale.y = 0.7 + 0.15 * Math.sin(now / 150 + s.position.x);
  hud.textContent = `Level ${hero.level}   HP ${hero.hp}/${hero.maxHp}   XP ${hero.xp}/${hero.next}`;
  fightPanel.hidden = phase !== 'fight';
  if (foe) document.getElementById('foe').textContent = `Slime HP ${foe.hp}/${SLIME.hp}`;
  buttons.forEach(b => b.disabled = turn !== 'hero');
  renderer.render(scene, camera);
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.__game = {
  describe: () => ({ name: 'slime meadow', keys: { ArrowRight: 'walk right', ArrowLeft: 'walk left', ArrowUp: 'walk up', ArrowDown: 'walk down',
    Digit1: 'attack, in a fight', Digit2: 'defend, in a fight', Digit3: 'run, in a fight' } }),
  observe: () => ({ phase, turn, hero: { ...hero, x: +hero.x.toFixed(2), z: +hero.z.toFixed(2) }, foe: foe && { hp: foe.hp }, slimes: slimes.length }),
  act,
  setState: s => {
    if (s.hero) Object.assign(hero, s.hero);
    if (s.phase === 'fight' && !foe) startFight(slimes[0]);
    if (s.foe && foe) Object.assign(foe, s.foe);
  },
  subject: heroMesh,
};
</script>
</body></html>
```

The stats are at the top of the script: change `SLIME` to make a tougher monster, or the numbers in `gainXp` to change how fast the hero grows. `window.__game` at the end lets a test tool start a fight, read the HP and XP and press the keys; the game plays the same without it.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code, Cursor or Codex that writes and edits the files of your project) can write all of this from a description that names the rules:

```text
Make a small turn-based RPG in one index.html with three.js. A hero walks a meadow
with the arrow keys; touching a slime starts a fight. The fight is an HTML panel over
the canvas with Attack, Defend and Run buttons (also keys 1, 2, 3). Damage is attack
minus defence, at least 1. After my action, the slime acts after a short pause, and
my keys and buttons do nothing until it has. Each slime gives XP; level up with a loop
that keeps leftover XP, raising HP, attack and defence. After running away, give a
short moment before another fight can start.
```

Then grow it: a second monster with other stats, a village with a person who talks (see [how to make a dialogue system in a game](/guides/make-a-dialogue-system-in-a-game)), or a boss. [Build a three.js game with an AI agent](/guides/ai-agent-build-threejs-game) covers working with an agent over several steps.

## When the fights go wrong

- **One quick double press attacks twice.** Choices are not locked during the enemy's turn.
- **The enemy never gets a turn.** The enemy's move is waiting on a timer that the hero's next action replaces or cancels. The same lock fixes it.
- **A hit heals the enemy,** or does 0. The damage rule has no minimum.
- **The hero levels up but loses XP,** or a big win gives one level when it should give two. Subtract instead of resetting, and level up in a loop.
- **Running away starts the same fight again.** Add a short safe time after a fight ends.
- **The battle panel is on screen from the start.** A CSS rule such as `display: flex` overrides the `hidden` attribute; add `#fight[hidden] { display: none }`, as the game does.
- **HP shows a negative number.** Clamp it at zero.

## Let the agent fight the slimes

Fight logic is hard to check by playing: you have to walk to a slime every time, and a double press is easy to miss. paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens the game in a hidden Chrome browser so the agent can set up a fight and play it. Install it in Claude Code with these two lines in a terminal (the window where you type commands):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

`interact` takes a `{ state }` step that puts the game straight into a moment through the game's `setState`, here the start of a fight, then presses keys on exact frames and checks the result with `expect`. With `look: true` it also returns the picture and what is on it, including the HTML over the canvas. These replies were captured on 2026-10-30 on the game above, on a machine with no graphics card where Chrome draws in software; the first reply is cut to its first lines and the line about the HTML.

```text
interact {"steps": [{"state": {"phase": "fight"}}], "look": true}

{"changed":{"phase":"fight","foe":{"hp":8}}}
Picture: <project>/paprika3d/runs/2026-10-30T23-26-04-402Z/look-1.png
HTML over the canvas: 2 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Level 1 HP 20/20 XP 0/10" [16, 12, 303, 34], div#fight "Slime HP 8/8 A slime blocks the path! 1 " [362, 648, 917, 775].
```

The battle panel is up, on screen and not cut off, with the slime at full HP. Then the double press. On a first version of this game without the lock line, two presses of 1 on back-to-back frames gave:

```text
interact {"steps": [{"state": {"phase": "fight"}}, {"key": "Digit1"}, {"key": "Digit1"}], "expect": {"foe.hp": 4, "turn": "slime"}, "save": "one-press-one-action"}

{"changed":{"phase":"fight","turn":"slime","foe":{"hp":0}}}
Expect: foe.hp 0 ✗ expected 4 · turn "slime" ✓
Not saved: an Expect entry failed, and a saved check must pass when it is saved.
```

The slime died to two fast presses without ever acting. With the lock, the same call passes and is kept as a check:

```text
{"changed":{"phase":"fight","turn":"slime","foe":{"hp":4}}}
Expect: foe.hp 4 ✓ · turn "slime" ✓
Saved check "one-press-one-action" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

The level-up, with the hero set to 9 XP before a fight; `until` waits for the slime's turn to pass and for the fight to end:

```text
interact {"steps": [{"state": {"phase": "fight", "hero": {"xp": 9}}}, {"key": "Digit1"}, {"until": {"turn": "hero"}}, {"key": "Digit1"}, {"until": {"phase": "explore"}}], "expect": {"hero.level": 2, "hero.xp": 5, "hero.next": 20, "hero.atk": 7, "hero.hp": 25}, "save": "level-up-keeps-leftover-xp"}

{"changed":{"hero":{"hp":25,"maxHp":25,"atk":7,"def":3,"level":2,"xp":5,"next":20},"slimes":4}}
until: turn == "hero" held at frame 49
until: phase == "explore" held at frame 86
Expect: hero.level 2 ✓ · hero.xp 5 ✓ · hero.next 20 ✓ · hero.atk 7 ✓ · hero.hp 25 ✓
Saved check "level-up-keeps-leftover-xp" in game-tests.json (2 checks now); `test` reruns them all, each from a fresh reload.
```

Two hits won the fight, the 5 left-over XP were kept, and every stat rose as the rules say. A third check clicks the Attack button itself, at its place in the panel, and `test` replays all three after each change:

```text
interact {"steps": [{"state": {"phase": "fight"}}, {"mouse": "click", "x": 463, "y": 742}], "expect": {"foe.hp": 4}, "save": "attack-button"}

{"changed":{"phase":"fight","turn":"slime","foe":{"hp":4}}}
Expect: foe.hp 4 ✓
Saved check "attack-button" in game-tests.json (3 checks now); `test` reruns them all, each from a fresh reload.

test {}

✓ one-press-one-action
✓ level-up-keeps-leftover-xp
✓ attack-button
3 of 3 saved checks passed in 1.1 s
```

What paprika3d does not do: it does not balance the game, write its story or tell you whether the fights are fun. It checks that the rules you chose are the rules the game follows, so when you change a number, the agent finds out at once whether something else broke.

## Next steps

- People to talk to and a quest to take: [how to make a dialogue system in a game](/guides/make-a-dialogue-system-in-a-game).
- A new dungeon to explore every run: [how to make a roguelike game](/guides/make-a-roguelike-game).
- A title screen, a pause menu and a sound setting: [how to make a main menu for a game](/guides/make-a-main-menu).
- Make a hit feel like a hit, with a flash and a shake: [how to make a game feel good](/guides/make-a-game-feel-good).
- Sounds for a hit and a level-up: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
