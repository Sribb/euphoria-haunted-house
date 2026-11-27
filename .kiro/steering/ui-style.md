---
inclusion: fileMatch
fileMatchPattern: "src/ui/**"
---

# UI style guide: the haunted house dresses its interface

This guide turns the flat violet panels into a haunted, polished UI. It covers every surface in `index.html`, `src/ui/ui.css`, `src/ui/ui.ts` and `src/ui/movie.ts`. All art comes from four CC0 packs in `assets/third-party/`, already recoloured to the haunted palette. The frame, button, answer, pointer, name plate, pip and divider recipes below were rendered in a mock page in Chrome 158 at 1x and 2x (desktop and 390 px wide) before they were written down. Safari and Firefox were not tested.

## The three big ideas

1. **Three materials, three jobs.** The house builds its UI from its own furniture. **Gilt** (gold picture frames) is for ceremony: the title, intro and end cards, the movie, and primary buttons. **Iron** (cold riveted fog-grey rules) is for everyday chrome: HUD, prompt, toast, dialog. **Bone** (skulls and bones) belongs only to the ghost: the encounter panel. Never put two materials on one surface.
2. **Candlelight means "you can act here".** Candle gold (`--candle`, `--candle-light`) appears only on things you can press, the thing that is selected, and progress (lit candles). Everything passive is cold: fog, stone and violet. Blood means danger or a wrong answer. Ectoplasm green means right. Ghost teal (`--ghost`) is reserved for the keyboard focus ring, so focus is never confused with selection.
3. **One pixel grid.** One art pixel is `--s` (2 CSS px) on every surface. Art is only ever scaled by whole numbers with `image-rendering: pixelated`. Outlines are baked into the art. Motion moves in whole art pixels and uses `steps()`, never smooth easing.

## References

Ideas only. Never copy a game's art, logo or layout. Items 1 to 4 are the packs we ship.

| # | Reference | What works | What we borrow |
| --- | --- | --- | --- |
| 1 | Tiny RPG Dragon Regalia GUI, https://opengameart.org/content/tiny-rpg-dragon-regalia-gui | Ornate gilt only at the corners and button ends, plain straight edges between, so 9-slicing is clean. Buttons have four drawn states and the hover art is raised 1 px, the pressed art lowered 1 px. | The gilded frame, the four-state button, the name plate and the animated pointer (shipped, recoloured). |
| 2 | Kenney Fantasy UI Borders, https://opengameart.org/content/fantasy-ui-borders | 1-bit frames built from 2 px rules with stepped and studded corners; the same shape works in any colour. | Iron, dialog and answer frames and the centred divider (shipped, recoloured). |
| 3 | 1-Bit Graveyard pack, https://opengameart.org/content/1-bit-graveyard-pixel-art-asset-pack | Skull corners with tiling bone edges; 16 px icons that stay readable at 1x. | The bone frame and 12 icons in 6 tones (shipped, recoloured). |
| 4 | Spooky Cursors Pack, https://opengameart.org/content/spooky-cursors-pack | A cursor with default, hover and click states that changes outline colour on hover. | The bone hand cursor (shipped, optional). |
| 5 | Gothic Pixel UI by AbyssOwl, https://abyssowl.itch.io/gothic-pixel-ui | One frame shape in four materials (gold, bronze, stone, wood). A centred crest divider (a small peak between two thin rules) separates text blocks. Blackletter title cut into a stone plate. | One shape language across our three materials; a centred divider under every card title; blackletter only for titles. |
| 6 | Classic Spooky Purple 16x16 UI by DevTarlow, https://tarlow.itch.io/classic-purple-spooky-ui | Purple panels with a lighter top edge and darker bottom edge; orange bar fills; buttons in on and off pairs. | Violet plus candle orange as the core pairing; paired on and off icons for the sound button. |
| 7 | Pixel User Interface (Halloween Scented) by jinside, https://jinside.itch.io/pixel-user-interface-banners-and-buttons | Thick dark outlines around every piece; star icons in lit, dim and spent states. | A baked dark outline on every frame so UI reads over the busy 3D scene; three-state pips (restless, calm, spent). |
| 8 | Pixel Art Horror UI/GUI Kit by Barely Apes, https://assetstore.unity.com/packages/2d/gui/pixel-art-horror-ui-gui-kit-314001 | Near-black panels, chamfered corners, red only at the corners. | Stepped (chamfered) corners on answer buttons; red reserved for danger. |
| 9 | SpookyUI dialogue pack by Warco, https://warco-exe.itch.io/spookyui | Different box shapes and tails for scary speakers versus normal speech. | The ghost's lines look different from narration: a blood speaker tab and a 1-step shudder when the ghost starts talking. |
| 10 | WORLD OF HORROR, https://store.steampowered.com/app/913740/WORLD_OF_HORROR/ | Stark rules on black; an event title in a tab that breaks the panel's top border; choices as a row of equal boxes; an unavailable choice is drawn inverted, not just greyed. | The dialog speaker tab sitting on the top rule; equal answer boxes; spent answers change their frame, not only their text colour. |
| 11 | Blasphemous, https://store.steampowered.com/app/774361/Blasphemous/ | HUD as an ornate medallion plus thin bars; resources shown as a row of discrete objects; currency in a small gold plaque; ornament only at the ends of thin elements. | Candles and unrest as discrete pips, never numbers alone; the ghost's name in a plaque; ornament at the ends, plain in the middle. |
| 12 | Lospec Halloween palettes, https://lospec.com/palette-list/tag/halloween | Small, strict palettes look deliberate. | Every UI colour comes from `haunted-palette.ts` or `look.ts`. The only exceptions are the two answer fills `#123A22` and `#3A1018`, already in use. |

