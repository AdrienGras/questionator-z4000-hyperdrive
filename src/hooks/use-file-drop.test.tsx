import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { useFileDrop } from './use-file-drop'

const file = new File(['{}'], 'a.json', { type: 'application/json' })
const files = { files: [file], types: ['Files'] }

function Zone({
  disabled = false,
  isolate = false,
  onFile = () => {},
}: Readonly<{ disabled?: boolean; isolate?: boolean; onFile?: (file: File) => void }>) {
  const { dragging, dropProps } = useFileDrop({ disabled, isolate, onFile })
  return (
    <div data-testid="zone" data-dragging={dragging} {...dropProps}>
      <span data-testid="child">enfant</span>
    </div>
  )
}

function draggingState(): string | null {
  return screen.getByTestId('zone').dataset.dragging ?? null
}

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
})
