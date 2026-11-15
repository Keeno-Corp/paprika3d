// post: post-processing in one call, for either renderer. On a WebGPURenderer (WebGPU or its WebGL 2 backend) it builds
// a RenderPipeline from three's TSL nodes; on a WebGLRenderer, an EffectComposer from three's passes. Effects: bloom,
// depth of field (`dof`), ambient occlusion (`ao`), motion blur (`motion`), colour grading (`grade`) and a vignette.
// With no options it is the cheap look most games want (half-resolution bloom, a light grade, a vignette); ao, dof and
// motion cost a full-screen pass or more each, so they run only when named. Bloom's threshold is on the tone-mapped colour
// (what the picture shows), so a bright sky keeps its colour (dev #352); a transparent canvas stays transparent. The passes load on first call from the
// page's own three (its import map's `three/addons/`, and `three/tsl` on WebGPU), so fx.js links on any page; until they
// have loaded, and if they fail, `render` draws the scene plainly. Bundlers never see the composer's passes (dev #347), so a
// bundled WebGLRenderer page hands them over as `addons`. `enabled = false` draws it plainly too (to compare).
// RenderPipeline comes from the page's `three` when that is three.webgpu.js, else from its `three/webgpu`. A page that
// already draws through its own RenderPipeline passes it as `input`: the effects go after its output instead of a fresh
// scene pass, which would drop the page's own passes (fog, outlines).
//   const fx = post(renderer, scene, camera, { bloom: 0.8, vignette: true });
//   renderer.setAnimationLoop(() => fx.render());   // in place of renderer.render(scene, camera)
import { Object3D, Vector2, Vector3, type Camera, type ColorRepresentation, type Scene } from "three";

export type PostOptions = {
  bloom?: boolean | number | { strength?: number; radius?: number; threshold?: number }; // a number is the strength
  dof?: boolean | { focus?: number | Object3D; range?: number; blur?: number }; // focus: metres from the camera, or an object to keep sharp
  ao?: boolean | number | { radius?: number; intensity?: number }; // a number is the intensity
  motion?: boolean | number; // motion blur, a number scales it
  grade?: boolean | { contrast?: number; saturation?: number; brightness?: number; tint?: ColorRepresentation };
  vignette?: boolean | number; // a number is its darkness, 0..1
  input?: any; // WebGPURenderer only: the page's own RenderPipeline (or a TSL colour node) to put the effects after
  addons?: Record<string, any>; // WebGLRenderer in a bundle: the composer's pass classes by name ({ EffectComposer, RenderPass, ... })
};

export type Post = {
  /** Draws one frame: the scene through the effects. Call it where the game called `renderer.render(scene, camera)`. */
  render(): void;
  /** Resolves once the passes have loaded and `render` draws through them (or `error` says why it never will). */
  ready: Promise<Post>;
  /** "pipeline" (TSL RenderPipeline), "composer" (EffectComposer), or null while loading or after an error. */
  backend: "pipeline" | "composer" | null;
  error: string | null;
  enabled: boolean;
  /** Depth of field's focus: metres from the camera, or an object it keeps sharp (followed every frame). */
  focus: number | Object3D;
  /** The three.js objects behind each effect (BloomNode or UnrealBloomPass, ...), to tune further. */
  passes: Record<string, any>;
  dispose(): void;
};

const pick = <T extends object>(v: unknown, number: keyof T, base: T): T | null =>
  v === undefined || v === false || v === null ? null : { ...base, ...(typeof v === "number" ? { [number]: v } : typeof v === "object" ? v : {}) };

const GRADE = /* glsl */ `
uniform sampler2D tDiffuse; uniform float contrast, saturation, brightness, vignette; uniform vec3 tint; varying vec2 vUv;
void main() {
  vec4 c = texture2D(tDiffuse, vUv);
  vec3 g = (c.rgb - 0.5) * contrast + 0.5 + brightness;
  g = mix(vec3(dot(g, vec3(0.2126, 0.7152, 0.0722))), g, saturation) * tint;
  g *= 1.0 - smoothstep(0.3, 0.85, length(vUv - 0.5) * 1.4142) * vignette;
  gl_FragColor = vec4(g, c.a);
}`;

