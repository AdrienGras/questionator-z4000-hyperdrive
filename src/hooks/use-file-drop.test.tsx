import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { useFileDrop } from './use-file-drop'

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

/** Survol en cours sur l'enfant, puis enfant démonté : son `dragleave` n'atteindra jamais React. */
function hoverChildThenUnmountIt() {
  const view = render(<Zone />)
  fireEvent.dragEnter(screen.getByTestId('zone'), { dataTransfer: files })
  fireEvent.dragEnter(screen.getByTestId('child'), { dataTransfer: files })
  fireEvent.dragLeave(screen.getByTestId('zone'), { dataTransfer: files, relatedTarget: null })
  view.rerender(<Zone withChild={false} />)
  expect(draggingState()).toBe('true')
  return view
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
    test('élément survolé démonté, puis le glisser quitte la fenêtre : surimpression retirée', () => {
      hoverChildThenUnmountIt()
      // Sortie de la fenêtre : `dragleave` sans `relatedTarget` ni `dragenter` qui le précède.
      fireEvent.dragLeave(document.body, { dataTransfer: files, relatedTarget: null })
      expect(draggingState()).toBe('false')
      // Le compteur est remis à zéro : un nouveau survol puis une sortie de la zone la retirent.
      fireEvent.dragEnter(screen.getByTestId('zone'), { dataTransfer: files })
      expect(draggingState()).toBe('true')
      fireEvent.dragLeave(screen.getByTestId('zone'), { dataTransfer: files, relatedTarget: null })
      expect(draggingState()).toBe('false')
    })

    test('élément survolé démonté, puis dépôt ailleurs sur la page : surimpression retirée', () => {
      hoverChildThenUnmountIt()
      fireEvent.drop(document.body, { dataTransfer: files })
      expect(draggingState()).toBe('false')
    })

    test('dragleave sans relatedTarget précédé d’un dragenter (passage vers un enfant, WebKit) : surimpression tenue', () => {
      render(<Zone />)
      const zone = screen.getByTestId('zone')
      fireEvent.dragEnter(zone, { dataTransfer: files })
      fireEvent.dragEnter(screen.getByTestId('child'), { dataTransfer: files })
      fireEvent.dragLeave(zone, { dataTransfer: files, relatedTarget: null })
      fireEvent.dragEnter(zone, { dataTransfer: files })
      fireEvent.dragLeave(screen.getByTestId('child'), { dataTransfer: files, relatedTarget: null })
      expect(draggingState()).toBe('true')
    })

    test('dragleave avec relatedTarget (Chromium, passage interne) : ignoré par le filet', () => {
      render(<Zone />)
      const zone = screen.getByTestId('zone')
      fireEvent.dragEnter(zone, { dataTransfer: files })
      // jsdom n'a pas de `DragEvent` : l'événement est un `Event` sans `relatedTarget`, posé à la main.
      const leave = createEvent.dragLeave(document.body, { dataTransfer: files })
      Object.defineProperty(leave, 'relatedTarget', { value: screen.getByTestId('child') })
      fireEvent(document.body, leave)
      expect(draggingState()).toBe('true')
    })

    test('sans survol en cours, aucun écouteur sur window', () => {
      const add = vi.spyOn(window, 'addEventListener')
      const remove = vi.spyOn(window, 'removeEventListener')
      const { unmount } = render(<Zone />)
      expect(add.mock.calls.filter(([type]) => type.startsWith('drag') || type === 'drop')).toEqual(
        [],
      )
      fireEvent.dragEnter(screen.getByTestId('zone'), { dataTransfer: files })
      const added = add.mock.calls.filter(([type]) => type.startsWith('drag') || type === 'drop')
      expect(added.length).toBeGreaterThan(0)
      unmount()
      const removed = remove.mock.calls.filter(
        ([type]) => type.startsWith('drag') || type === 'drop',
      )
      expect(removed.length).toBe(added.length)
    })
  })
})
