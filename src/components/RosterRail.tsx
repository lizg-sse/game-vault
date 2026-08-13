"use client";

import { Portrait } from "./Portrait";
import type { Identity, Round } from "@/lib/types";

export function RosterRail({
  rounds,
  identities,
}: {
  rounds: Round[];
  identities: (Identity | null)[];
}) {
  const filled = identities.filter(Boolean).length;

  return (
    <div className="rail">
      <div className="shell rail__inner">
        <p className="rail__label eyebrow">Your roster</p>
        <p className="eyebrow" style={{ color: "var(--silver)" }}>
          {filled} / {rounds.length}
        </p>
        <ul className="rail__slots">
          {rounds.map((round, i) => {
            const player = identities[i];
            return (
              <li key={round.season.year} className="slot" data-filled={Boolean(player)}>
                {player ? (
                  <>
                    <Portrait
                      src={player.img}
                      name={player.name}
                      revealed
                      className="portrait portrait--slot"
                    />
                    <span className="slot__year">{`'${round.season.label.slice(-2)}`}</span>
                    <span className="visually-hidden">
                      Round {i + 1}: {player.name}, {round.season.label}
                    </span>
                  </>
                ) : (
                  <span className="slot__empty" aria-label={`Round ${i + 1} empty`}>
                    {i + 1}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
