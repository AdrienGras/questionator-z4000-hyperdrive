import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { TextFieldDialog } from './text-field-dialog'
import { makeUi } from '@/testing/make-ui'

function mount(onSave: (value: string) => Promise<void>) {
  const onOpenChange = vi.fn<(open: boolean) => void>()
  render(
    <TextFieldDialog
      ui={makeUi()}
      open
      onOpenChange={onOpenChange}
      title="Renommer"
      label="Nom"
      initialValue="Oral"
      required
      onSave={onSave}
    />,
  )
  return onOpenChange
}

test('écriture en cours : « Annuler » est désactivé, Échap ne ferme pas', async () => {
  const onOpenChange = mount(() => new Promise<void>(() => {}))
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled())
  fireEvent.keyDown(screen.getByLabelText('Nom'), { key: 'Escape' })
  expect(onOpenChange).not.toHaveBeenCalled()
})

test('écriture rejetée : « Annuler » est réactivé et l’erreur s’affiche', async () => {
  const onOpenChange = mount(() => Promise.reject(new Error('boom')))
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Annuler' })).toBeEnabled()
  fireEvent.keyDown(screen.getByLabelText('Nom'), { key: 'Escape' })
  expect(onOpenChange).toHaveBeenCalledWith(false)
})
