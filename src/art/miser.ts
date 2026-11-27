import { s, shade } from "../lib/pixel/helpers";

/**
 * The Miser, the ghost who haunts the Foyer. He hid his money in a drawer for thirty years and watched
 * it buy less and less. Top hat, gold monocle on a chain, drooping mustache, and a money bag he will
 * not let go of until he is freed. 30 x 32, three moods that swap in place. Generated as rows, then kept
 * as plain text like every other sprite.
 */

const RESTLESS = [
  ".........XXXXXXKKKKKK.........",
  ".........XXXXXDDDkkkK.........",
  ".........XDDDDDDDkkkK.........",
  ".........XDDDDDDDkkkK.........",
  ".........xIIIIIIIIIII.........",
  ".........xrrrrrrrrrrr.........",
  "......XXXKKKKKKKKKKKKKKK......",
  "......XXXXkkkkkkkkkkkkkK......",
  "..........xIxxxxxxII..........",
  ".........XwxxxxxxxxKK.........",
  "........xKKwxxxxxxxKKI........",
  "........xwyKxxxxxxKRxI........",
  ".......xGwRRxGxxxxRRxXI.......",
  ".......xGwRRxGxxxxRRxXI.......",
  ".......xwGGGGxxxxxxxxXI.......",
  ".......xwxxxwwwwwxxxxXI...O...",
  ".......xwxxxwwKKwwxxxXI..OOO..",
  "......xwxxxwxgxxxwxxxxxx......",
  "......xwxxxxxgxxxxwxxxXxBxyg..",
  "......xwxxxxxxxxxxxxxXXGgyygx.",
  ".....xwxXxxxxxxxxxxxXXXGgyyggx",
  ".....xxxXxxxxxxxxxxxXXXGggyggO",
  ".....xxxXxxxxxxxxxxxXXXXggyygO",
  ".....xxxXxxxxxxxxxxxXXXXXgyOK.",
  "....xxxxXXxxxxxxxxxXXXXXXOOO..",
  "....xxxxxKxxxxXXxxxXKXXXXK....",
  ".....IxXI.IxxxIIxxXI.IXXI.....",
  ".....IXXI.IXXI..IXXI.IXXII....",
  "......II...III..III...II.II.I.",
  "..........................III.",
  "...........................II.",
  "..............................",
];

const CALM = [
  ".........XXXXXXKKKKKK.........",
  ".........XXXXXDDDkkkK.........",
  ".........XDDDDDDDkkkK.........",
  ".........XDDDDDDDkkkK.........",
  ".........xIIIIIIIIIII.........",
  ".........xrrrrrrrrrrr.........",
  "......XXXKKKKKKKKKKKKKKK......",
  "......XXXXkkkkkkkkkkkkkK......",
  "..........xEQQQQQQEE..........",
  ".........XWQQQQQQQQKK.........",
  "........xKKWQQQQQQQKKE........",
  "........xWyKQQQQQQKKQE........",
  ".......xGWKKQGQQQQKKQqE.......",
  ".......xGWKKQGQQQQKKQqE.......",
  ".......xWGGGGQQQQQQQQqE.......",
  ".......xWQQQwwwwwQQQQqE...O...",
  ".......xWQQQwwKKwwQQQqE..OOO..",
  "......xWQQQwQgQQQwQQQQQQ......",
  "......xWQQQQQgQQQQwQQQqQBxyg..",
  "......xWQQQQQQQQQQQQQqqGgyygx.",
  ".....xWQqQQQQQQQQQQQqqqGgyyggx",
  ".....xQQqQQQQQQQQQQQqqqGggyggO",
  ".....xQQqQQQQQQQQQQQqqqqggyygO",
  ".....xQQqQQQQQQQQQQQqqqqqgyOK.",
  "....xQQQqqQQQQQQQQQqqqqqqOOO..",
  "....xQQQQKQQQQqqQQQqKqqqqK....",
  ".....EQqE.EQQQEEQQqE.EqqE.....",
  ".....EqqE.EqqE..EqqE.EqqEE....",
  "......EE...EEE..EEE...EE.EE.E.",
  "..........................EEE.",
  "...........................EE.",
  "..............................",
];

const FREED = [
  ".........XXXXXXKKKKKK.........",
  ".........XXXXXDDDkkkK.........",
  ".........XDDDDDDDkkkK.........",
  ".........XDDDDDDDkkkK.........",
  ".........xIIIIIIIIIII.........",
  ".........xrrrrrrrrrrr.........",
  "......XXXKKKKKKKKKKKKKKK......",
  "......XXXXkkkkkkkkkkkkkK......",
  "..........BTWWWWWWTT..........",
  ".........XWWWWWWWWWKK.........",
  "........BKKWWWWWWWWKKT........",
  "........BWyKWWWWWWKWWT........",
  ".......BGWKKWGWWWWKKWQT.......",
  ".......BGKWWKGWWWKWWKQT.......",
  ".......BWGGGGWWWWWWWWQT.......",
  ".......BWWWWwwwwwWWWWQT.......",
  ".......BWWWWwwKKwwWWWQT.......",
  "......BWWWWwWgWWWwWWWWQT......",
  "......BWWWWWWgWWWWwWWWQT......",
  "......BWWWWWWWWWWWWWWQQT......",
  ".....BWWQWWWWWWWWWWWQQQQT.....",
  ".....BWWQWWWWWWWWWWWQQQQT.....",
  ".....BWWQWWWWWWWWWWWQQQQT.....",
  ".....BWWQWWWWWWWWWWWQQQQT.....",
  "....BWWWQQWWWWWWWWWQQQQQQT....",
  "....BWWWWKWWWWQQWWWQKQQQQT....",
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
