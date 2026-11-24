import React, { useMemo } from "react";
import * as THREE from "three";
import { Geometry, Base, Subtraction } from "@react-three/csg";
import { Edges } from "@react-three/drei";
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

import { Drawer_FA_8_Top } from "./DrawerTop";
import { Drawer_FA_8_Center } from "./DrawerCenter";
import { Drawer_FA_8_Bottom } from "./DrawerBottom";

export function Door_FA_8({
  materials: materialsProp,
  width: widthProp,
  height: heightProp,
  frontDepth: frontDepthProp,
  backDepth: backDepthProp,
  frontPanelWidth: frontPanelWidthProp,
  cutYPosition: cutYPositionProp,
  handleSide,
  handler,
  frameVariant: variantProp,
  noArchBelowHeight = 600,
  edgeColor,
  edgeOpacity,
  edgeLineWidth,
  edgeLineEnabled,
}: DoorModelProps & { noArchBelowHeight?: number }) {
  const { doorConfig, doorCut } = useConfigurator();
  const materials = useDoorMaterials(materialsProp as MaterialProps);

  const width = widthProp || 500;
  const height = heightProp || 2200;
  const frontDepth = frontDepthProp || 20;
  const backDepth = backDepthProp || 10;
  const cutYPosition = cutYPositionProp || 950;
  const frameVariant = variantProp ?? doorConfig.frameVariant ?? "full";

  const frameThickness = 15; // 1.5 cm from drawing
  const frameZ = backDepth / 2 + frontDepth / 2;
  const fw = frontPanelWidthProp ?? 30;
  const outlineDepth = frontDepth + backDepth;

  const cutShapes = useHandlerCutShapes(
    Math.max(frontDepth, backDepth),
    handleSide || "right",
    height,
  );

  // Per-bar front-frame edge outlines (one rectangle per <Base> frame box).
  // Computed before the isDrawerMode early return to keep hook order stable.
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
    // The right stile is full-height; the top/bottom rails butt into its inner
    // (left) face. Draw the stile as a full rectangle, and each rail as an OPEN
    // 3-sided path that OMITS the edge against the stile — so the rail line
    // stops at the stile instead of doubling its inner edge at the joint.
    const xStileInner = width / 2 - fw; // rails end here, against the stile
    const xLeft = -width / 2; // rails reach the door's left edge
    // Open rail path: stile-inner-top → along top → down left → along bottom →
    // stile-inner-bottom (right edge against the stile is omitted).
    const railPath = (cy: number) => ({
      points: [
        new THREE.Vector2(xStileInner, cy + fw / 2),
        new THREE.Vector2(xLeft, cy + fw / 2),
        new THREE.Vector2(xLeft, cy - fw / 2),
        new THREE.Vector2(xStileInner, cy - fw / 2),
      ],
      closed: false,
    });
    return [
      rect(width / 2 - fw / 2, 0, fw, height), // right stile (full rectangle)
      railPath(height / 2 - fw / 2 - 30), // top rail (lowered 30), open at stile
      railPath(-(height / 2 - fw / 2)), // bottom rail, open at stile
    ];
  }, [width, height, fw]);

  // The back panel, the right stile and the two rails are windows onto one
  // texture spanning the whole door, so the grain runs continuously across
  // every joint instead of each box restarting it. The rails are offset by
  // -fw/2 because they butt into the stile rather than spanning the full
  // width. Order matches the <Base> list.
  const [backGeo, rightStileGeo, topRailGeo, bottomRailGeo] =
    useDoorBoxGeometries(
      [
        { width, height, depth: backDepth },
        { width: fw, height, depth: frontDepth, centerX: width / 2 - fw / 2 },
        {
          width: width - fw,
          height: fw,
          depth: frontDepth,
          centerX: -fw / 2,
          centerY: height / 2 - fw / 2 - 30,
        },
        {
          width: width - fw,
          height: fw,
          depth: frontDepth,
          centerX: -fw / 2,
          centerY: -(height / 2 - fw / 2),
        },
      ],
      { width, height },
    );

  const isDrawerMode = height <= noArchBelowHeight;

  if (isDrawerMode) {
    const commonDrawerProps = {
      materials: materialsProp,
      width: widthProp,
      height: heightProp,
      frontDepth: frontDepthProp,
      backDepth: backDepthProp,
      frontPanelWidth: frontPanelWidthProp,
      cutYPosition: cutYPositionProp,
      handleSide,
      handler,
    };

    if (frameVariant === "top") {
      return <Drawer_FA_8_Top {...commonDrawerProps} />;
    }
    if (frameVariant === "center") {
      return <Drawer_FA_8_Center {...commonDrawerProps} />;
    }
    if (frameVariant === "bottom") {
      return <Drawer_FA_8_Bottom {...commonDrawerProps} />;
    }
  }

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

  return (
    <group>
      <mesh receiveShadow castShadow>
        <Geometry useGroups>
          <Base material={materials.backMaterial} geometry={backGeo} />

          <Base
            material={materials.frontMaterial}
            geometry={rightStileGeo}
            position={[width / 2 - fw / 2, 0, frameZ]}
          />

          <Base
            material={materials.frontMaterial}
            geometry={topRailGeo}
            position={[
              -fw / 2,
              height / 2 - fw / 2 - 30,
              frameZ,
            ]}
          />

          <Base
            material={materials.frontMaterial}
            geometry={bottomRailGeo}
            position={[
              -fw / 2,
              -(height / 2 - fw / 2),
              frameZ,
            ]}
          />

          {renderHandler()}
          {doorCut &&
            doorCut.visible &&
            (() => {
              const cutWidth = doorCut.width;
              const spacerWidth = doorCut.segmentWidth || 90;
              const numCuts = doorCut.numberOfCuts || 4;

              const totalPatternWidth =
                numCuts * cutWidth + (numCuts - 1) * spacerWidth;

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
      {/* Inner panel — absent unless materials.innerPanelMaterial is set.
          This frame is asymmetric: the right stile bounds it, and it reaches
          the door's left edge, so the panel is not centred. It runs flush to the door's TOP edge — the top
          rail sits 30mm down from there, so the panel passes behind it — and
          is inset by fw at the bottom. Rendered outside the CSG mesh so the handler and door
          cuts leave it flat. */}
      <InnerPanel
        material={materials.innerPanelMaterial}
        width={width - fw}
        height={Math.max(0, height / 2 - (-(height / 2) + fw))}
        door={{ width, height }}
        centerX={-fw / 2}
        centerY={(height / 2 + (-(height / 2) + fw)) / 2}
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
