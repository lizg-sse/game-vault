import { PLAYERS, type Player, type StatKey } from "./players";

export type { Player, StatKey };

export type Category = {
  key: StatKey;
  /** Completes "Who ___ for the Spurs?" */
  prompt: string;
  /** Plural noun shown under the revealed number. */
  noun: string;
  /** Players below this are excluded — keeps rounds meaningful rather than noise. */
  floor: number;
};

export const CATEGORIES: Category[] = [
  { key: "pts", prompt: "scored more points", noun: "points", floor: 400 },
  { key: "trb", prompt: "grabbed more rebounds", noun: "rebounds", floor: 250 },
  { key: "ast", prompt: "dished more assists", noun: "assists", floor: 150 },
  { key: "stl", prompt: "recorded more steals", noun: "steals", floor: 75 },
  { key: "blk", prompt: "blocked more shots", noun: "blocks", floor: 50 },
  { key: "fg3", prompt: "made more three-pointers", noun: "threes made", floor: 50 },
  { key: "ft", prompt: "made more free throws", noun: "free throws", floor: 150 },
  { key: "games", prompt: "played more games", noun: "games", floor: 100 },
  { key: "mp", prompt: "logged more minutes", noun: "minutes", floor: 2000 },
];

export type Round = {
  category: Category;
  left: Player;
  right: Player;
};

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Build a round: a category, then two eligible players with genuinely
 * different totals. `avoid` keeps the previous pair from repeating
 * back-to-back. Falls back across categories so a thin category can never
 * dead-end the game.
 */
export function nextRound(avoid: string[] = []): Round {
  const shuffled = [...CATEGORIES].sort(() => Math.random() - 0.5);

  for (const category of shuffled) {
    const eligible = PLAYERS.filter((p) => p.stats[category.key] >= category.floor);
    const fresh = eligible.filter((p) => !avoid.includes(p.id));
    const pool = fresh.length >= 2 ? fresh : eligible;
    if (pool.length < 2) continue;

    // Try a handful of draws to find two players whose totals aren't tied.
    for (let i = 0; i < 30; i++) {
      const left = pick(pool);
      const right = pick(pool);
      if (left.id === right.id) continue;
      if (left.stats[category.key] === right.stats[category.key]) continue;
      return { category, left, right };
    }
  }

  throw new Error("No eligible matchup could be built from the player pool.");
}

export function formatStat(value: number): string {
  return value.toLocaleString("en-US");
}
