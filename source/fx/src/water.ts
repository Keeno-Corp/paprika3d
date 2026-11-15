// water: a wave surface that boats can ride. One Gerstner spectrum (deep-water dispersion, bounded steepness, per-wave
// seeded directions) displaces a MeshStandardMaterial plane on the GPU and answers `height` / `normal` on the CPU, so a
// boat, bobber or swimmer sits on the crest the player sees. The spectrum and the fixed-point inversion of the sideways
// Gerstner push follow WaterThreeJS (github.com/achrefelouafi/WaterThreeJS, MIT, (c) 2026 mohamedachrefelouafi). Dogfood
// and scene-loop games each hand-built their sea (CPU sine planes, a flat Water.js mirror nothing could float on).
//   const sea = water({ preset: "ocean", size: 400 }); scene.add(sea);
//   loop: sea.update(t); boat.position.y = sea.height(boat.position.x, boat.position.z);
// Under WebGPURenderer the same spectrum is a TSL MeshStandardNodeMaterial (positionNode, normalNode, colorNode), since it
// ignores onBeforeCompile and drew the GLSL sea flat (dev #301): from the start when the page's `three` is three.webgpu.js,
// from the first frame when it is three.module.js beside `three/webgpu` (#313, node.ts).
// `shore` (the ground's height, a fx `field` or a height texture) tints the shallows and draws foam at the waterline,
// from the water's depth over the ground under each wave (dev #347: a Craterfall island met the sea with no edge).
// `flow` (one [vx, vz], a function, a velocity texture or a curve) carries the waves, ripples and foam downstream and
// float() drifts what it holds with it (agent-report #356: three dogfood rivers each built their own current on top).
// A varying current draws two copies of the pattern, each advected for FLOW_T seconds, fading in turn, so it never stretches.
import * as THREE from "three";
import { Color, DataTexture, DataUtils, HalfFloatType, LinearFilter, Mesh, MeshStandardMaterial, PlaneGeometry, RedFormat, RGFormat, Vector3, type ColorRepresentation, type MeshStandardMaterialParameters, type Texture } from "three";
import { tex } from "./tex.ts";
import { nodesOnWebGPU, ownNodes } from "./node.ts";
import type { Field } from "./place.ts";

export type WaterPreset = "pond" | "lake" | "ocean" | "storm";

export type WaterOptions = {
  preset?: WaterPreset;
  size?: number;           // metres across (square), centred on the mesh's position
  segments?: number;       // grid cells per side
  wavelength?: number;     // metres, the longest wave
  amplitude?: number;      // metres, the longest wave's height above rest
  waves?: number;          // waves in the spectrum, 1..32
  choppy?: number;         // 0 round swells .. 1 sharp crests
  spread?: number;         // radians either side of the wind the waves fan out
  speed?: number;          // time scale
  wind?: [number, number]; // x, z the swell travels toward
  color?: ColorRepresentation; // crests and shallows
  deep?: ColorRepresentation;  // troughs
  foam?: ColorRepresentation | null; // crest foam colour, null for none
  seed?: number;
  material?: MeshStandardMaterialParameters;
  /** The ground under the water: its world y at (x, z), a fx `field`, or a texture over the water's square whose red
      channel is the ground's height in metres above the water's rest level (negative below it; u along +x, v along -z). */
  shore?: ((x: number, z: number) => number) | Pick<Field, "heightAt"> | Texture;
  shallow?: ColorRepresentation; // the shallows' tint, fading out by `shoreDepth`
  shoreDepth?: number;           // metres of depth the shallow tint reaches
  shoreFoam?: number;            // metres of depth the waterline foam reaches, 0 for none
  /** A current in metres per second: one [vx, vz] for all the water, a function of world (x, z), a texture over the
      water's square (red vx, green vz; u along +x, v along -z; a DataTexture, which the CPU reads too), or a curve the
      water runs along at `speed` (1.5 by default): a three.js Curve, its points' x, z (a Vector2's x, y). */
  flow?: [number, number] | ((x: number, z: number) => [number, number]) | Texture | { along: FlowCurve; speed?: number };
};
type FlowCurve = { getSpacedPoints(divisions?: number): { x: number; y: number; z?: number }[] };

