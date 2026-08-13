/**
 * Rebuilds the Spurs Vault dataset: `src/lib/six-clues/players.ts` and `public/six-clues/`.
 *
 *   node scripts/build-players.mjs
 *
 * Sources
 *   basketball-reference SAS franchise register  → who played for the Spurs, and
 *                                                  their games/seasons/averages with the team
 *   nba.com players sitemap                      → name → NBA person id
 *   nba.com player pages (__NEXT_DATA__)         → position, height, jersey, school, draft
 *   basketball-reference player pages            → All-Star / All-NBA / MVP / Hall of Fame
 *   basketball-reference title-season rosters     → championships won in San Antonio
 *   cdn.nba.com headshots, bbref as fallback     → the photo the game reveals
 *
 * A player with no real headshot is dropped, since the reveal is the whole game.
 *
 * Every response is cached under scripts/.cache (override with SPURS_CACHE) so
 * re-runs are cheap. basketball-reference is rate limited to ~17 requests/minute.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = process.env.SPURS_CACHE ?? path.join(ROOT, 'scripts/.cache')
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

const TEAM = 'SAS'
const TITLE_SEASONS = [1999, 2003, 2005, 2007, 2014]
/** basketball-reference lists a season by its end year; 1974 is the first San Antonio season. */
const FIRST_SAN_ANTONIO_SEASON = 1975

/** Spurs most fans could name — the pool for the default Easy mode. */
const TIER1 = `tim-duncan david-robinson manu-ginobili tony-parker george-gervin kawhi-leonard
victor-wembanyama lamarcus-aldridge demar-derozan sean-elliott avery-johnson bruce-bowen
danny-green patty-mills dejounte-murray derrick-white devin-vassell keldon-johnson
jakob-poeltl boris-diaw tiago-splitter matt-bonner robert-horry michael-finley
stephen-jackson steve-kerr pau-gasol rudy-gay marco-belinelli kyle-anderson
richard-jefferson george-hill artis-gilmore alvin-robertson terry-cummings dominique-wilkins
dennis-rodman stephon-castle jeremy-sochan deaaron-fox chris-paul harrison-barnes
malik-rose nazr-mohammed brent-barry antonio-mcdyess rod-strickland tre-jones
lonnie-walker-iv dylan-harper james-silas larry-kenon mike-mitchell johnny-moore
willie-anderson vinny-del-negro mario-elie terry-porter dale-ellis`

/** Deeper cuts, added on top of tier 1 in Hard mode. */
const TIER2 = `doug-mcdermott chuck-person gary-neal dejuan-blair cory-joseph jonathon-simmons
bryn-forbes fabricio-oberto davis-bertans rasho-nesterovic zach-collins julian-champagnie
antonio-daniels swen-nater vernon-maxwell billy-paultz mark-olberding george-karl
gene-banks mike-gale coby-dietrick johnny-dawkins walter-berry frank-brickowski
allan-bristow jon-sundvold dave-corzine beno-udrih danny-ferry will-perdue
monty-williams keita-bates-diop malaki-branham derek-anderson greg-anderson
jr-reid antoine-carr jaren-jackson devin-brown`

const WANTED = new Map([
  ...TIER1.split(/\s+/).filter(Boolean).map(s => [s, 1]),
  ...TIER2.split(/\s+/).filter(Boolean).map(s => [s, 2]),
])

/**
 * Championship credit comes from the title season's roster table, which lists
 * everyone who appeared that season — including players traded away before the
 * Finals. Corrections go here, cross-checked against the player's career ring
 * count on basketball-reference.
 */
const NOT_ON_THE_TITLE_TEAM = [
  // Traded to New York in February 2005; bbref lists his career total as 2 rings.
  { player: 'Malik Rose', season: 2005 },
]

