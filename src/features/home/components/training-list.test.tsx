import 'fake-indexeddb/auto'
import { screen, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { db } from '@/lib/db/db'
import { createTraining } from '@/lib/db/trainings'
import { renderAt } from '@/testing/render-at'
import { makeTraining } from '@/testing/training-fixtures'

beforeEach(async () => {
  await db.trainings.clear()
  await db.trainingDraws.clear()
})

test('entraînements triés par dernière activité, le plus récent d’abord', async () => {
  await createTraining(
    makeTraining({ id: 'old', name: 'Ancien', updatedAt: '2026-10-01T09:00:00.000Z' }),
  )
  await createTraining(
    makeTraining({ id: 'new', name: 'Récent', updatedAt: '2026-10-04T09:00:00.000Z' }),
  )
  renderAt('/')
  const trainings = await screen.findByRole('region', { name: 'Mes entraînements' })
  await within(trainings).findByRole('heading', { level: 3, name: 'Récent' })
  const names = within(trainings)
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent)
  expect(names).toEqual(['Récent', 'Ancien'])
})
