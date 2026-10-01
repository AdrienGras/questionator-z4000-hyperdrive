import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { readCommentDraft, writeCommentDraft } from '@/lib/comment-draft'
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

test('suppression réussie : brouillons de commentaire de la session effacés, pas ceux des autres', async () => {
  vi.mocked(deleteSession).mockResolvedValue(undefined)
  writeCommentDraft('s1', 'student-1', 'brouillon')
  writeCommentDraft('s2', 'student-1', 'autre session')
  mount()

  fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }))

  await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  expect(readCommentDraft('s1', 'student-1')).toBeUndefined()
  expect(readCommentDraft('s2', 'student-1')).toBe('autre session')
})

test('suppression rejetée : brouillons de commentaire gardés', async () => {
  vi.mocked(deleteSession).mockRejectedValue(new Error('boom'))
  writeCommentDraft('s1', 'student-1', 'brouillon')
  mount()

  fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }))

  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(readCommentDraft('s1', 'student-1')).toBe('brouillon')
})
