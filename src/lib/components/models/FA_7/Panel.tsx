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

/**
 * The FA_7 panel and bin.
 *
 * Both are a plain rectangular opening inset by the frame width on all four
 * sides, with square corners — NOT the door's arch. The arch is the door's
 * alone: a panel or bin is too short to carry one, and the drawings specify a
 * straight frame for them.
 *
 * Panel and bin differ only in their stock dimensions (500x600 and 600x400),
 * so they share this component.
 */
export function Panel(props: DoorModelProps) {
  const { doorConfig } = useConfigurator();
  const materials = useDoorMaterials(props.materials as MaterialProps);

  const width = props.width ?? 500;
  const height = props.height ?? 600;
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

  // The opening: inset by the frame width on all four sides.
  const xLeft = -(width - fw * 2) / 2;
  const xRight = (width - fw * 2) / 2;
  const yBottom = -height / 2 + fw;
  const yTop = height / 2 - fw;
  const hasOpening = xRight > xLeft && yTop > yBottom;

  // Frame Shape: all four sides. Built as ONE extruded shape with a hole rather
  // than four separate bars, so the opening is a single continuous edge instead
  // of four rectangles overlapping at the corners.
  const frameShape = useMemo(() => {
    if (!hasOpening) return null;

    const s = new THREE.Shape();
    // Outer rectangle (Counter-Clockwise)
    s.moveTo(-width / 2, -height / 2);
    s.lineTo(width / 2, -height / 2);
    s.lineTo(width / 2, height / 2);
    s.lineTo(-width / 2, height / 2);
    s.closePath();

    // Inner hole (Clockwise)
    const hole = new THREE.Path();
    hole.moveTo(xLeft, yTop);
    hole.lineTo(xRight, yTop);
    hole.lineTo(xRight, yBottom);
    hole.lineTo(xLeft, yBottom);
    hole.closePath();

    s.holes.push(hole);
    return s;
  }, [hasOpening, width, height, xLeft, xRight, yBottom, yTop]);

  // Front-face OPENING outline — a single closed rectangle, matching the hole.
  const frontLoops = useMemo(() => {
    if (!hasOpening) return undefined;
    return [
      {
        points: [
          new THREE.Vector2(xLeft, yBottom),
          new THREE.Vector2(xRight, yBottom),
          new THREE.Vector2(xRight, yTop),
          new THREE.Vector2(xLeft, yTop),
        ],
        closed: true,
        depthEdges: false,
      },
    ];
  }, [hasOpening, xLeft, xRight, yBottom, yTop]);

  // The panel spans the whole part and the extruded frame maps onto the same
  // texture, so the grain runs continuously instead of each piece restarting
  // it. Disposal is handled by the hooks.
  const [panelGeometry] = useDoorBoxGeometries(
    [{ width, height, depth: backDepth }],
    { width, height },
  );

  // The inner panel's outline: the same opening frameShape cuts as its hole,
  // but as a solid shape so the inlay sits flush inside it.
  const innerPanelShape = useMemo(() => {
    if (!hasOpening) return null;

    const s = new THREE.Shape();
    s.moveTo(xLeft, yBottom);
    s.lineTo(xRight, yBottom);
    s.lineTo(xRight, yTop);
    s.lineTo(xLeft, yTop);
    s.closePath();
    return s;
  }, [hasOpening, xLeft, xRight, yBottom, yTop]);

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
      <mesh receiveShadow castShadow>
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
