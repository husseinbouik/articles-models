import React from "react";
import { Door } from "./Door";
import { Panel } from "./Panel";
import { DrawerTop } from "./DrawerTop";
import { DrawerCenter } from "./DrawerCenter";
import { DrawerBottom } from "./DrawerBottom";
import type { DoorModelProps } from "../../../types/types";
import { useConfigurator } from "../../../context/DoorContext";

export function Door_FA_7(props: DoorModelProps) {
  const { doorConfig } = useConfigurator();

  // Height no longer switches the door to drawer geometry — the arch is kept
  // at any height and simply scales with it. The cpid picks the part instead:
  // the arch belongs to the door alone, while a panel, bin or drawer front
  // carries a straight frame.
  //
  // The cpid's family is already resolved before this component mounts (see
  // SpecialKms), so these bare prefixes identify FA_7's own parts and cannot
  // collide with the FA_7_P variants.
  const name = doorConfig.name ?? "";
  const isPanelOrBin = name.startsWith("Panel_") || name.startsWith("Bin_");
  const isDrawerMode = name.startsWith("Drawer_");

  if (isPanelOrBin) return <Panel {...props} />;
  if (!isDrawerMode) return <Door {...props} />;

  const frameVariant = props.frameVariant ?? doorConfig.frameVariant ?? "full";

  switch (frameVariant) {
    case "bottom":
      return <DrawerBottom {...props} />;
    case "none":
    case "center":
      return <DrawerCenter {...props} />;
    case "top":
    case "full":
    default:
      return <DrawerTop {...props} />;
  }
}
