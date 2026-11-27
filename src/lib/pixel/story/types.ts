// Reused from Euphoria (euphoriaweb src/lib/pixel/story/types.ts, branch story-lessons), copied on 2026-11-27.
// Only change: the import path for the sprite types. See "Reused from Euphoria" in the README.
import type { PixelSprite } from "../types";

/**
 * The story data the carousel plays, in the iPhone app's own shapes (euphoria-native
 * src/lib/mobile-lesson/parts/story.ts and src/lib/pixel/scenes/types.ts), as copied by
 * scripts/export-story-reel.mjs. Scene coordinates are pixels on the 80 x 60 story stage.
 */
export interface ScenePoint { x: number; y: number }

export type ReelMotion = { kind: "bob" | "drift" | "twinkle" | "rise"; amp?: number; periodMs: number; phase?: number; min?: number };
export interface ReelLayer { sprite: PixelSprite; x: number; y: number; motion?: ReelMotion }
export interface ReelFrame { base: PixelSprite; layers: ReelLayer[] }

export interface StoryCue {
  actor: string;
  do: "enter" | "slide" | "exit" | "stamp" | "play" | "count" | "ghost";
  at?: ScenePoint;
  from?: ScenePoint;
  instant?: boolean;
  walk?: boolean;
  n?: number;
  perRow?: number;
  gap?: number;
  index?: number;
  ghostSprite?: string;
  times?: number;
  atMs?: number;
  ms?: number;
}

export interface StoryLabel { id: string; text: string; at: ScenePoint; tone: "ink" | "accent" | "muted" | "warn" }

export interface ReelBeat { frame: string; caption: string; cast: StoryCue[]; labels: StoryLabel[] }

export interface ReelLesson {
  num: number;
  title: string;
  frames: Record<string, ReelFrame>;
  actors: Record<string, PixelSprite>;
  /** Drawing order for actors, back to front; unlisted actors draw after, in first-appearance order. */
  order: string[];
  beats: ReelBeat[];
}
