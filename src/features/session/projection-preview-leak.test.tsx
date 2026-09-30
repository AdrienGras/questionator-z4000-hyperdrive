import 'fake-indexeddb/auto'
import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { NormalizedCategory } from '@/domain/config/normalize'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { renderAt } from '@/testing/render-at'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'

const categories: NormalizedCategory[] = [
  {
    id: 'a',
    label: 'Algorithmique',
    scale: [0, 0.37, 1],
    order: 1,
    questions: [1, 2, 3].map((n) => ({
      id: `a-${n}`,
      title: `Titre a-${n}`,
      tags: [],
      prompt: `Énoncé a-${n}`,
      answer: n === 3 ? 'ANSWER-7Q' : `Secret a-${n}`,
    })),
  },
]

class FauxResizeObserver {
  readonly cb: (entries: { contentRect: { width: number } }[]) => void
  constructor(cb: (entries: { contentRect: { width: number } }[]) => void) {
    this.cb = cb
  }
  observe() {
    this.cb([{ contentRect: { width: 384 } }])
  }
  disconnect() {}
}

beforeEach(async () => {
  vi.stubGlobal('ResizeObserver', FauxResizeObserver)
  localStorage.clear()
  await db.sessions.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('aperçu étanche : rien de réservé à l’examinateur', async () => {
  const base = makeConfig({ questionsPerStudent: 3, maxRawScore: 3, finalScale: 20 })
  const config = {
    ...base,
    categories,
    skips: { ...base.skips, enabled: true },
    presentation: { ...base.presentation, showCumulativeScore: false },
  }
  const student = makeStudent([0.37, { skipped: 'SKIP-7Q' }, 'pending'], {
    comment: 'COMMENT-7Q',
  })
  await putSession(
    makeSession({
      config,
      students: [student],
      activeStudentId: student.id,
      projection: { mode: 'student', studentId: student.id },
    }),
  )
  renderAt('/session/session-1')

  // Question en cours : la page examinateur montre la réponse attendue.
  await waitFor(() => expect(document.body.textContent).toContain('ANSWER-7Q'))
  const canvas = screen
    .getByRole('region', { name: 'Vue projetée' })
    .querySelector('[data-projection-canvas]')!
  await waitFor(() => expect(canvas.textContent).toContain('Énoncé a-3'))

  // Commentaire et motif de passe : lus dans la session stockée (visibles seulement dans le tiroir).
  const stored = await db.sessions.get('session-1')
  expect(stored?.students[0]?.comment).toBe('COMMENT-7Q')
  expect(stored?.students[0]?.attempts[1]?.skipReason).toBe('SKIP-7Q')

  const text = canvas.textContent
  for (const secret of ['ANSWER-7Q', 'COMMENT-7Q', 'SKIP-7Q', '0,37', '0.37']) {
    expect(text).not.toContain(secret)
  }
})
