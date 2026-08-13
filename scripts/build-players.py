#!/usr/bin/env python3
"""Regenerate src/lib/players.ts and public/players/*.webp.

Pipeline:
  1. Sweep every Spurs NBA season page on Basketball-Reference (1976-77 onward).
     Team season pages already scope stats to the Spurs, so summing a player's
     season rows yields their exact franchise totals.
  2. Keep players with a real Spurs tenure (see MIN_GAMES / MIN_SEASONS).
  3. Resolve each to an NBA person id and pull their headshot. The NBA CDN
     answers 200 with a ~12KB silhouette for players it has no photo of, so
     matching that image's md5 is what actually filters the roster — plenty of
     pre-1990 Spurs are dropped here, which is intended.
  4. Emit typed data + WebP headshots.

Usage:  python3 scripts/build-players.py
Deps:   sips + cwebp (Homebrew: `brew install webp`). Run from the repo root.
Takes ~5 minutes, most of it the 3.5s courtesy delay between BBRef requests.
"""
import ast
import hashlib
import json
import os
import re
import subprocess
import time
import unicodedata
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "public/players")
OUT_TS = os.path.join(ROOT, "src/lib/players.ts")

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"
NBA_IDS = "https://raw.githubusercontent.com/swar/nba_api/master/src/nba_api/stats/library/data.py"
HEADSHOT = "https://cdn.nba.com/headshots/nba/latest/1040x760/{pid}.png"
FIRST_NBA_SEASON, LAST_SEASON = 1977, 2026
MIN_GAMES, MIN_SEASONS = 100, 2
BBREF_DELAY = 3.5

# Aggregated per player; the subset exposed to the game is KEYS.
SUM = ["games", "mp", "fg", "fg3", "ft", "orb", "trb", "ast", "stl", "blk", "tov", "pts"]
KEYS = ["pts", "trb", "ast", "stl", "blk", "fg3", "ft", "games", "mp"]


def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read() if binary else r.read().decode("utf-8", "replace")


def norm(name):
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z ]", "", name.lower()).strip()


def season_rows(html, table_id):
    """Per-player totals from a team season table. BBRef ships these inside
    HTML comments, so callers must strip the comment markers first."""
    m = re.search(r'id="%s".*?<tbody>(.*?)</tbody>' % table_id, html, re.S)
    if not m:
        return []
    out = []
    for row in re.findall(r"<tr.*?</tr>", m.group(1), re.S):
        bref = re.search(r'data-append-csv="([a-z0-9]+)"', row)
        name = re.search(r'data-stat="name_display"[^>]*>.*?>([^<]+)</a>', row, re.S)
        if not bref or not name:
            continue
        cells = dict(re.findall(r'data-stat="([a-z_0-9]+)"[^>]*>(.*?)</td>', row, re.S))
        vals = {}
        for k in SUM:
            v = re.sub(r"<[^>]+>", "", cells.get(k, "")).strip().replace(",", "")
            vals[k] = float(v) if v else 0.0
        out.append((bref.group(1), name.group(1).strip(), vals))
    return out


def sweep():
    reg, meta = {}, {}
    for year in range(FIRST_NBA_SEASON, LAST_SEASON + 1):
        try:
            html = get(f"https://www.basketball-reference.com/teams/SAS/{year}.html")
        except Exception as e:
            print(f"  {year}: ERROR {e}", flush=True)
            time.sleep(BBREF_DELAY)
            continue
        rows = season_rows(html.replace("<!--", "").replace("-->", ""), "totals_stats")
        for bref, name, vals in rows:
            tgt = reg.setdefault(bref, {k: 0.0 for k in SUM})
            for k in SUM:
                tgt[k] += vals[k]
            m = meta.setdefault(bref, {"name": name, "seasons": 0, "years": []})
            m["seasons"] += 1
            m["years"].append(year)
        print(f"  {year}: {len(rows)} players", flush=True)
        time.sleep(BBREF_DELAY)
    return reg, meta


