// ThemeContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface Theme {
  kioskPrimary: string;
  kioskPrimaryDark: string;
  kioskPrimaryLight: string;
  kioskPrimaryText: string;
  kioskSecondary: string;
  kioskSecondaryDark: string;
  kioskSecondaryLight: string;
  kioskAccent: string;
  kioskAccentDark: string;
  kioskAccentLight: string;
  kioskBackground: string;
  kioskSurface: string;
  kioskBorder: string;
  kioskTextMuted: string;
}

const defaultTheme: Theme = {
  kioskPrimary: "#121660",
  kioskPrimaryDark: "#0a0d3b",
  kioskPrimaryLight: "#4749ce",
  kioskPrimaryText: "#121660",
  kioskSecondary: "#47ce65",
  kioskSecondaryDark: "#339e47",
  kioskSecondaryLight: "#6fe389",
  kioskAccent: "#ffcc00",
  kioskAccentDark: "#e6b800",
  kioskAccentLight: "#ffd633",
  kioskBackground: "#ffffff",
  kioskSurface: "#f8f8f8",
  kioskBorder: "#e0e0e0",
  kioskTextMuted: "rgba(18, 22, 96, 0.7)",
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
