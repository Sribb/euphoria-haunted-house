import * as THREE from "three";
import { doorSeal, wisp } from "../art/props";
import { HAUNTED_PIXEL_PALETTE as P } from "../lib/pixel/haunted-palette";
import { Billboard } from "./billboard";
import { Candle } from "./candles";
import { box, COS_P, SCENE_EXTRAS as X, toon, toonMap, UNIT_PX, worldUV } from "./look";
import { dialParts, gear, hourglass, roundOpening } from "./props-clock";
import { archInfill, archTrim, cobweb, jackOLantern, pedestalTable, turnedLeg } from "./props3d";
import type { Clue, Rect, Room } from "./room";
import { stoneBlocks } from "./textures-cellar";
import { nightSky, planks, spriteTextures } from "./textures";

/**
 * Room 3, The Clock Tower, in 3D. The great dial is a real round opening in the back wall: the moon
 * shines through it, so the dial, its hour marks and its turning hands fall as shadow across the floor.
 * On the right a train of four gears, each bigger than the last, turns slower and slower. The
 * Clockmaker's workbench is on the left, and two hourglasses stand on a table at the front right.
 * Same coordinates as the other rooms: back wall inner face at z = -6.25, open toward the camera.
 */

const WALL_Z = -6.25;
const WALL_H = 5;
const DOOR_W = 1.125;
const DOOR_TOP = 3.125;
const DIAL = { x: -4.4, y: 2.7, r: 1.9 };

