---
inclusion: always
---

# Tech

## Stack

- Vite and TypeScript with `strict` on, and three.js for the 3D rooms. The game does not use React. (`@types/react` is installed only so the reused `PixelSprite.tsx` typechecks.)
- No backend. Progress is saved in `localStorage`. Wrap every read and write in try/catch, because storage can be blocked or empty, and the game must still work without it.
- Deploy on Vercel as a static site.

## How a room is drawn

- `src/game/pipeline.ts` renders the 3D scene at a low resolution with toon materials, then a composite pass adds outlines, snaps every pixel to `SCENE_PALETTE` (in `src/game/look.ts`), and adds fog. The canvas is scaled up by a whole number.
- The camera is orthographic, tilted to the 3-4-5 angle in `look.ts` (`SIN_P`, `COS_P`), and snapped to the pixel grid, with the leftover fraction applied as a canvas offset. Do not change the angle without changing `worldUV`.
- Build room geometry with `box()` from `look.ts`. It gives world-space UVs, so textures show one texel per screen pixel. Put feature heights on whole screen pixels (multiples of `1 / (UNIT_PX * COS_P)`).
- Characters, flames and wisps are 2D sprites from the pixel engine, shown as `Billboard`s that face the camera and snap to pixels. Mark flames, sparkles and soft shadows `noInfo` so they get no outline.
- three.js divides ambient and directional light by pi. Light values that look large (ambient 2.3, moon 5.5) are correct.
- Anything far behind the back wall can peek over its top at this camera angle. Keep things behind the wall low and close.
- Keep every pixel in the scene palette. If a lit colour snaps to an odd hue (gold turning mint green), lower the light or take the stray colour out of `SCENE_PALETTE`.

## Pixel art

- Use the engine in `src/lib/pixel`. Sprites are ASCII rows plus a palette map.
- The default palette is `HAUNTED_PIXEL_PALETTE` in `src/lib/pixel/haunted-palette.ts`.
- Respect reduced motion everywhere: billboards show their still frame, and shake, flicker and flashes are off.

## Testing

- Vitest for unit tests.
- fast-check for property-based tests. Good targets:
  - The mesher covers exactly the non-transparent pixels, with no overlapping rectangles, and each rectangle has one colour.
  - `shade()` never changes a sprite's width, height or transparent pixels.
  - Room progress: a ghost cannot be faced before all three candles are lit, cannot be freed before its unrest reaches zero, rooms unlock only in order, and saved progress loads back the same.
  - Player collision: whatever the input sequence, the player never ends up inside a collider or outside the room.
  - Camera snap: the snapped camera plus the remainder always equals the unsnapped position, and the remainder stays within half a pixel.
- Run the typecheck, the tests and the build before calling any task done: `npm test` (typecheck, then `tests/e2e/playthrough.mjs`, which plays all five rooms in Chrome and checks the phone tap safety) and `npm run build`.
- `window.__game` (dev builds only) exposes the game state and a `teleport(x, z)` helper for browser tests.

## Code rules

- Keep every file under 500 lines.
- Do not add a dependency without a clear reason.
- Do not edit the reused files in `src/lib/pixel` without noting the change in the file's header comment and in the README's "Reused from Euphoria" section.
