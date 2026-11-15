/** Runs in the page; group clones sharing geometry rather than naming every player. */
export const SKINNED_SCALE = `(() => {
  const scene = window.__harness.mainScene(), groups = new Map();
  if (!scene) return [];
  scene.updateMatrixWorld(true);
  const axes = o => {
    const e = o.matrixWorld.elements;
    return [0, 4, 8].map(i => Math.hypot(e[i], e[i + 1], e[i + 2]));
  };
  const uneven = a => a.every(Number.isFinite) && Math.max(...a) > 1.05 * Math.min(...a);
  scene.traverseVisible(mesh => {
    if (!mesh.isSkinnedMesh || !mesh.skeleton?.bones.length) return;
    const bones = new Set(mesh.skeleton.bones), parents = new Set();
    for (const bone of bones) if (!bones.has(bone.parent) && bone.parent) parents.add(bone.parent);
    const driver = [...parents, mesh].find(o => uneven(axes(o)));
    if (!driver) return;
    let holder = driver;
    // The highest uneven ancestor names the holder, not an unnamed GLTF armature beneath it.
    while (holder.parent && uneven(axes(holder.parent))) holder = holder.parent;
    const scale = axes(holder), key = mesh.geometry;
    const group = groups.get(key);
    if (group) group.count++;
    else groups.set(key, { count: 1, name: mesh.name || mesh.geometry?.name || 'unnamed', holder: holder.name || holder.type, scale });
  });
  return [...groups.values()].map(g => \`Skinned scale: \${g.count} SkinnedMesh (\${g.name}) under non-uniform world scale \${g.scale.map(n => +n.toPrecision(3)).join(' : ')} (holder '\${g.holder}'); this distorts limbs as they rotate; scale evenly.\`);
})()`;