export const buildClockTower = (): Room => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#06040A");
  const colliders: Rect[] = [];
  const billboards: Billboard[] = [];
  const add = (o: THREE.Object3D, pid: number) => {
    o.traverse((c) => (c.userData.pid = c.userData.pid ?? pid));
    scene.add(o);
    return o;
  };
  const floorMat = toonMap(planks());
  const wallMat = toonMap(stoneBlocks());
  const wood = toon(X.wood);
  const woodDark = toon(X.woodDark);
  const woodLight = toon(X.woodLight);
  const brass = toon(P.g);
  const brassLight = toon(P.G);
  const brassDeep = toon(P.O);
  const iron = toon(X.stoneLight);

  // ---- floor, side walls, and the back wall with the great dial and the door
  add(box([-8, -0.25, WALL_Z], [8, 0, 5], floorMat, 64), 10);
  add(box([-8.5, 0, WALL_Z - 0.5], [-8, WALL_H, 5], wallMat, 32), 140);
  add(box([8, 0, WALL_Z - 0.5], [8.5, WALL_H, 5], wallMat, 32), 140);
  const back = new THREE.Group();
  const wz: [number, number] = [WALL_Z - 0.5, WALL_Z];
  const piece = (x0: number, x1: number, y0: number, y1: number) => back.add(box([x0, y0, wz[0]], [x1, y1, wz[1]], wallMat, 32));
  const opening = roundOpening(DIAL.x, DIAL.y, DIAL.r, wz[0], wz[1], wallMat);
  worldUV(opening.mesh.geometry, 32);
  back.add(opening.mesh);
  const [ox0, ox1, oy0, oy1] = [DIAL.x - opening.half, DIAL.x + opening.half, DIAL.y - opening.half, DIAL.y + opening.half];
  piece(-8, ox0, 0, WALL_H);
  piece(ox0, ox1, 0, oy0);
  piece(ox0, ox1, oy1, WALL_H);
  piece(ox1, -DOOR_W, 0, WALL_H);
  piece(-DOOR_W, DOOR_W, DOOR_TOP, WALL_H);
  piece(DOOR_W, 8, 0, WALL_H);
  const doorArch = archInfill(0, DOOR_TOP - DOOR_W, DOOR_W, wz[0], wz[1], wallMat);
  worldUV(doorArch.geometry, 32);
  back.add(doorArch);
  add(back, 141);
  // timber: a beam along the top and posts at the corners
  add(box([-8, WALL_H - 0.32, WALL_Z], [8, WALL_H, WALL_Z + 0.3], woodDark), 144);
  for (const x of [-7.95, 7.55]) add(box([x, 0, WALL_Z], [x + 0.4, WALL_H - 0.32, WALL_Z + 0.3], wood), 145);

  // the dial: night sky behind it, a brass ring, hour marks and two hands in front of the opening
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ map: nightSky() }));
  sky.position.set(DIAL.x, DIAL.y, WALL_Z - 0.62);
  sky.userData.pid = 0;
  scene.add(sky);
  const dial = dialParts(DIAL.x, DIAL.y, DIAL.r, WALL_Z + 0.04);
  add(dial.group, 165);

  // the door: a short dark passage, a brass frame, and the ward
  const passage = new THREE.Group();
  const END = -8.25;
  passage.add(box([-DOOR_W, -0.25, END], [DOOR_W, 0, WALL_Z - 0.5], floorMat, 64));
  passage.add(box([-DOOR_W - 0.5, 0, END], [-DOOR_W, DOOR_TOP, WALL_Z - 0.5], wallMat, 32));
  passage.add(box([DOOR_W, 0, END], [DOOR_W + 0.5, DOOR_TOP, WALL_Z - 0.5], wallMat, 32));
  passage.add(box([-DOOR_W - 0.5, DOOR_TOP, END], [DOOR_W + 0.5, DOOR_TOP + 0.08, WALL_Z - 0.5], wallMat, 32));
  passage.add(box([-DOOR_W, 0, END - 0.4], [DOOR_W, DOOR_TOP, END], wallMat, 32));
  add(passage, 146);
  const frame = new THREE.Group();
  frame.add(box([-DOOR_W - 0.1875, 0, WALL_Z], [-DOOR_W, DOOR_TOP - DOOR_W, WALL_Z + 0.125], brass));
  frame.add(box([DOOR_W, 0, WALL_Z], [DOOR_W + 0.1875, DOOR_TOP - DOOR_W, WALL_Z + 0.125], brass));
  frame.add(archTrim(0, DOOR_TOP - DOOR_W, DOOR_W + 0.09, WALL_Z + 0.06, brass));
  add(frame, 147);
  const sealH = 40 / (UNIT_PX * COS_P);
  const seal = new THREE.Mesh(
    new THREE.PlaneGeometry(28 / UNIT_PX, sealH),
    new THREE.MeshBasicMaterial({ map: spriteTextures(doorSeal)[0], alphaTest: 0.5, transparent: true }),
  );
  seal.position.set(0, sealH / 2, WALL_Z - 0.1);
  seal.userData.noInfo = true;
  scene.add(seal);
  const sealLight = new THREE.PointLight("#E0559F", 2.2, 4, 1.2);
  sealLight.position.set(0, 1.6, WALL_Z + 0.6);
  scene.add(sealLight);
  const passageGlow = new THREE.PointLight("#FFD47A", 0, 4, 1.2);
  passageGlow.position.set(0, 1.4, -7.6);
  scene.add(passageGlow);

  // ---- clue 1: the gear train (back right). Each gear is bigger than the last and turns slower.
  const train: { mesh: THREE.Mesh; speed: number }[] = [];
  const spec: [number, number, number, number, THREE.Material][] = [
    [2.2, 1.5, 0.28, 8, brassLight],
    [2.8, 2.0, 0.45, 12, brass],
    [3.96, 2.42, 0.7, 18, brassDeep],
    [5.75, 2.9, 1.05, 26, brass],
  ];
  spec.forEach(([x, y, r, teeth, mat], i) => {
    const m = gear(r, teeth, mat);
    m.position.set(x, y, WALL_Z + 0.04 + (i % 2) * 0.05);
    add(m, 166 + i);
    train.push({ mesh: m, speed: ((i % 2 ? -1 : 1) * 0.5 * 0.28) / r });
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.2, 0.3, 8), iron);
    axle.rotation.x = Math.PI / 2;
    axle.position.set(x, y, WALL_Z + 0.15);
    add(axle, 170);
  });
  const stand = new THREE.Group();
  const [sx, sz] = [7.0, -4.7];
  stand.add(box([sx - 0.25, 0, sz - 0.25], [sx + 0.25, 0.06, sz + 0.25], toon(P.K)));
  stand.add(box([sx - 0.04, 0.06, sz - 0.04], [sx + 0.04, 1.3, sz + 0.04], iron));
  add(stand, 157);
  colliders.push({ x0: sx - 0.3, z0: sz - 0.3, x1: sx + 0.3, z1: sz + 0.3 });

  // ---- clue 2: the Clockmaker's workbench along the left wall, with his notes open on it
  const bench = new THREE.Group();
  const [bx0, bx1, bz0, bz1] = [-7.7, -6.0, -1.7, -0.3];
  bench.add(box([bx0, 0.86, bz0], [bx1, 0.96, bz1], woodLight));
  bench.add(box([bx0 + 0.08, 0.6, bz0 + 0.06], [bx1 - 0.08, 0.86, bz1 - 0.06], wood));
  for (const [lx, lz] of [[bx0 + 0.14, bz0 + 0.14], [bx1 - 0.14, bz0 + 0.14], [bx0 + 0.14, bz1 - 0.14], [bx1 - 0.14, bz1 - 0.14]]) {
    const leg = turnedLeg(0.6);
    leg.position.set(lx, 0, lz);
    bench.add(leg);
  }
  add(bench, 150);
  const notes = box([-7.15, 0.96, -1.25], [-6.45, 0.99, -0.75], toon(P.w));
  add(notes, 36);
  for (let i = 0; i < 4; i++) add(box([-7.08, 0.992, -1.18 + i * 0.1], [-6.52 - (i % 2) * 0.12, 0.996, -1.15 + i * 0.1], toon(P.X)), 37);
  const loose = gear(0.16, 8, brassLight, 0.04);
  loose.rotation.x = -Math.PI / 2;
  loose.position.set(-6.25, 0.965, -0.55);
  add(loose, 171);
  colliders.push({ x0: bx0, z0: bz0, x1: bx1, z1: bz1 });
  // a few gears left lying on the floor
  for (const [gx, gz, gr] of [[-5.4, 0.6, 0.3], [-4.9, 1.1, 0.18], [6.9, 3.2, 0.24]]) {
    const fg = gear(gr, 10, brassDeep, 0.05);
    fg.rotation.x = -Math.PI / 2;
    fg.position.set(gx, 0.012, gz);
    add(fg, 172);
  }

  // ---- clue 3: two hourglasses on a table (front right). One was turned sooner.
  scene.add(pedestalTable(5.4, 1.2));
  scene.add(hourglass(5.14, 0.78, 1.25, 0.85, P.G), hourglass(5.68, 0.78, 1.25, 0.2, P.x));
  colliders.push({ x0: 4.95, z0: 0.75, x1: 5.85, z1: 1.65 });

  // ---- the three progress candles: on the iron stand, on the workbench, on the hourglass table
  const candles = [
    new Candle(new THREE.Vector3(sx, 1.3, sz)),
    new Candle(new THREE.Vector3(-7.35, 0.96, -0.6)),
    new Candle(new THREE.Vector3(5.4, 0.78, 0.98), 3.2, 0.24),
  ];
  for (const c of candles) scene.add(c.group);

  scene.add(cobweb(-7.4, WALL_H - 0.95, WALL_Z + 0.35, 1.2, 0), cobweb(7.4, WALL_H - 0.95, WALL_Z + 0.35, 1.2, Math.PI));
  const pumpkins = [jackOLantern(-1.8, 0, WALL_Z + 0.75, 1, 0.3), jackOLantern(1.8, 0, WALL_Z + 0.75, 0.9, -0.3)];
  for (const pk of pumpkins) {
    pk.traverse((o) => { if ((o as THREE.Mesh).isMesh && o.userData.noInfo) (o as THREE.Mesh).castShadow = false; });
    scene.add(pk);
    colliders.push({ x0: pk.position.x - 0.3, z0: pk.position.z - 0.3, x1: pk.position.x + 0.3, z1: pk.position.z + 0.3 });
  }

  // ---- clues, each marked by a wisp until found
  const clue = (id: string, at: [number, number], wispAt: [number, number, number], candle: number): Clue => {
    const w = new Billboard(wisp, { noInfo: true });
    w.position.set(...wispAt);
    scene.add(w.group);
    billboards.push(w);
    return { id, at: new THREE.Vector3(at[0], 0, at[1]), radius: 1.5, candle, wisp: w, found: false };
  };
  const clues = [
    clue("gears", [4.6, WALL_Z + 1.5], [3.96, 3.5, WALL_Z + 0.4], 0),
    clue("notes", [-5.3, -1.0], [-6.8, 1.7, -1.0], 1),
    clue("hourglasses", [5.4, 2.3], [5.4, 2.1, 1.25], 2),
  ];

  // ---- light: dim violet, and the moon straight through the dial
  scene.add(new THREE.AmbientLight("#5A4C8E", 2.5));
  const moon = new THREE.DirectionalLight("#9CC2F5", 6);
  // low enough (rise 6 over 16) that the wall's shadow covers the floor; the dial's light lands as a long oval
  moon.position.set(-7, 6, -17);
  moon.target.position.set(-4, 0, -1);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.bias = -0.002;
  moon.shadow.normalBias = 0.03;
  Object.assign(moon.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 });
  scene.add(moon, moon.target);
  const roomLight = new THREE.PointLight("#FFD47A", 0, 22, 0.8);
  roomLight.position.set(0, 3.4, -1.5);
  scene.add(roomLight);

  const dustCount = 60;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) dustPos.set([DIAL.x + (Math.random() - 0.3) * 3.5, Math.random() * 3.6, -5 + Math.random() * 7], i * 3);
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: P.B, size: 1, sizeAttenuation: false }));
  dust.userData.noInfo = true;
  scene.add(dust);

  const state = { doorOpen: false, roomGlow: 0, sealFade: 1 };
  const update = (dt: number, t: number, camera: THREE.Camera, reducedMotion: boolean) => {
    for (const c of candles) c.update(dt, t, camera, reducedMotion);
    for (const b of billboards) b.update(dt, camera, reducedMotion);
    clues.forEach((c, i) => { if (!c.found) c.wisp.lift = reducedMotion ? 0 : 0.12 * Math.sin(t * 2.2 + i * 2); });
    if (!reducedMotion) {
      for (const g of train) g.mesh.rotation.z += g.speed * dt;
      // the hands tick: the minute hand jumps once a second, like a tower clock
      dial.minute.rotation.z = -Math.floor(t) * ((Math.PI * 2) / 60) - 5.76;
      dial.hour.rotation.z = -t * ((Math.PI * 2) / 720) - 6.0;
      const a = dustGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < dustCount; i++) {
        let y = a.getY(i) + dt * 0.05;
        if (y > 3.8) y = 0.2;
        a.setY(i, y);
      }
      a.needsUpdate = true;
    }
    pumpkins.forEach((pk, i) => {
      (pk.userData.light as THREE.PointLight).intensity = reducedMotion ? 1.6 : 1.6 * (0.85 + 0.1 * Math.sin(t * 11 + i * 2));
    });
    roomLight.intensity = 8 * state.roomGlow;
    if (state.doorOpen) {
      state.sealFade = Math.max(0, state.sealFade - dt * 0.8);
      (seal.material as THREE.MeshBasicMaterial).opacity = state.sealFade;
      seal.visible = state.sealFade > 0.02;
      sealLight.intensity = 2.2 * state.sealFade;
      passageGlow.intensity = 3 * (1 - state.sealFade);
    } else {
      sealLight.intensity = 2.2 * (0.8 + 0.2 * Math.sin(t * 2.5));
    }
  };

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
