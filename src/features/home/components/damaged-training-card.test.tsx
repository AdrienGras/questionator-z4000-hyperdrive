import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'
import { db } from '@/lib/db/db'
import { createTraining } from '@/lib/db/trainings'
import { renderAt } from '@/testing/render-at'
import { makeTraining } from '@/testing/training-fixtures'

async function putRaw(record: object) {
  await db.table('trainings').put(record)
}

beforeEach(async () => {
  await db.trainings.clear()
  await db.trainingDraws.clear()
})

describe('carte d’entraînement endommagé', () => {
  test('nom brut, pastille, ni reprise ni couverture, seulement « Supprimer »', async () => {
    await putRaw({ id: 'x', name: 'Révisions cassées' })
    renderAt('/')
    const trainings = await screen.findByRole('region', { name: 'Mes entraînements' })
    expect(
      await within(trainings).findByRole('heading', { name: 'Révisions cassées' }),
    ).toBeInTheDocument()
    expect(within(trainings).getByText('Endommagée')).toBeInTheDocument()
    expect(within(trainings).queryByRole('link', { name: 'Reprendre' })).not.toBeInTheDocument()
    expect(within(trainings).queryByText(/des questions vues/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Actions pour « Révisions cassées »' }))
    const items = await screen.findAllByRole('menuitem')
    expect(items.map((item) => item.textContent)).toEqual(['Supprimer'])
  })

  test('sans nom lisible, le titre est l’identifiant', async () => {
    await putRaw({ id: 'x' })
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 3, name: 'x' })).toBeInTheDocument()
  })

  test('« Supprimer » ouvre le dialogue et supprime l’enregistrement', async () => {
    await putRaw({ id: 'x', name: 'Révisions cassées' })
    renderAt('/')
    fireEvent.click(
      await screen.findByRole('button', { name: 'Actions pour « Révisions cassées »' }),
    )
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Supprimer' }))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }))
    await waitFor(async () => expect(await db.trainings.get('x')).toBeUndefined())
  })

  test('la liste affiche une carte saine et une endommagée', async () => {
    await createTraining(makeTraining({ name: 'Révisions saines' }))
    await putRaw({ id: 'x', name: 'Révisions cassées' })
    renderAt('/')
    expect(await screen.findByRole('heading', { name: 'Révisions saines' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Révisions cassées' })).toBeInTheDocument()
    const trainings = screen.getByRole('region', { name: 'Mes entraînements' })
    expect(within(trainings).getAllByRole('link', { name: 'Reprendre' })).toHaveLength(1)
  })
})
