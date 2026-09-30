import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { UpdatePrompt } from '@/components/update-prompt'
import type { DbStatus } from '@/lib/db/db'
import { LocaleProvider } from '@/lib/i18n/locale-context'
import { PwaUpdate, type RegisterSW } from '@/lib/pwa/pwa-update'
import { makeFakeContainer } from '@/testing/pwa-fixtures'

let dbStatus: DbStatus = 'open'
vi.mock('@/lib/db/hooks', () => ({ useDbStatus: () => dbStatus }))

beforeEach(() => {
  dbStatus = 'open'
})

/** `PwaUpdate` neuve, démarrée avec un faux `register` ; `ready()` simule l'arrivée d'une version. */
function makeUpdate() {
  const updateSW = vi.fn<(reloadPage?: boolean) => Promise<void>>(() => Promise.resolve())
  let needRefresh: (() => void) | undefined
  const register: RegisterSW = (options) => {
    needRefresh = options.onNeedRefresh
    return updateSW
  }
  const update = new PwaUpdate(() => undefined)
  update.start(register, makeFakeContainer(true))
  return {
    update,
    updateSW,
    ready: () => {
      needRefresh?.()
    },
  }
}

test("n'affiche rien tant qu'aucune version n'attend", () => {
  const { update } = makeUpdate()
  render(<UpdatePrompt update={update} />)
  expect(screen.queryByRole('status')).toBeNull()
})

test('affiche « Nouvelle version disponible » et « Recharger » quand une version attend', () => {
  const { update, ready } = makeUpdate()
  ready()
  render(<UpdatePrompt update={update} />)
  expect(screen.getByRole('status')).toHaveTextContent('Nouvelle version disponible')
  expect(screen.getByRole('button', { name: 'Recharger' })).toBeInTheDocument()
})

test("n'affiche rien quand la base est outdated (le bandeau D45 a la priorité)", () => {
  const { update, ready } = makeUpdate()
  ready()
  dbStatus = 'outdated'
  render(<UpdatePrompt update={update} />)
  expect(screen.queryByRole('status')).toBeNull()
})

test('« Recharger » appelle applyUpdate', () => {
  const { update, updateSW, ready } = makeUpdate()
  ready()
  render(<UpdatePrompt update={update} />)
  fireEvent.click(screen.getByRole('button', { name: 'Recharger' }))
  expect(updateSW).toHaveBeenCalledWith(true)
})

test('libellés anglais', () => {
  const { update, ready } = makeUpdate()
  ready()
  render(
    <LocaleProvider locale="en">
      <UpdatePrompt update={update} />
    </LocaleProvider>,
  )
  expect(screen.getByRole('status')).toHaveTextContent('New version available')
  expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument()
})
