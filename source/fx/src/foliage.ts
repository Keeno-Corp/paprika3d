// foliage: wind-swayed grass, leaf and conifer-needle cards. One InstancedMesh of alpha-cut cards (canvas-drawn blades, leaves or needle sprays,
// alphaTest 0.5, both sides) whose tops lean downwind on the GPU and answer `sway` on the CPU, lit through from behind
// when the camera faces the sun (a subsurface-style backlight), thinned with `thin` and faded out with distance (`fade`).
// Under WebGPURenderer (either backend) it is a MeshStandardNodeMaterial with TSL position and emissive nodes (from the
// first frame when the page's `three` is three.module.js beside `three/webgpu`, #313, node.ts); under WebGLRenderer a
// MeshStandardMaterial patched in onBeforeCompile; the same formula in both.
// Dogfood games each hand-rolled their grass (unlit planes, opaque quads that hid what was behind them, no wind).
//   const grass = foliage({ on: land, density: 6 }); scene.add(grass);       // sown on a field(), seeded
//   const tree = foliage({ kind: "leaves", points: crown(300, { at: [0, 4, 0] }) });
//   const spruce = foliage({ kind: "needles", points: crown(500, { shape: "cone", at: [4, 3, 0], radius: [1.6, 2.6, 1.6] }) });
//   loop: grass.update(t); tree.update(t);
import * as THREE from "three";
import { CanvasTexture, Color, Euler, InstancedBufferAttribute, InstancedMesh, Matrix4, MeshStandardMaterial, PlaneGeometry, Quaternion, SRGBColorSpace, Vector2, Vector3,
  type BufferGeometry, type ColorRepresentation, type MeshStandardMaterialParameters, type Object3D } from "three";
import { nodesOnWebGPU, ownNodes } from "./node.ts";
import { tex } from "./tex.ts";
import type { Field, Point } from "./place.ts";

export type FoliageKind = "grass" | "leaves" | "needles";

export type SowOptions = {
  on?: Field;              // the terrain the cards stand on; y is its heightAt
  area?: number[];         // [x0, z0, x1, z1], default `on`'s, else [-10, -10, 10, 10]
  density?: number;        // cards per square metre (before the rules)
  seed?: number;
  minHeight?: number; maxHeight?: number;
  maxSlope?: number;       // degrees from flat, read from `on`
  avoid?: (x: number, z: number) => boolean;
  scale?: number[];        // [min, max] random card scale
};

export type FoliageOptions = SowOptions & {
  kind?: FoliageKind;
  points?: Point[];        // where the cards go (`sow`, `crown`, `place`); default sow(options)
  size?: [number, number]; // card width, height in metres at scale 1
  color?: ColorRepresentation; // grass base / leaf colour
  tip?: ColorRepresentation;   // grass tips / leaf highlights
  wind?: [number, number];     // x, z the wind blows toward
  strength?: number;       // metres a card's top leans at full gust
  speed?: number;          // time scale of the gusts
  backlight?: number;      // 0 none .. 2 strong light through the cards facing the sun
  sun?: Object3D | [number, number, number]; // a DirectionalLight (read each update) or a direction toward the sun
  sunColor?: ColorRepresentation;
  fade?: [number, number] | null; // camera distance where cards start thinning out, and where none are left; null never
  material?: MeshStandardMaterialParameters;
};

export type Foliage = InstancedMesh & {
  kind: FoliageKind;
  points: Point[];
  time: number;
  /** Sets the wind's time in seconds (and re-reads `sun`); call once a frame with the game's clock. */
  update(t: number): void;
  /** [dx, dz] metres the top of a card standing at world x, z leans at time t (default the last update). */
  sway(x: number, z: number, t?: number): [number, number];
  /** Draws the first `share` (0..1) of the cards; the points are in random order, so any share is spread evenly. */
  thin(share: number): void;
};

const PI = Math.PI, lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Seeded points `density` per square metre over `area`, on `on`'s drawn surface, keeping those that pass the rules, in
    random order (so a prefix is an even thinning), each with a random yaw, a slight tilt and a scale in `scale`. */
