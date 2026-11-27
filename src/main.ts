import * as THREE from "three";
import { miserCalm as ghostCalm, miserFreed as ghostFreed, miserRestless as ghostRestless, miserRestless } from "./art/miser";
import { Sound } from "./game/audio";
import { Billboard } from "./game/billboard";
import { FollowCamera } from "./game/camera";
import { buildFoyer, type Clue } from "./game/foyer";
import { Input } from "./game/input";
import { SCENE_PALETTE, UNIT_PX } from "./game/look";
import { Particles } from "./game/particles";
import { createPipeline } from "./game/pipeline";
import { Player, type Blocker } from "./game/player";
import { MOVIES } from "./game/movies";
import { candleLit } from "./art/candle";
import { wisp } from "./art/props";
import { spriteToSvgMarkup } from "./lib/pixel/svg";
import { CLUE_LABEL, GHOST_LINES, GHOST_NAME, QUESTIONS } from "./game/story";
import { buildPlan } from "./lib/pixel/story/engine";
import { MoviePlayer } from "./ui/movie";
import { UI } from "./ui/ui";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const SAVE_KEY = "euphoria-haunted-foyer-v1";
const INTRO_KEY = "euphoria-haunted-intro-seen";
const TARGET_H = 190;

// ---- world
const canvas = document.getElementById("view") as HTMLCanvasElement;
// Tiny Why's grade: shadows lifted toward violet, highlights pushed warm, and moonlit rim edges
const pipeline = createPipeline(canvas, UNIT_PX, {
  palette: SCENE_PALETTE,
  fog: { color: "#07050C", start: 26, density: 0.05 },
  ao: 0.3,
  lift: [0.035, 0.012, 0.07],
  gain: [1.06, 1.0, 0.95],
  rimLight: 1.45,
});
const foyer = buildFoyer();
const { scene } = foyer;
const player = new Player(scene);
const ghost = new Billboard(ghostRestless, { pid: 70, lift: 0.5, shadow: 0.42 });
ghost.position.copy(foyer.ghostHome);
scene.add(ghost.group);
const ghostLight = new THREE.PointLight("#D63A3A", 2.6, 4.5, 1.2);
scene.add(ghostLight);
const particles = new Particles(scene);
const cam = new FollowCamera(pipeline.camera, { x0: -8.6, x1: 8.6, u0: -3.3, u1: 7.9 });
const input = new Input(document.getElementById("stage")!);
const sound = new Sound();
const ui = new UI(reducedMotion);
const movies = new MoviePlayer(reducedMotion);

type Phase = "title" | "explore" | "battle" | "end";
let phase: Phase = "title";
let lit = 0;
let freed = false;
let ghostGone = false;
let flicker = 0;
let t = 0;
let scale = 4;
let viewW = 2, viewH = 2;
const base = { exposure: 1 };

// ---- sizing: a low-res canvas scaled up by a whole number, plus one hidden pixel of pad on each side
const resize = () => {
  scale = Math.max(2, Math.round(innerHeight / TARGET_H));
  let w = Math.ceil(innerWidth / scale) + 2, h = Math.ceil(innerHeight / scale) + 2;
  w += w % 2;
  h += h % 2;
  viewW = w;
  viewH = h;
  pipeline.resize(w, h);
  canvas.style.width = `${w * scale}px`;
  canvas.style.height = `${h * scale}px`;
};
addEventListener("resize", resize);
resize();

// ---- saved progress (optional: the game works the same if storage is blocked)
const save = () => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ found: foyer.clues.filter((c) => c.found).map((c) => c.id), freed }));
  } catch { /* storage blocked: progress just is not kept */ }
};
const load = () => {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null") as { found: string[]; freed: boolean } | null;
    if (!s) return;
    for (const c of foyer.clues) if (s.found.includes(c.id)) { c.found = true; c.wisp.group.visible = false; foyer.candles[c.candle].setLit(); lit++; }
    if (s.freed) { freed = true; ghostGone = true; ghost.group.visible = false; ghostLight.intensity = 0; foyer.celebrate(); }
  } catch { /* ignore a broken save */ }
};
load();

