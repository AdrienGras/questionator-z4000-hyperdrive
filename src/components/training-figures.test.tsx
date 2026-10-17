import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { makeUi } from '@/testing/make-ui'
import { TrainingFigures } from './training-figures'

const CIRCUMFERENCE = 2 * Math.PI * 26

/** Premier nombre du `stroke-dasharray` de l'arc, `undefined` sans arc. */
function arcLength(container: HTMLElement): number | undefined {
  const arc = container.querySelector('circle[stroke-dasharray]')
  return arc === null ? undefined : Number(arc.getAttribute('stroke-dasharray')?.split(' ')[0])
}

test('72 % de réussite et 38 / 60 questions notées', () => {
  const { container } = render(
    <TrainingFigures
      ui={makeUi()}
      summary={{ rate: 0.72, coverage: { covered: 38, total: 60 } }}
      showCoverage
    />,
  )
  // `Intl` sépare le signe % par une espace insécable fine.
  expect(screen.getByText(/^Taux de réussite : 72\s%$/u)).toBeInTheDocument()
  expect(screen.getByText(/^72\s%$/u)).toBeInTheDocument()
  expect(screen.getByText('de réussite')).toBeInTheDocument()
  expect(screen.getByText('38')).toBeInTheDocument()
  expect(screen.getByText('/ 60')).toBeInTheDocument()
  expect(screen.getByText('questions notées')).toBeInTheDocument()
  expect(arcLength(container)).toBeCloseTo(0.72 * CIRCUMFERENCE)
})

test('sans la couverture : ni nombre de questions ni libellé', () => {
  render(
    <TrainingFigures
      ui={makeUi()}
      summary={{ rate: 0.5, coverage: { covered: 1, total: 4 } }}
      showCoverage={false}
    />,
  )
  expect(screen.queryByText('questions notées')).not.toBeInTheDocument()
})

test('sans note : « — » et anneau sans arc', () => {
  const { container } = render(
    <TrainingFigures
      ui={makeUi()}
      summary={{ rate: null, coverage: { covered: 0, total: 4 } }}
      showCoverage
    />,
  )
  expect(screen.getByText('—')).toBeInTheDocument()
  expect(screen.getByText('Taux de réussite : —')).toBeInTheDocument()
  expect(arcLength(container)).toBeUndefined()
})

test('taux hors bornes : arc borné au cercle', () => {
  const { container } = render(
    <TrainingFigures
      ui={makeUi()}
      summary={{ rate: 1.2, coverage: { covered: 4, total: 4 } }}
      showCoverage
    />,
  )
  expect(arcLength(container)).toBeLessThanOrEqual(CIRCUMFERENCE)
})