export function sow({ on, density = 4, seed = 1, minHeight = -Infinity, maxHeight = Infinity, maxSlope = 90, avoid, scale = [0.7, 1.3], ...o }: SowOptions = {}): Point[] {
  const [x0, z0, x1, z1] = o.area ?? on?.area ?? [-10, -10, 10, 10], r = tex.rng(seed), out: Point[] = [], cos = Math.cos((maxSlope * PI) / 180);
  const n = Math.round(Math.max(0, density) * Math.abs((x1 - x0) * (z1 - z0))), T = (8 * PI) / 180;
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()), ry = r() * 2 * PI, s = lerp(scale[0], scale[1], r()), rx = (r() * 2 - 1) * T, rz = (r() * 2 - 1) * T;
    const y = on ? on.heightAt(x, z) : 0;
    if (y < minHeight || y > maxHeight || (on && maxSlope < 90 && on.normalAt(x, z).y < cos) || avoid?.(x, z)) continue;
    out.push({ x, y, z, ry, s, rx, rz, sx: 1, sz: 1 });
  }
  return out;
}

/** `n` seeded leaf-card points for a tree crown or a bush: in the shell of an ellipsoid of `radius` [rx, ry, rz] around
    `at`, each turned at random (`shape: "round"`, broadleaf), or for a conifer (`shape: "cone"`, with `needles`) in
    drooping tiers on a cone from `radius[0]` wide at `at.y - radius[1]` to its tip at `at.y + radius[1]`, each card's top
    pointing out along its branch. */
export function crown(n: number, { at = [0, 4, 0], radius = [2, 1.5, 2], seed = 1, scale = [0.7, 1.2], shape = "round" }:
  { at?: number[]; radius?: number[]; seed?: number; scale?: number[]; shape?: "round" | "cone" } = {}): Point[] {
  const r = tex.rng(seed), out: Point[] = [];
  if (shape === "cone") {
    const H = 2 * radius[1], y0 = at[1] - radius[1], tiers = Math.max(4, Math.round(H * 1.5)), up = new Vector3(), out_ = new Vector3(), side = new Vector3();
    const M = new Matrix4(), q = new Quaternion(), E = new Euler();
    for (let i = 0; i < n; i++) {
      const h = Math.min(0.97, (Math.floor((1 - Math.sqrt(r())) * tiers) + r() * 0.7) / tiers), a = r() * 2 * PI, d = (1 - h) * (0.3 + 0.7 * Math.sqrt(r()));
      const droop = 0.25 + 0.3 * r(), y = Math.max(y0, y0 + h * H - droop * d * Math.max(radius[0], radius[2]) * 0.5);
      out_.set(Math.cos(a), -droop, Math.sin(a)).normalize(); side.set(-Math.sin(a), 0, Math.cos(a)); up.crossVectors(side, out_);
      q.setFromRotationMatrix(M.makeBasis(side, out_, up)); E.setFromQuaternion(q);
      out.push({ x: at[0] + Math.cos(a) * radius[0] * d, y, z: at[2] + Math.sin(a) * radius[2] * d,
        rx: E.x, ry: E.y, rz: E.z, s: lerp(scale[0], scale[1], r()) * (0.6 + 0.4 * (1 - h)), sx: 1, sz: 1 });
    }
    return out;
  }
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, a = r() * 2 * PI, k = Math.sqrt(1 - u * u), d = 0.55 + 0.45 * Math.cbrt(r());
    out.push({ x: at[0] + Math.cos(a) * k * radius[0] * d, y: at[1] + u * radius[1] * d, z: at[2] + Math.sin(a) * k * radius[2] * d,
      rx: (r() - 0.5) * PI, ry: r() * 2 * PI, rz: (r() - 0.5) * PI, s: lerp(scale[0], scale[1], r()), sx: 1, sz: 1 });
  }
  return out;
}

