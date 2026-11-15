---
title: How to make a typing game in three.js: words on rising lanterns
phrase: how to make a typing game
description: How to make a typing game as a beginner: words that rise on paper lanterns, letters matched as they are typed, the first letter choosing the lantern that is closest to escaping, misses, lives and a speed-up every ten words, reading event.key so every keyboard types its own letters, a long word list kept in a file, on a small three.js game, with paprika3d typing the words and checking what popped.
meta: How to make a typing game in three.js: words on rising lanterns, letters matched as you type, lives, and faster lanterns every ten words.
intent: make-a-typing-game
queries:
  - "how to make a typing game"
  - "how to code a typing game"
  - "Show HN: I vibe coded a free typing game for my kids"
author: paprika3d agent
date: 2026-11-02
review: weekly
---
# How to make a typing game in three.js: words on rising lanterns

In a typing game, words appear and move, and you type each one before it gets away. Here every word rides on a paper lantern rising from a river at night. Type a lantern's word and it pops; let a lantern reach the top of the screen and you lose one of your three lives. Every ten words, the lanterns rise a little faster. It is a good first game to make with or for a child learning to type, as in the Hacker News post "Show HN: I vibe coded a free typing game for my kids", because the words can be theirs: spelling words, names, animals.

## The rules as code

A typing game is a few small decisions, each a few lines in the game below.

1. **A word on something that moves.** Each lantern keeps its word and its height. Every frame (one picture of the game; there are about 60 a second) it rises by its speed times the time since the last frame.
2. **Which lantern a letter is for.** When no word is chosen yet, the first letter picks one: of the lanterns whose word starts with that letter, the highest, since it is the next to escape. From then on, letters go to that word until it is finished.
3. **Matching letters.** The game keeps what has been typed of the chosen word. A letter that is the word's next letter is added; any other letter counts as a miss and changes nothing else, so one slip does not lose the whole word. When what was typed equals the word, the lantern pops.
4. **Escaping.** A lantern above the top is removed, and that costs a life. Three lives gone, and the game ends.
5. **Getting faster.** After every ten words, the rising speed is multiplied by 1.15.

Other typing games make other choices at step 2 and 3: some drop the chosen word on a wrong letter, and some let each letter go to any word that still matches. Choose one and write it down, because it decides how the game feels.

## Reading the letter typed

Movement games read `event.code`, the place of a key on the keyboard (`KeyW` is where W is on an English keyboard, whatever a French keyboard prints on it). A typing game wants the letter itself, which is `event.key`. Two details matter:

- **Lower-case it.** With Caps Lock or Shift on, `event.key` is `A`, and a word list in lower case will never match it.
- **Skip held keys.** A key held down repeats; `event.repeat` is true on the repeats, and the game ignores them so a held letter counts once.

## Words on lanterns

three.js is a JavaScript library that draws 3D in a web page. Here each lantern's label is drawn on a small 2D canvas (an off-screen drawing surface in the page) and used as the picture on a flat panel above the lantern, which keeps a label to two triangles and makes a changed word one redraw. The game draws the typed letters in gold and the rest in white, and redraws the label after each letter. [Text in three.js](/guides/text-in-threejs) compares this with 3D letters (TextGeometry) and the other ways to put words in a scene, and [three.js HTML labels](/guides/threejs-html-labels-css2drenderer) covers labels made of HTML.

## A small game: lantern words

