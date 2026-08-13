import type { Metadata } from "next";
import Link from "next/link";
import HigherLower from "@/components/higher-lower";
import { PLAYERS } from "@/lib/players";

export const metadata: Metadata = {
  title: "Higher / Lower — Spurs Vault",
  description:
    "Two San Antonio Spurs, one stat. Pick the bigger number and keep your streak alive.",
};

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 transition hover:text-zinc-100"
          >
            ← Spurs Vault
          </Link>
          <span className="text-xs text-zinc-500">{PLAYERS.length} players</span>
        </div>
      </header>

      <HigherLower />

      <footer className="px-4 pb-6 text-center text-xs text-zinc-600">
        Regular-season totals with the Spurs (NBA era). Stats via Basketball-Reference.
      </footer>
    </div>
  );
}
