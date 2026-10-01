import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { computeScores } from '@/domain/scoring/score'
import type { Student } from '@/domain/session/types'
import { makeUi } from '@/testing/make-ui'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { ScoreList } from './score-list'

const ui = makeUi('fr')
const config = makeConfig({ questionsPerStudent: 1, maxRawScore: 2, finalScale: 20 })

function renderScores(student: Student, scoreConfig: NormalizedConfig) {
  render(
    <ScoreList
      ui={ui}
      config={scoreConfig}
      student={student}
      scores={computeScores(student, scoreConfig)}
    />,
  )
}

function value(label: string): string {
  return screen.getByText(label).nextElementSibling?.textContent ?? ''
}

test('étudiant terminé : cinq valeurs chiffrées', () => {
  const student = makeStudent([1], { adjustment: { value: 1, reason: 'bonus' } })
  renderScores(student, config)

  expect(value('Note brute')).toBe('1')
  expect(value('Note plafonnée')).toBe('1')
  expect(value('Note convertie')).toBe('10,00')
  expect(value('Ajustement')).toBe('+1,00bonus')
  expect(value('Note finale')).toBe('11,00 / 20')
})

test('étudiant en cours : convertie et finale « — », ajustement « aucun »', () => {
  const student = makeStudent([1, 'pending'])
  renderScores(student, makeConfig({ questionsPerStudent: 2, maxRawScore: 4, finalScale: 20 }))

  expect(value('Note brute')).toBe('1')
  expect(value('Note plafonnée')).toBe('1')
  expect(value('Note convertie')).toBe('—')
  expect(value('Ajustement')).toBe('aucun')
  expect(value('Note finale')).toBe('—')
})

test('ajustement nul enregistré : « aucun », puis le motif', () => {
  const scaledConfig = makeConfig({ questionsPerStudent: 1, maxRawScore: 2, finalScale: 20 })
  const student = makeStudent([1], { adjustment: { value: 0, reason: 'x' } })
  renderScores(student, scaledConfig)

  expect(value('Ajustement')).toBe('aucunx')
})
