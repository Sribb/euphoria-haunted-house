/**
 * Keyboard and touch input. Movement is a vector with length up to 1 (x right, y toward the camera).
 * Touch: drag anywhere on the left side of the screen for a joystick; the action button is part of the UI.
 */
export class Input {
  readonly move = { x: 0, y: 0 };
  /** True while the game should ignore movement (a dialog or encounter is open). */
  locked = false;
  private keys = new Set<string>();
  private actionQueued = false;
  private stick: { id: number; ox: number; oy: number; x: number; y: number } | null = null;
  private stickEl: HTMLElement;
  private knobEl: HTMLElement;

  constructor(surface: HTMLElement) {
    this.stickEl = document.getElementById("stick")!;
    this.knobEl = document.getElementById("stick-knob")!;
    addEventListener("keydown", (e) => {
      if (e.repeat && (e.code === "Space" || e.code === "Enter" || e.code === "KeyE")) return;
      this.keys.add(e.code);
      if (e.code === "Space" || e.code === "Enter" || e.code === "KeyE") this.actionQueued = true;
      if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
    });
    addEventListener("keyup", (e) => this.keys.delete(e.code));
    addEventListener("blur", () => this.keys.clear());
    surface.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" || this.stick || e.clientX > innerWidth * 0.6) return;
      this.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0 };
      this.stickEl.style.left = `${e.clientX}px`;
      this.stickEl.style.top = `${e.clientY}px`;
      this.stickEl.classList.add("on");
      surface.setPointerCapture(e.pointerId);
    });
    surface.addEventListener("pointermove", (e) => {
      if (!this.stick || e.pointerId !== this.stick.id) return;
      const dx = e.clientX - this.stick.ox, dy = e.clientY - this.stick.oy;
      const len = Math.hypot(dx, dy), max = 48;
      const k = len > max ? max / len : 1;
      this.stick.x = (dx * k) / max;
      this.stick.y = (dy * k) / max;
      this.knobEl.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    });
    const end = (e: PointerEvent) => {
      if (!this.stick || e.pointerId !== this.stick.id) return;
      this.stick = null;
      this.stickEl.classList.remove("on");
      this.knobEl.style.transform = "";
    };
    surface.addEventListener("pointerup", end);
    surface.addEventListener("pointercancel", end);
  }

  /** Queue an action from the on-screen button. */
  pressAction() {
    this.actionQueued = true;
  }

  /** True once per press of E, Space, Enter or the action button. */
  takeAction() {
    const a = this.actionQueued;
    this.actionQueued = false;
    return a;
  }

  update() {
    let x = 0, y = 0;
    const k = this.keys;
    if (k.has("ArrowLeft") || k.has("KeyA")) x -= 1;
    if (k.has("ArrowRight") || k.has("KeyD")) x += 1;
    if (k.has("ArrowUp") || k.has("KeyW")) y -= 1;
    if (k.has("ArrowDown") || k.has("KeyS")) y += 1;
    const len = Math.hypot(x, y);
    if (len > 0) { x /= len; y /= len; }
    if (this.stick) {
      const sl = Math.hypot(this.stick.x, this.stick.y);
      if (sl > 0.18) { x = this.stick.x; y = this.stick.y; }
    }
    this.move.x = this.locked ? 0 : x;
    this.move.y = this.locked ? 0 : y;
  }

  get hasTouch() {
    return matchMedia("(pointer: coarse)").matches;
  }
}