// ---------------------------------------------------------------------- http

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchCached(url, key, { binary = false, throttleMs = 0 } = {}) {
  const file = path.join(CACHE, key)
  if (fs.existsSync(file)) {
    const buf = fs.readFileSync(file)
    // A zero-byte entry records a known miss, so we don't retry it every run.
    if (buf.length === 0) return null
    return binary ? buf : buf.toString('utf8')
  }

  let body = null
  for (let attempt = 0; attempt < 3 && body === null; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: '*/*' },
        signal: AbortSignal.timeout(30_000),
      })
      if (res.ok) body = Buffer.from(await res.arrayBuffer())
      else if (res.status === 404) break
      else await sleep(2000 * (attempt + 1))
    } catch {
      await sleep(2000 * (attempt + 1))
    }
  }

  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, body ?? Buffer.alloc(0))
  if (throttleMs) await sleep(throttleMs)
  return body === null ? null : binary ? body : body.toString('utf8')
}

const bbref = (url, key) => fetchCached(url, key, { throttleMs: 3500 })

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i], i)
      }
    })
  )
  return out
}

// -------------------------------------------------------------------- parse

const cellOf = (row, stat) => {
  const m = row.match(new RegExp(`data-stat="${stat}"[^>]*>([\\s\\S]*?)</t[dh]>`))
  return m ? m[1].replace(/<[^>]*>/g, '').trim() : null
}

/** Every player in franchise history, with their totals for the Spurs. */
async function franchiseRegister() {
  const html = await bbref(
    `https://www.basketball-reference.com/teams/${TEAM}/players.html`,
    `${TEAM}-players.html`
  )
  if (!html) throw new Error('franchise register unavailable')

  const out = []
  for (const [, row] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const name = cellOf(row, 'player')
    const slug = row.match(/\/players\/[a-z]\/([a-z0-9]+)\.html/)?.[1]
    if (!name || !slug) continue
    out.push({
      name,
      bbref: slug,
      from: Number(cellOf(row, 'year_min')),
      to: Number(cellOf(row, 'year_max')),
      seasons: Number(cellOf(row, 'years')),
      games: Number(cellOf(row, 'g')),
      ppg: Number(cellOf(row, 'pts_per_g')),
      rpg: Number(cellOf(row, 'trb_per_g')),
      apg: Number(cellOf(row, 'ast_per_g')),
    })
  }
  return out.filter(p => p.to >= FIRST_SAN_ANTONIO_SEASON)
}

/** nba.com publishes every player page in its sitemap: /player/<id>/<slug>. */
async function nbaIdsBySlug() {
  const xml = await fetchCached('https://www.nba.com/sitemap_players.xml', 'sitemap_players.xml')
  if (!xml) throw new Error('players sitemap unavailable')
  const index = new Map()
  for (const m of xml.matchAll(/<loc>https?:\/\/(?:www\.)?nba\.com\/player\/(\d+)\/([a-z0-9-]+)<\/loc>/g)) {
    index.set(m[2], Number(m[1]))
  }
  return index
}

const slugify = name =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

async function titleRosters() {
  const rings = new Map()
  for (const season of TITLE_SEASONS) {
    const html = await bbref(
      `https://www.basketball-reference.com/teams/${TEAM}/${season}.html`,
      `${TEAM}-${season}.html`
    )
    if (!html) throw new Error(`title roster ${season} unavailable`)
    const table = html.split('id="roster"')[1]?.split('</table>')[0] ?? ''
    for (const m of table.matchAll(/\/players\/[a-z]\/([a-z0-9]+)\.html/g)) {
      if (!rings.has(m[1])) rings.set(m[1], [])
      if (!rings.get(m[1]).includes(season)) rings.get(m[1]).push(season)
    }
  }
  return rings
}

async function nbaBio(id, slug) {
  const html = await fetchCached(`https://www.nba.com/player/${id}/${slug}`, `nba-${id}.html`)
  const json = html?.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1]
  if (!json) return null
  return JSON.parse(json).props?.pageProps?.player?.info ?? null
}

