import React, { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useConfigurator } from "../../context/DoorContext";
import { MaterialDefinition } from "../../types/types";

type HandlerProps = {
  handleSide: "left" | "right";
  width: number;
  height: number;
  depth: number;
  cutYPosition?: number;
  material?: MaterialDefinition;
};

export function HLModel({
  handleSide,
  width,
  height,
  depth,
  cutYPosition,
  material,
}: HandlerProps) {
  const { hlModelHandle } = useConfigurator();
  const { scene, nodes } = useGLTF(hlModelHandle.url);

  const selectedObject = useMemo(() => {
    let obj;
    if (!hlModelHandle.selectedMesh || hlModelHandle.selectedMesh === "All") {
      obj = scene.clone();
    } else {
      const node = nodes[hlModelHandle.selectedMesh];
      obj = node ? node.clone() : scene.clone();
    }

    // Apply material if provided and is a valid Three.js material
    if (material && (material as THREE.Material).isMaterial) {
      const mat = material as THREE.Material;
      obj.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = mat;
        }
      });
    }

    return obj;
  }, [scene, nodes, hlModelHandle.selectedMesh, material]);

  const sideMultiplier = handleSide === "left" ? -1 : 1;
  const isDrawer = height <= 600;

  // X positioning: Absolute for drawers, edge-relative for doors
  // Always center-relative
  const xPos = sideMultiplier * hlModelHandle.horizontalOffset;

  const yPos = hlModelHandle.verticalPosition;
  const zPos = depth / 2 + hlModelHandle.zOffset;

  if (!hlModelHandle.visible) return null;
  const isKnob = hlModelHandle.url.includes("door_handler_demo");
  const baseRotationX = Math.PI / 2;
  const baseRotationY = 0;
  const baseRotationZ = 0;

  return (
    <primitive
      object={selectedObject}
      position={[xPos, yPos, zPos]}
      rotation={[
        baseRotationX,
        baseRotationY + THREE.MathUtils.degToRad(hlModelHandle.rotationY),
        baseRotationZ,
      ]}
      scale={hlModelHandle.scale}
    />
  );
}

// Preload the valid model
useGLTF.preload("/models/handles/door_handler_demo.glb");
