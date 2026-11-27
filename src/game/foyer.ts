import * as THREE from "three";
import { clockFace, doorSeal, portraitLend, portraitOwn, wisp } from "../art/props";
import { HAUNTED_PIXEL_PALETTE as P } from "../lib/pixel/haunted-palette";
import { Billboard } from "./billboard";
import { Candle } from "./candles";
import type { Clue, Rect, Room } from "./room";
import { box, COS_P, SCENE_EXTRAS as X, toon, toonMap, UNIT_PX, worldUV } from "./look";
import { archInfill, archTrim, armchair, candelabra, cobweb, deadPlant, jackOLantern, lathe, pedestalTable, trunk, turnedLeg } from "./props3d";
import { books, nightSky, planks, rug, spriteTextures, wainscot, wallpaper } from "./textures";

/**
 * Room 1, The Foyer, in 3D. Coordinates: x to the right, y up, z toward the camera. The back wall's inner
 * face is at z = -6.25 and the room is open toward the camera. Feature heights are whole screen pixels
 * (multiples of 1 / (UNIT_PX * COS_P)), so wall edges and textures line up with the pixel grid.
 */


const WALL_Z = -6.25;
const WALL_H = 5;
const SILL = 1.25;
const WIN_TOP = 3.75;
const DOOR_W = 1.125;
const DOOR_TOP = 3.125;
const WINDOWS = [-5, 5];

