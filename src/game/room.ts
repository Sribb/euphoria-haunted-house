import type * as THREE from "three";
import type { PixelSprite } from "../lib/pixel/types";
import type { Billboard } from "./billboard";
import type { Candle } from "./candles";
import type { Movie } from "./movies";

/**
 * What every room provides. A room is two halves: its 3D build (geometry, lights, clues, candles, the
 * doorway) and its script (the lesson's ghost, lines, questions and movies). main.ts runs any room
 * through the same loop: explore, light three candles, face the ghost, walk through the door.
 */

export type Rect = { x0: number; z0: number; x1: number; z1: number };
export type Clue = { id: string; at: THREE.Vector3; radius: number; candle: number; wisp: Billboard; found: boolean };

export type Room = {
  scene: THREE.Scene;
  colliders: Rect[];
  /** Where the player's centre can go, before colliders. */
  bounds: { x0: number; x1: number; z0: number; z1: number };
  clues: Clue[];
  candles: Candle[];
  ghostHome: THREE.Vector3;
  /** The doorway out: walkable once it opens. `exitZ` is how far in the player walks to leave. */
  door: { x0: number; x1: number; z: number; corridorZ: number; exitZ: number };
  /** Where the player starts, and the part of the world the camera may show (screen axes). */
  spawn: THREE.Vector3;
  view: { x0: number; x1: number; u0: number; u1: number };
  state: { doorOpen: boolean; roomGlow: number; sealFade: number };
  update: (dt: number, t: number, camera: THREE.Camera, reducedMotion: boolean) => void;
  /** The ghost is free: light the room and unseal the door. */
  celebrate: () => void;
};

export type Question = { prompt: string; options: string[]; correct: number; right: string; wrong: string };
export type Page = { speaker?: string; title?: string; text: string };

export type RoomScript = {
  num: number;
  key: string;
  name: string;
  build: () => Room;
  movies: Record<string, Movie>;
  clueLabels: Record<string, string>;
  ghost: { name: string; restless: PixelSprite; calm: PixelSprite; freed: PixelSprite; light: string };
  lines: { tooSoon: Page[]; intro: Page[]; freed: Page[]; right: string[]; wrong: string[] };
  questions: Question[];
};