const PRESETS: Record<WaterPreset, WaterOptions> = {
  pond:  { wavelength: 4,   amplitude: 0.02, waves: 8,  choppy: 0.2, spread: 1.4, color: 0x3d7a6e, deep: 0x16352f, foam: null },
  lake:  { wavelength: 18,  amplitude: 0.12, waves: 12, choppy: 0.35, spread: 1.1, color: 0x2f6f8a, deep: 0x0f2f44, foam: null },
  ocean: { wavelength: 80,  amplitude: 0.7,  waves: 20, choppy: 0.5, spread: 0.95, color: 0x2a7a96, deep: 0x06243a, foam: 0xe8f4f8 },
  storm: { wavelength: 120, amplitude: 2.4,  waves: 24, choppy: 0.85, spread: 0.8, color: 0x3d5a66, deep: 0x0b1a22, foam: 0xdfe8ea },
};

export type Water = Mesh<PlaneGeometry, MeshStandardMaterial> & {
  /** Sets the waves' time in seconds; call once a frame with the game's clock. */
  update(t: number): void;
  time: number;
  /** World y of the visible surface above world (x, z) at time `t` (the last `update` by default). */
  height(x: number, z: number, t?: number): number;
  /** The visible surface's world normal above (x, z). */
  normal(x: number, z: number, t?: number, out?: Vector3): Vector3;
  /** The current at world (x, z): [vx, vz] in metres per second, [0, 0] with no `flow`. */
  current(x: number, z: number): [number, number];
  /** Puts `object`'s y on the surface (plus `lift`) and returns that height; with a `flow`, first moves its x, z with the
      current over the time since its last float (`drift` the share of the current, 0 to hold it in place). */
  float(object: { position: Vector3 }, lift?: number, t?: number, drift?: number): number;
};

const RIPPLES = 16;
const GLSL = /* glsl */ `
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
// per pixel from the rest point p, fp its metres per pixel: a wave fades out as it nears the pixel's size and its slope
// goes into roughness (lost), and fine ripples under slow gust patches break up the swell's repeat
const GLSL_SURFACE = /* glsl */ `
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

/** A Gerstner wave surface; see the file's header. Keep it unrotated and unscaled (move it freely): the waves run in its
    own x, z plane. Its look is a MeshStandardMaterial, so `scene.environment` (fx's `stage`) gives it reflections. */
