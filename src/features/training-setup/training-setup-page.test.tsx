import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { buildTrainingPrompt } from '@/domain/training/prompt'
import { db, type DbStatus } from '@/lib/db/db'
import { minimalConfig } from '@/testing/config-fixtures'
import { renderAt } from '@/testing/render-at'

const state = vi.hoisted((): { status: DbStatus } => ({ status: 'open' }))
const copyText = vi.hoisted(() => vi.fn<(text: string) => Promise<boolean>>())

vi.mock('@/lib/db/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/db/hooks')>()),
  useDbStatus: () => state.status,
}))
vi.mock('@/lib/clipboard', () => ({ copyText }))
const stashConfigForEditor = vi.hoisted(() =>
  vi.fn<(handoff: { text: string; fileName: string }) => void>(),
)
vi.mock('@/lib/config-handoff', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/config-handoff')>()),
  stashConfigForEditor,
}))

function twoCategoryConfig(): string {
  const config = minimalConfig()
  config.categories.push({
    id: 'b',
    label: 'B',
    scale: [0, 1],
    questions: [
      { id: 'b-1', prompt: 'Question B1' },
      { id: 'b-2', prompt: 'Question B2' },
    ],
  })
  return JSON.stringify(config)
}

async function renderPage() {
  const rendered = renderAt('/training/new')
  await screen.findByRole('heading', { level: 1, name: 'S’entraîner' })
  const input = rendered.container.querySelector('input[type=file]')
  if (!(input instanceof HTMLInputElement)) throw new Error('input fichier absent')
  return { ...rendered, input }
}

function choose(input: HTMLInputElement, name: string, content: string) {
  fireEvent.change(input, { target: { files: [new File([content], name)] } })
}

const submitButton = () => screen.getByRole('button', { name: 'C’est parti' })
const pasteArea = () => screen.getByRole('textbox', { name: '… ou collez le JSON ici' })

