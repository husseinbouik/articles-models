
import React from "react";
import { Door } from "./Door";
import { Drawer } from "./Drawer";
import type { DoorModelProps } from "../../../types/types";
import { useConfigurator } from "../../../context/DoorContext";

export function Door_FA_5a(props: DoorModelProps) {
  const { doorConfig } = useConfigurator();
  
  const height = props.height ?? doorConfig.height ?? 2200;
  
  const isDrawerMode = height <= 600 && !doorConfig.name.startsWith("Panel_") && !doorConfig.name.startsWith("Bin_");

  if (isDrawerMode) {
    return <Drawer {...props} />;
  }

  return <Door {...props} />;
}
