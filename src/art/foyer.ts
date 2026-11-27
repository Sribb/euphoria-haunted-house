import { s, shade } from "../lib/pixel/helpers";

/**
 * Room 1, The Foyer (lesson: Introduction to Investing). An 80x56 moonlit
 * entrance hall: two arched windows, a doorway for the ghost, two side tables
 * for candles and an unlit chandelier. Generated as rows, then kept as plain
 * text like every other sprite.
 *
 * Overlay sprites go at FOYER_SPOTS, in scene pixels (multiply by the render
 * scale). Lighting order: left candle, right candle, then the chandelier when
 * the ghost is freed.
 */

const FOYER_ROWS = [
  "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
  "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKxDKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
  "kGOOOOOOOOOOOOOOOOOGkkKkkkkkkKkkkkkkKkkxDkkKkkkkkkKkkkkkkKkkGOOOOOOOOOOOOOOOOOGk",
  "kKpPpkkkKkkkkkkKpPpkkkKkkkkkkKkkkkkkKkkxDkkKkkkkkkKkkkkkkKkkkpPpKkkkkkkKkkkpPpKk",
  "kKpPpkkkKDDDkkkKpPpkkkKkkkkkkKkkkwkkwkkxDkkwkkwkkkKkkkkkkKkkkpPpKkkkDDDKkkkpPpKk",
  "kKpPpkkDDbDbDDkKpPpkkkKkkkkkkKkkkGkkGkkxDkkGkkGkkkKkkkkkkKkkkpPpKkDDbDbDDkkpPpKk",
  "kKpPpkBBBBDbbbDKpPpkkkKkkkkkkKkkkgkkgGGGGGGgkkgkkkKkkkkkkKkkkpPpKDbbbDbbbDkpPpKk",
  "kKpPpkBWWBDbbbDKpPpkkkKkkkkkkKkkkggggggggggggggkkkKkkkkkkKkkkpPpKDbWbDbbbDkpPpKk",
  "kKpPpDWxWwDbbbbDpPpkkkKkkkkkkKkkkkxkKkOOOOkKkxkkkkKkkkkkkKkkkpPpDbbbbDbbWbDpPpKk",
  "kKpPpDWWWwDbbbbDpPpkkkKkkkkkkKkkkkxkKkkggkkKkxkkkkKkkkkkkKkkkpPpDbbbbDbbbbDpPpKk",
  "kKpPpDBWWBDbbbbDpPpkkkKkkkkkkKkkkkkkKkkkkkkKkxkkkkKkkkkkkKkkkpPpDbbbbDbbbbDpPpKk",
  "kKpPpDbbbbDbbbbDpPpkkkKkkkkkkKkkkkkkKkyGGGkKkkkkkkKkkkkkkKkkkpPpDbWbbDbbbKDpPpKk",
  "kKpPpDbbbbDbbbbDpPpkkkKkkkkkkKkkkkkkKkGGGGkKkkkkkkKkkkkkkKkkkpPpDbbbbDbbKbDpPpKk",
  "kKpPpDbbbbDbbbbDpPpkkkKkkkkkkKkkkkkOOOggggOOOkkkkkKkkkkkkKkkkpPpDbbbbDbKbbDpPpKk",
  "kKpPpDDDDDDDDDDDpPpkkkKkkkkkkKkkkkOOGGKKKKggOOkkkkKkkkkkkKkkkpPpDDKDDDKDKDDpPpKk",
  "kKpPpDbbbbDbbbbDpPpkkkKkkkkkkKkkkOGGKKKKKKKKggOkkkKkkkkkkKkkkpPpDbKbbKbbbKDpPpKk",
  "kKpPpDbbbbDbbbbDpPpkkkKkkkkkkKkkOOGKKKKKKKKKKgOOkkKkkkkkkKkkkpPpDbbKKDbbbbDpPpKk",
  "kKpPpDbbbbDbbbbDpPpkkkKkkkkkkKkkOGKKKKKKKKKKKKgOkkKkkkkkkKkkkpPpDbbKbDbbbWDpPpKk",
  "kKpPpDbbbbDbbbbDpPpkkkKkkkkkkKkkOGKKKKKKKKKKKKgOkkKkkkkkkKkkkpPpDbbKbDbbbbDpPpKk",
  "kKpPpDbbbbDbbbbDpPpkkkKkkkkkkKkOGKKKKKKKKKKKKKKgOkKkkkkkkKkkkpPpDbKbbDbWbbDpPpKk",
  "kKpPpDbbbbDbbbbDpPpkkkKkkkkkkKkOGKKKKKKKKKKKKKKgOkKkkkkkkKkkkpPpDbKbbDbbbbDpPpKk",
  "kKpPpDbbbbDbbbbDpEpkkkKkkkkkkKkOGKKKKKKKKKKKKKKgOkKkkkkkkKkkkpEpDKbbbDbbbbDpPpKk",
  "kKpEpDbbbbbbbbbDpkpkkkKkkkkkkKkOGKKKKKKKKKKKKKKgOkKkkkkkkKkkkpkpDbbbbbbbbbDpEpKk",
  "kKpkpXXXXXXXXXXXEkpkkkKkkkkkkKkOGKKKKKKKKKKKKKKgOkKkkkkkkKkkkpkEXXXXXXXXXXXpkpKk",
  "XXpXEXXXXXXXXXXXXXpXXXXXXXXXXXXOGKKKKKKKKKKKKKKgOXXXXXXXXXXXXpXXXXXXXXXXXXXEXpXX",
  "DDEDDDDDDDDDDDDDDDEDDDDDDDDDDDDOGKKKKKKKKKKKKKKgODDDDDDDDDDDDEDDDDDDDDDDDDDDDEDD",
  "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKOGKKKKKKKKKKKKKKgOKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
  "KDDDDDDDDKDDDDDDDDKKDDDDDDDDDKKOGKKKKKKKKKKKKKKgOKKDDDDDDDDDKKDDDDDDDDKDDDDDDDDK",
  "KDKKKKKKDKDKKKKKKDKGGGGGGGGGGGKOGKKKKKKKKKKKKKKgOKGGGGGGGGGGGKDKKKKKKDKDKKKKKKDK",
  "KDKKKKKKDKDKKKKKKDKgggggygggggKOGKKKKKKKKKKKKKKgOKgggggygggggKDKKKKKKDKDKKKKKKDK",
  "KDKKKKKKDKDKKKKKKDKKOOOOOOOOOKKOGKKKKKKKKKKKKKKgOKKOOOOOOOOOKKDKKKKKKDKDKKKKKKDK",
  "KDKKKKKKDKDKKKKKKDKKOKKKKKKKOKKOGKKKKKKKKKKKKKKgOKKOKKKKKKKOKKDKKKKKKDKDKKKKKKDK",
  "KDDDDDDDDKDDDDDDDDKKODDDDDDDOKKOGKKKKKKKKKKKKKKgOKKODDDDDDDOKKDDDDDDDDKDDDDDDDDK",
  "KKKKKKKKKKKKKKKKKKKKOKKKKKKKOKKOGKKKKKKKKKKKKKKgOKKOKKKKKKKOKKKKKKKKKKKKKKKKKKKK",
  "XXXXXXXXXXXXXXXXXXXXOXXXXXXXOXXOGKKKKKKKKKKKKKKgOXXOXXXXXXXOXXXXXXXXXXXXXXXXXXXX",
  "DDDDDDDDDDDDDDDDDDDDODDDDDDDODXXXXXXXXXXXXXXXXXXXXDODDDDDDDODDDDDDDDDDDDDDDDDDDD",
  "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKGrIrrrrrrrrIrGKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
  "kkkkkkkkkkkkKkkkkkkkkkkkkkkkkkkkGrIrrrrrrrrrrIrGkkkkKkkkkkkkkkkkkkkkkkkkKkkkkkkk",
  "kkkkkkkkbbbbKKbbbbbkkkkkkkkkkkkkGrIrrrrrrrrrrIrGkkkkKkkkkkkkkkkkkkkkkkkkKkkkkkkk",
  "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKGrIrrrrrRRrrrrrIrGKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
  "kkKkkkkkkbbbbbKbbbbbbkKkkkkkkkkGrIrrrrRRRRrrrrIrGkkkkkkkkkkkkkKkkkkkkkkkkkkkkkkk",
  "kkKkkkkkkkbbbbbKbbbbbbKkkkkkkkGrIrrrrrrRRrrrrrrIrGkkkkkkkkkkkkKkkkkkkkkkkkkkkkkk",
  "kkKkkkkkkkbbbbbbKbbbbbKkkkkkkkGrIrrrrrrrrrrrrrrIrGkkkkkkkkkkkkKkkkkkkkkkkkkkkkkk",
  "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKGrIrrrrrrrrrrrrrrrrIrGKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
  "kkkkkkkkkkkkbbbbbKbbbbbbkkkkkGrIrrrrrrrrrrrrrrrrIrGkkkkkkKkkkkkkkkkkkkkkkkkkkKkk",
  "kkkkkkkkkkkkbbbbbKKbbbbbbkkkGrIrrrrrrrrRRrrrrrrrrIrGkkkkkKkkkkkkkkkkkkkkkkkkkKkk",
  "kkkkkkkkkkkkkbbbbKbKbbbbbbkkGrIrrrrrrrRRRRrrrrrrrIrGkkkkkKkkkkkkkkkkkkkkkkkkkKkk",
  "kkkkkkkkkkkkkbbbbKbKbbbbbbbGrIrrrrrrrrrRRrrrrrrrrrIrGkkkkKkkkkkkkkkkkkkkkkkkkKkk",
  "KKKKKKKKKKKKKKKKKKKKKKKKKKKGrIrrrrrrrrrrrrrrrrrrrrIrGKKKKKKKKKKKKKKKKKKKKKKKKKKK",
  "kkkkkkkKkkkkkkkbbbbbbKbbbbGrIrrrrrrrrrrrrrrrrrrrrrrIrGkkkkkkkkkkkkkKkkkkkkkkkkkk",
  "kkkkkkkKkkkkkkkbbbbbbbKbbbGrIrrrrrrrrrrrrrrrrrrrrrrIrGkkkkkkkkkkkkkKkkkkkkkkkkkk",
  "kkkkkkkKkkkkkkkkbbbbbbbKbGrIrrrrrrrrrrrRRrrrrrrrrrrrIrGkkkkkkkkkkkkKkkkkkkkkkkkk",
  "kkkkkkkKkkkkkkkkkkkkkkkkkGrIrrrrrrrrrrRRRRrrrrrrrrrrIrGkkkkkkkkkkkkKkkkkkkkkkkkk",
  "kkkkkkkKkkkkkkkkkkkkkkkkGrIrrrrrrrrrrrrRRrrrrrrrrrrrrIrGkkkkkkkkkkkKkkkkkkkkkkkk",
];

