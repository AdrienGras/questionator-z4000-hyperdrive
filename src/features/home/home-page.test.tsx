import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { exportWorkbook } from '@/components/export/export-workbook'
import { putSession } from '@/lib/db/sessions'
import { getHealthySession } from '@/testing/healthy-session'
import type { PersistenceStatus } from '@/lib/db/persistence'
import { db, type DbStatus } from '@/lib/db/db'
import { renderAt } from '@/testing/render-at'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { bannerInteractiveNames, expectColorModeToggleLast } from '@/testing/page-shell-assertions'

const dbState = vi.hoisted((): { status: DbStatus } => ({ status: 'open' }))
const persistence = vi.hoisted((): { status: PersistenceStatus | undefined } => ({
  status: 'persisted',
}))
const download = vi.hoisted(() => vi.fn<(fileName: string, text: string) => void>())

vi.mock('@/lib/db/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/db/hooks')>()),
  useDbStatus: () => dbState.status,
}))
vi.mock('@/lib/db/persistence', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/db/persistence')>()),
  usePersistenceStatus: () => persistence.status,
}))
vi.mock('@/lib/download', () => ({ downloadText: download }))
vi.mock('@/components/export/export-workbook')

const ACTIONS = 'Actions pour « Oral de test »'

/** Ouvre le menu de la carte « Oral de test » et choisit l'action. */
async function chooseAction(action: string) {
  fireEvent.click(await screen.findByRole('button', { name: ACTIONS }))
  fireEvent.click(await screen.findByRole('menuitem', { name: action }))
}

async function storedSession() {
  const session = await getHealthySession('session-1')
  if (!session) throw new Error('session-1 absente de la base')
  return session
}

beforeEach(async () => {
  await db.sessions.clear()
  dbState.status = 'open'
  persistence.status = 'persisted'
  download.mockClear()
  vi.mocked(exportWorkbook).mockReset()
})

