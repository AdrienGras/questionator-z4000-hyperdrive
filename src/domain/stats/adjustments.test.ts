import { describe, expect, it } from 'vitest'
import { asMilli } from '@/domain/scoring/milli'
import { makeStudent } from '@/testing/student-fixtures'
import { computeAdjustments } from './adjustments'

describe('computeAdjustments', () => {
  it('compte les ajustements non nuls des présents, avec somme et moyenne', () => {
    const students = [
      makeStudent([], { adjustment: { value: 1 } }),
      makeStudent([], { adjustment: { value: -0.5 } }),
      makeStudent([], { adjustment: { value: 0 } }),
      makeStudent([], { absent: true, adjustment: { value: 2 } }),
      makeStudent([]),
    ]
    expect(computeAdjustments(students)).toEqual({ count: 2, sum: asMilli(500), mean: 0.25 })
  })

  it('renvoie une somme nulle et une moyenne null sans ajustement', () => {
    expect(computeAdjustments([makeStudent([])])).toEqual({
      count: 0,
      sum: asMilli(0),
      mean: null,
    })
  })
})
