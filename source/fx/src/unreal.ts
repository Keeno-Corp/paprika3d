// The Unreal Editor Python that `unrealScript()` writes: Epic's Interchange API (InterchangeManager.import_scene, as in
// the 5.7 Python reference), never the Unreal MCP's mesh ImportFile tool, which a public harness reports takes no GLB.
export const UNREAL_SCRIPT = String.raw`"""Imports a paprika3d handoff GLB (fx.js handoff) into the open Unreal level and applies its manifest.

Written by paprika3d. In the Unreal Editor's Output Log (Python), or through the Unreal MCP's Python tool:
    py "<project>/export/import_unreal.py" [scene.glb] [/Game/Folder]
The GLB defaults to scene.glb beside this file. Prints one JSON line: what was imported, matched and added.
"""
import json, os, re, struct, sys


def read_manifest(path):
    with open(path, "rb") as f:
        magic, _version, _length, json_length, kind = struct.unpack("<4sIIII", f.read(20))
        if magic != b"glTF" or kind != 0x4E4F534A:
            raise ValueError(path + " is not a GLB")
        return json.loads(f.read(json_length)).get("asset", {}).get("extras", {}).get("paprika3d", {})


def main(argv):
    here = os.path.dirname(os.path.abspath(globals().get("__file__", os.path.join(os.getcwd(), "x"))))
    glb = os.path.abspath(argv[0]) if argv else os.path.join(here, "scene.glb")
    dest = argv[1] if len(argv) > 1 else "/Game/" + re.sub(r"[^A-Za-z0-9_]", "_", os.path.splitext(os.path.basename(glb))[0])
    manifest = read_manifest(glb)

    import unreal
    actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    before = set(a.get_path_name() for a in actors.get_all_level_actors())
    manager = unreal.InterchangeManager.get_interchange_manager_scripted()
    params = unreal.ImportAssetParameters()
    params.is_automated = True
    params.replace_existing = True
    ok = manager.import_scene(dest, unreal.InterchangeManager.create_source_data(glb), params)
    manager.wait_until_all_tasks_done(False)
    new = [a for a in actors.get_all_level_actors() if a.get_path_name() not in before]

    names = set(o["name"] for o in manifest.get("objects", []))
    matched = set()
    for a in new:
        label = a.get_actor_label()
        name = label if label in names else re.sub(r"_\d+$", "", label)
        if name in names:
            matched.add(name)
            a.set_editor_property("tags", list(a.get_editor_property("tags")) + [unreal.Name("paprika3d")])

    post, added, problems = manifest.get("post", {}), [], []
    bloom = post.get("bloom")
    exposure = post.get("exposure")
    if bloom or exposure:
        volume = actors.spawn_actor_from_class(unreal.PostProcessVolume, unreal.Vector(0, 0, 0))
        volume.set_actor_label("paprika3d post")
        volume.set_editor_property("unbound", True)
        settings = volume.get_editor_property("settings")
        if bloom:
            settings.set_editor_property("override_bloom_intensity", True)
            settings.set_editor_property("bloom_intensity", float(bloom["strength"]))
            settings.set_editor_property("override_bloom_threshold", True)
            settings.set_editor_property("bloom_threshold", float(bloom["threshold"]))
        volume.set_editor_property("settings", settings)
        added.append("PostProcessVolume (bloom %s; set exposure by eye)" % ("on" if bloom else "off"))
    fog = post.get("fog")
    if fog:
        actor = actors.spawn_actor_from_class(unreal.ExponentialHeightFog, unreal.Vector(0, 0, 0))
        actor.set_actor_label("paprika3d fog")
        try:
            c = fog["color"].lstrip("#")
            colour = unreal.LinearColor(int(c[0:2], 16) / 255.0, int(c[2:4], 16) / 255.0, int(c[4:6], 16) / 255.0, 1.0)
            actor.get_editor_property("component").set_editor_property("fog_inscattering_luminance", colour)
        except Exception as e:
            problems.append("fog colour: %s" % e)
        added.append("ExponentialHeightFog (set its density by eye)")

    unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
    report = {
        "imported": bool(ok), "into": dest, "actors": len(new),
        "matched": len(matched), "missing": sorted(names - matched)[:20],
        "added": added, "problems": problems,
        "rebuild": [d["what"] + ": " + d["unreal"] for d in manifest.get("dropped", [])],
    }
    print("paprika3d " + json.dumps(report))
    return report


if __name__ == "__main__":
    main(sys.argv[1:])
`;
