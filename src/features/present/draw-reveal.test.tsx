import 'fake-indexeddb/auto'
import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { Attempt, Session } from '@/domain/session/types'
import { DrawReveal } from '@/components/projection/draw-reveal'
import { db } from '@/lib/db/db'
import { putSession, updateSession } from '@/lib/db/sessions'
import { setReducedMotion } from '@/testing/match-media'
import { renderAt } from '@/testing/render-at'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeSecondStudent, makeStudent } from '@/testing/student-fixtures'

const PROMPT = 'Question A1'
const T1 = '2026-09-25T09:00:00.000Z'
const T2 = '2026-09-25T09:05:00.000Z'
const T3 = '2026-09-25T09:10:00.000Z'

const cards = (container: HTMLElement) => container.querySelectorAll('[data-card]')

const reveal = (animate: boolean) => (
  <DrawReveal color="#ff0000" animate={animate}>
    <p>Énoncé secret</p>
  </DrawReveal>
)

describe('DrawReveal', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('sans animation : énoncé direct, aucune carte', () => {
    const { container } = render(reveal(false))
    expect(screen.getByText('Énoncé secret')).toBeInTheDocument()
    expect(cards(container)).toHaveLength(0)
  })

  test('animé : cartes neutres sans texte, puis énoncé après 1 500 ms', () => {
    const { container } = render(reveal(true))
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

  test('mouvement réduit : pas de cartes, fondu sur l’énoncé', () => {
    setReducedMotion(true)
    const { container } = render(reveal(true))
    expect(cards(container)).toHaveLength(0)
    expect(screen.getByText('Énoncé secret').parentElement).toHaveClass('fade-in')
  })
})

// Pages : liveQuery a besoin de vrais timers.
function attempt(n: number, outcome: 'pending' | 'scored', drawnAt: string): Attempt {
  const base = { id: `attempt-${n}`, categoryId: 'a', questionId: 'a-1', drawnAt }
  return outcome === 'pending' ? { ...base, outcome } : { ...base, outcome, score: 1 }
}

function sessionWith(
  attempts: Attempt[],
  options: { animation?: boolean; other?: Attempt[] } = {},
): Session {
  const config = makeConfig({ questionsPerStudent: 3, maxRawScore: 9, finalScale: 20 })
  return makeSession({
    config: {
      ...config,
      presentation: { ...config.presentation, drawAnimation: options.animation ?? true },
    },
    students: [
      makeStudent([], { attempts }),
      makeSecondStudent([], { attempts: options.other ?? [] }),
    ],
    projection: { mode: 'student', studentId: 'student-1' },
  })
}

function setAttempts(studentId: string, attempts: Attempt[]) {
  return updateSession('session-1', (s) => ({
    ...s,
    students: s.students.map((st) => (st.id === studentId ? { ...st, attempts } : st)),
  }))
}

describe('vue projetée', () => {
  beforeEach(() => db.sessions.clear())

  test('tirage en direct : cartes sans énoncé, puis énoncé et plus de cartes', async () => {
    await putSession(sessionWith([]))
    const { container } = renderAt('/present/session-1')
    await screen.findByText('Question 1 / 3')

    await setAttempts('student-1', [attempt(1, 'pending', T2)])

    await waitFor(() => expect(cards(container)).toHaveLength(3))
    expect(screen.queryByText(PROMPT)).not.toBeInTheDocument()
    expect(await screen.findByText(PROMPT)).toBeInTheDocument()
    expect(cards(container)).toHaveLength(0)
  })

  test('réouverture en cours de question : énoncé immédiat, aucune carte', async () => {
    await putSession(sessionWith([attempt(1, 'pending', T1)]))
    const { container } = renderAt('/present/session-1')

    await screen.findByText(/Alice/)
    await waitFor(() => expect(screen.getByText(PROMPT)).toBeInTheDocument())
    expect(cards(container)).toHaveLength(0)
  })

  test('changement d’étudiant : énoncé du nouvel étudiant tout de suite, sans cartes', async () => {
    await putSession(sessionWith([], { other: [attempt(1, 'pending', T1)] }))
    const { container } = renderAt('/present/session-1')
    await screen.findByText(/Alice/)

    await updateSession('session-1', (s) => ({
      ...s,
      projection: { mode: 'student', studentId: 'student-2' },
    }))
    await screen.findByText(/Bob/)

    expect(screen.getByText(PROMPT)).toBeInTheDocument()
    expect(cards(container)).toHaveLength(0)
  })

  test('réinitialisation : « Question 1 / 3 » sans cartes, puis un nouveau tirage anime', async () => {
    await putSession(sessionWith([attempt(1, 'pending', T1)]))
    const { container } = renderAt('/present/session-1')
    await screen.findByText(PROMPT)

    await setAttempts('student-1', [])
    // « Question 1 / 3 » s'affichait déjà avec la question en cours : seule la disparition de
    // l'énoncé prouve que la réinitialisation est arrivée à l'écran.
    await waitFor(() => expect(screen.queryByText(PROMPT)).not.toBeInTheDocument())
    expect(screen.getByText('Question 1 / 3')).toBeInTheDocument()
    expect(cards(container)).toHaveLength(0)

    await setAttempts('student-1', [attempt(2, 'pending', T3)])
    await waitFor(() => expect(cards(container)).toHaveLength(3))
    expect(screen.queryByText(PROMPT)).not.toBeInTheDocument()
  })

  test('animation coupée : nouveau tirage affiché directement', async () => {
    await putSession(sessionWith([], { animation: false }))
    const { container } = renderAt('/present/session-1')
    await screen.findByText('Question 1 / 3')

    await setAttempts('student-1', [attempt(1, 'pending', T2)])

    expect(await screen.findByText(PROMPT)).toBeInTheDocument()
    expect(cards(container)).toHaveLength(0)
  })

  test('mouvement réduit : fondu à chaque nouveau tirage', async () => {
    setReducedMotion(true)
    await putSession(sessionWith([]))
    const { container } = renderAt('/present/session-1')
    await screen.findByText('Question 1 / 3')

    await setAttempts('student-1', [attempt(1, 'pending', T2)])
    expect((await screen.findByText(PROMPT)).closest('.fade-in')).not.toBeNull()
    expect(cards(container)).toHaveLength(0)

    await setAttempts('student-1', [attempt(1, 'scored', T2)])
    await waitFor(() => expect(screen.queryByText(PROMPT)).not.toBeInTheDocument())
    await setAttempts('student-1', [attempt(1, 'scored', T2), attempt(2, 'pending', T3)])
    expect((await screen.findByText(PROMPT)).closest('.fade-in')).not.toBeNull()
  })
})
