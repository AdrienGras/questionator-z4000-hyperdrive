import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProjectionCanvas } from '@/components/projection/projection-canvas'
import type { ProjectedView } from '@/domain/presentation/projected-view'
import { LocaleProvider } from '@/lib/i18n/locale-context'
import { ManualResizeObserver } from '@/testing/resize-observer'

const waiting: ProjectedView = {
  mode: 'waiting',
  examTitle: 'Partiel de maths',
  appearance: {
    locale: 'fr',
    theme: { light: {}, dark: {} },
    presentation: { defaultColorMode: 'light' },
  },
}
const canvas = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-projection-canvas]')!
const renderCanvas = () =>
  render(
    <LocaleProvider locale="fr">
      <ProjectionCanvas view={waiting} className="extra" />
    </LocaleProvider>,
  )

describe('ProjectionCanvas', () => {
  beforeEach(() => {
    ManualResizeObserver.reset()
    vi.stubGlobal('ResizeObserver', ManualResizeObserver)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('réduit le canevas à la largeur mesurée', () => {
    const { container } = renderCanvas()
    act(() => ManualResizeObserver.resize(384))
    expect(canvas(container).style.transform).toBe('scale(0.3)')
    expect(canvas(container).style.visibility).toBe('')
    expect(container.firstElementChild).toHaveClass('extra')
  })

  it('est caché avant mesure, aria-hidden et inert', () => {
    const { container } = renderCanvas()
    expect(canvas(container).style.visibility).toBe('hidden')
    expect(canvas(container)).toHaveAttribute('aria-hidden', 'true')
    expect(canvas(container).hasAttribute('inert')).toBe(true)
  })
})
