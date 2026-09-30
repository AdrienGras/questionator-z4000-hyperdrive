import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useElementWidth } from '@/hooks/use-element-width'

type Rappel = (entries: { contentRect: { width: number } }[]) => void

let rappel: Rappel
const observe = vi.fn<(element: Element) => void>()
const disconnect = vi.fn<() => void>()

class FauxResizeObserver {
  constructor(cb: Rappel) {
    rappel = cb
  }
  observe = observe
  disconnect = disconnect
}

function Sonde() {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  return <div ref={ref}>{width}</div>
}

describe('useElementWidth', () => {
  beforeEach(() => {
    observe.mockClear()
    disconnect.mockClear()
    vi.stubGlobal('ResizeObserver', FauxResizeObserver)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('0 avant la première mesure', () => {
    const { container } = render(<Sonde />)
    expect(container.textContent).toBe('0')
    expect(observe).toHaveBeenCalledTimes(1)
  })

  it('suit contentRect.width à chaque rappel', () => {
    const { container } = render(<Sonde />)
    act(() => rappel([{ contentRect: { width: 384 } }]))
    expect(container.textContent).toBe('384')
    act(() => rappel([{ contentRect: { width: 512 } }]))
    expect(container.textContent).toBe('512')
  })

  it('déconnecte au démontage', () => {
    const { unmount } = render(<Sonde />)
    unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})
