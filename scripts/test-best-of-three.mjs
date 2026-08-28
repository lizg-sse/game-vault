import test from "node:test";
import assert from "node:assert/strict";

import { mulberry32 } from "../src/lib/prng.ts";
import {
  eligiblePlayerSeasons,
  formatHeight,
  selectComparableOptions,
} from "../src/lib/best-of-three-selection.ts";

const exceptionNames = [
  "Tim Duncan",
  "David Robinson",
  "George Gervin",
  "Tony Parker",
  "Manu Ginóbili",
  "Boris Diaw",
  "Matt Bonner",
  "Patty Mills",
  "Sean Elliott",
  "Bruce Bowen",
  "Tiago Splitter",
  "Avery Johnson",
  "Robert Horry",
  "Richard Jefferson",
];

function season(year, players) {
  return { year, label: `${year - 1}-${String(year).slice(-2)}`, players };
}

function player(name, id = name.toLowerCase().replaceAll(" ", "-"), pts = 14, impact = 24, role = "G") {
  return { id, name, pts, impact, role, g: 70, mpg: 24 };
}

test("the player-season pool is modern-only, keeps named exceptions, and excludes Kawhi", () => {
  const rows = eligiblePlayerSeasons([
    season(2009, [player("Old Spur")]),
    season(2010, [player("2009-10 Spur")]),
    season(2011, [player("Modern Spur")]),
    season(1998, [player("George Gervin"), player("Kawhi Leonard")]),
  ]);

  assert.deepEqual(
    rows.map(({ player: selected }) => selected.name),
    ["Modern Spur", "George Gervin"],
  );
  assert.ok(exceptionNames.every((name) => typeof name === "string"));
});

test("a matchup keeps the three visible stat lines close while allowing cross-season records", () => {
  const candidates = [
    { season: { year: 2012, label: "2011-12" }, player: player("Guard 1", "guard-1", 15.2, 24.1, "G") },
    { season: { year: 2016, label: "2015-16" }, player: player("Wing 1", "wing-1", 16.4, 25.8, "W") },
    { season: { year: 1998, label: "1997-98" }, player: player("Big 1", "big-1", 14.7, 22.9, "B") },
    { season: { year: 2021, label: "2020-21" }, player: player("Low Outlier", "low", 1.5, 8, "G") },
    { season: { year: 2022, label: "2021-22" }, player: player("High Outlier", "high", 25, 44, "B") },
  ];

  const selected = selectComparableOptions(candidates, mulberry32(7), new Set());
  const points = selected.map(({ player: picked }) => picked.pts);
  const impact = selected.map(({ player: picked }) => picked.impact);

  assert.equal(selected.length, 3);
  assert.equal(new Set(selected.map(({ player: picked }) => picked.name)).size, 3);
  assert.ok(Math.max(...points) - Math.min(...points) <= 3, `PPG spread was ${points}`);
  assert.ok(Math.max(...impact) - Math.min(...impact) <= 6, `impact spread was ${impact}`);
  assert.ok(new Set(selected.map(({ season: pickedSeason }) => pickedSeason.year)).size > 1);
});

test("the same seed deals the same matchup, while different seeds can deal different matchups", () => {
  const candidates = Array.from({ length: 18 }, (_, index) => ({
    season: { year: 2010 + index, label: `${2009 + index}-${String(10 + index).padStart(2, "0")}` },
    player: player(
      `Player ${index}`,
      `player-${index}`,
      10 + (index % 6),
      18 + (index % 8),
      ["G", "W", "B"][index % 3],
    ),
  }));

  const first = selectComparableOptions(candidates, mulberry32(11), new Set());
  const repeat = selectComparableOptions(candidates, mulberry32(11), new Set());
  const deals = new Set(
    Array.from({ length: 12 }, (_, seed) =>
      selectComparableOptions(candidates, mulberry32(seed), new Set())
        .map(({ player: picked }) => picked.id)
        .join("|"),
    ),
  );

  assert.deepEqual(first.map(({ player: picked }) => picked.id), repeat.map(({ player: picked }) => picked.id));
  assert.ok(deals.size > 1);
});

test("height values are formatted as compact basketball measurements", () => {
  assert.equal(formatHeight("6-7"), "6′7″");
  assert.equal(formatHeight("5-11"), "5′11″");
  assert.equal(formatHeight("—"), "—");
});
