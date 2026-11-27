/**
 * The haunted palette, new for Euphoria Haunted House (Kiroween 2026).
 *
 * It uses the SAME character keys as Euphoria's palette (palette.ts), with every
 * colour moved into a haunted night. That means any sprite drawn for Euphoria
 * renders in haunted colours with no edits, and new sprites can be drawn with the
 * keys the team already knows.
 *
 * The meaning of each family is kept, only the costume changes:
 *   orchid (brand)   -> spectral violet
 *   gold (money, XP) -> candlelight
 *   green (good)     -> ectoplasm
 *   red (bad)        -> blood
 *   neutral (paper)  -> bone and fog
 *   fire digits 1-5  -> jack-o'-lantern
 *   teal             -> ghost glow
 *   pink             -> witch magenta
 *   blue             -> moonlight
 *
 * Ramp rule carried over from Euphoria: lowercase is the darker step, uppercase
 * the base, and the third letter the light step.
 */

/** The page background every sprite is drawn against. */
export const HAUNTED_CANVAS = "#0B0714";
/** Cards and panels that sit on the canvas. */
export const HAUNTED_SURFACE = "#151024";

export const HAUNTED_PIXEL_PALETTE: Record<string, string> = {
  // Ink, for INTERIOR detail only (pupils, a coin's $). Near-black vanishes on
  // the canvas, so never use it for an outer outline.
  K: "#120C1C",
  k: "#241A33",

  // Deep steps: the outline tone for each family on the dark canvas. Each one
  // has at least the contrast against HAUNTED_CANVAS that Euphoria's outline
  // has against its own canvas, so silhouettes read just as well.
  O: "#7E4D14", // deep candle
  E: "#5C2496", // deep spectral violet
  D: "#4C4760", // deep fog
  I: "#951C4C", // deep blood rose

  // Spectral violet, the brand ramp.
  p: "#6A2BB0",
  P: "#9256E0",
  q: "#B98AF5",
  Q: "#DCC8FF",

  // Candlelight: money, coins, streaks, XP.
  g: "#A8641A",
  G: "#E89A2E",
  y: "#FFD47A",

  // Ectoplasm: the positive accent.
  n: "#1F7A3A",
  N: "#5BE37D",
  m: "#B4F7A1",

  // Blood: the negative accent.
  r: "#8E1C24",
  R: "#D63A3A",
  s: "#F08A80",

  // Bone and fog: paper, text, muted UI.
  X: "#5E5870",
  x: "#9C95AE",
  w: "#E6E1D3",
  W: "#FFFBEF",

  // Jack-o'-lantern, a five-step heat ramp written as digits, brightest last.
  "1": "#5E1F0B",
  "2": "#A9380F",
  "3": "#E8661C",
  "4": "#FF9A3C",
  "5": "#FFE3A0",

  // Ghost glow, witch magenta, moonlight.
  t: "#1B6E78",
  T: "#6FE3E8",
  f: "#8C1F66",
  F: "#E0559F",
  b: "#26407A",
  B: "#8FB8F0",
};