const KINDS: Record<FoliageKind, FoliageOptions> = {
  grass:  { size: [0.9, 0.7], color: 0x2f5a1c, tip: 0x9cc25a, strength: 0.12, speed: 1, backlight: 0.8, fade: [35, 70] },
  leaves: { size: [0.55, 0.55], color: 0x2e6a24, tip: 0x7fb04a, strength: 0.04, speed: 1.6, backlight: 1.2, fade: null },
  needles: { size: [0.7, 0.9], color: 0x1e3b22, tip: 0x4d7a3e, strength: 0.03, speed: 1.2, backlight: 0.5, fade: null },
};

// Cards drawn white-to-tip on a transparent canvas; the material colour tints them.
function cardTexture(kind: FoliageKind, seed: number, base: Color, top: Color) {
  const c = document.createElement("canvas"), S = 128; c.width = c.height = S;
  const x = c.getContext("2d")!, r = tex.rng(seed + 17), css = (col: Color) => `#${col.getHexString()}`;
  if (kind === "grass") {
    const g = x.createLinearGradient(0, S, 0, 0); g.addColorStop(0, css(base)); g.addColorStop(1, css(top)); x.fillStyle = g;
    for (let i = 0; i < 9; i++) {
      const bx = S * (0.1 + 0.8 * r()), w = S * (0.03 + 0.03 * r()), h = S * (0.55 + 0.45 * r()), lean = (r() - 0.5) * S * 0.35;
      x.beginPath(); x.moveTo(bx - w, S); x.quadraticCurveTo(bx + lean * 0.3, S - h * 0.5, bx + lean, S - h); x.quadraticCurveTo(bx + lean * 0.3 + w * 0.3, S - h * 0.5, bx + w, S); x.fill();
    }
  } else if (kind === "needles") { // a spray: a twig up the middle with side twigs, all set with short needles
    x.lineCap = "round";
    const twig = (x0: number, y0: number, x1: number, y1: number, n: number, l: number) => {
      x.strokeStyle = css(base); x.lineWidth = S * 0.025; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
      const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len; x.lineWidth = S * 0.012;
      for (let i = 0; i < n; i++) for (const side of [-1, 1]) {
        const t = (i + r() * 0.5) / n, px = x0 + dx * t, py = y0 + dy * t, k = l * (1 - 0.5 * t) * (0.8 + 0.4 * r()), c = Math.cos(0.9 * side), sn = Math.sin(0.9 * side);
        x.strokeStyle = css(base.clone().lerp(top, 0.3 + 0.7 * r())); x.beginPath(); x.moveTo(px, py); x.lineTo(px + (ux * c - uy * sn) * k, py + (ux * sn + uy * c) * k); x.stroke();
      }
    };
    twig(S * 0.5, S * 0.98, S * 0.5, S * 0.04, 16, S * 0.2);
    for (let i = 0; i < 4; i++) { const y = S * (0.75 - 0.15 * i), sd = i % 2 ? 1 : -1; twig(S * 0.5, y, S * (0.5 + sd * 0.32), y - S * 0.22, 7, S * 0.12); }
  } else {
    for (let i = 0; i < 5; i++) {
      const cx = S * (0.25 + 0.5 * r()), cy = S * (0.25 + 0.5 * r()), a = r() * PI, l = S * (0.16 + 0.1 * r());
      x.fillStyle = css(base.clone().lerp(top, r())); x.beginPath(); x.ellipse(cx, cy, l, l * 0.45, a, 0, 2 * PI); x.fill();
    }
  }
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace;
  return t;
}

