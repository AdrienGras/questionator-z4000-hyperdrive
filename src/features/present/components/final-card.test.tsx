import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { makeUi } from '@/testing/make-ui'
import { FinalCard } from './final-card'

test('aucune note à afficher : « Passage terminé », pas de section vide', () => {
  const { container } = render(<FinalCard ui={makeUi()} final={{ scale: 20 }} detail={undefined} />)
  expect(screen.getByText('Passage terminé')).toBeInTheDocument()
  expect(container.querySelector('section')).toBeNull()
})
