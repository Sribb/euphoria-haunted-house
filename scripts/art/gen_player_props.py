"""Generates src/art/player.ts and src/art/props.ts as ASCII sprite rows.

Usage (from the repo root): ~/video-project/.audio-venv/bin/python scripts/art/gen_player_props.py
Every sprite goes through the fixer (scripts/art/fixer.py) before it is written.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from fixer import ROOT, polish  # noqa: E402

FIXES = []


def grid(w, h, fill="."):
    return [[fill] * w for _ in range(h)]


def put(g, x, y, c):
    if 0 <= y < len(g) and 0 <= x < len(g[0]):
        g[y][x] = c


def rect(g, x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            put(g, x, y, c)


def rows(g):
    out = ["".join(r) for r in g]
    assert len({len(r) for r in out}) == 1
    return out


def outline(g, colour_for):
    """Adds a 1px outline OUTSIDE the drawn shape, coloured by the neighbouring pixel's family."""
    h, w = len(g), len(g[0])
    src = [r[:] for r in g]
    for y in range(h):
        for x in range(w):
            if src[y][x] != ".":
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and src[ny][nx] != ".":
                    c = colour_for(src[ny][nx])
                    if c:
                        g[y][x] = c
                        break
    return g


# ------------------------------------------------------------------ player
# A kid in an orchid hoodie with a lantern. 16 wide x 24 tall, drawn inside a 14x22 area then outlined.
# Palette: hair A/a, skin S/M (outline j), hoodie P/p/q (outline E), jeans b/B (outline D), shoes X/w,
# lantern O frame, y glass, 5 core.

PW, PH = 16, 24


def player_outline(c):
    return {"A": "a", "a": "a", "S": "j", "M": "j", "P": "E", "p": "E", "q": "E", "w": "D",
            "b": "D", "B": "D", "X": "D", "O": "1", "y": "1", "5": "1", "K": None, "F": "j"}.get(c, "D")


def legs(g, phase, facing):
    """phase: 0 = standing, 1 = left foot forward, 2 = right foot forward."""
    if facing == "side":
        # side stride: front and back leg
        spots = {0: [(6, 7), (8, 9)], 1: [(4, 5), (9, 10)], 2: [(6, 7), (8, 9)]}[phase]
        if phase == 2:
            spots = [(8, 9), (5, 6)]
        for i, (a, b) in enumerate(spots):
            rect(g, a, 18, b, 20, "b" if i == 0 else "B")
            rect(g, a, 21, b, 21, "X")
        return
    lift_l = 1 if phase == 2 else 0
    lift_r = 1 if phase == 1 else 0
    rect(g, 5, 18, 7, 20 - lift_l, "b")
    rect(g, 8, 18, 10, 20 - lift_r, "B" if facing == "down" else "b")
    rect(g, 5, 21 - lift_l, 7, 21 - lift_l, "X")
    rect(g, 8, 21 - lift_r, 10, 21 - lift_r, "X")
    put(g, 5, 21 - lift_l, "w")
    put(g, 8, 21 - lift_r, "w")


def lantern(g, x, y):
    put(g, x + 1, y, "O")           # handle
    rect(g, x, y + 1, x + 2, y + 1, "O")
    rect(g, x, y + 2, x + 2, y + 3, "y")
    put(g, x + 1, y + 2, "5")
    rect(g, x, y + 4, x + 2, y + 4, "O")


