import type { Player } from "./types";

export type StatlinePlayer = Pick<
  Player,
  | "pts"
  | "trb"
  | "ast"
  | "blk"
  | "stl"
  | "fg3Pct"
  | "fg3a"
  | "efgPct"
  | "pct"
  | "g"
  | "mpg"
>;

export type Stat = { key: string; label: string; value: string; pct: number };

const fmt1 = (n: number) => n.toFixed(1);
const fmtPct = (n: number) => (n * 100).toFixed(1).replace(/\.0$/, "");

/**
 * Secondary stats a card can headline, in the order we break ties.
 * Each is only eligible when the underlying number is actually notable —
 * a 0.4 BPG "specialty" would be noise, not a selling point.
 */
const SECONDARY = [
  { key: "trb", label: "RPG", get: (p: StatlinePlayer) => p.trb, floor: 3.5, fmt: fmt1 },
  { key: "ast", label: "APG", get: (p: StatlinePlayer) => p.ast, floor: 2.5, fmt: fmt1 },
  { key: "blk", label: "BPG", get: (p: StatlinePlayer) => p.blk, floor: 0.8, fmt: fmt1 },
  { key: "stl", label: "SPG", get: (p: StatlinePlayer) => p.stl, floor: 1.1, fmt: fmt1 },
  { key: "fg3Pct", label: "3P%", get: (p: StatlinePlayer) => p.fg3Pct, floor: 0.34, fmt: fmtPct },
  { key: "efgPct", label: "eFG%", get: (p: StatlinePlayer) => p.efgPct, floor: 0.5, fmt: fmtPct },
] as const;

/**
 * Points per game plus the two secondary stats this player ranks highest in
 * across the whole vault — so each card leads with what that season was
 * actually known for.
 */
export function headlineStats(player: StatlinePlayer, count = 2): Stat[] {
  const secondaries = SECONDARY.filter((s) => {
    const v = s.get(player);
    // A three-point rate only counts if they actually took threes.
    if (s.key === "fg3Pct" && (player.fg3a ?? 0) < 1.5) return false;
    return v != null && v >= s.floor;
  })
    .map((s) => ({
      key: s.key,
      label: s.label,
      value: s.fmt(s.get(player) as number),
      pct: player.pct[s.key] ?? 0,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, count);

  return [
    { key: "pts", label: "PPG", value: fmt1(player.pts), pct: player.pct.pts ?? 0 },
    ...secondaries,
  ];
}

/** The small print under the headline numbers. */
export function contextLine(player: StatlinePlayer): string {
  const bits = [`${player.g} GP`, `${fmt1(player.mpg)} MPG`];
  if (player.efgPct != null) bits.push(`${fmtPct(player.efgPct)} eFG%`);
  return bits.join("  ·  ");
}

export const formatStat = { fmt1, fmtPct };
