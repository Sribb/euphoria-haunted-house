import { HAUNTED_PIXEL_PALETTE as P } from "../lib/pixel/haunted-palette";
import type { PixelSprite } from "../lib/pixel/types";
import { canvasTexture, rng, SCENE_EXTRAS as X } from "./look";
import { drawSprite } from "./textures";

/** Pixel textures for the Portrait Gallery: checkered marble and painted canvases. */

type G = CanvasRenderingContext2D;
const px = (g: G, x: number, y: number, c: string, w = 1, h = 1) => {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
};

/**
 * Checkered marble. The tile is 40 x 24: two squares of 20 px across and 12 px deep. At the camera's
 * angle that makes each square 1.25 units on both sides, and still whole pixels on screen.
 */
export const marble = () =>
  canvasTexture(40, 24, (g) => {
    const r = rng(11);
    for (let j = 0; j < 2; j++)
      for (let i = 0; i < 2; i++) {
        const dark = (i + j) % 2 === 1;
        const [x, y] = [i * 20, j * 12];
        px(g, x, y, dark ? X.stoneDeep : X.stoneLight, 20, 12);
        px(g, x, y, dark ? X.stone : P.X, 20, 1);
        for (let k = 0; k < 3; k++) {
          const vx = x + 2 + Math.floor(r() * 14), vy = y + 2 + Math.floor(r() * 8);
          px(g, vx, vy, dark ? X.stone : X.stone, 3, 1);
          px(g, vx + 3, vy + 1, dark ? X.stone : X.stone, 2, 1);
        }
        px(g, x, y, "#120C1C", 1, 12);
      }
  });

/** A portrait canvas: a figure from the lesson on a dark ground, with a prop beside them. */
export const figureCanvas = (figure: PixelSprite, prop: PixelSprite | null, ground: string) =>
  canvasTexture(
    24,
    28,
    (g) => {
      px(g, 0, 0, ground, 24, 28);
      for (let y = 0; y < 28; y++) for (let x = 0; x < 24; x++) if (Math.hypot(x - 11.5, y - 12) > 13) px(g, x, y, "#120C1C");
      const w = figure.rows[0].length, h = figure.rows.length;
      drawSprite(g, figure, Math.round((24 - w) / 2) - (prop ? 3 : 0), 28 - h - 2);
      if (prop) drawSprite(g, prop, 24 - prop.rows[0].length - 2, 28 - prop.rows.length - 4);
    },
    false,
  );

/** A ghost's portrait: the sprite on a dark oval ground. 32 x 34. */
export const ghostCanvas = (ghost: PixelSprite) =>
  canvasTexture(
    32,
    34,
    (g) => {
      px(g, 0, 0, "#120C1C", 32, 34);
      for (let y = 0; y < 34; y++) for (let x = 0; x < 32; x++) if (Math.hypot((x - 15.5) / 15, (y - 16.5) / 16) < 1) px(g, x, y, X.stone);
      drawSprite(g, ghost, 1, 1);
    },
    false,
  );

/** The first Moon Tees shirt, for the display case. 18 x 16. */
export const shirt = () =>
  canvasTexture(
    18,
    16,
    (g) => {
      const body = P.w, shade = P.x;
      px(g, 5, 0, body, 8, 16);
      px(g, 1, 1, body, 4, 5);
      px(g, 13, 1, body, 4, 5);
      px(g, 0, 2, body, 1, 3);
      px(g, 17, 2, body, 1, 3);
      px(g, 7, 0, shade, 4, 2);
      px(g, 12, 6, shade, 1, 10);
      for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 9 && (x + 1) * (x + 1) + y * y > 5) px(g, 9 + x, 9 + y, P.G);
    },
    false,
  );