export function water(options: WaterOptions = {}): Water {
  const o = { size: 200, segments: 160, speed: 1, wind: [1, 0.55] as [number, number], seed: 1, ...PRESETS.ocean, ...PRESETS[options.preset ?? "ocean"], ...options };
  const n = Math.max(1, Math.min(32, Math.round(o.waves!)));
  const r = tex.rng(o.seed), base = Math.atan2(o.wind[1], o.wind[0]), cell = o.size / Math.max(1, o.segments);
  // jittered wavelengths, amplitudes and a fan that widens for shorter waves, so a few long waves never beat into one
  // lattice across the sea; B's last slot is the share of each wave the grid can draw (none under ~3 cells a wave)
  const A: number[] = [], B: number[] = [], S: Spectrum = { R: [], RB: [], G: [] };
  let k = 2 * Math.PI / o.wavelength!, amp = o.amplitude!;
  for (let i = 0; i < n; i++) {
    const side = ((i * 0.618034 + r() * 0.25) % 1) * 2 - 1; // neighbours in the spectrum never share a heading
    const angle = base + side * o.spread! * (1 + 0.6 * i / Math.max(n - 1, 1)), kk = k * (0.9 + 0.2 * r()), a = amp * (0.85 + 0.3 * r());
    A.push(Math.cos(angle), Math.sin(angle), kk, a);
    B.push(Math.sqrt(9.81 * kk) * o.speed, r() * 2 * Math.PI, o.choppy! / Math.max(kk * a * n, 1e-3), drawn(kk, cell));
    k *= 1.19; amp *= 0.82;
  }
  // shading-only ripples past the shortest wave, fanned wide; then long waves that group the swell, gust the ripples
  // and bend every crest, so no stretch of sea repeats another
  let slope = A[(n - 1) * 4 + 2]! * A[(n - 1) * 4 + 3]!;
  for (let i = 0; i < RIPPLES; i++) {
    const angle = base + (r() * 2 - 1) * Math.min(2.6, o.spread! * 2), kk = k * (0.9 + 0.2 * r());
    S.R.push(Math.cos(angle), Math.sin(angle), kk, slope / kk);
    S.RB.push(Math.sqrt(9.81 * kk) * o.speed, r() * 2 * Math.PI, 0, 0);
    k *= 1.23; slope *= 0.92;
  }
  // wave groups across 5..14 longest waves, gusts across 3..7, and a bend of the crests across 3..6 (0.22 of one a wave)
  for (const m of [5.3, 8.9, 13.7, 3.1, 4.7, 7.3, 3.7, 5.9, 4.3, 6.1]) {
    const angle = r() * 2 * Math.PI;
    S.G.push(Math.cos(angle), Math.sin(angle), 2 * Math.PI / (o.wavelength! * m), r() * 2 * Math.PI);
  }
  S.G.push(o.wavelength! * 0.22, 0, 0, 0);

  // read off the namespace: three.module.js has no node materials, and a named import of one would fail fx.js's link
  const shore = o.shore ? shoreOf(o.shore, o) : undefined;
  const flow = o.flow ? flowOf(o.flow, o.size) : undefined;
  const own = ownNodes(THREE);
  const material = own ? nodeWater(own.NodeMaterial, own.T, n, A, B, S, o, shore, flow) : glslWater(n, A, B, S, o, shore, flow);
  const mesh = new Mesh(new PlaneGeometry(o.size, o.size, o.segments, o.segments).rotateX(-Math.PI / 2), material) as unknown as Water;
  if (shore?.bake) { // the ground is sampled under the water where it is drawn, again whenever the water moves
    const bake = shore.bake, before = mesh.onBeforeRender;
    let at = "";
    const rebake = () => {
      const e = mesh.matrixWorld.elements, key = `${e[12]},${e[13]},${e[14]}`;
      if (key !== at) { at = key; bake(e[12]!, e[13]!, e[14]!); }
    };
    rebake();
    mesh.onBeforeRender = function (...args: any[]) { rebake(); (before as any).apply(this, args); };
  }
  // a function or curve current is sampled under the water where it stands, as height() places it (its position)
  let fx = NaN, fy = NaN, fz = NaN;
  const syncFlow = () => {
    const q = mesh.position;
    if (flow?.bake && (q.x !== fx || q.y !== fy || q.z !== fz)) { fx = q.x; fy = q.y; fz = q.z; flow.bake(fx, fy, fz); }
  };
  if (flow?.bake) {
    syncFlow();
    const before = mesh.onBeforeRender;
    mesh.onBeforeRender = function (...args: any[]) { syncFlow(); (before as any).apply(this, args); };
  }
  mesh.name = "water";
  mesh.receiveShadow = true;
  mesh.time = 0;
  mesh.frustumCulled = false; // the crests rise past the flat plane's bounds
  if (!own) nodesOnWebGPU(mesh, (NodeMaterial, T, old) => {
    const m = nodeWater(NodeMaterial, T, n, A, B, S, o, shore, flow);
    m.userData.fxTime.value = old.userData.fxTime.value;
    return m;
  });

  const s = { dx: 0, dy: 0, dz: 0, nx: 0, ny: 1, nz: 0 };
  const fieldAt = (j: number, x: number, z: number, t: number) => {
    let g = 0;
    for (let i = j; i < j + 3; i++) g += Math.sin(S.G[i * 4 + 2]! * (S.G[i * 4]! * x + S.G[i * 4 + 1]! * z) + S.G[i * 4 + 3]! + t * 0.02);
    return smooth((g + 1.5) / 3);
  };
  const wave = (x: number, z: number, t: number) => {
    let dx = 0, dy = 0, dz = 0, nx = 0, ny = 1, nz = 0;
    const e = 0.25 + 0.75 * fieldAt(0, x, z, t), G = S.G, bend = (i: number) => Math.sin(G[i * 4 + 2]! * (G[i * 4]! * x + G[i * 4 + 1]! * z) + G[i * 4 + 3]!);
    const wx = x + G[40]! * (bend(6) + bend(7)), wz = z + G[40]! * (bend(8) + bend(9));
    for (let i = 0; i < n; i++) {
      const ax = A[i * 4]!, az = A[i * 4 + 1]!, kk = A[i * 4 + 2]!, a = A[i * 4 + 3]!, q = B[i * 4 + 2]!, h = a * e * B[i * 4 + 3]!;
      const arg = kk * (ax * wx + az * wz) + t * B[i * 4]! + B[i * 4 + 1]!, sn = Math.sin(arg), c = Math.cos(arg), ka = kk * a * e;
      dx += q * h * ax * c; dy += h * sn; dz += q * h * az * c;
      nx -= ax * ka * c; ny -= q * ka * sn; nz -= az * ka * c;
    }
    Object.assign(s, { dx, dy, dz, nx, ny, nz });
    return s;
  };
  const a = { ...s };
  // the same two copies of the pattern the shader draws under the current (fxFlow)
  const sample = (x: number, z: number, t: number) => {
    if (!flow) return wave(x, z, t);
    if (flow.v) return wave(x - flow.v[0] * t, z - flow.v[1] * t, t);
    const [vx, vz] = flow.at(x, z), ph = t / FLOW_T + fieldAt(3, x, z, t), f0 = ph - Math.floor(ph), f1 = ph + 0.5 - Math.floor(ph + 0.5), wb = Math.abs(1 - 2 * f0);
    Object.assign(a, wave(x - vx * f0 * FLOW_T, z - vz * f0 * FLOW_T, t));
    wave(x - vx * f1 * FLOW_T, z - vz * f1 * FLOW_T, t);
    for (const k of ["dx", "dy", "dz", "nx", "ny", "nz"] as const) s[k] = a[k] + (s[k] - a[k]) * wb;
    return s;
  };
  // the crest seen above (x, z) was pushed there sideways from another rest point: four fixed-point steps find it
  const surface = (x: number, z: number, t: number) => {
    syncFlow();
    const lx = x - mesh.position.x, lz = z - mesh.position.z;
    let rx = lx, rz = lz;
    for (let i = 0; i < 4; i++) { sample(rx, rz, t); rx = lx - s.dx; rz = lz - s.dz; }
    return sample(rx, rz, t);
  };
  mesh.update = t => { mesh.time = t; mesh.material.userData.fxTime.value = t; };
  mesh.height = (x, z, t = mesh.time) => mesh.position.y + surface(x, z, t).dy;
  mesh.normal = (x, z, t = mesh.time, out = new Vector3()) => { const w = surface(x, z, t); return out.set(w.nx, w.ny, w.nz).normalize(); };
  mesh.current = (x, z) => {
    if (!flow) return [0, 0];
    syncFlow();
    return flow.at(x - mesh.position.x, z - mesh.position.z);
  };
  const floated = new WeakMap<object, number>();
  mesh.float = (object, lift = 0, t = mesh.time, drift = 1) => {
    const p = object.position, t0 = floated.get(object);
    if (flow && drift && t0 !== undefined && t > t0) { // midpoint steps of at most 1/30 s, so a log follows a bend
      const steps = Math.min(64, Math.ceil((t - t0) * 30)), dt = (t - t0) / steps * drift;
      for (let i = 0; i < steps; i++) {
        const [ux, uz] = mesh.current(p.x, p.z), [vx, vz] = mesh.current(p.x + ux * dt / 2, p.z + uz * dt / 2);
        p.x += vx * dt; p.z += vz * dt;
      }
    }
    floated.set(object, t);
    return (p.y = mesh.height(p.x, p.z, t) + lift);
  };
  return mesh;
}

