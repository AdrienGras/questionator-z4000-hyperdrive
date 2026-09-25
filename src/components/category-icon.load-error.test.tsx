import { render } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { CategoryIcon } from './category-icon'

vi.mock('@tabler/icons-react', () => {
  throw new Error('chunk introuvable')
})

test('un chunk d’icônes qui échoue ne rend rien et ne lève pas', async () => {
  const { container } = render(<CategoryIcon name="brand-php" />)
  await vi.dynamicImportSettled()
  expect(container).toBeEmptyDOMElement()
})
