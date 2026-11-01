# Model files: `model_audit` and `shrink`

`model_audit` reports what a website or a Shopify listing judges a `.glb` or `.gltf` on (a USD file too: [USD files](#usd-files)), for one file (`path`) or every one under a folder (the whole project when `path` is left out). It reads the file's JSON and its images' headers only, so a Draco or meshopt file needs no decoder:

```
models/chair.glb · 6.1 MB · 48,210 triangles · 3 materials · textures: 4096×4096 png, 1024×1024 jpeg · Draco no, meshopt no, KTX2 no
shopify: fails, 6.1 MB over about 4 MB; 4096×4096 texture over 2048
Fix: `model_audit` { path: "models/chair.glb", shrink: { textures: 2048 } } writes models/chair-opt.glb with each texture at most 2048 px (WebP; textures: false drops them); then `look` compare against a look saved before (save).
```

- Triangles come from the accessor counts in the JSON: indices (or positions) / 3 for triangle lists, count - 2 for strips and fans, none for points and lines (counted apart). Each mesh counts once per node that uses it in the default scene.
- A texture's size is read from its PNG, JPEG, WebP or KTX2 header; `?` means a format or a place it cannot read.
- `target: "site"` (the default) judges against the `site` budget of `perf`: 4 MB of assets, 200,000 triangles, textures of 2048 px by area (a 4096 × 1 lookup table passes). One file over 4 MB already fills a whole site's budget.
- `target: "shopify"` judges against Shopify's 3D model guidance: a GLB of about 4 MB, textures at most 2048 px on their longest side, no triangle limit.

## Fixing a file: `shrink`

`model_audit { path, shrink: { textures, out } }` rewrites one file: `textures: false` drops every texture (geometry only, for a model you colour yourself), a number caps each texture's longer side at that many pixels, re-encoded as WebP; `out` is the new file (`<name>-opt.glb` beside it by default, the file itself to replace it). The reply is the file before and after and the new verdict. A meshopt file stays meshopt (`GLTFLoader` needs `MeshoptDecoder`, from `three/addons/libs/meshopt_decoder.module.js`); a Draco file is refused. Shrink keeps every triangle: for fewer, pick a lower-poly model.

1. `look { save: "before" }` with the page showing the model.
2. `shrink`, and point the page at the new file.
3. `look { compare: "before" }`: the share of pixels that differ, and a diff picture. Keep the new file when the picture is the same.

Draco and KTX2 compression need outside tools and their loaders (`DRACOLoader`, `KTX2Loader`).

## USD files

three r183 and later load `.usd`, `.usda`, `.usdc` and `.usdz` with `USDLoader` (`USDZLoader` is deprecated):

```js
import { USDLoader } from "three/addons/loaders/USDLoader.js";
const usd = await new USDLoader().loadAsync("assets/chair.usdz"); // a Group; usd.animations holds its clips
scene.add(usd);
```

It reads meshes, UsdPreviewSurface, OpenPBR and MaterialX UsdPreviewSurface materials, textures, skinning and animation, cameras, lights, references, payloads and variants, and scales by `metersPerUnit`. It has no PointInstancer instancing and no blend shapes. It is newer than `GLTFLoader` (r183, January 2026) and still gets parser fixes each month. For a website, a GLB is smaller and every viewer reads it.

`model_audit` reports a USD file as it does a GLB (triangles, materials, textures; in a `.usdz`, the images packed in it), read by three's own USD parsers, so a file it cannot read is one `USDLoader` cannot load either. It counts each mesh once, so a mesh a file references or instances many times counts once. `shrink` rewrites glTF only: convert a USD file to GLB first (Blender's USD import, then its glTF export; or `usd2gltf`). `asset_search` `format: "usd"` finds models with a USD file, and `pick` with it saves that file with `USDLoader` code.

## Ready-made assets: `asset_search`

`asset_search` finds ready-made models (57,732, CC BY or CC0), PBR textures and HDRIs (CC0) in a hosted library, and puts the one picked into the project with its loading code at real-world scale and a model's credit line in `CREDITS.md` beside it. `textures: false` with a pick keeps a model's geometry only; `format: "usd"` finds and picks models with a USD file; `image` with `crop` searches by a piece of a reference picture, for a thing words miss. `geo.js` and `fx.js` are the options with nothing to download.

`save: "refs/assets/<thing>.jpg"` with a search writes its contact sheet to that file, numbered as the reply's lines are, for a person to look at in their own viewer.

## Where a thing comes from: four sources

| Source | What it gives | Time, cost |
|---|---|---|
| The library (`asset_search`) | 57,732 models (CC BY or CC0), PBR textures and HDRIs (CC0), by words or by a reference crop, at real size, credited in CREDITS.md | seconds, free |
| Free models on the web | CC0 and CC BY models from Poly Haven, ambientCG, Poly Pizza, Kenney, Quaternius, Sketchfab (download with a token) and others, the licence read on the asset's own page | minutes, free |
| Generation with the person's key | a GLB from a reference crop through `sheet` `kind: "model"` (fal, Meshy, Tripo; `sheet` with `check: true` names the keys found) | 1 to 5 minutes, about $0.05 to $0.40 a model |
| Code | `model_run` with three and Manifold, seen with `model_look`, saved as a GLB | minutes, free |

A model from a source usually looks better than one built in code, so the first `model_run` call that adds geometry in a project with no model search on record gets one line saying so at the top of its reply (once per project; the work is done either way). `searched` on `model_run` logs why a thing is built in code ("by design: terrain", "fox courier: nothing fit, all hits realistic") to `paprika3d/sourcing.json`, where `asset_search` logs its model searches too, and leaves the line out of that one call. A project's `LOOK.md` `## Assets` line, when there is one, gives the style filter every search uses (low-poly is `style: "low-poly"`, `maxTris: 5000`).

A web file in FBX or OBJ becomes a GLB in the modelling scene: `model_run` with `const m = await load("downloads/fox.fbx"); await save("assets/fox.glb", m)`, then `model_audit` on the GLB. Every file from the web or from generation goes through `model_audit` (size, triangles, textures) and one `model_look` before the page loads it, gets its height from the design (`m.scale.setScalar(height / size.y)`), and is credited in CREDITS.md with its name, its author (the creator's name as the asset's page gives it; CC BY requires it), its file URL, page URL and licence: `- Low Poly Fox by Jane Doe, CC BY 4.0 (https://...file.glb, from https://...page)`.
