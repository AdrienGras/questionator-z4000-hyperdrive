import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { BackLink } from './back-link'

test('lien retour avec chevron', async () => {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <BackLink to="/">Retour à l’accueil</BackLink> }),
    history: createMemoryHistory({ initialEntries: ['/editor'] }),
  })
  render(<RouterProvider router={router} />)
  const link = await screen.findByRole('link', { name: 'Retour à l’accueil' })
  expect(link).toHaveAttribute('href', '/')
  const icon = link.firstElementChild
  expect(icon?.tagName.toLowerCase()).toBe('svg')
  expect(icon).toHaveAttribute('aria-hidden', 'true')
  expect(link).toHaveClass('text-muted-foreground')
})
