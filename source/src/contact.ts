export interface Contact { depth: number; radius: number; reach: number; peer: string; frame: number }

/** Bounds once, then anchor transforms for at most 64 peers; later bone or instance motion is not tracked, and multi-instance meshes are skipped. */
export const CONTACT = `(subject) => {
  if (!subject) return null;
  let Box3;
  // a mesh drawn many times is many bodies (a ring of walls, a crowd, GPU-placed instances): its joint bounds are no one body.
  // WebGPU instances a plain Mesh by mesh.count, an InstancedBufferGeometry by instanceCount and an indirect draw by its buffer
  const many = p => p.isBatchedMesh || p.isInstancedMesh && p.count !== 1 || p.count > 1 || p.geometry?.indirect
    || p.geometry?.isInstancedBufferGeometry && p.geometry.instanceCount !== 1;
  const body = o => {
    let mesh, largest = -1;
    o.updateWorldMatrix(true, true);
    o.traverseVisible(p => {
      if (!p.isMesh || !p.geometry || many(p)) return;
      p.geometry.computeBoundingBox();
      Box3 ??= p.geometry.boundingBox?.constructor;
      if (!Box3) return;
      const bounds = p.geometry.boundingBox.clone().applyMatrix4(p.matrixWorld);
      const volume = (bounds.max.x - bounds.min.x) * (bounds.max.y - bounds.min.y) * (bounds.max.z - bounds.min.z);
      if (volume > largest) { mesh = p; largest = volume; }
    });
    if (!mesh) return 0;
    const b = new Box3();
    o.traverse(p => {
      if (!p.isMesh || !p.geometry || many(p)) return;
      if (p.isSkinnedMesh || p.isInstancedMesh) { p.computeBoundingBox(); b.union(p.boundingBox.clone().applyMatrix4(p.matrixWorld)); }
      else { p.geometry.computeBoundingBox(); b.union(p.geometry.boundingBox.clone().applyMatrix4(p.matrixWorld)); }
    });
    const offset = mesh.worldToLocal(b.getCenter(mesh.position.clone()));
    return { r: Math.min(b.max.x - b.min.x, b.max.z - b.min.z) / 2, h: (b.max.y - b.min.y) / 2, offset, mesh };
  };
  const ownBody = body(subject), own = ownBody?.r, ownH = ownBody?.h;
  if (!(own > 0) || !Number.isFinite(own)) return null;
  const pick = parent => {
    const peers = [];
    for (const o of (parent?.children ?? []).slice(0, 512)) {
      if (o === subject || o === subject.parent || !o.visible) continue;
      const b = body(o), r = b?.r;
      // a flat thing on the ground (a warning ring, a shadow blob, a decal) is a marking the subject crosses, not a body
      if (Number.isFinite(r) && r >= own * 0.5 && r <= own * 2 && b.h > r * 0.1) peers.push({ o, ...b });
      if (peers.length === 64) break;
    }
    return peers;
  };
  let peers = pick(subject.parent);
  if (!peers.length) peers = pick(subject.parent?.parent);
  let deepest = null;
  return {
    sample: (x, z, frame) => {
      ownBody.mesh.updateWorldMatrix(true, false);
      const centre = ownBody.offset.clone().applyMatrix4(ownBody.mesh.matrixWorld);
      for (const { o, r, h, offset, mesh } of peers) {
        if (!o.visible) continue;
        mesh.updateWorldMatrix(true, false);
        const other = offset.clone().applyMatrix4(mesh.matrixWorld);
        if (Math.abs(centre.y - other.y) >= ownH + h) continue; // one is above the other: a jump over it is no overlap
        const depth = own + r - Math.hypot(centre.x - other.x, centre.z - other.z);
        if (depth > 0 && (!deepest || depth > deepest.depth)) deepest = { depth, radius: Math.min(own, r), reach: own + r, peer: o.name || o.type, frame };
      }
    },
    result: () => deepest,
  };
}`;

export function contactText(name: string, c?: Contact | null): string | undefined {
  if (!c || !(c.radius > 0) || !Number.isFinite(c.depth) || c.depth <= c.radius) return;
  return `Contact: ${name} overlapped ${c.peer} by ${+c.depth.toPrecision(3)} units (${Math.round(c.depth / c.radius * 100)}% of the smaller body radius) at frame ${c.frame}; register contact when bodies touch (reach ≈ ${+c.reach.toPrecision(3)} units), not after deep overlap.`;
}