The whole game is one HTML file. Save it as `index.html` in a new folder, run `npm install three` in that folder (it puts three.js in a `node_modules` folder, where the import map line near the top looks for it), then `npx vite`, and open the address it prints. [How to make a 3D browser game](/guides/how-to-make-a-3d-browser-game) goes through those steps.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Lantern words</title>
<style>html,body{margin:0;overflow:hidden;background:#16224a}canvas{display:block}
#hud{position:fixed;top:12px;left:0;right:0;text-align:center;font:600 20px system-ui;color:#ffe9b0;pointer-events:none}</style></head>
<body>
<div id="hud"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rules: paper lanterns rise from the river, each carrying a word. Type a word to pop its lantern.
// A lantern that reaches the top costs one of 3 lives. Every 10 words, the lanterns rise faster.
const WORDS = ['sun', 'moon', 'star', 'sea', 'boat', 'fish', 'kite', 'lamp', 'tree', 'frog', 'cake', 'rain',
  'snow', 'bird', 'leaf', 'wave', 'owl', 'cat', 'dog', 'bee', 'nest', 'shell', 'cloud', 'river', 'light', 'paper'];
const RIVER = -4, TOP = 5, BASE_SPEED = 0.8, SPAWN_EVERY = 2.2;
let lanterns, target, typed, popped, missed, lives, speed, clock, over;

function start() {
  for (const l of lanterns ?? []) scene.remove(l.mesh);
  lanterns = []; target = null; typed = ''; popped = 0; missed = 0; lives = 3; speed = BASE_SPEED; clock = SPAWN_EVERY; over = false;
}
function launch(word, x, y = RIVER) {
  const l = { word, x, y, mesh: lanternMesh(word) };
  lanterns.push(l);
  draw(l);
  return l;
}
function type(letter) {
  if (over) return;
  if (!target) {   // a new word: of the lanterns whose word starts with this letter, take the highest, the next to escape
    target = lanterns.filter(l => l.word[0] === letter).sort((a, b) => b.y - a.y)[0] ?? null;
    if (!target) { missed++; return; }
    typed = letter;
  } else if (target.word[typed.length] === letter) typed += letter;
  else { missed++; return; }   // a wrong letter is a miss; the word stays chosen
  draw(target);
  if (typed === target.word) {   // the whole word: the lantern pops
    remove(target);
    popped++;
    speed = BASE_SPEED * 1.15 ** Math.floor(popped / 10);
    target = null; typed = '';
  }
}
function remove(l) {
  scene.remove(l.mesh);
  lanterns.splice(lanterns.indexOf(l), 1);
  if (l === target) { target = null; typed = ''; }
}
function step(dt) {
  if (over) return;
  clock -= dt;
  if (clock <= 0) { clock = SPAWN_EVERY; launch(WORDS[Math.floor(Math.random() * WORDS.length)], Math.random() * 12 - 6); }
  for (const l of lanterns) l.y += speed * dt;
  for (const l of lanterns.filter(l => l.y > TOP)) { remove(l); lives--; }   // it escaped: gone, and one life less
  over = lives <= 0;
}

// The picture: a night sky over a dark river, and each lantern a glowing paper box with its word on a label.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x16224a);
scene.fog = new THREE.Fog(0x16224a, 20, 60);   // the far river fades into the night
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0.5, 12);
camera.lookAt(0, 0.5, 0);
scene.add(new THREE.HemisphereLight(0x6677aa, 0x101830, 1.5));
const river = new THREE.Mesh(new THREE.PlaneGeometry(120, 80), new THREE.MeshStandardMaterial({ color: 0x24508a, emissive: 0x0f2648 }));
river.rotation.x = -Math.PI / 2; river.position.set(0, RIVER - 0.6, -30); river.name = 'river'; scene.add(river);
const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(
  Array.from({ length: 300 }, (_, i) => i % 3 === 2 ? -20 : (Math.random() - 0.5) * (i % 3 ? 30 : 60)), 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 0.08 }));
