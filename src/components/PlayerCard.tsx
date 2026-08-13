"use client";

import { Portrait } from "./Portrait";
import { contextLine, headlineStats } from "@/lib/statline";
import { ROLE_LABEL } from "@/lib/scoring";
import type { Identity, PublicPlayer } from "@/lib/types";

const LETTERS = ["A", "B", "C", "D", "E"] as const;

export function PlayerCard({
  player,
  identity,
  index,
  state,
  revealed,
  onPick,
}: {
  player: PublicPlayer;
  /** Arrives from the server only once the round is locked. */
  identity: Identity | null;
  index: number;
  state: "open" | "picked" | "passed";
  revealed: boolean;
  onPick: () => void;
}) {
  const stats = headlineStats(player);
  const letter = LETTERS[index] ?? "?";
  const locked = state !== "open" || revealed;

  return (
    <button
      type="button"
      className="card"
      style={{ "--i": index } as React.CSSProperties}
      data-state={state}
      data-revealed={revealed}
      data-locked={locked}
      onClick={onPick}
      disabled={locked}
      aria-pressed={state === "picked"}
    >
      <span className="card__stamp" aria-hidden="true">
        Signed
      </span>

      <span className="card__head">
        <span className="card__letter" aria-hidden="true">
          {letter}
        </span>
        <span className="card__role">{ROLE_LABEL[player.role]}</span>
        {player.age != null && <span className="card__age">Age {player.age}</span>}
      </span>

      <Portrait
        src={identity?.img ?? null}
        name={identity?.name ?? null}
        revealed={revealed}
        letter={letter}
        className="portrait card__portrait"
      />

      <span className="card__stats">
        {stats.map((s, i) => (
          <span key={s.key} className={i === 0 ? "stat stat--lead" : "stat"}>
            <span className="stat__value">{s.value}</span>
            <span className="stat__label">{s.label}</span>
          </span>
        ))}
      </span>

      <span className="card__context">{contextLine(player)}</span>

      <span className="card__name">
        <b>{identity?.name ?? `Player ${letter}`}</b>
        <span>{player.pos ?? ROLE_LABEL[player.role]}</span>
      </span>

      <span className="visually-hidden">
        {identity
          ? `${identity.name}. `
          : `Player ${letter}, ${ROLE_LABEL[player.role]}. Select to add to your roster. `}
        {stats.map((s) => `${s.value} ${s.label}`).join(", ")}. {contextLine(player)}
      </span>
    </button>
  );
}
