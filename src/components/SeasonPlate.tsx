import type { Round } from "@/lib/types";

/** Shortens B-Ref's postseason sentence into something a header can carry. */
export function postseasonShort(text: string | null): string {
  if (!text) return "Missed the playoffs";
  return text
    .replace(/^Won (NBA|ABA) Finals/, "Won the title")
    .replace(/^Lost (NBA|ABA) Finals/, "Lost the Finals")
    .replace(/(NBA|ABA) (Western|Eastern) (Conference|Division) /, "")
    .replace(/ versus .*$/, "")
    .replace(/Semifinals/, "Semis")
    .replace(/First Round/, "Round 1")
    .trim();
}

export function SeasonPlate({
  round,
  index,
  total,
}: {
  round: Round;
  index: number;
  total: number;
}) {
  const { season } = round;
  const [start, end] = season.label.split("-");

  return (
    <header className="plate">
      <p className="plate__round eyebrow">
        Round {index + 1} of {total}
      </p>

      <h2 className="plate__year">
        {start}–{end}
      </h2>

      <p className="plate__facts">
        <span>{season.era}</span>
        <i className="sep" aria-hidden="true" />
        <span>
          <b>
            {season.wins}–{season.losses}
          </b>
        </span>
        <i className="sep" aria-hidden="true" />
        <span>{postseasonShort(season.postseason)}</span>
        {season.coach && (
          <>
            <i className="sep" aria-hidden="true" />
            <span>{season.coach.split(",")[0]}</span>
          </>
        )}
      </p>

      <p className="plate__facts">
        {season.title && <span className="chip chip--title">NBA Champions</span>}
        {!season.title && season.finals && <span className="chip chip--finals">Finals</span>}
        {season.league === "ABA" && <span className="chip chip--aba">ABA</span>}
        {season.arena && <span className="chip">{season.arena}</span>}
      </p>
    </header>
  );
}
