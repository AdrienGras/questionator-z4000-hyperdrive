import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { createAppRouter } from '@/router'

/** Monte l'application sur `path` via le routeur, comme en production. */
export function renderAt(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }))
  return { router, ...render(<RouterProvider router={router} />) }
}