/** A plane showing a sprite, flat against the back wall, sized so each texel is one screen pixel. */
const wallSprite = (tex: THREE.Texture, wPx: number, hPx: number, cx: number, bottom: number, z: number, basic = false) => {
  const w = wPx / UNIT_PX, h = hPx / (UNIT_PX * COS_P);
  const mat = basic
    ? new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, transparent: true })
    : toonMap(tex, { alphaTest: 0.5 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(cx, bottom + h / 2, z);
  return m;
};

export const buildFoyer = (): Room => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#07050C");
  const colliders: Rect[] = [];
  const billboards: Billboard[] = [];
  const add = (o: THREE.Object3D, pid: number) => {
    o.traverse((c) => (c.userData.pid = c.userData.pid ?? pid));
    scene.add(o);
    return o;
  };

  // ---- materials
  const floorMat = toonMap(planks());
  const wallMat = toonMap(wallpaper());
  const wainMat = toonMap(wainscot());
  const woodDark = toon(X.woodDark);
  const wood = toon(X.wood);
  const woodLight = toon(X.woodLight);
  const brass = toon(P.g);
  const stone = toon(X.stoneDeep);
  const curtain = toon(P.p);
  const curtainDeep = toon(P.E);

  // ---- floor, side walls, back wall with two windows and a doorway
  add(box([-8, -0.25, WALL_Z], [8, 0, 5], floorMat, 64), 10);
  add(box([-8.5, 0, WALL_Z - 0.5], [-8, WALL_H, 5], stone), 140);
  add(box([8, 0, WALL_Z - 0.5], [8.5, WALL_H, 5], stone), 140);
  const back = new THREE.Group();
  const wz: [number, number] = [WALL_Z - 0.5, WALL_Z];
  const piece = (x0: number, x1: number, y0: number, y1: number) => back.add(box([x0, y0, wz[0]], [x1, y1, wz[1]], wallMat, 32));
  const [wl, wr] = [WINDOWS[0] - 0.875, WINDOWS[0] + 0.875];
  piece(-8, wl, 0, WALL_H);
  piece(wl, wr, 0, SILL);
  piece(wl, wr, WIN_TOP, WALL_H);
  piece(wr, -DOOR_W, 0, WALL_H);
  piece(-DOOR_W, DOOR_W, DOOR_TOP, WALL_H);
  piece(DOOR_W, -wr, 0, WALL_H);
  piece(-wr, -wl, 0, SILL);
  piece(-wr, -wl, WIN_TOP, WALL_H);
  piece(-wl, 8, 0, WALL_H);
  // arched tops: the wall fills the corners above a half circle, so the moonlight lands arched too
  for (const cx of WINDOWS) {
    const a = archInfill(cx, WIN_TOP - 0.875, 0.875, wz[0], wz[1], wallMat);
    worldUV(a.geometry, 32);
    back.add(a);
  }
  const doorArch = archInfill(0, DOOR_TOP - DOOR_W, DOOR_W, wz[0], wz[1], wallMat);
  worldUV(doorArch.geometry, 32);
  back.add(doorArch);
  add(back, 141);
  // wainscot skin, chair rail, crown molding
  for (const [x0, x1] of [[-8, -DOOR_W], [DOOR_W, 8]]) {
    add(box([x0, 0, WALL_Z], [x1, SILL, WALL_Z + 0.0625], wainMat, 32), 142);
    add(box([x0, SILL, WALL_Z], [x1, SILL + 0.078, WALL_Z + 0.125], woodLight), 143);
  }
  add(box([-8, WALL_H - 0.156, WALL_Z], [8, WALL_H, WALL_Z + 0.1875], woodDark), 144);

  // windows: sills, frames, mullions, curtains, and the night outside
  for (const cx of WINDOWS) {
    const g = new THREE.Group();
    g.add(box([cx - 1.0, SILL - 0.078, WALL_Z], [cx + 1.0, SILL, WALL_Z + 0.25], woodLight));
    g.add(box([cx - 0.04, SILL, WALL_Z - 0.3], [cx + 0.04, WIN_TOP, WALL_Z - 0.2], woodDark));
    g.add(box([cx - 0.875, 2.5, WALL_Z - 0.3], [cx + 0.875, 2.58, WALL_Z - 0.2], woodDark));
    g.add(archTrim(cx, WIN_TOP - 0.875, 0.93, WALL_Z + 0.04, woodLight));
    add(g, 145);
    const c = new THREE.Group();
    c.add(box([cx - 1.375, 0.95, WALL_Z + 0.05], [cx - 0.8125, WIN_TOP + 0.3, WALL_Z + 0.3], curtain));
    c.add(box([cx + 0.8125, 0.95, WALL_Z + 0.05], [cx + 1.375, WIN_TOP + 0.3, WALL_Z + 0.3], curtain));
    c.add(box([cx - 1.5, WIN_TOP + 0.2, WALL_Z + 0.05], [cx + 1.5, WIN_TOP + 0.55, WALL_Z + 0.35], curtainDeep));
    add(c, cx < 0 ? 55 : 65);
  }
  // the night shows only through the window openings, so nothing peeks over the wall
  const skyTex = nightSky();
  WINDOWS.forEach((cx, i) => {
    const t = skyTex.clone();
    t.repeat.set(0.5, 1);
    t.offset.set(i * 0.5, 0);
    t.needsUpdate = true;
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(2.2, WIN_TOP - SILL + 0.4), new THREE.MeshBasicMaterial({ map: t }));
    sky.position.set(cx, (SILL + WIN_TOP) / 2, WALL_Z - 0.6);
    sky.userData.pid = 0;
    scene.add(sky);
  });

  // the doorway: a short dark corridor behind it, a gold frame, and the ward
  const corridor = new THREE.Group();
  // kept short and low so it never peeks over the back wall at this camera angle
  const END = -8.25;
  corridor.add(box([-DOOR_W, -0.25, END], [DOOR_W, 0, WALL_Z - 0.5], floorMat, 64));
  corridor.add(box([-DOOR_W - 0.5, 0, END], [-DOOR_W, DOOR_TOP, WALL_Z - 0.5], stone));
  corridor.add(box([DOOR_W, 0, END], [DOOR_W + 0.5, DOOR_TOP, WALL_Z - 0.5], stone));
  corridor.add(box([-DOOR_W - 0.5, DOOR_TOP, END], [DOOR_W + 0.5, DOOR_TOP + 0.08, WALL_Z - 0.5], stone));
  corridor.add(box([-DOOR_W, 0, END - 0.4], [DOOR_W, DOOR_TOP, END], stone));
  add(corridor, 146);
  const frame = new THREE.Group();
  frame.add(box([-DOOR_W - 0.1875, 0, WALL_Z], [-DOOR_W, DOOR_TOP - DOOR_W, WALL_Z + 0.125], brass));
  frame.add(box([DOOR_W, 0, WALL_Z], [DOOR_W + 0.1875, DOOR_TOP - DOOR_W, WALL_Z + 0.125], brass));
  frame.add(archTrim(0, DOOR_TOP - DOOR_W, DOOR_W + 0.09, WALL_Z + 0.06, brass));
  frame.add(box([-0.25, DOOR_TOP + 0.078, WALL_Z + 0.05], [0.25, DOOR_TOP + 0.39, WALL_Z + 0.19], toon(P.G)));
  add(frame, 147);
  const seal = wallSprite(spriteTextures(doorSeal)[0], 28, 40, 0, 0, WALL_Z - 0.1, true);
  seal.userData.noInfo = true;
  scene.add(seal);
  const sealLight = new THREE.PointLight("#E0559F", 2.2, 4, 1.2);
  sealLight.position.set(0, 1.6, WALL_Z + 0.6);
  scene.add(sealLight);
  const corridorGlow = new THREE.PointLight("#FFD47A", 0, 4, 1.2);
  corridorGlow.position.set(0, 1.4, -7.6);
  scene.add(corridorGlow);

  // the rug
  const rugMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 10), toonMap(rug()));
  rugMesh.rotation.x = -Math.PI / 2;
  rugMesh.position.set(0, 0.012, WALL_Z + 5);
  rugMesh.receiveShadow = true;
  add(rugMesh, 11);

  // side tables (the left one has the drawer)
  const table = (cx: number, drawer: boolean) => {
    const g = new THREE.Group();
    const [x0, x1, z0, z1] = [cx - 0.625, cx + 0.625, WALL_Z + 0.05, WALL_Z + 0.8];
    g.add(box([x0, 0.92, z0], [x1, 1.0, z1], woodLight));
    g.add(box([x0 + 0.06, 0.7, z0 + 0.04], [x1 - 0.06, 0.92, z1 - 0.04], wood));
    for (const [lx, lz] of [[x0 + 0.12, z0 + 0.1], [x1 - 0.12, z0 + 0.1], [x0 + 0.12, z1 - 0.1], [x1 - 0.12, z1 - 0.1]]) {
      const leg = turnedLeg(0.7);
      leg.position.set(lx, 0, lz);
      g.add(leg);
    }
    if (drawer) {
      g.add(box([cx - 0.4, 0.74, z1 - 0.04], [cx + 0.4, 0.88, z1 + 0.02], woodDark));
      g.add(box([cx - 0.05, 0.79, z1 + 0.02], [cx + 0.05, 0.84, z1 + 0.06], toon(P.y)));
    }
    add(g, drawer ? 150 : 152);
    colliders.push({ x0, z0: WALL_Z, x1, z1 });
  };
  table(-2.625, true);
  table(2.625, false);

  // the two portraits above the right table
  ([[1.85, portraitOwn], [3.05, portraitLend]] as const).forEach(([cx, sprite], i) => {
    const pic = wallSprite(spriteTextures(sprite)[0], 16, 20, cx, 1.9, WALL_Z + 0.07);
    const f = new THREE.Group();
    const h = 20 / (UNIT_PX * COS_P);
    f.add(box([cx - 0.5625, 1.82, WALL_Z], [cx + 0.5625, 1.9, WALL_Z + 0.1], brass));
    f.add(box([cx - 0.5625, 1.9 + h, WALL_Z], [cx + 0.5625, 1.98 + h, WALL_Z + 0.1], brass));
    f.add(box([cx - 0.5625, 1.82, WALL_Z], [cx - 0.5, 1.98 + h, WALL_Z + 0.1], brass));
    f.add(box([cx + 0.5, 1.82, WALL_Z], [cx + 0.5625, 1.98 + h, WALL_Z + 0.1], brass));
    add(f, 170 + i);
    add(pic, 30 + i);
  });

  // the grandfather clock, with a swinging pendulum
  const clock = new THREE.Group();
  const [kx0, kx1, kz0, kz1] = [-7.625, -6.625, WALL_Z + 0.05, WALL_Z + 0.65];
  clock.add(box([kx0 + 0.06, 0, kz0], [kx1 - 0.06, 0.3, kz1], woodDark));
  clock.add(box([kx0 + 0.12, 0.3, kz0], [kx1 - 0.12, 2.1, kz1 - 0.06], wood));
  clock.add(box([kx0, 2.1, kz0], [kx1, 3.3, kz1], wood));
  clock.add(box([kx0 - 0.06, 3.3, kz0], [kx1 + 0.06, 3.45, kz1 + 0.04], woodDark));
  clock.add(box([kx0 + 0.25, 0.55, kz1 - 0.06], [kx1 - 0.25, 1.95, kz1 - 0.04], toon(X.woodDeep)));
  for (const [fx, fh] of [[kx0 + 0.08, 0.3], [-7.125, 0.45], [kx1 - 0.08, 0.3]]) {
    const fin = lathe([[0, 0], [0.07, 0], [0.04, fh * 0.4], [0.06, fh * 0.6], [0, fh]], brass, 8);
    fin.position.set(fx, 3.45, (kz0 + kz1) / 2);
    clock.add(fin);
  }
  add(clock, 155);
  add(wallSprite(spriteTextures(clockFace)[0], 14, 14, -7.125, 2.25, kz1 + 0.01), 35);
  const pendulum = new THREE.Group();
  pendulum.position.set(-7.125, 1.9, kz1 - 0.02);
  const rod = box([-0.02, -1.1, -0.01], [0.02, 0, 0.01], brass);
  const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 12), toon(P.G));
  bob.rotation.x = Math.PI / 2;
  bob.position.set(0, -1.15, 0);
  pendulum.add(rod, bob);
  add(pendulum, 156);
  colliders.push({ x0: kx0, z0: WALL_Z, x1: kx1, z1: kz1 });

  // the tall iron candle stand beside the clock, and the bookshelf on the far right
  const stand = new THREE.Group();
  const [sx, sz] = [-5.9, -4.9];
  stand.add(box([sx - 0.25, 0, sz - 0.25], [sx + 0.25, 0.06, sz + 0.25], toon(P.K)));
  stand.add(box([sx - 0.04, 0.06, sz - 0.04], [sx + 0.04, 1.3, sz + 0.04], toon(X.stoneLight)));
  add(stand, 157);
  colliders.push({ x0: sx - 0.3, z0: sz - 0.3, x1: sx + 0.3, z1: sz + 0.3 });
  const shelf = new THREE.Group();
  shelf.add(box([6.5, 0, WALL_Z + 0.02], [7.875, 3.0, WALL_Z + 0.6], woodDark));
  shelf.add(box([6.56, 0.1, WALL_Z + 0.6], [7.81, 2.94, WALL_Z + 0.61], toonMap(books()), 32));
  add(shelf, 158);
  colliders.push({ x0: 6.5, z0: WALL_Z, x1: 7.875, z1: WALL_Z + 0.6 });

  // the rest of the room: an armchair by a candelabra, a trunk spilling coins, dead plants, cobwebs,
  // and jack-o'-lanterns whose inner lights paint the floor orange
  add(armchair(-5.7, 0.4, 0.5), 180);
  scene.add(pedestalTable(-5.9, 2.0));
  scene.add(candelabra(-5.9, 0.78, 2.0));
  scene.add(trunk(5.5, 0.6, -0.35));
  scene.add(deadPlant(-7.25, 4.0), deadPlant(7.25, 4.0));
  colliders.push(
    { x0: -6.2, z0: -0.1, x1: -5.2, z1: 0.9 },
    { x0: -6.3, z0: 1.6, x1: -5.5, z1: 2.4 },
    { x0: 4.85, z0: 0.15, x1: 6.15, z1: 1.05 },
    { x0: -7.55, z0: 3.7, x1: -6.95, z1: 4.3 },
    { x0: 6.95, z0: 3.7, x1: 7.55, z1: 4.3 },
  );
  const pumpkins = [
    jackOLantern(-1.75, 0, WALL_Z + 0.75, 1, 0.3),
    jackOLantern(1.75, 0, WALL_Z + 0.75, 0.9, -0.3),
    jackOLantern(-4.6, 0, 1.3, 1.1, 0.6),
    jackOLantern(6.4, 0, 2.6, 0.95, -0.5),
  ];
  for (const pk of pumpkins) {
    pk.traverse((o) => { if ((o as THREE.Mesh).isMesh && o.userData.noInfo) (o as THREE.Mesh).castShadow = false; });
    scene.add(pk);
    colliders.push({ x0: pk.position.x - 0.3, z0: pk.position.z - 0.3, x1: pk.position.x + 0.3, z1: pk.position.z + 0.3 });
  }
  scene.add(cobweb(-7.4, WALL_H - 0.6, WALL_Z + 0.2, 1.2, 0), cobweb(7.4, WALL_H - 0.6, WALL_Z + 0.2, 1.2, Math.PI));

  // when the ghost is freed, a warm light swells through the whole room
  const roomLight = new THREE.PointLight("#FFD47A", 0, 22, 0.8);
  roomLight.position.set(0, 3.4, -1.5);
  scene.add(roomLight);

  // the three progress candles
  const candles = [
    new Candle(new THREE.Vector3(-2.625, 1.0, WALL_Z + 0.45)),
    new Candle(new THREE.Vector3(2.625, 1.0, WALL_Z + 0.45)),
    new Candle(new THREE.Vector3(sx, 1.3, sz)),
  ];
  for (const c of candles) scene.add(c.group);

  // clues, each marked by a wisp until found
  const clue = (id: string, at: [number, number], wispAt: [number, number, number], candle: number): Clue => {
    const w = new Billboard(wisp, { noInfo: true });
    w.position.set(...wispAt);
    scene.add(w.group);
    billboards.push(w);
    return { id, at: new THREE.Vector3(at[0], 0, at[1]), radius: 1.35, candle, wisp: w, found: false };
  };
  const clues = [
    clue("drawer", [-2.625, WALL_Z + 1.5], [-2.625, 0.55, WALL_Z + 0.95], 0),
    clue("portraits", [2.45, WALL_Z + 1.5], [2.45, 3.6, WALL_Z + 0.3], 1),
    clue("clock", [-7.0, WALL_Z + 1.55], [-7.125, 3.7, WALL_Z + 0.8], 2),
  ];

  // light: a dim violet room, moonlight through the windows, and dust drifting in the beams
  // three.js divides ambient and directional light by pi, hence the large-looking numbers
  scene.add(new THREE.AmbientLight("#6A5A9A", 2.3));
  const moon = new THREE.DirectionalLight("#9CC2F5", 5.5);
  // low enough (rise 6 over 16) that the wall's shadow reaches past the front of the floor
  moon.position.set(-3, 6, -17);
  moon.target.position.set(0, 0, -1);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.bias = -0.002; // these two stop striped shadow acne (Tiny Why notes)
  moon.shadow.normalBias = 0.03;
  Object.assign(moon.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 });
  scene.add(moon, moon.target);

  const dustCount = 70;
  const dustPos = new Float32Array(dustCount * 3);
  const dustSeed = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    const side = i % 2 ? 1 : -1;
    dustPos.set([side * 5 + (Math.random() - 0.5) * 2.2, Math.random() * 3.2, -4 + Math.random() * 4.5], i * 3);
    dustSeed[i] = Math.random() * 10;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: P.B, size: 1, sizeAttenuation: false }));
  dust.userData.noInfo = true;
  scene.add(dust);

  const state = { doorOpen: false, roomGlow: 0, sealFade: 1 };

  const update = (dt: number, t: number, camera: THREE.Camera, reducedMotion: boolean) => {
    for (const c of candles) c.update(dt, t, camera, reducedMotion);
    for (const b of billboards) {
      b.update(dt, camera, reducedMotion);
    }
    clues.forEach((c, i) => {
      if (c.found) return;
      c.wisp.lift = reducedMotion ? 0 : 0.12 * Math.sin(t * 2.2 + i * 2);
    });
    pendulum.rotation.z = reducedMotion ? 0 : 0.22 * Math.sin(t * Math.PI);
    pumpkins.forEach((pk, i) => {
      const l = pk.userData.light as THREE.PointLight;
      l.intensity = reducedMotion ? 1.6 : 1.6 * (0.85 + 0.1 * Math.sin(t * 11 + i * 2) + 0.05 * Math.sin(t * 27 + i));
    });
    if (!reducedMotion) {
      const a = dustGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < dustCount; i++) {
        let y = a.getY(i) + dt * 0.06 * (0.5 + (dustSeed[i] % 1));
        if (y > 3.4) y = 0.2;
        a.setY(i, y);
        a.setX(i, a.getX(i) + Math.sin(t * 0.7 + dustSeed[i]) * dt * 0.05);
      }
      a.needsUpdate = true;
    }
    roomLight.intensity = 8 * state.roomGlow;
    if (state.doorOpen) {
      state.sealFade = Math.max(0, state.sealFade - dt * 0.8);
      (seal.material as THREE.MeshBasicMaterial).opacity = state.sealFade;
      seal.visible = state.sealFade > 0.02;
      sealLight.intensity = 2.2 * state.sealFade;
      corridorGlow.intensity = 3 * (1 - state.sealFade);
    } else {
      sealLight.intensity = 2.2 * (0.8 + 0.2 * Math.sin(t * 2.5));
    }
  };

  /** Free the ghost: the room fills with warm light and the door unseals. */
  const celebrate = () => {
    const start = performance.now();
    const ramp = () => {
      state.roomGlow = Math.min(1, (performance.now() - start) / 1400);
      if (state.roomGlow < 1) requestAnimationFrame(ramp);
    };
    requestAnimationFrame(ramp);
    setTimeout(() => (state.doorOpen = true), 1600);
  };

  return {
    scene,
    colliders,
    bounds: { x0: -7.7, x1: 7.7, z0: WALL_Z + 0.35, z1: 4.6 },
    clues,
    candles,
    ghostHome: new THREE.Vector3(0, 0, WALL_Z + 1.2),
    door: { x0: -DOOR_W + 0.3, x1: DOOR_W - 0.3, z: WALL_Z, corridorZ: -8.0, exitZ: -7.6 },
    spawn: new THREE.Vector3(0, 0, 3.4),
    view: { x0: -8.6, x1: 8.6, u0: -3.3, u1: 7.9 },
    state,
    update,
    celebrate,
  };
};
