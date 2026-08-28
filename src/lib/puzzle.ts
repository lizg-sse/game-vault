import "server-only";

import raw from "@/data/vault.json";
import { hashString, mulberry32 } from "./prng";
import {
  eligiblePlayerSeasons,
  selectComparableOptions,
} from "./best-of-three-selection";
import { heightForName } from "./heights";
import type { Identity, PlayerSeason, PublicPlayer, Puzzle, Reveal, Round, Season } from "./types";

type Vault = {
  generated: string;
  source: string;
  impactP50: number;
  impactP90: number;
  impactMax: number;
  seasons: Season[];
};

const vault = raw as unknown as Vault;
const bestOfThreeCandidates = eligiblePlayerSeasons(vault.seasons);

export const ROUNDS = 5;

/** San Antonio's clock decides when a new vault opens. */
export const TEAM_TZ = "America/Chicago";

export function todayInSanAntonio(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TEAM_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Vault #1 opened the day the project did. */
const EPOCH = Date.UTC(2026, 7, 1);

export function puzzleNumber(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - EPOCH) / 86_400_000) + 1;
}

/** Strip everything that would give the player away. */
const anonymise = ({ player, season }: PlayerSeason): PublicPlayer => {
  const { name: _name, img: _img, impact: _impact, ...rest } = player;
  return {
    ...rest,
    height: heightForName(player.name) ?? "—",
    season: { year: season.year, label: season.label },
  };
};

/**
 * The full puzzle, identities included. Server-side only — everything the
 * browser receives goes through toPublicPuzzle first.
 */
export type FullRound = { options: PlayerSeason[] };

export function buildFullPuzzle(seedKey: string): FullRound[] {
  const rand = mulberry32(hashString(seedKey));
  const taken = new Set<string>();

  return Array.from({ length: ROUNDS }, () => {
    const options = selectComparableOptions(bestOfThreeCandidates, rand, taken);
    for (const { player } of options) taken.add(player.name);
    return { options };
  });
}

export function toPublicPuzzle(
  seedKey: string,
  daily: boolean,
  dateLabel: string,
  rounds: FullRound[]
): Puzzle {
  return {
    id: seedKey,
    dateLabel,
    daily,
    rounds: rounds.map<Round>((r) => ({ options: r.options.map(anonymise) })),
  };
}

export function buildPuzzle(seedKey: string, daily: boolean, dateLabel: string): Puzzle {
  return toPublicPuzzle(seedKey, daily, dateLabel, buildFullPuzzle(seedKey));
}

/**
 * Puzzles are pure functions of their id, so any round can be rebuilt on
 * demand without keeping server state.
 */
export function revealRound(puzzleId: string, roundIndex: number): Reveal {
  const round = buildFullPuzzle(puzzleId)[roundIndex];
  if (!round) return {};
  const out: Reveal = {};
  for (const { player } of round.options) {
    out[player.id] = { name: player.name, img: player.img } satisfies Identity;
  }
  return out;
}

export const benchmarks = {
  p50: vault.impactP50,
  p90: vault.impactP90,
  max: vault.impactMax,
};

export function dailyPuzzle(): Puzzle {
  const iso = todayInSanAntonio();
  return buildPuzzle(iso, true, formatDateLabel(iso));
}

export function practicePuzzle(seed: string): Puzzle {
  return buildPuzzle(`practice-${seed}`, false, "Practice Vault");
}

export const vaultMeta = {
  seasons: vault.seasons.length,
  playerSeasons: vault.seasons.reduce((n, s) => n + s.players.length, 0),
  bestOfThreePlayerSeasons: bestOfThreeCandidates.length,
  first: vault.seasons[0]?.label,
  last: vault.seasons[vault.seasons.length - 1]?.label,
  source: vault.source,
};
