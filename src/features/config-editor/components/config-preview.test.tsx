import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import exampleText from '../../../../examples/config.example.json?raw'
import * as previewSessionModule from '@/domain/presentation/preview-session'
import { AppearanceProvider } from '@/app/appearance-provider'
import { LocaleProvider } from '@/lib/i18n/locale-context'
import { validateConfig } from '@/domain/config/validate'
import { makeUi } from '@/testing/make-ui'
import { FixedWidthResizeObserver } from '@/testing/resize-observer'
import { ConfigPreview } from './config-preview'

// La config d'exemple porte des icônes (index Tabler) et des blocs ```php (Shiki) : leurs
// chargements, lancés au rendu et jamais attendus ici, débordaient sur les tests suivants du
// fichier. Aucun test ne vérifie icônes ni coloration : module d'icônes vide, code en texte brut.
vi.mock('@tabler/icons-react/dist/esm/icons/index.mjs', () => ({}))
vi.mock('@/lib/markdown/highlighter', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/markdown/highlighter')>()),
  highlight: () => Promise.resolve(null),
}))
vi.mock('@/domain/presentation/preview-session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain/presentation/preview-session')>()
  return { ...actual, previewSession: vi.fn<typeof actual.previewSession>(actual.previewSession) }
})

const result = validateConfig(exampleText, { cssSupports: () => true })
if (!result.ok) throw new Error('exemple invalide')
const config = result.config
const ui = makeUi('fr')

function mount(value: Parameters<typeof ConfigPreview>[0]) {
  return render(
    <AppearanceProvider>
      <ConfigPreview {...value} />
    </AppearanceProvider>,
  )
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', FixedWidthResizeObserver)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ConfigPreview', () => {
  it('affiche toutes les questions groupées par catégorie, puis l’écran final', () => {
    const { container } = mount({ ui, config, stale: false })
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    for (const category of config.categories) expect(headings).toContain(category.label)
    expect(headings.at(-1)).toBe('Écran final')
    const total = config.categories.reduce((n, c) => n + c.questions.length, 0)
    expect(container.querySelectorAll('article')).toHaveLength(total)
    expect(container.querySelector('[data-projection-canvas]')).not.toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('périmé : bandeau de statut et opacité réduite', () => {
    const { container } = mount({ ui, config, stale: true })
    expect(screen.getByRole('status').textContent).toBe(
      'Aperçu périmé : la config contient des erreurs.',
    )
    expect(container.querySelector('.opacity-60')).not.toBeNull()
  })

  it('sans config valide : message d’attente', () => {
    mount({ ui, config: undefined, stale: false })
    expect(screen.getByText("L'aperçu apparaîtra dès que la config sera valide.")).toBeTruthy()
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('ne recalcule pas l’écran final quand la config est la même', () => {
    const spy = vi.mocked(previewSessionModule.previewSession)
    spy.mockClear()
    const tree = (
      <AppearanceProvider>
        <ConfigPreview ui={ui} config={config} stale={false} />
      </AppearanceProvider>
    )
    const { rerender } = render(tree)
    expect(spy).toHaveBeenCalledTimes(1)
    rerender(tree)
    rerender(
      <AppearanceProvider>
        <ConfigPreview ui={ui} config={config} stale />
      </AppearanceProvider>,
    )
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('rend le contenu dans la langue de la config sans changer <html lang>', () => {
    const english = validateConfig(exampleText.replace('"locale": "fr"', '"locale": "en"'), {
      cssSupports: () => true,
    })
    if (!english.ok) throw new Error('exemple en invalide')
    document.documentElement.lang = ''
    const { container } = render(
      <LocaleProvider locale="fr">
        <AppearanceProvider>
          <ConfigPreview ui={ui} config={english.config} stale={false} />
        </AppearanceProvider>
      </LocaleProvider>,
    )
    expect(document.documentElement.lang).toBe('fr')
    const canvas = container.querySelector('[data-projection-canvas]')
    expect(canvas?.textContent).toContain('Grade:')
    expect(canvas?.textContent).not.toContain('Note :')
    expect(canvas?.closest('[lang]')?.getAttribute('lang')).toBe('en')
    // Habillage de l'éditeur : langue de l'interface, pas celle de la config.
    expect(screen.getAllByRole('heading', { level: 3 }).at(-1)?.textContent).toBe('Écran final')
    expect(screen.getAllByText('Réponse attendue').length).toBeGreaterThan(0)
  })
})