/** The shading-only part of the spectrum: ripples (direction x, z, k, A; then speed, phase) and the gust waves (x, z, k, phase). */
type Spectrum = { R: number[]; RB: number[]; G: number[] };
/** The share of a wave of wavenumber k a grid of `cell`-metre squares draws without aliasing: all from 6 cells a wave, none under 3. */
const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
const drawn = (k: number, cell: number) => smooth((2 * Math.PI / k / cell - 3) / 3);

type Look = { color?: ColorRepresentation; deep?: ColorRepresentation; foam?: ColorRepresentation | null; amplitude?: number; material?: MeshStandardMaterialParameters };
/** The ground's height above the rest level as a texture over the water's square, with the shallows' look. */
type Shore = { map: Texture; size: number; depth: number; foam: number; shallow: Color; foamColor: Color; bake?: (x: number, y: number, z: number) => void };

function shoreOf(src: NonNullable<WaterOptions["shore"]>, o: WaterOptions): Shore {
  const amp = o.amplitude!, size = o.size!;
  const look = {
    size,
    depth: o.shoreDepth ?? Math.max(1.5, amp * 4),
    foam: o.shoreFoam ?? Math.max(0.15, amp * 0.8),
    shallow: o.shallow != null ? new Color(o.shallow) : new Color(o.color).lerp(new Color(0x8fded2), 0.5),
    foamColor: new Color(o.foam ?? 0xf2f7f8),
  };
  if ((src as Texture).isTexture) return { map: src as Texture, ...look };
  const at = typeof src === "function" ? src : (x: number, z: number) => (src as Pick<Field, "heightAt">).heightAt(x, z);
  // half floats filter linearly on WebGL 2 and WebGPU alike, where 32-bit float textures need an extension
  const N = Math.min(512, Math.max(64, Math.ceil(size * 2))), data = new Uint16Array(N * N);
  const map = new DataTexture(data, N, N, RedFormat, HalfFloatType);
  map.magFilter = map.minFilter = LinearFilter;
  const bake = (x0: number, y0: number, z0: number) => {
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++)
      data[j * N + i] = DataUtils.toHalfFloat(at(x0 + ((i + 0.5) / N - 0.5) * size, z0 + (0.5 - (j + 0.5) / N) * size) - y0);
    map.needsUpdate = true;
  };
  return { map, ...look, bake };
}

