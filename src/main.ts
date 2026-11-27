import * as THREE from "three";
import story2 from "../content/euphoria/if2-story.json";
import { candleLit } from "./art/candle";
import { miserRestless } from "./art/miser";
import { wisp } from "./art/props";
import { Sound } from "./game/audio";
import { Billboard } from "./game/billboard";
import { FollowCamera } from "./game/camera";
import { Input } from "./game/input";
import { takeaways } from "./game/lesson";
import { SCENE_PALETTE, UNIT_PX } from "./game/look";
import { Particles } from "./game/particles";
import { createPipeline } from "./game/pipeline";
import { Player, type Blocker } from "./game/player";
import type { Clue, Room, RoomScript } from "./game/room";
import { NEXT_ROOMS, ROOMS, TOTAL_ROOMS } from "./game/rooms";
import { buildPlan } from "./lib/pixel/story/engine";
import { spriteToSvgMarkup } from "./lib/pixel/svg";
import { MoviePlayer } from "./ui/movie";
import { UI } from "./ui/ui";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const SAVE_KEY = "euphoria-haunted-v2";
const INTRO_KEY = "euphoria-haunted-intro-seen";
const SCORE_KEY = "euphoria-haunted-first-try";
const TARGET_H = 190;

// ---- systems shared by every room
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
const input = new Input(document.getElementById("stage")!);
const sound = new Sound();
const ui = new UI(reducedMotion);
const movies = new MoviePlayer(reducedMotion);
const cam = new FollowCamera(pipeline.camera, { x0: -8.6, x1: 8.6, u0: -3.3, u1: 7.9 });

// ---- the current room (replaced on every walk through a door)
type Phase = "title" | "explore" | "battle" | "moving" | "end";
let phase: Phase = "title";
let roomIndex = 0;
let script: RoomScript = ROOMS[0];
let room: Room = script.build();
const player = new Player(room.scene);
const particles = new Particles(room.scene);
let ghost = new Billboard(script.ghost.restless, { pid: 70, lift: 0.5, shadow: 0.42 });
const ghostLight = new THREE.PointLight(script.ghost.light, 2.6, 4.5, 1.2);
let lit = 0;
let freed = false;
let ghostGone = false;
let flicker = 0;
let t = 0;
let scale = 4;
let viewW = 2, viewH = 2;
/** For the end card's score: whether each question's first answer was right, keyed by room and question. */
let firstTry: Record<string, boolean> = {};
try { firstTry = JSON.parse(localStorage.getItem(SCORE_KEY) ?? "{}") ?? {}; } catch { /* storage blocked: the score covers this visit only */ }

/** Builds room `i` and moves the player, lantern, particles and a fresh ghost into it. */
const enterRoom = (i: number, found: string[] = [], wasFreed = false) => {
  roomIndex = i;
  script = ROOMS[i];
  room = script.build();
  room.scene.add(player.sprite.group, player.lantern, particles.points, ghostLight);
  ghost = new Billboard(script.ghost.restless, { pid: 70, lift: 0.5, shadow: 0.42 });
  ghost.position.copy(room.ghostHome);
  room.scene.add(ghost.group);
  ghostLight.color.set(script.ghost.light);
  ghostLight.intensity = 2.6;
  player.position.copy(room.spawn);
  player.velocity.set(0, 0);
  cam.view = room.view;
  cam.jumpTo(player.position);
  lit = 0;
  freed = false;
  ghostGone = false;
  for (const c of room.clues) if (found.includes(c.id)) { c.found = true; c.wisp.group.visible = false; room.candles[c.candle].setLit(); lit++; }
  if (wasFreed) { freed = true; ghostGone = true; ghost.group.visible = false; ghostLight.intensity = 0; room.celebrate(); }
  document.getElementById("room-num")!.textContent = `Room ${script.num} of ${TOTAL_ROOMS}`;
  document.getElementById("room-name")!.textContent = script.name;
  canvas.setAttribute("aria-label", `${script.name} of the haunted house`);
  showProgress();
};

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
    localStorage.setItem(SAVE_KEY, JSON.stringify({ room: roomIndex, found: room.clues.filter((c) => c.found).map((c) => c.id), freed }));
  } catch { /* storage blocked: progress just is not kept */ }
};
const load = () => {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null") as { room: number; found: string[]; freed: boolean } | null;
    if (s && ROOMS[s.room]) return enterRoom(s.room, s.found, s.freed);
  } catch { /* ignore a broken save */ }
  enterRoom(0);
};

