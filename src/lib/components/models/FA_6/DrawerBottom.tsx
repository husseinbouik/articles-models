import React, { useMemo } from "react";
import * as THREE from "three";
import { Geometry, Base } from "@react-three/csg";
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

export function Drawer_FA_6_Bottom({
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

  // The opening's bounds. This is the bottom drawer of a stack, so the frame is
  // the vertical mirror of the top drawer's: stiles plus a BOTTOM rail, and the
  // top left open where it meets the drawer above. Corners stay square — the
  // rounding belongs to the top drawer, which caps the stack.
  const xLeft = -(width - fw * 2) / 2;
  const xRight = (width - fw * 2) / 2;
  const yBottom = -height / 2 + fw;
  const yTop = height / 2; // open top — no rail, runs to the mesh edge

  // Frame Shape: Bottom Rail + Stiles, Open Top.
  // Built as ONE extruded shape with a hole rather than three separate boxes,
  // so the opening is a single continuous edge. Outlining three boxes instead
  // would run each stile's inner edge the full height — straight past the rail
  // and down to the panel bottom — and double the rail's lower edge onto the
  // panel border, leaving stray lines across the bottom.
  const frameShape = useMemo(() => {
    const s = new THREE.Shape();
    // Outer rectangle (Counter-Clockwise)
    s.moveTo(-width / 2, -height / 2);
    s.lineTo(width / 2, -height / 2);
    s.lineTo(width / 2, height / 2);
    s.lineTo(-width / 2, height / 2);
    s.closePath();

    // Inner hole (Clockwise). Top of the hole is at the very top of the mesh,
    // so there is no top rail.
    const hole = new THREE.Path();
    hole.moveTo(xLeft, yTop);
    hole.lineTo(xRight, yTop);
    hole.lineTo(xRight, yBottom);
    hole.lineTo(xLeft, yBottom);
    hole.closePath();

    s.holes.push(hole);
    return s;
  }, [width, height, xLeft, xRight, yBottom, yTop]);

  // Front-face OPENING outline (the inner hole of frameShape). The top is OPEN
  // (no top rail), so this is an OPEN path: down the left side, across the
  // bottom rail, back up the right side — one continuous edge.
  const frontLoops = useMemo(
    () => [
      {
        points: [
          new THREE.Vector2(xLeft, yTop), // top-left (open)
          new THREE.Vector2(xLeft, yBottom), // down the left side
          new THREE.Vector2(xRight, yBottom), // across the bottom rail
          new THREE.Vector2(xRight, yTop), // up to top-right (open)
        ],
        closed: false,
        depthEdges: false,
      },
    ],
    [xLeft, xRight, yBottom, yTop],
  );

  // The panel spans the whole part and the extruded frame maps onto the same
  // texture, so the grain runs continuously instead of each piece restarting
  // it. ExtrudeGeometry would otherwise use raw model-space UVs. The frame is
  // centred, so it needs no XY offset. Disposal is handled by the hooks.
  const [panelGeometry] = useDoorBoxGeometries(
    [{ width, height, depth: backDepth }],
    { width, height },
  );

  // The inner panel's outline: the same opening frameShape cuts as its hole,
  // but as a solid shape so the inlay sits flush inside it. Kept in step with
  // that hole.
  const innerPanelShape = useMemo(() => {
    if (xRight - xLeft <= 0) return null;

    const s = new THREE.Shape();
    s.moveTo(xLeft, yBottom);
    s.lineTo(xRight, yBottom);
    s.lineTo(xRight, yTop);
    s.lineTo(xLeft, yTop);
    s.closePath();
    return s;
  }, [xLeft, xRight, yBottom, yTop]);

  const archFrameGeometry = useDoorExtrudeGeometry(
    frameShape,
    { depth: frontDepth, bevelEnabled: false },
    { width, height },
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
      {/* Inner panel — fills the opening the frame leaves; absent unless
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