/** Seconds each copy of a varying current's pattern runs downstream before it fades and restarts. */
const FLOW_T = 2;
/** The current over the water's square: `v` when it is uniform, else `map` (vx, vz in red and green) and `at`, its
    bilinear read in the water's own x, z, as the GPU filters it. */
type Flow = { v?: [number, number]; map?: Texture; size: number; at: (x: number, z: number) => [number, number]; bake?: (x: number, y: number, z: number) => void };

function flowOf(src: NonNullable<WaterOptions["flow"]>, size: number): Flow | undefined {
  if (Array.isArray(src)) return src[0] || src[1] ? { v: [src[0], src[1]], size, at: () => [src[0], src[1]] } : undefined;
  let W: number, H: number, ch: number, read: (i: number) => number, map: Texture, bake: Flow["bake"];
  if ((src as Texture).isTexture) {
    map = src as Texture;
    const img = map.image as { data?: ArrayLike<number>; width: number; height: number } | undefined, d = img?.data;
    if (!img || !d) throw new Error("water: a flow texture must be a DataTexture (red vx, green vz in m/s), so float() and current() can read it");
    W = img.width; H = img.height; ch = Math.round(d.length / (W * H));
    read = map.type === HalfFloatType ? i => DataUtils.fromHalfFloat(d[i]!) : i => d[i]!;
  } else {
    const at = "along" in src ? along(src.along, src.speed ?? 1.5) : src as (x: number, z: number) => [number, number];
    W = H = Math.min(256, Math.max(32, Math.ceil(size))); ch = 2;
    const data = new Uint16Array(W * H * 2), f = new Float32Array(W * H * 2);
    map = new DataTexture(data, W, H, RGFormat, HalfFloatType);
    map.magFilter = map.minFilter = LinearFilter;
    read = i => f[i]!;
    bake = (x0, _y0, z0) => {
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const v = at(x0 + ((i + 0.5) / W - 0.5) * size, z0 + (0.5 - (j + 0.5) / H) * size), k = (j * W + i) * 2;
        for (let c = 0; c < 2; c++) { data[k + c] = DataUtils.toHalfFloat(v[c]!); f[k + c] = DataUtils.fromHalfFloat(data[k + c]!); }
      }
      map.needsUpdate = true;
    };
  }
  const texel = (i: number, j: number, c: number) => read(((Math.min(H - 1, Math.max(0, j))) * W + Math.min(W - 1, Math.max(0, i))) * ch + c);
  return {
    map, size, bake,
    at: (x, z) => {
      const u = (x / size + 0.5) * W - 0.5, v = (0.5 - z / size) * H - 0.5, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
      const one = (c: number) => (texel(i, j, c) * (1 - fu) + texel(i + 1, j, c) * fu) * (1 - fv) + (texel(i, j + 1, c) * (1 - fu) + texel(i + 1, j + 1, c) * fu) * fv;
      return [one(0), one(1)];
    },
  };
}