/** The HUD's candles and its goal line, always in step with progress. */
const showProgress = () => {
  ui.setCandles(lit, 3);
  const goal = document.getElementById("objective")!;
  document.getElementById("candle-count")!.textContent = `${lit} of 3`;
  goal.textContent = foyer.state.doorOpen || freed
    ? "The Miser is free. Walk through the door."
    : lit < 3
      ? "Find the glowing clues to light the candles."
      : "Face the Miser at the door.";
};
showProgress();

// ---- feedback helpers
const flash = (amount: number, color: string) => {
  pipeline.effects.flash = Math.max(pipeline.effects.flash, reducedMotion ? 0 : amount);
  pipeline.effects.flashColor.set(color);
};
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const ghostTop = () => ghost.position.clone().add(new THREE.Vector3(0, ghost.lift + 1.2, 0));

// ---- interactions
/** Each clue plays its cutscene: fullscreen, started with Play, unskippable, then Continue. */
const playMovie = async (id: Clue["id"], freezeAt?: number) => {
  ui.busy = true;
  ui.prompt(null);
  await movies.play(
    MOVIES[id],
    { onStart: () => sound.movieStart(), onBeat: (i) => i > 0 && sound.beat(), onCue: (c) => sound.cue(c.do), onEnd: () => sound.movieStop() },
    freezeAt,
  );
  ui.busy = false;
};

const examine = async (clue: Clue) => {
  sound.open();
  await playMovie(clue.id);
  input.takeAction();
  clue.found = true;
  clue.wisp.group.visible = false;
  const candle = foyer.candles[clue.candle];
  candle.ignite();
  sound.ignite();
  particles.burst(candle.top.clone().add(new THREE.Vector3(0, 0.45, 0)), ["#FFD47A", "#FF9A3C", "#FFE3A0", "#E8661C"], 30, 0.9, 1.4, 0.9);
  flash(0.22, "#FFD47A");
  cam.shake(0.18);
  lit++;
  showProgress();
  ui.toast(lit < 3 ? `Candle lit: ${lit} of 3` : "All three candles are lit. Face the Miser.");
  if (lit === 3) {
    setTimeout(() => { sound.boo(); cam.shake(0.35); flash(0.18, "#D63A3A"); }, 900);
  }
  save();
};

const encounter = async () => {
  phase = "battle";
  input.locked = true;
  sound.encounter();
  cam.shake(0.45);
  await ui.wipe(true);
  // face off: the player stands back from the ghost, and the camera frames both above the question panel
  player.position.set(ghost.position.x, 0, ghost.position.z + 2.3);
  player.velocity.set(0, 0);
  cam.zoom = 2;
  // centre 0.7 units in front of the ghost: at 2x zoom the Miser's top hat clears the letterbox and the
  // player's head and shoulders stay above the question panel
  cam.jumpTo(ghost.position.clone().add(new THREE.Vector3(0, 0, 0.7)));
  flash(0.9, "#FFFBEF");
  await ui.wipe(false);
  await ui.dialog(GHOST_LINES.intro);
  ui.openBattle(GHOST_NAME, QUESTIONS.length);
  let unrest = QUESTIONS.length;
  let qi = 0;
  while (unrest > 0) {
    const q = QUESTIONS[qi];
    const chosen = await ui.ask(q);
    const good = chosen === q.correct;
    if (good) {
      unrest--;
      ui.setUnrest(unrest);
      sound.right();
      ghost.setSprite(ghostCalm);
      particles.burst(ghostTop(), ["#6FE3E8", "#DCC8FF", "#FFFBEF"], 24, 1.2, 0.8, 0.8, 0);
      flash(0.2, "#6FE3E8");
      cam.shake(0.15);
    } else {
      sound.wrong();
      ghost.setSprite(ghostRestless);
      particles.burst(ghostTop(), ["#D63A3A", "#F08A80", "#951C4C"], 24, 1.6, 0.6, 0.7, 0);
      flicker = 0.6;
      cam.shake(0.6);
    }
    await ui.answer(q, chosen, pick(good ? GHOST_LINES.right : GHOST_LINES.wrong));
    if (good) qi++;
  }
  ui.closeBattle();

  // freed: the ghost glows, thanks you, and rises away; the chandelier lights and the door unseals
  freed = true;
  ghost.setSprite(ghostFreed);
  ghost.loop = false;
  ghost.play(true);
  sound.freed();
  flash(0.7, "#6FE3E8");
  particles.burst(ghostTop(), ["#6FE3E8", "#FFFBEF", "#DCC8FF", "#8FB8F0"], 80, 2, 1.2, 1.6, -0.3);
  await ui.dialog(GHOST_LINES.freed);
  input.takeAction();
  flash(0.6, "#FFFBEF");
  cam.zoom = 1;
  cam.jumpTo(player.position);
  foyer.celebrate();
  setTimeout(() => { ui.toast("The door is open."); showProgress(); }, 1700);
  phase = "explore";
  input.locked = false;
  save();
};

