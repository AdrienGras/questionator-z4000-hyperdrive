import { render, screen, waitFor } from '@testing-library/react'
import { forwardRef } from 'react'
import { expect, test, vi } from 'vitest'

// `vi.mock` met en cache le module simulé pour tout le fichier : un `import()` dynamique répété
// dans le même module `category-icon.tsx` ne réinvoque pas cette factory. Pour simuler un échec
// transitoire suivi d'une réussite, on force une réinstanciation complète de `category-icon.tsx`
// (`vi.resetModules()` + réimport) entre les deux montages, ce qui réinitialise aussi son cache
// interne `iconsModule` et déclenche un nouvel `import('@tabler/icons-react')`.
const state = vi.hoisted(() => ({ attempt: 0 }))

vi.mock('@tabler/icons-react', () => {
  state.attempt += 1
  if (state.attempt === 1) {
    throw new Error('chunk introuvable')
  }
  return {
    IconBrandPhp: forwardRef<SVGSVGElement, { className?: string }>(
      function IconBrandPhp(props, ref) {
        return <svg ref={ref} data-testid="icon-brand-php" {...props} />
      },
    ),
  }
})

test('un échec transitoire du chunk d’icônes est retenté au montage suivant', async () => {
  const { CategoryIcon: FirstCategoryIcon } = await import('./category-icon')
  const { container, unmount } = render(<FirstCategoryIcon name="brand-php" />)
  await waitFor(() => {
    expect(container).toBeEmptyDOMElement()
  })
  unmount()

  vi.resetModules()
  const { CategoryIcon: SecondCategoryIcon } = await import('./category-icon')
  render(<SecondCategoryIcon name="brand-php" />)
  const icon = await screen.findByTestId('icon-brand-php')
  expect(icon).toBeInTheDocument()
})
