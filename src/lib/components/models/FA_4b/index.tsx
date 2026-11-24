
import React from "react";
import { Door } from "./Door";
import { Door as DoorA } from "../FA_4a/Door";
import { Drawer } from "./Drawer";
import type { DoorModelProps } from "../../../types/types";
import { useConfigurator } from "../../../context/DoorContext";

export function Door_FA_4b(props: DoorModelProps) {
  const { doorConfig } = useConfigurator();
  
  const height = props.height ?? doorConfig.height ?? 2200;
  
  const isPanelOrBin = doorConfig.name.startsWith("Panel_") || doorConfig.name.startsWith("Bin_");
  // Height no longer switches the door to drawer geometry — the shape stays
  // the same at any height and simply scales.
  const isDrawerMode = false;

  if (isDrawerMode) {
    return <Drawer {...props} />;
  }

  if (isPanelOrBin) {
    return <DoorA {...props} />;
  }

  return <Door {...props} />;
}
