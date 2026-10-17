import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { exportWorkbook } from '@/components/export/export-workbook'
import { putSession } from '@/lib/db/sessions'
import { getHealthySession } from '@/testing/healthy-session'
import type { PersistenceStatus } from '@/lib/db/persistence'
import { db, type DbStatus } from '@/lib/db/db'
import { renderAt } from '@/testing/render-at'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { bannerInteractiveNames } from '@/testing/page-shell-assertions'
import { storedSession } from '@/testing/stored-session'

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

beforeEach(async () => {
  await db.sessions.clear()
  await db.trainings.clear()
  await db.trainingDraws.clear()
  dbState.status = 'open'
  persistence.status = 'persisted'
  download.mockClear()
  vi.mocked(exportWorkbook).mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

const WRITE_ERROR =
  "L'enregistrement a échoué. La session a peut-être été supprimée dans un autre onglet."

describe('page Sessions', () => {
  test('en-tête : tuile, titre, sous-titre, import puis création', async () => {
    renderAt('/sessions')
    expect(await screen.findByRole('heading', { level: 1, name: 'Sessions' })).toBeInTheDocument()
    expect(
      screen.getByText('Vos oraux, de la liste d’étudiants à la note finale.'),
    ).toBeInTheDocument()
    expect(bannerInteractiveNames()).toEqual(['Importer une sauvegarde', 'Créer une session'])
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Créer une session' }),
    ).toHaveAttribute('href', '/new')
  })

  test('compteur et encart de dépôt', async () => {
    await putSession(makeSession())
    await putSession(makeSession({ id: 'session-2', name: 'Autre oral' }))
    renderAt('/sessions')
    expect(
      await screen.findByText('2 sessions · dernière modification d’abord'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Déposez une sauvegarde (.json) n’importe où sur la page pour la restaurer.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Liste des sessions' })).toHaveClass(
      'sr-only',
    )
  })

  test('grille sur une colonne au téléphone, cartes de 380 px au moins ensuite', async () => {
    await putSession(makeSession())
    renderAt('/sessions')
    await screen.findByRole('heading', { level: 3, name: 'Oral de test' })
    // jsdom ne fait pas de mise en page : on fige la classe qui porte la grille.
    expect(
      within(screen.getByRole('region', { name: 'Liste des sessions' })).getByRole('list'),
    ).toHaveClass('grid-cols-[repeat(auto-fill,minmax(min(100%,380px),1fr))]')
  })

  test('carte : date, jury et progression', async () => {
    await putSession(
      makeSession({
        examiner: 'Mme Laurent',
        students: [makeStudent([2]), makeStudent([], { id: 'student-2', absent: true })],
      }),
    )
    renderAt('/sessions')
    expect(await screen.findByText(/^Modifiée le .+ · Jury : Mme Laurent$/)).toBeInTheDocument()
    expect(screen.getByText('/ 2 passés')).toBeInTheDocument()
    expect(screen.getByText('1 absent · 0 restant')).toBeInTheDocument()
  })

  test('carte endommagée : « Exporter une sauvegarde » visible, hors du menu', async () => {
    await db.table('sessions').put({ id: 'abime', name: 'Oral abîmé', students: 'pas une liste' })
    renderAt('/sessions')
    await screen.findByRole('heading', { level: 3, name: 'Oral abîmé' })
    const card = within(screen.getByRole('region', { name: 'Liste des sessions' })).getByRole(
      'listitem',
    )
    fireEvent.click(within(card).getByRole('button', { name: 'Exporter une sauvegarde' }))
    expect(download).toHaveBeenCalledTimes(1)
    fireEvent.click(within(card).getByRole('button', { name: 'Actions pour « Oral abîmé »' }))
    const items = (await screen.findAllByRole('menuitem')).map((item) => item.textContent)
    expect(items).toEqual(['Exporter une sauvegarde', 'Supprimer'])
  })

  test('unavailable : ni création, ni encart, import désactivé', async () => {
    dbState.status = 'unavailable'
    renderAt('/sessions')
    await screen.findByText(/stockage local est indisponible/)
    expect(screen.queryByRole('link', { name: 'Créer une session' })).not.toBeInTheDocument()
    expect(screen.queryByText(/n’importe où sur la page/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Importer une sauvegarde' })).toBeDisabled()
  })

  test('liste vide : message, encart de dépôt présent', async () => {
    renderAt('/sessions')
    expect(await screen.findByRole('heading', { name: 'Aucune session' })).toBeInTheDocument()
    expect(screen.getByText('Créez une session ou importez une sauvegarde.')).toBeInTheDocument()
    expect(screen.getByText(/n’importe où sur la page/)).toBeInTheDocument()
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
    renderAt('/sessions')
    await screen.findByRole('heading', { name: 'Récente' })
    const names = within(screen.getByRole('region', { name: 'Liste des sessions' }))
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
    expect(names).toEqual(['Récente', 'Ancienne'])
    expect(screen.getByText(/· Jury : M\. Dupont$/)).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', { name: '1 passé · 0 absent · 0 restant' }),
    ).toBeInTheDocument()
  })

  test('outdated : bandeau de rechargement, ni liste ni import', async () => {
    await putSession(makeSession())
    dbState.status = 'outdated'
    renderAt('/sessions')
    expect(await screen.findByText(/Rechargez la page/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recharger' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Oral de test' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Aucune session' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Importer une sauvegarde' })).toBeDisabled()
  })

  test('unavailable : message et pas de création', async () => {
    dbState.status = 'unavailable'
    renderAt('/sessions')
    expect(await screen.findByText(/stockage local est indisponible/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Créer une session' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Importer une sauvegarde' })).toBeDisabled()
  })

  test('renommer : nom vide refusé, nouveau nom enregistré', async () => {
    await putSession(makeSession())
    renderAt('/sessions')
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
    renderAt('/sessions')
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

  test('renommer : écriture en échec, alerte, dialogue ouvert, nom inchangé (#87)', async () => {
    await putSession(makeSession())
    renderAt('/sessions')
    await chooseAction('Renommer')
    const field = await screen.findByRole('textbox', { name: 'Nom de la session' })
    vi.spyOn(db.sessions, 'put').mockRejectedValueOnce(new Error('quota'))
    fireEvent.change(field, { target: { value: 'Nouveau nom' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(WRITE_ERROR)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(field).toHaveValue('Nouveau nom')
    expect((await storedSession()).name).toBe('Oral de test')
  })

  test('examinateur : écriture en échec, alerte, examinateur inchangé (#87)', async () => {
    await putSession(makeSession({ examiner: 'M. Dupont' }))
    renderAt('/sessions')
    await chooseAction("Modifier l'examinateur")
    const field = await screen.findByRole('textbox', { name: "Nom de l'examinateur" })
    vi.spyOn(db.sessions, 'put').mockRejectedValueOnce(new Error('quota'))
    fireEvent.change(field, { target: { value: 'Mme Martin' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(WRITE_ERROR)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect((await storedSession()).examiner).toBe('M. Dupont')
  })

  test('supprimer : écriture en échec, alerte, dialogue ouvert, session gardée (#87)', async () => {
    await putSession(makeSession())
    renderAt('/sessions')
    await chooseAction('Supprimer')
    const dialog = await screen.findByRole('alertdialog')
    vi.spyOn(db.sessions, 'delete').mockRejectedValueOnce(new Error('quota'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(WRITE_ERROR)
    expect(within(dialog).getByRole('button', { name: 'Supprimer' })).toBeEnabled()
    expect(screen.getByRole('alertdialog')).toBe(dialog)
    expect(await getHealthySession('session-1')).not.toBeNull()
  })

  test('renommer : saisie annulée puis dialogue rouvert, champ revenu au nom enregistré (#87)', async () => {
    await putSession(makeSession())
    renderAt('/sessions')
    await chooseAction('Renommer')
    fireEvent.change(await screen.findByRole('textbox', { name: 'Nom de la session' }), {
      target: { value: 'Brouillon abandonné' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await chooseAction('Renommer')
    expect(await screen.findByRole('textbox', { name: 'Nom de la session' })).toHaveValue(
      'Oral de test',
    )
  })

  test('supprimer : alerte d’échec effacée à la réouverture du dialogue (#87)', async () => {
    await putSession(makeSession())
    renderAt('/sessions')
    await chooseAction('Supprimer')
    const dialog = await screen.findByRole('alertdialog')
    vi.spyOn(db.sessions, 'delete').mockRejectedValueOnce(new Error('quota'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }))
    await within(dialog).findByRole('alert')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())

    await chooseAction('Supprimer')
    const reopened = await screen.findByRole('alertdialog')
    expect(within(reopened).queryByRole('alert')).not.toBeInTheDocument()
  })

  test('supprimer puis annuler : base inchangée', async () => {
    await putSession(makeSession())
    const before = await storedSession()
    renderAt('/sessions')
    await chooseAction('Supprimer')
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(await storedSession()).toEqual(before)
  })

  test('supprimer puis confirmer : session effacée', async () => {
    await putSession(makeSession())
    renderAt('/sessions')
    await chooseAction('Supprimer')
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }))
    await waitFor(async () => expect(await getHealthySession('session-1')).toBeNull())
    expect(await screen.findByRole('heading', { name: 'Aucune session' })).toBeInTheDocument()
  })

  test('« Exporter une sauvegarde d’abord » télécharge et laisse le dialogue ouvert', async () => {
    await putSession(makeSession())
    renderAt('/sessions')
    await chooseAction('Supprimer')
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: "Exporter une sauvegarde d'abord" }))
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
    renderAt('/sessions')
    await chooseAction('Exporter une sauvegarde')
    expect(download).toHaveBeenCalledTimes(1)
  })

  test('« Exporter en Excel » exporte la session dans la langue de l’interface', async () => {
    vi.mocked(exportWorkbook).mockResolvedValue()
    await putSession(makeSession())
    renderAt('/sessions')
    fireEvent.click(await screen.findByRole('button', { name: ACTIONS }))
    const names = (await screen.findAllByRole('menuitem')).map((item) => item.textContent)
    expect(names.indexOf('Exporter en Excel')).toBe(names.indexOf('Exporter une sauvegarde') + 1)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Exporter en Excel' }))
    await waitFor(() => expect(exportWorkbook).toHaveBeenCalledTimes(1))
    expect(exportWorkbook).toHaveBeenCalledWith(expect.objectContaining({ id: 'session-1' }), 'fr')
  })

  test('export Excel en échec : alerte sur la carte', async () => {
    vi.mocked(exportWorkbook).mockRejectedValue(new Error('boom'))
    await putSession(makeSession())
    renderAt('/sessions')
    await chooseAction('Exporter en Excel')
    expect(await screen.findByRole('alert')).toHaveTextContent("L'export a échoué. Réessayez.")
  })

  test('item désactivé pendant l’export', async () => {
    vi.mocked(exportWorkbook).mockReturnValue(new Promise<void>(() => undefined))
    await putSession(makeSession())
    renderAt('/sessions')
    await chooseAction('Exporter en Excel')
    fireEvent.click(await screen.findByRole('button', { name: ACTIONS }))
    const busy = await screen.findByRole('menuitem', { name: 'Export en cours…' })
    expect(busy).toHaveAttribute('aria-disabled', 'true')
  })

  test('« Reprendre » mène à la session', async () => {
    await putSession(makeSession())
    renderAt('/sessions')
    expect(await screen.findByRole('link', { name: 'Reprendre « Oral de test »' })).toHaveAttribute(
      'href',
      '/session/session-1',
    )
  })

  test('navigateur en anglais : interface en anglais', async () => {
    Object.defineProperty(window.navigator, 'languages', { value: ['en-US'], configurable: true })
    try {
      renderAt('/sessions')
      expect(await screen.findByRole('heading', { name: 'No sessions yet' })).toBeInTheDocument()
    } finally {
      Object.defineProperty(window.navigator, 'languages', { value: ['fr-FR'], configurable: true })
    }
  })
})
