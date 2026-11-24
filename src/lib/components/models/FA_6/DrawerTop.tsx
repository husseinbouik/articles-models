import React, { useMemo } from "react";
import * as THREE from "three";
import { Geometry, Base, Subtraction } from "@react-three/csg";
import { DoorEdges } from "../DoorEdges";
import { useHandlerCutShapes } from "../../handlers/useHandlerCutShapes";
import {
  useDoorBoxGeometries,
  useDoorExtrudeGeometry,
} from "../../../hooks/useDoorBoxGeometry";
import { InnerPanelShape } from "../InnerPanel";
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

export function Drawer_FA_6_Top({
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
  debugEdges = false,
  edgeColor,
  edgeOpacity,
  edgeLineWidth,
  edgeLineEnabled,
}: DoorModelProps) {
  const { doorConfig, doorFA6Config, doorCut } = useConfigurator();
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

  // Frame Shape: Top Rail + Stiles, Open Bottom
  // Outer Rect: full width/height
  // Inner Hole: goes down to -height/2 (bottom of mesh) to cut through bottom rail area
  const frameShape = useMemo(() => {
    const s = new THREE.Shape();
    // Outer rectangle (Counter-Clockwise)
    s.moveTo(-width / 2, -height / 2);
    s.lineTo(width / 2, -height / 2);
    s.lineTo(width / 2, height / 2);
    s.lineTo(-width / 2, height / 2);
    s.closePath();

    // Inner hole
    const hole = new THREE.Path();
    const innerW = width - fw * 2;

    // Bounds for the hole
    const xLeft = -innerW / 2;
    const xRight = innerW / 2;
    // Bottom of hole is at the very bottom of the mesh (no bottom rail)
    const yBottom = -height / 2;
    const yTop = height / 2 - fw;

    const rTL = doorFA6Config.topLeftRadius;
    const rTR = doorFA6Config.topRightRadius;

    const maxR = innerW / 2;
    const safeTL = Math.min(rTL, maxR);
    const safeTR = Math.min(rTR, maxR);

    // Draw Hole (Clockwise)
    // Start Bottom Left
    hole.moveTo(xLeft, yBottom);

    // Up to start of Top-Left corner
    hole.lineTo(xLeft, yTop - safeTL);

    // Top Left Arc (Clockwise: PI -> PI/2)
    if (safeTL > 0) {
      hole.absarc(
        xLeft + safeTL,
        yTop - safeTL,
        safeTL,
        Math.PI,
        Math.PI * 0.5,
        true,
      );
    } else {
      hole.lineTo(xLeft, yTop);
    }

    // Top horizontal line
    hole.lineTo(xRight - safeTR, yTop);

    // Top Right Arc (Clockwise: PI/2 -> 0)
    if (safeTR > 0) {
      hole.absarc(
        xRight - safeTR,
        yTop - safeTR,
        safeTR,
        Math.PI * 0.5,
        0,
        true,
      );
    } else {
      hole.lineTo(xRight, yTop);
    }

    // Down to Bottom Right
    hole.lineTo(xRight, yBottom);

    // Close
    hole.closePath();

    s.holes.push(hole);
    return s;
  }, [
    width,
    height,
    fw,
    doorFA6Config.topLeftRadius,
    doorFA6Config.topRightRadius,
  ]);

  // Front-face OPENING outline (the inner hole of frameShape). The bottom is
  // OPEN (no bottom rail), so this is an OPEN path: from bottom-left up the
  // left side, top-left arc, across the top, top-right arc, down to
  // bottom-right. Matches frameShape's hole (yBottom = -height/2).
  const frontLoops = useMemo(() => {
    const innerW = width - fw * 2;
    const xLeft = -innerW / 2;
    const xRight = innerW / 2;
    const yBottom = -height / 2; // open bottom
    const yTop = height / 2 - fw;

    const maxR = innerW / 2;
    const safeTL = Math.min(doorFA6Config.topLeftRadius, maxR);
    const safeTR = Math.min(doorFA6Config.topRightRadius, maxR);

    const pts: THREE.Vector2[] = [];
    const N = 16;
    pts.push(new THREE.Vector2(xLeft, yBottom)); // bottom-left (open)
    pts.push(new THREE.Vector2(xLeft, yTop - safeTL)); // up left side
    if (safeTL > 0) {
      const cx = xLeft + safeTL;
      const cy = yTop - safeTL;
      for (let i = 0; i <= N; i++) {
        const a = Math.PI + (Math.PI * 0.5 - Math.PI) * (i / N); // PI -> PI/2
        pts.push(
          new THREE.Vector2(cx + Math.cos(a) * safeTL, cy + Math.sin(a) * safeTL),
        );
      }
    } else {
      pts.push(new THREE.Vector2(xLeft, yTop));
    }
    pts.push(new THREE.Vector2(xRight - safeTR, yTop)); // across the top
    if (safeTR > 0) {
      const cx = xRight - safeTR;
      const cy = yTop - safeTR;
      for (let i = 0; i <= N; i++) {
        const a = Math.PI * 0.5 + (0 - Math.PI * 0.5) * (i / N); // PI/2 -> 0
        pts.push(
          new THREE.Vector2(cx + Math.cos(a) * safeTR, cy + Math.sin(a) * safeTR),
        );
      }
    } else {
      pts.push(new THREE.Vector2(xRight, yTop));
    }
    pts.push(new THREE.Vector2(xRight, yBottom)); // down to bottom-right (open)

    return [{ points: pts, closed: false, depthEdges: false }];
  }, [
    width,
    height,
    fw,
    doorFA6Config.topLeftRadius,
    doorFA6Config.topRightRadius,
  ]);

  // The panel spans the whole part and the extruded frame maps onto the same
  // texture, so the grain runs continuously instead of each piece restarting
  // it. ExtrudeGeometry would otherwise use raw model-space UVs. The frame is
  // centred, so it needs no XY offset. Disposal is handled by the hooks.
  const [panelGeometry] = useDoorBoxGeometries(
    [{ width, height, depth: backDepth }],
    { width, height },
  );

  // The inner panel's outline: the same rounded opening frameShape cuts as its
  // hole, but as a solid shape so the inlay follows the curve instead of
  // poking through it as a rectangle would. Kept in step with that hole.
  const innerPanelShape = useMemo(() => {
    const openingW = width - fw * 2;
    if (openingW <= 0) return null;

    const xLeft = -openingW / 2;
    const xRight = openingW / 2;
    const yBottom = -height / 2 + fw;
    const yTop = height / 2 - fw;
    const maxR = openingW / 2;
    const safeTL = Math.min(doorFA6Config.topLeftRadius, maxR);
    const safeTR = Math.min(doorFA6Config.topRightRadius, maxR);

    const s = new THREE.Shape();
    s.moveTo(xLeft, yBottom);
    s.lineTo(xLeft, yTop - safeTL);
    if (safeTL > 0) {
      s.absarc(xLeft + safeTL, yTop - safeTL, safeTL, Math.PI, Math.PI * 0.5, true);
    } else {
      s.lineTo(xLeft, yTop);
    }
    s.lineTo(xRight - safeTR, yTop);
    if (safeTR > 0) {
      s.absarc(xRight - safeTR, yTop - safeTR, safeTR, Math.PI * 0.5, 0, true);
    } else {
      s.lineTo(xRight, yTop);
    }
    s.lineTo(xRight, yBottom);
    s.closePath();
    return s;
  }, [
    width,
    fw,
    height,
    doorFA6Config.topLeftRadius,
    doorFA6Config.topRightRadius,
  ]);

  const archFrameGeometry = useDoorExtrudeGeometry(
    frameShape,
    { depth: frontDepth, bevelEnabled: false },
    { width, height },
  );

  const extrudeSettings = useMemo(
    () => ({ depth: frontDepth, bevelEnabled: false }),
    [frontDepth],
  );

  // Handler Logic
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
          {/* Frame (Extruded Shape) */}
          <Base
            material={materials.frontMaterial}
            geometry={archFrameGeometry!}
            position={[0, 0, frameZ - frontDepth / 2]}
          />

          {renderHandlerCutouts()}
        </Geometry>
      </mesh>
      {/* Inner panel — follows the rounded opening; absent unless
          materials.innerPanelMaterial is set. Outside the CSG mesh so the
          handler and door cuts leave it flat. */}
      <InnerPanelShape
        material={materials.innerPanelMaterial}
        shape={innerPanelShape}
        door={{ width, height }}
        z={backDepth / 2}
        asCSG={false}
      />
      <DoorEdges
        width={width}
        height={height}
        depth={backDepth + frontDepth}
        frontDepth={frontDepth}
        backDepth={backDepth}
        frontLoops={frontLoops}
        cuts={cutShapes}
      
        color={edgeColor}
        lineWidth={edgeLineWidth}
        opacity={edgeOpacity}
        enabled={edgeLineEnabled}
      />
    </group>
  );
}
