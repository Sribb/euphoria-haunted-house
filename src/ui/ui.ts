import { candleLit, candleUnlit } from "../art/candle";
import { spriteToSvgMarkup } from "../lib/pixel/svg";
import type { Page, Question } from "../game/story";

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const ADVANCE = new Set(["Space", "Enter", "KeyE"]);
const CHARS_PER_SEC = 55;

/** The DOM layer over the game: title, HUD, prompts, dialog, the encounter, and the end card. */
export class UI {
  readonly stage = $("#stage");
  private dialogEl = $("#dialog");
  private battleEl = $("#battle");
  private toastTimer = 0;
  busy = false;

  constructor(private reducedMotion: boolean) {}

  setCandles(lit: number, total: number) {
    const el = $("#candles");
    el.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const s = i < lit ? candleLit : candleUnlit;
      const wrap = document.createElement("span");
      wrap.innerHTML = spriteToSvgMarkup(s, 3);
      const svg = wrap.firstElementChild as SVGElement;
      if (i < lit) svg.classList.add("lit");
      el.append(svg);
    }
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
    t.textContent = text;
    t.classList.add("on");
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => t.classList.remove("on"), 2200);
  }

  /** Waits for one advance: a click on `el`, or E, Space or Enter. */
  private waitAdvance(el: HTMLElement) {
    return new Promise<void>((resolve) => {
      const done = () => {
        removeEventListener("keydown", onKey);
        el.removeEventListener("pointerdown", onClick);
        resolve();
      };
      const onKey = (e: KeyboardEvent) => {
        if (ADVANCE.has(e.code) && !e.repeat) { e.preventDefault(); done(); }
      };
      const onClick = (e: PointerEvent) => { e.stopPropagation(); done(); };
      // a tick later, so the key press that opened this does not also close it
      setTimeout(() => {
        addEventListener("keydown", onKey);
        el.addEventListener("pointerdown", onClick);
      }, 60);
    });
  }

  /** Types `text` into `el`; an advance press while typing finishes the line at once. */
  private async type(el: HTMLElement, text: string, box: HTMLElement) {
    if (this.reducedMotion) { el.textContent = text; return; }
    let shown = 0;
    let skip = false;
    const skipper = this.waitAdvance(box).then(() => (skip = true));
    void skipper;
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const step = () => {
        shown = skip ? text.length : Math.min(text.length, Math.floor(((performance.now() - start) / 1000) * CHARS_PER_SEC));
        el.textContent = text.slice(0, shown);
        if (shown >= text.length) resolve();
        else requestAnimationFrame(step);
      };
      step();
    });
    return skip;
  }

  /** Shows pages one at a time and resolves when the last is dismissed. */
  async dialog(pages: Page[], onPage?: (i: number) => void) {
    this.busy = true;
    this.prompt(null);
    const d = this.dialogEl;
    d.hidden = false;
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      onPage?.(i);
      (d.querySelector(".speaker") as HTMLElement).textContent = p.speaker ?? "";
      (d.querySelector(".title") as HTMLElement).textContent = p.title ?? "";
      const more = d.querySelector(".more") as HTMLElement;
      more.style.visibility = "hidden";
      // a press while typing only finishes the line; the next press turns the page
      await this.type(d.querySelector(".text") as HTMLElement, p.text, d);
      more.style.visibility = "visible";
      await this.waitAdvance(d);
    }
    d.hidden = true;
    this.busy = false;
  }

  // ---------------------------------------------------------------- the encounter

  openBattle(name: string, unrest: number) {
    this.busy = true;
    this.prompt(null);
    this.stage.classList.add("battle");
    this.battleEl.hidden = false;
    (this.battleEl.querySelector(".name") as HTMLElement).textContent = name;
    const bar = this.battleEl.querySelector(".unrest") as HTMLElement;
    bar.innerHTML = "";
    for (let i = 0; i < unrest; i++) bar.append(document.createElement("i"));
  }

  setUnrest(left: number) {
    this.battleEl.querySelectorAll(".unrest i").forEach((el, i) => el.classList.toggle("gone", i >= left));
  }

  /** Asks a question; resolves with the chosen option index. */
  ask(q: Question): Promise<number> {
    const b = this.battleEl;
    (b.querySelector(".question") as HTMLElement).textContent = q.prompt;
    (b.querySelector(".feedback") as HTMLElement).textContent = "";
    (b.querySelector(".more") as HTMLElement).hidden = true;
    const opts = b.querySelector(".options") as HTMLElement;
    opts.innerHTML = "";
    opts.style.gridTemplateColumns = q.options.length <= 2 ? "1fr 1fr" : "";
    let sel = 0;
    const buttons = q.options.map((text, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML = `<b>${i + 1}</b><span></span>`;
      (btn.querySelector("span") as HTMLElement).textContent = text;
      opts.append(btn);
      return btn;
    });
    const mark = () => buttons.forEach((btn, i) => btn.classList.toggle("sel", i === sel));
    mark();
    return new Promise((resolve) => {
      const pick = (i: number) => {
        removeEventListener("keydown", onKey);
        buttons.forEach((btn) => (btn.disabled = true));
        resolve(i);
      };
      const cols = q.options.length <= 2 || innerWidth > 640 ? 2 : 1;
      const onKey = (e: KeyboardEvent) => {
        const n = Number(e.key);
        if (n >= 1 && n <= buttons.length) return pick(n - 1);
        if (e.code === "ArrowRight" || e.code === "KeyD") sel = Math.min(buttons.length - 1, sel + 1);
        else if (e.code === "ArrowLeft" || e.code === "KeyA") sel = Math.max(0, sel - 1);
        else if (e.code === "ArrowDown" || e.code === "KeyS") sel = Math.min(buttons.length - 1, sel + cols);
        else if (e.code === "ArrowUp" || e.code === "KeyW") sel = Math.max(0, sel - cols);
        else if (ADVANCE.has(e.code) && !e.repeat) { e.preventDefault(); return pick(sel); }
        else return;
        e.preventDefault();
        mark();
      };
      setTimeout(() => addEventListener("keydown", onKey), 60);
      buttons.forEach((btn, i) => {
        btn.addEventListener("click", () => pick(i));
        btn.addEventListener("pointerenter", () => { sel = i; mark(); });
      });
    });
  }

  /** Marks the answer, shows the explanation, and waits for Next. */
  async answer(q: Question, chosen: number, ghostLine: string) {
    const b = this.battleEl;
    const buttons = [...b.querySelectorAll<HTMLButtonElement>(".options button")];
    const good = chosen === q.correct;
    buttons[chosen].classList.add(good ? "right" : "wrong");
    if (!good) buttons[q.correct].classList.add("right");
    const fb = b.querySelector(".feedback") as HTMLElement;
    fb.className = `feedback ${good ? "good" : "bad"}`;
    await this.type(fb, `${ghostLine} ${good ? q.right : q.wrong}`, b.querySelector(".panel") as HTMLElement);
    const more = b.querySelector(".more") as HTMLElement;
    more.hidden = false;
    await this.waitAdvance(b.querySelector(".panel") as HTMLElement);
    more.hidden = true;
  }

  closeBattle() {
    this.stage.classList.remove("battle");
    this.battleEl.hidden = true;
    this.busy = false;
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
