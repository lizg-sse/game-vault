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
  onPick,
}: {
  open: boolean
  onClose: () => void
  candidates: Player[]
  revealed: number
  onPick: (player: Player) => void
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Still in play">
      <p className="mb-3.5 text-[13px] leading-relaxed text-silver-dim">
        <span className="font-semibold text-chalk">{candidates.length}</span>{' '}
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
            className="rounded-full border border-line-2 bg-panel-2 px-3 py-1.5 text-[13px] text-silver transition-colors active:bg-line active:text-chalk"
          >
            {player.name}
          </button>
        ))}
      </div>

      {candidates.length === 0 && (
        <p className="text-[13px] text-fiesta-orange">
          You&rsquo;ve already guessed everyone the clues allow.
        </p>
      )}
    </Sheet>
  )
}
