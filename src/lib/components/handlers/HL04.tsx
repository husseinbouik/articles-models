
import React, { useMemo } from "react";
import * as THREE from "three";
import { Subtraction } from "@react-three/csg";
import { useConfigurator } from "../../context/DoorContext";
import { fixColorSpace } from "../../utils/materialUtils";
import type { CutShape } from "./HL01";

type HandlerProps = {
  material?: any;
  handleSide: "left" | "right";
  width: number;
  height: number;
  depth: number;
  cutYPosition?: number;
};

export function HL04({
  material,
  handleSide,
  width,
  height,
  depth,
  cutYPosition,
}: HandlerProps) {
  const { hl04Handle } = useConfigurator();

  const contextMaterial = hl04Handle.material;

  const effectiveMaterial = useMemo(() => {
    const mat = material ?? contextMaterial;
    if (!mat) return undefined;
    if (mat instanceof THREE.Material) return fixColorSpace(mat) as THREE.Material;
    if (typeof mat === "string") return new THREE.MeshStandardMaterial({ color: mat });
    if (typeof mat === "object" && "value" in mat) {
      return new THREE.MeshStandardMaterial({
        color: mat.value,
        opacity: mat.opacity ?? 1,
        transparent: (mat.opacity ?? 1) < 1,
      });
    }
    return undefined;
  }, [contextMaterial, material]);

  const handleRadius = 20;
  const MMs_TO_LEAVE = 4;
  const handleCutDepth = depth - MMs_TO_LEAVE;
  const cutPositionZ = -(depth / 2) + 4;

  const sideMultiplier = handleSide === "left" ? -1 : 1;
  const isDrawer = height <= 600;

  // X positioning: Absolute for drawers, edge-relative for doors
  // Always center-relative
  const handleX = sideMultiplier * hl04Handle.horizontalOffset;

  const handleY = hl04Handle.verticalPosition;
  const finalRotation = hl04Handle.rotation + (isDrawer ? 90 : 0);

  // Preserve exact handle shape with bevel
  const handleGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, handleRadius, 0, Math.PI * 2, false);
    return new THREE.ExtrudeGeometry(shape, {
      depth: handleCutDepth,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 1,
      bevelSize: 2,
      bevelThickness: 2,
    });
  }, [handleRadius, handleCutDepth]);

  if (!hl04Handle.visible) return null;

  return (
    <Subtraction
      name="handle-fa-2d-cut"
      position={[handleX, handleY, cutPositionZ]}
      rotation={[0, 0, THREE.MathUtils.degToRad(finalRotation)]}
      material={effectiveMaterial}
    >
      <primitive object={handleGeometry} />
    </Subtraction>
  );
}

/**
 * HL04 cut shape for the door edge outline. A single circular through-cut
 * (radius 20, leaves a 4mm back wall → kind "handle": front outline + breaks
 * the door edge). Mirrors the <Subtraction> math above.
 */
export function useHL04CutShapes(
  depth: number,
  handleSide: "left" | "right" = "right",
  height = 2100,
): CutShape[] {
  const { hl04Handle } = useConfigurator();

  const handleRadius = 20;
  const MMs_TO_LEAVE = 4;
  const isDrawer = height <= 600;
  const sideMultiplier = handleSide === "left" ? -1 : 1;
  const handleX = sideMultiplier * hl04Handle.horizontalOffset;
  const handleY = hl04Handle.verticalPosition;
  const rotationRad = THREE.MathUtils.degToRad(
    hl04Handle.rotation + (isDrawer ? 90 : 0),
  );
  const cutDepth = Math.max(0, depth - MMs_TO_LEAVE);

  const circleShape = useMemo(() => {
    // Outline at the outer edge of the bevel ring (handleRadius + bevelSize).
    const s = new THREE.Shape();
    s.absarc(0, 0, handleRadius + 2, 0, Math.PI * 2, false);
    return s;
  }, []);

  return useMemo(() => {
    if (!hl04Handle.visible) return [];
    return [{ shape: circleShape, x: handleX, y: handleY, rotationRad, cutDepth, kind: "handle" }];
  }, [hl04Handle.visible, circleShape, handleX, handleY, rotationRad, cutDepth]);
}
