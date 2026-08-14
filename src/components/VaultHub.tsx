import Image from "next/image";
import Link from "next/link";
import styles from "./VaultHub.module.css";
import { SpurMark } from "./SpurMark";

type VaultHubProps = {
  dateLabel: string;
  weekdayLabel: string;
  puzzleNumber: number;
  playerSeasons: number;
  firstSeason?: string;
  lastSeason?: string;
};

const archiveTicker = [
  "498 player seasons",
  "1973-74 → 2024-25",
  "5 NBA championships",
  "HemisFair Arena → Frost Bank Center",
  "Go Spurs Go",
];

export function VaultHub({
  dateLabel,
  weekdayLabel,
  puzzleNumber,
  playerSeasons,
  firstSeason,
  lastSeason,
}: VaultHubProps) {
  const dailyLabel = `Daily · No. ${puzzleNumber}`;

  return (
    <div className={styles.app}>
      <header className={styles.masthead}>
        <div className={`${styles.shell} ${styles.mastheadInner}`}>
          <SpurMark className={styles.mastheadMark} title="San Antonio Spurs" />
          <p className={styles.mastheadTitle}>
            <span>The Vault</span>
            <small>San Antonio Spurs</small>
          </p>
          <span className={styles.mastheadMeta}>
            {dateLabel} · No. {puzzleNumber}
          </span>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={`${styles.shell} ${styles.heroInner}`}>
            <SpurMark className={styles.heroMark} />
            <div className={styles.heroTitleBlock}>
              <p className={styles.eyebrow}>Three daily games · 52 years of box scores</p>
              <h1>
                The
                <br />
                Vault
              </h1>
            </div>
            <div className={styles.heroRule} aria-hidden="true">
              <span />
            </div>
            <p className={styles.heroLede}>
              Every player who ever wore silver and black, sealed in one archive. <strong>Open it once a day.</strong>
            </p>
          </div>
        </section>

        <div className={styles.ticker} aria-hidden="true">
          <div className={styles.tickerTrack}>
            {[0, 1].map((copy) => (
              <p key={copy}>
                {archiveTicker.map((item) => (
                  <span key={item} className={item === "Go Spurs Go" ? styles.tickerCallout : undefined}>
                    {item}
                  </span>
                ))}
              </p>
            ))}
          </div>
        </div>

        <section className={`${styles.shell} ${styles.slate}`}>
          <div className={styles.sectionLabel}>
            <h2>Tonight&apos;s slate</h2>
            <span />
            <p>3 games</p>
          </div>

          <div className={styles.gameGrid}>
            <Link href="/best-of-3" className={`${styles.gameCard} ${styles.bestCard}`}>
              <span className={styles.sheen} aria-hidden="true" />
              <span className={styles.cardVisual} aria-hidden="true">
                <span className={styles.bestFigure} />
                <span className={`${styles.option} ${styles.optionA}`}>A</span>
                <span className={`${styles.option} ${styles.optionB}`}>B</span>
                <span className={`${styles.option} ${styles.optionC}`}>C</span>
              </span>
              <CardCopy badge={dailyLabel} detail="5 rounds" title="Best of 3">
                Five seasons from the archive, three unnamed stat lines each. Sign one and build the best five-man roster you can.
              </CardCopy>
            </Link>

            <Link href="/six-clues" className={`${styles.gameCard} ${styles.cluesCard}`}>
              <span className={styles.sheen} aria-hidden="true" />
              <span className={styles.cardVisual} aria-hidden="true">
                <span className={styles.cluePortrait}>
                  <Image src="/six-clues/1495.webp" alt="" width={320} height={320} />
                  <b>?</b>
                </span>
              </span>
              <CardCopy badge={dailyLabel} detail="6 turns" title="Six Clues">
                One Spur a day behind a photo blurred past recognition. Every clue sharpens the picture — and costs you points.
              </CardCopy>
            </Link>

            <Link href="/higher-lower" className={`${styles.gameCard} ${styles.higherLowerCard}`}>
              <span className={styles.sheen} aria-hidden="true" />
              <span className={styles.cardVisual} aria-hidden="true">
                <Image className={styles.leftPlayer} src="/players/duncati01.webp" alt="" width={520} height={380} />
                <Image className={styles.rightPlayer} src="/players/robinda01.webp" alt="" width={520} height={380} />
                <span className={styles.vs}>
                  <b>VS</b>
                </span>
              </span>
              <CardCopy badge="Endless" detail="61 players" title="Higher / Lower">
                Two Spurs, one stat. Pick whoever put up the bigger number in silver and black — and keep the streak alive.
              </CardCopy>
            </Link>
          </div>

          <p className={styles.archiveNote}>
            {playerSeasons.toLocaleString()} real player seasons · 52 years · {firstSeason} to {lastSeason} · Stats via Basketball-Reference
          </p>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerInner}`}>
          <SpurMark className={styles.footerMark} />
          <b>San Antonio Spurs</b>
          <span className={styles.footerSpacer} />
          <span>
            The Vault · {weekdayLabel}, {dateLabel}
          </span>
          <strong>Go Spurs Go</strong>
        </div>
      </footer>
    </div>
  );
}

function CardCopy({
  badge,
  detail,
  title,
  children,
}: {
  badge: string;
  detail: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <span className={styles.cardCopy}>
      <span className={styles.cardMeta}>
        <span>{badge}</span>
        <small>{detail}</small>
      </span>
      <span className={styles.cardTitle}>{title}</span>
      <span className={styles.cardDescription}>{children}</span>
      <span className={styles.play}>
        Play <i />
      </span>
    </span>
  );
}
