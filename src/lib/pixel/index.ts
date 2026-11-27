/**
 * The pixel art engine for Euphoria Haunted House.
 *
 * The engine (compile, render, edit, source) is reused from Euphoria. The haunted
 * palette and every sprite are new. See "Reused from Euphoria" in the README.
 *
 * Sprites are ASCII text plus a palette map, compiled to merged SVG rectangles.
 */
export { PixelSpriteView } from "./PixelSprite";
export type { PixelSpriteProps, PixelPlayMode } from "./PixelSprite";
export { spriteToSvgMarkup } from "./svg";
export { compileSprite, compileFrames, PixelSpriteError } from "./compile";
export { EUPHORIA_PIXEL_PALETTE, TRANSPARENT } from "./palette";
export { HAUNTED_PIXEL_PALETTE, HAUNTED_CANVAS, HAUNTED_SURFACE } from "./haunted-palette";
export type { PixelSprite, PixelRect, CompiledSprite } from "./types";
export { PIXEL_SPRITES, SPRITES_BY_ID, getSprite, s, shade, withRows } from "./sprites";
