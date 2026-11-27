import * as THREE from "three";
import { HAUNTED_PIXEL_PALETTE as P } from "../lib/pixel/haunted-palette";
import { canvasTexture, SCENE_EXTRAS as X, toon } from "./look";

/**
 * Shaped 3D props for the rooms, built from lathes, tubes and displaced spheres rather than boxes
 * (the Tiny Why lesson: more triangles and real silhouettes read as quality once pixelated).
 * Every prop returns a group placed in world space; `pid` gives it one outline id.
 */

const tag = <T extends THREE.Object3D>(o: T, pid: number, shadow = true) => {
  o.traverse((c) => {
    c.userData.pid = pid;
    const m = c as THREE.Mesh;
    if (m.isMesh) { m.castShadow = shadow; m.receiveShadow = true; }
  });
  return o;
};

/** Hard facets: each triangle gets its own normal, so toon bands break on the facets. */
export const facet = (g: THREE.BufferGeometry) => {
  const out = g.index ? g.toNonIndexed() : g;
  out.computeVertexNormals();
  return out;
};

/** A turned shape from a profile of [radius, height] pairs. */
export const lathe = (profile: [number, number][], material: THREE.Material, segments = 12) =>
  new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments), material);

const tube = (pts: [number, number, number][], radius: number, material: THREE.Material) =>
  new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 16, radius, 6), material);

const woodDark = toon(X.woodDark);
const wood = toon(X.wood);
const brass = toon(P.g);
const gold = toon(P.G);

/** A turned table leg, `h` tall, standing at the origin. */
export const turnedLeg = (h: number) =>
  lathe([[0, 0], [0.06, 0], [0.065, 0.06], [0.04, 0.12], [0.05, h * 0.35], [0.075, h * 0.45], [0.04, h * 0.55], [0.045, h * 0.9], [0.07, h * 0.95], [0.07, h], [0, h]], woodDark, 10);

// ---------------------------------------------------------------- jack-o'-lanterns

const faceTexture = canvasTexture(16, 12, (g) => {
  g.fillStyle = P["5"];
  for (const [x, y, w, h] of [[3, 2, 3, 3], [10, 2, 3, 3], [4, 3, 1, 1], [7, 5, 2, 2], [3, 8, 10, 2], [4, 10, 2, 1], [9, 10, 2, 1], [6, 7, 1, 1], [9, 7, 1, 1]] as const) g.fillRect(x, y, w, h);
  g.fillStyle = P["4"];
  g.fillRect(3, 9, 10, 1);
}, false);

/** A ribbed pumpkin with a carved face glowing from a real light inside. */
export const jackOLantern = (x: number, y: number, z: number, scale = 1, turn = 0) => {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.34, 18, 12);
  const p = geo.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    const a = Math.atan2(v.z, v.x);
    const k = 1 - 0.09 * Math.pow(Math.abs(Math.cos(a * 5)), 0.6);
    p.setXYZ(i, v.x * k, v.y * 0.74, v.z * k);
  }
  const body = new THREE.Mesh(facet(geo), toon(P["3"]));
  body.position.y = 0.25;
  const stem = tube([[0, 0.45, 0], [0.03, 0.55, 0.01], [0.08, 0.6, 0.02]], 0.035, toon(X.woodDark));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), new THREE.MeshBasicMaterial({ map: faceTexture, alphaTest: 0.5, transparent: true }));
  face.position.set(0, 0.26, 0.335);
  face.userData.noInfo = true;
  g.add(body, stem, face);
  const light = new THREE.PointLight("#FF9A3C", 1.6, 3.2, 1.3);
  light.position.set(0, 0.35, 0.45);
  g.add(light);
  g.position.set(x, y, z);
  g.rotation.y = turn;
  g.scale.setScalar(scale);
  g.userData.light = light;
  return tag(g, 90 + Math.round(x * 3 + z) % 30);
};

// ---------------------------------------------------------------- furniture