## Assets on disk

All paths are relative to the repo root. From `src/ui/ui.css`, write them as `url("../../assets/third-party/...")`. Vite 7 resolves relative `url()` in a stylesheet linked from `index.html` (checked with a scratch build). Every shipped PNG is under Vite's 4 KB inline limit, so the build inlines them as `data:` URIs in the built CSS instead of emitting files. Each folder has a `SOURCE.md` with the page, author, license and colour mapping.

| Folder | Pack | License |
| --- | --- | --- |
| `assets/third-party/dragon-regalia-gui/haunted/` | Tiny RPG Dragon Regalia GUI, tiopalada | CC0 1.0 |
| `assets/third-party/fantasy-ui-borders/haunted/` | Fantasy UI Borders, Kenney | CC0 1.0 |
| `assets/third-party/graveyard-1bit/haunted/` | 1-Bit Graveyard pack, Fava Beans | CC0 |
| `assets/third-party/spooky-cursors/` | Spooky Cursors Pack Vol. 1, Tisroc | CC0 1.0 |

Considered and not shipped: Gothic Pixel UI by AbyssOwl (requires credit, forbids AI training, and the download is a JavaScript button), Tiny RPG Mana Soul GUI (its author asks that it not be used with AI tools), Kenney Pixel UI Pack (bright generic colours with nothing haunted to keep), Dark Fantasy UI Pack on OpenGameArt (CC-BY, 3D renders, 16.7 MB), and every itch.io pack (behind a bot check and JavaScript download buttons, and the Halloween UI kits there are paid). Do not add art from these.

Fonts load from Google Fonts (OFL): Jacquard 24 and Jacquard 12 by Sarah Cadigan-Fried are added to the existing link. Add a short credits line to the README for the four packs and the fonts. It is not required by CC0, but judges notice it.

## Tokens

Replace the `:root` block in `ui.css` with this. Keep `--canvas` as the page background.

```css
:root {
  --s: 2px;                 /* one art pixel; every frame, icon and outline is a whole multiple */
  --canvas: #07050c;        /* page behind the 3D view */
  --outline: #0b0714;       /* HAUNTED_CANVAS: the outline baked into the art */
  --surface: #151024;       /* HAUNTED_SURFACE: panel fill */
  --k: #241a33; --stone-deep: #1a1428; --stone: #2c2140; --stone-light: #3e3058;
  --ink: #e6e1d3; --ink-bright: #fffbef; --muted: #9c95ae; --fog: #5e5870; --fog-deep: #4c4760;
  --violet: #9256e0; --violet-mid: #6a2bb0; --violet-deep: #5c2496;
  --candle: #e89a2e; --candle-light: #ffd47a; --candle-deep: #7e4d14; --wick: #1c1210;
  --blood: #d63a3a; --blood-light: #f08a80; --blood-deep: #8e1c24;
  --ecto: #5be37d; --ghost: #6fe3e8;
  --t-body: 28px; --t-small: 24.8889px; --t-tiny: 18.6667px;
  --s-answer: var(--s);
  font-family: "Jersey 10", ui-monospace, monospace;
}
@media (max-width: 640px) {
  :root { --t-body: 24.8889px; --t-small: 18.6667px; --s-answer: 1px; }
}
```

