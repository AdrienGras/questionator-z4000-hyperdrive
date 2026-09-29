import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { categoryButton, outsidePanel } from '@/testing/passage-assertions'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, type AttemptSpec, makeStudent } from '@/testing/student-fixtures'
import { renderAt } from '@/testing/render-at'
import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
import type { Session, Student } from '@/domain/session/types'

beforeEach(async () => {
  await db.sessions.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
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

/** Ouvre l'onglet « Étudiants » du panneau latéral et renvoie le bouton de l'étudiant. */
function studentButton(name: string): HTMLElement {
  const panel = screen.getByRole('complementary', { name: 'Panneau latéral' })
  fireEvent.click(within(panel).getByRole('tab', { name: 'Étudiants' }))
  const button = within(screen.getByRole('list', { name: 'Étudiants de la session' }))
    .getAllByRole('button')
    .find((b) => b.textContent.includes(name))
  if (button === undefined) throw new Error(`bouton ${name} introuvable`)
  return button
}

function sessionWith(
  config: NormalizedConfig,
  students: Student[],
  activeStudentId: string | undefined,
) {
  return makeSession({ config, students, activeStudentId })
}

test("en-tête, liste des étudiants et changement d'étudiant actif", async () => {
  const config = makeConfig({ questionsPerStudent: 3 })
  await putSession(sessionWith(config, twoStudents(), 'student-1'))
  renderAt('/session/session-1')

  expect(await screen.findByRole('heading', { name: config.exam.title })).toBeInTheDocument()
  expect(screen.getByText('Durand Alice')).toBeInTheDocument()
  expect(screen.getByText('Question 1 / 3')).toBeInTheDocument()
  expect(screen.getByText('Score brut : 0')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/')

  expect(screen.queryByRole('combobox', { name: 'Étudiant' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('tab', { name: 'Étudiants' }))
  const rows = within(screen.getByRole('list', { name: 'Étudiants de la session' })).getAllByRole(
    'button',
  )
  expect(rows).toHaveLength(2)
  expect(rows[0]).toHaveTextContent('Durand Alice')
  expect(rows[0]).toHaveTextContent('à passer')
  expect(rows[0]).toHaveAttribute('aria-current', 'true')
  expect(rows[1]).toHaveTextContent('Martin Bob')

  fireEvent.click(studentButton('Martin Bob'))

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
  expect(screen.queryByRole('combobox', { name: 'Étudiant' })).not.toBeInTheDocument()
  studentButton('Durand Alice')
  for (const button of within(
    screen.getByRole('list', { name: 'Étudiants de la session' }),
  ).getAllByRole('button')) {
    expect(button).not.toHaveAttribute('aria-current')
  }
  expect(screen.queryByText(/^Question /)).not.toBeInTheDocument()
})

test('sans activeStudentId, « Aucun étudiant sélectionné »', async () => {
  const config = makeConfig({ questionsPerStudent: 3 })
  await putSession(sessionWith(config, twoStudents(), undefined))
  renderAt('/session/session-1')

  expect(
    await screen.findByRole('heading', { name: 'Aucun étudiant sélectionné' }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('combobox', { name: 'Étudiant' })).not.toBeInTheDocument()
  studentButton('Durand Alice')
  for (const button of within(
    screen.getByRole('list', { name: 'Étudiants de la session' }),
  ).getAllByRole('button')) {
    expect(button).not.toHaveAttribute('aria-current')
  }
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

test('étudiant ayant terminé son passage affiche l’écran final', async () => {
  const config = makeConfig({ questionsPerStudent: 3 })
  const [alice, bob] = twoStudents([1, 1, 0.5])
  if (alice === undefined || bob === undefined) throw new Error('fixture incomplète')
  // Note déjà révélée : sinon la popup de fin de passage s'ouvre par-dessus l'écran (D66).
  const revealed = { ...alice, finalRevealedAt: '2026-09-25T10:00:00.000Z' }
  await putSession(sessionWith(config, [revealed, bob], 'student-1'))
  renderAt('/session/session-1')

  expect(await screen.findByRole('heading', { name: 'Passage terminé' })).toBeInTheDocument()
  expect(outsidePanel('Note brute').parentElement).toHaveTextContent('2,5')
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

  // La popup de fin de passage s'ouvre d'abord (D66) ; l'annuler révèle l'écran final.
  const dialog = await screen.findByRole('dialog', { name: 'Ajuster la note' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

  expect(await screen.findByRole('heading', { name: 'Passage terminé' })).toBeInTheDocument()
  expect(outsidePanel('Note brute').parentElement).toHaveTextContent('1,5')
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

  fireEvent.click(studentButton('Martin Bob'))
  await waitFor(() =>
    expect(screen.queryByRole('heading', { name: question.title })).not.toBeInTheDocument(),
  )

  fireEvent.click(studentButton('Durand Alice'))
  expect(await screen.findByRole('heading', { name: question.title })).toBeInTheDocument()
})

test('config minimale (sans couleur ni icône) : le bouton de catégorie s’affiche sans erreur', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  await putSession(makeSession({ config: makeConfig(), activeStudentId: 'student-1' }))
  renderAt('/session/session-1')

  expect(await categoryButton('A')).toBeInTheDocument()
  expect(consoleError).not.toHaveBeenCalled()
})

test('key={attempt.id} : changer d’étudiant vers un autre pending referme le bloc réponse (D28)', async () => {
  const config = makeConfig({ questionsPerStudent: 2 })
  const students: Student[] = [
    makeStudent([], {
      id: 'student-1',
      lastName: 'Durand',
      firstName: 'Alice',
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
    }),
    makeStudent([], {
      id: 'student-2',
      lastName: 'Martin',
      firstName: 'Bob',
      order: 2,
      attempts: [
        {
          id: 'attempt-2',
          categoryId: 'a',
          questionId: 'a-2',
          drawnAt: '2026-09-25T09:00:00.000Z',
          outcome: 'pending',
        },
      ],
    }),
  ]
  await putSession(
    makeSession({
      config: { ...config, categories: [answeredCategory] },
      students,
      activeStudentId: 'student-1',
    }),
  )
  renderAt('/session/session-1')

  await screen.findByRole('heading', { name: 'Q1' })
  fireEvent.click(screen.getByText('Éléments de réponse'))
  expect(screen.getByText('Éléments de réponse').closest('details')).toHaveAttribute('open')

  fireEvent.click(studentButton('Martin Bob'))

  await screen.findByRole('heading', { name: 'Q2' })
  expect(screen.getByText('Éléments de réponse').closest('details')).not.toHaveAttribute('open')
})

test('barème décimal en locale « en » : le bouton de note et le score suivent le point décimal', async () => {
  const config: NormalizedConfig = {
    ...makeConfig({ questionsPerStudent: 2 }),
    categories: [answeredCategory],
    locale: 'en',
  }
  await putSession(makeSession({ config, students: [makeStudent()], activeStudentId: 'student-1' }))
  renderAt('/session/session-1')

  fireEvent.click(await categoryButton('A'))
  await screen.findByText('Answer notes')

  expect(screen.getByRole('button', { name: 'Score 0.5' })).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Score 0.5' }))

  expect(await screen.findByText('Raw score: 0.5')).toBeInTheDocument()
})

test('erreur affichée même hors du panneau de passage (étudiant retiré entre le rendu et la sélection)', async () => {
  const config = makeConfig({ questionsPerStudent: 3 })
  await putSession(sessionWith(config, twoStudents(), undefined))
  renderAt('/session/session-1')

  await screen.findByRole('heading', { name: 'Aucun étudiant sélectionné' })
  const bobButton = studentButton('Martin Bob')

  const stored = await db.sessions.get('session-1')
  if (stored === undefined) throw new Error('session introuvable en base')
  const withoutBob = { ...stored, students: stored.students.filter((s) => s.id !== 'student-2') }

  // Écriture concurrente non attendue avant le clic (aucun `await` entre les deux, donc aucun
  // rendu ne peut s'intercaler) : reproduit un id encore listé côté examinateur mais déjà retiré
  // en base au moment où `updateSession` relit la session fraîche (Review Focus 2).
  const removal = db.sessions.put(withoutBob)
  fireEvent.click(bobButton)
  await removal

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Cet étudiant n’existe plus dans la session.',
  )
  // Toujours dans l'état « aucun étudiant sélectionné » : l'erreur ne dépend pas du panneau de
  // passage pour s'afficher.
  expect(screen.getByRole('heading', { name: 'Aucun étudiant sélectionné' })).toBeInTheDocument()
})
