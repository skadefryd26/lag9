import { createTheme, type MantineColorsTuple } from "@mantine/core";

// Ekte rettssal: mørkt tre og gull.
const gull: MantineColorsTuple = [
  "#fdf8e6", "#f7edc4", "#efdd93", "#e6cc5f", "#dfbe39", "#d9b421", "#c9a227", "#a8861c", "#876b14", "#65500c",
];
const tre: MantineColorsTuple = [
  "#f5ede6", "#e2d2c4", "#c9ad97", "#ae876a", "#976a4a", "#7d5334", "#633f26", "#4a2e1b", "#3a2314", "#26160c",
];

export const theme = createTheme({
  primaryColor: "gull",
  colors: { gull, tre },
  fontFamily: "Georgia, 'Times New Roman', serif",
  headings: { fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: "700" },
  defaultRadius: "sm",
});
