import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { categoryAccent } from '@/lib/appearance/category-accent'
import type { NormalizedCategory } from '@/domain/config/normalize'
import { makeConfig } from '@/testing/student-fixtures'
import { makeUi } from '@/testing/make-ui'
import { Button } from './ui/button'
import { CategoryTile, categoryTileButtonProps } from './category-tile'

const normal: NormalizedCategory = {
  id: 'normal',
  label: 'Normal',
  color: '#a78bfa',
  icon: 'brain',
  scale: [0, 1, 2],
  order: 1,
  questions: [{ id: 'n-1', title: 'Titre', tags: [], prompt: 'n-1' }],
}

test('tuile : libellé, maximum en points, badge', () => {
  const config = { ...makeConfig(), categories: [normal] }
  const { container } = render(<CategoryTile ui={makeUi()} config={config} category={normal} />)
  expect(screen.getByText('Normal')).toBeInTheDocument()
  expect(screen.getByText('2 pts')).toBeInTheDocument()
  expect(container.querySelector('[aria-hidden="true"].size-10')).not.toBeNull()
})

test('bouton teinté : accent posé, classes de teinte', () => {
  const props = categoryTileButtonProps(normal)
  expect(props.style).toEqual(categoryAccent('#a78bfa'))
  expect(props.className).toContain('min-h-32')
  expect(props.className).toContain('rounded-xl')
})

test('contenu de la tuile centré', () => {
  const { className } = categoryTileButtonProps(normal)
  expect(className).toContain('items-center')
  expect(className).toContain('text-center')
})

test('la teinte remplace le fond et la bordure du bouton outline', () => {
  render(
    <Button type="button" variant="outline" {...categoryTileButtonProps(normal)}>
      Normal
    </Button>,
  )
  const button = screen.getByRole('button', { name: 'Normal' })
  expect(button).not.toHaveClass('bg-secondary')
  expect(button).not.toHaveClass('border-border')
  expect(button).not.toHaveClass('h-11')
})
