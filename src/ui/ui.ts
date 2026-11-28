import { candleLit, candleUnlit } from "../art/candle";
import { spriteToSvgMarkup } from "../lib/pixel/svg";
import type { PixelSprite } from "../lib/pixel/types";
import type { Page, Question } from "../game/room";

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const ADVANCE = new Set(["Space", "Enter", "KeyE"]);
const CHARS_PER_SEC = 55;
/** One art pixel is 2 CSS px (`--s` in ui.css), so sprites in the UI are drawn at this whole scale. */
const ART = 2;
/** How long the marked answers hold before the explanation starts. A press skips it. */
const BEAT_MS = 450;
/** Taps, and the keys that also close dialog, cannot choose an answer until this long after it appears. */
const ARM_MS = 350;
const coarse = () => matchMedia("(pointer: coarse)").matches;
/**
 * The lesson's explanation for an answer. Some explanations open with their own verdict word ("Correct!",
 * "Not quite."); the panel says the verdict itself, so that one word is dropped. Nothing else is changed.
 */
const explain = (q: Question, good: boolean) => (good ? q.right : q.wrong).replace(/^(Right\.|Correct!|Not quite\.)\s+/, "");

/** What the end card shows: rooms done, what comes next (empty once the whole house is free), the first-try
 *  score, and for each room its freed ghost and the lesson's first takeaway. */
export type EndCard = {
  kicker: string;
  next: string;
  score: { right: number; of: number };
  recap: { room: string; ghost: string; face: PixelSprite; point: string }[];
};

/** The DOM layer over the game: title, HUD, prompts, dialog, the encounter, and the end card. */
export class UI {
  readonly stage = $("#stage");
  private dialogEl = $("#dialog");
  private battleEl = $("#battle");
  private toastTimer = 0;
  private litShown = 0;
  private unrestTotal = 0;
  private longestReply = "";
  busy = false;

  constructor(private reducedMotion: boolean) {
    // Space or Enter on a focused card button or the sound button belongs to that control alone. The game
    // listens for the same keys on the window (and cancels Space, to stop the page scrolling), so without
    // this Space would not press the button and Enter would also act in the room.
    this.stage.addEventListener("keydown", (e) => {
      const onControl = e.target instanceof Element && e.target.closest(".card button, .card a, #mute");
      if (onControl && (e.code === "Space" || e.code === "Enter")) e.stopPropagation();
    });
  }

