import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { Student } from '@/domain/session/types'
import { db } from '@/lib/db/db'
import { makeUi } from '@/testing/make-ui'
import { categoryButton } from '@/testing/passage-assertions'
import { FixedWidthResizeObserver } from '@/testing/resize-observer'
import { makeStudent } from '@/testing/student-fixtures'
import { putSession } from '@/lib/db/sessions'
import { renderAt } from '@/testing/render-at'
import { makeSession } from '@/testing/session-fixtures'
import { config, mountSession } from '@/testing/students-tab-harness'
import { ProjectionControls } from './components/projection-controls'

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

const preview = () => screen.getByRole('region', { name: 'Vue projetée' })
const canvas = () => preview().querySelector('[data-projection-canvas]')!

beforeEach(async () => {
  vi.stubGlobal('ResizeObserver', FixedWidthResizeObserver)
  localStorage.clear()
  await db.sessions.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
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

test.each([
  ['« Écran d’attente »', waiting],
  ['« Projeter cet étudiant »', project],
])('popup bloquée : message effacé au clic suivant (%s)', async (_label, button) => {
  stubOpen(null)
  await mountSession([A, B], { projection: { mode: 'student', studentId: 's-b' } })

  fireEvent.click(open())
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Autorisez les fenêtres pop-up pour ce site pour ouvrir la vue projetée.',
  )
  fireEvent.click(button())

  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
})

test('popup bloquée puis ouverture réussie : message effacé', async () => {
  const openSpy = stubOpen(null)
  await mountSession([A, B])

  fireEvent.click(open())
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  openSpy.mockReturnValue(fakeWindow().win)
  fireEvent.click(open())

  expect(screen.queryByRole('alert')).toBeNull()
})

test('fenêtre d’une autre session : rouverte, pas ramenée', () => {
  const { win, focus } = fakeWindow()
  const openSpy = stubOpen(win)
  const props = {
    ui: makeUi(),
    projection: { mode: 'waiting' } as const,
    activeStudentId: undefined,
    disabled: false,
    onProject: vi.fn<() => Promise<boolean>>(() => Promise.resolve(true)),
  }
  const { rerender } = render(<ProjectionControls {...props} sessionId="s1" />)

  fireEvent.click(open())
  rerender(<ProjectionControls {...props} sessionId="s2" />)
  fireEvent.click(open())

  expect(openSpy).toHaveBeenCalledTimes(2)
  expect(String(openSpy.mock.calls[1]?.[0])).toContain('#/present/s2')
  expect(focus).not.toHaveBeenCalled()
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

const WAITING = "L'épreuve va bientôt commencer."

test('aperçu : suit la projection en direct', async () => {
  await mountSession([A, B])
  expect(canvas().textContent).toContain(WAITING)

  fireEvent.click(project())
  await waitFor(() => expect(canvas().textContent).toContain('X Aba'))

  fireEvent.click(waiting())
  await waitFor(() => expect(canvas().textContent).toContain(WAITING))
})

test('aperçu : tirage → énoncé', async () => {
  await mountSession([A, B], { projection: { mode: 'student', studentId: 's-a' } })

  fireEvent.click(await categoryButton('A'))
  await waitFor(async () => {
    const session = await db.sessions.get('session-1')
    const drawn = session?.students.find((s) => s.id === 's-a')?.attempts.at(-1)?.questionId
    expect(drawn).toMatch(/^a-\d$/)
    expect(canvas().textContent).toContain(drawn)
  })
  expect(canvas().textContent).not.toContain(WAITING)
})

test('aperçu : note finale révélée', async () => {
  const done = makeStudent([2, 1], { finalRevealedAt: '2026-09-25T10:00:00.000Z' })
  await mountSession([done], { projection: { mode: 'student', studentId: 'student-1' } })

  await waitFor(() => expect(canvas().textContent).toMatch(/Note : .* \/ 20/))
})

// L'attente sur un étudiant projeté inconnu est couverte par `domain/presentation/projected-view.test.ts`.
test('aperçu : étudiant projeté inconnu → session endommagée, aucun aperçu (F31)', async () => {
  await putSession(
    makeSession({
      config,
      students: [A, B],
      projection: { mode: 'student', studentId: 'inconnu' },
    }),
  )
  renderAt('/session/session-1')

  expect(
    await screen.findByRole('heading', { name: 'Cette session est endommagée' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Exporter un backup' })).toBeInTheDocument()
})

test('contrôles sous l’aperçu, hors de l’en-tête', async () => {
  await mountSession([A, B])

  expect(
    within(screen.getByRole('banner')).queryByRole('button', { name: 'Ouvrir la vue projetée' }),
  ).toBeNull()
  expect(preview().compareDocumentPosition(open()) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
})
