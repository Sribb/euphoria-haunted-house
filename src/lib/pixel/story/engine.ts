// Reused from Euphoria (euphoriaweb src/lib/pixel/story/engine.ts, branch story-lessons), copied on 2026-11-27.
// Only change: the import path for the sprite types. See "Reused from Euphoria" in the README.
/**
 * The story player: the iPhone app's story lessons, played on the web as a pure function
 * of time, so a paused or reduced-motion frame is the same picture the clock would draw.
 *
 * EVERY ANIMATION IS THE APP'S, with its own numbers and curves (euphoria-native parts/story.ts,
 * story-track.ts, story-stage.tsx, story-overlays.tsx, scene-card.tsx, clickthrough/timing.ts,
 * shared/motion/tokens.ts): walkers ease in and out and settle with a 1px bob, props travel on the
 * enter curve, a stamp swells to 1.08 and back, counted copies arrive one by one, a ghost fades a
 * copy into its outline, an actor carried into the next beat glides to its new spot, a new place
 * dips through the screen colour, labels arrive once the picture has landed, and the caption swaps
 * out, pauses, and comes back in. A beat holds for its motion, then for the time it takes to read.
 *
 * Two players use it: the landing page's carousel (buildPlan lays several lessons' beats end to end
 * on one clock, and each card slides into the middle, plays its whole story and hands over to the
 * next), and a lesson's story and toggle cards (src/features/pathway/story), which build one beat
 * slot per tap with makeBeatSlot so the learner sets the pace, as in the app.
 */
import type { PixelSprite } from "../types";
import type { ReelBeat, ReelLesson, ReelMotion, ScenePoint, StoryCue, StoryLabel } from "./types";

export const STAGE_W = 80;
export const STAGE_H = 60;

/* ── the app's curves (shared/motion/tokens.ts Ease) ── */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sy = (u: number) => ((ay * u + by) * u + cy) * u;
  const dx = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  return (p: number) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let u = p;
    for (let i = 0; i < 8; i++) {
      const err = sx(u) - p;
      if (Math.abs(err) < 1e-6) return sy(u);
      const d = dx(u);
      if (Math.abs(d) < 1e-6) break;
      u -= err / d;
    }
    let lo = 0, hi = 1;
    u = p;
    for (let i = 0; i < 40 && hi - lo > 1e-6; i++) {
      if (sx(u) < p) lo = u; else hi = u;
      u = (lo + hi) / 2;
    }
    return sy(u);
  };
}
/** M3 emphasized-decelerate: entrances. */
export const ENTER = cubicBezier(0.05, 0.7, 0.1, 1);
/** M3 emphasized-accelerate: exits. */
export const EXIT = cubicBezier(0.3, 0, 0.8, 0.15);
/** Standard: on-screen changes, and walkers. */
export const IN_OUT = cubicBezier(0.4, 0, 0.2, 1);

/* ── the app's timing ── */
export const ACTOR_ENTER_MS = 600;
export const ACTOR_SLIDE_MS = 1000;
export const ACTOR_EXIT_MS = 260;
const ACCENT_MS = 700;
const ACCENT_SCALE = 1.08;
export const GHOST_MS = 400;
const PLAY_FALLBACK_MS = 650;
const DEFAULT_FRAME_MS = 120;
const WALK_FRAME_MS = 150;
const BOB_MS = 120;
const BOB_PX = 1;
const STAMP_STAGGER_MS = 90;
const COUNT_IN_MS = 200;
const COUNT_RISE_PX = 1;
const APPEAR_MS = 150;
export const FRAME_FADE_MS = 450;
export const LABEL_IN_MS = 200;
export const LABEL_OUT_MS = 100;
export const CAPTION_OUT_MS = 200;
export const CAPTION_GAP_MS = 150;
export const CAPTION_IN_MS = 450;
export const CAPTION_DRIFT_PX = 8;
const GAP_MS = 700;
const BEAT_MAX_MS = 3500;
const READ_MS_PER_CHAR = 50;
const READ_MS_PER_WORD = Math.ceil(60000 / 230);

