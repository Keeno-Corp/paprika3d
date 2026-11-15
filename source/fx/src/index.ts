// @paprika3d/game-fx: what a three.js game or page otherwise gets from outside tools or hand-writes: sound effects
// synthesized in code (`sfx`), canvas textures (`tex`), particle bursts (`burst`), a first-load lighting and camera setup
// (`stage`), metre-scale texture coordinates (`uv`), rule-based placement (`place`), a reference picture's camera
// (`picture`), a subtree as GLB bytes (`bake`) and a scene as a GLB with a manifest for a game engine (`handoff`), and post-processing for either renderer (`post`). Pure JS, no files to load, and
// nothing reads `Math.random`.
export * from "./sfx.ts";
export * from "./tex.ts";
export * from "./burst.ts";
export * from "./stage.ts";
export * from "./uv.ts";
export * from "./place.ts";
export * from "./picture.ts";
export * from "./bake.ts";
export * from "./handoff.ts";
export * from "./trace.ts";
export * from "./water.ts";
export * from "./post.ts";
export * from "./foliage.ts";
