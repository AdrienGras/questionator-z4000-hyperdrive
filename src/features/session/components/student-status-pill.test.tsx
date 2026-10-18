import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { makeUi } from '@/testing/make-ui'
import { StudentStatusPill } from './student-status-pill'

test.each([
  ['todo', 'à passer', 'text-muted-foreground'],
  ['in_progress', 'en cours', 'text-link'],
  ['done', 'terminé', 'text-space-training'],
  ['absent', 'absent', 'text-muted-foreground'],
] as const)('statut %s : « %s »', (status, label, color) => {
  render(<StudentStatusPill ui={makeUi()} status={status} />)
  expect(screen.getByText(label)).toHaveClass(color)
})
