import { describe, expect, test } from 'vitest'
import { checkSessionRules } from '../backup/rules'
import { SessionSchema } from '../domain/schema'
import { makeConfig } from '../test/student-fixtures'
import { APP_VERSION } from '../app-version'
import { buildSession } from './build-session'

function sequentialIds() {
  let n = 0
  return () => {
    n += 1
    return `id-${n}`
  }
}

const NOW = new Date('2026-09-25T10:00:00.000Z')

function build(overrides: Partial<Parameters<typeof buildSession>[0]> = {}) {
  return buildSession(
    {
      name: '  Oral PHP  ',
      examiner: '  M. Dupont ',
      config: makeConfig(),
      students: [
        { lastName: 'Durand', firstName: 'Alice' },
        { lastName: 'Martin', firstName: 'Bruno' },
      ],
      ...overrides,
    },
    { newId: sequentialIds(), now: () => NOW },
  )
}

describe('buildSession', () => {
  test("session complete, etudiants dans l'ordre du CSV", () => {
    const config = makeConfig()
    expect(build({ config })).toStrictEqual({
      id: 'id-1',
      name: 'Oral PHP',
      examiner: 'M. Dupont',
      createdAt: '2026-09-25T10:00:00.000Z',
      updatedAt: '2026-09-25T10:00:00.000Z',
      appVersion: APP_VERSION,
      config,
      students: [
        {
          id: 'id-2',
          lastName: 'Durand',
          firstName: 'Alice',
          order: 1,
          addedDuringSession: false,
          absent: false,
          attempts: [],
        },
        {
          id: 'id-3',
          lastName: 'Martin',
          firstName: 'Bruno',
          order: 2,
          addedDuringSession: false,
          absent: false,
          attempts: [],
        },
      ],
      activeStudentId: 'id-2',
      projection: { mode: 'waiting' },
    })
  })

  test("config figee = l'objet normalise fourni (meme reference)", () => {
    const config = makeConfig()
    expect(build({ config }).config).toBe(config)
  })

  test('examinateur vide ou blanc : cle absente', () => {
    expect('examiner' in build({ examiner: '   ' })).toBe(false)
  })

  test('valide pour le schema et les regles croisees du backup', () => {
    const session = build()
    expect(SessionSchema.safeParse(session).success).toBe(true)
    expect(checkSessionRules(session)).toEqual([])
  })

  test('sans etudiant : leve', () => {
    expect(() => build({ students: [] })).toThrow('Une session exige au moins un étudiant.')
  })
})
