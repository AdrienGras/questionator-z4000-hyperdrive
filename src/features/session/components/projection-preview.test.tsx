import { act, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectionPreview } from '@/features/session/components/projection-preview'
import type { ProjectedView } from '@/domain/presentation/projected-view'
import { LocaleProvider } from '@/lib/i18n/locale-context'
import { makeUi } from '@/testing/make-ui'

type Rappel = (entries: { contentRect: { width: number } }[]) => void

let rappel: Rappel

class FauxResizeObserver {
  constructor(cb: Rappel) {
    rappel = cb
  }
  observe = vi.fn<(element: Element) => void>()
  disconnect = vi.fn<() => void>()
}

const appearance: ProjectedView['appearance'] = {
  locale: 'fr',
  theme: { light: {}, dark: {} },
  presentation: { defaultColorMode: 'light' },
}

const student = (prompt: string, drawnAt: string, drawAnimation = false): ProjectedView => ({
  mode: 'student',
  examTitle: 'Partiel de maths',
  appearance,
  student: { firstName: 'Ada', lastName: 'Lovelace' },
  categories: [
    { id: 'algo', label: 'Algorithmique', maxPoints: 4, exhausted: false, disabled: false },
  ],
  current: { categoryId: 'algo', prompt, drawnAt },
  questionIndex: { current: 1, total: 3 },
  finished: false,
  drawAnimation,
})

const ui = makeUi()
const waiting: ProjectedView = { mode: 'waiting', examTitle: 'Partiel de maths', appearance }
const inFrench = (el: ReactElement) => <LocaleProvider locale="fr">{el}</LocaleProvider>
const canvas = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-projection-canvas]')!

describe('ProjectionPreview', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', FauxResizeObserver)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('section intitulée « Vue projetée »', () => {
    render(inFrench(<ProjectionPreview ui={ui} view={waiting} />))
    expect(screen.getByRole('region', { name: 'Vue projetée' })).toBeInTheDocument()
  })

  it('canevas réduit à la largeur mesurée', () => {
    const { container } = render(inFrench(<ProjectionPreview ui={ui} view={waiting} />))
    act(() => rappel([{ contentRect: { width: 384 } }]))
    expect(canvas(container).style.transform).toBe('scale(0.3)')
    expect(canvas(container).style.visibility).toBe('')
  })

  it('canevas caché avant la première mesure', () => {
    const { container } = render(inFrench(<ProjectionPreview ui={ui} view={waiting} />))
    expect(canvas(container).style.visibility).toBe('hidden')
  })

  it('canevas hors de l’arbre d’accessibilité et du clavier', () => {
    const { container } = render(
      inFrench(<ProjectionPreview ui={ui} view={student('[doc](https://example.org)', 'a')} />),
    )
    expect(canvas(container)).toHaveAttribute('aria-hidden', 'true')
    expect(canvas(container).hasAttribute('inert')).toBe(true)
    expect(canvas(container).querySelector('a')).not.toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('aucune iframe', () => {
    const { container } = render(inFrench(<ProjectionPreview ui={ui} view={waiting} />))
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('tirage immédiat dans l’aperçu, même avec drawAnimation', () => {
    const { container, rerender } = render(
      inFrench(<ProjectionPreview ui={ui} view={student('Énoncé secret', 'a', true)} />),
    )
    rerender(inFrench(<ProjectionPreview ui={ui} view={student('Énoncé secret', 'b', true)} />))
    expect(canvas(container).textContent).toContain('Énoncé secret')
    expect(container.querySelectorAll('[data-card]')).toHaveLength(0)
  })
})