stars.position.y = 6; stars.name = 'stars'; scene.add(stars);
const paper = new THREE.MeshStandardMaterial({ color: 0xffa040, emissive: 0xff7a1a, emissiveIntensity: 1.2 });
const box = new THREE.BoxGeometry(0.8, 1, 0.8), tag = new THREE.PlaneGeometry(2.4, 0.6);
function lanternMesh(word) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(box, paper);
  body.name = 'lantern';
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(tag, new THREE.MeshBasicMaterial({ map, transparent: true }));
  label.name = `word ${word}`; label.position.set(0, 0.9, 0.45);   // above the lantern, readable as soon as it leaves the water
  group.add(body, label);
  scene.add(group);
  return group;
}
function draw(l) {   // the word on its label: the letters typed so far in gold, the rest in white
  const label = l.mesh.children[1], g = label.material.map.image.getContext('2d');
  const done = l === target ? typed : '';
  g.clearRect(0, 0, 256, 64);
  g.fillStyle = 'rgba(10, 20, 48, 0.75)'; g.fillRect(0, 0, 256, 64);
  g.font = 'bold 40px system-ui'; g.textBaseline = 'middle';
  const width = g.measureText(l.word).width, left = 128 - width / 2;
  g.fillStyle = '#ffd34d'; g.fillText(done, left, 34);
  g.fillStyle = '#ffffff'; g.fillText(l.word.slice(done.length), left + g.measureText(done).width, 34);
  label.material.map.needsUpdate = true;
}
const hud = document.getElementById('hud');

function act({ key, down = true }) {
  if (!down) return;
  if (key === 'Enter' && over) return start();
  const letter = key.length === 1 ? key.toLowerCase() : /^Key[A-Z]$/.test(key) ? key[3].toLowerCase() : null;
  if (letter && /[a-z]/.test(letter)) type(letter);
}
// A typing game reads event.key, the letter typed, so a French or German keyboard types its own letters.
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.key }); });
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

start();
let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  for (const l of lanterns) { l.mesh.position.set(l.x, l.y, 0); l.mesh.rotation.y = Math.sin(l.y) * 0.2; }
  hud.textContent = over ? `The lanterns got away. ${popped} words! Enter to play again`
    : `Words ${popped} · Lives ${'♥'.repeat(lives)} · Missed keys ${missed}`;
  renderer.render(scene, camera);
});

const r2 = v => Math.round(v * 100) / 100;
window.__game = {
  describe: () => ({ name: 'lantern words', keys: { KeyA: 'type the letter a (any letter a to z types)', Enter: 'play again after the game ends' } }),
  observe: () => ({ lanterns: lanterns.map(l => ({ word: l.word, x: r2(l.x), y: r2(l.y) })), target: target?.word ?? null, typed,
    popped, missed, lives, speed: r2(speed), over }),
  act,
  setState: s => {
    if (s.lanterns) { for (const l of [...lanterns]) remove(l); s.lanterns.forEach(l => launch(l.word, l.x, l.y)); }
    if (s.lives !== undefined) lives = s.lives;
    if (s.popped !== undefined) { popped = s.popped; speed = BASE_SPEED * 1.15 ** Math.floor(popped / 10); }
  },
};
</script>
</body></html>
```

`type` holds rules 2 and 3, `step` moves the lanterns, launches a new one every 2.2 seconds and takes away a life for each one that escapes, and `draw` paints a label. The `window.__game` object at the end lets a testing tool read and set the game; players never see it.

## A long word list in a file

The list in the code is enough to try the game. A longer one is easier to keep in a file next to `index.html`, one word per line, for example `words.txt`, which the game loads when it starts:

```js
const text = await (await fetch('words.txt')).text();
const WORDS = text.split('\n').map(w => w.trim().toLowerCase()).filter(w => /^[a-z]+$/.test(w));
```

`trim` removes the spaces and line endings a text editor leaves, which otherwise end up inside a word that can then never be typed. Where a list comes from:

- **Your own, or a child's.** This week's spelling words from school, the names in the family, the animals they like.
- **The AI agent.** Ask for one: "Write words.txt: 200 animal and nature words of 3 to 6 letters, one per line, all lower case." Read it before a child plays.
- **Open word lists,** such as the dictionaries spell checkers use. They hold many thousands of words, including rare and rude ones, so filter them by length and read what is left before giving them to children.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes the files in your project) can build the game from a request that spells out the choices above:

```text
Make a typing game in one HTML file with three.js: paper lanterns rise from a river
at night, each with a word on a label above it. Typing a word pops its lantern. The
first letter of a new word picks the highest lantern whose word starts with that
letter; after that, letters must match that word, and a wrong letter counts as a
miss but keeps the word. Read event.key in lower case and skip repeated keys. A
lantern that reaches the top is removed and costs one of 3 lives. Every 10 words the
lanterns rise 15% faster. Show words, lives and misses; Enter starts again at the end.
```

## Let the agent type the words

An agent can write the matching rules and still not know whether a word pops, because it cannot press keys in the game it wrote. paprika3d gives it a way: it is a plugin for Claude Code and an MCP server, the standard way to give other coding agents tools. Its tools run the game in a Chrome with no window, list what is on screen, press keys on exact frames, and read and set the game's state through `window.__game`. The replies below are from paprika3d on this page's game, captured on 2026-11-02 on a machine with no graphics card, cut to the lines discussed, with nothing reworded.

`interact` plays steps on the page. A `{ state }` step sets the game up first, here three lanterns at known heights, and `look` then lists what is on screen:

```text
interact {"steps":[{"state":{"lanterns":[{"word":"sun","x":-3,"y":0},{"word":"star","x":2,"y":2},{"word":"moon","x":0,"y":-2}]}},{"wait":1}]}

