// @paprika3d/game-fx 0.4.5, written by paprika3d's open tool: ship it with the page; each open rewrites it unless it is newer
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

var RATE = 44100;
var presets = {
  coin: { frequency: 1200, shape: 1, sustain: 0.05, release: 0.2, pitchJump: 600, pitchJumpTime: 0.05 },
  jump: { frequency: 300, shape: 1, release: 0.2, slide: 5 },
  hit: { frequency: 200, shape: 2, release: 0.15, slide: -2, noise: 0.5 },
  explode: { frequency: 80, shape: 4, noise: 1, release: 0.6, slide: -0.2, filter: -1000, volume: 0.35 },
  shoot: { frequency: 700, shape: 2, release: 0.12, slide: -9 },
  laser: { frequency: 1500, shape: 5, release: 0.15, slide: -15, volume: 0.3 },
  powerup: { frequency: 400, shape: 1, sustain: 0.2, release: 0.2, slide: 3, repeatTime: 0.08 },
  blip: { frequency: 900, release: 0.04 },
  bounce: { frequency: 180, release: 0.15, slide: 4, decay: 0.05, sustainVolume: 0.5 },
  thud: { frequency: 60, shape: 4, noise: 2, release: 0.15, filter: -400 },
  roll: { frequency: 100, shape: 4, noise: 3, sustain: 0.5, release: 0, filter: -600 }
};
function render(sound) {
  const p = typeof sound === "string" ? presets[sound] : sound;
  if (!p)
    throw new Error(`sfx: no preset "${sound}"; presets: ${Object.keys(presets).join(", ")}; add one with sfx.define`);
  let {
    volume = 0.5,
    frequency = 220,
    attack = 0,
    sustain = 0,
    release = 0.1,
    shape = 0,
    shapeCurve = 1,
    slide = 0,
    deltaSlide = 0,
    pitchJump = 0,
    pitchJumpTime = 0,
    repeatTime = 0,
    noise = 0,
    modulation = 0,
    bitCrush = 0,
    delay = 0,
    sustainVolume = 1,
    decay = 0,
    tremolo = 0,
    filter = 0,
    seed = 1
  } = p;
  seed = Math.abs(seed | 0) % 2147483647 || 1;
  const PI2 = Math.PI * 2, sign = (v) => v < 0 ? -1 : 1;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  const startSlide = slide *= 500 * PI2 / RATE / RATE;
  let startFrequency = frequency *= PI2 / RATE;
  const w = PI2 * Math.abs(filter) * 2 / RATE, cos = Math.cos(w), alpha = Math.sin(w) / 4;
  const a0 = 1 + alpha, a1 = -2 * cos / a0, a2 = (1 - alpha) / a0;
  const b0 = (1 + sign(filter) * cos) / 2 / a0, b1 = -(sign(filter) + cos) / a0, b2 = b0;
  let x2 = 0, x1 = 0, y2 = 0, y1 = 0, modOffset = 0, repeat = 0, crush = 0, jump = 1, t = 0, s = 0;
  attack = attack * RATE + 9;
  decay *= RATE;
  sustain *= RATE;
  release *= RATE;
  delay *= RATE;
  deltaSlide *= 500 * PI2 / RATE ** 3;
  modulation *= PI2 / RATE;
  pitchJump *= PI2 / RATE;
  pitchJumpTime *= RATE;
  repeatTime = repeatTime * RATE | 0;
  const length = attack + decay + sustain + release + delay | 0, b = new Float32Array(length);
  for (let i = 0;i < length; b[i++] = s * volume) {
    if (!(++crush % (bitCrush * 100 | 0))) {
      s = shape > 4 ? t / PI2 % 1 < shapeCurve / 2 ? 1 : -1 : shape > 3 ? Math.sin(t ** 3) : shape > 2 ? Math.max(Math.min(Math.tan(t), 1), -1) : shape > 1 ? 1 - (2 * t / PI2 % 2 + 2) % 2 : shape ? 1 - 4 * Math.abs(Math.round(t / PI2) - t / PI2) : Math.sin(t);
      s = (repeatTime ? 1 - tremolo + tremolo * Math.sin(PI2 * i / repeatTime) : 1) * (shape > 4 ? s : shapeCurve === 1 ? s + 0 : sign(s) * Math.abs(s) ** shapeCurve) * (i < attack ? i / attack : i < attack + decay ? 1 - (i - attack) / decay * (1 - sustainVolume) : i < attack + decay + sustain ? sustainVolume : i < length - delay ? (length - i - delay) / release * sustainVolume : 0);
      s = delay ? s / 2 + (delay > i ? 0 : (i < length - delay ? 1 : (length - i) / delay) * b[i - delay | 0] / 2 / volume) : s;
      if (filter)
        s = y1 = b2 * x2 + b1 * (x2 = x1) + b0 * (x1 = s) - a2 * y2 - a1 * (y2 = y1);
    }
    const f = (frequency += slide += deltaSlide) * Math.cos(modulation * modOffset++);
    t += f + f * noise * (random() * 2 - 1);
    if (jump && ++jump > pitchJumpTime) {
      frequency += pitchJump;
      startFrequency += pitchJump;
      jump = 0;
    }
    if (repeatTime && !(++repeat % repeatTime)) {
      frequency = startFrequency;
      slide = startSlide;
      jump = jump || 1;
    }
  }
  return b;
}
var ctx;
var buffers = {};
var samples = {};
var round = (v) => Math.round(v * 1000) / 1000;
var sfx = {
  log: [],
  render,
  define(name, params) {
    presets[name] = params;
    delete buffers[name];
    delete samples[name];
  },
  play(sound, volume = 1, when = 0) {
    const name = typeof sound === "string" ? sound : "custom";
    const entry = { name, time: performance.now(), audible: false };
    sfx.log.push(entry);
    const wave = buffers[name] ? undefined : name === "custom" ? render(sound) : samples[name] ??= render(sound);
    try {
      ctx ??= new AudioContext;
      if (ctx.state !== "running") {
        ctx.resume().catch(() => {});
        return;
      }
      let buf = buffers[name];
      if (!buf) {
        buf = ctx.createBuffer(1, wave.length, RATE);
        buf.getChannelData(0).set(wave);
        if (name !== "custom")
          buffers[name] = buf;
      }
      const src = ctx.createBufferSource(), gain = ctx.createGain();
      src.buffer = buf;
      gain.gain.value = volume;
      src.connect(gain).connect(ctx.destination);
      src.start(ctx.currentTime + when);
      entry.audible = true;
      globalThis.__harness?.sounds?.push(name);
      return src;
    } catch {
      return;
    }
  },
  check(sound) {
    const b = render(sound);
    let peak = 0, sum = 0, crossings = 0;
    b.forEach((v, i) => {
      peak = Math.max(peak, Math.abs(v));
      sum += v * v;
      if (i && v < 0 !== b[i - 1] < 0)
        crossings++;
    });
    const duration = b.length / RATE;
    return {
      duration: round(duration),
      peak: round(peak),
      rms: round(Math.sqrt(sum / (b.length || 1))),
      clipped: peak > 1,
      hz: Math.round(crossings / 2 / (duration || 1))
    };
  },
  presets: () => Object.keys(presets)
};
import { CanvasTexture, Color, RepeatWrapping, SRGBColorSpace } from "three";
var rng = (seed) => () => {
  seed = seed + 1831565813 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
var canvas = (w, h = w) => {
  const c = document.createElement("canvas");
  c.width = Math.ceil(w);
  c.height = Math.ceil(h);
  return [c, c.getContext("2d")];
};
var css = (c, a = 1) => {
  const { r, g, b } = new Color(c).convertLinearToSRGB();
  return `rgba(${r * 255},${g * 255},${b * 255},${a})`;
};
var rgb = (c) => new Color(c).convertLinearToSRGB().toArray().map((v) => v * 255);
var done = (c, tile = false, colour = true) => {
  const t = new CanvasTexture(c);
  if (colour)
    t.colorSpace = SRGBColorSpace;
  if (tile)
    t.wrapS = t.wrapT = RepeatWrapping;
  return t;
};
function field(size, scale, octaves, seed) {
  const out = new Float32Array(size * size), r = rng(seed);
  let amp = 1, total = 0;
  for (let o = 0, p = Math.max(1, Math.round(scale));o < octaves; o++, p *= 2, amp /= 2) {
    const grid = Float32Array.from({ length: p * p }, r);
    for (let y = 0;y < size; y++) {
      const fy = y / size * p, iy = fy | 0, sy = (fy - iy) ** 2 * (3 - 2 * (fy - iy)), j0 = iy * p, j1 = (iy + 1) % p * p;
      for (let x = 0;x < size; x++) {
        const fx = x / size * p, ix = fx | 0, sx = (fx - ix) ** 2 * (3 - 2 * (fx - ix)), i1 = (ix + 1) % p;
        const top = grid[j0 + ix] + (grid[j0 + i1] - grid[j0 + ix]) * sx, bot = grid[j1 + ix] + (grid[j1 + i1] - grid[j1 + ix]) * sx;
        out[y * size + x] += (top + (bot - top) * sy) * amp;
      }
    }
    total += amp;
  }
  return out.map((v) => v / total);
}
function paint(size, a, b, t) {
  const [c, x] = canvas(size), img = x.createImageData(size, size), d = img.data;
  for (let i = 0;i < size * size; i++) {
    const k = t(i);
    d[i * 4] = a[0] + (b[0] - a[0]) * k;
    d[i * 4 + 1] = a[1] + (b[1] - a[1]) * k;
    d[i * 4 + 2] = a[2] + (b[2] - a[2]) * k;
    d[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}
var tex = {
  rng,
  label(text, { size = 64, color = "#fff", background = null, font = "sans-serif", padding = 16 } = {}) {
    const f = font.includes("px") ? font : `bold ${size}px ${font}`;
    const w = canvas(1)[1];
    w.font = f;
    const m = w.measureText(text), up = m.actualBoundingBoxAscent, dn = m.actualBoundingBoxDescent;
    const [c, x] = canvas(m.width + padding * 2, up + dn + padding * 2);
    if (background != null) {
      x.fillStyle = css(background);
      x.fillRect(0, 0, c.width, c.height);
    }
    x.font = f;
    x.fillStyle = css(color);
    x.textAlign = "center";
    x.fillText(text, c.width / 2, padding + up);
    return done(c);
  },
  glow(color = "#fff", { size = 128, falloff = 0.4, opacity = 1 } = {}) {
    const [c, x] = canvas(size), h = size / 2, g = x.createRadialGradient(h, h, 0, h, h, h), f = Math.min(1, Math.max(0, +falloff || 0));
    g.addColorStop(0, css(color, opacity));
    g.addColorStop(f, css(color, opacity / 4));
    g.addColorStop(1, css(color, 0));
    x.fillStyle = g;
    x.fillRect(0, 0, size, size);
    return done(c);
  },
  noise({ size = 256, scale = 4, colors = [5592405, 11184810], octaves = 4, seed = 1 } = {}) {
    const n = field(size, scale, octaves, seed), [a, b] = colors.map(rgb);
    return done(paint(size, a, b, (i) => n[i]), true);
  },
  wood({ size = 256, color = 10512429, rings = 8, seed = 1 } = {}) {
    const wave = field(size, 2, 3, seed), grain = field(size, 32, 2, seed + 1), light = rgb(color), n = Math.max(1, Math.round(rings));
    return done(paint(size, light, light.map((v) => v * 0.55), (i) => {
      const t = i % size / size * n + wave[i] * 2;
      return (t - Math.floor(t)) ** 3 * 0.8 + grain[i] * 0.3;
    }), true);
  },
  bricks({ size = 256, rows = 8, cols = 4, brick = 10111538, mortar = 13156528, jitter = 0.15, seed = 1 } = {}) {
    rows = Math.max(2, Math.ceil(rows / 2) * 2);
    cols = Math.max(1, Math.round(cols));
    const [c, x] = canvas(size), r = rng(seed), w = size / cols, h = size / rows, m = Math.max(1, size / 128), base = rgb(brick);
    x.fillStyle = css(mortar);
    x.fillRect(0, 0, size, size);
    for (let j = 0;j < rows; j++)
      for (let i = 0;i < cols; i++) {
        const k = 1 + (r() * 2 - 1) * jitter, sx = i * w + j % 2 * w / 2;
        x.fillStyle = `rgb(${base.map((v) => Math.min(255, v * k))})`;
        for (const o of [0, -size])
          x.fillRect(sx + o + m, j * h + m, w - 2 * m, h - 2 * m);
      }
    const t = done(c, true), lum = (v) => v[0] * 0.3 + v[1] * 0.59 + v[2] * 0.11;
    t.userData.invert = lum(rgb(mortar)) > lum(base);
    return t;
  },
  windows({ size = 256, cols = 4, rows = 4, lit = 0.3, frame = 2763306, glass = 3493995, wall = 12101786, seed = 1 } = {}) {
    const [c, x] = canvas(size), r = rng(seed), w = size / cols, h = size / rows;
    x.fillStyle = css(wall);
    x.fillRect(0, 0, size, size);
    for (let j = 0;j < rows; j++)
      for (let i = 0;i < cols; i++) {
        x.fillStyle = css(frame);
        x.fillRect(i * w + w * 0.2, j * h + h * 0.2, w * 0.6, h * 0.55);
        x.fillStyle = r() < lit ? "#ffd98a" : css(glass);
        x.fillRect(i * w + w * 0.25, j * h + h * 0.25, w * 0.5, h * 0.45);
      }
    return done(c, true);
  },
  dots(text, { cols = 0, rows = 8, on = 16755200, off = 2232576, dot = 8 } = {}, into) {
    const lines = text.split(`
`), lh = rows / lines.length;
    cols ||= Math.max(...lines.map((l) => l.length)) * 6;
    const [b, bx] = canvas(cols * 8, rows * 8), [s, sx] = canvas(cols, rows);
    bx.font = `bold ${lh * 8}px monospace`;
    bx.textAlign = "center";
    bx.fillStyle = "#fff";
    lines.forEach((l, k) => bx.fillText(l, cols * 4, (k + 0.86) * lh * 8));
    sx.drawImage(b, 0, 0, cols, rows);
    const lit = sx.getImageData(0, 0, cols, rows).data, c = into?.image ?? canvas(cols * dot, rows * dot)[0], x = c.getContext("2d");
    x.fillStyle = "#000";
    x.fillRect(0, 0, c.width, c.height);
    for (let i = 0;i < cols * rows; i++) {
      x.fillStyle = css(lit[i * 4 + 3] > 90 ? on : off);
      x.beginPath();
      x.arc((i % cols + 0.5) * dot, ((i / cols | 0) + 0.5) * dot, dot * 0.4, 0, 7);
      x.fill();
    }
    if (!into)
      return done(c);
    into.needsUpdate = true;
    return into;
  },
  normal(texture, { strength = 2, invert = !!texture.userData.invert } = {}) {
    const src = texture.image, W = src.width, H = src.height;
    const d = src.getContext("2d").getImageData(0, 0, W, H).data, s = strength * W / 256 * (invert ? -1 : 1);
    const hgt = (x2, y) => {
      const i = ((y + H) % H * W + (x2 + W) % W) * 4;
      return (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255;
    };
    const [c, x] = canvas(W, H), img = x.createImageData(W, H), o = img.data;
    for (let y = 0, k = 0;y < H; y++)
      for (let i = 0;i < W; i++, k += 4) {
        const nx = (hgt(i - 1, y) - hgt(i + 1, y)) * s, ny = (hgt(i, y + 1) - hgt(i, y - 1)) * s, l = Math.hypot(nx, ny, 1);
        o[k] = (nx / l + 1) * 127.5;
        o[k + 1] = (ny / l + 1) * 127.5;
        o[k + 2] = (1 / l + 1) * 127.5;
        o[k + 3] = 255;
      }
    x.putImageData(img, 0, 0);
    const t = done(c, false, false);
    t.wrapS = texture.wrapS;
    t.wrapT = texture.wrapT;
    return t;
  }
};
import { AdditiveBlending, Box3, BufferAttribute, BufferGeometry, CanvasTexture as CanvasTexture2, Color as Color2, NormalBlending, SRGBColorSpace as SRGBColorSpace2, Points, PointsMaterial, Quaternion, Vector3 } from "three";
var seeded = (seed) => () => {
  seed = seed + 1831565813 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
var v = new Vector3;
var vec = (u) => Array.isArray(u) ? new Vector3(...u) : new Vector3(u.x, u.y, u.z);
var sprite = () => {
  const c = document.createElement("canvas"), x = c.getContext("2d"), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  c.width = c.height = 32;
  g.addColorStop(0, "#fff");
  g.addColorStop(1, "#fff0");
  x.fillStyle = g;
  x.fillRect(0, 0, 32, 32);
  return Object.assign(new CanvasTexture2(c), { colorSpace: SRGBColorSpace2 });
};
var S = 10;

class Burst extends Points {
  alive = 0;
  defaults;
  random;
  p;
  constructor({ max = 500, seed = 1, size = 0.1, additive = true, ...defaults } = {}) {
    const g = new BufferGeometry;
    g.setAttribute("position", new BufferAttribute(new Float32Array(max * 3), 3));
    g.setAttribute("color", new BufferAttribute(new Float32Array(max * 4), 4));
    g.setDrawRange(0, 0);
    super(g, new PointsMaterial({ size, map: globalThis.document && sprite(), vertexColors: true, transparent: true, depthWrite: false, blending: additive ? AdditiveBlending : NormalBlending }));
    this.frustumCulled = false;
    g.boundingBox = new Box3;
    this.defaults = { count: 20, speed: 4, life: 1, gravity: 9.8, drag: 0, color: 16777215, spread: Math.PI, up: new Vector3(0, 1, 0), ...defaults };
    this.random = seeded(seed);
    this.onBeforeRender = (_r, _s, camera) => {
      this.material.size = size / Math.tan((camera.fov ?? 90) * Math.PI / 360);
    };
    this.p = new Float32Array(max * S);
  }
  emit(at, o = {}) {
    const e = { ...this.defaults, ...o }, r = this.random, c = new Color2(e.color), d = new Vector3, a = this.geometry.attributes;
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), vec(e.up).normalize());
    const gv = typeof e.gravity === "number" ? [0, -e.gravity, 0] : e.gravity;
    if (gv?.length !== 3 || !gv.every(Number.isFinite))
      throw new TypeError("burst.emit gravity: a number or [x, y, z]");
    for (let n = 0;n < e.count && this.alive < a.position.count; n++) {
      const i = this.alive++, y = 1 - r() * (1 - Math.cos(e.spread)), t = r() * 2 * Math.PI, rho = Math.sqrt(1 - y * y);
      d.set(rho * Math.cos(t), y, rho * Math.sin(t)).applyQuaternion(q).multiplyScalar(e.speed * (0.5 + r() / 2));
      this.p.set([d.x, d.y, d.z, 0, e.life * (0.5 + r() / 2), ...gv, e.drag], i * S);
      a.position.setXYZ(i, at.x, at.y, at.z);
      a.color.setXYZW(i, c.r, c.g, c.b, 1);
    }
    this.update(0);
  }
  update(dt) {
    const p = this.p, g = this.geometry, pos = g.attributes.position, col = g.attributes.color, x = pos.array, c = col.array, box = g.boundingBox.makeEmpty();
    for (let i = 0;i < this.alive; i++) {
      const k = i * S;
      if ((p[k + 3] += dt) >= p[k + 4]) {
        const last = --this.alive;
        p.copyWithin(k, last * S, last * S + S);
        x.copyWithin(i * 3, last * 3, last * 3 + 3);
        c.copyWithin(i * 4, last * 4, last * 4 + 4);
        i--;
        continue;
      }
      const damp = Math.exp(-p[k + 8] * dt);
      for (let j = 0;j < 3; j++)
        x[i * 3 + j] += (p[k + j] = (p[k + j] + p[k + 5 + j] * dt) * damp) * dt;
      c[i * 4 + 3] = 1 - p[k + 3] / p[k + 4];
      box.expandByPoint(v.fromBufferAttribute(pos, i));
    }
    g.boundingSphere = null;
    g.setDrawRange(0, this.alive);
    pos.needsUpdate = col.needsUpdate = true;
  }
}
var burst = (o) => new Burst(o);
function shake(o, { seed = 1, decay = 6 } = {}) {
  const r = seeded(seed), off = new Vector3, at = new Vector3;
  let amp = 0;
  return {
    kick(strength) {
      amp += strength;
    },
    update(dt) {
      if (o.position.equals(at))
        o.position.sub(off);
      amp *= Math.exp(-decay * dt);
      at.copy(o.position).add(off.set(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).multiplyScalar(amp));
      o.position.copy(at);
    }
  };
}
import * as THREE from "three";
import { ACESFilmicToneMapping, BackSide, Box3 as Box32, BoxGeometry, Color as Color3, DirectionalLight, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, ShadowMaterial, Vector3 as Vector32 } from "three";
var Renderer = THREE.WebGLRenderer ?? THREE.WebGPURenderer;
function stage(container = document.body, o = {}) {
  const renderer = new Renderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = o.exposure ?? 1;
  renderer.shadowMap.enabled = o.shadow ?? true;
  renderer.domElement.style.display = "block";
  container.appendChild(renderer.domElement);
  const scene = new Scene;
  if (o.background !== null)
    scene.background = new Color3(o.background ?? 15263976);
  if (o.env !== false) {
    const env = new Scene;
    if (o.env != null)
      env.background = new Color3(o.env);
    else {
      env.add(new Mesh(new BoxGeometry(10, 10, 10), new MeshBasicMaterial({ color: 7829367, side: BackSide })));
      for (const [w, h, d, x, y, z, k] of [[6, 0.1, 6, 0, 4.9, 0, 4], [0.1, 4, 6, -4.9, 1, 0, 6], [0.1, 4, 3, 4.9, 1, 2, 3], [4, 3, 0.1, 0, 1, -4.9, 2]]) {
        const m = new Mesh(new BoxGeometry(w, h, d), new MeshBasicMaterial({ color: new Color3().setScalar(k) }));
        m.position.set(x, y, z);
        env.add(m);
      }
    }
    const bake = () => {
      const pm = new PMREMGenerator(renderer);
      scene.environment = pm.fromScene(env, 0.04).texture;
      pm.dispose();
    };
    if (renderer.isWebGPURenderer)
      renderer.init().then(bake);
    else
      bake();
  }
  const camera = new PerspectiveCamera(40, 1, 0.1, 1000);
  camera.position.set(3, 2.5, 5);
  camera.lookAt(0, 0, 0);
  const key = new DirectionalLight(16777215, o.key ?? 1.5);
  key.castShadow = renderer.shadowMap.enabled && key.intensity > 0;
  key.position.set(3, 6, 4);
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 4;
  key.shadow.bias = -0.0005;
  scene.add(camera);
  if (key.intensity)
    scene.add(key, key.target);
  const ground = o.ground === false ? null : new Mesh(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), o.ground == null ? new ShadowMaterial({ opacity: 0.3 }) : new MeshStandardMaterial({ color: o.ground }));
  if (ground) {
    ground.name = "ground";
    ground.receiveShadow = true;
    ground.scale.setScalar(100);
    scene.add(ground);
  }
  const fit = (content, margin = 1.2) => {
    const parent = ground?.parent;
    ground?.removeFromParent();
    const box = content instanceof Box32 ? content : new Box32().setFromObject(content);
    if (ground && parent)
      parent.add(ground);
    if (box.isEmpty())
      return box.getCenter(new Vector32);
    const c = box.getCenter(new Vector32), r = box.getSize(new Vector32).length() / 2 || 1;
    const half = Math.min(camera.fov / 2, Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect) * 180 / Math.PI);
    const d = r * margin / Math.sin(half * Math.PI / 180);
    camera.position.copy(c).addScaledVector(camera.getWorldDirection(new Vector32), -d);
    camera.near = d / 100;
    camera.far = d * 10;
    camera.updateProjectionMatrix();
    camera.lookAt(c);
    key.target.position.copy(c);
    key.position.set(3, 6, 4).setLength(r * 3).add(c);
    Object.assign(key.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: r, far: r * 5 }).updateProjectionMatrix();
    if (ground) {
      ground.position.set(c.x, box.min.y, c.z);
      ground.scale.setScalar(r * 40);
    }
    return c;
  };
  const resize = () => {
    const body = container === document.body, w = body ? innerWidth : container.clientWidth, h = body ? innerHeight : container.clientHeight;
    if (!w || !h)
      return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  addEventListener("resize", resize);
  new ResizeObserver(resize).observe(container);
  resize();
  if (o.fit)
    fit(o.fit);
  return { renderer, scene, camera, key, ground, fit };
}
import { BufferAttribute as BufferAttribute2 } from "three";
function uv(g, metresPerRepeat = 1, offset = 0) {
  if (!g.attributes.normal)
    g.computeVertexNormals();
  const p = g.attributes.position, nr = g.attributes.normal, ix = g.index, n0 = p.count, src = [], idx = [], out = Array(n0 * 2).fill(0);
  const own = new Int8Array(n0).fill(-1), copies = new Map;
  for (let i = 0;i + 2 < (ix ? ix.count : n0); i += 3) {
    const vs = [i, i + 1, i + 2].map((k) => ix ? ix.getX(k) : k), n = [0, 1, 2].map((c) => vs.reduce((s, v2) => s + nr.getComponent(v2, c), 0));
    const m = n.map(Math.abs), ax = m[0] > m[1] && m[0] > m[2] ? 0 : m[1] > m[2] ? 1 : 2, d = n[ax] < 0 ? -1 : 1, f = ax * 2 + (d + 1) / 2;
    for (const v2 of vs) {
      let o = own[v2] < 0 ? (own[v2] = f, v2) : own[v2] === f ? v2 : copies.get(v2 * 6 + f) ?? -1;
      if (o < 0)
        copies.set(v2 * 6 + f, o = n0 + src.push(v2) - 1);
      idx.push(o);
      const x = p.getX(v2) / metresPerRepeat, y = p.getY(v2) / metresPerRepeat, z = p.getZ(v2) / metresPerRepeat;
      out[o * 2] = (ax ? x * (ax > 1 ? d : 1) : -z * d) + offset / metresPerRepeat;
      out[o * 2 + 1] = ax === 1 ? -z * d : y;
    }
  }
  if (src.length) {
    const grow = (a) => {
      const b = new BufferAttribute2(new a.array.constructor((n0 + src.length) * a.itemSize), a.itemSize, a.normalized);
      for (let j = 0;j < b.count; j++)
        for (let c = 0;c < a.itemSize; c++)
          b.setComponent(j, c, a.getComponent(j < n0 ? j : src[j - n0], c));
      return b;
    };
    for (const k in g.attributes)
      g.setAttribute(k, grow(g.attributes[k]));
    const morph = g.morphAttributes;
    for (const k in morph)
      morph[k] = morph[k].map(grow);
    g.setIndex(idx);
  }
  g.setAttribute("uv", new BufferAttribute2(new Float32Array(out), 2));
  return g;
}
import { Euler, InstancedMesh, Matrix4, PlaneGeometry as PlaneGeometry2, Quaternion as Quaternion2, Vector3 as Vector33 } from "three";
var rng2 = (seed) => () => {
  seed = seed + 1831565813 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
var PI = Math.PI;
var lerp = (a, b, t) => a + (b - a) * t;
function field2(size, { seed = 1, octaves = 4, height = 5, scale = 50, base = 0, basins = [] } = {}) {
  const hash = (i, j) => rng2(Math.imul(i, 73856093) ^ Math.imul(j, 19349663) ^ seed)() * 2 - 1;
  const noise = (x, z) => {
    const i = Math.floor(x), j = Math.floor(z), u = x - i, v2 = z - j, a = u * u * (3 - 2 * u), b = v2 * v2 * (3 - 2 * v2);
    return lerp(lerp(hash(i, j), hash(i + 1, j), a), lerp(hash(i, j + 1), hash(i + 1, j + 1), a), b);
  };
  const smooth = (x, z) => {
    let h = base;
    for (let o = 0, a = height, f = 1 / scale;o < octaves; o++, a /= 2, f *= 2)
      h += noise(x * f, z * f) * a;
    for (const [bx, bz, r, d] of basins)
      h -= d * Math.exp(-((x - bx) ** 2 + (z - bz) ** 2) / (r * r));
    return h;
  };
  let seg = 0, w = size / 2;
  const heightAt = (x, z) => {
    const c = size / seg, u = (x + w) / c, v2 = (z + w) / c;
    if (!(u > 0 && v2 > 0 && u < seg && v2 < seg))
      return smooth(x, z);
    const H = (a, b) => smooth(a * c - w, b * c - w), k = +(u % 1 + v2 % 1 > 1), p = Math.floor(u) + k, q = Math.floor(v2) + k, t = 1 - 2 * k, h = H(p, q);
    return lerp(h, H(p + t, q), Math.abs(u - p)) + (H(p, q + t) - h) * Math.abs(v2 - q);
  };
  const e = 0.1;
  return {
    area: [-w, -w, w, w],
    heightAt,
    normalAt: (x, z) => new Vector33(heightAt(x - e, z) - heightAt(x + e, z), 2 * e, heightAt(x, z - e) - heightAt(x, z + e)).normalize(),
    geometry(segments) {
      const g = new PlaneGeometry2(size, size, segments, segments).rotateX(-PI / 2), p = g.attributes.position;
      for (let i = 0;i < p.count; i++)
        p.setY(i, smooth(p.getX(i), p.getZ(i)));
      g.computeVertexNormals();
      seg = segments;
      return g;
    }
  };
}
function place(n, o = {}) {
  const { on, seed = 1, minHeight = -Infinity, maxHeight = Infinity, maxSlope = 90, avoid, spacing = 0, jitter = 0, edge, scale = [1, 1], rotate, tilt = 0, stretch = 0 } = o;
  const [x0, z0, x1, z1] = o.area ?? on?.area ?? [-10, -10, 10, 10], r = rng2(seed), out = [];
  const at = (k, m, a, b) => lerp(a, b, m > 1 ? (k + d(jitter / 2)) / (m - 1) : 0.5);
  const cos = Math.cos(maxSlope * PI / 180), d = (m) => m && (r() * 2 - 1) * m, T = tilt * PI / 180;
  const add = (x, z) => {
    const y = on ? on.heightAt(x, z) : 0;
    if (y < minHeight || y > maxHeight || on && on.normalAt(x, z).y < cos || avoid?.(x, z) || spacing && out.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < spacing * spacing))
      return;
    out.push({
      x,
      y,
      z,
      ry: rotate === true ? r() * PI * 2 : +(rotate ?? 0),
      s: lerp(scale[0], scale[1], r()),
      rx: d(T),
      rz: d(T),
      sx: 1 + d(stretch),
      sz: 1 + d(stretch)
    });
  };
  if (typeof n === "number") {
    for (let t = 0;out.length < n && t < n * 30; t++)
      add(lerp(x0, x1, r()), lerp(z0, z1, r()));
    if (out.length < n)
      console.error(`place: only ${out.length} of ${n} fit`);
  } else {
    const [nx, nz] = n;
    for (let i = 0;i < nx; i++)
      for (let j = 0;j < nz; j++)
        if (!edge || !(i % (nx - 1)) || !(j % (nz - 1)))
          add(at(i, nx, x0, x1), at(j, nz, z0, z1));
  }
  return out;
}
function instances(geometry, material, points, name) {
  const m = new InstancedMesh(geometry, material, points.length), M = new Matrix4, q = new Quaternion2, E = new Euler, v2 = new Vector33, s = new Vector33;
  points.forEach((p, i) => m.setMatrixAt(i, M.compose(v2.set(p.x, p.y, p.z), q.setFromEuler(E.set(p.rx ?? 0, p.ry, p.rz ?? 0)), s.set(p.s * (p.sx ?? 1), p.s, p.s * (p.sz ?? 1)))));
  m.name = name;
  return m;
}
import { Matrix4 as Matrix42, PerspectiveCamera as PerspectiveCamera2, Vector3 as Vector34 } from "three";
function picture(v2) {
  const [W, H] = v2.size ?? [1, 1], fov = v2.fov ?? 50;
  const camera = new PerspectiveCamera2(fov, W / H, 0.01, 1000);
  camera.position.fromArray(v2.position);
  camera.lookAt(...v2.lookAt ?? [0, 0, 0]);
  camera.updateMatrixWorld();
  const M = camera.matrixWorld.clone(), Mi = new Matrix42().copy(M).invert(), eye = new Vector34().setFromMatrixPosition(M);
  const forward = new Vector34(0, 0, -1).transformDirection(M), f = H / 2 / Math.tan(fov * Math.PI / 360);
  const dir = (px, py) => new Vector34((px - W / 2) / f, (H / 2 - py) / f, -1).transformDirection(M);
  return {
    camera,
    at(px, py, depth) {
      const d = dir(px, py);
      return eye.clone().addScaledVector(d, depth / d.dot(forward));
    },
    ground(px, py, y = 0) {
      const d = dir(px, py), t = (y - eye.y) / d.y;
      return t > 0 ? eye.clone().addScaledVector(d, t) : null;
    },
    px(point) {
      const p = (point instanceof Vector34 ? point.clone() : new Vector34().fromArray(point)).applyMatrix4(Mi);
      return p.z < 0 ? [W / 2 + f * p.x / -p.z, H / 2 - f * p.y / -p.z] : null;
    },
    fit(width, height, cam = camera) {
      cam.aspect = width / height;
      cam.fov = cam.aspect >= W / H ? fov : Math.atan(Math.tan(fov * Math.PI / 360) * (W / H) / cam.aspect) * 360 / Math.PI;
      cam.updateProjectionMatrix();
      return cam;
    }
  };
}
async function bake(object, o = {}) {
  const [{ GLTFExporter }, { clone }] = await Promise.all([import("three/addons/exporters/GLTFExporter.js"), import("three/addons/utils/SkeletonUtils.js")]);
  object.updateWorldMatrix(true, false);
  const root = clone(object);
  object.matrixWorld.decompose(root.position, root.quaternion, root.scale);
  return await new GLTFExporter().parseAsync(root, { binary: true, animations: o.animations ?? [] });
}
var UNREAL_SCRIPT = String.raw`"""Imports a paprika3d handoff GLB (fx.js handoff) into the open Unreal level and applies its manifest.

Written by paprika3d. In the Unreal Editor's Output Log (Python), or through the Unreal MCP's Python tool:
    py "<project>/export/import_unreal.py" [scene.glb] [/Game/Folder]
The GLB defaults to scene.glb beside this file. Prints one JSON line: what was imported, matched and added.
"""
import json, os, re, struct, sys


def read_manifest(path):
    with open(path, "rb") as f:
        magic, _version, _length, json_length, kind = struct.unpack("<4sIIII", f.read(20))
        if magic != b"glTF" or kind != 0x4E4F534A:
            raise ValueError(path + " is not a GLB")
        return json.loads(f.read(json_length)).get("asset", {}).get("extras", {}).get("paprika3d", {})


def main(argv):
    here = os.path.dirname(os.path.abspath(globals().get("__file__", os.path.join(os.getcwd(), "x"))))
    glb = os.path.abspath(argv[0]) if argv else os.path.join(here, "scene.glb")
    dest = argv[1] if len(argv) > 1 else "/Game/" + re.sub(r"[^A-Za-z0-9_]", "_", os.path.splitext(os.path.basename(glb))[0])
    manifest = read_manifest(glb)

    import unreal
    actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    before = set(a.get_path_name() for a in actors.get_all_level_actors())
    manager = unreal.InterchangeManager.get_interchange_manager_scripted()
    params = unreal.ImportAssetParameters()
    params.is_automated = True
    params.replace_existing = True
    ok = manager.import_scene(dest, unreal.InterchangeManager.create_source_data(glb), params)
    manager.wait_until_all_tasks_done(False)
    new = [a for a in actors.get_all_level_actors() if a.get_path_name() not in before]

    names = set(o["name"] for o in manifest.get("objects", []))
    matched = set()
    for a in new:
        label = a.get_actor_label()
        name = label if label in names else re.sub(r"_\d+$", "", label)
        if name in names:
            matched.add(name)
            a.set_editor_property("tags", list(a.get_editor_property("tags")) + [unreal.Name("paprika3d")])

    post, added, problems = manifest.get("post", {}), [], []
    bloom = post.get("bloom")
    exposure = post.get("exposure")
    if bloom or exposure:
        volume = actors.spawn_actor_from_class(unreal.PostProcessVolume, unreal.Vector(0, 0, 0))
        volume.set_actor_label("paprika3d post")
        volume.set_editor_property("unbound", True)
        settings = volume.get_editor_property("settings")
        if bloom:
            settings.set_editor_property("override_bloom_intensity", True)
            settings.set_editor_property("bloom_intensity", float(bloom["strength"]))
            settings.set_editor_property("override_bloom_threshold", True)
            settings.set_editor_property("bloom_threshold", float(bloom["threshold"]))
        volume.set_editor_property("settings", settings)
        added.append("PostProcessVolume (bloom %s; set exposure by eye)" % ("on" if bloom else "off"))
    fog = post.get("fog")
    if fog:
        actor = actors.spawn_actor_from_class(unreal.ExponentialHeightFog, unreal.Vector(0, 0, 0))
        actor.set_actor_label("paprika3d fog")
        try:
            c = fog["color"].lstrip("#")
            colour = unreal.LinearColor(int(c[0:2], 16) / 255.0, int(c[2:4], 16) / 255.0, int(c[4:6], 16) / 255.0, 1.0)
            actor.get_editor_property("component").set_editor_property("fog_inscattering_luminance", colour)
        except Exception as e:
            problems.append("fog colour: %s" % e)
        added.append("ExponentialHeightFog (set its density by eye)")

    unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
    report = {
        "imported": bool(ok), "into": dest, "actors": len(new),
        "matched": len(matched), "missing": sorted(names - matched)[:20],
        "added": added, "problems": problems,
        "rebuild": [d["what"] + ": " + d["unreal"] for d in manifest.get("dropped", [])],
    }
    print("paprika3d " + json.dumps(report))
    return report


if __name__ == "__main__":
    main(sys.argv[1:])
`;

var KIND = (o) => o.isInstancedMesh ? "instanced" : o.isSkinnedMesh ? "skinned" : o.isMesh ? "mesh" : o.isPoints ? "points" : o.isLine ? "line" : o.isSprite ? "sprite" : o.isLight ? "light" : o.isCamera ? "camera" : o.isBone ? "bone" : "group";
var GLTF_MATERIAL = new Set(["MeshStandardMaterial", "MeshPhysicalMaterial", "MeshBasicMaterial"]);
var label = (o, i) => o.name || `${o.type}#${i}`;
async function handoff(root, o = {}) {
  const { REVISION, Material: M } = await import("three");
  const dropped = new Map;
  const drop = (what, where, unreal) => {
    const d = dropped.get(what) ?? dropped.set(what, { where: [], unreal }).get(what);
    if (!d.where.includes(where) && d.where.length < 8)
      d.where.push(where);
  };
  const objects = [];
  let i = 0;
  root.traverse((x) => {
    const name = label(x, i++), kind = KIND(x);
    if (x.name && kind !== "bone")
      objects.push({ name: x.name, kind, ...x.isInstancedMesh && { count: x.count } });
    for (const m of [].concat(x.material ?? [])) {
      if (m.isShaderMaterial || m.isRawShaderMaterial)
        drop("ShaderMaterial (custom GLSL)", name, "rebuild as a Material graph");
      else if (m.isNodeMaterial)
        drop("node material (TSL)", name, "rebuild as a Material graph");
      else if (!GLTF_MATERIAL.has(m.type) && !x.isPoints && !x.isLine && !x.isSprite)
        drop(`${m.type} (approximated as PBR)`, name, "check the imported Material Instance");
      if (m.onBeforeCompile !== M.prototype.onBeforeCompile)
        drop("onBeforeCompile shader edits", name, "rebuild as a Material graph");
    }
    if (x.isPoints || x.isSprite)
      drop("points and sprites (particles)", name, "a Niagara system");
    else if (x.isLine)
      drop("lines", name, "a spline or thin mesh");
    if (x.isHemisphereLight || x.isAmbientLight || x.isLightProbe)
      drop("ambient and hemisphere light", name, "a Sky Light");
    else if (x.isRectAreaLight)
      drop("RectAreaLight", name, "a Rect Light");
    else if ((x.isPointLight || x.isSpotLight) && x.decay !== 2)
      drop("light decay other than 2", name, "set the light's attenuation radius by eye");
    if (x.isMesh && x.morphTargetInfluences && Object.keys(x.geometry?.morphAttributes ?? {}).some((k) => k !== "position" && k !== "normal"))
      drop("morph targets other than position and normal", name, "re-export from a DCC tool");
  });
  const scene = root, post = {};
  if (scene.fog)
    post.fog = { color: "#" + scene.fog.color.getHexString(), ...scene.fog.isFogExp2 ? { density: scene.fog.density } : { near: scene.fog.near, far: scene.fog.far } };
  if (scene.background?.isTexture || scene.environment)
    drop("background and environment map", "scene", "an HDRI Backdrop or Sky Light cubemap");
  if (o.renderer)
    Object.assign(post, { toneMapping: o.renderer.toneMapping, exposure: o.renderer.toneMappingExposure });
  for (const p of (Array.isArray(o.composer) ? o.composer : o.composer?.passes ?? []).filter((p2) => p2.enabled !== false)) {
    const n = p.constructor.name;
    if (n === "RenderPass" || n === "OutputPass")
      continue;
    if (/Bloom/.test(n))
      post.bloom = { strength: p.strength ?? 1, radius: p.radius ?? 0, threshold: p.threshold ?? 0 };
    else
      drop(`${n} (postprocessing)`, "composer", "a PostProcessVolume setting or a post-process Material");
  }
  drop("game code, input, UI, audio and physics", "page", "Blueprints or C++ (the design doc says what each does)");
  const manifest = {
    version: 1,
    three: `r${REVISION}`,
    units: "metres, Y up, as glTF; Unreal's importer converts to centimetres, Z up",
    objects,
    animations: (o.animations ?? []).map((a) => ({ name: a.name, seconds: +a.duration.toFixed(3) })),
    post,
    dropped: [...dropped].map(([what, d]) => ({ what, ...d }))
  };
  const glb = withManifest(await bake(root, { animations: o.animations }), manifest);
  console.log(`handoff: ${objects.length} named objects; dropped: ${manifest.dropped.map((d) => d.what).join("; ")}`);
  return glb;
}
var unrealScript = () => new Blob([UNREAL_SCRIPT], { type: "text/x-python" });
function withManifest(glb, manifest) {
  const view = new DataView(glb), jsonLength = view.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(glb, 20, jsonLength)));
  json.asset.extras = { ...json.asset.extras, paprika3d: manifest };
  let text = JSON.stringify(json);
  text += " ".repeat((4 - new TextEncoder().encode(text).length % 4) % 4);
  const chunk = new TextEncoder().encode(text), rest = new Uint8Array(glb, 20 + jsonLength);
  const out = new Uint8Array(20 + chunk.length + rest.length), ov = new DataView(out.buffer);
  out.set(new Uint8Array(glb, 0, 12));
  ov.setUint32(8, out.length, true);
  ov.setUint32(12, chunk.length, true);
  ov.setUint32(16, 1313821514, true);
  out.set(chunk, 20);
  out.set(rest, 20 + chunk.length);
  return out.buffer;
}
import { Color as Color4, PlaneGeometry as PlaneGeometry3, Shape, Path, Vector2, Vector3 as Vector35 } from "three";
var DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
var ringArea = (p) => p.reduce((s, [x, y], i) => {
  const [u, v2] = p[(i + 1) % p.length];
  return s + x * v2 - u * y;
}, 0) / 2;
function contours(mask, w, h, simplify = 1) {
  const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] > 127;
  const from = [], dir = [], out = new Map, W = w + 1;
  const edge = (vx, vy, d) => {
    const v2 = vy * W + vx;
    from.push(v2);
    dir.push(d);
    (out.get(v2) ?? out.set(v2, []).get(v2)).push(from.length - 1);
  };
  for (let y = 0;y < h; y++)
    for (let x = 0;x < w; x++) {
      if (!on(x, y))
        continue;
      if (!on(x, y - 1))
        edge(x, y, 0);
      if (!on(x + 1, y))
        edge(x + 1, y, 1);
      if (!on(x, y + 1))
        edge(x + 1, y + 1, 2);
      if (!on(x - 1, y))
        edge(x, y + 1, 3);
    }
  const used = new Uint8Array(from.length), rings = [];
  for (let e0 = 0;e0 < from.length; e0++) {
    if (used[e0])
      continue;
    const ring = [];
    let e = e0;
    do {
      used[e] = 1;
      const d = dir[e], v2 = from[e], x = v2 % W + DIRS[d][0], y = Math.floor(v2 / W) + DIRS[d][1];
      ring.push([v2 % W, Math.floor(v2 / W)]);
      const next = out.get(y * W + x).filter((n) => !used[n] || n === e0);
      e = [(d + 1) % 4, d, (d + 3) % 4].map((t) => next.find((n) => dir[n] === t)).find((n) => n !== undefined) ?? e0;
    } while (e !== e0);
    rings.push(simplifyRing(ring.filter((p, i) => {
      const a = ring[(i + ring.length - 1) % ring.length], b = ring[(i + 1) % ring.length];
      return (p[0] - a[0]) * (b[1] - p[1]) !== (p[1] - a[1]) * (b[0] - p[0]);
    }), simplify));
  }
  return rings;
}
function simplifyRing(p, tol) {
  if (tol <= 0 || p.length < 5)
    return p;
  const far = p.reduce((b2, q, i) => Math.hypot(q[0] - p[0][0], q[1] - p[0][1]) > Math.hypot(p[b2][0] - p[0][0], p[b2][1] - p[0][1]) ? i : b2, 0);
  const a = dp(p.slice(0, far + 1), tol), b = dp([...p.slice(far), p[0]], tol);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}
