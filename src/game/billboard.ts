import * as THREE from "three";
import type { PixelSprite } from "../lib/pixel/types";
import { COS_P, SIN_P, UNIT_PX } from "./look";
import { spriteTextures } from "./textures";

const RIGHT = new THREE.Vector3(1, 0, 0);
const UP = new THREE.Vector3(0, COS_P, -SIN_P);
const FWD = new THREE.Vector3(0, -SIN_P, -COS_P);
const snap = (v: number) => Math.round(v * UNIT_PX) / UNIT_PX;

/** Snaps a world point so that a sprite corner placed there lands exactly on a screen pixel. */
export const snapToPixels = (p: THREE.Vector3, halfWidthPx: number, out = new THREE.Vector3()) => {
  const r = p.dot(RIGHT), u = p.dot(UP), f = p.dot(FWD);
  const half = halfWidthPx / UNIT_PX;
  const rs = snap(r - half) + half;
  return out.copy(RIGHT).multiplyScalar(rs).addScaledVector(UP, snap(u)).addScaledVector(FWD, f);
};

type Art = { still: THREE.Texture; frames: THREE.Texture[] };
const cache = new WeakMap<PixelSprite, Art>();
const texturesOf = (s: PixelSprite): Art => {
  let t = cache.get(s);
  if (!t) {
    const still = spriteTextures({ ...s, frames: undefined })[0];
    t = { still, frames: s.frames?.length ? spriteTextures(s) : [still] };
    cache.set(s, t);
  }
  return t;
};

export type BillboardOptions = {
  /** Object id for outlines. */
  pid?: number;
  /** Lift above the anchor point, in world units (a floating ghost). */
  lift?: number;
  /** Radius of the soft shadow on the floor, 0 for none. */
  shadow?: number;
  /** Skip the outline pass (flames, sparkles). */
  noInfo?: boolean;
};

/** A pixel sprite standing in the 3D world, always facing the camera. Its anchor is the bottom centre. */
export class Billboard {
  readonly group = new THREE.Group();
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  readonly position = new THREE.Vector3();
  lift: number;
  playing = true;
  loop = true;
  flipX = false;
  /** Animation speed multiplier (match a walk cycle to movement speed). */
  timeScale = 1;
  private sprite!: PixelSprite;
  private art!: Art;
  private showStill = false;
  private frame = 0;
  private clock = 0;
  private shadow?: THREE.Mesh;
  private widthPx = 0;

  constructor(sprite: PixelSprite, opts: BillboardOptions = {}) {
    this.lift = opts.lift ?? 0;
    const material = new THREE.MeshBasicMaterial({ alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    this.mesh.userData.pid = opts.pid ?? 40;
    this.mesh.userData.noInfo = !!opts.noInfo;
    this.group.add(this.mesh);
    if (opts.shadow) {
      const s = new THREE.Mesh(
        new THREE.CircleGeometry(opts.shadow, 16),
        new THREE.MeshBasicMaterial({ color: "#0B0714", transparent: true, opacity: 0.55, depthWrite: false }),
      );
      s.rotation.x = -Math.PI / 2;
      s.scale.y = 0.6;
      s.userData.noInfo = true;
      s.renderOrder = -1;
      this.shadow = s;
      this.group.add(s);
    }
    this.setSprite(sprite);
  }

  /** Swap the art (a new facing or mood). Keeps the frame clock unless `restart`. */
  setSprite(sprite: PixelSprite, restart = false) {
    if (sprite === this.sprite) return;
    this.sprite = sprite;
    this.art = texturesOf(sprite);
    const w = sprite.rows[0].length, h = sprite.rows.length;
    this.widthPx = w;
    const geo = new THREE.PlaneGeometry(w / UNIT_PX, h / UNIT_PX);
    geo.translate(0, h / UNIT_PX / 2, 0);
    this.mesh.geometry.dispose();
    this.mesh.geometry = geo;
    if (restart) { this.frame = 0; this.clock = 0; }
    this.frame %= this.art.frames.length;
    this.applyFrame();
  }

  get frameIndex() {
    return this.frame;
  }

  /** Show the still frame (the sprite's `rows`) and stop animating. */
  still() {
    this.playing = false;
    this.showStill = true;
    this.frame = 0;
    this.clock = 0;
    this.applyFrame();
  }

  /** Start (or keep) the animation. `restart` begins again from frame 0. */
  play(restart = false) {
    if (this.playing && !restart) return;
    this.playing = true;
    this.showStill = false;
    if (restart) { this.frame = 0; this.clock = 0; }
    this.applyFrame();
  }

  private applyFrame() {
    const m = this.mesh.material;
    const next = this.showStill ? this.art.still : this.art.frames[this.frame];
    if (m.map !== next) {
      m.map = next;
      m.needsUpdate = true;
    }
  }

  update(dt: number, camera: THREE.Camera, reducedMotion: boolean) {
    const ms = this.sprite.frameMs ?? 120;
    if (reducedMotion && !this.showStill) { this.showStill = true; this.applyFrame(); }
    if (this.playing && !reducedMotion && this.art.frames.length > 1) {
      this.clock += dt * 1000 * this.timeScale;
      while (this.clock >= ms) {
        this.clock -= ms;
        if (this.frame + 1 >= this.art.frames.length && !this.loop) { this.playing = false; break; }
        this.frame = (this.frame + 1) % this.art.frames.length;
        this.applyFrame();
      }
    }
    this.mesh.quaternion.copy(camera.quaternion);
    this.mesh.scale.x = this.flipX ? -1 : 1;
    const lifted = this.position.clone();
    lifted.y += this.lift;
    snapToPixels(lifted, this.widthPx / 2, this.mesh.position);
    if (this.shadow) {
      this.shadow.position.set(this.position.x, 0.015, this.position.z);
      const s = Math.max(0.55, 1 - this.lift * 0.35);
      this.shadow.scale.set(s, s * 0.6, s);
    }
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