{"changed":{"lanterns":[{"word":"sun","x":-3,"y":0.03},{"word":"star","x":2,"y":2.03},{"word":"moon","x":0,"y":-1.97}]}}

look {}

On screen (8):
river 41% [0, 460, 1279, 799] 120 × 80 units
word sun 0.98% [289, 339, 489, 388] 2.4 × 0.6 units, across the view
word moon 0.97% [536, 504, 732, 559] 2.4 × 0.6 units, across the view
word star 0.93% [717, 168, 906, 225] 2.4 × 0.6 units, across the view
lantern ×3 2% [357, 230, 843, 648]
stars 0.0033% [16, 39, 1273, 547]
Never visible: none
```

Each label is on screen, `star` the highest. Two lanterns start with s, so typing `star` tests rule 2: the s must go to `star`, the higher one, and `expect` checks what is left afterwards, with `save` keeping the play as a check:

```text
interact {"steps":[{"state":{"lanterns":[{"word":"sun","x":-3,"y":0},{"word":"star","x":2,"y":2},{"word":"moon","x":0,"y":-2}]}},{"key":"KeyS"},{"key":"KeyT"},{"key":"KeyA"},{"key":"KeyR"}],"expect":{"popped":1,"target":null,"lanterns.0.word":"sun","lanterns.1.word":"moon"},"save":"type-star-pops-the-highest-s"}

{"changed":{"lanterns":[{"word":"sun","x":-3,"y":0.07},{"word":"moon","x":0,"y":-1.93}],"popped":1}}
Expect: popped 1 ✓ · target null ✓ · lanterns.0.word "sun" ✓ · lanterns.1.word "moon" ✓
Saved check "type-star-pops-the-highest-s" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

`star` popped and `sun` and `moon` are still rising. Then rule 3, with an x that no word starts with, an s, and an o where `sun` needs a u:

```text
interact {"steps":[{"state":{"lanterns":[{"word":"sun","x":-3,"y":0}]}},{"key":"KeyX"},{"key":"KeyS"},{"key":"KeyO"}],"expect":{"missed":2,"target":"sun","typed":"s"},"save":"wrong-letters-are-misses"}

{"changed":{"lanterns":[{"word":"sun","x":-3,"y":0.05}],"target":"sun","typed":"s","missed":2}}
Expect: missed 2 ✓ · target "sun" ✓ · typed "s" ✓
```

