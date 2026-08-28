import "server-only";

import { PLAYERS as CLUE_PLAYERS } from "./six-clues/players";

const normalize = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Active/deep-cut players not present in the authored Six Clues roster. */
const HEIGHT_OVERRIDES: Record<string, string> = {
  "aronbaynes": "6-10",
  "blakewesley": "6-3",
  "cediosman": "6-7",
  "charlesbassey": "6-9",
  "dantecunningham": "6-8",
  "davidlee": "6-9",
  "davidwest": "6-9",
  "dewaynededmon": "7-0",
  "dreweubanks": "6-10",
  "joshrichardson": "6-5",
  "joshuaprimo": "6-4",
  "keithbogans": "6-5",
  "rogermason": "6-5",
  "romeolangford": "6-5",
  "treylyles": "6-9",
};

const heightByName = new Map(
  CLUE_PLAYERS.map((player) => [normalize(player.name), player.height] as const),
);

export function heightForName(name: string): string | null {
  return HEIGHT_OVERRIDES[normalize(name)] ?? heightByName.get(normalize(name)) ?? null;
}