/** The HUD's candles and its goal line, always in step with progress. */
function showProgress() {
  ui.setCandles(lit, 3);
  document.getElementById("candle-count")!.textContent = `${lit} of 3`;
  document.getElementById("objective")!.textContent = room.state.doorOpen || freed
    ? `${script.ghost.name} is free. Walk through the door.`
    : lit < 3
      ? "Find the glowing clues to light the candles."
      : `Face ${ghostName()} at the door.`;
}

// ---- feedback helpers
const flash = (amount: number, color: string) => {
  pipeline.effects.flash = Math.max(pipeline.effects.flash, reducedMotion ? 0 : amount);
  pipeline.effects.flashColor.set(color);
};
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
/** "The Miser" as it reads mid-sentence: "the Miser". */
const ghostName = () => script.ghost.name.replace(/^The /, "the ");
const ghostTop = () => ghost.position.clone().add(new THREE.Vector3(0, ghost.lift + 1.2, 0));

// ---- interactions
/** Each clue plays its cutscene: fullscreen, started with Play, unskippable, then Continue. */
const playMovie = async (id: string, freezeAt?: number) => {
  ui.busy = true;
  ui.prompt(null);
  await movies.play(
    script.movies[id],
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
  const candle = room.candles[clue.candle];
  candle.ignite();
  sound.ignite();
  particles.burst(candle.top.clone().add(new THREE.Vector3(0, 0.45, 0)), ["#FFD47A", "#FF9A3C", "#FFE3A0", "#E8661C"], 30, 0.9, 1.4, 0.9);
  flash(0.22, "#FFD47A");
  cam.shake(0.18);
  lit++;
  showProgress();
  ui.toast(lit < 3 ? `Candle lit: ${lit} of 3` : `All three candles are lit. Face ${ghostName()}.`);
  if (lit === 3) setTimeout(() => { sound.boo(); cam.shake(0.35); flash(0.18, "#D63A3A"); }, 900);
  save();
};

const encounter = async () => {
  phase = "battle";
  input.locked = true;
  ui.prompt(null);
  sound.encounter();
  cam.shake(0.45);
  await ui.wipe(true);
  // face off: the player stands back from the ghost, and the camera frames both above the question panel
  player.position.set(ghost.position.x, 0, ghost.position.z + 2.3);
  player.velocity.set(0, 0);
  cam.zoom = 2;
  // centre 0.7 units in front of the ghost: at 2x zoom the ghost's head clears the letterbox and the
  // player's head and shoulders stay above the question panel
  cam.jumpTo(ghost.position.clone().add(new THREE.Vector3(0, 0, 0.7)));
  flash(0.9, "#FFFBEF");
  await ui.wipe(false);
  await ui.dialog(script.lines.intro, script.ghost.restless);
  // A missed question goes to the back of the queue. Asking it again at once would hand over the answer
  // (on a true-or-false question, one wrong guess guarantees the next one).
  const queue = [...script.questions];
  ui.openBattle(script.ghost.name, queue.length, script.ghost.restless, [...script.lines.right, ...script.lines.wrong]);
  let unrest = queue.length;
  while (unrest > 0) {
    const q = queue[0];
    const chosen = await ui.ask(q);
    const good = chosen === q.correct;
    const qid = `${script.key}:${script.questions.indexOf(q)}`;
    if (!(qid in firstTry)) {
      firstTry[qid] = good;
      try { localStorage.setItem(SCORE_KEY, JSON.stringify(firstTry)); } catch { /* storage blocked */ }
    }
    if (good) {
      unrest--;
      ui.setUnrest(unrest);
      sound.right();
      ghost.setSprite(script.ghost.calm);
      particles.burst(ghostTop(), ["#6FE3E8", "#DCC8FF", "#FFFBEF"], 24, 1.2, 0.8, 0.8, 0);
      flash(0.2, "#6FE3E8");
      cam.shake(0.15);
    } else {
      sound.wrong();
      ghost.setSprite(script.ghost.restless);
      particles.burst(ghostTop(), ["#D63A3A", "#F08A80", "#951C4C"], 24, 1.6, 0.6, 0.7, 0);
      flicker = 0.6;
      cam.shake(0.6);
    }
    await ui.answer(q, chosen, pick(good ? script.lines.right : script.lines.wrong), good ? script.ghost.calm : script.ghost.restless);
    queue.shift();
    if (!good) queue.push(q);
  }
  ui.closeBattle();

  // freed: the ghost glows, thanks you, and rises away; warm light fills the room and the door unseals
  freed = true;
  showProgress();
  ghost.setSprite(script.ghost.freed);
  ghost.loop = false;
  ghost.play(true);
  sound.freed();
  flash(0.7, "#6FE3E8");
  particles.burst(ghostTop(), ["#6FE3E8", "#FFFBEF", "#DCC8FF", "#8FB8F0"], 80, 2, 1.2, 1.6, -0.3);
  await ui.dialog(script.lines.freed, script.ghost.freed);
  input.takeAction();
  flash(0.6, "#FFFBEF");
  cam.zoom = 1;
  cam.jumpTo(player.position);
  room.celebrate();
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
    await ui.dialog(script.lines.tooSoon, script.ghost.restless);
    input.takeAction();
    return;
  }
  await encounter();
};

