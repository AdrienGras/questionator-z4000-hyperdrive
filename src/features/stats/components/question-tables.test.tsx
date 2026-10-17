import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { normalize } from '@/domain/config/normalize'
import { minimalConfig } from '@/testing/config-fixtures'
import { makeUi } from '@/testing/make-ui'
import { QuestionTables } from './question-tables'

function config() {
  const parsed = minimalConfig()
  parsed.categories[0] = {
    ...parsed.categories[0]!,
    label: 'Facile',
    color: '#21d3ee',
    questions: [
      { id: 'a-1', prompt: 'Question A1' },
      { id: 'a-2', prompt: 'Question A2' },
    ],
  }
  return normalize(parsed)
}

/** Largeur du remplissage de la barre « Part » de la ligne `name`. */
function share(name: RegExp): string | undefined {
  const row = screen.getByRole('rowheader', { name }).closest('tr')!
  return row.querySelector<HTMLElement>('[aria-hidden] > span')?.style.width
}

test('questions les plus tirées : catégorie sous le titre, part relative à la première', () => {
  render(
    <QuestionTables
      ui={makeUi()}
      config={config()}
      topDrawn={[
        { categoryId: 'a', questionId: 'a-1', count: 4 },
        { categoryId: 'a', questionId: 'a-2', count: 2 },
      ]}
      skipped={[]}
    />,
  )
  const table = screen.getByRole('table', { name: 'Questions les plus tirées' })
  expect(
    within(table)
      .getAllByRole('columnheader')
      .map((th) => th.textContent),
  ).toEqual(['Question', 'Part', 'Tirages'])
  expect(within(table).getByRole('rowheader', { name: 'Question A1 Facile' })).toBeInTheDocument()
  expect(share(/^Question A1/)).toBe('100%')
  expect(share(/^Question A2/)).toBe('50%')
  expect(screen.getByText('Aucune question passée.')).toBeInTheDocument()
})

test('questions passées : motifs puis passes', () => {
  render(
    <QuestionTables
      ui={makeUi()}
      config={config()}
      topDrawn={[]}
      skipped={[
        {
          categoryId: 'a',
          questionId: 'a-1',
          total: 3,
          reasons: [
            { reason: 'Hors programme', count: 2 },
            { reason: null, count: 1 },
          ],
        },
      ]}
    />,
  )
  const table = screen.getByRole('table', { name: 'Questions passées' })
  expect(
    within(table)
      .getAllByRole('columnheader')
      .map((th) => th.textContent),
  ).toEqual(['Question', 'Motifs', 'Passes'])
  const row = within(table)
    .getByRole('rowheader', { name: /^Question A1/ })
    .closest('tr')!
  expect(
    within(row)
      .getAllByRole('cell')
      .map((td) => td.textContent),
  ).toEqual(['Hors programme ×2, sans motif ×1', '3'])
})
