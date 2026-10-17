import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { ProjectedStudentView } from '@/domain/presentation/projected-view'
import { makeUi } from '@/testing/make-ui'
import { ProjectionHeader } from './projection-header'

const view = (extra: Partial<ProjectedStudentView> = {}): ProjectedStudentView => ({
  mode: 'student',
  examTitle: 'Oral PHP',
  appearance: {
    locale: 'fr',
    theme: { light: {}, dark: {} },
    presentation: { defaultColorMode: 'dark' },
  },
  student: { firstName: 'Alice', lastName: 'Durand', order: 1 },
  categories: [],
  questionIndex: { current: 2, total: 3 },
  finished: false,
  drawAnimation: false,
  ...extra,
})

test('cartes Question et Score', () => {
  render(<ProjectionHeader ui={makeUi()} view={view({ cumulativeRaw: 1.5 })} />)
  expect(screen.getByRole('heading', { level: 1, name: 'Alice Durand' })).toBeInTheDocument()
  expect(screen.getByText('Oral PHP')).toBeInTheDocument()
  expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual(['Question', 'Score'])
  expect(screen.getAllByRole('definition').map((value) => value.textContent)).toEqual([
    '2 / 3',
    '1,5',
  ])
})

test('sans score cumulé : carte Question seule', () => {
  render(<ProjectionHeader ui={makeUi()} view={view()} />)
  expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual(['Question'])
})

test('terminé : pastille « Passage terminé », sans cartes', () => {
  render(<ProjectionHeader ui={makeUi()} view={view({ finished: true })} />)
  expect(screen.getByText('Passage terminé')).toBeInTheDocument()
  expect(screen.queryByRole('term')).not.toBeInTheDocument()
})
