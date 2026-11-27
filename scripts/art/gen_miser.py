"""Generates src/art/miser.ts: the Foyer's ghost, the Miser, in three moods. 30 x 32.

Usage (from the repo root): ~/video-project/.audio-venv/bin/python scripts/art/gen_miser.py
Every sprite goes through the fixer (scripts/art/fixer.py) before it is written.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from fixer import ROOT, polish  # noqa: E402

FIXES = []
W, H = 30, 32
CX = 14.5


def grid():
    return [["."] * W for _ in range(H)]


def put(g, x, y, c):
    if 0 <= x < W and 0 <= y < H:
        g[y][x] = c


def body_mask():
    """Head dome under the hat, a body that widens, and a hem of lobes that curls into a wisp on the right."""
    m = [[False] * W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            dx = x - CX
            if 7 <= y <= 15:
                inside = dx * dx / 8.2 ** 2 + (y - 15) ** 2 / 8.6 ** 2 <= 1
            elif 15 < y <= 24:
                inside = abs(dx) <= 8.2 + (y - 15) * 0.28
            elif 24 < y <= 30:
                half = 8.2 + 9 * 0.28
                inside = False
                if abs(dx) <= half:
                    lobe = 2 * half / 4
                    t = (dx + half) / lobe
                    frac = t - math.floor(t)
                    depth = 4.6 * math.sqrt(max(0.0, 1 - ((frac - 0.5) / 0.5) ** 2))
                    inside = (y - 24) <= depth
            else:
                inside = False
            m[y][x] = inside
    # the wisp: the hem trails off to the right into a curl
    for x, y in [(24, 27), (25, 27), (25, 28), (26, 28), (26, 29), (27, 29), (27, 30), (28, 30), (28, 29), (28, 28)]:
        m[y][x] = True
    return m


def ghost(base, shadow, light, outline, eye, bag=True):
    m = body_mask()
    g = grid()
    out = lambda x, y: not (0 <= x < W and 0 <= y < H) or not m[y][x]
    for y in range(H):
        for x in range(W):
            if not m[y][x]:
                continue
            if out(x - 1, y) or out(x + 1, y) or out(x, y - 1) or out(x, y + 1):
                g[y][x] = outline
            elif out(x + 2, y) or out(x, y + 2) or (x - CX) + (y - 18) * 0.4 > 6.5:
                g[y][x] = shadow
            elif (x - 9.5) ** 2 + (y - 11) ** 2 <= 5 or (out(x - 2, y) and y <= 20):
                g[y][x] = light
            else:
                g[y][x] = base
    for y in range(20, 25):
        for x in (8, 20):
            if g[y][x] == base:
                g[y][x] = shadow   # cloth folds

    # top hat: crown, blood-red band, brim
    for y in range(0, 6):
        for x in range(9, 21):
            g[y][x] = "K" if x in (9, 20) or y == 0 else ("k" if x > 16 else "D")
    for x in range(9, 21):
        g[4][x] = "I"
        g[5][x] = "r"
    for x in range(10, 14):
        g[1][x] = "X"           # a dull shine on the crown
    for x in range(6, 24):
        g[6][x] = "K"
        g[7][x] = "k" if 7 <= x <= 22 else "K"

    # face: heavy brows, one eye behind a gold monocle, a long drooping mustache
    for x, y in [(9, 10), (10, 10), (11, 11), (18, 11), (19, 10), (20, 10)]:
        put(g, x, y, "K")
    for x, y in [(10, 12), (11, 12), (10, 13), (11, 13), (18, 12), (19, 12), (18, 13), (19, 13)]:
        put(g, x, y, eye)
    for x, y in [(9, 11), (12, 11), (8, 12), (13, 12), (8, 13), (13, 13), (9, 14), (12, 14), (10, 11), (11, 11), (10, 14), (11, 14)]:
        if g[y][x] not in (eye, "K"):
            put(g, x, y, "G")   # the monocle's ring
    put(g, 10, 11, "y")
    for x, y in [(12, 15), (12, 16), (13, 17), (13, 18), (14, 19)]:
        put(g, x, y, "g")       # its chain
    for x, y in [(13, 15), (14, 15), (15, 15), (16, 15), (12, 16), (13, 16), (16, 16), (17, 16), (11, 17), (17, 17), (18, 18)]:
        put(g, x, y, "w")       # mustache
    put(g, 14, 16, "K"); put(g, 15, 16, "K")

    if bag:
        # a stubby arm clutching a money bag
        for x, y in [(22, 17), (23, 17), (23, 18), (24, 18)]:
            put(g, x, y, base)
        bag_px = []
        for y in range(16, 25):
            for x in range(23, 30):
                dx, dy = x - 26, y - 21
                if dx * dx / 3.2 ** 2 + dy * dy / 3.6 ** 2 <= 1:
                    bag_px.append((x, y))
        for x, y in bag_px:
            put(g, x, y, "g")
        for x, y in bag_px:
            if (x + 1, y) not in bag_px or (x, y + 1) not in bag_px:
                put(g, x, y, "O")
            elif (x - 1, y) not in bag_px:
                put(g, x, y, "G")
        for x, y in [(25, 16), (26, 16), (27, 16), (26, 15)]:
            put(g, x, y, "O")   # the tied neck
        for x, y in [(26, 19), (25, 20), (26, 21), (27, 22), (26, 23), (26, 20), (26, 22)]:
            put(g, x, y, "y")   # a $ on the bag
    return ["".join(r) for r in g]


restless = ghost("x", "X", "w", "I", "R")
calm = ghost("Q", "q", "W", "E", "K")
freed = ghost("W", "Q", "W", "T", "K", bag=False)
# freed: eyes closed in a smile instead of open
freed = [list(r) for r in freed]
for x, y in [(10, 12), (11, 12), (10, 13), (11, 13), (18, 12), (19, 12), (18, 13), (19, 13)]:
    freed[y][x] = "W"
for x, y in [(9, 13), (10, 12), (11, 12), (12, 13), (17, 13), (18, 12), (19, 12), (20, 13)]:
    freed[y][x] = "K"
freed = ["".join(r) for r in freed]
for r in restless + calm + freed:
    assert len(r) == W
restless, calm, freed = (polish(m, report=FIXES) for m in (restless, calm, freed))


def ts(name, rs):
    return f"const {name} = [\n" + "\n".join(f'  "{r}",' for r in rs) + "\n];\n"


src = f'''import {{ s, shade }} from "../lib/pixel/helpers";

/**
 * The Miser, the ghost who haunts the Foyer. He hid his money in a drawer for thirty years and watched
 * it buy less and less. Top hat, gold monocle on a chain, drooping mustache, and a money bag he will
 * not let go of until he is freed. 30 x 32, three moods that swap in place. Generated as rows, then kept
 * as plain text like every other sprite.
 */

{ts("RESTLESS", restless)}
{ts("CALM", calm)}
{ts("FREED", freed)}
const GLOW = shade(FREED, {{ T: "W", Q: "T" }});

export const miserRestless = s("miser-restless", "The Miser, restless", ["ghost", "boss"], "Grey, red-eyed, clutching his money bag.", RESTLESS);
export const miserCalm = s("miser-calm", "The Miser, calm", ["ghost", "boss"], "Lavender, after a right answer.", CALM);
export const miserFreed = s("miser-freed", "The Miser, freed", ["ghost", "boss"], "The bag is gone and he is smiling. Play once.", FREED, {{
  frameMs: 110,
  frames: [FREED, GLOW, FREED, GLOW, FREED],
}});

export const MISER_SPRITES = [miserRestless, miserCalm, miserFreed];
'''
(ROOT / "src/art/miser.ts").write_text(src)
print("fixer: grid ok on", sum(g for g, _ in FIXES), "of", len(FIXES), "moods; pixels changed:", [c for _, c in FIXES])
