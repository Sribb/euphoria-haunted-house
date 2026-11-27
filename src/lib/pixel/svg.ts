// Reused from Euphoria (euphoriaweb src/lib/pixel/svg.ts), copied unchanged on 2026-11-27.
// See "Reused from Euphoria" in the README.
import { compileSprite } from "./compile";
import type { PixelSprite } from "./types";

/**
 * Standalone SVG markup for a sprite, used by the Studio insert flow (which
 * stores raw SVG strings) and by anything exporting art out of the app.
 *
 * Lives apart from PixelSprite.tsx so that file only exports components, which is
 * what Fast Refresh needs to reload the renderer cleanly during development.
 */
export function spriteToSvgMarkup(sprite: PixelSprite, scale = 4): string {
  const { width, height, rects } = compileSprite(sprite);
  const body = rects
    .map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.fill}"/>`)
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
    `width="${width * scale}" height="${height * scale}" shape-rendering="crispEdges" ` +
    `role="img" aria-label="${sprite.name}">${body}</svg>`
  );
}
