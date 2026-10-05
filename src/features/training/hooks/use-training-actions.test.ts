import 'fake-indexeddb/auto'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { TrainingError } from '@/domain/training/errors'
import { db } from '@/lib/db/db'
import { createTraining, getTrainingDraws } from '@/lib/db/trainings'
import { makeDraw, makeTraining } from '@/testing/training-fixtures'
import { journalStepOf, useTrainingActions } from './use-training-actions'

beforeEach(async () => {
  vi.stubGlobal('CSS', { supports: () => true })
  await db.trainings.clear()
  await db.trainingDraws.clear()
  await createTraining(makeTraining())
})

async function journalStep(): Promise<number> {
  return journalStepOf(await getTrainingDraws('training-1'))
}

function mount(initialStep: number | undefined) {
  return renderHook(
    ({ step }: { step: number | undefined }) => useTrainingActions('training-1', step),
    {
      initialProps: { step: initialStep },
    },
  )
}

describe('journalStepOf', () => {
  test('avance d’un cran à chaque tirage et à chaque résolution', () => {
    expect(journalStepOf([])).toBe(0)
    expect(journalStepOf([makeDraw()])).toBe(1)
    expect(journalStepOf([makeDraw({ outcome: { kind: 'passed' } })])).toBe(2)
    expect(
      journalStepOf([makeDraw({ outcome: { kind: 'scored', points: 1, max: 2 } }), makeDraw()]),
    ).toBe(3)
  })
})

describe('useTrainingActions', () => {
  test('draw inscrit un tirage en cours ; busy reste vrai tant que le journal n’a pas rattrapé', async () => {
    const { result, rerender } = mount(0)

    await act(async () => {
      await result.current.draw('a')
    })

    expect(result.current.error).toBeNull()
    expect(result.current.busy).toBe(true)
    const draws = await getTrainingDraws('training-1')
    expect(draws).toHaveLength(1)
    expect(draws[0]?.outcome).toEqual({ kind: 'pending' })

    rerender({ step: await journalStep() })
    expect(result.current.busy).toBe(false)
  })

  test('score note le tirage en cours avec le maximum du barème', async () => {
    await db.trainingDraws.add(makeDraw())
    const [pending] = await getTrainingDraws('training-1')
    const { result, rerender } = mount(await journalStep())

    await act(async () => {
      await result.current.score(pending?.id ?? -1, 1)
    })

    const [scored] = await getTrainingDraws('training-1')
    expect(scored?.outcome).toEqual({ kind: 'scored', points: 1, max: 2 })
    expect(result.current.busy).toBe(true)
    rerender({ step: await journalStep() })
    expect(result.current.busy).toBe(false)
  })

  test('pass passe le tirage en cours', async () => {
    await db.trainingDraws.add(makeDraw())
    const [pending] = await getTrainingDraws('training-1')
    const { result } = mount(await journalStep())

    await act(async () => {
      await result.current.pass(pending?.id ?? -1)
    })

    const [passed] = await getTrainingDraws('training-1')
    expect(passed?.outcome).toEqual({ kind: 'passed' })
  })

  test('un second appel pendant le premier est ignoré : un seul tirage en base, aucune erreur', async () => {
    const { result } = mount(0)

    await act(async () => {
      await Promise.all([result.current.draw('a'), result.current.draw('a')])
    })

    expect(result.current.error).toBeNull()
    expect(await getTrainingDraws('training-1')).toHaveLength(1)
  })

  test('un refus est conservé jusqu’à l’action suivante, qui l’efface', async () => {
    const { result, rerender } = mount(0)

    await act(async () => {
      await result.current.draw('inconnue')
    })

    expect(result.current.error).toBeInstanceOf(TrainingError)
    expect(result.current.error).toMatchObject({ code: 'category_not_found' })
    expect(result.current.busy).toBe(false)

    rerender({ step: 0 })
    expect(result.current.error).toBeInstanceOf(TrainingError)

    await act(async () => {
      await result.current.draw('a')
    })
    expect(result.current.error).toBeNull()
  })

  test('busy reste vrai tant que le journal n’est pas encore chargé après une écriture', async () => {
    const { result, rerender } = mount(0)
    await act(async () => {
      await result.current.draw('a')
    })
    rerender({ step: undefined })
    expect(result.current.busy).toBe(true)
  })
})