/** The carousel: a lesson's card sliding into the middle. */
export const SLIDE_MS = 760;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const seg = (t: number, a: number, b: number) => (b <= a ? (t >= b ? 1 : 0) : clamp01((t - a) / (b - a)));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/* ── cue timing (parts/story.ts cueStartMs / cueDurationMs / cueEndMs, storyMotionMs) ── */
const playMs = (sprite: PixelSprite | undefined, times = 1) => {
  const frames = sprite?.frames?.length ?? 0;
  if (frames < 2) return PLAY_FALLBACK_MS * Math.max(1, times);
  return frames * (sprite?.frameMs ?? DEFAULT_FRAME_MS) * Math.max(1, times);
};
export const cueStart = (c: StoryCue) => (c.instant ? 0 : Math.max(0, c.atMs ?? 0));
function cueDuration(c: StoryCue, actors: Record<string, PixelSprite>) {
  if (c.instant) return 0;
  if (c.ms !== undefined) return Math.max(0, c.ms);
  switch (c.do) {
    case "enter": return ACTOR_ENTER_MS;
    case "slide": return ACTOR_SLIDE_MS;
    case "exit": return ACTOR_EXIT_MS;
    case "play": return playMs(actors[c.actor], c.times ?? 1);
    case "count": return Math.max(0, Math.max(1, c.n ?? 1) - 1) * STAMP_STAGGER_MS + COUNT_IN_MS;
    case "ghost": return GHOST_MS;
    case "stamp": return ACCENT_MS;
  }
}
export const cueEnd = (c: StoryCue, actors: Record<string, PixelSprite>) =>
  c.instant ? 0 : cueStart(c) + cueDuration(c, actors) + (c.walk && (c.do === "enter" || c.do === "slide") ? BOB_MS * 2 : 0);
export const storyMotionMs = (beat: ReelBeat, actors: Record<string, PixelSprite>) => beat.cast.reduce((m, c) => Math.max(m, cueEnd(c, actors)), 0);

/** clickthrough/timing.ts beatHoldMs: the motion, THEN the time to read the caption. */
export function beatHoldMs(beat: ReelBeat, motion: number) {
  const words = beat.caption.split(/\s+/).filter(Boolean).length;
  const reading = Math.max(READ_MS_PER_CHAR * beat.caption.length, READ_MS_PER_WORD * words);
  return Math.min(BEAT_MAX_MS, motion) + Math.max(GAP_MS, reading);
}

/* ── actors ── */
export interface DrawItem { key: string; actor: string; sprite: PixelSprite; frame: number; x: number; y: number; opacity: number; swell: number }

const castIds = (beat: ReelBeat) => [...new Set(beat.cast.map((c) => c.actor))];
const size = (s: PixelSprite) => ({ w: s.rows[0].length, h: s.rows.length });
const arrivalBob = (e: number) => BOB_PX * (e < 0 || e > BOB_MS * 2 ? 0 : e < BOB_MS ? IN_OUT(e / BOB_MS) : 1 - IN_OUT((e - BOB_MS) / BOB_MS));

/**
 * One actor at beat time `tl` (Infinity for where it rests): its sprite (or walk cycle, or counted
 * copies, or a copy turning into its ghost), where it is, and how solid. The app's actorTrack,
 * evaluated at one instant.
 */
