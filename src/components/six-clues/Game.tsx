'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Player } from '@/lib/six-clues/players'
import { buildClues, contradiction, stillInPlay } from '@/lib/six-clues/clues'
import { useIsClient } from '@/lib/six-clues/useIsClient'
import {
  MAX_ROUNDS,
  cluesRevealed,
  dayIndex,
  loadGame,
  loadMode,
  loadSeenHelp,
  loadStats,
  newGame,
  playerForDay,
  poolFor,
  recordResult,
  saveGame,
  saveMode,
  saveSeenHelp,
  type GameState,
  type Mode,
} from '@/lib/six-clues/game'
import { ClueStack, type GuessNote } from './ClueStack'
import { GuessBar } from './GuessBar'
import { Headshot } from './Headshot'
import { HelpSheet } from './HelpSheet'
import { HintSheet } from './HintSheet'
import { ResultPanel } from './ResultPanel'
import { StatsSheet } from './StatsSheet'

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-full border border-line text-silver-dim transition-colors active:bg-panel-2 active:text-chalk"
    >
      {children}
    </button>
  )
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Difficulty"
      className="flex rounded-full border border-line bg-panel p-0.5"
    >
      {(['easy', 'hard'] as const).map(m => (
        <button
          key={m}
          role="radio"
          aria-checked={mode === m}
          onClick={() => onChange(m)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide capitalize transition-colors ${
            mode === m ? 'bg-silver text-ink' : 'text-silver-dim'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

export function Game() {
  // Everything below depends on the browser's clock and localStorage, so the board
  // only mounts once we're past hydration.
  return useIsClient() ? (
    <Board />
  ) : (
    <div className="app-bg flex h-dvh items-center justify-center">
      <p className="font-mono text-[11px] tracking-[0.2em] text-silver-dim uppercase">
        Opening the vault…
      </p>
    </div>
  )
}

function Board() {
  const [boot] = useState(() => {
    const day = dayIndex()
    const mode = loadMode()
    return {
      day,
      mode,
      game: loadGame(mode, day) ?? newGame(day, mode),
      stats: loadStats(mode),
      seenHelp: loadSeenHelp(),
    }
  })

  const day = boot.day
  const [mode, setMode] = useState<Mode>(boot.mode)
  const [game, setGame] = useState<GameState>(boot.game)
  const [stats, setStats] = useState(boot.stats)

  const [sheet, setSheet] = useState<'hint' | 'stats' | 'help' | null>(
    boot.seenHelp ? null : 'help'
  )
  const [shake, setShake] = useState(0)
  const [flash, setFlash] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const closeSheet = useCallback(() => {
    setSheet(current => {
      if (current === 'help') saveSeenHelp()
      return null
    })
  }, [])

  const switchMode = useCallback(
    (next: Mode) => {
      setMode(next)
      saveMode(next)
      setGame(loadGame(next, day) ?? newGame(day, next))
      setStats(loadStats(next))
      setFlash('')
    },
    [day]
  )

  const target = useMemo(() => playerForDay(mode, day), [mode, day])
  const clues = useMemo(() => buildClues(target), [target])
  const pool = useMemo(() => poolFor(mode), [mode])
  const revealed = cluesRevealed(game)

  const guessedNames = useMemo(
    () => game.turns.flatMap(t => (t.kind === 'guess' ? [t.name] : [])),
    [game]
  )

  const notes: GuessNote[] = useMemo(() => {
    const out: GuessNote[] = []
    for (const turn of game.turns) {
      if (turn.kind !== 'guess' || turn.correct) continue
      const guessed = pool.find(p => p.name === turn.name)
      if (!guessed) continue
      // Judged against every clue on the table now, not just the ones showing when
      // the guess was made — so a later clue can explain an earlier miss.
      out.push({ name: turn.name, ruledOutBy: contradiction(guessed, clues, revealed)?.label ?? null })
    }
    return out
  }, [game, pool, clues, revealed])

  const candidates = useMemo(
    () => stillInPlay(pool, clues, revealed, guessedNames),
    [pool, clues, revealed, guessedNames]
  )

  const commit = useCallback((next: GameState) => {
    saveGame(next)
    setGame(next)
    if (next.status !== 'playing') setStats(recordResult(next.mode, next))
  }, [])

  const onGuess = useCallback(
    (player: Player) => {
      if (game.status !== 'playing') return
      if (guessedNames.includes(player.name)) {
        setFlash(`You already tried ${player.name}.`)
        setShake(s => s + 1)
        return
      }

      const correct = player.id === target.id
      const turns = [...game.turns, { kind: 'guess' as const, name: player.name, correct }]
      setFlash('')
      if (!correct) setShake(s => s + 1)
      commit({
        ...game,
        turns,
        status: correct ? 'won' : turns.length >= MAX_ROUNDS ? 'lost' : 'playing',
      })
    },
    [game, target, guessedNames, commit]
  )

  const onSkip = useCallback(() => {
    if (game.status !== 'playing') return
    const turns = [...game.turns, { kind: 'skip' as const }]
    setFlash('')
    commit({ ...game, turns, status: turns.length >= MAX_ROUNDS ? 'lost' : 'playing' })
  }, [game, commit])

  // Keep the newest clue in view as the stack grows past the fold.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [game])

  const over = game.status !== 'playing'

  return (
    <div className="app-bg relative flex h-dvh flex-col">
      <header className="relative z-10 flex items-center gap-2.5 border-b border-line px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5">
        <div className="flex-1">
          <h1 className="bg-gradient-to-b from-white to-silver bg-clip-text text-[15px] leading-none font-bold tracking-[0.12em] text-transparent uppercase">
            Spurs Vault
          </h1>
          <p className="mt-1 font-mono text-[10px] tracking-widest text-silver-dim">No. {day + 1}</p>
        </div>

        <ModeToggle mode={mode} onChange={switchMode} />

        <IconButton label="How to play" onClick={() => setSheet('help')}>
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="8" cy="8" r="6.2" />
            <path d="M6.3 6.2a1.75 1.75 0 1 1 2.3 1.66c-.4.14-.6.5-.6.92v.3" strokeLinecap="round" />
            <circle cx="8" cy="11.6" r="0.75" fill="currentColor" stroke="none" />
          </svg>
        </IconButton>
        <IconButton label="Statistics" onClick={() => setSheet('stats')}>
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
            <rect x="2" y="9" width="3" height="5" rx="1" />
            <rect x="6.5" y="5" width="3" height="9" rx="1" />
            <rect x="11" y="2" width="3" height="12" rx="1" />
          </svg>
        </IconButton>
      </header>

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 pt-5 pb-4">
        <div className="mx-auto w-full max-w-md space-y-5">
          <Headshot
            player={target}
            revealed={revealed}
            solved={game.status === 'won'}
            lost={game.status === 'lost'}
          />

          {over ? (
            <ResultPanel player={target} game={game} onStats={() => setSheet('stats')} />
          ) : (
            <ClueStack clues={clues} revealed={revealed} notes={notes} />
          )}
        </div>
      </div>

      {!over && (
        <div className="relative z-10 border-t border-line bg-ink-2/95 px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="mx-auto w-full max-w-md">
            <p aria-live="polite" className="sr-only">
              {revealed} of {MAX_ROUNDS} clues revealed.
            </p>
            {flash && (
              <p className="mb-2 text-center text-[12px] text-fiesta-orange" role="status">
                {flash}
              </p>
            )}
            <GuessBar
              pool={pool}
              turns={game.turns}
              status={game.status}
              canHint={mode === 'easy'}
              hintCount={candidates.length}
              onGuess={onGuess}
              onSkip={onSkip}
              onHint={() => setSheet('hint')}
              shake={shake}
            />
          </div>
        </div>
      )}

      <HintSheet
        open={sheet === 'hint'}
        onClose={closeSheet}
        candidates={candidates}
        revealed={revealed}
        onPick={onGuess}
      />
      <StatsSheet
        open={sheet === 'stats'}
        onClose={closeSheet}
        stats={stats}
        mode={mode}
        highlight={game.status === 'won' ? revealed : null}
      />
      <HelpSheet open={sheet === 'help'} onClose={closeSheet} />
    </div>
  )
}