/** A high-backed wing armchair in faded violet velvet. It faces +x when turn = 0. */
export const armchair = (x: number, z: number, turn = 0) => {
  const g = new THREE.Group();
  const velvet = toon(P.p);
  const velvetDark = toon(P.E);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.2, 0.78), velvet);
  seat.position.y = 0.46;
  // a tall back, reclined a little, with a rounded top and side wings
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.95, 0.78), velvetDark);
  back.position.set(-0.36, 0.98, 0);
  back.rotation.z = 0.12;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.16, 14, 1, false, 0, Math.PI), velvetDark);
  crown.rotation.set(Math.PI / 2, 0, Math.PI / 2 + 0.12);
  crown.position.set(-0.42, 1.44, 0);
  g.add(seat, back, crown);
  for (const sgn of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.1), velvetDark);
    wing.position.set(-0.2, 1.05, sgn * 0.36);
    const arm = tube([[-0.3, 0.68, sgn * 0.38], [0.05, 0.74, sgn * 0.4], [0.37, 0.68, sgn * 0.4]], 0.075, velvet);
    g.add(wing, arm);
    for (const fx of [-0.3, 0.3]) {
      const leg = turnedLeg(0.36);
      leg.position.set(fx, 0, sgn * 0.3);
      g.add(leg);
    }
  }
  g.position.set(x, 0, z);
  g.rotation.y = turn;
  return tag(g, 180);
};

/** A brass candelabra with three curved arms. Its candles are unlit until the room is freed. */
export const candelabra = (x: number, y: number, z: number) => {
  const g = new THREE.Group();
  g.add(lathe([[0, 0], [0.16, 0], [0.14, 0.04], [0.05, 0.08], [0.04, 0.5], [0.07, 0.55], [0.03, 0.6], [0, 0.6]], brass, 10));
  for (const s of [-1, 0, 1]) {
    if (s) g.add(tube([[0, 0.5, 0], [s * 0.15, 0.48, 0], [s * 0.24, 0.6, 0], [s * 0.24, 0.72, 0]], 0.02, brass));
    const cup = lathe([[0, 0], [0.05, 0], [0.06, 0.04], [0, 0.04]], gold, 8);
    cup.position.set(s * 0.24, s ? 0.72 : 0.62, 0);
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.22, 6), toon(P.w));
    wax.position.set(s * 0.24, (s ? 0.72 : 0.62) + 0.14, 0);
    g.add(cup, wax);
  }
  g.position.set(x, y, z);
  return tag(g, 181);
};

/** A small round side table on a turned pedestal. */
export const pedestalTable = (x: number, z: number) => {
  const g = new THREE.Group();
  g.add(lathe([[0, 0], [0.28, 0], [0.26, 0.05], [0.08, 0.1], [0.06, 0.4], [0.1, 0.5], [0.05, 0.62], [0.05, 0.72], [0, 0.72]], woodDark, 12));
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.4, 0.06, 16), wood);
  top.position.y = 0.75;
  g.add(top);
  g.position.set(x, 0, z);
  return tag(g, 182);
};

/** A treasure trunk with a rounded lid, iron bands, and coins spilling out in front. */
export const trunk = (x: number, z: number, turn = 0) => {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.65), wood);
  box.position.y = 0.25;
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.325, 0.325, 1.1, 12, 1, false, 0, Math.PI), woodDark);
  lid.rotation.z = Math.PI / 2;
  lid.rotation.y = Math.PI / 2;
  lid.position.set(0, 0.5, -0.12);
  lid.rotation.x = -0.6;
  const iron = toon(X.stoneLight);
  for (const bx of [-0.4, 0.4]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.52, 0.67), iron);
    band.position.set(bx, 0.26, 0);
    g.add(band);
  }
  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.04), gold);
  lock.position.set(0, 0.4, 0.34);
  const pile = new THREE.Mesh(facet(new THREE.SphereGeometry(0.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)), gold);
  pile.scale.set(1.1, 0.35, 0.6);
  pile.position.set(0, 0.48, 0.02);
  g.add(box, lid, lock, pile);
  const coin = new THREE.CylinderGeometry(0.07, 0.07, 0.02, 10);
  for (const [cx, cz, tilt] of [[0.3, 0.55, 0.2], [0.05, 0.7, 0], [-0.25, 0.6, 0.5], [0.5, 0.85, 0], [-0.05, 0.95, 0.3], [0.2, 1.05, 0]]) {
    const c = new THREE.Mesh(coin, gold);
    c.position.set(cx, 0.012, cz);
    c.rotation.x = tilt;
    g.add(c);
  }
  g.position.set(x, 0, z);
  g.rotation.y = turn;
  return tag(g, 183);
};

