import * as THREE from "three";
import story from "../../content/euphoria/if4-story.json";
import { clockmakerCalm } from "../art/clockmaker";
import { gamblerCalm } from "../art/gambler";
import { miserCalm } from "../art/miser";
import { doorSeal, wisp } from "../art/props";
import { HAUNTED_PIXEL_PALETTE as P } from "../lib/pixel/haunted-palette";
import type { PixelSprite } from "../lib/pixel/types";
import { Billboard } from "./billboard";
import { Candle } from "./candles";
import { box, COS_P, SCENE_EXTRAS as X, toon, toonMap, UNIT_PX, worldUV } from "./look";
import { roundOpening } from "./props-clock";
import { archInfill, archTrim, cobweb, facet, jackOLantern, lathe } from "./props3d";
import type { Clue, Rect, Room } from "./room";
import { barrelLabel } from "./textures-cellar";
import { figureCanvas, ghostCanvas, marble, shirt } from "./textures-gallery";
import { nightSky, rug, spriteTextures, wallpaper } from "./textures";

/**
 * Room 4, The Portrait Gallery, in 3D: checkered marble, a red carpet, velvet ropes, and a wall of
 * gilded portraits. On the left hang the ghosts already freed. On the right hang The Lender and The
 * Owner. A round window above the door drops one beam of moonlight down the carpet.
 * Same coordinates as the other rooms: back wall inner face at z = -6.25, open toward the camera.
 */

const WALL_Z = -6.25;
const WALL_H = 5;
const DOOR_W = 1.125;
const DOOR_TOP = 3.125;
const EYE = { y: 4.1, r: 0.55 };
const ROPE_Z = -4.55;

