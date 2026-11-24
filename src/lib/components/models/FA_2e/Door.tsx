
import React from "react";
import * as THREE from "three";
import { Geometry, Base } from "@react-three/csg";
import { useConfigurator } from "../../../context/DoorContext";
import { useDoorMaterials } from "../../../hooks/useDoorMaterials";
import type { DoorModelProps, MaterialProps } from "../../../types/types";

import { DoorEdges } from "../DoorEdges";
import { useHandlerCutShapes } from "../../handlers/useHandlerCutShapes";
import { useDoorBoxGeometries } from "../../../hooks/useDoorBoxGeometry";
import { HL01 } from "../../handlers/HL01";
import { HL02 } from "../../handlers/HL02";
import { HL03 } from "../../handlers/HL03";
import { HL04 } from "../../handlers/HL04";
import { HL05 } from "../../handlers/HL05";
import { HLModel } from "../../handlers/HLModel";


export function Door(props: DoorModelProps) {
  const { doorConfig, doorCut } = useConfigurator();
  const materials = useDoorMaterials(props.materials as MaterialProps);

  const width = props.width || 500;
  const height = props.height || 2200;
  const depth = props.depth || 18;
  const cutYPosition = props.cutYPosition || 929;

  // Cut shapes for the edge outline (runs unconditionally, before any return).
  const cutShapes = useHandlerCutShapes(depth, props.handleSide || "right", height);

  // One texture spans the whole door; the edges take a matching slice so
  // they are not squeezed. Runs unconditionally, before any early return.
  const [slabGeometry] = useDoorBoxGeometries(
    [{ width, height, depth }],
    { width, height },
  );

  if (doorConfig.is2D) {
    const color =
      (materials.doorMaterial as THREE.MeshStandardMaterial)?.color ?? "grey";
    return (
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={color} />
      </mesh>
    );
  }

  const renderHandler = () => {
    const commonProps = {
      handleSide: props.handleSide || "right",
      width,
      height,
      depth,
      cutYPosition: props.cutYPosition || cutYPosition,
      material: props.handler?.handlerMaterial ?? materials.doorMaterial,
    };
    const cutProps = { ...commonProps, depth: commonProps.depth + 20 };

    if (doorConfig.selectedHandler === "HL01") return <HL01 {...commonProps} />;
    if (doorConfig.selectedHandler === "HL02") return <HL02 {...cutProps} />;
    if (doorConfig.selectedHandler === "HL03") return <HL03 {...cutProps} />;
    if (doorConfig.selectedHandler === "HL05") return <HL05 {...cutProps} />;
    if (doorConfig.selectedHandler === "HL04") return <HL04 {...cutProps} />;
    if (doorConfig.selectedHandler === "HLModel") return <HLModel {...commonProps} />;
    return null;
  };

  if (doorConfig.selectedHandler === "None" && !(doorCut && doorCut.visible)) {
    return (
      <group>
        <mesh receiveShadow castShadow geometry={slabGeometry}>
          <primitive object={materials.doorMaterial} attach="material" />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh receiveShadow>
        <Geometry useGroups>
          <Base material={materials.doorMaterial} geometry={slabGeometry} />
          {renderHandler()}

        </Geometry>
        <meshBasicMaterial visible={false} />
      </mesh>
      <DoorEdges width={width} height={height} depth={depth} cuts={cutShapes} 
        color={props.edgeColor}
        lineWidth={props.edgeLineWidth}
        opacity={props.edgeOpacity}
        enabled={props.edgeLineEnabled}
      />
    </group>
  );
}
