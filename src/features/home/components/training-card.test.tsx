import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'
import { db } from '@/lib/db/db'
import { createTraining } from '@/lib/db/trainings'
import { renderAt } from '@/testing/render-at'
import { makeDraw, makeTraining } from '@/testing/training-fixtures'

beforeEach(async () => {
  await db.trainings.clear()
  await db.trainingDraws.clear()
})

/** Carte de l'entraînement `name` dans la section « Mes entraînements ». */
async function findCard(name: string): Promise<HTMLElement> {
  const heading = await screen.findByRole('heading', { level: 3, name })
  const item = heading.closest('li')
  if (item === null) throw new Error('carte introuvable')
  return item
}

describe('carte d’entraînement', () => {
  test('nom, dernière activité, couverture et lien « Reprendre »', async () => {
    await createTraining(makeTraining({ name: 'Révisions JS' }))
    // 1 question notée sur 4 : 25 %. Le tirage passé et le tirage en cours ne comptent pas.
    await db.trainingDraws.bulkAdd([
      makeDraw({ questionId: 'a-1', outcome: { kind: 'scored', points: 1, max: 2 } }),
      makeDraw({ questionId: 'a-2', outcome: { kind: 'passed' } }),
      makeDraw({ questionId: 'b-1', outcome: { kind: 'pending' } }),
    ])
    renderAt('/')
    const card = await findCard('Révisions JS')
    expect(await within(card).findByText('25 % des questions notées')).toBeInTheDocument()
    expect(within(card).getByText(/^Dernière activité : /)).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: 'Reprendre' })).toHaveAttribute(
      'href',
      '/training/training-1',
    )
  })

  test('sans tirage : 0 % des questions notées', async () => {
    await createTraining(makeTraining())
    renderAt('/')
    const card = await findCard('Entraînement de test')
    expect(await within(card).findByText('0 % des questions notées')).toBeInTheDocument()
  })

  test('suppression confirmée : entraînement et journal supprimés', async () => {
    await createTraining(makeTraining())
    await db.trainingDraws.add(makeDraw())
    await createTraining(makeTraining({ id: 'autre', name: 'Autre' }))
    await db.trainingDraws.add(makeDraw({ trainingId: 'autre' }))
    renderAt('/')
    fireEvent.click(
      await screen.findByRole('button', { name: 'Actions pour « Entraînement de test »' }),
    )
    const items = await screen.findAllByRole('menuitem')
    expect(items.map((item) => item.textContent)).toEqual(['Supprimer'])
    fireEvent.click(screen.getByRole('menuitem', { name: 'Supprimer' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(
      within(dialog).getByRole('heading', { name: 'Supprimer « Entraînement de test » ?' }),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText('L’historique et les stats de cet entraînement seront perdus.'),
    ).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }))
    await waitFor(async () => expect(await db.trainings.get('training-1')).toBeUndefined())
    expect(await db.trainingDraws.where('trainingId').equals('training-1').count()).toBe(0)
    expect(await db.trainingDraws.where('trainingId').equals('autre').count()).toBe(1)
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.getByRole('heading', { level: 3, name: 'Autre' })).toBeInTheDocument()
  })
})
