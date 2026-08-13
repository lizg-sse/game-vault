// Download one consistent 120x180 portrait per player and self-host it, so
// the game has a uniform look and no runtime dependency on an outside CDN.
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";

const PATH = new URL("../src/data/vault.json", import.meta.url).pathname;
const DIR = new URL("../public/portraits", import.meta.url).pathname;
if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const vault = JSON.parse(readFileSync(PATH, "utf8"));

const slugs = new Map(); // slug -> name
for (const s of vault.seasons) for (const p of s.players) if (p.slug) slugs.set(p.slug, p.name);

const entries = [...slugs];
const have = new Set();
const missing = [];
let i = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function worker(lane) {
  await sleep(lane * 220);
  while (i < entries.length) {
    const [slug, name] = entries[i++];
    const dest = `${DIR}/${slug}.jpg`;
    if (existsSync(dest) && statSync(dest).size > 2000) {
      have.add(slug);
      continue;
    }
    try {
      const res = await fetch(
        `https://www.basketball-reference.com/req/202106291/images/headshots/${slug}.jpg`,
        { headers: { "User-Agent": UA } }
      );
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        // The 404 body is a large "no photo" page asset, not a portrait.
        if (buf.length > 2000 && buf.length < 60_000) {
          writeFileSync(dest, buf);
          have.add(slug);
        } else missing.push(name);
      } else missing.push(name);
    } catch {
      missing.push(name);
    }
    await sleep(900);
  }
}

await Promise.all(Array.from({ length: 4 }, (_, n) => worker(n)));

// Record the portrait on each player-season; null means fall back to the crest.
for (const s of vault.seasons) {
  for (const p of s.players) {
    p.img = p.slug && have.has(p.slug) ? p.slug : null;
    delete p.nbaId;
  }
}
writeFileSync(PATH, JSON.stringify(vault));

console.error(`${have.size}/${slugs.size} players have a portrait`);
if (missing.length) console.error(`no portrait: ${[...new Set(missing)].join(", ")}`);
