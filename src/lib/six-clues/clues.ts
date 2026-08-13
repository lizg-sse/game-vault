import type { Player } from './players'

export type ClueKey = 'era' | 'position' | 'honors' | 'height' | 'tenure' | 'origin'

export type Clue = {
  key: ClueKey
  label: string
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
  { max: 74, label: 'Under 6′3″' },
  { max: 78, label: '6′3″ – 6′6″' },
  { max: 81, label: '6′7″ – 6′9″' },
  { max: Infinity, label: '6′10″ or taller' },
]
const heightBand = (p: Player) => HEIGHT_BANDS.findIndex(b => heightInInches(p) <= b.max)

const PPG_BANDS = [
  { max: 5.99, label: 'under 6 PPG' },
  { max: 9.99, label: '6–10 PPG' },
  { max: 14.99, label: '10–15 PPG' },
  { max: 19.99, label: '15–20 PPG' },
  { max: Infinity, label: '20+ PPG' },
]
const ppgBand = (p: Player) => PPG_BANDS.findIndex(b => p.ppg <= b.max)

/** "Forward-Center" → "Forward". The compound listing would be near-unique on its own. */
const primaryPosition = (p: Player) => p.position.split('-')[0]

const hasRing = (p: Player) => p.titles.length > 0
const wasAllStar = (p: Player) => p.allStar > 0

function honorsText(p: Player) {
  if (hasRing(p) && wasAllStar(p)) return 'Won a title in San Antonio, and made an All-Star team'
  if (hasRing(p)) return 'Won a title in San Antonio, never an All-Star'
  if (wasAllStar(p)) return 'Made an All-Star team, but no title in San Antonio'
  return 'No title in San Antonio, no All-Star selection'
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`

/**
 * Six clues, broad to narrow. The bands are deliberately coarse early on: exact
 * values would cut the field to one player within a couple of turns and end the
 * game before it starts.
 */
export function buildClues(target: Player): Clue[] {
  const decade = mainDecade(target)
  const band = heightBand(target)
  const scoring = ppgBand(target)

  return [
    {
      key: 'era',
      label: 'Era',
      value: `Wore silver & black in the ${decade}s`,
      matches: p => decades(p).includes(decade),
    },
    {
      key: 'position',
      label: 'Position',
      value: primaryPosition(target),
      matches: p => primaryPosition(p) === primaryPosition(target),
    },
    {
      key: 'honors',
      label: 'Honors',
      value: honorsText(target),
      matches: p => hasRing(p) === hasRing(target) && wasAllStar(p) === wasAllStar(target),
    },
    {
      key: 'height',
      label: 'Height',
      value: HEIGHT_BANDS[band].label,
      matches: p => heightBand(p) === band,
    },
    {
      key: 'tenure',
      label: 'In San Antonio',
      value: `${plural(target.seasons, 'season')} · ${PPG_BANDS[scoring].label}`,
      matches: p => p.seasons === target.seasons && ppgBand(p) === scoring,
    },
    {
      key: 'origin',
      label: 'Before the NBA',
      value: target.school,
      matches: p => p.school === target.school,
    },
  ]
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
