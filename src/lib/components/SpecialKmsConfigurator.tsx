import React, { useMemo } from "react";
import { ConfiguratorProvider } from "../context/DoorContext";
import SpecialKms from "./SpecialKms";
import type {
  MaterialProps,
  HandlerConfigProps,
  DoorCutsParam,
  EdgeLineConfig,
} from "../types/types";

type DoorConfiguratorProps = {
  cpid?: string;
  materials?: Partial<MaterialProps>;
  doorPivot?: "left" | "right";
  doorOpening?: "in" | "out";
  is2D?: boolean;
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
  handleSide?: "left" | "right";
  frameVariant?: "top" | "bottom" | "none" | "full" | "center";
  handler?: HandlerConfigProps;
  doorCutsParam?: DoorCutsParam;
  numberOfCuts?: number;
  edgeLine?: EdgeLineConfig;
  debugEdges?: boolean;
  shadow?: boolean;
};

const SpecialKmsConfigurator = ({
  cpid,
  materials,
  doorPivot,
  doorOpening,
  is2D,
  width,
  height,
  depth,
  frontDepth,
  backDepth,
  frontPanelWidth,
  midRailPosition,
  cutYPosition,
  handlerHeight,
  position,
  handleSide,
  frameVariant,
  handler,
  doorCutsParam,
  numberOfCuts,
  edgeLine,
  debugEdges,
  shadow,
}: DoorConfiguratorProps) => {
  const initialConfig = useMemo(() => {
    const config = {
      cpid,
      doorPivot,
      doorOpening,
      is2D,
      width,
      height,
      depth,
      frontDepth,
      backDepth,
      frontPanelWidth,
      midRailPosition,
      cutYPosition,
      handlerHeight,
      position,
      handleSide,
      frameVariant,
    };

    Object.keys(config).forEach(
      key => (config as any)[key] === undefined && delete (config as any)[key],
    );
    return config;
  }, [
    cpid,
    doorPivot,
    doorOpening,
    is2D,
    width,
    height,
    depth,
    frontDepth,
    backDepth,
    frontPanelWidth,
    midRailPosition,
    cutYPosition,
    handlerHeight,
    position,
    handleSide,
    frameVariant,
  ]);

  return (
    <ConfiguratorProvider initialConfig={initialConfig} handlerConfig={handler}>
      <SpecialKms
        cpid={cpid}
        materials={materials}
        doorPivot={doorPivot}
        doorOpening={doorOpening}
        width={width}
        height={height}
        depth={depth}
        frontDepth={frontDepth}
        backDepth={backDepth}
        frontPanelWidth={frontPanelWidth}
        midRailPosition={midRailPosition}
        cutYPosition={cutYPosition}
        handlerHeight={handlerHeight}
        position={position}
        handleSide={handleSide}
        frameVariant={frameVariant}
        doorCutsParam={doorCutsParam}
        numberOfCuts={numberOfCuts}
        handler={handler}
        edgeLine={edgeLine}
        debugEdges={debugEdges}
        shadow={shadow}
      />
    </ConfiguratorProvider>
  );
};

export default SpecialKmsConfigurator;
