---
title: How to make a game for a school project: a three.js maths game you can explain
phrase: how to make a game for a school project
description: How to make a game for a school project with an AI agent when you have never made one: ask your teacher what the rules on AI are, write the game's rules down before any code, build a small maths game, keep checks that prove each rule works and be ready to explain every part. Shown on a three.js times-table cannon, with paprika3d's interact, expect and test as the checks you can show.
meta: How to make a game for a school project with AI: ask the teacher, write the rules first, and check them, on a three.js maths game.
intent: make-a-game-for-a-school-project
queries:
  - "how to make a game for a school project"
  - "how to make a game for school project"
  - "how to make an educational game"
  - "how to make a math game"
author: paprika3d agent
date: 2026-10-31
review: weekly
---
# How to make a game for a school project: a three.js maths game you can explain

A game for a school project is graded on two things: whether it works, and whether you can explain how. An AI coding agent (an assistant such as Claude Code that writes and edits the files in a project folder) can do a lot of the typing, but it cannot stand in front of the class for you. So the plan on this page puts the explaining first: find out what your teacher allows, write the game's rules in plain sentences before any code exists, build a small game that follows them, and keep checks that prove each rule works. The example is a times-table game, and the same steps fit a game about any subject, for a student or for a teacher making one for a class.

## Step 1: ask your teacher about AI

Schools and teachers set different rules, and a rule you did not know about can cost more marks than any bug. Ask before you start:

- May I use an AI agent to write the code? The art? The text?
- Do I need to say which parts the AI wrote, and how?
- Should I hand in the requests I typed, or a log of how the project went?
- Will I be asked to explain or change the code in class?

Whatever the answers, keep a simple log as you go: each request you gave the agent, in your own words, and what changed. It takes a minute a day, it is honest, and it is the outline of your presentation.

## Step 2: write the rules down first

Before you ask for any code, write what the game does in sentences a classmate could follow. These are the rules of the game on this page:

1. A multiplication question appears at the top, such as 7 × 8.
2. Three buoys float across the sea from left to right, each with a sign showing an answer. One is right; the other two are near misses.
3. The left and right arrow keys aim the cannon at a buoy, and the space bar fires.
4. Hitting the right answer scores a point. Hitting a wrong one, or letting the buoys float away, puts the question on a practise list.
5. After ten questions the game shows the score and the practise list. Space plays again.

This list does three jobs. It is your first request to the agent, it is what you will check the game against, and it is the first slide of your presentation. Keep it small: one idea from your subject, one way to play it, and an ending that shows what was learned.

## Step 3: the game

three.js is a JavaScript library that draws 3D graphics in a web page. The whole game is one file, `index.html`, that runs in any web browser:

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Times-table cannon</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}
#hud{position:fixed;top:14px;left:0;right:0;text-align:center;font:700 34px system-ui;color:#fff;text-shadow:0 2px 4px #0006}
#score{position:fixed;bottom:16px;left:18px;font:600 18px system-ui;color:#fff}
#end{position:fixed;left:20%;right:20%;top:25%;padding:24px;border-radius:12px;background:#fff;font:20px system-ui;text-align:center;display:none}</style></head>
<body>
<div id="hud"></div><div id="score"></div><div id="end"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

// The rules, written down before any code: which tables, how many questions, how long a question lasts.
const TABLES = [6, 7, 8, 9];
const QUESTIONS = 10;
const DRIFT = 1.2;   // metres a second the buoys float to the right; off the edge counts as missed

let a = 0, b = 0, answers = [], aim = 1, score = 0, asked = 0, missed = [], over = false;
let drift = -8, flight = -1;   // flight: -1 while no cannonball is in the air, else 0 to 1

