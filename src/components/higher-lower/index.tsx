"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CATEGORIES, formatStat, nextRound, type Player, type Round } from "@/lib/game";
import { fireFor, heatFor, tierFor, TIERS } from "./heat";
import { StreakFire } from "./StreakFire";

const BEST_KEY = "spurs-higher-lower-best";
/** How long the totals stay up before the round resolves. */
const REVEAL_MS = 2000;
/** The beaten pair is thrown out before the next one is dealt in. */
const DEAL_MS = 720;
const COUNT_MS = 840;

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
function useCountUp(target: number, active: boolean, duration = COUNT_MS) {
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
  const [dealing, setDealing] = useState(false);
  /** Bumped whenever a correct pick lands, so the fire gulps air. */
  const [surge, setSurge] = useState(0);
  const best = useBest();

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const start = useCallback(() => {
    clearTimers();
    setStreak(0);
    setPicked(null);
    setDealing(false);
    setRound(nextRound());
    setRoundId((n) => n + 1);
    setPhase("playing");
  }, [clearTimers]);

  const choose = useCallback(
    (player: Player) => {
      if (phase !== "playing" || !round) return;

      const key = round.category.key;
      const other = player.id === round.left.id ? round.right : round.left;
      const correct = player.stats[key] > other.stats[key];
      const next = streak + 1;

      setPicked(player.id);
      setPhase("reveal");

      // The fire kicks as the number lands, not as the card is clicked.
      if (correct) after(COUNT_MS, () => setSurge((n) => n + 1));

      after(REVEAL_MS, () => {
        if (!correct) {
          setPhase("over");
          return;
        }
        if (next > best) bestStore.set(next);
        setDealing(true);
        after(DEAL_MS, () => {
          setStreak(next);
          setPicked(null);
          setRound(nextRound([round.left.id, round.right.id]));
          setRoundId((n) => n + 1);
          setPhase("playing");
          setDealing(false);
        });
      });
    },
    [phase, round, streak, best, after],
  );

  if (phase === "start" || !round) {
    return <StartScreen best={best} onStart={start} />;
  }

  const key = round.category.key;
  const winnerId =
    round.left.stats[key] > round.right.stats[key] ? round.left.id : round.right.id;
  const winner = winnerId === round.left.id ? round.left : round.right;
  const loser = winnerId === round.left.id ? round.right : round.left;
  const revealed = phase === "reveal" || phase === "over";
  const gotItRight = revealed && picked === winnerId;

  // A dead streak takes the fire with it — the engine smoulders down rather
  // than cutting, so the burn-out plays under the game-over sheet.
  const out = phase === "over";
  const heat = out ? 0 : heatFor(streak);
  const fire = out ? 0 : fireFor(streak);
  const tier = out ? 0 : tierFor(streak);

  return (
    <div
      className="hl gap-3 sm:gap-5"
      style={{ "--heat": heat, "--fire": fire } as React.CSSProperties}
    >
      <StreakFire intensity={fire} surge={surge} />
      <div aria-hidden="true" className="hl-heatwave" />
      {tier > 0 && <div key={tier} aria-hidden="true" className="hl-flash" />}

      <div className="flex items-stretch justify-center gap-2.5">
        <Figure label="Streak" value={streak} className="hl-streak bg-silver/8" />
        <Figure label="Best" value={best} muted className="border-[var(--line)] bg-surface" />
      </div>

      <p role="status" className="min-h-6 text-center">
        <span className="visually-hidden">{TIERS[tier]}</span>
        {tier > 0 && (
          <span
            key={tier}
            aria-hidden="true"
            className="hl-banner font-display text-base font-bold tracking-[0.3em] text-paper uppercase"
          >
            {[...TIERS[tier]].map((ch, i) => (
              <b key={i} style={{ "--d": `${i * 70}ms` } as React.CSSProperties}>
                {ch}
              </b>
            ))}
          </span>
        )}
      </p>

      <header className="grid justify-items-center gap-1.5 text-center">
        <p className="eyebrow flex items-center gap-2.5">
          <span className="h-px w-6 bg-[var(--line-strong)]" />
          Who {round.category.prompt}
          <span className="h-px w-6 bg-[var(--line-strong)]" />
        </p>
        <h2 className="font-display text-[clamp(1.75rem,7vw,3rem)] leading-none font-bold text-paper uppercase">
          {round.category.noun}
        </h2>
        <p className="font-display text-[0.625rem] font-medium tracking-[0.2em] text-faint uppercase">
          as a Spur · career total
        </p>
      </header>

      <div className="mx-auto grid w-full max-w-[46rem] flex-1 grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] items-stretch gap-2.5 sm:gap-4">
        {[round.left, round.right].map((player, i) => (
          <MatchCard
            key={`${roundId}-${i}`}
            index={i}
            player={player}
            round={round}
            revealed={revealed}
            dealing={dealing}
            isWinner={player.id === winnerId}
            isPicked={player.id === picked}
            onChoose={choose}
          />
        ))}
      </div>

      <p
        aria-live="polite"
        className="font-display min-h-6 text-center text-[0.8125rem] font-semibold tracking-[0.18em] uppercase"
      >
        {revealed &&
          (gotItRight ? (
            <span className="text-silver">Correct — streak {streak + 1}</span>
          ) : (
            <span className="text-faint">Wrong — it was {winner.name}</span>
          ))}
      </p>

      {phase === "over" && (
        <GameOver
          streak={streak}
          best={best}
          round={round}
          winner={winner}
          loser={loser}
          onRestart={start}
        />
      )}
    </div>
  );
}

