---
title: How to make a rhythm game in three.js: notes on lanes in time with a beat
phrase: how to make a rhythm game
description: How to make a rhythm game as a beginner: a beat at a set tempo, a chart that says when each note comes and in which lane, notes drawn from the song's time so they never drift off the beat, and every key press judged early, good or late, on a small three.js game with three lanes, plus which clock to trust once the music is a file and why speakers need a calibration step.
meta: How to make a rhythm game in three.js: a chart of notes on three lanes, notes placed by the song's time, and key presses judged early, good or late.
intent: make-a-rhythm-game
queries:
  - "how to make a rhythm game"
  - "how to make a rhythm game in javascript"
  - "three js rhythm game"
  - "Music Rhythm Game Difficulty Question"
author: paprika3d agent
date: 2026-11-01
review: weekly
---
# How to make a rhythm game in three.js: notes on lanes in time with a beat

A rhythm game, in the style of Guitar Hero or Friday Night Funkin', is a song, a list of moments in that song, and a key press compared to each moment. Notes slide down lanes towards a line, and the player presses the lane's key as each note reaches it. Under the colours, every rhythm game is the same four parts, and once you know them you can build one in a single web page.

## The four parts

1. **The beat.** A song has a tempo, counted in beats per minute. At 120 beats a minute a beat comes every half second, so beat 4 is two seconds into the song.
2. **The chart.** A list of notes, each a beat and a lane: `[4, 0]` is a note on beat 4 in the left lane. Charts are written by hand while listening to the song, the way a person taps along; half beats (`8.5`) give faster runs. Harder difficulties are usually the same song with a denser chart, not a faster one.
3. **Notes placed by the song's time.** Each frame (one of the pictures the game draws many times a second), every note's place is worked out from scratch: how far is its time from the song's time, times a speed. A note two seconds away is sixteen metres up the lane at 8 metres a second, and it sits on the line at the exact moment its beat comes. A note moved a little each frame instead drifts off the beat after a slow frame, and the player feels it at once.
4. **Judging each press.** When a key goes down, find the nearest note in that lane and take the difference between the press and the note's time. Here, within 0.05 s is good, within 0.15 s is early or late, and a note no one pressed by then is a miss.

## Which clock keeps the time

Every part above reads one number, the song's time, so it must come from a clock that keeps pace with what the player hears.

