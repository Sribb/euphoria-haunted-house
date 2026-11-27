import * as THREE from "three";
import { COS_P, SIN_P, UNIT_PX } from "./look";

const RIGHT = new THREE.Vector3(1, 0, 0);
const UP = new THREE.Vector3(0, COS_P, -SIN_P);
const BACK = new THREE.Vector3(0, SIN_P, COS_P);
const DIST = 24;

/** Smooth, time-coherent noise for shake (a sum of sines, never per-frame random). */
const wobble = (t: number, seed: number) => Math.sin(t * 17.3 + seed) * 0.6 + Math.sin(t * 31.7 + seed * 2.1) * 0.4;

/**
 * Follows a point with frame-rate-independent smoothing, snaps to whole pixels so nothing shimmers, and
 * reports the leftover fraction so the canvas can be nudged for smooth sub-pixel scrolling.
 * Shake uses a trauma value: events add to it, it decays, and the offset grows with trauma squared.
 */
export class FollowCamera {
  readonly focus = new THREE.Vector3();
  readonly target = new THREE.Vector3();
  zoom = 1;
  trauma = 0;
  /** Sub-pixel remainder of the snap, in low-res pixels. */
  readonly remainder = new THREE.Vector2();
  private t = 0;

  /**
   * `view` is the part of the world worth showing, in screen axes: x across, and u up the screen
   * (u = y * COS_P - z * SIN_P), so the top of a tall back wall counts, not just the floor's edge.
   */
  constructor(private camera: THREE.OrthographicCamera, public view: { x0: number; x1: number; u0: number; u1: number }) {
    camera.rotation.set(-Math.atan2(SIN_P, COS_P), 0, 0);
  }

  jumpTo(p: THREE.Vector3) {
    this.focus.copy(p);
    this.target.copy(p);
  }

  shake(amount: number) {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  update(dt: number, viewW: number, viewH: number, reducedMotion: boolean) {
    this.t += dt;
    const k = 1 - Math.pow(0.0025, dt);
    this.focus.lerp(this.target, k);
    // keep the room in view: clamp along the screen axes so the frame does not run past the room
    const fit = (v: number, lo: number, hi: number, half: number) => (hi - lo <= half * 2 ? (lo + hi) / 2 : THREE.MathUtils.clamp(v, lo + half, hi - half));
    const halfW = viewW / UNIT_PX / this.zoom / 2;
    const halfH = viewH / UNIT_PX / this.zoom / 2;
    const v = this.view;
    const fx = this.zoom > 1 ? this.focus.x : fit(this.focus.x, v.x0, v.x1, halfW);
    const fu = this.zoom > 1 ? this.focus.dot(UP) : fit(this.focus.dot(UP), v.u0, v.u1, halfH);
    // the focus stays on the floor plane (y = 0), so u = -z * SIN_P there
    const c = new THREE.Vector3(fx, 0, -fu / SIN_P);
    if (this.zoom > 1) c.copy(this.focus);

    this.trauma = Math.max(0, this.trauma - dt * 1.4);
    if (!reducedMotion && this.trauma > 0) {
      const s = this.trauma * this.trauma * 0.35;
      c.addScaledVector(RIGHT, wobble(this.t, 1) * s).addScaledVector(UP, wobble(this.t, 7) * s);
    }

    // snap the camera centre to the pixel grid along the screen axes
    const px = UNIT_PX * this.zoom;
    const r = c.dot(RIGHT), u = c.dot(UP);
    const rs = Math.round(r * px) / px, us = Math.round(u * px) / px;
    this.remainder.set((r - rs) * px, (u - us) * px);
    c.addScaledVector(RIGHT, rs - r).addScaledVector(UP, us - u);

    this.camera.position.copy(c).addScaledVector(BACK, DIST);
    if (this.camera.zoom !== this.zoom) {
      this.camera.zoom = this.zoom;
      this.camera.updateProjectionMatrix();
    }
    this.camera.updateMatrixWorld();
  }
}
