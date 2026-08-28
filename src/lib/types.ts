/** Role bucket assigned from the player's listed position that season. */
export type Role = "G" | "W" | "B";

export type Player = {
  id: string;
  name: string;
  /** Cached portrait path under /public, or null when none is on file. */
  img: string | null;
  age: number | null;
  pos: string | null;
  role: Role;
  g: number;
  gs: number | null;
  mpg: number;
  pts: number;
  trb: number | null;
  ast: number | null;
  stl: number | null;
  blk: number | null;
  tov: number | null;
  fgPct: number | null;
  fg3Pct: number | null;
  ftPct: number | null;
  efgPct: number | null;
  fg3a: number | null;
  /** Per-game impact metric. See lib/scoring for the formula. */
  impact: number;
  /** Percentile rank of each stat across every Spurs season in the vault. */
  pct: Record<string, number | null>;
};

/** A player-season pair is the atomic card in Best of 3. */
export type PlayerSeason = {
  season: SeasonInfo;
  player: Player;
};

/** The small amount of season context shown on an anonymous card. */
export type SeasonRef = Pick<SeasonInfo, "year" | "label">;

/**
 * What the browser is allowed to know before a pick is locked in: the season's
 * numbers and nothing that identifies the player. Name, portrait and impact
 * score stay on the server so the answer isn't sitting in the page source.
 */
export type PublicPlayer = Omit<Player, "name" | "img" | "impact"> & {
  season: SeasonRef;
  height: string;
};

/** Returned by the reveal action once a round is decided. */
export type Identity = { name: string; img: string | null };
export type Reveal = Record<string, Identity>;

export type Season = {
  year: number;
  label: string;
  league: "NBA" | "ABA";
  era: string;
  coach: string | null;
  wins: number | null;
  losses: number | null;
  srs: number | null;
  ppg: number | null;
  oppPpg: number | null;
  arena: string | null;
  postseason: string | null;
  title: boolean;
  finals: boolean;
  players: Player[];
};

export type SeasonInfo = Omit<Season, "players">;

/** One round: three comparable player-seasons offered for one roster spot. */
export type Round = {
  options: PublicPlayer[];
};

export type Puzzle = {
  /** ISO date for the daily puzzle, or "practice-<n>". Also the RNG seed. */
  id: string;
  dateLabel: string;
  daily: boolean;
  rounds: Round[];
};
