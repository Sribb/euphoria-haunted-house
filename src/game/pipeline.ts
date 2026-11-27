// The 3D pixel-art renderer. Adapted from Tiny Why's pixel3d pipeline (Sriyan's video project,
// studio/src/pixel3d/pipeline.ts, November 2026), which credits three.js RenderPixelatedPass (MIT) and the
// Project Shadowglass write-ups. See "Reused" in the README.
//
// Changes for the game: orthographic only (the splatting code for moving perspective cameras is gone), the
// render size follows the window, full-screen effects for the encounter (flash, exposure, vignette), and the
// outline fix: three.js forces the info pass alpha to 1 for opaque materials, so every object read as id 255
// and outlines between two objects never drew. The info shader now writes the id after that line too.
//
// Per frame:
//   1. beauty: the scene at the low-res grid with toon materials (color + depth);
//   2. info: every mesh again with an info material (view normal + object id, honoring alpha cutouts);
//   3. composite: dark silhouettes where the object id changes, light creases on hard objects, contact
//      shading, a snap to the scene palette in OKLab, then fog by depth after the snap.
import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";

THREE.ColorManagement.enabled = false;

/** Object ids: 0 = background, 1-127 = soft objects (no creases), 128-255 = hard, man-made objects. */
export const HARD = 128;

export type Look = {
  palette: string[];
  /** Colour grade before the palette snap: lift shadows toward a tint, then multiply. */
  lift?: [number, number, number];
  gain?: [number, number, number];
  /** Silhouette pixels facing the moon get a bright rim instead of the dark outline. */
  rimLight?: number;
  fog?: { color: string; start: number; density: number };
  edgeDark?: number;
  edgeLight?: number;
  ao?: number;
};

