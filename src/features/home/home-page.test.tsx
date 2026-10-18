import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { serializeBackup } from '@/domain/backup/serialize'
import type { PersistenceStatus } from '@/lib/db/persistence'
import { db, type DbStatus } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { createTraining } from '@/lib/db/trainings'
import { formatShortDateTime } from '@/lib/format-date'
import { bannerInteractiveNames } from '@/testing/page-shell-assertions'
import { renderAt } from '@/testing/render-at'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { makeDraw, makeTraining } from '@/testing/training-fixtures'

const dbState = vi.hoisted((): { status: DbStatus } => ({ status: 'open' }))
const persistence = vi.hoisted((): { status: PersistenceStatus | undefined } => ({
  status: 'persisted',
}))

vi.mock('@/lib/db/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/db/hooks')>()),
  useDbStatus: () => dbState.status,
}))
vi.mock('@/lib/db/persistence', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/db/persistence')>()),
  usePersistenceStatus: () => persistence.status,
}))

const at = (day: number) => `2026-10-${String(day).padStart(2, '0')}T09:00:00.000Z`

beforeEach(async () => {
  await db.sessions.clear()
  await db.trainings.clear()
  await db.trainingDraws.clear()
  dbState.status = 'open'
  persistence.status = 'persisted'
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** Une session et un entraînement : l'accueil affiche le tableau de bord. */
async function seedDashboard() {
  await putSession(makeSession({ updatedAt: at(14), students: [makeStudent([2])] }))
  await createTraining(makeTraining({ updatedAt: at(13) }))
  await db.trainingDraws.add(
    makeDraw({ questionId: 'a-1', outcome: { kind: 'scored', points: 1, max: 2 } }),
  )
}

describe('accueil', () => {
  test('en-tête : « Accueil », sous-titre, import, entraînement, création', async () => {
    await seedDashboard()
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Accueil' })).toBeInTheDocument()
    expect(screen.getByText('Reprenez un oral ou préparez le suivant.')).toBeInTheDocument()
    expect(bannerInteractiveNames()).toEqual([
      'Importer une sauvegarde',
      'S’entraîner',
      'Créer une session',
    ])
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('link', { name: 'S’entraîner' })).toHaveAttribute('href', '/training/new')
    expect(main.getByRole('link', { name: 'Créer une session' })).toHaveAttribute('href', '/new')
  })

  test('Reprendre : les trois plus récents, type, date courte, état', async () => {
    await seedDashboard()
    await putSession(makeSession({ id: 'recente', name: 'Oral récent', updatedAt: at(15) }))
    await putSession(makeSession({ id: 'vieille', name: 'Oral ancien', updatedAt: at(1) }))
    renderAt('/')
    const resume = await screen.findByRole('region', { name: 'Reprendre' })
    await within(resume).findByText('de réussite')
    const cards = within(resume).getAllByRole('article')
    expect(
      cards.map((card) => within(card).getByRole('heading', { level: 3 }).textContent),
    ).toEqual(['Oral récent', 'Oral de test', 'Entraînement de test'])
    const session = within(cards[1] ?? resume)
    expect(session.getByText('Session')).toBeInTheDocument()
    expect(session.getByText(formatShortDateTime(at(14), 'fr'))).toBeInTheDocument()
    expect(session.getByText('/ 1 passé')).toBeInTheDocument()
    expect(session.getByRole('link', { name: 'Reprendre « Oral de test »' })).toHaveAttribute(
      'href',
      '/session/session-1',
    )
    const training = within(cards[2] ?? resume)
    expect(training.getByText('Entraînement')).toBeInTheDocument()
    // Mêmes chiffres que la carte de la page Entraînement : couverture en grand, plus de sous-titre.
    expect(training.getByText('questions notées')).toBeInTheDocument()
    expect(training.getByText('/ 4')).toBeInTheDocument()
    expect(training.queryByText('1 / 4 questions notées')).not.toBeInTheDocument()
    expect(training.getByText(/^50\s%$/u)).toBeInTheDocument()
    expect(training.getByRole('link', { name: 'Stats' })).toHaveAttribute(
      'href',
      '/training/training-1/stats',
    )
    expect(within(resume).queryByText('Oral ancien')).not.toBeInTheDocument()
  })

  test('Espaces : compteurs, endommagés compris, et « Voir tout »', async () => {
    await seedDashboard()
    await db.table('sessions').put({ id: 'abime', name: 'Oral abîmé' })
    renderAt('/')
    const spaces = await screen.findByRole('region', { name: 'Espaces' })
    const sessions = await within(spaces).findByRole('link', { name: /Sessions/ })
    expect(sessions).toHaveAttribute('href', '/sessions')
    await waitFor(() => expect(sessions).toHaveTextContent(/^2Sessions/))
    expect(sessions).toHaveTextContent('Voir tout')
    const trainings = within(spaces).getByRole('link', { name: /Entraînements/ })
    expect(trainings).toHaveAttribute('href', '/trainings')
    expect(trainings).toHaveTextContent(/^1Entraînements/)
    const editor = within(spaces).getByRole('link', { name: /Éditeur de config/ })
    expect(editor).toHaveAttribute('href', '/editor')
    expect(editor).toHaveTextContent("Ouvrir l'éditeur")
    expect(within(spaces).getByRole('list')).toHaveClass(
      'grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))]',
    )
  })

  test('seulement des endommagés : pas de section Reprendre', async () => {
    await db.table('sessions').put({ id: 'abime', name: 'Oral abîmé' })
    renderAt('/')
    await screen.findByRole('region', { name: 'Espaces' })
    expect(screen.queryByRole('region', { name: 'Reprendre' })).not.toBeInTheDocument()
  })

  test.each([['persisted'], ['unsupported'], [undefined]] as const)(
    'pas de pastille de stockage en %s',
    async (status) => {
      persistence.status = status
      await seedDashboard()
      renderAt('/')
      await screen.findByRole('region', { name: 'Espaces' })
      expect(screen.queryByRole('button', { name: 'Stockage non garanti' })).not.toBeInTheDocument()
    },
  )

  test('pastille « Stockage non garanti » en best-effort, explication au survol et au focus', async () => {
    persistence.status = 'best-effort'
    await seedDashboard()
    renderAt('/')
    const badge = await screen.findByRole('button', { name: 'Stockage non garanti' })
    fireEvent.focus(badge)
    expect(
      await screen.findByText(/il peut effacer vos sessions s'il manque d'espace/),
    ).toBeInTheDocument()
  })

  test('outdated : bandeau à la place du tableau de bord, import désactivé, création présente', async () => {
    await seedDashboard()
    dbState.status = 'outdated'
    renderAt('/')
    expect(await screen.findByText(/Rechargez la page/)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Reprendre' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Espaces' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Importer une sauvegarde' })).toBeDisabled()
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Créer une session' }),
    ).toBeInTheDocument()
  })

  test('unavailable : bandeau, ni création ni entraînement', async () => {
    dbState.status = 'unavailable'
    renderAt('/')
    expect(await screen.findByText(/stockage local est indisponible/)).toBeInTheDocument()
    const main = within(screen.getByRole('main'))
    expect(main.queryByRole('link', { name: 'Créer une session' })).not.toBeInTheDocument()
    expect(main.queryByRole('link', { name: 'S’entraîner' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Importer une sauvegarde' })).toBeDisabled()
  })

  test('import réussi : l’accueil mène à /sessions, où la carte est visible', async () => {
    vi.stubGlobal('CSS', { supports: () => true })
    await seedDashboard()
    const { router } = renderAt('/')
    await screen.findByRole('region', { name: 'Espaces' })
    const backup = makeSession({ id: 'importee', name: 'Oral importé', updatedAt: at(1) })
    fireEvent.drop(screen.getByRole('main'), {
      dataTransfer: {
        files: [new File([serializeBackup(backup)], 'b.json', { type: 'application/json' })],
        types: ['Files'],
      },
    })
    await waitFor(() => expect(router.state.location.pathname).toBe('/sessions'))
    expect(
      await screen.findByRole('heading', { level: 3, name: 'Oral importé' }),
    ).toBeInTheDocument()
  })

  test('aucune session ni aucun entraînement : premier lancement, ni Reprendre ni Espaces', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Bienvenue' })).toBeInTheDocument()
    const intro = screen.getByRole('region', { name: 'Votre premier oral en trois étapes' })
    expect(within(intro).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.queryByRole('region', { name: 'Reprendre' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Espaces' })).not.toBeInTheDocument()
  })

  test('une session endommagée seule : tableau de bord, pas de premier lancement', async () => {
    await db.table('sessions').put({ id: 'abime', name: 'Oral abîmé' })
    renderAt('/')
    expect(await screen.findByRole('region', { name: 'Espaces' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: 'Bienvenue' })).not.toBeInTheDocument()
  })

  test('premier lancement en best-effort : pastille présente', async () => {
    persistence.status = 'best-effort'
    renderAt('/')
    await screen.findByRole('heading', { level: 1, name: 'Bienvenue' })
    expect(screen.getByRole('button', { name: 'Stockage non garanti' })).toBeInTheDocument()
  })

  test.each([['outdated'], ['unavailable']] as const)(
    '%s sans donnée : bandeau, jamais le premier lancement',
    async (status) => {
      dbState.status = status
      renderAt('/')
      expect(await screen.findByRole('heading', { level: 1, name: 'Accueil' })).toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: 'Votre premier oral en trois étapes' }),
      ).not.toBeInTheDocument()
    },
  )

  test('import fini après avoir quitté l’accueil : pas de renvoi vers /sessions', async () => {
    vi.stubGlobal('CSS', { supports: () => true })
    await seedDashboard()
    const { router } = renderAt('/')
    await screen.findByRole('region', { name: 'Espaces' })
    const backup = makeSession({ id: 'importee', name: 'Oral importé', updatedAt: at(1) })
    fireEvent.drop(screen.getByRole('main'), {
      dataTransfer: {
        files: [new File([serializeBackup(backup)], 'b.json', { type: 'application/json' })],
        types: ['Files'],
      },
    })
    // L'import lit le fichier et charge son validateur de façon asynchrone : on part avant la fin.
    await router.navigate({ to: '/trainings' })
    await waitFor(async () => expect(await db.sessions.get('importee')).toBeDefined())
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(router.state.location.pathname).toBe('/trainings')
  })

  test('navigateur en anglais : interface en anglais', async () => {
    Object.defineProperty(window.navigator, 'languages', { value: ['en-US'], configurable: true })
    try {
      await seedDashboard()
      renderAt('/')
      expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument()
      expect(await screen.findByRole('heading', { level: 2, name: 'Spaces' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Resume “Oral de test”' })).toBeInTheDocument()
    } finally {
      Object.defineProperty(window.navigator, 'languages', { value: ['fr-FR'], configurable: true })
    }
  })
})
