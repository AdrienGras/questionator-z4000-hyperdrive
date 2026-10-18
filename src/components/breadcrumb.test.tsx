import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { expect, test } from 'vitest'
import { makeUi } from '@/testing/make-ui'
import { Breadcrumb } from './breadcrumb'

function renderInRouter(node: ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => node }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return render(<RouterProvider router={router} />)
}

test('racine en lien, parts séparées par un point', async () => {
  renderInRouter(
    <Breadcrumb
      ui={makeUi()}
      root={{ label: 'Sessions', to: '/sessions' }}
      parts={['Oral de démonstration', 'Oral PHP']}
    />,
  )
  const nav = await screen.findByRole('navigation', { name: "Fil d'Ariane" })
  expect(screen.getByRole('link', { name: 'Sessions' })).toHaveAttribute('href', '/sessions')
  expect(nav).toHaveTextContent(/^Sessions\s*Oral de démonstration\s*·\s*Oral PHP$/)
  expect(nav.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})

test('racine sans lien : page courante', async () => {
  renderInRouter(<Breadcrumb ui={makeUi()} root={{ label: 'Éditeur de config' }} />)
  const nav = await screen.findByRole('navigation', { name: "Fil d'Ariane" })
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
  expect(screen.getByText('Éditeur de config')).toHaveAttribute('aria-current', 'page')
  expect(nav.querySelector('svg')).toBeNull()
})

test('part longue : passe à la ligne', async () => {
  const long = 'Examen '.repeat(30).trim()
  renderInRouter(
    <Breadcrumb ui={makeUi()} root={{ label: 'Sessions', to: '/sessions' }} parts={[long]} />,
  )
  const nav = await screen.findByRole('navigation', { name: "Fil d'Ariane" })
  // jsdom ne fait pas de mise en page : on fige les classes qui la portent.
  expect(nav).toHaveClass('flex-wrap', 'min-w-0')
  expect(screen.getByText(long)).toHaveClass('min-w-0', 'break-words')
})

test('en anglais', async () => {
  renderInRouter(<Breadcrumb ui={makeUi('en')} root={{ label: 'Sessions', to: '/sessions' }} />)
  expect(await screen.findByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
})
