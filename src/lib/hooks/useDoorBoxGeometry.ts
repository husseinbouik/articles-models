import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { applyDoorBoxUVs, applyDoorExtrudeUVs } from "../utils/boxUvUtils";
import type { BoxPlacement, DoorExtent } from "../utils/boxUvUtils";

/**
 * Builds an ExtrudeGeometry whose UVs are a window onto the same door-wide
 * texture the boxes use, instead of ExtrudeGeometry's raw model-space UVs.
 * See applyDoorExtrudeUVs for the mapping itself.
 *
 * `centerX` / `centerY` are the mesh's offset from the door's centre.
 */
export function useDoorExtrudeGeometry(
  shape: THREE.Shape | null | undefined,
  extrudeSettings: THREE.ExtrudeGeometryOptions,
  door: DoorExtent,
  centerX: number = 0,
  centerY: number = 0,
): THREE.ExtrudeGeometry | null {
  // Serialized so a caller passing fresh object literals each render — the
  // normal way to call this — does not rebuild the geometry every time. The
  // values are read back inside the memo so the dependency list stays honest.
  const key = JSON.stringify([extrudeSettings, door, centerX, centerY]);

  const geometry = useMemo(() => {
    if (!shape) return null;
    const [settings, extent, offsetX, offsetY] = JSON.parse(key) as [
      THREE.ExtrudeGeometryOptions,
      DoorExtent,
      number,
      number,
    ];
    const built = new THREE.ExtrudeGeometry(shape, settings);
    applyDoorExtrudeUVs(built, extent, offsetX, offsetY);
    return built;
  }, [shape, key]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

  return geometry;
}

/**
 * Builds a BoxGeometry whose UVs are a window onto one texture spanning the
 * whole door, so every box in a multi-part door shares a continuous grain.
 * See applyDoorBoxUVs for the mapping itself.
 *
 * Returns geometries in the same order as `boxes`, and disposes the previous
 * set whenever the dimensions change so the GPU buffers do not leak.
 */
export function useDoorBoxGeometries(
  boxes: BoxPlacement[],
  door: DoorExtent,
): THREE.BoxGeometry[] {
  // Serialized so a caller passing a fresh array literal each render — the
  // normal way to call this — does not rebuild the geometry every time. The
  // values are read back inside the memo so the dependency list stays honest.
  const key = JSON.stringify([boxes, door]);

  const geometries = useMemo(() => {
    const [placements, extent] = JSON.parse(key) as [BoxPlacement[], DoorExtent];
    return placements.map((box) => {
      const geometry = new THREE.BoxGeometry(box.width, box.height, box.depth);
      applyDoorBoxUVs(geometry, box, extent);
      return geometry;
    });
  }, [key]);

  useEffect(
    () => () => geometries.forEach((geometry) => geometry.dispose()),
    [geometries],
  );

  return geometries;
}
