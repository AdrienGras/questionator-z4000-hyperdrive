import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { computeTrainingStats } from '@/domain/training/training-stats'
import { makeUi } from '@/testing/make-ui'
import { makeStatsDraws, makeTrainingConfig } from '@/testing/training-fixtures'
import { QuestionDetails } from './question-details'
import { rowCells } from '@/testing/table-assertions'

const percent = (value: number) => new Intl.NumberFormat('fr', { style: 'percent' }).format(value)
const levels = new Map([
  ['a', 'A'],
  ['b', 'B'],
])

test('détail replié par défaut, puis une ligne par question une fois ouvert', () => {
  const stats = computeTrainingStats(makeTrainingConfig(), makeStatsDraws())
  render(<QuestionDetails ui={makeUi()} questions={stats.questions} levels={levels} />)

  const summary = screen.getByText('Détail des 4 questions')
  const details = summary.closest('details')
  expect(details).not.toHaveAttribute('open')

  fireEvent.click(summary)

  expect(details).toHaveAttribute('open')
  const table = screen.getByRole('table', { name: 'Détail des 4 questions' })
  expect(
    within(table)
      .getAllByRole('rowheader')
      .map((h) => h.textContent),
  ).toEqual(['Question A1', 'Question A2', 'Question A3', 'Question B1'])
  expect(rowCells(table, 'Question A1')).toEqual(['A', '2', '0,5 / 2', percent(0.63), 'À revoir'])
  expect(rowCells(table, 'Question A2')).toEqual(['A', '1', '2 / 2', percent(1), ''])
  expect(rowCells(table, 'Question B1')).toEqual(['B', '0', '—', '—', ''])
})
