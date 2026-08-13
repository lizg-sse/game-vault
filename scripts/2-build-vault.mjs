// Transform the scraped Basketball-Reference pages into the game's vault dataset.
// Adds: NBA person IDs (for real headshots), role buckets, impact metric, era labels.
import { readFileSync, writeFileSync } from "node:fs";

const OUT = process.argv[2] || new URL("../src/data/vault.json", import.meta.url).pathname;

// B-Ref and the NBA's own player index disagree on a handful of names
// (nicknames, non-Latin letters). Resolved by hand against the NBA index.
const NAME_ALIASES = {
  "louie dampier": "lou dampier",
  "dave greenwood": "david greenwood",
  "steve smith": "steven smith",
  "petur gudmundsson": "petur gudmundsson",
};

/* ---------- 1. NBA person IDs, for cdn.nba.com headshots ---------- */

const nbaPy = readFileSync(new URL("./nba_data.py", import.meta.url).pathname, "utf8");
const idByName = new Map();
for (const m of nbaPy.matchAll(/\[(\d+),\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)",\s*(True|False)\]/g)) {
  const key = norm(m[4]);
  // Prefer the lowest id on collisions: older/primary records win consistently.
  if (!idByName.has(key) || Number(m[1]) < idByName.get(key)) idByName.set(key, Number(m[1]));
}

function norm(s) {
  const base = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u00f0\u0111]/gi, "d")
    .replace(/[\u00fe]/gi, "th")
    .replace(/[\u00f8\u0153]/gi, "o")
    .replace(/[\u00e6]/gi, "ae")
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g, "")
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return NAME_ALIASES[base] ?? base;
}

/* ---------- 2. Re-parse per-season meta straight from the page cache ---------- */

const decode = (s) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

function pageMeta(year) {
  let html;
  try {
    html = readFileSync(new URL(`./cache/SAS-${year}.html`, import.meta.url).pathname, "utf8");
  } catch {
    return {};
  }
  const i = html.indexOf('<div id="meta"');
  const chunk = html.slice(i, i + 9000);
  const rec = /<strong>\s*Record:\s*<\/strong>\s*([\d]+)-([\d]+)/.exec(chunk);
  const srs = /SRS<\/a>[^:]*:\s*(-?[\d.]+)/.exec(chunk);
  const ppg = /PTS\/G:\s*<\/strong>\s*([\d.]+)/.exec(chunk);
  const oppg = /Opp PTS\/G:\s*<\/strong>\s*([\d.]+)/.exec(chunk);
  const arena = /<strong>\s*Arena:\s*<\/strong>\s*([^<]+)/.exec(chunk);

  // Postseason line: the label carries the year, e.g. "NBA 1999 Playoffs:"
  let postseason = null;
  const pi = chunk.search(/(NBA|ABA)\s*\d{4}\s*Playoffs/);
  if (pi !== -1) {
    // Stop before B-Ref's inline <script> block, which follows the meta list.
    const tail = decode(chunk.slice(pi, pi + 1400)).split(/More Team Info|function sr_menus/)[0];
    const rounds = tail
      .split(/(?=(?:Won|Lost)\s+(?:NBA|ABA))/)
      .map((s) => s.replace(/\s*\(\s*Series Stats\s*\).*$/, "").trim())
      .filter((s) => /^(Won|Lost)\s/.test(s));
    // The deepest round reached is the last one listed.
    if (rounds.length) postseason = rounds[rounds.length - 1].replace(/\s+/g, " ");
  }
  return {
    wins: rec ? Number(rec[1]) : null,
    losses: rec ? Number(rec[2]) : null,
    srs: srs ? Number(srs[1]) : null,
    ppg: ppg ? Number(ppg[1]) : null,
    oppPpg: oppg ? Number(oppg[1]) : null,
    arena: arena ? arena[1].trim() : null,
    postseason,
  };
}

/* ---------- 3. Eras & banners ---------- */

const TITLES = new Set([1999, 2003, 2005, 2007, 2014]);
const FINALS = new Set([1999, 2003, 2005, 2007, 2013, 2014]);

const ERAS = [
  [1974, 1976, "The ABA Years"],
  [1977, 1985, "The Iceman"],
  [1986, 1989, "The Lean Years"],
  [1990, 1997, "The Admiral"],
  [1998, 2003, "Twin Towers"],
  [2004, 2008, "The Big Three"],
  [2009, 2013, "Reload"],
  [2014, 2016, "The Beautiful Game"],
  [2017, 2019, "The Handoff"],
  [2020, 2023, "The Rebuild"],
  [2024, 2100, "The Wemby Era"],
];
const eraFor = (y) => ERAS.find(([a, b]) => y >= a && y <= b)?.[2] ?? "Spurs";

/* ---------- 4. Role buckets & impact ---------- */

