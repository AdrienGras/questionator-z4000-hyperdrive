import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { makeUi } from '@/testing/make-ui'
import { makeTrainingConfig } from '@/testing/training-fixtures'
import { TrainingQuestion } from './training-question'

function mount(questionId: string, options: { disabled?: boolean } = {}) {
  const onScore = vi.fn<(points: number) => void>()
  const onPass = vi.fn<() => void>()
  render(
    <TrainingQuestion
      ui={makeUi('fr')}
      config={makeTrainingConfig()}
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
  expect(screen.queryByRole('button', { name: 'Voir la réponse' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Passer' }))
  expect(onPass).toHaveBeenCalledOnce()
})
