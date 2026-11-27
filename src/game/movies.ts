import story from "../../content/euphoria/if1-story.json";
import lesson from "../../content/euphoria/investing-fundamentals-1-5.json";
import type { PixelSprite } from "../lib/pixel/types";
import type { ReelBeat, ReelFrame, ReelLesson, StoryCue, StoryLabel } from "../lib/pixel/story/types";
import type { ClueId } from "./foyer";
import { dressScene } from "./halloween";

/**
 * The three cutscenes, one per clue, built from Euphoria's IF1 story art and cards. Captions are the
 * lesson's own words. The scenes wear their Halloween costume (halloween.ts).
 *   drawer    = the story "Maya's birthday money" (inflation)
 *   portraits = the toggles "own a piece" and "lend it"
 *   clock     = the growth ledger's years, then the lesson's "time does most of the work" card
 */

type State = { chip?: string; frame: string; caption: string; cast?: StoryCue[]; labels?: StoryLabel[]; strip?: { h: number } | null };
type Toggle = { title: string; states: State[]; strip?: StripSpec };
export type StripSpec = { at: { x: number; y: number }; count: number; mine: number; tileW: number; gap: number; restH: number };

/** A beat plus what the movie player shows around it: a chapter chip, and the toggle's tile strip. */
export type MovieBeat = ReelBeat & { chip?: string; strip?: { spec: StripSpec; h: number } };
export type Movie = { id: ClueId; kicker: string; title: string; subtitle: string; lesson: ReelLesson & { beats: MovieBeat[] } };

const art = story.art as unknown as {
  frames: Record<string, ReelFrame>;
  stills: Record<string, ReelFrame>;
  actors: Record<string, PixelSprite>;
  order: string[];
};

const frames: Record<string, ReelFrame> = Object.fromEntries(
  Object.entries({ ...art.frames, ...art.stills }).map(([name, f]) => [name, dressScene(name, f)]),
);

const beat = (frame: string, caption: string, cast: StoryCue[] = [], labels: StoryLabel[] = [], extra: Partial<MovieBeat> = {}): MovieBeat => ({
  frame,
  caption,
  cast,
  labels,
  ...extra,
});

const fromToggle = (t: Toggle): MovieBeat[] =>
  t.states.map((st) =>
    beat(st.frame, st.caption, st.cast ?? [], st.labels ?? [], {
      chip: st.chip,
      strip: t.strip && st.strip !== null ? { spec: t.strip, h: st.strip?.h ?? t.strip.restH } : undefined,
    }),
  );

const make = (id: ClueId, num: number, kicker: string, title: string, subtitle: string, beats: MovieBeat[]): Movie => ({
  id,
  kicker,
  title,
  subtitle,
  lesson: { num, title, frames, actors: art.actors, order: art.order, beats },
});

// ---- the clock: growth on growth, with the ledger's numbers (5% a year on $100)
const ledger = story.ledger as { start: number; ratePercent: number; captions: { start: string; years: string[] } };
const money = (v: number) => `$${v.toFixed(2).replace(/\.00$/, "")}`;
const totals = [1, 2, 3].map((y) => ledger.start * (1 + ledger.ratePercent / 100) ** y);
type Card = { takeaway: string; detail: string };
const steps = (lesson as { lessons: { steps: { type: string; cards?: Card[] }[] }[] }).lessons[0].steps;
const timeCard = steps.find((st) => st.type === "summaryCards")!.cards![2];
const label = (id: string, text: string, x: number, y: number, tone: StoryLabel["tone"] = "accent"): StoryLabel => ({ id, text, at: { x, y }, tone });
const glint = (x: number, y: number, atMs = 300): StoryCue => ({ actor: "glint", do: "play", at: { x, y }, atMs });

const clockBeats: MovieBeat[] = [
  beat("coin-plus", ledger.captions.start, [glint(44, 32)], [label("total", money(ledger.start), 28, 52), label("rate", "+5% a year", 50, 52, "ink")]),
  beat("stacks", ledger.captions.years[0], [glint(36, 44)], [label("total", money(totals[0]), 28, 52)]),
  beat("stacks", ledger.captions.years[1], [glint(51, 41)], [label("total", money(totals[1]), 28, 52)]),
  beat("stacks", ledger.captions.years[2], [glint(65, 36)], [label("total", money(totals[2]), 28, 52)]),
  beat("orchard-moon", `${timeCard.takeaway}. ${timeCard.detail}`, [glint(59, 30, 400), glint(65, 27, 900), glint(70, 17, 1400)]),
];

export const MOVIES: Record<ClueId, Movie> = {
  drawer: make(
    "drawer",
    1,
    "A memory in the drawer",
    story.story.title,
    "Why the safest place for money is not safe",
    // the app leaves `labels` out of a beat that has none
    (story.story.beats as unknown as Partial<ReelBeat>[]).map((b) => beat(b.frame!, b.caption!, b.cast ?? [], b.labels ?? [])),
  ),
  portraits: make("portraits", 2, "The portraits remember", "Own a piece, or lend it", "Two ways to put money to work", [
    ...fromToggle(story.own as Toggle),
    ...fromToggle(story.lend as Toggle),
  ]),
  clock: make("clock", 3, "The clock strikes", "Watch Maya's money grow", "Growth on growth", clockBeats),
};
