import type { CssSupports } from '../config/rules'
import { normalize } from '../config/normalize'
import type { Session } from '../domain/types'
import { minimalConfig } from './config-fixtures'
import { makeSession } from './session-fixtures'
import { makeStudent } from './student-fixtures'

/** Accepte toute valeur CSS ; pour les tests qui n'exercent pas les règles CSS (D15). */
export const acceptAllCss: CssSupports = () => true

/**
 * `minimalConfig` avec la catégorie 'a' étendue à 3 questions : `richSession` tire 3 attempts
 * via `makeStudent`, qui dérive `questionId` de l'index (`a-1`, `a-2`, `a-3`).
 */
function richConfig() {
  const config = minimalConfig()
  const [category] = config.categories
  return normalize({
    ...config,
    categories: [
      {
        ...category!,
        questions: [
          { id: 'a-1', prompt: 'Question A1' },
          { id: 'a-2', prompt: 'Question A2' },
          { id: 'a-3', prompt: 'Question A3' },
        ],
      },
    ],
  })
}

/** Session avec tous les champs optionnels renseignés ; réutilisée par les tests de backup. */
export function richSession(): Session {
  return makeSession({
    config: richConfig(),
    examiner: 'M. Dupont',
    activeStudentId: 'student-1',
    projection: { mode: 'student', studentId: 'student-1' },
    students: [
      makeStudent([2, { skipped: 'Déjà vue' }, 'pending'], {
        adjustment: { value: -0.5, reason: 'Hors sujet' },
        comment: 'Bien',
        finalRevealedAt: '2026-09-25T10:00:00.000Z',
      }),
      makeStudent([], { id: 'student-2', order: 2, absent: true }),
    ],
  })
}
