import { HINTS, type HintRule } from './hints'
import type { Player } from './players'

export type ClueKey = string

export type Clue = {
  key: ClueKey
  value: string
  /**
   * True when `p` is consistent with this clue. Each predicate tests exactly what
   * the clue's text states — no more — so "still in play" in the hint sheet means
   * "not ruled out by anything you've been shown".
   */
  matches: (p: Player) => boolean
}

/** A season is stored by its end year: 1998 is the 1997-98 season. */
export function seasonLabel(endYear: number) {
  const start = endYear - 1
  return `${start}-${String(endYear % 100).padStart(2, '0')}`
}

export function tenureLabel(p: Player) {
  return p.from === p.to ? seasonLabel(p.from) : `${seasonLabel(p.from)} → ${seasonLabel(p.to)}`
}

export function formatHeight(height: string) {
  const [feet, inches] = height.split('-')
  return `${feet}'${inches}"`
}

const heightInInches = (p: Player) => {
  const [feet, inches] = p.height.split('-').map(Number)
  return feet * 12 + inches
}

/** Decades a player's Spurs seasons started in, e.g. Duncan → [1990, 2000, 2010]. */
export function decades(p: Player) {
  const out: number[] = []
  for (let end = p.from; end <= p.to; end++) {
    const d = Math.floor((end - 1) / 10) * 10
    if (!out.includes(d)) out.push(d)
  }
  return out
}

/** The decade holding most of a player's Spurs seasons; ties go to the earlier one. */
function mainDecade(p: Player) {
  const tally = new Map<number, number>()
  for (let end = p.from; end <= p.to; end++) {
    const d = Math.floor((end - 1) / 10) * 10
    tally.set(d, (tally.get(d) ?? 0) + 1)
  }
  return [...tally].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]
}

const HEIGHT_BANDS = [
  { max: 74 },
  { max: 78 },
  { max: 81 },
  { max: Infinity },
]
const heightBand = (p: Player) => HEIGHT_BANDS.findIndex(b => heightInInches(p) <= b.max)

const PPG_BANDS = [
  { max: 5.99 },
  { max: 9.99 },
  { max: 14.99 },
  { max: 19.99 },
  { max: Infinity },
]
const ppgBand = (p: Player) => PPG_BANDS.findIndex(b => p.ppg <= b.max)

/** "Forward-Center" → "Forward". The compound listing would be near-unique on its own. */
const primaryPosition = (p: Player) => p.position.split('-')[0]

const hasRing = (p: Player) => p.titles.length > 0
const wasAllStar = (p: Player) => p.allStar > 0
function matchesRule(rule: HintRule, target: Player, candidate: Player) {
  switch (rule) {
    case 'target':
      return candidate.id === target.id
    case 'same-decade':
      return mainDecade(candidate) === mainDecade(target)
    case 'same-position':
      return primaryPosition(candidate) === primaryPosition(target)
    case 'same-height-band':
      return heightBand(candidate) === heightBand(target)
    case 'same-tenure':
      return candidate.seasons === target.seasons
    case 'same-scoring-band':
      return ppgBand(candidate) === ppgBand(target)
    case 'same-school':
      return candidate.school === target.school
    case 'same-country':
      return candidate.country === target.country
    case 'same-draft-round':
      return candidate.draftRound === target.draftRound
    case 'same-honors':
      return hasRing(candidate) === hasRing(target) && wasAllStar(candidate) === wasAllStar(target)
    case 'same-title-status':
      return hasRing(candidate) === hasRing(target)
    case 'same-defense':
      return candidate.allDef > 0 === target.allDef > 0
  }
}

/**
 * Returns the target's authored pack. Some clues are broad and share a
 * predicate with other players; a specific story uses the target predicate
 * because the text should never rule out a player it actually describes.
 */
export function buildClues(target: Player): Clue[] {
  const pack = HINTS[target.id]
  if (!pack) throw new Error(`No authored Six Clues pack for ${target.name} (${target.id})`)

  return pack.map(hint => ({
    key: hint.key,
    value: hint.text,
    matches: (candidate: Player) => matchesRule(hint.rule, target, candidate),
  }))
}

/** Players consistent with every clue revealed so far. */
export function stillInPlay(pool: Player[], clues: Clue[], revealed: number, guessed: string[]) {
  const shown = clues.slice(0, revealed)
  return pool.filter(p => !guessed.includes(p.name) && shown.every(c => c.matches(p)))
}

/** The first revealed clue a wrong guess contradicts, if any. */
export function contradiction(guess: Player, clues: Clue[], revealed: number) {
  return clues.slice(0, revealed).find(c => !c.matches(guess)) ?? null
}
