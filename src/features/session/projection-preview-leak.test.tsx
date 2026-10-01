import 'fake-indexeddb/auto'
import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { NormalizedCategory } from '@/domain/config/normalize'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { renderAt } from '@/testing/render-at'
import { FixedWidthResizeObserver } from '@/testing/resize-observer'
import { makeSession } from '@/testing/session-fixtures'
import { openSidePanel } from '@/testing/side-panel-assertions'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'

const categories: NormalizedCategory[] = [
  {
    id: 'a',
    label: 'Algorithmique',
    scale: [0, 0.37, 1],
    order: 1,
    // Quatre questions : trois par étudiant plus une passe, sinon la session est endommagée (F31).
    questions: [1, 2, 3, 4].map((n) => ({
      id: `a-${n}`,
      title: `Titre a-${n}`,
      tags: [],
      prompt: `Énoncé a-${n}`,
      answer: n === 3 ? 'ANSWER-7Q' : `Secret a-${n}`,
    })),
  },
]

beforeEach(async () => {
  vi.stubGlobal('ResizeObserver', FixedWidthResizeObserver)
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

  // Commentaire et motif de passe : bien présents dans le DOM examinateur (onglet « Étudiant » du
  // tiroir), pour que leur absence de l'aperçu prouve quelque chose.
  const panel = await openSidePanel('Étudiant')
  expect(within(panel).getByRole('textbox', { name: 'Commentaire' })).toHaveValue('COMMENT-7Q')
  expect(within(panel).getByText(/SKIP-7Q/)).toBeInTheDocument()

  const text = canvas.textContent
  for (const secret of ['ANSWER-7Q', 'COMMENT-7Q', 'SKIP-7Q']) {
    expect(text).not.toContain(secret)
  }
  // La note 0,37 : nombre exact parmi les nombres du canevas, pas en sous-chaîne (10,37 passerait).
  const numbers = text.match(/\d+(?:[.,]\d+)?/g) ?? []
  expect(numbers.map((n) => Number(n.replace(',', '.')))).not.toContain(0.37)
})