const plainError = (message: string) => Object.assign(new Error(message), { plain: true });

// three.module.js has no RenderPipeline (THREE.RenderPipeline is not a constructor), and a WebGPU page may map bare
// `three` to it and take WebGPURenderer from `three/webgpu`; both builds share three.core.js, so the classes match
async function webgpu(): Promise<any> {
  const three: any = await import("three");
  if (three.RenderPipeline) return three;
  try { return await import("three/webgpu" as string); } catch {
    throw plainError(`the page's "three" has no RenderPipeline (it is three.module.js) and its import map has no "three/webgpu"; map "three/webgpu" (or "three") to three.webgpu.js`);
  }
}

// a variable specifier, which bundlers leave alone: the passes import UniformsUtils from bare three, which a bundle that
// maps it to three.webgpu.js lacks, so a literal one broke that bundle's build (dev #347); a bundled WebGL page passes
// them as `addons`
const composerPass = (name: string) => {
  const path = `three/addons/postprocessing/${name}.js`;
  return import(/* @vite-ignore */ /* webpackIgnore: true */ path).catch(() => { throw plainError(
    `${path} did not load: map "three/addons/" in the import map, or in a bundled page import the passes and pass them, addons: { EffectComposer, RenderPass, OutputPass, ShaderPass, UnrealBloomPass } (with BokehPass, GTAOPass, AfterimagePass for dof, ao, motion)`); });
};

