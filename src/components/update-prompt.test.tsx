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

/**
 * `PwaUpdate` neuve, démarrée avec un faux `register` ; `ready()` simule une version en attente,
 * `activate()` sa prise de contrôle depuis un autre onglet.
 */
function makeUpdate() {
  const updateSW = vi.fn<(reloadPage?: boolean) => Promise<void>>(() => Promise.resolve())
  const reload = vi.fn<() => void>()
  let needRefresh: (() => void) | undefined
  const register: RegisterSW = (options) => {
    needRefresh = options.onNeedRefresh
    return updateSW
  }
  const container = makeFakeContainer(true)
  const update = new PwaUpdate(reload)
  update.start(register, container)
  return {
    update,
    updateSW,
    reload,
    ready: () => {
      needRefresh?.()
    },
    activate: () => container.dispatchEvent(new Event('controllerchange')),
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

test('reste affichée quand la version a été activée depuis un autre onglet', () => {
  const { update, ready, activate } = makeUpdate()
  ready()
  activate()
  render(<UpdatePrompt update={update} />)
  expect(screen.getByRole('status')).toHaveTextContent('Nouvelle version disponible')
})

test('« Recharger » en activated recharge la page sans skipWaiting', () => {
  const { update, updateSW, reload, ready, activate } = makeUpdate()
  ready()
  activate()
  render(<UpdatePrompt update={update} />)
  fireEvent.click(screen.getByRole('button', { name: 'Recharger' }))
  expect(reload).toHaveBeenCalledTimes(1)
  expect(updateSW).not.toHaveBeenCalled()
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
