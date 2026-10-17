import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { buttonVariants } from '@/components/ui/button'
import { useUi } from '@/lib/i18n/use-ui'
import { makeUi } from '@/testing/make-ui'
import { SessionFallback } from './session-fallback'

const MAIN_CLASSES = [
  'flex',
  'flex-1',
  'flex-col',
  'items-center',
  'justify-center',
  'gap-4',
  'p-6',
  'text-center',
]

function Loading() {
  return <SessionFallback ui={useUi()} kind="loading" />
}

test('l’état chargement est enveloppé dans le même <main> que « introuvable »', () => {
  render(<Loading />)
  const main = screen.getByText('Chargement de la session…').closest('main')
  expect(main).not.toBeNull()
  expect(main).toHaveClass(...MAIN_CLASSES)
})

test('le texte de chargement passé en `messages` remplace celui de la session', () => {
  render(<CustomLoading />)
  expect(screen.getByText('Chargement maison…')).toBeInTheDocument()
  expect(screen.queryByText('Chargement de la session…')).not.toBeInTheDocument()
})

function CustomLoading() {
  return (
    <SessionFallback
      ui={useUi()}
      kind="loading"
      messages={{ loading: 'Chargement maison…', notFound: 'Introuvable maison' }}
    />
  )
}

test('introuvable : retour en bouton principal, sous le titre', async () => {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <SessionFallback ui={makeUi()} kind="not-found" />,
    }),
    history: createMemoryHistory({ initialEntries: ['/session/x'] }),
  })
  render(<RouterProvider router={router} />)
  const back = await screen.findByRole('link', { name: 'Retour à l’accueil' })
  expect(back).toHaveClass(...buttonVariants({ variant: 'default' }).split(' '))
  expect(screen.getByRole('heading', { level: 1, name: 'Session introuvable' })).toBeInTheDocument()
})
