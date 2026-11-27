import { s, withRows } from "../lib/pixel/helpers";

/**
 * The candle is the progress bar of every room. A room starts with its candles
 * unlit, and each thing the player learns lights one.
 *
 * Both sprites are 9x16 with the same wax and dish, so swapping unlit for lit
 * never shifts anything on screen. The lit wax top is warm (`y`) so the two read
 * apart even at 1x.
 */

const CANDLE_UNLIT_ROWS = [
  ".........",
  ".........",
  ".........",
  ".........",
  ".........",
  ".........",
  ".........",
  "....D....",
  ".DwwwwxD.",
  ".DWwwwxD.",
  ".DWwwwxD.",
  ".DWwwwxD.",
  ".DWwwwxD.",
  ".DWwwxxD.",
  "OgGGyGGgO",
  ".OOOOOOO.",
];

const CANDLE_LIT_ROWS = withRows(CANDLE_UNLIT_ROWS, {
  0: "....2....",
  1: "...232...",
  2: "...343...",
  3: "..23432..",
  4: "..34543..",
  5: "..34543..",
  6: "...454...",
  8: ".DyyyyyD.",
});

// Flicker: the flame leans right, shrinks, then leans left. Only rows 0 to 2 move.
const LEAN_RIGHT = withRows(CANDLE_LIT_ROWS, { 0: ".....2...", 1: "....232..", 2: "...2343.." });
const SHORT = withRows(CANDLE_LIT_ROWS, { 0: ".........", 1: "....2....", 2: "...232..." });
const LEAN_LEFT = withRows(CANDLE_LIT_ROWS, { 0: "...2.....", 1: "..232....", 2: "..3432..." });

export const candleUnlit = s(
  "candle-unlit",
  "Candle, unlit",
  ["candle", "progress", "room"],
  "A candle waiting to be lit. One per lesson beat in a room.",
  CANDLE_UNLIT_ROWS,
);

export const candleLit = s(
  "candle-lit",
  "Candle, lit",
  ["candle", "progress", "room"],
  "A lit candle. Loop the flicker; reduced motion shows the still. Pair with a soft CSS glow behind it.",
  CANDLE_LIT_ROWS,
  { frameMs: 150, frames: [CANDLE_LIT_ROWS, LEAN_RIGHT, CANDLE_LIT_ROWS, SHORT, LEAN_LEFT, CANDLE_LIT_ROWS] },
);

export const CANDLE_SPRITES = [candleUnlit, candleLit];
