import { act, createEvent, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useFileDrop, WINDOW_EXIT_DELAY_MS } from './use-file-drop'

const file = new File(['{}'], 'a.json', { type: 'application/json' })
const files = { files: [file], types: ['Files'] }

function Zone({
  disabled = false,
  isolate = false,
  withChild = true,
  onFile = () => {},
}: Readonly<{
  disabled?: boolean
  isolate?: boolean
  withChild?: boolean
  onFile?: (file: File) => void
}>) {
  const { dragging, dropProps } = useFileDrop({ disabled, isolate, onFile })
  return (
    <div data-testid="zone" data-dragging={dragging} {...dropProps}>
      {withChild && <span data-testid="child">enfant</span>}
    </div>
  )
}

/** `dragleave` avec un `relatedTarget` réel : jsdom n'a pas de `DragEvent` (QUIRKS), posé à la main. */
function leaveToward(target: Element, relatedTarget: Element | null) {
  const leave = createEvent.dragLeave(target, { dataTransfer: files })
  Object.defineProperty(leave, 'relatedTarget', { value: relatedTarget })
  fireEvent(target, leave)
}

/**
 * Survol de l'enfant, puis enfant démonté : son `dragleave` n'atteindra jamais React. Ordre
 * Chromium / Firefox : `dragenter` du nouvel élément, puis `dragleave` de l'ancien avec
 * `relatedTarget` posé.
 */
function hoverChildThenUnmountIt() {
  const view = render(<Zone />)
  const zone = screen.getByTestId('zone')
  const child = screen.getByTestId('child')
  fireEvent.dragEnter(zone, { dataTransfer: files })
  fireEvent.dragEnter(child, { dataTransfer: files })
  leaveToward(zone, child)
  fireEvent.dragOver(child, { dataTransfer: files })
  view.rerender(<Zone withChild={false} />)
  expect(draggingState()).toBe('true')
  return view
}

