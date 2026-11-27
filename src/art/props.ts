import { s } from "../lib/pixel/helpers";

/**
 * Small art for the 3D Foyer: the two portraits, the clock face, the door's ward, a candle flame sized
 * for 3D candles, and the wisp that marks a clue you have not found yet.
 * Generated as rows, then kept as plain text like every other sprite.
 */

export const portraitOwn = s("portrait-own", "Portrait: Own", ["foyer", "clue"], "A pie with one slice pulled out. Owning a piece of a business.", [
  "kkkkkkkkkkkkkkkk",
  "kkkkkkkkkkkkkkkk",
  "kkkkkkkkkkkkkkkk",
  "kkkkkkkkkkkkkkkk",
  "kkkkkkkkkkkkkkkk",
  "kkkkkEEEEEEkkkkk",
  "kkkkEPPPPPPEkkOk",
  "kkkEPPPPPPPPyyOk",
  "kkEPPPPPPPPGGyOk",
  "kkEPPPPPPGGGGGOk",
  "kkEPPPPPGGGGGGOk",
  "kkEPPPPPPPGGGGOk",
  "kkEPPPPPPPppGOkk",
  "kkkEPPPPPpppEkkk",
  "kkkkEPPPpppEkkkk",
  "kkkkkEEEEEEkkkkk",
  "kkkkkkkkkkkkkkkk",
  "kkkkkkkkkkkkkkkk",
  "kkkkkkkkkkkkkkkk",
  "kkkkkkkkkkkkkkkk",
]);

export const portraitLend = s("portrait-lend", "Portrait: Lend", ["foyer", "clue"], "A sealed IOU scroll. Lending money for interest.", [
  "kkkkkkkkkkkkkkkk",
  "kkkkkkkkkkkkkkkk",
  "kkXXXXXXXXXXXXkk",
  "kXwwwwwwwwwwwwXk",
  "kkXXXXXXXXXXXXkk",
  "kkkwwwwwwwwwwkkk",
  "kkkwxxxxxxxxwkkk",
  "kkkwwwwwwwwwwkkk",
  "kkkwxxxxxxwwwkkk",
  "kkkwwwwwwwwwwkkk",
  "kkkwxxxxxxxxwkkk",
  "kkkwwwwwwwwwwkkk",
  "kkkwxxxxwwwwwkkk",
  "kkkwwwwwwwrRrkkk",
  "kkkwwwwwwrRRRrkk",
  "kkXXXXXXXXrRrXkk",
  "kXwwwwwwwwwwwwXk",
  "kkXXXXXXXXXXXXkk",
  "kkkkkkkkkkkkkkkk",
  "kkkkkkkkkkkkkkkk",
]);

export const clockFace = s("clock-face", "Clock face", ["foyer", "clue"], "The grandfather clock, stopped just before midnight.", [
  "......OO......",
  "...OOOGGOOO...",
  "..OOxxwwxxOO..",
  ".OOxwwKwwwxOO.",
  ".OxwwwKwwwwxO.",
  ".OxwwwKwwwwxO.",
  "OGwwwwKwwwwwGO",
  "OGwwwwrKwwwwGO",
  ".OxwwwwwKwwxO.",
  ".OxwwwwwwwwxO.",
  ".OOxwwwwwwxOO.",
  "..OOxxwwxxOO..",
  "...OOOGGOOO...",
  "......OO......",
]);

export const doorSeal = s("door-seal", "Door ward", ["foyer", "door"], "The glowing ward that seals the doorway until the ghost is freed.", [
  "............................",
  "x..........................x",
  ".X........................X.",
  "..x......................x..",
  "...X....................X...",
  "............................",
  "....x.....RRRRRRRR.....x....",
  ".....X..RR.....F..RR..X.....",
  "......xR.F.....F....Rx......",
  "......RX.F..ffff....XR......",
  ".....R..x.ff....ff.x..R.....",
  "....RR...f........f..FRR....",
  "....R...fX........Xf.F.R....",
  "....R..f..x......x..f..R....",
  "...R...f...X....X...f...R...",
  "...R.F......x..x........R...",
  "...R.Ff.....sXXs.....f..R...",
  "...R..f.....ssss.....f..R...",
  "...R..f.....ssxs.....fF.R...",
  "...R..f.....sXXs.....fF.R...",
  "...R........x..x........R...",
  "...R...f...X....X...f...R...",
  "....R.Ff..x......x..f..R....",
  "....R.F.f..........f...R....",
  "....RR...X........X...RR....",
  ".....R..x.ff....ffFx..R.....",
  "......RX....Ffff..F.XR......",
  "......xR....F.......Rx......",
  ".....X..RR........RR..X.....",
  "..........RRRRRRRR..........",
  "....x..................x....",
  "...X....................X...",
  "..x......................x..",
  ".X........................X.",
  "x..........................x",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
]);

const FLAME = [
  [
    ".....",
    "..2..",
    "..3..",
    ".232.",
    ".343.",
    ".454.",
    "..4..",
  ],
  [
    "...2.",
    "..3..",
    ".23..",
    ".232.",
    ".343.",
    ".454.",
    "..4..",
  ],
  [
    ".....",
    ".....",
    "..2..",
    ".232.",
    ".343.",
    ".454.",
    "..4..",
  ],
  [
    ".2...",
    "..3..",
    "..32.",
    ".232.",
    ".343.",
    ".454.",
    "..4..",
  ],
];
export const smallFlame = s("small-flame", "Small flame", ["candle"], "A candle flame for 3D candles. Loop it.", FLAME[0], { frameMs: 140, frames: FLAME });

const WISP_FRAMES = [
  [
    "..T..",
    ".TWT.",
    "TWWWT",
    ".TWT.",
    "..T..",
  ],
  [
    ".....",
    "..T..",
    ".TWT.",
    "..T..",
    ".....",
  ],
  [
    ".....",
    ".....",
    "..W..",
    ".....",
    ".....",
  ],
  [
    ".....",
    "..T..",
    ".TWT.",
    "..T..",
    ".....",
  ],
];
export const wisp = s("wisp", "Clue wisp", ["clue", "hint"], "Floats over a clue you have not found yet.", WISP_FRAMES[0], { frameMs: 160, frames: WISP_FRAMES });

export const PROP_SPRITES = [portraitOwn, portraitLend, clockFace, doorSeal, smallFlame, wisp];
