import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { serializeBackup } from '@/backup'
import { getSession, putSession, type DbStatus, type PersistenceStatus } from '@/db'
import { db } from '@/db/db'
import type { Session } from '@/domain/types'
import { renderHome } from '@/test/render-home'
import { makeSession } from '@/test/session-fixtures'

const dbState = vi.hoisted((): { status: DbStatus } => ({ status: 'open' }))
const persistence = vi.hoisted((): { status: PersistenceStatus | undefined } => ({
  status: 'persisted',
}))

vi.mock('@/db', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/db')>()),
  useDbStatus: () => dbState.status,
  usePersistenceStatus: () => persistence.status,
}))
vi.mock('@/backup/download', () => ({
  downloadText: vi.fn<(fileName: string, text: string) => void>(),
}))

function backupFile(text: string): File {
  return new File([text], 'backup.json', { type: 'application/json' })
}

function sessionFile(session: Session): File {
  return backupFile(serializeBackup(session))
}

/** Monte l'accueil et attend qu'il soit rendu ; renvoie l'input fichier caché. */
async function renderImport(): Promise<HTMLInputElement> {
  const { container } = renderHome()
  await screen.findByRole('heading', { name: 'Questionator Z-4000 Hyperdrive' })
  const input = container.querySelector('input[type=file]')
  if (!(input instanceof HTMLInputElement)) throw new Error('input fichier absent')
  return input
}

function pick(input: HTMLInputElement, file: File) {
  fireEvent.change(input, { target: { files: [file] } })
}

function drop(file: File) {
  fireEvent.drop(screen.getByRole('main'), { dataTransfer: { files: [file], types: ['Files'] } })
}

async function storedSession(id = 'session-1') {
  const session = await getSession(id)
  if (!session) throw new Error(`${id} absente de la base`)
  return session
}

beforeEach(async () => {
  await db.sessions.clear()
  dbState.status = 'open'
  persistence.status = 'persisted'
  vi.stubGlobal('CSS', { supports: () => true })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('import de backup', () => {
  test('fichier invalide : dialogue d’erreur, rien écrit', async () => {
    const input = await renderImport()
    pick(input, backupFile('{ pas du json'))
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByRole('heading', { name: 'Import impossible : backup.json' }),
    ).toBeInTheDocument()
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(1)
    expect(await db.sessions.count()).toBe(0)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fermer' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('format inconnu alors qu’une session existe : session inchangée', async () => {
    await putSession(makeSession({ name: 'Ancienne' }))
    const before = await storedSession()
    const input = await renderImport()
    pick(input, backupFile(JSON.stringify({ format: 'autre', session: { id: 'session-1' } })))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText("Ce fichier n'est pas un backup Questionator.")).toBeVisible()
    expect(await storedSession()).toEqual(before)
    expect(await db.sessions.count()).toBe(1)
  })

  test('backup refusé portant le même id : ni conflit ni écriture', async () => {
    await putSession(makeSession({ name: 'Ancienne' }))
    const before = await storedSession()
    const input = await renderImport()
    pick(input, sessionFile(makeSession({ name: '' })))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getAllByRole('listitem').length).toBeGreaterThan(0)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(await storedSession()).toEqual(before)
  })

  test('chemin de l’issue affiché en code', async () => {
    const input = await renderImport()
    pick(input, sessionFile(makeSession({ name: '' })))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('session.name').tagName).toBe('CODE')
  })

  test('nouvel id : session écrite et carte affichée', async () => {
    const session = makeSession({ id: 'importee', name: 'Importée' })
    const input = await renderImport()
    pick(input, sessionFile(session))
    expect(await screen.findByRole('heading', { name: 'Importée' })).toBeInTheDocument()
    expect(await storedSession('importee')).toEqual(session)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('conflit puis remplacer : la session importée remplace l’existante', async () => {
    await putSession(makeSession({ name: 'Ancienne' }))
    const input = await renderImport()
    pick(input, sessionFile(makeSession({ name: 'Nouvelle' })))
    const dialog = await screen.findByRole('alertdialog')
    expect(
      within(dialog).getByRole('heading', { name: 'Session déjà présente' }),
    ).toBeInTheDocument()
    expect(dialog).toHaveTextContent(/« Ancienne » \(modifiée le .+\).*« Nouvelle »/)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Remplacer' }))
    await waitFor(async () => expect((await storedSession()).name).toBe('Nouvelle'))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  test('conflit puis annuler : session existante inchangée', async () => {
    await putSession(makeSession({ name: 'Ancienne' }))
    const before = await storedSession()
    const input = await renderImport()
    pick(input, sessionFile(makeSession({ name: 'Nouvelle' })))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(await storedSession()).toEqual(before)
  })

  test('fichier illisible : message de lecture, rien écrit', async () => {
    const file = sessionFile(makeSession())
    vi.spyOn(file, 'text').mockRejectedValue(new Error('lecture'))
    const input = await renderImport()
    pick(input, file)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText("Le fichier n'a pas pu être lu.")).toBeVisible()
    expect(await db.sessions.count()).toBe(0)
  })

  test('glisser-déposer : surimpression pendant le survol, puis session écrite', async () => {
    await renderImport()
    fireEvent.dragOver(screen.getByRole('main'), { dataTransfer: { types: ['Files'] } })
    expect(screen.getByText('Déposez le backup ici')).toBeInTheDocument()
    drop(sessionFile(makeSession({ id: 'deposee', name: 'Déposée' })))
    expect(screen.queryByText('Déposez le backup ici')).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Déposée' })).toBeInTheDocument()
    expect((await storedSession('deposee')).name).toBe('Déposée')
  })

  test('désactivé en outdated : import indisponible, dépôt ignoré', async () => {
    dbState.status = 'outdated'
    await renderImport()
    for (const button of screen.queryAllByRole('button', { name: 'Importer un backup' })) {
      expect(button).toBeDisabled()
    }
    fireEvent.dragOver(screen.getByRole('main'), { dataTransfer: { types: ['Files'] } })
    expect(screen.queryByText('Déposez le backup ici')).not.toBeInTheDocument()
    drop(sessionFile(makeSession({ id: 'deposee' })))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(await db.sessions.count()).toBe(0)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('les boutons « Importer un backup » ouvrent le sélecteur de fichier', async () => {
    const input = await renderImport()
    await screen.findByRole('heading', { name: 'Aucune session' })
    const click = vi.spyOn(input, 'click').mockImplementation(() => {})
    const buttons = screen.getAllByRole('button', { name: 'Importer un backup' })
    expect(buttons).toHaveLength(2)
    for (const button of buttons) fireEvent.click(button)
    expect(click).toHaveBeenCalledTimes(2)
  })

  test('l’input est vidé après le choix, pour réimporter le même fichier', async () => {
    const input = await renderImport()
    // jsdom refuse d'affecter une valeur non vide à un input fichier : on espionne l'affectation.
    const assigned: string[] = []
    Object.defineProperty(input, 'value', {
      configurable: true,
      get: () => 'C:\\fakepath\\backup.json',
      set: (value: string) => assigned.push(value),
    })
    pick(input, sessionFile(makeSession()))
    expect(assigned).toContain('')
    await waitFor(async () => expect(await db.sessions.count()).toBe(1))
  })
})
