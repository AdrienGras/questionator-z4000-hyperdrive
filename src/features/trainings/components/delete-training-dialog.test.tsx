import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { deleteTraining } from '@/lib/db/trainings'
import { makeUi } from '@/testing/make-ui'
import { DeleteTrainingDialog } from './delete-training-dialog'

vi.mock('@/lib/db/trainings', () => ({ deleteTraining: vi.fn<(id: string) => Promise<void>>() }))

const onOpenChange = vi.fn<(open: boolean) => void>()

function mount() {
  render(
    <DeleteTrainingDialog
      ui={makeUi()}
      trainingId="t1"
      name="Révisions"
      open
      onOpenChange={onOpenChange}
    />,
  )
}

beforeEach(() => {
  vi.mocked(deleteTraining).mockReset()
  onOpenChange.mockReset()
})

test('pas de bouton d’export : seulement « Annuler » et « Supprimer »', () => {
  mount()
  expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
    'Annuler',
    'Supprimer',
  ])
})

test('suppression en cours : « Annuler » est désactivé, Échap ne ferme pas', async () => {
  vi.mocked(deleteTraining).mockReturnValue(new Promise<void>(() => undefined))
  mount()
  fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled())
  fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' })
  expect(onOpenChange).not.toHaveBeenCalled()
  expect(deleteTraining).toHaveBeenCalledWith('t1')
})

test('suppression rejetée : erreur en ligne, « Annuler » réactivé, dialogue ouvert', async () => {
  vi.mocked(deleteTraining).mockRejectedValue(new Error('boom'))
  mount()
  fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }))
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Annuler' })).toBeEnabled()
  expect(onOpenChange).not.toHaveBeenCalled()
})

test('suppression réussie : le dialogue se ferme', async () => {
  vi.mocked(deleteTraining).mockResolvedValue(undefined)
  mount()
  fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }))
  await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
})