function dp(p, tol) {
  const [ax, ay] = p[0], [bx, by] = p[p.length - 1], len = Math.hypot(bx - ax, by - ay);
  let worst = 0, at = 0;
  for (let i = 1;i < p.length - 1; i++) {
    const [x, y] = p[i], d = len ? Math.abs((bx - ax) * (ay - y) - (ax - x) * (by - ay)) / len : Math.hypot(x - ax, y - ay);
    if (d > worst) {
      worst = d;
      at = i;
    }
  }
  return worst > tol ? [...dp(p.slice(0, at + 1), tol).slice(0, -1), ...dp(p.slice(at), tol)] : [p[0], p[p.length - 1]];
}
var inside = ([x, y], p) => {
  let r = false;
  for (let i = 0, j = p.length - 1;i < p.length; j = i++)
    if (p[i][1] > y !== p[j][1] > y && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0])
      r = !r;
  return r;
};
function shapesOf(rings, { scale = 1, flipY = true } = {}) {
  const v2 = (p) => p.map(([x, y]) => new Vector2(x * scale, (flipY ? -y : y) * scale));
  const outer = rings.filter((r) => ringArea(r) > 0).sort((a, b) => ringArea(a) - ringArea(b)), shapes = outer.map((r) => new Shape(v2(r)));
  for (const hole of rings.filter((r) => ringArea(r) < 0)) {
    const mid = [(hole[0][0] + hole[1][0]) / 2, (hole[0][1] + hole[1][1]) / 2], i = outer.findIndex((o) => inside(mid, o));
    if (i >= 0)
      shapes[i].holes.push(new Path(v2(hole)));
  }
  return shapes;
}
async function pixels(src) {
  let img = src;
  if (typeof src === "string") {
    const i = new Image;
    i.crossOrigin = "anonymous";
    i.src = src;
    await i.decode();
    img = i;
  }
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d", { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  return { data: x.getImageData(0, 0, w, h).data, w, h };
}
async function trace(src, { colour, tolerance = 40, invert = false, simplify = 1, minArea = 4, scale = 1 } = {}) {
  const { data, w, h } = await pixels(src), at = (i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
  let ref, match;
  if (colour !== undefined) {
    const hex = new Color4(colour).getHex();
    ref = [hex >> 16, hex >> 8 & 255, hex & 255];
    match = true;
  } else {
    const corners = [0, w - 1, (h - 1) * w, h * w - 1].map(at), key = (c) => c.join();
    ref = corners.reduce((b, c) => corners.filter((d) => key(d) === key(c)).length > corners.filter((d) => key(d) === key(b)).length ? c : b);
    match = false;
  }
  const mask = new Uint8Array(w * h), m = document.createElement("canvas");
  m.width = w;
  m.height = h;
  const mc = m.getContext("2d"), md = mc.createImageData(w, h);
  for (let i = 0;i < w * h; i++) {
    const [r, g, b] = at(i), near = Math.hypot(r - ref[0], g - ref[1], b - ref[2]) <= tolerance;
    mask[i] = near === match !== invert ? 255 : 0;
    md.data.fill(mask[i], i * 4, i * 4 + 3);
    md.data[i * 4 + 3] = 255;
  }
  mc.putImageData(md, 0, 0);
  const rings = contours(mask, w, h, simplify).filter((r) => Math.abs(ringArea(r)) >= minArea);
  return { shapes: shapesOf(rings, { scale }), mask: m, width: w, height: h };
}
async function heightfield(src, opts) {
  return heightsOf(await pixels(src), opts);
}
function heightsOf({ data, w, h }, { size, height, base = 0 }) {
  const depth = size * h / w, hx = size / 2, hz = depth / 2;
  const H = (i, j) => {
    const k = (Math.min(h - 1, Math.max(0, j)) * w + Math.min(w - 1, Math.max(0, i))) * 4;
    return base + height * (0.2126 * data[k] + 0.7152 * data[k + 1] + 0.0722 * data[k + 2]) / 255;
  };
  const smooth = (x, z) => {
    const u = Math.min(w - 1, Math.max(0, (x + hx) / size * (w - 1))), v2 = Math.min(h - 1, Math.max(0, (z + hz) / depth * (h - 1)));
    const i = Math.floor(u), j = Math.floor(v2), a = u - i, b = v2 - j;
    return (H(i, j) * (1 - a) + H(i + 1, j) * a) * (1 - b) + (H(i, j + 1) * (1 - a) + H(i + 1, j + 1) * a) * b;
  };
  let sx = 0, sz = 0;
  const heightAt = (x, z) => {
    const cx = size / sx, cz = depth / sz, u = (x + hx) / cx, v2 = (z + hz) / cz;
    if (!(u > 0 && v2 > 0 && u < sx && v2 < sz))
      return smooth(x, z);
    const M = (a, b) => smooth(a * cx - hx, b * cz - hz), k = +(u % 1 + v2 % 1 > 1), p = Math.floor(u) + k, q = Math.floor(v2) + k, t = 1 - 2 * k, m = M(p, q);
    return m + (M(p + t, q) - m) * Math.abs(u - p) + (M(p, q + t) - m) * Math.abs(v2 - q);
  };
  const e = size / w;
  return {
    area: [-hx, -hz, hx, hz],
    heightAt,
    normalAt: (x, z) => new Vector35(heightAt(x - e, z) - heightAt(x + e, z), 2 * e, heightAt(x, z - e) - heightAt(x, z + e)).normalize(),
    geometry(segments) {
      const rows = Math.max(1, Math.round(segments * h / w));
      const g = new PlaneGeometry3(size, depth, segments, rows).rotateX(-Math.PI / 2), p = g.attributes.position;
      for (let i = 0;i < p.count; i++)
        p.setY(i, smooth(p.getX(i), p.getZ(i)));
      g.computeVertexNormals();
      sx = segments;
      sz = rows;
      return g;
    }
  };
}
import * as THREE2 from "three";
import { Color as Color5, DataTexture, DataUtils, HalfFloatType, LinearFilter, Mesh as Mesh2, MeshStandardMaterial as MeshStandardMaterial2, PlaneGeometry as PlaneGeometry4, RedFormat, RGFormat, Vector3 as Vector36 } from "three";

var CARRY = [
  "name",
  "color",
  "roughness",
  "metalness",
  "map",
  "emissive",
  "emissiveIntensity",
  "envMap",
  "envMapIntensity",
  "side",
  "transparent",
  "opacity",
  "alphaTest",
  "depthTest",
  "depthWrite",
  "visible",
  "wireframe",
  "flatShading"
];
var tsl;
var loadTSL = () => tsl ??= import("three/webgpu").then((m) => m.TSL ?? m).catch(() => import("three/tsl")).catch(() => {
  console.error(`fx: this WebGPU page's "three" is three.module.js and its import map has neither "three/webgpu" nor "three/tsl", so water() and foliage() keep their WebGL shaders, which WebGPURenderer draws flat; map "three/webgpu" (or "three") to three.webgpu.js`);
  return null;
});
var ownNodes = (THREE2) => THREE2.MeshStandardNodeMaterial && THREE2.TSL ? { NodeMaterial: THREE2.MeshStandardNodeMaterial, T: THREE2.TSL } : null;
function nodesOnWebGPU(mesh, build) {
  const before = mesh.onBeforeRender;
  mesh.onBeforeRender = function(renderer, ...rest) {
    mesh.onBeforeRender = before;
    before.call(this, renderer, ...rest);
    if (!renderer?.isWebGPURenderer)
      return;
    const swap = loadTSL().then((T) => {
      if (!T)
        return;
      const NodeMaterial = renderer.library?.getMaterialNodeClass?.("MeshStandardMaterial") ?? T.MeshStandardNodeMaterial;
      const old = mesh.material, next = build(NodeMaterial, T, old);
      const o = old;
      next.setValues(Object.fromEntries(CARRY.filter((k) => o[k] !== undefined && (k in next)).map((k) => [k, o[k]])));
      mesh.material = next;
      old.dispose();
    });
    globalThis.__clock?.hold?.(swap);
  };
}

var PRESETS = {
  pond: { wavelength: 4, amplitude: 0.02, waves: 8, choppy: 0.2, spread: 1.4, color: 4029038, deep: 1455407, foam: null },
  lake: { wavelength: 18, amplitude: 0.12, waves: 12, choppy: 0.35, spread: 1.1, color: 3108746, deep: 995140, foam: null },
  ocean: { wavelength: 80, amplitude: 0.7, waves: 20, choppy: 0.5, spread: 0.95, color: 2783894, deep: 402490, foam: 15267064 },
  storm: { wavelength: 120, amplitude: 2.4, waves: 24, choppy: 0.85, spread: 0.8, color: 4020838, deep: 727586, foam: 14674154 }
};
var RIPPLES = 16;
var GLSL = `
uniform float uTime;
uniform vec4 uWaveA[WAVES]; // direction x, z, wavenumber k, amplitude A
uniform vec4 uWaveB[WAVES]; // angular speed, phase, steepness Q, the share of A the grid can draw
uniform vec4 uGust[11];     // direction x, z, k, phase: three waves for the swell's groups, three for the ripples' gusts,
                            // four that bend the crests (x by two, z by two), and the bend in metres
float fxField(int j, vec2 p) {
  float g = 0.0;
  for (int i = j; i < j + 3; i++) g += sin(uGust[i].z * dot(uGust[i].xy, p) + uGust[i].w + uTime * 0.02);
  return smoothstep(-1.5, 1.5, g);
}
float fxSin(int i, vec2 p) { return sin(uGust[i].z * dot(uGust[i].xy, p) + uGust[i].w); }
vec2 fxBent(vec2 p) { return p + uGust[10].x * vec2(fxSin(6, p) + fxSin(7, p), fxSin(8, p) + fxSin(9, p)); }
vec3 fxDisplace(vec2 p) {
  vec3 d = vec3(0.0); float e = 0.25 + 0.75 * fxField(0, p); vec2 w = fxBent(p);
  for (int i = 0; i < WAVES; i++) {
    vec4 a = uWaveA[i]; vec4 b = uWaveB[i];
    float arg = a.z * dot(a.xy, w) + uTime * b.x + b.y, c = cos(arg), h = a.w * b.w;
    d += vec3(b.z * h * a.x * c, h * sin(arg), b.z * h * a.y * c);
  }
  return d * e;
}
#ifdef FX_FLOW
uniform vec2 uFlowV;
uniform sampler2D uFlow;
uniform float uFlowSize;
// the pattern's rest points a and b under the current, and b's share: a uniform current shifts it by its distance run;
// a varying one keeps two copies advected for FLOW_T seconds each, half a period apart, each fading out as it restarts
void fxFlow(vec2 p, out vec2 a, out vec2 b, out float wb) {
#ifdef FX_FLOW_MAP
  vec2 v = textureLod(uFlow, vec2(p.x / uFlowSize + 0.5, 0.5 - p.y / uFlowSize), 0.0).rg;
  float ph = uTime / FLOW_T + fxField(3, p), f0 = fract(ph), f1 = fract(ph + 0.5);
  a = p - v * (f0 * FLOW_T); b = p - v * (f1 * FLOW_T); wb = abs(1.0 - 2.0 * f0);
#else
  a = p - uFlowV * uTime; b = a; wb = 0.0;
#endif
}
#endif
vec3 fxDisplaceAt(vec2 p) {
#ifdef FX_FLOW
  vec2 a, b; float wb; fxFlow(p, a, b, wb);
#ifdef FX_FLOW_MAP
  return mix(fxDisplace(a), fxDisplace(b), wb);
#else
  return fxDisplace(a);
#endif
#else
  return fxDisplace(p);
#endif
}
`;
var GLSL_SURFACE = `
uniform vec4 uRipA[${RIPPLES}];
uniform vec4 uRipB[${RIPPLES}];
float fxFade(float k, float fp) { return 1.0 - smoothstep(0.12, 0.45, fp * k * 0.15915); }
void fxSurface(vec2 p, float fp, out vec3 nrm, out float fold, out float h, out float lost) {
  nrm = vec3(0.0, 1.0, 0.0); h = 0.0; lost = 0.0;
  float jxx = 1.0, jzz = 1.0, jxz = 0.0, e = 0.25 + 0.75 * fxField(0, p), g = 0.2 + 0.8 * fxField(3, p);
  vec2 w = fxBent(p);
  for (int i = 0; i < WAVES; i++) {
    vec4 a = uWaveA[i]; vec4 b = uWaveB[i];
    float arg = a.z * dot(a.xy, w) + uTime * b.x + b.y, s = sin(arg), c = cos(arg), f = fxFade(a.z, fp), ka = a.z * a.w * e * f;
    h += a.w * e * f * s;
    nrm -= vec3(a.x * ka * c, b.z * ka * s, a.y * ka * c);
    jxx -= b.z * a.x * a.x * ka * s; jzz -= b.z * a.y * a.y * ka * s; jxz -= b.z * a.x * a.y * ka * s;
    lost += a.z * a.z * a.w * a.w * e * e * (1.0 - f * f);
  }
  for (int i = 0; i < ${RIPPLES}; i++) {
    vec4 a = uRipA[i]; vec4 b = uRipB[i];
    float f = fxFade(a.z, fp), ka = a.z * a.w * g;
    nrm.xz -= a.xy * (ka * f * cos(a.z * dot(a.xy, p) + uTime * b.x + b.y));
    lost += ka * ka * (1.0 - f * f);
  }
  nrm = normalize(nrm); fold = jxx * jzz - jxz * jxz; lost *= 0.5;
}
void fxSurfaceAt(vec2 p, float fp, out vec3 nrm, out float fold, out float h, out float lost) {
#ifdef FX_FLOW
  vec2 a, b; float wb; fxFlow(p, a, b, wb);
  fxSurface(a, fp, nrm, fold, h, lost);
#ifdef FX_FLOW_MAP
  vec3 n2; float f2, h2, l2; fxSurface(b, fp, n2, f2, h2, l2);
  nrm = normalize(mix(nrm, n2, wb)); fold = mix(fold, f2, wb); h = mix(h, h2, wb); lost = mix(lost, l2, wb);
#endif
#else
  fxSurface(p, fp, nrm, fold, h, lost);
#endif
}
`;
function water(options = {}) {
  const o = { size: 200, segments: 160, speed: 1, wind: [1, 0.55], seed: 1, ...PRESETS.ocean, ...PRESETS[options.preset ?? "ocean"], ...options };
  const n = Math.max(1, Math.min(32, Math.round(o.waves)));
  const r = tex.rng(o.seed), base = Math.atan2(o.wind[1], o.wind[0]), cell = o.size / Math.max(1, o.segments);
  const A = [], B = [], S2 = { R: [], RB: [], G: [] };
  let k = 2 * Math.PI / o.wavelength, amp = o.amplitude;
  for (let i = 0;i < n; i++) {
    const side = (i * 0.618034 + r() * 0.25) % 1 * 2 - 1;
    const angle = base + side * o.spread * (1 + 0.6 * i / Math.max(n - 1, 1)), kk = k * (0.9 + 0.2 * r()), a2 = amp * (0.85 + 0.3 * r());
    A.push(Math.cos(angle), Math.sin(angle), kk, a2);
    B.push(Math.sqrt(9.81 * kk) * o.speed, r() * 2 * Math.PI, o.choppy / Math.max(kk * a2 * n, 0.001), drawn(kk, cell));
    k *= 1.19;
    amp *= 0.82;
  }
  let slope = A[(n - 1) * 4 + 2] * A[(n - 1) * 4 + 3];
  for (let i = 0;i < RIPPLES; i++) {
    const angle = base + (r() * 2 - 1) * Math.min(2.6, o.spread * 2), kk = k * (0.9 + 0.2 * r());
    S2.R.push(Math.cos(angle), Math.sin(angle), kk, slope / kk);
    S2.RB.push(Math.sqrt(9.81 * kk) * o.speed, r() * 2 * Math.PI, 0, 0);
    k *= 1.23;
    slope *= 0.92;
  }
  for (const m of [5.3, 8.9, 13.7, 3.1, 4.7, 7.3, 3.7, 5.9, 4.3, 6.1]) {
    const angle = r() * 2 * Math.PI;
    S2.G.push(Math.cos(angle), Math.sin(angle), 2 * Math.PI / (o.wavelength * m), r() * 2 * Math.PI);
  }
  S2.G.push(o.wavelength * 0.22, 0, 0, 0);
  const shore = o.shore ? shoreOf(o.shore, o) : undefined;
  const flow = o.flow ? flowOf(o.flow, o.size) : undefined;
  const own = ownNodes(THREE2);
  const material = own ? nodeWater(own.NodeMaterial, own.T, n, A, B, S2, o, shore, flow) : glslWater(n, A, B, S2, o, shore, flow);
  const mesh = new Mesh2(new PlaneGeometry4(o.size, o.size, o.segments, o.segments).rotateX(-Math.PI / 2), material);
  if (shore?.bake) {
    const bake2 = shore.bake, before = mesh.onBeforeRender;
    let at = "";
    const rebake = () => {
      const e = mesh.matrixWorld.elements, key = `${e[12]},${e[13]},${e[14]}`;
      if (key !== at) {
        at = key;
        bake2(e[12], e[13], e[14]);
      }
    };
    rebake();
    mesh.onBeforeRender = function(...args) {
      rebake();
      before.apply(this, args);
    };
  }
  let fx = NaN, fy = NaN, fz = NaN;
  const syncFlow = () => {
    const q = mesh.position;
    if (flow?.bake && (q.x !== fx || q.y !== fy || q.z !== fz)) {
      fx = q.x;
      fy = q.y;
      fz = q.z;
      flow.bake(fx, fy, fz);
    }
  };
  if (flow?.bake) {
    syncFlow();
    const before = mesh.onBeforeRender;
    mesh.onBeforeRender = function(...args) {
      syncFlow();
      before.apply(this, args);
    };
  }
  mesh.name = "water";
  mesh.receiveShadow = true;
  mesh.time = 0;
  mesh.frustumCulled = false;
  if (!own)
    nodesOnWebGPU(mesh, (NodeMaterial, T, old) => {
      const m = nodeWater(NodeMaterial, T, n, A, B, S2, o, shore, flow);
      m.userData.fxTime.value = old.userData.fxTime.value;
      return m;
    });
  const s = { dx: 0, dy: 0, dz: 0, nx: 0, ny: 1, nz: 0 };
  const fieldAt = (j, x, z, t) => {
    let g = 0;
    for (let i = j;i < j + 3; i++)
      g += Math.sin(S2.G[i * 4 + 2] * (S2.G[i * 4] * x + S2.G[i * 4 + 1] * z) + S2.G[i * 4 + 3] + t * 0.02);
    return smooth((g + 1.5) / 3);
  };
  const wave = (x, z, t) => {
    let dx = 0, dy = 0, dz = 0, nx = 0, ny = 1, nz = 0;
    const e = 0.25 + 0.75 * fieldAt(0, x, z, t), G = S2.G, bend = (i) => Math.sin(G[i * 4 + 2] * (G[i * 4] * x + G[i * 4 + 1] * z) + G[i * 4 + 3]);
    const wx = x + G[40] * (bend(6) + bend(7)), wz = z + G[40] * (bend(8) + bend(9));
    for (let i = 0;i < n; i++) {
      const ax = A[i * 4], az = A[i * 4 + 1], kk = A[i * 4 + 2], a2 = A[i * 4 + 3], q = B[i * 4 + 2], h = a2 * e * B[i * 4 + 3];
      const arg = kk * (ax * wx + az * wz) + t * B[i * 4] + B[i * 4 + 1], sn = Math.sin(arg), c = Math.cos(arg), ka = kk * a2 * e;
      dx += q * h * ax * c;
      dy += h * sn;
      dz += q * h * az * c;
      nx -= ax * ka * c;
      ny -= q * ka * sn;
      nz -= az * ka * c;
    }
    Object.assign(s, { dx, dy, dz, nx, ny, nz });
    return s;
  };
  const a = { ...s };
  const sample = (x, z, t) => {
    if (!flow)
      return wave(x, z, t);
    if (flow.v)
      return wave(x - flow.v[0] * t, z - flow.v[1] * t, t);
    const [vx, vz] = flow.at(x, z), ph = t / FLOW_T + fieldAt(3, x, z, t), f0 = ph - Math.floor(ph), f1 = ph + 0.5 - Math.floor(ph + 0.5), wb = Math.abs(1 - 2 * f0);
    Object.assign(a, wave(x - vx * f0 * FLOW_T, z - vz * f0 * FLOW_T, t));
    wave(x - vx * f1 * FLOW_T, z - vz * f1 * FLOW_T, t);
    for (const k2 of ["dx", "dy", "dz", "nx", "ny", "nz"])
      s[k2] = a[k2] + (s[k2] - a[k2]) * wb;
    return s;
  };
  const surface = (x, z, t) => {
    syncFlow();
    const lx = x - mesh.position.x, lz = z - mesh.position.z;
    let rx = lx, rz = lz;
    for (let i = 0;i < 4; i++) {
      sample(rx, rz, t);
      rx = lx - s.dx;
      rz = lz - s.dz;
    }
    return sample(rx, rz, t);
  };
  mesh.update = (t) => {
    mesh.time = t;
    mesh.material.userData.fxTime.value = t;
  };
  mesh.height = (x, z, t = mesh.time) => mesh.position.y + surface(x, z, t).dy;
  mesh.normal = (x, z, t = mesh.time, out = new Vector36) => {
    const w = surface(x, z, t);
    return out.set(w.nx, w.ny, w.nz).normalize();
  };
  mesh.current = (x, z) => {
    if (!flow)
      return [0, 0];
    syncFlow();
    return flow.at(x - mesh.position.x, z - mesh.position.z);
  };
  const floated = new WeakMap;
  mesh.float = (object, lift = 0, t = mesh.time, drift = 1) => {
    const p = object.position, t0 = floated.get(object);
    if (flow && drift && t0 !== undefined && t > t0) {
      const steps = Math.min(64, Math.ceil((t - t0) * 30)), dt = (t - t0) / steps * drift;
      for (let i = 0;i < steps; i++) {
        const [ux, uz] = mesh.current(p.x, p.z), [vx, vz] = mesh.current(p.x + ux * dt / 2, p.z + uz * dt / 2);
        p.x += vx * dt;
        p.z += vz * dt;
      }
    }
    floated.set(object, t);
    return p.y = mesh.height(p.x, p.z, t) + lift;
  };
  return mesh;
}
var smooth = (x) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
var drawn = (k, cell) => smooth((2 * Math.PI / k / cell - 3) / 3);
function shoreOf(src, o) {
  const { amplitude: amp, size } = o;
  const look = {
    size,
    depth: o.shoreDepth ?? Math.max(1.5, amp * 4),
    foam: o.shoreFoam ?? Math.max(0.15, amp * 0.8),
    shallow: o.shallow != null ? new Color5(o.shallow) : new Color5(o.color).lerp(new Color5(9428690), 0.5),
    foamColor: new Color5(o.foam ?? 15923192)
  };
  if (src.isTexture)
    return { map: src, ...look };
  const at = typeof src === "function" ? src : (x, z) => src.heightAt(x, z);
  const N = Math.min(512, Math.max(64, Math.ceil(size * 2))), data = new Uint16Array(N * N);
  const map = new DataTexture(data, N, N, RedFormat, HalfFloatType);
  map.magFilter = map.minFilter = LinearFilter;
  const bake2 = (x0, y0, z0) => {
    for (let j = 0;j < N; j++)
      for (let i = 0;i < N; i++)
        data[j * N + i] = DataUtils.toHalfFloat(at(x0 + ((i + 0.5) / N - 0.5) * size, z0 + (0.5 - (j + 0.5) / N) * size) - y0);
    map.needsUpdate = true;
  };
  return { map, ...look, bake: bake2 };
}
var FLOW_T = 2;
function flowOf(src, size) {
  if (Array.isArray(src))
    return src[0] || src[1] ? { v: [src[0], src[1]], size, at: () => [src[0], src[1]] } : undefined;
  let W, H, ch, read, map, bake2;
  if (src.isTexture) {
    map = src;
    const img = map.image, d = img?.data;
    if (!img || !d)
      throw new Error("water: a flow texture must be a DataTexture (red vx, green vz in m/s), so float() and current() can read it");
    W = img.width;
    H = img.height;
    ch = Math.round(d.length / (W * H));
    read = map.type === HalfFloatType ? (i) => DataUtils.fromHalfFloat(d[i]) : (i) => d[i];
  } else {
    const at = "along" in src ? along(src.along, src.speed ?? 1.5) : src;
    W = H = Math.min(256, Math.max(32, Math.ceil(size)));
    ch = 2;
    const data = new Uint16Array(W * H * 2), f = new Float32Array(W * H * 2);
    map = new DataTexture(data, W, H, RGFormat, HalfFloatType);
    map.magFilter = map.minFilter = LinearFilter;
    read = (i) => f[i];
    bake2 = (x0, _y0, z0) => {
      for (let j = 0;j < H; j++)
        for (let i = 0;i < W; i++) {
          const v2 = at(x0 + ((i + 0.5) / W - 0.5) * size, z0 + (0.5 - (j + 0.5) / H) * size), k = (j * W + i) * 2;
          for (let c = 0;c < 2; c++) {
            data[k + c] = DataUtils.toHalfFloat(v2[c]);
            f[k + c] = DataUtils.fromHalfFloat(data[k + c]);
          }
        }
      map.needsUpdate = true;
    };
  }
  const texel = (i, j, c) => read((Math.min(H - 1, Math.max(0, j)) * W + Math.min(W - 1, Math.max(0, i))) * ch + c);
  return {
    map,
    size,
    bake: bake2,
    at: (x, z) => {
      const u = (x / size + 0.5) * W - 0.5, v2 = (0.5 - z / size) * H - 0.5, i = Math.floor(u), j = Math.floor(v2), fu = u - i, fv = v2 - j;
      const one = (c) => (texel(i, j, c) * (1 - fu) + texel(i + 1, j, c) * fu) * (1 - fv) + (texel(i, j + 1, c) * (1 - fu) + texel(i + 1, j + 1, c) * fu) * fv;
      return [one(0), one(1)];
    }
  };
}
function along(curve, speed) {
  const pts = curve.getSpacedPoints(256).map((p) => [p.x, p.z ?? p.y]);
  return (x, z) => {
    let best = Infinity, tx = 1, tz = 0;
    for (let i = 0;i + 1 < pts.length; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], ex = bx - ax, ez = bz - az, l2 = ex * ex + ez * ez || 0.000000000001;
      const t = Math.min(1, Math.max(0, ((x - ax) * ex + (z - az) * ez) / l2)), dx = ax + ex * t - x, dz = az + ez * t - z, d = dx * dx + dz * dz;
      if (d < best) {
        best = d;
        const l = Math.sqrt(l2);
        tx = ex / l;
        tz = ez / l;
      }
    }
    return [tx * speed, tz * speed];
  };
}
function glslWater(n, A, B, S2, o, shore, flow) {
  const uniforms = {
    uTime: { value: 0 },
    uWaveA: { value: A },
    uWaveB: { value: B },
    uRipA: { value: S2.R },
    uRipB: { value: S2.RB },
    uGust: { value: S2.G },
    uDeep: { value: new Color5(o.deep) },
    uFoam: { value: new Color5(o.foam ?? 16777215) },
    uAmp: { value: o.amplitude },
    uShore: { value: shore?.map ?? null },
    uShoreK: { value: new Vector36(shore?.size ?? 1, shore?.depth ?? 1, Math.max(shore?.foam ?? 1, 0.001)) },
    uShallow: { value: shore?.shallow ?? new Color5 },
    uShoreFoam: { value: shore?.foamColor ?? new Color5 },
    uFlowV: { value: flow?.v ? { x: flow.v[0], y: flow.v[1], isVector2: true } : { x: 0, y: 0, isVector2: true } },
    uFlow: { value: flow?.map ?? null },
    uFlowSize: { value: flow?.size ?? 1 }
  };
  const material = new MeshStandardMaterial2({ color: o.color, roughness: 0.12, metalness: 0, ...o.material });
  const shoreFoam = !!shore && shore.foam > 0;
  material.defines = {
    ...material.defines,
    WAVES: n,
    ...o.foam == null ? {} : { FX_FOAM: 1 },
    ...shore ? { FX_SHORE: 1 } : {},
    ...shoreFoam ? { FX_SHORE_FOAM: 1 } : {},
    ...flow ? { FX_FLOW: 1, FLOW_T: FLOW_T.toFixed(1) } : {},
    ...flow?.map ? { FX_FLOW_MAP: 1 } : {}
  };
  material.userData.fxTime = uniforms.uTime;
  material.customProgramCacheKey = () => `fx-water-${n}-${o.foam == null ? 0 : 1}-${shore ? 1 : 0}${shoreFoam ? 1 : 0}-${flow ? flow.map ? 2 : 1 : 0}`;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
${GLSL}varying vec2 vRest;
varying vec2 vDrawn;
varying float vHeight;`).replace("#include <beginnormal_vertex>", `vec3 fxDisp = fxDisplaceAt(position.xz), objectNormal = vec3(0.0, 1.0, 0.0);
vRest = position.xz; vDrawn = position.xz + fxDisp.xz; vHeight = fxDisp.y;`).replace("#include <begin_vertex>", "vec3 transformed = position + fxDisp;");
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
${GLSL}${GLSL_SURFACE}uniform vec3 uDeep;
uniform vec3 uFoam;
uniform float uAmp;
uniform sampler2D uShore;
uniform vec3 uShoreK;
uniform vec3 uShallow;
uniform vec3 uShoreFoam;
varying vec2 vRest;
varying vec2 vDrawn;
varying float vHeight;`).replace("#include <color_fragment>", `#include <color_fragment>
vec3 fxN; float fxFold, fxH, fxLost; fxSurfaceAt(vRest, length(fwidth(vRest)), fxN, fxFold, fxH, fxLost);
diffuseColor.rgb = mix(uDeep, diffuseColor.rgb, 0.25 + 0.75 * smoothstep(-1.6 * uAmp, 1.6 * uAmp, fxH));
#ifdef FX_FOAM
diffuseColor.rgb = mix(diffuseColor.rgb, uFoam, smoothstep(0.55, 0.15, fxFold) * 0.85);
#endif
#ifdef FX_SHORE
float fxDepth = vHeight - texture(uShore, vec2(vDrawn.x / uShoreK.x + 0.5, 0.5 - vDrawn.y / uShoreK.x)).r;
diffuseColor.rgb = mix(diffuseColor.rgb, uShallow, 1.0 - smoothstep(0.0, uShoreK.y, fxDepth));
#ifdef FX_SHORE_FOAM
float fxLine = 1.0 - smoothstep(0.0, uShoreK.z, fxDepth);
diffuseColor.rgb = mix(diffuseColor.rgb, uShoreFoam, clamp(fxLine * (0.65 + 0.35 * sin(fxDepth / uShoreK.z * 9.0 - uTime * 1.7)), 0.0, 1.0) * 0.9);
#endif
#endif`).replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
roughnessFactor = sqrt(sqrt(pow(roughnessFactor, 4.0) + 2.0 * fxLost));`).replace("#include <normal_fragment_begin>", `float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
vec3 normal = normalize(mat3(viewMatrix) * fxN) * faceDirection;
vec3 nonPerturbedNormal = normal;`);
  };
  return material;
}
function nodeWater(NodeMaterial, T, n, A, B, S2, o, shore, flow) {
  const { Fn, uniform, vec2, vec3, vec4, float, sin, cos, mix, smoothstep, varying, texture, fwidth, sqrt, materialRoughness, positionGeometry, transformNormalToView, faceDirection, materialColor, materialOpacity, color } = T;
  const time = uniform(0);
  const bend = (p) => {
    const one = (i) => sin(p.x.mul(S2.G[i * 4 + 2] * S2.G[i * 4]).add(p.y.mul(S2.G[i * 4 + 2] * S2.G[i * 4 + 1])).add(S2.G[i * 4 + 3]));
    return p.add(vec2(one(6).add(one(7)), one(8).add(one(9))).mul(S2.G[40])).toVar();
  };
  const terms = (q, each) => {
    const p = bend(q);
    for (let i = 0;i < n; i++) {
      const ax = A[i * 4], az = A[i * 4 + 1], k = A[i * 4 + 2];
      const arg = p.x.mul(k * ax).add(p.y.mul(k * az)).add(time.mul(B[i * 4])).add(B[i * 4 + 1]).toVar();
      each(ax, az, k, A[i * 4 + 3], B[i * 4 + 2], B[i * 4 + 3], sin(arg).toVar(), cos(arg).toVar());
    }
  };
  const field3 = (p, j) => {
    let g = float(0);
    for (let i = j;i < j + 3; i++) {
      const G = S2.G.slice(i * 4, i * 4 + 4);
      g = g.add(sin(p.x.mul(G[2] * G[0]).add(p.y.mul(G[2] * G[1])).add(G[3]).add(time.mul(0.02))));
    }
    return smoothstep(-1.5, 1.5, g);
  };
  const flowed = (p, at) => {
    if (!flow)
      return at(p);
    if (flow.v)
      return at(p.sub(vec2(flow.v[0], flow.v[1]).mul(time)));
    const v2 = texture(flow.map, vec2(p.x.div(flow.size).add(0.5), float(0.5).sub(p.y.div(flow.size)))).level(0).rg.toVar();
    const ph = time.div(FLOW_T).add(field3(p, 3)).toVar(), f0 = ph.fract().toVar(), f1 = ph.add(0.5).fract();
    return mix(at(p.sub(v2.mul(f0.mul(FLOW_T)))), at(p.sub(v2.mul(f1.mul(FLOW_T)))), float(1).sub(f0.mul(2)).abs());
  };
  const fade = (k, fp2) => float(1).sub(smoothstep(0.12, 0.45, fp2.mul(k / (2 * Math.PI)))).toVar();
  const displace = Fn(([p]) => {
    const d = vec3(0).toVar();
    terms(p, (ax, az, _k, a, q, g, s, c2) => {
      if (g > 0)
        d.addAssign(vec3(c2.mul(q * a * g * ax), s.mul(a * g), c2.mul(q * a * g * az)));
    });
    return d.mul(field3(p, 0).mul(0.75).add(0.25));
  });
  const surface = Fn(([p, fp2]) => {
    const nrm = vec3(0, 1, 0).toVar(), jxx = float(1).toVar(), jzz = float(1).toVar(), jxz = float(0).toVar();
    const e = field3(p, 0).mul(0.75).add(0.25).toVar(), gust = field3(p, 3).mul(0.8).add(0.2).toVar();
    terms(p, (ax, az, k, a, q, _g, s, c2) => {
      const ka = fade(k, fp2).mul(e).mul(k * a);
      nrm.subAssign(vec3(c2.mul(ka).mul(ax), s.mul(ka).mul(q), c2.mul(ka).mul(az)));
      jxx.subAssign(s.mul(ka).mul(q * ax * ax));
      jzz.subAssign(s.mul(ka).mul(q * az * az));
      jxz.subAssign(s.mul(ka).mul(q * ax * az));
    });
    for (let i = 0;i < RIPPLES; i++) {
      const ax = S2.R[i * 4], az = S2.R[i * 4 + 1], k = S2.R[i * 4 + 2], a = S2.R[i * 4 + 3];
      const c2 = cos(p.x.mul(k * ax).add(p.y.mul(k * az)).add(time.mul(S2.RB[i * 4])).add(S2.RB[i * 4 + 1])).mul(fade(k, fp2)).mul(gust).mul(k * a);
      nrm.subAssign(vec3(c2.mul(ax), 0, c2.mul(az)));
    }
    return vec4(nrm.normalize(), jxx.mul(jzz).sub(jxz.mul(jxz)));
  });
  const tone = Fn(([p, fp2]) => {
    const h2 = float(0).toVar(), lost = float(0).toVar();
    const e = field3(p, 0).mul(0.75).add(0.25).toVar(), gust = field3(p, 3).mul(0.8).add(0.2).toVar();
    terms(p, (_ax, _az, k, a, _q, _g, s) => {
      const f = fade(k, fp2);
      h2.addAssign(s.mul(f).mul(e).mul(a));
      lost.addAssign(float(1).sub(f.mul(f)).mul(e.mul(e)).mul(k * a * k * a));
    });
    for (let i = 0;i < RIPPLES; i++) {
      const k = S2.R[i * 4 + 2], f = fade(k, fp2);
      lost.addAssign(float(1).sub(f.mul(f)).mul(gust.mul(gust)).mul((k * S2.R[i * 4 + 3]) ** 2));
    }
    return vec2(h2, lost.mul(0.5));
  });
  const material = new NodeMaterial({ color: o.color, roughness: 0.12, metalness: 0, ...o.material });
  const rest = varying(positionGeometry.xz), fp = fwidth(rest).length();
  const disp = flowed(positionGeometry.xz, displace).toVar(), w = flowed(rest, (q) => surface(q, fp)), tn = flowed(rest, (q) => tone(q, fp)), amp = o.amplitude;
  material.positionNode = positionGeometry.add(disp);
  material.normalNode = transformNormalToView(w.xyz).normalize().mul(faceDirection);
  material.roughnessNode = sqrt(sqrt(materialRoughness.pow(4).add(tn.y.mul(2))));
  const h = varying(disp.y);
  let c = mix(color(new Color5(o.deep)), materialColor.rgb, smoothstep(-1.6 * amp, 1.6 * amp, tn.x).mul(0.75).add(0.25));
  if (o.foam != null)
    c = mix(c, color(new Color5(o.foam)), float(1).sub(smoothstep(0.15, 0.55, w.w)).mul(0.85));
  if (shore) {
    const p = varying(positionGeometry.xz.add(disp.xz));
    const depth = h.sub(texture(shore.map, vec2(p.x.div(shore.size).add(0.5), float(0.5).sub(p.y.div(shore.size)))).r).toVar();
    c = mix(c, color(shore.shallow), float(1).sub(smoothstep(0, shore.depth, depth)));
    if (shore.foam > 0) {
      const line = float(1).sub(smoothstep(0, shore.foam, depth));
      c = mix(c, color(shore.foamColor), line.mul(sin(depth.mul(9 / shore.foam).sub(time.mul(1.7))).mul(0.35).add(0.65)).clamp(0, 1).mul(0.9));
    }
  }
  material.colorNode = vec4(c, materialOpacity);
  material.userData.fxTime = time;
  return material;
}
import { Vector2 as Vector22, Vector3 as Vector37 } from "three";
var pick = (v2, number, base) => v2 === undefined || v2 === false || v2 === null ? null : { ...base, ...typeof v2 === "number" ? { [number]: v2 } : typeof v2 === "object" ? v2 : {} };
var GRADE = `
uniform sampler2D tDiffuse; uniform float contrast, saturation, brightness, vignette; uniform vec3 tint; varying vec2 vUv;
void main() {
  vec4 c = texture2D(tDiffuse, vUv);
  vec3 g = (c.rgb - 0.5) * contrast + 0.5 + brightness;
  g = mix(vec3(dot(g, vec3(0.2126, 0.7152, 0.0722))), g, saturation) * tint;
  g *= 1.0 - smoothstep(0.3, 0.85, length(vUv - 0.5) * 1.4142) * vignette;
  gl_FragColor = vec4(g, c.a);
}`;
var plainError = (message) => Object.assign(new Error(message), { plain: true });
async function webgpu() {
  const three = await import("three");
  if (three.RenderPipeline)
    return three;
  try {
    return await import("three/webgpu");
  } catch {
    throw plainError(`the page's "three" has no RenderPipeline (it is three.module.js) and its import map has no "three/webgpu"; map "three/webgpu" (or "three") to three.webgpu.js`);
  }
}
var composerPass = (name) => {
  const path = `three/addons/postprocessing/${name}.js`;
  return import(path).catch(() => {
    throw plainError(`${path} did not load: map "three/addons/" in the import map, or in a bundled page import the passes and pass them, addons: { EffectComposer, RenderPass, OutputPass, ShaderPass, UnrealBloomPass } (with BokehPass, GTAOPass, AfterimagePass for dof, ao, motion)`);
  });
};
function post(renderer, scene, camera, options) {
  const { input: given, addons, ...picked } = options ?? {};
  const o = Object.keys(picked).length ? picked : { bloom: true, grade: true, vignette: true };
  const addon = (name) => addons?.[name] ? Promise.resolve({ [name]: addons[name] }) : composerPass(name);
  const own = given?.isRenderPipeline ? given : null, input = own ? own.outputNode : given;
  const plain = own ? () => own.render() : () => renderer.render(scene, camera);
  const bloom = pick(o.bloom, "strength", { strength: 0.5, radius: 0.4, threshold: 0.85 });
  const dof = pick(o.dof, "focus", { focus: 10, range: 6, blur: 1 });
  const ao = pick(o.ao, "intensity", { radius: 0.5, intensity: 1 });
  const motion = o.motion === undefined || o.motion === false ? 0 : o.motion === true ? 1 : o.motion;
  const grade = pick(o.grade, "contrast", { contrast: 1.06, saturation: 1.08, brightness: 0, tint: 16777215 });
  const vignette = o.vignette === undefined || o.vignette === false ? 0 : o.vignette === true ? 0.35 : o.vignette;
  let draw = null, dispose = () => {};
  const at = new Vector37;
  const focusDistance = () => typeof p.focus === "number" ? p.focus : camera.getWorldPosition(at).distanceTo(p.focus.getWorldPosition(new Vector37));
  const p = {
    render() {
      if (p.enabled && draw)
        draw();
      else
        plain();
    },
    ready: null,
    backend: null,
    error: null,
    enabled: true,
    focus: dof?.focus ?? 10,
    passes: {},
    dispose() {
      draw = null;
      dispose();
    }
  };
  const pipeline = async () => {
    if (given && !input?.isNode)
      throw plainError("input is the page's RenderPipeline or a TSL colour node");
    const THREE3 = await webgpu();
    const [T, B, D, A, M] = await Promise.all([
      import("three/tsl"),
      bloom && import("three/addons/tsl/display/BloomNode.js"),
      dof && import("three/addons/tsl/display/DepthOfFieldNode.js"),
      ao && import("three/addons/tsl/display/GTAONode.js"),
      motion && import("three/addons/tsl/display/MotionBlur.js")
    ]);
    const scenePass = (!input || ao || dof || motion) && T.pass(scene, camera, ao ? { samples: 0 } : {});
    if (motion)
      scenePass.setMRT(T.mrt({ output: T.output, velocity: T.velocity }));
    let color = input ?? scenePass.getTextureNode("output");
    const transformed = own?.outputColorTransform === false;
    if (ao) {
      const n = A.ao(scenePass.getTextureNode("depth"), null, camera);
      n.resolutionScale = 0.5;
      n.radius.value = ao.radius;
      p.passes.ao = n;
      color = T.vec4(color.rgb.mul(T.mix(T.float(1), n.getTextureNode().sample(T.screenUV).r, ao.intensity)), color.a);
    }
    if (dof) {
      const f = T.uniform(focusDistance());
      p.passes.focus = f;
      color = p.passes.dof = D.dof(color, scenePass.getViewZNode(), f, dof.range, dof.blur);
    }
    if (motion)
      color = M.motionBlur(T.convertToTexture(color), scenePass.getTextureNode("velocity").mul(motion * 0.5), T.int(8));
    if (bloom) {
      const exposure = p.passes.exposure = T.uniform(renderer.toneMappingExposure);
      const shown = transformed ? color.rgb : T.toneMapping(renderer.toneMapping, exposure, color.rgb);
      const lit = T.smoothstep(bloom.threshold, bloom.threshold + 0.01, T.luminance(shown.rgb));
      const n = p.passes.bloom = B.bloom(T.vec4(color.rgb.mul(lit), color.a), bloom.strength, bloom.radius, 0);
      color = T.vec4(color.rgb.add(n.rgb), color.a);
    }
    const rp = new THREE3.RenderPipeline(renderer);
    if (grade || vignette) {
      const g = grade ?? { contrast: 1, saturation: 1, brightness: 0, tint: 16777215 };
      const out = transformed ? color : T.renderOutput(color);
      let c = out.rgb;
      c = T.saturation(c.sub(0.5).mul(g.contrast).add(0.5 + g.brightness), g.saturation).mul(T.color(g.tint));
      c = c.mul(T.float(1).sub(T.smoothstep(0.3, 0.85, T.screenUV.sub(0.5).length().mul(Math.SQRT2)).mul(vignette)));
      rp.outputColorTransform = false;
      rp.outputNode = T.vec4(c, out.a);
    } else {
      rp.outputColorTransform = !transformed;
      rp.outputNode = color;
    }
    p.passes.pipeline = rp;
    dispose = () => rp.dispose();
    draw = () => {
      if (p.passes.focus)
        p.passes.focus.value = focusDistance();
      if (p.passes.exposure)
        p.passes.exposure.value = renderer.toneMappingExposure;
      rp.render();
    };
    p.backend = "pipeline";
  };
  const composer = async () => {
    if (given)
      throw plainError("input needs a WebGPURenderer (on a WebGLRenderer, add passes to fx.passes.composer)");
    const [{ EffectComposer }, { RenderPass }, { OutputPass }, { ShaderPass }, B, D, A, M] = await Promise.all([
      addon("EffectComposer"),
      addon("RenderPass"),
      addon("OutputPass"),
      addon("ShaderPass"),
      bloom && addon("UnrealBloomPass"),
      dof && addon("BokehPass"),
      ao && addon("GTAOPass"),
      motion && addon("AfterimagePass")
    ]);
    const THREE3 = await import("three"), { Color: Color6 } = THREE3;
    const size = renderer.getSize(new Vector22), c = new EffectComposer(renderer), gl = renderer.getContext();
    c.renderTarget1.samples = c.renderTarget2.samples = gl.getParameter(gl.SAMPLES);
    c.addPass(new RenderPass(scene, camera));
    if (ao) {
      const a = p.passes.ao = new A.GTAOPass(scene, camera, size.x, size.y);
      a.blendIntensity = ao.intensity;
      a.updateGtaoMaterial({ radius: ao.radius });
      c.addPass(a);
    }
    if (dof) {
      const maxblur = 0.01 * dof.blur;
      c.addPass(p.passes.dof = new D.BokehPass(scene, camera, { focus: focusDistance(), aperture: maxblur / dof.range, maxblur }));
    }
    if (motion)
      c.addPass(p.passes.motion = new M.AfterimagePass(Math.min(0.92, 0.6 + 0.15 * motion)));
    if (bloom)
      c.addPass(p.passes.bloom = shownThreshold(THREE3, new B.UnrealBloomPass(size.clone(), bloom.strength, bloom.radius, bloom.threshold)));
    c.addPass(new OutputPass);
    if (grade || vignette) {
      const g = grade ?? { contrast: 1, saturation: 1, brightness: 0, tint: 16777215 };
      c.addPass(p.passes.grade = new ShaderPass({
        uniforms: { tDiffuse: { value: null }, contrast: { value: g.contrast }, saturation: { value: g.saturation }, brightness: { value: g.brightness }, tint: { value: new Color6(g.tint) }, vignette: { value: vignette } },
        vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: GRADE
      }));
    }
    p.passes.composer = c;
    dispose = () => c.dispose();
    const last = new Vector22, now = new Vector22;
    draw = () => {
      renderer.getSize(now);
      if (!now.equals(last)) {
        last.copy(now);
        c.setPixelRatio(renderer.getPixelRatio());
        c.setSize(now.x, now.y);
      }
      if (p.passes.dof)
        p.passes.dof.uniforms.focus.value = focusDistance();
      if (p.passes.bloom)
        p.passes.bloom.shown(renderer);
      c.render();
    };
    p.backend = "composer";
  };
  p.ready = (renderer.isWebGPURenderer ? pipeline() : composer()).then(() => p, (e) => {
    p.error = e?.plain ? `fx post: ${e.message}; the scene draws without effects` : `fx post: ${e?.message ?? e}. The page's import map needs "three/addons/" (and "three/tsl" with WebGPU); the scene draws without effects`;
    console.error(p.error);
    return p;
  });
  return p;
}
var MAPPINGS = { Linear: "LINEAR", Reinhard: "REINHARD", Cineon: "CINEON", ACESFilmic: "ACES_FILMIC", AgX: "AGX", Neutral: "NEUTRAL" };
function shownThreshold(THREE3, pass) {
  const m = pass.materialHighPassFilter, define = (n) => `${MAPPINGS[n]}_TONE_MAPPING`;
  m.toneMapped = false;
  m.uniforms.toneMappingExposure = { value: 1 };
  m.fragmentShader = `#include <tonemapping_pars_fragment>
vec3 shown(vec3 c) {
${Object.keys(MAPPINGS).map((n, i) => `#${i ? "elif" : "if"} defined(${define(n)})
  return ${n}ToneMapping(c);`).join(`
`)}
#else
  return c;
#endif
}
${m.fragmentShader.replace("luminance( texel.xyz )", "luminance( shown( texel.rgb ) )")}`;
  let last;
  pass.shown = (renderer) => {
    m.uniforms.toneMappingExposure.value = renderer.toneMappingExposure;
    if (renderer.toneMapping === last)
      return;
    last = renderer.toneMapping;
    m.defines = {};
    const n = Object.keys(MAPPINGS).find((n2) => THREE3[`${n2}ToneMapping`] === last);
    if (n)
      m.defines[define(n)] = "";
    m.needsUpdate = true;
  };
  return pass;
}
import * as THREE3 from "three";
import {
  CanvasTexture as CanvasTexture3,
  Color as Color6,
  Euler as Euler2,
  InstancedBufferAttribute,
  InstancedMesh as InstancedMesh2,
  Matrix4 as Matrix43,
  MeshStandardMaterial as MeshStandardMaterial3,
  PlaneGeometry as PlaneGeometry5,
  Quaternion as Quaternion3,
  SRGBColorSpace as SRGBColorSpace3,
  Vector2 as Vector23,
  Vector3 as Vector38
} from "three";
var PI2 = Math.PI;
var lerp2 = (a, b, t) => a + (b - a) * t;
function sow({ on, density = 4, seed = 1, minHeight = -Infinity, maxHeight = Infinity, maxSlope = 90, avoid, scale = [0.7, 1.3], ...o } = {}) {
  const [x0, z0, x1, z1] = o.area ?? on?.area ?? [-10, -10, 10, 10], r = tex.rng(seed), out = [], cos = Math.cos(maxSlope * PI2 / 180);
  const n = Math.round(Math.max(0, density) * Math.abs((x1 - x0) * (z1 - z0))), T = 8 * PI2 / 180;
  for (let i = 0;i < n; i++) {
    const x = lerp2(x0, x1, r()), z = lerp2(z0, z1, r()), ry = r() * 2 * PI2, s = lerp2(scale[0], scale[1], r()), rx = (r() * 2 - 1) * T, rz = (r() * 2 - 1) * T;
    const y = on ? on.heightAt(x, z) : 0;
    if (y < minHeight || y > maxHeight || on && maxSlope < 90 && on.normalAt(x, z).y < cos || avoid?.(x, z))
      continue;
    out.push({ x, y, z, ry, s, rx, rz, sx: 1, sz: 1 });
  }
  return out;
}
function crown(n, { at = [0, 4, 0], radius = [2, 1.5, 2], seed = 1, scale = [0.7, 1.2], shape = "round" } = {}) {
  const r = tex.rng(seed), out = [];
  if (shape === "cone") {
    const H = 2 * radius[1], y0 = at[1] - radius[1], tiers = Math.max(4, Math.round(H * 1.5)), up = new Vector38, out_ = new Vector38, side = new Vector38;
    const M = new Matrix43, q = new Quaternion3, E = new Euler2;
    for (let i = 0;i < n; i++) {
      const h = Math.min(0.97, (Math.floor((1 - Math.sqrt(r())) * tiers) + r() * 0.7) / tiers), a = r() * 2 * PI2, d = (1 - h) * (0.3 + 0.7 * Math.sqrt(r()));
      const droop = 0.25 + 0.3 * r(), y = Math.max(y0, y0 + h * H - droop * d * Math.max(radius[0], radius[2]) * 0.5);
      out_.set(Math.cos(a), -droop, Math.sin(a)).normalize();
      side.set(-Math.sin(a), 0, Math.cos(a));
      up.crossVectors(side, out_);
      q.setFromRotationMatrix(M.makeBasis(side, out_, up));
      E.setFromQuaternion(q);
      out.push({
        x: at[0] + Math.cos(a) * radius[0] * d,
        y,
        z: at[2] + Math.sin(a) * radius[2] * d,
        rx: E.x,
        ry: E.y,
        rz: E.z,
        s: lerp2(scale[0], scale[1], r()) * (0.6 + 0.4 * (1 - h)),
        sx: 1,
        sz: 1
      });
    }
    return out;
  }
  for (let i = 0;i < n; i++) {
    const u = r() * 2 - 1, a = r() * 2 * PI2, k = Math.sqrt(1 - u * u), d = 0.55 + 0.45 * Math.cbrt(r());
    out.push({
      x: at[0] + Math.cos(a) * k * radius[0] * d,
      y: at[1] + u * radius[1] * d,
      z: at[2] + Math.sin(a) * k * radius[2] * d,
      rx: (r() - 0.5) * PI2,
      ry: r() * 2 * PI2,
      rz: (r() - 0.5) * PI2,
      s: lerp2(scale[0], scale[1], r()),
      sx: 1,
      sz: 1
    });
  }
  return out;
}
var KINDS = {
  grass: { size: [0.9, 0.7], color: 3103260, tip: 10273370, strength: 0.12, speed: 1, backlight: 0.8, fade: [35, 70] },
  leaves: { size: [0.55, 0.55], color: 3041828, tip: 8368202, strength: 0.04, speed: 1.6, backlight: 1.2, fade: null },
  needles: { size: [0.7, 0.9], color: 1981218, tip: 5077566, strength: 0.03, speed: 1.2, backlight: 0.5, fade: null }
};
function cardTexture(kind, seed, base, top) {
  const c = document.createElement("canvas"), S2 = 128;
  c.width = c.height = S2;
  const x = c.getContext("2d"), r = tex.rng(seed + 17), css2 = (col) => `#${col.getHexString()}`;
  if (kind === "grass") {
    const g = x.createLinearGradient(0, S2, 0, 0);
    g.addColorStop(0, css2(base));
    g.addColorStop(1, css2(top));
    x.fillStyle = g;
    for (let i = 0;i < 9; i++) {
      const bx = S2 * (0.1 + 0.8 * r()), w = S2 * (0.03 + 0.03 * r()), h = S2 * (0.55 + 0.45 * r()), lean = (r() - 0.5) * S2 * 0.35;
      x.beginPath();
      x.moveTo(bx - w, S2);
      x.quadraticCurveTo(bx + lean * 0.3, S2 - h * 0.5, bx + lean, S2 - h);
      x.quadraticCurveTo(bx + lean * 0.3 + w * 0.3, S2 - h * 0.5, bx + w, S2);
      x.fill();
    }
  } else if (kind === "needles") {
    x.lineCap = "round";
    const twig = (x0, y0, x1, y1, n, l) => {
      x.strokeStyle = css2(base);
      x.lineWidth = S2 * 0.025;
      x.beginPath();
      x.moveTo(x0, y0);
      x.lineTo(x1, y1);
      x.stroke();
      const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
      x.lineWidth = S2 * 0.012;
      for (let i = 0;i < n; i++)
        for (const side of [-1, 1]) {
          const t2 = (i + r() * 0.5) / n, px = x0 + dx * t2, py = y0 + dy * t2, k = l * (1 - 0.5 * t2) * (0.8 + 0.4 * r()), c2 = Math.cos(0.9 * side), sn = Math.sin(0.9 * side);
          x.strokeStyle = css2(base.clone().lerp(top, 0.3 + 0.7 * r()));
          x.beginPath();
          x.moveTo(px, py);
          x.lineTo(px + (ux * c2 - uy * sn) * k, py + (ux * sn + uy * c2) * k);
          x.stroke();
        }
    };
    twig(S2 * 0.5, S2 * 0.98, S2 * 0.5, S2 * 0.04, 16, S2 * 0.2);
    for (let i = 0;i < 4; i++) {
      const y = S2 * (0.75 - 0.15 * i), sd = i % 2 ? 1 : -1;
      twig(S2 * 0.5, y, S2 * (0.5 + sd * 0.32), y - S2 * 0.22, 7, S2 * 0.12);
    }
  } else {
    for (let i = 0;i < 5; i++) {
      const cx = S2 * (0.25 + 0.5 * r()), cy = S2 * (0.25 + 0.5 * r()), a = r() * PI2, l = S2 * (0.16 + 0.1 * r());
      x.fillStyle = css2(base.clone().lerp(top, r()));
      x.beginPath();
      x.ellipse(cx, cy, l, l * 0.45, a, 0, 2 * PI2);
      x.fill();
    }
  }
  const t = new CanvasTexture3(c);
  t.colorSpace = SRGBColorSpace3;
  return t;
}
function cardGeometry(kind, [w, h]) {
  let g;
  if (kind === "grass") {
    const a = new PlaneGeometry5(w, h, 1, 3).translate(0, h / 2, 0), b = a.clone().rotateY(PI2 / 2), n0 = a.attributes.position.count;
    g = new THREE3.BufferGeometry;
    for (const k of ["position", "normal", "uv"]) {
      const x = a.attributes[k], y = b.attributes[k], d = new Float32Array(x.array.length * 2);
      d.set(x.array);
      d.set(y.array, x.array.length);
      g.setAttribute(k, new THREE3.BufferAttribute(d, x.itemSize));
    }
    g.setIndex([...a.index.array, ...Array.from(b.index.array, (i) => i + n0)]);
    const n = g.attributes.normal;
    for (let i = 0;i < n.count; i++)
      n.setXYZ(i, 0, 1, 0);
  } else
    g = new PlaneGeometry5(w, h);
  const p = g.attributes.position, bend = new Float32Array(p.count);
  for (let i = 0;i < p.count; i++)
    bend[i] = kind === "grass" ? (p.getY(i) / h) ** 2 : 1;
  g.setAttribute("folBend", new THREE3.BufferAttribute(bend, 1));
  return g;
}
function foliage(options = {}) {
  const kind = options.kind ?? "grass", o = { seed: 1, wind: [1, 0.3], sunColor: 16773590, ...KINDS[kind], ...options };
  const points = o.points ?? sow(o), seed = o.seed, r = tex.rng(seed * 31 + 7), phase = new Vector23(r() * 2 * PI2, r() * 2 * PI2);
  const base = new Color6(o.color), top = new Color6(o.tip), wind = new Vector23(...o.wind).normalize(), fade = o.fade ?? [1e8, 1e9];
  const geometry = cardGeometry(kind, o.size), map = cardTexture(kind, seed, base, top);
  const params = { map, alphaTest: 0.5, side: THREE3.DoubleSide, roughness: 0.85, ...o.material };
  const values = {
    time: 0,
    strength: o.strength,
    speed: o.speed,
    wind,
    phase,
    fade: new Vector23(...fade),
    sun: new Vector38(0.3, 1, 0.2).normalize(),
    sunColor: new Color6(o.sunColor),
    back: o.backlight
  };
  const own = ownNodes(THREE3);
  let { u, material } = own ? nodeFoliage(own.NodeMaterial, own.T, params, values) : glslFoliage(params, values);
  material.color.set(16777215);
  if (o.material?.color !== undefined)
    material.color.set(o.material.color);
  const mesh = new InstancedMesh2(geometry, material, points.length), M = new Matrix43, q = new Quaternion3, E = new Euler2, v2 = new Vector38, sc = new Vector38;
  const at = new Float32Array(points.length * 4);
  points.forEach((p, i) => {
    mesh.setMatrixAt(i, M.compose(v2.set(p.x, p.y, p.z), q.setFromEuler(E.set(p.rx ?? 0, p.ry, p.rz ?? 0)), sc.set(p.s * (p.sx ?? 1), p.s, p.s * (p.sz ?? 1))));
    at.set([p.x, p.y, p.z, r()], i * 4);
  });
  geometry.setAttribute("folBase", new InstancedBufferAttribute(at, 4));
  mesh.name = kind;
  mesh.frustumCulled = false;
  if (!own)
    nodesOnWebGPU(mesh, (NodeMaterial, T) => {
      const f = nodeFoliage(NodeMaterial, T, params, Object.fromEntries(Object.entries(u).map(([k, x]) => [k, x.value])));
      u = f.u;
      return f.material;
    });
  Object.assign(mesh, { kind, points, time: 0 });
  const sun = o.sun, light = new Vector38, target = new Vector38;
  const readSun = () => {
    if (!sun)
      return;
    if (Array.isArray(sun))
      u.sun.value.set(...sun).normalize();
    else {
      sun.getWorldPosition(light);
      const t = sun.target;
      t ? t.getWorldPosition(target) : target.set(0, 0, 0);
      u.sun.value.copy(light.sub(target)).normalize();
      if (sun.color)
        u.sunColor.value.copy(sun.color);
    }
  };
  readSun();
  mesh.update = (t) => {
    mesh.time = t;
    u.time.value = t;
    readSun();
  };
  mesh.sway = (x, z, t = mesh.time) => {
    const wx = x + mesh.position.x, wz = z + mesh.position.z, ts = t * o.speed;
    const s = o.strength * (0.55 + 0.35 * Math.sin(ts * 1.7 - (wx * wind.x + wz * wind.y) * 0.4 + phase.x) + 0.1 * Math.sin(ts * 4.3 + (-wx * wind.y + wz * wind.x) * 0.9 + phase.y));
    return [wind.x * s, wind.y * s];
  };
  mesh.thin = (share) => {
    mesh.count = Math.round(points.length * Math.min(1, Math.max(0, share)));
  };
  return mesh;
}
function glslFoliage(params, values) {
  const u = Object.fromEntries(Object.entries(values).map(([k, v2]) => [k, { value: v2 }]));
  const material = new MeshStandardMaterial3(params);
  material.onBeforeCompile = (shader) => {
    for (const [k, v2] of Object.entries(u))
      shader.uniforms[`uFol_${k}`] = v2;
    shader.vertexShader = `attribute float folBend;
attribute vec4 folBase;
uniform float uFol_time, uFol_strength, uFol_speed;
uniform vec2 uFol_wind, uFol_phase, uFol_fade;
varying vec3 vFolWorld;
${shader.vertexShader}`.replace("#include <project_vertex>", `
        vec4 folB = modelMatrix * vec4(folBase.xyz, 1.0), folP = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
        folP = instanceMatrix * folP;
        #endif
        float folK = clamp(((1.0 - smoothstep(uFol_fade.x, uFol_fade.y, distance(folB.xyz, cameraPosition))) * 1.2 - folBase.w) * 5.0, 0.0, 1.0);
        folP.xyz = folBase.xyz + (folP.xyz - folBase.xyz) * folK;
        float folA = dot(folB.xz, uFol_wind), folC = dot(folB.xz, vec2(-uFol_wind.y, uFol_wind.x)), folT = uFol_time * uFol_speed;
        float folS = uFol_strength * (0.55 + 0.35 * sin(folT * 1.7 - folA * 0.4 + uFol_phase.x) + 0.1 * sin(folT * 4.3 + folC * 0.9 + uFol_phase.y));
        folP.xz += uFol_wind * folS * folBend * folK;
        vFolWorld = (modelMatrix * folP).xyz;
        vec4 mvPosition = modelViewMatrix * folP;
        gl_Position = projectionMatrix * mvPosition;`);
    shader.fragmentShader = `uniform vec3 uFol_sun, uFol_sunColor;
uniform float uFol_back;
varying vec3 vFolWorld;
${shader.fragmentShader}`.replace("#include <normal_fragment_begin>", `#include <normal_fragment_begin>
        #ifdef DOUBLE_SIDED
        normal *= faceDirection; nonPerturbedNormal = normal;
        #endif`).replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * uFol_sunColor * uFol_back * pow(max(dot(normalize(vFolWorld - cameraPosition), uFol_sun), 0.0), 4.0);`);
  };
  material.customProgramCacheKey = () => "paprika3d-foliage";
  return { u, material };
}
function nodeFoliage(NodeMaterial, T, params, values) {
  const u = Object.fromEntries(Object.entries(values).map(([k2, v2]) => [k2, T.uniform(v2)]));
  const material = new NodeMaterial(params);
  const at = T.attribute("folBase", "vec4"), bend = T.attribute("folBend", "float");
  const bw = T.modelWorldMatrix.mul(T.vec4(at.xyz, 1)).xyz;
  const k = T.float(1).sub(T.smoothstep(u.fade.x, u.fade.y, bw.distance(T.cameraPosition))).mul(1.2).sub(at.w).mul(5).clamp(0, 1);
  const along2 = bw.xz.dot(u.wind), across = bw.xz.dot(T.vec2(u.wind.y.negate(), u.wind.x)), ts = u.time.mul(u.speed);
  const s = u.strength.mul(T.float(0.55).add(T.sin(ts.mul(1.7).sub(along2.mul(0.4)).add(u.phase.x)).mul(0.35)).add(T.sin(ts.mul(4.3).add(across.mul(0.9)).add(u.phase.y)).mul(0.1)));
  const p = at.xyz.add(T.positionLocal.sub(at.xyz).mul(k));
  material.positionNode = p.add(T.vec3(u.wind.x, 0, u.wind.y).mul(s.mul(bend).mul(k)));
  material.normalNode = T.normalViewGeometry;
  material.emissiveNode = T.diffuseColor.rgb.mul(u.sunColor).mul(u.back).mul(T.pow(T.max(T.positionWorld.sub(T.cameraPosition).normalize().dot(u.sun), 0), 4));
  return { u, material };
}
export {
  water,
  uv,
  unrealScript,
  trace,
  tex,
  stage,
  sow,
  shapesOf,
  shake,
  sfx,
  ringArea,
  post,
  place,
  picture,
  instances,
  heightsOf,
  heightfield,
  handoff,
  foliage,
  field2 as field,
  crown,
  contours,
  burst,
  bake,
  Burst
};
