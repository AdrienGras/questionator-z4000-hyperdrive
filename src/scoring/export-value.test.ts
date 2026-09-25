import { describe, expect, test } from 'vitest'
import { makeConfig, makeStudent } from '../test/student-fixtures'
import { exportedFinal } from './export-value'

const scoring = { questionsPerStudent: 1, maxRawScore: 20, rounding: { step: 0.5 } }
const absent = makeStudent([], { absent: true })

describe('exportedFinal', () => {
  test('absent en mode label : le texte', () => {
    expect(exportedFinal(absent, makeConfig(scoring, { export: 'label', label: 'ABS' }))).toBe(
      'ABS',
    )
  })

  test('absent en mode zero : 0', () => {
    expect(exportedFinal(absent, makeConfig(scoring, { export: 'zero' }))).toBe(0)
  })

  test('absent en mode value : absent.value', () => {
    expect(exportedFinal(absent, makeConfig(scoring, { export: 'value', value: 5 }))).toBe(5)
  })

  test('absent en mode value sans valeur : config invalide, lève', () => {
    const config = makeConfig(scoring, { export: 'value' })
    expect(() => exportedFinal(absent, config)).toThrow(/absent\.value/)
  })

  test('terminé : la note finale en nombre', () => {
    const student = makeStudent([13.5], { adjustment: { value: 1 } })
    expect(exportedFinal(student, makeConfig(scoring))).toBe(14.5)
  })

  test('non terminé : null', () => {
    const config = makeConfig({ ...scoring, questionsPerStudent: 2 })
    expect(exportedFinal(makeStudent([5]), config)).toBeNull()
    expect(exportedFinal(makeStudent(), config)).toBeNull()
  })
})
