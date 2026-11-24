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

export function DrawerTop(props: DoorModelProps) {
  const { doorConfig } = useConfigurator();
  const materials = useDoorMaterials(props.materials as MaterialProps);

  const width = props.width ?? 500;
  const height = props.height ?? 300;
  const depth = props.depth ?? 22;
  const backDepth = props.backDepth ?? 12;
  const frontDepth = props.frontDepth ?? (depth - backDepth);

  const frameZ = backDepth / 2 + frontDepth / 2;
  const fw = props.frontPanelWidth ?? 30;

  // Outer-box edge outline for whichever handler is selected.
  const cutShapes = useHandlerCutShapes(
    Math.max(frontDepth, backDepth) + 20,
    props.handleSide || "right",
    height,
  );

  // The opening's bounds. This is the top drawer of a stack: stiles plus a TOP
  // rail, with the bottom left open where it meets the drawer below. Corners
  // are square — FA_7's arch belongs to the door, and a drawer front is far too
  // short to carry it.
  const xLeft = -(width - fw * 2) / 2;
  const xRight = (width - fw * 2) / 2;
  const yTop = height / 2 - fw;
  const yBottom = -height / 2; // open bottom — runs to the mesh edge

  // Frame Shape: Top Rail + Stiles, Open Bottom.
  // Built as ONE extruded shape with a hole rather than separate stile and rail
  // boxes, so the opening is a single continuous edge. Outlining each box
  // instead would run both stiles' inner edges the full height — straight past
  // the rail — and double the rail's outer edge onto the panel border, leaving
  // stray lines crossing each other.
  const frameShape = useMemo(() => {
    const s = new THREE.Shape();
    // Outer rectangle (Counter-Clockwise)
    s.moveTo(-width / 2, -height / 2);
    s.lineTo(width / 2, -height / 2);
    s.lineTo(width / 2, height / 2);
    s.lineTo(-width / 2, height / 2);
    s.closePath();

    // Inner hole (Clockwise). The bottom of the hole sits at the very bottom of
    // the mesh, so there is no bottom rail.
    const hole = new THREE.Path();
    hole.moveTo(xLeft, yBottom);
    hole.lineTo(xLeft, yTop);
    hole.lineTo(xRight, yTop);
    hole.lineTo(xRight, yBottom);
    hole.closePath();

    s.holes.push(hole);
    return s;
  }, [width, height, xLeft, xRight, yBottom, yTop]);

  // Front-face OPENING outline (the inner hole of frameShape). The bottom is
  // OPEN, so this is an OPEN path: up the left side, across the top rail, back
  // down the right side — one continuous edge.
  const frontLoops = useMemo(
    () => [
      {
        points: [
          new THREE.Vector2(xLeft, yBottom), // bottom-left (open)
          new THREE.Vector2(xLeft, yTop), // up the left side
          new THREE.Vector2(xRight, yTop), // across the top rail
          new THREE.Vector2(xRight, yBottom), // down to bottom-right (open)
        ],
        closed: false,
        depthEdges: false,
      },
    ],
    [xLeft, xRight, yBottom, yTop],
  );

  // The panel spans the whole part and the extruded frame maps onto the same
  // texture, so the grain runs continuously instead of each piece restarting
  // it. The frame is centred, so it needs no XY offset. Disposal is handled by
  // the hooks.
  const [panelGeometry] = useDoorBoxGeometries(
    [{ width, height, depth: backDepth }],
    { width, height },
  );

  // The inner panel's outline: the same opening frameShape cuts as its hole,
  // but as a solid shape so the inlay sits flush inside it. Where a rail is
  // absent the panel runs to the edge.
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

  const frameGeometry = useDoorExtrudeGeometry(
    frameShape,
    { depth: frontDepth, bevelEnabled: false },
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
      handleSide: props.handleSide ?? "right",
      width,
      height,
      depth: anchorDepth + 20,
      cutYPosition: props.cutYPosition,
      material: materials.doorMaterial,
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
          {frameGeometry && (
            <Base
              material={materials.frontMaterial}
              geometry={frameGeometry}
              position={[0, 0, frameZ - frontDepth / 2]}
            />
          )}

          {renderHandlerCutouts()}
        </Geometry>
      </mesh>
      {/* Inner panel — fills the opening the frame leaves; absent unless
          materials.innerPanelMaterial is set. Outside the CSG mesh so the
          handler cutouts leave it flat. */}
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

        color={props.edgeColor}
        lineWidth={props.edgeLineWidth}
        opacity={props.edgeOpacity}
        enabled={props.edgeLineEnabled}
      />
    </group>
  );
}