// Guard / Wing / Big — from B-Ref's listed position for that season.
function bucket(pos) {
  if (!pos) return "W";
  const p = pos.split("-")[0].trim().toUpperCase();
  if (p === "PG" || p === "SG" || p === "G") return "G";
  if (p === "C" || p === "PF" || p === "F-C" || p === "C-F") return "B";
  return "W";
}

// A transparent per-game impact metric, in the spirit of Game Score.
// Every term is a real box-score rate; the efficiency term is a bonus/penalty
// against a league-average .500 eFG%.
function impact(p) {
  const base =
    (p.pts ?? 0) +
    1.2 * (p.trb ?? 0) +
    1.5 * (p.ast ?? 0) +
    2.5 * (p.stl ?? 0) +
    2.5 * (p.blk ?? 0) -
    1.5 * (p.tov ?? 0);
  const eff = p.efgPct != null ? 22 * (p.efgPct - 0.5) : 0;
  return Math.round((base + eff) * 10) / 10;
}

/* ---------- 5. Build ---------- */

const raw = JSON.parse(readFileSync(new URL("./seasons.raw.json", import.meta.url).pathname, "utf8"));
const missingIds = [];
const seasons = [];

for (const s of raw) {
  const meta = pageMeta(s.year);
  const teamGames = (meta.wins ?? 0) + (meta.losses ?? 0) || 82;
  // Steals/blocks/turnovers were not tracked league-wide before 1973-74 (NBA)
  // — every season we scrape has them, but ABA box scores are thinner.
  const players = s.players
    .filter((p) => p.g != null && p.mpg != null && p.pts != null)
    .filter((p) => p.g >= Math.max(20, Math.round(teamGames * 0.4)) && p.mpg >= 14)
    .map((p) => {
      const key = norm(p.name);
      const nbaId = idByName.get(key) ?? null;
      if (!nbaId) missingIds.push(`${s.year} ${p.name}`);
      return {
        id: `${p.slug ?? key.replace(/ /g, "-")}-${s.year}`,
        slug: p.slug,
        name: p.name,
        nbaId,
        age: p.age,
        pos: p.pos,
        role: bucket(p.pos),
        g: p.g,
        gs: p.gs,
        mpg: p.mpg,
        pts: p.pts,
        trb: p.trb,
        ast: p.ast,
        stl: p.stl,
        blk: p.blk,
        tov: p.tov,
        fgPct: p.fgPct,
        fg3Pct: p.fg3Pct,
        ftPct: p.ftPct,
        efgPct: p.efgPct,
        fg3a: p.fg3a,
        impact: impact(p),
      };
    })
    .sort((a, b) => b.mpg - a.mpg);

  if (players.length < 3) {
    console.error(`skip ${s.label}: only ${players.length} qualified players`);
    continue;
  }

  seasons.push({
    year: s.year,
    label: s.label,
    league: s.league,
    era: eraFor(s.year),
    coach: (s.coach ?? "").replace(/\s*\([^)]*\)\s*/g, "").trim() || null,
    wins: meta.wins,
    losses: meta.losses,
    srs: meta.srs,
    ppg: meta.ppg,
    oppPpg: meta.oppPpg,
    arena: meta.arena,
    postseason: meta.postseason,
    title: TITLES.has(s.year),
    finals: FINALS.has(s.year),
    players,
  });
}

/* ---------- 6. League-wide percentiles across the whole vault ---------- */

const all = seasons.flatMap((s) => s.players);
const STATS = ["pts", "trb", "ast", "stl", "blk", "efgPct", "fg3Pct", "mpg", "impact"];
const sorted = {};
for (const k of STATS) sorted[k] = all.map((p) => p[k]).filter((v) => v != null).sort((a, b) => a - b);

function pctile(k, v) {
  if (v == null) return null;
  const arr = sorted[k];
  let lo = 0,
    hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return Math.round((lo / arr.length) * 100);
}

for (const s of seasons) {
  for (const p of s.players) {
    p.pct = Object.fromEntries(STATS.map((k) => [k, pctile(k, p[k])]));
  }
}

const impacts = sorted.impact;
const vault = {
  generated: new Date().toISOString().slice(0, 10),
  source: "Basketball-Reference team season pages (SAS, 1973-74 through 2024-25)",
  impactP90: impacts[Math.floor(impacts.length * 0.9)],
  impactP50: impacts[Math.floor(impacts.length * 0.5)],
  impactMax: impacts[impacts.length - 1],
  seasons,
};

writeFileSync(OUT, JSON.stringify(vault));
console.error(
  `\n${seasons.length} seasons | ${all.length} player-seasons | ` +
    `impact p50=${vault.impactP50} p90=${vault.impactP90} max=${vault.impactMax}`
);
console.error(`unmatched NBA ids: ${missingIds.length}`);
if (missingIds.length) console.error(missingIds.slice(0, 40).join("\n"));
