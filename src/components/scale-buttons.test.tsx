import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { makeConfig } from '@/testing/student-fixtures'
import { makeUi } from '@/testing/make-ui'
import { ScaleButtons } from './scale-buttons'

test('un bouton par valeur, formaté en français, nom « Noter 0,5 »', () => {
  const onScore = vi.fn<(value: number) => void>()
  render(
    <ScaleButtons
      ui={makeUi()}
      config={makeConfig()}
      scale={[0, 0.5, 1]}
      disabled={false}
      onScore={onScore}
    />,
  )
  expect(screen.getAllByRole('button')).toHaveLength(3)
  fireEvent.click(screen.getByRole('button', { name: 'Noter 0,5' }))
  expect(onScore).toHaveBeenCalledWith(0.5)
})

test('grille qui s’adapte au nombre de valeurs', () => {
  const { container } = render(
    <ScaleButtons
      ui={makeUi()}
      config={makeConfig()}
      scale={[0, 1]}
      disabled={false}
      onScore={vi.fn<(value: number) => void>()}
    />,
  )
  expect(container.firstElementChild).toHaveClass('grid')
  expect(screen.getByRole('button', { name: 'Noter 1' })).toHaveClass('h-16')
})
