import { describe, expect, it } from 'vitest'
import { checkStoredSession } from '@/domain/backup/stored-session'
import { acceptAllCss, richSession } from './backup-fixtures'
import { makeSession } from './session-fixtures'
import { makeConfig, makeStudent } from './student-fixtures'

const deps = { cssSupports: acceptAllCss }

describe('validité des fixtures de session', () => {
  it('makeSession() passe checkStoredSession', () => {
    expect(checkStoredSession(makeSession(), deps).ok).toBe(true)
  })

  it('richSession() passe checkStoredSession', () => {
    expect(checkStoredSession(richSession(), deps).ok).toBe(true)
  })

  it('un élève à 4 attempts (scored, skipped, scored, pending) passe checkStoredSession', () => {
    const config = makeConfig({ questionsPerStudent: 4 }, undefined, {
      enabled: true,
      maxPerStudent: 1,
      reasons: [],
    })
    const session = makeSession({
      config,
      students: [makeStudent([2, { skipped: 'x' }, 1, 'pending'])],
    })
    expect(checkStoredSession(session, deps).ok).toBe(true)
  })
})
