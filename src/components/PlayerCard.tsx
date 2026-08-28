"use client";

import { Portrait } from "./Portrait";
import { formatHeight } from "@/lib/best-of-three-selection";
import { contextLine, headlineStats } from "@/lib/statline";
import { ROLE_LABEL } from "@/lib/scoring";
import type { Identity, PublicPlayer } from "@/lib/types";

export function PlayerCard({
  player,
  identity,
  index,
  state,
  revealed,
  dealing = false,
  onPick,
}: {
  player: PublicPlayer;
  /** Arrives from the server only once the round is locked. */
  identity: Identity | null;
  index: number;
  state: "open" | "picked" | "passed";
  revealed: boolean;
  /** The round is over and this hand is being thrown out. */
  dealing?: boolean;
  onPick: () => void;
}) {
  const stats = headlineStats(player);
  const option = `Option ${index + 1}`;
  const seasonLabel = player.season.label.replace("-", "–");
  const height = formatHeight(player.height);
  const locked = state !== "open" || revealed;

  return (
    <button
      type="button"
      className="card"
      style={{ "--i": index } as React.CSSProperties}
      data-state={state}
      data-revealed={revealed}
      data-locked={locked}
      data-dealing={dealing || undefined}
      onClick={onPick}
      disabled={locked}
      aria-pressed={state === "picked"}
    >
      <span className="card__stamp" aria-hidden="true">
        Signed
      </span>

      <span className="card__head">
        <span className="card__height">
          <span className="stat__value">{height}</span>
          <span className="stat__label">Height</span>
        </span>
        <span className="card__role">{ROLE_LABEL[player.role]}</span>
        <span className="card__status" aria-label={`${seasonLabel}, age ${player.age ?? "unknown"}`}>
          <strong className="card__status-year">{seasonLabel}</strong>
          <small className="card__status-age">Age {player.age ?? "—"}</small>
        </span>
      </span>

      <Portrait
        src={identity?.img ?? null}
        name={identity?.name ?? null}
        revealed={revealed}
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
        <b>{identity?.name ?? option}</b>
        <span>{player.pos ?? ROLE_LABEL[player.role]}</span>
      </span>

      <span className="visually-hidden">
        {identity
          ? `${identity.name}. `
          : `${option}, ${ROLE_LABEL[player.role]}. Select to add to your roster. `}
        {seasonLabel}, age {player.age ?? "unknown"}, {height} tall. {" "}
        {stats.map((s) => `${s.value} ${s.label}`).join(", ")}. {contextLine(player)}
      </span>
    </button>
  );
}
