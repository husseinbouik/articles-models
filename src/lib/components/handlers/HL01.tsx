import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { Subtraction } from "@react-three/csg";
import { useConfigurator } from "../../context/DoorContext";
import { fixColorSpace } from "../../utils/materialUtils";

type HandlerProps = {
  material?: any;
  handleSide: "left" | "right";
  width: number;
  height: number;
  depth: number;
  cutYPosition?: number;
  handlerHeight?: number;
};

export function HL01({
  material,
  handleSide,
  width,
  height,
  depth,
  handlerHeight,
}: HandlerProps) {
  const { hl01Handle, bodyThreeCapsule } = useConfigurator();

  // Use values from context
  const rotation = hl01Handle.rotation;
  const contextMaterial = hl01Handle.material;

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

  // 4mm wall at the back
  const MMs_TO_LEAVE = 4;

  // Use `handlerHeight` prop or fallback to context `length`
  // PRIORITIZE context `length` for UI control if we want it to be responsive to the slider
  const handleEffectiveLength = hl01Handle.length;

  // How much taller the capsule cutout is than the handle cutout. 0 = equal.
  const capsuleEffectiveLength = handleEffectiveLength + bodyThreeCapsule.secondCutHeight * 2;

  const effectiveVerticalPosition = hl01Handle.verticalPosition;

  // Hardcoded shape parameters (standardized)
  const topShapeWidth = 40;
  const topShapeAngle = 45;
  const handleWidth = topShapeWidth; // Used for position comparisons
  const handleTotalLength = handleEffectiveLength; // This is now the shape height

  const handleCutDepth = depth - MMs_TO_LEAVE;

  const handleGeometryArgs = useMemo(() => {
    if (handleWidth <= 0 || handleTotalLength <= 0) return undefined;
    const shape = new THREE.Shape();
    const w_half = handleWidth / 2;

    // The angle creates a diagonal at the top-left
    const angleRad = THREE.MathUtils.degToRad(
      Math.max(1, Math.min(89, topShapeAngle)),
    );
    const diagonalDrop = Math.min(
      handleTotalLength,
      handleWidth * Math.tan(angleRad),
    );
    const leftTopY = handleTotalLength - diagonalDrop;
    const h_half = handleTotalLength / 2;

    // Symmetric cuts:
    // Top-Left Y relative to center: (h_half - diagonalDrop)
    // Bottom-Left Y relative to center: (-h_half + diagonalDrop)

    // Shape centered vertically
    // Start at Bottom-Left (after cut)
    shape.moveTo(-w_half, -h_half + diagonalDrop);

    // Left edge (vertical part)
    shape.lineTo(-w_half, h_half - diagonalDrop);

    // Diagonal to Top-Right (Wait: Top-Right is at w_half. The cut goes from Top-Left to Top-Right? No, 45 deg means diagonal at corner)
    // The user wanted "45 deg ... on both sides".
    // Diagonal: From Left-Edge-Top to Right-Edge-Top? No, that would be a triangle.
    // The previous code had: `shape.lineTo(w_half, h_half)` from `leftTopY`.
    // Let's stick to the previous logic but mirrored.

    // Top-Left Cut: From (-w_half, h_half - diagonalDrop) TO (w_half, h_half) ?
    // If width=40, height=200, angle=45, tan(45)=1. diagonalDrop = 40 * 1 = 40.
    // Left side height = 200 - 40 = 160.
    // Top cut goes from (-20, 100-40=60) to (20, 100). Yes.

    // Bottom-Left Cut: From (-w_half, -h_half + diagonalDrop) TO (w_half, -h_half)?
    // Wait. If I want it symmetric, the bottom cut should be:
    // From Right-Bottom (w_half, -h_half) TO Left-Bottom-Start (-w_half, -h_half + diagonalDrop).
    // Yes.

    // So vertices order (counter-clockwise):
    // 1. Bottom-Left-Start: (-w_half, -h_half + diagonalDrop)
    // 2. Top-Left-Start:    (-w_half, h_half - diagonalDrop)
    // 3. Top-Right:         (w_half, h_half)
    // 4. Bottom-Right:      (w_half, -h_half)
    // 5. Close to 1.

    // Diagonal to Top-Right
    shape.lineTo(w_half, h_half);

    // Right edge (vertical)
    shape.lineTo(w_half, -h_half);

    // Diagonal to Bottom-Left-Start
    shape.lineTo(-w_half, -h_half + diagonalDrop);

    const extrudeSettings = {
      steps: 1,
      depth: handleCutDepth + 1,
      bevelEnabled: false,
    };
    return [shape, extrudeSettings] as const;
  }, [handleWidth, handleTotalLength, topShapeAngle, handleCutDepth]);

  const handleYPosition = effectiveVerticalPosition;
  const sideMultiplier = 1;
  const handleXPosition =
    sideMultiplier * hl01Handle.horizontalOffset;
  const handleZPosition = -depth / 2 + MMs_TO_LEAVE;

  const capsuleRadius = bodyThreeCapsule.radius;
  const capsuleTotalLength = capsuleEffectiveLength;
  const capsuleEdgeRadius = bodyThreeCapsule.edgeRadius;

  const BASE_DOOR_DEPTH = 18;
  const baseCutDepth = BASE_DOOR_DEPTH * bodyThreeCapsule.depthFactor;
  const extraDepth = Math.max(0, depth - BASE_DOOR_DEPTH);
  const capsuleCutDepth = baseCutDepth + extraDepth;

  const capsuleGeometryArgs = useMemo(() => {
    if (capsuleRadius <= 0 || capsuleTotalLength <= 0) return undefined;
    const shape = new THREE.Shape();
    const rectHeight = capsuleTotalLength - capsuleRadius * 2;
    const halfRectHeight = rectHeight / 2;
    if (rectHeight > 0) {
      shape.moveTo(-capsuleRadius, halfRectHeight);
      shape.absarc(0, halfRectHeight, capsuleRadius, Math.PI, 0, true);
      shape.lineTo(capsuleRadius, -halfRectHeight);
      shape.absarc(0, -halfRectHeight, capsuleRadius, 0, Math.PI, true);
      shape.lineTo(-capsuleRadius, halfRectHeight);
    } else {
      shape.absarc(0, 0, capsuleRadius, 0, Math.PI * 2, true);
    }
    shape.closePath();
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
  }, [capsuleRadius, capsuleTotalLength, capsuleCutDepth, capsuleEdgeRadius]);

  const capsuleSideMultiplier = sideMultiplier * -1;
  const capsuleXPosition =
    handleXPosition + capsuleSideMultiplier * bodyThreeCapsule.horizontalOffset;
  const capsuleYPosition = handleYPosition;

  const frontFaceZ = bodyThreeCapsule.positionZ;
  const capsuleZPosition = frontFaceZ - capsuleCutDepth / 2;

  const capsuleRotationZRad = THREE.MathUtils.degToRad(
    bodyThreeCapsule.rotationZ,
  );

  const rotationRad = THREE.MathUtils.degToRad(rotation);

  const relX = capsuleXPosition - handleXPosition;
  const relY = capsuleYPosition - handleYPosition;

  const rotatedRelX =
    relX * Math.cos(rotationRad) - relY * Math.sin(rotationRad);
  const rotatedRelY =
    relX * Math.sin(rotationRad) + relY * Math.cos(rotationRad);

  const finalCapsuleX = handleXPosition + rotatedRelX;
  const finalCapsuleY = handleYPosition + rotatedRelY;

  return (
    <>
      {hl01Handle.visible && handleGeometryArgs && (
        <Subtraction
          name="handle-cut"
          position={[handleXPosition, handleYPosition, handleZPosition]}
          rotation={[0, 0, THREE.MathUtils.degToRad(rotation)]}
          material={effectiveMaterial}
        >
          <extrudeGeometry args={handleGeometryArgs} />
        </Subtraction>
      )}
      {bodyThreeCapsule.visible && capsuleGeometryArgs && (
        <Subtraction
          name="capsule-cut"
          position={[finalCapsuleX, finalCapsuleY, capsuleZPosition]}
          rotation={[0, 0, capsuleRotationZRad + rotationRad]}
          material={effectiveMaterial}
        >
          <extrudeGeometry args={capsuleGeometryArgs} />
        </Subtraction>
      )}
    </>
  );
}