const talkToGhost = async () => {
  if (lit < 3) {
    sound.boo();
    cam.shake(0.3);
    flash(0.15, "#D63A3A");
    await ui.dialog(GHOST_LINES.tooSoon);
    input.takeAction();
    return;
  }
  await encounter();
};

const finish = async () => {
  phase = "end";
  input.locked = true;
  await ui.fade(1, 900);
  document.getElementById("hud")!.hidden = true;
  document.getElementById("end")!.hidden = false;
  await ui.fade(0, 600);
};

// ---- title, mute, restart, touch action
const intro = document.getElementById("intro")!;
for (const [key, sprite, scale] of [["wisp", wisp, 8], ["candle", candleLit, 3], ["ghost", miserRestless, 1.5]] as const)
  intro.querySelector(`[data-icon="${key}"]`)!.innerHTML = spriteToSvgMarkup(sprite, scale);

const begin = () => {
  intro.hidden = true;
  try { localStorage.setItem(INTRO_KEY, "1"); } catch { /* the intro just shows again next time */ }
  document.getElementById("hud")!.hidden = false;
  phase = "explore";
  input.takeAction();
};
const start = () => {
  sound.start();
  document.getElementById("title")!.hidden = true;
  let seen = false;
  try { seen = localStorage.getItem(INTRO_KEY) === "1"; } catch { /* storage blocked: show the intro */ }
  if (seen) return begin();
  intro.hidden = false;
  (document.getElementById("begin") as HTMLButtonElement).focus();
};
document.getElementById("start")!.addEventListener("click", start);
document.getElementById("begin")!.addEventListener("click", begin);
if (input.hasTouch) {
  const touch = "Drag on the left side of the screen to move. Tap the button to look at things.";
  document.getElementById("controls-hint")!.textContent = touch;
  document.getElementById("intro-controls")!.textContent = touch;
}
const muteBtn = document.getElementById("mute")!;
muteBtn.addEventListener("click", () => {
  sound.setMuted(!sound.muted);
  muteBtn.setAttribute("aria-pressed", String(sound.muted));
  muteBtn.textContent = sound.muted ? "Sound off" : "Sound on";
});
document.getElementById("restart")!.addEventListener("click", () => {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* nothing to clear */ }
  location.reload();
});
document.getElementById("act")!.addEventListener("click", () => input.pressAction());
player.onStep = () => sound.step();
cam.jumpTo(player.position);

// ---- the frame loop
const projectToScreen = (p: THREE.Vector3) => {
  const v = p.clone().project(pipeline.camera);
  const r = canvas.getBoundingClientRect();
  return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
};

