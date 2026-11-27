import data from "../../content/euphoria/investing-fundamentals-1-5.json";
import type { ClueId } from "./foyer";

/**
 * The Foyer's script. Lesson text comes straight from Euphoria's Investing Fundamentals lesson 1, so
 * every number and fact is the source's. Only the haunted framing lines (the Miser's voice, what you see
 * when you open a drawer) are new.
 */

type Step = Record<string, unknown> & { type: string };
const lesson = (data as { lessons: { title: string; steps: Step[] }[] }).lessons[0];
const step = <T extends Step>(type: string, nth = 0) => lesson.steps.filter((s) => s.type === type)[nth] as T;

const micro = step<Step & { question: string; options: string[]; correct: number; explanationCorrect: string; explanationWrong: string }>("microCheck");
const quiz = step<Step & { question: string; options: string[]; correct: number; explanation: string }>("quiz");
const tf = step<Step & { statements: { s: string; a: boolean }[] }>("trueFalse");
const cards = step<Step & { cards: { takeaway: string; detail: string }[] }>("summaryCards").cards;

export const LESSON_TITLE = lesson.title;

export type Page = { speaker?: string; title?: string; text: string };

export const CLUE_LABEL: Record<ClueId, string> = { drawer: "Open the drawer", portraits: "Look at the portraits", clock: "Look at the clock" };

export const GHOST_NAME = "The Miser";

export const GHOST_LINES = {
  tooSoon: [
    { speaker: GHOST_NAME, text: "Leave my house. You know nothing about money." },
    { text: "The room is too dark. Find the three things the Miser left behind, and light the candles." },
  ],
  intro: [
    { speaker: GHOST_NAME, text: "So. You have been through my things." },
    { speaker: GHOST_NAME, text: "Then answer me, child. Answer me true, and I will let you pass." },
  ],
  freed: [
    { speaker: GHOST_NAME, text: "I hid it all in that drawer. Every dollar. I thought I was keeping it safe." },
    { speaker: GHOST_NAME, text: "Thank you. I can rest now. The door is yours." },
  ],
  right: ["...Yes.", "Hm. Correct.", "You do know something."],
  wrong: ["WRONG.", "No...", "Again!"],
};

export type Question = { prompt: string; options: string[]; correct: number; right: string; wrong: string };

export const QUESTIONS: Question[] = [
  { prompt: micro.question, options: micro.options, correct: micro.correct, right: micro.explanationCorrect, wrong: micro.explanationWrong },
  { prompt: quiz.question, options: quiz.options, correct: quiz.correct, right: quiz.explanation, wrong: quiz.explanation },
  (() => {
    const st = tf.statements.find((x) => x.s.startsWith("Holding cash"))!;
    return { prompt: `True or false: ${st.s}`, options: ["True", "False"], correct: st.a ? 0 : 1, right: cards[0].detail, wrong: cards[0].detail };
  })(),
];