describe('accueil', () => {
  test('état vide : message seul, actions à gauche', async () => {
    renderAt('/')
    await screen.findByRole('heading', { name: 'Aucune session' })
    const sessions = screen.getByRole('region', { name: 'Sessions' })
    expect(within(sessions).getByRole('heading', { name: 'Aucune session' })).toBeInTheDocument()
    expect(
      within(sessions).getByText('Créez une session ou importez un backup depuis les actions.'),
    ).toBeInTheDocument()
    expect(within(sessions).queryByRole('link')).not.toBeInTheDocument()
    expect(within(sessions).queryByRole('button')).not.toBeInTheDocument()
    const actions = screen.getByRole('region', { name: 'Actions' })
    expect(within(actions).getByRole('link', { name: 'Créer une session' })).toHaveAttribute(
      'href',
      '/new',
    )
    expect(within(actions).getByRole('button', { name: 'Importer un backup' })).toBeEnabled()
  })

  test('barre de titre : plus de création ni d’import, thème en dernier', async () => {
    renderAt('/')
    await screen.findByRole('heading', { name: 'Aucune session' })
    const names = bannerInteractiveNames()
    expect(names).not.toContain('Créer une session')
    expect(names).not.toContain('Importer un backup')
    expectColorModeToggleLast()
  })

  test('deux colonnes : actions avant sessions', async () => {
    renderAt('/')
    const sessions = await screen.findByRole('region', { name: 'Sessions' })
    const actions = screen.getByRole('region', { name: 'Actions' })
    expect(
      actions.compareDocumentPosition(sessions) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(actions.parentElement).toBe(sessions.parentElement)
    expect(actions.parentElement).toHaveClass('lg:grid-cols-[24rem_minmax(0,1fr)]')
  })

  test('liste triée de la plus récente à la plus ancienne, avec jury et avancement', async () => {
    await putSession(
      makeSession({ id: 'old', name: 'Ancienne', updatedAt: '2026-09-25T08:00:00.000Z' }),
    )
    await putSession(
      makeSession({
        id: 'new',
        name: 'Récente',
        updatedAt: '2026-09-25T09:00:00.000Z',
        examiner: 'M. Dupont',
        students: [makeStudent([2])],
      }),
    )
    renderAt('/')
    await screen.findByRole('heading', { name: 'Récente' })
    const names = within(screen.getByRole('region', { name: 'Sessions' }))
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
    expect(names).toEqual(['Récente', 'Ancienne'])
    expect(screen.getByText('Jury : M. Dupont')).toBeInTheDocument()
    expect(screen.getByText('1 passé · 0 absent · 0 restant')).toBeInTheDocument()
  })

  test.each([['persisted'], ['unsupported'], [undefined]] as const)(
    'pas d’indicateur de persistance pour %s',
    async (status) => {
      persistence.status = status
      renderAt('/')
      await screen.findByRole('heading', { name: 'Aucune session' })
      expect(screen.queryByRole('button', { name: 'Stockage non garanti' })).not.toBeInTheDocument()
    },
  )

  test('indicateur de persistance affiché en best-effort', async () => {
    persistence.status = 'best-effort'
    renderAt('/')
    await screen.findByRole('heading', { name: 'Aucune session' })
    expect(screen.getByRole('button', { name: 'Stockage non garanti' })).toBeInTheDocument()
  })

  test('outdated : bandeau de rechargement, ni liste ni import', async () => {
    await putSession(makeSession())
    dbState.status = 'outdated'
    renderAt('/')
    expect(await screen.findByText(/Rechargez la page/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recharger' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Oral de test' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Aucune session' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Importer un backup' })).toBeDisabled()
  })

  test('unavailable : message et pas de création', async () => {
    dbState.status = 'unavailable'
    renderAt('/')
    expect(await screen.findByText(/stockage local est indisponible/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Créer une session' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Importer un backup' })).toBeDisabled()
    expectColorModeToggleLast()
  })

  test('renommer : nom vide refusé, nouveau nom enregistré', async () => {
    await putSession(makeSession())
    renderAt('/')
    await chooseAction('Renommer')
    const field = await screen.findByRole('textbox', { name: 'Nom de la session' })
    expect(field).toHaveValue('Oral de test')
    const save = screen.getByRole('button', { name: 'Enregistrer' })
    fireEvent.change(field, { target: { value: '   ' } })
    expect(save).toBeDisabled()
    fireEvent.change(field, { target: { value: '  Nouveau nom ' } })
    expect(save).toBeEnabled()
    fireEvent.click(save)
    await waitFor(async () => expect((await storedSession()).name).toBe('Nouveau nom'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('examinateur : enregistré, puis retiré quand le champ est vidé', async () => {
    await putSession(makeSession())
    renderAt('/')
    await chooseAction("Modifier l'examinateur")
    fireEvent.change(await screen.findByRole('textbox', { name: "Nom de l'examinateur" }), {
      target: { value: ' Mme Martin ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(async () => expect((await storedSession()).examiner).toBe('Mme Martin'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await chooseAction("Modifier l'examinateur")
    const field = await screen.findByRole('textbox', { name: "Nom de l'examinateur" })
    expect(field).toHaveValue('Mme Martin')
    fireEvent.change(field, { target: { value: '  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(async () => expect('examiner' in (await storedSession())).toBe(false))
  })

  test('supprimer puis annuler : base inchangée', async () => {
    await putSession(makeSession())
    const before = await storedSession()
    renderAt('/')
    await chooseAction('Supprimer')
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(await storedSession()).toEqual(before)
  })

  test('supprimer puis confirmer : session effacée', async () => {
    await putSession(makeSession())
    renderAt('/')
    await chooseAction('Supprimer')
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }))
    await waitFor(async () => expect(await getHealthySession('session-1')).toBeNull())
    expect(await screen.findByRole('heading', { name: 'Aucune session' })).toBeInTheDocument()
  })

  test('« Exporter un backup d’abord » télécharge et laisse le dialogue ouvert', async () => {
    await putSession(makeSession())
    renderAt('/')
    await chooseAction('Supprimer')
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: "Exporter un backup d'abord" }))
    expect(download).toHaveBeenCalledTimes(1)
    expect(download).toHaveBeenCalledWith(
      expect.stringMatching(/^oral-de-test-backup-\d{4}-\d{2}-\d{2}\.json$/),
      expect.stringContaining('"session-1"'),
    )
    expect(
      screen.getByRole('heading', { name: 'Supprimer « Oral de test » ?' }),
    ).toBeInTheDocument()
    expect(await getHealthySession('session-1')).not.toBeNull()
  })

  test('exporter depuis le menu télécharge le backup', async () => {
    await putSession(makeSession())
    renderAt('/')
    await chooseAction('Exporter un backup')
    expect(download).toHaveBeenCalledTimes(1)
  })

  test('« Exporter en Excel » exporte la session dans la langue de l’interface', async () => {
    vi.mocked(exportWorkbook).mockResolvedValue()
    await putSession(makeSession())
    renderAt('/')
    fireEvent.click(await screen.findByRole('button', { name: ACTIONS }))
    const names = (await screen.findAllByRole('menuitem')).map((item) => item.textContent)
    expect(names.indexOf('Exporter en Excel')).toBe(names.indexOf('Exporter un backup') + 1)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Exporter en Excel' }))
    await waitFor(() => expect(exportWorkbook).toHaveBeenCalledTimes(1))
    expect(exportWorkbook).toHaveBeenCalledWith(expect.objectContaining({ id: 'session-1' }), 'fr')
  })

  test('export Excel en échec : alerte sur la carte', async () => {
    vi.mocked(exportWorkbook).mockRejectedValue(new Error('boom'))
    await putSession(makeSession())
    renderAt('/')
    await chooseAction('Exporter en Excel')
    expect(await screen.findByRole('alert')).toHaveTextContent("L'export a échoué. Réessayez.")
  })

  test('item désactivé pendant l’export', async () => {
    vi.mocked(exportWorkbook).mockReturnValue(new Promise<void>(() => undefined))
    await putSession(makeSession())
    renderAt('/')
    await chooseAction('Exporter en Excel')
    fireEvent.click(await screen.findByRole('button', { name: ACTIONS }))
    const busy = await screen.findByRole('menuitem', { name: 'Export en cours…' })
    expect(busy).toHaveAttribute('aria-disabled', 'true')
  })

  test('« Reprendre » mène à la session', async () => {
    await putSession(makeSession())
    renderAt('/')
    expect(await screen.findByRole('link', { name: 'Reprendre' })).toHaveAttribute(
      'href',
      '/session/session-1',
    )
  })

  test('navigateur en anglais : interface en anglais', async () => {
    Object.defineProperty(window.navigator, 'languages', { value: ['en-US'], configurable: true })
    try {
      renderAt('/')
      expect(await screen.findByRole('heading', { name: 'No sessions yet' })).toBeInTheDocument()
    } finally {
      Object.defineProperty(window.navigator, 'languages', { value: ['fr-FR'], configurable: true })
    }
  })
})