- **A beat the game makes itself**, as in the game below, can count song time from the time stamp the browser gives each frame. The game adds each frame's whole step to the song time, never a capped one, because the music does not wait for a slow frame. Each click of the beat is put on Web Audio's clock (the browser's built-in sound system, which can start a sound at an exact moment) a little ahead of time, so it sounds on the beat even when a frame comes late.
- **A song from a music file** plays on the sound card's own clock, so read the song time from it: `audio.currentTime - songStart`, where `songStart` is the audio time you started the song at. Ask your agent for exactly that when you add music.
- **Speakers add a delay.** Bluetooth headphones and some TVs play sound noticeably late, so every press reads late by the same amount. A calibration step fixes it: the player taps along to eight clicks, the game averages how late the taps were, and stores that as `OFFSET`, which the judging subtracts.

## A small game: beat lanes

Three lanes, the keys D, F and J, and sixteen notes on a beat the game clicks itself. Press Space to start. three.js, a JavaScript library for drawing 3D in a web page, draws the lanes and notes; the whole game is one HTML file. Its import map line tells the browser where three.js is (a `node_modules/three` folder next to the file, which `npm install three` makes), and [how to make a 3d browser game](/guides/how-to-make-a-3d-browser-game) explains each part of such a page.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Beat lanes</title>
<style>html,body{margin:0;overflow:hidden;background:#140f2b}canvas{display:block}
#hud{position:fixed;top:14px;left:0;right:0;text-align:center;font:600 22px system-ui;color:#fff}
#judge{position:fixed;top:40%;left:0;right:0;text-align:center;font:700 40px system-ui;color:#ffd75e}</style></head>
<body>
<div id="hud">Press Space to start, then D, F and J on the beat</div>
<div id="judge"></div>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const BEAT = 0.5;                    // seconds per beat: 120 beats a minute
const KEYS = ['KeyD', 'KeyF', 'KeyJ'];  // one key per lane
// The chart: every note is [beat, lane]. The song is a click on every beat, which the game plays itself.
const CHART = [[4, 0], [5, 1], [6, 2], [7, 1], [8, 0], [8.5, 1], [9, 2], [10, 0], [10.5, 0], [11, 2],
  [12, 1], [13, 0], [13.5, 1], [14, 2], [15, 1], [16, 1]];
const END_BEAT = 18;
const GOOD = 0.05, WINDOW = 0.15;    // seconds from the note: good within 0.05, early or late within 0.15, else a miss
const OFFSET = 0;                    // seconds the player's speakers lag; a calibration step measures it
const SPEED = 8;                     // metres a note travels per second

let audio = null;
function tone(when, hz, length) {    // a short beep that starts at `when` on the audio clock
  const osc = audio.createOscillator(), gain = audio.createGain();
  osc.frequency.value = hz;
  gain.gain.setValueAtTime(0.2, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + length);
  osc.connect(gain).connect(audio.destination);
  osc.start(when);
  osc.stop(when + length);
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x140f2b);
scene.fog = new THREE.Fog(0x140f2b, 10, 24);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3.5, 5);
camera.lookAt(0, 0, -5);
scene.add(new THREE.HemisphereLight(0xffffff, 0x302050, 2.5));
const COLOURS = [0xff5a7a, 0x5ad1ff, 0xffd75e];
const pads = KEYS.map((key, lane) => {
  const strip = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 24), new THREE.MeshStandardMaterial({ color: 0x3a3070 }));
  strip.name = `lane ${lane + 1}`;
  strip.position.set((lane - 1) * 1.5, -0.05, -10);
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 32), new THREE.MeshStandardMaterial({ color: COLOURS[lane], emissive: COLOURS[lane], emissiveIntensity: 0.1 }));
  pad.name = `pad ${key.slice(3)}`;
  pad.position.set((lane - 1) * 1.5, 0.05, 0);
  scene.add(strip, pad);
  return pad;
});
const notes = CHART.map(([beat, lane]) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.25, 32), new THREE.MeshStandardMaterial({ color: COLOURS[lane] }));
  mesh.name = 'note';
  scene.add(mesh);
  return { time: beat * BEAT, lane, mesh, judged: false };
});
const hud = document.getElementById('hud'), judgeText = document.getElementById('judge');

let started = false, songTime = 0, nextBeat = 0, presses = [];
let score = 0, combo = 0, last = '', counts = { good: 0, early: 0, late: 0, miss: 0 };
function start() {
  started = true; songTime = 0; nextBeat = 0; score = 0; combo = 0; last = '';
  counts = { good: 0, early: 0, late: 0, miss: 0 };
  judgeText.textContent = '';
  for (const n of notes) n.judged = false;
}
function judge(name) {
  last = name;
  counts[name]++;
  if (name === 'miss') combo = 0; else { combo++; score += name === 'good' ? 100 : 50; }
  judgeText.textContent = name === 'good' ? 'Good!' : name[0].toUpperCase() + name.slice(1);
}

function act({ key, down = true }) {
  if (!down) return;
  if (key === 'Space' && (!started || songTime > END_BEAT * BEAT)) start();
  else if (KEYS.includes(key) && started) presses.push(KEYS.indexOf(key));
}
addEventListener('keydown', e => {
  if (e.repeat) return;
  audio ??= new AudioContext();      // browsers allow sound after the first key press
  audio.resume();
  act({ key: e.code });
});

