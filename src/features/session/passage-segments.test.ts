import { expect, test } from 'vitest'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { passageSegments } from './passage-segments'

const config = makeConfig({ questionsPerStudent: 3 })

test('notées, puis en cours, puis à venir', () => {
  const segments = passageSegments(makeStudent([1, 'pending']), config)
  expect(segments.map((segment) => segment.state)).toEqual(['scored', 'pending', 'todo'])
  expect(segments[0]).toMatchObject({ categoryId: 'a', categoryLabel: 'A' })
  expect(segments[1]).toMatchObject({ categoryId: 'a', categoryLabel: 'A' })
  expect(segments[2]).toEqual({ state: 'todo' })
})

test('une question passée n’occupe aucun segment', () => {
  const segments = passageSegments(makeStudent([1, { skipped: 'Hors sujet' }, 'pending']), config)
  expect(segments.map((segment) => segment.state)).toEqual(['scored', 'pending', 'todo'])
})

test('terminé : tous les segments remplis', () => {
  const segments = passageSegments(makeStudent([1, 0, 2]), config)
  expect(segments.map((segment) => segment.state)).toEqual(['scored', 'scored', 'scored'])
})

test('aucune tentative : tout à venir', () => {
  expect(passageSegments(makeStudent(), config)).toEqual([
    { state: 'todo' },
    { state: 'todo' },
    { state: 'todo' },
  ])
})
