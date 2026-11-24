import React, { useMemo } from "react";
import * as THREE from "three";
import { Geometry, Base } from "@react-three/csg";
import { useConfigurator } from "../../../context/DoorContext";
import { useDoorMaterials } from "../../../hooks/useDoorMaterials";
import type { DoorModelProps, MaterialProps } from "../../../types/types";

import { HL01 } from "../../handlers/HL01";
import { HL02 } from "../../handlers/HL02";
import { HL03 } from "../../handlers/HL03";
import { HL04 } from "../../handlers/HL04";
import { HL05 } from "../../handlers/HL05";
import { HLModel } from "../../handlers/HLModel";
import { DoorEdges } from "../DoorEdges";
import { useHandlerCutShapes } from "../../handlers/useHandlerCutShapes";
import { useDoorBoxGeometries } from "../../../hooks/useDoorBoxGeometry";
import { InnerPanel, INNER_PANEL_DEPTH } from "../InnerPanel";

export function Drawer(props: DoorModelProps) {
  const { doorConfig } = useConfigurator();
  const materials = useDoorMaterials(props.materials as MaterialProps);

  const width = props.width || 500;
  const height = props.height || 300;
  const depth = props.depth || 22;
  const backDepth = props.backDepth ?? 12;
  const frontDepth = props.frontDepth ?? (depth - backDepth);
  const cutYPosition = props.cutYPosition || 950;

  const frameZ = backDepth / 2 + frontDepth / 2;
  const fw = props.frontPanelWidth ?? 30;

  const cutShapes = useHandlerCutShapes(
    Math.max(frontDepth, backDepth),
    props.handleSide || "right",
    height,
  );

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
    return [
      rect(0, 0, width, height), // outer frame edge
      rect(0, 0, width - fw * 2, height - fw * 2), // inner opening edge
    ];
  }, [width, height, fw]);

  const renderHandler = () => {
    if (!doorConfig.selectedHandler || doorConfig.selectedHandler === "None")
      return null;

    const commonProps = {
      handleSide: props.handleSide || "right",
      width,
      height,
      depth: Math.max(frontDepth, backDepth),
      cutYPosition: cutYPosition,
      material: props.handler?.handlerMaterial ?? materials.doorMaterial,
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


  // The back panel and the four frame bars are windows onto one texture
  // spanning the whole part, so the grain runs continuously across every
  // joint instead of each box restarting it. Order matches the <Base> list.
  const [backGeo, rightStileGeo, leftStileGeo, topRailGeo, bottomRailGeo] =
    useDoorBoxGeometries(
      [
        { width, height, depth: backDepth },
        { width: fw, height, depth: frontDepth, centerX: width / 2 - fw / 2 },
        { width: fw, height, depth: frontDepth, centerX: -width / 2 + fw / 2 },
        {
          width: width - fw * 2,
          height: fw,
          depth: frontDepth,
          centerY: height / 2 - fw / 2,
        },
        {
          width: width - fw * 2,
          height: fw,
          depth: frontDepth,
          centerY: -height / 2 + fw / 2,
        },
      ],
      { width, height },
    );

  return (
    <group>
      <mesh receiveShadow>
        <Geometry useGroups>
          <Base material={materials.backMaterial} geometry={backGeo} />

          <Base
            material={materials.frontMaterial}
            geometry={rightStileGeo}
            position={[width / 2 - fw / 2, 0, frameZ]}
          />
          <Base
            material={materials.frontMaterial}
            geometry={leftStileGeo}
            position={[-width / 2 + fw / 2, 0, frameZ]}
          />
          <Base
            material={materials.frontMaterial}
            geometry={topRailGeo}
            position={[0, height / 2 - fw / 2, frameZ]}
          />
          <Base
            material={materials.frontMaterial}
            geometry={bottomRailGeo}
            position={[0, -height / 2 + fw / 2, frameZ]}
          />

          {renderHandler()}
        </Geometry>
      </mesh>
      {/* Inner panel — fills the frame opening; absent unless
          materials.innerPanelMaterial is set. Outside the CSG mesh so the
          handler cutouts leave it flat. */}
      <InnerPanel
        material={materials.innerPanelMaterial}
        width={width - fw * 2}
        height={height - fw * 2}
        door={{ width, height }}
        z={backDepth / 2 + INNER_PANEL_DEPTH / 2}
        asCSG={false}
      />
      <DoorEdges
        width={width}
        height={height}
        depth={depth}
        frontDepth={frontDepth}
        backDepth={backDepth}
        frontLoops={frontLoops}
        cuts={cutShapes}
      
        color={props.edgeColor}
        lineWidth={props.edgeLineWidth}
        opacity={props.edgeOpacity}
        enabled={props.edgeLineEnabled}
      />
    </group>
  );
}
