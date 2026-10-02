import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import type { WriteOutcome } from '@/features/session/hooks/use-passage-actions'
import { makeUi } from '@/testing/make-ui'
import { REVEALED, screenConfig } from '@/testing/screen-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { AdjustmentDialog, type AdjustmentMode } from './adjustment-dialog'

function renderDialog(mode: AdjustmentMode, outcome: WriteOutcome) {
  const onSave = vi.fn<() => Promise<WriteOutcome>>().mockResolvedValue(outcome)
  const onCancel = vi.fn<() => Promise<WriteOutcome>>().mockResolvedValue(outcome)
  const onClose = vi.fn<() => void>()
  render(
    <AdjustmentDialog
      ui={makeUi()}
      config={screenConfig()}
      student={makeStudent([13.5], { finalRevealedAt: REVEALED })}
      open
      mode={mode}
      onSave={onSave}
      onCancel={onCancel}
      onClose={onClose}
    />,
  )
  return { onSave, onCancel, onClose }
}

const saveButton = () => screen.getByRole('button', { name: 'Enregistrer' })
const cancelButton = () => screen.getByRole('button', { name: 'Annuler' })

test('enregistrement écrit : fermeture sans alerte', async () => {
  const { onClose } = renderDialog('adjust', 'written')

  fireEvent.click(saveButton())

  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('enregistrement échoué : popup ouverte avec write_error', async () => {
  const { onClose } = renderDialog('adjust', 'failed')

  fireEvent.click(saveButton())

  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(onClose).not.toHaveBeenCalled()
})

test('enregistrement écarté par le verrou : ni fermeture ni alerte, boutons réactivés', async () => {
  const { onSave, onClose } = renderDialog('adjust', 'ignored')

  fireEvent.click(saveButton())

  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
  await act(() => Promise.resolve())
  expect(onClose).not.toHaveBeenCalled()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(saveButton()).toBeEnabled()

  // Un nouvel essai repart bien : la garde du dialogue a été relâchée.
  fireEvent.click(saveButton())
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2))
})

test('annulation de fin de passage écartée par le verrou : ni fermeture ni alerte', async () => {
  const { onCancel, onClose } = renderDialog('final', 'ignored')

  fireEvent.click(cancelButton())

  await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1))
  await act(() => Promise.resolve())
  expect(onClose).not.toHaveBeenCalled()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(cancelButton()).toBeEnabled()
})
