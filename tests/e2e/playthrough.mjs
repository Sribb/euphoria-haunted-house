// End-to-end check. Plays the whole house in a real browser against a dev server it starts itself:
//   1. frees the ghost in each of the five rooms and walks through every door to the end card,
//   2. reloads mid-house and expects to resume in the right room,
//   3. on a phone-sized touch screen, taps quickly through a ghost's intro and expects no answer
//      to be chosen by a stray tap.
// It uses the dev-only hooks on `window.__game` (light the candles, teleport, read the answer key),
// so it skips the clue movies. Needs Google Chrome installed. Run: npm run test:e2e
import { chromium } from "playwright-core";
import { createServer } from "vite";

const server = await createServer({ logLevel: "error", server: { host: "127.0.0.1", port: 5199 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({ channel: "chrome" });

const failures = [];
const check = (ok, msg) => {
  console.log((ok ? "PASS " : "FAIL ") + msg);
  if (!ok) failures.push(msg);
};

const ROOMS = [
  ["foyer", "The Foyer"],
  ["cellar", "The Cellar"],
  ["clocktower", "The Clock Tower"],
  ["gallery", "The Portrait Gallery"],
  ["kitchen", "The Kitchen"],
];

/** Opens the game with empty storage and gets past the title and the intro card. */
const start = async (page, tap = false) => {
  const press = (sel) => (tap ? page.tap(sel) : page.click(sel));
  await page.goto(base, { waitUntil: "load" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("#start:not([disabled])", { timeout: 15000 });
  await press("#start");
  await page.waitForTimeout(300);
  if (await page.isVisible("#intro")) await press("#begin");
};

const playthrough = async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  const state = () => page.evaluate(() => window.__game.state);
  const advance = async () => {
    for (let i = 0; i < 12 && (await page.isVisible("#dialog")); i++) {
      await page.keyboard.press("Space");
      await page.waitForTimeout(220);
    }
  };
  await start(page);
  for (let i = 0; i < ROOMS.length; i++) {
    const [key, name] = ROOMS[i];
    check((await state()).room === key, `in ${name}`);
    check((await page.textContent("#room-name")) === name && (await page.textContent("#room-num")) === `Room ${i + 1} of ${ROOMS.length}`, `the HUD names ${name}, room ${i + 1} of ${ROOMS.length}`);
    await page.evaluate(() => { window.__game.lightAll(); window.__game.teleport(0, -3.4); });
    await page.waitForTimeout(500);
    await page.keyboard.press("KeyE");
    await page.waitForSelector("#dialog:not([hidden])", { timeout: 6000 });
    await advance();
    for (const answer of await page.evaluate(() => window.__game.answerKey())) {
      await page.waitForSelector("#battle .options button:not([disabled])", { timeout: 5000 });
      await page.waitForTimeout(120);
      await page.keyboard.press(String(answer + 1));
      await page.waitForTimeout(250);
      await page.keyboard.press("Space");
      await page.waitForTimeout(150);
      await page.keyboard.press("Space");
      await page.waitForTimeout(350);
    }
    await advance();
    await page.waitForTimeout(2600);
    const s = await state();
    check(s.freed && s.door, `${name}: the ghost is freed and the door is open`);
    await page.evaluate(() => window.__game.teleport(0, -6.6));
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(1200);
    await page.keyboard.up("KeyW");
    await page.waitForTimeout(2200);
    if (i < ROOMS.length - 1) {
      const after = await state();
      check(after.room === ROOMS[i + 1][0] && after.lit === 0 && !after.freed, `the door leads to ${ROOMS[i + 1][1]}, dark and unsolved`);
    } else {
      check(await page.isVisible("#end"), "the end card shows after the last room");
    }
  }
  await page.evaluate(() => localStorage.setItem("euphoria-haunted-v2", JSON.stringify({ room: 1, found: ["crate"], freed: false })));
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(600);
  const resumed = await state();
  check(resumed.room === "cellar" && resumed.lit === 1, `a reload resumes in the Cellar with one candle lit (room ${resumed.room}, lit ${resumed.lit})`);
  check(errors.length === 0, `no console errors ${errors.slice(0, 3).join(" | ")}`);
  await page.close();
};

const touchSafety = async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await start(page, true);
  let stray = 0;
  for (let run = 0; run < 3; run++) {
    await page.evaluate(() => { window.__game.room(0); window.__game.lightAll(); window.__game.teleport(0, -3.4); });
    await page.waitForTimeout(600);
    await page.tap("#act");
    await page.waitForSelector("#dialog:not([hidden])", { timeout: 6000 });
    // tap low on the screen, where the answers will appear, as fast as a real thumb
    for (let i = 0; i < 14 && (await page.isHidden("#battle")); i++) {
      await page.touchscreen.tap(195, 700 + (i % 3) * 30);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(700);
    const marked = await page.$$eval("#battle .options button.right, #battle .options button.wrong", (b) => b.length);
    const open = await page.$$eval("#battle .options button:not([disabled])", (b) => b.length);
    if (marked > 0 || open === 0) stray++;
    // back to the title for the next run (the intro card only shows the first time)
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector("#start:not([disabled])", { timeout: 15000 });
    await page.tap("#start");
    await page.waitForTimeout(300);
  }
  check(stray === 0, `on a phone, tapping through the ghost's intro never picks an answer (${stray} of 3 runs did)`);
  await ctx.close();
};

/** On a phone, an edge arrow points to the nearest clue that is out of view, and goes once all are found. */
const cluePointer = async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await start(page, true);
  // the far right of the Foyer: on a phone every clue is out of view to the left from here
  await page.evaluate(() => window.__game.teleport(8, 5));
  await page.waitForTimeout(600);
  const box = await page.evaluate(() => {
    const el = document.getElementById("clue-pointer");
    if (!el || el.hidden) return null;
    const r = el.getBoundingClientRect(), hud = document.getElementById("hud").getBoundingClientRect();
    return { l: r.left, t: r.top, r: r.right, b: r.bottom, hudBottom: hud.bottom, left: el.style.transform.includes("rotate(180deg)") };
  });
  check(!!box && box.left, "on a phone, an arrow at the left edge points to clues that are out of view to the left");
  if (box) {
    check(box.l >= 0 && box.r <= 390 && box.t >= box.hudBottom && box.b <= 844 - 100, `the arrow stays on screen, under the HUD and above the thumb controls (${Math.round(box.l)},${Math.round(box.t)})`);
  }
  await page.evaluate(() => window.__game.lightAll());
  await page.waitForTimeout(300);
  check(await page.isHidden("#clue-pointer"), "the arrow goes away once every clue is found");
  await ctx.close();
};

/** A wrong answer makes the ghost lunge at the player and drift back; under reduced motion it stays put. */
const lunge = async (reduce) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: reduce ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  await start(page);
  await page.evaluate(() => { window.__game.lightAll(); window.__game.teleport(0, -3.4); });
  await page.waitForTimeout(500);
  await page.keyboard.press("KeyE");
  await page.waitForSelector("#dialog:not([hidden])", { timeout: 6000 });
  for (let i = 0; i < 12 && (await page.isVisible("#dialog")); i++) {
    await page.keyboard.press("Space");
    await page.waitForTimeout(220);
  }
  await page.waitForSelector("#battle .options button:not([disabled])", { timeout: 5000 });
  const [key, count] = await page.evaluate(() => [window.__game.answerKey()[0], document.querySelectorAll("#battle .options button").length]);
  const home = (await page.evaluate(() => window.__game.state)).ghostHomeZ;
  await page.waitForTimeout(120);
  await page.keyboard.press(String(((key + 1) % count) + 1));
  let peak = 0;
  for (let i = 0; i < 12; i++) {
    peak = Math.max(peak, (await page.evaluate(() => window.__game.state)).ghostZ - home);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(700);
  const rest = Math.abs((await page.evaluate(() => window.__game.state)).ghostZ - home);
  if (reduce) check(peak < 0.01, `under reduced motion the ghost does not lunge (moved ${peak.toFixed(2)})`);
  else check(peak > 0.3 && rest < 0.02, `a wrong answer makes the ghost lunge (${peak.toFixed(2)} units) and return home`);
  await ctx.close();
};

/** Turning a phone sideways while a question is up must keep the whole panel on screen. */
const rotateMidQuestion = async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await start(page, true);
  await page.evaluate(() => { window.__game.lightAll(); window.__game.teleport(0, -3.4); });
  await page.waitForTimeout(600);
  await page.tap("#act");
  await page.waitForSelector("#dialog:not([hidden])", { timeout: 6000 });
  for (let i = 0; i < 14 && (await page.isVisible("#dialog")); i++) {
    await page.tap("#dialog");
    await page.waitForTimeout(260);
  }
  await page.waitForSelector("#battle .options button:not([disabled])", { timeout: 6000 });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(400);
  const top = await page.evaluate(() => document.querySelector("#battle .panel").getBoundingClientRect().top);
  check(top >= 0, `turning a phone sideways mid-question keeps the question on screen (panel top ${Math.round(top)})`);
  await ctx.close();
};

try {
  await playthrough();
  await rotateMidQuestion();
  await touchSafety();
  await cluePointer();
  await lunge(false);
  await lunge(true);
} catch (e) {
  check(false, `the run stopped early: ${e.message.split("\n")[0]}`);
} finally {
  await browser.close();
  await server.close();
}
console.log(failures.length ? `\n${failures.length} check(s) failed` : "\nAll checks passed");
process.exit(failures.length ? 1 : 0);
