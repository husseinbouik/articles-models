
import React from "react";
import { Door } from "./Door";
import { DrawerTop } from "./DrawerTop";
import { DrawerCenter } from "./DrawerCenter";
import { DrawerBottom } from "./DrawerBottom";
import type { DoorModelProps } from "../../../types/types";
import { useConfigurator } from "../../../context/DoorContext";

export function Door_FA_7_P(props: DoorModelProps) {
  const { doorConfig } = useConfigurator();
  
  const height = props.height ?? doorConfig.height ?? 2200;
  
  // Height no longer switches the door to drawer geometry — the shape stays
  // the same at any height and simply scales.
  const isDrawerMode = false;
  const isPanelOrBin = doorConfig.name.startsWith("Panel_") || doorConfig.name.startsWith("Bin_");

  if (!isDrawerMode && !isPanelOrBin) {
    return <Door {...props} />;
  }

  const frameVariant = isPanelOrBin ? "full" : (props.frameVariant ?? doorConfig.frameVariant ?? "full");

  switch (frameVariant) {
    case "top":
      return <DrawerTop {...props} />;
    case "bottom":
      return <DrawerBottom {...props} />;
    case "none":
    case "center":
      return <DrawerCenter {...props} />;
    case "full":
    default:
      // Fallback to DrawerTop with hasBottom support if implemented, identical to FA_7 approach
      return <DrawerTop {...props} hasBottom={true} />;
  }
}
