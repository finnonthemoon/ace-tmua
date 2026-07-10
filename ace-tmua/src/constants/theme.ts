import { Platform } from "react-native";

const lightTheme = {
  text: "#2D241F",
  background: "#FFF7E6",
  backgroundElement: "#FFFFFF",
  backgroundSelected: "#FFF0D3",
  textSecondary: "#7D6D62",
};

const darkTheme = {
  text: "#FFFFFF",
  background: "#1D1815",
  backgroundElement: "#2D241F",
  backgroundSelected: "#4A382E",
  textSecondary: "#D8CFC4",
};

export const Colors = {
  light: lightTheme,
  dark: darkTheme,

  primary: "#FF6F1A",
  warmOrange: "#FFB347",
  cream: "#FFF7E6",
  surface: "#FFFFFF",
  ink: "#2D241F",
  muted: "#7D6D62",
  line: "#F1DFBD",

  topics: [
    {
      main: "#FF6F1A",
      gradStart: "#FF7C2B",
      gradEnd: "#FF6F1A",
    },
    {
      main: "#F3A82C",
      gradStart: "#FFC85C",
      gradEnd: "#F3A82C",
    },
    {
      main: "#9B7BE6",
      gradStart: "#AD8EFF",
      gradEnd: "#9B7BE6",
    },
    {
      main: "#62ACE4",
      gradStart: "#79C9F4",
      gradEnd: "#62ACE4",
    },
    {
      main: "#55C59A",
      gradStart: "#72D7B0",
      gradEnd: "#55C59A",
    },
    {
      main: "#ED7D92",
      gradStart: "#F393A5",
      gradEnd: "#ED7D92",
    },
    {
      main: "#4F91D4",
      gradStart: "#6FB7EF",
      gradEnd: "#4F91D4",
    },
    {
      main: "#E9B738",
      gradStart: "#FFDC71",
      gradEnd: "#E9B738",
    },
  ] as const,
} as const;

export type ThemeColor = keyof typeof lightTheme & keyof typeof darkTheme;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui",
    serif: "Georgia",
    rounded: "system-ui",
    mono: "monospace",
  },
})!;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  lg: 24,
  md: 16,
  sm: 10,
} as const;

export const Shadow = {
  card: {
    shadowColor: "#6F4619",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 6,
  },

  streak: {
    shadowColor: "#FF6F1A",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const BottomTabInset =
  Platform.select({
    ios: 50,
    android: 80,
  }) ?? 0;

export const MaxContentWidth = 800;
