import story from "../../content/euphoria/if2-story.json";
import { gamblerCalm, gamblerFreed, gamblerRestless } from "../art/gambler";
import { buildCellar } from "./cellar";
import { choiceQuestion, takeaways, trueFalseQuestion } from "./lesson";
import { movieKit, type Toggle } from "./movies";
import type { RoomScript } from "./room";

/**
 * Room 2, The Cellar: Investing Fundamentals lesson 2, Risk vs. Reward. The ghost is the Gambler, who
 * put everything on one bet. Lesson text is Euphoria's own; only the haunted framing is new.
 *   crate   = the story "Ups and downs" (Sunny Juice swings; a drawdown)
 *   barrels = the toggle "Bonds, stocks, or a mix"
 *   tallies = the toggle "Big US stocks, kept longer"
 */
const kit = movieKit(story);
const cards = takeaways(2);
const NAME = "The Gambler";

export const CELLAR: RoomScript = {
  num: 2,
  key: "cellar",
  name: "The Cellar",
  build: buildCellar,
  movies: {
    crate: kit.make("crate", 1, "A memory in the crate", kit.storyTitle, "What can grow more can also drop more", kit.storyBeats(), { sprite: gamblerCalm, beat: 1, x: 50, y: 14 }),
    barrels: kit.make("barrels", 2, "The barrels remember", (story.mix as Toggle).title, "How far each one can fall", kit.toggleBeats(story.mix as Toggle), { sprite: gamblerCalm, beat: 2, x: 36, y: 8 }),
    tallies: kit.make("tallies", 3, "Someone kept count", (story.longer as Toggle).title, "Time turns a risky year into a safer stretch", kit.toggleBeats(story.longer as Toggle), { sprite: gamblerCalm, beat: 0, x: -4, y: 12 }),
  },
  clueLabels: { crate: "Open the juice crate", barrels: "Read the barrels", tallies: "Look at the tally marks" },
  ghost: { name: NAME, restless: gamblerRestless, calm: gamblerCalm, freed: gamblerFreed, light: "#E8661C" },
  lines: {
    tooSoon: [
      { speaker: NAME, text: "Care for a wager, kid? No? Then get out of my cellar." },
      { text: "It is too dark to see what the Gambler is hiding. Find the three clues down here and light the candles." },
    ],
    intro: [
      { speaker: NAME, text: "You've been counting my marks. Fine." },
      { speaker: NAME, text: "Let's play. Three questions. Win them all and the door is yours." },
    ],
    freed: [
      { speaker: NAME, text: "I bet it all on one stock. One bad year, and it was gone." },
      { speaker: NAME, text: "Spread it out and give it time. That's the real trick. Go on, the door's open." },
    ],
    right: ["Ha. Good call.", "Lucky... or smart.", "The house loses this one."],
    wrong: ["Bust!", "Bad bet.", "The house wins."],
  },
  questions: [
    choiceQuestion(2, "microCheck"),
    choiceQuestion(2, "quiz"),
    trueFalseQuestion(2, "Cash in a savings account", `${cards[2].takeaway}. ${cards[2].detail}`),
  ],
};
