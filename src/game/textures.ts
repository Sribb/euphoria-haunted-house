import * as THREE from "three";
import { HAUNTED_PIXEL_PALETTE as P } from "../lib/pixel/haunted-palette";
import { compileSprite } from "../lib/pixel/compile";
import type { PixelSprite } from "../lib/pixel/types";
import { canvasTexture, crisp, rng, SCENE_EXTRAS as X } from "./look";

type G = CanvasRenderingContext2D;
const px = (g: G, x: number, y: number, c: string, w = 1, h = 1) => {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
};

/** Draws a compiled sprite into a 2D canvas at 1:1. */
export const drawSprite = (g: G, sprite: PixelSprite, x = 0, y = 0, rows?: string[]) => {
  const { rects } = compileSprite(rows ? { ...sprite, rows } : sprite);
  for (const r of rects) px(g, x + r.x, y + r.y, r.fill, r.w, r.h);
};

/** One texture per animation frame (or one for a still), sized to the sprite. */
export const spriteTextures = (sprite: PixelSprite): THREE.Texture[] => {
  const frames = sprite.frames?.length ? sprite.frames : [sprite.rows];
  const w = sprite.rows[0].length, h = sprite.rows.length;
  return frames.map((rows) => canvasTexture(w, h, (g) => drawSprite(g, sprite, 0, 0, rows), false));
};

/** Floorboards running across the room. 64 x 48, boards 6px deep with staggered joints. */
export const planks = () =>
  canvasTexture(64, 48, (g) => {
    const r = rng(7);
    const tones = [X.wood, X.woodDark, X.wood, X.woodLight];
    for (let row = 0; row < 8; row++) {
      const y = row * 6;
      const tone = tones[Math.floor(r() * tones.length)];
      px(g, 0, y, tone, 64, 6);
      px(g, 0, y + 5, X.woodDeep, 64, 1);
      px(g, 0, y, tone === X.woodLight ? P.g : X.woodLight, 64, 1);
      const joint = Math.floor(r() * 48) + 8;
      px(g, joint, y, X.woodDeep, 1, 6);
      for (let k = 0; k < 5; k++) px(g, Math.floor(r() * 62), y + 2 + Math.floor(r() * 3), X.woodDark, 2 + Math.floor(r() * 4), 1);
      if (r() < 0.4) px(g, Math.floor(r() * 60), y + 2, X.woodDeep, 2, 2);
    }
  });

/** Damask wallpaper: stripes and a diamond motif. 32 x 32. */
export const wallpaper = () =>
  canvasTexture(32, 32, (g) => {
    px(g, 0, 0, X.stone, 32, 32);
    px(g, 0, 0, X.stoneDeep, 1, 32);
    px(g, 16, 0, X.stoneDeep, 1, 32);
    const motif = (cx: number, cy: number) => {
      for (let d = 0; d < 4; d++) {
        px(g, cx - d, cy - 3 + d, X.stoneLight);
        px(g, cx + d, cy - 3 + d, X.stoneLight);
        px(g, cx - d, cy + 3 - d, X.stoneLight);
        px(g, cx + d, cy + 3 - d, X.stoneLight);
      }
      px(g, cx, cy, P.E);
    };
    motif(8, 8);
    motif(24, 24);
    px(g, 24, 7, X.stoneLight, 1, 3);
    px(g, 8, 23, X.stoneLight, 1, 3);
  });

/** Wainscot: raised wooden panels with a lit top-left edge. 32 x 16. */
export const wainscot = () =>
  canvasTexture(32, 16, (g) => {
    px(g, 0, 0, X.woodDark, 32, 16);
    px(g, 3, 2, X.wood, 26, 12);
    px(g, 3, 2, X.woodLight, 26, 1);
    px(g, 3, 2, X.woodLight, 1, 12);
    px(g, 28, 2, X.woodDeep, 1, 12);
    px(g, 3, 13, X.woodDeep, 26, 1);
    px(g, 0, 0, X.woodDeep, 1, 16);
  });

