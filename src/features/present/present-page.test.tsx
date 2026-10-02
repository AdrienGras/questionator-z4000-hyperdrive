import 'fake-indexeddb/auto'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
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

afterEach(() => {
  vi.useRealTimers()
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
  expect(screen.queryByRole('link', { name: 'Retour à l’accueil' })).not.toBeInTheDocument()
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

test('session endommagée : titre seul, ni action ni détail (F31)', async () => {
  const session = await seed(makeStudent())
  await putSession({ ...session, activeStudentId: 'fantome' })
  renderAt('/present/session-1')

  expect(
    await screen.findByRole('heading', { name: 'Cette session est endommagée' }),
  ).toBeInTheDocument()
  expect(screen.queryAllByRole('button')).toEqual([])
  expect(screen.queryByText('Détails')).not.toBeInTheDocument()
  expect(screen.queryByText(/fantome/)).not.toBeInTheDocument()
})

test('session corrompue pendant l’affichage : bascule sur l’écran « endommagée » (F31)', async () => {
  const session = await seed(makeStudent())
  renderAt('/present/session-1')
  await screen.findByText(/Alice/)

  await db.sessions.put({ ...session, activeStudentId: 'fantome' })

  expect(
    await screen.findByRole('heading', { name: 'Cette session est endommagée' }),
  ).toBeInTheDocument()
  expect(screen.queryByText(/Alice/)).not.toBeInTheDocument()
})

/** Fichiers source (hors tests) de `dir`, chemins relatifs à la racine du dépôt. */
function sourceFiles(dir: string): string[] {
  return readdirSync(join(process.cwd(), dir), { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
    .map((f) => join(dir, f))
}

/** Spécificateurs des `import … from`, `export … from` et `import()` d'un source formaté (oxfmt). */
function specifiers(source: string): string[] {
  const found = source.matchAll(/(?:\bfrom |\bimport\(|^import )'([^']+)'/gm)
  return [...found].map((match) => match[1] ?? '')
}

/** Fichier visé par un spécificateur `@/…` ou relatif, sans extension ; `undefined` sinon. */
function target(specifier: string, from: string): string | undefined {
  if (specifier.startsWith('@/')) return join('src', specifier.slice(2))
  if (specifier.startsWith('.')) return join(dirname(from), specifier)
  return undefined
}

const withoutExtension = (file: string) => file.replace(/\.tsx?$/, '')

/**
 * Modules qui exposent le modèle de session : `domain/session/types` et, de proche en proche, tout
 * module qui en réexporte (`export … from`), pour qu'un réexport ne serve pas de détour.
 */
function sessionModelModules(sources: ReadonlyMap<string, string>): Set<string> {
  const model = new Set(['src/domain/session/types'])
  let grew = true
  while (grew) {
    grew = false
    for (const [file, source] of sources) {
      const module = withoutExtension(file)
      if (model.has(module)) continue
      const reexports = [
        ...source.matchAll(/^export (?:type )?(?:\*(?: as \w+)?|\{[^}]*\}) from '([^']+)'/gm),
      ]
      if (reexports.some((m) => model.has(target(m[1] ?? '', file) ?? ''))) {
        model.add(module)
        grew = true
      }
    }
  }
  return model
}

/** Fichiers de `files` qui importent le modèle de session, directement ou par un réexport. */
function sessionModelImporters(files: string[], sources: ReadonlyMap<string, string>): string[] {
  const model = sessionModelModules(sources)
  return files.filter((file) => {
    const source = sources.get(file) ?? ''
    return (
      specifiers(source).some((s) => model.has(target(s, file) ?? '')) ||
      source.includes('NormalizedConfig')
    )
  })
}

test('détecteur d’imports du modèle : direct, par réexport en chaîne, pas un module voisin', () => {
  const sources = new Map([
    ['src/domain/session/types.ts', 'export type Session = {}'],
    ['src/lib/a.ts', "export type { Session } from '@/domain/session/types'"],
    ['src/lib/b.ts', "export * from './a'"],
    ['src/lib/c.ts', "import type { Session } from '@/domain/session/types'\nexport const c = 1"],
    ['src/x/direct.tsx', "import type { Session } from '@/domain/session/types'"],
    ['src/x/chained.tsx', "import { type Session } from '@/lib/b'"],
    ['src/x/neighbour.tsx', "import { c } from '@/lib/c'"],
  ])

  expect(
    sessionModelImporters(
      ['src/x/direct.tsx', 'src/x/chained.tsx', 'src/x/neighbour.tsx'],
      sources,
    ),
  ).toEqual(['src/x/direct.tsx', 'src/x/chained.tsx'])
})

test.each(['src/features/present', 'src/components/projection'])(
  'aucun import du modèle de session dans %s, même par un réexport',
  (dir) => {
    const files = sourceFiles(dir)
    expect(files.length).toBeGreaterThan(0)
    const all = sourceFiles('src')
    const sources = new Map(
      all.map((file) => [file, readFileSync(join(process.cwd(), file), 'utf8')]),
    )
    expect(sessionModelImporters(files, sources)).toEqual([])
  },
)

test('tuiles : même disposition que la vue examinateur, 2 catégories sur une ligne (D74)', async () => {
  await seed(makeStudent())
  renderAt('/present/session-1')

  const tile = await screen.findByText('Algorithmique')
  const list = tile.closest('ul')

  expect(list?.style.getPropertyValue('--cols')).toBe('4')
  expect(list?.querySelectorAll('li[data-row-start="true"]')).toHaveLength(0)
})

test('pointeur masqué après 3 s d’inactivité, rendu au premier mouvement', async () => {
  // `shouldAdvanceTime` : la liveQuery de la page avance au rythme réel, le délai d'inactivité se
  // saute d'un coup.
  vi.useFakeTimers({ shouldAdvanceTime: true })
  await seed(makeStudent())
  renderAt('/present/session-1')
  const main = (await screen.findByText(/Alice/)).closest('main')
  // Le délai court depuis le montage, avant les données : sous charge, le temps réel passé à
  // attendre l'affichage peut déjà l'avoir épuisé. Un mouvement le relance à zéro.
  fireEvent.mouseMove(window)
  expect(main).not.toHaveClass('cursor-none')

  act(() => {
    vi.advanceTimersByTime(3000)
  })
  expect(main).toHaveClass('cursor-none')

  fireEvent.mouseMove(window)
  expect(main).not.toHaveClass('cursor-none')
})
