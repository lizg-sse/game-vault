'use client'

import type { Player } from '@/lib/six-clues/players'
import { Sheet } from './Sheet'

/**
 * Easy mode's safety net: everyone still consistent with every clue shown so far.
 * The list narrows on its own as clues land.
 */
export function HintSheet({
  open,
  onClose,
  candidates,
  revealed,
  showCandidates,
  onPick,
}: {
  open: boolean
  onClose: () => void
  candidates: Player[]
  revealed: number
  showCandidates: boolean
  onPick: (player: Player) => void
}) {
  return (
    <Sheet open={open} onClose={onClose} title={showCandidates ? 'Still in play' : 'Hint'}>
      {showCandidates ? (
        <>
          <p className="mb-3.5 text-[13px] leading-relaxed text-faint">
            <span className="font-semibold text-paper">{candidates.length}</span>{' '}
            {candidates.length === 1 ? 'player fits' : 'players fit'}{' '}
            {revealed === 1 ? 'the first clue' : `all ${revealed} clues so far`}. Tap one to guess it.
          </p>

          <div className="flex flex-wrap gap-1.5">
            {candidates.map(player => (
              <button
                key={player.id}
                onClick={() => {
                  onPick(player)
                  onClose()
                }}
                className="rounded-[2px] border border-[var(--line-strong)] bg-raised px-3 py-1.5 text-[13px] text-silver transition-colors active:bg-edge active:text-paper"
              >
                {player.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="text-[13px] leading-relaxed text-faint">
          The clues have narrowed this one down enough. Take your shot before the next clue lands.
        </p>
      )}
    </Sheet>
  )
}
