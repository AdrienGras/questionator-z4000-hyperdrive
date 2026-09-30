import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { NormalizedCategory } from '@/domain/config/normalize'
import type { Student } from '@/domain/session/types'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { renderAt } from '@/testing/render-at'
import { openSidePanel, panelButton } from '@/testing/side-panel-assertions'
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
  await panelButton()
  return rendered
}

function panel(): HTMLElement {
  return screen.getByRole('dialog', { name: 'Panneau latéral' })
}

async function expectClosed() {
  await waitFor(() =>
    expect(screen.queryByRole('dialog', { name: 'Panneau latéral' })).not.toBeInTheDocument(),
  )
}

beforeEach(async () => {
  localStorage.clear()
  await db.sessions.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('fermé au chargement ; « Panneau » l’ouvre sur l’onglet « Étudiant »', async () => {
  await mount(makeStudent([2, 1], { finalRevealedAt: REVEALED }))

  expect(screen.queryByRole('dialog', { name: 'Panneau latéral' })).not.toBeInTheDocument()
  expect(screen.queryByRole('tab', { name: 'Étudiant' })).not.toBeInTheDocument()

  const dialog = await openSidePanel()

  expect(within(dialog).getByRole('tab', { name: 'Étudiant' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})

test('onglet « Étudiants » mémorisé : rouvert dessus après fermeture et après remontage', async () => {
  const { unmount } = await mount(makeStudent([2, 1], { finalRevealedAt: REVEALED }))

  await openSidePanel('Étudiants')
  expect(within(panel()).getByRole('list', { name: 'Étudiants de la session' })).toBeVisible()
  fireEvent.click(within(panel()).getByRole('button', { name: 'Fermer le panneau' }))
  await expectClosed()

  let dialog = await openSidePanel()
  expect(within(dialog).getByRole('tab', { name: 'Étudiants' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  unmount()
  await mount(makeStudent([2, 1], { finalRevealedAt: REVEALED }))

  // Fermé au remontage, même ouvert juste avant : seul l'onglet est mémorisé.
  expect(screen.queryByRole('dialog', { name: 'Panneau latéral' })).not.toBeInTheDocument()
  dialog = await openSidePanel()
  expect(within(dialog).getByRole('tab', { name: 'Étudiants' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(within(dialog).getByRole('list', { name: 'Étudiants de la session' })).toBeVisible()
})

test('onglets sur toute la largeur', async () => {
  await mount(makeStudent([2, 1], { finalRevealedAt: REVEALED }))

  const dialog = await openSidePanel()

  expect(within(dialog).getByRole('tablist')).toHaveClass('w-full')
  const tabs = within(dialog).getAllByRole('tab')
  expect(tabs).toHaveLength(2)
  for (const tab of tabs) expect(tab).toHaveClass('flex-1')
})

test('Échap ferme et rend le focus à « Panneau »', async () => {
  await mount(makeStudent([2, 1], { finalRevealedAt: REVEALED }))
  const button = await panelButton()

  const dialog = await openSidePanel()
  fireEvent.keyDown(within(dialog).getByRole('tab', { name: 'Étudiant' }), { key: 'Escape' })

  await expectClosed()
  await waitFor(() => expect(button).toHaveFocus())
})

test('« Fermer le panneau » ferme et rend le focus', async () => {
  await mount(makeStudent([2, 1], { finalRevealedAt: REVEALED }))
  const button = await panelButton()

  const dialog = await openSidePanel()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Fermer le panneau' }))

  await expectClosed()
  await waitFor(() => expect(button).toHaveFocus())
})

test('clic sur le voile ferme et rend le focus', async () => {
  await mount(makeStudent([2, 1], { finalRevealedAt: REVEALED }))
  const button = await panelButton()

  await openSidePanel()
  const overlay = document.querySelector('[data-slot="sheet-overlay"]')
  if (overlay === null) throw new Error('voile du tiroir introuvable')
  fireEvent.pointerDown(overlay)
  fireEvent.mouseDown(overlay)
  fireEvent.pointerUp(overlay)
  fireEvent.mouseUp(overlay)
  fireEvent.click(overlay)

  await expectClosed()
  await waitFor(() => expect(button).toHaveFocus())
})

test('aucun étudiant : message vide', async () => {
  await mount(undefined)
  await openSidePanel()

  expect(within(panel()).getByText('Aucun étudiant sélectionné.')).toBeInTheDocument()
})

test('étudiant sans question tirée : message vide', async () => {
  await mount(makeStudent([]))
  await openSidePanel()

  expect(within(panel()).getByText('Aucune question tirée.')).toBeInTheDocument()
})

test('étudiant en cours : question en cours, note convertie et finale « — »', async () => {
  await mount(makeStudent([1, 'pending']))
  await openSidePanel()

  const drawer = within(panel())
  expect(drawer.getByRole('heading', { name: 'Questions' })).toBeInTheDocument()
  expect(drawer.getByRole('heading', { name: 'Totaux' })).toBeInTheDocument()
  expect(drawer.getByText('En cours')).toBeInTheDocument()
  expect(drawer.getByText('Note convertie').nextElementSibling).toHaveTextContent('—')
  expect(drawer.getByText('Note finale').nextElementSibling).toHaveTextContent('—')
})

test('corriger une note depuis le panneau met à jour l’écran final', async () => {
  await mount(makeStudent([2, 1], { finalRevealedAt: REVEALED }))
  expect(await screen.findByRole('heading', { name: 'Passage terminé' })).toBeInTheDocument()
  await openSidePanel()

  fireEvent.change(within(panel()).getByRole('combobox', { name: 'Note de la question 1' }), {
    target: { value: '3' },
  })

  await waitFor(async () => {
    const stored = await db.sessions.get('session-1')
    expect(stored?.students[0]?.attempts[0]?.score).toBe(3)
    expect(stored?.students[0]?.attempts[0]?.editedAt).toBeDefined()
  })
  // `hidden` : le tiroir modal masque le reste de la page aux requêtes par rôle.
  const main = screen.getByRole('main', { hidden: true })
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
  await openSidePanel()

  fireEvent.change(within(panel()).getByRole('combobox', { name: 'Note de la question 1' }), {
    target: { value: '2' },
  })

  // Signe visible de la nouvelle session (liveQuery) avant toute assertion sur le DOM.
  await waitFor(() => expect(screen.getByText('Score brut : 2')).toBeInTheDocument())
  expect(within(panel()).getByRole('combobox', { name: 'Note de la question 1' })).toHaveValue('2')
  const stored = await db.sessions.get('session-1')
  expect(stored?.students[0]?.attempts[0]?.score).toBe(2)
  expect(stored?.students[0]?.attempts[1]).toEqual(before)
  expect(
    screen.getByRole('heading', { level: 2, name: 'Titre a-2', hidden: true }),
  ).toBeInTheDocument()
})
