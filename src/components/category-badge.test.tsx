import { render, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { CategoryBadge } from './category-badge'

test('icône teintée par la couleur de la catégorie', async () => {
  const { container } = render(<CategoryBadge color="#a78bfa" icon="brain" size="md" />)
  const badge = container.querySelector('span')!
  expect(badge).toHaveAttribute('aria-hidden', 'true')
  expect(badge.style.getPropertyValue('--category-color')).toBe('#a78bfa')
  // Usage plein (icône) : l'encre, foncée en clair (D112).
  expect(badge.style.getPropertyValue('--category-ink')).toBe(
    'color-mix(in oklch, #a78bfa var(--category-ink-mix), black)',
  )
  expect(badge.className).toContain('text-[var(--category-ink,var(--color-muted-foreground))]')
  expect(badge).toHaveClass('size-8')
  await waitFor(() => expect(badge.querySelector('svg')).not.toBeNull())
})

test('sans icône : un point', () => {
  const { container } = render(<CategoryBadge color="#21d3ee" size="xl" />)
  const badge = container.querySelector('span')!
  expect(badge.querySelector('svg')).toBeNull()
  expect(badge.querySelector('[data-dot]')).not.toBeNull()
})

test('sans couleur : aucun style, teinte neutre', () => {
  const { container } = render(<CategoryBadge size="sm" />)
  const badge = container.querySelector('span')!
  expect(badge).not.toHaveAttribute('style')
  expect(badge.className).toContain('var(--category-color,var(--color-muted-foreground))')
  expect(badge.className).toContain('var(--category-ink,var(--color-muted-foreground))')
})
