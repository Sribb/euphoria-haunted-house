import story from "../../content/euphoria/if5-story.json";
import { cookCalm, cookFreed, cookRestless } from "../art/cook";
import { buildKitchen } from "./kitchen";
import { choiceQuestion, takeaways, trueFalseQuestion } from "./lesson";
import { beat, movieKit, type Toggle } from "./movies";
import type { RoomScript } from "./room";

/**
 * Room 5, The Kitchen: Investing Fundamentals lesson 5, Diversification. The ghost is the Cook, who
 * carried every egg he owned in one basket. Lesson text is Euphoria's own; only the haunted framing is new.
 *   basket = the story "All in one piece" (everything in one company)
 *   jars   = the toggle "One company or many" (what spreading out changes, and what it cannot)
 *   recipe = the lesson's idea and takeaway cards on their own stills (a real year, and the name for it)
 */
const kit = movieKit(story);
const cards = takeaways(5);
const NAME = "The Cook";
const { idea, takeaway } = story;
const toggle = story.toggle as Toggle;

export const KITCHEN: RoomScript = {
  num: 5,
  key: "kitchen",
  name: "The Kitchen",
  build: buildKitchen,
  movies: {
    basket: kit.make("basket", 1, "A memory in the basket", kit.storyTitle, "Everything in one place", kit.storyBeats()),
    jars: kit.make("jars", 2, "The pantry remembers", toggle.title, "What spreading out changes", kit.toggleBeats(toggle)),
    recipe: kit.make("recipe", 3, "The Cook's last recipe", "Spread it out", "Why one bad company hurts less", [
      beat(idea.still, `${idea.title}. ${idea.body}`),
      beat(idea.still, idea.explain),
      beat(takeaway.still, takeaway.body),
      beat(takeaway.still, takeaway.explain),
    ]),
  },
  clueLabels: { basket: "Look in the basket", jars: "Count the jars on the shelf", recipe: "Read the Cook's recipe book" },
  ghost: { name: NAME, restless: cookRestless, calm: cookCalm, freed: cookFreed, light: "#FF9A3C" },
  lines: {
    tooSoon: [
      { speaker: NAME, text: "Out of my kitchen! I am counting my eggs. All of them. In here." },
      { text: "The kitchen is too dark to cook in. Find the three things the Cook left, and light the candles." },
    ],
    intro: [
      { speaker: NAME, text: "You looked in my basket. You counted my jars." },
      { speaker: NAME, text: "Then tell me where my recipe went wrong. Three questions." },
    ],
    freed: [
      { speaker: NAME, text: "Every egg I owned, in one basket. One slip on the stairs, and I had nothing." },
      { speaker: NAME, text: "Spread them out, little one. Many baskets. Go on, the way out is open." },
    ],
    right: ["Delicious. Correct.", "Yes, chef.", "Perfectly done."],
    wrong: ["Burnt! No.", "Wrong. Taste it again.", "No, no, no."],
  },
  questions: [
    choiceQuestion(5, "microCheck"),
    choiceQuestion(5, "quiz"),
    trueFalseQuestion(5, "Owning 30 tech stocks", `${cards[2].takeaway}. ${cards[2].detail}`),
  ],
};
