import { useCallback, useRef, useState } from 'react'
import { setActiveStudent } from '@/domain/passage/active-student'
import { drawQuestion } from '@/domain/passage/draw'
import { cryptoRandomInt } from '@/domain/passage/random'
import { scoreAttempt } from '@/domain/passage/score'
import type { Session } from '@/domain/session/types'
import { updateSession } from '@/lib/db/sessions'

export type PassageActions = {
  draw: (categoryId: string) => Promise<void>
  score: (attemptId: string, value: number) => Promise<void>
  selectStudent: (studentId: string) => Promise<void>
  busy: boolean
  error: Error | null
}

/**
 * Applique les transitions de passage via `updateSession` (F09 tâche 3). Garde `useRef`
 * synchrone en plus de `busy` : un second appel pendant le premier est ignoré avant même de
 * partir en base, un double-clic rapide ne peut donc jamais afficher `pending_exists`.
 */
export function usePassageActions(
  sessionId: string,
  studentId: string | undefined,
): PassageActions {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const inFlight = useRef(false)

  const run = useCallback(
    async (mutator: (session: Session) => Session) => {
      if (inFlight.current) return
      inFlight.current = true
      setBusy(true)
      setError(null)
      try {
        await updateSession(sessionId, mutator)
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)))
      } finally {
        inFlight.current = false
        setBusy(false)
      }
    },
    [sessionId],
  )

  const draw = useCallback(
    async (categoryId: string) => {
      if (studentId === undefined) return
      await run((session) =>
        drawQuestion(
          session,
          { studentId, categoryId },
          {
            random: (n) => cryptoRandomInt(n),
            newId: () => crypto.randomUUID(),
            now: () => new Date(),
          },
        ),
      )
    },
    [run, studentId],
  )

  const score = useCallback(
    async (attemptId: string, value: number) => {
      if (studentId === undefined) return
      await run((session) => scoreAttempt(session, { studentId, attemptId, score: value }))
    },
    [run, studentId],
  )

  const selectStudent = useCallback(
    async (targetStudentId: string) => {
      await run((session) => setActiveStudent(session, targetStudentId))
    },
    [run],
  )

  return { draw, score, selectStudent, busy, error }
}
