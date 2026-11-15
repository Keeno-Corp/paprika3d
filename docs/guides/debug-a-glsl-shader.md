---
title: How to debug a GLSL shader in three.js: compile errors, values drawn as colours and read back
phrase: how to debug a glsl shader
description: How to debug a GLSL shader in a three.js ShaderMaterial when there is no debugger to step through it. On a small lava lamp, a typo's compile error is read back with the line number of the shader's own source, a suspect value is drawn as grey and read back as numbers at chosen pixels with look's sample, and eval reads and switches the uniforms the material holds, using the paprika3d MCP server.
meta: How to debug a GLSL shader in three.js: read the compile log by line, draw a value as grey and read it back at chosen pixels as numbers.
intent: debug-a-glsl-shader
queries:
  - "How to debug a GLSL shader?"
  - "Debug GLSL code in webgl"
  - "Debugging Shaders"
  - "How to use console.log() in shader"
  - "How do you guys debug GLSL?"
author: paprika3d agent
date: 2026-11-12
review: weekly
---
# How to debug a GLSL shader in three.js: compile errors, values drawn as colours and read back

There is no debugger that steps through a fragment shader and no `console.log` inside one, so GLSL is debugged two ways: read the compile log when the shader does not build, and draw the value you suspect as a colour, then read that colour back as a number. A coding agent can do both on its own with paprika3d, which runs the page in headless Chrome: in Claude Code, `claude plugin marketplace add Keeno-Corp/paprika3d && claude plugin install paprika3d@paprika3d`; in any other MCP client, register `npx -y paprika3d serve`. Then `eval` reads the compile log and the uniforms, and `look` with `sample` reads the colours drawn at the pixels you name.

## Why a shader is hard to debug

A fragment shader runs once per pixel, on the GPU, thousands of times a frame, and gives back one thing: a colour. A wrong formula does not throw. It draws wrong, and the picture alone rarely says which term is off: "the wax fills the whole lamp" could be a wrong threshold, a wrong falloff, blobs in the wrong units or a uniform that never arrived. A typo is the other case: the shader does not compile, three.js logs an error, and the mesh simply is not drawn.

paprika3d does not step through a shader either. What it gives an agent is the two halves of the usual method, without a person reading pixels off a screen:

- The compile log, from `eval`, with each error's line number turned back into a line of your own shader string.
- Numbers for colours: `look` with `sample` returns the colour at up to 32 points as `#rrggbb`, each the mean of 5 × 5 pixels. Draw the value as grey and the number comes back.
- The uniforms as JavaScript holds them, from `eval`, which can also flip a debug switch in the material without editing the file.

## Install

paprika3d needs Google Chrome and Node 20.11 or later; the Claude Code plugin needs Claude Code 2.1.118 or later.

```bash
claude plugin marketplace add Keeno-Corp/paprika3d
claude plugin install paprika3d@paprika3d
npm install three
```

## The page: a lava lamp

The wax is a field: each of five blobs adds to it, and where the field passes 1 the glass draws wax. A `uDebug` uniform switches the shader to drawing the field itself as grey, divided by 4, so a value from 0 to 4 fits in the 0 to 255 of one colour channel. This first version has a bug, and the wax covers most of the glass.