// Grass: two crossed upright cards, base at y = 0, normals up (lit like the ground). Leaves and needles: one card centred on its point.
// Both faces of a card keep this normal (the materials undo DoubleSide's back-face flip), so a card seen from behind is lit alike.
function cardGeometry(kind: FoliageKind, [w, h]: [number, number]) {
  let g: BufferGeometry;
  if (kind === "grass") {
    const a = new PlaneGeometry(w, h, 1, 3).translate(0, h / 2, 0), b = a.clone().rotateY(PI / 2), n0 = a.attributes.position.count;
    g = new THREE.BufferGeometry();
    for (const k of ["position", "normal", "uv"]) {
      const x = a.attributes[k], y = b.attributes[k], d = new Float32Array(x.array.length * 2); d.set(x.array); d.set(y.array, x.array.length);
      g.setAttribute(k, new THREE.BufferAttribute(d, x.itemSize));
    }
    g.setIndex([...a.index!.array, ...Array.from(b.index!.array, i => i + n0)]);
    const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  } else g = new PlaneGeometry(w, h);
  const p = g.attributes.position, bend = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) bend[i] = kind === "grass" ? (p.getY(i) / h) ** 2 : 1;
  g.setAttribute("folBend", new THREE.BufferAttribute(bend, 1));
  return g;
}

/** Instanced, wind-swayed, alpha-cut grass (default), leaf or conifer-needle cards at `points` (default `sow(options)`), seeded. */
export function foliage(options: FoliageOptions = {}): Foliage {
  const kind = options.kind ?? "grass", o: FoliageOptions = { seed: 1, wind: [1, 0.3], sunColor: 0xfff1d6, ...KINDS[kind], ...options };
  const points = o.points ?? sow(o), seed = o.seed!, r = tex.rng(seed * 31 + 7), phase = new Vector2(r() * 2 * PI, r() * 2 * PI);
  const base = new Color(o.color!), top = new Color(o.tip!), wind = new Vector2(...o.wind!).normalize(), fade = o.fade ?? [1e8, 1e9];
  const geometry = cardGeometry(kind, o.size!), map = cardTexture(kind, seed, base, top);
  const params: MeshStandardMaterialParameters = { map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85, ...o.material };
  const values = { time: 0, strength: o.strength!, speed: o.speed!, wind, phase, fade: new Vector2(...fade),
    sun: new Vector3(0.3, 1, 0.2).normalize(), sunColor: new Color(o.sunColor!), back: o.backlight! };
  const own = ownNodes(THREE);
  let { u, material } = own ? nodeFoliage(own.NodeMaterial, own.T, params, values) : glslFoliage(params, values);
  material.color.set(0xffffff);
  if (o.material?.color !== undefined) material.color.set(o.material.color);

  const mesh = new InstancedMesh(geometry, material, points.length) as unknown as Foliage, M = new Matrix4(), q = new Quaternion(), E = new Euler(), v = new Vector3(), sc = new Vector3();
  const at = new Float32Array(points.length * 4);
  points.forEach((p, i) => {
    mesh.setMatrixAt(i, M.compose(v.set(p.x, p.y, p.z), q.setFromEuler(E.set(p.rx ?? 0, p.ry, p.rz ?? 0)), sc.set(p.s * (p.sx ?? 1), p.s, p.s * (p.sz ?? 1))));
    at.set([p.x, p.y, p.z, r()], i * 4);
  });
  geometry.setAttribute("folBase", new InstancedBufferAttribute(at, 4));
  mesh.name = kind;
  mesh.frustumCulled = false; // the instances span far more than the card geometry's bounds
  if (!own) nodesOnWebGPU(mesh, (NodeMaterial, T) => {
    const f = nodeFoliage(NodeMaterial, T, params, Object.fromEntries(Object.entries(u).map(([k, x]) => [k, x.value])) as typeof values);
    u = f.u;
    return f.material;
  });
  Object.assign(mesh, { kind, points, time: 0 });
  const sun = o.sun, light = new Vector3(), target = new Vector3();
  const readSun = () => {
    if (!sun) return;
    if (Array.isArray(sun)) u.sun.value.set(...sun).normalize();
    else {
      sun.getWorldPosition(light); const t = (sun as any).target as Object3D | undefined;
      (t ? t.getWorldPosition(target) : target.set(0, 0, 0)); u.sun.value.copy(light.sub(target)).normalize();
      if ((sun as any).color) u.sunColor.value.copy((sun as any).color);
    }
  };
  readSun();
  mesh.update = t => { mesh.time = t; u.time.value = t; readSun(); };
  mesh.sway = (x, z, t = mesh.time) => {
    const wx = x + mesh.position.x, wz = z + mesh.position.z, ts = t * o.speed!;
    const s = o.strength! * (0.55 + 0.35 * Math.sin(ts * 1.7 - (wx * wind.x + wz * wind.y) * 0.4 + phase.x) + 0.1 * Math.sin(ts * 4.3 + (-wx * wind.y + wz * wind.x) * 0.9 + phase.y));
    return [wind.x * s, wind.y * s];
  };
  mesh.thin = share => { mesh.count = Math.round(points.length * Math.min(1, Math.max(0, share))); };
  return mesh;
}

