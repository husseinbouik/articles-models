import * as THREE from "three";
import type { MaterialDefinition } from "../types/types";

export const fixColorSpace = (mat: THREE.Material): THREE.Material => {
  if (mat instanceof THREE.MeshStandardMaterial && mat.map) {
    // Only flag needsUpdate when the colorSpace is actually wrong — avoids
    // forcing a GPU texture re-upload on every render cycle.
    if (mat.map.colorSpace !== THREE.SRGBColorSpace) {
      mat.map.colorSpace = THREE.SRGBColorSpace;
      mat.map.needsUpdate = true;
    }
  }
  return mat;
};

export const buildMaterial = (
  prop: MaterialDefinition,
  textureMap: Record<string, THREE.Texture>,
): THREE.MeshStandardMaterial => {
  // This function should theoretically not be called with a THREE.Material instance
  // because useDoorMaterials handles that case. However, for type safety:
  if (prop instanceof THREE.Material) {
    return fixColorSpace(prop) as THREE.MeshStandardMaterial;
  }

  if (!prop) {
    return new THREE.MeshStandardMaterial({ color: "#ffffff" }); // Default fallback
  }

  const value = typeof prop === "string" ? prop : prop.value;
  const opacity = typeof prop === "object" ? (prop.opacity ?? 1) : 1;

  // Handle Texture Map
  if (textureMap && textureMap[value]) {
    const texture = textureMap[value].clone();
    // Clamp: UVs never exceed 1 (see applyRealWorldBoxUVs), so the texture is
    // shown exactly once per face and never tiles.
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    return new THREE.MeshStandardMaterial({
      map: texture,
      transparent: opacity < 1,
      opacity: opacity,
    });
  }

  // Handle Color
  return new THREE.MeshStandardMaterial({
    color: value,
    transparent: opacity < 1,
    opacity: opacity,
  });
};
