# Euphoria Haunted House

A spooky 3D pixel-art spin-off of [Euphoria](https://euphoriainv.com), built for Kiroween 2026 (Costume Contest).

Walk through a haunted mansion with a lantern. Each room is one short investing lesson. Find the three things the ghost left behind: each plays a short fullscreen pixel movie and lights one of the room's candles. Then face the ghost and answer its questions to set it free and open the next door.

**Status:** Room 1, The Foyer, is playable. Rooms 2 to 5 are next.

## Run it

```bash
npm install
npm run dev        # then open http://localhost:5173
npm run build      # typecheck and production build
```

Controls: WASD or the arrow keys to move, E (or Space or Enter) to look at things and advance text, 1 to 4 to answer. On a phone, drag on the left side of the screen to move and tap the button to act.

## Reused from Euphoria

This project is new for Kiroween 2026, but it reuses existing code and content from Euphoria, an investing app built by the same team before the hackathon. Everything listed here existed before October 30, 2026.

| What | Where it is here | Where it came from |
| --- | --- | --- |
| Pixel art engine: sprite format, compiler, SVG renderer, editor logic, source writer | `src/lib/pixel/types.ts`, `compile.ts`, `svg.ts`, `palette.ts`, `PixelSprite.tsx`, `edit.ts`, `source.ts` | Euphoria web app, `src/lib/pixel/`, written July to November 2026 |
| Sprite helpers `s`, `shade`, `withRows` | `src/lib/pixel/helpers.ts` | Euphoria web app, `src/lib/pixel/sprites.ts` |
| Lesson content: Investing Fundamentals lessons 1 to 5 | `content/euphoria/investing-fundamentals-1-5.json` | Euphoria web app, `src/features/pathway/courses/investingFundamentals.ts`, exported to JSON |
| Story movie engine (timing, carry-over glides, label and caption swaps) | `src/lib/pixel/story/engine.ts`, `types.ts` | Euphoria web app, `src/lib/pixel/story/` (branch story-lessons), itself a port of the iPhone app's story player |
| Story art and cards for lesson 1 (Maya's birthday money, the own and lend toggles, the growth ledger) | `content/euphoria/if1-story.json` | Euphoria web app, `src/features/pathway/story/lessons/investing-fundamentals-1.ts`, exported to JSON |
| 3D pixel-art renderer (low-res toon render, outline and palette-snap composite) | `src/game/pipeline.ts` | Tiny Why, Sriyan's video project, `studio/src/pixel3d/pipeline.ts` (November 2026), which credits three.js RenderPixelatedPass (MIT) and the Project Shadowglass write-ups |

Changes made to reused files: `compile.ts` now defaults to the haunted palette instead of Euphoria's palette. `pipeline.ts` is orthographic only, follows the window size, adds encounter effects (flash, exposure, vignette), and fixes a bug where outlines between two objects never drew. Every reused file says where it came from in its header comment.

## New for Kiroween 2026

Everything not listed above, including:

- The haunted palette (`src/lib/pixel/haunted-palette.ts`).
- All haunted sprites, rooms and ghosts.
- The 3D rooms, the player, the ghost encounter, the room flow and the progress system.
- The movie player (`src/ui/movie.ts`) and the Halloween costume for the story scenes (`src/game/halloween.ts`: autumn colours, bats, jack-o'-lanterns, gravestones, cobwebs, fog). The clock movie's beats are new; its captions are the lesson's own words.
- The Miser, the 3D props (`src/game/props3d.ts`), the encounter wipe, and the intro card.
- The Kiro steering docs and specs in `.kiro/`.

## How it was built

The starting setup (the engine import, the lesson export, this README and the first steering docs) was prepared with Claude Code on November 27, 2026. The playable pilot of room 1 was also built with Claude Code that day: the game code in `src/game` and `src/ui`, `src/main.ts`, `index.html`, and the art in `src/art`. It sets the quality bar. Rooms 2 to 5 and everything after are built in Kiro. See `.kiro/` for the steering docs, specs and hooks.

## License

MIT. See [LICENSE](LICENSE).