function newQuestion() {
  if (asked === QUESTIONS) { over = true; return; }
  asked++;
  a = TABLES[Math.floor(Math.random() * TABLES.length)];
  b = 2 + Math.floor(Math.random() * 8);
  answers = [...new Set([a * (b + 1), a * (b - 1), (a + 1) * b, a * b + 10])].filter(n => n !== a * b).slice(0, 2);   // near misses
  answers.splice(Math.floor(Math.random() * 3), 0, a * b);   // the right answer at a random place
  drift = -8;
}

function act({ key, down = true }) {
  if (!down) return;
  if (over) { if (key === 'Space') { score = 0; asked = 0; missed = []; over = false; newQuestion(); } return; }
  if (key === 'ArrowLeft') aim = Math.max(0, aim - 1);
  if (key === 'ArrowRight') aim = Math.min(2, aim + 1);
  if (key === 'Space' && flight < 0) flight = 0;
}
addEventListener('keydown', e => { if (!e.repeat) act({ key: e.code }); });

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fd3ff);
scene.fog = new THREE.Fog(0x8fd3ff, 20, 90);   // the sea fades into the sky at the horizon
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 5, 12);
camera.lookAt(0, 1, -2);
scene.add(new THREE.HemisphereLight(0xffffff, 0x2a6f97, 2.5));
const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2a7fb8 }));
sea.name = 'sea';
const cannon = new THREE.Group();
cannon.name = 'cannon';
const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 16).rotateX(Math.PI / 2).translate(0, 0, -1), new THREE.MeshStandardMaterial({ color: 0x333333 }));
barrel.position.y = 0.9;
cannon.add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.4), new THREE.MeshStandardMaterial({ color: 0x8b5a2b })).translateY(0.35), barrel);
cannon.position.set(0, 0, 4);
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), new THREE.MeshStandardMaterial({ color: 0x111111 }));
ball.name = 'ball';
scene.add(sea, cannon, ball);

// Three buoys, each with a sign; the marker shows which one the cannon aims at.
const buoys = [0, 1, 2].map(() => {
  const canvas = Object.assign(document.createElement('canvas'), { width: 128, height: 96 });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }));
  sign.position.y = 2.2;
  sign.material.map.colorSpace = THREE.SRGBColorSpace;
  const buoy = new THREE.Group();
  buoy.name = 'buoy';
  buoy.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.2, 16), new THREE.MeshStandardMaterial({ color: 0xe63946 })).translateY(0.4), sign);
  buoy.userData = { canvas, sign };
  scene.add(buoy);
  return buoy;
});
const marker = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 12).rotateX(Math.PI), new THREE.MeshBasicMaterial({ color: 0xffd60a }));
marker.name = 'marker';
scene.add(marker);
const hud = document.getElementById('hud'), scoreEl = document.getElementById('score'), endEl = document.getElementById('end');
let shown = '';

function step(dt) {
  if (over) return;
  drift += DRIFT * dt;
  buoys.forEach((buoy, i) => buoy.position.set(drift + (i - 1) * 3.2, Math.sin(drift * 2 + i) * 0.1, -4));
  const target = buoys[aim].position;
  cannon.rotation.y = Math.atan2(cannon.position.x - target.x, cannon.position.z - target.z);
  if (flight >= 0) {
    flight = Math.min(1, flight + dt / 0.8);
    ball.position.lerpVectors(cannon.position, target, flight).setY(1 + Math.sin(flight * Math.PI) * 3);
    if (flight === 1) {
      if (answers[aim] === a * b) score++; else missed.push(`${a} × ${b} = ${a * b}`);
      flight = -1;
      newQuestion();
    }
  } else if (drift > 8) {
    missed.push(`${a} × ${b} = ${a * b}`);
    newQuestion();
  }
}

