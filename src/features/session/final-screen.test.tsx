import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { Student } from '@/domain/session/types'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { categoryButton, outsidePanel } from '@/testing/passage-assertions'
import { renderAt } from '@/testing/render-at'
import { REVEALED, screenCategory } from '@/testing/screen-fixtures'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'

function config(questionsPerStudent = 1) {
  return {
    ...makeConfig({
      questionsPerStudent,
      maxRawScore: 20,
      finalScale: 20,
      rounding: { mode: 'nearest', decimals: 2, step: 0.5 },
    }),
    categories: [screenCategory],
  }
}

beforeEach(async () => {
  await db.sessions.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function openFinal(
  student: Student,
  questionsPerStudent = 1,
  others: Student[] = [],
): Promise<void> {
  await putSession(
    makeSession({
      config: config(questionsPerStudent),
      students: [student, ...others],
      activeStudentId: student.id,
      projection: { mode: 'student', studentId: student.id },
    }),
  )
  renderAt('/session/session-1')
  await screen.findByRole('heading', { name: 'Passage terminé' })
}

function done(overrides: Partial<Student> = {}): Student {
  return makeStudent([13.5], { finalRevealedAt: REVEALED, ...overrides })
}

function bob(attempts: Parameters<typeof makeStudent>[0] = [], overrides: Partial<Student> = {}) {
  return makeStudent(attempts, {
    id: 'student-2',
    lastName: 'Martin',
    firstName: 'Bob',
    order: 2,
    ...overrides,
  })
}

function row(label: string): HTMLElement {
  const parent = outsidePanel(label).parentElement
  if (parent === null) throw new Error(`ligne « ${label} » introuvable`)
  return parent
}

async function stored() {
  const session = await db.sessions.get('session-1')
  if (session === undefined) throw new Error('session absente')
  return session
}

test('affiche les cinq notes formatées et la justification de l’ajustement', async () => {
  await openFinal(done({ adjustment: { value: 1, reason: 'Bonne tenue' } }))

  expect(row('Note brute')).toHaveTextContent('13,5')
  expect(row('Note plafonnée')).toHaveTextContent('13,5')
  expect(row('Note convertie')).toHaveTextContent('13,5')
  expect(row('Ajustement')).toHaveTextContent('+1,0')
  expect(row('Ajustement')).toHaveTextContent('Bonne tenue')
  expect(row('Note finale')).toHaveTextContent('14,5 / 20')
})

test('ajustement négatif avec le signe moins typographique', async () => {
  await openFinal(done({ adjustment: { value: -0.5 } }))

  expect(row('Ajustement')).toHaveTextContent('−0,5')
  expect(row('Note finale')).toHaveTextContent('13,0 / 20')
})

test('« aucun » sans ajustement', async () => {
  await openFinal(done())

  expect(row('Ajustement')).toHaveTextContent('aucun')
})

test('finale bornée à l’échelle : 20 + 1 donne 20,0 / 20', async () => {
  await openFinal(makeStudent([20], { finalRevealedAt: REVEALED, adjustment: { value: 1 } }))

  expect(row('Note finale')).toHaveTextContent('20,0 / 20')
})

test('détail du passage : rangs des questions notées, passée sans rang', async () => {
  await openFinal(
    makeStudent([2, { skipped: 'Hors programme' }, 3], { finalRevealedAt: REVEALED }),
    2,
  )

  // Le tiroir (Sheet) peut contenir ses propres listes : on ne garde que celles hors du tiroir.
  const lists = screen
    .getAllByRole('list')
    .filter((list) => list.closest('[data-slot="sheet-content"]') === null)
  const [detail] = lists
  if (lists.length !== 1 || detail === undefined) {
    throw new Error(`${lists.length} listes hors panneau, une seule attendue`)
  }
  const items = within(detail).getAllByRole('listitem')
  expect(items).toHaveLength(3)
  expect(items[0]).toHaveTextContent(/^1\.\s*ATitre a-12 \/ 20$/)
  expect(items[1]).toHaveTextContent(/^ATitre a-2Passée — Hors programme$/)
  expect(items[2]).toHaveTextContent(/^2\.\s*ATitre a-33 \/ 20$/)
})

test('réinitialiser : confirmation, attempts vidés, commentaire conservé, grille de retour', async () => {
  await openFinal(done({ comment: 'À revoir' }))

  fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser l’étudiant' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Réinitialiser Durand Alice ?' })
  expect(dialog).toHaveTextContent(
    'Les questions tirées, les notes et l’ajustement seront supprimés. Le commentaire est conservé.',
  )
  fireEvent.click(within(dialog).getByRole('button', { name: 'Réinitialiser' }))

  expect(await categoryButton('A')).toBeInTheDocument()
  const student = (await stored()).students[0]
  expect(student?.attempts).toEqual([])
  expect(student?.comment).toBe('À revoir')
})

test('réinitialisation en échec : dialogue ouvert avec le message d’erreur, attempts intacts', async () => {
  await openFinal(done())
  fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser l’étudiant' }))
  const dialog = await screen.findByRole('alertdialog')
  vi.spyOn(db.sessions, 'put').mockRejectedValueOnce(new Error('disque plein'))

  fireEvent.click(within(dialog).getByRole('button', { name: 'Réinitialiser' }))

  expect(await within(dialog).findByRole('alert')).toHaveTextContent("L'enregistrement a échoué")
  // Une seule alerte : celle du dialogue, pas celle de la page (D82).
  expect(screen.getAllByRole('alert', { hidden: true })).toHaveLength(1)
  expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  expect((await stored()).students[0]?.attempts).toHaveLength(1)
})

test('annuler la réinitialisation n’écrit rien', async () => {
  await openFinal(done())
  const before = await stored()

  fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser l’étudiant' }))
  const dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }))

  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  expect(await stored()).toEqual(before)
})

test('« Étudiant suivant » change l’étudiant actif et remet la projection en attente (D73)', async () => {
  await openFinal(done(), 1, [bob()])

  fireEvent.click(screen.getByRole('button', { name: 'Étudiant suivant' }))

  expect(await screen.findByText('Martin Bob')).toBeInTheDocument()
  const session = await stored()
  expect(session.activeStudentId).toBe('student-2')
  expect(session.projection).toEqual({ mode: 'waiting' })
})

test('dernier étudiant restant : bouton désactivé et mention visible', async () => {
  await openFinal(done(), 1, [bob([], { absent: true })])

  expect(screen.getByRole('button', { name: 'Étudiant suivant' })).toBeDisabled()
  expect(screen.getByText('Tous les étudiants sont passés')).toBeVisible()
})

test('le bouton « Ajuster » est rendu', async () => {
  await openFinal(done())

  expect(screen.getByRole('button', { name: 'Ajuster' })).toBeEnabled()
})
