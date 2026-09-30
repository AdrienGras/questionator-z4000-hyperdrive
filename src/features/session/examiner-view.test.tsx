import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { categoryButton, outsidePanel } from '@/testing/passage-assertions'
import { expectColorModeToggleLast, bannerInteractiveNames } from '@/testing/page-shell-assertions'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, type AttemptSpec, makeStudent } from '@/testing/student-fixtures'
import { renderAt } from '@/testing/render-at'
import { expectPanelStaysOpen, openSidePanel } from '@/testing/side-panel-assertions'
import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
import type { Session, Student } from '@/domain/session/types'

beforeEach(async () => {
  await db.sessions.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** Aucune ligne de la liste des étudiants n'est marquée comme courante. */
function expectNoCurrentStudent() {
  for (const button of within(
    screen.getByRole('list', { name: 'Étudiants de la session' }),
  ).getAllByRole('button')) {
    expect(button).not.toHaveAttribute('aria-current')
  }
}

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

/**
 * Ouvre le tiroir latéral (s'il est fermé) sur l'onglet « Étudiants » et renvoie le bouton de
 * l'étudiant.
 */
async function studentButton(name: string): Promise<HTMLElement> {
  const open = screen.queryByRole('dialog', { name: 'Panneau latéral' })
  const dialog = open ?? (await openSidePanel())
  fireEvent.click(within(dialog).getByRole('tab', { name: 'Étudiants' }))
  const button = within(within(dialog).getByRole('list', { name: 'Étudiants de la session' }))
    .getAllByRole('button')
    .find((b) => b.textContent.includes(name))
  if (button === undefined) throw new Error(`bouton ${name} introuvable`)
  return button
}

async function expectPanelClosed() {
  await waitFor(() =>
    expect(screen.queryByRole('dialog', { name: 'Panneau latéral' })).not.toBeInTheDocument(),
  )
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
  const dialog = await openSidePanel('Étudiants')
  const rows = within(
    within(dialog).getByRole('list', { name: 'Étudiants de la session' }),
  ).getAllByRole('button')
  expect(rows).toHaveLength(2)
  expect(rows[0]).toHaveTextContent('Durand Alice')
  expect(rows[0]).toHaveTextContent('à passer')
  expect(rows[0]).toHaveAttribute('aria-current', 'true')
  expect(rows[1]).toHaveTextContent('Martin Bob')

  fireEvent.click(await studentButton('Martin Bob'))

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
  await studentButton('Durand Alice')
  expectNoCurrentStudent()
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
  await studentButton('Durand Alice')
  expectNoCurrentStudent()
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

async function absentAliceSession() {
  const config = makeConfig({ questionsPerStudent: 3 })
  const [alice, bob] = twoStudents()
  if (alice === undefined || bob === undefined) throw new Error('fixture incomplète')
  await putSession(sessionWith(config, [{ ...alice, absent: true }, bob], 'student-1'))
}

test('étudiant absent : « Afficher le panneau » ouvre l’onglet « Étudiant »', async () => {
  localStorage.clear()
  await absentAliceSession()
  renderAt('/session/session-1')

  await screen.findByRole('heading', { name: 'Étudiant absent' })
  fireEvent.click(screen.getByRole('button', { name: 'Afficher le panneau' }))

  const dialog = await screen.findByRole('dialog', { name: 'Panneau latéral' })
  expect(within(dialog).getByRole('tab', { name: 'Étudiant' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(within(dialog).getByRole('checkbox', { name: 'Absent' })).toBeVisible()
})

test('aucun étudiant : « Afficher le panneau » ouvre l’onglet « Étudiants »', async () => {
  localStorage.clear()
  await putSession(sessionWith(makeConfig({ questionsPerStudent: 3 }), twoStudents(), undefined))
  renderAt('/session/session-1')

  await screen.findByRole('heading', { name: 'Aucun étudiant sélectionné' })
  fireEvent.click(screen.getByRole('button', { name: 'Afficher le panneau' }))

  const dialog = await screen.findByRole('dialog', { name: 'Panneau latéral' })
  expect(within(dialog).getByRole('tab', { name: 'Étudiants' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})

test('onglet « Étudiants » mémorisé, état absent : ouvert sur « Étudiant » et ce choix est mémorisé', async () => {
  localStorage.setItem('questionator:side-panel:tab', 'students')
  await absentAliceSession()
  renderAt('/session/session-1')

  await screen.findByRole('heading', { name: 'Étudiant absent' })
  fireEvent.click(screen.getByRole('button', { name: 'Afficher le panneau' }))

  const dialog = await screen.findByRole('dialog', { name: 'Panneau latéral' })
  expect(within(dialog).getByRole('tab', { name: 'Étudiant' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(localStorage.getItem('questionator:side-panel:tab')).toBe('student')
  localStorage.clear()
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

  fireEvent.click(await studentButton('Martin Bob'))
  await waitFor(() =>
    expect(screen.queryByRole('heading', { name: question.title })).not.toBeInTheDocument(),
  )
  await expectPanelClosed()

  fireEvent.click(await studentButton('Durand Alice'))
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

  fireEvent.click(await studentButton('Martin Bob'))

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
  const bobButton = await studentButton('Martin Bob')

  const stored = await db.sessions.get('session-1')
  if (stored === undefined) throw new Error('session introuvable en base')
  const withoutBob = { ...stored, students: stored.students.filter((s) => s.id !== 'student-2') }

  // Écriture concurrente non attendue avant le clic (aucun `await` entre les deux, donc aucun
  // rendu ne peut s'intercaler) : reproduit un id encore listé côté examinateur mais déjà retiré
  // en base au moment où `updateSession` relit la session fraîche (Review Focus 2).
  const removal = db.sessions.put(withoutBob)
  fireEvent.click(bobButton)
  await removal

  const dialog = screen.getByRole('dialog', { name: 'Panneau latéral' })
  await within(dialog).findByRole('alert')
  fireEvent.keyDown(dialog, { key: 'Escape' })
  await expectPanelClosed()
  expect(screen.getByRole('alert')).toHaveTextContent('Cet étudiant n’existe plus dans la session.')
  // Toujours dans l'état « aucun étudiant sélectionné » : l'erreur ne dépend pas du panneau de
  // passage pour s'afficher.
  expect(screen.getByRole('heading', { name: 'Aucun étudiant sélectionné' })).toBeInTheDocument()
})

test('clic sur un autre étudiant : il devient actif et le tiroir se ferme', async () => {
  await putSession(sessionWith(makeConfig(), twoStudents(), 'student-1'))
  renderAt('/session/session-1')

  fireEvent.click(await studentButton('Martin Bob'))

  await waitFor(async () =>
    expect((await db.sessions.get('session-1'))?.activeStudentId).toBe('student-2'),
  )
  await expectPanelClosed()
  expect(within(screen.getByRole('banner')).getByText('Martin Bob')).toBeInTheDocument()
})

test('échec du changement d’étudiant : le tiroir reste ouvert', async () => {
  await putSession(sessionWith(makeConfig(), twoStudents(), undefined))
  renderAt('/session/session-1')

  const bobButton = await studentButton('Martin Bob')
  const stored = await db.sessions.get('session-1')
  if (stored === undefined) throw new Error('session introuvable en base')
  const withoutBob = { ...stored, students: stored.students.filter((s) => s.id !== 'student-2') }
  // Même écriture concurrente que ci-dessus : l'id cliqué n'existe plus en base.
  const removal = db.sessions.put(withoutBob)
  fireEvent.click(bobButton)
  await removal

  const dialog = screen.getByRole('dialog', { name: 'Panneau latéral' })
  expect(await within(dialog).findByRole('alert')).toHaveTextContent(
    'Cet étudiant n’existe plus dans la session.',
  )
  await expectPanelStaysOpen()
})

test("onglet « Étudiants » : bouton-lien « Statistiques » vers l'écran des statistiques", async () => {
  await putSession(sessionWith(makeConfig(), twoStudents(), 'student-1'))
  renderAt('/session/session-1')

  const dialog = await openSidePanel('Étudiants')
  const link = within(dialog).getByRole('link', { name: 'Statistiques' })
  expect(link.getAttribute('href')).toMatch(/\/session\/session-1\/stats$/u)
})

/** Colonnes de la grille et premières tuiles des lignes courtes (D74). */
function gridLayout() {
  const grid = screen.getByRole('list', { name: 'Choisir une catégorie' })
  const starts = within(grid)
    .getAllByRole('listitem')
    .filter((li) => li.dataset.rowStart === 'true')
    .map((li) => within(li).getByRole('button').textContent)
  return { cols: grid.style.getPropertyValue('--cols'), starts }
}

test('grille de 5 catégories : 3 + 2, disposition inchangée après un tirage (D74)', async () => {
  const categories = ['A', 'B', 'C', 'D', 'E'].map((label, i): NormalizedCategory => ({
    ...answeredCategory,
    id: label.toLowerCase(),
    label,
    order: i + 1,
    questions: [{ id: `${label}-1`, title: `T${label}`, tags: [], prompt: `P${label}` }],
  }))
  const config = makeConfig({ questionsPerStudent: 2 })
  await putSession(passageSession({ config: { ...config, categories } }))
  renderAt('/session/session-1')
  const expected = { cols: '6', starts: [expect.stringMatching(/^D/)] }

  fireEvent.click(await categoryButton('A'))
  expect(gridLayout()).toEqual(expected)
  await screen.findByText('PA')

  expect(gridLayout()).toEqual(expected)
})

test('barre de titre : retour, titre de l’examen, contrôles de projection puis thème', async () => {
  const session = passageSession()
  await putSession(session)
  renderAt('/session/session-1')

  const title = await screen.findByRole('heading', { level: 1 })
  expect(title).toHaveTextContent(session.config.exam.title)
  const names = bannerInteractiveNames()
  expect(names[0]).toBe("Retour à l'accueil")
  expect(names[1]).toBe('Panneau')
  expect(
    within(screen.getByRole('banner')).getByRole('button', { name: 'Ouvrir la vue projetée' }),
  ).toBeInTheDocument()
  expectColorModeToggleLast()
})

test('sans étudiant actif : pas de ligne d’infos, projection et thème présents', async () => {
  await putSession(passageSession({ activeStudentId: undefined }))
  renderAt('/session/session-1')

  await screen.findByRole('heading', { name: 'Aucun étudiant sélectionné' })
  const banner = within(screen.getByRole('banner'))
  expect(banner.getByRole('button', { name: 'Ouvrir la vue projetée' })).toBeInTheDocument()
  expect(banner.queryByText(/Question/)).not.toBeInTheDocument()
  expectColorModeToggleLast()
})
