import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { toMilli } from '@/domain/scoring/milli'
import type { AdjustmentStats, GradeStats, HistogramBin } from '@/domain/stats/types'
import { makeUi } from '@/testing/make-ui'
import { makeConfig } from '@/testing/student-fixtures'
import { GradesCard } from './grades-card'

const EMPTY: GradeStats = { count: 0, min: null, max: null, mean: null, median: null, stdDev: null }
const NO_ADJUSTMENT: AdjustmentStats = { count: 0, sum: toMilli(0), mean: null }
const BINS: HistogramBin[] = Array.from({ length: 20 }, (_, k) => ({
  from: k,
  to: k + 1,
  count: 0,
}))

/** Valeur (`dd`) qui suit le libellé `label` (`dt`). */
function figure(label: string): string {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling?.textContent ?? ''
}

function renderCard(grades: GradeStats, adjustments: AdjustmentStats = NO_ADJUSTMENT) {
  return render(
    <GradesCard
      ui={makeUi()}
      config={makeConfig()}
      grades={grades}
      histogram={BINS}
      adjustments={adjustments}
    />,
  )
}

test('aucun terminé : phrase à la place du dessin, chiffres en « — »', () => {
  const { container } = renderCard(EMPTY)
  const region = screen.getByRole('region', { name: 'Notes finales' })
  expect(screen.getByRole('heading', { level: 3, name: 'Notes finales' })).toHaveClass('text-h2')
  expect(within(region).getByText("Aucun étudiant n'a terminé.")).toBeInTheDocument()
  expect(container.querySelector('[data-bin]')).toBeNull()
  expect(figure('Étudiants notés')).toBe('0')
  for (const label of ['Minimum', 'Maximum', 'Écart-type']) expect(figure(label)).toBe('—')
})

test('notes : minimum et maximum au format des notes, écart-type à 2 décimales, dessin', () => {
  const { container } = renderCard({
    count: 2,
    min: toMilli(8),
    max: toMilli(17),
    mean: 12.5,
    median: 12.5,
    stdDev: 4.5,
  })
  expect(figure('Minimum')).toBe('8,00')
  expect(figure('Maximum')).toBe('17,00')
  expect(figure('Écart-type')).toBe('4,50')
  expect(container.querySelectorAll('[data-bin]')).toHaveLength(20)
})

test('pied : ajustements, somme signée et moyenne', () => {
  renderCard(EMPTY, { count: 2, sum: toMilli(1), mean: 0.5 })
  expect(screen.getByText(/^Ajustements/)).toHaveTextContent(
    'Ajustements 2 · somme +1,00 · moyenne 0,50',
  )
})
