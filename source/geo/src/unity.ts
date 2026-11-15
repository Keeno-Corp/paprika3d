// `unity_export`'s script in the game's own page (src/unity.ts evaluates geo/dist/unity.js there once): the main scene as a
// GLB at the frame the page is on, with three's GLTFExporter, and what a Unity project cannot take from it. three is bundled
// here because a vite page has no bare "three" to import; the exporter reads the page's objects by their is* flags, and the
// one class it tests with instanceof (CompressedTexture) is taken off the materials first. The GLB is loaded back here to
// count what came through.
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

type View = { camera?: THREE.Camera; renderer?: THREE.WebGLRenderer };
type Page = Window & { __harness: { mainScene(): THREE.Scene; views: Map<THREE.Scene, View>; renderers: THREE.WebGLRenderer[] }; __game?: { describe?(): unknown; observe?(): unknown }; __unityExport?: typeof run };
const w = window as unknown as Page;

const SLOTS = ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap", "alphaMap", "bumpMap", "displacementMap", "lightMap", "envMap", "clearcoatMap", "clearcoatNormalMap", "clearcoatRoughnessMap", "sheenColorMap", "sheenRoughnessMap", "specularColorMap", "specularIntensityMap", "transmissionMap", "thicknessMap", "iridescenceMap", "iridescenceThicknessMap", "anisotropyMap"];
const PBR = new Set(["MeshStandardMaterial", "MeshPhysicalMaterial", "MeshBasicMaterial"]);
const hex = (c: THREE.Color) => "#" + new THREE.Color().copy(c).getHexString();
const tris = (o: THREE.Object3D) => {
  const m = o as THREE.Mesh, g = m.geometry;
  if (!m.isMesh || !g?.attributes?.position) return 0;
  return Math.floor((g.index?.count ?? g.attributes.position.count) / 3) * ((o as THREE.InstancedMesh).isInstancedMesh ? (o as THREE.InstancedMesh).count : 1);
};
const b64 = (buf: ArrayBuffer) => { const u = new Uint8Array(buf); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
const json = (f?: () => unknown) => { try { const v = f?.(); return v === undefined ? null : JSON.parse(JSON.stringify(v)); } catch { return null; } };

async function run() {
  const h = w.__harness, scene = h.mainScene();
  if (!scene) throw new Error("the page has no three.js scene to export (no frame drew one)");
  const view = h.views.get(scene) ?? {}, renderer = view.renderer ?? h.renderers[0];
  // what does not carry over, by kind, with up to three names each
  const lost = new Map<string, Set<string>>();
  const lose = (kind: string, name: string) => { const s = lost.get(kind) ?? new Set(); s.add(name || "(unnamed)"); lost.set(kind, s); };
  const undo: (() => void)[] = [], hidden: string[] = [], clips = new Map<string, THREE.AnimationClip>();
  let meshes = 0, triangles = 0, lights = 0, skinned = 0, instanced = 0, ambient = { color: new THREE.Color(0, 0, 0), sky: null as string | null, ground: null as string | null };
  let n = 0;
  scene.traverse(o => {
    for (const c of o.animations ?? []) clips.set(c.uuid, c);
    if (!o.visible) {
      if (!o.name) { const was = o.name; o.name = `hidden_${++n}`; undo.push(() => { o.name = was; }); }
      hidden.push(o.name);
    }
    const l = o as THREE.Light & { groundColor?: THREE.Color };
    if ((l as unknown as THREE.AmbientLight).isAmbientLight) ambient.color.add(new THREE.Color().copy(l.color).multiplyScalar(l.intensity));
    else if ((l as unknown as THREE.HemisphereLight).isHemisphereLight) { ambient.sky = hex(new THREE.Color().copy(l.color).multiplyScalar(l.intensity)); ambient.ground = hex(new THREE.Color().copy(l.groundColor!).multiplyScalar(l.intensity)); }
    else if (l.isLight) lights++;
    if ((o as THREE.Sprite).isSprite) lose("sprites, which glTF has no form for: use a SpriteRenderer or a quad in Unity", o.name);
    if ((o as THREE.Points).isPoints || (o as THREE.Line).isLine) lose("points and lines: Unity draws points one pixel wide and lines without width; use a ParticleSystem or LineRenderer", o.name);
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    meshes++; triangles += tris(o);
    if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinned++;
    if ((o as THREE.InstancedMesh).isInstancedMesh) instanced++;
    for (const mat of [m.material].flat() as (THREE.Material & Record<string, unknown>)[]) {
      if (!mat) continue;
      if ((mat as unknown as THREE.ShaderMaterial).isShaderMaterial) lose("custom shaders (ShaderMaterial): exported as a plain material; rebuild them in Shader Graph or HLSL", mat.name || o.name);
      else if (Object.prototype.hasOwnProperty.call(mat, "onBeforeCompile")) lose("patched shaders (onBeforeCompile): the base material carries over, the patch does not", mat.name || o.name);
      else if (!PBR.has(mat.type)) lose(`${mat.type}: turned into a PBR material; check its look`, mat.name || o.name);
      for (const k of SLOTS) {
        const t = mat[k] as THREE.Texture | null | undefined;
        if (!t?.isTexture) continue;
        if ((t as THREE.CompressedTexture).isCompressedTexture) { mat[k] = null; undo.push(() => { mat[k] = t; }); lose("compressed (KTX2) textures: left out; import the source images in Unity", mat.name || o.name); }
        else if ((t as THREE.VideoTexture).isVideoTexture) lose("video textures: this frame only; play the video with a VideoPlayer", mat.name || o.name);
        else if ((t as THREE.CanvasTexture).isCanvasTexture) lose("canvas textures: drawn as they are at this frame; redraw text that changes with TextMeshPro", mat.name || o.name);
        else if (k === "envMap") lose("per-material environment maps: set a reflection probe in Unity", mat.name || o.name);
      }
    }
  });
  if (scene.environment) lose("the scene's environment map (image-based light): set a skybox and reflection probe in Unity", "scene.environment");
  const bg = scene.background as THREE.Color | THREE.Texture | null;
  if (bg && !(bg as THREE.Color).isColor) lose("a background texture or sky: set a skybox in Unity", "scene.background");
  if (skinned && !clips.size) lose("skinned meshes with no clips on any object's .animations (keep gltf.animations on the loaded root, root.animations = gltf.animations, to export them)", `${skinned} skinned meshes`);
  const fog = scene.fog as (THREE.Fog & THREE.FogExp2) | null;

  // the view's camera goes into the GLB as MainCamera when it is not in the scene, so glTFast makes it a Unity Camera at the
  // same place (the axis change is glTFast's)
  const cam = view.camera;
  let camera: string | null = null;
  if (cam && ((cam as THREE.PerspectiveCamera).isPerspectiveCamera || (cam as THREE.OrthographicCamera).isOrthographicCamera)) {
    let inScene = false;
    for (let p: THREE.Object3D | null = cam!; p; p = p.parent) if (p === scene) inScene = true;
    if (inScene) camera = cam!.name || null;
    else {
      const c = (cam as THREE.PerspectiveCamera).clone();
      cam!.updateWorldMatrix(true, false);
      cam!.matrixWorld.decompose(c.position, c.quaternion, c.scale);
      c.name = "MainCamera"; c.visible = true;
      scene.add(c);
      undo.push(() => c.removeFromParent());
      camera = c.name;
    }
  }
  let glb: ArrayBuffer;
  try {
    glb = await new GLTFExporter().parseAsync(scene, { binary: true, onlyVisible: false, animations: [...clips.values()] }) as ArrayBuffer;
  } finally { for (const f of undo.reverse()) f(); }

  // loaded back, as Unity's importer will read it
  const back = (await new GLTFLoader().parseAsync(glb.slice(0), "")).scene;
  let backMeshes = 0, backTriangles = 0;
  back.traverse(o => { if ((o as THREE.Mesh).isMesh) { backMeshes++; backTriangles += tris(o); } });

  const clear = renderer ? hex(renderer.getClearColor(new THREE.Color())) : "#000000";
  return {
    glb: b64(glb), bytes: glb.byteLength, meshes, triangles, back: { meshes: backMeshes, triangles: backTriangles },
    lights, skinned, instanced, clips: clips.size, camera, hidden,
    background: bg && (bg as THREE.Color).isColor ? hex(bg as THREE.Color) : clear,
    fog: fog?.isFog ? { mode: "linear", color: hex(fog.color), near: fog.near, far: fog.far } : fog?.isFogExp2 ? { mode: "exp2", color: hex(fog.color), density: fog.density } : null,
    ambient: ambient.sky ? { sky: ambient.sky, ground: ambient.ground } : { flat: hex(ambient.color) },
    lost: [...lost].map(([kind, names]) => ({ kind, names: [...names] })),
    describe: json(w.__game?.describe?.bind(w.__game)), state: json(w.__game?.observe?.bind(w.__game)),
  };
}

w.__unityExport = run;
