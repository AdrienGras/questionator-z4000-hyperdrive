import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { makeUi } from '@/testing/make-ui'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { ScoreList } from './score-list'

const ui = makeUi('fr')
const config = makeConfig({ questionsPerStudent: 1, maxRawScore: 2, finalScale: 20 })

function value(label: string): string {
  return screen.getByText(label).nextElementSibling?.textContent ?? ''
}

test('étudiant terminé : cinq valeurs chiffrées', () => {
  const student = makeStudent([1], { adjustment: { value: 1, reason: 'bonus' } })
  render(<ScoreList ui={ui} config={config} student={student} />)

  expect(value('Note brute')).toBe('1')
  expect(value('Note plafonnée')).toBe('1')
  expect(value('Note convertie')).toBe('10,00')
  expect(value('Ajustement')).toBe('+1,00bonus')
  expect(value('Note finale')).toBe('11,00 / 20')
})

test('étudiant en cours : convertie et finale « — », ajustement « aucun »', () => {
  const student = makeStudent([1, 'pending'])
  render(
    <ScoreList
      ui={ui}
      config={makeConfig({ questionsPerStudent: 2, maxRawScore: 4, finalScale: 20 })}
      student={student}
    />,
  )

  expect(value('Note brute')).toBe('1')
  expect(value('Note plafonnée')).toBe('1')
  expect(value('Note convertie')).toBe('—')
  expect(value('Ajustement')).toBe('aucun')
  expect(value('Note finale')).toBe('—')
})

test('ajustement nul enregistré : « aucun », puis le motif', () => {
  const scaledConfig = makeConfig({ questionsPerStudent: 1, maxRawScore: 2, finalScale: 20 })
  const student = makeStudent([1], { adjustment: { value: 0, reason: 'x' } })
  render(<ScoreList ui={ui} config={scaledConfig} student={student} />)

  expect(value('Ajustement')).toBe('aucunx')
})
