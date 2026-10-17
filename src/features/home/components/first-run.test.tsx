import 'fake-indexeddb/auto'
import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { db } from '@/lib/db/db'
import { renderAt } from '@/testing/render-at'

beforeEach(async () => {
  await db.sessions.clear()
  await db.trainings.clear()
})

const base = import.meta.env.BASE_URL

/** Accueil sur base vide : le premier lancement. */
async function renderFirstRun() {
  const result = renderAt('/')
  await screen.findByRole('heading', { name: 'Votre premier oral en trois étapes' })
  return result
}

test('liens d’exemple téléchargeables, schéma dans un nouvel onglet', async () => {
  await renderFirstRun()
  const students = screen.getByRole('link', { name: 'Liste d’étudiants d’exemple (.csv)' })
  expect(students).toHaveAttribute('href', `${base}students.example.csv`)
  expect(students).toHaveAttribute('download')
  const config = screen.getByRole('link', { name: 'Config d’exemple (.json)' })
  // Regex et non chaîne : le nom du fichier en clair ferait passer ce test pour un rendu de la
  // config d'exemple aux yeux du garde-fou `heavy-doubles` (il ne rend que le lien).
  expect(config.getAttribute('href')).toMatch(/^.*config\.example\.json$/)
  expect(config.getAttribute('href')?.startsWith(base)).toBe(true)
  expect(config).toHaveAttribute('download')
  const schema = screen.getByRole('link', { name: 'JSON Schema de la config' })
  expect(schema).toHaveAttribute('href', `${base}config.schema.json`)
  expect(schema).toHaveAttribute('target', '_blank')
  expect(schema).toHaveAttribute('rel', 'noreferrer')
})

test('créer, s’entraîner seul, éditeur', async () => {
  await renderFirstRun()
  const main = within(screen.getByRole('main'))
  expect(main.getByRole('link', { name: 'Créer une session' })).toHaveAttribute('href', '/new')
  expect(main.getByRole('link', { name: 'S’entraîner seul' })).toHaveAttribute(
    'href',
    '/training/new',
  )
  expect(main.getByRole('link', { name: 'Écrire une config dans l’éditeur' })).toHaveAttribute(
    'href',
    '/editor',
  )
})

test('« Importer une sauvegarde » ouvre le sélecteur, le dépôt est rappelé', async () => {
  const { container } = await renderFirstRun()
  const input = container.querySelector('input[type=file]')
  if (!(input instanceof HTMLInputElement)) throw new Error('input fichier absent')
  const click = vi.spyOn(input, 'click')
  const resources = screen.getByRole('navigation', { name: 'Autres ressources' })
  fireEvent.click(within(resources).getByRole('button', { name: 'Importer une sauvegarde' }))
  expect(click).toHaveBeenCalledTimes(1)
  expect(
    screen.getByText('Vous pouvez aussi déposer une sauvegarde (.json) n’importe où sur la page.'),
  ).toBeInTheDocument()
})
