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

test('dernière question de sa catégorie en cours : la tuile reste « en cours », pas « Épuisée »', () => {
  render(
    <CategoryTiles
      ui={makeUi()}
      currentCategoryId="b"
      categories={[
        category('a', { disabled: true }),
        category('b', { exhausted: true, disabled: true }),
      ]}
    />,
  )
  expect(tile('Catégorie b')).toHaveAttribute('data-state', 'current')
  expect(screen.queryByText('Épuisée')).not.toBeInTheDocument()
})

test('tirage possible : tuiles normales', () => {
  render(<CategoryTiles ui={makeUi()} categories={[category('a')]} />)
  expect(tile('Catégorie a')).toHaveAttribute('data-state', 'available')
})

test('points du barème sous le libellé, au format de l’examinateur', () => {
  render(
    <CategoryTiles
      ui={makeUi()}
      categories={[category('a', { maxPoints: 1 }), category('b', { maxPoints: 2.5 })]}
    />,
  )
  expect(tile('Catégorie a')).toHaveTextContent('1 pt')
  expect(tile('Catégorie b')).toHaveTextContent('2,5 pts')
})

test('points en anglais', () => {
  render(<CategoryTiles ui={makeUi('en')} categories={[category('a', { maxPoints: 2.5 })]} />)
  expect(tile('Catégorie a')).toHaveTextContent('2.5 pts')
})

test('sans maxPoints (showCategoryPoints à false) : aucun point affiché', () => {
  const { maxPoints: _maxPoints, ...hidden } = category('a')
  render(<CategoryTiles ui={makeUi()} categories={[hidden]} />)
  expect(tile('Catégorie a')).not.toHaveTextContent(/\bpts?\b/)
})

test('grille : consigne « Choisissez une catégorie »', () => {
  render(<CategoryTiles ui={makeUi()} variant="grid" categories={[category('a')]} />)
  expect(
    screen.getByRole('heading', { level: 2, name: 'Choisissez une catégorie' }),
  ).toBeInTheDocument()
})

test('rangée : catégorie courante marquée, autres atténuées', () => {
  render(
    <CategoryTiles
      ui={makeUi()}
      variant="row"
      currentCategoryId="b"
      categories={[category('a', { disabled: true }), category('b', { disabled: true })]}
    />,
  )
  expect(screen.getByRole('list', { name: 'Catégories' })).toBeInTheDocument()
  expect(tile('Catégorie b')).toHaveAttribute('aria-current', 'true')
  expect(tile('Catégorie a')).not.toHaveAttribute('aria-current')
  expect(tile('Catégorie a')).toHaveClass('opacity-45')
  expect(screen.queryByRole('heading')).not.toBeInTheDocument()
})

test('grille : un libellé sans espace coupe au lieu de déborder', () => {
  render(<CategoryTiles ui={makeUi()} variant="grid" categories={[category('a')]} />)
  expect(screen.getByText('Catégorie a')).toHaveClass('wrap-anywhere')
})

test('grille : tuiles resserrées dès quatre par ligne (D74, 7 catégories et plus)', () => {
  const many = Array.from({ length: 7 }, (_, i) => category(String(i)))
  render(<CategoryTiles ui={makeUi()} variant="grid" categories={many} />)
  expect(tile('Catégorie 0')).toHaveAttribute('data-density', 'compact')
})

test('grille : tuiles pleines jusqu’à trois par ligne', () => {
  const six = Array.from({ length: 6 }, (_, i) => category(String(i)))
  render(<CategoryTiles ui={makeUi()} variant="grid" categories={six} />)
  expect(tile('Catégorie 0')).toHaveAttribute('data-density', 'full')
})

test('grille : contenu des tuiles centré', () => {
  render(<CategoryTiles ui={makeUi()} variant="grid" categories={[category('a')]} />)
  expect(tile('Catégorie a')).toHaveClass('items-center', 'text-center')
})
