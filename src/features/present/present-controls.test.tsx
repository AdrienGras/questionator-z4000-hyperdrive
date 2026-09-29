import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AppearanceProvider } from '@/app/appearance-provider'
import { PresentControls } from '@/features/present/components/present-controls'
import { useIdle } from '@/features/present/hooks/use-idle'

function Harness() {
  const idle = useIdle(3000)
  return (
    <main data-testid="main">
      <PresentControls idle={idle} />
    </main>
  )
}

function mount() {
  return render(
    <AppearanceProvider>
      <Harness />
    </AppearanceProvider>,
  )
}

// jsdom n'implémente pas l'API plein écran : on la simule et on restaure après chaque test.
let current: Element | null = null
const request = vi.fn<() => Promise<void>>()
const exit = vi.fn<() => Promise<void>>()

beforeEach(() => {
  vi.useFakeTimers()
  current = null
  request.mockReset().mockResolvedValue(undefined)
  exit.mockReset().mockResolvedValue(undefined)
  Object.defineProperty(document, 'fullscreenElement', { get: () => current, configurable: true })
  Object.defineProperty(document, 'exitFullscreen', { value: exit, configurable: true })
  Object.defineProperty(document.documentElement, 'requestFullscreen', {
    value: request,
    configurable: true,
  })
})
afterEach(() => {
  vi.useRealTimers()
  Reflect.deleteProperty(document, 'fullscreenElement')
  Reflect.deleteProperty(document, 'exitFullscreen')
  Reflect.deleteProperty(document.documentElement, 'requestFullscreen')
})

test('« Plein écran » demande le plein écran du document', () => {
  mount()
  fireEvent.click(screen.getByRole('button', { name: 'Plein écran' }))
  expect(request).toHaveBeenCalledTimes(1)
})

test('bouton absent si l’API plein écran manque', () => {
  Reflect.deleteProperty(document.documentElement, 'requestFullscreen')
  mount()
  expect(screen.queryByRole('button', { name: 'Plein écran' })).not.toBeInTheDocument()
})

test('en plein écran : libellé « Quitter le plein écran », clic ferme', () => {
  mount()
  current = document.documentElement
  act(() => {
    document.dispatchEvent(new Event('fullscreenchange'))
  })
  fireEvent.click(screen.getByRole('button', { name: 'Quitter le plein écran' }))
  expect(exit).toHaveBeenCalledTimes(1)
})

test('3 s sans événement : commandes masquées, un mouvement les ramène', () => {
  const { container } = mount()
  const controls = container.querySelector('[data-controls]')
  expect(controls).not.toHaveClass('opacity-0')

  act(() => {
    vi.advanceTimersByTime(3000)
  })
  expect(controls).toHaveClass('opacity-0')

  act(() => {
    fireEvent.mouseMove(window)
  })
  expect(controls).not.toHaveClass('opacity-0')
})
