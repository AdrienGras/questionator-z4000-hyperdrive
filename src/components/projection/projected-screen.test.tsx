import { act, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { ProjectedScreen } from '@/components/projection/projected-screen'
import type { ProjectedView } from '@/domain/presentation/projected-view'
import { LocaleProvider } from '@/lib/i18n/locale-context'

const appearance: ProjectedView['appearance'] = {
  locale: 'fr',
  theme: { light: {}, dark: {} },
  presentation: { defaultColorMode: 'light' },
}

const waiting: ProjectedView = { mode: 'waiting', examTitle: 'Partiel de maths', appearance }

const student = (drawnAt: string, drawAnimation = false): ProjectedView => ({
  mode: 'student',
  examTitle: 'Partiel de maths',
  appearance,
  student: { firstName: 'Ada', lastName: 'Lovelace' },
  categories: [
    { id: 'algo', label: 'Algorithmique', maxPoints: 4, exhausted: false, disabled: false },
  ],
  current: { categoryId: 'algo', prompt: 'Énoncé secret', drawnAt },
  questionIndex: { current: 1, total: 3 },
  finished: false,
  drawAnimation,
})

const inFrench = (ui: ReactElement) => <LocaleProvider locale="fr">{ui}</LocaleProvider>

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

test('attente : titre de l’épreuve et message d’attente', () => {
  render(inFrench(<ProjectedScreen view={waiting} />))
  expect(screen.getByRole('heading', { name: 'Partiel de maths' })).toBeInTheDocument()
  expect(screen.getByText("L'épreuve va bientôt commencer.")).toBeInTheDocument()
})

test('étudiant : nom complet en titre', () => {
  render(inFrench(<ProjectedScreen view={student('T1')} />))
  expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument()
})

test('animate={false} : énoncé immédiat, sans cartes, même avec drawAnimation', () => {
  const { container, rerender } = render(
    inFrench(<ProjectedScreen view={student('T1', true)} animate={false} />),
  )
  rerender(inFrench(<ProjectedScreen view={student('T2', true)} animate={false} />))
  act(() => {
    vi.advanceTimersByTime(0)
  })
  expect(screen.getByText('Énoncé secret')).toBeInTheDocument()
  expect(container.querySelectorAll('[data-card]')).toHaveLength(0)
})

test('racine en @container, className transmis', () => {
  const { container } = render(inFrench(<ProjectedScreen view={waiting} className="min-h-svh" />))
  expect(container.firstElementChild).toHaveClass('@container', 'min-h-svh')
})