/** Through the door: on to the next room, or the end card after the last one built. */
const leaveRoom = async () => {
  phase = "moving";
  input.locked = true;
  ui.prompt(null);
  ui.clearToast();
  await ui.fade(1, 900);
  const next = roomIndex + 1;
  if (ROOMS[next]) {
    enterRoom(next);
    save();
    await ui.fade(0, 700);
    ui.toast(`Room ${script.num}: ${script.name}`);
    phase = "explore";
    input.locked = false;
    return;
  }
  phase = "end";
  const tries = Object.values(firstTry);
  ui.showEnd({
    kicker: `${ROOMS.length} of ${TOTAL_ROOMS} rooms complete`,
    next: NEXT_ROOMS.length ? `Coming next: ${NEXT_ROOMS.join(", ")}.` : "",
    score: { right: tries.filter(Boolean).length, of: tries.length },
    recap: ROOMS.map((r) => ({ room: r.name, ghost: r.ghost.name, face: r.ghost.freed, point: `${takeaways(r.num)[0].takeaway}.` })),
  });
  await ui.fade(0, 600);
};

// ---- title, intro, mute, restart, touch action
const intro = document.getElementById("intro")!;
// Atlas is Euphoria's mascot; his sprite ships with the lesson 2 story art. Every size is a whole multiple.
const ICONS = { wisp: [wisp, 8], candle: [candleLit, 3], ghost: [miserRestless, 2], atlas: [story2.art.actors.atlas, 4] } as const;
for (const el of document.querySelectorAll<HTMLElement>("[data-icon]")) {
  const [sprite, size] = ICONS[el.dataset.icon as keyof typeof ICONS];
  el.innerHTML = spriteToSvgMarkup(sprite, size);
}

