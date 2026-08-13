// Scrape real San Antonio Spurs per-game season stats from Basketball-Reference.
// Rate-limited to stay well under B-Ref's 20 req/min policy.
import { writeFileSync, existsSync, readFileSync, mkdirSync } from "node:fs";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const CACHE = new URL("./cache", import.meta.url).pathname;
if (!existsSync(CACHE)) mkdirSync(CACHE, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getPage(year) {
  const file = `${CACHE}/SAS-${year}.html`;
  if (existsSync(file)) return readFileSync(file, "utf8");
  const url = `https://www.basketball-reference.com/teams/SAS/${year}.html`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${year}: HTTP ${res.status}`);
  const html = await res.text();
  writeFileSync(file, html);
  await sleep(4000);
  return html;
}

const decode = (s) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&uuml;/g, "ü")
    .replace(/&ccedil;/g, "ç")
    .trim();

function extractTable(html, id) {
  // B-Ref hides some tables inside HTML comments; unwrap everything first.
  const flat = html.replace(/<!--/g, "").replace(/-->/g, "");
  const start = flat.indexOf(`id="${id}"`);
  if (start === -1) return null;
  const tbodyStart = flat.indexOf("<tbody>", start);
  const tbodyEnd = flat.indexOf("</tbody>", tbodyStart);
  if (tbodyStart === -1 || tbodyEnd === -1) return null;
  return flat.slice(tbodyStart, tbodyEnd);
}

function parseRows(tbody) {
  const rows = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = rowRe.exec(tbody))) {
    const inner = m[1];
    if (/class="thead"/.test(m[0])) continue;
    const cells = {};
    const cellRe = /<(?:th|td)[^>]*data-stat="([^"]+)"[^>]*>([\s\S]*?)<\/(?:th|td)>/g;
    let c;
    while ((c = cellRe.exec(inner))) cells[c[1]] = decode(c[2]);
    // Player page slug -> stable identity across seasons
    const slug = /data-append-csv="([^"]+)"/.exec(inner);
    if (slug) cells.__slug = slug[1];
    if (Object.keys(cells).length) rows.push(cells);
  }
  return rows;
}

function parseMeta(html) {
  const i = html.indexOf('<div id="meta"');
  if (i === -1) return {};
  const chunk = html.slice(i, i + 6000);
  const grab = (label) => {
    const re = new RegExp(`<strong>\\s*${label}[^<]*</strong>([\\s\\S]*?)</p>`, "i");
    const m = re.exec(chunk);
    return m ? decode(m[1]).replace(/^:\s*/, "") : null;
  };
  return {
    record: grab("Record"),
    coach: grab("Coach"),
    playoffs: grab("Playoffs"),
    srs: grab("SRS"),
    pace: grab("Pace"),
  };
}

const seasons = [];
const startYear = Number(process.argv[2] || 1974);
const endYear = Number(process.argv[3] || 2025);

for (let year = startYear; year <= endYear; year++) {
  try {
    const html = await getPage(year);
    const tbody = extractTable(html, "per_game_stats");
    if (!tbody) {
      console.error(`${year}: no per_game_stats table`);
      continue;
    }
    const rows = parseRows(tbody).filter((r) => r.name_display || r.player);
    const meta = parseMeta(html);
    const league = year <= 1976 ? "ABA" : "NBA";
    seasons.push({
      year,
      label: `${year - 1}-${String(year % 100).padStart(2, "0")}`,
      league,
      ...meta,
      players: rows.map((r) => ({
        slug: r.__slug || null,
        name: r.name_display || r.player,
        age: num(r.age),
        pos: r.pos || null,
        g: num(r.games) ?? num(r.g),
        gs: num(r.games_started) ?? num(r.gs),
        mpg: num(r.mp_per_g),
        pts: num(r.pts_per_g),
        trb: num(r.trb_per_g),
        ast: num(r.ast_per_g),
        stl: num(r.stl_per_g),
        blk: num(r.blk_per_g),
        tov: num(r.tov_per_g),
        fgPct: num(r.fg_pct),
        fg3Pct: num(r.fg3_pct),
        ftPct: num(r.ft_pct),
        efgPct: num(r.efg_pct),
        fg3a: num(r.fg3a_per_g),
      })),
    });
    console.error(`${year}: ${rows.length} players  |  ${meta.record ?? "?"}`);
  } catch (e) {
    console.error(`${year}: ${e.message}`);
  }
}

function num(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

writeFileSync(new URL("./seasons.raw.json", import.meta.url).pathname, JSON.stringify(seasons, null, 2));
console.error(`\nWrote ${seasons.length} seasons.`);
