import { candleLit, candleUnlit } from "../art/candle";
import { beatAtTime, captionFor, labelsFor, STAGE_H, STAGE_W, type LessonSlot } from "../lib/pixel/story/engine";
import type { StoryCue } from "../lib/pixel/story/types";
import { spriteToSvgMarkup } from "../lib/pixel/svg";
import type { PixelSprite } from "../lib/pixel/types";
import type { Movie, MovieBeat } from "../game/movies";
import { MoviePainter } from "./movie-draw";
import { LEAD_MS, moviePlan, TAIL_MS } from "./movie-timing";

export { movieBeats, movieLength, moviePlan } from "./movie-timing";

/**
 * The fullscreen cutscene player. A title card waits for Play. Then the whole movie runs on its own clock
 * and cannot be skipped, paused or hurried, and Continue appears at the end. A row of candles under the
 * caption shows how long the movie is: one per beat, lit as the beats play.
 *
 * movie-timing.ts decides when each beat plays, movie-draw.ts paints the picture, and this file runs the
 * clock and everything around the picture: the frame's size, the caption, label pills, chip and candles.
 */
const TONES: Record<string, { fg: string; bg: string; border: string }> = {
  accent: { fg: "#FFD47A", bg: "#1C1210", border: "#E89A2E" },
  ink: { fg: "#E6E1D3", bg: "#151024", border: "#5C2496" },
  muted: { fg: "#9C95AE", bg: "#151024", border: "#3E3058" },
  warn: { fg: "#F08A80", bg: "#2A0F16", border: "#D63A3A" },
};

/** The gilt frame needs this much screen; smaller screens get a thin rule so the picture stays large. */
const FRAME_MIN_W = 700;
const FRAME_MIN_H = 600;
/** What the frame, or the thin rule, adds around the stage (CSS pixels, both sides together). */
const GILT = { x: 96, y: 98 };
const RULE = { x: 8, y: 8 };
/** Room the Continue button needs: beside the picture if the screen is wide, otherwise under it. */
const CONTINUE_W = 250;
const CONTINUE_H = 98;
const EDGE = 12;
/** A phone on its side: the caption column beside the picture, its width limits, and the gap between. */
const SIDE_MIN = 240;
const SIDE_MAX = 420;
const SIDE_GAP = 16;
/** The row of candles with its margin. */
const PIPS_H = 42;
/** The longest one frame may advance the clock. A hidden tab or a stalled page pauses the movie; it never skips ahead. */
const MAX_STEP_MS = 250;

const candle = (sp: PixelSprite, rows = sp.rows) => spriteToSvgMarkup({ ...sp, rows, frames: undefined }, 2);
const PIP_UNLIT = candle(candleUnlit);
const PIP_LIT = candle(candleLit);
const PIP_FLICKER = (candleLit.frames ?? [candleLit.rows]).map((rows) => candle(candleLit, rows));
const PIP_FRAME_MS = candleLit.frameMs ?? 150;

const isGo = (e: KeyboardEvent) => e.code === "Enter" || e.code === "Space" || e.code === "KeyE";
/** A key held down from before a button appeared must not press it. */
const noRepeat = (e: KeyboardEvent) => { if (e.repeat) e.preventDefault(); };
/** How long a button ignores the keyboard after it appears: the press that brought it up is not a press of it. */
const ARM_MS = 250;

/**
 * Calls `done` once, on a deliberate press of `button`: a click or tap straight away, or Enter, Space or E
 * (from anywhere on the page) once the button has been up for ARM_MS.
 */
const onPress = (button: HTMLButtonElement, done: () => void) => {
  let armed = false;
  let over = false;
  const go = () => {
    if (over) return;
    over = true;
    button.onclick = null;
    removeEventListener("keydown", onKey);
    done();
  };
  const onKey = (e: KeyboardEvent) => { if (isGo(e) && !e.repeat) { e.preventDefault(); go(); } };
  // a click made by the keyboard has no click count; a mouse click or a tap does
  button.onclick = (e) => { if (armed || e.detail > 0) go(); };
  setTimeout(() => {
    armed = true;
    if (!over) addEventListener("keydown", onKey);
  }, ARM_MS);
};

export type MovieHooks = { onStart?: () => void; onBeat?: (i: number) => void; onCue?: (c: StoryCue) => void; onEnd?: () => void };

