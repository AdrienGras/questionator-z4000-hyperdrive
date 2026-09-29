import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
import type { Session, Student } from '@/domain/session/types'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { AddStudentDialog } from './components/add-student-dialog'
import { makeUi } from '@/testing/make-ui'
import { renderAt } from '@/testing/render-at'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'

const category: NormalizedCategory = {
  id: 'a',
  label: 'A',
  scale: [0, 1, 2, 3],
  order: 1,
  questions: ['a-1', 'a-2', 'a-3'].map((id) => ({
    id,
    title: `Titre ${id}`,
    tags: [],
    prompt: id,
  })),
}

const config: NormalizedConfig = {
  ...makeConfig({
    questionsPerStudent: 2,
    maxRawScore: 20,
    finalScale: 20,
    rounding: { mode: 'nearest', decimals: 2, step: 0.5 },
  }),
  categories: [category],
}

const alice = makeStudent([], {
  id: 's-a',
  lastName: 'Aba',
  firstName: 'X',
  order: 1,
  attempts: [
    {
      id: 'attempt-1',
      categoryId: 'a',
      questionId: 'a-1',
      drawnAt: '2026-09-25T09:00:00.000Z',
      outcome: 'pending',
    },
  ],
})
const durand = makeStudent([], { id: 's-d', lastName: 'Durand', firstName: 'Élodie', order: 2 })

async function mount(students: Student[] = [alice, durand], overrides: Partial<Session> = {}) {
  await putSession(
    makeSession({ config, students, activeStudentId: students[0]?.id, ...overrides }),
  )
  renderAt('/session/session-1')
  await screen.findByRole('complementary', { name: 'Panneau latéral' })
  fireEvent.click(screen.getByRole('tab', { name: 'Étudiants' }))
}

function openDialog() {
  fireEvent.click(screen.getByRole('button', { name: 'Ajouter un étudiant' }))
}

function fill(lastName: string, firstName: string) {
  fireEvent.change(screen.getByLabelText('Nom'), { target: { value: lastName } })
  fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: firstName } })
}

const addButton = () => screen.getByRole('button', { name: 'Ajouter' })
const startButton = () => screen.getByRole('button', { name: 'Ajouter et faire passer' })

async function stored() {
  const session = await db.sessions.get('session-1')
  if (session === undefined) throw new Error('session absente')
  return session
}

beforeEach(async () => {
  localStorage.clear()
  await db.sessions.clear()
})

test('champs vides ou nom blanc : les deux boutons sont désactivés, sans avertissement', async () => {
  await mount()
  openDialog()

  expect(addButton()).toBeDisabled()
  expect(startButton()).toBeDisabled()

  fill('   ', 'Zoé')
  expect(addButton()).toBeDisabled()
  expect(startButton()).toBeDisabled()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('doublon : avertit avec le nom de l’étudiant existant sans bloquer', async () => {
  await mount()
  openDialog()

  fill(' durand ', 'ÉLODIE')

  expect(screen.getByRole('status')).toHaveTextContent('Durand Élodie est déjà dans la liste.')
  expect(addButton()).toBeEnabled()
  expect(startButton()).toBeEnabled()
})

test('« Ajouter » ajoute en dernier sans changer l’actif, ferme et vide le dialogue', async () => {
  await mount()
  openDialog()
  fill('Martin', 'Zoé')

  fireEvent.click(addButton())

  await waitFor(async () => expect((await stored()).students).toHaveLength(3))
  const session = await stored()
  expect(session.students.at(-1)).toMatchObject({
    lastName: 'Martin',
    firstName: 'Zoé',
    addedDuringSession: true,
  })
  expect(session.activeStudentId).toBe('s-a')
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

  openDialog()
  expect(screen.getByLabelText('Nom')).toHaveValue('')
  expect(screen.getByLabelText('Prénom')).toHaveValue('')
})

test('« Ajouter et faire passer » active le nouvel étudiant sans quitter l’onglet', async () => {
  const projection = { mode: 'student', studentId: 's-a' } as const
  await mount([alice, durand], { projection })
  openDialog()
  fill('Martin', 'Zoé')

  fireEvent.click(startButton())

  expect(await screen.findByRole('list', { name: 'Choisir une catégorie' })).toBeInTheDocument()
  expect(within(screen.getByRole('banner')).getByText('Martin Zoé')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Étudiants' })).toHaveAttribute('aria-selected', 'true')
  expect((await stored()).projection).toEqual(projection)

  fireEvent.click(screen.getByRole('button', { name: /Aba/ }))
  expect(await screen.findByRole('heading', { level: 2, name: 'Titre a-1' })).toBeInTheDocument()
})

test('double clic rapide sur « Ajouter et faire passer » : un seul étudiant ajouté', async () => {
  await mount()
  openDialog()
  fill('Martin', 'Zoé')

  const button = startButton()
  fireEvent.click(button)
  fireEvent.click(button)

  await waitFor(async () => expect((await stored()).students).toHaveLength(3))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect((await stored()).students).toHaveLength(3)
})

test('Entrée dans « Prénom » soumet le formulaire : ajoute sans activer', async () => {
  await mount()
  openDialog()
  fill('Martin', 'Zoé')

  const form = screen.getByLabelText('Prénom').closest('form')
  if (form === null) throw new Error('formulaire absent')
  fireEvent.submit(form)

  await waitFor(async () => expect((await stored()).students).toHaveLength(3))
  expect((await stored()).activeStudentId).toBe('s-a')
})

test('Échap après saisie puis réouverture : champs vides', async () => {
  await mount()
  openDialog()
  fill('Martin', 'Zoé')

  fireEvent.keyDown(screen.getByLabelText('Nom'), { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

  openDialog()
  expect(screen.getByLabelText('Nom')).toHaveValue('')
  expect(screen.getByLabelText('Prénom')).toHaveValue('')
})

test('le déclencheur « Ajouter un étudiant » n’est pas désactivé pendant une écriture', async () => {
  await mount()

  expect(screen.getByRole('button', { name: 'Ajouter un étudiant' })).toBeEnabled()
})

test('échec de l’ajout : le dialogue reste ouvert, champs gardés, erreur visible dedans', async () => {
  const onAdd = vi.fn<() => Promise<boolean>>().mockResolvedValue(false)
  render(
    <AddStudentDialog
      ui={makeUi()}
      session={makeSession({ config, students: [alice, durand] })}
      disabled={false}
      error="Écriture impossible."
      onAdd={onAdd}
    />,
  )
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  openDialog()
  fill('Martin', 'Zoé')
  fireEvent.click(addButton())

  await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1))
  const dialog = screen.getByRole('dialog')
  expect(within(dialog).getByRole('alert')).toHaveTextContent('Écriture impossible.')
  expect(screen.getByLabelText('Nom')).toHaveValue('Martin')
  expect(screen.getByLabelText('Prénom')).toHaveValue('Zoé')
})
