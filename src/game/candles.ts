import * as THREE from "three";
import { smallFlame } from "../art/props";
import { Billboard } from "./billboard";
import { toon } from "./look";

/**
 * A 3D candle: wax, a brass cup, a pixel flame that faces the camera, and a warm point light. It starts
 * unlit; `ignite()` brings the flame and light up over half a second.
 */
export class Candle {
  readonly group = new THREE.Group();
  readonly light: THREE.PointLight;
  readonly flame: Billboard;
  lit = false;
  private level = 0;
  private seed = Math.random() * 100;

  constructor(readonly top: THREE.Vector3, readonly brightness = 3.2, waxHeight = 0.32) {
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, waxHeight, 8), toon("#E6E1D3"));
    wax.position.set(top.x, top.y + waxHeight / 2, top.z);
    wax.castShadow = true;
    wax.userData.pid = 150;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.06, 10), toon("#A8641A"));
    cup.position.set(top.x, top.y + 0.03, top.z);
    cup.userData.pid = 151;
    this.group.add(wax, cup);
    this.flame = new Billboard(smallFlame, { noInfo: true });
    this.flame.position.set(top.x, top.y + waxHeight - 0.02, top.z);
    this.flame.group.visible = false;
    this.group.add(this.flame.group);
    this.light = new THREE.PointLight("#FF9A3C", 0, 5, 1.1);
    this.light.position.set(top.x, top.y + waxHeight + 0.35, top.z + 0.15);
    // Candles in a group (the chandelier) share one bigger light, so theirs is left out of the scene.
    if (brightness > 0) this.group.add(this.light);
  }

  ignite() {
    if (this.lit) return;
    this.lit = true;
    this.flame.group.visible = true;
  }

  /** Light it instantly, for loading saved progress. */
  setLit() {
    this.ignite();
    this.level = 1;
  }

  update(dt: number, t: number, camera: THREE.Camera, reducedMotion: boolean) {
    if (this.lit) this.level = Math.min(1, this.level + dt * 2);
    const flicker = reducedMotion ? 1 : 0.88 + 0.08 * Math.sin(t * 13 + this.seed) + 0.04 * Math.sin(t * 31 + this.seed * 2);
    this.light.intensity = this.brightness * this.level * flicker;
    this.flame.update(dt, camera, reducedMotion);
  }
}