/** A current of `speed` along the curve's nearest stretch, from 256 points down it. */
function along(curve: FlowCurve, speed: number) {
  const pts = curve.getSpacedPoints(256).map(p => [p.x, p.z ?? p.y] as [number, number]);
  return (x: number, z: number): [number, number] => {
    let best = Infinity, tx = 1, tz = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, az] = pts[i]!, [bx, bz] = pts[i + 1]!, ex = bx - ax, ez = bz - az, l2 = ex * ex + ez * ez || 1e-12;
      const t = Math.min(1, Math.max(0, ((x - ax) * ex + (z - az) * ez) / l2)), dx = ax + ex * t - x, dz = az + ez * t - z, d = dx * dx + dz * dz;
      if (d < best) { best = d; const l = Math.sqrt(l2); tx = ex / l; tz = ez / l; }
    }
    return [tx * speed, tz * speed];
  };
}

function glslWater(n: number, A: number[], B: number[], S: Spectrum, o: Look, shore?: Shore, flow?: Flow): MeshStandardMaterial {
  const uniforms = {
    uTime: { value: 0 },
    uWaveA: { value: A },
    uWaveB: { value: B },
    uRipA: { value: S.R },
    uRipB: { value: S.RB },
    uGust: { value: S.G },
    uDeep: { value: new Color(o.deep) },
    uFoam: { value: new Color(o.foam ?? 0xffffff) },
    uAmp: { value: o.amplitude! },
    uShore: { value: shore?.map ?? null },
    uShoreK: { value: new Vector3(shore?.size ?? 1, shore?.depth ?? 1, Math.max(shore?.foam ?? 1, 1e-3)) }, // size, tint depth, foam depth
    uShallow: { value: shore?.shallow ?? new Color() },
    uShoreFoam: { value: shore?.foamColor ?? new Color() },
    uFlowV: { value: flow?.v ? { x: flow.v[0], y: flow.v[1], isVector2: true } : { x: 0, y: 0, isVector2: true } },
    uFlow: { value: flow?.map ?? null },
    uFlowSize: { value: flow?.size ?? 1 },
  };
  const material = new MeshStandardMaterial({ color: o.color, roughness: 0.12, metalness: 0, ...o.material });
  const shoreFoam = !!shore && shore.foam > 0;
  material.defines = { ...material.defines, WAVES: n, ...(o.foam == null ? {} : { FX_FOAM: 1 }), ...(shore ? { FX_SHORE: 1 } : {}), ...(shoreFoam ? { FX_SHORE_FOAM: 1 } : {}),
    ...(flow ? { FX_FLOW: 1, FLOW_T: FLOW_T.toFixed(1) } : {}), ...(flow?.map ? { FX_FLOW_MAP: 1 } : {}) };
  material.userData.fxTime = uniforms.uTime;
  material.customProgramCacheKey = () => `fx-water-${n}-${o.foam == null ? 0 : 1}-${shore ? 1 : 0}${shoreFoam ? 1 : 0}-${flow ? flow.map ? 2 : 1 : 0}`;
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${GLSL}varying vec2 vRest;\nvarying vec2 vDrawn;\nvarying float vHeight;`)
      .replace("#include <beginnormal_vertex>", "vec3 fxDisp = fxDisplaceAt(position.xz), objectNormal = vec3(0.0, 1.0, 0.0);\nvRest = position.xz; vDrawn = position.xz + fxDisp.xz; vHeight = fxDisp.y;")
      .replace("#include <begin_vertex>", "vec3 transformed = position + fxDisp;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${GLSL}${GLSL_SURFACE}uniform vec3 uDeep;\nuniform vec3 uFoam;\nuniform float uAmp;\nuniform sampler2D uShore;\nuniform vec3 uShoreK;\nuniform vec3 uShallow;\nuniform vec3 uShoreFoam;\nvarying vec2 vRest;\nvarying vec2 vDrawn;\nvarying float vHeight;`)
      .replace("#include <color_fragment>", `#include <color_fragment>
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
#endif`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = sqrt(sqrt(pow(roughnessFactor, 4.0) + 2.0 * fxLost));")
      .replace("#include <normal_fragment_begin>", "float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;\nvec3 normal = normalize(mat3(viewMatrix) * fxN) * faceDirection;\nvec3 nonPerturbedNormal = normal;");
  };

  return material;
}