Delete the old `--px` token and the shared box-shadow border rule (`.panel, #dialog, .card, ...`). Frames now come from art.

## Frame system

**Warning about the shorthand.** In `border-image`, the part after the second slash is the outset, not the repeat mode. `url(x) 16 fill / 32px / stretch` is invalid and Chrome drops the whole declaration; `CSS.supports` returns false for it. Write the repeat mode with no slash: `url(x) 16 fill / 32px stretch`. Also set `border-width` to the same values as the image width, or the content will sit on top of the frame.

| Frame | File (under `assets/third-party/`) | Image | Slice (top right bottom left) | Border width at `--s` = 2px | Repeat | Used on |
| --- | --- | --- | --- | --- | --- | --- |
| Gilt | `dragon-regalia-gui/haunted/frame-gilded.png` | 72 x 72 | 24 24 25 24 | 48 48 50 48 | stretch | `.card` (title, intro, end), movie screen |
| Iron | `fantasy-ui-borders/haunted/frame-iron.png` | 50 x 50 | 11 | 22 | stretch | `#hud .status`, `#mute`, `#prompt`, `#toast` |
| Dialog | `fantasy-ui-borders/haunted/frame-dialog.png` | 50 x 50 | 11 | 22 | stretch | `#dialog` |
| Bone | `graveyard-1bit/haunted/frame-bone.png` | 48 x 48 | 16 | 32 | space | `#battle .panel` |
| Answer | `fantasy-ui-borders/haunted/answer-*.png` | 50 x 50 | 13 | 26 (13 on phones) | stretch | `#battle .options button` |
| Button | `dragon-regalia-gui/haunted/button-*.png` | 100 x 35 | 12 20 | 24 40 | repeat | `.card button`, `#act`, `#movie .play`, `#movie .continue` |
| Plate | `dragon-regalia-gui/haunted/nameplate.png` | 96 x 32 | 0 19 | 0 38 | stretch | `#battle .name` |

Why the repeat modes: the gilt, iron, dialog and answer edges are uniform straight rules, so `stretch` stays pixel exact. Bones must stay whole, so `space` keeps each bone at exact scale and spreads the gaps; the gaps show the element's background, which must be `--surface`. The button's gilt has speckle texture, so `repeat` tiles it at exact scale instead of smearing it.

Tested recipes. `image-rendering: pixelated` on the element also applies to its border image; it is supported in current Chrome, Safari and Firefox, but only Chrome was checked here.

```css
.card {
  border-style: solid; border-color: transparent;
  border-width: calc(24 * var(--s)) calc(24 * var(--s)) calc(25 * var(--s));
  border-image: url("../../assets/third-party/dragon-regalia-gui/haunted/frame-gilded.png") 24 24 25 fill
    / calc(24 * var(--s)) calc(24 * var(--s)) calc(25 * var(--s)) stretch;
  background: none; image-rendering: pixelated;
}
#hud .status, #mute, #prompt, #toast {
  border: calc(11 * var(--s)) solid transparent;
  border-image: url("../../assets/third-party/fantasy-ui-borders/haunted/frame-iron.png") 11 fill / calc(11 * var(--s)) stretch;
  background: none; box-shadow: none; image-rendering: pixelated;
}
#dialog { /* same as iron, with frame-dialog.png */ }
#battle .panel {
  border: calc(16 * var(--s)) solid transparent;
  border-image: url("../../assets/third-party/graveyard-1bit/haunted/frame-bone.png") 16 fill / calc(16 * var(--s)) space;
  background: var(--surface); box-shadow: 0 0 0 var(--s) var(--outline); image-rendering: pixelated;
}
```

The bone frame is the only frame without a baked outline, so it keeps the 1-art-pixel `box-shadow`. Never add a box-shadow outline to the others: their corners are stepped and a rectangular shadow would show behind them.

## Buttons

### Gilded button (primary actions)

Used for Enter the house, Start exploring, Play from the start, the movie's Play and Continue, and the touch action button `#act`. At most one per screen, per the product rules.

