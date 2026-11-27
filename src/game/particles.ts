import * as THREE from "three";

const MAX = 320;

/**
 * One-pixel particles: embers when a candle lights, spirit motes around the ghost, a burst when it is
 * freed. Each particle has a life, a velocity and a colour; gravity is per burst.
 */
export class Particles {
  readonly points: THREE.Points;
  private pos = new Float32Array(MAX * 3);
  private col = new Float32Array(MAX * 3);
  private vel = new Float32Array(MAX * 3);
  private life = new Float32Array(MAX);
  private grav = new Float32Array(MAX);
  private next = 0;

  constructor(scene: THREE.Scene) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(g, new THREE.PointsMaterial({ size: 1, sizeAttenuation: false, vertexColors: true }));
    this.points.userData.noInfo = true;
    this.points.frustumCulled = false;
    for (let i = 0; i < MAX; i++) this.pos[i * 3 + 1] = -100;
    scene.add(this.points);
  }

  /** Emit `count` particles at `at`, spreading by `speed`, rising by `rise`, living about `life` seconds. */
  burst(at: THREE.Vector3, colors: string[], count: number, speed = 1, rise = 1, life = 0.9, gravity = -1.5) {
    const cs = colors.map((c) => new THREE.Color(c));
    for (let n = 0; n < count; n++) {
      const i = this.next;
      this.next = (this.next + 1) % MAX;
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      this.pos.set([at.x, at.y, at.z], i * 3);
      this.vel.set([Math.cos(a) * s, rise * (0.4 + Math.random()), Math.sin(a) * s * 0.6], i * 3);
      const c = cs[Math.floor(Math.random() * cs.length)];
      this.col.set([c.r, c.g, c.b], i * 3);
      this.life[i] = life * (0.6 + Math.random() * 0.8);
      this.grav[i] = gravity;
    }
  }

  update(dt: number) {
    for (let i = 0; i < MAX; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.pos[i * 3 + 1] = -100;
        continue;
      }
      this.vel[i * 3 + 1] += this.grav[i] * dt;
      for (let k = 0; k < 3; k++) this.pos[i * 3 + k] += this.vel[i * 3 + k] * dt;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
}
