import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type {
  DoorConfig,
  HL01HandleType,
  BodyThreeHandleType,
  BodyThreeCapsuleType,
  BodyFourHandleType,
  BodyFourCapsuleType,
  HL04HandleType,
  HL05HandleType,
  DoorCutType,
  HLModelHandleType,
  ConfiguratorContextType,
  ConfiguratorProviderProps,
  HandlerConfigProps,
} from "../types/types";

export const PRESET_DATA: {
  [key: string]: Partial<DoorConfig> & { name: string };
} = {
  Door_FA_1: {
    name: "Door_FA_1",
    width: 500,
    height: 2200,
    depth: 18,
    selectedHandler: "None",
  },
  Panel_FA_1: {
    name: "Panel_FA_1",
    width: 500,
    height: 600,
    depth: 18,
    selectedHandler: "None",
  },
  Bin_FA_1: {
    name: "Bin_FA_1",
    width: 600,
    height: 400,
    depth: 18,
    selectedHandler: "None",
  },
  Drawer_FA_1: {
    name: "Drawer_FA_1",
    width: 800,
    height: 200,
    depth: 18,
    selectedHandler: "None",
  },
  Door_FA_2a: {
    name: "Door_FA_2a",
    width: 500,
    height: 2200,
    depth: 18,
    selectedHandler: "HL01",
  },
  Panel_FA_2a: {
    name: "Panel_FA_2a",
    width: 500,
    height: 600,
    depth: 18,
    selectedHandler: "HL01",
  },
  Bin_FA_2a: {
    name: "Bin_FA_2a",
    width: 600,
    height: 400,
    depth: 18,
    selectedHandler: "HL01",
  },
  Drawer_FA_2a: {
    name: "Drawer_FA_2a",
    width: 800,
    height: 200,
    depth: 18,
    selectedHandler: "HL01",
  },
  Door_FA_2b: {
    name: "Door_FA_2b",
    width: 500,
    height: 2200,
    depth: 18,
    selectedHandler: "HL02",
  },
  Panel_FA_2b: {
    name: "Panel_FA_2b",
    width: 500,
    height: 600,
    depth: 18,
    selectedHandler: "HL02",
  },
  Bin_FA_2b: {
    name: "Bin_FA_2b",
    width: 600,
    height: 400,
    depth: 18,
    selectedHandler: "HL02",
  },
  Drawer_FA_2b: {
    name: "Drawer_FA_2b",
    width: 800,
    height: 200,
    depth: 18,
    selectedHandler: "HL02",
  },
  Door_FA_2c: {
    name: "Door_FA_2c",
    width: 500,
    height: 2200,
    depth: 18,
    selectedHandler: "HL03",
  },
  Panel_FA_2c: {
    name: "Panel_FA_2c",
    width: 500,
    height: 600,
    depth: 18,
    selectedHandler: "HL03",
  },
  Bin_FA_2c: {
    name: "Bin_FA_2c",
    width: 600,
    height: 400,
    depth: 18,
    selectedHandler: "HL03",
  },
  Drawer_FA_2c: {
    name: "Drawer_FA_2c",
    width: 800,
    height: 200,
    depth: 18,
    selectedHandler: "HL03",
  },
  Door_FA_3: {
    name: "Door_FA_3",
    width: 500,
    height: 2200,
    depth: 18,
    selectedHandler: "HLModel",
  },
  Panel_FA_3: {
    name: "Panel_FA_3",
    width: 500,
    height: 600,
    depth: 18,
    selectedHandler: "HLModel",
  },
  Bin_FA_3: {
    name: "Bin_FA_3",
    width: 600,
    height: 400,
    depth: 18,
    selectedHandler: "HLModel",
  },
  Drawer_FA_3: {
    name: "Drawer_FA_3",
    width: 800,
    height: 200,
    depth: 18,
    selectedHandler: "HLModel",
  },
  Door_FA_2d: {
    name: "Door_FA_2d",
    width: 500,
    height: 2200,
    depth: 18,
    selectedHandler: "HL04",
  },
  Panel_FA_2d: {
    name: "Panel_FA_2d",
    width: 500,
    height: 600,
    depth: 18,
    selectedHandler: "HL04",
  },
  Bin_FA_2d: {
    name: "Bin_FA_2d",
    width: 600,
    height: 400,
    depth: 18,
    selectedHandler: "HL04",
  },
  Door_FA_2e: {
    name: "Door_FA_2e",
    width: 500,
    height: 2200,
    depth: 18,
    selectedHandler: "HL05",
  },
  Panel_FA_2e: {
    name: "Panel_FA_2e",
    width: 500,
    height: 600,
    depth: 18,
    selectedHandler: "HL05",
  },
  Bin_FA_2e: {
    name: "Bin_FA_2e",
    width: 600,
    height: 400,
    depth: 18,
    selectedHandler: "HL05",
  },
  Door_FA_4a: {
    name: "Door_FA_4a",
    width: 500,
    height: 2200,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Panel_FA_4a: {
    name: "Panel_FA_4a",
    width: 500,
    height: 600,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Bin_FA_4a: {
    name: "Bin_FA_4a",
    width: 600,
    height: 400,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Door_FA_4b: {
    name: "Door_FA_4b",
    width: 500,
    height: 2200,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Panel_FA_4b: {
    name: "Panel_FA_4b",
    width: 500,
    height: 600,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Bin_FA_4b: {
    name: "Bin_FA_4b",
    width: 600,
    height: 400,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Door_FA_5a: {
    name: "Door_FA_5a",
    width: 500,
    height: 2200,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Panel_FA_5a: {
    name: "Panel_FA_5a",
    width: 500,
    height: 600,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Bin_FA_5a: {
    name: "Bin_FA_5a",
    width: 600,
    height: 400,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Door_FA_5b: {
    name: "Door_FA_5b",
    width: 500,
    height: 2200,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Panel_FA_5b: {
    name: "Panel_FA_5b",
    width: 500,
    height: 600,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Bin_FA_5b: {
    name: "Bin_FA_5b",
    width: 600,
    height: 400,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Door_FA_6: {
    name: "Door_FA_6",
    width: 500,
    height: 2200,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Panel_FA_6: {
    name: "Panel_FA_6",
    width: 500,
    height: 600,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Bin_FA_6: {
    name: "Bin_FA_6",
    width: 600,
    height: 400,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Drawer_FA_6_Top: {
    name: "Drawer_FA_6_Top",
    width: 800,
    height: 200,
    frontDepth: 10,
    backDepth: 12,
    frameVariant: "top",
    selectedHandler: "HLModel",
  },
  Drawer_FA_6_Center: {
    name: "Drawer_FA_6_Center",
    width: 800,
    height: 200,
    frontDepth: 10,
    backDepth: 12,
    frameVariant: "center",
    selectedHandler: "HLModel",
  },
  Drawer_FA_6_Bottom: {
    name: "Drawer_FA_6_Bottom",
    width: 800,
    height: 200,
    frontDepth: 10,
    backDepth: 12,
    frameVariant: "bottom",
    selectedHandler: "HLModel",
  },
  Door_FA_7: {
    name: "Door_FA_7",
    width: 500,
    height: 2200,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Panel_FA_7: {
    name: "Panel_FA_7",
    width: 500,
    height: 600,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Bin_FA_7: {
    name: "Bin_FA_7",
    width: 600,
    height: 400,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Door_FA_7_P: {
    name: "Door_FA_7_P",
    width: 500,
    height: 2200,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Panel_FA_7_P: {
    name: "Panel_FA_7_P",
    width: 500,
    height: 600,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },
  Bin_FA_7_P: {
    name: "Bin_FA_7_P",
    width: 600,
    height: 400,
    frontDepth: 10,
    backDepth: 12,
    selectedHandler: "HLModel",
  },

  Door_FA_8: {
    name: "Door_FA_8",
    width: 500,
    height: 2200,
    frontDepth: 20,
    backDepth: 10,
  },
  Panel_FA_8: {
    name: "Panel_FA_8",
    width: 500,
    height: 600,
    frontDepth: 20,
    backDepth: 10,
  },
  Bin_FA_8: {
    name: "Bin_FA_8",
    width: 600,
    height: 400,
    frontDepth: 20,
    backDepth: 10,
  },

  Drawer_FA_8_Top: {
    name: "Drawer_FA_8_Top",
    width: 800,
    height: 200,
    frontDepth: 20,
    backDepth: 10,
    frameVariant: "top",
  },
  Drawer_FA_8_Center: {
    name: "Drawer_FA_8_Center",
    width: 800,
    height: 200,
    frontDepth: 20,
    backDepth: 10,
    frameVariant: "center",
  },
  Drawer_FA_8_Bottom: {
    name: "Drawer_FA_8_Bottom",
    width: 800,
    height: 200,
    frontDepth: 20,
    backDepth: 10,
    frameVariant: "bottom",
  },

  Drawer_FA_4a: {
    name: "Drawer_FA_4a",
    width: 800,
    height: 200,
    frontDepth: 10,
    backDepth: 12,
    frameVariant: "full",
    selectedHandler: "HLModel",
  },
  Drawer_FA_4b: {
    name: "Drawer_FA_4b",
    width: 800,
    height: 200,
    frontDepth: 10,
    backDepth: 12,
    frameVariant: "full",
    selectedHandler: "HLModel",
  },
  Drawer_FA_5a: {
    name: "Drawer_FA_5a",
    width: 800,
    height: 200,
    frontDepth: 10,
    backDepth: 12,
    frameVariant: "full",
    selectedHandler: "HLModel",
  },
  Drawer_FA_5b: {
    name: "Drawer_FA_5b",
    width: 800,
    height: 200,
    frontDepth: 10,
    backDepth: 12,
    frameVariant: "full",
    selectedHandler: "HLModel",
  },

  Drawer_FA_7_Top: {
    name: "Drawer_FA_7_Top",
    width: 800,
    height: 200,
    frontDepth: 10,
    backDepth: 12,
    frameVariant: "top",
    selectedHandler: "HLModel",
  },

  Drawer_FA_7_Center: {
    name: "Drawer_FA_7_Center",
    width: 800,
    height: 200,
    frontDepth: 10,
    backDepth: 12,
    frameVariant: "center",
    selectedHandler: "HLModel",
  },
  Drawer_FA_7_Bottom: {
    name: "Drawer_FA_7_Bottom",
    width: 800,
    height: 200,
    frontDepth: 10,
    backDepth: 12,
    frameVariant: "bottom",
    selectedHandler: "HLModel",
  },
  Drawer_FA_7_P_Top: {
    name: "Drawer_FA_7_P_Top",
    width: 800,
    height: 200,
    frontDepth: 10,
    backDepth: 12,
    frameVariant: "top",
    selectedHandler: "HLModel",
  },

  Drawer_FA_7_P_Center: {
    name: "Drawer_FA_7_P_Center",
    width: 800,
    height: 200,
    frontDepth: 10,
    backDepth: 12,
    frameVariant: "center",
    selectedHandler: "HLModel",
  },
  Drawer_FA_7_P_Bottom: {
    name: "Drawer_FA_7_P_Bottom",
    width: 800,
    height: 200,
    frontDepth: 10,
    backDepth: 12,
    frameVariant: "bottom",
    selectedHandler: "HLModel",
  },
  Drawer_FA_2d: {
    name: "Drawer_FA_2d",
    width: 800,
    height: 200,
    depth: 18,
    frameVariant: "full",
    selectedHandler: "HL04",
  },
  Drawer_FA_2e: {
    name: "Drawer_FA_2e",
    width: 800,
    height: 200,
    depth: 18,
    frameVariant: "full",
    selectedHandler: "HL05",
  },
};

const ConfiguratorContext = createContext<ConfiguratorContextType | undefined>(
  undefined,
);

const firstPresetName = Object.keys(PRESET_DATA)[0];
const firstPreset = PRESET_DATA[firstPresetName];

const DYNAMIC_INITIAL_STATE: DoorConfig = {
  name: firstPreset.name,
  width: firstPreset.width || 500,
  height: firstPreset.height || 2000,
  depth: 22,
  frontDepth: firstPreset.frontDepth || 10,
  backDepth: firstPreset.backDepth || 12,
  cutYPosition: firstPreset.cutYPosition || 0,
  handlerHeight: firstPreset.handlerHeight || 10,
  numberOfCuts: 4,
  doorPivot: "right",
  doorOpening: "out",
  handleSide: "right",
  is2D: false,
  selectedHandler: "None",
  frameVariant: "none",
  frontPanelWidth: 30,
  edgeColor: "#000000",
  edgeOpacity: 1,
  edgeLineWidth: 1,
  edgeLineEnabled: true,
  shadow: true,
  // Left undefined on purpose: no inner panel until one is chosen.
  innerPanelMaterial: undefined,
};

export const ConfiguratorProvider = ({
  children,
  initialConfig,
  handlerConfig,
}: ConfiguratorProviderProps) => {
  const [doorConfig, setInternalDoorConfig] = useState<DoorConfig>({
    ...DYNAMIC_INITIAL_STATE,
    ...initialConfig,
  });

  // Effect to sync generic handler props from App to the specific handler states
  React.useEffect(() => {
    if (handlerConfig) {
      // Parse height separately
      const lengthVal =
        typeof handlerConfig.handlerHeight === "number"
          ? handlerConfig.handlerHeight
          : parseFloat(handlerConfig.handlerHeight as string);

      const rotationVal =
        typeof handlerConfig.rotation === "number"
          ? handlerConfig.rotation
          : parseFloat(handlerConfig.rotation as string);

      // Handle CPID Selection
      // Handler cpid prop overrides the door's default handler
      if (handlerConfig.cpid) {
        const validHandlers = [
          "None",
          "HL01",
          "HL02",
          "HL03",
          "HL04",
          "HL05",
          "HLModel",
        ] as const;
        const matchedHandler = validHandlers.find(
          h => h === handlerConfig.cpid,
        );
        if (matchedHandler) {
          setInternalDoorConfig(prev => ({
            ...prev,
            selectedHandler: matchedHandler,
          }));
        }
      }

      // Handler HL01 (FA 2a) Update
      setHL01Handle(prev => ({
        ...prev,
        ...(handlerConfig.xPosition !== undefined && {
          horizontalOffset: Number(handlerConfig.xPosition),
        }),
        ...(handlerConfig.yPosition !== undefined && {
          verticalPosition: Number(handlerConfig.yPosition),
        }),
        ...(handlerConfig.rotation !== undefined &&
          !isNaN(rotationVal) && { rotation: rotationVal }),
        ...(handlerConfig.handlerHeight !== undefined &&
          !isNaN(lengthVal) && { length: lengthVal }),
        ...(handlerConfig.handlerMaterial && {
          material: handlerConfig.handlerMaterial,
        }),
      }));

      // Handler HL02 (formerly Handler 04) Update
      // ... (rest of the logic remains, just adding HLModel sync)

      // Handler HLModel Update
      setHLModelHandle(prev => ({
        ...prev,
        ...(handlerConfig.xPosition !== undefined && {
          horizontalOffset: Number(handlerConfig.xPosition),
        }),
        ...(handlerConfig.yPosition !== undefined && {
          verticalPosition: Number(handlerConfig.yPosition),
        }),
        ...(handlerConfig.zPosition !== undefined && {
          zOffset: Number(handlerConfig.zPosition),
        }),
        ...(handlerConfig.rotation !== undefined &&
          !isNaN(rotationVal) && { rotation: rotationVal }),
        ...(handlerConfig.rotationX !== undefined && {
          rotationX: Number(handlerConfig.rotationX),
        }),
        ...(handlerConfig.rotationY !== undefined && {
          rotationY: Number(handlerConfig.rotationY),
        }),
      }));

      // Handler HL02 (formerly Handler 04) Update
      setBodyThreeHandle(prev => ({
        ...prev,
        ...(handlerConfig.xPosition !== undefined && {
          horizontalOffset: Number(handlerConfig.xPosition),
        }),
        ...(handlerConfig.yPosition !== undefined && {
          verticalPosition: Number(handlerConfig.yPosition),
        }),
        ...(handlerConfig.rotation !== undefined &&
          !isNaN(rotationVal) && { rotation: rotationVal }),
        ...(handlerConfig.handlerHeight !== undefined &&
          !isNaN(lengthVal) && { length: lengthVal }),
        ...(handlerConfig.handlerMaterial && {
          material: handlerConfig.handlerMaterial,
        }),
      }));

      // Handler HL03 (formerly Handler 05) Update
      setBodyFourHandle(prev => ({
        ...prev,
        ...(handlerConfig.xPosition !== undefined && {
          horizontalOffset: Number(handlerConfig.xPosition),
        }),
        ...(handlerConfig.yPosition !== undefined && {
          verticalPosition: Number(handlerConfig.yPosition),
        }),
        ...(handlerConfig.rotation !== undefined &&
          !isNaN(rotationVal) && { rotation: rotationVal }),
        ...(handlerConfig.handlerHeight !== undefined &&
          !isNaN(lengthVal) && { length: lengthVal }),
        ...(handlerConfig.handlerMaterial && {
          material: handlerConfig.handlerMaterial,
        }),
      }));

      setHL04Handle(prev => ({
        ...prev,
        ...(handlerConfig.xPosition !== undefined && {
          horizontalOffset: Number(handlerConfig.xPosition),
        }),
        ...(handlerConfig.yPosition !== undefined && {
          verticalPosition: Number(handlerConfig.yPosition),
        }),
        ...(handlerConfig.handlerMaterial && {
          material: handlerConfig.handlerMaterial,
        }),
      }));

      setHL05Handle(prev => ({
        ...prev,
        ...(handlerConfig.xPosition !== undefined && {
          horizontalOffset: Number(handlerConfig.xPosition),
        }),
        ...(handlerConfig.yPosition !== undefined && {
          verticalPosition: Number(handlerConfig.yPosition),
        }),
        ...(handlerConfig.handlerHeight !== undefined &&
          !isNaN(lengthVal) && { length: lengthVal }),
        ...(handlerConfig.handlerMaterial && {
          material: handlerConfig.handlerMaterial,
        }),
      }));
    }
  }, [handlerConfig]);

  // State for HL01 (FA 2a) - per-corner radii, topLeft defaults to ~45% of width
  const [hl01Handle, setHL01Handle] = useState<HL01HandleType>({
    visible: true,
    verticalPosition: 0,
    horizontalSide: "right",
    horizontalOffset: 0,
    length: 990,
    width: 40,
    topLeftRadius: 18, // ~45% of width (40 * 0.45 ≈ 18)
    topRightRadius: 10,
    bottomLeftRadius: 0,
    bottomRightRadius: 0,
    depthFactor: 0.8,
    rotation: 0,
    material: null,
    // Top shape (angled cut above handler)
    topShapeVisible: true,
    topShapeWidth: 40,
    topShapeHeight: 950,
    topShapeAngle: 45,
    topShapeDepthFactor: 0.8,
    topShapeOffsetY: 0, // flush with handler top
    topShapeOffsetX: 0, // centered with handler
  });

  const [bodyThreeHandle, setBodyThreeHandle] = useState<BodyThreeHandleType>({
    visible: true,
    verticalPosition: 0,
    horizontalSide: "right",
    horizontalOffset: 0,
    length: 950,
    width: 40,
    topRadius: 10,
    bottomRadius: 0,
    depthFactor: 0.8,
    rotation: 0,
    material: null,
  });

  // State for Door_FA_2b capsule
  const [bodyThreeCapsule, setBodyThreeCapsule] =
    useState<BodyThreeCapsuleType>({
      visible: true,
      horizontalOffset: 18,
      length: 1000,
      radius: 46,
      depthFactor: 0.6,
      rotationZ: 0,
      positionZ: 4,
      edgeRadius: 5,
      secondCutHeight: 50,
    });

  // Sync secondCutHeight separately — primitive dep so it only fires when the value actually changes.
  const prevSecondCutHeight = useRef<number | undefined>(undefined);
  useEffect(() => {
    const val = handlerConfig?.secondCutHeight;
    if (val !== undefined && val !== prevSecondCutHeight.current) {
      prevSecondCutHeight.current = val;
      setBodyThreeCapsule(prev => ({ ...prev, secondCutHeight: val }));
      setBodyFourCapsule(prev => ({ ...prev, secondCutHeight: val }));
    }
  }, [handlerConfig?.secondCutHeight]);

  // State for Door_05 handle
  const [bodyFourHandle, setBodyFourHandle] = useState<BodyFourHandleType>({
    visible: true,
    verticalPosition: 0, // Default to sensible height
    horizontalSide: "right",
    horizontalOffset: 0,
    length: 120,
    width: 80,
    topRadius: 16,
    bottomRadius: 16,
    depthFactor: 0.7,
    rotation: 0,
  });

  // State for Door_05 capsule
  const [bodyFourCapsule, setBodyFourCapsule] = useState<BodyFourCapsuleType>({
    visible: true,
    horizontalOffset: 6,
    length: 126,
    width: 140,
    radius: 10,
    depthFactor: 0.2,
    rotationZ: 0,
    positionZ: 3,
    edgeRadius: 10,
    secondCutHeight: 0,
  });

  // State for HL04 (FA 2d)
  const [hl04Handle, setHL04Handle] = useState<HL04HandleType>({
    visible: true,
    verticalPosition: 0,
    horizontalOffset: 0, // 70mm from edge
    rotation: 0,
    material: null,
  });

  // State for HL05 (FA 2e)
  const [hl05Handle, setHL05Handle] = useState<HL05HandleType>({
    visible: true,
    verticalPosition: 0,
    horizontalOffset: 0, // 55mm cut depth
    rotation: 0,
    length: 70,
    material: null,
  });

  const [doorCut, setDoorCut] = useState<DoorCutType>({
    visible: true,
    width: 2,
    height: 2200,
    depth: 2,
    xPosition: 0,
    yPosition: 1100,
    zPosition: 8,
    segmentWidth: 98,
    numberOfCuts: 4,
    rotation: 0,
  });

  // State for HLModel
  const [hlModelHandle, setHLModelHandle] = useState<HLModelHandleType>({
    visible: true,
    url: "/models/handles/door_handler_demo.glb",
    verticalPosition: 0,
    horizontalOffset: 0,
    rotationY: 0,
    scale: 2,
    zOffset: 0,
    selectedMesh: "All",
  });

  // State for Door FA 6
  const [doorFA6Config, setDoorFA6Config] = useState<{
    topLeftRadius: number;
    topRightRadius: number;
  }>({
    topLeftRadius: 90,
    topRightRadius: 90,
  });

  const setDoorConfig = useCallback((newConfig: Partial<DoorConfig>) => {
    setInternalDoorConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig,
    }));
  }, []);

  const value = useMemo(
    () => ({
      doorConfig,
      setDoorConfig,
      hl01Handle,
      setHL01Handle,
      bodyThreeHandle,
      setBodyThreeHandle,
      bodyThreeCapsule,
      setBodyThreeCapsule,
      bodyFourHandle,
      setBodyFourHandle,
      bodyFourCapsule,
      setBodyFourCapsule,
      hl04Handle,
      setHL04Handle,
      hl05Handle,
      setHL05Handle,
      doorCut,
      setDoorCut,
      hlModelHandle,
      setHLModelHandle,
      doorFA6Config,
      setDoorFA6Config,
    }),
    [
      doorConfig,
      setDoorConfig,
      hl01Handle,
      bodyThreeHandle,
      bodyThreeCapsule,
      bodyFourHandle,
      bodyFourCapsule,
      hl04Handle,
      hl05Handle,
      doorCut,
      hlModelHandle,
      doorFA6Config,
    ],
  );

  return (
    <ConfiguratorContext.Provider value={value}>
      {children}
    </ConfiguratorContext.Provider>
  );
};

export const useConfigurator = () => {
  const context = useContext(ConfiguratorContext);
  if (!context) {
    throw new Error(
      "useConfigurator must be used within a ConfiguratorProvider",
    );
  }
  return context;
};
