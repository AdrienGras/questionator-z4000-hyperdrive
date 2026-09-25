import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { createAppRouter } from '@/router'

/** Monte l'application sur l'accueil (`/`) via le routeur, comme en production. */
export function renderHome() {
  return render(
    <RouterProvider router={createAppRouter(createMemoryHistory({ initialEntries: ['/'] }))} />,
  )
}
