import test from 'node:test'
import assert from 'node:assert/strict'

import { buildClues, stillInPlay } from '../src/lib/six-clues/clues.ts'
import { HINTS } from '../src/lib/six-clues/hints.ts'
import { PLAYERS } from '../src/lib/six-clues/players.ts'
import { poolFor, shouldShowHintPlayers } from '../src/lib/six-clues/game.ts'

const requestedExceptions = new Set(['Avery Johnson', 'Dennis Rodman', 'Doc Rivers', 'George Gervin'])

function player(name) {
  const found = PLAYERS.find(p => p.name === name)
  assert.ok(found, `${name} should be in the Six Clues dataset`)
  return found
}

function clueText(name) {
  return buildClues(player(name)).map(clue => clue.value)
}

test('pools only use players with a Spurs season in 1999 or later plus the requested exceptions', () => {
  for (const mode of ['easy', 'hard']) {
    for (const p of poolFor(mode)) {
      assert.ok(p.to >= 1999 || requestedExceptions.has(p.name), `${mode} contains ${p.name}`)
    }
  }

  assert.ok(poolFor('hard').some(p => p.name === 'Doc Rivers'))
})

test('curated pools only include players with an active authored hint pack', () => {
  const authoredIds = new Set(Object.keys(HINTS).map(Number))

  for (const mode of ['easy', 'hard']) {
    for (const p of poolFor(mode)) {
      assert.ok(authoredIds.has(p.id), `${mode} contains ${p.name} without an active hint pack`)
    }
  }
})

test('Coyote is the first player in both pools', () => {
  assert.equal(poolFor('easy')[0].name, 'Coyote')
  assert.equal(poolFor('hard')[0].name, 'Coyote')
  assert.notEqual(poolFor('easy')[1].name, 'Coyote')
})

test('hint player names stay hidden when the remaining field is no larger than the turns left', () => {
  assert.equal(shouldShowHintPlayers(2, 2), false)
  assert.equal(shouldShowHintPlayers(1, 2), false)
  assert.equal(shouldShowHintPlayers(3, 3), false)
  assert.equal(shouldShowHintPlayers(4, 3), true)
  assert.equal(shouldShowHintPlayers(7, 6), true)
})

test('Coyote has the authored six-pack and no display category metadata', () => {
  const clues = buildClues(poolFor('easy')[0])
  assert.deepEqual(clues.map(clue => clue.value), HINTS[999999].map(hint => hint.text))
  assert.ok(clues.every(clue => !('label' in clue)))
  assert.ok(HINTS[999999].every(clue => !('label' in clue)))
})

test('authored clues are emitted in the order written in the hints file', () => {
  for (const p of poolFor('hard')) {
    assert.deepEqual(
      buildClues(p).map(clue => clue.value),
      HINTS[p.id].map(hint => hint.text),
      `${p.name} clues should preserve hints.ts order`,
    )
  }
})

test('every curated player has six authored, uniquely keyed clues', () => {
  const pool = poolFor('hard')

  for (const p of pool) {
    const clues = buildClues(p)
    assert.equal(clues.length, 6, `${p.name} should have six clues`)
    assert.equal(new Set(clues.map(clue => clue.key)).size, 6, `${p.name} has duplicate clue keys`)
    assert.ok(clues.every(clue => clue.value.trim()), `${p.name} has an empty clue`)
    assert.ok(clues.every(clue => clue.matches(p)), `${p.name} is contradicted by their own clue`)
    assert.deepEqual(stillInPlay(pool, clues, 6, []).map(candidate => candidate.id), [p.id], `${p.name} is not uniquely identified`)
  }
})

test('the authored clue set contains the requested Spurs stories in sensible positions', () => {
  const tony = clueText('Tony Parker')
  assert.match(tony[0], /hip-hop album/i)

  const bonner = clueText('Matt Bonner')
  assert.match(bonner[0], /artisanal sandwiches/i)
  assert.ok(bonner.some(text => /Red Mamba/i.test(text)))

  const green = clueText('Danny Green')
  assert.ok(green.findIndex(text => /27 three-pointers/i.test(text)) <= 1)

  const sean = clueText('Sean Elliott')
  assert.ok(sean.findIndex(text => /Memorial Day Miracle/i.test(text)) >= 2)

  const manu = clueText('Manu Ginobili')
  assert.ok(manu.findIndex(text => /bat/i.test(text)) >= 4)

  const wemby = clueText('Victor Wembanyama')
  assert.ok(wemby.findIndex(text => /35\+ points.*10\+ rebounds.*2\+ blocks/i.test(text)) >= 2)

  assert.ok(clueText('Avery Johnson').some(text => /The Little General/i.test(text)))
  assert.ok(clueText('George Gervin').some(text => /four NBA scoring titles/i.test(text)))
  assert.ok(clueText('Boris Diaw').some(text => /espresso machine/i.test(text)))
  assert.ok(clueText('Dejounte Murray').some(text => /franchise.*triple-double record/i.test(text)))
  assert.ok(clueText('Tim Duncan').some(text => /four years of college/i.test(text)))
})

test('the old era template is gone from every authored clue', () => {
  for (const p of poolFor('hard')) {
    for (const clue of buildClues(p)) {
      assert.doesNotMatch(clue.value, /Wore silver & black in the/i)
    }
  }
})
