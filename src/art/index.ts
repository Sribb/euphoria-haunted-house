import type { PixelSprite } from "../lib/pixel/types";
import { CANDLE_SPRITES } from "./candle";
import { FOYER_SPRITES } from "./foyer";
import { GHOST_SPRITES } from "./ghost";
import { CLOCKMAKER_SPRITES } from "./clockmaker";
import { COOK_SPRITES } from "./cook";
import { DUCHESS_SPRITES } from "./duchess";
import { GAMBLER_SPRITES } from "./gambler";
import { MISER_SPRITES } from "./miser";
import { PLAYER_SPRITES } from "./player";
import { PROP_SPRITES } from "./props";

export * from "./candle";
export * from "./foyer";
export * from "./ghost";
export * from "./clockmaker";
export * from "./cook";
export * from "./duchess";
export * from "./gambler";
export * from "./miser";
export * from "./player";
export * from "./props";

/** Every haunted sprite, in the order a room uses them. */
export const HAUNTED_ART: PixelSprite[] = [
  ...GHOST_SPRITES,
  ...MISER_SPRITES,
  ...GAMBLER_SPRITES,
  ...CLOCKMAKER_SPRITES,
  ...DUCHESS_SPRITES,
  ...COOK_SPRITES,
  ...CANDLE_SPRITES,
  ...FOYER_SPRITES,
  ...PROP_SPRITES,
  ...Object.values(PLAYER_SPRITES),
];
