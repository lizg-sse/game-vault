import type { Metadata } from "next";
import { BestOfThree } from "@/components/BestOfThree";
import { getPracticePuzzle, gradeVault, revealRound } from "../actions";
import { dailyPuzzle, puzzleNumber, todayInSanAntonio, vaultMeta } from "@/lib/puzzle";

// A new vault opens at midnight in San Antonio.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Best of 3 — The Vault",
  description:
    "Five seasons from Spurs history. Three anonymous players each. Build the best five-man roster you can.",
};

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