const begin = () => {
  intro.hidden = true;
  try { localStorage.setItem(INTRO_KEY, "1"); } catch { /* the intro just shows again next time */ }
  document.getElementById("hud")!.hidden = false;
  phase = "explore";
  input.takeAction();
  ui.stickHint();
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
const muteBtn = document.getElementById("mute")!;
muteBtn.addEventListener("click", () => {
  sound.setMuted(!sound.muted);
  muteBtn.setAttribute("aria-pressed", String(sound.muted));
  muteBtn.textContent = sound.muted ? "Sound off" : "Sound on";
});
document.getElementById("restart")!.addEventListener("click", () => {
  try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(SCORE_KEY); } catch { /* nothing to clear */ }
  location.reload();
});
document.getElementById("act")!.addEventListener("click", () => input.pressAction());
player.onStep = () => sound.step();
load();
// the game is ready: the title's button was "Loading..." until now
const startBtn = document.getElementById("start") as HTMLButtonElement;
startBtn.textContent = "Enter the house";
startBtn.disabled = false;
startBtn.focus();

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

  // walkable area: the doorway opens into the passage once the ghost is freed
  const open = room.state.doorOpen;
  const d = room.door;
  const walk = { ...room.bounds, z0: open && player.position.x > d.x0 - 0.45 && player.position.x < d.x1 + 0.45 ? d.corridorZ : room.bounds.z0 };
  const colliders = open ? [...room.colliders, { x0: -9, z0: -9, x1: d.x0 - 0.5, z1: d.z + 0.05 }, { x0: d.x1 + 0.5, z0: -9, x1: 9, z1: d.z + 0.05 }] : room.colliders;
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
      ghostLight.color.set(freed ? "#6FE3E8" : script.ghost.light);
      ghostLight.intensity = 2.6 * (0.85 + 0.15 * Math.sin(t * 3.1));
    }
    ghostLight.position.set(ghost.position.x, ghost.lift + 1.1, ghost.position.z + 0.6);
    if (!reducedMotion && Math.random() < dt * 7) {
      const p = ghost.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.1, ghost.lift + Math.random() * 1.1, 0.2));
      particles.burst(p, freed ? ["#6FE3E8", "#FFFBEF"] : ["#D63A3A", "#951C4C", "#F08A80"], 1, 0.15, 0.5, 1.4, 0.1);
    }
    ghost.update(dt, pipeline.camera, reducedMotion);
  }

  room.update(dt, t, pipeline.camera, reducedMotion);
  particles.update(dt);

  // dread grows as you near a restless ghost: louder drone, a tighter vignette
  const dist = ghostGone ? 99 : player.position.distanceTo(ghost.position);
  const dread = freed ? 0 : THREE.MathUtils.clamp(1 - (dist - 1.3) / 4.5, 0, 1);
  sound.setDread(phase === "title" ? 0 : dread);
  pipeline.effects.vignette = 0.32 + 0.33 * dread;
  pipeline.effects.flash = Math.max(0, pipeline.effects.flash - dt * 2.6);
  flicker = Math.max(0, flicker - dt);
  // A wrong answer dims the room once and lets it recover (one dip in 0.6 s, well under 3 flashes a second).
  // The old version strobed at about 9 Hz, and did so even under reduced motion.
  const dip = flicker > 0 && !reducedMotion ? 0.5 * Math.sin(Math.PI * (1 - flicker / 0.6)) : 0;
  pipeline.effects.exposure = (freed ? 1.04 : 1) * (1 - dip);

  if (phase !== "battle") cam.target.copy(phase === "title" ? new THREE.Vector3(0, 0, -1.5) : player.position);
  cam.update(dt, viewW, viewH, reducedMotion);
  canvas.style.transform = `translate(${(-1 - cam.remainder.x) * scale}px, ${(-1 + cam.remainder.y) * scale}px)`;

  // what can be used right now
  if (phase === "explore" && !ui.busy) {
    let best: { label: string; at: THREE.Vector3; run: () => void } | null = null;
    let bestD = Infinity;
    for (const c of room.clues) {
      if (c.found) continue;
      const cd = player.position.distanceTo(c.at);
      if (cd < c.radius && cd < bestD) { bestD = cd; best = { label: script.clueLabels[c.id], at: c.wisp.position, run: () => void examine(c) }; }
    }
    if (!ghostGone && !freed && dist < 1.9 && dist < bestD) {
      best = { label: lit < 3 ? "Speak to the ghost" : `Face ${ghostName()}`, at: ghostTop(), run: () => void talkToGhost() };
    }
    if (best) {
      const s = projectToScreen(best.at.clone().add(new THREE.Vector3(0, 0.35, 0)));
      ui.prompt(best.label, s.x, s.y, input.hasTouch);
      if (input.takeAction()) best.run();
    } else {
      ui.prompt(null);
      input.takeAction();
    }
    if (open && player.position.z < d.exitZ) void leaveRoom();
  }

  pipeline.render(room.scene);
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);

// a test hook for local development only
if (import.meta.env.DEV) {
  Object.assign(window, {
    __game: {
      get state() {
        return { phase, room: script.key, lit, freed, ghostGone, busy: ui.busy, player: player.position.toArray(), facing: player.facing, door: room.state.doorOpen };
      },
      teleport: (x: number, z: number) => { player.position.set(x, 0, z); cam.jumpTo(player.position); },
      /** Jumps straight to room `i` (0-based). */
      room: (i: number) => { enterRoom(i); phase = "explore"; },
      /** Opens the current room's cutscene frozen at movie time `ms`, for checking a frame. */
      movieAt: (id: string, ms: number) => void playMovie(id, ms),
      movieBeats: (id: string) => buildPlan([script.movies[id].lesson]).lessons[0].beats.map((b) => [b.start, b.end, b.motion]),
      clueIds: () => room.clues.map((c) => c.id),
      answerKey: () => script.questions.map((q) => q.correct),
      /** Lights every candle without the movies, for quick visual checks. */
      lightAll: () => {
        for (const c of room.clues) if (!c.found) { c.found = true; c.wisp.group.visible = false; room.candles[c.candle].setLit(); lit++; }
        showProgress();
      },
    },
  });
}
