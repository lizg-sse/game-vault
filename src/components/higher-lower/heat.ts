/**
 * How hot a streak is running.
 *
 * The tiers below only name the fire — they don't size it. `heat` and `fire`
 * are continuous, so a streak of 12 genuinely burns harder than a streak of 8
 * rather than hitting a ceiling the moment the banner changes.
 */

/** Warmth creeps in from here… */
export const HEAT_FROM = 2;
/** …and is at full strength here. */
export const HEAT_TO = 5;
/** Flame catches from here… */
export const FIRE_FROM = 4;
/** …and reaches an inferno here. */
export const FIRE_TO = 12;

/** Indexed by `tierFor`. Empty at tier 0 — a cold board says nothing. */
export const TIERS = ["", "Heating up", "On fire", "He's on fire!"] as const;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** 0→1 across streaks 2–5. Drives the warm vignette and the counter's border. */
export function heatFor(streak: number) {
  return clamp01((streak - HEAT_FROM) / (HEAT_TO - HEAT_FROM));
}

/** 0→1 across streaks 4–12. Drives the flames, embers and counter glow. */
export function fireFor(streak: number) {
  return clamp01((streak - FIRE_FROM) / (FIRE_TO - FIRE_FROM));
}

export function tierFor(streak: number) {
  if (streak >= 8) return 3;
  if (streak >= 5) return 2;
  if (streak >= 3) return 1;
  return 0;
}