export function drawActor(id: string, beat: ReelBeat, lesson: Pick<ReelLesson, "actors">, tl: number): DrawItem[] {
  const sprite = lesson.actors[id];
  if (!sprite) return [];
  const cues = beat.cast.filter((c) => c.actor === id);
  const instants = cues.filter((c) => c.instant);
  const moving = cues.filter((c) => !c.instant).sort((a, b) => cueStart(a) - cueStart(b));
  const first = cues[0];
  let x = first.from?.x ?? first.at?.x ?? 0;
  let y = first.from?.y ?? first.at?.y ?? 0;
  let opacity = 0;
  let shown = false;
  let swell = 1;
  let spriteId = id;
  let frame = -1;
  let count: { n: number; perRow: number; gap: number; atMs: number; instant: boolean } | null = null;
  let ghostOne = 0;
  const ghostCopies = new Map<number, number>();
  let ghostId: string | undefined;

  for (const c of instants) {
    if (c.do === "exit") { opacity = 0; shown = false; continue; }
    if (c.do === "ghost") {
      ghostId = c.ghostSprite;
      if (c.index !== undefined) ghostCopies.set(c.index, 1); else ghostOne = 1;
      continue;
    }
    if (c.at) { x = c.at.x; y = c.at.y; }
    if (c.do === "count") count = { n: c.n ?? 1, perRow: c.perRow ?? 5, gap: c.gap ?? 1, atMs: 0, instant: true };
    opacity = 1;
    shown = true;
  }

  for (const c of moving) {
    const s = cueStart(c);
    if (tl < s) break;
    const e = tl - s;
    const d = cueDuration(c, lesson.actors);
    spriteId = id;
    frame = -1;
    swell = 1;
    switch (c.do) {
      case "enter":
      case "slide": {
        const from = c.from ?? { x, y };
        const to = c.at ?? { x, y };
        const p = (c.walk ? IN_OUT : ENTER)(seg(e, 0, d));
        x = lerp(from.x, to.x, p);
        y = lerp(from.y, to.y, p);
        if (!shown) opacity = ENTER(seg(e, 0, c.walk ? APPEAR_MS : c.do === "enter" ? d : Math.min(APPEAR_MS, d)));
        if (c.walk) {
          y -= arrivalBob(e - d);
          const walk = lesson.actors[`${id}-walk`];
          if (e < d && walk?.frames?.length) {
            spriteId = `${id}-walk`;
            frame = Math.floor(e / WALK_FRAME_MS) % walk.frames.length;
          }
        }
        break;
      }
      case "exit":
        opacity *= 1 - EXIT(seg(e, 0, d));
        break;
      case "stamp": {
        if (c.at) { x = c.at.x; y = c.at.y; }
        if (!shown) opacity = ENTER(seg(e, 0, Math.min(APPEAR_MS, d)));
        const half = d / 2;
        swell = e < half ? lerp(1, ACCENT_SCALE, ENTER(e / half)) : lerp(ACCENT_SCALE, 1, ENTER(seg(e, half, d)));
        break;
      }
      case "play": {
        if (c.at) { x = c.at.x; y = c.at.y; }
        if (!shown) opacity = 1;
        const n = sprite.frames?.length ?? 0;
        if (n > 1 && e < d) frame = Math.floor(e / (sprite.frameMs ?? DEFAULT_FRAME_MS)) % n;
        break;
      }
      case "count":
        if (c.at) { x = c.at.x; y = c.at.y; }
        count = { n: c.n ?? 1, perRow: c.perRow ?? 5, gap: c.gap ?? 1, atMs: s, instant: false };
        opacity = 1;
        break;
      case "ghost":
        ghostId = c.ghostSprite;
        if (!shown) opacity = 1;
        if (c.index !== undefined) ghostCopies.set(c.index, ENTER(seg(e, 0, d)));
        else ghostOne = ENTER(seg(e, 0, d));
        break;
    }
    shown = c.do !== "exit";
  }
  if (opacity <= 0) return [];

  const ghost = ghostId ? lesson.actors[ghostId] : undefined;
  const items: DrawItem[] = [];
  const push = (key: string, spr: PixelSprite, fr: number, px: number, py: number, op: number) => {
    if (op > 0.001) items.push({ key, actor: id, sprite: spr, frame: fr, x: px, y: py, opacity: op, swell });
  };
  if (count) {
    const { w, h } = size(sprite);
    for (let k = 0; k < count.n; k++) {
      const cx = x + (k % count.perRow) * (w + count.gap);
      const cy = y + Math.floor(k / count.perRow) * (h + count.gap);
      const at = count.atMs + k * STAMP_STAGGER_MS;
      const inP = count.instant ? 1 : ENTER(seg(tl, at, at + COUNT_IN_MS));
      const g = ghostCopies.get(k) ?? 0;
      push(`${id}-${k}`, sprite, -1, cx, cy + COUNT_RISE_PX * (1 - inP), opacity * inP * (1 - g));
      if (ghost) push(`${id}-${k}-ghost`, ghost, -1, cx, cy, opacity * inP * g);
    }
  } else {
    push(id, lesson.actors[spriteId] ?? sprite, frame, x, y, opacity * (1 - ghostOne));
    if (ghost) push(`${id}-ghost`, ghost, -1, x, y, opacity * ghostOne);
  }
  return items;
}

