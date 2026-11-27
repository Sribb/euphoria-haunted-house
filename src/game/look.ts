import * as THREE from "three";
import { HAUNTED_CANVAS, HAUNTED_PIXEL_PALETTE, HAUNTED_SURFACE } from "../lib/pixel/haunted-palette";
import { PLAYER_COLORS } from "../art/player";
import { toonRamp } from "./pipeline";

/** Low-res pixels per world unit, measured across the screen. */
export const UNIT_PX = 16;

/**
 * Camera pitch of about 36.9 degrees, chosen as a 3-4-5 triangle so both factors are exact. Seen at this
 * angle, one unit of floor depth covers UNIT_PX * SIN_P pixels and one unit of wall height covers
 * UNIT_PX * COS_P pixels. worldUV scales textures by the same factors, so every texel lands on one pixel.
 */
export const SIN_P = 0.6;
export const COS_P = 0.8;

/** Extra darks for the 3D rooms: wood, stone and moonlight steps the sprite palette does not need. */
export const SCENE_EXTRAS = {
  woodDeep: "#1C1210",
  woodDark: "#2E1D16",
  wood: "#4A2E1E",
  woodLight: "#6B4228",
  stoneDeep: "#1A1428",
  stone: "#2C2140",
  stoneLight: "#3E3058",
  moonDeep: "#141B33",
  moon: "#1D2A4F",
  moonLight: "#3A5590",
};

/**
 * Every colour the composite may output. Everything on screen snaps to one of these. The ectoplasm greens
 * are left out: nothing in the 3D rooms is green, and brightly lit gold snapped to mint green otherwise.
 */
const NOT_IN_3D = new Set(["n", "N", "m"]);
export const SCENE_PALETTE: string[] = [
  HAUNTED_CANVAS,
  HAUNTED_SURFACE,
  ...new Set([
    ...Object.entries(HAUNTED_PIXEL_PALETTE).filter(([k]) => !NOT_IN_3D.has(k)).map(([, v]) => v),
    ...Object.values(SCENE_EXTRAS),
    ...Object.values(PLAYER_COLORS),
  ]),
];

/** A toon-shaded material in one flat colour. */
export const toon = (color: string, extra: THREE.MeshToonMaterialParameters = {}) =>
  new THREE.MeshToonMaterial({ color, gradientMap: toonRamp, ...extra });

/** A toon material with a pixel texture. */
export const toonMap = (map: THREE.Texture, extra: THREE.MeshToonMaterialParameters = {}) =>
  new THREE.MeshToonMaterial({ map, gradientMap: toonRamp, ...extra });

/** Point filtering and no mipmaps, so a texel always lands on whole pixels. */
export const crisp = (t: THREE.Texture, repeat = false) => {
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.NoColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
};

/** Draws into a canvas of w x h pixels and returns it as a crisp texture. */
export const canvasTexture = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = true) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  draw(g);
  return crisp(new THREE.CanvasTexture(c), repeat);
};

/**
 * Replaces a geometry's UVs with world-space planar UVs, picked per face from its normal, measured in
 * texture tiles of `tilePx` pixels. Texels then match screen pixels on every floor, wall and tabletop,
 * whatever the box's size. Call after the geometry is translated into place.
 */
export const worldUV = (geo: THREE.BufferGeometry, tilePx: number) => {
  const pos = geo.getAttribute("position");
  const nrm = geo.getAttribute("normal");
  const uv = new Float32Array(pos.count * 2);
  const across = UNIT_PX / tilePx;
  const deep = (UNIT_PX * SIN_P) / tilePx;
  const tall = (UNIT_PX * COS_P) / tilePx;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const nx = Math.abs(nrm.getX(i)), ny = Math.abs(nrm.getY(i)), nz = Math.abs(nrm.getZ(i));
    let u = x * across, v = y * tall;
    if (nx >= ny && nx >= nz) { u = z * deep; v = y * tall; }
    else if (ny >= nx && ny >= nz) { u = x * across; v = -z * deep; }
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
};

/** A box placed by its min and max corners, with world UVs when it has a texture. */
export const box = (
  min: [number, number, number],
  max: [number, number, number],
  material: THREE.Material,
  tilePx = 0,
) => {
  const size = max.map((v, i) => v - min[i]) as [number, number, number];
  const geo = new THREE.BoxGeometry(...size);
  geo.translate((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
  if (tilePx) worldUV(geo, tilePx);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

/** Seeded random numbers, so procedural art is the same on every load. */
export const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