export class MoviePlayer {
  private root = document.getElementById("movie")!;
  private frameEl = this.root.querySelector(".frame") as HTMLElement;
  private screen = this.root.querySelector(".screen") as HTMLElement;
  private labelsEl = this.root.querySelector(".labels") as HTMLElement;
  private captionEl = this.root.querySelector(".caption") as HTMLElement;
  private pipsEl = this.root.querySelector(".pips") as HTMLElement;
  private progressEl = this.root.querySelector(".progress") as HTMLElement;
  private chipEl = this.root.querySelector(".chip") as HTMLElement;
  private cardEl = this.root.querySelector(".titlecard") as HTMLElement;
  private playEl = this.root.querySelector(".play") as HTMLButtonElement;
  private endEl = this.root.querySelector(".continue") as HTMLButtonElement;
  private measureEl = document.createElement("p");
  private painter: MoviePainter;
  private pills = new Map<string, HTMLElement>();
  private captions: string[] = [];
  private captionText = "";
  private pipHtml: string[] = [];

  constructor(private reducedMotion: boolean) {
    this.painter = new MoviePainter(this.root.querySelector("canvas") as HTMLCanvasElement, reducedMotion);
    // an unseen copy of the caption, to find how tall the movie's longest caption is at this size
    this.measureEl.className = "caption measure";
    this.measureEl.setAttribute("aria-hidden", "true");
    this.frameEl.append(this.measureEl);
    this.playEl.addEventListener("keydown", noRepeat);
    this.endEl.addEventListener("keydown", noRepeat);
    addEventListener("resize", () => this.fit());
    document.fonts?.addEventListener("loadingdone", () => this.fit());
  }

  /**
   * Sizes the stage: the largest whole number of device pixels per scene pixel that leaves room for the
   * frame, the movie's tallest caption, the candles and the Continue button. The caption's height is
   * fixed here too, so the picture never moves when a caption wraps. Three layouts: the gilt frame with
   * the caption under it, a phone held upright (thin rule, caption under), and a phone on its side
   * (thin rule, caption beside the picture).
   */
  private fit() {
    if (this.root.hidden) return;
    const dpr = window.devicePixelRatio || 1;
    const framed = innerWidth >= FRAME_MIN_W && innerHeight >= FRAME_MIN_H;
    const side = !framed && innerWidth >= innerHeight * 1.4;
    const rim = framed ? GILT : RULE;
    this.root.classList.toggle("framed", framed);
    this.root.classList.toggle("side", side);
    this.root.classList.toggle("portrait", !framed && innerHeight >= innerWidth * 1.5);
    const wide = innerWidth - rim.x - (framed ? 2 * EDGE : 0) - (side ? SIDE_MIN + SIDE_GAP + 2 * EDGE : 0);
    const tall = innerHeight - rim.y - (side ? 2 * EDGE : 60);
    let n = Math.max(1, Math.floor(Math.min(wide / STAGE_W, tall / STAGE_H) * dpr));
    for (; ; n--) {
      const w = (STAGE_W * n) / dpr;
      const sideW = Math.min(SIDE_MAX, innerWidth - w - rim.x - SIDE_GAP - 2 * EDGE);
      const reserve = side || (innerWidth - w - rim.x) / 2 >= CONTINUE_W ? 0 : CONTINUE_H;
      this.screen.style.width = `${w}px`;
      this.screen.style.height = `${(STAGE_H * n) / dpr}px`;
      this.root.style.setProperty("--stage-w", `${w}px`);
      this.root.style.setProperty("--side-w", `${sideW}px`);
      this.root.style.setProperty("--reserve", `${reserve}px`);
      this.root.classList.toggle("compact", w < 480);
      this.root.classList.toggle("roomy", framed && w >= 560);
      this.root.classList.toggle("grand", framed && w >= 800);
      let capH = 0;
      for (const c of this.captions) { this.measureEl.textContent = c; capH = Math.max(capH, this.measureEl.offsetHeight); }
      this.measureEl.textContent = "";
      this.captionEl.style.minHeight = `${capH}px`;
      // beside the picture, the caption and candles must also leave the corner under them for Continue
      const fits = this.frameEl.offsetHeight <= innerHeight - reserve - 2 * EDGE && (!side || capH + PIPS_H <= innerHeight - CONTINUE_H - 2 * EDGE);
      if (n === 1 || fits) break;
    }
  }