/* ── the plan: when every lesson and beat plays ── */
export interface BeatSlot {
  beat: ReelBeat;
  start: number;
  end: number;
  /** When everything in the beat has landed: the labels arrive then. */
  motion: number;
  /** The picture stays from the beat before, so actors carry over rather than start fresh. */
  carry: boolean;
  /** The place changes from the beat before: the app's dip through the screen colour. */
  newPicture: boolean;
  /** The beat before, finished: its actors, by key, to carry from or fade out. */
  before: Map<string, DrawItem>;
  /** Actors placed only by instant cues: in a carried picture they glide from where they were. */
  still: Set<string>;
  prevLabels: StoryLabel[];
  prevCaption: string | null;
}
export interface LessonSlot { lesson: ReelLesson; start: number; playStart: number; end: number; beats: BeatSlot[]; prevCaption: string }
export interface Plan { lessons: LessonSlot[]; loop: number }

/**
 * One beat, placed after `prev` (null for a story's first beat). The reel lays beats end to end on
 * one clock; a lesson's story card builds one per tap, from the beat the learner was on, so Back
 * and Next play the same carry-over, dip and label swaps the app plays.
 * `motion` is when the labels arrive (the picture has landed); pass `labelsAt` to override it, as a
 * toggle state does with its own cause-then-effect timing.
 */
export function makeBeatSlot(
  lesson: Pick<ReelLesson, "actors" | "order">,
  beat: ReelBeat,
  prev: BeatSlot | null,
  start = 0,
  labelsAt?: number,
): BeatSlot {
  const motion = labelsAt ?? storyMotionMs(beat, lesson.actors);
  const carry = !!prev && prev.beat.frame === beat.frame;
  const before = new Map<string, DrawItem>();
  if (carry) for (const it of drawBeat(prev, lesson, Infinity)) before.set(it.key, it);
  const still = new Set(castIds(beat).filter((id) => beat.cast.every((c) => c.actor !== id || c.instant)));
  return {
    beat,
    start,
    end: start + beatHoldMs(beat, storyMotionMs(beat, lesson.actors)),
    motion,
    carry,
    newPicture: !!prev && !carry,
    before,
    still,
    prevLabels: prev?.beat.labels ?? [],
    prevCaption: prev?.beat.caption ?? null,
  };
}

export function buildPlan(lessons: ReelLesson[]): Plan {
  let t = 0;
  const slots: LessonSlot[] = lessons.map((lesson, li) => {
    const start = t;
    const playStart = start + SLIDE_MS;
    let bt = playStart;
    const beats: BeatSlot[] = [];
    lesson.beats.forEach((beat, k) => {
      const slot = makeBeatSlot(lesson, beat, beats[k - 1] ?? null, bt);
      beats.push(slot);
      bt = slot.end;
    });
    t = bt;
    const last = lessons[(li - 1 + lessons.length) % lessons.length].beats;
    return { lesson, start, playStart, end: bt, beats, prevCaption: last[last.length - 1].caption };
  });
  return { lessons: slots, loop: t };
}

export const lessonIndexAt = (plan: Plan, t: number) => Math.max(0, plan.lessons.findIndex((l) => t >= l.start && t < l.end));

/**
 * Every actor in a beat at beat time `tl`, back to front in the art's order. In a carried picture,
 * an actor that only stands somewhere glides from its last spot (ACTOR_SLIDE_MS) and fades to its
 * new visibility (ACTOR_ENTER_MS, GHOST_MS for a ghost); an actor the beat no longer has fades out.
 */
