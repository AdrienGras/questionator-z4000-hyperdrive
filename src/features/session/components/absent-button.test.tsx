import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import type { WriteOutcome } from '@/features/session/hooks/use-passage-actions'
import { makeUi } from '@/testing/make-ui'
import { makeStudent } from '@/testing/student-fixtures'
import { AbsentButton } from './absent-button'

function confirmAbsence(outcome: WriteOutcome) {
  const onChange = vi.fn<() => Promise<WriteOutcome>>().mockResolvedValue(outcome)
  render(
    <AbsentButton
      ui={makeUi()}
      student={makeStudent([13.5])}
      disabled={false}
      onChange={onChange}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Marquer absent' }))
  fireEvent.click(screen.getByRole('button', { name: 'Déclarer absent' }))
  return onChange
}

const confirmDialog = () => screen.queryByRole('alertdialog')

test('absence écrite : le dialogue de confirmation se ferme', async () => {
  confirmAbsence('written')

  await waitFor(() => expect(confirmDialog()).not.toBeInTheDocument())
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('absence échouée : dialogue ouvert avec write_error', async () => {
  confirmAbsence('failed')

  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(confirmDialog()).toBeInTheDocument()
})

test('absence écartée par le verrou : ni fermeture ni alerte, bouton réactivé', async () => {
  const onChange = confirmAbsence('ignored')

  await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
  await act(() => Promise.resolve())
  expect(confirmDialog()).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Déclarer absent' })).toBeEnabled()
})

test('compact : icône nommée d’après l’étudiant, appel écarté sans alerte', async () => {
  const onChange = vi.fn<() => Promise<WriteOutcome>>().mockResolvedValue('ignored')
  render(
    <AbsentButton
      ui={makeUi()}
      student={makeStudent([13.5])}
      disabled={false}
      compact
      onChange={onChange}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Marquer Durand Alice absent' }))
  fireEvent.click(screen.getByRole('button', { name: 'Déclarer absent' }))

  await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
  await act(() => Promise.resolve())
  expect(confirmDialog()).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('étudiant absent : « Marquer présent » écrit tout de suite, sans dialogue', () => {
  const onChange = vi.fn<() => Promise<WriteOutcome>>().mockResolvedValue('written')
  render(
    <AbsentButton
      ui={makeUi()}
      student={makeStudent([], { absent: true })}
      disabled={false}
      onChange={onChange}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Marquer présent' }))
  expect(onChange).toHaveBeenCalledWith('student-1', false)
  expect(confirmDialog()).not.toBeInTheDocument()
})
