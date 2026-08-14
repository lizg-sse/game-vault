"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CATEGORIES, formatStat, nextRound, type Player, type Round } from "@/lib/game";
import { PLAYERS } from "@/lib/players";
import { SpurMark } from "./SpurMark";
import styles from "./higher-lower.module.css";

const BEST_KEY = "spurs-higher-lower-best";
const REVEAL_MS = 1900;

type Phase = "start" | "playing" | "reveal" | "over";

let bestListeners: (() => void)[] = [];

const bestStore = {
  subscribe(listener: () => void) {
    bestListeners.push(listener);
    return () => {
      bestListeners = bestListeners.filter((item) => item !== listener);
    };
  },
  get() {
    const raw = Number(window.localStorage.getItem(BEST_KEY));
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  },
  server() {
    return 0;
  },
  set(value: number) {
    window.localStorage.setItem(BEST_KEY, String(value));
    bestListeners.forEach((listener) => listener());
  },
};

function useBest() {
  return useSyncExternalStore(bestStore.subscribe, bestStore.get, bestStore.server);
}

function useCountUp(target: number, active: boolean, duration = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, duration, target]);

  return value;
}

export default function HigherLower() {
  const [phase, setPhase] = useState<Phase>("start");
  const [round, setRound] = useState<Round | null>(null);
  const [roundId, setRoundId] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const best = useBest();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const start = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setStreak(0);
    setPicked(null);
    setRound(nextRound());
    setRoundId((value) => value + 1);
    setPhase("playing");
  }, []);

  const choose = useCallback(
    (player: Player) => {
      if (phase !== "playing" || !round) return;

      const key = round.category.key;
      const other = player.id === round.left.id ? round.right : round.left;
      const correct = player.stats[key] > other.stats[key];

      setPicked(player.id);
      setPhase("reveal");

      timer.current = setTimeout(() => {
        if (!correct) {
          setPhase("over");
          return;
        }

        const nextStreak = streak + 1;
        setStreak(nextStreak);
        if (nextStreak > best) bestStore.set(nextStreak);
        setPicked(null);
        setRound(nextRound([round.left.id, round.right.id]));
        setRoundId((value) => value + 1);
        setPhase("playing");
      }, REVEAL_MS);
    },
    [best, phase, round, streak],
  );

  return (
    <div className={styles.app}>
      <GameHeader />

      <main className={styles.main}>
        {phase === "start" || !round ? (
          <StartScreen best={best} onStart={start} />
        ) : (
          <Matchup
            key={roundId}
            round={round}
            phase={phase}
            picked={picked}
            streak={streak}
            best={best}
            onChoose={choose}
            onRestart={start}
          />
        )}
      </main>

      <GameFooter />
    </div>
  );
}

function GameHeader() {
  return (
    <header className={styles.masthead}>
      <div className={styles.mastheadInner}>
        <Link href="/" aria-label="Back to The Vault" className={styles.back}>
          ←
        </Link>
        <SpurMark className={styles.headerMark} />
        <p className={styles.headerTitle}>
          <span>Higher / Lower</span>
          <small>The Vault · SAS</small>
        </p>
        <span className={styles.playerCount}>{PLAYERS.length} players</span>
      </div>
    </header>
  );
}

function StartScreen({ best, onStart }: { best: number; onStart: () => void }) {
  return (
    <section className={styles.start} data-screen-label="Start">
      <div className={styles.startPlayers} aria-hidden="true">
        <Image
          src="/players/duncati01.webp"
          alt=""
          width={520}
          height={380}
          priority
          className={styles.startLeft}
        />
        <Image
          src="/players/robinda01.webp"
          alt=""
          width={520}
          height={380}
          priority
          className={styles.startRight}
        />
        <span className={styles.startVs}>
          <b>VS</b>
        </span>
      </div>

      <div className={styles.startCopy}>
        <h1>
          Higher
          <br />/ Lower
        </h1>
        <p>
          Two Spurs, one stat. Pick whoever put up the bigger number in silver and black —{" "}
          <strong>and keep the streak alive.</strong>
        </p>
      </div>

      <ul className={styles.categories}>
        {CATEGORIES.map((category) => (
          <li key={category.key}>{category.noun}</li>
        ))}
      </ul>

      <div className={styles.startActions}>
        <button type="button" onClick={onStart} className={styles.primaryButton}>
          Tip it off
        </button>
        {best > 0 && (
          <p>
            Your best streak: <span>{best}</span>
          </p>
        )}
      </div>
    </section>
  );
}

