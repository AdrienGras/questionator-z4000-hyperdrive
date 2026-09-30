import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { Student } from '@/domain/session/types'
import { db } from '@/lib/db/db'
import { makeStudent } from '@/testing/student-fixtures'
import { mountSession } from '@/testing/students-tab-harness'

function student(id: string, lastName: string, order: number): Student {
  return makeStudent([], { id, lastName, firstName: 'X', order })
}

const A = student('s-a', 'Aba', 1)
const B = student('s-b', 'Bec', 2)

const project = () => screen.getByRole('button', { name: 'Projeter cet étudiant' })
const waiting = () => screen.getByRole('button', { name: /Écran d.attente/ })
const open = () => screen.getByRole('button', { name: 'Ouvrir la vue projetée' })

async function storedProjection() {
  return (await db.sessions.get('session-1'))?.projection
}

/** Fenêtre simulée : `closed` modifiable, `focus` espionné. */
function fakeWindow() {
  const win: Window = Object.create(window)
  Object.defineProperty(win, 'closed', { value: false, writable: true })
  const focus = vi.fn<() => void>()
  Object.defineProperty(win, 'focus', { value: focus })
  return { win, focus }
}

function stubOpen(win: Window | null) {
  return vi.spyOn(window, 'open').mockReturnValue(win)
}

beforeEach(async () => {
  localStorage.clear()
  await db.sessions.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('« Projeter cet étudiant » enregistre l’étudiant actif puis se désactive', async () => {
  await mountSession([A, B])

  fireEvent.click(project())

  await waitFor(async () =>
    expect(await storedProjection()).toEqual({ mode: 'student', studentId: 's-a' }),
  )
  await waitFor(() => expect(project()).toBeDisabled())
})

test('« Écran d’attente » enregistre l’attente puis se désactive', async () => {
  await mountSession([A, B], { projection: { mode: 'student', studentId: 's-b' } })

  fireEvent.click(waiting())

  await waitFor(async () => expect(await storedProjection()).toEqual({ mode: 'waiting' }))
  await waitFor(() => expect(waiting()).toBeDisabled())
})

test('sans étudiant actif, « Projeter cet étudiant » est désactivé', async () => {
  await mountSession([A, B], { activeStudentId: undefined })

  expect(project()).toBeDisabled()
})

test('« Ouvrir la vue projetée » ouvre une fenêtre puis la refocalise sans la rouvrir', async () => {
  const { win, focus } = fakeWindow()
  const openSpy = stubOpen(win)
  await mountSession([A, B])

  fireEvent.click(open())
  fireEvent.click(open())

  expect(openSpy).toHaveBeenCalledTimes(1)
  const [url, name] = openSpy.mock.calls[0] ?? []
  expect(String(url)).toMatch(/#\/present\/session-1$/)
  expect(name).toBe('questionator-present')
  expect(focus).toHaveBeenCalledTimes(1)
})

test('une fenêtre fermée est rouverte au clic suivant', async () => {
  const { win } = fakeWindow()
  const openSpy = stubOpen(win)
  await mountSession([A, B])

  fireEvent.click(open())
  Object.defineProperty(win, 'closed', { value: true })
  fireEvent.click(open())

  expect(openSpy).toHaveBeenCalledTimes(2)
})

test('pop-up bloquée : message d’alerte', async () => {
  stubOpen(null)
  await mountSession([A, B])

  fireEvent.click(open())

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Autorisez les fenêtres pop-up pour ce site pour ouvrir la vue projetée.',
  )
})

test('bandeau : projection sur un autre étudiant que l’actif', async () => {
  await mountSession([A, B], { projection: { mode: 'student', studentId: 's-b' } })

  expect(screen.getByRole('status')).toHaveTextContent('La vue projetée montre Bec X.')
})

test('bandeau absent quand l’étudiant projeté est l’actif', async () => {
  await mountSession([A, B], {
    activeStudentId: 's-b',
    projection: { mode: 'student', studentId: 's-b' },
  })

  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('bandeau absent en mode attente', async () => {
  await mountSession([A, B])

  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
