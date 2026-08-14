import type { Metadata } from "next";
import Link from "next/link";
import HigherLower from "@/components/higher-lower";
import { SpurMark } from "@/components/SpurMark";
import { PLAYERS } from "@/lib/players";

export const metadata: Metadata = {
  title: "Higher / Lower — Spurs Vault",
  description:
    "Two San Antonio Spurs, one stat. Pick the bigger number and keep your streak alive.",
};

export default function Page() {
  return (
    <div className="app">
      <header className="masthead">
        <div className="shell masthead__inner">
          <Link
            href="/"
            aria-label="Back to The Vault"
            className="-ml-2 grid h-8 w-8 place-items-center rounded-[2px] text-faint no-underline transition-colors hover:text-paper"
          >
            ←
          </Link>
          <SpurMark className="masthead__mark text-silver" title="San Antonio Spurs" />
          <p className="flex flex-col leading-[1.1]">
            <span className="font-display text-base font-bold tracking-[0.19em] text-paper uppercase">
              Higher / Lower
            </span>
            <span className="font-display text-[0.5625rem] font-normal tracking-[0.3em] text-faint uppercase">
              The Vault · SAS
            </span>
          </p>
          <span className="masthead__meta font-display">{PLAYERS.length} players</span>
        </div>
      </header>

      <main className="shell">
        <HigherLower />
      </main>

      <footer className="footer">
        <div className="shell footer__inner">
          <SpurMark className="footer__mark" />
          <span className="footer__wordmark">San Antonio Spurs</span>
          <span className="footer__spacer" />
          <span>Regular-season totals with the Spurs (NBA era) · Stats via Basketball-Reference</span>
          <span className="footer__cry">Go Spurs Go</span>
        </div>
      </footer>
    </div>
  );
}
