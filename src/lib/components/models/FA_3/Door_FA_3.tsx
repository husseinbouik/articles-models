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

export function Door_FA_3({
  materials: materialsProp,
  width: widthProp,
  height: heightProp,
  depth: depthProp,
  cutYPosition: cutYPositionProp, // Needed for handler positioning
  handleSide,
  handler,
  numberOfCuts,
  edgeColor,
  edgeOpacity,
  edgeLineWidth,
  edgeLineEnabled,
}: DoorModelProps) {
  const { doorConfig, doorCut } = useConfigurator();
  const materials = useDoorMaterials(materialsProp as MaterialProps);

  const width = widthProp || 700;
  const height = heightProp || 2100;
  // Use depth prop, default to 18mm if not provided
  const depth = depthProp || 18;

  // The number of small slot cuts. A direct `numberOfCuts` prop wins over the
  // context value so consumers can drive it without racing the Interface UI.
  const numCuts = numberOfCuts ?? doorCut?.numberOfCuts ?? 4;

  // Distribute the cuts with equal gaps everywhere: the N cuts split the width
  // into N+1 equal gaps (left edge → cut, between cuts, and cut → right edge
  // are all the same). Accounts for each cut's own width so the visible spacing
  // is truly even on both sides. `xPosition` shifts the whole pattern. Shared
  // by the visible CSG cuts and the edge outlines so they always line up.
  const cutXPositions = useMemo(() => {
    const offsetX = doorCut?.xPosition ?? 0;
    const cutWidth = doorCut?.width ?? 0;
    const gap = (width - numCuts * cutWidth) / (numCuts + 1);
    return Array.from(
      { length: numCuts },
      (_, i) => -width / 2 + gap * (i + 1) + cutWidth * (i + 0.5) + offsetX,
    );
  }, [width, numCuts, doorCut?.xPosition, doorCut?.width]);

  // Cuts span the full door height and stay centered, so they grow and shrink
  // 1:1 with the door height. The edge outline matches the door height exactly;
  // the visible CSG cut gets a small overhang past the top/bottom faces so the
  // subtraction stays clean (avoids coplanar z-fighting).
  const cutHeight = height;
  const cutSolidHeight = height + 2;
  const cutCenterY = 0;

  // Cut shapes for the edge outline (runs unconditionally, before any return).
  const handlerCuts = useHandlerCutShapes(depth, handleSide || "right", height);

  // One texture spans the whole door; the edges take a matching slice so
  // they are not squeezed. Runs unconditionally, before any early return.
  const [slabGeometry] = useDoorBoxGeometries(
    [{ width, height, depth }],
    { width, height },
  );

  // doorCut slots: treated as handle cuts — front outline, back outline,
  // depth edges, and door perimeter breaks where the slot crosses the edge.
  const doorCutShapes = useMemo(() => {
    if (!doorCut || !doorCut.visible) return [];
    const cutWidth = doorCut.width;
    const rotationRad = THREE.MathUtils.degToRad(doorCut.rotation);
    return cutXPositions.map(x => {
      const s = new THREE.Shape();
      const hw = cutWidth / 2;
      const hh = cutHeight / 2;
      s.moveTo(-hw, -hh);
      s.lineTo(hw, -hh);
      s.lineTo(hw, hh);
      s.lineTo(-hw, hh);
      s.closePath();
      return {
        shape: s,
        x,
        y: cutCenterY,
        rotationRad,
        cutDepth: doorCut.depth,
        kind: "slot" as const,
      };
    });
  }, [doorCut, cutHeight, cutCenterY, cutXPositions]);

  const cutShapes = [...handlerCuts, ...doorCutShapes];

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

              // Positions come from the shared cutXPositions so the visible
              // cuts and the edge outlines stay aligned.
              return cutXPositions.map((x, i) => (
                <Subtraction
                  key={`cut-${i}`}
                  position={[x, cutCenterY, doorCut.zPosition]}
                  rotation={[0, 0, THREE.MathUtils.degToRad(doorCut.rotation)]}
                  material={materials.doorMaterial}
                >
                  <boxGeometry args={[cutWidth, cutSolidHeight, doorCut.depth]} />
                </Subtraction>
              ));
            })()}
        </Geometry>
      </mesh>
      <DoorEdges
        width={width}
        height={height}
        depth={depth}
        cuts={cutShapes}
        color={edgeColor}
        lineWidth={edgeLineWidth}
        opacity={edgeOpacity}
        enabled={edgeLineEnabled}
      />
    </group>
  );
}
