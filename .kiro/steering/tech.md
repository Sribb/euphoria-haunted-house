---
inclusion: always
---

# Tech

## Stack

- Vite, React and TypeScript with `strict` on.
- No backend. Progress is saved in `localStorage`. Wrap every read and write in try/catch, because storage can be blocked or empty, and the app must still work without it.
- Deploy on Vercel as a static site.

## Pixel art

- Use the engine in `src/lib/pixel`. Sprites are ASCII rows plus a palette map, compiled to merged SVG rectangles.
- Render with SVG, not canvas, and keep `shape-rendering="crispEdges"` so adjacent rectangles do not show seams.
- The default palette is `HAUNTED_PIXEL_PALETTE` in `src/lib/pixel/haunted-palette.ts`. The page background is `HAUNTED_CANVAS`.
- `PixelSpriteView` defaults to `play="none"`. Turn animation on where it does a job, and the renderer already forces the still frame under reduced motion.

## Testing

- Vitest for unit tests.
- fast-check for property-based tests. Good targets:
  - The mesher covers exactly the non-transparent pixels, with no overlapping rectangles, and each rectangle has one colour.
  - `shade()` never changes a sprite's width, height or transparent pixels.
  - Room progress: a ghost cannot be freed before its question is answered, rooms unlock only in order, and saved progress loads back the same.
- Run the typecheck, the tests and the build before calling any task done.

## Code rules

- Keep every file under 500 lines.
- Do not add a dependency without a clear reason.
- Do not edit the reused files in `src/lib/pixel` without noting the change in the file's header comment and in the README's "Reused from Euphoria" section.
