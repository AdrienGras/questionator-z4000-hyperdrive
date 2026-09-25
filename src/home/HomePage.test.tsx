import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { getSession, putSession, type DbStatus, type PersistenceStatus } from '@/db'
import { db } from '@/db/db'
import { renderHome } from '@/test/render-home'
import { makeSession } from '@/test/session-fixtures'
import { makeStudent } from '@/test/student-fixtures'

const dbState = vi.hoisted((): { status: DbStatus } => ({ status: 'open' }))
const persistence = vi.hoisted((): { status: PersistenceStatus | undefined } => ({
  status: 'persisted',
}))
const download = vi.hoisted(() => vi.fn<(fileName: string, text: string) => void>())

vi.mock('@/db', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/db')>()),
  useDbStatus: () => dbState.status,
  usePersistenceStatus: () => persistence.status,
}))
vi.mock('@/backup/download', () => ({ downloadText: download }))

const ACTIONS = 'Actions pour « Oral de test »'

/** Ouvre le menu de la carte « Oral de test » et choisit l'action. */
async function chooseAction(action: string) {
  fireEvent.click(await screen.findByRole('button', { name: ACTIONS }))
  fireEvent.click(await screen.findByRole('menuitem', { name: action }))
}

async function storedSession() {
  const session = await getSession('session-1')
  if (!session) throw new Error('session-1 absente de la base')
  return session
}

beforeEach(async () => {
  await db.sessions.clear()
  dbState.status = 'open'
  persistence.status = 'persisted'
  download.mockClear()
})

describe('accueil', () => {
  test('état vide : message, création, import et config d’exemple', async () => {
    renderHome()
    expect(await screen.findByRole('heading', { name: 'Aucune session' })).toBeInTheDocument()
    const createLinks = screen.getAllByRole('link', { name: 'Créer une session' })
    expect(createLinks.length).toBeGreaterThan(0)
    for (const link of createLinks) expect(link).toHaveAttribute('href', '/new')
    expect(screen.getAllByRole('button', { name: 'Importer un backup' }).length).toBeGreaterThan(0)
    const example = screen.getByRole('link', { name: "Télécharger la config d'exemple" })
    expect(example.getAttribute('href')).toMatch(/config\.example\.json$/)
    expect(example).toHaveAttribute('download')
    const studentsExample = screen.getByRole('link', {
      name: "Télécharger la liste d'étudiants d'exemple",
    })
    expect(studentsExample.getAttribute('href')).toMatch(/students\.example\.csv$/)
    expect(studentsExample).toHaveAttribute('download')
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
    renderHome()
    await screen.findByRole('heading', { name: 'Récente' })
    const names = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(names).toEqual(['Récente', 'Ancienne'])
    expect(screen.getByText('Jury : M. Dupont')).toBeInTheDocument()
    expect(screen.getByText('1 passé · 0 absent · 0 restant')).toBeInTheDocument()
  })

  test.each([['persisted'], ['unsupported'], [undefined]] as const)(
    'pas d’indicateur de persistance pour %s',
    async (status) => {
      persistence.status = status
      renderHome()
      await screen.findByRole('heading', { name: 'Aucune session' })
      expect(screen.queryByRole('button', { name: 'Stockage non garanti' })).not.toBeInTheDocument()
    },
  )

  test('indicateur de persistance affiché en best-effort', async () => {
    persistence.status = 'best-effort'
    renderHome()
    await screen.findByRole('heading', { name: 'Aucune session' })
    expect(screen.getByRole('button', { name: 'Stockage non garanti' })).toBeInTheDocument()
  })

  test('outdated : bandeau de rechargement, ni liste ni import', async () => {
    await putSession(makeSession())
    dbState.status = 'outdated'
    renderHome()
    expect(await screen.findByText(/Rechargez la page/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recharger' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Oral de test' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Aucune session' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Importer un backup' })).toBeDisabled()
  })

  test('unavailable : message et pas de création', async () => {
    dbState.status = 'unavailable'
    renderHome()
    expect(await screen.findByText(/stockage local est indisponible/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Créer une session' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Importer un backup' })).toBeDisabled()
  })

  test('renommer : nom vide refusé, nouveau nom enregistré', async () => {
    await putSession(makeSession())
    renderHome()
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
    renderHome()
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
    renderHome()
    await chooseAction('Supprimer')
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(await storedSession()).toEqual(before)
  })

  test('supprimer puis confirmer : session effacée', async () => {
    await putSession(makeSession())
    renderHome()
    await chooseAction('Supprimer')
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }))
    await waitFor(async () => expect(await getSession('session-1')).toBeNull())
    expect(await screen.findByRole('heading', { name: 'Aucune session' })).toBeInTheDocument()
  })

  test('« Exporter un backup d’abord » télécharge et laisse le dialogue ouvert', async () => {
    await putSession(makeSession())
    renderHome()
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
    expect(await getSession('session-1')).not.toBeNull()
  })

  test('exporter depuis le menu télécharge le backup', async () => {
    await putSession(makeSession())
    renderHome()
    await chooseAction('Exporter un backup')
    expect(download).toHaveBeenCalledTimes(1)
  })

  test('« Reprendre » mène à la session', async () => {
    await putSession(makeSession())
    renderHome()
    expect(await screen.findByRole('link', { name: 'Reprendre' })).toHaveAttribute(
      'href',
      '/session/session-1',
    )
  })

  test('navigateur en anglais : interface en anglais', async () => {
    Object.defineProperty(window.navigator, 'languages', { value: ['en-US'], configurable: true })
    try {
      renderHome()
      expect(await screen.findByRole('heading', { name: 'No sessions yet' })).toBeInTheDocument()
    } finally {
      Object.defineProperty(window.navigator, 'languages', { value: ['fr-FR'], configurable: true })
    }
  })
})
