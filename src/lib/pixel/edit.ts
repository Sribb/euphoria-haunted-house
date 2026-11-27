// Reused from Euphoria (euphoriaweb src/lib/pixel/edit.ts), copied unchanged on 2026-11-27.
// See "Reused from Euphoria" in the README.
/**
 * Editing operations for the /dev/pixel studio, kept free of React so they can be
 * checked from node and reused if another editor ever needs them.
 *
 * Everything here is pure: each function returns a new value, or the very same
 * value when nothing changed, so callers can compare by reference.
 */

import { TRANSPARENT } from "./palette";

/** True when at least one pixel is painted. */
export const hasArt = (rows: string[]): boolean => rows.some((row) => [...row].some((c) => c !== TRANSPARENT));

/** A blank grid of the given size. */
export const blankGrid = (width: number, height: number): string[] =>
  Array.from({ length: height }, () => TRANSPARENT.repeat(width));

/**
 * Paint-bucket fill: recolours the region of `rows[y][x]`'s colour that touches it
 * edge to edge. Four-way, as every pixel editor's bucket is, so a fill never leaks
 * through a diagonal gap in an outline.
 */
export function floodFill(rows: string[], x: number, y: number, value: string): string[] {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  if (y < 0 || y >= height || x < 0 || x >= width) return rows;
  const target = rows[y][x];
  if (target === value) return rows;

  const grid = rows.map((row) => [...row]);
  const stack: Array<[number, number]> = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    if (cy < 0 || cy >= height || cx < 0 || cx >= width || grid[cy][cx] !== target) continue;
    grid[cy][cx] = value;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return grid.map((row) => row.join(""));
}

/**
 * Undo history. `present` is what is on screen; `past` and `future` hold whole
 * snapshots, newest last in `past` and newest first in `future`.
 *
 * `strokeRecorded` makes one brush stroke one undo step: the first pixel a stroke
 * changes records the snapshot, the rest only update `present`. A stroke that
 * changes nothing records nothing, so clicking a pixel that already has the brush's
 * colour does not cost the redo stack.
 */
export interface History<T> {
  past: T[];
  present: T;
  future: T[];
  strokeRecorded: boolean;
}

export const HISTORY_LIMIT = 100;

export const historyInit = <T>(present: T): History<T> => ({ past: [], present, future: [], strokeRecorded: false });

/** Records `next` as one step of its own. Passing the current `present` changes nothing. */
export function historyPush<T>(h: History<T>, next: T): History<T> {
  if (next === h.present) return h;
  return { past: [...h.past, h.present].slice(-HISTORY_LIMIT), present: next, future: [], strokeRecorded: false };
}

/**
 * One brush step. `startsStroke` is true on the pointer-down that begins a stroke.
 * Pass the current `present` when the step changed nothing.
 */
export function historyStroke<T>(h: History<T>, next: T, startsStroke: boolean): History<T> {
  const recorded = startsStroke ? false : h.strokeRecorded;
  if (next === h.present) return recorded === h.strokeRecorded ? h : { ...h, strokeRecorded: recorded };
  if (recorded) return { ...h, present: next };
  return { past: [...h.past, h.present].slice(-HISTORY_LIMIT), present: next, future: [], strokeRecorded: true };
}

export function historyUndo<T>(h: History<T>): History<T> {
  if (!h.past.length) return h;
  return {
    past: h.past.slice(0, -1),
    present: h.past[h.past.length - 1],
    future: [h.present, ...h.future],
    strokeRecorded: false,
  };
}

export function historyRedo<T>(h: History<T>): History<T> {
  if (!h.future.length) return h;
  return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1), strokeRecorded: false };
}

/**
 * Changes `present` without recording a step: picking another frame, typing a speed.
 * The next real edit snapshots whatever is current, so undo still lands on the frame
 * that edit changed.
 */
export const historyReplace = <T>(h: History<T>, present: T): History<T> =>
  present === h.present ? h : { ...h, present };

// ── Frames ──────────────────────────────────────────────────────────────────

/** `current` value meaning the canvas shows the still rather than a frame. */
export const STILL = -1;

/**
 * The editor's document: the still, its animation, and which of them the canvas
 * shows. `current` lives here, not beside it, so undo returns to the frame it changed.
 */
export interface PixelDoc {
  rows: string[];
  frames?: string[][];
  frameMs?: number;
  palette?: Record<string, string>;
  current: number;
}

const onStill = (d: PixelDoc) => d.current === STILL || !d.frames;

/** What the canvas shows. */
export const canvasOf = (d: PixelDoc): string[] => (onStill(d) ? d.rows : d.frames![d.current]);

/** Puts `rows` where the canvas is. Returns `d` itself when they are already there. */
export function withCanvas(d: PixelDoc, rows: string[]): PixelDoc {
  if (rows === canvasOf(d)) return d;
  if (onStill(d)) return { ...d, rows };
  return { ...d, frames: d.frames!.map((f, i) => (i === d.current ? rows : f)) };
}

/** True when the still or any frame has art on it. */
export const docHasArt = (d: PixelDoc): boolean => hasArt(d.rows) || (d.frames ?? []).some(hasArt);

/**
 * Adds a frame and shows it. With no animation yet, the first frame is a copy of the
 * still. Otherwise the current frame is copied in right after itself, or, from the
 * still, the still is copied onto the end.
 */
export function addFrame(d: PixelDoc): PixelDoc {
  if (!d.frames) return { ...d, frames: [[...d.rows]], current: 0 };
  const at = d.current === STILL ? d.frames.length - 1 : d.current;
  const source = d.current === STILL ? d.rows : d.frames[at];
  const frames = [...d.frames.slice(0, at + 1), [...source], ...d.frames.slice(at + 1)];
  return { ...d, frames, current: at + 1 };
}

/** Removes the current frame. Removing the last one leaves a still-only sprite. */
export function deleteFrame(d: PixelDoc): PixelDoc {
  if (onStill(d)) return d;
  const frames = d.frames!.filter((_, i) => i !== d.current);
  if (!frames.length) return { ...d, frames: undefined, frameMs: undefined, current: STILL };
  return { ...d, frames, current: Math.min(d.current, frames.length - 1) };
}

/** Swaps the current frame with its neighbour; the selection moves with it. */
export function moveFrame(d: PixelDoc, step: -1 | 1): PixelDoc {
  if (onStill(d)) return d;
  const to = d.current + step;
  if (to < 0 || to >= d.frames!.length) return d;
  const frames = [...d.frames!];
  [frames[d.current], frames[to]] = [frames[to], frames[d.current]];
  return { ...d, frames, current: to };
}
