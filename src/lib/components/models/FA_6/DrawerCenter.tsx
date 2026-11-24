import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { Geometry, Base } from "@react-three/csg";
import { DoorEdges } from "../DoorEdges";
import { useHandlerCutShapes } from "../../handlers/useHandlerCutShapes";
import { useDoorBoxGeometries } from "../../../hooks/useDoorBoxGeometry";
import { InnerPanel, INNER_PANEL_DEPTH } from "../InnerPanel";
import { useConfigurator } from "../../../context/DoorContext";
import { useDoorMaterials } from "../../../hooks/useDoorMaterials";
import type { DoorModelProps, MaterialProps } from "../../../types/types";

import { HL01 } from "../../handlers/HL01";
import { HL02 } from "../../handlers/HL02";
import { HL03 } from "../../handlers/HL03";
import { HL04 } from "../../handlers/HL04";
import { HL05 } from "../../handlers/HL05";
import { HLModel } from "../../handlers/HLModel";

const HANDLERS: Record<string, React.ComponentType<any>> = {
  HL01,
  HL02,
  HL03,
  HL04,
  HL05,
  HLModel,
};

export function Drawer_FA_6_Center({
  materials: materialsProp,
  width: widthProp,
  height: heightProp,
  depth: depthProp,
  frontDepth: frontDepthProp,
  backDepth: backDepthProp,
  frontPanelWidth: frontPanelWidthProp,
  cutYPosition: cutYPositionProp,
  handleSide,
  handler,
  edgeColor,
  edgeOpacity,
  edgeLineWidth,
  edgeLineEnabled,
}: DoorModelProps) {
  const { doorConfig } = useConfigurator();
  const materials = useDoorMaterials(materialsProp as MaterialProps);

  const width = widthProp ?? 800;
  const height = heightProp ?? 200;
  const depth = depthProp ?? 22;
  const backDepth = backDepthProp ?? 12;
  const frontDepth = frontDepthProp ?? (depth - backDepth);
  const cutYPosition = cutYPositionProp ?? 100;

  const frameZ = backDepth / 2 + frontDepth / 2;
  const fw = frontPanelWidthProp ?? 30;

  // Outer-box edge outline for whichever handler is selected.
  const cutShapes = useHandlerCutShapes(
    Math.max(frontDepth, backDepth) + 20,
    handleSide || "right",
    height,
  );

  const stileX = width / 2 - fw / 2;

  // Per-bar front-frame edge outlines (one rectangle per <Base> frame box).
  const frontLoops = useMemo(() => {
    const rect = (cx: number, cy: number, w: number, h: number) => ({
      points: [
        new THREE.Vector2(cx - w / 2, cy - h / 2),
        new THREE.Vector2(cx + w / 2, cy - h / 2),
        new THREE.Vector2(cx + w / 2, cy + h / 2),
        new THREE.Vector2(cx - w / 2, cy + h / 2),
      ],
      closed: true,
    });
    // Only two stiles exist (top + bottom open). Outline each as a full rect.
    const stileX = width / 2 - fw / 2;
    return [
      rect(-stileX, 0, fw, height), // left stile
      rect(stileX, 0, fw, height), // right stile
    ];
  }, [width, height, fw]);

  // The panel and each frame bar are windows onto one texture spanning the
  // whole part, so the grain runs continuously across every joint. The two
  // stiles need separate geometries despite being the same size, because the
  // UVs now encode where each bar sits. Disposal is handled by the hook.
  const [
    panelGeometry,
    leftStileGeometry,
    rightStileGeometry,
  ] = useDoorBoxGeometries(
    [
      { width, height, depth: backDepth },
      { width: fw, height, depth: frontDepth, centerX: -stileX },
      { width: fw, height, depth: frontDepth, centerX: stileX },
    ],
    { width, height },
  );

  const hasHandler =
    !!doorConfig.selectedHandler && doorConfig.selectedHandler !== "None";
  const HandlerComp = hasHandler
    ? HANDLERS[doorConfig.selectedHandler as keyof typeof HANDLERS]
    : undefined;

  const renderHandlerCutouts = () => {
    if (!HandlerComp) return null;
    const anchorDepth = Math.max(frontDepth, backDepth);
    const cutProps = {
      handleSide: handleSide ?? "right",
      width,
      height,
      depth: anchorDepth + 20,
      cutYPosition,
      material: handler?.handlerMaterial ?? materials.doorMaterial,
    };
    if (doorConfig.selectedHandler === "HLModel")
      return <HandlerComp {...cutProps} depth={anchorDepth} />;
    return <HandlerComp {...cutProps} />;
  };

  return (
    <group>
      <mesh receiveShadow>
        <Geometry useGroups>
          <Base material={materials.backMaterial} geometry={panelGeometry} />
          {/* Stiles only */}
          <Base
            material={materials.frontMaterial}
            geometry={leftStileGeometry}
            position={[-stileX, 0, frameZ]}
          />
          <Base
            material={materials.frontMaterial}
            geometry={rightStileGeometry}
            position={[stileX, 0, frameZ]}
          />
          {renderHandlerCutouts()}
        </Geometry>
      </mesh>
      {/* Inner panel — fills the opening the stiles and rails leave; absent
          unless materials.innerPanelMaterial is set. Where a rail is absent
          the panel runs to the edge. Outside the CSG mesh so the handler
          cutouts leave it flat. */}
      <InnerPanel
        material={materials.innerPanelMaterial}
        width={Math.max(0, width - fw * 2)}
        height={Math.max(0, (height / 2) - (-height / 2))}
        door={{ width, height }}
        centerY={((height / 2) + (-height / 2)) / 2}
        z={backDepth / 2 + INNER_PANEL_DEPTH / 2}
        asCSG={false}
      />
      <DoorEdges
        width={width}
        height={height}
        depth={backDepth + frontDepth}
        frontDepth={frontDepth}
        backDepth={backDepth}
        frontLoops={frontLoops}
        frontFaceAtStep
        cuts={cutShapes}
      
        color={edgeColor}
        lineWidth={edgeLineWidth}
        opacity={edgeOpacity}
        enabled={edgeLineEnabled}
      />
    </group>
  );
}
