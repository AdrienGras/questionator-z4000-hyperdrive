import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
import { formatScore } from '@/domain/scoring/format'
import { computeScores } from '@/domain/scoring/score'
import type { Session, Student } from '@/domain/session/types'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
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

function student(id: string, lastName: string, order: number, overrides: Partial<Student> = {}) {
  return makeStudent([], { id, lastName, firstName: 'X', order, ...overrides })
}

async function mount(students: Student[], overrides: Partial<Session> = {}) {
  await putSession(
    makeSession({ config, students, activeStudentId: students[0]?.id, ...overrides }),
  )
  renderAt('/session/session-1')
  await screen.findByRole('complementary', { name: 'Panneau latéral' })
  fireEvent.click(screen.getByRole('tab', { name: 'Étudiants' }))
}

function list(): HTMLElement {
  return screen.getByRole('list', { name: 'Étudiants de la session' })
}

function buttons(): HTMLElement[] {
  return within(list()).getAllByRole('button')
}

function rowOf(lastName: string): HTMLElement {
  const button = buttons().find((b) => b.textContent.includes(lastName))
  if (button === undefined) throw new Error(`ligne ${lastName} absente`)
  return button
}

async function stored() {
  const session = await db.sessions.get('session-1')
  if (session === undefined) throw new Error('session absente')
  return session
}

beforeEach(async () => {
  localStorage.clear()
  await db.sessions.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('la liste suit `order`, pas l’ordre du tableau', async () => {
  await mount([student('s-c', 'Cha', 3), student('s-a', 'Aba', 1), student('s-b', 'Bec', 2)], {
    activeStudentId: 's-a',
  })

  expect(buttons().map((b) => b.textContent)).toEqual([
    expect.stringContaining('Aba'),
    expect.stringContaining('Bec'),
    expect.stringContaining('Cha'),
  ])
})

test('seul le bouton de l’étudiant actif porte aria-current', async () => {
  await mount([student('s-a', 'Aba', 1), student('s-b', 'Bec', 2)], { activeStudentId: 's-b' })

  expect(rowOf('Bec')).toHaveAttribute('aria-current', 'true')
  expect(rowOf('Aba')).not.toHaveAttribute('aria-current')
})

test('l’étudiant projeté porte l’icône « Projeté », les autres non', async () => {
  await mount([student('s-a', 'Aba', 1), student('s-b', 'Bec', 2)], {
    projection: { mode: 'student', studentId: 's-b' },
  })

  expect(within(rowOf('Bec')).getByLabelText('Projeté')).toBeInTheDocument()
  expect(within(rowOf('Aba')).queryByLabelText('Projeté')).not.toBeInTheDocument()
})

test('projection en attente : aucune icône « Projeté »', async () => {
  await mount([student('s-a', 'Aba', 1), student('s-b', 'Bec', 2)], {
    projection: { mode: 'waiting' },
  })

  expect(screen.queryByLabelText('Projeté')).not.toBeInTheDocument()
})

test('cliquer un étudiant l’active sans toucher à la projection ni à l’onglet', async () => {
  const projection = { mode: 'student', studentId: 's-a' } as const
  await mount([student('s-a', 'Aba', 1), student('s-b', 'Bec', 2)], { projection })

  fireEvent.click(rowOf('Bec'))

  await waitFor(async () => expect((await stored()).activeStudentId).toBe('s-b'))
  expect((await stored()).projection).toEqual(projection)
  await waitFor(() => expect(rowOf('Bec')).toHaveAttribute('aria-current', 'true'))
  expect(screen.getByRole('tab', { name: 'Étudiants' })).toHaveAttribute('aria-selected', 'true')
})

test('cliquer l’étudiant déjà actif n’écrit rien', async () => {
  await mount([student('s-a', 'Aba', 1), student('s-b', 'Bec', 2)], { activeStudentId: 's-a' })
  const before = await stored()

  fireEvent.click(rowOf('Aba'))

  expect(await stored()).toEqual(before)
})

test('aller-retour A → B → A avec une question en cours : rien n’est perdu', async () => {
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
  await mount([alice, student('s-b', 'Bec', 2)])
  await screen.findByRole('heading', { level: 2, name: 'Titre a-1' })
  const initial = (await stored()).students[0]?.attempts

  fireEvent.click(rowOf('Bec'))
  await waitFor(() => expect(rowOf('Bec')).toHaveAttribute('aria-current', 'true'))
  expect(screen.queryByRole('heading', { level: 2, name: 'Titre a-1' })).not.toBeInTheDocument()
  fireEvent.click(rowOf('Aba'))

  expect(await screen.findByRole('heading', { level: 2, name: 'Titre a-1' })).toBeInTheDocument()
  expect((await stored()).students[0]?.attempts).toEqual(initial)
})

test('notes : à passer « brute · — », terminé avec ajustement, absent', async () => {
  const todo = student('s-a', 'Aba', 1)
  const done = makeStudent([2, 1], {
    id: 's-b',
    lastName: 'Bec',
    firstName: 'X',
    order: 2,
    adjustment: { value: 1, reason: 'Bonne tenue' },
  })
  const absent = student('s-c', 'Cha', 3, { absent: true })
  await mount([todo, done, absent])

  const locale = 'fr'

  const todoScores = computeScores(todo, config)
  expect(rowOf('Aba')).toHaveTextContent(
    `${formatScore(todoScores.raw, 'raw', config, locale)} · —`,
  )
  const doneScores = computeScores(done, config)
  if (doneScores.final === null) throw new Error('note finale attendue')
  expect(rowOf('Bec')).toHaveTextContent(
    `${formatScore(doneScores.raw, 'raw', config, locale)} · ${formatScore(doneScores.final, 'final', config, locale)}`,
  )
  expect(rowOf('Cha')).toHaveTextContent(config.absent.label)
  expect(rowOf('Cha')).not.toHaveTextContent('·')
})

test('activeStudentId orphelin : aucune ligne en aria-current', async () => {
  await mount([student('s-a', 'Aba', 1), student('s-b', 'Bec', 2)], { activeStudentId: 'inconnu' })

  for (const button of buttons()) expect(button).not.toHaveAttribute('aria-current')
})