function draw() {
  ball.visible = flight >= 0;
  marker.position.set(buoys[aim].position.x, 3.4, -4);
  const now = answers.join();
  if (now !== shown) {   // new answers: repaint the three signs
    shown = now;
    buoys.forEach((buoy, i) => {
      const g = buoy.userData.canvas.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 96);
      g.fillStyle = '#1d3557'; g.font = 'bold 56px system-ui'; g.textAlign = 'center'; g.fillText(answers[i], 64, 68);
      buoy.userData.sign.material.map.needsUpdate = true;
    });
  }
  hud.textContent = over ? '' : `${a} × ${b} = ?`;
  scoreEl.textContent = `Score ${score} · Question ${asked} of ${QUESTIONS}`;
  endEl.style.display = over ? 'block' : 'none';
  endEl.innerHTML = `You scored ${score} of ${QUESTIONS}.<br>${missed.length ? 'To practise: ' + missed.join(', ') : 'Every answer right!'}<br><br>Press Space to play again.`;
}

newQuestion();
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
let last = null;
renderer.setAnimationLoop(now => {
  step(last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1));
  last = now;
  draw();
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'times-table cannon', units: 'metres', keys: { ArrowLeft: 'aim one buoy left', ArrowRight: 'aim one buoy right', Space: 'fire (or play again at the end)' } }),
  observe: () => ({ a, b, answers, aim, score, asked, missed, over, flying: flight >= 0 }),
  act,
  setState: s => {
    a = s.a ?? a; b = s.b ?? b; answers = s.answers ?? answers; aim = s.aim ?? aim;
    score = s.score ?? score; asked = s.asked ?? asked; missed = s.missed ?? missed; over = s.over ?? over;
  },
  subject: 'cannon',
};
</script>
</body></html>
```

To run it on your own computer, save it in a folder and serve that folder with a local web server (a small program that shows a folder as a website on your computer); a page opened by double-clicking cannot load three.js. [HTML game not working](/guides/html-game-not-working) explains why and gives the command.

## Step 4: what to ask your AI agent

Paste your rules from step 2 into the request, and ask for the checks in the same breath:

```text
Make a times-table game in three.js, in one index.html file, for a school project.
The rules:
1. A multiplication question appears at the top, such as 7 × 8.
2. Three buoys float across the sea from left to right, each with an answer on a sign.
   One is right; the other two are near misses.
3. The left and right arrow keys aim the cannon at a buoy, and space fires.
4. The right answer scores a point. A wrong answer, or buoys that float away, go on a practise list.
5. After ten questions, show the score and the practise list. Space plays again.
Put the tables and the number of questions as settings at the top of the file.
Then play it and check rules 4 and 5 work. Explain each part of the code in a sentence
I could say to my class.
```

The last line is for you. Read each explanation, then find the matching lines in the file. If a part makes no sense, ask again: "explain `newQuestion` as if to a classmate who has never coded".

## Step 5: checks you can show

A check is a rule written so that a computer can test it: set up a moment, press the keys, and compare the result with what the rule says. Two checks cover rule 4 here: aiming at the right answer and firing scores a point, and aiming at a wrong one does not. They are the strongest answer to the question every teacher asks about a project made with AI: how do you know it works?

paprika3d is a plugin for Claude Code, and an MCP server (the standard way to give tools to other coding agents), that opens a game in a hidden Chrome browser so the agent can see and play it. Its `interact` tool plays keys frame by frame. The first step below sets the question to 7 × 8 with the answers 56, 54 and 48 (so the check is the same every time), then the left arrow aims at 56 and space fires; `expect` says what the rule promises, and `save` keeps the check:

```text
interact {"steps": [{"state": {"a": 7, "b": 8, "answers": [56, 54, 48], "aim": 1}}, {"key": "ArrowLeft"}, {"key": "Space"}, {"until": {"flying": false}, "max": 120}], "expect": {"score": 1, "asked": 2}, "save": "right-answer-scores"}

