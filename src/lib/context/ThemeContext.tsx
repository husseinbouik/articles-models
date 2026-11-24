import React, { createContext, useMemo, useState, useContext } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

type ColorMode = "light" | "dark";

interface ColorModeContextType {
  toggleColorMode: () => void;
  mode: ColorMode;
}

const ColorModeContext = createContext<ColorModeContextType>({
  toggleColorMode: () => {},
  mode: "light",
});

export const useColorMode = () => useContext(ColorModeContext);

export const ColorModeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [mode, setMode] = useState<ColorMode>(() => {
    const savedMode = localStorage.getItem("themeMode");
    return (savedMode as ColorMode) || "dark";
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode(prevMode => {
          const newMode = prevMode === "light" ? "dark" : "light";
          localStorage.setItem("themeMode", newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette:
          mode === "dark"
            ? {
                // Deep-wood studio palette (portfolio family: Zoning Studio /
                // Article Designer) — warm charcoal-browns, amber accent.
                mode,
                primary: { main: "#e0a458", dark: "#c07f35", light: "#f0bc7d", contrastText: "#241708" },
                secondary: { main: "#b8a88f", contrastText: "#1c150e" },
                background: { default: "#14100c", paper: "#211a14" },
                text: { primary: "#f2e9dc", secondary: "#b8a88f" },
                divider: "#3a2d20",
              }
            : {
                // Warm paper + wood light variant.
                mode,
                primary: { main: "#9c6b34", dark: "#86602c", light: "#c09a68", contrastText: "#ffffff" },
                secondary: { main: "#8a755c", contrastText: "#ffffff" },
                background: { default: "#f3ecdf", paper: "#faf6ee" },
                text: { primary: "#2b2118", secondary: "#8a755c" },
                divider: "#ddd0ba",
              },
        shape: { borderRadius: 10 },
        typography: {
          h6: { fontWeight: 700, letterSpacing: "0.01em" },
          subtitle2: { fontWeight: 600 },
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                border: "1px solid",
                borderColor: mode === "dark" ? "#3a2d20" : "#ddd0ba",
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
