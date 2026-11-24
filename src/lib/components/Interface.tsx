import React from "react";
import {
  Box,
  FormControl,
  FormLabel,
  Paper,
  Stack,
  Typography,
  Select,
  MenuItem,
  SelectChangeEvent,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useConfigurator, PRESET_DATA } from "../context/DoorContext";
import { useColorMode } from "../context/ThemeContext";
import type { DoorConfig } from "../types/types";

const CustomSlider = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (event: Event, newValue: number | number[]) => void;
  min: number;
  max: number;
  step?: number;
}) => (
  <Box sx={{ mt: 1 }}>
    <Typography gutterBottom variant="caption">
      {label}: {typeof value === "number" ? value.toFixed(0) : 0}mm
    </Typography>
    <Slider
      size="small"
      value={typeof value === "number" ? value : min}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      aria-label={label}
    />
  </Box>
);

const getFolderName = (key: string) => {
  let name = key.replace(/^(Door_|Drawer_|Panel_|Bin_)/, "");
  // Special case for FA_X_P (like FA_7_P)
  if (name.match(/^FA_\d+_P/)) {
    return name.split("_").slice(0, 3).join("_");
  }
  // Standard FA_X
  if (name.startsWith("FA_")) {
    return name.split("_").slice(0, 2).join("_");
  }
  return name;
};

