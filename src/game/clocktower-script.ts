import story from "../../content/euphoria/if3-story.json";
import { clockmakerCalm, clockmakerFreed, clockmakerRestless } from "../art/clockmaker";
import { buildClockTower } from "./clocktower";
import { choiceQuestion, takeaways, trueFalseQuestion } from "./lesson";
import { beat, movieKit, type Toggle } from "./movies";
import type { RoomScript } from "./room";

/**
 * Room 3, The Clock Tower: Investing Fundamentals lesson 3, The Magic of Compound Interest. The ghost is
 * the Clockmaker, who always meant to start tomorrow. Lesson text is Euphoria's own; only the haunted
 * framing is new.
 *   gears       = the story "Time to grow" (gains earn gains)
 *   notes       = the toggle "The rule of 72"
 *   hourglasses = the lesson's idea and takeaway cards on their own stills (sooner beats bigger)
 */
const kit = movieKit(story);
const cards = takeaways(3);
const NAME = "The Clockmaker";
const { idea, takeaway } = story;

export const CLOCK_TOWER: RoomScript = {
  num: 3,
  key: "clocktower",
  name: "The Clock Tower",
  build: buildClockTower,
  movies: {
    gears: kit.make("gears", 1, "The gears remember", kit.storyTitle, "Gains that earn gains", kit.storyBeats(), { sprite: clockmakerCalm, beat: 2, x: 18, y: 6 }),
    notes: kit.make("notes", 2, "The Clockmaker's notes", (story.toggle as Toggle).title, "How long until money doubles", kit.toggleBeats(story.toggle as Toggle), { sprite: clockmakerCalm, beat: 2, x: 24, y: -1 }),
    hourglasses: kit.make(
      "hourglasses",
      3,
      "Two hourglasses",
      "Sooner beats bigger",
      "What starting early is worth",
      [beat(idea.still, `${idea.title}. ${idea.body}`), beat(idea.still, idea.explain), beat(takeaway.still, takeaway.body), beat(takeaway.still, takeaway.explain)],
      { sprite: clockmakerCalm, beat: 3, x: 26, y: 2 },
    ),
  },
  clueLabels: { gears: "Watch the gears", notes: "Read the Clockmaker's notes", hourglasses: "Look at the hourglasses" },
  ghost: { name: NAME, restless: clockmakerRestless, calm: clockmakerCalm, freed: clockmakerFreed, light: "#D63A3A" },
  lines: {
    tooSoon: [
      { speaker: NAME, text: "Not now. Come back tomorrow. There is always tomorrow." },
      { text: "The tower is too dark to read its clocks. Find the three things the Clockmaker left, and light the candles." },
    ],
    intro: [
      { speaker: NAME, text: "You wound my gears. You read my notes." },
      { speaker: NAME, text: "Then tell me what I never worked out in time. Three questions." },
    ],
    freed: [
      { speaker: NAME, text: "I built a thousand clocks and never once started my own. I kept saying tomorrow." },
      { speaker: NAME, text: "Start early. Let time do the work. Go on, the door is open." },
    ],
    right: ["Tick. Correct.", "Right on time.", "Yes. Precisely."],
    wrong: ["Too late!", "Wrong. Time is wasting.", "No. Think again."],
  },
  questions: [
    choiceQuestion(3, "microCheck"),
    choiceQuestion(3, "quiz"),
    trueFalseQuestion(3, "You need at least $10,000", `${cards[2].takeaway}. ${cards[2].detail}`),
  ],
};