/** The GLSL path's waves, deep tint and foam as TSL nodes for WebGPURenderer: the spectrum unrolled as constants, the
    displacement in the vertex stage, the analytic normal and the Jacobian's fold per pixel from the rest point. */
function nodeWater(NodeMaterial: any, T: any, n: number, A: number[], B: number[], S: Spectrum, o: Look, shore?: Shore, flow?: Flow): MeshStandardMaterial {
  const { Fn, uniform, vec2, vec3, vec4, float, sin, cos, mix, smoothstep, varying, texture, fwidth, sqrt, materialRoughness, positionGeometry, transformNormalToView, faceDirection, materialColor, materialOpacity, color } = T;
  const time = uniform(0);
  const bend = (p: any) => {
    const one = (i: number) => sin(p.x.mul(S.G[i * 4 + 2]! * S.G[i * 4]!).add(p.y.mul(S.G[i * 4 + 2]! * S.G[i * 4 + 1]!)).add(S.G[i * 4 + 3]!));
    return p.add(vec2(one(6).add(one(7)), one(8).add(one(9))).mul(S.G[40]!)).toVar();
  };
  const terms = (q: any, each: (ax: number, az: number, k: number, a: number, q: number, g: number, s: any, c: any) => void) => {
    const p = bend(q);
    for (let i = 0; i < n; i++) {
      const ax = A[i * 4]!, az = A[i * 4 + 1]!, k = A[i * 4 + 2]!;
      const arg = p.x.mul(k * ax).add(p.y.mul(k * az)).add(time.mul(B[i * 4]!)).add(B[i * 4 + 1]!).toVar();
      each(ax, az, k, A[i * 4 + 3]!, B[i * 4 + 2]!, B[i * 4 + 3]!, sin(arg).toVar(), cos(arg).toVar());
    }
  };
  const field = (p: any, j: number) => {
    let g: any = float(0);
    for (let i = j; i < j + 3; i++) { const G = S.G.slice(i * 4, i * 4 + 4) as number[]; g = g.add(sin(p.x.mul(G[2]! * G[0]!).add(p.y.mul(G[2]! * G[1]!)).add(G[3]!).add(time.mul(0.02)))); }
    return smoothstep(-1.5, 1.5, g);
  };
  /** `at` read at the pattern's rest points under the current, as fxFlow does on GLSL. */
  const flowed = (p: any, at: (q: any) => any) => {
    if (!flow) return at(p);
    if (flow.v) return at(p.sub(vec2(flow.v[0], flow.v[1]).mul(time)));
    const v = texture(flow.map, vec2(p.x.div(flow.size).add(0.5), float(0.5).sub(p.y.div(flow.size)))).level(0).rg.toVar();
    const ph = time.div(FLOW_T).add(field(p, 3)).toVar(), f0 = ph.fract().toVar(), f1 = ph.add(0.5).fract();
    return mix(at(p.sub(v.mul(f0.mul(FLOW_T)))), at(p.sub(v.mul(f1.mul(FLOW_T)))), float(1).sub(f0.mul(2)).abs());
  };
  const fade = (k: number, fp: any) => float(1).sub(smoothstep(0.12, 0.45, fp.mul(k / (2 * Math.PI)))).toVar();
  const displace = Fn(([p]: any[]) => {
    const d = vec3(0).toVar();
    terms(p, (ax, az, _k, a, q, g, s, c) => { if (g > 0) d.addAssign(vec3(c.mul(q * a * g * ax), s.mul(a * g), c.mul(q * a * g * az))); });
    return d.mul(field(p, 0).mul(0.75).add(0.25));
  });
  const surface = Fn(([p, fp]: any[]) => { // xyz the normal, w the fold (under ~0.5 where crests break)
    const nrm = vec3(0, 1, 0).toVar(), jxx = float(1).toVar(), jzz = float(1).toVar(), jxz = float(0).toVar();
    const e = field(p, 0).mul(0.75).add(0.25).toVar(), gust = field(p, 3).mul(0.8).add(0.2).toVar();
    terms(p, (ax, az, k, a, q, _g, s, c) => {
      const ka = fade(k, fp).mul(e).mul(k * a);
      nrm.subAssign(vec3(c.mul(ka).mul(ax), s.mul(ka).mul(q), c.mul(ka).mul(az)));
      jxx.subAssign(s.mul(ka).mul(q * ax * ax)); jzz.subAssign(s.mul(ka).mul(q * az * az)); jxz.subAssign(s.mul(ka).mul(q * ax * az));
    });
    for (let i = 0; i < RIPPLES; i++) {
      const ax = S.R[i * 4]!, az = S.R[i * 4 + 1]!, k = S.R[i * 4 + 2]!, a = S.R[i * 4 + 3]!;
      const c = cos(p.x.mul(k * ax).add(p.y.mul(k * az)).add(time.mul(S.RB[i * 4]!)).add(S.RB[i * 4 + 1]!)).mul(fade(k, fp)).mul(gust).mul(k * a);
      nrm.subAssign(vec3(c.mul(ax), 0, c.mul(az)));
    }
    return vec4(nrm.normalize(), jxx.mul(jzz).sub(jxz.mul(jxz)));
  });
  const tone = Fn(([p, fp]: any[]) => { // x the filtered height, y the slope variance faded out (to roughness)
    const h = float(0).toVar(), lost = float(0).toVar();
    const e = field(p, 0).mul(0.75).add(0.25).toVar(), gust = field(p, 3).mul(0.8).add(0.2).toVar();
    terms(p, (_ax, _az, k, a, _q, _g, s) => { const f = fade(k, fp); h.addAssign(s.mul(f).mul(e).mul(a)); lost.addAssign(float(1).sub(f.mul(f)).mul(e.mul(e)).mul(k * a * k * a)); });
    for (let i = 0; i < RIPPLES; i++) { const k = S.R[i * 4 + 2]!, f = fade(k, fp); lost.addAssign(float(1).sub(f.mul(f)).mul(gust.mul(gust)).mul((k * S.R[i * 4 + 3]!) ** 2)); }
    return vec2(h, lost.mul(0.5));
  });
  const material = new NodeMaterial({ color: o.color, roughness: 0.12, metalness: 0, ...o.material });
  const rest = varying(positionGeometry.xz), fp = fwidth(rest).length();
  const disp = flowed(positionGeometry.xz, displace).toVar(), w = flowed(rest, q => surface(q, fp)), tn = flowed(rest, q => tone(q, fp)), amp = o.amplitude!;
  material.positionNode = positionGeometry.add(disp);
  material.normalNode = transformNormalToView(w.xyz).normalize().mul(faceDirection);
  material.roughnessNode = sqrt(sqrt(materialRoughness.pow(4).add(tn.y.mul(2))));
  const h = varying(disp.y);
  let c = mix(color(new Color(o.deep)), materialColor.rgb, smoothstep(-1.6 * amp, 1.6 * amp, tn.x).mul(0.75).add(0.25));
  if (o.foam != null) c = mix(c, color(new Color(o.foam)), float(1).sub(smoothstep(0.15, 0.55, w.w)).mul(0.85));
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
