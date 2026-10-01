import 'fake-indexeddb/auto'
import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import type { updateSession as UpdateSession } from '@/lib/db/sessions'
import { db } from '@/lib/db/db'
import { categoryButton } from '@/testing/passage-assertions'
import { openSidePanel } from '@/testing/side-panel-assertions'
import { mountSession } from '@/testing/students-tab-harness'
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
  expect(await within(dialog).findByRole('alert')).toBeInTheDocument()
})