  setCandles(lit: number, total: number) {
    const el = $("#candles");
    el.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const wrap = document.createElement("span");
      wrap.innerHTML = spriteToSvgMarkup(i < lit ? candleLit : candleUnlit, ART);
      const svg = wrap.firstElementChild as SVGElement;
      if (i < lit) svg.classList.add("lit");
      // the candle that was just lit gains its glow in steps
      if (i < lit && i >= this.litShown) svg.classList.add("new");
      el.append(svg);
    }
    this.litShown = lit;
    el.setAttribute("aria-label", `${lit} of ${total} candles lit`);
  }

  /** Show the action prompt at a screen point, or hide it with `null`. */
  prompt(label: string | null, x = 0, y = 0, touch = false) {
    const p = $("#prompt"), act = $("#act");
    if (!label || this.busy) {
      p.hidden = true;
      act.hidden = true;
      return;
    }
    if (touch) {
      p.hidden = true;
      act.hidden = false;
      act.textContent = label;
    } else {
      act.hidden = true;
      p.hidden = false;
      (p.querySelector("span") as HTMLElement).textContent = label;
      p.style.left = `${Math.round(x)}px`;
      p.style.top = `${Math.round(y)}px`;
    }
  }

  toast(text: string) {
    const t = $("#toast");
    // just under the HUD, however tall it is on this screen, so the toast never covers the goal line
    const hud = $("#hud .status").getBoundingClientRect();
    t.style.top = `${hud.height ? Math.round(hud.bottom) + 8 : 24}px`;
    t.textContent = text;
    t.classList.add("on");
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => t.classList.remove("on"), 2200);
  }

  clearToast() {
    clearTimeout(this.toastTimer);
    $("#toast").classList.remove("on");
  }

  /**
   * Hands keyboard focus back to the room. Tab then starts from the top of the page (the sound button), and
   * Space or Enter act in the game instead of pressing whatever control was used last.
   */
  focusGame() {
    $("#view").focus({ preventScroll: true });
  }

  /** Says a full line once to screen readers. The typewriter's own text is hidden from them. */
  private announce(text: string) {
    $("#say").textContent = text;
  }

  /** On a touch screen, shows a faint ring where the thumb can rest, until the first touch or six seconds. */
  stickHint() {
    if (!coarse()) return;
    const off = () => {
      this.stage.classList.remove("stick-hint");
      this.stage.removeEventListener("pointerdown", off);
    };
    this.stage.classList.add("stick-hint");
    this.stage.addEventListener("pointerdown", off);
    setTimeout(off, 6000);
  }

  /** Waits for one advance: a click on `el`, or E, Space or Enter. */
  private waitAdvance(el: HTMLElement) {
    return new Promise<void>((resolve) => {
      const done = () => {
        removeEventListener("keydown", onKey);
        el.removeEventListener("click", onClick);
        resolve();
      };
      const onKey = (e: KeyboardEvent) => {
        if (ADVANCE.has(e.code) && !e.repeat) { e.preventDefault(); done(); }
      };
      // `click` fires after the finger lifts, so the whole tap is spent here. Listening on pointerdown let the
      // same tap's click land on whatever appeared next (on a phone it auto-picked an answer).
      const onClick = (e: MouseEvent) => { e.stopPropagation(); done(); };
      // a tick later, so the key press that opened this does not also close it
      setTimeout(() => {
        addEventListener("keydown", onKey);
        el.addEventListener("click", onClick);
      }, 60);
    });
  }

  /**
   * Types `text` into `el`; an advance press while typing finishes the line at once. With `hold`, the
   * typing waits that long first (a press skips the wait too), and `onStart` runs as the wait ends.
   */
  private async type(el: HTMLElement, text: string, box: HTMLElement, hold = 0, onStart?: () => void) {
    if (this.reducedMotion) { onStart?.(); el.textContent = text; return; }
    let skip = false;
    let started = false;
    let shown = -1;
    void this.waitAdvance(box).then(() => (skip = true));
    const begin = performance.now() + hold;
    await new Promise<void>((resolve) => {
      const step = () => {
        const now = performance.now();
        if (!started && (skip || now >= begin)) { started = true; onStart?.(); }
        const n = skip ? text.length : Math.max(0, Math.min(text.length, Math.floor(((now - begin) / 1000) * CHARS_PER_SEC)));
        if (started && n !== shown) { shown = n; el.textContent = text.slice(0, n); }
        if (started && n >= text.length) resolve();
        else requestAnimationFrame(step);
      };
      step();
    });
  }

  /** Shows pages one at a time and resolves when the last is dismissed. `face` is the speaker's portrait. */
  async dialog(pages: Page[], face?: PixelSprite) {
    this.busy = true;
    this.prompt(null);
    const d = this.dialogEl;
    const more = d.querySelector(".more") as HTMLElement;
    d.hidden = false;
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      (d.querySelector(".speaker") as HTMLElement).textContent = p.speaker ?? "";
      (d.querySelector(".title") as HTMLElement).textContent = p.title ?? "";
      // only the ghost's own lines carry its face; narration has none
      (d.querySelector(".portrait") as HTMLElement).innerHTML = p.speaker && face ? spriteToSvgMarkup(face, ART) : "";
      d.classList.toggle("shudder", i === 0 && !!p.speaker);
      this.announce([p.speaker && `${p.speaker} says:`, p.title, p.text].filter(Boolean).join(" "));
      more.style.visibility = "hidden";
      // a press while typing only finishes the line; the next press turns the page
      await this.type(d.querySelector(".text") as HTMLElement, p.text, d);
      more.style.visibility = "visible";
      await this.waitAdvance(d);
    }
    d.hidden = true;
    d.classList.remove("shudder");
    this.busy = false;
  }

  // ---------------------------------------------------------------- the encounter

  /** Opens the face-off. `replies` are the ghost's short lines, used to reserve room for its answer. */
  openBattle(name: string, unrest: number, face?: PixelSprite, replies: string[] = []) {
    this.busy = true;
    this.prompt(null);
    this.stage.classList.add("battle");
    this.battleEl.hidden = false;
    // "The " is its own span so the phone layout can drop it and fit the plate beside the sound button
    const plate = this.battleEl.querySelector(".name") as HTMLElement;
    const [, the, rest] = /^(The )?(.*)$/.exec(name)!;
    plate.innerHTML = `<span class="the"></span><span></span>`;
    (plate.firstElementChild as HTMLElement).textContent = the ?? "";
    (plate.lastElementChild as HTMLElement).textContent = rest;
    plate.setAttribute("aria-label", name);
    const bar = this.battleEl.querySelector(".unrest") as HTMLElement;
    bar.innerHTML = `<span class="label">Unrest</span>${"<i></i>".repeat(unrest)}`;
    this.unrestTotal = unrest;
    this.setUnrest(unrest);
    this.setFace(face);
    this.longestReply = replies.reduce((a, b) => (b.length > a.length ? b : a), "");
  }

  setUnrest(left: number) {
    const bar = this.battleEl.querySelector(".unrest") as HTMLElement;
    bar.querySelectorAll("i").forEach((el, i) => el.classList.toggle("gone", i >= left));
    bar.setAttribute("aria-label", `Unrest: ${left} of ${this.unrestTotal} left`);
  }

  /** The ghost's current mood beside its reply. */
  private setFace(face?: PixelSprite) {
    (this.battleEl.querySelector(".portrait") as HTMLElement).innerHTML = face ? spriteToSvgMarkup(face, ART) : "";
  }

  /**
   * Chooses the roomiest type size that keeps the panel under its cap (`--cap` in encounter.css), then locks
   * the panel's height to the tallest it will be for this question, asking or explaining, so it never jumps.
   */
  private fitPanel(q: Question, panel: HTMLElement, buttons: HTMLButtonElement[]) {
    const fb = panel.querySelector(".feedback") as HTMLElement;
    const opts = panel.querySelector(".options") as HTMLElement;
    const size = (b: HTMLButtonElement) => (b.textContent ?? "").length;
    const longestWrong = buttons.filter((_, i) => i !== q.correct).reduce((a, b) => (size(b) > size(a) ? b : a));
    const cap = parseFloat(getComputedStyle(panel).maxHeight) || innerHeight / 2;
    panel.style.minHeight = "";
    panel.style.maxHeight = "none";
    const heightOf = (state: "" | "good" | "bad") => {
      panel.classList.toggle("told", state !== "");
      opts.classList.toggle("solo", state === "good");
      buttons.forEach((btn, i) => {
        btn.disabled = state !== "";
        btn.classList.toggle("right", state !== "" && i === q.correct);
        btn.classList.toggle("wrong", state === "bad" && btn === longestWrong);
      });
      fb.textContent = state ? `${this.longestReply} ${explain(q, state === "good")}` : "";
      return panel.offsetHeight;
    };
    let need = 0;
    for (const fit of ["panel", "panel dense", "panel dense brief", "panel dense brief bare"]) {
      panel.className = fit;
      need = Math.max(heightOf("good"), heightOf("bad"), heightOf(""));
      if (need <= cap) break;
    }
    panel.style.maxHeight = "";
    // capped by --cap too, so turning a phone sideways mid-question cannot push the panel off the screen
    panel.style.minHeight = `min(${Math.min(need, cap)}px, var(--cap))`;
  }

  /** Asks a question; resolves with the chosen option index. */
  ask(q: Question): Promise<number> {
    const b = this.battleEl;
    const panel = b.querySelector(".panel") as HTMLElement;
    const opts = b.querySelector(".options") as HTMLElement;
    const n = q.options.length;
    const touch = coarse();
    (b.querySelector(".question") as HTMLElement).textContent = q.prompt;
    (b.querySelector(".feedback") as HTMLElement).textContent = "";
    (b.querySelector(".more") as HTMLElement).hidden = true;
    (b.querySelector(".verdict") as HTMLElement).textContent = touch ? "Tap an answer." : `Press ${n > 2 ? `1 to ${n}` : "1 or 2"}, or click an answer.`;
    opts.innerHTML = "";
    opts.classList.toggle("pair", n <= 2);
    const buttons = q.options.map((text, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.style.setProperty("--i", String(i));
      btn.innerHTML = `<b><i>${i + 1}</i></b><span></span>`;
      (btn.querySelector("span") as HTMLElement).textContent = text;
      opts.append(btn);
      return btn;
    });
    this.fitPanel(q, panel, buttons);
    panel.scrollTop = 0;
    this.announce(`${q.prompt} ${q.options.map((o, i) => `${i + 1}: ${o}.`).join(" ")}`);
    // a finger has no resting place, so nothing starts selected on a touch screen
    let sel = touch ? -1 : 0;
    const mark = () => buttons.forEach((btn, i) => btn.classList.toggle("sel", i === sel));
    mark();
    if (!touch) buttons[0].focus({ preventScroll: true });
    const shownAt = performance.now();
    return new Promise((resolve) => {
      let picked = false;
      const pick = (i: number) => {
        if (picked || i < 0) return;
        picked = true;
        removeEventListener("keydown", onKey);
        // a disabled button that keeps focus can swallow the next key press, so let go of it first
        if (document.activeElement instanceof HTMLElement && opts.contains(document.activeElement)) document.activeElement.blur();
        buttons.forEach((btn) => (btn.disabled = true));
        resolve(i);
      };
      const cols = n <= 2 || innerWidth > 640 ? 2 : 1;
      const move = (to: number) => {
        sel = Math.max(0, Math.min(n - 1, to));
        mark();
        buttons[sel].focus({ preventScroll: true });
      };
      const onKey = (e: KeyboardEvent) => {
        const k = Number(e.key);
        if (k >= 1 && k <= n) return pick(k - 1);
        if (e.code === "ArrowRight" || e.code === "KeyD") move(sel + 1);
        else if (e.code === "ArrowLeft" || e.code === "KeyA") move(sel - 1);
        else if (e.code === "ArrowDown" || e.code === "KeyS") move(sel < 0 ? 0 : sel + cols);
        else if (e.code === "ArrowUp" || e.code === "KeyW") move(sel - cols);
        else if (ADVANCE.has(e.code)) {
          // these keys also close the ghost's last line, so a press already on its way must not choose
          if (!e.repeat && performance.now() - shownAt > ARM_MS) pick(sel);
        } else return;
        e.preventDefault();
      };
      setTimeout(() => addEventListener("keydown", onKey), 60);
      // taps arm a moment after the answers appear, so a tap already in flight can never choose one
      setTimeout(() => buttons.forEach((btn, i) => btn.addEventListener("click", () => pick(i))), ARM_MS);
      buttons.forEach((btn, i) => {
        btn.addEventListener("pointerenter", () => { sel = i; mark(); });
        btn.addEventListener("focus", () => { sel = i; mark(); });
        // the keyboard chooses through onKey alone; this stops Space from also clicking the focused button
        btn.addEventListener("keyup", (e) => { if (e.code === "Space") e.preventDefault(); });
      });
    });
  }

  /**
   * Marks the answer (frame, icon and words), holds a beat, then swaps the spent answers for the ghost's
   * explanation and waits for Next. `face` is the ghost's mood after this answer.
   */
  async answer(q: Question, chosen: number, ghostLine: string, face?: PixelSprite) {
    const b = this.battleEl;
    const panel = b.querySelector(".panel") as HTMLElement;
    const opts = b.querySelector(".options") as HTMLElement;
    const buttons = [...opts.querySelectorAll<HTMLButtonElement>("button")];
    const good = chosen === q.correct;
    const verdict = good ? "Right." : "Not quite.";
    const text = `${ghostLine} ${explain(q, good)}`;
    const tag = (btn: HTMLButtonElement, cls: string, words: string) => {
      btn.classList.add(cls);
      btn.insertAdjacentHTML("beforeend", `<span class="sr-only"> ${words}</span>`);
    };
    buttons.forEach((btn) => btn.classList.remove("sel"));
    tag(buttons[chosen], good ? "right" : "wrong", good ? "Your answer. Right." : "Your answer. Not quite.");
    if (!good) tag(buttons[q.correct], "right", "The right answer.");
    if (face) this.setFace(face);
    this.announce(`${verdict} ${text}`);
    const fb = b.querySelector(".feedback") as HTMLElement;
    fb.className = `feedback ${good ? "good" : "bad"}`;
    const reveal = () => {
      panel.classList.add("told", good ? "good" : "bad");
      opts.classList.toggle("solo", good);
      (b.querySelector(".verdict") as HTMLElement).textContent = verdict;
    };
    await this.type(fb, text, panel, BEAT_MS, reveal);
    const more = b.querySelector(".more") as HTMLElement;
    more.hidden = false;
    await this.waitAdvance(panel);
    more.hidden = true;
  }

  closeBattle() {
    this.stage.classList.remove("battle");
    this.battleEl.hidden = true;
    this.busy = false;
    this.focusGame();
  }

  /** Fills and opens the end card, with the way on to Euphoria focused as the primary action. */
  showEnd(card: EndCard) {
    $("#hud").hidden = true;
    // with nothing left to come this is the real ending: the whole house is at peace
    const whole = !card.next;
    $("#end-kicker").textContent = card.kicker;
    $("#end-title").innerHTML = whole ? 'The house <br class="narrow" />is at peace' : 'The ghosts <br class="narrow" />are at peace';
    $("#end-sub").textContent = whole ? "You freed every ghost. Here is what each one taught you." : "Here is what each ghost taught you.";
    $("#end-next").textContent = card.next;
    const score = $("#end-score");
    score.hidden = card.score.of === 0;
    (score.querySelector("p") as HTMLElement).textContent = `${card.score.right} of ${card.score.of} right on the first try.`;
    (score.querySelector(".pips") as HTMLElement).innerHTML = Array.from({ length: card.score.of }, (_, i) =>
      spriteToSvgMarkup(i < card.score.right ? candleLit : candleUnlit, ART)).join("");
    const recap = $("#end-recap");
    recap.innerHTML = "";
    for (const r of card.recap) {
      const li = document.createElement("li");
      li.innerHTML = `${spriteToSvgMarkup(r.face, ART)}<div class="who"><span class="room"></span><span class="ghost"></span><span class="point"></span></div>`;
      (li.firstElementChild as SVGElement).setAttribute("aria-hidden", "true");
      (li.querySelector(".room") as HTMLElement).textContent = r.room;
      (li.querySelector(".ghost") as HTMLElement).textContent = r.ghost;
      (li.querySelector(".point") as HTMLElement).textContent = r.point;
      recap.append(li);
    }
    $("#end").hidden = false;
    // without preventScroll a short landscape screen opens the card scrolled down past its title and score
    $("#keep").focus({ preventScroll: true });
  }

  /**
   * The encounter transition: black blocks spiral in from the edges to cover the screen (`cover`),
   * or spiral back out to reveal it. Hides the camera's cut to the face-off.
   */
  wipe(cover: boolean, ms = 650) {
    const c = document.getElementById("wipe") as HTMLCanvasElement;
    const cols = 24, rows = Math.max(10, Math.round((24 * innerHeight) / innerWidth));
    c.width = cols;
    c.height = rows;
    const g = c.getContext("2d")!;
    const order: [number, number][] = [];
    let [x0, y0, x1, y1] = [0, 0, cols - 1, rows - 1];
    while (x0 <= x1 && y0 <= y1) {
      for (let x = x0; x <= x1; x++) order.push([x, y0]);
      for (let y = y0 + 1; y <= y1; y++) order.push([x1, y]);
      if (y0 < y1) for (let x = x1 - 1; x >= x0; x--) order.push([x, y1]);
      if (x0 < x1) for (let y = y1 - 1; y > y0; y--) order.push([x0, y]);
      x0++; y0++; x1--; y1--;
    }
    if (this.reducedMotion) ms = 0;
    return new Promise<void>((resolve) => {
      const start = performance.now();
      const step = () => {
        const p = ms ? Math.min(1, (performance.now() - start) / ms) : 1;
        g.clearRect(0, 0, cols, rows);
        g.fillStyle = "#000";
        const n = Math.round(p * order.length);
        const shown = cover ? order.slice(0, n) : order.slice(0, order.length - n);
        for (const [x, y] of shown) g.fillRect(x, y, 1, 1);
        if (p < 1) requestAnimationFrame(step);
        else resolve();
      };
      step();
    });
  }

  fade(to: number, ms = 500) {
    const f = $("#fade");
    f.style.transitionDuration = `${this.reducedMotion ? 0 : ms}ms`;
    f.style.opacity = String(to);
    return new Promise<void>((r) => setTimeout(r, this.reducedMotion ? 0 : ms));
  }
}
