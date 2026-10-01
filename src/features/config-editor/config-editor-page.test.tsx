import { EditorView } from '@codemirror/view'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { validateConfig } from '@/domain/config/validate'
import { locateIssue } from '@/features/config-editor/issue-locations'
import { EXAMPLE_TEXT } from '@/features/config-editor/hooks/use-config-draft'
import { takeConfigForCreation } from '@/lib/config-handoff'
import { downloadText } from '@/lib/download'
import { expectColorModeToggleLast } from '@/testing/page-shell-assertions'
import { renderAt } from '@/testing/render-at'

vi.mock('@/lib/download', () => ({ downloadText: vi.fn<typeof downloadText>() }))

const cssSupports = () => true
const CREATE = 'Créer une session avec cette config'

function editorView(): EditorView {
  const host = document.querySelector<HTMLElement>('.cm-editor')
  const view = host === null ? null : EditorView.findFromDOM(host)
  if (view === null) throw new Error('éditeur absent')
  return view
}

/** Remplace tout le texte comme une frappe de l'utilisateur. */
function type(text: string) {
  const view = editorView()
  act(() => {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } })
  })
}

async function renderEditor() {
  const rendered = renderAt('/editor')
  await screen.findByRole('heading', { level: 1, name: 'Éditeur de config' })
  await waitFor(() => editorView())
  return rendered
}

/** Attend la fin de la validation différée (l'aperçu de l'exemple est affiché). */
async function previewReady() {
  await screen.findByRole('heading', { name: 'Écran final' }, { timeout: 5000 })
}

beforeEach(() => {
  vi.stubGlobal('CSS', { supports: cssSupports })
  sessionStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.mocked(downloadText).mockClear()
})

describe('ConfigEditorPage', () => {
  it('ouvre l’exemple sur deux colonnes, puis en affiche l’aperçu', async () => {
    await renderEditor()
    expectColorModeToggleLast()
    expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/')
    expect(screen.getByRole('heading', { level: 2, name: 'Configuration' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Aperçu' })).toBeInTheDocument()
    expect(editorView().state.doc.toString()).toBe(EXAMPLE_TEXT)
    expect(screen.getByRole('textbox', { name: 'Configuration JSON' })).toBeInTheDocument()
    await previewReady()
    expect(screen.getByText('Aucune erreur')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: CREATE })).toBeEnabled()
  })

  it('marque l’aperçu périmé et désactive la création quand le texte devient invalide', async () => {
    await renderEditor()
    await previewReady()
    type(EXAMPLE_TEXT.replace('"schemaVersion": 1,', '"schemaVersion": 1'))
    expect(
      await screen.findByText('Aperçu périmé : la config contient des erreurs.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Écran final' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: CREATE })).toBeDisabled()
    await waitFor(() => expect(document.querySelector('.cm-lintRange-error')).not.toBeNull())
  })

  it('place la sélection sur la position de l’issue cliquée', async () => {
    await renderEditor()
    const text = EXAMPLE_TEXT.replace('"schemaVersion": 1,', '"schemaVersion": 1, "intrus": true,')
    type(text)
    const result = validateConfig(text, { cssSupports })
    const issue = result.issues.find((candidate) => candidate.code === 'unknown_key')
    if (issue === undefined) throw new Error('issue attendue absente')
    const button = await screen.findByRole('button', { name: /intrus/ })
    fireEvent.click(button)
    const { from, to } = locateIssue(text, issue)
    const selection = editorView().state.selection.main
    expect({ from: selection.from, to: selection.to }).toEqual({ from, to })
  })

  it('télécharge le texte exact sous le titre de l’examen, sinon config.json', async () => {
    await renderEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger' }))
    expect(downloadText).toHaveBeenLastCalledWith('oral-php.json', EXAMPLE_TEXT)
    type('pas du JSON')
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger' }))
    expect(downloadText).toHaveBeenLastCalledWith('config.json', 'pas du JSON')
  })

  it('repart de l’exemple', async () => {
    await renderEditor()
    type('{}')
    fireEvent.click(screen.getByRole('button', { name: "Repartir de l'exemple" }))
    expect(editorView().state.doc.toString()).toBe(EXAMPLE_TEXT)
  })

  it('charge un fichier choisi ou déposé sur la colonne de l’éditeur', async () => {
    const { container } = await renderEditor()
    const input = container.querySelector<HTMLInputElement>('input[type=file]')
    if (input === null) throw new Error('input fichier absent')
    fireEvent.change(input, { target: { files: [new File(['{"a":1}'], 'a.json')] } })
    await waitFor(() => expect(editorView().state.doc.toString()).toBe('{"a":1}'))

    const column = screen.getByRole('region', { name: 'Configuration' })
    const file = new File(['{"b":2}'], 'b.json')
    fireEvent.drop(column, { dataTransfer: { files: [file], types: ['Files'] } })
    await waitFor(() => expect(editorView().state.doc.toString()).toBe('{"b":2}'))
  })

  it('remplace le texte une seule fois quand le fichier est lâché sur l’éditeur lui-même', async () => {
    await renderEditor()
    const content = document.querySelector<HTMLElement>('.cm-content')
    if (content === null) throw new Error('contenu de l’éditeur absent')
    const file = new File(['{"c":3}'], 'c.json')
    fireEvent.drop(content, { dataTransfer: { files: [file], types: ['Files'] } })
    await waitFor(() => expect(editorView().state.doc.toString()).toBe('{"c":3}'))
    // Laisse à une éventuelle lecture concurrente (FileReader de CodeMirror) le temps d'aboutir.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(editorView().state.doc.toString()).toBe('{"c":3}')
  })

  it('passe la config valide à l’écran de création', async () => {
    const { router } = await renderEditor()
    await previewReady()
    fireEvent.click(screen.getByRole('button', { name: CREATE }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/new'))
    // L'écran de création a repris la config au montage ; on vérifie le nom affiché.
    const configField = await screen.findByRole('group', { name: 'Configuration (JSON)' })
    expect(within(configField).getByText('oral-php.json')).toBeInTheDocument()
    expect(takeConfigForCreation()).toBeUndefined()
  })
})
