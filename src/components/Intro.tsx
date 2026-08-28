import { SpurMark } from "./SpurMark";

export function Intro({
  dateLabel,
  number,
  vaultMeta,
  children,
}: {
  dateLabel: string;
  number: number;
  vaultMeta: {
    seasons: number;
    playerSeasons: number;
    bestOfThreePlayerSeasons?: number;
    first?: string;
    last?: string;
  };
  children: React.ReactNode;
}) {
  return (
    <div className="intro">
      <SpurMark className="intro__crest" title="San Antonio Spurs" />

      <div>
        <p className="eyebrow" style={{ marginBlockEnd: "0.75rem" }}>
          No. {number} · {dateLabel}
        </p>
        {/* The vault is the hub above this now; this screen is the game. */}
        <h1 className="intro__title">
          Best
          <br />
          of 3
        </h1>
      </div>

      <div className="intro__rule" aria-hidden="true">
        <span />
      </div>

      <p className="intro__lede">
        Five rounds. Three comparable Spurs player-seasons in each — nothing but their numbers.
        <strong>Build the best five-man team you can.</strong>
      </p>

      <div className="intro__steps">
        <div className="intro__step">
          <b>01</b>
          <span>A matchup opens. Three real Spurs seasons, listed only by their stat line.</span>
        </div>
        <div className="intro__step">
          <b>02</b>
          <span>Pick one. Their identity is revealed, and they join your roster for good.</span>
        </div>
        <div className="intro__step">
          <b>03</b>
          <span>
            After five rounds your team is graded on production, fit, star power and efficiency.
          </span>
        </div>
      </div>

      {children}

      <p className="intro__note">
        {(vaultMeta.bestOfThreePlayerSeasons ?? vaultMeta.playerSeasons).toLocaleString()} eligible
        player seasons · 2010s–20s focus + named legends
      </p>
    </div>
  );
}
