// The TSL path for fx's materials on a WebGPURenderer page whose bare `three` is three.module.js (WebGPURenderer from
// `three/webgpu`, #313): that namespace has no node materials, and water() and foliage() are synchronous, so they start
// on their onBeforeCompile material, which WebGPURenderer ignores (a flat sea, still grass). On the mesh's first frame
// under a WebGPURenderer the node classes are resolved (the material class from the renderer's own library, TSL from
// `three/webgpu`, else `three/tsl`) and the node material takes the old one's place before the next frame; under the
// harness the paused clock waits for that. A WebGLRenderer never loads either module.
import type { Material, Object3D } from "three";

// a Material's own settings a page may have changed between the call and the first frame
const CARRY = ["name", "color", "roughness", "metalness", "map", "emissive", "emissiveIntensity", "envMap", "envMapIntensity",
  "side", "transparent", "opacity", "alphaTest", "depthTest", "depthWrite", "visible", "wireframe", "flatShading"] as const;

let tsl: Promise<any> | undefined;
const loadTSL = () => tsl ??= import("three/webgpu" as string).then((m: any) => m.TSL ?? m)
  .catch(() => import("three/tsl" as string))
  .catch(() => { console.error(`fx: this WebGPU page's "three" is three.module.js and its import map has neither "three/webgpu" nor "three/tsl", so water() and foliage() keep their WebGL shaders, which WebGPURenderer draws flat; map "three/webgpu" (or "three") to three.webgpu.js`); return null; });

/** The node classes when bare `three` is three.webgpu.js, else null (see the file's header). */
export const ownNodes = (THREE: any): { NodeMaterial: any; T: any } | null =>
  THREE.MeshStandardNodeMaterial && THREE.TSL ? { NodeMaterial: THREE.MeshStandardNodeMaterial, T: THREE.TSL } : null;

/** Puts `build`'s node material on `mesh` once a WebGPURenderer draws it; `build` gets the node classes and the material
    it replaces. A WebGLRenderer keeps the material it has. */
export function nodesOnWebGPU(mesh: Object3D & { material: Material | Material[] }, build: (NodeMaterial: any, T: any, old: Material) => Material): void {
  const before = mesh.onBeforeRender;
  mesh.onBeforeRender = function (renderer: any, ...rest: any[]) {
    mesh.onBeforeRender = before;
    (before as any).call(this, renderer, ...rest);
    if (!renderer?.isWebGPURenderer) return;
    const swap = loadTSL().then(T => {
      if (!T) return;
      const NodeMaterial = renderer.library?.getMaterialNodeClass?.("MeshStandardMaterial") ?? T.MeshStandardNodeMaterial;
      const old = mesh.material as Material, next: any = build(NodeMaterial, T, old);
      const o = old as any;
      next.setValues(Object.fromEntries(CARRY.filter(k => o[k] !== undefined && k in next).map(k => [k, o[k]])));
      mesh.material = next;
      old.dispose();
    });
    (globalThis as any).__clock?.hold?.(swap);
  };
}
