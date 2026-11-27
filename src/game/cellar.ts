import * as THREE from "three";
import { doorSeal, smallFlame, wisp } from "../art/props";
import { HAUNTED_PIXEL_PALETTE as P } from "../lib/pixel/haunted-palette";
import { Billboard } from "./billboard";
import { Candle } from "./candles";
import { box, COS_P, SCENE_EXTRAS as X, toon, toonMap, UNIT_PX, worldUV } from "./look";
import { archInfill, archTrim, barrel, cobweb, crate, jackOLantern } from "./props3d";
import type { Clue, Rect, Room } from "./room";
import { barrelLabel, chalkTallies, flagstones, juiceLabel, stoneBlocks } from "./textures-cellar";
import { spriteTextures } from "./textures";

/**
 * Room 2, The Cellar, in 3D: stone vaults under the house. You come down the stairs on the left. A coal
 * furnace glows at the back right, a wine rack fills the back left, a grated window high in the wall lets
 * in one cold beam of moonlight, and the iron door out is sealed until the Gambler is freed.
 * Same coordinates as the Foyer: back wall inner face at z = -6.25, open toward the camera.
 */

const WALL_Z = -6.25;
const WALL_H = 5;
const DOOR_W = 1.125;
const DOOR_TOP = 3.125;

/** A plane flat on a wall, sized so each texel is one screen pixel. */
const wallPic = (tex: THREE.Texture, wPx: number, hPx: number, cx: number, bottom: number, z: number) => {
  const w = wPx / UNIT_PX, h = hPx / (UNIT_PX * COS_P);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), toonMap(tex, { alphaTest: 0.5, transparent: true }));
  m.position.set(cx, bottom + h / 2, z);
  return m;
};

