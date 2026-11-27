"""The pixel-art fixer, run over every generated sprite before it is written to src/art.

`_period`, `true_res`, `palettize`, `despeckle` and `rim_light` are copied from Sriyan's Tiny Why toolkit
(video-project channel/scripts/art/pixelpaint.py, November 2026; see "Reused" in the README). `polish()` is new:
it chains them for small game sprites.

    polish(rows, palette) -> rows

1. Grid check: the sprite is upscaled 8x and `true_res` must recover an 8 px grid and the identical image.
   This is the AI-art intake step; for code-drawn art it proves every pixel sits on the grid.
2. Despeckle: lone pixels with no same-coloured neighbour are removed, except protected accents (eyes,
   catchlights, glows) that are meant to be single pixels.
3. Rim light: the silhouette edge facing the moon (upper left) blends toward moonlight, so the outline is
   lighter on the lit side and darker on the shadow side (a "selective outline").
4. Palettize: every colour snaps back to the sprite's own palette keys, so the result stays plain ASCII rows.

Needs numpy, Pillow and scipy (Tiny Why's .audio-venv has them).
"""
import re
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]


def haunted_palette():
    """The haunted palette, read from the TypeScript source so the two can never disagree."""
    src = (ROOT / "src/lib/pixel/haunted-palette.ts").read_text()
    body = src[src.index("HAUNTED_PIXEL_PALETTE"):]
    return {k: v.upper() for k, v in re.findall(r'^\s*"?([^\s":]+)"?:\s*"(#[0-9A-Fa-f]{6})"', body, re.M)}


MOON = (143, 184, 240)  # B, moonlight


# ---- copied from pixelpaint.py ------------------------------------------------------------------------------------

def _period(profile, lo=2.0, hi=24.0):
    p = profile - profile.mean()
    n = len(p)
    spec = np.abs(np.fft.rfft(p * np.hanning(n)))
    freqs = np.fft.rfftfreq(n)
    ok = (freqs > 1 / hi) & (freqs < 1 / lo)
    k = np.argmax(np.where(ok, spec, 0))
    if 0 < k < len(spec) - 1:
        a, b, c = spec[k - 1], spec[k], spec[k + 1]
        k = k + 0.5 * (a - c) / (a - 2 * b + c + 1e-12)
    period = n / (k * 1.0) if k else lo
    xs = np.arange(n)
    phase = np.angle((p * np.exp(-2j * np.pi * xs / period)).sum())
    offset = (phase / (2 * np.pi)) * period % period
    return period, offset


def true_res(im, alpha_threshold=128):
    """Recover the true pixel grid of a pixel-art-style RGBA image (pixelpaint.true_res, minus the palette cap)."""
    a = np.array(im.convert("RGBA")).astype(float)
    lum = a[..., :3] @ np.array([0.3, 0.59, 0.11])
    px, ox = _period(np.abs(np.diff(lum, axis=1)).sum(0))
    py, oy = _period(np.abs(np.diff(lum, axis=0)).sum(1))
    cols = int(round((a.shape[1] - ox) / px))
    rows = int(round((a.shape[0] - oy) / py))
    out = np.zeros((rows, cols, 3), np.uint8)
    alpha = np.zeros((rows, cols), bool)
    for j in range(rows):
        y0, y1 = int(oy + j * py + py * 0.25), int(oy + (j + 1) * py - py * 0.25) + 1
        for i in range(cols):
            x0, x1 = int(ox + i * px + px * 0.25), int(ox + (i + 1) * px - px * 0.25) + 1
            cell = a[y0:y1, x0:x1].reshape(-1, 4)
            if not len(cell):
                continue
            solid = cell[cell[:, 3] >= alpha_threshold]
            if len(solid) * 2 < len(cell):
                continue
            out[j, i] = np.median(solid[:, :3], axis=0)
            alpha[j, i] = True
    return out, alpha, (px, py)


def palettize(rgb, palette):
    flat = rgb.reshape(-1, 3).astype(float)
    pal = np.asarray(palette, float)
    w = np.array([0.3, 0.59, 0.11])
    d = (((flat[:, None, :] - pal[None, :, :]) ** 2) * w).sum(-1)
    return pal[d.argmin(1)].astype(np.uint8).reshape(rgb.shape)


def despeckle(rgb, alpha=None):
    out = rgb.copy()
    key = rgb[..., 0].astype(np.int64) << 16 | rgb[..., 1].astype(np.int64) << 8 | rgb[..., 2]
    same = np.zeros(key.shape, int)
    for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        same += np.roll(np.roll(key, dy, 0), dx, 1) == key
    lone = same == 0
    if alpha is not None:
        lone &= alpha
    below = np.roll(rgb, -1, 0)
    out[lone] = below[lone]
    return out


def rim_light(rgb, mask, toward, color, width=1, strength=1.0):
    h, w = mask.shape
    yy, xx = np.mgrid[0:h, 0:w]
    out = rgb.copy()
    inner = mask.copy()
    for _ in range(width):
        inner = ndimage.binary_erosion(inner)
    edge = mask & ~inner
    sm = ndimage.gaussian_filter(mask.astype(float), 2)
    gy, gx = np.gradient(sm)
    lx, ly = toward[0] - xx, toward[1] - yy
    facing = (-gx * lx - gy * ly) / (np.hypot(gx, gy) * np.hypot(lx, ly) + 1e-9)
    lit = edge & (facing > 0.25)
    out[lit] = (out[lit] * (1 - strength) + np.asarray(color) * strength).astype(np.uint8)
    return out


# ---- new: the chain for game sprites ------------------------------------------------------------------------------

def _hex(c):
    return tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))


def polish(rows, palette=None, *, rim=True, protect="KWRy5wF", strength=0.55, report=None):
    """Run the fixer over one sprite frame and return new ASCII rows in the same palette keys."""
    full = {**haunted_palette(), **{k: v.upper() for k, v in (palette or {}).items()}}
    h, w = len(rows), len(rows[0])
    alpha = np.array([[c != "." for c in r] for r in rows])
    rgb = np.zeros((h, w, 3), np.uint8)
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c != ".":
                rgb[y, x] = _hex(full[c])

    # 1. grid check through true_res on an 8x upscale
    im = Image.fromarray(np.dstack([rgb, alpha.astype(np.uint8) * 255]), "RGBA").resize((w * 8, h * 8), Image.NEAREST)
    back, back_alpha, (px, py) = true_res(Image.alpha_composite(Image.new("RGBA", im.size, (7, 5, 12, 255)), im))
    grid_ok = abs(px - 8) < 0.5 and abs(py - 8) < 0.5

    # 2. despeckle, keeping protected accents
    out = despeckle(rgb, alpha)
    accents = np.array([[c in protect for c in r] for r in rows])
    out[accents] = rgb[accents]

    # 3. moonlit selective outline
    if rim:
        out = rim_light(out, alpha, toward=(-w, -h), color=MOON, width=1, strength=strength)

    # 4. back to the sprite's own keys
    used = {c for r in rows for c in r if c != "."}
    keys = sorted(used | ({"B", "x", "D"} if rim else set()))
    pal = np.array([_hex(full[k]) for k in keys])
    snapped = palettize(out, pal)
    lookup = {tuple(_hex(full[k])): k for k in reversed(keys)}
    new_rows = ["".join(lookup[tuple(snapped[y, x])] if alpha[y, x] else "." for x in range(w)) for y in range(h)]
    if report is not None:
        changed = sum(a != b for r0, r1 in zip(rows, new_rows) for a, b in zip(r0, r1))
        report.append((grid_ok, changed))
    return new_rows
