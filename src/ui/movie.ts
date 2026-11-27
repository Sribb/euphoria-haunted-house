import { compileSprite } from "../lib/pixel/compile";
import type { PixelSprite } from "../lib/pixel/types";
import {
  buildPlan,
  beatAtTime,
  captionFor,
  drawBeat,
  ENTER,
  labelsFor,
  layerMotion,
  seg,
  shotsFor,
  STAGE_H,
  STAGE_W,
  type BeatSlot,
  type LessonSlot,
} from "../lib/pixel/story/engine";
import type { ReelFrame, StoryCue } from "../lib/pixel/story/types";
import type { Movie, MovieBeat } from "../game/movies";

/**
 * The fullscreen cutscene player. A title card waits for Play; then the whole movie runs on the story
 * engine's clock and cannot be skipped; Continue appears at the end. Drawn on a canvas at 4 pixels per
 * scene pixel (so glides and swells stay smooth) and scaled up by a whole number.
 */
const K = 4;
const LEAD_MS = 500;
const TAIL_MS = 900;
const TONES: Record<string, { fg: string; bg: string; border: string }> = {
  accent: { fg: "#FFD47A", bg: "#1C1210", border: "#E89A2E" },
  ink: { fg: "#E6E1D3", bg: "#151024", border: "#5C2496" },
  muted: { fg: "#9C95AE", bg: "#151024", border: "#3E3058" },
  warn: { fg: "#F08A80", bg: "#2A0F16", border: "#D63A3A" },
};

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

export type MovieHooks = { onStart?: () => void; onBeat?: (i: number) => void; onCue?: (c: StoryCue) => void; onEnd?: () => void };

export class MoviePlayer {
  private root = document.getElementById("movie")!;
  private canvas = this.root.querySelector("canvas") as HTMLCanvasElement;
  private g = this.canvas.getContext("2d")!;
  private screen = this.root.querySelector(".screen") as HTMLElement;
  private labelsEl = this.root.querySelector(".labels") as HTMLElement;
  private captionEl = this.root.querySelector(".caption") as HTMLElement;
  private chipEl = this.root.querySelector(".chip") as HTMLElement;
  private cardEl = this.root.querySelector(".titlecard") as HTMLElement;
  private endEl = this.root.querySelector(".continue") as HTMLButtonElement;
  private pills = new Map<string, HTMLElement>();

  constructor(private reducedMotion: boolean) {
    this.canvas.width = STAGE_W * K;
    this.canvas.height = STAGE_H * K;
    this.g.imageSmoothingEnabled = false;
    addEventListener("resize", () => this.fit());
  }

  /** Scale the stage by the largest whole number that fits, leaving room for the caption. */
  private fit() {
    const capH = Math.min(150, innerHeight * 0.2);
    const s = Math.max(1, Math.floor(Math.min((innerWidth - 24) / STAGE_W, (innerHeight - capH - 40) / STAGE_H)));
    this.screen.style.width = `${STAGE_W * s}px`;
    this.screen.style.height = `${STAGE_H * s}px`;
    this.root.style.setProperty("--stage-w", `${STAGE_W * s}px`);
  }

