import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActionCards } from '@/features/home/components/action-cards'
import { makeUi } from '@/testing/make-ui'

const ui = makeUi()

function renderCards(props: Partial<Parameters<typeof ActionCards>[0]> = {}) {
  const onImport = vi.fn<() => void>()
  const rootRoute = createRootRoute({
    component: () => (
      <ActionCards ui={ui} storageAvailable importDisabled={false} onImport={onImport} {...props} />
    ),
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  render(<RouterProvider router={router} />)
  return { onImport }
}

describe('ActionCards', () => {
  it('rend une section « Actions » avec trois cartes titrées', async () => {
    renderCards()
    const region = await screen.findByRole('region', { name: 'Actions' })
    expect(region).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Nouvelle session' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: 'Restaurer une session' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Éditer une config' })).toBeInTheDocument()
  })

  it('éditeur : texte et lien vers /editor, même sans stockage', async () => {
    renderCards({ storageAvailable: false })
    expect(await screen.findByText(ui.text('home_editor_body', {}))).toBeInTheDocument()
    expect(screen.getByRole('link', { name: "Ouvrir l'éditeur" }).getAttribute('href')).toMatch(
      /\/editor$/,
    )
  })

  it('création : texte, trois liens, lien vers /new', async () => {
    renderCards()
    expect(await screen.findByText(ui.text('home_create_body', {}))).toBeInTheDocument()
    const students = screen.getByRole('link', {
      name: "Télécharger la liste d'étudiants d'exemple",
    })
    expect(students.getAttribute('href')).toMatch(/students\.example\.csv$/)
    expect(students).toHaveAttribute('download')
    const config = screen.getByRole('link', { name: "Télécharger la config d'exemple" })
    expect(config.getAttribute('href')).toMatch(/config\.example\.json$/)
    expect(config).toHaveAttribute('download')
    const schema = screen.getByRole('link', { name: 'JSON Schema de la config' })
    expect(schema.getAttribute('href')).toMatch(/config\.schema\.json$/)
    expect(schema).toHaveAttribute('target', '_blank')
    expect(schema.getAttribute('rel')).toContain('noreferrer')
    expect(screen.getByRole('link', { name: 'Créer une session' }).getAttribute('href')).toMatch(
      /\/new$/,
    )
  })

  it('import : texte et bouton qui appelle onImport', async () => {
    const { onImport } = renderCards()
    expect(await screen.findByText(ui.text('home_import_body', {}))).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Importer un backup' }))
    expect(onImport).toHaveBeenCalledOnce()
  })

  it('désactive le bouton d’import si importDisabled', async () => {
    renderCards({ importDisabled: true })
    expect(await screen.findByRole('button', { name: 'Importer un backup' })).toBeDisabled()
  })

  it('masque la création sans stockage', async () => {
    renderCards({ storageAvailable: false })
    await screen.findByRole('heading', { level: 3, name: 'Restaurer une session' })
    expect(screen.queryByRole('heading', { name: 'Nouvelle session' })).not.toBeInTheDocument()
  })
})
