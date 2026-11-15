import type { Object3D, Material, AnimationClip } from "three";
import { bake } from "./bake.ts";
import { UNREAL_SCRIPT } from "./unreal.ts";

/** What a GLB from three.js keeps and loses on the way to a game engine, kept in its `asset.extras.paprika3d`. */
export interface Manifest {
  version: 1;
  three: string;
  units: string;
  objects: { name: string; kind: string; count?: number }[];
  animations: { name: string; seconds: number }[];
  post: { toneMapping?: number; exposure?: number; bloom?: { strength: number; radius: number; threshold: number }; fog?: { color: string; density?: number; near?: number; far?: number } };
  dropped: { what: string; where: string[]; unreal: string }[];
}

type Pass = { constructor: { name: string }; strength?: number; radius?: number; threshold?: number; enabled?: boolean };
interface HandoffOptions {
  animations?: AnimationClip[];
  /** the page's renderer, for its tone mapping and exposure */
  renderer?: { toneMapping?: number; toneMappingExposure?: number };
  /** the page's EffectComposer (or its passes), for bloom and the passes no engine file can carry */
  composer?: { passes: Pass[] } | Pass[];
}

const KIND = (o: any) => o.isInstancedMesh ? "instanced" : o.isSkinnedMesh ? "skinned" : o.isMesh ? "mesh" : o.isPoints ? "points" : o.isLine ? "line"
  : o.isSprite ? "sprite" : o.isLight ? "light" : o.isCamera ? "camera" : o.isBone ? "bone" : "group";
// what GLTFExporter writes as a glTF material, as itself or as metal-rough PBR
const GLTF_MATERIAL = new Set(["MeshStandardMaterial", "MeshPhysicalMaterial", "MeshBasicMaterial"]);
const label = (o: Object3D, i: number) => o.name || `${o.type}#${i}`;

/** `root` (a scene or subtree) as GLB bytes for a game engine to import, with a manifest in `asset.extras.paprika3d`: each
    named object, the animations, the renderer's look (tone mapping, exposure, bloom, fog) and what the file cannot carry
    with the engine feature that replaces it. Logs one line of what was dropped, so `eval { save }`'s reply says it. */
export async function handoff(root: Object3D, o: HandoffOptions = {}): Promise<ArrayBuffer> {
  const { REVISION, Material: M } = await import("three");
  const dropped = new Map<string, { where: string[]; unreal: string }>();
  const drop = (what: string, where: string, unreal: string) => {
    const d = dropped.get(what) ?? dropped.set(what, { where: [], unreal }).get(what)!;
    if (!d.where.includes(where) && d.where.length < 8) d.where.push(where);
  };
  const objects: Manifest["objects"] = [];
  let i = 0;
  root.traverse((x: any) => {
    const name = label(x, i++), kind = KIND(x);
    if (x.name && kind !== "bone") objects.push({ name: x.name, kind, ...x.isInstancedMesh && { count: x.count } });
    for (const m of ([] as Material[]).concat(x.material ?? []) as any[]) {
      if (m.isShaderMaterial || m.isRawShaderMaterial) drop("ShaderMaterial (custom GLSL)", name, "rebuild as a Material graph");
      else if (m.isNodeMaterial) drop("node material (TSL)", name, "rebuild as a Material graph");
      else if (!GLTF_MATERIAL.has(m.type) && !x.isPoints && !x.isLine && !x.isSprite) drop(`${m.type} (approximated as PBR)`, name, "check the imported Material Instance");
      if (m.onBeforeCompile !== M.prototype.onBeforeCompile) drop("onBeforeCompile shader edits", name, "rebuild as a Material graph");
    }
    if (x.isPoints || x.isSprite) drop("points and sprites (particles)", name, "a Niagara system");
    else if (x.isLine) drop("lines", name, "a spline or thin mesh");
    if (x.isHemisphereLight || x.isAmbientLight || x.isLightProbe) drop("ambient and hemisphere light", name, "a Sky Light");
    else if (x.isRectAreaLight) drop("RectAreaLight", name, "a Rect Light");
    else if ((x.isPointLight || x.isSpotLight) && x.decay !== 2) drop("light decay other than 2", name, "set the light's attenuation radius by eye");
    if (x.isMesh && x.morphTargetInfluences && Object.keys(x.geometry?.morphAttributes ?? {}).some(k => k !== "position" && k !== "normal")) drop("morph targets other than position and normal", name, "re-export from a DCC tool");
  });
  const scene = root as any, post: Manifest["post"] = {};
  if (scene.fog) post.fog = { color: "#" + scene.fog.color.getHexString(), ...scene.fog.isFogExp2 ? { density: scene.fog.density } : { near: scene.fog.near, far: scene.fog.far } };
  if (scene.background?.isTexture || scene.environment) drop("background and environment map", "scene", "an HDRI Backdrop or Sky Light cubemap");
  if (o.renderer) Object.assign(post, { toneMapping: o.renderer.toneMapping, exposure: o.renderer.toneMappingExposure });
  for (const p of (Array.isArray(o.composer) ? o.composer : o.composer?.passes ?? []).filter(p => p.enabled !== false)) {
    const n = p.constructor.name;
    if (n === "RenderPass" || n === "OutputPass") continue;
    if (/Bloom/.test(n)) post.bloom = { strength: p.strength ?? 1, radius: p.radius ?? 0, threshold: p.threshold ?? 0 };
    else drop(`${n} (postprocessing)`, "composer", "a PostProcessVolume setting or a post-process Material");
  }
  drop("game code, input, UI, audio and physics", "page", "Blueprints or C++ (the design doc says what each does)");
  const manifest: Manifest = {
    version: 1, three: `r${REVISION}`, units: "metres, Y up, as glTF; Unreal's importer converts to centimetres, Z up",
    objects, animations: (o.animations ?? []).map(a => ({ name: a.name, seconds: +a.duration.toFixed(3) })), post,
    dropped: [...dropped].map(([what, d]) => ({ what, ...d })),
  };
  const glb = withManifest(await bake(root, { animations: o.animations }), manifest);
  console.log(`handoff: ${objects.length} named objects; dropped: ${manifest.dropped.map(d => d.what).join("; ")}`);
  return glb;
}

/** The Unreal Editor Python that imports a `handoff` GLB into the open level (see the threejs-to-unreal skill). */
export const unrealScript = () => new Blob([UNREAL_SCRIPT], { type: "text/x-python" });

// the GLB with `manifest` in its JSON chunk's asset.extras, the chunk padded to 4 bytes with spaces as glTF requires
function withManifest(glb: ArrayBuffer, manifest: Manifest): ArrayBuffer {
  const view = new DataView(glb), jsonLength = view.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(glb, 20, jsonLength)));
  json.asset.extras = { ...json.asset.extras, paprika3d: manifest };
  let text = JSON.stringify(json);
  text += " ".repeat((4 - (new TextEncoder().encode(text).length % 4)) % 4);
  const chunk = new TextEncoder().encode(text), rest = new Uint8Array(glb, 20 + jsonLength);
  const out = new Uint8Array(20 + chunk.length + rest.length), ov = new DataView(out.buffer);
  out.set(new Uint8Array(glb, 0, 12));
  ov.setUint32(8, out.length, true);
  ov.setUint32(12, chunk.length, true);
  ov.setUint32(16, 0x4e4f534a, true);
  out.set(chunk, 20);
  out.set(rest, 20 + chunk.length);
  return out.buffer;
}
