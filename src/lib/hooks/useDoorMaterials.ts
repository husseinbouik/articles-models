import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import type { MaterialDefinition, MaterialProps } from "../types/types";

import { buildMaterial, fixColorSpace } from "../utils/materialUtils";

// --- Predefined materials ---
const PREDEFINED_MATERIALS: { [key: string]: THREE.MeshStandardMaterial } = {
  black: new THREE.MeshStandardMaterial({ color: "#222222", roughness: 0.8 }),
  silver: new THREE.MeshStandardMaterial({
    color: "#d1d1d1",
    metalness: 0.8,
    roughness: 0.4,
  }),
  glass: new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.1,
    transparent: true,
    opacity: 0.6,
  }),
  wood: new THREE.MeshStandardMaterial({ color: "#a0522d" }),
  white: new THREE.MeshStandardMaterial({ color: "#f5f5f5", roughness: 0.9 }),
};

const placeholder = new THREE.MeshStandardMaterial({ color: "magenta" });

export const useDoorMaterials = (materialsProp: MaterialProps = {}) => {
  // Logic to extract texture URLs from props
  const textureUrls = useMemo(() => {
    const urls = new Set<string>();
    const materialsToCheck: (MaterialDefinition | undefined)[] = [
      materialsProp.doorMaterial,
      materialsProp.frontMaterial,
      materialsProp.backMaterial,
      materialsProp.innerPanelMaterial,
    ];

    for (const prop of materialsToCheck) {
      if (!prop) continue;
      if (prop instanceof THREE.Material) continue;

      const value = typeof prop === "string" ? prop : prop.value;
      if (
        value &&
        !PREDEFINED_MATERIALS[value] &&
        (value.startsWith("http") || value.startsWith("/"))
      ) {
        urls.add(value);
      }
    }
    return Array.from(urls);
  }, [materialsProp]);

  const loadedTextures = useTexture(textureUrls);

  const textureMap = useMemo(() => {
    return textureUrls.reduce(
      (acc, url, index) => {
        const tex = loadedTextures[index];
        if (tex) tex.colorSpace = THREE.SRGBColorSpace;
        acc[url] = tex;
        return acc;
      },
      {} as Record<string, THREE.Texture>,
    );
  }, [textureUrls, loadedTextures]);

  // Memoize the final materials
  return useMemo(() => {
    const getMaterial = (prop?: MaterialDefinition): THREE.Material => {
      if (!prop) return placeholder;
      if (prop instanceof THREE.Material) {
        return fixColorSpace(prop);
      }

      const value = typeof prop === "string" ? prop : prop.value;
      if (PREDEFINED_MATERIALS[value]) {
        return PREDEFINED_MATERIALS[value];
      }
      return buildMaterial(prop, textureMap);
    };

    return {
      doorMaterial: getMaterial(materialsProp.doorMaterial),
      frontMaterial: getMaterial(materialsProp.frontMaterial ?? materialsProp.doorMaterial),
      backMaterial: getMaterial(materialsProp.backMaterial ?? materialsProp.doorMaterial),
      // Deliberately no doorMaterial fallback: an unset inner panel material
      // means "no inner panel", so callers can test for null to skip it.
      innerPanelMaterial: materialsProp.innerPanelMaterial
        ? getMaterial(materialsProp.innerPanelMaterial)
        : null,
    };
  }, [materialsProp, textureMap]);
};
