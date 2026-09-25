import { describe, expect, test } from 'vitest'
import { makeSession } from '@/testing/session-fixtures'
import { withExaminer } from './session-edits'

describe('withExaminer', () => {
  test('pose l’examinateur', () => {
    expect(withExaminer(makeSession(), 'Mme Martin').examiner).toBe('Mme Martin')
  })

  test('valeur vide : clé retirée, pas de chaîne vide ni de undefined', () => {
    const session = withExaminer(makeSession({ examiner: 'M. Dupont' }), '')
    expect('examiner' in session).toBe(false)
    expect(session).toEqual(makeSession())
  })
})
