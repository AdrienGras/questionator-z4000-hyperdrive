import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { ProjectedStudentView } from '@/domain/presentation/projected-view'
import { makeUi } from '@/testing/make-ui'
import { CategoryTiles } from './category-tiles'

type Category = ProjectedStudentView['categories'][number]

const category = (id: string, extra: Partial<Category> = {}): Category => ({
  id,
  label: `Catégorie ${id}`,
  maxPoints: 2,
  exhausted: false,
  disabled: false,
  ...extra,
})

function tile(label: string): HTMLElement {
  const element = screen.getByText(label).closest('[data-state]')
  if (!(element instanceof HTMLElement)) throw new Error(`tuile ${label} introuvable`)
  return element
}

test('passage terminé : « Épuisée » et « Indisponible » se distinguent', () => {
  render(
    <CategoryTiles
      ui={makeUi()}
      finished
      categories={[
        category('a', { exhausted: true, disabled: true }),
        category('b', { disabled: true }),
      ]}
    />,
  )
  expect(tile('Catégorie a')).toHaveAttribute('data-state', 'exhausted')
  expect(tile('Catégorie a')).toHaveTextContent('Épuisée')
  expect(tile('Catégorie b')).toHaveAttribute('data-state', 'unavailable')
  expect(tile('Catégorie b')).toHaveTextContent('Indisponible')
})

test('question en cours : catégorie tirée mise en avant, les autres sans libellé', () => {
  render(
    <CategoryTiles
      ui={makeUi()}
      currentCategoryId="b"
      categories={[
        category('a', { disabled: true }),
        category('b', { disabled: true }),
        category('c', { exhausted: true, disabled: true }),
      ]}
    />,
  )
  expect(tile('Catégorie a')).toHaveAttribute('data-state', 'waiting')
  expect(tile('Catégorie b')).toHaveAttribute('data-state', 'current')
  expect(tile('Catégorie c')).toHaveAttribute('data-state', 'exhausted')
  expect(screen.queryByText('Indisponible')).not.toBeInTheDocument()
  expect(screen.getByText('Épuisée')).toBeInTheDocument()
})

test('tirage possible : tuiles normales', () => {
  render(<CategoryTiles ui={makeUi()} categories={[category('a')]} />)
  expect(tile('Catégorie a')).toHaveAttribute('data-state', 'available')
})