/** Four-step toon ramp: dark, dark, mid, light. */
export const toonRamp = (() => {
  const t = new THREE.DataTexture(new Uint8Array([115, 115, 115, 255, 115, 115, 115, 255, 180, 180, 180, 255, 255, 255, 255, 255]), 4, 1);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

type Shaded = THREE.Material & { map?: THREE.Texture | null; alphaTest: number };

const infoMaterial = (src: Shaded, id: number) => {
  const m = new THREE.MeshNormalMaterial({ side: src.side });
  const map = src.map ?? null;
  const cut = map ? Math.max(src.alphaTest, 0.01) : 0;
  // Animated sprites swap their texture every frame, so drawInfo refreshes this before each render.
  const uMap = { value: map };
  m.userData.uMap = uMap;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.infoId = { value: id / 255 };
    sh.uniforms.infoMap = uMap;
    sh.uniforms.infoCut = { value: cut };
    sh.vertexShader = "varying vec2 vInfoUv;\n" + sh.vertexShader.replace("#include <uv_vertex>", "#include <uv_vertex>\n\tvInfoUv = uv;");
    sh.fragmentShader =
      "uniform float infoId;\nuniform sampler2D infoMap;\nuniform float infoCut;\nvarying vec2 vInfoUv;\n" +
      sh.fragmentShader
        .replace(
          "gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );",
          "if (infoCut > 0.0 && texture2D(infoMap, vInfoUv).a < infoCut) discard;\n\tgl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, infoId );",
        )
        // THE FIX: three.js sets alpha to 1 for opaque materials right after, which erased the id.
        .replace("gl_FragColor.a = 1.0;", "gl_FragColor.a = infoId;");
  };
  m.customProgramCacheKey = () => (cut > 0 ? "pixel-info-cut" : "pixel-info");
  return m;
};

/** Give every mesh under `root` the object id `id`. One id per object means no outlines inside it. */
export const tagId = (root: THREE.Object3D, id: number) => root.traverse((o) => (o.userData.pid = id));

const COMPOSITE = (n: number) => `
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform sampler2D tInfo;
uniform vec2 texel;
uniform vec3 palette[${n}];
uniform vec3 fogColor;
uniform float fogStart;
uniform float fogDensity;
uniform float near;
uniform float far;
uniform float edgeDark;
uniform float edgeLight;
uniform float aoStrength;
uniform float exposure;
uniform vec3 flashColor;
uniform float flash;
uniform float vignette;
uniform vec3 lift;
uniform vec3 gain;
uniform vec2 rimDir;
uniform float rimLight;
varying vec2 vUv;

vec3 toLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 oklab(vec3 c) {
  c = toLinear(c);
  vec3 lms = vec3(0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b,
    0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b,
    0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b);
  lms = pow(max(lms, vec3(0.0)), vec3(1.0 / 3.0));
  return vec3(0.2104542553 * lms.x + 0.7936177850 * lms.y - 0.0040720468 * lms.z,
    1.9779984951 * lms.x - 2.4285922050 * lms.y + 0.4505937099 * lms.z,
    0.0259040371 * lms.x + 0.7827717662 * lms.y - 0.8086757660 * lms.z);
}
float idAt(vec2 uv) { return floor(texture2D(tInfo, uv).a * 255.0 + 0.5); }
float linD(float d) { return near + d * (far - near); }
vec3 nAt(vec2 uv) { return texture2D(tInfo, uv).rgb * 2.0 - 1.0; }

void main() {
  vec3 c = texture2D(tColor, vUv).rgb;
  float idC = idAt(vUv);
  float dC = texture2D(tDepth, vUv).r;
  vec3 nC = nAt(vUv);
  float sil = 0.0;
  float crease = 0.0;
  if (idC > 0.5) {
    vec2 offs[4];
    offs[0] = vec2(texel.x, 0.0); offs[1] = vec2(-texel.x, 0.0); offs[2] = vec2(0.0, texel.y); offs[3] = vec2(0.0, -texel.y);
    for (int i = 0; i < 4; i++) {
      vec2 uv = vUv + offs[i];
      float idN = idAt(uv);
      float dN = texture2D(tDepth, uv).r;
      if (idN != idC && dC < dN - 0.0004) sil = 1.0;
      if (idN == idC && idC >= ${HARD}.0 && dot(nC, nAt(uv)) < 0.6 && dN >= dC - 0.0001) crease = 1.0;
    }
  }
  float ao = 0.0;
  if (idC > 0.5 && aoStrength > 0.0) {
    float lC = linD(dC);
    for (int i = 0; i < 12; i++) {
      float a = float(i) * 2.39996;
      float r = 2.0 + float(i / 4) * 2.5;
      vec2 uv = vUv + vec2(cos(a), sin(a)) * r * texel;
      float dz = lC - linD(texture2D(tDepth, uv).r);
      if (dz > 0.03 && dz < 0.9) ao += 1.0;
    }
    ao = smoothstep(2.0, 9.0, ao);
  }
  // rim light: a silhouette pixel whose surface turns toward the moon catches a bright edge
  float rim = 0.0;
  if (sil > 0.5 && length(nC.xy) > 0.25 && dot(normalize(nC.xy), rimDir) > 0.45) rim = 1.0;
  c *= exposure;
  c = lift + c * gain * (1.0 - lift);
  c *= 1.0 - aoStrength * ao;
  c *= mix(1.0, rim > 0.5 ? rimLight : edgeDark, sil) * mix(1.0, edgeLight, crease * (1.0 - sil));
  vec2 v = vUv - 0.5;
  c *= 1.0 - vignette * smoothstep(0.25, 0.75, length(v * vec2(1.0, 1.25)));
  c = mix(c, flashColor, flash);
  vec3 lab = oklab(clamp(c, 0.0, 1.0));
  vec3 best = palette[0];
  float bd = 1e9;
  for (int i = 0; i < ${n}; i++) {
    vec3 d = oklab(palette[i]) - lab;
    float e = dot(d, d);
    if (e < bd) { bd = e; best = palette[i]; }
  }
  if (idC > 0.5 && fogDensity > 0.0) {
    float f = 1.0 - exp(-fogDensity * max(0.0, linD(dC) - fogStart));
    best = mix(best, fogColor, clamp(f, 0.0, 1.0));
  }
  gl_FragColor = vec4(best, 1.0);
}`;

export type Effects = { exposure: number; flash: number; flashColor: THREE.Color; vignette: number };

export type Pipeline = {
  renderer: THREE.WebGLRenderer;
  camera: THREE.OrthographicCamera;
  /** Low-res pixels per world unit. */
  unitPx: number;
  effects: Effects;
  /** Set the low-res grid size (the visible frame plus a 1 pixel pad on each side). */
  resize: (w: number, h: number) => void;
  render: (scene: THREE.Scene) => void;
};

export const createPipeline = (canvas: HTMLCanvasElement, unitPx: number, look: Look): Pipeline => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 60);
  const target = (depth: boolean) => {
    const rt = new THREE.WebGLRenderTarget(2, 2, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.UnsignedByteType });
    if (depth) rt.depthTexture = new THREE.DepthTexture(2, 2);
    return rt;
  };
  const beauty = target(true);
  const info = target(false);
  const pal = look.palette.map((c) => new THREE.Color(c));
  const effects: Effects = { exposure: 1, flash: 0, flashColor: new THREE.Color("#FFFBEF"), vignette: 0.35 };
  const material = new THREE.ShaderMaterial({
    uniforms: {
      tColor: { value: beauty.texture },
      tDepth: { value: beauty.depthTexture },
      tInfo: { value: info.texture },
      texel: { value: new THREE.Vector2(0.5, 0.5) },
      palette: { value: pal.map((c) => new THREE.Vector3(c.r, c.g, c.b)) },
      fogColor: { value: new THREE.Color(look.fog?.color ?? "#000000") },
      fogStart: { value: look.fog?.start ?? 0 },
      fogDensity: { value: look.fog?.density ?? 0 },
      near: { value: camera.near },
      far: { value: camera.far },
      edgeDark: { value: look.edgeDark ?? 0.55 },
      edgeLight: { value: look.edgeLight ?? 1.3 },
      aoStrength: { value: look.ao ?? 0.3 },
      exposure: { value: 1 },
      flashColor: { value: effects.flashColor },
      flash: { value: 0 },
      vignette: { value: effects.vignette },
      lift: { value: new THREE.Vector3(...(look.lift ?? [0, 0, 0])) },
      gain: { value: new THREE.Vector3(...(look.gain ?? [1, 1, 1])) },
      rimDir: { value: new THREE.Vector2(0, 1) },
      rimLight: { value: look.rimLight ?? 1.3 },
    },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: COMPOSITE(pal.length),
  });
  const quad = new FullScreenQuad(material);

  const resize = (w: number, h: number) => {
    renderer.setSize(w, h, false);
    beauty.setSize(w, h);
    info.setSize(w, h);
    (material.uniforms.texel.value as THREE.Vector2).set(1 / w, 1 / h);
    camera.left = -w / unitPx / 2;
    camera.right = w / unitPx / 2;
    camera.top = h / unitPx / 2;
    camera.bottom = -h / unitPx / 2;
    camera.updateProjectionMatrix();
  };

  const infoMats = new Map<THREE.Mesh, THREE.Material>();
  const drawInfo = (scene: THREE.Scene) => {
    const swapped: [THREE.Mesh, THREE.Material | THREE.Material[]][] = [];
    const hidden: THREE.Object3D[] = [];
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      // Flames, sparkles and soft shadows draw in colour but get no outline.
      if ((m.isMesh || (o as THREE.Points).isPoints) && m.visible && m.userData.noInfo) {
        hidden.push(m);
        return;
      }
      if (!m.isMesh || !m.visible) return;
      let im = infoMats.get(m);
      if (!im) {
        const src = (Array.isArray(m.material) ? m.material[0] : m.material) as Shaded;
        im = infoMaterial(src, (o.userData.pid as number | undefined) ?? 1);
        infoMats.set(m, im);
      }
      const current = (Array.isArray(m.material) ? m.material[0] : m.material) as Shaded;
      const uMap = im.userData.uMap as { value: THREE.Texture | null } | undefined;
      if (uMap && current.map) uMap.value = current.map;
      swapped.push([m, m.material]);
      m.material = im;
    });
    for (const o of hidden) o.visible = false;
    const bg = scene.background;
    scene.background = null;
    const auto = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    renderer.render(scene, camera);
    renderer.shadowMap.autoUpdate = auto;
    scene.background = bg;
    for (const [m, mat] of swapped) m.material = mat;
    for (const o of hidden) o.visible = true;
  };

  const sunDir = new THREE.Vector3();
  const render = (scene: THREE.Scene) => {
    const u = material.uniforms;
    // the rim follows the shadow-casting moon, seen from this camera
    const sun = scene.children.find((o) => (o as THREE.DirectionalLight).isDirectionalLight && o.castShadow) as THREE.DirectionalLight | undefined;
    if (sun) {
      sunDir.copy(sun.position).sub(sun.target.position).normalize().transformDirection(camera.matrixWorldInverse);
      const rd = u.rimDir.value as THREE.Vector2;
      rd.set(sunDir.x, sunDir.y);
      if (rd.lengthSq() > 1e-4) rd.normalize();
    }
    u.exposure.value = effects.exposure;
    u.flash.value = effects.flash;
    u.vignette.value = effects.vignette;
    renderer.setRenderTarget(beauty);
    renderer.render(scene, camera);
    renderer.setRenderTarget(info);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    drawInfo(scene);
    renderer.setRenderTarget(null);
    quad.render(renderer);
  };

  return { renderer, camera, unitPx, effects, resize, render };
};
