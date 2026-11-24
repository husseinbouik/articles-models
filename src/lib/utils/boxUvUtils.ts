import * as THREE from "three";

/**
 * Size and placement of one box within the door it belongs to. `centerX` and
 * `centerY` are the box's offset from the door's centre — the same values
 * passed to the mesh's `position` — so a box that is the whole door has a
 * centre of 0, 0.
 */
export type BoxPlacement = {
  width: number;
  height: number;
  depth: number;
  centerX?: number;
  centerY?: number;
};

/**
 * Overall door dimensions that every box maps against.
 */
export type DoorExtent = {
  width: number;
  height: number;
};

/**
 * ExtrudeGeometry builds its UVs from raw model-space coordinates — a vertex
 * 350mm from the centre gets u = 350, not a normalized fraction. That samples
 * the texture in a completely different coordinate system from the boxes
 * around it, which is why an extruded frame never matches the panel behind it.
 *
 * This re-derives the UVs from each vertex's actual position, normalized
 * against the door's extent, so an extruded shape becomes a window onto the
 * same door-wide texture that applyDoorBoxUVs maps boxes to. Front and back
 * faces map by x/y; the extruded side walls fall out of the same projection,
 * which keeps the grain running along the door's height axis.
 *
 * `centerX` / `centerY` are the mesh's own offset from the door's centre, so
 * the texture stays anchored to the door rather than to the shape.
 */
export function applyDoorExtrudeUVs(
  geometry: THREE.BufferGeometry,
  door: DoorExtent,
  centerX: number = 0,
  centerY: number = 0,
): void {
  const positionAttribute = geometry.getAttribute("position");
  const uvAttribute = geometry.getAttribute("uv");
  if (!positionAttribute || !uvAttribute) return;

  const doorWidth = door.width > 0 ? door.width : 1;
  const doorHeight = door.height > 0 ? door.height : 1;

  for (let i = 0; i < positionAttribute.count; i++) {
    // Shift from shape-local space into door space, then normalize so the
    // door's left edge is u = 0 and its right edge is u = 1.
    const x = positionAttribute.getX(i) + centerX;
    const y = positionAttribute.getY(i) + centerY;
    uvAttribute.setXY(i, x / doorWidth + 0.5, y / doorHeight + 0.5);
  }

  uvAttribute.needsUpdate = true;
}

/**
 * BoxGeometry lays its faces out in a fixed order, each with the same
 * normalized 0→1 UV square. That makes the texture stretch to whatever aspect
 * ratio the face happens to have — a 30mm frame bar and the 700mm panel behind
 * it each get their own full copy, at wildly different scales.
 *
 * This maps every box as a *window onto one texture stretched across the whole
 * door*. A door built from five boxes — a back panel and four frame bars —
 * reads as if it were cut from a single sheet: the grain lines up across every
 * joint, and the frame matches the panel behind it. A door that is one box
 * gets exactly one copy of the texture on its front, which is the same result.
 *
 * The edges take a proportional slice of that same mapping, so nothing is
 * squeezed: an 18mm edge shows the 18mm-worth of texture that sits beside it.
 * Every face keeps its grain running along the door's height axis; the top and
 * bottom edges are rotated 90° so they do not run sideways against the rest.
 *
 * Face order in BoxGeometry is +X, -X, +Y, -Y, +Z, -Z, four vertices each.
 */
export function applyDoorBoxUVs(
  geometry: THREE.BoxGeometry,
  box: BoxPlacement,
  door: DoorExtent,
): void {
  const uvAttribute = geometry.getAttribute("uv");
  if (!uvAttribute) return;

  const { width, height, depth, centerX = 0, centerY = 0 } = box;
  const doorWidth = door.width > 0 ? door.width : width;
  const doorHeight = door.height > 0 ? door.height : height;

  // The box's footprint within the door, in 0→1 texture space. A full-size
  // box spans 0→1; a 30mm frame bar spans the sliver of texture it covers.
  const spanU = doorWidth > 0 ? width / doorWidth : 1;
  const spanV = doorHeight > 0 ? height / doorHeight : 1;
  // Offsets convert the box's centre-relative position into a texture origin.
  const originU = doorWidth > 0 ? (centerX - width / 2) / doorWidth + 0.5 : 0;
  const originV = doorHeight > 0 ? (centerY - height / 2) / doorHeight + 0.5 : 0;

  // Edge faces are measured against the same door-wide scale as the front, so
  // their texture density matches rather than stretching to the edge's shape.
  const edgeU = doorWidth > 0 ? depth / doorWidth : 0;
  const edgeV = doorHeight > 0 ? depth / doorHeight : 0;

  // `swap` exchanges the two UV axes before scaling, rotating the texture 90°.
  const faces: Array<{ span: number[]; origin: number[]; swap: boolean }> = [
    // +X / -X (left & right edges): thin slice wide, full box height.
    { span: [edgeU, spanV], origin: [originU, originV], swap: false },
    { span: [edgeU, spanV], origin: [originU, originV], swap: false },
    // +Y / -Y (top & bottom edges): rotated so the grain follows the depth axis.
    { span: [edgeV, spanU], origin: [originV, originU], swap: true },
    { span: [edgeV, spanU], origin: [originV, originU], swap: true },
    // +Z / -Z (front & back faces): the box's window onto the door's texture.
    { span: [spanU, spanV], origin: [originU, originV], swap: false },
    { span: [spanU, spanV], origin: [originU, originV], swap: false },
  ];

  for (let face = 0; face < faces.length; face++) {
    const { span, origin, swap } = faces[face];
    const [scaleU, scaleV] = span;
    const [offsetU, offsetV] = origin;

    // Four vertices per face, already in 0→1 space — rescale in place.
    for (let corner = 0; corner < 4; corner++) {
      const index = face * 4 + corner;
      const baseU = uvAttribute.getX(index);
      const baseV = uvAttribute.getY(index);
      const sourceU = swap ? baseV : baseU;
      const sourceV = swap ? baseU : baseV;
      uvAttribute.setXY(
        index,
        sourceU * scaleU + offsetU,
        sourceV * scaleV + offsetV,
      );
    }
  }

  uvAttribute.needsUpdate = true;
}
