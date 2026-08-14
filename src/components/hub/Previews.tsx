import Image from "next/image";

/**
 * The Best of 3 and Six Clues card previews. Both are pure CSS loops, so they
 * stay server components — only the Higher / Lower card needs a client.
 */

/** Two slates of three, alternating: the blackout lifts, the signed one rises. */
const SLATES = [
  { delay: "0s", picks: ["silasja01", "gervige01", "kenonla01"] },
  { delay: "6s", picks: ["moorejo01", "gilmoar01", "roberal01"] },
];

const LETTERS = ["A", "B", "C"];

export function BestOfThreePreview() {
  return (
    <span className="hub-shot">
      <span aria-hidden="true" className="hub-shot__floor" />
      {SLATES.map((slate) => (
        <span
          key={slate.delay}
          aria-hidden="true"
          className="hub-b3"
          style={{ animationDelay: slate.delay }}
        >
          {slate.picks.map((id, i) => (
            <span
              key={id}
              // The middle card is the one being signed: it rises and lights,
              // the other two dip back.
              className={`hub-b3__tile ${i === 1 ? "is-pick" : ""}`}
              style={{ animationDelay: slate.delay }}
            >
              <Image
                src={`/portraits/${id}.jpg`}
                alt=""
                width={140}
                height={210}
                // The tile is ~24% of a card that tops out near 24rem.
                sizes="120px"
                className="hub-b3__photo"
                style={{ animationDelay: slate.delay }}
              />
              <span className="hub-b3__letter">{LETTERS[i]}</span>
            </span>
          ))}
        </span>
      ))}
      <span aria-hidden="true" className="hub-shot__fade" />
    </span>
  );
}

/** Clues stack up while the photo sharpens out of a blur. */
const CLUES = [
  { n: "01", kind: "Era", text: "Silver & black in the 2000s" },
  { n: "02", kind: "Position", text: "Center" },
  { n: "03", kind: "Honors", text: "Won a title in San Antonio" },
];

export function SixCluesPreview() {
  return (
    <span className="hub-shot">
      <span aria-hidden="true" className="hub-shot__floor" />
      <span aria-hidden="true" className="hub-sx__frame">
        <Image
          src="/six-clues/1495.webp"
          alt=""
          width={260}
          height={260}
          sizes="220px"
          className="hub-sx__photo"
        />
        <span className="hub-sx__veil" />
        <span className="hub-sx__mark">?</span>
      </span>
      <span aria-hidden="true" className="hub-sx__clues">
        <span className="hub-sx__stack">
          {CLUES.map((c, i) => (
            <span key={c.n} className="hub-sx__clue" style={{ "--i": i } as React.CSSProperties}>
              <span className="hub-sx__label">
                Clue {c.n} · {c.kind}
              </span>
              <span className="hub-sx__text">{c.text}</span>
            </span>
          ))}
        </span>
        <span className="hub-sx__pips">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="hub-sx__pip"
              // The first three tick over as their clue lands; the rest stay unspent.
              style={i < 3 ? ({ "--i": i } as React.CSSProperties) : undefined}
              data-spends={i < 3 ? "true" : undefined}
            />
          ))}
        </span>
      </span>
      <span aria-hidden="true" className="hub-shot__fade" />
    </span>
  );
}
