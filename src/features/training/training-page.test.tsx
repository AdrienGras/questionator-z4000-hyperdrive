import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { TrainingError } from '@/domain/training/errors'
import type { drawTrainingQuestion as DrawTrainingQuestion } from '@/lib/db/trainings'
import { db } from '@/lib/db/db'
import { createTraining, getTrainingDraws } from '@/lib/db/trainings'
import { makeDraw, makeTraining, makeTrainingConfig } from '@/testing/training-fixtures'
import { renderAt } from '@/testing/render-at'

const failing = vi.hoisted((): { error: Error | undefined } => ({ error: undefined }))

// Fait échouer le tirage à la demande, sans fabriquer de journal incohérent.
vi.mock('@/lib/db/trainings', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/db/trainings')>()
  const drawTrainingQuestion: typeof DrawTrainingQuestion = (...args) =>
    failing.error === undefined
      ? original.drawTrainingQuestion(...args)
      : Promise.reject(failing.error)
  return { ...original, drawTrainingQuestion }
})

beforeEach(async () => {
  failing.error = undefined
  localStorage.clear()
  vi.stubGlobal('CSS', { supports: () => true })
  await db.trainings.clear()
  await db.trainingDraws.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** Config à deux catégories ; la question `a-1` a une réponse de référence, les autres non. */
function configWithAnswer(drawAnimation = true) {
  const config = makeTrainingConfig()
  const [a] = config.categories
  if (a?.questions[0] === undefined) throw new Error('fixture inattendue')
  a.questions[0] = { ...a.questions[0], answer: 'Réponse **A1**' }
  return { ...config, presentation: { ...config.presentation, drawAnimation } }
}

async function seed(options: { drawAnimation?: boolean } = {}) {
  await createTraining(makeTraining({ config: configWithAnswer(options.drawAnimation) }))
}

async function tiles() {
  return screen.findByRole('list', { name: 'Choisissez une catégorie' })
}

async function tile(label: 'A' | 'B') {
  const list = await tiles()
  return within(list).getByRole('button', { name: new RegExp(`^${label}`, 'u') })
}

const question = () => screen.findByRole('region', { name: 'Question en cours' })

/** Dernier tirage du journal ; appelé une fois l'écran à jour, donc l'écriture faite. */
async function lastDraw() {
  return (await getTrainingDraws('training-1')).at(-1)
}

/** Ne tire que `a-1` : seule question de A avec une réponse, on pousse les deux autres en vues. */
async function seedOnlyA1Left() {
  await db.trainingDraws.bulkAdd([
    makeDraw({ questionId: 'a-2', outcome: { kind: 'passed' } }),
    makeDraw({ questionId: 'a-3', outcome: { kind: 'passed' } }),
  ])
}

describe('écran d’entraînement', () => {
  test('chargement puis titre, retour à l’accueil et tuiles', async () => {
    await seed()
    renderAt('/training/training-1')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Entraînement de test' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/')
    expect(within(await tiles()).getAllByRole('button')).toHaveLength(2)
  })

  test('l’en-tête propose les stats et la mise à jour de la config', async () => {
    await seed()
    renderAt('/training/training-1')
    expect(await screen.findByRole('link', { name: 'Voir les stats' })).toHaveAttribute(
      'href',
      '/training/training-1/stats',
    )
    expect(screen.getByRole('link', { name: 'Mettre à jour la config' })).toHaveAttribute(
      'href',
      '/training/training-1/update',
    )
  })

  test('tirer affiche la question, réponse masquée, focus sur son titre', async () => {
    await seed()
    await seedOnlyA1Left()
    renderAt('/training/training-1')

    fireEvent.click(await tile('A'))

    const region = await question()
    const title = within(region).getByRole('heading', { level: 2, name: 'Question A1' })
    await waitFor(() => expect(title).toHaveFocus())
    expect(screen.queryByRole('list', { name: 'Choisissez une catégorie' })).not.toBeInTheDocument()
    expect(within(region).queryByText('A1')).not.toBeInTheDocument()
    expect(within(region).getByRole('button', { name: 'Voir la réponse' })).toBeInTheDocument()
    expect(within(region).getByRole('button', { name: 'Passer' })).toBeInTheDocument()
    expect(within(region).queryByRole('button', { name: /^Noter/u })).not.toBeInTheDocument()
    expect((await lastDraw())?.outcome).toEqual({ kind: 'pending' })
  })

  test('« Voir la réponse » affiche la réponse et le barème ; noter revient aux tuiles', async () => {
    await seed()
    await seedOnlyA1Left()
    renderAt('/training/training-1')
    fireEvent.click(await tile('A'))
    const region = await question()

    fireEvent.click(within(region).getByRole('button', { name: 'Voir la réponse' }))

    const answerTitle = within(region).getByRole('heading', { name: 'Réponse' })
    await waitFor(() => expect(answerTitle).toHaveFocus())
    expect(within(region).getByText('A1')).toBeInTheDocument()
    expect(within(region).getByRole('button', { name: 'Passer' })).toBeInTheDocument()

    fireEvent.click(within(region).getByRole('button', { name: 'Noter 1' }))

    const grid = await tiles()
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 2, name: 'Choisissez une catégorie' }),
      ).toHaveFocus(),
    )
    expect(grid).toBeInTheDocument()
    const draws = await getTrainingDraws('training-1')
    expect(draws.at(-1)?.outcome).toEqual({ kind: 'scored', points: 1, max: 2 })
  })

  test('sans réponse de référence : un texte le dit', async () => {
    await seed()
    renderAt('/training/training-1')
    fireEvent.click(await tile('B'))
    const region = await question()

    fireEvent.click(within(region).getByRole('button', { name: 'Voir la réponse' }))

    expect(
      within(region).getByText('Pas de réponse de référence pour cette question.'),
    ).toBeInTheDocument()
  })

  test('« Passer » avant la révélation : tirage passé, retour aux tuiles', async () => {
    await seed()
    renderAt('/training/training-1')
    fireEvent.click(await tile('B'))
    const region = await question()

    fireEvent.click(within(region).getByRole('button', { name: 'Passer' }))

    await tiles()
    expect((await lastDraw())?.outcome).toEqual({ kind: 'passed' })
  })

  test('une question en attente est affichée au montage, réponse masquée', async () => {
    await seed()
    await db.trainingDraws.add(makeDraw({ questionId: 'a-1' }))
    renderAt('/training/training-1')

    const region = await question()

    expect(
      within(region).getByRole('heading', { level: 2, name: 'Question A1' }),
    ).toBeInTheDocument()
    expect(within(region).queryByText('A1')).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Choisissez une catégorie' })).not.toBeInTheDocument()
  })

  test('double clic rapide sur une tuile : un seul tirage en base, aucune alerte', async () => {
    await seed()
    renderAt('/training/training-1')
    const button = await tile('A')

    fireEvent.click(button)
    fireEvent.click(button)

    await question()
    expect(await getTrainingDraws('training-1')).toHaveLength(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('un refus affiche son message localisé en alerte', async () => {
    await seed()
    renderAt('/training/training-1')
    failing.error = new TrainingError('pending_exists')

    fireEvent.click(await tile('A'))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Une question est déjà en cours : notez-la d’abord.')
    await waitFor(() => expect(alert).toHaveFocus())
  })

  test('un échec inattendu affiche le message générique', async () => {
    await seed()
    renderAt('/training/training-1')
    failing.error = new Error('disque plein')

    fireEvent.click(await tile('A'))

    const alert = await screen.findByRole('alert')
    expect(alert).not.toHaveTextContent('disque plein')
    expect(alert.textContent).not.toBe('')
  })

  test('id absent : écran « introuvable »', async () => {
    renderAt('/training/absent')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Entraînement introuvable' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/')
  })

  test('entraînement endommagé : écran dédié avec ses problèmes', async () => {
    await db.table('trainings').put({ id: 'training-1', name: 'Cassé' })
    renderAt('/training/training-1')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Cet entraînement est endommagé' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toBeInTheDocument()
  })

  test('animation du tirage : présente si activée, absente sinon', async () => {
    await seed({ drawAnimation: false })
    await db.trainingDraws.add(makeDraw())
    const { unmount } = renderAt('/training/training-1')
    expect((await question()).className).not.toMatch(/animate-in/u)
    unmount()

    await db.trainings.clear()
    await seed({ drawAnimation: true })
    renderAt('/training/training-1')
    expect((await question()).className).toMatch(/motion-safe:animate-in/u)
  })
})
