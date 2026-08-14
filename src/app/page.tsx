import Link from "next/link";
import { SpurMark } from "@/components/SpurMark";
import { BestOfThreePreview, SixCluesPreview } from "@/components/hub/Previews";
import { HigherLowerPreview } from "@/components/hub/HigherLowerPreview";
import { formatDateLabel, puzzleNumber, todayInSanAntonio, vaultMeta } from "@/lib/puzzle";
import { PLAYERS } from "@/lib/players";
import { dayIndex } from "@/lib/six-clues/game";

// The slate turns over at midnight in San Antonio.
export const revalidate = 3600;

type Game = {
  href: string;
  title: string;
  badge: string;
  meta: string;
  blurb: string;
  preview: React.ReactNode;
};

export default function Page() {
  const iso = todayInSanAntonio();
  const number = puzzleNumber(iso);
  const dateLabel = formatDateLabel(iso);
  // Six Clues numbers its own days from its own epoch. Anchor it to San
  // Antonio's date (midday, so DST can't tip it) rather than the server's
  // timezone, so the badge agrees with the rest of the slate.
  const sixCluesNumber = dayIndex(new Date(`${iso}T12:00:00`)) + 1;

  const games: Game[] = [
    {
      href: "/best-of-3",
      title: "Best of 3",
      badge: `Daily · No. ${number}`,
      meta: "5 rounds",
      blurb:
        "Five seasons from the archive, three unnamed stat lines each. Sign one and build the best five-man roster you can.",
      preview: <BestOfThreePreview />,
    },
    {
      href: "/six-clues",
      title: "Six Clues",
      badge: `Daily · No. ${sixCluesNumber}`,
      meta: "6 turns",
      blurb:
        "One Spur a day behind a photo blurred past recognition. Every clue sharpens the picture — and costs you points.",
      preview: <SixCluesPreview />,
    },
    {
      href: "/higher-lower",
      title: "Higher / Lower",
      badge: "Endless",
      meta: `${PLAYERS.length} players`,
      blurb:
        "Two Spurs, one stat. Pick whoever put up the bigger number in silver and black — and keep the streak alive.",
      preview: <HigherLowerPreview />,
    },
  ];

  // The ticker reads off the archive itself rather than hardcoded copy.
  const facts = [
    `${vaultMeta.playerSeasons.toLocaleString()} player seasons`,
    `${vaultMeta.first} → ${vaultMeta.last}`,
    "5 NBA championships",
    "HemisFair Arena → Frost Bank Center",
    "Go Spurs Go",
  ];

  return (
    <div className="app">
      <header className="masthead">
        <div className="shell masthead__inner">
          <SpurMark className="masthead__mark text-silver" title="San Antonio Spurs" />
          <p className="flex flex-col leading-[1.1]">
            <span className="font-display text-base font-bold tracking-[0.22em] text-paper uppercase">
              The Vault
            </span>
            <span className="font-display text-[0.5625rem] font-normal tracking-[0.3em] text-faint uppercase">
              San Antonio Spurs
            </span>
          </p>
          <span className="masthead__meta font-display">
            {dateLabel} · No. {number}
          </span>
        </div>
      </header>

      <main className="hub">
        <section className="hub-hero shell">
          <SpurMark className="hub-hero__crest" title="San Antonio Spurs" />
          <div className="hub-rise" style={{ "--d": "80ms" } as React.CSSProperties}>
            <p className="eyebrow mb-3.5">Three daily games · 52 years of box scores</p>
            <h1 className="hub-hero__title">
              The
              <br />
              Vault
            </h1>
          </div>
          <div
            aria-hidden="true"
            className="intro__rule hub-rise"
            style={{ "--d": "160ms" } as React.CSSProperties}
          >
            <span className="hl-breathe" />
          </div>
          <p
            className="intro__lede hub-rise"
            style={{ "--d": "240ms" } as React.CSSProperties}
          >
            Every player who ever wore silver and black, sealed in one archive.{" "}
            <strong>Open it once a day.</strong>
          </p>
        </section>

        <div aria-hidden="true" className="hub-ticker">
          <div className="hub-ticker__track">
            {[0, 1].map((copy) => (
              <p key={copy} className="hub-ticker__run">
                {facts.map((fact, i) => (
                  <span key={fact} className={i === facts.length - 1 ? "text-muted" : undefined}>
                    {fact}
                    <span className="hub-ticker__dot">◆</span>
                  </span>
                ))}
              </p>
            ))}
          </div>
        </div>

        <section className="shell pt-[clamp(1.75rem,5vh,3rem)] pb-4">
          <div className="mb-4.5 flex items-center gap-3.5">
            <h2 className="eyebrow whitespace-nowrap">Tonight&rsquo;s slate</h2>
            <span className="h-px flex-1 bg-[var(--line)]" />
            <span className="font-display text-[0.6875rem] tracking-[0.16em] text-faint uppercase">
              {games.length} games
            </span>
          </div>

          <div className="hub-slate">
            {games.map((game, i) => (
              <Link
                key={game.href}
                href={game.href}
                className="hub-card hub-rise"
                style={{ "--d": `${320 + i * 100}ms` } as React.CSSProperties}
              >
                {game.preview}
                <span className="hub-card__body">
                  <span className="flex items-center gap-2.5">
                    <span className="chip">{game.badge}</span>
                    <span className="font-display text-[0.625rem] font-medium tracking-[0.18em] text-faint uppercase">
                      {game.meta}
                    </span>
                  </span>
                  <span className="hub-card__title">{game.title}</span>
                  <span className="text-[0.8438rem] leading-[1.55] text-muted">{game.blurb}</span>
                  <span className="hub-card__cta">
                    Play <span aria-hidden="true" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="shell footer__inner">
          <SpurMark className="footer__mark" />
          <span className="footer__wordmark">San Antonio Spurs</span>
          <span className="footer__spacer" />
          <span>
            {vaultMeta.first}–{vaultMeta.last?.slice(-2)} ·{" "}
            {vaultMeta.playerSeasons.toLocaleString()} player seasons
          </span>
          <span className="footer__cry">Go Spurs Go</span>
        </div>
      </footer>
    </div>
  );
}
