import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { makeUi } from '@/testing/make-ui'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { AttemptList } from './attempt-list'

const ui = makeUi('fr')
const config = makeConfig({ questionsPerStudent: 3, maxRawScore: 6 })

test('numérote les seules questions notées et affiche points et motif de passe', () => {
  const { attempts } = makeStudent([2, { skipped: 'hors sujet' }, 1])
  render(<AttemptList ui={ui} config={config} attempts={attempts} />)

  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(3)
  expect(items[0]).toHaveTextContent('1.')
  expect(items[0]).toHaveTextContent('2 / 2')
  expect(items[1]).toHaveTextContent('Passée — hors sujet')
  expect(items[1]).not.toHaveTextContent(/\d\./)
  expect(items[2]).toHaveTextContent('2.')
  expect(items[2]).toHaveTextContent('1 / 2')
})

test('une question en cours affiche « En cours », sans rang', () => {
  const { attempts } = makeStudent([2, 'pending'])
  render(<AttemptList ui={ui} config={config} attempts={attempts} />)

  const items = screen.getAllByRole('listitem')
  expect(items[1]).toHaveTextContent('En cours')
  expect(items[1]).not.toHaveTextContent(/\d\./)
})

test('sans onEditScore, aucun sélecteur', () => {
  const { attempts } = makeStudent([2, 'pending'])
  render(<AttemptList ui={ui} config={config} attempts={attempts} />)

  expect(screen.queryByRole('combobox')).toBeNull()
})

test('avec onEditScore, un sélecteur par question notée seulement', () => {
  const { attempts } = makeStudent([2, { skipped: '' }, 'pending', 1])
  render(
    <AttemptList
      ui={ui}
      config={config}
      attempts={attempts}
      onEditScore={vi.fn<(id: string, score: number) => void>()}
    />,
  )

  expect(screen.getAllByRole('combobox')).toHaveLength(2)
  const first = screen.getByRole('combobox', { name: 'Note de la question 1' })
  const second = screen.getByRole('combobox', { name: 'Note de la question 2' })
  expect(
    within(first)
      .getAllByRole('option')
      .map((o) => o.textContent),
  ).toEqual(['0', '1', '2'])
  expect(first).toHaveValue('2')
  expect(second).toHaveValue('1')
  expect(first.closest('li')).toHaveTextContent('/ 2')
})

test('changer la valeur appelle onEditScore avec le nombre du barème', () => {
  const onEditScore = vi.fn<(id: string, score: number) => void>()
  const { attempts } = makeStudent([2])
  render(<AttemptList ui={ui} config={config} attempts={attempts} onEditScore={onEditScore} />)

  fireEvent.change(screen.getByRole('combobox', { name: 'Note de la question 1' }), {
    target: { value: '1' },
  })

  expect(onEditScore).toHaveBeenCalledWith('attempt-1', 1)
})

test('disabled désactive les sélecteurs', () => {
  const { attempts } = makeStudent([2])
  render(
    <AttemptList
      ui={ui}
      config={config}
      attempts={attempts}
      onEditScore={vi.fn<(id: string, score: number) => void>()}
      disabled
    />,
  )

  expect(screen.getByRole('combobox', { name: 'Note de la question 1' })).toBeDisabled()
})
