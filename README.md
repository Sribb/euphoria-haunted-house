# Euphoria Haunted House

A spooky pixel-art spin-off of [Euphoria](https://euphoriainv.com), built for Kiroween 2026 (Costume Contest).

Explore a haunted mansion. Each room is one short investing lesson. Learn the idea, answer the question, and set the room's ghost free. Free every ghost to escape.

**Status:** in progress. Build and run instructions will be added once the app is scaffolded.

## Reused from Euphoria

This project is new for Kiroween 2026, but it reuses existing code and content from Euphoria, an investing app built by the same team before the hackathon. Everything listed here existed before October 30, 2026.

| What | Where it is here | Where it came from |
| --- | --- | --- |
| Pixel art engine: sprite format, compiler, SVG renderer, editor logic, source writer | `src/lib/pixel/types.ts`, `compile.ts`, `svg.ts`, `palette.ts`, `PixelSprite.tsx`, `edit.ts`, `source.ts` | Euphoria web app, `src/lib/pixel/`, written July to November 2026 |
| Sprite helpers `s`, `shade`, `withRows` | `src/lib/pixel/sprites.ts` | Euphoria web app, `src/lib/pixel/sprites.ts` |
| Lesson content: Investing Fundamentals lessons 1 to 5 | `content/euphoria/investing-fundamentals-1-5.json` | Euphoria web app, `src/features/pathway/courses/investingFundamentals.ts`, exported to JSON |

Changes made to reused files: `compile.ts` now defaults to the haunted palette instead of Euphoria's palette. Every reused file says where it came from in its header comment.

## New for Kiroween 2026

Everything not listed above, including:

- The haunted palette (`src/lib/pixel/haunted-palette.ts`).
- All haunted sprites, rooms and ghosts.
- The mansion map, room flow and progress system.
- The Kiro steering docs and specs in `.kiro/`.

## How it was built

The starting setup (the engine import, the lesson export, this README and the first steering docs) was prepared with Claude Code on November 27, 2026. The app itself is built in Kiro. See `.kiro/` for the steering docs, specs and hooks.

## License

MIT. See [LICENSE](LICENSE).
