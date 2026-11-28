/**
 * Encounter reactions that stay true to the pixel grid. Nothing here stretches or zooms a sprite (that
 * would break the whole-pixel look): the ghost only moves, and the billboard snaps every move to a screen
 * pixel. Everything is switched off under reduced motion.
 *
 * - A right answer knocks the ghost back a little, and it drifts home.
 * - A wrong answer makes the ghost lunge at the player, and the screen edges close in for a moment.
 */
export class GhostKick {
  /** 0..1 through the current move; 1 means at rest. */
  private t = 1;
  private dir = 0;
  private amp = 0;
  private dur = 0.4;
  /** How far the screen edges close in, 1 at the start of a wrong answer, fading to 0. */
  edge = 0;

  /** A right answer: pushed back, away from the player. */
  recoil() {
    this.start(-1, 0.32, 0.38);
  }

  /** A wrong answer: a lunge toward the player. */
  lunge() {
    this.start(1, 0.75, 0.5);
    this.edge = 1;
  }

  private start(dir: number, amp: number, dur: number) {
    this.t = 0;
    this.dir = dir;
    this.amp = amp;
    this.dur = dur;
  }

  /** The ghost's offset along z (toward the player is +z) for this frame, in world units. */
  offset(dt: number, reducedMotion: boolean): number {
    this.edge = Math.max(0, this.edge - dt * 2.2);
    if (this.t >= 1) return 0;
    this.t = Math.min(1, this.t + dt / this.dur);
    if (reducedMotion) return 0;
    // a fast strike (the first fifth of the move), then a slow ease home
    const k = this.t < 0.2 ? 1 - (1 - this.t / 0.2) ** 2 : (1 - (this.t - 0.2) / 0.8) ** 2;
    return this.dir * this.amp * k;
  }

  /** Extra vignette for this frame: the edges darken after a wrong answer. */
  vignette(reducedMotion: boolean) {
    return reducedMotion ? 0 : 0.45 * this.edge * this.edge;
  }
}

/** Waits `ms` milliseconds. */
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
