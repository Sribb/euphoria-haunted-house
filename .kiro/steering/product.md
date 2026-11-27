---
inclusion: always
---

# Product: Euphoria Haunted House

Working name. Built for Kiroween 2026, Costume Contest category, also entered for Best Startup Project.

## What it is

A spooky pixel-art spin-off of Euphoria, the app that teaches teens to invest. You explore a haunted mansion. Each room is one short investing lesson. You learn one idea, answer a question, and that room's ghost is set free. Free every ghost and you escape the house.

## Who it is for

Teens and beginners who think investing is boring or scary. The pitch: investing feels scary, so we made it literally scary, then made it make sense.

## The spooky design has to help the app work

Costume Contest judges want spooky design that improves the app, not decoration. Every haunted effect must do a job:

- A room starts dark. Each thing you learn lights a candle. The light in the room is the progress bar.
- The ghost's mood shows how you are doing. It calms down as you answer correctly.
- A wrong answer makes the room flicker, and the ghost explains the mistake. Wrong answers teach. They never just punish.
- The mansion map shows freed rooms lit and locked rooms dark, so you always know what is next.

## Core loop

1. Mansion map. Rooms unlock in order.
2. Enter a room.
3. Short lesson beats, one at a time.
4. One question to free the ghost.
5. The ghost is freed, the room lights up, and the next room unlocks.

## Rooms (first five)

The lesson content comes from Euphoria's Investing Fundamentals course, lessons 1 to 5, in `content/euphoria/investing-fundamentals-1-5.json`. Suggested rooms:

1. The Foyer: Introduction to Investing
2. The Cellar: Risk vs. Reward
3. The Clock Tower: The Magic of Compound Interest
4. The Portrait Gallery: Stocks vs. Bonds
5. The Kitchen: Diversification (do not keep every egg in one basket)

Each source lesson has about 20 steps. A room should use a short subset: the hook, two or three teaching beats, and one question. The tone can be spookier, but every number and fact must stay exactly as it is in the source.

## UI rules

- A guided flow, one step at a time. A step does not appear until the one before it is done.
- Plain English in complete sentences. Explain any finance word the first time it shows up.
- At most three main actions on any screen.
- While something loads, say "Loading...". Never show an empty screen that looks broken.
- No em dashes or en dashes anywhere in the copy. Use commas, periods, colons or parentheses.
- It must work on a phone and on a desktop browser.
- Respect `prefers-reduced-motion`: show the still frame and skip flicker and shake.
- Everything works with a keyboard.

## Rules from the hackathon

- Sound and music must be original or CC0. No copyrighted music, because the demo video cannot use it.
- No third-party logos or trademarks. Euphoria's own brand is fine.
- The demo video must be under three minutes.

## Not in scope

Accounts, payments, real trading, and the rest of the Euphoria app.
