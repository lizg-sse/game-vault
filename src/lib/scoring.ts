import type { Player, PlayerSeason, SeasonInfo } from "./types";

/**
 * THE VAULT SCORE — 100 points, four components.
 *
 * The game is a judgement test, so the biggest slice rewards picking the best
 * player actually on the table rather than just accumulating raw counting
 * stats. The rest rewards building a team Pop would recognise.
 */
export const COMPONENTS = [
  { key: "production", label: "Production", max: 40, blurb: "Did you take the best player on the board?" },
  { key: "balance", label: "Roster Fit", max: 25, blurb: "Positions and skills covered." },
  { key: "starPower", label: "Star Power", max: 20, blurb: "Franchise-level seasons on the roster." },
  { key: "efficiency", label: "Efficiency", max: 15, blurb: "Shooting quality, weighted by volume." },
] as const;

export type ComponentKey = (typeof COMPONENTS)[number]["key"];

export type RoundGrade = {
  season: SeasonInfo;
  pick: Player;
  /** The highest-impact player that was available in this round. */
  best: Player;
  /** 1 = best available, 2 = middle, 3 = worst of the three. */
  rank: number;
  /** pick.impact / best.impact */
  ratio: number;
};

export type Grade = {
  total: number;
  tier: { name: string; note: string };
  parts: Record<ComponentKey, number>;
  rounds: RoundGrade[];
  roster: Player[];
  rings: number;
  roleCounts: Record<"G" | "W" | "B", number>;
  coverage: { key: string; label: string; met: boolean; by: Player | null }[];
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Skill boxes a complete roster should tick. */
const COVERAGE = [
  { key: "creator", label: "Primary creator", test: (p: Player) => (p.ast ?? 0) >= 5 },
  { key: "glass", label: "Rebounding anchor", test: (p: Player) => (p.trb ?? 0) >= 8 },
  { key: "stopper", label: "Defensive presence", test: (p: Player) => (p.stl ?? 0) + (p.blk ?? 0) >= 2.2 },
  { key: "bucket", label: "Go-to scorer", test: (p: Player) => p.pts >= 19 },
];

const TIERS: { min: number; name: string; note: string }[] = [
  { min: 93, name: "Dynasty", note: "Five banners' worth of judgement." },
  { min: 85, name: "Contender", note: "This team wins 58 and scares everybody." },
  { min: 76, name: "Playoff Lock", note: "Solid roster. Second round is the ceiling." },
  { min: 66, name: "Play-In Team", note: "Talent, but the pieces don't quite fit." },
  { min: 55, name: "Lottery Bound", note: "Some nice seasons, no real plan." },
  { min: 0, name: "Teardown", note: "Pop would trade all five for a second-rounder." },
];

export function gradeRoster(
  rounds_: { options: PlayerSeason[] }[],
  pickIds: string[],
  benchmarks: { p50: number; p90: number }
): Grade {
  const rounds: RoundGrade[] = rounds_.map((round, i) => {
    const picked = round.options.find((row) => row.player.id === pickIds[i]) ?? round.options[0];
    if (!picked) throw new Error(`Round ${i + 1} has no player options`);
    const ordered = [...round.options].sort((a, b) => b.player.impact - a.player.impact);
    const pick = picked.player;
    const best = ordered[0].player;
    return {
      season: picked.season,
      pick,
      best,
      rank: ordered.findIndex(({ player }) => player.id === pick.id) + 1,
      ratio: best.impact > 0 ? pick.impact / best.impact : 1,
    };
  });

  const roster = rounds.map((r) => r.pick);
  const { p50, p90 } = benchmarks;

  // Production — mean share of the best available impact, stretched so that
  // consistently taking the top option is what earns full marks.
  const meanRatio = rounds.reduce((s, r) => s + r.ratio, 0) / rounds.length;
  const production = 40 * clamp01((meanRatio - 0.55) / 0.45);

  // Star power — how far each pick sits between a median and a top-decile
  // Spurs season.
  const starMean =
    roster.reduce((s, p) => s + clamp01((p.impact - p50) / (p90 - p50)), 0) / roster.length;
  const starPower = 20 * starMean;

  // Efficiency — minutes-weighted true roster shooting against a .500 baseline.
  const totalMin = roster.reduce((s, p) => s + p.mpg, 0);
  const efg = roster.reduce((s, p) => s + (p.efgPct ?? 0.48) * p.mpg, 0) / (totalMin || 1);
  const efficiency = 15 * clamp01((efg - 0.455) / 0.09);

  // Roster fit — positional spread plus skill coverage.
  const roleCounts = { G: 0, W: 0, B: 0 };
  for (const p of roster) roleCounts[p.role]++;
  const present = Object.values(roleCounts).filter((n) => n > 0).length;
  const maxBucket = Math.max(...Object.values(roleCounts));
  const positional = Math.max(0, 13 * (present / 3) - 2 * Math.max(0, maxBucket - 3));

  const coverage = COVERAGE.map((c) => {
    const by = roster.find(c.test) ?? null;
    return { key: c.key, label: c.label, met: by !== null, by };
  });
  const balance = positional + coverage.filter((c) => c.met).length * 3;

  const parts = {
    production: round1(production),
    balance: round1(balance),
    starPower: round1(starPower),
    efficiency: round1(efficiency),
  };

  const total = Math.round(production + balance + starPower + efficiency);
  const tier = TIERS.find((t) => total >= t.min)!;
  const rings = rounds.filter((r) => r.season.title).length;

  return { total, tier, parts, rounds, roster, rings, roleCounts, coverage };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export const ROLE_LABEL: Record<"G" | "W" | "B", string> = {
  G: "Guard",
  W: "Wing",
  B: "Big",
};
