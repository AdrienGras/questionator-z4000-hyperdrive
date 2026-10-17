import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { makeSession } from '@/testing/session-fixtures'
import { makeListStudent } from '@/testing/student-fixtures'
import { makeUi } from '@/testing/make-ui'
import { SessionProgress } from './session-progress'

/** `done` passés, `absent` absents, le reste à faire. */
function sessionWith(done: number, absent: number, total: number) {
  return makeSession({
    students: Array.from({ length: total }, (_, i) =>
      makeListStudent(`s${i}`, `N${i}`, i + 1, i < done ? [2] : [], {
        absent: i >= done && i < done + absent,
      }),
    ),
  })
}

test('passés en chiffre clé, total, absents et restants, jauge nommée', () => {
  render(<SessionProgress ui={makeUi()} session={sessionWith(7, 2, 24)} />)
  expect(screen.getByText('7')).toBeInTheDocument()
  expect(screen.getByText('/ 24 passés')).toBeInTheDocument()
  expect(screen.getByText('2 absents · 15 restants')).toBeInTheDocument()
  expect(
    screen.getByRole('progressbar', { name: '7 passés · 2 absents · 15 restants' }),
  ).toBeInTheDocument()
})

test('accord au singulier : 1 / 1 passé, 0 absent · 0 restant', () => {
  render(<SessionProgress ui={makeUi()} session={sessionWith(1, 0, 1)} />)
  expect(screen.getByText('/ 1 passé')).toBeInTheDocument()
  expect(screen.getByText('0 absent · 0 restant')).toBeInTheDocument()
})

test('en anglais : / 24 done, 2 absent · 15 remaining', () => {
  render(<SessionProgress ui={makeUi('en')} session={sessionWith(7, 2, 24)} />)
  expect(screen.getByText('/ 24 done')).toBeInTheDocument()
  expect(screen.getByText('2 absent · 15 remaining')).toBeInTheDocument()
})
