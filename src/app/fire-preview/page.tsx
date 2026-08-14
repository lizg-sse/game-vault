"use client";

/**
 * TEMPORARY review harness — delete once the heat treatment is signed off.
 * Drives the real StreakFire with the real heat/fire/tier mapping, so what is
 * on screen here is exactly what the game renders at that streak.
 */
import { useEffect, useRef, useState } from "react";
import { fireFor, heatFor, tierFor, TIERS } from "@/components/higher-lower/heat";
import { StreakFire } from "@/components/higher-lower/StreakFire";

export default function Page() {
  const [streak, setStreak] = useState(0);
  const [surge, setSurge] = useState(0);
  const [auto, setAuto] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // "Auto" walks the streak up the way a real run does — a pick every 2.7s,
  // with the surge landing as the number would.
  useEffect(() => {
    if (!auto) return;
    timer.current = setInterval(() => {
      setStreak((s) => (s >= 14 ? 0 : s + 1));
      setSurge((n) => n + 1);
    }, 2700);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [auto]);

  const heat = heatFor(streak);
  const fire = fireFor(streak);
  const tier = tierFor(streak);

  return (
    <div
      className="hl min-h-dvh"
      style={{ "--heat": heat, "--fire": fire } as React.CSSProperties}
    >
      <StreakFire intensity={fire} surge={surge} />
      <div aria-hidden="true" className="hl-heatwave" />
      {tier > 0 && <div key={tier} aria-hidden="true" className="hl-flash" />}

      <div className="relative z-50 mx-auto grid w-full max-w-2xl gap-6 p-8">
        <p className="eyebrow">Heat review · Higher / Lower</p>

        {/* Same markup as the game's scoreboard. */}
        <div className="flex items-stretch justify-center gap-2.5">
          <div className="hl-streak min-w-26 rounded-[3px] border bg-silver/8 px-4 py-2 text-center">
            <div className="font-display text-[0.5625rem] font-semibold tracking-[0.24em] text-muted uppercase">
              Streak
            </div>
            <div className="font-display text-[1.75rem] leading-[1.1] font-bold tabular-nums text-paper">
              {streak}
            </div>
          </div>
        </div>

        <p role="status" className="min-h-6 text-center">
          {tier > 0 && (
            <span
              key={tier}
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

        <div className="grid gap-2 text-center">
          <p className="text-sm text-muted">
            streak <b className="text-paper tabular-nums">{streak}</b> · heat{" "}
            <b className="text-paper tabular-nums">{heat.toFixed(2)}</b> · fire{" "}
            <b className="text-paper tabular-nums">{fire.toFixed(2)}</b>
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[0, 3, 4, 5, 6, 8, 10, 12, 14].map((n) => (
              <button
                key={n}
                className={`btn ${streak === n ? "btn--primary" : ""}`}
                onClick={() => {
                  setStreak(n);
                  setSurge((s) => s + 1);
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button className="btn" onClick={() => setSurge((s) => s + 1)}>
              Surge (a pick lands)
            </button>
            <button className="btn" onClick={() => setAuto((a) => !a)}>
              {auto ? "Stop auto-run" : "Auto-run a streak"}
            </button>
            <button
              className="btn"
              onClick={() => {
                setAuto(false);
                setStreak(0);
              }}
            >
              Streak over (burn out)
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-faint">
          Tiers: 3 heating up · 5 on fire · 8 he&rsquo;s on fire. Flame keeps growing to 12.
        </p>
      </div>
    </div>
  );
}
