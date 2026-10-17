import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { makeUi } from '@/testing/make-ui'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ScoreCard } from './score-card'

const normal: NormalizedCategory = {
  id: 'a',
  label: 'Normal',
  scale: [0, 0.5, 1, 1.5, 2],
  order: 1,
  questions: [{ id: 'a-1', title: 'Portée', tags: [], prompt: 'a-1' }],
}

function withSkips(skips: NormalizedConfig['skips']): NormalizedConfig {
  return { ...makeConfig(), categories: [normal], skips }
}

const enabled: NormalizedConfig['skips'] = {
  enabled: true,
  maxPerStudent: 2,
  reasons: [],
  allowFreeText: false,
}

function renderCard(config: NormalizedConfig, skipsRemaining = 2) {
  const onScore = vi.fn<(attemptId: string, value: number) => void>()
  const onSkip = vi.fn<(attemptId: string, reason: string | undefined) => void>()
  const attempt = makeStudent(['pending']).attempts[0]!
  render(
    <TooltipProvider>
      <ScoreCard
        ui={makeUi()}
        config={config}
        attempt={attempt}
        disabled={false}
        skipsRemaining={skipsRemaining}
        onScore={onScore}
        onSkip={onSkip}
      />
    </TooltipProvider>,
  )
  return { onScore, onSkip }
}

test('note en un clic : « Noter 1 » appelle onScore et rien n’est sélectionné', () => {
  const { onScore } = renderCard(withSkips(enabled))
  fireEvent.click(screen.getByRole('button', { name: 'Noter 1' }))
  expect(onScore).toHaveBeenCalledWith('attempt-1', 1)
  for (const button of screen.getAllByRole('button', { name: /^Noter / })) {
    expect(button).not.toHaveAttribute('aria-pressed', 'true')
  }
})

test('contexte « Normal, sur 2 » et passes restantes', () => {
  renderCard(withSkips(enabled))
  expect(screen.getByRole('region', { name: 'Noter la question' })).toBeInTheDocument()
  expect(screen.getByText('Normal, sur 2')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Passer la question' })).toBeInTheDocument()
  expect(screen.getByText('2 passes restantes')).toBeInTheDocument()
})

test('skips désactivés : ni bouton ni compteur', () => {
  renderCard(withSkips({ ...enabled, enabled: false }))
  expect(screen.queryByRole('button', { name: 'Passer la question' })).not.toBeInTheDocument()
  expect(screen.queryByText(/passes? restantes?/)).not.toBeInTheDocument()
})

test('quota atteint : bouton aria-disabled, motif décrit, clic sans effet', () => {
  const { onSkip } = renderCard(withSkips(enabled), 0)
  const button = screen.getByRole('button', { name: 'Passer la question' })
  expect(button).toHaveAttribute('aria-disabled', 'true')
  expect(button).toHaveAccessibleDescription('Plus de passe disponible pour cet étudiant.')
  expect(screen.getByText('Aucune passe restante')).toBeInTheDocument()
  fireEvent.click(button)
  expect(onSkip).not.toHaveBeenCalled()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