```css
.card button, #act, #movie .play, #movie .continue {
  display: inline-flex; align-items: center; justify-content: center; gap: calc(4 * var(--s));
  height: calc(35 * var(--s)); min-width: calc(80 * var(--s)); padding: 0 calc(4 * var(--s));
  border-style: solid; border-color: transparent; border-width: calc(12 * var(--s)) calc(20 * var(--s));
  border-image: url("../../assets/third-party/dragon-regalia-gui/haunted/button-rest.png") 12 20 fill
    / calc(12 * var(--s)) calc(20 * var(--s)) repeat;
  background: none; box-shadow: none; image-rendering: pixelated;
  font-family: "Jersey 10", monospace; font-size: var(--t-body); line-height: 1;
  color: var(--candle-light); text-shadow: 0 var(--s) 0 var(--outline);
}
```

| State | Selector | Change |
| --- | --- | --- |
| Rest | default | `button-rest.png`, text `--candle-light` on violet deep (contrast 6.96) |
| Hover | `:hover` | `border-image-source: button-hover.png`, text `--ink-bright` on violet mid (contrast 7.9); the art itself rises 1 art px |
| Focus | `:focus-visible` | hover art plus `outline: calc(2 * var(--s)) solid var(--ghost); outline-offset: var(--s);` |
| Pressed | `:active` | `button-press.png`, text `--candle-light` on `#241A33` (11.8) |
| Disabled | `:disabled` | `button-disabled.png`, text `--muted`, `cursor: default` |

Do not move the button with `transform` on hover or press: the art already rises and sinks by 1 art pixel, and moving the box as well doubles the jump. Swap only `border-image-source`, no transition.

Icons inside buttons: an `<img>` or a `::before` of `calc(16 * var(--s))` square. The movie's Play uses `icons/candle/play.png`; Continue uses `icons/candle/next.png`. Keep the words; icons never replace text.

### Answer buttons (the encounter)

```css
#battle .options { display: grid; grid-template-columns: 1fr 1fr;
  gap: calc(4 * var(--s)) calc(16 * var(--s)); padding-left: calc(14 * var(--s)); }
#battle .options button {
  position: relative; min-height: 56px; display: flex; gap: 10px; align-items: center; text-align: left;
  padding: 0 calc(2 * var(--s)); border: calc(13 * var(--s-answer)) solid transparent;
  border-image: url("../../assets/third-party/fantasy-ui-borders/haunted/answer-rest.png") 13 fill / calc(13 * var(--s-answer)) stretch;
  background: none; image-rendering: pixelated; font-size: var(--t-small); line-height: 1.05; color: var(--ink);
}
#battle .options button b { /* the number key cap */
  font-family: "Press Start 2P", monospace; font-size: 8px; line-height: 1; font-weight: 400;
  color: var(--wick); background: var(--candle); padding: 3px 3px 3px 4px; box-shadow: 0 var(--s) 0 var(--candle-deep);
}
```

| State | Trigger in `ui.ts` | Frame file | Extra |
| --- | --- | --- | --- |
| Rest | none | `answer-rest.png` (fog rule, `#241A33` fill) | number cap in candle |
| Hover or selected | `:hover:not(:disabled)` and `.sel:not(:disabled)` | `answer-hover.png` (candle rule) | the pointer appears (below) |
| Focus | `:focus-visible` | same as selected | ghost teal outline as on gilded buttons |
| Right | `.right` | `answer-right.png` | `::after` icon `icons/ecto/right.png` at `margin-left: auto` |
| Wrong | `.wrong` | `answer-wrong.png` | `::after` icon `icons/blood/wrong.png` |
| Spent | `:disabled:not(.right):not(.wrong)` | `answer-disabled.png` | text `--muted`; number cap `background: var(--fog); box-shadow: none` |

The pointer is the Dragon Regalia cursor, five frames of 26 x 26 in one strip. It straddles the selected answer's left rule, so the grid's `padding-left` and column gap above leave room for it:

