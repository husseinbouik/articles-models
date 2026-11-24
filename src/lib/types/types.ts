import type { ReactNode, Dispatch, SetStateAction } from "react";
import * as THREE from "three";

// =================================================================
// Generic & Config Types
// =================================================================
export type HandlerConfigProps = {
  xPosition?: number | string;
  yPosition?: number | string;
  rotation?: number | string;
  rotationX?: number | string;
  rotationY?: number | string;
  handlerHeight?: number | string;
  zPosition?: number | string;
  handlerMaterial?: MaterialDefinition;
  cpid?: string;
  secondCutHeight?: number;
};

export type Position = {
  x: number;
  y: number;
  z: number;
};

/**
 * Represents the complete configuration of a single door.
 */
export type DoorConfig = {
  name: string;
  width: number;
  height: number;
  depth: number;
  frontDepth?: number;
  backDepth?: number;
  frontPanelWidth?: number;
  midRailPosition?: number;
  cutYPosition?: number;
  doorPivot: "left" | "right";
  doorOpening: "in" | "out";
  handleSide?: "left" | "right";
  is2D: boolean;
  handlerHeight?: number;
  numberOfCuts?: number;
  selectedHandler:
    | "None"
    | "HL01"
    | "HL02"
    | "HL03"
    | "HL04"
    | "HL05"
    | "HLModel";
  frameVariant?: "top" | "bottom" | "none" | "full" | "center";
  edgeColor?: string;
  edgeOpacity?: number;
  edgeLineWidth?: number;
  edgeLineEnabled?: boolean;
  shadow?: boolean;
  /**
   * Material for the inner panel inlay. Undefined means no panel is drawn.
   * Mirrors MaterialProps.innerPanelMaterial so the UI can drive it.
   */
  innerPanelMaterial?: MaterialDefinition;
};

// =================================================================
// Edge Line Config
// =================================================================

export type EdgeLineConfig = {
  color?: string;
  opacity?: number;
  lineWidth?: number;
  enabled?: boolean;
};

// =================================================================
// Material Related Types
// =================================================================

/**
 * Defines a material. Can be a CSS color string, a predefined material name,
 * a texture URL, or an object with value and opacity.
 */
export type MaterialDefinition =
  | string
  | { value: string; opacity?: number }
  | THREE.Material
  | null
  | undefined;

/**
 * Props for defining materials for different parts of a door.
 */
export type MaterialProps = {
  doorMaterial?: MaterialDefinition;
  frontMaterial?: MaterialDefinition;
  backMaterial?: MaterialDefinition;
  /**
   * Material for the inner panel — the thin inlay that fills the frame
   * opening on the framed and arched doors. Unlike the other slots this one
   * does NOT fall back to `doorMaterial`: leave it unset and the panel is not
   * rendered at all. Set it to a colour, texture URL or THREE.Material to
   * make the panel appear.
   */
  innerPanelMaterial?: MaterialDefinition;
};

// =================================================================
// Component Prop Types
// =================================================================

/**
 * Props for the core door model components (Door_FA_5a, Door_FA_7_P, etc.).
 */
export type DoorCutsParam = {
  width?: number; // Cut width
  numberOfCuts?: number;
  segmentWidth?: number; // Spacer width
};

/**
 * Props for the core door model components (Door_FA_5a, Door_FA_7_P, etc.).
 */
export interface DoorModelProps {
  cpid?: string;
  materials?: MaterialProps;
  doorPivot?: "left" | "right";
  doorOpening?: "in" | "out";
  handleSide?: "left" | "right";
  width?: number;
  height?: number;
  depth?: number;
  frontDepth?: number;
  backDepth?: number;
  frontPanelWidth?: number;
  midRailPosition?: number;
  cutYPosition?: number;
  handlerHeight?: number;
  position?: [number, number, number];
  handler?: HandlerConfigProps;
  doorCutsParam?: DoorCutsParam;
  numberOfCuts?: number;
  frameVariant?: "top" | "bottom" | "none" | "full" | "center";
  debugEdges?: boolean;
  edgeLine?: EdgeLineConfig;
  edgeColor?: string;
  edgeOpacity?: number;
  edgeLineWidth?: number;
  edgeLineEnabled?: boolean;
  shadow?: boolean;
}

// =================================================================
// Door-Specific Geometry Types (For Context)
// =================================================================

/** Configuration for the main handle cutout of Door_FA_2a (HL01). */
export type HL01HandleType = {
  visible: boolean;
  verticalPosition: number;
  horizontalSide: "left" | "right";
  horizontalOffset: number;
  length: number;
  width: number;
  topLeftRadius: number;
  topRightRadius: number;
  bottomLeftRadius: number;
  bottomRightRadius: number;
  depthFactor: number;
  rotation: number;
  material: MaterialDefinition;
  // Top shape (angled cut above handler)
  topShapeVisible: boolean;
  topShapeWidth: number;
  topShapeHeight: number;
  topShapeAngle: number; // degrees, 45 = diagonal
  topShapeDepthFactor: number;
  topShapeOffsetY: number; // gap between handler top and shape bottom
  topShapeOffsetX: number; // horizontal offset relative to handler
};