def player_front(phase, bob):
    g = grid(PW, PH)
    o = bob  # body drops 1px on passing frames
    # hair cap
    rect(g, 4, 1 + o, 11, 2 + o, "A")
    rect(g, 3, 3 + o, 12, 6 + o, "A")
    for x in (4, 6, 9, 11):
        put(g, x, 6 + o, "a")
    # face
    rect(g, 4, 6 + o, 11, 11 + o, "S")
    rect(g, 4, 6 + o, 11, 6 + o, "A")   # fringe
    put(g, 6, 7 + o, "A"); put(g, 9, 7 + o, "A")
    rect(g, 11, 7 + o, 11, 11 + o, "M")
    rect(g, 4, 11 + o, 11, 11 + o, "M")
    rect(g, 3, 7 + o, 3, 9 + o, "a"); rect(g, 12, 7 + o, 12, 9 + o, "a")
    for x in (5, 10):
        put(g, x, 8 + o, "K"); put(g, x, 9 + o, "K")
    put(g, 5, 8 + o, "W"); put(g, 10, 8 + o, "W")
    put(g, 4, 10 + o, "F"); put(g, 11, 10 + o, "F")
    put(g, 7, 10 + o, "j"); put(g, 8, 10 + o, "j")
    # hoodie
    rect(g, 4, 12 + o, 11, 17, "P")
    rect(g, 10, 12 + o, 11, 17, "p")
    rect(g, 4, 12 + o, 5, 14 + o, "q")
    put(g, 6, 13 + o, "w"); put(g, 9, 13 + o, "w")
    rect(g, 5, 16, 10, 16, "p")
    # arms: left arm (screen left) holds the lantern
    sw = {0: 0, 1: 1, 2: -1}[phase]
    rect(g, 3, 12 + o, 3, 15 + o, "P"); put(g, 3, 16 + o, "S")
    rect(g, 12, 12 + o, 12, 15 + o + max(0, -sw), "p"); put(g, 12, 16 + o + max(0, -sw), "S")
    lantern(g, 1, 16 + o + max(0, sw))
    legs(g, phase, "down")
    return outline(g, player_outline)


def player_back(phase, bob):
    g = grid(PW, PH)
    o = bob
    rect(g, 4, 1 + o, 11, 2 + o, "A")
    rect(g, 3, 3 + o, 12, 10 + o, "A")
    rect(g, 4, 10 + o, 11, 11 + o, "a")
    rect(g, 10, 3 + o, 12, 10 + o, "a")
    put(g, 6, 3 + o, "M")                    # a lighter strand catches the light
    # hood down on the back
    rect(g, 4, 12 + o, 11, 17, "P")
    rect(g, 5, 12 + o, 10, 14 + o, "p")
    rect(g, 10, 12 + o, 11, 17, "p")
    sw = {0: 0, 1: -1, 2: 1}[phase]
    rect(g, 3, 12 + o, 3, 15 + o + max(0, -sw), "P"); put(g, 3, 16 + o + max(0, -sw), "S")
    rect(g, 12, 12 + o, 12, 15 + o, "p"); put(g, 12, 16 + o, "S")
    lantern(g, 12, 16 + o + max(0, sw))
    legs(g, phase, "up")
    return outline(g, player_outline)


def player_side(phase, bob):
    """Facing right. Left is the mirror."""
    g = grid(PW, PH)
    o = bob
    rect(g, 4, 1 + o, 10, 2 + o, "A")
    rect(g, 3, 3 + o, 11, 6 + o, "A")
    rect(g, 3, 6 + o, 6, 10 + o, "A")       # hair at the back of the head
    rect(g, 3, 7 + o, 4, 10 + o, "a")
    rect(g, 7, 6 + o, 11, 11 + o, "S")       # face toward the right
    rect(g, 7, 6 + o, 11, 6 + o, "A")
    put(g, 12, 9 + o, "S")                   # nose
    rect(g, 7, 11 + o, 11, 11 + o, "M")
    put(g, 6, 11 + o, "M")
    put(g, 10, 8 + o, "K"); put(g, 10, 9 + o, "K"); put(g, 10, 8 + o, "W")
    put(g, 11, 10 + o, "F")
    put(g, 7, 8 + o, "M")                    # ear
    rect(g, 5, 12 + o, 10, 17, "P")
    rect(g, 5, 12 + o, 6, 17, "p")           # back of the hoodie in shade
    rect(g, 4, 12 + o, 4, 14 + o, "p")       # hood bunched at the neck
    # the near arm reaches forward holding the lantern out
    sw = {0: 0, 1: 1, 2: -1}[phase]
    rect(g, 8, 13 + o, 10, 13 + o, "q")
    rect(g, 11, 13 + o, 11, 14 + o, "P")
    put(g, 11, 15 + o, "S")
    lantern(g, 11, 15 + o + max(0, sw))
    legs(g, phase, "side")
    return outline(g, player_outline)


