import { useCallback, useRef, useState } from 'react'
import { cryptoRandomInt } from '@/domain/passage/random'
import type { TrainingDraw } from '@/domain/training/types'
import { drawTrainingQuestion, passTrainingDraw, scoreTrainingDraw } from '@/lib/db/trainings'

export type TrainingActions = {
  draw: (categoryId: string) => Promise<void>
  score: (drawId: number, points: number) => Promise<void>
  pass: (drawId: number) => Promise<void>
  busy: boolean
  error: Error | null
}

/**
 * Avancement du journal : +1 par tirage, +1 par résolution (note ou passage). Chaque écriture de
 * l'écran l'avance donc d'exactement un cran, ce que le nombre de tirages seul ne voit pas pour
 * une note ou un passage.
 */
export function journalStepOf(draws: readonly TrainingDraw[]): number {
  const resolved = draws.filter((draw) => draw.outcome.kind !== 'pending').length
  return draws.length + resolved
}

const clock = { now: () => new Date() }

/**
 * Écritures de l'écran d'entraînement. Garde `useRef` synchrone : un second appel pendant le
 * premier est ignoré avant de partir en base (un double clic ne tire qu'une question).
 *
 * `busy` reste vrai après l'écriture tant que `journalStep` (dérivé du `useLiveQuery` de
 * l'appelant, `journalStepOf`) n'a pas rattrapé le cran attendu : sans ça, un clic dans cette
 * fenêtre agirait sur un journal périmé et afficherait une erreur fantôme (`pending_exists`,
 * `not_pending`), comme pour `usePassageActions`. L'erreur reste affichée jusqu'à l'action suivante.
 */
export function useTrainingActions(
  trainingId: string,
  journalStep: number | undefined,
): TrainingActions {
  const [busyState, setBusyState] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [expectedStep, setExpectedStep] = useState<number | undefined>(undefined)
  const inFlight = useRef(false)
  // Le cran attendu part du journal vu par l'utilisateur au moment de l'appel.
  const run = useCallback(
    async (write: () => Promise<unknown>) => {
      if (inFlight.current) return
      inFlight.current = true
      setBusyState(true)
      setError(null)
      const before = journalStep ?? 0
      try {
        await write()
        setExpectedStep(before + 1)
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)))
      } finally {
        inFlight.current = false
        setBusyState(false)
      }
    },
    [journalStep],
  )

  const draw = useCallback(
    (categoryId: string) =>
      run(() =>
        drawTrainingQuestion(trainingId, categoryId, {
          random: (n) => cryptoRandomInt(n),
          ...clock,
        }),
      ),
    [run, trainingId],
  )

  const score = useCallback(
    (drawId: number, points: number) =>
      run(() => scoreTrainingDraw(trainingId, drawId, points, clock)),
    [run, trainingId],
  )

  const pass = useCallback(
    (drawId: number) => run(() => passTrainingDraw(trainingId, drawId, clock)),
    [run, trainingId],
  )

  const lagging = expectedStep !== undefined && (journalStep ?? -1) < expectedStep
  return { draw, score, pass, busy: busyState || lagging, error }
}