export function drawBeat(slot: BeatSlot, lesson: Pick<ReelLesson, "actors" | "order">, tl: number): DrawItem[] {
  const rank = new Map(lesson.order.map((id, i) => [id, i]));
  const ids = castIds(slot.beat);
  const items: DrawItem[] = [];
  for (const id of ids) {
    if (!(slot.carry && slot.still.has(id))) {
      items.push(...drawActor(id, slot.beat, lesson, tl));
      continue;
    }
    const rest = new Map(drawActor(id, slot.beat, lesson, Infinity).map((it) => [it.key, it]));
    const was = new Map([...slot.before].filter(([, it]) => it.actor === id));
    for (const key of new Set([...rest.keys(), ...was.keys()])) {
      const r = rest.get(key);
      const p = was.get(key);
      const base = (r ?? p)!;
      const move = ENTER(seg(tl, 0, ACTOR_SLIDE_MS));
      const fade = ENTER(seg(tl, 0, key.endsWith("ghost") ? GHOST_MS : ACTOR_ENTER_MS));
      const op = lerp(p?.opacity ?? 0, r?.opacity ?? 0, fade);
      if (op <= 0.001) continue;
      items.push({
        ...base,
        x: r && p ? lerp(p.x, r.x, move) : base.x,
        y: r && p ? lerp(p.y, r.y, move) : base.y,
        opacity: op,
        swell: 1,
      });
    }
  }
  if (slot.carry) {
    const leave = 1 - EXIT(seg(tl, 0, ACTOR_EXIT_MS));
    for (const it of slot.before.values()) if (!ids.includes(it.actor) && leave > 0) items.push({ ...it, opacity: it.opacity * leave });
  }
  return items.sort((a, b) => (rank.get(a.actor) ?? 999) - (rank.get(b.actor) ?? 999));
}

/* ── the labels (story-overlays.tsx LabelPill) ── */
export interface LabelDraw { key: string; text: string; at: ScenePoint; tone: StoryLabel["tone"]; opacity: number }

/**
 * The labels at beat time `tl`. One that does not change stays. A new one arrives once the
 * picture has landed. A changed one leaves at once and its new words arrive then. One the beat no
 * longer has fades out.
 */
export function labelsFor(slot: BeatSlot, tl: number): LabelDraw[] {
  const out: LabelDraw[] = [];
  const same = (a: StoryLabel, b: StoryLabel) => a.text === b.text && a.tone === b.tone && a.at.x === b.at.x && a.at.y === b.at.y;
  for (const l of slot.beat.labels) {
    const prev = slot.prevLabels.find((p) => p.id === l.id);
    if (prev && same(prev, l)) {
      out.push({ key: l.id, text: l.text, at: l.at, tone: l.tone, opacity: 1 });
      continue;
    }
    if (prev) out.push({ key: `${l.id}-was`, text: prev.text, at: prev.at, tone: prev.tone, opacity: 1 - EXIT(seg(tl, 0, LABEL_OUT_MS)) });
    const at = prev ? Math.max(LABEL_OUT_MS, slot.motion) : slot.motion;
    out.push({ key: l.id, text: l.text, at: l.at, tone: l.tone, opacity: ENTER(seg(tl, at, at + LABEL_IN_MS)) });
  }
  for (const p of slot.prevLabels) {
    if (!slot.beat.labels.some((l) => l.id === p.id)) {
      out.push({ key: `${p.id}-was`, text: p.text, at: p.at, tone: p.tone, opacity: 1 - EXIT(seg(tl, 0, ACTOR_EXIT_MS)) });
    }
  }
  return out.filter((l) => l.opacity > 0.001);
}

export const project = (p: ScenePoint) => ({ x: p.x / STAGE_W, y: p.y / STAGE_H });

/* ── what a card shows ── */
export interface Shot { slot: BeatSlot; tl: number; alpha: number }

