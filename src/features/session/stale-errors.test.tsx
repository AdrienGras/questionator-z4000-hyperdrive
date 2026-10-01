import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import type { updateSession as UpdateSession } from '@/lib/db/sessions'
import { db } from '@/lib/db/db'
import { categoryButton } from '@/testing/passage-assertions'
import { openSidePanel } from '@/testing/side-panel-assertions'
import { mountSession } from '@/testing/students-tab-harness'
import { REVEALED } from '@/testing/screen-fixtures'
import { storedSession } from '@/testing/stored-session'
import { makeStudent } from '@/testing/student-fixtures'

const failing = vi.hoisted(() => ({ on: false }))

// Fait échouer les écritures à la demande : aucune session invalide à fabriquer pour provoquer une erreur.
vi.mock('@/lib/db/sessions', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/db/sessions')>()
  const updateSession: typeof UpdateSession = (...args) =>
    failing.on ? Promise.reject(new Error('écriture refusée')) : original.updateSession(...args)
  return { ...original, updateSession }
})

const alice = makeStudent([], { id: 's-a', lastName: 'Aba', firstName: 'X', order: 1 })
const bob = makeStudent([], { id: 's-b', lastName: 'Bob', firstName: 'Y', order: 2 })

beforeEach(async () => {
  failing.on = false
  localStorage.clear()
  await db.sessions.clear()
})

/** Tirage refusé tiroir fermé : l'écriture échoue, l'alerte de la page s'affiche. */
async function failDrawWhileClosed() {
  await mountSession([alice, bob])
  const button = await categoryButton('A')
  failing.on = true
  fireEvent.click(button)
  await screen.findByRole('alert')
  failing.on = false
}

test('tiroir : une erreur survenue tiroir fermé n’y réapparaît pas à l’ouverture', async () => {
  await failDrawWhileClosed()

  const dialog = await openSidePanel()

  expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument()
})

test('tiroir : une erreur survenue tiroir ouvert est affichée', async () => {
  await mountSession([alice, bob])
  const dialog = await openSidePanel('Étudiants')
  failing.on = true

  fireEvent.click(within(dialog).getByRole('button', { name: /Bob/u }))

  expect(await within(dialog).findByRole('alert')).toBeInTheDocument()
})

test('dialogue d’ajout : une erreur antérieure n’y apparaît pas à l’ouverture', async () => {
  await failDrawWhileClosed()
  await openSidePanel('Étudiants')

  fireEvent.click(screen.getByRole('button', { name: 'Ajouter un étudiant' }))

  const dialog = screen.getByRole('dialog', { name: 'Ajouter un étudiant' })
  expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument()
})

test('dialogue d’ajout : un échec d’ajout dans le dialogue est affiché', async () => {
  await mountSession([alice, bob])
  await openSidePanel('Étudiants')
  fireEvent.click(screen.getByRole('button', { name: 'Ajouter un étudiant' }))
  failing.on = true
  fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Martin' } })
  fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Zoé' } })

  fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }))

  const dialog = screen.getByRole('dialog', { name: 'Ajouter un étudiant' })
  const alert = await within(dialog).findByRole('alert')
  // Une seule alerte : celle du dialogue, ni celle du tiroir derrière, ni celle de la page.
  expect(screen.getAllByRole('alert', { hidden: true }).map((a) => a.textContent)).toEqual([
    "L'enregistrement a échoué. La session a peut-être été supprimée dans un autre onglet.",
  ])
  expect(alert).toBeInTheDocument()
})

/**
 * Écriture qui relance le rendu de l'écran avec la même erreur d'action : l'étudiant actif est
 * renommé, et on attend son nouveau nom à l'écran (la barre de titre, même sous le modal) pour
 * savoir que le rendu a eu lieu.
 */
async function rerenderScreen() {
  const stored = await storedSession()
  await db.sessions.put({
    ...stored,
    updatedAt: new Date().toISOString(),
    students: stored.students.map((s) => (s.id === alice.id ? { ...s, lastName: 'Aba-bis' } : s)),
  })
  expect(await screen.findAllByText(/Aba-bis/)).not.toHaveLength(0)
}

test('tiroir : l’erreur périmée ne réapparaît pas après un nouveau rendu de l’écran', async () => {
  await failDrawWhileClosed()
  const dialog = await openSidePanel()
  expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument()

  await rerenderScreen()

  expect(within(screen.getByRole('dialog')).queryByRole('alert')).not.toBeInTheDocument()
})

test('dialogue d’ajout : l’erreur périmée ne réapparaît pas après un nouveau rendu de l’écran', async () => {
  await failDrawWhileClosed()
  await openSidePanel('Étudiants')
  fireEvent.click(screen.getByRole('button', { name: 'Ajouter un étudiant' }))
  const dialog = screen.getByRole('dialog', { name: 'Ajouter un étudiant' })
  expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument()

  await rerenderScreen()

  expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument()
})

test('« Étudiant suivant » sans suivant : l’erreur ne s’affiche pas à l’ouverture du tiroir', async () => {
  const done = makeStudent([2, 1], {
    id: 's-a',
    lastName: 'Aba',
    firstName: 'X',
    order: 1,
    finalRevealedAt: REVEALED,
  })
  await mountSession([done, bob])
  const next = await screen.findByRole('button', { name: 'Étudiant suivant' })
  const stored = await storedSession()
  const removal = db.sessions.put({
    ...stored,
    students: stored.students.filter((s) => s.id !== bob.id),
  })
  fireEvent.click(next)
  await removal
  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())

  const dialog = await openSidePanel()

  expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument()
})
