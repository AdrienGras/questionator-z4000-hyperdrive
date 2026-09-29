import 'fake-indexeddb/auto'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { DrawReveal } from '@/features/present/components/draw-reveal'
import { db } from '@/lib/db/db'
import { putSession, updateSession } from '@/lib/db/sessions'
import { setReducedMotion } from '@/testing/match-media'
import { renderAt } from '@/testing/render-at'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'

const T1 = '2026-09-25T09:00:00.000Z'
const T2 = '2026-09-25T09:05:00.000Z'

function reveal(drawnAt: string, animate = true) {
  return (
    <DrawReveal drawnAt={drawnAt} color="#ff0000" animate={animate}>
      <p>Énoncé secret</p>
    </DrawReveal>
  )
}

const cards = (container: HTMLElement) => container.querySelectorAll('[data-card]')

describe('DrawReveal', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('premier rendu : énoncé visible tout de suite, aucune carte', () => {
    const { container } = render(reveal(T1))
    expect(screen.getByText('Énoncé secret')).toBeInTheDocument()
    expect(cards(container)).toHaveLength(0)
  })

  test('nouveau tirage : cartes neutres sans texte, puis énoncé après 1 500 ms', () => {
    const { container, rerender } = render(reveal(T1))
    rerender(reveal(T2))

    expect(cards(container)).toHaveLength(3)
    for (const card of cards(container)) {
      expect(card).toHaveAttribute('aria-hidden', 'true')
      expect(card.textContent).toBe('')
    }
    expect(screen.queryByText('Énoncé secret')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(screen.getByText('Énoncé secret')).toBeInTheDocument()
    expect(cards(container)).toHaveLength(0)
  })

  test('même drawnAt rerendu : pas d’animation', () => {
    const { container, rerender } = render(reveal(T1))
    rerender(reveal(T1))
    expect(cards(container)).toHaveLength(0)
    expect(screen.getByText('Énoncé secret')).toBeInTheDocument()
  })

  test('drawnAt déjà révélé rerendu après l’animation : pas de rejeu', () => {
    const { container, rerender } = render(reveal(T1))
    rerender(reveal(T2))
    act(() => {
      vi.advanceTimersByTime(1500)
    })
    rerender(reveal(T2))
    expect(cards(container)).toHaveLength(0)
  })

  test('animation désactivée : énoncé direct au nouveau drawnAt', () => {
    const { container, rerender } = render(reveal(T1, false))
    rerender(reveal(T2, false))
    expect(cards(container)).toHaveLength(0)
    expect(screen.getByText('Énoncé secret')).toBeInTheDocument()
  })

  test('mouvement réduit : pas de cartes, fondu sur l’énoncé', () => {
    setReducedMotion(true)
    const { container, rerender } = render(reveal(T1))
    rerender(reveal(T2))
    expect(cards(container)).toHaveLength(0)
    expect(screen.getByText('Énoncé secret').parentElement).toHaveClass('fade-in')
  })
})

// Pages : liveQuery a besoin de vrais timers.
function twoStudents() {
  return makeSession({
    config: makeConfig({ questionsPerStudent: 3, maxRawScore: 9, finalScale: 20 }),
    students: [
      makeStudent(),
      makeStudent(['pending'], { id: 'student-2', firstName: 'Bob', lastName: 'Martin', order: 2 }),
    ],
    projection: { mode: 'student', studentId: 'student-1' },
  })
}

test('changement d’étudiant projeté : énoncé du nouvel étudiant sans cartes', async () => {
  await db.sessions.clear()
  await putSession(twoStudents())
  const { container } = renderAt('/present/session-1')
  await screen.findByText(/Alice/)

  await updateSession('session-1', (s) => ({
    ...s,
    projection: { mode: 'student', studentId: 'student-2' },
  }))

  expect(await screen.findByText('Question A1')).toBeInTheDocument()
  expect(cards(container)).toHaveLength(0)
})

test('réinitialisation de l’étudiant projeté : « Question 1 / 3 », sans cartes', async () => {
  await db.sessions.clear()
  const session = twoStudents()
  await putSession({ ...session, projection: { mode: 'student', studentId: 'student-2' } })
  const { container } = renderAt('/present/session-1')
  await screen.findByText('Question A1')

  await updateSession('session-1', (s) => ({
    ...s,
    students: s.students.map((st) => (st.id === 'student-2' ? { ...st, attempts: [] } : st)),
  }))

  expect(await screen.findByText('Question 1 / 3')).toBeInTheDocument()
  expect(cards(container)).toHaveLength(0)
})