/** The beat playing on a lesson's card at loop time `t`; before its beats start it rests on its first frame. */
export function beatAtTime(lesson: LessonSlot, t: number) {
  const clamped = Math.min(Math.max(t, lesson.playStart), lesson.end - 1);
  const k = Math.max(0, lesson.beats.findIndex((b) => clamped >= b.start && clamped < b.end));
  const slot = lesson.beats[k];
  return { k, slot, tl: t < lesson.playStart ? 0 : clamped - slot.start };
}

/**
 * The pictures on a card at loop time `t`. When the place changes, the new picture fades in over
 * FRAME_FADE_MS while the old one, held still, fades out in a third of that: a dip through the
 * screen colour, never two places overlaid (story-stage.tsx).
 */
export function shotsFor(lesson: LessonSlot, t: number): Shot[] {
  const { k, slot, tl } = beatAtTime(lesson, t);
  if (!slot.newPicture || tl >= FRAME_FADE_MS) return [{ slot, tl, alpha: 1 }];
  const prev = lesson.beats[k - 1];
  return [
    { slot: prev, tl: prev.end - prev.start, alpha: 1 - EXIT(seg(tl, 0, FRAME_FADE_MS / 3)) },
    { slot, tl, alpha: IN_OUT(seg(tl, 0, FRAME_FADE_MS)) },
  ];
}

/* ── the subtitles (scene-card.tsx caption swap) ── */
export interface Caption { key: string; text: string; opacity: number; drift: number }

/** The caption at loop time `t`: the old one leaves drifting left, a pause, then the new one comes in. */
export function captionFor(lesson: LessonSlot, t: number): Caption | null {
  const leaving = (text: string | null, e: number, key: string): Caption | null =>
    text && e < CAPTION_OUT_MS ? { key, text, opacity: 1 - EXIT(e / CAPTION_OUT_MS), drift: -CAPTION_DRIFT_PX * EXIT(e / CAPTION_OUT_MS) } : null;
  if (t < lesson.playStart) return leaving(lesson.prevCaption, t - lesson.start, `${lesson.lesson.num}-prev`);
  const { k, slot, tl } = beatAtTime(lesson, t);
  if (tl < CAPTION_OUT_MS + CAPTION_GAP_MS) return leaving(slot.prevCaption, tl, `${lesson.lesson.num}-${k - 1}`);
  const inAt = CAPTION_OUT_MS + CAPTION_GAP_MS;
  return { key: `${lesson.lesson.num}-${k}`, text: slot.beat.caption, opacity: ENTER(seg(tl, inAt, inAt + CAPTION_IN_MS)), drift: 0 };
}

/* ── the carousel ── */
/** Where the track is, in lessons: whole while a lesson plays, between two while one slides in. */
export function trackPos(plan: Plan, t: number) {
  const i = lessonIndexAt(plan, t);
  const l = plan.lessons[i];
  return i - 1 + IN_OUT(seg(t, l.start, l.playStart));
}

/** A card's place relative to the middle, wrapped so the track loops: 0 centred, 1 one card right. */
export function cardOffset(j: number, pos: number, n: number) {
  const d = (((j - pos) % n) + n) % n;
  return d > n / 2 ? d - n : d;
}

/* ── ambient layer motion (scenes/types.ts SceneMotion, in scene pixels) ── */
export function layerMotion(m: ReelMotion | undefined, t: number) {
  if (!m) return { dx: 0, dy: 0, opacity: 1 };
  const c = t / m.periodMs + (m.phase ?? 0);
  const amp = m.amp ?? 1;
  switch (m.kind) {
    case "bob":
      return { dx: 0, dy: -amp * (0.5 - 0.5 * Math.cos(2 * Math.PI * c)), opacity: 1 };
    case "drift":
      return { dx: amp * Math.sin(2 * Math.PI * c), dy: 0, opacity: 1 };
    case "twinkle": {
      const min = m.min ?? 0.25;
      return { dx: 0, dy: 0, opacity: min + (1 - min) * (0.5 + 0.5 * Math.cos(2 * Math.PI * c)) };
    }
    case "rise": {
      const p = c - Math.floor(c);
      return { dx: 0, dy: -amp * p, opacity: 1 - p };
    }
    default:
      return { dx: 0, dy: 0, opacity: 1 };
  }
}
