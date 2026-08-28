import { shuffle } from "./prng";
import type { PlayerSeason, Season, SeasonInfo } from "./types";

/** A modern cut means seasons beginning in 2010-11 or later. */
export const MODERN_SEASON_START = 2011;

/** Historical Spurs players intentionally kept in the modern player pool. */
export const EXCEPTIONAL_PLAYER_NAMES = [
  "Tim Duncan",
  "Tony Parker",
  "Manu Ginóbili",
  "David Robinson",
  "George Gervin",
  "Boris Diaw",
  "Matt Bonner",
  "Patty Mills",
  "Sean Elliott",
  "Bruce Bowen",
  "Tiago Splitter",
  "Avery Johnson",
  "Robert Horry",
  "Richard Jefferson",
] as const;

export const EXCLUDED_PLAYER_NAMES = ["Kawhi Leonard"] as const;

const exceptionalNames = new Set<string>(EXCEPTIONAL_PLAYER_NAMES);
const excludedNames = new Set<string>(EXCLUDED_PLAYER_NAMES);

const MIN_GAMES = 20;
const MIN_MINUTES = 10;
const MAX_POINTS_SPREAD = 5;
const MAX_IMPACT_SPREAD = 12;
const MAX_NEARBY_CANDIDATES = 24;

type SeasonWithPlayers = Season;

const stripPlayers = (season: SeasonWithPlayers): SeasonInfo => {
  const { players: _players, ...info } = season;
  return info;
};

export function isEligiblePlayerSeason(seasonYear: number, playerName: string): boolean {
  return (
    !excludedNames.has(playerName) &&
    (seasonYear >= MODERN_SEASON_START || exceptionalNames.has(playerName))
  );
}

/** Flatten the vault into anonymous-ready season rows, keeping the full season metadata. */
export function eligiblePlayerSeasons(seasons: SeasonWithPlayers[]): PlayerSeason[] {
  return seasons.flatMap((season) => {
    if (!season.players.length) return [];
    const seasonInfo = stripPlayers(season);
    return season.players
      .filter((player) => isEligiblePlayerSeason(season.year, player.name))
      .map((player) => ({ season: seasonInfo, player }));
  });
}

function weightedPick<T>(items: T[], weight: (item: T) => number, rand: () => number): T {
  const total = items.reduce((sum, item) => sum + Math.max(0, weight(item)), 0);
  if (total <= 0) return items[Math.floor(rand() * items.length)];

  let cursor = rand() * total;
  for (const item of items) {
    cursor -= Math.max(0, weight(item));
    if (cursor <= 0) return item;
  }
  return items.at(-1)!;
}

function playable(row: PlayerSeason): boolean {
  return row.player.g >= MIN_GAMES && row.player.mpg >= MIN_MINUTES;
}

/** Lower is closer across the two signals a player sees first: PPG and impact. */
export function comparisonDistance(a: PlayerSeason, b: PlayerSeason): number {
  return (
    Math.abs(a.player.pts - b.player.pts) / 4 +
    Math.abs(a.player.impact - b.player.impact) / 9 +
    Math.abs(a.player.mpg - b.player.mpg) / 14
  );
}

export function formatHeight(height: string): string {
  if (!height.includes("-")) return height;
  const [feet, inches] = height.split("-");
  return `${feet}′${inches}″`;
}

function comparable(rows: PlayerSeason[]): boolean {
  const points = rows.map(({ player }) => player.pts);
  const impacts = rows.map(({ player }) => player.impact);
  return (
    Math.max(...points) - Math.min(...points) <= MAX_POINTS_SPREAD &&
    Math.max(...impacts) - Math.min(...impacts) <= MAX_IMPACT_SPREAD
  );
}

function distinctRoles(rows: PlayerSeason[]): number {
  return new Set(rows.map(({ player }) => player.role)).size;
}

type Matchup = {
  rows: [PlayerSeason, PlayerSeason, PlayerSeason];
  distance: number;
  roles: number;
  seasons: number;
};

function matchupsFor(
  anchor: PlayerSeason,
  available: PlayerSeason[],
): Matchup[] {
  const nearby = available
    .filter((candidate) => candidate.player.name !== anchor.player.name)
    .sort((a, b) => comparisonDistance(anchor, a) - comparisonDistance(anchor, b))
    .slice(0, MAX_NEARBY_CANDIDATES);
  const options: Matchup[] = [];

  for (let i = 0; i < nearby.length - 1; i++) {
    for (let j = i + 1; j < nearby.length; j++) {
      if (nearby[i].player.name === nearby[j].player.name) continue;
      const rows = [anchor, nearby[i], nearby[j]] as [PlayerSeason, PlayerSeason, PlayerSeason];
      if (!comparable(rows)) continue;
      const distance =
        comparisonDistance(anchor, nearby[i]) +
        comparisonDistance(anchor, nearby[j]) +
        comparisonDistance(nearby[i], nearby[j]);
      options.push({
        rows,
        distance,
        roles: distinctRoles(rows),
        seasons: new Set(rows.map(({ season }) => season.year)).size,
      });
    }
  }

  return options;
}

/**
 * Deal three different player identities with a strong preference for similar
 * production. The soft weighting keeps the board fresh while the hard spread
 * guard prevents a 20 PPG player landing beside two fringe players.
 */
export function selectComparableOptions(
  candidates: PlayerSeason[],
  rand: () => number,
  taken: ReadonlySet<string> = new Set(),
  count = 3,
): PlayerSeason[] {
  if (count < 1) return [];

  const unused = candidates.filter((candidate) => !taken.has(candidate.player.name));
  const playableUnused = unused.filter(playable);
  const available = playableUnused.length >= count ? playableUnused : unused;
  if (available.length < count) {
    return shuffle(available, rand).slice(0, count);
  }

  const allMatchups = available.flatMap((anchor) => matchupsFor(anchor, available));
  if (!allMatchups.length) {
    const anchor = available[Math.floor(rand() * available.length)];
    return [
      anchor,
      ...available
        .filter((candidate) => candidate.player.name !== anchor.player.name)
        .sort((a, b) => comparisonDistance(anchor, a) - comparisonDistance(anchor, b))
        .slice(0, count - 1),
    ];
  }

  const selected = weightedPick(
    allMatchups,
    (matchup) => {
      const similarity = 1 / Math.pow(0.35 + matchup.distance, 4);
      const roleBonus = matchup.roles === 3 ? 2.4 : matchup.roles === 2 ? 1.5 : 0.8;
      const seasonBonus = matchup.seasons === 3 ? 1.2 : matchup.seasons === 2 ? 1.08 : 1;
      return similarity * roleBonus * seasonBonus;
    },
    rand,
  );

  return shuffle(selected.rows, rand);
}
