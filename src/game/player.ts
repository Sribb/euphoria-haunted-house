import * as THREE from "three";
import { PLAYER_SPRITES, type Facing } from "../art/player";
import { Billboard } from "./billboard";
import type { Rect } from "./foyer";
import type { Input } from "./input";

const RADIUS = 0.28;
const SPEED = 3.4;
const ACCEL = 16; // per second, exponential
const DECEL = 11;
const KICK = 0.35; // share of full speed given instantly on a fresh press

export type Blocker = { x: number; z: number; r: number };

/**
 * The player. Movement follows the game-feel notes: an instant kick on a fresh press, then a fast
 * exponential ramp, a slightly slower stop, collisions that slide along walls, and a walk cycle whose
 * speed matches the movement so the feet never skate.
 */
export class Player {
  readonly position = new THREE.Vector3(0, 0, 3.4);
  readonly velocity = new THREE.Vector2();
  readonly sprite = new Billboard(PLAYER_SPRITES.up, { pid: 60, shadow: 0.36 });
  readonly lantern = new THREE.PointLight("#FFD47A", 5, 7, 1.15);
  facing: Facing = "up";
  /** Called on each footfall, for the step sound. */
  onStep: () => void = () => {};
  private lastFrame = -1;

  constructor(scene: THREE.Scene) {
    // the lantern casts real shadows: furniture throws them across the floor as you walk past
    this.lantern.castShadow = true;
    this.lantern.shadow.mapSize.set(256, 256);
    this.lantern.shadow.bias = -0.003;
    this.lantern.shadow.normalBias = 0.03;
    this.lantern.shadow.camera.near = 0.1;
    this.lantern.shadow.camera.far = 8;
    scene.add(this.sprite.group, this.lantern);
    this.sprite.still();
  }

  update(
    dt: number,
    t: number,
    input: Input,
    walk: { x0: number; x1: number; z0: number; z1: number },
    colliders: Rect[],
    blockers: Blocker[],
    camera: THREE.Camera,
    reducedMotion: boolean,
  ) {
    const want = new THREE.Vector2(input.move.x, input.move.y).multiplyScalar(SPEED);
    const moving = want.lengthSq() > 0.001;
    if (moving && this.velocity.lengthSq() < 0.05) this.velocity.copy(want).multiplyScalar(KICK);
    const k = 1 - Math.exp(-(moving ? ACCEL : DECEL) * dt);
    this.velocity.lerp(want, k);
    if (!moving && this.velocity.lengthSq() < 0.0004) this.velocity.set(0, 0);

    const hit = (x: number, z: number) =>
      x < walk.x0 || x > walk.x1 || z < walk.z0 || z > walk.z1 ||
      colliders.some((r) => x > r.x0 - RADIUS && x < r.x1 + RADIUS && z > r.z0 - RADIUS && z < r.z1 + RADIUS) ||
      blockers.some((b) => Math.hypot(x - b.x, z - b.z) < b.r + RADIUS);
    const nx = this.position.x + this.velocity.x * dt;
    if (!hit(nx, this.position.z)) this.position.x = nx;
    else this.velocity.x = 0;
    const nz = this.position.z + this.velocity.y * dt;
    if (!hit(this.position.x, nz)) this.position.z = nz;
    else this.velocity.y = 0;

    const speed = this.velocity.length();
    if (speed > 0.25) {
      const f: Facing = Math.abs(this.velocity.x) > Math.abs(this.velocity.y) * 1.1
        ? (this.velocity.x > 0 ? "right" : "left")
        : (this.velocity.y > 0 ? "down" : "up");
      if (f !== this.facing) {
        this.facing = f;
        this.sprite.setSprite(PLAYER_SPRITES[f]);
      }
      this.sprite.play();
      this.sprite.timeScale = Math.max(0.6, speed / SPEED);
      const fr = this.sprite.frameIndex;
      if (fr !== this.lastFrame && (fr === 0 || fr === 2)) this.onStep();
      this.lastFrame = fr;
    } else if (this.sprite.playing) {
      this.sprite.still();
      this.lastFrame = -1;
    }

    this.sprite.position.copy(this.position);
    this.sprite.update(dt, camera, reducedMotion);

    // the lantern swings slightly ahead of the player, and flickers
    const ahead = { down: [0, 0.35], up: [0, -0.35], left: [-0.35, 0], right: [0.35, 0] }[this.facing];
    this.lantern.position.set(this.position.x + ahead[0], 0.95, this.position.z + ahead[1] + 0.3);
    this.lantern.intensity = reducedMotion ? 5 : 5 * (0.9 + 0.06 * Math.sin(t * 9) + 0.04 * Math.sin(t * 23.7));
  }
}
