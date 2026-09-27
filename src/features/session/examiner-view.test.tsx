import 'fake-indexeddb/auto'
import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, type AttemptSpec, makeStudent } from '@/testing/student-fixtures'
import { renderAt } from '@/testing/render-at'
import type { NormalizedConfig } from '@/domain/config/normalize'
import type { Student } from '@/domain/session/types'

beforeEach(async () => {
  await db.sessions.clear()
})

function twoStudents(
  aliceAttempts: AttemptSpec[] = [],
  bobAttempts: AttemptSpec[] = [],
): Student[] {
  return [
    makeStudent(aliceAttempts, {
      id: 'student-1',
      lastName: 'Durand',
      firstName: 'Alice',
      order: 1,
    }),
    makeStudent(bobAttempts, { id: 'student-2', lastName: 'Martin', firstName: 'Bob', order: 2 }),
  ]
}

function sessionWith(
  config: NormalizedConfig,
  students: Student[],
  activeStudentId: string | undefined,
) {
  return makeSession({ config, students, activeStudentId })
}

test("en-tête et sélecteur pour l'étudiant actif par défaut", async () => {
  const config = makeConfig({ questionsPerStudent: 3 })
  await putSession(sessionWith(config, twoStudents(), 'student-1'))
  renderAt('/session/session-1')

  expect(await screen.findByRole('heading', { name: config.exam.title })).toBeInTheDocument()
  expect(screen.getByText('Durand Alice')).toBeInTheDocument()
  expect(screen.getByText('Question 1 / 3')).toBeInTheDocument()
  expect(screen.getByText('Score brut : 0')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/')

  const select = screen.getByLabelText('Étudiant')
  const options = within(select).getAllByRole('option')
  expect(options.map((option) => option.textContent)).toEqual([
    'Durand Alice — à passer',
    'Martin Bob — à passer',
  ])

  fireEvent.change(select, { target: { value: 'student-2' } })

  await screen.findByText('Martin Bob')
  const updated = await db.sessions.get('session-1')
  expect(updated?.activeStudentId).toBe('student-2')
})

test('activeStudentId inconnu affiche « Aucun étudiant sélectionné » sans planter', async () => {
  const config = makeConfig({ questionsPerStudent: 3 })
  await putSession(sessionWith(config, twoStudents(), 'inconnu'))
  renderAt('/session/session-1')

  expect(
    await screen.findByRole('heading', { name: 'Aucun étudiant sélectionné' }),
  ).toBeInTheDocument()
  expect(screen.getByLabelText('Étudiant')).toBeInTheDocument()
  expect(screen.queryByText(/^Question /)).not.toBeInTheDocument()
})

test('sans activeStudentId, « Aucun étudiant sélectionné »', async () => {
  const config = makeConfig({ questionsPerStudent: 3 })
  await putSession(sessionWith(config, twoStudents(), undefined))
  renderAt('/session/session-1')

  expect(
    await screen.findByRole('heading', { name: 'Aucun étudiant sélectionné' }),
  ).toBeInTheDocument()
  expect(screen.getByLabelText('Étudiant')).toBeInTheDocument()
  expect(screen.queryByText(/^Question /)).not.toBeInTheDocument()
})

test('étudiant actif absent affiche « Étudiant absent »', async () => {
  const config = makeConfig({ questionsPerStudent: 3 })
  const students = twoStudents()
  const [alice, bob] = students
  if (alice === undefined || bob === undefined) throw new Error('fixture incomplète')
  await putSession(sessionWith(config, [{ ...alice, absent: true }, bob], 'student-1'))
  renderAt('/session/session-1')

  expect(await screen.findByRole('heading', { name: 'Étudiant absent' })).toBeInTheDocument()
})

test('étudiant ayant terminé son passage affiche le score brut', async () => {
  const config = makeConfig({ questionsPerStudent: 3 })
  await putSession(sessionWith(config, twoStudents([1, 1, 0.5]), 'student-1'))
  renderAt('/session/session-1')

  expect(await screen.findByRole('heading', { name: 'Passage terminé' })).toBeInTheDocument()
  expect(screen.getByText('Score brut : 2,5')).toBeInTheDocument()
})
