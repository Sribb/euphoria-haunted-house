import { compileSprite } from "../lib/pixel/compile";
import type { PixelSprite } from "../lib/pixel/types";
import { beatAtTime, drawBeat, ENTER, layerMotion, seg, shotsFor, STAGE_H, STAGE_W, type BeatSlot, type LessonSlot, type Shot } from "../lib/pixel/story/engine";
import type { ReelFrame } from "../lib/pixel/story/types";
import type { Cameo, Movie, MovieBeat } from "../game/movies";

/**
 * Paints a clue movie: the scene, the room's ghost drifting through it, the actors and the tile strip,
 * then the "memory" grade that sets these scenes apart from the same art on euphoriainv.com. The grade is
 * drained colour, a violet wash, banks of fog and a vignette that breathes. Every part of it is a flat
 * tone or a soft gradient; there is no grain.
 *
 * The canvas has K pixels per scene pixel, so glides and swells stay smooth. CSS scales it up by a whole
 * number. With reduced motion every beat shows its finished picture: no fog drift, no breathing, no bob.
 */
const K = 4;
const W = STAGE_W * K;
const H = STAGE_H * K;

/** How much colour the memory loses (0 none, 1 grey), and how strong the violet wash is. */
const DRAIN = 0.26;
const WASH = 0.34;
const WASH_COLOUR = "#8552E8";

/** A fog bank's outline: [x, width] of each row from the top, in scene pixels. Drawn as flat bars. */
const BANK: [number, number][] = [[8, 12], [3, 24], [0, 32], [2, 27], [10, 13]];
const BANK_W = 32;
/** The banks: top row, row height, width stretch, start x, and drift in scene pixels a second. */
const FOG = [
  { y: 46, tall: 2, stretch: 1.5, x: 6, speed: 1.5 },
  { y: 51, tall: 2, stretch: 1.9, x: 48, speed: -1.0 },
  { y: 42, tall: 1, stretch: 1.2, x: 70, speed: 0.7 },
  { y: 54, tall: 2, stretch: 1.3, x: 96, speed: 2.1 },
  { y: 33, tall: 1, stretch: 0.9, x: 24, speed: -0.5 },
];
const FOG_COLOUR = "#B4A8DC";
const FOG_ALPHA = 0.085;

/** The ghost in its memory: how solid it gets, and the pale wash that turns the sprite spectral. */
const CAMEO_ALPHA = 0.34;
const CAMEO_WASH = "rgba(214, 198, 255, 0.45)";

const spriteCache = new WeakMap<PixelSprite, HTMLCanvasElement[]>();
/** A sprite drawn once per frame into its own canvas, at K pixels per sprite pixel. Index 0 is the still. */
const spriteCanvas = (sp: PixelSprite, frame: number) => {
  let list = spriteCache.get(sp);
  if (!list) {
    const all = [sp.rows, ...(sp.frames ?? [])];
    list = all.map((rows) => {
      const { width, height, rects } = compileSprite({ ...sp, rows, frames: undefined });
      const c = document.createElement("canvas");
      c.width = width * K;
      c.height = height * K;
      const g = c.getContext("2d")!;
      for (const r of rects) { g.fillStyle = r.fill; g.fillRect(r.x * K, r.y * K, r.w * K, r.h * K); }
      return c;
    });
    spriteCache.set(sp, list);
  }
  return frame < 0 || list.length === 1 ? list[0] : list[1 + (frame % (list.length - 1))];
};

const spectreCache = new WeakMap<PixelSprite, HTMLCanvasElement>();
/** A ghost sprite washed pale, so it reads as a spirit and not as a faded sticker. */
const spectre = (sp: PixelSprite) => {
  let c = spectreCache.get(sp);
  if (!c) {
    const src = spriteCanvas(sp, -1);
    c = document.createElement("canvas");
    c.width = src.width;
    c.height = src.height;
    const g = c.getContext("2d")!;
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = CAMEO_WASH;
    g.fillRect(0, 0, c.width, c.height);
    spectreCache.set(sp, c);
  }
  return c;
};

