import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { normalize } from '@/domain/config/normalize'
import type { CategoryStats } from '@/domain/stats/types'
import { minimalConfig } from '@/testing/config-fixtures'
import { makeUi } from '@/testing/make-ui'
import { CategoryRings } from './category-rings'

function config() {
  const parsed = minimalConfig()
  parsed.categories = [
    { ...parsed.categories[0]!, id: 'facile', label: 'Facile', color: '#21d3ee' },
    { ...parsed.categories[0]!, id: 'normal', label: 'Normal' },
  ]
  return normalize(parsed)
}

const CATEGORIES: CategoryStats[] = [
  { categoryId: 'facile', choices: 6, scored: 6, successRate: 5 / 6 },
  { categoryId: 'normal', choices: 1, scored: 1, successRate: null },
  { categoryId: 'disparue', choices: 2, scored: 0, successRate: null },
]

test('un anneau par catégorie : phrase, libellé coloré, notées et choix', () => {
  render(<CategoryRings ui={makeUi()} config={config()} categories={CATEGORIES} />)
  expect(screen.getByRole('region', { name: 'Réussite par catégorie' })).toBeInTheDocument()
  expect(screen.getByText(/^Réussite Facile : 83,3\s%$/u)).toHaveClass('sr-only')
  expect(screen.getByText('Réussite Normal : —')).toBeInTheDocument()
  expect(screen.getByText('6 notées · 6 choix')).toBeInTheDocument()
  expect(screen.getByText('1 notée · 1 choix')).toBeInTheDocument()
})

test('catégorie absente de la config : son id, sans couleur', () => {
  render(<CategoryRings ui={makeUi()} config={config()} categories={CATEGORIES} />)
  expect(screen.getByText('disparue', { selector: 'span' })).toHaveClass('text-muted-foreground')
  expect(screen.getByText('Réussite disparue : —')).toBeInTheDocument()
})