  /** Plays a movie. Resolves when the viewer presses Continue at the end. */
  play(movie: Movie, hooks: MovieHooks = {}, freezeAt?: number): Promise<void> {
    const plan = buildPlan([movie.lesson]).lessons[0];
    const t0 = plan.playStart - LEAD_MS;
    const end = plan.end + TAIL_MS;
    this.fit();
    this.root.hidden = false;
    this.cardEl.hidden = false;
    this.endEl.hidden = true;
    this.captionEl.textContent = "";
    this.chipEl.hidden = true;
    this.clearPills();
    (this.cardEl.querySelector(".kicker") as HTMLElement).textContent = movie.kicker;
    (this.cardEl.querySelector("h2") as HTMLElement).textContent = movie.title;
    (this.cardEl.querySelector(".sub") as HTMLElement).textContent = movie.subtitle;
    this.drawPoster(movie);

    return new Promise((resolve) => {
      const playBtn = this.cardEl.querySelector("button") as HTMLButtonElement;
      let started = false;
      const start = () => {
        if (started) return;
        started = true;
        removeEventListener("keydown", onKey);
        this.cardEl.hidden = true;
        hooks.onStart?.();
        const begin = performance.now();
        let lastBeat = -1;
        const fired = new Set<string>();
        const tick = () => {
          const t = freezeAt ?? t0 + (performance.now() - begin);
          const { k, slot, tl } = beatAtTime(plan, Math.max(t, plan.playStart));
          if (t >= plan.playStart && k !== lastBeat) { lastBeat = k; hooks.onBeat?.(k); }
          slot.beat.cast.forEach((c, i) => {
            const key = `${k}:${i}`;
            if (!c.instant && c.do !== "exit" && tl >= (c.atMs ?? 0) && !fired.has(key)) { fired.add(key); hooks.onCue?.(c); }
          });
          this.draw(plan, t);
          if (t < end || freezeAt !== undefined) {
            if (freezeAt === undefined) requestAnimationFrame(tick);
            return;
          }
          hooks.onEnd?.();
          this.endEl.hidden = false;
          this.endEl.focus();
          const finish = () => {
            this.endEl.removeEventListener("click", finish);
            removeEventListener("keydown", onEndKey);
            this.root.hidden = true;
            resolve();
          };
          const onEndKey = (e: KeyboardEvent) => {
            if ((e.code === "Enter" || e.code === "Space" || e.code === "KeyE") && !e.repeat) { e.preventDefault(); finish(); }
          };
          this.endEl.addEventListener("click", finish);
          setTimeout(() => addEventListener("keydown", onEndKey), 250);
        };
        requestAnimationFrame(tick);
      };
      const onKey = (e: KeyboardEvent) => {
        if ((e.code === "Enter" || e.code === "Space" || e.code === "KeyE") && !e.repeat) { e.preventDefault(); start(); }
      };
      playBtn.onclick = start;
      setTimeout(() => addEventListener("keydown", onKey), 250);
      if (freezeAt !== undefined) start();
    });
  }

