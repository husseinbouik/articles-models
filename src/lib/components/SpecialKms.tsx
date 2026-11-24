import React, { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useConfigurator, PRESET_DATA } from "../context/DoorContext";
import type { DoorModelProps, HandlerConfigProps } from "../types/types";
import { Door_FA_5a } from "./models/FA_5a";
import { Door_FA_7_P } from "./models/FA_7_P";
import { Door_FA_1 } from "./models/FA_1/Door_FA_1";
import { Panel_FA_1 } from "./models/FA_1/Panel_FA_1";
import { Bin_FA_1 } from "./models/FA_1/Bin_FA_1";
import { Drawer_FA_1 } from "./models/FA_1/Drawer_FA_1";
import { Door_FA_2a } from "./models/FA_2a/Door_FA_2a";
import { Panel_FA_2a } from "./models/FA_2a/Panel_FA_2a";
import { Bin_FA_2a } from "./models/FA_2a/Bin_FA_2a";
import { Drawer_FA_2a } from "./models/FA_2a/Drawer_FA_2a";
import { Door_FA_2b } from "./models/FA_2b/Door_FA_2b";
import { Panel_FA_2b } from "./models/FA_2b/Panel_FA_2b";
import { Bin_FA_2b } from "./models/FA_2b/Bin_FA_2b";
import { Drawer_FA_2b } from "./models/FA_2b/Drawer_FA_2b";
import { Door_FA_2c } from "./models/FA_2c/Door_FA_2c";
import { Panel_FA_2c } from "./models/FA_2c/Panel_FA_2c";
import { Bin_FA_2c } from "./models/FA_2c/Bin_FA_2c";
import { Drawer_FA_2c } from "./models/FA_2c/Drawer_FA_2c";
import { Door_FA_3 } from "./models/FA_3/Door_FA_3";
import { Panel_FA_3 } from "./models/FA_3/Panel_FA_3";
import { Bin_FA_3 } from "./models/FA_3/Bin_FA_3";
import { Drawer_FA_3 } from "./models/FA_3/Drawer_FA_3";
import { Door_FA_2d } from "./models/FA_2d";
import { Door_FA_2e } from "./models/FA_2e";
import { Door_FA_4a } from "./models/FA_4a";
import { Door_FA_4b } from "./models/FA_4b";
import { Door_FA_5b } from "./models/FA_5b";
import { Door_FA_7 } from "./models/FA_7";
import { Door_FA_6 } from "./models/FA_6/Door_FA_6";
import { Panel_FA_6 } from "./models/FA_6/Panel_FA_6";
import { Bin_FA_6 } from "./models/FA_6/Bin_FA_6";
import { Door_FA_8 } from "./models/FA_8/Door_FA_8";
import { Panel_FA_8 } from "./models/FA_8/Panel_FA_8";
import { Bin_FA_8 } from "./models/FA_8/Bin_FA_8";

