import { CELLAR } from "./cellar-script";
import { FOYER } from "./foyer-script";
import type { RoomScript } from "./room";

/** The house, in order. Walking through a room's door leads to the next. */
export const ROOMS: RoomScript[] = [FOYER, CELLAR];

/** Rooms planned after the built ones, shown on the end card as coming next. */
export const NEXT_ROOMS = ["The Clock Tower", "The Portrait Gallery", "The Kitchen"];
export const TOTAL_ROOMS = ROOMS.length + NEXT_ROOMS.length;
