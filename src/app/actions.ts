"use server";

import {
  benchmarks,
  buildFullPuzzle,
  practicePuzzle,
  revealRound as revealRoundOnServer,
} from "@/lib/puzzle";
import { gradeRoster, type Grade } from "@/lib/scoring";
import type { Puzzle, Reveal } from "@/lib/types";

/**
 * Puzzles are deterministic functions of their id, so the server can rebuild
 * any of them on demand. That means player identities never have to be shipped
 * to the browser ahead of the pick, and the 200 KB dataset never ships at all.
 */

/** Names and portraits for one round, handed over once the pick is locked. */
export async function revealRound(puzzleId: string, roundIndex: number): Promise<Reveal> {
  return revealRoundOnServer(puzzleId, roundIndex);
}

/** Final grading. Impact scores stay server-side, so this runs here too. */
export async function gradeVault(puzzleId: string, pickIds: string[]): Promise<Grade> {
  return gradeRoster(buildFullPuzzle(puzzleId), pickIds, benchmarks);
}

export async function getPracticePuzzle(seed: string): Promise<Puzzle> {
  return practicePuzzle(seed);
}