Two misses, and `sun` is still chosen with its s typed. Rule 4 is where a first version went wrong. It counted a life lost for every lantern above the top, but never removed the lantern. With one lantern placed just under the top, `trace` follows the lives frame by frame:

```text
interact {"steps":[{"state":{"lanterns":[{"word":"owl","x":0,"y":4.9}]}},{"wait":30}],"trace":["lives"]}

{"changed":{"lanterns":[{"word":"owl","x":0,"y":5.03}],"lives":0,"over":true}}
lives: 3 → 0 at frame 9; first changed at frame 7
```

One lantern took all three lives in three frames, one each frame it stayed above the top, and the game ended. Played by hand it looks like a game that ends for no reason the first time a word gets away. The fix removes the lantern as it escapes:

```diff
-  for (const l of lanterns) { l.y += speed * dt; if (l.y > TOP) lives--; }   // it escaped: one life less
+  for (const l of lanterns) l.y += speed * dt;
+  for (const l of lanterns.filter(l => l.y > TOP)) { remove(l); lives--; }   // it escaped: gone, and one life less
```

The same play after it:

```text
interact {"steps":[{"state":{"lanterns":[{"word":"owl","x":0,"y":4.9}]}},{"wait":30}],"trace":["lives"],"expect":{"lives":2,"over":false},"save":"an-escaped-lantern-costs-one-life"}

{"changed":{"lives":2}}
lives: 3 → 2 at frame 7; first changed at frame 7
Expect: lives 2 ✓ · over false ✓
```

Last, rule 5: with nine words already popped, the tenth must speed the lanterns up from 0.8 to 0.92:

```text
interact {"steps":[{"state":{"popped":9,"lanterns":[{"word":"cat","x":0,"y":0}]}},{"key":"KeyC"},{"key":"KeyA"},{"key":"KeyT"}],"expect":{"popped":10,"speed":0.92},"save":"faster-after-ten-words"}

{"changed":{"popped":10,"speed":0.92}}
Expect: popped 10 ✓ · speed 0.92 ✓
```

`test` replays the four saved checks, each on a freshly loaded page, so a later change (a new word list, a second level) that breaks a rule shows at once:

```text
test {}

✓ type-star-pops-the-highest-s
✓ wrong-letters-are-misses
✓ an-escaped-lantern-costs-one-life
✓ faster-after-ten-words
4 of 4 saved checks passed in 1.0 s
```

paprika3d presses keys and checks what the game does; it does not choose the words, tell you whether the speed suits a child, or say whether the game is fun. Play it with the person it is for. To add it to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add Keeno-Corp/paprika3d
claude plugin install paprika3d@paprika3d
```

## When it goes wrong

- **No letter ever matches.** The game compares upper-case letters from `event.key` with a lower-case list, or reads `event.code` (`KeyA`) as if it were the letter. Lower-case `event.key`, as `act` does.
- **One word can never be typed.** It holds a space or a line ending from the word list. `trim` each word when the list is loaded.
- **A held key types the letter many times.** Skip the key events whose `event.repeat` is true.
- **The game ends the first time a word escapes.** The escaped lantern stays and costs a life every frame, the bug shown above. Remove it when it escapes.
- **The wrong lantern pops.** Two lanterns share a first letter, and the rule for choosing between them is missing or different from what you meant. Write the rule in the request, as in rule 2.
- **Too fast or too slow for a young child.** Lower `BASE_SPEED`, launch lanterns less often with a larger `SPAWN_EVERY`, and use shorter words.

## Next steps

- A sound on every pop and a softer one on a miss: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- A burst of sparks when a lantern pops: [how to make a game feel good](/guides/make-a-game-feel-good).
- Keeping the most words typed as a record: [how to save the high score](/guides/save-the-high-score).
- A proper end screen with the score: [how to add a game over screen](/guides/add-a-game-over-screen).
- Making it together with a child: [my kid wants to make a video game](/guides/my-kid-wants-to-make-a-video-game).
