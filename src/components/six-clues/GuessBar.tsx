'use client'

import { useId, useRef, useState } from 'react'
import type { Player } from '@/lib/six-clues/players'
import { searchPlayers, MAX_ROUNDS, type Turn } from '@/lib/six-clues/game'

function Pips({ turns, status }: { turns: Turn[]; status: 'playing' | 'won' | 'lost' }) {
  return (
    <div className="flex justify-center gap-1.5" aria-label={`${turns.length} of ${MAX_ROUNDS} turns used`}>
      {Array.from({ length: MAX_ROUNDS }, (_, i) => {
        const turn = turns[i]
        const isWin = status === 'won' && i === turns.length - 1
        return (
          <span
            key={i}
            className={`h-1.5 w-7 rounded-full transition-colors duration-300 ${
              isWin
                ? 'bg-fiesta-teal'
                : !turn
                  ? 'bg-line'
                  : turn.kind === 'skip'
                    ? 'bg-fiesta-orange/70'
                    : 'bg-fiesta-pink/70'
            }`}
          />
        )
      })}
    </div>
  )
}

export function GuessBar({
  pool,
  turns,
  status,
  canHint,
  hintCount,
  onGuess,
  onSkip,
  onHint,
  shake,
}: {
  pool: Player[]
  turns: Turn[]
  status: 'playing' | 'won' | 'lost'
  canHint: boolean
  hintCount: number
  onGuess: (player: Player) => void
  onSkip: () => void
  onHint: () => void
  shake: number
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [activeFor, setActiveFor] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const matches = focused ? searchPlayers(pool, query) : []
  const open = matches.length > 0

  // Editing the query invalidates the highlighted row; reset it during render
  // rather than in an effect, so there's no flash of a stale selection.
  if (activeFor !== query) {
    setActiveFor(query)
    setActive(0)
  }

  const submit = (player: Player | undefined) => {
    if (!player) return
    setQuery('')
    onGuess(player)
    inputRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(a => (a + 1) % matches.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(a => (a - 1 + matches.length) % matches.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      submit(matches[active])
    } else if (e.key === 'Escape') {
      setQuery('')
    }
  }

  return (
    <div className="relative">
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching players"
          className="animate-fade-in absolute bottom-full left-0 mb-2 max-h-[42dvh] w-full overflow-y-auto rounded-2xl border border-line-2 bg-panel shadow-[0_-14px_40px_-12px_rgb(0_0_0_/_0.85)]"
        >
          {matches.map((player, i) => (
            <li key={player.id} role="option" aria-selected={i === active}>
              <button
                // onMouseDown fires before the input's blur, so the tap still registers.
                onMouseDown={e => {
                  e.preventDefault()
                  submit(player)
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center px-4 py-3 text-left text-[15px] transition-colors ${
                  i === active ? 'bg-panel-2 text-chalk' : 'text-silver'
                }`}
              >
                {player.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2.5">
        <Pips turns={turns} status={status} />

        <div className={`flex gap-2 ${shake > 0 ? 'animate-shake' : ''}`} key={shake}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
            placeholder="Name a Spur…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            role="combobox"
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            aria-autocomplete="list"
            aria-label="Guess a San Antonio Spurs player"
            className="min-w-0 flex-1 rounded-2xl border border-line-2 bg-panel px-4 py-3 text-[16px] text-chalk placeholder:text-silver-dim/70 focus:border-silver/60 focus:outline-none"
          />
          <button
            onClick={() => submit(matches[active] ?? searchPlayers(pool, query, 1)[0])}
            disabled={!query.trim()}
            className="rounded-2xl bg-silver px-4 text-[14px] font-semibold text-ink transition-opacity disabled:opacity-30"
          >
            Guess
          </button>
        </div>

        <div className="flex gap-2">
          {canHint && (
            <button
              onClick={onHint}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line-2 bg-panel-2 py-2.5 text-[13px] font-medium text-silver transition-colors active:bg-line"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-fiesta-orange" fill="currentColor">
                <path d="M8 1a4.6 4.6 0 0 0-2.7 8.33c.3.22.48.55.5.91l.03.51h4.34l.03-.51c.02-.36.2-.69.5-.91A4.6 4.6 0 0 0 8 1ZM6 12.4h4v.6a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-.6Z" />
              </svg>
              Hint
              <span className="font-mono text-[11px] text-silver-dim">{hintCount}</span>
            </button>
          )}
          <button
            onClick={onSkip}
            className="flex-1 rounded-xl border border-line-2 bg-panel-2 py-2.5 text-[13px] font-medium text-silver transition-colors active:bg-line"
          >
            Skip for a clue
          </button>
        </div>
      </div>
    </div>
  )
}
