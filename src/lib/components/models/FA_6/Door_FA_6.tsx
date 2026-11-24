import React, { useMemo, useEffect } from "react";
// Forced recompile
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

import { Drawer_FA_6_Top } from "./DrawerTop";
import { Drawer_FA_6_Center } from "./DrawerCenter";
import { Drawer_FA_6_Bottom } from "./DrawerBottom";

const HANDLERS: Record<string, React.ComponentType<any>> = {
  HL01,
  HL02,
  HL03,
  HL04,
  HL05,
  HLModel,
};

export function Door_FA_6({
  materials: materialsProp,
  width: widthProp,
  height: heightProp,
  depth: depthProp,
  frontDepth: frontDepthProp,
  backDepth: backDepthProp,
  frontPanelWidth: frontPanelWidthProp,
  cutYPosition: cutYPositionProp,
  handleSide,
  frameVariant: variantProp,
  debugEdges = false,
  noArchBelowHeight = 600,
  handler,
  edgeColor,
  edgeOpacity,
  edgeLineWidth,
  edgeLineEnabled,
}: DoorModelProps & { noArchBelowHeight?: number }) {
  const { doorConfig, doorFA6Config, doorCut } = useConfigurator();
  const materials = useDoorMaterials(materialsProp as MaterialProps);

  const width = widthProp ?? 500;
  const height = heightProp ?? 2200;
  const depth = depthProp ?? 22;
  const backDepth = backDepthProp ?? 12;
  const frontDepth = frontDepthProp ?? (depth - backDepth);
  const cutYPosition = cutYPositionProp ?? 950;
  const frameVariant = variantProp ?? doorConfig.frameVariant ?? "full";

  const frameThickness = 40;
  const frameZ = backDepth / 2 + frontDepth / 2;
  const fw = frontPanelWidthProp ?? 30;

  // Outer-box edge outline for whichever handler is selected.
  // Hook runs unconditionally, before the drawer-mode dispatch.
  const cutShapes = useHandlerCutShapes(
    Math.max(frontDepth, backDepth) + 20,
    handleSide || "right",
    height,
  );

  // Front-face OPENING outline (the inner hole of the tall-door frameShape):
  // up the left side, top-left corner arc, across the top, top-right corner
  // arc, down the right side, closed across the bottom. Hook runs before the
  // drawer-mode dispatch (hooks rule); only used in the tall-door return.
  const frontLoops = useMemo(() => {
    const innerW = width - fw * 2;
    const xLeft = -innerW / 2;
    const xRight = innerW / 2;
    const yBottom = -height / 2 + fw;
    const yTop = height / 2 - fw;

    const maxR = innerW / 2;
    const safeTL = Math.min(doorFA6Config.topLeftRadius, maxR);
    const safeTR = Math.min(doorFA6Config.topRightRadius, maxR);

    const pts: THREE.Vector2[] = [];
    const N = 16;
    pts.push(new THREE.Vector2(xLeft, yBottom)); // bottom-left
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
    pts.push(new THREE.Vector2(xRight, yBottom)); // down right side

    return [{ points: pts, closed: true, depthEdges: false }];
  }, [
    width,
    fw,
    height,
    doorFA6Config.topLeftRadius,
    doorFA6Config.topRightRadius,
  ]);

  // Height no longer switches the door to drawer geometry — the rounded/arched
  // shape is kept at any height and simply scales with it. Only the explicit
  // Drawer_FA_6_* cpids select the composed drawer fronts, so a short door or
  // one that merely passes frameVariant keeps the arch.
  const isDrawerMode = !!doorConfig.name?.startsWith("Drawer_FA_6");

  // --- MODE A: TALL DOOR (Rounded Corners) ---
  const frameShape = useMemo(() => {
    if (isDrawerMode) return null;
    const s = new THREE.Shape();
    // Outer rectangle stays at full door size
    s.moveTo(-width / 2, -height / 2);
    s.lineTo(width / 2, -height / 2);
    s.lineTo(width / 2, height / 2);
    s.lineTo(-width / 2, height / 2);
    s.closePath();

    // Inner hole: fw is the border thickness on all 4 sides
    const hole = new THREE.Path();
    const innerW = width - fw * 2;
    // const innerH = height - frameThickness * 2; // Not used directly, calculated via coordinates

    // Bounds for the hole
    const xLeft = -innerW / 2;
    const xRight = innerW / 2;
    const yBottom = -height / 2 + fw;
    const yTop = height / 2 - fw;

    const rTL = doorFA6Config.topLeftRadius;
    const rTR = doorFA6Config.topRightRadius;

    // Clamp radii to avoid overlapping
    // Max radius is half width (or limited by height, but width is likely tighter constraint)
    const maxR = innerW / 2;
    const safeTL = Math.min(rTL, maxR);
    const safeTR = Math.min(rTR, maxR);

    // Draw Hole (Clockwise)
    // Start Bottom Left
    hole.moveTo(xLeft, yBottom);

    // Up to start of Top-Left corner
    hole.lineTo(xLeft, yTop - safeTL);

    // Top Left Arc (CLockwise: PI -> PI/2)
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

    // Top horizontal line to start of Top-Right corner
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

    // Close (back to Bottom Left)
    hole.closePath();

    s.holes.push(hole);
    return s;
  }, [
    width,
    fw,
    height,
    isDrawerMode,
    doorFA6Config.topLeftRadius,
    doorFA6Config.topRightRadius,
  ]);

  // The inner panel's outline: the same rounded opening frameShape cuts as its
  // hole, but as a solid shape so the inlay follows the curve instead of
  // poking through it as a rectangle would. Kept in step with the hole above.
  const innerPanelShape = useMemo(() => {
    if (isDrawerMode) return null;
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
    isDrawerMode,
    doorFA6Config.topLeftRadius,
    doorFA6Config.topRightRadius,
  ]);

  // --- MODE B: DRAWER (Composed Meshes) ---
  const innerW = Math.max(0, width - fw * 2);
  const hasTop = frameVariant === "top" || frameVariant === "full";
  const hasBottom = frameVariant === "bottom" || frameVariant === "full";

  const stileX = width / 2 - fw / 2;
  const railY = height / 2 - fw / 2;

  // The panel and each frame bar are windows onto one texture spanning the
  // whole door, so the grain runs continuously across every joint. The two
  // stiles need separate geometries despite being the same size, because the
  // UVs now encode where each bar sits on the door. Disposal is handled by
  // the hook.
  const [
    panelGeometry,
    leftStileGeometry,
    rightStileGeometry,
    bottomRailGeometry,
    topRailGeometry,
  ] = useDoorBoxGeometries(
    [
      { width, height, depth: backDepth },
      { width: fw, height, depth: frontDepth, centerX: -stileX },
      { width: fw, height, depth: frontDepth, centerX: stileX },
      { width: innerW, height: fw, depth: frontDepth, centerY: -railY },
      { width: innerW, height: fw, depth: frontDepth, centerY: railY },
    ],
    { width, height },
  );

  // The extruded arch frame maps onto the same door-wide texture as the boxes.
  // ExtrudeGeometry would otherwise use raw model-space UVs, sampling the
  // texture in a different coordinate system from the panel behind it. The
  // shape is centred on the door, so it needs no XY offset. Hook runs
  // unconditionally, before the drawer-mode dispatch.
  const archFrameGeometry = useDoorExtrudeGeometry(
    frameShape,
    { depth: frontDepth, bevelEnabled: false },
    { width, height },
  );

  // --- HANDLER LOGIC ---
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
    // HLModel is usually not a cutout
    if (doorConfig.selectedHandler === "HLModel")
      return <HandlerComp {...cutProps} depth={anchorDepth} />;
    return <HandlerComp {...cutProps} />;
  };

  // --- SHARED FRAME RENDERER ---
  const renderFrameParts = (isCSG: boolean) => {
    if (!isDrawerMode) {
      // DOOR MODE: Extrusion with rounded corners
      const pos: [number, number, number] = [0, 0, frameZ - frontDepth / 2];
      if (isCSG) {
        return (
          <Base
            material={materials.frontMaterial}
            geometry={archFrameGeometry!}
            position={pos}
          />
        );
      }
      return (
        <mesh
          material={materials.frontMaterial}
          geometry={archFrameGeometry!}
          position={pos}
          receiveShadow
          castShadow
        />
      );
    }

    // DRAWER MODE: Composed Stiles/Rails
    if (isCSG) {
      return (
        <>
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
          {hasBottom && (
            <Base
              material={materials.frontMaterial}
              geometry={bottomRailGeometry}
              position={[0, -railY, frameZ]}
            />
          )}
          {hasTop && (
            <Base
              material={materials.frontMaterial}
              geometry={topRailGeometry}
              position={[0, railY, frameZ]}
            />
          )}
        </>
      );
    }

    return (
      <group position={[0, 0, frameZ]}>
        <mesh
          geometry={leftStileGeometry}
          material={materials.frontMaterial}
          position={[-stileX, 0, 0]}
          receiveShadow
          castShadow
        ></mesh>
        <mesh
          geometry={rightStileGeometry}
          material={materials.frontMaterial}
          position={[stileX, 0, 0]}
          receiveShadow
          castShadow
        ></mesh>
        {hasBottom && (
          <mesh
            geometry={bottomRailGeometry}
            material={materials.frontMaterial}
            position={[0, -railY, 0]}
            receiveShadow
            castShadow
          ></mesh>
        )}
        {hasTop && (
          <mesh
            geometry={topRailGeometry}
            material={materials.frontMaterial}
            position={[0, railY, 0]}
            receiveShadow
            castShadow
          ></mesh>
        )}
      </group>
    );
  };

  // Drawer dispatch — after all hooks so Rules of Hooks is satisfied.
  if (isDrawerMode) {
    const drawerProps = {
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
      debugEdges,
      edgeColor,
      edgeOpacity,
      edgeLineWidth,
      edgeLineEnabled,
    };
    if (frameVariant === "top") return <Drawer_FA_6_Top {...drawerProps} />;
    if (frameVariant === "center") return <Drawer_FA_6_Center {...drawerProps} />;
    if (frameVariant === "bottom") return <Drawer_FA_6_Bottom {...drawerProps} />;
    // "full" fallback → top drawer
    return <Drawer_FA_6_Top {...drawerProps} />;
  }

  return (
    <group>
      <mesh receiveShadow castShadow>
        <Geometry useGroups>
          <Base material={materials.backMaterial} geometry={panelGeometry} />
          {renderFrameParts(true)}
          {renderHandlerCutouts()}
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
      {/* Inner panel — follows the rounded opening; absent unless
          materials.innerPanelMaterial is set. Rendered OUTSIDE the CSG mesh so
          the handler and door cuts do not subtract from it: the inlay is a
          flat face, not something the cuts pass through. */}
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
