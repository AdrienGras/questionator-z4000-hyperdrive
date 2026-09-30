import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { CategoryLayout } from './category-layout'

function mount(n: number) {
  const items = Array.from({ length: n }, (_, i) => `c${i + 1}`)
  render(
    <CategoryLayout
      aria-label="Catégories"
      items={items}
      itemKey={(item) => item}
      renderItem={(item) => item}
    />,
  )
  const list = screen.getByRole('list', { name: 'Catégories' })
  const rowStarts = screen
    .getAllByRole('listitem')
    .filter((li) => li.dataset.rowStart === 'true')
    .map((li) => li.textContent)
  return { list, rowStarts }
}

test.each([
  // n, colonnes de la grille (2 par tuile), premières tuiles des lignes courtes
  [3, '6', []],
  [4, '4', []],
  [5, '6', ['c4']],
  [7, '8', ['c5']],
  [11, '8', ['c9']],
  [13, '10', ['c6', 'c10']],
])('%i tuiles : %s colonnes, lignes courtes décalées en %j', (n, cols, starts) => {
  const { list, rowStarts } = mount(n)

  expect(list.style.getPropertyValue('--cols')).toBe(cols)
  expect(screen.getAllByRole('listitem')).toHaveLength(n)
  expect(rowStarts).toEqual(starts)
})

test('rend les éléments dans l’ordre reçu', () => {
  mount(4)

  expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
    'c1',
    'c2',
    'c3',
    'c4',
  ])
})
