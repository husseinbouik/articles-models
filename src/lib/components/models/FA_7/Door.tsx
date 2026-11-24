
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

export function Door(props: DoorModelProps) {
  const { doorConfig } = useConfigurator();
  const materials = useDoorMaterials(props.materials as MaterialProps);

  const width = props.width ?? 500;
  const height = props.height ?? 2200;
  const depth = props.depth ?? 22;
  const backDepth = props.backDepth ?? 12;
  const frontDepth = props.frontDepth ?? (depth - backDepth);
  const cutYPosition = props.cutYPosition ?? 950;
  
  const frameThickness = 50;
  const frameZ = backDepth / 2 + frontDepth / 2;
  const fw = props.frontPanelWidth ?? 30;

  // Outer-box edge outline for whichever handler is selected.
  const cutShapes = useHandlerCutShapes(
    Math.max(frontDepth, backDepth) + 20,
    props.handleSide || "right",
    height,
  );

  // The arched opening, solved so it always stays INSIDE the part.
  //
  // A full semicircle needs a rise equal to half the opening's width. A tall
  // door has room for that, but a short, wide front (a panel, bin or drawer)
  // does not: taking the radius from the width alone pushes the spring line
  // below the part and swings the arc outside the mesh entirely.
  //
  // So the arc keeps spanning the full opening width — it must still meet the
  // stiles — and instead gives up rise it has no room for, flattening into the
  // circular segment that fits. Where the semicircle already fits (every door,
  // and the stock panel and bin) the maths collapses back to exactly the old
  // semicircle, so those are untouched.
  const arch = useMemo(() => {
    const innerW = width - fw * 2;
    const innerH = height - fw * 2;
    if (innerW <= 0 || innerH <= 0) return null;

    const halfSpan = innerW / 2;
    const rise = Math.min(halfSpan, innerH);
    if (rise <= 0) return null;

    const innerBottomY = -height / 2 + fw;
    // Whatever height the arch does not use stays as straight side wall.
    const springY = innerBottomY + (innerH - rise);

    // Circle through the two spring points with the given rise:
    //   halfSpan² + rise² = 2·R·rise
    const radius = (halfSpan * halfSpan + rise * rise) / (2 * rise);
    const centerY = springY + rise - radius;

    // Sweep from the left spring point, over the crown, to the right one.
    const startAngle = Math.atan2(springY - centerY, -halfSpan);
    const endAngle = Math.atan2(springY - centerY, halfSpan);

    return {
      innerW,
      halfSpan,
      innerBottomY,
      springY,
      radius,
      centerY,
      startAngle,
      endAngle,
    };
  }, [width, fw, height]);

  // Door Mode (Arc) Logic
  const frameShape = useMemo(() => {
    if (!arch) return null;
    const s = new THREE.Shape();
    // Outer rectangle stays at full door size
    s.moveTo(-width / 2, -height / 2);
    s.lineTo(width / 2, -height / 2);
    s.lineTo(width / 2, height / 2);
    s.lineTo(-width / 2, height / 2);
    s.closePath();

    // Inner hole: fw is the border thickness on all 4 sides
    const hole = new THREE.Path();
    hole.moveTo(-arch.halfSpan, arch.innerBottomY);
    hole.lineTo(-arch.halfSpan, arch.springY);
    hole.absarc(
      0,
      arch.centerY,
      arch.radius,
      arch.startAngle,
      arch.endAngle,
      true,
    );
    hole.lineTo(arch.halfSpan, arch.innerBottomY);
    hole.closePath();

    s.holes.push(hole);
    return s;
  }, [arch, width, height]);

  // Front-face OPENING outline (the inner hole of the extruded frameShape):
  // up the left straight side, the semicircular arch over the top, down the
  // right straight side, closed across the bottom. Matches frameShape's hole.
  const frontLoops = useMemo(() => {
    if (!arch) return undefined;
    const { halfSpan, innerBottomY, springY, radius, centerY, startAngle, endAngle } =
      arch;

    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(-halfSpan, innerBottomY)); // bottom-left
    pts.push(new THREE.Vector2(-halfSpan, springY)); // up left side
    const SEG = 48;
    for (let i = 0; i <= SEG; i++) {
      const a = startAngle + (endAngle - startAngle) * (i / SEG); // left -> top -> right
      pts.push(
        new THREE.Vector2(
          Math.cos(a) * radius,
          centerY + Math.sin(a) * radius,
        ),
      );
    }
    pts.push(new THREE.Vector2(halfSpan, innerBottomY)); // down right side

    return [{ points: pts, closed: true, depthEdges: false }];
  }, [arch]);

  // Handler Logic
  const hasHandler = !!doorConfig.selectedHandler && doorConfig.selectedHandler !== "None";
  const HandlerComp = hasHandler ? HANDLERS[doorConfig.selectedHandler as keyof typeof HANDLERS] : undefined;

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

  // The inner panel's outline: the same arched opening frameShape cuts as its
  // hole, but as a solid shape so the inlay follows the curve instead of
  // poking through it as a rectangle would. Kept in step with that hole.
  const innerPanelShape = useMemo(() => {
    if (!arch) return null;

    const s = new THREE.Shape();
    s.moveTo(-arch.halfSpan, arch.innerBottomY);
    s.lineTo(-arch.halfSpan, arch.springY);
    s.absarc(
      0,
      arch.centerY,
      arch.radius,
      arch.startAngle,
      arch.endAngle,
      true,
    );
    s.lineTo(arch.halfSpan, arch.innerBottomY);
    s.closePath();
    return s;
  }, [arch]);

  const pos: [number, number, number] = [0, 0, frameZ - frontDepth / 2];

  // The extruded arch frame maps onto the same door-wide texture as the panel.
  // ExtrudeGeometry would otherwise use raw model-space UVs, sampling the
  // texture in a different coordinate system. The shape is centred on the
  // door, so it needs no XY offset.
  const archFrameGeometry = useDoorExtrudeGeometry(
    frameShape,
    { depth: frontDepth, bevelEnabled: false },
    { width, height },
  );

  // The panel spans the whole door, so it carries one full copy of the
  // texture with the edges taking a matching slice rather than a squeezed
  // copy. Disposal is handled by the hook.
  const [panelGeometry] = useDoorBoxGeometries(
    [{ width, height, depth: backDepth }],
    { width, height },
  );

  return (
    <group>
      <mesh receiveShadow castShadow>
        <Geometry useGroups>
          <Base material={materials.backMaterial} geometry={panelGeometry} />
          {archFrameGeometry && (
            <Base
              material={materials.frontMaterial}
              geometry={archFrameGeometry}
              position={pos}
            />
          )}
          {renderHandlerCutouts()}

        </Geometry>
      </mesh>
      {/* Inner panel — follows the arched opening; absent unless
          materials.innerPanelMaterial is set. Rendered OUTSIDE the CSG mesh so
          the handler cutouts do not subtract from it: the inlay is a flat
          face, not something the cuts pass through. */}
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
