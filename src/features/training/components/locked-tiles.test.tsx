import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { makeUi } from '@/testing/make-ui'
import { makeTrainingConfig } from '@/testing/training-fixtures'
import { LockedTiles } from './locked-tiles'

const LABEL = 'Catégories (indisponibles pendant la question)'

test('une tuile par catégorie, la courante marquée, rien de cliquable', () => {
  render(<LockedTiles ui={makeUi('fr')} config={makeTrainingConfig()} currentCategoryId="b" />)
  const list = screen.getByRole('list', { name: LABEL })
  expect(within(list).getAllByRole('listitem')).toHaveLength(2)
  const current = list.querySelectorAll('[aria-current="true"]')
  expect(current).toHaveLength(1)
  expect(current[0]).toHaveTextContent(/^B/)
  expect(within(list).queryByRole('button')).toBeNull()
})

test('sans catégorie courante : aucune marquée', () => {
  render(
    <LockedTiles ui={makeUi('fr')} config={makeTrainingConfig()} currentCategoryId={undefined} />,
  )
  expect(screen.getByRole('list', { name: LABEL }).querySelector('[aria-current]')).toBeNull()
})
