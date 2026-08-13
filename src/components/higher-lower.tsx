"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CATEGORIES, formatStat, nextRound, type Player, type Round } from "@/lib/game";

const BEST_KEY = "spurs-higher-lower-best";
const REVEAL_MS = 1900;

type Phase = "start" | "playing" | "reveal" | "over";

/**
 * Best streak lives in localStorage, read through useSyncExternalStore so the
 * server renders 0 and the client swaps in the stored value without an effect.
 */
let bestListeners: (() => void)[] = [];

const bestStore = {
  subscribe(cb: () => void) {
    bestListeners.push(cb);
    return () => {
      bestListeners = bestListeners.filter((l) => l !== cb);
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
    bestListeners.forEach((l) => l());
  },
};

function useBest() {
  return useSyncExternalStore(bestStore.subscribe, bestStore.get, bestStore.server);
}

/**
 * Eases a number up from 0. Cards are remounted each round, so state starts at
 * 0 and no reset is needed when `active` is false.
 */
function useCountUp(target: number, active: boolean, duration = 750) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration]);

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

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const start = useCallback(() => {
    setStreak(0);
    setPicked(null);
    setRound(nextRound());
    setRoundId((n) => n + 1);
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
        if (correct) {
          const next = streak + 1;
          setStreak(next);
          if (next > best) bestStore.set(next);
          setPicked(null);
          setRound(nextRound([round.left.id, round.right.id]));
          setRoundId((n) => n + 1);
          setPhase("playing");
        } else {
          setPhase("over");
        }
      }, REVEAL_MS);
    },
    [phase, round, streak, best],
  );

  if (phase === "start" || !round) {
    return <StartScreen best={best} onStart={start} />;
  }

  const key = round.category.key;
  const winnerId =
    round.left.stats[key] > round.right.stats[key] ? round.left.id : round.right.id;
  const revealed = phase === "reveal" || phase === "over";
  const gotItRight = revealed && picked === winnerId;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-4 sm:gap-8 sm:py-10">
      <Scoreboard streak={streak} best={best} />

      <p className="text-center text-base font-semibold tracking-tight text-zinc-100 sm:text-2xl">
        Who{" "}
        <span className="text-[var(--spurs-silver)]">{round.category.prompt}</span>{" "}
        for the Spurs?
      </p>

      <div className="grid flex-1 grid-cols-1 items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
        <PlayerCard
          key={`${roundId}-left`}
          player={round.left}
          round={round}
          revealed={revealed}
          picked={picked}
          winnerId={winnerId}
          onChoose={choose}
        />
        <div className="flex items-center justify-center">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold tracking-[0.2em] text-zinc-400">
            VS
          </span>
        </div>
        <PlayerCard
          key={`${roundId}-right`}
          player={round.right}
          round={round}
          revealed={revealed}
          picked={picked}
          winnerId={winnerId}
          onChoose={choose}
        />
      </div>

      <p aria-live="polite" className="min-h-6 text-center text-sm font-medium">
        {revealed &&
          (gotItRight ? (
            <span className="text-emerald-400">Correct — streak {streak + 1}</span>
          ) : (
            <span className="text-rose-400">
              Wrong — it was {winnerId === round.left.id ? round.left.name : round.right.name}
            </span>
          ))}
      </p>

      {phase === "over" && (
        <GameOver
          streak={streak}
          best={best}
          round={round}
          winnerId={winnerId}
          onRestart={start}
        />
      )}
    </div>
  );
}

