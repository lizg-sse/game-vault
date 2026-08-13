'use client'

import type { Clue } from '@/lib/six-clues/clues'
import { MAX_ROUNDS } from '@/lib/six-clues/game'

export type GuessNote = {
  name: string
  /** Label of the first revealed clue this guess contradicts, or null if it fits them all. */
  ruledOutBy: string | null
}

export function ClueStack({
  clues,
  revealed,
  notes,
}: {
  clues: Clue[]
  revealed: number
  notes: GuessNote[]
}) {
  return (
    <div className="space-y-2">
      <ol className="space-y-2">
        {clues.slice(0, revealed).map(clue => (
          <li
            key={clue.key}
            className="animate-clue-in rounded-[3px] border border-[var(--line)] bg-surface px-3.5 py-2.5"
          >
            <p className="font-display text-[10px] tracking-[0.14em] text-faint uppercase">
              {clue.label}
            </p>
            <p className="mt-0.5 text-[15px] leading-snug font-semibold text-paper">{clue.value}</p>
          </li>
        ))}
      </ol>

      {revealed < MAX_ROUNDS && (
        <ul className="space-y-2" aria-hidden>
          {clues.slice(revealed).map(clue => (
            <li
              key={clue.key}
              className="flex items-center gap-2 rounded-[3px] border border-dashed border-[var(--line)] px-3.5 py-2.5 opacity-45"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-faint" fill="currentColor">
                <path d="M8 1a3.2 3.2 0 0 0-3.2 3.2V6H4.4A1.4 1.4 0 0 0 3 7.4v5.2A1.4 1.4 0 0 0 4.4 14h7.2a1.4 1.4 0 0 0 1.4-1.4V7.4A1.4 1.4 0 0 0 11.6 6h-.4V4.2A3.2 3.2 0 0 0 8 1Zm1.8 5H6.2V4.2a1.8 1.8 0 1 1 3.6 0V6Z" />
              </svg>
              <span className="font-display text-[10px] tracking-[0.14em] text-faint uppercase">
                {clue.label}
              </span>
            </li>
          ))}
        </ul>
      )}

      {notes.length > 0 && (
        <ul className="space-y-1.5 pt-1">
          {notes.map((note, i) => (
            <li
              key={`${note.name}-${i}`}
              className="flex items-baseline gap-2 rounded-[3px] bg-surface/60 px-3 py-2 text-[13px]"
            >
              <span className="font-medium text-faint line-through">{note.name}</span>
              <span className="ml-auto text-right text-[11px] text-faint/80">
                {note.ruledOutBy ? (
                  <>
                    ruled out by <span className="text-fiesta-pink/90">{note.ruledOutBy}</span>
                  </>
                ) : (
                  <span className="text-fiesta-orange/90">fits every clue — but not the one</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