```css
#battle .options button.sel:not(:disabled)::before, #battle .options button:hover:not(:disabled)::before {
  content: ""; position: absolute; top: 50%; left: calc(-26 * var(--s));
  width: calc(26 * var(--s)); height: calc(26 * var(--s)); margin-top: calc(-13 * var(--s));
  background: url("../../assets/third-party/dragon-regalia-gui/haunted/pointer-sheet.png") 0 0 / calc(130 * var(--s)) calc(26 * var(--s));
  image-rendering: pixelated; animation: pointer-shine 0.6s steps(5) infinite;
}
@keyframes pointer-shine { to { background-position: calc(-130 * var(--s)) 0; } }
```

The `.right`, `.wrong` and spent rules must come after the `.sel` rule so they win once `answer()` marks the buttons.

### Icon button (sound)

`#mute` keeps its words ("Sound on" or "Sound off", set by `main.ts`) and gains an icon: `::before` with `icons/bone/volume-on.png`, and with `icons/blood/volume-off.png` when `[aria-pressed="true"]`. Hover swaps to the candle tone. Iron frame, `min-height: 56px`, text `--t-small` in `--muted` (the old blood text colour moves to the icon). Under 640 px wide, hide the words with `font-size: 0` and keep `aria-label`.

## Surfaces: what changes

In this section `url(".../x.png")` is short for `url("../../assets/third-party/x.png")`.

**Title card (`#title`).** Now a flat violet box with a translucent fill. Change to the gilt frame (opaque fill, scene still visible around it). Delete the `#title { background: rgba(...) }` rule: its id selector beats `.card { background: none }`, and the translucent box would show through the transparent pixels around the gilt corners. Size: `width: min(560px, calc(100% - 24px))`, inner padding `8px 8px 4px`. Kicker: Press Start 2P 8px `--muted`, uppercase. Title: Jacquard 24 at 86px, `--candle-light`, `line-height: 0.9`, `text-shadow: 0 calc(2 * var(--s)) 0 var(--violet-deep), 0 0 24px rgba(232, 154, 46, 0.35)`. Under 640 px wide use Jacquard 12 at 63px ("Haunted" is 198 px wide at that size). Then `divider.png` (below), the subtitle in Jersey `--t-body`, the gilded button, and the hint in `--t-small` `--muted`.

**Divider.** A `<i class="divider" aria-hidden="true">` or a `::after` on the title: `display: block; margin: 12px auto; width: calc(192 * var(--s)); height: calc(18 * var(--s)); background: url(".../fantasy-ui-borders/haunted/divider.png") 0 0 / 100% 100%; image-rendering: pixelated;`. Under 640 px use `width: 192px; height: 18px` (1x, still whole).

**Intro card (`#intro`).** Gilt frame like the title card, `width: min(620px, calc(100% - 24px))`. Heading: Jacquard 12 at 42px `--candle-light`, violet drop shadow of 1 art px, then the divider. Steps lose their boxes: each `li` is a row on `--k` with a 1-art-px `--stone-light` rule below (`box-shadow: inset 0 calc(-1 * var(--s)) 0 var(--stone-light)`), no border. The step number becomes a key cap: Press Start 2P 16px, `--wick` on `--candle`, `padding: 4px 6px 4px 8px`, `box-shadow: 0 var(--s) 0 var(--candle-deep), 0 0 0 var(--s) var(--outline)`. Keep the sprite icons. Keep `max-height: calc(100% - 24px); overflow: auto`.

**End card (`#end`).** Gilt frame. Title Jacquard 24 at 86px; under 640 px use Jacquard 12 at 42px, because "are at peace" is 276 px at 63px and does not fit a 390 px phone. `#end-next` stays `--ghost`. Gilded button.

**HUD (`#hud`).** Now a violet box. Change `.status` to the iron frame. Room label Press Start 2P 8px `--muted`; room name Jersey `--t-body` `--candle-light` (not blackletter: it must stay readable); divider between room and goal becomes `border-right: var(--s) solid var(--stone-light)`. Candles stay as they are, but make the lit glow stepped (see Motion). Objective in `--t-small` `--ink`. During the encounter hide the status but not the sound button: `#stage.battle #hud .status { visibility: hidden; }`.

**Interaction prompt (`#prompt`).** Iron frame, `padding: 0 calc(2 * var(--s))`, text `--t-body`. The key becomes a key cap: Press Start 2P 16px, `--wick` on `--candle-light`, `padding: 4px 6px 4px 8px`, `box-shadow: 0 var(--s) 0 var(--candle-deep), 0 0 0 var(--s) var(--outline)`.