function SpecialKms(props: DoorModelProps) {
  const { doorConfig, setDoorConfig } = useConfigurator();

  // This effect now only handles loading the correct preset when the `cpid` prop changes.
  useEffect(() => {
    // Check if the provided cpid corresponds to a preset different from the one in the context.
    const presetData = PRESET_DATA[props.cpid || ""];
    if (presetData && presetData.name !== doorConfig.name) {
      setDoorConfig(presetData);
    }
  }, [props.cpid, doorConfig.name, setDoorConfig]);

  // Sync handler prop to context
  const {
    setBodyThreeHandle,
    setBodyFourHandle,
    setHL04Handle,
    setHL05Handle,
    setBodyThreeCapsule,
    setBodyFourCapsule,
  } = useConfigurator();
  useEffect(() => {
    if (props.handler) {
      const handlerConfig = props.handler;
      const lengthVal =
        typeof handlerConfig.handlerHeight === "number"
          ? handlerConfig.handlerHeight
          : parseFloat(handlerConfig.handlerHeight as string);

      const rotationVal =
        typeof handlerConfig.rotation === "number"
          ? handlerConfig.rotation
          : parseFloat(handlerConfig.rotation as string);

      // Handler 04 Update
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

      // Handler Handler_05 (formerly Handler 05) Update
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

      // Update HL04
      setHL04Handle(prev => ({
        ...prev,
        ...(handlerConfig.xPosition !== undefined && {
          horizontalOffset: Number(handlerConfig.xPosition),
        }),
        ...(handlerConfig.yPosition !== undefined && {
          verticalPosition: Number(handlerConfig.yPosition),
        }),
        ...(handlerConfig.rotation !== undefined &&
          !isNaN(rotationVal) && { rotation: rotationVal }),
        ...(handlerConfig.handlerMaterial && {
          material: handlerConfig.handlerMaterial,
        }),
      }));

      // Update HL05
      setHL05Handle(prev => ({
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
          h => h.toLowerCase() === String(handlerConfig.cpid).toLowerCase(),
        );
        if (matchedHandler) {
          setDoorConfig({ selectedHandler: matchedHandler });
        }
      }
    }
  }, [
    props.handler,
    setBodyThreeHandle,
    setBodyFourHandle,
    setHL04Handle,
    setHL05Handle,
    setDoorConfig,
  ]);

  // Sync secondCutHeight separately — depends on the primitive value so it only
  // fires when the prop actually changes, not on every parent re-render.
  const prevSecondCutHeight = useRef<number | undefined>(undefined);
  useEffect(() => {
    const val = props.handler?.secondCutHeight;
    if (val !== undefined && val !== prevSecondCutHeight.current) {
      prevSecondCutHeight.current = val;
      setBodyThreeCapsule(prev => ({ ...prev, secondCutHeight: val }));
      setBodyFourCapsule(prev => ({ ...prev, secondCutHeight: val }));
    }
  }, [props.handler?.secondCutHeight, setBodyThreeCapsule, setBodyFourCapsule]);

  // Sync doorCutsParam prop to context. The top-level `numberOfCuts` prop
  // takes precedence over `doorCutsParam.numberOfCuts` when both are given.
  const { setDoorCut } = useConfigurator();
  useEffect(() => {
    if (props.doorCutsParam || props.numberOfCuts !== undefined) {
      const { width, numberOfCuts, segmentWidth } = props.doorCutsParam ?? {};
      const effectiveNumberOfCuts = props.numberOfCuts ?? numberOfCuts;
      setDoorCut(prev => ({
        ...prev,
        ...(width !== undefined && { width }),
        ...(effectiveNumberOfCuts !== undefined && {
          numberOfCuts: effectiveNumberOfCuts,
        }),
        ...(segmentWidth !== undefined && { segmentWidth }),
      }));
    }
  }, [props.doorCutsParam, props.numberOfCuts, setDoorCut]);

  // Create the final props to be passed to the door models.
  // Props passed directly to SpecialKMS (`props.width`, etc.) always take precedence.
  // If a prop is not provided, the value from the context (`doorConfig`) is used as a fallback.
  const doorProps: DoorModelProps = {
    ...props,
    width: props.width ?? doorConfig.width,
    height: props.height ?? doorConfig.height,
    depth: props.depth ?? doorConfig.depth,
    frontDepth: props.frontDepth ?? doorConfig.frontDepth,
    backDepth: props.backDepth ?? doorConfig.backDepth,
    frontPanelWidth: props.frontPanelWidth ?? doorConfig.frontPanelWidth,
    midRailPosition: props.midRailPosition ?? doorConfig.midRailPosition,
    cutYPosition: props.cutYPosition ?? doorConfig.cutYPosition,
    handlerHeight: props.handlerHeight ?? doorConfig.handlerHeight,
    handleSide: props.handleSide ?? doorConfig.handleSide,
    doorCutsParam: props.doorCutsParam,
    frameVariant: props.frameVariant ?? doorConfig.frameVariant,
    debugEdges: (props.debugEdges ?? doorConfig.is2D) ? false : true, // default debug edges to true in 3D
    edgeColor: props.edgeLine?.color ?? props.edgeColor ?? doorConfig.edgeColor,
    edgeOpacity: props.edgeLine?.opacity ?? props.edgeOpacity ?? doorConfig.edgeOpacity,
    edgeLineWidth: props.edgeLine?.lineWidth ?? props.edgeLineWidth ?? doorConfig.edgeLineWidth,
    edgeLineEnabled: props.edgeLine?.enabled ?? props.edgeLineEnabled ?? doorConfig.edgeLineEnabled,
  };

  // Determine which door model to render based on the context's current name,
  // which is set by the cpid prop or the UI.
  // Normalize doorToRender: if it starts with Drawer_FA_, map it to Door_FA_
  // and strip any variant suffixes like _Top, _Bottom, or _Center.
  // Determine which door model to render based on the context's current name,
  // which is set by the cpid prop or the UI.
  // Normalize doorToRender: if it starts with Drawer_FA_ (but not Drawer_FA_1), map it to Door_FA_
  // and strip any variant suffixes like _Top, _Bottom, or _Center.
  let doorToRender = doorConfig.name;
  if (
    doorConfig.name.startsWith("Drawer_FA_") ||
    doorConfig.name.startsWith("Panel_FA_") ||
    doorConfig.name.startsWith("Bin_FA_")
  ) {
    if (
      doorConfig.name !== "Drawer_FA_1" &&
      doorConfig.name !== "Drawer_FA_8"
    ) {
      doorToRender = doorConfig.name
        .replace("Drawer_FA_", "Door_FA_")
        .replace("Panel_FA_", "Door_FA_")
        .replace("Bin_FA_", "Door_FA_")
        .replace(/_(Top|Bottom|Center)$/, "");
    }
  }

  const groupRef = useRef<THREE.Group>(null);
  const shadow = props.shadow ?? doorConfig.shadow ?? true;
  const invalidate = useThree(s => s.invalidate);
  useLayoutEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = shadow;
        obj.receiveShadow = shadow;
      }
    });
    invalidate();
  });  // no deps — runs after every render so R3F never wins the race

  return (
    <group ref={groupRef} position={props.position}>
      {doorToRender === "Door_FA_1" && <Door_FA_1 {...doorProps} />}
      {doorToRender === "Panel_FA_1" && <Panel_FA_1 {...doorProps} />}
      {doorToRender === "Bin_FA_1" && <Bin_FA_1 {...doorProps} />}
      {doorToRender === "Drawer_FA_1" && <Drawer_FA_1 {...doorProps} />}
      {doorToRender === "Door_FA_2a" && <Door_FA_2a {...doorProps} />}
      {doorToRender === "Panel_FA_2a" && <Panel_FA_2a {...doorProps} />}
      {doorToRender === "Bin_FA_2a" && <Bin_FA_2a {...doorProps} />}
      {doorToRender === "Drawer_FA_2a" && <Drawer_FA_2a {...doorProps} />}
      {doorToRender === "Door_FA_2b" && <Door_FA_2b {...doorProps} />}
      {doorToRender === "Panel_FA_2b" && <Panel_FA_2b {...doorProps} />}
      {doorToRender === "Bin_FA_2b" && <Bin_FA_2b {...doorProps} />}
      {doorToRender === "Drawer_FA_2b" && <Drawer_FA_2b {...doorProps} />}
      {doorToRender === "Door_FA_2c" && <Door_FA_2c {...doorProps} />}
      {doorToRender === "Panel_FA_2c" && <Panel_FA_2c {...doorProps} />}
      {doorToRender === "Bin_FA_2c" && <Bin_FA_2c {...doorProps} />}
      {doorToRender === "Drawer_FA_2c" && <Drawer_FA_2c {...doorProps} />}
      {doorToRender === "Door_FA_2d" && <Door_FA_2d {...doorProps} />}
      {doorToRender === "Door_FA_2e" && <Door_FA_2e {...doorProps} />}
      {doorToRender === "Panel_FA_2d" && <Door_FA_2d {...doorProps} />}
      {doorToRender === "Bin_FA_2d" && <Door_FA_2d {...doorProps} />}
      {doorToRender === "Panel_FA_2e" && <Door_FA_2e {...doorProps} />}
      {doorToRender === "Bin_FA_2e" && <Door_FA_2e {...doorProps} />}
      {doorToRender === "Door_FA_3" && <Door_FA_3 {...doorProps} />}
      {doorToRender === "Panel_FA_3" && <Panel_FA_3 {...doorProps} />}
      {doorToRender === "Bin_FA_3" && <Bin_FA_3 {...doorProps} />}
      {doorToRender === "Drawer_FA_3" && <Drawer_FA_3 {...doorProps} />}
      {doorToRender === "Door_FA_4a" && <Door_FA_4a {...doorProps} />}
      {doorToRender === "Door_FA_4b" && <Door_FA_4b {...doorProps} />}
      {doorToRender === "Door_FA_5a" && <Door_FA_5a {...doorProps} />}
      {doorToRender === "Door_FA_5b" && <Door_FA_5b {...doorProps} />}
      {doorToRender === "Panel_FA_4a" && <Door_FA_4a {...doorProps} />}
      {doorToRender === "Bin_FA_4a" && <Door_FA_4a {...doorProps} />}
      {doorToRender === "Panel_FA_4b" && <Door_FA_4b {...doorProps} />}
      {doorToRender === "Bin_FA_4b" && <Door_FA_4b {...doorProps} />}
      {doorToRender === "Panel_FA_5a" && <Door_FA_5a {...doorProps} />}
      {doorToRender === "Bin_FA_5a" && <Door_FA_5a {...doorProps} />}
      {doorToRender === "Panel_FA_5b" && <Door_FA_5b {...doorProps} />}
      {doorToRender === "Bin_FA_5b" && <Door_FA_5b {...doorProps} />}
      {doorToRender === "Door_FA_6" && <Door_FA_6 {...doorProps} />}
      {doorToRender === "Panel_FA_6" && <Panel_FA_6 {...doorProps} />}
      {doorToRender === "Bin_FA_6" && <Bin_FA_6 {...doorProps} />}
      {doorToRender === "Door_FA_7" && <Door_FA_7 {...doorProps} />}
      {doorToRender === "Door_FA_7_P" && <Door_FA_7_P {...doorProps} />}
      {doorToRender === "Panel_FA_7" && <Door_FA_7 {...doorProps} />}
      {doorToRender === "Bin_FA_7" && <Door_FA_7 {...doorProps} />}
      {doorToRender === "Panel_FA_7_P" && <Door_FA_7_P {...doorProps} />}
      {doorToRender === "Bin_FA_7_P" && <Door_FA_7_P {...doorProps} />}
      {doorToRender === "Door_FA_8" && <Door_FA_8 {...doorProps} />}
      {doorToRender === "Panel_FA_8" && <Panel_FA_8 {...doorProps} />}
      {doorToRender === "Bin_FA_8" && <Bin_FA_8 {...doorProps} />}
    </group>
  );
}

export default SpecialKms;