{"changed":{"a":7,"answers":[63,49,56],"aim":0,"score":1,"asked":2}}
until: flying == false held at frame 50
Expect: score 1 ✓ · asked 2 ✓
Saved check "right-answer-scores" in game-tests.json (1 check now); `test` reruns them all, each from a fresh reload, and the after-edit hook reruns them after each edit, speaking only when one starts or stops failing.
```

The same setup with the right arrow aims at 48, a wrong answer:

```text
interact {"steps": [{"state": {"a": 7, "b": 8, "answers": [56, 54, 48], "aim": 1}}, {"key": "ArrowRight"}, {"key": "Space"}, {"until": {"flying": false}, "max": 120}], "expect": {"score": 0, "missed.0": "7 × 8 = 56"}, "save": "wrong-answer-is-missed"}

{"changed":{"a":7,"answers":[63,49,56],"aim":2,"asked":2,"missed":["7 × 8 = 56"]}}
until: flying == false held at frame 50
Expect: score 0 ✓ · missed.0 "7 × 8 = 56" ✓
Saved check "wrong-answer-is-missed" in game-tests.json (2 checks now); `test` reruns them all, each from a fresh reload.
```

The checks live in a file, `game-tests.json`, in the project folder, and `test` reruns them all:

```text
test {}

✓ right-answer-scores
✓ wrong-answer-is-missed
2 of 2 saved checks passed in 0.7 s
```

Now the useful part. Say you later ask for a bonus: two points for a right answer in the first three seconds. That changes rule 4, and `test` points straight at it:

```text
test {}

✗ right-answer-scores: score 2, expected 1
✓ wrong-answer-is-missed
1 of 2 saved checks passed in 0.7 s
```

Nothing is broken here; the rule changed on purpose, so you update the rule in your list and the check with it. When a change you did not mean shows up as a ✗, that is a bug caught before your teacher plays the game. These lines make a good slide: the rules, the checks, and what happened when a rule changed.

The first `look` (a screenshot with a list of what is on screen) at this game also caught three faults before any check ran: the question and the score overlapped at the top, the sea ended before the horizon, and the cannon was cut off at the bottom of the screen. The game above has all three fixed.

These replies were captured on 2026-10-31 on a machine with no graphics card, where Chrome draws in software. paprika3d tests that the game follows its rules; whether it teaches well is for you and your teacher to judge, and it writes no presentation. To add it to Claude Code (it needs Google Chrome and Node.js):

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

Without paprika3d, write the checks as a table (what you do, what should happen, what did happen) and fill it in by playing; ask a classmate to play while you watch, without helping.

## Step 6: be ready to explain it

Five parts of the file cover almost every question you will get:

- **The settings** (`TABLES`, `QUESTIONS`, `DRIFT`): what a teacher would change to use the game for another class.
- **`newQuestion()`**: picks the question, makes two wrong answers from common mistakes (for 7 × 8, a row too many, 7 × 9, and a row too few, 7 × 7), then puts the right answer in a random place.
- **`act()`**: what each key does.
- **`step()`**: the game loop, which runs about sixty times a second, moves the buoys and the cannonball and decides right, wrong or too slow.
- **`window.__game`**: a small description of the game that testing tools read; it is what the checks above use.

If you used AI, say so in the way your teacher asked, and show your log. Being able to say why the wrong answers are near misses, and to change a setting live, shows more understanding than any amount of code.

## For teachers

The same game works as a class activity: change `TABLES` to the tables your class is on, or change `newQuestion()` to ask something else with three answers (fractions, capitals, spelling). Keep the two checks, and rerun `test` after each change. Put the game online for the class with [how to put your game online](/guides/put-your-game-online). A child making a game at home with a parent is covered in [my kid wants to make a video game](/guides/my-kid-wants-to-make-a-video-game).

## What to do next

- Add sound for a hit and a miss: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Add a high score that survives a reload: [save the high score](/guides/save-the-high-score).
- Learn the habit of a check after every change: [vibe coding bugs](/guides/vibe-coding-bugs).
- A small game made as a personal gift: [how to make a game for my girlfriend](/guides/make-a-game-for-my-girlfriend).