**Mobile action button (`#act`).** The gilded button, bottom right, `height: calc(35 * var(--s))` (70px).

**Toast (`#toast`).** Iron frame, text `--t-body` `--candle-light`, `padding: 0 calc(4 * var(--s))`. Enter with the stepped drop in Motion.

**Dialog (`#dialog`).** Now a violet box with the speaker in red above the text. Change to the dialog frame (double rule: fog outside, violet inside), `padding: calc(6 * var(--s)) calc(6 * var(--s)) calc(2 * var(--s))`. The speaker becomes a tab sitting on the top rule, borrowed from reference 10: `position: absolute; top: calc(-11 * var(--s) - 10px); left: calc(8 * var(--s)); font: 8px "Press Start 2P"; color: var(--wick); background: var(--blood-light); padding: 6px 8px; box-shadow: 0 0 0 var(--s) var(--outline);`. `#dialog` is already `position: absolute`, so the tab anchors to it. Dark ink on blood light is 7.6:1. The title becomes Jacquard 12 at 42px `--candle-light`. Text Jersey `--t-body`, `line-height: 1.12`. "Next": keep the word, swap the triangle for `icons/candle/play.png` rotated 90 degrees (`transform: rotate(90deg)` on a 32 px square; rotation by 90 is lossless), bobbing 1 art px.

**Encounter (`#battle`).**

