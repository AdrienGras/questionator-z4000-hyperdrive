import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { formatScore } from '@/domain/scoring/format'
import { computeScores } from '@/domain/scoring/score'
import type { Student } from '@/domain/session/types'
import { StudentsTab } from './components/students-tab'
import type { WriteOutcome } from './hooks/use-passage-actions'
import { db } from '@/lib/db/db'
import { makeUi } from '@/testing/make-ui'
import { makeSession } from '@/testing/session-fixtures'
import { expectPanelClosed, openSidePanel, panelButton } from '@/testing/side-panel-assertions'
import { makeListStudent } from '@/testing/student-fixtures'
import { config, mountStudentsTab as mount } from '@/testing/students-tab-harness'
import { storedSession as stored } from '@/testing/stored-session'

function student(id: string, lastName: string, order: number, overrides: Partial<Student> = {}) {
  return makeListStudent(id, lastName, order, [], overrides)
}

function list(): HTMLElement {
  return screen.getByRole('list', { name: 'Étudiants de la session' })
}

/** Boutons de sélection, un par ligne (le bouton d'absence de la ligne est à part, F38). */
function buttons(): HTMLElement[] {
  return within(list())
    .getAllByRole('listitem')
    .map((item) => within(item).getAllByRole('button')[0]!)
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
  // Rouvert sur « Étudiant » (D91) : retour à la liste.
  await openSidePanel('Étudiants')
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
      onAdd={vi.fn<() => Promise<WriteOutcome>>()}
      onSetAbsent={vi.fn<() => Promise<WriteOutcome>>()}
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
  const alice = makeListStudent('s-a', 'Aba', 1, ['pending'])
  await mount([alice, student('s-b', 'Bec', 2)])
  // `hidden` : le tiroir modal ouvert masque le reste de la page aux requêtes par rôle.
  await screen.findByRole('heading', { level: 2, name: 'Titre a-1', hidden: true })
  const initial = (await stored()).students[0]?.attempts

  fireEvent.click(rowOf('Bec'))
  await expectPanelClosed()
  await waitFor(() =>
    expect(screen.queryByRole('heading', { level: 2, name: 'Titre a-1' })).not.toBeInTheDocument(),
  )
  await openSidePanel('Étudiants')
  fireEvent.click(rowOf('Aba'))

  expect(await screen.findByRole('heading', { level: 2, name: 'Titre a-1' })).toBeInTheDocument()
  expect((await stored()).students[0]?.attempts).toEqual(initial)
})

test('notes : à passer « brute · — », terminé avec ajustement, absent', async () => {
  const todo = student('s-a', 'Aba', 1)
  const done = makeListStudent('s-b', 'Bec', 2, [2, 1], {
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
      onAdd={vi.fn<() => Promise<WriteOutcome>>()}
      onSetAbsent={vi.fn<() => Promise<WriteOutcome>>()}
    />,
  )

  for (const button of buttons()) expect(button).not.toHaveAttribute('aria-current')
})

/** Bouton d'absence de la ligne (prénom « X » de `makeListStudent`). */
function absentButtonOf(lastName: string, action: 'absent' | 'présent' = 'absent'): HTMLElement {
  return within(list()).getByRole('button', { name: `Marquer ${lastName} X ${action}` })
}

describe('absence depuis la liste (F38)', () => {
  test('chaque ligne a son bouton, nommé d’après l’étudiant', async () => {
    await mount([student('s-a', 'Aba', 1), student('s-b', 'Bec', 2, { absent: true })])

    expect(absentButtonOf('Aba')).toBeInTheDocument()
    expect(absentButtonOf('Bec', 'présent')).toBeInTheDocument()
  })

  test('sans question tirée : absent puis présent, sans activer l’étudiant ni fermer le tiroir', async () => {
    await mount([student('s-a', 'Aba', 1), student('s-b', 'Bec', 2)])

    fireEvent.click(absentButtonOf('Bec'))

    await waitFor(async () => expect((await stored()).students[1]?.absent).toBe(true))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect((await stored()).activeStudentId).toBe('s-a')
    expect(screen.getByRole('dialog', { name: 'Panneau latéral' })).toBeInTheDocument()

    fireEvent.click(await waitFor(() => absentButtonOf('Bec', 'présent')))

    await waitFor(async () => expect((await stored()).students[1]?.absent).toBe(false))
    expect((await stored()).activeStudentId).toBe('s-a')
    expect(rowOf('Aba')).toHaveAttribute('aria-current', 'true')
  })

  test('avec questions tirées : confirmation, puis attempts supprimés, étudiant actif inchangé', async () => {
    await mount([student('s-a', 'Aba', 1), makeListStudent('s-b', 'Bec', 2, [2, 1])])

    fireEvent.click(absentButtonOf('Bec'))
    const dialog = await screen.findByRole('alertdialog', { name: 'Déclarer Bec X absent ?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Déclarer absent' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    const bec = (await stored()).students[1]
    expect(bec?.absent).toBe(true)
    expect(bec?.attempts).toEqual([])
    expect((await stored()).activeStudentId).toBe('s-a')
    expect(screen.getByRole('dialog', { name: 'Panneau latéral' })).toBeInTheDocument()
  })

  test('cliquer la ligne sélectionne sans toucher à l’absence', async () => {
    await mount([student('s-a', 'Aba', 1), student('s-b', 'Bec', 2)])

    fireEvent.click(rowOf('Bec'))

    await waitFor(async () => expect((await stored()).activeStudentId).toBe('s-b'))
    expect((await stored()).students.every((s) => !s.absent)).toBe(true)
  })

  test('boutons d’absence désactivés pendant une écriture', () => {
    render(
      <StudentsTab
        ui={makeUi()}
        session={makeSession({ config, students: [student('s-a', 'Aba', 1)] })}
        activeStudentId="s-a"
        disabled
        onSelect={vi.fn<(id: string) => void>()}
        onAdd={vi.fn<() => Promise<WriteOutcome>>()}
        onSetAbsent={vi.fn<() => Promise<WriteOutcome>>()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Marquer Aba X absent' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^Aba/ })).toBeEnabled()
  })
})
