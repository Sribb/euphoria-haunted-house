# Fantasy UI Borders (1.0)

- Page: https://opengameart.org/content/fantasy-ui-borders
- Author's own page: https://kenney.nl/assets/fantasy-ui-borders
- Author: Kenney (https://www.kenney.nl)
- License: CC0 1.0 Universal, https://creativecommons.org/publicdomain/zero/1.0/
  Stated on both pages and in `License.txt`, which shipped inside the pack and is kept here unchanged.
- File downloaded: https://opengameart.org/sites/default/files/kenney_fantasy-ui-borders.zip (358.8 KB). The OpenGameArt mirror was used because the kenney.nl download is a JavaScript-only button.
- Date downloaded: 2026-11-27
- Attribution is not required. Kenney asks for an optional credit: "Kenney" or "www.kenney.nl".

## What the game uses

Only the files in `haunted/`. The four white originals they come from are in `original/`. Nothing else from the pack is kept.

| File | Size (px) | Made from | Use |
| --- | --- | --- | --- |
| `haunted/frame-dialog.png` | 50 x 50 | `original/panel-border-014.png` | dialog box: double rule, fog outside, violet inside |
| `haunted/frame-iron.png` | 50 x 50 | `original/panel-border-030.png` | HUD panel, interaction prompt, toast, mute button: single fog rule with studded corners |
| `haunted/answer-rest.png` | 50 x 50 | `original/panel-border-022.png` | encounter answer, rest |
| `haunted/answer-hover.png` | 50 x 50 | same | encounter answer, hover and selected |
| `haunted/answer-right.png` | 50 x 50 | same | encounter answer, marked right |
| `haunted/answer-wrong.png` | 50 x 50 | same | encounter answer, marked wrong |
| `haunted/answer-disabled.png` | 50 x 50 | same | encounter answer, not chosen after a pick |
| `haunted/divider.png` | 192 x 18 | `original/divider-fade-003.png` plus its mirror | centred divider for cards |

Slice values and CSS are in `.kiro/steering/ui-style.md`.

## How the haunted copies were made

Each 48 x 48 white border was padded by 1 px on every side (so the tiles are 50 x 50 and every slice value grows by 1), then:

- Line pixels were coloured. In `frame-dialog.png` the outer ring is #5E5870 (X) and the inner ring is #5C2496 (E).
- The space inside the border was filled. The gap between the two rings of `frame-dialog.png` is #1A1428 (stone deep).
- Outside pixels touching the frame got a 1 px #0B0714 (canvas) outline, so no box-shadow is needed.

| File | Line | Fill |
| --- | --- | --- |
| frame-dialog | #5E5870 outer, #5C2496 inner | #151024 |
| frame-iron | #5E5870 | #151024 |
| answer-rest | #9C95AE | #241A33 |
| answer-hover | #FFD47A | #2C2140 |
| answer-right | #5BE37D | #123A22 |
| answer-wrong | #D63A3A | #3A1018 |
| answer-disabled | #3E3058 | #151024 |

`divider.png` is `divider-fade-003.png` followed by a mirrored copy, with every pixel set to #E89A2E (G) and the original alpha kept, so both ends fade out.
