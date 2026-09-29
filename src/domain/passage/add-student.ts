import type { Session } from '@/domain/session/types'
import { PassageError } from './errors'

/**
 * Ajoute un étudiant en cours de session (F13) : dernier de la liste, `order` = max + 1 (0 si la
 * session est vide), passage vierge. Noms rognés, refusés s'ils sont vides. `activate` le rend
 * étudiant actif ; la projection n'est jamais touchée (D67).
 */
export function addStudent(
  session: Session,
  input: { lastName: string; firstName: string; activate: boolean },
  deps: { newId: () => string },
): Session {
  const lastName = input.lastName.trim()
  const firstName = input.firstName.trim()
  if (lastName === '' || firstName === '') throw new PassageError('student_name_required')

  const order = session.students.reduce((max, s) => Math.max(max, s.order), -1) + 1
  const id = deps.newId()
  const student = {
    id,
    lastName,
    firstName,
    order,
    addedDuringSession: true,
    absent: false,
    attempts: [],
  }

  return {
    ...session,
    students: [...session.students, student],
    ...(input.activate ? { activeStudentId: id } : {}),
  }
}
