import story from "../../content/euphoria/if4-story.json";
import { duchessCalm, duchessFreed, duchessRestless } from "../art/duchess";
import { buildGallery } from "./gallery";
import { choiceQuestion, takeaways, trueFalseQuestion } from "./lesson";
import { movieKit, type Toggle } from "./movies";
import type { RoomScript } from "./room";

/**
 * Room 4, The Portrait Gallery: Investing Fundamentals lesson 4, Stocks vs. Bonds. The ghost is the
 * Duchess, who lent to one company and owned a piece of another and never learned which gets paid first.
 * Lesson text is Euphoria's own; only the haunted framing is new.
 *   case      = the story "Moon Tees needs a printer" (a loan and a piece)
 *   portraits = the toggles "Sriyan's loan" and "Sid's piece" (what each is promised)
 *   lectern   = the toggles "If Moon Tees goes broke" and "Savings, bonds and stocks"
 */
const kit = movieKit(story);
const toggles = story.toggles as Toggle[];
const cards = takeaways(4);
const NAME = "The Duchess";

export const GALLERY: RoomScript = {
  num: 4,
  key: "gallery",
  name: "The Portrait Gallery",
  build: buildGallery,
  movies: {
    case: kit.make("case", 1, "A memory in the glass", kit.storyTitle, "Two ways to raise money", kit.storyBeats(), { sprite: duchessCalm, beat: 1, x: 49, y: 14 }),
    portraits: kit.make(
      "portraits",
      2,
      "The portraits remember",
      "The lender and the owner",
      "What each one is promised",
      [...kit.toggleBeats(toggles[0]), ...kit.toggleBeats(toggles[1])],
      { sprite: duchessCalm, beat: 5, x: 54, y: -4 },
    ),
    lectern: kit.make("lectern", 3, "The last auction", toggles[2].title, "Who gets paid first", [...kit.toggleBeats(toggles[2]), ...kit.toggleBeats(toggles[3])], {
      sprite: duchessCalm,
      beat: 2,
      x: 54,
      y: -4,
    }),
  },
  clueLabels: { case: "Look in the display case", portraits: "Look at the two portraits", lectern: "Read the auction notice" },
  ghost: { name: NAME, restless: duchessRestless, calm: duchessCalm, freed: duchessFreed, light: "#E0559F" },
  lines: {
    tooSoon: [
      { speaker: NAME, text: "You may look, child. You may not touch. And you may not pass." },
      { text: "The gallery is too dark to see its paintings. Find the three things the Duchess left, and light the candles." },
    ],
    intro: [
      { speaker: NAME, text: "You have studied my collection. Good." },
      { speaker: NAME, text: "Then you can tell a lender from an owner. Prove it. Three questions." },
    ],
    freed: [
      { speaker: NAME, text: "I lent to one and owned a piece of the other. When they failed, I learned who is paid first. Too late." },
      { speaker: NAME, text: "Now you know before you need to. Go on. The last door is open." },
    ],
    right: ["Exquisite.", "Quite right.", "You have an eye for it."],
    wrong: ["How vulgar. No.", "Wrong, darling.", "No. Look again."],
  },
  questions: [
    choiceQuestion(4, "microCheck"),
    choiceQuestion(4, "quiz"),
    trueFalseQuestion(4, "Stocks represent ownership", `${cards[0].takeaway}. ${cards[0].detail}`),
  ],
};