- Layout: letterbox bars come in as now. The name plate and unrest pips sit at the top centre, the plate straddling the bottom of the top letterbox bar: `#battle .foe { top: calc(7vh - 16 * var(--s)); left: 50%; right: auto; transform: translateX(-50%); background: none; border: 0; box-shadow: none; padding: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }`. Under 640 px wide, align it left instead (`left: 10px; transform: none; align-items: flex-start;`) so it clears the sound button at the top right.
- Name plate (`.name`): `height: calc(32 * var(--s)); display: inline-flex; align-items: center; padding: 0 calc(4 * var(--s)); border-style: solid; border-color: transparent; border-width: 0 calc(19 * var(--s)); border-image: url(".../dragon-regalia-gui/haunted/nameplate.png") 0 19 fill / 0 calc(19 * var(--s)) stretch; image-rendering: pixelated;`. Text Jacquard 12 at 42px, `--ink-bright` (8.7 on the blood plate), `text-shadow: 0 var(--s) 0 #5e1f0b`. "The Gambler" is 204 px wide, so the plate fits a phone.
- Unrest: each `<i>` becomes a skull: `width: calc(16 * var(--s)); height: calc(16 * var(--s)); background: url(".../graveyard-1bit/haunted/icons/blood/skull.png") 0 0 / 100% 100%; image-rendering: pixelated; box-shadow: none;` and `.gone` swaps to `icons/fog/skull.png`. Gap `calc(2 * var(--s))`. The ghost calming is now visible as skulls going dark one by one.
- Question panel (`.panel`): the bone frame, `width: min(820px, calc(100% - 24px))`, `padding: calc(2 * var(--s)) calc(4 * var(--s))`. Question in Jersey `--t-body`. Answers as above, 2 x 2 on desktop, one column under 640 px (keep `ui.ts`'s column logic). On phones the answers use `--s-answer: 1px` (13 px rules), which saves about 50 px per answer so the panel fits under the plate on a 390 x 844 screen.
- Feedback: `.good` `--ecto` (11.3 on surface), `.bad` `--blood-light` (7.7). Keep text, never colour alone.
- Right and wrong are shown three ways at once: frame colour, the check or cross icon, and the feedback sentence.

**Cutscene (`#movie`).**

- Screen frame: the gilded frame drawn outside the canvas with outset, so the whole-number scale of the canvas never changes: `#movie .screen { border: 0; border-image: url(".../frame-gilded.png") 24 24 25 / calc(24 * var(--s)) calc(24 * var(--s)) calc(25 * var(--s)) / calc(24 * var(--s)) calc(24 * var(--s)) calc(25 * var(--s)) stretch; margin: calc(24 * var(--s)); box-shadow: none; }` (no `fill`: the canvas is the picture). In `movie.ts` `fit()`, subtract the frame from the space: `(innerWidth - 24 - 96)` and `(innerHeight - capH - 40 - 98)`. Only frame it when the viewport is at least 700 px wide; on phones the frame would drop the scale from 4 to 3, so keep the current thin outline there (toggle a class from `fit()`).
- Title card (`.titlecard`): keep the dark radial overlay. Kicker Press Start 2P 8px `--muted`. Title Jacquard 24 at 86px on screens at least 900 px wide, Jacquard 12 at 42px below, `max-width: 90vw`, same shadow as the title card. Then the divider, the subtitle in `--t-body`, and the gilded Play button with the candle play icon.
- Continue: gilded button with the candle next icon, bottom right as now.
- Chip: Press Start 2P 8px (not 11px), `--wick` on `--candle`, `padding: 6px 8px`, `box-shadow: 0 0 0 var(--s) var(--outline)`.
- Caption: Jersey `--t-body`, pixel outline `text-shadow: var(--s) 0 0 #000, calc(-1 * var(--s)) 0 0 #000, 0 var(--s) 0 #000, 0 calc(-1 * var(--s)) 0 #000`.
- Label pills (`TONES` in `movie.ts`): border `var(--s)` (2px) instead of 3px, font `--t-small`, `box-shadow: 0 var(--s) 0 #000`. Colours unchanged; they already use the palette.

## Icons

16 x 16 art in `assets/third-party/graveyard-1bit/haunted/icons/<tone>/<name>.png`. Show at `calc(16 * var(--s))` (32 px) with `image-rendering: pixelated`; inside 1x chips use 16 px.

Names: skull, volume-on, volume-off, right, wrong, play, next, key, lock, question, exclamation, moon. Tones: bone (default), candle (active), blood (danger), ecto (right), fog (spent), ink (dark glyph for gold chips).

| Where | Icon |
| --- | --- |
| Sound on and off | bone/volume-on, blood/volume-off; candle tone on hover |
| Unrest pips | blood/skull, fog/skull when gone |
| Right and wrong answers | ecto/right, blood/wrong |
| Movie Play and Continue, dialog Next | candle/play, candle/next |
| Spare, for later rooms | key, lock (locked door), question, exclamation (new clue), moon |

The candle, wisp and ghost icons stay the game's own sprites (`src/art`). Never use an emoji or a Unicode symbol as an icon.

## Typography

Add the two blackletter fonts to the existing link and keep the others:

`https://fonts.googleapis.com/css2?family=Jacquard+12&family=Jacquard+24&family=Jersey+10&family=Press+Start+2P&display=swap`

Each font is a pixel font with a fixed grid. It is pixel exact only when one font pixel is a whole number of device pixels. Measured from the font files:

| Font | Role | Size where 1 font pixel = 1 CSS px | Use these sizes |
| --- | --- | --- | --- |
| Jacquard 24 | hero titles only | 43px | 86px (2 CSS px per font pixel, the same density as `--s`) |
| Jacquard 12 | headings, ghost names | 21px | 42px; 63px for the phone hero |
| Jersey 10 | all body text and buttons | 18.6667px | 28px (exact on 2x screens), 24.8889px (exact on 3x phones), 18.6667px (exact everywhere) |
| Press Start 2P | tiny labels, key caps, chips | 8px | 8px and 16px only. The old 10, 11, 12 and 14px sizes blur. |

Blackletter is for titles and names only, never for sentences or anything the player must read quickly. Jersey 10 at 28px is slightly soft on 1x monitors; that trade is accepted for reading comfort.

## Colour roles

| Role | Token | Hex | Palette key | Contrast on `--surface` |
| --- | --- | --- | --- | --- |
| Body text | `--ink` | #E6E1D3 | w | 14.2 |
| Muted text, hints, labels | `--muted` | #9C95AE | x | 6.5 |
| Actionable or selected, titles | `--candle-light` | #FFD47A | y | 13.2 |
| Key caps and chips (fill) | `--candle` | #E89A2E | G | ink text on it 8.0 |
| Passive frame rule | `--fog` | #5E5870 | X | 2.7 (decorative, not a control) |
| Answer rule at rest | `--muted` | #9C95AE | x | 6.5 (meets 3:1 for control edges) |
| Brand accent, button fill | `--violet-deep` | #5C2496 | E | candle text on it 7.0 |
| Danger, wrong, unrest | `--blood` | #D63A3A | R | 4.0, so icons and large text only |
| Wrong feedback text | `--blood-light` | #F08A80 | s | 7.7 |
| Right, calm | `--ecto` | #5BE37D | N | 11.3 |
| Keyboard focus only | `--ghost` | #6FE3E8 | T | 12.2 |

## Motion

All motion uses `steps()` and moves by whole art pixels. Nothing loops except the pointer and the Next bob.

| What | How |
| --- | --- |
| Card, dialog and panel open | `clip-path: inset(50% 0 50% 0)` to `inset(0)` with `steps(4)`, 160ms. Clip, never scale: scaling blurs the art. |
| Toast | from `translate(-50%, calc(-6 * var(--s)))` to `translate(-50%, 0)` with `steps(3)`, 150ms; out the same way |
| Pointer | 5-frame shine, 0.6s, `steps(5)`, infinite |
| Next indicator | 1 art px bob, `steps(2)`, 0.9s (as now) |
| Unrest skull lost | blood, then `icons/candle/skull.png` for 2 frames, then fog: `steps(1)` keyframes, 240ms |
| Candle lit in HUD | glow drop-shadow in 3 steps (`steps(3)`, 300ms) instead of the smooth 0.4s transition |
| Ghost speaks (first page) | the dialog box shudders 1 art px left and right twice, `steps(4)`, 160ms |
| Title glow | text-shadow alpha flickers 0.35 to 0.5 and back with `steps(2)` every 3s |
| Movie Play button | replace the box-shadow pulse with a stepped `filter: drop-shadow(0 0 calc(4 * var(--s)) rgba(255, 212, 122, 0.5))` on and off, `steps(2)`, 1.4s |

Under `@media (prefers-reduced-motion: reduce)`: no animation and no transition anywhere; the pointer shows frame 1; states swap instantly. `ui.ts` already skips the typewriter and the wipe when `reducedMotion` is set.

## Accessibility

- **Contrast.** Every text pair above is at least 4.5:1. Blood `#D63A3A` is only for icons and text of 24px or more.
- **Focus.** Every focusable control gets `:focus-visible { outline: calc(2 * var(--s)) solid var(--ghost); outline-offset: var(--s); }`. Never remove an outline without this. Teal is never used for anything else.
- **Selection is not colour alone.** The selected answer has the candle frame and the pointer. Right and wrong have frame colour, icon and sentence.
- **Touch targets.** Gilded buttons are 70px tall. Answers have `min-height: 56px`. The sound button is at least 56px. Keep 8px between targets.
- **Phones down to 390px.** Cards are at most `calc(100% - 24px)` wide. At 390px the gilt card's content box is 270px; the phone hero (Jacquard 12 at 63px) fits. Check the title, intro, end card, encounter and dialog at 390 x 844 in devtools.
- **Names and live regions.** Keep every `aria-*` attribute that exists. Decorative images get `alt=""` or are CSS backgrounds. The divider is `aria-hidden`.
- **Keyboard.** Number keys, arrows, E, Space and Enter keep working; nothing in this guide changes `ui.ts` input logic.

## Cursor (optional, last)

On fine pointers only. `image-set` is supported in current Chrome (checked with `CSS.supports`); where it is not, the declaration is dropped and the system cursor stays, which is safe. Do not add a plain `url()` fallback: it would show the cursor at 64px.

```css
@media (pointer: fine) {
  #stage { cursor: image-set(url("../../assets/third-party/spooky-cursors/bone_hand_1_default.png") 2x) 2 2, auto; }
  #stage button:not(:disabled), #dialog { cursor: image-set(url("../../assets/third-party/spooky-cursors/bone_hand_2_hover.png") 2x) 2 2, pointer; }
  #stage button:not(:disabled):active { cursor: image-set(url("../../assets/third-party/spooky-cursors/bone_hand_3_click.png") 2x) 2 2, pointer; }
}
```

## Done means

1. `npm run build` passes and the built CSS in `dist/assets` contains the frames as `data:image/png` URIs.
2. Every frame looks crisp at 100% zoom on a 1x screen and on a 2x screen: no blurred rules, no doubled pixel columns.
3. Walk the whole flow with the keyboard only: title, intro, a clue movie, dialog, the encounter with one wrong and one right answer, the end card. Focus is always visible in teal.
4. Repeat at 390 x 844 with touch emulation and with reduced motion on.
5. No em dashes or en dashes in any copy or comment.
