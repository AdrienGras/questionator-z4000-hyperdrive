import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { formatScore } from '@/domain/scoring/format'
import { computeScores } from '@/domain/scoring/score'
import type { Student } from '@/domain/session/types'
import { StudentsTab } from './components/students-tab'
import { db } from '@/lib/db/db'
import { makeUi } from '@/testing/make-ui'
import { makeSession } from '@/testing/session-fixtures'
import { expectPanelClosed, openSidePanel, panelButton } from '@/testing/side-panel-assertions'
import { makeStudent } from '@/testing/student-fixtures'
import { config, mountStudentsTab as mount } from '@/testing/students-tab-harness'
import { storedSession as stored } from '@/testing/stored-session'

function student(id: string, lastName: string, order: number, overrides: Partial<Student> = {}) {
  return makeStudent([], { id, lastName, firstName: 'X', order, ...overrides })
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

test('cliquer un autre étudiant l’active et remet la projection en attente (D73)', async () => {
  const projection = { mode: 'student', studentId: 's-a' } as const
  await mount([student('s-a', 'Aba', 1), student('s-b', 'Bec', 2)], { projection })

  fireEvent.click(rowOf('Bec'))

  await waitFor(async () => expect((await stored()).activeStudentId).toBe('s-b'))
  expect((await stored()).projection).toEqual({ mode: 'waiting' })
  await expectPanelClosed()
  // Rouvert sur l'onglet mémorisé.
  const dialog = await openSidePanel()
  expect(within(dialog).getByRole('tab', { name: 'Étudiants' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(rowOf('Bec')).toHaveAttribute('aria-current', 'true')

  fireEvent.click(rowOf('Aba'))

  await waitFor(async () => expect((await stored()).activeStudentId).toBe('s-a'))
  expect((await stored()).projection).toEqual({ mode: 'waiting' })
})

test('cliquer l’étudiant déjà projeté l’active sans toucher à la projection', async () => {
  const projection = { mode: 'student', studentId: 's-b' } as const
  await mount([student('s-a', 'Aba', 1), student('s-b', 'Bec', 2)], { projection })

  fireEvent.click(rowOf('Bec'))

  await waitFor(async () => expect((await stored()).activeStudentId).toBe('s-b'))
  expect((await stored()).projection).toEqual(projection)
})

test('l’onglet ne relaie pas le clic sur l’étudiant actif, mais relaie celui d’un autre', () => {
  const onSelect = vi.fn<(id: string) => void>()
  render(
    <StudentsTab
      ui={makeUi()}
      session={makeSession({
        config,
        students: [student('s-a', 'Aba', 1), student('s-b', 'Bec', 2)],
        activeStudentId: 's-a',
      })}
      activeStudentId="s-a"
      disabled={false}
      onSelect={onSelect}
      onAdd={vi.fn<() => Promise<boolean>>()}
    />,
  )

  fireEvent.click(rowOf('Aba'))
  expect(onSelect).not.toHaveBeenCalled()

  fireEvent.click(rowOf('Bec'))
  expect(onSelect).toHaveBeenCalledExactlyOnceWith('s-b')
})

test('après le changement d’étudiant, le focus revient au bouton « Panneau »', async () => {
  await mount([student('s-a', 'Aba', 1), student('s-b', 'Bec', 2)], { activeStudentId: 's-a' })
  const row = rowOf('Bec')
  row.focus()

  fireEvent.click(row)

  await expectPanelClosed()
  await waitFor(async () => expect(await panelButton()).toHaveFocus())
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
  // `hidden` : le tiroir modal ouvert masque le reste de la page aux requêtes par rôle.
  await screen.findByRole('heading', { level: 2, name: 'Titre a-1', hidden: true })
  const initial = (await stored()).students[0]?.attempts

  fireEvent.click(rowOf('Bec'))
  await expectPanelClosed()
  await waitFor(() =>
    expect(screen.queryByRole('heading', { level: 2, name: 'Titre a-1' })).not.toBeInTheDocument(),
  )
  await openSidePanel()
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

// Rendu direct : une session stockée avec un étudiant actif inconnu est lue comme endommagée (F31).
test('activeStudentId orphelin : aucune ligne en aria-current', () => {
  const students = [student('s-a', 'Aba', 1), student('s-b', 'Bec', 2)]
  render(
    <StudentsTab
      ui={makeUi()}
      session={makeSession({ config, students })}
      activeStudentId="inconnu"
      disabled={false}
      onSelect={vi.fn<(id: string) => void>()}
      onAdd={vi.fn<() => Promise<boolean>>()}
    />,
  )

  for (const button of buttons()) expect(button).not.toHaveAttribute('aria-current')
})
