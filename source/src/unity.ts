// `unity_export`: the open page's main scene as a Unity project. The page writes the GLB (geo/dist/unity.js, three's
// GLTFExporter, at the frame the page is on) and says what cannot carry over; this side writes the project around it:
// glTFast as the importer, an editor script that builds the Unity scene from the GLB on the first open (hidden objects,
// camera, background, fog, ambient light), GameState.cs from observe(), and PORTING.md, what is left to port by hand.
// Nothing here runs Unity; the GLB is loaded back in the page and counted.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import type { Game } from "./browser.ts";
import { FIRST } from "./look.ts";

const BUNDLE = resolve(import.meta.dirname, "..", "geo/dist/unity.js");
export const GLTFAST = "6.20.0"; // com.unity.cloud.gltfast for Unity 6000.0 LTS and newer
const UNITY = "6000.0"; // the oldest editor that version takes

type Fog = { mode: "linear"; color: string; near: number; far: number } | { mode: "exp2"; color: string; density: number };
interface Scene {
  glb: string; bytes: number; meshes: number; triangles: number; back: { meshes: number; triangles: number };
  lights: number; skinned: number; instanced: number; clips: number; camera: string | null; hidden: string[];
  background: string; fog: Fog | null; ambient: { flat: string } | { sky: string; ground: string };
  lost: { kind: string; names: string[] }[]; describe: Record<string, unknown> | null; state: unknown;
}

const fmt = (n: number) => n.toLocaleString("en-US");
const mb = (b: number) => b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`;
/** A C# / Unity identifier: "my game!" is MyGame, "3d" is _3d. */
export const pascal = (s: string) => {
  const p = s.replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").filter(Boolean).map(w => w[0]!.toUpperCase() + w.slice(1)).join("");
  return !p ? "Game" : /^\d/.test(p) ? `_${p}` : p;
};
const KEYWORDS = new Set("abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using virtual void volatile while".split(" "));
const field = (k: string) => { const f = k.replace(/[^A-Za-z0-9_]/g, "_").replace(/^(?=\d)/, "_") || "_"; return KEYWORDS.has(f) ? `@${f}` : f; };
const str = (s: string) => JSON.stringify(s); // a JSON string is a valid C# regular string literal for what observe() holds
const num = (n: number) => `${Number.isFinite(n) ? n : 0}f`;

/** observe()'s JSON as [Serializable] C# classes with its values as the defaults: numbers are floats, arrays Lists. */
export function gameState(state: unknown): string {
  const classes: string[] = [];
  const type = (v: unknown, key: string, path: string): { t: string; init: string } => {
    if (typeof v === "number") return { t: "float", init: num(v) };
    if (typeof v === "boolean") return { t: "bool", init: String(v) };
    if (typeof v === "string") return { t: "string", init: str(v) };
    if (Array.isArray(v)) {
      const first = v.find(x => x !== null);
      if (first === undefined) return { t: "List<float>", init: "new List<float>() /* empty in observe(): set its element type */" };
      const e = type(first, key.replace(/ies$/, "y").replace(/s$/, "") || key, path);
      const items = v.every(x => typeof x === typeof first && typeof x !== "object") ? v.map(x => type(x, key, path).init).join(", ") : "";
      return { t: `List<${e.t}>`, init: `new List<${e.t}>${items ? ` { ${items} }` : "()"}` };
    }
    if (v && typeof v === "object") { const name = klass(v as Record<string, unknown>, pascal(key)); return { t: name, init: `new ${name}()` }; }
    return { t: "string", init: "null /* null in observe(): set its type */" };
  };
  const taken = new Set<string>();
  const klass = (o: Record<string, unknown>, want: string): string => {
    let name = want; for (let i = 2; taken.has(name); i++) name = `${want}${i}`;
    taken.add(name);
    const lines = Object.entries(o).map(([k, v]) => { const { t, init } = type(v, k, name); return `        public ${t} ${field(k)} = ${init};`; });
    classes.push(`    [Serializable]\n    public class ${name}\n    {\n${lines.join("\n")}\n    }`);
    return name;
  };
  if (state && typeof state === "object" && !Array.isArray(state)) klass(state as Record<string, unknown>, "GameState");
  else classes.push(`    [Serializable]\n    public class GameState\n    {\n        // the page had no window.__game.observe() to read; put the game's state here\n    }`);
  return `// The game's state as window.__game.observe() returned it when paprika3d's unity_export ran, its values as the
// defaults. Port the code that changes it into MonoBehaviours that hold one of these.
using System;
using System.Collections.Generic;

namespace Paprika3d
{
${[...classes.slice(-1), ...classes.slice(0, -1)].join("\n\n")}
}
`;
}

