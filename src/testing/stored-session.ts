import type { Session, Student } from '@/domain/session/types'
import { getHealthySession } from './healthy-session'

/** Session `id` relue en base, validée et saine (F31) ; lève si elle est absente ou endommagée. */
export async function storedSession(id = 'session-1'): Promise<Session> {
  const session = await getHealthySession(id)
  if (session === null) throw new Error(`session ${id} absente de la base`)
  return session
}

/** Étudiant `id` de la session `session-1` relue en base ; lève s'il n'y est pas. */
export async function storedStudent(id = 'student-1'): Promise<Student> {
  const student = (await storedSession()).students.find((s) => s.id === id)
  if (student === undefined) throw new Error(`étudiant ${id} absent`)
  return student
}