def emit(kept):
    lines = [
        "// GENERATED — do not edit by hand. See scripts/build-players.py.",
        "// Regular-season totals with the San Antonio Spurs (NBA era, 1976-77 onward),",
        "// sourced from Basketball-Reference team season pages. Headshots: NBA CDN.",
        "",
        "export type StatKey =",
    ]
    lines += [f"  | {json.dumps(k)}" for k in KEYS]
    lines[-1] += ";"
    lines += [
        "",
        "export type Player = {",
        "  id: string;",
        "  name: string;",
        "  img: string;",
        "  /** First through last season with the Spurs. */",
        "  years: string;",
        "  seasons: number;",
        "  stats: Record<StatKey, number>;",
        "};",
        "",
        "export const PLAYERS: Player[] = [",
    ]
    for p in kept:
        stats = ", ".join(f"{k}: {p['stats'][k]}" for k in KEYS)
        lines += [
            "  {",
            f"    id: {json.dumps(p['id'])},",
            f"    name: {json.dumps(p['name'], ensure_ascii=False)},",
            f"    img: {json.dumps(p['img'])},",
            f"    years: {json.dumps(p['years'], ensure_ascii=False)},",
            f"    seasons: {p['seasons']},",
            f"    stats: {{ {stats} }},",
            "  },",
        ]
    lines += ["];", ""]
    with open(OUT_TS, "w") as f:
        f.write("\n".join(lines))


def main():
    print("Sweeping Spurs season pages...")
    reg, meta = sweep()
    print(f"  {len(meta)} distinct players\n")

    print("Resolving NBA person ids...")
    nba = ast.literal_eval(re.search(r"players = (\[.*?\n\])", get(NBA_IDS), re.S).group(1))
    by_name = {}
    for pid, _last, _first, full, _active in nba:
        by_name.setdefault(norm(full), []).append(pid)

    silhouette = hashlib.md5(get(HEADSHOT.format(pid=9999999), binary=True)).hexdigest()
    os.makedirs(IMG_DIR, exist_ok=True)

    candidates = [
        b for b, m in meta.items()
        if reg[b]["games"] >= MIN_GAMES and m["seasons"] >= MIN_SEASONS
    ]
    print(f"  {len(candidates)} with >={MIN_GAMES} games and >={MIN_SEASONS} seasons\n")

    print("Fetching headshots...")
    kept, dropped = [], []
    for bref in sorted(candidates, key=lambda b: -reg[b]["pts"]):
        name = meta[bref]["name"]
        ids = by_name.get(norm(name), [])
        if len(ids) != 1:
            # No match, or a name shared by several NBA players — either way we
            # cannot prove which headshot belongs to this Spur, so skip it.
            dropped.append((name, "ambiguous or unknown NBA id"))
            continue
        try:
            img = get(HEADSHOT.format(pid=ids[0]), binary=True)
        except Exception as e:
            dropped.append((name, f"fetch failed: {e}"))
            continue
        if hashlib.md5(img).hexdigest() == silhouette or len(img) < 20000:
            dropped.append((name, "no headshot"))
            continue

        png = os.path.join(IMG_DIR, f"{bref}.png")
        webp = os.path.join(IMG_DIR, f"{bref}.webp")
        with open(png, "wb") as f:
            f.write(img)
        subprocess.run(["sips", "-Z", "520", png, "--out", png], check=True, capture_output=True)
        subprocess.run(["cwebp", "-quiet", "-q", "82", png, "-o", webp], check=True)
        os.remove(png)

        years = meta[bref]["years"]
        kept.append({
            "id": bref,
            "name": name,
            "img": f"/players/{bref}.webp",
            "years": f"{min(years) - 1}–{max(years)}",
            "seasons": meta[bref]["seasons"],
            "stats": {k: int(reg[bref][k]) for k in KEYS},
        })
        print(f"  KEEP {name} ({int(reg[bref]['pts'])} pts)", flush=True)

    emit(kept)
    print(f"\nWrote {OUT_TS} with {len(kept)} players ({len(dropped)} dropped).")
    for name, why in dropped:
        print(f"  - {name}: {why}")


if __name__ == "__main__":
    main()
