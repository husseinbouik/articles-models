import React, { useMemo } from "react";
import * as THREE from "three";
import { Subtraction } from "@react-three/csg";
import { useConfigurator } from "../../context/DoorContext";
import { fixColorSpace } from "../../utils/materialUtils";
import type { CutShape } from "./HL01";
import { roundedRectShape } from "./HL02";

type HandlerProps = {
  material?: any;
  handleSide: "left" | "right";
  width: number;
  height: number;
  depth: number;
  cutYPosition?: number;
};

export function HL03({
  material,
  handleSide,
  width,
  height,
  depth,
  cutYPosition,
}: HandlerProps) {
  const { bodyFourHandle, bodyFourCapsule } = useConfigurator();

  // Use values from context
  // Use values from context
  const rotation = bodyFourHandle.rotation;
  const contextMaterial = bodyFourHandle.material;

  const effectiveMaterial = useMemo(() => {
    const mat = material ?? contextMaterial;
    if (!mat) return undefined;
    if (mat instanceof THREE.Material)
      return fixColorSpace(mat) as THREE.Material;
    if (typeof mat === "string")
      return new THREE.MeshStandardMaterial({ color: mat });
    if (typeof mat === "object" && "value" in mat) {
      return new THREE.MeshStandardMaterial({
        color: mat.value,
        opacity: mat.opacity ?? 1,
        transparent: (mat.opacity ?? 1) < 1,
      });
    }
    return undefined;
  }, [contextMaterial, material]);

  const cutHeight = cutYPosition || 950;

  // Dynamic positioning logic to "grow" the door upwards

  // --- Main Handle Calculations ---
  // The handle's depth is calculated based on a fixed 18mm standard, not the variable door depth.
  const BASE_DOOR_DEPTH = 18; // 18mm standard door depth
  const handleWidth = bodyFourHandle.width;
  const handleTotalLength = bodyFourHandle.length;
  const handleCutDepth = BASE_DOOR_DEPTH * bodyFourHandle.depthFactor;
  const handleTopRadius = bodyFourHandle.topRadius;
  const handleBottomRadius = bodyFourHandle.bottomRadius;

  const handleGeometryArgs = useMemo(() => {
    if (handleWidth <= 0 || handleTotalLength <= 0) return undefined;
    const shape = new THREE.Shape();
    const maxRadius = Math.min(handleWidth / 2, handleTotalLength / 2);
    const rTop = Math.min(handleTopRadius, maxRadius);
    const rBottom = Math.min(handleBottomRadius, maxRadius);
    const w_half = handleWidth / 2;
    const l_half = handleTotalLength / 2;
    shape.moveTo(-w_half, l_half - rTop);
    if (rTop > 0)
      shape.absarc(
        -w_half + rTop,
        l_half - rTop,
        rTop,
        Math.PI,
        Math.PI / 2,
        true,
      );
    shape.lineTo(w_half - rTop, l_half);
    if (rTop > 0)
      shape.absarc(w_half - rTop, l_half - rTop, rTop, Math.PI / 2, 0, true);
    shape.lineTo(w_half, -l_half + rBottom);
    if (rBottom > 0)
      shape.absarc(
        w_half - rBottom,
        -l_half + rBottom,
        rBottom,
        0,
        -Math.PI / 2,
        true,
      );
    shape.lineTo(-w_half + rBottom, -l_half);
    if (rBottom > 0)
      shape.absarc(
        -w_half + rBottom,
        -l_half + rBottom,
        rBottom,
        -Math.PI / 2,
        -Math.PI,
        true,
      );
    shape.lineTo(-w_half, l_half - rTop);
    const extrudeSettings = {
      steps: 1,
      depth: handleCutDepth,
      bevelEnabled: false,
    };
    return [shape, extrudeSettings] as const;
  }, [
    handleWidth,
    handleTotalLength,
    handleTopRadius,
    handleBottomRadius,
    handleCutDepth,
  ]);

  // Use standard drawer definition
  const isDrawer = height <= 600;

  // MODIFIED: Prioritize bodyFourHandle.verticalPosition to match Handler_04 behavior
  const effectiveVerticalPosition = bodyFourHandle.verticalPosition;

  // Always center-relative
  const cutGroupYPosition = effectiveVerticalPosition;

  // const sideMultiplier = handleSide === "left" ? -1 : 1;
  const sideMultiplier = 1;

  // Always center-relative
  const handleXPosition = sideMultiplier * bodyFourHandle.horizontalOffset;
  // The handle's center is positioned relative to the front face of the door.
  const handleZPosition = depth / 2 - handleCutDepth / 2;

  // --- REVISED CAPSULE CALCULATIONS ---
  // The capsule now fills the variable space between the fixed-depth handle and the back of the door.
  const OVERLAP = 0.1; // Tiny overlap to ensure clean CSG operation
  const MMs_TO_LEAVE_AT_BACK = 4;
  const capsuleWidth = bodyFourCapsule.width;
  // Capsule is 6mm shorter than the handle when secondCutHeight is 0;
  // secondCutHeight grows the capsule symmetrically past the handle's edges.
  const LENGTH_MARGIN = 12;
  const capsuleTotalLength =
    handleTotalLength - LENGTH_MARGIN + bodyFourCapsule.secondCutHeight * 2;
  const capsuleCornerRadius = bodyFourCapsule.radius;
  const capsuleEdgeRadius = bodyFourCapsule.edgeRadius;

  const handleCutoutEnd_Z = depth / 2 - handleCutDepth + 7;
  // depthFactor extends the capsule's front-side reach further toward (and
  // potentially past) the door's front face. The back side (capsuleEndZ) is
  // unaffected.
  const FRONT_EXTRA_DEPTH = handleCutDepth * bodyFourCapsule.depthFactor;
  const capsuleStartZ = handleCutoutEnd_Z + OVERLAP + FRONT_EXTRA_DEPTH;
  const capsuleEndZ = -depth / 2 + MMs_TO_LEAVE_AT_BACK;
  const capsuleCutDepth = Math.max(0, capsuleStartZ - capsuleEndZ);
  const capsuleZPosition = (capsuleStartZ + capsuleEndZ) / 2;

  const capsuleGeometryArgs = useMemo(() => {
    if (capsuleWidth <= 0 || capsuleTotalLength <= 0 || capsuleCutDepth <= 0)
      return undefined;
    const shape = new THREE.Shape();
    const w = capsuleWidth;
    const h = capsuleTotalLength;
    const r = Math.min(capsuleCornerRadius, w / 2, h / 2);
    const x = -w / 2;
    const y = -h / 2;
    shape.moveTo(x, y + r);
    shape.lineTo(x, y + h - r);
    shape.quadraticCurveTo(x, y + h, x + r, y + h);
    shape.lineTo(x + w - r, y + h);
    shape.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
    shape.lineTo(x + w, y + r);
    shape.quadraticCurveTo(x + w, y, x + w - r, y);
    shape.lineTo(x + r, y);
    shape.quadraticCurveTo(x, y, x, y + r);
    const safeEdgeRadius = Math.min(capsuleEdgeRadius, capsuleCutDepth / 2);
    const extrudeDepth = Math.max(0, capsuleCutDepth - 2 * safeEdgeRadius);
    const extrudeSettings = {
      steps: 1,
      depth: extrudeDepth,
      bevelEnabled: safeEdgeRadius > 0.1,
      bevelThickness: safeEdgeRadius,
      bevelSize: safeEdgeRadius,
      bevelOffset: 0,
      bevelSegments: 8,
    };
    return [shape, extrudeSettings] as const;
  }, [
    capsuleWidth,
    capsuleTotalLength,
    capsuleCornerRadius,
    capsuleCutDepth,
    capsuleEdgeRadius,
  ]);

  const capsuleSideMultiplier = sideMultiplier * -1;
  const capsuleXPosition =
    handleXPosition + capsuleSideMultiplier * bodyFourCapsule.horizontalOffset;
  const capsuleRotationZRad = THREE.MathUtils.degToRad(
    bodyFourCapsule.rotationZ,
  );

  // GROUP LOGIC: Rotate capsule AROUND the handle center
  const rotationRad = THREE.MathUtils.degToRad(rotation);

  const relX = capsuleXPosition - handleXPosition;
  const relY = cutGroupYPosition - cutGroupYPosition; // capsuleY was same as handleY (cutGroupYPosition)

  const rotatedRelX =
    relX * Math.cos(rotationRad) - relY * Math.sin(rotationRad);
  const rotatedRelY =
    relX * Math.sin(rotationRad) + relY * Math.cos(rotationRad);

  const finalCapsuleX = handleXPosition + rotatedRelX;
  const finalCapsuleY = cutGroupYPosition + rotatedRelY;

  return (
    <>
      {bodyFourHandle.visible && handleGeometryArgs && (
        <Subtraction
          name="handle-cut"
          position={[handleXPosition, cutGroupYPosition, handleZPosition]}
          rotation={[0, 0, THREE.MathUtils.degToRad(rotation)]}
          material={effectiveMaterial}
        >
          <extrudeGeometry args={handleGeometryArgs} />
        </Subtraction>
      )}
      {bodyFourCapsule.visible && capsuleGeometryArgs && (
        <Subtraction
          name="capsule-cut"
          position={[finalCapsuleX, finalCapsuleY, capsuleZPosition]}
          rotation={[
            0,
            0,
            capsuleRotationZRad + rotationRad, // Use pre-calculated rad
          ]}
          material={effectiveMaterial}
        >
          <extrudeGeometry args={capsuleGeometryArgs} />
        </Subtraction>
      )}
    </>
  );
}

