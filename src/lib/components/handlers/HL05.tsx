
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

export function HL05({
  material,
  handleSide,
  width,
  height,
  depth,
  cutYPosition,
}: HandlerProps) {
  const { hl05Handle, doorConfig } = useConfigurator();

  const contextMaterial = hl05Handle.material;

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

  const cornerRadius = 15;
  const isDrawer = height <= 600;
  const sideMultiplier = handleSide === "left" ? -1 : 1;

  // Notch dimensions
  const cutoutWidth = 55; 
  const cutoutHeight = hl05Handle.length;

  // X positioning
  // Always center-relative
  const xPos = sideMultiplier * hl05Handle.horizontalOffset;

  const desiredY = hl05Handle.verticalPosition;
  const finalRotation = hl05Handle.rotation + (isDrawer ? 90 : 0);

  // DEPTH LOGIC:
  // We want to cut from the front face and leave material at the back.
  // We'll use the doorConfig.depth as the true thickness.
  const trueDoorThickness = doorConfig.depth || (depth > 40 ? depth - 20 : depth);
  
  // We want the hole to be, for example, 10mm deep.
  // Or more dynamically: leave half the thickness but at least 6mm.
  const MMs_TO_LEAVE = 8; 
  const cutDepthIntoWood = Math.min(trueDoorThickness - 4, trueDoorThickness - MMs_TO_LEAVE);
  const finalCutDepth = Math.max(2, cutDepthIntoWood);

  const cutoutShape = useMemo(() => {
    const shape = new THREE.Shape();
    const w = cutoutWidth;
    const h = cutoutHeight;
    const r = Math.min(cornerRadius, w / 2, h / 2);

    shape.moveTo(-w / 2 + r, h / 2);
    shape.lineTo(w / 2 - r, h / 2);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2, h / 2 - r);
    shape.lineTo(w / 2, -h / 2 + r);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2 - r, -h / 2);
    shape.lineTo(-w / 2 + r, -h / 2);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2, -h / 2 + r);
    shape.lineTo(-w / 2, h / 2 - r);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2 + r, h / 2);

    const extrudeSettings = {
      steps: 1,
      depth: finalCutDepth,
      bevelEnabled: false,
    };
    return [shape, extrudeSettings] as const;
  }, [cutoutWidth, cutoutHeight, cornerRadius, finalCutDepth]);

  if (!hl05Handle.visible) return null;

  // Position Z:
  // We start at the front face and go BACKWARDS by finalCutDepth.
  // Front face is at +trueDoorThickness/2.
  // extrudeGeometry grows POSITIVE Z.
  // So we start at (trueDoorThickness/2 - finalCutDepth) and add 0.1 for overlap.
  const zPos = trueDoorThickness / 2 - finalCutDepth + 0.1;

  return (
    <Subtraction
      name="handle-fa-2e-cut"
      position={[xPos, desiredY, zPos]} 
      rotation={[0, 0, THREE.MathUtils.degToRad(finalRotation)]}
      material={effectiveMaterial}
    >
      <extrudeGeometry args={cutoutShape} />

    </Subtraction>
  );
}

/**
 * HL05 cut shape for the door edge outline. A rounded-rect FRONT RECESS
 * (55 × length, leaves material at the back → kind "recess": front outline,
 * does NOT break the door edge). Mirrors the <Subtraction> shape above.
 */
export function useHL05CutShapes(
  depth: number,
  handleSide: "left" | "right" = "right",
  height = 2100,
): CutShape[] {
  const { hl05Handle, doorConfig } = useConfigurator();

  const cornerRadius = 15;
  const cutoutWidth = 55;
  const cutoutHeight = hl05Handle.length;
  const isDrawer = height <= 600;
  const sideMultiplier = handleSide === "left" ? -1 : 1;
  const handleX = sideMultiplier * hl05Handle.horizontalOffset;
  const handleY = hl05Handle.verticalPosition;
  const rotationRad = THREE.MathUtils.degToRad(
    hl05Handle.rotation + (isDrawer ? 90 : 0),
  );

  const trueDoorThickness =
    doorConfig.depth || (depth > 40 ? depth - 20 : depth);
  const MMs_TO_LEAVE = 8;
  const cutDepthIntoWood = Math.min(
    trueDoorThickness - 4,
    trueDoorThickness - MMs_TO_LEAVE,
  );
  const cutDepth = Math.max(2, cutDepthIntoWood);

  const cutoutShape = useMemo(() => {
    if (cutoutWidth <= 0 || cutoutHeight <= 0) return null;
    const w = cutoutWidth;
    const h = cutoutHeight;
    const r = Math.min(cornerRadius, w / 2, h / 2);
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, h / 2);
    s.lineTo(w / 2 - r, h / 2);
    s.quadraticCurveTo(w / 2, h / 2, w / 2, h / 2 - r);
    s.lineTo(w / 2, -h / 2 + r);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2 - r, -h / 2);
    s.lineTo(-w / 2 + r, -h / 2);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2, -h / 2 + r);
    s.lineTo(-w / 2, h / 2 - r);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2 + r, h / 2);
    return s;
  }, [cutoutWidth, cutoutHeight, cornerRadius]);

  return useMemo(() => {
    if (!hl05Handle.visible || !cutoutShape) return [];
    return [{ shape: cutoutShape, x: handleX, y: handleY, rotationRad, cutDepth, kind: "recess" }];
  }, [hl05Handle.visible, cutoutShape, handleX, handleY, rotationRad, cutDepth]);
}
