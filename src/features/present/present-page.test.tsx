import 'fake-indexeddb/auto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
import { editScore } from '@/domain/passage/edit-score'
import type { Session, Student } from '@/domain/session/types'
import { db } from '@/lib/db/db'
import { putSession, updateSession } from '@/lib/db/sessions'
import { renderAt } from '@/testing/render-at'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'

const categories: NormalizedCategory[] = [
  {
    id: 'a',
    label: 'Algorithmique',
    scale: [0, 1, 2, 3],
    order: 1,
    color: '#ff0000',
    questions: [1, 2, 3, 4].map((n) => ({
      id: `a-${n}`,
      title: `Titre a-${n}`,
      tags: [],
      prompt: `Énoncé a-${n}`,
      answer: `Secret a-${n}`,
    })),
  },
  {
    id: 'b',
    label: 'Bases de données',
    scale: [0, 1, 2],
    order: 2,
    questions: [{ id: 'b-1', title: 'Titre b-1', tags: [], prompt: 'Énoncé b-1' }],
  },
]

function config(presentation: Partial<NormalizedConfig['presentation']> = {}): NormalizedConfig {
  const base = makeConfig({ questionsPerStudent: 3, maxRawScore: 9, finalScale: 20 })
  return {
    ...base,
    categories,
    skips: { ...base.skips, enabled: true },
    presentation: { ...base.presentation, ...presentation },
  }
}

async function seed(student: Student | undefined, presentation = {}): Promise<Session> {
  const session = makeSession({
    config: config(presentation),
    students: student === undefined ? [] : [student],
    projection:
      student === undefined ? { mode: 'waiting' } : { mode: 'student', studentId: student.id },
  })
  await putSession(session)
  return session
}

beforeEach(async () => {
  localStorage.clear()
  await db.sessions.clear()
})

test('projection en attente : titre de l’épreuve et message, aucun nom', async () => {
  await seed(makeStudent())
  await updateSession('session-1', (s) => ({ ...s, projection: { mode: 'waiting' } }))
  renderAt('/present/session-1')

  expect(await screen.findByRole('heading', { name: 'Oral de test' })).toBeInTheDocument()
  expect(screen.getByText("L'épreuve va bientôt commencer.")).toBeInTheDocument()
  expect(screen.queryByText(/Durand/)).not.toBeInTheDocument()
})

test('la vue projetée n’est pas dans la coque : pas de lien de retour à l’accueil', async () => {
  await seed(makeStudent())
  renderAt('/present/session-1')

  await screen.findByText(/Alice/)
  expect(screen.queryByRole('link', { name: "Retour à l'accueil" })).not.toBeInTheDocument()
})

test('étudiant sans tirage : nom, une tuile par catégorie, « Question 1 / 3 », rien de cliquable', async () => {
  await seed(makeStudent())
  renderAt('/present/session-1')

  expect(await screen.findByText(/Alice/)).toHaveTextContent('Durand')
  expect(screen.getByText('Algorithmique')).toBeInTheDocument()
  expect(screen.getByText('Bases de données')).toBeInTheDocument()
  expect(screen.getByText('Question 1 / 3')).toBeInTheDocument()
  expect(screen.queryAllByRole('button').map((b) => b.textContent)).not.toContain('Algorithmique')
  expect(screen.getByText('Algorithmique').closest('[tabindex]')).toBeNull()
})

test('question en cours : énoncé affiché, réponse absente', async () => {
  await seed(makeStudent(['pending']))
  renderAt('/present/session-1')

  expect(await screen.findByText('Énoncé a-1')).toBeInTheDocument()
  expect(screen.queryByText(/Secret a-1/)).not.toBeInTheDocument()
})

test('terminé : pas de note tant que non révélé, puis note, puis correction visible', async () => {
  await seed(makeStudent([2, 1, 3]))
  renderAt('/present/session-1')

  expect(await screen.findByText('Passage terminé')).toBeInTheDocument()
  expect(screen.queryByText(/Note :/)).not.toBeInTheDocument()

  await updateSession('session-1', (s) => ({
    ...s,
    students: s.students.map((st) => ({ ...st, finalRevealedAt: '2026-09-25T10:00:00.000Z' })),
  }))
  const revealed = await screen.findByText(/Note : .* \/ 20/)
  const before = revealed.textContent

  await updateSession('session-1', (s) =>
    editScore(
      s,
      { studentId: 'student-1', attemptId: 'attempt-1', score: 0 },
      { now: () => new Date() },
    ),
  )
  await waitFor(() => expect(screen.getByText(/Note : .* \/ 20/).textContent).not.toBe(before))
})

test('score cumulé affiché avec le format de la locale', async () => {
  await seed(makeStudent([3, 'pending']), { showCumulativeScore: true })
  renderAt('/present/session-1')

  expect(await screen.findByText('Score : 3')).toBeInTheDocument()
})

test('détail final : titres et « Passée » pour une passe', async () => {
  await seed(
    makeStudent([2, { skipped: 'x' }, 1, 1], { finalRevealedAt: '2026-09-25T10:00:00.000Z' }),
    {
      showStatsOnFinal: true,
    },
  )
  renderAt('/present/session-1')

  expect(await screen.findByText('Titre a-1')).toBeInTheDocument()
  expect(screen.getByText('Titre a-2')).toBeInTheDocument()
  expect(screen.getByText('Passée')).toBeInTheDocument()
})

test('session supprimée pendant l’affichage : écran « introuvable »', async () => {
  await seed(makeStudent())
  renderAt('/present/session-1')
  await screen.findByText(/Alice/)

  await db.sessions.delete('session-1')

  expect(await screen.findByText('Session introuvable')).toBeInTheDocument()
})

test('aucun import du modèle de session dans src/features/present', () => {
  const root = join(process.cwd(), 'src/features/present')
  const files = readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.test.tsx'))
    .map((f) => join(root, f))
  expect(files.length).toBeGreaterThan(0)
  const offenders = files.filter((file) => {
    const source = readFileSync(file, 'utf8')
    return source.includes('domain/session/types') || source.includes('NormalizedConfig')
  })
  expect(offenders).toEqual([])
})

test('tuiles : même disposition que la vue examinateur, 2 catégories sur une ligne (D74)', async () => {
  await seed(makeStudent())
  renderAt('/present/session-1')

  const tile = await screen.findByText('Algorithmique')
  const list = tile.closest('ul')

  expect(list?.style.getPropertyValue('--cols')).toBe('4')
  expect(list?.querySelectorAll('li[data-row-start="true"]')).toHaveLength(0)
})
