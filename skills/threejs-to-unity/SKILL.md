---
name: threejs-to-unity
description: Move a three.js game or scene into a Unity 6 project - the scene as a GLB with glTFast, a Unity scene built from it with the camera, fog and lights, the game state as C#, and a list of what does not carry over. paprika3d's unity_export tool.
---

# Move a three.js scene to Unity

`unity_export` needs a page open (`open`, then step it to the moment to export with `interact`'s `{ wait }`). It writes a
Unity project, `paprika3d/unity/<Name>` by default (`out` for another folder):

- `Assets/<Name>/<Name>.glb`: the scene at this frame, from three's GLTFExporter, loaded back in the page and counted.
- `Packages/manifest.json` with glTFast, Unity's glTF importer, and `Editor/PaprikaImport.cs`, which builds
  `<Name>.unity` on the first open: hidden objects inactive, the page's camera as the main camera, background, fog and
  ambient light as the page had them.
- `Scripts/GameState.cs`: `__game.observe()` as C# classes, its values as defaults.
- `PORTING.md`: what did not carry over and what to port by hand.

Read the reply's `Does not carry over:` lines before porting: custom shaders (`ShaderMaterial`, `onBeforeCompile`),
sprites, KTX2, canvas and video textures, and environment maps each need a Unity counterpart. Gameplay code, input and
physics are not converted: port them from the page's source with `PORTING.md` as the checklist. To keep animations,
leave each loaded GLTF's clips on its root (`root.animations = gltf.animations`).

If `unity_export` is not among your tools, the paprika3d MCP server is not installed: it runs as `npx -y paprika3d serve` (stdio), and https://paprika3d.com/docs/install?ref=skill has each agent's line.

Unity does not run here; the reply gives the batch command that builds the scene where Unity is installed. Check the
GLB's size and textures with `model_audit` (`../threejs-glb-audit/`), and fix the look in the page first with `look`
(the method: `../threejs-game/SKILL.md`).