def mirror(rs):
    return ["".join(reversed(r)) for r in rs]


PLAYER_PALETTE = {"S": "#F4CBA4", "M": "#D6A87C", "j": "#9A6638", "A": "#6B3A1F", "a": "#3D2618"}


def fixed(rs, **kw):
    # no moon rim on the player: they carry a warm lantern, and a cold rim turned the hair's edge grey
    return polish(rs, PLAYER_PALETTE, report=FIXES, rim=False, **kw)


def player_sets():
    sets = {}
    for name, fn in (("down", player_front), ("up", player_back), ("right", player_side)):
        idle = fixed(rows(fn(0, 0)))
        walk = [fixed(rows(fn(1, 0))), fixed(rows(fn(0, 1))), fixed(rows(fn(2, 0))), fixed(rows(fn(0, 1)))]
        sets[name] = (idle, walk)
    sets["left"] = (mirror(sets["right"][0]), [mirror(f) for f in sets["right"][1]])
    return sets


# ------------------------------------------------------------------ props


def portrait_own():
    """A pie with one slice pulled out: owning a piece of a business."""
    g = grid(16, 20, "k")
    cx, cy, r = 7.5, 10.0, 6.0
    for y in range(20):
        for x in range(16):
            dx, dy = x - cx, y - cy
            d = math.hypot(dx, dy)
            ang = math.degrees(math.atan2(-dy, dx))
            in_slice = -25 <= ang <= 35
            if in_slice:
                sx, sy = x - 1.4, y + 1.2      # the slice sits pulled out up and right
                d2 = math.hypot(sx - cx, sy - cy)
                if d2 <= r:
                    put(g, x, y, "G" if d2 < r - 1 else "O")
                continue
            if d <= r:
                put(g, x, y, "P" if d < r - 1 else "E")
    # shade the pie's lower right, highlight the slice
    for y in range(20):
        for x in range(16):
            if g[y][x] == "P" and (x - cx) + (y - cy) > 4:
                g[y][x] = "p"
            if g[y][x] == "G" and (x - cx) + (cy - y) > 7:
                g[y][x] = "y"
    return rows(g)


PORTRAIT_LEND = [
    "kkkkkkkkkkkkkkkk",
    "kkkkkkkkkkkkkkkk",
    "kkXXXXXXXXXXXXkk",
    "kXwwwwwwwwwwwwXk",
    "kkXXXXXXXXXXXXkk",
    "kkkwwwwwwwwwwkkk",
    "kkkwxxxxxxxxwkkk",
    "kkkwwwwwwwwwwkkk",
    "kkkwxxxxxxwwwkkk",
    "kkkwwwwwwwwwwkkk",
    "kkkwxxxxxxxxwkkk",
    "kkkwwwwwwwwwwkkk",
    "kkkwxxxxwwwwwkkk",
    "kkkwwwwwwwrRrkkk",
    "kkkwwwwwwrRRRrkk",
    "kkXXXXXXXXrRrXkk",
    "kXwwwwwwwwwwwwXk",
    "kkXXXXXXXXXXXXkk",
    "kkkkkkkkkkkkkkkk",
    "kkkkkkkkkkkkkkkk",
]


def clock_face():
    g = grid(14, 14)
    c = 6.5
    for y in range(14):
        for x in range(14):
            d = math.hypot(x - c, y - c)
            if d <= 6.6:
                put(g, x, y, "O" if d > 5.6 else ("w" if d < 4.6 else "x"))
    for x, y in ((6, 1), (7, 1), (12, 6), (12, 7), (6, 12), (7, 12), (1, 6), (1, 7)):
        put(g, x, y, "G")                          # hour marks on the brass ring
    for y in range(3, 7):
        put(g, 6, y, "K")                          # minute hand, nearly midnight
    put(g, 7, 7, "K"); put(g, 8, 8, "K")           # hour hand
    put(g, 6, 7, "r")
    return rows(g)


