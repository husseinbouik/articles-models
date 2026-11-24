import React, { useMemo } from "react";
import * as THREE from "three";
import { Subtraction } from "@react-three/csg";
import { useConfigurator } from "../../context/DoorContext";
import { fixColorSpace } from "../../utils/materialUtils";
import type { CutShape } from "./HL01";

// Rounded-rect handle shape shared by HL02/HL03 (top/bottom corner radii).
export function roundedRectShape(
  w: number, l: number, rTopIn: number, rBottomIn: number,
): THREE.Shape {
  const maxRadius = Math.min(w / 2, l / 2);
  const rTop = Math.min(rTopIn, maxRadius);
  const rBottom = Math.min(rBottomIn, maxRadius);
  const w_half = w / 2;
  const l_half = l / 2;
  const s = new THREE.Shape();
  s.moveTo(-w_half, l_half - rTop);
  if (rTop > 0) s.absarc(-w_half + rTop, l_half - rTop, rTop, Math.PI, Math.PI / 2, true);
  s.lineTo(w_half - rTop, l_half);
  if (rTop > 0) s.absarc(w_half - rTop, l_half - rTop, rTop, Math.PI / 2, 0, true);
  s.lineTo(w_half, -l_half + rBottom);
  if (rBottom > 0) s.absarc(w_half - rBottom, -l_half + rBottom, rBottom, 0, -Math.PI / 2, true);
  s.lineTo(-w_half + rBottom, -l_half);
  if (rBottom > 0) s.absarc(-w_half + rBottom, -l_half + rBottom, rBottom, -Math.PI / 2, -Math.PI, true);
  s.lineTo(-w_half, l_half - rTop);
  return s;
}

type HandlerProps = {
  material?: any;
  handleSide: "left" | "right";
  width: number;
  height: number;
  depth: number;
  cutYPosition?: number;
  handlerHeight?: number;
};

export function HL02({
  material,
  handleSide,
  width,
  height,
  depth,
  handlerHeight,
}: HandlerProps) {
  const { bodyThreeHandle, bodyThreeCapsule } = useConfigurator();

  // Use values from context if props are not provided or to override
  const rotation = bodyThreeHandle.rotation;
  const contextMaterial = bodyThreeHandle.material;

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

  // Use `handlerHeight` for LENGTH if provided, otherwise fall back to context.
  // MODIFIED: Prioritize bodyThreeHandle.length over props for UI control
  const handleEffectiveLength = bodyThreeHandle.length;
  // How much taller the capsule cutout is than the handle cutout. 0 = equal.
  const capsuleEffectiveLength = handleEffectiveLength + bodyThreeCapsule.secondCutHeight * 2;

  // Use `cutHeight` for POSITION if provided, otherwise fall back to context.
  // MODIFIED: Prioritize bodyThreeHandle.verticalPosition if we want the handler settings to control it.
  // However, keeping backward compatibility if verticalPosition is 0 or undefined, maybe?
  // For now, let's use the handler's own verticalPosition as primary if it's being controlled by the new UI.
  const effectiveVerticalPosition = bodyThreeHandle.verticalPosition;

  const handleWidth = bodyThreeHandle.width;
  const handleTotalLength = handleEffectiveLength;
  // Calculate depth to leave 4mm at back
  const handleCutDepth = depth - MMs_TO_LEAVE;
  const handleTopRadius = bodyThreeHandle.topRadius;
  const handleBottomRadius = bodyThreeHandle.bottomRadius;

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
      depth: handleCutDepth + 1,
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

  const handleYPosition = effectiveVerticalPosition;

  // const sideMultiplier = handleSide === "left" ? -1 : 1;
  const sideMultiplier = 1;
  // Always center-relative positioning
  const handleXPosition =
    sideMultiplier * bodyThreeHandle.horizontalOffset;
  const handleZPosition = -depth / 2 + MMs_TO_LEAVE;

  const capsuleRadius = bodyThreeCapsule.radius;
  const capsuleTotalLength = capsuleEffectiveLength;
  const capsuleEdgeRadius = bodyThreeCapsule.edgeRadius;

  // The base thickness from which we calculate cutout properties
  const BASE_DOOR_DEPTH = 18; // 18mm

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

  // GROUP LOGIC: Rotate capsule AROUND the handle center
  const rotationRad = THREE.MathUtils.degToRad(rotation);

  // Calculate relative position of capsule to handle (before rotation)
  const relX = capsuleXPosition - handleXPosition;
  const relY = capsuleYPosition - handleYPosition;

  // Rotate this vector
  const rotatedRelX =
    relX * Math.cos(rotationRad) - relY * Math.sin(rotationRad);
  const rotatedRelY =
    relX * Math.sin(rotationRad) + relY * Math.cos(rotationRad);

  // Final Capsule Position
  const finalCapsuleX = handleXPosition + rotatedRelX;
  const finalCapsuleY = handleYPosition + rotatedRelY;

  return (
    <>
      {bodyThreeHandle.visible && handleGeometryArgs && (
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
 * HL02 cut shapes for the door edge outline. Handle is a rounded rectangle
 * through-cut (leaves a 4mm back wall → breaks the door edge); capsule is a
 * secondary recess (no outline). Mirrors the <Subtraction> math above.
 */
export function useHL02CutShapes(depth: number): CutShape[] {
  const { bodyThreeHandle, bodyThreeCapsule } = useConfigurator();

  const MMs_TO_LEAVE = 4;
  const rotationRad = THREE.MathUtils.degToRad(bodyThreeHandle.rotation);
  const handleLength = bodyThreeHandle.length;
  const handleX = bodyThreeHandle.horizontalOffset;
  const handleY = bodyThreeHandle.verticalPosition;

  const handleShape = useMemo(() => {
    if (bodyThreeHandle.width <= 0 || handleLength <= 0) return null;
    return roundedRectShape(
      bodyThreeHandle.width,
      handleLength,
      bodyThreeHandle.topRadius,
      bodyThreeHandle.bottomRadius,
    );
  }, [bodyThreeHandle.width, handleLength, bodyThreeHandle.topRadius, bodyThreeHandle.bottomRadius]);
  const handleCutDepth = Math.max(0, depth - MMs_TO_LEAVE);

  // Capsule (recess only, no edge break, no outline drawn).
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
    if (bodyThreeHandle.visible && handleShape) {
      cuts.push({ shape: handleShape, x: handleX, y: handleY, rotationRad, cutDepth: handleCutDepth, kind: "handle" });
    }
    if (bodyThreeCapsule.visible && capsuleShape) {
      cuts.push({ shape: capsuleShape, x: finalCapsuleX, y: finalCapsuleY, rotationRad: capsuleRotZ, cutDepth: capsuleCutDepth, kind: "capsule" });
    }
    return cuts;
  }, [bodyThreeHandle.visible, bodyThreeCapsule.visible, handleShape, capsuleShape, handleX, handleY, rotationRad, handleCutDepth, finalCapsuleX, finalCapsuleY, capsuleRotZ, capsuleCutDepth]);
}