function Figure({
  label,
  value,
  muted,
  className = "",
}: {
  label: string;
  value: number;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div className={`min-w-26 rounded-[3px] border px-4 py-2 text-center ${className}`}>
      <div
        className={`font-display text-[0.5625rem] font-semibold tracking-[0.24em] uppercase ${
          muted ? "text-faint" : "text-muted"
        }`}
      >
        {label}
      </div>
      <div
        className={`font-display text-[1.75rem] leading-[1.1] font-bold tabular-nums ${
          muted ? "text-muted" : "text-paper"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function MatchCard({
  player,
  round,
  revealed,
  dealing,
  isWinner,
  isPicked,
  index,
  onChoose,
}: {
  player: Player;
  round: Round;
  revealed: boolean;
  dealing: boolean;
  isWinner: boolean;
  isPicked: boolean;
  index: number;
  onChoose: (p: Player) => void;
}) {
  const value = player.stats[round.category.key];
  const count = useCountUp(value, revealed);
  const beaten = revealed && !isWinner;

  const border = !revealed
    ? "border-[var(--line)]"
    : isWinner
      ? "border-silver"
      : isPicked
        ? "border-[var(--line-strong)]"
        : "border-[var(--line)]";

  return (
    <button
      type="button"
      onClick={() => onChoose(player)}
      disabled={revealed}
      aria-label={`Pick ${player.name}`}
      style={
        {
          // The pair leaves in the reverse of the order it arrived.
          "--d": `${(dealing ? 1 - index : index) * 90}ms`,
          scale: revealed ? (isWinner ? 1.04 : 0.93) : 1,
        } as React.CSSProperties
      }
      className={`hl-card ${dealing ? "hl-card-out" : "hl-card-in"} ${border} group relative isolate flex flex-col items-center gap-2.5 overflow-hidden rounded-[5px] border bg-linear-[180deg,var(--ink-800),var(--ink-950)_74%] p-3.5 text-paper not-disabled:cursor-pointer hover:not-disabled:-translate-y-[3px] hover:not-disabled:border-[var(--line-hot)] hover:not-disabled:shadow-[0_18px_44px_-26px_rgb(0_0_0/0.95)] sm:p-6 ${
        beaten ? "opacity-45" : "opacity-100"
      } ${
        isWinner && revealed
          ? "bg-linear-[180deg,var(--ink-700),var(--ink-950)_76%] shadow-[0_0_44px_-8px_rgb(196_206_212/0.32)]"
          : ""
      }`}
    >
      {revealed && isWinner && (
        <span className="hl-stamp font-display absolute top-3 right-3 z-3 rotate-[-4deg] rounded-[2px] bg-silver px-2 py-0.5 text-[0.625rem] font-bold tracking-[0.16em] text-ink uppercase">
          Higher
        </span>
      )}

      <span
        aria-hidden="true"
        className="absolute -right-[14%] -bottom-[18%] -z-1 aspect-square w-1/2 bg-[image:var(--spur-mask)] bg-contain bg-center bg-no-repeat opacity-4"
      />

      <span className="relative grid aspect-[4/3] w-full max-w-52 place-items-end justify-center overflow-hidden">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[78%] bg-[radial-gradient(70%_90%_at_50%_100%,rgb(196_206_212/0.1),transparent_65%)]"
        />
        <Image
          src={player.img}
          alt=""
          width={520}
          height={380}
          loading="eager"
          className={`hl-fade-card relative w-full transition-[filter] duration-400 ${
            beaten ? "brightness-50 grayscale contrast-110" : "brightness-85 grayscale contrast-115"
          }`}
        />
      </span>

      <span className="font-display text-center text-[clamp(1.125rem,3vw,1.375rem)] leading-[1.15] font-semibold text-paper uppercase">
        {player.name}
      </span>

      <span className="flex min-h-13 flex-col items-center justify-center">
        {revealed ? (
          <>
            <span
              className={`font-display text-[clamp(1.875rem,5vw,2.625rem)] leading-none font-bold tracking-[-0.02em] tabular-nums ${
                isWinner ? "text-paper" : "text-muted"
              }`}
            >
              {formatStat(count)}
            </span>
            <span className="font-display text-[0.5625rem] font-semibold tracking-[0.22em] text-faint uppercase">
              {round.category.noun}
            </span>
          </>
        ) : (
          <span
            aria-hidden="true"
            className="grid h-8 w-8 rotate-45 place-items-center border border-[var(--line-strong)]"
          >
            <span className="font-display -rotate-45 text-base font-bold text-faint">?</span>
          </span>
        )}
      </span>
    </button>
  );
}

function StartScreen({ best, onStart }: { best: number; onStart: () => void }) {
  return (
    <div className="grid flex-1 content-center justify-items-center gap-6 py-8 text-center sm:gap-9">
      <div className="hl-rise relative aspect-[16/8] w-full max-w-[26rem]">
        <Image
          src="/players/duncati01.webp"
          alt=""
          width={520}
          height={380}
          loading="eager"
          className="hl-fade-figure absolute bottom-0 left-0 w-[56%] brightness-85 grayscale contrast-115"
        />
        <Image
          src="/players/robinda01.webp"
          alt=""
          width={520}
          height={380}
          loading="eager"
          className="hl-fade-figure absolute right-0 bottom-0 w-[56%] -scale-x-100 brightness-70 grayscale contrast-115"
        />
        <span className="hl-breathe absolute top-[42%] left-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 rotate-45 place-items-center border border-[var(--line-hot)] bg-ink/90 shadow-[0_0_34px_rgb(196_206_212/0.18)]">
          <span className="font-display -rotate-45 text-[0.8125rem] font-bold tracking-[0.1em] text-silver">
            VS
          </span>
        </span>
      </div>

      <div className="hl-rise" style={{ "--d": "100ms" } as React.CSSProperties}>
        <h1 className="intro__title text-[clamp(3rem,13vw,5.5rem)] leading-[0.9]">
          Higher
          <br />/ Lower
        </h1>
        <p className="intro__lede mt-4">
          Two Spurs, one stat. Pick whoever put up the bigger number in silver and black —{" "}
          <strong>and keep the streak alive.</strong>
        </p>
      </div>

      <ul
        className="hl-rise flex max-w-[34rem] list-none flex-wrap justify-center gap-1.5"
        style={{ "--d": "180ms" } as React.CSSProperties}
      >
        {CATEGORIES.map((c) => (
          <li key={c.key} className="chip">
            {c.noun}
          </li>
        ))}
      </ul>

      <div
        className="hl-rise grid justify-items-center gap-3"
        style={{ "--d": "260ms" } as React.CSSProperties}
      >
        <button type="button" onClick={onStart} className="btn btn--primary px-9">
          Tip it off
        </button>
        {best > 0 && (
          <p className="text-[0.8125rem] text-faint">
            Your best streak: <span className="tabular-nums text-silver">{best}</span>
          </p>
        )}
      </div>
    </div>
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/78 p-4 backdrop-blur-[3px]">
      <div className="hl-pop w-full max-w-sm overflow-hidden rounded-[5px] border border-[var(--line-strong)] bg-linear-[180deg,var(--ink-800),var(--ink-950)_85%] p-6 text-center sm:p-8">
        <p className="hl-buzzer font-display text-[0.625rem] font-semibold tracking-[0.26em] text-faint uppercase">
          Buzzer
        </p>
        <h2 className="hl-hammer font-display mt-1.5 text-[2rem] leading-none font-bold text-paper uppercase">
          Streak over
        </h2>
        <p className="hl-rise mt-2.5 text-[0.9375rem] text-muted" style={{ "--d": "380ms" } as React.CSSProperties}>
          You got <span className="font-bold tabular-nums text-paper">{streak}</span> in a row.
        </p>

        <dl
          className="hl-rise mt-5 rounded-[3px] border border-[var(--line)] bg-surface/80 p-4 text-left"
          style={{ "--d": "500ms" } as React.CSSProperties}
        >
          <div className="flex items-baseline justify-between gap-3">
            <dt className="font-display text-sm font-semibold text-paper">{winner.name}</dt>
            <dd className="font-display text-[0.9375rem] font-bold tabular-nums text-silver">
              {formatStat(winner.stats[key])}
            </dd>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-3">
            <dt className="text-sm text-faint">{loser.name}</dt>
            <dd className="text-sm tabular-nums text-faint">{formatStat(loser.stats[key])}</dd>
          </div>
          <p className="font-display mt-2 border-t border-[var(--line)] pt-1.5 text-[0.5625rem] font-semibold tracking-[0.22em] text-faint uppercase">
            {round.category.noun} as a Spur
          </p>
        </dl>

        <p className="hl-rise mt-4 text-[0.8125rem] text-faint" style={{ "--d": "620ms" } as React.CSSProperties}>
          {streak >= best && streak > 0 ? "That's a new personal best." : `Best: ${best}`}
        </p>

        <div
          className="hl-rise mt-5 grid gap-2"
          style={{ "--d": "740ms" } as React.CSSProperties}
        >
          <button type="button" onClick={onRestart} className="btn btn--primary w-full">
            Run it back
          </button>
          <Link href="/" className="btn w-full no-underline">
            Back to the vault
          </Link>
        </div>
      </div>
    </div>
  );
}