/** A stone urn with a dead, leafless plant. */
export const deadPlant = (x: number, z: number) => {
  const g = new THREE.Group();
  g.add(lathe([[0, 0], [0.18, 0], [0.12, 0.08], [0.14, 0.18], [0.26, 0.42], [0.3, 0.55], [0.26, 0.58], [0, 0.58]], toon(X.stoneLight), 12));
  const twig = toon(X.woodDeep);
  const branches: [number, number, number][][] = [
    [[0, 0.55, 0], [0.05, 0.9, 0.02], [0.18, 1.3, 0.05], [0.3, 1.55, 0.08]],
    [[0, 0.55, 0], [-0.08, 0.95, 0], [-0.25, 1.25, -0.04], [-0.32, 1.5, -0.1]],
    [[0.05, 0.9, 0.02], [0.2, 1.0, 0.1], [0.38, 1.12, 0.12]],
    [[-0.08, 0.95, 0], [-0.02, 1.25, 0.06], [0.02, 1.6, 0.05]],
  ];
  for (const b of branches) g.add(tube(b, 0.022, twig));
  g.position.set(x, 0, z);
  return tag(g, 184);
};

const webTexture = canvasTexture(32, 32, (g) => {
  g.strokeStyle = "#C9C2D6";
  g.lineWidth = 1;
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    g.beginPath(); g.moveTo(0.5, 0.5); g.lineTo(0.5 + Math.cos(a) * 31, 0.5 + Math.sin(a) * 31); g.stroke();
  }
  for (const r of [8, 15, 22, 29]) {
    g.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * (Math.PI / 2);
      const rr = r - (i % 2) * 2;
      const px = Math.cos(a) * rr + 0.5, py = Math.sin(a) * rr + 0.5;
      if (i) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.stroke();
  }
}, false);

/** A cobweb card stretched across a corner. */
export const cobweb = (x: number, y: number, z: number, size: number, rotY: number, flip = false) => {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: webTexture, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }),
  );
  m.position.set(x, y, z);
  m.rotation.set(0, rotY, flip ? Math.PI / 2 : 0);
  m.userData.noInfo = true;
  return m;
};

/** The top of an arched opening: the wall between a half circle and its square corners. */
export const archInfill = (cx: number, springY: number, radius: number, z0: number, z1: number, material: THREE.Material) => {
  const s = new THREE.Shape();
  s.moveTo(-radius, 0);
  s.absarc(0, 0, radius, Math.PI, 0, true);
  s.lineTo(radius, radius + 0.02);
  s.lineTo(-radius, radius + 0.02);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: z1 - z0, bevelEnabled: false, curveSegments: 16 });
  geo.translate(cx, springY, z0);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

/** A half-ring of trim around an arch. */
export const archTrim = (cx: number, springY: number, radius: number, z: number, material: THREE.Material) => {
  const m = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.07, 6, 20, Math.PI), material);
  m.position.set(cx, springY, z);
  m.castShadow = true;
  return m;
};

/** A wooden barrel with iron hoops, standing, or lying on its side when `lying`. */
export const barrel = (x: number, y: number, z: number, lying = false, turn = 0) => {
  const g = new THREE.Group();
  const h = 1.0;
  const body = lathe([[0, 0], [0.32, 0], [0.38, h * 0.2], [0.41, h * 0.5], [0.38, h * 0.8], [0.32, h], [0, h]], wood, 14);
  g.add(body);
  const iron = toon(X.stoneLight);
  for (const [hy, r] of [[0.08, 0.335], [0.3, 0.395], [0.7, 0.395], [0.92, 0.335]]) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 4, 18), iron);
    hoop.rotation.x = Math.PI / 2;
    hoop.position.y = hy;
    g.add(hoop);
  }
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.02, 14), woodDark);
  lid.position.y = h;
  g.add(lid);
  if (lying) {
    g.rotation.z = Math.PI / 2;
    g.position.set(x + h / 2, y + 0.41, z);
  } else {
    g.position.set(x, y, z);
  }
  g.rotation.y = turn;
  return tag(g, 185 + Math.round(Math.abs(x * 7 + z * 3)) % 10);
};

/** A slatted wooden crate, `w` x `h` x `d`, its base centred at (x, z). */
export const crate = (x: number, y: number, z: number, w = 0.9, h = 0.7, d = 0.7) => {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood);
  core.position.y = h / 2;
  g.add(core);
  for (const sy of [0.04, h - 0.04]) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.08, d + 0.04), woodDark);
    slat.position.y = sy;
    g.add(slat);
  }
  for (const sx of [-w / 2, w / 2]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, h, d + 0.04), woodDark);
    post.position.set(sx, h / 2, 0);
    g.add(post);
  }
  g.position.set(x, y, z);
  return tag(g, 196 + Math.round(Math.abs(x * 5 + z)) % 10);
};
