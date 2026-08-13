import { VaultGame } from "@/components/VaultGame";
import { getPracticePuzzle, gradeVault, revealRound } from "./actions";
import { dailyPuzzle, puzzleNumber, todayInSanAntonio, vaultMeta } from "@/lib/puzzle";

// A new vault opens at midnight in San Antonio.
export const revalidate = 3600;

export default function Page() {
  return (
    <VaultGame
      initialPuzzle={dailyPuzzle()}
      puzzleNumber={puzzleNumber(todayInSanAntonio())}
      vaultMeta={vaultMeta}
      actions={{ revealRound, gradeVault, getPracticePuzzle }}
    />
  );
}
