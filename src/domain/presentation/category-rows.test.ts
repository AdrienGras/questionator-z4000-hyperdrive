import { describe, expect, test } from 'vitest'
import { categoryRows } from './category-rows'

describe('categoryRows', () => {
  test.each([
    [0, []],
    [1, [1]],
    [2, [2]],
    [3, [3]],
    [4, [2, 2]],
    [5, [3, 2]],
    [6, [3, 3]],
    [7, [4, 3]],
    [8, [4, 4]],
    [9, [5, 4]],
    [10, [5, 5]],
    [11, [4, 4, 3]],
    [12, [4, 4, 4]],
    [13, [5, 4, 4]],
    [14, [5, 5, 4]],
    [15, [5, 5, 5]],
    [16, [6, 5, 5]],
  ])('%i catégories → %j', (n, rows) => {
    expect(categoryRows(n)).toEqual(rows)
  })

  test('toutes les tuiles sont placées, lignes les plus longues en premier', () => {
    for (let n = 1; n <= 40; n++) {
      const rows = categoryRows(n)
      expect(rows.reduce((a, b) => a + b, 0)).toBe(n)
      expect(rows).toEqual(rows.toSorted((a, b) => b - a))
      expect(Math.max(...rows) - Math.min(...rows)).toBeLessThanOrEqual(1)
    }
  })
})
