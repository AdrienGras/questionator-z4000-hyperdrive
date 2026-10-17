import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { makeUi } from '@/testing/make-ui'
import { PassageProgress } from './passage-progress'

const config = makeConfig({ questionsPerStudent: 3 })

test('phrase des segments remplis pour les lecteurs d’écran', () => {
  render(<PassageProgress ui={makeUi()} config={config} student={makeStudent([1, 'pending'])} />)
  expect(screen.getByText('Question 2 sur 3 : A notée, A en cours')).toHaveClass('sr-only')
  expect(screen.getByText('Question 2')).toBeInTheDocument()
})

test('premier tirage pas encore fait', () => {
  render(<PassageProgress ui={makeUi()} config={config} student={makeStudent()} />)
  expect(screen.getByText('Question 1 sur 3')).toHaveClass('sr-only')
})

test('en anglais', () => {
  render(
    <PassageProgress ui={makeUi('en')} config={config} student={makeStudent([1, 'pending'])} />,
  )
  expect(screen.getByText('Question 2 of 3: A scored, A in progress')).toBeInTheDocument()
})
