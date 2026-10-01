import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import type { Session, Student } from '@/domain/session/types'
import { db } from '@/lib/db/db'
import { AddStudentDialog } from './components/add-student-dialog'
import { makeUi } from '@/testing/make-ui'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { expectPanelStaysOpen, openSidePanel } from '@/testing/side-panel-assertions'
import { config, mountStudentsTab } from '@/testing/students-tab-harness'

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
  await mountStudentsTab(students, overrides)
}

function openDialog() {
  fireEvent.click(screen.getByRole('button', { name: 'Ajouter un étudiant' }))
}

function fill(lastName: string, firstName: string) {
  fireEvent.change(screen.getByLabelText('Nom'), { target: { value: lastName } })
  fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: firstName } })
}

const addDialog = () => screen.queryByRole('dialog', { name: 'Ajouter un étudiant' })
const drawer = () => screen.queryByRole('dialog', { name: 'Panneau latéral' })
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
  await waitFor(() => expect(addDialog()).not.toBeInTheDocument())

  openDialog()
  expect(screen.getByLabelText('Nom')).toHaveValue('')
  expect(screen.getByLabelText('Prénom')).toHaveValue('')
})

test('« Ajouter » laisse le tiroir ouvert', async () => {
  await mount()
  openDialog()
  fill('Martin', 'Zoé')

  fireEvent.click(addButton())

  await waitFor(() => expect(addDialog()).not.toBeInTheDocument())
  expect((await stored()).students).toHaveLength(3)
  await expectPanelStaysOpen()
  expect(
    within(screen.getByRole('list', { name: 'Étudiants de la session' })).getByText(/Martin Zoé/),
  ).toBeInTheDocument()
})

test('« Ajouter et faire passer » ferme le tiroir', async () => {
  await mount()
  openDialog()
  fill('Martin', 'Zoé')

  fireEvent.click(startButton())

  await waitFor(() => expect(drawer()).not.toBeInTheDocument())
  await waitFor(() => expect(addDialog()).not.toBeInTheDocument())
  expect((await stored()).students).toHaveLength(3)
})

test('« Ajouter et faire passer » active le nouvel étudiant, remet la projection en attente (D73), onglet gardé', async () => {
  const projection = { mode: 'student', studentId: 's-a' } as const
  await mount([alice, durand], { projection })
  openDialog()
  fill('Martin', 'Zoé')

  fireEvent.click(startButton())

  expect(await screen.findByRole('list', { name: 'Choisir une catégorie' })).toBeInTheDocument()
  expect(within(screen.getByRole('banner')).getByText('Martin Zoé')).toBeInTheDocument()
  expect((await stored()).projection).toEqual({ mode: 'waiting' })

  const reopened = await openSidePanel()
  expect(within(reopened).getByRole('tab', { name: 'Étudiants' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  fireEvent.click(within(reopened).getByRole('button', { name: /Aba/ }))
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
  await waitFor(() => expect(addDialog()).not.toBeInTheDocument())
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
  await waitFor(() => expect(addDialog()).not.toBeInTheDocument())

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
  const dialogFor = (error?: { message: string }) => (
    <AddStudentDialog
      ui={makeUi()}
      session={makeSession({ config, students: [alice, durand] })}
      disabled={false}
      error={error}
      onAdd={onAdd}
    />
  )
  const { rerender } = render(dialogFor())
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  openDialog()
  fill('Martin', 'Zoé')
  fireEvent.click(addButton())
  await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1))
  // L'erreur arrive du hook d'actions une fois l'écriture refusée, dialogue ouvert.
  rerender(dialogFor({ message: 'Écriture impossible.' }))

  const dialog = screen.getByRole('dialog')
  expect(within(dialog).getByRole('alert')).toHaveTextContent('Écriture impossible.')
  expect(screen.getByLabelText('Nom')).toHaveValue('Martin')
  expect(screen.getByLabelText('Prénom')).toHaveValue('Zoé')
})

test('une erreur déjà présente à l’ouverture du dialogue n’y est pas affichée', () => {
  render(
    <AddStudentDialog
      ui={makeUi()}
      session={makeSession({ config, students: [alice, durand] })}
      disabled={false}
      error={{ message: 'Ancienne erreur.' }}
      onAdd={vi.fn<() => Promise<boolean>>()}
    />,
  )

  openDialog()

  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
