import React, { useMemo } from "react";
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

function Frame({
  position,
  args,
  material,
  door,
}: {
  position: [number, number, number];
  args: [number, number, number];
  material: THREE.Material;
  /** Part extent this bar maps its texture against; omit for a standalone bar. */
  door?: { width: number; height: number };
}) {
  const [barWidth, barHeight, barDepth] = args;
  // Each bar is a window onto one texture spanning the whole part, so the
  // grain runs continuously across the joints rather than restarting per bar.
  const [geometry] = useDoorBoxGeometries(
    [
      {
        width: barWidth,
        height: barHeight,
        depth: barDepth,
        centerX: position[0],
        centerY: position[1],
      },
    ],
    door ?? { width: barWidth, height: barHeight },
  );

  return (
    <mesh
      material={material}
      geometry={geometry}
      position={position}
      receiveShadow
      castShadow
    />
  );
}

export function DrawerTop(props: DoorModelProps & { hasBottom?: boolean }) {
  const { doorConfig } = useConfigurator();
  const materials = useDoorMaterials(props.materials as MaterialProps);

  const width = props.width ?? 500;
  const height = props.height ?? 300;
  const depth = props.depth ?? 22;
  const backDepth = props.backDepth ?? 12;
  const frontDepth = props.frontDepth ?? (depth - backDepth);

  const frontElementsCenterZ = backDepth / 2 + frontDepth / 2;
  const fw = props.frontPanelWidth ?? 30;

  // Handler
  const hasHandler =
    !!doorConfig.selectedHandler && doorConfig.selectedHandler !== "None";
  const HandlerComp = hasHandler
    ? HANDLERS[doorConfig.selectedHandler as keyof typeof HANDLERS]
    : undefined;

  const renderHandler = () => {
    if (!HandlerComp) return null;
    const anchorDepth = Math.max(frontDepth, backDepth);
    const cutProps = {
      handleSide: props.handleSide ?? "right",
      width,
      height,
      depth: anchorDepth + 20,
      cutYPosition: props.cutYPosition ?? 950,
      material: props.handler?.handlerMaterial ?? materials.doorMaterial,
    };
    if (doorConfig.selectedHandler === "HLModel")
      return <HandlerComp {...cutProps} depth={anchorDepth} />;
    return <HandlerComp {...cutProps} />;
  };

  const stileX = width / 2 - fw / 2;
  const railY = height / 2 - fw / 2;
  const innerW = width - fw * 2;

  // Outer-box edge outline for whichever handler is selected.
  const cutShapes = useHandlerCutShapes(
    Math.max(frontDepth, backDepth) + 20,
    props.handleSide || "right",
    height,
  );

  // Per-bar front-frame edge outlines (one rectangle per <Frame> box).
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
    const stileX = width / 2 - fw / 2; // stile center
    const xStileInnerL = -width / 2 + fw; // left stile inner face
    const xStileInnerR = width / 2 - fw; // right stile inner face
    // A rail runs between the two stiles; draw only its top+bottom long edges
    // (open at both ends) so the line stops where it meets each stile.
    const railPath = (cy: number) => ({
      points: [
        new THREE.Vector2(xStileInnerL, cy + fw / 2),
        new THREE.Vector2(xStileInnerR, cy + fw / 2),
      ],
      closed: false,
    });
    const railPath2 = (cy: number) => ({
      points: [
        new THREE.Vector2(xStileInnerL, cy - fw / 2),
        new THREE.Vector2(xStileInnerR, cy - fw / 2),
      ],
      closed: false,
    });
    const railY = height / 2 - fw / 2; // top rail center
    const loops = [
      rect(-stileX, 0, fw, height), // left stile (full rect)
      rect(stileX, 0, fw, height), // right stile (full rect)
      railPath(railY), // top rail: upper long edge
      railPath2(railY), // top rail: lower long edge
    ];
    if (props.hasBottom) {
      loops.push(railPath(-railY), railPath2(-railY)); // bottom rail edges
    }
    return loops;
  }, [width, height, fw, props.hasBottom]);


  // The back panel spans the whole part, so it carries one full copy of the
  // texture that the frame bars then sample their slices from.
  const [backGeo] = useDoorBoxGeometries(
    [{ width, height, depth: backDepth }],
    { width, height },
  );

  return (
    <group>
      <mesh castShadow>
        <Geometry useGroups>
          <Base material={materials.backMaterial} geometry={backGeo} />
          {renderHandler()}
        </Geometry>
      </mesh>
      {/* Inner panel — fills the opening the stiles and rails leave; absent
          unless materials.innerPanelMaterial is set. Where a rail is absent the
          panel runs to the edge. Outside the CSG mesh so the cuts leave it
          flat. */}
      <InnerPanel
        material={materials.innerPanelMaterial}
        width={innerW}
        height={Math.max(0, (height / 2 - fw) - (-height / 2 + fw))}
        door={{ width, height }}
        centerY={((height / 2 - fw) + (-height / 2 + fw)) / 2}
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
      
        color={props.edgeColor}
        lineWidth={props.edgeLineWidth}
        opacity={props.edgeOpacity}
        enabled={props.edgeLineEnabled}
      />

      {/* Decorative Frames on top of Base */}
      <group>
        {/* Left Stile */}
        <Frame
          position={[-stileX, 0, frontElementsCenterZ]}
          args={[fw, height, frontDepth]}
          material={materials.frontMaterial as THREE.Material}
          door={{ width, height }}
        />
        {/* Right Stile */}
        <Frame
          position={[stileX, 0, frontElementsCenterZ]}
          args={[fw, height, frontDepth]}
          material={materials.frontMaterial as THREE.Material}
          door={{ width, height }}
        />
        {/* Top Rail */}
        <Frame
          position={[0, railY, frontElementsCenterZ]}
          args={[innerW, fw, frontDepth]}
          material={materials.frontMaterial as THREE.Material}
          door={{ width, height }}
        />
        {/* Optional Bottom Rail */}
        {props.hasBottom && (
          <Frame
            position={[0, -railY, frontElementsCenterZ]}
            args={[innerW, fw, frontDepth]}
            material={materials.frontMaterial as THREE.Material}
          />
        )}
      </group>
    </group>
  );
}
