import { buildPlan, type LessonSlot } from "../lib/pixel/story/engine";
import type { Movie } from "../game/movies";

/**
 * When each beat of a clue movie plays. The story engine lays the beats out for a carousel nobody is
 * waiting on: every beat holds for its motion and then for 50 ms per caption character. A clue movie
 * cannot be skipped, so it is cut tighter here, after the engine has built its plan (the engine is not
 * edited). Two changes:
 *   1. The caption is on screen from the start of a beat, so reading time runs alongside the motion
 *      instead of after it. A beat ends once the picture has settled and the caption has been read.
 *   2. The reading rate is as slow as a 17 second movie allows: 45 ms per character for a short movie,
 *      down to 30 ms per character for the longest one. Every caption gets at least 2 seconds.
 * No beat is dropped and no caption is changed.
 */

/** The fade up from black before the first beat, and the pause after the last one before Continue. */
export const LEAD_MS = 400;
export const TAIL_MS = 400;

const BUDGET_MS = 17000;
const READ_SLOW_MS = 45;
const READ_FAST_MS = 30;
const READ_FLOOR_MS = 2000;
/** The engine swaps captions over the first 800 ms of a beat; the new one is readable from here. */
const CAPTION_AT_MS = 500;
/** After the picture lands: the labels fade in and the viewer gets a look at them. */
const SETTLE_MS = 900;
/** Extra for a beat whose tile strip changes height once the picture has landed. */
const STRIP_MS = 300;
/** The engine's cap on how much of a long motion a beat waits for. */
const MOTION_MAX_MS = 3500;

/** The engine's plan for a movie with every beat re-timed. Beats still run end to end from `playStart`. */
export function moviePlan(movie: Movie): LessonSlot {
  const plan = buildPlan([movie.lesson]).lessons[0];
  const holds = (readMs: number) =>
    plan.beats.map((b, i) => {
      const landed = Math.min(MOTION_MAX_MS, b.motion) + SETTLE_MS + (movie.lesson.beats[i].strip ? STRIP_MS : 0);
      return Math.max(landed, CAPTION_AT_MS + Math.max(READ_FLOOR_MS, readMs * b.beat.caption.length));
    });
  const total = (readMs: number) => LEAD_MS + TAIL_MS + holds(readMs).reduce((a, b) => a + b, 0);
  let readMs = READ_SLOW_MS;
  while (readMs > READ_FAST_MS && total(readMs) > BUDGET_MS) readMs--;
  let t = plan.playStart;
  const hold = holds(readMs);
  const beats = plan.beats.map((b, i) => ({ ...b, start: t, end: (t += hold[i]) }));
  return { ...plan, beats, end: t };
}

/** Each beat as [start, end, motion] on the movie's clock, for tools that freeze a movie at a time. */
export const movieBeats = (movie: Movie) => moviePlan(movie).beats.map((b) => [b.start, b.end, b.motion]);

/** How long a movie runs from pressing Play to the Continue button, in milliseconds. */
export const movieLength = (movie: Movie) => {
  const plan = moviePlan(movie);
  return LEAD_MS + plan.end - plan.playStart + TAIL_MS;
};
