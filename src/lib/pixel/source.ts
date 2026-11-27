// Reused from Euphoria (euphoriaweb src/lib/pixel/source.ts), copied unchanged on 2026-11-27.
// See "Reused from Euphoria" in the README.
import type { PixelSprite } from "./types";

/**
 * Writes a sprite back out as TypeScript, the way sprites are written by hand.
 *
 * Frames are authored in sprites.ts with its own helpers, and this keeps them that
 * way: a frame that only swaps colours becomes `shade()`, one that changes a few rows
 * becomes `withRows()`, and a frame that repeats an earlier drawing points back at
 * it. Only a frame none of those can express is written out in full. Of the forms
 * that fit, the shortest wins, so the output stays as small as the hand-written
 * source it replaces.
 *
 * `s()`, `shade()` and `withRows()` exist only inside sprites.ts, so that is where
 * this output belongs. A sprite with its own palette (the character cast) lives in
 * a file without them, so it is written as a plain object with every frame in full.
 */

const ident = (id: string): string => {
  const camel = (id || "sprite").replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase()).replace(/[^A-Za-z0-9_$]/g, "_");
  return /^[0-9]/.test(camel) ? `_${camel}` : camel;
};

const q = (s: string) => JSON.stringify(s);

const literal = (rows: string[], indent: string): string =>
  `[\n${rows.map((r) => `${indent}  ${q(r)},`).join("\n")}\n${indent}]`;

/** The colour swap that turns `base` into `frame`, `{}` when they match, or null when no swap can. */
export function shadeSwap(base: string[], frame: string[]): Record<string, string> | null {
  if (base.length !== frame.length) return null;
  const map = new Map<string, string>();
  for (let y = 0; y < base.length; y++) {
    if (base[y].length !== frame[y].length) return null;
    for (let x = 0; x < base[y].length; x++) {
      const from = base[y][x];
      const to = frame[y][x];
      const seen = map.get(from);
      if (seen === undefined) map.set(from, to);
      else if (seen !== to) return null;
    }
  }
  const swap: Record<string, string> = {};
  for (const [from, to] of map) if (from !== to) swap[from] = to;
  return swap;
}

/** The rows of `frame` that differ from `base`, or null when the heights differ. */
export function rowOverrides(base: string[], frame: string[]): Record<number, string> | null {
  if (base.length !== frame.length) return null;
  const out: Record<number, string> = {};
  frame.forEach((row, i) => {
    if (row !== base[i]) out[i] = row;
  });
  return out;
}

const sameRows = (a: string[], b: string[]) => a.length === b.length && a.every((r, i) => r === b[i]);

/** What each frame is written as: a name to point at, or an expression to declare. */
interface FramePlan {
  /** The name `frames: [...]` uses for this frame. */
  ref: string;
  /** Set when the frame needs a `const` of its own. */
  declare?: string;
}

function planFrames(stillName: string, rows: string[], frames: string[][], base: string): FramePlan[] {
  const named: Array<{ name: string; rows: string[] }> = [{ name: stillName, rows }];
  const plans: FramePlan[] = [];
  frames.forEach((frame, i) => {
    const repeat = named.find((n) => sameRows(n.rows, frame));
    if (repeat) {
      plans.push({ ref: repeat.name });
      return;
    }
    const name = `${base}Frame${i + 1}`;
    const options = [literal(frame, "")];
    for (const n of named) {
      const swap = shadeSwap(n.rows, frame);
      if (swap) options.push(`shade(${n.name}, ${JSON.stringify(swap)})`);
      const over = rowOverrides(n.rows, frame);
      if (over) {
        const body = Object.entries(over).map(([k, v]) => `\n  ${k}: ${q(v)},`).join("");
        options.push(`withRows(${n.name}, {${body}\n})`);
      }
    }
    // Shortest wins; a tie keeps the earlier option, so shade beats withRows beats nothing.
    const best = options.slice(1).reduce((a, b) => (b.length < a.length ? b : a), options[0]);
    plans.push({ ref: name, declare: best });
    named.push({ name, rows: frame });
  });
  return plans;
}

/** TypeScript for `sprite`, ready to paste. */
export function spriteSource(sprite: PixelSprite): string {
  const base = ident(sprite.id);
  const tags = `[${sprite.tags.map(q).join(", ")}]`;
  const frames = sprite.frames?.length ? sprite.frames : undefined;
  const frameMs = sprite.frameMs ?? 120;

  if (sprite.palette) {
    const lines = [
      `export const ${base}: PixelSprite = {`,
      `  id: ${q(sprite.id)},`,
      `  name: ${q(sprite.name)},`,
      `  tags: ${tags},`,
      ...(sprite.blurb ? [`  blurb: ${q(sprite.blurb)},`] : []),
      `  palette: ${JSON.stringify(sprite.palette)},`,
      `  rows: ${literal(sprite.rows, "  ")},`,
      ...(frames
        ? [`  frameMs: ${frameMs},`, `  frames: [\n${frames.map((f) => `    ${literal(f, "    ")},`).join("\n")}\n  ],`]
        : []),
      `};`,
    ];
    return lines.join("\n");
  }

  const head = `s(${q(sprite.id)}, ${q(sprite.name)}, ${tags}, ${q(sprite.blurb ?? "")}`;
  if (!frames) return `export const ${base} = ${head}, ${literal(sprite.rows, "")});`;

  const stillName = `${base}Still`;
  const plans = planFrames(stillName, sprite.rows, frames, base);
  const decls = plans.filter((p) => p.declare).map((p) => `const ${p.ref} = ${p.declare};`);
  return [
    `const ${stillName} = ${literal(sprite.rows, "")};`,
    ...decls,
    "",
    `export const ${base} = ${head}, ${stillName}, {`,
    `  frameMs: ${frameMs},`,
    `  frames: [${plans.map((p) => p.ref).join(", ")}],`,
    `});`,
  ].join("\n");
}
