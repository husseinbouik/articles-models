
import React, { useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { Geometry, Base, Subtraction } from "@react-three/csg";
import { DoorEdges } from "../DoorEdges";
import { useHandlerCutShapes } from "../../handlers/useHandlerCutShapes";
import {
  useDoorBoxGeometries,
  useDoorExtrudeGeometry,
} from "../../../hooks/useDoorBoxGeometry";
import {
  InnerPanel,
  InnerPanelShape,
  INNER_PANEL_DEPTH,
} from "../InnerPanel";
import { useConfigurator } from "../../../context/DoorContext";
import { useSpring, animated } from "@react-spring/three";
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

function EnhancedCSGArchPanel({
  width,
  height,
  depth,
  position = [0, 0, 0],
  material,
  frameThickness = 70,
  door,
}: {
  width: number;
  height: number;
  depth: number;
  position?: [number, number, number];
  material: THREE.Material;
  frameThickness?: number;
  /** Door extent this panel maps its texture against; omit to map to itself. */
  door?: { width: number; height: number };
}) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-width / 2, -height / 2);
    s.lineTo(width / 2, -height / 2);
    s.lineTo(width / 2, height / 2);
    s.lineTo(-width / 2, height / 2);
    s.closePath();

    const hole = new THREE.Path();
    const innerW = width - frameThickness * 2;
    const archRadius = innerW / 2;
    const straightHeight = height - archRadius - frameThickness;
    const bottomY = -height / 2;

    hole.moveTo(-innerW / 2, bottomY);
    hole.lineTo(-innerW / 2, bottomY + straightHeight);
    hole.absarc(0, bottomY + straightHeight, archRadius, Math.PI, 0, true);
    hole.lineTo(innerW / 2, bottomY);
    hole.closePath();

    s.holes.push(hole);
    return s;
  }, [width, height, frameThickness]);

  const extrudeSettings = useMemo(
    () => ({
      depth: depth,
      bevelEnabled: false,
    }),
    [depth],
  );

  // The panel maps onto the same door-wide texture as the boxes around it.
  // ExtrudeGeometry would otherwise use raw model-space UVs. The panel sits
  // above the door's centre, so its offset is passed through to keep the
  // texture anchored to the door rather than to the panel.
  const geometry = useDoorExtrudeGeometry(
    shape,
    extrudeSettings,
    door ?? { width, height },
    door ? position[0] : 0,
    door ? position[1] : 0,
  );

  return (
    <group position={[position[0], position[1], position[2] - depth / 2]}>
      <mesh
        material={material}
        geometry={geometry!}
        receiveShadow
        castShadow
      />
    </group>
  );
}