function importer(name: string, s: Scene): string {
  const glb = `Assets/${name}/${name}.glb`, scene = `Assets/${name}/${name}.unity`;
  const fog = !s.fog ? "            RenderSettings.fog = false;"
    : s.fog.mode === "linear" ? `            RenderSettings.fog = true; RenderSettings.fogMode = FogMode.Linear; RenderSettings.fogColor = Hex(${str(s.fog.color)});\n            RenderSettings.fogStartDistance = ${num(s.fog.near)}; RenderSettings.fogEndDistance = ${num(s.fog.far)};`
    : `            RenderSettings.fog = true; RenderSettings.fogMode = FogMode.ExponentialSquared; RenderSettings.fogColor = Hex(${str(s.fog.color)}); RenderSettings.fogDensity = ${num(s.fog.density)};`;
  const ambient = "flat" in s.ambient ? `            RenderSettings.ambientMode = AmbientMode.Flat; RenderSettings.ambientLight = Hex(${str(s.ambient.flat)});`
    : `            RenderSettings.ambientMode = AmbientMode.Trilight; RenderSettings.ambientSkyColor = Hex(${str(s.ambient.sky)});\n            RenderSettings.ambientEquatorColor = Color.Lerp(Hex(${str(s.ambient.sky)}), Hex(${str(s.ambient.ground)}), 0.5f); RenderSettings.ambientGroundColor = Hex(${str(s.ambient.ground)});`;
  return `// Written by paprika3d's unity_export. On the project's first open it builds ${scene} from ${name}.glb, which
// glTFast imports: the objects hidden in the page start inactive, the page's camera is the main camera, and its
// background, fog and ambient light are set as the page had them. Menu paprika3d > Rebuild scene runs it again; in batch
// mode, -executeMethod Paprika3d.PaprikaImport.Build.
using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;

namespace Paprika3d
{
    [InitializeOnLoad]
    public static class PaprikaImport
    {
        const string Glb = ${str(glb)}, ScenePath = ${str(scene)};
        static readonly string[] Hidden = { ${s.hidden.map(str).join(", ")} };

        static PaprikaImport()
        {
            if (Application.isBatchMode || File.Exists(ScenePath)) return;
            EditorApplication.delayCall += Build;
        }

        static Color Hex(string hex) { ColorUtility.TryParseHtmlString(hex, out var c); return c; }

        [MenuItem("paprika3d/Rebuild scene")]
        public static void Build()
        {
            PlayerSettings.colorSpace = ColorSpace.Linear; // three.js lights and shades in linear space
            AssetDatabase.ImportAsset(Glb, ImportAssetOptions.ForceSynchronousImport);
            var model = AssetDatabase.LoadAssetAtPath<GameObject>(Glb);
            if (model == null)
            {
                Debug.LogError("paprika3d: " + Glb + " did not import: check that com.unity.cloud.gltfast resolved in Window > Package Manager");
                if (Application.isBatchMode) EditorApplication.Exit(1);
                return;
            }
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var root = (GameObject)PrefabUtility.InstantiatePrefab(model);
            foreach (var t in root.GetComponentsInChildren<Transform>(true))
                if (Array.IndexOf(Hidden, t.name) >= 0) t.gameObject.SetActive(false);
            var cam = ${s.camera ? `root.GetComponentsInChildren<Camera>(true).FirstOrDefault(c => c.name == ${str(s.camera)}) ?? ` : ""}root.GetComponentInChildren<Camera>(true);
            if (cam == null) cam = new GameObject("Main Camera").AddComponent<Camera>();
            cam.tag = "MainCamera";
            if (cam.GetComponent<AudioListener>() == null) cam.gameObject.AddComponent<AudioListener>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = Hex(${str(s.background)});
${fog}
${ambient}
            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
            Debug.Log("paprika3d: built " + ScenePath + " from " + Glb);
        }
    }
}
`.replace("using System;\n", s.camera ? "using System;\nusing System.Linq;\n" : "using System;\n");
}

function porting(name: string, s: Scene, game: Game, lost: string[]): string {
  const d = s.describe ?? {};
  const controls = d.controls === undefined ? "" : `\n## Controls (describe())\n\n\`\`\`json\n${JSON.stringify(d.controls, null, 2)}\n\`\`\`\n`;
  return `# Porting ${d.name ?? name} to Unity

Exported by paprika3d's \`unity_export\` from ${game.url}. Open this folder in Unity ${UNITY} or newer (Unity Hub > Add > Add
project from disk). On the first open the Package Manager fetches glTFast ${GLTFAST}, glTFast imports
\`Assets/${name}/${name}.glb\`, and \`Assets/${name}/Editor/PaprikaImport.cs\` builds \`Assets/${name}/${name}.unity\`.

## What came over

${fmt(s.meshes)} meshes (${fmt(s.triangles)} triangles), their hierarchy, names and transforms, PBR materials and textures,
${s.lights} light${s.lights === 1 ? "" : "s"} (KHR_lights_punctual), ${s.clips} animation clip${s.clips === 1 ? "" : "s"}, ${s.skinned} skinned and ${s.instanced} instanced mesh${s.instanced === 1 ? "" : "es"},
the camera, background colour, fog and ambient light. Colour space is Linear. Physics colliders and bodies are not in the GLB.

## What did not

${lost.length ? lost.map(l => `- ${l}`).join("\n") : "- nothing the export could see; post-processing passes, if the page has any, are not in the scene"}

## What to port by hand

- The game loop: \`requestAnimationFrame\` code becomes MonoBehaviour \`Update\`, with \`Time.deltaTime\` for the frame time.
- Input: \`keydown\` / \`event.code\` handlers become the Input System's actions.
- State: \`Assets/${name}/Scripts/GameState.cs\` holds what \`observe()\` returned; move the code that changes it.
- Physics: Rapier or cannon bodies become Rigidbody and Collider components on the imported objects.
- UI and sound: HTML overlays become uGUI or UI Toolkit, Web Audio becomes AudioSources.
- Look: post-processing becomes a URP Volume; check light brightness against the page (three uses physical units).
${controls}`;
}

