import { s } from "../lib/pixel/helpers";
import { spriteToSvgMarkup } from "../lib/pixel/svg";

/**
 * A teal pixel arrow at the edge of the screen that points to the nearest clue still to find, shown only
 * while that clue is off screen. On a phone the rooms are wider than the view, so from the start a new
 * player could see no clue at all (quality audit, fix 5).
 *
 * The arrow is drawn once, pointing right, and only ever turned in quarter turns, so its pixels stay
 * square. It points out through the edge it sits on, and where it sits along that edge shows the rest.
 */
const ARROW = s("clue-arrow", "Clue arrow", ["clue", "hint"], "Points to a clue that is off screen.", [
  "......K....",
  "......KK...",
  "KKKKKKKTK..",
  "KTTTTTTTTK.",
  "KWWWWWWWWTK",
  "KTTTTTTTTK.",
  "KKKKKKKTK..",
  "......KK...",
  "......K....",
]);
const SCALE = 4;
const W = 11 * SCALE, H = 9 * SCALE;

export class CluePointer {
  private el: HTMLElement;

  constructor(parent: HTMLElement) {
    this.el = document.createElement("div");
    this.el.id = "clue-pointer";
    this.el.setAttribute("aria-hidden", "true");
    this.el.hidden = true;
    this.el.innerHTML = `<span>${spriteToSvgMarkup(ARROW, SCALE)}</span>`;
    parent.appendChild(this.el);
  }

  /** Points toward screen point `at`, or hides when `at` is null or already on screen. */
  update(at: { x: number; y: number } | null, touch: boolean) {
    if (!at) return this.hide();
    const hud = document.getElementById("hud");
    const top = hud && !hud.hidden ? hud.getBoundingClientRect().bottom + 12 : 28;
    // keep clear of the joystick and the action button on a phone
    const bottom = innerHeight - (touch ? 132 : 28);
    const left = 28, right = innerWidth - 28;
    if (at.x > left && at.x < right && at.y > top && at.y < bottom) return this.hide();

    // slide out from the middle of the safe area toward the clue until the arrow meets an edge
    const cx = (left + right) / 2, cy = (top + bottom) / 2;
    const dx = at.x - cx, dy = at.y - cy;
    const kx = dx === 0 ? Infinity : (dx > 0 ? right - cx : cx - left) / Math.abs(dx);
    const ky = dy === 0 ? Infinity : (dy > 0 ? bottom - cy : cy - top) / Math.abs(dy);
    const k = Math.min(kx, ky, 1);
    const x = Math.round(cx + dx * k), y = Math.round(cy + dy * k);
    const turn = kx <= ky ? (dx > 0 ? 0 : 180) : dy > 0 ? 90 : 270;
    this.el.hidden = false;
    this.el.style.transform = `translate(${x - W / 2}px, ${y - H / 2}px) rotate(${turn}deg)`;
  }

  hide() {
    this.el.hidden = true;
  }
}
