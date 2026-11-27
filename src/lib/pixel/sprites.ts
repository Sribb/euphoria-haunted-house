import { HAUNTED_ART } from "../../art";
import type { PixelSprite } from "./types";

/**
 * The Euphoria Haunted House sprite list. Every sprite here is new haunted art
 * from src/art. The helpers are re-exported so `import { shade } from
 * "./sprites"` keeps working.
 */
export { s, shade, withRows } from "./helpers";

/** Every haunted sprite. */
export const PIXEL_SPRITES: PixelSprite[] = HAUNTED_ART;

export const SPRITES_BY_ID: Record<string, PixelSprite> = Object.fromEntries(
  PIXEL_SPRITES.map((sprite) => [sprite.id, sprite]),
);

export const getSprite = (id: string): PixelSprite | undefined => SPRITES_BY_ID[id];
