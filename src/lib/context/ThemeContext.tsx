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
    return (savedMode as ColorMode) || "light";
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
        palette: {
          mode,
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
