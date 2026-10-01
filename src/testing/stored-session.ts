import type { Session, Student } from '@/domain/session/types'
import { db } from '@/lib/db/db'

/** Session `id` relue en base (fake-indexeddb) ; lève si elle n'y est pas. */
export async function storedSession(id = 'session-1'): Promise<Session> {
  const session = await db.sessions.get(id)
  if (session === undefined) throw new Error(`session ${id} absente`)
  return session
}

/** Étudiant `id` de la session `session-1` relue en base ; lève s'il n'y est pas. */
export async function storedStudent(id = 'student-1'): Promise<Student> {
  const student = (await storedSession()).students.find((s) => s.id === id)
  if (student === undefined) throw new Error(`étudiant ${id} absent`)
  return student
}
