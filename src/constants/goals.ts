import type { ActivityType } from '../types';

/** Soft, local-only "today's goal" used purely to drive the progress ring — not stored or synced. */
export const DAILY_GOAL_METERS: Record<ActivityType, number> = {
  running: 5000,
  cycling: 15000,
};
