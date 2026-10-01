import { describe, expect, test } from 'vitest'
import { acceptAllCss, richSession } from '@/testing/backup-fixtures'
import { checkStoredSession } from './stored-session'

const deps = { cssSupports: acceptAllCss }

function codesOf(raw: unknown) {
  const result = checkStoredSession(raw, deps)
  return result.ok ? [] : result.issues.map((issue) => issue.code)
}

describe('checkStoredSession', () => {
  test('session valide : renvoyée telle quelle', () => {
    const result = checkStoredSession(richSession(), deps)
    expect(result).toEqual({ ok: true, session: richSession() })
  })

  test('question notée sans note', () => {
    const session = richSession()
    delete session.students[0]!.attempts[0]!.score
    expect(codesOf(session)).toEqual(['score_mismatch'])
  })

  test('ajustement hors bornes', () => {
    const session = richSession()
    session.students[0]!.adjustment = { value: 1e20 }
    expect(codesOf(session)).toEqual(['invalid_adjustment'])
  })

  test('étudiant actif inconnu', () => {
    expect(codesOf({ ...richSession(), activeStudentId: 'inconnu' })).toEqual([
      'unknown_active_student',
    ])
  })

  test('échelle finale hors de la grille du pas', () => {
    const session = richSession()
    session.config.scoring.finalScale = 20.25
    session.config.scoring.rounding.step = 0.5
    const result = checkStoredSession(session, deps)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: 'final_scale_off_grid',
        path: ['session', 'config', 'scoring', 'finalScale'],
      }),
    )
  })

  test.each([{ id: 'x' }, null, 'texte', 42])(
    'valeur illisible %j : ok false sans exception',
    (raw) => {
      const result = checkStoredSession(raw, deps)
      expect(result.ok).toBe(false)
    },
  )

  test('chemins zod préfixés par session', () => {
    const result = checkStoredSession({ id: 'x' }, deps)
    if (result.ok) throw new Error('attendu un échec')
    expect(result.issues.every((issue) => issue.path[0] === 'session')).toBe(true)
  })
})
