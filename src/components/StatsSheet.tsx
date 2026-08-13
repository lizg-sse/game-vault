'use client'

import { MAX_ROUNDS, type Mode, type Stats } from '@/lib/game'
import { Sheet } from './Sheet'

function Figure({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-2 py-3 text-center">
      <p className="text-[22px] leading-none font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1.5 text-[10px] leading-tight text-silver-dim">{label}</p>
    </div>
  )
}

export function StatsSheet({
  open,
  onClose,
  stats,
  mode,
  highlight,
}: {
  open: boolean
  onClose: () => void
  stats: Stats
  mode: Mode
  /** Clues used in the game just finished, so its bar stands out. */
  highlight: number | null
}) {
  const peak = Math.max(1, ...stats.dist)

  return (
    <Sheet open={open} onClose={onClose} title={`Stats · ${mode === 'easy' ? 'Easy' : 'Hard'}`}>
      <div className="grid grid-cols-4 gap-2">
        <Figure value={stats.played} label="Played" />
        <Figure
          value={stats.played ? `${Math.round((stats.won / stats.played) * 100)}%` : '—'}
          label="Solved"
        />
        <Figure value={stats.streak} label="Streak" />
        <Figure value={stats.maxStreak} label="Best" />
      </div>

      <p className="mt-3 text-center font-mono text-[11px] tracking-wide text-silver-dim">
        {stats.points.toLocaleString()} POINTS BANKED
      </p>

      <h3 className="mt-5 mb-2 font-mono text-[10px] tracking-[0.14em] text-silver-dim uppercase">
        Clues used to solve
      </h3>
      <div className="space-y-1.5">
        {Array.from({ length: MAX_ROUNDS }, (_, i) => {
          const n = stats.dist[i] ?? 0
          const isLatest = highlight === i + 1
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="w-3 font-mono text-[11px] text-silver-dim tabular-nums">{i + 1}</span>
              <div className="h-5 flex-1 overflow-hidden rounded-md bg-panel">
                <div
                  className={`flex h-full min-w-6 items-center justify-end rounded-md px-1.5 text-[11px] font-semibold tabular-nums transition-[width] duration-500 ${
                    isLatest ? 'bg-fiesta-teal text-ink' : 'bg-line-2 text-silver'
                  }`}
                  style={{ width: `${Math.max(8, (n / peak) * 100)}%` }}
                >
                  {n}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-silver-dim">
        Easy and Hard keep separate records — and separate players each day.
      </p>
    </Sheet>
  )
}
