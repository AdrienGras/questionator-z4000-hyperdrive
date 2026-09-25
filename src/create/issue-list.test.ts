import { describe, expect, test } from 'vitest'
import { errorsFirst, keyed } from './issue-list'

describe('errorsFirst', () => {
  test('erreurs d’abord, ordre conservé dans chaque groupe', () => {
    const issues = [
      { severity: 'warning', id: 1 },
      { severity: 'error', id: 2 },
      { severity: 'warning', id: 3 },
      { severity: 'error', id: 4 },
    ] as const
    expect(errorsFirst(issues).map((issue) => issue.id)).toEqual([2, 4, 1, 3])
  })
})

describe('keyed', () => {
  test('clés uniques même pour des éléments identiques', () => {
    expect(keyed(['a', 'b', 'a'], (item) => item).map(({ key }) => key)).toEqual([
      'a#0',
      'b#0',
      'a#1',
    ])
  })
})
