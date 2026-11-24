import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useConfigurator } from "../../../context/DoorContext";
import { useDoorMaterials } from "../../../hooks/useDoorMaterials";
import type { DoorModelProps, MaterialProps } from "../../../types/types";

import { Geometry, Base, Subtraction } from "@react-three/csg";
import { DoorEdges } from "../DoorEdges";
import { useHandlerCutShapes } from "../../handlers/useHandlerCutShapes";
import { useDoorBoxGeometries } from "../../../hooks/useDoorBoxGeometry";
import { HL01 } from "../../handlers/HL01";
import { HL02 } from "../../handlers/HL02";
import { HL03 } from "../../handlers/HL03";
import { HL04 } from "../../handlers/HL04";
import { HL05 } from "../../handlers/HL05";
import { HLModel } from "../../handlers/HLModel";

export function Panel_FA_3({
  materials: materialsProp,
  width: widthProp,
  height: heightProp,
  depth: depthProp,
  cutYPosition: cutYPositionProp, // Needed for handler positioning
  handleSide,
  handler,
  edgeColor,
  edgeOpacity,
  edgeLineWidth,
  edgeLineEnabled,
}: DoorModelProps) {
  const { doorConfig, doorCut } = useConfigurator();
  const materials = useDoorMaterials(materialsProp as MaterialProps);

  const width = widthProp || 500;
  const height = heightProp || 600;
  // Use depth prop, default to 18mm if not provided
  const depth = depthProp || 18;

  // Cut shapes for the edge outline (runs unconditionally, before any return).
  const cutShapes = useHandlerCutShapes(depth, handleSide || "right", height);


  // One texture spans the whole part; the edges take a matching slice so they
  // are not squeezed. Runs unconditionally, before any early return.
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

  // Determine which handler to render
  const renderHandler = () => {
    // Common props
    const commonProps = {
      handleSide: handleSide || "right",
      width,
      height,
      depth,
      cutYPosition: cutYPositionProp,
      material: handler?.handlerMaterial ?? materials.doorMaterial,
    };

    if (doorConfig.selectedHandler === "HL01") {
      return <HL01 {...commonProps} />;
    }
    if (doorConfig.selectedHandler === "HL02") {
      return <HL02 {...commonProps} />;
    }
    if (doorConfig.selectedHandler === "HL03") {
      return <HL03 {...commonProps} />;
    }
    if (doorConfig.selectedHandler === "HL04") {
      return <HL04 {...commonProps} />;
    }
    if (doorConfig.selectedHandler === "HL05") {
      return <HL05 {...commonProps} />;
    }
    if (doorConfig.selectedHandler === "HLModel") {
      return <HLModel {...commonProps} />;
    }
    return null;
  };

  // Simple door slab, no frames, now with CSG for handlers
  return (
    <group>
      <mesh receiveShadow>
        <Geometry useGroups>
          <Base material={materials.doorMaterial} geometry={slabGeometry} />
          {renderHandler()}
          {doorCut &&
            doorCut.visible &&
            (() => {
              const cutWidth = doorCut.width;
              const spacerWidth = doorCut.segmentWidth || 90;
              // Use configured cuts or default to 4 for Panel/Door
              const numCuts = doorCut.numberOfCuts || 4;

              // Calculate total width of the pattern
              // Pattern: [Cut][Spacer][Cut]...[Cut]
              // Total width = (numCuts * cutWidth) + ((numCuts - 1) * spacerWidth)
              const totalPatternWidth =
                numCuts * cutWidth + (numCuts - 1) * spacerWidth;

              // Start X position to center the pattern
              let currentX = -totalPatternWidth / 2 + cutWidth / 2;

              const cuts = [];
              for (let i = 0; i < numCuts; i++) {
                cuts.push(
                  <Subtraction
                    key={`cut-${i}`}
                    position={[
                      currentX + doorCut.xPosition,
                      doorCut.yPosition - height / 2,
                      doorCut.zPosition,
                    ]}
                    rotation={[
                      0,
                      0,
                      THREE.MathUtils.degToRad(doorCut.rotation),
                    ]}
                    material={materials.doorMaterial}
                  >
                    <boxGeometry
                      args={[cutWidth, doorCut.height, doorCut.depth]}
                    />
                  </Subtraction>,
                );
                currentX += cutWidth + spacerWidth;
              }

              return cuts;
            })()}
        </Geometry>
      </mesh>
      <DoorEdges width={width} height={height} depth={depth} cuts={cutShapes} 
        color={edgeColor}
        lineWidth={edgeLineWidth}
        opacity={edgeOpacity}
        enabled={edgeLineEnabled}
      />
    </group>
  );
}