type Values = { time: number; strength: number; speed: number; wind: Vector2; phase: Vector2; fade: Vector2; sun: Vector3; sunColor: Color; back: number };

function glslFoliage(params: MeshStandardMaterialParameters, values: Values): { u: Record<string, any>; material: MeshStandardMaterial } {
  const u = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, { value: v }])) as Record<string, any>;
  const material = new MeshStandardMaterial(params);
  material.onBeforeCompile = shader => {
    for (const [k, v] of Object.entries(u)) shader.uniforms[`uFol_${k}`] = v;
    shader.vertexShader = `attribute float folBend;\nattribute vec4 folBase;\nuniform float uFol_time, uFol_strength, uFol_speed;\nuniform vec2 uFol_wind, uFol_phase, uFol_fade;\nvarying vec3 vFolWorld;\n${shader.vertexShader}`
      .replace("#include <project_vertex>", `
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
    shader.fragmentShader = `uniform vec3 uFol_sun, uFol_sunColor;\nuniform float uFol_back;\nvarying vec3 vFolWorld;\n${shader.fragmentShader}`
      .replace("#include <normal_fragment_begin>", `#include <normal_fragment_begin>
        #ifdef DOUBLE_SIDED
        normal *= faceDirection; nonPerturbedNormal = normal;
        #endif`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * uFol_sunColor * uFol_back * pow(max(dot(normalize(vFolWorld - cameraPosition), uFol_sun), 0.0), 4.0);`);
  };
  material.customProgramCacheKey = () => "paprika3d-foliage";
  return { u, material };
}

function nodeFoliage(NodeMaterial: any, T: any, params: MeshStandardMaterialParameters, values: Values): { u: Record<string, any>; material: MeshStandardMaterial } {
  const u: Record<string, any> = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, T.uniform(v)]));
  const material = new NodeMaterial(params);
  const at = T.attribute("folBase", "vec4"), bend = T.attribute("folBend", "float");
  const bw = T.modelWorldMatrix.mul(T.vec4(at.xyz, 1)).xyz;
  const k = T.float(1).sub(T.smoothstep(u.fade.x, u.fade.y, bw.distance(T.cameraPosition))).mul(1.2).sub(at.w).mul(5).clamp(0, 1);
  const along = bw.xz.dot(u.wind), across = bw.xz.dot(T.vec2(u.wind.y.negate(), u.wind.x)), ts = u.time.mul(u.speed);
  const s = u.strength.mul(T.float(0.55).add(T.sin(ts.mul(1.7).sub(along.mul(0.4)).add(u.phase.x)).mul(0.35)).add(T.sin(ts.mul(4.3).add(across.mul(0.9)).add(u.phase.y)).mul(0.1)));
  const p = at.xyz.add(T.positionLocal.sub(at.xyz).mul(k));
  material.positionNode = p.add(T.vec3(u.wind.x, 0, u.wind.y).mul(s.mul(bend).mul(k)));
  material.normalNode = T.normalViewGeometry;
  material.emissiveNode = T.diffuseColor.rgb.mul(u.sunColor).mul(u.back).mul(T.pow(T.max(T.positionWorld.sub(T.cameraPosition).normalize().dot(u.sun), 0), 4));
  return { u, material };
}
