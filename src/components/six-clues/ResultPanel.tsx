'use client'

import { useState } from 'react'
import type { Player } from '@/lib/six-clues/players'
import { isCoyote } from '@/lib/six-clues/coyote'
import { formatHeight, tenureLabel } from '@/lib/six-clues/clues'
import { cluesRevealed, scoreFor, shareText, type GameState } from '@/lib/six-clues/game'

function accolades(p: Player) {
  const out: string[] = []
  if (p.titles.length) out.push(`${p.titles.length}× champion (${p.titles.join(', ')})`)
  if (p.allStar) out.push(`${p.allStar}× All-Star`)
  if (p.allNba) out.push(`${p.allNba}× All-NBA`)
  if (p.allDef) out.push(`${p.allDef}× All-Defensive`)
  if (p.mvp) out.push(`${p.mvp}× MVP`)
  if (p.finalsMvp) out.push(`${p.finalsMvp}× Finals MVP`)
  if (p.dpoy) out.push(`${p.dpoy}× Defensive POY`)
  if (p.g75) out.push('NBA 75th Anniversary Team')
  if (p.hof) out.push('Hall of Fame')
  return out
}

export function ResultPanel({
  player,
  game,
  onStats,
  onNext,
}: {
  player: Player
  game: GameState
  onStats: () => void
  onNext: () => void
}) {
  const won = game.status === 'won'
  const coyote = isCoyote(player)
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const text = shareText(game)
    try {
      if (navigator.share) {
        await navigator.share({ text })
        return
      }
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // The user dismissed the share sheet, or the clipboard is unavailable.
    }
  }

  const honours = accolades(player)

  return (
    <div className="animate-pop-in space-y-3">
      <div className="rounded-[3px] border border-[var(--line)] bg-surface p-4 text-center">
        <p
          className={`font-display text-[10px] tracking-[0.16em] uppercase ${
            won ? 'text-fiesta-teal' : 'text-fiesta-pink'
          }`}
        >
          {won ? `Solved in ${cluesRevealed(game)}` : 'Out of turns'}
        </p>
        <h2 className="animate-name-stamp mt-1 text-[26px] leading-tight font-semibold tracking-tight text-paper">
          {player.name}
        </h2>
        <p className="mt-1 text-[13px] text-faint">
          {coyote ? 'San Antonio Spurs mascot' : `${player.position} · ${formatHeight(player.height)}${player.jersey ? ` · #${player.jersey}` : ''}`}
        </p>

        {!coyote && (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2 border-y border-[var(--line)] py-3">
              {(
                [
                  [player.ppg.toFixed(1), 'PPG'],
                  [player.rpg.toFixed(1), 'RPG'],
                  [player.apg.toFixed(1), 'APG'],
                ] as const
              ).map(([value, label], i) => (
                <div
                  key={label}
                  className="animate-row-in"
                  style={{ animationDelay: `${360 + i * 70}ms` } as React.CSSProperties}
                >
                  <p className="text-[17px] font-semibold tabular-nums">{value}</p>
                  <p className="font-display text-[9px] tracking-widest text-faint">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-faint">
              {tenureLabel(player)} · {player.games} games in silver &amp; black
            </p>
          </>
        )}

        {honours.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {honours.map(a => (
              <span
                key={a}
                className="rounded-[2px] bg-raised px-2.5 py-1 text-[11px] text-silver ring-1 ring-[var(--line)]"
              >
                {a}
              </span>
            ))}
          </div>
        )}

        {won && (
          <p className="mt-3.5 font-display text-[13px] tracking-wide text-fiesta-teal tabular-nums">
            +{scoreFor(game)} pts
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={share}
          className="flex flex-1 items-center justify-center gap-2 rounded-[3px] bg-silver py-3 text-[14px] font-semibold text-ink transition-opacity active:opacity-80"
        >
          {copied ? (
            'Copied!'
          ) : (
            <>
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
                <path d="M8 1.4 4.6 4.8l1 1L7.3 4.1v6.6h1.4V4.1l1.7 1.7 1-1L8 1.4ZM3 9.4v4.2c0 .6.4 1 1 1h8c.6 0 1-.4 1-1V9.4h-1.4v3.8H4.4V9.4H3Z" />
              </svg>
              Share
            </>
          )}
        </button>
        <button
          onClick={onStats}
          className="rounded-[3px] border border-[var(--line-strong)] bg-raised px-5 text-[14px] font-medium text-silver active:bg-edge"
        >
          Stats
        </button>
      </div>

      <button
        onClick={onNext}
        className="w-full rounded-[3px] bg-fiesta-teal py-3 text-[14px] font-semibold text-ink transition-opacity active:opacity-80"
      >
        Next player →
      </button>
    </div>
  )
}
