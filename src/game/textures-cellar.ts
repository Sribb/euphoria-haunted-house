import { HAUNTED_PIXEL_PALETTE as P } from "../lib/pixel/haunted-palette";
import { canvasTexture, rng, SCENE_EXTRAS as X } from "./look";

/** Pixel textures for the Cellar: flagstones, stone blocks, chalk tallies, and painted labels. */

type G = CanvasRenderingContext2D;
const px = (g: G, x: number, y: number, c: string, w = 1, h = 1) => {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
};

/** A 3 x 5 pixel font, just the letters the Cellar's labels need. */
const FONT: Record<string, string[]> = {
  B: ["##.", "#.#", "##.", "#.#", "##."], O: [".#.", "#.#", "#.#", "#.#", ".#."], N: ["#.#", "###", "###", "#.#", "#.#"],
  D: ["##.", "#.#", "#.#", "#.#", "##."], S: [".##", "#..", ".#.", "..#", "##."], M: ["#.#", "###", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"], X: ["#.#", "#.#", ".#.", "#.#", "#.#"], T: ["###", ".#.", ".#.", ".#.", ".#."],
  C: [".##", "#..", "#..", "#..", ".##"], K: ["#.#", "##.", "#..", "##.", "#.#"], U: ["#.#", "#.#", "#.#", "#.#", "###"],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."], J: ["..#", "..#", "..#", "#.#", ".#."], E: ["###", "#..", "##.", "#..", "###"],
  " ": ["...", "...", "...", "...", "..."],
};
const text = (g: G, s: string, x: number, y: number, c: string) => {
  [...s].forEach((ch, i) => FONT[ch]?.forEach((row, ry) => [...row].forEach((v, rx) => v === "#" && px(g, x + i * 4 + rx, y + ry, c))));
};
export const textWidth = (s: string) => s.length * 4 - 1;

/** Irregular flagstones with dark mortar. 64 x 48. */
export const flagstones = () =>
  canvasTexture(64, 48, (g) => {
    const r = rng(23);
    px(g, 0, 0, X.stoneDeep, 64, 48);
    const tones = [X.stone, X.stoneLight, X.stone, "#33283F"];
    let y = 0;
    while (y < 48) {
      const h = 7 + Math.floor(r() * 6);
      let x = -Math.floor(r() * 10);
      while (x < 64) {
        const w = 10 + Math.floor(r() * 12);
        const c = tones[Math.floor(r() * tones.length)];
        px(g, x + 1, y + 1, c, w - 1, h - 1);
        px(g, x + 1, y + 1, X.stoneLight, w - 1, 1);
        if (r() < 0.35) px(g, x + 3 + Math.floor(r() * (w - 6)), y + 2 + Math.floor(r() * (h - 4)), X.stoneDeep, 2, 1);
        x += w;
      }
      y += h;
    }
  });

/** Courses of rough stone blocks. 32 x 32. */
export const stoneBlocks = () =>
  canvasTexture(32, 32, (g) => {
    const r = rng(31);
    px(g, 0, 0, "#120C1C", 32, 32);
    for (let row = 0; row < 4; row++) {
      const y = row * 8;
      const off = row % 2 ? 8 : 0;
      for (let x = -off; x < 32; x += 16) {
        const c = r() < 0.5 ? X.stone : "#30243F";
        px(g, x + 1, y + 1, c, 15, 7);
        px(g, x + 1, y + 1, X.stoneLight, 15, 1);
        px(g, x + 1, y + 1, X.stoneLight, 1, 7);
        if (r() < 0.4) px(g, x + 4 + Math.floor(r() * 8), y + 3 + Math.floor(r() * 3), X.stoneDeep, 3, 1);
      }
    }
  });

/** Chalk tally marks scratched across a stretch of wall: someone counting years. 48 x 28. */
export const chalkTallies = () =>
  canvasTexture(
    48,
    28,
    (g) => {
      const r = rng(5);
      for (let row = 0; row < 4; row++) {
        for (let grp = 0; grp < 5; grp++) {
          const x = 2 + grp * 9, y = 2 + row * 7;
          const n = row === 3 && grp > 2 ? Math.floor(r() * 4) + 1 : 5;
          for (let k = 0; k < Math.min(4, n); k++) px(g, x + k * 2, y, k % 2 ? "#C9C2D6" : P.w, 1, 5);
          if (n === 5) for (let k = 0; k < 7; k++) px(g, x - 1 + k, y + 4 - Math.floor(k * 0.7), P.G, 1, 1);
        }
      }
    },
    false,
  );

/** The Sunny Juice crate label: a sun over the name. 24 x 16. */
export const juiceLabel = () =>
  canvasTexture(
    24,
    16,
    (g) => {
      px(g, 0, 0, P.w, 24, 16);
      px(g, 0, 0, P.x, 24, 1);
      px(g, 0, 15, P.x, 24, 1);
      for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 9) px(g, 12 + x, 4 + y, x * x + y * y <= 4 ? P.G : P["3"]);
      text(g, "SUNNY", 2, 9, P["2"]);
    },
    false,
  );

/** A painted word on a barrel's front. */
export const barrelLabel = (word: string, color: string) => {
  const w = textWidth(word) + 4;
  return canvasTexture(
    w,
    9,
    (g) => {
      px(g, 0, 0, "#1C1210", w, 9);
      px(g, 1, 1, P.w, w - 2, 7);
      text(g, word, 2, 2, color);
    },
    false,
  );
};
