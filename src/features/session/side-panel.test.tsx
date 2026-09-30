import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { NormalizedCategory } from '@/domain/config/normalize'
import type { Student } from '@/domain/session/types'
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

const REVEALED = '2026-09-25T10:00:00.000Z'

async function mount(student: Student | undefined, questionsPerStudent = 2) {
  const config = {
    ...makeConfig({
      questionsPerStudent,
      maxRawScore: 20,
      finalScale: 20,
      rounding: { mode: 'nearest', decimals: 2, step: 0.5 },
    }),
    categories: [category],
  }
  await putSession(
    makeSession({
      config,
      students: student === undefined ? [] : [student],
      activeStudentId: student?.id,
    }),
  )
  const rendered = renderAt('/session/session-1')
  await screen.findByRole('complementary', { name: 'Panneau latéral' })
  return rendered
}

function panel(): HTMLElement {
  return screen.getByRole('complementary', { name: 'Panneau latéral' })
}

beforeEach(async () => {
  localStorage.clear()
  await db.sessions.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('ouvert par défaut, onglet « Étudiant » sélectionné', async () => {
  await mount(makeStudent([2, 1], { finalRevealedAt: REVEALED }))

  expect(within(panel()).getByRole('tab', { name: 'Étudiant' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(within(panel()).getByRole('button', { name: 'Masquer le panneau' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
})

test('replier retire le contenu', async () => {
  await mount(makeStudent([2, 1], { finalRevealedAt: REVEALED }))

  fireEvent.click(within(panel()).getByRole('button', { name: 'Masquer le panneau' }))

  expect(within(panel()).queryByRole('tab', { name: 'Étudiant' })).not.toBeInTheDocument()
  expect(within(panel()).getByRole('button', { name: 'Afficher le panneau' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
})

test('l’onglet « Étudiants » est mémorisé et affiche la liste', async () => {
  const { unmount } = await mount(makeStudent([2, 1], { finalRevealedAt: REVEALED }))

  fireEvent.click(within(panel()).getByRole('tab', { name: 'Étudiants' }))
  expect(screen.getByRole('list', { name: 'Étudiants de la session' })).toBeVisible()
  unmount()
  await mount(makeStudent([2, 1], { finalRevealedAt: REVEALED }))

  expect(within(panel()).getByRole('tab', { name: 'Étudiants' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(screen.getByRole('list', { name: 'Étudiants de la session' })).toBeVisible()
})

test('localStorage inaccessible : panneau ouvert, repli possible', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('bloqué')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('bloqué')
  })
  await mount(makeStudent([2, 1], { finalRevealedAt: REVEALED }))

  expect(within(panel()).getByRole('tab', { name: 'Étudiant' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  fireEvent.click(within(panel()).getByRole('button', { name: 'Masquer le panneau' }))
  expect(within(panel()).getByRole('button', { name: 'Afficher le panneau' })).toBeInTheDocument()
})

test('aucun étudiant : message vide', async () => {
  await mount(undefined)

  expect(within(panel()).getByText('Aucun étudiant sélectionné.')).toBeInTheDocument()
})

test('étudiant sans question tirée : message vide', async () => {
  await mount(makeStudent([]))

  expect(within(panel()).getByText('Aucune question tirée.')).toBeInTheDocument()
})

test('étudiant en cours : question en cours, note convertie et finale « — »', async () => {
  await mount(makeStudent([1, 'pending']))

  const aside = within(panel())
  expect(aside.getByRole('heading', { name: 'Questions' })).toBeInTheDocument()
  expect(aside.getByRole('heading', { name: 'Totaux' })).toBeInTheDocument()
  expect(aside.getByText('En cours')).toBeInTheDocument()
  expect(aside.getByText('Note convertie').nextElementSibling).toHaveTextContent('—')
  expect(aside.getByText('Note finale').nextElementSibling).toHaveTextContent('—')
})

test('corriger une note depuis le panneau met à jour l’écran final', async () => {
  await mount(makeStudent([2, 1], { finalRevealedAt: REVEALED }))
  expect(await screen.findByRole('heading', { name: 'Passage terminé' })).toBeInTheDocument()

  fireEvent.change(within(panel()).getByRole('combobox', { name: 'Note de la question 1' }), {
    target: { value: '3' },
  })

  await waitFor(async () => {
    const stored = await db.sessions.get('session-1')
    expect(stored?.students[0]?.attempts[0]?.score).toBe(3)
    expect(stored?.students[0]?.attempts[0]?.editedAt).toBeDefined()
  })
  const main = screen.getByRole('main')
  await waitFor(() => {
    const finalRow = within(main).getAllByText('Note finale')
    const outside = finalRow.find((el) => !panel().contains(el))
    expect(outside?.nextElementSibling).toHaveTextContent('4,0 / 20')
  })
})

test('corriger une note pendant qu’une question est en cours ne la touche pas', async () => {
  await mount(makeStudent([1, 'pending']))
  expect(screen.getByRole('heading', { level: 2, name: 'Titre a-2' })).toBeInTheDocument()
  const before = (await db.sessions.get('session-1'))?.students[0]?.attempts[1]

  fireEvent.change(within(panel()).getByRole('combobox', { name: 'Note de la question 1' }), {
    target: { value: '2' },
  })

  // Signe visible de la nouvelle session (liveQuery) avant toute assertion sur le DOM.
  await waitFor(() => expect(screen.getByText('Score brut : 2')).toBeInTheDocument())
  expect(within(panel()).getByRole('combobox', { name: 'Note de la question 1' })).toHaveValue('2')
  const stored = await db.sessions.get('session-1')
  expect(stored?.students[0]?.attempts[0]?.score).toBe(2)
  expect(stored?.students[0]?.attempts[1]).toEqual(before)
  expect(screen.getByRole('heading', { level: 2, name: 'Titre a-2' })).toBeInTheDocument()
})
