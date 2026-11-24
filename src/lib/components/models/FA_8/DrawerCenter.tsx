import React, { useMemo } from "react";
import * as THREE from "three";
import { Geometry, Base } from "@react-three/csg";
import { useConfigurator } from "../../../context/DoorContext";
import { useDoorMaterials } from "../../../hooks/useDoorMaterials";
import type { DoorModelProps, MaterialProps } from "../../../types/types";
import { HL01 } from "../../handlers/HL01";
import { HL02 } from "../../handlers/HL02";
import { HL03 } from "../../handlers/HL03";
import { HL05 } from "../../handlers/HL05";
import { HL04 } from "../../handlers/HL04";
import { HLModel } from "../../handlers/HLModel";
import { DoorEdges } from "../DoorEdges";
import { useHandlerCutShapes } from "../../handlers/useHandlerCutShapes";
import { useDoorBoxGeometries } from "../../../hooks/useDoorBoxGeometry";
import { InnerPanel, INNER_PANEL_DEPTH } from "../InnerPanel";

export function Drawer_FA_8_Center({
  materials: materialsProp,
  width: widthProp,
  height: heightProp,
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

  const width = widthProp || 800;
  const height = heightProp || 200;
  const frontDepth = frontDepthProp || 20;
  const backDepth = backDepthProp || 10;
  const cutYPosition = cutYPositionProp || 100;

  const frameZ = backDepth / 2 + frontDepth / 2;
  const fw = frontPanelWidthProp ?? 30;
  const outlineDepth = frontDepth + backDepth;

  const cutShapes = useHandlerCutShapes(
    Math.max(frontDepth, backDepth),
    handleSide || "right",
    height,
  );

  // Per-bar front-frame edge outline (the single right-stile <Base> box).
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
    return [
      rect(width / 2 - fw / 2, 0, fw, height), // right stile (full rectangle)
    ];
  }, [width, height, fw]);

  const renderHandler = () => {
    if (!doorConfig.selectedHandler || doorConfig.selectedHandler === "None")
      return null;

    const commonProps = {
      handleSide: handleSide || "right",
      width,
      height,
      depth: Math.max(frontDepth, backDepth),
      cutYPosition: cutYPosition,
      material: handler?.handlerMaterial ?? materials.doorMaterial,
    };

    const cutProps = { ...commonProps, depth: commonProps.depth + 20 };

    if (doorConfig.selectedHandler === "HL01") return <HL01 {...commonProps} />;
    if (doorConfig.selectedHandler === "HL02") return <HL02 {...cutProps} />;
    if (doorConfig.selectedHandler === "HL03") return <HL03 {...cutProps} />;
    if (doorConfig.selectedHandler === "HL05") return <HL05 {...cutProps} />;
    if (doorConfig.selectedHandler === "HL04") return <HL04 {...cutProps} />;
    if (doorConfig.selectedHandler === "HLModel")
      return <HLModel {...commonProps} />;
    return null;
  };


  // The back panel and frame bars are windows onto one texture spanning the
  // whole part, so the grain runs continuously across every joint instead of
  // each box restarting it. Order matches the <Base> list.
  const [backGeo, rightStileGeo] = useDoorBoxGeometries(
    [
        { width, height, depth: backDepth },
        { width: fw, height, depth: frontDepth, centerX: width / 2 - fw / 2 },
    ],
    { width, height },
  );

  return (
    <group>
      <mesh receiveShadow>
        <Geometry useGroups>
          <Base material={materials.backMaterial} geometry={backGeo} />

          {/* Right Panel (Only Right panel for Center Drawer) */}
          <Base
            material={materials.frontMaterial}
            geometry={rightStileGeo}
            position={[width / 2 - fw / 2, 0, frameZ]}
          />

          {renderHandler()}
        </Geometry>
      </mesh>
      {/* Inner panel — absent unless materials.innerPanelMaterial is set.
          The right stile bounds it and it reaches the left edge, so it is not
          centred; it runs flush to the TOP edge (the top rail sits 30mm
          down from there, so the panel passes behind it) and is inset by fw at
          the bottom. Outside the CSG mesh so the
          handler and door cuts leave it flat. */}
      <InnerPanel
        material={materials.innerPanelMaterial}
        width={width - fw}
        height={Math.max(0, height / 2 - (-height / 2 + fw))}
        door={{ width, height }}
        centerX={-fw / 2}
        centerY={(height / 2 + (-height / 2 + fw)) / 2}
        z={backDepth / 2 + INNER_PANEL_DEPTH / 2}
        asCSG={false}
      />
      <DoorEdges
        width={width}
        height={height}
        depth={outlineDepth}
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
