'use client'

import Image from 'next/image'
import type { Player } from '@/lib/players'
import { MAX_ROUNDS } from '@/lib/game'

/**
 * Blur in px and black-tint opacity for 1…6 clues on the table. Headshots sit on a
 * white ground, so blur alone would leave a bright, featureless card — the tint is
 * what makes the early rounds read as a photo developing out of the dark.
 */
const BLUR = [26, 19, 13, 8, 5, 3]
const TINT = [0.76, 0.63, 0.49, 0.35, 0.22, 0.12]

export function Headshot({
  player,
  revealed,
  solved,
  lost,
}: {
  player: Player
  revealed: number
  solved: boolean
  lost: boolean
}) {
  const done = solved || lost
  const step = Math.min(revealed, MAX_ROUNDS) - 1
  const blur = BLUR[step] ?? BLUR[0]
  const tint = done ? 0 : (TINT[step] ?? TINT[0])

  return (
    <div className="relative mx-auto w-[min(56vw,190px)]">
      <div
        className={`relative aspect-square overflow-hidden rounded-[26px] border bg-gradient-to-b from-white to-silver/70 transition-[border-color,box-shadow] duration-500 ${
          solved
            ? 'border-fiesta-teal/70 shadow-[0_0_0_1px_rgb(23_209_161_/_0.25),0_18px_50px_-18px_rgb(23_209_161_/_0.45)]'
            : lost
              ? 'border-fiesta-pink/60 shadow-[0_18px_50px_-20px_rgb(240_78_121_/_0.4)]'
              : 'border-line-2 shadow-[0_18px_50px_-22px_rgb(0_0_0_/_0.9)]'
        }`}
      >
        <Image
          src={`/headshots/${player.id}.webp`}
          alt={done ? player.name : 'Obscured photo of the mystery Spur'}
          width={512}
          height={512}
          priority
          unoptimized
          className="h-full w-full object-cover transition-[filter,transform] duration-700 ease-out"
          style={{
            filter: done
              ? 'none'
              : `blur(${blur}px) grayscale(1) contrast(1.15) brightness(0.82)`,
            // Scaling up hides the soft edge the blur leaves at the frame border.
            transform: done ? 'none' : 'scale(1.14)',
          }}
        />

        <div
          aria-hidden
          className="absolute inset-0 bg-ink transition-opacity duration-700 ease-out"
          style={{ opacity: tint }}
        />
        {!done && (
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_40%,transparent,rgb(8_9_11_/_0.55)),linear-gradient(150deg,transparent_35%,rgb(255_255_255_/_0.10)_50%,transparent_65%)]"
          />
        )}
      </div>

      {/* Puzzle-piece counter tucked into the frame's corner. */}
      {!done && (
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-full border border-line-2 bg-ink px-2.5 py-1 font-mono text-[10px] tracking-widest text-silver-dim">
          {revealed}/{MAX_ROUNDS}
        </div>
      )}
    </div>
  )
}
