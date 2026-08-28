import type { Player } from './players'

/** Coyote is a mascot, but the game treats him like a pool entry. */
export const COYOTE_ID = 999999

export const COYOTE: Player = {
  id: COYOTE_ID,
  name: 'Coyote',
  tier: 1,
  position: 'Mascot',
  height: '6-0',
  weight: null,
  jersey: null,
  school: 'San Antonio Spurs',
  country: 'USA',
  draftYear: 'N/A',
  draftRound: 'N/A',
  draftPick: 'N/A',
  from: 2026,
  to: 2026,
  seasons: 1,
  games: 0,
  ppg: 0,
  rpg: 0,
  apg: 0,
  titles: [],
  allStar: 0,
  allNba: 0,
  allDef: 0,
  mvp: 0,
  finalsMvp: 0,
  dpoy: 0,
  hof: false,
  g75: false,
}

export const isCoyote = (player: Player) => player.id === COYOTE_ID

