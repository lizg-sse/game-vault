'use client'

import { MAX_ROUNDS, SCORE_BY_CLUES } from '@/lib/game'
import { Sheet } from './Sheet'

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-line-2 font-mono text-[10px] text-silver">
        {n}
      </span>
      <div>
        <p className="text-[14px] font-semibold text-chalk">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-silver-dim">{children}</p>
      </div>
    </li>
  )
}

export function HelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="How to play">
      <ol className="space-y-3.5">
        <Step n={1} title="One Spur, one clue to start">
          Every day picks a San Antonio Spur, past or present. You open with a single clue and a
          photo blurred past recognition.
        </Step>
        <Step n={2} title="Guess or skip — both cost a clue">
          A wrong guess reveals the next clue and sharpens the photo, and so does skipping. You get{' '}
          {MAX_ROUNDS} turns.
        </Step>
        <Step n={3} title="Wrong guesses still tell you something">
          Each one shows which clue it fell foul of — or warns you that it fit every clue and still
          wasn&rsquo;t the answer.
        </Step>
        <Step n={4} title="Fewer clues, more points">
          <span className="mt-1.5 flex flex-wrap gap-1">
            {SCORE_BY_CLUES.map((pts, i) => (
              <span
                key={i}
                className="rounded-md bg-panel-2 px-1.5 py-0.5 font-mono text-[11px] text-silver tabular-nums"
              >
                {i + 1} → {pts}
              </span>
            ))}
          </span>
        </Step>
      </ol>

      <div className="mt-5 rounded-2xl border border-line bg-panel p-3.5">
        <p className="font-mono text-[10px] tracking-[0.14em] text-silver-dim uppercase">
          Easy vs Hard
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-silver-dim">
          <span className="font-semibold text-chalk">Easy</span> sticks to Spurs most fans could
          name, and the <span className="text-fiesta-orange">Hint</span> button lists everyone the
          clues haven&rsquo;t ruled out yet.{' '}
          <span className="font-semibold text-chalk">Hard</span> reaches deep into the franchise
          register with no hints — and has its own player each day.
        </p>
      </div>
    </Sheet>
  )
}
