import { s, shade } from "../lib/pixel/helpers";

/**
 * The ghost that haunts each room, in three moods. Its mood is feedback:
 * restless when the player arrives, calm while they learn, freed when they
 * answer the room's question.
 *
 * All three are 22x20 so the app can swap moods in place. Generated as rows,
 * then kept as plain text like every other sprite.
 */

const GHOST_RESTLESS_ROWS = [
  "........IIIIII........",
  "......IIxxxxxxII......",
  ".....IwwxxxxxxxXI.....",
  ".....IwwwxxxxxxXI.....",
  "....IwwwxxxxxxxxXI....",
  ".I..IwKKxxxxxxKKXI..I.",
  "II.IwxxxKxxxxKxxxXI.II",
  "II.IwxxRRxxxxRRxxXI.II",
  "II.IwxxRRxxxxRRxxXI.II",
  ".IIxxxxxxxxxxxxxxxxII.",
  "..IxxxxxxKxKxKxxxxXI..",
  "...IxxxxKxKxKxxxxXI...",
  "...IxxxxxxxxxxxxxXI...",
  "...IxxXxxxxxxxxXxXI...",
  "...IxxXxxxxxxxxXxXI...",
  "...IxxXxxxxxxxxXxXI...",
  "...IxxXxxxXXxxxXxXI...",
  "...IxXIXxxIIxxXIXXI...",
  "...IXI.IXI..IXI.IXI...",
  "....I...II..II...I....",
];

const GHOST_CALM_ROWS = [
  "........EEEEEE........",
  "......EEQQQQQQEE......",
  ".....EWWQQQQQQQqE.....",
  ".....EWWWQQQQQQqE.....",
  "....EWWWQQQQQQQQqE....",
  "....EWQQQQQQQQQQqE....",
  "...EWQQWKQQQQWKQQqE...",
  "...EWQQKKQQQQKKQQqE...",
  "...EWQQKKQQQQKKQQqE...",
  "...EWFFQQKQQKQQFFqE...",
  "...EQQQQQQKKQQQQQqE...",
  "...EQQQQQQQQQQQQQqE...",
  "...EQQQQQQQQQQQQQqE...",
  "...EQQqQQQQQQQQqQqE...",
  "...EQQqQQQQQQQQqQqE...",
  "...EQQqQQQQQQQQqQqE...",
  "...EQQqQQQqqQQQqQqE...",
  "...EQqEqQQEEQQqEqqE...",
  "...EqE.EqE..EqE.EqE...",
  "....E...EE..EE...E....",
];

const GHOST_FREED_ROWS = [
  "........TTTTTT........",
  "......TTWWWWWWTT......",
  ".....TWWWWWWWWWQT.....",
  ".....TWWWWWWWWWQT.....",
  "....TWWWWWWWWWWWQT....",
  ".T..TWWWWWWWWWWWQT..T.",
  "TT.TWWWWWWWWWWWWWQT.TT",
  "TT.TWWWKWWWWWWKWWQT.TT",
  "TT.TWWKWKWWWWKWKWQT.TT",
  ".TTWWWWWWWWWWWWWWWWTT.",
  "..TWWFFWWKKKKWWFFWQT..",
  "...TWWWWWKFFKWWWWQT...",
  "...TWWWWWWWWWWWWWQT...",
  "...TWWQWWWWWWWWQWQT...",
  "...TWWQWWWWWWWWQWQT...",
  "...TWWQWWWWWWWWQWQT...",
  "...TWWQWWWQQWWWQWQT...",
  "...TWQTQWWTTWWQTQQT...",
  "...TQT.TQT..TQT.TQT...",
  "....T...TT..TT...T....",
];

/** The release glow: outline and shadow flash brighter, twice. */
const FREED_GLOW = shade(GHOST_FREED_ROWS, { T: "W", Q: "T" });

export const ghostRestless = s(
  "ghost-restless",
  "Restless ghost",
  ["ghost", "mood", "room"],
  "The ghost when the player walks in. Raised arms, red eyes. Use it again briefly after a wrong answer.",
  GHOST_RESTLESS_ROWS,
);

export const ghostCalm = s(
  "ghost-calm",
  "Calm ghost",
  ["ghost", "mood", "room"],
  "The ghost once the player starts learning. Lavender, smiling.",
  GHOST_CALM_ROWS,
);

export const ghostFreed = s(
  "ghost-freed",
  "Freed ghost",
  ["ghost", "mood", "room"],
  "The ghost after the room's question is answered. Play once, then float it up and fade it out with CSS.",
  GHOST_FREED_ROWS,
  { frameMs: 110, frames: [GHOST_FREED_ROWS, FREED_GLOW, GHOST_FREED_ROWS, FREED_GLOW, GHOST_FREED_ROWS] },
);

export const GHOST_SPRITES = [ghostRestless, ghostCalm, ghostFreed];