def door_seal():
    """A glowing ward over the doorway, 28 x 40. Rings, runes and two crossed chains."""
    w, h = 28, 40
    g = grid(w, h)
    cx, cy = 13.5, 17.5
    for y in range(h):
        for x in range(w):
            d = math.hypot(x - cx, (y - cy) * 0.9)
            if 10.2 <= d <= 11.2:
                put(g, x, y, "R")
            elif 7.0 <= d <= 7.8:
                put(g, x, y, "f")
            elif d <= 2.2:
                put(g, x, y, "s")
    for k in range(8):                              # runes on the outer ring
        a = k * math.pi / 4 + 0.2
        x, y = round(cx + 8.9 * math.cos(a)), round(cy + 8.9 * math.sin(a) / 0.9)
        put(g, x, y, "F"); put(g, x, y - 1, "F")
    for t in range(-14, 15):                        # two chains crossing the door
        for sgn in (1, -1):
            x, y = round(cx + t * 0.95), round(cy + sgn * t * 1.2)
            put(g, x, y, "X" if t % 2 else "x")
    return rows(g)


SMALL_FLAME = [
    [".....", "..2..", "..3..", ".232.", ".343.", ".454.", "..4.."],
    ["...2.", "..3..", ".23..", ".232.", ".343.", ".454.", "..4.."],
    [".....", ".....", "..2..", ".232.", ".343.", ".454.", "..4.."],
    [".2...", "..3..", "..32.", ".232.", ".343.", ".454.", "..4.."],
]

WISP = [
    ["..T..", ".TWT.", "TWWWT", ".TWT.", "..T.."],
    [".....", "..T..", ".TWT.", "..T..", "....."],
    [".....", ".....", "..W..", ".....", "....."],
    [".....", "..T..", ".TWT.", "..T..", "....."],
]

# The marker that floats over a clue in the 3D rooms: 9 x 9 with a halo, and it never shrinks to a dot.
CLUE_WISP = [
    ["....t....", "....T....", "...tTt...", "..tTWTt..", "tTTWWWTTt", "..tTWTt..", "...tTt...", "....T....", "....t...."],
    [".........", "....t....", "....T....", "...TWT...", ".tTWWWTt.", "...TWT...", "....T....", "....t....", "........."],
    [".........", ".........", "...tTt...", "..tTWTt..", "..TWWWT..", "..tTWTt..", "...tTt...", ".........", "........."],
    [".........", "....t....", "....T....", "...TWT...", ".tTWWWTt.", "...TWT...", "....T....", "....t....", "........."],
]


def ts_rows(name, rs, indent=""):
    body = "\n".join(f'{indent}  "{r}",' for r in rs)
    return f"{indent}[\n{body}\n{indent}]" if not name else f"const {name} = [\n{body}\n];\n"


def ts_frames(frames):
    return "[\n" + ",\n".join(ts_rows("", f, "  ") for f in frames) + ",\n]"


sets = player_sets()
player_ts = ['''import type { PixelSprite } from "../lib/pixel/types";

/** Skin and hair. The 3D composite also snaps to these, so the game imports them. */
export const PLAYER_COLORS: Record<string, string> = {
  S: "#F4CBA4", // skin
  M: "#D6A87C", // skin shadow
  j: "#9A6638", // skin outline
  A: "#6B3A1F", // hair
  a: "#3D2618", // hair shadow
};

/**
 * The player: a kid in an orchid hoodie carrying a lantern. 16x24, four facings, each with an idle frame
 * and a four-frame walk (stride, pass, stride, pass). Left is the right-facing art mirrored.
 * Generated as rows, then kept as plain text like every other sprite.
 */

export type Facing = "down" | "up" | "left" | "right";
''']
for name, (idle, walk) in sets.items():
    if name == "left":
        continue  # mirrored from the right-facing art at load time
    player_ts.append(f"const {name.upper()}_IDLE = " + ts_rows("", idle) + ";\n")
    player_ts.append(f"const {name.upper()}_WALK = " + ts_frames(walk) + ";\n")