/** Appels d'`addEventListener` / `removeEventListener` portant sur le glisser-déposer. */
function dragTypes(calls: ReadonlyArray<readonly unknown[]>) {
  return calls.filter(([type]) => typeof type === 'string' && /^(drag|drop)/.test(type))
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function draggingState(): string | null {
  return screen.getByTestId('zone').dataset.dragging ?? null
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useFileDrop', () => {
  test('surimpression tenue en survolant un enfant, retirée en quittant la zone', () => {
    render(<Zone />)
    const zone = screen.getByTestId('zone')
    const child = screen.getByTestId('child')
    fireEvent.dragEnter(zone, { dataTransfer: files })
    fireEvent.dragOver(zone, { dataTransfer: files })
    expect(draggingState()).toBe('true')
    // Passage sur l'enfant : `dragenter` de l'enfant puis `dragleave` de la zone (relatedTarget nul
    // sous WebKit) : la surimpression ne doit pas clignoter.
    fireEvent.dragEnter(child, { dataTransfer: files })
    fireEvent.dragLeave(zone, { dataTransfer: files, relatedTarget: null })
    expect(draggingState()).toBe('true')
    fireEvent.dragLeave(child, { dataTransfer: files, relatedTarget: null })
    expect(draggingState()).toBe('false')
  })

  test('dépôt : appelle onFile avec le premier fichier et retire la surimpression', () => {
    const onFile = vi.fn<(file: File) => void>()
    render(<Zone onFile={onFile} />)
    const zone = screen.getByTestId('zone')
    fireEvent.dragEnter(zone, { dataTransfer: files })
    fireEvent.dragEnter(screen.getByTestId('child'), { dataTransfer: files })
    const drop = createEvent.drop(zone, { dataTransfer: files })
    fireEvent(zone, drop)
    expect(drop.defaultPrevented).toBe(true)
    expect(onFile).toHaveBeenCalledExactlyOnceWith(file)
    expect(draggingState()).toBe('false')
    // Le compteur repart de zéro : un nouveau survol réaffiche la surimpression.
    fireEvent.dragEnter(zone, { dataTransfer: files })
    expect(draggingState()).toBe('true')
  })

  test('dragover sans dragenter préalable : surimpression amorcée, retirée au premier dragleave', () => {
    render(<Zone />)
    const zone = screen.getByTestId('zone')
    fireEvent.dragOver(zone, { dataTransfer: files })
    fireEvent.dragOver(zone, { dataTransfer: files })
    expect(draggingState()).toBe('true')
    fireEvent.dragLeave(zone, { dataTransfer: files, relatedTarget: null })
    expect(draggingState()).toBe('false')
  })

  test('texte glissé (pas de fichier) : ni surimpression ni preventDefault', () => {
    render(<Zone />)
    const zone = screen.getByTestId('zone')
    const text = { files: [], types: ['text/plain'] }
    fireEvent.dragEnter(zone, { dataTransfer: text })
    expect(fireEvent.dragOver(zone, { dataTransfer: text })).toBe(true)
    expect(draggingState()).toBe('false')
  })

  test('désactivé : dragover empêché (dropEffect none), sans surimpression, dépôt ignoré', () => {
    const onFile = vi.fn<(file: File) => void>()
    render(<Zone disabled onFile={onFile} />)
    const zone = screen.getByTestId('zone')
    const transfer = { ...files, dropEffect: 'copy' }
    fireEvent.dragEnter(zone, { dataTransfer: transfer })
    expect(fireEvent.dragOver(zone, { dataTransfer: transfer })).toBe(false)
    expect(transfer.dropEffect).toBe('none')
    expect(draggingState()).toBe('false')
    fireEvent.drop(zone, { dataTransfer: files })
    expect(onFile).not.toHaveBeenCalled()
  })

  test('isolate : la propagation est arrêtée au dragover et au dépôt', () => {
    const outerDrop = vi.fn<() => void>()
    const outerOver = vi.fn<() => void>()
    render(
      <div onDrop={outerDrop} onDragOver={outerOver}>
        <Zone isolate />
      </div>,
    )
    const zone = screen.getByTestId('zone')
    fireEvent.dragOver(zone, { dataTransfer: files })
    fireEvent.drop(zone, { dataTransfer: files })
    expect(outerOver).not.toHaveBeenCalled()
    expect(outerDrop).not.toHaveBeenCalled()
  })

  describe('filet window (#87)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    test('ordre Chromium, élément survolé démonté, puis sortie de fenêtre : retirée après le délai', () => {
      hoverChildThenUnmountIt()
      leaveToward(document.body, null)
      advance(WINDOW_EXIT_DELAY_MS - 1)
      expect(draggingState()).toBe('true')
      advance(1)
      expect(draggingState()).toBe('false')
      // Compteur remis à zéro : un nouveau survol puis une sortie de la zone la retirent.
      fireEvent.dragEnter(screen.getByTestId('zone'), { dataTransfer: files })
      expect(draggingState()).toBe('true')
      leaveToward(screen.getByTestId('zone'), document.body)
      expect(draggingState()).toBe('false')
    })

    test('élément survolé démonté, puis dépôt ailleurs sur la page : retirée aussitôt', () => {
      hoverChildThenUnmountIt()
      fireEvent.drop(document.body, { dataTransfer: files })
      expect(draggingState()).toBe('false')
    })

    test('paire WebKit parent → enfant (relatedTarget nul) : le dragover suivant annule le délai', () => {
      render(<Zone />)
      const zone = screen.getByTestId('zone')
      const child = screen.getByTestId('child')
      fireEvent.dragEnter(zone, { dataTransfer: files })
      fireEvent.dragEnter(child, { dataTransfer: files })
      leaveToward(zone, null)
      fireEvent.dragOver(child, { dataTransfer: files })
      advance(WINDOW_EXIT_DELAY_MS * 3)
      expect(draggingState()).toBe('true')
    })

    test('dragenter après un dragleave sans relatedTarget : délai annulé aussi', () => {
      render(<Zone />)
      const zone = screen.getByTestId('zone')
      fireEvent.dragEnter(zone, { dataTransfer: files })
      leaveToward(document.body, null)
      fireEvent.dragEnter(screen.getByTestId('child'), { dataTransfer: files })
      advance(WINDOW_EXIT_DELAY_MS * 3)
      expect(draggingState()).toBe('true')
    })

    test('dragleave avec relatedTarget (passage interne) : aucun délai lancé', () => {
      render(<Zone />)
      fireEvent.dragEnter(screen.getByTestId('zone'), { dataTransfer: files })
      leaveToward(document.body, screen.getByTestId('child'))
      advance(WINDOW_EXIT_DELAY_MS * 3)
      expect(draggingState()).toBe('true')
    })

    test('démontage pendant le délai : minuteur annulé, écouteurs retirés', () => {
      const add = vi.spyOn(window, 'addEventListener')
      const remove = vi.spyOn(window, 'removeEventListener')
      const { unmount } = render(<Zone />)
      expect(dragTypes(add.mock.calls)).toEqual([])
      fireEvent.dragEnter(screen.getByTestId('zone'), { dataTransfer: files })
      const added = dragTypes(add.mock.calls)
      expect(added.length).toBeGreaterThan(0)
      leaveToward(document.body, null)
      expect(vi.getTimerCount()).toBe(1)
      unmount()
      expect(vi.getTimerCount()).toBe(0)
      expect(dragTypes(remove.mock.calls)).toHaveLength(added.length)
    })
  })
})
