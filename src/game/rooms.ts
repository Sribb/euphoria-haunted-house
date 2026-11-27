import { CELLAR } from "./cellar-script";
import { CLOCK_TOWER } from "./clocktower-script";
import { FOYER } from "./foyer-script";
import { GALLERY } from "./gallery-script";
import type { RoomScript } from "./room";

/** The house, in order. Walking through a room's door leads to the next. */
export const ROOMS: RoomScript[] = [FOYER, CELLAR, CLOCK_TOWER, GALLERY];

/** Rooms planned after the built ones, shown on the end card as coming next. */
export const NEXT_ROOMS = ["The Kitchen"];
export const TOTAL_ROOMS = ROOMS.length + NEXT_ROOMS.length;
