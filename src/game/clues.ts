import * as THREE from "three";
import { clueWisp } from "../art/props";
import { HAUNTED_PIXEL_PALETTE as P } from "../lib/pixel/haunted-palette";
import { Billboard } from "./billboard";
import type { Clue } from "./room";

/**
 * Clue markers, shared by every room. Ghost teal means "something to look at": a wisp floats over each
 * clue you have not found, a ring pulses on the floor where you stand to look, and a small teal light
 * tints the thing itself. All three go away when the clue is found.
 */

type Marker = { ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>; glow: THREE.PointLight };
const markers = new WeakMap<Clue, Marker>();
const GLOW = 1.6;

export const makeClue = (
  scene: THREE.Scene,
  id: string,
  at: [number, number],
  wispAt: [number, number, number],
  candle: number,
  radius = 1.5,
): Clue => {
  const w = new Billboard(clueWisp, { noInfo: true });
  w.position.set(...wispAt);
  scene.add(w.group);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.45, 20),
    new THREE.MeshBasicMaterial({ color: P.T, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(at[0], 0.03, at[1]);
  ring.userData.noInfo = true;
  scene.add(ring);
  // the light never leaves the scene (its strength drops to zero instead), so shaders are not rebuilt
  const glow = new THREE.PointLight(P.T, GLOW, 2.8, 1.2);
  glow.position.set(wispAt[0], Math.max(0.6, wispAt[1] - 0.4), wispAt[2] + 0.6);
  scene.add(glow);
  const clue: Clue = { id, at: new THREE.Vector3(at[0], 0, at[1]), radius, candle, wisp: w, found: false };
  markers.set(clue, { ring, glow });
  return clue;
};

/** Call once a frame: bobs the wisps, pulses the rings in three steps, and retires found clues. */
export const updateClues = (clues: Clue[], dt: number, t: number, camera: THREE.Camera, reducedMotion: boolean) => {
  clues.forEach((c, i) => {
    const m = markers.get(c);
    const live = !c.found && c.wisp.group.visible;
    if (m) {
      m.ring.visible = live;
      m.glow.intensity = live ? GLOW * (reducedMotion ? 1 : 0.8 + 0.2 * Math.sin(t * 2.2 + i * 2)) : 0;
    }
    if (!live) return;
    c.wisp.lift = reducedMotion ? 0 : 0.12 * Math.sin(t * 2.2 + i * 2);
    c.wisp.update(dt, camera, reducedMotion);
    if (!m || reducedMotion) return;
    const step = Math.floor(t * 2.5 + i) % 3;
    // solid colour only: a see-through ring blended with the floor and snapped to grey
    m.ring.scale.setScalar(1 + step * 0.14);
    m.ring.material.color.set(step === 2 ? P.t : P.T);
  });
};
