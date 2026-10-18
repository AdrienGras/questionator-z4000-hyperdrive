import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { makeUi } from '@/testing/make-ui'
import { makeTrainingConfig } from '@/testing/training-fixtures'
import { TrainingQuestion } from './training-question'

function colorConfig() {
  const config = makeTrainingConfig()
  const b = config.categories[1]
  if (b === undefined) throw new Error('fixture inattendue')
  b.color = '#a78bfa'
  return config
}

function mount(
  questionId: string,
  options: { disabled?: boolean; config?: ReturnType<typeof makeTrainingConfig> } = {},
) {
  const onScore = vi.fn<(points: number) => void>()
  const onPass = vi.fn<() => void>()
  render(
    <TrainingQuestion
      ui={makeUi('fr')}
      config={options.config ?? makeTrainingConfig()}
      questionId={questionId}
      disabled={options.disabled ?? false}
      animate={false}
      focusOnMount={false}
      onScore={onScore}
      onPass={onPass}
    />,
  )
  return { onScore, onPass }
}

test('« Passer » reste disponible après la révélation ; noter remonte la valeur du barème', () => {
  const { onScore, onPass } = mount('b-1')

  fireEvent.click(screen.getByRole('button', { name: 'Voir la réponse' }))
  fireEvent.click(screen.getByRole('button', { name: 'Noter 0,5' }))
  fireEvent.click(screen.getByRole('button', { name: 'Passer' }))

  expect(onScore).toHaveBeenCalledWith(0.5)
  expect(onPass).toHaveBeenCalledOnce()
  expect(screen.queryByRole('button', { name: 'Voir la réponse' })).not.toBeInTheDocument()
})

test('écriture en cours : barème et « Passer » désactivés', () => {
  mount('b-1', { disabled: true })
  fireEvent.click(screen.getByRole('button', { name: 'Voir la réponse' }))

  expect(screen.getByRole('button', { name: 'Passer' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Noter 1' })).toBeDisabled()
})

test('question absente de la config : un message, et seulement « Passer »', () => {
  const { onPass } = mount('disparue')

  expect(screen.getByText('Cette question n’existe plus dans la config.')).toBeInTheDocument()
  expect(
    screen
      .getByRole('region', { name: 'Question en cours' })
      .style.getPropertyValue('--category-color'),
  ).toBe('')
  expect(screen.queryByRole('button', { name: 'Voir la réponse' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Passer' }))
  expect(onPass).toHaveBeenCalledOnce()
})

test('en-tête : niveau et points, carte teintée de la catégorie', () => {
  mount('b-1', { config: colorConfig() })
  const region = screen.getByRole('region', { name: 'Question en cours' })
  expect(region).toHaveTextContent('B · 1 pt')
  expect(region.style.getPropertyValue('--category-color')).toBe('#a78bfa')
})

test('« Masquer » replie la réponse, la notation reste', async () => {
  mount('b-1')
  fireEvent.click(screen.getByRole('button', { name: 'Voir la réponse' }))
  const details = screen.getByRole('heading', { level: 3, name: 'Réponse' }).closest('details')
  expect(details).toHaveAttribute('open')
  fireEvent.click(screen.getByText('Masquer'))
  expect(details).not.toHaveAttribute('open')
  // `toggle` est un événement asynchrone, comme dans le navigateur.
  expect(await screen.findByText('Afficher')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Noter 1' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Passer' })).toBeEnabled()
})

test('« Notez-vous · sur N » au-dessus du barème', () => {
  mount('b-1')
  fireEvent.click(screen.getByRole('button', { name: 'Voir la réponse' }))
  expect(screen.getByRole('heading', { level: 3, name: 'Notez-vous · sur 1' })).toBeInTheDocument()
})
