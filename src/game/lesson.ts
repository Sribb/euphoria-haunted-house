import data from "../../content/euphoria/investing-fundamentals-1-5.json";
import type { Question } from "./room";

/**
 * Reads Euphoria's lesson content (Investing Fundamentals 1 to 5) for the rooms. Every question, option
 * and explanation is the lesson's own text, so numbers and facts stay exactly as Euphoria teaches them.
 */

type Step = Record<string, unknown> & { type: string };
const lessons = (data as { lessons: { title: string; steps: Step[] }[] }).lessons;

/** Lesson `n` (1-based). */
export const lesson = (n: number) => lessons[n - 1];

/** The `nth` step of a type in lesson `n`. */
export const stepOf = <T extends Step>(n: number, type: string, nth = 0) => lesson(n).steps.filter((s) => s.type === type)[nth] as T;

type Choice = Step & { question: string; options: string[]; correct: number; explanation?: string; explanationCorrect?: string; explanationWrong?: string };

/** A microCheck or quiz as an encounter question. */
export const choiceQuestion = (n: number, type: "microCheck" | "quiz", nth = 0): Question => {
  const s = stepOf<Choice>(n, type, nth);
  return {
    prompt: s.question,
    options: s.options,
    correct: s.correct,
    right: s.explanationCorrect ?? s.explanation ?? "",
    wrong: s.explanationWrong ?? s.explanation ?? "",
  };
};

/** One statement from a lesson's true-or-false set, explained with a takeaway card from the same lesson. */
export const trueFalseQuestion = (n: number, startsWith: string, why: string): Question => {
  const set = stepOf<Step & { statements: { s: string; a: boolean }[] }>(n, "trueFalse");
  const st = set.statements.find((x) => x.s.startsWith(startsWith));
  if (!st) throw new Error(`lesson ${n} has no true-or-false statement starting "${startsWith}"`);
  return { prompt: `True or false: ${st.s}`, options: ["True", "False"], correct: st.a ? 0 : 1, right: why, wrong: why };
};

/** A lesson's takeaway cards. */
export const takeaways = (n: number) => stepOf<Step & { cards: { takeaway: string; detail: string }[] }>(n, "summaryCards").cards;
