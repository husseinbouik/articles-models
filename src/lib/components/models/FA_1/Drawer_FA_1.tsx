import * as THREE from "three";
import { useConfigurator } from "../../../context/DoorContext";
import { useDoorMaterials } from "../../../hooks/useDoorMaterials";
import type { DoorModelProps, MaterialProps } from "../../../types/types";

import { Geometry, Base } from "@react-three/csg";
import { DoorEdges } from "../DoorEdges";
import { useHandlerCutShapes } from "../../handlers/useHandlerCutShapes";
import { useDoorBoxGeometries } from "../../../hooks/useDoorBoxGeometry";
import { HL01 } from "../../handlers/HL01";
import { HL02 } from "../../handlers/HL02";
import { HL03 } from "../../handlers/HL03";
import { HL04 } from "../../handlers/HL04";
import { HL05 } from "../../handlers/HL05";
import { HLModel } from "../../handlers/HLModel";

export function Drawer_FA_1({
  materials: materialsProp,
  width: widthProp,
  height: heightProp,
  depth: depthProp,
  cutYPosition: cutYPositionProp, // Needed for handler positioning
  handleSide,
  handler,
  edgeColor,
  edgeOpacity,
  edgeLineWidth,
  edgeLineEnabled,
}: DoorModelProps) {
  const { doorConfig } = useConfigurator();
  const materials = useDoorMaterials(materialsProp as MaterialProps);

  const width = widthProp || 800;
  const height = heightProp || 200;
  // Use depth prop, default to 18mm if not provided
  const depth = depthProp || 18;

  // Cut shapes for the edge outline (for whichever handler is selected).
  // Hook runs unconditionally, before any early return.
  const cutShapes = useHandlerCutShapes(depth, handleSide || "right", height);


  // One texture spans the whole part; the edges take a matching slice so they
  // are not squeezed. Runs unconditionally, before any early return.
  const [slabGeometry] = useDoorBoxGeometries(
    [{ width, height, depth }],
    { width, height },
  );

  if (doorConfig.is2D) {
    const color =
      (materials.doorMaterial as THREE.MeshStandardMaterial)?.color ?? "grey";
    return (
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={color} />
      </mesh>
    );
  }

  // Determine which handler to render
  const renderHandler = () => {
    // Common props
    const commonProps = {
      handleSide: handleSide || "right",
      width,
      height,
      depth,
      cutYPosition: cutYPositionProp,
      material: handler?.handlerMaterial ?? materials.doorMaterial,
    };

    if (doorConfig.selectedHandler === "HL01") {
      return <HL01 {...commonProps} />;
    }
    if (doorConfig.selectedHandler === "HL02") {
      return <HL02 {...commonProps} />;
    }
    if (doorConfig.selectedHandler === "HL03") {
      return <HL03 {...commonProps} />;
    }
    if (doorConfig.selectedHandler === "HL04") {
      return <HL04 {...commonProps} />;
    }
    if (doorConfig.selectedHandler === "HL05") {
      return <HL05 {...commonProps} />;
    }
    if (doorConfig.selectedHandler === "HLModel") {
      return <HLModel {...commonProps} />;
    }
    return null;
  };

  // Simple door slab, no frames, now with CSG for handlers
  return (
    <group>
      <mesh receiveShadow>
        <Geometry useGroups>
          <Base material={materials.doorMaterial} geometry={slabGeometry} />
          {renderHandler()}
        </Geometry>
      </mesh>
      {/* Door edge outline — the door owns its edge: front-face perimeter +
          the handler cut(s) as holes, drawn by us (native three, no drei). */}
      <DoorEdges width={width} height={height} depth={depth} cuts={cutShapes} 
        color={edgeColor}
        lineWidth={edgeLineWidth}
        opacity={edgeOpacity}
        enabled={edgeLineEnabled}
      />
    </group>
  );
}
