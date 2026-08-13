import { PLAYERS, type Player } from './players'

export type Mode = 'easy' | 'hard'

export const MAX_ROUNDS = 6
/** Points for solving after 1…6 clues. Fewer clues, more points. */
export const SCORE_BY_CLUES = [1000, 800, 600, 400, 250, 100]

/** Easy draws only from widely-known Spurs; hard opens up the deeper cuts. */
export function poolFor(mode: Mode): Player[] {
  return mode === 'easy' ? PLAYERS.filter(p => p.tier === 1) : PLAYERS
}

// ---------------------------------------------------------------- daily pick

const EPOCH = new Date(2026, 0, 1)

/** Whole days since the epoch in the player's own timezone, so it flips at local midnight. */
export function dayIndex(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.floor((today.getTime() - EPOCH.getTime()) / 86_400_000)
}

export const puzzleNumber = (now = new Date()) => dayIndex(now) + 1

function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffled<T>(items: T[], seed: number) {
  const out = items.slice()
  const rand = mulberry32(seed)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Walks a reshuffled permutation of the pool, so no player repeats until every
 * other one has been used, and the order differs each time through.
 */
export function playerForDay(mode: Mode, day: number): Player {
  const pool = poolFor(mode)
  const cycle = Math.floor(day / pool.length)
  const within = ((day % pool.length) + pool.length) % pool.length
  return shuffled(pool, hash(`${mode}:${cycle}`))[within]
}

export function msUntilTomorrow(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return next.getTime() - now.getTime()
}

// ------------------------------------------------------------------ progress

export type Turn = { kind: 'guess'; name: string; correct: boolean } | { kind: 'skip' }
export type Status = 'playing' | 'won' | 'lost'

export type GameState = {
  day: number
  mode: Mode
  turns: Turn[]
  status: Status
}

export const newGame = (day: number, mode: Mode): GameState => ({
  day,
  mode,
  turns: [],
  status: 'playing',
})

/**
 * Clues on the table: one to start, plus one for every turn that didn't end the
 * game. A correct guess doesn't buy a clue, so solving on turn 3 costs 3 clues.
 */
export const cluesRevealed = (s: GameState) =>
  Math.min(MAX_ROUNDS, s.status === 'won' ? s.turns.length : s.turns.length + 1)

export const scoreFor = (s: GameState) =>
  s.status === 'won' ? SCORE_BY_CLUES[cluesRevealed(s) - 1] : 0

// ------------------------------------------------------------------- storage

const KEY = 'spurs-vault:v1'
const gameKey = (mode: Mode, day: number) => `${KEY}:game:${mode}:${day}`
const statsKey = (mode: Mode) => `${KEY}:stats:${mode}`

export type Stats = {
  played: number
  won: number
  streak: number
  maxStreak: number
  lastDay: number | null
  points: number
  /** Wins bucketed by clues used, index 0 = solved on the first clue. */
  dist: number[]
}

export const emptyStats = (): Stats => ({
  played: 0,
  won: 0,
  streak: 0,
  maxStreak: 0,
  lastDay: null,
  points: 0,
  dist: Array(MAX_ROUNDS).fill(0),
})

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private browsing or a full quota — the game still works, it just won't persist.
  }
}

export const loadGame = (mode: Mode, day: number) =>
  read<GameState | null>(gameKey(mode, day), null)

export const saveGame = (s: GameState) => write(gameKey(s.mode, s.day), s)

export function loadStats(mode: Mode): Stats {
  const s = read<Partial<Stats>>(statsKey(mode), {})
  return { ...emptyStats(), ...s, dist: s.dist?.length === MAX_ROUNDS ? s.dist : emptyStats().dist }
}

/** Folds a finished game into the running stats. Call once, when the game ends. */
export function recordResult(mode: Mode, game: GameState): Stats {
  const prev = loadStats(mode)
  if (prev.lastDay === game.day) return prev

  const won = game.status === 'won'
  const consecutive = prev.lastDay !== null && prev.lastDay === game.day - 1
  const next: Stats = {
    played: prev.played + 1,
    won: prev.won + (won ? 1 : 0),
    streak: won ? (consecutive ? prev.streak : 0) + 1 : 0,
    maxStreak: prev.maxStreak,
    lastDay: game.day,
    points: prev.points + scoreFor(game),
    dist: prev.dist.slice(),
  }
  next.maxStreak = Math.max(prev.maxStreak, next.streak)
  if (won) next.dist[cluesRevealed(game) - 1]++
  write(statsKey(mode), next)
  return next
}

export function loadMode(): Mode {
  return read<Mode>(`${KEY}:mode`, 'easy')
}

export const saveMode = (mode: Mode) => write(`${KEY}:mode`, mode)

export function loadSeenHelp(): boolean {
  return read<boolean>(`${KEY}:seen-help`, false)
}

export const saveSeenHelp = () => write(`${KEY}:seen-help`, true)

// --------------------------------------------------------------------- share

export function shareText(game: GameState) {
  const squares = Array.from({ length: MAX_ROUNDS }, (_, i) => {
    const turn = game.turns[i]
    if (game.status === 'won' && i === game.turns.length - 1) return '🟩'
    if (!turn) return '⬜'
    return turn.kind === 'skip' ? '🟨' : '⬛'
  })

  const head = `Six Clues #${game.day + 1} · ${game.mode === 'easy' ? 'Easy' : 'Hard'}`
  const line =
    game.status === 'won'
      ? `${cluesRevealed(game)}/${MAX_ROUNDS} clues · ${scoreFor(game)} pts`
      : `X/${MAX_ROUNDS}`

  return `${head}\n${line}\n${squares.join('')}`
}

// -------------------------------------------------------------------- search

const fold = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

/** Accent- and punctuation-insensitive; prefers surname, then any prefix, then substring. */
export function searchPlayers(pool: Player[], query: string, limit = 8): Player[] {
  const q = fold(query)
  if (!q) return []

  const scored = pool
    .map(p => {
      const full = fold(p.name)
      const parts = p.name.split(' ')
      const last = fold(parts[parts.length - 1])
      if (last.startsWith(q)) return { p, rank: 0 }
      if (full.startsWith(q)) return { p, rank: 1 }
      if (parts.some(part => fold(part).startsWith(q))) return { p, rank: 2 }
      if (full.includes(q)) return { p, rank: 3 }
      return null
    })
    .filter((x): x is { p: Player; rank: number } => x !== null)

  scored.sort((a, b) => a.rank - b.rank || a.p.name.localeCompare(b.p.name))
  return scored.slice(0, limit).map(x => x.p)
}