function update(dt) {
  if (!started) return;
  songTime += dt;
  const t = songTime - OFFSET;
  // the beat: each click is put on the audio clock a little ahead, so it sounds on time even when a frame is late
  while (nextBeat <= END_BEAT && nextBeat * BEAT < songTime + 0.1) {
    if (audio) tone(audio.currentTime + Math.max(0, nextBeat * BEAT - songTime), nextBeat % 4 === 0 ? 880 : 660, 0.05);
    nextBeat++;
  }
  for (const lane of presses) {
    pads[lane].material.emissiveIntensity = 1;
    const note = notes.find(n => !n.judged && n.lane === lane && Math.abs(t - n.time) <= WINDOW);
    if (!note) continue;             // a press with no note near it is ignored
    note.judged = true;
    const off = t - note.time;
    judge(Math.abs(off) <= GOOD ? 'good' : off < 0 ? 'early' : 'late');
    if (audio) tone(audio.currentTime, 1320, 0.08);
  }
  presses = [];
  for (const n of notes) if (!n.judged && t - n.time > WINDOW) { n.judged = true; judge('miss'); }
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
let lastFrame = null;
renderer.setAnimationLoop((now) => {
  update(lastFrame === null ? 1 / 60 : (now - lastFrame) / 1000);  // not capped: the music does not wait for a slow frame
  lastFrame = now;
  for (const n of notes) {
    n.mesh.position.set((n.lane - 1) * 1.5, 0.15, -(n.time - songTime) * SPEED);  // a note's place comes from the song time alone
    n.mesh.visible = started && !n.judged && n.mesh.position.z > -24;
  }
  for (const p of pads) p.material.emissiveIntensity = Math.max(0.1, p.material.emissiveIntensity - 0.08);
  hud.textContent = !started ? 'Press Space to start, then D, F and J on the beat'
    : songTime > END_BEAT * BEAT ? `Score ${score}: ${counts.good} good, ${counts.early} early, ${counts.late} late, ${counts.miss} missed. Space to play again`
    : `Score ${score}   Combo ${combo}`;
  renderer.render(scene, camera);
});

window.__game = {
  describe: () => ({ name: 'beat lanes', units: 'metres', keys: { Space: 'start', KeyD: 'left lane', KeyF: 'middle lane', KeyJ: 'right lane' } }),
  observe: () => ({ started, songTime: +songTime.toFixed(3), score, combo, last, ...counts }),
  act,
  setState: (s) => { if (s.started) start(); if (s.songTime !== undefined) { songTime = s.songTime; nextBeat = Math.ceil(songTime / BEAT); } },
};
</script>
</body></html>
```

The chart is `CHART` at the top: change it and the notes change. `update` moves the song time, puts the next clicks on the audio clock, judges the presses and counts the misses; the frame loop then places each note from `songTime` alone. Sound starts on the first key press, because browsers keep a page silent until the player presses or clicks something ([three.js audio not playing](/guides/threejs-audio-not-playing) has the details). A press is judged on the frame after it, so it can read up to 16.7 ms late; for tighter judging, take the time from the key event's own `timeStamp`.

## What to ask your AI agent

An AI coding agent (an assistant such as Claude Code that writes the files in your project) can build this from a description. Name the four parts and the clock:

```text
Make a rhythm game in one HTML file with three.js: three lanes on the keys D, F and J,
a beat at 120 beats per minute made with Web Audio, and a chart of notes as [beat, lane].
Place every note each frame from the song's time, never by moving it a bit each frame.
Judge each press: within 0.05 s of its note is good, within 0.15 s early or late,
otherwise a miss, and show the score and combo. Start the sound on the first key press.
Add an OFFSET for speaker delay and a calibration screen where I tap along to measure it.
```

When you swap the clicks for a song file, add one line: "read the song time from the AudioContext clock, minus the time the song started".

## Let the agent play the chart

An agent can write a chart but cannot tap along to it. paprika3d, a plugin for Claude Code and an MCP server (the standard way to give tools to other coding agents), runs the game in a hidden Chrome on a clock that steps one frame, 1/60 s, at a time, so the agent can press keys on the exact frames the chart says. A beat is half a second, so the first note, on beat 4, is due 120 frames after the start. `interact` with `look: true` holds the game there and lists what is on screen:

```text
interact {"steps":[{"key":"Space"},{"wait":119}],"look":true}

{"changed":{"started":true,"songTime":2}}
Sound: 5 started during these steps.
Picture: <project>/paprika3d/runs/2026-11-01T00-27-08-255Z/look-1.png
Pixels: brightness 11%, colour saturation 66%, 0% near black, 0% blown out. Dark: a viewer sees little.
Hues: grey 77%, blue 18% of the frame; over the objects (24.8% of it): blue 74%, cyan 7%, grey 6%, red 6%.
Depth: the nearest third of objects brightness 53%, colour 58%; the farthest third 12%, colour 74%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
HTML over the canvas: 1 (div via page), 0 overlap, 0 off-screen, 0 cut off: div#hud "Score 0 Combo 0" [0, 14, 1279, 38].
On screen (13):
lane * ×3 20% [234, 219, 1045, 799] 24 × 1.3 units, along the view
pad J 1.4% [778, 586, 944, 693] 1.1 × 1.1 units
pad F 1.4% [559, 586, 720, 693] 1.1 × 1.1 units
note ×7 1.8% [348, 217, 765, 669]
pad D 0.48% [335, 597, 501, 693] 1.1 × 1.1 units
Never visible: none
```

Pad D shows a third of the area the other pads do, because the first note sits on it on its beat. The Sound line counts the five clicks of beats 0 to 4 (the hidden browser plays no sound; paprika3d counts the sounds the page starts). A press of D on that frame:

```text
interact {"steps":[{"key":"Space"},{"wait":118},{"key":"KeyD"}],"expect":{"last":"good"}}

{"changed":{"started":true,"songTime":2,"score":100,"combo":1,"last":"good","good":1}}
Sound: 6 started during these steps.
Expect: last "good" ✓
```

The sixth sound is the hit. The same press six frames earlier, 0.1 s before the note, is judged early, and the check says so:

```text
interact {"steps":[{"key":"Space"},{"wait":112},{"key":"KeyD"}],"expect":{"last":"good"}}

{"changed":{"started":true,"songTime":1.9,"score":50,"combo":1,"last":"early","early":1}}
Sound: 5 started during these steps.
Expect: last "early" ✗ expected "good"
```

Turning every note's beat into a frame (beat times 30) gives the whole chart as presses, which shows it can be played and that the judging agrees with the chart:

```text
interact {"steps":[{"key":"Space"},{"wait":118},{"key":"KeyD"},{"wait":29},{"key":"KeyF"},{"wait":29},{"key":"KeyJ"},{"wait":29},{"key":"KeyF"},{"wait":29},{"key":"KeyD"},{"wait":14},{"key":"KeyF"},{"wait":14},{"key":"KeyJ"},{"wait":29},{"key":"KeyD"},{"wait":14},{"key":"KeyD"},{"wait":14},{"key":"KeyJ"},{"wait":29},{"key":"KeyF"},{"wait":29},{"key":"KeyD"},{"wait":14},{"key":"KeyF"},{"wait":14},{"key":"KeyJ"},{"wait":29},{"key":"KeyF"},{"wait":29},{"key":"KeyF"},{"wait":60}],"expect":{"good":16,"miss":0,"score":1600}}

{"changed":{"started":true,"songTime":9,"score":1600,"combo":16,"last":"good","good":16}}
Sound: 35 started during these steps.
Expect: good 16 ✓ · miss 0 ✓ · score 1600 ✓
```

Sixteen good hits, and 35 sounds: the 19 clicks of beats 0 to 18 and the 16 hits. These replies were captured on 2026-11-01 on a machine with no graphics card, where Chrome draws in software.

This check is partial. paprika3d hears nothing, so it cannot tell you whether the beat sounds good or the chart fits the music, and it cannot measure a speaker's delay: the calibration step is how a player's own ears do that. Its stepped clock moves the page's frames and timers but not the Web Audio clock, so once your song time reads `audio.currentTime` (the music file version), presses no longer land on exact frames of the song; keep the chart checks on a frame-clock build like this one. `open` also puts a file named `fx.js` in the project whose `sfx` makes hit sounds in code ([how to make sound effects for a game](/guides/make-sound-effects-for-a-game) shows it). To add paprika3d to Claude Code (it needs Google Chrome and Node.js), run these two lines in a terminal, the window where you type commands:

```bash
claude plugin marketplace add paprika3d/paprika3d
claude plugin install paprika3d@paprika3d
```

## Without paprika3d

Ask the agent to show each press's offset in milliseconds next to the judgement while you play. If nearly every press reads late by about the same amount, that is your speakers, not you: set `OFFSET` to it. If presses on one lane never count, check that the lane's key name (`KeyD`) matches what the browser sends, in the browser console (the panel of messages a page writes, opened with F12).

## Next steps

- Make each hit pop on screen as well as in sound: [how to make a game feel good](/guides/make-a-game-feel-good).
- Build better hit and miss sounds: [how to make sound effects for a game](/guides/make-sound-effects-for-a-game).
- Keep the top score for each song: [how to save the high score](/guides/save-the-high-score).
- Put a title screen with a song list in front: [how to make a main menu for a game](/guides/make-a-main-menu).
- The general loop of building with an agent: [how to vibe code a game](/guides/how-to-vibe-code-a-game).