/** Configuration for the main handle cutout of Door_FA_2b. */
export type BodyThreeHandleType = {
  visible: boolean;
  verticalPosition: number;
  horizontalSide: "left" | "right";
  horizontalOffset: number;
  length: number;
  width: number;
  topRadius: number;
  bottomRadius: number;
  depthFactor: number; // Replaces 'depth'
  rotation: number;
  material: MaterialDefinition;
};

/** Configuration for the capsule cutout of Door_FA_2b. */
export type BodyThreeCapsuleType = {
  visible: boolean;
  horizontalOffset: number;
  length: number;
  radius: number;
  depthFactor: number; // Replaces 'depth'
  rotationZ: number;
  positionZ: number;
  edgeRadius: number;
  /** How much taller the capsule cutout is compared to the handle cutout. 0 = equal height. */
  secondCutHeight: number;
};

/** Configuration for the main handle cutout of Door_05. */
export type BodyFourHandleType = {
  visible: boolean;
  verticalPosition: number;
  horizontalSide: "left" | "right";
  horizontalOffset: number;
  length: number;
  width: number;
  topRadius: number;
  bottomRadius: number;
  depthFactor: number;
  rotation: number;
  material?: MaterialDefinition;
};

/** Configuration for the capsule cutout of Door_05. */
export type BodyFourCapsuleType = {
  visible: boolean;
  horizontalOffset: number;
  length: number;
  width: number;
  radius: number;
  depthFactor: number;
  rotationZ: number;
  positionZ: number;
  edgeRadius: number;
  secondCutHeight: number;
};

export type HL04HandleType = {
  visible: boolean;
  verticalPosition: number;
  horizontalOffset: number;
  rotation: number;
  material: MaterialDefinition;
};

export type HL05HandleType = {
  visible: boolean;
  verticalPosition: number;
  horizontalOffset: number;
  rotation: number;
  length: number;
  material: MaterialDefinition;
};

export type DoorCutType = {
  visible: boolean;
  width: number;
  height: number;
  depth: number;
  xPosition: number;
  yPosition: number;
  zPosition: number;
  segmentWidth: number;
  numberOfCuts: number;
  rotation: number;
};

export type HLModelHandleType = {
  visible: boolean;
  url: string;
  verticalPosition: number;
  horizontalOffset: number;
  rotationY: number;
  scale: number;
  zOffset: number;
  selectedMesh?: string;
};

// =================================================================
// Context Related Types
// =================================================================

/**
 * Props for the ConfiguratorProvider component.
 */
export type ConfiguratorProviderProps = {
  children: ReactNode;
  initialConfig?: Partial<DoorConfig>;
  handlerConfig?: HandlerConfigProps; // Explicit handler config from App
};

/**
 * The shape of the value provided by the DoorContext.
 */
export type ConfiguratorContextType = {
  doorConfig: DoorConfig;
  setDoorConfig: (newConfig: Partial<DoorConfig>) => void;
  hl01Handle: HL01HandleType;
  setHL01Handle: Dispatch<SetStateAction<HL01HandleType>>;
  bodyThreeHandle: BodyThreeHandleType;
  setBodyThreeHandle: Dispatch<SetStateAction<BodyThreeHandleType>>;
  bodyThreeCapsule: BodyThreeCapsuleType;
  setBodyThreeCapsule: Dispatch<SetStateAction<BodyThreeCapsuleType>>;
  bodyFourHandle: BodyFourHandleType;
  setBodyFourHandle: Dispatch<SetStateAction<BodyFourHandleType>>;
  bodyFourCapsule: BodyFourCapsuleType;
  setBodyFourCapsule: Dispatch<SetStateAction<BodyFourCapsuleType>>;
  hl04Handle: HL04HandleType;
  setHL04Handle: Dispatch<SetStateAction<HL04HandleType>>;
  hl05Handle: HL05HandleType;
  setHL05Handle: Dispatch<SetStateAction<HL05HandleType>>;
  doorCut: DoorCutType;
  setDoorCut: Dispatch<SetStateAction<DoorCutType>>;
  hlModelHandle: HLModelHandleType;
  setHLModelHandle: Dispatch<SetStateAction<HLModelHandleType>>;
  doorFA6Config: DoorFA6ConfigType;
  setDoorFA6Config: Dispatch<SetStateAction<DoorFA6ConfigType>>;
};

export type DoorFA6ConfigType = {
  topLeftRadius: number;
  topRightRadius: number;
};
