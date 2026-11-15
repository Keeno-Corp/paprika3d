---
name: threejs-to-unreal
description: Export a three.js scene to Unreal Engine 5 - a .glb whose manifest lists what the import drops (custom shaders, postprocessing, particles, game code) with each one's Unreal stand-in, and a Python script that imports it into a level. paprika3d's eval and fx.js handoff.
---

# Move a three.js scene into Unreal

An asset and scene handoff, not a port: meshes, PBR materials, textures, instancing, skins, animations, lights and cameras carry over as glTF; game code, input, UI, audio and physics are rebuilt in Unreal. With the page open, two `eval` calls write it (`../threejs-game/references/fx.md`):

```js
// eval { save: "export/scene.glb" }
const { handoff } = await import("./fx.js"); return handoff(scene, { animations: clips, renderer, composer });
// eval { save: "export/import_unreal.py" }
const { unrealScript } = await import("./fx.js"); return unrealScript();
```

The reply's `handoff:` line names each dropped feature. The manifest (`asset.extras.paprika3d`) lists the named objects, fog, tone mapping, exposure and bloom, and per dropped feature where it was and its Unreal stand-in. What is on the page when `handoff` runs is what Unreal gets.

In the Unreal Editor (5.4 or later), `py "<project>/export/import_unreal.py"` in the Output Log, or through the Unreal MCP's Python tool, imports it into the open level with Interchange, tags the named actors, adds a PostProcessVolume and fog, saves, and prints a `paprika3d {...}` JSON line: matched, missing, to rebuild.

If `eval` is not among your tools, the paprika3d MCP server is not installed: it runs as `npx -y paprika3d serve` (stdio), and https://paprika3d.com/docs/install?ref=skill has each agent's line.
