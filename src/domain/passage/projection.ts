import type { Session } from '@/domain/session/types'
import { requireStudent } from './require-student'

export type Projection = Session['projection']

/**
 * Choisit ce que la fenêtre projetée affiche (F14) : l'attente, ou un étudiant. Même projection :
 * session renvoyée telle quelle (D67). En mode `waiting`, la clé `studentId` n'est pas conservée.
 */
export function setProjection(
  session: Session,
  projection: { mode: 'waiting' } | { mode: 'student'; studentId: string },
): Session {
  if (projection.mode === 'waiting') {
    if (session.projection.mode === 'waiting' && session.projection.studentId === undefined) {
      return session
    }
    return { ...session, projection: { mode: 'waiting' } }
  }
  requireStudent(session, projection.studentId)
  if (
    session.projection.mode === 'student' &&
    session.projection.studentId === projection.studentId
  ) {
    return session
  }
  return { ...session, projection: { mode: 'student', studentId: projection.studentId } }
}
