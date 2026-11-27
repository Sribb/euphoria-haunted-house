# 1-Bit Graveyard Pixel Art Asset Pack (with its Halloween icons)

- Page: https://opengameart.org/content/1-bit-graveyard-pixel-art-asset-pack
- Author: Fava Beans (OpenGameArt user)
- License: CC0 (public domain dedication), https://creativecommons.org/publicdomain/zero/1.0/
  Stated in the License field on the OpenGameArt page. The pack itself ships no license file, so there is none to copy here.
- Files downloaded (both on that page):
  - https://opengameart.org/sites/default/files/1-bit_pixel_art_graveyard_pack.zip (108.3 KB)
  - https://opengameart.org/sites/default/files/1-bit_pixel_art_halloween_icons.zip (18.1 KB)
- Date downloaded: 2026-11-27
- Attribution is not required. A credit line is still kind: "Bone frame and icons: 1-Bit Graveyard pack by Fava Beans (CC0)".

## What the game uses

Only the files in `haunted/`. The white and black originals they come from are in `original/`. Nothing else from the pack is kept.

| File | Size (px) | Made from | Use |
| --- | --- | --- | --- |
| `haunted/frame-bone.png` | 48 x 48 | `original/LG-Frame_A_Corner.png` (skull) at the four corners, `original/LG-Frame_A_Horizontal.png` (bone) on the top and bottom edges, `original/LG-Frame_A_Vertical.png` on the left and right edges | 9-slice bone frame around the encounter's question panel |
| `haunted/icons/<tone>/<name>.png` | 16 x 16 | `original/icons/*.png` | UI icons, one file per tone |

Icon names and their source files:

| Name | Source file |
| --- | --- |
| skull | Skull.png |
| volume-on | Volume_Playing.png |
| volume-off | Volume_Muted.png |
| right | Right.png |
| wrong | Wrong.png |
| play | Play.png |
| next | Next.png |
| key | Key.png |
| lock | Lock.png |
| question | Question.png |
| exclamation | Exclamation.png |
| moon | Dark.png |

Tones (white pixels become the first colour, black pixels the second):

| Tone | White to | Black to | Meaning |
| --- | --- | --- | --- |
| bone | #E6E1D3 (w) | #0B0714 (canvas) | default, passive |
| candle | #FFD47A (y) | #7E4D14 (O) | active, hover, "you can act" |
| blood | #D63A3A (R) | #5E1F0B (1) | danger, unrest, wrong |
| ecto | #5BE37D (N) | #1F7A3A (n) | right, calm |
| fog | #5E5870 (X) | #241A33 (k) | spent, disabled |
| ink | #1C1210 (wood deep) | transparent | dark glyph for gold chips and key caps |

## How frame-bone.png was made

The three 16 x 16 tiles were laid out on a 48 x 48 grid (corner skull in all four corners, unflipped). White became #E6E1D3 (w) and black became #151024 (surface), so the tile's background is the panel colour.
