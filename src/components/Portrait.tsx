import Image from "next/image";
import { SpurMark } from "./SpurMark";

/**
 * Portrait plate.
 *
 * Before a pick is locked the plate shows a blacked-out figure — a real
 * photographic silhouette, but the *same* one on every card in every round, so
 * the artwork carries no information about who is behind it. The identity is
 * not in the page at all until the server hands it over.
 *
 * On reveal the figure dissolves as the archive photo comes up underneath.
 */
export function Portrait({
  src,
  name,
  revealed,
  size = 140,
  letter,
  className,
}: {
  src: string | null;
  name: string | null;
  revealed: boolean;
  size?: number;
  /** Ghosted behind a redacted plate so each card still reads as A / B / C. */
  letter?: string;
  className?: string;
}) {
  const height = Math.round(size * 1.5);
  const state = !revealed ? "redacted" : src ? "photo" : "none";

  return (
    <span className={className} data-portrait={state} data-letter={letter}>
      {revealed && src && (
        <Image
          src={src}
          alt={`${name ?? "Player"}, San Antonio Spurs`}
          width={size}
          height={height}
          sizes={`${size}px`}
          className="portrait__photo"
        />
      )}

      {revealed && !src && (
        <>
          <SpurMark className="portrait__crest" />
          <span className="portrait__note">No photo on file</span>
        </>
      )}

      {/* The blackout figure. Stays mounted through the reveal so it can
          dissolve rather than pop. */}
      <span className="portrait__figure" aria-hidden="true" />
    </span>
  );
}
