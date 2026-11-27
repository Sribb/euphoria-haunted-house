---
inclusion: always
---

# Structure

- `src/lib/pixel/`: the pixel engine. Most files are reused from Euphoria and say so in their header. `haunted-palette.ts`, `sprites.ts` and `index.ts` are new.
- `src/art/`: every new haunted sprite and scene (ghosts, rooms, candles, the mansion map). Register sprites in `src/lib/pixel/sprites.ts`.
- `src/features/house/`: the mansion map, room unlocking and saved progress.
- `src/features/room/`: one room: its lesson beats, its question and freeing the ghost.
- `content/euphoria/`: lesson content reused from Euphoria, as JSON. Read it, do not hand-edit it. If a room needs different wording, put the override next to the room's code.
- `tests/`: unit tests and property-based tests.
