import { useMemo } from "react";
import { useConfigurator } from "../../context/DoorContext";
import type { CutShape } from "./HL01";
import { useHL01CutShapes } from "./HL01";
import { useHL02CutShapes } from "./HL02";
import { useHL03CutShapes } from "./HL03";
import { useHL04CutShapes } from "./HL04";
import { useHL05CutShapes } from "./HL05";

// Stable empty array returned for inactive handlers — avoids a new reference
// on every render, which would trigger DoorEdges to recompute its geometry.
const NO_CUTS: CutShape[] = [];

/**
 * Returns the cut shapes for whichever handler is currently selected, so a door
 * can pass them to <DoorEdges> for the edge outline. All five per-handler hooks
 * are called unconditionally (Rules of Hooks); we just pick the active one's
 * result. HLModel (glb) and "None" return no cuts. Pass the door's own
 * depth/handleSide/height so the cut math matches what the handler renders.
 */
export function useHandlerCutShapes(
  depth: number,
  handleSide: "left" | "right" = "right",
  height = 2100,
): CutShape[] {
  const { doorConfig } = useConfigurator();

  const hl01 = useHL01CutShapes(depth);
  const hl02 = useHL02CutShapes(depth);
  const hl03 = useHL03CutShapes(depth);
  const hl04 = useHL04CutShapes(depth, handleSide, height);
  const hl05 = useHL05CutShapes(depth, handleSide, height);

  // Memoize the selection so a context update that doesn't change the active
  // handler or its cuts doesn't produce a new array reference — which would
  // cascade into DoorEdges geometry recompute and a CSG re-cut.
  return useMemo(() => {
    switch (doorConfig.selectedHandler) {
      case "HL01": return hl01;
      case "HL02": return hl02;
      case "HL03": return hl03;
      case "HL04": return hl04;
      case "HL05": return hl05;
      default:     return NO_CUTS;
    }
  }, [doorConfig.selectedHandler, hl01, hl02, hl03, hl04, hl05]);
}
