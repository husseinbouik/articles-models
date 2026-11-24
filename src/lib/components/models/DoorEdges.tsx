import { useMemo, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import type { CutShape } from "../handlers/HL01";

/**
 * Door edge outline, owned by the door and computed AFTER the cut.
 *
 * When a handler cuts the door, that material disappears and a NEW edge is left
 * behind. We draw the line on those edges: the door body as a full box, and
 * each cut's mouth/floor/walls — clipped to the door, so nothing draws where
 * the cut runs outside the door (no material there → no edge).
 *
 * Rendered with three's fat lines (LineSegments2 + LineMaterial): native
 * `lineBasicMaterial.linewidth` is ignored by most WebGL drivers (always 1px),
 * so we use LineMaterial which honors `linewidth` in screen pixels. This is
 * pure three/examples — NOT drei <Line>, which drags a 2nd copy of three into
 * the bundle and breaks THREE.MeshStandardMaterial.
 *
 * Box centered on origin: front face z = +depth/2, back face z = -depth/2.
 */
export function DoorEdges({
  width,
  height,
  depth,
  frontDepth,
  backDepth,
  frontLoops,
  frontFaceAtStep,
  cuts = [],
  color = "black",
  lineWidth = 1,
  opacity = 1,
  enabled,
}: {
  width: number;
  height: number;
  depth: number;
  /**
   * For FRAMED doors, pass frontDepth + backDepth. The door is then drawn as
   * two stacked slabs (a back panel + a raised front frame) instead of one box:
   *   back panel  spans z ∈ [-backDepth/2, +backDepth/2]   (centered at 0)
   *   front frame spans z ∈ [+backDepth/2, +backDepth/2 + frontDepth]
   * Front side gets its front face + depth edges; back side gets its back face
   * + depth edges; the shared step plane in the middle is not doubled.
   * Omit both for a plain slab (single box of `depth`).
   */
  frontDepth?: number;
  backDepth?: number;
  /**
   * Optional extra front-face outlines for doors whose front has additional
   * panels/shapes (e.g. an arched panel + a flat panel). Each loop is drawn at
   * the front face. `closed` (default true) connects the last point to the
   * first — set false for an open arc. `depthEdges` (default true) drops a line
   * from every vertex back to the step plane — set false for densely-sampled
   * curves (an arch), where per-point depth lines would look like hatching.
   * Door-local XY, centered on origin.
   */
  frontLoops?: {
    points: THREE.Vector2[];
    closed?: boolean;
    depthEdges?: boolean;
  }[];
  /**
   * For doors whose front frame only PARTIALLY covers the door (e.g. FA_8:
   * frame on right/top/bottom, left exposed). When true, the full door-front
   * rectangle is drawn on the BACK PANEL's front face (the visible surface
   * where no frame covers), and the raised frame bars come from frontLoops.
   */
  frontFaceAtStep?: boolean;
  cuts?: CutShape[];
  color?: string;
  lineWidth?: number;
  opacity?: number;
  enabled?: boolean;
}) {
  const size = useThree(s => s.size);
  const isEnabled = enabled ?? true;

  const verts = useMemo(() => {
    const out: number[] = [];

    const framed = frontDepth != null && backDepth != null;
    // Z planes. Slab: front=+d/2, back=-d/2. Framed: front frame top, the step
    // where frame meets panel, and the panel back.
    const fz = framed ? backDepth! / 2 + frontDepth! : depth / 2; // front face
    const stepZ = framed ? backDepth! / 2 : -depth / 2; // frame/panel junction
    const bz = framed ? -backDepth! / 2 : -depth / 2; // back face
    const hw = width / 2;
    const hh = height / 2;

    // Liang–Barsky: clip a 2D segment to the door rect; null if fully outside.
    const clipToDoor = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
    ): [number, number, number, number] | null => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      let t0 = 0;
      let t1 = 1;
      const p = [-dx, dx, -dy, dy];
      const q = [x0 - -hw, hw - x0, y0 - -hh, hh - y0];
      for (let i = 0; i < 4; i++) {
        if (p[i] === 0) {
          if (q[i] < 0) return null;
        } else {
          const r = q[i] / p[i];
          if (p[i] < 0) {
            if (r > t1) return null;
            if (r > t0) t0 = r;
          } else {
            if (r < t0) return null;
            if (r < t1) t1 = r;
          }
        }
      }
      return [x0 + t0 * dx, y0 + t0 * dy, x0 + t1 * dx, y0 + t1 * dy];
    };

    const seg = (x0: number, y0: number, x1: number, y1: number, z: number) =>
      out.push(x0, y0, z, x1, y1, z);

    const clippedSeg = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      z: number,
    ) => {
      const c = clipToDoor(x0, y0, x1, y1);
      if (c) out.push(c[0], c[1], z, c[2], c[3], z);
    };

    // Transform each cut shape into door-local polygons (front-face plane),
    // keeping its kind + depth.
    const cutData = cuts.map(cut => {
      const cos = Math.cos(cut.rotationRad);
      const sin = Math.sin(cut.rotationRad);
      const xform = (p: THREE.Vector2) =>
        new THREE.Vector2(p.x * cos - p.y * sin + cut.x, p.x * sin + p.y * cos + cut.y);
      const poly = cut.shape.getPoints(64).map(xform);
      // Curve endpoints = true corners of the shape (4 for a rectangle, etc.).
      // Used for depth edges so we don't draw 64 diagonal lines from arc samples.
      const corners = cut.shape.curves.map(curve => xform(curve.getPoint(0)));
      return { kind: cut.kind, cutDepth: cut.cutDepth, poly, corners };
    });
    // Any cut that overlaps the door border removes that border material, so
    // both "handle" (through) and "recess" (shallow) break the door edge where
    // they cross it. Only "capsule" (secondary recess, no outline) doesn't.
    const cutPolys: THREE.Vector2[][] = cutData
      .filter(c => c.kind === "handle" || c.kind === "recess" || c.kind === "slot")
      .map(c => c.poly);

    // Point-in-polygon (ray cast).
    const inPoly = (x: number, y: number, poly: THREE.Vector2[]) => {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x,
          yi = poly[i].y;
        const xj = poly[j].x,
          yj = poly[j].y;
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
      return inside;
    };
    const inAnyCut = (x: number, y: number) =>
      cutPolys.some(poly => inPoly(x, y, poly));

    // Draw a segment at z, but skip the parts that fall INSIDE a cut — the cut
    // removed that material, so the door edge is gone there.
    const segMinusCuts = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      z: number,
    ) => {
      if (cutPolys.length === 0) {
        out.push(x0, y0, z, x1, y1, z);
        return;
      }
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len2 = dx * dx + dy * dy;
      // Collect split params where the segment crosses any cut edge.
      const ts = [0, 1];
      for (const poly of cutPolys) {
        for (let i = 0; i < poly.length; i++) {
          const p = poly[i];
          const q = poly[(i + 1) % poly.length];
          const ex = q.x - p.x;
          const ey = q.y - p.y;
          const denom = dx * ey - dy * ex;
          if (Math.abs(denom) > 1e-9) {
            // Proper crossing.
            const t = ((p.x - x0) * ey - (p.y - y0) * ex) / denom;
            const u = ((p.x - x0) * dy - (p.y - y0) * dx) / denom;
            if (t > 1e-6 && t < 1 - 1e-6 && u >= -1e-6 && u <= 1 + 1e-6) {
              ts.push(t);
            }
          } else {
            // Parallel / collinear cut edge lying along the door edge: project
            // the cut edge's endpoints onto the door segment as split points,
            // so a cut whose border runs flush with the door edge still trims.
            for (const pt of [p, q]) {
              const tp = ((pt.x - x0) * dx + (pt.y - y0) * dy) / len2;
              if (tp > 1e-6 && tp < 1 - 1e-6) ts.push(tp);
            }
          }
        }
      }
      ts.sort((a, b) => a - b);
      // Inward normal (toward door center) to nudge the midpoint test off the
      // boundary, so a sub-span lying ON a cut's flush border reads as removed.
      const nx = -dy;
      const ny = dx;
      const nlen = Math.hypot(nx, ny) || 1;
      const inX = (-nx / nlen) * 0.5; // small nudge toward center
      const inY = (-ny / nlen) * 0.5;
      for (let i = 0; i < ts.length - 1; i++) {
        const ta = ts[i];
        const tb = ts[i + 1];
        if (tb - ta < 1e-6) continue;
        const tm = (ta + tb) / 2;
        let mx = x0 + tm * dx;
        let my = y0 + tm * dy;
        // nudge toward whichever side faces the door interior
        const towardCenterX = -Math.sign(mx) || 1;
        const towardCenterY = -Math.sign(my) || 1;
        if (inAnyCut(mx + Math.abs(inX) * towardCenterX, my + Math.abs(inY) * towardCenterY) || inAnyCut(mx, my)) continue;
        out.push(x0 + ta * dx, y0 + ta * dy, z, x0 + tb * dx, y0 + tb * dy, z);
      }
    };

    // --- Door body ---
    const corners: [number, number][] = [
      [-hw, -hh],
      [hw, -hh],
      [hw, hh],
      [-hw, hh],
    ];
    // Front face rectangle: broken where a cut eats through the door edge.
    // When the front frame only PARTIALLY covers the door (e.g. FA_8: frame on
    // right/top/bottom, left exposed), the full door-front rectangle belongs on
    // the BACK PANEL's front face (stepZ) — that's the visible surface where no
    // frame covers it. The raised frame bars are drawn separately via frontLoops
    // at the frame front (fz). For fully-framed doors, keep it at fz.
    const doorFrontZ = frontFaceAtStep && framed ? stepZ : fz;
    for (let i = 0; i < corners.length; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % corners.length];
      segMinusCuts(a[0], a[1], b[0], b[1], doorFrontZ);
    }
    // Back face rectangle: always solid. Handler cuts always leave material at
    // the back (MMs_TO_LEAVE_AT_BACK), so the back edge is never removed.
    for (let i = 0; i < corners.length; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % corners.length];
      seg(a[0], a[1], b[0], b[1], bz);
    }
    // Depth edges connecting front and back faces. For a framed door the front
    // frame and back panel are separate slabs that meet at stepZ, so each side
    // only runs to the step (no edge spans the full thickness, and the front
    // face / back face never share a vertical edge through the middle).
    // Extra front-face panel outlines (arched panel, flat panel, …): draw each
    // loop at the front face + depth edges from each vertex back to the step.
    if (frontLoops) {
      for (const loop of frontLoops) {
        const p = loop.points;
        const last = loop.closed === false ? p.length - 1 : p.length;
        for (let i = 0; i < last; i++) {
          const a = p[i];
          const b = p[(i + 1) % p.length];
          seg(a.x, a.y, b.x, b.y, fz);
        }
        if (loop.depthEdges !== false) {
          for (const v of p) out.push(v.x, v.y, fz, v.x, v.y, stepZ);
        }
      }
    }

    const inAnyVisibleCut = (x: number, y: number) =>
      cutData.filter(c => c.kind !== "capsule").some(c => inPoly(x, y, c.poly));
    for (const [cx, cy] of corners) {
      if (inAnyVisibleCut(cx, cy)) continue; // cut removed this corner — skip depth edge
      if (frontFaceAtStep && framed) {
        out.push(cx, cy, stepZ, cx, cy, bz);
      } else {
        out.push(cx, cy, fz, cx, cy, stepZ); // front frame depth (front → step)
        if (framed) {
          out.push(cx, cy, bz, cx, cy, stepZ); // back panel depth (back → step)
        }
      }
    }

    // --- Each cut outline ("capsule" gets none) ---
    for (const c of cutData) {
      if (c.kind === "capsule") continue;
      const pts = c.poly;

      if (c.kind === "slot") {
        // FA_3 decorative slot: floor outline + depth edges, no front outline.
        const floorZ = fz - c.cutDepth;
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i];
          const b = pts[(i + 1) % pts.length];
          clippedSeg(a.x, a.y, b.x, b.y, floorZ);
        }
        for (const p of c.corners) {
          if (p.x >= -hw - 0.1 && p.x <= hw + 0.1 &&
              p.y >= -hh - 0.1 && p.y <= hh + 0.1) {
            out.push(p.x, p.y, fz, p.x, p.y, floorZ);
          }
        }
      } else {
        // handle / recess: front-face mouth outline.
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i];
          const b = pts[(i + 1) % pts.length];
          clippedSeg(a.x, a.y, b.x, b.y, fz);
        }
      }
    }



    // Dedupe coincident segments. Many outlines share edges (frame bars meeting
    // each other, the opening outline lying on a bar edge), which stacks two
    // identical lines on the same spot — they z-fight and read as a broken
    // "jumping" line. Keep each unique segment once (order-independent).
    const deduped: number[] = [];
    const seen = new Set<string>();
    const q = (n: number) => Math.round(n * 100) / 100; // 0.01mm grid
    for (let i = 0; i < out.length; i += 6) {
      const a = [q(out[i]), q(out[i + 1]), q(out[i + 2])];
      const b = [q(out[i + 3]), q(out[i + 4]), q(out[i + 5])];
      // canonical order so (a→b) and (b→a) hash the same
      const ka = a.join(",");
      const kb = b.join(",");
      const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(out[i], out[i + 1], out[i + 2], out[i + 3], out[i + 4], out[i + 5]);
    }
    return deduped;
  }, [width, height, depth, frontDepth, backDepth, frontLoops, frontFaceAtStep, cuts]);

  const geometry = useMemo(() => {
    const g = new LineSegmentsGeometry();
    g.setPositions(verts);
    return g;
  }, [verts]);

  const material = useMemo(
    () => {
      const m = new LineMaterial({
        color: new THREE.Color(color).getHex(),
        linewidth: lineWidth, // in screen pixels (LineMaterial honors this)
        transparent: opacity < 1,
        opacity,
      });
      // Outlines sit on the EXACT front-face plane of the panel meshes, so line
      // and wood surface are coplanar → depth-fight: the line flickers and bleeds
      // through, and the constant depth-buffer ties cost extra fragment work.
      // Pulling the line's depth a hair toward the camera with polygonOffset
      // breaks the tie — pure GPU state, no extra geometry, so no perf cost.
      // The bias is tiny (depth-buffer-LSB scale), so a recessed outline stays
      // correctly occluded by any panel that sits in front of it.
      m.polygonOffset = true;
      m.polygonOffsetFactor = -1;
      m.polygonOffsetUnits = -1;
      return m;
    },
    [color, lineWidth, opacity],
  );

  // LineMaterial needs the viewport resolution to size the width correctly.
  // Must be in an effect — mutating it in the render body runs on every render
  // and can cause the renderer to re-evaluate state even under frameloop="demand".
  useEffect(() => {
    material.resolution.set(size.width, size.height);
  }, [material, size.width, size.height]);

  const line = useMemo(
    () => new LineSegments2(geometry, material),
    [geometry, material],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  if (!isEnabled) return null;
  return <primitive object={line} />;
}