let last = performance.now();
const frame = (now: number) => {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  t += dt;
  input.update();
  if (phase !== "explore" || ui.busy) { input.move.x = 0; input.move.y = 0; }

  // walkable area: the doorway opens into the corridor once the ghost is freed
  const open = foyer.state.doorOpen;
  const walk = { ...foyer.bounds, z0: open && Math.abs(player.position.x) < 0.75 ? -8.0 : foyer.bounds.z0 };
  const colliders = open ? [...foyer.colliders, { x0: -9, z0: -9, x1: -0.8, z1: -6.2 }, { x0: 0.8, z0: -9, x1: 9, z1: -6.2 }] : foyer.colliders;
  const blockers: Blocker[] = ghostGone ? [] : [{ x: ghost.position.x, z: ghost.position.z, r: 0.55 }];
  player.update(dt, t, input, walk, colliders, blockers, pipeline.camera, reducedMotion);

  // the ghost: bobbing, glowing, shedding motes; once freed it rises and fades
  if (!ghostGone) {
    if (freed && phase === "explore") {
      ghost.lift += dt * 0.9;
      const m = ghost.mesh.material;
      m.transparent = true;
      m.opacity = Math.max(0, m.opacity - dt * 0.45);
      ghostLight.intensity = 2.6 * m.opacity;
      if (m.opacity <= 0) { ghostGone = true; ghost.group.visible = false; }
    } else {
      ghost.lift = 0.5 + (reducedMotion ? 0 : 0.1 * Math.sin(t * 1.7));
      ghostLight.color.set(freed ? "#6FE3E8" : "#D63A3A");
      ghostLight.intensity = 2.6 * (0.85 + 0.15 * Math.sin(t * 3.1));
    }
    ghostLight.position.set(ghost.position.x, ghost.lift + 1.1, ghost.position.z + 0.6);
    if (!reducedMotion && Math.random() < dt * 7) {
      const p = ghost.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.1, ghost.lift + Math.random() * 1.1, 0.2));
      particles.burst(p, freed ? ["#6FE3E8", "#FFFBEF"] : ["#D63A3A", "#951C4C", "#F08A80"], 1, 0.15, 0.5, 1.4, 0.1);
    }
    ghost.update(dt, pipeline.camera, reducedMotion);
  }

  foyer.update(dt, t, pipeline.camera, reducedMotion);
  particles.update(dt);

  // dread grows as you near a restless ghost: louder drone, a tighter vignette
  const dist = ghostGone ? 99 : player.position.distanceTo(ghost.position);
  const dread = freed ? 0 : THREE.MathUtils.clamp(1 - (dist - 1.3) / 4.5, 0, 1);
  sound.setDread(phase === "title" ? 0 : dread);
  pipeline.effects.vignette = 0.32 + 0.33 * dread;
  pipeline.effects.flash = Math.max(0, pipeline.effects.flash - dt * 2.6);
  flicker = Math.max(0, flicker - dt);
  const target = (freed ? 1.04 : base.exposure) * (flicker > 0 && Math.sin(t * 55) > 0 ? 0.45 : 1);
  pipeline.effects.exposure = target;

  if (phase !== "battle") cam.target.copy(phase === "title" ? new THREE.Vector3(0, 0, -1.5) : player.position);
  cam.update(dt, viewW, viewH, reducedMotion);
  canvas.style.transform = `translate(${(-1 - cam.remainder.x) * scale}px, ${(-1 + cam.remainder.y) * scale}px)`;

  // what can be used right now
  if (phase === "explore" && !ui.busy) {
    let best: { label: string; at: THREE.Vector3; run: () => void } | null = null;
    let bestD = Infinity;
    for (const c of foyer.clues) {
      if (c.found) continue;
      const d = player.position.distanceTo(c.at);
      if (d < c.radius && d < bestD) { bestD = d; best = { label: CLUE_LABEL[c.id], at: c.wisp.position, run: () => void examine(c) }; }
    }
    if (!ghostGone && !freed && dist < 1.9 && dist < bestD) {
      best = { label: lit < 3 ? "Speak to the ghost" : "Face the Miser", at: ghostTop(), run: () => void talkToGhost() };
    }
    if (best) {
      const s = projectToScreen(best.at.clone().add(new THREE.Vector3(0, 0.35, 0)));
      ui.prompt(best.label, s.x, s.y, input.hasTouch);
      if (input.takeAction()) best.run();
    } else {
      ui.prompt(null);
      input.takeAction();
    }
    if (open && player.position.z < -7.6) void finish();
  }

  pipeline.render(scene);
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);

// a test hook for local development only
if (import.meta.env.DEV) {
  Object.assign(window, {
    __game: {
      get state() { return { phase, lit, freed, ghostGone, busy: ui.busy, player: player.position.toArray(), facing: player.facing, door: foyer.state.doorOpen }; },
      teleport: (x: number, z: number) => { player.position.set(x, 0, z); cam.jumpTo(player.position); },
      /** Opens a cutscene frozen at movie time `ms`, for checking a frame. */
      movieAt: (id: Clue["id"], ms: number) => void playMovie(id, ms),
      /** Lights every candle without the movies, for quick visual checks. */
      lightAll: () => {
        for (const c of foyer.clues) if (!c.found) { c.found = true; c.wisp.group.visible = false; foyer.candles[c.candle].setLit(); lit++; }
        showProgress();
      },
      movieBeats: (id: Clue["id"]) => buildPlan([MOVIES[id].lesson]).lessons[0].beats.map((b) => [b.start, b.end, b.motion]),
    },
  });
}
