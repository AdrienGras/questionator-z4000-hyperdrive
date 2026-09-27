import 'fake-indexeddb/auto'
import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, type AttemptSpec, makeStudent } from '@/testing/student-fixtures'
import { renderAt } from '@/testing/render-at'
import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
import type { Session, Student } from '@/domain/session/types'

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
  expect(screen.getByLabelText('Étudiant')).toHaveValue('')
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

// --- Tâche 5 : grille de catégories et panneau de la question en cours ---

/** Catégorie `a` à 3 questions avec réponse, barème décimal (§ Review Focus 5). */
const answeredCategory: NormalizedCategory = {
  id: 'a',
  label: 'A',
  scale: [0, 0.5, 1],
  order: 1,
  questions: [
    { id: 'a-1', title: 'Q1', tags: [], prompt: 'Prompt 1', answer: 'Réponse 1' },
    { id: 'a-2', title: 'Q2', tags: [], prompt: 'Prompt 2', answer: 'Réponse 2' },
    { id: 'a-3', title: 'Q3', tags: [], prompt: 'Prompt 3', answer: 'Réponse 3' },
  ],
}

function passageSession(overrides: Partial<Session> = {}): Session {
  const config = makeConfig({ questionsPerStudent: 2 })
  return makeSession({
    config: { ...config, categories: [answeredCategory] },
    students: [makeStudent()],
    activeStudentId: 'student-1',
    ...overrides,
  })
}

/**
 * Bouton de catégorie, retrouvé via son libellé, dans la grille de tirage seule (`QuestionPanel`
 * affiche aussi le libellé de la catégorie, donc une recherche non bornée à la grille matche les
 * deux). `findByRole` (async) : le premier montage passe par le découpage de route à la demande
 * (`autoCodeSplitting`), qui n'est jamais synchrone (`src/testing/setup.ts`).
 */
async function categoryButton(label: string): Promise<HTMLElement> {
  const grid = await screen.findByRole('list', { name: 'Choisir une catégorie' })
  const span = within(grid).getByText(label)
  const button = span.closest('button')
  if (button === null) throw new Error(`bouton de catégorie « ${label} » introuvable`)
  return button
}

async function pendingAttempt() {
  const stored = await db.sessions.get('session-1')
  const attempt = stored?.students.flatMap((s) => s.attempts).find((a) => a.outcome === 'pending')
  if (attempt === undefined) throw new Error('aucun attempt pending en base')
  return attempt
}

test('clic sur une catégorie tire une question et désactive la grille', async () => {
  await putSession(passageSession())
  renderAt('/session/session-1')

  fireEvent.click(await categoryButton('A'))

  await screen.findByText('Éléments de réponse')
  const attempt = await pendingAttempt()
  expect(attempt.categoryId).toBe('a')
  const question = answeredCategory.questions.find((q) => q.id === attempt.questionId)
  if (question === undefined) throw new Error('question introuvable dans la fixture')

  expect(screen.getByRole('heading', { name: question.title })).toBeInTheDocument()
  expect(screen.getByText(question.prompt)).toBeInTheDocument()
  expect(await categoryButton('A')).toBeDisabled()
})

test('les éléments de réponse restent repliés tant que l’examinateur ne les ouvre pas', async () => {
  await putSession(passageSession())
  renderAt('/session/session-1')

  fireEvent.click(await categoryButton('A'))
  await screen.findByText('Éléments de réponse')

  const attempt = await pendingAttempt()
  const question = answeredCategory.questions.find((q) => q.id === attempt.questionId)
  if (question === undefined) throw new Error('question introuvable dans la fixture')
  if (question.answer === undefined) throw new Error('question sans réponse dans la fixture')
  const { answer } = question

  const details = screen.getByText('Éléments de réponse').closest('details')
  expect(details).not.toBeNull()
  expect(details).not.toHaveAttribute('open')
  expect(screen.getByText(answer)).not.toBeVisible()

  fireEvent.click(screen.getByText('Éléments de réponse'))
  expect(details).toHaveAttribute('open')
  expect(screen.getByText(answer)).toBeVisible()
})

test('noter la question ferme le panneau, réactive la grille et un second tirage rouvre un bloc replié', async () => {
  await putSession(passageSession())
  renderAt('/session/session-1')

  fireEvent.click(await categoryButton('A'))
  await screen.findByText('Éléments de réponse')
  fireEvent.click(screen.getByText('Éléments de réponse'))
  fireEvent.click(screen.getByRole('button', { name: 'Noter 1' }))

  await screen.findByText('Score brut : 1')
  expect(await categoryButton('A')).not.toBeDisabled()

  fireEvent.click(await categoryButton('A'))
  await screen.findByText('Éléments de réponse')
  const details = screen.getByText('Éléments de réponse').closest('details')
  expect(details).not.toHaveAttribute('open')
})