  /** Plays a movie. Resolves when the viewer presses Continue at the end. */
  play(movie: Movie, hooks: MovieHooks = {}, freezeAt?: number): Promise<void> {
    const plan = moviePlan(movie);
    const end = plan.end + TAIL_MS;
    this.captions = movie.lesson.beats.map((b) => b.caption);
    this.root.hidden = false;
    this.root.classList.add("waiting");
    this.cardEl.hidden = false;
    this.endEl.hidden = true;
    this.chipEl.hidden = true;
    this.setCaption("", 0, 0);
    this.clearPills();
    (this.cardEl.querySelector(".kicker") as HTMLElement).textContent = movie.kicker;
    (this.cardEl.querySelector("h2") as HTMLElement).textContent = movie.title;
    (this.cardEl.querySelector(".sub") as HTMLElement).textContent = movie.subtitle;
    this.pipsEl.innerHTML = "<i></i>".repeat(plan.beats.length);
    this.pipHtml = [];
    this.showPips(-1, 0);
    this.fit();
    this.painter.poster(movie);

    return new Promise((resolve) => {
      const start = () => {
        this.cardEl.hidden = true;
        this.root.classList.remove("waiting");
        this.root.focus({ preventScroll: true });
        hooks.onStart?.();
        let t = plan.playStart - LEAD_MS;
        let last = performance.now();
        let lastBeat = -1;
        const fired = new Set<string>();
        const tick = () => {
          const now = performance.now();
          t = freezeAt ?? t + Math.min(now - last, MAX_STEP_MS);
          last = now;
          const { k, slot, tl } = beatAtTime(plan, Math.max(t, plan.playStart));
          if (t >= plan.playStart && k !== lastBeat) { lastBeat = k; hooks.onBeat?.(k); }
          slot.beat.cast.forEach((c, i) => {
            const key = `${k}:${i}`;
            if (!c.instant && c.do !== "exit" && tl >= (c.atMs ?? 0) && !fired.has(key)) { fired.add(key); hooks.onCue?.(c); }
          });
          this.painter.frame(movie, plan, t, LEAD_MS);
          this.overlay(plan, t);
          if (freezeAt !== undefined) return;
          if (t < end) { requestAnimationFrame(tick); return; }
          hooks.onEnd?.();
          this.showPips(plan.beats.length, 0);
          this.endEl.hidden = false;
          this.endEl.focus();
          onPress(this.endEl, () => {
            this.root.hidden = true;
            resolve();
          });
        };
        requestAnimationFrame(tick);
      };
      if (freezeAt !== undefined) { start(); return; }
      this.playEl.focus();
      onPress(this.playEl, start);
    });
  }

  /** Everything drawn around the picture at plan time `t`: label pills, caption, chapter chip, candles. */
  private overlay(plan: LessonSlot, t: number) {
    const opening = t < plan.playStart;
    const { k, slot, tl } = beatAtTime(plan, Math.max(t, plan.playStart));
    this.drawLabels(opening ? [] : labelsFor(slot, this.reducedMotion ? Infinity : tl));
    if (opening) this.setCaption("", 0, 0);
    else if (this.reducedMotion) this.setCaption(slot.beat.caption, 1, 0);
    else {
      const cap = captionFor(plan, t);
      this.setCaption(cap?.text ?? "", cap?.opacity ?? 0, cap?.drift ?? 0);
    }
    const chip = (slot.beat as MovieBeat).chip;
    this.chipEl.hidden = !chip || opening;
    if (chip && this.chipEl.textContent !== chip) this.chipEl.textContent = chip;
    this.showPips(opening ? -1 : k, t);
  }

  /** The caption's text is only written when it changes, so a screen reader hears each caption once. */
  private setCaption(text: string, opacity: number, drift: number) {
    if (text !== this.captionText) {
      this.captionText = text;
      this.captionEl.textContent = text;
    }
    this.captionEl.style.opacity = String(opacity);
    this.captionEl.style.transform = drift ? `translateX(${drift * 2}px)` : "";
  }

  /**
   * One candle per beat: lit for the beats played, flickering on beat `now`, unlit for the rest. The same
   * progress is written once per beat as words, which a screen reader hears in place of the candles.
   */
  private showPips(now: number, t: number) {
    const flicker = this.reducedMotion ? 0 : Math.floor(t / PIP_FRAME_MS) % PIP_FLICKER.length;
    const pips = this.pipsEl.children;
    for (let i = 0; i < pips.length; i++) {
      const html = i < now ? PIP_LIT : i === now ? PIP_FLICKER[flicker] : PIP_UNLIT;
      pips[i].classList.toggle("now", i === now);
      if (this.pipHtml[i] === html) continue;
      this.pipHtml[i] = html;
      pips[i].innerHTML = html;
    }
    const label = now < 0 ? `${pips.length} parts` : now < pips.length ? `Part ${now + 1} of ${pips.length}` : "The end";
    if (this.progressEl.textContent !== label) this.progressEl.textContent = label;
  }

  private clearPills() {
    for (const el of this.pills.values()) el.remove();
    this.pills.clear();
  }

  private drawLabels(labels: ReturnType<typeof labelsFor>) {
    const seen = new Set<string>();
    for (const l of labels) {
      seen.add(l.key);
      let el = this.pills.get(l.key);
      if (!el) {
        el = document.createElement("div");
        el.className = "pill";
        this.labelsEl.append(el);
        this.pills.set(l.key, el);
      }
      const tone = TONES[l.tone] ?? TONES.ink;
      if (el.textContent !== l.text) el.textContent = l.text;
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
