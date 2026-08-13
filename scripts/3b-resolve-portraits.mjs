// Resolve one portrait per player and cache it in public/portraits.
//
// Two sources, in order of preference:
//   1. Basketball-Reference — uniform 120x180 crops, best coverage for the
//      1970s-90s rosters. Already downloaded by fetch-portraits.mjs.
//   2. cdn.nba.com — high-res transparent cutouts, but only for players the
//      NBA has shot in the modern era. It answers 200 with a generic grey
//      silhouette otherwise, so those are detected by hash and rejected.
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

const PATH = new URL("../src/data/vault.json", import.meta.url).pathname;
const DIR = new URL("../public/portraits", import.meta.url).pathname;
if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });

const vault = JSON.parse(readFileSync(PATH, "utf8"));

/* Unique players, with whichever ids we have for them. */
const people = new Map(); // name -> {slug, nbaId}
for (const s of vault.seasons) {
  for (const p of s.players) {
    const prev = people.get(p.name) ?? {};
    people.set(p.name, { slug: p.slug ?? prev.slug, nbaId: p.nbaId ?? prev.nbaId });
  }
}

const brefOk = (slug) =>
  Boolean(slug) && existsSync(`${DIR}/${slug}.jpg`) && statSync(`${DIR}/${slug}.jpg`).size > 2000;

/* Fetch every candidate NBA png once, hash it, drop the shared placeholder. */
const needNba = [...people].filter(([, v]) => v.nbaId && !brefOk(v.slug));
const blobs = new Map(); // nbaId -> Buffer
const counts = new Map(); // hash -> n
let i = 0;

async function worker() {
  while (i < needNba.length) {
    const [, { nbaId }] = needNba[i++];
    try {
      const res = await fetch(`https://cdn.nba.com/headshots/nba/latest/260x190/${nbaId}.png`);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const h = createHash("sha1").update(buf).digest("hex");
      blobs.set(nbaId, { buf, h });
      counts.set(h, (counts.get(h) ?? 0) + 1);
    } catch {
      /* leave it missing */
    }
  }
}
await Promise.all(Array.from({ length: 10 }, worker));

const placeholder = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];

/* Resolve and write. */
const resolved = new Map(); // name -> public path | null
let fromBref = 0;
let fromNba = 0;

for (const [name, { slug, nbaId }] of people) {
  if (brefOk(slug)) {
    resolved.set(name, `/portraits/${slug}.jpg`);
    fromBref++;
    continue;
  }
  const blob = nbaId ? blobs.get(nbaId) : null;
  if (blob && blob.h !== placeholder) {
    writeFileSync(`${DIR}/nba-${nbaId}.png`, blob.buf);
    resolved.set(name, `/portraits/nba-${nbaId}.png`);
    fromNba++;
    continue;
  }
  resolved.set(name, null);
}

for (const s of vault.seasons) {
  for (const p of s.players) {
    p.img = resolved.get(p.name) ?? null;
    // Keep the payload lean: the ids were only ever a means to the portrait.
    delete p.nbaId;
    delete p.slug;
  }
}

vault.portraitSources = "Basketball-Reference and cdn.nba.com, cached locally";
writeFileSync(PATH, JSON.stringify(vault));

const none = [...resolved].filter(([, v]) => !v).map(([n]) => n);
console.error(
  `${people.size} players | ${fromBref} B-Ref | ${fromNba} NBA | ${none.length} crest fallback`
);
if (none.length) console.error(none.sort().join(", "));
