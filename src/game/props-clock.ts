import * as THREE from "three";
import { HAUNTED_PIXEL_PALETTE as P } from "../lib/pixel/haunted-palette";
import { SCENE_EXTRAS as X, toon } from "./look";
import { lathe } from "./props3d";

/** Props for the Clock Tower: toothed gears, hourglasses, and the wall around the great dial. */

/** A toothed gear lying flat against a wall (its axis points at the camera side, +z). */
export const gear = (radius: number, teeth: number, material: THREE.Material, thickness = 0.14) => {
  const s = new THREE.Shape();
  const tooth = radius * 0.16;
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2;
    const r = i % 4 < 2 ? radius + tooth : radius;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i) s.lineTo(x, y); else s.moveTo(x, y);
  }
  s.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, radius * 0.22, 0, Math.PI * 2, true);
  s.holes.push(hole);
  for (let k = 0; k < 4; k++) {
    // four cut-outs, so a turning gear reads as turning
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    const cut = new THREE.Path();
    cut.absarc(Math.cos(a) * radius * 0.58, Math.sin(a) * radius * 0.58, radius * 0.2, 0, Math.PI * 2, true);
    s.holes.push(cut);
  }
  const geo = new THREE.ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false, curveSegments: 6 });
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

/** An hourglass on a wooden stand. `fill` (0 to 1) is how much sand has already fallen. */
export const hourglass = (x: number, y: number, z: number, fill: number, sand: string) => {
  const g = new THREE.Group();
  const wood = toon(X.woodDark);
  for (const hy of [0, 0.86]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 12), wood);
    cap.position.y = hy + 0.03;
    g.add(cap);
  }
  for (const a of [0, 2.1, 4.2]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.82, 5), wood);
    post.position.set(Math.cos(a) * 0.17, 0.46, Math.sin(a) * 0.17);
    g.add(post);
  }
  const glass = toon(P.b, { transparent: true, opacity: 0.55 });
  g.add(lathe([[0.02, 0.46], [0.15, 0.62], [0.16, 0.8], [0, 0.84]], glass, 10));
  g.add(lathe([[0, 0.08], [0.16, 0.12], [0.15, 0.3], [0.02, 0.46]], glass, 10));
  const sandMat = toon(sand);
  const lowH = 0.06 + 0.26 * fill, upH = 0.26 * (1 - fill);
  const low = new THREE.Mesh(new THREE.ConeGeometry(0.13, lowH, 10), sandMat);
  low.position.y = 0.1 + lowH / 2;
  g.add(low);
  if (upH > 0.02) {
    const up = new THREE.Mesh(new THREE.ConeGeometry(0.12, upH, 10), sandMat);
    up.rotation.x = Math.PI;
    up.position.y = 0.5 + upH / 2;
    g.add(up);
  }
  g.position.set(x, y, z);
  g.traverse((o) => {
    o.userData.pid = 176;
    if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true;
  });
  return g;
};

/** A square of wall with a round hole through it, for the great dial. Centre (cx, cy), hole radius `r`. */
export const roundOpening = (cx: number, cy: number, r: number, z0: number, z1: number, material: THREE.Material) => {
  const half = r + 0.06;
  const s = new THREE.Shape();
  s.moveTo(-half, -half);
  s.lineTo(half, -half);
  s.lineTo(half, half);
  s.lineTo(-half, half);
  s.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, r, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth: z1 - z0, bevelEnabled: false, curveSegments: 20 });
  geo.translate(cx, cy, z0);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return { mesh: m, half };
};

/** The dial's furniture: a brass ring, twelve hour marks, and two hands that can be turned. */
export const dialParts = (cx: number, cy: number, r: number, z: number) => {
  const brass = toon(P.g);
  const dark = toon(P.K);
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.09, 6, 28), brass);
  ring.position.set(cx, cy, z);
  ring.castShadow = true;
  g.add(ring);
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * Math.PI * 2;
    const big = h % 3 === 0;
    const mark = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.12 : 0.07, big ? 0.36 : 0.2, 0.06), dark);
    mark.position.set(cx + Math.sin(a) * (r - 0.28), cy + Math.cos(a) * (r - 0.28), z - 0.25);
    mark.rotation.z = -a;
    mark.castShadow = true;
    g.add(mark);
  }
  const hand = (len: number, w: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(cx, cy, z - 0.25);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.05), dark);
    m.position.y = len / 2 - 0.12;
    m.castShadow = true;
    pivot.add(m);
    g.add(pivot);
    return pivot;
  };
  const minute = hand(r * 0.86, 0.09);
  const hour = hand(r * 0.56, 0.13);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 10), brass);
  hub.rotation.x = Math.PI / 2;
  hub.position.set(cx, cy, z - 0.2);
  g.add(hub);
  return { group: g, minute, hour };
};