player_ts.append('''
/** Left-facing art is the right-facing art flipped, so it is computed rather than stored. */
const mirror = (rows: string[]) => rows.map((r) => [...r].reverse().join(""));
const LEFT_IDLE = mirror(RIGHT_IDLE);
const LEFT_WALK = RIGHT_WALK.map(mirror);

const make = (facing: Facing, rows: string[], frames: string[][]): PixelSprite => ({
  id: `player-${facing}`,
  name: `Player facing ${facing}`,
  tags: ["player", "character"],
  palette: PLAYER_COLORS,
  rows,
  frames,
  frameMs: 120,
});

export const PLAYER_SPRITES: Record<Facing, PixelSprite> = {
  down: make("down", DOWN_IDLE, DOWN_WALK),
  up: make("up", UP_IDLE, UP_WALK),
  left: make("left", LEFT_IDLE, LEFT_WALK),
  right: make("right", RIGHT_IDLE, RIGHT_WALK),
};
''')
(ROOT / "src/art/player.ts").write_text("\n".join(player_ts))

props_ts = f'''import {{ s }} from "../lib/pixel/helpers";

/**
 * Small art for the 3D Foyer: the two portraits, the clock face, the door's ward, a candle flame sized
 * for 3D candles, and the wisp that marks a clue you have not found yet.
 * Generated as rows, then kept as plain text like every other sprite.
 */

export const portraitOwn = s("portrait-own", "Portrait: Own", ["foyer", "clue"], "A pie with one slice pulled out. Owning a piece of a business.", {ts_rows("", polish(portrait_own(), rim=False, report=FIXES))});

export const portraitLend = s("portrait-lend", "Portrait: Lend", ["foyer", "clue"], "A sealed IOU scroll. Lending money for interest.", {ts_rows("", polish(PORTRAIT_LEND, rim=False, report=FIXES))});

export const clockFace = s("clock-face", "Clock face", ["foyer", "clue"], "The grandfather clock, stopped just before midnight.", {ts_rows("", polish(clock_face(), rim=False, report=FIXES))});

export const doorSeal = s("door-seal", "Door ward", ["foyer", "door"], "The glowing ward that seals the doorway until the ghost is freed.", {ts_rows("", door_seal())});

const FLAME = {ts_frames(SMALL_FLAME)};
export const smallFlame = s("small-flame", "Small flame", ["candle"], "A candle flame for 3D candles. Loop it.", FLAME[0], {{ frameMs: 140, frames: FLAME }});

const WISP_FRAMES = {ts_frames(WISP)};
export const wisp = s("wisp", "Clue wisp", ["clue", "hint"], "Floats over a clue you have not found yet.", WISP_FRAMES[0], {{ frameMs: 160, frames: WISP_FRAMES }});

const CLUE_WISP_FRAMES = {ts_frames(CLUE_WISP)};
export const clueWisp = s("clue-wisp", "Clue wisp, large", ["clue", "hint"], "The 3D marker over a clue you have not found yet. Loop it.", CLUE_WISP_FRAMES[0], {{ frameMs: 170, frames: CLUE_WISP_FRAMES }});

export const PROP_SPRITES = [portraitOwn, portraitLend, clockFace, doorSeal, smallFlame, wisp, clueWisp];
'''
(ROOT / "src/art/props.ts").write_text(props_ts)
print("wrote player.ts and props.ts")
print("fixer: grid ok on", sum(g for g, _ in FIXES), "of", len(FIXES), "frames; pixels changed:", sum(c for _, c in FIXES))