export type CutShape = {
  /** 2D outline of the cut, centered at the local origin. */
  shape: THREE.Shape;
  /** Cut center in door-local coordinates. */
  x: number;
  y: number;
  /** Z-rotation of the cut, in radians. */
  rotationRad: number;
  /**
   * How deep the cut goes, measured back from the door's front face.
   * The cut mouth is at the front face (z = +doorDepth/2); the cut floor is
   * at z = +doorDepth/2 - cutDepth.
   */
  cutDepth: number;
  /**
   * Distinguishes cut types so the door can outline each differently:
   * - "handle":  through-cut → gets a front outline AND breaks the door edge.
   * - "recess":  shallow front cut → gets a front outline, does NOT break the
   *              door edge (material remains behind it).
   * - "capsule": secondary recess → no outline, does not break the edge.
   */
  kind: "handle" | "recess" | "capsule" | "slot";
};

/**
 * Returns the HL01 cut(s) as 2D shapes + their door-local transform, so the
 * DOOR can punch them as HOLES into its own front-face outline and draw the
 * edge from that. This is the cut SHAPE only (no extrude, no walls), so the
 * resulting outline is exactly: door perimeter + clean cut mouth, no diagonals.
 *
 * Mirrors the shape/position math of the HL01 <Subtraction>s above.
 */
