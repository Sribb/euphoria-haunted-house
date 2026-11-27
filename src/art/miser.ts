import { s, shade } from "../lib/pixel/helpers";

/**
 * The Miser, the ghost who haunts the Foyer. He hid his money in a drawer for thirty years and watched
 * it buy less and less. Top hat, gold monocle on a chain, drooping mustache, and a money bag he will
 * not let go of until he is freed. 30 x 32, three moods that swap in place. Generated as rows, then kept
 * as plain text like every other sprite.
 */

const RESTLESS = [
  ".........KKKKKKKKKKKK.........",
  ".........KXXXXDDDkkkK.........",
  ".........KDDDDDDDkkkK.........",
  ".........KDDDDDDDkkkK.........",
  ".........IIIIIIIIIIII.........",
  ".........rrrrrrrrrrrr.........",
  "......KKKKKKKKKKKKKKKKKK......",
  "......KkkkkkkkkkkkkkkkkK......",
  "..........IIxxxxxxII..........",
  ".........IwxxxxxxxxXI.........",
  "........IKKwxxxxxxxKKI........",
  "........IGyKGxxxxxKxXI........",
  ".......IGwRRxGxxxxRRxXI.......",
  ".......IGwRRxGxxxxRRxXI.......",
  ".......IwGGGGxxxxxxxxXI.......",
  ".......IwxxxgwwwwxxxxXI...O...",
  ".......IwxxxwwKKwwxxxXI..OOO..",
  "......Iwxxxwxgxxxwxxxxxx......",
  "......IwxxxxxgxxxxwxxxXxxGgO..",
  "......IwxxxxxxgxxxxxxXXIGgygO.",
  ".....IwxXxxxxxxxxxxxXXXGgyyggO",
  ".....IxxXxxxxxxxxxxxXXXGggyggO",
  ".....IxxXxxxxxxxxxxxXXXOggyygO",
  ".....IxxXxxxxxxxxxxxXXXXOgygO.",
  "....IxxxXXxxxxxxxxxXXXXXXOOO..",
  "....IxxxxIxxxxXXxxxXIXXXXI....",
  ".....IxXI.IxxxIIxxXI.IXXI.....",
  ".....IXXI.IXXI..IXXI.IXXII....",
  "......II...III..III...II.II.I.",
  "..........................III.",
  "...........................II.",
  "..............................",
];

const CALM = [
  ".........KKKKKKKKKKKK.........",
  ".........KXXXXDDDkkkK.........",
  ".........KDDDDDDDkkkK.........",
  ".........KDDDDDDDkkkK.........",
  ".........IIIIIIIIIIII.........",
  ".........rrrrrrrrrrrr.........",
  "......KKKKKKKKKKKKKKKKKK......",
  "......KkkkkkkkkkkkkkkkkK......",
  "..........EEQQQQQQEE..........",
  ".........EWQQQQQQQQqE.........",
  "........EKKWQQQQQQQKKE........",
  "........EGyKGQQQQQKQqE........",
  ".......EGWKKQGQQQQKKQqE.......",
  ".......EGWKKQGQQQQKKQqE.......",
  ".......EWGGGGQQQQQQQQqE.......",
  ".......EWQQQgwwwwQQQQqE...O...",
  ".......EWQQQwwKKwwQQQqE..OOO..",
  "......EWQQQwQgQQQwQQQQQQ......",
  "......EWQQQQQgQQQQwQQQqQQGgO..",
  "......EWQQQQQQgQQQQQQqqEGgygO.",
  ".....EWQqQQQQQQQQQQQqqqGgyyggO",
  ".....EQQqQQQQQQQQQQQqqqGggyggO",
  ".....EQQqQQQQQQQQQQQqqqOggyygO",
  ".....EQQqQQQQQQQQQQQqqqqOgygO.",
  "....EQQQqqQQQQQQQQQqqqqqqOOO..",
  "....EQQQQEQQQQqqQQQqEqqqqE....",
  ".....EQqE.EQQQEEQQqE.EqqE.....",
  ".....EqqE.EqqE..EqqE.EqqEE....",
  "......EE...EEE..EEE...EE.EE.E.",
  "..........................EEE.",
  "...........................EE.",
  "..............................",
];

const FREED = [
  ".........KKKKKKKKKKKK.........",
  ".........KXXXXDDDkkkK.........",
  ".........KDDDDDDDkkkK.........",
  ".........KDDDDDDDkkkK.........",
  ".........IIIIIIIIIIII.........",
  ".........rrrrrrrrrrrr.........",
  "......KKKKKKKKKKKKKKKKKK......",
  "......KkkkkkkkkkkkkkkkkK......",
  "..........TTWWWWWWTT..........",
  ".........TWWWWWWWWWQT.........",
  "........TKKWWWWWWWWKKT........",
  "........TGyKGWWWWWKWQT........",
  ".......TGWKKWGWWWWKKWQT.......",
  ".......TGKWWKGWWWKWWKQT.......",
  ".......TWGGGGWWWWWWWWQT.......",
  ".......TWWWWgwwwwWWWWQT.......",
  ".......TWWWWwwKKwwWWWQT.......",
  "......TWWWWwWgWWWwWWWWQT......",
  "......TWWWWWWgWWWWwWWWQT......",
  "......TWWWWWWWgWWWWWWQQT......",
  ".....TWWQWWWWWWWWWWWQQQQT.....",
  ".....TWWQWWWWWWWWWWWQQQQT.....",
  ".....TWWQWWWWWWWWWWWQQQQT.....",
  ".....TWWQWWWWWWWWWWWQQQQT.....",
  "....TWWWQQWWWWWWWWWQQQQQQT....",
  "....TWWWWTWWWWQQWWWQTQQQQT....",
  ".....TWQT.TWWWTTWWQT.TQQT.....",
  ".....TQQT.TQQT..TQQT.TQQTT....",
  "......TT...TTT..TTT...TT.TT.T.",
  "..........................TTT.",
  "...........................TT.",
  "..............................",
];

const GLOW = shade(FREED, { T: "W", Q: "T" });

export const miserRestless = s("miser-restless", "The Miser, restless", ["ghost", "boss"], "Grey, red-eyed, clutching his money bag.", RESTLESS);
export const miserCalm = s("miser-calm", "The Miser, calm", ["ghost", "boss"], "Lavender, after a right answer.", CALM);
export const miserFreed = s("miser-freed", "The Miser, freed", ["ghost", "boss"], "The bag is gone and he is smiling. Play once.", FREED, {
  frameMs: 110,
  frames: [FREED, GLOW, FREED, GLOW, FREED],
});

export const MISER_SPRITES = [miserRestless, miserCalm, miserFreed];
