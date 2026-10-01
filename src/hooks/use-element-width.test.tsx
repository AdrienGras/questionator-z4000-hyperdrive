import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useElementWidth } from '@/hooks/use-element-width'
import { ManualResizeObserver } from '@/testing/resize-observer'

function Sonde() {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  return <div ref={ref}>{width}</div>
}

/** Largeur affichée hors de l'élément mesuré, qui peut être retiré (`ref(null)`) sans démontage. */
function SondeRetirable({ shown }: Readonly<{ shown: boolean }>) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  return (
    <>
      {shown && <div ref={ref} />}
      <output>{width}</output>
    </>
  )
}

describe('useElementWidth', () => {
  beforeEach(() => {
    ManualResizeObserver.reset()
    vi.stubGlobal('ResizeObserver', ManualResizeObserver)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('0 avant la première mesure', () => {
    const { container } = render(<Sonde />)
    expect(container.textContent).toBe('0')
    expect(ManualResizeObserver.observed).toHaveBeenCalledTimes(1)
  })

  it('suit contentRect.width à chaque rappel', () => {
    const { container } = render(<Sonde />)
    act(() => ManualResizeObserver.resize(384))
    expect(container.textContent).toBe('384')
    act(() => ManualResizeObserver.resize(512))
    expect(container.textContent).toBe('512')
  })

  it('déconnecte au démontage', () => {
    const { unmount } = render(<Sonde />)
    unmount()
    expect(ManualResizeObserver.disconnected).toHaveBeenCalled()
  })

  it('après ref(null) : observateur déconnecté, dernière largeur gardée, puis ré-observé', () => {
    const { container, rerender } = render(<SondeRetirable shown />)
    act(() => ManualResizeObserver.resize(384))
    const output = () => container.querySelector('output')?.textContent

    rerender(<SondeRetirable shown={false} />)
    expect(ManualResizeObserver.disconnected).toHaveBeenCalledTimes(1)
    expect(output()).toBe('384')

    rerender(<SondeRetirable shown />)
    expect(ManualResizeObserver.observed).toHaveBeenCalledTimes(2)
    act(() => ManualResizeObserver.resize(512))
    expect(output()).toBe('512')
  })
})
