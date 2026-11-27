import * as THREE from "three";
import { doorSeal, smallFlame, wisp } from "../art/props";
import { HAUNTED_PIXEL_PALETTE as P } from "../lib/pixel/haunted-palette";
import { Billboard } from "./billboard";
import { Candle } from "./candles";
import { box, COS_P, SCENE_EXTRAS as X, toon, toonMap, UNIT_PX, worldUV } from "./look";
import { archInfill, archTrim, barrel, cobweb, crate, facet, jackOLantern, lathe } from "./props3d";
import type { Clue, Rect, Room } from "./room";
import { stoneBlocks } from "./textures-cellar";
import { quarryTiles, recipeBook, wallTiles } from "./textures-kitchen";
import { nightSky, spriteTextures } from "./textures";

/**
 * Room 5, The Kitchen, in 3D: quarry tiles, a brick hearth with a cauldron over the fire, copper pans, an
 * iron range under a shelf of ten jars, and a long table with one basket of eggs on it. The fire is the
 * warm light; a window by the door drops one cold beam of moonlight on the butcher's block.
 * Same coordinates as the other rooms: back wall inner face at z = -6.25, open toward the camera.
 */

const WALL_Z = -6.25;
const WALL_H = 5;
const DOOR_W = 1.125;
const DOOR_TOP = 3.125;
const JAR_COLOURS = [P.G, P.R, P.P, P.w, P["3"], P.t, P.s, P.y, P.q, P.T];

