import { HAUNTED_PIXEL_PALETTE } from "../lib/pixel/haunted-palette";
import { s } from "../lib/pixel/helpers";
import type { PixelSprite } from "../lib/pixel/types";
import type { ReelFrame, ReelLayer } from "../lib/pixel/story/types";

/**
 * The Halloween costume for Euphoria's story scenes. Two parts:
 *   1. autumn(): every green in a scene (grass, bushes, the orchard's leaves) turns to fall colours.
 *      Dark greens become dead violet-brown ground; brighter greens become rust and pumpkin orange.
 *      Skin, sky, moon and wood are untouched.
 *   2. Set dressing: bats, jack-o'-lanterns, gravestones, cobwebs, a spider and a small ghost, placed
 *      per scene where the story's actors never walk (positions are scene pixels on the 80 x 60 stage).
 */

const hexToHsl = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) * 60 : max === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60;
  return { h, s: sat, l };
};
const hslToHex = (h: number, sat: number, l: number) => {
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return "#" + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
};

/** Green to fall: dark greens become violet-brown ground, lighter greens rust and pumpkin orange. */
export const autumnColour = (hex: string) => {
  const { h, s: sat, l } = hexToHsl(hex);
  if (h < 70 || h > 170 || sat < 0.12) return hex;
  if (l < 0.3) return hslToHex(300, Math.min(0.32, sat * 0.6), l * 0.95);
  // leaves go rust red rather than orange, so gold coins hanging in a tree still stand out
  const t = Math.min(1, (l - 0.3) / 0.4);
  return hslToHex(4 + t * 14, Math.min(0.72, sat), l * 0.86);
};

const autumnCache = new WeakMap<PixelSprite, PixelSprite>();
export const autumn = (sp: PixelSprite): PixelSprite => {
  const hit = autumnCache.get(sp);
  if (hit) return hit;
  // every colour the sprite uses, including keys that fall back to the default palette
  const full: Record<string, string> = { ...HAUNTED_PIXEL_PALETTE, ...(sp.palette ?? {}) };
  const used = new Set([...sp.rows, ...(sp.frames ?? []).flat()].join(""));
  used.delete(".");
  const palette = Object.fromEntries([...used].filter((c) => full[c]).map((c) => [c, autumnColour(full[c])]));
  const out = { ...sp, palette: { ...(sp.palette ?? {}), ...palette } };
  autumnCache.set(sp, out);
  return out;
};

// ---------------------------------------------------------------- set dressing (new art)

const BAT_ROWS = ["K.....K", "KK.K.KK", ".KKKKK.", "...K..."];
export const bat = s("bat", "Bat", ["halloween"], "A bat flapping across the night sky.", BAT_ROWS, {
  frameMs: 140,
  frames: [BAT_ROWS, [".......", "..KKK..", "KKKKKKK", "K..K..K"]],
});

const PUMPKIN_ROWS = ["...O...", ".23332.", "2353532", "2333332", "2355532", ".22222."];
export const jackOLantern = s("jack-o-lantern", "Jack-o'-lantern", ["halloween"], "A carved pumpkin whose face flickers.", PUMPKIN_ROWS, {
  frameMs: 180,
  frames: [PUMPKIN_ROWS, ["...O...", ".23332.", "2343432", "2333332", "2344432", ".22222."], PUMPKIN_ROWS, ["...O...", ".23332.", "2353532", "2333332", "2355532", ".22222."]],
});

export const gravestone = s("gravestone", "Gravestone", ["halloween"], "A small leaning gravestone with a cross.", [
  ".DDD.",
  "DxxXD",
  "DxKXD",
  "DKKKD",
  "DxKXD",
  "DxxXD",
  "DDDDD",
]);

export const cobweb = s("cobweb", "Cobweb", ["halloween"], "A cobweb in a top corner.", [
  "xxxxxxxx",
  ".x..x..x",
  "..x.x.x.",
  "...xxx.x",
  "x...xx..",
  ".xx..x..",
  "...xx.x.",
  ".......x",
]);

