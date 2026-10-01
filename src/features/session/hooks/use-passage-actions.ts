import { useCallback, useRef, useState } from 'react'
import { goToNextStudent, setActiveStudent } from '@/domain/passage/active-student'
import { setAdjustment } from '@/domain/passage/adjust'
import { addStudent as addStudentTransition } from '@/domain/passage/add-student'
import { setAbsent as setAbsentTransition } from '@/domain/passage/absent'
import { setComment as setCommentTransition } from '@/domain/passage/comment'
import { drawQuestion } from '@/domain/passage/draw'
import { cryptoRandomInt } from '@/domain/passage/random'
import { editScore as editScoreTransition } from '@/domain/passage/edit-score'
import { setProjection, type ProjectionRequest } from '@/domain/passage/projection'
import { resetStudent } from '@/domain/passage/reset'
import { revealFinal as revealFinalTransition } from '@/domain/passage/reveal'
import { scoreAttempt } from '@/domain/passage/score'
import { skipAttempt } from '@/domain/passage/skip'
import type { Session } from '@/domain/session/types'
import { updateSession } from '@/lib/db/sessions'

/**
 * Issue d'une écriture : `ignored` quand le verrou l'a écartée (une autre écriture en vol), rien
 * n'est parti en base et ce n'est pas un échec à afficher.
 */
export type WriteOutcome = 'written' | 'failed' | 'ignored'

/**
 * Actions de l'écran de passage. Un échec renseigne `error` (alerte de la page et du tiroir), sauf
 * pour `adjust`, `revealFinal`, `reset` et `addStudent`, et `setAbsent` appelé avec `ownError` :
 * passés en `ownError`, ils laissent l'affichage de l'échec à l'appelant (leur dialogue, qui
 * affiche `write_error` quand le booléen revient à `false`) et `error` reste à `null`.
 * `setComment` ne touche jamais `error` : son champ annonce lui-même l'échec (D67).
 */
export type PassageActions = {
  draw: (categoryId: string) => Promise<void>
  score: (attemptId: string, value: number) => Promise<void>
  skip: (attemptId: string, reason: string | undefined) => Promise<void>
  selectStudent: (studentId: string) => Promise<boolean>
  adjust: (
    value: number,
    reason: string | undefined,
    options: { reveal: boolean },
  ) => Promise<boolean>
  revealFinal: () => Promise<boolean>
  reset: () => Promise<boolean>
  editScore: (attemptId: string, score: number) => Promise<void>
  setComment: (studentId: string, comment: string) => Promise<boolean>
  setAbsent: (
    studentId: string,
    absent: boolean,
    options?: { ownError?: boolean },
  ) => Promise<boolean>
  addStudent: (
    names: { lastName: string; firstName: string },
    options: { activate: boolean },
  ) => Promise<WriteOutcome>
  project: (projection: ProjectionRequest) => Promise<boolean>
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

  const attempt = useCallback(
    async (
      mutator: (session: Session) => Session,
      options: { ownError?: boolean } = {},
    ): Promise<WriteOutcome> => {
      if (inFlight.current) return 'ignored'
      inFlight.current = true
      setBusyState(true)
      setError(null)
      try {
        const written = await updateSession(sessionId, mutator)
        setLastWritten(written.updatedAt)
        return 'written'
      } catch (e) {
        // `ownError` : l'appelant affiche lui-même l'échec (dialogue), pas d'alerte de page en double.
        if (options.ownError !== true) setError(e instanceof Error ? e : new Error(String(e)))
        return 'failed'
      } finally {
        inFlight.current = false
        setBusyState(false)
      }
    },
    [sessionId],
  )

  // Booléen de succès : un appel écarté par le verrou se confond avec un échec (voir `attempt`).
  const run = useCallback(
    async (mutator: (session: Session) => Session, options: { ownError?: boolean } = {}) =>
      (await attempt(mutator, options)) === 'written',
    [attempt],
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

  // Le booléen de succès permet à la vue de fermer le tiroir latéral seulement si le changement
  // d'étudiant a été écrit (F21).
  const selectStudent = useCallback(
    (targetStudentId: string) => run((session) => setActiveStudent(session, targetStudentId)),
    [run],
  )

  // Enregistrer en fin de passage = ajustement + révélation dans UNE écriture (D66).
  const adjust = useCallback(
    (value: number, reason: string | undefined, options: { reveal: boolean }) => {
      if (studentId === undefined) return Promise.resolve(false)
      return run(
        (session) => {
          const adjusted = setAdjustment(session, { studentId, value, reason })
          if (!options.reveal) return adjusted
          return revealFinalTransition(adjusted, { studentId }, { now: () => new Date() })
        },
        { ownError: true },
      )
    },
    [run, studentId],
  )

  const revealFinal = useCallback(() => {
    if (studentId === undefined) return Promise.resolve(false)
    return run(
      (session) => revealFinalTransition(session, { studentId }, { now: () => new Date() }),
      { ownError: true },
    )
  }, [run, studentId])

  const reset = useCallback(() => {
    if (studentId === undefined) return Promise.resolve(false)
    return run((session) => resetStudent(session, studentId), { ownError: true })
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
  // Hors de `run` : un commentaire ne touche ni aux attempts ni à l'étudiant actif, il n'a donc rien
  // à craindre d'une action en vol ; passer par le verrou le ferait refuser en silence pendant un
  // tirage (valeur perdue), et `busy`/`error` gêneraient la vue sans raison (D67).
  const setComment = useCallback(
    (targetStudentId: string, comment: string) =>
      updateSession(sessionId, (session) =>
        setCommentTransition(session, { studentId: targetStudentId, comment }),
      ).then(
        () => true,
        () => false,
      ),
    [sessionId],
  )

  // L'étudiant est explicite : le dialogue d'absence le capture à l'ouverture, un changement
  // d'étudiant actif pendant qu'il est ouvert ne détourne donc pas la déclaration (D67).
  // `ownError` : seul le dialogue de confirmation affiche son propre échec ; cocher/décocher sans
  // dialogue garde l'alerte de page (D82).
  const setAbsent = useCallback(
    (targetStudentId: string, absent: boolean, options: { ownError?: boolean } = {}) =>
      run(
        (session) => setAbsentTransition(session, { studentId: targetStudentId, absent }),
        options,
      ),
    [run],
  )

  // Même projection : `setProjection` renvoie la même session, rien n'est écrit (D67).
  const project = useCallback(
    (projection: ProjectionRequest) => run((session) => setProjection(session, projection)),
    [run],
  )

  // `ownError` : le dialogue d'ajout affiche son propre échec ; sans ça, l'alerte du tiroir et celle
  // de la page s'y ajoutaient, derrière le modal.
  // L'issue complète : le dialogue ne montre `write_error` que sur un vrai échec, pas sur un appel
  // écarté par le verrou.
  const addStudent = useCallback(
    (names: { lastName: string; firstName: string }, options: { activate: boolean }) =>
      attempt(
        (session) =>
          addStudentTransition(
            session,
            { ...names, ...options },
            { newId: () => crypto.randomUUID() },
          ),
        { ownError: true },
      ),
    [attempt],
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
    addStudent,
    project,
    next,
    busy,
    error,
  }
}
