import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import type { WriteOutcome } from '@/features/session/hooks/use-passage-actions'
import { makeUi } from '@/testing/make-ui'
import { ResetDialog } from './reset-dialog'

function renderDialog(outcome: WriteOutcome) {
  const onConfirm = vi.fn<() => Promise<WriteOutcome>>().mockResolvedValue(outcome)
  const onOpenChange = vi.fn<(open: boolean) => void>()
  render(
    <ResetDialog
      ui={makeUi()}
      studentName="Martin Zoé"
      open
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }))
  return { onConfirm, onOpenChange }
}

test('écrit : le dialogue se ferme sans alerte', async () => {
  const { onOpenChange } = renderDialog('written')

  await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('échoué : le dialogue reste ouvert avec write_error', async () => {
  const { onOpenChange } = renderDialog('failed')

  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(onOpenChange).not.toHaveBeenCalled()
})

test('écarté par le verrou : ni fermeture ni alerte, le bouton redevient cliquable', async () => {
  const { onConfirm, onOpenChange } = renderDialog('ignored')

  await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
  await act(() => Promise.resolve())
  expect(onOpenChange).not.toHaveBeenCalled()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Réinitialiser' })).toBeEnabled()
})
