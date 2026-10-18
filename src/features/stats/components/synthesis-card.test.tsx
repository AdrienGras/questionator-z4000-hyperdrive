import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { GradeStats, Headcount } from '@/domain/stats/types'
import { makeConfig } from '@/testing/student-fixtures'
import { makeUi } from '@/testing/make-ui'
import { SynthesisCard } from './synthesis-card'

const HEADCOUNT: Headcount = {
  total: 10,
  done: 7,
  inProgress: 0,
  todo: 2,
  absent: 1,
  addedDuringSession: 0,
}

const GRADES: GradeStats = {
  count: 7,
  min: null,
  max: null,
  mean: 13.0714,
  median: 13,
  stdDev: null,
}

/** Valeur (`dd`) qui suit le libellé `label` (`dt`). */
function figure(label: string): string {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling?.textContent ?? ''
}

function renderCard(grades: GradeStats = GRADES, finalScale = 20) {
  return render(
    <SynthesisCard
      ui={makeUi()}
      config={makeConfig({ finalScale })}
      headcount={HEADCOUNT}
      grades={grades}
    />,
  )
}

test('cinq chiffres : effectifs, moyenne et médiane sur le barème final', () => {
  renderCard()
  expect(screen.getByRole('region', { name: 'Chiffres clés' })).toBeInTheDocument()
  expect(figure('Étudiants')).toBe('10')
  expect(figure('Passés')).toBe('7')
  expect(figure('Absents')).toBe('1')
  expect(figure('Moyenne')).toBe('13,07 / 20')
  expect(figure('Médiane')).toBe('13,00 / 20')
})

test('barre empilée : un segment par statut non nul, proportionnel à l’effectif', () => {
  const { container } = renderCard()
  const segments = [...container.querySelectorAll<HTMLElement>('[data-status]')]
  expect(segments.map((s) => s.dataset.status)).toEqual(['done', 'todo', 'absent'])
  expect(segments.map((s) => s.style.width)).toEqual(['70%', '20%', '10%'])
  expect(segments[0]!.closest('[aria-hidden="true"]')).not.toBeNull()
})

test('légende : quatre statuts puis les ajoutés en séance', () => {
  renderCard()
  const legend = screen.getByRole('list')
  expect(
    within(legend)
      .getAllByRole('listitem')
      .map((li) => li.textContent),
  ).toEqual(['7 passés', '0 en cours', '2 à passer', '1 absent', '0 ajouté en séance'])
})

test('aucun terminé : moyenne et médiane « — », sans barème', () => {
  renderCard({ ...GRADES, count: 0, mean: null, median: null })
  expect(figure('Moyenne')).toBe('—')
  expect(figure('Médiane')).toBe('—')
})

test('barème final de 2,5 : « / 2,5 »', () => {
  renderCard(GRADES, 2.5)
  expect(figure('Moyenne')).toBe('13,07 / 2,5')
})