```html
<!-- verify -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Lava lamp</title>
<style>html,body{margin:0;overflow:hidden}canvas{display:block}</style></head>
<body>
<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x15121c);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 7);
scene.add(new THREE.HemisphereLight(0xffffff, 0x302840, 1.5));

// The wax: a sum of blobs, each adding r² / d² to a field; where the field passes 1 the glass draws wax.
const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3), new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uBlobs: { value: [[-0.25, -1, 0.22], [0.2, -0.4, 0.18], [-0.1, 0.3, 0.2], [0.25, 0.9, 0.15], [0, -1.3, 0.3]].map(b => new THREE.Vector3(...b)) },
    uWax: { value: new THREE.Color(0xff5a1f) },
    uLiquid: { value: new THREE.Color(0x4a1460) },
    uDebug: { value: 0 },   // 1 draws the field itself as grey, field / 4
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform vec3 uBlobs[5];
    uniform vec3 uWax;
    uniform vec3 uLiquid;
    uniform float uDebug;
    varying vec2 vUv;
    void main() {
      vec2 p = (vUv - 0.5) * vec2(1.2, 3.0);   // lamp units, 0 at the centre of the glass
      float f = 0.0;
      for (int i = 0; i < 5; i++) {
        vec3 b = uBlobs[i];
        vec2 c = vec2(b.x, b.y + sin(uTime * 0.4 + float(i) * 1.7) * 0.5);
        f += b.z / length(p - c);
      }
      if (uDebug > 0.5) { gl_FragColor = vec4(vec3(f / 4.0), 1.0); return; }
      float wax = smoothstep(0.9, 1.1, f);
      gl_FragColor = vec4(mix(uLiquid, uWax, wax), 1.0);
    }`,
}));
glass.name = 'glass';
scene.add(glass);
const metal = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.3, roughness: 0.4 });
const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 1.2, 32), metal);
base.name = 'base'; base.position.y = -2.1;
const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.6, 0.6, 32), metal);
cap.name = 'cap'; cap.position.y = 1.8;
scene.add(base, cap);
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

renderer.setAnimationLoop((now) => {
  glass.material.uniforms.uTime.value = now / 1000;   // the harness's paused clock decides now
  renderer.render(scene, camera);
});
</script>
</body></html>
```

Save it as `index.html`. `open` serves the folder and loads it on a paused clock; its reply lists the named objects, `{"three":"186","scenes":1,"entities":["glass","base","cap"]}`. The replies below are the ones the stable tools gave for this page on 2026-11-12, with run folders shortened to `<project>`.

## A compile error: read the log by line

Say the shader has a typo, `flaot` for `float` on the line that computes `wax`:

```js
      flaot wax = smoothstep(0.9, 1.1, f);
```

`open` stops at frame 0, before three.js compiles anything, so the error comes with the first frame drawn, here the first `look`:

```text
look {}

Picture: <project>/paprika3d/runs/2026-11-12T04-45-59-721Z/look-1.png
Pixels: brightness 9%, colour saturation 35%, 1% near black, 0% blown out. Dark: a viewer sees little.
Hues: grey 100% of the frame; over the objects (13.4% of it): grey 100%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
On screen (3):
glass 8.6% [546, 165, 733, 635] 3 × 1.2 units approximate (a sprite or its own shader: see the picture)
base 3.4% [507, 635, 772, 799]
cap 1.3% [546, 58, 733, 164]
Never visible: none
Page errors since the last call (1):
THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false
A shader failed to compile: what is drawn with it draws nothing (a look lists it never visible) until it compiles.
```

The picture shows the cap and the base with nothing between them: the glass was not drawn. The object list still names `glass`, because the list comes from the ID image, which draws every object in a flat colour of its own and so counts the glass's pixels even when its shader cannot run. With a shader error in the reply, trust the picture.

The error line in the reply is the first line of three.js's message. The compiler's own words are on the program three.js keeps: `renderer.info.programs` holds one entry per compiled program, and a program that failed has a `diagnostics` object with each stage's log and the prefix three.js put before your code. The log counts lines from the start of the full source, `#version` and three.js's prefix included, so subtracting the prefix's line count gives the line in your own string:

```text
eval {"code": "return renderer.info.programs.filter(p => p.diagnostics).map(p => {\n  const d = p.diagnostics.fragmentShader;\n  const before = d.prefix.split(\"\\n\").length;   // three.js puts #version and its own lines before ours\n  return d.log.trim().replace(/0:(\\d+)/g, (_, n) => `line ${n - before}`);\n})"}

["ERROR: line 17: 'flaot' : undeclared identifier\nERROR: line 17: 'wax' : syntax error"]
```

Line 17 of the `fragmentShader` string, counting the line with the opening backtick as line 1, is the `flaot` line. `observe`'s `harness.errors` also carries three.js's whole message, with the source lines around the error and the failing one marked; the uniform guide linked below shows that reply.

## A wrong value: draw it, then read it

With the typo fixed, the lamp draws, and the wax is one lump that fills most of the glass:

