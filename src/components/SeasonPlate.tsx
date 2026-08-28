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
  return (
    <header className="plate">
      <p className="plate__round eyebrow">
        Round {index + 1} of {total}
      </p>

      <h2 className="plate__year">
        ONE<sup>ROSTER SPOT</sup>
      </h2>

      <p className="plate__facts">
        <span>{round.options.length} comparable Spurs player-seasons</span>
        <i className="sep" aria-hidden="true" />
        <span>Numbers first</span>
      </p>

      <p className="plate__facts">
        <span className="chip chip--finals">2010s–20s focus</span>
        <span className="chip">Year + age on every card</span>
      </p>
    </header>
  );
}
