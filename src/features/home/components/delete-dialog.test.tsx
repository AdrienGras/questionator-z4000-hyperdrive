import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { deleteSession } from '@/lib/db/sessions'
import { makeUi } from '@/testing/make-ui'
import { DeleteDialog } from './delete-dialog'

vi.mock('@/lib/db/sessions', () => ({ deleteSession: vi.fn<(id: string) => Promise<void>>() }))

const onOpenChange = vi.fn<(open: boolean) => void>()

function mount() {
  render(
    <DeleteDialog
      ui={makeUi()}
      sessionId="s1"
      name="Oral"
      backup={{}}
      open
      onOpenChange={onOpenChange}
    />,
  )
}

beforeEach(() => {
  vi.mocked(deleteSession).mockReset()
  onOpenChange.mockReset()
})

test('suppression en cours : « Annuler » est désactivé, Échap ne ferme pas', async () => {
  vi.mocked(deleteSession).mockReturnValue(new Promise<void>(() => undefined))
  mount()
  fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled())
  fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' })
  expect(onOpenChange).not.toHaveBeenCalled()
})

test('suppression rejetée : « Annuler » est réactivé et l’erreur s’affiche', async () => {
  vi.mocked(deleteSession).mockRejectedValue(new Error('boom'))
  mount()
  fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }))
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Annuler' })).toBeEnabled()
})
