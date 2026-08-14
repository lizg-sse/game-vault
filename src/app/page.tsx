import { VaultHub } from "@/components/VaultHub";
import { puzzleNumber, todayInSanAntonio, vaultMeta } from "@/lib/puzzle";

// A new vault opens at midnight in San Antonio.
export const revalidate = 3600;

export default function Page() {
  const today = todayInSanAntonio();
  const date = new Date(`${today}T00:00:00Z`);
  const dateLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
  const weekdayLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(date);

  return (
    <VaultHub
      dateLabel={dateLabel}
      weekdayLabel={weekdayLabel}
      puzzleNumber={puzzleNumber(today)}
      playerSeasons={vaultMeta.playerSeasons}
      firstSeason={vaultMeta.first}
      lastSeason={vaultMeta.last}
    />
  );
}