/** Post-processing for `renderer`'s view of `scene`; see the file's header. */
export function post(renderer: any, scene: Scene, camera: Camera, options?: PostOptions): Post {
  const { input: given, addons, ...picked } = options ?? {};
  const o: PostOptions = Object.keys(picked).length ? picked : { bloom: true, grade: true, vignette: true };
  const addon = (name: string) => addons?.[name] ? Promise.resolve({ [name]: addons[name] }) : composerPass(name);
  const own = given?.isRenderPipeline ? given : null, input = own ? own.outputNode : given;
  const plain = own ? () => own.render() : () => renderer.render(scene, camera);
  const bloom = pick(o.bloom, "strength", { strength: 0.5, radius: 0.4, threshold: 0.85 });
  const dof = pick(o.dof, "focus" as any, { focus: 10 as number | Object3D, range: 6, blur: 1 });
  const ao = pick(o.ao, "intensity", { radius: 0.5, intensity: 1 });
  const motion = o.motion === undefined || o.motion === false ? 0 : o.motion === true ? 1 : o.motion;
  const grade = pick(o.grade, "contrast" as any, { contrast: 1.06, saturation: 1.08, brightness: 0, tint: 0xffffff as ColorRepresentation });
  const vignette = o.vignette === undefined || o.vignette === false ? 0 : o.vignette === true ? 0.35 : o.vignette;

  let draw: (() => void) | null = null, dispose = () => {};
  const at = new Vector3();
  const focusDistance = () => typeof p.focus === "number" ? p.focus : camera.getWorldPosition(at).distanceTo((p.focus as Object3D).getWorldPosition(new Vector3()));
  const p: Post = {
    render() { if (p.enabled && draw) draw(); else plain(); },
    ready: null as any, backend: null, error: null, enabled: true, focus: dof?.focus ?? 10, passes: {},
    dispose() { draw = null; dispose(); },
  };

  const pipeline = async () => {
    if (given && !input?.isNode) throw plainError("input is the page's RenderPipeline or a TSL colour node");
    const THREE = await webgpu(); // first: three.tsl.js itself imports "three/webgpu"
    const [T, B, D, A, M] = await Promise.all([
      import("three/tsl") as Promise<any>,
      bloom && import("three/addons/tsl/display/BloomNode.js" as string),
      dof && import("three/addons/tsl/display/DepthOfFieldNode.js" as string),
      ao && import("three/addons/tsl/display/GTAONode.js" as string),
      motion && import("three/addons/tsl/display/MotionBlur.js" as string),
    ]);
    // depth and velocity for ao, dof and motion still come from a scene pass of post's own, which draws the scene again
    const scenePass = (!input || ao || dof || motion) && T.pass(scene, camera, ao ? { samples: 0 } : {}); // GTAO gathers depth, which a multisampled depth texture cannot
    if (motion) scenePass.setMRT(T.mrt({ output: T.output, velocity: T.velocity }));
    let color = input ?? scenePass.getTextureNode("output");
    const transformed = own?.outputColorTransform === false; // the page's output node already tone-maps
    if (ao) {
      const n = A.ao(scenePass.getTextureNode("depth"), null, camera); n.resolutionScale = 0.5; n.radius.value = ao.radius; p.passes.ao = n;
      color = T.vec4(color.rgb.mul(T.mix(T.float(1), n.getTextureNode().sample(T.screenUV).r, ao.intensity)), color.a);
    }
    if (dof) { const f = T.uniform(focusDistance()); p.passes.focus = f; color = p.passes.dof = D.dof(color, scenePass.getViewZNode(), f, dof.range, dof.blur); }
    if (motion) color = M.motionBlur(T.convertToTexture(color), scenePass.getTextureNode("velocity").mul(motion * 0.5), T.int(8));
    if (bloom) { // threshold what the picture shows (after exposure and tone mapping), so a bright sky does not bloom into itself (dev #352)
      const exposure = p.passes.exposure = T.uniform(renderer.toneMappingExposure); // the bloom's own passes reset the renderer's
      const shown = transformed ? color.rgb : T.toneMapping(renderer.toneMapping, exposure, color.rgb);
      const lit = T.smoothstep(bloom.threshold, bloom.threshold + 0.01, T.luminance(shown.rgb));
      const n = p.passes.bloom = B.bloom(T.vec4(color.rgb.mul(lit), color.a), bloom.strength, bloom.radius, 0);
      color = T.vec4(color.rgb.add(n.rgb), color.a);
    }
    const rp = new THREE.RenderPipeline(renderer);
    if (grade || vignette) {
      const g = grade ?? { contrast: 1, saturation: 1, brightness: 0, tint: 0xffffff };
      const out = transformed ? color : T.renderOutput(color); let c = out.rgb;
      c = T.saturation(c.sub(0.5).mul(g.contrast).add(0.5 + g.brightness), g.saturation).mul(T.color(g.tint));
      c = c.mul(T.float(1).sub(T.smoothstep(0.3, 0.85, T.screenUV.sub(0.5).length().mul(Math.SQRT2)).mul(vignette)));
      rp.outputColorTransform = false; rp.outputNode = T.vec4(c, out.a); // keeps a transparent canvas
    } else { rp.outputColorTransform = !transformed; rp.outputNode = color; }
    p.passes.pipeline = rp; dispose = () => rp.dispose();
    draw = () => { if (p.passes.focus) p.passes.focus.value = focusDistance(); if (p.passes.exposure) p.passes.exposure.value = renderer.toneMappingExposure; rp.render(); };
    p.backend = "pipeline";
  };

  const composer = async () => {
    if (given) throw plainError("input needs a WebGPURenderer (on a WebGLRenderer, add passes to fx.passes.composer)");
    const [{ EffectComposer }, { RenderPass }, { OutputPass }, { ShaderPass }, B, D, A, M] = await Promise.all([
      addon("EffectComposer"), addon("RenderPass"), addon("OutputPass"), addon("ShaderPass"),
      bloom && addon("UnrealBloomPass"), dof && addon("BokehPass"), ao && addon("GTAOPass"), motion && addon("AfterimagePass")]);
    const THREE3 = await import("three"), { Color } = THREE3;
    const size = renderer.getSize(new Vector2()), c = new EffectComposer(renderer), gl = renderer.getContext();
    c.renderTarget1.samples = c.renderTarget2.samples = gl.getParameter(gl.SAMPLES); // its targets have no MSAA of their own (dev #352)
    c.addPass(new RenderPass(scene, camera));
    if (ao) { const a = p.passes.ao = new A.GTAOPass(scene, camera, size.x, size.y); a.blendIntensity = ao.intensity; a.updateGtaoMaterial({ radius: ao.radius }); c.addPass(a); }
    if (dof) { const maxblur = 0.01 * dof.blur; c.addPass(p.passes.dof = new D.BokehPass(scene, camera, { focus: focusDistance(), aperture: maxblur / dof.range, maxblur })); }
    if (motion) c.addPass(p.passes.motion = new M.AfterimagePass(Math.min(0.92, 0.6 + 0.15 * motion)));
    if (bloom) c.addPass(p.passes.bloom = shownThreshold(THREE3, new B.UnrealBloomPass(size.clone(), bloom.strength, bloom.radius, bloom.threshold)));
    c.addPass(new OutputPass());
    if (grade || vignette) {
      const g = grade ?? { contrast: 1, saturation: 1, brightness: 0, tint: 0xffffff };
      c.addPass(p.passes.grade = new ShaderPass({
        uniforms: { tDiffuse: { value: null }, contrast: { value: g.contrast }, saturation: { value: g.saturation }, brightness: { value: g.brightness }, tint: { value: new Color(g.tint) }, vignette: { value: vignette } },
        vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: GRADE,
      }));
    }
    p.passes.composer = c; dispose = () => c.dispose();
    const last = new Vector2(), now = new Vector2();
    draw = () => {
      renderer.getSize(now);
      if (!now.equals(last)) { last.copy(now); c.setPixelRatio(renderer.getPixelRatio()); c.setSize(now.x, now.y); }
      if (p.passes.dof) p.passes.dof.uniforms.focus.value = focusDistance();
      if (p.passes.bloom) p.passes.bloom.shown(renderer);
      c.render();
    };
    p.backend = "composer";
  };

  p.ready = (renderer.isWebGPURenderer ? pipeline() : composer()).then(() => p, (e: Error & { plain?: boolean }) => {
    p.error = e?.plain ? `fx post: ${e.message}; the scene draws without effects`
      : `fx post: ${e?.message ?? e}. The page's import map needs "three/addons/" (and "three/tsl" with WebGPU); the scene draws without effects`;
    console.error(p.error);
    return p;
  });
  return p;
}