export class MoviePainter {
  private g: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, private still: boolean) {
    canvas.width = W;
    canvas.height = H;
    this.g = canvas.getContext("2d")!;
    this.g.imageSmoothingEnabled = false;
  }

  /** The movie's first scene, waiting behind the title card. */
  poster(movie: Movie) {
    this.g.fillStyle = "#000";
    this.g.fillRect(0, 0, W, H);
    this.place(movie.lesson.frames[movie.lesson.beats[0].frame], 0);
    this.grade(0);
  }

  /** The movie at plan time `t`. Before the first beat the opening scene fades up from black over `leadMs`. */
  frame(movie: Movie, plan: LessonSlot, t: number, leadMs: number) {
    const g = this.g;
    const lesson = plan.lesson;
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    const now = beatAtTime(plan, Math.max(t, plan.playStart)).slot;
    const shots: Shot[] = this.still
      ? [{ slot: now, tl: now.end - now.start, alpha: 1 }]
      : t < plan.playStart
        ? [{ slot: now, tl: 0, alpha: ENTER(seg(t, plan.playStart - leadMs, plan.playStart)) }]
        : shotsFor(plan, t);
    for (const shot of shots) {
      this.place(lesson.frames[shot.slot.beat.frame], t, shot.alpha);
      if (movie.cameo && plan.beats[movie.cameo.beat] === shot.slot) this.cameo(movie.cameo, plan, shot);
      for (const it of drawBeat(shot.slot, lesson, shot.tl)) {
        const img = spriteCanvas(it.sprite, it.frame);
        const w = img.width * it.swell, h = img.height * it.swell;
        g.globalAlpha = shot.alpha * it.opacity;
        g.drawImage(img, Math.round(it.x * K - (w - img.width) / 2), Math.round(it.y * K - (h - img.height) / 2), Math.round(w), Math.round(h));
      }
      this.strip(plan, shot);
      g.globalAlpha = 1;
    }
    this.grade(t);
  }

  private place(frame: ReelFrame, t: number, alpha = 1) {
    const g = this.g;
    g.globalAlpha = alpha;
    g.drawImage(spriteCanvas(frame.base, -1), 0, 0);
    for (const l of frame.layers) {
      const m = this.still ? { dx: 0, dy: 0, opacity: 1 } : layerMotion(l.motion, t);
      const n = l.sprite.frames?.length ?? 0;
      const fi = n && !this.still ? Math.floor(t / (l.sprite.frameMs ?? 120)) % n : -1;
      g.globalAlpha = alpha * m.opacity;
      g.drawImage(spriteCanvas(l.sprite, fi), Math.round((l.x + m.dx) * K), Math.round((l.y + m.dy) * K));
    }
    g.globalAlpha = 1;
  }

  /**
   * The room's ghost, behind the actors so it never covers one. It gathers out of the dark once the beat
   * is under way, hangs there with a slow bob, and thins out again before the beat ends. On the last beat
   * it stays, so the memory closes with the ghost in it.
   */
  private cameo(c: Cameo, plan: LessonSlot, shot: Shot) {
    const dur = shot.slot.end - shot.slot.start;
    const last = c.beat === plan.beats.length - 1;
    const show = this.still ? 1 : ENTER(seg(shot.tl, 350, 1500)) * (last ? 1 : 1 - seg(shot.tl, dur - 700, dur - 100));
    const bob = this.still ? 0 : Math.sin(shot.tl / 800);
    this.g.globalAlpha = shot.alpha * show * CAMEO_ALPHA;
    this.g.drawImage(spectre(c.sprite), c.x * K, Math.round((c.y + bob) * K));
    this.g.globalAlpha = 1;
  }

  /** The toggle's ten equal pieces of the company, Maya's lit in gold. Heights tween between states. */
  private strip(plan: LessonSlot, shot: Shot) {
    const slot: BeatSlot = shot.slot;
    const b = slot.beat as MovieBeat;
    if (!b.strip) return;
    const i = plan.beats.indexOf(slot);
    const prev = i > 0 ? (plan.beats[i - 1].beat as MovieBeat).strip : undefined;
    const from = prev ? prev.h : 0;
    const h = from + (b.strip.h - from) * ENTER(seg(shot.tl, slot.motion, slot.motion + 500));
    const { at, count, mine, tileW, gap } = b.strip.spec;
    const g = this.g;
    for (let k = 0; k < count; k++) {
      const x = (at.x + k * (tileW + gap)) * K;
      const top = Math.round((at.y - h) * K);
      g.globalAlpha = shot.alpha * (k === mine ? 1 : 0.5);
      g.fillStyle = k === mine ? "#E89A2E" : "#5E5870";
      g.fillRect(x, top, tileW * K, at.y * K - top);
      if (k === mine) { g.fillStyle = "#FFD47A"; g.fillRect(x, top, tileW * K, K); }
    }
    g.globalAlpha = 1;
  }

  /** The memory look, over the finished picture: drained colour, a violet wash, fog, and the vignette. */
  private grade(t: number) {
    const g = this.g;
    g.globalCompositeOperation = "saturation";
    g.globalAlpha = DRAIN;
    g.fillStyle = "#808080";
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "soft-light";
    g.globalAlpha = WASH;
    g.fillStyle = WASH_COLOUR;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "source-over";

    // fog: flat banks sliding along the ground, each wrapping from one edge to the other
    g.globalAlpha = FOG_ALPHA;
    g.fillStyle = FOG_COLOUR;
    for (const b of FOG) {
      const w = BANK_W * b.stretch;
      const span = STAGE_W + w;
      const x = ((((b.x + (this.still ? 0 : (b.speed * t) / 1000)) % span) + span) % span) - w;
      BANK.forEach(([rx, rw], i) => g.fillRect(Math.round((x + rx * b.stretch) * K), (b.y + i * b.tall) * K, Math.round(rw * b.stretch * K), b.tall * K));
    }
    g.globalAlpha = 1;

    // the vignette: violet at the rim of the clear middle, near black in the corners, breathing slowly
    const breath = this.still ? 0 : Math.sin(t / 1100);
    const v = g.createRadialGradient(W / 2, H * 0.46, H * (0.3 + 0.025 * breath), W / 2, H * 0.5, W * 0.66);
    v.addColorStop(0, "rgba(11, 7, 20, 0)");
    v.addColorStop(0.55, `rgba(36, 16, 70, ${0.3 + 0.05 * breath})`);
    v.addColorStop(1, `rgba(7, 5, 12, ${0.86 + 0.05 * breath})`);
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);
  }
}
