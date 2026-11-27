"""Shared ghost body for every room's ghost: a dome head, a body that widens, a hem of lobes that trails
into a curl, then toon shading lit from the upper left. Each ghost script adds its own costume and face.
"""
import math

W, H = 30, 32
CX = 14.5


def grid():
    return [["."] * W for _ in range(H)]


def put(g, x, y, c):
    if 0 <= x < W and 0 <= y < H:
        g[y][x] = c


def body_mask(top=7):
    m = [[False] * W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            dx = x - CX
            if top <= y <= 15:
                inside = dx * dx / 8.2 ** 2 + (y - 15) ** 2 / (15 - top + 0.6) ** 2 <= 1
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
    for x, y in [(24, 27), (25, 27), (25, 28), (26, 28), (26, 29), (27, 29), (27, 30), (28, 30), (28, 29), (28, 28)]:
        m[y][x] = True
    return m


def shaded(base, shadow, light, outline, top=7):
    """The ghost's body, outlined and shaded, with cloth folds rising from the hem."""
    m = body_mask(top)
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
                g[y][x] = shadow
    return g


def ts_rows(name, rs):
    return f"const {name} = [\n" + "\n".join(f'  "{r}",' for r in rs) + "\n];\n"
