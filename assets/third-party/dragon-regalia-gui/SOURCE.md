# Tiny RPG: Dragon Regalia GUI

- Page: https://opengameart.org/content/tiny-rpg-dragon-regalia-gui
- Also listed by the author at: https://tiopalada.itch.io/tiny-rpg---dragon-regalia-gui
- Author: Gabriel "tiopalada" Lima (https://tiopalada.art)
- License: CC0 1.0 Universal (public domain dedication), https://creativecommons.org/publicdomain/zero/1.0/
  The license is stated in the License field on the OpenGameArt page and in `license.html`, which shipped inside the pack and is kept here unchanged.
- File downloaded: https://opengameart.org/sites/default/files/tinyrpg_dragonregaliagui_v1_0.zip (69.5 KB)
- Date downloaded: 2026-11-27
- Attribution is not required. A credit line is still kind: "UI frames and buttons: Tiny RPG Dragon Regalia GUI by tiopalada (CC0)".

## What the game uses

Only the files in `haunted/`. They are recoloured copies of the four originals in `original/`, so they match the haunted palette in `src/lib/pixel/haunted-palette.ts`. Nothing else from the pack is kept.

| File | Size (px) | Made from | Use |
| --- | --- | --- | --- |
| `haunted/frame-gilded.png` | 72 x 72 | `original/20240707dragon9SlicesB.png` | 9-slice gilded frame: title, intro and end cards, movie title card, movie screen |
| `haunted/button-rest.png` | 100 x 35 | cell 1 of `original/20240709dragonButtonA-Sheet.png` | gilded button, rest |
| `haunted/button-hover.png` | 100 x 35 | cell 2 | gilded button, hover and keyboard focus (art is raised 1 px) |
| `haunted/button-press.png` | 100 x 35 | cell 3 | gilded button, pressed (art is lowered 1 px) |
| `haunted/button-disabled.png` | 100 x 35 | cell 4 | gilded button, disabled |
| `haunted/nameplate.png` | 96 x 32 | `original/20240707dragonHeaderB.png` | ghost name plate in the encounter (3-slice, left and right caps) |
| `haunted/pointer-sheet.png` | 130 x 26 | `original/20240711dragonHorizontalCursorA-Sheet.png` | 5-frame selection pointer (each frame 26 x 26), shown beside the selected answer |

Slice values and CSS are in `.kiro/steering/ui-style.md`.

## How the haunted copies were made

Exact colour swaps, no other edits. Source colour on the left, haunted palette colour on the right (palette key in brackets).

Gilt, shared by the frame, buttons and pointer:

- #131549 to #0B0714 (canvas), the outer outline
- #4D4783 and #4E1767 to #241A33 (k), the drop shadow
- #7C366B and #964463 to #5C2496 (E), deep gilt shadow
- #BF5B56 to #7E4D14 (O)
- #F27646 to #A8641A (g)
- #F4A13A to #E89A2E (G)
- #F9D42F to #FFD47A (y)
- Gems: #007484 to #6A2BB0 (p), #00AA55 to #9256E0 (P), #35CD62 to #B98AF5 (q), #55DC34 to #DCC8FF (Q)

Frame only: #362871 to #5C2496 (E, the violet pinstripe), #455EB1 to #120C1C (K, inner shadow), #4393D6 to #151024 (surface, the fill).

Buttons: the fill colour also appears as speckle in the gilt, so only the fill region connected to the centre of each cell was given the fill colour.

- Rest: fill #BF5B56 to #5C2496 (E), #964463 to #241A33 (k)
- Hover: fill #07C3EE to #6A2BB0 (p), #4393D6 to #5C2496 (E)
- Pressed: fill #964463 to #241A33 (k), #7C366B to #120C1C (K)
- Disabled: fill #6B699B to #2C2140 (stone), #4D4783 to #1A1428 (stone deep), #F27646 to #5E5870 (X), #BF5B56 to #4C4760 (D), #7C366B to #241A33 (k), #964463 to #3E3058 (stone light)

Name plate (blood): #131549 to #0B0714, #4D4783 to #120C1C, #6B699B and #7390AE to #5E1F0B (1), #84BDC2 to #8E1C24 (r), #A8E3D0 to #D63A3A (R).
