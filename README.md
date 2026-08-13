# Spurs Vault

A daily guessing game for San Antonio Spurs players. One clue to start, a photo
blurred past recognition, and six turns to name the Spur — the fewer clues you
take, the more points you bank.

```bash
npm install
npm run dev
```

## How it plays

You open with a single clue. Each turn you either guess or skip; both reveal the
next clue and sharpen the photo a little. Six turns, six clues.

| Clues used | 1 | 2 | 3 | 4 | 5 | 6 |
| ---------- | --- | --- | --- | --- | --- | --- |
| Points | 1000 | 800 | 600 | 400 | 250 | 100 |

Clues run broad to narrow — era, position, honors, height, Spurs tenure, and
finally where they played before the NBA:

> **Era** Wore silver & black in the 2000s
> **Position** Center
> **Honors** Won a title in San Antonio, and made an All-Star team
> **Height** 6′10″ or taller
> **In San Antonio** 19 seasons · 15–20 PPG
> **Before the NBA** Wake Forest

A wrong guess still teaches you something: it's listed with the clue it fell foul
of, and that reason updates as later clues arrive.

**Easy** (the default) draws from 59 Spurs most fans could name, and the **Hint**
button lists everyone the clues haven't ruled out yet. **Hard** opens the pool to
all 84 players with no hints, and runs its own player each day. The two keep
separate stats and streaks in `localStorage`.

### Clue design

Every clue's predicate tests exactly what its text says and nothing more, so the
hint list is honest: a player disappears from it only because something you were
shown rules them out.

The bands (height ranges, scoring ranges, primary position rather than the full
"Forward-Guard" listing) are deliberately coarse. An earlier cut matched on exact
values and cut the field from 59 players to 1 by the second clue. The current set
narrows like this, averaged over every player in the pool:

| Clues shown | 1 | 2 | 3 | 4 | 5 | 6 |
| ----------- | --- | --- | --- | --- | --- | --- |
| Easy (59) | 18.1 | 7.1 | 2.9 | 1.9 | 1.1 | 1.0 |
| Hard (84) | 23.3 | 8.9 | 4.0 | 2.5 | 1.2 | 1.0 |

Every player is uniquely pinned down by the sixth clue, so the puzzle is always
solvable without guessing blind.

## Where the data comes from

`src/lib/players.ts` and `public/headshots/` are generated. To rebuild them:

```bash
node scripts/build-players.mjs
```

| Field | Source |
| ----- | ------ |
| position, height, jersey, school, draft | nba.com player pages |
| Spurs games, seasons, PPG/RPG/APG | basketball-reference franchise register |
| All-Star, All-NBA, MVP, Hall of Fame | basketball-reference player pages |
| championships | basketball-reference title-season rosters |
| headshots | cdn.nba.com, falling back to basketball-reference |

Player IDs come from nba.com's own sitemap rather than being guessed from names,
and every headshot was checked by eye against its player before shipping.

A few things the script handles that are easy to get wrong:

- **Placeholder headshots.** nba.com serves one shared silhouette for players it
  has no photo of. The script detects it by hash and falls back to
  basketball-reference; anyone with no real photo from either source is dropped,
  since the reveal is the whole game.
- **Championship credit.** Title-season roster tables include players traded away
  before the Finals. Ring counts are cross-checked against each player's career
  total, and the script throws if a new discrepancy appears. Malik Rose (dealt to
  New York in February 2005) is the one recorded correction.
- **Accolade counts.** nba.com's All-Star field reads 0 for active players, so
  accolades come from basketball-reference instead.

Responses are cached under `scripts/.cache` (gitignored), and
basketball-reference is rate limited to roughly 17 requests a minute.

Headshots are third-party photos bundled here for a personal project — worth
sorting out before publishing this anywhere public.

## Layout

```
src/lib/players.ts    generated player data
src/lib/clues.ts      clue text and the predicates behind the hint list
src/lib/game.ts       daily rotation, scoring, stats, share text
src/components/       the board, sheets, and guess bar
scripts/              the data pipeline
```

The game is a single client component: the daily player depends on the visitor's
local date and their saved progress, so the board mounts after hydration.