// UnrealBloomPass's high pass compares the scene's linear colour to the threshold; this one compares the colour the
// picture shows, after the renderer's exposure and tone mapping (as the OutputPass applies them), like the pipeline.
const MAPPINGS: Record<string, string> = { Linear: "LINEAR", Reinhard: "REINHARD", Cineon: "CINEON", ACESFilmic: "ACES_FILMIC", AgX: "AGX", Neutral: "NEUTRAL" };
function shownThreshold(THREE: any, pass: any) {
  const m = pass.materialHighPassFilter, define = (n: string) => `${MAPPINGS[n]}_TONE_MAPPING`;
  m.toneMapped = false; m.uniforms.toneMappingExposure = { value: 1 };
  m.fragmentShader = `#include <tonemapping_pars_fragment>
vec3 shown(vec3 c) {
${Object.keys(MAPPINGS).map((n, i) => `#${i ? "elif" : "if"} defined(${define(n)})\n  return ${n}ToneMapping(c);`).join("\n")}
#else
  return c;
#endif
}
${m.fragmentShader.replace("luminance( texel.xyz )", "luminance( shown( texel.rgb ) )")}`;
  let last: unknown;
  pass.shown = (renderer: any) => {
    m.uniforms.toneMappingExposure.value = renderer.toneMappingExposure;
    if (renderer.toneMapping === last) return;
    last = renderer.toneMapping; m.defines = {};
    const n = Object.keys(MAPPINGS).find(n => THREE[`${n}ToneMapping`] === last);
    if (n) m.defines[define(n)] = "";
    m.needsUpdate = true;
  };
  return pass;
}