```text
look {}

Picture: <project>/paprika3d/runs/2026-11-12T04-45-19-157Z/look-1.png
Pixels: brightness 10%, colour saturation 40%, 0% near black, 0% blown out. Dark: a viewer sees little.
Hues: grey 93%, red 7% of the frame; over the objects (13.4% of it): red 54%, grey 46%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
On screen (3):
glass 8.6% [546, 165, 733, 635] 3 × 1.2 units approximate (a sprite or its own shader: see the picture)
base 3.4% [507, 635, 772, 799]
cap 1.3% [546, 58, 733, 164]
Never visible: none
```

Red is 54% of the objects' pixels (glass, cap and base). Five blobs of radius 0.15 to 0.3 in a glass 1.2 wide and 3 tall should leave most of it purple. First, the inputs: `eval` reads the uniforms the material holds, which is what three.js uploads each frame.

```text
eval {"code": "const u = find(\"glass\").material.uniforms; return { time: u.uTime.value, debug: u.uDebug.value, blobs: u.uBlobs.value.map(v => v.toArray()) }"}

{"time":60.017,"debug":0,"blobs":[[-0.25,-1,0.22],[0.2,-0.4,0.18],[-0.1,0.3,0.2],[0.25,0.9,0.15],[0,-1.3,0.3]]}
```

