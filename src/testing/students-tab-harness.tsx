import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
import type { Session, Student } from '@/domain/session/types'
import { putSession } from '@/lib/db/sessions'
import { renderAt } from './render-at'
import { openSidePanel, panelButton } from './side-panel-assertions'
import { makeSession } from './session-fixtures'
import { makeConfig } from './student-fixtures'

/** Catégorie unique « A » de trois questions, partagée par les tests de l'onglet « Étudiants ». */
export const category: NormalizedCategory = {
  id: 'a',
  label: 'A',
  scale: [0, 1, 2, 3],
  order: 1,
  questions: ['a-1', 'a-2', 'a-3'].map((id) => ({
    id,
    title: `Titre ${id}`,
    tags: [],
    prompt: id,
  })),
}

/** Configuration à deux questions par étudiant, sur la catégorie `category`. */
export const config: NormalizedConfig = {
  ...makeConfig({
    questionsPerStudent: 2,
    maxRawScore: 20,
    finalScale: 20,
    rounding: { mode: 'nearest', decimals: 2, step: 0.5 },
  }),
  categories: [category],
}

/**
 * Enregistre une session (premier étudiant actif par défaut) et monte l'écran d'examen, tiroir
 * latéral fermé.
 */
export async function mountSession(students: Student[], overrides: Partial<Session> = {}) {
  await putSession(
    makeSession({ config, students, activeStudentId: students[0]?.id, ...overrides }),
  )
  renderAt('/session/session-1')
  await panelButton()
}

/**
 * Comme `mountSession`, puis ouvre le tiroir latéral sur l'onglet « Étudiants » ; renvoie le
 * `dialog` du tiroir.
 */
export async function mountStudentsTab(
  students: Student[],
  overrides: Partial<Session> = {},
): Promise<HTMLElement> {
  await mountSession(students, overrides)
  return openSidePanel('Étudiants')
}
