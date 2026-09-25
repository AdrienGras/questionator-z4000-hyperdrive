import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { useUi } from '@/lib/i18n/use-ui'
import { SessionFallback } from './session-fallback'

const MAIN_CLASSES = [
  'flex',
  'min-h-svh',
  'flex-col',
  'items-center',
  'justify-center',
  'gap-4',
  'p-6',
  'text-center',
]

function Loading() {
  return <SessionFallback ui={useUi()} kind="loading" />
}

test('l’état chargement est enveloppé dans le même <main> que « introuvable »', () => {
  render(<Loading />)
  const main = screen.getByText('Chargement de la session…').closest('main')
  expect(main).not.toBeNull()
  expect(main).toHaveClass(...MAIN_CLASSES)
})
