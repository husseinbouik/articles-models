import * as THREE from "three";
import { Base } from "@react-three/csg";
import {
  useDoorBoxGeometries,
  useDoorExtrudeGeometry,
} from "../../hooks/useDoorBoxGeometry";

/**
 * Thickness of the inlay. Thin enough to read as a panel set into the frame
 * rather than a second slab, while still catching light on its own edges.
 */
export const INNER_PANEL_DEPTH = 3;

/**
 * The inner panel — a thin inlay that fills the opening a door's front frame
 * leaves, sitting on the back panel's face and behind the frame bars.
 *
 * It renders nothing when `material` is null, which is how an unset
 * `innerPanelMaterial` prop makes the panel disappear (see useDoorMaterials).
 *
 * Its texture is mapped as a window onto the same door-wide texture the rest
 * of the door uses, so a grained material lines up with the frame around it
 * instead of restarting inside the opening.
 */
export function InnerPanel({
  material,
  width,
  height,
  door,
  centerX = 0,
  centerY = 0,
  z,
  asCSG = false,
}: {
  /** Null means no panel — nothing is rendered. */
  material: THREE.Material | null;
  width: number;
  height: number;
  /** Overall door extent the texture maps against. */
  door: { width: number; height: number };
  centerX?: number;
  centerY?: number;
  /** Z centre of the panel, in door-local space. */
  z: number;
  /**
   * Render as a CSG <Base> (only valid inside a <Geometry>) or a standalone
   * mesh. Defaults to a standalone mesh: a <Base> outside a <Geometry> reads a
   * null CSG context and crashes the renderer, so the safe form is the default
   * and callers must opt in to CSG.
   */
  asCSG?: boolean;
}) {
  // Hooks must run unconditionally, so the geometry is built even when the
  // panel will not be rendered. A zero-size panel is skipped below.
  const [geometry] = useDoorBoxGeometries(
    [
      {
        width: Math.max(0, width),
        height: Math.max(0, height),
        depth: INNER_PANEL_DEPTH,
        centerX,
        centerY,
      },
    ],
    door,
  );

  if (!material || width <= 0 || height <= 0) return null;

  const position: [number, number, number] = [centerX, centerY, z];

  if (asCSG) {
    return <Base material={material} geometry={geometry} position={position} />;
  }
  return (
    <mesh
      material={material}
      geometry={geometry}
      position={position}
      receiveShadow
    />
  );
}

/**
 * The inner panel for doors whose opening is not a rectangle — the arched and
 * rounded-corner fronts. The caller supplies the opening as a THREE.Shape in
 * door-local coordinates, so the inlay follows the curve exactly instead of
 * poking through it as a rectangle would.
 */
export function InnerPanelShape({
  material,
  shape,
  door,
  centerX = 0,
  centerY = 0,
  z,
  asCSG = false,
}: {
  /** Null means no panel — nothing is rendered. */
  material: THREE.Material | null;
  /** The opening outline, in door-local coordinates. */
  shape: THREE.Shape | null | undefined;
  door: { width: number; height: number };
  centerX?: number;
  centerY?: number;
  /** Z of the panel's back face, in door-local space. */
  z: number;
  asCSG?: boolean;
}) {
  const geometry = useDoorExtrudeGeometry(
    shape,
    { depth: INNER_PANEL_DEPTH, bevelEnabled: false },
    door,
    centerX,
    centerY,
  );

  if (!material || !geometry) return null;

  const position: [number, number, number] = [centerX, centerY, z];

  if (asCSG) {
    return <Base material={material} geometry={geometry} position={position} />;
  }
  return (
    <mesh
      material={material}
      geometry={geometry}
      position={position}
      receiveShadow
    />
  );
}