export function Frame({
  position,
  args,
  material,
  door,
}: {
  position: [number, number, number];
  args: [number, number, number];
  material: THREE.Material;
  /** Door extent this bar maps its texture against; omit for a standalone bar. */
  door?: { width: number; height: number };
}) {
  const [barWidth, barHeight, barDepth] = args;
  // Each bar is a window onto one texture spanning the whole door, so the
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

export function Door(props: DoorModelProps) {
  const { doorConfig, doorCut } = useConfigurator();
  const materials = useDoorMaterials(props.materials as MaterialProps);

  const width = props.width || 700;
  const height = props.height || 2100;
  const depth = props.depth || 22;
  const backDepth = props.backDepth ?? 12;
  const frontDepth = props.frontDepth ?? (depth - backDepth);

  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialHeightRef = useRef<number | null>(null);
  useEffect(() => {
    if (initialHeightRef.current === null && height > 0) {
      initialHeightRef.current = height;
    }
  }, [height]);

  const yOffset = useMemo(() => {
    const initialHeight = initialHeightRef.current;
    if (initialHeight === null) return 0;
    return (height - initialHeight) / 2;
  }, [height]);

  const frameThickness = 70;
  const topSectionFixedHeight = 500;
  const minHeight = topSectionFixedHeight + frameThickness * 2;
  const doorHeight = Math.max(height, minHeight); // Use local height logic
  const frontElementsCenterZ = backDepth / 2 + frontDepth / 2;
  const fw = props.frontPanelWidth ?? 30;

  // Outer-box edge outline for whichever handler is selected.
  // Hook runs unconditionally, before the is2D early return.
  const cutShapes = useHandlerCutShapes(
    Math.max(frontDepth, backDepth) + 20,
    props.handleSide || "right",
    doorHeight,
  );

  // The back panel spans the whole door, so it carries one full copy of the
  // texture that the frame bars then sample their slices from.
  const [backGeo] = useDoorBoxGeometries(
    [{ width, height: doorHeight, depth: backDepth }],
    { width, height: doorHeight },
  );

  const archPanelHeight = topSectionFixedHeight;
  const archPanelCenterY = doorHeight / 2 - archPanelHeight / 2;
  const horizontalFrameTopY = doorHeight / 2 - topSectionFixedHeight;
  const horizontalFrameCenterY = horizontalFrameTopY - fw / 2;
  const bottomFrameCenterY = -(doorHeight / 2) + fw / 2;
  const verticalFramesHeight = horizontalFrameTopY - -(doorHeight / 2);
  const verticalFramesCenterY = -(doorHeight / 2) + verticalFramesHeight / 2;

  // The arch section's inner-panel outline: the same opening the arch panel
  // cuts as its hole, as a solid shape, in that panel's local coordinates
  // (it is positioned at archPanelCenterY by the caller).
  //
  // The border here is `fw`, NOT the local `frameThickness` (70): the call site
  // renders EnhancedCSGArchPanel with frameThickness={fw}, overriding that
  // component's own default. Using 70 made this panel far too small.
  const archOpeningShape = useMemo(() => {
    const innerW = width - fw * 2;
    if (innerW <= 0) return null;
    const archRadius = innerW / 2;
    const straightHeight = archPanelHeight - archRadius - fw;
    const bottomY = -archPanelHeight / 2;

    const s = new THREE.Shape();
    s.moveTo(-innerW / 2, bottomY);
    s.lineTo(-innerW / 2, bottomY + straightHeight);
    s.absarc(0, bottomY + straightHeight, archRadius, Math.PI, 0, true);
    s.lineTo(innerW / 2, bottomY);
    s.closePath();
    return s;
  }, [width, fw, archPanelHeight]);

  // Front-face outlines (door-local, centered on origin):
  //  - each FRAME BAR as its own full rectangle (so every bar shows BOTH its
  //    inner and outer edges, not just the outer one)
  //  - the ARCH CURVE on its own (just the rounded opening edge)
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

    // The lower frame section as a clean border: OUTER rectangle + INNER
    // opening rectangle (inset by fw on each side). The lower section spans
    // verticalFramesCenterY ± verticalFramesHeight/2 (top = horizontalFrameTopY,
    // bottom = -doorHeight/2). This avoids per-bar stile/rail overlap at corners.
    const innerW = width - fw * 2;
    const bars = [
      rect(0, verticalFramesCenterY, width, verticalFramesHeight), // outer lower-frame edge
      rect(0, verticalFramesCenterY, innerW, verticalFramesHeight - fw * 2), // inner opening edge
    ];

    // The OPENING outline (the recessed-panel boundary): up the left inner
    // side, the inner arch over the top, down the right inner side, across the
    // bottom. Inner radius = innerW/2, spring line per EnhancedCSGArchPanel.
    const archRadius = innerW / 2;
    const xL = -archRadius;
    const xR = archRadius;
    const straightHeight = archPanelHeight - archRadius - fw;
    const archSpringY =
      archPanelCenterY + (-archPanelHeight / 2 + straightHeight);
    const openingBottomY = -doorHeight / 2 + fw; // top of bottom rail

    const archPts: THREE.Vector2[] = [];
    archPts.push(new THREE.Vector2(xL, openingBottomY)); // bottom-left
    archPts.push(new THREE.Vector2(xL, archSpringY)); // up left side
    const SEG = 48;
    for (let i = 0; i <= SEG; i++) {
      const a = Math.PI - (Math.PI * i) / SEG; // PI → 0 (left → top → right)
      archPts.push(
        new THREE.Vector2(
          Math.cos(a) * archRadius,
          archSpringY + Math.sin(a) * archRadius,
        ),
      );
    }
    archPts.push(new THREE.Vector2(xR, openingBottomY)); // down right side

    // depthEdges:false — the arch is densely sampled, so per-point depth lines
    // would look like hatching; just the face outline.
    return [...bars, { points: archPts, closed: true, depthEdges: false }];
  }, [
    width,
    fw,
    doorHeight,
    archPanelHeight,
    archPanelCenterY,
    horizontalFrameCenterY,
    bottomFrameCenterY,
    verticalFramesCenterY,
    verticalFramesHeight,
  ]);

  // Handler Logic
  const hasHandler = !!doorConfig.selectedHandler && doorConfig.selectedHandler !== "None";
  const HandlerComp = hasHandler ? HANDLERS[doorConfig.selectedHandler as keyof typeof HANDLERS] : undefined;

  const renderHandler = () => {
    if (!HandlerComp) return null;
    const anchorDepth = Math.max(frontDepth, backDepth);
    const cutProps = {
      handleSide: props.handleSide ?? "right",
      width,
      height: doorHeight,
      depth: anchorDepth + 20,
      cutYPosition: props.cutYPosition ?? 950,
      material: props.handler?.handlerMaterial ?? materials.doorMaterial,
    };

    if (doorConfig.selectedHandler === "HLModel")
      return <HandlerComp {...cutProps} depth={anchorDepth} />;
    return <HandlerComp {...cutProps} />;
  };

  if (doorConfig.is2D) {
      return (
        <mesh position={[0, yOffset, 0]}>
          <planeGeometry args={[width, doorHeight]} />
          <meshBasicMaterial
            color={(materials.doorMaterial as THREE.MeshStandardMaterial).color}
          />
        </mesh>
      );
  }

  return (
    <group position={[0, yOffset, 0]}> 
      <mesh receiveShadow castShadow>
        <Geometry useGroups>
          <Base material={materials.backMaterial} geometry={backGeo} />
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
                      doorCut.yPosition - doorHeight / 2,
                      doorCut.zPosition,
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
      <DoorEdges
        width={width}
        height={doorHeight}
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

      {/* Inner panels — this door has two openings: the arched top section and
          the rectangular lower section between the stiles and rails. Both are
          absent unless materials.innerPanelMaterial is set. Rendered as plain
          meshes because the frames here sit outside the CSG geometry. */}
      <InnerPanelShape
        material={materials.innerPanelMaterial}
        shape={archOpeningShape}
        door={{ width, height: doorHeight }}
        centerY={archPanelCenterY}
        z={backDepth / 2}
        asCSG={false}
      />
      <InnerPanel
        material={materials.innerPanelMaterial}
        width={width - fw * 2}
        height={Math.max(0, verticalFramesHeight - fw * 2)}
        door={{ width, height: doorHeight }}
        centerY={verticalFramesCenterY}
        z={backDepth / 2 + INNER_PANEL_DEPTH / 2}
        asCSG={false}
      />

      {/* Decorative Frames */}
      <group>
        <Frame
          position={[
            width / 2 - fw / 2,
            verticalFramesCenterY,
            frontElementsCenterZ,
          ]}
          args={[fw, verticalFramesHeight, frontDepth]}
          material={materials.frontMaterial as THREE.Material}
          door={{ width, height: doorHeight }}
        />
        <Frame
          position={[
            -(width / 2 - fw / 2),
            verticalFramesCenterY,
            frontElementsCenterZ,
          ]}
          args={[fw, verticalFramesHeight, frontDepth]}
          material={materials.frontMaterial as THREE.Material}
          door={{ width, height: doorHeight }}
        />
        <Frame
          position={[0, horizontalFrameCenterY, frontElementsCenterZ]}
          args={[width - fw * 2, fw, frontDepth]}
          material={materials.frontMaterial as THREE.Material}
          door={{ width, height: doorHeight }}
        />
        <Frame
          position={[0, bottomFrameCenterY, frontElementsCenterZ]}
          args={[width - fw * 2, fw, frontDepth]}
          material={materials.frontMaterial as THREE.Material}
          door={{ width, height: doorHeight }}
        />
      </group>

      <EnhancedCSGArchPanel
        width={width}
        height={archPanelHeight}
        depth={frontDepth}
        position={[0, archPanelCenterY, frontElementsCenterZ]}
        door={{ width, height: doorHeight }}
        material={materials.frontMaterial as THREE.Material}
        frameThickness={fw}
      />
    </group>
  );
}
