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
 * Applique les transitions de passage via `updateSession` (spec F09 §7). Garde `useRef`
 * synchrone en plus de `busy` : un second appel pendant le premier est ignoré avant même de
 * partir en base, un double-clic rapide ne peut donc jamais afficher `pending_exists`.
 *
 * `busy` reste vrai après la résolution de l'écriture tant que `sessionUpdatedAt` (dérivé du
 * `useLiveQuery` de l'appelant) n'a pas rattrapé l'horodatage renvoyé par `updateSession` :
 * sans ça, un clic dans cette fenêtre agirait sur la session encore périmée et afficherait une
 * erreur fantôme (`pending_exists` / `not_pending`, Review Focus 1).
 */
export function usePassageActions(
  sessionId: string,
  studentId: string | undefined,
  sessionUpdatedAt: string,
): PassageActions {
  const [busyState, setBusyState] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastWritten, setLastWritten] = useState<string | undefined>(undefined)
  const inFlight = useRef(false)

  const run = useCallback(
    async (mutator: (session: Session) => Session) => {
      if (inFlight.current) return
      inFlight.current = true
      setBusyState(true)
      setError(null)
      try {
        const written = await updateSession(sessionId, mutator)
        setLastWritten(written.updatedAt)
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)))
      } finally {
        inFlight.current = false
        setBusyState(false)
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

  const busy = busyState || (lastWritten !== undefined && sessionUpdatedAt < lastWritten)

  return { draw, score, selectStudent, busy, error }
}