function Matchup({
  round,
  phase,
  picked,
  streak,
  best,
  onChoose,
  onRestart,
}: {
  round: Round;
  phase: Exclude<Phase, "start">;
  picked: string | null;
  streak: number;
  best: number;
  onChoose: (player: Player) => void;
  onRestart: () => void;
}) {
  const key = round.category.key;
  const winner = round.left.stats[key] > round.right.stats[key] ? round.left : round.right;
  const loser = winner.id === round.left.id ? round.right : round.left;
  const revealed = phase === "reveal" || phase === "over";
  const correct = revealed && picked === winner.id;

  return (
    <section className={styles.matchup} data-screen-label="Matchup">
      <div className={styles.scoreboard}>
        <Score label="Streak" value={streak} active />
        <Score label="Best" value={best} />
      </div>

      <header className={styles.prompt}>
        <p>
          <span /> Who {round.category.prompt} <span />
        </p>
        <h1>{round.category.noun}</h1>
        <small>as a Spur · career total</small>
      </header>

      <div className={styles.cards}>
        {[round.left, round.right].map((player, index) => (
          <MatchupCard
            key={player.id}
            player={player}
            round={round}
            index={index}
            picked={picked}
            winnerId={winner.id}
            revealed={revealed}
            onChoose={onChoose}
          />
        ))}
        <span className={styles.middleVs} aria-hidden="true">
          <b>VS</b>
        </span>
      </div>

      <p className={styles.verdict} aria-live="polite">
        {revealed &&
          (correct ? (
            <span>Correct — streak {streak + 1}</span>
          ) : (
            <span className={styles.wrong}>Wrong — it was {winner.name}</span>
          ))}
      </p>

      {phase === "over" && (
        <GameOver
          streak={streak}
          best={best}
          round={round}
          winner={winner}
          loser={loser}
          onRestart={onRestart}
        />
      )}
    </section>
  );
}

function Score({ label, value, active = false }: { label: string; value: number; active?: boolean }) {
  return (
    <div className={active ? styles.scoreActive : styles.score}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MatchupCard({
  player,
  round,
  index,
  picked,
  winnerId,
  revealed,
  onChoose,
}: {
  player: Player;
  round: Round;
  index: number;
  picked: string | null;
  winnerId: string;
  revealed: boolean;
  onChoose: (player: Player) => void;
}) {
  const winner = player.id === winnerId;
  const pickedCard = player.id === picked;
  const count = useCountUp(player.stats[round.category.key], revealed);
  const state = !revealed ? "open" : winner ? "winner" : pickedCard ? "picked" : "passed";

  return (
    <button
      type="button"
      onClick={() => onChoose(player)}
      disabled={revealed}
      className={styles.card}
      data-state={state}
      style={{ "--card-delay": `${index * 80}ms` } as React.CSSProperties}
    >
      {revealed && winner && (
        <>
          <span className={styles.winSweep} aria-hidden="true" />
          <span className={styles.higherBadge}>Higher</span>
        </>
      )}
      <span className={styles.cardWatermark} aria-hidden="true" />

      <span className={styles.cardPortrait}>
        <span aria-hidden="true" />
        <Image
          src={player.img}
          alt={player.name}
          width={520}
          height={380}
          priority
        />
      </span>

      <span className={styles.playerName}>
        <strong>{player.name}</strong>
        <small>{player.years}</small>
      </span>

      <span className={styles.cardValue}>
        {revealed ? (
          <>
            <strong>{formatStat(count)}</strong>
            <small>{round.category.noun}</small>
          </>
        ) : (
          <span className={styles.question} aria-hidden="true">
            <b>?</b>
          </span>
        )}
      </span>
    </button>
  );
}

function GameOver({
  streak,
  best,
  round,
  winner,
  loser,
  onRestart,
}: {
  streak: number;
  best: number;
  round: Round;
  winner: Player;
  loser: Player;
  onRestart: () => void;
}) {
  const key = round.category.key;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="streak-over-title">
        <p className={styles.modalEyebrow}>Buzzer</p>
        <h2 id="streak-over-title">Streak over</h2>
        <p className={styles.modalLede}>
          You got <strong>{streak}</strong> in a row.
        </p>

        <dl className={styles.resultTable}>
          <div>
            <dt>{winner.name}</dt>
            <dd>{formatStat(winner.stats[key])}</dd>
          </div>
          <div>
            <dt>{loser.name}</dt>
            <dd>{formatStat(loser.stats[key])}</dd>
          </div>
          <p>{round.category.noun} as a Spur</p>
        </dl>

        <p className={styles.bestNote}>
          {streak >= best && streak > 0 ? "That's a new personal best." : `Best: ${best}`}
        </p>

        <div className={styles.modalActions}>
          <button type="button" onClick={onRestart} className={styles.primaryButton}>
            Run it back
          </button>
          <Link href="/" className={styles.secondaryButton}>
            Back to the vault
          </Link>
        </div>
      </div>
    </div>
  );
}

function GameFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <SpurMark className={styles.footerMark} />
        <strong>San Antonio Spurs</strong>
        <span />
        <p>Regular-season totals with the Spurs (NBA era) · Stats via Basketball-Reference</p>
      </div>
    </footer>
  );
}
