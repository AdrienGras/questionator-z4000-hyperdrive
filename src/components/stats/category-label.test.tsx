import { render, screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { normalize } from '@/domain/config/normalize'
import { minimalConfig } from '@/testing/config-fixtures'
import { CategoryLabel } from './category-label'

function config(category: { color?: string; icon?: string }) {
  const parsed = minimalConfig()
  parsed.categories[0] = { ...parsed.categories[0]!, label: 'Facile', ...category }
  return normalize(parsed)
}

test('catégorie colorée avec icône : teinte en variable, icône, libellé', async () => {
  const { container } = render(
    <CategoryLabel config={config({ color: '#21d3ee', icon: 'brain' })} categoryId="a" />,
  )
  const label = container.querySelector<HTMLElement>(':scope > span')!
  expect(label.style.getPropertyValue('--category-color')).toBe('#21d3ee')
  expect(label).toHaveTextContent('Facile')
  expect(label.className).toContain('var(--category-color,var(--color-muted-foreground))')
  await waitFor(() => expect(label.querySelector('svg')).not.toBeNull())
})

test('catégorie sans couleur : aucune variable posée, repli neutre', () => {
  const { container } = render(<CategoryLabel config={config({})} categoryId="a" />)
  expect(container.firstElementChild).not.toHaveAttribute('style')
})

test('catégorie absente de la config : son id, neutre, sans icône', () => {
  render(<CategoryLabel config={config({ color: '#21d3ee' })} categoryId="disparue" />)
  const label = screen.getByText('disparue')
  expect(label).toHaveClass('text-muted-foreground')
  expect(label.querySelector('svg')).toBeNull()
})
