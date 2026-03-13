/**
 * App theme: light brown and white (bright).
 * Single fixed theme (no dark/light mode toggle).
 */
export const theme = {
  /** Main background (warm off-white) */
  background: "#faf7f2",
  /** Cards, surfaces, inputs (white) */
  surface: "#ffffff",
  /** Borders, dividers (light brown) */
  border: "#e8dcc8",
  /** Primary accent – buttons, links, icons (dark gold brown) */
  primary: "#7d5a0f",
  /** Primary pressed / darker */
  primaryDark: "#6b4a0a",
  /** Primary text (dark brown) */
  text: "#2c1810",
  /** Secondary/muted text (medium brown) */
  textMuted: "#5c4033",
  /** Placeholder text */
  placeholder: "#8b7355",
  /** Text on primary buttons (white) */
  primaryContrast: "#ffffff",
  /** Destructive (e.g. logout text) */
  destructive: "#c44c38",
  /** Loading spinner, active states */
  accent: "#7d5a0f",
} as const;
