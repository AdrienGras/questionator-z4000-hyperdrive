import { render, screen, waitFor } from '@testing-library/react'
import { forwardRef } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { CategoryIcon, iconComponentName } from './category-icon'

vi.mock('@tabler/icons-react/dist/esm/icons/index.mjs', () => ({
  IconBrandPhp: forwardRef<SVGSVGElement, { className?: string }>(
    function IconBrandPhp(props, ref) {
      return <svg ref={ref} data-testid="icon-brand-php" {...props} />
    },
  ),
}))

describe('iconComponentName', () => {
  test.each([
    ['brand-php', 'IconBrandPhp'],
    ['database', 'IconDatabase'],
    ['a-b-2', 'IconAB2'],
    ['letter-x', 'IconLetterX'],
  ])('%s → %s', (name, expected) => {
    expect(iconComponentName(name)).toBe(expected)
  })
})

describe('CategoryIcon', () => {
  test('rend l’icône connue, masquée aux lecteurs d’écran', async () => {
    render(<CategoryIcon name="brand-php" className="size-5" />)
    const icon = await screen.findByTestId('icon-brand-php')
    expect(icon).toHaveClass('size-5')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  test('un nom inconnu ne rend rien', async () => {
    const { container } = render(<CategoryIcon name="inconnue" />)
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement()
    })
  })
})
