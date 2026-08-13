import type { Grade } from "./scoring";

/** One square per round: best available, middle, worst. No names — no spoilers. */
const MARKS = ["🏆", "⬜", "⬛"] as const;

export function shareText(grade: Grade, heading: string, url?: string): string {
  const grid = grade.rounds.map((r) => MARKS[r.rank - 1] ?? "⬛").join("");
  const rings = grade.rings ? ` · ${grade.rings} ring${grade.rings > 1 ? "s" : ""}` : "";
  return [`${heading} — ${grade.total}/100`, `${grade.tier.name}${rings}`, grid, url]
    .filter(Boolean)
    .join("\n");
}

export type ShareOutcome = "shared" | "copied" | "failed";

/**
 * Native share sheet where it exists (the right thing on a phone), clipboard
 * otherwise, and a legacy copy as a last resort. Callers show the raw text for
 * manual copying if all three fail.
 */
export async function shareResult(text: string): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (error) {
      // Dismissing the sheet is a choice, not a failure — don't fall through
      // and paste it into their clipboard behind their back.
      if (error instanceof Error && error.name === "AbortError") return "shared";
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    /* blocked or unavailable — try the old way */
  }

  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.append(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    if (ok) return "copied";
  } catch {
    /* fall through */
  }

  return "failed";
}