The blobs are where the code put them, in lamp units, with the radii given (the harness's clock does not start at zero, on purpose). So the inputs are right and the suspect is the field. `eval` flips the debug switch, a change that lasts until the next reload, and `look` samples seven points: the glass's top left corner, five points down its middle, and one on its right side, all inside its box `[546, 165, 733, 635]`.

```text
eval {"code": "find(\"glass\").material.uniforms.uDebug.value = 1; return \"field drawn as grey\""}

field drawn as grey

look {"sample": [[560, 180], [640, 200], [640, 300], [640, 400], [640, 500], [640, 600], [720, 400]]}

Picture: <project>/paprika3d/runs/2026-11-12T04-45-19-157Z/look-2.png
Pixels: brightness 11%, colour saturation 32%, 0% near black, 0% blown out; 6% of the picture changed since the last look. Dark: a viewer sees little.
Hues: grey 100% of the frame; over the objects (13.4% of it): grey 100%.
On screen (3):
glass 8.6% [546, 165, 733, 635] 3 × 1.2 units approximate (a sprite or its own shader: see the picture)
base 3.4% [507, 635, 772, 799]
cap 1.3% [546, 58, 733, 164]
Never visible: none
Colours (5 × 5 mean, in the page's pixels): (560, 180) #2a2a2a, (640, 200) #363636, (640, 300) #b2b2b2, (640, 400) #6a6a6a, (640, 500) #4b4b4b, (640, 600) #818181, (720, 400) #545454.
```

The shader wrote the field divided by 4, so the field is 4 × the channel value / 255. A ShaderMaterial whose shader includes none of three.js's colour chunks writes its value to the canvas as it is, with no tone mapping or colour-space change, which is why the number reads back exactly. The first column below is this reply:

| Point | Field, first version | Field, after the fix |
|---|---|---|
| (560, 180), top left corner | 0.66 | 0.11 |
| (640, 200) | 0.85 | 0.19 |
| (640, 300) | 2.79 | 3.48 |
| (640, 400) | 1.66 | 0.80 |
| (640, 500) | 1.18 | 0.31 |
| (640, 600) | 2.02 | 1.49 |
| (720, 400), right side | 1.32 | 0.44 |

Wax starts at 0.9. Five of the seven points are over it, including (640, 500), which is not near any blob. A field that is above 1 in the empty space between blobs falls off too slowly with distance, and the loop says so: `f += b.z / length(p - c)` falls off as 1 / d. A metaball field falls off as r² / d²:

```js
        f += b.z * b.z / dot(p - c, p - c);
```

After that edit the next call reloads the page by itself. The same `eval` and the same `look` give the second column:

```text
look {"sample": [[560, 180], [640, 200], [640, 300], [640, 400], [640, 500], [640, 600], [720, 400]]}

Picture: <project>/paprika3d/runs/2026-11-12T04-45-37-932Z/look-2.png
Pixels: brightness 9%, colour saturation 32%, 2% near black, 0% blown out; 6% of the picture changed since the last look. Dark: a viewer sees little.
Hues: grey 100% of the frame; over the objects (13.4% of it): grey 100%.
On screen (3):
glass 8.6% [546, 165, 733, 635] 3 × 1.2 units approximate (a sprite or its own shader: see the picture)
base 3.4% [507, 635, 772, 799]
cap 1.3% [546, 58, 733, 164]
Never visible: none
Colours (5 × 5 mean, in the page's pixels): (560, 180) #070707, (640, 200) #0c0c0c, (640, 300) #dedede, (640, 400) #333333, (640, 500) #141414, (640, 600) #5f5f5f, (720, 400) #1c1c1c.
```

Now the empty space reads 0.11 to 0.44, under the 0.9 where wax starts, and the two points inside blobs read 3.48 and 1.49. With the switch back at 0 (a reload puts it there), the plain look of the fixed lamp has red at 12% of the objects' pixels, in separate blobs:

```text
look {}

Picture: <project>/paprika3d/runs/2026-11-12T04-45-37-932Z/look-1.png
Pixels: brightness 8%, colour saturation 40%, 0% near black, 0% blown out. Dark: a viewer sees little.
Hues: grey 99% of the frame; over the objects (13.4% of it): grey 88%, red 12%.
Canvas: 1280x800 buffer for 1280x800 CSS at DPR 1 (renderer pixel ratio 1); resize handler ran.
On screen (3):
glass 8.6% [546, 165, 733, 635] 3 × 1.2 units approximate (a sprite or its own shader: see the picture)
base 3.4% [507, 635, 772, 799]
cap 1.3% [546, 58, 733, 164]
Never visible: none
```

## Drawing other values

The same trick reads any value a shader computes. A few encodings that keep the number readable:

- **One value, known range:** divide by the top of the range and write it to all three channels, as above. One channel holds 256 steps, so a range of 0 to 4 reads to about 0.016.
- **A value that can be negative:** write `v * 0.5 + 0.5` (a normal, a signed distance) and undo it when reading.
- **A vector:** one component per channel, as `vec4(normal * 0.5 + 0.5, 1.0)` draws a normal.
- **A yes or no:** red where the condition holds, black elsewhere, then sample the pixels in question, or look at the picture.

Draw it with no blending and no tone mapping, as a plain `ShaderMaterial` does: `#include <tonemapping_fragment>` or `#include <colorspace_fragment>` in the shader changes the number on the way to the canvas. Sample away from edges, since each point is a 5 × 5 mean.

## What paprika3d does not do

- It does not step through a shader, set breakpoints or show a variable's value at a pixel unless the shader draws it.
- It does not capture the WebGL calls of a frame. Spector.js, a browser extension, records every call of one frame with each program's source and state, which helps when the question is which draw call used which program.
- It does not read values inside the GPU. `eval` reads the JavaScript side of a uniform, the object three.js uploads; whether the shader uses it is what the drawn colour shows.
- It does not time a shader. On a machine with no GPU, Chrome draws WebGL in software, and frame times say nothing of a real GPU's.

## Without paprika3d

In a browser by hand, the same steps are: open the console for three.js's shader error (it prints the source lines around the failure), switch the shader's output to the suspect value, and read pixels with `gl.readPixels` right after `renderer.render()` (or make the renderer with `preserveDrawingBuffer: true` so the canvas keeps its pixels). A browser script with Playwright or Puppeteer can do the reading with `page.evaluate`. The reading part is a few lines; picking points, converting colours back to values and keeping the debug switch out of the source are what the steps above save.

## Related

- [Test a three.js game with Claude Code](/guides/test-threejs-game-claude-code): the open, look and observe loop on a small game.
- [Screenshot a three.js scene headless from a coding agent](/guides/screenshot-threejs-scene-headless): what `look` returns and how to read it.
- [three.js ShaderMaterial uniform not updating](/guides/threejs-shadermaterial-uniform-not-updating): uniform copies, and the full compile log in `observe`.
- [three.js onBeforeCompile not working](/guides/threejs-onbeforecompile-not-working): reading the patched source WebGL compiled.
- [three.js colours washed out](/guides/threejs-colors-washed-out): colour spaces between a hex code and the canvas.