export const buildKitchen = (): Room => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#06040A");
  const colliders: Rect[] = [];
  const billboards: Billboard[] = [];
  const add = (o: THREE.Object3D, pid: number) => {
    o.traverse((c) => (c.userData.pid = c.userData.pid ?? pid));
    scene.add(o);
    return o;
  };
  const solid = (x0: number, z0: number, x1: number, z1: number) => colliders.push({ x0, z0, x1, z1 });
  const floorMat = toonMap(quarryTiles());
  const wallMat = toonMap(wallTiles());
  const brick = toonMap(stoneBlocks());
  const wood = toon(X.wood);
  const woodDark = toon(X.woodDark);
  const iron = toon(P.X);
  const ironDark = toon(P.k);
  const brass = toon(P.g);
  const copper = toon(P["3"]);
  const stone = toon(X.stoneDeep);
  const bone = toon(P.w);

  // ---- floor, side walls, and the back wall with the door
  add(box([-8, -0.25, WALL_Z], [8, 0, 5], floorMat, 40, 24), 10);
  add(box([-8.5, 0, WALL_Z - 0.5], [-8, WALL_H, 5], stone), 140);
  add(box([8, 0, WALL_Z - 0.5], [8.5, WALL_H, 5], stone), 140);
  const back = new THREE.Group();
  const wz: [number, number] = [WALL_Z - 0.5, WALL_Z];
  back.add(box([-8, 0, wz[0]], [-DOOR_W, WALL_H, wz[1]], wallMat, 32));
  back.add(box([DOOR_W, 0, wz[0]], [8, WALL_H, wz[1]], wallMat, 32));
  back.add(box([-DOOR_W, DOOR_TOP, wz[0]], [DOOR_W, WALL_H, wz[1]], wallMat, 32));
  const doorArch = archInfill(0, DOOR_TOP - DOOR_W, DOOR_W, wz[0], wz[1], wallMat);
  worldUV(doorArch.geometry, 32);
  back.add(doorArch);
  add(back, 141);
  add(box([-8, WALL_H - 0.156, WALL_Z], [8, WALL_H, WALL_Z + 0.1875], woodDark), 144);

  // the door, its brass frame and the ward
  const passage = new THREE.Group();
  const END = -8.25;
  passage.add(box([-DOOR_W, -0.25, END], [DOOR_W, 0, WALL_Z - 0.5], floorMat, 40, 24));
  passage.add(box([-DOOR_W - 0.5, 0, END], [-DOOR_W, DOOR_TOP, WALL_Z - 0.5], stone));
  passage.add(box([DOOR_W, 0, END], [DOOR_W + 0.5, DOOR_TOP, WALL_Z - 0.5], stone));
  passage.add(box([-DOOR_W - 0.5, DOOR_TOP, END], [DOOR_W + 0.5, DOOR_TOP + 0.08, WALL_Z - 0.5], stone));
  passage.add(box([-DOOR_W, 0, END - 0.4], [DOOR_W, DOOR_TOP, END], stone));
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

  // ---- the hearth (back left): brick piers, a dark firebox, logs, flames and a cauldron on a chain
  const hearth = new THREE.Group();
  hearth.add(box([-7.4, 0, WALL_Z], [-6.8, 2.0, WALL_Z + 0.8], brick, 32));
  hearth.add(box([-4.2, 0, WALL_Z], [-3.6, 2.0, WALL_Z + 0.8], brick, 32));
  hearth.add(box([-7.4, 2.0, WALL_Z], [-3.6, WALL_H, WALL_Z + 0.8], brick, 32));
  add(hearth, 160);
  add(box([-7.55, 1.98, WALL_Z], [-3.45, 2.12, WALL_Z + 0.95], woodDark), 161);
  // the firebox glows from within, so the opening reads from across the room
  const firebox = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.0), new THREE.MeshBasicMaterial({ color: P["1"] }));
  firebox.position.set(-5.5, 1.0, WALL_Z + 0.1);
  firebox.userData.pid = 162;
  scene.add(firebox);
  add(box([-7.5, 0, WALL_Z], [-3.5, 0.06, WALL_Z + 1.3], toon(X.stone)), 163);
  const logs = new THREE.Group();
  for (const [lx, lz, turn] of [[-5.5, 0.5, 0.2], [-5.5, 0.72, -0.25]]) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.3, 6), woodDark);
    log.rotation.set(0, turn, Math.PI / 2);
    log.position.set(lx, 0.15, WALL_Z + lz);
    logs.add(log);
  }
  add(logs, 164);
  const embers = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.14), new THREE.MeshBasicMaterial({ color: P["3"] }));
  embers.position.set(-5.5, 0.2, WALL_Z + 0.84);
  embers.userData.noInfo = true;
  scene.add(embers);
  for (const [fx, fy] of [[-6.0, 0.24], [-5.65, 0.36], [-5.3, 0.3], [-4.98, 0.24]]) {
    const flame = new Billboard(smallFlame, { noInfo: true });
    flame.position.set(fx, fy, WALL_Z + 0.6);
    scene.add(flame.group);
    billboards.push(flame);
  }
  const cauldron = new THREE.Group();
  cauldron.add(lathe([[0, 0], [0.2, 0.02], [0.36, 0.16], [0.4, 0.34], [0.34, 0.48], [0.38, 0.52], [0, 0.52]], ironDark, 10));
  cauldron.add(box([-0.015, 0.52, -0.015], [0.015, 1.1, 0.015], iron));
  cauldron.position.set(-5.5, 0.88, WALL_Z + 0.62);
  add(cauldron, 165);
  const brew = new THREE.Mesh(new THREE.CircleGeometry(0.3, 10), new THREE.MeshBasicMaterial({ color: P.P }));
  brew.rotation.x = -Math.PI / 2;
  brew.position.set(-5.5, 1.41, WALL_Z + 0.62);
  brew.userData.noInfo = true;
  scene.add(brew);
  solid(-7.5, WALL_Z, -3.5, WALL_Z + 1.3);
  const fire = new THREE.PointLight("#FF9A3C", 11, 11, 1.1);
  fire.position.set(-5.5, 1.0, WALL_Z + 1.7);
  scene.add(fire);

  // ---- copper pans on a rail, over a low cupboard (left of the door)
  const pans = new THREE.Group();
  pans.add(box([-3.2, 3.02, WALL_Z], [-1.45, 3.08, WALL_Z + 0.1], iron));
  [0.27, 0.22, 0.18].forEach((r, i) => {
    const cx = -2.85 + i * 0.6;
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.06, 12), copper);
    pan.rotation.x = Math.PI / 2;
    pan.position.set(cx, 2.35 - r * 0.2, WALL_Z + 0.1);
    pans.add(pan, box([cx - 0.03, 2.35 + r * 0.7, WALL_Z + 0.04], [cx + 0.03, 3.02, WALL_Z + 0.1], iron));
  });
  add(pans, 166);
  add(box([-3.2, 0, WALL_Z], [-1.5, 0.92, WALL_Z + 0.7], woodDark), 150);
  add(box([-3.25, 0.92, WALL_Z], [-1.45, 1.0, WALL_Z + 0.75], wood), 151);
  solid(-3.25, WALL_Z, -1.45, WALL_Z + 0.75);

  // ---- a window over a stone sink (right of the door)
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: nightSky() }));
  sky.position.set(2.45, 3.3, WALL_Z + 0.02);
  sky.userData.pid = 0;
  scene.add(sky);
  const casement = new THREE.Group();
  for (const [x0, y0, x1, y1] of [[1.65, 2.5, 3.25, 2.6], [1.65, 4.0, 3.25, 4.1], [1.65, 2.6, 1.75, 4.0], [3.15, 2.6, 3.25, 4.0], [2.42, 2.6, 2.48, 4.0], [1.75, 3.27, 3.15, 3.33]])
    casement.add(box([x0, y0, WALL_Z], [x1, y1, WALL_Z + 0.1], woodDark));
  add(casement, 167);
  add(box([1.7, 0, WALL_Z], [3.2, 0.9, WALL_Z + 0.7], toon(X.stone)), 152);
  add(box([1.65, 0.9, WALL_Z], [3.25, 1.0, WALL_Z + 0.75], toon(X.stone)), 153);
  add(box([1.85, 0.96, WALL_Z + 0.12], [3.05, 1.01, WALL_Z + 0.6], toon(P.k)), 154);
  solid(1.65, WALL_Z, 3.25, WALL_Z + 0.75);

  // ---- clue 2: the iron range, and above it one shelf of ten jars
  const range = new THREE.Group();
  range.add(box([3.6, 0, WALL_Z + 0.05], [7.5, 1.05, WALL_Z + 1.15], ironDark));
  range.add(box([3.55, 1.05, WALL_Z], [7.55, 1.13, WALL_Z + 1.2], iron));
  for (const ox of [4.0, 5.85]) {
    range.add(box([ox, 0.22, WALL_Z + 1.15], [ox + 1.25, 0.86, WALL_Z + 1.19], iron));
    range.add(box([ox + 0.3, 0.7, WALL_Z + 1.19], [ox + 0.95, 0.75, WALL_Z + 1.23], brass));
  }
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, WALL_H - 1.13, 8), iron);
  pipe.position.set(7.3, (WALL_H + 1.13) / 2, WALL_Z + 0.3);
  range.add(pipe);
  const pot = lathe([[0, 0], [0.26, 0], [0.28, 0.3], [0.3, 0.32], [0, 0.32]], copper, 10);
  pot.position.set(6.4, 1.13, WALL_Z + 0.65);
  range.add(pot);
  add(range, 155);
  // one oven door stands ajar: its coals light the range and the shelf of jars above it
  const coals = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.1), new THREE.MeshBasicMaterial({ color: P["4"] }));
  coals.position.set(4.625, 0.17, WALL_Z + 1.2);
  coals.userData.noInfo = true;
  scene.add(coals);
  const oven = new THREE.PointLight("#FF9A3C", 5, 7, 1.1);
  oven.position.set(5.4, 1.9, WALL_Z + 1.9);
  scene.add(oven);
  solid(3.55, WALL_Z, 7.55, WALL_Z + 1.25);
  add(box([3.5, 2.35, WALL_Z], [7.1, 2.43, WALL_Z + 0.45], wood), 156);
  for (const bx of [3.6, 5.3, 6.95]) add(box([bx, 2.05, WALL_Z], [bx + 0.06, 2.35, WALL_Z + 0.3], woodDark), 157);
  JAR_COLOURS.forEach((colour, i) => {
    const jar = new THREE.Group();
    jar.add(lathe([[0, 0], [0.12, 0], [0.13, 0.04], [0.13, 0.26], [0.09, 0.31], [0, 0.31]], toon(colour), 8));
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 8), woodDark);
    lid.position.y = 0.34;
    jar.add(lid);
    jar.position.set(3.78 + i * 0.35, 2.43, WALL_Z + 0.24);
    add(jar, 60 + i);
  });

  // ---- clue 1: the long table, and on it the one basket with every egg in it
  const [tx, tz] = [-3.6, -1.1];
  const table = new THREE.Group();
  table.add(box([tx - 1.3, 0.82, tz - 0.6], [tx + 1.3, 0.94, tz + 0.6], wood));
  for (const [ex, ez] of [[-1.2, -0.5], [1.1, -0.5], [-1.2, 0.4], [1.1, 0.4]]) table.add(box([tx + ex, 0, tz + ez], [tx + ex + 0.1, 0.82, tz + ez + 0.1], woodDark));
  table.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true; });
  add(table, 158);
  const basket = new THREE.Group();
  basket.add(lathe([[0, 0], [0.24, 0], [0.34, 0.22], [0.36, 0.28], [0, 0.28]], toon(X.woodLight), 10));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.03, 4, 10, Math.PI), toon(X.wood));
  handle.position.y = 0.28;
  basket.add(handle);
  for (const [ex, ey, ez] of [[-0.14, 0.33, 0.06], [0.08, 0.34, 0.1], [0.0, 0.36, -0.08], [0.18, 0.32, -0.04], [-0.06, 0.42, 0.02]]) {
    const egg = new THREE.Mesh(facet(new THREE.SphereGeometry(0.085, 6, 5)), new THREE.MeshBasicMaterial({ color: P.w }));
    egg.position.set(ex, ey, ez);
    egg.scale.y = 1.25;
    basket.add(egg);
  }
  basket.position.set(tx - 0.2, 0.94, tz);
  add(basket, 159);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6), bone);
  pin.rotation.set(0, 0.5, Math.PI / 2);
  pin.position.set(tx + 0.75, 1.0, tz + 0.25);
  add(pin, 168);
  solid(tx - 1.35, tz - 0.65, tx + 1.35, tz + 0.65);

  // ---- clue 3: the Cook's recipe book on its stand (right front)
  const [lx, lz] = [3.9, 1.0];
  const stand = new THREE.Group();
  stand.add(box([lx - 0.1, 0, lz - 0.1], [lx + 0.1, 1.0, lz + 0.1], woodDark));
  stand.add(box([lx - 0.4, 0, lz - 0.3], [lx + 0.4, 0.08, lz + 0.3], woodDark));
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.66), wood);
  top.position.set(lx, 1.08, lz);
  top.rotation.x = 0.3;
  top.castShadow = true;
  stand.add(top);
  add(stand, 169);
  const book = new THREE.Mesh(new THREE.PlaneGeometry(14 / UNIT_PX, 10 / UNIT_PX), new THREE.MeshBasicMaterial({ map: recipeBook() }));
  book.position.set(lx, 1.36, lz + 0.05);
  book.rotation.x = -Math.atan2(0.6, 0.8);
  book.userData.noInfo = true;
  scene.add(book);
  solid(lx - 0.5, lz - 0.35, lx + 0.5, lz + 0.35);

  // ---- the butcher's block in the moonbeam, sacks, a barrel, a crate of pumpkins, cobwebs
  const block = new THREE.Group();
  block.add(box([1.9, 0, -2.5], [2.8, 0.78, -1.8], wood), box([1.86, 0.78, -2.54], [2.84, 0.88, -1.76], toon(X.woodLight)));
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.03), toon(P.x));
  blade.position.set(2.3, 1.0, -2.15);
  blade.rotation.z = 0.25;
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.05), woodDark);
  grip.position.set(2.58, 1.17, -2.15);
  grip.rotation.z = 0.25;
  block.add(blade, grip);
  block.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true; });
  add(block, 170);
  solid(1.86, -2.54, 2.84, -1.76);
  for (const [sx, sz, s] of [[-6.2, 2.9, 1], [-5.5, 3.3, 0.8]]) {
    const sack = lathe([[0, 0], [0.34, 0.02], [0.4, 0.3], [0.3, 0.62], [0.12, 0.7], [0.16, 0.8], [0, 0.8]], toon(P.x), 8);
    sack.position.set(sx, 0, sz);
    sack.scale.setScalar(s);
    sack.castShadow = true;
    add(sack, 171);
    solid(sx - 0.36 * s, sz - 0.36 * s, sx + 0.36 * s, sz + 0.36 * s);
  }
  scene.add(barrel(-7.1, 0, 2.4), crate(6.7, 0, 2.5));
  solid(-7.5, 2.0, -6.7, 2.8);
  solid(6.2, 2.1, 7.2, 2.9);
  scene.add(cobweb(-7.4, WALL_H - 0.75, WALL_Z + 0.95, 1.2, 0), cobweb(7.4, WALL_H - 0.75, WALL_Z + 0.25, 1.2, Math.PI));
  const pumpkins = [jackOLantern(-2.0, 1.0, WALL_Z + 0.4, 0.8, 0.2), jackOLantern(2.1, 1.0, WALL_Z + 0.4, 0.7, -0.2), jackOLantern(6.7, 0.7, 2.5, 0.75, -0.4)];
  for (const pk of pumpkins) {
    pk.traverse((o) => { if ((o as THREE.Mesh).isMesh && o.userData.noInfo) (o as THREE.Mesh).castShadow = false; });
    scene.add(pk);
  }

  // ---- the three progress candles: on the table, on the range, and on a stand by the recipe book
  const [sx, sz] = [5.0, 1.0];
  const candleStand = new THREE.Group();
  candleStand.add(box([sx - 0.22, 0, sz - 0.22], [sx + 0.22, 0.06, sz + 0.22], toon(P.K)));
  candleStand.add(box([sx - 0.04, 0.06, sz - 0.04], [sx + 0.04, 1.3, sz + 0.04], toon(X.stoneLight)));
  add(candleStand, 172);
  solid(sx - 0.26, sz - 0.26, sx + 0.26, sz + 0.26);
  const candles = [
    new Candle(new THREE.Vector3(tx + 0.95, 0.94, tz - 0.25)),
    new Candle(new THREE.Vector3(4.0, 1.13, WALL_Z + 0.85)),
    new Candle(new THREE.Vector3(sx, 1.3, sz)),
  ];
  for (const c of candles) scene.add(c.group);

  // ---- clues
  const clue = (id: string, at: [number, number], wispAt: [number, number, number], candle: number): Clue => {
    const w = new Billboard(wisp, { noInfo: true });
    w.position.set(...wispAt);
    scene.add(w.group);
    billboards.push(w);
    return { id, at: new THREE.Vector3(at[0], 0, at[1]), radius: 1.5, candle, wisp: w, found: false };
  };
  const clues = [
    clue("basket", [tx, tz + 1.4], [tx - 0.2, 2.0, tz], 0),
    clue("jars", [5.3, WALL_Z + 2.3], [5.3, 3.3, WALL_Z + 0.3], 1),
    clue("recipe", [lx, lz + 1.2], [lx, 2.0, lz], 2),
  ];

  // ---- light: dim violet, the fire, and one cold beam from the window onto the butcher's block
  scene.add(new THREE.AmbientLight("#5A4C8E", 2.6));
  // kept gentle: at full strength the beam bleached the butcher's block
  const beam = new THREE.SpotLight("#9CC2F5", 48, 14, 0.3, 0.6, 1.4);
  beam.position.set(2.45, 3.4, WALL_Z + 0.1);
  beam.target.position.set(2.35, 0, -2.1);
  scene.add(beam, beam.target);
  const roomLight = new THREE.PointLight("#FFD47A", 0, 22, 0.8);
  roomLight.position.set(0, 3.4, -1.5);
  scene.add(roomLight);
  const dustCount = 36;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) dustPos.set([2.4 + (Math.random() - 0.5) * 1.4, Math.random() * 3.4, -5.4 + Math.random() * 3.6], i * 3);
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: P.B, size: 1, sizeAttenuation: false }));
  dust.userData.noInfo = true;
  scene.add(dust);

  const state = { doorOpen: false, roomGlow: 0, sealFade: 1 };
  const update = (dt: number, t: number, camera: THREE.Camera, reducedMotion: boolean) => {
    for (const c of candles) c.update(dt, t, camera, reducedMotion);
    for (const b of billboards) b.update(dt, camera, reducedMotion);
    clues.forEach((c, i) => { if (!c.found) c.wisp.lift = reducedMotion ? 0 : 0.12 * Math.sin(t * 2.2 + i * 2); });
    fire.intensity = reducedMotion ? 11 : 11 * (0.84 + 0.11 * Math.sin(t * 8) + 0.05 * Math.sin(t * 21));
    oven.intensity = reducedMotion ? 5 : 5 * (0.88 + 0.08 * Math.sin(t * 6 + 2) + 0.04 * Math.sin(t * 17));
    pumpkins.forEach((pk, i) => {
      (pk.userData.light as THREE.PointLight).intensity = reducedMotion ? 1.6 : 1.6 * (0.85 + 0.1 * Math.sin(t * 11 + i * 2));
    });
    if (!reducedMotion) {
      const a = dustGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < dustCount; i++) {
        let y = a.getY(i) - dt * 0.05;
        if (y < 0) y = 3.4;
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