async function bbrefAwards(slug) {
  const html = await bbref(
    `https://www.basketball-reference.com/players/${slug[0]}/${slug}.html`,
    `bbr-${slug}.html`
  )
  if (!html) return null

  const bling = html.split('id="bling"')[1]?.split('</ul>')[0] ?? ''
  const items = [...bling.matchAll(/>([^<]+)<\/a>/g)].map(m => m[1].trim())
  // Repeated awards read "7x All Star"; one-offs read "1999 NBA Champ".
  const tally = label => {
    const re = new RegExp(`^(?:(\\d+)x |\\d{4}(?:-\\d{2})? )?${label}$`)
    for (const item of items) {
      const m = item.match(re)
      if (m) return m[1] ? Number(m[1]) : 1
    }
    return 0
  }

  return {
    allStar: tally('All Star'),
    allNba: tally('All-NBA'),
    allDef: tally('All-Defensive'),
    ringsCareer: tally('NBA Champ'),
    mvp: tally('MVP'),
    finalsMvp: tally('Finals MVP'),
    dpoy: tally('Def\\. POY'),
    hof: items.some(t => /Hall of Fame/i.test(t)),
    height: html.split('id="meta"')[1]?.match(/<span>(\d-\d+)<\/span>/)?.[1] ?? null,
  }
}

// ----------------------------------------------------------------- headshots

const nbaHeadshot = id =>
  fetchCached(`https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`, `shot-nba-${id}.png`, {
    binary: true,
  })

const bbrefHeadshot = slug =>
  fetchCached(
    `https://www.basketball-reference.com/req/202106291/images/headshots/${slug}.jpg`,
    `shot-bbr-${slug}.jpg`,
    { binary: true, throttleMs: 1200 }
  )

const sha1 = buf => crypto.createHash('sha1').update(buf).digest('hex')

/**
 * Normalises wildly different sources — 1040x760 transparent PNGs, 120x180 JPEGs,
 * the odd action shot — into one 512x512 white frame, so the reveal looks the same
 * for a 1970s Spur as for a rookie.
 */
async function writeHeadshot(buf, dest) {
  await sharp(buf)
    .flatten({ background: '#ffffff' })
    .trim({ threshold: 12 })
    .resize(460, 460, { fit: 'contain', background: '#ffffff' })
    .extend({ top: 26, bottom: 26, left: 26, right: 26, background: '#ffffff' })
    .webp({ quality: 86 })
    .toFile(dest)
}

// ---------------------------------------------------------------------- main