/**
 * HL03 cut shapes for the door edge outline. The handle is a rounded-rect
 * FRONT RECESS (does NOT go through → kind "recess": gets a front outline but
 * does NOT break the door edge). Capsule is a secondary recess (no outline).
 * Mirrors the <Subtraction> math above.
 */
export function useHL03CutShapes(depth: number): CutShape[] {
  const { bodyFourHandle, bodyFourCapsule } = useConfigurator();

  const BASE_DOOR_DEPTH = 18;
  const rotationRad = THREE.MathUtils.degToRad(bodyFourHandle.rotation);
  const handleLength = bodyFourHandle.length;
  const handleX = bodyFourHandle.horizontalOffset;
  const handleY = bodyFourHandle.verticalPosition;

  const handleShape = useMemo(() => {
    if (bodyFourHandle.width <= 0 || handleLength <= 0) return null;
    return roundedRectShape(
      bodyFourHandle.width,
      handleLength,
      bodyFourHandle.topRadius,
      bodyFourHandle.bottomRadius,
    );
  }, [
    bodyFourHandle.width,
    handleLength,
    bodyFourHandle.topRadius,
    bodyFourHandle.bottomRadius,
  ]);
  // Front recess: 18mm * depthFactor deep from the front face (does not break edge).
  const handleCutDepth = BASE_DOOR_DEPTH * bodyFourHandle.depthFactor;

  return useMemo(() => {
    const cuts: CutShape[] = [];
    if (bodyFourHandle.visible && handleShape) {
      cuts.push({
        shape: handleShape,
        x: handleX,
        y: handleY,
        rotationRad,
        cutDepth: handleCutDepth,
        kind: "recess",
      });
    }
    return cuts;
  }, [
    bodyFourHandle.visible,
    handleShape,
    handleX,
    handleY,
    rotationRad,
    handleCutDepth,
  ]);
}
