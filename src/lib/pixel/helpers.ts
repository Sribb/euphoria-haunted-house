import type { PixelSprite } from "./types";

/**
 * Sprite helpers, reused from Euphoria (euphoriaweb src/lib/pixel/sprites.ts,
 * copied 2026-11-27). They live in their own file so art files can import them
 * without importing the sprite list, which would be a circular import.
 */

/** Builds a sprite from its parts. */
export const s = (
  id: string,
  name: string,
  tags: string[],
  blurb: string,
  rows: string[],
  anim?: { frameMs: number; frames: string[][] },
): PixelSprite => ({ id, name, tags, blurb, rows, ...anim });

/**
 * Derives a frame by swapping palette characters, for animations that only
 * change the lighting (a candle flickering, a ghost fading). A swap cannot change
 * the geometry, so it cannot break the sprite.
 */
export const shade = (rows: string[], swap: Record<string, string>): string[] =>
  rows.map((row) => [...row].map((ch) => swap[ch] ?? ch).join(""));

/**
 * Derives a frame by replacing specific rows, for animations where only part of
 * the sprite moves. The untouched rows stay shared with the still.
 */
export const withRows = (rows: string[], overrides: Record<number, string>): string[] =>
  rows.map((row, i) => overrides[i] ?? row);
