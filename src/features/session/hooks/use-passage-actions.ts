import { useCallback, useRef, useState } from 'react'
import { goToNextStudent, setActiveStudent } from '@/domain/passage/active-student'
import { setAdjustment } from '@/domain/passage/adjust'
import { setAbsent as setAbsentTransition } from '@/domain/passage/absent'
import { setComment as setCommentTransition } from '@/domain/passage/comment'
import { drawQuestion } from '@/domain/passage/draw'
import { cryptoRandomInt } from '@/domain/passage/random'
import { editScore as editScoreTransition } from '@/domain/passage/edit-score'
import { resetStudent } from '@/domain/passage/reset'
import { revealFinal as revealFinalTransition } from '@/domain/passage/reveal'
import { scoreAttempt } from '@/domain/passage/score'
import { skipAttempt } from '@/domain/passage/skip'
import type { Session } from '@/domain/session/types'
import { updateSession } from '@/lib/db/sessions'

export type PassageActions = {
  draw: (categoryId: string) => Promise<void>
  score: (attemptId: string, value: number) => Promise<void>
  skip: (attemptId: string, reason: string | undefined) => Promise<void>
  selectStudent: (studentId: string) => Promise<void>
  adjust: (
    value: number,
    reason: string | undefined,
    options: { reveal: boolean },
  ) => Promise<boolean>
  revealFinal: () => Promise<boolean>
  reset: () => Promise<boolean>
  editScore: (attemptId: string, score: number) => Promise<void>
  setComment: (studentId: string, comment: string) => Promise<boolean>
  setAbsent: (absent: boolean) => Promise<boolean>
  next: () => Promise<void>
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
    async (mutator: (session: Session) => Session): Promise<boolean> => {
      if (inFlight.current) return false
      inFlight.current = true
      setBusyState(true)
      setError(null)
      try {
        const written = await updateSession(sessionId, mutator)
        setLastWritten(written.updatedAt)
        return true
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)))
        return false
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

  const skip = useCallback(
    async (attemptId: string, reason: string | undefined) => {
      if (studentId === undefined) return
      await run((session) => skipAttempt(session, { studentId, attemptId, reason }))
    },
    [run, studentId],
  )

  const selectStudent = useCallback(
    async (targetStudentId: string) => {
      await run((session) => setActiveStudent(session, targetStudentId))
    },
    [run],
  )

  // Enregistrer en fin de passage = ajustement + révélation dans UNE écriture (D66).
  const adjust = useCallback(
    (value: number, reason: string | undefined, options: { reveal: boolean }) => {
      if (studentId === undefined) return Promise.resolve(false)
      return run((session) => {
        const adjusted = setAdjustment(session, { studentId, value, reason })
        if (!options.reveal) return adjusted
        return revealFinalTransition(adjusted, { studentId }, { now: () => new Date() })
      })
    },
    [run, studentId],
  )

  const revealFinal = useCallback(() => {
    if (studentId === undefined) return Promise.resolve(false)
    return run((session) =>
      revealFinalTransition(session, { studentId }, { now: () => new Date() }),
    )
  }, [run, studentId])

  const reset = useCallback(() => {
    if (studentId === undefined) return Promise.resolve(false)
    return run((session) => resetStudent(session, studentId))
  }, [run, studentId])

  const next = useCallback(async () => {
    if (studentId === undefined) return
    await run((session) => goToNextStudent(session, studentId))
  }, [run, studentId])

  const editScore = useCallback(
    async (attemptId: string, value: number) => {
      if (studentId === undefined) return
      await run((session) =>
        editScoreTransition(
          session,
          { studentId, attemptId, score: value },
          { now: () => new Date() },
        ),
      )
    },
    [run, studentId],
  )

  // L'étudiant est explicite : la sauvegarde différée peut partir après un changement d'étudiant.
  const setComment = useCallback(
    (targetStudentId: string, comment: string) =>
      run((session) => setCommentTransition(session, { studentId: targetStudentId, comment })),
    [run],
  )

  const setAbsent = useCallback(
    (absent: boolean) => {
      if (studentId === undefined) return Promise.resolve(false)
      return run((session) => setAbsentTransition(session, { studentId, absent }))
    },
    [run, studentId],
  )

  const busy = busyState || (lastWritten !== undefined && sessionUpdatedAt < lastWritten)

  return {
    draw,
    score,
    skip,
    selectStudent,
    adjust,
    revealFinal,
    reset,
    editScore,
    setComment,
    setAbsent,
    next,
    busy,
    error,
  }
}
