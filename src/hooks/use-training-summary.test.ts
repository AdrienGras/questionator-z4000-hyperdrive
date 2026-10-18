import 'fake-indexeddb/auto'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { db } from '@/lib/db/db'
import { createTraining } from '@/lib/db/trainings'
import { makeDraw, makeTraining } from '@/testing/training-fixtures'
import { useTrainingSummary } from './use-training-summary'

beforeEach(async () => {
  await db.trainings.clear()
  await db.trainingDraws.clear()
})

test('undefined avant la lecture du journal, puis taux et couverture', async () => {
  const training = makeTraining()
  await createTraining(training)
  await db.trainingDraws.add(
    makeDraw({
      trainingId: training.id,
      questionId: 'a-1',
      outcome: { kind: 'scored', points: 2, max: 4 },
    }),
  )
  const { result } = renderHook(() => useTrainingSummary(training))
  expect(result.current).toBeUndefined()
  await waitFor(() =>
    expect(result.current).toEqual({ rate: 0.5, coverage: { covered: 1, total: 4 } }),
  )
})
