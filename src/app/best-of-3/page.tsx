import type { Metadata } from "next";
import { BestOfThree } from "@/components/BestOfThree";
import { getPracticePuzzle, gradeVault, revealRound } from "../actions";
import {
  dailyPuzzle,
  puzzleNumber,
  todayInSanAntonio,
  vaultMeta,
} from "@/lib/puzzle";

export const metadata: Metadata = {
  title: "Best of 3 — Spurs Vault",
  description:
    "Five seasons from Spurs history. Three anonymous players each. Build the best five-man roster you can.",
};

export const revalidate = 3600;

export default function Page() {
  return (
    <BestOfThree
      initialPuzzle={dailyPuzzle()}
      puzzleNumber={puzzleNumber(todayInSanAntonio())}
      vaultMeta={vaultMeta}
      actions={{ revealRound, gradeVault, getPracticePuzzle }}
    />
  );
}
