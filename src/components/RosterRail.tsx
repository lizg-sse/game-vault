"use client";

import { Portrait } from "./Portrait";
import type { Identity, Round } from "@/lib/types";

export function RosterRail({
  rounds,
  pickIds,
  identities,
}: {
  rounds: Round[];
  pickIds: string[];
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
            const picked = round.options.find((option) => option.id === pickIds[i]);
            return (
              <li key={i} className="slot" data-filled={Boolean(player)}>
                {player ? (
                  <>
                    <Portrait
                      src={player.img}
                      name={player.name}
                      revealed
                      className="portrait portrait--slot"
                    />
                    <span className="slot__year">
                      {picked ? `'${picked.season.label.slice(-2)}` : `R${i + 1}`}
                    </span>
                    <span className="visually-hidden">
                      Round {i + 1}: {player.name}, {picked?.season.label ?? "season unknown"}
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