const CHANDELIER_FLAMES_ROWS = [
  "3..3......3..3",
  "5..5......5..5",
];

export const foyerScene = s(
  "foyer-scene",
  "The Foyer",
  ["room", "scene", "foyer"],
  "Room 1 background, 80x56. Put the ghost, candles and chandelier flames at FOYER_SPOTS.",
  FOYER_ROWS,
);

export const chandelierFlames = s(
  "foyer-chandelier-flames",
  "Foyer chandelier flames",
  ["room", "foyer", "candle", "progress"],
  "Four small flames for the Foyer chandelier. Show them when the ghost is freed.",
  CHANDELIER_FLAMES_ROWS,
  {
    frameMs: 180,
    frames: [
      CHANDELIER_FLAMES_ROWS,
      shade(CHANDELIER_FLAMES_ROWS, { "3": "4" }),
      CHANDELIER_FLAMES_ROWS,
      shade(CHANDELIER_FLAMES_ROWS, { "3": "2" }),
    ],
  },
);

/** Where overlay sprites go, as the top-left corner in scene pixels. */
export const FOYER_SPOTS = {
  ghost: { x: 29, y: 17 },
  candles: [
    { x: 20, y: 14 },
    { x: 51, y: 14 },
  ],
  chandelierFlames: { x: 33, y: 4 },
} as const;

export const FOYER_SPRITES = [foyerScene, chandelierFlames];
