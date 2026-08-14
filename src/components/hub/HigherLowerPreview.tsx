"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * The Higher / Lower card's preview: matchups dealing through, one after
 * another, with the bigger number lit.
 *
 * Display-only, and deliberately not read from the player data — every player
 * here is retired, so these totals are final and can't drift when the dataset
 * is regenerated. Keeping them local also keeps the whole player table off the
 * landing page bundle.
 */
const MATCHUPS = [
  {
    noun: "points",
    left: { id: "duncati01", name: "Tim Duncan", value: 26496 },
    right: { id: "robinda01", name: "David Robinson", value: 20790 },
  },
  {
    noun: "assists",
    left: { id: "parketo01", name: "Tony Parker", value: 6829 },
    right: { id: "ginobma01", name: "Manu Ginóbili", value: 4001 },
  },
  {
    noun: "points",
    left: { id: "gervige01", name: "George Gervin", value: 19383 },
    right: { id: "robinda01", name: "David Robinson", value: 20790 },
  },
];

const HOLD_MS = 3000;
const LEAVE_MS = 520;

export function HigherLowerPreview() {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const still = useReducedMotion();

  useEffect(() => {
    if (still) return;
    const out = setTimeout(() => setLeaving(true), HOLD_MS);
    const next = setTimeout(() => {
      setLeaving(false);
      setIndex((n) => (n + 1) % MATCHUPS.length);
    }, HOLD_MS + LEAVE_MS);
    return () => {
      clearTimeout(out);
      clearTimeout(next);
    };
  }, [index, still]);

  const m = MATCHUPS[index];
  const leftWins = m.left.value > m.right.value;

  return (
    <span className="hub-shot">
      <span aria-hidden="true" className="hub-shot__floor" />
      <span
        aria-hidden="true"
        key={index}
        className={`absolute inset-0 ${leaving ? "hub-hl-out" : "hub-hl-in"}`}
      >
        <Image
          src={`/players/${m.left.id}.webp`}
          alt=""
          width={520}
          height={380}
          sizes="260px"
          className={`hl-fade-figure absolute bottom-[-4%] left-[2%] w-[52%] origin-bottom grayscale contrast-115 transition-[scale] duration-300 ${
            leftWins ? "scale-104 brightness-90" : "scale-96 brightness-70"
          }`}
        />
        <Image
          src={`/players/${m.right.id}.webp`}
          alt=""
          width={520}
          height={380}
          sizes="260px"
          className={`hl-fade-figure absolute right-[2%] bottom-[-4%] w-[52%] origin-bottom -scale-x-100 grayscale contrast-115 transition-[scale] duration-300 ${
            leftWins ? "brightness-70" : "brightness-90"
          }`}
        />
        <span className={`hub-hl-val left-[6%] ${leftWins ? "is-win" : ""}`}>
          {m.left.value.toLocaleString("en-US")}
        </span>
        <span className={`hub-hl-val right-[6%] ${leftWins ? "" : "is-win"}`}>
          {m.right.value.toLocaleString("en-US")}
        </span>
      </span>
      <span aria-hidden="true" className="hub-vs">
        <span>VS</span>
      </span>
      <span aria-hidden="true" className="hub-shot__fade" />
      <span className="visually-hidden">
        {m.left.name} versus {m.right.name}, career {m.noun} as a Spur.
      </span>
    </span>
  );
}
