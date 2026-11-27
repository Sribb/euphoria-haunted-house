import story from "../../content/euphoria/if1-story.json";
import { miserCalm, miserFreed, miserRestless } from "../art/miser";
import type { StoryCue, StoryLabel } from "../lib/pixel/story/types";
import { buildFoyer } from "./foyer";
import { choiceQuestion, takeaways, trueFalseQuestion } from "./lesson";
import { beat, movieKit, type MovieBeat, type Toggle } from "./movies";
import type { RoomScript } from "./room";

/**
 * Room 1, The Foyer: Investing Fundamentals lesson 1, Introduction to Investing. The ghost is the Miser,
 * who kept every dollar in a drawer. Lesson text is Euphoria's own; only the haunted framing is new.
 *   drawer    = the story "Maya's birthday money" (inflation)
 *   portraits = the toggles "own a piece" and "lend it"
 *   clock     = the growth ledger's years, then the lesson's "time does most of the work" card
 */
const kit = movieKit(story);
const cards = takeaways(1);

// the clock: growth on growth, with the ledger's numbers (5% a year on $100)
const ledger = story.ledger as { start: number; ratePercent: number; captions: { start: string; years: string[] } };
const money = (v: number) => `$${v.toFixed(2).replace(/\.00$/, "")}`;
const totals = [1, 2, 3].map((y) => ledger.start * (1 + ledger.ratePercent / 100) ** y);
const label = (id: string, text: string, x: number, y: number, tone: StoryLabel["tone"] = "accent"): StoryLabel => ({ id, text, at: { x, y }, tone });
const glint = (x: number, y: number, atMs = 300): StoryCue => ({ actor: "glint", do: "play", at: { x, y }, atMs });
const clockBeats: MovieBeat[] = [
  beat("coin-plus", ledger.captions.start, [glint(44, 32)], [label("total", money(ledger.start), 28, 52), label("rate", "+5% a year", 50, 52, "ink")]),
  beat("stacks", ledger.captions.years[0], [glint(36, 44)], [label("total", money(totals[0]), 28, 52)]),
  beat("stacks", ledger.captions.years[1], [glint(51, 41)], [label("total", money(totals[1]), 28, 52)]),
  beat("stacks", ledger.captions.years[2], [glint(65, 36)], [label("total", money(totals[2]), 28, 52)]),
  beat("orchard-moon", `${cards[2].takeaway}. ${cards[2].detail}`, [glint(59, 30, 400), glint(65, 27, 900), glint(70, 17, 1400)]),
];

const NAME = "The Miser";

export const FOYER: RoomScript = {
  num: 1,
  key: "foyer",
  name: "The Foyer",
  build: buildFoyer,
  movies: {
    drawer: kit.make("drawer", 1, "A memory in the drawer", kit.storyTitle, "Why the safest place for money is not safe", kit.storyBeats(), { sprite: miserCalm, beat: 2, x: 5, y: 15 }),
    portraits: kit.make(
      "portraits",
      2,
      "The portraits remember",
      "Own a piece, or lend it",
      "Two ways to put money to work",
      [...kit.toggleBeats(story.own as Toggle), ...kit.toggleBeats(story.lend as Toggle)],
      { sprite: miserCalm, beat: 5, x: 9, y: -2 },
    ),
    clock: kit.make("clock", 3, "The clock strikes", "Watch Maya's money grow", "Growth on growth", clockBeats, { sprite: miserCalm, beat: 3, x: 46, y: 3 }),
  },
  clueLabels: { drawer: "Open the drawer", portraits: "Look at the portraits", clock: "Look at the clock" },
  ghost: { name: NAME, restless: miserRestless, calm: miserCalm, freed: miserFreed, light: "#D63A3A" },
  lines: {
    tooSoon: [
      { speaker: NAME, text: "Leave my house. You know nothing about money." },
      { text: "The room is too dark. Find the three things the Miser left behind, and light the candles." },
    ],
    intro: [
      { speaker: NAME, text: "So. You have been through my things." },
      { speaker: NAME, text: "Then answer me, child. Answer me true, and I will let you pass." },
    ],
    freed: [
      { speaker: NAME, text: "I hid it all in that drawer. Every dollar. I thought I was keeping it safe." },
      { speaker: NAME, text: "Thank you. I can rest now. The door is yours." },
    ],
    right: ["...Yes.", "Hm. Correct.", "You do know something."],
    wrong: ["WRONG.", "No...", "Again!"],
  },
  questions: [
    choiceQuestion(1, "microCheck"),
    choiceQuestion(1, "quiz"),
    trueFalseQuestion(1, "Holding cash", cards[0].detail),
  ],
};
