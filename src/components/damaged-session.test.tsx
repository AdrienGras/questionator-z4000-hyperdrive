import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import type { BackupIssue } from '@/domain/backup/issues'
import { serializeBackup } from '@/domain/backup/serialize'
import type { DamagedSession } from '@/lib/db/damaged-session'
import { downloadText } from '@/lib/download'
import type { Locale } from '@/lib/i18n/i18n'
import { makeUi } from '@/testing/make-ui'
import { DamagedSessionScreen } from './damaged-session'

vi.mock('@/lib/download', () => ({ downloadText: vi.fn<typeof downloadText>() }))

afterEach(() => {
  vi.clearAllMocks()
})

const ISSUES: BackupIssue[] = [
  {
    severity: 'error',
    code: 'unknown_active_student',
    path: ['session', 'activeStudentId'],
    params: { studentId: 'fantome' },
  },
  {
    severity: 'error',
    code: 'score_mismatch',
    path: ['session', 'students', 0, 'attempts', 1, 'score'],
    params: { outcome: 'scored' },
  },
]

const RAW = { id: 'session-1', name: 'Oral cassé', activeStudentId: 'fantome', extra: [1, 2] }

const DAMAGED: DamagedSession = { id: 'session-1', damaged: true, raw: RAW, issues: ISSUES }

/** `Link` exige un routeur : route racine seule, qui rend l'écran. */
function renderScreen(variant: 'examiner' | 'present', locale: Locale = 'fr') {
  const rootRoute = createRootRoute({
    component: () => (
      <DamagedSessionScreen ui={makeUi(locale)} damaged={DAMAGED} variant={variant} />
    ),
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return render(<RouterProvider router={router} />)
}

test('examinateur : titre, explication, export, retour, détails', async () => {
  renderScreen('examiner')

  expect(
    await screen.findByRole('heading', { name: 'Cette session est endommagée' }),
  ).toBeInTheDocument()
  expect(
    screen.getByText(
      'Le contenu enregistré est incohérent ; l’application ne peut pas l’ouvrir. Exportez un backup pour le conserver ou le corriger.',
    ),
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/')

  const details = screen.getByText('Détails').closest('details')
  expect(details).not.toBeNull()
  if (details === null) return
  for (const text of [
    'session.activeStudentId',
    "L'étudiant actif « fantome » n'existe pas.",
    'session.students[0].attempts[1].score',
    'Une question notée doit avoir une note.',
  ]) {
    expect(within(details).getByText(text)).toBeInTheDocument()
  }
})

test('examinateur : « Exporter un backup » télécharge le brut à l’identique', async () => {
  renderScreen('examiner')

  fireEvent.click(await screen.findByRole('button', { name: 'Exporter un backup' }))

  expect(downloadText).toHaveBeenCalledTimes(1)
  const [fileName, text] = vi.mocked(downloadText).mock.calls[0] ?? []
  expect(fileName).toMatch(/^oral-casse-backup-\d{4}-\d{2}-\d{2}\.json$/)
  // Même enveloppe que `serializeBackup(raw)`, hormis `exportedAt` (horodatage de l'appel).
  const expected: unknown = JSON.parse(serializeBackup(RAW))
  expect(JSON.parse(text ?? '')).toEqual({ ...Object(expected), exportedAt: expect.any(String) })
  expect(JSON.parse(text ?? '').session).toEqual(RAW)
})

test('projetée : titre seul, ni action ni détail', async () => {
  renderScreen('present')

  expect(
    await screen.findByRole('heading', { name: 'Cette session est endommagée' }),
  ).toBeInTheDocument()
  expect(screen.queryAllByRole('button')).toEqual([])
  expect(screen.queryAllByRole('link')).toEqual([])
  expect(screen.queryByText('Détails')).not.toBeInTheDocument()
  expect(screen.queryByText(/session\.activeStudentId/)).not.toBeInTheDocument()
  expect(screen.queryByText(/fantome/)).not.toBeInTheDocument()
})

test('anglais : libellés traduits', async () => {
  renderScreen('examiner', 'en')

  expect(
    await screen.findByRole('heading', { name: 'This session is damaged' }),
  ).toBeInTheDocument()
  expect(
    screen.getByText(
      'The saved content is inconsistent; the app cannot open it. Export a backup to keep it or fix it.',
    ),
  ).toBeInTheDocument()
  expect(screen.getByText('Details')).toBeInTheDocument()
})
