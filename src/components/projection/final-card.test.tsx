import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { makeUi } from '@/testing/make-ui'
import type { ProjectedStudentView } from '@/domain/presentation/projected-view'
import { FinalCard } from './final-card'

const categories: ProjectedStudentView['categories'] = [
  {
    id: 'algo',
    label: 'Algorithmique',
    color: '#21d3ee',
    icon: 'leaf',
    exhausted: false,
    disabled: true,
  },
]

test('aucune note à afficher : « Passage terminé », pas de section vide', () => {
  const { container } = render(
    <FinalCard
      ui={makeUi()}
      categories={categories}
      final={{ scale: 20, decimals: 2 }}
      detail={undefined}
    />,
  )
  expect(screen.getByText('Passage terminé')).toBeInTheDocument()
  expect(container.querySelector('section')).toBeNull()
})

const row = (questionId: string, extra: { points?: number; skipped?: boolean } = {}) => ({
  questionId,
  categoryId: 'algo',
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
      categories={categories}
      final={{ final: 12, scale: 20, decimals: 2 }}
      detail={[row('q-1', { points: 3 }), row('q-2')]}
    />,
  )
  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(2)
  expect(items[0]).toHaveTextContent('Algorithmique · Tri rapide')
  expect(items[0]).toHaveTextContent('3 / 4')
  // Badge de la catégorie lu par `categoryId` dans `categories` (D103).
  expect(items[0]!.querySelector('[aria-hidden="true"]')?.getAttribute('style')).toContain(
    '#21d3ee',
  )
  expect(items[1]).toHaveTextContent('— / 4')
  expect(items[1]).not.toHaveTextContent('0 / 4')
})

test('détail : deux lignes de même catégorie et même titre restent deux lignes', () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    render(
      <FinalCard
        ui={makeUi()}
        categories={categories}
        final={{ final: 12, scale: 20, decimals: 2 }}
        detail={[row('q-1', { points: 1 }), row('q-2', { points: 2 })]}
      />,
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(errors).not.toHaveBeenCalled()
  } finally {
    errors.mockRestore()
  }
})

test.each([
  [2, 'fr', '11,50'],
  [0, 'fr', '12'],
  [2, 'en', '11.50'],
] as const)('note selon l’arrondi : %i décimales en %s → « %s »', (decimals, locale, shown) => {
  render(
    <FinalCard
      ui={makeUi(locale)}
      categories={categories}
      final={{ final: 11.5, scale: 20, decimals }}
      detail={undefined}
    />,
  )
  expect(screen.getByText(shown)).toBeInTheDocument()
})

test('jauge : phrase pour les lecteurs d’écran', () => {
  render(
    <FinalCard
      ui={makeUi()}
      categories={categories}
      final={{ final: 11.5, scale: 20, decimals: 2 }}
      detail={undefined}
    />,
  )
  expect(screen.getByText('Note : 11,50 sur 20')).toHaveClass('sr-only')
})

test('score brut : jusqu’à 3 décimales, sans zéro final', () => {
  render(
    <FinalCard
      ui={makeUi()}
      categories={categories}
      final={{ final: 11.5, raw: 5.5, scale: 20, decimals: 2 }}
      detail={undefined}
    />,
  )
  expect(screen.getByText('Score brut').closest('p')).toHaveTextContent('Score brut 5,5')
})

test('brute seule (finalScoreDisplay raw) : en grand, sans jauge', () => {
  render(
    <FinalCard
      ui={makeUi()}
      categories={categories}
      final={{ raw: 5.5, scale: 20, decimals: 2 }}
      detail={undefined}
    />,
  )
  expect(screen.getByText('5,5')).toBeInTheDocument()
  expect(screen.queryByText(/sur 20/)).not.toBeInTheDocument()
})

test('détail : « Passée » pour une question passée', () => {
  render(
    <FinalCard
      ui={makeUi()}
      categories={categories}
      final={{ final: 12, scale: 20, decimals: 2 }}
      detail={[row('q-1', { skipped: true })]}
    />,
  )
  expect(screen.getByRole('heading', { level: 2, name: 'Détail par question' })).toBeInTheDocument()
  expect(screen.getByRole('listitem')).toHaveTextContent('Passée')
})