export const spider = s("spider", "Spider", ["halloween"], "A spider hanging on its thread.", [
  "..x..",
  "..x..",
  "..x..",
  "..x..",
  "..x..",
  "K.K.K",
  ".KRK.",
  "K.K.K",
]);

const GHOST_ROWS = ["..WWW..", ".WWWWW.", "WKWWKWW", "WWWWWWW", "WWWWWWW", "W.WW.WW"];
export const tinyGhost = s("tiny-ghost", "Tiny ghost", ["halloween"], "A small ghost peeking out.", GHOST_ROWS);

type Spot = [PixelSprite, number, number, ReelLayer["motion"]?];
const drift = (amp: number, periodMs: number, phase = 0) => ({ kind: "drift" as const, amp, periodMs, phase });
const bob = (amp: number, periodMs: number, phase = 0) => ({ kind: "bob" as const, amp, periodMs, phase });

/** Where the decorations go in each scene, kept clear of every actor path and label. */
const DRESSING: Record<string, Spot[]> = {
  room: [[cobweb, 72, 0], [spider, 31, 0, bob(3, 2600)], [bat, 9, 9, drift(3, 3000)], [jackOLantern, 58, 20]],
  booth: [[bat, 44, 3, drift(5, 3400)], [bat, 58, 7, drift(4, 2800, 0.4)], [gravestone, 1, 44], [jackOLantern, 72, 52]],
  orchard: [[bat, 40, 3, drift(5, 3200)], [gravestone, 46, 45], [jackOLantern, 63, 51], [jackOLantern, 71, 53]],
  stand: [[bat, 62, 3, drift(4, 3100)], [bat, 70, 10, drift(3, 2700, 0.5)], [jackOLantern, 34, 7], [jackOLantern, 56, 7]],
  "stand-rain": [[jackOLantern, 34, 7], [jackOLantern, 56, 7]],
  "stand-closed": [[bat, 62, 3, drift(4, 3100)], [jackOLantern, 34, 7], [tinyGhost, 66, 22, bob(2, 2200)]],
  bank: [[bat, 46, 2, drift(5, 3300)], [bat, 58, 8, drift(3, 2900, 0.3)], [gravestone, 66, 45], [gravestone, 73, 47]],
  "coin-plus": [[bat, 56, 3, drift(5, 3200)], [gravestone, 66, 45], [jackOLantern, 72, 52]],
  stacks: [[bat, 50, 3, drift(5, 3200)], [jackOLantern, 72, 52]],
  board: [[cobweb, 0, 0], [spider, 74, 0, bob(3, 2600)]],
  ground: [[bat, 44, 3, drift(5, 3300)], [gravestone, 72, 45], [jackOLantern, 2, 52]],
  doublings: [[bat, 52, 3, drift(5, 3200)], [jackOLantern, 72, 52]],
  sooner: [[bat, 46, 4, drift(4, 3000)], [tinyGhost, 60, 14, bob(2, 2400)], [jackOLantern, 72, 52]],
  "orchard-moon": [[bat, 40, 3, drift(5, 3200)], [gravestone, 46, 45], [tinyGhost, 36, 16, bob(2, 2400)], [jackOLantern, 71, 53]],
};

/** A story scene in its Halloween costume: autumn colours plus the scene's decorations. */
export const dressScene = (name: string, frame: ReelFrame): ReelFrame => ({
  base: autumn(frame.base),
  layers: [
    ...frame.layers.map((l) => ({ ...l, sprite: autumn(l.sprite) })),
    ...(DRESSING[name] ?? []).map(([sprite, x, y, motion]) => ({ sprite, x, y, motion })),
  ],
});

export const HALLOWEEN_SPRITES = [bat, jackOLantern, gravestone, cobweb, spider, tinyGhost];
