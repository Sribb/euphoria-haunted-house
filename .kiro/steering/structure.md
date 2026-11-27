---
inclusion: always
---

# Structure

- `src/lib/pixel/`: the pixel engine. Most files are reused from Euphoria and say so in their header. `haunted-palette.ts`, `sprites.ts` and `index.ts` are new.
- `src/art/`: every new haunted sprite and scene (ghosts, rooms, candles, the mansion map). Add each file's sprites to `HAUNTED_ART` in `src/art/index.ts`, which feeds the list in `src/lib/pixel/sprites.ts`. Art files import `s`, `shade` and `withRows` from `src/lib/pixel/helpers.ts`, never from `sprites.ts`, because that would be a circular import.
- Each room is a 3D build in `src/game/<room>.ts` (see `foyer.ts`): geometry, lights, colliders, three clues with their candles, and where the ghost floats. `src/art/foyer.ts` is the earlier 2D poster art of the Foyer; the game does not use it.
- `src/main.ts`: boots a room and runs the frame loop: input, player, ghost, interactions, the encounter, saving.
- `src/game/`: the 3D game. `pipeline.ts` (renderer), `look.ts` (palette, materials, `box`, `worldUV`), `textures.ts` (procedural pixel textures), `billboard.ts` (sprites in 3D), `camera.ts`, `input.ts`, `player.ts`, `particles.ts`, `candles.ts`, `audio.ts` (synthesised sound), `story.ts` (the room's script, from the lesson JSON), and one file per room (`foyer.ts`).
- `src/ui/`: the DOM layer over the game (title, intro, HUD with the goal line, prompts, dialog, the encounter, the end card) and its CSS. `movie.ts` is the fullscreen cutscene player.
- Clue movies: `src/game/movies.ts` builds each room's three movies from Euphoria story data (`content/euphoria/*-story.json`) and the story engine in `src/lib/pixel/story/`. `src/game/halloween.ts` dresses each story scene (autumn colours plus decorations placed where actors never walk). Movies start with Play, cannot be skipped, and end with Continue.
- `src/game/props3d.ts`: shaped props (lathe, tube, displaced sphere): turned legs, arches, the armchair, candelabra, trunk, dead plants, cobwebs, and jack-o'-lanterns with a light inside.
- `content/euphoria/`: lesson content reused from Euphoria, as JSON. Read it, do not hand-edit it. If a room needs different wording, put the override next to the room's code.
- `tests/`: unit tests and property-based tests.
