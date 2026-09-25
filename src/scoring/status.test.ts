import { describe, expect, test } from 'vitest'
import { makeConfig, makeStudent, type AttemptSpec } from '../test/student-fixtures'
import { studentStatus } from './status'

const config = makeConfig({ questionsPerStudent: 3, maxRawScore: 6 })
const skip = { skipped: 'Hors programme' }

describe('studentStatus', () => {
  test.each<[AttemptSpec[], string]>([
    [[], 'todo'],
    [['pending'], 'in_progress'],
    [[skip], 'in_progress'],
    [[1, 2], 'in_progress'],
    [[1, 2, 'pending'], 'in_progress'],
    [[1, 2, skip], 'in_progress'],
    [[1, 2, 0], 'done'],
    [[1, skip, 2, 2], 'done'],
  ])('%j → %s', (attempts, expected) => {
    expect(studentStatus(makeStudent(attempts), config)).toBe(expected)
  })

  test('un skip ne compte pas dans questionsPerStudent', () => {
    expect(studentStatus(makeStudent([1, skip, skip]), config)).toBe('in_progress')
  })

  test('absent prime sur tout, même terminé', () => {
    expect(studentStatus(makeStudent([], { absent: true }), config)).toBe('absent')
    expect(studentStatus(makeStudent([1, 2, 2], { absent: true }), config)).toBe('absent')
  })
})