/** The rug runner, mapped once over the whole rug. 40 x 96. */
export const rug = () =>
  canvasTexture(
    40,
    96,
    (g) => {
      px(g, 0, 0, P.r, 40, 96);
      px(g, 0, 0, P.G, 2, 96);
      px(g, 38, 0, P.G, 2, 96);
      px(g, 0, 0, P.G, 40, 2);
      px(g, 0, 94, P.G, 40, 2);
      px(g, 4, 4, P.I, 1, 88);
      px(g, 35, 4, P.I, 1, 88);
      px(g, 4, 4, P.I, 32, 1);
      px(g, 4, 91, P.I, 32, 1);
      for (let cy = 14; cy < 90; cy += 16) {
        for (let d = 0; d <= 5; d++) {
          px(g, 20 - d, cy - 5 + d, P.R, 2 * d, 1);
          px(g, 20 - d, cy + 5 - d, P.R, 2 * d, 1);
        }
        px(g, 19, cy - 1, P.G, 2, 2);
      }
      for (let x = 1; x < 40; x += 3) px(g, x, 0, P.w, 1, 1);
    },
    false,
  );

/** Bookshelf front: three shelves of spines. 32 x 40. */
export const books = () =>
  canvasTexture(32, 40, (g) => {
    const r = rng(19);
    px(g, 0, 0, X.woodDark, 32, 40);
    const spines = [P.r, P.b, P.n, P.p, P.O, P.f, P.t, P.I];
    for (let shelf = 0; shelf < 3; shelf++) {
      const y = 2 + shelf * 13;
      px(g, 0, y + 11, X.woodLight, 32, 1);
      let x = 2;
      while (x < 30) {
        const w = 1 + Math.floor(r() * 3);
        const h = 7 + Math.floor(r() * 4);
        const c = spines[Math.floor(r() * spines.length)];
        if (x + w > 30) break;
        if (r() < 0.12) { x += w + 1; continue; }
        px(g, x, y + 11 - h, c, w, h);
        px(g, x, y + 11 - h + 2, P.G, w, 1);
        x += w;
      }
    }
  });

/** The night outside the windows: moon, stars and a dead tree line. 96 x 48. */
export const nightSky = () =>
  canvasTexture(
    96,
    48,
    (g) => {
      const r = rng(3);
      px(g, 0, 0, X.moonDeep, 96, 48);
      px(g, 0, 30, X.moon, 96, 18);
      for (let i = 0; i < 40; i++) px(g, Math.floor(r() * 96), Math.floor(r() * 28), r() < 0.3 ? P.W : P.B);
      // the moon, behind the left window
      for (let y = -5; y <= 5; y++)
        for (let x = -5; x <= 5; x++) {
          const d = Math.hypot(x, y);
          if (d <= 5.2) px(g, 16 + x, 12 + y, d < 4 ? P.W : P.w);
          else if (d <= 7) px(g, 16 + x, 12 + y, X.moonLight);
        }
      px(g, 14, 10, P.x, 2, 2);
      px(g, 18, 14, P.x, 1, 1);
      // tree line
      for (let x = 0; x < 96; x++) {
        const h = 6 + Math.floor(3 * Math.sin(x * 0.4) + 2 * Math.sin(x * 1.3) + r() * 2);
        px(g, x, 48 - h, P.K, 1, h);
      }
      for (let k = 0; k < 3; k++) {
        const tx = 40 + k * 22;
        px(g, tx, 26, P.K, 1, 16);
        px(g, tx - 3, 30, P.K, 3, 1);
        px(g, tx + 1, 28, P.K, 4, 1);
        px(g, tx - 2, 24, P.K, 1, 6);
      }
    },
    false,
  );

/** A flat colour texture, for meshes that need a map to cut out with alpha. */
export const solid = (c: string) => crisp(canvasTexture(1, 1, (g) => px(g, 0, 0, c), false));
