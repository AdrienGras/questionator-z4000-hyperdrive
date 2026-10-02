import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { makeScreenCategory, screenConfig } from '@/testing/screen-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { makeUi } from '@/testing/make-ui'
import { CategoryGrid } from './category-grid'

/** Deux catégories : barème 0-1 (« 1 pt ») et 0-2,5 (« 2,5 pts »). */
function mount(locale: 'fr' | 'en', showCategoryPoints = true) {
  const base = screenConfig()
  const config = {
    ...base,
    presentation: { ...base.presentation, showCategoryPoints },
    categories: [
      { ...makeScreenCategory({ scale: [0, 1] }), id: 'a', label: 'Facile' },
      { ...makeScreenCategory({ scale: [0, 2.5] }), id: 'b', label: 'Normal', order: 2 },
    ],
  }
  render(
    <CategoryGrid
      ui={makeUi(locale)}
      config={config}
      student={makeStudent([])}
      disabled={false}
      onDraw={() => {}}
    />,
  )
}

test('chaque case affiche le maximum de son barème en points, au singulier pour 1', () => {
  mount('fr')
  expect(screen.getByRole('button', { name: /^Facile/ })).toHaveTextContent('1 pt')
  expect(screen.getByRole('button', { name: /^Normal/ })).toHaveTextContent('2,5 pts')
})

test('en anglais : même format', () => {
  mount('en')
  expect(screen.getByRole('button', { name: /^Facile/ })).toHaveTextContent('1 pt')
  expect(screen.getByRole('button', { name: /^Normal/ })).toHaveTextContent('2.5 pts')
})

test('les points restent affichés à l’examinateur sans showCategoryPoints', () => {
  mount('fr', false)
  expect(screen.getByRole('button', { name: /^Normal/ })).toHaveTextContent('2,5 pts')
})