async function main() {
  fs.mkdirSync(CACHE, { recursive: true })

  console.log('Reading franchise register…')
  const register = await franchiseRegister()
  const nbaIds = await nbaIdsBySlug()
  console.log(`  ${register.length} San Antonio players, ${nbaIds.size} NBA player pages indexed`)

  const picks = []
  for (const [slug, tier] of WANTED) {
    const entry = register.find(p => slugify(p.name) === slug)
    if (!entry) {
      console.warn(`  !! not in the register: ${slug}`)
      continue
    }
    const id = nbaIds.get(slug) ?? nbaIds.get(slug.replace(/-(jr|sr|ii|iii|iv)$/, ''))
    if (!id) {
      console.warn(`  !! no NBA id: ${entry.name}`)
      continue
    }
    picks.push({ ...entry, slug, tier, id })
  }

  console.log('Reading championship rosters…')
  const rings = await titleRosters()

  console.log(`Fetching headshots for ${picks.length} players…`)
  const nbaShots = await mapLimit(picks, 6, p => nbaHeadshot(p.id))
  // nba.com serves one shared silhouette for players it has no photo of; it is the
  // only image that can legitimately appear twice.
  const seen = new Map()
  for (const buf of nbaShots) if (buf) seen.set(sha1(buf), (seen.get(sha1(buf)) ?? 0) + 1)
  const placeholders = new Set([...seen].filter(([, n]) => n > 1).map(([h]) => h))

  const imageDir = path.join(ROOT, 'public/six-clues')
  fs.rmSync(imageDir, { recursive: true, force: true })
  fs.mkdirSync(imageDir, { recursive: true })

  console.log('Fetching bios and accolades…')
  const players = []
  const dropped = []

  for (const [i, p] of picks.entries()) {
    let photo = nbaShots[i]
    let source = 'nba'
    if (photo && placeholders.has(sha1(photo))) photo = null
    if (!photo) {
      photo = await bbrefHeadshot(p.bbref)
      source = 'bbref'
    }
    if (!photo) {
      dropped.push(`${p.name} — no headshot`)
      continue
    }

    const info = await nbaBio(p.id, p.slug)
    if (!info) {
      dropped.push(`${p.name} — no nba.com bio`)
      continue
    }
    const awards = await bbrefAwards(p.bbref)
    if (!awards) {
      dropped.push(`${p.name} — no bbref page`)
      continue
    }

    await writeHeadshot(photo, path.join(imageDir, `${p.id}.webp`))

    const titles = (rings.get(p.bbref) ?? [])
      .filter(season => !NOT_ON_THE_TITLE_TEAM.some(c => c.player === p.name && c.season === season))
      .sort((a, b) => a - b)

    if (titles.length > awards.ringsCareer && awards.ringsCareer > 0) {
      throw new Error(
        `${p.name}: credited with ${titles.length} Spurs titles but bbref lists ${awards.ringsCareer} career rings — add a NOT_ON_THE_TITLE_TEAM entry`
      )
    }

    players.push({
      id: p.id,
      name: info.DISPLAY_FIRST_LAST,
      tier: p.tier,
      position: info.POSITION,
      height: info.HEIGHT || awards.height,
      weight: info.WEIGHT ? Number(info.WEIGHT) : null,
      jersey: info.JERSEY || null,
      school: info.SCHOOL,
      country: info.COUNTRY,
      draftYear: info.DRAFT_YEAR,
      draftRound: info.DRAFT_ROUND,
      draftPick: info.DRAFT_NUMBER,
      from: p.from,
      to: p.to,
      seasons: p.seasons,
      games: p.games,
      ppg: p.ppg,
      rpg: p.rpg,
      apg: p.apg,
      titles,
      allStar: awards.allStar,
      allNba: awards.allNba,
      allDef: awards.allDef,
      mvp: awards.mvp,
      finalsMvp: awards.finalsMvp,
      dpoy: awards.dpoy,
      hof: awards.hof,
      g75: info.GREATEST_75_FLAG === 'Y',
      source,
    })
  }

  const missingHeight = players.filter(p => !p.height)
  if (missingHeight.length) throw new Error(`no height for ${missingHeight.map(p => p.name)}`)

  players.sort((a, b) => a.name.localeCompare(b.name))
  const sources = Object.fromEntries(
    ['nba', 'bbref'].map(s => [s, players.filter(p => p.source === s).length])
  )
  for (const p of players) delete p.source

  const generated = `// AUTO-GENERATED by scripts/build-players.mjs — do not edit by hand.
//
// Sources:
//   bio, draft, jersey, position, height  — nba.com player pages
//   Spurs games/averages/seasons          — basketball-reference ${TEAM} franchise register
//   accolades (All-Star, All-NBA, …)      — basketball-reference player pages
//   \`titles\`                              — basketball-reference ${TEAM} championship rosters
//   public/six-clues/<id>.webp            — cdn.nba.com, falling back to basketball-reference
//
// Every player here has a verified, non-placeholder headshot.
// tier 1 = widely-known Spurs (the pool for the default Easy mode)
// tier 2 = deeper cuts, added in Hard mode

export type Player = {
  /** NBA.com person id — also the headshot filename. */
  id: number
  name: string
  tier: 1 | 2
  position: string
  height: string
  weight: number | null
  jersey: string | null
  school: string
  country: string
  draftYear: string
  draftRound: string
  draftPick: string
  /** First Spurs season, as the season's end year (1998 = the 1997-98 season). */
  from: number
  /** Last Spurs season, as the season's end year. */
  to: number
  seasons: number
  games: number
  ppg: number
  rpg: number
  apg: number
  /** Seasons won with San Antonio, as end years. */
  titles: number[]
  allStar: number
  allNba: number
  allDef: number
  mvp: number
  finalsMvp: number
  dpoy: number
  hof: boolean
  /** NBA 75th Anniversary Team. */
  g75: boolean
}

export const PLAYERS: Player[] = ${JSON.stringify(players, null, 2)}
`

  fs.writeFileSync(path.join(ROOT, 'src/lib/six-clues/players.ts'), generated)

  console.log(
    `\n${players.length} players — tier 1: ${players.filter(p => p.tier === 1).length}, tier 2: ${players.filter(p => p.tier === 2).length}`
  )
  console.log(`headshots — nba.com: ${sources.nba}, basketball-reference: ${sources.bbref}`)
  if (dropped.length) console.log(`dropped:\n  ${dropped.join('\n  ')}`)
}

await main()