function Scoreboard({ streak, best }: { streak: number; best: number }) {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <Stat label="Streak" value={streak} highlight />
      <Stat label="Best" value={best} />
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`min-w-24 rounded-xl border px-4 py-2 text-center ${
        highlight
          ? "border-[var(--spurs-silver)]/40 bg-[var(--spurs-silver)]/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-zinc-400">
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums text-zinc-50">{value}</div>
    </div>
  );
}

function PlayerCard({
  player,
  round,
  revealed,
  picked,
  winnerId,
  onChoose,
}: {
  player: Player;
  round: Round;
  revealed: boolean;
  picked: string | null;
  winnerId: string;
  onChoose: (p: Player) => void;
}) {
  const value = player.stats[round.category.key];
  const count = useCountUp(value, revealed);
  const isWinner = player.id === winnerId;
  const isPicked = player.id === picked;

  const border = !revealed
    ? "border-white/10 hover:border-[var(--spurs-silver)]/60 hover:bg-white/[0.07]"
    : isWinner
      ? "border-emerald-400/70 bg-emerald-400/10"
      : isPicked
        ? "border-rose-400/70 bg-rose-400/10"
        : "border-white/10 opacity-60";

  return (
    <button
      type="button"
      onClick={() => onChoose(player)}
      disabled={revealed}
      aria-label={`Pick ${player.name}`}
      className={`group flex flex-col items-center gap-2 rounded-2xl border bg-white/[0.03] p-3 transition-all duration-200 disabled:cursor-default sm:gap-3 sm:p-6 ${border}`}
    >
      <div className="relative aspect-[4/3] w-full max-w-32 overflow-hidden rounded-xl bg-gradient-to-b from-zinc-700/40 to-zinc-900/60 sm:max-w-52">
        <Image
          src={player.img}
          alt={player.name}
          width={520}
          height={380}
          priority
          className="h-full w-full object-cover object-top"
        />
      </div>

      <div className="text-center">
        <div className="text-base font-bold tracking-tight text-zinc-50 sm:text-lg">
          {player.name}
        </div>
        <div className="text-xs text-zinc-400">{player.years}</div>
      </div>

      <div className="flex h-11 flex-col justify-center sm:h-14">
        {revealed ? (
          <>
            <div className="text-2xl font-bold tabular-nums text-zinc-50 sm:text-4xl">
              {formatStat(count)}
            </div>
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-zinc-400">
              {round.category.noun}
            </div>
          </>
        ) : (
          <span className="text-2xl font-bold text-zinc-600 sm:text-4xl">?</span>
        )}
      </div>
    </button>
  );
}

function StartScreen({ best, onStart }: { best: number; onStart: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
          Higher <span className="text-[var(--spurs-silver)]">/</span> Lower
        </h1>
        <p className="mt-3 text-zinc-400">
          Two Spurs, one stat. Pick whoever put up the bigger number in silver and black — and
          keep the streak alive.
        </p>
      </div>

      <ul className="flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((c) => (
          <li
            key={c.key}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400"
          >
            {c.noun}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onStart}
        className="rounded-full bg-[var(--spurs-silver)] px-8 py-3 text-base font-bold text-black transition hover:bg-white"
      >
        Play
      </button>

      {best > 0 && <p className="text-sm text-zinc-500">Your best streak: {best}</p>}
    </div>
  );
}

function GameOver({
  streak,
  best,
  round,
  winnerId,
  onRestart,
}: {
  streak: number;
  best: number;
  round: Round;
  winnerId: string;
  onRestart: () => void;
}) {
  const key = round.category.key;
  const winner = winnerId === round.left.id ? round.left : round.right;
  const loser = winnerId === round.left.id ? round.right : round.left;

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-6 text-center sm:p-8">
        <h2 className="text-2xl font-bold text-zinc-50">Streak over</h2>
        <p className="mt-2 text-zinc-400">
          You got <span className="font-bold text-zinc-100">{streak}</span> in a row.
        </p>

        <dl className="mt-5 space-y-1 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-sm font-semibold text-emerald-400">{winner.name}</dt>
            <dd className="text-sm font-bold tabular-nums text-emerald-400">
              {formatStat(winner.stats[key])}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-sm text-zinc-400">{loser.name}</dt>
            <dd className="text-sm tabular-nums text-zinc-400">
              {formatStat(loser.stats[key])}
            </dd>
          </div>
          <p className="pt-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-zinc-600">
            {round.category.noun} as a Spur
          </p>
        </dl>

        <p className="mt-4 text-sm text-zinc-500">
          {streak >= best && streak > 0 ? "That's a new personal best." : `Best: ${best}`}
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="mt-5 w-full rounded-full bg-[var(--spurs-silver)] px-6 py-3 font-bold text-black transition hover:bg-white"
        >
          Play again
        </button>
      </div>
    </div>
  );
}
