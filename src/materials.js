import * as THREE from "three";

export const availableMaterials = {
  black: new THREE.MeshStandardMaterial({ color: "#222222", roughness: 0.8 }),
  silver: new THREE.MeshStandardMaterial({ color: "#d1d1d1", metalness: 0.8, roughness: 0.4 }),
  singleGlass: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.1, transparent: true, opacity: 0.3 }),
  wood: new THREE.MeshStandardMaterial({ color: "#a0522d" }),
  whitePanel: new THREE.MeshStandardMaterial({ color: "#f5f5f5", roughness: 0.9 }),
};