  private drawPoster(movie: Movie) {
    const first = movie.lesson.beats[0];
    this.g.fillStyle = "#000";
    this.g.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawPlace(movie.lesson.frames[first.frame], 0);
    this.drawFx(0);
    this.g.fillStyle = "rgba(7,5,12,0.45)";
    this.g.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawPlace(frame: ReelFrame, t: number, alpha = 1) {
    const g = this.g;
    g.globalAlpha = alpha;
    g.drawImage(spriteCanvas(frame.base, -1), 0, 0);
    for (const l of frame.layers) {
      const m = this.reducedMotion ? { dx: 0, dy: 0, opacity: 1 } : layerMotion(l.motion, t);
      const n = l.sprite.frames?.length ?? 0;
      const fi = n && !this.reducedMotion ? Math.floor(t / (l.sprite.frameMs ?? 120)) % n : -1;
      g.globalAlpha = alpha * m.opacity;
      g.drawImage(spriteCanvas(l.sprite, fi), Math.round((l.x + m.dx) * K), Math.round((l.y + m.dy) * K));
    }
    g.globalAlpha = 1;
  }

  private draw(plan: LessonSlot, t: number) {
    const g = this.g;
    const lesson = plan.lesson;
    g.fillStyle = "#000";
    g.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const shots = t < plan.playStart ? [{ slot: plan.beats[0], tl: 0, alpha: ENTER(seg(t, plan.playStart - LEAD_MS, plan.playStart)) }] : shotsFor(plan, t);
    for (const shot of shots) {
      const tl = this.reducedMotion ? shot.slot.end - shot.slot.start : shot.tl;
      this.drawPlace(lesson.frames[shot.slot.beat.frame], t, shot.alpha);
      for (const it of drawBeat(shot.slot, lesson, tl)) {
        const img = spriteCanvas(it.sprite, it.frame);
        const w = img.width * it.swell, h = img.height * it.swell;
        g.globalAlpha = shot.alpha * it.opacity;
        g.drawImage(img, Math.round(it.x * K - (w - img.width) / 2), Math.round(it.y * K - (h - img.height) / 2), Math.round(w), Math.round(h));
      }
      this.drawStrip(plan, shot.slot, tl, shot.alpha);
      g.globalAlpha = 1;
    }
    this.drawFx(t);
    const cur = beatAtTime(plan, Math.max(t, plan.playStart));
    this.drawLabels(t < plan.playStart ? null : cur.slot, this.reducedMotion ? Infinity : cur.tl);
    const cap = t < plan.playStart ? null : captionFor(plan, t);
    this.captionEl.textContent = cap?.text ?? "";
    this.captionEl.style.opacity = String(cap?.opacity ?? 0);
    this.captionEl.style.transform = `translateX(${(cap?.drift ?? 0) * 2}px)`;
    const chip = (cur.slot.beat as MovieBeat).chip;
    this.chipEl.hidden = !chip || t < plan.playStart;
    if (chip) this.chipEl.textContent = chip;
  }

  /** The toggle's ten equal pieces of the company, Maya's lit in gold. Heights tween between states. */
  private drawStrip(plan: LessonSlot, slot: BeatSlot, tl: number, alpha: number) {
    const b = slot.beat as MovieBeat;
    if (!b.strip) return;
    const i = plan.beats.indexOf(slot);
    const prev = i > 0 ? (plan.beats[i - 1].beat as MovieBeat).strip : undefined;
    const from = prev ? prev.h : 0;
    const p = ENTER(seg(tl, slot.motion, slot.motion + 500));
    const h = from + (b.strip.h - from) * p;
    const { at, count, mine, tileW, gap } = b.strip.spec;
    const g = this.g;
    for (let k = 0; k < count; k++) {
      const x = (at.x + k * (tileW + gap)) * K;
      const top = Math.round((at.y - h) * K);
      g.globalAlpha = alpha * (k === mine ? 1 : 0.5);
      g.fillStyle = k === mine ? "#E89A2E" : "#5E5870";
      g.fillRect(x, top, tileW * K, at.y * K - top);
      if (k === mine) { g.fillStyle = "#FFD47A"; g.fillRect(x, top, tileW * K, K); }
    }
    g.globalAlpha = 1;
  }

  /** Halloween atmosphere over every scene: fog drifting along the ground and a flickering candle vignette. */
  private drawFx(t: number) {
    const g = this.g;
    const W = this.canvas.width, H = this.canvas.height;
    const still = this.reducedMotion;
    for (let i = 0; i < 4; i++) {
      const x = ((still ? i * 90 : t * 0.012 * (i % 2 ? 1 : -0.7) + i * 90) % (W + 160)) - 80;
      const y = H - 18 * K + (i % 2) * 6 * K;
      const grad = g.createRadialGradient(x, y, 0, x, y, 38 * K);
      grad.addColorStop(0, "rgba(156,149,174,0.16)");
      grad.addColorStop(1, "rgba(156,149,174,0)");
      g.fillStyle = grad;
      g.fillRect(x - 40 * K, y - 20 * K, 80 * K, 40 * K);
    }
    const flick = still ? 0 : 0.04 * Math.sin(t * 0.011) + 0.03 * Math.sin(t * 0.029);
    const v = g.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.5, W * 0.62);
    v.addColorStop(0, "rgba(7,5,12,0)");
    v.addColorStop(1, `rgba(7,5,12,${0.62 + flick})`);
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);
  }

  private clearPills() {
    for (const el of this.pills.values()) el.remove();
    this.pills.clear();
  }

  private drawLabels(slot: BeatSlot | null, tl: number) {
    const seen = new Set<string>();
    for (const l of slot ? labelsFor(slot, tl) : []) {
      seen.add(l.key);
      let el = this.pills.get(l.key);
      if (!el) {
        el = document.createElement("div");
        el.className = "pill";
        this.labelsEl.append(el);
        this.pills.set(l.key, el);
      }
      const tone = TONES[l.tone] ?? TONES.ink;
      el.textContent = l.text;
      el.style.left = `${(l.at.x / STAGE_W) * 100}%`;
      el.style.top = `${(l.at.y / STAGE_H) * 100}%`;
      el.style.color = tone.fg;
      el.style.background = tone.bg;
      el.style.borderColor = tone.border;
      el.style.opacity = String(l.opacity);
    }
    for (const [key, el] of this.pills) if (!seen.has(key)) { el.remove(); this.pills.delete(key); }
  }
}