beforeEach(async () => {
  await db.trainings.clear()
  state.status = 'open'
  copyText.mockReset()
  stashConfigForEditor.mockReset()
  copyText.mockResolvedValue(true)
  sessionStorage.clear()
  vi.stubGlobal('CSS', { supports: () => true })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('écran de mise en place d’un entraînement', () => {
  test('titre, retour à l’accueil et quatre étapes', async () => {
    await renderPage()
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/')
    for (const name of [
      'Rassemblez votre cours',
      'Copiez le prompt',
      'Récupérez la config',
      'Déposez-la',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
    expect(submitButton()).toBeDisabled()
  })

  test('le prompt affiché est celui de la langue courante, en lecture seule', async () => {
    await renderPage()
    const prompt = screen.getByRole('textbox', { name: 'Prompt à copier' })
    expect(prompt).toHaveValue(buildTrainingPrompt('fr'))
    expect(prompt).toHaveAttribute('readonly')
  })

  test('copie réussie : prompt passé à copyText, succès annoncé', async () => {
    await renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Copier le prompt' }))
    expect(await screen.findByText('Prompt copié.')).toBeInTheDocument()
    expect(copyText).toHaveBeenCalledWith(buildTrainingPrompt('fr'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('copie refusée : alerte, puis succès au nouvel essai', async () => {
    copyText.mockResolvedValueOnce(false)
    await renderPage()
    const copy = screen.getByRole('button', { name: 'Copier le prompt' })
    fireEvent.click(copy)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La copie a échoué : sélectionnez le texte et copiez-le à la main.',
    )
    fireEvent.click(copy)
    expect(await screen.findByText('Prompt copié.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('fichier valide : résumé par catégorie et bouton actif', async () => {
    const { input } = await renderPage()
    choose(input, 'config.json', twoCategoryConfig())
    expect(await screen.findByRole('heading', { name: 'Oral de test' })).toBeInTheDocument()
    expect(screen.getByText('A : 1 question')).toBeInTheDocument()
    expect(screen.getByText('B : 2 questions')).toBeInTheDocument()
    expect(submitButton()).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Corriger dans l’éditeur' })).toBeNull()
  })

  test('fichier illisible : alerte de lecture', async () => {
    const { input } = await renderPage()
    const file = new File([''], 'cassé.json')
    vi.spyOn(file, 'text').mockRejectedValue(new Error('lecture'))
    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByRole('alert')).toHaveTextContent("Le fichier n'a pas pu être lu.")
  })

  test('JSON collé invalide : erreurs listées, correction dans l’éditeur', async () => {
    const { router } = await renderPage()
    fireEvent.change(pasteArea(), { target: { value: '{}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier le JSON collé' }))
    const fix = await screen.findByRole('button', { name: 'Corriger dans l’éditeur' })
    expect(screen.getByText('config-collee.json')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(4)
    expect(submitButton()).toBeDisabled()
    fireEvent.click(fix)
    await screen.findByRole('heading', { level: 1, name: 'Éditeur de config' })
    expect(router.state.location.pathname).toBe('/editor')
    expect(stashConfigForEditor).toHaveBeenCalledWith({
      text: '{}',
      fileName: 'config-collee.json',
    })
  })

  test('JSON collé valide : la validation n’a lieu qu’au clic', async () => {
    await renderPage()
    fireEvent.change(pasteArea(), { target: { value: JSON.stringify(minimalConfig()) } })
    expect(screen.queryByRole('heading', { name: 'Oral de test' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier le JSON collé' }))
    expect(await screen.findByRole('heading', { name: 'Oral de test' })).toBeInTheDocument()
    expect(submitButton()).toBeEnabled()
  })

  test('JSON collé modifié après vérification : résumé masqué, bouton désactivé', async () => {
    await renderPage()
    const valid = JSON.stringify(minimalConfig())
    fireEvent.change(pasteArea(), { target: { value: valid } })
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier le JSON collé' }))
    await screen.findByRole('heading', { name: 'Oral de test' })
    expect(submitButton()).toBeEnabled()
    fireEvent.change(pasteArea(), { target: { value: `${valid}\n` } })
    expect(screen.queryByRole('heading', { name: 'Oral de test' })).toBeNull()
    expect(submitButton()).toBeDisabled()
  })

  test('JSON collé invalide puis modifié : plus de correction proposée', async () => {
    await renderPage()
    fireEvent.change(pasteArea(), { target: { value: '{}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier le JSON collé' }))
    await screen.findByRole('button', { name: 'Corriger dans l’éditeur' })
    fireEvent.change(pasteArea(), { target: { value: '{"exam":{}}' } })
    expect(screen.queryByRole('button', { name: 'Corriger dans l’éditeur' })).toBeNull()
    expect(submitButton()).toBeDisabled()
  })

  test('JSON collé non parsable : erreur listée, bouton désactivé', async () => {
    await renderPage()
    fireEvent.change(pasteArea(), { target: { value: 'pas du json' } })
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier le JSON collé' }))
    await screen.findByRole('button', { name: 'Corriger dans l’éditeur' })
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
    expect(submitButton()).toBeDisabled()
  })

  test('fichier illisible au moment de la correction : alerte, on reste sur l’écran', async () => {
    const { input, router } = await renderPage()
    const file = new File(['{}'], 'mauvais.json')
    fireEvent.change(input, { target: { files: [file] } })
    const fix = await screen.findByRole('button', { name: 'Corriger dans l’éditeur' })
    vi.spyOn(file, 'text').mockRejectedValue(new Error('lecture'))
    fireEvent.click(fix)
    expect(await screen.findByRole('alert')).toHaveTextContent("Le fichier n'a pas pu être lu.")
    expect(router.state.location.pathname).toBe('/training/new')
    expect(stashConfigForEditor).not.toHaveBeenCalled()
  })

  test('« C’est parti » : entraînement créé en base, navigation vers son écran', async () => {
    const { input, router } = await renderPage()
    choose(input, 'config.json', JSON.stringify(minimalConfig()))
    await screen.findByRole('heading', { name: 'Oral de test' })
    fireEvent.click(submitButton())
    await waitFor(() => expect(router.state.location.pathname).not.toBe('/training/new'))
    const [, segment, id = ''] = router.state.location.pathname.split('/')
    expect(segment).toBe('training')
    expect((await db.trainings.get(id))?.name).toBe('Oral de test')
  })

  test('échec de l’écriture : alerte en ligne, on reste sur l’écran', async () => {
    const { input, router } = await renderPage()
    choose(input, 'config.json', JSON.stringify(minimalConfig()))
    await screen.findByRole('heading', { name: 'Oral de test' })
    vi.spyOn(db.trainings, 'add').mockRejectedValue(new Error('écriture'))
    fireEvent.click(submitButton())
    expect(await screen.findByRole('alert')).toHaveTextContent('La création a échoué. Réessayez.')
    expect(router.state.location.pathname).toBe('/training/new')
  })

  test('base obsolète : bandeau et bouton désactivé', async () => {
    state.status = 'outdated'
    const { input } = await renderPage()
    choose(input, 'config.json', JSON.stringify(minimalConfig()))
    await screen.findByRole('heading', { name: 'Oral de test' })
    expect(screen.getByRole('alert')).toHaveTextContent('Rechargez la page')
    expect(submitButton()).toBeDisabled()
  })

  test('un fichier déposé hors des zones n’est pas ouvert par le navigateur', async () => {
    await renderPage()
    const main = screen.getByRole('main')
    const dataTransfer = { types: ['Files'], files: [], dropEffect: 'copy' }
    const over = fireEvent.dragOver(main, { dataTransfer })
    expect(over).toBe(false)
    expect(fireEvent.drop(main, { dataTransfer })).toBe(false)
    expect(within(main).getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
