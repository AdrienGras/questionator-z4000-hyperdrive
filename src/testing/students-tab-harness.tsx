import type { NormalizedConfig } from '@/domain/config/normalize'
import type { Session, Student } from '@/domain/session/types'
import { putSession } from '@/lib/db/sessions'
import { renderAt } from './render-at'
import { openSidePanel, panelButton } from './side-panel-assertions'
import { screenConfig } from './screen-fixtures'
import { makeSession } from './session-fixtures'

/** Configuration à deux questions par étudiant, sur la catégorie `screenCategory`. */
export const config: NormalizedConfig = screenConfig({ questionsPerStudent: 2 })

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