export const buildGallery = (): Room => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#06040A");
  const colliders: Rect[] = [];
  const billboards: Billboard[] = [];
  const add = (o: THREE.Object3D, pid: number) => {
    o.traverse((c) => (c.userData.pid = c.userData.pid ?? pid));
    scene.add(o);
    return o;
  };
  const floorMat = toonMap(marble());
  const wallMat = toonMap(wallpaper());
  const wood = toon(X.wood);
  const woodDark = toon(X.woodDark);
  const brass = toon(P.g);
  const gold = toon(P.G);
  const stone = toon(X.stoneDeep);
  const bone = toon(P.w);
  const actors = (story.art as unknown as { actors: Record<string, PixelSprite> }).actors;

  // ---- floor, side walls, and the back wall with the door and the round window above it
  add(box([-8, -0.25, WALL_Z], [8, 0, 5], floorMat, 40, 24), 10);
  add(box([-8.5, 0, WALL_Z - 0.5], [-8, WALL_H, 5], stone), 140);
  add(box([8, 0, WALL_Z - 0.5], [8.5, WALL_H, 5], stone), 140);
  const back = new THREE.Group();
  const wz: [number, number] = [WALL_Z - 0.5, WALL_Z];
  const piece = (x0: number, x1: number, y0: number, y1: number) => back.add(box([x0, y0, wz[0]], [x1, y1, wz[1]], wallMat, 32));
  const eye = roundOpening(0, EYE.y, EYE.r, wz[0], wz[1], wallMat);
  worldUV(eye.mesh.geometry, 32);
  back.add(eye.mesh);
  piece(-8, -DOOR_W, 0, WALL_H);
  piece(DOOR_W, 8, 0, WALL_H);
  piece(-DOOR_W, -eye.half, DOOR_TOP, WALL_H);
  piece(eye.half, DOOR_W, DOOR_TOP, WALL_H);
  piece(-eye.half, eye.half, DOOR_TOP, EYE.y - eye.half);
  piece(-eye.half, eye.half, EYE.y + eye.half, WALL_H);
  const doorArch = archInfill(0, DOOR_TOP - DOOR_W, DOOR_W, wz[0], wz[1], wallMat);
  worldUV(doorArch.geometry, 32);
  back.add(doorArch);
  add(back, 141);
  add(box([-8, WALL_H - 0.156, WALL_Z], [8, WALL_H, WALL_Z + 0.1875], woodDark), 144);
  for (const [x0, x1] of [[-8, -DOOR_W], [DOOR_W, 8]]) add(box([x0, 1.25, WALL_Z], [x1, 1.33, WALL_Z + 0.125], toon(X.woodLight)), 143);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: nightSky() }));
  sky.position.set(0, EYE.y, WALL_Z - 0.62);
  sky.userData.pid = 0;
  scene.add(sky);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(EYE.r, 0.06, 6, 20), brass);
  ring.position.set(0, EYE.y, WALL_Z + 0.04);
  add(ring, 165);

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

  // the red carpet
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 10), toonMap(rug()));
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.012, WALL_Z + 5);
  carpet.receiveShadow = true;
  add(carpet, 11);

  // ---- the wall of portraits. A picture is a canvas in a gilded frame, with a plaque under it.
  let pid = 30;
  const picture = (tex: THREE.Texture, wPx: number, hPx: number, cx: number, bottom: number, plaque?: [string, string]) => {
    const w = wPx / UNIT_PX, h = hPx / (UNIT_PX * COS_P);
    const canvas = new THREE.Mesh(new THREE.PlaneGeometry(w, h), toonMap(tex));
    canvas.position.set(cx, bottom + h / 2, WALL_Z + 0.07);
    add(canvas, pid++);
    const f = new THREE.Group();
    const t = 0.11;
    f.add(box([cx - w / 2 - t, bottom - t, WALL_Z], [cx + w / 2 + t, bottom, WALL_Z + 0.12], gold));
    f.add(box([cx - w / 2 - t, bottom + h, WALL_Z], [cx + w / 2 + t, bottom + h + t, WALL_Z + 0.12], gold));
    f.add(box([cx - w / 2 - t, bottom, WALL_Z], [cx - w / 2, bottom + h, WALL_Z + 0.12], brass));
    f.add(box([cx + w / 2, bottom, WALL_Z], [cx + w / 2 + t, bottom + h, WALL_Z + 0.12], brass));
    add(f, 170 + (pid % 8));
    if (plaque) {
      const pw = plaque[0].length * 4 + 3;
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(pw / UNIT_PX, 9 / (UNIT_PX * COS_P)), toonMap(barrelLabel(plaque[0], plaque[1])));
      tag.position.set(cx, bottom - t - 0.42, WALL_Z + 0.03);
      add(tag, pid++);
    }
  };
  // the ghosts already freed, on the left
  [miserCalm, gamblerCalm, clockmakerCalm].forEach((g, i) => picture(ghostCanvas(g), 32, 34, -6.55 + i * 2.05, 1.75));
  // The Lender and The Owner, on the right: Sriyan with his loan note, Sid with his piece
  picture(figureCanvas(actors.sriyan, actors.note ?? null, X.moon), 24, 28, 2.75, 1.95, ["LEND", P.t]);
  picture(figureCanvas(actors.sid, actors.piece ?? null, P.I), 24, 28, 4.85, 1.95, ["OWN", P.r]);
  // an empty frame at the end of the wall, waiting
  picture(barrelLabel("   ", P.K), 24, 28, 6.9, 1.95);

  // velvet ropes keep visitors back from the portraits
  const ropeMat = toon(P.r);
  const posts = [-7.5, -5.6, -3.7, -1.9, 1.9, 3.8, 5.7, 7.5];
  posts.forEach((x) => {
    const post = lathe([[0, 0], [0.14, 0], [0.12, 0.05], [0.035, 0.1], [0.035, 0.85], [0.07, 0.9], [0.05, 0.98], [0, 1.0]], brass, 8);
    post.position.set(x, 0, ROPE_Z);
    post.castShadow = true;
    add(post, 174);
  });
  for (const run of [posts.slice(0, 4), posts.slice(4)]) {
    for (let i = 0; i < run.length - 1; i++) {
      const [a, b] = [run[i], run[i + 1]];
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(a, 0.86, ROPE_Z), new THREE.Vector3((a + b) / 2, 0.62, ROPE_Z), new THREE.Vector3(b, 0.86, ROPE_Z)]);
      add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.035, 5), ropeMat), 175);
    }
    colliders.push({ x0: run[0] - 0.15, z0: ROPE_Z - 0.12, x1: run[run.length - 1] + 0.15, z1: ROPE_Z + 0.12 });
  }

  // ---- clue 1: a display case with the first Moon Tees shirt (left middle)
  const [cx, cz] = [-3.6, -1.0];
  const caseBase = box([cx - 0.6, 0, cz - 0.45], [cx + 0.6, 0.85, cz + 0.45], woodDark);
  add(caseBase, 150);
  add(box([cx - 0.64, 0.85, cz - 0.49], [cx + 0.64, 0.93, cz + 0.49], wood), 151);
  const tee = new THREE.Mesh(new THREE.PlaneGeometry(18 / UNIT_PX, 16 / UNIT_PX), new THREE.MeshBasicMaterial({ map: shirt(), alphaTest: 0.5, transparent: true }));
  tee.position.set(cx, 1.5, cz);
  tee.rotation.x = -Math.atan2(0.6, 0.8);
  tee.userData.noInfo = true;
  scene.add(tee);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.05, 0.8), toon(X.moonLight, { transparent: true, opacity: 0.22, depthWrite: false }));
  glass.position.set(cx, 1.46, cz);
  glass.userData.noInfo = true;
  scene.add(glass);
  for (const [ex, ez] of [[-0.55, -0.4], [0.55, -0.4], [-0.55, 0.4], [0.55, 0.4]]) add(box([cx + ex - 0.025, 0.93, cz + ez - 0.025], [cx + ex + 0.025, 1.98, cz + ez + 0.025], brass), 152);
  add(box([cx - 0.58, 1.98, cz - 0.43], [cx + 0.58, 2.03, cz + 0.43], brass), 152);
  colliders.push({ x0: cx - 0.65, z0: cz - 0.5, x1: cx + 0.65, z1: cz + 0.5 });

  // ---- clue 3: the auction lectern, its gavel and a SALE notice (right front)
  const [lx, lz] = [4.3, 0.9];
  const lectern = new THREE.Group();
  lectern.add(box([lx - 0.12, 0, lz - 0.12], [lx + 0.12, 1.0, lz + 0.12], woodDark));
  lectern.add(box([lx - 0.4, 0, lz - 0.3], [lx + 0.4, 0.08, lz + 0.3], woodDark));
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.6), wood);
  top.position.set(lx, 1.08, lz);
  top.rotation.x = 0.3;
  top.castShadow = true;
  lectern.add(top);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.26, 8), wood);
  head.rotation.z = Math.PI / 2;
  head.position.set(lx + 0.12, 1.2, lz + 0.02);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 6), woodDark);
  handle.rotation.x = Math.PI / 2 - 0.3;
  handle.position.set(lx + 0.12, 1.16, lz + 0.2);
  lectern.add(head, handle);
  add(lectern, 153);
  const notice = new THREE.Mesh(new THREE.PlaneGeometry(19 / UNIT_PX, 9 / UNIT_PX), toonMap(barrelLabel("SALE", P.r)));
  notice.position.set(lx, 0.55, lz + 0.14);
  add(notice, 38);
  colliders.push({ x0: lx - 0.45, z0: lz - 0.35, x1: lx + 0.45, z1: lz + 0.35 });

  // a bench to sit and look, two marble busts, cobwebs and jack-o'-lanterns
  const bench = new THREE.Group();
  bench.add(box([-6.6, 0.42, 1.9], [-4.8, 0.52, 2.6], toon(P.p)));
  for (const bx of [-6.5, -4.98]) bench.add(box([bx, 0, 1.95], [bx + 0.08, 0.42, 2.55], woodDark));
  add(bench, 154);
  colliders.push({ x0: -6.6, z0: 1.9, x1: -4.8, z1: 2.6 });
  for (const [bx, bz] of [[-7.2, -0.6], [7.2, -1.8]]) {
    const bust = new THREE.Group();
    bust.add(lathe([[0, 0], [0.3, 0], [0.26, 0.08], [0.2, 0.14], [0.2, 0.95], [0.28, 1.02], [0.28, 1.1], [0, 1.1]], toon(X.stoneLight), 10));
    const shoulders = new THREE.Mesh(facet(new THREE.SphereGeometry(0.26, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2)), bone);
    shoulders.position.y = 1.1;
    shoulders.scale.set(1, 0.7, 0.7);
    const skull = new THREE.Mesh(facet(new THREE.SphereGeometry(0.17, 8, 6)), bone);
    skull.position.y = 1.47;
    bust.add(shoulders, skull);
    bust.position.set(bx, 0, bz);
    bust.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true; });
    add(bust, 155);
    colliders.push({ x0: bx - 0.32, z0: bz - 0.32, x1: bx + 0.32, z1: bz + 0.32 });
  }
  scene.add(cobweb(-7.4, WALL_H - 0.75, WALL_Z + 0.25, 1.2, 0), cobweb(7.4, WALL_H - 0.75, WALL_Z + 0.25, 1.2, Math.PI));
  const pumpkins = [jackOLantern(-1.8, 0, WALL_Z + 0.75, 1, 0.3), jackOLantern(1.8, 0, WALL_Z + 0.75, 0.9, -0.3), jackOLantern(-5.7, 0.52, 2.25, 0.7, 0.4)];
  for (const pk of pumpkins) {
    pk.traverse((o) => { if ((o as THREE.Mesh).isMesh && o.userData.noInfo) (o as THREE.Mesh).castShadow = false; });
    scene.add(pk);
  }
  colliders.push({ x0: -2.1, z0: WALL_Z + 0.45, x1: -1.5, z1: WALL_Z + 1.05 }, { x0: 1.5, z0: WALL_Z + 0.45, x1: 2.1, z1: WALL_Z + 1.05 });

  // ---- the three progress candles: on the display case, on a stand before the twin portraits, by the lectern
  const stands: [number, number][] = [[3.8, -4.1], [5.2, 0.9]];
  for (const [sx, sz] of stands) {
    const st = new THREE.Group();
    st.add(box([sx - 0.22, 0, sz - 0.22], [sx + 0.22, 0.06, sz + 0.22], toon(P.K)));
    st.add(box([sx - 0.04, 0.06, sz - 0.04], [sx + 0.04, 1.3, sz + 0.04], toon(X.stoneLight)));
    add(st, 157);
    colliders.push({ x0: sx - 0.26, z0: sz - 0.26, x1: sx + 0.26, z1: sz + 0.26 });
  }
  const candles = [
    new Candle(new THREE.Vector3(cx + 0.35, 2.03, cz + 0.2), 3.2, 0.24),
    new Candle(new THREE.Vector3(stands[0][0], 1.3, stands[0][1])),
    new Candle(new THREE.Vector3(stands[1][0], 1.3, stands[1][1])),
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
    clue("case", [cx, cz + 1.3], [cx, 2.5, cz], 0),
    clue("portraits", [3.8, ROPE_Z + 1.0], [3.8, 4.5, WALL_Z + 0.3], 1),
    clue("lectern", [lx, lz + 1.2], [lx, 1.9, lz], 2),
  ];

  // ---- light: dim violet, and one cold beam down the carpet from the round window
  scene.add(new THREE.AmbientLight("#5A4C8E", 2.6));
  // kept gentle: at full strength the cold beam on the red carpet snapped to hot pink
  const beam = new THREE.SpotLight("#9CC2F5", 60, 16, 0.3, 0.6, 1.4);
  beam.position.set(0, EYE.y, WALL_Z - 0.2);
  beam.target.position.set(0, 0, -1.0);
  scene.add(beam, beam.target);
  const roomLight = new THREE.PointLight("#FFD47A", 0, 22, 0.8);
  roomLight.position.set(0, 3.4, -1.5);
  scene.add(roomLight);
  const dustCount = 40;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) dustPos.set([(Math.random() - 0.5) * 1.6, Math.random() * 4, -4.5 + Math.random() * 4.5], i * 3);
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: P.B, size: 1, sizeAttenuation: false }));
  dust.userData.noInfo = true;
  scene.add(dust);

  const state = { doorOpen: false, roomGlow: 0, sealFade: 1 };
  const update = (dt: number, t: number, camera: THREE.Camera, reducedMotion: boolean) => {
    for (const c of candles) c.update(dt, t, camera, reducedMotion);
    for (const b of billboards) b.update(dt, camera, reducedMotion);
    clues.forEach((c, i) => { if (!c.found) c.wisp.lift = reducedMotion ? 0 : 0.12 * Math.sin(t * 2.2 + i * 2); });
    pumpkins.forEach((pk, i) => {
      (pk.userData.light as THREE.PointLight).intensity = reducedMotion ? 1.6 : 1.6 * (0.85 + 0.1 * Math.sin(t * 11 + i * 2));
    });
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