export const buildCellar = (): Room => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#050309");
  const colliders: Rect[] = [];
  const billboards: Billboard[] = [];
  const add = (o: THREE.Object3D, pid: number) => {
    o.traverse((c) => (c.userData.pid = c.userData.pid ?? pid));
    scene.add(o);
    return o;
  };
  const floorMat = toonMap(flagstones());
  const wallMat = toonMap(stoneBlocks());
  const iron = toon(X.stoneLight);
  const ironDark = toon(P.K);
  const wood = toon(X.wood);
  const woodDark = toon(X.woodDark);

  // ---- floor, side walls, and a back wall with the iron door and a small grated window
  add(box([-8, -0.25, WALL_Z], [8, 0, 5], floorMat, 64), 10);
  add(box([-8.5, 0, WALL_Z - 0.5], [-8, WALL_H, 5], wallMat, 32), 140);
  add(box([8, 0, WALL_Z - 0.5], [8.5, WALL_H, 5], wallMat, 32), 140);
  const back = new THREE.Group();
  const wz: [number, number] = [WALL_Z - 0.5, WALL_Z];
  const piece = (x0: number, x1: number, y0: number, y1: number) => back.add(box([x0, y0, wz[0]], [x1, y1, wz[1]], wallMat, 32));
  const [gx0, gx1, gy0, gy1] = [4.0, 5.0, 3.75, 4.5];
  piece(-8, -DOOR_W, 0, WALL_H);
  piece(-DOOR_W, DOOR_W, DOOR_TOP, WALL_H);
  piece(DOOR_W, gx0, 0, WALL_H);
  piece(gx0, gx1, 0, gy0);
  piece(gx0, gx1, gy1, WALL_H);
  piece(gx1, 8, 0, WALL_H);
  const doorArch = archInfill(0, DOOR_TOP - DOOR_W, DOOR_W, wz[0], wz[1], wallMat);
  worldUV(doorArch.geometry, 32);
  back.add(doorArch);
  add(back, 141);
  for (let i = 0; i < 4; i++) back.add(box([gx0 + 0.15 + i * 0.25, gy0, WALL_Z - 0.3], [gx0 + 0.2 + i * 0.25, gy1, WALL_Z - 0.22], ironDark));
  // vault ribs: heavy stone arches springing from the side walls give the cellar its depth
  for (const z of [-3.2, 0.6]) {
    for (const s of [-1, 1]) add(box([s > 0 ? 7.55 : -8, 0, z - 0.3], [s > 0 ? 8 : -7.55, WALL_H, z + 0.3], toon(X.stone)), 148);
  }

  // the iron door: a short dark passage, an iron frame, and the ward that seals it
  const passage = new THREE.Group();
  const END = -8.25;
  passage.add(box([-DOOR_W, -0.25, END], [DOOR_W, 0, WALL_Z - 0.5], floorMat, 64));
  passage.add(box([-DOOR_W - 0.5, 0, END], [-DOOR_W, DOOR_TOP, WALL_Z - 0.5], wallMat, 32));
  passage.add(box([DOOR_W, 0, END], [DOOR_W + 0.5, DOOR_TOP, WALL_Z - 0.5], wallMat, 32));
  passage.add(box([-DOOR_W - 0.5, DOOR_TOP, END], [DOOR_W + 0.5, DOOR_TOP + 0.08, WALL_Z - 0.5], wallMat, 32));
  passage.add(box([-DOOR_W, 0, END - 0.4], [DOOR_W, DOOR_TOP, END], wallMat, 32));
  add(passage, 146);
  const frame = new THREE.Group();
  frame.add(box([-DOOR_W - 0.1875, 0, WALL_Z], [-DOOR_W, DOOR_TOP - DOOR_W, WALL_Z + 0.125], iron));
  frame.add(box([DOOR_W, 0, WALL_Z], [DOOR_W + 0.1875, DOOR_TOP - DOOR_W, WALL_Z + 0.125], iron));
  frame.add(archTrim(0, DOOR_TOP - DOOR_W, DOOR_W + 0.09, WALL_Z + 0.06, iron));
  for (const s of [-1, 1]) frame.add(box([s * 0.5 - 0.06, 0.3, WALL_Z + 0.02], [s * 0.5 + 0.06, 2.2, WALL_Z + 0.09], ironDark));
  add(frame, 147);
  const sealTex = spriteTextures(doorSeal)[0];
  const sealH = 40 / (UNIT_PX * COS_P);
  const seal = new THREE.Mesh(new THREE.PlaneGeometry(28 / UNIT_PX, sealH), new THREE.MeshBasicMaterial({ map: sealTex, alphaTest: 0.5, transparent: true }));
  seal.position.set(0, sealH / 2, WALL_Z - 0.1);
  seal.userData.noInfo = true;
  scene.add(seal);
  const sealLight = new THREE.PointLight("#E0559F", 2.2, 4, 1.2);
  sealLight.position.set(0, 1.6, WALL_Z + 0.6);
  scene.add(sealLight);
  const passageGlow = new THREE.PointLight("#FFD47A", 0, 4, 1.2);
  passageGlow.position.set(0, 1.4, -7.6);
  scene.add(passageGlow);

  // ---- the stairs down from the Foyer, along the left wall, rising toward the camera
  const stairs = new THREE.Group();
  const [sx0, sx1] = [-7.75, -6.25];
  for (let i = 0; i < 8; i++) {
    const z0 = 0.5 + i * 0.5;
    stairs.add(box([sx0, 0, z0], [sx1, (i + 1) * 0.3125, z0 + 0.5], toon(X.stone)));
    stairs.add(box([sx0, (i + 1) * 0.3125 - 0.06, z0], [sx1, (i + 1) * 0.3125, z0 + 0.08], toon(X.stoneLight)));
  }
  for (let i = 0; i < 8; i += 2) stairs.add(box([sx1 - 0.08, (i + 1) * 0.3125, 0.7 + i * 0.5], [sx1, (i + 1) * 0.3125 + 0.9, 0.78 + i * 0.5], woodDark));
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.4, 6), wood);
  rail.position.set(sx1 - 0.04, 2.15, 2.5);
  rail.rotation.x = -Math.atan2(0.3125 * 7, 3.5) + Math.PI / 2;
  stairs.add(rail);
  add(stairs, 149);
  colliders.push({ x0: sx0, z0: 0.5, x1: sx1, z1: 4.6 });

  // a wall torch at the foot of the stairs, so you never arrive in the dark
  const bracket = new THREE.Group();
  bracket.add(box([-7.98, 1.7, -0.62], [-7.86, 2.3, -0.38], ironDark));
  bracket.add(box([-7.9, 2.15, -0.56], [-7.55, 2.25, -0.44], ironDark));
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.5, 6), wood);
  stick.position.set(-7.5, 2.4, -0.5);
  bracket.add(stick);
  add(bracket, 164);
  const torchFlame = new Billboard(smallFlame, { noInfo: true });
  torchFlame.position.set(-7.5, 2.62, -0.5);
  scene.add(torchFlame.group);
  const torch = new THREE.PointLight("#FF9A3C", 3.2, 7, 1.1);
  torch.position.set(-7.1, 2.8, -0.3);
  scene.add(torch);

  // ---- the wine rack (back left): a frame of cubbies with bottle ends glinting
  const rack = new THREE.Group();
  rack.add(box([-7.6, 0, WALL_Z + 0.02], [-4.6, 3.2, WALL_Z + 0.55], woodDark));
  const bottle = new THREE.CylinderGeometry(0.07, 0.07, 0.12, 8);
  bottle.rotateX(Math.PI / 2);
  const bottles = new THREE.InstancedMesh(bottle, toon(P.b), 6 * 9);
  let k = 0;
  const m4 = new THREE.Matrix4();
  for (let row = 0; row < 6; row++) for (let col = 0; col < 9; col++) {
    m4.makeTranslation(-7.4 + col * 0.33, 0.3 + row * 0.5, WALL_Z + 0.6);
    bottles.setMatrixAt(k++, m4);
  }
  rack.add(bottles);
  for (let row = 0; row <= 6; row++) rack.add(box([-7.6, row * 0.5 + 0.02, WALL_Z + 0.55], [-4.6, row * 0.5 + 0.08, WALL_Z + 0.62], wood));
  add(rack, 159);
  colliders.push({ x0: -7.6, z0: WALL_Z, x1: -4.6, z1: WALL_Z + 0.62 });

  // ---- the coal furnace (back right): iron body, glowing grate, and a pipe up the wall
  const furnace = new THREE.Group();
  furnace.add(box([5.6, 0, WALL_Z + 0.1], [7.6, 1.9, WALL_Z + 1.3], ironDark));
  furnace.add(box([5.5, 1.9, WALL_Z + 0.05], [7.7, 2.05, WALL_Z + 1.35], iron));
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3.0, 8), iron);
  pipe.position.set(6.6, 3.5, WALL_Z + 0.5);
  furnace.add(pipe);
  add(furnace, 161);
  const grate = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ color: P["4"] }));
  grate.position.set(6.6, 0.75, WALL_Z + 1.31);
  grate.userData.noInfo = true;
  scene.add(grate);
  for (let i = 0; i < 4; i++) scene.add(box([6.05 + i * 0.36, 0.45, WALL_Z + 1.3], [6.11 + i * 0.36, 1.05, WALL_Z + 1.34], ironDark));
  const coals = new THREE.PointLight("#FF7A2E", 5, 9, 1.0);
  coals.position.set(6.6, 0.8, WALL_Z + 1.9);
  scene.add(coals);
  colliders.push({ x0: 5.5, z0: WALL_Z, x1: 7.7, z1: WALL_Z + 1.4 });

  // ---- clue 1: a stack of Sunny Juice crates (left middle)
  scene.add(crate(-3.6, 0, -1.6, 1.0, 0.7, 0.8), crate(-2.55, 0, -1.5, 0.9, 0.6, 0.7), crate(-3.45, 0.7, -1.6, 0.8, 0.55, 0.7));
  const label = wallPic(juiceLabel(), 24, 16, -3.6, 0.12, -1.18);
  label.userData.pid = 31;
  scene.add(label);
  colliders.push({ x0: -4.15, z0: -2.05, x1: -2.05, z1: -1.1 });

  // ---- clue 2: three barrels marked BONDS, MIX and STOCKS (right middle)
  const words: [string, string][] = [["BONDS", P.t], ["MIX", P.p], ["STOCKS", P.r]];
  // spaced 1.6 apart so the painted signs (wider than a barrel) never overlap
  words.forEach(([w, c], i) => {
    const x = 2.9 + i * 1.6;
    scene.add(barrel(x, 0, -2.6, false, 0.2 * (i - 1)));
    const tag = wallPic(barrelLabel(w, c), w.length * 4 + 3, 9, x, 0.42, -2.18);
    tag.userData.pid = 32 + i;
    scene.add(tag);
  });
  colliders.push({ x0: 2.45, z0: -3.05, x1: 6.55, z1: -2.15 });
  // and more lying on a rack along the right wall, just for the room
  for (const z of [-0.4, 0.5, 1.4]) scene.add(barrel(6.4, 0.06, z, true));
  scene.add(box([6.3, 0, -0.9], [7.7, 0.08, 1.9], woodDark));
  colliders.push({ x0: 6.3, z0: -0.9, x1: 7.7, z1: 1.9 });

  // ---- clue 3: chalk tallies scratched on the wall beside the door
  const tallies = wallPic(chalkTallies(), 48, 28, 2.6, 1.55, WALL_Z + 0.02);
  tallies.userData.noInfo = true;
  scene.add(tallies);
  const shelf = box([1.7, 1.05, WALL_Z], [3.5, 1.13, WALL_Z + 0.45], wood);
  add(shelf, 162);

  // ---- the three progress candles: on the crates, on the middle barrel, on the shelf under the tallies
  const candles = [
    new Candle(new THREE.Vector3(-3.45, 1.25, -1.6)),
    new Candle(new THREE.Vector3(4.5, 1.02, -2.6)),
    new Candle(new THREE.Vector3(2.6, 1.13, WALL_Z + 0.25)),
  ];
  for (const c of candles) scene.add(c.group);

  // ---- set dressing: a hanging chain, a puddle, cobwebs, and two jack-o'-lanterns
  const chain = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 4, 8), iron);
    link.position.set(-1.6, WALL_H + 0.6 - i * 0.16, 0.4);
    link.rotation.y = i % 2 ? Math.PI / 2 : 0;
    chain.add(link);
  }
  add(chain, 163);
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.8, 14), toon(X.moon, { transparent: true, opacity: 0.8 }));
  puddle.rotation.x = -Math.PI / 2;
  puddle.scale.set(1.3, 0.7, 1);
  puddle.position.set(1.6, 0.01, 1.6);
  puddle.userData.noInfo = true;
  scene.add(puddle);
  scene.add(cobweb(-7.4, WALL_H - 0.6, WALL_Z + 0.2, 1.2, 0), cobweb(7.4, WALL_H - 0.6, WALL_Z + 0.2, 1.2, Math.PI));
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
    return { id, at: new THREE.Vector3(at[0], 0, at[1]), radius: 1.45, candle, wisp: w, found: false };
  };
  const clues = [
    clue("crate", [-3.2, -0.6], [-3.6, 1.6, -1.1], 0),
    clue("barrels", [4.5, -1.6], [4.5, 1.5, -2.1], 1),
    clue("tallies", [2.6, WALL_Z + 1.5], [2.6, 3.4, WALL_Z + 0.3], 2),
  ];

  // ---- light: almost dark, the furnace, one cold beam from the grate, and a warm swell when freed
  // three.js divides light by pi and spotlights by distance squared, hence the large numbers
  scene.add(new THREE.AmbientLight("#5A4C8E", 2.7));
  const beam = new THREE.SpotLight("#9CC2F5", 140, 14, 0.34, 0.55, 1.4);
  beam.position.set(4.5, 4.2, WALL_Z - 0.2);
  beam.target.position.set(3.6, 0, -1.0);
  scene.add(beam, beam.target);
  const roomLight = new THREE.PointLight("#FFD47A", 0, 22, 0.8);
  roomLight.position.set(0, 3.4, -1.5);
  scene.add(roomLight);

  const dustCount = 40;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) dustPos.set([3.6 + (Math.random() - 0.5) * 1.6, Math.random() * 4, -3.5 + Math.random() * 3], i * 3);
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: P.B, size: 1, sizeAttenuation: false }));
  dust.userData.noInfo = true;
  scene.add(dust);

  const state = { doorOpen: false, roomGlow: 0, sealFade: 1 };
  const update = (dt: number, t: number, camera: THREE.Camera, reducedMotion: boolean) => {
    for (const c of candles) c.update(dt, t, camera, reducedMotion);
    for (const b of billboards) b.update(dt, camera, reducedMotion);
    clues.forEach((c, i) => { if (!c.found) c.wisp.lift = reducedMotion ? 0 : 0.12 * Math.sin(t * 2.2 + i * 2); });
    coals.intensity = reducedMotion ? 5 : 5 * (0.82 + 0.12 * Math.sin(t * 7) + 0.06 * Math.sin(t * 19));
    torch.intensity = reducedMotion ? 3.2 : 3.2 * (0.85 + 0.1 * Math.sin(t * 9 + 1) + 0.05 * Math.sin(t * 23));
    torchFlame.update(dt, camera, reducedMotion);
    pumpkins.forEach((pk, i) => {
      (pk.userData.light as THREE.PointLight).intensity = reducedMotion ? 1.6 : 1.6 * (0.85 + 0.1 * Math.sin(t * 11 + i * 2));
    });
    chain.rotation.z = reducedMotion ? 0 : 0.03 * Math.sin(t * 0.9);
    if (!reducedMotion) {
      const a = dustGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < dustCount; i++) {
        let y = a.getY(i) - dt * 0.05;
        if (y < 0) y = 4;
        a.setY(i, y);
      }
      a.needsUpdate = true;
    }
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
    bounds: { x0: -7.7, x1: 7.4, z0: WALL_Z + 0.35, z1: 4.6 },
    clues,
    candles,
    ghostHome: new THREE.Vector3(0, 0, WALL_Z + 1.2),
    door: { x0: -DOOR_W + 0.3, x1: DOOR_W - 0.3, z: WALL_Z, corridorZ: -8.0, exitZ: -7.6 },
    spawn: new THREE.Vector3(-5.6, 0, 0.9),
    view: { x0: -8.6, x1: 8.6, u0: -3.3, u1: 7.9 },
    state,
    update,
    celebrate,
  };
};
