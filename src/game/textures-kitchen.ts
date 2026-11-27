import { HAUNTED_PIXEL_PALETTE as P } from "../lib/pixel/haunted-palette";
import { canvasTexture, rng, SCENE_EXTRAS as X } from "./look";

/** Pixel textures for the Kitchen: quarry tiles, glazed wall tiles, and the open recipe book. */

type G = CanvasRenderingContext2D;
const px = (g: G, x: number, y: number, c: string, w = 1, h = 1) => {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
};

/**
 * Quarry tiles for the floor. The texture is 40 x 24 and holds 4 x 4 small tiles, 10 px across and 6 px
 * deep, which is 0.625 units square at the camera's angle and whole pixels on screen.
 */
export const quarryTiles = () =>
  canvasTexture(40, 24, (g) => {
    const r = rng(47);
    px(g, 0, 0, X.woodDeep, 40, 24);
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 4; i++) {
        const warm = (i + j) % 2 === 0;
        px(g, i * 10 + 1, j * 6 + 1, warm ? X.wood : X.woodDark, 9, 5);
        px(g, i * 10 + 1, j * 6 + 1, warm ? X.woodLight : X.wood, 9, 1);
        if (r() < 0.3) px(g, i * 10 + 3 + Math.floor(r() * 5), j * 6 + 3, X.woodDeep, 2, 1);
      }
  });

/** Glazed wall tiles, 8 px square, with a few midnight-blue ones set in. 32 x 32. */
export const wallTiles = () =>
  canvasTexture(32, 32, (g) => {
    const r = rng(53);
    px(g, 0, 0, X.stoneDeep, 32, 32);
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 4; i++) {
        const blue = r() < 0.14;
        px(g, i * 8 + 1, j * 8 + 1, blue ? X.moon : X.stone, 7, 7);
        px(g, i * 8 + 1, j * 8 + 1, blue ? X.moonLight : X.stoneLight, 7, 1);
        px(g, i * 8 + 1, j * 8 + 1, blue ? X.moonLight : X.stoneLight, 1, 7);
      }
  });

/** The Cook's recipe book, open: two pages of lines and one small drawing of a basket. 26 x 16. */
export const recipeBook = () =>
  canvasTexture(
    26,
    16,
    (g) => {
      px(g, 0, 0, P.g, 26, 16);
      px(g, 1, 1, P.w, 11, 14);
      px(g, 14, 1, P.w, 11, 14);
      px(g, 12, 1, P.x, 2, 14);
      for (let y = 3; y < 14; y += 2) px(g, 3, y, P.X, y === 9 ? 5 : 8, 1);
      for (let y = 3; y < 8; y += 2) px(g, 16, y, P.X, 7, 1);
      px(g, 17, 10, P.O, 6, 3);
      px(g, 18, 13, P.O, 4, 1);
      px(g, 18, 9, P.W, 1, 1);
      px(g, 20, 9, P.W, 1, 1);
      px(g, 22, 9, P.R, 1, 1);
    },
    false,
  );
