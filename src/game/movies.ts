import type { PixelSprite } from "../lib/pixel/types";
import type { ReelBeat, ReelFrame, ReelLesson, StoryCue, StoryLabel } from "../lib/pixel/story/types";
import { dressScene } from "./halloween";

/**
 * Clue movies, built from a lesson's Euphoria story data (content/euphoria/ifN-story.json): its art, its
 * story beats and its toggle cards. Captions are the lesson's own words. Every scene wears its Halloween
 * costume (halloween.ts). Each room's script picks which story or toggles play at which clue.
 */

type State = { chip?: string; frame: string; caption: string; cast?: StoryCue[]; labels?: StoryLabel[]; strip?: { h: number } | null };
export type Toggle = { title: string; states: State[]; strip?: StripSpec };
export type StripSpec = { at: { x: number; y: number }; count: number; mine: number; tileW: number; gap: number; restH: number };
type StoryData = {
  art: { frames: Record<string, ReelFrame>; stills?: Record<string, ReelFrame>; actors: Record<string, PixelSprite>; order: string[] };
  story: { title: string; beats: Partial<ReelBeat>[] };
};

/** A beat plus what the movie player shows around it: a chapter chip, and the toggle's tile strip. */
export type MovieBeat = ReelBeat & { chip?: string; strip?: { spec: StripSpec; h: number } };
export type Movie = { id: string; kicker: string; title: string; subtitle: string; lesson: ReelLesson & { beats: MovieBeat[] } };

export const beat = (frame: string, caption: string, cast: StoryCue[] = [], labels: StoryLabel[] = [], extra: Partial<MovieBeat> = {}): MovieBeat => ({
  frame,
  caption,
  cast,
  labels,
  ...extra,
});

/** Everything needed to cut movies from one lesson's story data. */
export const movieKit = (raw: unknown) => {
  const data = raw as StoryData;
  const frames: Record<string, ReelFrame> = Object.fromEntries(
    Object.entries({ ...data.art.frames, ...(data.art.stills ?? {}) }).map(([name, f]) => [name, dressScene(name, f)]),
  );
  return {
    storyTitle: data.story.title,
    /** The story card's beats (the app leaves `labels` out of a beat that has none). */
    storyBeats: () => data.story.beats.map((b) => beat(b.frame!, b.caption!, b.cast ?? [], b.labels ?? [])),
    /** A toggle card's states, played one after another, with its chips and tile strip. */
    toggleBeats: (t: Toggle) =>
      t.states.map((st) =>
        beat(st.frame, st.caption, st.cast ?? [], st.labels ?? [], {
          chip: st.chip,
          strip: t.strip && st.strip !== null ? { spec: t.strip, h: st.strip?.h ?? t.strip.restH } : undefined,
        }),
      ),
    make: (id: string, num: number, kicker: string, title: string, subtitle: string, beats: MovieBeat[]): Movie => ({
      id,
      kicker,
      title,
      subtitle,
      lesson: { num, title, frames, actors: data.art.actors, order: data.art.order, beats },
    }),
  };
};