export function useHL01CutShapes(depth: number): CutShape[] {
  const { hl01Handle, bodyThreeCapsule } = useConfigurator();

  const MMs_TO_LEAVE = 4; // wall left at the back, matches the <Subtraction>
  const rotationRad = THREE.MathUtils.degToRad(hl01Handle.rotation);
  const handleLength = hl01Handle.length;
  const handleX = hl01Handle.horizontalOffset;
  const handleY = hl01Handle.verticalPosition;

  // Handle cut shape (mirrors handleGeometryArgs)
  const handleShape = useMemo(() => {
    const topShapeWidth = 40;
    const topShapeAngle = 45;
    if (topShapeWidth <= 0 || handleLength <= 0) return null;
    const w_half = topShapeWidth / 2;
    const angleRad = THREE.MathUtils.degToRad(
      Math.max(1, Math.min(89, topShapeAngle)),
    );
    const diagonalDrop = Math.min(handleLength, topShapeWidth * Math.tan(angleRad));
    const h_half = handleLength / 2;
    const s = new THREE.Shape();
    s.moveTo(-w_half, -h_half + diagonalDrop);
    s.lineTo(-w_half, h_half - diagonalDrop);
    s.lineTo(w_half, h_half);
    s.lineTo(w_half, -h_half);
    s.lineTo(-w_half, -h_half + diagonalDrop);
    return s;
  }, [handleLength]);

  // Handle cut goes through the door leaving a 4mm wall at the back.
  const handleCutDepth = Math.max(0, depth - MMs_TO_LEAVE);

  // Capsule cut shape (mirrors capsuleGeometryArgs)
  const capsuleRadius = bodyThreeCapsule.radius;
  const capsuleLength = handleLength + bodyThreeCapsule.secondCutHeight * 2;
  const capsuleShape = useMemo(() => {
    if (capsuleRadius <= 0 || capsuleLength <= 0) return null;
    const s = new THREE.Shape();
    const rectHeight = capsuleLength - capsuleRadius * 2;
    const halfRectHeight = rectHeight / 2;
    if (rectHeight > 0) {
      s.moveTo(-capsuleRadius, halfRectHeight);
      s.absarc(0, halfRectHeight, capsuleRadius, Math.PI, 0, true);
      s.lineTo(capsuleRadius, -halfRectHeight);
      s.absarc(0, -halfRectHeight, capsuleRadius, 0, Math.PI, true);
      s.lineTo(-capsuleRadius, halfRectHeight);
    } else {
      s.absarc(0, 0, capsuleRadius, 0, Math.PI * 2, true);
    }
    s.closePath();
    return s;
  }, [capsuleRadius, capsuleLength]);

  // Capsule depth + position (mirrors capsule <Subtraction> math).
  const BASE_DOOR_DEPTH = 18;
  const baseCutDepth = BASE_DOOR_DEPTH * bodyThreeCapsule.depthFactor;
  const extraDepth = Math.max(0, depth - BASE_DOOR_DEPTH);
  const capsuleCutDepth = baseCutDepth + extraDepth;
  const capsuleX = handleX + -1 * bodyThreeCapsule.horizontalOffset;
  const relX = capsuleX - handleX;
  const finalCapsuleX = handleX + relX * Math.cos(rotationRad);
  const finalCapsuleY = handleY + relX * Math.sin(rotationRad);
  const capsuleRotZ =
    THREE.MathUtils.degToRad(bodyThreeCapsule.rotationZ) + rotationRad;

  return useMemo(() => {
    const cuts: CutShape[] = [];
    if (hl01Handle.visible && handleShape) {
      cuts.push({
        shape: handleShape,
        x: handleX,
        y: handleY,
        rotationRad,
        cutDepth: handleCutDepth,
        kind: "handle",
      });
    }
    if (bodyThreeCapsule.visible && capsuleShape) {
      cuts.push({
        shape: capsuleShape,
        x: finalCapsuleX,
        y: finalCapsuleY,
        rotationRad: capsuleRotZ,
        cutDepth: capsuleCutDepth,
        kind: "capsule",
      });
    }
    return cuts;
  }, [
    hl01Handle.visible,
    bodyThreeCapsule.visible,
    handleShape,
    capsuleShape,
    handleX,
    handleY,
    rotationRad,
    handleCutDepth,
    finalCapsuleX,
    finalCapsuleY,
    capsuleRotZ,
    capsuleCutDepth,
  ]);
}

