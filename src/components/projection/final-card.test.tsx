import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { makeUi } from '@/testing/make-ui'
import { FinalCard } from './final-card'

test('aucune note à afficher : « Passage terminé », pas de section vide', () => {
  const { container } = render(<FinalCard ui={makeUi()} final={{ scale: 20 }} detail={undefined} />)
  expect(screen.getByText('Passage terminé')).toBeInTheDocument()
  expect(container.querySelector('section')).toBeNull()
})

const row = (questionId: string, extra: { points?: number; skipped?: boolean } = {}) => ({
  questionId,
  categoryLabel: 'Algorithmique',
  title: 'Tri rapide',
  maxPoints: 4,
  skipped: false,
  ...extra,
})

test('détail : catégorie et titre séparés, aucune note inventée', () => {
  render(
    <FinalCard
      ui={makeUi()}
      final={{ final: 12, scale: 20 }}
      detail={[row('q-1', { points: 3 }), row('q-2')]}
    />,
  )
  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(2)
  expect(items[0]).toHaveTextContent('Algorithmique · Tri rapide')
  expect(items[0]).toHaveTextContent('3 / 4')
  expect(items[1]).toHaveTextContent('— / 4')
  expect(items[1]).not.toHaveTextContent('0 / 4')
})

test('détail : deux lignes de même catégorie et même titre restent deux lignes', () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  render(
    <FinalCard
      ui={makeUi()}
      final={{ final: 12, scale: 20 }}
      detail={[row('q-1', { points: 1 }), row('q-2', { points: 2 })]}
    />,
  )
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  expect(errors).not.toHaveBeenCalled()
  errors.mockRestore()
})
