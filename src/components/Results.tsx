"use client";

import { useEffect, useState } from "react";
import { Portrait } from "./Portrait";
import { postseasonShort } from "./SeasonPlate";
import { COMPONENTS, ROLE_LABEL, type Grade } from "@/lib/scoring";
import { headlineStats } from "@/lib/statline";
import { shareResult, shareText, type ShareOutcome } from "@/lib/share";

export function Results({
  grade,
  heading,
  onPractice,
}: {
  grade: Grade;
  heading: string;
  onPractice: () => void;
}) {
  // Hold the dial and bars at zero for a beat so they visibly fill.
  const [armed, setArmed] = useState(false);
  const [shared, setShared] = useState<ShareOutcome | "idle">("idle");
  const summary = shareText(
    grade,
    heading,
    typeof location !== "undefined" ? location.origin : undefined
  );

  useEffect(() => {
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, []);

  async function handleShare() {
    const outcome = await shareResult(summary);
    setShared(outcome);
    if (outcome !== "failed") setTimeout(() => setShared("idle"), 2400);
  }

  return (
    <div className="results">
      <section
        className="scorecard"
        aria-label={`Vault score ${grade.total} out of 100, ${grade.tier.name}`}
      >
        <div
          className="dial"
          style={{ "--pct": armed ? grade.total : 0 } as React.CSSProperties}
          aria-hidden="true"
        >
          <p className="dial__value">
            <b>{grade.total}</b>
            <span>/100</span>
          </p>
        </div>

        <div className="scorecard__body">
          <p className="eyebrow">The Vault Score</p>
          <h2 className="scorecard__tier">{grade.tier.name}</h2>
          <p className="scorecard__note">{grade.tier.note}</p>
          <div className="scorecard__badges">
            {grade.rings > 0 && (
              <span className="chip chip--title">
                {grade.rings} championship season{grade.rings > 1 ? "s" : ""}
              </span>
            )}
            <span className="chip">
              {grade.roleCounts.G}G · {grade.roleCounts.W}W · {grade.roleCounts.B}B
            </span>
            <span className="chip">
              {grade.rounds.filter((r) => r.rank === 1).length} of {grade.rounds.length} best
              available
            </span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h3 className="eyebrow">Score breakdown</h3>
        </div>
        <div className="bars">
          {COMPONENTS.map((c) => {
            const value = grade.parts[c.key];
            return (
              <div key={c.key} className="bar">
                <p className="bar__label">{c.label}</p>
                <p className="bar__value">
                  {value} <span>/ {c.max}</span>
                </p>
                <span className="bar__track">
                  <span
                    className="bar__fill"
                    style={{ "--w": `${armed ? (value / c.max) * 100 : 0}%` } as React.CSSProperties}
                  />
                </span>
                <p className="bar__blurb">{c.blurb}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h3 className="eyebrow">The roster you built</h3>
        </div>
        <div className="review">
          {grade.rounds.map((r, i) => {
            const stats = headlineStats(r.pick, 2);
            const missed = r.rank > 1;
            return (
              <article key={`${i}-${r.pick.id}`} className="review__row">
                <Portrait
                  src={r.pick.img}
                  name={r.pick.name}
                  revealed
                  className="portrait portrait--review"
                />
                <div className="review__who">
                  <b>{r.pick.name}</b>
                  <span>
                    {r.season.label} · {ROLE_LABEL[r.pick.role]} ·{" "}
                    {stats.map((s) => `${s.value} ${s.label}`).join("  ")}
                  </span>
                  <span>
                    {r.season.wins}–{r.season.losses} ·{" "}
                    {postseasonShort(r.season.postseason)}
                  </span>
                </div>
                <div className="review__verdict">
                  {r.rank === 1 ? (
                    <span className="tag tag--best">Best available</span>
                  ) : r.rank === 2 ? (
                    <span className="tag tag--mid">Second best</span>
                  ) : (
                    <span className="tag tag--miss">Third of three</span>
                  )}
                  {missed && (
                    <small>
                      <b>{r.best.name}</b> was on the board —{" "}
                      {headlineStats(r.best, 1)
                        .map((s) => `${s.value} ${s.label}`)
                        .join(", ")}
                    </small>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h3 className="eyebrow">Roster fit</h3>
        </div>
        <div className="coverage">
          {grade.coverage.map((c) => (
            <div key={c.key} className="coverage__cell" data-met={c.met}>
              <p className="coverage__mark">{c.met ? "Covered" : "Missing"}</p>
              <b>{c.label}</b>
              <span>{c.by ? c.by.name : "Nobody on this roster"}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="actions">
        <button type="button" className="btn btn--primary" onClick={handleShare}>
          {shared === "copied" ? "Copied" : shared === "shared" ? "Shared" : "Share result"}
        </button>
        <button type="button" className="btn" onClick={onPractice}>
          Play a practice vault
        </button>
      </div>

      {/* If the browser blocks both sharing and the clipboard, put the text
          where it can simply be selected. */}
      {shared === "failed" && (
        <div className="section">
          <p className="eyebrow">Copy this</p>
          <pre className="share-fallback">{summary}</pre>
        </div>
      )}

      <p aria-live="polite" className="visually-hidden">
        {shared === "copied" ? "Result copied to clipboard" : shared === "shared" ? "Result shared" : ""}
      </p>
    </div>
  );
}
