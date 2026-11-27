---
inclusion: fileMatch
fileMatchPattern: "src/art/**/*"
---

# Drawing pixel art for this engine

These rules come from mistakes made while drawing Euphoria's sprites. Follow them for every new sprite.

## The format

- A sprite is `rows` (one string per row, one character per pixel) plus palette keys. `.` is transparent.
- Width and height come from `rows`. Every row must be the same length. A miscounted row is the most common bug, and the compiler reports the exact row.
- Ramps: lowercase is the dark step, uppercase the base, and the third letter the light step. For example `p` `P` `q` `Q` is the spectral violet ramp.

## Outlines on the dark canvas

- Never outline with `K` or `k`. Near-black on the near-black canvas is invisible, and thin shapes dissolve.
- Outline with the deep steps: `O` candle, `E` violet, `D` fog, `I` blood rose.
- `K` and `k` are for interior detail only, such as pupils.

## Check before you wire it in

- Look at every new sprite at 96px and at 24px before using it in a screen. Some shapes only fail at one size.
- A blob with a tail reads as a speech bubble. Keep tails thin and offset. This matters for ghosts.
- Parts that belong together must touch. A gap makes them read as two floating objects.
- A growing or rising frame needs at least three rows, or it reads as a dotted line.

## Animation

- `rows` is the still frame. It is used under reduced motion and as the resting state. `frames` is the full sequence and every frame matches the still's size.
- Build frames with `shade(rows, swap)` for lighting changes (a candle flicker) and `withRows(rows, overrides)` when only some rows move (a ghost's tail). Write a frame out by hand only when neither helper can express it.
- Animate only where it does a job, such as showing progress or a reaction. No idle loops on everything.