test('boutons de note en fr (0, 0,5, 1) ; noter met à jour l’en-tête et réactive la grille', async () => {
  await putSession(passageSession())
  renderAt('/session/session-1')

  fireEvent.click(await categoryButton('A'))
  await screen.findByText('Éléments de réponse')

  expect(screen.getByRole('button', { name: 'Noter 0' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Noter 0,5' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Noter 1' })).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Noter 0,5' }))

  expect(await screen.findByText('Score brut : 0,5')).toBeInTheDocument()
  expect(screen.getByText('Question 2 / 2')).toBeInTheDocument()
  expect(await categoryButton('A')).not.toBeDisabled()
})

test('la note qui atteint questionsPerStudent affiche « Passage terminé »', async () => {
  await putSession(passageSession())
  renderAt('/session/session-1')

  fireEvent.click(await categoryButton('A'))
  await screen.findByText('Éléments de réponse')
  fireEvent.click(screen.getByRole('button', { name: 'Noter 1' }))
  await screen.findByText('Score brut : 1')

  fireEvent.click(await categoryButton('A'))
  await screen.findByText('Éléments de réponse')
  fireEvent.click(screen.getByRole('button', { name: 'Noter 0,5' }))

  expect(await screen.findByRole('heading', { name: 'Passage terminé' })).toBeInTheDocument()
  expect(screen.getByText('Score brut : 1,5')).toBeInTheDocument()
})

test('question sans « answer » n’affiche aucun bloc de réponse', async () => {
  const config = makeConfig({ questionsPerStudent: 1 })
  await putSession(makeSession({ config, activeStudentId: 'student-1' }))
  renderAt('/session/session-1')

  fireEvent.click(await categoryButton('A'))

  expect(await screen.findByRole('heading', { name: 'Question A1' })).toBeInTheDocument()
  expect(screen.queryByText('Éléments de réponse')).not.toBeInTheDocument()
  expect(document.querySelector('details')).not.toBeInTheDocument()
})

test('double-clic sur une catégorie ne crée qu’un seul tirage, sans alerte affichée', async () => {
  await putSession(passageSession())
  renderAt('/session/session-1')

  const button = await categoryButton('A')
  fireEvent.click(button)
  fireEvent.click(button)

  await screen.findByText('Éléments de réponse')
  const stored = await db.sessions.get('session-1')
  expect(stored?.students[0]?.attempts).toHaveLength(1)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('double-clic sur « Noter 1 » ne note qu’une fois, sans alerte affichée', async () => {
  await putSession(passageSession())
  renderAt('/session/session-1')

  fireEvent.click(await categoryButton('A'))
  await screen.findByText('Éléments de réponse')

  const scoreButton = screen.getByRole('button', { name: 'Noter 1' })
  fireEvent.click(scoreButton)
  fireEvent.click(scoreButton)

  await screen.findByText('Score brut : 1')
  const stored = await db.sessions.get('session-1')
  const scored = stored?.students[0]?.attempts.filter((a) => a.outcome === 'scored')
  expect(scored).toHaveLength(1)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('remontage pendant un pending réaffiche la même question, repliée', async () => {
  await putSession(passageSession())
  const view = renderAt('/session/session-1')

  fireEvent.click(await categoryButton('A'))
  await screen.findByText('Éléments de réponse')

  const attempt = await pendingAttempt()
  const question = answeredCategory.questions.find((q) => q.id === attempt.questionId)
  if (question === undefined) throw new Error('question introuvable dans la fixture')

  view.unmount()
  renderAt('/session/session-1')

  expect(await screen.findByRole('heading', { name: question.title })).toBeInTheDocument()
  const details = screen.getByText('Éléments de réponse').closest('details')
  expect(details).not.toHaveAttribute('open')
})

test('changer d’étudiant pendant un pending puis revenir réaffiche la même question', async () => {
  await putSession(passageSession({ students: twoStudents() }))
  renderAt('/session/session-1')

  fireEvent.click(await categoryButton('A'))
  await screen.findByText('Éléments de réponse')

  const attempt = await pendingAttempt()
  const question = answeredCategory.questions.find((q) => q.id === attempt.questionId)
  if (question === undefined) throw new Error('question introuvable dans la fixture')
  await screen.findByRole('heading', { name: question.title })

  const select = screen.getByLabelText('Étudiant')
  fireEvent.change(select, { target: { value: 'student-2' } })
  await screen.findByText('Martin Bob')
  expect(screen.queryByRole('heading', { name: question.title })).not.toBeInTheDocument()

  fireEvent.change(select, { target: { value: 'student-1' } })
  await screen.findByText('Durand Alice')
  expect(await screen.findByRole('heading', { name: question.title })).toBeInTheDocument()
})

test('config minimale (sans couleur ni icône) : le bouton de catégorie s’affiche sans erreur', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  await putSession(makeSession({ config: makeConfig(), activeStudentId: 'student-1' }))
  renderAt('/session/session-1')

  expect(await categoryButton('A')).toBeInTheDocument()
  expect(consoleError).not.toHaveBeenCalled()
  consoleError.mockRestore()
})