const ModelSelection = ({
  doorConfig,
  onSelect,
}: {
  doorConfig: DoorConfig;
  onSelect: (event: SelectChangeEvent<string>) => void;
}) => {
  const [expandedFolder, setExpandedFolder] = React.useState<string | null>(
    null,
  );

  const groupedModels = React.useMemo(() => {
    const groups: Record<string, string[]> = {};
    Object.keys(PRESET_DATA).forEach(key => {
      const folder = getFolderName(key);
      if (!groups[folder]) groups[folder] = [];
      groups[folder].push(key);
    });
    return groups;
  }, []);

  const handleFolderClick = (folder: string) => {
    setExpandedFolder(prev => (prev === folder ? null : folder));
  };

  const handleModelClick = (modelName: string) => {
    const event = {
      target: { value: modelName },
    } as SelectChangeEvent<string>;
    onSelect(event);
  };

  // Auto-expand folder on mount or when external selection changes
  React.useEffect(() => {
    if (doorConfig.name) {
      const folder = getFolderName(doorConfig.name);
      setExpandedFolder(folder);
    }
  }, [doorConfig.name]);

  const sortedFolders = React.useMemo(
    () =>
      Object.keys(groupedModels).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      ),
    [groupedModels],
  );

  return (
    <List dense sx={{ maxHeight: "400px", overflow: "auto" }}>
      {sortedFolders.map(folder => {
        const isExpanded = expandedFolder === folder;
        const models = groupedModels[folder];

        return (
          <React.Fragment key={folder}>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleFolderClick(folder)}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <FolderIcon color="action" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={folder}
                  slotProps={{
                    primary: {
                      variant: "body2",
                      sx: { fontWeight: isExpanded ? "bold" : "regular" },
                    },
                  }}
                />
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {models.map(modelKey => (
                  <ListItemButton
                    key={modelKey}
                    selected={doorConfig.name === modelKey}
                    sx={{ pl: 4 }}
                    onClick={() => handleModelClick(modelKey)}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <InsertDriveFileIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={modelKey}
                      slotProps={{
                        primary: {
                          variant: "body2",
                          noWrap: true,
                        },
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </React.Fragment>
        );
      })}
    </List>
  );
};

export const Interface = () => {
  const {
    doorConfig,
    setDoorConfig,
    hl01Handle,
    setHL01Handle,
    bodyThreeHandle,
    setBodyThreeHandle,
    bodyThreeCapsule,
    setBodyThreeCapsule,
    bodyFourHandle,
    setBodyFourHandle,
    bodyFourCapsule,
    setBodyFourCapsule,
    hl04Handle,
    setHL04Handle,
    hl05Handle,
    setHL05Handle,
    doorCut,
    setDoorCut,
    hlModelHandle,
    setHLModelHandle,
  } = useConfigurator();

  const { mode, toggleColorMode } = useColorMode();

  // Inner panel state is derived from the single innerPanelMaterial value
  // rather than kept separately, so the UI cannot drift from what is rendered.
  // Undefined means "no panel"; a string is either a URL (texture) or a colour.
  const innerPanelValue =
    typeof doorConfig.innerPanelMaterial === "string"
      ? doorConfig.innerPanelMaterial
      : undefined;
  const innerPanelOn = innerPanelValue !== undefined;
  const innerPanelIsTexture =
    !!innerPanelValue &&
    (innerPanelValue.startsWith("http") || innerPanelValue.startsWith("/"));
  // Remembered separately so toggling Color/Texture keeps the other's last
  // value instead of clearing it.
  const innerPanelColor =
    innerPanelValue && !innerPanelIsTexture ? innerPanelValue : "#c8a165";
  const innerPanelTexture = innerPanelIsTexture ? innerPanelValue : "";

  const handlePresetChange = (event: SelectChangeEvent<string>) => {
    const presetName = event.target.value;
    const newPresetData = PRESET_DATA[presetName];

    if (newPresetData) {
      const updatePayload: Partial<DoorConfig> = { ...newPresetData };

      const isNewDrawer = presetName.startsWith("Drawer");
      const isPanel = presetName.startsWith("Panel");
      const isBin = presetName.startsWith("Bin");

      const defaultY =
        newPresetData.cutYPosition ??
        (isNewDrawer ? 100 : isPanel ? 300 : isBin ? 200 : 950);

      // Reset handlers to sensible defaults based on Door vs Drawer/Panel/Bin
      if (isNewDrawer || isPanel || isBin) {
        setHL04Handle(p => ({
          ...p,
          horizontalOffset: 0,
          verticalPosition: 0,
        }));
        setHL05Handle(p => ({
          ...p,
          horizontalOffset: 0,
          verticalPosition: 0,
        }));
        setHLModelHandle(p => ({
          ...p,
          horizontalOffset: 0,
          verticalPosition: 0,
        }));
        setBodyFourHandle(p => ({
          ...p,
          horizontalOffset: 0,
          verticalPosition: 0,
        }));
        setBodyThreeHandle(p => ({
          ...p,
          horizontalOffset: 0,
          verticalPosition: 0,
        }));
        setHL01Handle(p => ({
          ...p,
          horizontalOffset: 0,
          verticalPosition: 0,
        }));
      } else {
        // Door defaults
        setHL04Handle(p => ({
          ...p,
          horizontalOffset: 0,
          verticalPosition: 0,
        }));
        setHL05Handle(p => ({
          ...p,
          horizontalOffset: 0,
          verticalPosition: 0,
        }));
        setHLModelHandle(p => ({
          ...p,
          horizontalOffset: 0,
          verticalPosition: 0,
        }));
        setBodyFourHandle(p => ({
          ...p,
          horizontalOffset: 0,
          verticalPosition: 0,
        }));
        setBodyThreeHandle(p => ({
          ...p,
          horizontalOffset: 0,
          verticalPosition: 0,
        }));
        setHL01Handle(p => ({
          ...p,
          horizontalOffset: 0,
          verticalPosition: 0,
        }));
      }

      // Reset doorCut when switching to FA_3 or FA_6 variants to ensure visibility and set defaults
      if (presetName.includes("FA_3") || presetName.includes("FA_6")) {
        const height = newPresetData.height || 2200;
        let defaultCuts = 4;
        if (presetName.includes("Drawer")) defaultCuts = 7;
        if (presetName.includes("Bin")) defaultCuts = 5;

        let cutHeight = height;

        // For Panel_FA_6 and Bin_FA_6, default cut height should be inside the frame to show radii
        if (presetName === "Panel_FA_6" || presetName === "Bin_FA_6") {
          cutHeight = height - 120; // fits inside 50mm frame with margin
        }

        setDoorCut(prev => ({
          ...prev,
          visible: true,
          yPosition: height / 2,
          height: cutHeight,
          rotation: 0,
          numberOfCuts: defaultCuts,
        }));
        // Mirror the default into doorConfig so the numberOfCuts prop and the
        // Cut Settings slider start from the preset's default.
        updatePayload.numberOfCuts = defaultCuts;
      }

      if (newPresetData.depth !== undefined) {
        updatePayload.frontDepth = undefined;
        updatePayload.backDepth = undefined;
      } else if (newPresetData.frontDepth !== undefined) {
        updatePayload.depth = undefined;
      }

      if (!("cutYPosition" in newPresetData)) {
        updatePayload.cutYPosition = undefined;
      }
      setDoorConfig(updatePayload);
    }
  };

  const usesMultiDepth =
    doorConfig.frontDepth !== undefined && doorConfig.backDepth !== undefined;
  const hasMidRail =
    doorConfig.name?.includes("FA_4b") || doorConfig.name?.includes("FA_5b");
  const hasHandle = doorConfig.name;

  return (
    <>
      {/* LEFT PANEL - HANDLER CONFIGURATION */}
      {hasHandle && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "280px",
            height: "100%",
            overflowY: "auto",
            p: 2,
            boxSizing: "border-box",
          }}
        >
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              Handler Confiurator
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <FormLabel>Select Handler</FormLabel>
              <Select
                value={doorConfig.selectedHandler || "HL02"}
                size="small"
                onChange={(e: SelectChangeEvent<string>) =>
                  setDoorConfig({
                    selectedHandler: e.target.value as
                      | "HL01"
                      | "HL02"
                      | "HL03"
                      | "HL04"
                      | "HL05"
                      | "HLModel"
                      | "None",
                  })
                }
              >
                <MenuItem value="HL01">HL01</MenuItem>
                <MenuItem value="HL02">HL02</MenuItem>
                <MenuItem value="HL03">HL03</MenuItem>
                <MenuItem value="HL04">HL04</MenuItem>
                <MenuItem value="HL05">HL05</MenuItem>
                <MenuItem value="HLModel">HLModel</MenuItem>
                <MenuItem value="None">None</MenuItem>
              </Select>
            </FormControl>

            {doorConfig.selectedHandler === "HL01" && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  HL01 Settings
                </Typography>
                <CustomSlider
                  label="Position X"
                  value={hl01Handle.horizontalOffset}
                  onChange={(_, v) =>
                    setHL01Handle(p => ({
                      ...p,
                      horizontalOffset: v as number,
                    }))
                  }
                  min={-1000}
                  max={1000}
                />
                <CustomSlider
                  label="Position Y"
                  value={hl01Handle.verticalPosition}
                  onChange={(_, v) =>
                    setHL01Handle(p => ({
                      ...p,
                      verticalPosition: v as number,
                    }))
                  }
                  min={-1000}
                  max={Math.max(1000, doorConfig.height)}
                />
                <CustomSlider
                  label="Rotation"
                  value={hl01Handle.rotation}
                  onChange={(_, v) =>
                    setHL01Handle(p => ({
                      ...p,
                      rotation: v as number,
                    }))
                  }
                  min={-180}
                  max={1000}
                />
                <CustomSlider
                  label="Cut Handler Height"
                  value={hl01Handle.length}
                  onChange={(_, v) =>
                    setHL01Handle(p => ({
                      ...p,
                      length: v as number,
                    }))
                  }
                  min={0}
                  max={5000}
                />
                <CustomSlider
                  label="Capsule Extra Height"
                  value={bodyThreeCapsule.secondCutHeight}
                  onChange={(_, v) =>
                    setBodyThreeCapsule(p => ({
                      ...p,
                      secondCutHeight: v as number,
                    }))
                  }
                  min={0}
                  max={500}
                />
              </>
            )}

            {doorConfig.selectedHandler === "HL02" && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  HL02 Settings
                </Typography>
                <CustomSlider
                  label="Position X"
                  value={bodyThreeHandle.horizontalOffset}
                  onChange={(_, v) =>
                    setBodyThreeHandle(p => ({
                      ...p,
                      horizontalOffset: v as number,
                    }))
                  }
                  min={-1000}
                  max={1000}
                />
                <CustomSlider
                  label="Position Y"
                  value={bodyThreeHandle.verticalPosition}
                  onChange={(_, v) =>
                    setBodyThreeHandle(p => ({
                      ...p,
                      verticalPosition: v as number,
                    }))
                  }
                  min={-1800}
                  max={Math.max(1000, doorConfig.height)}
                />
                <CustomSlider
                  label="Rotation"
                  value={bodyThreeHandle.rotation}
                  onChange={(_, v) =>
                    setBodyThreeHandle(p => ({
                      ...p,
                      rotation: v as number,
                    }))
                  }
                  min={-180}
                  max={1000}
                />

                <CustomSlider
                  label="Cut Handler Height"
                  value={bodyThreeHandle.length}
                  onChange={(_, v) =>
                    setBodyThreeHandle(p => ({
                      ...p,
                      length: v as number,
                    }))
                  }
                  min={0}
                  max={5000}
                />
                <CustomSlider
                  label="Capsule Extra Height"
                  value={bodyThreeCapsule.secondCutHeight}
                  onChange={(_, v) =>
                    setBodyThreeCapsule(p => ({
                      ...p,
                      secondCutHeight: v as number,
                    }))
                  }
                  min={0}
                  max={500}
                />
              </>
            )}

            {doorConfig.selectedHandler === "HL03" && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  HL03 Settings
                </Typography>
                <CustomSlider
                  label="Position X"
                  value={bodyFourHandle.horizontalOffset}
                  onChange={(_, v) =>
                    setBodyFourHandle(p => ({
                      ...p,
                      horizontalOffset: v as number,
                    }))
                  }
                  min={-1000}
                  max={1000}
                />
                <CustomSlider
                  label="Position Y"
                  value={bodyFourHandle.verticalPosition}
                  onChange={(_, v) =>
                    setBodyFourHandle(p => ({
                      ...p,
                      verticalPosition: v as number,
                    }))
                  }
                  min={-1800}
                  max={Math.max(1000, doorConfig.height)}
                />
                <CustomSlider
                  label="Rotation"
                  value={bodyFourHandle.rotation}
                  onChange={(_, v) =>
                    setBodyFourHandle(p => ({
                      ...p,
                      rotation: v as number,
                    }))
                  }
                  min={-180}
                  max={1000}
                />

                <CustomSlider
                  label="Cut Handler Height"
                  value={bodyFourHandle.length}
                  onChange={(_, v) =>
                    setBodyFourHandle(p => ({
                      ...p,
                      length: v as number,
                    }))
                  }
                  min={0}
                  max={5000}
                />
                <CustomSlider
                  label="Capsule Extra Height"
                  value={bodyFourCapsule.secondCutHeight}
                  onChange={(_, v) =>
                    setBodyFourCapsule(p => ({
                      ...p,
                      secondCutHeight: v as number,
                    }))
                  }
                  min={0}
                  max={500}
                />
              </>
            )}

            {doorConfig.selectedHandler === "HL04" && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  HL04 Settings
                </Typography>
                <CustomSlider
                  label="Position X"
                  value={hl04Handle.horizontalOffset}
                  onChange={(_, v) =>
                    setHL04Handle(p => ({
                      ...p,
                      horizontalOffset: v as number,
                    }))
                  }
                  min={-1000}
                  max={1000}
                />
                <CustomSlider
                  label="Position Y"
                  value={hl04Handle.verticalPosition}
                  onChange={(_, v) =>
                    setHL04Handle(p => ({
                      ...p,
                      verticalPosition: v as number,
                    }))
                  }
                  min={-1800}
                  max={Math.max(1000, doorConfig.height)}
                />
                <CustomSlider
                  label="Rotation"
                  value={hl04Handle.rotation}
                  onChange={(_, v) =>
                    setHL04Handle(p => ({
                      ...p,
                      rotation: v as number,
                    }))
                  }
                  min={-180}
                  max={1000}
                />
              </>
            )}

            {doorConfig.selectedHandler === "HL05" && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  HL05 Settings
                </Typography>
                <CustomSlider
                  label="Position X"
                  value={hl05Handle.horizontalOffset}
                  onChange={(_, v) =>
                    setHL05Handle(p => ({
                      ...p,
                      horizontalOffset: v as number,
                    }))
                  }
                  min={-1000}
                  max={1000}
                />
                <CustomSlider
                  label="Position Y"
                  value={hl05Handle.verticalPosition}
                  onChange={(_, v) =>
                    setHL05Handle(p => ({
                      ...p,
                      verticalPosition: v as number,
                    }))
                  }
                  min={-1800}
                  max={Math.max(1000, doorConfig.height)}
                />
                <CustomSlider
                  label="Rotation"
                  value={hl05Handle.rotation}
                  onChange={(_, v) =>
                    setHL05Handle(p => ({
                      ...p,
                      rotation: v as number,
                    }))
                  }
                  min={-180}
                  max={1000}
                />
                <CustomSlider
                  label="Cut Handler Height"
                  value={hl05Handle.length}
                  onChange={(_, v) =>
                    setHL05Handle(p => ({
                      ...p,
                      length: v as number,
                    }))
                  }
                  min={0}
                  max={5000}
                />
              </>
            )}

            {doorConfig.selectedHandler === "HLModel" && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  HLModel Settings
                </Typography>
                <CustomSlider
                  label="Position X"
                  value={hlModelHandle.horizontalOffset}
                  onChange={(_, v) =>
                    setHLModelHandle(p => ({
                      ...p,
                      horizontalOffset: v as number,
                    }))
                  }
                  min={doorConfig.height <= 600 ? -doorConfig.width / 2 : 0}
                  max={doorConfig.width / 2}
                />
                <FormControl fullWidth sx={{ mt: 1, mb: 1 }}>
                  <FormLabel sx={{ fontSize: "0.75rem" }}>
                    Select Handle Model
                  </FormLabel>
                  <Select
                    value={hlModelHandle.url}
                    size="small"
                    onChange={e =>
                      setHLModelHandle(p => ({
                        ...p,
                        url: e.target.value,
                        selectedMesh: "All",
                      }))
                    }
                  >
                    <MenuItem value="/models/handles/door_handler_demo.glb">
                      Door Handler Demo
                    </MenuItem>
                  </Select>
                </FormControl>
                <CustomSlider
                  label="Position Y"
                  value={hlModelHandle.verticalPosition}
                  onChange={(_, v) =>
                    setHLModelHandle(p => ({
                      ...p,
                      verticalPosition: v as number,
                    }))
                  }
                  min={-1000}
                  max={doorConfig.height}
                />

                <CustomSlider
                  label="Rotation Y"
                  value={hlModelHandle.rotationY}
                  onChange={(_, v) =>
                    setHLModelHandle(p => ({
                      ...p,
                      rotationY: v as number,
                    }))
                  }
                  min={-360}
                  max={360}
                />
                <CustomSlider
                  label="Scale"
                  value={hlModelHandle.scale * 100}
                  onChange={(_, v) =>
                    setHLModelHandle(p => ({
                      ...p,
                      scale: (v as number) / 100,
                    }))
                  }
                  min={10}
                  max={500}
                />
                <CustomSlider
                  label="Position Z (Offset)"
                  value={hlModelHandle.zOffset}
                  onChange={(_, v) =>
                    setHLModelHandle(p => ({
                      ...p,
                      zOffset: v as number,
                    }))
                  }
                  min={-50}
                  max={50}
                />
              </>
            )}

            {(doorConfig.name?.includes("FA_3") ||
              doorConfig.name?.includes("FA_6")) && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  Cut Settings
                </Typography>
                <CustomSlider
                  label="Number of Cuts"
                  value={doorConfig.numberOfCuts ?? 4}
                  onChange={(_, v) =>
                    setDoorConfig({ numberOfCuts: v as number })
                  }
                  min={1}
                  max={30}
                />
              </>
            )}
          </Paper>
        </Box>
      )}

      {/* RIGHT PANEL - DOOR CONFIGURATION */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "360px",
          height: "100%",
          overflowY: "auto",
          p: 2,
          boxSizing: "border-box",
        }}
      >
        <Stack spacing={3}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" color="primary">
                Doors Configurator
              </Typography>
              <Tooltip
                title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
              >
                <IconButton onClick={toggleColorMode} color="inherit">
                  {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Tooltip>
            </Box>
            <FormControl fullWidth>
              <FormLabel sx={{ mb: 1 }}>Select Door Type</FormLabel>
              <ModelSelection
                doorConfig={doorConfig}
                onSelect={handlePresetChange}
              />
            </FormControl>
          </Paper>

          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              Door Dimensions
            </Typography>

            <CustomSlider
              label="Width"
              value={doorConfig.width}
              onChange={(_, v) => setDoorConfig({ width: v as number })}
              min={500}
              max={1200}
            />
            <CustomSlider
              label="Height"
              value={doorConfig.height}
              onChange={(_, v) => setDoorConfig({ height: v as number })}
              min={
                doorConfig.cutYPosition ? doorConfig.cutYPosition + 100 : 500
              }
              max={3000}
            />

            {!usesMultiDepth && (
              <CustomSlider
                label="Depth"
                value={doorConfig.depth}
                onChange={(_, v) => setDoorConfig({ depth: v as number })}
                min={18}
                max={30}
              />
            )}
            {usesMultiDepth && (
              <>
                <CustomSlider
                  label="Front Depth"
                  value={doorConfig.frontDepth ?? 18}
                  onChange={(_, v) =>
                    setDoorConfig({ frontDepth: v as number })
                  }
                  min={1}
                  max={30}
                />
                <CustomSlider
                  label="Back Depth"
                  value={doorConfig.backDepth ?? 18}
                  onChange={(_, v) => setDoorConfig({ backDepth: v as number })}
                  min={1}
                  max={30}
                />
                <CustomSlider
                  label="Front Panel Width"
                  value={doorConfig.frontPanelWidth ?? doorConfig.width}
                  onChange={(_, v) =>
                    setDoorConfig({ frontPanelWidth: v as number })
                  }
                  min={0}
                  max={doorConfig.width}
                />
                {hasMidRail && (
                  <CustomSlider
                    label="Mid Rail Position"
                    value={doorConfig.midRailPosition ?? doorConfig.height / 2}
                    onChange={(_, v) =>
                      setDoorConfig({ midRailPosition: v as number })
                    }
                    min={0}
                    max={doorConfig.height}
                  />
                )}
              </>
            )}
          </Paper>

          <Paper elevation={3} sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography variant="h6" color="primary">
                Edge Lines
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={doorConfig.edgeLineEnabled ?? true}
                onChange={(_, v) => {
                  if (v !== null)
                    setDoorConfig({ edgeLineEnabled: v as boolean });
                }}
              >
                <ToggleButton value={true}>On</ToggleButton>
                <ToggleButton value={false}>Off</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ mt: 1, mb: 2 }}>
              <Typography variant="caption" gutterBottom>
                Color
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}
              >
                <input
                  type="color"
                  value={doorConfig.edgeColor ?? "#000000"}
                  onChange={e => setDoorConfig({ edgeColor: e.target.value })}
                  style={{
                    width: 40,
                    height: 32,
                    padding: 2,
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                />
                <Typography variant="body2">
                  {doorConfig.edgeColor ?? "#000000"}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 1 }}>
              <Typography gutterBottom variant="caption">
                Opacity: {((doorConfig.edgeOpacity ?? 1) * 100).toFixed(0)}%
              </Typography>
              <Slider
                size="small"
                value={doorConfig.edgeOpacity ?? 1}
                onChange={(_, v) => setDoorConfig({ edgeOpacity: v as number })}
                min={0}
                max={1}
                step={0.01}
              />
            </Box>

            <Box sx={{ mt: 1 }}>
              <Typography gutterBottom variant="caption">
                Line Width: {(doorConfig.edgeLineWidth ?? 1).toFixed(1)}px
              </Typography>
              <Slider
                size="small"
                value={doorConfig.edgeLineWidth ?? 1}
                onChange={(_, v) =>
                  setDoorConfig({ edgeLineWidth: v as number })
                }
                min={0.5}
                max={5}
                step={0.5}
              />
            </Box>
          </Paper>

          {/* Inner panel — the thin inlay filling the frame opening on the
              framed and arched doors (FA_4a/4b, FA_5a/5b, FA_6, FA_7, FA_7_P,
              FA_8). Leaving it off keeps innerPanelMaterial undefined, which
              is what makes the panel absent rather than merely hidden. */}
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: innerPanelOn ? 2 : 0,
              }}
            >
              <Typography variant="h6" color="primary">
                Inner Panel
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={innerPanelOn}
                onChange={(_, v) => {
                  if (v === null) return;
                  setDoorConfig({
                    innerPanelMaterial: v
                      ? innerPanelIsTexture
                        ? innerPanelTexture
                        : innerPanelColor
                      : undefined,
                  });
                }}
              >
                <ToggleButton value={true}>On</ToggleButton>
                <ToggleButton value={false}>Off</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {innerPanelOn && (
              <>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  fullWidth
                  value={innerPanelIsTexture ? "texture" : "color"}
                  onChange={(_, v) => {
                    if (v === null) return;
                    setDoorConfig({
                      innerPanelMaterial:
                        v === "texture" ? innerPanelTexture : innerPanelColor,
                    });
                  }}
                  sx={{ mb: 2 }}
                >
                  <ToggleButton value="color">Color</ToggleButton>
                  <ToggleButton value="texture">Texture</ToggleButton>
                </ToggleButtonGroup>

                {innerPanelIsTexture ? (
                  <TextField
                    size="small"
                    fullWidth
                    label="Texture URL"
                    placeholder="https://… or /texture.jpg"
                    value={innerPanelTexture}
                    onChange={e =>
                      setDoorConfig({ innerPanelMaterial: e.target.value })
                    }
                  />
                ) : (
                  <Box>
                    <Typography variant="caption" gutterBottom>
                      Color
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mt: 0.5,
                      }}
                    >
                      <input
                        type="color"
                        value={innerPanelColor}
                        onChange={e =>
                          setDoorConfig({ innerPanelMaterial: e.target.value })
                        }
                        style={{
                          width: 40,
                          height: 32,
                          padding: 2,
                          border: "1px solid #ccc",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      />
                      <Typography variant="body2">{innerPanelColor}</Typography>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Paper>

          <Paper elevation={3} sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6" color="primary">
                Shadow
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={doorConfig.shadow ?? true}
                onChange={(_, v) => {
                  if (v !== null) setDoorConfig({ shadow: v as boolean });
                }}
              >
                <ToggleButton value={true}>On</ToggleButton>
                <ToggleButton value={false}>Off</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Paper>
        </Stack>
      </Box>
    </>
  );
};
