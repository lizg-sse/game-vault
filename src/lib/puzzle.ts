import "server-only";

import raw from "@/data/vault.json";
import { hashString, mulberry32, shuffle } from "./prng";
import type { Identity, Player, PublicPlayer, Puzzle, Reveal, Round, Season, SeasonInfo } from "./types";

type Vault = {
  generated: string;
  source: string;
  impactP50: number;
  impactP90: number;
  impactMax: number;
  seasons: Season[];
};

const vault = raw as unknown as Vault;

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

const stripPlayers = (s: Season): SeasonInfo => {
  const { players: _players, ...rest } = s;
  return rest;
};

/** Strip everything that would give the player away. */
const anonymise = (p: Player): PublicPlayer => {
  const { name: _name, img: _img, impact: _impact, ...rest } = p;
  return rest;
};

/**
 * Split franchise history into five chronological windows and draw one season
 * from each, so every vault walks from the ABA days to the present.
 */
function pickSeasons(rand: () => number): Season[] {
  const ordered = [...vault.seasons].sort((a, b) => a.year - b.year);
  const size = ordered.length / ROUNDS;
  const picked: Season[] = [];
  for (let i = 0; i < ROUNDS; i++) {
    const window = ordered.slice(Math.floor(i * size), Math.floor((i + 1) * size));
    picked.push(window[Math.floor(rand() * window.length)]);
  }
  return picked;
}

/**
 * Three players from one roster. Always includes one of the season's genuine
 * top options so the round has a right answer, then fills with different
 * positions so the choice is a real trade-off rather than a stat contest.
 */
function pickOptions(season: Season, rand: () => number, taken: Set<string>): Player[] {
  const eligible = season.players.filter((p) => !taken.has(p.name));
  const pool = (eligible.length >= 3 ? eligible : season.players).slice(0, 9);

  const byImpact = [...pool].sort((a, b) => b.impact - a.impact);
  const anchor = byImpact[Math.floor(rand() * Math.min(3, byImpact.length))];

  const chosen: Player[] = [anchor];
  const roles = new Set([anchor.role]);

  for (const p of shuffle(pool, rand)) {
    if (chosen.length === 3) break;
    if (chosen.some((c) => c.id === p.id)) continue;
    if (roles.has(p.role) && roles.size < 3) continue;
    chosen.push(p);
    roles.add(p.role);
  }
  // Backfill if this roster simply didn't have three distinct roles.
  for (const p of shuffle(pool, rand)) {
    if (chosen.length === 3) break;
    if (!chosen.some((c) => c.id === p.id)) chosen.push(p);
  }

  return shuffle(chosen, rand);
}

/**
 * The full puzzle, identities included. Server-side only — everything the
 * browser receives goes through toPublicPuzzle first.
 */
export type FullRound = { season: SeasonInfo; options: Player[] };

export function buildFullPuzzle(seedKey: string): FullRound[] {
  const rand = mulberry32(hashString(seedKey));
  const seasons = pickSeasons(rand);
  const taken = new Set<string>();

  return seasons.map((season) => {
    const options = pickOptions(season, rand, taken);
    for (const p of options) taken.add(p.name);
    return { season: stripPlayers(season), options };
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
    rounds: rounds.map<Round>((r) => ({ season: r.season, options: r.options.map(anonymise) })),
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
  for (const p of round.options) out[p.id] = { name: p.name, img: p.img } satisfies Identity;
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
  first: vault.seasons[0]?.label,
  last: vault.seasons[vault.seasons.length - 1]?.label,
  source: vault.source,
};