/** Writes the Unity project for the open page into `out` (relative to cwd; default paprika3d/unity/<Name>). */
export async function unityExport(game: Game, cwd: string, o: { out?: string; name?: string } = {}): Promise<{ text: string; failed?: true }> {
  const s = await game.queue(async () => {
    if (!await game.page.evaluate("!!__harness.main()?.[1].screen")) await game.page.evaluate(FIRST);
    if (!await game.page.evaluate("!!window.__unityExport")) await game.page.evaluate(readFileSync(BUNDLE, "utf8"));
    return await game.page.evaluate("window.__unityExport()") as Scene;
  });
  const name = pascal(o.name ?? (String(s.describe?.name ?? "") || basename(cwd)));
  const dir = resolve(cwd, o.out ?? join("paprika3d/unity", name)), at = relative(cwd, dir) || ".";
  const assets = join(dir, "Assets", name);
  for (const d of ["Packages", `Assets/${name}/Editor`, `Assets/${name}/Scripts`]) mkdirSync(join(dir, d), { recursive: true });
  const fresh = !existsSync(join(dir, "Packages/manifest.json"));
  if (fresh) writeFileSync(join(dir, "Packages/manifest.json"), JSON.stringify({ dependencies: { "com.unity.cloud.gltfast": GLTFAST } }, null, 2) + "\n");
  if (!existsSync(join(dir, ".gitignore"))) writeFileSync(join(dir, ".gitignore"), "Library/\nTemp/\nLogs/\nobj/\nUserSettings/\n*.csproj\n*.sln\n");
  writeFileSync(join(assets, `${name}.glb`), Buffer.from(s.glb, "base64"));
  writeFileSync(join(assets, "Editor/PaprikaImport.cs"), importer(name, s));
  writeFileSync(join(assets, "Scripts/GameState.cs"), gameState(s.state));
  const lost = s.lost.map(l => `${l.kind} (${l.names.slice(0, 3).join(", ")}${l.names.length > 3 ? `, ${l.names.length - 3} more` : ""})`);
  writeFileSync(join(dir, "PORTING.md"), porting(name, s, game, lost));

  const same = s.back.meshes >= s.meshes && s.back.triangles === s.triangles;
  return { text: [
    `Wrote a Unity project to ${at}/ (Unity ${UNITY}+: Unity Hub > Add > Add project from disk): Assets/${name}/${name}.glb (${mb(s.bytes)}, ${fmt(s.meshes)} meshes, ${fmt(s.triangles)} triangles, ${s.lights} light${s.lights === 1 ? "" : "s"}, ${s.clips} clip${s.clips === 1 ? "" : "s"}), Editor/PaprikaImport.cs, which builds Assets/${name}/${name}.unity on the first open, Scripts/GameState.cs from ${s.state ? "observe()" : "nothing (no __game.observe())"}, ${fresh ? `Packages/manifest.json (glTFast ${GLTFAST})` : "the existing Packages/manifest.json"} and PORTING.md, what is left to port by hand.`,
    same ? `Loaded back in the page, the GLB has all ${fmt(s.triangles)} triangles.` : `Loaded back in the page, the GLB has ${fmt(s.back.meshes)} meshes and ${fmt(s.back.triangles)} triangles of the scene's ${fmt(s.meshes)} and ${fmt(s.triangles)}: something did not export (the lines below, or the page's console).`,
    lost.length ? `Does not carry over:\n${lost.map(l => `- ${l}`).join("\n")}` : "Nothing the export can see is lost; gameplay code, input and physics are ported by hand (PORTING.md).",
    `Not opened in Unity here; to check it headless: Unity -batchmode -quit -projectPath ${at} -executeMethod Paprika3d.PaprikaImport.Build -logFile -`,
  ].join("\n"), ...same ? {} : { failed: true as const } };
}
