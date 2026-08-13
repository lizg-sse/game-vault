"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Intro } from "./Intro";
import { PlayerCard } from "./PlayerCard";
import { Results } from "./Results";
import { RosterRail } from "./RosterRail";
import { SeasonPlate } from "./SeasonPlate";
import { SpurMark } from "./SpurMark";
import type { Grade } from "@/lib/scoring";
import type { Identity, Puzzle, PublicPlayer, Reveal } from "@/lib/types";

type Phase = "intro" | "round" | "done";
type Saved = { picks: string[]; done: boolean };

const STORE_PREFIX = "spurs-vault:v1:";

function load(id: string): Saved | null {
  try {
    const raw = localStorage.getItem(STORE_PREFIX + id);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function save(id: string, value: Saved) {
  try {
    localStorage.setItem(STORE_PREFIX + id, JSON.stringify(value));
  } catch {
    /* private browsing — the game still works, it just won't resume */
  }
}

export function VaultGame({
  initialPuzzle,
  puzzleNumber,
  vaultMeta,
  actions,
}: {
  initialPuzzle: Puzzle;
  puzzleNumber: number;
  vaultMeta: { seasons: number; playerSeasons: number; first?: string; last?: string };
  actions: {
    revealRound: (puzzleId: string, roundIndex: number) => Promise<Reveal>;
    gradeVault: (puzzleId: string, pickIds: string[]) => Promise<Grade>;
    getPracticePuzzle: (seed: string) => Promise<Puzzle>;
  };
}) {
  const [puzzle, setPuzzle] = useState(initialPuzzle);
  const [phase, setPhase] = useState<Phase>("intro");
  const [roundIndex, setRoundIndex] = useState(0);
  const [pickIds, setPickIds] = useState<string[]>([]);
  /** Identities, merged in only after a round is locked. */
  const [reveals, setReveals] = useState<Reveal>({});
  const [grade, setGrade] = useState<Grade | null>(null);
  const [busy, startTransition] = useTransition();
  const stageRef = useRef<HTMLDivElement>(null);

  const heading = puzzle.daily ? `The Vault #${puzzleNumber}` : "Practice Vault";
  const round = puzzle.rounds[roundIndex];
  const currentPickId = pickIds[roundIndex];
  const decided = Boolean(currentPickId) && round?.options.every((o) => reveals[o.id]);

  const persist = useCallback(
    (ids: string[], done: boolean) => {
      if (puzzle.daily) save(puzzle.id, { picks: ids, done });
    },
    [puzzle.daily, puzzle.id]
  );

  /*
   * Resume today's vault if this device already started it. The grade and any
   * revealed identities have to come back from the server first, so the whole
   * restore is awaited and then applied in one pass — no half-drawn round.
   */
  useEffect(() => {
    if (!puzzle.daily) return;
    let cancelled = false;

    void (async () => {
      const saved = load(puzzle.id);
      if (!saved?.picks.length) return;

      if (saved.done) {
        const restored = await actions.gradeVault(puzzle.id, saved.picks);
        if (cancelled) return;
        setPickIds(saved.picks);
        setGrade(restored);
        setPhase("done");
        return;
      }

      const at = Math.min(saved.picks.length, puzzle.rounds.length - 1);
      const revealed = saved.picks[at] ? await actions.revealRound(puzzle.id, at) : {};
      if (cancelled) return;
      setPickIds(saved.picks);
      setReveals(revealed);
      setRoundIndex(at);
      setPhase("round");
    })();

    return () => {
      cancelled = true;
    };
  }, [puzzle.id, puzzle.daily, puzzle.rounds.length, actions]);

  function choose(player: PublicPlayer) {
    if (decided || busy) return;
    const next = [...pickIds];
    next[roundIndex] = player.id;
    setPickIds(next);
    persist(next, false);

    startTransition(async () => {
      const revealed = await actions.revealRound(puzzle.id, roundIndex);
      setReveals((prev) => ({ ...prev, ...revealed }));
    });
  }

  function advance() {
    if (roundIndex === puzzle.rounds.length - 1) {
      persist(pickIds, true);
      setPhase("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
      startTransition(async () => setGrade(await actions.gradeVault(puzzle.id, pickIds)));
      return;
    }
    setRoundIndex((i) => i + 1);
    stageRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function start() {
    setPhase("round");
    setRoundIndex(0);
  }

  function startPractice() {
    startTransition(async () => {
      const fresh = await actions.getPracticePuzzle(String(Date.now()));
      setPuzzle(fresh);
      setPickIds([]);
      setReveals({});
      setGrade(null);
      setRoundIndex(0);
      setPhase("round");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /** Slot -> identity, for the roster rail. */
  const rosterIdentities = useMemo(
    () => puzzle.rounds.map((_, i) => (pickIds[i] ? reveals[pickIds[i]] ?? null : null)),
    [puzzle.rounds, pickIds, reveals]
  );

  const chosen: Identity | null = currentPickId ? reveals[currentPickId] ?? null : null;
  const passed = round?.options.filter((o) => o.id !== currentPickId).map((o) => reveals[o.id]?.name);

  return (
    <div className="app">
      <header className="masthead">
        <div className="shell masthead__inner">
          <SpurMark className="masthead__mark" title="San Antonio Spurs" />
          <p className="masthead__title">
            The Vault <span>SAS</span>
          </p>
          <div className="masthead__meta">
            {phase === "round" && (
              <div
                className="masthead__pips"
                role="img"
                aria-label={`Round ${roundIndex + 1} of ${puzzle.rounds.length}`}
              >
                {puzzle.rounds.map((r, i) => (
                  <span
                    key={r.season.year}
                    className="pip"
                    data-state={i < roundIndex ? "done" : i === roundIndex ? "active" : "open"}
                  />
                ))}
              </div>
            )}
            <span>{puzzle.daily ? `No. ${puzzleNumber}` : "Practice"}</span>
          </div>
        </div>
      </header>

      <main className="shell">
        {phase === "intro" && (
          <Intro dateLabel={puzzle.dateLabel} number={puzzleNumber} vaultMeta={vaultMeta}>
            <div className="actions">
              <button type="button" className="btn btn--primary" onClick={start}>
                Open the vault
              </button>
              {/* The vault's other game — see /higher-lower. */}
              <Link href="/higher-lower" className="btn btn--ghost">
                Higher / Lower →
              </Link>
            </div>
          </Intro>
        )}

        {phase === "round" && round && (
          <div className="stage" key={`${puzzle.id}-${roundIndex}`} ref={stageRef}>
            <SeasonPlate round={round} index={roundIndex} total={puzzle.rounds.length} />

            <div className="board" aria-busy={busy}>
              {round.options.map((player, i) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  identity={reveals[player.id] ?? null}
                  index={i}
                  state={!currentPickId ? "open" : player.id === currentPickId ? "picked" : "passed"}
                  revealed={Boolean(decided)}
                  onPick={() => choose(player)}
                />
              ))}
            </div>

            {decided && chosen && (
              <div className="verdict">
                <div className="verdict__text">
                  <b>
                    Signed: {chosen.name}, <em>{round.season.label}</em>
                  </b>
                  <span>{passed?.filter(Boolean).join(" and ")} stay in the vault.</span>
                </div>
                <button type="button" className="btn btn--primary" onClick={advance}>
                  {roundIndex === puzzle.rounds.length - 1 ? "Grade my team" : "Next season"}
                </button>
              </div>
            )}
          </div>
        )}

        {phase === "done" &&
          (grade ? (
            <Results grade={grade} heading={heading} onPractice={startPractice} />
          ) : (
            <p className="eyebrow" style={{ textAlign: "center" }}>
              Grading your roster…
            </p>
          ))}
      </main>

      {phase === "round" && (
        <RosterRail rounds={puzzle.rounds} identities={rosterIdentities} />
      )}

      <footer className="footer">
        <div className="shell footer__inner">
          <SpurMark className="footer__mark" />
          <span className="footer__wordmark">San Antonio Spurs</span>
          <span className="footer__spacer" />
          <span>
            {heading} · {puzzle.dateLabel}
          </span>
          <span>
            {vaultMeta.first}–{vaultMeta.last?.slice(-2)} ·{" "}
            {vaultMeta.playerSeasons.toLocaleString()} player seasons
          </span>
          <span className="footer__cry">Go Spurs Go</span>
        </div>
      </footer>
    </div>
  );
}
